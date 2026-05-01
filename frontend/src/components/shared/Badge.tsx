import type { Prop } from '../../types';

export function Badge({ prop }: { prop: Prop }) {
  return (
    <span className="badge" style={{ color: prop.color, borderColor: `${prop.color}55` }}>
      <span className="dot" style={{ background: prop.color }} />
      {prop.name}
    </span>
  );
}
