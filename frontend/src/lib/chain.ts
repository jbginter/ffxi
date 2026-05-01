import type { ChainStep, Prop } from '../types';

export function resolveChain(
  openProps: string[],
  closeProps: string[],
  combos: Record<string, string>,
  props: Record<string, Prop>,
): string | null {
  let best: string | null = null;
  let bestLv = -1;
  for (const op of openProps) {
    for (const cp of closeProps) {
      const r = combos[`${op}:${cp}`];
      if (r && props[r].level > bestLv) {
        best = r;
        bestLv = props[r].level;
      }
    }
  }
  return best;
}

export function getBurstElements(scId: string, mb: Record<string, string[]>): string[] {
  return Object.entries(mb)
    .filter(([, ids]) => ids.includes(scId))
    .map(([el]) => el);
}

export function computeResults(
  steps: ChainStep[],
  combos: Record<string, string>,
  props: Record<string, Prop>,
): (string | null)[] {
  const out: (string | null)[] = [];
  let resonance: string | null = null;
  for (let i = 0; i < steps.length - 1; i++) {
    const openProps = resonance ? [resonance] : steps[i].p;
    const sc = resolveChain(openProps, steps[i + 1].p, combos, props);
    out.push(sc);
    resonance = sc;
  }
  return out;
}
