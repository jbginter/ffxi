import type { FFXIAHCharacter, GameData } from '../types';

export async function fetchGameData(): Promise<GameData> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<GameData>;
}

export async function fetchServers(): Promise<string[]> {
  const res = await fetch('/api/servers');
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<string[]>;
}

export async function fetchCharacter(server: string, name: string): Promise<FFXIAHCharacter> {
  const res = await fetch(`/api/character/${encodeURIComponent(server)}/${encodeURIComponent(name)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Character not found' }));
    throw new Error((err as { detail: string }).detail);
  }
  return res.json() as Promise<FFXIAHCharacter>;
}
