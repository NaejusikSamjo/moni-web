import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type {
  PortfolioCreateResponse,
  PortfolioAssetResponse,
  PortfolioHoldingsResponse,
} from "@/entities/portfolio/model/types";

export const portfolioApi = {
  createPortfolio: (): Promise<PortfolioCreateResponse> =>
    apiRequest("/api/v1/portfolio", { method: "POST" }),

  getAssets: async (): Promise<PortfolioAssetResponse | null> => {
    try {
      return await apiRequest<PortfolioAssetResponse>("/api/v1/portfolio/assets");
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  getHoldings: (page = 0, size = 10): Promise<PortfolioHoldingsResponse> =>
    apiRequest(`/api/v1/portfolio/holdings?page=${page}&size=${size}`),
};
