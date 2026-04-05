export type AnalysisResult = {
  overview: Record<string, unknown>;
  positioning: Record<string, unknown>;
  pricing: Record<string, unknown>;
  growth: Record<string, unknown>;
  product: Record<string, unknown>;
  weaknesses: string[];
  opportunities: string[];
  competitors: string[];
  insight: string;
};

export type AnalyzeResponse = {
  reportId: string | null;
  companyName: string;
  website: string | null;
  mode: "roast" | "standard";
  scrapedSummary: {
    title: string;
    headingsCount: number;
    contentLength: number;
  };
  result: AnalysisResult;
};
