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
    case 'mask':
      return <Mask item={item} />;
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

  if (kind === 'ironman') {
    const gold = a;
    return (
      <g>
        {/* Crimson armor body */}
        <path
          d="M26,30 L40,24 L48,30 L52,30 L60,24 L74,30 L78,42 L72,46 L72,80 L28,80 L28,46 L22,42 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Long red upper arms */}
        <rect x="14" y="32" width="10" height="22" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="76" y="32" width="10" height="22" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Gold forearms */}
        <rect x="14" y="54" width="10" height="18" rx="2" fill={gold} stroke={STROKE} strokeWidth={SW} />
        <rect x="76" y="54" width="10" height="18" rx="2" fill={gold} stroke={STROKE} strokeWidth={SW} />
        {/* Red armored gloves */}
        <rect x="13" y="72" width="12" height="9" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="75" y="72" width="12" height="9" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Palm repulsor glow */}
        <circle cx="19" cy="77" r="2" fill="#a5f3fc" />
        <circle cx="81" cy="77" r="2" fill="#a5f3fc" />
        {/* Gold shoulder caps */}
        <ellipse cx="30" cy="32" rx="9" ry="7" fill={gold} stroke={STROKE} strokeWidth={1} />
        <ellipse cx="70" cy="32" rx="9" ry="7" fill={gold} stroke={STROKE} strokeWidth={1} />
        {/* Gold V chest yoke */}
        <path d="M32,40 L50,52 L68,40 L66,46 L50,58 L34,46 Z" fill={gold} stroke={STROKE} strokeWidth={1} />
        {/* Arc reactor */}
        <circle cx="50" cy="56" r="6" fill={gold} stroke={STROKE} strokeWidth={1} />
        <circle cx="50" cy="56" r="4" fill="#a5f3fc" />
        <circle cx="50" cy="56" r="2" fill="#ffffff" />
        {/* Gold abdominal plate */}
        <rect x="40" y="64" width="20" height="10" fill={gold} stroke={STROKE} strokeWidth={1} />
        <line x1="40" y1="68" x2="60" y2="68" stroke="#92400e" strokeWidth={0.6} />
        <line x1="40" y1="71" x2="60" y2="71" stroke="#92400e" strokeWidth={0.6} />
        {/* Gold belt */}
        <rect x="28" y="76" width="44" height="4" fill={gold} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

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
        {/* Waist vents */}
        <line x1="32" y1="68" x2="68" y2="68" stroke="#1e293b" strokeWidth={1} />
        <line x1="32" y1="72" x2="68" y2="72" stroke="#1e293b" strokeWidth={1} />
        <line x1="32" y1="76" x2="68" y2="76" stroke="#1e293b" strokeWidth={1} />
      </g>
    );
  }

  // Hero / princess / SLP tops — each renders the iconic chest emblem of
  // the matching 3D design over a tee-shaped body.
  const teeBody = (fill: string) => (
    <path
      d="M28,30 L40,22 L48,28 L52,28 L60,22 L72,30 L78,40 L70,46 L66,42 L66,78 L34,78 L34,42 L30,46 L22,40 Z"
      fill={fill}
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  );

  if (kind === 'spiderman') {
    return (
      <g>
        {teeBody(c)}
        {/* Web grid */}
        {[38, 50, 62].map((x) => (
          <line key={`v${x}`} x1={x} y1="32" x2={x} y2="72" stroke="#10101e" strokeWidth={0.7} />
        ))}
        {[44, 56, 68].map((y) => (
          <line key={`h${y}`} x1="32" y1={y} x2="68" y2={y} stroke="#10101e" strokeWidth={0.7} />
        ))}
        {/* Spider emblem */}
        <ellipse cx="50" cy="50" rx="3" ry="5" fill="#10101e" />
        {[-1, 1].map((s) =>
          [0, 1, 2, 3].map((i) => (
            <line
              key={`leg${s}-${i}`}
              x1="50"
              y1="50"
              x2={50 + s * (8 + i)}
              y2={45 + i * 2}
              stroke="#10101e"
              strokeWidth={0.7}
            />
          ))
        )}
        {/* Blue waist band */}
        <rect x="32" y="72" width="36" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'hulk') {
    return (
      <g>
        {teeBody(c)}
        {/* Pec line */}
        <line x1="50" y1="34" x2="50" y2="62" stroke={a} strokeWidth={1.5} />
        {/* Pec curves */}
        <path d="M36,42 Q44,38 50,46" stroke={a} fill="none" strokeWidth={1.5} />
        <path d="M64,42 Q56,38 50,46" stroke={a} fill="none" strokeWidth={1.5} />
        {/* Ab cross lines */}
        <line x1="40" y1="54" x2="60" y2="54" stroke={a} strokeWidth={1.2} />
        <line x1="40" y1="64" x2="60" y2="64" stroke={a} strokeWidth={1.2} />
        {/* Big fists at sleeve ends */}
        <circle cx="20" cy="48" r="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="80" cy="48" r="6" fill={c} stroke={STROKE} strokeWidth={SW} />
      </g>
    );
  }

  if (kind === 'batman') {
    return (
      <g>
        {teeBody(c)}
        {/* Yellow oval bat emblem */}
        <ellipse cx="50" cy="54" rx="20" ry="12" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Bat silhouette */}
        <path
          d="M50,48 L52,52 L58,50 L60,54 L56,56 L52,58 L50,56 L48,58 L44,56 L40,54 L42,50 L48,52 Z"
          fill="#0a0a0a"
        />
      </g>
    );
  }

  if (kind === 'captain_america') {
    return (
      <g>
        {teeBody(c)}
        {/* White chest star */}
        <polygon
          points="50,34 53,42 62,42 55,48 57,57 50,52 43,57 45,48 38,42 47,42"
          fill="#f8fafc"
          stroke={STROKE}
          strokeWidth={0.8}
        />
        {/* Red/white belly stripes */}
        {[60, 65, 70].map((y, i) => (
          <rect key={y} x="34" y={y} width="32" height="3" fill={i % 2 === 0 ? a : '#f8fafc'} />
        ))}
        {/* Brown belt */}
        <rect x="32" y="74" width="36" height="4" fill="#7c2d12" />
      </g>
    );
  }

  if (kind === 'thor') {
    return (
      <g>
        {teeBody(c)}
        {/* 6 silver discs (2 columns x 3 rows) */}
        {[40, 60].map((x) =>
          [42, 54, 66].map((y) => (
            <circle key={`d${x}-${y}`} cx={x} cy={y} r="4" fill={a} stroke={STROKE} strokeWidth={0.8} />
          ))
        )}
        {/* Diagonal leather strap */}
        <line x1="28" y1="42" x2="72" y2="62" stroke="#3f3f1a" strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  }

  if (kind === 'superman') {
    return (
      <g>
        {teeBody(c)}
        {/* Yellow diamond shield */}
        <polygon
          points="50,32 66,52 50,72 34,52"
          fill="#fde047"
          stroke={STROKE}
          strokeWidth={SW}
        />
        {/* Red S */}
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fill={a}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          S
        </text>
      </g>
    );
  }

  if (kind === 'flash') {
    return (
      <g>
        {teeBody(c)}
        {/* White chest disc */}
        <circle cx="50" cy="54" r="16" fill="#f8fafc" stroke={STROKE} strokeWidth={1} />
        {/* Gold lightning bolt */}
        <polygon
          points="54,40 42,56 50,56 46,68 60,52 52,52 56,40"
          fill={a}
          stroke={STROKE}
          strokeWidth={0.8}
        />
      </g>
    );
  }

  if (kind === 'panther') {
    return (
      <g>
        {teeBody(c)}
        {/* Diagonal vibranium lines */}
        <line x1="36" y1="40" x2="40" y2="72" stroke={a} strokeWidth={1.5} />
        <line x1="46" y1="40" x2="44" y2="72" stroke={a} strokeWidth={1.5} />
        <line x1="56" y1="40" x2="58" y2="72" stroke={a} strokeWidth={1.5} />
        <line x1="64" y1="40" x2="62" y2="72" stroke={a} strokeWidth={1.5} />
        {/* Fang necklace */}
        <path d="M34,34 Q50,42 66,34" stroke={a} fill="none" strokeWidth={1.5} />
        {[40, 46, 52, 58].map((x, i) => (
          <polygon key={x} points={`${x - 2},${36 + i % 2} ${x + 2},${36 + i % 2} ${x},${44 + i % 2}`} fill={a} />
        ))}
      </g>
    );
  }

  if (kind === 'slp') {
    return (
      <g>
        {teeBody(c)}
        {/* White shirt strip */}
        <rect x="44" y="30" width="12" height="46" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        {/* Collar wings */}
        <polygon points="46,30 44,38 50,34" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="54,30 56,38 50,34" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        {/* Tie knot */}
        <rect x="46" y="34" width="8" height="6" fill={a} />
        {/* Tie body */}
        <polygon points="46,40 54,40 53,66 50,72 47,66" fill={a} stroke={STROKE} strokeWidth={0.5} />
        {/* Tie stripes */}
        {[45, 51, 57].map((y) => (
          <line key={y} x1="46" y1={y} x2="54" y2={y - 2} stroke="#1e3a8a" strokeWidth={1} />
        ))}
        {/* Gold buttons */}
        <circle cx="62" cy="58" r="1.6" fill="#fbbf24" />
        <circle cx="62" cy="66" r="1.6" fill="#fbbf24" />
      </g>
    );
  }

  if (kind === 'slp_girl') {
    return (
      <g>
        {teeBody(c)}
        {/* White shirt strip */}
        <rect x="44" y="30" width="12" height="46" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        {/* Collar wings */}
        <polygon points="46,30 44,38 50,34" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="54,30 56,38 50,34" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        {/* Red bow ribbon: center + side loops */}
        <rect x="46" y="36" width="8" height="6" fill={a} />
        <rect x="38" y="35" width="10" height="8" rx="2" fill={a} />
        <rect x="52" y="35" width="10" height="8" rx="2" fill={a} />
        {/* Ribbon tails */}
        <polygon points="46,42 50,42 48,52" fill={a} />
        <polygon points="50,42 54,42 52,52" fill={a} />
        {/* Gold buttons */}
        <circle cx="62" cy="58" r="1.6" fill="#fbbf24" />
        <circle cx="62" cy="66" r="1.6" fill="#fbbf24" />
      </g>
    );
  }

  if (kind === 'princess_dress') {
    return (
      <g>
        {/* Fitted bodice with puffy cap sleeves */}
        <circle cx="24" cy="32" r="9" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="76" cy="32" r="9" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path
          d="M30,34 L40,28 L50,30 L60,28 L70,34 L66,78 L34,78 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Neckline + waist gold trim */}
        <path d="M36,30 L50,40 L64,30" stroke={a} fill="none" strokeWidth={2} />
        <rect x="32" y="68" width="36" height="4" fill={a} />
        {/* V decoration */}
        <polygon points="48,44 52,44 50,58" fill={a} />
      </g>
    );
  }

  if (kind === 'elsa_top') {
    return (
      <g>
        {/* Icy bodice */}
        <circle cx="24" cy="32" r="9" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="76" cy="32" r="9" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path
          d="M30,34 L40,28 L50,30 L60,28 L70,34 L66,78 L34,78 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Snowflake center */}
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={50 + Math.cos((i * Math.PI) / 3) * -10}
            y1={50 + Math.sin((i * Math.PI) / 3) * -10}
            x2={50 + Math.cos((i * Math.PI) / 3) * 10}
            y2={50 + Math.sin((i * Math.PI) / 3) * 10}
            stroke={a}
            strokeWidth={1.4}
          />
        ))}
        <polygon points="50,46 54,50 50,54 46,50" fill={a} />
        {/* Neckline trim */}
        <path d="M36,30 L50,40 L64,30" stroke="#ffffff" fill="none" strokeWidth={2} />
      </g>
    );
  }

  if (kind === 'ariel_top') {
    return (
      <g>
        {/* Bare skin midriff */}
        <rect x="34" y="30" width="32" height="48" fill="#ffe1c6" stroke={STROKE} strokeWidth={SW} rx="2" />
        {/* Purple seashell bra */}
        <path d="M30,38 Q40,52 50,40" fill={c} stroke={STROKE} strokeWidth={1} />
        <path d="M70,38 Q60,52 50,40" fill={c} stroke={STROKE} strokeWidth={1} />
        {/* Ridge lines on shells */}
        {[-1, 1].map((s) =>
          [-2, -1, 0, 1, 2].map((i) => (
            <line
              key={`r${s}-${i}`}
              x1={50 + s * 10}
              y1={42 + i}
              x2={50 + s * (10 + Math.abs(i) * 1.5)}
              y2={38 + i * 2}
              stroke={a}
              strokeWidth={0.6}
            />
          ))
        )}
      </g>
    );
  }

  if (kind === 'rapunzel_top') {
    return (
      <g>
        {teeBody(c)}
        {/* White blouse panel */}
        <rect x="40" y="32" width="20" height="22" fill="#ffffff" stroke={STROKE} strokeWidth={0.6} />
        {/* Puffy white shoulders */}
        <ellipse cx="26" cy="36" rx="8" ry="5" fill="#ffffff" stroke={STROKE} strokeWidth={0.8} />
        <ellipse cx="74" cy="36" rx="8" ry="5" fill="#ffffff" stroke={STROKE} strokeWidth={0.8} />
        {/* Criss-cross pink lacing */}
        {[34, 42, 50].map((y) => (
          <g key={y}>
            <line x1="42" y1={y} x2="58" y2={y + 6} stroke={a} strokeWidth={1.3} />
            <line x1="58" y1={y} x2="42" y2={y + 6} stroke={a} strokeWidth={1.3} />
          </g>
        ))}
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

  if (kind === 'ironman') {
    const gold = a;
    return (
      <g>
        {/* Crimson armored legs */}
        <rect x="32" y="22" width="36" height="60" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Center gap */}
        <rect x="48" y="22" width="4" height="60" fill={STROKE} />
        {/* Gold thigh band */}
        <rect x="30" y="26" width="40" height="6" fill={gold} stroke={STROKE} strokeWidth={1} />
        {/* Gold knee plates */}
        <rect x="32" y="46" width="14" height="10" rx="2" fill={gold} stroke={STROKE} strokeWidth={1} />
        <rect x="54" y="46" width="14" height="10" rx="2" fill={gold} stroke={STROKE} strokeWidth={1} />
        {/* Gold ankle band */}
        <rect x="30" y="74" width="40" height="6" fill={gold} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

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

  // Shared trouser-legs path for hero bottoms
  const heroLegs = (fill: string) => (
    <path
      d="M32,24 L68,24 L70,82 L54,82 L50,40 L46,82 L30,82 Z"
      fill={fill}
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  );

  if (kind === 'spiderman') {
    return (
      <g>
        {heroLegs(c)}
        {/* Web vertical lines per leg */}
        <line x1="40" y1="30" x2="42" y2="76" stroke="#10101e" strokeWidth={0.7} />
        <line x1="60" y1="30" x2="58" y2="76" stroke="#10101e" strokeWidth={0.7} />
        {/* Web horizontal rings */}
        {[42, 56, 70].map((y) => (
          <line key={y} x1="32" y1={y} x2="68" y2={y} stroke="#10101e" strokeWidth={0.7} />
        ))}
        {/* Red hip belt */}
        <rect x="28" y="24" width="44" height="8" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'hulk') {
    return (
      <g>
        {/* Green lower legs */}
        <path d="M32,52 L46,52 L46,82 L30,82 Z M54,52 L68,52 L70,82 L54,82 Z" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Torn gray upper pants */}
        <path d="M30,24 L70,24 L70,56 L30,56 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Ragged hem (zigzag) */}
        <polygon points="30,52 36,60 42,52 48,60 54,52 60,60 66,52 70,60 70,52" fill={c} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'batman') {
    return (
      <g>
        {heroLegs(c)}
        {/* Yellow utility belt */}
        <rect x="28" y="22" width="44" height="8" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Pouches */}
        {[34, 42, 50, 58, 66].map((x) => (
          <rect key={x} x={x - 3} y="26" width="6" height="6" fill={a} stroke={STROKE} strokeWidth={0.6} />
        ))}
      </g>
    );
  }

  if (kind === 'captain_america') {
    return (
      <g>
        {heroLegs(c)}
        {/* Brown belt */}
        <rect x="28" y="24" width="44" height="6" fill="#7c2d12" stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'thor') {
    return (
      <g>
        {heroLegs(c)}
        {/* Silver knee plates */}
        <rect x="30" y="50" width="18" height="10" rx="2" fill={a} stroke={STROKE} strokeWidth={1} />
        <rect x="52" y="50" width="18" height="10" rx="2" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'superman') {
    return (
      <g>
        {heroLegs(c)}
        {/* Red trunks (briefs over the blue legs) */}
        <path d="M28,22 L72,22 L72,46 L52,46 L50,38 L48,46 L28,46 Z" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Yellow belt */}
        <rect x="28" y="20" width="44" height="5" fill="#fde047" stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }

  if (kind === 'flash') {
    return (
      <g>
        {heroLegs(c)}
        {/* Gold thigh rings */}
        <ellipse cx="38" cy="48" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2.5} />
        <ellipse cx="62" cy="48" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2.5} />
      </g>
    );
  }

  if (kind === 'panther') {
    return (
      <g>
        {heroLegs(c)}
        {/* Silver vibranium stripe down each leg */}
        <line x1="38" y1="30" x2="40" y2="78" stroke={a} strokeWidth={2} />
        <line x1="62" y1="30" x2="60" y2="78" stroke={a} strokeWidth={2} />
      </g>
    );
  }

  if (kind === 'slp') {
    return (
      <g>
        {heroLegs(c)}
        {/* Center creases */}
        <line x1="38" y1="32" x2="40" y2="76" stroke={a} strokeWidth={1} />
        <line x1="62" y1="32" x2="60" y2="76" stroke={a} strokeWidth={1} />
        {/* Cuffed hem */}
        <line x1="30" y1="78" x2="46" y2="78" stroke={a} strokeWidth={2} />
        <line x1="54" y1="78" x2="70" y2="78" stroke={a} strokeWidth={2} />
      </g>
    );
  }

  if (kind === 'slp_skirt') {
    return (
      <g>
        {/* Waistband */}
        <rect x="28" y="22" width="44" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Pleated skirt cone */}
        <path d="M28,28 L72,28 L82,70 L18,70 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Pleat lines */}
        {[28, 36, 44, 50, 56, 64, 72].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1="28"
            x2={x + (i - 3) * 1.8}
            y2="70"
            stroke={a}
            strokeWidth={0.8}
          />
        ))}
        {/* Skin-tone legs below hem */}
        <rect x="40" y="70" width="6" height="12" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
        <rect x="54" y="70" width="6" height="12" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }

  if (kind === 'princess_skirt') {
    return (
      <g>
        {/* Waist sash */}
        <rect x="32" y="22" width="36" height="6" fill="#fde68a" stroke={STROKE} strokeWidth={1} />
        {/* Long flowing gown cone */}
        <path d="M32,28 L68,28 L86,80 L14,80 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Inner petticoat hem */}
        <path d="M16,76 L84,76 L86,82 L14,82 Z" fill={a} />
        {/* Center rose */}
        <circle cx="50" cy="24" r="3" fill="#fbbf24" />
      </g>
    );
  }

  if (kind === 'tutu') {
    return (
      <g>
        {/* Pink waist ribbon */}
        <ellipse cx="50" cy="32" rx="22" ry="3" fill="#ec4899" stroke={STROKE} strokeWidth={1} />
        {/* 3 tulle layers */}
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx="50"
            cy={36 + i * 6}
            rx={32 - i * 3}
            ry={7 - i}
            fill={c}
            stroke={STROKE}
            strokeWidth={0.8}
            opacity={0.85}
          />
        ))}
        {/* Skin legs below */}
        <rect x="40" y="58" width="6" height="24" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
        <rect x="54" y="58" width="6" height="24" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }

  if (kind === 'elsa_skirt') {
    return (
      <g>
        {/* Silver waist sash */}
        <rect x="32" y="22" width="36" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Icy long gown */}
        <path d="M32,28 L68,28 L86,80 L14,80 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Sparkles */}
        {[
          [30, 44], [50, 50], [70, 44], [38, 60], [62, 60], [48, 70],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#ffffff" />
        ))}
      </g>
    );
  }

  if (kind === 'ariel_tail') {
    return (
      <g>
        {/* Mermaid tail cone */}
        <path d="M38,22 L62,22 L58,72 L42,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Scale rings */}
        {[32, 42, 52, 62].map((y) => (
          <path key={y} d={`M${42 + (y - 32) * 0.1},${y} Q50,${y - 2} ${58 - (y - 32) * 0.1},${y}`} stroke={a} fill="none" strokeWidth={1} />
        ))}
        {/* Fluke fin */}
        <polygon points="42,72 18,86 50,78 82,86 58,72" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'rapunzel_skirt') {
    return (
      <g>
        {/* Pink waist sash */}
        <rect x="28" y="22" width="44" height="6" fill="#f9a8d4" stroke={STROKE} strokeWidth={1} />
        {/* Purple skirt cone (shorter, knee length) */}
        <path d="M28,28 L72,28 L78,66 L22,66 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* White apron front */}
        <rect x="40" y="30" width="20" height="34" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Skin legs below hem */}
        <rect x="40" y="66" width="6" height="16" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
        <rect x="54" y="66" width="6" height="16" fill="#ffe1c6" stroke={STROKE} strokeWidth={0.6} />
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

  if (kind === 'tiara') {
    return (
      <g>
        {/* Thin gold band */}
        <path d="M18,60 Q50,68 82,60" stroke={c} fill="none" strokeWidth={3} />
        {/* 3 gem spires */}
        {[30, 50, 70].map((x, i) => {
          const h = i === 1 ? 18 : 14;
          return (
            <g key={x}>
              <polygon points={`${x - 4},60 ${x + 4},60 ${x},${60 - h}`} fill={c} stroke={STROKE} strokeWidth={0.8} />
              <polygon points={`${x},${60 - h - 6} ${x - 4},${60 - h} ${x + 4},${60 - h}`} fill={a} />
            </g>
          );
        })}
      </g>
    );
  }

  if (kind === 'flower_crown') {
    return (
      <g>
        {/* Green vine */}
        <ellipse cx="50" cy="56" rx="34" ry="4" fill="none" stroke="#16a34a" strokeWidth={3} />
        {/* Flowers around */}
        {[20, 35, 50, 65, 80].map((x, i) => (
          <g key={x}>
            <circle
              cx={x}
              cy={56 - (i % 2) * 8}
              r="7"
              fill={i % 2 === 0 ? c : (a ?? '#ffffff')}
              stroke={STROKE}
              strokeWidth={0.6}
            />
            <circle cx={x} cy={56 - (i % 2) * 8} r="2" fill="#fde047" />
          </g>
        ))}
      </g>
    );
  }

  if (kind === 'princess_crown') {
    return (
      <g>
        {/* Gold band */}
        <rect x="20" y="56" width="60" height="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* 5 arched spires */}
        {[
          { x: 24, h: 12 },
          { x: 38, h: 18 },
          { x: 50, h: 28 },
          { x: 62, h: 18 },
          { x: 76, h: 12 },
        ].map(({ x, h }) => (
          <g key={x}>
            <polygon points={`${x - 4},56 ${x + 4},56 ${x},${56 - h}`} fill={c} stroke={STROKE} strokeWidth={0.8} />
            <polygon points={`${x},${56 - h - 6} ${x - 3},${56 - h - 2} ${x + 3},${56 - h - 2}`} fill={a} />
          </g>
        ))}
        {/* Center band gem */}
        <polygon points="50,63 56,67 50,71 44,67" fill={a} />
      </g>
    );
  }

  if (kind === 'elsa_crown') {
    return (
      <g>
        {/* Thin icy band */}
        <path d="M18,58 Q50,66 82,58" stroke={c} fill="none" strokeWidth={3} />
        {/* 5 angular crystal spires */}
        {[24, 38, 50, 62, 76].map((x, i) => {
          const h = i === 2 ? 26 : 18;
          return (
            <g key={x}>
              <polygon
                points={`${x - 3},58 ${x + 3},58 ${x + 1},${58 - h / 2} ${x},${58 - h} ${x - 1},${58 - h / 2}`}
                fill={c}
                stroke={STROKE}
                strokeWidth={0.8}
              />
              <polygon
                points={`${x},${58 - h - 6} ${x - 3},${58 - h} ${x + 3},${58 - h}`}
                fill={a}
              />
            </g>
          );
        })}
      </g>
    );
  }

  if (kind === 'belle_bow') {
    return (
      <g>
        {/* Layered red rose petals */}
        <circle cx="58" cy="50" r="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="58" cy="48" r="10" fill={c} stroke={STROKE} strokeWidth={0.8} />
        <circle cx="58" cy="48" r="6" fill="#7f1d1d" />
        {/* Green leaves */}
        <ellipse cx="42" cy="46" rx="8" ry="4" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(-30 42 46)" />
        <ellipse cx="44" cy="56" rx="8" ry="4" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(30 44 56)" />
      </g>
    );
  }

  if (kind === 'ariel_shell') {
    return (
      <g>
        {/* Pink half-shell */}
        <path d="M22,66 Q50,18 78,66 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Radial ridge lines */}
        {[-2, -1, 0, 1, 2].map((i) => (
          <line
            key={i}
            x1="50"
            y1="66"
            x2={50 + i * 12}
            y2={28 + Math.abs(i) * 6}
            stroke={a}
            strokeWidth={1.2}
          />
        ))}
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

function Mask({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'ironman';

  if (kind === 'spiderman') {
    return (
      <g>
        <rect x="22" y="18" width="56" height="64" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Web grid */}
        {[30, 40, 50, 60, 70].map((x) => (
          <line key={`v${x}`} x1={x} y1="22" x2={x} y2="78" stroke="#10101e" strokeWidth={0.6} />
        ))}
        {[30, 42, 54, 66, 78].map((y) => (
          <line key={`h${y}`} x1="24" y1={y} x2="76" y2={y} stroke="#10101e" strokeWidth={0.6} />
        ))}
        {/* Big tilted white eyes */}
        <path d="M28,38 L46,32 L42,52 L26,46 Z" fill="#f8fafc" stroke="#10101e" strokeWidth={1.2} />
        <path d="M72,38 L54,32 L58,52 L74,46 Z" fill="#f8fafc" stroke="#10101e" strokeWidth={1.2} />
      </g>
    );
  }

  if (kind === 'hulk') {
    return (
      <g>
        <rect x="22" y="22" width="56" height="60" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark messy hair */}
        <path d="M20,28 Q26,12 36,22 Q42,12 50,22 Q58,12 64,22 Q74,12 80,28 L78,32 L22,32 Z" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Angry brows (inner ends down) */}
        <line x1="30" y1="40" x2="44" y2="48" stroke={a} strokeWidth={4} strokeLinecap="round" />
        <line x1="70" y1="40" x2="56" y2="48" stroke={a} strokeWidth={4} strokeLinecap="round" />
        {/* Narrow white eyes */}
        <ellipse cx="38" cy="52" rx="6" ry="3" fill="#f8fafc" />
        <ellipse cx="62" cy="52" rx="6" ry="3" fill="#f8fafc" />
        <circle cx="36" cy="52" r="2" fill={a} />
        <circle cx="60" cy="52" r="2" fill={a} />
        {/* Gritted teeth mouth */}
        <rect x="32" y="64" width="36" height="10" fill={a} />
        <rect x="34" y="66" width="32" height="6" fill="#f8fafc" />
        {[40, 47, 54, 61].map((x) => (
          <line key={x} x1={x} y1="66" x2={x} y2="72" stroke={a} strokeWidth={1.5} />
        ))}
      </g>
    );
  }

  if (kind === 'batman') {
    return (
      <g>
        {/* Cowl */}
        <path d="M22,30 L28,18 L40,28 L60,28 L72,18 L78,30 L72,72 L60,82 L40,82 L28,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Pointed bat ears */}
        <polygon points="28,18 22,2 36,20" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="72,18 78,2 64,20" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* White slit eyes */}
        <rect x="32" y="46" width="12" height="4" rx="1" fill="#f8fafc" />
        <rect x="56" y="46" width="12" height="4" rx="1" fill="#f8fafc" />
        {/* Exposed jaw + frown */}
        <rect x="36" y="70" width="28" height="10" fill="#ffe1c6" />
        <line x1="42" y1="76" x2="58" y2="76" stroke="#1f2937" strokeWidth={1.2} />
      </g>
    );
  }

  if (kind === 'captain_america') {
    return (
      <g>
        {/* Blue cowl */}
        <path d="M22,30 L28,18 L72,18 L78,30 L72,68 L60,80 L40,80 L28,68 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* White wings */}
        <polygon points="22,30 10,38 26,42" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <polygon points="78,30 90,38 74,42" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* White A on forehead */}
        <text x="50" y="40" textAnchor="middle" fontSize="14" fontWeight="900" fill={a}>A</text>
        {/* Eyes */}
        <circle cx="38" cy="52" r="3" fill="#f8fafc" />
        <circle cx="62" cy="52" r="3" fill="#f8fafc" />
        <circle cx="38" cy="52" r="1.5" fill="#1f2937" />
        <circle cx="62" cy="52" r="1.5" fill="#1f2937" />
        {/* Smiling exposed face */}
        <rect x="34" y="66" width="32" height="14" fill="#ffe1c6" />
        <path d="M42,74 Q50,80 58,74" stroke="#ef4444" fill="none" strokeWidth={1.5} />
      </g>
    );
  }

  if (kind === 'thor') {
    return (
      <g>
        {/* Silver helmet */}
        <path d="M22,32 L28,20 L72,20 L78,32 L72,72 L60,82 L40,82 L28,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Top crest ridge */}
        <rect x="46" y="10" width="8" height="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Side wings */}
        <polygon points="22,30 8,18 24,40" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="78,30 92,18 76,40" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Forehead gem */}
        <polygon points="50,32 56,38 50,44 44,38" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Eyes + blonde beard */}
        <circle cx="38" cy="52" r="3" fill="#f8fafc" />
        <circle cx="62" cy="52" r="3" fill="#f8fafc" />
        <circle cx="38" cy="52" r="1.5" fill="#1f2937" />
        <circle cx="62" cy="52" r="1.5" fill="#1f2937" />
        <rect x="34" y="66" width="32" height="14" fill="#ffe1c6" />
        <rect x="36" y="74" width="28" height="4" fill={a} />
      </g>
    );
  }

  if (kind === 'flash') {
    return (
      <g>
        {/* Red cowl */}
        <rect x="22" y="20" width="56" height="62" rx="8" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Gold lightning ear pieces */}
        <polygon points="18,42 10,32 16,52 8,60 22,50" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <polygon points="82,42 90,32 84,52 92,60 78,50" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* White lenses */}
        <rect x="30" y="44" width="14" height="8" rx="2" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
        <rect x="56" y="44" width="14" height="8" rx="2" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
        {/* Smiling exposed jaw */}
        <rect x="34" y="64" width="32" height="14" fill="#ffe1c6" />
        <path d="M42,72 Q50,78 58,72" stroke="#ef4444" fill="none" strokeWidth={1.5} />
      </g>
    );
  }

  if (kind === 'panther') {
    return (
      <g>
        {/* Black cat mask */}
        <rect x="22" y="22" width="56" height="60" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cat ears */}
        <polygon points="30,22 26,8 40,22" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="70,22 74,8 60,22" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Silver fierce eyes */}
        <path d="M28,46 L46,40 L42,54 L26,50 Z" fill={a} />
        <path d="M72,46 L54,40 L58,54 L74,50 Z" fill={a} />
        {/* Silver claw marks on cheeks */}
        {[58, 62, 66].map((y) => (
          <line key={`l${y}`} x1="22" y1={y} x2="34" y2={y - 2} stroke={a} strokeWidth={1.2} />
        ))}
        {[58, 62, 66].map((y) => (
          <line key={`r${y}`} x1="78" y1={y} x2="66" y2={y - 2} stroke={a} strokeWidth={1.2} />
        ))}
      </g>
    );
  }

  // Default: Iron Man face plate.
  return (
    <g>
      {/* Crimson faceplate silhouette */}
      <path
        d="M28,18 L72,18 L78,54 L70,76 L60,86 L40,86 L30,76 L22,54 Z"
        fill={c}
        stroke={STROKE}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* Forehead gold band */}
      <rect x="26" y="22" width="48" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
      {/* Forehead V */}
      <polygon points="38,30 62,30 50,46" fill={a} stroke={STROKE} strokeWidth={1} />
      {/* Eye slits */}
      <rect x="30" y="44" width="14" height="5" rx="1" fill="#facc15" stroke={STROKE} strokeWidth={1} />
      <rect x="56" y="44" width="14" height="5" rx="1" fill="#facc15" stroke={STROKE} strokeWidth={1} />
      {/* Cheek gold strips */}
      <rect x="22" y="54" width="4" height="22" fill={a} />
      <rect x="74" y="54" width="4" height="22" fill={a} />
      {/* Mouth vent slats */}
      {[40, 45, 50, 55, 60].map((x) => (
        <rect key={x} x={x} y="62" width="2" height="12" fill="#1f2937" />
      ))}
    </g>
  );
}

function Back({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? darken(c);
  const kind = item.kind ?? 'pack';

  if (kind === 'ironman') {
    const gold = a;
    return (
      <g>
        {/* Crimson swept-back wings */}
        <path
          d="M50,40 L18,18 L24,52 L42,46 L36,72 L50,58 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path
          d="M50,40 L82,18 L76,52 L58,46 L64,72 L50,58 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Gold trim */}
        <line x1="50" y1="40" x2="20" y2="22" stroke={gold} strokeWidth={2.5} />
        <line x1="50" y1="40" x2="80" y2="22" stroke={gold} strokeWidth={2.5} />
        {/* Repulsor thruster glows at wing base */}
        <circle cx="38" cy="70" r="4" fill="#a5f3fc" stroke={STROKE} strokeWidth={1} />
        <circle cx="62" cy="70" r="4" fill="#a5f3fc" stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

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
  if (kind === 'spiderman') {
    return (
      <g>
        {/* Red backplate */}
        <path d="M22,20 L78,20 L82,80 L18,80 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Black spider symbol */}
        <ellipse cx="50" cy="50" rx="6" ry="10" fill={a} />
        {[-1, 1].map((s) =>
          [0, 1, 2, 3].map((i) => (
            <line
              key={`l${s}-${i}`}
              x1="50"
              y1="50"
              x2={50 + s * (16 + i * 2)}
              y2={40 + i * 5}
              stroke={a}
              strokeWidth={1.2}
            />
          ))
        )}
      </g>
    );
  }

  if (kind === 'hulk') {
    return (
      <g>
        {/* Tattered purple shirt panel */}
        <rect x="28" y="22" width="44" height="40" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Shoulder straps angled */}
        <rect x="20" y="20" width="12" height="22" fill={c} stroke={STROKE} strokeWidth={SW} transform="rotate(-15 26 31)" />
        <rect x="68" y="20" width="12" height="22" fill={c} stroke={STROKE} strokeWidth={SW} transform="rotate(15 74 31)" />
        {/* Ragged torn hem (zigzag) */}
        <polygon
          points="28,62 36,76 42,62 48,76 54,62 60,76 66,62 72,76 72,62"
          fill={c}
          stroke={STROKE}
          strokeWidth={1}
        />
      </g>
    );
  }

  if (kind === 'batman_cape') {
    return (
      <g>
        {/* Long cape with scalloped bottom */}
        <path
          d="M28,16 L72,16 L82,72 L70,72 L66,80 L60,72 L56,80 L50,72 L44,80 L40,72 L34,80 L30,72 L18,72 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <rect x="28" y="16" width="44" height="5" fill={a} />
      </g>
    );
  }

  if (kind === 'cap_shield') {
    return (
      <g>
        {/* Concentric circles */}
        <circle cx="50" cy="50" r="36" fill="#1e40af" stroke={STROKE} strokeWidth={SW} />
        <circle cx="50" cy="50" r="28" fill="#f8fafc" />
        <circle cx="50" cy="50" r="20" fill={a} />
        <circle cx="50" cy="50" r="12" fill="#f8fafc" />
        <circle cx="50" cy="50" r="6" fill={c} />
        {/* White star center */}
        <polygon
          points="50,38 53,46 62,46 55,52 57,61 50,56 43,61 45,52 38,46 47,46"
          fill="#f8fafc"
          stroke={STROKE}
          strokeWidth={0.8}
        />
      </g>
    );
  }

  if (kind === 'thor_cape') {
    return (
      <g>
        <path d="M28,16 L72,16 L80,82 L20,82 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Gold clasps */}
        <circle cx="30" cy="20" r="3" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <circle cx="70" cy="20" r="3" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }

  if (kind === 'superman_cape') {
    return (
      <g>
        <path d="M28,16 L72,16 L80,82 L20,82 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Yellow collar */}
        <path d="M28,16 Q50,28 72,16" stroke={a} fill="none" strokeWidth={4} />
      </g>
    );
  }

  if (kind === 'flash_bolt') {
    return (
      <g>
        {/* Red disc */}
        <circle cx="50" cy="50" r="32" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Gold lightning bolt */}
        <polygon
          points="58,18 30,54 46,54 38,82 70,46 54,46 60,18"
          fill={c}
          stroke={STROKE}
          strokeWidth={1}
        />
      </g>
    );
  }

  if (kind === 'panther_cape') {
    return (
      <g>
        <path d="M28,16 L72,16 L78,68 L22,68 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Silver epaulets */}
        <rect x="22" y="14" width="16" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <rect x="62" y="14" width="16" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }

  if (kind === 'fairy_wings') {
    return (
      <g>
        {/* Translucent oval wings */}
        <ellipse cx="30" cy="40" rx="14" ry="22" fill={c} opacity="0.7" stroke={STROKE} strokeWidth={1} />
        <ellipse cx="70" cy="40" rx="14" ry="22" fill={c} opacity="0.7" stroke={STROKE} strokeWidth={1} />
        <ellipse cx="30" cy="64" rx="10" ry="16" fill={c} opacity="0.7" stroke={STROKE} strokeWidth={1} />
        <ellipse cx="70" cy="64" rx="10" ry="16" fill={c} opacity="0.7" stroke={STROKE} strokeWidth={1} />
        {/* Sparkles */}
        {[20, 50, 80, 30, 70].map((x, i) => (
          <circle key={i} cx={x} cy={[18, 22, 18, 84, 84][i]} r="2" fill="#ffffff" stroke="#fde047" strokeWidth={0.5} />
        ))}
      </g>
    );
  }

  if (kind === 'butterfly') {
    return (
      <g>
        {/* Two round upper, two teardrop lower wings */}
        <ellipse cx="30" cy="40" rx="16" ry="14" fill={c} stroke={STROKE} strokeWidth={1} />
        <ellipse cx="70" cy="40" rx="16" ry="14" fill={c} stroke={STROKE} strokeWidth={1} />
        <ellipse cx="30" cy="64" rx="12" ry="16" fill={c} stroke={STROKE} strokeWidth={1} />
        <ellipse cx="70" cy="64" rx="12" ry="16" fill={c} stroke={STROKE} strokeWidth={1} />
        {/* Spots */}
        <circle cx="30" cy="40" r="4" fill={a} />
        <circle cx="70" cy="40" r="4" fill={a} />
        <circle cx="30" cy="64" r="3" fill={a} />
        <circle cx="70" cy="64" r="3" fill={a} />
      </g>
    );
  }

  if (kind === 'princess_cape') {
    return (
      <g>
        {/* Long cape */}
        <path d="M28,22 L72,22 L84,82 L16,82 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* White fur collar */}
        <path d="M22,20 Q50,32 78,20 L74,28 Q50,38 26,28 Z" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Gold clasp */}
        <circle cx="50" cy="30" r="3" fill="#fbbf24" stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }

  if (kind === 'elsa_cape') {
    return (
      <g>
        <path d="M28,18 L72,18 L82,82 L18,82 Z" fill={c} opacity="0.85" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Snowflake sparkles */}
        {[
          [32, 30], [50, 36], [68, 30], [38, 50], [62, 50], [44, 66], [56, 66], [50, 76],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="1.6" fill="#ffffff" />
            <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#ffffff" strokeWidth={0.6} />
            <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#ffffff" strokeWidth={0.6} />
          </g>
        ))}
      </g>
    );
  }

  if (kind === 'ariel_wave') {
    return (
      <g>
        {/* Long red hair panel */}
        <path d="M24,18 L76,18 L72,78 Q60,86 50,80 Q40,86 28,78 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Curl tips */}
        {[32, 42, 58, 68].map((x) => (
          <circle key={x} cx={x} cy="78" r="5" fill={a} stroke={STROKE} strokeWidth={1} />
        ))}
        {/* Wave strokes */}
        <path d="M30,30 Q50,40 70,30" stroke={a} fill="none" strokeWidth={1.2} />
        <path d="M28,50 Q50,60 72,50" stroke={a} fill="none" strokeWidth={1.2} />
      </g>
    );
  }

  if (kind === 'rapunzel_hair') {
    return (
      <g>
        {/* Long blonde braid */}
        <path d="M30,18 L70,18 L66,84 L34,84 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Braid sections */}
        {[30, 42, 54, 66, 78].map((y) => (
          <ellipse key={y} cx="50" cy={y} rx="16" ry="4" fill={a} opacity="0.6" />
        ))}
        {/* Pink flowers tucked in */}
        <circle cx="38" cy="36" r="3" fill="#f472b6" stroke={STROKE} strokeWidth={0.6} />
        <circle cx="62" cy="50" r="3" fill="#f472b6" stroke={STROKE} strokeWidth={0.6} />
        <circle cx="40" cy="64" r="3" fill="#f472b6" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }

  if (kind === 'slp_backpack') {
    return (
      <g>
        {/* Yellow upper body */}
        <path d="M24,28 L76,28 L76,56 L24,56 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Navy lower body */}
        <path d="M24,56 L76,56 L76,80 L24,80 Z" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Seam between sections */}
        <line x1="24" y1="56" x2="76" y2="56" stroke="#a16207" strokeWidth={1.5} />
        {/* Red SLP patch on the upper-right */}
        <rect x="50" y="34" width="22" height="12" fill="#dc2626" stroke={STROKE} strokeWidth={0.6} />
        <text
          x="61"
          y="44"
          textAnchor="middle"
          fontSize="8"
          fontWeight="900"
          fill="#f8fafc"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          SLP
        </text>
        {/* Front pocket on the navy section */}
        <rect x="30" y="60" width="40" height="14" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Shoulder straps */}
        <rect x="22" y="28" width="6" height="40" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="72" y="28" width="6" height="40" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Top loop handle */}
        <path d="M40,28 Q50,18 60,28" stroke={c} fill="none" strokeWidth={3} />
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

  if (kind === 'ironman') {
    const accent = a;
    return (
      <g>
        {/* Gold shin guard */}
        <rect x="28" y="20" width="40" height="36" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Gold boot box */}
        <rect x="22" y="50" width="58" height="22" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Red toe cap */}
        <rect x="58" y="52" width="22" height="20" rx="4" fill={accent} stroke={STROKE} strokeWidth={SW} />
        {/* Repulsor glow on sole */}
        <ellipse cx="42" cy="76" rx="14" ry="4" fill="#a5f3fc" stroke={STROKE} strokeWidth={1} />
        {/* Knee accent */}
        <rect x="32" y="42" width="32" height="6" fill={accent} />
      </g>
    );
  }

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

  // Shared "boot side" path used by hero shoes
  const heroBoot = (fill: string) => (
    <path
      d="M30,20 L52,20 L52,58 L74,58 L74,74 L30,74 Z"
      fill={fill}
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  );

  if (kind === 'spiderman') {
    return (
      <g>
        {heroBoot(c)}
        {/* Black sole */}
        <rect x="30" y="72" width="44" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Web vertical line */}
        <line x1="50" y1="22" x2="52" y2="74" stroke={a} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'hulk') {
    return (
      <g>
        {/* Bare green foot */}
        <path d="M22,52 L74,52 L78,72 L18,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Toes */}
        {[28, 38, 48, 58, 68].map((x) => (
          <circle key={x} cx={x} cy="56" r="4" fill={c} stroke={STROKE} strokeWidth={0.8} />
        ))}
        {/* Toe-crease shading */}
        <path d="M22,60 Q50,64 78,60" stroke={a} fill="none" strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'batman') {
    return (
      <g>
        {heroBoot(c)}
        {/* Knee fin */}
        <polygon points="30,20 24,12 30,32" fill={a} stroke={STROKE} strokeWidth={1} />
        <rect x="30" y="70" width="44" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'captain_america') {
    return (
      <g>
        {heroBoot(c)}
        {/* Red strap */}
        <rect x="30" y="32" width="44" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <rect x="30" y="70" width="44" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'thor') {
    return (
      <g>
        {heroBoot(c)}
        {/* Silver metal strap */}
        <rect x="30" y="32" width="44" height="6" fill={a} stroke={STROKE} strokeWidth={1} />
        <rect x="30" y="68" width="44" height="10" fill={a} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'superman') {
    return (
      <g>
        {heroBoot(c)}
        {/* Yellow top trim */}
        <rect x="30" y="20" width="22" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <rect x="30" y="72" width="44" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'flash') {
    return (
      <g>
        {heroBoot(c)}
        {/* Gold ankle lightning wings */}
        <polygon points="22,30 12,38 24,42 14,52 28,46" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <rect x="30" y="72" width="44" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'panther') {
    return (
      <g>
        {heroBoot(c)}
        {/* Silver claws at the toe */}
        {[62, 68, 74].map((x) => (
          <polygon key={x} points={`${x - 3},58 ${x + 3},58 ${x},${50}`} fill={a} />
        ))}
        <rect x="30" y="72" width="44" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'slp') {
    return (
      <g>
        {/* Polished dress shoe (rounded top) */}
        <path d="M18,52 Q18,38 38,38 L60,38 Q82,44 84,62 L84,72 L18,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Glossy toe cap (lighter band at toe) */}
        <path d="M60,40 Q82,46 84,62 L84,72 L60,72 Z" fill={lighten(c)} stroke={STROKE} strokeWidth={0.6} />
        {/* Contrasting sole */}
        <rect x="18" y="68" width="66" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'slp_girl') {
    return (
      <g>
        {/* Mary Jane shoe */}
        <path d="M18,52 Q18,38 38,38 L60,38 Q82,44 84,62 L84,72 L18,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Ankle strap across the top */}
        <rect x="32" y="42" width="38" height="5" rx="1" fill={c} stroke={STROKE} strokeWidth={0.8} />
        {/* Tiny gold buckle */}
        <rect x="48" y="42" width="6" height="5" fill="#fbbf24" stroke={STROKE} strokeWidth={0.6} />
        {/* Contrasting sole */}
        <rect x="18" y="68" width="66" height="6" fill={a} />
      </g>
    );
  }

  if (kind === 'glass_slipper') {
    return (
      <g>
        {/* Translucent heel shoe */}
        <path d="M18,54 Q18,42 38,42 L62,42 Q80,46 82,62 L82,70 L18,70 Z" fill={c} opacity="0.6" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Heel */}
        <path d="M62,70 L70,86 L60,86 L58,70 Z" fill={c} opacity="0.6" stroke={STROKE} strokeWidth={SW} />
        {/* Sparkle */}
        <circle cx="64" cy="50" r="2" fill="#ffffff" />
        <circle cx="40" cy="62" r="1.6" fill="#ffffff" />
      </g>
    );
  }

  if (kind === 'ballet') {
    return (
      <g>
        {/* Soft flat shoe */}
        <path d="M18,56 Q20,42 38,42 L62,42 Q82,46 84,62 L84,70 L18,70 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Ribbon laces criss-crossing the ankle */}
        <line x1="36" y1="26" x2="58" y2="44" stroke={a} strokeWidth={2} />
        <line x1="58" y1="26" x2="36" y2="44" stroke={a} strokeWidth={2} />
        {/* Bow at the top */}
        <circle cx="48" cy="22" r="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Sole */}
        <rect x="18" y="68" width="66" height="4" fill={a} />
      </g>
    );
  }

  if (kind === 'ribbon_heel') {
    return (
      <g>
        {/* Low heel pump */}
        <path d="M18,54 Q18,42 38,42 L62,42 Q80,46 82,62 L82,70 L18,70 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Small heel */}
        <path d="M60,70 L66,86 L58,86 L56,70 Z" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Bow on toe */}
        <circle cx="72" cy="50" r="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="68,50 76,50 72,56" fill={a} />
        <rect x="18" y="68" width="66" height="4" fill={a} />
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

  if (kind === 'ironman') {
    const ring = item.accent ?? '#fbbf24';
    return (
      <g>
        {/* Arc reactor pendant */}
        <line x1="50" y1="12" x2="50" y2="22" stroke={STROKE} strokeWidth={2} />
        <circle cx="50" cy="10" r="4" fill="none" stroke={STROKE} strokeWidth={SW} />
        <circle cx="50" cy="54" r="26" fill={ring} stroke={STROKE} strokeWidth={SW} />
        <circle cx="50" cy="54" r="18" fill={c} />
        <circle cx="50" cy="54" r="10" fill="#a5f3fc" stroke="#ffffff" strokeWidth={1} />
        <circle cx="50" cy="54" r="4" fill="#ffffff" />
        {/* Inner triangular coil */}
        <polygon points="50,40 60,58 40,58" fill="none" stroke="#0e7490" strokeWidth={1} />
      </g>
    );
  }

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
    case 'wand':
      return (
        <g>
          {/* Handle */}
          <rect x="48" y="50" width="4" height="32" fill="#fde68a" stroke={STROKE} strokeWidth={1} />
          {/* Star tip */}
          <polygon
            points="50,12 56,30 76,30 60,42 66,62 50,50 34,62 40,42 24,30 44,30"
            fill={c}
            stroke={STROKE}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
        </g>
      );
    case 'ribbon_bow':
      return (
        <g>
          {/* Center knot */}
          <rect x="44" y="40" width="12" height="14" fill={c} stroke={STROKE} strokeWidth={1} />
          {/* Side loops */}
          <ellipse cx="28" cy="46" rx="16" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
          <ellipse cx="72" cy="46" rx="16" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Tails */}
          <polygon points="40,54 48,54 44,84" fill={c} stroke={STROKE} strokeWidth={1} />
          <polygon points="52,54 60,54 56,84" fill={c} stroke={STROKE} strokeWidth={1} />
        </g>
      );
    case 'rose':
      return (
        <g>
          {/* Layered petals */}
          <circle cx="50" cy="50" r="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          <circle cx="50" cy="48" r="14" fill={c} stroke={STROKE} strokeWidth={1} />
          <circle cx="50" cy="46" r="7" fill="#7f1d1d" />
          {/* Green leaf */}
          <ellipse cx="28" cy="68" rx="10" ry="4" fill="#22c55e" stroke={STROKE} strokeWidth={0.8} transform="rotate(-30 28 68)" />
        </g>
      );
    case 'snowflake':
      return (
        <g>
          {/* 6 arms */}
          {[0, 1, 2].map((i) => {
            const angle = (i * Math.PI) / 3;
            const dx = Math.cos(angle) * 34;
            const dy = Math.sin(angle) * 34;
            return (
              <line
                key={i}
                x1={50 - dx}
                y1={50 - dy}
                x2={50 + dx}
                y2={50 + dy}
                stroke={c}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
          {/* Side dots */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI) / 3;
            return (
              <circle
                key={i}
                cx={50 + Math.cos(angle) * 24}
                cy={50 + Math.sin(angle) * 24}
                r="3"
                fill={c}
              />
            );
          })}
          {/* Center gem */}
          <polygon points="50,40 60,50 50,60 40,50" fill={item.accent ?? '#0ea5e9'} />
        </g>
      );
    case 'pumpkin_carriage':
      return (
        <g>
          {/* Pumpkin body */}
          <ellipse cx="50" cy="54" rx="26" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Ridges */}
          <path d="M40,36 Q34,54 40,72" stroke={darken(c)} fill="none" strokeWidth={1.5} />
          <path d="M50,34 L50,74" stroke={darken(c)} strokeWidth={1.5} />
          <path d="M60,36 Q66,54 60,72" stroke={darken(c)} fill="none" strokeWidth={1.5} />
          {/* Green stem */}
          <rect x="46" y="26" width="8" height="10" fill="#16a34a" stroke={STROKE} strokeWidth={0.8} />
          {/* Gold wheels */}
          <circle cx="32" cy="78" r="6" fill="none" stroke={item.accent ?? '#fde047'} strokeWidth={2} />
          <circle cx="68" cy="78" r="6" fill="none" stroke={item.accent ?? '#fde047'} strokeWidth={2} />
        </g>
      );
    case 'seashell':
      return (
        <g>
          {/* Pink half-shell */}
          <path d="M18,72 Q50,18 82,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          {/* Radial ridges */}
          {[-2, -1, 0, 1, 2].map((i) => (
            <line
              key={i}
              x1="50"
              y1="72"
              x2={50 + i * 14}
              y2={28 + Math.abs(i) * 6}
              stroke={item.accent ?? '#f472b6'}
              strokeWidth={1.4}
            />
          ))}
        </g>
      );
    case 'slp_badge':
      return (
        <g>
          {/* Lanyard line */}
          <line x1="50" y1="14" x2="50" y2="28" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="12" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Tag rectangle */}
          <rect x="22" y="28" width="56" height="46" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Navy header band */}
          <rect x="22" y="28" width="56" height="14" fill={item.accent ?? '#1e3a8a'} />
          <text x="50" y="40" textAnchor="middle" fontSize="10" fontWeight="900" fill="#f8fafc">SLP</text>
          {/* Faint name lines */}
          <line x1="30" y1="54" x2="70" y2="54" stroke={item.accent ?? '#1e3a8a'} strokeWidth={1} />
          <line x1="30" y1="62" x2="70" y2="62" stroke={item.accent ?? '#1e3a8a'} strokeWidth={1} />
          <line x1="30" y1="70" x2="60" y2="70" stroke={item.accent ?? '#1e3a8a'} strokeWidth={1} />
        </g>
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
