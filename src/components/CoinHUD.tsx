type Props = { coins: number };

export function CoinHUD({ coins }: Props) {
  return (
    <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-300 px-4 py-2 rounded-2xl shadow">
      <span className="text-2xl">🪙</span>
      <span className="text-2xl font-bold text-yellow-800 tabular-nums">{coins}</span>
    </div>
  );
}
