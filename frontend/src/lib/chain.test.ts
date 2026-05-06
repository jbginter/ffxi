import { describe, it, expect } from 'vitest';
import { resolveChain, getBurstElements, computeResults } from './chain';
import type { ChainStep, Prop } from '../types';

// Minimal fixtures — enough to exercise all branches without importing live data
const PROPS: Record<string, Prop> = {
  liquefaction:  { id: 'liquefaction',  name: 'Liquefaction',  level: 1, elements: ['Fire'],                    color: '#e85d04' },
  impaction:     { id: 'impaction',     name: 'Impaction',     level: 1, elements: ['Thunder'],                 color: '#9b5de5' },
  induration:    { id: 'induration',    name: 'Induration',    level: 1, elements: ['Ice'],                     color: '#48cae4' },
  reverberation: { id: 'reverberation', name: 'Reverberation', level: 1, elements: ['Water'],                   color: '#0096c7' },
  fusion:        { id: 'fusion',        name: 'Fusion',        level: 2, elements: ['Fire', 'Light'],           color: '#f77f00' },
  distortion:    { id: 'distortion',    name: 'Distortion',    level: 2, elements: ['Ice', 'Water'],            color: '#0077b6' },
  light:         { id: 'light',         name: 'Light',         level: 3, elements: ['Fire', 'Wind', 'Thunder', 'Light'], color: '#ffe169' },
};

const COMBOS: Record<string, string> = {
  'liquefaction:liquefaction':  'liquefaction',   // L1 self-chain
  'induration:induration':      'induration',     // L1 self-chain
  'liquefaction:impaction':     'fusion',         // L1 → L2
  'induration:reverberation':   'distortion',     // L1 → L2
  'distortion:fusion':          'light',          // L2 → L3
};

const MB: Record<string, string[]> = {
  Fire:    ['liquefaction', 'fusion', 'light'],
  Thunder: ['impaction',    'fusion', 'light'],
  Ice:     ['induration',   'distortion'],
  Water:   ['reverberation','distortion'],
};

const step = (p: string[]): ChainStep => ({ n: 'WS', w: 'Weapon', p });

// ── resolveChain ────────────────────────────────────────────────────────────

describe('resolveChain', () => {
  it('returns the correct skillchain for a known pair', () => {
    expect(resolveChain(['liquefaction'], ['impaction'], COMBOS, PROPS)).toBe('fusion');
  });

  it('returns null when no combo exists', () => {
    expect(resolveChain(['impaction'], ['liquefaction'], COMBOS, PROPS)).toBeNull();
  });

  it('picks the highest-level result when a WS has multiple properties', () => {
    // impaction self-chains to L1; liquefaction→impaction gives L2 fusion
    expect(resolveChain(['liquefaction'], ['impaction', 'liquefaction'], COMBOS, PROPS)).toBe('fusion');
  });

  it('self-chain produces the same property', () => {
    expect(resolveChain(['liquefaction'], ['liquefaction'], COMBOS, PROPS)).toBe('liquefaction');
  });

  it('returns null for empty open props', () => {
    expect(resolveChain([], ['impaction'], COMBOS, PROPS)).toBeNull();
  });

  it('returns null for empty close props', () => {
    expect(resolveChain(['liquefaction'], [], COMBOS, PROPS)).toBeNull();
  });

  it('returns null for both empty', () => {
    expect(resolveChain([], [], COMBOS, PROPS)).toBeNull();
  });
});

// ── getBurstElements ─────────────────────────────────────────────────────────

describe('getBurstElements', () => {
  it('returns elements that burst on fusion', () => {
    const result = getBurstElements('fusion', MB);
    expect(result).toContain('Fire');
    expect(result).toContain('Thunder');
  });

  it('returns elements that burst on light', () => {
    const result = getBurstElements('light', MB);
    expect(result).toContain('Fire');
    expect(result).toContain('Thunder');
  });

  it('returns empty array for an SC not in any burst list', () => {
    // 'liquefaction' is not listed in the test MB fixture as a standalone prop
    // that maps to any element key — only Fire includes it, but this exercises
    // the case where we pass a prop absent from all MB values
    expect(getBurstElements('reverberation_missing', MB)).toEqual([]);
  });

  it('does not include elements whose list omits the given SC', () => {
    // Ice bursts on induration/distortion but not fusion
    expect(getBurstElements('fusion', MB)).not.toContain('Ice');
  });
});

// ── computeResults ───────────────────────────────────────────────────────────

describe('computeResults', () => {
  it('returns empty array for zero steps', () => {
    expect(computeResults([], COMBOS, PROPS)).toEqual([]);
  });

  it('returns empty array for a single step', () => {
    expect(computeResults([step(['liquefaction'])], COMBOS, PROPS)).toEqual([]);
  });

  it('resolves a 2-step chain', () => {
    const result = computeResults(
      [step(['liquefaction']), step(['impaction'])],
      COMBOS, PROPS,
    );
    expect(result).toEqual(['fusion']);
  });

  it('returns null between steps where no chain forms', () => {
    const result = computeResults(
      [step(['impaction']), step(['liquefaction'])],
      COMBOS, PROPS,
    );
    expect(result).toEqual([null]);
  });

  it('carries SC resonance forward as the opener for step 3', () => {
    // Step1 [induration] + Step2 [reverberation] → distortion (resonance = 'distortion')
    // Step3 [fusion] → opener=[distortion], distortion:fusion → light
    const result = computeResults(
      [step(['induration']), step(['reverberation']), step(['fusion'])],
      COMBOS, PROPS,
    );
    expect(result).toEqual(['distortion', 'light']);
  });

  it('uses raw step props as opener when no prior SC formed', () => {
    // Step1 [impaction] + Step2 [liquefaction] → null (no chain)
    // Step3 opener comes from Step2's raw props [liquefaction], not null resonance
    // liquefaction + impaction → fusion
    const result = computeResults(
      [step(['impaction']), step(['liquefaction']), step(['impaction'])],
      COMBOS, PROPS,
    );
    expect(result).toEqual([null, 'fusion']);
  });

  it('returns null for each pair in a chain where nothing connects', () => {
    const result = computeResults(
      [step(['impaction']), step(['impaction']), step(['impaction'])],
      COMBOS, PROPS,
    );
    // impaction self-chains → 'induration' is NOT a self-chain here, impaction:impaction is not in COMBOS
    expect(result).toEqual([null, null]);
  });
});
