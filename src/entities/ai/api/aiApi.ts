import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type { PageRes } from "@/shared/api/types";
import type {
  CompanyIssueResponse,
  WatchCompanyResponse,
  MarketAnalysisResponse,
  MarketKeyword,
  NewsResponse,
  NewsSearchParams,
} from "@/entities/ai/model/types";

export const aiApi = {
  getIssueAnalysis: async (ticker: string): Promise<CompanyIssueResponse | null> => {
    try {
      return await apiRequest<CompanyIssueResponse>(`/api/v1/ai/${ticker}/issue-analysis`);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  createIssueAnalysis: (ticker: string): Promise<CompanyIssueResponse> =>
    apiRequest(`/api/v1/ai/${ticker}/issue-analysis`, { method: "POST" }),

  getWatchCompanies: (): Promise<WatchCompanyResponse[]> =>
    apiRequest("/api/v1/ai"),

  createMarketAnalysis: (keyword: MarketKeyword): Promise<MarketAnalysisResponse> =>
    apiRequest(`/api/v1/ai/news-summary?keyword=${encodeURIComponent(keyword)}`, { method: "POST" }),

  getNewsList: (params?: NewsSearchParams): Promise<PageRes<NewsResponse>> => {
    const query = new URLSearchParams();
    if (params?.ticker) query.set("ticker", params.ticker);
    if (params?.companyName) query.set("companyName", params.companyName);
    if (params?.keyword) query.set("keyword", params.keyword);
    if (params?.date) query.set("date", params.date);
    const qs = query.toString();
    return apiRequest(`/api/v1/ai/news${qs ? `?${qs}` : ""}`);
  },
};
