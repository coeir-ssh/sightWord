import { DEFAULT_ITEMS, type Slot } from '../data/items';
import type { WeekId } from '../data/words';

export type Progress = {
  currentWeek: WeekId;
  // dayCompleted[weekId][dayIndex 0..4]
  dayCompleted: Record<string, boolean[]>;
};

export type Wallet = { coins: number };

export type Inventory = {
  owned: string[];
  equipped: Record<Slot, string>;
};

const KEYS = {
  progress: 'sw.progress.v1',
  wallet: 'sw.wallet.v1',
  inventory: 'sw.inventory.v1',
  parentPin: 'sw.parentPin.v1',
};

const DEFAULT_PROGRESS: Progress = {
  currentWeek: '1-1',
  dayCompleted: {},
};

const DEFAULT_WALLET: Wallet = { coins: 0 };

const DEFAULT_INVENTORY: Inventory = {
  owned: ['top.basic_white', 'bottom.jeans'],
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
  loadProgress: (): Progress => read(KEYS.progress, DEFAULT_PROGRESS),
  saveProgress: (p: Progress) => write(KEYS.progress, p),

  loadWallet: (): Wallet => read(KEYS.wallet, DEFAULT_WALLET),
  saveWallet: (w: Wallet) => write(KEYS.wallet, w),

  loadInventory: (): Inventory => read(KEYS.inventory, DEFAULT_INVENTORY),
  saveInventory: (i: Inventory) => write(KEYS.inventory, i),

  getParentPin: (): string => localStorage.getItem(KEYS.parentPin) ?? '1004',
  setParentPin: (pin: string) => localStorage.setItem(KEYS.parentPin, pin),

  reset: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
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
