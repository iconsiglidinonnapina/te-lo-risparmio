import { describe, it, expect } from 'vitest';
import { extractAsin, isAmazonUrl, isShortLink } from '../src/utils/asin-extractor';

describe('isAmazonUrl', () => {
  it('recognises amazon.it', () => {
    expect(isAmazonUrl('https://www.amazon.it/dp/B084K866MQ')).toBe(true);
  });

  it('recognises amazon.com', () => {
    expect(isAmazonUrl('https://www.amazon.com/dp/B084K866MQ')).toBe(true);
  });

  it('recognises amazon.de', () => {
    expect(isAmazonUrl('https://www.amazon.de/dp/B084K866MQ')).toBe(true);
  });

  it('recognises amazon.co.uk', () => {
    expect(isAmazonUrl('https://www.amazon.co.uk/dp/B084K866MQ')).toBe(true);
  });

  it('recognises amzn.to short links', () => {
    expect(isAmazonUrl('https://amzn.to/3xYzAbc')).toBe(true);
  });

  it('recognises amzn.eu short links', () => {
    expect(isAmazonUrl('https://amzn.eu/d/abc123')).toBe(true);
  });

  it('rejects non-Amazon URLs', () => {
    expect(isAmazonUrl('https://www.ebay.com/itm/12345')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isAmazonUrl('not a url')).toBe(false);
  });
});

describe('extractAsin', () => {
  it('extracts ASIN from /dp/ URL', () => {
    const result = extractAsin('https://www.amazon.it/Venilia-Fix/dp/B084K866MQ/');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /dp/ URL with query params', () => {
    const result = extractAsin('https://www.amazon.it/dp/B084K866MQ?ref=sr_1');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /product/ URL', () => {
    const result = extractAsin('https://www.amazon.com/product/B084K866MQ');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /gp/product/ URL', () => {
    const result = extractAsin('https://www.amazon.com/gp/product/B084K866MQ/ref=ox_sc');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.de', () => {
    const result = extractAsin('https://www.amazon.de/dp/B084K866MQ');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('normalises ASIN to uppercase', () => {
    const result = extractAsin('https://www.amazon.it/dp/b084k866mq');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('trims whitespace', () => {
    const result = extractAsin('  https://www.amazon.it/dp/B084K866MQ  ');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('returns error for empty input', () => {
    const result = extractAsin('');
    expect(result.valid).toBe(false);
    expect(result.asin).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns error for non-URL input', () => {
    const result = extractAsin('just some text');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns error for non-Amazon URL', () => {
    const result = extractAsin('https://www.ebay.com/itm/12345');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Amazon');
  });

  it('returns error when ASIN cannot be extracted', () => {
    const result = extractAsin('https://www.amazon.it/s?k=pellicola');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('ASIN');
  });

  it('handles URL with hash fragment', () => {
    const result = extractAsin('https://www.amazon.it/dp/B084K866MQ#reviews');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('auto-prepends https:// when protocol is missing', () => {
    const result = extractAsin(
      'amazon.it/X8-Pro-Max-Smartphone-Fotocamera/dp/B0GHNJYM16/?_encoding=UTF8&pd_rd_w=vjjG3',
    );
    expect(result).toEqual({ valid: true, asin: 'B0GHNJYM16', error: null });
  });

  it('auto-prepends https:// for www.amazon.* without protocol', () => {
    const result = extractAsin('www.amazon.com/dp/B084K866MQ');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  // Short links: valid with null asin (needs server resolution)
  it('returns valid with null asin for amzn.eu short link', () => {
    const result = extractAsin('https://amzn.eu/d/abc1234');
    expect(result).toEqual({ valid: true, asin: null, error: null });
  });

  it('returns valid with null asin for amzn.to short link', () => {
    const result = extractAsin('https://amzn.to/3xYzAbc');
    expect(result).toEqual({ valid: true, asin: null, error: null });
  });

  it('returns valid with null asin for a.co short link', () => {
    const result = extractAsin('https://a.co/d/hK9xAbC');
    expect(result).toEqual({ valid: true, asin: null, error: null });
  });

  it('returns valid with null asin for amzn.it short link', () => {
    const result = extractAsin('https://amzn.it/d/abc1234');
    expect(result).toEqual({ valid: true, asin: null, error: null });
  });

  it('extracts ASIN from short link host with /dp/ path', () => {
    const result = extractAsin('https://amzn.eu/dp/B084K866MQ');
    expect(result).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });
});

describe('isShortLink', () => {
  it('detects amzn.eu as short link', () => {
    expect(isShortLink('https://amzn.eu/d/abc1234')).toBe(true);
  });

  it('detects amzn.to as short link', () => {
    expect(isShortLink('https://amzn.to/3xYzAbc')).toBe(true);
  });

  it('detects a.co as short link', () => {
    expect(isShortLink('https://a.co/d/hK9xAbC')).toBe(true);
  });

  it('detects amzn.it as short link', () => {
    expect(isShortLink('https://amzn.it/d/abc1234')).toBe(true);
  });

  it('returns false for full Amazon URLs', () => {
    expect(isShortLink('https://www.amazon.it/dp/B084K866MQ')).toBe(false);
  });

  it('returns false for non-Amazon URLs', () => {
    expect(isShortLink('https://www.ebay.com/itm/12345')).toBe(false);
  });

  it('returns false for invalid input', () => {
    expect(isShortLink('not a url')).toBe(false);
  });

  it('handles input without protocol', () => {
    expect(isShortLink('amzn.eu/d/abc1234')).toBe(true);
  });
});
