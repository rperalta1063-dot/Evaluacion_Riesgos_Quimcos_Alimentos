
export type DistributionType = 
  | 'deterministic' 
  | 'uniform' 
  | 'triangular' 
  | 'pert' 
  | 'normal' 
  | 'lognormal' 
  | 'weibull' 
  | 'exponential'
  | 'erlang' 
  | 'gamma' 
  | 'beta' 
  | 'gumbel' 
  | 'frechet' 
  | 'inverse_weibull';

export interface DistributionParams {
  type: DistributionType;
  paramMode?: 'direct' | 'arithmetic';
  value?: number;
  min?: number;
  max?: number;
  mode?: number;
  mean?: number;
  stdDev?: number;
  mu?: number;
  sigma?: number;
  shape?: number;
  scale?: number;
  rate?: number;
  alpha?: number;
  beta?: number;
  gamma?: number; // For PERT
  location?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  concentration: DistributionParams;
  concentrationUnit: string;
  consumption: DistributionParams;
  consumptionUnit: string;
  correlation: number;
  // Probabilistic Reduction Factor
  hasReduction: boolean;
  reductionName: string;
  reductionProb: number; // Probability of occurrence (0-100)
  reductionEff: number;  // Reduction efficiency (0-100)
  
  // Expert Parameters
  lod?: number;          // Limit of Detection
  loq?: number;          // Limit of Quantitation
  censoredMethod?: 'zero' | 'lod_half' | 'lod';
  processingFactor?: number; // Factor multiply concentration
}

export interface SimulationStats {
  mean: number;
  stdDev: number;
  cv: number;          // Coefficient of Variation (%)
  median: number;
  min: number;
  max: number;
  iqr: number;         // Interquartile Range
  skewness: number;    // Measure of asymmetry
  kurtosis: number;    // Measure of "tailedness"
  p5: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p975: number;
  p99: number;
  p999: number;        // Critical for acute risk
  exceedanceProb: number; // Probability of exceeding ADI (%)
  bmdlConcernProb?: number; // Probability that MOE < 10,000 for BMDL (%)
  moeMean?: number;        // Mean MOE
  moeP95?: number;         // P95 MOE
  marginOfSafety?: number; // MOS = ADI / P95 Exposure
  hazardQuotient?: number;  // HQ = P95 Exposure / ADI
}

export interface UncertaintyStats {
  meanCI: [number, number];
  p95CI: [number, number];
  bootstrapCount: number;
  confidenceLevel: number;
}

export type PoDOrigin = 'humano_epidemiologico' | 'animal_experimental';
export type BMRType = 'BMDL10' | 'BMDL05' | 'BMDL01' | 'BMDL0.5' | 'NOAEL' | string;

export interface PoD {
  valor: number; // Always in µg/kg pc/día internally
  unidad: string; // Display unit, usually 'µg/kg pc/día'
  tipo_BMR: BMRType;
  origen_datos: PoDOrigin;
  efecto_critico: string;
  organismo_y_año: string;
  referencia_bibliografica: string;
  key?: string;
  chemicalKey?: string;
  chemicalName?: string;
}

export interface Contribution {
  id?: string;
  name: string;
  exposure: number;
  percentage: number;
}

export interface SimulationResult {
  riskStats: SimulationStats;
  riskDistribution: number[];
  uncertainty?: UncertaintyStats;
  meanContributions: Contribution[];
  normalizedRefValue: number;
  originalRefValue?: number;
  originalRefUnit?: string;
  refValueType?: 'adi' | 'bmdl';
  pod?: PoD;
  isExpert: boolean;
  simulationData?: {
    foodInputs: { 
      id?: string; 
      name: string; 
      concSamples: number[]; 
      consSamples: number[];
      concentrationUnit?: string;
      consumptionUnit?: string;
      processingFactor?: number;
      hasReduction?: boolean;
      reductionProb?: number;
      reductionEff?: number;
      lod?: number;
      loq?: number;
      censoredMethod?: 'zero' | 'lod_half' | 'lod';
    }[];
    foodExposureSamples?: number[][];
    totalExposureSamples: number[];
    bodyWeightSamples: number[];
  };
  allSimulationResults?: {
    p95: number;
    mean: number;
    p50: number;
    p99: number;
  }[];
}

export interface TornadoItem {
  id: string;
  foodName: string;
  variableType: 'conc' | 'cons' | 'bw';
  displayName: string;
  unit: string;
  baseVal: number;
  lowVal: number;
  highVal: number;
  baseRisk: number;
  lowRisk: number;
  highRisk: number;
  swing: number;
  deltaDown: number;
  deltaUp: number;
  baseHQ: number;
  lowHQ: number;
  highHQ: number;
  swingHQ: number;
  deltaDownHQ?: number;
  deltaUpHQ?: number;
  swingPercentage: number;
  pearson: number;
  spearman: number;
  rank: number;
  isHighRisk: boolean;
}

export interface ChemicalPreset {
  adi: number;
  unit: string;
  name: string;
  description?: string;
  targetOrgans?: string;
  source?: string;
  adiRange?: string;
}

export interface SavedConfiguration {
  timestamp: number;
  chemicalKey: string;
  customChemicalName: string;
  adi: string;
  adiUnit: string;
  bwKey: string;
  bodyWeight: string;
  bwDistType: DistributionType;
  bwParams: DistributionParams;
  iterations: string;
  foodItems: FoodItem[];
  expertMode: boolean;
  confidenceLevel: string;
}

export type Language = 'es' | 'en' | 'fr';
