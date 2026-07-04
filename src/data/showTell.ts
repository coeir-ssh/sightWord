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

/** Split a sentence into text segments + blank slots. */
export type SentencePart =
  | { kind: 'text'; value: string }
  | { kind: 'blank'; index: number };

export function splitSentence(sentence: string): SentencePart[] {
  const out: SentencePart[] = [];
  let rest = sentence;
  let blankIndex = 0;
  while (rest.length > 0) {
    const i = rest.indexOf(BLANK);
    if (i === -1) {
      out.push({ kind: 'text', value: rest });
      break;
    }
    if (i > 0) out.push({ kind: 'text', value: rest.slice(0, i) });
    out.push({ kind: 'blank', index: blankIndex++ });
    rest = rest.slice(i + BLANK.length);
  }
  return out;
}

/** Count blanks in a sentence. */
export function countBlanks(sentence: string): number {
  let n = 0;
  let rest = sentence;
  while (true) {
    const i = rest.indexOf(BLANK);
    if (i === -1) return n;
    n += 1;
    rest = rest.slice(i + BLANK.length);
  }
}

/** Total number of blanks across all sentences in a script. */
export function totalBlanks(script: ShowTellScript): number {
  return script.sentences.reduce((sum, s) => sum + countBlanks(s), 0);
}

/** Replace blanks in a sentence with the provided fills (in order). */
export function fillSentence(sentence: string, fills: string[]): string {
  let out = '';
  let rest = sentence;
  let i = 0;
  while (rest.length > 0) {
    const j = rest.indexOf(BLANK);
    if (j === -1) {
      out += rest;
      break;
    }
    out += rest.slice(0, j);
    const fill = fills[i++] ?? '';
    out += fill.length > 0 ? fill : '___';
    rest = rest.slice(j + BLANK.length);
  }
  return out;
}
