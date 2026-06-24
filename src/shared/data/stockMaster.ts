import stocksData from "./stocks.json";

export type StockMarket = "KOSPI" | "KOSDAQ";

export interface StockInfo {
  code: string;
  name: string;
  market: StockMarket;
}

const stocks: StockInfo[] = [
  ...stocksData.kospi.map((s) => ({ ...s, market: "KOSPI" as const })),
  ...stocksData.kosdaq.map((s) => ({ ...s, market: "KOSDAQ" as const })),
];

const stockMap = new Map(stocks.map((s) => [s.code, s]));

export const getStockInfo = (code: string): StockInfo | undefined =>
  stockMap.get(code);

export const getStockName = (code: string): string =>
  stockMap.get(code)?.name ?? code;

export const getAllStocks = (): StockInfo[] => stocks;
