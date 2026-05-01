import type { Prop } from '../../types';
import { Badge } from '../shared/Badge';
import { ElChip } from '../shared/ElChip';
import { EL_ICON } from '../../lib/constants';
import { getBurstElements } from '../../lib/chain';

interface Props {
  prop: Prop;
  props: Record<string, Prop>;
  combos: Record<string, string>;
  mb: Record<string, string[]>;
}

export function ReferenceCard({ prop, props, combos, mb }: Props) {
  const bursts = getBurstElements(prop.id, mb);
  const createdBy = Object.entries(combos)
    .filter(([, v]) => v === prop.id)
    .map(([k]) => k.split(':') as [string, string]);

  const iconContent = prop.elements.length === 1
    ? EL_ICON[prop.elements[0]]
    : prop.aeonic ? '✦' : prop.level >= 3 ? '◈' : '◆';

  return (
    <div className="card ref-card" style={{ borderColor: `${prop.color}44` }}>
      <div className="ref-card-hdr">
        <div
          className="ref-icon"
          style={{ background: `${prop.color}18`, border: `1px solid ${prop.color}44`, color: prop.color, fontSize: '1.1rem' }}
        >
          {iconContent}
        </div>
        <div>
          <div className="ref-name" style={{ color: prop.color }}>{prop.name}</div>
          <div className="ref-lv">
            {prop.aeonic ? 'Aeonic' : `Level ${prop.level}`}
            {prop.level >= 2 ? ` · ${prop.elements.join(' + ')}` : ''}
          </div>
        </div>
      </div>

      <div className="ref-els">
        {prop.elements.map(el => <ElChip key={el} el={el} />)}
      </div>

      {bursts.length > 0 && (
        <>
          <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginBottom: 4 }}>Bursts:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {bursts.map(el => <ElChip key={el} el={el} />)}
          </div>
        </>
      )}

      {createdBy.length > 0 && (
        <>
          <div className="ref-from">Created by:</div>
          {createdBy.map(([op, cp]) => {
            const opP = props[op], cpP = props[cp];
            if (!opP || !cpP) return null;
            return (
              <div key={`${op}:${cp}`} className="ref-combo">
                <span style={{ color: opP.color, fontSize: '.72rem' }}>{opP.name}</span>
                <span style={{ color: 'var(--text-2)' }}>→</span>
                <span style={{ color: cpP.color, fontSize: '.72rem' }}>{cpP.name}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
