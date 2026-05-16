import type { Item } from '../data/items';
import { Coin } from './Coin';
import { TileIcon } from './TileIcon';

type Props = {
  item: Item;
  state: 'shop' | 'wardrobe';
  owned: boolean;
  equipped: boolean;
  canAfford?: boolean;
  onAction: () => void;
};

export function ItemTile({ item, state, owned, equipped, canAfford, onAction }: Props) {
  const disabled =
    state === 'shop' ? owned || !canAfford : false;

  const bg = equipped
    ? 'bg-green-100 border-green-400'
    : owned
      ? 'bg-blue-50 border-blue-300'
      : 'bg-white border-slate-200';

  const renderShopLabel = () => {
    if (owned) return <span>보유 중</span>;
    return (
      <span className="flex items-center gap-1">
        <Coin size={20} />
        <span className="font-extrabold text-yellow-700">
          {item.price}
        </span>
      </span>
    );
  };

  return (
    <div className={`rounded-2xl border-4 ${bg} p-4 flex flex-col items-center gap-3 shadow`}>
      <TileIcon item={item} />

      <div className="font-bold text-slate-800 text-center">{item.name}</div>
      <button
        onClick={onAction}
        disabled={disabled}
        className={`px-4 py-2 rounded-xl font-bold shadow transition flex items-center gap-1 ${
          state === 'shop'
            ? owned
              ? 'bg-slate-300 text-white cursor-not-allowed'
              : canAfford
                ? 'bg-gradient-to-b from-yellow-200 to-yellow-400 border-2 border-yellow-500 text-yellow-900 hover:from-yellow-300 hover:to-yellow-500 active:scale-95'
                : 'bg-slate-200 border-2 border-slate-300 text-slate-500 cursor-not-allowed'
            : equipped
              ? 'bg-green-500 hover:bg-green-600 active:scale-95 text-white'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95 text-white'
        }`}
      >
        {state === 'shop'
          ? renderShopLabel()
          : equipped
            ? '장착 중'
            : '장착하기'}
      </button>
    </div>
  );
}
