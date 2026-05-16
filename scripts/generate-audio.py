#!/usr/bin/env python3
"""Pre-generate English MP3 audio for every sight word using Edge-TTS.

Run from repo root or scripts/. Output:
  public/audio/<word>.mp3
  src/data/audioManifest.json  (list of words successfully generated)

Used by the GitHub Actions deploy workflow before `npm run build`.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WORDS_FILE = REPO_ROOT / 'src/data/words.ts'
OUT_DIR = REPO_ROOT / 'public/audio'
MANIFEST_PATH = REPO_ROOT / 'src/data/audioManifest.json'

VOICE = 'en-US-AriaNeural'  # natural-sounding kid-friendly female voice
RATE = '-15%'                # a bit slower for kids
LETTERS = 'abcdefghijklmnopqrstuvwxyz'

# Plain-text prompt that Aria reliably reads as the actual letter name.
# We used to inject `<say-as interpret-as="characters">x</say-as>` via
# edge-tts internals, but that hack broke silently on a recent edge-tts
# release — letter MP3s stopped being generated, which then routed every
# per-letter cue through the synth fallback (silent on iPad).
def letter_prompt(letter: str) -> str:
    return f'letter {letter.upper()}'


def parse_words() -> list[str]:
    text = WORDS_FILE.read_text(encoding='utf-8')
    # Words are in arrays like ['I', 'a', 'is', ...]
    matches = re.findall(r"'([A-Za-z]+)'", text)
    seen: dict[str, None] = {}
    for w in matches:
        if w not in seen:
            seen[w] = None
    return list(seen.keys())


async def synth_one(
    manifest_key: str,
    spoken_text: str,
    file_stem: str,
    sem: asyncio.Semaphore,
) -> tuple[str, bool]:
    """Generate one MP3.

    manifest_key: identifier appended to the audio manifest (and used as the
                  lookup key in the app, e.g. 'the' or 'letter-a').
    spoken_text:  text passed to the TTS engine ('the', 'letter A', ...).
    file_stem:    on-disk filename stem under OUT_DIR (without .mp3).
    """
    import edge_tts
    out_path = OUT_DIR / f'{file_stem}.mp3'
    if out_path.exists() and out_path.stat().st_size > 500:
        return manifest_key, True
    async with sem:
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                communicate = edge_tts.Communicate(spoken_text, VOICE, rate=RATE)
                await communicate.save(str(out_path))
                ok = out_path.exists() and out_path.stat().st_size > 500
                if ok:
                    print(f'  OK  {manifest_key!r:>14} -> {out_path.name}')
                    return manifest_key, True
                last_err = RuntimeError('empty file')
            except Exception as e:
                last_err = e
            await asyncio.sleep(0.5 * attempt)
        print(f'  ERR {manifest_key!r}: {last_err}', file=sys.stderr)
        return manifest_key, False


async def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    words = parse_words()
    # Schedule words and per-letter announcements together. Letter names are
    # stored as 'letter-<a-z>.mp3' with manifest key 'letter-<a-z>' so they
    # don't collide with the sight word "a".
    # tuple: (manifest_key, spoken_text, file_stem)
    tasks: list[tuple[str, str, str]] = []
    for w in words:
        key = w.lower()
        tasks.append((key, w, key))
    for letter in LETTERS:
        tasks.append((f'letter-{letter}', letter_prompt(letter), f'letter-{letter}'))

    print(
        f'Generating audio: {len(words)} sight words + '
        f'{len(LETTERS)} letters -> {OUT_DIR}'
    )
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(
        *[synth_one(k, t, s, sem) for k, t, s in tasks]
    )
    manifest = [k for k, ok in results if ok]
    MANIFEST_PATH.write_text(json.dumps(sorted(manifest)), encoding='utf-8')
    failed = [k for k, ok in results if not ok]
    print(f'Wrote manifest: {len(manifest)} / {len(tasks)} entries')
    if failed:
        print(f'  {len(failed)} entry(ies) failed (browser TTS will be used as fallback): {failed}')
    # Always succeed: missing audio falls back to Web Speech API in the app.
    return 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
