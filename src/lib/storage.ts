import { DEFAULT_ITEMS, DEFAULT_OWNED, type Slot } from '../data/items';
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
  currentWeek: 'L1',
  dayCompleted: {},
};

const DEFAULT_WALLET: Wallet = { coins: 0 };

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
    // Migrate old "1-1" .. "5-2" style ids to the new L1..L11 ids
    const migrate: Record<string, string> = {
      '1-1': 'L1', '1-2': 'L1',
      '2-1': 'L2', '2-2': 'L2',
      '3-1': 'L3', '3-2': 'L3',
      '4-1': 'L4', '4-2': 'L4',
      '5-1': 'L5', '5-2': 'L5',
    };
    if (migrate[p.currentWeek as string]) {
      p.currentWeek = migrate[p.currentWeek as string] as Progress['currentWeek'];
    }
    return p;
  },
  saveProgress: (p: Progress) => write(KEYS.progress, p),

  loadWallet: (): Wallet => read(KEYS.wallet, DEFAULT_WALLET),
  saveWallet: (w: Wallet) => write(KEYS.wallet, w),

  loadInventory: (): Inventory => {
    const inv = read<Inventory>(KEYS.inventory, DEFAULT_INVENTORY);
    // Merge in any new default-owned items added in later versions
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
