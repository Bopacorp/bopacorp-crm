import { describe, expect, it } from 'vitest';
import { decodeJwtPayload } from './jwt.js';

function encodePayload(payload: object) {
  return btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

describe('decodeJwtPayload', () => {
  it('decodes a valid Base64URL payload', () => {
    const payload = {
      sub: 'user-1',
      email: 'maria@bopacorp.test',
      roles: ['manager'],
      permissions: ['clients.read'],
    };

    expect(decodeJwtPayload(`header.${encodePayload(payload)}.signature`)).toEqual(payload);
  });

  it('rejects a token without a payload segment', () => {
    expect(() => decodeJwtPayload('header')).toThrow('Invalid JWT');
  });

  it('rejects a malformed payload', () => {
    expect(() => decodeJwtPayload('header.not-json.signature')).toThrow();
  });
});
