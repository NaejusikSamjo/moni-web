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
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitLoss: number;
  profitRate: number;
  weight: number;
}

export interface PortfolioHoldingsResponse {
  content: PortfolioHoldingItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}
