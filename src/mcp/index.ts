#!/usr/bin/env node
// ============================================================
// CodeSonify - MCP Server
// Model Context Protocol server for VS Code / GitHub Copilot
// Allows developers to sonify code directly from Copilot Chat
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Composer } from '../core/composer.js';
import { CodeParser } from '../core/parser.js';
import { MidiGenerator } from '../core/midi.js';
import { DiffSonifier } from '../core/diff.js';
import type { MusicStyle } from '../core/mapper.js';
import type { CodeLanguage } from '../core/types.js';
import { createKnowledgeClient } from '../dj/knowledge.js';
import { sequenceSet } from '../dj/sequencer.js';
import { initTelemetry } from '../dj/telemetry.js';

// Initialize engines
const composer = new Composer();
const parser = new CodeParser();
const midiGen = new MidiGenerator();
const diffSonifier = new DiffSonifier();

// Create the MCP Server
const server = new McpServer({
  name: 'codesonify',
  version: '1.0.0',
});

// ============================================================
// Tool 1: sonify - Transform code into music
// ============================================================
server.tool(
  'sonify_code',
  'Transform source code into a musical composition. Analyzes code structure (functions, loops, conditionals, etc.) and maps each element to musical notes, rhythms, and harmonies. Returns a full composition with tracks, notes, and metadata.',
  {
    code: z.string().describe('The source code to sonify'),
    language: z.enum([
      'javascript', 'typescript', 'python', 'java',
      'csharp', 'go', 'rust', 'unknown'
    ]).optional().describe('Programming language (auto-detected if not specified)'),
    style: z.enum([
      'classical', 'electronic', 'ambient', 'jazz', 'rock'
    ]).optional().describe('Musical style for the composition (default: classical)'),
  },
  async ({ code, language, style }) => {
    try {
      const result = composer.sonify({
        code,
        language: language as CodeLanguage | undefined,
        style: (style as MusicStyle) || 'classical',
      });

      const { composition, analysis } = result;

      // Format a human-readable summary
      const summary = [
        `🎵 **CodeSonify Composition Generated!**`,
        ``,
        `**Title:** ${composition.title}`,
        `**Key:** ${composition.key} ${composition.scale}`,
        `**Tempo:** ${composition.tempo} BPM`,
        `**Duration:** ${composition.duration.toFixed(1)} seconds`,
        `**Tracks:** ${composition.tracks.length}`,
        ``,
        `📊 **Code Analysis:**`,
        `- Language: ${analysis.language}`,
        `- Lines: ${analysis.metrics.totalLines} (${analysis.metrics.codeLines} code, ${analysis.metrics.commentLines} comments)`,
        `- Functions: ${analysis.metrics.functionCount}`,
        `- Loops: ${analysis.metrics.loopCount}`,
        `- Conditionals: ${analysis.metrics.conditionalCount}`,
        `- Complexity Score: ${analysis.metrics.complexity}/100`,
        `- Max Nesting Depth: ${analysis.metrics.maxNestingDepth}`,
        ``,
        `🎼 **Tracks:**`,
        ...composition.tracks.map(t =>
          `- ${t.name}: ${t.notes.length} notes (${t.waveform} wave)`
        ),
        ``,
        `💬 **Musical Interpretation:**`,
        `${composition.metadata.musicalInterpretation}`,
        ``,
        `🔊 **To listen:** Open the CodeSonify web app and paste this composition ID: ${composition.metadata.codeHash}`,
        `Or visit: http://localhost:3000?code=${encodeURIComponent(code.substring(0, 200))}`,
      ].join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: summary,
          },
          {
            type: 'text' as const,
            text: `\n---\n📦 **Full Composition JSON:**\n\`\`\`json\n${JSON.stringify(composition, null, 2).substring(0, 3000)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error sonifying code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }
);

// ============================================================
// Tool 2: analyze_code - Analyze code without generating music
// ============================================================
server.tool(
  'analyze_code_structure',
  'Analyze the structure of source code without generating music. Returns metrics like complexity score, function count, loop count, nesting depth, and more. Useful for understanding code health.',
  {
    code: z.string().describe('The source code to analyze'),
    language: z.enum([
      'javascript', 'typescript', 'python', 'java',
      'csharp', 'go', 'rust', 'unknown'
    ]).optional().describe('Programming language (auto-detected if not specified)'),
  },
  async ({ code, language }) => {
    try {
      const analysis = parser.analyze(code, language as CodeLanguage | undefined);
      const { metrics } = analysis;

      // Create a visual complexity bar
      const complexityBar = '█'.repeat(Math.round(metrics.complexity / 5)) +
                           '░'.repeat(20 - Math.round(metrics.complexity / 5));

      const summary = [
        `📊 **Code Structure Analysis**`,
        ``,
        `**Language:** ${analysis.language}`,
        `**Complexity:** [${complexityBar}] ${metrics.complexity}/100`,
        ``,
        `📏 **Size Metrics:**`,
        `- Total Lines: ${metrics.totalLines}`,
        `- Code Lines: ${metrics.codeLines}`,
        `- Comment Lines: ${metrics.commentLines}`,
        `- Empty Lines: ${metrics.emptyLines}`,
        ``,
        `🔧 **Structure Metrics:**`,
        `- Functions: ${metrics.functionCount}`,
        `- Classes: ${metrics.classCount}`,
        `- Loops: ${metrics.loopCount}`,
        `- Conditionals: ${metrics.conditionalCount}`,
        `- Variables: ${metrics.variableCount}`,
        `- Imports: ${metrics.importCount}`,
        `- Max Nesting Depth: ${metrics.maxNestingDepth}`,
        ``,
        metrics.errorCount > 0
          ? `⚠️ **Potential Issues:** ${metrics.errorCount} error-like patterns detected`
          : `✅ **No obvious issues detected**`,
        ``,
        `🎵 **Musical Preview:** This code would generate a ${
          metrics.complexity > 70 ? 'fast, intense' :
          metrics.complexity > 40 ? 'moderate, balanced' :
          'slow, peaceful'
        } composition at ~${Math.round(70 + (metrics.complexity / 100) * 90)} BPM`,
      ].join('\n');

      return {
        content: [{
          type: 'text' as const,
          text: summary,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error analyzing code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }
);

// ============================================================
// Tool 3: compare_code_music - Compare two pieces of code musically
// ============================================================
server.tool(
  'compare_code_musically',
  'Compare two pieces of code by their musical characteristics. See how different code structures produce different musical compositions. Great for understanding code quality differences.',
  {
    code_a: z.string().describe('First piece of code'),
    code_b: z.string().describe('Second piece of code'),
    style: z.enum([
      'classical', 'electronic', 'ambient', 'jazz', 'rock'
    ]).optional().describe('Musical style for comparison'),
  },
  async ({ code_a, code_b, style }) => {
    try {
      const resultA = composer.sonify({
        code: code_a,
        style: (style as MusicStyle) || 'classical',
      });
      const resultB = composer.sonify({
        code: code_b,
        style: (style as MusicStyle) || 'classical',
      });

      const compA = resultA.composition;
      const compB = resultB.composition;
      const metA = resultA.analysis.metrics;
      const metB = resultB.analysis.metrics;

      const summary = [
        `🎵 **Musical Code Comparison**`,
        ``,
        `| Metric | Code A | Code B |`,
        `|--------|--------|--------|`,
        `| Language | ${resultA.analysis.language} | ${resultB.analysis.language} |`,
        `| Tempo | ${compA.tempo} BPM | ${compB.tempo} BPM |`,
        `| Key | ${compA.key} ${compA.scale} | ${compB.key} ${compB.scale} |`,
        `| Duration | ${compA.duration.toFixed(1)}s | ${compB.duration.toFixed(1)}s |`,
        `| Complexity | ${metA.complexity}/100 | ${metB.complexity}/100 |`,
        `| Total Notes | ${compA.tracks.reduce((s, t) => s + t.notes.length, 0)} | ${compB.tracks.reduce((s, t) => s + t.notes.length, 0)} |`,
        `| Functions | ${metA.functionCount} | ${metB.functionCount} |`,
        `| Loops | ${metA.loopCount} | ${metB.loopCount} |`,
        `| Conditionals | ${metA.conditionalCount} | ${metB.conditionalCount} |`,
        `| Tracks | ${compA.tracks.length} | ${compB.tracks.length} |`,
        ``,
        `🎼 **Code A Interpretation:** ${compA.metadata.musicalInterpretation}`,
        ``,
        `🎼 **Code B Interpretation:** ${compB.metadata.musicalInterpretation}`,
        ``,
        compA.tempo > compB.tempo
          ? `⚡ Code A is musically "faster" (more complex)`
          : compB.tempo > compA.tempo
          ? `⚡ Code B is musically "faster" (more complex)`
          : `🎯 Both pieces have similar musical intensity`,
      ].join('\n');

      return {
        content: [{
          type: 'text' as const,
          text: summary,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error comparing code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }
);

// ============================================================
// Tool 4: sonify_git_diff — Hear your code changes as music
// ============================================================
server.tool(
  'sonify_git_diff',
  'Transform a git diff or code changes into music. Added lines become bright ascending melodies, removed lines become dark descending bass notes. Perfect for "hearing" code reviews, pull requests, and refactoring.',
  {
    diff_text: z.string().optional().describe('A unified diff string (git diff output). Provide this OR old_code + new_code.'),
    old_code: z.string().optional().describe('The original version of the code (use with new_code)'),
    new_code: z.string().optional().describe('The new version of the code (use with old_code)'),
    style: z.enum([
      'classical', 'electronic', 'ambient', 'jazz', 'rock'
    ]).optional().describe('Musical style (default: classical)'),
  },
  async ({ diff_text, old_code, new_code, style }) => {
    try {
      const musicStyle = (style as MusicStyle) || 'classical';

      if (diff_text) {
        // Sonify a raw diff
        const result = diffSonifier.sonifyDiff(diff_text, musicStyle);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            {
              type: 'text' as const,
              text: `\n---\n📦 **Composition JSON (truncated):**\n\`\`\`json\n${JSON.stringify(result.composition, null, 2).substring(0, 2000)}\n\`\`\``,
            },
          ],
        };
      } else if (old_code && new_code) {
        // Compare two versions
        const result = diffSonifier.sonifyTwoVersions(old_code, new_code, musicStyle);

        const comparison = [
          result.summary,
          ``,
          `🔄 **Version Comparison:**`,
          `| Metric | Old Code | New Code |`,
          `|--------|----------|----------|`,
          `| Tempo | ${result.oldComposition.tempo} BPM | ${result.newComposition.tempo} BPM |`,
          `| Key | ${result.oldComposition.key} ${result.oldComposition.scale} | ${result.newComposition.key} ${result.newComposition.scale} |`,
          `| Complexity | ${result.oldComposition.metadata.complexity}/100 | ${result.newComposition.metadata.complexity}/100 |`,
          `| Duration | ${result.oldComposition.duration.toFixed(1)}s | ${result.newComposition.duration.toFixed(1)}s |`,
        ].join('\n');

        return {
          content: [{ type: 'text' as const, text: comparison }],
        };
      } else {
        return {
          content: [{
            type: 'text' as const,
            text: '❌ Please provide either `diff_text` (a git diff) or both `old_code` and `new_code` to compare.',
          }],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error sonifying diff: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }
);

// ============================================================
// Tool 5: export_midi — Export composition as a real MIDI file
// ============================================================
server.tool(
  'export_midi',
  'Export a code sonification as a real MIDI file (.mid) that can be opened in any music software (GarageBand, FL Studio, Ableton, Logic Pro). Turn your code into a shareable piece of music! Returns base64-encoded MIDI data.',
  {
    code: z.string().describe('The source code to convert to MIDI'),
    language: z.enum([
      'javascript', 'typescript', 'python', 'java',
      'csharp', 'go', 'rust', 'unknown'
    ]).optional().describe('Programming language (auto-detected if not specified)'),
    style: z.enum([
      'classical', 'electronic', 'ambient', 'jazz', 'rock'
    ]).optional().describe('Musical style (default: classical)'),
  },
  async ({ code, language, style }) => {
    try {
      // Generate the composition
      const result = composer.sonify({
        code,
        language: language as CodeLanguage | undefined,
        style: (style as MusicStyle) || 'classical',
      });

      // Convert to MIDI
      const midiBase64 = midiGen.generateBase64(result.composition);
      const midiBuffer = midiGen.generate(result.composition);

      const summary = [
        `🎹 **MIDI File Generated!**`,
        ``,
        `**Composition:** ${result.composition.title}`,
        `**Key:** ${result.composition.key} ${result.composition.scale}`,
        `**Tempo:** ${result.composition.tempo} BPM`,
        `**Tracks:** ${result.composition.tracks.length}`,
        `**File size:** ${(midiBuffer.length / 1024).toFixed(1)} KB`,
        ``,
        `📥 **How to use your MIDI file:**`,
        `1. Copy the base64 data below`,
        `2. Use an online base64-to-file converter, or`,
        `3. Save it programmatically with: \`Buffer.from(base64, 'base64')\``,
        `4. Open the .mid file in GarageBand, FL Studio, Ableton, or any DAW`,
        ``,
        `🎵 Your code is now real, editable music!`,
        ``,
        `---`,
        `📦 **MIDI Base64 Data:**`,
        `\`\`\``,
        midiBase64,
        `\`\`\``,
      ].join('\n');

      return {
        content: [{ type: 'text' as const, text: summary }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error generating MIDI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }
);

// ============================================================
// Tool 6: sequence_set — DJ your repository as one continuous set
// ============================================================
server.tool(
  'sequence_set',
  'Hear a repository as one continuous, harmonically-mixed DJ set. Sonifies every source file (each gets a key + BPM), orders them into an energy arc, and grounds every transition in the dj-craft knowledge base (Camelot harmonic mixing, energy management, BPM/phrase matching) — live Foundry IQ when FOUNDRY_IQ_MCP_URL is set, deterministic LocalFoundryIq fixture otherwise. Every transition cites the mixing rule it followed. Writes a set JSON and a playable .mid file.',
  {
    path: z.string().describe('Path to the repository / directory to sequence'),
    style: z.enum(['classical', 'electronic', 'ambient', 'jazz', 'rock'])
      .optional().describe('Musical style for the per-file compositions (default: electronic)'),
    max_tracks: z.number().int().min(2).max(24).optional()
      .describe('Set length in tracks (default: 12)'),
    out_dir: z.string().optional()
      .describe('Directory for djset.json + djset.mid artifacts (default: <path>/djset-out)'),
  },
  async ({ path, style, max_tracks, out_dir }) => {
    initTelemetry();
    const kb = await createKnowledgeClient();
    try {
      const set = await sequenceSet(path, kb, out_dir ?? `${path}/djset-out`, {
        style: (style as MusicStyle) ?? 'electronic',
        maxTracks: max_tracks,
      });

      const lines = [
        `🎧 **DJ Copilot set: ${set.repo}**`,
        ``,
        `**IQ grounding:** ${set.iqMode}`,
        `**Tracks:** ${set.tracks.length} · **Duration:** ${Math.round(set.totalDurationSec)}s`,
        `**Cited transitions:** ${set.transitions.length - set.degradedCount}/${set.transitions.length}` +
          (set.degradedCount ? ` (${set.degradedCount} degraded to plain crossfade)` : ''),
        ``,
        `🎛 **Setlist:**`,
        ...set.tracks.flatMap((t, i) => {
          const row = [`${i + 1}. \`${t.file}\` — ${t.camelot} · ${t.bpm} BPM · energy ${t.energy}`];
          const tr = set.transitions[i];
          if (tr) {
            row.push(`   ↳ ${tr.camelot} | ${tr.technique}`);
            row.push(`     📖 ${tr.citation ? `${tr.citation} — "${tr.citedRule}"` : 'uncited (degraded)'}`);
          }
          return row;
        }),
        ``,
        `📦 **Artifacts:** \`${set.artifacts.json}\` · \`${set.artifacts.midi}\` (open in any DAW)`,
      ];

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error sequencing set: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    } finally {
      await kb.close();
    }
  }
);

// ============================================================
// Start the MCP Server
// ============================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🎵 CodeSonify MCP Server running on stdio');
}

main().catch(console.error);
