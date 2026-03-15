import { ComparisonResult } from '../../domain/entities';
import { IRouteRepository } from '../../ports/repositories';
import {
  computePercentDiff,
  isCompliant,
  TARGET_GHG_INTENSITY_2025,
} from '../../domain/formulas';

export class ComputeComparisonUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<ComparisonResult[]> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      throw new Error('No baseline route has been set. Please set a baseline first.');
    }

    const all = await this.routeRepo.findAll();
    const comparisons = all.filter((r) => !r.isBaseline);

    return comparisons.map((comp) => ({
      baseline,
      comparison: comp,
      percentDiff: computePercentDiff(comp.ghgIntensity, baseline.ghgIntensity),
      compliant: isCompliant(comp.ghgIntensity, TARGET_GHG_INTENSITY_2025),
    }));
  }
}
