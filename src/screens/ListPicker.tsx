import { CoinHUD } from '../components/CoinHUD';
import { useProgress, useWallet } from '../lib/state';
import { WEEKS, LIST_LABEL, type WeekId } from '../data/words';

type Props = { onBack: () => void; onStart: () => void };

const DAY_KIND = ['Tracing', 'Tracing Review', 'Fill in the Blanks', 'Free Writing', 'Mock Test'];

export function ListPicker({ onBack, onStart }: Props) {
  const { progress, setWeekAndDay, dayDone } = useProgress();
  const { wallet } = useWallet();

  const choose = (id: WeekId, day: number) => {
    setWeekAndDay(id, day);
    onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="text-blue-700 font-extrabold text-2xl">📖 Choose a LIST to Study</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-4 pb-2 text-center text-sm font-bold text-slate-600">
        Tap a LIST to start learning right away
      </div>

      <main className="flex-1 p-4 space-y-4">
        {WEEKS.map((wk) => {
          const done = dayDone(wk.id);
          const completedDays = done.filter(Boolean).length;
          return (
            <section
              key={wk.id}
              className="bg-white rounded-3xl shadow-lg p-4"
            >
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="text-xl font-extrabold text-blue-700">
                  {LIST_LABEL[wk.id]}
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {completedDays}/5 Complete
                </div>
              </div>
              <div className="text-sm text-slate-600 mb-3">
                Words: {wk.words.map((w) => w.text).join(', ')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {DAY_KIND.map((kind, day) => {
                  const isDone = done[day];
                  const isCurrent =
                    progress.currentWeek === wk.id && progress.currentDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => choose(wk.id, day)}
                      className={`rounded-2xl p-3 text-left transition active:scale-95 shadow ${
                        isCurrent
                          ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                          : isDone
                            ? 'bg-green-100 hover:bg-green-200 text-green-900'
                            : 'bg-slate-50 hover:bg-blue-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-base flex items-center gap-1">
                        Step {day + 1}
                        {isDone && <span className="text-base">⭐</span>}
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-blue-100'
                            : isDone
                              ? 'text-green-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {kind}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
