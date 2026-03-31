const STOP_WORDS_IT = new Set([
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'un',
  'uno',
  'una',
  'di',
  'del',
  'dello',
  'della',
  'dei',
  'degli',
  'delle',
  'a',
  'al',
  'allo',
  'alla',
  'ai',
  'agli',
  'alle',
  'da',
  'dal',
  'dallo',
  'dalla',
  'dai',
  'dagli',
  'dalle',
  'in',
  'nel',
  'nello',
  'nella',
  'nei',
  'negli',
  'nelle',
  'su',
  'sul',
  'sullo',
  'sulla',
  'sui',
  'sugli',
  'sulle',
  'con',
  'per',
  'tra',
  'fra',
  'e',
  'o',
  'ma',
  'che',
  'non',
  'si',
  'se',
  'come',
  'più',
  'piu',
  'anche',
  'questo',
  'questa',
]);

const STOP_WORDS_EN = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'not',
  'no',
  'nor',
  'so',
  'yet',
  'both',
  'each',
  'every',
  'all',
  'any',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'than',
  'too',
  'very',
  'just',
  'about',
  'above',
  'after',
  'again',
  'into',
  'through',
  'during',
  'before',
  'between',
  'out',
  'off',
  'over',
  'under',
  'up',
  'down',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'new',
]);

const ALL_STOP_WORDS = new Set([...STOP_WORDS_IT, ...STOP_WORDS_EN]);

/** Amazon-specific noise: dimensions, units, marketing fluff, certifications */
const AMAZON_NOISE = new Set([
  'prodotto',
  'spessore',
  'confezione',
  'pacco',
  'pezzo',
  'pezzi',
  'set',
  'kit',
  'modello',
  'versione',
  'edizione',
  'aggiornato',
  'aggiornata',
  'ultimo',
  'ultima',
  'originale',
  'ufficiale',
  'garanzia',
  'anni',
  'anno',
  'mesi',
  'giorni',
  'senza',
  'made',
  'ue',
  'eu',
  'ce',
  'italia',
  'italy',
]);

const NOISE_PATTERN = /[()[\]{}"',.:;!?|/\\#@~`^*+=<>%&$€£¥_\-–—]+/g;

/** Matches pure measurement tokens: 45cm, 2m, 150μ, 100ml, 500g, 10x15, etc. */
const MEASUREMENT_RE = /^\d+(?:[.,]\d+)?(?:cm|mm|m|km|μ|ml|cl|lt?|kg|mg|g|oz|in|ft|x\d+)$/i;

export function extractKeywords(title: string, maxTokens = 5): string {
  const tokens = title
    .toLowerCase()
    .replace(NOISE_PATTERN, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter((t) => !ALL_STOP_WORDS.has(t))
    .filter((t) => !AMAZON_NOISE.has(t))
    .filter((t) => !/^\d+$/.test(t))
    .filter((t) => !MEASUREMENT_RE.test(t));

  // Deduplicate while keeping order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      unique.push(t);
    }
  }

  return unique.slice(0, maxTokens).join(' ');
}

/**
 * Extracts a product-type query from the title, skipping the brand (first word)
 * and focusing on the category-descriptive terms. Uses up to `maxTokens` tokens.
 * Includes browseNodeName when available for tighter category matching.
 */
export function extractSearchQuery(
  title: string,
  browseNodeName: string | null,
  maxTokens = 8,
): string {
  const tokens = title
    .toLowerCase()
    .replace(NOISE_PATTERN, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter((t) => !ALL_STOP_WORDS.has(t))
    .filter((t) => !AMAZON_NOISE.has(t))
    .filter((t) => !/^\d+$/.test(t))
    .filter((t) => !MEASUREMENT_RE.test(t));

  // Deduplicate while keeping order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      unique.push(t);
    }
  }

  // Build the query: browseNodeName (category) + product-type tokens (skip brand)
  const parts: string[] = [];

  if (browseNodeName) {
    const categoryTokens = browseNodeName
      .toLowerCase()
      .replace(NOISE_PATTERN, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !ALL_STOP_WORDS.has(t));
    for (const ct of categoryTokens) {
      if (!seen.has(ct)) {
        seen.add(ct);
        parts.push(ct);
      }
    }
  }

  // Skip first token (usually the brand) and take product-descriptive tokens
  const productTokens = unique.length > 1 ? unique.slice(1) : unique;
  parts.push(...productTokens);

  // Deduplicate the final result
  const finalSeen = new Set<string>();
  const final: string[] = [];
  for (const p of parts) {
    if (!finalSeen.has(p)) {
      finalSeen.add(p);
      final.push(p);
    }
  }

  return final.slice(0, maxTokens).join(' ');
}
