
import { FoodItem, SimulationResult, SimulationStats, UncertaintyStats, Contribution, DistributionParams, PoD } from '../types';
import { getSample, induceRankCorrelation, normalizeConcentration, normalizeConsumption } from './mathUtils';
import { 
  PRELOADED_PODS, 
  getDefaultPoDKeyForChemical, 
  isCarcinogenicOrNonThresholdChemical 
} from './podRiskService';

function normalizeUnit(value: number, unit: string, type: 'concentration' | 'consumption' | 'exposure'): number {
  if (type === 'concentration') {
    return normalizeConcentration(value, unit);
  }
  if (type === 'consumption') {
    return normalizeConsumption(value, unit);
  }
  if (type === 'exposure') {
    return (unit === 'μg/kg·día' || unit === 'ug/kg·día' || unit === 'μg/kg/día') ? value * 0.001 : value;
  }
  return value;
}

/**
 * Performs bootstrapping to estimate uncertainty (Confidence Intervals)
 * for the Mean and the 95th Percentile using non-parametric resampling.
 */
async function calculateUncertainty(
  distribution: number[],
  bootstrapCount: number = 200,
  confidenceLevel: number = 0.95,
  onProgress?: (p: number) => void
): Promise<UncertaintyStats> {
  const n = distribution.length;
  const bootstrapMeans: number[] = [];
  const bootstrapP95s: number[] = [];

  // Subset for speed if n is very large, keeping it representative for bootstrap
  const maxN = 50000;
  const dataForBootstrap = n > maxN 
    ? Array.from({ length: maxN }, () => distribution[Math.floor(Math.random() * n)])
    : distribution;
  const sampleN = dataForBootstrap.length;

  const chunkSize = 20; 
  for (let b = 0; b < bootstrapCount; b++) {
    if (b % chunkSize === 0 && onProgress) {
      onProgress(Math.floor((b / bootstrapCount) * 100));
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    let sum = 0;
    const resampled: number[] = new Array(sampleN);
    for (let i = 0; i < sampleN; i++) {
      const val = dataForBootstrap[Math.floor(Math.random() * sampleN)];
      resampled[i] = val;
      sum += val;
    }
    bootstrapMeans.push(sum / sampleN);
    
    // Calculate P95 for this bootstrap sample
    resampled.sort((a, b) => a - b);
    const p95Idx = Math.floor(sampleN * 0.95);
    bootstrapP95s.push(resampled[Math.min(sampleN - 1, p95Idx)]);
  }

  if (onProgress) onProgress(100);

  bootstrapMeans.sort((a, b) => a - b);
  bootstrapP95s.sort((a, b) => a - b);

  const alpha = 1 - confidenceLevel;
  const lowIdx = Math.floor(bootstrapCount * (alpha / 2));
  const highIdx = Math.floor(bootstrapCount * (1 - alpha / 2));

  return {
    meanCI: [bootstrapMeans[lowIdx], bootstrapMeans[highIdx]],
    p95CI: [bootstrapP95s[lowIdx], bootstrapP95s[highIdx]],
    bootstrapCount,
    confidenceLevel
  };
}

export async function runSimulation(
  iterations: number,
  refValue: number,
  refUnit: string,
  refValueType: 'adi' | 'bmdl',
  bodyWeightParams: DistributionParams,
  foodItems: FoodItem[],
  isExpert: boolean,
  bwKey: string,
  confidenceLevel: number = 0.95,
  onProgress?: (phase: 'main' | 'bootstrap', p: number) => void,
  pod?: PoD,
  chemicalKey?: string
): Promise<SimulationResult> {
  // Pre-simulation validation: Enforce PoD/BMDL model for non-threshold carcinogens
  let effectiveRefValueType = refValueType;
  let effectiveRefValue = refValue;
  let effectiveRefUnit = refUnit;
  let effectivePod = pod;

  const resolvedChemicalKey = chemicalKey || pod?.chemicalKey;
  if (resolvedChemicalKey && isCarcinogenicOrNonThresholdChemical(resolvedChemicalKey)) {
    // Carcinogens without biological threshold (e.g., Aflatoxins, Arsenic, Acrylamide)
    // CANNOT use ADI according to EFSA, JECFA, and WHO toxicological risk assessment principles.
    if (effectiveRefValueType !== 'bmdl') {
      console.warn(
        `[Toxicological Validation] Sustancia sin umbral '${resolvedChemicalKey}' configurada con ADI. Forzando modelo PoD/BMDL.`
      );
      effectiveRefValueType = 'bmdl';
    }

    // Ensure the correct PoD parameters are linked to the specific chemical
    if (!effectivePod || effectivePod.chemicalKey !== resolvedChemicalKey) {
      const defaultKey = getDefaultPoDKeyForChemical(resolvedChemicalKey);
      effectivePod = PRELOADED_PODS[defaultKey] || effectivePod;
      if (effectivePod) {
        effectiveRefValue = effectivePod.valor;
        effectiveRefUnit = 'μg/kg·día';
      }
    }
  } else if (resolvedChemicalKey && resolvedChemicalKey !== 'custom' && !isCarcinogenicOrNonThresholdChemical(resolvedChemicalKey)) {
    // Non-carcinogenic substances (e.g. Chlorpyrifos, Deltamethrin, etc.) MUST use ADI and NEVER BMDL
    if (effectiveRefValueType === 'bmdl') {
      console.warn(`[Toxicological Validation] Sustancia no carcinogénica '${resolvedChemicalKey}' forzada a modelo ADI.`);
      effectiveRefValueType = 'adi';
      effectivePod = undefined;
    }
  }

  const normalizedRefValue = effectiveRefUnit === 'μg/kg·día' ? effectiveRefValue * 0.001 : effectiveRefValue;
  const totalExposureSamples = new Array(iterations).fill(0);
  const foodExposures = foodItems.map(() => new Array(iterations).fill(0));
  const foodInputs: NonNullable<SimulationResult['simulationData']>['foodInputs'] = [];

  // Pre-generate body weight samples for all iterations
  const bodyWeightSamples = new Array(iterations);
  
  // Truncation logic for body weight based on category
  let minBW = 0.1;
  if (bwKey === 'adult_male') minBW = 45;
  else if (bwKey === 'adult_female') minBW = 40;
  else if (bwKey === 'child_1_3') minBW = 0.5;
  else if (bwKey === 'child_4_8') minBW = 3;
  else if (bwKey === 'child_9_13') minBW = 8;
  else if (bwKey === 'child_14_18') minBW = 13;

  for (let i = 0; i < iterations; i++) {
    bodyWeightSamples[i] = Math.max(minBW, getSample(bodyWeightParams));
  }

  // Pre-generate raw samples for all foods
  for (let fIdx = 0; fIdx < foodItems.length; fIdx++) {
    const food = foodItems[fIdx];
    let concSamples = new Array(iterations);
    let consSamples = new Array(iterations);
    
    // Sampling loop
    for (let i = 0; i < iterations; i++) {
        concSamples[i] = getSample(food.concentration);
        consSamples[i] = getSample(food.consumption);
    }

    // Apply Rank Correlation if specified
    if (food.correlation !== 0) {
        const correlated = induceRankCorrelation(concSamples, consSamples, food.correlation);
        concSamples = correlated.correlatedA;
        consSamples = correlated.correlatedB;
    }

    foodInputs.push({ 
      id: food.id, 
      name: food.name, 
      concSamples, 
      consSamples,
      concentrationUnit: food.concentrationUnit || 'mg/kg',
      consumptionUnit: food.consumptionUnit || 'g/día',
      processingFactor: food.processingFactor,
      hasReduction: food.hasReduction,
      reductionProb: food.reductionProb,
      reductionEff: food.reductionEff,
      lod: food.lod,
      loq: food.loq,
      censoredMethod: food.censoredMethod
    });

    // Calculate exposures for this food across all iterations
    const chunkSize = Math.max(5000, Math.floor(iterations / 10));
    for (let i = 0; i < iterations; i++) {
      if (i % chunkSize === 0 && onProgress) {
        // Progress based on total food items and iterations
        const progress = ((fIdx * iterations + i) / (foodItems.length * iterations)) * 100;
        onProgress('main', Math.floor(progress));
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const normConcValue = normalizeUnit(concSamples[i], food.concentrationUnit, 'concentration');
      const normCons = normalizeUnit(consSamples[i], food.consumptionUnit, 'consumption');
      
      let normConc = normConcValue;

      // Censored Data Handling (LOD/LOQ)
      if (food.lod !== undefined && normConc < normalizeUnit(food.lod, food.concentrationUnit, 'concentration')) {
        const normLod = normalizeUnit(food.lod, food.concentrationUnit, 'concentration');
        if (food.censoredMethod === 'zero') normConc = 0;
        else if (food.censoredMethod === 'lod_half') normConc = normLod / 2;
        else if (food.censoredMethod === 'lod') normConc = normLod;
      }

      // Apply Processing Factor
      if (food.processingFactor !== undefined && food.processingFactor !== 1) {
        normConc *= food.processingFactor;
      }
      
      let exposure = (normConc * normCons) / bodyWeightSamples[i];
      
      // Apply Probabilistic Reduction Factor
      if (food.hasReduction) {
        if (Math.random() < (food.reductionProb / 100)) {
          exposure *= (1 - (food.reductionEff / 100));
        }
      }
      
      foodExposures[fIdx][i] = exposure;
      totalExposureSamples[i] += exposure;
    }
  }

  if (onProgress) onProgress('main', 100);

  const totalMeanExposure = totalExposureSamples.reduce((a, b) => a + b, 0) / iterations;
  const meanContributions = foodItems.map((food, index) => {
    const foodMean = foodExposures[index].reduce((a, b) => a + b, 0) / iterations;
    return {
      id: food.id,
      name: food.name,
      exposure: foodMean,
      percentage: totalMeanExposure > 0 ? (foodMean / totalMeanExposure) * 100 : 0
    };
  });

  const riskResults = totalExposureSamples.map(exp => (normalizedRefValue > 0 ? (exp / normalizedRefValue) * 100 : Infinity));
  const sortedRisks = new Float64Array(riskResults).sort();
  const sum = riskResults.reduce((a, b) => a + b, 0);
  const mean = sum / iterations;
  
  let sumSqDiff = 0;
  let sumCubeDiff = 0;
  let sumQuadDiff = 0;
  let exceedanceCount = 0;
  let bmdlConcernCount = 0; // Iterations with MOE < 10,000 (i.e. exposure > 0.01% of BMDL10)
  for (let i = 0; i < iterations; i++) {
    const val = riskResults[i];
    if (Number.isFinite(val)) {
      const diff = val - mean;
      const diffSq = diff * diff;
      sumSqDiff += diffSq;
      sumCubeDiff += diffSq * diff;
      sumQuadDiff += diffSq * diffSq;
      if (val > 100) exceedanceCount++;
      // For BMDL10, safety threshold is MOE >= 10,000, meaning exposure <= 0.01% of BMDL10
      if (effectiveRefValueType === 'bmdl') {
        if (val > 0.01) bmdlConcernCount++;
      }
    }
  }
  
  const stdDev = Math.sqrt(sumSqDiff / iterations);
  let skewness = 0;
  let kurtosis = 0;
  if (stdDev > 0) {
    skewness = (sumCubeDiff / iterations) / Math.pow(stdDev, 3);
    kurtosis = (sumQuadDiff / iterations) / Math.pow(stdDev, 4) - 3;
  }

  const getP = (p: number) => {
    const idx = Math.floor(iterations * (p / 100));
    return sortedRisks[Math.min(iterations - 1, idx)];
  };

  const p95Exposure = (getP(95) / 100) * normalizedRefValue;

  const riskStats: SimulationStats = {
    mean,
    stdDev,
    cv: mean > 0 ? (stdDev / mean) * 100 : 0,
    median: getP(50),
    min: sortedRisks[0],
    max: sortedRisks[iterations - 1],
    iqr: getP(75) - getP(25),
    skewness,
    kurtosis,
    p5: getP(5),
    p25: getP(25),
    p75: getP(75),
    p90: getP(90),
    p95: getP(95),
    p975: getP(97.5),
    p99: getP(99),
    p999: getP(99.9),
    exceedanceProb: (exceedanceCount / iterations) * 100,
    bmdlConcernProb: effectiveRefValueType === 'bmdl' ? (bmdlConcernCount / iterations) * 100 : undefined,
    moeMean: effectiveRefValueType === 'bmdl' && mean > 0 ? Math.round(100 / mean) : undefined,
    moeP95: effectiveRefValueType === 'bmdl' && getP(95) > 0 ? Math.round(100 / getP(95)) : undefined,
    marginOfSafety: p95Exposure > 0 ? normalizedRefValue / p95Exposure : undefined,
    hazardQuotient: normalizedRefValue > 0 ? p95Exposure / normalizedRefValue : undefined
  };

  let uncertainty = undefined;
  if (isExpert) {
    uncertainty = await calculateUncertainty(riskResults, 200, confidenceLevel, (p) => {
      if (onProgress) onProgress('bootstrap', p);
    });
  }

  // Post-simulation validation check: ensure non-threshold carcinogen did not produce ADI result
  if (resolvedChemicalKey && isCarcinogenicOrNonThresholdChemical(resolvedChemicalKey)) {
    if (effectiveRefValueType !== 'bmdl' || !effectivePod) {
      throw new Error(
        `Error de validación post-simulación: La sustancia carcinogénica ${resolvedChemicalKey} debe evaluarse obligatoriamente con el modelo PoD/BMDL.`
      );
    }
  }

  return {
    riskStats,
    riskDistribution: riskResults, 
    uncertainty,
    meanContributions,
    normalizedRefValue,
    originalRefValue: effectiveRefValue,
    originalRefUnit: effectiveRefUnit,
    refValueType: effectiveRefValueType,
    pod: effectivePod,
    isExpert,
    simulationData: { totalExposureSamples, foodInputs, bodyWeightSamples, foodExposureSamples: foodExposures }
  };
}
