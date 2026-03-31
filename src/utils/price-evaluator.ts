import type { PriceInfo, PriceEvaluation, SignalColor } from '@/types/analysis';

const SAVINGS_GOOD = 20;
const SAVINGS_SOME = 5;

const ALT_MUCH_CHEAPER = 15;
const ALT_EXPENSIVE = 10;
const ALT_VERY_EXPENSIVE = 20;

function decide(savingsPct: number | null, vsAltPct: number | null): SignalColor {
  const hasSavings = savingsPct !== null && savingsPct >= SAVINGS_GOOD;
  const hasSomeSavings = savingsPct !== null && savingsPct >= SAVINGS_SOME;
  const noSavings = savingsPct === null || savingsPct < SAVINGS_SOME;

  if (hasSavings && (vsAltPct === null || vsAltPct >= 0)) return 'green';
  if (vsAltPct !== null && vsAltPct >= ALT_MUCH_CHEAPER) return 'green';
  if (hasSomeSavings && vsAltPct === null) return 'green';

  if (noSavings && vsAltPct !== null && vsAltPct <= -ALT_EXPENSIVE) return 'red';
  if (!hasSomeSavings && vsAltPct !== null && vsAltPct <= -ALT_VERY_EXPENSIVE) return 'red';

  return 'yellow';
}

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

  const color = decide(savingsPct, vsAltPct);

  return {
    color,
    label: LABELS[color],
    explanation: buildExplanation(savingsPct, vsAltPct),
    savingsPct,
    vsAlternativesPct: vsAltPct !== null ? Math.round(vsAltPct * 100) / 100 : null,
  };
}
