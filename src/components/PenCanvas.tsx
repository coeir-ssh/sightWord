import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type PenCanvasHandle = {
  clear: () => void;
  canvas: () => HTMLCanvasElement | null;
  hasInk: () => boolean;
};

type Props = {
  width: number;
  height: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  /** Fired on every pointer event (mid-stroke) — useful for live coverage. */
  onChange?: () => void;
  /** Fired when a stroke ends (pointerup / pointercancel / pointerleave). */
  onStroke?: () => void;
  penOnly?: boolean;
};

export const PenCanvas = forwardRef<PenCanvasHandle, Props>(function PenCanvas(
  {
    width,
    height,
    className,
    strokeColor = '#1d4ed8',
    strokeWidth = 20,
    glowColor,
    onChange,
    onStroke,
    penOnly = false,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const hasInkRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      hasInkRef.current = false;
      onChange?.();
      onStroke?.();
    },
    canvas: () => canvasRef.current,
    hasInk: () => hasInkRef.current,
  }));

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const setupBrush = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor ?? strokeColor;
    ctx.shadowBlur = 8;
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * cv.width;
    const y = ((e.clientY - rect.top) / rect.height) * cv.height;
    return { x, y };
  };

  const isAllowedPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') return true;
    if (e.pointerType === 'touch') return !penOnly;
    return false;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAllowedPointer(e)) return;
    e.preventDefault();
    const cv = canvasRef.current!;
    cv.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    drawingRef.current = true;
    const pos = getPos(e);
    lastRef.current = pos;
    const ctx = cv.getContext('2d')!;
    setupBrush(ctx);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
    ctx.stroke();
    hasInkRef.current = true;
    onChange?.();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    if (activePointerRef.current !== e.pointerId) return;
    if (!isAllowedPointer(e)) return;
    e.preventDefault();
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    const pos = getPos(e);
    const last = lastRef.current!;
    setupBrush(ctx);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
    onChange?.();
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    drawingRef.current = false;
    lastRef.current = null;
    activePointerRef.current = null;
    onStroke?.();
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={endStroke}
    />
  );
});
