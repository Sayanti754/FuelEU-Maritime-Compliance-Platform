import { Router, Request, Response, NextFunction } from 'express';
import { IRouteRepository } from '../../../../core/ports/repositories';
import { GetRoutesUseCase } from '../../../../core/application/use-cases/GetRoutes';
import { SetBaselineUseCase } from '../../../../core/application/use-cases/SetBaseline';
import { ComputeComparisonUseCase } from '../../../../core/application/use-cases/ComputeComparison';

export function createRoutesRouter(routeRepo: IRouteRepository): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { vesselType, fuelType, year } = req.query;
      const uc = new GetRoutesUseCase(routeRepo);
      const routes = await uc.execute({
        vesselType: vesselType as string | undefined,
        fuelType: fuelType as string | undefined,
        year: year ? Number(year) : undefined,
      });
      res.json({ data: routes });
    } catch (err) {
      next(err);
    }
  });

  // must be registered before /:id to avoid Express matching "comparison" as an id param
  router.get(
    '/comparison',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const uc = new ComputeComparisonUseCase(routeRepo);
        const results = await uc.execute();
        res.json({ data: results });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/:id/baseline',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const uc = new SetBaselineUseCase(routeRepo);
        const route = await uc.execute(req.params.id);
        res.json({ data: route });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
