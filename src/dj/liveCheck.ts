#!/usr/bin/env node
// ============================================================
// CodeSonify DJ Copilot - Live Foundry IQ check
// The single networked DONE criterion: one real tools/call of
// knowledge_base_retrieve over FOUNDRY_IQ_MCP_URL returning a
// cited dj-craft rule, using only env-file values.
//   source ~/.djcopilot/foundry-iq.env && npm run dj:live-check
// ============================================================

import { LiveFoundryIq } from './knowledge.js';

const url = process.env.FOUNDRY_IQ_MCP_URL;
if (!url) {
  console.error('❌ FOUNDRY_IQ_MCP_URL not set (source ~/.djcopilot/foundry-iq.env)');
  process.exit(1);
}

const iq = await LiveFoundryIq.connect(url, process.env.FOUNDRY_IQ_API_KEY);
console.log(`🔌 connected: ${iq.mode}`);
const hits = await iq.retrieve('camelot wheel adjacent key move energy lift');
await iq.close();

const cited = hits.find(h => h.citation);
if (!cited) {
  console.error(`❌ live retrieval returned ${hits.length} hits but no citation`);
  process.exit(1);
}
console.log(`✅ live cited rule: "${cited.title}" [${cited.citation}]`);
console.log(`   ${cited.content.slice(0, 140)}…`);
