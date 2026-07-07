const KO_FORMAT = new Intl.NumberFormat("ko-KR");

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return KO_FORMAT.format(value) + "원";
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return KO_FORMAT.format(value);
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
