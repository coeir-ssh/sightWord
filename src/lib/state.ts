import { useEffect, useState, useCallback } from 'react';
import { storage, dayDoneArray, markDayDone, type Progress, type Wallet, type Inventory, type CharGender } from './storage';
import type { WeekId } from '../data/words';
import type { Slot } from '../data/items';

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
