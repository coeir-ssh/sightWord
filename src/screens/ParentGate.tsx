import { useState } from 'react';
import { storage } from '../lib/storage';
import { WEEK_IDS, LIST_LABEL, type WeekId } from '../data/words';
import { useProgress } from '../lib/state';

type Props = { onBack: () => void };

export function ParentGate({ onBack }: Props) {
  const { progress, setWeek } = useProgress();
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const correctPin = storage.getParentPin();

  const submit = () => {
    if (pin === correctPin) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-3xl font-extrabold text-slate-700">🔒 부모용</div>
        <div className="text-slate-600">PIN을 입력하세요 (기본 1004)</div>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="bg-white rounded-2xl px-6 py-4 text-3xl font-bold shadow text-center w-48"
          maxLength={6}
        />
        {error && <div className="text-red-500 font-bold">PIN이 맞지 않아요</div>}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white rounded-2xl shadow font-bold text-slate-700"
          >
            취소
          </button>
          <button
            onClick={submit}
            className="px-6 py-3 bg-blue-500 rounded-2xl shadow font-bold text-white"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-6 gap-6">
      <header className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← 홈
        </button>
        <div className="text-2xl font-extrabold text-slate-700">부모 설정</div>
        <div className="w-20" />
      </header>

      <section className="bg-white rounded-3xl shadow p-5">
        <div className="text-lg font-bold text-slate-700 mb-3">이번 주 List 선택</div>
        <div className="grid grid-cols-4 gap-3">
          {WEEK_IDS.map((id: WeekId) => (
            <button
              key={id}
              onClick={() => setWeek(id)}
              className={`rounded-2xl py-3 px-2 text-base font-extrabold shadow transition ${
                progress.currentWeek === id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {LIST_LABEL[id]}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow p-5">
        <div className="text-lg font-bold text-slate-700 mb-3">데이터 관리</div>
        <button
          onClick={() => {
            if (confirm('진행도, 코인, 인벤토리를 모두 초기화할까요?')) {
              storage.reset();
              location.reload();
            }
          }}
          className="px-6 py-3 bg-red-500 text-white rounded-2xl shadow font-bold"
        >
          모두 초기화
        </button>
      </section>
    </div>
  );
}
