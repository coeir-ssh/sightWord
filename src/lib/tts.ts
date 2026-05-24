import audioManifest from '../data/audioManifest.json';

const AUDIO_SET = new Set<string>((audioManifest as string[]).map((w) => w.toLowerCase()));
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`;
// Per-letter MP3s are *bundled* with the build (see public/letters/),
// generated offline with espeak-ng so they don't depend on CI being able
// to reach Azure TTS. Everything that touches the alphabet — green-slot
// cues, eventually any alphabet drill — should pull from here so we get
// the exact same audio across browsers, with zero trim/SSML/autoplay
// quirks in the loop.
const LETTER_AUDIO_BASE = `${import.meta.env.BASE_URL}letters/`;

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

function playAudioFile(url: string, opts?: { rate?: number }): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const audio = getPooledAudio();
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.muted = false;
      audio.volume = 1;
      audio.playbackRate = opts?.rate ?? 1;
      audio.src = url;
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
            console.warn('[tts] audio.play rejected, fallback to TTS:', url, err);
          }
          done(false);
        });
      }
    } catch (err) {
      console.warn('[tts] audio creation failed:', url, err);
      resolve(false);
    }
  });
}

function playFile(text: string, opts?: { rate?: number }): Promise<boolean> {
  const key = text.toLowerCase();
  if (!AUDIO_SET.has(key)) {
    return Promise.resolve(false);
  }
  return playAudioFile(`${AUDIO_BASE}${encodeURIComponent(key)}.mp3`, opts);
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

// Phonetic fallback for the synth path. Only fires if the bundled MP3 fails
// to play — should be near-zero in production. Kept terse so a regression
// never reintroduces the "letter " prefix that started the cycle.
const LETTER_PHONETIC: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff',
  g: 'gee', h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el',
  m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'are',
  s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you',
  x: 'ex', y: 'why', z: 'zee',
};

export async function speakLetter(letter: string, opts?: { rate?: number }): Promise<void> {
  const key = letter.trim().toLowerCase();
  // Only a–z have a bundled MP3. Anything else (digit, punctuation) goes
  // straight to the synth fallback.
  if (/^[a-z]$/.test(key)) {
    const ok = await playAudioFile(`${LETTER_AUDIO_BASE}letter-${key}.mp3`, opts);
    if (ok) return;
  }
  // Last-resort synth so a broken deploy (missing letters/ folder) doesn't
  // leave the user completely silent.
  await speakViaSynth(LETTER_PHONETIC[key] ?? key, { rate: opts?.rate ?? 0.85 });
}
