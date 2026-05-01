import { useState, useMemo } from 'react';
import type { WeaponSkill, Prop } from '../../types';
import { Badge } from '../shared/Badge';

interface Props {
  ws: WeaponSkill[];
  props: Record<string, Prop>;
  wFilter: string;
  onFilterChange: (filter: string) => void;
  onSelect: (ws: WeaponSkill) => void;
  isCompatible: (wsProps: string[]) => boolean;
  hasChain: boolean;
}

export function WsList({ ws, props, wFilter, onFilterChange, onSelect, isCompatible, hasChain }: Props) {
  const [search, setSearch] = useState('');

  const weaponTypes = useMemo(() => ['all', ...[...new Set(ws.map(w => w.w))].sort()], [ws]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ws.filter(w => {
      if (hasChain && !isCompatible(w.p)) return false;
      if (wFilter !== 'all' && w.w !== wFilter) return false;
      if (q && !w.n.toLowerCase().includes(q) && !w.w.toLowerCase().includes(q) && !w.j.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ws, wFilter, search, hasChain, isCompatible]);

  return (
    <div className="card sel-panel">
      <div className="sel-hdr">Weapon Skills</div>
      <input
        className="srch"
        placeholder="Search name, weapon, job…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="filt-bar">
        {weaponTypes.map(type => (
          <button
            key={type}
            className={`filt-btn${wFilter === type ? ' on' : ''}`}
            onClick={() => onFilterChange(type)}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>
      <div className="ws-list-scroll">
        {filtered.map((w, idx) => (
            <div
              key={idx}
              className="ws-row"
              onClick={() => onSelect(w)}
            >
              <div style={{ flex: 1 }}>
                <div className="r-name">{w.n}</div>
                <div className="r-weap">{w.w} · {w.j}</div>
              </div>
              <div className="r-props">
                {w.p.length === 0 ? (
                  <span style={{ color: 'var(--text-2)', fontSize: '.7rem' }}>None</span>
                ) : (
                  w.p.map(id => props[id] ? <Badge key={id} prop={props[id]} /> : null)
                )}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}
