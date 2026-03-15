import { Router, Request, Response, NextFunction } from 'express';
import {
  IComplianceRepository,
  IPoolRepository,
} from '../../../../core/ports/repositories';
import { CreatePoolUseCase } from '../../../../core/application/use-cases/CreatePool';

export function createPoolsRouter(
  complianceRepo: IComplianceRepository,
  poolRepo: IPoolRepository
): Router {
  const router = Router();

  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { year, members } = req.body;
        if (!year || !members || !Array.isArray(members)) {
          return res
            .status(400)
            .json({ error: 'year and members (array) are required' });
        }
        const uc = new CreatePoolUseCase(complianceRepo, poolRepo);
        const result = await uc.execute({ year: Number(year), members });
        res.status(201).json({ data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/:poolId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pool = await poolRepo.findById(req.params.poolId);
        if (!pool) {
          return res.status(404).json({ error: 'Pool not found' });
        }
        const members = await poolRepo.findMembersByPoolId(req.params.poolId);
        res.json({ data: { pool, members } });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
