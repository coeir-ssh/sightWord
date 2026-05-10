import { useBgm } from '../lib/bgm';

export function BgmToggle() {
  const { enabled, volume, toggle, setVolume } = useBgm();
  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow">
      <button
        onClick={toggle}
        className="font-bold text-slate-700 active:scale-95 hover:text-blue-600 transition"
        aria-label={enabled ? '배경음악 끄기' : '배경음악 켜기'}
        title={enabled ? '배경음악 끄기' : '배경음악 켜기'}
      >
        {enabled ? '🎵' : '🔇'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-20 accent-blue-500"
        aria-label="배경음악 볼륨"
        title="배경음악 볼륨"
      />
    </div>
  );
}
