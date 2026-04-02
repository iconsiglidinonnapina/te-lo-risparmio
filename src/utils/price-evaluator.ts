import type { PriceInfo, PriceEvaluation, SignalColor } from '@/types/analysis';

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
): SignalColor {
  const hasDiscount = savingsPct !== null;
  const hasAlt = vsAltPct !== null;

  // ── Both signals available → combined score ──
  if (hasDiscount && hasAlt) {
    let score = scoreSavings(savingsPct) + scoreAlternatives(vsAltPct);
    if (productPrice !== null) {
      score += scoreCheapest(productPrice, cheapestAltPrice);
    }
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
): PriceEvaluation {
  const savingsPct = product.savingsPercentage;

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

  const color = decide(savingsPct, vsAltPct, product.price?.amount ?? null, cheapestAltPrice);

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
    ),
    savingsPct,
    vsAlternativesPct: vsAltPct !== null ? Math.round(vsAltPct * 100) / 100 : null,
    priceBars,
  };
}
