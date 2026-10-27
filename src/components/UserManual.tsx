
import React from 'react';
import { X, BookOpen, Target, Settings, BarChart3, Info, AlertCircle, CheckCircle2, Wind, ShieldAlert, FileText, Activity } from 'lucide-react';
import { Language } from '../types';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const content = {
    es: {
      title: "Manual de Uso: Montecarlo Food Risk",
      sections: [
        {
          id: "purpose",
          title: "1. Propósito y Objetivo",
          icon: <Target className="w-5 h-5 text-blue-500" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong>Montecarlo Food Risk</strong> es una plataforma científica avanzada para el análisis probabilístico de la exposición dietética a sustancias químicas y la caracterización toxicológica del riesgo para la salud pública. La herramienta integra rigurosamente los principios, marcos normativos y estándares de auditoría técnica del <strong>Comité Mixto FAO/OMS de Expertos en Aditivos Alimentarios (JECFA)</strong>, la <strong>Autoridad Europea de Seguridad Alimentaria (EFSA)</strong>, la <strong>Reunión Conjunta FAO/OMS sobre Residuos de Plaguicidas (JMPR)</strong> y la <strong>Agencia de Protección Ambiental de los EE. UU. (EPA)</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Modelado toxicológico bifurcado:</strong> Evaluación de sustancias químicas con umbral (IDA/ADI, TDI) mediante Cociente de Peligro (HQ) y contaminantes genotóxicos/carcinogénicos sin umbral mediante Puntos de Partida (PoD / BMDL) y Margen de Exposición (MOE).</li>
                <li><strong>Garantía de rigor toxicológico:</strong> Validación estricta que impide cálculos inválidos de IDA en carcinógenos y bloquea cálculos de MOE en sustancias con umbral biológico.</li>
                <li><strong>Simulaciones probabilísticas 1D y 2D:</strong> Modelado Monte Carlo no paramétrico/paramétrico con desagregación de variabilidad interindividual de la población e incertidumbre de muestreo (Bootstrap).</li>
                <li><strong>Métricas de protección poblacional:</strong> Auditoría automatizada en percentiles críticos (P95, P97.5, P99) y cuantificación de la población bajo umbrales normativos de seguridad.</li>
              </ul>
            </div>
          )
        },
        {
          id: "setup",
          title: "2. Configuración y Selección de Sustancias",
          icon: <Settings className="w-5 h-5 text-purple-500" />,
          content: (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm">Paso 1: Selección de Sustancia Química y Modelo Toxicológico</h4>
                <p>El sistema adapta automáticamente la metodología según la naturaleza toxicológica de la sustancia:</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Contaminantes Carcinógenos / Genotóxicos (Modelo BMDL / MOE):</strong> Para sustancias sin umbral seguro (Aflatoxina B1, Arsénico inorgánico, Acrilamida, Ocratoxina A). El sistema fuerza automáticamente el modelo de Punto de Partida (PoD) y asigna los valores de referencia oficiales:
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <li><strong>Aflatoxina B1:</strong> BMDL10 = 0,40 µg/kg pc/d (hepatocarcinoma, bioensayo animal EFSA 2020 / JECFA 2017).</li>
                      <li><strong>Arsénico inorgánico:</strong> BMDL05 = 0,06 µg/kg pc/d (cáncer de piel, epidemiología humana EFSA 2024) y BMDL0.5 = 3,0 µg/kg pc/d (cáncer de pulmón, JECFA 2010).</li>
                      <li><strong>Acrilamida:</strong> BMDL10 = 170 µg/kg pc/d (neoplasias, EFSA 2015).</li>
                      <li><strong>Ocratoxina A:</strong> BMDL10 = 14,5 µg/kg pc/d (neoplasias renales, EFSA 2020).</li>
                    </ul>
                  </li>
                  <li><strong>Sustancias con Umbral Toxicológico (Modelo IDA / ADI):</strong> Para plaguicidas (Clorpirifos, Deltametrina, Malatión, etc.) o aditivos. El sistema fuerza el modelo de Ingesta Diaria Admisible en mg/kg·día y evalúa el Cociente de Peligro (HQ), eliminando cualquier referencia a BMDL.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm">Paso 2: Gestión de Alimentos y Distribuciones</h4>
                <p>Configure las fuentes dietarias ingresando concentraciones y consumos con distribuciones estadísticas reales:</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Parametrización Aritmética (Datos Reales):</strong> Ingrese directamente la <strong>Media y Desviación Estándar Aritméticas</strong> provenientes de laboratorios de monitoreo; el motor calcula automáticamente los parámetros teóricos equivalentes (μ, σ, GM, GSD, forma, escala) para distribuciones Lognormal, Gamma, Weibull y Beta mediante el Método de los Momentos (EFSA/JMPR/JECFA).</li>
                  <li><strong>LOD/LOQ y Datos Censurados (Modo Experto):</strong> Tratamiento riguroso de muestras por debajo del límite de detección/cuantificación (Lower Bound ND=0, Medium Bound LOD/2, Upper Bound LOD).</li>
                  <li><strong>Factores de Procesamiento y Reducción:</strong> Modela la reducción o concentración de residuos por lavado, pelado, cocción o deshidratación.</li>
                  <li><strong>Guardar / Cargar Perfiles JSON:</strong> Exporte e importe conjuntos de alimentos para auditorías repetibles.</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: "moe",
          title: "3. Caracterización de Carcinógenos y Distribución de MOE",
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          content: (
            <div className="space-y-3">
              <p>
                Para contaminantes genotóxicos y cancerígenos evaluados mediante <strong>BMDL</strong>, el riesgo no se juzga frente a una IDA sino mediante el <strong>Margen de Exposición (MOE)</strong>:
              </p>
              <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-mono text-center">
                MOE = PoD (µg/kg pc/día) / Exposición Dietaria Individual (µg/kg pc/día)
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Criterio Normativo JECFA / EFSA para Bioensayos Animales (BMDL10):</h4>
                  <p>
                    Para sustancias como Aflatoxinas o Acrilamida basadas en BMDL10 animal, un <strong>MOE ≥ 10.000</strong> se considera de <em>baja preocupación para la salud pública</em> y baja prioridad para la gestión. Un <strong>MOE &lt; 10.000</strong> denota preocupación sanitaria potencial y prioridad de mitigación. El factor de 10.000 desglosa: 10× (variabilidad entre especies) × 10× (variabilidad humana) × 100× (incertidumbre adicional por mecanismo genotóxico/carcinogénico).
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Criterio Normativo EFSA 2024 para Epidemiología Humana (BMDL05):</h4>
                  <p>
                    Para Arsénico inorgánico con base en estudios epidemiológicos directos en humanos, no aplica el factor interespecies de 10.000. Un <strong>MOE ≤ 1</strong> indica preocupación sanitaria explícita al alcanzar la dosis benchmark clínica observada.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Gráfico de Distribución de MOE y Curva Acumulada:</h4>
                  <p>
                    El panel de resultados ofrece la vista <strong>Distribución de MOE</strong> que desglosa a la población en niveles de preocupación toxicológica (Crítico MOE &lt; 1.000, Preocupación 1.000–10.000, Precaución 10.000–25.000, Seguro &gt; 25.000) y cuantifica con precisión el porcentaje de individuos simulados que se encuentran por debajo del nivel de seguridad sugerido.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "results",
          title: "4. Interpretación de Resultados y Métricas de Auditoría",
          icon: <Info className="w-5 h-5 text-orange-500" />,
          content: (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs">Percentil 95 (P95) - Alto Consumidor:</h4>
                  <p className="text-[11px]">Escenario de referencia regulatorio internacional para proteger a los estratos de consumo superior.</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Percentil 99 (P99) - Cola Extrema:</h4>
                  <p className="text-[11px]">Evalúa el comportamiento de los casos extremos de la distribución poblacional simulada.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs">Cociente de Peligro (HQ) [Modo ADI]:</h4>
                  <p className="text-[11px]">Cociente entre la exposición P95 y la IDA. Valores HQ &gt; 1 indican superación del umbral seguro.</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Margen de Seguridad (MoS):</h4>
                  <p className="text-[11px]">Inverso del riesgo (IDA / Exposición P95). Valores MoS &lt; 1 indican margen insuficiente.</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs">Curva Acumulada Adaptativa (CDF):</h4>
                <p className="text-[11px]">
                  En sustancias con IDA, grafica la probabilidad acumulada frente al % del valor de referencia con línea en el 100%. En carcinógenos con BMDL, grafica la probabilidad acumulada frente al Margen de Exposición con la línea de corte normativo (MOE = 10.000 o MOE = 1).
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-sm mb-2">Semáforo de Riesgo (HQ / IDA):</h4>
                <div className="space-y-1 text-xs">
                  <p><span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span><strong>Seguro (&lt;25% IDA):</strong> Exposición insignificante.</p>
                  <p><span className="inline-block w-3 h-3 bg-teal-400 rounded-full mr-2"></span><strong>Bajo (25–75% IDA):</strong> Margen de protección adecuado.</p>
                  <p><span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-2"></span><strong>Vigilancia (75–100% IDA):</strong> Zona de atención preventiva.</p>
                  <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span><strong>Peligro (&gt;100% IDA):</strong> Supera el umbral toxicológico admisible.</p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "analysis",
          title: "5. Análisis de Sensibilidad y Contribución Dietaria",
          icon: <Wind className="w-5 h-5 text-cyan-500" />,
          content: (
            <div className="space-y-2">
              <p>Herramientas analíticas para formular decisiones de gestión del riesgo basadas en evidencia:</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Diagrama de Tornado:</strong> Identifica qué factores (concentración o consumo de cada alimento) ejercen mayor influencia en la dispersión del riesgo total mediante análisis OAT (Swing P10-P90) y coeficientes de correlación de Spearman/Pearson.</li>
                <li><strong>Contribución por Alimento:</strong> Calcula la cuota porcentual de cada producto en la ingesta dietética total, activando alertas automáticas si un alimento individual supera por sí solo el valor de referencia.</li>
                <li><strong>Matriz de Riesgo:</strong> Mapa bidimensional interactivo que correlaciona la concentración y el consumo frente al riesgo resultante.</li>
              </ul>
            </div>
          )
        },
        {
          id: "reporting",
          title: "6. Informes Ejecutivos y Trazabilidad Bibliográfica",
          icon: <FileText className="w-5 h-5 text-emerald-500" />,
          content: (
            <div className="space-y-2">
              <p>
                La plataforma genera documentación técnica completa para auditorías y comités de expertos:
              </p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Exportación PDF del Resumen Ejecutivo:</strong> Integra parámetros de simulación, perfiles de exposición, análisis de sensibilidad, desglose de alimentos contribuyentes y dictamen metodológico conforme a guías JECFA/EFSA.</li>
                <li><strong>Bases de Caracterización del Riesgo:</strong> Detalle explícito del Punto de Partida (PoD), organismo y año de publicación, efecto crítico, referencia bibliográfica DOI y supuestos del modelo.</li>
                <li><strong>Exportación de Gráficos en Alta Resolución:</strong> Descarga individual en PNG de cualquier gráfica del panel.</li>
              </ul>
            </div>
          )
        },
        {
          id: "troubleshooting",
          title: "7. Solución de Problemas y Buenas Prácticas",
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
          content: (
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li><strong>Convergencia estadística:</strong> Se recomiendan al menos 10.000 iteraciones para estabilizar el P95. Para análisis de colas extremas (P99 o P99.9), utilice entre 50.000 y 100.000 iteraciones.</li>
              <li><strong>Consistencia de unidades:</strong> Verifique si las concentraciones están en mg/kg (ppm) o µg/kg (ppb). Para carcinógenos, el PoD se normaliza internamente en µg/kg pc/día.</li>
              <li><strong>Validación de datos:</strong> Si una sustancia no permite calcular con IDA, verifique si se trata de un carcinógeno reconocido; el sistema forzará automáticamente el modelo PoD/BMDL.</li>
            </ul>
          )
        }
      ]
    },
    en: {
      title: "User Manual: Montecarlo Food Risk",
      sections: [
        {
          id: "purpose",
          title: "1. Purpose and Objective",
          icon: <Target className="w-5 h-5 text-blue-500" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong>Montecarlo Food Risk</strong> is an advanced scientific platform for probabilistic dietary exposure analysis to chemical contaminants and toxicological risk characterization. The system integrates technical auditing standards and guidelines from the <strong>Joint FAO/WHO Expert Committee on Food Additives (JECFA)</strong>, the <strong>European Food Safety Authority (EFSA)</strong>, the <strong>Joint FAO/WHO Meeting on Pesticide Residues (JMPR)</strong>, and the <strong>US Environmental Protection Agency (EPA)</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Bifurcated toxicological modeling:</strong> Modeling of threshold chemicals (ADI, TDI) using Hazard Quotients (HQ) and non-threshold genotoxic carcinogens using Points of Departure (PoD / BMDL) and Margin of Exposure (MOE).</li>
                <li><strong>Toxicological integrity:</strong> Validation enforcement preventing invalid ADI calculations for carcinogens and blocking MOE for threshold chemicals.</li>
                <li><strong>1D and 2D probabilistic simulations:</strong> Non-parametric and parametric Monte Carlo modeling separating population variability from sampling uncertainty (Bootstrap).</li>
                <li><strong>Population safety auditing:</strong> Automated evaluations at critical percentiles (P95, P97.5, P99) and quantification of population below regulatory safety thresholds.</li>
              </ul>
            </div>
          )
        },
        {
          id: "setup",
          title: "2. Chemical Selection & Simulation Setup",
          icon: <Settings className="w-5 h-5 text-purple-500" />,
          content: (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm">Step 1: Chemical Substance & Toxicological Model</h4>
                <p>The system dynamically adapts the methodology based on toxicological classifications:</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Genotoxic Carcinogens (BMDL / MOE Model):</strong> For non-threshold contaminants (Aflatoxin B1, Inorganic Arsenic, Acrylamide, Ochratoxin A), the platform enforces the Point of Departure (PoD) model and loads official reference benchmarks:
                    <ul className="list-circle pl-5 mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <li><strong>Aflatoxin B1:</strong> BMDL10 = 0.40 µg/kg bw/d (hepatocellular carcinoma, animal bioassay EFSA 2020 / JECFA 2017).</li>
                      <li><strong>Inorganic Arsenic:</strong> BMDL05 = 0.06 µg/kg bw/d (skin cancer, human epidemiology EFSA 2024) &amp; BMDL0.5 = 3.0 µg/kg bw/d (lung cancer, JECFA 2010).</li>
                      <li><strong>Acrylamide:</strong> BMDL10 = 170 µg/kg bw/d (neoplastic effects, EFSA 2015).</li>
                      <li><strong>Ochratoxin A:</strong> BMDL10 = 14.5 µg/kg bw/d (renal tumors, EFSA 2020).</li>
                    </ul>
                  </li>
                  <li><strong>Threshold Substances (ADI Model):</strong> For pesticides (Chlorpyrifos, Deltamethrin, Malathion) or additives, the system enforces the Acceptable Daily Intake (mg/kg·d) and evaluates Hazard Quotients (HQ), omitting all BMDL references.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm">Step 2: Food Items & Distribution Setup</h4>
                <p>Configure dietary sources with empirical or parametric statistical distributions:</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Arithmetic Parameterization (Real-World Surveillance Data):</strong> Directly enter the <strong>Arithmetic Mean and Standard Deviation</strong> from analytical surveillance reports; the engine derives equivalent theoretical parameters (μ, σ, GM, GSD, shape, scale) for Lognormal, Gamma, Weibull, and Beta distributions via the Method of Moments (EFSA/JMPR/JECFA).</li>
                  <li><strong>LOD/LOQ Handling (Expert Mode):</strong> Robust treatment of censored analytical data below limits of detection/quantification (Lower Bound ND=0, Medium Bound LOD/2, Upper Bound LOD).</li>
                  <li><strong>Processing &amp; Reduction Factors:</strong> Model chemical losses or concentration factors during washing, peeling, cooking, or dehydration.</li>
                  <li><strong>Save / Load JSON Profiles:</strong> Export and reload food item datasets for reproducible audits.</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: "moe",
          title: "3. Carcinogen Characterization & MOE Distribution",
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          content: (
            <div className="space-y-3">
              <p>
                For genotoxic carcinogens evaluated via <strong>BMDL</strong>, safety is not based on an ADI but on the <strong>Margin of Exposure (MOE)</strong>:
              </p>
              <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-mono text-center">
                MOE = PoD (µg/kg bw/day) / Individual Dietary Exposure (µg/kg bw/day)
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">JECFA / EFSA Criteria for Animal Bioassays (BMDL10):</h4>
                  <p>
                    For substances such as Aflatoxins or Acrylamide based on animal BMDL10, an <strong>MOE ≥ 10,000</strong> is considered of <em>low public health concern</em> and low priority for risk management. An <strong>MOE &lt; 10,000</strong> indicates potential health concern requiring intervention. The 10,000 factor integrates: 10× (interspecies) × 10× (intraspecies) × 100× (additional non-threshold genotoxicity uncertainty).
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">EFSA 2024 Criteria for Human Epidemiology (BMDL05):</h4>
                  <p>
                    For Inorganic Arsenic based on clinical human epidemiology, the 10,000 interspecies factor is not applied. An <strong>MOE ≤ 1</strong> indicates explicit health concern as exposures reach the observed benchmark dose.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">MOE Distribution View &amp; Cumulative Curve:</h4>
                  <p>
                    The dedicated <strong>MOE Distribution</strong> view stratifies the population into toxicological concern tiers (Critical MOE &lt; 1,000, Concern 1,000–10,000, Precaution 10,000–25,000, Safe &gt; 25,000) and quantifies the exact percentage of simulated individuals below benchmark safety levels.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "results",
          title: "4. Results Interpretation & Audit Metrics",
          icon: <Info className="w-5 h-5 text-orange-500" />,
          content: (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs">95th Percentile (P95) - High Consumer:</h4>
                  <p className="text-[11px]">Primary regulatory metric for protecting high-intake population subgroups.</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs">99th Percentile (P99) - Extreme Tail:</h4>
                  <p className="text-[11px]">Characterizes upper tail exposure behavior across the simulated cohort.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs">Hazard Quotient (HQ) [ADI Mode]:</h4>
                  <p className="text-[11px]">Ratio of P95 exposure to ADI. Values &gt; 1 indicate threshold exceedance.</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Margin of Safety (MoS):</h4>
                  <p className="text-[11px]">Inverse of risk (ADI / P95 Exposure). Values &lt; 1 indicate an insufficient margin.</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs">Adaptive Cumulative Curve (CDF):</h4>
                <p className="text-[11px]">
                  For ADI chemicals, displays cumulative probability vs % ADI with a threshold line at 100%. For BMDL carcinogens, displays cumulative probability vs Margin of Exposure with benchmark lines (MOE = 10,000 or 1).
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-sm mb-2">Risk Traffic Light (HQ / ADI):</h4>
                <div className="space-y-1 text-xs">
                  <p><span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span><strong>Safe (&lt;25% ADI):</strong> Negligible exposure.</p>
                  <p><span className="inline-block w-3 h-3 bg-teal-400 rounded-full mr-2"></span><strong>Low (25–75% ADI):</strong> Adequate protection margin.</p>
                  <p><span className="inline-block w-3 h-3 bg-amber-400 rounded-full mr-2"></span><strong>Surveillance (75–100% ADI):</strong> Precautionary surveillance zone.</p>
                  <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span><strong>Danger (&gt;100% ADI):</strong> Exceeds toxicological safety threshold.</p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "analysis",
          title: "5. Sensitivity Analysis & Dietary Contributions",
          icon: <Wind className="w-5 h-5 text-cyan-500" />,
          content: (
            <div className="space-y-2">
              <p>Advanced diagnostic tools for evidence-based risk management:</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Tornado Diagram:</strong> Identifies which variables (concentration or consumption per food item) exert the greatest impact on risk dispersion via OAT Swing (P10–P90) and Spearman/Pearson rank correlation.</li>
                <li><strong>Food Contribution Breakdown:</strong> Computes the percentage share of each food in total dietary intake, triggering alerts if an individual item exceeds reference thresholds.</li>
                <li><strong>Risk Matrix:</strong> Interactive 2D heatmap linking food concentration and consumption to total resulting risk.</li>
              </ul>
            </div>
          )
        },
        {
          id: "reporting",
          title: "6. Executive Reports & Traceability",
          icon: <FileText className="w-5 h-5 text-emerald-500" />,
          content: (
            <div className="space-y-2">
              <p>Comprehensive documentation for regulatory submissions and expert panels:</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Executive PDF Export:</strong> Compiles simulation parameters, exposure distributions, sensitivity findings, food contributor tables, and JECFA/EFSA methodological opinions.</li>
                <li><strong>Risk Characterization Foundations:</strong> Complete traceability including Point of Departure (PoD), publishing body, year, critical effect, DOI, and model assumptions.</li>
                <li><strong>High-Resolution PNG Exports:</strong> One-click export for any chart in the dashboard.</li>
              </ul>
            </div>
          )
        },
        {
          id: "troubleshooting",
          title: "7. Troubleshooting & Best Practices",
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
          content: (
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li><strong>Statistical Convergence:</strong> At least 10,000 iterations are recommended for stable P95 estimates. For extreme tail percentiles (P99 or P99.9), use 50,000 to 100,000 iterations.</li>
              <li><strong>Unit Consistency:</strong> Verify concentration units (mg/kg vs µg/kg). Carcinogen PoDs are normalized in µg/kg bw/day.</li>
              <li><strong>Validation Rules:</strong> If a chemical does not allow ADI input, verify if it is a designated non-threshold carcinogen; the system automatically enforces the PoD/BMDL model.</li>
            </ul>
          )
        }
      ]
    },
    fr: {
      title: "Manuel d'Utilisation : Montecarlo Food Risk",
      sections: [
        {
          id: "purpose",
          title: "1. But et Objectif",
          icon: <Target className="w-5 h-5 text-blue-500" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong>Montecarlo Food Risk</strong> est une plateforme scientifique avancée pour l'analyse probabiliste de l'exposition alimentaire aux contaminants chimiques et la caractérisation toxicologique des risques. Elle intègre rigoureusement les normes d'audit technique et les lignes directrices du <strong>Comité mixte FAO/OMS d'experts des additifs alimentaires (JECFA)</strong>, de l'<strong>Autorité européenne de sécurité des aliments (EFSA)</strong>, de la <strong>Réunion conjointe FAO/OMS sur les résidus de pesticides (JMPR)</strong> et de l'<strong>Agence de protection de l'environnement des États-Unis (EPA)</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Modélisation toxicologique différenciée :</strong> Substances à seuil (DJA/ADI, TDI) évaluées par Quotient de Danger (HQ) et cancérogènes génotoxiques sans seuil évalués par Points de Départ (PoD / BMDL) et Marge d'Exposition (MOE).</li>
                <li><strong>Rigueur toxicologique automatisée :</strong> Validation empêchant le calcul d'une DJA pour les cancérogènes et bloquant la MOE pour les substances à seuil biologique.</li>
                <li><strong>Simulations probabilistes 1D et 2D :</strong> Modélisation Monte Carlo distinguant la variabilité interindividuelle de la population de l'incertitude d'échantillonnage (Bootstrap).</li>
                <li><strong>Audit aux percentiles critiques :</strong> Analyse automatique au P95, P97.5, P99 et quantification de la population sous les seuils réglementaires de sécurité.</li>
              </ul>
            </div>
          )
        },
        {
          id: "setup",
          title: "2. Configuration et Sélection des Substances",
          icon: <Settings className="w-5 h-5 text-purple-500" />,
          content: (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm">Étape 1 : Substance Chimique et Modèle Toxicologique</h4>
                <p>Le système adapte automatiquement la méthode selon la toxicologie de la substance :</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Contaminants Cancérogènes (Modèle BMDL / MOE) :</strong> Pour les substances sans seuil (Aflatoxine B1, Arsenic inorganique, Acrylamide, Ochratoxine A), le système impose le modèle Point de Départ (PoD) et charge les références officielles de l'EFSA et du JECFA (ex. Aflatoxine B1 BMDL10 = 0,40 µg/kg pc/j, Arsenic inorganique BMDL05 = 0,06 µg/kg pc/j).</li>
                  <li><strong>Substances à Seuil (Modèle DJA / ADI) :</strong> Pour les pesticides ou additifs, le système applique la Dose Journalière Admissible et évalue le Quotient de Danger (HQ), sans mention de BMDL.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm">Étape 2 : Gestion des Aliments et Distributions</h4>
                <p>Configurez les concentrations et consommations :</p>
                <ul className="list-disc pl-5 text-xs mt-1 space-y-1">
                  <li><strong>Paramétrage Arithmétique (Données Réelles) :</strong> Saisissez directement la <strong>Moyenne et l'Écart-Type Arithmétiques</strong> ; le moteur dérive automatiquement les paramètres théoriques (μ, σ, GM, GSD, forme, échelle) via la méthode des moments (EFSA/JMPR/JECFA).</li>
                  <li><strong>Gestion des Données Censurées (LOD/LOQ) :</strong> Approches Lower Bound (ND=0), Medium Bound (LOD/2) et Upper Bound (LOD).</li>
                  <li><strong>Facteurs de Transformation et Réduction :</strong> Modélisation des pertes ou concentrations liées au lavage, épluchage ou cuisson.</li>
                  <li><strong>Exportation / Chargement JSON :</strong> Sauvegarde des profils alimentaires pour audits reproductibles.</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: "moe",
          title: "3. Caractérisation des Cancérogènes et Distribution de MOE",
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          content: (
            <div className="space-y-3">
              <p>
                Pour les cancérogènes génotoxiques évalués par <strong>BMDL</strong>, la sécurité repose sur la <strong>Marge d'Exposition (MOE)</strong> :
              </p>
              <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-mono text-center">
                MOE = PoD (µg/kg pc/jour) / Exposition Alimentaire Individuelle (µg/kg pc/jour)
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Critère JECFA / EFSA pour Bioessais Animaux (BMDL10) :</h4>
                  <p>
                    Une <strong>MOE ≥ 10 000</strong> indique une <em>faible préoccupation pour la santé publique</em>. Une <strong>MOE &lt; 10 000</strong> indique une préoccupation sanitaire nécessitant des mesures de gestion.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Critère EFSA 2024 pour Épidémiologie Humaine (BMDL05) :</h4>
                  <p>
                    Pour l'Arsenic inorganique fondé sur des données humaines, une <strong>MOE ≤ 1</strong> indique une préoccupation sanitaire directe.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Vue Distribution de MOE :</h4>
                  <p>
                    Visualise la répartition de la population par niveaux de préoccupation (Critique, Préoccupation, Précaution, Sûr) et quantifie le pourcentage d'individus sous le seuil de sécurité.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: "results",
          title: "4. Interprétation des Résultats et Métriques d'Audit",
          icon: <Info className="w-5 h-5 text-orange-500" />,
          content: (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs">95e Percentile (P95) - Gros Consommateur :</h4>
                  <p className="text-[11px]">Scénario réglementaire pour protéger les consommateurs les plus exposés.</p>
                </div>
                <div>
                  <h4 className="font-bold text-xs">Quotient de Danger (HQ) [Mode DJA] :</h4>
                  <p className="text-[11px]">Rapport entre l'exposition P95 et la DJA. Valeurs &gt; 1 indiquent un dépassement.</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs">Courbe Cumulative Adaptative (CDF) :</h4>
                <p className="text-[11px]">
                  Affiche la probabilité cumulative par rapport au % DJA (avec ligne à 100 %) ou par rapport à la MOE (avec ligne de seuil à 10 000 ou 1) selon la substance.
                </p>
              </div>
            </div>
          )
        },
        {
          id: "analysis",
          title: "5. Analyse de Sensibilité et Contributions",
          icon: <Wind className="w-5 h-5 text-cyan-500" />,
          content: (
            <div className="space-y-2">
              <p>Outils d'aide à la décision :</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Diagramme Tornade :</strong> Identifie les paramètres moteurs du risque via l'analyse OAT (P10–P90) et les corrélations de rang Spearman/Pearson.</li>
                <li><strong>Contribution par Aliment :</strong> Part en pourcentage de chaque aliment dans l'exposition totale avec alertes de sécurité.</li>
              </ul>
            </div>
          )
        },
        {
          id: "reporting",
          title: "6. Rapports Exécutifs et Traçabilité",
          icon: <FileText className="w-5 h-5 text-emerald-500" />,
          content: (
            <div className="space-y-2">
              <p>Documentation technique pour comités d'experts :</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Rapport PDF Exécutif :</strong> Synthèse complète des paramètres, graphiques d'exposition et avis méthodologiques conformes aux guides JECFA/EFSA.</li>
                <li><strong>Traçabilité Toxicologique :</strong> Indication détaillée du PoD, de l'organisme, de l'effet critique et de la référence DOI.</li>
              </ul>
            </div>
          )
        },
        {
          id: "troubleshooting",
          title: "7. Dépannage et Bonnes Pratiques",
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
          content: (
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li><strong>Convergence :</strong> Au moins 10 000 itérations recommandées pour stabiliser le P95. Pour les queues extrêmes (P99), prévoyez 50 000 à 100 000 itérations.</li>
              <li><strong>Unités :</strong> Vérifiez si les concentrations sont en mg/kg ou µg/kg.</li>
            </ul>
          )
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">{currentContent.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {currentContent.sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
                {section.icon}
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{section.title}</h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {section.content}
              </div>
            </section>
          ))}
          
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-center gap-2 text-xs text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Montecarlo FoodRisk v2.5 - JECFA / EFSA / JMPR / EPA Audit Standards (2026)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;

