import {
  Route,
  ComplianceBalance,
  BankEntry,
  Pool,
  PoolMember,
} from '../domain/entities';

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  findByFilters(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]>;
}

export interface IComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null>;
  upsert(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>): Promise<ComplianceBalance>;
}

export interface IBankRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  create(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  applyAmount(shipId: string, year: number, amount: number): Promise<void>;
}

export interface IPoolRepository {
  create(pool: Omit<Pool, 'id' | 'createdAt'>): Promise<Pool>;
  addMembers(members: PoolMember[]): Promise<void>;
  findById(poolId: string): Promise<Pool | null>;
  findMembersByPoolId(poolId: string): Promise<PoolMember[]>;
}
