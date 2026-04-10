export interface PriceInfo {
  amount: number;
  currency: string;
  displayAmount: string;
}

export interface ProductResponse {
  asin: string;
  title: string;
  imageUrl: string | null;
  detailPageUrl: string;
  price: PriceInfo | null;
  listPrice: PriceInfo | null;
  savingsPercentage: number | null;
  savingsAmount: PriceInfo | null;
  reviewRating: number | null;
  reviewCount: number | null;
  browseNodeId: string | null;
  browseNodeName: string | null;
  keywords: string;
  affiliateUrl: string;
}

export interface AlternativeProduct {
  asin: string;
  title: string;
  imageUrl: string | null;
  detailPageUrl: string;
  price: PriceInfo | null;
  listPrice: PriceInfo | null;
  savingsPercentage: number | null;
  savingsAmount: PriceInfo | null;
  reviewRating: number | null;
  reviewCount: number | null;
  browseNodeId: string | null;
  browseNodeName: string | null;
  score: number;
  affiliateUrl: string;
}

export type AlternativeTier = 'cheaper' | 'similar' | 'higher';

export interface CategorizedAlternatives {
  cheaper: AlternativeProduct[];
  similar: AlternativeProduct[];
  higher: AlternativeProduct[];
}

export interface AlternativesResponse {
  asin: string;
  alternatives: AlternativeProduct[];
  categorized?: CategorizedAlternatives;
}

export type SignalColor = 'green' | 'yellow' | 'red';

export interface PriceBars {
  currentPrice: { amount: number; displayAmount: string } | null;
  averageAlternativePrice: { amount: number; displayAmount: string } | null;
  cheapestAlternativePrice: { amount: number; displayAmount: string } | null;
}

export interface PriceEvaluation {
  color: SignalColor;
  label: string;
  explanation: string;
  savingsPct: number | null;
  vsAlternativesPct: number | null;
  priceBars: PriceBars | null;
}

export type AppState = 'input' | 'loading' | 'result' | 'error';

export type LoadingStep = 'resolving-link' | 'fetching-product' | 'fetching-alternatives';
