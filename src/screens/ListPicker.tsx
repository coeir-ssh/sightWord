import { useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { useProgress, useWallet } from '../lib/state';
import {
  WEEKS,
  LIST_LABEL,
  listNumber,
  numSubLists,
  subListLabel,
  subListWords,
  type Half,
  type WeekId,
} from '../data/words';

type Props = { onBack: () => void; onStart: () => void };

const ACTIVITY_KIND = ['따라쓰기', '따라쓰기 복습', '빈칸 채우기', '자유 쓰기', '모의 시험'];

type Picked = { listId: WeekId; half: Half };

export function ListPicker({ onBack, onStart }: Props) {
  const { progress, setActivity, listDone } = useProgress();
  const { wallet } = useWallet();
  const [picked, setPicked] = useState<Picked | null>(null);

  const choose = (listId: WeekId, half: Half, activity: number) => {
    setActivity(listId, half, activity);
    onStart();
  };

  if (picked) {
    const { listId, half } = picked;
    const words = subListWords(listId, half);
    const all = listDone(listId);
    const subDone = all.slice(half * 5, half * 5 + 5);
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
        <header className="flex items-center justify-between p-4">
          <button
            onClick={() => setPicked(null)}
            className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
          >
            ← LIST 다시 고르기
          </button>
          <div className="text-blue-700 font-extrabold text-2xl">
            {subListLabel(listId, half)}
          </div>
          <CoinHUD coins={wallet.coins} />
        </header>

        <div className="px-6 pb-2">
          <div className="bg-white/80 rounded-2xl shadow p-4">
            <div className="text-sm font-bold text-slate-500 mb-1">이 서브리스트 단어</div>
            <div className="text-xl font-extrabold text-slate-800">
              {words.map((w) => w.text).join(', ')}
            </div>
          </div>
        </div>

        <div className="px-4 pt-2 pb-2 text-center text-sm font-bold text-slate-600">
          어떤 활동을 할까요?
        </div>

        <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTIVITY_KIND.map((kind, activity) => {
            const isDone = subDone[activity];
            const isCurrent =
              progress.currentWeek === listId &&
              progress.currentSubList === half &&
              progress.currentActivity === activity;
            return (
              <button
                key={activity}
                onClick={() => choose(listId, half, activity)}
                className={`rounded-3xl p-5 text-left transition active:scale-95 shadow-lg ${
                  isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                    : isDone
                      ? 'bg-green-100 hover:bg-green-200 text-green-900'
                      : 'bg-white hover:bg-blue-50 text-slate-800'
                }`}
              >
                <div className="text-xs font-bold opacity-80">활동 {activity + 1}</div>
                <div className="text-2xl font-extrabold flex items-center gap-2 mt-1">
                  {kind}
                  {isDone && <span className="text-xl">⭐</span>}
                </div>
              </button>
            );
          })}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <header className="flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-blue-700 font-extrabold text-2xl">📖 공부할 LIST 고르기</div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-4 pb-2 text-center text-sm font-bold text-slate-600">
        먼저 서브리스트(LIST X-1 / X-2)를 고르세요
      </div>

      <main className="flex-1 p-4 space-y-4">
        {WEEKS.map((wk) => {
          const subCount = numSubLists(wk.id);
          const totalCells = subCount * 5;
          const all = listDone(wk.id).slice(0, totalCells);
          const completedCells = all.filter(Boolean).length;
          const num = listNumber(wk.id);
          const halves: Half[] = subCount === 1 ? [0] : [0, 1];
          return (
            <section key={wk.id} className="bg-white rounded-3xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="text-xl font-extrabold text-blue-700">
                  {LIST_LABEL[wk.id]}
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {completedCells}/{totalCells} 완료
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {halves.map((half) => {
                  const words = subListWords(wk.id, half);
                  const subDone = all.slice(half * 5, half * 5 + 5);
                  const doneCount = subDone.filter(Boolean).length;
                  const isCurrent =
                    progress.currentWeek === wk.id &&
                    progress.currentSubList === half;
                  return (
                    <button
                      key={half}
                      onClick={() => setPicked({ listId: wk.id, half })}
                      className={`rounded-2xl p-4 text-left transition active:scale-95 shadow ${
                        isCurrent
                          ? 'bg-blue-500 text-white ring-4 ring-blue-300'
                          : doneCount === 5
                            ? 'bg-green-100 hover:bg-green-200 text-green-900'
                            : 'bg-slate-50 hover:bg-blue-50 text-slate-800'
                      }`}
                    >
                      <div className="font-extrabold text-lg flex items-center gap-1">
                        LIST {num}-{half + 1}
                        {doneCount === 5 && <span className="text-base">⭐</span>}
                      </div>
                      <div
                        className={`text-sm font-bold mt-1 ${
                          isCurrent
                            ? 'text-blue-100'
                            : doneCount === 5
                              ? 'text-green-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {words.map((w) => w.text).join(', ')}
                      </div>
                      <div
                        className={`text-xs font-bold mt-2 ${
                          isCurrent ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        활동 {doneCount}/5 완료
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
