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

export interface AlternativesResponse {
  asin: string;
  alternatives: AlternativeProduct[];
}

export type SignalColor = 'green' | 'yellow' | 'red';

export interface PriceEvaluation {
  color: SignalColor;
  label: string;
  explanation: string;
  savingsPct: number | null;
  vsAlternativesPct: number | null;
}

export type AppState = 'input' | 'loading' | 'result' | 'error';

export type LoadingStep = 'fetching-product' | 'fetching-alternatives';
