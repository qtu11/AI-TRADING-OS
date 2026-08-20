import { APP_CONFIG } from "@/config/app.config";
import { PositionCalculationInput, PositionCalculationResult } from "@/types/risk.types";

export function getInstrumentSpec(symbol: string) {
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const found = APP_CONFIG.instruments.find(
    (inst) => inst.symbol.toUpperCase() === cleanSymbol
  );

  if (found) return found;

  // Defaults
  if (cleanSymbol.includes("JPY")) {
    return { symbol: cleanSymbol, name: cleanSymbol, type: "forex", pipSize: 0.01, defaultLotUnit: 100000 };
  }
  if (cleanSymbol.includes("XAU") || cleanSymbol.includes("GOLD")) {
    return { symbol: cleanSymbol, name: "Gold", type: "metal", pipSize: 0.01, defaultLotUnit: 100 };
  }
  if (cleanSymbol.includes("BTC") || cleanSymbol.includes("ETH")) {
    return { symbol: cleanSymbol, name: cleanSymbol, type: "crypto", pipSize: 1.0, defaultLotUnit: 1 };
  }
  if (cleanSymbol.includes("30") || cleanSymbol.includes("100") || cleanSymbol.includes("500")) {
    return { symbol: cleanSymbol, name: cleanSymbol, type: "index", pipSize: 1.0, defaultLotUnit: 1 };
  }

  return { symbol: cleanSymbol, name: cleanSymbol, type: "forex", pipSize: 0.0001, defaultLotUnit: 100000 };
}

export function calculatePositionSize(
  input: PositionCalculationInput
): PositionCalculationResult {
  const { accountBalance, riskPercent, entryPrice, stopLossPrice, takeProfitPrice, symbol } = input;

  if (!accountBalance || accountBalance <= 0) {
    return {
      riskAmount: 0,
      positionSizeLots: 0,
      positionUnits: 0,
      stopLossPips: 0,
      potentialLoss: 0,
      isValid: false,
      errorMessage: "Account balance must be greater than 0.",
    };
  }

  if (!riskPercent || riskPercent <= 0 || riskPercent > 100) {
    return {
      riskAmount: 0,
      positionSizeLots: 0,
      positionUnits: 0,
      stopLossPips: 0,
      potentialLoss: 0,
      isValid: false,
      errorMessage: "Risk percentage must be between 0.01% and 100%.",
    };
  }

  if (!entryPrice || !stopLossPrice || entryPrice === stopLossPrice) {
    return {
      riskAmount: 0,
      positionSizeLots: 0,
      positionUnits: 0,
      stopLossPips: 0,
      potentialLoss: 0,
      isValid: false,
      errorMessage: "Entry price and Stop Loss must be valid non-identical numbers.",
    };
  }

  const spec = getInstrumentSpec(symbol);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const stopLossPips = Number((priceDistance / spec.pipSize).toFixed(1));

  if (stopLossPips <= 0) {
    return {
      riskAmount: 0,
      positionSizeLots: 0,
      positionUnits: 0,
      stopLossPips: 0,
      potentialLoss: 0,
      isValid: false,
      errorMessage: "Stop loss distance is too small.",
    };
  }

  const riskAmount = Number(((accountBalance * riskPercent) / 100).toFixed(2));

  // Pip value for standard 1.0 lot in quote currency:
  // For standard Forex 100,000 units: 1 pip = pipSize * 100,000 (e.g. 0.0001 * 100000 = $10)
  // For Gold 100 oz: 1 pip (0.01) * 100 = $1.00 ($1 per 0.01 movement, or $10 per $0.10)
  const pipValuePerLot = spec.pipSize * spec.defaultLotUnit;

  // Total loss for 1 standard lot = stopLossPips * pipValuePerLot
  const lossPerLot = stopLossPips * pipValuePerLot;

  let positionSizeLots = 0;
  if (lossPerLot > 0) {
    positionSizeLots = Number((riskAmount / lossPerLot).toFixed(2));
  }

  // Enforce minimum step (e.g. 0.01 micro lot)
  const finalLots = Math.max(0.01, positionSizeLots);
  const positionUnits = Math.round(finalLots * spec.defaultLotUnit);
  const potentialLoss = Number((finalLots * lossPerLot).toFixed(2));

  let takeProfitPips: number | undefined;
  let potentialProfit: number | undefined;
  let riskRewardRatio: number | undefined;

  if (takeProfitPrice && takeProfitPrice !== entryPrice) {
    const tpDistance = Math.abs(takeProfitPrice - entryPrice);
    takeProfitPips = Number((tpDistance / spec.pipSize).toFixed(1));
    const profitPerLot = takeProfitPips * pipValuePerLot;
    potentialProfit = Number((finalLots * profitPerLot).toFixed(2));
    
    if (stopLossPips > 0) {
      riskRewardRatio = Number((takeProfitPips / stopLossPips).toFixed(2));
    }
  }

  return {
    riskAmount,
    positionSizeLots: finalLots,
    positionUnits,
    stopLossPips,
    takeProfitPips,
    potentialLoss,
    potentialProfit,
    riskRewardRatio,
    isValid: true,
  };
}
