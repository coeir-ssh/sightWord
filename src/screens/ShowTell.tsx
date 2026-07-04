import { useEffect, useMemo, useState } from 'react';
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

// A chapter is done one STEP at a time (like the sight-word day flow): the
// child completes a single step, earns coins, returns Home, then presses the
// next-step button to start the following step.
//  - 'fill'   : (worksheet chapters only) type a word into each blank.
//  - 'learn'  : every filled-in sentence is shown + read aloud (slowly).
//  - 'recite' : the sentence is hidden; the child presents it from memory.
type Phase = 'fill' | 'learn' | 'recite';

const PHASE_LABEL: Record<Phase, string> = {
  fill: 'Fill in the Blanks',
  learn: 'Listen & Repeat',
  recite: 'Present from Memory',
};

const FILL_STEP_COINS = 5;
const LEARN_STEP_COINS = 5;
const PER_SENTENCE_COINS = 5;
const COMPLETE_BONUS = 10;
// Slower than the default so the child can repeat after it.
const READ_RATE = 0.6;

// Build the starting fills for a script: an empty slot per blank, overlaid
// with whatever the child previously typed (saved per script).
function buildInitialFills(script: ShowTellScript): string[][] {
  const empty = script.sentences.map((s) => new Array(countBlanks(s)).fill(''));
  const saved = storage.getShowTellFills(script.id);
  if (!saved) return empty;
  return empty.map((row, i) => row.map((_, j) => saved[i]?.[j] ?? ''));
}

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

  // The ordered steps for this chapter, and the single step this session runs
  // (read once from saved progress; fixed for the session).
  const phases = useMemo<Phase[]>(
    () => (hasBlanks ? ['fill', 'learn', 'recite'] : ['learn', 'recite']),
    [hasBlanks]
  );
  const [step] = useState(() =>
    Math.min(phases.length - 1, Math.max(0, storage.getShowTellStep(scriptId)))
  );
  const phase = phases[step];

  // Flat list of [sentenceIdx, blankIdx] for the fill phase.
  const blanks = useMemo(() => {
    const out: { sIdx: number; bIdx: number }[] = [];
    script.sentences.forEach((s, sIdx) => {
      const n = countBlanks(s);
      for (let bIdx = 0; bIdx < n; bIdx++) out.push({ sIdx, bIdx });
    });
    return out;
  }, [script]);

  const [fills, setFills] = useState<string[][]>(() => buildInitialFills(script));
  const [fillCursor, setFillCursor] = useState(0);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [stepResult, setStepResult] = useState<
    null | { coins: number; chapterComplete: boolean }
  >(null);

  const filledSentences = useMemo(
    () => script.sentences.map((s, i) => fillSentence(s, fills[i] ?? [])),
    [script, fills]
  );
  const cur = filledSentences[idx];

  // Auto-read the sentence (slowly) when it first appears in the learn phase.
  useEffect(() => {
    if (phase === 'learn' && !stepResult) {
      void speak(cur, { rate: READ_RATE });
    }
  }, [phase, idx, stepResult, cur]);

  // Advance saved progress to the next step and show the step-complete screen.
  const completeStep = (coins: number) => {
    const nextStep = step + 1;
    const chapterComplete = nextStep >= phases.length;
    // Loop back to step 0 once the chapter is finished so it can be replayed.
    storage.setShowTellStep(scriptId, chapterComplete ? 0 : nextStep);
    setStepResult({ coins, chapterComplete });
  };

  // ── Fill phase helpers ──
  const typeBlank = (value: string) => {
    const cursor = blanks[fillCursor];
    if (!cursor) return;
    setFills((prev) => {
      const next = prev.map((row) => row.slice());
      next[cursor.sIdx][cursor.bIdx] = value;
      storage.setShowTellFills(script.id, next);
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
    const coins = FILL_STEP_COINS * multiplier;
    addCoins(coins);
    setCoinTrigger((n) => n + 1);
    completeStep(coins);
  };

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

  // ── Learn phase ──
  const nextLearn = () => {
    if (idx + 1 >= total) {
      const coins = LEARN_STEP_COINS * multiplier;
      addCoins(coins);
      setCoinTrigger((n) => n + 1);
      completeStep(coins);
    } else {
      setIdx((n) => n + 1);
    }
  };

  // ── Recite phase ──
  const award = () => {
    addCoins(PER_SENTENCE_COINS * multiplier);
    setCoinTrigger((n) => n + 1);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
  };

  const passRecite = () => {
    award();
    if (idx + 1 >= total) {
      const bonus = COMPLETE_BONUS * multiplier;
      addCoins(bonus);
      completeStep(total * PER_SENTENCE_COINS * multiplier + bonus);
    } else {
      setIdx((n) => n + 1);
      setRevealed(false);
    }
  };

  // ───────── Step-complete screen ─────────
  if (stepResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">{stepResult.chapterComplete ? '🎤🎉' : '✅'}</div>
        <div className="text-4xl font-extrabold text-blue-700 text-center">
          {stepResult.chapterComplete
            ? `${script.emoji} ${script.title} Complete!`
            : `${PHASE_LABEL[phase]} done!`}
        </div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>

        <div className="bg-white rounded-3xl px-8 py-5 shadow-lg space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-6">
            <span className="font-extrabold text-slate-800 text-lg">You earned</span>
            <div className="flex items-center gap-1">
              <Coin size={32} />
              <span className="font-extrabold text-yellow-700 text-2xl">+{stepResult.coins}</span>
            </div>
          </div>
        </div>

        <div className="w-64 h-64">
          <Character3D
            equipped={inventory.equipped}
            jumping={stepResult.chapterComplete}
            name={charName}
            gender={gender}
          />
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-2xl font-extrabold rounded-2xl shadow-lg"
        >
          🏠 Home
        </button>
        <div className="text-slate-500 font-bold text-sm">
          {stepResult.chapterComplete
            ? 'Press the chapter button on Home to do it again.'
            : 'Press the next-step button on Home to keep going.'}
        </div>
      </div>
    );
  }

  const phaseLabel = `Step ${step + 1} / ${phases.length} · ${PHASE_LABEL[phase]}`;

  // ───────── Fill phase render — focused per-blank typing ─────────
  if (phase === 'fill') {
    const cursor = blanks[fillCursor];
    const cursorFill = cursor ? fills[cursor.sIdx]?.[cursor.bIdx] ?? '' : '';
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
                disabled={cursorFill.trim() === ''}
                className={`rounded-2xl px-6 py-3 text-base font-extrabold shadow ${
                  cursorFill.trim() === ''
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
                {allBlanksFilled ? 'Finish ▶' : 'Fill in every blank first'}
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
                  onClick={() => void speak(cur, { rate: READ_RATE })}
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-6 py-3 text-xl font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen Again
                </button>
                <button
                  onClick={nextLearn}
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl px-8 py-3 text-xl font-extrabold shadow-lg"
                >
                  {idx + 1 >= total ? 'Finish ▶' : 'Next ▶'}
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
                  onClick={() => void speak(cur, { rate: READ_RATE })}
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
