import { useEffect, useState } from 'react';

/** Tembel veri yükleyicisi için basit durum kancası (önbelleği yükleyici tutar). */
export function useLoad<T>(loader: () => Promise<T>): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loader()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(String((e as Error)?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [loader]);
  return { data, error };
}
