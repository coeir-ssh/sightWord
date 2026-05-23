export type Slot = 'top' | 'bottom' | 'hat' | 'mask' | 'back' | 'shoes' | 'charm';

export type TopKind =
  | 'tee'
  | 'hoodie'
  | 'raincoat'
  | 'spacesuit'
  | 'striped'
  | 'dino'
  | 'sweater'
  | 'star'
  | 'robot'
  | 'ironman';

export type BottomKind =
  | 'pants'
  | 'jeans'
  | 'shorts'
  | 'spacepants'
  | 'skirt'
  | 'track'
  | 'sweat'
  | 'plaid'
  | 'robot'
  | 'ironman';

export type HatKind =
  | 'cap'
  | 'crown'
  | 'beanie'
  | 'tophat'
  | 'wizard'
  | 'witch'
  | 'cowboy'
  | 'sunhat'
  | 'pumpkin'
  | 'robot';

export type MaskKind = 'ironman';

export type BackKind =
  | 'kinder'
  | 'pack'
  | 'wing_feather'
  | 'wing_angel'
  | 'wing_bat'
  | 'wing_star'
  | 'jetpack'
  | 'shell'
  | 'cape'
  | 'robot'
  | 'ironman';

export type ShoeKind =
  | 'sneakers'
  | 'boots'
  | 'flat'
  | 'rainboots'
  | 'sport'
  | 'sandals'
  | 'skates'
  | 'snowboots'
  | 'lightup'
  | 'robot'
  | 'ironman';

export type CharmKind =
  | 'star'
  | 'diamond'
  | 'heart'
  | 'cube'
  | 'coin'
  | 'bell'
  | 'moon'
  | 'sun'
  | 'cherry'
  | 'lightning'
  | 'robot'
  | 'ironman';

export type ItemKind =
  | TopKind
  | BottomKind
  | HatKind
  | MaskKind
  | BackKind
  | ShoeKind
  | CharmKind;

export type Item = {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  color: string;
  accent?: string;
  shape?: 'box' | 'wing' | 'crown' | 'star' | 'diamond';
  kind?: ItemKind;
};

export const SLOT_ORDER: Slot[] = ['mask', 'top', 'bottom', 'hat', 'back', 'shoes', 'charm'];

export const SLOT_LABEL: Record<Slot, string> = {
  top: '상의',
  bottom: '하의',
  hat: '모자',
  mask: '가면',
  back: '가방',
  shoes: '신발',
  charm: '키링',
};

export const ITEMS: Item[] = [
  // ───────── Tops (10) ─────────
  { id: 'top.basic_white', name: '흰 티', slot: 'top', price: 0, color: '#ffffff', kind: 'tee' },
  { id: 'top.red_hoodie', name: '빨간 후디', slot: 'top', price: 50, color: '#ef4444', accent: '#7f1d1d', kind: 'hoodie' },
  { id: 'top.spacesuit', name: '우주복 상의', slot: 'top', price: 80, color: '#e2e8f0', accent: '#3b82f6', kind: 'spacesuit' },
  { id: 'top.blue_stripe', name: '파란 줄무늬 티', slot: 'top', price: 40, color: '#60a5fa', accent: '#ffffff', kind: 'striped' },
  { id: 'top.pink_tee', name: '핑크 티', slot: 'top', price: 40, color: '#f472b6', kind: 'tee' },
  { id: 'top.green_dino', name: '초록 공룡 티', slot: 'top', price: 70, color: '#34d399', accent: '#fde68a', kind: 'dino' },
  { id: 'top.yellow_rain', name: '노란 우비', slot: 'top', price: 60, color: '#facc15', accent: '#a16207', kind: 'raincoat' },
  { id: 'top.purple_star', name: '보라 별 티', slot: 'top', price: 70, color: '#a78bfa', accent: '#fde047', kind: 'star' },
  { id: 'top.black_tee', name: '검은 티', slot: 'top', price: 40, color: '#111827', kind: 'tee' },
  { id: 'top.orange_sweater', name: '주황 스웨터', slot: 'top', price: 60, color: '#fb923c', accent: '#7c2d12', kind: 'sweater' },
  { id: 'top.robot', name: '로봇 상의', slot: 'top', price: 100, color: '#94a3b8', accent: '#22d3ee', kind: 'robot' },

  // ───────── Bottoms (10) ─────────
  { id: 'bottom.jeans', name: '청바지', slot: 'bottom', price: 0, color: '#1d4ed8', accent: '#fbbf24', kind: 'jeans' },
  { id: 'bottom.shorts', name: '반바지', slot: 'bottom', price: 40, color: '#f59e0b', kind: 'shorts' },
  { id: 'bottom.spacepants', name: '우주복 바지', slot: 'bottom', price: 80, color: '#e2e8f0', accent: '#3b82f6', kind: 'spacepants' },
  { id: 'bottom.pink_skirt', name: '핑크 치마', slot: 'bottom', price: 50, color: '#f472b6', kind: 'skirt' },
  { id: 'bottom.khaki_shorts', name: '카키 반바지', slot: 'bottom', price: 40, color: '#84cc16', kind: 'shorts' },
  { id: 'bottom.black_pants', name: '검은 바지', slot: 'bottom', price: 40, color: '#1f2937', kind: 'pants' },
  { id: 'bottom.red_shorts', name: '빨간 반바지', slot: 'bottom', price: 40, color: '#ef4444', kind: 'shorts' },
  { id: 'bottom.green_track', name: '초록 츄리닝', slot: 'bottom', price: 60, color: '#16a34a', accent: '#ffffff', kind: 'track' },
  { id: 'bottom.gray_sweat', name: '회색 츄리닝', slot: 'bottom', price: 50, color: '#9ca3af', kind: 'sweat' },
  { id: 'bottom.plaid', name: '체크 바지', slot: 'bottom', price: 70, color: '#b45309', accent: '#fde68a', kind: 'plaid' },
  { id: 'bottom.robot', name: '로봇 바지', slot: 'bottom', price: 90, color: '#94a3b8', accent: '#22d3ee', kind: 'robot' },

  // ───────── Hats (10) ─────────
  { id: 'hat.cap', name: '빨간 모자', slot: 'hat', price: 60, color: '#ef4444', kind: 'cap' },
  { id: 'hat.crown', name: '왕관', slot: 'hat', price: 120, color: '#fbbf24', kind: 'crown' },
  { id: 'hat.cap_blue', name: '파란 모자', slot: 'hat', price: 60, color: '#3b82f6', kind: 'cap' },
  { id: 'hat.beanie_pink', name: '핑크 비니', slot: 'hat', price: 50, color: '#f472b6', kind: 'beanie' },
  { id: 'hat.tophat', name: '검은 톱햇', slot: 'hat', price: 100, color: '#111827', kind: 'tophat' },
  { id: 'hat.wizard', name: '마법사 모자', slot: 'hat', price: 130, color: '#7c3aed', kind: 'wizard' },
  { id: 'hat.witch', name: '마녀 모자', slot: 'hat', price: 120, color: '#1f2937', kind: 'witch' },
  { id: 'hat.cowboy', name: '카우보이 모자', slot: 'hat', price: 90, color: '#a16207', kind: 'cowboy' },
  { id: 'hat.sun', name: '노란 썬햇', slot: 'hat', price: 70, color: '#fde047', kind: 'sunhat' },
  { id: 'hat.pumpkin', name: '호박 모자', slot: 'hat', price: 110, color: '#f97316', kind: 'pumpkin' },
  { id: 'hat.robot', name: '로봇 헬멧', slot: 'hat', price: 110, color: '#475569', accent: '#ef4444', kind: 'robot' },

  // ───────── Back (10) ─────────
  { id: 'back.kinder', name: '유치원 가방', slot: 'back', price: 0, color: '#fb7185', accent: '#fde68a', kind: 'kinder' },
  { id: 'back.backpack', name: '초록 백팩', slot: 'back', price: 50, color: '#16a34a', accent: '#0f172a', kind: 'pack' },
  { id: 'back.wings', name: '날개', slot: 'back', price: 100, color: '#fef3c7', accent: '#fcd34d', kind: 'wing_feather' },
  { id: 'back.angel_wings', name: '천사 날개', slot: 'back', price: 140, color: '#ffffff', accent: '#fde68a', kind: 'wing_angel' },
  { id: 'back.bat_wings', name: '박쥐 날개', slot: 'back', price: 130, color: '#1f2937', accent: '#7c3aed', kind: 'wing_bat' },
  { id: 'back.jet_pack', name: '제트팩', slot: 'back', price: 150, color: '#94a3b8', accent: '#f97316', kind: 'jetpack' },
  { id: 'back.turtle_shell', name: '거북이 등껍질', slot: 'back', price: 90, color: '#16a34a', accent: '#854d0e', kind: 'shell' },
  { id: 'back.cape_red', name: '빨간 망토', slot: 'back', price: 110, color: '#dc2626', accent: '#fbbf24', kind: 'cape' },
  { id: 'back.black_backpack', name: '검은 백팩', slot: 'back', price: 60, color: '#1f2937', accent: '#475569', kind: 'pack' },
  { id: 'back.star_wings', name: '별 날개', slot: 'back', price: 160, color: '#fde047', accent: '#f97316', kind: 'wing_star' },
  { id: 'back.robot', name: '로봇 가방', slot: 'back', price: 140, color: '#94a3b8', accent: '#f97316', kind: 'robot' },

  // ───────── Shoes (10) ─────────
  { id: 'shoes.sneakers', name: '운동화', slot: 'shoes', price: 40, color: '#f8fafc', accent: '#0f172a', kind: 'sneakers' },
  { id: 'shoes.boots', name: '갈색 부츠', slot: 'shoes', price: 70, color: '#7c2d12', accent: '#fbbf24', kind: 'boots' },
  { id: 'shoes.pink', name: '핑크 신발', slot: 'shoes', price: 50, color: '#f472b6', accent: '#be185d', kind: 'flat' },
  { id: 'shoes.rain_boots', name: '노란 장화', slot: 'shoes', price: 60, color: '#facc15', accent: '#a16207', kind: 'rainboots' },
  { id: 'shoes.red_sport', name: '빨간 스포츠화', slot: 'shoes', price: 60, color: '#ef4444', accent: '#ffffff', kind: 'sport' },
  { id: 'shoes.black_sneakers', name: '검은 운동화', slot: 'shoes', price: 50, color: '#111827', accent: '#ffffff', kind: 'sneakers' },
  { id: 'shoes.sandals', name: '샌들', slot: 'shoes', price: 40, color: '#92400e', accent: '#fbbf24', kind: 'sandals' },
  { id: 'shoes.skates', name: '롤러스케이트', slot: 'shoes', price: 120, color: '#3b82f6', accent: '#ffffff', kind: 'skates' },
  { id: 'shoes.snow', name: '눈 부츠', slot: 'shoes', price: 90, color: '#ffffff', accent: '#94a3b8', kind: 'snowboots' },
  { id: 'shoes.light_up', name: '불빛 신발', slot: 'shoes', price: 130, color: '#c084fc', accent: '#fde047', kind: 'lightup' },
  { id: 'shoes.robot', name: '로봇 신발', slot: 'shoes', price: 90, color: '#94a3b8', accent: '#1e293b', kind: 'robot' },

  // ───────── Charms (10) ─────────
  { id: 'charm.star', name: '별 키링', slot: 'charm', price: 30, color: '#fde047', kind: 'star' },
  { id: 'charm.diamond', name: '다이아 키링', slot: 'charm', price: 90, color: '#7dd3fc', kind: 'diamond' },
  { id: 'charm.heart', name: '하트 키링', slot: 'charm', price: 50, color: '#ef4444', kind: 'heart' },
  { id: 'charm.cube', name: '큐브 키링', slot: 'charm', price: 40, color: '#a78bfa', kind: 'cube' },
  { id: 'charm.coin', name: '코인 키링', slot: 'charm', price: 60, color: '#fbbf24', kind: 'coin' },
  { id: 'charm.bell', name: '종 키링', slot: 'charm', price: 50, color: '#f59e0b', kind: 'bell' },
  { id: 'charm.moon', name: '달 키링', slot: 'charm', price: 60, color: '#e0e7ff', kind: 'moon' },
  { id: 'charm.sun', name: '태양 키링', slot: 'charm', price: 60, color: '#fbbf24', kind: 'sun' },
  { id: 'charm.cherry', name: '체리 키링', slot: 'charm', price: 40, color: '#ef4444', kind: 'cherry' },
  { id: 'charm.lightning', name: '번개 키링', slot: 'charm', price: 80, color: '#facc15', kind: 'lightning' },
  { id: 'charm.robot', name: '로봇 키링', slot: 'charm', price: 70, color: '#94a3b8', kind: 'robot' },

  // ───────── Ironman set ─────────
  { id: 'top.ironman', name: '아이언맨 갑옷', slot: 'top', price: 200, color: '#b91c1c', accent: '#fbbf24', kind: 'ironman' },
  { id: 'bottom.ironman', name: '아이언맨 다리', slot: 'bottom', price: 180, color: '#b91c1c', accent: '#fbbf24', kind: 'ironman' },
  { id: 'mask.ironman', name: '아이언맨 가면', slot: 'mask', price: 220, color: '#b91c1c', accent: '#fbbf24', kind: 'ironman' },
  { id: 'back.ironman', name: '아이언맨 윙', slot: 'back', price: 220, color: '#b91c1c', accent: '#fbbf24', kind: 'ironman' },
  { id: 'shoes.ironman', name: '아이언맨 부츠', slot: 'shoes', price: 150, color: '#fbbf24', accent: '#b91c1c', kind: 'ironman' },
  { id: 'charm.ironman', name: '아크 리액터 키링', slot: 'charm', price: 100, color: '#22d3ee', accent: '#fbbf24', kind: 'ironman' },
];

export const DEFAULT_ITEMS: Record<Slot, string> = {
  top: '',
  bottom: '',
  hat: '',
  mask: '',
  back: '',
  shoes: '',
  charm: '',
};

// Wardrobe starts empty — every item must be purchased.
export const DEFAULT_OWNED: string[] = [];

export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function itemsBySlot(slot: Slot): Item[] {
  return ITEMS.filter((i) => i.slot === slot);
}
