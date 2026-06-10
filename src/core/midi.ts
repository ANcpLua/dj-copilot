// ============================================================
// CodeSonify - MIDI Generator
// Converts MusicComposition into standard MIDI files (.mid)
// No external dependencies — pure TypeScript implementation
// ============================================================

import { MusicComposition, MusicNote, MusicTrack } from './types.js';

// --- MIDI Constants ---
const HEADER_CHUNK = [0x4D, 0x54, 0x68, 0x64]; // "MThd"
const TRACK_CHUNK = [0x4D, 0x54, 0x72, 0x6B];  // "MTrk"
const TICKS_PER_BEAT = 480;

// Note name to MIDI number mapping
const NOTE_TO_MIDI: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
};

// Duration to ticks mapping (at standard resolution)
const DURATION_TICKS: Record<string, number> = {
  '16n': TICKS_PER_BEAT / 4,    // 120
  '8n':  TICKS_PER_BEAT / 2,    // 240
  '8n.': TICKS_PER_BEAT * 3/4,  // 360
  '4n':  TICKS_PER_BEAT,        // 480
  '4n.': TICKS_PER_BEAT * 3/2,  // 720
  '2n':  TICKS_PER_BEAT * 2,    // 960
  '2n.': TICKS_PER_BEAT * 3,    // 1440
  '1n':  TICKS_PER_BEAT * 4,    // 1920
};

// Instrument type to General MIDI program mapping
const INSTRUMENT_PROGRAMS: Record<string, number> = {
  melody:     0,   // Acoustic Grand Piano
  bass:       33,  // Electric Bass (finger)
  harmony:    48,  // String Ensemble 1
  percussion: 115, // Steel Drums (channel 10 uses percussion)
  ambient:    88,  // Pad 1 (new age)
  dissonance: 30,  // Overdriven Guitar
};

// --- Helper Functions ---

/**
 * Convert a note string like "C4" to MIDI note number (0-127).
 */
function noteStringToMidi(noteStr: string): number {
  const match = noteStr.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60; // Default to middle C

  const noteName = match[1];
  const octave = parseInt(match[2]);
  const semitone = NOTE_TO_MIDI[noteName];
  if (semitone === undefined) return 60;

  // MIDI: C4 = 60
  return (octave + 1) * 12 + semitone;
}

/**
 * Encode a number as a MIDI variable-length quantity.
 */
function encodeVLQ(value: number): number[] {
  if (value < 0) value = 0;
  
  const bytes: number[] = [];
  bytes.unshift(value & 0x7F);
  value >>= 7;
  
  while (value > 0) {
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  
  return bytes;
}

/**
 * Convert a 32-bit integer to 4 bytes (big-endian).
 */
function int32ToBytes(value: number): number[] {
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF,
  ];
}

/**
 * Convert a 16-bit integer to 2 bytes (big-endian).
 */
function int16ToBytes(value: number): number[] {
  return [
    (value >> 8) & 0xFF,
    value & 0xFF,
  ];
}

/**
 * Encode a string as MIDI text event bytes.
 */
function stringToBytes(str: string): number[] {
  return Array.from(str).map(c => c.charCodeAt(0));
}

// --- MIDI Track Builder ---

class MidiTrackBuilder {
  private events: number[] = [];
  private lastTick: number = 0;

  /**
   * Add a delta time followed by event bytes.
   */
  addEvent(absoluteTick: number, ...eventBytes: number[]) {
    const delta = Math.max(0, Math.round(absoluteTick - this.lastTick));
    this.events.push(...encodeVLQ(delta), ...eventBytes);
    this.lastTick = absoluteTick;
  }

  /**
   * Add a meta event (FF type length data).
   */
  addMeta(absoluteTick: number, metaType: number, data: number[]) {
    const delta = Math.max(0, Math.round(absoluteTick - this.lastTick));
    this.events.push(...encodeVLQ(delta), 0xFF, metaType, ...encodeVLQ(data.length), ...data);
    this.lastTick = absoluteTick;
  }

  /**
   * Add a track name meta event.
   */
  addTrackName(name: string) {
    this.addMeta(0, 0x03, stringToBytes(name));
  }

  /**
   * Add a tempo meta event.
   */
  addTempo(bpm: number) {
    const microsecondsPerBeat = Math.round(60000000 / bpm);
    this.addMeta(0, 0x51, [
      (microsecondsPerBeat >> 16) & 0xFF,
      (microsecondsPerBeat >> 8) & 0xFF,
      microsecondsPerBeat & 0xFF,
    ]);
  }

  /**
   * Add a time signature meta event.
   */
  addTimeSignature(numerator: number, denominator: number) {
    const denomPow = Math.log2(denominator);
    this.addMeta(0, 0x58, [numerator, denomPow, 24, 8]);
  }

  /**
   * Add a program change event.
   */
  addProgramChange(channel: number, program: number) {
    this.addEvent(0, 0xC0 | (channel & 0x0F), program & 0x7F);
  }

  /**
   * Add a note on event.
   */
  addNoteOn(tick: number, channel: number, note: number, velocity: number) {
    const vel = Math.min(127, Math.max(1, Math.round(velocity * 127)));
    this.addEvent(tick, 0x90 | (channel & 0x0F), note & 0x7F, vel);
  }

  /**
   * Add a note off event.
   */
  addNoteOff(tick: number, channel: number, note: number) {
    this.addEvent(tick, 0x80 | (channel & 0x0F), note & 0x7F, 0);
  }

  /**
   * Add end of track meta event.
   */
  addEndOfTrack() {
    this.addMeta(this.lastTick, 0x2F, []);
  }

  /**
   * Build the complete track chunk bytes.
   */
  build(): number[] {
    this.addEndOfTrack();
    // concat, not spread — spreading large event arrays into a literal
    // exceeds the JS call-argument limit on big compositions (e.g. DJ sets)
    return [...TRACK_CHUNK, ...int32ToBytes(this.events.length)].concat(this.events);
  }
}

// --- Main MIDI Generator ---

export class MidiGenerator {

  /**
   * Generate a complete MIDI file from a MusicComposition.
   * Returns a Buffer containing the binary MIDI data.
   */
  generate(composition: MusicComposition): Buffer {
    const tracks: number[][] = [];

    // Track 0: Tempo & metadata track
    const tempoTrack = new MidiTrackBuilder();
    tempoTrack.addTrackName(composition.title);
    tempoTrack.addTempo(composition.tempo);
    tempoTrack.addTimeSignature(composition.timeSignature[0], composition.timeSignature[1]);
    // Add text with interpretation
    tempoTrack.addMeta(0, 0x01, stringToBytes(
      `Generated by CodeSonify | ${composition.metadata.sourceLanguage} | Complexity: ${composition.metadata.complexity}/100`
    ));
    tracks.push(tempoTrack.build());

    // One track per instrument
    const channelMap: Record<string, number> = {
      melody: 0,
      bass: 1,
      harmony: 2,
      percussion: 9, // Channel 10 (0-indexed = 9) is standard MIDI drums
      ambient: 3,
      dissonance: 4,
    };

    for (const track of composition.tracks) {
      const midiTrack = new MidiTrackBuilder();
      const channel = channelMap[track.instrument] ?? 0;

      // Track name
      midiTrack.addTrackName(track.name.replace(/[^\x20-\x7E]/g, '')); // ASCII only

      // Program change (instrument sound)
      if (channel !== 9) { // Don't set program for drum channel
        const program = INSTRUMENT_PROGRAMS[track.instrument] ?? 0;
        midiTrack.addProgramChange(channel, program);
      }

      // Convert seconds to ticks
      const secondsToTicks = (seconds: number): number => {
        return Math.round(seconds * (composition.tempo / 60) * TICKS_PER_BEAT);
      };

      // Sort notes by time
      const sortedNotes = [...track.notes].sort((a, b) => a.time - b.time);

      // Add note events
      for (const note of sortedNotes) {
        const midiNote = noteStringToMidi(note.note);
        if (midiNote < 0 || midiNote > 127) continue;

        const startTick = secondsToTicks(note.time);
        const durationTicks = DURATION_TICKS[note.duration] || TICKS_PER_BEAT;

        midiTrack.addNoteOn(startTick, channel, midiNote, note.velocity);
        midiTrack.addNoteOff(startTick + durationTicks, channel, midiNote);
      }

      tracks.push(midiTrack.build());
    }

    // Build the complete MIDI file
    const headerBytes = [
      ...HEADER_CHUNK,
      ...int32ToBytes(6),                    // Header length: always 6
      ...int16ToBytes(1),                    // Format: 1 (multi-track)
      ...int16ToBytes(tracks.length),        // Number of tracks
      ...int16ToBytes(TICKS_PER_BEAT),       // Ticks per beat
    ];

    // concat per track, not push(...spread) — see MidiTrackBuilder.build()
    const allBytes = headerBytes.concat(...tracks);

    return Buffer.from(allBytes);
  }

  /**
   * Generate MIDI and return as a base64-encoded string.
   */
  generateBase64(composition: MusicComposition): string {
    const buffer = this.generate(composition);
    return buffer.toString('base64');
  }
}

export default MidiGenerator;
