import { BankingResult } from '../../domain/entities';
import {
  IComplianceRepository,
  IBankRepository,
} from '../../ports/repositories';

export interface BankSurplusInput {
  shipId: string;
  year: number;
  amount: number;
}

export class BankSurplusUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankRepo: IBankRepository
  ) {}

  async execute({ shipId, year, amount }: BankSurplusInput): Promise<BankingResult> {
    if (amount <= 0) {
      throw new Error('Amount to bank must be positive');
    }

    const cb = await this.complianceRepo.findByShipAndYear(shipId, year);
    if (!cb) {
      throw new Error(`No compliance balance found for ship "${shipId}" in year ${year}. Compute CB first.`);
    }

    if (cb.cbGco2eq <= 0) {
      throw new Error('Cannot bank: Compliance balance is not positive (no surplus)');
    }

    if (amount > cb.cbGco2eq) {
      throw new Error(`Cannot bank ${amount}: exceeds available surplus of ${cb.cbGco2eq}`);
    }

    const cbBefore = cb.cbGco2eq;

    await this.bankRepo.create({ shipId, year, amountGco2eq: amount });
    const updatedCb = cbBefore - amount;
    await this.complianceRepo.upsert({ shipId, year, cbGco2eq: updatedCb });

    return {
      cbBefore,
      applied: amount,
      cbAfter: updatedCb,
    };
  }
}
