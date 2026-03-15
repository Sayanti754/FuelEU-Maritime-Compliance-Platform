import { Pool } from 'pg';
import { Route } from '../../../core/domain/entities';
import { IRouteRepository } from '../../../core/ports/repositories';

function rowToRoute(row: Record<string, unknown>): Route {
  return {
    id: row.id as string,
    routeId: row.route_id as string,
    vesselType: row.vessel_type as string,
    fuelType: row.fuel_type as string,
    year: Number(row.year),
    ghgIntensity: Number(row.ghg_intensity),
    fuelConsumption: Number(row.fuel_consumption),
    distance: Number(row.distance),
    totalEmissions: Number(row.total_emissions),
    isBaseline: Boolean(row.is_baseline),
    createdAt: new Date(row.created_at as string),
  };
}

export class PostgresRouteRepository implements IRouteRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Route[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM routes ORDER BY year, route_id'
    );
    return rows.map(rowToRoute);
  }

  async findById(id: string): Promise<Route | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM routes WHERE id = $1 OR route_id = $1 LIMIT 1',
      [id]
    );
    return rows.length ? rowToRoute(rows[0]) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM routes WHERE is_baseline = TRUE LIMIT 1'
    );
    return rows.length ? rowToRoute(rows[0]) : null;
  }

  async setBaseline(routeId: string): Promise<Route> {
    await this.pool.query('UPDATE routes SET is_baseline = FALSE');
    const { rows } = await this.pool.query(
      `UPDATE routes
       SET is_baseline = TRUE
       WHERE id = $1 OR route_id = $1
       RETURNING *`,
      [routeId]
    );
    if (!rows.length) throw new Error(`Route "${routeId}" not found`);
    return rowToRoute(rows[0]);
  }

  async findByFilters(filters: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.vesselType) {
      conditions.push(`vessel_type ILIKE $${idx++}`);
      params.push(filters.vesselType);
    }
    if (filters.fuelType) {
      conditions.push(`fuel_type ILIKE $${idx++}`);
      params.push(filters.fuelType);
    }
    if (filters.year) {
      conditions.push(`year = $${idx++}`);
      params.push(filters.year);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.pool.query(
      `SELECT * FROM routes ${where} ORDER BY year, route_id`,
      params
    );
    return rows.map(rowToRoute);
  }
}
