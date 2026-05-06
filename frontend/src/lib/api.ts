import type { FFXIAHCharacter, GameData } from '../types';

// Module-level promise cache: a second call (e.g. React StrictMode double-invoke)
// returns the already-in-flight promise instead of issuing a new request.
// The cache is cleared on error so the next call retries.
let _gameData: Promise<GameData> | null = null;
let _servers: Promise<string[]> | null = null;

export function fetchGameData(): Promise<GameData> {
  if (!_gameData) {
    _gameData = fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .catch(e => { _gameData = null; throw e; });
  }
  return _gameData;
}

export function fetchServers(): Promise<string[]> {
  if (!_servers) {
    _servers = fetch('/api/servers')
      .then(res => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .catch(e => { _servers = null; throw e; });
  }
  return _servers;
}

export async function fetchCharacter(server: string, name: string): Promise<FFXIAHCharacter> {
  const res = await fetch(`/api/character/${encodeURIComponent(server)}/${encodeURIComponent(name)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Character not found' }));
    throw new Error((err as { detail: string }).detail);
  }
  return res.json();
}
