import { ComplianceBalance } from '../../domain/entities';
import {
  IRouteRepository,
  IComplianceRepository,
} from '../../ports/repositories';
import {
  computeComplianceBalance,
  TARGET_GHG_INTENSITY_2025,
} from '../../domain/formulas';

export interface ComputeCBInput {
  shipId: string;
  year: number;
}

export class ComputeCBUseCase {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository
  ) {}

  async execute({ shipId, year }: ComputeCBInput): Promise<ComplianceBalance> {
    // Find the most recent route for this ship/year
    const routes = await this.routeRepo.findByFilters({ year });
    const route = routes.find((r) => r.routeId === shipId);

    if (!route) {
      throw new Error(`No route found for shipId "${shipId}" in year ${year}`);
    }

    const cbGco2eq = computeComplianceBalance(
      TARGET_GHG_INTENSITY_2025,
      route.ghgIntensity,
      route.fuelConsumption
    );

    return this.complianceRepo.upsert({ shipId, year, cbGco2eq });
  }
}
