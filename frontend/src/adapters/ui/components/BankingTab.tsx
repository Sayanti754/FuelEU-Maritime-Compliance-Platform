import React, { useState } from 'react';
import { useBanking } from '../hooks/useBanking';
import { SHIP_IDS, YEARS } from '../../../core/domain/types';
import {
  Select, Input, Button, Spinner, ErrorAlert, Card, CardHeader, KpiCard, EmptyState, Badge
} from './shared';

export function BankingTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { cb, records, totalBanked, lastResult, loading, error, fetchCB, bank, apply } = useBanking();

  const handleFetch = () => {
    if (!shipId || !year) return;
    fetchCB(shipId, Number(year));
    setActionSuccess(null);
  };

  const handleBank = async () => {
    if (!shipId || !year || !bankAmount) return;
    try {
      const result = await bank(shipId, Number(year), Number(bankAmount));
      setActionSuccess(`✅ Banked ${Number(bankAmount).toLocaleString()} gCO₂eq — new CB: ${result.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      setBankAmount('');
    } catch (_e) { /* error shown via hook */ }
  };

  const handleApply = async () => {
    if (!shipId || !year || !applyAmount) return;
    try {
      const result = await apply(shipId, Number(year), Number(applyAmount));
      setActionSuccess(`✅ Applied ${Number(applyAmount).toLocaleString()} gCO₂eq — new CB: ${result.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      setApplyAmount('');
    } catch (_e) { /* error shown via hook */ }
  };

  const cbValue = cb?.cbGco2eq ?? 0;
  const hasSurplus = cbValue > 0;
  const hasDeficit = cbValue < 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Article note */}
      <div className="rounded-lg border border-ocean-200 bg-ocean-50 px-5 py-3 text-sm text-ocean-800">
        <strong>Article 20 – Banking:</strong> A ship with a positive Compliance Balance may bank its surplus for use in a subsequent year.
      </div>

      {/* Ship selector */}
      <Card>
        <CardHeader title="Select Ship & Year" />
        <div className="p-6 flex flex-wrap gap-4 items-end">
          <Select
            label="Ship ID"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            options={SHIP_IDS.map((s) => ({ value: s, label: s }))}
          />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Button onClick={handleFetch} disabled={!shipId || !year || loading}>
            {loading ? '⏳ Loading…' : '📡 Fetch CB'}
          </Button>
        </div>
      </Card>

      {error && <ErrorAlert message={error} onDismiss={() => {}} />}
      {actionSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 animate-fade-in">
          {actionSuccess}
        </div>
      )}

      {loading && <Spinner />}

      {cb && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Current CB" value={cbValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" highlight={hasSurplus} />
            <KpiCard label="Status" value={hasSurplus ? '🟢 Surplus' : hasDeficit ? '🔴 Deficit' : '⚪ Neutral'} />
            <KpiCard label="Total Banked" value={totalBanked.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" />
            <KpiCard label="Ship ID" value={shipId} />
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="CB Before" value={lastResult.cbBefore.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" />
              <KpiCard label="Amount Applied" value={lastResult.applied.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" />
              <KpiCard label="CB After" value={lastResult.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })} unit="gCO₂eq" />
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Surplus */}
            <Card>
              <CardHeader
                title="Bank Surplus"
                subtitle="Store positive CB for future use"
              />
              <div className="p-6 space-y-4">
                <Input
                  label="Amount to Bank (gCO₂eq)"
                  type="number"
                  placeholder="e.g. 50000"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  min={0}
                  max={hasSurplus ? cbValue : 0}
                />
                {!hasSurplus && (
                  <p className="text-xs text-slate-500 italic">
                    Banking requires a positive compliance balance.
                  </p>
                )}
                <Button
                  onClick={handleBank}
                  disabled={!hasSurplus || !bankAmount || Number(bankAmount) <= 0 || loading}
                  className="w-full justify-center"
                >
                  🏦 Bank Surplus
                </Button>
              </div>
            </Card>

            {/* Apply Banked */}
            <Card>
              <CardHeader
                title="Apply Banked Surplus"
                subtitle="Apply previously banked surplus to current balance"
              />
              <div className="p-6 space-y-4">
                <Input
                  label="Amount to Apply (gCO₂eq)"
                  type="number"
                  placeholder="e.g. 30000"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  min={0}
                  max={totalBanked}
                />
                <p className="text-xs text-slate-500">
                  Available banked: <span className="font-mono font-semibold text-slate-700">{totalBanked.toLocaleString(undefined, { maximumFractionDigits: 2 })} gCO₂eq</span>
                </p>
                <Button
                  variant={hasDeficit ? 'primary' : 'secondary'}
                  onClick={handleApply}
                  disabled={totalBanked <= 0 || !applyAmount || Number(applyAmount) <= 0 || loading}
                  className="w-full justify-center"
                >
                  ⚡ Apply Banked
                </Button>
              </div>
            </Card>
          </div>

          {/* Bank Records */}
          {records.length > 0 && (
            <Card>
              <CardHeader title="Bank Transaction History" subtitle={`${records.length} record(s)`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['ID', 'Amount (gCO₂eq)', 'Status', 'Date'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{r.amountGco2eq.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          <Badge variant={r.applied ? 'neutral' : 'success'}>
                            {r.applied ? 'Applied' : 'Available'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {!cb && !loading && (
        <Card>
          <EmptyState
            icon="🏦"
            title="Select a ship and year"
            description="Fetch the compliance balance first to enable banking actions"
          />
        </Card>
      )}
    </div>
  );
}
