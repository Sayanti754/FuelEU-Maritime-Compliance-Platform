import { Pool } from 'pg';
import { BankEntry } from '../../../core/domain/entities';
import { IBankRepository } from '../../../core/ports/repositories';

function rowToEntry(row: Record<string, unknown>): BankEntry {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: Number(row.year),
    amountGco2eq: Number(row.amount_gco2eq),
    createdAt: new Date(row.created_at as string),
  };
}

export class PostgresBankRepository implements IBankRepository {
  constructor(private readonly pool: Pool) {}

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM bank_entries
       WHERE ship_id = $1 AND year = $2
       ORDER BY created_at DESC`,
      [shipId, year]
    );
    return rows.map(rowToEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COALESCE(SUM(amount_gco2eq), 0) AS total
       FROM bank_entries
       WHERE ship_id = $1 AND year = $2 AND applied = FALSE`,
      [shipId, year]
    );
    return Number(rows[0].total);
  }

  async create(
    entry: Omit<BankEntry, 'id' | 'createdAt'>
  ): Promise<BankEntry> {
    const { rows } = await this.pool.query(
      `INSERT INTO bank_entries (ship_id, year, amount_gco2eq)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [entry.shipId, entry.year, entry.amountGco2eq]
    );
    return rowToEntry(rows[0]);
  }

  async applyAmount(
    shipId: string,
    year: number,
    amount: number
  ): Promise<void> {
    // Mark oldest un-applied entries as applied up to `amount`
    const { rows } = await this.pool.query(
      `SELECT id, amount_gco2eq FROM bank_entries
       WHERE ship_id = $1 AND year = $2 AND applied = FALSE
       ORDER BY created_at ASC`,
      [shipId, year]
    );

    let remaining = amount;
    for (const row of rows) {
      if (remaining <= 0) break;
      const entryAmount = Number(row.amount_gco2eq);
      if (entryAmount <= remaining) {
        await this.pool.query(
          'UPDATE bank_entries SET applied = TRUE WHERE id = $1',
          [row.id]
        );
        remaining -= entryAmount;
      } else {
        // Partial: split the entry
        await this.pool.query(
          'UPDATE bank_entries SET amount_gco2eq = $1 WHERE id = $2',
          [entryAmount - remaining, row.id]
        );
        remaining = 0;
      }
    }
  }
}
