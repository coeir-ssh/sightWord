import { useImperativeHandle, useRef, forwardRef, useState, useCallback } from 'react';
import { LetterSlot, type LetterSlotHandle, type SlotVariant } from './LetterSlot';
import { PASS_RATIO } from '../lib/scoring';

export type WordRowHandle = {
  resetAll: () => void;
};

type Props = {
  word: string;
  variants: SlotVariant[];
  /** Average coverage across interactive slots (0..1) */
  onAggregateChange?: (avg: number, allPass: boolean) => void;
};

export const WordRow = forwardRef<WordRowHandle, Props>(function WordRow(
  { word, variants, onAggregateChange },
  ref
) {
  const slotRefs = useRef<Array<LetterSlotHandle | null>>([]);
  const interactiveCountRef = useRef(0);
  const coveragesRef = useRef<Record<number, number>>({});
  const [, force] = useState(0);

  // Recompute interactive count when variants change
  if (interactiveCountRef.current !== variants.filter((v) => v !== 'shown').length) {
    interactiveCountRef.current = variants.filter((v) => v !== 'shown').length;
  }

  const reportAggregate = useCallback(() => {
    const interactiveIndices = variants
      .map((v, i) => (v !== 'shown' ? i : -1))
      .filter((i) => i >= 0);
    if (interactiveIndices.length === 0) {
      onAggregateChange?.(1, true);
      return;
    }
    let sum = 0;
    let allPass = true;
    for (const i of interactiveIndices) {
      const c = coveragesRef.current[i] ?? 0;
      sum += c;
      if (c < PASS_RATIO) allPass = false;
    }
    onAggregateChange?.(sum / interactiveIndices.length, allPass);
  }, [variants, onAggregateChange]);

  useImperativeHandle(ref, () => ({
    resetAll: () => {
      slotRefs.current.forEach((s) => s?.reset());
      coveragesRef.current = {};
      reportAggregate();
      force((n) => n + 1);
    },
  }));

  const handleCoverage = (i: number) => (cov: number) => {
    coveragesRef.current[i] = cov;
    reportAggregate();
  };

  const letters = word.split('');

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {letters.map((ch, i) => (
        <LetterSlot
          key={`${ch}-${i}`}
          letter={ch}
          variant={variants[i] ?? 'hidden'}
          onCoverageChange={handleCoverage(i)}
          ref={(el) => {
            slotRefs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
});
