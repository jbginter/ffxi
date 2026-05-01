import type { Prop } from '../../types';

interface Props {
  props: Record<string, Prop>;
  combos: Record<string, string>;
}

export function ComboTable({ props, combos }: Props) {
  const allProps = Object.values(props).filter(p => p.level <= 3);

  return (
    <div className="tbl-wrap">
      <table className="ctbl">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Open ↓ Close →</th>
            {allProps.map(p => (
              <th key={p.id} style={{ color: p.color }}>{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allProps.map(op => (
            <tr key={op.id}>
              <td style={{ color: op.color, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{op.name}</td>
              {allProps.map(cp => {
                const res = combos[`${op.id}:${cp.id}`];
                if (res) {
                  const rp = props[res];
                  return (
                    <td key={cp.id} className="hit" style={{ color: rp.color, background: `${rp.color}12`, fontSize: '.7rem' }}>
                      {rp.name}
                    </td>
                  );
                }
                return <td key={cp.id} className="miss">—</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
