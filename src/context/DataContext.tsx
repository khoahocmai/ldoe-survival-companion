import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseState, loadGameData } from '../services/dataLoader';

interface DataContextType {
  db: DatabaseState | null;
  isLoading: boolean;
  error: string | null;
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

  const initData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await loadGameData();
      setDb(loaded);
      if (loaded.error) {
        setError(loaded.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi khởi tạo cơ sở dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        db,
        isLoading,
        error,
        reload: initData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useGameData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useGameData must be used within a DataProvider');
  }
  return ctx;
}
