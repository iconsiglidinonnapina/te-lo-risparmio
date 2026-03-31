import { describe, it, expect } from 'vitest';
import { extractAsin } from '../server/services/asin-extractor.js';

describe('server/asin-extractor — extractAsin', () => {
  // ── Valid URLs ──────────────────────────────────────────

  it('extracts ASIN from /dp/ path (amazon.it)', () => {
    const r = extractAsin('https://www.amazon.it/Venilia-Fix/dp/B084K866MQ/');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /dp/ with query params', () => {
    const r = extractAsin('https://www.amazon.it/dp/B084K866MQ?ref=sr_1_3&tag=foo-21');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /product/ path', () => {
    const r = extractAsin('https://www.amazon.com/product/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from /gp/product/ path', () => {
    const r = extractAsin('https://www.amazon.com/gp/product/B084K866MQ/ref=ox_sc');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.de', () => {
    const r = extractAsin('https://www.amazon.de/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.co.uk', () => {
    const r = extractAsin('https://www.amazon.co.uk/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.fr', () => {
    const r = extractAsin('https://www.amazon.fr/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.es', () => {
    const r = extractAsin('https://www.amazon.es/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('extracts ASIN from amazon.co.jp', () => {
    const r = extractAsin('https://www.amazon.co.jp/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('normalises lowercase ASIN to uppercase', () => {
    const r = extractAsin('https://www.amazon.it/dp/b084k866mq');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('trims leading/trailing whitespace', () => {
    const r = extractAsin('  https://www.amazon.it/dp/B084K866MQ  ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('handles URL with hash fragment', () => {
    const r = extractAsin('https://www.amazon.it/dp/B084K866MQ#reviews');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('accepts http:// URLs', () => {
    const r = extractAsin('http://www.amazon.it/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('accepts URL without www prefix', () => {
    const r = extractAsin('https://amazon.it/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  // ── Invalid inputs ─────────────────────────────────────

  it('returns error for empty string', () => {
    const r = extractAsin('');
    expect(r.valid).toBe(false);
    expect(r.asin).toBeNull();
    expect(r.error).toBeTruthy();
  });

  it('returns error for whitespace-only string', () => {
    const r = extractAsin('   ');
    expect(r.valid).toBe(false);
  });

  it('returns error for non-URL text', () => {
    const r = extractAsin('just some random text');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('non valido');
  });

  it('returns error for non-Amazon URL', () => {
    const r = extractAsin('https://www.ebay.com/itm/12345');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('Amazon');
  });

  it('returns error for Amazon search URL (no ASIN)', () => {
    const r = extractAsin('https://www.amazon.it/s?k=pellicola+adesiva');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('ASIN');
  });

  it('returns error for Amazon homepage', () => {
    const r = extractAsin('https://www.amazon.it/');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('ASIN');
  });

  it('rejects javascript: protocol', () => {
    const r = extractAsin('javascript:alert(1)');
    expect(r.valid).toBe(false);
  });

  it('rejects data: protocol', () => {
    const r = extractAsin('data:text/html,<h1>hi</h1>');
    expect(r.valid).toBe(false);
  });

  it('rejects URL longer than 2048 chars', () => {
    const long = 'https://www.amazon.it/dp/B084K866MQ/' + 'x'.repeat(2050);
    const r = extractAsin(long);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('lungo');
  });

  // ── Short link hosts ───────────────────────────────────

  it('recognises amzn.to short link with ASIN in path', () => {
    // amzn.to short links don't usually have /dp/ but just in case
    const r = extractAsin('https://amzn.to/dp/B084K866MQ');
    expect(r.valid).toBe(true);
    expect(r.asin).toBe('B084K866MQ');
  });

  it('returns ASIN-not-found for amzn.to without product path', () => {
    const r = extractAsin('https://amzn.to/3xYzAbc');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('ASIN');
  });

  it('recognises amzn.eu host', () => {
    const r = extractAsin('https://amzn.eu/dp/B084K866MQ');
    expect(r.valid).toBe(true);
  });

  it('recognises a.co host', () => {
    const r = extractAsin('https://a.co/dp/B084K866MQ');
    expect(r.valid).toBe(true);
  });

  // ── Auto-prepend protocol ──────────────────────────────

  it('auto-prepends https:// for amazon.it without protocol', () => {
    const r = extractAsin(
      'amazon.it/X8-Pro-Max-Smartphone-Fotocamera/dp/B0GHNJYM16/?_encoding=UTF8&pd_rd_w=vjjG3',
    );
    expect(r).toEqual({ valid: true, asin: 'B0GHNJYM16', error: null });
  });

  it('auto-prepends https:// for www.amazon.com without protocol', () => {
    const r = extractAsin('www.amazon.com/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('auto-prepends https:// for amzn.to without protocol', () => {
    const r = extractAsin('amzn.to/dp/B084K866MQ');
    expect(r).toEqual({ valid: true, asin: 'B084K866MQ', error: null });
  });

  it('does not prepend protocol for non-Amazon domains', () => {
    const r = extractAsin('ebay.com/itm/12345');
    expect(r.valid).toBe(false);
  });
});
