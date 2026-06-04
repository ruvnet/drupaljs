import { describe, expect, it } from 'vitest';
import { FieldException } from './exception.js';

describe('FieldException', () => {
  it('is an Error with the FieldException name', () => {
    const error = new FieldException('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FieldException);
    expect(error.name).toBe('FieldException');
    expect(error.message).toBe('boom');
  });
});
