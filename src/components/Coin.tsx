type Props = { size?: number; className?: string };

/** Gold coin with star, designed to look like a real game coin. */
export function Coin({ size = 28, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coin-face" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="80%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
        <linearGradient id="coin-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#coin-rim)" />
      <circle cx="32" cy="32" r="25" fill="url(#coin-face)" />
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="none"
        stroke="#854d0e"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <path
        d="M32 14 L36.5 26 L49 26 L39 33.5 L43 46 L32 38 L21 46 L25 33.5 L15 26 L27.5 26 Z"
        fill="#854d0e"
        fillOpacity="0.55"
      />
      <ellipse cx="22" cy="22" rx="6" ry="3" fill="#fffbeb" fillOpacity="0.7" />
    </svg>
  );
}
