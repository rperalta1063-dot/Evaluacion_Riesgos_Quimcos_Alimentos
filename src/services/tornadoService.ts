import { SimulationResult, TornadoItem } from '../types';
import { 
  calculatePearsonCorrelation, 
  calculateSpearmanCorrelation, 
  getPercentile, 
  normalizeConcentration, 
  normalizeConsumption 
} from './mathUtils';

export type TornadoPercentileSpan = 'p10_p90' | 'p5_p95' | 'min_max';
export type TornadoVariableFilter = 'all' | 'conc' | 'cons';
export type TornadoSortingMetric = 'swing' | 'correlation' | 'highRisk';

export interface TornadoAnalysisReport {
  items: TornadoItem[];
  filteredItems: TornadoItem[];
  baselineRisk: number;       // Deterministic median risk (% of VRT/ADI)
  baselineHQ: number;         // Deterministic median Hazard Quotient (HQ)
  baselineExposure: number;   // Deterministic median exposure in mg/(kg_bw · day)
  mcP50Risk: number;          // Probabilistic Monte Carlo Median Risk (P50)
  mcP90Risk: number;          // Probabilistic Monte Carlo P90 Risk
  mcP95Risk: number;          // Probabilistic Monte Carlo P95 Risk
  mcHQ: number;               // Probabilistic Hazard Quotient at P95
  totalSwing: number;         // Total sum of swings in % VRT
  totalSwingHQ: number;       // Total sum of swings in HQ
  topDriver: TornadoItem | null;
  concContributionPct: number;
  consContributionPct: number;
  criticalVariablesCount: number; // Variables where highRisk > 100% or highHQ > 1.0
  percentileLow: number;
  percentileHigh: number;
}

/**
 * Normalizes raw concentration sample value to standard mg/kg,
 * incorporating Limit of Detection (LOD) handling and processing factors.
 */
function getNormalizedConc(rawConc: number, food: any): number {
  let norm = normalizeConcentration(rawConc, food.concentrationUnit);
  if (food.lod !== undefined && norm < normalizeConcentration(food.lod, food.concentrationUnit)) {
    const normLod = normalizeConcentration(food.lod, food.concentrationUnit);
    if (food.censoredMethod === 'zero') norm = 0;
    else if (food.censoredMethod === 'lod_half') norm = normLod / 2;
    else if (food.censoredMethod === 'lod') norm = normLod;
  }
  if (food.processingFactor !== undefined && food.processingFactor !== 1) {
    norm *= food.processingFactor;
  }
  return norm;
}

/**
 * Normalizes food consumption to standard kg/day (or L/day) per person
 * to guarantee dimensional coherence:
 * Exposure (mg / kg_bw · day) = [Conc (mg/kg) * Cons (kg/day)] / BW (kg)
 */
function getNormalizedCons(rawCons: number, food: any): number {
  return normalizeConsumption(rawCons, food.consumptionUnit);
}

/**
 * Computes food preparation reduction factor multiplier (e.g. washing, peeling, cooking).
 */
function getReductionMultiplier(food: any): number {
  if (food.hasReduction && food.reductionEff > 0) {
    const prob = (food.reductionProb ?? 100) / 100;
    const eff = (food.reductionEff ?? 0) / 100;
    return Math.max(0, 1 - (prob * eff));
  }
  return 1;
}

/**
 * Computes daily dietary chemical exposure for a specific food:
 * Exposure = (Conc_norm * Cons_norm / BW) * ReductionMultiplier
 */
function calculateFoodExposure(normConc: number, normCons: number, bw: number, food: any): number {
  const red = getReductionMultiplier(food);
  return ((normConc * normCons) / bw) * red;
}

export function computeTornadoAnalysis(
  results: SimulationResult | null,
  span: TornadoPercentileSpan = 'p10_p90',
  filter: TornadoVariableFilter = 'all',
  sorting: TornadoSortingMetric = 'swing',
  language: 'es' | 'en' | 'fr' = 'es'
): TornadoAnalysisReport {
  if (!results || !results.simulationData || !results.simulationData.foodInputs || results.simulationData.foodInputs.length === 0) {
    return {
      items: [],
      filteredItems: [],
      baselineRisk: 0,
      baselineHQ: 0,
      baselineExposure: 0,
      mcP50Risk: 0,
      mcP90Risk: 0,
      mcP95Risk: 0,
      mcHQ: 0,
      totalSwing: 0,
      totalSwingHQ: 0,
      topDriver: null,
      concContributionPct: 0,
      consContributionPct: 0,
      criticalVariablesCount: 0,
      percentileLow: 10,
      percentileHigh: 90
    };
  }

  const { foodInputs, totalExposureSamples, bodyWeightSamples } = results.simulationData;
  const normalizedRefValue = results.normalizedRefValue || 1;
  const n = totalExposureSamples.length;

  let pLow = 10;
  let pHigh = 90;
  if (span === 'p5_p95') {
    pLow = 5;
    pHigh = 95;
  } else if (span === 'min_max') {
    pLow = 0;
    pHigh = 100;
  }

  // Calculate body weight baseline (P50 median)
  const bwSorted = new Float64Array(bodyWeightSamples).sort();
  const baseBW = getPercentile(bwSorted, 50, true) || 70;

  // Precompute food baselines and sorted sample copies for percentiles
  interface FoodPrepared {
    id: string;
    name: string;
    concSorted: Float64Array;
    consSorted: Float64Array;
    baseConc: number;        // Raw input value in user unit (e.g. mg/kg)
    baseCons: number;        // Raw input value in user unit (e.g. g/día)
    baseNormConc: number;    // Normalized to mg/kg
    baseNormCons: number;    // Normalized to kg/day
    baseFoodExposure: number;// Food exposure in mg/(kg_bw · day)
    concRaw: number[];
    consRaw: number[];
    concentrationUnit: string;
    consumptionUnit: string;
    foodMeta: any;
  }

  const preparedFoods: FoodPrepared[] = foodInputs.map(f => {
    const concSorted = new Float64Array(f.concSamples).sort();
    const consSorted = new Float64Array(f.consSamples).sort();
    const baseConc = getPercentile(concSorted, 50, true);
    const baseCons = getPercentile(consSorted, 50, true);
    const concentrationUnit = f.concentrationUnit || 'mg/kg';
    const consumptionUnit = f.consumptionUnit || 'g/día';
    const baseNormConc = getNormalizedConc(baseConc, f);
    const baseNormCons = getNormalizedCons(baseCons, f);
    const baseFoodExposure = calculateFoodExposure(baseNormConc, baseNormCons, baseBW, f);

    return {
      id: f.id || f.name,
      name: f.name,
      concSorted,
      consSorted,
      baseConc,
      baseCons,
      baseNormConc,
      baseNormCons,
      baseFoodExposure,
      concRaw: f.concSamples,
      consRaw: f.consSamples,
      concentrationUnit,
      consumptionUnit,
      foodMeta: f
    };
  });

  // Total baseline exposure across all foods in dietary model
  const totalBaseExposure = preparedFoods.reduce((sum, f) => sum + f.baseFoodExposure, 0);
  const baselineRisk = normalizedRefValue > 0 ? (totalBaseExposure / normalizedRefValue) * 100 : 0;
  const baselineHQ = normalizedRefValue > 0 ? totalBaseExposure / normalizedRefValue : 0;

  const labels = {
    es: { conc: 'Concentración', cons: 'Consumo', bw: 'Peso Corporal' },
    en: { conc: 'Concentration', cons: 'Consumption', bw: 'Body Weight' },
    fr: { conc: 'Concentration', cons: 'Consommation', bw: 'Poids Corporel' }
  }[language];

  // Precompute total risk array for correlation calculations
  const totalRiskArray = results.riskDistribution && results.riskDistribution.length === n
    ? results.riskDistribution
    : totalExposureSamples.map(exp => (normalizedRefValue > 0 ? (exp / normalizedRefValue) * 100 : 0));

  const items: TornadoItem[] = [];

  preparedFoods.forEach(food => {
    const otherFoodsBaseExposure = totalBaseExposure - food.baseFoodExposure;

    // 1. CONCENTRATION VARIABLE
    const lowConc = getPercentile(food.concSorted, pLow, true);
    const highConc = getPercentile(food.concSorted, pHigh, true);
    const lowNormConc = getNormalizedConc(lowConc, food.foodMeta);
    const highNormConc = getNormalizedConc(highConc, food.foodMeta);

    const expConcLow = otherFoodsBaseExposure + calculateFoodExposure(lowNormConc, food.baseNormCons, baseBW, food.foodMeta);
    const expConcHigh = otherFoodsBaseExposure + calculateFoodExposure(highNormConc, food.baseNormCons, baseBW, food.foodMeta);

    const riskConcLow = normalizedRefValue > 0 ? (expConcLow / normalizedRefValue) * 100 : 0;
    const riskConcHigh = normalizedRefValue > 0 ? (expConcHigh / normalizedRefValue) * 100 : 0;
    const hqConcLow = normalizedRefValue > 0 ? expConcLow / normalizedRefValue : 0;
    const hqConcHigh = normalizedRefValue > 0 ? expConcHigh / normalizedRefValue : 0;
    const swingConc = Math.abs(riskConcHigh - riskConcLow);
    const swingConcHQ = Math.abs(hqConcHigh - hqConcLow);

    const pearsonConc = calculatePearsonCorrelation(food.concRaw, totalRiskArray);
    const spearmanConc = calculateSpearmanCorrelation(food.concRaw, totalRiskArray);

    const minRiskConc = Math.min(riskConcLow, riskConcHigh);
    const maxRiskConc = Math.max(riskConcLow, riskConcHigh);
    const minHQConc = Math.min(hqConcLow, hqConcHigh);
    const maxHQConc = Math.max(hqConcLow, hqConcHigh);

    items.push({
      id: `${food.id}-conc`,
      foodName: food.name,
      variableType: 'conc',
      displayName: `${food.name} — ${labels.conc}`,
      unit: food.concentrationUnit,
      baseVal: food.baseConc,
      lowVal: lowConc,
      highVal: highConc,
      baseRisk: baselineRisk,
      lowRisk: minRiskConc,
      highRisk: maxRiskConc,
      swing: swingConc,
      deltaDown: minRiskConc - baselineRisk,
      deltaUp: maxRiskConc - baselineRisk,
      baseHQ: baselineHQ,
      lowHQ: minHQConc,
      highHQ: maxHQConc,
      swingHQ: swingConcHQ,
      deltaDownHQ: minHQConc - baselineHQ,
      deltaUpHQ: maxHQConc - baselineHQ,
      swingPercentage: 0,
      pearson: pearsonConc,
      spearman: spearmanConc,
      rank: 0,
      isHighRisk: maxRiskConc > 100 || maxHQConc > 1.0
    });

    // 2. CONSUMPTION VARIABLE
    const lowCons = getPercentile(food.consSorted, pLow, true);
    const highCons = getPercentile(food.consSorted, pHigh, true);
    const lowNormCons = getNormalizedCons(lowCons, food.foodMeta);
    const highNormCons = getNormalizedCons(highCons, food.foodMeta);

    const expConsLow = otherFoodsBaseExposure + calculateFoodExposure(food.baseNormConc, lowNormCons, baseBW, food.foodMeta);
    const expConsHigh = otherFoodsBaseExposure + calculateFoodExposure(food.baseNormConc, highNormCons, baseBW, food.foodMeta);

    const riskConsLow = normalizedRefValue > 0 ? (expConsLow / normalizedRefValue) * 100 : 0;
    const riskConsHigh = normalizedRefValue > 0 ? (expConsHigh / normalizedRefValue) * 100 : 0;
    const hqConsLow = normalizedRefValue > 0 ? expConsLow / normalizedRefValue : 0;
    const hqConsHigh = normalizedRefValue > 0 ? expConsHigh / normalizedRefValue : 0;
    const swingCons = Math.abs(riskConsHigh - riskConsLow);
    const swingConsHQ = Math.abs(hqConsHigh - hqConsLow);

    const pearsonCons = calculatePearsonCorrelation(food.consRaw, totalRiskArray);
    const spearmanCons = calculateSpearmanCorrelation(food.consRaw, totalRiskArray);

    const minRiskCons = Math.min(riskConsLow, riskConsHigh);
    const maxRiskCons = Math.max(riskConsLow, riskConsHigh);
    const minHQCons = Math.min(hqConsLow, hqConsHigh);
    const maxHQCons = Math.max(hqConsLow, hqConsHigh);

    items.push({
      id: `${food.id}-cons`,
      foodName: food.name,
      variableType: 'cons',
      displayName: `${food.name} — ${labels.cons}`,
      unit: food.consumptionUnit, // Real unit: g/día, g/persona/día, mL/día, etc.
      baseVal: food.baseCons,     // Real value in that unit: e.g. 149.44 g/día
      lowVal: lowCons,            // Real value in that unit: e.g. 111.02 g/día
      highVal: highCons,          // Real value in that unit: e.g. 187.86 g/día
      baseRisk: baselineRisk,
      lowRisk: minRiskCons,
      highRisk: maxRiskCons,
      swing: swingCons,
      deltaDown: minRiskCons - baselineRisk,
      deltaUp: maxRiskCons - baselineRisk,
      baseHQ: baselineHQ,
      lowHQ: minHQCons,
      highHQ: maxHQCons,
      swingHQ: swingConsHQ,
      deltaDownHQ: minHQCons - baselineHQ,
      deltaUpHQ: maxHQCons - baselineHQ,
      swingPercentage: 0,
      pearson: pearsonCons,
      spearman: spearmanCons,
      rank: 0,
      isHighRisk: maxRiskCons > 100 || maxHQCons > 1.0
    });
  });

  // Calculate total swing sum to assign relative percentages
  const totalSwing = items.reduce((sum, item) => sum + item.swing, 0);
  const totalSwingHQ = items.reduce((sum, item) => sum + item.swingHQ, 0);
  items.forEach(item => {
    item.swingPercentage = totalSwing > 0 ? (item.swing / totalSwing) * 100 : 0;
  });

  // Concentration vs Consumption balance using normalized deltas
  const concSwingSum = items.filter(i => i.variableType === 'conc').reduce((sum, i) => sum + i.swing, 0);
  const consSwingSum = items.filter(i => i.variableType === 'cons').reduce((sum, i) => sum + i.swing, 0);
  const totalVarSwing = concSwingSum + consSwingSum;
  const concContributionPct = totalVarSwing > 0 ? (concSwingSum / totalVarSwing) * 100 : 50;
  const consContributionPct = totalVarSwing > 0 ? (consSwingSum / totalVarSwing) * 100 : 50;

  // Sorting
  items.sort((a, b) => {
    if (sorting === 'correlation') {
      return Math.abs(b.pearson) - Math.abs(a.pearson);
    }
    if (sorting === 'highRisk') {
      return b.highRisk - a.highRisk;
    }
    return b.swing - a.swing;
  });

  // Assign overall ranks
  items.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Filter items
  const filteredItems = items.filter(item => {
    if (filter === 'conc') return item.variableType === 'conc';
    if (filter === 'cons') return item.variableType === 'cons';
    return true;
  });

  const topDriver = items.length > 0 ? items[0] : null;
  const criticalVariablesCount = items.filter(i => i.isHighRisk).length;

  // Extract Monte Carlo probabilistic distribution percentiles for statistical coherence
  const mcP50Risk = results.riskStats?.median ?? 0;
  const mcP90Risk = results.riskStats?.p90 ?? 0;
  const mcP95Risk = results.riskStats?.p95 ?? 0;
  const mcHQ = results.riskStats?.hazardQuotient ?? (mcP95Risk / 100);

  return {
    items,
    filteredItems,
    baselineRisk,
    baselineHQ,
    baselineExposure: totalBaseExposure,
    mcP50Risk,
    mcP90Risk,
    mcP95Risk,
    mcHQ,
    totalSwing,
    totalSwingHQ,
    topDriver,
    concContributionPct,
    consContributionPct,
    criticalVariablesCount,
    percentileLow: pLow,
    percentileHigh: pHigh
  };
}
