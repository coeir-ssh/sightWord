import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { drawTemplate, scoreLetterSlot, PASS_RATIO } from '../lib/scoring';

export type LetterSlotHandle = {
  reset: () => void;
  isInteractive: () => boolean;
  /** Latest coverage 0..1 (1 for non-interactive shown slots). */
  getCoverage: () => number;
};

export type SlotVariant = 'guide' | 'shown' | 'hidden';

type Props = {
  letter: string;
  variant: SlotVariant;
  width?: number;
  height?: number;
  onCoverageChange?: (coverage: number) => void;
};

export const LetterSlot = forwardRef<LetterSlotHandle, Props>(function LetterSlot(
  { letter, variant, width = 140, height = 190, onCoverageChange },
  ref
) {
  const penRef = useRef<PenCanvasHandle | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const [coverage, setCoverage] = useState(variant === 'shown' ? 1 : 0);

  const passed = coverage >= PASS_RATIO || variant === 'shown';

  useImperativeHandle(ref, () => ({
    reset: () => {
      penRef.current?.clear();
      if (variant !== 'shown') {
        setCoverage(0);
        onCoverageChange?.(0);
      }
    },
    isInteractive: () => variant !== 'shown',
    getCoverage: () => coverage,
  }));

  // Reset coverage when letter/variant changes
  useEffect(() => {
    if (variant === 'shown') {
      setCoverage(1);
      onCoverageChange?.(1);
    } else {
      setCoverage(0);
      onCoverageChange?.(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, variant]);

  // Render the visible guide using the SAME drawTemplate as the scorer.
  useEffect(() => {
    const cv = guideRef.current;
    if (!cv) return;
    const draw = () => {
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (variant === 'guide') {
        drawTemplate(ctx, letter, cv.width, cv.height, {
          fillStyle: 'rgba(71, 85, 105, 0.42)',
        });
      } else if (variant === 'shown') {
        drawTemplate(ctx, letter, cv.width, cv.height, {
          fillStyle: '#1d4ed8',
        });
      }
    };
    draw();
    // Re-draw once the web font finishes loading, so the canvas matches
    // the loaded glyph instead of the fallback rendered on the first paint.
    let cancelled = false;
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) draw();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [letter, variant, width, height]);

  const handleStrokeEnd = () => {
    const cv = penRef.current?.canvas();
    if (!cv) return;
    if (!penRef.current?.hasInk()) {
      setCoverage(0);
      onCoverageChange?.(0);
      return;
    }
    const result = scoreLetterSlot(cv, letter);
    setCoverage(result.ratio);
    onCoverageChange?.(result.ratio);
  };

  const interactive = variant !== 'shown';

  const borderColor = passed
    ? 'border-green-400'
    : coverage > 0
      ? 'border-yellow-300'
      : 'border-slate-300';
  const bg = passed ? 'bg-green-50' : 'bg-white';

  return (
    <div
      className={`relative rounded-2xl border-4 ${borderColor} ${bg} shadow-sm overflow-hidden transition-colors`}
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
          onStroke={handleStrokeEnd}
        />
      )}
      {passed && interactive && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow">
          ✓
        </div>
      )}
    </div>
  );
});
