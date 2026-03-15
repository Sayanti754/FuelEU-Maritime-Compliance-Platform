import { Pool as PgPool } from 'pg';
import { Pool, PoolMember } from '../../../core/domain/entities';
import { IPoolRepository } from '../../../core/ports/repositories';

export class PostgresPoolRepository implements IPoolRepository {
  constructor(private readonly pool: PgPool) {}

  async create(data: Omit<Pool, 'id' | 'createdAt'>): Promise<Pool> {
    const { rows } = await this.pool.query(
      'INSERT INTO pools (year) VALUES ($1) RETURNING *',
      [data.year]
    );
    return {
      id: rows[0].id as string,
      year: Number(rows[0].year),
      createdAt: new Date(rows[0].created_at as string),
    };
  }

  async addMembers(members: PoolMember[]): Promise<void> {
    for (const m of members) {
      await this.pool.query(
        `INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (pool_id, ship_id) DO NOTHING`,
        [m.poolId, m.shipId, m.cbBefore, m.cbAfter]
      );
    }
  }

  async findById(poolId: string): Promise<Pool | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM pools WHERE id = $1',
      [poolId]
    );
    if (!rows.length) return null;
    return {
      id: rows[0].id as string,
      year: Number(rows[0].year),
      createdAt: new Date(rows[0].created_at as string),
    };
  }

  async findMembersByPoolId(poolId: string): Promise<PoolMember[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM pool_members WHERE pool_id = $1',
      [poolId]
    );
    return rows.map((r) => ({
      poolId: r.pool_id as string,
      shipId: r.ship_id as string,
      cbBefore: Number(r.cb_before),
      cbAfter: Number(r.cb_after),
    }));
  }
}
