import type { Mech } from '../data/mechanics.ts';
import type { Game } from './types.ts';
import { find, riddle, english, shadow, odd, colorof, letterstart, sound, missing } from './choice.ts';
import { count, more, connect } from './count.ts';
import { basket, sort, feed } from './dragging.ts';
import { memory, simon, pattern, size } from './memory.ts';
import { bubbles, catchGame, peek } from './action.ts';
import { trace, paint, mix } from './draw.ts';
import { puzzle, maze } from './puzzle.ts';
export { makeSession } from './session.ts';

export const GAMES: Record<Mech, Game> = {
  find, riddle, english, shadow, odd, colorof, letterstart, sound, missing,
  count, more, connect, basket, sort, feed, memory, simon, pattern, size,
  bubbles, catch: catchGame, peek, trace, paint, mix, puzzle, maze,
};
