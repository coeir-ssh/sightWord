import { CoinHUD } from '../components/CoinHUD';
import { useProgress, useWallet } from '../lib/state';
import { WEEKS, LIST_LABEL, type WeekId } from '../data/words';

type Props = { onBack: () => void };

export function ListPicker({ onBack }: Props) {
  const { progress, setWeek, dayDone } = useProgress();
  const { wallet } = useWallet();

  const choose = (id: WeekId) => {
    setWeek(id);
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-blue-700 font-extrabold text-2xl">📖 리스트 고르기</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <main className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {WEEKS.map((wk) => {
          const done = dayDone(wk.id);
          const completedDays = done.filter(Boolean).length;
          const isCurrent = progress.currentWeek === wk.id;
          return (
            <button
              key={wk.id}
              onClick={() => choose(wk.id)}
              className={`rounded-3xl shadow-lg p-4 text-left transition active:scale-95 ${
                isCurrent
                  ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                  : 'bg-white hover:bg-blue-50 text-slate-800'
              }`}
            >
              <div className="text-xl font-extrabold mb-2">
                {LIST_LABEL[wk.id]}
                {isCurrent && <span className="ml-2 text-sm font-bold">▶ 진행중</span>}
              </div>
              <div className={`text-sm mb-3 ${isCurrent ? 'text-blue-100' : 'text-slate-600'}`}>
                {wk.words.map((w) => w.text).join(', ')}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {done.map((d, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        d
                          ? 'bg-yellow-300'
                          : isCurrent
                            ? 'bg-blue-300'
                            : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <div className={`text-xs font-bold ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                  {completedDays}/5 일
                </div>
              </div>
            </button>
          );
        })}
      </main>
    </div>
  );
}
