import type { Item } from '../data/items';

type Props = { item: Item; size?: number };

export function TileIcon({ item, size = 80 }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="rounded-xl shadow-inner"
      style={{ background: 'linear-gradient(180deg,#f8fafc 0%,#e2e8f0 100%)' }}
    >
      {renderIcon(item)}
    </svg>
  );
}

function renderIcon(item: Item) {
  switch (item.slot) {
    case 'top':
      return <Top item={item} />;
    case 'bottom':
      return <Bottom item={item} />;
    case 'hat':
      return <Hat item={item} />;
    case 'back':
      return <Back item={item} />;
    case 'shoes':
      return <Shoes item={item} />;
    case 'charm':
      return <Charm item={item} />;
  }
}

const STROKE = '#1f2937';
const SW = 1.5;

function Top({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'tee';

  if (kind === 'robot') {
    return (
      <g>
        {/* Boxy chrome chassis */}
        <rect x="26" y="28" width="48" height="52" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Shoulder bolts */}
        <circle cx="32" cy="34" r="2.5" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        <circle cx="68" cy="34" r="2.5" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        {/* Chest LED panel */}
        <rect x="38" y="44" width="24" height="16" rx="2" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        <circle cx="44" cy="52" r="2" fill={a} />
        <circle cx="50" cy="52" r="2" fill="#fde047" />
        <circle cx="56" cy="52" r="2" fill="#ef4444" />
        {/* Lower vent stripes */}
        <rect x="34" y="68" width="32" height="2" fill={a} />
        <rect x="34" y="73" width="32" height="2" fill={a} />
      </g>
    );
  }

  // Base T-shirt silhouette
  const body = (
    <path
      d="M28,30 L40,22 L48,28 L52,28 L60,22 L72,30 L78,40 L70,46 L66,42 L66,78 L34,78 L34,42 L30,46 L22,40 Z"
      fill={c}
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  );

  return (
    <g>
      {body}
      {kind === 'hoodie' && (
        <>
          <path
            d="M36,26 Q50,16 64,26 L60,22 L52,28 L48,28 L40,22 Z"
            fill={a}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <circle cx="50" cy="58" r="3" fill={a} />
        </>
      )}
      {kind === 'striped' && (
        <>
          <rect x="34" y="48" width="32" height="4" fill={a} />
          <rect x="34" y="58" width="32" height="4" fill={a} />
          <rect x="34" y="68" width="32" height="4" fill={a} />
        </>
      )}
      {kind === 'star' && (
        <polygon
          points="50,46 53,55 62,55 55,61 58,70 50,64 42,70 45,61 38,55 47,55"
          fill={a}
          stroke={STROKE}
          strokeWidth={1}
        />
      )}
      {kind === 'dino' && (
        <path
          d="M34,42 L36,36 L40,42 L44,34 L48,42 L52,34 L56,42 L60,34 L64,42 L66,36 L66,42 Z"
          fill={a}
          stroke={STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}
      {kind === 'raincoat' && (
        <>
          <line x1="50" y1="42" x2="50" y2="78" stroke={a} strokeWidth={2} />
          <circle cx="50" cy="54" r="1.6" fill={a} />
          <circle cx="50" cy="64" r="1.6" fill={a} />
        </>
      )}
      {kind === 'spacesuit' && (
        <>
          <circle cx="50" cy="58" r="6" fill={a} stroke={STROKE} strokeWidth={1} />
          <rect x="40" y="74" width="20" height="3" fill={a} />
        </>
      )}
      {kind === 'sweater' && (
        <>
          <path d="M34,52 Q50,56 66,52" stroke={a} fill="none" strokeWidth={2} />
          <path d="M34,62 Q50,66 66,62" stroke={a} fill="none" strokeWidth={2} />
          <path d="M34,72 Q50,76 66,72" stroke={a} fill="none" strokeWidth={2} />
        </>
      )}
    </g>
  );
}

function Bottom({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'pants';

  if (kind === 'robot') {
    return (
      <g>
        {/* Chrome cylindrical legs with knee joint rings */}
        <rect x="32" y="22" width="36" height="60" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="46" y="22" width="8" height="60" fill={darken(c)} />
        {/* Knee joints */}
        <circle cx="40" cy="50" r="6" fill={darken(c)} stroke={STROKE} strokeWidth={SW} />
        <circle cx="60" cy="50" r="6" fill={darken(c)} stroke={STROKE} strokeWidth={SW} />
        <circle cx="40" cy="50" r="2" fill={a} />
        <circle cx="60" cy="50" r="2" fill={a} />
        {/* Belt strip */}
        <rect x="32" y="26" width="36" height="4" fill={a} />
      </g>
    );
  }

  if (kind === 'skirt') {
    return (
      <g>
        <path
          d="M32,28 L68,28 L80,82 L20,82 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <line x1="32" y1="34" x2="68" y2="34" stroke={a} strokeWidth={2} />
      </g>
    );
  }

  const isShort = kind === 'shorts';
  const bottomY = isShort ? 58 : 82;

  return (
    <g>
      <path
        d={`M32,24 L68,24 L70,${bottomY} L54,${bottomY} L50,40 L46,${bottomY} L30,${bottomY} Z`}
        fill={c}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <line x1="32" y1="30" x2="68" y2="30" stroke={a} strokeWidth={2} />
      {kind === 'jeans' && (
        <>
          <circle cx="62" cy="32" r="1.5" fill={a} />
          <line x1="50" y1="40" x2="50" y2={bottomY - 2} stroke={a} strokeWidth={1} />
        </>
      )}
      {kind === 'track' && (
        <>
          <line x1="38" y1="30" x2="44" y2={bottomY - 2} stroke={a} strokeWidth={2} />
          <line x1="62" y1="30" x2="56" y2={bottomY - 2} stroke={a} strokeWidth={2} />
        </>
      )}
      {kind === 'plaid' && (
        <>
          <line x1="32" y1="44" x2="68" y2="44" stroke={a} strokeWidth={1} />
          <line x1="32" y1="60" x2="68" y2="60" stroke={a} strokeWidth={1} />
          <line x1="42" y1="24" x2="46" y2={bottomY} stroke={a} strokeWidth={1} />
          <line x1="58" y1="24" x2="54" y2={bottomY} stroke={a} strokeWidth={1} />
        </>
      )}
      {kind === 'spacepants' && (
        <>
          <circle cx="38" cy="50" r="3" fill={a} stroke={STROKE} strokeWidth={0.8} />
          <circle cx="62" cy="50" r="3" fill={a} stroke={STROKE} strokeWidth={0.8} />
        </>
      )}
    </g>
  );
}

function Hat({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'cap';

  if (kind === 'robot') {
    return (
      <g>
        {/* Boxy helmet */}
        <rect x="22" y="34" width="56" height="40" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Visor strip */}
        <rect x="28" y="46" width="44" height="10" rx="2" fill="#0f172a" stroke={STROKE} strokeWidth={1} />
        <rect x="32" y="48" width="36" height="2" fill="#22d3ee" />
        {/* Side bolts */}
        <circle cx="26" cy="64" r="2" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        <circle cx="74" cy="64" r="2" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        {/* Antenna */}
        <line x1="50" y1="34" x2="50" y2="14" stroke={STROKE} strokeWidth={2} />
        <circle cx="50" cy="12" r="4" fill={a} stroke={STROKE} strokeWidth={SW} />
      </g>
    );
  }

  switch (kind) {
    case 'crown':
      return (
        <g>
          <path
            d="M20,70 L24,40 L36,58 L50,32 L64,58 L76,40 L80,70 Z"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <rect x="20" y="68" width="60" height="8" fill={a} stroke={STROKE} strokeWidth={SW} />
          <circle cx="24" cy="40" r="3" fill="#ef4444" />
          <circle cx="50" cy="32" r="3" fill="#3b82f6" />
          <circle cx="76" cy="40" r="3" fill="#10b981" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path
            d="M22,68 Q22,30 50,28 Q78,30 78,68 Z"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <rect x="20" y="64" width="60" height="10" rx="3" fill={a} stroke={STROKE} strokeWidth={SW} />
          <circle cx="50" cy="22" r="6" fill={a} stroke={STROKE} strokeWidth={SW} />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <rect x="32" y="20" width="36" height="48" fill={c} stroke={STROKE} strokeWidth={SW} />
          <ellipse cx="50" cy="68" rx="34" ry="6" fill={c} stroke={STROKE} strokeWidth={SW} />
          <rect x="32" y="50" width="36" height="6" fill={a} />
        </g>
      );
    case 'wizard':
    case 'witch':
      return (
        <g>
          <path
            d="M50,12 L70,70 L30,70 Z"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <ellipse cx="50" cy="74" rx="34" ry="6" fill={a} stroke={STROKE} strokeWidth={SW} />
          {kind === 'wizard' && (
            <>
              <text x="42" y="50" fontSize="10" fill="#fde047">⭐</text>
              <text x="52" y="62" fontSize="8" fill="#fde047">⭐</text>
            </>
          )}
        </g>
      );
    case 'cowboy':
      return (
        <g>
          <ellipse cx="50" cy="60" rx="40" ry="8" fill={c} stroke={STROKE} strokeWidth={SW} />
          <path
            d="M30,60 Q30,28 50,28 Q70,28 70,60 Z"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <rect x="30" y="54" width="40" height="4" fill={a} />
        </g>
      );
    case 'sunhat':
      return (
        <g>
          <ellipse cx="50" cy="62" rx="42" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
          <ellipse cx="50" cy="44" rx="22" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
          <path d="M28,62 Q50,52 72,62" stroke={a} fill="none" strokeWidth={2} />
        </g>
      );
    case 'pumpkin':
      return (
        <g>
          <ellipse cx="50" cy="56" rx="34" ry="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          <path d="M36,30 Q40,42 36,56 M50,28 L50,56 M64,30 Q60,42 64,56" stroke={a} fill="none" strokeWidth={1.5} />
          <rect x="46" y="16" width="8" height="14" fill="#16a34a" stroke={STROKE} strokeWidth={SW} />
        </g>
      );
    case 'cap':
    default:
      return (
        <g>
          <path
            d="M22,60 Q22,28 50,26 Q78,28 78,60 Z"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <path
            d="M22,60 Q50,74 90,62 L90,68 Q50,80 22,68 Z"
            fill={a}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
        </g>
      );
  }
}

function Back({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'pack';

  if (kind === 'robot') {
    return (
      <g>
        {/* Twin rectangular thrusters with warning stripes */}
        <rect x="22" y="20" width="22" height="56" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="56" y="20" width="22" height="56" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Yellow + black warning bands */}
        <rect x="22" y="30" width="22" height="3" fill="#fde047" />
        <rect x="22" y="36" width="22" height="3" fill="#0f172a" />
        <rect x="56" y="30" width="22" height="3" fill="#fde047" />
        <rect x="56" y="36" width="22" height="3" fill="#0f172a" />
        {/* Bolts */}
        <circle cx="33" cy="68" r="2" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        <circle cx="67" cy="68" r="2" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        {/* Flames */}
        <path d="M24,76 L33,90 L42,76 Z" fill={a} stroke="#dc2626" strokeWidth={1} />
        <path d="M58,76 L67,90 L76,76 Z" fill={a} stroke="#dc2626" strokeWidth={1} />
      </g>
    );
  }

  if (kind.startsWith('wing')) {
    return (
      <g>
        <path
          d="M50,50 Q24,30 16,58 Q26,50 38,56 Q22,64 30,80 Q40,70 50,60 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path
          d="M50,50 Q76,30 84,58 Q74,50 62,56 Q78,64 70,80 Q60,70 50,60 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {kind === 'wing_star' && (
          <polygon points="50,46 54,56 64,56 56,62 60,72 50,66 40,72 44,62 36,56 46,56" fill={a} />
        )}
        {kind === 'wing_bat' && (
          <path d="M30,50 L34,58 L26,58 Z M70,50 L74,58 L66,58 Z" fill={a} />
        )}
      </g>
    );
  }
  if (kind === 'jetpack') {
    return (
      <g>
        <rect x="28" y="20" width="20" height="50" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="52" y="20" width="20" height="50" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path d="M30,70 L38,86 L46,70 Z" fill={a} />
        <path d="M54,70 L62,86 L70,70 Z" fill={a} />
      </g>
    );
  }
  if (kind === 'shell') {
    return (
      <g>
        <path d="M14,72 Q50,16 86,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M14,72 Q50,52 86,72" stroke={a} fill="none" strokeWidth={SW} />
        <path d="M28,68 Q50,32 72,68" stroke={a} fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'cape') {
    return (
      <g>
        <path
          d="M28,18 L72,18 L82,82 L18,82 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <rect x="28" y="18" width="44" height="6" fill={a} />
      </g>
    );
  }
  // backpack-ish (kinder, pack)
  return (
    <g>
      <rect x="22" y="20" width="56" height="60" rx="8" fill={c} stroke={STROKE} strokeWidth={SW} />
      <rect x="32" y="40" width="36" height="20" rx="4" fill={a} stroke={STROKE} strokeWidth={SW} />
      <circle cx="42" cy="50" r="2" fill={c} />
      <circle cx="58" cy="50" r="2" fill={c} />
      <rect x="44" y="24" width="12" height="6" fill={a} />
    </g>
  );
}

function Shoes({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'sneakers';

  if (kind === 'robot') {
    return (
      <g>
        {/* Chunky armored boot */}
        <rect x="24" y="28" width="40" height="40" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="24" y="60" width="60" height="14" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Tread sole */}
        <rect x="24" y="72" width="60" height="6" fill={a} stroke={STROKE} strokeWidth={SW} />
        <line x1="32" y1="72" x2="32" y2="78" stroke={STROKE} strokeWidth={1} />
        <line x1="44" y1="72" x2="44" y2="78" stroke={STROKE} strokeWidth={1} />
        <line x1="56" y1="72" x2="56" y2="78" stroke={STROKE} strokeWidth={1} />
        <line x1="68" y1="72" x2="68" y2="78" stroke={STROKE} strokeWidth={1} />
        <line x1="76" y1="72" x2="76" y2="78" stroke={STROKE} strokeWidth={1} />
        {/* Ankle bolts */}
        <circle cx="32" cy="42" r="2.5" fill={a} stroke={STROKE} strokeWidth={1} />
        <circle cx="56" cy="42" r="2.5" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Toe panel */}
        <rect x="68" y="62" width="14" height="8" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'rainboots' || kind === 'snowboots' || kind === 'boots') {
    return (
      <g>
        <path
          d="M30,24 L52,24 L52,58 L72,58 L72,76 L30,76 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <rect x="30" y="70" width="44" height="8" fill={a} stroke={STROKE} strokeWidth={SW} />
      </g>
    );
  }
  if (kind === 'sandals') {
    return (
      <g>
        <path d="M18,66 L82,66 L78,76 L22,76 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path d="M34,40 L48,66 M52,40 L66,66" stroke={a} strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'skates') {
    return (
      <g>
        <path d="M22,40 L72,40 L78,62 L18,62 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="28" cy="74" r="6" fill={a} stroke={STROKE} strokeWidth={SW} />
        <circle cx="50" cy="74" r="6" fill={a} stroke={STROKE} strokeWidth={SW} />
        <circle cx="72" cy="74" r="6" fill={a} stroke={STROKE} strokeWidth={SW} />
      </g>
    );
  }
  // sneakers / flat / sport / lightup
  return (
    <g>
      <path
        d="M14,52 Q14,38 36,38 L60,38 Q82,42 86,60 L86,70 L14,70 Z"
        fill={c}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <rect x="14" y="64" width="72" height="8" fill={a} stroke={STROKE} strokeWidth={SW} />
      {kind === 'lightup' && (
        <>
          <circle cx="26" cy="68" r="2" fill="#fde047" />
          <circle cx="50" cy="68" r="2" fill="#f472b6" />
          <circle cx="74" cy="68" r="2" fill="#60a5fa" />
        </>
      )}
      {kind === 'sport' && (
        <line x1="36" y1="44" x2="62" y2="44" stroke={a} strokeWidth={2} />
      )}
    </g>
  );
}

function Charm({ item }: { item: Item }) {
  const c = item.color;
  const kind = item.kind ?? 'star';

  if (kind === 'robot') {
    return (
      <g>
        {/* Tiny robot head pendant */}
        <line x1="50" y1="14" x2="50" y2="22" stroke={STROKE} strokeWidth={2} />
        <circle cx="50" cy="12" r="3" fill="#ef4444" stroke={STROKE} strokeWidth={1} />
        <rect x="28" y="24" width="44" height="44" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Visor */}
        <rect x="34" y="36" width="32" height="10" rx="2" fill="#0f172a" stroke={STROKE} strokeWidth={1} />
        <circle cx="42" cy="41" r="2" fill="#22d3ee" />
        <circle cx="58" cy="41" r="2" fill="#22d3ee" />
        {/* Mouth grid */}
        <rect x="40" y="52" width="20" height="8" fill={darken(c)} stroke={STROKE} strokeWidth={1} />
        <line x1="44" y1="52" x2="44" y2="60" stroke={STROKE} strokeWidth={0.6} />
        <line x1="50" y1="52" x2="50" y2="60" stroke={STROKE} strokeWidth={0.6} />
        <line x1="56" y1="52" x2="56" y2="60" stroke={STROKE} strokeWidth={0.6} />
        {/* Bottom keyring loop */}
        <circle cx="50" cy="78" r="6" fill="none" stroke={STROKE} strokeWidth={SW} />
        <line x1="50" y1="68" x2="50" y2="72" stroke={STROKE} strokeWidth={2} />
      </g>
    );
  }

  switch (kind) {
    case 'heart':
      return (
        <path
          d="M50,82 Q14,58 22,36 Q34,18 50,34 Q66,18 78,36 Q86,58 50,82 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      );
    case 'diamond':
      return (
        <g>
          <polygon
            points="50,12 78,40 50,84 22,40"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          <polyline points="30,40 50,28 70,40" stroke="#ffffff" strokeWidth={SW} fill="none" />
        </g>
      );
    case 'cube':
      return (
        <g>
          <polygon points="20,32 50,18 80,32 50,46" fill={lighten(c)} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="20,32 20,72 50,86 50,46" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="80,32 80,72 50,86 50,46" fill={darken(c)} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        </g>
      );
    case 'coin':
      return (
        <g>
          <circle cx="50" cy="50" r="32" fill={c} stroke={STROKE} strokeWidth={SW} />
          <text x="50" y="62" textAnchor="middle" fontSize="32" fontWeight="900" fill={darken(c)}>
            $
          </text>
        </g>
      );
    case 'bell':
      return (
        <g>
          <path d="M26,64 Q26,30 50,28 Q74,30 74,64 L80,72 L20,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx="50" cy="80" r="4" fill={darken(c)} stroke={STROKE} strokeWidth={SW} />
        </g>
      );
    case 'moon':
      return (
        <path d="M70,18 Q40,32 40,50 Q40,68 70,82 Q42,78 32,50 Q42,22 70,18 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      );
    case 'sun':
      return (
        <g>
          <circle cx="50" cy="50" r="20" fill={c} stroke={STROKE} strokeWidth={SW} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 50 + Math.cos(a) * 26;
            const y1 = 50 + Math.sin(a) * 26;
            const x2 = 50 + Math.cos(a) * 38;
            const y2 = 50 + Math.sin(a) * 38;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={4} strokeLinecap="round" />;
          })}
        </g>
      );
    case 'cherry':
      return (
        <g>
          <circle cx="38" cy="68" r="14" fill={c} stroke={STROKE} strokeWidth={SW} />
          <circle cx="62" cy="68" r="14" fill={c} stroke={STROKE} strokeWidth={SW} />
          <path d="M38,54 Q44,28 60,22 Q58,32 62,54" stroke="#16a34a" fill="none" strokeWidth={3} />
        </g>
      );
    case 'lightning':
      return (
        <polygon
          points="56,12 30,52 46,52 38,86 70,42 54,42 60,12"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      );
    case 'star':
    default:
      return (
        <polygon
          points="50,12 60,38 88,40 66,58 74,86 50,70 26,86 34,58 12,40 40,38"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      );
  }
}

function darken(hex: string): string {
  const n = parseHex(hex);
  if (!n) return '#1f2937';
  const f = 0.65;
  return toHex([n[0] * f, n[1] * f, n[2] * f]);
}

function lighten(hex: string): string {
  const n = parseHex(hex);
  if (!n) return '#ffffff';
  const f = 0.3;
  return toHex([
    n[0] + (255 - n[0]) * f,
    n[1] + (255 - n[1]) * f,
    n[2] + (255 - n[2]) * f,
  ]);
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function toHex(rgb: number[]): string {
  return (
    '#' +
    rgb
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
      .join('')
  );
}
