export type ScrapedContent = {
  title: string;
  description: string;
  content: string;
  headings: string[];
  pricingHints: string[];
  features: string[];
};

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
