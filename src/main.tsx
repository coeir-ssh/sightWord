import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// iPad WebKit (iOS 17.x, especially under Low Power Mode / low battery)
// returns null from many WebGL introspection calls that Three.js dereferences
// directly, which throws inside the WebGLRenderer constructor and forces the
// 2D fallback. Substitute non-null defaults for every call Three.js makes
// during construction so the renderer can build normally.
function patchWebGLNullSafety() {
  try {
    // pname -> default. Constants are hardcoded so we don't depend on a live
    // context being available at module load time.
    const STRING_DEFAULTS: Record<number, string> = {
      0x1f00: '',           // VENDOR
      0x1f01: '',           // RENDERER
      0x1f02: 'WebGL 2.0',  // VERSION
      0x8b8c: '',           // SHADING_LANGUAGE_VERSION
    };
    const ARRAY_DEFAULTS: Record<number, () => ArrayBufferView> = {
      0x0c10: () => new Int32Array([0, 0, 1, 1]),    // SCISSOR_BOX
      0x0ba2: () => new Int32Array([0, 0, 1, 1]),    // VIEWPORT
      0x0c22: () => new Float32Array([0, 0, 0, 0]),  // COLOR_CLEAR_VALUE
      0x0b70: () => new Float32Array([0, 1]),         // DEPTH_RANGE
      0x0c23: () => new Int32Array([1, 1, 1, 1]),    // COLOR_WRITEMASK
      0x0b72: () => new Int32Array([1]),             // DEPTH_WRITEMASK
    };

    const fixOne = (proto: any) => {
      if (!proto) return;
      if (typeof proto.getShaderPrecisionFormat === 'function') {
        const orig = proto.getShaderPrecisionFormat;
        proto.getShaderPrecisionFormat = function (...args: unknown[]) {
          const r = orig.apply(this, args);
          return r ?? { precision: 23, rangeMin: 127, rangeMax: 127 };
        };
      }
      if (typeof proto.getSupportedExtensions === 'function') {
        const orig = proto.getSupportedExtensions;
        proto.getSupportedExtensions = function (...args: unknown[]) {
          const r = orig.apply(this, args);
          return r ?? [];
        };
      }
      if (typeof proto.getParameter === 'function') {
        const orig = proto.getParameter;
        proto.getParameter = function (pname: number) {
          const r = orig.call(this, pname);
          if (r != null) return r;
          if (pname in STRING_DEFAULTS) return STRING_DEFAULTS[pname];
          if (pname in ARRAY_DEFAULTS) return ARRAY_DEFAULTS[pname]();
          // Unknown numeric pname: return a benign positive integer so any
          // capability comparison (`max > 0`, etc.) succeeds.
          return 4096;
        };
      }
    };
    fixOne((globalThis as any).WebGLRenderingContext?.prototype);
    fixOne((globalThis as any).WebGL2RenderingContext?.prototype);
  } catch {
    /* never block startup */
  }
}
patchWebGLNullSafety();

const rootEl = document.getElementById('root')!;

function showFatal(msg: string) {
  rootEl.innerHTML = `
    <div style="padding:20px;font-family:system-ui;color:#1f2937;line-height:1.5">
      <div style="font-size:20px;font-weight:700;margin-bottom:12px">Couldn't start the app</div>
      <pre style="white-space:pre-wrap;font-size:13px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px;color:#7f1d1d">${msg}</pre>
      <div style="margin-top:12px;font-size:13px;color:#475569">Please take a screenshot of this message and send it to us.</div>
    </div>`;
}

window.addEventListener('error', (e) => {
  showFatal(`${e.message}\n${e.filename}:${e.lineno}:${e.colno}\n${e.error?.stack ?? ''}`);
});
window.addEventListener('unhandledrejection', (e) => {
  showFatal(`Unhandled promise rejection:\n${(e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)}`);
});

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err: unknown) {
  const e = err as Error;
  showFatal(`${e.message}\n${e.stack ?? ''}`);
}
