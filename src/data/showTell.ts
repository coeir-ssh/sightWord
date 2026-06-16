// Show and Tell scripts — short English presentations (5-6 sentences) the
// child memorizes and presents aloud. Coins + character customization are
// shared with the Sight Word side; only the left-hand learning UI differs.

export type ShowTellScript = {
  id: string;
  title: string; // English title shown on cards/buttons
  titleKo: string; // Korean hint for the parent/child
  emoji: string;
  sentences: string[];
};

export const SHOW_TELL_SCRIPTS: ShowTellScript[] = [
  {
    id: 'my-family',
    title: 'My Family',
    titleKo: '우리 가족',
    emoji: '👨‍👩‍👧',
    sentences: [
      'Hello, everyone!',
      'Today I will talk about my family.',
      'There are four people in my family.',
      'I have a mom, a dad, and a baby brother.',
      'We love to play together.',
      'Thank you for listening!',
    ],
  },
  {
    id: 'my-animal',
    title: 'My Favorite Animal',
    titleKo: '내가 좋아하는 동물',
    emoji: '🐶',
    sentences: [
      'Hello, my friends!',
      'My favorite animal is the dog.',
      'My dog is small and brown.',
      'He likes to run and play with me.',
      'I give him food every day.',
      'I love my dog. Thank you!',
    ],
  },
  {
    id: 'my-food',
    title: 'My Favorite Food',
    titleKo: '내가 좋아하는 음식',
    emoji: '🍕',
    sentences: [
      'Hi, everyone!',
      'My favorite food is pizza.',
      'It is round and yummy.',
      'I like cheese and tomato on top.',
      'I eat it with my family on Friday.',
      'Yum yum! Thank you!',
    ],
  },
];

export const SHOW_TELL_IDS = SHOW_TELL_SCRIPTS.map((s) => s.id);

export function getShowTellScript(id: string): ShowTellScript {
  return SHOW_TELL_SCRIPTS.find((s) => s.id === id) ?? SHOW_TELL_SCRIPTS[0];
}
