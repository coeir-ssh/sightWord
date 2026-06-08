import { useState } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import {
  useCharGender,
  useCharName,
  useInventory,
  useProgress,
  useWallet,
} from '../lib/state';
import { getWeek, LIST_LABEL } from '../data/words';
import type { CharGender, Slot } from '../data/items';
import { storage } from '../lib/storage';

// Curated 3-per-slot bundles applied when the user picks a gender so the
// character immediately reads as that gender. Items are added to inventory
// (kept forever) and the first id in each slot is equipped.
const GENDER_BUNDLES: Record<CharGender, Partial<Record<Slot, string[]>>> = {
  girl: {
    top: [
      // 공주풍 3종 — 처음 선택되는 핑크 공주 드레스로 즉시 공주 차림
      'top.princess_pink',
      'top.princess_snow',
      'top.princess_gold',
      // 캐주얼 3종
      'top.pink_tee',
      'top.purple_star',
      'top.basic_white',
    ],
    bottom: [
      'bottom.princess_pink',
      'bottom.princess_snow',
      'bottom.tutu',
      'bottom.pink_skirt',
      'bottom.shorts',
      'bottom.plaid',
    ],
    hat: [
      'hat.tiara',
      'hat.princess_crown',
      'hat.flower_crown',
      'hat.beanie_pink',
      'hat.crown',
      'hat.sun',
    ],
    back: [
      'back.fairy_wings',
      'back.butterfly',
      'back.princess_cape',
      'back.kinder',
      'back.angel_wings',
      'back.star_wings',
    ],
    shoes: [
      'shoes.glass_slipper',
      'shoes.ballet',
      'shoes.ribbon_heel',
      'shoes.pink',
      'shoes.sandals',
      'shoes.snow',
    ],
    charm: [
      'charm.wand',
      'charm.ribbon',
      'charm.rose',
      'charm.heart',
      'charm.star',
      'charm.cherry',
    ],
  },
  boy: {
    top: ['top.red_hoodie', 'top.blue_stripe', 'top.basic_white'],
    bottom: ['bottom.jeans', 'bottom.shorts', 'bottom.green_track'],
    hat: ['hat.cap', 'hat.cap_blue', 'hat.cowboy'],
    back: ['back.backpack', 'back.jet_pack', 'back.cape_red'],
    shoes: ['shoes.sneakers', 'shoes.boots', 'shoes.red_sport'],
    charm: ['charm.star', 'charm.lightning', 'charm.coin'],
  },
};

type Props = {
  onLearn: () => void;
  onShop: () => void;
  onWardrobe: () => void;
  onList: () => void;
};

export function Home({ onLearn, onShop, onWardrobe, onList }: Props) {
  const { progress, dayDone } = useProgress();
  const { wallet } = useWallet();
  const { name, setName } = useCharName();
  const { gender, setGender } = useCharGender();
  const { inventory, addItem, equip } = useInventory(gender);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [editingGender, setEditingGender] = useState(false);

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

  const pickGender = (g: CharGender) => {
    setGender(g);
    // Seed the bundle only on the first pick for this gender. Re-picking
    // later just switches the active character without overwriting items
    // they've equipped or items they bought in the shop afterwards.
    const targetInv = storage.loadInventories()[g];
    if (targetInv.owned.length === 0) {
      const bundle = GENDER_BUNDLES[g];
      (Object.keys(bundle) as Slot[]).forEach((slot) => {
        const ids = bundle[slot] ?? [];
        ids.forEach((id) => addItem(id, g));
        if (ids[0]) equip(slot, ids[0], g);
      });
    }
    setEditingGender(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 flex-wrap gap-2 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
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
          <button
            onClick={() => setEditingGender(true)}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700 active:scale-95 hover:bg-blue-50 transition"
            title="캐릭터 성별"
          >
            {gender === 'girl' ? '👧' : '🧒'} 캐릭터 성별
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <section className="bg-white/70 backdrop-blur rounded-3xl shadow-lg p-4 flex flex-col items-center justify-center min-h-[340px]">
          <div className="w-full max-w-[420px] aspect-square mx-auto">
            <Character3D equipped={inventory.equipped} name={name} gender={gender} />
          </div>
          <div className="mt-3 text-xs font-bold text-slate-500 bg-white/80 rounded-full px-3 py-1 shadow pointer-events-none">
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

      {editingGender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-xl font-extrabold text-slate-800 mb-1">
              캐릭터 성별
            </div>
            <div className="text-sm text-slate-500 mb-4">
              선택하면 어울리는 아이템이 자동으로 옷장에 추가돼요.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => pickGender('girl')}
                className={`rounded-2xl py-5 font-extrabold text-lg active:scale-95 border-4 transition ${
                  gender === 'girl'
                    ? 'bg-pink-200 border-pink-400 text-pink-900'
                    : 'bg-pink-50 border-transparent text-pink-700 hover:bg-pink-100'
                }`}
              >
                <div className="text-3xl">👧</div>
                여자
              </button>
              <button
                onClick={() => pickGender('boy')}
                className={`rounded-2xl py-5 font-extrabold text-lg active:scale-95 border-4 transition ${
                  gender === 'boy'
                    ? 'bg-sky-200 border-sky-400 text-sky-900'
                    : 'bg-sky-50 border-transparent text-sky-700 hover:bg-sky-100'
                }`}
              >
                <div className="text-3xl">🧒</div>
                남자
              </button>
            </div>
            <button
              onClick={() => setEditingGender(false)}
              className="mt-4 w-full bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-xl py-2 font-bold text-slate-700"
            >
              닫기
            </button>
          </div>
        </div>
      )}

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
