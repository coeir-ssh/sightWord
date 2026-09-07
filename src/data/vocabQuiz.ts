// Vocabulary Quiz — a Sight-Word-style track where the child hears a full
// sentence and traces / writes back the highlighted target words. The card
// data is transcribed from the classroom "Vocabulary Quiz List X" prints.
//
// Steps (fixed order, each awards 300 coins on finish):
//   1) trace-all     · sentence auto-plays; every target letter is a dotted
//                     guide, child traces over it. In-order sentences.
//   2) trace-all     · same, but the sentence order is shuffled per session.
//   3) trace-partial · only the first letter of each target is a guide, the
//                     rest are blank slots the child writes from memory. In
//                     order.
//   4) trace-partial · same, shuffled.
//   5) trace-none    · target words become a full blank; the sentence is
//                     read aloud with the word "blank" in the target spot,
//                     and the child writes the whole target from memory.
//   6) trace-none    · same, shuffled.

export type VocabQuizItem = {
  /** The whole sentence, with the target words appearing verbatim inside it. */
  sentence: string;
  /** Highlighted target words/phrases (in reading order). Multi-word phrases
   *  like "walk across" or "late for" are one target string with a space. */
  targets: string[];
};

export type VocabQuizList = {
  id: string;   // e.g. 'VQ-1'
  label: string; // 'List 1'
  date?: string; // '8월 19일 수요일'
  items: VocabQuizItem[];
};

export type VocabQuizStepKind = 'trace-all' | 'trace-partial' | 'trace-none';

export type VocabQuizStep = {
  kind: VocabQuizStepKind;
  label: string;
  /** When true, the sentence order is shuffled each time the child re-enters
   *  this step. When false, the sentences play in the printed order. */
  shuffle: boolean;
};

// The fixed 5-step curriculum shared by every list. The old ordered
// "Write from Memory" step was dropped so the final step is the shuffled
// memory quiz — same difficulty progression, one fewer round.
export const VOCAB_QUIZ_STEPS: VocabQuizStep[] = [
  { kind: 'trace-all',     label: 'Trace the Target Words',       shuffle: false },
  { kind: 'trace-all',     label: 'Trace — Mixed Order',          shuffle: true  },
  { kind: 'trace-partial', label: 'First-Letter Hint',            shuffle: false },
  { kind: 'trace-partial', label: 'First-Letter Hint (Mixed)',    shuffle: true  },
  { kind: 'trace-none',    label: 'Write from Memory (Mixed)',    shuffle: true  },
];

export const VOCAB_QUIZ_LISTS: VocabQuizList[] = [
  {
    id: 'VQ-1',
    label: 'List 1',
    date: '8월 19일 수요일',
    items: [
      {
        sentence: "The greedy boy doesn't want to share his toys.",
        targets: ['greedy', 'share'],
      },
      { sentence: 'I munch on bread.',       targets: ['munch', 'on']    },
      { sentence: 'I gulp down water.',      targets: ['gulp', 'down']   },
      { sentence: 'My sister is picky about food.', targets: ['picky', 'about'] },
      { sentence: 'She licks her ice cream.', targets: ['licks']         },
    ],
  },
  {
    id: 'VQ-2',
    label: 'List 2',
    date: '8월 26일 수요일',
    items: [
      { sentence: 'She is late for school.',              targets: ['late for']    },
      { sentence: 'We walk across the street.',           targets: ['walk across'] },
      { sentence: 'This sign means turn left.',           targets: ['turn left']   },
      { sentence: 'She falls asleep on the sofa.',        targets: ['falls asleep'] },
      { sentence: 'I pick up shells on the beach.',       targets: ['pick up']     },
    ],
  },
  {
    id: 'VQ-4',
    label: 'List 4',
    date: '9월 9일 수요일',
    items: [
      { sentence: 'The boy slipped on the ice.',     targets: ['slipped']     },
      { sentence: 'She tiptoed along the beach.',    targets: ['tiptoed']     },
      { sentence: 'Go straight and turn left.',      targets: ['Go straight'] },
      { sentence: 'Who can fix my broken car?',      targets: ['broken car']  },
      { sentence: 'She is making a silly face.',     targets: ['silly face']  },
    ],
  },
];

export const VOCAB_QUIZ_IDS = VOCAB_QUIZ_LISTS.map((l) => l.id);

export function getVocabQuizList(id: string): VocabQuizList {
  return VOCAB_QUIZ_LISTS.find((l) => l.id === id) ?? VOCAB_QUIZ_LISTS[0];
}

/**
 * Read-aloud form of a sentence for step-5/6: the target words are replaced
 * by the literal word "blank" (matching how Show and Tell reads its blanks).
 * Case-insensitive substring replacement so "greedy" inside "The greedy boy"
 * gets swapped without disturbing surrounding text.
 */
export function sentenceForBlankRead(item: VocabQuizItem): string {
  let out = item.sentence;
  for (const target of item.targets) {
    // Match the target as a whole phrase, case-insensitively, once per
    // occurrence in reading order. We match the exact source phrase — the
    // vocabulary lists don't repeat a phrase across targets in one line.
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'i'), 'blank');
  }
  return out;
}

/**
 * Split a sentence into segments that are either regular text or a target
 * phrase to highlight. Used by the UI to render the sentence with yellow
 * pills around each target word.
 */
export type SentenceSegment =
  | { kind: 'text'; value: string }
  | { kind: 'target'; value: string; targetIndex: number };

export function splitSentenceByTargets(item: VocabQuizItem): SentenceSegment[] {
  const out: SentenceSegment[] = [];
  let rest = item.sentence;
  item.targets.forEach((target, targetIndex) => {
    const idx = rest.toLowerCase().indexOf(target.toLowerCase());
    if (idx === -1) return; // target not found — render as plain text
    if (idx > 0) out.push({ kind: 'text', value: rest.slice(0, idx) });
    out.push({ kind: 'target', value: rest.slice(idx, idx + target.length), targetIndex });
    rest = rest.slice(idx + target.length);
  });
  if (rest.length > 0) out.push({ kind: 'text', value: rest });
  return out;
}
