import type { Prop } from '../../types';

interface Props {
  props: Record<string, Prop>;
  manualSel: Set<string>;
  onSelChange: (sel: Set<string>) => void;
  onAdd: () => void;
}

export function ManualProps({ props, manualSel, onSelChange, onAdd }: Props) {
  const toggle = (id: string) => {
    const next = new Set(manualSel);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelChange(next);
  };

  return (
    <div className="card sel-panel">
      <div className="sel-hdr">Manual Property Selection</div>
      <div className="sec-sub" style={{ padding: '10px 12px 0', margin: 0, fontSize: '.78rem' }}>
        Pick properties directly (for unlisted WS or custom testing):
      </div>
      <div className="prop-grid">
        {Object.values(props).filter(p => p.level <= 3).map(prop => {
          const on = manualSel.has(prop.id);
          return (
            <button
              key={prop.id}
              className={`prop-sel-btn${on ? ' on' : ''}`}
              style={{
                borderColor: on ? prop.color : `${prop.color}55`,
                color: on ? prop.color : undefined,
                background: on ? `${prop.color}18` : undefined,
              }}
              onClick={() => toggle(prop.id)}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: prop.color, display: 'inline-block', flexShrink: 0 }} />
              {prop.name}
            </button>
          );
        })}
      </div>
      <button className="add-manual-btn" onClick={onAdd}>
        + Add Step with Selected Properties
      </button>
    </div>
  );
}
