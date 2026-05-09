export type Word = { id: string; text: string };

export type ListId =
  | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
  | 'L7' | 'L8' | 'L9' | 'L10' | 'L11';

// Kept name for backward compat with existing screens — semantically a "list".
export type WeekId = ListId;
export type Week = { id: ListId; words: Word[] };

export type Half = 0 | 1;

const w = (text: string): Word => ({ id: text, text });

// All lists below are typed exactly from the printed Kindergarten Sight Words
// cards provided by the parent. Order within each list is left-column then
// right-column on the original card. Each list's 10 words split into two
// 5-word sub-lists: half 0 = words[0..4] (LIST X-1), half 1 = words[5..9]
// (LIST X-2).
export const WEEKS: Week[] = [
  // L1 — from photo
  { id: 'L1', words: ['I', 'you', 'red', 'play', 'green', 'the', 'to', 'my', 'we', 'make'].map(w) },
  // L2 — from photo
  { id: 'L2', words: ['an', 'go', 'yellow', 'for', 'do', 'is', 'and', 'like', 'blue', 'was'].map(w) },
  // L3 — from photo
  { id: 'L3', words: ['by', 'purple', 'from', 'that', 'had', 'are', 'little', 'he', 'they', 'has'].map(w) },
  // L4 — from photo
  { id: 'L4', words: ['down', 'brown', 'said', 'with', 'her', 'black', 'have', 'two', 'will', 'his'].map(w) },
  // L5 — from photo
  { id: 'L5', words: ['see', 'as', 'can', 'one', 'of', 'orange', 'all', 'she', 'this', 'him'].map(w) },
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
  // L11 — from photo (only 5 words on this card → just one sub-list)
  { id: 'L11', words: ['then', 'pink', 'nine', 'white', 'a'].map(w) },
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

export function listNumber(id: WeekId): number {
  return Number(id.replace('L', ''));
}

/** Number of 5-word sub-lists in this list (1 or 2). */
export function numSubLists(id: WeekId): number {
  return Math.max(1, Math.ceil(getWeek(id).words.length / 5));
}

/** The 5 (or fewer) words for one half of a list. */
export function subListWords(id: WeekId, half: Half): Word[] {
  const all = getWeek(id).words;
  return all.slice(half * 5, half * 5 + 5);
}

/** Sub-list label like "LIST 1-1" or "LIST 1-2". */
export function subListLabel(id: WeekId, half: Half): string {
  return `LIST ${listNumber(id)}-${half + 1}`;
}
