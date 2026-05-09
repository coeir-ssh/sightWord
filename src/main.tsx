import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

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
