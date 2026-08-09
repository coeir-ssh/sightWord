export type Slot = 'top' | 'bottom' | 'hat' | 'mask' | 'back' | 'shoes' | 'misc';

export type MiscKind =
  | 'motorcycle'
  | 'soccer_ball'
  | 'pikachu'
  | 'charmander'
  | 'squirtle'
  | 'bulbasaur'
  | 'eevee'
  | 'jigglypuff'
  | 'psyduck'
  | 'snorlax'
  | 'gengar'
  | 'charizard'
  | 'mew'
  | 'lugia'
  | 'growlithe'
  | 'gardevoir'
  | 'absol'
  | 'beedrill'
  | 'mega_lucario'
  | 'mega_charizard_x'
  | 'mega_charizard_y'
  | 'fearow';

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
  | 'hulk'
  | 'batman'
  | 'captain_america'
  | 'thor'
  | 'superman'
  | 'flash'
  | 'panther'
  | 'elsa_top'
  | 'ariel_top'
  | 'rapunzel_top'
  | 'slp'
  | 'slp_girl'
  | 'joon_cardigan'
  | 'wolverine'
  | 'dr_strange'
  | 'starlord'
  | 'antman'
  | 'war_machine'
  | 'vision'
  | 'daredevil'
  | 'hawkeye'
  | 'falcon'
  | 'venom'
  | 'ghost_rider'
  | 'silver_surfer'
  | 'solmoe'
  | 'snorlax_suit'
  | 'gengar_suit'
  | 'pikachu_top'
  | 'charmander_top'
  | 'squirtle_top'
  | 'bulbasaur_top'
  | 'eevee_top'
  | 'jigglypuff_top'
  | 'psyduck_top'
  | 'charizard_top'
  | 'mew_top'
  | 'lugia_top'
  | 'growlithe_top'
  | 'gardevoir_top'
  | 'absol_top'
  | 'beedrill_top'
  | 'mega_lucario_top'
  | 'mega_charizard_x_top'
  | 'mega_charizard_y_top'
  | 'fearow_top';

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
  | 'hulk'
  | 'batman'
  | 'captain_america'
  | 'thor'
  | 'superman'
  | 'flash'
  | 'panther'
  | 'elsa_skirt'
  | 'ariel_tail'
  | 'rapunzel_skirt'
  | 'slp'
  | 'slp_skirt'
  | 'wolverine'
  | 'dr_strange'
  | 'starlord'
  | 'antman'
  | 'war_machine'
  | 'vision'
  | 'daredevil'
  | 'hawkeye'
  | 'falcon'
  | 'venom'
  | 'ghost_rider'
  | 'silver_surfer'
  | 'solmoe'
  | 'pikachu_legs'
  | 'charmander_legs'
  | 'squirtle_legs'
  | 'bulbasaur_legs'
  | 'eevee_legs'
  | 'jigglypuff_legs'
  | 'psyduck_legs'
  | 'snorlax_legs'
  | 'gengar_legs'
  | 'charizard_legs'
  | 'mew_legs'
  | 'lugia_legs'
  | 'growlithe_legs'
  | 'gardevoir_legs'
  | 'absol_legs'
  | 'beedrill_legs'
  | 'mega_lucario_legs'
  | 'mega_charizard_x_legs'
  | 'mega_charizard_y_legs'
  | 'fearow_legs';

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
  | 'princess_crown'
  | 'elsa_crown'
  | 'belle_bow'
  | 'ariel_shell';

export type MaskKind =
  | 'ironman'
  | 'spiderman'
  | 'hulk'
  | 'batman'
  | 'captain_america'
  | 'thor'
  | 'flash'
  | 'panther'
  | 'wolverine'
  | 'starlord'
  | 'antman'
  | 'war_machine'
  | 'vision'
  | 'daredevil'
  | 'falcon'
  | 'venom'
  | 'ghost_rider'
  | 'charmander_face'
  | 'squirtle_face'
  | 'bulbasaur_face'
  | 'eevee_face'
  | 'pikachu_face'
  | 'jigglypuff_face'
  | 'psyduck_face'
  | 'snorlax_face'
  | 'gengar_face'
  | 'charizard_face'
  | 'mew_face'
  | 'lugia_face'
  | 'growlithe_face'
  | 'gardevoir_face'
  | 'absol_face'
  | 'beedrill_face'
  | 'mega_lucario_face'
  | 'mega_charizard_x_face'
  | 'mega_charizard_y_face'
  | 'fearow_face';

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
  | 'hulk'
  | 'batman_cape'
  | 'cap_shield'
  | 'thor_cape'
  | 'superman_cape'
  | 'flash_bolt'
  | 'panther_cape'
  | 'elsa_cape'
  | 'ariel_wave'
  | 'rapunzel_hair'
  | 'slp_backpack'
  | 'wolverine_claws'
  | 'dr_strange_cape'
  | 'starlord_pack'
  | 'antman_pack'
  | 'war_machine_back'
  | 'vision_cape'
  | 'daredevil_back'
  | 'hawkeye_quiver'
  | 'falcon_wings'
  | 'venom_back'
  | 'ghost_rider_back'
  | 'silver_surfer_board'
  | 'pikachu_tail'
  | 'charmander_tail'
  | 'squirtle_shell'
  | 'bulbasaur_bulb'
  | 'eevee_tail'
  | 'jigglypuff_tail'
  | 'psyduck_tail'
  | 'snorlax_back'
  | 'gengar_shadow'
  | 'charizard_wings'
  | 'mew_tail'
  | 'lugia_wings'
  | 'growlithe_tail'
  | 'gardevoir_dress'
  | 'absol_tail'
  | 'beedrill_wings'
  | 'mega_lucario_aura'
  | 'mega_charizard_x_wings'
  | 'mega_charizard_y_wings'
  | 'fearow_wings';

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
  | 'hulk'
  | 'batman'
  | 'captain_america'
  | 'thor'
  | 'superman'
  | 'flash'
  | 'panther'
  | 'slp'
  | 'slp_girl'
  | 'wolverine'
  | 'dr_strange'
  | 'starlord'
  | 'antman'
  | 'war_machine'
  | 'vision'
  | 'daredevil'
  | 'hawkeye'
  | 'falcon'
  | 'venom'
  | 'ghost_rider'
  | 'silver_surfer'
  | 'solmoe'
  | 'charizard_boots'
  | 'mew_feet'
  | 'lugia_feet'
  | 'growlithe_feet'
  | 'gardevoir_feet'
  | 'absol_feet'
  | 'beedrill_feet'
  | 'mega_lucario_feet'
  | 'mega_charizard_x_feet'
  | 'mega_charizard_y_feet'
  | 'fearow_feet';

export type ItemKind =
  | TopKind
  | BottomKind
  | HatKind
  | MaskKind
  | BackKind
  | ShoeKind
  | MiscKind;

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

export const SLOT_ORDER: Slot[] = ['mask', 'top', 'bottom', 'hat', 'back', 'shoes', 'misc'];

export const SLOT_LABEL: Record<Slot, string> = {
  top: 'Top',
  bottom: 'Bottom',
  hat: 'Hat',
  mask: 'Mask',
  back: 'Bag',
  shoes: 'Shoes',
  misc: 'Misc',
};

export const ITEMS: Item[] = [
  // ───────── Tops (10) ─────────
  { id: 'top.basic_white', name: 'White Tee', slot: 'top', price: 0, color: '#ffffff', kind: 'tee' },
  { id: 'top.red_hoodie', name: 'Red Hoodie', slot: 'top', price: 50, color: '#ef4444', accent: '#7f1d1d', kind: 'hoodie' },
  { id: 'top.spacesuit', name: 'Spacesuit Top', slot: 'top', price: 80, color: '#e2e8f0', accent: '#3b82f6', kind: 'spacesuit' },
  { id: 'top.blue_stripe', name: 'Blue Striped Tee', slot: 'top', price: 40, color: '#60a5fa', accent: '#ffffff', kind: 'striped' },
  { id: 'top.pink_tee', name: 'Pink Tee', slot: 'top', price: 40, color: '#f472b6', kind: 'tee', genders: ['girl'] },
  { id: 'top.green_dino', name: 'Green Dino Tee', slot: 'top', price: 70, color: '#34d399', accent: '#fde68a', kind: 'dino' },
  { id: 'top.yellow_rain', name: 'Yellow Raincoat', slot: 'top', price: 60, color: '#facc15', accent: '#a16207', kind: 'raincoat' },
  { id: 'top.purple_star', name: 'Purple Star Tee', slot: 'top', price: 70, color: '#a78bfa', accent: '#fde047', kind: 'star' },
  { id: 'top.black_tee', name: 'Black Tee', slot: 'top', price: 40, color: '#111827', kind: 'tee', genders: ['boy'] },
  { id: 'top.orange_sweater', name: 'Orange Sweater', slot: 'top', price: 60, color: '#fb923c', accent: '#7c2d12', kind: 'sweater' },
  { id: 'top.robot', name: 'Robot Top', slot: 'top', price: 100, color: '#94a3b8', accent: '#22d3ee', kind: 'robot', genders: ['boy'] },

  // ───────── Bottoms (10) ─────────
  { id: 'bottom.jeans', name: 'Jeans', slot: 'bottom', price: 0, color: '#1d4ed8', accent: '#fbbf24', kind: 'jeans' },
  { id: 'bottom.shorts', name: 'Shorts', slot: 'bottom', price: 40, color: '#f59e0b', kind: 'shorts' },
  { id: 'bottom.spacepants', name: 'Spacesuit Pants', slot: 'bottom', price: 80, color: '#e2e8f0', accent: '#3b82f6', kind: 'spacepants' },
  { id: 'bottom.pink_skirt', name: 'Pink Skirt', slot: 'bottom', price: 50, color: '#f472b6', kind: 'skirt', genders: ['girl'] },
  { id: 'bottom.khaki_shorts', name: 'Khaki Shorts', slot: 'bottom', price: 40, color: '#84cc16', kind: 'shorts' },
  { id: 'bottom.black_pants', name: 'Black Pants', slot: 'bottom', price: 40, color: '#1f2937', kind: 'pants' },
  { id: 'bottom.red_shorts', name: 'Red Shorts', slot: 'bottom', price: 40, color: '#ef4444', kind: 'shorts' },
  { id: 'bottom.green_track', name: 'Green Track Pants', slot: 'bottom', price: 60, color: '#16a34a', accent: '#ffffff', kind: 'track' },
  { id: 'bottom.gray_sweat', name: 'Gray Sweatpants', slot: 'bottom', price: 50, color: '#9ca3af', kind: 'sweat' },
  { id: 'bottom.plaid', name: 'Plaid Pants', slot: 'bottom', price: 70, color: '#b45309', accent: '#fde68a', kind: 'plaid' },
  { id: 'bottom.robot', name: 'Robot Pants', slot: 'bottom', price: 90, color: '#94a3b8', accent: '#22d3ee', kind: 'robot', genders: ['boy'] },

  // ───────── Hats (10) ─────────
  { id: 'hat.cap', name: 'Red Cap', slot: 'hat', price: 60, color: '#ef4444', kind: 'cap' },
  { id: 'hat.crown', name: 'Crown', slot: 'hat', price: 120, color: '#fbbf24', kind: 'crown' },
  { id: 'hat.cap_blue', name: 'Blue Cap', slot: 'hat', price: 60, color: '#3b82f6', kind: 'cap' },
  { id: 'hat.beanie_pink', name: 'Pink Beanie', slot: 'hat', price: 50, color: '#f472b6', kind: 'beanie', genders: ['girl'] },
  { id: 'hat.tophat', name: 'Black Top Hat', slot: 'hat', price: 100, color: '#111827', kind: 'tophat', genders: ['boy'] },
  { id: 'hat.wizard', name: 'Wizard Hat', slot: 'hat', price: 130, color: '#7c3aed', kind: 'wizard' },
  { id: 'hat.witch', name: 'Witch Hat', slot: 'hat', price: 120, color: '#1f2937', kind: 'witch' },
  { id: 'hat.cowboy', name: 'Cowboy Hat', slot: 'hat', price: 90, color: '#a16207', kind: 'cowboy', genders: ['boy'] },
  { id: 'hat.sun', name: 'Yellow Sun Hat', slot: 'hat', price: 70, color: '#fde047', kind: 'sunhat' },
  { id: 'hat.pumpkin', name: 'Pumpkin Hat', slot: 'hat', price: 110, color: '#f97316', kind: 'pumpkin' },
  { id: 'hat.robot', name: 'Robot Helmet', slot: 'hat', price: 110, color: '#475569', accent: '#ef4444', kind: 'robot', genders: ['boy'] },

  // ───────── Back (10) ─────────
  { id: 'back.kinder', name: 'Kindergarten Bag', slot: 'back', price: 0, color: '#fb7185', accent: '#fde68a', kind: 'kinder' },
  { id: 'back.backpack', name: 'Green Backpack', slot: 'back', price: 50, color: '#16a34a', accent: '#0f172a', kind: 'pack' },
  { id: 'back.wings', name: 'Wings', slot: 'back', price: 100, color: '#fef3c7', accent: '#fcd34d', kind: 'wing_feather' },
  { id: 'back.angel_wings', name: 'Angel Wings', slot: 'back', price: 140, color: '#ffffff', accent: '#fde68a', kind: 'wing_angel' },
  { id: 'back.bat_wings', name: 'Bat Wings', slot: 'back', price: 130, color: '#1f2937', accent: '#7c3aed', kind: 'wing_bat', genders: ['boy'] },
  { id: 'back.jet_pack', name: 'Jetpack', slot: 'back', price: 150, color: '#94a3b8', accent: '#f97316', kind: 'jetpack', genders: ['boy'] },
  { id: 'back.turtle_shell', name: 'Turtle Shell', slot: 'back', price: 90, color: '#16a34a', accent: '#854d0e', kind: 'shell', genders: ['boy'] },
  { id: 'back.cape_red', name: 'Red Cape', slot: 'back', price: 110, color: '#dc2626', accent: '#fbbf24', kind: 'cape', genders: ['boy'] },
  { id: 'back.black_backpack', name: 'Black Backpack', slot: 'back', price: 60, color: '#1f2937', accent: '#475569', kind: 'pack', genders: ['boy'] },
  { id: 'back.star_wings', name: 'Star Wings', slot: 'back', price: 160, color: '#fde047', accent: '#f97316', kind: 'wing_star' },
  { id: 'back.robot', name: 'Robot Pack', slot: 'back', price: 140, color: '#94a3b8', accent: '#f97316', kind: 'robot', genders: ['boy'] },

  // ───────── Shoes (10) ─────────
  { id: 'shoes.sneakers', name: 'Sneakers', slot: 'shoes', price: 40, color: '#f8fafc', accent: '#0f172a', kind: 'sneakers' },
  { id: 'shoes.boots', name: 'Brown Boots', slot: 'shoes', price: 70, color: '#7c2d12', accent: '#fbbf24', kind: 'boots', genders: ['boy'] },
  { id: 'shoes.pink', name: 'Pink Shoes', slot: 'shoes', price: 50, color: '#f472b6', accent: '#be185d', kind: 'flat', genders: ['girl'] },
  { id: 'shoes.rain_boots', name: 'Yellow Rain Boots', slot: 'shoes', price: 60, color: '#facc15', accent: '#a16207', kind: 'rainboots' },
  { id: 'shoes.red_sport', name: 'Red Sport Shoes', slot: 'shoes', price: 60, color: '#ef4444', accent: '#ffffff', kind: 'sport' },
  { id: 'shoes.black_sneakers', name: 'Black Sneakers', slot: 'shoes', price: 50, color: '#111827', accent: '#ffffff', kind: 'sneakers', genders: ['boy'] },
  { id: 'shoes.sandals', name: 'Sandals', slot: 'shoes', price: 40, color: '#92400e', accent: '#fbbf24', kind: 'sandals' },
  { id: 'shoes.skates', name: 'Roller Skates', slot: 'shoes', price: 120, color: '#3b82f6', accent: '#ffffff', kind: 'skates' },
  { id: 'shoes.snow', name: 'Snow Boots', slot: 'shoes', price: 90, color: '#ffffff', accent: '#94a3b8', kind: 'snowboots' },
  { id: 'shoes.light_up', name: 'Light-Up Shoes', slot: 'shoes', price: 130, color: '#c084fc', accent: '#fde047', kind: 'lightup' },
  { id: 'shoes.robot', name: 'Robot Shoes', slot: 'shoes', price: 90, color: '#94a3b8', accent: '#1e293b', kind: 'robot', genders: ['boy'] },

  // ───────── Ironman set (boy only) ─────────
  { id: 'top.ironman', name: 'Iron Man Armor', slot: 'top', price: 200, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'bottom.ironman', name: 'Iron Man Legs', slot: 'bottom', price: 180, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'mask.ironman', name: 'Iron Man Mask', slot: 'mask', price: 220, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'back.ironman', name: 'Iron Man Wings', slot: 'back', price: 220, color: '#dc2626', accent: '#fbbf24', kind: 'ironman', genders: ['boy'] },
  { id: 'shoes.ironman', name: 'Iron Man Boots', slot: 'shoes', price: 150, color: '#fbbf24', accent: '#dc2626', kind: 'ironman', genders: ['boy'] },

  // ───────── Spider-Man set (boy only) ─────────
  { id: 'mask.spiderman', name: 'Spider-Man Mask', slot: 'mask', price: 200, color: '#c81e1e', accent: '#1e3a8a', kind: 'spiderman', genders: ['boy'] },
  { id: 'top.spiderman', name: 'Spider-Man Top', slot: 'top', price: 200, color: '#c81e1e', accent: '#1e3a8a', kind: 'spiderman', genders: ['boy'] },
  { id: 'bottom.spiderman', name: 'Spider-Man Bottoms', slot: 'bottom', price: 180, color: '#1e3a8a', accent: '#c81e1e', kind: 'spiderman', genders: ['boy'] },
  { id: 'back.spiderman', name: 'Spider-Man Emblem', slot: 'back', price: 150, color: '#c81e1e', accent: '#10101e', kind: 'spiderman', genders: ['boy'] },
  { id: 'shoes.spiderman', name: 'Spider-Man Boots', slot: 'shoes', price: 150, color: '#c81e1e', accent: '#10101e', kind: 'spiderman', genders: ['boy'] },

  // ───────── Hulk set (boy only) ─────────
  { id: 'mask.hulk', name: 'Hulk Face', slot: 'mask', price: 200, color: '#73b339', accent: '#1f2937', kind: 'hulk', genders: ['boy'] },
  { id: 'top.hulk', name: 'Hulk Muscle Top', slot: 'top', price: 200, color: '#73b339', accent: '#3f6212', kind: 'hulk', genders: ['boy'] },
  { id: 'bottom.hulk', name: 'Hulk Torn Pants', slot: 'bottom', price: 180, color: '#475569', accent: '#73b339', kind: 'hulk', genders: ['boy'] },
  { id: 'back.hulk', name: 'Hulk Torn Shirt', slot: 'back', price: 120, color: '#6d28d9', accent: '#4c1d95', kind: 'hulk', genders: ['boy'] },
  { id: 'shoes.hulk', name: 'Hulk Bare Feet', slot: 'shoes', price: 100, color: '#73b339', accent: '#3f6212', kind: 'hulk', genders: ['boy'] },

  // ───────── Batman set (boy only) ─────────
  { id: 'mask.batman', name: 'Batman Cowl', slot: 'mask', price: 200, color: '#0f172a', accent: '#cbd5e1', kind: 'batman', genders: ['boy'] },
  { id: 'top.batman', name: 'Batman Armor', slot: 'top', price: 200, color: '#0f172a', accent: '#fbbf24', kind: 'batman', genders: ['boy'] },
  { id: 'bottom.batman', name: 'Batman Pants', slot: 'bottom', price: 170, color: '#1f2937', accent: '#fbbf24', kind: 'batman', genders: ['boy'] },
  { id: 'back.batman', name: 'Batman Cape', slot: 'back', price: 200, color: '#0f172a', accent: '#1e293b', kind: 'batman_cape', genders: ['boy'] },
  { id: 'shoes.batman', name: 'Batman Boots', slot: 'shoes', price: 150, color: '#0f172a', accent: '#475569', kind: 'batman', genders: ['boy'] },

  // ───────── Captain America set (boy only) ─────────
  { id: 'mask.captain_america', name: 'Captain Cowl', slot: 'mask', price: 200, color: '#1e40af', accent: '#f8fafc', kind: 'captain_america', genders: ['boy'] },
  { id: 'top.captain_america', name: 'Captain Top', slot: 'top', price: 200, color: '#1e40af', accent: '#dc2626', kind: 'captain_america', genders: ['boy'] },
  { id: 'bottom.captain_america', name: 'Captain Bottoms', slot: 'bottom', price: 170, color: '#1e40af', accent: '#dc2626', kind: 'captain_america', genders: ['boy'] },
  { id: 'back.captain_america', name: 'Captain Shield', slot: 'back', price: 220, color: '#1e40af', accent: '#dc2626', kind: 'cap_shield', genders: ['boy'] },
  { id: 'shoes.captain_america', name: 'Captain Boots', slot: 'shoes', price: 150, color: '#7c2d12', accent: '#dc2626', kind: 'captain_america', genders: ['boy'] },

  // ───────── Thor set (boy only) ─────────
  { id: 'mask.thor', name: 'Thor Helmet', slot: 'mask', price: 220, color: '#94a3b8', accent: '#fde047', kind: 'thor', genders: ['boy'] },
  { id: 'top.thor', name: 'Thor Armor', slot: 'top', price: 220, color: '#475569', accent: '#cbd5e1', kind: 'thor', genders: ['boy'] },
  { id: 'bottom.thor', name: 'Thor Pants', slot: 'bottom', price: 190, color: '#1f2937', accent: '#cbd5e1', kind: 'thor', genders: ['boy'] },
  { id: 'back.thor', name: 'Thor Cape', slot: 'back', price: 200, color: '#dc2626', accent: '#fbbf24', kind: 'thor_cape', genders: ['boy'] },
  { id: 'shoes.thor', name: 'Thor Boots', slot: 'shoes', price: 160, color: '#3f3f46', accent: '#cbd5e1', kind: 'thor', genders: ['boy'] },

  // ───────── Superman set (boy only, no mask) ─────────
  { id: 'top.superman', name: 'Superman Top', slot: 'top', price: 200, color: '#1e3a8a', accent: '#dc2626', kind: 'superman', genders: ['boy'] },
  { id: 'bottom.superman', name: 'Superman Bottoms', slot: 'bottom', price: 170, color: '#1e3a8a', accent: '#dc2626', kind: 'superman', genders: ['boy'] },
  { id: 'back.superman', name: 'Superman Cape', slot: 'back', price: 200, color: '#dc2626', accent: '#fbbf24', kind: 'superman_cape', genders: ['boy'] },
  { id: 'shoes.superman', name: 'Superman Boots', slot: 'shoes', price: 150, color: '#dc2626', accent: '#fbbf24', kind: 'superman', genders: ['boy'] },

  // ───────── Flash set (boy only) ─────────
  { id: 'mask.flash', name: 'Flash Mask', slot: 'mask', price: 200, color: '#dc2626', accent: '#fde047', kind: 'flash', genders: ['boy'] },
  { id: 'top.flash', name: 'Flash Top', slot: 'top', price: 200, color: '#dc2626', accent: '#fde047', kind: 'flash', genders: ['boy'] },
  { id: 'bottom.flash', name: 'Flash Bottoms', slot: 'bottom', price: 170, color: '#dc2626', accent: '#fde047', kind: 'flash', genders: ['boy'] },
  { id: 'back.flash', name: 'Flash Lightning Bolt', slot: 'back', price: 130, color: '#fde047', accent: '#dc2626', kind: 'flash_bolt', genders: ['boy'] },
  { id: 'shoes.flash', name: 'Flash Boots', slot: 'shoes', price: 150, color: '#fde047', accent: '#dc2626', kind: 'flash', genders: ['boy'] },

  // ───────── Black Panther set (boy only) ─────────
  { id: 'mask.panther', name: 'Black Panther Mask', slot: 'mask', price: 220, color: '#0a0a0a', accent: '#cbd5e1', kind: 'panther', genders: ['boy'] },
  { id: 'top.panther', name: 'Black Panther Top', slot: 'top', price: 220, color: '#0a0a0a', accent: '#cbd5e1', kind: 'panther', genders: ['boy'] },
  { id: 'bottom.panther', name: 'Black Panther Bottoms', slot: 'bottom', price: 200, color: '#0a0a0a', accent: '#cbd5e1', kind: 'panther', genders: ['boy'] },
  { id: 'back.panther', name: 'Black Panther Cape', slot: 'back', price: 200, color: '#0a0a0a', accent: '#cbd5e1', kind: 'panther_cape', genders: ['boy'] },
  { id: 'shoes.panther', name: 'Black Panther Boots', slot: 'shoes', price: 170, color: '#0a0a0a', accent: '#cbd5e1', kind: 'panther', genders: ['boy'] },

  // ───────── SLP 원복 (boy only) ─────────
  { id: 'top.slp', name: 'SLP Uniform Jacket', slot: 'top', price: 220, color: '#475569', accent: '#dc2626', kind: 'slp', genders: ['boy'] },
  { id: 'bottom.slp', name: 'SLP Uniform Pants', slot: 'bottom', price: 160, color: '#1e3a8a', accent: '#0c1a47', kind: 'slp', genders: ['boy'] },
  { id: 'shoes.slp', name: 'SLP Dress Shoes', slot: 'shoes', price: 140, color: '#0a0a0a', accent: '#475569', kind: 'slp', genders: ['boy'] },
  { id: 'back.slp', name: 'SLP Bag', slot: 'back', price: 130, color: '#dc2626', accent: '#f8fafc', kind: 'slp_backpack', genders: ['boy'] },

  // ───────── SLP 원복 — 여자 ─────────
  { id: 'top.slp_girl', name: 'SLP Uniform Jacket (Girl)', slot: 'top', price: 220, color: '#475569', accent: '#dc2626', kind: 'slp_girl', genders: ['girl'] },
  { id: 'bottom.slp_girl', name: 'SLP Uniform Skirt', slot: 'bottom', price: 160, color: '#1e3a8a', accent: '#0c1a47', kind: 'slp_skirt', genders: ['girl'] },
  { id: 'shoes.slp_girl', name: 'SLP Mary Janes', slot: 'shoes', price: 140, color: '#0a0a0a', accent: '#475569', kind: 'slp_girl', genders: ['girl'] },
  { id: 'back.slp_girl', name: 'SLP Bag', slot: 'back', price: 130, color: '#dc2626', accent: '#f8fafc', kind: 'slp_backpack', genders: ['girl'] },

  // ───────── Joon's birthday set (boy only) ─────────
  { id: 'top.joon_birthday', name: "Joon's birthday 가디건", slot: 'top', price: 220, color: '#f5ede0', accent: '#fde047', kind: 'joon_cardigan', genders: ['boy'] },
  { id: 'bottom.joon_birthday', name: "Joon's birthday 반바지", slot: 'bottom', price: 140, color: '#d4c5a0', accent: '#8b7355', kind: 'shorts', genders: ['boy'] },
  { id: 'shoes.joon_birthday', name: "Joon's birthday 운동화", slot: 'shoes', price: 150, color: '#cbd5e1', accent: '#475569', kind: 'sneakers', genders: ['boy'] },

  // ───────── Princess set (girl only) ─────────
  { id: 'top.princess_pink', name: 'Pink Princess Dress', slot: 'top', price: 220, color: '#f9a8d4', accent: '#fde68a', kind: 'princess_dress', genders: ['girl'] },
  { id: 'top.princess_snow', name: 'Snow Princess Dress', slot: 'top', price: 220, color: '#bae6fd', accent: '#ffffff', kind: 'princess_dress', genders: ['girl'] },
  { id: 'top.princess_gold', name: 'Golden Princess Dress', slot: 'top', price: 240, color: '#fde047', accent: '#fffbeb', kind: 'princess_dress', genders: ['girl'] },

  { id: 'bottom.princess_pink', name: 'Pink Princess Skirt', slot: 'bottom', price: 200, color: '#f9a8d4', accent: '#ffffff', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'bottom.princess_snow', name: 'Snow Princess Skirt', slot: 'bottom', price: 200, color: '#bae6fd', accent: '#ffffff', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'bottom.tutu', name: 'Ballet Tutu', slot: 'bottom', price: 160, color: '#fce7f3', kind: 'tutu', genders: ['girl'] },

  { id: 'hat.tiara', name: 'Tiara', slot: 'hat', price: 180, color: '#fbbf24', accent: '#ec4899', kind: 'tiara', genders: ['girl'] },
  { id: 'hat.flower_crown', name: 'Flower Crown', slot: 'hat', price: 140, color: '#f472b6', accent: '#ffffff', kind: 'flower_crown', genders: ['girl'] },
  { id: 'hat.princess_crown', name: 'Princess Crown', slot: 'hat', price: 220, color: '#fbbf24', accent: '#ec4899', kind: 'princess_crown', genders: ['girl'] },

  { id: 'back.fairy_wings', name: 'Fairy Wings', slot: 'back', price: 180, color: '#fbcfe8', kind: 'fairy_wings', genders: ['girl'] },
  { id: 'back.butterfly', name: 'Butterfly Wings', slot: 'back', price: 180, color: '#c084fc', accent: '#fde047', kind: 'butterfly', genders: ['girl'] },
  { id: 'back.princess_cape', name: 'Princess Cape', slot: 'back', price: 200, color: '#ec4899', accent: '#ffffff', kind: 'princess_cape', genders: ['girl'] },

  { id: 'shoes.glass_slipper', name: 'Glass Slippers', slot: 'shoes', price: 240, color: '#e0f2fe', kind: 'glass_slipper', genders: ['girl'] },
  { id: 'shoes.ballet', name: 'Ballet Shoes', slot: 'shoes', price: 140, color: '#fbcfe8', accent: '#ec4899', kind: 'ballet', genders: ['girl'] },
  { id: 'shoes.ribbon_heel', name: 'Ribbon Heels', slot: 'shoes', price: 160, color: '#f9a8d4', accent: '#ffffff', kind: 'ribbon_heel', genders: ['girl'] },


  // ───────── Disney Princess full sets (girl only) ─────────
  // Elsa (Frozen) — icy blues + snowflakes
  { id: 'hat.elsa', name: 'Elsa Crown', slot: 'hat', price: 220, color: '#bae6fd', accent: '#38bdf8', kind: 'elsa_crown', genders: ['girl'] },
  { id: 'top.elsa', name: 'Elsa Dress', slot: 'top', price: 260, color: '#7dd3fc', accent: '#ffffff', kind: 'elsa_top', genders: ['girl'] },
  { id: 'bottom.elsa', name: 'Elsa Skirt', slot: 'bottom', price: 240, color: '#7dd3fc', accent: '#ffffff', kind: 'elsa_skirt', genders: ['girl'] },
  { id: 'back.elsa', name: 'Elsa Cape', slot: 'back', price: 240, color: '#bae6fd', accent: '#ffffff', kind: 'elsa_cape', genders: ['girl'] },
  { id: 'shoes.elsa', name: 'Elsa Glass Slippers', slot: 'shoes', price: 240, color: '#bae6fd', accent: '#0ea5e9', kind: 'glass_slipper', genders: ['girl'] },

  // Cinderella — pale blue ball gown
  { id: 'hat.cinderella', name: 'Cinderella Tiara', slot: 'hat', price: 200, color: '#cbd5e1', accent: '#0ea5e9', kind: 'tiara', genders: ['girl'] },
  { id: 'top.cinderella', name: 'Cinderella Dress', slot: 'top', price: 240, color: '#a5d8ff', accent: '#f1f5f9', kind: 'princess_dress', genders: ['girl'] },
  { id: 'bottom.cinderella', name: 'Cinderella Skirt', slot: 'bottom', price: 220, color: '#a5d8ff', accent: '#ffffff', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'back.cinderella', name: 'Cinderella Cape', slot: 'back', price: 220, color: '#a5d8ff', accent: '#ffffff', kind: 'princess_cape', genders: ['girl'] },
  { id: 'shoes.cinderella', name: 'Cinderella Glass Slippers', slot: 'shoes', price: 260, color: '#e0f2fe', accent: '#0ea5e9', kind: 'glass_slipper', genders: ['girl'] },

  // Belle (Beauty & the Beast) — golden yellow gown
  { id: 'hat.belle', name: 'Belle Rose Pin', slot: 'hat', price: 150, color: '#dc2626', accent: '#16a34a', kind: 'belle_bow', genders: ['girl'] },
  { id: 'top.belle', name: 'Belle Dress', slot: 'top', price: 240, color: '#fde047', accent: '#fbbf24', kind: 'princess_dress', genders: ['girl'] },
  { id: 'bottom.belle', name: 'Belle Skirt', slot: 'bottom', price: 220, color: '#fde047', accent: '#fef3c7', kind: 'princess_skirt', genders: ['girl'] },
  { id: 'back.belle', name: 'Belle Cape', slot: 'back', price: 220, color: '#fde047', accent: '#dc2626', kind: 'princess_cape', genders: ['girl'] },
  { id: 'shoes.belle', name: 'Belle Shoes', slot: 'shoes', price: 150, color: '#fde047', accent: '#fbbf24', kind: 'ballet', genders: ['girl'] },

  // Ariel (Little Mermaid) — purple shell + green tail
  { id: 'hat.ariel', name: 'Ariel Shell Pin', slot: 'hat', price: 140, color: '#fbcfe8', accent: '#f472b6', kind: 'ariel_shell', genders: ['girl'] },
  { id: 'top.ariel', name: 'Ariel Shell Top', slot: 'top', price: 220, color: '#c084fc', accent: '#fbcfe8', kind: 'ariel_top', genders: ['girl'] },
  { id: 'bottom.ariel', name: 'Ariel Mermaid Tail', slot: 'bottom', price: 260, color: '#22c55e', accent: '#15803d', kind: 'ariel_tail', genders: ['girl'] },
  { id: 'back.ariel', name: 'Ariel Red Hair', slot: 'back', price: 200, color: '#ef4444', accent: '#7f1d1d', kind: 'ariel_wave', genders: ['girl'] },
  { id: 'shoes.ariel', name: 'Ariel Pearl Shoes', slot: 'shoes', price: 160, color: '#fce7f3', accent: '#f472b6', kind: 'ballet', genders: ['girl'] },

  // Rapunzel (Tangled) — lavender corset + long blonde hair
  { id: 'hat.rapunzel', name: 'Rapunzel Flower Crown', slot: 'hat', price: 150, color: '#fde047', accent: '#f472b6', kind: 'flower_crown', genders: ['girl'] },
  { id: 'top.rapunzel', name: 'Rapunzel Top', slot: 'top', price: 220, color: '#c084fc', accent: '#f9a8d4', kind: 'rapunzel_top', genders: ['girl'] },
  { id: 'bottom.rapunzel', name: 'Rapunzel Skirt', slot: 'bottom', price: 220, color: '#a78bfa', accent: '#ffffff', kind: 'rapunzel_skirt', genders: ['girl'] },
  { id: 'back.rapunzel', name: 'Rapunzel Golden Hair', slot: 'back', price: 240, color: '#fde047', accent: '#fbbf24', kind: 'rapunzel_hair', genders: ['girl'] },
  { id: 'shoes.rapunzel', name: 'Rapunzel Sandals', slot: 'shoes', price: 130, color: '#92400e', accent: '#fbbf24', kind: 'sandals', genders: ['girl'] },

  // ───────── Marvel heroes — extra set (boy only) ─────────
  // Wolverine
  { id: 'mask.wolverine', name: 'Wolverine Mask', slot: 'mask', price: 200, color: '#fbbf24', accent: '#0a0a0a', kind: 'wolverine', genders: ['boy'] },
  { id: 'top.wolverine', name: 'Wolverine Suit', slot: 'top', price: 200, color: '#fbbf24', accent: '#1e3a8a', kind: 'wolverine', genders: ['boy'] },
  { id: 'bottom.wolverine', name: 'Wolverine Pants', slot: 'bottom', price: 180, color: '#1e3a8a', accent: '#fbbf24', kind: 'wolverine', genders: ['boy'] },
  { id: 'back.wolverine', name: 'Wolverine Claws Pack', slot: 'back', price: 180, color: '#fbbf24', accent: '#cbd5e1', kind: 'wolverine_claws', genders: ['boy'] },
  { id: 'shoes.wolverine', name: 'Wolverine Boots', slot: 'shoes', price: 150, color: '#1e3a8a', accent: '#fbbf24', kind: 'wolverine', genders: ['boy'] },

  // Doctor Strange (no mask)
  { id: 'top.dr_strange', name: 'Dr. Strange Robe', slot: 'top', price: 220, color: '#1e40af', accent: '#fbbf24', kind: 'dr_strange', genders: ['boy'] },
  { id: 'bottom.dr_strange', name: 'Dr. Strange Robe Bottom', slot: 'bottom', price: 200, color: '#1e40af', accent: '#fbbf24', kind: 'dr_strange', genders: ['boy'] },
  { id: 'back.dr_strange', name: 'Cloak of Levitation', slot: 'back', price: 240, color: '#dc2626', accent: '#fbbf24', kind: 'dr_strange_cape', genders: ['boy'] },
  { id: 'shoes.dr_strange', name: 'Dr. Strange Boots', slot: 'shoes', price: 150, color: '#7c2d12', accent: '#fbbf24', kind: 'dr_strange', genders: ['boy'] },

  // Star-Lord
  { id: 'mask.starlord', name: 'Star-Lord Helmet', slot: 'mask', price: 200, color: '#7f1d1d', accent: '#fbbf24', kind: 'starlord', genders: ['boy'] },
  { id: 'top.starlord', name: 'Star-Lord Jacket', slot: 'top', price: 200, color: '#7f1d1d', accent: '#fbbf24', kind: 'starlord', genders: ['boy'] },
  { id: 'bottom.starlord', name: 'Star-Lord Pants', slot: 'bottom', price: 180, color: '#3f3f1a', accent: '#7f1d1d', kind: 'starlord', genders: ['boy'] },
  { id: 'back.starlord', name: 'Star-Lord Pack', slot: 'back', price: 220, color: '#7f1d1d', accent: '#fbbf24', kind: 'starlord_pack', genders: ['boy'] },
  { id: 'shoes.starlord', name: 'Star-Lord Boots', slot: 'shoes', price: 150, color: '#3f3f1a', accent: '#7f1d1d', kind: 'starlord', genders: ['boy'] },

  // Ant-Man
  { id: 'mask.antman', name: 'Ant-Man Helmet', slot: 'mask', price: 200, color: '#dc2626', accent: '#0a0a0a', kind: 'antman', genders: ['boy'] },
  { id: 'top.antman', name: 'Ant-Man Suit', slot: 'top', price: 200, color: '#dc2626', accent: '#0a0a0a', kind: 'antman', genders: ['boy'] },
  { id: 'bottom.antman', name: 'Ant-Man Pants', slot: 'bottom', price: 180, color: '#dc2626', accent: '#0a0a0a', kind: 'antman', genders: ['boy'] },
  { id: 'back.antman', name: 'Ant-Man Pack', slot: 'back', price: 180, color: '#dc2626', accent: '#0a0a0a', kind: 'antman_pack', genders: ['boy'] },
  { id: 'shoes.antman', name: 'Ant-Man Boots', slot: 'shoes', price: 150, color: '#0a0a0a', accent: '#dc2626', kind: 'antman', genders: ['boy'] },

  // War Machine
  { id: 'mask.war_machine', name: 'War Machine Helmet', slot: 'mask', price: 220, color: '#475569', accent: '#dc2626', kind: 'war_machine', genders: ['boy'] },
  { id: 'top.war_machine', name: 'War Machine Armor', slot: 'top', price: 220, color: '#475569', accent: '#1e293b', kind: 'war_machine', genders: ['boy'] },
  { id: 'bottom.war_machine', name: 'War Machine Legs', slot: 'bottom', price: 200, color: '#475569', accent: '#1e293b', kind: 'war_machine', genders: ['boy'] },
  { id: 'back.war_machine', name: 'War Machine Cannon', slot: 'back', price: 240, color: '#475569', accent: '#1e293b', kind: 'war_machine_back', genders: ['boy'] },
  { id: 'shoes.war_machine', name: 'War Machine Boots', slot: 'shoes', price: 160, color: '#475569', accent: '#1e293b', kind: 'war_machine', genders: ['boy'] },

  // Vision
  { id: 'mask.vision', name: 'Vision Face', slot: 'mask', price: 220, color: '#dc2626', accent: '#fde047', kind: 'vision', genders: ['boy'] },
  { id: 'top.vision', name: 'Vision Suit', slot: 'top', price: 220, color: '#16a34a', accent: '#fde047', kind: 'vision', genders: ['boy'] },
  { id: 'bottom.vision', name: 'Vision Pants', slot: 'bottom', price: 200, color: '#16a34a', accent: '#fde047', kind: 'vision', genders: ['boy'] },
  { id: 'back.vision', name: 'Vision Cape', slot: 'back', price: 220, color: '#fde047', accent: '#dc2626', kind: 'vision_cape', genders: ['boy'] },
  { id: 'shoes.vision', name: 'Vision Boots', slot: 'shoes', price: 160, color: '#16a34a', accent: '#fde047', kind: 'vision', genders: ['boy'] },

  // Daredevil
  { id: 'mask.daredevil', name: 'Daredevil Cowl', slot: 'mask', price: 200, color: '#7f1d1d', accent: '#0a0a0a', kind: 'daredevil', genders: ['boy'] },
  { id: 'top.daredevil', name: 'Daredevil Suit', slot: 'top', price: 200, color: '#7f1d1d', accent: '#0a0a0a', kind: 'daredevil', genders: ['boy'] },
  { id: 'bottom.daredevil', name: 'Daredevil Pants', slot: 'bottom', price: 180, color: '#7f1d1d', accent: '#0a0a0a', kind: 'daredevil', genders: ['boy'] },
  { id: 'back.daredevil', name: 'Daredevil Batons', slot: 'back', price: 160, color: '#0a0a0a', accent: '#7f1d1d', kind: 'daredevil_back', genders: ['boy'] },
  { id: 'shoes.daredevil', name: 'Daredevil Boots', slot: 'shoes', price: 150, color: '#7f1d1d', accent: '#0a0a0a', kind: 'daredevil', genders: ['boy'] },

  // Hawkeye (no mask)
  { id: 'top.hawkeye', name: 'Hawkeye Vest', slot: 'top', price: 200, color: '#6d28d9', accent: '#1f2937', kind: 'hawkeye', genders: ['boy'] },
  { id: 'bottom.hawkeye', name: 'Hawkeye Pants', slot: 'bottom', price: 180, color: '#1f2937', accent: '#6d28d9', kind: 'hawkeye', genders: ['boy'] },
  { id: 'back.hawkeye', name: 'Hawkeye Quiver', slot: 'back', price: 200, color: '#6d28d9', accent: '#7c2d12', kind: 'hawkeye_quiver', genders: ['boy'] },
  { id: 'shoes.hawkeye', name: 'Hawkeye Boots', slot: 'shoes', price: 150, color: '#1f2937', accent: '#6d28d9', kind: 'hawkeye', genders: ['boy'] },

  // Falcon
  { id: 'mask.falcon', name: 'Falcon Goggles', slot: 'mask', price: 200, color: '#7f1d1d', accent: '#fbbf24', kind: 'falcon', genders: ['boy'] },
  { id: 'top.falcon', name: 'Falcon Suit', slot: 'top', price: 200, color: '#7f1d1d', accent: '#fbbf24', kind: 'falcon', genders: ['boy'] },
  { id: 'bottom.falcon', name: 'Falcon Pants', slot: 'bottom', price: 180, color: '#7f1d1d', accent: '#1f2937', kind: 'falcon', genders: ['boy'] },
  { id: 'back.falcon', name: 'Falcon Wings', slot: 'back', price: 240, color: '#cbd5e1', accent: '#7f1d1d', kind: 'falcon_wings', genders: ['boy'] },
  { id: 'shoes.falcon', name: 'Falcon Boots', slot: 'shoes', price: 150, color: '#1f2937', accent: '#7f1d1d', kind: 'falcon', genders: ['boy'] },

  // Venom
  { id: 'mask.venom', name: 'Venom Head', slot: 'mask', price: 220, color: '#0a0a0a', accent: '#f8fafc', kind: 'venom', genders: ['boy'] },
  { id: 'top.venom', name: 'Venom Body', slot: 'top', price: 220, color: '#0a0a0a', accent: '#f8fafc', kind: 'venom', genders: ['boy'] },
  { id: 'bottom.venom', name: 'Venom Legs', slot: 'bottom', price: 200, color: '#0a0a0a', accent: '#f8fafc', kind: 'venom', genders: ['boy'] },
  { id: 'back.venom', name: 'Venom Tendrils', slot: 'back', price: 200, color: '#0a0a0a', accent: '#f8fafc', kind: 'venom_back', genders: ['boy'] },
  { id: 'shoes.venom', name: 'Venom Feet', slot: 'shoes', price: 160, color: '#0a0a0a', accent: '#f8fafc', kind: 'venom', genders: ['boy'] },

  // Ghost Rider
  { id: 'mask.ghost_rider', name: 'Ghost Rider Skull', slot: 'mask', price: 240, color: '#f8fafc', accent: '#fb923c', kind: 'ghost_rider', genders: ['boy'] },
  { id: 'top.ghost_rider', name: 'Ghost Rider Jacket', slot: 'top', price: 220, color: '#1f2937', accent: '#cbd5e1', kind: 'ghost_rider', genders: ['boy'] },
  { id: 'bottom.ghost_rider', name: 'Ghost Rider Pants', slot: 'bottom', price: 200, color: '#1f2937', accent: '#cbd5e1', kind: 'ghost_rider', genders: ['boy'] },
  { id: 'back.ghost_rider', name: 'Ghost Rider Chains', slot: 'back', price: 200, color: '#cbd5e1', accent: '#fb923c', kind: 'ghost_rider_back', genders: ['boy'] },
  { id: 'shoes.ghost_rider', name: 'Ghost Rider Boots', slot: 'shoes', price: 160, color: '#1f2937', accent: '#cbd5e1', kind: 'ghost_rider', genders: ['boy'] },
  { id: 'misc.ghost_rider_bike', name: 'Ghost Rider 헬파이어 오토바이', slot: 'misc', price: 500, color: '#cbd5e1', accent: '#fb923c', kind: 'motorcycle', genders: ['boy'] },
  { id: 'misc.pikachu', name: '피카츄', slot: 'misc', price: 400, color: '#facc15', accent: '#dc2626', kind: 'pikachu' },

  // ───────── Pokemon set (unisex) ─────────
  { id: 'mask.charmander', name: '파이리 얼굴', slot: 'mask', price: 180, color: '#f97316', accent: '#fef3c7', kind: 'charmander_face' },
  { id: 'mask.squirtle', name: '꼬부기 얼굴', slot: 'mask', price: 180, color: '#38bdf8', accent: '#fef3c7', kind: 'squirtle_face' },
  { id: 'mask.bulbasaur', name: '이상해씨 얼굴', slot: 'mask', price: 180, color: '#4ade80', accent: '#166534', kind: 'bulbasaur_face' },
  { id: 'mask.eevee', name: '이브이 얼굴', slot: 'mask', price: 180, color: '#a16207', accent: '#fef3c7', kind: 'eevee_face' },
  { id: 'top.snorlax', name: '잠만보 잠옷', slot: 'top', price: 220, color: '#fef3c7', accent: '#0f172a', kind: 'snorlax_suit' },
  { id: 'top.gengar', name: '겐가 슈트', slot: 'top', price: 220, color: '#6b21a8', accent: '#dc2626', kind: 'gengar_suit' },
  { id: 'shoes.charizard', name: '리자몽 부츠', slot: 'shoes', price: 180, color: '#f97316', accent: '#fef3c7', kind: 'charizard_boots' },

  // ───────── Pokemon 10 full sets ─────────
  // Pikachu (yellow / red cheeks)
  { id: 'mask.pikachu', name: '피카츄 얼굴', slot: 'mask', price: 180, color: '#facc15', accent: '#dc2626', kind: 'pikachu_face' },
  { id: 'top.pikachu', name: '피카츄 상의', slot: 'top', price: 180, color: '#facc15', accent: '#a16207', kind: 'pikachu_top' },
  { id: 'bottom.pikachu', name: '피카츄 하의', slot: 'bottom', price: 160, color: '#facc15', accent: '#a16207', kind: 'pikachu_legs' },
  { id: 'back.pikachu', name: '피카츄 번개 꼬리', slot: 'back', price: 160, color: '#facc15', accent: '#78350f', kind: 'pikachu_tail' },
  // Charmander (orange / cream)
  { id: 'top.charmander', name: '파이리 상의', slot: 'top', price: 180, color: '#f97316', accent: '#fef3c7', kind: 'charmander_top' },
  { id: 'bottom.charmander', name: '파이리 하의', slot: 'bottom', price: 160, color: '#f97316', accent: '#fef3c7', kind: 'charmander_legs' },
  { id: 'back.charmander', name: '파이리 불꼬리', slot: 'back', price: 180, color: '#f97316', accent: '#fbbf24', kind: 'charmander_tail' },
  // Squirtle (blue / cream)
  { id: 'top.squirtle', name: '꼬부기 상의', slot: 'top', price: 180, color: '#38bdf8', accent: '#fef3c7', kind: 'squirtle_top' },
  { id: 'bottom.squirtle', name: '꼬부기 하의', slot: 'bottom', price: 160, color: '#38bdf8', accent: '#fef3c7', kind: 'squirtle_legs' },
  { id: 'back.squirtle', name: '꼬부기 등껍질', slot: 'back', price: 200, color: '#a16207', accent: '#fbbf24', kind: 'squirtle_shell' },
  // Bulbasaur (green / dark green)
  { id: 'top.bulbasaur', name: '이상해씨 상의', slot: 'top', price: 180, color: '#4ade80', accent: '#166534', kind: 'bulbasaur_top' },
  { id: 'bottom.bulbasaur', name: '이상해씨 하의', slot: 'bottom', price: 160, color: '#4ade80', accent: '#166534', kind: 'bulbasaur_legs' },
  { id: 'back.bulbasaur', name: '이상해씨 구근', slot: 'back', price: 200, color: '#4d7c0f', accent: '#166534', kind: 'bulbasaur_bulb' },
  // Eevee (brown / cream)
  { id: 'top.eevee', name: '이브이 상의', slot: 'top', price: 180, color: '#a16207', accent: '#fef3c7', kind: 'eevee_top' },
  { id: 'bottom.eevee', name: '이브이 하의', slot: 'bottom', price: 160, color: '#a16207', accent: '#fef3c7', kind: 'eevee_legs' },
  { id: 'back.eevee', name: '이브이 꼬리', slot: 'back', price: 160, color: '#a16207', accent: '#fef3c7', kind: 'eevee_tail' },
  // Jigglypuff (pink / blue eyes)
  { id: 'mask.jigglypuff', name: '푸린 얼굴', slot: 'mask', price: 180, color: '#fbcfe8', accent: '#3b82f6', kind: 'jigglypuff_face' },
  { id: 'top.jigglypuff', name: '푸린 상의', slot: 'top', price: 180, color: '#fbcfe8', accent: '#f472b6', kind: 'jigglypuff_top' },
  { id: 'bottom.jigglypuff', name: '푸린 하의', slot: 'bottom', price: 160, color: '#fbcfe8', accent: '#f472b6', kind: 'jigglypuff_legs' },
  { id: 'back.jigglypuff', name: '푸린 꼬리', slot: 'back', price: 140, color: '#fbcfe8', accent: '#f472b6', kind: 'jigglypuff_tail' },
  // Psyduck (yellow / orange bill)
  { id: 'mask.psyduck', name: '고라파덕 얼굴', slot: 'mask', price: 180, color: '#facc15', accent: '#f97316', kind: 'psyduck_face' },
  { id: 'top.psyduck', name: '고라파덕 상의', slot: 'top', price: 180, color: '#facc15', accent: '#f97316', kind: 'psyduck_top' },
  { id: 'bottom.psyduck', name: '고라파덕 하의', slot: 'bottom', price: 160, color: '#facc15', accent: '#f97316', kind: 'psyduck_legs' },
  { id: 'back.psyduck', name: '고라파덕 꼬리', slot: 'back', price: 140, color: '#facc15', accent: '#f97316', kind: 'psyduck_tail' },
  // Snorlax (cream / dark navy)
  { id: 'mask.snorlax', name: '잠만보 얼굴', slot: 'mask', price: 180, color: '#fde68a', accent: '#0f172a', kind: 'snorlax_face' },
  { id: 'bottom.snorlax', name: '잠만보 하의', slot: 'bottom', price: 180, color: '#0f172a', accent: '#fde68a', kind: 'snorlax_legs' },
  { id: 'back.snorlax', name: '잠만보 등', slot: 'back', price: 200, color: '#0f172a', accent: '#fde68a', kind: 'snorlax_back' },
  // Gengar (purple / red mouth)
  { id: 'mask.gengar', name: '겐가 얼굴', slot: 'mask', price: 180, color: '#6b21a8', accent: '#dc2626', kind: 'gengar_face' },
  { id: 'bottom.gengar', name: '겐가 하의', slot: 'bottom', price: 160, color: '#6b21a8', accent: '#dc2626', kind: 'gengar_legs' },
  { id: 'back.gengar', name: '겐가 그림자', slot: 'back', price: 200, color: '#6b21a8', accent: '#7f1d1d', kind: 'gengar_shadow' },
  // Charizard (orange / cream)
  { id: 'mask.charizard', name: '리자몽 얼굴', slot: 'mask', price: 220, color: '#f97316', accent: '#fef3c7', kind: 'charizard_face' },
  { id: 'top.charizard', name: '리자몽 상의', slot: 'top', price: 220, color: '#f97316', accent: '#fef3c7', kind: 'charizard_top' },
  { id: 'bottom.charizard', name: '리자몽 하의', slot: 'bottom', price: 200, color: '#f97316', accent: '#fef3c7', kind: 'charizard_legs' },
  { id: 'back.charizard', name: '리자몽 날개', slot: 'back', price: 260, color: '#38bdf8', accent: '#166534', kind: 'charizard_wings' },

  // Mew full set (unisex)
  { id: 'mask.mew', name: '뮤 얼굴', slot: 'mask', price: 220, color: '#fbcfe8', accent: '#7dd3fc', kind: 'mew_face' },
  { id: 'top.mew', name: '뮤 상의', slot: 'top', price: 220, color: '#fbcfe8', accent: '#f472b6', kind: 'mew_top' },
  { id: 'bottom.mew', name: '뮤 하의', slot: 'bottom', price: 200, color: '#fbcfe8', accent: '#f472b6', kind: 'mew_legs' },
  { id: 'back.mew', name: '뮤 꼬리', slot: 'back', price: 200, color: '#fbcfe8', accent: '#f472b6', kind: 'mew_tail' },
  { id: 'shoes.mew', name: '뮤 발', slot: 'shoes', price: 160, color: '#fbcfe8', accent: '#f472b6', kind: 'mew_feet' },

  // Lugia full set (unisex) — legendary diving Pokemon: white body, pale-blue
  // belly, dark navy-blue eye mask and back-plate spikes.
  { id: 'mask.lugia', name: '루기아 얼굴', slot: 'mask', price: 280, color: '#f8fafc', accent: '#1e3a8a', kind: 'lugia_face' },
  { id: 'top.lugia', name: '루기아 상의', slot: 'top', price: 260, color: '#f8fafc', accent: '#bfdbfe', kind: 'lugia_top' },
  { id: 'bottom.lugia', name: '루기아 하의', slot: 'bottom', price: 240, color: '#f8fafc', accent: '#bfdbfe', kind: 'lugia_legs' },
  { id: 'back.lugia', name: '루기아 날개+등가시', slot: 'back', price: 320, color: '#f8fafc', accent: '#1e3a8a', kind: 'lugia_wings' },
  { id: 'shoes.lugia', name: '루기아 발톱', slot: 'shoes', price: 200, color: '#f8fafc', accent: '#1e3a8a', kind: 'lugia_feet' },

  // 가디 (Growlithe) full set — fire puppy: orange body, cream fluffy mane,
  // dark tiger stripes.
  { id: 'mask.growlithe', name: '가디 얼굴', slot: 'mask', price: 220, color: '#ea580c', accent: '#fef3c7', kind: 'growlithe_face' },
  { id: 'top.growlithe', name: '가디 상의', slot: 'top', price: 200, color: '#ea580c', accent: '#fef3c7', kind: 'growlithe_top' },
  { id: 'bottom.growlithe', name: '가디 하의', slot: 'bottom', price: 180, color: '#ea580c', accent: '#7c2d12', kind: 'growlithe_legs' },
  { id: 'back.growlithe', name: '가디 꼬리', slot: 'back', price: 220, color: '#ea580c', accent: '#fef3c7', kind: 'growlithe_tail' },
  { id: 'shoes.growlithe', name: '가디 발', slot: 'shoes', price: 160, color: '#ea580c', accent: '#7c2d12', kind: 'growlithe_feet' },

  // 가디안 (Gardevoir) full set — elegant psychic: green helmet-hair, white
  // gown-body, red horn spike on chest and back.
  { id: 'mask.gardevoir', name: '가디안 얼굴', slot: 'mask', price: 260, color: '#f8fafc', accent: '#16a34a', kind: 'gardevoir_face' },
  { id: 'top.gardevoir', name: '가디안 상의', slot: 'top', price: 260, color: '#f8fafc', accent: '#dc2626', kind: 'gardevoir_top' },
  { id: 'bottom.gardevoir', name: '가디안 하의', slot: 'bottom', price: 240, color: '#f8fafc', accent: '#dc2626', kind: 'gardevoir_legs' },
  { id: 'back.gardevoir', name: '가디안 드레스', slot: 'back', price: 300, color: '#f8fafc', accent: '#dc2626', kind: 'gardevoir_dress' },
  { id: 'shoes.gardevoir', name: '가디안 발', slot: 'shoes', price: 180, color: '#f8fafc', accent: '#16a34a', kind: 'gardevoir_feet' },

  // 앱솔 (Absol) full set — disaster Pokemon: pale white body, dark navy
  // face/mask + sickle-shaped horn + red eyes + fluffy mane and forked tail.
  { id: 'mask.absol', name: '앱솔 얼굴', slot: 'mask', price: 260, color: '#e2e8f0', accent: '#1e293b', kind: 'absol_face' },
  { id: 'top.absol', name: '앱솔 상의', slot: 'top', price: 240, color: '#e2e8f0', accent: '#1e293b', kind: 'absol_top' },
  { id: 'bottom.absol', name: '앱솔 하의', slot: 'bottom', price: 220, color: '#e2e8f0', accent: '#1e293b', kind: 'absol_legs' },
  { id: 'back.absol', name: '앱솔 꼬리', slot: 'back', price: 260, color: '#e2e8f0', accent: '#1e293b', kind: 'absol_tail' },
  { id: 'shoes.absol', name: '앱솔 발톱', slot: 'shoes', price: 180, color: '#e2e8f0', accent: '#1e293b', kind: 'absol_feet' },

  // 독침붕 (Beedrill) full set — poison bee: yellow body with black stripes,
  // drill-shaped stingers on hands and tail, red eyes, gray transparent wings.
  { id: 'mask.beedrill', name: '독침붕 얼굴', slot: 'mask', price: 240, color: '#facc15', accent: '#0a0a0a', kind: 'beedrill_face' },
  { id: 'top.beedrill', name: '독침붕 상의', slot: 'top', price: 240, color: '#facc15', accent: '#0a0a0a', kind: 'beedrill_top' },
  { id: 'bottom.beedrill', name: '독침붕 하의', slot: 'bottom', price: 220, color: '#facc15', accent: '#0a0a0a', kind: 'beedrill_legs' },
  { id: 'back.beedrill', name: '독침붕 날개', slot: 'back', price: 260, color: '#e5e7eb', accent: '#0a0a0a', kind: 'beedrill_wings' },
  { id: 'shoes.beedrill', name: '독침붕 다리', slot: 'shoes', price: 180, color: '#0a0a0a', accent: '#facc15', kind: 'beedrill_feet' },

  // 메가루카리오 (Mega Lucario) full set — mega evolution: blue body, wild
  // yellow mane, red eyes, aura spikes on wrists, long black tail.
  { id: 'mask.mega_lucario', name: '메가루카리오 얼굴', slot: 'mask', price: 320, color: '#1e3a8a', accent: '#facc15', kind: 'mega_lucario_face' },
  { id: 'top.mega_lucario', name: '메가루카리오 상의', slot: 'top', price: 300, color: '#1e3a8a', accent: '#facc15', kind: 'mega_lucario_top' },
  { id: 'bottom.mega_lucario', name: '메가루카리오 하의', slot: 'bottom', price: 260, color: '#0f172a', accent: '#facc15', kind: 'mega_lucario_legs' },
  { id: 'back.mega_lucario', name: '메가루카리오 오라', slot: 'back', price: 340, color: '#0f172a', accent: '#facc15', kind: 'mega_lucario_aura' },
  { id: 'shoes.mega_lucario', name: '메가루카리오 발톱', slot: 'shoes', price: 200, color: '#0f172a', accent: '#7f1d1d', kind: 'mega_lucario_feet' },

  // 메가리자몽 X (Mega Charizard X) — Fire/Dragon: black body, blue belly,
  // blue flames from mouth, dark navy wings with blue membrane.
  { id: 'mask.mega_charizard_x', name: '메가리자몽X 얼굴', slot: 'mask', price: 340, color: '#0f172a', accent: '#3b82f6', kind: 'mega_charizard_x_face' },
  { id: 'top.mega_charizard_x', name: '메가리자몽X 상의', slot: 'top', price: 320, color: '#0f172a', accent: '#3b82f6', kind: 'mega_charizard_x_top' },
  { id: 'bottom.mega_charizard_x', name: '메가리자몽X 하의', slot: 'bottom', price: 280, color: '#0f172a', accent: '#3b82f6', kind: 'mega_charizard_x_legs' },
  { id: 'back.mega_charizard_x', name: '메가리자몽X 날개', slot: 'back', price: 360, color: '#0f172a', accent: '#1e40af', kind: 'mega_charizard_x_wings' },
  { id: 'shoes.mega_charizard_x', name: '메가리자몽X 발톱', slot: 'shoes', price: 200, color: '#0f172a', accent: '#f8fafc', kind: 'mega_charizard_x_feet' },

  // 메가리자몽 Y (Mega Charizard Y) — Fire/Flying: orange body, cream belly,
  // huge sharper wings with pointed tips, wrist wings, longer horns.
  // 깨비드릴조 (Fearow #022) — brown drill-bird with long thin beak,
  // cream wingtips, red crest.
  { id: 'mask.fearow', name: '깨비드릴조 얼굴', slot: 'mask', price: 220, color: '#92400e', accent: '#dc2626', kind: 'fearow_face' },
  { id: 'top.fearow', name: '깨비드릴조 상의', slot: 'top', price: 200, color: '#92400e', accent: '#fef3c7', kind: 'fearow_top' },
  { id: 'bottom.fearow', name: '깨비드릴조 하의', slot: 'bottom', price: 180, color: '#92400e', accent: '#facc15', kind: 'fearow_legs' },
  { id: 'back.fearow', name: '깨비드릴조 날개', slot: 'back', price: 240, color: '#92400e', accent: '#fef3c7', kind: 'fearow_wings' },
  { id: 'shoes.fearow', name: '깨비드릴조 발톱', slot: 'shoes', price: 160, color: '#facc15', accent: '#92400e', kind: 'fearow_feet' },
  { id: 'mask.mega_charizard_y', name: '메가리자몽Y 얼굴', slot: 'mask', price: 340, color: '#ea580c', accent: '#fef3c7', kind: 'mega_charizard_y_face' },
  { id: 'top.mega_charizard_y', name: '메가리자몽Y 상의', slot: 'top', price: 320, color: '#ea580c', accent: '#fef3c7', kind: 'mega_charizard_y_top' },
  { id: 'bottom.mega_charizard_y', name: '메가리자몽Y 하의', slot: 'bottom', price: 280, color: '#ea580c', accent: '#fef3c7', kind: 'mega_charizard_y_legs' },
  { id: 'back.mega_charizard_y', name: '메가리자몽Y 날개', slot: 'back', price: 360, color: '#c2410c', accent: '#fef3c7', kind: 'mega_charizard_y_wings' },
  { id: 'shoes.mega_charizard_y', name: '메가리자몽Y 발톱', slot: 'shoes', price: 200, color: '#ea580c', accent: '#fef3c7', kind: 'mega_charizard_y_feet' },

  // Misc Pokemon companions — stand next to the character just like the
  // existing Pikachu companion at misc.pikachu.
  { id: 'misc.charmander', name: '파이리 (컴패니언)', slot: 'misc', price: 380, color: '#f97316', accent: '#fef3c7', kind: 'charmander' },
  { id: 'misc.squirtle', name: '꼬부기 (컴패니언)', slot: 'misc', price: 380, color: '#38bdf8', accent: '#fef3c7', kind: 'squirtle' },
  { id: 'misc.bulbasaur', name: '이상해씨 (컴패니언)', slot: 'misc', price: 380, color: '#4ade80', accent: '#166534', kind: 'bulbasaur' },
  { id: 'misc.eevee', name: '이브이 (컴패니언)', slot: 'misc', price: 380, color: '#a16207', accent: '#fef3c7', kind: 'eevee' },
  { id: 'misc.jigglypuff', name: '푸린 (컴패니언)', slot: 'misc', price: 360, color: '#fbcfe8', accent: '#3b82f6', kind: 'jigglypuff' },
  { id: 'misc.psyduck', name: '고라파덕 (컴패니언)', slot: 'misc', price: 380, color: '#facc15', accent: '#f97316', kind: 'psyduck' },
  { id: 'misc.snorlax', name: '잠만보 (컴패니언)', slot: 'misc', price: 450, color: '#fde68a', accent: '#0f172a', kind: 'snorlax' },
  { id: 'misc.gengar', name: '겐가 (컴패니언)', slot: 'misc', price: 420, color: '#6b21a8', accent: '#dc2626', kind: 'gengar' },
  { id: 'misc.charizard', name: '리자몽 (컴패니언)', slot: 'misc', price: 500, color: '#f97316', accent: '#fef3c7', kind: 'charizard' },
  { id: 'misc.mew', name: '뮤 (컴패니언)', slot: 'misc', price: 500, color: '#fbcfe8', accent: '#7dd3fc', kind: 'mew' },
  { id: 'misc.lugia', name: '루기아 (컴패니언)', slot: 'misc', price: 600, color: '#f8fafc', accent: '#1e3a8a', kind: 'lugia' },
  { id: 'misc.growlithe', name: '가디 (컴패니언)', slot: 'misc', price: 480, color: '#ea580c', accent: '#fef3c7', kind: 'growlithe' },
  { id: 'misc.gardevoir', name: '가디안 (컴패니언)', slot: 'misc', price: 580, color: '#f8fafc', accent: '#16a34a', kind: 'gardevoir' },
  { id: 'misc.absol', name: '앱솔 (컴패니언)', slot: 'misc', price: 560, color: '#e2e8f0', accent: '#1e293b', kind: 'absol' },
  { id: 'misc.beedrill', name: '독침붕 (컴패니언)', slot: 'misc', price: 520, color: '#facc15', accent: '#0a0a0a', kind: 'beedrill' },
  { id: 'misc.mega_lucario', name: '메가루카리오 (컴패니언)', slot: 'misc', price: 650, color: '#1e3a8a', accent: '#facc15', kind: 'mega_lucario' },
  { id: 'misc.mega_charizard_x', name: '메가리자몽X (컴패니언)', slot: 'misc', price: 700, color: '#0f172a', accent: '#3b82f6', kind: 'mega_charizard_x' },
  { id: 'misc.mega_charizard_y', name: '메가리자몽Y (컴패니언)', slot: 'misc', price: 700, color: '#ea580c', accent: '#fef3c7', kind: 'mega_charizard_y' },
  { id: 'misc.fearow', name: '깨비드릴조 (컴패니언)', slot: 'misc', price: 500, color: '#92400e', accent: '#fef3c7', kind: 'fearow' },

  // Silver Surfer (no mask)
  { id: 'top.silver_surfer', name: 'Silver Surfer Body', slot: 'top', price: 240, color: '#e5e7eb', accent: '#94a3b8', kind: 'silver_surfer', genders: ['boy'] },
  { id: 'bottom.silver_surfer', name: 'Silver Surfer Legs', slot: 'bottom', price: 220, color: '#e5e7eb', accent: '#94a3b8', kind: 'silver_surfer', genders: ['boy'] },
  { id: 'back.silver_surfer', name: 'Cosmic Surfboard', slot: 'back', price: 260, color: '#e5e7eb', accent: '#94a3b8', kind: 'silver_surfer_board', genders: ['boy'] },
  { id: 'shoes.silver_surfer', name: 'Silver Feet', slot: 'shoes', price: 180, color: '#e5e7eb', accent: '#94a3b8', kind: 'silver_surfer', genders: ['boy'] },

  // ───────── Solmoe Soccer Center (boy only) ─────────
  { id: 'top.solmoe', name: '솔뫼축구센터 유니폼 상의', slot: 'top', price: 200, color: '#0f3d2e', accent: '#facc15', kind: 'solmoe', genders: ['boy'] },
  { id: 'bottom.solmoe', name: '솔뫼축구센터 유니폼 반바지', slot: 'bottom', price: 160, color: '#facc15', accent: '#0f3d2e', kind: 'solmoe', genders: ['boy'] },
  { id: 'shoes.solmoe', name: '솔뫼축구센터 축구화', slot: 'shoes', price: 140, color: '#f97316', accent: '#0f3d2e', kind: 'solmoe', genders: ['boy'] },
  { id: 'misc.soccer_ball', name: '축구공', slot: 'misc', price: 120, color: '#ffffff', accent: '#0f172a', kind: 'soccer_ball' },
];

export function itemsForGender(g: CharGender): Item[] {
  return ITEMS.filter((i) => !i.genders || i.genders.includes(g));
}

export function itemAllowedFor(id: string, g: CharGender): boolean {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return false;
  return !item.genders || item.genders.includes(g);
}

// ─────────────────────────────────────────────────────────
// Shop tabs — categories used to group items in the shop UI
// so the huge catalogue is browsable at a glance.
// ─────────────────────────────────────────────────────────
export type Category =
  | 'basic'
  | 'heroes'
  | 'princess'
  | 'pokemon'
  | 'school'
  | 'special'
  | 'misc';

export const CATEGORY_ORDER: Category[] = [
  'basic',
  'heroes',
  'princess',
  'pokemon',
  'school',
  'special',
  'misc',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  basic: '🧢 Basic',
  heroes: '🦸 Heroes',
  princess: '👸 Princess',
  pokemon: '⚡ Pokemon',
  school: '🎒 School',
  special: '🎂 Special',
  misc: '🏍️ Misc',
};

// Item kinds and IDs that map to each category. The switch is derived
// from either item.kind (per-slot union) or the item id, whichever is
// most distinctive for that group.
const HERO_KIND_PATTERNS = [
  'ironman', 'spiderman', 'hulk', 'batman', 'captain_america', 'thor',
  'superman', 'flash', 'panther', 'wolverine', 'dr_strange', 'starlord',
  'antman', 'war_machine', 'vision', 'daredevil', 'hawkeye', 'falcon',
  'venom', 'ghost_rider', 'silver_surfer',
  'batman_cape', 'cap_shield', 'thor_cape', 'superman_cape', 'flash_bolt',
  'panther_cape', 'wolverine_claws', 'dr_strange_cape', 'starlord_pack',
  'antman_pack', 'war_machine_back', 'vision_cape', 'daredevil_back',
  'hawkeye_quiver', 'falcon_wings', 'venom_back', 'ghost_rider_back',
  'silver_surfer_board',
];
const PRINCESS_KIND_PATTERNS = [
  'princess_dress', 'princess_skirt', 'princess_cape',
  'tiara', 'flower_crown', 'princess_crown',
  'elsa_top', 'elsa_skirt', 'elsa_cape', 'elsa_crown',
  'ariel_top', 'ariel_tail', 'ariel_wave', 'ariel_shell',
  'rapunzel_top', 'rapunzel_skirt', 'rapunzel_hair',
  'belle_bow',
  'tutu', 'glass_slipper', 'ballet', 'ribbon_heel',
  'wand', 'ribbon_bow', 'rose', 'snowflake', 'pumpkin_carriage', 'seashell',
];
const POKEMON_SPECIES = [
  'pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee',
  'jigglypuff', 'psyduck', 'snorlax', 'gengar', 'charizard', 'mew', 'lugia',
  'growlithe', 'gardevoir', 'absol',
  'beedrill', 'mega_lucario',
  'mega_charizard_x', 'mega_charizard_y',
  'fearow',
];
const SCHOOL_KIND_PATTERNS = [
  'slp', 'slp_girl', 'slp_skirt', 'slp_backpack', 'slp_badge',
];
const SPECIAL_KIND_PATTERNS = [
  'joon_cardigan', 'joon_band', 'solmoe',
];

export function categoryOf(item: Item): Category {
  const kind = item.kind ?? '';
  const id = item.id;
  if (POKEMON_SPECIES.some((s) => kind.includes(s) || id.endsWith('.' + s) || id.endsWith('.' + s + '_bike'))) {
    return 'pokemon';
  }
  if (HERO_KIND_PATTERNS.includes(kind)) return 'heroes';
  if (PRINCESS_KIND_PATTERNS.includes(kind)) return 'princess';
  if (SCHOOL_KIND_PATTERNS.includes(kind)) return 'school';
  if (SPECIAL_KIND_PATTERNS.includes(kind)) return 'special';
  if (item.slot === 'misc') return 'misc';
  return 'basic';
}

export const DEFAULT_ITEMS: Record<Slot, string> = {
  top: '',
  bottom: '',
  hat: '',
  mask: '',
  back: '',
  shoes: '',
  misc: '',
};

// Wardrobe starts empty — every item must be purchased.
export const DEFAULT_OWNED: string[] = [];

export function getItem(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function itemsBySlot(slot: Slot): Item[] {
  return ITEMS.filter((i) => i.slot === slot);
}
