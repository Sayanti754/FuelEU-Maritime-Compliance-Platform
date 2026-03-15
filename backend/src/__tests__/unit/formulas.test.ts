import {
  computeEnergyInScope,
  computeComplianceBalance,
  computePercentDiff,
  isCompliant,
  TARGET_GHG_INTENSITY_2025,
  ENERGY_CONVERSION_FACTOR,
} from '../../core/domain/formulas';

describe('Domain Formulas', () => {
  describe('computeEnergyInScope', () => {
    it('converts fuel tonnes to MJ using 41000 factor', () => {
      expect(computeEnergyInScope(1)).toBe(41_000);
      expect(computeEnergyInScope(5000)).toBe(205_000_000);
    });

    it('returns 0 for 0 fuel consumption', () => {
      expect(computeEnergyInScope(0)).toBe(0);
    });
  });

  describe('computeComplianceBalance', () => {
    it('returns positive CB when actual < target (surplus)', () => {
      // target=89.3368, actual=88.0, fuel=4800
      const cb = computeComplianceBalance(89.3368, 88.0, 4800);
      const energyInScope = 4800 * ENERGY_CONVERSION_FACTOR;
      const expected = (89.3368 - 88.0) * energyInScope;
      expect(cb).toBeCloseTo(expected, 2);
      expect(cb).toBeGreaterThan(0);
    });

    it('returns negative CB when actual > target (deficit)', () => {
      // target=89.3368, actual=91.0, fuel=5000
      const cb = computeComplianceBalance(89.3368, 91.0, 5000);
      expect(cb).toBeLessThan(0);
    });

    it('returns 0 CB when actual equals target', () => {
      const cb = computeComplianceBalance(89.3368, 89.3368, 5000);
      expect(cb).toBeCloseTo(0, 5);
    });
  });

  describe('computePercentDiff', () => {
    it('calculates correct percent difference', () => {
      const diff = computePercentDiff(88.0, 91.0);
      expect(diff).toBeCloseTo(((88 / 91) - 1) * 100, 4);
    });

    it('returns 0 when comparison equals baseline', () => {
      expect(computePercentDiff(90.0, 90.0)).toBeCloseTo(0, 5);
    });

    it('returns positive when comparison > baseline', () => {
      expect(computePercentDiff(93.5, 91.0)).toBeGreaterThan(0);
    });
  });

  describe('isCompliant', () => {
    it('returns true when ghgIntensity <= target', () => {
      expect(isCompliant(88.0)).toBe(true);
      expect(isCompliant(TARGET_GHG_INTENSITY_2025)).toBe(true);
    });

    it('returns false when ghgIntensity > target', () => {
      expect(isCompliant(91.0)).toBe(false);
      expect(isCompliant(93.5)).toBe(false);
    });
  });
});
