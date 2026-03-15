import React, { useState, useEffect } from 'react';
import { usePooling } from '../hooks/usePooling';
import { SHIP_IDS, YEARS } from '../../../core/domain/types';
import {
  Select, Button, Spinner, ErrorAlert, Card, CardHeader, EmptyState, Badge, KpiCard
} from './shared';

export function PoolingTab() {
  const [selectedShip, setSelectedShip] = useState('');
  const [year, setYear] = useState('2024');
  const [poolSuccess, setPoolSuccess] = useState<string | null>(null);

  const {
    members,
    adjustedCBs,
    poolSum,
    isValid,
    poolResult,
    loading,
    error,
    addMember,
    removeMember,
    loadAdjustedCB,
    createPool,
  } = usePooling();

  // Load adjusted CB whenever a member is added or year changes
  useEffect(() => {
    members.forEach((m) => {
      if (!adjustedCBs[m.shipId]) {
        loadAdjustedCB(m.shipId, Number(year));
      }
    });
  }, [members, year]); // eslint-disable-line

  const handleAddMember = () => {
    if (!selectedShip) return;
    addMember(selectedShip);
    loadAdjustedCB(selectedShip, Number(year));
    setSelectedShip('');
  };

  const handleCreatePool = async () => {
    setPoolSuccess(null);
    await createPool(Number(year));
    if (!error) {
      setPoolSuccess('✅ Pool created successfully!');
    }
  };

  const availableShips = SHIP_IDS.filter((s) => !members.find((m) => m.shipId === s));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Article note */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 px-5 py-3 text-sm text-purple-800">
        <strong>Article 21 – Pooling:</strong> Ships may pool their compliance balances. The pool sum must be ≥ 0; deficit ships cannot exit worse; surplus ships cannot exit negative.
      </div>

      {/* Year selector */}
      <Card>
        <div className="px-6 py-4 flex flex-wrap gap-4 items-end">
          <Select
            label="Compliance Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Select
            label="Add Ship to Pool"
            value={selectedShip}
            onChange={(e) => setSelectedShip(e.target.value)}
            options={availableShips.map((s) => ({ value: s, label: s }))}
          />
          <Button onClick={handleAddMember} disabled={!selectedShip} variant="secondary">
            ➕ Add Ship
          </Button>
        </div>
      </Card>

      {error && <ErrorAlert message={error} />}
      {poolSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 animate-fade-in">
          {poolSuccess}
        </div>
      )}

      {/* Pool Members */}
      <Card>
        <CardHeader
          title="Pool Members"
          subtitle={`${members.length} ship(s) selected`}
          action={
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
              poolSum >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              Pool Σ: {poolSum.toLocaleString(undefined, { maximumFractionDigits: 2 })} gCO₂eq
              {poolSum >= 0 ? ' ✅' : ' ❌'}
            </div>
          }
        />

        {members.length === 0 ? (
          <EmptyState icon="🏊" title="No ships in pool" description="Add at least 2 ships to form a pool" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Ship ID', 'Raw CB', 'Banked', 'Adjusted CB', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const cb = adjustedCBs[m.shipId];
                  const adjusted = cb?.adjustedCb ?? 0;
                  return (
                    <tr key={m.shipId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-ocean-700">{m.shipId}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {cb ? cb.rawCb.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '…'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {cb ? cb.bankedSurplus.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '…'}
                      </td>
                      <td className={`px-4 py-3 font-mono font-semibold ${adjusted >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {cb ? adjusted.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '…'}
                      </td>
                      <td className="px-4 py-3">
                        {cb ? (
                          <Badge variant={adjusted >= 0 ? 'success' : 'danger'}>
                            {adjusted >= 0 ? '🟢 Surplus' : '🔴 Deficit'}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">⏳ Loading</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => removeMember(m.shipId)}>
                          🗑 Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {members.length >= 2 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-500">
              {!isValid
                ? poolSum < 0
                  ? '❌ Total pool CB is negative — add more surplus ships'
                  : '❌ Need at least 2 members'
                : '✅ Pool is valid and ready to submit'}
            </div>
            <Button
              onClick={handleCreatePool}
              disabled={!isValid || loading}
              className="min-w-[160px] justify-center"
            >
              {loading ? '⏳ Creating…' : '🏊 Create Pool'}
            </Button>
          </div>
        )}
      </Card>

      {/* Last Pool Result */}
      {poolResult && (
        <Card>
          <CardHeader
            title="Pool Result"
            subtitle={`Pool ID: ${poolResult.pool.id.slice(0, 8)}… · Year: ${poolResult.pool.year}`}
          />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <KpiCard label="Pool Sum" value={poolResult.poolSum.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" />
              <KpiCard label="Members" value={poolResult.members.length} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Ship ID', 'CB Before', 'CB After', 'Change'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {poolResult.members.map((m) => {
                    const delta = m.cbAfter - m.cbBefore;
                    return (
                      <tr key={m.shipId} className="border-b border-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-ocean-700">{m.shipId}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{m.cbBefore.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-3 font-mono font-semibold ${m.cbAfter >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-sm font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {delta > 0 ? '+' : ''}{delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
