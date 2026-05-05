import { useEffect, useRef, useState } from 'react';
import { Coin } from './Coin';

type Props = { coins: number };

export function CoinHUD({ coins }: Props) {
  const prevRef = useRef(coins);
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    if (coins > prevRef.current) {
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 350);
      return () => clearTimeout(t);
    }
    prevRef.current = coins;
  }, [coins]);

  return (
    <div
      className={`flex items-center gap-2 bg-gradient-to-b from-yellow-50 to-yellow-200 border-2 border-yellow-400 px-4 py-2 rounded-2xl shadow transition-transform ${
        bumping ? 'scale-110' : 'scale-100'
      }`}
    >
      <Coin size={32} />
      <span className="text-2xl font-extrabold text-yellow-800 tabular-nums">{coins}</span>
    </div>
  );
}
