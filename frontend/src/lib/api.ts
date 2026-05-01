import type { GameData } from '../types';

export async function fetchGameData(): Promise<GameData> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<GameData>;
}
