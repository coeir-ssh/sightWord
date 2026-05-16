import audioManifest from '../data/audioManifest.json';

const AUDIO_SET = new Set<string>((audioManifest as string[]).map((w) => w.toLowerCase()));
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`;

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesPromise: Promise<void> | null = null;
let unlocked = false;

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  const preferred = [
    'Google US English',
    'Google UK English Female',
    'Microsoft Aria Online',
    'Microsoft Jenny Online',
    'Samantha',
    'Karen',
    'Moira',
    'Tessa',
    'Daniel',
    'Alex',
  ];
  for (const name of preferred) {
    const hit = en.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return en.find((v) => v.localService) ?? en[0] ?? null;
}

function ensureVoices(): Promise<void> {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise<void>((resolve) => {
    if (!ttsAvailable()) return resolve();
    const trySet = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        cachedVoice = pickVoice();
        return true;
      }
      return false;
    };
    if (trySet()) return resolve();
    const onChange = () => {
      if (trySet()) {
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        resolve();
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      cachedVoice = pickVoice();
      resolve();
    }, 2000);
  });
  return voicesPromise;
}

/** Call inside a user gesture handler to unlock iOS audio + TTS. */
export function unlockTts(): void {
  if (unlocked) return;
  // Prime the SAME HTMLAudioElement we'll reuse for every cue. iOS Safari
  // only blesses elements that have called .play() inside a user gesture;
  // a one-shot throwaway Audio() doesn't help subsequent new ones.
  try {
    const a = getPooledAudio();
    a.src =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    a.muted = true;
    a.volume = 0;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
  // Spin up an AudioContext inside the gesture too. iPad Safari leaves new
  // contexts in 'suspended' state until a gesture-bound resume() runs;
  // without this the per-letter Web Audio path stays silent.
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
  } catch {
    /* ignore */
  }
  if (ttsAvailable()) {
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
      void ensureVoices();
    } catch {
      /* ignore */
    }
  }
  unlocked = true;
}

export function isTtsUnlocked(): boolean {
  return unlocked;
}

// iOS Safari only blesses an HTMLAudioElement that has been .play()'d once
// inside a user gesture. After that, the SAME element can play a new src
// without another gesture — but a freshly created Audio() would be locked
// again. So we keep a single pooled element and just swap its src.
let pooledAudio: HTMLAudioElement | null = null;

function getPooledAudio(): HTMLAudioElement {
  if (!pooledAudio) {
    pooledAudio = new Audio();
    pooledAudio.preload = 'auto';
  }
  return pooledAudio;
}

// Web Audio path used exclusively for per-letter cues. The pooled
// HTMLAudioElement above is rock-solid for the first cue but silently
// fails on iPad WebKit when a second short cue swaps src right after the
// previous play ended — which is exactly when the per-letter cue fires.
// Decoding each letter MP3 once and replaying via AudioBufferSourceNode
// sidesteps the element-reuse bug entirely.
let audioCtx: AudioContext | null = null;
const letterBufferCache = new Map<string, AudioBuffer>();
const letterBufferPending = new Map<string, Promise<AudioBuffer | null>>();

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

async function loadLetterBuffer(key: string): Promise<AudioBuffer | null> {
  const cached = letterBufferCache.get(key);
  if (cached) return cached;
  const pending = letterBufferPending.get(key);
  if (pending) return pending;
  const ctx = getAudioContext();
  if (!ctx) return null;
  const url = `${AUDIO_BASE}letter-${encodeURIComponent(key)}.mp3`;
  const task = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      const buf = await new Promise<AudioBuffer | null>((resolve) => {
        // decodeAudioData supports both promise and callback forms; the
        // callback form is required on older iOS Safari.
        try {
          const p = ctx.decodeAudioData(
            ab,
            (b) => resolve(b),
            () => resolve(null)
          );
          if (p && typeof (p as Promise<AudioBuffer>).then === 'function') {
            (p as Promise<AudioBuffer>).then((b) => resolve(b)).catch(() => resolve(null));
          }
        } catch {
          resolve(null);
        }
      });
      if (buf) letterBufferCache.set(key, buf);
      return buf;
    } catch {
      return null;
    } finally {
      letterBufferPending.delete(key);
    }
  })();
  letterBufferPending.set(key, task);
  return task;
}

async function playLetterViaWebAudio(key: string): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
  const buf = await loadLetterBuffer(key);
  if (!buf) return false;
  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const finish = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(ok);
    };
    try {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.onended = () => finish(true);
      src.start(0);
      // Safety: if onended never fires (rare), bail after the buffer length.
      setTimeout(() => finish(true), Math.ceil(buf.duration * 1000) + 500);
    } catch {
      finish(false);
    }
  });
}

function playFile(text: string, opts?: { rate?: number }): Promise<boolean> {
  const key = text.toLowerCase();
  if (!AUDIO_SET.has(key)) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    try {
      const audio = getPooledAudio();
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.muted = false;
      audio.volume = 1;
      audio.playbackRate = opts?.rate ?? 1;
      audio.src = `${AUDIO_BASE}${encodeURIComponent(key)}.mp3`;
      audio.currentTime = 0;
      let resolved = false;
      const done = (ok: boolean) => {
        if (resolved) return;
        resolved = true;
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => {
        console.warn('[tts] audio file error:', audio.src);
        done(false);
      };
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          // AbortError fires when we pause+swap src for the next cue while
          // a play() is still pending. That's expected, not a real failure
          // — let the next call drive the new resolution.
          if ((err as DOMException)?.name !== 'AbortError') {
            console.warn('[tts] audio.play rejected, fallback to TTS:', text, err);
          }
          done(false);
        });
      }
    } catch (err) {
      console.warn('[tts] audio creation failed:', text, err);
      resolve(false);
    }
  });
}

async function speakViaSynth(text: string, opts?: { rate?: number }): Promise<void> {
  if (!ttsAvailable()) return;
  await ensureVoices();
  return new Promise<void>((resolve) => {
    try {
      const synth = window.speechSynthesis;
      // iOS Safari + Chrome both have a long-standing bug where leftover or
      // stale utterances cause subsequent speak() calls to silently no-op.
      // A fresh cancel() before each speak resets the queue reliably.
      synth.cancel();
      synth.resume();
      const u = new SpeechSynthesisUtterance(text);
      if (cachedVoice) u.voice = cachedVoice;
      u.lang = cachedVoice?.lang ?? 'en-US';
      u.rate = opts?.rate ?? 0.8;
      u.pitch = 1.05;
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      // Defer speak() to the next tick: Chrome occasionally drops the
      // utterance when speak() runs in the same task as cancel().
      setTimeout(() => {
        try {
          synth.speak(u);
        } catch {
          done();
        }
      }, 60);
      setTimeout(done, 6000);
    } catch {
      resolve();
    }
  });
}

export async function speak(text: string, opts?: { rate?: number }): Promise<void> {
  // Try pre-recorded MP3 first (most reliable across browsers / iOS)
  const ok = await playFile(text, opts);
  if (ok) return;
  // Fall back to Web Speech API
  await speakViaSynth(text, opts);
}

export async function speakLetter(letter: string, opts?: { rate?: number }): Promise<void> {
  const key = letter.trim().toLowerCase();
  // Stage 1: Web Audio path. iPad WebKit silently drops the per-letter cue
  // when the pooled HTMLAudioElement gets a fresh src right after a previous
  // play ended; AudioBufferSourceNode replays the same decoded MP3 without
  // touching the element-reuse code path that bug lives in.
  if (await playLetterViaWebAudio(key)) return;
  // Stage 2: pooled element fallback (works on PC + iOS for the first cue).
  const ok = await playFile(`letter-${key}`, opts);
  if (ok) return;
  // Stage 3: synth fallback. Prefix with "letter" so the voice doesn't read
  // a bare phonetic name like "ay" / "eye" as the English words "aye"/"I".
  const upper = key.toUpperCase();
  await speakViaSynth(`letter ${upper}`, { rate: opts?.rate ?? 0.85 });
}
