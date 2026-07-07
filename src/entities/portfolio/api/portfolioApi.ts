import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type { PageRes } from "@/shared/api/types";
import type {
  PortfolioCreateResponse,
  PortfolioAssetResponse,
  PortfolioHoldingsResponse,
  PortfolioAnalysisCreateResponse,
  PortfolioAnalysisResponse,
} from "@/entities/portfolio/model/types";

export const portfolioApi = {
  createPortfolio: (): Promise<PortfolioCreateResponse> =>
    apiRequest("/api/v1/portfolio", { method: "POST" }),

  getAssets: async (): Promise<PortfolioAssetResponse | null> => {
    try {
      return await apiRequest<PortfolioAssetResponse>("/api/v1/assets");
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  getHoldings: (page = 0, size = 10): Promise<PortfolioHoldingsResponse> =>
    apiRequest(`/api/v1/assets/holdings?page=${page}&size=${size}`),

  requestAnalysis: (): Promise<PortfolioAnalysisCreateResponse> =>
    apiRequest("/api/v1/portfolio/ai-analysis", { method: "POST" }),

  getLatestAnalysis: async (): Promise<PortfolioAnalysisResponse | null> => {
    try {
      return await apiRequest<PortfolioAnalysisResponse>(
        "/api/v1/portfolio/ai-analysis/latest",
      );
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  getAnalyses: (page = 0, size = 20): Promise<PageRes<PortfolioAnalysisResponse>> =>
    apiRequest(`/api/v1/portfolio/ai-analysis?page=${page}&size=${size}`),
};
