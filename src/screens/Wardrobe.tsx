import { Character3D } from '../components/Character3D';
import { CoinHUD } from '../components/CoinHUD';
import { ItemTile } from '../components/ItemTile';
import { getItem, ITEMS, SLOT_LABEL, SLOT_ORDER, type Slot } from '../data/items';
import { useCharName, useInventory, useWallet } from '../lib/state';

type Props = { onBack: () => void };

export function Wardrobe({ onBack }: Props) {
  const { wallet } = useWallet();
  const { inventory, equip, unequip } = useInventory();
  const { name: charName } = useCharName();

  const toggle = (slot: Slot, id: string) => {
    if (inventory.equipped[slot] === id) {
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

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4">
        <aside className="bg-white rounded-3xl shadow-lg border-2 border-white p-4 sticky top-4 self-start flex flex-col items-stretch">
          <div className="text-center text-sm font-extrabold text-pink-700 mb-2">
            👀 미리보기 (실시간)
          </div>
          <div className="bg-white rounded-2xl border-2 border-slate-100 w-full max-w-[360px] aspect-square mx-auto overflow-hidden">
            <Character3D equipped={inventory.equipped} name={charName} />
          </div>
          <div className="text-center text-xs text-slate-500 mt-2">
            아이템을 누르면 바로 반영돼요
          </div>
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
                {inventory.equipped[slot] && getItem(inventory.equipped[slot]) ? (
                  <div className="text-sm text-slate-500 mt-2">
                    현재 장착: {getItem(inventory.equipped[slot])!.name}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 mt-2">
                    {slot === 'top'
                      ? '상의 미착용 — 런닝만 입고 있어요'
                      : slot === 'bottom'
                        ? '하의 미착용 — 팬티만 입고 있어요'
                        : '미착용'}
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
