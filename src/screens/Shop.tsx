import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import { ITEMS, SLOT_LABEL, SLOT_ORDER, type Slot } from '../data/items';
import { useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Shop({ onBack }: Props) {
  const { wallet, spendCoins } = useWallet();
  const { inventory, addItem } = useInventory();

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
      <header className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-yellow-900 font-extrabold text-3xl">🛒 상점</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <main className="flex-1 p-4 space-y-6">
        {SLOT_ORDER.map((slot: Slot) => (
          <section key={slot} className="bg-white/70 backdrop-blur rounded-3xl shadow p-4">
            <div className="text-xl font-extrabold text-slate-700 mb-3">{SLOT_LABEL[slot]}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ITEMS.filter((i) => i.slot === slot).map((item) => (
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
      </main>
    </div>
  );
}
