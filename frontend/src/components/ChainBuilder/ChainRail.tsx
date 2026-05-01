import { Fragment } from 'react';
import type { ChainStep, Prop } from '../../types';
import { Badge } from '../shared/Badge';

interface Props {
  chain: ChainStep[];
  results: (string | null)[];
  props: Record<string, Prop>;
  onRemove: (idx: number) => void;
}

function ScBridgePill({ sc }: { sc: Prop | null }) {
  if (!sc) return <div className="sc-pill miss">✕ No Chain</div>;
  return (
    <div className="sc-pill" style={{ color: sc.color, borderColor: sc.color, background: `${sc.color}18` }}>
      {sc.name}
      <sup style={{ fontSize: '.6rem', opacity: 0.7, marginLeft: 3 }}>Lv{sc.level}</sup>
    </div>
  );
}

export function ChainRail({ chain, results, props, onRemove }: Props) {
  if (chain.length === 0) {
    return (
      <div className="chain-rail">
        <span style={{ color: 'var(--text-2)', fontSize: '.88rem', margin: 'auto' }}>
          Select a weapon skill below to begin the chain
        </span>
      </div>
    );
  }

  return (
    <div className="chain-rail">
      {chain.map((step, i) => (
        <Fragment key={i}>
          <div className="ws-node">
            <div className="ws-card">
              <button className="rm-btn" onClick={() => onRemove(i)}>✕</button>
              <div className="ws-name">{step.n}</div>
              <div className="ws-weap">{step.w || 'Manual'}</div>
              <div className="ws-props">
                {step.p.length === 0 ? (
                  <span style={{ color: 'var(--text-2)', fontSize: '.7rem', fontStyle: 'italic' }}>No properties</span>
                ) : (
                  step.p.map(id => props[id] ? <Badge key={id} prop={props[id]} /> : null)
                )}
              </div>
            </div>
          </div>
          {i < chain.length - 1 && (
            <div className="sc-bridge">
              <ScBridgePill sc={results[i] ? props[results[i]!] : null} />
              <div className="bridge-line" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
