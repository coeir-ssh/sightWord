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
  // Prime the SAME HTMLAudioElement we'll reuse for every word cue. iOS
  // Safari only blesses elements that have called .play() inside a user
  // gesture; a one-shot throwaway Audio() doesn't help subsequent new ones.
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

// Phonetic spelling for each letter. We route the per-letter cue straight
// through the Web Speech API: the earlier MP3-cached pipeline (Web Audio
// + pooled element + ffmpeg-trimmed "letter X" MP3s) kept regressing —
// residual "letter" prefix when the trim was too short, dead-silent
// playback when the trim was too long — and the user explicitly asked
// to ditch it in favor of a guaranteed-audible synth pronunciation.
//
// Quirks of the synth path that come with this trade-off:
//   - A bare "A" gets read as the article /ə/ on most voices, so we feed
//     "ay" / "bee" / ... to force the letter name.
//   - "ay" is read as /eɪ/ on Chrome Google voices and Safari Samantha,
//     but some system voices (older Aria, certain Edge fallbacks) read
//     it as /aɪ/ — i.e. it can come out sounding like the letter I. The
//     user accepted this trade-off ("아이"로 들리더라도 일관되게 들리는
//     게 낫다) so we don't try to disambiguate further.
//   - The synth queue is serial: rapidly drawing several letters in a
//     row can cancel mid-utterance because each call resets the queue.
//     That's intentional — last cue wins.
const LETTER_PHONETIC: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff',
  g: 'gee', h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el',
  m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'are',
  s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you',
  x: 'ex', y: 'why', z: 'zee',
};

export async function speakLetter(letter: string, opts?: { rate?: number }): Promise<void> {
  const key = letter.trim().toLowerCase();
  const spoken = LETTER_PHONETIC[key] ?? key;
  await speakViaSynth(spoken, { rate: opts?.rate ?? 0.85 });
}
