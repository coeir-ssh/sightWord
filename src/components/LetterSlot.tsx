import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { drawTemplate, scoreLetterSlot, PASS_RATIO } from '../lib/scoring';
import { speakLetter } from '../lib/tts';

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
  // Whether we've already spoken the letter name for the current pass.
  // Reset on letter/variant change and on an explicit retry so re-passing
  // announces again, but a second stroke on an already-green slot doesn't.
  const announcedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    reset: () => {
      penRef.current?.clear();
      if (variant !== 'shown') {
        setCoverage(0);
        onCoverageChange?.(0);
        announcedRef.current = false;
      }
    },
    isInteractive: () => variant !== 'shown',
    getCoverage: () => coverage,
  }));

  // Reset coverage when letter/variant changes
  useEffect(() => {
    announcedRef.current = false;
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
    try {
      const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
      fonts?.ready?.then(() => {
        if (!cancelled) draw();
      }).catch(() => {});
    } catch {
      /* fonts API unavailable; fallback already rendered */
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
    // Announce the instant the slot crosses the pass mark — call it right
    // here in the pointer-up handler (still inside the user gesture, lowest
    // latency) instead of waiting for the state update + a render-cycle
    // effect. Web Audio buffer playback then fires with no perceptible lag.
    if (variant !== 'shown' && result.ratio >= PASS_RATIO && !announcedRef.current) {
      announcedRef.current = true;
      void speakLetter(letter);
    }
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
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow">
          ✓
        </div>
      )}
    </div>
  );
});
