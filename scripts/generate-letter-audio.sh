#!/usr/bin/env bash
# Regenerate the bundled per-letter MP3s under public/letters/.
#
# Letter audio used to be generated in CI via edge-tts + ffmpeg trim, but
# that pipeline kept regressing (residual "letter " prefix on too-short
# trim, silent file on too-long trim, SSML hack breaking on edge-tts
# upgrades). Ship the audio with the repo instead — espeak-ng is offline,
# deterministic, and reads bare uppercase letters as the canonical letter
# name (A → /eɪ/, C → /siː/, etc.) with no SSML or trim required.
#
# Re-run only if you want to change voice/rate/pitch. The committed MP3s
# under public/letters/ are the source of truth at runtime.
#
# Requires: espeak-ng, ffmpeg.

set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/letters
for letter in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  upper=$(printf '%s' "$letter" | tr a-z A-Z)
  out="public/letters/letter-${letter}.mp3"
  espeak-ng -v en-us+f3 -s 185 -p 55 -a 190 "$upper" --stdout 2>/dev/null |
    ffmpeg -y -hide_banner -loglevel error -i - \
      -af "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-45dB:stop_periods=1:stop_silence=0.06:stop_threshold=-45dB" \
      -codec:a libmp3lame -b:a 96k "$out"
  printf '%s  %s\n' "$out" "$(stat -c %s "$out")B"
done
