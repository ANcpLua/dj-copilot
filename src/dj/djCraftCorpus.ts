// ============================================================
// CodeSonify DJ Copilot - dj-craft Knowledge Corpus
// The single source of truth for DJ mixing craft. This corpus is
// served by the LocalFoundryIq fixture (offline) AND uploaded to
// the live Foundry IQ knowledge base (Azure AI Search index
// `dj-craft`) by `npm run dj:upload-kb` — same content, same
// citations, two transports.
//
// Every doc ends its content with an in-band citation marker
// `[source: kb/...]` so retrieval hits carry their citation
// regardless of which path served them.
// ============================================================

export interface DjCraftDoc {
  id: string;
  title: string;
  content: string;
  sourceRef: string;
  /** retrieval keywords for the deterministic fixture scorer */
  tags: string[];
}

export const DJ_CRAFT_CORPUS: DjCraftDoc[] = [
  {
    id: 'camelot-1',
    title: 'Same-key blending',
    sourceRef: 'kb/camelot#1',
    tags: ['hold', 'same key', 'blend', 'extended'],
    content:
      'When two tracks share the same Camelot key, use an extended blend: ' +
      'bring the incoming track in under the outgoing one for 16 or 32 bars and ' +
      'let the harmonies stack. Same-key mixes are the safest and can run longest. ' +
      '[source: kb/camelot#1]',
  },
  {
    id: 'camelot-2',
    title: 'Adjacent key move (one step clockwise)',
    sourceRef: 'kb/camelot#2',
    tags: ['adjacent-up', 'clockwise', 'energy lift', 'one step', 'rising'],
    content:
      'Moving one step clockwise on the Camelot wheel (e.g. 8A to 9A) lifts the ' +
      'energy subtly while staying harmonically compatible. Use it on the build ' +
      'phase of the set; mix on a 16-bar phrase and keep the EQ swap gradual. ' +
      '[source: kb/camelot#2]',
  },
  {
    id: 'camelot-3',
    title: 'Adjacent key move (one step counterclockwise)',
    sourceRef: 'kb/camelot#3',
    tags: ['adjacent-down', 'counterclockwise', 'energy ease', 'falling', 'cool'],
    content:
      'Moving one step counterclockwise (e.g. 9A to 8A) gently releases tension. ' +
      'Use it after a peak or to set up contrast before the next build. Favor a ' +
      'longer overlap so the descent feels intentional, not like a stall. ' +
      '[source: kb/camelot#3]',
  },
  {
    id: 'camelot-4',
    title: 'Relative major/minor switch',
    sourceRef: 'kb/camelot#4',
    tags: ['relative', 'major', 'minor', 'switch', 'mood', 'side'],
    content:
      'Switching between relative major and minor (e.g. 8A to 8B) keeps every ' +
      'note compatible while flipping the mood: A-to-B brightens, B-to-A darkens. ' +
      'It is the cleanest way to change color without changing energy. ' +
      '[source: kb/camelot#4]',
  },
  {
    id: 'camelot-5',
    title: 'Two-step energy boost',
    sourceRef: 'kb/camelot#5',
    tags: ['boost', 'two step', 'plus two', 'aggressive', 'peak'],
    content:
      'A +2 clockwise jump (e.g. 8A to 10A) is an aggressive energy boost. ' +
      'Reserve it for the final push into the peak, keep the overlap short ' +
      '(8 bars), and lean on percussion rather than melodic content during the ' +
      'swap to mask the wider harmonic distance. [source: kb/camelot#5]',
  },
  {
    id: 'camelot-6',
    title: 'Handling key clashes',
    sourceRef: 'kb/camelot#6',
    tags: ['clash', 'incompatible', 'cut', 'echo out', 'diagonal'],
    content:
      'When keys clash (more than two wheel positions apart), do not blend ' +
      'melodies. Use a phrase cut: echo-out the outgoing track on a phrase ' +
      'boundary, leave one or two bars of percussion or silence, then bring the ' +
      'incoming track in clean. A clash hidden in a long blend always sounds ' +
      'worse than a confident cut. [source: kb/camelot#6]',
  },
  {
    id: 'energy-1',
    title: 'The energy arc',
    sourceRef: 'kb/energy#1',
    tags: ['arc', 'shape', 'set', 'build', 'plateau', 'release'],
    content:
      'Shape the set as an energy arc: open low, build gradually, plateau at the ' +
      'peak around two-thirds of the way through, then release with control. ' +
      'Never peak in the first quarter — early peaks leave nowhere to go. ' +
      '[source: kb/energy#1]',
  },
  {
    id: 'energy-2',
    title: 'Choosing the opener',
    sourceRef: 'kb/energy#2',
    tags: ['opener', 'first track', 'start', 'low energy'],
    content:
      'Open with one of the lowest-energy tracks in the crate. The opener sets ' +
      'the floor of the arc and buys headroom for every later transition; a calm ' +
      'opener makes the eventual peak feel twice as tall. [source: kb/energy#2]',
  },
  {
    id: 'energy-3',
    title: 'Peak placement',
    sourceRef: 'kb/energy#3',
    tags: ['peak', 'climax', 'highest', 'placement', 'two thirds'],
    content:
      'Place the highest-energy track at roughly the 60-75% mark of the set. ' +
      'Approach it with rising adjacent-key moves and tempo steps; leave at ' +
      'least two tracks after it for the comedown. [source: kb/energy#3]',
  },
  {
    id: 'energy-4',
    title: 'The cooldown',
    sourceRef: 'kb/energy#4',
    tags: ['cooldown', 'closer', 'ending', 'comedown', 'last'],
    content:
      'End the set one or two energy levels above where it began — a controlled ' +
      'descent, not a collapse. Counterclockwise key moves and slightly longer ' +
      'blends signal the room that the journey is landing. [source: kb/energy#4]',
  },
  {
    id: 'energy-5',
    title: 'Contrast drop before the final build',
    sourceRef: 'kb/energy#5',
    tags: ['contrast', 'drop', 'dip', 'before peak', 'tension'],
    content:
      'A deliberate energy dip just before the final build creates contrast that ' +
      'makes the peak hit harder. Drop one wheel step down, hold for one track, ' +
      'then climb with consecutive clockwise moves. [source: kb/energy#5]',
  },
  {
    id: 'bpm-1',
    title: 'The six percent rule',
    sourceRef: 'kb/bpm#1',
    tags: ['bpm', 'tempo', 'six percent', 'pitch', 'window'],
    content:
      'Keep BPM changes within plus or minus six percent per transition — beyond ' +
      'that, pitch artifacts and rushed phrasing become audible. For larger gaps, ' +
      'step the tempo across intermediate tracks instead of forcing one jump. ' +
      '[source: kb/bpm#1]',
  },
  {
    id: 'bpm-2',
    title: 'Phrase alignment',
    sourceRef: 'kb/bpm#2',
    tags: ['phrase', '16 bars', '32 bars', 'alignment', 'boundary'],
    content:
      'Beatmatch first, then align phrase boundaries: mix on 16- or 32-bar ' +
      'phrases so both tracks change sections together. A transition that is ' +
      'beat-tight but phrase-loose still sounds wrong. [source: kb/bpm#2]',
  },
  {
    id: 'bpm-3',
    title: 'Landing the drop',
    sourceRef: 'kb/bpm#3',
    tags: ['drop', 'cut', 'loop', 'land', 'incoming'],
    content:
      'Cut or loop the outgoing track so the incoming drop lands exactly on a ' +
      'phrase boundary. The audience forgives a shortened outro; it never ' +
      'forgives a drop that lands mid-phrase. [source: kb/bpm#3]',
  },
  {
    id: 'bpm-4',
    title: 'Tempo strategy across the set',
    sourceRef: 'kb/bpm#4',
    tags: ['tempo', 'strategy', 'across set', 'steps', 'gradual'],
    content:
      'Plan tempo like altitude: climb in small steps on the way to the peak and ' +
      'descend in slightly larger ones. Repeated small BPM rises read as ' +
      'momentum; a single big jump reads as a mistake. [source: kb/bpm#4]',
  },
  {
    id: 'fx-1',
    title: 'The crossfade fallback',
    sourceRef: 'kb/fx#1',
    tags: ['crossfade', 'fallback', 'plain', 'safe', 'degraded'],
    content:
      'When no rule clearly applies — or information about the next track is ' +
      'missing — fall back to a plain crossfade on a phrase boundary at matched ' +
      'gain. It is the neutral, always-safe transition: unglamorous, never wrong. ' +
      '[source: kb/fx#1]',
  },
];

/** Extract the in-band `[source: ...]` citation from retrieved content. */
export function extractCitation(content: string): string | null {
  const m = content.match(/\[source:\s*([^\]]+)\]/);
  return m ? m[1].trim() : null;
}
