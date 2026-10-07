import type { Island } from '../data/islands.ts';
import type { Mech } from '../data/mechanics.ts';

export type Level = 0 | 1 | 2;

export type Ctx = {
  island: Island;
  level: Level;
  mech: Mech;
  stage: HTMLElement;
  /** Narrate an instruction, show it in the speech bubble and make it replayable. */
  instruct(keys: string[], text: string): Promise<void>;
  say(keys: string | string[]): Promise<void>;
  /** Positive feedback for a correct step. `final` ends with a bigger celebration. */
  good(el?: Element | null, final?: boolean): Promise<void>;
  /** Gentle feedback for a mistake. */
  bad(el?: Element | null): void;
  mistakes: number;
  closed: () => boolean;
  /** Yuna's reaction in the corner. */
  mood(pose: 'think' | 'point' | 'cheer' | 'clap' | 'wave'): void;
};

export type Game = (ctx: Ctx) => Promise<void>;

// Items with a real sound effect, played when tapped.
export const ITEM_SOUNDS = new Set([
  'vaca', 'cao', 'porco', 'galinha', 'ovelha', 'cavalo', 'pato', 'gato', 'burro', 'pintainho', 'cabra', 'passaro', 'abelha', 'golfinho', 'gaivota',
  'carro', 'comboio', 'aviao', 'helicoptero', 'navio', 'bicicleta', 'autocarro', 'mota', 'foguetao', 'trator',
]);
export const INSTRUMENTS = ['piano', 'guitarra', 'violino', 'tambor', 'sino', 'trompete', 'cavaquinho', 'maracas', 'flauta', 'xilofone'];
export const itemSound = (id: string) =>
  ITEM_SOUNDS.has(id) ? (['carro', 'comboio', 'aviao', 'helicoptero', 'navio', 'bicicleta', 'autocarro', 'mota', 'foguetao', 'trator'].includes(id) ? 've-' : 'an-') + id
    : INSTRUMENTS.includes(id) ? 'inst-' + id : null;

/** Exposes the solution of the current mini-game to automated tests (only with ?test=). */
export function testHook(value: unknown) {
  if (location.search.includes('test=')) (window as unknown as { __answer: unknown }).__answer = value;
}

export const sizeFor = (n: number) => (n <= 2 ? 'xl' : n <= 3 ? 'lg' : n <= 4 ? 'md' : n <= 6 ? 'sm' : 'xs');
