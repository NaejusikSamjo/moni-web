import { apiRequest } from "@/shared/api/instance";
import type { PageRes } from "@/shared/api/types";
import type {
  StockResponse,
  StockChartResponse,
  ChartIndex,
  ThemeRankingResponse,
  TopVolumeResponse,
} from "@/entities/stock/model/types";

export const stockApi = {
  getStockList: (keyword = "", page = 0, size = 20): Promise<PageRes<StockResponse>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (keyword) params.set("keyword", keyword);
    return apiRequest(`/api/v1/stocks/search?${params.toString()}`);
  },

  getStockDetail: (ticker: string): Promise<StockResponse> =>
    apiRequest(`/api/v1/stocks/${ticker}`),

  getChart: (ticker: string, index: ChartIndex = "MIN_1"): Promise<StockChartResponse> =>
    apiRequest(`/api/v1/stocks/${ticker}/chart?index=${index}`),

  getThemes: (): Promise<ThemeRankingResponse[]> =>
    apiRequest("/api/v1/stocks/themes"),

  getTopVolume: (): Promise<TopVolumeResponse> =>
    apiRequest("/api/v1/stocks/top-volume"),
};
