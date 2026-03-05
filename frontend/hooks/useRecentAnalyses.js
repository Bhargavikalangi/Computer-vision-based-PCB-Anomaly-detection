import useSWR from 'swr';
import { getDashboardStats, getResults, getResultById, getSystemStatus } from '@/lib/api';

const fetcher = (fn) => fn();

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR('dashboard-stats', () => getDashboardStats(), {
    refreshInterval: 30000,
    onError: () => {},
  });
  return { stats: data, loading: isLoading, error };
}

export function useResults(params = {}) {
  const key = `results-${JSON.stringify(params)}`;
  const { data, error, isLoading } = useSWR(key, () => getResults(params), {
    onError: () => {},
  });
  return { results: data, loading: isLoading, error };
}

export function useRecentAnalyses(limit = 5) {
  const { data, error, isLoading } = useSWR(`recent-${limit}`, () => getResults({ limit, sort: 'desc' }), {
    refreshInterval: 15000,
    onError: () => {},
  });
  return { analyses: data, loading: isLoading, error };
}

export function useAnalysisResult(id) {
  const { data, error, isLoading } = useSWR(id ? `result-${id}` : null, () => getResultById(id), {
    onError: () => {},
  });
  return { result: data, loading: isLoading, error };
}

export function useSystemStatus() {
  const { data, error } = useSWR('system-status', () => getSystemStatus(), {
    refreshInterval: 10000,
    onError: () => {},
  });
  return { status: data, error };
}
