import { useMemo, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { WordStage, type Stage } from '../components/WordStage';
import { Character3D } from '../components/Character3D';
import { useInventory, useProgress, useWallet } from '../lib/state';
import { getWeek } from '../data/words';
import { shuffle } from '../lib/shuffle';

type Props = {
  onBack: () => void;
};

type DayPlan = {
  day: number;
  label: string;
  reward: number;
  steps: { stage: Stage; s2Difficulty?: 0 | 1 }[];
  /** if true, randomize word order per step */
  shuffleWords?: boolean;
  /** if true (Day5 mock test), word repeats once with S3 only */
  isMockTest?: boolean;
};

const DAY_PLANS: DayPlan[] = [
  {
    day: 0,
    label: 'Day 1 — 따라쓰기',
    reward: 5,
    steps: [{ stage: 'S1' }],
  },
  {
    day: 1,
    label: 'Day 2 — 따라쓰기 + 빈칸',
    reward: 7,
    steps: [{ stage: 'S1' }, { stage: 'S2', s2Difficulty: 0 }],
  },
  {
    day: 2,
    label: 'Day 3 — 빈칸 채우기',
    reward: 8,
    steps: [{ stage: 'S2', s2Difficulty: 1 }],
  },
  {
    day: 3,
    label: 'Day 4 — 자유 쓰기 연습',
    reward: 10,
    steps: [{ stage: 'S3' }],
    shuffleWords: true,
  },
  {
    day: 4,
    label: 'Day 5 — 모의 시험',
    reward: 10,
    steps: [{ stage: 'S3' }],
    shuffleWords: true,
    isMockTest: true,
  },
];

export function Learn({ onBack }: Props) {
  const { progress, dayDone, completeDay } = useProgress();
  const { wallet, addCoins } = useWallet();
  const { inventory } = useInventory();

  const week = getWeek(progress.currentWeek);
  const done = dayDone(progress.currentWeek);
  const todayDay = useMemo(() => {
    const i = done.findIndex((d) => !d);
    return i === -1 ? 4 : i;
  }, [done]);

  const plan = DAY_PLANS[todayDay];

  // Build sequence of (word, stage) for this day.
  // Each step iterates through all 5 words, optionally shuffled (per-step).
  const sequence = useMemo(() => {
    const seq: { word: string; stage: Stage; s2Difficulty?: 0 | 1 }[] = [];
    plan.steps.forEach((step) => {
      const words = plan.shuffleWords
        ? shuffle(week.words.map((w) => w.text))
        : week.words.map((w) => w.text);
      words.forEach((word) => {
        seq.push({ word, stage: step.stage, s2Difficulty: step.s2Difficulty });
      });
    });
    return seq;
  }, [plan, week]);

  const [idx, setIdx] = useState(0);
  const [completedScreen, setCompletedScreen] = useState<null | { coins: number; stars: number }>(null);
  const [jumping, setJumping] = useState(false);

  const handlePass = () => {
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
    if (idx + 1 >= sequence.length) {
      // Day complete
      const reward = plan.reward;
      const allDoneSoFar = done.slice();
      allDoneSoFar[todayDay] = true;
      const allFive = allDoneSoFar.every((d) => d);
      const bonus = allFive && todayDay === 4 ? 20 : 0;
      addCoins(reward + bonus);
      completeDay(progress.currentWeek, todayDay);
      setCompletedScreen({ coins: reward + bonus, stars: 3 });
    } else {
      setIdx((n) => n + 1);
    }
  };

  if (completedScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">🎉</div>
        <div className="text-4xl font-extrabold text-blue-700">{plan.label} 완료!</div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>
        <div className="bg-yellow-100 border-4 border-yellow-300 rounded-3xl px-8 py-4 shadow-lg flex items-center gap-3">
          <span className="text-4xl">🪙</span>
          <span className="text-4xl font-extrabold text-yellow-800">+{completedScreen.coins}</span>
        </div>
        <div className="w-64 h-64">
          <Character3D equipped={inventory.equipped} jumping />
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-2xl font-extrabold rounded-2xl shadow-lg"
        >
          🏠 홈으로
        </button>
      </div>
    );
  }

  const cur = sequence[idx];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-blue-700 font-extrabold text-xl">{plan.label}</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-6">
        <div className="h-3 bg-white rounded-full overflow-hidden shadow">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((idx + (jumping ? 1 : 0)) / sequence.length) * 100}%` }}
          />
        </div>
        <div className="text-center text-slate-600 mt-1 text-sm font-bold">
          {idx + 1} / {sequence.length}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 w-full max-w-3xl">
          <WordStage
            key={`${idx}-${cur.word}-${cur.stage}`}
            word={cur.word}
            stage={cur.stage}
            s2Difficulty={cur.s2Difficulty}
            onPass={handlePass}
          />
        </div>
      </main>
    </div>
  );
}
