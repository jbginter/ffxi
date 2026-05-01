import { useData } from '../../context/DataContext';
import { Badge } from '../shared/Badge';
import { EL_ICON, EL_CLR } from '../../lib/constants';

const ELEMENT_ORDER = ['Fire', 'Ice', 'Wind', 'Earth', 'Thunder', 'Water', 'Light', 'Dark'];

export function MagicBurst() {
  const { data } = useData();
  if (!data) return null;

  return (
    <div>
      <div className="sec-title">Magic Burst Reference</div>
      <div className="sec-sub">Cast the matching element within ~10 seconds of the skillchain forming for a Magic Burst bonus.</div>

      <div className="mb-grid">
        {ELEMENT_ORDER.map(el => (
          <div key={el} className="card mb-card" style={{ borderColor: `${EL_CLR[el]}44` }}>
            <div className="mb-el-hdr">
              <div className="mb-el-icon" style={{ background: `${EL_CLR[el]}18`, border: `1px solid ${EL_CLR[el]}44` }}>
                {EL_ICON[el]}
              </div>
              <div className="mb-el-name" style={{ color: EL_CLR[el] }}>{el}</div>
            </div>
            <div className="mb-chains">
              {(data.mb[el] ?? []).map(id => data.props[id] ? <Badge key={id} prop={data.props[id]} /> : null)}
            </div>
          </div>
        ))}
      </div>

      <div className="sec-title mt-6">Damage Bonus by Steps</div>
      <table className="dmg-tbl mt-4">
        <thead><tr><th>Skillchain Steps</th><th>Magic Burst Bonus</th></tr></thead>
        <tbody>
          <tr><td>2-step chain</td><td>+35%</td></tr>
          <tr><td>3-step chain</td><td>+45%</td></tr>
          <tr><td>4-step chain</td><td>+55%</td></tr>
          <tr><td>Each additional step</td><td>+10% more</td></tr>
        </tbody>
      </table>

      <div className="sec-title mt-6">Notes</div>
      <ul className="notes mt-4">
        <li>• The magic burst window opens immediately after the skillchain animation starts and lasts ~10 seconds.</li>
        <li>• The window closes early if another weapon skill with SC properties lands. No-property WS (Spirit Taker, Sanguine Blade, Mystic Boon, Spirits Within) are safe to use.</li>
        <li>• Magic burst damage bonus from equipment caps at +40%. Magic Burst Bonus job trait, Job Points, and Gifts are separate and have no known cap.</li>
        <li>• Wyvern breath attacks gain only the magic accuracy bonus, not the damage bonus.</li>
        <li>• Radiance and Umbra require Aeonic Aftermath and burst all eight elements.</li>
        <li>• Higher magic accuracy from bursting is estimated at +100 (unverified).</li>
      </ul>
    </div>
  );
}
