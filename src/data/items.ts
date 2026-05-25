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
  | 'ironman'
  | 'princess_dress'
  | 'spiderman'
  | 'hulk';

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
  | 'ironman'
  | 'princess_skirt'
  | 'tutu'
  | 'spiderman'
  | 'hulk';

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
  | 'robot'
  | 'tiara'
  | 'flower_crown'
  | 'princess_crown';

export type MaskKind = 'ironman' | 'spiderman' | 'hulk';

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
  | 'ironman'
  | 'fairy_wings'
  | 'butterfly'
  | 'princess_cape'
  | 'spiderman'
  | 'hulk';

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
  | 'ironman'
  | 'glass_slipper'
  | 'ballet'
  | 'ribbon_heel'
  | 'spiderman'
  | 'hulk';

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
  | 'ironman'
  | 'wand'
  | 'ribbon_bow'
  | 'rose';

export type ItemKind =
  | TopKind
  | BottomKind
  | HatKind
  | MaskKind
  | BackKind
  | ShoeKind
  | CharmKind;

export type CharGender = 'boy' | 'girl';

export type Item = {
  id: string;
  name: string;
  slot: Slot;
  price: number;
  color: string;
  accent?: string;
  shape?: 'box' | 'wing' | 'crown' | 'star' | 'diamond';
  kind?: ItemKind;
  // Which characters can buy/wear this. Omit → available to both.
  genders?: CharGender[];
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
  { id: 'top.pink_tee', name: '핑크 티', slot: 'top', price: 40, color: '#f472b6', kind: 'tee', genders: ['girl'] },
  { id: 'top.green_dino', name: '초록 공룡 티', slot: 'top', price: 70, color: '#34d399', accent: '#fde68a', kind: 'dino' },
  { id: 'top.yellow_rain', name: '노란 우비', slot: 'top', price: 60, color: '#facc15', accent: '#a16207', kind: 'raincoat' },
  { id: 'top.purple_star', name: '보라 별 티', slot: 'top', price: 70, color: '#a78bfa', accent: '#fde047', kind: 'star' },
  { id: 'top.black_tee', name: '검은 티', slot: 'top', price: 40, color: '#111827', kind: 'tee', genders: ['boy'] },
  { id: 'top.orange_sweater', name: '주황 스웨터', slot: 'top', price: 60, color: '#fb923c', accent: '#7c2d12', kind: 'sweater' },
  { id: 'top.robot', name: '로봇 상의', slot: 'top', price: 100, color: '#94a3b8', accent: '#22d3ee', kind: 'robot', genders: ['boy'] },

  // ───────── Bottoms (10) ─────────
  { id: 'bottom.jeans', name: '청바지', slot: 'bottom', price: 0, color: '#1d4ed8', accent: '#fbbf24', kind: 'jeans' },
  { id: 'bottom.shorts', name: '반바지', slot: 'bottom', price: 40, color: '#f59e0b', kind: 'shorts' },
  { id: 'bottom.spacepants', name: '우주복 바지', slot: 'bottom', price: 80, color: '#e2e8f0', accent: '#3b82f6', kind: 'spacepants' },
  { id: 'bottom.pink_skirt', name: '핑크 치마', slot: 'bottom', price: 50, color: '#f472b6', kind: 'skirt', genders: ['girl'] },
  { id: 'bottom.khaki_shorts', name: '카키 반바지', slot: 'bottom', price: 40, color: '#84cc16', kind: 'shorts' },
  { id: 'bottom.black_pants', name: '검은 바지', slot: 'bottom', price: 40, color: '#1f2937', kind: 'pants' },
  { id: 'bottom.red_shorts', name: '빨간 반바지', slot: 'bottom', price: 40, color: '#ef4444', kind: 'shorts' },
  { id: 'bottom.green_track', name: '초록 츄리닝', slot: 'bottom', price: 60, color: '#16a34a', accent: '#ffffff', kind: 'track' },
  { id: 'bottom.gray_sweat', name: '회색 츄리닝', slot: 'bottom', price: 50, color: '#9ca3af', kind: 'sweat' },
  { id: 'bottom.plaid', name: '체크 바지', slot: 'bottom', price: 70, color: '#b45309', accent: '#fde68a', kind: 'plaid' },
  { id: 'bottom.robot', name: '로봇 바지', slot: 'bottom', price: 90, color: '#94a3b8', accent: '#22d3ee', kind: 'robot', genders: ['boy'] },

  // ───────── Hats (10) ─────────
  { id: 'hat.cap', name: '빨간 모자', slot: 'hat', price: 60, color: '#ef4444', kind: 'cap' },
  { id: 'hat.crown', name: '왕관', slot: 'hat', price: 120, color: '#fbbf24', kind: 'crown' },
  { id: 'hat.cap_blue', name: '파란 모자', slot: 'hat', price: 60, color: '#3b82f6', kind: 'cap' },
  { id: 'hat.beanie_pink', name: '핑크 비니', slot: 'hat', price: 50, color: '#f472b6', kind: 'beanie', genders: ['girl'] },
  { id: 'hat.tophat', name: '검은 톱햇', slot: 'hat', price: 100, color: '#111827', kind: 'tophat', genders: ['boy'] },
  { id: 'hat.wizard', name: '마법사 모자', slot: 'hat', price: 130, color: '#7c3aed', kind: 'wizard' },
  { id: 'hat.witch', name: '마녀 모자', slot: 'hat', price: 120, color: '#1f2937', kind: 'witch' },
  { id: 'hat.cowboy', name: '카우보이 모자', slot: 'hat', price: 90, color: '#a16207', kind: 'cowboy', genders: ['boy'] },
  { id: 'hat.sun', name: '노란 썬햇', slot: 'hat', price: 70, color: '#fde047', kind: 'sunhat' },
  { id: 'hat.pumpkin', name: '호박 모자', slot: 'hat', price: 110, color: '#f97316', kind: 'pumpkin' },
  { id: 'hat.robot', name: '로봇 헬멧', slot: 'hat', price: 110, color: '#475569', accent: '#ef4444', kind: 'robot', genders: ['boy'] },

  // ───────── Back (10) ─────────
  { id: 'back.kinder', name: '유치원 가방', slot: 'back', price: 0, color: '#fb7185', accent: '#fde68a', kind: 'kinder' },
  { id: 'back.backpack', name: '초록 백팩', slot: 'back', price: 50, color: '#16a34a', accent: '#0f172a', kind: 'pack' },
  { id: 'back.wings', name: '날개', slot: 'back', price: 100, color: '#fef3c7', accent: '#fcd34d', kind: 'wing_feather' },
  { id: 'back.angel_wings', name: '천사 날개', slot: 'back', price: 140, color: '#ffffff', accent: '#fde68a', kind: 'wing_angel' },
  { id: 'back.bat_wings', name: '박쥐 날개', slot: 'back', price: 130, color: '#1f2937', accent: '#7c3aed', kind: 'wing_bat', genders: ['boy'] },
  { id: 'back.jet_pack', name: '제트팩', slot: 'back', price: 150, color: '#94a3b8', accent: '#f97316', kind: 'jetpack', genders: ['boy'] },
  { id: 'back.turtle_shell', name: '거북이 등껍질', slot: 'back', price: 90, color: '#16a34a', accent: '#854d0e', kind: 'shell', genders: ['boy'] },
  { id: 'back.cape_red', name: '빨간 망토', slot: 'back', price: 110, color: '#dc2626', accent: '#fbbf24', kind: 'cape', genders: ['boy'] },
  { id: 'back.black_backpack', name: '검은 백팩', slot: 'back', price: 60, color: '#1f2937', accent: '#475569', kind: 'pack', genders: ['boy'] },
  { id: 'back.star_wings', name: '별 날개', slot: 'back', price: 160, color: '#fde047', accent: '#f97316', kind: 'wing_star' },
  { id: 'back.robot', name: '로봇 가방', slot: 'back', price: 140, color: '#94a3b8', accent: '#f97316', kind: 'robot', genders: ['boy'] },

  // ───────── Shoes (10) ─────────
  { id: 'shoes.sneakers', name: '운동화', slot: 'shoes', price: 40, color: '#f8fafc', accent: '#0f172a', kind: 'sneakers' },
  { id: 'shoes.boots', name: '갈색 부츠', slot: 'shoes', price: 70, color: '#7c2d12', accent: '#fbbf24', kind: 'boots', genders: ['boy'] },
  { id: 'shoes.pink', name: '핑크 신발', slot: 'shoes', price: 50, color: '#f472b6', accent: '#be185d', kind: 'flat', genders: ['girl'] },
  { id: 'shoes.rain_boots', name: '노란 장화', slot: 'shoes', price: 60, color: '#facc15', accent: '#a16207', kind: 'rainboots' },
  { id: 'shoes.red_sport', name: '빨간 스포츠화', slot: 'shoes', price: 60, color: '#ef4444', accent: '#ffffff', kind: 'sport' },
  { id: 'shoes.black_sneakers', name: '검은 운동화', slot: 'shoes', price: 50, color: '#111827', accent: '#ffffff', kind: 'sneakers', genders: ['boy'] },
  { id: 'shoes.sandals', name: '샌들', slot: 'shoes', price: 40, color: '#92400e', accent: '#fbbf24', kind: 'sandals' },
  { id: 'shoes.skates', name: '롤러스케이트', slot: 'shoes', price: 120, color: '#3b82f6', accent: '#ffffff', kind: 'skates' },
  { id: 'shoes.snow', name: '눈 부츠', slot: 'shoes', price: 90, color: '#ffffff', accent: '#94a3b8', kind: 'snowboots' },
  { id: 'shoes.light_up', name: '불빛 신발', slot: 'shoes', price: 130, color: '#c084fc', accent: '#fde047', kind: 'lightup' },
  { id: 'shoes.robot', name: '로봇 신발', slot: 'shoes', price: 90, color: '#94a3b8', accent: '#1e293b', kind: 'robot', genders: ['boy'] },

  // ───────── Charms (10) ─────────
  { id: 'charm.star', name: '별 키링', slot: 'charm', price: 30, color: '#fde047', kind: 'star' },
  { id: 'charm.diamond', name: '다이아 키링', slot: 'charm', price: 90, color: '#7dd3fc', kind: 'diamond' },
  { id: 'charm.heart', name: '하트 키링', slot: 'charm', price: 50, color: '#ef4444', kind: 'heart', genders: ['girl'] },
  { id: 'charm.cube', name: '큐브 키링', slot: 'charm', price: 40, color: '#a78bfa', kind: 'cube', genders: ['boy'] },
  { id: 'charm.coin', name: '코인 키링', slot: 'charm', price: 60, color: '#fbbf24', kind: 'coin' },
  { id: 'charm.bell', name: '종 키링', slot: 'charm', price: 50, color: '#f59e0b', kind: 'bell' },
  { id: 'charm.moon', name: '달 키링', slot: 'charm', price: 60, color: '#e0e7ff', kind: 'moon' },
  { id: 'charm.sun', name: '태양 키링', slot: 'charm', price: 60, color: '#fbbf24', kind: 'sun' },
  { id: 'charm.cherry', name: '체리 키링', slot: 'charm', price: 40, color: '#ef4444', kind: 'cherry' },
  { id: 'charm.lightning', name: '번개 키링', slot: 'charm', price: 80, color: '#facc15', kind: 'lightning', genders: ['boy'] },
  { id: 'charm.robot', name: '로봇 키링', slot: 'charm', price: 70, color: '#94a3b8', kind: 'robot', genders: ['boy'] },

  // ───────── Ironman set (boy only) ─────────
  { id: 'top.ironman', name: '아이언맨 갑옷', slot: 'top', price: 200, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'bottom.ironman', name: '아이언맨 다리', slot: 'bottom', price: 180, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'mask.ironman', name: '아이언맨 가면', slot: 'mask', price: 220, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'back.ironman', name: '아이언맨 윙', slot: 'back', price: 220, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'shoes.ironman', name: '아이언맨 부츠', slot: 'shoes', price: 150, color: '#fbbf24', accent: '#dc2626', kind: 'ironman', genders: ['boy'] },
  { id: 'charm.ironman', name: '아크 리액터 키링', slot: 'charm', price: 100, color: '#22d3ee', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },

  // ───────── Spider-Man set (boy only) ─────────
  { id: 'mask.spiderman', name: '스파이더맨 마스크', slot: 'mask', price: 200, color: '#c81e1e', accent: '#1e3a8a', kind: 'spiderman', genders: ['boy'] },
  { id: 'top.spiderman', name: '스파이더맨 상의', slot: 'top', price: 200, color: '#c81e1e', accent: '#1e3a8a', kind: 'spiderman', genders: ['boy'] },
  { id: 'bottom.spiderman', name: '스파이더맨 하의', slot: 'bottom', price: 180, color: '#1e3a8a', accent: '#c81e1e', kind: 'spiderman', genders: ['boy'] },
  { id: 'back.spiderman', name: '스파이더맨 엠블럼', slot: 'back', price: 150, color: '#c81e1e', accent: '#10101e', kind: 'spiderman', genders: ['boy'] },
  { id: 'shoes.spiderman', name: '스파이더맨 부츠', slot: 'shoes', price: 150, color: '#c81e1e', accent: '#10101e', kind: 'spiderman', genders: ['boy'] },

  // ───────── Hulk set (boy only) ─────────
  { id: 'mask.hulk', name: '헐크 얼굴', slot: 'mask', price: 200, color: '#73b339', accent: '#1f2937', kind: 'hulk', genders: ['boy'] },
  { id: 'top.hulk', name: '헐크 근육 상의', slot: 'top', price: 200, color: '#73b339', accent: '#3f6212', kind: 'hulk', genders: ['boy'] },
  { id: 'bottom.hulk', name: '헐크 찢어진 바지', slot: 'bottom', price: 180, color: '#475569', accent: '#73b339', kind: 'hulk', genders: ['boy'] },
  { id: 'back.hulk', name: '헐크 찢어진 셔츠', slot: 'back', price: 120, color: '#6d28d9', accent: '#4c1d95', kind: 'hulk', genders: ['boy'] },
  { id: 'shoes.hulk', name: '헐크 맨발', slot: 'shoes', price: 100, color: '#73b339', accent: '#3f6212', kind: 'hulk', genders: ['boy'] },

  // ───────── Princess set (girl only) ─────────
  { id: 'top.princess_pink', name: '핑크 공주 드레스', slot: 'top', price: 220, color: '#f9a8d4', accent: '#fde68a', kind: 'princess_dress', genders: ['girl'] },
  { id: 'top.princess_snow', name: '눈의 공주 드레스', slot: 'top', price: 220, color: '#bae6fd', accent: '#ffffff', kind: 'princess_dress', genders: ['girl'] },
  { id: 'top.princess_gold', name: '황금 공주 드레스', slot: 'top', price: 240, color: '#fde047', accent: '#fffbeb', kind: 'princess_dress', genders: ['girl'] },

  { id: 'bottom.princess_pink', name: '핑크 공주 치마', slot: 'bottom', price: 200, color: '#f9a8d4', accent: '#ffffff', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'bottom.princess_snow', name: '눈의 공주 치마', slot: 'bottom', price: 200, color: '#bae6fd', accent: '#ffffff', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'bottom.tutu', name: '발레 튀튀', slot: 'bottom', price: 160, color: '#fce7f3', kind: 'tutu', genders: ['girl'] },

  { id: 'hat.tiara', name: '티아라', slot: 'hat', price: 180, color: '#fbbf24', accent: '#ec4899', kind: 'tiara', genders: ['girl'] },
  { id: 'hat.flower_crown', name: '꽃 화관', slot: 'hat', price: 140, color: '#f472b6', accent: '#ffffff', kind: 'flower_crown', genders: ['girl'] },
  { id: 'hat.princess_crown', name: '공주 왕관', slot: 'hat', price: 220, color: '#fbbf24', accent: '#ec4899', kind: 'princess_crown', genders: ['girl'] },

  { id: 'back.fairy_wings', name: '요정 날개', slot: 'back', price: 180, color: '#fbcfe8', kind: 'fairy_wings', genders: ['girl'] },
  { id: 'back.butterfly', name: '나비 날개', slot: 'back', price: 180, color: '#c084fc', accent: '#fde047', kind: 'butterfly', genders: ['girl'] },
  { id: 'back.princess_cape', name: '공주 망토', slot: 'back', price: 200, color: '#ec4899', accent: '#ffffff', kind: 'princess_cape', genders: ['girl'] },

  { id: 'shoes.glass_slipper', name: '유리 구두', slot: 'shoes', price: 240, color: '#e0f2fe', kind: 'glass_slipper', genders: ['girl'] },
  { id: 'shoes.ballet', name: '발레 슈즈', slot: 'shoes', price: 140, color: '#fbcfe8', accent: '#ec4899', kind: 'ballet', genders: ['girl'] },
  { id: 'shoes.ribbon_heel', name: '리본 구두', slot: 'shoes', price: 160, color: '#f9a8d4', accent: '#ffffff', kind: 'ribbon_heel', genders: ['girl'] },

  { id: 'charm.wand', name: '요술봉', slot: 'charm', price: 120, color: '#fde047', kind: 'wand', genders: ['girl'] },
  { id: 'charm.ribbon', name: '리본', slot: 'charm', price: 70, color: '#ec4899', kind: 'ribbon_bow', genders: ['girl'] },
  { id: 'charm.rose', name: '장미', slot: 'charm', price: 90, color: '#ef4444', kind: 'rose', genders: ['girl'] },
];

export function itemsForGender(g: CharGender): Item[] {
  return ITEMS.filter((i) => !i.genders || i.genders.includes(g));
}

export function itemAllowedFor(id: string, g: CharGender): boolean {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return false;
  return !item.genders || item.genders.includes(g);
}

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
