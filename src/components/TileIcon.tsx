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
    case 'misc':
      return <Misc item={item} />;
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

  if (kind === 'joon_cardigan') {
    return (
      <g>
        {/* Yellow undershirt strip down the middle */}
        <rect x="42" y="28" width="16" height="50" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Cream cardigan halves (parted in the middle) */}
        <path d="M28,30 L40,22 L48,28 L42,28 L42,78 L34,78 L34,42 L30,46 L22,40 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M72,30 L60,22 L52,28 L58,28 L58,78 L66,78 L66,42 L70,46 L78,40 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Knit dotted texture on cardigan halves */}
        {[[30, 50], [38, 56], [30, 62], [38, 68], [62, 50], [70, 56], [62, 62], [70, 68]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill={darken(c)} />
        ))}
        {/* Wooden buttons */}
        {[42, 56, 70].map((y) => (
          <circle key={`bl-${y}`} cx="40" cy={y} r="1.4" fill="#8b5a2b" stroke={STROKE} strokeWidth={0.5} />
        ))}
        {[42, 56, 70].map((y) => (
          <circle key={`br-${y}`} cx="60" cy={y} r="1.4" fill="#8b5a2b" stroke={STROKE} strokeWidth={0.5} />
        ))}
        {/* Marine patches */}
        {/* Yellow starfish (upper-left) */}
        <polygon
          points="28,42 31,48 37,48 32,52 34,58 28,54 22,58 24,52 19,48 25,48"
          fill="#fbbf24"
          stroke={STROKE}
          strokeWidth={0.5}
        />
        {/* Red starfish (lower-left) */}
        <polygon
          points="28,68 31,73 37,73 32,76 34,80 28,76 22,80 24,76 19,73 25,73"
          fill="#dc2626"
          stroke={STROKE}
          strokeWidth={0.5}
        />
        {/* Blue palm leaf (upper-right) */}
        <ellipse cx="72" cy="46" rx="4" ry="8" fill="#1d4ed8" stroke={STROKE} strokeWidth={0.5} transform="rotate(20 72 46)" />
        <line x1="72" y1="40" x2="72" y2="52" stroke="#1e3a8a" strokeWidth={0.8} transform="rotate(20 72 46)" />
        {/* Blue shell (lower-right) */}
        <path d="M64,74 Q72,62 80,74 Z" fill="#1d4ed8" stroke={STROKE} strokeWidth={0.5} />
        {[-1, 0, 1].map((i) => (
          <line key={i} x1={72 + i * 3} y1="74" x2={72 + i * 1.6} y2={66 - Math.abs(i) * 1} stroke="#1e3a8a" strokeWidth={0.6} />
        ))}
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

  if (kind === 'wolverine') {
    return (
      <g>
        {teeBody(c)}
        {/* Blue V chest */}
        <polygon points="34,30 50,52 66,30 60,30 50,46 40,30" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Brown belt + gold X buckle */}
        <rect x="32" y="72" width="36" height="6" fill="#7c2d12" stroke={STROKE} strokeWidth={0.6} />
        <rect x="46" y="71" width="8" height="8" fill="#fbbf24" stroke={STROKE} strokeWidth={0.6} />
        {/* Silver claws from each fist */}
        {[-1, 1].map((sx) =>
          [-1, 0, 1].map((j) => (
            <polygon
              key={`${sx}-${j}`}
              points={`${sx > 0 ? 78 + j * 2 : 22 + j * 2},82 ${sx > 0 ? 76 + j * 2 : 24 + j * 2},96 ${sx > 0 ? 80 + j * 2 : 20 + j * 2},96`}
              fill="#e2e8f0"
              stroke={STROKE}
              strokeWidth={0.4}
            />
          ))
        )}
      </g>
    );
  }

  if (kind === 'dr_strange') {
    return (
      <g>
        {teeBody(c)}
        {/* High collar */}
        <rect x="40" y="24" width="20" height="10" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Gold V sash */}
        <line x1="34" y1="32" x2="50" y2="50" stroke={a} strokeWidth={4} />
        <line x1="66" y1="32" x2="50" y2="50" stroke={a} strokeWidth={4} />
        {/* Gold belt */}
        <rect x="32" y="72" width="36" height="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Eye of Agamotto pendant */}
        <circle cx="50" cy="62" r="5" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <ellipse cx="50" cy="62" rx="3" ry="1.5" fill="#22c55e" />
      </g>
    );
  }

  if (kind === 'starlord') {
    return (
      <g>
        {teeBody(c)}
        {/* Brown shoulder pads */}
        <rect x="22" y="28" width="14" height="10" fill="#3f3f1a" stroke={STROKE} strokeWidth={0.6} />
        <rect x="64" y="28" width="14" height="10" fill="#3f3f1a" stroke={STROKE} strokeWidth={0.6} />
        {/* Central zipper */}
        <line x1="50" y1="32" x2="50" y2="76" stroke={a} strokeWidth={1.5} />
        {/* Guardians round badge */}
        <circle cx="36" cy="48" r="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <text x="36" y="50" textAnchor="middle" fontSize="5" fontWeight="900" fill={c}>G</text>
        {/* Stitching */}
        <line x1="36" y1="34" x2="36" y2="76" stroke={a} strokeWidth={0.6} strokeDasharray="2 1" />
        <line x1="64" y1="34" x2="64" y2="76" stroke={a} strokeWidth={0.6} strokeDasharray="2 1" />
      </g>
    );
  }

  if (kind === 'antman') {
    return (
      <g>
        {teeBody(c)}
        {/* Black horizontal segments */}
        <rect x="32" y="42" width="36" height="4" fill={a} />
        <rect x="32" y="54" width="36" height="4" fill={a} />
        <rect x="32" y="66" width="36" height="4" fill={a} />
        {/* Black shoulder caps */}
        <ellipse cx="28" cy="32" rx="6" ry="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="72" cy="32" rx="6" ry="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Silver center emblem */}
        <circle cx="50" cy="48" r="3" fill="#cbd5e1" stroke={STROKE} strokeWidth={0.5} />
      </g>
    );
  }

  if (kind === 'war_machine') {
    return (
      <g>
        {teeBody(c)}
        {/* Bulky shoulder plates */}
        <rect x="20" y="28" width="14" height="14" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="66" y="28" width="14" height="14" rx="2" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark chest panel */}
        <rect x="36" y="42" width="28" height="20" rx="2" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Yellow LED arc reactor */}
        <circle cx="50" cy="52" r="6" fill="#fde047" stroke={STROKE} strokeWidth={0.8} />
        <circle cx="50" cy="52" r="3" fill="#fef3c7" />
        {/* Gunmetal belt */}
        <rect x="32" y="72" width="36" height="5" fill={a} />
      </g>
    );
  }

  if (kind === 'vision') {
    return (
      <g>
        {teeBody(c)}
        {/* Yellow oval collar */}
        <ellipse cx="50" cy="32" rx="14" ry="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Yellow V harness */}
        <line x1="34" y1="36" x2="50" y2="58" stroke={a} strokeWidth={3} />
        <line x1="66" y1="36" x2="50" y2="58" stroke={a} strokeWidth={3} />
        {/* Yellow belt */}
        <rect x="32" y="72" width="36" height="4" fill={a} />
      </g>
    );
  }

  if (kind === 'daredevil') {
    return (
      <g>
        {teeBody(c)}
        {/* Black shoulder pads */}
        <rect x="20" y="28" width="14" height="12" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <rect x="66" y="28" width="14" height="12" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* DD emblem */}
        <text x="50" y="56" textAnchor="middle" fontSize="14" fontWeight="900" fill={a}>DD</text>
        {/* Black belt */}
        <rect x="32" y="72" width="36" height="5" fill={a} />
      </g>
    );
  }

  if (kind === 'hawkeye') {
    return (
      <g>
        {teeBody(c)}
        {/* Diagonal leather strap (quiver) */}
        <line x1="30" y1="68" x2="70" y2="32" stroke="#7c2d12" strokeWidth={4} />
        {/* Arrow emblem on chest */}
        <line x1="50" y1="46" x2="50" y2="60" stroke="#cbd5e1" strokeWidth={2} />
        <polygon points="46,42 54,42 50,52" fill="#cbd5e1" stroke={STROKE} strokeWidth={0.4} />
        {/* Dark vest sides */}
        <rect x="28" y="38" width="6" height="38" fill={a} />
        <rect x="66" y="38" width="6" height="38" fill={a} />
      </g>
    );
  }

  if (kind === 'falcon') {
    return (
      <g>
        {teeBody(c)}
        {/* Dark tactical band */}
        <rect x="28" y="40" width="44" height="8" fill="#1f2937" />
        {/* Falcon bird emblem (wing curves) */}
        <path d="M40,58 L50,52 L60,58" stroke={a} fill="none" strokeWidth={3} strokeLinecap="round" />
        {/* Belt */}
        <rect x="32" y="72" width="36" height="5" fill="#1f2937" />
      </g>
    );
  }

  if (kind === 'venom') {
    return (
      <g>
        {teeBody(c)}
        {/* White slime ridges on shoulders */}
        <rect x="20" y="30" width="14" height="6" fill={a} />
        <rect x="66" y="30" width="14" height="6" fill={a} />
        {/* White spider symbol on chest */}
        <ellipse cx="50" cy="48" rx="3" ry="6" fill={a} />
        {[-1, 1].map((sx) =>
          [0, 1, 2, 3].map((i) => (
            <line
              key={`${sx}-${i}`}
              x1="50"
              y1="48"
              x2={50 + sx * (10 + i * 1.5)}
              y2={42 + i * 4}
              stroke={a}
              strokeWidth={1}
            />
          ))
        )}
      </g>
    );
  }

  if (kind === 'ghost_rider') {
    return (
      <g>
        {teeBody(c)}
        {/* Silver chains in an X */}
        <line x1="28" y1="36" x2="72" y2="68" stroke={a} strokeWidth={3} strokeLinecap="round" />
        <line x1="72" y1="36" x2="28" y2="68" stroke={a} strokeWidth={3} strokeLinecap="round" />
        {/* Leather collar */}
        <ellipse cx="50" cy="30" rx="14" ry="3" fill="#0a0a0a" stroke={STROKE} strokeWidth={0.6} />
        {/* Skull buckle */}
        <ellipse cx="50" cy="72" rx="4" ry="3" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }

  if (kind === 'silver_surfer') {
    return (
      <g>
        {/* Chrome body with reflection */}
        <path
          d="M28,30 L40,22 L48,28 L52,28 L60,22 L72,30 L78,40 L70,46 L66,42 L66,78 L34,78 L34,42 L30,46 L22,40 Z"
          fill="url(#chromeGrad)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="chromeGrad" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor={a} />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor={a} />
          </linearGradient>
        </defs>
        {/* Abdomen lines */}
        <line x1="40" y1="58" x2="60" y2="58" stroke={a} strokeWidth={0.8} />
        <line x1="40" y1="66" x2="60" y2="66" stroke={a} strokeWidth={0.8} />
      </g>
    );
  }

  if (kind === 'snorlax_suit') {
    return (
      <g>
        {teeBody(c)}
        {/* Dark blue tummy patch */}
        <ellipse cx="50" cy="58" rx="22" ry="18" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Round hood collar */}
        <ellipse cx="50" cy="26" rx="16" ry="5" fill={c} stroke={STROKE} strokeWidth={SW} />
      </g>
    );
  }

  if (kind === 'gengar_suit') {
    return (
      <g>
        {teeBody(c)}
        {/* Big red grin across belly */}
        <path d="M28,52 Q50,70 72,52" stroke={a} fill="none" strokeWidth={4} strokeLinecap="round" />
        {/* White teeth */}
        {[-2, -1, 0, 1, 2].map((i) => (
          <polygon key={i} points={`${50 + i * 6 - 2},58 ${50 + i * 6 + 2},58 ${50 + i * 6},66`} fill="#f8fafc" />
        ))}
        {/* Purple spikes on shoulders + top */}
        <polygon points="22,30 18,20 30,32" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="50,28 50,16 56,28" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="78,30 82,20 70,32" fill={c} stroke={STROKE} strokeWidth={1} />
      </g>
    );
  }

  if (kind === 'pikachu_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Red cheek circles on shoulders */}
        <circle cx="34" cy="42" r="5" fill="#dc2626" />
        <circle cx="66" cy="42" r="5" fill="#dc2626" />
        {/* Small black tail lightning stitch on belly */}
        <polygon points="46,58 54,58 52,66 60,66 48,78 52,68 44,68" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'charmander_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream belly patch */}
        <ellipse cx="50" cy="60" rx="18" ry="14" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'squirtle_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream belly with stripes (turtle plastron) */}
        <ellipse cx="50" cy="58" rx="18" ry="14" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <line x1="34" y1="58" x2="66" y2="58" stroke="#a16207" strokeWidth={0.6} />
        <line x1="42" y1="48" x2="42" y2="72" stroke="#a16207" strokeWidth={0.6} />
        <line x1="58" y1="48" x2="58" y2="72" stroke="#a16207" strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'bulbasaur_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Dark green spots on body */}
        <ellipse cx="32" cy="46" rx="5" ry="4" fill={a} />
        <ellipse cx="68" cy="46" rx="5" ry="4" fill={a} />
        <ellipse cx="50" cy="60" rx="5" ry="4" fill={a} />
        <ellipse cx="36" cy="66" rx="4" ry="3" fill={a} />
        <ellipse cx="64" cy="66" rx="4" ry="3" fill={a} />
      </g>
    );
  }
  if (kind === 'eevee_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream fluffy ruff around collar */}
        {[30, 40, 50, 60, 70].map((x) => (
          <circle key={x} cx={x} cy="34" r="5" fill={a} stroke={STROKE} strokeWidth={0.5} />
        ))}
      </g>
    );
  }
  if (kind === 'jigglypuff_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Big round pink belly circle */}
        <circle cx="50" cy="56" r="16" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'psyduck_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream chest fluff */}
        <ellipse cx="50" cy="58" rx="14" ry="16" fill="#fef3c7" stroke={STROKE} strokeWidth={0.8} />
        {/* Orange collar hint */}
        <rect x="34" y="30" width="32" height="4" fill={a} />
      </g>
    );
  }
  if (kind === 'charizard_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream belly + wing hints on shoulders */}
        <ellipse cx="50" cy="58" rx="20" ry="16" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <line x1="34" y1="58" x2="66" y2="58" stroke="#7c2d12" strokeWidth={0.6} />
        <line x1="34" y1="66" x2="66" y2="66" stroke="#7c2d12" strokeWidth={0.6} />
        {/* Small wing nubs */}
        <polygon points="14,36 24,32 22,44" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="86,36 76,32 78,44" fill={c} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'beedrill_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Big black horizontal stripes across the body */}
        <rect x="24" y="42" width="52" height="8" fill={a} />
        <rect x="24" y="58" width="52" height="8" fill={a} />
        {/* Two big drill stingers coming out of the arms */}
        <polygon points="18,40 8,50 22,52" fill="#e5e7eb" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <line x1="12" y1="46" x2="16" y2="50" stroke={a} strokeWidth={0.8} />
        <polygon points="82,40 92,50 78,52" fill="#e5e7eb" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <line x1="84" y1="46" x2="88" y2="50" stroke={a} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'mega_lucario_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Wild yellow chest mane bib */}
        <path d="M36,30 L50,60 L64,30 L60,54 L50,72 L40,54 Z"
          fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Black shoulder spikes (aura) */}
        <polygon points="16,38 24,32 22,50" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="84,38 76,32 78,50" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        {/* Red circle on chest (aura vent) */}
        <circle cx="50" cy="66" r="4" fill="#7f1d1d" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'absol_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Dark navy chest/collar patch */}
        <path d="M34,28 L50,44 L66,28 L66,42 L52,52 L48,52 L34,42 Z"
          fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Shaggy fur tufts on shoulders */}
        <polygon points="18,36 26,32 22,44" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="82,36 74,32 78,44" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Shaggy tufts on sides */}
        <polygon points="24,58 32,54 30,66" fill={c} stroke={STROKE} strokeWidth={0.5} />
        <polygon points="76,58 68,54 70,66" fill={c} stroke={STROKE} strokeWidth={0.5} />
      </g>
    );
  }
  if (kind === 'growlithe_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Cream chest fluff (Growlithe's mane) */}
        <ellipse cx="50" cy="52" rx="24" ry="18" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Ruff outer edge — puffy bumps */}
        {[[28, 44], [34, 34], [50, 30], [66, 34], [72, 44]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={a} stroke={STROKE} strokeWidth={0.5} />
        ))}
        {/* Dark tiger stripes on sleeves */}
        <path d="M24,42 L28,50" stroke="#7c2d12" strokeWidth={2.5} />
        <path d="M76,42 L72,50" stroke="#7c2d12" strokeWidth={2.5} />
      </g>
    );
  }
  if (kind === 'gardevoir_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Red spike/horn emerging from the chest */}
        <polygon points="46,38 50,68 54,38" fill={a} stroke={STROKE} strokeWidth={0.8} strokeLinejoin="round" />
        {/* Sleek collar V */}
        <path d="M40,28 L50,44 L60,28" stroke={a} fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'lugia_top') {
    return (
      <g>
        {teeBody(c)}
        {/* Pale-blue belly patch (Lugia's underside) */}
        <ellipse cx="50" cy="60" rx="22" ry="20" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Long white neck rising from collar */}
        <path d="M44,28 Q50,10 56,28" fill={c} stroke={STROKE} strokeWidth={0.8} />
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
      {kind === 'solmoe' && (
        <>
          {/* White diagonal stripes across the jersey */}
          <line x1="32" y1="40" x2="58" y2="80" stroke="#ffffff" strokeWidth={3} />
          <line x1="42" y1="36" x2="68" y2="76" stroke="#ffffff" strokeWidth={3} />
          <line x1="52" y1="32" x2="72" y2="64" stroke="#ffffff" strokeWidth={3} />
          {/* Yellow chest band */}
          <rect x="34" y="44" width="32" height="3" fill={a} />
          {/* Collar trim */}
          <path d="M44,28 Q50,33 56,28" stroke={a} strokeWidth={2} fill="none" />
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

  if (
    kind === 'wolverine' ||
    kind === 'dr_strange' ||
    kind === 'starlord' ||
    kind === 'antman' ||
    kind === 'war_machine' ||
    kind === 'vision' ||
    kind === 'daredevil' ||
    kind === 'hawkeye' ||
    kind === 'falcon' ||
    kind === 'venom' ||
    kind === 'ghost_rider' ||
    kind === 'silver_surfer'
  ) {
    return (
      <g>
        {heroLegs(c)}
        {kind === 'wolverine' && (
          <>
            <rect x="32" y="32" width="3" height="44" fill={a} />
            <rect x="65" y="32" width="3" height="44" fill={a} />
          </>
        )}
        {kind === 'dr_strange' && (
          <rect x="20" y="78" width="60" height="4" fill={a} />
        )}
        {kind === 'starlord' && (
          <>
            <rect x="30" y="24" width="40" height="6" fill="#7c2d12" />
            <rect x="22" y="42" width="6" height="14" fill={a} />
            <rect x="72" y="42" width="6" height="14" fill={a} />
          </>
        )}
        {kind === 'antman' && (
          <>
            <rect x="32" y="38" width="36" height="3" fill={a} />
            <rect x="32" y="54" width="36" height="3" fill={a} />
            <rect x="32" y="70" width="36" height="3" fill={a} />
          </>
        )}
        {kind === 'war_machine' && (
          <>
            <rect x="28" y="50" width="18" height="10" rx="1" fill={a} stroke={STROKE} strokeWidth={0.6} />
            <rect x="54" y="50" width="18" height="10" rx="1" fill={a} stroke={STROKE} strokeWidth={0.6} />
          </>
        )}
        {kind === 'vision' && (
          <>
            <ellipse cx="38" cy="50" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2.5} />
            <ellipse cx="62" cy="50" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2.5} />
          </>
        )}
        {kind === 'daredevil' && (
          <>
            <rect x="30" y="50" width="16" height="8" fill={a} />
            <rect x="54" y="50" width="16" height="8" fill={a} />
          </>
        )}
        {kind === 'hawkeye' && (
          <>
            <rect x="32" y="32" width="3" height="44" fill={a} />
            <rect x="65" y="32" width="3" height="44" fill={a} />
          </>
        )}
        {kind === 'falcon' && (
          <>
            <rect x="33" y="46" width="10" height="12" rx="1" fill={a} />
            <rect x="57" y="46" width="10" height="12" rx="1" fill={a} />
          </>
        )}
        {kind === 'venom' && (
          <>
            <line x1="38" y1="32" x2="40" y2="78" stroke={a} strokeWidth={1.5} />
            <line x1="62" y1="32" x2="60" y2="78" stroke={a} strokeWidth={1.5} />
          </>
        )}
        {kind === 'ghost_rider' && (
          <>
            <ellipse cx="38" cy="48" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2} />
            <ellipse cx="62" cy="48" rx="9" ry="3" fill="none" stroke={a} strokeWidth={2} />
          </>
        )}
        {kind === 'silver_surfer' && (
          <>
            <rect x="30" y="74" width="40" height="3" fill={a} />
          </>
        )}
      </g>
    );
  }

  if (kind === 'lugia_legs') {
    return (
      <g>
        {heroLegs(c)}
        {/* Pale blue belly overlap on upper thighs */}
        <ellipse cx="50" cy="40" rx="22" ry="12" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Navy claws at the toes */}
        <polygon points="30,76 34,84 38,76" fill={item.accent === '#bfdbfe' ? '#1e3a8a' : a} />
        <polygon points="42,76 46,84 50,76" fill={item.accent === '#bfdbfe' ? '#1e3a8a' : a} />
        <polygon points="52,76 56,84 60,76" fill={item.accent === '#bfdbfe' ? '#1e3a8a' : a} />
        <polygon points="64,76 68,84 72,76" fill={item.accent === '#bfdbfe' ? '#1e3a8a' : a} />
      </g>
    );
  }
  if (kind === 'beedrill_legs') {
    return (
      <g>
        {heroLegs(c)}
        {/* Black stripes on legs */}
        <rect x="26" y="38" width="20" height="6" fill={a} />
        <rect x="26" y="54" width="20" height="6" fill={a} />
        <rect x="54" y="38" width="20" height="6" fill={a} />
        <rect x="54" y="54" width="20" height="6" fill={a} />
        {/* Yellow tail stinger cone at bottom center */}
        <polygon points="42,72 58,72 50,90" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <line x1="44" y1="78" x2="56" y2="78" stroke={a} strokeWidth={0.8} />
        <line x1="46" y1="82" x2="54" y2="82" stroke={a} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'mega_lucario_legs') {
    return (
      <g>
        {heroLegs(c)}
        {/* Yellow "cuffs" at knees */}
        <rect x="26" y="48" width="20" height="4" fill={a} />
        <rect x="54" y="48" width="20" height="4" fill={a} />
        {/* Red thigh spike accents */}
        <polygon points="26,36 32,32 30,42" fill="#7f1d1d" stroke={STROKE} strokeWidth={0.5} />
        <polygon points="74,36 68,32 70,42" fill="#7f1d1d" stroke={STROKE} strokeWidth={0.5} />
        {/* Wild yellow tuft at hip */}
        <polygon points="30,32 42,30 34,42" fill={a} stroke={STROKE} strokeWidth={0.5} />
        <polygon points="70,32 58,30 66,42" fill={a} stroke={STROKE} strokeWidth={0.5} />
      </g>
    );
  }
  if (kind === 'absol_legs') {
    return (
      <g>
        {heroLegs(c)}
        {/* Dark navy paw sections at bottom */}
        <rect x="26" y="60" width="20" height="20" rx="3" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <rect x="54" y="60" width="20" height="20" rx="3" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Shaggy fur tufts along thighs */}
        <polygon points="22,42 28,38 26,50" fill={c} stroke={STROKE} strokeWidth={0.5} />
        <polygon points="22,54 30,50 26,62" fill={c} stroke={STROKE} strokeWidth={0.5} />
        <polygon points="78,42 72,38 74,50" fill={c} stroke={STROKE} strokeWidth={0.5} />
        <polygon points="78,54 70,50 74,62" fill={c} stroke={STROKE} strokeWidth={0.5} />
        {/* Sharp claws */}
        <polygon points="28,78 32,86 36,78" fill="#0a0a0a" />
        <polygon points="36,78 40,86 44,78" fill="#0a0a0a" />
        <polygon points="56,78 60,86 64,78" fill="#0a0a0a" />
        <polygon points="64,78 68,86 72,78" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'growlithe_legs') {
    return (
      <g>
        {heroLegs(c)}
        {/* Dark tiger stripes on the legs */}
        {[36, 46, 56, 66].map((y) => (
          <g key={y}>
            <path d={`M28,${y} Q38,${y - 2} 40,${y + 4}`} stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
            <path d={`M60,${y + 4} Q62,${y - 2} 72,${y}`} stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ))}
        {/* Cream fluffy cuffs at ankles */}
        {[[30, 78], [40, 78], [60, 78], [70, 78]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#fef3c7" stroke={STROKE} strokeWidth={0.5} />
        ))}
      </g>
    );
  }
  if (kind === 'gardevoir_legs') {
    // Flowing dress-like bottom, not really legs
    return (
      <g>
        {/* Wide flowing white gown flaring outward */}
        <path d="M28,22 L72,22 L88,80 L12,80 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Red vertical spike/pattern in center */}
        <polygon points="46,22 50,60 54,22" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Waistband */}
        <rect x="28" y="22" width="44" height="4" fill={a} />
      </g>
    );
  }

  // Pokemon bottoms — coloured legs with species-specific trim
  if (
    kind === 'pikachu_legs' ||
    kind === 'charmander_legs' ||
    kind === 'squirtle_legs' ||
    kind === 'bulbasaur_legs' ||
    kind === 'eevee_legs' ||
    kind === 'jigglypuff_legs' ||
    kind === 'psyduck_legs' ||
    kind === 'snorlax_legs' ||
    kind === 'gengar_legs' ||
    kind === 'charizard_legs'
  ) {
    return (
      <g>
        {heroLegs(c)}
        {kind === 'pikachu_legs' && (
          <>
            <polyline points="36,32 42,44 38,44 44,58 40,58 46,72" stroke={a} fill="none" strokeWidth={1.5} />
            <polyline points="64,32 58,44 62,44 56,58 60,58 54,72" stroke={a} fill="none" strokeWidth={1.5} />
          </>
        )}
        {kind === 'charmander_legs' && (
          <ellipse cx="50" cy="52" rx="16" ry="14" fill={a} stroke={STROKE} strokeWidth={0.6} />
        )}
        {kind === 'squirtle_legs' && (
          <>
            <ellipse cx="50" cy="50" rx="16" ry="14" fill={a} stroke={STROKE} strokeWidth={0.6} />
            <line x1="50" y1="36" x2="50" y2="64" stroke="#a16207" strokeWidth={0.6} />
          </>
        )}
        {kind === 'bulbasaur_legs' && (
          <>
            <ellipse cx="36" cy="50" rx="4" ry="3" fill={a} />
            <ellipse cx="64" cy="50" rx="4" ry="3" fill={a} />
            <ellipse cx="42" cy="64" rx="3" ry="3" fill={a} />
            <ellipse cx="58" cy="64" rx="3" ry="3" fill={a} />
          </>
        )}
        {kind === 'eevee_legs' && (
          <>
            <rect x="30" y="70" width="16" height="8" rx="1" fill={a} stroke={STROKE} strokeWidth={0.5} />
            <rect x="54" y="70" width="16" height="8" rx="1" fill={a} stroke={STROKE} strokeWidth={0.5} />
          </>
        )}
        {kind === 'jigglypuff_legs' && (
          <ellipse cx="50" cy="52" rx="18" ry="14" fill={a} stroke={STROKE} strokeWidth={0.5} opacity="0.6" />
        )}
        {kind === 'psyduck_legs' && (
          <>
            <polygon points="30,72 46,72 42,84 34,84" fill={a} stroke={STROKE} strokeWidth={0.6} />
            <polygon points="54,72 70,72 66,84 58,84" fill={a} stroke={STROKE} strokeWidth={0.6} />
          </>
        )}
        {kind === 'snorlax_legs' && (
          <>
            <rect x="30" y="42" width="18" height="4" fill={a} />
            <rect x="52" y="42" width="18" height="4" fill={a} />
            <rect x="30" y="60" width="18" height="4" fill={a} />
            <rect x="52" y="60" width="18" height="4" fill={a} />
          </>
        )}
        {kind === 'gengar_legs' && (
          <>
            <polygon points="38,36 40,72 36,72" fill={a} opacity="0.6" />
            <polygon points="62,36 60,72 64,72" fill={a} opacity="0.6" />
          </>
        )}
        {kind === 'charizard_legs' && (
          <>
            <ellipse cx="50" cy="50" rx="18" ry="14" fill={a} stroke={STROKE} strokeWidth={0.6} />
            <line x1="50" y1="36" x2="50" y2="64" stroke="#7c2d12" strokeWidth={0.6} />
            <polygon points="30,74 34,82 36,74" fill={a} />
            <polygon points="42,74 46,82 48,74" fill={a} />
            <polygon points="52,74 56,82 58,74" fill={a} />
            <polygon points="64,74 68,82 70,74" fill={a} />
          </>
        )}
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

  if (kind === 'solmoe') {
    const by = 58;
    return (
      <g>
        {/* Bright yellow soccer shorts */}
        <path
          d={`M32,24 L68,24 L70,${by} L54,${by} L50,40 L46,${by} L30,${by} Z`}
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Dark green waistband */}
        <rect x="30" y="24" width="40" height="5" fill={a} />
        {/* Side stripe */}
        <line x1="34" y1="30" x2="38" y2="56" stroke={a} strokeWidth={2} />
        <line x1="66" y1="30" x2="62" y2="56" stroke={a} strokeWidth={2} />
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

  if (kind === 'wolverine') {
    return (
      <g>
        <rect x="22" y="28" width="56" height="54" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Tall black pointy ears */}
        <polygon points="22,28 18,4 38,28" fill={a} stroke={STROKE} strokeWidth={1} />
        <polygon points="78,28 82,4 62,28" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Black eye mask band */}
        <rect x="20" y="42" width="60" height="14" fill={a} />
        {/* White slit eyes */}
        <polygon points="28,46 44,42 40,52 26,50" fill="#f8fafc" />
        <polygon points="72,46 56,42 60,52 74,50" fill="#f8fafc" />
        {/* Skin lower face */}
        <rect x="34" y="64" width="32" height="18" fill="#ffe1c6" />
      </g>
    );
  }
  if (kind === 'starlord') {
    return (
      <g>
        <rect x="22" y="22" width="56" height="60" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Glowing red horizontal eye slits */}
        <rect x="28" y="44" width="18" height="6" fill="#fee2e2" stroke="#dc2626" strokeWidth={0.8} />
        <rect x="54" y="44" width="18" height="6" fill="#fee2e2" stroke="#dc2626" strokeWidth={0.8} />
        {/* Gold mouth plate */}
        <rect x="32" y="60" width="36" height="18" fill={a} stroke={STROKE} strokeWidth={1} />
        {[64, 68, 72, 76].map((y) => (
          <line key={y} x1="32" y1={y} x2="68" y2={y} stroke="#1f2937" strokeWidth={0.8} />
        ))}
      </g>
    );
  }
  if (kind === 'antman') {
    return (
      <g>
        <rect x="22" y="22" width="56" height="60" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* 2 antennae sticking up */}
        <path d="M36,22 Q30,8 26,4" stroke={a} fill="none" strokeWidth={2} />
        <path d="M64,22 Q70,8 74,4" stroke={a} fill="none" strokeWidth={2} />
        <circle cx="26" cy="4" r="3" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="74" cy="4" r="3" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Black lens eyes */}
        <rect x="28" y="42" width="18" height="14" rx="2" fill={a} />
        <rect x="54" y="42" width="18" height="14" rx="2" fill={a} />
        {/* Mouth slit */}
        <rect x="34" y="68" width="32" height="4" fill={a} />
      </g>
    );
  }
  if (kind === 'war_machine') {
    return (
      <g>
        {/* Gray faceplate */}
        <path d="M28,18 L72,18 L78,54 L70,76 L60,86 L40,86 L30,76 L22,54 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Top crest */}
        <rect x="46" y="6" width="8" height="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Red eye slits */}
        <rect x="30" y="42" width="14" height="5" fill="#fee2e2" stroke={a} strokeWidth={0.8} />
        <rect x="56" y="42" width="14" height="5" fill="#fee2e2" stroke={a} strokeWidth={0.8} />
        {/* Mouth vents */}
        {[40, 45, 50, 55, 60].map((x) => (
          <rect key={x} x={x} y="62" width="2" height="12" fill="#1e293b" />
        ))}
      </g>
    );
  }
  if (kind === 'vision') {
    return (
      <g>
        <rect x="22" y="18" width="56" height="64" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Yellow Mind Stone on forehead */}
        <polygon points="50,22 58,30 50,38 42,30" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Yellow glowing eyes */}
        <rect x="30" y="46" width="14" height="6" fill="#fef3c7" />
        <rect x="56" y="46" width="14" height="6" fill="#fef3c7" />
        {/* Mouth line */}
        <line x1="40" y1="72" x2="60" y2="72" stroke="#7f1d1d" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'daredevil') {
    return (
      <g>
        <rect x="22" y="28" width="56" height="54" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Two short horns */}
        <polygon points="36,28 32,12 42,28" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="64,28 68,12 58,28" fill={c} stroke={STROKE} strokeWidth={1} />
        {/* Dark eye mask area */}
        <rect x="20" y="42" width="60" height="14" fill={a} />
        {/* Red glowing eye slits */}
        <rect x="30" y="46" width="14" height="6" fill="#fee2e2" stroke={c} strokeWidth={0.6} />
        <rect x="56" y="46" width="14" height="6" fill="#fee2e2" stroke={c} strokeWidth={0.6} />
        {/* Frown */}
        <line x1="40" y1="72" x2="60" y2="72" stroke={a} strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'falcon') {
    return (
      <g>
        <rect x="22" y="20" width="56" height="62" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Large dark goggles */}
        <rect x="20" y="40" width="60" height="16" rx="3" fill="#1f2937" stroke={STROKE} strokeWidth={1} />
        {/* Gold accent line */}
        <rect x="22" y="38" width="56" height="3" fill={a} />
        {/* Reflective lenses */}
        <rect x="28" y="44" width="14" height="8" fill="#f8fafc" />
        <rect x="58" y="44" width="14" height="8" fill="#f8fafc" />
        {/* Skin lower face */}
        <rect x="34" y="64" width="32" height="14" fill="#ffe1c6" />
      </g>
    );
  }
  if (kind === 'venom') {
    return (
      <g>
        <rect x="22" y="20" width="56" height="62" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Big tilted slit eyes */}
        <path d="M26,38 L46,32 L42,50 L26,46 Z" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <path d="M74,38 L54,32 L58,50 L74,46 Z" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* White toothy grin */}
        <rect x="22" y="58" width="56" height="18" fill={a} />
        {[28, 36, 44, 50, 56, 64, 72].map((x) => (
          <rect key={x} x={x} y="58" width="2" height="18" fill={c} />
        ))}
        {/* Red tongue */}
        <rect x="42" y="74" width="16" height="6" fill="#dc2626" />
      </g>
    );
  }
  if (kind === 'ghost_rider') {
    return (
      <g>
        {/* White skull */}
        <path d="M24,32 Q24,16 50,14 Q76,16 76,32 L74,66 L60,80 L40,80 L26,66 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Hollow black eye sockets */}
        <ellipse cx="38" cy="44" rx="8" ry="6" fill="#0a0a0a" />
        <ellipse cx="62" cy="44" rx="8" ry="6" fill="#0a0a0a" />
        {/* Toothy grin */}
        <rect x="30" y="62" width="40" height="10" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {[34, 40, 46, 50, 54, 60, 66].map((x) => (
          <line key={x} x1={x} y1="62" x2={x} y2="72" stroke="#0a0a0a" strokeWidth={0.8} />
        ))}
        {/* Orange flames around top */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((t, i) => {
          const x = 50 + t * 60;
          return <polygon key={i} points={`${x - 6},14 ${x + 6},14 ${x},${i % 2 === 0 ? -4 : 0}`} fill={a} />;
        })}
      </g>
    );
  }

  if (kind === 'charmander_face') {
    return (
      <g>
        <rect x="22" y="20" width="56" height="60" rx="10" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cream muzzle */}
        <ellipse cx="50" cy="60" rx="18" ry="8" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Big black eyes with highlights */}
        <ellipse cx="36" cy="40" rx="7" ry="9" fill="#0a0a0a" />
        <ellipse cx="64" cy="40" rx="7" ry="9" fill="#0a0a0a" />
        <circle cx="38" cy="36" r="2.5" fill="#f8fafc" />
        <circle cx="66" cy="36" r="2.5" fill="#f8fafc" />
        {/* Grin */}
        <path d="M38,62 Q50,72 62,62" stroke="#0a0a0a" fill="none" strokeWidth={2} />
        <polygon points="42,64 44,72 46,64" fill="#f8fafc" />
        <polygon points="54,64 56,72 58,64" fill="#f8fafc" />
      </g>
    );
  }
  if (kind === 'squirtle_face') {
    return (
      <g>
        <circle cx="50" cy="52" r="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cheek circles */}
        <ellipse cx="30" cy="60" rx="5" ry="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="70" cy="60" rx="5" ry="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Big shiny eyes */}
        <ellipse cx="38" cy="44" rx="7" ry="9" fill="#0a0a0a" />
        <ellipse cx="62" cy="44" rx="7" ry="9" fill="#0a0a0a" />
        <circle cx="40" cy="40" r="2.5" fill="#f8fafc" />
        <circle cx="64" cy="40" r="2.5" fill="#f8fafc" />
        {/* Cream beak */}
        <rect x="44" y="60" width="12" height="6" rx="1" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Smile */}
        <path d="M40,68 Q50,76 60,68" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'bulbasaur_face') {
    return (
      <g>
        {/* Green bulb on top */}
        <ellipse cx="50" cy="18" rx="14" ry="10" fill="#4d7c0f" stroke={STROKE} strokeWidth={SW} />
        <polygon points="42,10 46,0 44,12" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="50,6 52,-4 48,4" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="58,10 62,0 56,10" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.6} />
        {/* Green head */}
        <circle cx="50" cy="54" r="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark green spots */}
        <ellipse cx="26" cy="50" rx="5" ry="4" fill={a} />
        <ellipse cx="74" cy="50" rx="5" ry="4" fill={a} />
        {/* Red eyes with black pupils */}
        <ellipse cx="38" cy="48" rx="7" ry="9" fill="#dc2626" stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="62" cy="48" rx="7" ry="9" fill="#dc2626" stroke={STROKE} strokeWidth={0.6} />
        <circle cx="38" cy="50" r="3" fill="#0a0a0a" />
        <circle cx="62" cy="50" r="3" fill="#0a0a0a" />
        {/* Wide grin */}
        <path d="M32,66 Q50,80 68,66" stroke="#0a0a0a" fill="none" strokeWidth={2.5} />
      </g>
    );
  }
  if (kind === 'eevee_face') {
    return (
      <g>
        {/* Tall pointy ears */}
        <polygon points="22,44 12,0 34,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="19,32 14,6 26,28" fill={a} />
        <polygon points="78,44 88,0 66,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="81,32 86,6 74,28" fill={a} />
        {/* Brown head */}
        <circle cx="50" cy="52" r="27" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Fluffy cream ruff around neck */}
        {[20, 32, 44, 56, 68, 80].map((x) => (
          <circle key={x} cx={x} cy="82" r="6" fill={a} stroke={STROKE} strokeWidth={0.5} />
        ))}
        {/* Big shiny eyes */}
        <ellipse cx="38" cy="48" rx="7" ry="9" fill="#0a0a0a" />
        <ellipse cx="62" cy="48" rx="7" ry="9" fill="#0a0a0a" />
        <circle cx="40" cy="44" r="2.5" fill="#f8fafc" />
        <circle cx="64" cy="44" r="2.5" fill="#f8fafc" />
        {/* Small triangular nose */}
        <polygon points="46,60 54,60 50,66" fill="#0a0a0a" />
        {/* Small smile */}
        <path d="M42,72 Q50,78 58,72" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
      </g>
    );
  }

  if (kind === 'pikachu_face') {
    return (
      <g>
        {/* Tall black-tipped ears */}
        <polygon points="26,44 12,4 34,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="15,16 12,4 22,20" fill="#0a0a0a" />
        <polygon points="74,44 88,4 66,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="85,16 88,4 78,20" fill="#0a0a0a" />
        {/* Round yellow head */}
        <ellipse cx="50" cy="54" rx="28" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Red cheek circles */}
        <circle cx="26" cy="60" r="6" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="74" cy="60" r="6" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Big shiny eyes */}
        <ellipse cx="38" cy="48" rx="4" ry="6" fill="#0a0a0a" />
        <ellipse cx="62" cy="48" rx="4" ry="6" fill="#0a0a0a" />
        <circle cx="39" cy="45" r="1.5" fill="#f8fafc" />
        <circle cx="63" cy="45" r="1.5" fill="#f8fafc" />
        {/* Tiny mouth */}
        <path d="M44,64 Q50,70 56,64" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'jigglypuff_face') {
    return (
      <g>
        {/* Pink round head */}
        <circle cx="50" cy="52" r="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Signature curl on top */}
        <ellipse cx="34" cy="20" rx="8" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Tiny pointy ears */}
        <polygon points="34,32 30,16 42,32" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="66,32 70,16 58,32" fill={c} stroke={STROKE} strokeWidth={1} />
        {/* Big blue eyes with white highlights */}
        <ellipse cx="38" cy="50" rx="6" ry="9" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="62" cy="50" rx="6" ry="9" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="40" cy="46" r="2.5" fill="#f8fafc" />
        <circle cx="64" cy="46" r="2.5" fill="#f8fafc" />
        {/* Small smile */}
        <path d="M42,66 Q50,72 58,66" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'psyduck_face') {
    return (
      <g>
        {/* 3 black feather tufts on top */}
        <polygon points="42,20 40,4 44,20" fill="#0a0a0a" />
        <polygon points="50,18 50,2 52,18" fill="#0a0a0a" />
        <polygon points="58,20 60,4 56,20" fill="#0a0a0a" />
        {/* Yellow head */}
        <ellipse cx="50" cy="54" rx="30" ry="28" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Orange flat bill */}
        <rect x="30" y="60" width="40" height="14" rx="4" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <line x1="50" y1="60" x2="50" y2="74" stroke="#c2410c" strokeWidth={0.8} />
        {/* Vacant white eyes with tiny black pupils */}
        <circle cx="38" cy="46" r="7" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
        <circle cx="62" cy="46" r="7" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
        <circle cx="38" cy="46" r="2" fill="#0a0a0a" />
        <circle cx="62" cy="46" r="2" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'snorlax_face') {
    return (
      <g>
        {/* Rounded nub ears */}
        <circle cx="22" cy="34" r="7" fill={c} stroke={STROKE} strokeWidth={SW} />
        <circle cx="78" cy="34" r="7" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cream/tan head */}
        <ellipse cx="50" cy="52" rx="30" ry="28" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Closed sleepy eyes (arcs) */}
        <path d="M32,46 Q38,52 44,46" stroke={a} fill="none" strokeWidth={3} strokeLinecap="round" />
        <path d="M56,46 Q62,52 68,46" stroke={a} fill="none" strokeWidth={3} strokeLinecap="round" />
        {/* Wide open sleeping mouth */}
        <ellipse cx="50" cy="66" rx="16" ry="7" fill={a} stroke={STROKE} strokeWidth={0.8} />
        <path d="M40,66 Q50,72 60,66" stroke="#0a0a0a" fill="none" strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'gengar_face') {
    return (
      <g>
        {/* Two purple spike ears on top */}
        <polygon points="30,32 22,14 40,28" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="70,32 78,14 60,28" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Purple head */}
        <circle cx="50" cy="54" r="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Red glowing eyes */}
        <circle cx="38" cy="46" r="5" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="62" cy="46" r="5" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="38" cy="46" r="2" fill="#0a0a0a" />
        <circle cx="62" cy="46" r="2" fill="#0a0a0a" />
        {/* Huge red toothy grin */}
        <path d="M28,62 Q50,80 72,62" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {[32, 40, 48, 56, 64, 72].map((x, i) => (
          <polygon
            key={x}
            points={`${x - 2},${62 + Math.abs(i - 2.5) * 1},${x + 2},${62 + Math.abs(i - 2.5) * 1},${x},${72 - Math.abs(i - 2.5) * 1}`}
            fill="#f8fafc"
            stroke={STROKE}
            strokeWidth={0.4}
          />
        ))}
      </g>
    );
  }
  if (kind === 'mew_face') {
    return (
      <g>
        {/* Pink round head */}
        <circle cx="50" cy="52" r="28" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Tiny pointy ears */}
        <polygon points="36,32 30,20 44,32" fill={c} stroke={STROKE} strokeWidth={0.8} />
        <polygon points="64,32 70,20 56,32" fill={c} stroke={STROKE} strokeWidth={0.8} />
        {/* Big cyan eyes with sparkle */}
        <ellipse cx="40" cy="46" rx="5" ry="7" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="60" cy="46" rx="5" ry="7" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="42" cy="42" r="2" fill="#f8fafc" />
        <circle cx="62" cy="42" r="2" fill="#f8fafc" />
        {/* Tiny red nose */}
        <circle cx="50" cy="60" r="2" fill="#dc2626" />
        {/* Small smile */}
        <path d="M44,68 Q50,72 56,68" stroke="#7f1d1d" fill="none" strokeWidth={1.4} />
      </g>
    );
  }
  if (kind === 'charizard_face') {
    return (
      <g>
        {/* Big cream horns pointing back */}
        <polygon points="30,28 20,4 40,26" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="70,28 80,4 60,26" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Boxy orange dragon head */}
        <rect x="22" y="22" width="56" height="58" rx="8" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cream muzzle at bottom */}
        <ellipse cx="50" cy="66" rx="22" ry="9" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {/* Dark green/black eyes */}
        <ellipse cx="36" cy="44" rx="4" ry="6" fill="#0f172a" />
        <ellipse cx="64" cy="44" rx="4" ry="6" fill="#0f172a" />
        <circle cx="37" cy="42" r="1.2" fill="#f8fafc" />
        <circle cx="65" cy="42" r="1.2" fill="#f8fafc" />
        {/* Nostrils */}
        <circle cx="45" cy="62" r="1.5" fill="#0f172a" />
        <circle cx="55" cy="62" r="1.5" fill="#0f172a" />
        {/* Fangs peeking */}
        <polygon points="40,70 44,70 42,78" fill={a} stroke={STROKE} strokeWidth={0.4} />
        <polygon points="56,70 60,70 58,78" fill={a} stroke={STROKE} strokeWidth={0.4} />
      </g>
    );
  }
  if (kind === 'beedrill_face') {
    // Beedrill — yellow bee head + black stripe crown + big red compound
    // eyes + two thin antennae + drill-shaped mouth stinger.
    return (
      <g>
        {/* Yellow round head */}
        <ellipse cx="50" cy="52" rx="26" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Black stripe crown across top */}
        <rect x="24" y="30" width="52" height="8" fill={a} />
        <rect x="24" y="60" width="52" height="6" fill={a} />
        {/* Big red compound eyes */}
        <ellipse cx="34" cy="50" rx="8" ry="10" fill="#dc2626" stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="66" cy="50" rx="8" ry="10" fill="#dc2626" stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="36" cy="46" rx="2.5" ry="3" fill="#f8fafc" />
        <ellipse cx="68" cy="46" rx="2.5" ry="3" fill="#f8fafc" />
        {/* Two thin antennae */}
        <path d="M40,28 Q36,10 30,4" stroke={a} fill="none" strokeWidth={2} strokeLinecap="round" />
        <path d="M60,28 Q64,10 70,4" stroke={a} fill="none" strokeWidth={2} strokeLinecap="round" />
        <circle cx="30" cy="4" r="2" fill={a} />
        <circle cx="70" cy="4" r="2" fill={a} />
        {/* Mouth stinger (small drill) */}
        <polygon points="46,74 54,74 50,90" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <line x1="47" y1="78" x2="53" y2="78" stroke="#f8fafc" strokeWidth={0.6} />
        <line x1="48" y1="82" x2="52" y2="82" stroke="#f8fafc" strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'mega_lucario_face') {
    // Mega Lucario — blue jackal face + wild yellow mane + red eyes +
    // black ear-appendages sticking back.
    return (
      <g>
        {/* Yellow wild mane behind head (spiky) */}
        {[[10, 40], [16, 20], [30, 8], [50, 4], [70, 8], [84, 20], [90, 40]].map(([x, y], i) => (
          <polygon key={i} points={`${x - 6},${y + 6} ${x + 6},${y + 6} ${x},${y - 6}`}
            fill={a} stroke={STROKE} strokeWidth={0.6} />
        ))}
        {/* Blue jackal head */}
        <ellipse cx="50" cy="50" rx="26" ry="26" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Yellow chest mane bib */}
        <path d="M32,66 L50,80 L68,66 L64,76 L50,88 L36,76 Z"
          fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Long black ear-appendages sticking back */}
        <path d="M22,30 Q10,10 4,20 L14,30 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        <path d="M78,30 Q90,10 96,20 L86,30 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        {/* Red eyes */}
        <ellipse cx="40" cy="48" rx="3" ry="4" fill="#dc2626" />
        <ellipse cx="60" cy="48" rx="3" ry="4" fill="#dc2626" />
        <circle cx="41" cy="46" r="1" fill="#f8fafc" />
        <circle cx="61" cy="46" r="1" fill="#f8fafc" />
        {/* Black snout */}
        <ellipse cx="50" cy="58" rx="7" ry="5" fill="#0f172a" />
        <circle cx="50" cy="56" r="1.5" fill="#f8fafc" />
        {/* Black spikes on cheeks (aura sensors) */}
        <circle cx="26" cy="54" r="2" fill="#0f172a" />
        <circle cx="74" cy="54" r="2" fill="#0f172a" />
      </g>
    );
  }
  if (kind === 'absol_face') {
    // Absol — pale white shaggy face + dark navy muzzle/mask + huge asymmetric
    // sickle horn on the left + red eye.
    return (
      <g>
        {/* Big curved sickle horn on the left side */}
        <path d="M22,50 Q6,40 4,20 L14,26 L18,40 L28,50 Z"
          fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Fluffy pale head silhouette (shaggy) */}
        <path d="M20,54 L30,30 L44,20 L58,20 L74,32 L82,54 L74,72 L60,80 L40,80 L28,72 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Fluffy tufts sticking up on right */}
        <polygon points="66,22 74,10 72,26" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="78,30 88,26 82,40" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Dark navy face mask across eyes and muzzle */}
        <path d="M28,50 L50,44 L74,50 L70,66 L54,72 L36,66 Z"
          fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Pointed dark muzzle jutting forward */}
        <path d="M42,64 L28,68 L34,76 L48,72 Z" fill={a} stroke={STROKE} strokeWidth={0.5} />
        {/* Red eyes */}
        <ellipse cx="44" cy="54" rx="3" ry="4" fill="#dc2626" />
        <ellipse cx="60" cy="54" rx="3" ry="4" fill="#dc2626" />
        <circle cx="45" cy="52" r="1" fill="#f8fafc" />
        <circle cx="61" cy="52" r="1" fill="#f8fafc" />
        {/* Small nose dot */}
        <circle cx="34" cy="70" r="1.5" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'growlithe_face') {
    // Growlithe — orange puppy face + big cream mane + dark tiger stripes.
    return (
      <g>
        {/* Cream fluffy mane behind head */}
        {[[16, 40], [24, 22], [50, 12], [76, 22], [84, 40]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="10" fill={a} stroke={STROKE} strokeWidth={SW} />
        ))}
        {/* Orange head */}
        <ellipse cx="50" cy="54" rx="26" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark tiger stripes on head */}
        <path d="M32,42 Q36,50 32,58" stroke="#7c2d12" fill="none" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M68,42 Q64,50 68,58" stroke="#7c2d12" fill="none" strokeWidth={2.5} strokeLinecap="round" />
        {/* Cream muzzle */}
        <ellipse cx="50" cy="66" rx="14" ry="8" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Dark round eyes */}
        <ellipse cx="40" cy="50" rx="3.5" ry="4" fill="#0a0a0a" />
        <ellipse cx="60" cy="50" rx="3.5" ry="4" fill="#0a0a0a" />
        <circle cx="41" cy="48" r="1.2" fill="#f8fafc" />
        <circle cx="61" cy="48" r="1.2" fill="#f8fafc" />
        {/* Nose */}
        <ellipse cx="50" cy="62" rx="2.5" ry="2" fill="#0a0a0a" />
        {/* Small open mouth */}
        <path d="M42,72 Q50,78 58,72" stroke="#7c2d12" fill="none" strokeWidth={1.6} />
      </g>
    );
  }
  if (kind === 'gardevoir_face') {
    // Gardevoir — elegant psychic: pale white face + green helmet-hair
    // covering the top with a forward-pointing "bang" over one eye + red
    // horn spike on the forehead + red eyes.
    return (
      <g>
        {/* Green helmet-hair (rear) */}
        <path d="M18,30 Q18,10 50,8 Q82,10 82,30 L78,42 L68,36 L50,42 L32,36 L22,42 Z"
          fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Pale face */}
        <ellipse cx="50" cy="52" rx="22" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Forward-pointing green bang over one eye */}
        <path d="M28,32 L34,50 L42,44 Z" fill={a} stroke={STROKE} strokeWidth={0.8} strokeLinejoin="round" />
        {/* Red horn spike on forehead (down-pointing) */}
        <polygon points="46,34 50,52 54,34" fill="#dc2626" stroke={STROKE} strokeWidth={0.6} />
        {/* Red eyes with white shine */}
        <ellipse cx="42" cy="56" rx="3.5" ry="5" fill="#dc2626" />
        <ellipse cx="58" cy="56" rx="3.5" ry="5" fill="#dc2626" />
        <circle cx="43" cy="54" r="1.2" fill="#f8fafc" />
        <circle cx="59" cy="54" r="1.2" fill="#f8fafc" />
        {/* Tiny pink smile */}
        <path d="M44,70 Q50,74 56,70" stroke="#be185d" fill="none" strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'lugia_face') {
    // Lugia — white head, pointed crest on top, navy-blue eye "mask"
    // wrapping around the eyes, small open beak-mouth.
    return (
      <g>
        {/* Pointed back-crest */}
        <polygon points="70,14 82,4 74,24" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Elongated white head */}
        <path d="M22,52 Q22,26 50,22 Q78,26 80,50 Q74,74 50,80 Q26,74 22,52 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Beak-jaw pointing right (Lugia has a pointed dinosaur snout) */}
        <path d="M74,54 L92,52 L84,64 L76,60 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Open mouth interior */}
        <path d="M78,58 L88,56 L82,62 Z" fill="#7f1d1d" />
        {/* Navy eye mask — jagged spike across both eyes */}
        <path d="M30,42 L44,38 L54,44 L64,38 L72,46 L64,50 L54,46 L44,50 Z"
          fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Small white glowing eye slit */}
        <ellipse cx="48" cy="44" rx="3" ry="2" fill="#f8fafc" />
        <ellipse cx="62" cy="44" rx="3" ry="2" fill="#f8fafc" />
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

  if (kind === 'wolverine_claws') {
    return (
      <g>
        <rect x="28" y="20" width="44" height="60" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Silver claws sticking out either side */}
        {[-1, 1].map((sx) =>
          [-1, 0, 1].map((j) => (
            <polygon
              key={`${sx}-${j}`}
              points={sx < 0 ? `28,${36 + j * 14} 6,${30 + j * 14} 28,${42 + j * 14}` : `72,${36 + j * 14} 94,${30 + j * 14} 72,${42 + j * 14}`}
              fill={a}
              stroke={STROKE}
              strokeWidth={0.6}
            />
          ))
        )}
      </g>
    );
  }
  if (kind === 'dr_strange_cape') {
    return (
      <g>
        {/* Tall collar wings flaring up */}
        <polygon points="22,18 32,2 36,18" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="78,18 68,2 64,18" fill={c} stroke={STROKE} strokeWidth={1} />
        {/* Main cloak */}
        <path d="M28,18 L72,18 L84,82 L16,82 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Gold collar trim */}
        <path d="M28,18 Q50,30 72,18" stroke={a} fill="none" strokeWidth={4} />
        {/* Gold patterns on the cape */}
        <line x1="34" y1="40" x2="40" y2="76" stroke={a} strokeWidth={1} />
        <line x1="66" y1="40" x2="60" y2="76" stroke={a} strokeWidth={1} />
      </g>
    );
  }
  if (kind === 'starlord_pack') {
    return (
      <g>
        {/* Twin rocket pods */}
        <rect x="26" y="20" width="18" height="48" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="56" y="20" width="18" height="48" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Gold rings */}
        <ellipse cx="35" cy="68" rx="9" ry="3" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="65" cy="68" rx="9" ry="3" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Thruster glow */}
        <polygon points="28,68 35,90 42,68" fill="#fef3c7" />
        <polygon points="58,68 65,90 72,68" fill="#fef3c7" />
      </g>
    );
  }
  if (kind === 'antman_pack') {
    return (
      <g>
        <rect x="24" y="22" width="52" height="56" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
        <rect x="32" y="46" width="36" height="10" fill={a} />
        <text x="50" y="38" textAnchor="middle" fontSize="14" fontWeight="900" fill={a}>A</text>
      </g>
    );
  }
  if (kind === 'war_machine_back') {
    return (
      <g>
        <rect x="22" y="22" width="56" height="56" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Gatling barrel */}
        <rect x="62" y="14" width="32" height="10" rx="2" fill={a} stroke={STROKE} strokeWidth={1} transform="rotate(-15 78 19)" />
        {/* Ammo box */}
        <rect x="58" y="28" width="14" height="14" fill={a} stroke={STROKE} strokeWidth={1} />
        {/* Missile on left shoulder */}
        <polygon points="8,30 24,26 8,38" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'vision_cape') {
    return (
      <g>
        {/* Yellow cape */}
        <path d="M28,20 L72,20 L82,82 L18,82 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Red trim along top */}
        <path d="M28,20 Q50,30 72,20" stroke={a} fill="none" strokeWidth={3} />
        {/* Diamond emblem */}
        <polygon points="50,40 56,52 50,64 44,52" fill={a} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'daredevil_back') {
    return (
      <g>
        {/* Two batons crossed in X */}
        <rect x="20" y="48" width="60" height="5" rx="2" fill={c} stroke={STROKE} strokeWidth={1} transform="rotate(30 50 50)" />
        <rect x="20" y="48" width="60" height="5" rx="2" fill={c} stroke={STROKE} strokeWidth={1} transform="rotate(-30 50 50)" />
        {/* Red grips */}
        <rect x="14" y="40" width="14" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(30 21 43)" />
        <rect x="72" y="40" width="14" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(-30 79 43)" />
        <rect x="14" y="54" width="14" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(-30 21 57)" />
        <rect x="72" y="54" width="14" height="6" fill={a} stroke={STROKE} strokeWidth={0.8} transform="rotate(30 79 57)" />
      </g>
    );
  }
  if (kind === 'hawkeye_quiver') {
    return (
      <g>
        {/* Quiver cylinder */}
        <rect x="30" y="22" width="20" height="58" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Arrows sticking up */}
        {[-1, 0, 1].map((i) => (
          <g key={i}>
            <line x1={36 + i * 4} y1="22" x2={36 + i * 4} y2="8" stroke="#a16207" strokeWidth={1.5} />
            <polygon points={`${33 + i * 4},6 ${39 + i * 4},6 ${36 + i * 4},0`} fill={a} />
          </g>
        ))}
        {/* Diagonal leather strap */}
        <line x1="20" y1="76" x2="80" y2="40" stroke="#7c2d12" strokeWidth={4} />
      </g>
    );
  }
  if (kind === 'falcon_wings') {
    return (
      <g>
        {/* Large silver wings */}
        <polygon points="50,40 8,20 12,52 36,46 28,72 50,56" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="50,40 92,20 88,52 64,46 72,72 50,56" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Red feather details */}
        {[12, 20, 28, 36].map((dx) => (
          <line key={dx} x1={dx} y1={28 + dx * 0.3} x2={dx + 20} y2={32 + dx * 0.3} stroke={a} strokeWidth={1} />
        ))}
        {[64, 72, 80, 88].map((dx) => (
          <line key={dx} x1={dx} y1={28 + (100 - dx) * 0.3} x2={dx - 20} y2={32 + (100 - dx) * 0.3} stroke={a} strokeWidth={1} />
        ))}
      </g>
    );
  }
  if (kind === 'venom_back') {
    return (
      <g>
        {/* Black symbiote back panel */}
        <rect x="22" y="32" width="56" height="48" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Spike tendrils splaying out */}
        {[-2, -1, 0, 1, 2].map((s) => (
          <polygon
            key={s}
            points={`${50 + s * 12},32 ${44 + s * 12},2 ${56 + s * 12},2`}
            fill={c}
            stroke={STROKE}
            strokeWidth={0.8}
          />
        ))}
        {/* White spider emblem */}
        <ellipse cx="50" cy="56" rx="4" ry="8" fill={a} />
        {[-1, 1].map((sx) =>
          [0, 1, 2].map((i) => (
            <line
              key={`${sx}-${i}`}
              x1="50"
              y1="56"
              x2={50 + sx * (10 + i * 2)}
              y2={50 + i * 3}
              stroke={a}
              strokeWidth={1}
            />
          ))
        )}
      </g>
    );
  }
  if (kind === 'ghost_rider_back') {
    return (
      <g>
        {/* Silver chain column */}
        {[20, 32, 44, 56, 68].map((y, i) => (
          <ellipse
            key={y}
            cx="50"
            cy={y}
            rx={i % 2 === 0 ? 10 : 6}
            ry={i % 2 === 0 ? 6 : 10}
            fill="none"
            stroke={c}
            strokeWidth={4}
          />
        ))}
        {/* Orange flame outlines */}
        {[-1, 1].map((sx) =>
          [20, 40, 60].map((y) => (
            <polygon
              key={`${sx}-${y}`}
              points={`${sx > 0 ? 78 : 22},${y} ${sx > 0 ? 86 : 14},${y - 8} ${sx > 0 ? 86 : 14},${y + 8}`}
              fill={a}
            />
          ))
        )}
      </g>
    );
  }
  if (kind === 'silver_surfer_board') {
    return (
      <g>
        {/* Long silver surfboard */}
        <path d="M50,2 L62,18 L62,76 L50,98 L38,76 L38,18 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Center stripe */}
        <line x1="50" y1="14" x2="50" y2="86" stroke={a} strokeWidth={2} />
      </g>
    );
  }

  if (kind === 'pikachu_tail') {
    return (
      <g>
        {/* Brown base */}
        <rect x="44" y="70" width="12" height="12" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Big lightning bolt tail zigzag */}
        <polygon
          points="50,70 66,50 56,50 74,20 44,50 54,50 36,80"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (kind === 'charmander_tail') {
    return (
      <g>
        {/* Curved orange tail */}
        <path d="M50,80 Q30,70 30,50 Q35,32 50,30" fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" />
        {/* Flame tip (outer) */}
        <polygon points="42,10 60,26 46,28 56,44 34,20" fill={a} stroke="#dc2626" strokeWidth={0.8} strokeLinejoin="round" />
        {/* Flame tip (inner yellow) */}
        <polygon points="46,18 54,26 46,32 50,42 40,26" fill="#fde047" />
      </g>
    );
  }
  if (kind === 'squirtle_shell') {
    return (
      <g>
        {/* Round shell */}
        <path d="M14,72 Q50,20 86,72 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Cream rim */}
        <path d="M14,72 Q50,66 86,72" stroke={a} fill="none" strokeWidth={4} />
        {/* Hex plates */}
        <polygon points="34,50 30,60 34,68 42,68 46,60 42,50" fill="#7c2d12" stroke={STROKE} strokeWidth={0.5} />
        <polygon points="58,50 54,60 58,68 66,68 70,60 66,50" fill="#7c2d12" stroke={STROKE} strokeWidth={0.5} />
        <polygon points="46,32 42,42 46,50 54,50 58,42 54,32" fill="#7c2d12" stroke={STROKE} strokeWidth={0.5} />
      </g>
    );
  }
  if (kind === 'bulbasaur_bulb') {
    return (
      <g>
        {/* 3 green leaflets on top */}
        <polygon points="34,18 40,4 40,22" fill={c} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        <polygon points="50,14 50,0 54,20" fill={c} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        <polygon points="66,18 60,4 60,22" fill={c} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Green bulb */}
        <ellipse cx="50" cy="52" rx="32" ry="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark spots */}
        <ellipse cx="32" cy="46" rx="7" ry="6" fill={a} />
        <ellipse cx="68" cy="46" rx="7" ry="6" fill={a} />
        <ellipse cx="50" cy="62" rx="7" ry="6" fill={a} />
        <ellipse cx="38" cy="70" rx="5" ry="4" fill={a} />
        <ellipse cx="62" cy="70" rx="5" ry="4" fill={a} />
      </g>
    );
  }
  if (kind === 'eevee_tail') {
    return (
      <g>
        {/* Brown tail body */}
        <ellipse cx="50" cy="60" rx="18" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} transform="rotate(-20 50 60)" />
        {/* Cream fluff tip */}
        <ellipse cx="38" cy="30" rx="16" ry="14" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Cream fluff at base */}
        <ellipse cx="60" cy="82" rx="10" ry="7" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'jigglypuff_tail') {
    return (
      <g>
        {/* Small pink curl tail */}
        <ellipse cx="50" cy="55" rx="16" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Curl */}
        <path d="M50,50 Q60,44 60,54 Q60,64 50,60" fill="none" stroke={a} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'psyduck_tail') {
    return (
      <g>
        {/* Small orange nub */}
        <ellipse cx="50" cy="60" rx="14" ry="18" fill={a} stroke={STROKE} strokeWidth={SW} />
        {/* Feather tuft */}
        <polygon points="42,32 40,20 46,32" fill="#0a0a0a" />
        <polygon points="58,32 60,20 54,32" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'snorlax_back') {
    return (
      <g>
        {/* Chunky rounded dark back */}
        <ellipse cx="50" cy="56" rx="34" ry="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Cream side stripes */}
        <rect x="16" y="40" width="68" height="4" fill={a} />
        <rect x="16" y="56" width="68" height="4" fill={a} />
        <rect x="16" y="72" width="68" height="4" fill={a} />
      </g>
    );
  }
  if (kind === 'gengar_shadow') {
    return (
      <g>
        {/* Row of purple spikes */}
        <polygon points="30,80 34,50 38,80" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="42,80 46,42 50,80" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="54,80 58,42 62,80" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="66,80 70,50 74,80" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="10,80 14,58 18,80" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="82,80 86,58 90,80" fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
      </g>
    );
  }
  if (kind === 'mew_tail') {
    return (
      <g>
        {/* Long curly thin pink tail with rounded tip */}
        <path
          d="M50,80 Q64,68 66,52 Q66,36 50,32 Q34,32 32,44 Q30,58 44,60"
          stroke={c}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Rounded tip */}
        <circle cx="44" cy="60" r="6" fill={c} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }
  if (kind === 'charizard_wings') {
    return (
      <g>
        {/* Left wing */}
        <path d="M50,40 L4,10 L14,50 L38,44 L28,72 L50,54 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Right wing */}
        <path d="M50,40 L96,10 L86,50 L62,44 L72,72 L50,54 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Green membrane finger lines */}
        <line x1="50" y1="40" x2="10" y2="16" stroke={a} strokeWidth={1.5} />
        <line x1="50" y1="44" x2="20" y2="46" stroke={a} strokeWidth={1.5} />
        <line x1="50" y1="40" x2="90" y2="16" stroke={a} strokeWidth={1.5} />
        <line x1="50" y1="44" x2="80" y2="46" stroke={a} strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'beedrill_wings') {
    // Two pairs of translucent gray wings
    return (
      <g>
        {[[24, 32], [76, 32], [24, 56], [76, 56]].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="22" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} opacity="0.75" />
        ))}
        {/* Wing vein detail */}
        {[[24, 32], [76, 32], [24, 56], [76, 56]].map(([cx, cy], i) => (
          <g key={i + 100}>
            <line x1={cx - 18} y1={cy} x2={cx + 18} y2={cy} stroke={a} strokeWidth={0.6} />
            <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke={a} strokeWidth={0.6} />
          </g>
        ))}
      </g>
    );
  }
  if (kind === 'mega_lucario_aura') {
    // Mega Lucario — wild yellow mane + long black tail + red aura tips
    return (
      <g>
        {/* Yellow spiky wild mane */}
        {[[16, 22], [30, 8], [50, 4], [70, 8], [84, 22]].map(([x, y], i) => (
          <polygon key={i} points={`${x - 8},${y + 8} ${x + 8},${y + 8} ${x},${y - 6}`}
            fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        ))}
        {/* Long black tail curving down */}
        <path d="M50,40 Q60,60 50,80 Q40,90 30,84" stroke={c} fill="none" strokeWidth={8} strokeLinecap="round" />
        {/* Red aura tip at tail end */}
        <circle cx="30" cy="84" r="5" fill="#7f1d1d" stroke={STROKE} strokeWidth={0.6} />
        {/* Aura spike wristbands (two) */}
        <polygon points="12,50 4,44 14,58" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        <polygon points="88,50 96,44 86,58" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'absol_tail') {
    // Absol — forked/split scythe-shaped tail
    return (
      <g>
        {/* Curved tail base */}
        <path d="M50,80 Q40,60 32,42" stroke={c} fill="none" strokeWidth={9} strokeLinecap="round" />
        {/* Split forked tips (two curved sickles) */}
        <path d="M32,42 Q22,24 14,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M32,42 Q36,20 42,20 L38,32 L32,42 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Dark navy tips */}
        <polygon points="14,32 8,28 18,26" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="42,20 46,10 40,22" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'growlithe_tail') {
    // Growlithe — fluffy curled cream tail with orange stripes
    return (
      <g>
        {/* Curled tail base (orange) */}
        <path d="M40,72 Q22,66 20,44 Q22,26 42,26 Q60,26 60,44"
          stroke={c} fill="none" strokeWidth={10} strokeLinecap="round" />
        {/* Cream fluffy tuft on the tip */}
        {[[62, 40], [56, 32], [66, 30], [74, 36]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="8" fill={a} stroke={STROKE} strokeWidth={0.8} />
        ))}
        {/* Dark stripe */}
        <path d="M32,52 Q30,44 32,36" stroke={item.accent === '#fef3c7' ? '#7c2d12' : a}
          fill="none" strokeWidth={2.5} />
      </g>
    );
  }
  if (kind === 'gardevoir_dress') {
    // Gardevoir's flowing white gown "cape" flaring behind
    return (
      <g>
        {/* Flowing side panels of the gown */}
        <path d="M50,20 L14,44 L20,80 L36,72 L50,50 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M50,20 L86,44 L80,80 L64,72 L50,50 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Red back-spike */}
        <polygon points="46,20 50,60 54,20" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'lugia_wings') {
    // Lugia — huge white wings with finger-like tips + row of navy back plates
    return (
      <g>
        {/* Left wing with hand-like finger tips */}
        <path d="M50,42 L8,20 L2,48 L14,44 L4,64 L22,52 L14,70 L34,58 L50,54 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Right wing */}
        <path d="M50,42 L92,20 L98,48 L86,44 L96,64 L78,52 L86,70 L66,58 L50,54 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Row of navy back spike-plates */}
        {[30, 42, 54, 66].map((x) => (
          <polygon key={x} points={`${x - 4},80 ${x + 4},80 ${x},68`}
            fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        ))}
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

  if (kind === 'charizard_boots') {
    return (
      <g>
        {heroBoot(c)}
        {/* Cream sole */}
        <rect x="14" y="66" width="72" height="10" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Sharp claws */}
        <polygon points="76,66 82,58 74,66" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="66,66 68,54 62,66" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="56,66 54,54 50,66" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'beedrill_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Yellow stripe accent */}
        <rect x="20" y="46" width="60" height="6" fill={a} />
        {/* Small drill stinger toe */}
        <polygon points="70,66 88,74 68,78" fill="#e5e7eb" stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        <line x1="76" y1="72" x2="82" y2="74" stroke={c} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'mega_lucario_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Yellow foot pad top */}
        <rect x="20" y="40" width="60" height="8" fill={item.color === '#0f172a' ? '#facc15' : a} />
        {/* Red paw pad claws */}
        <polygon points="72,66 88,60 84,74" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="22,66 8,60 14,74" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Cream toe pads (3) */}
        <circle cx="34" cy="70" r="3" fill="#fef3c7" />
        <circle cx="50" cy="72" r="3" fill="#fef3c7" />
        <circle cx="66" cy="70" r="3" fill="#fef3c7" />
      </g>
    );
  }
  if (kind === 'absol_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Dark navy paw upper */}
        <rect x="20" y="40" width="60" height="26" rx="4" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Sharp black claws */}
        <polygon points="22,66 26,76 30,66" fill="#0a0a0a" />
        <polygon points="36,66 40,76 44,66" fill="#0a0a0a" />
        <polygon points="56,66 60,76 64,66" fill="#0a0a0a" />
        <polygon points="70,66 74,76 78,66" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'growlithe_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Cream fluff cuffs */}
        {[[24, 26], [36, 22], [50, 20], [64, 22], [76, 26]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill="#fef3c7" stroke={STROKE} strokeWidth={0.6} />
        ))}
        {/* Dark tiger stripes on the boot */}
        <path d="M32,42 Q40,48 32,54" stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M68,42 Q60,48 68,54" stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'gardevoir_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Green pointy toe accent */}
        <polygon points="72,68 84,58 82,74" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Elegant ankle band (green) */}
        <rect x="20" y="42" width="60" height="4" fill={a} />
      </g>
    );
  }
  if (kind === 'lugia_feet') {
    return (
      <g>
        {heroBoot(c)}
        {/* Pale-blue accent band */}
        <rect x="20" y="60" width="60" height="6" fill="#bfdbfe" stroke={STROKE} strokeWidth={0.6} />
        {/* Three big navy claws pointing forward */}
        <polygon points="80,74 92,70 84,58" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="66,74 78,72 72,60" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="52,74 62,72 58,60" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }

  if (
    kind === 'wolverine' ||
    kind === 'dr_strange' ||
    kind === 'starlord' ||
    kind === 'antman' ||
    kind === 'war_machine' ||
    kind === 'vision' ||
    kind === 'daredevil' ||
    kind === 'hawkeye' ||
    kind === 'falcon' ||
    kind === 'venom' ||
    kind === 'ghost_rider' ||
    kind === 'silver_surfer'
  ) {
    return (
      <g>
        {heroBoot(c)}
        <rect x="30" y="72" width="44" height="6" fill={a} />
        {kind === 'wolverine' && <rect x="30" y="46" width="44" height="4" fill={a} />}
        {kind === 'war_machine' && <rect x="22" y="36" width="58" height="10" rx="2" fill={a} stroke={STROKE} strokeWidth={0.6} />}
        {kind === 'vision' && <ellipse cx="50" cy="38" rx="22" ry="3" fill="none" stroke={a} strokeWidth={2.5} />}
        {kind === 'falcon' && (
          <>
            <rect x="30" y="36" width="44" height="5" fill={a} />
            <polygon points="74,52 80,52 76,60" fill={a} />
          </>
        )}
        {kind === 'venom' && (
          <>
            {[-1, 0, 1].map((i) => (
              <polygon key={i} points={`${72 + i * 4},58 ${68 + i * 4},58 ${70 + i * 4},66`} fill={a} />
            ))}
          </>
        )}
        {kind === 'ghost_rider' && <ellipse cx="50" cy="38" rx="22" ry="3" fill="none" stroke={a} strokeWidth={2} />}
        {(kind === 'starlord' || kind === 'hawkeye') && (
          <rect x="30" y="36" width="44" height="5" fill={a} stroke={STROKE} strokeWidth={0.4} />
        )}
        {kind === 'antman' && <rect x="30" y="36" width="44" height="4" fill={a} />}
        {(kind === 'dr_strange' || kind === 'daredevil') && (
          <polygon points="74,30 80,28 78,40" fill={a} />
        )}
        {kind === 'silver_surfer' && <rect x="30" y="36" width="44" height="3" fill={a} />}
      </g>
    );
  }

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
  if (kind === 'solmoe') {
    return (
      <g>
        {/* Orange soccer cleat */}
        <path
          d="M14,52 Q14,38 36,38 L60,38 Q82,42 86,60 L86,70 L14,70 Z"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Dark green swoosh */}
        <path d="M22,58 Q40,46 70,52" fill="none" stroke={a} strokeWidth={3} strokeLinecap="round" />
        {/* Studded sole */}
        <rect x="14" y="70" width="72" height="6" fill={a} />
        {[22, 36, 50, 64, 78].map((x) => (
          <circle key={x} cx={x} cy="74" r="1.5" fill="#0a0a0a" />
        ))}
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
    case 'jigglypuff_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Round pink body */}
          <circle cx="50" cy="52" r="28" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Curl tuft on top */}
          <ellipse cx="40" cy="24" rx="6" ry="8" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Small cat ears */}
          <polygon points="40,32 34,20 46,26" fill={c} stroke={STROKE} strokeWidth={1} />
          <polygon points="62,26 66,18 58,32" fill={c} stroke={STROKE} strokeWidth={1} />
          {/* Big blue eyes with white highlight */}
          <ellipse cx="38" cy="48" rx="6" ry="8" fill={item.accent ?? '#3b82f6'} />
          <ellipse cx="62" cy="48" rx="6" ry="8" fill={item.accent ?? '#3b82f6'} />
          <circle cx="40" cy="44" r="2" fill="#f8fafc" />
          <circle cx="64" cy="44" r="2" fill="#f8fafc" />
          {/* Small mouth */}
          <path d="M46,64 Q50,70 54,64" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
        </g>
      );
    case 'mew_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Round pink head */}
          <circle cx="50" cy="48" r="24" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Small kitten ears */}
          <polygon points="36,32 30,18 44,32" fill={c} stroke={STROKE} strokeWidth={1} strokeLinejoin="round" />
          <polygon points="64,32 70,18 56,32" fill={c} stroke={STROKE} strokeWidth={1} strokeLinejoin="round" />
          {/* Big cyan eyes */}
          <ellipse cx="40" cy="46" rx="5" ry="7" fill={item.accent ?? '#7dd3fc'} />
          <ellipse cx="60" cy="46" rx="5" ry="7" fill={item.accent ?? '#7dd3fc'} />
          <circle cx="42" cy="42" r="2" fill="#f8fafc" />
          <circle cx="62" cy="42" r="2" fill="#f8fafc" />
          {/* Tiny nose */}
          <circle cx="50" cy="56" r="1.5" fill="#dc2626" />
          {/* Curling tail */}
          <path d="M28,72 Q10,84 20,90 Q26,92 24,86" stroke={c} fill="none" strokeWidth={4} strokeLinecap="round" />
          <circle cx="22" cy="86" r="3" fill={c} stroke={STROKE} strokeWidth={0.6} />
        </g>
      );
    case 'psyduck_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* 3 black feather tufts on crown */}
          <polygon points="42,22 40,10 44,22" fill="#0a0a0a" />
          <polygon points="50,20 50,8 52,20" fill="#0a0a0a" />
          <polygon points="58,22 60,10 56,22" fill="#0a0a0a" />
          {/* Round yellow head */}
          <ellipse cx="50" cy="52" rx="28" ry="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Orange bill */}
          <rect x="34" y="58" width="32" height="12" rx="3" fill={item.accent ?? '#f97316'} stroke={STROKE} strokeWidth={0.8} />
          <line x1="50" y1="58" x2="50" y2="70" stroke="#c2410c" strokeWidth={0.8} />
          {/* Vacant white eyes with tiny black pupils */}
          <circle cx="38" cy="46" r="6" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
          <circle cx="62" cy="46" r="6" fill="#f8fafc" stroke={STROKE} strokeWidth={0.8} />
          <circle cx="38" cy="46" r="2" fill="#0a0a0a" />
          <circle cx="62" cy="46" r="2" fill="#0a0a0a" />
        </g>
      );
    case 'charmander_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Orange head */}
          <ellipse cx="50" cy="56" rx="26" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Cream muzzle */}
          <ellipse cx="50" cy="66" rx="16" ry="8" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.6} />
          {/* Eyes */}
          <ellipse cx="40" cy="50" rx="3" ry="5" fill="#0a0a0a" />
          <ellipse cx="60" cy="50" rx="3" ry="5" fill="#0a0a0a" />
          <circle cx="41" cy="48" r="1" fill="#f8fafc" />
          <circle cx="61" cy="48" r="1" fill="#f8fafc" />
          {/* Small flame on top */}
          <polygon points="46,18 54,26 46,32 50,42 40,26" fill="#fbbf24" stroke="#f97316" strokeWidth={0.6} />
        </g>
      );
    case 'squirtle_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Blue head */}
          <circle cx="50" cy="54" r="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Cream cheeks */}
          <circle cx="30" cy="60" r="5" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.5} />
          <circle cx="70" cy="60" r="5" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.5} />
          {/* Big eyes */}
          <ellipse cx="38" cy="46" rx="4" ry="6" fill="#0a0a0a" />
          <ellipse cx="62" cy="46" rx="4" ry="6" fill="#0a0a0a" />
          <circle cx="39" cy="44" r="1.2" fill="#f8fafc" />
          <circle cx="63" cy="44" r="1.2" fill="#f8fafc" />
          {/* Cream beak */}
          <rect x="44" y="60" width="12" height="6" rx="1" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.6} />
        </g>
      );
    case 'bulbasaur_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Green head */}
          <circle cx="50" cy="52" r="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Dark spots */}
          <ellipse cx="30" cy="46" rx="5" ry="4" fill={item.accent ?? '#166534'} />
          <ellipse cx="70" cy="46" rx="5" ry="4" fill={item.accent ?? '#166534'} />
          {/* Red eyes */}
          <ellipse cx="40" cy="46" rx="3" ry="5" fill="#dc2626" />
          <ellipse cx="60" cy="46" rx="3" ry="5" fill="#dc2626" />
          {/* Wide grin */}
          <path d="M34,60 Q50,72 66,60" stroke="#0a0a0a" fill="none" strokeWidth={1.8} />
          {/* Small green bulb behind head */}
          <ellipse cx="50" cy="24" rx="10" ry="7" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.6} />
        </g>
      );
    case 'eevee_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Tall pointy ears */}
          <polygon points="30,44 22,10 40,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="70,44 78,10 60,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          {/* Brown head */}
          <circle cx="50" cy="54" r="24" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Cream ruff */}
          {[24, 34, 44, 56, 66, 76].map((x) => (
            <circle key={x} cx={x} cy="80" r="5" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.4} />
          ))}
          {/* Big shiny eyes */}
          <ellipse cx="40" cy="50" rx="3.5" ry="5" fill="#0a0a0a" />
          <ellipse cx="60" cy="50" rx="3.5" ry="5" fill="#0a0a0a" />
          <circle cx="41" cy="48" r="1.2" fill="#f8fafc" />
          <circle cx="61" cy="48" r="1.2" fill="#f8fafc" />
          {/* Small nose */}
          <polygon points="46,62 54,62 50,68" fill="#0a0a0a" />
        </g>
      );
    case 'snorlax_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Chunky rounded body */}
          <ellipse cx="50" cy="54" rx="30" ry="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Round nub ears */}
          <circle cx="24" cy="34" r="5" fill={c} stroke={STROKE} strokeWidth={SW} />
          <circle cx="76" cy="34" r="5" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Closed sleepy eyes */}
          <path d="M32,46 Q38,52 44,46" stroke={item.accent ?? '#0f172a'} fill="none" strokeWidth={3} strokeLinecap="round" />
          <path d="M56,46 Q62,52 68,46" stroke={item.accent ?? '#0f172a'} fill="none" strokeWidth={3} strokeLinecap="round" />
          {/* Big sleeping mouth */}
          <ellipse cx="50" cy="66" rx="14" ry="6" fill={item.accent ?? '#0f172a'} />
        </g>
      );
    case 'gengar_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Purple spike ears */}
          <polygon points="30,30 22,12 40,26" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="70,30 78,12 60,26" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          {/* Purple head */}
          <circle cx="50" cy="52" r="26" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Red glowing eyes */}
          <circle cx="38" cy="46" r="4" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.5} />
          <circle cx="62" cy="46" r="4" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.5} />
          <circle cx="38" cy="46" r="1.5" fill="#0a0a0a" />
          <circle cx="62" cy="46" r="1.5" fill="#0a0a0a" />
          {/* Big red toothy grin */}
          <path d="M28,60 Q50,76 72,60" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.8} />
          {[34, 44, 54, 64].map((x, i) => (
            <polygon key={x} points={`${x - 2},${62 + Math.abs(i - 1.5)},${x + 2},${62 + Math.abs(i - 1.5)},${x},${70}`} fill="#f8fafc" />
          ))}
        </g>
      );
    case 'charizard_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Cream horns */}
          <polygon points="30,26 24,10 38,26" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.8} />
          <polygon points="70,26 76,10 62,26" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.8} />
          {/* Boxy orange head */}
          <rect x="26" y="24" width="48" height="52" rx="6" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Cream muzzle */}
          <ellipse cx="50" cy="62" rx="18" ry="8" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.6} />
          {/* Eyes */}
          <ellipse cx="38" cy="44" rx="3" ry="5" fill="#0f172a" />
          <ellipse cx="62" cy="44" rx="3" ry="5" fill="#0f172a" />
          <circle cx="39" cy="42" r="1.2" fill="#f8fafc" />
          <circle cx="63" cy="42" r="1.2" fill="#f8fafc" />
          {/* Nostrils */}
          <circle cx="45" cy="60" r="1.5" fill="#0f172a" />
          <circle cx="55" cy="60" r="1.5" fill="#0f172a" />
          {/* Small fangs */}
          <polygon points="40,68 44,68 42,76" fill={item.accent ?? '#fef3c7'} />
          <polygon points="56,68 60,68 58,76" fill={item.accent ?? '#fef3c7'} />
        </g>
      );
    case 'beedrill_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Yellow bee head */}
          <ellipse cx="50" cy="52" rx="22" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Black stripe */}
          <rect x="28" y="34" width="44" height="7" fill={item.accent ?? '#0a0a0a'} />
          <rect x="28" y="60" width="44" height="6" fill={item.accent ?? '#0a0a0a'} />
          {/* Big red compound eyes */}
          <ellipse cx="38" cy="50" rx="6" ry="8" fill="#dc2626" />
          <ellipse cx="62" cy="50" rx="6" ry="8" fill="#dc2626" />
          {/* Antennae */}
          <path d="M42,28 Q38,14 34,14" stroke={item.accent ?? '#0a0a0a'} fill="none" strokeWidth={2} />
          <path d="M58,28 Q62,14 66,14" stroke={item.accent ?? '#0a0a0a'} fill="none" strokeWidth={2} />
          {/* Stinger mouth */}
          <polygon points="46,72 54,72 50,86" fill={item.accent ?? '#0a0a0a'} />
        </g>
      );
    case 'mega_lucario_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Yellow mane spikes */}
          {[[22, 28], [36, 14], [50, 8], [64, 14], [78, 28]].map(([x, y], i) => (
            <polygon key={i} points={`${x - 6},${y + 6} ${x + 6},${y + 6} ${x},${y - 6}`}
              fill={item.accent ?? '#facc15'} stroke={STROKE} strokeWidth={0.5} />
          ))}
          {/* Blue head */}
          <ellipse cx="50" cy="52" rx="22" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Long black ear appendages */}
          <path d="M28,32 Q16,18 12,26 L20,34 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.5} />
          <path d="M72,32 Q84,18 88,26 L80,34 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.5} />
          {/* Black snout */}
          <ellipse cx="50" cy="58" rx="6" ry="4" fill="#0f172a" />
          {/* Red eyes */}
          <ellipse cx="42" cy="50" rx="2.5" ry="3" fill="#dc2626" />
          <ellipse cx="58" cy="50" rx="2.5" ry="3" fill="#dc2626" />
          {/* Yellow chest bib */}
          <polygon points="36,68 50,80 64,68 50,74" fill={item.accent ?? '#facc15'} />
        </g>
      );
    case 'absol_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Big sickle horn */}
          <path d="M28,44 Q10,32 8,14 L18,22 L22,36 L32,44 Z"
            fill={item.accent ?? '#1e293b'} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
          {/* Shaggy pale head */}
          <path d="M26,50 L36,30 L50,22 L64,26 L76,38 L80,54 L70,72 L54,78 L38,74 L28,66 Z"
            fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          {/* Dark navy face mask */}
          <path d="M34,50 L52,44 L72,50 L68,64 L52,70 L38,64 Z"
            fill={item.accent ?? '#1e293b'} stroke={STROKE} strokeWidth={0.4} strokeLinejoin="round" />
          {/* Red eyes */}
          <ellipse cx="46" cy="54" rx="2.5" ry="3.5" fill="#dc2626" />
          <ellipse cx="60" cy="54" rx="2.5" ry="3.5" fill="#dc2626" />
          {/* Nose */}
          <circle cx="38" cy="66" r="1.4" fill="#0a0a0a" />
        </g>
      );
    case 'growlithe_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Cream mane behind */}
          {[[26, 32], [34, 20], [50, 14], [66, 20], [74, 32]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="8" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.5} />
          ))}
          {/* Orange head */}
          <ellipse cx="50" cy="54" rx="22" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Dark stripes */}
          <path d="M32,44 Q36,52 32,58" stroke="#7c2d12" fill="none" strokeWidth={2} />
          <path d="M68,44 Q64,52 68,58" stroke="#7c2d12" fill="none" strokeWidth={2} />
          {/* Cream muzzle */}
          <ellipse cx="50" cy="62" rx="10" ry="6" fill={item.accent ?? '#fef3c7'} stroke={STROKE} strokeWidth={0.5} />
          {/* Eyes */}
          <ellipse cx="42" cy="52" rx="3" ry="4" fill="#0a0a0a" />
          <ellipse cx="58" cy="52" rx="3" ry="4" fill="#0a0a0a" />
          <circle cx="43" cy="50" r="1" fill="#f8fafc" />
          <circle cx="59" cy="50" r="1" fill="#f8fafc" />
          <circle cx="50" cy="62" r="1.5" fill="#0a0a0a" />
        </g>
      );
    case 'gardevoir_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Green helmet-hair */}
          <path d="M22,30 Q22,10 50,10 Q78,10 78,30 L74,42 L64,38 L50,44 L36,38 L26,42 Z"
            fill={item.accent ?? '#16a34a'} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          {/* Pale face */}
          <ellipse cx="50" cy="52" rx="20" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Forward bang */}
          <path d="M30,32 L34,50 L42,44 Z" fill={item.accent ?? '#16a34a'} stroke={STROKE} strokeWidth={0.5} />
          {/* Red horn spike */}
          <polygon points="46,34 50,50 54,34" fill="#dc2626" stroke={STROKE} strokeWidth={0.5} />
          {/* Red eyes */}
          <ellipse cx="42" cy="56" rx="3" ry="4.5" fill="#dc2626" />
          <ellipse cx="58" cy="56" rx="3" ry="4.5" fill="#dc2626" />
          <circle cx="43" cy="54" r="1" fill="#f8fafc" />
          <circle cx="59" cy="54" r="1" fill="#f8fafc" />
        </g>
      );
    case 'lugia_charm':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Elongated white Lugia head */}
          <path d="M22,52 Q22,26 50,22 Q78,26 80,52 Q74,74 50,78 Q26,74 22,52 Z"
            fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Navy back-crest */}
          <polygon points="70,20 84,10 74,32" fill={item.accent ?? '#1e3a8a'} stroke={STROKE} strokeWidth={0.6} />
          {/* Navy eye mask spike-band */}
          <path d="M30,46 L44,42 L54,48 L64,42 L72,50 L64,54 L54,50 L44,54 Z"
            fill={item.accent ?? '#1e3a8a'} stroke={STROKE} strokeWidth={0.5} />
          <ellipse cx="48" cy="48" rx="2.5" ry="1.6" fill="#f8fafc" />
          <ellipse cx="62" cy="48" rx="2.5" ry="1.6" fill="#f8fafc" />
          {/* Beak-jaw */}
          <path d="M74,56 L92,54 L84,66 L76,62 Z" fill={c} stroke={STROKE} strokeWidth={0.6} />
          <path d="M78,60 L88,58 L82,64 Z" fill="#7f1d1d" />
        </g>
      );
    case 'pikachu_charm':
      return (
        <g>
          {/* Lanyard */}
          <line x1="50" y1="6" x2="50" y2="18" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="4" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Two tall pointy ears with black tips */}
          <polygon points="26,44 12,4 34,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="15,16 12,4 22,20" fill="#0a0a0a" />
          <polygon points="74,44 88,4 66,32" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
          <polygon points="85,16 88,4 78,20" fill="#0a0a0a" />
          {/* Round head */}
          <ellipse cx="50" cy="54" rx="26" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
          {/* Red cheeks */}
          <circle cx="30" cy="60" r="6" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.6} />
          <circle cx="70" cy="60" r="6" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.6} />
          {/* Big shiny black eyes */}
          <ellipse cx="40" cy="48" rx="4" ry="5" fill="#0a0a0a" />
          <ellipse cx="60" cy="48" rx="4" ry="5" fill="#0a0a0a" />
          <circle cx="41.5" cy="46" r="1.2" fill="#f8fafc" />
          <circle cx="61.5" cy="46" r="1.2" fill="#f8fafc" />
          {/* Small nose + smile */}
          <path d="M46,60 Q50,64 54,60" stroke="#0a0a0a" fill="none" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );
    case 'joon_band':
      return (
        <g>
          {/* Lanyard line + key ring */}
          <line x1="50" y1="14" x2="50" y2="26" stroke={STROKE} strokeWidth={2} />
          <circle cx="50" cy="12" r="3" fill="none" stroke={STROKE} strokeWidth={SW} />
          {/* Yellow wristband (thick ring shown side-on) */}
          <ellipse cx="50" cy="56" rx="26" ry="22" fill="none" stroke={c} strokeWidth={9} />
          {/* Small darker tag bead at the bottom */}
          <rect x="44" y="74" width="12" height="8" rx="1" fill={item.accent ?? '#ca8a04'} stroke={STROKE} strokeWidth={0.6} />
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

function Misc({ item }: { item: Item }) {
  const c = item.color;
  const a = item.accent ?? '#fb923c';
  const kind = item.kind ?? 'motorcycle';

  if (kind === 'soccer_ball') {
    return (
      <g>
        {/* Ball */}
        <circle cx="50" cy="50" r="34" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Central black pentagon */}
        <polygon
          points="50,34 64,44 58,60 42,60 36,44"
          fill={a}
          stroke={STROKE}
          strokeWidth={1}
        />
        {/* Surrounding pentagon edges */}
        <line x1="50" y1="34" x2="50" y2="16" stroke={STROKE} strokeWidth={1.5} />
        <line x1="64" y1="44" x2="78" y2="34" stroke={STROKE} strokeWidth={1.5} />
        <line x1="58" y1="60" x2="68" y2="76" stroke={STROKE} strokeWidth={1.5} />
        <line x1="42" y1="60" x2="32" y2="76" stroke={STROKE} strokeWidth={1.5} />
        <line x1="36" y1="44" x2="22" y2="34" stroke={STROKE} strokeWidth={1.5} />
        {/* Outer black accents */}
        <polygon points="50,16 60,18 50,28 40,18" fill={a} />
        <polygon points="78,34 82,46 70,46 74,36" fill={a} />
        <polygon points="68,76 56,82 60,68 70,72" fill={a} />
        <polygon points="32,76 26,72 40,68 44,82" fill={a} />
        <polygon points="22,34 30,36 26,46 18,46" fill={a} />
      </g>
    );
  }

  if (kind === 'motorcycle') {
    return (
      <g>
        {/* Hellfire trail extending behind the bike */}
        <polygon points="2,52 18,44 16,52 18,60 2,56" fill={a} stroke="#dc2626" strokeWidth={0.6} />
        <polygon points="6,54 14,50 14,58" fill="#fde047" />
        {/* Twin exhaust pipes */}
        <rect x="16" y="50" width="22" height="3" fill={c} stroke={STROKE} strokeWidth={0.5} />
        <rect x="16" y="56" width="22" height="3" fill={c} stroke={STROKE} strokeWidth={0.5} />
        {/* Frame body */}
        <rect x="22" y="40" width="50" height="14" rx="3" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Diagonal brace */}
        <rect x="34" y="36" width="34" height="4" rx="1" fill={c} stroke={STROKE} strokeWidth={0.6} transform="rotate(-12 51 38)" />
        {/* Teardrop fuel tank */}
        <ellipse cx="48" cy="32" rx="14" ry="7" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Skull emblem on tank */}
        <ellipse cx="48" cy="32" rx="4" ry="3.5" fill="#f8fafc" stroke={STROKE} strokeWidth={0.5} />
        <circle cx="46" cy="31" r="0.8" fill={a} />
        <circle cx="50" cy="31" r="0.8" fill={a} />
        {/* Black seat */}
        <rect x="22" y="28" width="20" height="8" rx="1" fill="#0a0a0a" stroke={STROKE} strokeWidth={0.8} />
        {/* Sissy bar */}
        <rect x="20" y="14" width="3" height="20" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Front fork up to handlebar */}
        <line x1="64" y1="64" x2="74" y2="22" stroke={c} strokeWidth={3} />
        {/* Handlebar */}
        <rect x="68" y="14" width="14" height="4" rx="1" fill={c} stroke={STROKE} strokeWidth={0.8} />
        {/* Headlight */}
        <circle cx="75" cy="34" r="3.5" fill="#fde047" stroke={STROKE} strokeWidth={0.6} />
        {/* Two wheels with flame rings */}
        {[28, 64].map((wx) => (
          <g key={wx}>
            {/* Flame ring around the tire */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <polygon
                  key={i}
                  points={`${wx + Math.cos(angle) * 16},${72 + Math.sin(angle) * 16} ${wx + Math.cos(angle) * 22},${72 + Math.sin(angle) * 22} ${wx + Math.cos(angle + 0.4) * 16},${72 + Math.sin(angle + 0.4) * 16}`}
                  fill={a}
                  stroke="#dc2626"
                  strokeWidth={0.4}
                />
              );
            })}
            {/* Tire */}
            <circle cx={wx} cy="72" r="12" fill="none" stroke="#0a0a0a" strokeWidth={4} />
            {/* Chrome hub */}
            <circle cx={wx} cy="72" r="4" fill={c} stroke={STROKE} strokeWidth={0.8} />
            {/* Cross spokes */}
            <line x1={wx - 10} y1="72" x2={wx + 10} y2="72" stroke={c} strokeWidth={1} />
            <line x1={wx} y1="62" x2={wx} y2="82" stroke={c} strokeWidth={1} />
          </g>
        ))}
      </g>
    );
  }

  if (kind === 'pikachu') {
    return (
      <g>
        {/* Zigzag lightning bolt tail behind body */}
        <polygon
          points="4,30 20,26 14,42 24,44 8,64 22,58 16,72 30,66"
          fill={c}
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Brown base of tail */}
        <rect x="26" y="60" width="8" height="10" fill="#78350f" stroke={STROKE} strokeWidth={0.6} />
        {/* Two tall pointy ears with black tips */}
        <polygon points="40,32 30,2 48,26" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="32,10 30,2 40,14" fill="#0a0a0a" />
        <polygon points="60,32 70,2 52,26" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="68,10 70,2 60,14" fill="#0a0a0a" />
        {/* Chubby body */}
        <ellipse cx="52" cy="70" rx="26" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Head */}
        <ellipse cx="52" cy="40" rx="22" ry="19" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Red cheeks */}
        <circle cx="34" cy="46" r="5" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="70" cy="46" r="5" fill={item.accent ?? '#dc2626'} stroke={STROKE} strokeWidth={0.6} />
        {/* Shiny black eyes */}
        <ellipse cx="44" cy="36" rx="3" ry="4" fill="#0a0a0a" />
        <ellipse cx="60" cy="36" rx="3" ry="4" fill="#0a0a0a" />
        <circle cx="45" cy="34.5" r="1" fill="#f8fafc" />
        <circle cx="61" cy="34.5" r="1" fill="#f8fafc" />
        {/* Small nose */}
        <ellipse cx="52" cy="43" rx="1.2" ry="0.8" fill="#0a0a0a" />
        {/* Open mouth with pink tongue */}
        <path d="M46,48 Q52,54 58,48" stroke="#0a0a0a" fill="#78350f" strokeWidth={1.2} />
        <ellipse cx="52" cy="50" rx="3" ry="1.5" fill="#fb7185" />
        {/* Little arms */}
        <ellipse cx="30" cy="66" rx="4" ry="7" fill={c} stroke={STROKE} strokeWidth={0.8} transform="rotate(-30 30 66)" />
        <ellipse cx="74" cy="66" rx="4" ry="7" fill={c} stroke={STROKE} strokeWidth={0.8} transform="rotate(30 74 66)" />
        {/* Feet */}
        <ellipse cx="42" cy="88" rx="7" ry="4" fill={c} stroke={STROKE} strokeWidth={0.8} />
        <ellipse cx="62" cy="88" rx="7" ry="4" fill={c} stroke={STROKE} strokeWidth={0.8} />
      </g>
    );
  }

  // Pokemon companions — small full-body icon per species
  if (kind === 'charmander') {
    return (
      <g>
        <ellipse cx="50" cy="58" rx="26" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="68" rx="16" ry="10" fill={a} />
        <ellipse cx="50" cy="30" rx="20" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="42" cy="28" rx="3" ry="4" fill="#0a0a0a" />
        <ellipse cx="58" cy="28" rx="3" ry="4" fill="#0a0a0a" />
        <path d="M76,64 Q88,50 82,30" stroke={c} fill="none" strokeWidth={6} strokeLinecap="round" />
        <polygon points="72,30 90,20 78,10 84,4 68,18" fill="#fb923c" stroke="#dc2626" strokeWidth={0.6} />
        <polygon points="78,22 84,12 78,8 82,4 74,16" fill="#fde047" />
      </g>
    );
  }
  if (kind === 'squirtle') {
    return (
      <g>
        <ellipse cx="50" cy="58" rx="28" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path d="M22,60 Q50,32 78,60 Q78,72 50,80 Q22,72 22,60" fill="#a16207" stroke={STROKE} strokeWidth={0.8} />
        <ellipse cx="50" cy="70" rx="14" ry="6" fill={a} />
        <ellipse cx="50" cy="30" rx="20" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="42" cy="28" rx="3" ry="4" fill="#0a0a0a" />
        <ellipse cx="58" cy="28" rx="3" ry="4" fill="#0a0a0a" />
        <rect x="42" y="34" width="16" height="6" rx="1" fill={a} stroke={STROKE} strokeWidth={0.5} />
      </g>
    );
  }
  if (kind === 'bulbasaur') {
    return (
      <g>
        <ellipse cx="50" cy="62" rx="34" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="34" cy="34" rx="24" ry="22" fill="#4d7c0f" stroke={STROKE} strokeWidth={SW} />
        <polygon points="28,10 32,4 34,18" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.5} />
        <polygon points="40,4 44,0 40,20" fill="#4d7c0f" stroke={STROKE} strokeWidth={0.5} />
        <ellipse cx="70" cy="56" rx="18" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="65" cy="52" rx="3" ry="4" fill="#dc2626" />
        <ellipse cx="76" cy="52" rx="3" ry="4" fill="#dc2626" />
        <ellipse cx="42" cy="50" rx="4" ry="3" fill={a} />
        <ellipse cx="58" cy="72" rx="4" ry="3" fill={a} />
      </g>
    );
  }
  if (kind === 'eevee') {
    return (
      <g>
        <polygon points="30,32 20,4 42,26" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="70,32 80,4 58,26" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="62" rx="32" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="42" rx="22" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
        {[26, 34, 42, 50, 58, 66, 74].map((x) => (
          <circle key={x} cx={x} cy="82" r="5" fill={a} stroke={STROKE} strokeWidth={0.4} />
        ))}
        <ellipse cx="42" cy="40" rx="3.5" ry="5" fill="#0a0a0a" />
        <ellipse cx="58" cy="40" rx="3.5" ry="5" fill="#0a0a0a" />
        <polygon points="46,52 54,52 50,58" fill="#0a0a0a" />
      </g>
    );
  }
  if (kind === 'jigglypuff') {
    return (
      <g>
        <circle cx="50" cy="50" r="36" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="36" cy="20" rx="8" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="34,32 30,16 44,32" fill={c} stroke={STROKE} strokeWidth={1} />
        <polygon points="66,32 70,16 58,32" fill={c} stroke={STROKE} strokeWidth={1} />
        <ellipse cx="38" cy="48" rx="6" ry="9" fill={a} />
        <ellipse cx="62" cy="48" rx="6" ry="9" fill={a} />
        <circle cx="40" cy="44" r="2.5" fill="#f8fafc" />
        <circle cx="64" cy="44" r="2.5" fill="#f8fafc" />
        <path d="M42,66 Q50,72 58,66" stroke="#0a0a0a" fill="none" strokeWidth={1.5} />
      </g>
    );
  }
  if (kind === 'psyduck') {
    return (
      <g>
        <ellipse cx="50" cy="60" rx="24" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="30" rx="26" ry="22" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="42,20 40,4 44,20" fill="#0a0a0a" />
        <polygon points="50,18 50,2 52,18" fill="#0a0a0a" />
        <polygon points="58,20 60,4 56,20" fill="#0a0a0a" />
        <rect x="34" y="34" width="32" height="10" rx="3" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <circle cx="42" cy="26" r="5" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        <circle cx="58" cy="26" r="5" fill="#f8fafc" stroke={STROKE} strokeWidth={0.6} />
        <circle cx="42" cy="26" r="1.5" fill="#0a0a0a" />
        <circle cx="58" cy="26" r="1.5" fill="#0a0a0a" />
        <ellipse cx="24" cy="34" rx="7" ry="6" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="76" cy="34" rx="7" ry="6" fill={c} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'snorlax') {
    return (
      <g>
        <ellipse cx="50" cy="58" rx="38" ry="32" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path d="M12,50 Q50,20 88,50 Q86,60 50,60 Q14,60 12,50" fill={a} />
        <ellipse cx="50" cy="24" rx="18" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        <path d="M38,22 Q42,26 46,22" stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M54,22 Q58,26 62,22" stroke={a} fill="none" strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx="50" cy="30" rx="8" ry="4" fill={a} />
      </g>
    );
  }
  if (kind === 'gengar') {
    return (
      <g>
        <ellipse cx="50" cy="54" rx="34" ry="30" fill={c} stroke={STROKE} strokeWidth={SW} />
        <polygon points="30,32 22,10 40,28" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <polygon points="70,32 78,10 60,28" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <circle cx="38" cy="46" r="5" fill={a} stroke={STROKE} strokeWidth={0.5} />
        <circle cx="62" cy="46" r="5" fill={a} stroke={STROKE} strokeWidth={0.5} />
        <circle cx="38" cy="46" r="1.5" fill="#0a0a0a" />
        <circle cx="62" cy="46" r="1.5" fill="#0a0a0a" />
        <path d="M28,62 Q50,80 72,62" fill={a} stroke={STROKE} strokeWidth={0.8} />
        {[34, 42, 50, 58, 66].map((x) => (
          <polygon key={x} points={`${x - 2},63 ${x + 2},63 ${x},72`} fill="#f8fafc" />
        ))}
      </g>
    );
  }
  if (kind === 'charizard') {
    return (
      <g>
        {/* Wings */}
        <path d="M8,20 L28,42 L18,50 L34,44 L24,60 L38,44 L28,32 Z" fill="#38bdf8" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M92,20 L72,42 L82,50 L66,44 L76,60 L62,44 L72,32 Z" fill="#38bdf8" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Body */}
        <ellipse cx="50" cy="58" rx="20" ry="24" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="62" rx="12" ry="18" fill={a} />
        {/* Head */}
        <rect x="34" y="18" width="32" height="24" rx="4" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="36" rx="12" ry="4" fill={a} />
        <polygon points="34,18 26,6 42,20" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="66,18 74,6 58,20" fill={a} stroke={STROKE} strokeWidth={0.6} />
        <ellipse cx="42" cy="26" rx="3" ry="4" fill="#0a0a0a" />
        <ellipse cx="58" cy="26" rx="3" ry="4" fill="#0a0a0a" />
        {/* Tail with flame */}
        <path d="M30,80 Q10,84 4,74" stroke={c} fill="none" strokeWidth={8} strokeLinecap="round" />
        <polygon points="4,74 -2,60 8,68 -4,62" fill="#fb923c" stroke="#dc2626" strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'mew') {
    return (
      <g>
        {/* Sparkle aura */}
        {[[16, 20], [82, 22], [12, 60], [86, 62], [50, 8]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#fbcfe8" />
        ))}
        {/* Small floating body */}
        <ellipse cx="50" cy="60" rx="18" ry="20" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="38" rx="16" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Ears */}
        <polygon points="42,28 36,16 46,32" fill={c} stroke={STROKE} strokeWidth={0.8} />
        <polygon points="58,28 64,16 54,32" fill={c} stroke={STROKE} strokeWidth={0.8} />
        {/* Cyan eyes */}
        <ellipse cx="44" cy="38" rx="3" ry="4" fill={a} />
        <ellipse cx="56" cy="38" rx="3" ry="4" fill={a} />
        <circle cx="45" cy="36" r="1.2" fill="#f8fafc" />
        <circle cx="57" cy="36" r="1.2" fill="#f8fafc" />
        {/* Tiny nose */}
        <circle cx="50" cy="46" r="1.5" fill="#dc2626" />
        {/* Long curling tail */}
        <path d="M32,80 Q10,86 6,66 Q4,50 20,44 Q24,52 14,56" stroke={c} fill="none" strokeWidth={3} strokeLinecap="round" />
        <circle cx="20" cy="54" r="4" fill={c} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'beedrill') {
    // Flying Beedrill — yellow-black body with stingers and wings
    return (
      <g>
        {/* Wings (2 pairs) */}
        {[[24, 22], [76, 22], [22, 38], [78, 38]].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="16" ry="10" fill="#e5e7eb" stroke={STROKE} strokeWidth={SW} opacity="0.75" />
        ))}
        {/* Yellow body — 3 segments */}
        <ellipse cx="50" cy="34" rx="14" ry="12" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="52" rx="18" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        <ellipse cx="50" cy="72" rx="14" ry="10" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Black stripes */}
        <rect x="34" y="47" width="32" height="4" fill={a} />
        <rect x="34" y="55" width="32" height="4" fill={a} />
        <rect x="38" y="70" width="24" height="4" fill={a} />
        {/* Big red compound eyes */}
        <ellipse cx="42" cy="32" rx="4" ry="6" fill="#dc2626" />
        <ellipse cx="58" cy="32" rx="4" ry="6" fill="#dc2626" />
        {/* Antennae */}
        <path d="M42,20 Q38,8 32,4" stroke={a} fill="none" strokeWidth={1.6} />
        <path d="M58,20 Q62,8 68,4" stroke={a} fill="none" strokeWidth={1.6} />
        {/* Two big drill arm stingers */}
        <polygon points="30,50 8,54 24,58" fill="#e5e7eb" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <line x1="14" y1="55" x2="20" y2="55" stroke={a} strokeWidth={0.6} />
        <polygon points="70,50 92,54 76,58" fill="#e5e7eb" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        <line x1="80" y1="55" x2="86" y2="55" stroke={a} strokeWidth={0.6} />
        {/* Tail stinger */}
        <polygon points="46,78 54,78 50,94" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Thin legs */}
        <line x1="40" y1="60" x2="34" y2="76" stroke={a} strokeWidth={1.4} />
        <line x1="60" y1="60" x2="66" y2="76" stroke={a} strokeWidth={1.4} />
      </g>
    );
  }
  if (kind === 'mega_lucario') {
    // Standing Mega Lucario — blue jackal with wild yellow mane
    return (
      <g>
        {/* Wild yellow mane spikes above */}
        {[[26, 20], [42, 8], [58, 8], [74, 20]].map(([x, y], i) => (
          <polygon key={i} points={`${x - 6},${y + 6} ${x + 6},${y + 6} ${x},${y - 6}`}
            fill={a} stroke={STROKE} strokeWidth={0.5} />
        ))}
        {/* Blue head */}
        <ellipse cx="50" cy="32" rx="16" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Long black ear-appendages */}
        <path d="M32,20 Q22,8 20,16 L30,22 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        <path d="M68,20 Q78,8 80,16 L70,22 Z" fill="#0f172a" stroke={STROKE} strokeWidth={0.6} />
        {/* Black snout */}
        <ellipse cx="50" cy="38" rx="6" ry="4" fill="#0f172a" />
        {/* Red eyes */}
        <ellipse cx="44" cy="30" rx="2" ry="2.5" fill="#dc2626" />
        <ellipse cx="56" cy="30" rx="2" ry="2.5" fill="#dc2626" />
        {/* Blue body */}
        <ellipse cx="50" cy="60" rx="18" ry="16" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Yellow chest mane */}
        <polygon points="38,48 50,80 62,48 58,68 50,78 42,68" fill={a} stroke={STROKE} strokeWidth={0.6} />
        {/* Red chest circle */}
        <circle cx="50" cy="58" r="3" fill="#7f1d1d" stroke={STROKE} strokeWidth={0.5} />
        {/* Arms with black paws */}
        <path d="M34,52 L20,64" stroke={c} strokeWidth={5} strokeLinecap="round" />
        <circle cx="18" cy="66" r="5" fill="#0f172a" />
        <path d="M66,52 L80,64" stroke={c} strokeWidth={5} strokeLinecap="round" />
        <circle cx="82" cy="66" r="5" fill="#0f172a" />
        {/* Black legs */}
        <rect x="42" y="72" width="6" height="12" fill="#0f172a" />
        <rect x="52" y="72" width="6" height="12" fill="#0f172a" />
        {/* Black tail */}
        <path d="M64,68 Q78,74 82,86" stroke="#0f172a" fill="none" strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'absol') {
    // Standing Absol — quadruped with big sickle horn, shaggy fur, dark face
    return (
      <g>
        {/* Big sickle horn on left */}
        <path d="M16,44 Q2,32 6,10 L14,20 L18,36 L26,44 Z"
          fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Shaggy pale head */}
        <ellipse cx="34" cy="42" rx="18" ry="16" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Fluffy mane spikes */}
        <polygon points="46,20 56,12 52,28" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <polygon points="56,26 68,20 60,34" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Dark face mask */}
        <path d="M22,44 L34,38 L48,44 L44,54 L30,58 Z"
          fill={a} stroke={STROKE} strokeWidth={0.5} strokeLinejoin="round" />
        {/* Nose + eye */}
        <circle cx="24" cy="52" r="1.5" fill="#0a0a0a" />
        <ellipse cx="38" cy="46" rx="2.5" ry="3.5" fill="#dc2626" />
        {/* Pale body */}
        <ellipse cx="60" cy="60" rx="22" ry="14" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Body shaggy back tuft */}
        <polygon points="58,46 66,40 62,54" fill={c} stroke={STROKE} strokeWidth={0.5} />
        {/* Legs with dark paws */}
        <rect x="46" y="72" width="6" height="10" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <rect x="70" y="72" width="6" height="10" fill={c} stroke={STROKE} strokeWidth={0.6} />
        <rect x="46" y="80" width="6" height="4" fill={a} />
        <rect x="70" y="80" width="6" height="4" fill={a} />
        {/* Forked scythe tail */}
        <path d="M82,60 Q92,52 88,40" stroke={c} fill="none" strokeWidth={5} strokeLinecap="round" />
        <polygon points="88,40 96,32 90,44" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'growlithe') {
    // Standing Growlithe puppy
    return (
      <g>
        {/* Big cream mane */}
        {[[16, 32], [24, 20], [42, 14], [58, 14], [76, 20], [84, 32]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="9" fill={a} stroke={STROKE} strokeWidth={0.8} />
        ))}
        {/* Orange head */}
        <ellipse cx="50" cy="36" rx="20" ry="18" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark tiger stripes on head */}
        <path d="M34,30 Q38,36 34,42" stroke="#7c2d12" fill="none" strokeWidth={2} />
        <path d="M66,30 Q62,36 66,42" stroke="#7c2d12" fill="none" strokeWidth={2} />
        {/* Cream muzzle */}
        <ellipse cx="50" cy="44" rx="8" ry="5" fill={a} stroke={STROKE} strokeWidth={0.5} />
        {/* Eyes + nose */}
        <ellipse cx="42" cy="34" rx="2.5" ry="3.5" fill="#0a0a0a" />
        <ellipse cx="58" cy="34" rx="2.5" ry="3.5" fill="#0a0a0a" />
        <circle cx="50" cy="44" r="1.5" fill="#0a0a0a" />
        {/* Orange body */}
        <ellipse cx="50" cy="66" rx="18" ry="12" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Dark body stripes */}
        <path d="M40,58 Q40,66 42,72" stroke="#7c2d12" fill="none" strokeWidth={2} />
        <path d="M60,58 Q60,66 58,72" stroke="#7c2d12" fill="none" strokeWidth={2} />
        {/* Legs */}
        <rect x="36" y="72" width="6" height="10" fill={c} stroke={STROKE} strokeWidth={0.8} />
        <rect x="58" y="72" width="6" height="10" fill={c} stroke={STROKE} strokeWidth={0.8} />
        {/* Curled fluffy cream tail */}
        <path d="M68,60 Q84,54 82,42" stroke={a} fill="none" strokeWidth={8} strokeLinecap="round" />
        <circle cx="82" cy="42" r="6" fill={a} stroke={STROKE} strokeWidth={0.6} />
      </g>
    );
  }
  if (kind === 'gardevoir') {
    // Standing Gardevoir — elegant psychic
    return (
      <g>
        {/* Green helmet-hair */}
        <path d="M28,32 Q28,10 50,8 Q72,10 72,32 L68,42 L58,38 L50,42 L42,38 L32,42 Z"
          fill={a} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Pale white head */}
        <ellipse cx="50" cy="32" rx="16" ry="16" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Forward bang */}
        <path d="M34,22 L38,36 L46,32 Z" fill={a} stroke={STROKE} strokeWidth={0.5} />
        {/* Red eyes */}
        <ellipse cx="44" cy="34" rx="2" ry="3" fill="#dc2626" />
        <ellipse cx="56" cy="34" rx="2" ry="3" fill="#dc2626" />
        {/* Flowing white gown body */}
        <path d="M40,44 L60,44 L74,84 L26,84 Z" fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Red horn spike on chest running through the gown */}
        <polygon points="46,44 50,70 54,44" fill="#dc2626" stroke={STROKE} strokeWidth={0.6} />
        {/* Red back-horn peek */}
        <polygon points="46,30 50,10 54,30" fill="#dc2626" opacity="0.4" />
        {/* Slim arms */}
        <path d="M40,50 L28,66" stroke={c} strokeWidth={4} strokeLinecap="round" />
        <path d="M60,50 L72,66" stroke={c} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'lugia') {
    // Legendary Lugia — flying pose with big wings, long tail, back plates,
    // navy eye mask.
    return (
      <g>
        {/* Left wing */}
        <path d="M50,32 L4,12 L8,44 L20,38 L10,54 L26,44 L18,60 L34,50 L50,44 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Right wing */}
        <path d="M50,32 L96,12 L92,44 L80,38 L90,54 L74,44 L82,60 L66,50 L50,44 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Curved white body/neck */}
        <path d="M40,44 Q40,64 50,72 Q64,74 66,64 Q68,52 60,48 Z"
          fill={c} stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" />
        {/* Pale-blue belly */}
        <ellipse cx="54" cy="64" rx="10" ry="8" fill="#bfdbfe" />
        {/* Long tail with navy fin tip */}
        <path d="M56,72 Q72,80 82,72" stroke={c} fill="none" strokeWidth={5} strokeLinecap="round" />
        <polygon points="82,66 92,72 82,78" fill={a} stroke={STROKE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* Row of navy back plate-spikes */}
        {[[46, 46], [52, 44], [58, 46], [64, 50]].map(([x, y], i) => (
          <polygon key={i} points={`${x - 3},${y + 4} ${x + 3},${y + 4} ${x},${y - 4}`}
            fill={a} stroke={STROKE} strokeWidth={0.5} />
        ))}
        {/* Head */}
        <ellipse cx="42" cy="38" rx="10" ry="8" fill={c} stroke={STROKE} strokeWidth={SW} />
        {/* Beak-jaw */}
        <path d="M32,38 L22,38 L28,44 L34,42 Z" fill={c} stroke={STROKE} strokeWidth={0.6} />
        {/* Pointed back-crest on head */}
        <polygon points="46,32 54,20 48,42" fill={a} stroke={STROKE} strokeWidth={0.5} />
        {/* Navy eye mask */}
        <path d="M32,36 L40,34 L42,38 L38,40 Z" fill={a} />
        <ellipse cx="38" cy="37" rx="1" ry="0.8" fill="#f8fafc" />
      </g>
    );
  }

  return null;
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
