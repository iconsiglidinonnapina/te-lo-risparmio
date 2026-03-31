import { describe, it, expect } from 'vitest';
import { extractKeywords } from '../server/services/keyword-extractor';

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
