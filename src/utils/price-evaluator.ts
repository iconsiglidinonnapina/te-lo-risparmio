import type {
  PriceInfo,
  PriceEvaluation,
  SignalColor,
  CategorizedAlternatives,
} from '@/types/analysis';

// ── Signal 1: Discount from list price ──────────────────────────────
// A large discount is a strong positive signal. No discount at all
// (or negligible <5 %) is mildly negative because it means the product
// is essentially at full price.  A missing list price (null) is neutral
// because we simply have no data.
function scoreSavings(pct: number | null): number {
  if (pct === null) return 0;
  if (pct >= 30) return 3;
  if (pct >= 20) return 2;
  if (pct >= 10) return 1;
  if (pct >= 5) return 0.5;
  return -0.5;
}

// ── Signal 2: Price vs average alternatives ─────────────────────────
// Positive vsAltPct means the product is cheaper than the alternatives
// average; negative means more expensive.  The scale is asymmetric on
// purpose: being expensive hurts more than being cheap helps, because
// "cheap vs alternatives" could simply mean lower-tier products.
function scoreAlternatives(pct: number | null): number {
  if (pct === null) return 0;
  if (pct >= 25) return 4;
  if (pct >= 15) return 3;
  if (pct >= 5) return 2;
  if (pct > -5) return 0; // within ±5 %
  if (pct > -15) return -2;
  if (pct > -30) return -3;
  return -4;
}

// ── Signal 3: Price vs cheapest alternative ─────────────────────────
// Small bonus when the product beats the cheapest alternative found;
// small penalty when it costs more than double.
function scoreCheapest(productPrice: number, cheapest: number | null): number {
  if (cheapest === null || cheapest <= 0) return 0;
  if (productPrice <= cheapest) return 0.5;
  if (productPrice > cheapest * 2) return -0.5;
  return 0;
}

// ── Signal 4: Tier composition ──────────────────────────────────────
// Rewards products that are cheaper than most alternatives in the same
// category and penalises when many cheaper alternatives with decent
// reviews exist.
function scoreTierComposition(categorized: CategorizedAlternatives | null | undefined): number {
  if (!categorized) return 0;
  const { cheaper, similar, higher } = categorized;
  const total = cheaper.length + similar.length + higher.length;
  if (total === 0) return 0;

  let score = 0;

  // Bonus when the product is priced below many alternatives
  if (higher.length > 0) {
    const higherRatio = higher.length / total;
    if (higherRatio >= 0.5) score += 1.5;
    else if (higherRatio >= 0.3) score += 0.75;
  }

  // Penalty when many cheaper alternatives with good reviews exist
  const goodCheap = cheaper.filter((a) => a.reviewRating !== null && a.reviewRating >= 4);
  if (goodCheap.length >= 3) score -= 1.5;
  else if (goodCheap.length >= 1) score -= 0.5;

  // Small bonus when there are no cheaper alternatives at all
  if (cheaper.length === 0 && total >= 2) score += 0.5;

  return score;
}

// ── Composite decision ──────────────────────────────────────────────
const GREEN_THRESHOLD = 2;
const RED_THRESHOLD = -2;

// Standalone thresholds (only one signal available)
const SOLO_DISCOUNT_GREEN = 25;
const SOLO_ALT_GREEN = 15;
const SOLO_ALT_RED = -10;

function decide(
  savingsPct: number | null,
  vsAltPct: number | null,
  productPrice: number | null,
  cheapestAltPrice: number | null,
  categorized?: CategorizedAlternatives | null,
): SignalColor {
  const hasDiscount = savingsPct !== null;
  const hasAlt = vsAltPct !== null;

  // ── Both signals available → combined score ──
  if (hasDiscount && hasAlt) {
    let score = scoreSavings(savingsPct) + scoreAlternatives(vsAltPct);
    if (productPrice !== null) {
      score += scoreCheapest(productPrice, cheapestAltPrice);
    }
    score += scoreTierComposition(categorized);
    if (score >= GREEN_THRESHOLD) return 'green';
    if (score <= RED_THRESHOLD) return 'red';
    return 'yellow';
  }

  // ── Only discount (no alternatives found) ──
  if (hasDiscount) {
    // Without alternatives we can't confidently say RED.
    return savingsPct >= SOLO_DISCOUNT_GREEN ? 'green' : 'yellow';
  }

  // ── Only alternatives (no list-price info) ──
  if (hasAlt) {
    if (vsAltPct >= SOLO_ALT_GREEN) return 'green';
    if (vsAltPct <= SOLO_ALT_RED) return 'red';
    return 'yellow';
  }

  // ── No data at all ──
  return 'yellow';
}

// ── Labels ──────────────────────────────────────────────────────────
const LABELS: Record<SignalColor, string> = {
  green: 'Ottimo prezzo',
  yellow: 'Prezzo nella media',
  red: 'Prezzo alto',
};

// ── Human-readable explanation ──────────────────────────────────────
function buildExplanation(
  savingsPct: number | null,
  vsAltPct: number | null,
  productPrice: number | null,
  cheapestAltPrice: number | null,
  categorized?: CategorizedAlternatives | null,
): string {
  const parts: string[] = [];

  // Discount description
  if (savingsPct !== null) {
    if (savingsPct >= 30) {
      parts.push(`Ottimo sconto del ${savingsPct}% rispetto al prezzo di listino`);
    } else if (savingsPct >= 20) {
      parts.push(`Buon sconto del ${savingsPct}% rispetto al prezzo di listino`);
    } else if (savingsPct >= 10) {
      parts.push(`Sconto del ${savingsPct}% rispetto al listino`);
    } else if (savingsPct >= 5) {
      parts.push(`Sconto contenuto del ${savingsPct}% rispetto al listino`);
    } else if (savingsPct > 0) {
      parts.push(`Sconto minimo del ${savingsPct}%`);
    } else {
      parts.push('Nessuno sconto rispetto al prezzo di listino');
    }
  }

  // vs average alternatives
  if (vsAltPct !== null) {
    const rounded = Math.round(Math.abs(vsAltPct));
    if (rounded === 0) {
      parts.push('Prezzo in linea con le alternative');
    } else if (vsAltPct >= 25) {
      parts.push(`${rounded}% più economico della media delle alternative`);
    } else if (vsAltPct > 0) {
      parts.push(`${rounded}% più economico delle alternative`);
    } else if (Math.abs(vsAltPct) >= 30) {
      parts.push(`Nettamente più caro delle alternative (${rounded}%)`);
    } else {
      parts.push(`${rounded}% più caro delle alternative`);
    }
  }

  // Cheapest alternative note
  if (productPrice !== null && cheapestAltPrice !== null && cheapestAltPrice > 0) {
    if (productPrice <= cheapestAltPrice) {
      parts.push('È il prezzo più basso tra tutte le alternative trovate');
    } else if (productPrice > cheapestAltPrice * 2) {
      parts.push("Costa più del doppio dell'alternativa più economica");
    }
  }

  // Tier-based contextual notes
  if (categorized) {
    const { cheaper, similar, higher } = categorized;
    const goodCheap = cheaper.filter((a) => a.reviewRating !== null && a.reviewRating >= 4);
    if (goodCheap.length >= 3) {
      parts.push(`Esistono ${goodCheap.length} alternative più economiche con ottime recensioni`);
    } else if (goodCheap.length >= 1) {
      parts.push(
        `${goodCheap.length === 1 ? 'Esiste 1 alternativa più economica' : `Esistono ${goodCheap.length} alternative più economiche`} con buone recensioni`,
      );
    } else if (cheaper.length === 0 && similar.length + higher.length >= 2) {
      parts.push('Nessuna alternativa significativamente più economica trovata');
    }

    if (similar.length > 0) {
      parts.push(
        `Prezzo in linea con ${similar.length} ${similar.length === 1 ? 'prodotto comparabile' : 'prodotti comparabili'}`,
      );
    }

    if (higher.length > 0) {
      const total = cheaper.length + similar.length + higher.length;
      if (higher.length / total >= 0.5) {
        parts.push('Costa meno della maggior parte dei prodotti nella categoria');
      }
    }
  }

  if (parts.length === 0) {
    return 'Prezzo pieno — nessun dato di confronto disponibile';
  }

  return parts.join('. ');
}

export function evaluatePrice(
  product: {
    price: PriceInfo | null;
    savingsPercentage: number | null;
    reviewRating: number | null;
  },
  alternatives: { price: PriceInfo | null }[],
  categorized?: CategorizedAlternatives | null,
): PriceEvaluation {
  const savingsPct = product.savingsPercentage;

  let vsAltPct: number | null = null;
  let avgAltPrice: number | null = null;
  let cheapestAltPrice: number | null = null;

  if (product.price) {
    // Prefer the "similar" tier for comparison (same price bracket);
    // fall back to all alternatives when categorized data is unavailable.
    const comparePool = categorized?.similar ?? alternatives;
    const altPrices = comparePool
      .map((a) => a.price?.amount)
      .filter((p): p is number => p !== undefined && p !== null);

    if (altPrices.length > 0) {
      avgAltPrice = altPrices.reduce((sum, p) => sum + p, 0) / altPrices.length;
      cheapestAltPrice = Math.min(...altPrices);
      vsAltPct =
        avgAltPrice > 0 ? ((avgAltPrice - product.price.amount) / avgAltPrice) * 100 : null;
    }
  }

  const color = decide(
    savingsPct,
    vsAltPct,
    product.price?.amount ?? null,
    cheapestAltPrice,
    categorized,
  );

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
    explanation: buildExplanation(
      savingsPct,
      vsAltPct,
      product.price?.amount ?? null,
      cheapestAltPrice,
      categorized,
    ),
    savingsPct,
    vsAlternativesPct: vsAltPct !== null ? Math.round(vsAltPct * 100) / 100 : null,
    priceBars,
  };
}
