import { useMemo, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { CoinFly } from '../components/CoinFly';
import { WordStage, type Stage } from '../components/WordStage';
import { Character3D } from '../components/Character3D';
import { Coin } from '../components/Coin';
import { useInventory, useProgress, useWallet } from '../lib/state';
import { subListLabel, subListWords } from '../data/words';
import { shuffle } from '../lib/shuffle';

type Props = {
  onBack: () => void;
};

type ActivityPlan = {
  activity: number;
  kind: string;
  /** Bonus coins on activity completion (per-word coins are awarded separately, 1 each) */
  activityBonus: number;
  steps: { stage: Stage; s2Difficulty?: 0 | 1 }[];
  shuffleWords?: boolean;
  isMockTest?: boolean;
};

const ACTIVITY_PLANS: ActivityPlan[] = [
  { activity: 0, kind: '따라쓰기', activityBonus: 3, steps: [{ stage: 'S1' }] },
  { activity: 1, kind: '따라쓰기 복습', activityBonus: 3, steps: [{ stage: 'S1' }] },
  { activity: 2, kind: '빈칸 채우기', activityBonus: 4, steps: [{ stage: 'S2', s2Difficulty: 0 }] },
  { activity: 3, kind: '자유 쓰기 연습', activityBonus: 5, steps: [{ stage: 'S3' }], shuffleWords: true },
  { activity: 4, kind: '모의 시험', activityBonus: 5, steps: [{ stage: 'S3' }], shuffleWords: true, isMockTest: true },
];

const SUBLIST_BONUS = 20;

export function Learn({ onBack }: Props) {
  const { progress, subListDone, completeActivity } = useProgress();
  const { wallet, addCoins } = useWallet();
  const { inventory } = useInventory();

  const half = progress.currentSubList;
  const activityIdx = Math.max(0, Math.min(4, progress.currentActivity ?? 0));
  const words = subListWords(progress.currentWeek, half);
  const done = subListDone(progress.currentWeek, half);

  const plan = ACTIVITY_PLANS[activityIdx];
  const planLabel = `${subListLabel(progress.currentWeek, half)} — ${plan.kind}`;

  const sequence = useMemo(() => {
    const seq: { word: string; stage: Stage; s2Difficulty?: 0 | 1 }[] = [];
    plan.steps.forEach((step) => {
      const list = plan.shuffleWords
        ? shuffle(words.map((w) => w.text))
        : words.map((w) => w.text);
      list.forEach((word) => {
        seq.push({ word, stage: step.stage, s2Difficulty: step.s2Difficulty });
      });
    });
    return seq;
  }, [plan, words]);

  const [idx, setIdx] = useState(0);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [completedScreen, setCompletedScreen] = useState<null | { coins: number; bonus: number; sublist: number }>(null);
  const [jumping, setJumping] = useState(false);

  const handlePass = () => {
    addCoins(1);
    setCoinTrigger((n) => n + 1);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);

    if (idx + 1 >= sequence.length) {
      const bonus = plan.activityBonus;
      addCoins(bonus);

      const allDoneSoFar = done.slice();
      allDoneSoFar[activityIdx] = true;
      const allFive = allDoneSoFar.every((d) => d);
      const sublist = allFive ? SUBLIST_BONUS : 0;
      if (sublist > 0) addCoins(sublist);

      completeActivity(progress.currentWeek, half, activityIdx);
      setCompletedScreen({ coins: sequence.length, bonus, sublist });
    } else {
      setIdx((n) => n + 1);
    }
  };

  if (completedScreen) {
    const total = completedScreen.coins + completedScreen.bonus + completedScreen.sublist;
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">🎉</div>
        <div className="text-4xl font-extrabold text-blue-700">{planLabel} 완료!</div>
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
            <span className="font-bold text-slate-700">활동 보너스</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completedScreen.bonus}</span>
            </div>
          </div>
          {completedScreen.sublist > 0 && (
            <div className="flex items-center justify-between gap-6 border-t pt-2 border-yellow-200">
              <span className="font-bold text-amber-700">🏆 서브리스트 완성 보너스</span>
              <div className="flex items-center gap-1">
                <Coin size={26} />
                <span className="font-extrabold text-yellow-800">+{completedScreen.sublist}</span>
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
      <CoinFly triggerKey={coinTrigger} />
      <header className="flex items-center justify-between p-4">
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
