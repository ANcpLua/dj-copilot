// ============================================================
// CodeSonify DJ Copilot - Camelot Wheel
// Maps musical keys to Camelot positions and classifies the
// harmonic relationship between two tracks' keys.
// ============================================================

import { NoteName, ScaleType } from '../core/types.js';

export interface CamelotKey {
  num: number;        // 1-12 position on the wheel
  side: 'A' | 'B';    // A = minor, B = major
}

export type CamelotMove =
  | 'hold'            // same key — extended blend
  | 'adjacent-up'     // +1 clockwise, same side — energy lift
  | 'adjacent-down'   // -1 counterclockwise, same side — energy ease
  | 'relative'        // same number, side switch — major/minor swap
  | 'boost'           // +2 clockwise, same side — aggressive energy boost
  | 'diagonal'        // ±1 with side switch — workable but tense
  | 'clash';          // anything further — incompatible keys

// Camelot numbers for major keys (B side) and minor keys (A side).
const MAJOR_NUM: Record<NoteName, number> = {
  'C': 8, 'G': 9, 'D': 10, 'A': 11, 'E': 12, 'B': 1,
  'F#': 2, 'C#': 3, 'G#': 4, 'D#': 5, 'A#': 6, 'F': 7,
};
const MINOR_NUM: Record<NoteName, number> = {
  'A': 8, 'E': 9, 'B': 10, 'F#': 11, 'C#': 12, 'G#': 1,
  'D#': 2, 'A#': 3, 'F': 4, 'C': 5, 'G': 6, 'D': 7,
};

// codesonify scales collapse onto the wheel's two sides by tonal color:
// brighter modes mix like majors, darker modes like minors.
const SCALE_SIDE: Record<ScaleType, 'A' | 'B'> = {
  major: 'B',
  lydian: 'B',
  mixolydian: 'B',
  pentatonic: 'B',
  minor: 'A',
  dorian: 'A',
  blues: 'A',
  chromatic: 'A',
};

export function toCamelot(key: NoteName, scale: ScaleType): CamelotKey {
  const side = SCALE_SIDE[scale];
  const num = side === 'B' ? MAJOR_NUM[key] : MINOR_NUM[key];
  return { num, side };
}

const NUM_TO_MAJOR = Object.fromEntries(Object.entries(MAJOR_NUM).map(([k, n]) => [n, k])) as Record<number, NoteName>;
const NUM_TO_MINOR = Object.fromEntries(Object.entries(MINOR_NUM).map(([k, n]) => [n, k])) as Record<number, NoteName>;

/** Tonic note name for a Camelot position. */
export function camelotTonic(c: CamelotKey): NoteName {
  return c.side === 'B' ? NUM_TO_MAJOR[c.num] : NUM_TO_MINOR[c.num];
}

/** Wrap a wheel position into 1..12. */
export function wrapWheel(num: number): number {
  return ((num - 1) % 12 + 12) % 12 + 1;
}

/**
 * Semitone shift for moving k steps clockwise on the wheel
 * (each step is a perfect fifth), normalized to -5..+6.
 */
export function wheelStepSemitones(k: number): number {
  let s = (k * 7) % 12;
  if (s > 6) s -= 12;
  if (s < -5) s += 12;
  return s;
}

export function formatCamelot(c: CamelotKey): string {
  return `${c.num}${c.side}`;
}

/** Signed clockwise distance from a to b on the 12-position wheel: -5..+6 */
function wheelDelta(a: number, b: number): number {
  let d = (b - a) % 12;
  if (d > 6) d -= 12;
  if (d < -5) d += 12;
  return d;
}

export function classifyMove(from: CamelotKey, to: CamelotKey): CamelotMove {
  const d = wheelDelta(from.num, to.num);
  const sameSide = from.side === to.side;
  if (sameSide) {
    if (d === 0) return 'hold';
    if (d === 1) return 'adjacent-up';
    if (d === -1) return 'adjacent-down';
    if (d === 2) return 'boost';
    return 'clash';
  }
  if (d === 0) return 'relative';
  if (Math.abs(d) === 1) return 'diagonal';
  return 'clash';
}

/** Harmonic compatibility 0..1 — used by the sequencer to pick the next track. */
export function harmonicScore(from: CamelotKey, to: CamelotKey): number {
  switch (classifyMove(from, to)) {
    case 'hold': return 1.0;
    case 'adjacent-up': return 0.92;
    case 'adjacent-down': return 0.88;
    case 'relative': return 0.85;
    case 'boost': return 0.6;
    case 'diagonal': return 0.5;
    case 'clash': return 0.15;
  }
}

/** BPM compatibility 0..1 — full score within the classic ±6% window. */
export function bpmScore(fromBpm: number, toBpm: number): number {
  const ratio = Math.abs(toBpm - fromBpm) / fromBpm;
  if (ratio <= 0.06) return 1.0;
  return Math.max(0, 1 - (ratio - 0.06) * 5);
}
