import { useImperativeHandle, useRef, forwardRef, useState, useCallback } from 'react';
import { LetterSlot, type LetterSlotHandle, type SlotVariant } from './LetterSlot';
import { PASS_RATIO } from '../lib/scoring';

export type WordRowHandle = {
  resetAll: () => void;
};

export type AggregateInfo = {
  /** Average coverage across interactive slots (0..1) */
  avg: number;
  /** True when every interactive slot is at or above PASS_RATIO. */
  allPass: boolean;
  /** Number of interactive slots that have passed. */
  passedCount: number;
  /** Total interactive slots. */
  total: number;
};

type Props = {
  word: string;
  variants: SlotVariant[];
  onAggregateChange?: (info: AggregateInfo) => void;
};

function slotSizeFor(length: number): { width: number; height: number } {
  // Shrink slots so the whole word fits in a single row.
  const width =
    length <= 5 ? 140 : length <= 6 ? 120 : length <= 7 ? 104 : length <= 8 ? 92 : 82;
  const height = Math.round((width * 190) / 140);
  return { width, height };
}

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
      onAggregateChange?.({ avg: 1, allPass: true, passedCount: 0, total: 0 });
      return;
    }
    let sum = 0;
    let passedCount = 0;
    for (const i of interactiveIndices) {
      const c = coveragesRef.current[i] ?? 0;
      sum += c;
      if (c >= PASS_RATIO) passedCount += 1;
    }
    onAggregateChange?.({
      avg: sum / interactiveIndices.length,
      allPass: passedCount === interactiveIndices.length,
      passedCount,
      total: interactiveIndices.length,
    });
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
  const { width, height } = slotSizeFor(letters.length);
  const gap = letters.length >= 7 ? 'gap-2' : 'gap-3';

  const resetSlot = (i: number) => {
    slotRefs.current[i]?.reset();
    delete coveragesRef.current[i];
    reportAggregate();
    force((n) => n + 1);
  };

  return (
    <div className={`flex items-start justify-center ${gap} flex-nowrap`}>
      {letters.map((ch, i) => {
        const variant = variants[i] ?? 'hidden';
        const interactive = variant !== 'shown';
        return (
          <div key={`${ch}-${i}`} className="flex flex-col items-center gap-1">
            <LetterSlot
              letter={ch}
              variant={variant}
              width={width}
              height={height}
              onCoverageChange={handleCoverage(i)}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
            />
            {interactive && (
              <button
                type="button"
                onClick={() => resetSlot(i)}
                className="text-sm font-extrabold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 rounded-full px-4 py-1.5 shadow-md transition"
              >
                ↻ Retry
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});
