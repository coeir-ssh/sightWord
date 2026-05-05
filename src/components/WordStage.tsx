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
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const passThresholdPct = Math.round(PASS_RATIO * 100);

  useEffect(() => {
    rowRef.current?.resetAll();
    setDone(false);
    setLastScore(null);
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

  const handleCheck = () => {
    const result = rowRef.current?.checkAll();
    if (!result) return;
    const pct = Math.round(result.ratio * 100);
    setLastScore(pct);
    if (result.pass) {
      setDone(true);
      setTimeout(() => onPass(), 800);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleRetry = () => {
    rowRef.current?.resetAll();
    setDone(false);
    setLastScore(null);
  };

  const stageHint =
    stage === 'S1'
      ? '🖍 점선을 따라 글자를 써 보세요!'
      : stage === 'S2'
        ? '🔤 빈칸에 알맞은 글자를 써 보세요!'
        : '👂 듣고 단어 전체를 써 보세요!';

  const showWord = stage === 'S1';

  const barColor =
    lastScore === null
      ? 'bg-slate-300'
      : lastScore >= passThresholdPct
        ? 'bg-green-500'
        : 'bg-red-400';

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

      <div className={shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}>
        <WordRow ref={rowRef} word={word} variants={variants} />
      </div>

      {/* Score progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1 px-1">
          <span>0%</span>
          <span className="text-slate-700">통과 {passThresholdPct}%</span>
          <span>100%</span>
        </div>
        <div className="relative h-7 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full ${barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${lastScore ?? 0}%` }}
          />
          {/* threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-800"
            style={{ left: `${passThresholdPct}%` }}
          />
          <div
            className="absolute -top-1 text-slate-800 text-xs font-bold pointer-events-none"
            style={{ left: `calc(${passThresholdPct}% - 8px)` }}
          >
            ▼
          </div>
          {lastScore !== null && (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-slate-900 drop-shadow">
              {lastScore}%
            </div>
          )}
        </div>
        {lastScore !== null && (
          <div className="text-center mt-2 font-bold">
            {lastScore >= passThresholdPct ? (
              <span className="text-green-600">🎉 잘했어요! ({lastScore}%)</span>
            ) : (
              <span className="text-red-500">
                글자를 {passThresholdPct}% 이상 따라 써야 다음으로 갈 수 있어요!
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-lg font-bold shadow"
        >
          🧽 지우기
        </button>
        {!done ? (
          <button
            onClick={handleCheck}
            className="px-8 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-lg font-bold shadow-lg"
          >
            확인
          </button>
        ) : (
          <div className="px-8 py-3 rounded-2xl bg-green-500 text-white text-lg font-bold shadow-lg">
            ⭐ 잘했어요!
          </div>
        )}
      </div>
    </div>
  );
}
