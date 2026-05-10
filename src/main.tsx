import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// iPad WebKit (iOS 17.x) returns null from a few WebGL introspection calls
// that Three.js dereferences directly (`getShaderPrecisionFormat().precision`,
// `getSupportedExtensions().indexOf(...)`, `getParameter(VERSION).indexOf(...)`),
// which throws and forces the 2D fallback. Substitute safe defaults so
// WebGLRenderer can build normally.
function patchWebGLNullSafety() {
  try {
    // String-valued pnames Three.js calls .indexOf on. Hardcoded constants so
    // we don't have to read them off a context that might not exist yet.
    // VERSION=0x1F02, RENDERER=0x1F01, VENDOR=0x1F00, SHADING_LANGUAGE_VERSION=0x8B8C
    const STRING_PNAMES = new Map<number, string>([
      [0x1f02, 'WebGL 2.0'],
      [0x1f01, ''],
      [0x1f00, ''],
      [0x8b8c, ''],
    ]);
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
          const fallback = STRING_PNAMES.get(pname);
          return fallback !== undefined ? fallback : r;
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
      <div style="font-size:20px;font-weight:700;margin-bottom:12px">앱을 시작할 수 없어요</div>
      <pre style="white-space:pre-wrap;font-size:13px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px;color:#7f1d1d">${msg}</pre>
      <div style="margin-top:12px;font-size:13px;color:#475569">이 메시지를 캡처해서 보내 주세요.</div>
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
