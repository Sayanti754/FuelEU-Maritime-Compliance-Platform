import React, { useState } from 'react';
import { useRoutes } from '../hooks/useRoutes';
import { Route, VESSEL_TYPES, FUEL_TYPES, YEARS } from '../../../core/domain/types';
import {
  Badge, Button, Select, Spinner, ErrorAlert, Card, CardHeader, EmptyState
} from './shared';

function GhgBadge({ value }: { value: number }) {
  const TARGET = 89.3368;
  return (
    <span className={`font-mono text-sm font-semibold ${value <= TARGET ? 'text-emerald-600' : 'text-red-600'}`}>
      {value.toFixed(2)}
    </span>
  );
}

export function RoutesTab() {
  const [vesselType, setVesselType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [year, setYear] = useState('');
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);

  const { routes, loading, error, setBaseline } = useRoutes({
    vesselType: vesselType || undefined,
    fuelType: fuelType || undefined,
    year: year ? Number(year) : undefined,
  });

  const handleSetBaseline = async (route: Route) => {
    setSettingBaseline(route.routeId);
    try {
      await setBaseline(route.routeId);
    } finally {
      setSettingBaseline(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Filters */}
      <Card>
        <div className="px-6 py-4 flex flex-wrap gap-4 items-end">
          <Select
            label="Vessel Type"
            value={vesselType}
            onChange={(e) => setVesselType(e.target.value)}
            options={VESSEL_TYPES.map((v) => ({ value: v, label: v }))}
          />
          <Select
            label="Fuel Type"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            options={FUEL_TYPES.map((f) => ({ value: f, label: f }))}
          />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title="Route Registry"
          subtitle={`${routes.length} route${routes.length !== 1 ? 's' : ''} — target: 89.3368 gCO₂e/MJ`}
        />
        {error && (
          <div className="p-4">
            <ErrorAlert message={error} />
          </div>
        )}
        {loading ? (
          <Spinner />
        ) : routes.length === 0 ? (
          <EmptyState icon="🚢" title="No routes found" description="Adjust filters or check the backend connection" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Route ID', 'Vessel Type', 'Fuel', 'Year', 'GHG Intensity', 'Fuel Cons. (t)', 'Distance (km)', 'Emissions (t)', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.map((route, i) => (
                  <tr
                    key={route.id}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${route.isBaseline ? 'bg-ocean-50' : ''} ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-ocean-700">
                      {route.routeId}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{route.vesselType}</td>
                    <td className="px-4 py-3">
                      <Badge variant={route.fuelType === 'LNG' ? 'success' : route.fuelType === 'MGO' ? 'warning' : 'neutral'}>
                        {route.fuelType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{route.year}</td>
                    <td className="px-4 py-3">
                      <GhgBadge value={route.ghgIntensity} />
                      <span className="text-slate-400 text-xs ml-1">gCO₂e/MJ</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{route.fuelConsumption.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{route.distance.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{route.totalEmissions.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {route.isBaseline ? (
                        <Badge variant="info">📌 Baseline</Badge>
                      ) : (
                        <Badge variant="neutral">—</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={route.isBaseline ? 'ghost' : 'secondary'}
                        disabled={route.isBaseline || settingBaseline === route.routeId}
                        onClick={() => handleSetBaseline(route)}
                      >
                        {settingBaseline === route.routeId ? '⏳' : route.isBaseline ? '✓ Baseline' : 'Set Baseline'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
