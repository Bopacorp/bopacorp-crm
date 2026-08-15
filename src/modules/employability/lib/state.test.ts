import { describe, expect, it } from 'vitest';
import { applicationStateLabel, applicationStateVariant } from './state.js';

describe('application state helpers', () => {
  it.each([
    ['DRAFT', 'Borrador', 'secondary'],
    ['PENDING', 'Pendiente', 'secondary'],
    ['ACCEPTED', 'Revisado', 'default'],
    ['REJECTED', 'Rechazado', 'destructive'],
  ] as const)('maps %s to its label and visual variant', (state, label, variant) => {
    expect(applicationStateLabel(state)).toBe(label);
    expect(applicationStateVariant(state)).toBe(variant);
  });

  it('uses a safe fallback for unknown runtime states', () => {
    expect(applicationStateLabel('UNKNOWN' as never)).toBe('UNKNOWN');
    expect(applicationStateVariant('UNKNOWN' as never)).toBe('secondary');
  });
});
