import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenCanvas, type PenCanvasHandle } from './PenCanvas';
import { drawTemplate, scoreLetterSlot, PASS_RATIO, getRequiredStrokes } from '../lib/scoring';
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
  // Count of completed pen strokes (pointer-down to pointer-up segments
  // with actual ink). Multi-stroke letters (f, t, i, j, k, x, y) only
  // pass after at least the required number of strokes — otherwise
  // finishing just the vertical of 't' could auto-pass before the cross
  // bar gets drawn.
  const strokeCountRef = useRef(0);

  useImperativeHandle(ref, () => ({
    reset: () => {
      penRef.current?.clear();
      if (variant !== 'shown') {
        setCoverage(0);
        onCoverageChange?.(0);
        announcedRef.current = false;
        strokeCountRef.current = 0;
      }
    },
    isInteractive: () => variant !== 'shown',
    getCoverage: () => coverage,
  }));

  // Reset coverage when letter/variant changes
  useEffect(() => {
    announcedRef.current = false;
    strokeCountRef.current = 0;
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
    strokeCountRef.current += 1;
    const result = scoreLetterSlot(cv, letter);
    // Multi-stroke letters (f, i, j, k, t, x, y) must be drawn with the
    // proper number of pen lifts in every step — including the Step 1
    // dotted trace — so the slot can't turn green after just the
    // vertical of 't' before the cross bar gets drawn.
    const requiredStrokes = getRequiredStrokes(letter);
    const enoughStrokes = strokeCountRef.current >= requiredStrokes;
    // Cap the visible ratio just below PASS_RATIO until the user has lifted
    // the pen the required number of times — keeps the slot yellow even if
    // the first stroke already covered the centerline well enough.
    const effectiveRatio = enoughStrokes
      ? result.ratio
      : Math.min(result.ratio, PASS_RATIO - 0.01);
    const effectivePass = result.pass && enoughStrokes;
    // Announcement rules differ by variant:
    //   'guide' (Step 1 + 2 tracing) — the dotted shape is right there
    //     and the child is just following it, so play the letter sound
    //     the moment they've covered the shape enough, even if multi-
    //     stroke letters like 't'/'f' still need a second pen lift for
    //     the visual green check. Otherwise the per-letter cue would
    //     stay silent through the entire tracing lesson.
    //   'hidden' (Step 3+ blanks / free writing / mock test) — the
    //     child writes from memory, so the sound should match the
    //     actual green check (all gates + required strokes).
    const shouldAnnounce =
      variant === 'guide' ? result.coverage >= PASS_RATIO : effectivePass;
    if (variant !== 'shown' && shouldAnnounce && !announcedRef.current) {
      announcedRef.current = true;
      void speakLetter(letter);
    }
    setCoverage(effectiveRatio);
    onCoverageChange?.(effectiveRatio);
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
