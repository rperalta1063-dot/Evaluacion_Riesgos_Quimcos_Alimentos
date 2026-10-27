import React from 'react';
import { ShieldAlert, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { SimulationStats, Language, UncertaintyStats, PoD } from '../types';
import { TRANSLATIONS } from '../locales';
import { 
  classifyPoDRisk, 
  generateInterpretiveText, 
  getPoDDescription, 
  formatNumberES, 
  PRELOADED_PODS 
} from '../services/podRiskService';

interface Props {
  stats: SimulationStats;
  uncertainty?: UncertaintyStats;
  language: Language;
  refValue: number;
  refValueType?: 'adi' | 'bmdl';
  unit?: string;
  pod?: PoD;
}

const RiskCard: React.FC<Props> = ({ 
  stats, 
  uncertainty, 
  language, 
  refValue, 
  refValueType = 'adi', 
  unit = 'mg/kg·día',
  pod
}) => {
  const t = TRANSLATIONS[language];
  const p95 = stats.p95;

  // Active PoD resolution for BMDL mode
  const activePod: PoD = pod || (
    refValueType === 'bmdl'
      ? {
          valor: (unit === 'mg/kg·día' ? refValue * 1000 : refValue),
          unidad: 'µg/kg pc/día',
          tipo_BMR: 'BMDL05',
          origen_datos: 'humano_epidemiologico',
          efecto_critico: 'cáncer de piel',
          organismo_y_año: 'EFSA 2024',
          referencia_bibliografica: 'EFSA CONTAM Panel, EFSA Journal 2024;22:e8488, doi:10.2903/j.efsa.2024.8488',
          key: 'efsa_2024'
        }
      : PRELOADED_PODS.efsa_2024
  );

  const formatExposure = (val: number): string => {
    if (val === undefined || isNaN(val)) return '0,00';
    if (val >= 10) return val.toFixed(2);
    if (val >= 1) return val.toFixed(3);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toExponential(3);
  };

  const formatRef = (val: number): string => {
    if (val === undefined || isNaN(val)) return '0,00';
    if (val >= 1) return val.toFixed(2);
    if (val >= 0.01) return val.toFixed(3);
    if (val >= 0.0001) return val.toFixed(4);
    return val.toExponential(2);
  };

  // Convert p95 exposure to µg/kg pc/día
  // If refValue was in mg/kg·día, refValue * 1000 is in µg/kg pc/día
  // Or directly from activePod.valor: p95ExposureValue_ug = (p95 / 100) * (unit === 'mg/kg·día' ? refValue * 1000 : refValue)
  const refValue_ug = (unit === 'mg/kg·día') ? refValue * 1000 : refValue;
  const p95ExposureValue_ug = (p95 / 100) * refValue_ug;
  const p95ExposureValue_mg = p95ExposureValue_ug * 0.001;

  const p95Formatted = formatExposure(refValueType === 'bmdl' ? p95ExposureValue_ug : (p95 / 100) * refValue);
  const refFormatted = formatRef(refValueType === 'bmdl' ? activePod.valor : refValue);
  const displayUnit = refValueType === 'bmdl' ? 'µg/kg pc/día' : unit;

  // Formula MOE = PoD / exposure (both in µg/kg pc/día)
  const moe = p95ExposureValue_ug > 0 ? (activePod.valor / p95ExposureValue_ug) : 999999;
  const classificationResult = classifyPoDRisk(activePod, moe);

  const getRiskDetails = (val: number) => {
    if (refValueType === 'bmdl') {
      const isConcern = classificationResult.isConcern;
      const isExpert = classificationResult.requiresExpertJudgement;
      const isLow = classificationResult.isLowConcern;

      return {
        level: isConcern ? 'Preocupación' : isLow ? 'Baja Preocupación' : 'Juicio Experto',
        title: classificationResult.classification,
        range: `MOE (P95) = ${moe >= 1000 ? Math.round(moe).toLocaleString('es-ES') : formatNumberES(moe, 2)}`,
        conclusion: classificationResult.criterionName,
        probTemplate: '',
        color: isConcern ? 'text-red-700 dark:text-red-300' : isLow ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300',
        titleColor: isConcern ? 'text-red-950 dark:text-red-100' : isLow ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100',
        bg: isConcern ? 'bg-red-50/70 dark:bg-red-900/15' : isLow ? 'bg-emerald-50/70 dark:bg-emerald-900/15' : 'bg-slate-50/80 dark:bg-slate-900/30',
        border: isConcern ? 'border-red-200 dark:border-red-800/80' : isLow ? 'border-emerald-200 dark:border-emerald-800/80' : 'border-slate-200 dark:border-slate-700',
        badge: isConcern ? 'bg-red-600' : isLow ? 'bg-emerald-600' : 'bg-slate-600',
        badgeBg: isConcern ? 'bg-red-100/60 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800' : isLow ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        pos: isConcern ? '20%' : isLow ? '85%' : '50%'
      };
    }

    // Standard ADI evaluation
    if (val < 25) {
      return { 
        level: t.results.riskLevels.veryLow, 
        title: `${t.results.riskLevels.veryLow}: ${t.results.riskTitles?.veryLow || 'Margen de seguridad amplio'}`,
        range: t.results.riskRanges?.veryLow || '< 25% del Valor de Referencia',
        conclusion: t.results.riskConclusions?.veryLow || 'Nivel de exposición insignificante bajo condiciones habituales.',
        probTemplate: t.results.probStatements?.veryLow || 'Existe una probabilidad del 95% de que la ingesta diaria de la población evaluada no supere los {value} {unit} (P95), manteniéndose con un amplio margen de seguridad por debajo del límite toxicológico admisible.',
        color: 'text-emerald-700 dark:text-emerald-300',
        titleColor: 'text-emerald-900 dark:text-emerald-100',
        bg: 'bg-emerald-50/70 dark:bg-emerald-900/15',
        border: 'border-emerald-200 dark:border-emerald-800/80',
        badge: 'bg-emerald-600',
        badgeBg: 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        pos: '5%'
      };
    }
    if (val < 75) {
      return { 
        level: t.results.riskLevels.low, 
        title: `${t.results.riskLevels.low}: ${t.results.riskTitles?.low || 'Margen de protección adecuado'}`,
        range: t.results.riskRanges?.low || '25%–75% del Valor de Referencia',
        conclusion: t.results.riskConclusions?.low || 'Exposición segura que mantiene un margen de protección adecuado.',
        probTemplate: t.results.probStatements?.low || 'Existe una probabilidad del 95% de que la ingesta diaria de la población evaluada no supere los {value} {unit} (P95), manteniéndose holgadamente por debajo del límite toxicológico admisible.',
        color: 'text-teal-700 dark:text-teal-300',
        titleColor: 'text-teal-900 dark:text-teal-100',
        bg: 'bg-teal-50/70 dark:bg-teal-900/15',
        border: 'border-teal-200 dark:border-teal-800/80',
        badge: 'bg-teal-600',
        badgeBg: 'bg-teal-100/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        pos: '25%'
      };
    }
    if (val <= 100) {
      return { 
        level: t.results.riskLevels.moderate, 
        title: `${t.results.riskLevels.moderate}: ${t.results.riskTitles?.moderate || 'Exposición en vigilancia preventiva'}`,
        range: t.results.riskRanges?.moderate || '75%–100% del Valor de Referencia',
        conclusion: t.results.riskConclusions?.moderate || 'Exposición en niveles de vigilancia; cercana al límite toxicológico.',
        probTemplate: t.results.probStatements?.moderate || 'Existe una probabilidad del 95% de que la ingesta diaria de la población evaluada no supere los {value} {unit} (P95), situándose por debajo del límite toxicológico admisible pero próximo al umbral.',
        color: 'text-amber-700 dark:text-amber-300',
        titleColor: 'text-amber-900 dark:text-amber-100',
        bg: 'bg-amber-50/70 dark:bg-amber-900/15',
        border: 'border-amber-200 dark:border-amber-800/80',
        badge: 'bg-amber-500',
        badgeBg: 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        pos: '45%'
      };
    }
    if (val <= 200) {
      return { 
        level: t.results.riskLevels.high, 
        title: `${t.results.riskLevels.high}: ${t.results.riskTitles?.high || 'Supera el umbral de seguridad'}`,
        range: t.results.riskRanges?.high || '100%–200% del Valor de Referencia',
        conclusion: t.results.riskConclusions?.high || 'La exposición estimada supera el umbral de seguridad toxicológica.',
        probTemplate: t.results.probStatements?.high || 'Existe una probabilidad del 95% de que la ingesta diaria de la población evaluada alcance {value} {unit} (P95), superando el límite toxicológico admisible en el percentil superior.',
        color: 'text-red-700 dark:text-red-300',
        titleColor: 'text-red-900 dark:text-red-100',
        bg: 'bg-red-50/70 dark:bg-red-900/15',
        border: 'border-red-200 dark:border-red-800/80',
        badge: 'bg-red-600',
        badgeBg: 'bg-red-100/60 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
        pos: '75%'
      };
    }
    return { 
      level: t.results.riskLevels.veryHigh, 
      title: `${t.results.riskLevels.veryHigh}: ${t.results.riskTitles?.veryHigh || 'Exceso crítico de exposición'}`,
      range: t.results.riskRanges?.veryHigh || '> 200% del Valor de Referencia',
      conclusion: t.results.riskConclusions?.veryHigh || 'Exceso de exposición; requiere medidas de mitigación.',
      probTemplate: t.results.probStatements?.veryHigh || 'Existe una probabilidad del 95% de que la ingesta diaria de la población evaluada alcance {value} {unit} (P95), excediendo el límite toxicológico admisible.',
      color: 'text-red-800 dark:text-red-200',
      titleColor: 'text-red-950 dark:text-red-100',
      bg: 'bg-red-100/60 dark:bg-red-900/30',
      border: 'border-red-300 dark:border-red-700',
      badge: 'bg-red-700',
      badgeBg: 'bg-red-200/60 dark:bg-red-950/50 text-red-900 dark:text-red-200 border-red-400 dark:border-red-700',
      pos: '95%'
    };
  };

  const info = getRiskDetails(p95);

  const renderLevelTooltip = (level: string, desc: string, badgeClass: string) => (
    <div className="group relative inline-block cursor-help">
      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-105 ${badgeClass}`}>
        {level}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-gray-900 text-white text-[10px] font-normal leading-tight rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 text-center">
        {desc}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  // Standard interpretive body complying with Requirement 5
  const renderInterpretiveBody = () => {
    if (refValueType === 'bmdl') {
      const text = generateInterpretiveText(activePod, p95ExposureValue_ug);
      return (
        <span className="text-sm md:text-base leading-relaxed font-normal text-gray-800 dark:text-gray-200">
          {text}
        </span>
      );
    }

    const template = info.probTemplate;
    const parts = template.split(/(\{value\}|\{unit\}|\{refValue\}|\{refName\})/);

    return parts.map((part: string, idx: number) => {
      if (part === '{value}') {
        return (
          <span 
            key={idx} 
            className="font-mono font-black text-gray-900 dark:text-gray-100 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-black/10 dark:border-white/10 shadow-sm mx-0.5 inline-block"
          >
            {p95Formatted}
          </span>
        );
      }
      if (part === '{unit}') {
        return (
          <strong key={idx} className="text-gray-900 dark:text-gray-100 font-bold">
            {displayUnit}
          </strong>
        );
      }
      if (part === '{refValue}') {
        return (
          <span 
            key={idx} 
            className="font-mono font-bold text-gray-900 dark:text-gray-100"
          >
            {refFormatted}
          </span>
        );
      }
      if (part === '{refName}') {
        return (
          <span key={idx} className="font-bold text-gray-900 dark:text-gray-100">
            {language === 'en' ? 'ADI' : language === 'fr' ? 'DJA' : 'IDA'}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={`rounded-3xl border shadow-xl p-8 transition-all duration-500 ${info.bg} ${info.border}`}>
      {/* Top Section: Metrics and Context */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="uppercase text-[10px] font-black tracking-[0.2em] text-gray-500/80 dark:text-gray-400/80">
              {refValueType === 'bmdl' ? 'Caracterización del Riesgo (MOE P95)' : t.results.p95risk}
            </h3>
            {renderLevelTooltip(info.level, info.conclusion, info.badge)}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
              {refValueType === 'adi' ? (
                <span className="text-7xl md:text-8xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                  {p95.toFixed(1)}<span className="text-4xl md:text-5xl opacity-30">%</span>
                </span>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-marine-600 dark:text-marine-400 tracking-widest mb-1">
                    Margen de Exposición (MOE) en P95
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-6xl md:text-7xl font-black tracking-tighter ${classificationResult.textColor}`}>
                      {moe >= 1000 ? Math.round(moe).toLocaleString('es-ES') : formatNumberES(moe, 2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">
              {refValueType === 'adi' ? (
                <span>del Valor de Referencia ({language === 'en' ? 'ADI' : language === 'fr' ? 'DJA' : 'IDA'})</span>
              ) : (
                <span>
                  Respecto a {activePod.tipo_BMR} ({formatNumberES(activePod.valor, 2)} µg/kg pc/d - {activePod.organismo_y_año})
                </span>
              )}
              <div className="h-px flex-1 bg-current opacity-10"></div>
            </div>
          </div>

          {uncertainty && uncertainty.p95CI && (
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 rounded-full px-4 py-1.5 w-fit border border-black/5 backdrop-blur-sm">
              <span className="opacity-40">CI 95%</span>
              <span className="text-gray-900 dark:text-gray-100">[{uncertainty.p95CI[0].toFixed(1)}% - {uncertainty.p95CI[1].toFixed(1)}%]</span>
            </div>
          )}
        </div>

        {/* Status / Metric Panel */}
        <div className="w-full lg:w-96 space-y-4 bg-white/70 dark:bg-black/20 p-6 rounded-2xl border border-black/5 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {refValueType === 'bmdl' ? 'Criterio Normativo Aplicado' : 'Escala de Riesgo'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${info.badge} text-white`}>
              {refValueType === 'bmdl' ? activePod.organismo_y_año : 'ADI'}
            </span>
          </div>

          {refValueType === 'bmdl' ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-black/5 dark:border-slate-700">
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {classificationResult.classification}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  {classificationResult.criterionRef}
                </p>
              </div>

              {classificationResult.thresholdMoe !== null ? (
                <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 px-1">
                  <span>Umbral normativo:</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                    MOE = {classificationResult.thresholdMoe.toLocaleString('es-ES')}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic px-1">
                  Sin umbral numérico formal. No se aplica el criterio animal de 10.000.
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: '25%' }} />
                <div className="h-full bg-teal-400" style={{ width: '25%' }} />
                <div className="h-full bg-amber-400" style={{ width: '25%' }} />
                <div className="h-full bg-red-500" style={{ width: '25%' }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1">
                <span>0%</span>
                <span>100% ADI</span>
                <span>200%+</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Metrics: Replaced % BMDL with absolute exposure in µg/kg pc/d and MOE */}
      <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {refValueType === 'bmdl' ? (
            <>
              {/* Stat 1: Media */}
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Exposición Media
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono block">
                  {formatNumberES(((stats.mean || 0) / 100) * refValue_ug, 4)} µg/kg pc/d
                </span>
                <span className="text-xs font-bold text-marine-600 dark:text-marine-400 mt-1 block">
                  MOE = {stats.mean > 0 ? formatNumberES(activePod.valor / (((stats.mean || 0) / 100) * refValue_ug), 1) : 'N/A'}
                </span>
              </div>

              {/* Stat 2: P50 Mediana */}
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Exposición P50 (Mediana)
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono block">
                  {formatNumberES(((stats.median || 0) / 100) * refValue_ug, 4)} µg/kg pc/d
                </span>
                <span className="text-xs font-bold text-marine-600 dark:text-marine-400 mt-1 block">
                  MOE = {stats.median > 0 ? formatNumberES(activePod.valor / (((stats.median || 0) / 100) * refValue_ug), 1) : 'N/A'}
                </span>
              </div>

              {/* Stat 3: P95 */}
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 shadow-sm ring-1 ring-blue-500/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Exposición P95 (Alta ingesta)
                </span>
                <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono block">
                  {formatNumberES(p95ExposureValue_ug, 4)} µg/kg pc/d
                </span>
                <span className={`text-xs font-black mt-1 block ${classificationResult.textColor}`}>
                  MOE = {moe >= 1000 ? Math.round(moe).toLocaleString('es-ES') : formatNumberES(moe, 2)}
                </span>
              </div>

              {/* Stat 4: P99 */}
              <div className="p-4 rounded-2xl border bg-white/60 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Exposición P99 (Cola)
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono block">
                  {formatNumberES(((stats.p99 || 0) / 100) * refValue_ug, 4)} µg/kg pc/d
                </span>
                <span className="text-xs font-bold text-marine-600 dark:text-marine-400 mt-1 block">
                  MOE = {stats.p99 > 0 ? formatNumberES(activePod.valor / (((stats.p99 || 0) / 100) * refValue_ug), 1) : 'N/A'}
                </span>
              </div>
            </>
          ) : (
            <>
              {stats.hazardQuotient !== undefined && (
                <div className={`p-4 rounded-2xl border ${stats.hazardQuotient > 1 ? 'bg-red-50/80 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'} flex flex-col gap-1 shadow-sm`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t.hqLabel}</span>
                  <span className={`text-2xl font-black ${stats.hazardQuotient > 1 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {stats.hazardQuotient.toFixed(3)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium italic">{t.hazardQuotientDesc}</p>
                </div>
              )}
              {stats.marginOfSafety !== undefined && (
                <div className={`p-4 rounded-2xl border ${stats.marginOfSafety < 1 ? 'bg-red-50/80 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-blue-50/80 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30'} flex flex-col gap-1 shadow-sm`}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t.mosLabel}</span>
                  <span className={`text-2xl font-black ${stats.marginOfSafety < 1 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {stats.marginOfSafety.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium italic">{t.mosDesc}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Technical Interpretive Card complying with Requirement 5 */}
        <div className="flex flex-col sm:flex-row items-start gap-6 bg-white/75 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-md">
          <div className={`p-4 rounded-2xl text-3xl shadow-sm border ring-4 ring-white dark:ring-slate-800 shrink-0 ${info.bg} ${info.border.replace('border-', 'text-')}`}>
            {refValueType === 'bmdl' ? (
              classificationResult.isConcern ? <ShieldAlert size={34} /> : classificationResult.isLowConcern ? <ShieldCheck size={34} /> : <HelpCircle size={34} />
            ) : (
              p95 >= 100 ? <ShieldAlert size={34} /> : p95 >= 75 ? <Activity size={34} /> : <ShieldCheck size={34} />
            )}
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Dictamen de Evaluación:
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${info.badge} text-white`}>
                  {info.level}
                </span>
              </div>
              <h4 className={`text-xl md:text-2xl font-black tracking-tight leading-snug ${info.titleColor}`}>
                {info.title}
              </h4>
            </div>

            {/* Standard Probabilistic Interpretation Text Box */}
            <div className="bg-gray-50/95 dark:bg-slate-900/90 p-5 rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-marine-600 dark:text-marine-400 block">
                Interpretación Probabilística de la Exposición:
              </span>
              <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                {renderInterpretiveBody()}
              </p>
            </div>

            {/* PoD Description and Rigor: only for carcinogenic / genotoxic substances (BMDL) */}
            {refValueType === 'bmdl' && (
              <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <strong>Punto de Partida ({activePod.tipo_BMR}):</strong> {getPoDDescription(activePod)}
                </p>
                <p className="text-[10px] text-gray-500">
                  <strong>Referencia:</strong> {activePod.referencia_bibliografica}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCard;
