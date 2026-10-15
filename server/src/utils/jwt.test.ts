import { describe, it, expect, beforeAll } from 'vitest';
import { signToken, verifyToken } from './jwt';

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret';
});

describe('jwt', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken('user_123');
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user_123');
  });

  it('throws when verifying an invalid token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
  });
});
