import { useMemo, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { CoinFly } from '../components/CoinFly';
import { WordStage, type Stage } from '../components/WordStage';
import { Character3D } from '../components/Character3D';
import { Coin } from '../components/Coin';
import { useCharGender, useCharName, useInventory, useProgress, useWallet } from '../lib/state';
import { getWeek, WEEK_IDS } from '../data/words';
import { shuffle } from '../lib/shuffle';

type Props = {
  onBack: () => void;
};

type DayPlan = {
  day: number;
  kind: string;
  /** Bonus coins on day completion (per-word coins are awarded separately, 1 each) */
  dayBonus: number;
  steps: { stage: Stage; s2Difficulty?: 0 | 1 }[];
  shuffleWords?: boolean;
  isMockTest?: boolean;
};

const DAY_PLANS: DayPlan[] = [
  { day: 0, kind: 'Tracing', dayBonus: 3, steps: [{ stage: 'S1' }] },
  { day: 1, kind: 'Tracing Review', dayBonus: 3, steps: [{ stage: 'S1' }] },
  { day: 2, kind: 'Fill in the Blanks', dayBonus: 4, steps: [{ stage: 'S2', s2Difficulty: 0 }] },
  { day: 3, kind: 'Free Writing', dayBonus: 5, steps: [{ stage: 'S3' }], shuffleWords: true },
  { day: 4, kind: 'Mock Test', dayBonus: 5, steps: [{ stage: 'S3' }], shuffleWords: true, isMockTest: true },
];

const WEEKLY_BONUS = 100;
const PER_WORD_COINS = 20;

export function Learn({ onBack }: Props) {
  const { progress, dayDone, completeDay, setWeekAndDay } = useProgress();
  const { wallet, addCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory } = useInventory(gender);
  const { name: charName } = useCharName();
  const multiplier = 1;

  const week = getWeek(progress.currentWeek);
  const done = dayDone(progress.currentWeek);
  const todayDay = Math.max(0, Math.min(4, progress.currentDay ?? 0));

  const plan = DAY_PLANS[todayDay];
  const planLabel = `Step ${todayDay + 1} - ${plan.kind}`;

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
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [completedScreen, setCompletedScreen] = useState<null | { coins: number; bonus: number; weekly: number }>(null);
  const [jumping, setJumping] = useState(false);

  const handlePass = () => {
    // Award per-word coins, with fly animation (Super Mode = 2x)
    const perWord = PER_WORD_COINS * multiplier;
    addCoins(perWord);
    setCoinTrigger((n) => n + 1);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);

    if (idx + 1 >= sequence.length) {
      // Day complete: bonus (Super Mode doubles bonus + weekly)
      const bonus = plan.dayBonus * multiplier;
      addCoins(bonus);

      const allDoneSoFar = done.slice();
      allDoneSoFar[todayDay] = true;
      const allFive = allDoneSoFar.every((d) => d);
      const weekly = allFive ? WEEKLY_BONUS * multiplier : 0;
      if (weekly > 0) addCoins(weekly);

      completeDay(progress.currentWeek, todayDay);

      if (todayDay < 4) {
        setWeekAndDay(progress.currentWeek, todayDay + 1);
      } else {
        const idx = WEEK_IDS.indexOf(progress.currentWeek);
        const nextWeek = WEEK_IDS[idx + 1] ?? progress.currentWeek;
        setWeekAndDay(nextWeek, 0);
      }

      setCompletedScreen({ coins: sequence.length * perWord, bonus, weekly });
    } else {
      setIdx((n) => n + 1);
    }
  };

  if (completedScreen) {
    const total = completedScreen.coins + completedScreen.bonus + completedScreen.weekly;
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">🎉</div>
        <div className="text-4xl font-extrabold text-blue-700">{planLabel} Complete!</div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>

        <div className="bg-white rounded-3xl px-8 py-5 shadow-lg space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">단어 미션</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completedScreen.coins}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">데이 보너스</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completedScreen.bonus}</span>
            </div>
          </div>
          {completedScreen.weekly > 0 && (
            <div className="flex items-center justify-between gap-6 border-t pt-2 border-yellow-200">
              <span className="font-bold text-amber-700">🏆 주간 완성 보너스</span>
              <div className="flex items-center gap-1">
                <Coin size={26} />
                <span className="font-extrabold text-yellow-800">+{completedScreen.weekly}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-6 pt-2 border-t-2 border-slate-300">
            <span className="font-extrabold text-slate-800 text-lg">합계</span>
            <div className="flex items-center gap-1">
              <Coin size={32} />
              <span className="font-extrabold text-yellow-700 text-2xl">+{total}</span>
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
          🏠 홈으로
        </button>
      </div>
    );
  }

  const cur = sequence[idx];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <CoinFly triggerKey={coinTrigger} amount={PER_WORD_COINS * multiplier} />
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-blue-700 font-extrabold text-xl">{planLabel}</div>
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
