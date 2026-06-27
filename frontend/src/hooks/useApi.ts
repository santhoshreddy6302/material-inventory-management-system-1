import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useApi(apiFn: any, { showSuccess = true, successMsg = 'Done' } = {}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true); setError(null);
    try {
      const res = await apiFn(...args);
      if (showSuccess) toast.success(res.data?.message || successMsg);
      return res.data;
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, loading, error };
}

export function useFetch(apiFn: any, immediate = true) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async (...args: any[]) => {
    setLoading(true); setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data?.data ?? res.data);
      return res.data?.data ?? res.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, fetch, setData };
}
