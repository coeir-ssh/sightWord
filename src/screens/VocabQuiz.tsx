import { useEffect, useMemo, useRef, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { CoinFly } from '../components/CoinFly';
import { Character3D } from '../components/Character3D';
import { Coin } from '../components/Coin';
import { WordRow, type AggregateInfo, type WordRowHandle } from '../components/WordRow';
import type { SlotVariant } from '../components/LetterSlot';
import {
  useCharGender,
  useCharName,
  useInventory,
  useVocabQuizList,
  useWallet,
} from '../lib/state';
import {
  getVocabQuizList,
  sentenceForBlankRead,
  splitSentenceByTargets,
  VOCAB_QUIZ_STEPS,
  type VocabQuizItem,
} from '../data/vocabQuiz';
import { storage } from '../lib/storage';
import { speak } from '../lib/tts';
import { shuffle } from '../lib/shuffle';

type Props = { onBack: () => void };

// One flat 300-coin payout every time the child finishes a step, matching the
// user-requested reward. Chapter completion loops the step back to 1 (same
// policy as Sight Word Step 5).
const STEP_COINS = 300;
// Slower TTS so the child can hear each target word clearly and repeat.
const READ_RATE = 0.65;

// Variants array for tracing one target word given the step kind.
function variantsForTarget(word: string, kind: 'trace-all' | 'trace-partial' | 'trace-none'): SlotVariant[] {
  return word.split('').map((_, i) => {
    if (kind === 'trace-all') return 'guide';
    if (kind === 'trace-partial') return i === 0 ? 'guide' : 'hidden';
    return 'hidden';
  });
}

export function VocabQuiz({ onBack }: Props) {
  const { listId } = useVocabQuizList();
  const { wallet, addCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory } = useInventory(gender);
  const { name: charName } = useCharName();

  const list = getVocabQuizList(listId);

  // Fix the step for this session, read from saved progress; the completion
  // handler bumps it to the next step (looping 6 → 1) after finishing.
  const [step] = useState(() =>
    Math.min(VOCAB_QUIZ_STEPS.length - 1, Math.max(0, storage.getVocabQuizStep(listId)))
  );
  const stepDef = VOCAB_QUIZ_STEPS[step];

  // Item order — shuffled once per session for the mixed-order steps.
  const items = useMemo<VocabQuizItem[]>(() => {
    return stepDef.shuffle ? shuffle(list.items) : list.items;
  }, [list, stepDef.shuffle]);

  const [idx, setIdx] = useState(0);
  const item = items[idx];
  const total = items.length;

  const [coinTrigger, setCoinTrigger] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [completedScreen, setCompletedScreen] = useState<null | { coins: number }>(null);

  // Per-sub-word passing state: passedSubwordsRef[targetIdx] is a boolean[]
  // one entry per whitespace-separated word inside that target. A target is
  // "done" when every sub-word in that row passes tracing.
  const passedSubwordsRef = useRef<boolean[][]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const rowRefs = useRef<Array<WordRowHandle | null>>([]);

  const recomputePassed = () => {
    const rows = passedSubwordsRef.current;
    const done = rows.filter((row) => row.length > 0 && row.every(Boolean)).length;
    setPassedCount(done);
  };

  // Reset per-item pass state when the sentence changes.
  useEffect(() => {
    passedSubwordsRef.current = (item?.targets ?? []).map((t) =>
      new Array(t.split(/\s+/).length).fill(false)
    );
    setPassedCount(0);
    rowRefs.current.forEach((r) => r?.resetAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, item]);

  // Auto-read the sentence when a new item first appears. Steps 5/6 replace
  // the target with the literal word "blank" so the child hears where their
  // word belongs; earlier steps read the sentence as-is.
  useEffect(() => {
    if (completedScreen) return;
    if (!item) return;
    const text = stepDef.kind === 'trace-none' ? sentenceForBlankRead(item) : item.sentence;
    // Small delay so any leftover audio from Home finishes and iOS
    // AudioContext is ready before this fires.
    const t = window.setTimeout(() => {
      void speak(text, { rate: READ_RATE });
    }, 150);
    return () => window.clearTimeout(t);
  }, [idx, item, completedScreen, stepDef.kind]);

  const advance = () => {
    if (idx + 1 >= total) {
      // Step complete — pay coins, bump the saved step (looping 6 → 1) and
      // show the completion screen.
      addCoins(STEP_COINS);
      setCoinTrigger((n) => n + 1);
      const nextStep = (step + 1) % VOCAB_QUIZ_STEPS.length;
      storage.setVocabQuizStep(listId, nextStep);
      setCompletedScreen({ coins: STEP_COINS });
    } else {
      setJumping(true);
      setTimeout(() => setJumping(false), 400);
      setIdx((n) => n + 1);
    }
  };

  const onSubwordAggregate = (targetIdx: number, subIdx: number) => (info: AggregateInfo) => {
    // A sub-word counts as "written" once every interactive letter in that
    // row passes. For the trace-partial step the first letter is 'shown' so
    // it's not interactive; only the rest have to pass — WordRow already
    // reports allPass across interactive-only slots.
    const passing = info.total > 0 ? info.allPass : true;
    const row = passedSubwordsRef.current[targetIdx];
    if (row && row[subIdx] !== passing) {
      row[subIdx] = passing;
      recomputePassed();
    }
  };

  const allTargetsPassed =
    (item?.targets.length ?? 0) > 0 && passedCount === (item?.targets.length ?? 0);

  // Auto-advance the moment every target on this line is written.
  useEffect(() => {
    if (!item) return;
    if (!allTargetsPassed) return;
    const t = setTimeout(() => advance(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTargetsPassed]);

  if (completedScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">📝🎉</div>
        <div className="text-4xl font-extrabold text-orange-700 text-center">
          {list.label} · Step {step + 1} Done!
        </div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>
        <div className="bg-white rounded-3xl px-8 py-5 shadow-lg min-w-[280px] flex items-center justify-between gap-6">
          <span className="font-extrabold text-slate-800 text-lg">You earned</span>
          <div className="flex items-center gap-1">
            <Coin size={32} />
            <span className="font-extrabold text-yellow-700 text-2xl">
              +{completedScreen.coins}
            </span>
          </div>
        </div>
        <div className="w-64 h-64">
          <Character3D equipped={inventory.equipped} jumping name={charName} gender={gender} />
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-2xl font-extrabold rounded-2xl shadow-lg"
        >
          🏠 Home
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center">
        <button onClick={onBack} className="bg-white rounded-2xl px-6 py-3 shadow font-bold">
          ← Home
        </button>
      </div>
    );
  }

  const stepLabel = `Step ${step + 1} / ${VOCAB_QUIZ_STEPS.length} · ${stepDef.label}`;
  const sentenceSegments = splitSentenceByTargets(item);
  const spokenText = stepDef.kind === 'trace-none' ? sentenceForBlankRead(item) : item.sentence;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col">
      <CoinFly triggerKey={coinTrigger} amount={STEP_COINS} />
      <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-amber-50 to-amber-50/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="flex flex-col items-center">
          <div className="text-orange-700 font-extrabold text-xl">📝 {list.label}</div>
          <div className="text-slate-600 font-bold text-xs mt-0.5">{stepLabel}</div>
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-6">
        <div className="h-3 bg-white rounded-full overflow-hidden shadow">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${((idx + (jumping ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <div className="text-center text-slate-600 mt-1 text-sm font-bold">
          {idx + 1} / {total}
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center p-4 gap-4">
        {/* Sentence card with target words highlighted */}
        <div className="bg-white/85 backdrop-blur rounded-3xl shadow-lg p-6 w-full max-w-3xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Listen and write
            </div>
            <button
              onClick={() => void speak(spokenText, { rate: READ_RATE })}
              className="bg-white border-2 border-orange-200 hover:bg-orange-50 active:scale-95 rounded-full px-4 py-1.5 text-sm font-extrabold text-orange-700 shadow"
            >
              🔊 Listen
            </button>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-relaxed">
            {stepDef.kind === 'trace-none'
              ? sentenceSegments.map((seg, i) =>
                  seg.kind === 'text' ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {seg.value}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className="inline-flex items-center min-w-[80px] px-3 py-0.5 mx-0.5 rounded-lg border-2 border-orange-300 bg-orange-50 text-orange-400"
                    >
                      ___
                    </span>
                  )
                )
              : sentenceSegments.map((seg, i) =>
                  seg.kind === 'text' ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {seg.value}
                    </span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => void speak(seg.value, { rate: READ_RATE })}
                      title="Tap to hear this word"
                      className="inline-block bg-yellow-200 hover:bg-yellow-300 active:scale-95 rounded-md px-1.5 mx-0.5 shadow-sm underline decoration-yellow-500 underline-offset-4"
                    >
                      {seg.value}
                    </button>
                  )
                )}
          </p>
        </div>

        {/* One tracing row per target word (or per word within a multi-word
            phrase). WordRow handles per-letter LetterSlots and reports when
            every interactive letter passes. */}
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {item.targets.map((target, ti) => {
            // Split multi-word phrases ("late for") into individual words so
            // each word gets its own tracing row with a visible gap.
            const words = target.split(/\s+/);
            const passing =
              (passedSubwordsRef.current[ti] ?? []).length > 0 &&
              (passedSubwordsRef.current[ti] ?? []).every(Boolean);
            return (
              <div
                key={`t-${ti}`}
                className={`bg-white/85 backdrop-blur rounded-3xl shadow-lg p-4 border-4 transition ${
                  passing ? 'border-green-400 bg-green-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Target {ti + 1}
                  </div>
                  <button
                    onClick={() => void speak(target, { rate: READ_RATE })}
                    className="bg-white border-2 border-orange-200 hover:bg-orange-50 active:scale-95 rounded-full px-3 py-1 text-xs font-extrabold text-orange-700 shadow"
                  >
                    🔊 Say Target
                  </button>
                </div>
                <div className="flex items-start justify-center gap-6 flex-wrap">
                  {words.map((word, wi) => (
                    <WordRow
                      key={`t-${ti}-w-${wi}`}
                      ref={(el) => {
                        const flat =
                          item.targets
                            .slice(0, ti)
                            .reduce((a, t) => a + t.split(/\s+/).length, 0) + wi;
                        rowRefs.current[flat] = el;
                      }}
                      word={word}
                      variants={variantsForTarget(word, stepDef.kind)}
                      onAggregateChange={onSubwordAggregate(ti, wi)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pb-4">
          <button
            onClick={() => {
              rowRefs.current.forEach((r) => r?.resetAll());
              passedSubwordsRef.current = item.targets.map((t) =>
                new Array(t.split(/\s+/).length).fill(false)
              );
              setPassedCount(0);
            }}
            className="px-6 py-3 rounded-2xl bg-rose-500 text-white text-lg font-bold shadow active:scale-95"
          >
            ↻ Reset
          </button>
          <button
            onClick={advance}
            disabled={!allTargetsPassed}
            className={`px-8 py-3 rounded-2xl text-lg font-extrabold shadow-lg transition ${
              allTargetsPassed
                ? 'bg-green-500 hover:bg-green-600 active:scale-95 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {idx + 1 >= total ? 'Finish ▶' : 'Next →'}
          </button>
        </div>
      </main>
    </div>
  );
}
