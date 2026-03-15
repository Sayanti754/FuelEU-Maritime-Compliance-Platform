import { Router, Request, Response, NextFunction } from 'express';
import {
  IComplianceRepository,
  IBankRepository,
} from '../../../../core/ports/repositories';
import { BankSurplusUseCase } from '../../../../core/application/use-cases/BankSurplus';
import { ApplyBankedUseCase } from '../../../../core/application/use-cases/ApplyBanked';

export function createBankingRouter(
  complianceRepo: IComplianceRepository,
  bankRepo: IBankRepository
): Router {
  const router = Router();

  router.get(
    '/records',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shipId, year } = req.query;
        if (!shipId || !year) {
          return res.status(400).json({ error: 'shipId and year are required' });
        }
        const records = await bankRepo.findByShipAndYear(
          shipId as string,
          Number(year)
        );
        const total = await bankRepo.getTotalBanked(shipId as string, Number(year));
        res.json({ data: { records, totalBanked: total } });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/bank',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shipId, year, amount } = req.body;
        if (!shipId || !year || amount === undefined) {
          return res
            .status(400)
            .json({ error: 'shipId, year, and amount are required' });
        }
        const uc = new BankSurplusUseCase(complianceRepo, bankRepo);
        const result = await uc.execute({
          shipId,
          year: Number(year),
          amount: Number(amount),
        });
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  router.post(
    '/apply',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shipId, year, amount } = req.body;
        if (!shipId || !year || amount === undefined) {
          return res
            .status(400)
            .json({ error: 'shipId, year, and amount are required' });
        }
        const uc = new ApplyBankedUseCase(complianceRepo, bankRepo);
        const result = await uc.execute({
          shipId,
          year: Number(year),
          amount: Number(amount),
        });
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
