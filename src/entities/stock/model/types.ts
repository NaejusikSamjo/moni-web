export type ChartIndex = "MIN_1" | "MIN_3" | "MIN_5" | "MIN_10" | "MIN_30" | "MIN_60";

export interface StockResponse {
  ticker: string;
  name: string;
  price: number | null;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockChartResponse {
  type: string;
  candles: CandleData[];
}

export interface ThemeRankingResponse {
  themeCode: string;
  themeName: string;
  currentIndex: string;
  changeRate: string;
  volume: number;
}

export interface TopVolumeStockItem {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  volume: number;
}

export interface TopVolumeResponse {
  stocks: TopVolumeStockItem[];
}
