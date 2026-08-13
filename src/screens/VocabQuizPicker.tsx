import { useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { useVocabQuizList, useWallet } from '../lib/state';
import { VOCAB_QUIZ_LISTS, VOCAB_QUIZ_STEPS } from '../data/vocabQuiz';
import { storage } from '../lib/storage';

type Props = { onBack: () => void; onStart: () => void };

// Full picker screen that mirrors the Sight Word ListPicker: every list shown
// with all six step tiles so the parent/child can jump straight into the step
// they actually want to drill (e.g. "just Step 3 of List 1"). Tapping a step
// tile saves that list + that step index and starts the quiz.
export function VocabQuizPicker({ onBack, onStart }: Props) {
  const { listId: activeListId, setListId } = useVocabQuizList();
  const { wallet } = useWallet();

  // Track saved next-step index per list so we can highlight it. Reload on
  // every render — the value is cheap to read from localStorage and this
  // screen is short-lived.
  const [, setBump] = useState(0);
  const savedStep = (listId: string) =>
    Math.min(VOCAB_QUIZ_STEPS.length - 1, Math.max(0, storage.getVocabQuizStep(listId)));

  const choose = (listId: string, step: number) => {
    setListId(listId);
    storage.setVocabQuizStep(listId, step);
    setBump((n) => n + 1);
    onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-amber-50 to-amber-50/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="text-orange-700 font-extrabold text-2xl">
          📝 Choose a Vocabulary Quiz LIST
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-4 pb-2 text-center text-sm font-bold text-slate-600">
        Tap any Step to jump straight into it
      </div>

      <main className="flex-1 p-4 space-y-4">
        {VOCAB_QUIZ_LISTS.map((list) => {
          const currentStep = savedStep(list.id);
          return (
            <section key={list.id} className="bg-white rounded-3xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="text-xl font-extrabold text-orange-700">
                  📝 {list.label}
                  {list.date && (
                    <span className="ml-2 text-xs font-bold text-slate-400">
                      · {list.date}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-500">
                  Next: Step {currentStep + 1}
                </div>
              </div>
              <ol className="text-sm text-slate-600 mb-3 list-decimal list-inside space-y-0.5">
                {list.items.map((it, i) => (
                  <li key={i} className="leading-snug">
                    {it.sentence}{' '}
                    <span className="text-orange-700 font-extrabold">
                      ({it.targets.join(' / ')})
                    </span>
                  </li>
                ))}
              </ol>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {VOCAB_QUIZ_STEPS.map((stepDef, step) => {
                  const isCurrent = list.id === activeListId && step === currentStep;
                  const isPast = list.id === activeListId && step < currentStep;
                  return (
                    <button
                      key={step}
                      onClick={() => choose(list.id, step)}
                      className={`rounded-2xl p-3 text-left transition active:scale-95 shadow ${
                        isCurrent
                          ? 'bg-orange-500 text-white ring-4 ring-orange-300'
                          : isPast
                            ? 'bg-green-100 hover:bg-green-200 text-green-900'
                            : 'bg-slate-50 hover:bg-orange-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-base flex items-center gap-1">
                        Step {step + 1}
                        {isPast && <span className="text-base">⭐</span>}
                      </div>
                      <div
                        className={`text-[11px] font-bold leading-tight mt-0.5 ${
                          isCurrent
                            ? 'text-orange-100'
                            : isPast
                              ? 'text-green-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {stepDef.label}
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
