import { useMemo } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { useInventory, useProgress, useWallet } from '../lib/state';
import { getWeek } from '../data/words';

type Props = {
  onLearn: () => void;
  onShop: () => void;
  onWardrobe: () => void;
  onParent: () => void;
};

export function Home({ onLearn, onShop, onWardrobe, onParent }: Props) {
  const { progress, dayDone } = useProgress();
  const { wallet } = useWallet();
  const { inventory } = useInventory();

  const week = getWeek(progress.currentWeek);
  const done = dayDone(progress.currentWeek);
  const todayDay = useMemo(() => {
    const i = done.findIndex((d) => !d);
    return i === -1 ? 4 : i;
  }, [done]);
  const dayLabel = `Day ${todayDay + 1}`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <CoinHUD coins={wallet.coins} />
          <div className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-blue-700">
            📖 List {progress.currentWeek}
          </div>
        </div>
        <button
          onClick={onParent}
          className="bg-white rounded-2xl px-4 py-2 shadow text-slate-600 font-bold"
        >
          🔒 부모용
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <section className="bg-white/70 backdrop-blur rounded-3xl shadow-lg p-4 flex items-center justify-center min-h-[340px]">
          <Character3D equipped={inventory.equipped} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-5">
            <div className="text-slate-600 font-bold text-sm">오늘의 미션</div>
            <div className="text-3xl font-extrabold text-blue-700 my-2">{dayLabel}</div>
            <div className="flex gap-2 my-3">
              {done.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full ${d ? 'bg-green-400' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <div className="text-slate-700 text-sm">
              이번 주 단어: {week.words.map((w) => w.text).join(', ')}
            </div>
            <button
              onClick={onLearn}
              className="mt-4 w-full text-2xl font-extrabold bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 shadow-lg"
            >
              ▶ 오늘 학습 시작
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onShop}
              className="bg-yellow-300 hover:bg-yellow-400 active:scale-95 rounded-3xl py-6 shadow-lg text-2xl font-extrabold text-yellow-900"
            >
              🛒 상점
            </button>
            <button
              onClick={onWardrobe}
              className="bg-pink-300 hover:bg-pink-400 active:scale-95 rounded-3xl py-6 shadow-lg text-2xl font-extrabold text-pink-900"
            >
              🎒 옷장
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
