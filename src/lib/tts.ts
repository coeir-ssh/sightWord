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
  // The priming play() runs SYNCHRONOUSLY in the gesture frame; we then
  // immediately reset muted/volume so the next real cue is audible. We do
  // NOT pause asynchronously after the promise resolves — a deferred pause
  // would clobber whatever cue the app has started in the meantime.
  try {
    const a = getPooledAudio();
    a.src =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    a.muted = true;
    a.volume = 0;
    void a.play().catch(() => {});
    a.muted = false;
    a.volume = 1;
  } catch {
    /* ignore */
  }
  if (ttsAvailable()) {
    try {
      const synth = window.speechSynthesis;
      synth.getVoices();
      // Prime the synth queue inside the gesture by speaking a single
      // inaudible utterance and letting it finish on its own. We deliberately
      // do NOT call synth.cancel() here — on Chrome, a speak() followed
      // immediately by cancel() leaves the engine in a state where the next
      // real utterance is dropped silently (the symptom users hit: "no audio
      // anywhere, even in incognito"). Letting a near-zero-duration ' '
      // utterance complete naturally primes the engine without poisoning it.
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.rate = 1;
      synth.speak(u);
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

type PlayResult = { ok: boolean; silent: boolean };

/** Play an MP3 from /audio. Reports whether playback completed and whether
 *  the audible duration was non-trivial (so callers can detect a silent or
 *  near-zero file and fall back to TTS). `skipManifest` lets letter cues
 *  attempt the file even when the build manifest doesn't list it. */
function playFile(
  text: string,
  opts?: { rate?: number; skipManifest?: boolean }
): Promise<PlayResult> {
  const key = text.toLowerCase();
  if (!opts?.skipManifest && !AUDIO_SET.has(key)) {
    return Promise.resolve({ ok: false, silent: false });
  }
  return new Promise<PlayResult>((resolve) => {
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
      const finish = (r: PlayResult) => {
        if (resolved) return;
        resolved = true;
        resolve(r);
      };
      audio.onended = () => {
        // onended only fires after the engine actually played the file
        // through. Trust it as a successful playback — earlier attempts to
        // flag "suspiciously short" durations as silent caused the synth
        // fallback to take over for legitimate short letter cues like 'a',
        // where the fallback voice pronounces "ay" as /aɪ/ ("I").
        finish({ ok: true, silent: false });
      };
      audio.onerror = () => {
        console.warn('[tts] audio file error:', audio.src);
        finish({ ok: false, silent: false });
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
          finish({ ok: false, silent: false });
        });
      }
    } catch (err) {
      console.warn('[tts] audio creation failed:', text, err);
      resolve({ ok: false, silent: false });
    }
  });
}

async function speakViaSynth(
  text: string,
  opts?: { rate?: number; skipCancel?: boolean }
): Promise<void> {
  if (!ttsAvailable()) return;
  await ensureVoices();
  return new Promise<void>((resolve) => {
    try {
      const synth = window.speechSynthesis;
      // Only cancel when something is actually playing or queued; cancelling
      // an idle synth on Chrome leaves the next utterance silenced.
      if (!opts?.skipCancel && (synth.speaking || synth.pending)) {
        synth.cancel();
      }
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
      try {
        synth.speak(u);
      } catch {
        done();
      }
      setTimeout(done, 6000);
    } catch {
      resolve();
    }
  });
}

export async function speak(text: string, opts?: { rate?: number }): Promise<void> {
  // Try pre-recorded MP3 first (most reliable across browsers / iOS)
  const r = await playFile(text, opts);
  if (r.ok && !r.silent) return;
  // Fall back to Web Speech API
  await speakViaSynth(text, opts);
}

// English letter names — used when the pre-recorded SSML MP3 isn't available
// or plays silently. Plain spellings ("ay", "bee", ...) are pronounced as the
// letter name by every voice we tested; quirks like Aria reading "ay" as /aɪ/
// only matter when the MP3 is missing entirely.
const LETTER_NAMES: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'gee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'em', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'are', s: 'ess', t: 'tee', u: 'you',
  v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zee',
};

export async function speakLetter(letter: string, opts?: { rate?: number }): Promise<void> {
  const key = letter.trim().toLowerCase();
  // Stage 1: try the pre-recorded letter MP3 by manifest.
  let r = await playFile(`letter-${key}`, opts);
  if (r.ok && !r.silent) return;
  // Stage 2: manifest miss → still attempt the URL directly. Build-time
  // generation occasionally drops one letter due to network blips, but the
  // static file is sometimes deployed anyway. 404s come back as onerror and
  // simply fall through.
  if (!r.ok) {
    r = await playFile(`letter-${key}`, { ...opts, skipManifest: true });
    if (r.ok && !r.silent) return;
  }
  // Stage 3: synth. Letter cues run on idle synth (words use mp3), so skip
  // the cancel() — it's the historical cause of Chrome silencing the next
  // utterance after a blanket cancel.
  const name = LETTER_NAMES[key] ?? key;
  console.debug('[tts] speakLetter -> synth fallback', { letter: key, name });
  await speakViaSynth(name, { rate: opts?.rate ?? 0.95, skipCancel: true });
}
