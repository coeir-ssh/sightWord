let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady: Promise<void> | null = null;
let unlocked = false;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  const preferredNames = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa'];
  for (const name of preferredNames) {
    const hit = en.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return en[0] ?? voices[0] ?? null;
}

function ensureVoices(): Promise<void> {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise<void>((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) {
      cachedVoice = pickVoice();
      resolve();
      return;
    }
    const handler = () => {
      cachedVoice = pickVoice();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      if (!cachedVoice) cachedVoice = pickVoice();
      resolve();
    }, 1500);
  });
  return voicesReady;
}

export async function speak(text: string, opts?: { rate?: number }): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  await ensureVoices();
  return new Promise<void>((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (cachedVoice) u.voice = cachedVoice;
      u.lang = cachedVoice?.lang ?? 'en-US';
      u.rate = opts?.rate ?? 0.75;
      u.pitch = 1.05;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Call inside a user gesture (e.g., a click handler) to unlock iOS Safari TTS. */
export function unlockTts(): void {
  if (unlocked) return;
  if (!ttsAvailable()) return;
  try {
    // Force voice list to populate.
    window.speechSynthesis.getVoices();
    // Speak a near-silent utterance to satisfy iOS gesture requirement.
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.rate = 1;
    window.speechSynthesis.speak(u);
    unlocked = true;
    void ensureVoices();
  } catch {
    /* ignore */
  }
}

export function isTtsUnlocked(): boolean {
  return unlocked;
}
