export type Word = { id: string; text: string };

export type ListNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ListId =
  | `L${ListNum}-1`
  | `L${ListNum}-2`
  | 'L11';

// Kept name for backward compat with existing screens — semantically a "list".
export type WeekId = ListId;
export type Week = { id: ListId; words: Word[] };

const w = (text: string): Word => ({ id: text, text });

// Source data, typed exactly from the printed Kindergarten Sight Words cards.
// Order within each list is left-column then right-column on the original card.
// Each list of 10 words is split into two sub-lists of 5 (left half / right half).
// L11 has only 5 words and is not split.
const RAW_LISTS: { num: number; words: string[] }[] = [
  { num: 1, words: ['I', 'you', 'red', 'play', 'green', 'the', 'to', 'my', 'we', 'make'] },
  { num: 2, words: ['an', 'go', 'yellow', 'for', 'do', 'is', 'and', 'like', 'blue', 'was'] },
  { num: 3, words: ['by', 'purple', 'from', 'that', 'had', 'are', 'little', 'he', 'they', 'has'] },
  { num: 4, words: ['down', 'brown', 'said', 'with', 'her', 'black', 'have', 'two', 'will', 'his'] },
  { num: 5, words: ['see', 'as', 'can', 'one', 'of', 'orange', 'all', 'she', 'this', 'him'] },
  { num: 6, words: ['at', 'am', 'it', 'up', 'no', 'yes', 'in', 'eat', 'us', 'on'] },
  { num: 7, words: ['come', 'be', 'big', 'what', 'run', 'off', 'here', 'so', 'want', 'love'] },
  { num: 8, words: ['but', 'got', 'not', 'too', 'why', 'first', 'new', 'there', 'look', 'three'] },
  { num: 9, words: ['six', 'where', 'day', 'could', 'me', 'when', 'jump', 'went', 'four', 'ten'] },
  { num: 10, words: ['get', 'away', 'came', 'five', 'seven', 'eight', 'your', 'because', 'out', 'who'] },
  { num: 11, words: ['will', 'walk', 'work', 'were', 'with'] },
];

export const WEEKS: Week[] = RAW_LISTS.flatMap((r) => {
  if (r.words.length <= 5) {
    return [{ id: `L${r.num}` as ListId, words: r.words.map(w) }];
  }
  const left = r.words.slice(0, 5);
  const right = r.words.slice(5, 10);
  return [
    { id: `L${r.num}-1` as ListId, words: left.map(w) },
    { id: `L${r.num}-2` as ListId, words: right.map(w) },
  ];
});

export const WEEK_IDS = WEEKS.map((wk) => wk.id);

export const LIST_LABEL: Record<ListId, string> = Object.fromEntries(
  WEEKS.map((wk) => [wk.id, `LIST ${wk.id.replace(/^L/, '')}`])
) as Record<ListId, string>;

export function getWeek(id: WeekId): Week {
  const wk = WEEKS.find((x) => x.id === id);
  if (!wk) throw new Error(`Unknown list: ${id}`);
  return wk;
}

export function listNumber(id: WeekId): number {
  const m = /^L(\d+)/.exec(id);
  return m ? Number(m[1]) : 0;
}

/** Sub-list label like "LIST 1-1". For backward-compat callers; identical to LIST_LABEL[id]. */
export function subListLabel(id: WeekId, _day?: number): string {
  return LIST_LABEL[id];
}
