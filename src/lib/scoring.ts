export type ScoreResult = {
  ratio: number;
  pass: boolean;
};

export const PASS_RATIO = 0.5;
const MIN_INK_RATIO = 0.015;
// Precision floor: of all the ink the child laid down, at least this
// fraction has to land inside the dilated letter template. A wholesale
// scribble lands at ~10-15% precision; a real-but-imperfect trace
// lands at 60-85%. 0.45 sits cleanly between the two.
const MIN_PRECISION = 0.45;
// Hard ceiling on total ink. A normal letter occupies ~10-18% of the
// canvas; horizontal-scribble cheats start at 25%+, so 0.22 catches
// them. If a child's legitimately bold tracing trips this we can ease
// it back up.
const MAX_INK_RATIO = 0.22;

const TEMPLATE_FONT_FAMILY =
  '"Fredoka", "Quicksand", "Patrick Hand", "Comic Sans MS", "Marker Felt", "Chalkduster", system-ui, sans-serif';

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
  drawTemplate(ctx, text, width, height, { fillStyle: '#000000', strokeScale: 0 });
  const data = ctx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Letter pixels are the ones the glyph actually painted (alpha > 0).
    if (data[i + 3] >= 32) mask[p] = 1;
  }
  return dilate(mask, width, height, 6); // small forgiveness margin
}

/** Dilate a binary mask by `r` pixels (separable: horizontal + vertical). */
function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return mask;
  // Horizontal pass
  const tmp = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    let count = 0;
    // Initial window
    for (let x = 0; x <= r && x < w; x++) if (mask[y * w + x]) count++;
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = count > 0 ? 1 : 0;
      const enter = x + r + 1;
      const leave = x - r;
      if (enter < w && mask[y * w + enter]) count++;
      if (leave >= 0 && mask[y * w + leave]) count--;
    }
  }
  // Vertical pass
  const out = new Uint8Array(mask.length);
  for (let x = 0; x < w; x++) {
    let count = 0;
    for (let y = 0; y <= r && y < h; y++) if (tmp[y * w + x]) count++;
    for (let y = 0; y < h; y++) {
      out[y * w + x] = count > 0 ? 1 : 0;
      const enter = y + r + 1;
      const leave = y - r;
      if (enter < h && tmp[enter * w + x]) count++;
      if (leave >= 0 && tmp[leave * w + x]) count--;
    }
  }
  return out;
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
  const precision = strokeCount > 0 ? overlap / strokeCount : 0;

  const passPrecision = precision >= MIN_PRECISION;
  const passInk = inkRatio <= MAX_INK_RATIO;

  // Penalise the visible ratio when either gate fails so the progress
  // bar honestly reflects "this is not going to pass" — without this,
  // a child who scribbled the whole slot would still see the bar at
  // 100% because the template ends up fully covered.
  let ratio = coverage;
  if (!passPrecision) ratio *= precision / MIN_PRECISION;
  if (!passInk) ratio *= MAX_INK_RATIO / inkRatio;

  const pass = passPrecision && passInk && ratio >= PASS_RATIO;
  return { ratio, pass };
}
