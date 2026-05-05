import { useImperativeHandle, useRef, forwardRef } from 'react';
import { LetterSlot, type LetterSlotHandle, type SlotVariant } from './LetterSlot';
import type { ScoreResult } from '../lib/scoring';
import { PASS_RATIO } from '../lib/scoring';

export type WordRowHandle = {
  /** Returns aggregate {ratio, pass} across interactive slots only. */
  checkAll: () => ScoreResult;
  clearAll: () => void;
  resetAll: () => void;
};

type Props = {
  word: string;
  variants: SlotVariant[];
};

export const WordRow = forwardRef<WordRowHandle, Props>(function WordRow({ word, variants }, ref) {
  const slotRefs = useRef<Array<LetterSlotHandle | null>>([]);

  useImperativeHandle(ref, () => ({
    checkAll: () => {
      const ratios: number[] = [];
      let allPass = true;
      slotRefs.current.forEach((s) => {
        if (!s) return;
        const r = s.check();
        if (r === null) return; // shown slot, skip
        ratios.push(r.ratio);
        if (!r.pass) allPass = false;
      });
      const avg = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
      return { ratio: avg, pass: allPass && avg >= PASS_RATIO };
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
