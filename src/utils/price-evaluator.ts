import type { PriceInfo, PriceEvaluation, SignalColor } from '@/types/analysis';

const SAVINGS_HIGH = 25;
const SAVINGS_MODERATE = 10;

const ALT_MUCH_CHEAPER = 15;
const ALT_SLIGHTLY_EXPENSIVE = 10;

const REVIEW_GOOD = 4.5;
const REVIEW_POOR = 3.5;

function scoreSavings(savingsPct: number | null): number {
  if (savingsPct === null) return 0;
  if (savingsPct >= SAVINGS_HIGH) return 2;
  if (savingsPct >= SAVINGS_MODERATE) return 1;
  if (savingsPct > 0) return 0;
  return -1;
}

function scoreVsAlternatives(vsAltPct: number | null): number {
  if (vsAltPct === null) return 0;
  if (vsAltPct >= ALT_MUCH_CHEAPER) return 2;
  if (vsAltPct >= 0) return 1;
  if (vsAltPct >= -ALT_SLIGHTLY_EXPENSIVE) return 0;
  return -1;
}

function scoreReview(rating: number | null): number {
  if (rating === null) return 0;
  if (rating >= REVIEW_GOOD) return 1;
  if (rating >= REVIEW_POOR) return 0;
  return -1;
}

function totalToColor(total: number): SignalColor {
  if (total >= 2) return 'green';
  if (total >= -1) return 'yellow';
  return 'red';
}

const LABELS: Record<SignalColor, string> = {
  green: 'Buon prezzo',
  yellow: 'Prezzo nella media',
  red: 'Prezzo alto',
};

function buildExplanation(
  color: SignalColor,
  savingsPct: number | null,
  vsAltPct: number | null,
): string {
  const parts: string[] = [];

  if (savingsPct !== null) {
    if (savingsPct >= SAVINGS_MODERATE) {
      parts.push(`Sconto del ${savingsPct}% rispetto al prezzo di listino`);
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
    return color === 'green'
      ? 'Il prezzo sembra vantaggioso'
      : color === 'red'
        ? 'Il prezzo non sembra conveniente'
        : 'Non ci sono abbastanza dati per una valutazione completa';
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
  if (product.price && alternatives.length > 0) {
    const altPrices = alternatives
      .map((a) => a.price?.amount)
      .filter((p): p is number => p !== undefined && p !== null);

    if (altPrices.length > 0) {
      const avgAltPrice = altPrices.reduce((sum, p) => sum + p, 0) / altPrices.length;
      vsAltPct =
        avgAltPrice > 0 ? ((avgAltPrice - product.price.amount) / avgAltPrice) * 100 : null;
    }
  }

  const total =
    scoreSavings(savingsPct) + scoreVsAlternatives(vsAltPct) + scoreReview(product.reviewRating);
  const color = totalToColor(total);

  return {
    color,
    label: LABELS[color],
    explanation: buildExplanation(color, savingsPct, vsAltPct),
    savingsPct,
    vsAlternativesPct: vsAltPct !== null ? Math.round(vsAltPct * 100) / 100 : null,
  };
}
