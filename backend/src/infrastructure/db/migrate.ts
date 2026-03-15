import { getPool } from './connection';

const MIGRATION_SQL = `
-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id    VARCHAR(20) UNIQUE NOT NULL,
  vessel_type VARCHAR(50) NOT NULL,
  fuel_type   VARCHAR(20) NOT NULL,
  year        INTEGER NOT NULL,
  ghg_intensity       NUMERIC(10,4) NOT NULL,
  fuel_consumption    NUMERIC(10,2) NOT NULL,
  distance            NUMERIC(10,2) NOT NULL,
  total_emissions     NUMERIC(10,2) NOT NULL,
  is_baseline         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ship compliance table
CREATE TABLE IF NOT EXISTS ship_compliance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id     VARCHAR(20) NOT NULL,
  year        INTEGER NOT NULL,
  cb_gco2eq   NUMERIC(15,4) NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ship_id, year)
);

-- Bank entries table
CREATE TABLE IF NOT EXISTS bank_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id         VARCHAR(20) NOT NULL,
  year            INTEGER NOT NULL,
  amount_gco2eq   NUMERIC(15,4) NOT NULL,
  applied         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year        INTEGER NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pool members table
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id     UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ship_id     VARCHAR(20) NOT NULL,
  cb_before   NUMERIC(15,4) NOT NULL,
  cb_after    NUMERIC(15,4) NOT NULL,
  PRIMARY KEY (pool_id, ship_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_routes_year ON routes(year);
CREATE INDEX IF NOT EXISTS idx_routes_vessel_type ON routes(vessel_type);
CREATE INDEX IF NOT EXISTS idx_routes_fuel_type ON routes(fuel_type);
CREATE INDEX IF NOT EXISTS idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_bank_entries_ship_year ON bank_entries(ship_id, year);
`;

async function migrate(): Promise<void> {
  const pool = getPool();
  try {
    console.log('Running migrations...');
    await pool.query(MIGRATION_SQL);
    console.log('✅ Migrations complete');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
