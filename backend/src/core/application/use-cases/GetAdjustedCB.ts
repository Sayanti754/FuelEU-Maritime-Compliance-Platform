import {
  IComplianceRepository,
  IBankRepository,
} from '../../ports/repositories';

export interface GetAdjustedCBInput {
  shipId: string;
  year: number;
}

export interface AdjustedCBResult {
  shipId: string;
  year: number;
  rawCb: number;
  bankedSurplus: number;
  adjustedCb: number;
}

export class GetAdjustedCBUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankRepo: IBankRepository
  ) {}

  async execute({ shipId, year }: GetAdjustedCBInput): Promise<AdjustedCBResult> {
    const cb = await this.complianceRepo.findByShipAndYear(shipId, year);
    const rawCb = cb?.cbGco2eq ?? 0;
    const bankedSurplus = await this.bankRepo.getTotalBanked(shipId, year);
    const adjustedCb = rawCb + bankedSurplus;

    return { shipId, year, rawCb, bankedSurplus, adjustedCb };
  }
}
