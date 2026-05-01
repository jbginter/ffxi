import type { Prop } from '../../types';
import { getBurstElements } from '../../lib/chain';
import { EL_ICON, EL_CLR } from '../../lib/constants';

interface Props {
  scId: string;
  props: Record<string, Prop>;
  mb: Record<string, string[]>;
}

export function BurstPanel({ scId, props, mb }: Props) {
  const scProp = props[scId];
  if (!scProp) return null;

  return (
    <div className="card burst-panel">
      <div className="burst-label">Magic Burst — last skillchain</div>
      <div className="burst-chips">
        <span style={{ color: 'var(--text-1)', fontSize: '.8rem', alignSelf: 'center' }}>
          After {scProp.name}:{' '}
        </span>
        {getBurstElements(scId, mb).map(el => (
          <div
            key={el}
            className="burst-chip"
            style={{ color: EL_CLR[el], borderColor: `${EL_CLR[el]}66`, background: `${EL_CLR[el]}18` }}
          >
            {EL_ICON[el]} {el}
          </div>
        ))}
      </div>
    </div>
  );
}
