import { useState } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { useInventory, useProgress, useWallet } from '../lib/state';
import { LIST_LABEL, subListLabel, subListWords } from '../data/words';
import { speak, unlockTts } from '../lib/tts';

type Props = {
  onLearn: () => void;
  onShop: () => void;
  onWardrobe: () => void;
  onParent: () => void;
  onList: () => void;
};

export function Home({ onLearn, onShop, onWardrobe, onParent, onList }: Props) {
  const { progress, subListDone } = useProgress();
  const { wallet } = useWallet();
  const { inventory } = useInventory();
  const [soundTested, setSoundTested] = useState(false);

  const testSound = () => {
    unlockTts();
    void speak('Hello, Haejun!');
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 2000);
  };

  const half = progress.currentSubList;
  const done = subListDone(progress.currentWeek, half);
  const currentSubLabel = subListLabel(progress.currentWeek, half);
  const subWords = subListWords(progress.currentWeek, half);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="flex items-center justify-between p-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <CoinHUD coins={wallet.coins} />
          <button
            onClick={onList}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-blue-700 active:scale-95 hover:bg-blue-50 transition"
          >
            📖 {LIST_LABEL[progress.currentWeek]} ▾
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={testSound}
            className={`rounded-2xl px-4 py-2 shadow font-bold transition ${
              soundTested ? 'bg-green-400 text-white' : 'bg-white text-slate-700'
            }`}
            title="사운드 테스트"
          >
            {soundTested ? '🔊 들리시나요?' : '🔊 사운드 테스트'}
          </button>
          <button
            onClick={onParent}
            className="bg-white rounded-2xl px-4 py-2 shadow text-slate-600 font-bold"
          >
            🔒 부모용
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <section className="bg-white/70 backdrop-blur rounded-3xl shadow-lg p-4 flex flex-col items-center justify-center min-h-[340px] relative">
          <Character3D equipped={inventory.equipped} />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 bg-white/80 rounded-full px-3 py-1 shadow pointer-events-none">
            👆 캐릭터를 끌어서 돌려보세요
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-5">
            <div className="text-slate-600 font-bold text-sm">
              현재 선택: {currentSubLabel}
            </div>
            <div className="text-2xl font-extrabold text-blue-700 my-2">
              어떤 LIST를 공부할까요?
            </div>
            <div className="flex gap-2 my-3">
              {done.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full ${d ? 'bg-green-400' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <div className="text-slate-700 text-sm">
              {currentSubLabel} 단어: {subWords.map((w) => w.text).join(', ')}
            </div>
            <button
              onClick={onList}
              className="mt-4 w-full text-2xl font-extrabold bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 shadow-lg"
            >
              📖 LIST 골라서 공부하기
            </button>
            <button
              onClick={onLearn}
              className="mt-2 w-full text-base font-bold bg-white hover:bg-blue-50 active:scale-95 text-blue-700 rounded-2xl py-3 shadow border border-blue-200"
            >
              ▶ {currentSubLabel} 이어서 하기
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
