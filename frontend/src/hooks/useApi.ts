import { useState, useEffect, useCallback } from "react";
import api, { type PaginatedResponse } from "@/lib/api";

interface UseApiOptions {
  page?: number;
  limit?: number;
  params?: Record<string, string | number | undefined>;
  enabled?: boolean;
}

export function useApi<T>(endpoint: string, options: UseApiOptions = {}) {
  const { page = 1, limit = 50, params = {}, enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    PaginatedResponse<T>["pagination"] | null
  >(null);

  const serializedParams = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const cleanParams: Record<string, string | number> = { page, limit };
      const parsed = JSON.parse(serializedParams) as Record<
        string,
        string | number | undefined
      >;
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== "") cleanParams[k] = v;
      }
      const { data: res } = await api.get<PaginatedResponse<T>>(endpoint, {
        params: cleanParams,
      });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, enabled, serializedParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, setData, loading, error, pagination, refetch: fetchData };
}
