import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ReferenceCard } from './ReferenceCard';
import { ComboTable } from './ComboTable';
import type { Prop } from '../../types';

const LEVEL_COLORS: Record<number, string> = { 1: '#7ab3e0', 2: '#c4a8e8', 3: '#e8a020', 4: '#e8e870' };
const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 Skillchains',
  2: 'Level 2 Skillchains',
  3: 'Level 3 Skillchains',
  4: 'Level 4 & Aeonic Skillchains',
};

export function SkillchainReference() {
  const { data } = useData();

  const propsByLevel = useMemo<Record<number, Prop[]>>(() => {
    if (!data) return { 1: [], 2: [], 3: [], 4: [] };
    const levels: Record<number, Prop[]> = { 1: [], 2: [], 3: [], 4: [] };
    Object.values(data.props).forEach(p => levels[p.level]?.push(p));
    return levels;
  }, [data]);

  if (!data) return null;

  return (
    <div>
      <div className="sec-title">Skillchain Properties Reference</div>
      {([1, 2, 3, 4] as const).map(lvl => (
        <div key={lvl}>
          <div style={{ color: LEVEL_COLORS[lvl], fontSize: '.9rem', fontWeight: 600, marginBottom: 10, marginTop: lvl > 1 ? 22 : 0 }}>
            {LEVEL_LABELS[lvl]}
          </div>
          <div className="ref-grid">
            {propsByLevel[lvl].map(prop => (
              <ReferenceCard key={prop.id} prop={prop} props={data.props} combos={data.combos} mb={data.mb} />
            ))}
          </div>
        </div>
      ))}

      <div className="sec-title mt-6">Combination Table</div>
      <div className="sec-sub" style={{ marginBottom: 10 }}>
        Opening property (row) × Closing property (column) = result skillchain
      </div>
      <ComboTable props={data.props} combos={data.combos} />
    </div>
  );
}
