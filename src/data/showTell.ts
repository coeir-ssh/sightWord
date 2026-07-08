// Show and Tell scripts — short English presentations organized by month.
// Worksheet chapters contain blanks marked with `___` (three underscores)
// that the child types in themselves; the typed answers are saved. Coins +
// character customization are shared with the Sight Word side; only the
// left-hand learning UI differs.

export type ShowTellScript = {
  id: string;
  title: string; // English title shown on cards/buttons
  titleKo: string; // Korean hint for the parent/child
  emoji: string;
  /** Month label for worksheet-style chapters (June, July, …). */
  month?: string;
  /** Sentences. `___` is a blank the child fills in. */
  sentences: string[];
};

// Blank marker — three underscores. Used by the UI to split a sentence
// into text segments + input slots.
export const BLANK = '___';

export const SHOW_TELL_SCRIPTS: ShowTellScript[] = [
  // ───────── Worksheet chapters (월별) ─────────
  {
    id: 'favorite-animal',
    title: 'My Favorite Animal',
    titleKo: '내가 좋아하는 동물',
    emoji: '🦁',
    month: 'June',
    sentences: [
      'My favorite animal is a(n) ___.',
      'It lives in the ___.',
      'It is very ___ and has ___.',
      'My favorite animal eats ___.',
      'I want to see one in real life.',
      'Do you have a favorite animal? What is yours?',
    ],
  },
  {
    id: 'favorite-sport',
    title: 'My Favorite Sport',
    titleKo: '내가 좋아하는 스포츠',
    emoji: '⚽',
    month: 'July',
    sentences: [
      'My favorite sport is ___.',
      'I am good at ___.',
      'I can play it (outside/inside).',
      'It is fun to play ___.',
      'It is my favorite because ___.',
      'What is your favorite sport?',
    ],
  },
  {
    id: 'summer-vacation',
    title: 'Summer Vacation',
    titleKo: '여름 방학',
    emoji: '🏖️',
    month: 'July',
    sentences: [
      'For Summer vacation, I will go ___ with my ___.',
      'I want to ___ there and eat ___ while I am there.',
      "I can't wait to go ___.",
      'I hope you have a great summer vacation everyone!',
    ],
  },
  {
    id: 'healthy-habits',
    title: 'My Healthy Habits',
    titleKo: '나의 건강한 습관',
    emoji: '🪥',
    month: 'August',
    sentences: [
      'I learned about healthy habits.',
      'Every night, I ___.',
      'It is important to do it.',
      'I ___ every day.',
      "I don't usually ___, but I am trying to do it more.",
      'My favorite healthy habit is ___.',
      'What about you?',
    ],
  },
  {
    id: 'earth',
    title: 'Earth',
    titleKo: '지구',
    emoji: '🌍',
    month: 'August',
    sentences: [
      'My favorite planet is Earth.',
      'Earth is ___ and ___.',
      'I think the colors are very ___.',
      'So many things live on earth.',
      '___ and ___ are my favorite animals on earth.',
      'I think our planet is beautiful!',
    ],
  },
  {
    id: 'dream-job',
    title: 'My Dream Job',
    titleKo: '나의 꿈',
    emoji: '🚒',
    month: 'September',
    sentences: [
      'I will tell you about my dream job.',
      'I want to be a ___ because it looks ___.',
      'They work in a(n) ___.',
      '___ need ___ and ___.',
      'What do you want to be?',
    ],
  },
  {
    id: 'chuseok',
    title: 'Chuseok',
    titleKo: '추석',
    emoji: '🌕',
    month: 'September',
    sentences: [
      'Chuseok is celebrated on ___.',
      'I celebrate Chuseok with my ___.',
      'On Chuseok we eat ___.',
      'I like to play ___ too!',
      'My favorite thing to do on Chuseok is ___.',
      'Happy Chuseok!',
    ],
  },
  {
    id: 'my-country',
    title: 'My Country',
    titleKo: '우리 나라',
    emoji: '🇰🇷',
    month: 'October',
    sentences: [
      'I live in Seoul, Korea.',
      'The most popular food in my country is called ___.',
      "Even though it's the most popular, my favorite food is ___.",
      'Our flag is called the ___.',
      'The best thing about my country is the ___.',
      'I am so proud of my country!',
    ],
  },
  {
    id: 'the-world',
    title: 'The World',
    titleKo: '세계',
    emoji: '🗺️',
    month: 'October',
    sentences: [
      'There are so many countries in the world.',
      'I want to visit ___.',
      'Next, I hope to travel to ___.',
      'I want to go with my ___.',
      'We will ___ together.',
      'Thank you for listening!',
    ],
  },
  {
    id: 'transportation',
    title: 'Transportation',
    titleKo: '교통수단',
    emoji: '🚌',
    month: 'November',
    sentences: [
      'How do you go to school?',
      'I go to school by ___.',
      'Sometimes, I take the ___ to ___.',
      'I often travel by ___ with my mom and dad.',
      'My favorite way to travel is by ___.',
      'What about you? How do you go to school?',
    ],
  },
  {
    id: 'outer-space',
    title: 'Outer Space',
    titleKo: '우주',
    emoji: '🚀',
    month: 'November',
    sentences: [
      'I want to travel to space.',
      'I want to see the ___.',
      'I want to try to eat ___.',
      'I want to ___ in space.',
      'I will need to wear a ___ and ___.',
      'It will be so much fun!',
    ],
  },
  {
    id: 'winter',
    title: 'Winter',
    titleKo: '겨울',
    emoji: '❄️',
    month: 'December',
    sentences: [
      'Winter is cold but beautiful.',
      'The months of winter are ___, ___, and ___.',
      'I want to ___ in winter.',
      'My favorite winter sport is ___.',
      'You can only do it in winter.',
      'What about you? Do you like winter?',
    ],
  },
  {
    id: 'christmas',
    title: 'Christmas',
    titleKo: '크리스마스',
    emoji: '🎄',
    month: 'December',
    sentences: [
      'Dear Santa,',
      'These are the things I want for Christmas.',
      'First, I want a ___.',
      "Next, I'd like a ___.",
      'I like this because ___.',
      'Finally, I want a ___.',
      'I enjoy receiving presents on Christmas Day.',
      'Thank you, Santa!',
    ],
  },
  {
    id: 'new-years-day',
    title: "New Year's Day",
    titleKo: '새해 첫날',
    emoji: '🎆',
    month: 'January',
    sentences: [
      'Happy New Year!',
      "Do you have a New Year's Resolution?",
      'My resolution is to ___.',
      'Last year, it was hard to ___.',
      'This year, I want to focus on ___.',
      "What is your New Year's Resolution?",
    ],
  },
  {
    id: 'when-i-was-a-baby',
    title: 'When I Was a Baby',
    titleKo: '내가 아기였을 때',
    emoji: '👶',
    month: 'January',
    sentences: [
      'When I was a baby, I could ___ and ___.',
      "When I was a baby, I couldn't ___ or ___.",
      'Now I can ___.',
      'I can also ___ now.',
      'I am happy that I can do all of these things now that I am older.',
    ],
  },
  {
    id: 'art',
    title: 'Art',
    titleKo: '미술',
    emoji: '🎨',
    month: 'February',
    sentences: [
      'Who is your favorite artist?',
      'My favorite artist is ___.',
      'I like him/her because the artworks are ___.',
      'For my art piece, I used the colors ___, ___, and ___.',
      'What do you think of my art? Do you like it?',
    ],
  },
  {
    id: 'graduation',
    title: 'Graduation',
    titleKo: '졸업',
    emoji: '🎓',
    month: 'February',
    sentences: [
      'I am 7 years old now.',
      'I will be going to ___ class.',
      'I am so ___ to go to a new class with all of my friends.',
      'I learned so many things this year.',
      'My favorite class was ___.',
      'I liked it because ___.',
      'I hope my new class will be fun.',
      'Thank you for a wonderful year, friends and teachers!',
    ],
  },
];

export const SHOW_TELL_IDS = SHOW_TELL_SCRIPTS.map((s) => s.id);

export function getShowTellScript(id: string): ShowTellScript {
  return SHOW_TELL_SCRIPTS.find((s) => s.id === id) ?? SHOW_TELL_SCRIPTS[0];
}

// Label used to group the original "memorize-as-is" scripts that have no
// curriculum month of their own.
export const BASIC_GROUP_LABEL = 'Basic';

export type ShowTellGroup = { month: string; scripts: ShowTellScript[] };

// Group chapters by month, preserving the array's curriculum order
// (Basic → June → July → … → February). Consecutive chapters that share a
// month collapse into one group so the picker can print a single month header.
export function groupShowTellByMonth(): ShowTellGroup[] {
  const groups: ShowTellGroup[] = [];
  for (const s of SHOW_TELL_SCRIPTS) {
    const label = s.month ?? BASIC_GROUP_LABEL;
    const last = groups[groups.length - 1];
    if (last && last.month === label) last.scripts.push(s);
    else groups.push({ month: label, scripts: [s] });
  }
  return groups;
}

// A "slot" is something the child fills in: a typed blank (`___`) or a
// pick-one choice written as a parenthetical with a slash, e.g.
// "(outside/inside)". Parentheses WITHOUT a slash (like "a(n)") are plain
// text, not a choice.
export type Slot =
  | { kind: 'blank' }
  | { kind: 'choice'; options: string[] };

/** Split a sentence into text segments + fill slots (blanks and choices). */
export type SentencePart =
  | { kind: 'text'; value: string }
  | { kind: 'blank'; index: number }
  | { kind: 'choice'; index: number; options: string[] };

const SLOT_SOURCE = '___|\\(([^()]*\\/[^()]*)\\)';

export function splitSentence(sentence: string): SentencePart[] {
  const out: SentencePart[] = [];
  const re = new RegExp(SLOT_SOURCE, 'g');
  let last = 0;
  let index = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sentence)) !== null) {
    if (m.index > last) out.push({ kind: 'text', value: sentence.slice(last, m.index) });
    if (m[0] === BLANK) {
      out.push({ kind: 'blank', index });
    } else {
      const options = m[1]
        .split('/')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      out.push({ kind: 'choice', index, options });
    }
    index += 1;
    last = m.index + m[0].length;
  }
  if (last < sentence.length) out.push({ kind: 'text', value: sentence.slice(last) });
  return out;
}

/** The ordered fill slots in a sentence. */
export function getSlots(sentence: string): Slot[] {
  return splitSentence(sentence)
    .filter((p): p is Exclude<SentencePart, { kind: 'text' }> => p.kind !== 'text')
    .map((p): Slot =>
      p.kind === 'blank' ? { kind: 'blank' } : { kind: 'choice', options: p.options }
    );
}

/** Count fill slots in a sentence. */
export function countSlots(sentence: string): number {
  return getSlots(sentence).length;
}

/** Total number of fill slots across all sentences in a script. */
export function totalSlots(script: ShowTellScript): number {
  return script.sentences.reduce((sum, s) => sum + countSlots(s), 0);
}

export type ShowTellStep = {
  kind: 'fill' | 'learn' | 'cue' | 'recite';
  /** For cue steps: how many leading words of each sentence to show/read. */
  words?: number;
  label: string;
};

// The ordered learning steps for a chapter. After Fill and Listen & Repeat,
// the cue steps fade the prompt from the first 4 words down to 1, and finally
// the child presents the whole thing from memory with nothing shown.
export function showTellSteps(script: ShowTellScript): ShowTellStep[] {
  const steps: ShowTellStep[] = [];
  if (totalSlots(script) > 0) steps.push({ kind: 'fill', label: 'Fill in the Blanks' });
  steps.push({ kind: 'learn', label: 'Listen & Repeat' });
  steps.push({ kind: 'cue', words: 4, label: 'First 4 Words' });
  steps.push({ kind: 'cue', words: 3, label: 'First 3 Words' });
  steps.push({ kind: 'cue', words: 2, label: 'First 2 Words' });
  steps.push({ kind: 'cue', words: 1, label: 'First 1 Word' });
  steps.push({ kind: 'recite', label: 'Present from Memory' });
  return steps;
}

/** Replace each slot with its fill (in order); a placeholder if still empty. */
export function fillSentence(sentence: string, fills: string[]): string {
  return splitSentence(sentence)
    .map((p) => {
      if (p.kind === 'text') return p.value;
      const v = (fills[p.index] ?? '').trim();
      if (v) return v;
      return p.kind === 'blank' ? '___' : `(${p.options.join('/')})`;
    })
    .join('');
}
