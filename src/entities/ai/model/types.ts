export interface CompanyIssueResponse {
  ticker: string;
  company_name: string;
  summary: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  analyzedAt: string;
}

export interface IssueAnalysisRequest {
  ticker: string;
}
