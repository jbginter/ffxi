import { useState, useCallback, useMemo } from 'react';
import type { CharacterJob, ChainStep, WeaponSkill } from '../../types';
import { useData } from '../../context/DataContext';
import { ChainRail } from './ChainRail';
import { BurstPanel } from './BurstPanel';
import { WsList } from './WsList';
import { ManualProps } from './ManualProps';
import { computeResults, resolveChain } from '../../lib/chain';

export function ChainBuilder({ characterJobs }: { characterJobs: CharacterJob[] }) {
  const { data } = useData();
  const [chain, setChain] = useState<ChainStep[]>([]);
  const [wFilter, setWFilter] = useState('all');
  const [manualSel, setManualSel] = useState<Set<string>>(new Set());

  const addStep = useCallback((ws: WeaponSkill) => {
    setChain(prev => [...prev, { n: ws.n, w: ws.w, p: ws.p }]);
  }, []);

  const removeStep = useCallback((idx: number) => {
    setChain(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addManualStep = useCallback(() => {
    if (!manualSel.size || !data) return;
    const ids = [...manualSel];
    const names = ids.map(id => data.props[id]?.name ?? id).join(' / ');
    setChain(prev => [...prev, { n: `Custom (${names})`, w: '', p: ids }]);
    setManualSel(new Set());
  }, [manualSel, data]);

  const clearChain = useCallback(() => setChain([]), []);

  const visibleWs = useMemo(() => {
    if (!data) return [];
    const jobSet = new Set(characterJobs.map(j => j.job));
    return jobSet.size > 0
      ? data.ws.filter(ws => ws.j.split('/').some(j => jobSet.has(j)))
      : data.ws;
  }, [characterJobs, data]);

  const results = useMemo(
    () => data ? computeResults(chain, data.combos, data.props) : [],
    [chain, data],
  );

  // Mirror computeResults: use resonance as opener when one exists,
  // otherwise fall back to the last step's own properties.
  const isCompatible = useCallback((wsProps: string[]) => {
    if (!data || chain.length === 0) return true;
    const resonance = results[results.length - 1];
    const openProps = resonance ? [resonance] : chain[chain.length - 1].p;
    return !!resolveChain(openProps, wsProps, data.combos, data.props);
  }, [chain, results, data]);

  if (!data) return null;

  const lastSC = results[results.length - 1] ?? null;

  return (
    <div className="builder">
      <div>
        <div className="sec-title">Skillchain Builder</div>
        <div className="sec-sub">Click a weapon skill below to add it to the chain. Each step resolves the skillchain formed and updates magic burst options.</div>
      </div>
      <ChainRail chain={chain} results={results} props={data.props} onRemove={removeStep} />
      {lastSC && <BurstPanel scId={lastSC} props={data.props} mb={data.mb} />}
      <div className="sel-area">
        <WsList
          ws={visibleWs}
          props={data.props}
          wFilter={wFilter}
          onFilterChange={setWFilter}
          onSelect={addStep}
          isCompatible={isCompatible}
          hasChain={chain.length > 0}
        />
        <ManualProps
          props={data.props}
          manualSel={manualSel}
          onSelChange={setManualSel}
          onAdd={addManualStep}
        />
      </div>
      <div>
        <button className="clear-btn" onClick={clearChain}>✕ Clear Chain</button>
      </div>
    </div>
  );
}
