import React, { useMemo } from 'react';
import { DistributionType, DistributionParams, Language } from '../types';
import { PARAM_TOOLTIPS } from '../constants';
import { 
  validateDistribution, 
  arithmeticToLognormal, 
  lognormalToArithmetic,
  arithmeticToGamma,
  gammaToArithmetic,
  arithmeticToWeibull,
  weibullToArithmetic,
  arithmeticToBeta,
  betaToArithmetic
} from '../services/mathUtils';
import { TRANSLATIONS } from '../locales';

interface Props {
  label?: string;
  type: DistributionType;
  params: DistributionParams;
  onChange?: (newParams: DistributionParams) => void;
  onParamsChange?: (newParams: DistributionParams) => void;
  onTypeChange?: (newType: DistributionType) => void;
  unit?: string;
  onUnitChange?: (newUnit: string) => void;
  units?: string[];
  isExpert: boolean;
  language: Language;
}

// Distributions supporting arithmetic (mean, stdDev) parameterization
const ARITHMETIC_SUPPORTED_TYPES: DistributionType[] = ['lognormal', 'gamma', 'weibull', 'beta'];

const DistributionInput: React.FC<Props> = ({ 
  label, 
  type, 
  params, 
  onChange, 
  onParamsChange,
  onTypeChange, 
  unit, 
  onUnitChange, 
  units,
  isExpert, 
  language 
}) => {
  const t = TRANSLATIONS[language];
  const supportsArithmetic = ARITHMETIC_SUPPORTED_TYPES.includes(type);

  // Active parameterization mode: defaults to 'arithmetic' for lognormal/gamma/weibull if mean & stdDev are present or specified
  const isArithmeticMode = supportsArithmetic && (
    params.paramMode === 'arithmetic' || 
    (params.paramMode !== 'direct' && (params.mean !== undefined && params.stdDev !== undefined))
  );

  const emitChange = (newParams: DistributionParams) => {
    if (onParamsChange) onParamsChange(newParams);
    else if (onChange) onChange(newParams);
  };

  const handleParamChange = (key: keyof DistributionParams, value: string) => {
    const numVal = value === '' ? undefined : parseFloat(value);
    const updated: DistributionParams = { ...params, [key]: numVal };

    // Auto-harmonize derived parameters when user inputs arithmetic data
    if (isArithmeticMode) {
      const m = key === 'mean' ? numVal : params.mean;
      const s = key === 'stdDev' ? numVal : params.stdDev;
      
      if (m !== undefined && s !== undefined && m > 0 && s > 0) {
        if (type === 'lognormal') {
          const conv = arithmeticToLognormal(m, s);
          updated.mu = conv.mu;
          updated.sigma = conv.sigma;
        } else if (type === 'gamma') {
          const conv = arithmeticToGamma(m, s);
          updated.shape = conv.shape;
          updated.rate = conv.rate;
          updated.scale = conv.scale;
        } else if (type === 'weibull') {
          const conv = arithmeticToWeibull(m, s);
          if (conv) {
            updated.shape = conv.shape;
            updated.scale = conv.scale;
          }
        } else if (type === 'beta') {
          const min = updated.min ?? 0;
          const max = updated.max ?? 1;
          const conv = arithmeticToBeta(m, s, min, max);
          if (conv) {
            updated.alpha = conv.alpha;
            updated.beta = conv.beta;
          }
        }
      }
    } else {
      // Auto-harmonize arithmetic stats when user inputs direct theoretical parameters
      if (type === 'lognormal' && updated.mu !== undefined && updated.sigma !== undefined && updated.sigma > 0) {
        const conv = lognormalToArithmetic(updated.mu, updated.sigma);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'gamma' && updated.shape !== undefined && updated.rate !== undefined && updated.shape > 0 && updated.rate > 0) {
        const conv = gammaToArithmetic(updated.shape, updated.rate);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'weibull' && updated.shape !== undefined && updated.scale !== undefined && updated.shape > 0 && updated.scale > 0) {
        const conv = weibullToArithmetic(updated.shape, updated.scale);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'beta' && updated.alpha !== undefined && updated.beta !== undefined && updated.alpha > 0 && updated.beta > 0) {
        const min = updated.min ?? 0;
        const max = updated.max ?? 1;
        const conv = betaToArithmetic(updated.alpha, updated.beta, min, max);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      }
    }

    emitChange(updated);
  };

  const toggleParamMode = (targetMode: 'arithmetic' | 'direct') => {
    const updated: DistributionParams = { ...params, paramMode: targetMode };

    if (targetMode === 'arithmetic') {
      // If switching to arithmetic mode, populate mean & stdDev from theoretical if missing
      if (type === 'lognormal' && params.mu !== undefined && params.sigma !== undefined) {
        const conv = lognormalToArithmetic(params.mu, params.sigma);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'gamma' && params.shape !== undefined && params.rate !== undefined) {
        const conv = gammaToArithmetic(params.shape, params.rate);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'weibull' && params.shape !== undefined && params.scale !== undefined) {
        const conv = weibullToArithmetic(params.shape, params.scale);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      } else if (type === 'beta' && params.alpha !== undefined && params.beta !== undefined) {
        const min = params.min ?? 0;
        const max = params.max ?? 1;
        const conv = betaToArithmetic(params.alpha, params.beta, min, max);
        updated.mean = conv.mean;
        updated.stdDev = conv.stdDev;
      }
    } else {
      // If switching to direct mode, populate theoretical parameters from arithmetic if missing
      if (params.mean !== undefined && params.stdDev !== undefined && params.mean > 0 && params.stdDev > 0) {
        if (type === 'lognormal') {
          const conv = arithmeticToLognormal(params.mean, params.stdDev);
          updated.mu = conv.mu;
          updated.sigma = conv.sigma;
        } else if (type === 'gamma') {
          const conv = arithmeticToGamma(params.mean, params.stdDev);
          updated.shape = conv.shape;
          updated.rate = conv.rate;
        } else if (type === 'weibull') {
          const conv = arithmeticToWeibull(params.mean, params.stdDev);
          if (conv) {
            updated.shape = conv.shape;
            updated.scale = conv.scale;
          }
        } else if (type === 'beta') {
          const min = params.min ?? 0;
          const max = params.max ?? 1;
          const conv = arithmeticToBeta(params.mean, params.stdDev, min, max);
          if (conv) {
            updated.alpha = conv.alpha;
            updated.beta = conv.beta;
          }
        }
      }
    }

    emitChange(updated);
  };

  const error = validateDistribution(type, params);

  // Compute live conversions for preview cards
  const derivedStats = useMemo(() => {
    if (!supportsArithmetic) return null;

    if (isArithmeticMode) {
      const m = params.mean;
      const s = params.stdDev;
      if (m === undefined || s === undefined || m <= 0 || s <= 0) return null;

      if (type === 'lognormal') {
        const conv = arithmeticToLognormal(m, s);
        return {
          type: 'lognormal',
          items: [
            { label: 'μ (media log)', value: conv.mu.toFixed(4) },
            { label: 'σ (desv log)', value: conv.sigma.toFixed(4) },
            { label: 'Mediana / GM', value: conv.gm.toFixed(4) },
            { label: 'GSD (desv geom.)', value: conv.gsd.toFixed(3) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
          ],
          formula: 'σ = √ln(1 + (s/m)²),  μ = ln(m) - σ²/2'
        };
      }
      if (type === 'gamma') {
        const conv = arithmeticToGamma(m, s);
        return {
          type: 'gamma',
          items: [
            { label: 'Forma (k)', value: conv.shape.toFixed(3) },
            { label: 'Tasa (β)', value: conv.rate.toFixed(4) },
            { label: 'Escala (θ)', value: conv.scale.toFixed(4) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
          ],
          formula: 'k = (m/s)²,  β = m/s²,  θ = s²/m'
        };
      }
      if (type === 'weibull') {
        const conv = arithmeticToWeibull(m, s);
        if (!conv) return null;
        return {
          type: 'weibull',
          items: [
            { label: 'Forma (k)', value: conv.shape.toFixed(3) },
            { label: 'Escala (λ)', value: conv.scale.toFixed(4) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
          ],
          formula: 'Ajuste numérico de momentos: CV² + 1 = Γ(1+2/k) / Γ(1+1/k)²'
        };
      }
      if (type === 'beta') {
        const min = params.min ?? 0;
        const max = params.max ?? 1;
        const conv = arithmeticToBeta(m, s, min, max);
        if (!conv) return null;
        return {
          type: 'beta',
          items: [
            { label: 'Alpha (α)', value: conv.alpha.toFixed(3) },
            { label: 'Beta (β)', value: conv.beta.toFixed(3) },
            { label: 'Desv. máx.', value: conv.maxAllowedStdDev.toFixed(3) },
          ],
          formula: 'Método de momentos acotado en [Mín, Máx]'
        };
      }
    } else {
      // Theoretical mode: display equivalent arithmetic statistics
      if (type === 'lognormal' && params.mu !== undefined && params.sigma !== undefined && params.sigma > 0) {
        const conv = lognormalToArithmetic(params.mu, params.sigma);
        return {
          type: 'lognormal_direct',
          items: [
            { label: 'Media aritm. (m)', value: conv.mean.toFixed(4) },
            { label: 'Desv. aritm. (s)', value: conv.stdDev.toFixed(4) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
            { label: 'Mediana / GM', value: conv.gm.toFixed(4) },
          ],
          formula: 'm = exp(μ + σ²/2),  s = m * √(exp(σ²) - 1)'
        };
      }
      if (type === 'gamma' && params.shape !== undefined && params.rate !== undefined && params.shape > 0 && params.rate > 0) {
        const conv = gammaToArithmetic(params.shape, params.rate);
        return {
          type: 'gamma_direct',
          items: [
            { label: 'Media aritm. (m)', value: conv.mean.toFixed(4) },
            { label: 'Desv. aritm. (s)', value: conv.stdDev.toFixed(4) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
          ],
          formula: 'm = k/β,  s = √k/β'
        };
      }
      if (type === 'weibull' && params.shape !== undefined && params.scale !== undefined && params.shape > 0 && params.scale > 0) {
        const conv = weibullToArithmetic(params.shape, params.scale);
        return {
          type: 'weibull_direct',
          items: [
            { label: 'Media aritm. (m)', value: conv.mean.toFixed(4) },
            { label: 'Desv. aritm. (s)', value: conv.stdDev.toFixed(4) },
            { label: 'CV', value: `${conv.cv.toFixed(1)}%` },
          ],
          formula: 'm = λ * Γ(1 + 1/k)'
        };
      }
      if (type === 'beta' && params.alpha !== undefined && params.beta !== undefined && params.alpha > 0 && params.beta > 0) {
        const min = params.min ?? 0;
        const max = params.max ?? 1;
        const conv = betaToArithmetic(params.alpha, params.beta, min, max);
        return {
          type: 'beta_direct',
          items: [
            { label: 'Media aritm. (m)', value: conv.mean.toFixed(4) },
            { label: 'Desv. aritm. (s)', value: conv.stdDev.toFixed(4) },
          ],
          formula: 'm = min + (α / (α + β)) * (max - min)'
        };
      }
    }
    return null;
  }, [type, params, isArithmeticMode, supportsArithmetic]);

  const distOptions = Object.keys(t.distTypes).map(key => {
    const isAdvanced = ['weibull', 'erlang', 'gamma', 'beta', 'gumbel', 'frechet', 'inverse_weibull'].includes(key);
    if (isAdvanced && !isExpert) return null;
    return (
      <option key={key} value={key}>
        {t.distTypes[key as keyof typeof t.distTypes]}
      </option>
    );
  });

  const renderInput = (
    labelKey: keyof typeof t.params, 
    field: keyof DistributionParams, 
    customLabel?: string,
    min?: number
  ) => (
    <div className="flex-1 min-w-[80px]">
      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center group relative cursor-help w-fit">
        {customLabel || t.params[labelKey]}
        <span className="ml-1 flex items-center justify-center w-3 h-3 rounded-full border border-gray-300 dark:border-slate-600 text-[8px] font-bold text-gray-400 group-hover:bg-marine-500 group-hover:text-white transition-colors">
          i
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-slate-800 rounded shadow-lg border border-gray-200 dark:border-slate-700 text-[10px] normal-case font-normal text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {PARAM_TOOLTIPS[field.toLowerCase() as string] || 'Información del parámetro'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-slate-800"></div>
        </div>
      </label>
      <input
        type="number"
        step="any"
        min={min}
        value={params[field] ?? ''}
        onChange={(e) => handleParamChange(field, e.target.value)}
        placeholder={customLabel || t.params[labelKey]}
        className={`w-full px-2.5 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-mono ${
          error 
            ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
            : 'border-gray-200 dark:border-slate-700 focus:ring-marine-500'
        }`}
      />
    </div>
  );

  let fields: React.ReactNode = null;

  switch (type) {
    case 'deterministic':
      fields = renderInput('value', 'value');
      break;
    case 'uniform':
      fields = <>{renderInput('min', 'min')} {renderInput('max', 'max')}</>;
      break;
    case 'triangular':
      fields = <>{renderInput('min', 'min')} {renderInput('mode', 'mode')} {renderInput('max', 'max')}</>;
      break;
    case 'pert':
      fields = (
        <>
          {renderInput('min', 'min')} {renderInput('mode', 'mode')} {renderInput('max', 'max')}
          {isExpert && renderInput('gamma', 'gamma', undefined, 0)}
        </>
      );
      break;
    case 'normal':
      fields = <>{renderInput('mean', 'mean', t.params.arithmeticMean || 'Media (m)')} {renderInput('stdDev', 'stdDev', t.params.arithmeticStdDev || 'Desv. Est. (s)', 0)}</>;
      break;
    case 'lognormal':
      if (isArithmeticMode) {
        fields = (
          <>
            {renderInput('mean', 'mean', t.params.arithmeticMean || 'Media Aritmética (m)', 0)}
            {renderInput('stdDev', 'stdDev', t.params.arithmeticStdDev || 'Desv. Aritmética (s)', 0)}
          </>
        );
      } else {
        fields = <>{renderInput('mu', 'mu')} {renderInput('sigma', 'sigma', undefined, 0)}</>;
      }
      break;
    case 'weibull':
    case 'inverse_weibull':
      if (isArithmeticMode && type === 'weibull') {
        fields = (
          <>
            {renderInput('mean', 'mean', t.params.arithmeticMean || 'Media Aritmética (m)', 0)}
            {renderInput('stdDev', 'stdDev', t.params.arithmeticStdDev || 'Desv. Aritmética (s)', 0)}
          </>
        );
      } else {
        fields = <>{renderInput('shape', 'shape', undefined, 0)} {renderInput('scale', 'scale', undefined, 0)}</>;
      }
      break;
    case 'exponential':
      fields = renderInput('rate', 'rate', undefined, 0);
      break;
    case 'erlang':
    case 'gamma':
      if (isArithmeticMode) {
        fields = (
          <>
            {renderInput('mean', 'mean', t.params.arithmeticMean || 'Media Aritmética (m)', 0)}
            {renderInput('stdDev', 'stdDev', t.params.arithmeticStdDev || 'Desv. Aritmética (s)', 0)}
          </>
        );
      } else {
        fields = <>{renderInput('shape', 'shape', undefined, 0)} {renderInput('rate', 'rate', undefined, 0)}</>;
      }
      break;
    case 'beta':
      if (isArithmeticMode) {
        fields = (
          <>
            {renderInput('min', 'min')}
            {renderInput('max', 'max')}
            {renderInput('mean', 'mean', t.params.arithmeticMean || 'Media (m)')}
            {renderInput('stdDev', 'stdDev', t.params.arithmeticStdDev || 'Desv. (s)', 0)}
          </>
        );
      } else {
        fields = (
          <>
            {renderInput('min', 'min')}
            {renderInput('max', 'max')}
            {renderInput('alpha', 'alpha', undefined, 0)}
            {renderInput('beta', 'beta', undefined, 0)}
          </>
        );
      }
      break;
    case 'gumbel':
      fields = <>{renderInput('location', 'location')} {renderInput('scale', 'scale', undefined, 0)}</>;
      break;
    case 'frechet':
      fields = <>{renderInput('shape', 'shape', undefined, 0)} {renderInput('scale', 'scale', undefined, 0)} {renderInput('location', 'location')}</>;
      break;
    default:
      fields = <div className="text-xs text-red-500">?</div>;
  }

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase text-gray-400">{label}</label>
          {units && onUnitChange && (
            <select
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="text-[10px] bg-transparent border-none focus:ring-0 text-marine-600 dark:text-marine-400 font-bold cursor-pointer"
            >
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Mode Switcher for Lognormal, Gamma, Weibull, Beta */}
      {supportsArithmetic && (
        <div className="flex items-center justify-between bg-gray-100/70 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => toggleParamMode('arithmetic')}
            className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isArithmeticMode 
                ? 'bg-white dark:bg-slate-700 text-marine-700 dark:text-marine-200 shadow-xs border border-black/5' 
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{t.params.paramModeArithmetic || 'Media y Desv. Aritmética'}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleParamMode('direct')}
            className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isArithmeticMode 
                ? 'bg-white dark:bg-slate-700 text-marine-700 dark:text-marine-200 shadow-xs border border-black/5' 
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>{t.params.paramModeDirect || 'Parámetros Teóricos'}</span>
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {onTypeChange && (
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">{t.unitLabel}</label>
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as DistributionType)}
              className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-marine-500 transition-all font-medium"
            >
              {distOptions}
            </select>
          </div>
        )}
        <div className={`flex flex-1 flex-wrap gap-2 ${onTypeChange ? 'min-w-[200px]' : ''}`}>
          {fields}
        </div>
      </div>

      {/* Live Derived Theoretical / Arithmetic Statistics Badge */}
      {derivedStats && (
        <div className="p-2.5 rounded-xl bg-marine-50/60 dark:bg-slate-800/60 border border-marine-100/70 dark:border-slate-700/70 text-[11px] space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-marine-700 dark:text-marine-300 font-bold text-[10px] uppercase tracking-wider">
            <span>
              {isArithmeticMode 
                ? (t.params.derivedTheoreticalTitle || '📐 Parámetros Teóricos Calculados:')
                : (t.params.derivedArithmeticTitle || '📊 Estadísticos Aritméticos Equivalentes:')}
            </span>
            <span className="text-[9px] font-normal opacity-70 italic font-mono hidden sm:inline">
              {derivedStats.formula}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-700 dark:text-gray-300">
            {derivedStats.items.map((it, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-marine-100/50 dark:border-slate-700 shadow-2xs font-mono">
                <span className="text-[10px] font-medium text-gray-400">{it.label}:</span>
                <strong className="text-marine-900 dark:text-marine-100 font-black">{it.value}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[10px] text-red-500 font-medium animate-pulse">
          {t.validation[error as keyof typeof t.validation] || error}
        </p>
      )}
    </div>
  );
};

export default DistributionInput;