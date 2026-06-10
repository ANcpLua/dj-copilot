// ============================================================
// CodeSonify DJ Copilot - Knowledge Client (Foundry IQ over MCP)
// Port of AgentArena's MicrosoftIq.cs pattern:
//   - FOUNDRY_IQ_MCP_URL set  → live Foundry IQ (Azure AI Search
//     knowledge-base MCP endpoint, api-key header)
//   - otherwise               → deterministic LocalFoundryIq fixture
//     serving the same corpus with the same citation format.
// The live tool is `knowledge_base_retrieve` and takes
// {"queries": ["..."]} — an ARRAY (1-3 strings, ≤150 chars each).
// ============================================================

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { DJ_CRAFT_CORPUS, extractCitation } from './djCraftCorpus.js';

export interface KbHit {
  title: string;
  content: string;
  citation: string | null; // e.g. "kb/camelot#2"
  score: number;
}

export interface KnowledgeClient {
  mode: string;
  isLive: boolean;
  retrieve(query: string): Promise<KbHit[]>;
  close(): Promise<void>;
}

// --- LocalFoundryIq: in-process deterministic fixture ---

export class LocalFoundryIq implements KnowledgeClient {
  mode = 'LocalFoundryIq · fixture';
  isLive = false;

  async retrieve(query: string): Promise<KbHit[]> {
    const words = query.toLowerCase().split(/[^a-z0-9+%-]+/).filter(w => w.length > 2);
    const scored = DJ_CRAFT_CORPUS.map(doc => {
      let score = 0;
      const title = doc.title.toLowerCase();
      const content = doc.content.toLowerCase();
      for (const w of words) {
        if (doc.tags.some(t => t.includes(w))) score += 3;
        if (title.includes(w)) score += 2;
        if (content.includes(w)) score += 1;
      }
      return { doc, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    return scored.slice(0, 2).map(({ doc, score }) => ({
      title: doc.title,
      content: doc.content,
      citation: doc.sourceRef,
      score,
    }));
  }

  async close(): Promise<void> {}
}

// --- LiveFoundryIq: MCP client against the real knowledge base ---

export class LiveFoundryIq implements KnowledgeClient {
  mode: string;
  isLive = true;
  private client: Client;
  private toolName: string;

  private constructor(client: Client, toolName: string) {
    this.client = client;
    this.toolName = toolName;
    this.mode = `Foundry IQ · live · ${toolName}`;
  }

  static async connect(url: string, apiKey?: string): Promise<LiveFoundryIq> {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: apiKey ? { headers: { 'api-key': apiKey } } : undefined,
    });
    const client = new Client({ name: 'codesonify-dj-copilot', version: '1.0.0' });
    await client.connect(transport);

    const { tools } = await client.listTools();
    const tool = tools.find(t => /retriev|knowledge|search|query|ask/i.test(t.name)) ?? tools[0];
    if (!tool) throw new Error('Foundry IQ endpoint exposes no tools');
    return new LiveFoundryIq(client, tool.name);
  }

  async retrieve(query: string): Promise<KbHit[]> {
    // Live contract: queries is an ARRAY of 1-3 strings, each ≤150 chars.
    const result = await this.client.callTool({
      name: this.toolName,
      arguments: { queries: [query.slice(0, 150)] },
    });
    const text = (result.content as Array<{ type: string; text?: string }>)
      .find(c => c.type === 'text')?.text;
    if (!text) return [];

    // The KB returns a JSON array of {ref_id, title, content} references.
    let refs: Array<{ title?: string; content?: string }>;
    try { refs = JSON.parse(text); } catch { return []; }
    if (!Array.isArray(refs)) return [];

    return refs.map((r, i) => ({
      title: r.title ?? 'untitled',
      content: r.content ?? '',
      citation: extractCitation(r.content ?? ''),
      score: refs.length - i,
    }));
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

// --- Factory: mirrors MicrosoftIq.CreateAsync ---

export async function createKnowledgeClient(): Promise<KnowledgeClient> {
  const url = process.env.FOUNDRY_IQ_MCP_URL;
  if (url) {
    try {
      return await LiveFoundryIq.connect(url, process.env.FOUNDRY_IQ_API_KEY);
    } catch (err) {
      console.error(`[iq] Foundry IQ connect failed, falling back to fixture: ${err instanceof Error ? err.message : err}`);
    }
  }
  return new LocalFoundryIq();
}
