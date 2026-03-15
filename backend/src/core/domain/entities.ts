export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;      // gCO2e/MJ
  fuelConsumption: number;   // tonnes
  distance: number;          // km
  totalEmissions: number;    // tonnes
  isBaseline: boolean;
  createdAt: Date;
}

export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;          // positive = surplus, negative = deficit
  computedAt: Date;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface ComparisonResult {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}
