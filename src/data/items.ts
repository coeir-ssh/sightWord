export type Slot = 'top' | 'bottom' | 'hat' | 'back' | 'shoes' | 'charm';

export type Item = {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  color: string;
  accent?: string;
  shape?: 'box' | 'wing' | 'crown' | 'star' | 'diamond';
};

export const SLOT_ORDER: Slot[] = ['top', 'bottom', 'hat', 'back', 'shoes', 'charm'];

export const SLOT_LABEL: Record<Slot, string> = {
  top: '상의',
  bottom: '하의',
  hat: '모자',
  back: '가방',
  shoes: '신발',
  charm: '키링',
};

export const ITEMS: Item[] = [
  // Tops
  { id: 'top.basic_white', name: '흰 티', slot: 'top', price: 0, color: '#ffffff' },
  { id: 'top.red_hoodie', name: '빨간 후디', slot: 'top', price: 50, color: '#ef4444', accent: '#7f1d1d' },
  { id: 'top.spacesuit', name: '우주복 상의', slot: 'top', price: 80, color: '#cbd5e1', accent: '#3b82f6' },

  // Bottoms
  { id: 'bottom.jeans', name: '청바지', slot: 'bottom', price: 0, color: '#1d4ed8' },
  { id: 'bottom.shorts', name: '반바지', slot: 'bottom', price: 40, color: '#f59e0b' },
  { id: 'bottom.spacepants', name: '우주복 바지', slot: 'bottom', price: 80, color: '#94a3b8', accent: '#3b82f6' },

  // Hats
  { id: 'hat.cap', name: '야구모자', slot: 'hat', price: 60, color: '#ef4444', shape: 'box' },
  { id: 'hat.crown', name: '왕관', slot: 'hat', price: 120, color: '#fbbf24', shape: 'crown' },

  // Back
  { id: 'back.backpack', name: '백팩', slot: 'back', price: 50, color: '#16a34a', shape: 'box' },
  { id: 'back.wings', name: '날개', slot: 'back', price: 100, color: '#fef3c7', accent: '#fcd34d', shape: 'wing' },

  // Shoes
  { id: 'shoes.sneakers', name: '운동화', slot: 'shoes', price: 40, color: '#f8fafc', accent: '#0f172a' },
  { id: 'shoes.boots', name: '부츠', slot: 'shoes', price: 70, color: '#7c2d12' },

  // Charm
  { id: 'charm.star', name: '별 키링', slot: 'charm', price: 30, color: '#fde047', shape: 'star' },
  { id: 'charm.diamond', name: '다이아 키링', slot: 'charm', price: 90, color: '#7dd3fc', shape: 'diamond' },
];

export const DEFAULT_ITEMS: Record<Slot, string> = {
  top: 'top.basic_white',
  bottom: 'bottom.jeans',
  hat: '',
  back: '',
  shoes: '',
  charm: '',
};

export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function itemsBySlot(slot: Slot): Item[] {
  return ITEMS.filter((i) => i.slot === slot);
}
