export type TradeType = "BUY" | "SELL";
export type TradeStatus = "COMPLETED" | "FAILED" | "PENDING";

export interface AccountResponse {
  id: string;
  userId: string;
  balance: number;
  totalInvestment: number;
}

export interface TradeBuyRequest {
  ticker: string;
  price: number;
  quantity: number;
}

export interface TradeSellRequest {
  ticker: string;
  price: number;
  quantity: number;
}

export interface TradeResponse {
  id: string;
  ticker: string;
  tradeType: TradeType;
  quantity: number;
  price: number;
  totalAmount: number;
  profitAmount: number;
  profitRate: number;
  status: TradeStatus;
  createdAt: string;
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  totalAmount: number;
}
