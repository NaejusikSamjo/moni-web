import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type { CompanyIssueResponse } from "@/entities/ai/model/types";

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
};
