export type TradeType = "BUY" | "SELL";
export type TradeStatus = "PENDING" | "DONE" | "FAILED";
export type ReservedOrderType = "LIMIT" | "RESERVATION";
export type ReservedOrderStatus = "PENDING" | "EXECUTED" | "CANCELLED" | "FAILED";

export interface AccountResponse {
  id: string;
  userId: string;
  balance: number;
  totalInvestment: number;
}

export interface TradeBuyRequest {
  ticker: string;
  amount: number;
}

export interface TradeSellRequest {
  ticker: string;
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

export interface ReservedBuyOrderRequest {
  ticker: string;
  orderType: ReservedOrderType;
  targetPrice?: number;
  amount: number;
}

export interface ReservedSellOrderRequest {
  ticker: string;
  orderType: ReservedOrderType;
  targetPrice?: number;
  quantity: number;
}

export interface ReservedOrderResponse {
  id: string;
  ticker: string;
  orderType: ReservedOrderType;
  tradeType: TradeType;
  targetPrice: number | null;
  amount: number | null;
  quantity: number | null;
  status: ReservedOrderStatus;
  createdAt: string;
}
