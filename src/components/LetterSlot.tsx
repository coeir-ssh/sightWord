import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { scoreLetterSlot } from '../lib/scoring';

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

  const interactive = variant !== 'shown';
  const showTemplate = variant === 'guide' || variant === 'shown';

  const borderColor = passed
    ? 'border-green-400'
    : feedback === 'fail'
      ? 'border-red-400'
      : 'border-slate-300';
  const bg = passed ? 'bg-green-50' : 'bg-white';

  return (
    <div
      className={`relative rounded-2xl border-4 ${borderColor} ${bg} shadow-sm`}
      style={{ width, height }}
    >
      {showTemplate && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-kid font-bold"
          style={{
            color: variant === 'shown' ? '#1d4ed8' : '#cbd5e1',
            fontSize: Math.floor(height * 0.7),
            lineHeight: 1,
          }}
        >
          {letter}
        </div>
      )}
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
