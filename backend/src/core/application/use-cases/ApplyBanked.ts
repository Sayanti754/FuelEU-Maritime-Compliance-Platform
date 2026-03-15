import { BankingResult } from '../../domain/entities';
import {
  IComplianceRepository,
  IBankRepository,
} from '../../ports/repositories';

export interface ApplyBankedInput {
  shipId: string;
  year: number;
  amount: number;
}

export class ApplyBankedUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankRepo: IBankRepository
  ) {}

  async execute({ shipId, year, amount }: ApplyBankedInput): Promise<BankingResult> {
    if (amount <= 0) {
      throw new Error('Amount to apply must be positive');
    }

    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);
    if (totalBanked <= 0) {
      throw new Error(`No banked surplus available for ship "${shipId}" in year ${year}`);
    }

    if (amount > totalBanked) {
      throw new Error(`Cannot apply ${amount}: exceeds available banked amount of ${totalBanked}`);
    }

    const cb = await this.complianceRepo.findByShipAndYear(shipId, year);
    if (!cb) {
      throw new Error(`No compliance balance found for ship "${shipId}" in year ${year}`);
    }

    const cbBefore = cb.cbGco2eq;
    const cbAfter = cbBefore + amount;

    await this.bankRepo.applyAmount(shipId, year, amount);
    await this.complianceRepo.upsert({ shipId, year, cbGco2eq: cbAfter });

    return {
      cbBefore,
      applied: amount,
      cbAfter,
    };
  }
}
