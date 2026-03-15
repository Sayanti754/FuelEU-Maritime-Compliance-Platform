import { Route } from '../../domain/entities';
import { IRouteRepository } from '../../ports/repositories';

export interface GetRoutesInput {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export class GetRoutesUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(filters: GetRoutesInput = {}): Promise<Route[]> {
    return this.routeRepo.findByFilters(filters);
  }
}
