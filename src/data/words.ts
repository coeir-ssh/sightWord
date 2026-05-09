export type Word = { id: string; text: string };

export type ListId =
  | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
  | 'L7' | 'L8' | 'L9' | 'L10' | 'L11';

// Kept name for backward compat with existing screens — semantically a "list".
export type WeekId = ListId;
export type Week = { id: ListId; words: Word[] };

const w = (text: string): Word => ({ id: text, text });

// NOTE: Lists 6–10 below are taken directly from the Kindergarten Sight Words
// printed cards provided by the parent. Lists 1–5 and 11 are placeholders
// (common Dolch / Fry kindergarten progression) until the actual cards are
// shared — replace those rows freely without touching the data shape.
export const WEEKS: Week[] = [
  // L1 — placeholder
  { id: 'L1', words: ['I', 'a', 'the', 'see', 'go', 'can', 'my', 'to', 'is', 'you'].map(w) },
  // L2 — placeholder
  { id: 'L2', words: ['we', 'like', 'look', 'said', 'this', 'that', 'do', 'here', 'me', 'and'].map(w) },
  // L3 — placeholder
  { id: 'L3', words: ['red', 'blue', 'green', 'yellow', 'one', 'two', 'three', 'four', 'five', 'color'].map(w) },
  // L4 — placeholder
  { id: 'L4', words: ['little', 'big', 'find', 'make', 'jump', 'run', 'play', 'help', 'down', 'up'].map(w) },
  // L5 — placeholder
  { id: 'L5', words: ['for', 'with', 'was', 'are', 'all', 'on', 'in', 'at', 'of', 'said'].map(w) },
  // L6 — from photo
  { id: 'L6', words: ['at', 'am', 'it', 'up', 'no', 'yes', 'in', 'eat', 'us', 'on'].map(w) },
  // L7 — from photo
  { id: 'L7', words: ['come', 'be', 'big', 'what', 'run', 'off', 'here', 'so', 'want', 'love'].map(w) },
  // L8 — from photo
  { id: 'L8', words: ['but', 'got', 'not', 'too', 'why', 'first', 'new', 'there', 'look', 'three'].map(w) },
  // L9 — from photo
  { id: 'L9', words: ['six', 'where', 'day', 'could', 'me', 'when', 'jump', 'went', 'four', 'ten'].map(w) },
  // L10 — from photo
  { id: 'L10', words: ['get', 'away', 'came', 'five', 'seven', 'eight', 'your', 'because', 'out', 'who'].map(w) },
  // L11 — placeholder
  { id: 'L11', words: ['will', 'walk', 'work', 'were', 'with', 'what', 'when', 'where', 'who', 'why'].map(w) },
];

export const WEEK_IDS = WEEKS.map((wk) => wk.id);

export const LIST_LABEL: Record<ListId, string> = {
  L1: 'List 1', L2: 'List 2', L3: 'List 3', L4: 'List 4',
  L5: 'List 5', L6: 'List 6', L7: 'List 7', L8: 'List 8',
  L9: 'List 9', L10: 'List 10', L11: 'List 11',
};

export function getWeek(id: WeekId): Week {
  const wk = WEEKS.find((w) => w.id === id);
  if (!wk) throw new Error(`Unknown list: ${id}`);
  return wk;
}
