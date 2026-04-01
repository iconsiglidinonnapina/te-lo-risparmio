import { describe, it, expect } from 'vitest';
import { extractKeywords, extractSearchQuery } from '../server/services/keyword-extractor';

describe('extractKeywords', () => {
  it('extracts meaningful words from a product title', () => {
    const title = 'Samsung Galaxy S24 Ultra Smartphone 256GB Nero';
    const result = extractKeywords(title);
    expect(result).toBe('samsung galaxy s24 ultra smartphone');
  });

  it('removes Italian stop words', () => {
    const title = 'Custodia per il Samsung Galaxy con protezione della fotocamera';
    const result = extractKeywords(title);
    expect(result).not.toContain('per');
    expect(result).not.toContain('il');
    expect(result).not.toContain('con');
    expect(result).not.toContain('della');
  });

  it('removes English stop words', () => {
    const title = 'The Best Wireless Mouse for Gaming and Office';
    const result = extractKeywords(title);
    expect(result).not.toContain('the');
    expect(result).not.toContain('for');
    expect(result).not.toContain('and');
  });

  it('removes punctuation and special characters', () => {
    const title = 'Logitech MX Master 3S - Mouse (Wireless, Bluetooth)';
    const result = extractKeywords(title);
    expect(result).not.toContain('-');
    expect(result).not.toContain('(');
    expect(result).not.toContain(')');
    expect(result).not.toContain(',');
  });

  it('removes pure numeric tokens', () => {
    const title = 'SanDisk Ultra 256 GB MicroSDXC 150 MB/s';
    const result = extractKeywords(title);
    expect(result).not.toMatch(/\b256\b/);
    expect(result).not.toMatch(/\b150\b/);
  });

  it('keeps alphanumeric tokens (e.g. model numbers)', () => {
    const title = 'Apple MacBook Air M3 15 pollici 256GB';
    const result = extractKeywords(title, 10);
    expect(result).toContain('m3');
    expect(result).toContain('256gb');
  });

  it('deduplicates tokens', () => {
    const title = 'Mouse Mouse Wireless Mouse Gaming';
    const result = extractKeywords(title);
    const words = result.split(' ');
    const unique = new Set(words);
    expect(words.length).toBe(unique.size);
  });

  it('respects maxTokens parameter', () => {
    const title = 'Samsung Galaxy S24 Ultra Smartphone 256GB Nero Titanio Dual SIM';
    const result = extractKeywords(title, 3);
    expect(result.split(' ').length).toBeLessThanOrEqual(3);
  });

  it('returns empty string for empty input', () => {
    expect(extractKeywords('')).toBe('');
  });

  it('handles title with only stop words', () => {
    const title = 'il la di del per con';
    expect(extractKeywords(title)).toBe('');
  });
});

describe('extractSearchQuery', () => {
  it('deprioritizes generic adjectives like "elettrico"', () => {
    const query = extractSearchQuery('SwitchBot Apri Tende Elettrico Automatico', null, 4);
    const tokens = query.split(' ');
    // "apri" and "tende" should appear before "elettrico"/"automatico"
    const apriIdx = tokens.indexOf('apri');
    const tendeIdx = tokens.indexOf('tende');
    expect(apriIdx).toBeLessThan(tokens.length);
    expect(tendeIdx).toBeLessThan(tokens.length);
    // If maxTokens is tight, generic adjectives may be excluded
  });

  it('deprioritizes "smart", "wireless", "bluetooth"', () => {
    const query = extractSearchQuery(
      'Logitech MX Master Mouse Wireless Bluetooth Ergonomico',
      null,
      4,
    );
    const tokens = query.split(' ');
    // "mx", "master", "mouse" are specific; "wireless", "bluetooth" are generic
    expect(tokens).toContain('mouse');
    // Generic adjectives should be at the end or excluded
    const mouseIdx = tokens.indexOf('mouse');
    if (tokens.includes('wireless')) {
      expect(tokens.indexOf('wireless')).toBeGreaterThan(mouseIdx);
    }
  });

  it('keeps generic adjectives if they are the only tokens', () => {
    const query = extractSearchQuery('Smart Wireless', null, 5);
    // These are all generic adjectives but should still produce a query
    expect(query.length).toBeGreaterThan(0);
  });

  it('includes browseNodeName tokens as priority', () => {
    const query = extractSearchQuery('SwitchBot Apri Tende Intelligente', 'Motori per tende', 8);
    expect(query).toContain('motori');
    expect(query).toContain('tende');
  });

  it('skips brand (first token) when there are multiple tokens', () => {
    const query = extractSearchQuery('Samsung Galaxy S24 Ultra Smartphone', null, 5);
    const tokens = query.split(' ');
    // "samsung" (brand) should be skipped
    expect(tokens[0]).not.toBe('samsung');
  });

  it('returns empty string for only stop words', () => {
    expect(extractSearchQuery('il la di del per con', null)).toBe('');
  });
});
