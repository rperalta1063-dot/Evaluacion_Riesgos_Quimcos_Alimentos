import React, { useState, useMemo, useRef } from 'react';
import { SimulationResult, Language } from '../types';
import { 
  computeTornadoAnalysis, 
  TornadoPercentileSpan, 
  TornadoVariableFilter, 
  TornadoSortingMetric 
} from '../services/tornadoService';
import html2canvas from 'html2canvas-pro';
import { 
  Wind, 
  Download, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Utensils,
  FlaskConical,
  ArrowRight,
  TrendingUp,
  Percent,
  ArrowDownUp,
  Activity
} from 'lucide-react';

interface Props {
  results: SimulationResult | null;
  language: Language;
}

export const TornadoAnalysis: React.FC<Props> = ({ results, language }) => {
  const [span, setSpan] = useState<TornadoPercentileSpan>('p10_p90');
  const [filter, setFilter] = useState<TornadoVariableFilter>('all');
  const [metric, setMetric] = useState<'swing' | 'correlation'>('swing');
  const [riskScale, setRiskScale] = useState<'percent' | 'hq'>('percent');
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<'rank' | 'swing' | 'highRisk' | 'pearson'>('swing');
  const [sortAsc, setSortAsc] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => {
    const sortingMetric: TornadoSortingMetric = metric === 'correlation' ? 'correlation' : 'swing';
    return computeTornadoAnalysis(results, span, filter, sortingMetric, language);
  }, [results, span, filter, metric, language]);

  // Sort items for the table
  const sortedTableItems = useMemo(() => {
    const items = [...report.filteredItems];
    items.sort((a, b) => {
      let diff = 0;
      if (sortColumn === 'rank') diff = a.rank - b.rank;
      else if (sortColumn === 'swing') diff = b.swing - a.swing;
      else if (sortColumn === 'highRisk') diff = b.highRisk - a.highRisk;
      else if (sortColumn === 'pearson') diff = Math.abs(b.pearson) - Math.abs(a.pearson);
      return sortAsc ? -diff : diff;
    });
    return items;
  }, [report.filteredItems, sortColumn, sortAsc]);

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `analisis_tornado_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting Tornado PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const t = {
    es: {
      title: "Análisis de Sensibilidad Tornado",
      subtitle: "Identifica qué variables de entrada (concentración de contaminante o consumo de alimento en unidades reales) generan el mayor impacto y oscilación sobre el riesgo toxicológico estimado.",
      modeSwing: "Impacto en Riesgo",
      modeCorr: "Correlación (r)",
      scalePercent: "% VRT / ADI",
      scaleHQ: "Cociente HQ",
      p10_90: "P10 - P90 (Rango 80%)",
      p5_95: "P5 - P95 (Rango 90%)",
      min_max: "Mín - Máx (Rango Total)",
      filterAll: "Todas las Variables",
      filterConc: "Solo Concentración",
      filterCons: "Solo Consumo",
      exportBtn: "Exportar PNG",
      exporting: "Generando...",
      driverTitle: "Variable Crítica Dominante",
      driverDesc: "Mayor oscilación individual sobre el riesgo total",
      balanceTitle: "Balance Residuos vs Dieta",
      concDominance: "Concentración (Residuo)",
      consDominance: "Consumo (Dieta)",
      baseRiskTitle: "Riesgo Base (Mediana OAT)",
      baseRiskDesc: "Nivel de riesgo con variables en P50",
      mcCoherenceLabel: "Coherencia Monte Carlo",
      alertTitle: "Variables Críticas",
      alertDesc: "Superan el 100% de la ADI (HQ > 1.0) en su valor alto",
      noAlerts: "Ninguna variable individual supera el límite toxicológico",
      tornadoChartTitle: "Diagrama de Embudo Tornado",
      baselineLabel: "Línea Base P50",
      safeLimitLabel: "Límite Toxicológico (100% ADI / HQ=1.0)",
      lowLabel: "Valor Bajo",
      highLabel: "Valor Alto",
      swingLabel: "Oscilación Δ",
      tableTitle: "Desglose Cuantitativo de Sensibilidad",
      colRank: "#",
      colVar: "Variable de Entrada",
      colType: "Tipo",
      colLow: "P. Bajo",
      colBase: "Base (P50)",
      colHigh: "P. Alto",
      colLowRisk: "Riesgo Bajo",
      colHighRisk: "Riesgo Alto",
      colSwing: "Δ Oscilación",
      colCorr: "Pearson (r)",
      colSpearman: "Spearman (ρ)",
      colContrib: "Aporte al Swing",
      concBadge: "Concentración",
      consBadge: "Consumo",
      recTitle: "Conclusiones Toxicológicas y Gestión del Riesgo",
      recConcDriven: "El riesgo toxicológico está impulsado predominantemente por la concentración de contaminantes. Se recomienda priorizar Buenas Prácticas Agrícolas (BPA), control de Límites Máximos de Residuos (LMR) y monitoreo en frontera de materias primas.",
      recConsDriven: "El riesgo está determinado principalmente por patrones de alto consumo poblacional. Las medidas de gestión deben complementarse con guías dietéticas y diversificación del consumo de alimentos.",
      recMixed: "Tanto la concentración como los hábitos de consumo influyen de forma equilibrada en el riesgo acumulado. Se requiere un enfoque integral de vigilancia sanitaria y evaluación de ingesta.",
      emptyData: "No hay datos de simulación disponibles para generar el análisis de Tornado."
    },
    en: {
      title: "Tornado Sensitivity Analysis",
      subtitle: "Identifies which input variables (chemical concentration or food consumption in real units) generate the greatest impact and swing on estimated toxicological risk.",
      modeSwing: "Risk Impact",
      modeCorr: "Correlation (r)",
      scalePercent: "% ADI / TDI",
      scaleHQ: "HQ Ratio",
      p10_90: "P10 - P90 (80% Range)",
      p5_95: "P5 - P95 (90% Range)",
      min_max: "Min - Max (Full Range)",
      filterAll: "All Variables",
      filterConc: "Concentration Only",
      filterCons: "Consumption Only",
      exportBtn: "Export PNG",
      exporting: "Generating...",
      driverTitle: "Dominant Critical Driver",
      driverDesc: "Largest individual swing on overall risk",
      balanceTitle: "Residue vs Diet Balance",
      concDominance: "Concentration (Residue)",
      consDominance: "Consumption (Diet)",
      baseRiskTitle: "Baseline Risk (P50 OAT)",
      baseRiskDesc: "Risk level with variables at P50",
      mcCoherenceLabel: "Monte Carlo Coherence",
      alertTitle: "Critical Variables",
      alertDesc: "Exceed 100% ADI (HQ > 1.0) at upper percentile",
      noAlerts: "No single variable exceeds toxicological limit",
      tornadoChartTitle: "Tornado Funnel Plot",
      baselineLabel: "P50 Baseline",
      safeLimitLabel: "Toxicological Limit (100% ADI / HQ=1.0)",
      lowLabel: "Low Value",
      highLabel: "High Value",
      swingLabel: "Swing Δ",
      tableTitle: "Quantitative Sensitivity Breakdown",
      colRank: "#",
      colVar: "Input Variable",
      colType: "Type",
      colLow: "Low P.",
      colBase: "Base (P50)",
      colHigh: "High P.",
      colLowRisk: "Low Risk",
      colHighRisk: "High Risk",
      colSwing: "Δ Swing",
      colCorr: "Pearson (r)",
      colSpearman: "Spearman (ρ)",
      colContrib: "Swing Share",
      concBadge: "Concentration",
      consBadge: "Consumption",
      recTitle: "Toxicological Conclusions & Risk Management",
      recConcDriven: "Toxicological risk is predominantly driven by contaminant concentration. Prioritizing Good Agricultural Practices (GAP), enforcement of Maximum Residue Limits (MRLs), and border inspection is recommended.",
      recConsDriven: "Risk is primarily driven by high dietary intake patterns. Management measures should be complemented with dietary guidelines and food consumption diversification.",
      recMixed: "Both contaminant concentration and dietary consumption patterns have a balanced influence on cumulative risk. An integrated surveillance and dietary assessment approach is recommended.",
      emptyData: "No simulation data available to generate the Tornado analysis."
    },
    fr: {
      title: "Analyse de Sensibilité Tornade",
      subtitle: "Identifie quelles variables d'entrée (concentration ou consommation d'aliments en unités réelles) génèrent le plus grand impact sur le risque toxicologique estimé.",
      modeSwing: "Impact Risque",
      modeCorr: "Corrélation (r)",
      scalePercent: "% DJA / VTR",
      scaleHQ: "Quotient HQ",
      p10_90: "P10 - P90 (Étendue 80%)",
      p5_95: "P5 - P95 (Étendue 90%)",
      min_max: "Min - Max (Étendue Totale)",
      filterAll: "Toutes les Variables",
      filterConc: "Concentration Seule",
      filterCons: "Consommation Seule",
      exportBtn: "Exporter PNG",
      exporting: "Génération...",
      driverTitle: "Facteur Critique Dominant",
      driverDesc: "Plus grande oscillation individuelle sur le risque global",
      balanceTitle: "Équilibre Résidus vs Régime",
      concDominance: "Concentration (Résidu)",
      consDominance: "Consommation (Régime)",
      baseRiskTitle: "Risque de Base (Médiane OAT)",
      baseRiskDesc: "Niveau de risque avec les variables au P50",
      mcCoherenceLabel: "Cohérence Monte Carlo",
      alertTitle: "Variables Critiques",
      alertDesc: "Dépassent 100% de la DJA (HQ > 1.0) à leur valeur haute",
      noAlerts: "Aucune variable individuelle ne dépasse la limite toxicologique",
      tornadoChartTitle: "Diagramme en Entonnoir Tornade",
      baselineLabel: "Ligne de Base P50",
      safeLimitLabel: "Limite Toxicologique (100% DJA / HQ=1.0)",
      lowLabel: "Valeur Basse",
      highLabel: "Valeur Haute",
      swingLabel: "Oscillation Δ",
      tableTitle: "Détail Quantitatif de Sensibilité",
      colRank: "#",
      colVar: "Variable d'Entrée",
      colType: "Type",
      colLow: "P. Bas",
      colBase: "Base (P50)",
      colHigh: "P. Haut",
      colLowRisk: "Risque Bas",
      colHighRisk: "Risque Haut",
      colSwing: "Δ Oscillation",
      colCorr: "Pearson (r)",
      colSpearman: "Spearman (ρ)",
      colContrib: "Part du Swing",
      concBadge: "Concentration",
      consBadge: "Consommation",
      recTitle: "Conclusions Toxicologiques et Gestion du Risque",
      recConcDriven: "Le risque toxicologique est principalement dicté par la concentration des contaminants. Il est recommandé de privilégier les Bonnes Pratiques Agricoles (BPA) et le contrôle des LMR.",
      recConsDriven: "Le risque est principalement dicté par les habitudes de consommation élevée. Les mesures de gestion doivent inclure des conseils nutritionnels et la diversification alimentaire.",
      recMixed: "La concentration et les habitudes alimentaires influencent de manière équilibrée le risque cumulé.",
      emptyData: "Aucune donnée de simulation disponible pour générer l'analyse Tornade."
    }
  }[language];

  if (!results || report.items.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
        <Wind className="w-12 h-12 mx-auto text-blue-500 mb-3 opacity-60" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">{t.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t.emptyData}</p>
      </div>
    );
  }

  // Format numbers cleanly according to their magnitude
  const formatInputVal = (v: number) => {
    if (v === undefined || isNaN(v)) return '0.00';
    if (Math.abs(v) >= 100) return v.toFixed(1);
    if (Math.abs(v) >= 1) return v.toFixed(2);
    if (Math.abs(v) >= 0.01) return v.toFixed(3);
    if (Math.abs(v) >= 0.0001) return v.toFixed(4);
    return v.toExponential(2);
  };

  // Format risk metric
  const formatRiskVal = (rPercent: number, rHQ: number) => {
    if (riskScale === 'hq') {
      return `${rHQ < 0.01 ? rHQ.toExponential(2) : rHQ.toFixed(3)} HQ`;
    }
    return `${rPercent.toFixed(1)}%`;
  };

  const formatSwingDelta = (swingPercent: number, swingHQ: number) => {
    if (riskScale === 'hq') {
      return `Δ ${swingHQ < 0.01 ? swingHQ.toExponential(2) : swingHQ.toFixed(3)} HQ`;
    }
    return `Δ ${swingPercent.toFixed(1)}%`;
  };

  // Calculate dynamic scales for the visual tornado plot
  const useHQ = metric === 'swing' && riskScale === 'hq';

  const maxRiskValue = useHQ
    ? Math.max(1.05, report.baselineHQ * 1.25, ...report.filteredItems.map(i => i.highHQ))
    : Math.max(105, report.baselineRisk * 1.25, ...report.filteredItems.map(i => i.highRisk));

  const minRiskValue = useHQ
    ? Math.min(0, ...report.filteredItems.map(i => i.lowHQ))
    : Math.min(0, ...report.filteredItems.map(i => i.lowRisk));

  const chartRiskRange = maxRiskValue - minRiskValue || (useHQ ? 1.0 : 100);

  // Baseline position percentage
  const baselineLeftPercent = metric === 'swing'
    ? Math.max(5, Math.min(95, (((useHQ ? report.baselineHQ : report.baselineRisk) - minRiskValue) / chartRiskRange) * 100))
    : 50;

  // Toxicological reference threshold position (100% ADI or 1.0 HQ)
  const thresholdVal = useHQ ? 1.0 : 100;
  const isThresholdInRange = metric === 'swing' && thresholdVal >= minRiskValue && thresholdVal <= maxRiskValue;
  const thresholdLeftPercent = isThresholdInRange
    ? ((thresholdVal - minRiskValue) / chartRiskRange) * 100
    : 0;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <Wind size={20} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {t.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scale switch (% vs HQ) */}
            {metric === 'swing' && (
              <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-gray-200/60 dark:border-slate-700">
                <button
                  onClick={() => setRiskScale('percent')}
                  className={`py-1.5 px-2.5 rounded-lg transition-all ${
                    riskScale === 'percent'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {t.scalePercent}
                </button>
                <button
                  onClick={() => setRiskScale('hq')}
                  className={`py-1.5 px-2.5 rounded-lg transition-all ${
                    riskScale === 'hq'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {t.scaleHQ}
                </button>
              </div>
            )}

            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm text-xs font-bold transition-all flex items-center gap-2"
            >
              <Download size={14} className="text-blue-500" />
              {isExporting ? t.exporting : t.exportBtn}
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {/* Mode Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setMetric('swing')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                metric === 'swing'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t.modeSwing}
            </button>
            <button
              onClick={() => setMetric('correlation')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                metric === 'correlation'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t.modeCorr}
            </button>
          </div>

          {/* Percentile Span (Only active for Swing mode) */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              disabled={metric === 'correlation'}
              onClick={() => setSpan('p10_p90')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                span === 'p10_p90' && metric === 'swing'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 opacity-80'
              } ${metric === 'correlation' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t.p10_90}
            </button>
            <button
              disabled={metric === 'correlation'}
              onClick={() => setSpan('p5_p95')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                span === 'p5_p95' && metric === 'swing'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 opacity-80'
              } ${metric === 'correlation' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t.p5_95}
            </button>
            <button
              disabled={metric === 'correlation'}
              onClick={() => setSpan('min_max')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                span === 'min_max' && metric === 'swing'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 opacity-80'
              } ${metric === 'correlation' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {t.min_max}
            </button>
          </div>

          {/* Variable Filter */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilter('conc')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filter === 'conc'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t.filterConc}
            </button>
            <button
              onClick={() => setFilter('cons')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filter === 'cons'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t.filterCons}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Top Critical Driver */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-800 dark:to-slate-800/60 p-4 rounded-2xl border border-blue-100/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">{t.driverTitle}</span>
            <Sparkles size={16} />
          </div>
          <p className="text-base font-black text-gray-900 dark:text-gray-100 truncate">
            {report.topDriver ? report.topDriver.displayName : 'N/A'}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {report.topDriver 
                ? (riskScale === 'hq' 
                    ? `Δ ${report.topDriver.swingHQ.toFixed(3)} HQ` 
                    : `Δ ${report.topDriver.swing.toFixed(1)}%`) 
                : '0.0'}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              ({report.topDriver ? report.topDriver.swingPercentage.toFixed(1) : 0}% del swing total)
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
            {t.driverDesc}
          </p>
        </div>

        {/* Card 2: Residue vs Dietary Intake Balance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">{t.balanceTitle}</span>
            <SlidersHorizontal size={16} className="text-teal-500" />
          </div>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-purple-600 dark:text-purple-400">{t.concDominance}</span>
            <span className="text-teal-600 dark:text-teal-400">{t.consDominance}</span>
          </div>
          {/* Dual progress bar */}
          <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${report.concContributionPct}%` }}
              title={`Concentración: ${report.concContributionPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${report.consContributionPct}%` }}
              title={`Consumo: ${report.consContributionPct.toFixed(1)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-extrabold mt-1 text-gray-600 dark:text-gray-300">
            <span>{report.concContributionPct.toFixed(0)}%</span>
            <span>{report.consContributionPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Card 3: Baseline Risk & MC Statistical Coherence */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider">{t.baseRiskTitle}</span>
              <Percent size={16} className="text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {riskScale === 'hq' ? `${report.baselineHQ.toFixed(3)} HQ` : `${report.baselineRisk.toFixed(1)}%`}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                {riskScale === 'hq' ? 'Cociente HQ' : 'del VRT / ADI'}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-gray-400 mb-1">
              <span>{t.mcCoherenceLabel}</span>
              <Activity size={10} className="text-indigo-400" />
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div className="bg-gray-50 dark:bg-slate-900/50 p-1 rounded text-center">
                <span className="text-gray-400 block text-[8px]">MC P50</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {riskScale === 'hq' ? `${(report.mcP50Risk / 100).toFixed(2)}` : `${report.mcP50Risk.toFixed(1)}%`}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-1 rounded text-center">
                <span className="text-gray-400 block text-[8px]">MC P90</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {riskScale === 'hq' ? `${(report.mcP90Risk / 100).toFixed(2)}` : `${report.mcP90Risk.toFixed(1)}%`}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-1 rounded text-center">
                <span className="text-gray-400 block text-[8px]">MC P95</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {riskScale === 'hq' ? `${report.mcHQ.toFixed(2)}` : `${report.mcP95Risk.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Critical Exceedances */}
        <div className={`p-4 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${
          report.criticalVariablesCount > 0
            ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
            : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-black uppercase tracking-wider ${
                report.criticalVariablesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {t.alertTitle}
              </span>
              {report.criticalVariablesCount > 0 ? (
                <AlertTriangle size={16} className="text-red-600 animate-pulse" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-600" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                report.criticalVariablesCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {report.criticalVariablesCount}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">variables</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-2">
            {report.criticalVariablesCount > 0 ? t.alertDesc : t.noAlerts}
          </p>
        </div>
      </div>

      {/* Main Interactive Visual Tornado Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-slate-800 gap-2">
          <div>
            <h4 className="text-base font-black text-gray-900 dark:text-gray-100">
              {t.tornadoChartTitle}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {metric === 'swing'
                ? `Barras horizontales centradas en el Riesgo Base P50 (${formatRiskVal(report.baselineRisk, report.baselineHQ)}). Extensión izquierda: percentil bajo (P${report.percentileLow}). Extensión derecha: percentil alto (P${report.percentileHigh}).`
                : "Barras bidireccionales de correlación respecto a cero. Izquierda: correlación negativa (amortiguadora). Derecha: correlación positiva (amplificadora de riesgo)."
              }
            </p>
          </div>

          {/* Legend Badges */}
          <div className="flex items-center gap-3 text-[11px] font-bold">
            {metric === 'swing' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                  <span className="text-gray-600 dark:text-gray-400">{t.lowLabel} (P{report.percentileLow})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
                  <span className="text-gray-600 dark:text-gray-400">{t.highLabel} (P{report.percentileHigh})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-red-500 inline-block" />
                  <span className="text-gray-600 dark:text-gray-400">&gt; Límite Toxicológico</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-500 inline-block" />
                  <span className="text-gray-600 dark:text-gray-400">r &lt; 0 (Protector)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-orange-500 inline-block" />
                  <span className="text-gray-600 dark:text-gray-400">r &gt; 0 (Riesgo)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Funnel Rows */}
        <div className="relative pt-2 pb-6 space-y-3">
          {/* Vertical Baseline / Center Reference Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-slate-400 dark:bg-slate-500 z-10 pointer-events-none border-l-2 border-dashed border-slate-400 dark:border-slate-500"
            style={{ left: `${baselineLeftPercent}%` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
              {metric === 'swing' ? `${t.baselineLabel}: ${formatRiskVal(report.baselineRisk, report.baselineHQ)}` : 'r = 0.0'}
            </div>
          </div>

          {/* Critical Toxicological Threshold Line (100% ADI or 1.0 HQ) */}
          {isThresholdInRange && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-red-500/80 z-10 pointer-events-none"
              style={{ left: `${thresholdLeftPercent}%` }}
            >
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                {t.safeLimitLabel}
              </div>
            </div>
          )}

          {/* Rows for each variable */}
          {report.filteredItems.map((item) => {
            const isHovered = hoveredItemId === item.id;
            
            // Current risk values depending on riskScale
            const currentBaseRisk = useHQ ? report.baselineHQ : report.baselineRisk;
            const currentLowRisk = useHQ ? item.lowHQ : item.lowRisk;
            const currentHighRisk = useHQ ? item.highHQ : item.highRisk;

            // Swing Mode Geometry
            // Left bar extends from lowRisk to baselineRisk
            const leftBarLeft = Math.max(0, ((Math.min(currentLowRisk, currentBaseRisk) - minRiskValue) / chartRiskRange) * 100);
            const leftBarRight = Math.min(100, ((Math.max(currentLowRisk, currentBaseRisk) - minRiskValue) / chartRiskRange) * 100);
            const leftBarWidth = Math.max(0.5, leftBarRight - leftBarLeft);

            // Right bar extends from baselineRisk to highRisk
            const rightBarLeft = Math.max(0, ((Math.min(currentHighRisk, currentBaseRisk) - minRiskValue) / chartRiskRange) * 100);
            const rightBarRight = Math.min(100, ((Math.max(currentHighRisk, currentBaseRisk) - minRiskValue) / chartRiskRange) * 100);
            const rightBarWidth = Math.max(0.5, rightBarRight - rightBarLeft);

            // Correlation Mode Geometry: -1 to +1 centered at 50%
            const corrLeft = item.pearson < 0 ? (50 + item.pearson * 45) : 50;
            const corrWidth = Math.abs(item.pearson) * 45;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className={`p-3 rounded-2xl border transition-all ${
                  isHovered
                    ? 'bg-blue-50/60 dark:bg-slate-800/80 border-blue-200 dark:border-blue-700/60 shadow-md ring-1 ring-blue-500/20'
                    : 'bg-gray-50/50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800'
                }`}
              >
                {/* Header of the variable row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-gray-200 dark:bg-slate-700 text-[10px] font-black text-gray-700 dark:text-gray-300 flex items-center justify-center">
                      #{item.rank}
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                      {item.foodName}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.variableType === 'conc'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}>
                      {item.variableType === 'conc' ? t.concBadge : t.consBadge}
                    </span>

                    {item.isHighRisk && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800">
                        <AlertTriangle size={10} /> &gt; {useHQ ? '1.0 HQ' : '100% ADI'}
                      </span>
                    )}
                  </div>

                  {/* Right metrics label */}
                  <div className="flex items-center gap-3 text-xs">
                    {metric === 'swing' ? (
                      <>
                        <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                          [{formatRiskVal(item.lowRisk, item.lowHQ)} <ArrowRight size={10} className="inline mx-0.5" /> {formatRiskVal(item.highRisk, item.highHQ)}]
                        </span>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                          {formatSwingDelta(item.swing, item.swingHQ)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-gray-500">
                          r = <strong className="text-gray-900 dark:text-gray-100">{item.pearson.toFixed(3)}</strong>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          (ρ = {item.spearman.toFixed(3)})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Horizontal Bar Graphic */}
                <div className="relative h-6 bg-white dark:bg-slate-900/80 rounded-xl overflow-hidden border border-gray-200/60 dark:border-slate-700/60 shadow-inner flex items-center">
                  {metric === 'swing' ? (
                    <>
                      {/* Left Swing Bar (Low value) */}
                      <div
                        className="absolute top-1 bottom-1 rounded-l-lg bg-gradient-to-l from-emerald-500 to-teal-400 opacity-90 transition-all duration-300 flex items-center justify-start pl-1"
                        style={{
                          left: `${leftBarLeft}%`,
                          width: `${leftBarWidth}%`
                        }}
                        title={`P${report.percentileLow}: ${formatInputVal(item.lowVal)} ${item.unit} -> Riesgo: ${formatRiskVal(item.lowRisk, item.lowHQ)}`}
                      />

                      {/* Right Swing Bar (High value) */}
                      <div
                        className={`absolute top-1 bottom-1 rounded-r-lg transition-all duration-300 flex items-center justify-end pr-1 ${
                          item.isHighRisk
                            ? 'bg-gradient-to-r from-amber-500 to-red-600 opacity-95 shadow-sm'
                            : 'bg-gradient-to-r from-amber-400 to-orange-500 opacity-90'
                        }`}
                        style={{
                          left: `${rightBarLeft}%`,
                          width: `${rightBarWidth}%`
                        }}
                        title={`P${report.percentileHigh}: ${formatInputVal(item.highVal)} ${item.unit} -> Riesgo: ${formatRiskVal(item.highRisk, item.highHQ)}`}
                      />
                    </>
                  ) : (
                    /* Correlation Bar */
                    <div
                      className={`absolute top-1 bottom-1 rounded-md transition-all duration-300 ${
                        item.pearson < 0
                          ? 'bg-gradient-to-l from-blue-500 to-cyan-400'
                          : 'bg-gradient-to-r from-amber-500 to-rose-500'
                      }`}
                      style={{
                        left: `${corrLeft}%`,
                        width: `${Math.max(1, corrWidth)}%`
                      }}
                      title={`Correlación: ${item.pearson.toFixed(3)}`}
                    />
                  )}
                </div>

                {/* Sub-labels with quantitative inputs in real units (g/día, mg/kg, etc.) */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1 px-1">
                  <span>
                    {t.lowLabel}: <strong>{formatInputVal(item.lowVal)}</strong> {item.unit}
                  </span>
                  <span>
                    Base (P50): <strong>{formatInputVal(item.baseVal)}</strong> {item.unit}
                  </span>
                  <span>
                    {t.highLabel}: <strong>{formatInputVal(item.highVal)}</strong> {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quantitative Table Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-black text-gray-900 dark:text-gray-100">
            {t.tableTitle}
          </h4>
          <span className="text-xs text-gray-500">
            {report.filteredItems.length} variables analizadas en unidades normalizadas
          </span>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th
                  onClick={() => { setSortColumn('rank'); setSortAsc(!sortAsc); }}
                  className="py-3 px-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center gap-1">
                    {t.colRank}
                    <ArrowDownUp size={10} />
                  </div>
                </th>
                <th className="py-3 px-3">{t.colVar}</th>
                <th className="py-3 px-3">{t.colType}</th>
                <th className="py-3 px-3 text-right">{t.colLow}</th>
                <th className="py-3 px-3 text-right">{t.colBase}</th>
                <th className="py-3 px-3 text-right">{t.colHigh}</th>
                <th className="py-3 px-3 text-right">{t.colLowRisk}</th>
                <th
                  onClick={() => { setSortColumn('highRisk'); setSortAsc(!sortAsc); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center justify-end gap-1">
                    {t.colHighRisk}
                    <ArrowDownUp size={10} />
                  </div>
                </th>
                <th
                  onClick={() => { setSortColumn('swing'); setSortAsc(!sortAsc); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center justify-end gap-1">
                    {t.colSwing}
                    <ArrowDownUp size={10} />
                  </div>
                </th>
                <th
                  onClick={() => { setSortColumn('pearson'); setSortAsc(!sortAsc); }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <div className="flex items-center justify-end gap-1">
                    {t.colCorr}
                    <ArrowDownUp size={10} />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">{t.colContrib}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
              {sortedTableItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                    item.isHighRisk ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-gray-500">#{item.rank}</td>
                  <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-1.5">
                      {item.variableType === 'conc' ? (
                        <FlaskConical size={14} className="text-purple-500 shrink-0" />
                      ) : (
                        <Utensils size={14} className="text-teal-500 shrink-0" />
                      )}
                      <span>{item.foodName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.variableType === 'conc'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}>
                      {item.variableType === 'conc' ? t.concBadge : t.consBadge}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatInputVal(item.lowVal)} <span className="text-[10px] text-gray-400">{item.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-400 font-semibold">
                    {formatInputVal(item.baseVal)} <span className="text-[10px] text-gray-400">{item.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                    {formatInputVal(item.highVal)} <span className="text-[10px] text-gray-400">{item.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatRiskVal(item.lowRisk, item.lowHQ)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold ${
                    item.isHighRisk
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {formatRiskVal(item.highRisk, item.highHQ)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                    {formatSwingDelta(item.swing, item.swingHQ)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                    {item.pearson.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-500">
                    {item.swingPercentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actionable Toxicological Insights Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 dark:from-slate-800 dark:to-slate-800/80 rounded-3xl p-6 border border-blue-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <TrendingUp size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
            {t.recTitle}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {report.concContributionPct > 60
              ? t.recConcDriven
              : report.consContributionPct > 60
              ? t.recConsDriven
              : t.recMixed}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TornadoAnalysis;
