import { renderHook, act } from '@testing-library/react';
import { useRoutes, useComparison } from '../adapters/ui/hooks/useRoutes';
import { useBanking } from '../adapters/ui/hooks/useBanking';
import { usePooling } from '../adapters/ui/hooks/usePooling';
import * as apiClient from '../adapters/infrastructure/apiClient';
import { TARGET_GHG_INTENSITY } from '../core/domain/types';

jest.mock('../adapters/infrastructure/apiClient');
const mockApi = apiClient as jest.Mocked<typeof apiClient>;

const mockRoute = (overrides = {}) => ({
  id: 'uuid-1',
  routeId: 'R001',
  vesselType: 'Container',
  fuelType: 'HFO',
  year: 2024,
  ghgIntensity: 91.0,
  fuelConsumption: 5000,
  distance: 12000,
  totalEmissions: 4500,
  isBaseline: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('Domain constants', () => {
  it('TARGET_GHG_INTENSITY equals 89.3368', () => {
    expect(TARGET_GHG_INTENSITY).toBe(89.3368);
  });
});

describe('useRoutes hook', () => {
  beforeEach(() => {
    mockApi.routeService = {
      getRoutes: jest.fn().mockResolvedValue([mockRoute()]),
      setBaseline: jest.fn().mockResolvedValue(mockRoute({ isBaseline: true })),
      getComparison: jest.fn().mockResolvedValue([]),
    };
  });

  it('fetches routes on mount', async () => {
    const { result } = renderHook(() => useRoutes());
    expect(result.current.loading).toBe(true);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(result.current.routes).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('sets baseline and refetches', async () => {
    const { result } = renderHook(() => useRoutes());
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    await act(async () => { await result.current.setBaseline('R001'); });
    expect(mockApi.routeService.setBaseline).toHaveBeenCalledWith('R001');
  });

  it('handles errors gracefully', async () => {
    mockApi.routeService.getRoutes = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useRoutes());
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(result.current.error).toBe('Network error');
  });
});

describe('useComparison hook', () => {
  it('fetches comparison data on mount', async () => {
    mockApi.routeService = {
      getRoutes: jest.fn(),
      setBaseline: jest.fn(),
      getComparison: jest.fn().mockResolvedValue([
        {
          baseline: mockRoute({ isBaseline: true }),
          comparison: mockRoute({ routeId: 'R002', ghgIntensity: 88.0 }),
          percentDiff: -3.3,
          compliant: true,
        },
      ]),
    };

    const { result } = renderHook(() => useComparison());
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(result.current.comparisons).toHaveLength(1);
    expect(result.current.comparisons[0].compliant).toBe(true);
  });
});

describe('useBanking hook', () => {
  const mockCB = {
    id: 'cb-1', shipId: 'R001', year: 2024, cbGco2eq: 100000, computedAt: new Date().toISOString()
  };
  const mockBankResult = { cbBefore: 100000, applied: 50000, cbAfter: 50000 };

  beforeEach(() => {
    mockApi.complianceService = {
      getCB: jest.fn().mockResolvedValue(mockCB),
      getAdjustedCB: jest.fn(),
    };
    mockApi.bankingService = {
      getRecords: jest.fn().mockResolvedValue({ records: [], totalBanked: 0 }),
      bank: jest.fn().mockResolvedValue(mockBankResult),
      apply: jest.fn().mockResolvedValue({ cbBefore: -30000, applied: 30000, cbAfter: 0 }),
    };
  });

  it('fetches CB and bank records', async () => {
    const { result } = renderHook(() => useBanking());
    await act(async () => { await result.current.fetchCB('R001', 2024); });
    expect(result.current.cb?.cbGco2eq).toBe(100000);
  });

  it('banks surplus and updates state', async () => {
    const { result } = renderHook(() => useBanking());
    await act(async () => { await result.current.fetchCB('R001', 2024); });
    await act(async () => { await result.current.bank('R001', 2024, 50000); });
    expect(result.current.lastResult?.applied).toBe(50000);
  });
});

describe('usePooling hook', () => {
  beforeEach(() => {
    mockApi.complianceService = {
      getCB: jest.fn(),
      getAdjustedCB: jest.fn().mockResolvedValue({
        shipId: 'R001', year: 2024, rawCb: 50000, bankedSurplus: 0, adjustedCb: 50000
      }),
    };
    mockApi.poolService = {
      createPool: jest.fn().mockResolvedValue({
        pool: { id: 'pool-1', year: 2024, createdAt: new Date().toISOString() },
        members: [],
        poolSum: 30000,
      }),
    };
  });

  it('adds and removes members', () => {
    const { result } = renderHook(() => usePooling());
    act(() => { result.current.addMember('R001'); });
    expect(result.current.members).toHaveLength(1);
    act(() => { result.current.addMember('R001'); }); // duplicate
    expect(result.current.members).toHaveLength(1);
    act(() => { result.current.removeMember('R001'); });
    expect(result.current.members).toHaveLength(0);
  });

  it('isValid is false with fewer than 2 members', () => {
    const { result } = renderHook(() => usePooling());
    act(() => { result.current.addMember('R001'); });
    expect(result.current.isValid).toBe(false);
  });

  it('computes poolSum from adjustedCBs', async () => {
    const { result } = renderHook(() => usePooling());
    act(() => { result.current.addMember('R001'); });
    await act(async () => { await result.current.loadAdjustedCB('R001', 2024); });
    expect(result.current.poolSum).toBe(50000);
  });
});
