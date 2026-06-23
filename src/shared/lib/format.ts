export function formatPrice(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function formatChangeRate(rate: number): string {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(2)}%`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return "var(--color-up)";
  if (value < 0) return "var(--color-down)";
  return "var(--color-neutral)";
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return String(volume);
}
