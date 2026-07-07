import { useState } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import {
  categoryOf,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  getItem,
  ITEMS,
  SLOT_LABEL,
  SLOT_ORDER,
  type Category,
  type Slot,
} from '../data/items';
import { useCharGender, useCharName, useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Wardrobe({ onBack }: Props) {
  const { wallet } = useWallet();
  const { gender } = useCharGender();
  const { inventory, equip, unequip } = useInventory(gender);
  const { name: charName } = useCharName();
  const [tab, setTab] = useState<Category>('basic');

  const toggle = (slot: Slot, id: string) => {
    if (inventory.equipped[slot] === id) {
      unequip(slot);
    } else {
      equip(slot, id);
    }
  };

  const ownedItems = ITEMS.filter((i) => inventory.owned.includes(i.id));
  // Only tabs the user actually owns something in
  const availableTabs = CATEGORY_ORDER.filter((c) =>
    ownedItems.some((i) => categoryOf(i) === c)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 flex flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-pink-100 to-pink-100/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="text-pink-900 font-extrabold text-3xl">
          🎒 Wardrobe
          <span className="ml-2 align-middle text-base font-bold bg-white/80 text-slate-700 rounded-full px-2 py-0.5">
            {gender === 'girl' ? '👧 Girl' : '🧒 Boy'}
          </span>
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <aside className="sticky top-2 z-30 self-start bg-white/95 backdrop-blur rounded-3xl shadow-lg border-2 border-white p-3 flex flex-col items-stretch w-full lg:w-[320px] mx-auto lg:mx-0">
          <div className="text-center text-xs font-extrabold text-pink-700 mb-1">
            👀 Preview
          </div>
          <div className="bg-white rounded-2xl border-2 border-slate-100 w-[280px] aspect-square mx-auto overflow-hidden">
            <Character3D equipped={inventory.equipped} name={charName} gender={gender} />
          </div>
          <div className="hidden lg:block text-center text-xs text-slate-500 mt-2">
            Tap an item to wear it right away
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-4">
          {/* Category tab bar */}
          {availableTabs.length > 0 && (
            <div className="sticky top-20 z-20 flex flex-wrap gap-2 bg-white/85 backdrop-blur rounded-2xl shadow p-2">
              {availableTabs.map((c) => {
                const active = c === tab;
                return (
                  <button
                    key={c}
                    onClick={() => setTab(c)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-extrabold border-2 transition ${
                      active
                        ? 'bg-pink-400 border-pink-500 text-pink-900 shadow'
                        : 'bg-white border-transparent text-slate-600 hover:bg-pink-50'
                    }`}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-6">
            {SLOT_ORDER.map((slot) => {
              const owned = ITEMS.filter(
                (i) =>
                  i.slot === slot &&
                  inventory.owned.includes(i.id) &&
                  categoryOf(i) === tab
              );
              const equippedForSlot = inventory.equipped[slot];
              const equippedItem = equippedForSlot ? getItem(equippedForSlot) : null;
              // Skip slots that have no owned items in this tab
              if (owned.length === 0) return null;
              return (
                <section key={slot} className="bg-white/70 backdrop-blur rounded-3xl shadow p-4">
                  <div className="text-xl font-extrabold text-slate-700 mb-3">
                    {SLOT_LABEL[slot]}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {owned.map((item) => (
                      <ItemTile
                        key={item.id}
                        item={item}
                        state="wardrobe"
                        owned
                        equipped={inventory.equipped[slot] === item.id}
                        onAction={() => toggle(slot, item.id)}
                      />
                    ))}
                  </div>
                  {equippedItem && (
                    <div className="text-sm text-slate-500 mt-2">
                      Currently wearing: {equippedItem.name}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
