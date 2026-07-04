import { useEffect, useMemo, useRef, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { CoinFly } from '../components/CoinFly';
import { Character3D } from '../components/Character3D';
import { Coin } from '../components/Coin';
import {
  useCharGender,
  useCharName,
  useInventory,
  useShowTellScript,
  useSuperMode,
  useWallet,
} from '../lib/state';
import {
  countBlanks,
  fillSentence,
  getShowTellScript,
  splitSentence,
  totalBlanks,
  type ShowTellScript,
} from '../data/showTell';
import { storage } from '../lib/storage';
import { speak } from '../lib/tts';

type Props = {
  onBack: () => void;
};

// Build the starting fills for a script: an empty slot per blank, overlaid
// with whatever the child previously typed (saved per script). Rebuilt from
// the current blank shape so it stays valid even if a chapter's text changes.
function buildInitialFills(script: ShowTellScript): string[][] {
  const empty = script.sentences.map((s) => new Array(countBlanks(s)).fill(''));
  const saved = storage.getShowTellFills(script.id);
  if (!saved) return empty;
  return empty.map((row, i) => row.map((_, j) => saved[i]?.[j] ?? ''));
}

// Three passes through the script:
//  - 'fill'   : (worksheet chapters only) the child types a word into each
//               blank to personalize the script. Answers are saved.
//  - 'learn'  : every (filled-in) sentence is shown + read aloud so the
//               child learns it.
//  - 'recite' : the sentence is hidden; the child presents it from memory,
//               then reveals to self-check. Coins are awarded per sentence.
type Phase = 'fill' | 'learn' | 'recite';

const PER_SENTENCE_COINS = 5;
const COMPLETE_BONUS = 10;
const FILL_COIN = 1;

export function ShowTell({ onBack }: Props) {
  const { scriptId } = useShowTellScript();
  const { wallet, addCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory } = useInventory(gender);
  const { name: charName } = useCharName();
  const { superMode } = useSuperMode();
  const multiplier = superMode ? 2 : 1;

  const script = getShowTellScript(scriptId);
  const total = script.sentences.length;
  const hasBlanks = totalBlanks(script) > 0;

  // Flat list of [sentenceIdx, blankIdx] for the fill phase so we walk through
  // every blank in reading order.
  const blanks = useMemo(() => {
    const out: { sIdx: number; bIdx: number }[] = [];
    script.sentences.forEach((s, sIdx) => {
      const n = countBlanks(s);
      for (let bIdx = 0; bIdx < n; bIdx++) out.push({ sIdx, bIdx });
    });
    return out;
  }, [script]);

  // fills[sentenceIdx] = array of strings, one per blank in that sentence.
  // Seeded from any previously saved answers for this script.
  const [fills, setFills] = useState<string[][]>(() => buildInitialFills(script));
  // Tracks which blanks already granted the fill coin this session so
  // clearing + retyping the same blank can't farm coins.
  const awardedRef = useRef<Set<string>>(new Set());
  // Reset fills when the script changes.
  useEffect(() => {
    setFills(buildInitialFills(script));
    awardedRef.current = new Set();
    setPhase(hasBlanks ? 'fill' : 'learn');
    setFillCursor(0);
    setIdx(0);
    setRevealed(false);
  }, [scriptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<Phase>(hasBlanks ? 'fill' : 'learn');
  const [fillCursor, setFillCursor] = useState(0);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [completed, setCompleted] = useState<null | { coins: number; bonus: number }>(null);

  const filledSentences = useMemo(
    () => script.sentences.map((s, i) => fillSentence(s, fills[i] ?? [])),
    [script, fills]
  );
  const cur = filledSentences[idx];

  // Auto-read the sentence when it first appears in the learn phase. In the
  // recite phase we stay silent so the child recalls it on their own (they
  // can tap 🔊 to check). cur/phase in deps so each new sentence re-fires.
  useEffect(() => {
    if (phase === 'learn' && !completed) {
      void speak(cur);
    }
  }, [phase, idx, completed, cur]);

  const award = () => {
    const perSentence = PER_SENTENCE_COINS * multiplier;
    addCoins(perSentence);
    setCoinTrigger((n) => n + 1);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
  };

  // The child types the blank in directly; every keystroke saves.
  const typeBlank = (value: string) => {
    const cursor = blanks[fillCursor];
    if (!cursor) return;
    setFills((prev) => {
      const next = prev.map((row) => row.slice());
      const prevWord = next[cursor.sIdx][cursor.bIdx];
      next[cursor.sIdx][cursor.bIdx] = value;
      storage.setShowTellFills(script.id, next);
      // Tiny coin reward the first time a blank goes from empty to filled,
      // once per blank per session (tracked in awardedRef).
      const key = `${cursor.sIdx}:${cursor.bIdx}`;
      if (!prevWord && value.trim() !== '' && !awardedRef.current.has(key)) {
        awardedRef.current.add(key);
        addCoins(FILL_COIN * multiplier);
        setCoinTrigger((n) => n + 1);
      }
      return next;
    });
  };

  const clearCurrentBlank = () => {
    const cursor = blanks[fillCursor];
    if (!cursor) return;
    setFills((prev) => {
      const next = prev.map((row) => row.slice());
      next[cursor.sIdx][cursor.bIdx] = '';
      storage.setShowTellFills(script.id, next);
      return next;
    });
  };

  const allBlanksFilled = blanks.every(
    ({ sIdx, bIdx }) => (fills[sIdx]?.[bIdx] ?? '').trim() !== ''
  );

  const finishFill = () => {
    setPhase('learn');
    setIdx(0);
  };

  const nextLearn = () => {
    if (idx + 1 >= total) {
      setPhase('recite');
      setIdx(0);
      setRevealed(false);
    } else {
      setIdx((n) => n + 1);
    }
  };

  const passRecite = () => {
    award();
    if (idx + 1 >= total) {
      const bonus = COMPLETE_BONUS * multiplier;
      addCoins(bonus);
      setCompleted({ coins: total * PER_SENTENCE_COINS * multiplier, bonus });
    } else {
      setIdx((n) => n + 1);
      setRevealed(false);
    }
  };

  if (completed) {
    const sum = completed.coins + completed.bonus;
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">🎤🎉</div>
        <div className="text-4xl font-extrabold text-blue-700 text-center">
          {script.emoji} {script.title} Complete!
        </div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>

        <div className="bg-white rounded-3xl px-8 py-5 shadow-lg space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">Sentences</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completed.coins}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">Completion Bonus</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completed.bonus}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6 pt-2 border-t-2 border-slate-300">
            <span className="font-extrabold text-slate-800 text-lg">Total</span>
            <div className="flex items-center gap-1">
              <Coin size={32} />
              <span className="font-extrabold text-yellow-700 text-2xl">+{sum}</span>
            </div>
          </div>
        </div>

        <div className="w-64 h-64">
          <Character3D equipped={inventory.equipped} jumping name={charName} gender={gender} />
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-2xl font-extrabold rounded-2xl shadow-lg"
        >
          🏠 Home
        </button>
      </div>
    );
  }

  const phaseLabel =
    phase === 'fill'
      ? 'Step 1 · Type Your Words'
      : phase === 'learn'
        ? 'Step 2 · Listen & Repeat'
        : 'Step 3 · Present from Memory';

  const cursor0 = blanks[fillCursor];
  const cursor0Fill = cursor0 ? fills[cursor0.sIdx]?.[cursor0.bIdx] ?? '' : '';
  const advanceFill = () => {
    if (fillCursor + 1 < blanks.length) {
      if (cursor0Fill.trim() !== '') {
        setFillCursor((c) => Math.min(blanks.length - 1, c + 1));
      }
    } else if (allBlanksFilled) {
      finishFill();
    }
  };

  // ───────── Fill phase render — focused per-blank picker ─────────
  if (phase === 'fill') {
    const cursor = blanks[fillCursor];
    const cursorFill = cursor ? fills[cursor.sIdx]?.[cursor.bIdx] ?? '' : '';
    // The sentence currently being filled, rendered with the active blank
    // shown as a placeholder slot and any other blanks shown as small
    // greyed placeholders so the kid sees context but the focus stays on
    // the active slot.
    const ctxParts = cursor ? splitSentence(script.sentences[cursor.sIdx]) : [];

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
        <CoinFly triggerKey={coinTrigger} />
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
          <button
            onClick={onBack}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
          >
            ← Home
          </button>
          <div className="flex flex-col items-center">
            <div className="text-blue-700 font-extrabold text-xl">
              {script.emoji} {script.title}
            </div>
            {script.month && (
              <div className="text-blue-400 font-extrabold text-[11px] mt-0.5">
                {script.month}
              </div>
            )}
            <div className="text-slate-600 font-bold text-xs mt-0.5">{phaseLabel}</div>
            {superMode && (
              <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow">
                🦸‍♂️ SUPER MODE · 2x Coins
              </div>
            )}
          </div>
          <CoinHUD coins={wallet.coins} />
        </header>

        <div className="px-6">
          <div className="h-3 bg-white rounded-full overflow-hidden shadow">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{
                width: `${((fillCursor + 1) / Math.max(1, blanks.length)) * 100}%`,
              }}
            />
          </div>
          <div className="text-center text-slate-600 mt-1 text-sm font-bold">
            Blank {fillCursor + 1} / {blanks.length}
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center p-4 gap-4">
          {/* Active sentence card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6 w-full max-w-3xl">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
              Fill in this blank
            </div>
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 text-2xl md:text-3xl font-extrabold text-slate-800 leading-relaxed">
              {ctxParts.map((p, pIdx) => {
                if (p.kind === 'text') {
                  return (
                    <span key={pIdx} className="whitespace-pre-wrap">
                      {p.value}
                    </span>
                  );
                }
                const isActive = cursor && p.index === cursor.bIdx;
                const filled = fills[cursor!.sIdx]?.[p.index] ?? '';
                if (isActive) {
                  return (
                    <span
                      key={pIdx}
                      className="inline-flex items-center justify-center min-w-[160px] px-4 py-1 rounded-xl border-4 border-amber-500 bg-amber-100 text-amber-800 shadow"
                    >
                      {cursorFill || '___'}
                    </span>
                  );
                }
                return (
                  <span
                    key={pIdx}
                    className={`inline-flex items-center justify-center min-w-[80px] px-2 py-0.5 rounded-lg border-2 text-base align-baseline ${
                      filled
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {filled || '___'}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Type-in box */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-5 w-full max-w-3xl">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
              Type Your Word
            </div>
            <input
              key={fillCursor}
              autoFocus
              value={cursorFill}
              onChange={(e) => typeBlank(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  advanceFill();
                }
              }}
              placeholder="Type here…"
              className="w-full border-4 border-amber-400 focus:border-amber-500 rounded-2xl px-4 py-3 text-2xl font-extrabold text-slate-800 outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
            <button
              onClick={() => setFillCursor((c) => Math.max(0, c - 1))}
              disabled={fillCursor === 0}
              className={`rounded-2xl px-5 py-3 text-base font-extrabold shadow ${
                fillCursor === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700'
              }`}
            >
              ← Back
            </button>
            <button
              onClick={clearCurrentBlank}
              className="bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-95 rounded-2xl px-5 py-3 text-base font-extrabold text-slate-700 shadow"
            >
              ✕ Clear
            </button>
            {fillCursor + 1 < blanks.length ? (
              <button
                onClick={() => setFillCursor((c) => Math.min(blanks.length - 1, c + 1))}
                disabled={cursorFill === ''}
                className={`rounded-2xl px-6 py-3 text-base font-extrabold shadow ${
                  cursorFill === ''
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                }`}
              >
                Next Blank →
              </button>
            ) : (
              <button
                onClick={finishFill}
                disabled={!allBlanksFilled}
                className={`rounded-2xl px-8 py-3 text-lg font-extrabold shadow-lg ${
                  allBlanksFilled
                    ? 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {allBlanksFilled ? 'Memorize ▶' : 'Fill in every blank first'}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ───────── Learn / Recite phase render ─────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <CoinFly triggerKey={coinTrigger} />
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="flex flex-col items-center">
          <div className="text-blue-700 font-extrabold text-xl">
            {script.emoji} {script.title}
          </div>
          <div className="text-slate-600 font-bold text-xs mt-0.5">{phaseLabel}</div>
          {superMode && (
            <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow">
              🦸‍♂️ SUPER MODE · 2x Coins
            </div>
          )}
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-6">
        <div className="h-3 bg-white rounded-full overflow-hidden shadow">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((idx + (jumping ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <div className="text-center text-slate-600 mt-1 text-sm font-bold">
          {idx + 1} / {total}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 w-full max-w-3xl flex flex-col items-center gap-6">
          {phase === 'learn' ? (
            <>
              <div className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 leading-snug">
                {cur}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => void speak(cur)}
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-6 py-3 text-xl font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen Again
                </button>
                <button
                  onClick={nextLearn}
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl px-8 py-3 text-xl font-extrabold shadow-lg"
                >
                  {idx + 1 >= total ? 'Memorize ▶' : 'Next ▶'}
                </button>
              </div>
            </>
          ) : (
            <>
              {revealed ? (
                <div className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 leading-snug">
                  {cur}
                </div>
              ) : (
                <div className="text-center text-2xl font-extrabold text-slate-400 leading-snug py-6">
                  🙈 Hidden
                  <div className="text-base font-bold text-slate-400 mt-2">
                    Say it out loud from memory!
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => void speak(cur)}
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-5 py-3 text-lg font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen
                </button>
                <button
                  onClick={() => setRevealed((v) => !v)}
                  className="bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-95 rounded-2xl px-5 py-3 text-lg font-extrabold text-slate-700 shadow"
                >
                  {revealed ? '🙈 Hide' : '👀 Reveal'}
                </button>
                <button
                  onClick={passRecite}
                  className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl px-7 py-3 text-lg font-extrabold shadow-lg"
                >
                  ✅ Got it!
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
