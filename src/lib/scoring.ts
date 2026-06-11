export type ScoreResult = {
  ratio: number;
  pass: boolean;
};

export const PASS_RATIO = 0.5;
const MIN_INK_RATIO = 0.015;
// Precision floor: of all the ink the child laid down, at least this
// fraction has to land inside the dilated letter template. Real traces
// land at 0.60-0.85; scribbles at 0.10-0.30. 0.40 leaves headroom for
// a slightly off tracing while still blocking obvious scribbles.
const MIN_PRECISION = 0.40;
// Hard ceiling on total ink. Real tracings sit at 0.10-0.18; bold/slow
// tracing can hit ~0.20. Scribbling starts at 0.25+. 0.22 lets a thick
// trace through and stops the scribble band.
const MAX_INK_RATIO = 0.22;
// Spatial-spread floor. The inked-on-template region's bounding box
// must span at least this fraction of the template's bounding box in
// both width and height. A real trace spans ~95% in both; an upper-
// half blob on a letter like 'e' (whose horizontal mid-bar stretches
// the bbox down) reaches ~0.62. 0.75 puts the cutoff above the blob
// band while leaving room for a slightly hesitant real trace.
const MIN_EXTENT = 0.75;

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
  // Bounding-box trackers for the template pixels and the overlap region
  // (stroke ∩ template). Used by the spread gate below.
  let tMinX = w;
  let tMaxX = -1;
  let tMinY = h;
  let tMaxY = -1;
  let oMinX = w;
  let oMaxX = -1;
  let oMinY = h;
  let oMaxY = -1;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i++) {
      const s = stroke[i];
      const t = tmpl[i];
      if (s) strokeCount++;
      if (t) {
        templateCount++;
        if (x < tMinX) tMinX = x;
        if (x > tMaxX) tMaxX = x;
        if (y < tMinY) tMinY = y;
        if (y > tMaxY) tMaxY = y;
        if (s) {
          overlap++;
          if (x < oMinX) oMinX = x;
          if (x > oMaxX) oMaxX = x;
          if (y < oMinY) oMinY = y;
          if (y > oMaxY) oMaxY = y;
        }
      }
    }
  }

  const slotArea = w * h;
  const inkRatio = strokeCount / slotArea;
  if (inkRatio < MIN_INK_RATIO) return { ratio: 0, pass: false };

  const coverage = templateCount > 0 ? overlap / templateCount : 0;
  const precision = strokeCount > 0 ? overlap / strokeCount : 0;

  // Spread of the inked-on-template region vs the template itself. A
  // dense blob over only the top of the letter still scores high
  // coverage + precision; here it falls because oH << tH.
  const tW = Math.max(1, tMaxX - tMinX + 1);
  const tH = Math.max(1, tMaxY - tMinY + 1);
  const oW = oMaxX >= 0 ? oMaxX - oMinX + 1 : 0;
  const oH = oMaxY >= 0 ? oMaxY - oMinY + 1 : 0;
  const extentW = oW / tW;
  const extentH = oH / tH;

  const passPrecision = precision >= MIN_PRECISION;
  const passInk = inkRatio <= MAX_INK_RATIO;
  const passExtent = extentW >= MIN_EXTENT && extentH >= MIN_EXTENT;

  // Penalise the visible ratio when any gate fails so the progress bar
  // honestly reflects "this is not going to pass" — without this, a
  // child who scribbled or made a blob would still see the bar near
  // 100% because the template ends up fully covered.
  let ratio = coverage;
  if (!passPrecision) ratio *= precision / MIN_PRECISION;
  if (!passInk) ratio *= MAX_INK_RATIO / inkRatio;
  if (!passExtent) ratio *= Math.min(extentW, extentH) / MIN_EXTENT;

  const pass =
    passPrecision && passInk && passExtent && ratio >= PASS_RATIO;
  return { ratio, pass };
}
