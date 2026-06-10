#!/usr/bin/env node
// ============================================================
// CodeSonify DJ Copilot - KB uploader
// Pushes the dj-craft corpus to the live Azure AI Search index.
//   source ~/.djcopilot/foundry-iq.env && npm run dj:upload-kb
// Requires SEARCH_ENDPOINT + SEARCH_ADMIN_KEY in the environment.
// Never prints credential values.
// ============================================================

import { DJ_CRAFT_CORPUS } from './djCraftCorpus.js';

const endpoint = process.env.SEARCH_ENDPOINT;
const adminKey = process.env.SEARCH_ADMIN_KEY;
if (!endpoint || !adminKey) {
  console.error('❌ SEARCH_ENDPOINT and SEARCH_ADMIN_KEY must be set (source ~/.djcopilot/foundry-iq.env)');
  process.exit(1);
}

const body = {
  value: DJ_CRAFT_CORPUS.map(d => ({
    '@search.action': 'mergeOrUpload',
    id: d.id,
    title: d.title,
    content: d.content,
    sourceRef: d.sourceRef,
  })),
};

const res = await fetch(`${endpoint}/indexes/dj-craft/docs/index?api-version=2026-05-01-preview`, {
  method: 'POST',
  headers: { 'api-key': adminKey, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const result = await res.json() as { value: Array<{ key: string; status: boolean }> };
if (!res.ok) {
  console.error(`❌ upload failed: HTTP ${res.status}`);
  process.exit(1);
}
const ok = result.value.filter(v => v.status).length;
console.log(`✅ uploaded ${ok}/${DJ_CRAFT_CORPUS.length} dj-craft docs to the live index`);
