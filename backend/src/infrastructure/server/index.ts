import * as dotenv from 'dotenv';
dotenv.config();

import { getPool } from '../db/connection';
import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3001;

async function start(): Promise<void> {
  const pgPool = getPool();
  const app = createApp(pgPool);

  app.listen(PORT, () => {
    console.log(`🚢 FuelEU Maritime API running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    await pgPool.end();
    process.exit(0);
  });
}

start().catch(console.error);
