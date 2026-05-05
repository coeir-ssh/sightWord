import type { Item } from '../data/items';

type Props = {
  item: Item;
  state: 'shop' | 'wardrobe';
  owned: boolean;
  equipped: boolean;
  canAfford?: boolean;
  onAction: () => void;
};

export function ItemTile({ item, state, owned, equipped, canAfford, onAction }: Props) {
  const label =
    state === 'shop'
      ? owned
        ? '보유 중'
        : `🪙 ${item.price}`
      : equipped
        ? '장착 중'
        : '장착하기';

  const disabled =
    state === 'shop' ? owned || !canAfford : false;

  const bg = equipped
    ? 'bg-green-100 border-green-400'
    : owned
      ? 'bg-blue-50 border-blue-300'
      : 'bg-white border-slate-200';

  return (
    <div className={`rounded-2xl border-4 ${bg} p-4 flex flex-col items-center gap-3 shadow`}>
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
        style={{ background: item.color }}
      >
        {item.shape === 'crown'
          ? '👑'
          : item.shape === 'wing'
            ? '🪽'
            : item.shape === 'star'
              ? '⭐'
              : item.shape === 'diamond'
                ? '💎'
                : item.slot === 'top'
                  ? '👕'
                  : item.slot === 'bottom'
                    ? '👖'
                    : item.slot === 'hat'
                      ? '🧢'
                      : item.slot === 'shoes'
                        ? '👟'
                        : item.slot === 'back'
                          ? '🎒'
                          : '🔗'}
      </div>
      <div className="font-bold text-slate-800 text-center">{item.name}</div>
      <button
        onClick={onAction}
        disabled={disabled}
        className={`px-4 py-2 rounded-xl font-bold text-white shadow transition ${
          disabled
            ? 'bg-slate-300 cursor-not-allowed'
            : equipped
              ? 'bg-green-500'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
        }`}
      >
        {label}
      </button>
    </div>
  );
}
