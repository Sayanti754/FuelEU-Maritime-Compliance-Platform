import {
  Route,
  ComparisonResult,
  ComplianceBalance,
  BankingResult,
  BankRecord,
  CreatePoolResult,
  AdjustedCBResult,
} from '../domain/types';

export interface PoolMemberInput {
  shipId: string;
}

export interface IRouteService {
  getRoutes(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<ComparisonResult[]>;
}

export interface IComplianceService {
  getCB(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCB(shipId: string, year: number): Promise<AdjustedCBResult>;
}

export interface IBankingService {
  getRecords(shipId: string, year: number): Promise<{ records: BankRecord[]; totalBanked: number }>;
  bank(shipId: string, year: number, amount: number): Promise<BankingResult>;
  apply(shipId: string, year: number, amount: number): Promise<BankingResult>;
}

export interface IPoolService {
  createPool(year: number, members: PoolMemberInput[]): Promise<CreatePoolResult>;
}
