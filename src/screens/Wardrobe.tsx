import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import { getItem, ITEMS, SLOT_LABEL, SLOT_ORDER, type Slot } from '../data/items';
import { useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Wardrobe({ onBack }: Props) {
  const { wallet } = useWallet();
  const { inventory, equip, unequip } = useInventory();

  const toggle = (slot: Slot, id: string) => {
    if (inventory.equipped[slot] === id) {
      // Don't allow removing top/bottom (always must wear something)
      if (slot === 'top' || slot === 'bottom') return;
      unequip(slot);
    } else {
      equip(slot, id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-pink-900 font-extrabold text-3xl">🎒 옷장</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
        <aside className="bg-white/70 backdrop-blur rounded-3xl shadow p-4 min-h-[300px] sticky top-4 self-start">
          <Character3D equipped={inventory.equipped} />
        </aside>

        <div className="space-y-6">
          {SLOT_ORDER.map((slot) => {
            const owned = ITEMS.filter(
              (i) => i.slot === slot && inventory.owned.includes(i.id)
            );
            return (
              <section key={slot} className="bg-white/70 backdrop-blur rounded-3xl shadow p-4">
                <div className="text-xl font-extrabold text-slate-700 mb-3">
                  {SLOT_LABEL[slot]}
                </div>
                {owned.length === 0 ? (
                  <div className="text-slate-500">아직 가진 {SLOT_LABEL[slot]} 아이템이 없어요. 상점에서 사보세요! 🛒</div>
                ) : (
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
                )}
                {inventory.equipped[slot] && getItem(inventory.equipped[slot]) && (
                  <div className="text-sm text-slate-500 mt-2">
                    현재 장착: {getItem(inventory.equipped[slot])!.name}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
