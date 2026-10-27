
import { DistributionParams, DistributionType } from '../types';

// Helper for standard normal distribution (Box-Muller)
function randomStandardNormal(): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// Helper for random Gamma
function randomGamma(shape: number, rate: number): number {
  if (shape < 1) {
    return randomGamma(1 + shape, rate) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let x, v, u;
  while (true) {
    do {
      x = randomStandardNormal();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return (d * v) / rate;
    }
  }
}

// Helper for random Beta
function randomBeta(alpha: number, beta: number): number {
  const a = randomGamma(alpha, 1);
  const b = randomGamma(beta, 1);
  return a / (a + b);
}

/**
 * Lanczos approximation for the Gamma function Γ(z) (g=7, n=9)
 * Accurate to ~15 decimal digits for all real positive z.
 */
export function gammaFunction(z: number): number {
  if (z <= 0 && Number.isInteger(z)) return Infinity;
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
  }
  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * LOGNORMAL: Converts arithmetic mean (m) and arithmetic standard deviation (s)
 * into log-scale parameters:
 *   σ² = ln(1 + (s/m)²) = ln(1 + CV²)
 *   μ = ln(m) - σ²/2
 * Also returns geometric mean (GM = exp(μ)) and geometric standard deviation (GSD = exp(σ)).
 */
export function arithmeticToLognormal(mean: number, stdDev: number): { 
  mu: number; 
  sigma: number; 
  gm: number; 
  gsd: number; 
  cv: number;
} {
  if (mean <= 0 || stdDev <= 0) {
    return { mu: 0, sigma: 0, gm: 0, gsd: 1, cv: 0 };
  }
  const cv = stdDev / mean;
  const sigmaSquared = Math.log(1 + cv * cv);
  const sigma = Math.sqrt(sigmaSquared);
  const mu = Math.log(mean) - 0.5 * sigmaSquared;
  const gm = Math.exp(mu);
  const gsd = Math.exp(sigma);
  return { mu, sigma, gm, gsd, cv: cv * 100 };
}

/**
 * LOGNORMAL: Converts log-scale parameters (μ, σ) back to arithmetic mean, stdDev, and CV.
 */
export function lognormalToArithmetic(mu: number, sigma: number): { 
  mean: number; 
  stdDev: number; 
  cv: number; 
  gm: number; 
  gsd: number;
} {
  const sigmaSquared = sigma * sigma;
  const mean = Math.exp(mu + 0.5 * sigmaSquared);
  const variance = Math.exp(2 * mu + sigmaSquared) * (Math.exp(sigmaSquared) - 1);
  const stdDev = Math.sqrt(Math.max(0, variance));
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
  const gm = Math.exp(mu);
  const gsd = Math.exp(sigma);
  return { mean, stdDev, cv, gm, gsd };
}

/**
 * GAMMA: Converts arithmetic mean (m) and arithmetic standard deviation (s)
 * into shape (k) and rate (β) or scale (θ = 1/β):
 *   rate = m / s²
 *   shape = m² / s² = 1 / CV²
 *   scale = s² / m
 */
export function arithmeticToGamma(mean: number, stdDev: number): { 
  shape: number; 
  rate: number; 
  scale: number; 
  cv: number;
} {
  if (mean <= 0 || stdDev <= 0) {
    return { shape: 1, rate: 1, scale: 1, cv: 0 };
  }
  const variance = stdDev * stdDev;
  const rate = mean / variance;
  const shape = (mean * mean) / variance;
  const scale = 1 / rate;
  const cv = (stdDev / mean) * 100;
  return { shape, rate, scale, cv };
}

/**
 * GAMMA: Converts shape and rate back to arithmetic mean, stdDev, and CV.
 */
export function gammaToArithmetic(shape: number, rate: number): { 
  mean: number; 
  stdDev: number; 
  scale: number;
  cv: number;
} {
  if (shape <= 0 || rate <= 0) return { mean: 0, stdDev: 0, scale: 0, cv: 0 };
  const mean = shape / rate;
  const stdDev = Math.sqrt(shape) / rate;
  const cv = (stdDev / mean) * 100;
  return { mean, stdDev, scale: 1 / rate, cv };
}

/**
 * BETA: Converts arithmetic mean (m) and arithmetic standard deviation (s)
 * within bounds [min, max] into α and β via Method of Moments:
 *   m_norm = (m - min) / (max - min)
 *   v_norm = s² / (max - min)²
 *   Condition: v_norm < m_norm * (1 - m_norm)
 */
export function arithmeticToBeta(
  mean: number, 
  stdDev: number, 
  min = 0, 
  max = 1
): { 
  alpha: number; 
  beta: number; 
  normalizedMean: number; 
  maxAllowedStdDev: number;
} | null {
  if (min >= max || mean <= min || mean >= max || stdDev <= 0) return null;
  const range = max - min;
  const m = (mean - min) / range;
  const v = (stdDev * stdDev) / (range * range);
  const maxAllowedVar = m * (1 - m);
  if (v >= maxAllowedVar) return null;
  const factor = (maxAllowedVar / v) - 1;
  const alpha = m * factor;
  const betaVal = (1 - m) * factor;
  return { 
    alpha, 
    beta: betaVal, 
    normalizedMean: m, 
    maxAllowedStdDev: Math.sqrt(maxAllowedVar) * range 
  };
}

/**
 * BETA: Converts alpha, beta, and bounds back to arithmetic mean and stdDev.
 */
export function betaToArithmetic(alpha: number, beta: number, min = 0, max = 1): { 
  mean: number; 
  stdDev: number;
} {
  if (alpha <= 0 || beta <= 0 || min >= max) return { mean: 0, stdDev: 0 };
  const sum = alpha + beta;
  const m = alpha / sum;
  const v = (alpha * beta) / (sum * sum * (sum + 1));
  const range = max - min;
  return {
    mean: min + m * range,
    stdDev: Math.sqrt(v) * range
  };
}

/**
 * WEIBULL: Converts arithmetic mean (m) and arithmetic standard deviation (s)
 * into shape (k) and scale (λ) using numerical root finding for:
 *   CV² + 1 = Γ(1 + 2/k) / Γ(1 + 1/k)²
 *   λ = m / Γ(1 + 1/k)
 */
export function arithmeticToWeibull(mean: number, stdDev: number): { 
  shape: number; 
  scale: number; 
  cv: number;
} | null {
  if (mean <= 0 || stdDev <= 0) return null;
  const cv = stdDev / mean;
  const target = 1 + cv * cv;
  
  // High-precision bisection search for k in [0.02, 50]
  let low = 0.02;
  let high = 50.0;
  let shape = 1.0;
  
  const f = (k: number) => {
    const g1 = gammaFunction(1 + 1 / k);
    const g2 = gammaFunction(1 + 2 / k);
    return g2 / (g1 * g1) - target;
  };

  for (let i = 0; i < 35; i++) {
    shape = (low + high) / 2;
    const val = f(shape);
    if (Math.abs(val) < 1e-7) break;
    if (val > 0) {
      low = shape;
    } else {
      high = shape;
    }
  }

  const g1 = gammaFunction(1 + 1 / shape);
  const scale = mean / g1;
  return { shape, scale, cv: cv * 100 };
}

/**
 * WEIBULL: Converts shape and scale back to arithmetic mean, stdDev, and CV.
 */
export function weibullToArithmetic(shape: number, scale: number): { 
  mean: number; 
  stdDev: number; 
  cv: number;
} {
  if (shape <= 0 || scale <= 0) return { mean: 0, stdDev: 0, cv: 0 };
  const g1 = gammaFunction(1 + 1 / shape);
  const g2 = gammaFunction(1 + 2 / shape);
  const mean = scale * g1;
  const variance = scale * scale * (g2 - g1 * g1);
  const stdDev = Math.sqrt(Math.max(0, variance));
  const cv = (stdDev / mean) * 100;
  return { mean, stdDev, cv };
}

/**
 * UNIFORM: Parameterizes symmetric bounds [a, b] from arithmetic mean (m) and stdDev (s):
 *   a = m - s * √3
 *   b = m + s * √3
 */
export function arithmeticToUniform(mean: number, stdDev: number): { min: number; max: number } {
  const halfRange = stdDev * Math.sqrt(3);
  return {
    min: mean - halfRange,
    max: mean + halfRange
  };
}

export function getSample(params: DistributionParams): number {
  // Handle 'exponential' as a special case of Gamma or directly
  if (params.type === 'exponential') {
    return -Math.log(1 - Math.random()) / (params.rate ?? 1);
  }

  switch (params.type) {
    case 'deterministic':
      return params.value ?? 0;
    case 'uniform':
      return (params.min ?? 0) + Math.random() * ((params.max ?? 0) - (params.min ?? 0));
    case 'triangular': {
      const min = params.min ?? 0;
      const max = params.max ?? 0;
      const mode = params.mode ?? 0;
      const u = Math.random();
      const F = (mode - min) / (max - min);
      if (u < F) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
      } else {
        return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
      }
    }
    case 'pert': {
      const min = params.min ?? 0;
      const max = params.max ?? 0;
      const mode = params.mode ?? 0;
      const gamma = params.gamma ?? 4;
      if (mode === min && mode === max) return mode;
      const alpha = 1 + gamma * (mode - min) / (max - min);
      const betaVal = 1 + gamma * (max - mode) / (max - min);
      const x = randomBeta(alpha, betaVal);
      return min + x * (max - min);
    }
    case 'normal':
      return Math.max(0, (params.mean ?? 0) + (params.stdDev ?? 0) * randomStandardNormal());
    case 'lognormal': {
      if (params.paramMode === 'arithmetic' || (params.mu === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        const { mu, sigma } = arithmeticToLognormal(params.mean ?? 1, params.stdDev ?? 0.1);
        return Math.exp(mu + sigma * randomStandardNormal());
      }
      return Math.exp((params.mu ?? 0) + (params.sigma ?? 0) * randomStandardNormal());
    }
    case 'weibull': {
      if (params.paramMode === 'arithmetic' || (params.shape === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        const res = arithmeticToWeibull(params.mean ?? 1, params.stdDev ?? 0.1);
        const shape = res ? res.shape : (params.shape ?? 1);
        const scale = res ? res.scale : (params.scale ?? 1);
        return scale * Math.pow(-Math.log(1 - Math.random()), 1 / shape);
      }
      return (params.scale ?? 0) * Math.pow(-Math.log(1 - Math.random()), 1 / (params.shape ?? 1));
    }
    case 'erlang':
    case 'gamma': {
      if (params.paramMode === 'arithmetic' || (params.shape === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        const { shape, rate } = arithmeticToGamma(params.mean ?? 1, params.stdDev ?? 0.1);
        return randomGamma(shape, rate);
      }
      return randomGamma(params.shape ?? 1, params.rate ?? 1);
    }
    case 'beta': {
      const min = params.min ?? 0;
      const max = params.max ?? 1;
      if (params.paramMode === 'arithmetic' || (params.alpha === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        const res = arithmeticToBeta(params.mean ?? (min + max) / 2, params.stdDev ?? (max - min) / 6, min, max);
        const alpha = res ? res.alpha : (params.alpha ?? 1);
        const betaVal = res ? res.beta : (params.beta ?? 1);
        return min + randomBeta(alpha, betaVal) * (max - min);
      }
      return min + randomBeta(params.alpha ?? 1, params.beta ?? 1) * (max - min);
    }
    case 'gumbel':
      return (params.location ?? 0) - (params.scale ?? 0) * Math.log(-Math.log(Math.random()));
    case 'frechet':
    case 'inverse_weibull':
      return (params.location ?? 0) + (params.scale ?? 0) * Math.pow(-Math.log(Math.random()), -1 / (params.shape ?? 1));
    default:
      return 0;
  }
}

export function induceRankCorrelation(arrayA: number[], arrayB: number[], rho: number): { correlatedA: number[], correlatedB: number[] } {
  const n = arrayA.length;
  if (rho === 0) return { correlatedA: arrayA, correlatedB: arrayB };

  const sortedA = [...arrayA].sort((a, b) => a - b);
  const sortedB = [...arrayB].sort((a, b) => a - b);

  const c1 = new Array(n);
  const c2 = new Array(n);
  const sqrtRho = Math.sqrt(1 - rho * rho);

  for (let i = 0; i < n; i++) {
    const z1 = randomStandardNormal();
    const z2 = randomStandardNormal();
    c1[i] = z1;
    c2[i] = rho * z1 + sqrtRho * z2;
  }

  const getRanks = (arr: number[]) => {
    const sorted = [...arr].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const ranks = new Array(arr.length);
    for (let i = 0; i < sorted.length; i++) {
      ranks[sorted[i][1]] = i;
    }
    return ranks;
  };

  const ranksC1 = getRanks(c1);
  const ranksC2 = getRanks(c2);

  const correlatedA = new Array(n);
  const correlatedB = new Array(n);

  for (let i = 0; i < n; i++) {
    correlatedA[i] = sortedA[ranksC1[i]];
    correlatedB[i] = sortedB[ranksC2[i]];
  }

  return { correlatedA, correlatedB };
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  const numerator = n * sumXY - sumX * sumY;
  const denX = n * sumX2 - sumX * sumX;
  const denY = n * sumY2 - sumY * sumY;
  
  // Guard against constant variables (denominator would be zero or tiny negative due to precision)
  if (denX <= 0 || denY <= 0) return 0;
  
  const denominator = Math.sqrt(denX * denY);
  if (denominator === 0 || isNaN(denominator)) return 0;
  
  const r = numerator / denominator;
  return isNaN(r) ? 0 : Math.max(-1, Math.min(1, r));
}

export function validateDistribution(type: DistributionType, params: DistributionParams): string | null {
  const isNum = (v: number | undefined) => typeof v === 'number' && !isNaN(v);
  
  if (type === 'exponential') {
      if (!isNum(params.rate)) return 'Requiere Tasa (rate).';
      return null;
  }

  switch (type) {
    case 'deterministic':
      if (!isNum(params.value)) return 'Requiere un valor.';
      break;
    case 'uniform':
      if (!isNum(params.min) || !isNum(params.max)) return 'Requiere Mín y Máx.';
      if (params.min! >= params.max!) return 'Mín debe ser menor que Máx.';
      break;
    case 'triangular':
      if (!isNum(params.min) || !isNum(params.mode) || !isNum(params.max)) return 'Requiere todos los campos.';
      if (params.min! > params.mode!) return 'Mín no puede ser mayor que Moda.';
      if (params.mode! > params.max!) return 'Moda no puede ser mayor que Máx.';
      if (params.min! >= params.max!) return 'Mín debe ser menor que Máx.';
      break;
    case 'pert':
      if (!isNum(params.min) || !isNum(params.mode) || !isNum(params.max)) return 'Requiere Mín, Moda, Máx.';
      if (params.min! > params.mode!) return 'Mín > Moda.';
      if (params.mode! > params.max!) return 'Moda > Máx.';
      if (params.gamma !== undefined && params.gamma <= 0) return 'Gamma debe ser > 0.';
      break;
    case 'normal':
      if (!isNum(params.mean) || !isNum(params.stdDev)) return 'Requiere Media y Desv. Estándar.';
      if (params.stdDev! < 0) return 'Desv. Estándar no puede ser negativa.';
      break;
    case 'lognormal':
      if (params.paramMode === 'arithmetic' || (params.mu === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        if (!isNum(params.mean) || !isNum(params.stdDev)) return 'Requiere Media y Desv. Estándar.';
        if (params.mean! <= 0) return 'La media aritmética debe ser > 0.';
        if (params.stdDev! <= 0) return 'La desv. estándar debe ser > 0.';
        break;
      }
      if (!isNum(params.mu) || !isNum(params.sigma)) return 'Requiere Mu y Sigma.';
      if (params.sigma! <= 0) return 'Sigma debe ser > 0.';
      break;
    case 'weibull':
    case 'inverse_weibull':
      if (params.paramMode === 'arithmetic' || (params.shape === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        if (!isNum(params.mean) || !isNum(params.stdDev)) return 'Requiere Media y Desv. Estándar.';
        if (params.mean! <= 0) return 'La media aritmética debe ser > 0.';
        if (params.stdDev! <= 0) return 'La desv. estándar debe ser > 0.';
        break;
      }
      if (!isNum(params.shape) || !isNum(params.scale)) return 'Requiere Forma y Escala.';
      if (params.shape! <= 0) return 'Forma debe ser > 0.';
      if (params.scale! <= 0) return 'Escala debe ser > 0.';
      break;
    case 'erlang':
    case 'gamma':
      if (params.paramMode === 'arithmetic' || (params.shape === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        if (!isNum(params.mean) || !isNum(params.stdDev)) return 'Requiere Media y Desv. Estándar.';
        if (params.mean! <= 0) return 'La media aritmética debe ser > 0.';
        if (params.stdDev! <= 0) return 'La desv. estándar debe ser > 0.';
        break;
      }
      if (!isNum(params.shape) || !isNum(params.rate)) return 'Requiere Forma y Tasa.';
      if (params.shape! <= 0) return 'Forma debe ser > 0.';
      if (params.rate! <= 0) return 'Tasa debe ser > 0.';
      break;
    case 'beta':
      if (!isNum(params.min) || !isNum(params.max)) return 'Requiere Mín y Máx.';
      if (params.min! >= params.max!) return 'Mín debe ser menor que Máx.';
      if (params.paramMode === 'arithmetic' || (params.alpha === undefined && params.mean !== undefined && params.stdDev !== undefined)) {
        if (!isNum(params.mean) || !isNum(params.stdDev)) return 'Requiere Media y Desv. Estándar.';
        if (params.mean! <= params.min! || params.mean! >= params.max!) return 'La media debe situarse entre Mín y Máx.';
        if (params.stdDev! <= 0) return 'La desv. estándar debe ser > 0.';
        const range = params.max! - params.min!;
        const mNorm = (params.mean! - params.min!) / range;
        const maxVar = mNorm * (1 - mNorm);
        if ((params.stdDev! * params.stdDev!) / (range * range) >= maxVar) {
          return `Desv. Est. demasiado grande para los límites dados (máx: ${(Math.sqrt(maxVar) * range).toFixed(3)}).`;
        }
        break;
      }
      if (!isNum(params.alpha) || !isNum(params.beta)) return 'Requiere Alpha y Beta.';
      if (params.alpha! <= 0 || params.beta! <= 0) return 'Alpha y Beta deben ser > 0.';
      break;
    case 'gumbel':
      if (!isNum(params.location) || !isNum(params.scale)) return 'Requiere Ubicación y Escala.';
      if (params.scale! <= 0) return 'Escala debe ser > 0.';
      break;
    case 'frechet':
      if (!isNum(params.shape) || !isNum(params.scale) || !isNum(params.location)) return 'Requiere todos los campos.';
      if (params.shape! <= 0) return 'Forma debe ser > 0.';
      if (params.scale! <= 0) return 'Escala debe ser > 0.';
      break;
  }
  return null;
}

export function getPercentile(arr: number[] | Float64Array, p: number, isPreSorted = false): number {
  if (!arr.length) return 0;
  const sorted = isPreSorted ? arr : (arr instanceof Float64Array ? new Float64Array(arr).sort() : new Float64Array(arr).sort());
  const n = sorted.length;
  if (n === 1) return sorted[0];
  const idx = Math.max(0, Math.min(n - 1, (p / 100) * (n - 1)));
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  
  const getRanks = (arr: number[]): number[] => {
    const pairs = arr.map((val, idx) => ({ val, idx }));
    pairs.sort((a, b) => a.val - b.val);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n - 1 && pairs[j + 1].val === pairs[j].val) {
        j++;
      }
      const rank = (i + j + 2) / 2;
      for (let k = i; k <= j; k++) {
        ranks[pairs[k].idx] = rank;
      }
      i = j + 1;
    }
    return ranks;
  };

  const ranksX = getRanks(x);
  const ranksY = getRanks(y);
  return calculatePearsonCorrelation(ranksX, ranksY);
}

/**
 * Normalizes chemical residue concentration to mg/kg (or mg/L).
 * - mg/kg, mg/L: factor 1
/**
 * Normalizes concentration values to standard mg/kg (or mg/L):
 * - mg/kg, mg/L, ppm: factor 1
 * - μg/kg, μg/L, ug/kg, ug/L, ppb: factor 0.001 (10^-3)
 * - ng/kg, ng/L, ppt: factor 1e-6
 * - g/kg, g/L: factor 1000
 */
export function normalizeConcentration(value: number, unit?: string): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  if (!unit) return value;
  const u = unit.toLowerCase().trim();
  if (u.includes('μg') || u.includes('ug') || u === 'ppb' || u.includes('microg')) {
    return value * 0.001;
  }
  if (u.includes('ng') || u === 'ppt' || u.includes('nanog')) {
    return value * 1e-6;
  }
  if (u === 'g/kg' || u === 'g/l' || u === 'g/l') {
    return value * 1000;
  }
  return value;
}

/**
 * Normalizes daily food consumption to kg/day (or L/day) per person
 * to ensure dimensional consistency with Concentration (mg/kg) and Body Weight (kg):
 *   Exposure (mg / kg_bw · day) = [Conc (mg/kg) * Cons (kg/day)] / BW (kg)
 *
 * If consumption is entered in grams per day (g/día, g/persona/día, g/day, g):
 *   Cons (kg/day) = Cons (g/day) * 0.001 (divide by 1000)
 *
 * If consumption is entered in mL/day:
 *   Cons (kg/day) = Cons (mL/day) * 0.001 (assuming density ~ 1 g/mL)
 *
 * If consumption is entered in mg/day:
 *   Cons (kg/day) = Cons (mg/day) * 1e-6
 *
 * If already in kg/día, kg/persona/día, L/día:
 *   Cons (kg/day) = Cons * 1
 */
export function normalizeConsumption(value: number, unit?: string): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  if (!unit) {
    // Default in dietary survey databases is grams per person per day (g/day)
    return value > 1 ? value * 0.001 : value;
  }
  const u = unit.toLowerCase().trim();

  // Explicit Grams (g/día, g/dia, g/persona/día, g/persona/dia, g/person/day, g/day, g, gramos)
  if (
    u.includes('g/persona') ||
    u.includes('g/dia') ||
    u.includes('g/día') ||
    u.includes('g/person') ||
    u.includes('g/day') ||
    u === 'g' ||
    u.includes('gram')
  ) {
    return value * 0.001;
  }

  // Milliliters (mL/día, ml/persona/día, ml/day, etc.)
  if (
    u.includes('ml/persona') ||
    u.includes('ml/dia') ||
    u.includes('ml/día') ||
    u.includes('ml/person') ||
    u.includes('ml/day') ||
    u === 'ml' ||
    u.includes('mililit')
  ) {
    return value * 0.001;
  }

  // Milligrams (mg/día, mg/dia, mg/day)
  if (u.includes('mg/dia') || u.includes('mg/día') || u.includes('mg/day') || u === 'mg') {
    return value * 1e-6;
  }

  // Kilograms / Liters (kg/día, kg/persona/día, l/día, l/persona/día, etc.)
  if (
    u.includes('kg') ||
    u.includes('kilo') ||
    u.includes('l/persona') ||
    u.includes('l/dia') ||
    u.includes('l/día') ||
    u.includes('l/person') ||
    u.includes('l/day') ||
    u === 'l' ||
    u.includes('litro') ||
    u.includes('liter')
  ) {
    return value;
  }

  // Safe Fallback: dietary per-capita daily intake values > 1 are overwhelmingly in grams
  return value > 1 ? value * 0.001 : value;
}