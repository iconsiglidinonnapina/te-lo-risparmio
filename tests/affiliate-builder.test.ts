import { describe, it, expect } from 'vitest';
import { buildAffiliateLink, cleanAndTagUrl } from '../server/services/affiliate-builder.js';

describe('affiliate-builder — buildAffiliateLink', () => {
  const TAG = 'mystore-21';
  const MARKETPLACE = 'www.amazon.it';

  it('builds a canonical affiliate link from ASIN', () => {
    const link = buildAffiliateLink('B084K866MQ', { marketplace: MARKETPLACE, tag: TAG });
    expect(link).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  it('uses uppercase ASIN as-is', () => {
    const link = buildAffiliateLink('B07XXXXX01', { marketplace: MARKETPLACE, tag: TAG });
    expect(link).toBe('https://www.amazon.it/dp/B07XXXXX01?tag=mystore-21');
  });

  it('supports different marketplaces', () => {
    const link = buildAffiliateLink('B084K866MQ', {
      marketplace: 'www.amazon.de',
      tag: 'de-tag-21',
    });
    expect(link).toBe('https://www.amazon.de/dp/B084K866MQ?tag=de-tag-21');
  });

  it('omits tag param when tag is empty', () => {
    const link = buildAffiliateLink('B084K866MQ', { marketplace: MARKETPLACE, tag: '' });
    expect(link).toBe('https://www.amazon.it/dp/B084K866MQ');
  });
});

describe('affiliate-builder — cleanAndTagUrl', () => {
  const TAG = 'mystore-21';
  const MARKETPLACE = 'www.amazon.it';
  const opts = { marketplace: MARKETPLACE, tag: TAG };

  // ── Standard /dp/ URLs ───────────────────────────────────

  it('cleans a /dp/ URL with tracking params', () => {
    const dirty =
      'https://www.amazon.it/Venilia-Fix-Pellicola/dp/B084K866MQ/ref=sr_1_3?dib=abc&tag=old-21&qid=123';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  it('cleans a /dp/ URL without extra path segments', () => {
    const dirty = 'https://www.amazon.it/dp/B084K866MQ';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  it('cleans a /dp/ URL with trailing slash', () => {
    const dirty = 'https://www.amazon.it/dp/B084K866MQ/';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  // ── /gp/product/ URLs ────────────────────────────────────

  it('cleans a /gp/product/ URL', () => {
    const dirty = 'https://www.amazon.com/gp/product/B084K866MQ/ref=ox_sc_act?smid=A1XYZABC';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  // ── /product/ URLs ───────────────────────────────────────

  it('cleans a /product/ URL', () => {
    const dirty = 'https://www.amazon.com/product/B084K866MQ?ref=sr_1_1';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  // ── URLs with title slugs ────────────────────────────────

  it('cleans a URL with a product title slug before /dp/', () => {
    const dirty =
      'https://www.amazon.it/Some-Product-Title-Here/dp/B084K866MQ/ref=pd_ci_mcx_mh_mcx_views_0?pd_rd_w=abc';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  // ── Different Amazon domains ─────────────────────────────

  it('normalises the marketplace regardless of input domain', () => {
    const dirty = 'https://www.amazon.de/dp/B084K866MQ?tag=de-old-21';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });

  // ── Invalid / non-Amazon URLs ────────────────────────────

  it('returns null for a non-Amazon URL', () => {
    expect(cleanAndTagUrl('https://www.google.com/search?q=test', opts)).toBeNull();
  });

  it('returns null for a URL with no ASIN', () => {
    expect(cleanAndTagUrl('https://www.amazon.it/s?k=pellicola', opts)).toBeNull();
  });

  it('returns null for an invalid URL', () => {
    expect(cleanAndTagUrl('not-a-url', opts)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(cleanAndTagUrl('', opts)).toBeNull();
  });

  // ── Replaces existing tag ────────────────────────────────

  it('replaces an existing tag param with the configured one', () => {
    const dirty = 'https://www.amazon.it/dp/B084K866MQ?tag=someone-else-21&ref=sr_1_1';
    expect(cleanAndTagUrl(dirty, opts)).toBe('https://www.amazon.it/dp/B084K866MQ?tag=mystore-21');
  });
});
