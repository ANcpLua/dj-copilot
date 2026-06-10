#!/usr/bin/env node
// ============================================================
// CodeSonify DJ Copilot - Demo CLI
//   npm run dj [-- <repo-path>] [--style electronic] [--out <dir>]
// Hears a repository as one continuous, harmonically-mixed DJ set.
// Offline by default (LocalFoundryIq fixture); set FOUNDRY_IQ_MCP_URL
// (+ FOUNDRY_IQ_API_KEY) for live Foundry IQ grounding.
// ============================================================

import { initTelemetry, shutdownTelemetry } from './telemetry.js';
import { createKnowledgeClient } from './knowledge.js';
import { sequenceSet } from './sequencer.js';
import type { MusicStyle } from '../core/mapper.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const styleIdx = args.indexOf('--style');
  const outIdx = args.indexOf('--out');
  const style = (styleIdx >= 0 ? args[styleIdx + 1] : 'electronic') as MusicStyle;
  const outDir = outIdx >= 0 ? args[outIdx + 1] : 'djset-out';
  const repo = args.find(a => !a.startsWith('--') && a !== style && a !== outDir) ?? '.';

  initTelemetry();
  const kb = await createKnowledgeClient();
  console.log(`🎧 DJ Copilot — sequencing ${repo} (IQ: ${kb.mode})\n`);

  try {
    const set = await sequenceSet(repo, kb, outDir, { style });

    console.log(`🎛  Set: ${set.repo} — ${set.tracks.length} tracks, ${Math.round(set.totalDurationSec)}s\n`);
    set.tracks.forEach((t, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${t.file}  [${t.camelot} · ${t.bpm} BPM · energy ${t.energy}]`);
      const tr = set.transitions[i];
      if (tr) {
        const cite = tr.citation ? `${tr.citation} — "${tr.citedRule}"` : 'uncited (degraded)';
        console.log(`      ↳ ${tr.camelot} | ${tr.bpm} BPM | ${tr.technique}`);
        console.log(`        📖 ${cite}`);
      }
    });

    const cited = set.transitions.length - set.degradedCount;
    console.log(`\n✅ ${cited}/${set.transitions.length} transitions cited from the dj-craft KB` +
      (set.degradedCount ? ` (${set.degradedCount} degraded to plain crossfade)` : ''));
    console.log(`📦 Artifacts: ${set.artifacts.json}  |  ${set.artifacts.midi}`);
    console.log(`🔊 Open ${set.artifacts.midi} in GarageBand/any DAW to hear the set.`);
  } finally {
    await kb.close();
    await shutdownTelemetry(); // force-flush spans to qyl before exit
  }
}

main().catch(err => {
  console.error(`❌ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
