import { useRef, useState } from 'react';
import { Character3D, type CharacterExporter } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import {
  useAppMode,
  useCharGender,
  useCharName,
  useInventory,
  useProgress,
  useShowTellScript,
  useWallet,
} from '../lib/state';
import { getWeek, LIST_LABEL } from '../data/words';
import { getShowTellScript, groupShowTellByMonth } from '../data/showTell';
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
  onShowTell: () => void;
  onShop: () => void;
  onWardrobe: () => void;
  onList: () => void;
};

export function Home({ onLearn, onShowTell, onShop, onWardrobe, onList }: Props) {
  const { progress, dayDone } = useProgress();
  const { wallet } = useWallet();
  const { name, setName } = useCharName();
  const { gender, setGender } = useCharGender();
  const { inventory, addItem, equip } = useInventory(gender);
  const { mode, setMode } = useAppMode();
  const { scriptId, setScriptId } = useShowTellScript();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [editingGender, setEditingGender] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [scriptMenuOpen, setScriptMenuOpen] = useState(false);
  const exporterRef = useRef<CharacterExporter | null>(null);
  const exportFilename = `character-${(name || 'unnamed').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24)}.ply`;

  const script = getShowTellScript(scriptId);
  const scriptGroups = groupShowTellByMonth();

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
          {mode === 'sight' && (
            <button
              onClick={onList}
              className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-blue-700 active:scale-95 hover:bg-blue-50 transition"
            >
              📖 {LIST_LABEL[progress.currentWeek]} ▾
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setModeMenuOpen((v) => !v)}
              className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700 active:scale-95 hover:bg-blue-50 transition"
              title="Choose learning track"
            >
              {mode === 'sight' ? '📚 Sight Word' : '🎤 Show and Tell'} ▾
            </button>
            {modeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setModeMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1 z-50 w-44 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                  <button
                    onClick={() => {
                      setMode('sight');
                      setModeMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 font-bold active:scale-95 transition ${
                      mode === 'sight'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    📚 Sight Word
                  </button>
                  <button
                    onClick={() => {
                      setMode('showtell');
                      setModeMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 font-bold active:scale-95 transition ${
                      mode === 'showtell'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    🎤 Show and Tell
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={openNameModal}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700 active:scale-95 hover:bg-blue-50 transition"
            title="Set Character Name"
          >
            ✏️ Set Character Name
          </button>
          <button
            onClick={() => setEditingGender(true)}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700 active:scale-95 hover:bg-blue-50 transition"
            title="Character Gender"
          >
            {gender === 'girl' ? '👧' : '🧒'} Character Gender
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
        <section className="bg-white/70 backdrop-blur rounded-3xl shadow-lg p-4 flex flex-col items-center justify-center min-h-[340px]">
          <div className="w-full max-w-[420px] aspect-square mx-auto">
            <Character3D
              equipped={inventory.equipped}
              name={name}
              gender={gender}
              exporterRef={exporterRef}
            />
          </div>
          <button
            onClick={() => exporterRef.current?.exportPLY(exportFilename)}
            className="mt-3 bg-white hover:bg-emerald-50 active:scale-95 rounded-2xl px-4 py-2 shadow font-bold text-emerald-700 border-2 border-emerald-300 transition flex items-center gap-2"
            title="Save current character as a PLY file for 3D printing"
          >
            📦 Export File (.ply)
          </button>
          <div className="mt-2 text-xs font-bold text-slate-500 bg-white/80 rounded-full px-3 py-1 shadow pointer-events-none">
            👆 Drag the character to spin
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {mode === 'sight' ? (
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-5">
              <div className="text-slate-600 font-bold text-sm">
                Current: {currentLabel} - Step {currentDay + 1}
              </div>
              <div className="text-2xl font-extrabold text-blue-700 my-2">
                Which LIST shall we study?
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
                {currentLabel} words: {week.words.map((w) => w.text).join(', ')}
              </div>
              <button
                onClick={onLearn}
                className="mt-4 w-full text-2xl font-extrabold bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 shadow-lg"
              >
                ▶ Continue {currentLabel} Step {currentDay + 1}
              </button>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-slate-600 font-bold text-sm">
                  {script.month ? `${script.month} · ` : ''}Today's Talk ({script.titleKo})
                </div>
                <div className="relative">
                  <button
                    onClick={() => setScriptMenuOpen((v) => !v)}
                    className="bg-white rounded-xl px-3 py-1 shadow font-bold text-blue-700 text-sm active:scale-95 hover:bg-blue-50 transition border border-blue-100"
                  >
                    Change ▾
                  </button>
                  {scriptMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setScriptMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 z-50 w-64 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100">
                        {scriptGroups.map((group) => (
                          <div key={group.month}>
                            <div className="sticky top-0 px-4 py-1.5 bg-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                              {group.month}
                            </div>
                            {group.scripts.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setScriptId(s.id);
                                  setScriptMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 font-bold active:scale-95 transition ${
                                  s.id === scriptId
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-700 hover:bg-blue-50'
                                }`}
                              >
                                {s.emoji} {s.title}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-blue-700 my-2">
                {script.emoji} {script.title}
              </div>
              <ol className="text-slate-700 text-base space-y-1 my-3 list-decimal list-inside">
                {script.sentences.map((s, i) => (
                  <li key={i} className="leading-snug">
                    {s.split('___').map((part, j, arr) => (
                      <span key={j}>
                        {part}
                        {j < arr.length - 1 && (
                          <span className="inline-block min-w-[3rem] border-b-2 border-slate-400 mx-1 align-middle" />
                        )}
                      </span>
                    ))}
                  </li>
                ))}
              </ol>
              <button
                onClick={onShowTell}
                className="mt-2 w-full text-2xl font-extrabold bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl py-4 shadow-lg"
              >
                ▶ Start Practice
              </button>
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onShop}
              className="bg-yellow-300 hover:bg-yellow-400 active:scale-95 rounded-3xl py-6 shadow-lg text-2xl font-extrabold text-yellow-900"
            >
              🛒 Shop
            </button>
            <button
              onClick={onWardrobe}
              className="bg-pink-300 hover:bg-pink-400 active:scale-95 rounded-3xl py-6 shadow-lg text-2xl font-extrabold text-pink-900"
            >
              🎒 Wardrobe
            </button>
          </div>
        </section>
      </main>

      {editingGender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-xl font-extrabold text-slate-800 mb-1">
              Character Gender
            </div>
            <div className="text-sm text-slate-500 mb-4">
              Picking one will auto-add matching items to your wardrobe.
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
                Girl
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
                Boy
              </button>
            </div>
            <button
              onClick={() => setEditingGender(false)}
              className="mt-4 w-full bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-xl py-2 font-bold text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-xl font-extrabold text-slate-800 mb-3">
              ✏️ Set Character Name
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
              placeholder="Character name (up to 16 chars)"
              className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-lg font-bold focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingName(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 active:scale-95 rounded-xl py-2 font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveName}
                className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-xl py-2 font-bold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
