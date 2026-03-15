import { useState, useCallback } from 'react';
import { ComplianceBalance, BankingResult, BankRecord, AdjustedCBResult } from '../../core/domain/types';
import { complianceService, bankingService } from '../infrastructure/apiClient';

export function useBanking() {
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [records, setRecords] = useState<BankRecord[]>([]);
  const [totalBanked, setTotalBanked] = useState(0);
  const [lastResult, setLastResult] = useState<BankingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCB = useCallback(async (shipId: string, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const [cbData, bankData] = await Promise.all([
        complianceService.getCB(shipId, year),
        bankingService.getRecords(shipId, year),
      ]);
      setCb(cbData);
      setRecords(bankData.records);
      setTotalBanked(bankData.totalBanked);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const bank = async (shipId: string, year: number, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bankingService.bank(shipId, year, amount);
      setLastResult(result);
      await fetchCB(shipId, year);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Banking failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const apply = async (shipId: string, year: number, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bankingService.apply(shipId, year, amount);
      setLastResult(result);
      await fetchCB(shipId, year);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Apply banked failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { cb, records, totalBanked, lastResult, loading, error, fetchCB, bank, apply };
}

export function useAdjustedCB() {
  const [result, setResult] = useState<AdjustedCBResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (shipId: string, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await complianceService.getAdjustedCB(shipId, year);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch adjusted CB');
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, fetch };
}
