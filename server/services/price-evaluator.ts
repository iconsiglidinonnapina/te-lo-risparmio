import type { ProductData } from './creators-api-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Savings percentage considered a meaningful discount */
const SAVINGS_GOOD = 20;
/** Savings percentage considered a small discount */
const SAVINGS_SOME = 5;

/** Product is significantly cheaper than alternatives */
const ALT_MUCH_CHEAPER = 15;
/** Product is notably more expensive than alternatives */
const ALT_EXPENSIVE = 10;
/** Product is much more expensive than alternatives */
const ALT_VERY_EXPENSIVE = 20;

// ---------------------------------------------------------------------------
// Decision tree
// ---------------------------------------------------------------------------

function decide(savingsPct: number | null, vsAltPct: number | null): SignalColor {
  const hasSavings = savingsPct !== null && savingsPct >= SAVINGS_GOOD;
  const hasSomeSavings = savingsPct !== null && savingsPct >= SAVINGS_SOME;
  const noSavings = savingsPct === null || savingsPct < SAVINGS_SOME;

  // GREEN: good discount + not more expensive than alternatives
  //    OR: significantly cheaper than alternatives regardless of discount
  if (hasSavings && (vsAltPct === null || vsAltPct >= 0)) return 'green';
  if (vsAltPct !== null && vsAltPct >= ALT_MUCH_CHEAPER) return 'green';
  if (hasSomeSavings && vsAltPct === null) return 'green';

  // RED: no meaningful discount + clearly more expensive than alternatives
  if (noSavings && vsAltPct !== null && vsAltPct <= -ALT_EXPENSIVE) return 'red';
  if (!hasSomeSavings && vsAltPct !== null && vsAltPct <= -ALT_VERY_EXPENSIVE) return 'red';

  // YELLOW: everything else
  return 'yellow';
}

// ---------------------------------------------------------------------------
// Labels and explanations
// ---------------------------------------------------------------------------

const LABELS: Record<SignalColor, string> = {
  green: 'Ottimo prezzo',
  yellow: 'Prezzo nella media',
  red: 'Prezzo alto',
};

function buildExplanation(savingsPct: number | null, vsAltPct: number | null): string {
  const parts: string[] = [];

  if (savingsPct !== null) {
    if (savingsPct >= SAVINGS_GOOD) {
      parts.push(`Sconto del ${savingsPct}% rispetto al prezzo di listino`);
    } else if (savingsPct >= SAVINGS_SOME) {
      parts.push(`Sconto del ${savingsPct}% rispetto al listino`);
    } else if (savingsPct > 0) {
      parts.push(`Sconto minimo del ${savingsPct}%`);
    } else {
      parts.push('Nessuno sconto rispetto al prezzo di listino');
    }
  }

  if (vsAltPct !== null) {
    if (vsAltPct > 0) {
      parts.push(`${Math.round(vsAltPct)}% più economico delle alternative`);
    } else if (vsAltPct === 0) {
      parts.push('Prezzo in linea con le alternative');
    } else {
      parts.push(`${Math.round(Math.abs(vsAltPct))}% più caro delle alternative`);
    }
  }

  if (parts.length === 0) {
    return 'Prezzo pieno — nessun dato di confronto';
  }

  return parts.join('. ');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluates whether a product's price is good, average, or high using two
 * primary signals: discount from list price and comparison with alternatives.
 *
 * Decision tree (from ANALYSIS.md):
 *  GREEN  → discount ≥ 20% AND (no alts OR cheaper/equal to alts)
 *           OR significantly cheaper than alternatives (≥ 15%)
 *           OR discount ≥ 5% with no alternatives to compare
 *  RED    → no/low discount AND notably more expensive than alternatives (≥ 10%)
 *  YELLOW → everything else
 */
export function evaluatePrice(
  product: ProductData,
  alternatives: Pick<ProductData, 'price'>[],
): PriceEvaluation {
  const savingsPct = product.savingsPercentage;

  // Compute how the product compares to alternatives (positive = cheaper)
  let vsAltPct: number | null = null;
  let avgAltPrice: number | null = null;
  let cheapestAltPrice: number | null = null;

  if (product.price && alternatives.length > 0) {
    const altPrices = alternatives
      .map((a) => a.price?.amount)
      .filter((p): p is number => p !== undefined && p !== null);

    if (altPrices.length > 0) {
      avgAltPrice = altPrices.reduce((sum, p) => sum + p, 0) / altPrices.length;
      cheapestAltPrice = Math.min(...altPrices);
      vsAltPct =
        avgAltPrice > 0 ? ((avgAltPrice - product.price.amount) / avgAltPrice) * 100 : null;
    }
  }

  const color = decide(savingsPct, vsAltPct);

  // Build priceBars if we have the necessary data
  let priceBars = null;
  if (product.price) {
    priceBars = {
      currentPrice: {
        amount: product.price.amount,
        displayAmount: product.price.displayAmount,
      },
      averageAlternativePrice:
        avgAltPrice !== null
          ? {
              amount: avgAltPrice,
              displayAmount: new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: product.price.currency,
              }).format(avgAltPrice),
            }
          : null,
      cheapestAlternativePrice:
        cheapestAltPrice !== null
          ? {
              amount: cheapestAltPrice,
              displayAmount: new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: product.price.currency,
              }).format(cheapestAltPrice),
            }
          : null,
    };
  }

  return {
    color,
    label: LABELS[color],
    explanation: buildExplanation(savingsPct, vsAltPct),
    savingsPct,
    vsAlternativesPct: vsAltPct !== null ? Math.round(vsAltPct * 100) / 100 : null,
    priceBars,
  };
}
