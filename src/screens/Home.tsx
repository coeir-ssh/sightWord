import { useState } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { useCharName, useInventory, useProgress, useWallet } from '../lib/state';
import { getWeek, LIST_LABEL } from '../data/words';

type Props = {
  onLearn: () => void;
  onShop: () => void;
  onWardrobe: () => void;
  onList: () => void;
};

export function Home({ onLearn, onShop, onWardrobe, onList }: Props) {
  const { progress, dayDone } = useProgress();
  const { wallet } = useWallet();
  const { inventory } = useInventory();
  const { name, setName } = useCharName();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const week = getWeek(progress.currentWeek);
  const done = dayDone(progress.currentWeek);
  const currentDay = Math.max(0, Math.min(4, progress.currentDay ?? 0));
  const currentLabel = LIST_LABEL[progress.currentWeek];

  const openNameModal = () => {
    setDraftName(name);
    setEditingName(true);
  };
  const saveName = () => {
    setName(draftName.trim().slice(0, 16));
    setEditingName(false);
  };

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
            onClick={openNameModal}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700 active:scale-95 hover:bg-blue-50 transition"
            title="캐릭터 이름 입력"
          >
            ✏️ 캐릭터 이름 입력
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <section className="bg-white/70 backdrop-blur rounded-3xl shadow-lg p-4 flex flex-col items-center justify-center min-h-[340px] relative">
          <div className="w-full max-w-[420px] aspect-square mx-auto">
            <Character3D equipped={inventory.equipped} name={name} />
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500 bg-white/80 rounded-full px-3 py-1 shadow pointer-events-none">
            👆 캐릭터를 끌어서 돌려보세요
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-5">
            <div className="text-slate-600 font-bold text-sm">
              현재 선택: {currentLabel} - {currentDay + 1}단계
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
              {currentLabel} 단어: {week.words.map((w) => w.text).join(', ')}
            </div>
            <button
              onClick={onLearn}
              className="mt-4 w-full text-2xl font-extrabold bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 shadow-lg"
            >
              ▶ {currentLabel} {currentDay + 1}단계 이어서 하기
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

      {editingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-xl font-extrabold text-slate-800 mb-3">
              ✏️ 캐릭터 이름 입력
            </div>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              maxLength={16}
              placeholder="캐릭터 이름 (최대 16자)"
              className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingName(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-xl py-2 font-bold text-slate-700"
              >
                취소
              </button>
              <button
                onClick={saveName}
                className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-xl py-2 font-bold text-white"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
