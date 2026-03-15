import { getPool } from './connection';

const SEED_SQL = `
-- reset before re-seeding
TRUNCATE TABLE pool_members, pools, bank_entries, ship_compliance, routes RESTART IDENTITY CASCADE;

-- routes from assignment brief
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
VALUES
  ('R001', 'Container',   'HFO', 2024, 91.0, 5000, 12000, 4500, TRUE),
  ('R002', 'BulkCarrier', 'LNG', 2024, 88.0, 4800, 11500, 4200, FALSE),
  ('R003', 'Tanker',      'MGO', 2024, 93.5, 5100, 12500, 4700, FALSE),
  ('R004', 'RoRo',        'HFO', 2025, 89.2, 4900, 11800, 4300, FALSE),
  ('R005', 'Container',   'LNG', 2025, 90.5, 4950, 11900, 4400, FALSE)
ON CONFLICT (route_id) DO NOTHING;
`;

async function seed(): Promise<void> {
  const pool = getPool();
  try {
    console.log('Seeding database...');
    await pool.query(SEED_SQL);
    console.log('✅ Seed complete');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);
