import { useState, useCallback } from 'react';
import { CreatePoolResult, AdjustedCBResult } from '../../../core/domain/types';
import { poolService, complianceService } from '../infrastructure/apiClient';

export interface PoolMemberDraft {
  shipId: string;
  adjustedCb?: number;
}

export function usePooling() {
  const [members, setMembers] = useState<PoolMemberDraft[]>([]);
  const [adjustedCBs, setAdjustedCBs] = useState<Record<string, AdjustedCBResult>>({});
  const [poolResult, setPoolResult] = useState<CreatePoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poolSum = members.reduce((sum, m) => {
    const cb = adjustedCBs[m.shipId];
    return sum + (cb?.adjustedCb ?? 0);
  }, 0);

  const isValid = members.length >= 2 && poolSum >= 0;

  const addMember = useCallback((shipId: string) => {
    setMembers((prev) => {
      if (prev.find((m) => m.shipId === shipId)) return prev;
      return [...prev, { shipId }];
    });
  }, []);

  const removeMember = useCallback((shipId: string) => {
    setMembers((prev) => prev.filter((m) => m.shipId !== shipId));
  }, []);

  const loadAdjustedCB = useCallback(async (shipId: string, year: number) => {
    try {
      const data = await complianceService.getAdjustedCB(shipId, year);
      setAdjustedCBs((prev) => ({ ...prev, [shipId]: data }));
    } catch (_e) {
      // silently ignore — CB may not be computed yet
    }
  }, []);

  const createPool = async (year: number) => {
    if (!isValid) {
      setError('Pool is invalid: need ≥ 2 members and total CB ≥ 0');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await poolService.createPool(
        year,
        members.map((m) => ({ shipId: m.shipId }))
      );
      setPoolResult(result);
      setMembers([]);
      setAdjustedCBs({});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
