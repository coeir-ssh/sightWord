import { useEffect, useState } from 'react';

const ENABLED_KEY = 'sw.bgm.enabled.v1';
const VOLUME_KEY = 'sw.bgm.volume.v1';

const STEP_DURATION = 0.28;
const STEPS_PER_BAR = 8;

// Soft I-vi-IV-V progression in C major, voiced low for a pad layer.
const PROGRESSION: number[][] = [
  [130.81, 164.81, 196.0, 246.94], // Cmaj7  (C E G B)
  [110.0, 130.81, 164.81, 196.0],  // Am7    (A C E G)
  [174.61, 220.0, 261.63, 329.63], // Fmaj7  (F A C E)
  [196.0, 246.94, 293.66, 369.99], // G7-ish (G B D F#? -> use F# for color)
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let timerId: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;

const listeners = new Set<() => void>();

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}
function saveEnabled(v: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, String(v));
  } catch {
    /* ignore */
  }
}
function loadVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (!raw) return 0.18;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return 0.18;
    return Math.max(0, Math.min(1, n));
  } catch {
    return 0.18;
  }
}
function saveVolume(v: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    /* ignore */
  }
}

let enabled = loadEnabled();
let volume = loadVolume();

function notify() {
  listeners.forEach((fn) => fn());
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctx) return null;
  try {
    ctx = new Ctx();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = enabled ? volume : 0;
  master.connect(ctx.destination);
  return ctx;
}

function scheduleTone(
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  peak: number
) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, startAt);
  env.gain.linearRampToValueAtTime(peak, startAt + 0.04);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(env);
  env.connect(master);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

function scheduleStep() {
  if (!ctx) return;
  const barIdx = Math.floor(stepIndex / STEPS_PER_BAR) % PROGRESSION.length;
  const chord = PROGRESSION[barIdx];
  const stepInBar = stepIndex % STEPS_PER_BAR;

  // Pad: sustain the whole chord at the start of each bar.
  if (stepInBar === 0) {
    for (const f of chord) {
      scheduleTone(f, nextNoteTime, STEP_DURATION * STEPS_PER_BAR * 0.95, 'sine', 0.05);
    }
  }

  // Arpeggio melody one octave up.
  const arpPattern = [0, 2, 1, 3, 2, 1, 3, 0];
  const noteIdx = arpPattern[stepInBar];
  const noteFreq = chord[noteIdx] * 2;
  scheduleTone(noteFreq, nextNoteTime, STEP_DURATION * 0.9, 'triangle', 0.07);

  // A soft sparkle on the upbeat of every other bar.
  if (barIdx % 2 === 1 && stepInBar === 4) {
    scheduleTone(chord[3] * 4, nextNoteTime, 0.6, 'sine', 0.04);
  }

  nextNoteTime += STEP_DURATION;
  stepIndex += 1;
}

function tick() {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + 0.25) {
    scheduleStep();
  }
}

export function startBgm(): void {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  if (!enabled) return;
  if (started) return;
  started = true;
  nextNoteTime = c.currentTime + 0.1;
  stepIndex = 0;
  timerId = window.setInterval(tick, 60);
}

function stopScheduler() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  started = false;
}

export function setBgmEnabled(v: boolean): void {
  enabled = v;
  saveEnabled(v);
  if (master && ctx) {
    const target = v ? volume : 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
  }
  if (v) {
    startBgm();
  } else {
    stopScheduler();
  }
  notify();
}

export function setBgmVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  saveVolume(volume);
  if (master && ctx && enabled) {
    master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }
  notify();
}

export function isBgmEnabled(): boolean {
  return enabled;
}

export function getBgmVolume(): number {
  return volume;
}

export function subscribeBgm(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useBgm() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeBgm(() => setTick((n) => n + 1)), []);
  return {
    enabled,
    volume,
    toggle: () => setBgmEnabled(!enabled),
    setEnabled: setBgmEnabled,
    setVolume: setBgmVolume,
  };
}
