// FuelEU Maritime Regulation (EU) 2023/1805 — Annex IV constants
export const TARGET_GHG_INTENSITY_2025 = 89.3368; // gCO2e/MJ (2% below 91.16)
export const ENERGY_CONVERSION_FACTOR = 41_000;   // MJ per tonne of fuel

// Energy in scope (MJ) = fuel consumption (t) × 41,000 MJ/t
export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
  return fuelConsumptionTonnes * ENERGY_CONVERSION_FACTOR;
}

// Compliance Balance = (Target − Actual) × EnergyInScope
// Positive → surplus, Negative → deficit
export function computeComplianceBalance(
  targetIntensity: number,
  actualIntensity: number,
  fuelConsumptionTonnes: number
): number {
  const energyInScope = computeEnergyInScope(fuelConsumptionTonnes);
  return (targetIntensity - actualIntensity) * energyInScope;
}

// percentDiff = ((comparison / baseline) - 1) × 100
export function computePercentDiff(
  comparisonIntensity: number,
  baselineIntensity: number
): number {
  return ((comparisonIntensity / baselineIntensity) - 1) * 100;
}

export function isCompliant(ghgIntensity: number, target = TARGET_GHG_INTENSITY_2025): boolean {
  return ghgIntensity <= target;
}
