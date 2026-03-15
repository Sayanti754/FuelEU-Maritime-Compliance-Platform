import { Pool, PoolMember } from '../../domain/entities';
import {
  IComplianceRepository,
  IPoolRepository,
} from '../../ports/repositories';

export interface PoolMemberInput {
  shipId: string;
}

export interface CreatePoolInput {
  year: number;
  members: PoolMemberInput[];
}

export interface CreatePoolResult {
  pool: Pool;
  members: PoolMember[];
  poolSum: number;
}

export class CreatePoolUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly poolRepo: IPoolRepository
  ) {}

  async execute({ year, members }: CreatePoolInput): Promise<CreatePoolResult> {
    if (members.length < 2) {
      throw new Error('A pool requires at least 2 members');
    }

    const cbMap: Record<string, number> = {};
    for (const m of members) {
      const cb = await this.complianceRepo.findByShipAndYear(m.shipId, year);
      if (!cb) {
        throw new Error(`No compliance balance found for ship "${m.shipId}" in year ${year}. Compute CB first.`);
      }
      cbMap[m.shipId] = cb.cbGco2eq;
    }

    const poolSum = Object.values(cbMap).reduce((a, b) => a + b, 0);
    if (poolSum < 0) {
      throw new Error(
        `Pool is invalid: total compliance balance (${poolSum.toFixed(2)}) is negative. Sum must be ≥ 0.`
      );
    }

    // greedy: sort high→low, drain surplus into deficits
    const sorted = [...members].sort((a, b) => cbMap[b.shipId] - cbMap[a.shipId]);
    const cbAfterMap: Record<string, number> = { ...cbMap };

    for (const surplusShip of sorted) {
      if (cbAfterMap[surplusShip.shipId] <= 0) break;
      for (const deficitShip of sorted.slice().reverse()) {
        if (cbAfterMap[deficitShip.shipId] >= 0) continue;
        if (cbAfterMap[surplusShip.shipId] <= 0) break;

        const needed = Math.abs(cbAfterMap[deficitShip.shipId]);
        const available = cbAfterMap[surplusShip.shipId];
        const transfer = Math.min(needed, available);

        cbAfterMap[surplusShip.shipId] -= transfer;
        cbAfterMap[deficitShip.shipId] += transfer;
      }
    }

    for (const m of members) {
      const before = cbMap[m.shipId];
      const after = cbAfterMap[m.shipId];

      // deficit ship cannot exit worse
      if (before < 0 && after < before) {
        throw new Error(
          `Pool invalid: deficit ship "${m.shipId}" would exit worse (${before.toFixed(2)} → ${after.toFixed(2)})`
        );
      }
      // surplus ship cannot exit negative
      if (before > 0 && after < 0) {
        throw new Error(
          `Pool invalid: surplus ship "${m.shipId}" would exit negative (${before.toFixed(2)} → ${after.toFixed(2)})`
        );
      }
    }

    const pool = await this.poolRepo.create({ year });
    const poolMembers: PoolMember[] = members.map((m) => ({
      poolId: pool.id,
      shipId: m.shipId,
      cbBefore: cbMap[m.shipId],
      cbAfter: cbAfterMap[m.shipId],
    }));

    await this.poolRepo.addMembers(poolMembers);

    for (const m of members) {
      await this.complianceRepo.upsert({
        shipId: m.shipId,
        year,
        cbGco2eq: cbAfterMap[m.shipId],
      });
    }

    return { pool, members: poolMembers, poolSum };
  }
}
