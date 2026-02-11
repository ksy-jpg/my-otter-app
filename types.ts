
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type StatKey = 'grades' | 'sanity' | 'leadership' | 'skills' | 'service';

export interface Stats {
  grades: number;
  sanity: number;
  leadership: number;
  skills: number;
  service: number;
}

export type OtterType = 'EXCITED' | 'INSPIRED' | 'HAPPY' | 'DETERMINED';

export interface Character {
  name: string;
  otterType: OtterType;
}

export interface Choice {
  text: string;
  modifiers: Partial<Record<StatKey, number>>;
  feedback: string;
  specialTag?: 'REST_BONUS' | 'GRIND_PENALTY';
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  optionA: Choice;
  optionB: Choice;
}

export type GameStatus = 'START' | 'CUSTOMIZATION' | 'PLAYING' | 'GRADUATION';

// --- City Builder Types (Legacy/Reserved) ---
export enum BuildingType {
  None = 'none',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
  Park = 'park',
  Road = 'road',
}

export interface Building {
  type: BuildingType;
  name: string;
  cost: number;
  popGen: number;
  incomeGen: number;
  description: string;
  color: string;
}

export interface CityStats {
  day: number;
  money: number;
  population: number;
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
}

export type Grid = TileData[][];

export interface NewsItem {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface AIGoal {
  description: string;
  targetType: 'population' | 'money' | 'building_count';
  targetValue: number;
  buildingType?: BuildingType;
  reward: number;
  completed: boolean;
}
