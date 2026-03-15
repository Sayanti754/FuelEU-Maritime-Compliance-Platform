import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import { Route, ComplianceBalance, BankEntry, Pool as PoolEntity, PoolMember } from '../../core/domain/entities';
import { IRouteRepository, IComplianceRepository, IBankRepository, IPoolRepository } from '../../core/ports/repositories';
import { createRoutesRouter } from '../../adapters/inbound/http/routes/routesRouter';
import { createComplianceRouter } from '../../adapters/inbound/http/routes/complianceRouter';
import { createBankingRouter } from '../../adapters/inbound/http/routes/bankingRouter';
import { createPoolsRouter } from '../../adapters/inbound/http/routes/poolsRouter';

const baseRoute: Route = {
  id: 'uuid-r001', routeId: 'R001', vesselType: 'Container', fuelType: 'HFO',
  year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000,
  totalEmissions: 4500, isBaseline: true, createdAt: new Date(),
};
const route2: Route = {
  id: 'uuid-r002', routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG',
  year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500,
  totalEmissions: 4200, isBaseline: false, createdAt: new Date(),
};

class InMemoryRouteRepo implements IRouteRepository {
  private routes: Route[] = [baseRoute, route2];
  async findAll() { return [...this.routes]; }
  async findById(id: string) { return this.routes.find(r => r.id === id || r.routeId === id) ?? null; }
  async findBaseline() { return this.routes.find(r => r.isBaseline) ?? null; }
  async setBaseline(routeId: string) {
    this.routes = this.routes.map(r => ({ ...r, isBaseline: r.routeId === routeId || r.id === routeId }));
    const found = this.routes.find(r => r.routeId === routeId || r.id === routeId);
    if (!found) throw new Error('Route not found');
    return found;
  }
  async findByFilters(filters: { vesselType?: string; fuelType?: string; year?: number }) {
    return this.routes.filter(r => {
      if (filters.vesselType && r.vesselType.toLowerCase() !== filters.vesselType.toLowerCase()) return false;
      if (filters.fuelType && r.fuelType.toLowerCase() !== filters.fuelType.toLowerCase()) return false;
      if (filters.year && r.year !== filters.year) return false;
      return true;
    });
  }
}

class InMemoryComplianceRepo implements IComplianceRepository {
  private records = new Map<string, ComplianceBalance>();
  async findByShipAndYear(shipId: string, year: number) {
    return this.records.get(`${shipId}:${year}`) ?? null;
  }
  async upsert(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>) {
    const record: ComplianceBalance = { id: `cb-${cb.shipId}`, computedAt: new Date(), ...cb };
    this.records.set(`${cb.shipId}:${cb.year}`, record);
    return record;
  }
}

class InMemoryBankRepo implements IBankRepository {
  private entries: (BankEntry & { applied: boolean })[] = [];
  async findByShipAndYear(shipId: string, year: number) {
    return this.entries.filter(e => e.shipId === shipId && e.year === year);
  }
  async getTotalBanked(shipId: string, year: number) {
    return this.entries
      .filter(e => e.shipId === shipId && e.year === year && !e.applied)
      .reduce((sum, e) => sum + e.amountGco2eq, 0);
  }
  async create(entry: Omit<BankEntry, 'id' | 'createdAt'>) {
    const e = { id: `b-${Date.now()}`, createdAt: new Date(), applied: false, ...entry };
    this.entries.push(e);
    return e;
  }
  async applyAmount(_shipId: string, _year: number, amount: number) {
    let remaining = amount;
    for (const e of this.entries) {
      if (remaining <= 0) break;
      if (e.amountGco2eq <= remaining) { remaining -= e.amountGco2eq; e.applied = true; }
      else { e.amountGco2eq -= remaining; remaining = 0; }
    }
  }
}

class InMemoryPoolRepo implements IPoolRepository {
  private pools: PoolEntity[] = [];
  private members: PoolMember[] = [];
  async create(data: Omit<PoolEntity, 'id' | 'createdAt'>) {
    const pool: PoolEntity = { id: `pool-${Date.now()}`, createdAt: new Date(), ...data };
    this.pools.push(pool);
    return pool;
  }
  async addMembers(members: PoolMember[]) { this.members.push(...members); }
  async findById(poolId: string) { return this.pools.find(p => p.id === poolId) ?? null; }
  async findMembersByPoolId(poolId: string) { return this.members.filter(m => m.poolId === poolId); }
}

function buildApp(overrides: { complianceRepo?: IComplianceRepository; routeRepo?: IRouteRepository } = {}): Application {
  const routeRepo = overrides.routeRepo ?? new InMemoryRouteRepo();
  const complianceRepo = overrides.complianceRepo ?? new InMemoryComplianceRepo();
  const bankRepo = new InMemoryBankRepo();
  const poolRepo = new InMemoryPoolRepo();
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/routes', createRoutesRouter(routeRepo));
  app.use('/compliance', createComplianceRouter(routeRepo, complianceRepo, bankRepo));
  app.use('/banking', createBankingRouter(complianceRepo, bankRepo));
  app.use('/pools', createPoolsRouter(complianceRepo, poolRepo));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: err.message });
  });
  return app;
}

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /routes', () => {
  it('returns all routes', async () => {
    const res = await request(buildApp()).get('/routes');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
  it('filters by fuelType', async () => {
    const res = await request(buildApp()).get('/routes?fuelType=LNG');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: Route) => r.fuelType === 'LNG')).toBe(true);
  });
  it('filters by year', async () => {
    const res = await request(buildApp()).get('/routes?year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: Route) => r.year === 2024)).toBe(true);
  });
});

describe('POST /routes/:id/baseline', () => {
  it('sets a new baseline', async () => {
    const res = await request(buildApp()).post('/routes/R002/baseline');
    expect(res.status).toBe(200);
    expect(res.body.data.routeId).toBe('R002');
    expect(res.body.data.isBaseline).toBe(true);
  });
  it('returns 400 for unknown route', async () => {
    const res = await request(buildApp()).post('/routes/UNKNOWN/baseline');
    expect(res.status).toBe(400);
  });
});

describe('GET /routes/comparison', () => {
  it('returns comparison results with baseline set', async () => {
    const res = await request(buildApp()).get('/routes/comparison');
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('percentDiff');
    expect(res.body.data[0]).toHaveProperty('compliant');
  });
  it('returns 400 when no baseline exists', async () => {
    const noBaselineRepo: IRouteRepository = {
      findAll: async () => [route2],
      findById: async () => null,
      findBaseline: async () => null,
      setBaseline: async () => { throw new Error('not found'); },
      findByFilters: async () => [route2],
    };
    const res = await request(buildApp({ routeRepo: noBaselineRepo })).get('/routes/comparison');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/baseline/i);
  });
});

describe('GET /compliance/cb', () => {
  it('returns surplus CB for below-target route', async () => {
    const res = await request(buildApp()).get('/compliance/cb?shipId=R002&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data.cbGco2eq).toBeGreaterThan(0);
  });
  it('returns deficit CB for above-target route', async () => {
    const res = await request(buildApp()).get('/compliance/cb?shipId=R001&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data.cbGco2eq).toBeLessThan(0);
  });
  it('returns 400 when params missing', async () => {
    const res = await request(buildApp()).get('/compliance/cb?shipId=R002');
    expect(res.status).toBe(400);
  });
  it('returns 400 for unknown shipId', async () => {
    const res = await request(buildApp()).get('/compliance/cb?shipId=UNKNOWN&year=2024');
    expect(res.status).toBe(400);
  });
});

describe('GET /compliance/adjusted-cb', () => {
  it('returns adjusted CB with banked surplus fields', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
    const res = await request(app).get('/compliance/adjusted-cb?shipId=R002&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('adjustedCb');
    expect(res.body.data).toHaveProperty('bankedSurplus');
    expect(res.body.data).toHaveProperty('rawCb');
  });
});

describe('POST /banking/bank', () => {
  it('banks surplus successfully', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
    const res = await request(app).post('/banking/bank').send({ shipId: 'R002', year: 2024, amount: 100000 });
    expect(res.status).toBe(200);
    expect(res.body.data.applied).toBe(100000);
    expect(res.body.data.cbAfter).toBeLessThan(res.body.data.cbBefore);
  });
  it('returns 400 for missing fields', async () => {
    const res = await request(buildApp()).post('/banking/bank').send({ shipId: 'R002' });
    expect(res.status).toBe(400);
  });
  it('returns 400 when CB is not positive', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R001&year=2024');
    const res = await request(app).post('/banking/bank').send({ shipId: 'R001', year: 2024, amount: 5000 });
    expect(res.status).toBe(400);
  });
});

describe('POST /banking/apply', () => {
  it('applies banked amount to CB', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
    await request(app).post('/banking/bank').send({ shipId: 'R002', year: 2024, amount: 100000 });
    const res = await request(app).post('/banking/apply').send({ shipId: 'R002', year: 2024, amount: 50000 });
    expect(res.status).toBe(200);
    expect(res.body.data.applied).toBe(50000);
  });
  it('returns 400 when amount exceeds banked total', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
    const res = await request(app).post('/banking/apply').send({ shipId: 'R002', year: 2024, amount: 9999999 });
    expect(res.status).toBe(400);
  });
});

describe('POST /pools', () => {
  it('creates a valid pool', async () => {
    const app = buildApp();
    await request(app).get('/compliance/cb?shipId=R002&year=2024');
    await request(app).get('/compliance/cb?shipId=R001&year=2024');
    const res = await request(app).post('/pools').send({ year: 2024, members: [{ shipId: 'R002' }, { shipId: 'R001' }] });
    expect(res.status).toBe(201);
    expect(res.body.data.pool).toBeDefined();
    expect(res.body.data.members).toHaveLength(2);
    expect(res.body.data.poolSum).toBeGreaterThanOrEqual(0);
  });
  it('returns 400 when pool sum is negative', async () => {
    const allDeficit: IComplianceRepository = {
      findByShipAndYear: async (shipId, year) => ({ id: 'cx', shipId, year, cbGco2eq: -10000, computedAt: new Date() }),
      upsert: async (cb) => ({ id: 'cx', computedAt: new Date(), ...cb }),
    };
    const res = await request(buildApp({ complianceRepo: allDeficit }))
      .post('/pools').send({ year: 2024, members: [{ shipId: 'R001' }, { shipId: 'R003' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/negative/i);
  });
  it('returns 400 with fewer than 2 members', async () => {
    const res = await request(buildApp()).post('/pools').send({ year: 2024, members: [{ shipId: 'R001' }] });
    expect(res.status).toBe(400);
  });
  it('returns 400 when members field is missing', async () => {
    const res = await request(buildApp()).post('/pools').send({ year: 2024 });
    expect(res.status).toBe(400);
  });
});
