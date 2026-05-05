export type ScoreResult = {
  ratio: number;
  pass: boolean;
};

export const PASS_RATIO = 0.6;
const MIN_INK_RATIO = 0.015;

const TEMPLATE_FONT_FAMILY =
  '"Comic Sans MS", "Patrick Hand", "Marker Felt", "Chalkduster", system-ui, sans-serif';

export type DrawTemplateOptions = {
  fillStyle?: string;
  padding?: number;
  /** Outline thickness as fraction of font size. 0 = plain fillText. */
  strokeScale?: number;
};

/**
 * Renders the letter glyph at a given size + position. Used by both:
 *  - the visible guide layer in LetterSlot
 *  - the offscreen scoring mask
 * so that pixel-level coverage matches the visual perfectly.
 */
export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  opts: DrawTemplateOptions = {}
): void {
  ctx.clearRect(0, 0, width, height);

  const padding = opts.padding ?? 8;
  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  let fontSize = Math.floor(maxH * 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 30; i++) {
    ctx.font = `700 ${fontSize}px ${TEMPLATE_FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxW) break;
    fontSize -= 3;
    if (fontSize < 14) break;
  }
  ctx.font = `700 ${fontSize}px ${TEMPLATE_FONT_FAMILY}`;

  const fill = opts.fillStyle ?? '#000000';
  const strokeScale = opts.strokeScale ?? 0;

  ctx.fillStyle = fill;
  if (strokeScale > 0) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(2, fontSize * strokeScale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeText(text, width / 2, height / 2);
  }
  ctx.fillText(text, width / 2, height / 2);
}

function templateMaskFor(text: string, width: number, height: number): Uint8Array {
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  drawTemplate(ctx, text, width, height, { fillStyle: '#000000', strokeScale: 0 });
  const data = ctx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Pixel is part of letter when noticeably darker than white background
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    mask[p] = lum < 200 ? 1 : 0;
  }
  return mask;
}

function userStrokeMask(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const mask = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i + 3] >= 32) mask[p] = 1; // include glow halo
  }
  return mask;
}

export function scoreLetterSlot(
  slotCanvas: HTMLCanvasElement,
  letter: string
): ScoreResult {
  const w = slotCanvas.width;
  const h = slotCanvas.height;
  const tmpl = templateMaskFor(letter, w, h);
  const stroke = userStrokeMask(slotCanvas);

  let strokeCount = 0;
  let templateCount = 0;
  let overlap = 0;
  for (let i = 0; i < stroke.length; i++) {
    const s = stroke[i];
    const t = tmpl[i];
    if (s) strokeCount++;
    if (t) templateCount++;
    if (s && t) overlap++;
  }

  const slotArea = w * h;
  const inkRatio = strokeCount / slotArea;
  if (inkRatio < MIN_INK_RATIO) return { ratio: 0, pass: false };

  const coverage = templateCount > 0 ? overlap / templateCount : 0;
  return { ratio: coverage, pass: coverage >= PASS_RATIO };
}
