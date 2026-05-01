import { createContext, useContext, useEffect, useState } from 'react';
import type { GameData } from '../types';
import { fetchGameData } from '../lib/api';

interface DataContextValue {
  data: GameData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue>({ data: null, loading: true, error: null });

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGameData()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
