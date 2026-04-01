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

/**
 * Generic adjectives that pollute search queries. These are too broad to
 * discriminate between product categories — e.g. "elettrico" matches both
 * curtain openers and power strips. They are still kept if they are the
 * *only* remaining tokens (fallback).
 */
const GENERIC_ADJECTIVES = new Set([
  // Italian
  'smart',
  'intelligente',
  'elettrico',
  'elettrica',
  'elettrici',
  'elettriche',
  'wireless',
  'wifi',
  'bluetooth',
  'portatile',
  'portatili',
  'professionale',
  'professionali',
  'automatico',
  'automatica',
  'automatici',
  'automatiche',
  'digitale',
  'digitali',
  'moderno',
  'moderna',
  'moderni',
  'moderne',
  'premium',
  'mini',
  'grande',
  'grandi',
  'piccolo',
  'piccola',
  'piccoli',
  'piccole',
  'nero',
  'nera',
  'neri',
  'nere',
  'bianco',
  'bianca',
  'bianchi',
  'bianche',
  'rosso',
  'rossa',
  'grigio',
  'grigia',
  'blu',
  'verde',
  'giallo',
  'gialla',
  'oro',
  'argento',
  'silenzioso',
  'silenziosa',
  'potente',
  'potenti',
  'multifunzione',
  'ricaricabile',
  'ricaricabili',
  'impermeabile',
  'impermeabili',
  'regolabile',
  'regolabili',
  'resistente',
  'resistenti',
  'compatto',
  'compatta',
  'leggero',
  'leggera',
  'universale',
  'universali',
  'compatibile',
  'compatibili',
  'telecomando',
  'timer',
  'display',
  // English equivalents commonly found in IT Amazon titles
  'electric',
  'portable',
  'professional',
  'automatic',
  'digital',
  'modern',
  'black',
  'white',
  'gray',
  'grey',
  'blue',
  'green',
  'red',
  'gold',
  'silver',
  'silent',
  'powerful',
  'rechargeable',
  'waterproof',
  'adjustable',
  'compact',
  'lightweight',
  'universal',
  'compatible',
]);

const NOISE_PATTERN = /[()[\]{}"',.:;!?|/\\#@~`^*+=<>%&$€£¥_\-–—]+/g;

/** Matches pure measurement tokens: 45cm, 2m, 150μ, 100ml, 500g, 10x15, etc. */
const MEASUREMENT_RE = /^\d+(?:[.,]\d+)?(?:cm|mm|m|km|μ|ml|cl|lt?|kg|mg|g|oz|in|ft|x\d+)$/i;

/**
 * Tokenizes a string into clean lowercase tokens, filtering stop words,
 * noise, pure numbers, and measurements.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(NOISE_PATTERN, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter((t) => !ALL_STOP_WORDS.has(t))
    .filter((t) => !AMAZON_NOISE.has(t))
    .filter((t) => !/^\d+$/.test(t))
    .filter((t) => !MEASUREMENT_RE.test(t));
}

function deduplicate(tokens: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      unique.push(t);
    }
  }
  return unique;
}

export function extractKeywords(title: string, maxTokens = 5): string {
  const tokens = tokenize(title);
  return deduplicate(tokens).slice(0, maxTokens).join(' ');
}

/**
 * Extracts a product-type query from the title, skipping the brand (first word)
 * and focusing on the category-descriptive terms. Uses up to `maxTokens` tokens.
 * Includes browseNodeName when available for tighter category matching.
 *
 * Generic adjectives (smart, elettrico, wireless, etc.) are deprioritized:
 * they are placed at the end and only included if there's room in maxTokens.
 * This ensures the query focuses on the *type* of product rather than
 * generic attributes that span many unrelated categories.
 */
export function extractSearchQuery(
  title: string,
  browseNodeName: string | null,
  maxTokens = 8,
): string {
  const tokens = tokenize(title);
  const unique = deduplicate(tokens);

  // Separate product-specific tokens from generic adjectives
  const specificTokens: string[] = [];
  const genericTokens: string[] = [];
  for (const t of unique) {
    if (GENERIC_ADJECTIVES.has(t)) {
      genericTokens.push(t);
    } else {
      specificTokens.push(t);
    }
  }

  // Build the query: browseNodeName (category) + specific tokens (skip brand) + generic tokens (if room)
  const seen = new Set<string>();
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

  // Skip first specific token (usually the brand) and take product-descriptive tokens
  const productTokens = specificTokens.length > 1 ? specificTokens.slice(1) : specificTokens;
  for (const pt of productTokens) {
    if (!seen.has(pt)) {
      seen.add(pt);
      parts.push(pt);
    }
  }

  // Append generic adjectives at the end — only if there's room
  for (const gt of genericTokens) {
    if (!seen.has(gt)) {
      seen.add(gt);
      parts.push(gt);
    }
  }

  // If we ended up with nothing specific (all tokens were generic), use generic tokens
  if (parts.length === 0) {
    return genericTokens.slice(0, maxTokens).join(' ');
  }

  return parts.slice(0, maxTokens).join(' ');
}
