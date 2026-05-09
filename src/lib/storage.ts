import { DEFAULT_ITEMS, DEFAULT_OWNED, type Slot } from '../data/items';
import type { Half, WeekId } from '../data/words';

export type Progress = {
  currentWeek: WeekId;
  currentSubList: Half; // 0 or 1
  currentActivity: number; // 0..4
  // activityCompleted[listId] = boolean[10] where idx = half*5 + activity
  activityCompleted: Record<string, boolean[]>;
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
  currentSubList: 0,
  currentActivity: 0,
  activityCompleted: {},
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

type LegacyProgress = {
  currentWeek: string;
  currentDay?: number;
  dayCompleted?: Record<string, boolean[]>;
};

export const storage = {
  loadProgress: (): Progress => {
    const p = read<Progress & LegacyProgress>(
      KEYS.progress,
      DEFAULT_PROGRESS as Progress & LegacyProgress,
    );
    // Migrate old "1-1" .. "5-2" style ids to L1..L11
    const idMigrate: Record<string, string> = {
      '1-1': 'L1', '1-2': 'L1',
      '2-1': 'L2', '2-2': 'L2',
      '3-1': 'L3', '3-2': 'L3',
      '4-1': 'L4', '4-2': 'L4',
      '5-1': 'L5', '5-2': 'L5',
    };
    if (idMigrate[p.currentWeek as string]) {
      p.currentWeek = idMigrate[p.currentWeek as string] as WeekId;
    }

    // Migrate the old 5-day model (day = activity over the full 10-word list)
    // into the new (sub-list, activity) model. Old completion fills half 0;
    // half 1 starts empty so the kid still needs to learn LIST X-2.
    if (p.dayCompleted && !p.activityCompleted) {
      const ac: Record<string, boolean[]> = {};
      for (const [list, days] of Object.entries(p.dayCompleted)) {
        const arr = Array<boolean>(10).fill(false);
        for (let i = 0; i < Math.min(5, days.length); i++) arr[i] = !!days[i];
        ac[list] = arr;
      }
      p.activityCompleted = ac;
    }
    if (!p.activityCompleted) p.activityCompleted = {};

    if (p.currentSubList !== 0 && p.currentSubList !== 1) p.currentSubList = 0;
    if (typeof p.currentActivity !== 'number') {
      p.currentActivity = typeof p.currentDay === 'number' ? p.currentDay : 0;
    }
    p.currentActivity = Math.max(0, Math.min(4, p.currentActivity));

    delete p.currentDay;
    delete p.dayCompleted;
    return p as Progress;
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

function emptyList(): boolean[] {
  return [false, false, false, false, false, false, false, false, false, false];
}

/** All 10 (half, activity) flags for a list. */
export function listDoneArray(p: Progress, week: WeekId): boolean[] {
  const arr = p.activityCompleted[week];
  if (!arr || arr.length < 10) {
    const padded = emptyList();
    if (arr) for (let i = 0; i < arr.length && i < 10; i++) padded[i] = !!arr[i];
    return padded;
  }
  return arr;
}

/** The 5 activity flags for one sub-list (half). */
export function subListDoneArray(p: Progress, week: WeekId, half: Half): boolean[] {
  const arr = listDoneArray(p, week);
  return arr.slice(half * 5, half * 5 + 5);
}

export function markActivityDone(
  p: Progress,
  week: WeekId,
  half: Half,
  activity: number,
): Progress {
  const arr = listDoneArray(p, week).slice();
  arr[half * 5 + activity] = true;
  return {
    ...p,
    activityCompleted: { ...p.activityCompleted, [week]: arr },
  };
}
