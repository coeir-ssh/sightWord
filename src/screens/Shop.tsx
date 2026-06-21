import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import { itemsForGender, SLOT_LABEL, SLOT_ORDER, type Slot } from '../data/items';
import { useCharGender, useCharName, useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Shop({ onBack }: Props) {
  const { wallet, spendCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory, addItem } = useInventory(gender);
  const { name: charName } = useCharName();
  const visibleItems = itemsForGender(gender);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-200 flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-yellow-100 to-yellow-100/95 backdrop-blur shadow-sm">
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

        <div className="flex-1 space-y-6">
          {SLOT_ORDER.map((slot: Slot) => (
            <section key={slot} className="bg-white/70 backdrop-blur rounded-3xl shadow p-4">
              <div className="text-xl font-extrabold text-slate-700 mb-3">{SLOT_LABEL[slot]}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleItems.filter((i) => i.slot === slot).map((item) => (
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
          ))}
        </div>
      </main>
    </div>
  );
}
