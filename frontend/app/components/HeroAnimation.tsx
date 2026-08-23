/**
 * Background layer for the landing hero: bars growing out of a baseline while
 * coins drop into them. Pure SVG + CSS keyframes — no dependencies, no hooks,
 * so it costs nothing at runtime. Rendered at low opacity behind the headline.
 */

const BARS = [
  { x: 80, h: 96 },
  { x: 176, h: 138 },
  { x: 272, h: 118 },
  { x: 368, h: 186 },
  { x: 464, h: 214 },
  { x: 560, h: 258 },
  { x: 656, h: 306 },
];

const BAR_W = 52;
const BASELINE = 360;
const COIN_START = 30;

export default function HeroAnimation() {
  return (
    <svg
      viewBox="0 0 788 400"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className="h-auto w-full"
    >
      <style>{`
        .fp-bar {
          transform-box: fill-box;
          transform-origin: bottom;
          animation: fp-grow 2.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes fp-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }

        .fp-coin {
          animation: fp-fall 3.6s cubic-bezier(0.55, 0, 0.85, 0.4) infinite;
        }
        @keyframes fp-fall {
          0%        { transform: translateY(0); opacity: 0; }
          8%        { opacity: 1; }
          62%, 100% { transform: translateY(var(--fall)); opacity: 0; }
        }

        .fp-glow { animation: fp-pulse 5s ease-in-out infinite; }
        @keyframes fp-pulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.7; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fp-bar, .fp-coin, .fp-glow {
            animation: none;
          }
          .fp-coin { opacity: 0.9; }
        }
      `}</style>

      <defs>
        <linearGradient id="fp-bar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="fp-glow-fill">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft light behind the tallest bars */}
      <ellipse
        className="fp-glow"
        cx="600"
        cy="300"
        rx="240"
        ry="150"
        fill="url(#fp-glow-fill)"
      />

      {/* baseline */}
      <line
        x1="40"
        y1={BASELINE}
        x2="748"
        y2={BASELINE}
        stroke="#34d399"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {BARS.map((b, i) => (
        <g key={b.x}>
          <rect
            className="fp-bar"
            x={b.x}
            y={BASELINE - b.h}
            width={BAR_W}
            height={b.h}
            rx="8"
            fill="url(#fp-bar-fill)"
            stroke="#34d399"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            style={{ animationDelay: `${i * 0.12}s` }}
          />

          {/* coin dropping into the top of this bar */}
          <g
            className="fp-coin"
            style={
              {
                "--fall": `${BASELINE - b.h - COIN_START - 22}px`,
                animationDelay: `${0.9 + i * 0.28}s`,
              } as React.CSSProperties
            }
          >
            <circle
              cx={b.x + BAR_W / 2}
              cy={COIN_START}
              r="13"
              fill="#0f172a"
              stroke="#34d399"
              strokeWidth="2"
            />
            <text
              x={b.x + BAR_W / 2}
              y={COIN_START + 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#34d399"
            >
              ₹
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
}
