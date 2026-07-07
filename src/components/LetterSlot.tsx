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
  /**
   * Fired whenever the slot's coverage/pass state changes.
   * `passing` is the authoritative pass flag — DO NOT re-derive it from
   * `coverage >= PASS_RATIO` at the call site, because the multi-stroke
   * gate deliberately clamps `coverage` below PASS_RATIO to keep the
   * yellow indicator visible even after a numerically-strong first
   * stroke. Only `passing` accounts for the stroke count.
   */
  onCoverageChange?: (coverage: number, passing: boolean) => void;
};

export const LetterSlot = forwardRef<LetterSlotHandle, Props>(function LetterSlot(
  { letter, variant, width = 140, height = 190, onCoverageChange },
  ref
) {
  const penRef = useRef<PenCanvasHandle | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const [coverage, setCoverage] = useState(variant === 'shown' ? 1 : 0);
  const [strokeCount, setStrokeCount] = useState(0);

  const passed = coverage >= PASS_RATIO || variant === 'shown';
  const requiredStrokes = getRequiredStrokes(letter);
  const needMoreStrokes = requiredStrokes > 1 && strokeCount > 0 && strokeCount < requiredStrokes;
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
        setStrokeCount(0);
        onCoverageChange?.(0, false);
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
    setStrokeCount(0);
    if (variant === 'shown') {
      setCoverage(1);
      onCoverageChange?.(1, true);
    } else {
      setCoverage(0);
      onCoverageChange?.(0, false);
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
      setStrokeCount(0);
      onCoverageChange?.(0, false);
      return;
    }
    strokeCountRef.current += 1;
    setStrokeCount(strokeCountRef.current);
    const result = scoreLetterSlot(cv, letter);
    // Multi-stroke letters (f, i, j, k, t, x, y) need separate pen lifts
    // before the slot can turn green — otherwise the slot could pass on
    // just the vertical of 't' or only the diagonals of 'x' / 'k'. The
    // cap is applied to the visible ratio so the slot stays yellow, and
    // the "passing" flag reported to the parent is derived from the same
    // capped value — one number, no hidden second gate.
    const enoughStrokes = strokeCountRef.current >= requiredStrokes;
    const effectiveRatio = enoughStrokes
      ? result.ratio
      : Math.min(result.ratio, PASS_RATIO * 0.9);
    // Single source of truth: if the slot's border turns green (coverage
    // >= PASS_RATIO), the row counts it as passed. No extra `result.pass`
    // requirement — that used to let a slot look green but still block
    // "Next" when the centerline/compactness sub-gates disagreed with the
    // coverage check.
    const passing = effectiveRatio >= PASS_RATIO;
    // Announce when the slot actually turns green. Matches the visual
    // state so the cue always coincides with the green border.
    if (variant !== 'shown' && passing && !announcedRef.current) {
      announcedRef.current = true;
      void speakLetter(letter);
    }
    setCoverage(effectiveRatio);
    onCoverageChange?.(effectiveRatio, passing);
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
      {/* Multi-stroke hint: show 1/2 badge on i/j/k/f/t/x/y until the
       *  required number of pen lifts have been made. Lets the child
       *  see WHY the slot is still yellow even when their ink covers
       *  most of the letter. */}
      {!passed && interactive && needMoreStrokes && (
        <div className="absolute top-1 right-1 px-2 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-extrabold shadow">
          {strokeCount} / {requiredStrokes} ✏️
        </div>
      )}
    </div>
  );
});
