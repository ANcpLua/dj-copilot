// ============================================================
// CodeSonify DJ Copilot - DJSequencer
// Orders a repository's per-file compositions into one
// beat-matched, energy-arc'd continuous DJ set. Every transition
// decision retrieves from and cites the dj-craft knowledge base;
// if a lookup fails the transition degrades to a plain crossfade
// and the set always completes.
// ============================================================

import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, relative, resolve } from 'path';
import { SpanStatusCode } from '@opentelemetry/api';
import { Composer } from '../core/composer.js';
import { MidiGenerator } from '../core/midi.js';
import type { MusicStyle } from '../core/mapper.js';
import { CodeLanguage, InstrumentType, MusicComposition, MusicNote, MusicTrack } from '../core/types.js';
import { CamelotKey, CamelotMove, bpmScore, camelotTonic, classifyMove, formatCamelot, harmonicScore, toCamelot, wheelStepSemitones, wrapWheel } from './camelot.js';
import { KnowledgeClient } from './knowledge.js';
import { djTracer } from './telemetry.js';

// --- Types ---

export interface SetTrack {
  file: string;            // path relative to the repo root
  language: CodeLanguage;
  camelot: string;         // e.g. "8A"
  key: string;             // e.g. "A minor"
  bpm: number;
  energy: number;          // complexity 0-100
  durationSec: number;
  composition: MusicComposition;
}

export interface SetTransition {
  fromFile: string;
  toFile: string;
  move: CamelotMove;
  camelot: string;         // "8A → 9A"
  bpm: string;             // "124 → 128"
  technique: string;       // human-readable mixing technique
  citation: string | null; // KB sourceRef, e.g. "kb/camelot#2"
  citedRule: string | null;// KB rule title
  degraded: boolean;       // true when the KB lookup failed
}

export interface DJSet {
  repo: string;
  iqMode: string;
  tracks: SetTrack[];
  transitions: SetTransition[];
  totalDurationSec: number;
  degradedCount: number;
}

export interface SequenceOptions {
  style?: MusicStyle;
  maxTracks?: number;      // a set has a length; default 12
  minLines?: number;       // skip trivial files; default 10
}

const SOURCE_EXTENSIONS: Record<string, CodeLanguage> = {
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript',
  '.py': 'python', '.java': 'java', '.cs': 'csharp', '.go': 'go', '.rs': 'rust',
};
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'obj', 'bin', '.idea', '.vscode', 'vendor', '__pycache__']);

// --- Crate collection: sonify every source file ---

function walkSourceFiles(dir: string, root: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(entry) && !entry.startsWith('.')) walkSourceFiles(full, root, acc);
    } else if (SOURCE_EXTENSIONS[extname(entry)] !== undefined) {
      acc.push(full);
    }
  }
}

/** FNV-1a — stable per-file hash so a repo always produces the same set. */
function pathHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function transposeNote(note: string, semitones: number): string {
  const m = note.match(/^([A-G]#?)(\d+)$/);
  if (!m) return note;
  const idx = CHROMATIC.indexOf(m[1]);
  if (idx < 0) return note;
  const midi = Math.min(127, Math.max(0, (parseInt(m[2], 10) + 1) * 12 + idx + semitones));
  return `${CHROMATIC[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export function collectTracks(repoDir: string, opts: SequenceOptions = {}): SetTrack[] {
  const { style = 'electronic', maxTracks = 12, minLines = 10 } = opts;
  const root = resolve(repoDir);
  const composer = new Composer();
  const files: string[] = [];
  walkSourceFiles(root, root, files);

  const tracks: SetTrack[] = [];
  for (const file of files.sort()) {
    const code = readFileSync(file, 'utf8');
    if (code.split('\n').length < minLines) continue;
    const rel = relative(root, file);
    const { composition } = composer.sonify({ code, language: SOURCE_EXTENSIONS[extname(file)], style });

    // Each file gets its own key in the neighborhood of its language's home
    // key (±2 wheel steps, optional relative side flip), and the notes are
    // transposed to match — the DJ equivalent of key-shifting a track to fit
    // the mix. Wheel steps are perfect fifths; relative flips share notes.
    const home = toCamelot(composition.key, composition.scale);
    const h = pathHash(rel);
    const offset = (h % 5) - 2;
    const flip = ((h >> 3) & 1) === 1;
    const camelot: CamelotKey = {
      num: wrapWheel(home.num + offset),
      side: flip ? (home.side === 'A' ? 'B' : 'A') : home.side,
    };
    const semis = wheelStepSemitones(offset);
    if (semis !== 0) {
      for (const tr of composition.tracks) {
        for (const n of tr.notes) n.note = transposeNote(n.note, semis);
      }
    }

    tracks.push({
      file: rel,
      language: composition.metadata.sourceLanguage,
      camelot: formatCamelot(camelot),
      key: `${camelotTonic(camelot)} ${camelot.side === 'B' ? 'major' : 'minor'}`,
      bpm: composition.tempo,
      energy: composition.metadata.complexity,
      durationSec: composition.duration,
      composition,
    });
  }

  // Keep the most energy-diverse crate: sort by energy and sample evenly.
  tracks.sort((a, b) => a.energy - b.energy);
  if (tracks.length > maxTracks) {
    const sampled: SetTrack[] = [];
    for (let i = 0; i < maxTracks; i++) {
      sampled.push(tracks[Math.round((i * (tracks.length - 1)) / (maxTracks - 1))]);
    }
    return sampled;
  }
  return tracks;
}

// --- Energy-arc ordering ---

/** Target energy (0..1) at normalized set position p: build → peak at ~70% → release. */
function arcTarget(p: number): number {
  if (p <= 0.7) return 0.15 + 0.85 * Math.pow(p / 0.7, 1.2);
  return 1.0 - 0.55 * ((p - 0.7) / 0.3);
}

export function orderForEnergyArc(tracks: SetTrack[]): SetTrack[] {
  if (tracks.length <= 2) return [...tracks];
  const lo = Math.min(...tracks.map(t => t.energy));
  const hi = Math.max(...tracks.map(t => t.energy));
  const norm = (e: number) => (hi === lo ? 0.5 : (e - lo) / (hi - lo));

  // Opener: lowest energy in the crate (kb/energy#2).
  const pool = [...tracks].sort((a, b) => a.energy - b.energy);
  const ordered: SetTrack[] = [pool.shift()!];

  // Greedy: each slot wants the pool track best matching the arc's target
  // energy, weighted by harmonic + BPM compatibility with the current track.
  while (pool.length > 0) {
    const p = ordered.length / tracks.length;
    const target = arcTarget(p);
    const current = ordered[ordered.length - 1];
    const from = parseCamelot(current.camelot);

    let best = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      const energyFit = 1 - Math.abs(norm(cand.energy) - target);
      const score =
        2.0 * energyFit +
        1.5 * harmonicScore(from, parseCamelot(cand.camelot)) +
        1.0 * bpmScore(current.bpm, cand.bpm);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    ordered.push(pool.splice(best, 1)[0]);
  }
  return ordered;
}

function parseCamelot(s: string): CamelotKey {
  return { num: parseInt(s, 10), side: s.endsWith('B') ? 'B' : 'A' };
}

// --- Transition planning: every decision retrieves from the KB ---

const MOVE_QUERY: Record<CamelotMove, string> = {
  'hold': 'same key blend extended',
  'adjacent-up': 'one step clockwise energy lift adjacent key',
  'adjacent-down': 'one step counterclockwise energy ease',
  'relative': 'relative major minor switch',
  'boost': 'two step energy boost plus two',
  'diagonal': 'key clash phrase cut',
  'clash': 'key clash phrase cut incompatible',
};

const MOVE_TECHNIQUE: Record<CamelotMove, string> = {
  'hold': 'extended same-key blend (16-32 bars)',
  'adjacent-up': 'clockwise lift — gradual EQ swap on a 16-bar phrase',
  'adjacent-down': 'counterclockwise ease — long overlap descent',
  'relative': 'relative major/minor switch — mood flip at held energy',
  'boost': '+2 energy boost — short 8-bar percussion-led swap',
  'diagonal': 'phrase cut — echo-out on the boundary, clean restart',
  'clash': 'phrase cut — echo-out on the boundary, clean restart',
};

export async function planTransitions(ordered: SetTrack[], kb: KnowledgeClient): Promise<SetTransition[]> {
  const tracer = djTracer();
  const transitions: SetTransition[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const move = classifyMove(parseCamelot(a.camelot), parseCamelot(b.camelot));
    // When the tempo gap breaks the ±6% window, the governing rule is the
    // BPM rule — cite that, not the key rule.
    const bpmLed = Math.abs(b.bpm - a.bpm) / a.bpm > 0.06;
    const query = (bpmLed
      ? `bpm ${a.bpm} to ${b.bpm}: tempo six percent window step strategy`
      : `camelot ${a.camelot} to ${b.camelot}: ${MOVE_QUERY[move]}`).slice(0, 150);
    const technique = bpmLed
      ? `tempo step beyond ±6% — climb across the blend, then ${MOVE_TECHNIQUE[move]}`
      : MOVE_TECHNIQUE[move];

    const transition = await tracer.startActiveSpan('dj.plan_transition', async span => {
      span.setAttribute('dj.from', a.file);
      span.setAttribute('dj.to', b.file);
      span.setAttribute('dj.move', move);
      span.setAttribute('iq.mode', kb.mode);
      span.setAttribute('iq.query', query);
      try {
        const hits = await kb.retrieve(query);
        const top = hits[0];
        if (!top?.citation) throw new Error('no cited rule returned');
        span.setAttribute('iq.citation', top.citation);
        span.setStatus({ code: SpanStatusCode.OK });
        return {
          fromFile: a.file, toFile: b.file, move,
          camelot: `${a.camelot} → ${b.camelot}`,
          bpm: `${a.bpm} → ${b.bpm}`,
          technique,
          citation: top.citation,
          citedRule: top.title,
          degraded: false,
        };
      } catch (err) {
        // The set always completes: degrade to a plain crossfade (kb/fx#1).
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[dj] KB lookup failed for ${a.file} → ${b.file} (${msg}); degrading to plain crossfade`);
        span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
        return {
          fromFile: a.file, toFile: b.file, move,
          camelot: `${a.camelot} → ${b.camelot}`,
          bpm: `${a.bpm} → ${b.bpm}`,
          technique: 'plain crossfade on a phrase boundary (degraded)',
          citation: null,
          citedRule: null,
          degraded: true,
        };
      } finally {
        span.end();
      }
    });
    transitions.push(transition);
  }
  return transitions;
}

// --- Stitch the ordered tracks into one continuous composition ---

const CROSSFADE_SEC = 2;

export function buildSetComposition(ordered: SetTrack[], repo: string): MusicComposition {
  const byInstrument = new Map<InstrumentType, MusicNote[]>();
  let offset = 0;

  for (const track of ordered) {
    for (const t of track.composition.tracks) {
      const notes = byInstrument.get(t.instrument) ?? [];
      for (const n of t.notes) {
        notes.push({ ...n, time: n.time + offset });
      }
      byInstrument.set(t.instrument, notes);
    }
    offset += Math.max(0, track.durationSec - CROSSFADE_SEC);
  }

  const reference = ordered[0].composition;
  const tracks: MusicTrack[] = [];
  for (const refTrack of reference.tracks) {
    const notes = byInstrument.get(refTrack.instrument);
    if (notes) {
      tracks.push({ ...refTrack, notes: notes.sort((x, y) => x.time - y.time) });
      byInstrument.delete(refTrack.instrument);
    }
  }
  for (const [instrument, notes] of byInstrument) {
    tracks.push({
      name: instrument, instrument, waveform: 'sine', volume: 0.5,
      notes: notes.sort((x, y) => x.time - y.time), effects: [],
    });
  }

  const bpms = ordered.map(t => t.bpm).sort((x, y) => x - y);
  return {
    ...reference,
    title: `DJ Copilot set: ${repo}`,
    tempo: bpms[Math.floor(bpms.length / 2)],
    duration: offset + CROSSFADE_SEC,
    tracks,
  };
}

// --- Top-level entry: sequence a repository into a DJ set ---

export async function sequenceSet(
  repoDir: string,
  kb: KnowledgeClient,
  outDir: string,
  opts: SequenceOptions = {},
): Promise<DJSet & { artifacts: { json: string; midi: string } }> {
  const tracer = djTracer();
  return tracer.startActiveSpan('dj.sequence_set', async span => {
    try {
      span.setAttribute('dj.repo', resolve(repoDir));
      span.setAttribute('iq.mode', kb.mode);

      const crate = collectTracks(repoDir, opts);
      if (crate.length < 2) throw new Error(`need at least 2 sonifiable source files in ${repoDir}, found ${crate.length}`);
      const ordered = orderForEnergyArc(crate);
      const transitions = await planTransitions(ordered, kb);

      const repoName = resolve(repoDir).split('/').pop() ?? repoDir;
      const setComposition = buildSetComposition(ordered, repoName);

      mkdirSync(outDir, { recursive: true });
      const jsonPath = join(outDir, 'djset.json');
      const midiPath = join(outDir, 'djset.mid');
      const set: DJSet = {
        repo: repoName,
        iqMode: kb.mode,
        tracks: ordered,
        transitions,
        totalDurationSec: setComposition.duration,
        degradedCount: transitions.filter(t => t.degraded).length,
      };
      writeFileSync(jsonPath, JSON.stringify(set, (k, v) => (k === 'composition' ? undefined : v), 2));
      writeFileSync(midiPath, new MidiGenerator().generate(setComposition));

      span.setAttribute('dj.tracks', ordered.length);
      span.setAttribute('dj.transitions', transitions.length);
      span.setAttribute('dj.degraded', set.degradedCount);
      span.setStatus({ code: SpanStatusCode.OK });
      return { ...set, artifacts: { json: jsonPath, midi: midiPath } };
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : String(err) });
      throw err;
    } finally {
      span.end();
    }
  });
}
