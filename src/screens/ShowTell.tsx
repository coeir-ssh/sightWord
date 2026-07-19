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
  countSlots,
  fillSentence,
  getShowTellScript,
  getSlots,
  getWordBox,
  showTellSteps,
  splitSentence,
  type ShowTellScript,
  type Slot,
} from '../data/showTell';
import { storage } from '../lib/storage';
import { speak } from '../lib/tts';

type Props = {
  onBack: () => void;
};

// The fill step walks the chapter sentence by sentence. A sentence with slots
// yields one item per slot (blank/choice); a sentence with no slot yields a
// single read-only item so the whole sentence is still shown.
type FillItem =
  | { kind: 'slot'; sIdx: number; bIdx: number; slot: Slot }
  | { kind: 'read'; sIdx: number };

// A chapter is done one STEP at a time (like the sight-word day flow): the
// child completes a single step, earns coins, returns Home, then presses the
// next-step button to start the following step. Steps (per showTellSteps):
//  - fill   : type each blank / pick each (a/b) choice. Answers are saved.
//  - learn  : full sentence shown + read aloud (slowly).
//  - cue    : only the first N words shown + read (4 → 3 → 2 → 1, fading).
//  - recite : nothing shown; the child presents the whole thing from memory.

const STEP_COINS = 5;
// Big payoff for finishing the whole chapter (the final step).
const COMPLETE_BONUS = 300;
// Slower than the default so the child can repeat after it.
const READ_RATE = 0.6;

// The first N words of a sentence — used for the fading 'cue' steps.
function firstWords(sentence: string, n: number): string {
  return sentence.trim().split(/\s+/).slice(0, n).join(' ');
}

// Normalize a word for "already used" matching: case- and space-insensitive,
// so a Word Box "To a hotel" matches a blank filled with "to a hotel".
const normWord = (s: string) => s.trim().toLowerCase();

// Build the starting fills for a script: an empty slot per fill slot, overlaid
// with whatever the child previously typed/picked (saved per script).
function buildInitialFills(script: ShowTellScript): string[][] {
  const empty = script.sentences.map((s) => new Array(countSlots(s)).fill(''));
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

  // The ordered steps for this chapter, and the single step this session runs
  // (read once from saved progress; fixed for the session).
  const steps = useMemo(() => showTellSteps(script), [script]);
  const [step] = useState(() =>
    Math.min(steps.length - 1, Math.max(0, storage.getShowTellStep(scriptId)))
  );
  const stepDef = steps[step];

  // The fill walk: every sentence appears. Sentences with slots contribute one
  // item per slot; sentences with no slot contribute a single read-only item.
  const fillItems = useMemo<FillItem[]>(() => {
    const out: FillItem[] = [];
    script.sentences.forEach((s, sIdx) => {
      const ss = getSlots(s);
      if (ss.length === 0) out.push({ kind: 'read', sIdx });
      else ss.forEach((slot, bIdx) => out.push({ kind: 'slot', sIdx, bIdx, slot }));
    });
    return out;
  }, [script]);

  const [fills, setFills] = useState<string[][]>(() => buildInitialFills(script));
  const [fillCursor, setFillCursor] = useState(0);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [stepResult, setStepResult] = useState<
    null | { coins: number; chapterComplete: boolean }
  >(null);

  const filledSentences = useMemo(
    () => script.sentences.map((s, i) => fillSentence(s, fills[i] ?? [])),
    [script, fills]
  );
  const cur = filledSentences[idx];
  const cueText = stepDef.kind === 'cue' ? firstWords(cur, stepDef.words ?? 2) : cur;

  // Auto-read (slowly) when a sentence first appears: the full sentence in the
  // learn phase, only the leading words in the cue phases.
  useEffect(() => {
    if (stepResult) return;
    if (stepDef.kind === 'learn') void speak(cur, { rate: READ_RATE });
    else if (stepDef.kind === 'cue') void speak(cueText, { rate: READ_RATE });
  }, [stepDef, idx, stepResult, cur, cueText]);

  // Fill phase: auto-read the current sentence whenever the child lands
  // on a new sentence (each new blank position that jumped to a different
  // sIdx). Empty blanks are read as the word "blank" (see the `spoken`
  // string built below). We intentionally do NOT re-fire on every keystroke —
  // the child updates their own word in real time; the Listen button is
  // there to re-read the sentence with the current choices when they want.
  const fillSpokenSentenceIdx =
    stepDef.kind === 'fill' ? fillItems[fillCursor]?.sIdx : undefined;
  useEffect(() => {
    if (stepResult) return;
    if (stepDef.kind !== 'fill') return;
    if (fillSpokenSentenceIdx == null) return;
    // Build the spoken form here to read the LATEST fills — don't depend on
    // the memoised `spoken` variable defined lower in render.
    const sentence = script.sentences[fillSpokenSentenceIdx];
    const rowFills = fills[fillSpokenSentenceIdx] ?? [];
    const text = fillSentence(sentence, rowFills)
      .replace(/\(([^()]*\/[^()]*)\)/g, ' blank ')
      .replace(/___/g, ' blank ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) void speak(text, { rate: READ_RATE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepDef.kind, fillSpokenSentenceIdx, stepResult]);

  // Advance saved progress to the next step and show the step-complete screen.
  const completeStep = (coins: number) => {
    const nextStep = step + 1;
    const chapterComplete = nextStep >= steps.length;
    // Loop back to step 0 once the chapter is finished so it can be replayed.
    storage.setShowTellStep(scriptId, chapterComplete ? 0 : nextStep);
    setStepResult({ coins, chapterComplete });
  };

  // ── Fill phase helpers (blank = typed, choice = picked; both saved) ──
  const setSlotValue = (value: string) => {
    const it = fillItems[fillCursor];
    if (!it || it.kind !== 'slot') return;
    setFills((prev) => {
      const next = prev.map((row) => row.slice());
      next[it.sIdx][it.bIdx] = value;
      storage.setShowTellFills(script.id, next);
      return next;
    });
  };

  const clearCurrentSlot = () => {
    const it = fillItems[fillCursor];
    if (!it || it.kind !== 'slot') return;
    setFills((prev) => {
      const next = prev.map((row) => row.slice());
      next[it.sIdx][it.bIdx] = '';
      storage.setShowTellFills(script.id, next);
      return next;
    });
  };

  const allSlotsFilled = fillItems.every(
    (it) => it.kind !== 'slot' || (fills[it.sIdx]?.[it.bIdx] ?? '').trim() !== ''
  );

  const finishFill = () => {
    const coins = STEP_COINS * multiplier;
    addCoins(coins);
    setCoinTrigger((n) => n + 1);
    completeStep(coins);
  };

  const cur0 = fillItems[fillCursor];
  const cur0Fill = cur0 && cur0.kind === 'slot' ? fills[cur0.sIdx]?.[cur0.bIdx] ?? '' : '';
  // Read-only items need no fill; slot items need a non-empty value to advance.
  const canAdvance = !cur0 || cur0.kind !== 'slot' || cur0Fill.trim() !== '';
  const advanceFill = () => {
    if (fillCursor + 1 < fillItems.length) {
      if (canAdvance) setFillCursor((c) => Math.min(fillItems.length - 1, c + 1));
    } else if (allSlotsFilled) {
      finishFill();
    }
  };

  // ── Learn / Cue phases (walk the sentences, award on finish) ──
  const nextSentence = () => {
    if (idx + 1 >= total) {
      const coins = STEP_COINS * multiplier;
      addCoins(coins);
      setCoinTrigger((n) => n + 1);
      completeStep(coins);
    } else {
      setIdx((n) => n + 1);
    }
  };

  // ── Recite phase (nothing shown; the big completion bonus at the end) ──
  const passRecite = () => {
    if (idx + 1 >= total) {
      const bonus = COMPLETE_BONUS * multiplier;
      addCoins(bonus);
      setCoinTrigger((n) => n + 1);
      completeStep(bonus);
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
            : `${stepDef.label} done!`}
        </div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>

        {stepResult.coins > 0 && (
          <div className="bg-white rounded-3xl px-8 py-5 shadow-lg space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between gap-6">
              <span className="font-extrabold text-slate-800 text-lg">You earned</span>
              <div className="flex items-center gap-1">
                <Coin size={32} />
                <span className="font-extrabold text-yellow-700 text-2xl">
                  +{stepResult.coins}
                </span>
              </div>
            </div>
          </div>
        )}

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

  const phaseLabel = `Step ${step + 1} / ${steps.length} · ${stepDef.label}`;

  // ───────── Fill phase render — focused per-slot (type or circle) ─────────
  if (stepDef.kind === 'fill') {
    const item = fillItems[fillCursor];
    const isRead = item?.kind === 'read';
    const isChoice = item?.kind === 'slot' && item.slot.kind === 'choice';
    const cursorFill =
      item?.kind === 'slot' ? fills[item.sIdx]?.[item.bIdx] ?? '' : '';
    const ctxParts = item ? splitSentence(script.sentences[item.sIdx]) : [];
    const wordBox = getWordBox(script.id);
    // Words already placed in any blank (normalized) so the Word Box can mark
    // them as used — case-insensitively ("To a hotel" ≈ "to a hotel").
    const usedWords = new Set<string>();
    fills.forEach((row) =>
      row.forEach((v) => {
        const n = normWord(v);
        if (n) usedWords.add(n);
      })
    );
    // The sentence read aloud: filled-in words kept, empty blanks spoken
    // as the word "blank" so the child hears where their word will go
    // instead of an awkward gap. For a read-only sentence there are no
    // slots, so the whole sentence is read as-is.
    const spoken = item
      ? fillSentence(script.sentences[item.sIdx], fills[item.sIdx] ?? [])
          .replace(/\(([^()]*\/[^()]*)\)/g, ' blank ')
          .replace(/___/g, ' blank ')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

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
              style={{ width: `${((fillCursor + 1) / Math.max(1, fillItems.length)) * 100}%` }}
            />
          </div>
          <div className="text-center text-slate-600 mt-1 text-sm font-bold">
            {isRead ? 'Read' : isChoice ? 'Choice' : 'Blank'} {fillCursor + 1} /{' '}
            {fillItems.length}
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center p-4 gap-4">
          {/* Active sentence card */}
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-6 w-full max-w-3xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                {isRead ? 'Read this sentence' : isChoice ? 'Circle one' : 'Fill in this blank'}
              </div>
              <button
                onClick={() => void speak(spoken, { rate: READ_RATE })}
                className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-full px-4 py-1.5 text-sm font-extrabold text-blue-700 shadow"
              >
                🔊 Listen
              </button>
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
                const placeholder =
                  p.kind === 'choice' ? `(${p.options.join('/')})` : '___';
                const isActive = item?.kind === 'slot' && p.index === item.bIdx;
                const filled = item ? fills[item.sIdx]?.[p.index] ?? '' : '';
                if (isActive) {
                  return (
                    <span
                      key={pIdx}
                      className="inline-flex items-center justify-center min-w-[160px] px-4 py-1 rounded-xl border-4 border-amber-500 bg-amber-100 text-amber-800 shadow"
                    >
                      {cursorFill || placeholder}
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
                    {filled || placeholder}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Input: nothing for read-only, circle for choice, type for blank */}
          {isRead ? null : isChoice ? (
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-5 w-full max-w-3xl">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                Circle Your Pick
              </div>
              <div className="grid grid-cols-2 gap-3">
                {item?.kind === 'slot' &&
                  item.slot.kind === 'choice' &&
                  item.slot.options.map((opt) => {
                    const picked = cursorFill === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSlotValue(opt)}
                        className={`px-4 py-4 rounded-full border-4 text-xl font-extrabold shadow active:scale-95 transition ${
                          picked
                            ? 'bg-amber-200 border-amber-500 text-amber-900'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-5 w-full max-w-3xl">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                Type Your Word
              </div>
              <input
                key={fillCursor}
                autoFocus
                value={cursorFill}
                onChange={(e) => setSlotValue(e.target.value)}
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
          )}

          {/* Word Box — reference words for the blanks (tap to use) */}
          {!isRead && !isChoice && wordBox.length > 0 && (
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg p-5 w-full max-w-3xl">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                Word Box — tap to use
              </div>
              <div className="flex flex-wrap gap-2">
                {wordBox.map((w) => {
                  // Amber = the word in the blank being edited right now.
                  // Green = already used in some blank (case-insensitive).
                  const isCurrent =
                    normWord(cursorFill) !== '' && normWord(w) === normWord(cursorFill);
                  const isUsed = usedWords.has(normWord(w));
                  return (
                    <button
                      key={w}
                      onClick={() => setSlotValue(w)}
                      className={`px-3 py-2 rounded-xl border-2 text-base font-extrabold shadow-sm active:scale-95 transition ${
                        isCurrent
                          ? 'bg-amber-200 border-amber-500 text-amber-900'
                          : isUsed
                            ? 'bg-green-100 border-green-400 text-green-800'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                      }`}
                    >
                      {isUsed && !isCurrent ? '✓ ' : ''}
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            {!isRead && (
              <button
                onClick={clearCurrentSlot}
                className="bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-95 rounded-2xl px-5 py-3 text-base font-extrabold text-slate-700 shadow"
              >
                ✕ Clear
              </button>
            )}
            {fillCursor + 1 < fillItems.length ? (
              <button
                onClick={() => {
                  if (canAdvance) setFillCursor((c) => Math.min(fillItems.length - 1, c + 1));
                }}
                disabled={!canAdvance}
                className={`rounded-2xl px-6 py-3 text-base font-extrabold shadow ${
                  !canAdvance
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={finishFill}
                disabled={!allSlotsFilled}
                className={`rounded-2xl px-8 py-3 text-lg font-extrabold shadow-lg ${
                  allSlotsFilled
                    ? 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {allSlotsFilled ? 'Finish ▶' : 'Fill in everything first'}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ───────── Learn / Cue / Recite render ─────────
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
            style={{ width: `${(idx / total) * 100}%` }}
          />
        </div>
        <div className="text-center text-slate-600 mt-1 text-sm font-bold">
          {idx + 1} / {total}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 w-full max-w-3xl flex flex-col items-center gap-6">
          {stepDef.kind !== 'recite' ? (
            <>
              <div className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 leading-snug">
                {stepDef.kind === 'cue' ? `${cueText} …` : cur}
              </div>
              {stepDef.kind === 'cue' && (
                <div className="text-center text-base font-bold text-slate-500">
                  Only the first {stepDef.words} word{stepDef.words === 1 ? '' : 's'} — try to
                  remember the rest!
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() =>
                    void speak(stepDef.kind === 'cue' ? cueText : cur, { rate: READ_RATE })
                  }
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-6 py-3 text-xl font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen Again
                </button>
                <button
                  onClick={nextSentence}
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
                    Say the whole sentence from memory!
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
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl px-7 py-3 text-lg font-extrabold shadow-lg"
                >
                  {idx + 1 >= total ? 'Finish ▶' : 'Next ▶'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
