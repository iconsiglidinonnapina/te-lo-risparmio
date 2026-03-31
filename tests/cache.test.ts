import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TtlCache } from '../server/services/cache';

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves a value', () => {
    const cache = new TtlCache<string>(60_000);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new TtlCache<string>(60_000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new TtlCache<string>(1_000);
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(1_001);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('does not expire entries before TTL', () => {
    const cache = new TtlCache<string>(5_000);
    cache.set('key1', 'value1');

    vi.advanceTimersByTime(4_999);
    expect(cache.get('key1')).toBe('value1');
  });

  it('has() returns true for valid entries', () => {
    const cache = new TtlCache<number>(60_000);
    cache.set('a', 42);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  it('has() returns false for expired entries', () => {
    const cache = new TtlCache<number>(1_000);
    cache.set('a', 42);
    vi.advanceTimersByTime(1_001);
    expect(cache.has('a')).toBe(false);
  });

  it('delete() removes entry', () => {
    const cache = new TtlCache<string>(60_000);
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('clear() removes all entries', () => {
    const cache = new TtlCache<string>(60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('size evicts expired entries', () => {
    const cache = new TtlCache<string>(1_000);
    cache.set('a', '1');
    cache.set('b', '2');
    expect(cache.size).toBe(2);

    vi.advanceTimersByTime(1_001);
    expect(cache.size).toBe(0);
  });

  it('overwrites existing key with new TTL', () => {
    const cache = new TtlCache<string>(2_000);
    cache.set('key1', 'old');
    vi.advanceTimersByTime(1_500);
    cache.set('key1', 'new');
    vi.advanceTimersByTime(1_500);
    // Old entry would have expired, but new one should still be valid
    expect(cache.get('key1')).toBe('new');
  });
});
