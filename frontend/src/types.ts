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

export type TabId = 'builder' | 'reference' | 'magicburst' | 'weaponskills' | 'character';

export interface CharacterJob {
  job: string;
  level: number;
}

export interface CharacterProfile {
  name: string;
  server: string;
  jobs: CharacterJob[];
}

export interface AHSale {
  saleon: number;
  seller_name: string;
  buyer_name: string;
  price: number;
  stack?: boolean;
}

export interface FFXIAHCharacter {
  name: string;
  server: string;
  url: string;
  id?: number;
  sales: AHSale[];
}
