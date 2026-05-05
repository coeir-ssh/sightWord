import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { drawTemplate, scoreLetterSlot } from '../lib/scoring';

export type LetterSlotHandle = {
  check: () => boolean;
  clear: () => void;
  reset: () => void;
  isPassed: () => boolean;
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
      if (variant === 'shown') {
        setPassed(true);
        return true;
      }
      const cv = penRef.current?.canvas();
      if (!cv) return false;
      if (!penRef.current?.hasInk()) {
        setFeedback('fail');
        return false;
      }
      const result = scoreLetterSlot(cv, letter);
      const ok = result.pass;
      if (ok) {
        setPassed(true);
        setFeedback('idle');
      } else {
        setFeedback('fail');
      }
      return ok;
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
    isPassed: () => passed || variant === 'shown',
  }));

  // Draw the visible guide using the SAME renderer as the scoring template.
  useEffect(() => {
    const cv = guideRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (variant === 'guide') {
      drawTemplate(ctx, letter, cv.width, cv.height, {
        fillStyle: 'rgba(148, 163, 184, 0.55)', // soft gray dotted-feel
      });
    } else if (variant === 'shown') {
      drawTemplate(ctx, letter, cv.width, cv.height, {
        fillStyle: '#1d4ed8',
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
