import { useEffect, useState, useCallback } from 'react';
import {
  storage,
  listDoneArray,
  subListDoneArray,
  markActivityDone,
  type Progress,
  type Wallet,
  type Inventory,
} from './storage';
import type { Half, WeekId } from '../data/words';
import type { Slot } from '../data/items';

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => storage.loadProgress());
  useEffect(() => storage.saveProgress(progress), [progress]);

  const setWeek = useCallback((week: WeekId) => {
    setProgress((p) => ({ ...p, currentWeek: week }));
  }, []);

  const setSubList = useCallback((week: WeekId, half: Half) => {
    setProgress((p) => ({ ...p, currentWeek: week, currentSubList: half }));
  }, []);

  const setActivity = useCallback(
    (week: WeekId, half: Half, activity: number) => {
      setProgress((p) => ({
        ...p,
        currentWeek: week,
        currentSubList: half,
        currentActivity: activity,
      }));
    },
    [],
  );

  const completeActivity = useCallback(
    (week: WeekId, half: Half, activity: number) => {
      setProgress((p) => markActivityDone(p, week, half, activity));
    },
    [],
  );

  return {
    progress,
    setWeek,
    setSubList,
    setActivity,
    completeActivity,
    listDone: (w: WeekId) => listDoneArray(progress, w),
    subListDone: (w: WeekId, h: Half) => subListDoneArray(progress, w, h),
  };
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet>(() => storage.loadWallet());
  useEffect(() => storage.saveWallet(wallet), [wallet]);
  const addCoins = useCallback((n: number) => {
    setWallet((w) => ({ coins: Math.max(0, w.coins + n) }));
  }, []);
  const spendCoins = useCallback(
    (n: number): boolean => {
      let ok = false;
      setWallet((w) => {
        if (w.coins >= n) {
          ok = true;
          return { coins: w.coins - n };
        }
        return w;
      });
      return ok;
    },
    []
  );
  return { wallet, addCoins, spendCoins };
}

export function useInventory() {
  const [inv, setInv] = useState<Inventory>(() => storage.loadInventory());
  useEffect(() => storage.saveInventory(inv), [inv]);

  const addItem = useCallback((id: string) => {
    setInv((i) => (i.owned.includes(id) ? i : { ...i, owned: [...i.owned, id] }));
  }, []);
  const equip = useCallback((slot: Slot, id: string) => {
    setInv((i) => ({ ...i, equipped: { ...i.equipped, [slot]: id } }));
  }, []);
  const unequip = useCallback((slot: Slot) => {
    setInv((i) => ({ ...i, equipped: { ...i.equipped, [slot]: '' } }));
  }, []);

  return { inventory: inv, addItem, equip, unequip };
}
