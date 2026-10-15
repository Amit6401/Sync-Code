import { describe, it, expect } from 'vitest';
import { AppError } from './appError';

describe('AppError', () => {
  it('stores message and status code', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('captures a stack trace', () => {
    const err = new AppError('Boom', 500);
    expect(err.stack).toBeTruthy();
  });
});
