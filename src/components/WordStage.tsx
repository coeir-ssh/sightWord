import { useEffect, useRef, useState } from 'react';
import { WordRow, type WordRowHandle } from './WordRow';
import type { SlotVariant } from './LetterSlot';
import { speak } from '../lib/tts';
import { PASS_RATIO } from '../lib/scoring';

export type Stage = 'S1' | 'S2' | 'S3';

type Props = {
  word: string;
  stage: Stage;
  s2Difficulty?: 0 | 1;
  onPass: () => void;
};

function s2Variants(word: string, difficulty: 0 | 1): SlotVariant[] {
  const ratio = difficulty === 0 ? 0.5 : 0.7;
  const blanks = Math.max(1, Math.round(word.length * ratio));
  const indices = new Set<number>();
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const candidates: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i].toLowerCase())) candidates.push(i);
  }
  for (const c of candidates) {
    if (indices.size >= blanks) break;
    indices.add(c);
  }
  const all = Array.from({ length: word.length }, (_, i) => i).filter((i) => !indices.has(i));
  while (indices.size < blanks && all.length) {
    const i = Math.floor(Math.random() * all.length);
    indices.add(all.splice(i, 1)[0]);
  }
  return word.split('').map((_, i) => (indices.has(i) ? 'hidden' : 'shown'));
}

function variantsFor(word: string, stage: Stage, s2Difficulty: 0 | 1): SlotVariant[] {
  if (stage === 'S1') return word.split('').map(() => 'guide');
  if (stage === 'S2') return s2Variants(word, s2Difficulty);
  return word.split('').map(() => 'hidden');
}

export function WordStage({ word, stage, s2Difficulty = 0, onPass }: Props) {
  const rowRef = useRef<WordRowHandle | null>(null);
  const [variants] = useState<SlotVariant[]>(() => variantsFor(word, stage, s2Difficulty));
  const [coverage, setCoverage] = useState(0);
  const [allPass, setAllPass] = useState(false);
  const [done, setDone] = useState(false);
  const passThresholdPct = Math.round(PASS_RATIO * 100);

  useEffect(() => {
    rowRef.current?.resetAll();
    setCoverage(0);
    setAllPass(false);
    setDone(false);
  }, [word, stage]);

  useEffect(() => {
    const t = setTimeout(() => {
      void speak(word);
    }, 250);
    return () => clearTimeout(t);
  }, [word, stage]);

  const handleListen = async () => {
    await speak(word);
  };

  const handleNext = () => {
    if (!allPass || done) return;
    setDone(true);
    setTimeout(() => onPass(), 600);
  };

  const handleRetry = () => {
    rowRef.current?.resetAll();
    setCoverage(0);
    setAllPass(false);
    setDone(false);
  };

  const stageHint =
    stage === 'S1'
      ? '🖍 점선을 따라 글자를 써 보세요!'
      : stage === 'S2'
        ? '🔤 빈칸에 알맞은 글자를 써 보세요!'
        : '👂 듣고 단어 전체를 써 보세요!';

  const showWord = stage === 'S1';
  const pct = Math.min(100, Math.round(coverage * 100));
  const passed = allPass;
  const barColor = passed ? 'bg-green-500' : pct >= passThresholdPct ? 'bg-yellow-400' : 'bg-yellow-300';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-lg text-slate-600 font-medium">{stageHint}</div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleListen}
          className="text-5xl bg-yellow-300 hover:bg-yellow-400 active:scale-95 rounded-full w-20 h-20 shadow-lg transition flex items-center justify-center"
          aria-label="단어 듣기"
        >
          🔊
        </button>
        {showWord && (
          <div className="text-5xl font-kid font-bold text-blue-700 px-6 py-3 bg-white rounded-2xl shadow">
            {word}
          </div>
        )}
      </div>

      <WordRow
        ref={rowRef}
        word={word}
        variants={variants}
        onAggregateChange={(avg, all) => {
          setCoverage(avg);
          setAllPass(all);
        }}
      />

      {/* Live progress bar */}
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <span
            className={`font-extrabold text-sm tabular-nums w-10 ${
              passed ? 'text-green-600' : 'text-yellow-700'
            }`}
          >
            {passed ? 'OK!' : `${pct}%`}
          </span>
          <div className="relative flex-1 h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full ${barColor} transition-[width] duration-150 rounded-full`}
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-700"
              style={{ left: `${passThresholdPct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 tabular-nums w-10 text-right">
            {passThresholdPct}%
          </span>
        </div>
        {!passed && (
          <p className="text-center text-xs font-bold text-amber-600 mt-2">
            ▶ 글자를 {passThresholdPct}% 이상 따라 써야 다음으로!
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-2xl bg-rose-500 text-white text-lg font-bold shadow active:scale-95"
        >
          ▶ 다시 쓰기
        </button>
        <button
          onClick={handleNext}
          disabled={!passed || done}
          className={`px-8 py-3 rounded-2xl text-lg font-bold shadow-lg transition ${
            passed && !done
              ? 'bg-green-500 hover:bg-green-600 active:scale-95 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {done ? '⭐ 통과!' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
