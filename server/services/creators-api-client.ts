import {
  ApiClient,
  GetItemsRequestContent,
  GetItemsResource,
  SearchItemsRequestContent,
  SearchItemsResource,
  TypedDefaultApi,
} from 'amazon-creators-api';
import type { Item, Money } from 'amazon-creators-api';
import { config } from '../config.js';

const apiClient = new ApiClient();
apiClient.credentialId = config.creatorsApi.credentialId;
apiClient.credentialSecret = config.creatorsApi.credentialSecret;
apiClient.version = config.creatorsApi.credentialVersion;

const api = new TypedDefaultApi(apiClient);

const marketplace = config.creatorsApi.marketplace;
const partnerTag = config.creatorsApi.partnerTag;

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ProductData {
  asin: string;
  title: string;
  imageUrl: string | null;
  detailPageUrl: string;
  price: { amount: number; currency: string; displayAmount: string } | null;
  listPrice: { amount: number; currency: string; displayAmount: string } | null;
  savingsPercentage: number | null;
  savingsAmount: { amount: number; currency: string; displayAmount: string } | null;
  reviewRating: number | null;
  reviewCount: number | null;
  browseNodeId: string | null;
  browseNodeName: string | null;
}

export interface SearchAlternativesParams {
  browseNodeId?: string;
  keywords: string;
  maxPrice?: number;
  excludeAsin?: string;
}

// ---------------------------------------------------------------------------
// GetItems resources
// ---------------------------------------------------------------------------

const GET_ITEMS_RESOURCES = [
  'itemInfo.title',
  'images.primary.large',
  'offersV2.listings.price',
  'customerReviews.count',
  'customerReviews.starRating',
  'browseNodeInfo.browseNodes',
].map((r) => GetItemsResource.constructFromObject(r));

// ---------------------------------------------------------------------------
// SearchItems resources (same data for each alternative)
// ---------------------------------------------------------------------------

const SEARCH_ITEMS_RESOURCES = [
  'itemInfo.title',
  'images.primary.large',
  'offersV2.listings.price',
  'customerReviews.count',
  'customerReviews.starRating',
].map((r) => SearchItemsResource.constructFromObject(r));

// ---------------------------------------------------------------------------
// Helpers — The Amazon Creators API SDK exports loosely-typed models with
// deeply nested optional properties. We deliberately use `any` here at the
// system boundary and map into our own strongly-typed ProductData.
// ---------------------------------------------------------------------------

function parseMoney(
  money: Money | undefined,
): { amount: number; currency: string; displayAmount: string } | null {
  if (!money) return null;
  return {
    amount: money.amount,
    currency: money.currency,
    displayAmount: money.displayAmount,
  };
}

function parseItem(item: Item): ProductData {
  const listing = item.offersV2?.listings?.[0];
  const price = listing?.price?.money;
  const savingBasis = listing?.price?.savingBasis?.money;
  const savings = listing?.price?.savings;
  const firstNode = item.browseNodeInfo?.browseNodes?.[0];

  return {
    asin: item.asin,
    title: item.itemInfo?.title?.displayValue ?? '',
    imageUrl: item.images?.primary?.large?.url ?? null,
    detailPageUrl: item.detailPageURL ?? '',
    price: parseMoney(price),
    listPrice: parseMoney(savingBasis),
    savingsPercentage: savings?.percentage ?? null,
    savingsAmount: parseMoney(savings?.money),
    reviewRating: item.customerReviews?.starRating?.value ?? null,
    reviewCount: item.customerReviews?.count ?? null,
    browseNodeId: firstNode?.id ?? null,
    browseNodeName: firstNode?.displayName ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getItem(asin: string): Promise<ProductData> {
  const request = new GetItemsRequestContent(partnerTag, [asin]);
  request.resources = GET_ITEMS_RESOURCES;

  const response = await api.getItems(marketplace, request);

  const items = response.itemsResult?.items;
  const firstItem = items?.[0];
  if (!firstItem) {
    const errorMsg = response.errors?.[0]?.message ?? 'Prodotto non trovato';
    throw new CreatorsApiError(errorMsg, 'ITEM_NOT_FOUND');
  }

  return parseItem(firstItem);
}

export async function searchAlternatives(params: SearchAlternativesParams): Promise<ProductData[]> {
  const request = new SearchItemsRequestContent();
  request.partnerTag = partnerTag;
  request.keywords = params.keywords;
  request.itemCount = 10;
  request.resources = SEARCH_ITEMS_RESOURCES;

  if (params.browseNodeId) {
    request.browseNodeId = params.browseNodeId;
  }
  if (params.maxPrice !== undefined) {
    // Amazon Creators API expects price in cents (lowest denomination)
    request.maxPrice = Math.round(params.maxPrice * 100);
  }

  const response = await api.searchItems(marketplace, request);

  const items = response.searchResult?.items ?? [];

  return items
    .map(parseItem)
    .filter((p) => p.asin !== params.excludeAsin)
    .filter((p) => p.price !== null);
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class CreatorsApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'CreatorsApiError';
    this.code = code;
  }
}
