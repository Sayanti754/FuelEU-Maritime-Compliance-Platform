import { Router, Request, Response, NextFunction } from 'express';
import {
  IRouteRepository,
  IComplianceRepository,
  IBankRepository,
} from '../../../../core/ports/repositories';
import { ComputeCBUseCase } from '../../../../core/application/use-cases/ComputeCB';
import { GetAdjustedCBUseCase } from '../../../../core/application/use-cases/GetAdjustedCB';

export function createComplianceRouter(
  routeRepo: IRouteRepository,
  complianceRepo: IComplianceRepository,
  bankRepo: IBankRepository
): Router {
  const router = Router();

  router.get('/cb', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const uc = new ComputeCBUseCase(routeRepo, complianceRepo);
      const result = await uc.execute({
        shipId: shipId as string,
        year: Number(year),
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.get(
    '/adjusted-cb',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shipId, year } = req.query;
        if (!shipId || !year) {
          return res.status(400).json({ error: 'shipId and year are required' });
        }
        const uc = new GetAdjustedCBUseCase(complianceRepo, bankRepo);
        const result = await uc.execute({
          shipId: shipId as string,
          year: Number(year),
        });
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
