export type ScoreResult = {
  ratio: number;
  pass: boolean;
};

export const PASS_RATIO = 0.45;

export function renderTemplate(
  text: string,
  width: number,
  height: number,
  opts?: { font?: string; padding?: number }
): ImageData {
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const padding = opts?.padding ?? 8;
  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  let fontSize = Math.floor(maxH * 0.95);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const family = opts?.font ?? '"Comic Sans MS", system-ui, sans-serif';
  for (let i = 0; i < 20; i++) {
    ctx.font = `700 ${fontSize}px ${family}`;
    const w = ctx.measureText(text).width;
    if (w <= maxW) break;
    fontSize -= 4;
    if (fontSize < 16) break;
  }
  ctx.font = `700 ${fontSize}px ${family}`;

  // Draw template: fill + slight stroke to widen letter so kid pen strokes
  // can comfortably cover it.
  ctx.lineWidth = Math.max(4, fontSize * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000000';
  ctx.strokeText(text, width / 2, height / 2);
  ctx.fillText(text, width / 2, height / 2);

  return ctx.getImageData(0, 0, width, height);
}

/** Returns mask buffer where 1 = template pixel (dark), 0 = empty */
export function templateMask(img: ImageData): Uint8Array {
  const { data, width, height } = img;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // dark threshold (template was drawn black on white)
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    mask[p] = lum < 128 ? 1 : 0;
  }
  return mask;
}

/** Returns mask of user strokes from a canvas (strokes are typically dark / non-transparent) */
export function strokeMask(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = img;
  const mask = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const a = data[i + 3];
    if (a < 64) {
      mask[p] = 0;
      continue;
    }
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    mask[p] = lum < 200 ? 1 : 0;
  }
  return mask;
}

export function coverageRatio(template: Uint8Array, stroke: Uint8Array): number {
  if (template.length !== stroke.length) throw new Error('mask size mismatch');
  let templateCount = 0;
  let covered = 0;
  for (let i = 0; i < template.length; i++) {
    if (template[i]) {
      templateCount++;
      if (stroke[i]) covered++;
    }
  }
  if (templateCount === 0) return 0;
  return covered / templateCount;
}

/** how much of the user's stroke lies inside the template region */
export function containmentRatio(template: Uint8Array, stroke: Uint8Array): number {
  if (template.length !== stroke.length) throw new Error('mask size mismatch');
  let strokeCount = 0;
  let inside = 0;
  for (let i = 0; i < stroke.length; i++) {
    if (stroke[i]) {
      strokeCount++;
      if (template[i]) inside++;
    }
  }
  if (strokeCount === 0) return 0;
  return inside / strokeCount;
}

const MIN_STROKE_PIXELS = 80; // require some actual ink

export function scoreLetterSlot(
  slotCanvas: HTMLCanvasElement,
  letter: string
): ScoreResult {
  const tmplImg = renderTemplate(letter, slotCanvas.width, slotCanvas.height);
  const tmpl = templateMask(tmplImg);
  const stroke = strokeMask(slotCanvas);

  let strokeCount = 0;
  for (let i = 0; i < stroke.length; i++) if (stroke[i]) strokeCount++;
  if (strokeCount < MIN_STROKE_PIXELS) {
    return { ratio: 0, pass: false };
  }

  const cov = coverageRatio(tmpl, stroke);
  const con = containmentRatio(tmpl, stroke);
  // Pass if user covered enough of the letter OR most of their writing
  // landed inside the letter shape (forgiving for thin strokes).
  const ratio = Math.max(cov, con * 0.9);
  return { ratio, pass: ratio >= PASS_RATIO };
}
