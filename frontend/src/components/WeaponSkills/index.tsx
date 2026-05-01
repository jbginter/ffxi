import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../shared/Badge';

export function WeaponSkills() {
  const { data } = useData();
  const [search, setSearch] = useState('');
  const [weapFilter, setWeapFilter] = useState('');
  const [propFilter, setPropFilter] = useState('');

  const weapons = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.ws.map(w => w.w))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.ws.filter(ws => {
      if (weapFilter && ws.w !== weapFilter) return false;
      if (propFilter && !ws.p.includes(propFilter)) return false;
      if (q && !ws.n.toLowerCase().includes(q) && !ws.w.toLowerCase().includes(q) && !ws.j.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, weapFilter, propFilter]);

  if (!data) return null;

  return (
    <div>
      <div className="sec-title">Weapon Skills</div>
      <div className="ws-filters">
        <input
          type="text"
          placeholder="Search name, weapon, job…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={weapFilter} onChange={e => setWeapFilter(e.target.value)}>
          <option value="">All Weapons</option>
          {weapons.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={propFilter} onChange={e => setPropFilter(e.target.value)}>
          <option value="">All Properties</option>
          {Object.values(data.props).filter(p => p.level <= 3).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="wst-wrap">
        <table className="wst">
          <thead>
            <tr>
              <th>Weapon Skill</th><th>Weapon</th><th>Job(s)</th><th>SC Properties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ws, i) => (
              <tr key={i}>
                <td><strong>{ws.n}</strong></td>
                <td><span style={{ color: 'var(--text-1)' }}>{ws.w}</span></td>
                <td><span style={{ color: 'var(--text-2)', fontSize: '.75rem' }}>{ws.j}</span></td>
                <td>
                  <div className="props-cell">
                    {ws.p.length === 0 ? (
                      <span style={{ color: 'var(--text-2)', fontSize: '.75rem' }}>None</span>
                    ) : (
                      ws.p.map(id => data.props[id] ? <Badge key={id} prop={data.props[id]} /> : null)
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
