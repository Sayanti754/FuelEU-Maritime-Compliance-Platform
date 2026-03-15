import { ComputeCBUseCase } from '../../core/application/use-cases/ComputeCB';
import { BankSurplusUseCase } from '../../core/application/use-cases/BankSurplus';
import { ApplyBankedUseCase } from '../../core/application/use-cases/ApplyBanked';
import { CreatePoolUseCase } from '../../core/application/use-cases/CreatePool';
import { ComputeComparisonUseCase } from '../../core/application/use-cases/ComputeComparison';
import {
  IRouteRepository,
  IComplianceRepository,
  IBankRepository,
  IPoolRepository,
} from '../../core/ports/repositories';
import { Route, ComplianceBalance, BankEntry, Pool, PoolMember } from '../../core/domain/entities';

function mockRouteRepo(overrides: Partial<IRouteRepository> = {}): IRouteRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findBaseline: jest.fn().mockResolvedValue(null),
    setBaseline: jest.fn().mockResolvedValue(null),
    findByFilters: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function mockComplianceRepo(overrides: Partial<IComplianceRepository> = {}): IComplianceRepository {
  return {
    findByShipAndYear: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockImplementation(async (cb) => ({ id: 'cb-1', computedAt: new Date(), ...cb })),
    ...overrides,
  };
}

function mockBankRepo(overrides: Partial<IBankRepository> = {}): IBankRepository {
  return {
    findByShipAndYear: jest.fn().mockResolvedValue([]),
    getTotalBanked: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(async (e) => ({ id: 'b-1', createdAt: new Date(), ...e })),
    applyAmount: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockPoolRepo(overrides: Partial<IPoolRepository> = {}): IPoolRepository {
  return {
    create: jest.fn().mockImplementation(async (p) => ({ id: 'pool-1', createdAt: new Date(), ...p })),
    addMembers: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findMembersByPoolId: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const sampleRoute = (overrides: Partial<Route> = {}): Route => ({
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
  createdAt: new Date(),
  ...overrides,
});

const sampleCB = (overrides: Partial<ComplianceBalance> = {}): ComplianceBalance => ({
  id: 'cb-1',
  shipId: 'R001',
  year: 2024,
  cbGco2eq: 50000,
  computedAt: new Date(),
  ...overrides,
});

describe('ComputeCBUseCase', () => {
  it('computes positive CB for below-target route', async () => {
    const route = sampleRoute({ routeId: 'R002', ghgIntensity: 88.0, fuelConsumption: 4800 });
    const routeRepo = mockRouteRepo({ findByFilters: jest.fn().mockResolvedValue([route]) });
    const complianceRepo = mockComplianceRepo();

    const uc = new ComputeCBUseCase(routeRepo, complianceRepo);
    const result = await uc.execute({ shipId: 'R002', year: 2024 });

    expect(result.cbGco2eq).toBeGreaterThan(0);
    expect(complianceRepo.upsert).toHaveBeenCalled();
  });

  it('computes negative CB for above-target route', async () => {
    const route = sampleRoute({ routeId: 'R001', ghgIntensity: 91.0, fuelConsumption: 5000 });
    const routeRepo = mockRouteRepo({ findByFilters: jest.fn().mockResolvedValue([route]) });
    const complianceRepo = mockComplianceRepo();

    const uc = new ComputeCBUseCase(routeRepo, complianceRepo);
    const result = await uc.execute({ shipId: 'R001', year: 2024 });

    expect(result.cbGco2eq).toBeLessThan(0);
  });

  it('throws if route not found', async () => {
    const routeRepo = mockRouteRepo({ findByFilters: jest.fn().mockResolvedValue([]) });
    const complianceRepo = mockComplianceRepo();
    const uc = new ComputeCBUseCase(routeRepo, complianceRepo);
    await expect(uc.execute({ shipId: 'MISSING', year: 2024 })).rejects.toThrow();
  });
});

describe('BankSurplusUseCase', () => {
  it('banks positive CB successfully', async () => {
    const cb = sampleCB({ cbGco2eq: 100000 });
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockResolvedValue(cb),
    });
    const bankRepo = mockBankRepo();

    const uc = new BankSurplusUseCase(complianceRepo, bankRepo);
    const result = await uc.execute({ shipId: 'R001', year: 2024, amount: 50000 });

    expect(result.cbBefore).toBe(100000);
    expect(result.applied).toBe(50000);
    expect(result.cbAfter).toBe(50000);
  });

  it('rejects banking when CB is non-positive', async () => {
    const cb = sampleCB({ cbGco2eq: -10000 });
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockResolvedValue(cb),
    });
    const uc = new BankSurplusUseCase(complianceRepo, mockBankRepo());
    await expect(uc.execute({ shipId: 'R001', year: 2024, amount: 5000 })).rejects.toThrow();
  });

  it('rejects amount exceeding surplus', async () => {
    const cb = sampleCB({ cbGco2eq: 10000 });
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockResolvedValue(cb),
    });
    const uc = new BankSurplusUseCase(complianceRepo, mockBankRepo());
    await expect(uc.execute({ shipId: 'R001', year: 2024, amount: 99999 })).rejects.toThrow();
  });
});

describe('ApplyBankedUseCase', () => {
  it('applies banked amount to deficit CB', async () => {
    const cb = sampleCB({ cbGco2eq: -30000 });
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockResolvedValue(cb),
    });
    const bankRepo = mockBankRepo({
      getTotalBanked: jest.fn().mockResolvedValue(50000),
    });

    const uc = new ApplyBankedUseCase(complianceRepo, bankRepo);
    const result = await uc.execute({ shipId: 'R001', year: 2024, amount: 30000 });

    expect(result.cbBefore).toBe(-30000);
    expect(result.applied).toBe(30000);
    expect(result.cbAfter).toBe(0);
  });

  it('rejects over-application', async () => {
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockResolvedValue(sampleCB()),
    });
    const bankRepo = mockBankRepo({
      getTotalBanked: jest.fn().mockResolvedValue(100),
    });
    const uc = new ApplyBankedUseCase(complianceRepo, bankRepo);
    await expect(uc.execute({ shipId: 'R001', year: 2024, amount: 999 })).rejects.toThrow();
  });
});

describe('CreatePoolUseCase', () => {
  it('creates valid pool with surplus + deficit ships', async () => {
    const cbMap: Record<string, number> = {
      'R002': 50000,   // surplus
      'R001': -20000,  // deficit
    };
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockImplementation(async (shipId, year) => ({
        id: 'cb-x',
        shipId,
        year,
        cbGco2eq: cbMap[shipId] ?? 0,
        computedAt: new Date(),
      })),
    });

    const uc = new CreatePoolUseCase(complianceRepo, mockPoolRepo());
    const result = await uc.execute({
      year: 2024,
      members: [{ shipId: 'R002' }, { shipId: 'R001' }],
    });

    expect(result.pool).toBeDefined();
    expect(result.members.length).toBe(2);
    expect(result.poolSum).toBeGreaterThanOrEqual(0);

    const deficitMember = result.members.find((m) => m.shipId === 'R001');
    expect(deficitMember!.cbAfter).toBeGreaterThanOrEqual(deficitMember!.cbBefore);
  });

  it('rejects pool when total CB is negative', async () => {
    const complianceRepo = mockComplianceRepo({
      findByShipAndYear: jest.fn().mockImplementation(async (shipId) => ({
        id: 'cb-x', shipId, year: 2024, cbGco2eq: -10000, computedAt: new Date(),
      })),
    });

    const uc = new CreatePoolUseCase(complianceRepo, mockPoolRepo());
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'R001' }, { shipId: 'R003' }] })
    ).rejects.toThrow();
  });

  it('rejects pool with fewer than 2 members', async () => {
    const uc = new CreatePoolUseCase(mockComplianceRepo(), mockPoolRepo());
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'R001' }] })
    ).rejects.toThrow();
  });
});

describe('ComputeComparisonUseCase', () => {
  it('computes percent diff and compliance for each non-baseline route', async () => {
    const baseline = sampleRoute({ isBaseline: true, ghgIntensity: 91.0 });
    const comp1 = sampleRoute({ routeId: 'R002', ghgIntensity: 88.0, isBaseline: false });
    const comp2 = sampleRoute({ routeId: 'R003', ghgIntensity: 93.5, isBaseline: false });

    const routeRepo = mockRouteRepo({
      findBaseline: jest.fn().mockResolvedValue(baseline),
      findAll: jest.fn().mockResolvedValue([baseline, comp1, comp2]),
    });

    const uc = new ComputeComparisonUseCase(routeRepo);
    const results = await uc.execute();

    expect(results.length).toBe(2);
    const r1 = results.find((r) => r.comparison.routeId === 'R002')!;
    expect(r1.compliant).toBe(true);   // 88 < 89.3368
    const r2 = results.find((r) => r.comparison.routeId === 'R003')!;
    expect(r2.compliant).toBe(false);  // 93.5 > 89.3368
  });

  it('throws when no baseline is set', async () => {
    const routeRepo = mockRouteRepo({ findBaseline: jest.fn().mockResolvedValue(null) });
    const uc = new ComputeComparisonUseCase(routeRepo);
    await expect(uc.execute()).rejects.toThrow();
  });
});
