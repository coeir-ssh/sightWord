import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { drawTemplate, scoreLetterSlot, type ScoreResult } from '../lib/scoring';

export type LetterSlotHandle = {
  /** Returns null for non-interactive (shown) slots. */
  check: () => ScoreResult | null;
  clear: () => void;
  reset: () => void;
  isInteractive: () => boolean;
};

export type SlotVariant = 'guide' | 'shown' | 'hidden';

type Props = {
  letter: string;
  variant: SlotVariant;
  width?: number;
  height?: number;
};

export const LetterSlot = forwardRef<LetterSlotHandle, Props>(function LetterSlot(
  { letter, variant, width = 110, height = 150 },
  ref
) {
  const penRef = useRef<PenCanvasHandle | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const [passed, setPassed] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'fail'>('idle');

  useImperativeHandle(ref, () => ({
    check: () => {
      if (variant === 'shown') return null;
      const cv = penRef.current?.canvas();
      if (!cv) return { ratio: 0, pass: false };
      if (!penRef.current?.hasInk()) {
        setFeedback('fail');
        return { ratio: 0, pass: false };
      }
      const result = scoreLetterSlot(cv, letter);
      if (result.pass) {
        setPassed(true);
        setFeedback('idle');
      } else {
        setFeedback('fail');
      }
      return result;
    },
    clear: () => {
      penRef.current?.clear();
      setFeedback('idle');
    },
    reset: () => {
      penRef.current?.clear();
      setPassed(false);
      setFeedback('idle');
    },
    isInteractive: () => variant !== 'shown',
  }));

  useEffect(() => {
    const cv = guideRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (variant === 'guide') {
      // Trace guide: same template as scorer, soft gray
      drawTemplate(ctx, letter, cv.width, cv.height, {
        fillStyle: 'rgba(148, 163, 184, 0.55)',
        strokeScale: 0.12,
      });
    } else if (variant === 'shown') {
      // Hint letter shown to the kid: clean letter shape, no fat outline
      drawTemplate(ctx, letter, cv.width, cv.height, {
        fillStyle: '#1d4ed8',
        strokeScale: 0,
      });
    }
  }, [letter, variant, width, height]);

  const interactive = variant !== 'shown';

  const borderColor = passed
    ? 'border-green-400'
    : feedback === 'fail'
      ? 'border-red-400'
      : 'border-slate-300';
  const bg = passed ? 'bg-green-50' : 'bg-white';

  return (
    <div
      className={`relative rounded-2xl border-4 ${borderColor} ${bg} shadow-sm overflow-hidden`}
      style={{ width, height }}
    >
      <canvas
        ref={guideRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      {interactive && (
        <PenCanvas
          ref={penRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full"
        />
      )}
      {passed && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow">
          ✓
        </div>
      )}
    </div>
  );
});
