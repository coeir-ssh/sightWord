import { DEFAULT_ITEMS, DEFAULT_OWNED, type CharGender, type Slot } from '../data/items';
import { WEEK_IDS, type WeekId } from '../data/words';

export type { CharGender } from '../data/items';

export type Progress = {
  currentWeek: WeekId;
  currentDay: number; // 0..4
  // dayCompleted[weekId][dayIndex 0..4]
  dayCompleted: Record<string, boolean[]>;
};

export type Wallet = { coins: number };

export type Inventory = {
  owned: string[];
  equipped: Record<Slot, string>;
};

// Per-gender inventories — items bought as the boy never appear in the
// girl's wardrobe and vice-versa.
export type Inventories = Record<CharGender, Inventory>;

const KEYS = {
  progress: 'sw.progress.v2',
  wallet: 'sw.wallet.v7',
  // Legacy single-inventory key. Read once for migration, then ignored.
  inventoryLegacy: 'sw.inventory.v2',
  inventories: 'sw.inventories.v1',
  parentPin: 'sw.parentPin.v1',
  charName: 'sw.charName.v1',
  superMode: 'sw.superMode.v1',
  charGender: 'sw.charGender.v1',
  // One-time +300 coin top-up: granted once per browser, then flagged.
  bonus300: 'sw.bonus.300.v1',
};

const DEFAULT_PROGRESS: Progress = {
  currentWeek: 'L1-1',
  currentDay: 0,
  dayCompleted: {},
};

const DEFAULT_WALLET: Wallet = { coins: 1000 };

const makeDefaultInventory = (): Inventory => ({
  owned: [...DEFAULT_OWNED],
  equipped: { ...DEFAULT_ITEMS },
});

const makeDefaultInventories = (): Inventories => ({
  boy: makeDefaultInventory(),
  girl: makeDefaultInventory(),
});

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const storage = {
  loadProgress: (): Progress => {
    try {
      const raw = localStorage.getItem(KEYS.progress);
      const p = raw
        ? ({ ...DEFAULT_PROGRESS, ...JSON.parse(raw) } as Progress)
        : DEFAULT_PROGRESS;
      if (!WEEK_IDS.includes(p.currentWeek as WeekId)) {
        p.currentWeek = 'L1-1';
      }
      return p;
    } catch {
      return DEFAULT_PROGRESS;
    }
  },
  saveProgress: (p: Progress) => write(KEYS.progress, p),

  loadWallet: (): Wallet => {
    try {
      const raw = localStorage.getItem(KEYS.wallet);
      let wallet: Wallet = raw
        ? ({ ...DEFAULT_WALLET, ...JSON.parse(raw) } as Wallet)
        : DEFAULT_WALLET;
      // One-time +300 coin top-up. The flag persists so this never re-runs
      // for the same browser even if the user reloads or comes back later.
      if (!localStorage.getItem(KEYS.bonus300)) {
        wallet = { coins: wallet.coins + 300 };
        try {
          localStorage.setItem(KEYS.bonus300, '1');
          localStorage.setItem(KEYS.wallet, JSON.stringify(wallet));
        } catch {
          /* ignore */
        }
      }
      return wallet;
    } catch {
      return DEFAULT_WALLET;
    }
  },
  saveWallet: (w: Wallet) => write(KEYS.wallet, w),

  loadInventories: (): Inventories => {
    try {
      const raw = localStorage.getItem(KEYS.inventories);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Inventories>;
        return {
          boy: { ...makeDefaultInventory(), ...(parsed.boy ?? {}) },
          girl: { ...makeDefaultInventory(), ...(parsed.girl ?? {}) },
        };
      }
      // Migrate from the old single-inventory format → put it under boy
      // (the boy was the implicit default before the gender feature).
      const legacy = localStorage.getItem(KEYS.inventoryLegacy);
      if (legacy) {
        const old = JSON.parse(legacy) as Partial<Inventory>;
        return {
          boy: { ...makeDefaultInventory(), ...old },
          girl: makeDefaultInventory(),
        };
      }
    } catch {
      /* fall through */
    }
    return makeDefaultInventories();
  },
  saveInventories: (i: Inventories) => write(KEYS.inventories, i),

  getParentPin: (): string => {
    try {
      return localStorage.getItem(KEYS.parentPin) ?? '1004';
    } catch {
      return '1004';
    }
  },
  setParentPin: (pin: string) => {
    try {
      localStorage.setItem(KEYS.parentPin, pin);
    } catch {
      /* ignore */
    }
  },

  getCharName: (): string => {
    try {
      return localStorage.getItem(KEYS.charName) ?? '';
    } catch {
      return '';
    }
  },
  setCharName: (name: string) => {
    try {
      localStorage.setItem(KEYS.charName, name);
    } catch {
      /* ignore */
    }
  },

  getCharGender: (): CharGender => {
    try {
      const v = localStorage.getItem(KEYS.charGender);
      return v === 'girl' ? 'girl' : 'boy';
    } catch {
      return 'boy';
    }
  },
  setCharGender: (g: CharGender) => {
    try {
      localStorage.setItem(KEYS.charGender, g);
    } catch {
      /* ignore */
    }
  },

  getSuperMode: (): boolean => {
    try {
      return localStorage.getItem(KEYS.superMode) === '1';
    } catch {
      return false;
    }
  },
  setSuperMode: (on: boolean) => {
    try {
      localStorage.setItem(KEYS.superMode, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  },

  reset: () => {
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  },
};

export function dayDoneArray(p: Progress, week: WeekId): boolean[] {
  return p.dayCompleted[week] ?? [false, false, false, false, false];
}

export function markDayDone(p: Progress, week: WeekId, day: number): Progress {
  const arr = dayDoneArray(p, week).slice();
  arr[day] = true;
  return {
    ...p,
    dayCompleted: { ...p.dayCompleted, [week]: arr },
  };
}
