import audioManifest from '../data/audioManifest.json';

const AUDIO_SET = new Set<string>((audioManifest as string[]).map((w) => w.toLowerCase()));
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`;

let currentAudio: HTMLAudioElement | null = null;

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
  // Prime HTMLAudioElement (silent play) so first audio.play() works on iOS
  try {
    const a = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
    );
    a.volume = 0;
    void a.play().catch(() => {});
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

function playFile(text: string, opts?: { rate?: number }): Promise<boolean> {
  const key = text.toLowerCase();
  if (!AUDIO_SET.has(key)) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      const url = `${AUDIO_BASE}${encodeURIComponent(key)}.mp3`;
      const audio = new Audio(url);
      if (opts?.rate) audio.playbackRate = opts.rate;
      audio.volume = 1;
      currentAudio = audio;
      const done = (ok: boolean) => {
        if (currentAudio === audio) currentAudio = null;
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => {
        console.warn('[tts] audio file error:', url);
        done(false);
      };
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[tts] audio.play rejected, fallback to TTS:', text, err);
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
      synth.speak(u);
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

// English letter names — pronounced explicitly, since some voices speak a
// bare single character ("t") as silence or as a phoneme rather than the
// letter name learners need to hear.
const LETTER_NAMES: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'gee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'em', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'are', s: 'ess', t: 'tee', u: 'you',
  v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zee',
};

export async function speakLetter(letter: string, opts?: { rate?: number }): Promise<void> {
  const key = letter.trim().toLowerCase();
  const name = LETTER_NAMES[key] ?? key;
  // Cancel any in-flight synth utterance so the letter cue isn't queued
  // behind the longer word announcement.
  if (ttsAvailable()) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch { /* ignore */ }
    currentAudio = null;
  }
  await speakViaSynth(name, { rate: opts?.rate ?? 0.95 });
}
