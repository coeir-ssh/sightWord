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


def parse_words() -> list[str]:
    text = WORDS_FILE.read_text(encoding='utf-8')
    # Words are in arrays like ['I', 'a', 'is', ...]
    matches = re.findall(r"'([A-Za-z]+)'", text)
    seen: dict[str, None] = {}
    for w in matches:
        if w not in seen:
            seen[w] = None
    return list(seen.keys())


async def synth_one(word: str, sem: asyncio.Semaphore) -> tuple[str, bool]:
    import edge_tts
    out_path = OUT_DIR / f'{word.lower()}.mp3'
    if out_path.exists() and out_path.stat().st_size > 500:
        return word, True
    async with sem:
        last_err: Exception | None = None
        for attempt in range(1, 4):
            try:
                communicate = edge_tts.Communicate(word, VOICE, rate=RATE)
                await communicate.save(str(out_path))
                ok = out_path.exists() and out_path.stat().st_size > 500
                if ok:
                    print(f'  OK  {word!r:>10} -> {out_path.name}')
                    return word, True
                last_err = RuntimeError('empty file')
            except Exception as e:
                last_err = e
            await asyncio.sleep(0.5 * attempt)
        print(f'  ERR {word!r}: {last_err}', file=sys.stderr)
        return word, False


async def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    words = parse_words()
    print(f'Generating audio for {len(words)} sight words to {OUT_DIR}')
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*[synth_one(w, sem) for w in words])
    manifest = [w for w, ok in results if ok]
    MANIFEST_PATH.write_text(json.dumps(sorted(manifest)), encoding='utf-8')
    failed = [w for w, ok in results if not ok]
    print(f'Wrote manifest: {len(manifest)} / {len(words)} words')
    if failed:
        print(f'  {len(failed)} word(s) failed (browser TTS will be used as fallback): {failed}')
    # Always succeed: missing audio falls back to Web Speech API in the app.
    return 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
