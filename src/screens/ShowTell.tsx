import { useEffect, useState } from 'react';
import { CoinHUD } from '../components/CoinHUD';
import { CoinFly } from '../components/CoinFly';
import { Character3D } from '../components/Character3D';
import { Coin } from '../components/Coin';
import {
  useCharGender,
  useCharName,
  useInventory,
  useShowTellScript,
  useSuperMode,
  useWallet,
} from '../lib/state';
import { getShowTellScript } from '../data/showTell';
import { speak } from '../lib/tts';

type Props = {
  onBack: () => void;
};

// Two passes through the script:
//  - 'learn'  : every sentence is shown + read aloud so the child learns it.
//  - 'recite' : the sentence is hidden; the child presents it from memory,
//               then reveals to self-check. Coins are awarded per sentence.
type Phase = 'learn' | 'recite';

const PER_SENTENCE_COINS = 5;
const COMPLETE_BONUS = 10;

export function ShowTell({ onBack }: Props) {
  const { scriptId } = useShowTellScript();
  const { wallet, addCoins } = useWallet();
  const { gender } = useCharGender();
  const { inventory } = useInventory(gender);
  const { name: charName } = useCharName();
  const { superMode } = useSuperMode();
  const multiplier = superMode ? 2 : 1;

  const script = getShowTellScript(scriptId);
  const total = script.sentences.length;

  const [phase, setPhase] = useState<Phase>('learn');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [completed, setCompleted] = useState<null | { coins: number; bonus: number }>(null);

  const cur = script.sentences[idx];

  // Auto-read the sentence when it first appears in the learn phase. In the
  // recite phase we stay silent so the child recalls it on their own (they
  // can tap 🔊 to check). cur/phase in deps so each new sentence re-fires.
  useEffect(() => {
    if (phase === 'learn' && !completed) {
      void speak(cur);
    }
  }, [phase, idx, completed, cur]);

  const award = () => {
    const perSentence = PER_SENTENCE_COINS * multiplier;
    addCoins(perSentence);
    setCoinTrigger((n) => n + 1);
    setJumping(true);
    setTimeout(() => setJumping(false), 700);
  };

  const nextLearn = () => {
    if (idx + 1 >= total) {
      setPhase('recite');
      setIdx(0);
      setRevealed(false);
    } else {
      setIdx((n) => n + 1);
    }
  };

  const passRecite = () => {
    award();
    if (idx + 1 >= total) {
      const bonus = COMPLETE_BONUS * multiplier;
      addCoins(bonus);
      setCompleted({ coins: total * PER_SENTENCE_COINS * multiplier, bonus });
    } else {
      setIdx((n) => n + 1);
      setRevealed(false);
    }
  };

  if (completed) {
    const sum = completed.coins + completed.bonus;
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-6xl">🎤🎉</div>
        <div className="text-4xl font-extrabold text-blue-700 text-center">
          {script.emoji} {script.title} Complete!
        </div>
        <div className="flex gap-2 text-5xl">⭐⭐⭐</div>

        <div className="bg-white rounded-3xl px-8 py-5 shadow-lg space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">Sentences</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completed.coins}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-700">Completion Bonus</span>
            <div className="flex items-center gap-1">
              <Coin size={26} />
              <span className="font-extrabold text-yellow-800">+{completed.bonus}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-6 pt-2 border-t-2 border-slate-300">
            <span className="font-extrabold text-slate-800 text-lg">Total</span>
            <div className="flex items-center gap-1">
              <Coin size={32} />
              <span className="font-extrabold text-yellow-700 text-2xl">+{sum}</span>
            </div>
          </div>
        </div>

        <div className="w-64 h-64">
          <Character3D equipped={inventory.equipped} jumping name={charName} gender={gender} />
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-2xl font-extrabold rounded-2xl shadow-lg"
        >
          🏠 Home
        </button>
      </div>
    );
  }

  const phaseLabel =
    phase === 'learn' ? 'Step 1 · Listen & Repeat' : 'Step 2 · Present from Memory';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-soft to-blue-100 flex flex-col">
      <CoinFly triggerKey={coinTrigger} />
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-sky-soft to-sky-soft/95 backdrop-blur shadow-sm">
        <button
          onClick={onBack}
          className="bg-white rounded-2xl px-4 py-2 shadow font-bold text-slate-700"
        >
          ← Home
        </button>
        <div className="flex flex-col items-center">
          <div className="text-blue-700 font-extrabold text-xl">
            {script.emoji} {script.title}
          </div>
          <div className="text-slate-600 font-bold text-xs mt-0.5">{phaseLabel}</div>
          {superMode && (
            <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow">
              🦸‍♂️ SUPER MODE · 2x Coins
            </div>
          )}
        </div>
        <CoinHUD coins={wallet.coins} />
      </header>

      <div className="px-6">
        <div className="h-3 bg-white rounded-full overflow-hidden shadow">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((idx + (jumping ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <div className="text-center text-slate-600 mt-1 text-sm font-bold">
          {idx + 1} / {total}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg p-8 w-full max-w-3xl flex flex-col items-center gap-6">
          {phase === 'learn' ? (
            <>
              <div className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 leading-snug">
                {cur}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => void speak(cur)}
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-6 py-3 text-xl font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen Again
                </button>
                <button
                  onClick={nextLearn}
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-2xl px-8 py-3 text-xl font-extrabold shadow-lg"
                >
                  {idx + 1 >= total ? 'Memorize ▶' : 'Next ▶'}
                </button>
              </div>
            </>
          ) : (
            <>
              {revealed ? (
                <div className="text-center text-3xl md:text-4xl font-extrabold text-slate-800 leading-snug">
                  {cur}
                </div>
              ) : (
                <div className="text-center text-2xl font-extrabold text-slate-400 leading-snug py-6">
                  🙈 Hidden
                  <div className="text-base font-bold text-slate-400 mt-2">
                    Say it out loud from memory!
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => void speak(cur)}
                  className="bg-white border-2 border-blue-200 hover:bg-blue-50 active:scale-95 rounded-2xl px-5 py-3 text-lg font-extrabold text-blue-700 shadow"
                >
                  🔊 Listen
                </button>
                <button
                  onClick={() => setRevealed((v) => !v)}
                  className="bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-95 rounded-2xl px-5 py-3 text-lg font-extrabold text-slate-700 shadow"
                >
                  {revealed ? '🙈 Hide' : '👀 Reveal'}
                </button>
                <button
                  onClick={passRecite}
                  className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl px-7 py-3 text-lg font-extrabold shadow-lg"
                >
                  ✅ Got it!
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
