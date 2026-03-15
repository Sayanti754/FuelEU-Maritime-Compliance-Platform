import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PostgresRouteRepository } from '../../adapters/outbound/postgres/RouteRepository';
import { PostgresComplianceRepository } from '../../adapters/outbound/postgres/ComplianceRepository';
import { PostgresBankRepository } from '../../adapters/outbound/postgres/BankRepository';
import { PostgresPoolRepository } from '../../adapters/outbound/postgres/PoolRepository';
import { createRoutesRouter } from '../../adapters/inbound/http/routes/routesRouter';
import { createComplianceRouter } from '../../adapters/inbound/http/routes/complianceRouter';
import { createBankingRouter } from '../../adapters/inbound/http/routes/bankingRouter';
import { createPoolsRouter } from '../../adapters/inbound/http/routes/poolsRouter';

export function createApp(pgPool: Pool): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const routeRepo = new PostgresRouteRepository(pgPool);
  const complianceRepo = new PostgresComplianceRepository(pgPool);
  const bankRepo = new PostgresBankRepository(pgPool);
  const poolRepo = new PostgresPoolRepository(pgPool);

  app.use('/routes', createRoutesRouter(routeRepo));
  app.use(
    '/compliance',
    createComplianceRouter(routeRepo, complianceRepo, bankRepo)
  );
  app.use('/banking', createBankingRouter(complianceRepo, bankRepo));
  app.use('/pools', createPoolsRouter(complianceRepo, poolRepo));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.message);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: err.message });
  });

  return app;
}
