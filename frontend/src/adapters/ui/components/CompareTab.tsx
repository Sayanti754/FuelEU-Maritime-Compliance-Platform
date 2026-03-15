import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useComparison } from '../hooks/useRoutes';
import { TARGET_GHG_INTENSITY } from '../../../core/domain/types';
import { Badge, Spinner, ErrorAlert, Card, CardHeader, KpiCard, EmptyState, Button } from './shared';

const TARGET = TARGET_GHG_INTENSITY;

export function CompareTab() {
  const { comparisons, loading, error, refetch } = useComparison();

  const compliantCount = comparisons.filter((c) => c.compliant).length;
  const avgGhg = comparisons.length
    ? comparisons.reduce((s, c) => s + c.comparison.ghgIntensity, 0) / comparisons.length
    : 0;

  const chartData = comparisons.map((c) => ({
    name: c.comparison.routeId,
    baseline: c.baseline.ghgIntensity,
    comparison: c.comparison.ghgIntensity,
    compliant: c.compliant,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Target Intensity" value={TARGET.toFixed(4)} unit="gCO₂e/MJ" highlight />
        <KpiCard label="Routes Compared" value={comparisons.length} />
        <KpiCard label="Compliant Routes" value={compliantCount} />
        <KpiCard label="Avg GHG Intensity" value={avgGhg.toFixed(2)} unit="gCO₂e/MJ" />
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Spinner />
      ) : comparisons.length === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="No comparison data"
            description="Set a baseline route in the Routes tab first, then come back here."
          />
          <div className="flex justify-center pb-8">
            <Button variant="secondary" onClick={refetch}>🔄 Refresh</Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Chart */}
          <Card>
            <CardHeader
              title="GHG Intensity Comparison"
              subtitle="Baseline vs. comparison routes — red line = 2025 target (89.3368 gCO₂e/MJ)"
              action={<Button size="sm" variant="ghost" onClick={refetch}>🔄</Button>}
            />
            <div className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'JetBrains Mono' }} />
                  <YAxis
                    domain={[85, 96]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v}`}
                    label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(4)} gCO₂e/MJ`,
                      name === 'comparison' ? 'GHG Intensity' : 'Baseline',
                    ]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend formatter={(v) => v === 'comparison' ? 'Comparison Route' : 'Baseline'} />
                  <ReferenceLine
                    y={TARGET}
                    stroke="#ef4444"
                    strokeDasharray="5 3"
                    strokeWidth={2}
                    label={{ value: `Target ${TARGET}`, position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }}
                  />
                  <Bar dataKey="baseline" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="baseline" />
                  <Bar dataKey="comparison" radius={[4, 4, 0, 0]} name="comparison">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.compliant ? '#10b981' : '#ef4444'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader title="Detailed Comparison" subtitle="% difference calculated vs baseline" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Route', 'Vessel', 'Fuel', 'Year', 'Baseline GHG', 'Comparison GHG', '% Diff', 'Compliant'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr key={c.comparison.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-ocean-700">{c.comparison.routeId}</td>
                      <td className="px-4 py-3 text-slate-700">{c.comparison.vesselType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.comparison.fuelType === 'LNG' ? 'success' : c.comparison.fuelType === 'MGO' ? 'warning' : 'neutral'}>
                          {c.comparison.fuelType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.comparison.year}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{c.baseline.ghgIntensity.toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{c.comparison.ghgIntensity.toFixed(4)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-semibold ${c.percentDiff < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {c.percentDiff > 0 ? '+' : ''}{c.percentDiff.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.compliant ? (
                          <Badge variant="success">✅ Compliant</Badge>
                        ) : (
                          <Badge variant="danger">❌ Non-Compliant</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
