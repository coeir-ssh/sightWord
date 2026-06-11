export type ScoreResult = {
  ratio: number;
  pass: boolean;
};

export const PASS_RATIO = 0.5;
const MIN_INK_RATIO = 0.015;
// Skeleton-distance ceiling. The user's ink must, on average, sit within
// this many pixels of the letter's centerline (the 1-pixel-wide skeleton
// extracted from the raw glyph). A real pen trace of width ~13-20px (pen
// + shadow halo) lives 0-10 pixels from the centerline and averages 5-8.
// A solid blob filling part of the letter has plenty of pixels 15-25 px
// from the centerline, so it averages well above this. 12 is the
// sweet-spot that lets a slightly imprecise child tracing through.
const MAX_MEAN_DIST_TO_CENTERLINE = 12;

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

function templateMaskRaw(text: string, width: number, height: number): Uint8Array {
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  drawTemplate(ctx, text, width, height, { fillStyle: '#000000', strokeScale: 0 });
  const data = ctx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i + 3] >= 32) mask[p] = 1;
  }
  return mask;
}

function templateMaskDilated(text: string, width: number, height: number): Uint8Array {
  return dilate(templateMaskRaw(text, width, height), width, height, 6);
}

/** Dilate a binary mask by `r` pixels (separable: horizontal + vertical). */
function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return mask;
  // Horizontal pass
  const tmp = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    let count = 0;
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

/**
 * Zhang-Suen thinning. Iteratively peels boundary pixels from a binary
 * mask until every connected component is one pixel wide — the
 * "skeleton" or centerline of the letter. Used to score how closely the
 * user's pen stroke follows the letter's intended path.
 */
function skeletonize(input: Uint8Array, w: number, h: number): Uint8Array {
  const img = new Uint8Array(input); // copy
  const at = (x: number, y: number) => img[y * w + x];
  const neighbours = (x: number, y: number) => [
    at(x, y - 1),     // P2 N
    at(x + 1, y - 1), // P3 NE
    at(x + 1, y),     // P4 E
    at(x + 1, y + 1), // P5 SE
    at(x, y + 1),     // P6 S
    at(x - 1, y + 1), // P7 SW
    at(x - 1, y),     // P8 W
    at(x - 1, y - 1), // P9 NW
  ];
  const transitions = (p: number[]) => {
    let n = 0;
    for (let i = 0; i < 8; i++) {
      if (p[i] === 0 && p[(i + 1) % 8] === 1) n++;
    }
    return n;
  };
  const pass = (subiter: 0 | 1) => {
    const toClear: number[] = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!at(x, y)) continue;
        const p = neighbours(x, y);
        const B = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + p[7];
        if (B < 2 || B > 6) continue;
        if (transitions(p) !== 1) continue;
        // P2*P4*P6 = 0 (subiter 0) / P2*P4*P8 = 0 (subiter 1)
        if (subiter === 0) {
          if (p[0] * p[2] * p[4] !== 0) continue;
          if (p[2] * p[4] * p[6] !== 0) continue;
        } else {
          if (p[0] * p[2] * p[6] !== 0) continue;
          if (p[0] * p[4] * p[6] !== 0) continue;
        }
        toClear.push(y * w + x);
      }
    }
    if (toClear.length === 0) return false;
    for (const i of toClear) img[i] = 0;
    return true;
  };
  let changed = true;
  while (changed) {
    const c1 = pass(0);
    const c2 = pass(1);
    changed = c1 || c2;
  }
  return img;
}

/**
 * 2-pass Chamfer (3,4) distance transform. For each pixel, computes a
 * distance to the nearest "seed" pixel (i.e., a 1 in `seedMask`). After
 * the final divide-by-3 the value is in pixel units. Pixels with no
 * seed reachable get a large finite number.
 */
function distanceTransform(seedMask: Uint8Array, w: number, h: number): Float32Array {
  const INF = w * h * 4; // > any reachable chamfer distance
  const dist = new Float32Array(w * h);
  for (let i = 0; i < dist.length; i++) {
    dist[i] = seedMask[i] ? 0 : INF;
  }
  // Forward pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let d = dist[i];
      if (y > 0) {
        if (x > 0) d = Math.min(d, dist[i - w - 1] + 4);
        d = Math.min(d, dist[i - w] + 3);
        if (x < w - 1) d = Math.min(d, dist[i - w + 1] + 4);
      }
      if (x > 0) d = Math.min(d, dist[i - 1] + 3);
      dist[i] = d;
    }
  }
  // Backward pass
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let d = dist[i];
      if (y < h - 1) {
        if (x > 0) d = Math.min(d, dist[i + w - 1] + 4);
        d = Math.min(d, dist[i + w] + 3);
        if (x < w - 1) d = Math.min(d, dist[i + w + 1] + 4);
      }
      if (x < w - 1) d = Math.min(d, dist[i + 1] + 3);
      dist[i] = d;
    }
  }
  // Chamfer (3,4) is 3x the pixel distance — normalise.
  for (let i = 0; i < dist.length; i++) dist[i] /= 3;
  return dist;
}

// Cache the per-letter distance map so we only pay the skeleton +
// distance-transform cost once per (letter, slot-size) pair.
const distMapCache = new Map<string, Float32Array>();

function distanceFromCenterline(text: string, w: number, h: number): Float32Array {
  const key = `${text}|${w}x${h}`;
  const cached = distMapCache.get(key);
  if (cached) return cached;
  const raw = templateMaskRaw(text, w, h);
  const skel = skeletonize(raw, w, h);
  const dist = distanceTransform(skel, w, h);
  distMapCache.set(key, dist);
  return dist;
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
  const tmpl = templateMaskDilated(letter, w, h);
  const stroke = userStrokeMask(slotCanvas);
  const distMap = distanceFromCenterline(letter, w, h);

  let strokeCount = 0;
  let templateCount = 0;
  let overlap = 0;
  let sumDist = 0;
  for (let i = 0; i < stroke.length; i++) {
    const s = stroke[i];
    const t = tmpl[i];
    if (t) templateCount++;
    if (s) {
      strokeCount++;
      sumDist += distMap[i];
      if (t) overlap++;
    }
  }

  const slotArea = w * h;
  const inkRatio = strokeCount / slotArea;
  if (inkRatio < MIN_INK_RATIO) return { ratio: 0, pass: false };

  const coverage = templateCount > 0 ? overlap / templateCount : 0;
  const meanDist = strokeCount > 0 ? sumDist / strokeCount : Infinity;

  const passCoverage = coverage >= PASS_RATIO;
  const passCenterline = meanDist <= MAX_MEAN_DIST_TO_CENTERLINE;

  // Honest visible ratio: penalise the bar when either gate fails so the
  // child can see whether they're on track instead of seeing a full bar
  // on a wrong attempt.
  let ratio = coverage;
  if (!passCenterline) {
    ratio *= MAX_MEAN_DIST_TO_CENTERLINE / Math.max(meanDist, MAX_MEAN_DIST_TO_CENTERLINE);
  }

  const pass = passCoverage && passCenterline;
  return { ratio, pass };
}
