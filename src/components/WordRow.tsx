import { useImperativeHandle, useRef, forwardRef } from 'react';
import { LetterSlot, type LetterSlotHandle, type SlotVariant } from './LetterSlot';

export type WordRowHandle = {
  checkAll: () => boolean;
  clearAll: () => void;
  resetAll: () => void;
};

type Props = {
  word: string;
  /** per-letter variant: 'guide' | 'shown' | 'hidden' */
  variants: SlotVariant[];
};

export const WordRow = forwardRef<WordRowHandle, Props>(function WordRow({ word, variants }, ref) {
  const slotRefs = useRef<Array<LetterSlotHandle | null>>([]);

  useImperativeHandle(ref, () => ({
    checkAll: () => {
      let ok = true;
      slotRefs.current.forEach((s) => {
        if (!s) return;
        const r = s.check();
        if (!r) ok = false;
      });
      return ok;
    },
    clearAll: () => slotRefs.current.forEach((s) => s?.clear()),
    resetAll: () => slotRefs.current.forEach((s) => s?.reset()),
  }));

  const letters = word.split('');

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {letters.map((ch, i) => (
        <LetterSlot
          key={`${ch}-${i}`}
          letter={ch}
          variant={variants[i] ?? 'hidden'}
          ref={(el) => {
            slotRefs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
});
