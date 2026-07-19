import { useState } from 'react';
import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import {
  categoryOf,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  itemsForGender,
  SLOT_LABEL,
  SLOT_ORDER,
  type Category,
  type Slot,
} from '../data/items';
import { useCharGender, useCharName, useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Shop({ onBack }: Props) {
  const { wallet, spendCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory, addItem } = useInventory(gender);
  const { name: charName } = useCharName();
  const visibleItems = itemsForGender(gender);
  const [tab, setTab] = useState<Category>('basic');

  const buy = (id: string, price: number) => {
    if (inventory.owned.includes(id)) return;
    if (price === 0) {
      addItem(id);
      return;
    }
    if (spendCoins(price)) {
      addItem(id);
    }
  };

  const tabItems = visibleItems.filter((i) => categoryOf(i) === tab);
  // Only show tabs that actually have at least one visible item, so the
  // Princess tab hides on the boy and vice-versa without needing hard-coded
  // gender rules.
  const availableTabs = CATEGORY_ORDER.filter((c) =>
    visibleItems.some((i) => categoryOf(i) === c)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-200 flex flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-yellow-100 to-yellow-100/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="text-yellow-900 font-extrabold text-3xl">
          🛒 Shop
          <span className="ml-2 align-middle text-base font-bold bg-white/80 text-slate-700 rounded-full px-2 py-0.5">
            {gender === 'girl' ? '👧 Girl' : '🧒 Boy'}
          </span>
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <aside className="sticky top-2 z-30 self-start bg-white/95 backdrop-blur rounded-3xl shadow-lg border-2 border-white p-3 flex flex-col items-stretch w-full lg:w-[320px] mx-auto lg:mx-0">
          <div className="text-center text-xs font-extrabold text-yellow-700 mb-1">
            👀 Preview
          </div>
          <div className="bg-white rounded-2xl border-2 border-slate-100 w-[280px] aspect-square mx-auto overflow-hidden">
            <Character3D equipped={inventory.equipped} name={charName} gender={gender} />
          </div>
          <div className="hidden lg:block text-center text-xs text-slate-500 mt-2">
            Drag to spin · Pick an item to buy
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-4">
          {/* Category tab bar */}
          <div className="sticky top-20 z-20 flex flex-wrap gap-2 bg-white/85 backdrop-blur rounded-2xl shadow p-2">
            {availableTabs.map((c) => {
              const active = c === tab;
              return (
                <button
                  key={c}
                  onClick={() => setTab(c)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-extrabold border-2 transition ${
                    active
                      ? 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow'
                      : 'bg-white border-transparent text-slate-600 hover:bg-yellow-50'
                  }`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {SLOT_ORDER.map((slot: Slot) => {
              const slotItems = tabItems.filter((i) => i.slot === slot);
              if (slotItems.length === 0) return null;
              return (
                <section key={slot} className="bg-white/70 backdrop-blur rounded-3xl shadow p-4">
                  <div className="text-xl font-extrabold text-slate-700 mb-3">{SLOT_LABEL[slot]}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {slotItems.map((item) => (
                      <ItemTile
                        key={item.id}
                        item={item}
                        state="shop"
                        owned={inventory.owned.includes(item.id)}
                        equipped={inventory.equipped[slot] === item.id}
                        canAfford={wallet.coins >= item.price}
                        onAction={() => buy(item.id, item.price)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
