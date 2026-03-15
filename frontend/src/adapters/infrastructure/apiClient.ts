import axios, { AxiosInstance } from 'axios';
import {
  Route,
  ComparisonResult,
  ComplianceBalance,
  BankingResult,
  BankRecord,
  CreatePoolResult,
  AdjustedCBResult,
} from '../../core/domain/types';
import {
  IRouteService,
  IComplianceService,
  IBankingService,
  IPoolService,
  PoolMemberInput,
} from '../../core/ports/services';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001';

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const routeService: IRouteService = {
  async getRoutes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.vesselType) params.set('vesselType', filters.vesselType);
    if (filters.fuelType) params.set('fuelType', filters.fuelType);
    if (filters.year) params.set('year', String(filters.year));
    const { data } = await http.get<{ data: Route[] }>(`/routes?${params}`);
    return data.data;
  },

  async setBaseline(routeId: string) {
    const { data } = await http.post<{ data: Route }>(`/routes/${routeId}/baseline`);
    return data.data;
  },

  async getComparison() {
    const { data } = await http.get<{ data: ComparisonResult[] }>('/routes/comparison');
    return data.data;
  },
};

export const complianceService: IComplianceService = {
  async getCB(shipId: string, year: number) {
    const { data } = await http.get<{ data: ComplianceBalance }>(
      `/compliance/cb?shipId=${shipId}&year=${year}`
    );
    return data.data;
  },

  async getAdjustedCB(shipId: string, year: number) {
    const { data } = await http.get<{ data: AdjustedCBResult }>(
      `/compliance/adjusted-cb?shipId=${shipId}&year=${year}`
    );
    return data.data;
  },
};

export const bankingService: IBankingService = {
  async getRecords(shipId: string, year: number) {
    const { data } = await http.get<{
      data: { records: BankRecord[]; totalBanked: number };
    }>(`/banking/records?shipId=${shipId}&year=${year}`);
    return data.data;
  },

  async bank(shipId: string, year: number, amount: number) {
    const { data } = await http.post<{ data: BankingResult }>('/banking/bank', {
      shipId,
      year,
      amount,
    });
    return data.data;
  },

  async apply(shipId: string, year: number, amount: number) {
    const { data } = await http.post<{ data: BankingResult }>('/banking/apply', {
      shipId,
      year,
      amount,
    });
    return data.data;
  },
};

export const poolService: IPoolService = {
  async createPool(year: number, members: PoolMemberInput[]) {
    const { data } = await http.post<{ data: CreatePoolResult }>('/pools', {
      year,
      members,
    });
    return data.data;
  },
};
