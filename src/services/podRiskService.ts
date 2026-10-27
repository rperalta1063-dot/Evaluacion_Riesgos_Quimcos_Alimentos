export type PoDOrigin = 'humano_epidemiologico' | 'animal_experimental';
export type BMRType = 'BMDL10' | 'BMDL05' | 'BMDL01' | 'BMDL0.5' | 'NOAEL' | string;

export interface PoD {
  valor: number; // Siempre en µg/kg pc/día internamente
  unidad: string; // 'µg/kg pc/día'
  tipo_BMR: BMRType;
  origen_datos: PoDOrigin;
  efecto_critico: string;
  organismo_y_año: string;
  referencia_bibliografica: string;
  key?: string;
  chemicalKey?: string;
  chemicalName?: string;
}

export const PRELOADED_PODS: Record<string, PoD> = {
  // --- Arsénico inorgánico ---
  efsa_2024: {
    key: 'efsa_2024',
    chemicalKey: 'arsenic',
    chemicalName: 'Arsénico inorgánico',
    valor: 0.06,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL05',
    origen_datos: 'humano_epidemiologico',
    efecto_critico: 'cáncer de piel',
    organismo_y_año: 'EFSA 2024',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2024;22:e8488, doi:10.2903/j.efsa.2024.8488'
  },
  jecfa_2010: {
    key: 'jecfa_2010',
    chemicalKey: 'arsenic',
    chemicalName: 'Arsénico inorgánico',
    valor: 3.0,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL0.5',
    origen_datos: 'humano_epidemiologico',
    efecto_critico: 'cáncer de pulmón',
    organismo_y_año: 'JECFA 2010',
    referencia_bibliografica: 'JECFA, 72.ª reunión (2010), WHO Food Additives Series 63'
  },

  // --- Aflatoxina B1 (Micotoxina hepatotóxica y carcinogénica) ---
  aflatoxin_efsa_2020: {
    key: 'aflatoxin_efsa_2020',
    chemicalKey: 'aflatoxin_b1',
    chemicalName: 'Aflatoxina B1',
    valor: 0.40,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL10',
    origen_datos: 'animal_experimental',
    efecto_critico: 'cáncer de hígado (hepatocarcinoma)',
    organismo_y_año: 'EFSA 2020',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2020;18(3):6040, doi:10.2903/j.efsa.2020.6040'
  },
  aflatoxin_jecfa_2017: {
    key: 'aflatoxin_jecfa_2017',
    chemicalKey: 'aflatoxin_b1',
    chemicalName: 'Aflatoxina B1',
    valor: 0.40,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL10',
    origen_datos: 'animal_experimental',
    efecto_critico: 'cáncer de hígado',
    organismo_y_año: 'JECFA 2017',
    referencia_bibliografica: 'JECFA, 84.ª reunión (2017), WHO Food Additives Series 75'
  },

  // --- Acrilamida (Contaminante de procesado térmico) ---
  acrylamide_efsa_neoplastic: {
    key: 'acrylamide_efsa_neoplastic',
    chemicalKey: 'acrylamide',
    chemicalName: 'Acrilamida',
    valor: 170.0,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL10',
    origen_datos: 'animal_experimental',
    efecto_critico: 'efectos neoplásicos (tumores)',
    organismo_y_año: 'EFSA 2015',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2015;13(6):4104'
  },
  acrylamide_efsa_neuro: {
    key: 'acrylamide_efsa_neuro',
    chemicalKey: 'acrylamide',
    chemicalName: 'Acrilamida',
    valor: 430.0,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL10',
    origen_datos: 'animal_experimental',
    efecto_critico: 'neurotoxicidad periférica',
    organismo_y_año: 'EFSA 2015',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2015;13(6):4104'
  },

  // --- Ocratoxina A (Micotoxina nefrotóxica y carcinogénica) ---
  ochratoxin_efsa_2020: {
    key: 'ochratoxin_efsa_2020',
    chemicalKey: 'ochratoxin_a',
    chemicalName: 'Ocratoxina A',
    valor: 14.5,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL10',
    origen_datos: 'animal_experimental',
    efecto_critico: 'lesiones neoplásicas renales',
    organismo_y_año: 'EFSA 2020',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2020;18(5):6113'
  },

  // --- Plomo (Metal pesado neurotóxico sin umbral claro) ---
  lead_efsa_neuro: {
    key: 'lead_efsa_neuro',
    chemicalKey: 'lead',
    chemicalName: 'Plomo',
    valor: 0.50,
    unidad: 'µg/kg pc/día',
    tipo_BMR: 'BMDL01',
    origen_datos: 'humano_epidemiologico',
    efecto_critico: 'neurotoxicidad en desarrollo cognitivo infantil',
    organismo_y_año: 'EFSA 2010',
    referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2010;8(4):1570'
  }
};

/**
 * Returns the default PoD preset key for a given chemical.
 */
export function getDefaultPoDKeyForChemical(chemicalKey: string): string {
  const k = (chemicalKey || '').toLowerCase();
  if (k.includes('aflatox')) return 'aflatoxin_efsa_2020';
  if (k.includes('arsen')) return 'efsa_2024';
  if (k.includes('acrilam')) return 'acrylamide_efsa_neoplastic';
  if (k.includes('ocratox')) return 'ochratoxin_efsa_2020';
  if (k.includes('lead') || k.includes('plomo')) return 'lead_efsa_neuro';
  return 'efsa_2024';
}

/**
 * Checks if a chemical is typically evaluated with BMDL / MOE (genotoxic and/or carcinogenic).
 */
export function isCarcinogenicOrNonThresholdChemical(chemicalKey: string): boolean {
  if (!chemicalKey) return false;
  const k = chemicalKey.toLowerCase();
  return (
    ['aflatoxin_b1', 'arsenic', 'acrylamide', 'ochratoxin_a'].includes(k) ||
    k.includes('aflatox') ||
    k.includes('acrilam') ||
    k.includes('arsen') ||
    k.includes('ocratox')
  );
}

/**
 * Categorizes PoD presets for a given chemical to power dynamic UI selectors.
 */
export function getPoDPresetsGrouped(currentChemicalKey: string) {
  const allPods = Object.values(PRELOADED_PODS);
  const k = (currentChemicalKey || '').toLowerCase();
  const specific = allPods.filter(p => {
    const pk = (p.chemicalKey || '').toLowerCase();
    return pk === k || 
      (k.includes('aflatox') && pk.includes('aflatox')) ||
      (k.includes('arsen') && pk.includes('arsen')) ||
      (k.includes('acrilam') && pk.includes('acrilam')) ||
      (k.includes('ocratox') && pk.includes('ocratox'));
  });
  const others = allPods.filter(p => !specific.includes(p));
  return { specific, others };
}

export interface RiskClassificationResult {
  classification: string;
  category: string;
  statusLevel: 'concern' | 'safe' | 'expert';
  isConcern: boolean;
  requiresExpertJudgement: boolean;
  isLowConcern: boolean;
  statusColor: string; // Hex color: red for concern, neutral for expert, emerald for low concern
  badgeClass: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  criterionName: string;
  criterionRef: string;
  criterionUsed: string;
  bibliographicSource: string;
  thresholdMoe: number | null;
  thresholdExposure_ug: number | null;
  ruleBranch: 'animal_bmdl10' | 'efsa_2024' | 'human_expert' | 'other_animal';
}

/**
 * Classifies risk strictly according to the PoD origin and BMR type:
 *
 * a) origen_datos = "animal_experimental" && tipo_BMR = BMDL10 (Criterio EFSA 2005):
 *    - MOE >= 10.000 -> "Baja preocupación para la salud pública"
 *    - MOE < 10.000 -> "No puede descartarse preocupación; considerar prioridad para la gestión del riesgo"
 *    (Sin usar la palabra "crítico")
 *
 * b) EFSA 2024 arsénico inorgánico (BMDL05 = 0.06 µg/kg pc/día):
 *    - MOE <= 1 -> "Preocupación para la salud (criterio EFSA 2024)"
 *    - MOE > 1 -> "MOE superior al punto de referencia; no se establece un umbral numérico de seguridad. Requiere juicio experto"
 *
 * c) JECFA 2010 arsénico inorgánico o cualquier PoD de origen humano sin criterio numérico:
 *    - Sin categoría automática: "Sin umbral numérico establecido para este PoD; la caracterización requiere juicio experto"
 *    (Nunca aplicar el umbral de 10.000 a un PoD humano)
 */
export function classifyPoDRisk(pod: PoD, moe: number): RiskClassificationResult {
  const isAnimalBMDL10 = pod.origen_datos === 'animal_experimental' && pod.tipo_BMR.toUpperCase() === 'BMDL10';
  
  const isEFSA2024 = (pod.key === 'efsa_2024') || 
    (pod.organismo_y_año.includes('EFSA 2024') && pod.tipo_BMR.toUpperCase() === 'BMDL05' && Math.abs(pod.valor - 0.06) < 0.001);

  const isHuman = pod.origen_datos === 'humano_epidemiologico';

  // Case a: Animal experimental BMDL10
  if (isAnimalBMDL10) {
    const thresholdMoe = 10000;
    const thresholdExposure_ug = pod.valor / thresholdMoe;
    const isSafe = moe >= 10000;

    if (isSafe) {
      const classification = 'Baja preocupación para la salud pública';
      const criterionName = 'Criterio EFSA 2005 para sustancias genotóxicas y carcinogénicas (PoD animal BMDL10)';
      const criterionRef = 'EFSA CONTAM/SC Panel, EFSA Journal 2005;282:1-31';
      return {
        classification,
        category: classification,
        statusLevel: 'safe',
        isConcern: false,
        requiresExpertJudgement: false,
        isLowConcern: true,
        statusColor: '#10b981', // Emerald
        badgeClass: 'bg-emerald-500 text-white',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        borderColor: 'border-emerald-300 dark:border-emerald-800',
        criterionName,
        criterionRef,
        criterionUsed: criterionName,
        bibliographicSource: criterionRef,
        thresholdMoe: 10000,
        thresholdExposure_ug,
        ruleBranch: 'animal_bmdl10'
      };
    } else {
      const classification = 'No puede descartarse preocupación; considerar prioridad para la gestión del riesgo';
      const criterionName = 'Criterio EFSA 2005 para sustancias genotóxicas y carcinogénicas (PoD animal BMDL10)';
      const criterionRef = 'EFSA CONTAM/SC Panel, EFSA Journal 2005;282:1-31';
      return {
        classification,
        category: classification,
        statusLevel: 'concern',
        isConcern: true,
        requiresExpertJudgement: false,
        isLowConcern: false,
        statusColor: '#ef4444', // Red
        badgeClass: 'bg-red-500 text-white',
        badgeBg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-800',
        criterionName,
        criterionRef,
        criterionUsed: criterionName,
        bibliographicSource: criterionRef,
        thresholdMoe: 10000,
        thresholdExposure_ug,
        ruleBranch: 'animal_bmdl10'
      };
    }
  }

  // Case b: EFSA 2024 inorganic arsenic (BMDL05 = 0.06 µg/kg pc/d)
  if (isEFSA2024) {
    const thresholdMoe = 1;
    const thresholdExposure_ug = pod.valor / thresholdMoe; // 0.06 µg/kg pc/d
    const isConcern = moe <= 1;

    if (isConcern) {
      const classification = 'Preocupación para la salud (criterio EFSA 2024)';
      const criterionName = 'Criterio EFSA 2024 para arsénico inorgánico (BMDL05 epidemiológica = 0,06 µg/kg pc/día)';
      const criterionRef = 'EFSA CONTAM Panel, EFSA Journal 2024;22:e8488, doi:10.2903/j.efsa.2024.8488';
      return {
        classification,
        category: classification,
        statusLevel: 'concern',
        isConcern: true,
        requiresExpertJudgement: false,
        isLowConcern: false,
        statusColor: '#ef4444', // Red
        badgeClass: 'bg-red-500 text-white',
        badgeBg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-800',
        criterionName,
        criterionRef,
        criterionUsed: criterionName,
        bibliographicSource: criterionRef,
        thresholdMoe: 1,
        thresholdExposure_ug,
        ruleBranch: 'efsa_2024'
      };
    } else {
      const classification = 'MOE superior al punto de referencia; no se establece un umbral numérico de seguridad. Requiere juicio experto';
      const criterionName = 'Criterio EFSA 2024 para arsénico inorgánico (MOE > 1)';
      const criterionRef = 'EFSA CONTAM Panel, EFSA Journal 2024;22:e8488, doi:10.2903/j.efsa.2024.8488';
      return {
        classification,
        category: classification,
        statusLevel: 'expert',
        isConcern: false,
        requiresExpertJudgement: true,
        isLowConcern: false,
        statusColor: '#64748b', // Slate / Neutral
        badgeClass: 'bg-slate-500 text-white',
        badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        textColor: 'text-slate-700 dark:text-slate-300',
        borderColor: 'border-slate-300 dark:border-slate-700',
        criterionName,
        criterionRef,
        criterionUsed: criterionName,
        bibliographicSource: criterionRef,
        thresholdMoe: 1,
        thresholdExposure_ug,
        ruleBranch: 'efsa_2024'
      };
    }
  }

  // Case c: JECFA 2010 or any other PoD of human epidemiological origin without numerical threshold
  if (isHuman) {
    const classification = 'Sin umbral numérico establecido para este PoD; la caracterización requiere juicio experto';
    const criterionName = 'PoD epidemiológico humano sin umbral numérico formalmente establecido';
    const criterionRef = pod.referencia_bibliografica;
    return {
      classification,
      category: classification,
      statusLevel: 'expert',
      isConcern: false,
      requiresExpertJudgement: true,
      isLowConcern: false,
      statusColor: '#64748b', // Neutral Slate
      badgeClass: 'bg-slate-500 text-white',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      textColor: 'text-slate-700 dark:text-slate-300',
      borderColor: 'border-slate-300 dark:border-slate-700',
      criterionName,
      criterionRef,
      criterionUsed: criterionName,
      bibliographicSource: criterionRef,
      thresholdMoe: null,
      thresholdExposure_ug: null,
      ruleBranch: 'human_expert'
    };
  }

  // Case d: Other animal PoD (not BMDL10)
  const classification = 'Punto de partida animal no estandarizado; la caracterización requiere juicio experto';
  const criterionName = 'PoD animal experimental sin umbral automático de 10.000';
  const criterionRef = pod.referencia_bibliografica;
  return {
    classification,
    category: classification,
    statusLevel: 'expert',
    isConcern: false,
    requiresExpertJudgement: true,
    isLowConcern: false,
    statusColor: '#64748b',
    badgeClass: 'bg-slate-500 text-white',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700',
    criterionName,
    criterionRef,
    criterionUsed: criterionName,
    bibliographicSource: criterionRef,
    thresholdMoe: null,
    thresholdExposure_ug: null,
    ruleBranch: 'other_animal'
  };
}

/**
 * Formats a number with appropriate decimal digits and comma for decimals if required.
 */
export function formatNumberES(val: number, decimals = 3): string {
  if (val === undefined || isNaN(val)) return '0,00';
  if (val >= 1000) return val.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  if (val >= 10) return val.toFixed(2).replace('.', ',');
  if (val >= 1) return val.toFixed(decimals).replace('.', ',');
  if (val >= 0.0001) return val.toFixed(decimals >= 4 ? decimals : 4).replace('.', ',');
  return val.toExponential(3).replace('.', ',');
}

/**
 * Standard interpretive text template per Requirement 5:
 * "El 95 % de los individuos de la población simulada presenta una exposición estimada inferior a {P95} µg/kg pc/día. Respecto al punto de partida {tipo_BMR} de {valor} µg/kg pc/día ({organismo_y_año}, {efecto_critico}), el MOE en el P95 es {MOE_P95}. {texto_de_clasificacion_segun_punto_3}."
 */
export function generateInterpretiveText(pod: PoD, p95_ug: number, moeOverride?: number): string {
  const moe_p95 = moeOverride !== undefined ? moeOverride : (p95_ug > 0 ? pod.valor / p95_ug : 999999);
  const classificationResult = classifyPoDRisk(pod, moe_p95);
  
  const p95Str = formatNumberES(p95_ug, 4);
  const valorStr = formatNumberES(pod.valor, 2);
  const moeStr = moe_p95 >= 1000 
    ? Math.round(moe_p95).toLocaleString('es-ES') 
    : formatNumberES(moe_p95, 2);

  return `El 95 % de los individuos de la población simulada presenta una exposición estimada inferior a ${p95Str} µg/kg pc/día. Respecto al punto de partida ${pod.tipo_BMR} de ${valorStr} µg/kg pc/día (${pod.organismo_y_año}, ${pod.efecto_critico}), el MOE en el P95 es ${moeStr}. ${classificationResult.classification}.`;
}

/**
 * Dynamic description of the PoD based on metadata per Requirement 6:
 * Eliminates static "Límite inferior de confianza (95 %) para un 10 % de incidencia de tumorigénesis"
 */
export function getPoDDescription(pod: PoD): string {
  const originStr = pod.origen_datos === 'humano_epidemiologico' 
    ? 'datos epidemiológicos humanos' 
    : 'bioensayos experimentales en animales';

  let bmrDesc = pod.tipo_BMR;
  if (pod.tipo_BMR === 'BMDL10') bmrDesc = 'Límite inferior del IC 95% para un 10% de respuesta';
  else if (pod.tipo_BMR === 'BMDL05') bmrDesc = 'Límite inferior del IC 95% para un 5% de respuesta';
  else if (pod.tipo_BMR === 'BMDL01') bmrDesc = 'Límite inferior del IC 95% para un 1% de respuesta';
  else if (pod.tipo_BMR === 'BMDL0.5') bmrDesc = 'Límite inferior del IC 95% para un 0,5% de respuesta';
  else if (pod.tipo_BMR === 'NOAEL') bmrDesc = 'Nivel sin efecto adverso observado (NOAEL)';

  return `${bmrDesc} para ${pod.efecto_critico}, derivado por ${pod.organismo_y_año} a partir de ${originStr}.`;
}
