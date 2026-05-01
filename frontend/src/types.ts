export interface Prop {
  id: string;
  name: string;
  level: number;
  elements: string[];
  color: string;
  aeonic?: boolean;
}

export interface WeaponSkill {
  n: string;
  w: string;
  j: string;
  p: string[];
}

export interface ChainStep {
  n: string;
  w: string;
  p: string[];
}

export interface GameData {
  props: Record<string, Prop>;
  combos: Record<string, string>;
  mb: Record<string, string[]>;
  ws: WeaponSkill[];
}

export type TabId = 'builder' | 'reference' | 'magicburst' | 'weaponskills';
