export { formatDateTime, formatDateOnly } from "./date";

export function formatCurrency(
  amount: number | undefined | null,
  currency = "USD",
  showPlusSign = false
): string {
  const val = Number(amount ?? 0);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

  if (showPlusSign && val > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatPercent(
  val: number | undefined | null,
  decimals = 1,
  showPlusSign = false
): string {
  const num = Number(val ?? 0);
  const formatted = `${num.toFixed(decimals)}%`;
  if (showPlusSign && num > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatNumber(val: number | undefined | null, decimals = 2): string {
  return Number(val ?? 0).toFixed(decimals);
}
