# 🎵 CodeSonify — Hear Your Code

[![Agents League 2026](https://img.shields.io/badge/Agents%20League-2026-blue)](https://github.com/microsoft/agentsleague)
[![Track](https://img.shields.io/badge/Track-Creative%20Apps-purple)](https://github.com/microsoft/agentsleague/tree/main/starter-kits/1-creative-apps)
[![Built with](https://img.shields.io/badge/Built%20with-GitHub%20Copilot-green)](https://github.com/features/copilot)
[![MCP Tools](https://img.shields.io/badge/MCP%20Tools-6-orange)](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

> **Every line of code has a melody.** CodeSonify transforms source code into real music. Functions become melodies, loops become rhythms, conditionals become chord changes, and bugs sound dissonant. Export to MIDI, sonify git diffs, and hear the evolution of your codebase — all integrated into GitHub Copilot via MCP.

---

## 🎬 Demo

> 📹 *[Watch the demo video →](https://youtu.be/yW3g-tQjNZo)*

**Try it yourself:** Clone the repo, run `npm start`, and open http://localhost:3000

---

## 🌟 Features

### 🎵 Code → Music Engine
Paste any code — JavaScript, TypeScript, Python, Java, C#, Go, Rust — and hear it as music. Each programming construct maps to a distinct musical element:

| Code Structure | Musical Element | Why |
|---------------|----------------|-----|
| **Functions** | Ascending melodic phrases | Functions are the building blocks — they create the melody |
| **Loops** | Repeating rhythmic patterns | Loops repeat — just like rhythm |
| **Conditionals** | Harmonic chord changes | `if`/`else` creates branching paths — like harmonic tension and resolution |
| **Variables** | Deep bass notes | Variables are the foundation — like bass in music |
| **Classes** | Power chords | Classes are structures — rich, layered chords |
| **Comments** | Ambient pads | Comments are the quiet spaces between the code |
| **Errors** | Dissonant clusters | Bugs should sound bad — because they are |
| **Nesting depth** | Octave (pitch) | Deeper nesting = higher pitch = more tension |
| **Complexity** | Tempo (BPM) | Complex code plays faster and more intensely |
| **Language** | Musical key | Each language has its own key signature |

### 🎹 MIDI Export
Export any sonification as a **real .mid file** that opens in GarageBand, FL Studio, Ableton, Logic Pro, or any DAW. Your code becomes real, editable, shareable music.

### 🔄 Diff Sonification
Sonify git diffs and code changes:
- **Added lines** → Bright, ascending melodies in major key
- **Removed lines** → Dark, descending bass in minor key
- **Context** → Soft ambient background
- Hear a refactoring as a musical journey from tension to resolution

### 🎨 5 Musical Styles
| Style | Key | Character |
|-------|-----|-----------|
| 🎻 Classical | C Major | Elegant, sine/triangle waves |
| 🎹 Electronic | A Minor | Driving, square/sawtooth waves |
| 🌊 Ambient | D Pentatonic | Dreamy, heavy reverb |
| 🎷 Jazz | F Dorian | Warm, swing feel |
| 🎸 Rock | E Blues | Aggressive, distorted |

### 🔧 MCP Server — 5 Tools for GitHub Copilot
CodeSonify integrates directly into **VS Code via MCP**, giving GitHub Copilot 5 powerful tools:

| # | Tool | What it does |
|---|------|-------------|
| 1 | `sonify_code` | Transform any code into a full musical composition |
| 2 | `analyze_code_structure` | Get code metrics: complexity, functions, nesting, loops |
| 3 | `compare_code_musically` | Compare two code snippets by their musical output |
| 4 | `sonify_git_diff` | Turn git diffs into music — hear your code reviews |
| 5 | `export_midi` | Export code as a real MIDI file for music production |

### 🌐 Web Application
A polished, real-time web interface featuring:
- **Code editor** with syntax highlighting
- **Real-time canvas visualization** with animated note particles
- **Live audio playback** using Tone.js Web Audio synthesis
- **Stats dashboard** showing tempo, key, complexity, notes, duration, tracks
- **Track breakdown** with per-instrument volume bars
- **Musical interpretation** — human-readable description of what the music represents
- **Diff Mode** — compare old vs new code versions visually and musically
- **MIDI download** — one-click export to .mid file

---

## 🎧 DJ Copilot — Hear Your Repository as a DJ Set

Point CodeSonify at a whole repository and it plays it as **one continuous,
harmonically-mixed DJ set**: every source file becomes a track with its own key
and BPM, the set follows a real energy arc (open low → build → peak → cooldown),
and **every transition decision retrieves from and cites a curated dj-craft
knowledge base** — Camelot harmonic mixing, energy management, BPM/phrase
matching — grounded via **Foundry IQ** (an Azure AI Search knowledge base
queried over MCP).

```bash
npm install
npm run dj                    # DJ this repo (offline LocalFoundryIq fixture)
npm run dj -- path/to/repo    # DJ any repository
```

Every transition prints the mixing rule it followed, with citation:

```text
5. src/dj/knowledge.ts  [9A · 160 BPM · energy 100]
   ↳ 9A → 10A | clockwise lift — gradual EQ swap on a 16-bar phrase
     📖 kb/camelot#2 — "Adjacent key move (one step clockwise)"
```

**Live Foundry IQ** — point the same code at a real Azure AI Search
knowledge-base MCP endpoint (the offline fixture serves the *same corpus* with
the *same citations*, so the demo runs identically with zero network):

```bash
FOUNDRY_IQ_MCP_URL="https://<search>.search.windows.net/knowledgebases/<kb>/mcp?api-version=2026-05-01-preview" \
FOUNDRY_IQ_API_KEY="<query-key>" npm run dj
```

- `npm run dj:upload-kb` pushes the corpus to the live index (admin key via env)
- `npm run dj:live-check` verifies one real cited retrieval over the MCP endpoint
- If a KB lookup fails mid-set, the transition degrades to a plain crossfade and
  the set always completes
- **Artifacts:** `djset-out/djset.json` (setlist + cited transitions) and
  `djset-out/djset.mid` — the entire stitched set, playable in any DAW
- **Telemetry:** every sequencing run emits OpenTelemetry spans (one per
  transition, carrying the cited rule) to [qyl](https://github.com/O-ANcppLua/qyl)
  via OTLP on `:4318`; exported spans redact auth headers
- Exposed to agents as MCP tool #6: **`sequence_set`**

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://github.com/features/copilot) (for MCP integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/codesonify.git
cd codesonify

# Install dependencies
npm install

# Start the web application
npm start
```

Open **http://localhost:3000** in your browser. Paste code, pick a style, and click **Sonify Code**. 🎵

### Using the MCP Server with GitHub Copilot

1. Open the project folder in VS Code
2. Open `.vscode/mcp.json` — click the **"Start"** button that appears
3. Open Copilot Chat (`Ctrl+Shift+I`) → switch to **Agent Mode**
4. Try these prompts:

```
Sonify this code: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }
```

```
Analyze the code structure of my current file
```

```
Export this as MIDI: const greet = (name) => console.log(`Hello ${name}`)
```

```
Sonify the diff between these: 
Old: "function add(a,b) { return a+b; }"  
New: "const add = (a: number, b: number): number => a + b;"
```

---

## 📁 Project Structure

```
codesonify/
├── src/
│   ├── core/                  # Core analysis and music engine
│   │   ├── types.ts           # TypeScript type definitions (40+ types)
│   │   ├── parser.ts          # Code structure analyzer & tokenizer
│   │   ├── mapper.ts          # Code-to-music mapping engine (8 scales, 5 styles)
│   │   ├── composer.ts        # Composition orchestrator
│   │   ├── midi.ts            # Pure TypeScript MIDI file generator (zero dependencies)
│   │   ├── diff.ts            # Git diff parser & sonification engine
│   │   └── index.ts           # Module exports
│   ├── mcp/                   # MCP Server for VS Code / GitHub Copilot
│   │   └── index.ts           # MCP server with 5 tools
│   └── web/                   # Web application
│       ├── server.ts          # Express API server (5 endpoints)
│       └── public/
│           └── index.html     # Frontend (Tone.js + Canvas visualization)
├── docs/
│   └── copilot-usage/         # Screenshots of GitHub Copilot usage
├── .vscode/
│   └── mcp.json               # MCP server configuration for VS Code
├── .gitignore
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

---

## 🤖 GitHub Copilot Usage

GitHub Copilot was instrumental throughout the entire development of CodeSonify. Here's how AI-assisted development shaped this project:

### 🧠 Architecture & Design (Copilot Chat)
- Brainstormed the mapping between programming constructs and musical elements
- Designed the TypeScript type system with 40+ types for code analysis and music composition
- Explored which musical scales best represent each programming language
- Debugged audio timing issues with Tone.js Web Audio API

### ⚡ Code Acceleration (Copilot Suggestions)
- Auto-completed musical scale definitions (major, minor, pentatonic, blues, dorian, mixolydian, lydian, chromatic)
- Generated Express route handlers with input validation
- Suggested the canvas visualization algorithm for animated note particles
- Completed the MIDI binary format implementation (variable-length quantities, track chunks)

### 🎨 Creative Exploration
- Used Copilot to explore different approaches to code complexity scoring
- Generated example code snippets that showcase diverse musical outputs
- Helped design the diff-to-music mapping logic (ascending = additions, descending = deletions)

### 🔧 MCP Server Development
- Copilot Chat helped structure the MCP tool definitions with proper Zod schemas
- Generated the formatted markdown output for each tool response
- Assisted with the comparison table formatting in `compare_code_musically`

> 📸 Screenshots of these interactions are in `docs/copilot-usage/`

---

## 🔌 API Reference

### `POST /api/sonify`
Transform code into music.

**Request:**
```json
{
  "code": "function hello() { console.log('world'); }",
  "language": "javascript",
  "style": "classical"
}
```

**Response:** Full composition with tracks, notes, analysis, and visualization data.

### `POST /api/export-midi`
Export code as a downloadable MIDI file.

**Request:** Same as `/api/sonify`

**Response:** Binary `.mid` file download.

### `POST /api/sonify-diff`
Sonify code changes.

**Request:**
```json
{
  "old_code": "function add(a,b) { return a+b; }",
  "new_code": "const add = (a: number, b: number): number => a + b;",
  "style": "electronic"
}
```

### `GET /api/examples`
Get example code snippets for demo.

### `GET /api/health`
Health check.

---

## 🏆 Evaluation Criteria Alignment

| Criteria | Weight | How CodeSonify Delivers |
|----------|--------|------------------------|
| **Accuracy & Relevance** | 20% | Fully meets Creative Apps track requirements. Extensive GitHub Copilot usage documented. MCP server with 5 tools integrated into VS Code. |
| **Reasoning & Multi-step Thinking** | 20% | 7-step pipeline: Code → Tokenize → Analyze → Map → Compose → Visualize → Play. Diff analysis adds comparison reasoning. MIDI export adds format transformation. |
| **Creativity & Originality** | 15% | First-of-its-kind code sonification tool. Unique concept bridging programming and music. Diff sonification has never been done. MIDI export makes it tangible. |
| **User Experience & Presentation** | 15% | Polished web UI with real-time visualization, 5 musical styles, Diff Mode, MIDI download, example code, animated particles, playback controls. |
| **Reliability & Safety** | 20% | TypeScript strict mode throughout, input validation on all endpoints, error handling with user-friendly messages, no secrets/PII, public repo, MIT license. |
| **Community Vote** | 10% | Viral concept — "hear your code" is immediately shareable. Fun to demo. Everyone can try it. MIDI export makes it tangible and social. |

---

## 🛠️ Technologies

| Technology | Purpose |
|-----------|---------|
| TypeScript | Type-safe code throughout (strict mode) |
| MCP SDK | Model Context Protocol for VS Code/Copilot integration |
| Express 5 | Web server and REST API |
| Tone.js | Web Audio synthesis and real-time playback |
| Canvas API | Animated note particle visualization |
| Zod | Runtime input validation for MCP tools |
| GitHub Copilot | AI-assisted development throughout |

---

## 🎯 Use Cases

1. **Code Review** — Sonify a pull request diff and *hear* if the changes feel harmonious or chaotic
2. **Education** — Help students understand code structure through musical metaphor
3. **Accessibility** — Provide auditory feedback for visually impaired developers
4. **Team Building** — Turn your team's code into a collaborative soundtrack
5. **Art** — Generate music from open-source projects and create "code albums"
6. **Quality Monitoring** — Complexity score as tempo: if your code sounds like speed metal, maybe refactor

---

## 📝 License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- Built for [Agents League 2026](https://github.com/microsoft/agentsleague) by Microsoft
- Powered by [GitHub Copilot](https://github.com/features/copilot)
- Audio synthesis by [Tone.js](https://tonejs.github.io/)
- MCP integration via [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)

---

<p align="center">
  <strong>🎵 Where every line of code has a melody 🎵</strong>
</p>
