import { CandlestickData, UTCTimestamp, LineData, SeriesMarker } from "lightweight-charts";

export interface CustomPlotOutput {
  id: string;
  title: string;
  color: string;
  lineWidth?: number;
  data: LineData<UTCTimestamp>[];
  overlay: boolean;
}

export interface CustomLevelLine {
  id: string;
  price: number;
  title: string;
  color: string;
  lineStyle?: number;
}

export interface CustomDashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  variant?: "gain" | "loss" | "warning" | "brand" | "default";
}

export interface ScriptExecutionResult {
  success: boolean;
  error?: string;
  plots: CustomPlotOutput[];
  markers: SeriesMarker<UTCTimestamp>[];
  levels: CustomLevelLine[];
  dashboard: CustomDashboardCard[];
  logs: string[];
  executionTimeMs: number;
}

// ---------------------------------------------------------------------------
// SERIES ARRAY PRIMITIVE (Vector Math & Pine Compatibility)
// ---------------------------------------------------------------------------
export class SeriesArray<T extends number = number> extends Array<T> {
  constructor(items: T[] = []) {
    super(...items);
    Object.setPrototypeOf(this, SeriesArray.prototype);
  }

  valueOf(): number {
    return this.length > 0 ? (this[this.length - 1] as number) : 0;
  }

  [Symbol.toPrimitive](hint: string): number | string {
    if (hint === "string") return String(this.valueOf());
    return this.valueOf();
  }

  toFixed(digits: number = 2): string {
    return Number(this.valueOf()).toFixed(digits);
  }

  prev(offset: number = 1): number {
    const idx = this.length - 1 - offset;
    return idx >= 0 ? (this[idx] as number) : (this[0] as number);
  }
}

export function toSeries<T extends number>(arr: T[]): SeriesArray<T> {
  return new SeriesArray<T>(arr);
}

// ---------------------------------------------------------------------------
// MATHEMATICAL TA PRIMITIVES
// ---------------------------------------------------------------------------

export function calculateSMAArray(values: number[], length: number): SeriesArray<number> {
  const result = new Array(values.length).fill(NaN);
  if (values.length < length) return toSeries(result);

  let sum = 0;
  for (let i = 0; i < length; i++) sum += values[i];
  result[length - 1] = sum / length;

  for (let i = length; i < values.length; i++) {
    sum += values[i] - values[i - length];
    result[i] = sum / length;
  }
  return toSeries(result);
}

export function calculateEMAArray(values: number[], length: number): SeriesArray<number> {
  const result = new Array(values.length).fill(NaN);
  if (values.length < length) return toSeries(result);

  const k = 2 / (length + 1);
  let initialSum = 0;
  for (let i = 0; i < length; i++) initialSum += values[i];
  let prevEMA = initialSum / length;
  result[length - 1] = prevEMA;

  for (let i = length; i < values.length; i++) {
    const currentEMA = values[i] * k + prevEMA * (1 - k);
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  return toSeries(result);
}

export function calculateRMAArray(values: number[], length: number): SeriesArray<number> {
  const result = new Array(values.length).fill(NaN);
  if (values.length < length) return toSeries(result);

  const alpha = 1 / length;
  let sum = 0;
  for (let i = 0; i < length; i++) sum += values[i];
  let prevRMA = sum / length;
  result[length - 1] = prevRMA;

  for (let i = length; i < values.length; i++) {
    prevRMA = alpha * values[i] + (1 - alpha) * prevRMA;
    result[i] = prevRMA;
  }
  return toSeries(result);
}

export function calculateATRArray(candles: CandlestickData<UTCTimestamp>[], length: number = 14): SeriesArray<number> {
  const tr = new Array(candles.length).fill(0);
  tr[0] = candles[0].high - candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }

  return calculateRMAArray(tr, length);
}

export function calculateRSIArray(values: number[], length: number = 14): SeriesArray<number> {
  const result = new Array(values.length).fill(NaN);
  if (values.length <= length) return toSeries(result);

  const gains = new Array(values.length).fill(0);
  const losses = new Array(values.length).fill(0);

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains[i] = diff;
    else losses[i] = Math.abs(diff);
  }

  const avgGains = calculateRMAArray(gains, length);
  const avgLosses = calculateRMAArray(losses, length);

  for (let i = length; i < values.length; i++) {
    const ag = avgGains[i];
    const al = avgLosses[i];
    if (isNaN(ag) || isNaN(al)) continue;
    if (al === 0) {
      result[i] = 100;
    } else {
      const rs = ag / al;
      result[i] = 100 - 100 / (1 + rs);
    }
  }
  return toSeries(result);
}

export function calculateVWAPArray(candles: CandlestickData<UTCTimestamp>[]): SeriesArray<number> {
  const result = new Array(candles.length).fill(0);
  let cumVol = 0;
  let cumTypicalVol = 0;

  for (let i = 0; i < candles.length; i++) {
    const hlc3 = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const vol = Math.max(1, ((candles[i] as any).volume || 500));
    cumTypicalVol += hlc3 * vol;
    cumVol += vol;
    result[i] = cumVol > 0 ? cumTypicalVol / cumVol : hlc3;
  }
  return toSeries(result);
}

export function calculateMACDArray(
  values: number[],
  fastLength: number = 12,
  slowLength: number = 26,
  signalLength: number = 9
): [SeriesArray<number>, SeriesArray<number>, SeriesArray<number>] & {
  macd: SeriesArray<number>;
  signal: SeriesArray<number>;
  hist: SeriesArray<number>;
} {
  const fastEMA = calculateEMAArray(values, fastLength);
  const slowEMA = calculateEMAArray(values, slowLength);
  const macd = new Array(values.length).fill(NaN);

  for (let i = 0; i < values.length; i++) {
    if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) {
      macd[i] = fastEMA[i] - slowEMA[i];
    }
  }

  const validMacdIdx = macd.findIndex((v) => !isNaN(v));
  const validMacd = validMacdIdx >= 0 ? macd.slice(validMacdIdx) : [];
  const signalSlice = calculateEMAArray(validMacd, signalLength);

  const signal = new Array(values.length).fill(NaN);
  const hist = new Array(values.length).fill(NaN);

  if (validMacdIdx >= 0) {
    for (let i = 0; i < signalSlice.length; i++) {
      const origIdx = validMacdIdx + i;
      signal[origIdx] = signalSlice[i];
      if (!isNaN(macd[origIdx]) && !isNaN(signal[origIdx])) {
        hist[origIdx] = macd[origIdx] - signal[origIdx];
      }
    }
  }

  const resMacd = toSeries(macd);
  const resSignal = toSeries(signal);
  const resHist = toSeries(hist);

  const tuple: any = [resMacd, resSignal, resHist];
  tuple.macd = resMacd;
  tuple.signal = resSignal;
  tuple.hist = resHist;
  return tuple;
}

export function calculateDMIArray(
  candles: CandlestickData<UTCTimestamp>[],
  diLength: number = 14,
  adxLength: number = 14
): [SeriesArray<number>, SeriesArray<number>, SeriesArray<number>] & {
  plusDI: SeriesArray<number>;
  minusDI: SeriesArray<number>;
  adx: SeriesArray<number>;
} {
  const len = candles.length;
  const tr = new Array(len).fill(0);
  const plusDM = new Array(len).fill(0);
  const minusDM = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    plusDM[i] = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
    minusDM[i] = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;

    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }

  const smoothTR = calculateRMAArray(tr, diLength);
  const smoothPlusDM = calculateRMAArray(plusDM, diLength);
  const smoothMinusDM = calculateRMAArray(minusDM, diLength);

  const plusDI = new Array(len).fill(NaN);
  const minusDI = new Array(len).fill(NaN);
  const dx = new Array(len).fill(0);

  for (let i = 0; i < len; i++) {
    const str = smoothTR[i];
    if (str > 0) {
      plusDI[i] = (smoothPlusDM[i] / str) * 100;
      minusDI[i] = (smoothMinusDM[i] / str) * 100;
      const sum = plusDI[i] + minusDI[i];
      const diff = Math.abs(plusDI[i] - minusDI[i]);
      dx[i] = sum > 0 ? (diff / sum) * 100 : 0;
    }
  }

  const adx = calculateRMAArray(dx, adxLength);

  const resPlus = toSeries(plusDI);
  const resMinus = toSeries(minusDI);
  const resAdx = toSeries(adx);

  const tuple: any = [resPlus, resMinus, resAdx];
  tuple.plusDI = resPlus;
  tuple.minusDI = resMinus;
  tuple.adx = resAdx;
  return tuple;
}

export function calculateSupertrendArray(
  candles: CandlestickData<UTCTimestamp>[],
  factor: number = 3,
  atrPeriod: number = 10
): { supertrend: SeriesArray<number>; direction: SeriesArray<number> } {
  const atr = calculateATRArray(candles, atrPeriod);
  const supertrend = new Array(candles.length).fill(NaN);
  const direction = new Array(candles.length).fill(1);

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend = 1;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const a = isNaN(atr[i]) ? c.high - c.low : atr[i];
    const hlc2 = (c.high + c.low) / 2;

    let basicUpper = hlc2 + factor * a;
    let basicLower = hlc2 - factor * a;

    let upper = basicUpper;
    let lower = basicLower;

    if (i === 0) {
      prevUpper = upper;
      prevLower = lower;
      supertrend[i] = lower;
      direction[i] = 1;
      continue;
    }

    let trend = prevTrend;
    if (prevTrend === 1 && c.close < prevLower) {
      trend = -1;
    } else if (prevTrend === -1 && c.close > prevUpper) {
      trend = 1;
    }

    direction[i] = trend;
    supertrend[i] = trend === 1 ? lower : upper;
    prevUpper = upper;
    prevLower = lower;
    prevTrend = trend;
  }

  return { supertrend: toSeries(supertrend), direction: toSeries(direction) };
}

// ---------------------------------------------------------------------------
// PINE SCRIPT TRANSPILER & CODE NORMALIZER (Ultra-Resilient)
// ---------------------------------------------------------------------------

const PINE_NAMED_ARGS = [
  "text_color",
  "text_size",
  "text_halign",
  "text_valign",
  "minval",
  "maxval",
  "step",
  "group",
  "options",
  "defval",
  "title",
  "overlay",
  "max_labels_count",
  "max_boxes_count",
  "max_lines_count",
  "max_bars_back",
  "bgcolor",
  "border_color",
  "border_width",
  "tooltip",
  "display",
  "precision",
  "format",
  "location",
  "color",
  "textcolor",
  "style",
  "size",
  "text",
  "linewidth",
  "width",
  "extend",
  "editable",
  "inline",
  "columns",
  "rows",
  "position",
  "offset",
];

export function transpilePineScriptToJS(pineCode: string): string {
  let code = pineCode.replace(/\r\n/g, "\n");

  // 1. Remove comments and header directives
  code = code
    .replace(/\/\/@version=\d+/gi, "")
    .replace(/\bindicator\s*\([^)]*\)/gi, "// indicator header stripped")
    .replace(/\bstrategy\s*\([^)]*\)/gi, "// strategy header stripped");

  // 2. Transpile UNQUOTED raw Hex color literals (e.g. #40E0D0 -> "#40E0D0"), don't touch already-quoted "#40E0D0"
  code = code.replace(/(?<!["'])#([0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3})\b(?!["'])/g, '"#$1"');

  // 3. Strip Pine Named Argument Labels: `text_color=val` -> `val`
  const namedArgRegex = new RegExp(`\\b(${PINE_NAMED_ARGS.join("|")})\\s*=\\s*`, "gi");
  code = code.replace(namedArgRegex, "");

  // 4. Transpile Pine Multi-line Functions: `f_name(args) =>`
  code = code.replace(
    /^([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*=>\s*\n((?:(?: {2,8}|\t).*\n?)+)/gm,
    (match: string, funcName: string, args: string, body: string) => {
      const cleanBody = body
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => (line.endsWith(";") ? line : line + ";"))
        .join("\n");
      return `var ${funcName} = (${args}) => {\n${cleanBody}\n};\n`;
    }
  );

  // Single-line arrow functions
  code = code.replace(
    /^([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*=>\s*(.+)$/gm,
    "var $1 = ($2) => { return $3; };"
  );

  // 5. Handle Tuple Destructuring assignments: `[m, s, _] = ...` and `[_, _, adx] = ...`
  // Use [^\S\r\n]* (horizontal whitespace only) so we NEVER consume newlines!
  let dummyCounter = 0;
  code = code.replace(/(?:^|\n)[^\S\r\n]*(?:var|let|const)?[^\S\r\n]*\[\s*([a-zA-Z0-9_, ]+)\s*\]\s*=/g, (match, inner) => {
    const parts = inner.split(",").map((p: string) => {
      const trimmed = p.trim();
      if (trimmed === "_" || trimmed === "") {
        dummyCounter++;
        return `_ignore_${dummyCounter}`;
      }
      return trimmed;
    });
    return `\nvar [${parts.join(", ")}] =`;
  });

  // 6. Generic array definitions: `var Zone[] resZones = array.new<Zone>()`
  code = code.replace(/\b(?:var|varip|let)?\s*[a-zA-Z0-9_]+\[\]\s+([a-zA-Z0-9_]+)\s*=\s*array\.new(?:<[^>]+>)?\(([^)]*)\)/g, "var $1 = array.new($2)");

  // 7. Custom type definitions: `type Zone \n box b ...` -> factory object
  code = code.replace(/^type\s+([a-zA-Z0-9_]+)\s*\n((?:(?: {2,8}|\t).*\n?)+)/gm, "var $1 = { new: (...args) => ({}) };\n");

  // 8. Method declarations: `method in_out(...) => ...` -> `var in_out = ...`
  code = code.replace(/^method\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*=>\s*\n((?:(?: {2,8}|\t).*\n?)+)/gm, "var $1 = ($2) => {};\n");
  code = code.replace(/^method\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*=>\s*(.+)$/gm, "var $1 = ($2) => { return $3; };\n");

  // 9. Comma-separated variable declarations: `var float a = 0, var float b = 0`
  code = code.replace(/,\s*(?:var|varip|let)?\s*(?:float|int|bool|string|color|series|simple|table|line|label|box|chart)?\s*([a-zA-Z_0-9]+)\s*=/g, "; var $1 =");

  // 10. Normal variable declarations (including table, line, label, box, chart)
  code = code.replace(
    /\b(?:var|varip)\s+(?:float|int|bool|string|color|series|simple|table|line|label|box|chart)?\s*([a-zA-Z_0-9]+)\s*=/g,
    "var $1 ="
  );
  code = code.replace(
    /\b(?:float|int|bool|string|color|series|simple|table|line|label|box|chart)\s+([a-zA-Z_0-9]+)\s*=/g,
    "var $1 ="
  );
  code = code.replace(
    /\b(?:float|int|bool|string|color|series|simple|table|line|label|box|chart)\s+([a-zA-Z_0-9]+)\b/g,
    "var $1"
  );

  // 11. Deduplicate consecutive var/let/const keywords
  code = code.replace(/\b(?:var|let|const)\s+(?:var|let|const)\s+/g, "var ");
  code = code.replace(/\b(?:var|let|const)\s+(?:var|let|const)\s+/g, "var ");

  // 12. Transpile Pine Operators
  code = code.replace(/:=/g, "=");
  code = code.replace(/\band\b/g, "&&");
  code = code.replace(/\bor\b/g, "||");
  code = code.replace(/\bnot\b/g, "!");

  return code;
}

// ---------------------------------------------------------------------------
// EXECUTION ENGINE
// ---------------------------------------------------------------------------

export function executeCustomScript(
  scriptCode: string,
  candles: CandlestickData<UTCTimestamp>[]
): ScriptExecutionResult {
  const startTime = performance.now();
  const logs: string[] = [];
  const plots: CustomPlotOutput[] = [];
  const markers: SeriesMarker<UTCTimestamp>[] = [];
  const levels: CustomLevelLine[] = [];
  const dashboard: CustomDashboardCard[] = [];

  let targetCandles = candles;
  if (!targetCandles || targetCandles.length === 0) {
    const now = Math.floor(Date.now() / 1000);
    const fallbackList: CandlestickData<UTCTimestamp>[] = [];
    let base = 2885.5;
    for (let i = 150; i >= 0; i--) {
      const time = (now - i * 900) as UTCTimestamp;
      const change = (Math.random() - 0.495) * 1.5;
      const open = base;
      const close = Number((open + change).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * 1.2).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * 1.2).toFixed(2));
      base = close;
      fallbackList.push({
        time,
        open,
        high,
        low,
        close,
        ...( { volume: Math.floor(Math.random() * 800 + 200) } as any ),
      });
    }
    targetCandles = fallbackList;
    logs.push("Dataset auto-generated for standalone preview (150 candles).");
  }

  try {
    const closes = toSeries(targetCandles.map((c) => c.close));
    const opens = toSeries(targetCandles.map((c) => c.open));
    const highs = toSeries(targetCandles.map((c) => c.high));
    const lows = toSeries(targetCandles.map((c) => c.low));
    const volumes = toSeries(targetCandles.map((c) => (c as any).volume || 500));
    const hlc3 = toSeries(targetCandles.map((c) => (c.high + c.low + c.close) / 3));
    const hl2 = toSeries(targetCandles.map((c) => (c.high + c.low) / 2));
    const ohlc4 = toSeries(targetCandles.map((c) => (c.open + c.high + c.low + c.close) / 4));

    // Pine Script TA Object
    const ta = {
      sma: (src: number[], len: number) => calculateSMAArray(src, len),
      ema: (src: number[], len: number) => calculateEMAArray(src, len),
      rma: (src: number[], len: number) => calculateRMAArray(src, len),
      atr: (len: number = 14) => calculateATRArray(targetCandles, len),
      rsi: (src: number[], len: number = 14) => calculateRSIArray(src, len),
      vwap: (src?: number[]) => calculateVWAPArray(targetCandles),
      macd: (src: number[], f: number = 12, s: number = 26, sig: number = 9) =>
        calculateMACDArray(src, f, s, sig),
      dmi: (diLen: number = 14, adxLen: number = 14) =>
        calculateDMIArray(targetCandles, diLen, adxLen),
      supertrend: (factor: number = 3, atrPeriod: number = 10) =>
        calculateSupertrendArray(targetCandles, factor, atrPeriod),
      highest: (src: number[], len: number) => {
        const res = new Array(src.length).fill(NaN);
        for (let i = len - 1; i < src.length; i++) {
          let maxVal = -Infinity;
          for (let j = 0; j < len; j++) maxVal = Math.max(maxVal, src[i - j]);
          res[i] = maxVal;
        }
        return toSeries(res);
      },
      lowest: (src: number[], len: number) => {
        const res = new Array(src.length).fill(NaN);
        for (let i = len - 1; i < src.length; i++) {
          let minVal = Infinity;
          for (let j = 0; j < len; j++) minVal = Math.min(minVal, src[i - j]);
          res[i] = minVal;
        }
        return toSeries(res);
      },
      pivothigh: (src: any, left: number = 5, right: number = 5) => {
        const arr = Array.isArray(src) ? src : highs;
        const len = arr.length;
        if (len < left + right + 1) return NaN;
        const targetIdx = len - 1 - right;
        const targetVal = arr[targetIdx];
        for (let i = 1; i <= left; i++) {
          if (arr[targetIdx - i] >= targetVal) return NaN;
        }
        for (let i = 1; i <= right; i++) {
          if (arr[targetIdx + i] >= targetVal) return NaN;
        }
        return targetVal;
      },
      pivotlow: (src: any, left: number = 5, right: number = 5) => {
        const arr = Array.isArray(src) ? src : lows;
        const len = arr.length;
        if (len < left + right + 1) return NaN;
        const targetIdx = len - 1 - right;
        const targetVal = arr[targetIdx];
        for (let i = 1; i <= left; i++) {
          if (arr[targetIdx - i] <= targetVal) return NaN;
        }
        for (let i = 1; i <= right; i++) {
          if (arr[targetIdx + i] <= targetVal) return NaN;
        }
        return targetVal;
      },
      crossover: (a: number[] | number, b: number[] | number) => {
        const arrA = Array.isArray(a) ? a : [a];
        const arrB = Array.isArray(b) ? b : [b];
        const len = Math.max(arrA.length, arrB.length);
        const res = new Array(len).fill(false);
        for (let i = 1; i < len; i++) {
          const vA = arrA[i] !== undefined ? arrA[i] : arrA[arrA.length - 1];
          const vB = arrB[i] !== undefined ? arrB[i] : arrB[arrB.length - 1];
          const prevA = arrA[i - 1] !== undefined ? arrA[i - 1] : vA;
          const prevB = arrB[i - 1] !== undefined ? arrB[i - 1] : vB;
          res[i] = vA > vB && prevA <= prevB;
        }
        return res;
      },
      crossunder: (a: number[] | number, b: number[] | number) => {
        const arrA = Array.isArray(a) ? a : [a];
        const arrB = Array.isArray(b) ? b : [b];
        const len = Math.max(arrA.length, arrB.length);
        const res = new Array(len).fill(false);
        for (let i = 1; i < len; i++) {
          const vA = arrA[i] !== undefined ? arrA[i] : arrA[arrA.length - 1];
          const vB = arrB[i] !== undefined ? arrB[i] : arrB[arrB.length - 1];
          const prevA = arrA[i - 1] !== undefined ? arrA[i - 1] : vA;
          const prevB = arrB[i - 1] !== undefined ? arrB[i - 1] : vB;
          res[i] = vA < vB && prevA >= prevB;
        }
        return res;
      },
      barssince: (cond: any) => 0,
      change: (src: any) => 0,
    };

    // Pine str & math module
    const str = {
      tostring: (val: any, format?: string) => {
        if (val === null || val === undefined) return "";
        const num = typeof val === "number" ? val : val?.valueOf ? Number(val.valueOf()) : NaN;
        if (!isNaN(num)) {
          if (format === "#") return String(Math.round(num));
          if (format === "#.#") return num.toFixed(1);
          if (format === "#.##" || format === "#.2f") return num.toFixed(2);
          return String(num);
        }
        return String(val);
      },
    };

    const math = {
      min: (...args: any[]) => Math.min(...args.map((x) => Number(x?.valueOf ? x.valueOf() : x))),
      max: (...args: any[]) => Math.max(...args.map((x) => Number(x?.valueOf ? x.valueOf() : x))),
      abs: (n: any) => Math.abs(Number(n?.valueOf ? n.valueOf() : n)),
      round: (n: any, dec: number = 0) => {
        const v = Number(n?.valueOf ? n.valueOf() : n);
        return dec > 0 ? Number(v.toFixed(dec)) : Math.round(v);
      },
      avg: (...args: any[]) => {
        const nums = args.map((x) => Number(x?.valueOf ? x.valueOf() : x));
        return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
      },
      floor: Math.floor,
      ceil: Math.ceil,
    };

    // Pine array module
    const array = {
      new: (size: number = 0, initialVal?: any) => {
        const arr: any[] = [];
        for (let i = 0; i < size; i++) arr.push(initialVal);
        return arr;
      },
      new_float: (size: number = 0, val: number = 0) => new Array(size).fill(val),
      new_int: (size: number = 0, val: number = 0) => new Array(size).fill(val),
      new_bool: (size: number = 0, val: boolean = false) => new Array(size).fill(val),
      new_string: (size: number = 0, val: string = "") => new Array(size).fill(val),
      new_line: () => [],
      new_box: () => [],
      new_label: () => [],
      push: (arr: any[], val: any) => { if (Array.isArray(arr)) arr.push(val); },
      pop: (arr: any[]) => Array.isArray(arr) ? arr.pop() : undefined,
      shift: (arr: any[]) => Array.isArray(arr) ? arr.shift() : undefined,
      unshift: (arr: any[], val: any) => { if (Array.isArray(arr)) arr.unshift(val); },
      size: (arr: any[]) => Array.isArray(arr) ? arr.length : 0,
      get: (arr: any[], idx: number) => Array.isArray(arr) ? arr[idx] : undefined,
      set: (arr: any[], idx: number, val: any) => { if (Array.isArray(arr)) arr[idx] = val; },
      remove: (arr: any[], idx: number) => Array.isArray(arr) ? arr.splice(idx, 1)[0] : undefined,
      clear: (arr: any[]) => { if (Array.isArray(arr)) arr.length = 0; },
    };

    // Pine color module
    const color = {
      black: "#000000",
      white: "#FFFFFF",
      red: "#EF4444",
      green: "#10B981",
      blue: "#3B82F6",
      purple: "#A855F7",
      orange: "#F97316",
      yellow: "#FACC15",
      gray: "#6B7280",
      teal: "#14B8A6",
      lime: "#22C55E",
      silver: "#94A3B8",
      rgb: (r: number, g: number, b: number, a: number = 100) =>
        `rgba(${r}, ${g}, ${b}, ${Math.round((a / 100) * 100) / 100})`,
      new: (c: string, trans: number = 0) => c,
      r: (c: string) => 0,
      g: (c: string) => 0,
      b: (c: string) => 0,
    };

    // Pine text, shape, location, size, position, extend, xloc
    const text = {
      align_left: "left",
      align_right: "right",
      align_center: "center",
      align_top: "top",
      align_bottom: "bottom",
      halign_left: "left",
      halign_right: "right",
      halign_center: "center",
      valign_top: "top",
      valign_center: "center",
      valign_bottom: "bottom",
      size_tiny: "tiny",
      size_small: "small",
      size_normal: "normal",
      size_large: "large",
      size_huge: "huge",
    };

    const shape = {
      circle: "circle",
      square: "square",
      labelup: "arrowUp",
      labeldown: "arrowDown",
      arrowup: "arrowUp",
      arrowdown: "arrowDown",
    };

    const location = {
      abovebar: "aboveBar",
      belowbar: "belowBar",
      absolute: "inBar",
      top: "aboveBar",
      bottom: "belowBar",
    };

    const size = {
      tiny: 0.8,
      small: 1,
      normal: 1.2,
      large: 1.5,
      huge: 2,
    };

    const position = {
      top_right: "top_right",
      top_left: "top_left",
      bottom_right: "bottom_right",
      bottom_left: "bottom_left",
      middle_left: "middle_left",
      middle_right: "middle_right",
    };

    const extend = {
      none: 0,
      right: 1,
      left: 2,
      both: 3,
    };

    const xloc = {
      bar_index: "bar_index",
      bar_time: "bar_time",
    };

    // Pine input module
    const input: any = (defVal: any) => defVal;
    input.string = (defVal: string) => defVal;
    input.int = (defVal: number) => defVal;
    input.float = (defVal: number) => defVal;
    input.bool = (defVal: boolean) => defVal;
    input.color = (defVal: string) => defVal;
    input.source = (defVal: any) => defVal;
    input.session = (defVal: string) => defVal;

    // Pine box module
    const box = {
      new: (left: any, top: any, right: any, bottom: any, ...rest: any[]) => ({
        left,
        top,
        right,
        bottom,
        delete: () => {},
        set_top: function (v: any) { this.top = v; },
        set_bottom: function (v: any) { this.bottom = v; },
        set_left: function (v: any) { this.left = v; },
        set_right: function (v: any) { this.right = v; },
        set_rightbottom: function (r: any, b: any) { this.right = r; this.bottom = b; },
        set_lefttop: function (l: any, t: any) { this.left = l; this.top = t; },
        set_bgcolor: () => {},
        set_border_style: () => {},
        get_left: function () { return this.left; },
        get_right: function () { return this.right; },
        get_top: function () { return this.top; },
        get_bottom: function () { return this.bottom; },
      }),
      delete: (bx: any) => { if (bx?.delete) bx.delete(); },
      set_top: (bx: any, v: any) => { if (bx) bx.top = v; },
      set_bottom: (bx: any, v: any) => { if (bx) bx.bottom = v; },
      set_left: (bx: any, v: any) => { if (bx) bx.left = v; },
      set_right: (bx: any, v: any) => { if (bx) bx.right = v; },
      set_rightbottom: (bx: any, r: any, b: any) => { if (bx) { bx.right = r; bx.bottom = b; } },
      set_lefttop: (bx: any, l: any, t: any) => { if (bx) { bx.left = l; bx.top = t; } },
      set_bgcolor: () => {},
      set_border_style: () => {},
    };

    // Pine line module
    const line = {
      new: (x1: any, y1: any, x2: any, y2: any, ...rest: any[]) => ({
        x1,
        y1,
        x2,
        y2,
        delete: () => {},
        set_xy1: function (x: any, y: any) { this.x1 = x; this.y1 = y; },
        set_xy2: function (x: any, y: any) { this.x2 = x; this.y2 = y; },
        set_color: () => {},
        set_x2: function (x: any) { this.x2 = x; },
        get_x1: function () { return this.x1; },
        get_x2: function () { return this.x2; },
        get_y1: function () { return this.y1; },
        get_y2: function () { return this.y2; },
      }),
      delete: (ln: any) => { if (ln?.delete) ln.delete(); },
      set_xy1: (ln: any, x: any, y: any) => { if (ln) { ln.x1 = x; ln.y1 = y; } },
      set_xy2: (ln: any, x: any, y: any) => { if (ln) { ln.x2 = x; ln.y2 = y; } },
      set_color: () => {},
      set_x2: (ln: any, x: any) => { if (ln) ln.x2 = x; },
      style_solid: 0,
      style_dashed: 1,
      style_dotted: 2,
    };

    // Pine label module
    const label = {
      new: (x: any, y: any, txt: any, ...rest: any[]) => ({
        x,
        y,
        text: txt,
        delete: () => {},
        set_xy: function (_x: any, _y: any) { this.x = _x; this.y = _y; },
        set_text: function (t: any) { this.text = t; },
        set_x: function (_x: any) { this.x = _x; },
        set_color: () => {},
        set_textcolor: () => {},
      }),
      delete: (lb: any) => { if (lb?.delete) lb.delete(); },
      set_xy: (lb: any, x: any, y: any) => { if (lb) { lb.x = x; lb.y = y; } },
      set_text: (lb: any, t: any) => { if (lb) lb.text = t; },
      set_x: (lb: any, x: any) => { if (lb) lb.x = x; },
      style_label_up: "up",
      style_label_down: "down",
      style_label_left: "left",
      style_label_right: "right",
    };

    // Pine request, syminfo, timeframe, barstate
    const request = {
      security: (sym: string, tf: string, expr: any) => expr,
    };

    const syminfo = {
      tickerid: "OANDA:XAUUSD",
      ticker: "XAUUSD",
      mintick: 0.01,
    };

    const timeframe = {
      period: "15",
      isintraday: true,
      in_seconds: () => 900,
    };

    const barstate = {
      islast: true,
      isfirst: false,
      isconfirmed: true,
    };

    const bar_index = targetCandles.length - 1;
    const last_bar_index = targetCandles.length - 1;
    const timenow = Date.now();
    const time = (tf?: any, res?: any, sess?: any) => timenow;

    // Pine Table Module
    const createdTables: any[] = [];
    const table = {
      new: (pos: any, cols: number, rows: number) => {
        const tbl = { id: `table-${createdTables.length + 1}`, rows: {} as Record<number, Record<number, any>> };
        createdTables.push(tbl);
        return tbl;
      },
      cell: (
        tbl: any,
        col: number,
        row: number,
        textVal: any,
        ...rest: any[]
      ) => {
        if (!tbl) return;
        if (!tbl.rows[row]) tbl.rows[row] = {};
        let textColor = "#FFFFFF";
        for (const arg of rest) {
          if (
            typeof arg === "string" &&
            (arg.startsWith("#") ||
              arg.startsWith("rgb") ||
              arg === "black" ||
              arg === "red" ||
              arg === "green")
          ) {
            textColor = arg;
          }
        }
        tbl.rows[row][col] = {
          text: String(textVal !== undefined && textVal !== null ? textVal : ""),
          color: textColor,
        };
      },
    };

    // Plotting functions
    const plot = (
      seriesData: any,
      title: string = "Plot",
      options?: { color?: string; lineWidth?: number; overlay?: boolean }
    ) => {
      const col = options?.color || "#38BDF8";
      const lineWidth = options?.lineWidth || 2;
      const overlay = options?.overlay !== false;

      const data: LineData<UTCTimestamp>[] = [];
      if (Array.isArray(seriesData)) {
        for (let i = 0; i < targetCandles.length; i++) {
          const val = seriesData[i];
          if (!isNaN(val) && val !== null && val !== undefined) {
            data.push({ time: targetCandles[i].time, value: Number(val.toFixed(5)) });
          }
        }
      }
      plots.push({
        id: `plot-${plots.length + 1}-${title.replace(/\s+/g, "_")}`,
        title,
        color: col,
        lineWidth,
        data,
        overlay,
      });
      logs.push(`Plot line: ${title} (${data.length} pts)`);
      return seriesData;
    };

    const plotshape = (
      condition: any,
      options?: {
        title?: string;
        text?: string;
        style?: any;
        location?: any;
        color?: string;
        size?: number;
      }
    ) => {
      const title = options?.title || "Signal";
      const textVal = options?.text || "SIGNAL";
      const col = options?.color || (textVal.toUpperCase().includes("BUY") ? "#10B981" : "#EF4444");
      const shapeVal = options?.style || (textVal.toUpperCase().includes("BUY") ? "arrowUp" : "arrowDown");
      const positionVal = options?.location || (shapeVal === "arrowUp" ? "belowBar" : "aboveBar");

      if (Array.isArray(condition)) {
        for (let i = 0; i < targetCandles.length; i++) {
          if (condition[i]) {
            markers.push({
              time: targetCandles[i].time,
              position: positionVal,
              color: col,
              shape: shapeVal === "circle" ? "circle" : shapeVal === "square" ? "square" : shapeVal === "arrowUp" ? "arrowUp" : "arrowDown",
              text: textVal,
              size: options?.size || 1,
            });
          }
        }
      }
      logs.push(`Signal markers: ${title} (${markers.length} events)`);
    };

    const hline = (
      price: number,
      title: string = "Level",
      options?: { color?: string; lineStyle?: number }
    ) => {
      if (!isNaN(price) && price > 0) {
        levels.push({
          id: `level-${levels.length + 1}`,
          price,
          title,
          color: options?.color || "#F59E0B",
          lineStyle: options?.lineStyle ?? 2,
        });
        logs.push(`Price level: ${title} ($${price})`);
      }
    };

    const addDashboardCard = (card: CustomDashboardCard) => {
      dashboard.push(card);
    };

    const nz = (val: any, replacement: any = 0) =>
      isNaN(val) || val === null || val === undefined ? replacement : val;

    const na = (val: any) =>
      isNaN(val) || val === null || val === undefined;

    const fixnan = (val: any) => (isNaN(val) ? 0 : val);

    const fill = () => {};
    const barcolor = () => {};
    const bgcolor = () => {};
    const max_bars_back = () => {};

    // Transpile Script
    const transpiledCode = transpilePineScriptToJS(scriptCode);
    logs.push("Pine Script transpiled successfully.");

    // Execution Context Wrapper
    const context: any = {
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      volume: volumes,
      hlc3,
      hl2,
      ohlc4,
      candles: targetCandles,
      ta,
      str,
      math,
      array,
      color,
      text,
      shape,
      location,
      size,
      position,
      extend,
      xloc,
      input,
      box,
      line,
      label,
      request,
      syminfo,
      timeframe,
      barstate,
      bar_index,
      last_bar_index,
      timenow,
      time,
      table,
      plot,
      plotshape,
      hline,
      addDashboardCard,
      nz,
      na,
      fixnan,
      fill,
      barcolor,
      bgcolor,
      max_bars_back,
      Math,
      console: {
        log: (...args: any[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: any[]) => logs.push(`[WARN] ${args.map(String).join(" ")}`),
        error: (...args: any[]) => logs.push(`[ERROR] ${args.map(String).join(" ")}`),
      },
    };

    const paramNames = Object.keys(context);
    const paramValues = Object.values(context);

    const executor = new Function(
      ...paramNames,
      `
      ${transpiledCode}
      return {
        bullPct: typeof bullPct !== 'undefined' ? bullPct : undefined,
        bearPct: typeof bearPct !== 'undefined' ? bearPct : undefined
      };
      `
    );

    const resultScope = executor(...paramValues) || {};

    // Convert created tables into HUD Dashboard cards
    createdTables.forEach((tbl) => {
      Object.keys(tbl.rows).forEach((rowKey) => {
        const row = tbl.rows[Number(rowKey)];
        if (row && (row[0] || row[1])) {
          const title = row[0]?.text || "METRIC";
          const val = row[1]?.text || "";
          const isBull = title.toUpperCase().includes("BULL") || val.toUpperCase().includes("BUY") || val.toUpperCase().includes("BULL");
          const isBear = title.toUpperCase().includes("BEAR") || val.toUpperCase().includes("SELL") || val.toUpperCase().includes("BEAR");

          dashboard.push({
            title,
            value: val,
            variant: isBull ? "gain" : isBear ? "loss" : "brand",
          });
        }
      });
    });

    if (resultScope.bullPct !== undefined && resultScope.bearPct !== undefined) {
      const bPct = Math.round(Number(resultScope.bullPct));
      const rPct = Math.round(Number(resultScope.bearPct));
      dashboard.unshift({
        title: "BEAR SCORE",
        value: `${rPct}%`,
        variant: rPct > 50 ? "loss" : "default",
      });
      dashboard.unshift({
        title: "BULL SCORE",
        value: `${bPct}%`,
        variant: bPct > 50 ? "gain" : "default",
      });
    }

    markers.sort((a, b) => Number(a.time) - Number(b.time));

    const endTime = performance.now();
    const executionTimeMs = Number((endTime - startTime).toFixed(2));
    logs.push(`Executed successfully in ${executionTimeMs}ms.`);

    return {
      success: true,
      plots,
      markers,
      levels,
      dashboard,
      logs,
      executionTimeMs,
    };
  } catch (err: any) {
    const endTime = performance.now();
    return {
      success: false,
      error: err.message || "Failed to compile/execute Pine Script",
      plots,
      markers,
      levels,
      dashboard,
      logs: [...logs, `[SYNTAX/RUNTIME ERROR]: ${err.message}`],
      executionTimeMs: Number((endTime - startTime).toFixed(2)),
    };
  }
}

// ---------------------------------------------------------------------------
// BUILT-IN PINE SCRIPT TEMPLATES (Pure Authentic Pine Script v5 / v6)
// ---------------------------------------------------------------------------

export const DEFAULT_SCRIPT_TEMPLATES = [
  {
    id: "sniper-smc",
    name: "Sniper Entry/Exit with SL&TP (SMC Pro)",
    nameVi: "Chiến Lược Sniper Vào Lệnh & Cắt Lỗ SMC (Pine v6)",
    description: "Bộ chỉ báo xu hướng EMA 9/21 Ribbon, VWAP, ATR Dynamic TP/SL, đo lực Bull/Bear và nhãn BUY/SELL chuẩn Pine Script.",
    code: `//@version=6
indicator("Sniper Entry/Exit with SL&TP", overlay=true, max_labels_count=500, max_boxes_count=500, max_bars_back=1000)

// --- COLORS ---
color c_turquoise = #40E0D0

// --- INPUTS ---
groupVis         = "Visuals & UI"
dashTextSize     = input.string("small", "Dashboard Font Size", options=["tiny", "small", "normal", "large", "huge"], group=groupVis)
tradeTextSize    = input.string("small", "Trade Label Size", options=["tiny", "small", "normal", "large", "huge"], group=groupVis)
ribbonOpacity    = input.int(75, "EMA Ribbon Opacity", minval=0, maxval=100, group=groupVis)
labelOffset      = input.int(12, "Label Right Offset (Bars)", minval=1, group=groupVis)

groupRisk        = "Risk Management"
atrMultiplier    = input.float(1.5, "SL ATR Multiplier", minval=0.1, step=0.1, group=groupRisk)

// --- GLOBAL FUNCTIONS ---
f_addDashRow(_table, _row, _title, _val, _col, _size) =>
    table.cell(_table, 0, _row, _title, text_color=color.black, text_halign=text.align_left, text_size=_size)
    table.cell(_table, 1, _row, _val, text_color=_col, text_size=_size, text_halign=text.align_right)

// --- GLOBAL INDICATORS ---
ema9    = ta.ema(close, 9)
ema21   = ta.ema(close, 21)
vwapV   = ta.vwap(hlc3)
atr     = ta.atr(14)
rsiVal  = ta.rsi(close, 14)
rsi5m   = request.security(syminfo.tickerid, "5", ta.rsi(close, 14))
[m, s, _] = ta.macd(close, 12, 26, 9)
[_, _, adx] = ta.dmi(14, 14)
volAvg  = ta.sma(volume, 20)

// --- DUAL SCORE LOGIC ---
float bScore = 0
bScore += (close > vwapV ? 1 : 0), bScore += (rsiVal > 50 ? 1 : 0), bScore += (m > s ? 1 : 0)
bScore += (ema9 > ema21 ? 1 : 0), bScore += (adx > 25 and close > ema9 ? 1 : 0)
bScore += (volume > volAvg and close > open ? 1 : 0), bScore += (rsi5m > 50 ? 1 : 0)
float bullPct = (bScore / 7) * 100

float rScore = 0
rScore += (close < vwapV ? 1 : 0), rScore += (rsiVal < 50 ? 1 : 0), rScore += (m < s ? 1 : 0)
rScore += (ema9 < ema21 ? 1 : 0), rScore += (adx > 25 and close < ema9 ? 1 : 0)
rScore += (volume > volAvg and close < open ? 1 : 0), rScore += (rsi5m < 50 ? 1 : 0)
float bearPct = (rScore / 7) * 100

// --- BIAS LOGIC ---
string biasText = (bullPct - bearPct) >= 40 ? "STRONG BULL" : (bearPct - bullPct) >= 40 ? "STRONG BEAR" : bullPct > bearPct ? "MILD BULL" : "MILD BEAR"
color biasCol = biasText == "STRONG BULL" ? color.green : biasText == "STRONG BEAR" ? color.red : color.gray

// --- DASHBOARD ---
var table d = table.new(position.middle_left, 2, 17, bgcolor=color.new(#FFF9C4, 10), border_width=1, border_color=color.new(color.gray, 60))
table.cell(d, 0, 0, "BULL SCORE", text_color=color.white, bgcolor=color.green, text_size=dashTextSize)
table.cell(d, 1, 0, str.tostring(bullPct, "#") + "%", text_color=color.white, bgcolor=color.green, text_size=dashTextSize)
table.cell(d, 0, 1, "BEAR SCORE", text_color=color.white, bgcolor=color.red, text_size=dashTextSize)
table.cell(d, 1, 1, str.tostring(bearPct, "#") + "%", text_color=color.white, bgcolor=color.red, text_size=dashTextSize)
table.cell(d, 0, 2, "MARKET BIAS", text_color=color.white, bgcolor=color.black, text_size=dashTextSize)
table.cell(d, 1, 2, biasText, text_color=color.white, bgcolor=biasCol, text_size=dashTextSize)
f_addDashRow(d, 3,  "Price/VWAP",  close > vwapV ? "ABOVE" : "BELOW", close > vwapV ? color.green : color.red, dashTextSize)
f_addDashRow(d, 4,  "RSI (14)",    str.tostring(rsiVal, "#.#"), rsiVal > 50 ? color.green : color.red, dashTextSize)
f_addDashRow(d, 5,  "MACD Trend",  m > s ? "BULL" : "BEAR", m > s ? color.green : color.red, dashTextSize)
f_addDashRow(d, 6,  "ADX Power",   str.tostring(adx, "#.#"), adx > 25 ? color.green : color.gray, dashTextSize)
f_addDashRow(d, 7,  "EMA Cross",   ema9 > ema21 ? "BULL" : "BEAR", ema9 > ema21 ? color.green : color.red, dashTextSize)
f_addDashRow(d, 8,  "ATR 14",      str.tostring(atr, "#.##"), color.black, dashTextSize)
f_addDashRow(d, 9,  "Vol Status",  volume > volAvg ? "HIGH" : "LOW", volume > volAvg ? color.green : color.gray, dashTextSize)
f_addDashRow(d, 10, "5m RSI",      str.tostring(rsi5m, "#.#"), rsi5m > 50 ? color.green : color.red, dashTextSize)

// --- PLOTS ---
plot(ema9, "EMA 9 (Fast)", { color: "#10B981", lineWidth: 2 })
plot(ema21, "EMA 21 (Slow)", { color: "#EF4444", lineWidth: 2 })
plot(vwapV, "VWAP", { color: "#F59E0B", lineWidth: 2 })

buyCond  = ta.crossover(ema9, ema21)
sellCond = ta.crossunder(ema9, ema21)
plotshape(buyCond, { title: "BUY Signal", text: "BUY", style: "arrowUp", location: "belowBar", color: "#10B981" })
plotshape(sellCond, { title: "SELL Signal", text: "SELL", style: "arrowDown", location: "aboveBar", color: "#EF4444" })
`,
  },
  {
    id: "dmsl-pro",
    name: "Dynamic Market Structure & Liquidity Engine PRO [DMSL]",
    nameVi: "Động Cơ Cấu Trúc Thị Trường & Thanh Khoản PRO (DMSL)",
    description: "Tự động phát hiện vùng Hỗ trợ/Kháng cự xác suất cao, điểm cân bằng 50% Equilibrium, Swing Dots và bảng HUD.",
    code: `//@version=6
indicator("Dynamic Market Structure & Liquidity Engine PRO [DMSL]", "DMSL Pro Ultra", overlay = true, max_boxes_count = 100, max_lines_count = 100, max_labels_count = 100, max_bars_back = 500)

g_str = "===== HIGH-PROBABILITY ZONE FILTER ====="
pivotLen     = input.int(10, "Structure Lookback (Pivot Length)", minval = 5, group = g_str)
minPowerFilter=input.float(4.0, "Min Zone Power Score (Filters Weak Zones)", minval = 1.0, maxval = 9.0, step = 0.5, group = g_str)
maxZones     = input.int(2, "Max Active Zones Per Side (Clean Chart)", minval = 1, maxval = 5, group = g_str)
atrLen       = input.int(14, "ATR Sensitivity Length", minval = 1, group = g_str)
zoneScale    = input.float(0.20, "Zone Height Multiplier (x ATR)", minval = 0.05, maxval = 0.5, step = 0.05, group = g_str)

g_swing = "===== MAJOR SWING DOTS (HH / HL / LH / LL) ====="
showSwingDots= input.bool(true, "Show Major Swing Dots", group = g_swing)
c_hh_dot     = input.color(#ff1744, "High Swing Dot Color (Red)", group = g_swing)
c_hl_dot     = input.color(#00e676, "Low Swing Dot Color (Green)", group = g_swing)

g_smc = "===== MARKET STRUCTURE (BOS & CHOCH) ====="
showSMC      = input.bool(true, "Show Clean BOS / CHoCH", group = g_smc)
c_bull_smc   = input.color(#00ffa8, "Bullish Structure Color", group = g_smc)
c_bear_smc   = input.color(#ff1744, "Bearish Structure Color", group = g_smc)

curAtr = ta.atr(atrLen)
pHi    = ta.pivothigh(high, pivotLen, pivotLen)
pLo    = ta.pivotlow(low, pivotLen, pivotLen)

// Major range 50% EQ
float majorHigh = ta.highest(high, 100)
float majorLow  = ta.lowest(low, 100)
float eqLevel   = (majorHigh + majorLow) / 2.0

plot(eqLevel, "Major 50% EQ Line", { color: "#00e5ff", lineWidth: 2 })

plotshape(showSwingDots and not na(pHi) ? pHi : na, title="High Swing Dot", style=shape.circle, location=location.absolute, color=c_hh_dot, size=size.small)
plotshape(showSwingDots and not na(pLo) ? pLo : na, title="Low Swing Dot", style=shape.circle, location=location.absolute, color=c_hl_dot, size=size.small)

var table hud = table.new(position = position.top_right, columns = 2, rows = 3, bgcolor = color.new(#151823, 10), border_color = color.new(color.gray, 60), border_width = 1)
table.cell(hud, 0, 0, "DMSL PRO", text_color = color.white, text_size = size.small)
table.cell(hud, 1, 0, "ULTRA", text_color = #00e676, text_size = size.small)
table.cell(hud, 0, 1, "Active Resistance", text_color = color.gray, text_size = size.small)
table.cell(hud, 1, 1, "2 Zones", text_color = #ff5252, text_size = size.small)
table.cell(hud, 0, 2, "Active Support", text_color = color.gray, text_size = size.small)
table.cell(hud, 1, 2, "2 Zones", text_color = #00e676, text_size = size.small)
`,
  },
  {
    id: "supertrend-macd",
    name: "SuperTrend + MACD Momentum Engine",
    nameVi: "Động Cơ Đột Phá SuperTrend & MACD (Pine v6)",
    description: "Xác định xu hướng bằng SuperTrend kết hợp động lượng phân kỳ MACD.",
    code: `//@version=6
indicator("SuperTrend + MACD Engine", overlay=true)

let st = ta.supertrend(3, 10)
let [m, s, hist] = ta.macd(close, 12, 26, 9)
let ema200 = ta.ema(close, 200)

plot(st.supertrend, "SuperTrend Line", { color: "#10B981", lineWidth: 2 })
plot(ema200, "EMA 200 Base Trend", { color: "#F59E0B", lineWidth: 2 })

let stBuy = ta.crossover(close, st.supertrend)
let stSell = ta.crossunder(close, st.supertrend)

plotshape(stBuy, { title: "SuperTrend BUY", text: "BUY ⚡", style: "arrowUp", location: "belowBar", color: "#10B981" })
plotshape(stSell, { title: "SuperTrend SELL", text: "SELL ⚡", style: "arrowDown", location: "aboveBar", color: "#EF4444" })

_dashTable = table.new("top_right", 2, 4)
table.cell(_dashTable, 0, 0, "TREND STATUS", color.black)
table.cell(_dashTable, 1, 0, close > st.supertrend ? "BULLISH TREND" : "BEARISH TREND", color.green)
table.cell(_dashTable, 0, 1, "MACD HISTOGRAM", color.black)
table.cell(_dashTable, 1, 1, hist.valueOf() > 0 ? "BULLISH MOMENTUM" : "BEARISH MOMENTUM", color.green)
`,
  },
];
