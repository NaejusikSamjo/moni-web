export interface PortfolioCreateResponse {
  portfolioId: string;
  userId: string;
}

export interface PortfolioAssetResponse {
  totalAsset: number;
  cashBalance: number;
  stockEvaluationAmount: number;
  principalAmount: number;
  totalProfitLoss: number;
  totalReturnRate: number;
}

export interface PortfolioHoldingItem {
  ticker: string;
  stockName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitLoss: number;
  profitRate: number;
  weight: number;
}

export interface PortfolioHoldingsResponse {
  stockProfitLoss: number;
  stockReturnRate: number;
  content: PortfolioHoldingItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}

export type AnalysisStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PortfolioAnalysisCreateResponse {
  analysisId: string;
  status: AnalysisStatus;
}

export interface PortfolioAnalysisResponse {
  analysisId: string;
  status: AnalysisStatus;
  totalReturnRate: number | null;
  totalEvaluationAmount: number | null;
  summary: string | null;
  concentrationScore: number | null;
  concentrationThreshold: number | null;
  errorMessage: string | null;
  analyzedAt: string | null;
}
