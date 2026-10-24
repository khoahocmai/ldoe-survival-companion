import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DatabaseState, loadGameData } from '../services/dataLoader';

interface DataContextType {
  db: DatabaseState | null;
  isLoading: boolean;
  error: string | null;
  /** Re-merge base JSON with local overrides. Keeps the current screen mounted. */
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  db: null,
  isLoading: true,
  error: null,
  reload: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force: boolean) => {
    try {
      const loaded = await loadGameData(force);
      setDb(loaded);
      setError(loaded.error);
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi khởi tạo cơ sở dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Forced refresh: bypass the in-memory cache so edits made through storageService show up
  // immediately. Not toggling `isLoading` avoids unmounting the whole router on every save.
  const reload = useCallback(() => fetchData(true), [fetchData]);

  return <DataContext.Provider value={{ db, isLoading, error, reload }}>{children}</DataContext.Provider>;
};

export function useGameData() {
  return useContext(DataContext);
}
