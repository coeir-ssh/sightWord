import { DEFAULT_ITEMS, DEFAULT_OWNED, type Slot } from '../data/items';
import { WEEK_IDS, type WeekId } from '../data/words';

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

const KEYS = {
  progress: 'sw.progress.v2',
  wallet: 'sw.wallet.v6',
  inventory: 'sw.inventory.v2',
  parentPin: 'sw.parentPin.v1',
  charName: 'sw.charName.v1',
  superMode: 'sw.superMode.v1',
};

const DEFAULT_PROGRESS: Progress = {
  currentWeek: 'L1-1',
  currentDay: 0,
  dayCompleted: {},
};

const DEFAULT_WALLET: Wallet = { coins: 1000 };

const DEFAULT_INVENTORY: Inventory = {
  owned: [...DEFAULT_OWNED],
  equipped: { ...DEFAULT_ITEMS },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const storage = {
  loadProgress: (): Progress => {
    const p = read<Progress>(KEYS.progress, DEFAULT_PROGRESS);
    if (!WEEK_IDS.includes(p.currentWeek as WeekId)) {
      p.currentWeek = 'L1-1';
    }
    return p;
  },
  saveProgress: (p: Progress) => write(KEYS.progress, p),

  loadWallet: (): Wallet => read(KEYS.wallet, DEFAULT_WALLET),
  saveWallet: (w: Wallet) => write(KEYS.wallet, w),

  loadInventory: (): Inventory => {
    const inv = read<Inventory>(KEYS.inventory, DEFAULT_INVENTORY);
    let changed = false;
    for (const id of DEFAULT_OWNED) {
      if (!inv.owned.includes(id)) {
        inv.owned.push(id);
        changed = true;
      }
    }
    if (changed) write(KEYS.inventory, inv);
    return inv;
  },
  saveInventory: (i: Inventory) => write(KEYS.inventory, i),

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
