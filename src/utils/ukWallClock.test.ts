import { describe, it, expect } from 'vitest';
import { ukInstant, ukTimeOf, addUkDays } from './ukWallClock';

describe('UK wall clock across clock changes', () => {
  it('6pm before clocks go back is 17:00 UTC', () => {
    expect(ukInstant('2026-10-22', '18:00').toISOString()).toBe('2026-10-22T17:00:00.000Z');
  });
  it('6pm after clocks go back is 18:00 UTC and still 6pm UK', () => {
    const d = ukInstant('2026-10-29', '18:00');
    expect(d.toISOString()).toBe('2026-10-29T18:00:00.000Z');
    expect(ukTimeOf(d)).toBe('18:00');
  });
  it('weekly step from summer keeps 6pm UK', () => {
    const next = addUkDays('2026-10-22', 7);
    expect(ukTimeOf(ukInstant(next, '18:00'))).toBe('18:00');
  });
  it('6pm after clocks go forward in March is 17:00 UTC', () => {
    expect(ukInstant('2027-04-01', '18:00').toISOString()).toBe('2027-04-01T17:00:00.000Z');
  });
});
