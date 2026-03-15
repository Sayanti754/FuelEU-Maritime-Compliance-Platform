export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
  createdAt: string;
}

export interface ComparisonResult {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
  computedAt: string;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export interface BankRecord {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  applied: boolean;
  createdAt: string;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: string;
}

export interface CreatePoolResult {
  pool: Pool;
  members: PoolMember[];
  poolSum: number;
}

export interface AdjustedCBResult {
  shipId: string;
  year: number;
  rawCb: number;
  bankedSurplus: number;
  adjustedCb: number;
}

export const TARGET_GHG_INTENSITY = 89.3368;

export const VESSEL_TYPES = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
export const FUEL_TYPES = ['HFO', 'LNG', 'MGO'];
export const YEARS = [2024, 2025];
export const SHIP_IDS = ['R001', 'R002', 'R003', 'R004', 'R005'];
