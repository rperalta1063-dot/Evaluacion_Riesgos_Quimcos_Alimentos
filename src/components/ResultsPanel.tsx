
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea,
  AreaChart, Area, LineChart, Line, CartesianGrid, PieChart, Pie, ScatterChart, Scatter, ZAxis, Legend,
  Brush
} from 'recharts';
import { Minimize2, Maximize2, ArrowLeft, Activity, Info, AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert, Database, Gauge, Download, FileText, Share2, Wind, HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { SimulationResult, Language, SimulationStats, UncertaintyStats, PoD } from '../types';
import { calculatePearsonCorrelation, normalizeConcentration, normalizeConsumption } from '../services/mathUtils';
import { TRANSLATIONS } from '../locales';
import { 
  classifyPoDRisk, 
  generateInterpretiveText, 
  getPoDDescription, 
  formatNumberES, 
  PRELOADED_PODS 
} from '../services/podRiskService';
import RiskCard from './RiskCard';
import TornadoAnalysis from './TornadoAnalysis';

interface Props {
  results: SimulationResult | null;
  onRunCorrelation?: (correlations: { name: string; value: number }[]) => void;
  onBack?: () => void;
  inputSummary?: {
    chemical: string;
    adi: string;
    bw: string;
    iterations: string;
  };
  language: Language;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  totalSamples?: number;
  language: Language;
  riskStats: SimulationStats | null;
  isBMDL?: boolean;
  pod?: PoD;
  refValue_ug?: number;
}

const kernelGaussian = (u: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);

const CONTRIB_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

const getColor = (risk: number, isBMDL = false, pod?: PoD) => {
  if (isBMDL) {
    const moe = risk > 0 ? (100 / risk) : 999999;
    const activePod = pod || PRELOADED_PODS.efsa_2024;
    const res = classifyPoDRisk(activePod, moe);
    return res.statusColor;
  }
  if (risk < 25) return '#10b981'; // Emerald 500
  if (risk < 75) return '#34d399'; // Emerald 400
  if (risk <= 100) return '#f59e0b'; // Amber 500
  if (risk <= 200) return '#ef4444'; // Red 500
  return '#b91c1c'; // Red 700
};

const RiskLegend = ({ language, chartView, isBMDL = false, pod }: { language: Language, chartView: string, isBMDL?: boolean, pod?: PoD }) => {
  if (chartView === 'correlation') {
    const labels = language === 'es' ? {
      title: 'CORRELACIÓN:',
      pos: 'Positiva',
      neg: 'Negativa',
      neutral: 'Neutra'
    } : {
      title: 'CORRELATION:',
      pos: 'Positive',
      neg: 'Negative',
      neutral: 'Neutral'
    };

    const steps = [
      { label: labels.neg, color: '#ef4444' },
      { label: labels.neutral, color: '#f1f5f9' },
      { label: labels.pos, color: '#10b981' }
    ];

    return (
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 p-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-800/50 backdrop-blur-sm shadow-inner">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2 self-center">{labels.title}</span>
        {steps.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded shadow-sm ring-1 ring-white/50 dark:ring-slate-800" style={{ backgroundColor: s.color }}></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Only show risk legend for relevant views
  const relevantViews = ['histogram', 'density', 'cdf', 'matrix', 'simulations', 'comparison', 'exposureHistogram'];
  if (!relevantViews.includes(chartView)) return null;

  if (isBMDL) {
    const activePod = pod || PRELOADED_PODS.efsa_2024;
    const isAnimalBMDL10 = activePod.origen_datos === 'animal_experimental' && activePod.tipo_BMR.toUpperCase() === 'BMDL10';
    const isEFSA2024 = (activePod.key === 'efsa_2024') || (activePod.organismo_y_año.includes('EFSA 2024') && activePod.tipo_BMR.toUpperCase() === 'BMDL05');

    let bmdlZones: { label: string; color: string }[] = [];
    if (isAnimalBMDL10) {
      bmdlZones = [
        { label: 'Baja preocupación para la salud pública (MOE ≥ 10.000)', color: '#10b981' },
        { label: 'No puede descartarse preocupación; prioridad gestión (MOE < 10.000)', color: '#ef4444' }
      ];
    } else if (isEFSA2024) {
      bmdlZones = [
        { label: 'Preocupación para la salud (MOE ≤ 1, criterio EFSA 2024)', color: '#ef4444' },
        { label: 'MOE > 1 (Superior al PoD; requiere juicio experto)', color: '#64748b' }
      ];
    } else {
      bmdlZones = [
        { label: 'Sin umbral numérico establecido para este PoD; la caracterización requiere juicio experto', color: '#64748b' }
      ];
    }

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 p-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-800/50 backdrop-blur-sm shadow-inner">
        {bmdlZones.map(z => (
          <div key={z.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: z.color }}></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">{z.label}</span>
          </div>
        ))}
      </div>
    );
  }

  const t = TRANSLATIONS[language].results.riskLevels;
  const zones = [
    { label: `${t.veryLow} (<25%)`, color: '#10b981' },
    { label: `${t.low} (25-75%)`, color: '#34d399' },
    { label: `${t.moderate} (75-100%)`, color: '#f59e0b' },
    { label: `${t.high} (100-200%)`, color: '#ef4444' },
    { label: `${t.veryHigh} (>200%)`, color: '#b91c1c' }
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 p-3 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-slate-800/50 backdrop-blur-sm shadow-inner">
      {zones.map(z => (
        <div key={z.label} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: z.color }}></div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{z.label}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, totalSamples, language, riskStats, isBMDL, pod, refValue_ug = 1 }: CustomTooltipProps) => {
  const t = TRANSLATIONS[language];
    if (active && payload && payload.length > 0 && payload[0].payload) {
    const data = payload[0].payload;
    if (!data) return null;

    const isCDF = data.prob !== undefined;
    const isDensity = data.density !== undefined;
    const isExposureDist = isDensity && data.x !== undefined && data.x < 1; 
    const isExposureHistogram = data.midPoint !== undefined && data.midPoint < 1 && !isDensity;
    const isScatter = data.xVal !== undefined && data.yVal !== undefined;
    const isSensitivity = data.pearson !== undefined;
    
    const countPercentage = totalSamples && data.count 
      ? ((data.count / totalSamples) * 100).toFixed(1) 
      : null;

    // Helper to find nearest standard percentile
    const getPercentileLabel = (p: number) => {
        const targets = [50, 90, 95, 99, 99.9];
        const threshold = 0.5;
        const nearest = targets.find(t => Math.abs(t - p) < threshold);
        return nearest ? `P${nearest}` : null;
    };

    if (isSensitivity) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-sm z-50 ring-1 ring-black/5">
                <p className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-2 mb-2">{data.foodName}</p>
                <div className="space-y-1.5">
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t.results.variableType}:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {data.type === 'conc' ? t.results.concentration : t.results.consumption}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t.results.pearsonFull}:</span>
                        <span className={`font-mono font-bold ${data.pearson >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(data.pearson || 0).toFixed(3)}
                        </span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t.results.strength}:</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {Math.abs(data.pearson) > 0.5 ? t.results.high : Math.abs(data.pearson) > 0.1 ? t.results.moderate : t.results.low}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const statsInBin = [];
    if (!isCDF && !isDensity && !isScatter && riskStats && data.valStart !== undefined && data.valEnd !== undefined) {
        const { mean, median, p25, p75, p95 } = riskStats;
        const s = data.valStart;
        const e = data.valEnd;
        
        if (s <= mean && mean < e) statsInBin.push({ label: t.results.meanRisk, val: mean, color: 'text-blue-600 dark:text-blue-400' });
        if (s <= median && median < e) statsInBin.push({ label: t.results.median, val: median, color: 'text-emerald-600 dark:text-emerald-400' });
        if (s <= p25 && p25 < e) statsInBin.push({ label: 'P25', val: p25, color: 'text-gray-500' });
        if (s <= p75 && p75 < e) statsInBin.push({ label: 'P75', val: p75, color: 'text-gray-500' });
        if (s <= p95 && p95 < e) statsInBin.push({ label: 'P95', val: p95, color: 'text-amber-600 dark:text-amber-400' });
    }
    
    const isSimulations = data.index !== undefined && data.risk !== undefined;
    const activePod = pod || PRELOADED_PODS.efsa_2024;
    const podVal = activePod.valor;

    const currentPercent = isCDF ? (data.risk || 0) : isDensity ? (data.x || 0) : (data.midPoint || 0);
    const currentExposure_ug = isBMDL 
      ? (data.exposure_ug !== undefined ? data.exposure_ug : (currentPercent / 100) * podVal)
      : null;
    const currentMoe = isBMDL && currentExposure_ug !== null && currentExposure_ug > 0 
      ? (podVal / currentExposure_ug) 
      : 999999;
    const podEval = isBMDL ? classifyPoDRisk(activePod, currentMoe) : null;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl text-sm z-50 min-w-[240px] ring-1 ring-black/5 backdrop-blur-md transition-all border-l-4" 
           style={{ borderLeftColor: isBMDL && podEval ? podEval.statusColor : isCDF ? getColor(data.risk, isBMDL) : isDensity ? getColor(data.x, isBMDL) : '#3b82f6' }}
           >
        <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">
          <p className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
            {isCDF ? t.results.cdf : isExposureHistogram ? t.results.exposureHistogram : isExposureDist ? t.results.exposureDist : isDensity ? (isBMDL ? 'Densidad de Exposición' : t.results.density) : isScatter ? t.results.scatter : isSimulations ? t.results.simulations : (isBMDL ? 'Intervalo de Exposición' : label)}
          </p>
          {isCDF && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                isBMDL && podEval 
                  ? (podEval.statusLevel === 'concern' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : podEval.statusLevel === 'safe' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-700')
                  : (data.prob >= 95 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 
                     data.prob >= 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 
                     'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400')
            }`}>
              {isBMDL && podEval ? (podEval.statusLevel === 'concern' ? 'Preocupación' : podEval.statusLevel === 'safe' ? 'Baja Preocupación' : 'Juicio Experto') : (data.prob >= 99 ? 'Extreme Risk' : data.prob >= 95 ? 'High Risk' : data.prob >= 50 ? 'Medium' : 'Low')}
            </span>
          )}
          {isDensity && (
             <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                isBMDL && podEval
                  ? (podEval.statusLevel === 'concern' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : podEval.statusLevel === 'safe' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-700')
                  : (data.percentile >= 95 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 
                     data.percentile >= 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 
                     'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400')
            }`}>
               {isBMDL && podEval 
                 ? `MOE ≈ ${formatNumberES(currentMoe, 1)}`
                 : (getPercentileLabel(data.percentile) || `${data.percentile?.toFixed(1)}% rank`)}
             </span>
          )}
        </div>
        <div className="space-y-3">
          {isCDF ? (
            <>
               <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    {isBMDL ? 'Exposición Estimada:' : `${t.results.risk}:`}
                  </span>
                  <span className="font-black text-gray-900 dark:text-gray-100 text-base">
                    {isBMDL ? `${formatNumberES(currentExposure_ug || 0, 4)} µg/kg pc/d` : `${data.risk?.toFixed(2)}%`}
                  </span>
               </div>
               {isBMDL && (
                 <div className="flex justify-between items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                    <span className="text-gray-500 text-[10px] font-bold uppercase">Margen de Exposición:</span>
                    <span className={`font-mono font-black text-xs ${podEval?.statusLevel === 'concern' ? 'text-red-600' : podEval?.statusLevel === 'safe' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
                      MOE = {formatNumberES(currentMoe, 1)}
                    </span>
                 </div>
               )}
               <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">{t.results.prob}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${data.prob >= 95 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${data.prob}%` }}></div>
                    </div>
                    <span className={`font-black ${data.prob >= 95 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>{data.prob?.toFixed(2)}%</span>
                  </div>
               </div>
               <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800">
                   <p className="text-[10px] text-gray-400 italic leading-tight">
                     {isBMDL
                        ? `El ${data.prob?.toFixed(2)}% de la población presenta una exposición ≤ ${formatNumberES(currentExposure_ug || 0, 4)} µg/kg pc/d`
                        : (language === 'es' 
                            ? `El ${data.prob?.toFixed(2)}% de las simulaciones presentan un riesgo ≤ ${data.risk?.toFixed(2)}%`
                            : `${data.prob?.toFixed(2)}% of simulations have risk ≤ ${data.risk?.toFixed(2)}%`)}
                   </p>
               </div>
            </>
          ) : isDensity ? (
            <>
               <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    {isBMDL ? 'Exposición Dietaria' : (isExposureDist || isExposureHistogram ? 'Exposición' : t.results.risk)}:
                  </span>
                  <span className="font-black text-gray-900 dark:text-gray-100 text-base">
                    {isBMDL 
                      ? `${formatNumberES(currentExposure_ug || 0, 4)} µg/kg pc/d`
                      : (isExposureDist || isExposureHistogram ? (isExposureHistogram ? data.midPoint?.toExponential(3) : data.x?.toExponential(3)) : data.x?.toFixed(2)) + (isExposureDist || isExposureHistogram ? ' mg/kg·d' : '%')}
                  </span>
               </div>
               {isBMDL && (
                 <div className="flex justify-between items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg">
                    <span className="text-gray-500 text-[10px] font-bold uppercase">Margen Exposición:</span>
                    <span className={`font-mono font-black text-xs ${podEval?.statusLevel === 'concern' ? 'text-red-600' : podEval?.statusLevel === 'safe' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
                      MOE ≈ {formatNumberES(currentMoe, 1)}
                    </span>
                 </div>
               )}
               <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">{language === 'es' ? 'RANGO PERCENTIL' : 'PERCENTILE RANK'}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${data.percentile >= 95 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${data.percentile}%` }}></div>
                    </div>
                    <span className={`font-black ${data.percentile >= 95 ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {data.percentile?.toFixed(2)}%
                    </span>
                  </div>
               </div>
               {getPercentileLabel(data.percentile) && (
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-center animate-pulse">
                       <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400">
                           {language === 'es' ? `CERCANO A PERCENTIL ${getPercentileLabel(data.percentile)}` : `NEAR ${getPercentileLabel(data.percentile)} PERCENTILE`}
                       </span>
                   </div>
               )}
            </>
          ) : isScatter ? (
            <>
               <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] mb-0.5 uppercase font-bold tracking-wider">{t.results.inputVal}:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-base">{data.xVal?.toFixed(4)}</span>
               </div>
               <div className="flex flex-col mt-1">
                  <span className="text-gray-500 text-[10px] mb-0.5 uppercase font-bold tracking-wider">{t.results.totalRisk}:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{data.yVal?.toFixed(1)}%</span>
               </div>
            </>
          ) : isSimulations ? (
            <>
               <div className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Simulación:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">#{data.index}</span>
               </div>
               <div className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">P95:</span>
                  <span className="font-bold text-indigo-600">{data.risk?.toFixed(1)}%</span>
               </div>
               <div className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Media:</span>
                  <span className="font-bold text-emerald-600">{data.mean?.toFixed(1)}%</span>
               </div>
               <div className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Mediana:</span>
                  <span className="font-bold text-amber-600">{data.p50?.toFixed(1)}%</span>
               </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-gray-600 dark:text-gray-400 font-medium">{t.results.freq}:</span>
                <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-gray-100 block">{data.count}</span>
                    {countPercentage && (
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-tighter">({countPercentage}% total)</span>
                    )}
                </div>
              </div>
              
              {data.midPoint !== undefined && (
                 <div className="flex justify-between gap-4">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {isBMDL ? 'Intervalo Exposición:' : `${t.results.range}:`}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-xs font-bold bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {isBMDL 
                          ? `${formatNumberES(data.exposureStart_ug !== undefined ? data.exposureStart_ug : (data.valStart / 100) * podVal, 3)} - ${formatNumberES(data.exposureEnd_ug !== undefined ? data.exposureEnd_ug : (data.valEnd / 100) * podVal, 3)} µg/kg·d`
                          : `${data.valStart?.toFixed(1)}% - ${data.valEnd?.toFixed(1)}%`}
                    </span>
                 </div>
              )}

              {isBMDL && (
                 <div className="flex justify-between items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg mt-1">
                    <span className="text-gray-500 text-[10px] font-bold uppercase">MOE Estimado:</span>
                    <span className={`font-mono font-black text-xs ${podEval?.statusLevel === 'concern' ? 'text-red-600' : podEval?.statusLevel === 'safe' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
                      MOE ≈ {formatNumberES(currentMoe, 1)}
                    </span>
                 </div>
              )}

              {!isBMDL && statsInBin.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.results.contains}:</p>
                      {statsInBin.map((stat, i) => (
                          <div key={i} className={`text-xs font-bold flex justify-between ${stat.color}`}>
                              <span>{stat.label}</span>
                              <span>{stat.val.toFixed(1)}%</span>
                          </div>
                      ))}
                  </div>
              )}

              {!isBMDL && data.valStart <= 100 && data.valEnd > 100 && (
                <div className="mt-2 p-1.5 bg-red-50 dark:bg-red-900/20 rounded text-center">
                    <p className="text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1">
                    ⚠️ {t.results.refVal}
                    </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const fmtExp = (val: number) => {
    if (val === 0) return '0';
    return val.toFixed(5);
};

interface SensitivityItem {
    id: string;
    foodName: string;
    type: 'conc' | 'cons';
    pearson: number;
    name: string; // Display name for charts
}

const ResultsPanel: React.FC<Props> = ({ results, onRunCorrelation, onBack, inputSummary, language }) => {
  const t = TRANSLATIONS[language];
  const [showDetails, setShowDetails] = useState(false);
  const [chartView, setChartView] = useState<'histogram' | 'density' | 'cdf' | 'comparison' | 'moeDist' | 'scatter' | 'tornado' | 'sensitivity' | 'simulations' | 'convergence' | 'exposureDist' | 'exposureHistogram' | 'correlation' | 'matrix' | 'stats' | 'recommendations' | 'summary'>(
    results?.refValueType === 'bmdl' ? 'moeDist' : 'histogram'
  );
  const [moeSubView, setMoeSubView] = useState<'tiers' | 'cdf'>('tiers');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scatterVariable, setScatterVariable] = useState<string>('');
  const [matrixFood, setMatrixFood] = useState<string>('');

  useEffect(() => {
    if (results?.simulationData?.foodInputs && results.simulationData.foodInputs.length > 0) {
      if (!scatterVariable) setScatterVariable(`${results.simulationData.foodInputs[0].id}|conc`);
      if (!matrixFood) setMatrixFood(results.simulationData.foodInputs[0].id || '');
    }
  }, [results, scatterVariable, matrixFood]);

  // Synchronize chartView whenever simulation results change:
  // Carcinogens (bmdl) MUST use moeDist (MOE distribution curve)
  // Non-carcinogens (adi) MUST NOT use moeDist and MUST use standard histogram
  useEffect(() => {
    if (results?.refValueType === 'bmdl') {
      setChartView('moeDist');
    } else {
      setChartView(prev => prev === 'moeDist' ? 'histogram' : prev);
    }
  }, [results?.refValueType, results?.pod?.key]);

  const panelRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const sensitivityRef = useRef<HTMLDivElement>(null);
  const contributionRef = useRef<HTMLDivElement>(null);
  const statsTableRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const summaryDensityRef = useRef<HTMLDivElement>(null);
  const summarySensitivityRef = useRef<HTMLDivElement>(null);
  const moeDistRef = useRef<HTMLDivElement>(null);
  
  const captureElement = async (element: HTMLElement | null, filename: string) => {
    if (!element) return;
    setIsExporting(true);
    
    // Give a small delay to ensure React has re-rendered the charts with isAnimationActive={false}
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc, el) => {
          if (el) {
            el.classList.remove('dark');
            // Ensure all children also lose dark mode for the capture
            el.querySelectorAll('.dark').forEach(node => node.classList.remove('dark'));
            
            // Hide all export buttons in the clone
            el.querySelectorAll('button').forEach(btn => {
              if (btn.querySelector('svg')) { // Heuristic for export buttons
                 btn.style.display = 'none';
              }
            });

            el.style.backgroundColor = '#ffffff';
            el.style.padding = '20px';
            
            // Force the captured element to have the same dimensions as the original
            // especially important for ResponsiveContainer which collapses to 0 if its parent has no height
            el.style.width = element.offsetWidth + 'px';
            el.style.height = element.offsetHeight + 'px';
            el.style.display = 'block';
            el.style.overflow = 'visible';

            // If we are capturing the chart area, ensure it has a reasonable minimum height
            if (el.classList.contains('h-full')) {
              el.style.height = (element.offsetHeight || 450) + 'px';
            }
          }
        }
      });
      
      if (!canvas) {
        throw new Error("Canvas generation failed");
      }

      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting:", error);
      alert(language === 'es' ? "Error al exportar la imagen. Por favor, inténtelo de nuevo." : "Error exporting image. Please try again.");
    }
    setIsExporting(false);
  };

  const handleExportPNG = () => captureElement(panelRef.current, 'reporte_completo');

  const handleExportPDF = async () => {
    if (!panelRef.current) return;
    setIsExporting(true);
    
    // Give a small delay to ensure React has re-rendered the charts with isAnimationActive={false}
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(panelRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, el) => {
           if (el) {
             el.classList.remove('dark');
             el.querySelectorAll('.dark').forEach(node => node.classList.remove('dark'));
             
             // Hide all export buttons in the clone
             el.querySelectorAll('button').forEach(btn => {
               if (btn.querySelector('svg')) {
                  btn.style.display = 'none';
               }
             });

             el.style.backgroundColor = '#ffffff';
             el.style.padding = '20px';
             el.style.width = panelRef.current!.offsetWidth + 'px';
             el.style.height = 'auto';
             el.style.overflow = 'visible';
           }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reporte_riesgo_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error PDF export:", error);
      alert(language === 'es' ? "Error al exportar el PDF. Por favor, inténtelo de nuevo." : "Error exporting PDF. Please try again.");
    }
    setIsExporting(false);
  };

  const handleExportSummaryPDF = async () => {
    if (!summaryRef.current || !safeRiskStats) return;
    setIsExporting(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // 1. Capture Density Chart
      const densityCanvas = await html2canvas(summaryDensityRef.current!, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        onclone: (clonedDoc, el) => {
          if (el) {
             el.classList.remove('dark');
             el.querySelectorAll('.dark').forEach(node => node.classList.remove('dark'));
          }
        }
      });
      const densityImg = densityCanvas.toDataURL('image/png');

      // 2. Capture Sensitivity Chart
      const sensitivityCanvas = await html2canvas(summarySensitivityRef.current!, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        onclone: (clonedDoc, el) => {
          if (el) {
             el.classList.remove('dark');
             el.querySelectorAll('.dark').forEach(node => node.classList.remove('dark'));
          }
        }
      });
      const sensitivityImg = sensitivityCanvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Title
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(language === 'es' ? 'INFORME DE EVALUACIÓN DE RIESGO' : 'RISK ASSESSMENT REPORT', margin, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`${language === 'es' ? 'Fecha de Generación' : 'Generation Date'}: ${new Date().toLocaleDateString()}`, margin, 32);

      // Input Summary Section
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(margin, 40, contentWidth, 35, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.setFont('helvetica', 'bold');
      pdf.text(language === 'es' ? 'Parámetros de Entrada' : 'Input Parameters', margin + 5, 48);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`${language === 'es' ? 'Sustancia Química' : 'Chemical Substance'}: ${inputSummary?.chemical || 'N/A'}`, margin + 5, 55);
      pdf.text(`${language === 'es' ? 'Valor de Referencia (ADI/TDI)' : 'Reference Value (ADI/TDI)'}: ${inputSummary?.adi || 'N/A'}`, margin + 5, 62);
      pdf.text(`${language === 'es' ? 'Simulaciones (Iteraciones)' : 'Simulations (Iterations)'}: ${inputSummary?.iterations || 'N/A'}`, margin + 5, 69);
      if (uncertainty) {
        pdf.text(`${language === 'es' ? 'Nivel de Confianza (Incertidumbre)' : 'Confidence Level (Uncertainty)'}: ${(uncertainty.confidenceLevel * 100).toFixed(0)}%`, margin + 80, 69);
      }

      // Key Metrics Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(language === 'es' ? 'Métricas Clave' : 'Key Metrics', margin, 85);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let chartStartY = 105;

      if (results?.refValueType === 'bmdl') {
        const activePdfPod = results.pod || PRELOADED_PODS.efsa_2024;
        const pdfPodVal = activePdfPod.valor;
        const p95_ug = ((safeRiskStats.p95 || 0) / 100) * pdfPodVal;
        const mean_ug = ((safeRiskStats.mean || 0) / 100) * pdfPodVal;
        const p99_ug = ((safeRiskStats.p99 || 0) / 100) * pdfPodVal;
        const moeP95Val = p95_ug > 0 ? (pdfPodVal / p95_ug) : 999999;
        const moeMeanVal = mean_ug > 0 ? (pdfPodVal / mean_ug) : 999999;
        const moeP99Val = p99_ug > 0 ? (pdfPodVal / p99_ug) : 999999;
        const riskEval = classifyPoDRisk(activePdfPod, moeP95Val);

        pdf.text(`Exposición Media: ${formatNumberES(mean_ug, 4)} µg/kg pc/d (MOE: ${formatNumberES(moeMeanVal, 1)})`, margin, 92);
        pdf.text(`Exposición P95: ${formatNumberES(p95_ug, 4)} µg/kg pc/d (MOE: ${formatNumberES(moeP95Val, 1)})`, margin + 65, 92);
        pdf.text(`Exposición P99: ${formatNumberES(p99_ug, 4)} µg/kg pc/d (MOE: ${formatNumberES(moeP99Val, 1)})`, margin + 130, 92);

        // Bases de la caracterización del riesgo (Requirement 8)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text('Bases de la Caracterización del Riesgo (Trazabilidad)', margin, 100);
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, 103, contentWidth, 23, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        pdf.text(`• Punto de Partida (PoD): ${activePdfPod.tipo_BMR} = ${activePdfPod.valor} ${activePdfPod.unidad} (${activePdfPod.organismo_y_año}, ${activePdfPod.origen_datos === 'humano_epidemiologico' ? 'humano' : 'animal'}) | Efecto: ${activePdfPod.efecto_critico}`, margin + 3, 108);
        pdf.text(`• Criterio MOE: ${riskEval.criterionUsed} (${riskEval.bibliographicSource})`, margin + 3, 114);
        pdf.text(`• Conclusión P95: ${riskEval.category} | Modelo: ${uncertainty ? '2D' : '1D'} (${totalSamples.toLocaleString('es-ES')} iteraciones) | Supuesto: 100% bioaccesibilidad`, margin + 3, 120);

        chartStartY = 132;
      } else {
        pdf.text(`${language === 'es' ? 'Riesgo Medio' : 'Mean Risk'}: ${(safeRiskStats.mean || 0).toFixed(1)}%`, margin, 92);
        pdf.text(`${language === 'es' ? 'Percentil 95 (P95)' : '95th Percentile (P95)'}: ${(safeRiskStats.p95 || 0).toFixed(1)}%`, margin + 60, 92);
        pdf.text(`${language === 'es' ? 'Prob. Excedencia' : 'Exceedance Prob.'}: ${(safeRiskStats.exceedanceProb || 0).toFixed(2)}%`, margin + 120, 92);
      }

      // Risk Distribution Chart (captured)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(language === 'es' ? 'Distribución de la Exposición / Riesgo' : 'Exposure / Risk Distribution', margin, chartStartY);
      const densityProps = pdf.getImageProperties(densityImg);
      const densityHeight = Math.min(65, (densityProps.height * contentWidth) / densityProps.width);
      pdf.addImage(densityImg, 'PNG', margin, chartStartY + 4, contentWidth, densityHeight);

      // Sensitivity Analysis (captured)
      let currentY = chartStartY + 4 + densityHeight + 12;
      if (currentY > 230) { pdf.addPage(); currentY = 25; }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(language === 'es' ? 'Análisis de Sensibilidad' : 'Sensitivity Analysis', margin, currentY);
      currentY += 5;
      const sensitivityProps = pdf.getImageProperties(sensitivityImg);
      const sensitivityHeight = (sensitivityProps.height * contentWidth) / sensitivityProps.width;
      pdf.addImage(sensitivityImg, 'PNG', margin, currentY, contentWidth, sensitivityHeight);

      // Food Contributions Section
      currentY += sensitivityHeight + 15;
      if (currentY > 230) { pdf.addPage(); currentY = 25; }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(language === 'es' ? 'Principales Alimentos Contribuyentes' : 'Main Food Contributors', margin, currentY);
      currentY += 8;

      pdf.setFontSize(9);
      contributionData.slice(0, 10).forEach((item: any) => {
          if (currentY > 275) { pdf.addPage(); currentY = 25; }
          
          if (item.isHighRisk) {
              pdf.setFillColor(254, 242, 242); // red-50
              pdf.rect(margin, currentY - 5, contentWidth, 8, 'F');
              pdf.setTextColor(185, 28, 28); // red-700
              pdf.setFont('helvetica', 'bold');
              pdf.text(`[ALERTA] ${item.name}`, margin + 2, currentY);
          } else {
              pdf.setTextColor(71, 85, 105); // slate-600
              pdf.setFont('helvetica', 'normal');
              pdf.text(item.name, margin + 2, currentY);
          }
          
          pdf.text(`${item.percentage.toFixed(1)}%`, pageWidth - margin - 20, currentY, { align: 'right' });
          currentY += 8;
      });

      // Recommendations Section
      currentY += 10;
      if (currentY > 230) { pdf.addPage(); currentY = 25; }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(language === 'es' ? 'Recomendaciones del Sistema' : 'System Recommendations', margin, currentY);
      currentY += 8;

      pdf.setFontSize(9);
      recommendations.forEach((rec: any) => {
          if (currentY > 270) { pdf.addPage(); currentY = 25; }
          
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(rec.type === 'critical' ? 185 : 51, rec.type === 'critical' ? 28 : 65, rec.type === 'critical' ? 28 : 85);
          pdf.text(`• ${rec.title}:`, margin, currentY);
          currentY += 5;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          const splitDesc = pdf.splitTextToSize(rec.desc, contentWidth - 5);
          pdf.text(splitDesc, margin + 5, currentY);
          currentY += (splitDesc.length * 4) + 5;
      });

      pdf.save(`informe_resumen_${inputSummary?.chemical || 'quimico'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error Summary PDF export:", error);
      alert(language === 'es' ? "Error al exportar el informe. Por favor, inténtelo de nuevo." : "Error exporting report. Please try again.");
    }
    setIsExporting(false);
  };
  
  const { 
    chartData, cdfData, densityData, exposureDensityData, exposureHistogramData, 
    refBin, safeRiskStats, safeRefValue, totalSamples, sensitivityData, simulationsData, 
    contributionData, correlationMatrix, matrixData, variableNames,
    moeTiersData, moeCdfPoints, pctBelowSafety, pctSafe, activeThreshold, countBelowThreshold, totalValid
  } = useMemo(() => {
    if (!results || !results.riskDistribution || results.riskDistribution.length === 0) {
      return { 
        chartData: [], cdfData: [], densityData: [], exposureDensityData: [], exposureHistogramData: [], 
        refBin: null, safeRiskStats: null, safeRefValue: 0, totalSamples: 0, sensitivityData: [], 
        simulationsData: [], contributionData: [], correlationMatrix: [], matrixData: [], variableNames: [],
        moeTiersData: [], moeCdfPoints: [], pctBelowSafety: 0, pctSafe: 100, activeThreshold: 10000, countBelowThreshold: 0, totalValid: 0
      };
    }

    const safeDistribution = results.riskDistribution.filter(n => Number.isFinite(n));
    if (safeDistribution.length === 0) {
       return { 
         chartData: [], cdfData: [], densityData: [], exposureDensityData: [], exposureHistogramData: [], 
         refBin: null, safeRiskStats: results.riskStats, safeRefValue: results.normalizedRefValue, totalSamples: 0, 
         sensitivityData: [], simulationsData: [], contributionData: [], correlationMatrix: [], matrixData: [], variableNames: [],
         moeTiersData: [], moeCdfPoints: [], pctBelowSafety: 0, pctSafe: 100, activeThreshold: 10000, countBelowThreshold: 0, totalValid: 0
       };
    }

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < safeDistribution.length; i++) {
        const val = safeDistribution[i];
        if (val < min) min = val;
        if (val > max) max = val;
    }
    const range = max - min === 0 ? 1 : max - min;
    const n = safeDistribution.length;

    const iqr = (results.riskStats.p75 || 0) - (results.riskStats.p25 || 0);
    let numBins = iqr > 0 ? Math.ceil(range / (2 * iqr / Math.pow(n, 1/3))) : Math.ceil(1 + Math.log2(n));
    if (!numBins || !Number.isFinite(numBins) || numBins <= 0) numBins = 10;
    numBins = Math.max(5, Math.min(80, numBins));

    const activePod = results?.pod || PRELOADED_PODS.efsa_2024;
    const podVal = activePod.valor;
    const isBMDLMode = results?.refValueType === 'bmdl';

    const step = range / numBins;
    const bins = Array.from({ length: numBins }, (_, i) => {
        const valStart = min + i * step;
        const valEnd = min + (i + 1) * step;
        const midPoint = (valStart + valEnd) / 2;
        const exposure_ug = (midPoint / 100) * podVal;
        const exposureStart_ug = (valStart / 100) * podVal;
        const exposureEnd_ug = (valEnd / 100) * podVal;
        return {
            name: isBMDLMode 
              ? `${formatNumberES(exposureStart_ug, 3)}-${formatNumberES(exposureEnd_ug, 3)} µg/kg·d`
              : `${valStart.toFixed(0)}-${valEnd.toFixed(0)}%`,
            valStart,
            valEnd,
            midPoint,
            exposure_ug,
            exposureStart_ug,
            exposureEnd_ug,
            count: 0
        };
    });

    safeDistribution.forEach(val => {
      let idx = Math.floor((val - min) / step);
      idx = Math.min(idx, numBins - 1);
      if (idx >= 0 && bins[idx]) bins[idx].count++;
    });

    const sorted = new Float64Array(safeDistribution).sort();
    const cData = [];
    const cStep = Math.max(1, Math.floor(sorted.length / 100)); 
    for (let i = 0; i < sorted.length; i += cStep) {
      cData.push({ 
        risk: sorted[i], 
        prob: (i / sorted.length) * 100,
        exposure_ug: (sorted[i] / 100) * podVal
      });
    }
    if(sorted.length > 0) cData.push({ 
      risk: sorted[sorted.length - 1], 
      prob: 100,
      exposure_ug: (sorted[sorted.length - 1] / 100) * podVal 
    });

    const dData = [];
    if (n > 5) {
        const mean = safeDistribution.reduce((a, b) => a + b, 0) / n;
        const variance = safeDistribution.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const h = 1.06 * (stdDev || 1) * Math.pow(n, -0.2);
        const bandwidth = h || range / 20;
        const densitySteps = 80; 
        const startX = min - bandwidth * 3;
        const endX = max + bandwidth * 3;
        const totalRange = endX - startX;
        const dStep = totalRange / densitySteps;
        
        const sampleN = n > 5000 ? 5000 : n;
        const skip = Math.floor(n / sampleN);
        const samples = [];
        for (let j = 0; j < n; j += skip) samples.push(safeDistribution[j]);

        for (let i = 0; i <= densitySteps; i++) {
            const x = startX + i * dStep;
            let kSum = 0;
            for (let j = 0; j < samples.length; j++) {
              kSum += kernelGaussian((x - samples[j]) / bandwidth);
            }
            
            // Calculate percentile rank for this x value
            let left = 0, right = sorted.length - 1;
            while(left <= right) {
                let mid = Math.floor((left + right) / 2);
                if (sorted[mid] < x) left = mid + 1;
                else right = mid - 1;
            }
            const percentile = (left / sorted.length) * 100;

            dData.push({ 
                x, 
                exposure_ug: (x / 100) * podVal,
                density: kSum / (samples.length * bandwidth),
                percentile 
            });
        }
    }

    const rBin = bins.find(bin => 100 >= bin.valStart && 100 < bin.valEnd);

    // Prepare simulations data for the simulations view
    const simulationsData = Array.isArray(results.allSimulationResults) ? results.allSimulationResults.map((res, idx) => ({
      index: idx + 1,
      risk: res.p95,
      p50: res.p50,
      p99: res.p99,
      mean: res.mean
    })) : [];

    // Calculate Sensitivity (Pearson / Spearman rank correlation)
    const sensData: SensitivityItem[] = [];
    if (results.simulationData) {
        const totalExp = results.simulationData.totalExposureSamples;
        const chemName = inputSummary?.chemical || 'contaminante';
        const chemLower = chemName.toLowerCase();
        const chemShort = chemLower.includes('ars') ? 'iAs'
          : chemLower.includes('aflatox') ? 'AFB1'
          : chemLower.includes('acrilam') ? 'AA'
          : chemLower.includes('ocratox') ? 'OTA'
          : chemName;
        results.simulationData.foodInputs.forEach(food => {
            sensData.push({ 
                id: `${food.id}-conc`,
                foodName: food.name,
                type: 'conc',
                pearson: calculatePearsonCorrelation(food.concSamples, totalExp),
                name: `Concentración de ${chemShort} en ${food.name}`
            });
            sensData.push({ 
                id: `${food.id}-cons`,
                foodName: food.name,
                type: 'cons',
                pearson: calculatePearsonCorrelation(food.consSamples, totalExp),
                name: `Consumo de ${food.name}`
            });
        });
        sensData.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson));
    }

    const contributionData = ((results.meanContributions?.map(c => {
        const individualRisk = (c.percentage / 100) * (results.riskStats.p95 || 0);
        return {
            name: c.name,
            percentage: c.percentage,
            individualRisk,
            isHighRisk: individualRisk > 100
        };
    }) || []) as { name: string; percentage: number; individualRisk: number; isHighRisk: boolean }[])
    .filter(c => c.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

    // Correlation Matrix calculation
    const matrix: any[] = [];
    let finalVariableNames: string[] = [];
    if (results.simulationData && results.simulationData.foodInputs.length > 1) {
        const foods = results.simulationData.foodInputs;
        const nFoods = foods.length;
        const bodyWeights = results.simulationData?.bodyWeightSamples;
        if (!bodyWeights) return { chartData: [], cdfData: [], densityData: [], exposureDensityData: [], refBin: null, safeRiskStats: null, safeRefValue: 0, totalSamples: 0, sensitivityData: [], simulationsData: [], contributionData: [], correlationMatrix: [], matrixData: [], variableNames: [] };
        
        const individualExposures = results.simulationData.foodExposureSamples && results.simulationData.foodExposureSamples.length === nFoods
            ? results.simulationData.foodExposureSamples
            : foods.map(food => {
                const normConcUnit = food.concentrationUnit || 'mg/kg';
                const normConsUnit = food.consumptionUnit || 'g/día';
                return food.concSamples.map((c, i) => {
                    const normC = normalizeConcentration(c, normConcUnit);
                    const normCons = normalizeConsumption(food.consSamples[i], normConsUnit);
                    return (normC * normCons) / (bodyWeights[i] || 70);
                });
            });
 
        // Include Total Risk for a more complete matrix
        const variables = [
            ...foods.map((f, idx) => {
                const isDuplicate = foods.filter(food => food.name === f.name).length > 1;
                return { 
                    name: isDuplicate ? `${f.name} (${idx + 1})` : f.name, 
                    data: individualExposures[idx] 
                };
            }),
            { name: t.results.risk, data: results.riskDistribution }
        ];
        finalVariableNames = variables.map(v => v.name);
        const nVars = variables.length;

        for (let i = 0; i < nVars; i++) {
            for (let j = 0; j < nVars; j++) {
                const corr = i === j ? 1 : calculatePearsonCorrelation(variables[i].data, variables[j].data);
                matrix.push({
                    x: variables[i].name,
                    y: variables[j].name,
                    xi: i,
                    yj: j,
                    correlation: corr,
                    value: corr.toFixed(3)
                });
            }
        }
    }

    // Heatmap Matrix calculation
    const matrixData: any[] = [];
    if (results.simulationData && matrixFood) {
        const food = results.simulationData.foodInputs.find(f => f.id === matrixFood);
        const totalRiskDist = results.riskDistribution;
        if (food && totalRiskDist) {
            const nSamples = food.concSamples.length;
            const nBins = 10;
            
            let minConc = Infinity, maxConc = -Infinity;
            let minCons = Infinity, maxCons = -Infinity;
            
            for(let i=0; i<nSamples; i++) {
                if (food.concSamples[i] < minConc) minConc = food.concSamples[i];
                if (food.concSamples[i] > maxConc) maxConc = food.concSamples[i];
                if (food.consSamples[i] < minCons) minCons = food.consSamples[i];
                if (food.consSamples[i] > maxCons) maxCons = food.consSamples[i];
            }
            
            const stepConc = (maxConc - minConc) / nBins;
            const stepCons = (maxCons - minCons) / nBins;
            
            const grid = Array.from({ length: nBins }, () => 
                Array.from({ length: nBins }, () => ({ sumRisk: 0, count: 0 }))
            );
            
            for(let i=0; i<nSamples; i++) {
                let ix = Math.floor((food.concSamples[i] - minConc) / stepConc);
                let iy = Math.floor((food.consSamples[i] - minCons) / stepCons);
                ix = Math.min(ix, nBins - 1);
                iy = Math.min(iy, nBins - 1);
                if (ix >= 0 && iy >= 0) {
                    grid[ix][iy].sumRisk += totalRiskDist[i];
                    grid[ix][iy].count += 1;
                }
            }
            
            for(let ix=0; ix<nBins; ix++) {
                for(let iy=0; iy<nBins; iy++) {
                    const avgRisk = grid[ix][iy].count > 0 ? grid[ix][iy].sumRisk / grid[ix][iy].count : 0;
                    matrixData.push({
                        conc: minConc + (ix + 0.5) * stepConc,
                        cons: minCons + (iy + 0.5) * stepCons,
                        risk: avgRisk,
                        count: grid[ix][iy].count
                    });
                }
            }
        }
    }

    // --- MOE Distribution for Carcinogenic & Benchmark Dose Risk Assessment (ONLY when isBMDLMode) ---
    let activeThreshold = 10000;
    let countBelowThreshold = 0;
    let totalValid = 0;
    let pctBelowSafety = 0;
    let pctSafe = 100;
    let moeTiersData: {
      name: string;
      label: string;
      count: number;
      percentage: number;
      cumulativeBelow: number;
      fill: string;
      status: 'concern' | 'safe' | 'critical' | 'expert';
      interpretation: string;
    }[] = [];
    let moeCdfPoints: {
      moe: number;
      probBelow: number;
      exposure_ug: number;
      isConcern: boolean;
    }[] = [];

    if (isBMDLMode) {
      activeThreshold = (activePod.origen_datos === 'animal_experimental' && activePod.tipo_BMR.toUpperCase() === 'BMDL10')
        ? 10000
        : (activePod.key === 'efsa_2024' || (activePod.organismo_y_año.includes('EFSA 2024') && activePod.tipo_BMR.toUpperCase() === 'BMDL05'))
          ? 1
          : 10000;

      const validRisks = safeDistribution.filter(r => r > 0);
      totalValid = validRisks.length;

    if (activeThreshold === 10000) {
      // EFSA 2005 criterion for animal BMDL10 (e.g. Aflatoxins, Acrylamide, Ochratoxin A)
      let cTier1 = 0; // < 1.000
      let cTier2 = 0; // 1.000 - 10.000
      let cTier3 = 0; // 10.000 - 50.000
      let cTier4 = 0; // > 50.000

      for (let i = 0; i < totalValid; i++) {
        const r = validRisks[i];
        const moe = 100 / r;
        if (moe < 1000) {
          cTier1++;
          countBelowThreshold++;
        } else if (moe < 10000) {
          cTier2++;
          countBelowThreshold++;
        } else if (moe < 50000) {
          cTier3++;
        } else {
          cTier4++;
        }
      }

      const pTier1 = totalValid > 0 ? (cTier1 / totalValid) * 100 : 0;
      const pTier2 = totalValid > 0 ? (cTier2 / totalValid) * 100 : 0;
      const pTier3 = totalValid > 0 ? (cTier3 / totalValid) * 100 : 0;
      const pTier4 = totalValid > 0 ? (cTier4 / totalValid) * 100 : 0;

      moeTiersData = [
        {
          name: '< 1.000',
          label: 'MOE < 1.000 (Preocupación Alta)',
          count: cTier1,
          percentage: pTier1,
          cumulativeBelow: pTier1,
          fill: '#b91c1c',
          status: 'critical',
          interpretation: 'Exposición elevada. Alta prioridad para la gestión de riesgos según EFSA.'
        },
        {
          name: '1.000 - 10.000',
          label: 'MOE 1.000 - 10.000 (Preocupación EFSA)',
          count: cTier2,
          percentage: pTier2,
          cumulativeBelow: pTier1 + pTier2,
          fill: '#ef4444',
          status: 'concern',
          interpretation: 'No puede descartarse preocupación (criterio EFSA 2005). Prioridad para la gestión del riesgo.'
        },
        {
          name: '10.000 - 50.000',
          label: 'MOE 10.000 - 50.000 (Baja Preocupación)',
          count: cTier3,
          percentage: pTier3,
          cumulativeBelow: pTier1 + pTier2 + pTier3,
          fill: '#10b981',
          status: 'safe',
          interpretation: 'Baja preocupación para la salud pública. Cumple el criterio de seguridad EFSA (MOE ≥ 10.000).'
        },
        {
          name: '> 50.000',
          label: 'MOE > 50.000 (Margen Amplio)',
          count: cTier4,
          percentage: pTier4,
          cumulativeBelow: 100,
          fill: '#059669',
          status: 'safe',
          interpretation: 'Margen de exposición muy amplio respecto al BMDL10. Riesgo despreciable.'
        }
      ];
    } else {
      // Human epidemiological data (BMDL05) EFSA 2024 (e.g. inorganic arsenic)
      let cTier1 = 0; // <= 1
      let cTier2 = 0; // 1 - 5
      let cTier3 = 0; // 5 - 10
      let cTier4 = 0; // > 10

      for (let i = 0; i < totalValid; i++) {
        const r = validRisks[i];
        const moe = 100 / r;
        if (moe <= 1) {
          cTier1++;
          countBelowThreshold++;
        } else if (moe <= 5) {
          cTier2++;
        } else if (moe <= 10) {
          cTier3++;
        } else {
          cTier4++;
        }
      }

      const pTier1 = totalValid > 0 ? (cTier1 / totalValid) * 100 : 0;
      const pTier2 = totalValid > 0 ? (cTier2 / totalValid) * 100 : 0;
      const pTier3 = totalValid > 0 ? (cTier3 / totalValid) * 100 : 0;
      const pTier4 = totalValid > 0 ? (cTier4 / totalValid) * 100 : 0;

      moeTiersData = [
        {
          name: '≤ 1',
          label: 'MOE ≤ 1 (Preocupación EFSA 2024)',
          count: cTier1,
          percentage: pTier1,
          cumulativeBelow: pTier1,
          fill: '#ef4444',
          status: 'concern',
          interpretation: 'Exposición mayor o igual al BMDL05 epidemiológico. Preocupación para la salud pública.'
        },
        {
          name: '1 - 5',
          label: 'MOE 1 - 5 (Juicio Experto)',
          count: cTier2,
          percentage: pTier2,
          cumulativeBelow: pTier1 + pTier2,
          fill: '#f59e0b',
          status: 'expert',
          interpretation: 'MOE superior al punto de referencia; requiere juicio experto según EFSA 2024.'
        },
        {
          name: '5 - 10',
          label: 'MOE 5 - 10 (Margen Moderado)',
          count: cTier3,
          percentage: pTier3,
          cumulativeBelow: pTier1 + pTier2 + pTier3,
          fill: '#3b82f6',
          status: 'safe',
          interpretation: 'Margen moderado respecto al punto de partida epidemiológico.'
        },
        {
          name: '> 10',
          label: 'MOE > 10 (Margen Amplio)',
          count: cTier4,
          percentage: pTier4,
          cumulativeBelow: 100,
          fill: '#10b981',
          status: 'safe',
          interpretation: 'Margen amplio respecto al punto de partida epidemiológico.'
        }
      ];
    }

      pctBelowSafety = totalValid > 0 ? (countBelowThreshold / totalValid) * 100 : 0;
      pctSafe = Math.max(0, 100 - pctBelowSafety);

      // Cumulative Distribution Function (CDF) of MOE
      const moeValues = new Float64Array(totalValid);
      for (let i = 0; i < totalValid; i++) {
        moeValues[i] = 100 / validRisks[i];
      }
      moeValues.sort();

      const cdfSteps = 100;
      const stepSize = Math.max(1, Math.floor(totalValid / cdfSteps));
      for (let i = 0; i < totalValid; i += stepSize) {
        const m = moeValues[i];
        const probBelow = ((i + 1) / totalValid) * 100;
        const exposure_ug = m > 0 ? (podVal / m) : 0;
        moeCdfPoints.push({
          moe: parseFloat(m.toFixed(1)),
          probBelow: parseFloat(probBelow.toFixed(2)),
          exposure_ug: parseFloat(exposure_ug.toFixed(4)),
          isConcern: m < activeThreshold
        });
      }
      if (totalValid > 0) {
        const lastM = moeValues[totalValid - 1];
        moeCdfPoints.push({
          moe: parseFloat(lastM.toFixed(1)),
          probBelow: 100,
          exposure_ug: lastM > 0 ? parseFloat((podVal / lastM).toFixed(4)) : 0,
          isConcern: lastM < activeThreshold
        });
      }
    }

    return { 
        chartData: bins, 
        cdfData: cData, 
        densityData: dData, 
        exposureDensityData: dData.map(d => ({ 
            x: (d.x / 100) * results.normalizedRefValue, 
            density: d.density * (100 / results.normalizedRefValue),
            percentile: d.percentile
        })),
        exposureHistogramData: (() => {
            const exposureDistribution = results.simulationData?.totalExposureSamples || [];
            if (exposureDistribution.length === 0) return [];
            
            let expMin = Infinity;
            let expMax = -Infinity;
            for (let i = 0; i < exposureDistribution.length; i++) {
                const val = exposureDistribution[i];
                if (val < expMin) expMin = val;
                if (val > expMax) expMax = val;
            }
            const expRange = expMax - expMin === 0 ? 1 : expMax - expMin;
            const expStep = expRange / numBins;
            const bins = Array.from({ length: numBins }, (_, i) => {
                const valStart = expMin + i * expStep;
                const valEnd = expMin + (i + 1) * expStep;
                return {
                    name: `${valStart.toExponential(1)}-${valEnd.toExponential(1)}`,
                    valStart,
                    valEnd,
                    midPoint: (valStart + valEnd) / 2,
                    count: 0
                };
            });

            exposureDistribution.forEach(val => {
                let idx = Math.floor((val - expMin) / expStep);
                idx = Math.min(idx, numBins - 1);
                if (idx >= 0 && bins[idx]) bins[idx].count++;
            });
            return bins;
        })(),
        refBin: rBin,
        safeRiskStats: results.riskStats,
        safeRefValue: results.normalizedRefValue,
        totalSamples: n,
        sensitivityData: sensData,
        simulationsData,
        contributionData,
        correlationMatrix: matrix,
        matrixData,
        variableNames: finalVariableNames,
        moeTiersData,
        moeCdfPoints,
        pctBelowSafety,
        pctSafe,
        activeThreshold,
        countBelowThreshold,
        totalValid
    };
  }, [results, language, t, matrixFood]);

  const recommendations = useMemo(() => {
    if (!safeRiskStats || !results || !sensitivityData.length) return [];
    const items = [];
    
    // Critical Risk
    if (safeRiskStats.p95 > 100) {
        const reductionNeeded = ((1 - (100 / safeRiskStats.p95)) * 100).toFixed(1);
        
        // Find specific high risk foods from contributionData
        const highRiskFoods = contributionData.filter(c => c.isHighRisk);
        
        let desc = "";
        if (highRiskFoods.length > 0) {
            const foodNames = highRiskFoods.map(f => f.name).join(', ');
            desc = language === 'es'
                ? `ALERTA CRÍTICA: Se ha identificado que ${highRiskFoods.length === 1 ? 'el alimento' : 'los alimentos'} [${foodNames}] superan individualmente el valor de seguridad. Se requiere reducir la concentración de residuos en estas fuentes en al menos un ${reductionNeeded}% para mitigar el riesgo al percentil 95.`
                : `CRITICAL ALERT: ${highRiskFoods.length === 1 ? 'The food item' : 'Food items'} [${foodNames}] have been identified as individually exceeding the safety value. A reduction of at least ${reductionNeeded}% in residue concentration from these sources is required to mitigate P95 risk.`;
        } else {
            const topDriver = sensitivityData.length > 0 ? sensitivityData[0] : null;
            if (topDriver) {
                desc = language === 'es'
                    ? `Se requiere reducir la concentración del plaguicida en ${topDriver.foodName} en al menos un ${reductionNeeded}% (o limitar proporcionalmente su consumo) para que el riesgo al P95 no supere el 100% del ADI/BMDL.`
                    : `A reduction of at least ${reductionNeeded}% in the pesticide concentration in ${topDriver.foodName} (or a proportional consumption limit) is required to ensure P95 risk stays below 100% of the ADI/BMDL.`;
            } else {
                desc = language === 'es' 
                    ? `Se requiere una reducción de al menos el ${reductionNeeded}% en la exposición total para no superar el valor de referencia.`
                    : `A reduction of at least ${reductionNeeded}% in total exposure is required to not exceed the reference value.`;
            }
        }

        items.push({
            type: 'critical',
            title: t.results.recCritical,
            desc: desc
        });
    } else {
        items.push({
            type: 'safe',
            title: t.results.recSafe,
            desc: language === 'es' 
                ? "Los niveles de exposición están bajo control. Se recomienda mantener buenas prácticas."
                : "Exposure levels are under control. Maintaining good practices is recommended."
        });
    }

    const topFactor = sensitivityData.length > 0 ? sensitivityData[0] : null;
    if (topFactor) {
        items.push({
            type: 'sensitivity',
            title: t.results.recTitle,
            desc: t.results.recSensitivity
                .replace('{type}', topFactor.type === 'conc' ? t.results.concentration : t.results.consumption)
                .replace('{food}', topFactor.foodName)
        });
    }

    // Monitoring
    if (safeRiskStats.p95 > 50) {
        // If risk is high, we prioritize the sensitivity leader (the driver of P95) for monitoring consistency
        const topDriver = sensitivityData.length > 0 ? sensitivityData[0] : null;
        const topContrib = [...(results.meanContributions || [])].sort((a,b) => b.percentage - a.percentage)[0];
        
        // If the risk is critical (>100%), focus monitoring on the driver. 
        // Otherwise, use the highest contributor.
        const monitorFoodName = (safeRiskStats.p95 > 100 && topDriver) ? topDriver.foodName : (topContrib ? topContrib.name : null);
        
        if (monitorFoodName) {
            items.push({
                type: 'monitoring',
                title: t.results.recMonitoring.replace('{food}', monitorFoodName),
                desc: (topDriver && monitorFoodName === topDriver.foodName)
                    ? (language === 'es' ? "Esta fuente es el principal motor de la variabilidad y el riesgo extremo." : "This source is the main driver of variability and extreme risk.")
                    : (language === 'es' ? "Esta fuente representa el mayor aporte al riesgo acumulado." : "This source represents the largest contribution to cumulative risk.")
            });
        }
    }

    return items;
  }, [safeRiskStats, sensitivityData, t, results, language, contributionData]);

  const scatterData = useMemo(() => {
    if (!results?.simulationData || !scatterVariable) return [];
    
    const [foodId, type] = scatterVariable.split('|');
    const food = results.simulationData.foodInputs.find(f => f.id === foodId);
    if (!food || !results.riskDistribution) return [];

    const xSamples = type === 'conc' ? food.concSamples : food.consSamples;
    const ySamples = results.riskDistribution; 

    if (!xSamples || !ySamples || xSamples.length === 0) return [];

    const sampleSize = 1000;
    const step = Math.max(1, Math.floor(xSamples.length / sampleSize));
    const samples = [];
    
    for (let i = 0; i < xSamples.length; i += step) {
      if (i < ySamples.length) {
        samples.push({
          x: xSamples[i],
          y: ySamples[i]
        });
      }
    }
    return samples;
  }, [results, scatterVariable]);

  // Removed redundant useMemo with side effect

    const regressionLine = useMemo(() => {
        if (scatterData.length < 2) return null;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (const p of scatterData) {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
        }
        const denominator = (scatterData.length * sumX2 - sumX * sumX);
        if (denominator === 0) return null;
        
        const slope = (scatterData.length * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / scatterData.length;
        
        const minX = Math.min(...scatterData.map(p => p.x));
        const maxX = Math.max(...scatterData.map(p => p.x));
        
        return [
            { x: minX, y: slope * minX + intercept },
            { x: maxX, y: slope * maxX + intercept }
        ];
    }, [scatterData]);

  if (!results || !safeRiskStats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 text-center sticky top-4 transition-colors">
        <div className="text-5xl mb-4">🧪</div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t.title}</h2>
        <p className="mb-4 text-gray-500 dark:text-gray-400">{t.description}</p>
      </div>
    );
  }

  const { meanContributions, simulationData, uncertainty, isExpert } = results;

  const isBMDL = results?.refValueType === 'bmdl';
  const activePod: PoD = results?.pod || PRELOADED_PODS.efsa_2024;
  const podValor = activePod.valor; // in µg/kg pc/día

  const p95Exposure = (safeRiskStats.p95 / 100) * safeRefValue;
  const meanExposure = (safeRiskStats.mean / 100) * safeRefValue;

  const p95Exposure_ug = isBMDL ? ((safeRiskStats.p95 || 0) / 100) * podValor : p95Exposure * 1000;
  const meanExposure_ug = isBMDL ? ((safeRiskStats.mean || 0) / 100) * podValor : meanExposure * 1000;
  const p50Exposure_ug = isBMDL ? ((safeRiskStats.median || 0) / 100) * podValor : ((safeRiskStats.median || 0) / 100) * safeRefValue * 1000;
  const p99Exposure_ug = isBMDL ? ((safeRiskStats.p99 || 0) / 100) * podValor : ((safeRiskStats.p99 || 0) / 100) * safeRefValue * 1000;
  const maxExposure_ug = isBMDL ? ((safeRiskStats.max || 0) / 100) * podValor : ((safeRiskStats.max || 0) / 100) * safeRefValue * 1000;

  const moeP95 = p95Exposure_ug > 0 ? (podValor / p95Exposure_ug) : 999999;
  const moeMean = meanExposure_ug > 0 ? (podValor / meanExposure_ug) : 999999;
  const moeP50 = p50Exposure_ug > 0 ? (podValor / p50Exposure_ug) : 999999;
  const moeP99 = p99Exposure_ug > 0 ? (podValor / p99Exposure_ug) : 999999;

  const podRiskP95 = classifyPoDRisk(activePod, moeP95);

  const podLabel = `${activePod.tipo_BMR} (${activePod.organismo_y_año}, ${activePod.origen_datos === 'humano_epidemiologico' ? 'humano' : 'animal'})`;
  const riskComparisonData = isBMDL ? [
    { name: podLabel, value: podValor, fill: '#64748b' },
    { name: 'Exposición Media', value: meanExposure_ug, fill: '#3b82f6' },
    { name: 'Exposición P95', value: p95Exposure_ug, fill: podRiskP95.statusColor },
    { name: 'Exposición P99', value: p99Exposure_ug, fill: '#8b5cf6' }
  ] : [
    { name: t.results.refVal.replace('100% ', ''), value: safeRefValue, fill: '#64748b' },
    { name: t.results.meanRisk, value: meanExposure, fill: '#3b82f6' },
    { name: 'P95', value: p95Exposure, fill: getColor(safeRiskStats.p95, false) }
  ];

  const compValues = riskComparisonData.map(d => d.value).filter(v => v > 0);
  const compMin = compValues.length > 0 ? Math.min(...compValues) : 1;
  const compMax = compValues.length > 0 ? Math.max(...compValues) : 1;
  const useComparisonLogScale = isBMDL && compMin > 0 && (compMax / compMin >= 10);
  const compLogDomain: [number, number] = [
    Math.max(0.0001, Math.pow(10, Math.floor(Math.log10(compMin)))),
    Math.pow(10, Math.ceil(Math.log10(compMax)))
  ];

  const sortedContributions = [...meanContributions].sort((a,b) => b.percentage - a.percentage);

  const hq95 = p95Exposure / safeRefValue;
  const moe95 = p95Exposure > 0 ? safeRefValue / p95Exposure : Infinity;

  const getStatusColor = (val: number, type: 'prob' | 'risk' | 'hq' | 'moe') => {
    if (type === 'prob') {
        if (val < 1) return 'bg-emerald-500';
        if (val < 5) return 'bg-amber-500';
        return 'bg-red-500';
    }
    if (type === 'risk') {
        if (val < 75) return 'bg-emerald-500';
        if (val <= 100) return 'bg-amber-500';
        return 'bg-red-500';
    }
    if (type === 'hq') {
        if (val < 0.75) return 'bg-emerald-500';
        if (val <= 1.0) return 'bg-amber-500';
        return 'bg-red-500';
    }
    if (type === 'moe') {
        if (val > 10000) return 'bg-emerald-500';
        if (val >= 1000) return 'bg-amber-500';
        return 'bg-red-500';
    }
    return 'bg-gray-500';
  };

  const getStatusBg = (val: number, type: 'prob' | 'risk' | 'hq' | 'moe') => {
    if (type === 'prob') {
        if (val < 1) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        if (val < 5) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
    }
    if (type === 'risk') {
        if (val < 75) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        if (val <= 100) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
    }
    if (type === 'hq') {
        if (val < 0.75) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        if (val <= 1.0) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
    }
    if (type === 'moe') {
        if (val > 10000) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
        if (val >= 1000) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
        return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
    }
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-900/30';
  };

  const getStatusText = (val: number, type: 'prob' | 'risk' | 'hq' | 'moe') => {
    if (type === 'prob') {
        if (val < 1) return 'text-emerald-700 dark:text-emerald-400';
        if (val < 5) return 'text-amber-700 dark:text-amber-400';
        return 'text-red-700 dark:text-red-400';
    }
    if (type === 'risk') {
        if (val < 75) return 'text-emerald-700 dark:text-emerald-400';
        if (val <= 100) return 'text-amber-700 dark:text-amber-400';
        return 'text-red-700 dark:text-red-400';
    }
    if (type === 'hq') {
        if (val < 0.75) return 'text-emerald-700 dark:text-emerald-400';
        if (val <= 1.0) return 'text-amber-700 dark:text-amber-400';
        return 'text-red-700 dark:text-red-400';
    }
    if (type === 'moe') {
        if (val > 10000) return 'text-emerald-700 dark:text-emerald-400';
        if (val >= 1000) return 'text-amber-700 dark:text-amber-400';
        return 'text-red-700 dark:text-red-400';
    }
    return 'text-gray-700 dark:text-gray-400';
  };

  const getCIString = (ci?: [number, number]) => {
      if (!ci) return '-';
      return `[${ci[0].toFixed(1)}%, ${ci[1].toFixed(1)}%]`;
  };

  const statTableRows: { label: string; val: number; ci?: [number, number]; moe?: number; isPercentage?: boolean; isRaw?: boolean; highlight?: boolean; info?: string }[] = isBMDL ? [
      { label: 'Exposición Media (µg/kg pc/d)', val: meanExposure_ug, ci: uncertainty?.meanCI ? [((uncertainty.meanCI[0] / 100) * podValor), ((uncertainty.meanCI[1] / 100) * podValor)] : undefined, moe: moeMean, isRaw: true },
      { label: 'Exposición Mediana - P50 (µg/kg pc/d)', val: p50Exposure_ug, moe: moeP50, isRaw: true },
      { label: t.results.stdDev, val: safeRiskStats.stdDev, isRaw: true },
      { label: t.results.cv, val: safeRiskStats.cv, isPercentage: true, info: "Relación entre desviación estándar y media." },
      { label: t.results.iqr, val: safeRiskStats.iqr, isRaw: true, info: "Rango intercuartílico entre P75 y P25." },
      { label: t.results.skewness, val: safeRiskStats.skewness, isRaw: true, info: "Mide la asimetría de la distribución." },
      { label: t.results.kurtosis, val: safeRiskStats.kurtosis, isRaw: true, info: "Mide la forma de las colas de la distribución." },
      { label: 'P5 (µg/kg pc/d)', val: ((safeRiskStats.p5 || 0) / 100) * podValor, moe: safeRiskStats.p5 > 0 ? (100 / safeRiskStats.p5) : undefined, isRaw: true },
      { label: 'P25 (µg/kg pc/d)', val: ((safeRiskStats.p25 || 0) / 100) * podValor, moe: safeRiskStats.p25 > 0 ? (100 / safeRiskStats.p25) : undefined, isRaw: true },
      { label: 'P75 (µg/kg pc/d)', val: ((safeRiskStats.p75 || 0) / 100) * podValor, moe: safeRiskStats.p75 > 0 ? (100 / safeRiskStats.p75) : undefined, isRaw: true },
      { label: 'P90 (µg/kg pc/d)', val: ((safeRiskStats.p90 || 0) / 100) * podValor, moe: safeRiskStats.p90 > 0 ? (100 / safeRiskStats.p90) : undefined, isRaw: true },
      { label: 'P95 (µg/kg pc/d)', val: p95Exposure_ug, ci: uncertainty?.p95CI ? [((uncertainty.p95CI[0] / 100) * podValor), ((uncertainty.p95CI[1] / 100) * podValor)] : undefined, moe: moeP95, highlight: true, isRaw: true },
      { label: 'P97.5 (µg/kg pc/d)', val: ((safeRiskStats.p975 || 0) / 100) * podValor, moe: safeRiskStats.p975 > 0 ? (100 / safeRiskStats.p975) : undefined, isRaw: true },
      { label: 'P99 (µg/kg pc/d)', val: p99Exposure_ug, moe: moeP99, isRaw: true },
      { label: 'P99.9 (µg/kg pc/d)', val: ((safeRiskStats.p999 || 0) / 100) * podValor, moe: safeRiskStats.p999 > 0 ? (100 / safeRiskStats.p999) : undefined, isRaw: true },
      { label: 'Máximo simulado (sensible al número de iteraciones)', val: maxExposure_ug, moe: safeRiskStats.max > 0 ? (100 / safeRiskStats.max) : undefined, isRaw: true },
      ...(activePod.origen_datos === 'animal_experimental' && activePod.tipo_BMR.toUpperCase() === 'BMDL10' ? [
        { 
          label: 'Población con MOE < 10.000', 
          val: safeRiskStats.bmdlConcernProb ?? (safeRiskStats.p95 > 0.01 ? 100 : 0), 
          isPercentage: true, 
          highlight: true, 
          info: "Criterio EFSA 2005: Porcentaje de la población simulada con MOE < 10.000 para sustancias genotóxicas/carcinogénicas basadas en BMDL10 animal." 
        }
      ] : activePod.key === 'efsa_2024' || (activePod.organismo_y_año.includes('EFSA 2024') && activePod.tipo_BMR.toUpperCase() === 'BMDL05') ? [
        { 
          label: 'Población con MOE ≤ 1 (Preocupación EFSA 2024)', 
          val: safeRiskStats.exceedanceProb, 
          isPercentage: true, 
          highlight: safeRiskStats.exceedanceProb > 0, 
          info: "Criterio EFSA 2024 para arsénico inorgánico: MOE ≤ 1 respecto a BMDL05 (0,06 µg/kg pc/día) indica preocupación para la salud." 
        }
      ] : [
        { 
          label: 'Caracterización de riesgo', 
          val: 0, 
          isPercentage: false, 
          info: "Sin umbral numérico establecido para este PoD; la caracterización requiere juicio experto." 
        }
      ])
  ] : [
      { label: t.results.meanRisk, val: safeRiskStats.mean, ci: uncertainty?.meanCI },
      { label: t.results.median, val: safeRiskStats.median },
      { label: t.results.stdDev, val: safeRiskStats.stdDev },
      { label: t.results.cv, val: safeRiskStats.cv, isPercentage: true, info: "Relación entre desviación estándar y media." },
      { label: t.results.iqr, val: safeRiskStats.iqr, info: "Rango entre el percentil 75 y 25." },
      { label: t.results.skewness, val: safeRiskStats.skewness, isRaw: true, info: "Mide la asimetría de la distribución." },
      { label: t.results.kurtosis, val: safeRiskStats.kurtosis, isRaw: true, info: "Mide la forma de las colas de la distribución." },
      { label: t.results.riskMin, val: safeRiskStats.min },
      { label: 'P5', val: safeRiskStats.p5 },
      { label: 'P25', val: safeRiskStats.p25 },
      { label: 'P75', val: safeRiskStats.p75 },
      { label: 'P90', val: safeRiskStats.p90 },
      { label: 'P95', val: safeRiskStats.p95, ci: uncertainty?.p95CI },
      { label: 'P97.5', val: safeRiskStats.p975 },
      { label: 'P99', val: safeRiskStats.p99 },
      { label: t.results.p999, val: safeRiskStats.p999 },
      { label: t.results.riskMax, val: safeRiskStats.max },
      { label: t.results.exceedanceProb, val: safeRiskStats.exceedanceProb, isPercentage: true, highlight: safeRiskStats.exceedanceProb > 0 }
  ];

  const chartInfo = {
    histogram: { 
      title: isBMDL ? 'Distribución de la exposición dietaria estimada' : t.results.histogram, 
      desc: isBMDL 
        ? "Frecuencia de la exposición en µg/kg pc/día frente al punto de partida toxicológico (PoD)." 
        : (language === 'es' ? "Visualiza la frecuencia de valores de riesgo en intervalos definidos." : "Visualizes the frequency of risk values within defined intervals.")
    },
    density: { 
      title: isBMDL ? 'Densidad de Exposición Dietaria' : t.results.density, 
      desc: isBMDL 
        ? "Representación suavizada de la distribución de la exposición dietaria estimada." 
        : (language === 'es' ? "Representación suavizada de la distribución del riesgo (KDE)." : "Smooth representation of the risk distribution using Kernel Density Estimation.")
    },
    cdf: { 
      title: isBMDL 
        ? (language === 'es' ? 'Curva Acumulada de MOE (CDF)' : 'MOE Cumulative Curve (CDF)')
        : t.results.cdf, 
      desc: isBMDL
        ? (language === 'es'
            ? `Probabilidad acumulada del Margen de Exposición (MOE) en la población evaluada. El umbral de seguridad normativo es MOE = ${activeThreshold.toLocaleString('es-ES')}.`
            : `Cumulative probability of Margin of Exposure (MOE) in the population. Safety threshold is MOE = ${activeThreshold.toLocaleString('es-ES')}.`)
        : (language === 'es' ? "Probabilidad acumulada de que el riesgo sea menor o igual a un valor." : "Shows the cumulative probability that the risk is less than or equal to a value.")
    },
    comparison: { 
      title: isBMDL ? 'Comparación de Exposición vs PoD' : t.results.comparison, 
      desc: isBMDL 
        ? `Comparación directa en µg/kg pc/día entre el Punto de Partida (${activePod.tipo_BMR}) y los percentiles de exposición.` 
        : (language === 'es' ? "Comparación directa entre riesgo medio, percentil 95 y límite de referencia." : "Direct comparison between mean risk, percentile 95, and reference limit.")
    },
    moeDist: {
      title: language === 'es' ? 'Distribución de MOE (Carcinógenos)' : language === 'fr' ? 'Distribution de MOE' : 'MOE Distribution',
      desc: isBMDL
        ? (language === 'es'
            ? `Cuantifica el porcentaje de la población simulada por debajo de los umbrales de seguridad normativos (${activeThreshold === 10000 ? 'MOE < 10.000 para carcinógenos según criterio EFSA 2005' : 'Umbral normativo EFSA 2024'}).`
            : `Quantifies the percentage of the simulated population below safety thresholds (${activeThreshold === 10000 ? 'MOE < 10,000 for carcinogens per EFSA 2005' : 'EFSA regulatory threshold'}).`)
        : (language === 'es' ? 'Distribución del Margen de Exposición (MOE) y porcentaje de población bajo el nivel de seguridad.' : 'Margin of Exposure (MOE) distribution and population below safety level.')
    },
    scatter: { 
      title: t.results.scatter, 
      desc: language === 'es' ? "Relación entre una variable de entrada y el riesgo total resultante." : "Relationship between an input variable and the resulting total risk." 
    },
    tornado: {
      title: language === 'es' ? "Diagrama de Tornado" : language === 'fr' ? "Diagramme Tornade" : "Tornado Chart",
      desc: language === 'es' 
        ? "Evalúa qué variables de entrada (concentración o consumo) generan la mayor oscilación (swing) e impacto en el riesgo estimado." 
        : language === 'fr' 
        ? "Évalue quelles variables d'entrée (concentration ou consommation) ont le plus grand impact sur le risque estimé par analyse d'oscillation."
        : "Evaluates which input variables (concentration or consumption) have the greatest impact on estimated risk using swing analysis."
    },
    sensitivity: {
      title: t.results.sensitivity,
      desc: language === 'es' 
        ? "Análisis de sensibilidad usando el Coeficiente de correlación de rangos de Spearman para cada variable de entrada." 
        : "Sensitivity analysis using the Spearman rank correlation coefficient for each input variable."
    },
    simulations: {
      title: t.results.simulations,
      desc: language === 'es' ? "Distribución de los resultados (P95) a través de múltiples simulaciones independientes." : "Distribution of results (P95) across multiple independent simulations."
    },
    exposureDist: {
      title: t.results.exposureDist,
      desc: language === 'es' ? "Visualiza la densidad de probabilidad de la exposición total calculada en mg/kg·día." : "Visualizes the probability density of the total calculated exposure in mg/kg·day."
    },
    exposureHistogram: {
      title: t.results.exposureHistogram,
      desc: language === 'es' ? "Histograma de frecuencia de la exposición total en mg/kg·día." : "Frequency histogram of total exposure in mg/kg·day."
    },
    correlation: {
      title: t.results.correlation,
      desc: language === 'es' ? "Matriz de correlación de Pearson entre las contribuciones de exposición de cada alimento." : "Pearson correlation matrix between the exposure contributions of each food item."
    },
    matrix: {
      title: language === 'es' ? "Matriz de Riesgo" : "Risk Matrix",
      desc: language === 'es' ? "Mapa de calor que relaciona la concentración y el consumo de un alimento con el riesgo total." : "Heatmap mapping food concentration and consumption against total risk levels."
    },
    stats: {
      title: t.results.stats,
      desc: language === 'es' ? "Análisis estadístico detallado de la simulación y sensibilidad." : "Detailed statistical analysis of the simulation and sensitivity."
    },
    recommendations: {
        title: t.results.recommendations,
        desc: language === 'es' ? "Acciones y medidas sugeridas basadas en el perfil de riesgo calculado." : "Suggested actions and measures based on the calculated risk profile."
    },
    summary: {
      title: language === 'es' ? 'Informe Resumen' : 'Summary Report',
      desc: language === 'es' ? 'Compilación completa de parámetros y resultados con visualizaciones clave.' : 'Complete compilation of parameters and results with key visualizations.'
    },
    convergence: {
      title: language === 'es' ? 'Convergencia' : 'Convergence',
      desc: language === 'es' ? 'Análisis de convergencia de la simulación Monte Carlo.' : 'Monte Carlo simulation convergence analysis.'
    }
  };

  const getStrengthLabel = (r: number) => {
    const absR = Math.abs(r);
    if (absR > 0.5) return t.results.high;
    if (absR > 0.1) return t.results.moderate;
    return t.results.low;
  };

  const getStrengthColor = (r: number) => {
    const absR = Math.abs(r);
    if (absR > 0.5) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (absR > 0.1) return 'text-blue-600 dark:text-blue-400 font-medium';
    return 'text-gray-400';
  };

  const zoomThreshold = isZoomed ? Math.max(200, safeRiskStats.p95 * 1.25) : 'auto';

  const adiUnit = inputSummary?.adi?.split(' ').slice(1).join(' ') || 'mg/kg·día';

  return (
    <div ref={panelRef} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full transition-all duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 mr-2 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-blue-600 dark:text-blue-400 flex items-center gap-2 group"
                title={language === 'es' ? 'Volver a Parámetros' : 'Back to Parameters'}
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase hidden sm:inline">{language === 'es' ? 'Volver' : 'Back'}</span>
              </button>
            )}
            <div className="p-2 bg-blue-500/10 rounded-xl">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{t.results.title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
                title={language === 'es' ? 'Exportar PNG' : 'Export PNG'}
            >
                {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Download size={18} />
                )}
            </button>

            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
                title={language === 'es' ? 'Exportar PDF' : 'Export PDF'}
            >
                {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <FileText size={18} />
                )}
            </button>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Hierarchical Level 1: Global Safety Status & Main Metric */}
        {(() => {
            if (isBMDL) {
              const isConcern = podRiskP95.statusLevel === 'concern';
              const isSafe = podRiskP95.statusLevel === 'safe';
              
              return (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className={`p-6 rounded-[2rem] border-2 shadow-xl transition-all ${
                        isConcern
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                            : isSafe 
                                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' 
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-white dark:ring-slate-800 ${
                                    isConcern ? 'bg-red-500 text-white' : isSafe ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                                }`}>
                                    {isConcern ? <AlertTriangle size={32} /> : isSafe ? <ShieldCheck size={32} /> : <Info size={32} />}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block">
                                      Caracterización del Riesgo ({activePod.organismo_y_año})
                                    </span>
                                    <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                                      isConcern ? 'text-red-700 dark:text-red-400' : isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                        {podRiskP95.category}
                                    </h3>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl pt-1">
                                        {generateInterpretiveText(activePod, p95Exposure_ug, moeP95)}
                                    </p>
                                    <div className="pt-2 text-[11px] font-mono text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4">
                                      <span><strong>Criterio aplicado:</strong> {podRiskP95.criterionUsed}</span>
                                      <span><strong>Fuente:</strong> {podRiskP95.bibliographicSource}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              );
            }

            const isCritical = safeRiskStats.p95 >= 100;
            const isWarning = safeRiskStats.p95 >= 75 && safeRiskStats.p95 < 100;
            
            return (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className={`p-6 rounded-[2rem] border-2 shadow-xl transition-all ${
                      isCritical
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                          : isWarning 
                              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' 
                              : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
                  }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-white dark:ring-slate-800 ${
                                  isCritical ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                              }`}>
                                  {isCritical ? <ShieldAlert size={32} /> : isWarning ? <Activity size={32} /> : <ShieldCheck size={32} />}
                              </div>
                              <div>
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1 block">Conclusión de Seguridad</span>
                                  <h3 className={`text-3xl font-black tracking-tighter ${isCritical ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                      {safeRiskStats.p95 >= 100 ? 'ALERTA: CRÍTICO' : safeRiskStats.p95 >= 75 ? 'PRECAUCIÓN' : 'SEGURO'}
                                  </h3>
                                  <p className="text-sm font-bold opacity-70">
                                      {safeRiskStats.p95 >= 100 
                                          ? 'La exposición en el percentil 95 excede los umbrales de seguridad toxicológica.' 
                                          : 'Los niveles de exposición se mantienen dentro de los rangos tolerables (ADI/VRT).'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            );
        })()}

        {/* Hierarchical Level 2: Technical Technical Dashboard */}
        <div ref={dashboardRef} className="relative group">
            <button 
                onClick={() => captureElement(dashboardRef.current, 'indicadores_clave')}
                className="absolute -top-2 -right-2 z-10 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-gray-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title={language === 'es' ? 'Exportar indicadores' : 'Export indicators'}
            >
                <Download size={14} className="text-emerald-500" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                {/* 1. Mean Risk / Mean Exposure in µg/kg pc/d */}
                <div className="flex flex-col p-5 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {isBMDL ? 'Exposición Media' : 'Riesgo Medio'}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">
                            <Activity size={16} className="text-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                            {isBMDL ? formatNumberES(meanExposure_ug, 4) : `${(safeRiskStats.mean || 0).toFixed(1)}%`}
                        </span>
                        {isBMDL && <span className="text-xs font-semibold text-gray-400">µg/kg pc/d</span>}
                    </div>
                    <p className="text-[10px] mt-2 font-bold text-gray-500">
                        {isBMDL ? `MOE Medio ≈ ${formatNumberES(moeMean, 1)}` : 'Exposición Promedio'}
                    </p>
                </div>

                {/* 2. Mediana (P50) in µg/kg pc/d */}
                <div className="flex flex-col p-5 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {isBMDL ? 'Exposición Mediana (P50)' : 'Prob. Excedencia'}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/10">
                            <Gauge size={16} className="text-indigo-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                            {isBMDL ? formatNumberES(p50Exposure_ug, 4) : `${(safeRiskStats.exceedanceProb || 0).toFixed(2)}%`}
                        </span>
                        {isBMDL && <span className="text-xs font-semibold text-gray-400">µg/kg pc/d</span>}
                    </div>
                    <p className="text-[10px] mt-2 font-bold text-gray-500">
                        {isBMDL ? `MOE P50 ≈ ${formatNumberES(moeP50, 1)}` : (safeRiskStats.exceedanceProb < 1 ? 'Probabilidad Muy Baja' : 'Probabilidad Significativa')}
                    </p>
                </div>

                {/* 3. Percentil 95 (P95) in µg/kg pc/d */}
                <div className={`flex flex-col p-5 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                    isBMDL 
                        ? (podRiskP95.statusLevel === 'concern' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : podRiskP95.statusLevel === 'safe' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700')
                        : getStatusBg(safeRiskStats.p95, 'risk')
                }`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {isBMDL ? 'Exposición P95' : 'Riesgo P95'}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isBMDL 
                                ? (podRiskP95.statusLevel === 'concern' ? 'bg-red-500/20 text-red-600' : podRiskP95.statusLevel === 'safe' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-500/20 text-slate-600')
                                : 'bg-purple-500/10 text-purple-500'
                        }`}>
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${
                            isBMDL 
                                ? (podRiskP95.statusLevel === 'concern' ? 'text-red-700 dark:text-red-400' : podRiskP95.statusLevel === 'safe' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100')
                                : 'text-gray-900 dark:text-gray-100'
                        }`}>
                            {isBMDL ? formatNumberES(p95Exposure_ug, 4) : `${(safeRiskStats.p95 || 0).toFixed(1)}%`}
                        </span>
                        {isBMDL && <span className="text-xs font-semibold opacity-60">µg/kg pc/d</span>}
                    </div>
                    <p className={`text-[10px] mt-2 font-bold ${
                        isBMDL 
                            ? (podRiskP95.statusLevel === 'concern' ? 'text-red-600 dark:text-red-400' : podRiskP95.statusLevel === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')
                            : 'text-gray-500'
                    }`}>
                        {isBMDL ? `MOE P95 = ${formatNumberES(moeP95, 1)}` : 'Percentil de Seguridad'}
                    </p>
                </div>

                {/* 4. Percentil 99 (P99) in µg/kg pc/d */}
                <div className="flex flex-col p-5 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {isBMDL ? 'Exposición P99' : 'Robustez'}
                        </span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/10">
                            <Database size={16} className="text-purple-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                            {isBMDL ? formatNumberES(p99Exposure_ug, 4) : `${(totalSamples/1000).toFixed(0)}k`}
                        </span>
                        {isBMDL && <span className="text-xs font-semibold text-gray-400">µg/kg pc/d</span>}
                    </div>
                    <p className="text-[10px] mt-2 font-bold text-gray-500">
                        {isBMDL ? `MOE P99 ≈ ${formatNumberES(moeP99, 1)} (Cola)` : 'Iteraciones Monte Carlo'}
                    </p>
                </div>
            </div>

            {/* Informative sub-banner for iterations and tail exposure */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-purple-500" />
                    <span className="font-bold">Iteraciones Monte Carlo:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{totalSamples.toLocaleString('es-ES')}</span>
                </div>
                {isBMDL ? (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">Máximo simulado (sensible al número de iteraciones):</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatNumberES(maxExposure_ug, 4)} µg/kg pc/d</span>
                        <span className="text-gray-400">(MOE mín ≈ {formatNumberES(podValor / Math.max(0.0000001, maxExposure_ug), 1)})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">Riesgo Máximo:</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{(safeRiskStats.max || 0).toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </div>

        {/* Hierarchical Level 3: Detailed Risk Analysis */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <RiskCard 
                stats={safeRiskStats} 
                uncertainty={uncertainty} 
                language={language} 
                refValue={results.originalRefValue ?? safeRefValue} 
                refValueType={results.refValueType}
                unit={results.originalRefUnit ?? adiUnit}
                pod={results.pod}
            />
        </div>


        {results.isExpert && (
            <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 rounded-3xl p-6 animate-in fade-in">
                <h4 className="text-sm font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                   🔍 {t.scientificOverview}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1 p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-black/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{t.exposureMean}</span>
                        <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                            {(meanExposure || 0).toFixed(6)} <span className="text-[10px] font-normal opacity-50">mg/kg·d</span>
                        </p>
                        {results.originalRefUnit === 'µg/kg·día' && (
                            <p className="text-xs font-mono font-bold text-gray-500">
                                {((meanExposure || 0) * 1000).toFixed(3)} µg/kg·d
                            </p>
                        )}
                    </div>
                    <div className="space-y-1 p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-black/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">P95 Exposure</span>
                        <p className="text-lg font-black text-blue-600">
                            {(p95Exposure || 0).toFixed(6)} <span className="text-[10px] font-normal opacity-50">mg/kg·d</span>
                        </p>
                        {results.originalRefUnit === 'µg/kg·día' && (
                            <p className="text-xs font-mono font-bold text-blue-500">
                                {((p95Exposure || 0) * 1000).toFixed(3)} µg/kg·d
                            </p>
                        )}
                    </div>
                    <div className="space-y-1 p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-black/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">P97.5 Exposure</span>
                        <p className="text-lg font-black text-purple-600">
                            {(( (safeRiskStats.p975 || 0) / 100) * safeRefValue).toFixed(6)} <span className="text-[10px] font-normal opacity-50">mg/kg·d</span>
                        </p>
                        {results.originalRefUnit === 'µg/kg·día' && (
                            <p className="text-xs font-mono font-bold text-purple-500">
                                {(((safeRiskStats.p975 || 0) / 100) * safeRefValue * 1000).toFixed(3)} µg/kg·d
                            </p>
                        )}
                    </div>
                    <div className="space-y-1 p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-black/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">P99 Exposure</span>
                        <p className="text-lg font-black text-pink-600">
                            {(( (safeRiskStats.p99 || 0) / 100) * safeRefValue).toFixed(6)} <span className="text-[10px] font-normal opacity-50">mg/kg·d</span>
                        </p>
                        {results.originalRefUnit === 'µg/kg·día' && (
                            <p className="text-xs font-mono font-bold text-pink-500">
                                {(((safeRiskStats.p99 || 0) / 100) * safeRefValue * 1000).toFixed(3)} µg/kg·d
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-blue-100 dark:border-blue-900/30">
                    <h5 className="text-[11px] font-black uppercase text-blue-600 mb-3 tracking-widest">Dictamen Metodológico (EFSA/JECFA)</h5>
                    <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-blue-500 font-bold">01.</span>
                                <div>
                                    <strong>Caracterización del Riesgo:</strong> 
                                    {results.refValueType === 'bmdl' 
                                        ? ` El Margen de Exposición (MOE) en el P95 es de ${formatNumberES(moeP95, 1)} respecto al punto de partida ${activePod.tipo_BMR} de ${activePod.valor} µg/kg pc/día (${activePod.organismo_y_año}, ${activePod.efecto_critico}). Conclusión: ${podRiskP95.category}. Criterio aplicado: ${podRiskP95.criterionUsed} (${podRiskP95.bibliographicSource}).`
                                        : ` El Cociente de Peligro (HQ) en el P95 es de ${(p95Exposure / (safeRefValue || 1)).toFixed(3)}. Un valor mayor a 1 sugiere que la ingesta diaria supera el umbral de seguridad toxicológica (ADI).`}
                                </div>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-blue-500 font-bold">02.</span>
                                <div>
                                    <strong>Incertidumbre:</strong> La simulación probabilística {uncertainty ? 'incorpora análisis de incertidumbre vía Bootstrap' : 'proporciona una estimación puntual de la variabilidad'}. El coeficiente de variación del {(( (safeRiskStats.stdDev || 0) / (safeRiskStats.mean || 1)) * 100).toFixed(1)}% sugiere una dispersión {(safeRiskStats.stdDev || 0) / (safeRiskStats.mean || 1) > 1 ? 'alta' : 'moderada'} en los datos de entrada.
                                </div>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-blue-500 font-bold">03.</span>
                                <div>
                                    <strong>Gestión del Riesgo:</strong> 
                                    {isBMDL ? (
                                        podRiskP95.statusLevel === 'concern'
                                        ? ` Se constata preocupación para la salud bajo el marco normativo aplicable. Se recomienda priorizar la reducción de la concentración en ${sensitivityData[0]?.foodName || 'el alimento de mayor impacto'} como medida prioritaria de mitigación.`
                                        : ` Se recomienda mantener la vigilancia analítica y monitoreo sobre las fuentes prioritarias (${sensitivityData[0]?.foodName || 'alimento principal'}).`
                                    ) : (safeRiskStats.p95 > 100 ? (
                                        language === 'es'
                                        ? ` Se recomienda reducir la concentración del contaminante en ${sensitivityData[0]?.foodName || 'el alimento principal'} en al menos un ${((1 - (100 / (safeRiskStats.p95 || 100))) * 100).toFixed(1)}% para que el riesgo al P95 no supere el 100% del VRT.`
                                        : ` Reducing the chemical concentration in ${sensitivityData[0]?.foodName || 'the main food item'} by at least ${((1 - (100 / (safeRiskStats.p95 || 100))) * 100).toFixed(1)}% is recommended to ensure P95 risk stays below 100% of the ADI.`
                                    ) : (
                                        language === 'es'
                                        ? ` Se recomienda priorizar la mitigación en las fuentes con mayor coeficiente de correlación, enfocándose en ${sensitivityData[0]?.foodName || 'el alimento principal'}.`
                                        : ` Prioritizing mitigation for sources with high correlation is recommended, focusing on ${sensitivityData[0]?.foodName || 'the main food item'}.`
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )}

        <div className="relative bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col mb-6 gap-2 text-center">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{chartInfo[chartView].title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-tight max-w-2xl mx-auto mb-2">{chartInfo[chartView].desc}</p>
                
                <RiskLegend language={language} chartView={chartView} isBMDL={isBMDL} pod={activePod} />

                {chartView === 'scatter' && (
                    <div className="flex justify-center gap-2 mt-2 animate-in zoom-in-95" >
                        <span className="text-xs text-gray-500 self-center">{t.results.selectVariable}:</span>
                        <select 
                        value={scatterVariable} 
                        onChange={(e) => setScatterVariable(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                        {results.simulationData?.foodInputs.flatMap(food => [
                            <option key={`${food.id}|conc`} value={`${food.id}|conc`}>{food.name} - Conc.</option>,
                            <option key={`${food.id}|cons`} value={`${food.id}|cons`}>{food.name} - Cons.</option>
                        ])}
                        </select>
                    </div>
                )}

                {chartView === 'matrix' && (
                    <div className="flex justify-center gap-2 mt-2 animate-in zoom-in-95" >
                        <span className="text-xs text-gray-500 self-center">{language === 'es' ? "Seleccionar Alimento" : "Select Food"}:</span>
                        <select 
                        value={matrixFood} 
                        onChange={(e) => setMatrixFood(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                        {results.simulationData?.foodInputs.map(food => (
                            <option key={food.id} value={food.id}>{food.name}</option>
                        ))}
                        </select>
                    </div>
                )}

                {chartView === 'sensitivity' && (
                    <div className="flex justify-center mt-2 animate-in zoom-in-95">
                        <button
                            onClick={() => setChartView('tornado')}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 shadow-sm"
                        >
                            <Wind size={13} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                            {language === 'es' ? 'Abrir Diagrama de Tornado Completo (Impacto en Riesgo)' : language === 'fr' ? 'Ouvrir Diagramme Tornade Complet' : 'Open Full Tornado Chart (Risk Impact)'}
                        </button>
                    </div>
                )}
            </div>

            <div className={`${['tornado', 'stats', 'recommendations', 'summary', 'moeDist'].includes(chartView) ? 'min-h-[580px] h-auto' : 'h-[450px]'} w-full`}>
                {chartView === 'tornado' ? (
                    <div className="w-full">
                        <TornadoAnalysis results={results} language={language} />
                    </div>
                ) : chartView === 'stats' ? (
                    <div ref={statsTableRef} className="h-full overflow-y-auto no-scrollbar space-y-6 p-4 bg-gray-50/30 dark:bg-slate-900/30 rounded-2xl border border-gray-100/50 dark:border-slate-800/50">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative group">
                            <button 
                                onClick={() => captureElement(statsTableRef.current, 'estadisticas_detalladas')}
                                className="absolute top-2 right-2 z-10 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={language === 'es' ? 'Exportar tabla de estadísticas' : 'Export stats table'}
                            >
                                <Download size={14} className="text-emerald-500" />
                            </button>
                            <h3 className="font-bold mb-6 text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-700 pb-3">{t.results.stats}</h3>
                            <div className="overflow-x-auto mb-6">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">Estadístico</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {isBMDL ? 'Exposición (µg/kg pc/d)' : 'Resultado (%)'}
                                            </th>
                                            {isBMDL && (
                                                <th className="px-4 py-3 text-right text-[10px] font-serif italic uppercase tracking-wider text-marine-600 dark:text-marine-400">
                                                    Margen de Exposición (MOE)
                                                </th>
                                            )}
                                            {results.isExpert && uncertainty && (
                                                <th className="px-4 py-3 text-right text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    {(uncertainty.confidenceLevel * 100).toFixed(0)}% CI (Bootstrap)
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                        {statTableRows.map((row, idx) => (
                                            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-900/20'}`}>
                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        {row.label}
                                                        {row.info && (
                                                            <span className="group relative">
                                                                <Info size={12} className="text-gray-300 cursor-help" />
                                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                    {row.info}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${row.label.includes('P95') ? 'text-blue-600 dark:text-blue-400' : row.highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {row.isRaw ? formatNumberES(row.val || 0, 4) : formatNumberES(row.val || 0, 1)}
                                                    {row.isPercentage && '%'}
                                                </td>
                                                {isBMDL && (
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                                                        {row.moe !== undefined ? (
                                                            <span className={classifyPoDRisk(activePod, row.moe).statusLevel === 'concern' ? 'text-red-600 dark:text-red-400 font-black' : classifyPoDRisk(activePod, row.moe).statusLevel === 'safe' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-600 dark:text-slate-300 font-bold'}>
                                                                MOE = {formatNumberES(row.moe, 1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 dark:text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                )}
                                                {results.isExpert && uncertainty && (
                                                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-500 dark:text-gray-400">
                                                        {getCIString(row.ci)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isBMDL && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-2 mb-6">
                                    <p className="font-bold flex items-center gap-1.5 text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                                        ℹ️ Aclaración Metodológica ({activePod.tipo_BMR} - {activePod.organismo_y_año}):
                                    </p>
                                    <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                        {activePod.origen_datos === 'animal_experimental' && activePod.tipo_BMR.toUpperCase() === 'BMDL10'
                                            ? 'La BMDL10 es el límite inferior de confianza de la dosis benchmark animal (10% de incidencia tumoral). Bajo el marco de la EFSA (2005), un MOE ≥ 10.000 se considera de baja preocupación para la salud pública y baja prioridad para la gestión. Un MOE < 10.000 indica que no puede descartarse preocupación y debe considerarse prioridad para la gestión del riesgo.'
                                            : activePod.key === 'efsa_2024' || (activePod.organismo_y_año.includes('EFSA 2024') && activePod.tipo_BMR.toUpperCase() === 'BMDL05')
                                            ? 'El PoD de la EFSA (2024) para arsénico inorgánico es un BMDL05 de 0,06 µg/kg pc/día derivado de estudios epidemiológicos humanos (cáncer de piel). Según la EFSA, un MOE ≤ 1 indica preocupación para la salud. Para MOE > 1, no se establece un umbral numérico de seguridad y la caracterización requiere juicio experto.'
                                            : `El punto de partida (${activePod.tipo_BMR} = ${activePod.valor} µg/kg pc/día) deriva de datos epidemiológicos humanos (${activePod.efecto_critico}). No existe un umbral numérico de corte internacionalmente establecido para este PoD; por tanto, la caracterización requiere juicio experto toxicológico integral. Nunca debe aplicarse el umbral de 10.000 (diseñado para BMDL10 animal) a datos humanos.`}
                                    </p>
                                    <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                                        Referencia: {activePod.referencia_bibliografica}
                                    </p>
                                </div>
                            )}

                            <h3 className="font-bold mb-6 text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-700 pb-3 pt-4">
                                {t.results.pearsonFull} (Sensibilidad)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.results.inputVal}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.results.variableType}</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.results.pearson}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-serif italic uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.results.strength}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
                                        {sensitivityData.map((row, idx) => (
                                            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-900/20'}`}>
                                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{row.foodName}</td>
                                                <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.type === 'conc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                                                    {row.type === 'conc' ? t.results.concentration : t.results.consumption}
                                                </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono font-bold ${(row.pearson || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {(row.pearson || 0).toFixed(4)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                <span className={`text-[11px] ${getStrengthColor(row.pearson)}`}>
                                                    {getStrengthLabel(row.pearson)}
                                                </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : chartView === 'recommendations' ? (
                    <div className="h-full overflow-y-auto no-scrollbar p-4 bg-gray-50/30 dark:bg-slate-900/30 rounded-2xl border border-gray-100/50 dark:border-slate-800/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((rec, i) => (
                                <div key={i} className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                                    rec.type === 'critical' ? 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/30' :
                                    rec.type === 'safe' ? 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/30' :
                                    rec.type === 'monitoring' ? 'bg-white dark:bg-slate-800 border-amber-100 dark:border-amber-900/30' :
                                    'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900/30'
                                }`}>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                                            rec.type === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                            rec.type === 'safe' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                                            rec.type === 'monitoring' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                        }`}>
                                            {rec.type === 'critical' ? '⚠️' : rec.type === 'safe' ? '✅' : rec.type === 'monitoring' ? '👁️' : '📋'}
                                        </div>
                                        <h5 className="font-black text-sm text-gray-900 dark:text-gray-100 uppercase tracking-tight">{rec.title}</h5>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{rec.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : chartView === 'summary' ? (
                    <div ref={summaryRef} className="h-full overflow-y-auto no-scrollbar space-y-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                        {/* Summary Header */}
                        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
                                    {language === 'es' ? 'Resumen Ejecutivo de Riesgo' : 'Executive Risk Summary'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {inputSummary?.chemical} • {new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={handleExportSummaryPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-bold text-sm"
                            >
                                <FileText size={16} />
                                {language === 'es' ? 'Exportar Informe PDF' : 'Export PDF Report'}
                            </button>
                        </div>

                        {/* Top Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                    {isBMDL ? 'Exposición P95' : 'P95 (Riesgo)'}
                                </span>
                                <span className={`text-2xl font-black ${
                                    isBMDL 
                                        ? (podRiskP95.statusLevel === 'concern' ? 'text-red-600 dark:text-red-400' : podRiskP95.statusLevel === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200')
                                        : ((safeRiskStats.p95 || 0) > 100 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')
                                }`}>
                                    {isBMDL ? formatNumberES(p95Exposure_ug, 4) : `${(safeRiskStats.p95 || 0).toFixed(1)}%`}
                                </span>
                                {isBMDL ? (
                                    <span className={`text-[10px] font-bold block mt-1 ${podRiskP95.statusLevel === 'concern' ? 'text-red-600 dark:text-red-400' : podRiskP95.statusLevel === 'safe' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        MOE P95 = {formatNumberES(moeP95, 1)} ({podRiskP95.category.slice(0, 30)}...)
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-gray-400 block mt-1">Percentil 95</span>
                                )}
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                    {isBMDL ? 'Exposición Media' : (language === 'es' ? 'Riesgo Medio' : 'Mean Risk')}
                                </span>
                                <span className="text-2xl font-black text-gray-700 dark:text-gray-200">
                                    {isBMDL ? formatNumberES(meanExposure_ug, 4) : `${(safeRiskStats.mean || 0).toFixed(1)}%`}
                                </span>
                                {isBMDL && (
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                                        MOE Medio ≈ {formatNumberES(moeMean, 1)}
                                    </span>
                                )}
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                    {isBMDL ? 'Exposición Mediana (P50)' : (language === 'es' ? 'Excedencia' : 'Exceedance')}
                                </span>
                                <span className="text-2xl font-black text-gray-700 dark:text-gray-200">
                                    {isBMDL ? formatNumberES(p50Exposure_ug, 4) : `${(safeRiskStats.exceedanceProb || 0).toFixed(2)}%`}
                                </span>
                                {isBMDL ? (
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                                        MOE P50 ≈ {formatNumberES(moeP50, 1)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-gray-400 block mt-1">
                                        {safeRiskStats.exceedanceProb < 1 ? 'Probabilidad Baja' : 'Probabilidad Significativa'}
                                    </span>
                                )}
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                    {isBMDL ? 'Exposición P99 (Cola)' : 'HQ (Mean)'}
                                </span>
                                <span className="text-2xl font-black text-gray-700 dark:text-gray-200">
                                    {isBMDL ? formatNumberES(p99Exposure_ug, 4) : (safeRiskStats.hazardQuotient?.toFixed(3) || 'N/A')}
                                </span>
                                {isBMDL && (
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                                        MOE P99 ≈ {formatNumberES(moeP99, 1)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Section: Bases de la caracterización del riesgo (Requirement 8) */}
                        {isBMDL && (
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <Database size={16} className="text-blue-500" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                        Bases de la caracterización del riesgo (Trazabilidad)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                    <div>
                                        <span className="font-bold text-slate-500">Punto de Partida (PoD):</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {activePod.tipo_BMR} = {activePod.valor} {activePod.unidad} ({activePod.organismo_y_año})
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-500">Origen de los datos:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {activePod.origen_datos === 'humano_epidemiologico' ? 'Humano (estudios epidemiológicos)' : 'Animal (bioensayos experimentales)'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-500">Efecto crítico:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{activePod.efecto_critico}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-500">Criterio de MOE aplicado:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{podRiskP95.criterionUsed}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-500">Iteraciones Monte Carlo:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{totalSamples.toLocaleString('es-ES')}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-500">Tipo de modelo:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {uncertainty ? '2D (Variabilidad de la población + Incertidumbre Bootstrap)' : '1D (Variabilidad probabilística de la población)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                                    <p><strong>Referencia bibliográfica:</strong> {activePod.referencia_bibliografica}</p>
                                    <p className="mt-1"><strong>Principales supuestos:</strong> Exposición dietaria crónica calculada mediante simulación Monte Carlo no paramétrica/paramétrica según distribuciones de concentración y consumo normalizadas por peso corporal individual. Asunción conservadora de absorción oral completa (100%) y homogeneidad de consumo sin considerar pérdidas culinarias.</p>
                                </div>
                            </div>
                        )}

                        {/* Charts Section for Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Activity size={16} className="text-blue-500" />
                                    {language === 'es' ? 'Perfil de Exposición' : 'Exposure Profile'}
                                </h4>
                                <div ref={summaryDensityRef} className="h-[250px] w-full bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={densityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="summaryDensity" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="x" hide />
                                            <YAxis hide />
                                            <Tooltip content={<CustomTooltip language={language} riskStats={safeRiskStats} totalSamples={totalSamples} isBMDL={isBMDL} />} />
                                            <Area 
                                                isAnimationActive={!isExporting} 
                                                type="monotone" 
                                                dataKey="density" 
                                                stroke="#6366f1" 
                                                strokeWidth={2} 
                                                fill="url(#summaryDensity)" 
                                            />
                                            <ReferenceLine x={safeRiskStats.p95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'P95', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Gauge size={16} className="text-emerald-500" />
                                    {language === 'es' ? 'Sensibilidad de Variables' : 'Variable Sensitivity'}
                                </h4>
                                <div ref={summarySensitivityRef} className="h-[250px] w-full bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={sensitivityData.slice(0, 6)} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                                            <XAxis type="number" domain={[-1, 1]} stroke="#94a3b8" fontSize={9} label={{ value: 'Correlación de Spearman (r)', position: 'bottom', offset: 0, fontSize: 8, fill: '#64748b' }} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={8} width={135} tick={{ fill: '#64748b' }} />
                                            <Tooltip />
                                            <Bar dataKey="pearson" radius={[0, 4, 4, 0]}>
                                                {sensitivityData.slice(0, 6).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.pearson >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.7} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Food Contributions Table */}
                        <div className="bg-gray-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-blue-500" />
                                    {language === 'es' ? 'Contribución por Alimento' : 'Food Contribution'}
                                </div>
                                {contributionData.some((c: any) => c.isHighRisk) && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg animate-pulse">
                                        <AlertTriangle size={12} className="text-red-600" />
                                        <span className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">
                                            {language === 'es' ? 'ALERTA DE SEGURIDAD' : 'SAFETY ALERT'}
                                        </span>
                                    </div>
                                )}
                            </h4>
                            {contributionData.some((c: any) => c.isHighRisk) && (
                                <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mb-4 bg-red-50/50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20 italic">
                                    {language === 'es' 
                                        ? "* Algunos alimentos contribuyen individualmente con una exposición superior al 100% del VRT." 
                                        : "* Some food items individually contribute exposure exceeding 100% of the ADI/BMDL."}
                                </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contributionData.slice(0, 8).map((item: any, idx: number) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border shadow-sm transition-all ${
                                        item.isHighRisk 
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 ring-1 ring-red-500/20' 
                                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {item.isHighRisk ? (
                                                <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CONTRIB_COLORS[idx % CONTRIB_COLORS.length] }}></div>
                                            )}
                                            <span className={`text-xs font-bold truncate max-w-[120px] ${item.isHighRisk ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.isHighRisk && (
                                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-red-500 text-white rounded-full">ALERTA</span>
                                            )}
                                            <span className={`text-sm font-black ${item.isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {item.percentage > 0 && item.percentage < 0.1 ? item.percentage.toFixed(2) : item.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (chartView === 'moeDist' && isBMDL) ? (
                    <div ref={moeDistRef} className="w-full space-y-6 animate-in fade-in duration-300">
                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: % Bajo Nivel Seguro */}
                            <div className={`p-4 rounded-2xl border transition-all ${
                                pctBelowSafety > 0 
                                    ? 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' 
                                    : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {language === 'es' ? 'Bajo Nivel Seguro' : 'Below Safety Level'}
                                    </span>
                                    {pctBelowSafety > 0 ? (
                                        <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                                    ) : (
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-black font-mono tracking-tight ${
                                        pctBelowSafety > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {formatNumberES(pctBelowSafety, 1)}%
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        ({countBelowThreshold.toLocaleString('es-ES')} indiv.)
                                    </span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        {activeThreshold === 10000 ? 'MOE < 10.000' : 'MOE ≤ 1'}
                                    </span>
                                    {' '}• {activeThreshold === 10000 
                                        ? (language === 'es' ? 'Preocupación salud pública (EFSA 2005)' : 'Public health concern (EFSA 2005)') 
                                        : (language === 'es' ? 'Preocupación toxicológica (EFSA 2024)' : 'Toxicological concern (EFSA 2024)')}
                                </div>
                            </div>

                            {/* Card 2: % Margen Adecuado (Seguro) */}
                            <div className="p-4 rounded-2xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {language === 'es' ? 'Margen de Seguridad Adecuado' : 'Adequate Safety Margin'}
                                    </span>
                                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                                        {formatNumberES(pctSafe, 1)}%
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        ({Math.max(0, totalValid - countBelowThreshold).toLocaleString('es-ES')} indiv.)
                                    </span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[10px] text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {activeThreshold === 10000 ? 'MOE ≥ 10.000' : 'MOE > 1'}
                                    </span>
                                    {' '}• {language === 'es' ? 'Baja preocupación para la salud' : 'Low health concern'}
                                </div>
                            </div>

                            {/* Card 3: MOE P95 */}
                            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        MOE Percentil 95 (P95)
                                    </span>
                                    <ShieldAlert size={16} className={podRiskP95.statusLevel === 'concern' ? 'text-red-500' : 'text-emerald-500'} />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-black font-mono tracking-tight ${
                                        podRiskP95.statusLevel === 'concern' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        {formatNumberES(moeP95, 1)}
                                    </span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                                    <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-[9px] ${podRiskP95.badgeClass}`}>
                                        {podRiskP95.category}
                                    </span>
                                </div>
                            </div>

                            {/* Card 4: PoD y Criterio Normativo */}
                            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Punto de Partida (PoD)
                                    </span>
                                    <Database size={16} className="text-blue-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 block">
                                        {activePod.tipo_BMR} = {formatNumberES(podValor, 3)} µg/kg pc/d
                                    </span>
                                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block truncate">
                                        {activePod.organismo_y_año} • {activePod.origen_datos === 'humano_epidemiologico' ? 'Datos humanos' : 'Bioensayo animal'}
                                    </span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 truncate" title={activePod.efecto_critico}>
                                    Efecto: {activePod.efecto_critico}
                                </div>
                            </div>
                        </div>

                        {/* Chart Container Header with SubView Toggle & Export */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-blue-600 dark:text-blue-400" />
                                        {moeSubView === 'tiers' 
                                            ? (language === 'es' ? 'Estratos Normativos de Exposición (EFSA / JECFA)' : 'Regulatory Exposure Tiers (EFSA / JECFA)')
                                            : (language === 'es' ? 'Curva Acumulada de Margen de Exposición (CDF)' : 'Cumulative Margin of Exposure (CDF)')}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {moeSubView === 'tiers'
                                            ? (language === 'es' ? 'Distribución porcentual de individuos según bandas de riesgo toxicológico.' : 'Percentage distribution of individuals by toxicological risk tiers.')
                                            : (language === 'es' ? `Corte de la población con MOE inferior a ${activeThreshold.toLocaleString('es-ES')}.` : `Population percentage with MOE below ${activeThreshold.toLocaleString('es-ES')}.`)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {/* Toggle Buttons */}
                                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setMoeSubView('tiers')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                                moeSubView === 'tiers'
                                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <span>📊</span>
                                            <span>{language === 'es' ? 'Estratos Normativos' : 'Regulatory Tiers'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMoeSubView('cdf')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                                moeSubView === 'cdf'
                                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <span>📈</span>
                                            <span>{language === 'es' ? 'Curva Acumulada (CDF)' : 'Cumulative Curve (CDF)'}</span>
                                        </button>
                                    </div>

                                    {/* Export View Button */}
                                    <button 
                                        onClick={() => captureElement(moeDistRef.current, 'distribucion_moe_carcinogenos')}
                                        disabled={isExporting}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
                                        title={language === 'es' ? 'Exportar gráfico de MOE' : 'Export MOE chart'}
                                    >
                                        <Download size={14} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="h-[360px] w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    {moeSubView === 'tiers' ? (
                                        <BarChart data={moeTiersData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                            <XAxis 
                                                dataKey="name" 
                                                stroke="#94a3b8" 
                                                fontSize={11} 
                                                tick={{ fill: '#64748b', fontWeight: 'bold' }} 
                                            />
                                            <YAxis 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                unit="%" 
                                                domain={[0, (dataMax: number) => Math.min(100, Math.ceil((dataMax + 10) / 10) * 10)]}
                                                label={{ value: '% de la Población Simulada', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length > 0) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs max-w-xs space-y-1.5">
                                                                <p className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                                                                    <span>{d.label}</span>
                                                                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                                                                        {d.percentage.toFixed(2)}%
                                                                    </span>
                                                                </p>
                                                                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                                                    <p><strong>Individuos:</strong> {d.count.toLocaleString('es-ES')} de {totalValid.toLocaleString('es-ES')}</p>
                                                                    <p><strong>Acumulado inferior:</strong> {d.cumulativeBelow.toFixed(1)}%</p>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                                                                    {d.interpretation}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar isAnimationActive={!isExporting} dataKey="percentage" radius={[6, 6, 0, 0]}>
                                                {moeTiersData.map((entry, index) => (
                                                    <Cell key={`tier-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={moeCdfPoints} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                                            <defs>
                                                <linearGradient id="moeCdfGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                            <XAxis 
                                                dataKey="moe" 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                tick={{ fill: '#64748b' }}
                                                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                                                label={{ value: 'Margen de Exposición (MOE)', position: 'bottom', offset: 12, fill: '#64748b', fontSize: 10 }}
                                            />
                                            <YAxis 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                unit="%" 
                                                domain={[0, 100]}
                                                label={{ value: '% Población Acumulada con MOE ≤ x', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length > 0) {
                                                        const p = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                                                <p className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
                                                                    MOE = {formatNumberES(p.moe, 1)}
                                                                </p>
                                                                <p className="text-slate-600 dark:text-slate-300">
                                                                    <strong>Población acumulada:</strong> {p.probBelow.toFixed(2)}%
                                                                </p>
                                                                <p className="text-slate-600 dark:text-slate-300 font-mono">
                                                                    <strong>Exposición equivalente:</strong> {formatNumberES(p.exposure_ug, 4)} µg/kg pc/d
                                                                </p>
                                                                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                                                                    p.isConcern ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                }`}>
                                                                    {p.isConcern ? 'Zona de Preocupación EFSA' : 'Zona de Seguridad'}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <ReferenceLine 
                                                x={activeThreshold} 
                                                stroke="#dc2626" 
                                                strokeWidth={2} 
                                                strokeDasharray="4 4" 
                                                label={{ 
                                                    value: `Umbral de Seguridad: ${activeThreshold.toLocaleString('es-ES')}`, 
                                                    position: 'top', 
                                                    fill: '#dc2626', 
                                                    fontSize: 10, 
                                                    fontWeight: 'bold' 
                                                }} 
                                            />
                                            {pctBelowSafety > 0 && (
                                                <ReferenceLine 
                                                    y={pctBelowSafety} 
                                                    stroke="#ef4444" 
                                                    strokeWidth={1.5} 
                                                    strokeDasharray="2 2" 
                                                    label={{ 
                                                        value: `${pctBelowSafety.toFixed(1)}% bajo umbral`, 
                                                        position: 'right', 
                                                        fill: '#ef4444', 
                                                        fontSize: 9,
                                                        fontWeight: 'bold' 
                                                    }} 
                                                />
                                            )}
                                            <Area 
                                                isAnimationActive={!isExporting} 
                                                type="monotone" 
                                                dataKey="probBelow" 
                                                stroke="#2563eb" 
                                                strokeWidth={2.5} 
                                                fill="url(#moeCdfGrad)" 
                                            />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Toxicological Context & EFSA / JECFA Reference Note */}
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-3">
                            <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                <Info size={14} className="text-blue-500" />
                                {language === 'es' ? 'Fundamento Toxicológico y Criterios Normativos (EFSA / JECFA)' : 'Toxicological Rationale & Regulatory Framework (EFSA / JECFA)'}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                <div className="space-y-1.5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">
                                        Fórmula y Principio del Margen de Exposición (MOE):
                                    </p>
                                    <p>
                                        El Margen de Exposición se calcula como el cociente entre el Punto de Partida toxicológico y la ingesta dietaria estimada de cada individuo:
                                    </p>
                                    <p className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg text-center">
                                        MOE = PoD (µg/kg pc/día) / Exposición (µg/kg pc/día)
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                        A menor valor de MOE, mayor es el riesgo potencial para la salud pública.
                                    </p>
                                </div>

                                <div className="space-y-1.5 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">
                                        {activeThreshold === 10000 
                                            ? 'Criterio EFSA 2005 (Bioensayos Animales - BMDL10):'
                                            : 'Criterio EFSA 2024 (Epidemiología Humana - BMDL05):'}
                                    </p>
                                    {activeThreshold === 10000 ? (
                                        <>
                                            <p>
                                                Para sustancias carcinógenas y genotóxicas (ej. aflatoxinas, acrilamida), la EFSA considera que un <strong>MOE ≥ 10.000</strong> es de baja preocupación para la salud pública.
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Este factor de 10.000 integra: variabilidad inter-especies (10×), intra-especies humana (10×) e incertidumbre adicional por carcinogenicidad sin umbral (100×). Total: 10 × 10 × 100 = 10.000.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p>
                                                Al basarse en datos epidemiológicos en humanos directos, no se aplica el factor de 10.000 inter-especies. Un <strong>MOE ≤ 1</strong> indica que la exposición de la población alcanza el rango de riesgo observado, requiriendo acción prioritaria.
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                Criterio aplicado para arsénico inorgánico ({activePod.organismo_y_año}).
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    ((chartView === 'histogram' && chartData.length > 0) ||
                    (chartView === 'density' && densityData.length > 0) ||
                    (chartView === 'exposureDist' && exposureDensityData.length > 0) ||
                    (chartView === 'exposureHistogram' && exposureHistogramData.length > 0) ||
                    (chartView === 'cdf' && (isBMDL ? moeCdfPoints.length > 0 : cdfData.length > 0)) ||
                    (chartView === 'comparison' && riskComparisonData.length > 0) ||
                    (chartView === 'scatter' && scatterData.length > 0) ||
                    (chartView === 'matrix' && matrixData.length > 0) ||
                    (chartView === 'sensitivity' && sensitivityData.length > 0) ||
                    (chartView === 'simulations' && simulationsData.length > 0) ||
                    (chartView === 'correlation' && correlationMatrix.length > 0)) ? (
                        <div ref={chartAreaRef} className="relative w-full h-full group/chart">
                            <button 
                                onClick={() => captureElement(chartAreaRef.current, `grafico_${chartView}`)}
                                className="absolute top-2 right-2 z-10 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 dark:border-slate-700 opacity-0 group-hover/chart:opacity-100 transition-opacity"
                                title={language === 'es' ? 'Exportar gráfico actual' : 'Export current chart'}
                            >
                                <Download size={16} className="text-blue-500" />
                            </button>
                            <ResponsiveContainer width="100%" height="100%">
                        {chartView === 'histogram' ? (
                            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: isBMDL ? 30 : 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                {!isBMDL && (
                                    <>
                                        <ReferenceArea {...({ x1: 0, x2: 25, fill: "#10b981", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 25, x2: 75, fill: "#34d399", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 75, x2: 100, fill: "#f59e0b", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 100, x2: 200, fill: "#ef4444", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 200, fill: "#b91c1c", fillOpacity: 0.05 } as any)} />
                                    </>
                                )}
                                <XAxis 
                                    dataKey={isBMDL ? "exposure_ug" : "midPoint"} 
                                    type="number" 
                                    domain={isBMDL ? ['auto', 'auto'] : [0, zoomThreshold]}
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tick={{fill: '#94a3b8', fontFamily: 'monospace'}} 
                                    tickFormatter={(v) => isBMDL ? formatNumberES(v, 3) : `${v.toFixed(0)}%`}
                                    label={isBMDL ? { value: 'Exposición dietaria estimada (µg/kg pc/día)', position: 'bottom', offset: 15, fontSize: 10, fill: '#64748b' } : undefined}
                                />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} isBMDL={isBMDL} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                {isBMDL ? (
                                    <>
                                        <ReferenceLine 
                                            x={p95Exposure_ug} 
                                            stroke="#f97316" 
                                            strokeWidth={2} 
                                            strokeDasharray="3 3" 
                                            label={{ value: `P95 (${formatNumberES(p95Exposure_ug, 3)} µg/kg·d)`, position: 'top', fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} 
                                        />
                                        {podRiskP95.thresholdExposure_ug !== null && (
                                            <ReferenceLine 
                                                x={podRiskP95.thresholdExposure_ug} 
                                                stroke="#ef4444" 
                                                strokeWidth={2} 
                                                strokeDasharray="4 4" 
                                                label={{ value: `Umbral MOE (${formatNumberES(podRiskP95.thresholdExposure_ug, 3)} µg/kg·d)`, position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
                                            />
                                        )}
                                    </>
                                ) : (
                                    <ReferenceLine x={100} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: t.results.refVal, position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                                )}
                                <Bar isAnimationActive={!isExporting} dataKey="count" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={getColor(entry.midPoint, isBMDL)} />))}
                                </Bar>
                                {true && (
                                    <Brush 
                                        dataKey={isBMDL ? "exposure_ug" : "midPoint"} 
                                        height={30} 
                                        stroke="#3b82f6" 
                                        fill="transparent"
                                        travellerWidth={10}
                                        startIndex={0}
                                        endIndex={chartData.length - 1}
                                        tickFormatter={(v) => isBMDL ? formatNumberES(v, 2) : `${v.toFixed(0)}%`}
                                    />
                                )}
                            </BarChart>
                        ) : chartView === 'density' ? (
                            <AreaChart data={densityData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                {isBMDL ? (
                                    <>
                                        <ReferenceArea {...({ x1: 0, x2: 0.01, fill: "#10b981", fillOpacity: 0.08 } as any)} />
                                        <ReferenceArea {...({ x1: 0.01, x2: 0.1, fill: "#f59e0b", fillOpacity: 0.08 } as any)} />
                                        <ReferenceArea {...({ x1: 0.1, x2: 1.0, fill: "#f97316", fillOpacity: 0.08 } as any)} />
                                        <ReferenceArea {...({ x1: 1.0, fill: "#ef4444", fillOpacity: 0.08 } as any)} />
                                    </>
                                ) : (
                                    <>
                                        <ReferenceArea {...({ x1: 0, x2: 25, fill: "#10b981", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 25, x2: 75, fill: "#34d399", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 75, x2: 100, fill: "#f59e0b", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 100, x2: 200, fill: "#ef4444", fillOpacity: 0.05 } as any)} />
                                        <ReferenceArea {...({ x1: 200, fill: "#b91c1c", fillOpacity: 0.05 } as any)} />
                                    </>
                                )}
                                <XAxis dataKey="x" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} type="number" domain={[0, zoomThreshold]} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} tickFormatter={(v) => v.toFixed(2)} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} isBMDL={isBMDL} />} />
                                <ReferenceLine x={100} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: isBMDL ? `${activePod.tipo_BMR} (100%)` : t.results.refVal, position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                                <Area isAnimationActive={!isExporting} type="monotone" dataKey="density" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDensity)" />
                                {true && (
                                    <Brush 
                                        dataKey="x" 
                                        height={30} 
                                        stroke="#6366f1" 
                                        fill="transparent"
                                        travellerWidth={10}
                                        startIndex={0}
                                        endIndex={densityData.length - 1}
                                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                                    />
                                )}
                            </AreaChart>
                        ) : chartView === 'exposureDist' ? (
                            <AreaChart data={exposureDensityData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                <XAxis 
                                    dataKey="x" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tick={{fill: '#94a3b8', fontFamily: 'monospace'}} 
                                    type="number" 
                                    tickFormatter={(v) => v.toExponential(2)} 
                                    label={{ value: 'mg/kg·día', position: 'bottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} tickFormatter={(v) => v.toFixed(0)} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} />} />
                                <ReferenceLine x={safeRefValue} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'ADI', position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                                <Area isAnimationActive={!isExporting} type="monotone" dataKey="density" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExposure)" />
                                {true && (
                                    <Brush 
                                        dataKey="x" 
                                        height={30} 
                                        stroke="#3b82f6" 
                                        fill="transparent"
                                        travellerWidth={10}
                                        startIndex={0}
                                        endIndex={exposureDensityData.length - 1}
                                        tickFormatter={(v) => v.toExponential(1)}
                                    />
                                )}
                            </AreaChart>
                        ) : chartView === 'exposureHistogram' ? (
                            <BarChart data={exposureHistogramData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                <XAxis 
                                    dataKey="midPoint" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tick={{fill: '#94a3b8', fontFamily: 'monospace'}} 
                                    type="number" 
                                    tickFormatter={(v) => v.toExponential(2)} 
                                    label={{ value: 'mg/kg·día', position: 'bottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} isBMDL={isBMDL} />} />
                                <ReferenceLine x={safeRefValue} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: isBMDL ? activePod.tipo_BMR : 'ADI', position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                                <Bar isAnimationActive={!isExporting} dataKey="count" radius={[2, 2, 0, 0]}>
                                    {exposureHistogramData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColor((entry.midPoint / safeRefValue) * 100, isBMDL)} />
                                    ))}
                                </Bar>
                                {exposureHistogramData.length > 0 && (
                                    <Brush 
                                        dataKey="midPoint" 
                                        height={30} 
                                        stroke="#3b82f6" 
                                        fill="transparent"
                                        travellerWidth={10}
                                        startIndex={0}
                                        endIndex={exposureHistogramData.length - 1}
                                        tickFormatter={(v) => v.toExponential(1)}
                                    />
                                )}
                            </BarChart>
                        ) : chartView === 'cdf' ? (
                            isBMDL ? (
                                <AreaChart data={moeCdfPoints} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                                    <defs>
                                        <linearGradient id="colorMoeCDF" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                    <XAxis 
                                        dataKey="moe" 
                                        stroke="#94a3b8" 
                                        fontSize={10} 
                                        tick={{ fill: '#64748b' }}
                                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                                        label={{ value: 'Margen de Exposición (MOE)', position: 'bottom', offset: 12, fill: '#64748b', fontSize: 10 }}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        fontSize={10} 
                                        unit="%" 
                                        domain={[0, 100]}
                                        tick={{ fill: '#64748b' }}
                                        label={{ value: '% Población Acumulada con MOE ≤ x', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                    />
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length > 0) {
                                                const p = payload[0].payload;
                                                return (
                                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                                        <p className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
                                                            MOE = {formatNumberES(p.moe, 1)}
                                                        </p>
                                                        <p className="text-slate-600 dark:text-slate-300">
                                                            <strong>Población acumulada:</strong> {p.probBelow.toFixed(2)}%
                                                        </p>
                                                        <p className="text-slate-600 dark:text-slate-300 font-mono">
                                                            <strong>Exposición equivalente:</strong> {formatNumberES(p.exposure_ug, 4)} µg/kg pc/d
                                                        </p>
                                                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                                                            p.isConcern ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        }`}>
                                                            {p.isConcern ? 'Zona de Preocupación EFSA' : 'Zona de Seguridad'}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <ReferenceLine 
                                        x={activeThreshold} 
                                        stroke="#dc2626" 
                                        strokeWidth={2} 
                                        strokeDasharray="4 4" 
                                        label={{ 
                                            value: `Umbral de Seguridad: ${activeThreshold.toLocaleString('es-ES')}`, 
                                            position: 'top', 
                                            fill: '#dc2626', 
                                            fontSize: 10, 
                                            fontWeight: 'bold' 
                                        }} 
                                    />
                                    {pctBelowSafety > 0 && (
                                        <ReferenceLine 
                                            y={pctBelowSafety} 
                                            stroke="#ef4444" 
                                            strokeWidth={1.5} 
                                            strokeDasharray="2 2" 
                                            label={{ 
                                                value: `${pctBelowSafety.toFixed(1)}% bajo umbral`, 
                                                position: 'right', 
                                                fill: '#ef4444', 
                                                fontSize: 9,
                                                fontWeight: 'bold' 
                                            }} 
                                        />
                                    )}
                                    <Area 
                                        isAnimationActive={!isExporting} 
                                        type="monotone" 
                                        dataKey="probBelow" 
                                        stroke="#2563eb" 
                                        strokeWidth={2.5} 
                                        fillOpacity={1} 
                                        fill="url(#colorMoeCDF)" 
                                    />
                                    {moeCdfPoints.length > 1 && (
                                        <Brush 
                                            dataKey="moe" 
                                            height={30} 
                                            stroke="#2563eb" 
                                            fill="transparent"
                                            travellerWidth={10}
                                            startIndex={0}
                                            endIndex={moeCdfPoints.length - 1}
                                            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                                        />
                                    )}
                                </AreaChart>
                            ) : (
                                <AreaChart data={cdfData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCDF" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                    <ReferenceArea {...({ x1: 0, x2: 25, fill: "#10b981", fillOpacity: 0.05 } as any)} />
                                    <ReferenceArea {...({ x1: 25, x2: 75, fill: "#34d399", fillOpacity: 0.05 } as any)} />
                                    <ReferenceArea {...({ x1: 75, x2: 100, fill: "#f59e0b", fillOpacity: 0.05 } as any)} />
                                    <ReferenceArea {...({ x1: 100, x2: 200, fill: "#ef4444", fillOpacity: 0.05 } as any)} />
                                    <ReferenceArea {...({ x1: 200, fill: "#b91c1c", fillOpacity: 0.05 } as any)} />
                                    <XAxis dataKey="risk" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} type="number" domain={[0, zoomThreshold]} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8', fontFamily: 'monospace'}} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                    <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} isBMDL={false} />} />
                                    <ReferenceLine x={100} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: t.results.refVal, position: 'top', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                                    <ReferenceLine y={0.95} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'P95', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                                    <ReferenceLine y={0.5} stroke="#6366f1" strokeDasharray="3 3" label={{ value: 'P50', position: 'right', fill: '#6366f1', fontSize: 10 }} />
                                    <Area isAnimationActive={!isExporting} type="monotone" dataKey="prob" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCDF)" />
                                    {cdfData.length > 1 && (
                                        <Brush 
                                            dataKey="risk" 
                                            height={30} 
                                            stroke="#10b981" 
                                            fill="transparent"
                                            travellerWidth={10}
                                            startIndex={0}
                                            endIndex={cdfData.length - 1}
                                            tickFormatter={(v) => `${v.toFixed(0)}%`}
                                        />
                                    )}
                                </AreaChart>
                            )
                        ) : chartView === 'comparison' ? (
                            <BarChart data={riskComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} />
                                <YAxis 
                                    stroke="#64748b" 
                                    fontSize={10} 
                                    scale={useComparisonLogScale ? "log" : "auto"}
                                    domain={useComparisonLogScale ? compLogDomain : ['auto', 'auto']}
                                    allowDataOverflow={useComparisonLogScale}
                                    tickFormatter={(v) => isBMDL ? formatNumberES(v, v < 0.1 ? 3 : 2) : v.toExponential(1)}
                                    label={{ value: isBMDL ? 'Exposición / PoD (µg/kg pc/día)' : 'mg/kg·d', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length > 0 && payload[0].payload) {
                                            const data = payload[0].payload;
                                            const isRefBar = isBMDL 
                                                ? data.name === podLabel 
                                                : (data.name.includes('BMDL') || data.name === t.results.refVal.replace('100% ', ''));
                                            const compMoe = isBMDL && !isRefBar && data.value > 0 ? (podValor / data.value) : undefined;
                                            const compRisk = compMoe !== undefined ? classifyPoDRisk(activePod, compMoe) : undefined;
                                            return (
                                                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-sm min-w-[250px]">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-2 mb-2 flex items-center justify-between">
                                                        <span>{data.name}</span>
                                                        {isBMDL && !isRefBar && compRisk && (
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${compRisk.badgeClass}`}>
                                                                {compRisk.category}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-gray-500 text-xs">{isBMDL ? 'Nivel:' : (language === 'es' ? 'Valor:' : 'Value:')}</span>
                                                            <span className="font-mono font-bold text-blue-600 text-xs">
                                                                {isBMDL 
                                                                    ? `${formatNumberES(data.value, 4)} µg/kg pc/día`
                                                                    : `${data.value.toExponential(3)} mg/kg·d`}
                                                            </span>
                                                        </div>
                                                        {isBMDL && !isRefBar && compMoe !== undefined && (
                                                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1">
                                                                <div className="flex justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">MOE (Margen de Exposición):</span>
                                                                    <span className={`font-mono font-black text-xs ${compRisk?.statusLevel === 'concern' ? 'text-red-600' : compRisk?.statusLevel === 'safe' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                        {formatNumberES(compMoe, 1)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                                    <span>Criterio: {compRisk?.criterionUsed}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!isBMDL && !isRefBar && (
                                                            <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 dark:border-slate-800">
                                                                <span className="text-gray-500 text-xs">% del Límite:</span>
                                                                <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                                                                    {((data.value / safeRefValue) * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} 
                                />
                                <Bar isAnimationActive={!isExporting} dataKey="value" radius={[4, 4, 0, 0]}>
                                    {riskComparisonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : chartView === 'scatter' ? (
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis type="number" dataKey="x" name="Input" stroke="#94a3b8" fontSize={10} label={{ value: scatterVariable.split('|')[1] === 'conc' ? 'Concentration' : 'Consumption', position: 'bottom', offset: 0, fontSize: 10 }} />
                                <YAxis type="number" dataKey="y" name="Risk" stroke="#94a3b8" fontSize={10} label={{ value: 'Risk (%)', angle: -90, position: 'left', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} />} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Scatter isAnimationActive={!isExporting} name="Simulaciones" data={scatterData} fill="#6366f1" fillOpacity={0.4} shape="circle" />
                                {regressionLine && (
                                    <Line 
                                        name="Tendencia"
                                        data={regressionLine}
                                        dataKey="y"
                                        stroke="#f43f5e" 
                                        strokeWidth={2} 
                                        dot={false} 
                                        activeDot={false} 
                                        legendType="none"
                                        isAnimationActive={false}
                                    />
                                )}
                            </ScatterChart>
                        ) : chartView === 'matrix' ? (
                            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <XAxis 
                                    type="number" 
                                    dataKey="conc" 
                                    name="Concentration" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickFormatter={(v) => v.toFixed(3)}
                                    label={{ value: 'Concentración', position: 'bottom', offset: 0, fontSize: 10, fill: '#94a3b8' }}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="cons" 
                                    name="Consumption" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickFormatter={(v) => v.toFixed(3)}
                                    label={{ value: 'Consumo', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: '#94a3b8' }}
                                />
                                <ZAxis type="number" dataKey="risk" range={[50, 400]} />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs z-50 ring-1 ring-black/5">
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-slate-800 pb-2">Bin Details</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between gap-4"><span className="text-gray-500 uppercase font-bold tracking-wider">Conc:</span><span className="font-mono">{(d.conc || 0).toFixed(4)}</span></div>
                                                        <div className="flex justify-between gap-4"><span className="text-gray-500 uppercase font-bold tracking-wider">Cons:</span><span className="font-mono">{(d.cons || 0).toFixed(4)}</span></div>
                                                        <div className="flex justify-between gap-4"><span className="text-gray-500 uppercase font-bold tracking-wider">Avg Risk:</span><span className={`font-bold ${(d.risk || 0) > 100 ? 'text-red-500' : 'text-emerald-500'}`}>{(d.risk || 0).toFixed(1)}%</span></div>
                                                        <div className="flex justify-between gap-4"><span className="text-gray-500 uppercase font-bold tracking-wider">Samples:</span><span className="text-gray-700 dark:text-gray-300 font-bold">{d.count || 0}</span></div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Risk Matrix" data={matrixData} shape="square">
                                    {matrixData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColor(entry.risk)} fillOpacity={0.8} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        ) : chartView === 'sensitivity' ? (
                            <BarChart data={sensitivityData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                                <XAxis 
                                    type="number" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    domain={[-1, 1]} 
                                    label={{ value: 'Coeficiente de correlación de rangos de Spearman (r)', position: 'bottom', offset: 12, fontSize: 10, fill: '#64748b' }}
                                />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    width={180} 
                                    tick={{ fill: '#64748b' }}
                                />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} isBMDL={isBMDL} />} />
                                <Bar isAnimationActive={!isExporting} dataKey="pearson" radius={[0, 4, 4, 0]}>
                                    {sensitivityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pearson > 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : chartView === 'simulations' ? (
                            <LineChart data={simulationsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="index" stroke="#94a3b8" fontSize={10} label={{ value: 'Simulación #', position: 'bottom', offset: 0, fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" fontSize={10} label={{ value: 'Riesgo (%)', angle: -90, position: 'left', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip totalSamples={totalSamples} language={language} riskStats={safeRiskStats} />} />
                                <Legend verticalAlign="top" height={36} iconType="plainline" />
                                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Límite', position: 'right', fill: '#ef4444', fontSize: 10 }} />
                                <Line isAnimationActive={!isExporting} type="monotone" dataKey="risk" name="P95" stroke="#6366f1" strokeWidth={2} dot={false} />
                                <Line isAnimationActive={!isExporting} type="monotone" dataKey="mean" name="Media" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                                <Line isAnimationActive={!isExporting} type="monotone" dataKey="p50" name="Mediana" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                            </LineChart>
                        ) : chartView === 'correlation' ? (
                            <ScatterChart margin={{ top: 20, right: 60, left: 100, bottom: 80 }}>
                                <XAxis 
                                    dataKey="xi" 
                                    type="number" 
                                    domain={[ -0.5, (results.simulationData?.foodInputs?.length || 0) + 0.5 ]}
                                    ticks={Array.from({ length: (results.simulationData?.foodInputs?.length || 0) + 1 }, (_, i) => i)}
                                    tickFormatter={(i) => {
                                        if (i === variableNames.length - 1) return t.results.risk;
                                        return variableNames[i] || '';
                                    }}
                                    stroke="#94a3b8"
                                    fontSize={9}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis 
                                    dataKey="yj" 
                                    type="number" 
                                    domain={[ -0.5, (results.simulationData?.foodInputs?.length || 0) + 0.5 ]}
                                    ticks={Array.from({ length: (results.simulationData?.foodInputs?.length || 0) + 1 }, (_, i) => i)}
                                    tickFormatter={(i) => {
                                        if (i === variableNames.length - 1) return t.results.risk;
                                        return variableNames[i] || '';
                                    }}
                                    stroke="#94a3b8"
                                    fontSize={9}
                                    interval={0}
                                />
                                <ZAxis type="number" dataKey="correlation" range={[10, 10]} />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length > 0 && payload[0].payload) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 rounded shadow-lg text-[10px]">
                                                    <p className="font-bold">{data.x} vs {data.y}</p>
                                                    <p className={data.correlation > 0 ? "text-emerald-500" : "text-red-500"}>Corr: {data.value}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter 
                                    isAnimationActive={!isExporting}
                                    data={correlationMatrix} 
                                    shape={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const corr = payload.correlation;
                                        // Non-linear color mapping to make small correlations more visible
                                        const color = corr > 0 ? '#10b981' : corr < 0 ? '#ef4444' : '#f1f5f9';
                                        const absCorr = Math.abs(corr || 0);
                                        // Minimum opacity of 0.15 for better visibility of low correlations
                                        let opacity = absCorr >= 1 ? 1 : 0.15 + absCorr * 0.7;
                                        if (isNaN(opacity)) opacity = 0.15;
                                        
                                        const numVars = (results.simulationData?.foodInputs?.length || 0) + 1;
                                        const size = Math.min(30, 400 / numVars);
                                        
                                        return (
                                            <g>
                                                <rect 
                                                    x={cx - size/2} 
                                                    y={cy - size/2} 
                                                    width={size} 
                                                    height={size} 
                                                    fill={color} 
                                                    fillOpacity={opacity}
                                                    stroke="#fff" 
                                                    strokeWidth={0.5} 
                                                />
                                                {absCorr > 0.05 && size > 15 && (
                                                    <text
                                                        x={cx}
                                                        y={cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fill={absCorr > 0.6 ? '#fff' : color}
                                                        fontSize={Math.max(8, size / 3)}
                                                        fontWeight="900"
                                                        className="select-none pointer-events-none"
                                                        style={{ pointerEvents: 'none' }}
                                                    >
                                                        {(corr || 0).toFixed(2)}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    }}
                                />
                            </ScatterChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 italic">
                                {t.results.noData}
                            </div>
                        )}
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 italic">
                            {t.results.noData}
                        </div>
                    )
                )}
            </div>

            {/* Floating Controls - Bottom Right */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                {(['histogram', 'density', 'cdf'].includes(chartView)) && (
                    <button 
                        onClick={() => setIsZoomed(!isZoomed)}
                        className={`p-2.5 rounded-full shadow-lg border transition-all ${isZoomed ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                        title={isZoomed ? "Show All" : "Focus (0-200%)"}
                    >
                        {isZoomed ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                )}
            </div>

        </div>
      
      </div>

      {/* View Switcher Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap justify-center gap-2">
        <div className="flex flex-wrap items-center justify-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl gap-1 overflow-x-auto max-w-full shadow-inner ring-1 ring-black/5">
            {(isBMDL
                ? (['moeDist', 'histogram', 'density', 'cdf', 'comparison', 'scatter', 'tornado', 'sensitivity', 'simulations', 'exposureDist', 'exposureHistogram', 'correlation', 'matrix', 'stats', 'recommendations', 'summary'] as const)
                : (['histogram', 'density', 'cdf', 'comparison', 'scatter', 'tornado', 'sensitivity', 'simulations', 'exposureDist', 'exposureHistogram', 'correlation', 'matrix', 'stats', 'recommendations', 'summary'] as const)
            ).map((view) => {
                if ((view === 'simulations') && (!results || !Array.isArray(results.allSimulationResults))) return null;
                const isTornado = view === 'tornado';
                const isMoe = view === 'moeDist';
                return (
                    <button 
                        key={view}
                        onClick={() => setChartView(view)}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-tight rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          chartView === view 
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105 ring-1 ring-blue-500/20' 
                            : isTornado 
                            ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40' 
                            : isMoe
                            ? 'text-red-600 dark:text-red-400 font-extrabold bg-red-50/70 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 ring-1 ring-red-500/30'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        {isTornado && <Wind size={13} className="text-blue-500" />}
                        {isMoe && <ShieldAlert size={13} className={chartView === 'moeDist' ? 'text-blue-500' : 'text-red-500 animate-pulse'} />}
                        {chartInfo[view]?.title || view}
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
