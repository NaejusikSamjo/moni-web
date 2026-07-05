export interface CompanyIssueResponse {
  ticker: string;
  company_name: string;
  summary: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  analyzedAt: string;
}

export interface WatchCompanyResponse {
  ticker: string;
  company_name: string;
}

export interface MarketAnalysisResponse {
  summary: string;
}

export type MarketKeyword =
  | "코스피" | "나스닥" | "달러" | "금리" | "반도체"
  | "AI 투자" | "연준" | "유가" | "인플레이션" | "전쟁";

export const MARKET_KEYWORDS: { value: MarketKeyword; label: string }[] = [
  { value: "코스피",    label: "코스피" },
  { value: "나스닥",    label: "나스닥" },
  { value: "달러",     label: "달러" },
  { value: "금리",     label: "금리" },
  { value: "반도체",   label: "반도체" },
  { value: "AI 투자",  label: "AI 투자" },
  { value: "연준",     label: "연준" },
  { value: "유가",     label: "유가" },
  { value: "인플레이션", label: "인플레이션" },
  { value: "전쟁",     label: "전쟁" },
];
