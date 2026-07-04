import { CoinHUD } from '../components/CoinHUD';
import { useShowTellScript, useWallet } from '../lib/state';
import { storage } from '../lib/storage';
import { groupShowTellByMonth, totalBlanks, type ShowTellScript } from '../data/showTell';

type Props = { onBack: () => void; onStart: () => void };

const STEP_KIND = ['Fill in the Blanks', 'Listen & Repeat', 'Present from Memory'];

function stepNames(script: ShowTellScript): string[] {
  return totalBlanks(script) > 0 ? STEP_KIND : STEP_KIND.slice(1);
}

export function ShowTellPicker({ onBack, onStart }: Props) {
  const { wallet } = useWallet();
  const { scriptId, setScriptId } = useShowTellScript();
  const groups = groupShowTellByMonth();

  const choose = (id: string, step: number) => {
    setScriptId(id);
    storage.setShowTellStep(id, step);
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
        <div className="text-blue-700 font-extrabold text-2xl">🎤 All Chapters</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-4 pb-2 text-center text-sm font-bold text-slate-600">
        Tap any step to jump straight to it
      </div>

      <main className="flex-1 p-4 space-y-6">
        {groups.map((group) => (
          <div key={group.month}>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">
              {group.month}
            </div>
            <div className="space-y-4">
              {group.scripts.map((script) => {
                const names = stepNames(script);
                const savedStep = Math.min(
                  names.length - 1,
                  Math.max(0, storage.getShowTellStep(script.id))
                );
                const isCurrentScript = script.id === scriptId;
                return (
                  <section key={script.id} className="bg-white rounded-3xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="text-xl font-extrabold text-blue-700">
                        {script.emoji} {script.title}
                      </div>
                      <div className="text-xs font-bold text-slate-500">{script.titleKo}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {names.map((kind, step) => {
                        const isDone = step < savedStep;
                        const isCurrent = isCurrentScript && step === savedStep;
                        return (
                          <button
                            key={step}
                            onClick={() => choose(script.id, step)}
                            className={`rounded-2xl p-3 text-left transition active:scale-95 shadow ${
                              isCurrent
                                ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                                : isDone
                                  ? 'bg-green-100 hover:bg-green-200 text-green-900'
                                  : 'bg-slate-50 hover:bg-blue-50 text-slate-800'
                            }`}
                          >
                            <div className="font-extrabold text-base flex items-center gap-1">
                              Step {step + 1}
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
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
