import { useEffect, useState } from 'react';
import { Coin } from './Coin';

type Props = {
  /** Increment this key to trigger a new fly animation */
  triggerKey: number;
};

export function CoinFly({ triggerKey }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (triggerKey === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (!visible) return null;

  return (
    <div
      key={triggerKey}
      className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center gap-2 animate-[coinfly_1s_ease-out_forwards]"
    >
      <Coin size={64} />
      <span className="text-4xl font-extrabold text-yellow-700 drop-shadow-lg">+1</span>
    </div>
  );
}
