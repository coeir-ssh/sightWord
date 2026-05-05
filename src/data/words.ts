export type Word = { id: string; text: string };

export type WeekId =
  | '1-1' | '1-2'
  | '2-1' | '2-2'
  | '3-1' | '3-2'
  | '4-1' | '4-2'
  | '5-1' | '5-2';

export type Week = { id: WeekId; words: Word[] };

const w = (text: string): Word => ({ id: text, text });

export const WEEKS: Week[] = [
  { id: '1-1', words: ['I', 'a', 'is', 'the', 'go'].map(w) },
  { id: '1-2', words: ['to', 'see', 'me', 'we', 'my'].map(w) },
  { id: '2-1', words: ['like', 'and', 'it', 'in', 'on'].map(w) },
  { id: '2-2', words: ['can', 'you', 'do', 'no', 'up'].map(w) },
  { id: '3-1', words: ['look', 'at', 'this', 'that', 'big'].map(w) },
  { id: '3-2', words: ['little', 'are', 'play', 'run', 'jump'].map(w) },
  { id: '4-1', words: ['come', 'here', 'help', 'said', 'red'].map(w) },
  { id: '4-2', words: ['blue', 'green', 'yellow', 'one', 'two'].map(w) },
  { id: '5-1', words: ['three', 'four', 'five', 'six', 'seven'].map(w) },
  { id: '5-2', words: ['eight', 'nine', 'ten', 'good', 'happy'].map(w) },
];

export const WEEK_IDS = WEEKS.map((wk) => wk.id);

export function getWeek(id: WeekId): Week {
  const wk = WEEKS.find((w) => w.id === id);
  if (!wk) throw new Error(`Unknown week: ${id}`);
  return wk;
}
