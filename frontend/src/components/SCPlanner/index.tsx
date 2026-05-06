import { useState, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../shared/Badge';
import { resolveChain } from '../../lib/chain';
import type { Prop, WeaponSkill } from '../../types';

type ComboKey = string;
interface Slots { opener: WeaponSkill | null; closer: WeaponSkill | null }

export function SCPlanner() {
  const { data } = useData();
  const [target, setTarget]     = useState<string | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [jobQuery, setJobQuery] = useState('');
  // Per-combo opener/closer selections keyed by `${opPropId}:${cpPropId}`
  const [selections, setSelections] = useState<Map<ComboKey, Slots>>(new Map());

  const weapons = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.ws.map(w => w.w))].sort();
  }, [data]);

  const combosForTarget = useMemo(() => {
    if (!data || !target) return [];
    return Object.entries(data.combos)
      .filter(([, v]) => v === target)
      .map(([k]) => k.split(':') as [string, string]);
  }, [data, target]);

  const pickTarget = (propId: string) => {
    setTarget(prev => prev === propId ? null : propId);
    setSelections(new Map()); // clear selections when target changes
  };

  const toggleExclude = (wtype: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(wtype)) next.delete(wtype); else next.add(wtype);
      return next;
    });
  };

  const selectWs = useCallback((key: ComboKey, slot: 'opener' | 'closer', ws: WeaponSkill) => {
    setSelections(prev => {
      const next  = new Map(prev);
      const cur   = next.get(key) ?? { opener: null, closer: null };
      const same  = slot === 'opener' ? cur.opener?.n === ws.n : cur.closer?.n === ws.n;
      next.set(key, { ...cur, [slot]: same ? null : ws });
      return next;
    });
  }, []);

  if (!data) return null;

  const propsByLevel = ([1, 2, 3, 4] as const).map(lv => ({
    lv,
    props: Object.values(data.props).filter(p => p.level === lv),
  }));

  const targetProp = target ? data.props[target] : null;

  return (
    <div>
      <div className="sec-title">Skillchain Planner</div>
      <div className="sec-sub">
        Pick a target skillchain, then click an opener and a closer to verify they produce it.
        Toggle weapon types to mark them unavailable.
      </div>

      {/* ── Target picker ── */}
      <div className="plan-filter-label" style={{ marginBottom: 8 }}>Target Skillchain</div>
      <div className="plan-picker">
        {propsByLevel.map(({ lv, props }, li) => (
          <span key={lv} style={{ display: 'contents' }}>
            {li > 0 && <div className="plan-lv-sep" />}
            <div className="plan-lv-label">Lv{lv}{lv === 4 ? '/Aeonic' : ''}</div>
            {props.map(prop => (
              <button
                key={prop.id}
                className={`plan-sc-btn${target === prop.id ? ' on' : ''}`}
                style={{
                  color: prop.color,
                  borderColor: `${prop.color}66`,
                  background: target === prop.id ? `${prop.color}22` : undefined,
                }}
                onClick={() => pickTarget(prop.id)}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: prop.color, display: 'inline-block', flexShrink: 0,
                }} />
                {prop.name}
              </button>
            ))}
          </span>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card plan-filters">
        <div>
          <div className="plan-filter-label">Weapon Types — click to mark unavailable</div>
          <div className="plan-weap-toggles">
            {weapons.map(t => (
              <button
                key={t}
                className={`plan-weap-btn${excluded.has(t) ? ' off' : ''}`}
                onClick={() => toggleExclude(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by job (e.g. SAM, MNK, RDM)…"
            value={jobQuery}
            onChange={e => setJobQuery(e.target.value)}
            className="plan-job-input"
          />
          <button
            className="clear-btn"
            onClick={() => { setExcluded(new Set()); setJobQuery(''); }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {!target ? (
        <div className="plan-none-sel">Select a target skillchain above to begin</div>
      ) : combosForTarget.length === 0 ? (
        <div className="plan-none-sel">
          {targetProp?.name} cannot be produced by any direct weapon skill combination.
        </div>
      ) : (
        combosForTarget.map(([opId, cpId]) => {
          const opProp  = data.props[opId];
          const cpProp  = data.props[cpId];
          if (!opProp || !cpProp || !targetProp) return null;

          const key     = `${opId}:${cpId}`;
          const slots   = selections.get(key) ?? { opener: null, closer: null };

          return (
            <div key={key} className="plan-combo-section">
              {/* Combo header */}
              <div className="plan-combo-hdr">
                <span style={{ color: opProp.color }}>{opProp.name}</span>
                <span style={{ color: 'var(--text-2)' }}>→</span>
                <span style={{ color: cpProp.color }}>{cpProp.name}</span>
                <span style={{ color: 'var(--text-2)' }}>→</span>
                <span style={{
                  color: targetProp.color,
                  padding: '3px 10px', borderRadius: 4,
                  background: `${targetProp.color}20`,
                  border: `1px solid ${targetProp.color}55`,
                }}>
                  {targetProp.name}
                </span>
              </div>

              {/* Opener / Closer columns */}
              <div className="plan-cols">
                <PlanCol
                  title={`Openers — need ${opProp.name}`}
                  titleColor={opProp.color}
                  wsList={data.ws.filter(ws => ws.p.includes(opId))}
                  jobQuery={jobQuery}
                  excluded={excluded}
                  props={data.props}
                  selected={slots.opener}
                  onSelect={ws => selectWs(key, 'opener', ws)}
                />
                <PlanCol
                  title={`Closers — need ${cpProp.name}`}
                  titleColor={cpProp.color}
                  wsList={data.ws.filter(ws => ws.p.includes(cpId))}
                  jobQuery={jobQuery}
                  excluded={excluded}
                  props={data.props}
                  selected={slots.closer}
                  onSelect={ws => selectWs(key, 'closer', ws)}
                />
              </div>

              {/* Selection result bar */}
              <SelectionResult
                slots={slots}
                targetPropId={target}
                props={data.props}
                combos={data.combos}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Column ──────────────────────────────────────────────────────────────────

function PlanCol({ title, titleColor, wsList, jobQuery, excluded, props, selected, onSelect }: {
  title: string;
  titleColor: string;
  wsList: WeaponSkill[];
  jobQuery: string;
  excluded: Set<string>;
  props: Record<string, Prop>;
  selected: WeaponSkill | null;
  onSelect: (ws: WeaponSkill) => void;
}) {
  const q = jobQuery.toLowerCase().trim();
  const visible = q
    ? wsList.filter(ws => ws.j.toLowerCase().includes(q) || ws.n.toLowerCase().includes(q))
    : wsList;

  const available   = visible.filter(ws => !excluded.has(ws.w));
  const unavailable = visible.filter(ws =>  excluded.has(ws.w));
  const all = [...available, ...unavailable];

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="plan-col-hdr" style={{ background: 'var(--bg-3)', color: titleColor }}>
        {title}
        <span className="plan-count">
          {available.length} available
          {unavailable.length > 0 ? ` · ${unavailable.length} unavailable` : ''}
        </span>
      </div>
      <div className="plan-col-scroll">
        {all.length === 0 ? (
          <div className="plan-empty">
            {q ? 'No matches for current job filter.' : 'No weapon skills have this property.'}
          </div>
        ) : (
          all.map((ws, i) => {
            const isSelected  = selected?.n === ws.n;
            const isExcluded  = excluded.has(ws.w);
            return (
              <div
                key={i}
                className={[
                  'plan-ws-row',
                  isExcluded  ? 'excluded'  : '',
                  isSelected  ? 'sel'       : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !isExcluded && onSelect(ws)}
                style={{ cursor: isExcluded ? 'default' : 'pointer' }}
              >
                <div className="plan-sel-indicator">
                  {isSelected ? '●' : '○'}
                </div>
                <div className="plan-ws-name">{ws.n}</div>
                <div className="plan-ws-meta">
                  {ws.w}<br />
                  <span style={{ opacity: 0.7 }}>{ws.j}</span>
                </div>
                <div className="plan-ws-badges">
                  {ws.p.map(id => props[id] ? <Badge key={id} prop={props[id]} /> : null)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Selection result bar ─────────────────────────────────────────────────────

function SelectionResult({ slots, targetPropId, props, combos }: {
  slots: Slots;
  targetPropId: string;
  props: Record<string, Prop>;
  combos: Record<string, string>;
}) {
  const { opener, closer } = slots;

  if (!opener && !closer) {
    return (
      <div className="plan-result-hint">
        ↑ Click a weapon skill in each column to confirm this combination
      </div>
    );
  }

  const resultId  = opener && closer
    ? resolveChain(opener.p, closer.p, combos, props)
    : null;
  const resultProp = resultId ? props[resultId] : null;
  const isMatch    = resultId === targetPropId;
  const targetProp = props[targetPropId];

  return (
    <div className={`plan-result ${opener && closer ? (isMatch ? 'match' : 'nomatch') : 'partial'}`}>
      {/* Opener slot */}
      {opener ? (
        <div className="plan-result-ws">
          <span className="plan-result-ws-name">{opener.n}</span>
          <span className="plan-result-ws-sub">{opener.w}</span>
        </div>
      ) : (
        <div className="plan-result-empty">Select opener ↑</div>
      )}

      <span className="plan-result-arrow">→</span>

      {/* Closer slot */}
      {closer ? (
        <div className="plan-result-ws">
          <span className="plan-result-ws-name">{closer.n}</span>
          <span className="plan-result-ws-sub">{closer.w}</span>
        </div>
      ) : (
        <div className="plan-result-empty">Select closer ↑</div>
      )}

      {/* Computed outcome */}
      {opener && closer && (
        <>
          <span className="plan-result-arrow">=</span>
          {resultProp ? (
            <div className="plan-result-sc" style={{ color: resultProp.color, borderColor: `${resultProp.color}66`, background: `${resultProp.color}15` }}>
              {resultProp.name}
              <span style={{ fontSize: '.65rem', opacity: .7, marginLeft: 4 }}>Lv{resultProp.level}</span>
              <span className="plan-result-badge">{isMatch ? '✓ Match' : `✗ Not ${targetProp?.name ?? ''}`}</span>
            </div>
          ) : (
            <div className="plan-result-sc plan-result-none">
              No Skillchain <span className="plan-result-badge">✗</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
