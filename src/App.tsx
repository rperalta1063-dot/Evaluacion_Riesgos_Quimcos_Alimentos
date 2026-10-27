
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PREDEFINED_CHEMICALS, BODY_WEIGHT_PRESETS, PREDEFINED_FOOD_DATA, REDUCTION_TOOLTIPS } from './constants';
import { FoodItem, DistributionType, DistributionParams, SimulationResult, Language, UncertaintyStats, SimulationStats, PoD, PoDOrigin } from './types';
import { 
  PRELOADED_PODS, 
  getDefaultPoDKeyForChemical, 
  isCarcinogenicOrNonThresholdChemical, 
  getPoDPresetsGrouped 
} from './services/podRiskService';
import DistributionInput from './components/DistributionInput';
import ResultsPanel from './components/ResultsPanel';
import UserManual from './components/UserManual';
import { runSimulation } from './services/simulationService';
import { validateDistribution } from './services/mathUtils';
import { TRANSLATIONS } from './locales';
import { jsPDF } from 'jspdf';
import { 
  Beaker, 
  Globe, 
  FileText, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  TableProperties, 
  ClipboardList, 
  Calculator, 
  Trash2, 
  Info, 
  ChevronDown, 
  BookOpen,
  ShieldCheck,
  Zap,
  Lightbulb
} from 'lucide-react';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [activeTab, setActiveTab] = useState<'simulation' | 'table' | 'form' | 'recommendations'>('simulation');
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const t = TRANSLATIONS[language];

  // General Params
  const [chemicalKey, setChemicalKey] = useState('custom');
  const selectedChemical = chemicalKey !== 'custom' ? PREDEFINED_CHEMICALS[chemicalKey] : null;
  const [customChemicalName, setCustomChemicalName] = useState('');
  const [customChemicalSource, setCustomChemicalSource] = useState('');
  const [adi, setAdi] = useState<string>('');
  const [adiUnit, setAdiUnit] = useState('mg/kg·día');
  const [refValueType, setRefValueType] = useState<'adi' | 'bmdl'>('adi');

  // PoD (Point of Departure) Structured Data Model
  const [selectedPodPreset, setSelectedPodPreset] = useState<string>('efsa_2024');
  const [podValor, setPodValor] = useState<string>('0.06');
  const [podUnidad, setPodUnidad] = useState<string>('µg/kg pc/día');
  const [podTipoBMR, setPodTipoBMR] = useState<string>('BMDL05');
  const [podOrigenDatos, setPodOrigenDatos] = useState<PoDOrigin>('humano_epidemiologico');
  const [podEfectoCritico, setPodEfectoCritico] = useState<string>('cáncer de piel');
  const [podOrganismoAño, setPodOrganismoAño] = useState<string>('EFSA 2024');
  const [podReferencia, setPodReferencia] = useState<string>('EFSA CONTAM Panel, EFSA Journal 2024;22:e8488, doi:10.2903/j.efsa.2024.8488');
  const [bwKey, setBwKey] = useState('adult_male');
  const [bwDistType, setBwDistType] = useState<DistributionType>('deterministic');
  const [bwParams, setBwParams] = useState<DistributionParams>({ type: 'deterministic', value: 75 });
  const [iterations, setIterations] = useState<string>('10000');
  const [numSimulations, setNumSimulations] = useState<string>('1');
  const [confidenceLevel, setConfidenceLevel] = useState<string>('95');
  
  // Food Management
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [currentFoodName, setCurrentFoodName] = useState('');
  const [currentFoodSelect, setCurrentFoodSelect] = useState('custom');
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  
  // Distribution Inputs for new Food
  const [concDistType, setConcDistType] = useState<DistributionType>('triangular');
  const [concParams, setConcParams] = useState<DistributionParams>({ type: 'triangular' });
  const [concUnit, setConcUnit] = useState('mg/kg');
  
  const [consDistType, setConsDistType] = useState<DistributionType>('triangular');
  const [consParams, setConsParams] = useState<DistributionParams>({ type: 'triangular' });
  const [consUnit, setConsUnit] = useState('g/día');
  
  const [correlation, setCorrelation] = useState(0);

  // Reduction Factor
  const [hasReduction, setHasReduction] = useState(false);
  const [reductionName, setReductionName] = useState('');
  const [reductionProb, setReductionProb] = useState<string>('100');
  const [reductionEff, setReductionEff] = useState<string>('0');
  
  // Expert Parameters State
  const [lod, setLod] = useState<string>('');
  const [loq, setLoq] = useState<string>('');
  const [censoredMethod, setCensoredMethod] = useState<'zero' | 'lod_half' | 'lod'>('lod_half');
  const [processingFactor, setProcessingFactor] = useState<string>('');
  
  // Progress tracking
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcProgress, setCalcProgress] = useState(0);
  const [calcPhase, setCalcPhase] = useState<'main' | 'bootstrap'>('main');

  // Results
  const [results, setResults] = useState<SimulationResult | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  const { specific: specificPods, others: otherPods } = useMemo(
    () => getPoDPresetsGrouped(chemicalKey),
    [chemicalKey]
  );
  const currentChemDisplayName = PREDEFINED_CHEMICALS[chemicalKey]?.name || (chemicalKey === 'arsenic' ? 'Arsénico inorgánico' : customChemicalName || chemicalKey);
  const isCarcinogen = isCarcinogenicOrNonThresholdChemical(chemicalKey);

  const handlePodPresetChange = (presetKey: string) => {
    setSelectedPodPreset(presetKey);
    const p = PRELOADED_PODS[presetKey];
    if (p) {
      setPodValor(p.valor.toString());
      setPodUnidad(p.unidad);
      setPodTipoBMR(p.tipo_BMR);
      setPodOrigenDatos(p.origen_datos);
      setPodEfectoCritico(p.efecto_critico);
      setPodOrganismoAño(p.organismo_y_año);
      setPodReferencia(p.referencia_bibliografica);
      setAdi(p.valor.toString());
      setAdiUnit('μg/kg·día');
    }
  };

  const handleChemicalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setChemicalKey(val);
    if (isCarcinogenicOrNonThresholdChemical(val)) {
      // Non-threshold carcinogens (Aflatoxin B1, Inorganic Arsenic, Acrylamide)
      // must use BMDL / Margin of Exposure (MOE) model per EFSA / JECFA
      setRefValueType('bmdl');
      const podKey = getDefaultPoDKeyForChemical(val);
      handlePodPresetChange(podKey);
      setCustomChemicalName('');
      setCustomChemicalSource('');
    } else if (PREDEFINED_CHEMICALS[val]) {
      setRefValueType('adi');
      setAdi(PREDEFINED_CHEMICALS[val].adi.toString());
      setAdiUnit(PREDEFINED_CHEMICALS[val].unit);
      setCustomChemicalName('');
      setCustomChemicalSource('');
    } else if (val === 'custom') {
      setRefValueType('adi');
      setAdi('');
      setCustomChemicalName('');
      setCustomChemicalSource('');
    }
  };

  const handleBwChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBwKey(val);
    if (BODY_WEIGHT_PRESETS[val]) {
      const weight = BODY_WEIGHT_PRESETS[val]!;
      setBwDistType('deterministic');
      setBwParams({ type: 'deterministic', value: weight });
    }
  };

  const handleFoodSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCurrentFoodSelect(val);
    
    if (val === 'custom') {
      setCurrentFoodName('');
      setHasReduction(false);
      setReductionName('');
      setReductionProb('100');
      setReductionEff('0');
    } else {
      const preset = PREDEFINED_FOOD_DATA[val];
      if (preset) {
        setConcDistType(preset.concentration.type);
        setConcParams(preset.concentration);
        setConcUnit(preset.concentrationUnit);
        
        setConsDistType(preset.consumption.type);
        setConsParams(preset.consumption);
        setConsUnit(preset.consumptionUnit);

        if (preset.reduction) {
          setHasReduction(true);
          setReductionName(preset.reduction.name);
          setReductionProb(preset.reduction.prob.toString());
          setReductionEff(preset.reduction.eff.toString());
        } else {
          setHasReduction(false);
          setReductionName('');
          setReductionProb('100');
          setReductionEff('0');
        }
      }
    }
  };

  const getAdiError = () => {
    if (!adi) return null; 
    const val = parseFloat(adi);
    if (isNaN(val) || val <= 0) return t.validation.positive;
    return null;
  };

  const getBodyWeightError = () => {
    const distError = validateDistribution(bwDistType, bwParams);
    if (distError) return t.validation[distError as keyof typeof t.validation] || distError;
    
    let minBW = 0.1;
    if (bwKey === 'adult_male') minBW = 45;
    else if (bwKey === 'adult_female') minBW = 40;
    else if (bwKey === 'child_1_3') minBW = 0.5;
    else if (bwKey === 'child_4_8') minBW = 3;
    else if (bwKey === 'child_9_13') minBW = 8;
    else if (bwKey === 'child_14_18') minBW = 13;

    if (bwDistType === 'deterministic' && bwParams.value !== undefined) {
      if (bwParams.value < minBW || bwParams.value > 600) {
        return t.validation.rangeBW.replace('{min}', minBW.toString());
      }
    }
    return null;
  };

  const getIterationsError = () => {
    if (!iterations) return null;
    const val = parseInt(iterations);
    if (isNaN(val) || val < 1000 || val > 1000000) return t.validation.rangeIter;
    return null;
  };

  const adiError = getAdiError();
  const bwError = getBodyWeightError();
  const iterError = getIterationsError();

  const getNumSimulationsError = () => {
    const val = parseInt(numSimulations);
    if (isNaN(val) || val < 1 || val > 100) return true;
    return null;
  };

  const isFormValid = () => {
    // Toxicological Rule: Non-threshold carcinogens cannot use ADI
    if (isCarcinogenicOrNonThresholdChemical(chemicalKey) && refValueType === 'adi') {
      return false;
    }
    if (refValueType === 'adi') {
      if (!adi || adiError) return false;
    } else {
      const v = parseFloat(podValor);
      if (isNaN(v) || v <= 0) return false;
      if (!podTipoBMR || !podEfectoCritico || !podOrganismoAño || !podReferencia) return false;
    }
    if (!iterations || iterError) return false;
    if (!numSimulations || getNumSimulationsError()) return false;
    if (validateDistribution(bwDistType, bwParams)) return false;
    if (foodItems.length === 0) return false;
    return true;
  };

  const canAddFood = () => {
    const name = currentFoodSelect === 'custom' ? currentFoodName : currentFoodSelect;
    if (!name) return false;
    if (validateDistribution(concDistType, concParams)) return false;
    if (validateDistribution(consDistType, consParams)) return false;
    if (hasReduction) {
        if (!reductionName) return false;
        const prob = parseFloat(reductionProb);
        const eff = parseFloat(reductionEff);
        if (isNaN(prob) || prob < 0 || prob > 100) return false;
        if (isNaN(eff) || eff < 0 || eff > 100) return false;
    }
    return true;
  };

  const addFood = () => {
    if (!canAddFood()) return;
    
    const displayName = currentFoodSelect === 'custom' 
        ? currentFoodName 
        : (t.foodNames[currentFoodSelect as keyof typeof t.foodNames] || currentFoodSelect);

    const foodData = {
      name: displayName,
      concentration: { ...concParams, type: concDistType },
      concentrationUnit: concUnit,
      consumption: { ...consParams, type: consDistType },
      consumptionUnit: consUnit,
      correlation,
      hasReduction,
      reductionName: hasReduction ? reductionName : '',
      reductionProb: hasReduction ? parseFloat(reductionProb) : 0,
      reductionEff: hasReduction ? parseFloat(reductionEff) : 0,
      lod: lod ? parseFloat(lod) : undefined,
      loq: loq ? parseFloat(loq) : undefined,
      censoredMethod: lod ? censoredMethod : undefined,
      processingFactor: processingFactor ? parseFloat(processingFactor) : undefined
    };

    if (editingFoodId) {
      setFoodItems(foodItems.map(f => f.id === editingFoodId ? { ...f, ...foodData } : f));
      setEditingFoodId(null);
    } else {
      setFoodItems([...foodItems, { ...foodData, id: Date.now().toString() }]);
    }

    setCurrentFoodName('');
    setCurrentFoodSelect('custom');
    setCorrelation(0);
    setHasReduction(false);
    setReductionName('');
    setReductionProb('100');
    setReductionEff('0');
  };

  const editFood = (food: FoodItem) => {
    setEditingFoodId(food.id);
    
    // Check if name matches a preset
    const presetKey = Object.keys(PREDEFINED_FOOD_DATA).find(key => {
        const presetName = t.foodNames[key as keyof typeof t.foodNames] || key;
        return presetName === food.name;
    });

    if (presetKey) {
        setCurrentFoodSelect(presetKey);
        setCurrentFoodName('');
    } else {
        setCurrentFoodSelect('custom');
        setCurrentFoodName(food.name);
    }

    setConcDistType(food.concentration.type);
    setConcParams(food.concentration);
    setConcUnit(food.concentrationUnit);
    
    setConsDistType(food.consumption.type);
    setConsParams(food.consumption);
    setConsUnit(food.consumptionUnit);
    
    setCorrelation(food.correlation || 0);
    setHasReduction(food.hasReduction);
    setReductionName(food.reductionName || '');
    setReductionProb(food.reductionProb?.toString() || '100');
    setReductionEff(food.reductionEff?.toString() || '0');
    
    setLod(food.lod?.toString() || '');
    setLoq(food.loq?.toString() || '');
    setCensoredMethod(food.censoredMethod || 'lod_half');
    setProcessingFactor(food.processingFactor?.toString() || '');
    
    setActiveTab('form');
  };

  const cancelEdit = () => {
    setEditingFoodId(null);
    setCurrentFoodName('');
    setCurrentFoodSelect('custom');
    setCorrelation(0);
    setHasReduction(false);
    setReductionName('');
    setReductionProb('100');
    setReductionEff('0');
    setLod('');
    setLoq('');
    setCensoredMethod('lod_half');
    setProcessingFactor('');
  };

  const removeFood = (id: string) => {
    setFoodItems(foodItems.filter(f => f.id !== id));
  };

  const handleCalculate = async () => {
    if (!isFormValid()) return;
    setIsCalculating(true);
    setCalcProgress(0);
    setCalcPhase('main');

    // Toxicological safety enforcement: Force BMDL / MOE model for non-threshold carcinogens
    // AND force ADI model for non-carcinogens
    let effectiveRefValueType = refValueType;
    if (isCarcinogenicOrNonThresholdChemical(chemicalKey)) {
      if (effectiveRefValueType !== 'bmdl') {
        effectiveRefValueType = 'bmdl';
        setRefValueType('bmdl');
      }
    } else if (chemicalKey !== 'custom' && PREDEFINED_CHEMICALS[chemicalKey]) {
      if (effectiveRefValueType !== 'adi') {
        effectiveRefValueType = 'adi';
        setRefValueType('adi');
      }
    }

    const currentPoD: PoD = {
      valor: parseFloat(effectiveRefValueType === 'bmdl' ? podValor : adi) || 0.40,
      unidad: 'µg/kg pc/día',
      tipo_BMR: podTipoBMR,
      origen_datos: podOrigenDatos,
      efecto_critico: podEfectoCritico,
      organismo_y_año: podOrganismoAño,
      referencia_bibliografica: podReferencia,
      key: selectedPodPreset,
      chemicalKey: chemicalKey,
      chemicalName: PREDEFINED_CHEMICALS[chemicalKey]?.name || (chemicalKey === 'arsenic' ? 'Arsénico inorgánico' : customChemicalName || chemicalKey)
    };

    try {
      const nSims = parseInt(numSimulations);
      const iters = parseInt(iterations);
      const effectiveRefVal = effectiveRefValueType === 'bmdl' ? parseFloat(podValor) : parseFloat(adi);
      const effectiveRefUnit = effectiveRefValueType === 'bmdl' ? 'μg/kg·día' : adiUnit;
      
      if (nSims === 1) {
        const res = await runSimulation(
          iters,
          effectiveRefVal,
          effectiveRefUnit,
          effectiveRefValueType,
          bwParams,
          foodItems,
          expertMode,
          bwKey,
          parseFloat(confidenceLevel) / 100,
          (phase, p) => {
            setCalcPhase(phase);
            setCalcProgress(p);
          },
          effectiveRefValueType === 'bmdl' ? currentPoD : undefined,
          chemicalKey
        );
        setResults({
          ...res,
          pod: effectiveRefValueType === 'bmdl' ? (res.pod || currentPoD) : undefined
        });
      } else {
        // Multiple simulations
        const allResults: SimulationResult[] = [];
        for (let i = 0; i < nSims; i++) {
          const res = await runSimulation(
            iters,
            effectiveRefVal,
            effectiveRefUnit,
            effectiveRefValueType,
            bwParams,
            foodItems,
            false, // Disable bootstrap for individual simulations to save time
            bwKey,
            parseFloat(confidenceLevel) / 100,
            (phase, p) => {
              setCalcPhase('main');
              setCalcProgress(Math.floor(((i * 100) + p) / nSims));
            },
            effectiveRefValueType === 'bmdl' ? currentPoD : undefined,
            chemicalKey
          );
          allResults.push(res);
        }

        if (allResults.length === 0) {
          setIsCalculating(false);
          return;
        }

        // Aggregate results efficiently
        const totalIters = nSims * iters;
        const combinedExposureSamples = new Float64Array(totalIters);
        const combinedBWSamples = new Float64Array(totalIters);
        let offset = 0;
        allResults.forEach(r => {
          if (r.simulationData) {
            combinedExposureSamples.set(r.simulationData.totalExposureSamples, offset);
            combinedBWSamples.set(r.simulationData.bodyWeightSamples, offset);
            offset += r.simulationData.totalExposureSamples.length;
          }
        });
        
        const normalizedRefValue = allResults[0].normalizedRefValue;
        const currentRefValueType = allResults[0].refValueType || 'adi';
        const riskResults = new Float64Array(totalIters);
        let sum = 0;
        for (let i = 0; i < totalIters; i++) {
          // For ADI: risk is percentage of ADI. For BMDL: it's still stored as exposure/refValue internally for consistency in plotting, but we will interpret it as MOE in the UI.
          // Wait, if I want to show MOE, maybe I should store it as MOE?
          // But the charts expect "Risk %".
          // Let's keep it as (Exposure / Ref) * 100 so charts work, but label it "1/MOE * 100".
          const risk = normalizedRefValue > 0 ? (combinedExposureSamples[i] / normalizedRefValue) * 100 : Infinity;
          riskResults[i] = risk;
          if (Number.isFinite(risk)) sum += risk;
        }
        
        const mean = sum / totalIters;
        
        let sumSqDiff = 0;
        let sumCubeDiff = 0;
        let sumQuadDiff = 0;
        let exceedanceCount = 0;
        let bmdlConcernCount = 0;

        for (let i = 0; i < totalIters; i++) {
          const val = riskResults[i];
          if (Number.isFinite(val)) {
            const diff = val - mean;
            const diffSq = diff * diff;
            sumSqDiff += diffSq;
            sumCubeDiff += diffSq * diff;
            sumQuadDiff += diffSq * diffSq;
            if (val > 100) exceedanceCount++;
            if (currentRefValueType === 'bmdl') {
              if (val > 0.01) bmdlConcernCount++;
            }
          }
        }
        
        const variance = sumSqDiff / totalIters;
        const stdDev = Math.sqrt(variance);
        
        // Skewness and Kurtosis
        let skewness = 0;
        let kurtosis = 0;
        if (stdDev > 0) {
          skewness = (sumCubeDiff / totalIters) / Math.pow(stdDev, 3);
          kurtosis = (sumQuadDiff / totalIters) / Math.pow(stdDev, 4) - 3; // Excess kurtosis
        }

        // Efficient sort
        const sortedRisks = new Float64Array(riskResults).sort();

        const getP = (p: number) => {
          const idx = Math.floor(totalIters * (p / 100));
          return sortedRisks[Math.min(totalIters - 1, idx)];
        };

        const p95Exposure = (getP(95) / 100) * normalizedRefValue;

        const riskStats: SimulationStats = {
          mean,
          stdDev,
          cv: mean > 0 ? (stdDev / mean) * 100 : 0,
          median: getP(50),
          min: sortedRisks[0],
          max: sortedRisks[totalIters - 1],
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
          exceedanceProb: (exceedanceCount / totalIters) * 100,
          bmdlConcernProb: currentRefValueType === 'bmdl' ? (bmdlConcernCount / totalIters) * 100 : undefined,
          moeMean: currentRefValueType === 'bmdl' && mean > 0 ? Math.round(100 / mean) : undefined,
          moeP95: currentRefValueType === 'bmdl' && getP(95) > 0 ? Math.round(100 / getP(95)) : undefined,
          marginOfSafety: p95Exposure > 0 ? normalizedRefValue / p95Exposure : undefined,
          hazardQuotient: normalizedRefValue > 0 ? p95Exposure / normalizedRefValue : undefined
        };

        // For uncertainty in multiple simulations, we can use the variability between simulations
        const p95s = allResults.map(r => r.riskStats.p95).sort((a, b) => a - b);
        const means = allResults.map(r => r.riskStats.mean).sort((a, b) => a - b);
        
        const cLevel = parseFloat(confidenceLevel) / 100;
        const alpha = 1 - cLevel;
        const lowIdx = Math.floor(nSims * (alpha / 2));
        const highIdx = Math.floor(nSims * (1 - alpha / 2));

        const uncertainty: UncertaintyStats = {
          meanCI: [means[Math.min(nSims - 1, lowIdx)], means[Math.min(nSims - 1, highIdx)]],
          p95CI: [p95s[Math.min(nSims - 1, lowIdx)], p95s[Math.min(nSims - 1, highIdx)]],
          bootstrapCount: nSims,
          confidenceLevel: cLevel
        };

        const allSimResults = allResults.map(r => ({
          p95: r.riskStats.p95,
          mean: r.riskStats.mean,
          p50: r.riskStats.median,
          p99: r.riskStats.p99
        }));

        setResults({
          ...allResults[0],
          riskStats,
          riskDistribution: Array.from(riskResults), // Convert back to regular array for component compatibility if needed
          uncertainty: expertMode ? uncertainty : undefined,
          simulationData: {
            totalExposureSamples: Array.from(combinedExposureSamples),
            foodInputs: allResults[0].simulationData!.foodInputs,
            bodyWeightSamples: Array.from(combinedBWSamples)
          },
          pod: currentRefValueType === 'bmdl' ? (allResults[0].pod || currentPoD) : undefined,
          allSimulationResults: allSimResults
        });
      }
    } catch (e) {
      console.error(e);
      alert('Error during calculation');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDist = (p: DistributionParams) => {
    switch (p.type) {
        case 'deterministic': return `${p.value}`;
        case 'uniform': return `U(${p.min}, ${p.max})`;
        case 'triangular': return `T(${p.min}, ${p.mode}, ${p.max})`;
        case 'pert': return `P(${p.min}, ${p.mode}, ${p.max})`;
        case 'normal': return `N(${p.mean}, ${p.stdDev})`;
        case 'lognormal': 
          if (p.paramMode === 'arithmetic' || (p.mu === undefined && p.mean !== undefined)) {
            return `LN(m=${p.mean}, s=${p.stdDev})`;
          }
          return `LN(μ=${p.mu}, σ=${p.sigma})`;
        case 'gamma':
        case 'erlang':
          if (p.paramMode === 'arithmetic' || (p.shape === undefined && p.mean !== undefined)) {
            return `Γ(m=${p.mean}, s=${p.stdDev})`;
          }
          return `Γ(k=${p.shape}, β=${p.rate})`;
        case 'weibull':
          if (p.paramMode === 'arithmetic' || (p.shape === undefined && p.mean !== undefined)) {
            return `W(m=${p.mean}, s=${p.stdDev})`;
          }
          return `W(k=${p.shape}, λ=${p.scale})`;
        case 'beta':
          if (p.paramMode === 'arithmetic' || (p.alpha === undefined && p.mean !== undefined)) {
            return `Beta(m=${p.mean}, s=${p.stdDev})`;
          }
          return `Beta(α=${p.alpha}, β=${p.beta})`;
        default: return p.type.substring(0,2).toUpperCase();
    }
  };

  const handleExportFoodListCSV = () => {
    if (foodItems.length === 0) return;
    const headers = ["Nombre", "Dist. Conc.", "Unidad Conc.", "Dist. Cons.", "Unidad Cons.", "Corr.", "Reducción", "Prob. Red (%)", "Efic. Red (%)"];
    const rows = foodItems.map(f => [
      `"${f.name}"`,
      `"${formatDist(f.concentration)}"`,
      `"${f.concentrationUnit}"`,
      `"${formatDist(f.consumption)}"`,
      `"${f.consumptionUnit}"`,
      f.correlation,
      `"${f.hasReduction ? f.reductionName : '-'}"`,
      f.hasReduction ? f.reductionProb : 0,
      f.hasReduction ? f.reductionEff : 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lista_alimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFoodListPDF = () => {
    if (foodItems.length === 0) return;
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text("Lista de Alimentos - Montecarlo FoodRisk", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${dateStr}`, 14, 30);
    doc.text(`Químico: ${chemicalKey === 'custom' ? customChemicalName : PREDEFINED_CHEMICALS[chemicalKey]?.name || '-'}`, 14, 36);

    let y = 50;
    const headers = ["Alimento", "Conc.", "Cons.", "Red."];
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(headers[0], 14, y);
    doc.text(headers[1], 60, y);
    doc.text(headers[2], 100, y);
    doc.text(headers[3], 150, y);
    
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    foodItems.forEach((f, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(f.name, 14, y);
      doc.text(`${formatDist(f.concentration)} ${f.concentrationUnit}`, 60, y);
      doc.text(`${formatDist(f.consumption)} ${f.consumptionUnit}`, 100, y);
      doc.text(f.hasReduction ? `${f.reductionName} (${f.reductionEff}%)` : "-", 150, y);
      y += 8;
    });

    doc.save(`lista_alimentos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSaveTable = () => {
    if (foodItems.length === 0) return;
    const data = JSON.stringify(foodItems, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tabla_alimentos_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadTable = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedItems = JSON.parse(content);
        
        // Basic validation
        if (Array.isArray(importedItems)) {
          // We could add more rigorous validation here if needed
          setFoodItems(importedItems);
        } else {
          alert(t.importError);
        }
      } catch (err) {
        console.error("Error loading JSON:", err);
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const currentChemicalName = chemicalKey === 'custom' ? customChemicalName : PREDEFINED_CHEMICALS[chemicalKey]?.name;

  const renderReductionLabel = (label: string, tooltipKey: string) => (
    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center group relative cursor-help w-fit">
      {label}
      <span className="ml-1 flex items-center justify-center w-3 h-3 rounded-full border border-gray-300 text-[8px] font-bold text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
        i
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-slate-800 rounded shadow-lg border border-gray-200 dark:border-slate-700 text-[10px] normal-case font-normal text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {REDUCTION_TOOLTIPS[tooltipKey] || 'Info'}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-slate-800"></div>
      </div>
    </label>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9] dark:bg-slate-950 transition-colors selection:bg-marine-100 selection:text-marine-900">
      <div className="container mx-auto px-4 py-8 max-w-[1200px]">
        {!results && (
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 pb-10 border-b border-gray-200/60">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-marine-500 to-marine-700 flex items-center justify-center text-white shadow-xl shadow-marine-500/20">
                  <Beaker size={32} strokeWidth={2.5} />
                </div>
                <div className="max-w-xl">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-marine-900 dark:text-marine-100 tracking-tight leading-tight mb-2">
                    Montecarlo <span className="text-marine-600 dark:text-marine-400">FoodRisk</span>
                  </h1>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-md">
                    {t.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 elevated-card shadow-sm border-gray-200/50">
                <div className="flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
                  <Globe size={16} className="text-gray-400 group-hover:text-marine-500 transition-colors" />
                  <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-marine-700 dark:hover:text-marine-400 transition-colors"
                  >
                      <option value="es">ES</option>
                      <option value="en">EN</option>
                      <option value="fr">FR</option>
                  </select>
                </div>
                
                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <button
                    onClick={() => setIsManualOpen(true)}
                    className="teal-gradient-button"
                    title={t.userManualBtn}
                >
                    <BookOpen size={16} />
                    <span>{t.userManualBtn}</span>
                </button>

                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-500 hover:text-marine-600"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </header>
        )}

        <div className="flex flex-col gap-8">
          {!results && (
            <div className="max-w-[1000px] mx-auto w-full space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-4 z-40 bg-[#F4F7F9]/90 backdrop-blur-md p-2 rounded-2xl border border-transparent">
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 flex-1 max-w-md">
                {(['simulation', 'table', 'form'] as const).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab
                        ? 'bg-marine-50 dark:bg-marine-900/30 text-marine-700 dark:text-marine-300'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {tab === 'simulation' && <LayoutDashboard size={18} />}
                    {tab === 'table' && <TableProperties size={18} />}
                    {tab === 'form' && <ClipboardList size={18} />}
                    {t.tabs[tab]}
                    {activeTab === tab && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-marine-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCalculate}
                  disabled={!isFormValid() || isCalculating}
                  className="primary-button min-w-[200px]"
                >
                  {isCalculating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{calcProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Calculator size={18} />
                      <span>{t.calcBtn}</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setFoodItems([]);
                    setResults(null);
                  }}
                  className="secondary-button"
                  title={t.clearBtn}
                >
                  {t.clearBtn}
                </button>
              </div>
            </div>

            {isCalculating && (
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden shadow-inner animate-in fade-in">
                <div 
                  className={`h-full transition-all duration-300 ${calcPhase === 'main' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                  style={{ width: `${calcProgress}%` }}
                ></div>
              </div>
            )}
            {activeTab === 'simulation' && (
              <section className="elevated-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
                  <div className="w-10 h-10 rounded-xl bg-marine-50 flex items-center justify-center text-marine-600">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-marine-900 dark:text-marine-100 tracking-tight">
                    {t.generalParams}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">{t.chemicalLabel} *</label>
                      <div className="relative group">
                          <select 
                            value={chemicalKey} 
                            onChange={handleChemicalChange}
                            className="w-full input-field pr-10 appearance-none cursor-pointer bg-white dark:bg-slate-800"
                          >
                            <option value="custom">{t.otherManual}</option>
                            {Object.keys(PREDEFINED_CHEMICALS)
                              .sort((a, b) => PREDEFINED_CHEMICALS[a].name.localeCompare(PREDEFINED_CHEMICALS[b].name))
                              .map(k => (
                                <option key={k} value={k}>{PREDEFINED_CHEMICALS[k].name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-marine-500 transition-colors pointer-events-none" />
                      </div>
                      {chemicalKey === 'custom' && (
                          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                              <input 
                                  type="text" 
                                  value={customChemicalName}
                                  onChange={(e) => setCustomChemicalName(e.target.value)}
                                  placeholder={t.chemicalNamePlaceholder}
                                  className="w-full input-field"
                              />
                              <input 
                                  type="text" 
                                  value={customChemicalSource}
                                  onChange={(e) => setCustomChemicalSource(e.target.value)}
                                  placeholder={t.chemSource}
                                  className="w-full input-field text-xs"
                              />
                          </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                          Metodología de Evaluación
                        </label>
                        {isCarcinogen && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Sin Umbral (BMDL Obligatorio)
                          </span>
                        )}
                      </div>
                      <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isCarcinogen) return;
                            setRefValueType('adi');
                          }}
                          disabled={isCarcinogen}
                          title={isCarcinogen ? 'Las sustancias genotóxicas y carcinogénicas carecen de umbral seguro; las directrices EFSA/JECFA prohíben el uso de IDA/ADI.' : 'Evaluar según Ingesta Diaria Admisible (IDA/ADI)'}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                            refValueType === 'adi' 
                              ? 'bg-white dark:bg-slate-800 shadow-sm text-marine-600' 
                              : isCarcinogen
                                ? 'opacity-40 cursor-not-allowed text-gray-400 line-through'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                        >
                          ADI (Umbral)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefValueType('bmdl')}
                          className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${refValueType === 'bmdl' ? 'bg-white dark:bg-slate-800 shadow-sm text-marine-600' : 'text-gray-400'}`}
                        >
                          BMDL / PoD (No Umbral - MOE)
                        </button>
                      </div>

                      {isCarcinogen && (
                        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2 shadow-xs">
                          <Info size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <div className="leading-snug">
                            <strong className="font-bold">Regla toxicológica internacional: </strong> 
                            {currentChemDisplayName} es una sustancia genotóxica y/o carcinogénica sin umbral biológico seguro. Las directrices científicas de la EFSA, JECFA y OMS prohíben el uso de una IDA/ADI tradicional y exigen evaluar el riesgo calculando el Margen de Exposición (MOE) a partir de un Punto de Partida (PoD / BMDL).
                          </div>
                        </div>
                      )}
                    </div>
                    {refValueType === 'adi' ? (
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">
                          {t.adiLabel} *
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input 
                              type="number" 
                              value={adi} 
                              onChange={e => setAdi(e.target.value)}
                              disabled={chemicalKey !== 'custom'}
                              placeholder="0.00"
                              className={`w-full input-field pr-10 disabled:bg-gray-50/50 disabled:text-gray-400 ${adiError ? 'border-red-300 ring-4 ring-red-500/5' : ''}`}
                            />
                            <Info size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                          </div>
                          <div className="relative min-w-[120px]">
                            <select 
                              value={adiUnit}
                              onChange={e => setAdiUnit(e.target.value)}
                              disabled={chemicalKey !== 'custom'}
                              className="w-full input-field pr-8 appearance-none cursor-pointer disabled:bg-gray-50/50"
                            >
                              <option value="mg/kg·día">mg/kg·d</option>
                              <option value="μg/kg·día">μg/kg·d</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        {adiError && <p className="text-[10px] font-semibold text-red-500 mt-1.5 ml-1">{adiError}</p>}
                      </div>
                    ) : (
                      /* BMDL Point of Departure (PoD) Section */
                      <div className="space-y-4 p-5 rounded-2xl bg-marine-50/40 dark:bg-slate-800/60 border border-marine-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-black uppercase text-marine-700 dark:text-marine-300 tracking-wider">
                            Punto de Partida (PoD) para MOE *
                          </label>
                          <span className="text-[10px] font-bold text-gray-400">
                            Unidad: µg/kg pc/día
                          </span>
                        </div>

                        {/* Preset Selector */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                            Biblioteca de PoD toxicológicos (EFSA / JECFA)
                          </label>
                          <div className="relative">
                            <select
                              value={selectedPodPreset}
                              onChange={(e) => handlePodPresetChange(e.target.value)}
                              className="w-full input-field pr-10 appearance-none cursor-pointer bg-white dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-gray-200"
                            >
                              {specificPods.length > 0 && (
                                <optgroup label={`PoD específicos para ${currentChemDisplayName}`}>
                                  {specificPods.map(p => (
                                    <option key={p.key} value={p.key}>
                                      {p.organismo_y_año}: {p.tipo_BMR} = {p.valor} µg/kg pc/d ({p.origen_datos === 'humano_epidemiologico' ? 'Humano' : 'Animal'}, {p.efecto_critico})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="Otros PoD de referencia toxicológica en la biblioteca">
                                {otherPods.map(p => (
                                  <option key={p.key} value={p.key}>
                                    {p.chemicalName || p.chemicalKey}: {p.organismo_y_año} - {p.tipo_BMR} = {p.valor} µg/kg pc/d ({p.efecto_critico})
                                  </option>
                                ))}
                              </optgroup>
                              <option value="custom">
                                Ingresar PoD Personalizado...
                              </option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Structured Metadata Display for Preloaded PoDs */}
                        {selectedPodPreset !== 'custom' ? (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-marine-200/60 dark:border-slate-700 text-xs space-y-2">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                              <span className="text-[11px] font-bold text-marine-600 dark:text-marine-400">
                                {podTipoBMR} = {podValor} µg/kg pc/día
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {podOrigenDatos === 'humano_epidemiologico' ? 'Datos Humanos' : 'Bioensayo Animal'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400 pt-1">
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">Efecto crítico:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{podEfectoCritico}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase font-bold">Organismo y año:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{podOrganismoAño}</span>
                              </div>
                            </div>
                            <div className="pt-1 text-[10px] text-gray-500 border-t border-gray-100 dark:border-slate-800">
                              <span className="text-gray-400 font-bold uppercase block text-[9px]">Referencia bibliográfica:</span>
                              <span className="italic">{podReferencia}</span>
                            </div>
                          </div>
                        ) : (
                          /* Custom PoD Input Form */
                          <div className="space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-marine-200/60 dark:border-slate-700 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Valor (µg/kg pc/día) *
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={podValor}
                                  onChange={(e) => {
                                    setPodValor(e.target.value);
                                    setAdi(e.target.value);
                                    setAdiUnit('μg/kg·día');
                                  }}
                                  placeholder="Ej: 0.06 o 1000"
                                  className="w-full input-field text-xs font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Tipo de BMR *
                                </label>
                                <input
                                  type="text"
                                  value={podTipoBMR}
                                  onChange={(e) => setPodTipoBMR(e.target.value)}
                                  placeholder="BMDL10, BMDL05, BMDL0.5, NOAEL..."
                                  className="w-full input-field text-xs font-bold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Origen de Datos *
                                </label>
                                <select
                                  value={podOrigenDatos}
                                  onChange={(e) => setPodOrigenDatos(e.target.value as any)}
                                  className="w-full input-field text-xs font-bold"
                                >
                                  <option value="humano_epidemiologico">Humano epidemiológico</option>
                                  <option value="animal_experimental">Animal experimental</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Efecto Crítico *
                                </label>
                                <input
                                  type="text"
                                  value={podEfectoCritico}
                                  onChange={(e) => setPodEfectoCritico(e.target.value)}
                                  placeholder="Ej: cáncer de piel, pulmón..."
                                  className="w-full input-field text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Organismo y Año *
                                </label>
                                <input
                                  type="text"
                                  value={podOrganismoAño}
                                  onChange={(e) => setPodOrganismoAño(e.target.value)}
                                  placeholder="Ej: EFSA 2024, JECFA 2010..."
                                  className="w-full input-field text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                  Referencia Bibliográfica *
                                </label>
                                <input
                                  type="text"
                                  value={podReferencia}
                                  onChange={(e) => setPodReferencia(e.target.value)}
                                  placeholder="Cita con DOI / serie de informes"
                                  className="w-full input-field text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedChemical && (selectedChemical.description || selectedChemical.targetOrgans || selectedChemical.source) && (
                      <div className="mt-6 p-5 rounded-2xl bg-marine-50/50 border border-marine-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-marine-100 flex items-center justify-center text-marine-600">
                            <Lightbulb size={14} />
                          </div>
                          <h4 className="text-xs font-bold text-marine-900 uppercase tracking-wider">{selectedChemical.name}</h4>
                        </div>
                        
                        {selectedChemical.adiRange && (
                          <div className="mb-4 last:mb-0">
                            <p className="text-[10px] font-bold uppercase text-marine-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-marine-300"></span>
                              Rango ADI / PTDI
                            </p>
                            <p className="text-xs font-mono font-bold text-marine-800 dark:text-marine-200">
                              {selectedChemical.adiRange}
                            </p>
                          </div>
                        )}

                        {selectedChemical.description && (
                          <div className="mb-4 last:mb-0">
                            <p className="text-[10px] font-bold uppercase text-marine-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-marine-300"></span>
                              {t.chemDesc}
                            </p>
                            <p className="text-xs text-marine-700 leading-relaxed font-medium">
                              {selectedChemical.description}
                            </p>
                          </div>
                        )}
                        
                        {selectedChemical.targetOrgans && (
                          <div className="mb-4 last:mb-0">
                            <p className="text-[10px] font-bold uppercase text-marine-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-marine-300"></span>
                              {t.chemTarget}
                            </p>
                            <p className="text-xs text-marine-700 leading-relaxed font-medium">
                              {selectedChemical.targetOrgans}
                            </p>
                          </div>
                        )}

                        {selectedChemical.source && (
                          <div className="last:mb-0">
                            <p className="text-[10px] font-bold uppercase text-marine-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-marine-300"></span>
                              {t.chemSource}
                            </p>
                            <p className="text-xs text-marine-700 leading-relaxed font-medium">
                              {selectedChemical.source}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">{t.bwDistLabel} *</label>
                      <div className="relative mb-3">
                        <select 
                          value={bwKey} 
                          onChange={handleBwChange}
                          className="w-full input-field pr-10 appearance-none cursor-pointer"
                        >
                          <option value="custom">{t.otherManual}</option>
                          {Object.keys(BODY_WEIGHT_PRESETS).map(k => (
                            <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                        <DistributionInput 
                          type={bwDistType}
                          params={bwParams}
                          onParamsChange={(p) => setBwParams(p)}
                          onTypeChange={(type) => {
                            setBwDistType(type);
                            setBwParams({ ...bwParams, type });
                          }}
                          isExpert={expertMode}
                          language={language}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">{t.iterationsLabel} *</label>
                        <input 
                          type="number" 
                          value={iterations}
                          onChange={e => setIterations(e.target.value)}
                          className={`w-full input-field ${iterError ? 'border-red-300 ring-4 ring-red-500/5' : ''}`}
                        />
                        {iterError && <p className="text-[10px] font-semibold text-red-500 mt-1.5 ml-1">{iterError}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">{t.simulationsLabel} *</label>
                        <div className="relative">
                          <select 
                            value={numSimulations}
                            onChange={e => setNumSimulations(e.target.value)}
                            className="w-full input-field pr-10 appearance-none cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 10, 25, 100].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scientific Protocol v2.4</span>
                  </div>
                  <label className="flex items-center cursor-pointer group">
                    <span className="mr-3 text-xs font-bold text-gray-500 group-hover:text-marine-600 transition-colors">{t.expertMode}</span>
                    <div className="relative">
                      <input type="checkbox" checked={expertMode} onChange={() => setExpertMode(!expertMode)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-marine-600"></div>
                    </div>
                  </label>
                </div>
                
                {expertMode && (
                  <div className="mt-4 p-5 bg-marine-50/30 dark:bg-marine-900/10 rounded-2xl border border-marine-100/50 dark:border-marine-800/50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-black text-marine-900 dark:text-marine-100 uppercase tracking-tight mb-1">
                          {language === 'es' ? 'Nivel de Confianza (Alpha)' : 'Confidence Level (Alpha)'}
                        </h4>
                        <p className="text-[10px] text-marine-600/70 dark:text-marine-400/60 font-medium">
                          {language === 'es' 
                            ? 'Define el intervalo de probabilidad para el análisis de incertidumbre.' 
                            : 'Defines the probability interval for uncertainty analysis.'}
                        </p>
                      </div>
                      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-marine-100/30 dark:border-marine-800/30">
                        {['90', '95', '99'].map(level => (
                          <button
                            key={level}
                            onClick={() => setConfidenceLevel(level)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                              confidenceLevel === level 
                                ? 'bg-marine-600 text-white shadow-md shadow-marine-500/20' 
                                : 'text-gray-400 hover:text-marine-600 hover:bg-marine-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {level}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'form' && (
              <section className="elevated-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <ClipboardList size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-marine-900 tracking-tight">
                    {t.foodsSection}
                  </h2>
                </div>
                
                <div className="bg-gray-50/50 dark:bg-slate-800/50 p-6 rounded-[20px] border border-gray-100 dark:border-slate-700 space-y-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1 tracking-wider">{t.foodNameLabel}</label>
                    <div className="relative group">
                      <select 
                        value={currentFoodSelect}
                        onChange={handleFoodSelectChange}
                        className="w-full input-field pr-10 appearance-none cursor-pointer bg-white dark:bg-slate-800"
                      >
                      <option value="custom">{t.manualOption}</option>
                      <optgroup label={t.foodGroups.cereals}>
                        <option value="Arroz">{t.foodNames['Arroz']}</option>
                        <option value="Maíz">{t.foodNames['Maíz']}</option>
                        <option value="Trigo">{t.foodNames['Trigo']}</option>
                        <option value="Avena">{t.foodNames['Avena']}</option>
                        <option value="Cebada">{t.foodNames['Cebada']}</option>
                        <option value="Centeno">{t.foodNames['Centeno']}</option>
                        <option value="Patata">{t.foodNames['Patata']}</option>
                        <option value="Yuca">{t.foodNames['Yuca']}</option>
                        <option value="Pan">{t.foodNames['Pan']}</option>
                        <option value="Pasta">{t.foodNames['Pasta']}</option>
                      </optgroup>
                      <optgroup label={t.foodGroups.vegetables}>
                        <option value="Frijoles">{t.foodNames['Frijoles']}</option>
                        <option value="Lentejas">{t.foodNames['Lentejas']}</option>
                        <option value="Soja">{t.foodNames['Soja']}</option>
                        <option value="Tomate">{t.foodNames['Tomate']}</option>
                        <option value="Zanahoria">{t.foodNames['Zanahoria']}</option>
                        <option value="Lechuga">{t.foodNames['Lechuga']}</option>
                        <option value="Espinaca">{t.foodNames['Espinaca']}</option>
                        <option value="Cebolla">{t.foodNames['Cebolla']}</option>
                        <option value="Ajo">{t.foodNames['Ajo']}</option>
                        <option value="Brócoli">{t.foodNames['Brócoli']}</option>
                        <option value="Pepino">{t.foodNames['Pepino']}</option>
                        <option value="Pimiento">{t.foodNames['Pimiento']}</option>
                        <option value="Repollo">{t.foodNames['Repollo']}</option>
                        <option value="Coliflor">{t.foodNames['Coliflor']}</option>
                        <option value="Berenjena">{t.foodNames['Berenjena']}</option>
                        <option value="Calabacín">{t.foodNames['Calabacín']}</option>
                        <option value="Champiñón">{t.foodNames['Champiñón']}</option>
                        <option value="Calabaza">{t.foodNames['Calabaza']}</option>
                        <option value="Guisantes">{t.foodNames['Guisantes']}</option>
                        <option value="Garbanzos">{t.foodNames['Garbanzos']}</option>
                        <option value="Espárrago">{t.foodNames['Espárrago']}</option>
                        <option value="Alcachofa">{t.foodNames['Alcachofa']}</option>
                        <option value="Apio">{t.foodNames['Apio']}</option>
                        <option value="Rábano">{t.foodNames['Rábano']}</option>
                        <option value="Remolacha">{t.foodNames['Remolacha']}</option>
                        <option value="Acelga">{t.foodNames['Acelga']}</option>
                        <option value="Puerro">{t.foodNames['Puerro']}</option>
                        <option value="Col de Bruselas">{t.foodNames['Col de Bruselas']}</option>
                        <option value="Habas">{t.foodNames['Habas']}</option>
                        <option value="Judías Verdes">{t.foodNames['Judías Verdes']}</option>
                      </optgroup>
                      <optgroup label={t.foodGroups.fruits}>
                        <option value="Manzana">{t.foodNames['Manzana']}</option>
                        <option value="Banano">{t.foodNames['Banano']}</option>
                        <option value="Naranja">{t.foodNames['Naranja']}</option>
                        <option value="Uva">{t.foodNames['Uva']}</option>
                        <option value="Fresa">{t.foodNames['Fresa']}</option>
                        <option value="Piña">{t.foodNames['Piña']}</option>
                        <option value="Sandía">{t.foodNames['Sandía']}</option>
                        <option value="Melón">{t.foodNames['Melón']}</option>
                        <option value="Melocotón">{t.foodNames['Melocotón']}</option>
                        <option value="Pera">{t.foodNames['Pera']}</option>
                        <option value="Limón">{t.foodNames['Limón']}</option>
                        <option value="Cereza">{t.foodNames['Cereza']}</option>
                        <option value="Kiwi">{t.foodNames['Kiwi']}</option>
                        <option value="Mango">{t.foodNames['Mango']}</option>
                        <option value="Aguacate">{t.foodNames['Aguacate']}</option>
                        <option value="Arándano">{t.foodNames['Arándano']}</option>
                        <option value="Frambuesa">{t.foodNames['Frambuesa']}</option>
                        <option value="Mora">{t.foodNames['Mora']}</option>
                        <option value="Granada">{t.foodNames['Granada']}</option>
                        <option value="Higo">{t.foodNames['Higo']}</option>
                        <option value="Papaya">{t.foodNames['Papaya']}</option>
                        <option value="Guayaba">{t.foodNames['Guayaba']}</option>
                        <option value="Maracuyá">{t.foodNames['Maracuyá']}</option>
                        <option value="Pitaya">{t.foodNames['Pitaya']}</option>
                        <option value="Albaricoque">{t.foodNames['Albaricoque']}</option>
                        <option value="Ciruela">{t.foodNames['Ciruela']}</option>
                        <option value="Nectarina">{t.foodNames['Nectarina']}</option>
                        <option value="Coco">{t.foodNames['Coco']}</option>
                        <option value="Dátiles">{t.foodNames['Dátiles']}</option>
                      </optgroup>
                      <optgroup label={t.foodGroups.nuts}>
                        <option value="Almendra">{t.foodNames['Almendra']}</option>
                        <option value="Nuez">{t.foodNames['Nuez']}</option>
                        <option value="Cacahuete">{t.foodNames['Cacahuete']}</option>
                        <option value="Pistacho">{t.foodNames['Pistacho']}</option>
                      </optgroup>
                      <optgroup label={t.foodGroups.animal}>
                        <option value="Leche">{t.foodNames['Leche']}</option>
                        <option value="Carne Res">{t.foodNames['Carne Res']}</option>
                        <option value="Carne Pollo">{t.foodNames['Carne Pollo']}</option>
                        <option value="Carne Cerdo">{t.foodNames['Carne Cerdo']}</option>
                        <option value="Carne Cordero">{t.foodNames['Carne Cordero']}</option>
                        <option value="Huevo">{t.foodNames['Huevo']}</option>
                        <option value="Pescado">{t.foodNames['Pescado']}</option>
                        <option value="Marisco">{t.foodNames['Marisco']}</option>
                        <option value="Queso">{t.foodNames['Queso']}</option>
                        <option value="Yogur">{t.foodNames['Yogur']}</option>
                        <option value="Mantequilla">{t.foodNames['Mantequilla']}</option>
                      </optgroup>
                      <optgroup label={t.foodGroups.other}>
                        <option value="Agua">{t.foodNames['Agua']}</option>
                        <option value="Aceite">{t.foodNames['Aceite']}</option>
                        <option value="Café">{t.foodNames['Café']}</option>
                        <option value="Té">{t.foodNames['Té']}</option>
                        <option value="Chocolate">{t.foodNames['Chocolate']}</option>
                        <option value="Miel">{t.foodNames['Miel']}</option>
                        <option value="Azúcar">{t.foodNames['Azúcar']}</option>
                        <option value="Vino">{t.foodNames['Vino']}</option>
                        <option value="Cerveza">{t.foodNames['Cerveza']}</option>
                      </optgroup>
                    </select>
                    {currentFoodSelect === 'custom' && (
                      <input 
                          type="text" 
                          placeholder="Nombre..." 
                          value={currentFoodName}
                          onChange={e => setCurrentFoodName(e.target.value)}
                          className="mt-2 w-full px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <DistributionInput 
                          label={t.concDistLabel}
                          type={concDistType}
                          params={concParams}
                          unit={concUnit}
                          onTypeChange={setConcDistType}
                          onParamsChange={setConcParams}
                          onUnitChange={setConcUnit}
                          units={['mg/kg', 'μg/kg', 'mg/L', 'μg/L']}
                          isExpert={expertMode}
                          language={language}
                      />
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                      <DistributionInput 
                          label={t.consDistLabel}
                          type={consDistType}
                          params={consParams}
                          unit={consUnit}
                          onTypeChange={setConsDistType}
                          onParamsChange={setConsParams}
                          onUnitChange={setConsUnit}
                          units={['g/día', 'g/persona/día', 'kg/día', 'mL/día', 'L/día']}
                          isExpert={expertMode}
                          language={language}
                      />
                    </div>
                  </div>

                  {expertMode && (
                    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm animate-in zoom-in-95">
                        <label className="block text-[11px] font-bold uppercase text-gray-400 mb-4 tracking-wider">{t.corrLabel}</label>
                        <div className="flex items-center gap-6">
                            <input 
                                type="range" 
                                min="-0.99" 
                                max="0.99" 
                                step="0.01" 
                                value={correlation}
                                onChange={e => setCorrelation(parseFloat(e.target.value))}
                                className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-marine-600"
                            />
                            <div className={`px-4 py-2 rounded-xl font-mono font-bold text-sm min-w-[70px] text-center shadow-inner ${correlation > 0 ? 'bg-emerald-50 text-emerald-600' : correlation < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                {correlation > 0 ? '+' : ''}{correlation.toFixed(2)}
                            </div>
                        </div>
                    </div>
                  )}

                  {expertMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-marine-50/50 rounded-2xl border border-marine-100 animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-3">
                        <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider">{t.lodLabel}</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            step="0.0001"
                            value={lod}
                            onChange={e => setLod(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 input-field h-10 text-sm"
                          />
                          <div className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-[10px] font-bold text-gray-400 self-center uppercase">{concUnit}</div>
                        </div>
                        {lod && (
                          <div className="mt-4 pt-4 border-t border-marine-100">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">{t.censoredMethodLabel}</label>
                            <div className="relative">
                              <select 
                                value={censoredMethod}
                                onChange={e => setCensoredMethod(e.target.value as any)}
                                className="w-full input-field h-9 text-xs pr-8 appearance-none"
                              >
                                <option value="zero">ND = 0</option>
                                <option value="lod_half">ND = LOD / 2</option>
                                <option value="lod">ND = LOD</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        )}
                       </div>
                       <div className="space-y-3">
                          <label className="block text-[11px] font-bold uppercase text-gray-400 tracking-wider">{t.processingFactorLabel}</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={processingFactor}
                            onChange={e => setProcessingFactor(e.target.value)}
                            placeholder="1.0"
                            className="w-full input-field h-10 text-sm"
                          />
                          <p className="text-[10px] text-gray-400 font-medium italic ml-1">Multiplier (1.0 = baseline)</p>
                       </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                        onClick={() => setHasReduction(!hasReduction)}
                        className={`w-full py-4 px-6 rounded-2xl border transition-all flex items-center justify-between group ${hasReduction ? 'bg-marine-50 border-marine-200 text-marine-700' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 shadow-sm'}`}
                    >
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasReduction ? 'bg-marine-100' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                              <ShieldCheck size={18} className={hasReduction ? 'text-marine-600' : 'text-gray-400'} />
                           </div>
                           <span className="text-sm font-bold">{t.hasReductionLabel}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${hasReduction ? 'bg-marine-600 border-marine-600' : 'border-gray-200 bg-white'}`}>
                           {hasReduction && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                    </button>

                    {hasReduction && (
                        <div className="mt-4 p-6 bg-white rounded-2xl border border-marine-100 space-y-6 shadow-sm animate-in slide-in-from-top-4">
                            <div>
                                {renderReductionLabel(t.reductionNameLabel, 'name')}
                                <input 
                                    type="text" 
                                    value={reductionName}
                                    onChange={e => setReductionName(e.target.value)}
                                    className="w-full input-field mt-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    {renderReductionLabel(t.reductionProbLabel, 'prob')}
                                    <div className="relative mt-2">
                                      <input 
                                          type="number" 
                                          value={reductionProb}
                                          onChange={e => setReductionProb(e.target.value)}
                                          className="w-full input-field"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">%</span>
                                    </div>
                                </div>
                                <div>
                                    {renderReductionLabel(t.reductionEffLabel, 'eff')}
                                    <div className="relative mt-2">
                                      <input 
                                          type="number" 
                                          value={reductionEff}
                                          onChange={e => setReductionEff(e.target.value)}
                                          className="w-full input-field"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button 
                    onClick={addFood}
                    disabled={!canAddFood()}
                    className={`flex-1 py-4 px-6 ${editingFoodId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 text-white font-black rounded-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg`}
                  >
                    {editingFoodId ? `💾 ${t.updateFoodBtn}` : `➕ ${t.addFoodBtn}`}
                  </button>
                  {editingFoodId && (
                    <button 
                      onClick={cancelEdit}
                      className="py-4 px-8 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                    >
                      {t.cancelEditBtn}
                    </button>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'table' && (
              <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-700 animate-in fade-in slide-in-from-left-2">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">
                  <h2 className="text-xl font-semibold">
                    {t.listHeader} ({foodItems.length})
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1" title={t.saveTableBtn}>
                        💾 JSON
                    </button>
                    <label className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer" title={t.loadTableBtn}>
                        📂 JSON
                        <input type="file" accept=".json" onChange={handleLoadTable} className="hidden" />
                    </label>
                    <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={handleExportFoodListCSV} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        📊 CSV
                    </button>
                    <button onClick={handleExportFoodListPDF} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        📄 PDF
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {foodItems.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 italic">{t.noFoods}</p>
                  ) : (
                    foodItems.map(food => (
                      <div key={food.id} className="group p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{food.name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-[10px] text-gray-500">
                              <strong className="text-gray-400">Conc:</strong> {formatDist(food.concentration)} {food.concentrationUnit}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              <strong className="text-gray-400">Cons:</strong> {formatDist(food.consumption)} {food.consumptionUnit}
                            </span>
                            {expertMode && food.lod !== undefined && (
                                <span className="text-[10px] text-blue-500 font-bold">
                                    LOD: {food.lod} {food.concentrationUnit} ({food.censoredMethod})
                                </span>
                            )}
                            {expertMode && food.processingFactor !== undefined && (
                                <span className="text-[10px] text-indigo-500 font-bold">
                                    Proc: x{food.processingFactor}
                                </span>
                            )}
                            {food.correlation !== 0 && (
                                <span className="text-[10px] text-blue-500 font-bold">
                                    Corr: {food.correlation.toFixed(2)}
                                </span>
                            )}
                            {food.hasReduction && (
                                <span className="text-[10px] text-emerald-500 font-bold">
                                    {food.reductionName} ({food.reductionEff}%)
                                </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => editFood(food)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            title={t.editBtn}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => removeFood(food.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === 'recommendations' && (
              <section className="elevated-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Lightbulb size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-marine-900 tracking-tight">
                    {t.results.recommendations}
                  </h2>
                </div>
                
                {results ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-marine-50 rounded-2xl border border-marine-100 flex gap-5 items-start">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <ShieldCheck className="text-marine-600" size={24} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-marine-900 uppercase text-xs tracking-wider">{t.results.recTitle}</h4>
                        <p className="text-sm text-marine-700 leading-relaxed">
                          Basado en los resultados de la simulación, el sistema ha generado recomendaciones específicas que puede encontrar detalladas en el panel de resultados principal.
                        </p>
                        <button 
                          onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-xs font-bold text-marine-600 underline hover:text-marine-800 transition-colors"
                        >
                          Ir a los resultados detallados
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50/30 rounded-[32px] border-2 border-dashed border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm border border-gray-100">
                      <Zap size={32} />
                    </div>
                    <p className="text-marine-900 font-bold mb-2">{t.results.noData}</p>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                      Inicie una simulación para que el motor inteligente de MontecarloFoodRisk analice los datos y le proporcione sugerencias de mitigación.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {results && (
            <div ref={resultsRef} className="relative w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ResultsPanel 
                  results={results} 
                  language={language}
                  onBack={() => setResults(null)}
                  inputSummary={{
                      chemical: currentChemicalName || (results?.pod ? `Arsénico inorgánico (${results.pod.organismo_y_año})` : '-'),
                      adi: results?.refValueType === 'bmdl'
                        ? `${results.pod?.tipo_BMR || 'PoD'} = ${results.pod?.valor ?? adi} µg/kg pc/d (${results.pod?.organismo_y_año || ''})`
                        : `${adi} ${adiUnit}`,
                      bw: `${formatDist(bwParams)} kg`,
                      iterations: `${iterations} x ${numSimulations}`
                  }}
              />
            </div>
          )}
        </div>
      </div>
      <footer className="mt-auto py-8 border-t border-gray-200 dark:border-slate-800 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {t.footerText}
        </p>
      </footer>
      <UserManual 
        isOpen={isManualOpen} 
        onClose={() => setIsManualOpen(false)} 
        language={language} 
      />
    </div>
  );
};

export default App;
