import { Pool } from 'pg';
import { ComplianceBalance } from '../../../core/domain/entities';
import { IComplianceRepository } from '../../../core/ports/repositories';

function rowToCB(row: Record<string, unknown>): ComplianceBalance {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: Number(row.year),
    cbGco2eq: Number(row.cb_gco2eq),
    computedAt: new Date(row.computed_at as string),
  };
}

export class PostgresComplianceRepository implements IComplianceRepository {
  constructor(private readonly pool: Pool) {}

  async findByShipAndYear(
    shipId: string,
    year: number
  ): Promise<ComplianceBalance | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM ship_compliance WHERE ship_id = $1 AND year = $2 LIMIT 1',
      [shipId, year]
    );
    return rows.length ? rowToCB(rows[0]) : null;
  }

  async upsert(
    cb: Omit<ComplianceBalance, 'id' | 'computedAt'>
  ): Promise<ComplianceBalance> {
    const { rows } = await this.pool.query(
      `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq, computed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (ship_id, year)
       DO UPDATE SET cb_gco2eq = EXCLUDED.cb_gco2eq, computed_at = NOW()
       RETURNING *`,
      [cb.shipId, cb.year, cb.cbGco2eq]
    );
    return rowToCB(rows[0]);
  }
}
