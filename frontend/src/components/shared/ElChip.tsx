import { EL_ICON, EL_CLR } from '../../lib/constants';

export function ElChip({ el }: { el: string }) {
  const color = EL_CLR[el];
  return (
    <span
      className="el-chip"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {EL_ICON[el]} {el}
    </span>
  );
}
