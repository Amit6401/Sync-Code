import { describe, it, expect } from 'vitest';
import { refId, refName } from './index';

describe('refId', () => {
  it('returns empty string for nullish', () => {
    expect(refId(null)).toBe('');
    expect(refId(undefined)).toBe('');
  });

  it('returns the string directly', () => {
    expect(refId('abc123')).toBe('abc123');
  });

  it('prefers id then _id on populated objects', () => {
    expect(refId({ id: 'from-id', _id: 'from-underscore' })).toBe('from-id');
    expect(refId({ _id: 'only-underscore' })).toBe('only-underscore');
  });

  it('returns empty string when object has neither id', () => {
    expect(refId({ name: 'x' })).toBe('');
  });
});

describe('refName', () => {
  it('returns Unknown for nullish', () => {
    expect(refName(null)).toBe('Unknown');
    expect(refName(undefined)).toBe('Unknown');
  });

  it('returns the last 6 chars for a raw id', () => {
    expect(refName('abcdef123456')).toBe('123456');
  });

  it('prefers name, then email, then id suffix on populated objects', () => {
    expect(refName({ name: 'Alice', email: 'a@b.com', _id: 'zzzzzz999999' })).toBe('Alice');
    expect(refName({ email: 'a@b.com', _id: 'zzzzzz999999' })).toBe('a@b.com');
    expect(refName({ _id: 'zzzzzz999999' })).toBe('999999');
  });
});
