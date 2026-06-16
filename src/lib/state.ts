import { useEffect, useState, useCallback } from 'react';
import { storage, dayDoneArray, markDayDone, type AppMode, type Progress, type Wallet, type Inventories } from './storage';
import type { WeekId } from '../data/words';
import { itemAllowedFor, type CharGender, type Slot } from '../data/items';

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => storage.loadProgress());
  useEffect(() => storage.saveProgress(progress), [progress]);
  const setWeek = useCallback((week: WeekId) => {
    setProgress((p) => ({ ...p, currentWeek: week }));
  }, []);
  const setWeekAndDay = useCallback((week: WeekId, day: number) => {
    setProgress((p) => ({ ...p, currentWeek: week, currentDay: day }));
  }, []);
  const completeDay = useCallback((week: WeekId, day: number) => {
    setProgress((p) => markDayDone(p, week, day));
  }, []);
  return {
    progress,
    setWeek,
    setWeekAndDay,
    completeDay,
    dayDone: (w: WeekId) => dayDoneArray(progress, w),
  };
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet>(() => storage.loadWallet());
  useEffect(() => storage.saveWallet(wallet), [wallet]);
  const addCoins = useCallback((n: number) => {
    setWallet((w) => ({ coins: Math.max(0, w.coins + n) }));
  }, []);
  // Read coins from the closed-over snapshot (current rendered state).
  // Reading inside the updater and returning that value doesn't work
  // because React 18 runs the updater on the next render, so the ref
  // would still be the initial `false` when spendCoins returns.
  const spendCoins = useCallback(
    (n: number): boolean => {
      if (wallet.coins < n) return false;
      setWallet((w) => ({ coins: Math.max(0, w.coins - n) }));
      return true;
    },
    [wallet.coins]
  );
  return { wallet, addCoins, spendCoins };
}

// The active gender selects which sub-inventory to expose; mutating helpers
// accept an optional `g` override so a single render can seed the *other*
// gender's wardrobe (used by the gender-pick flow that runs setGender(g)
// before this hook re-reads the active gender on the next render).
export function useInventory(gender: CharGender) {
  const [all, setAll] = useState<Inventories>(() => storage.loadInventories());
  useEffect(() => storage.saveInventories(all), [all]);

  // Hide cross-gender items even if they ended up in this gender's bag
  // (e.g. via the one-time legacy-inventory migration that lumped every
  // pre-feature purchase under 'boy'). The raw stored data is preserved.
  const raw = all[gender];
  const filteredOwned = raw.owned.filter((id) => itemAllowedFor(id, gender));
  const filteredEquipped = (Object.keys(raw.equipped) as Slot[]).reduce(
    (acc, slot) => {
      const id = raw.equipped[slot];
      acc[slot] = id && itemAllowedFor(id, gender) ? id : '';
      return acc;
    },
    {} as Record<Slot, string>
  );
  const inventory = { owned: filteredOwned, equipped: filteredEquipped };

  const addItem = useCallback(
    (id: string, g: CharGender = gender) => {
      setAll((cur) => {
        const inv = cur[g];
        if (inv.owned.includes(id)) return cur;
        return { ...cur, [g]: { ...inv, owned: [...inv.owned, id] } };
      });
    },
    [gender]
  );
  const equip = useCallback(
    (slot: Slot, id: string, g: CharGender = gender) => {
      setAll((cur) => ({
        ...cur,
        [g]: { ...cur[g], equipped: { ...cur[g].equipped, [slot]: id } },
      }));
    },
    [gender]
  );
  const unequip = useCallback(
    (slot: Slot, g: CharGender = gender) => {
      setAll((cur) => ({
        ...cur,
        [g]: { ...cur[g], equipped: { ...cur[g].equipped, [slot]: '' } },
      }));
    },
    [gender]
  );

  return { inventory, addItem, equip, unequip };
}

export function useCharName() {
  const [name, setName] = useState<string>(() => storage.getCharName());
  const update = useCallback((next: string) => {
    setName(next);
    storage.setCharName(next);
  }, []);
  return { name, setName: update };
}

export function useCharGender() {
  const [gender, setGender] = useState<CharGender>(() => storage.getCharGender());
  const update = useCallback((next: CharGender) => {
    setGender(next);
    storage.setCharGender(next);
  }, []);
  return { gender, setGender: update };
}

export function useAppMode() {
  const [mode, setMode] = useState<AppMode>(() => storage.getAppMode());
  const update = useCallback((next: AppMode) => {
    setMode(next);
    storage.setAppMode(next);
  }, []);
  return { mode, setMode: update };
}

export function useShowTellScript() {
  const [scriptId, setScriptId] = useState<string>(() => storage.getShowTellScript());
  const update = useCallback((next: string) => {
    setScriptId(next);
    storage.setShowTellScript(next);
  }, []);
  return { scriptId, setScriptId: update };
}

export function useSuperMode() {
  const [superMode, setSuperMode] = useState<boolean>(() => storage.getSuperMode());
  const update = useCallback((next: boolean) => {
    setSuperMode(next);
    storage.setSuperMode(next);
  }, []);
  const toggle = useCallback(() => {
    setSuperMode((prev) => {
      const next = !prev;
      storage.setSuperMode(next);
      return next;
    });
  }, []);
  return { superMode, setSuperMode: update, toggleSuperMode: toggle };
}
