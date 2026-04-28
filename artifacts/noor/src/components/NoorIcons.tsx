/* ────────────────────────────────────────────────────────────
   NoorIcons – 3D-style custom SVG icon components for the Noor app.
   All icons use currentColor as the base hue with layered depth
   overlays (white highlights + shadow fills) to create a 3D look.
──────────────────────────────────────────────────────────── */

import type { CSSProperties } from 'react';
interface P { className?: string; size?: number; style?: CSSProperties }

/* ── Prayer beads / Misbaha ───────────────────────────────── */
export function TasbihIcon({ className = '', size = 24, style }: P) {
  const cx = 12, cy = 14, r = 6.5;
  const beads = Array.from({ length: 12 }, (_, i) => {
    const deg = 15 + i * 30;
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      {/* 3D ring shadow */}
      <circle cx={cx} cy={cy + 0.4} r={r} stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" fill="none" />
      {/* ring string */}
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="1" fill="none" />
      {/* ring highlight */}
      <path d={`M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`}
        stroke="white" strokeWidth="0.7" strokeOpacity="0.35" fill="none" strokeLinecap="round" />

      {/* beads on ring with 3D sphere effect */}
      {beads.map((b, i) => {
        const br = i === 5 ? 1.6 : 1.1;
        return (
          <g key={i}>
            {/* bead shadow */}
            <circle cx={b.x + 0.2} cy={b.y + 0.2} r={br} fill="currentColor" fillOpacity="0.2" />
            {/* bead body */}
            <circle cx={b.x} cy={b.y} r={br} fill="currentColor" />
            {/* bead highlight */}
            <circle cx={b.x - br * 0.35} cy={b.y - br * 0.35} r={br * 0.35} fill="white" fillOpacity="0.45" />
          </g>
        );
      })}

      {/* imam bead (larger, extra 3D) */}
      <circle cx={12} cy={5.5} r={2.1} fill="currentColor" fillOpacity="0.25" />
      <circle cx={12} cy={5.5} r={1.8} fill="currentColor" />
      <circle cx={11.2} cy={4.7} r={0.7} fill="white" fillOpacity="0.5" />

      {/* short string + tail */}
      <line x1="12" y1="7.5" x2="12" y2="7.8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="12" y1="20.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="23" r="0.8" fill="currentColor" />
      <circle cx="11.65" cy="22.65" r="0.3" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

/* ── Morning / Sun ────────────────────────────────────────── */
export function MorningIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Glow ring */}
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.12" />
      {/* Sun body shadow */}
      <circle cx="12.3" cy="12.3" r="4" fill="currentColor" fillOpacity="0.25" />
      {/* Sun body */}
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      {/* Sun highlight */}
      <circle cx="10.3" cy="10.3" r="1.6" fill="white" fillOpacity="0.4" />
      <circle cx="10.8" cy="10.8" r="0.7" fill="white" fillOpacity="0.5" />

      {/* Rays with depth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 12 + 5.2 * Math.cos(rad), y1 = 12 + 5.2 * Math.sin(rad);
        const x2 = 12 + 6.8 * Math.cos(rad), y2 = 12 + 6.8 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth={i % 2 === 0 ? 1.5 : 1}
            strokeLinecap="round" strokeOpacity={i % 2 === 0 ? 0.9 : 0.55} />
        );
      })}
    </svg>
  );
}

/* ── Evening / Crescent moon + star ──────────────────────── */
export function EveningIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Moon shadow */}
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor" fillOpacity="0.25" transform="translate(0.3, 0.3)" />
      {/* Moon body */}
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
      {/* Moon highlight — inner edge */}
      <path d="M11.21 3 A9 9 0 0 0 3 12 Q5 6 11.21 3Z" fill="white" fillOpacity="0.25" />
      {/* Hot-spot */}
      <circle cx="7" cy="8" r="2.2" fill="white" fillOpacity="0.15" />

      {/* stars with 3D dot appearance */}
      {[
        { cx: 19.5, cy: 5.5, r: 0.8 },
        { cx: 17.2, cy: 3.5, r: 0.55 },
        { cx: 21.5, cy: 8.2, r: 0.55 },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.cx} cy={s.cy} r={s.r} fill="currentColor" fillOpacity="0.9" />
          <circle cx={s.cx - s.r * 0.3} cy={s.cy - s.r * 0.3} r={s.r * 0.4} fill="white" fillOpacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

/* ── Sleep ────────────────────────────────────────────────── */
export function SleepIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Moon shadow */}
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"
        fill="currentColor" fillOpacity="0.25" transform="translate(0.3, 0.3)" />
      {/* Moon body */}
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="currentColor" />
      {/* Highlight */}
      <path d="M12 3 Q8 4 6 7 Q5 4 8 3 Z" fill="white" fillOpacity="0.25" />
      {/* Z letters with depth */}
      <text x="13.5" y="10.5" fontSize="4.5" fontWeight="bold" fill="currentColor" fillOpacity="0.95"
        stroke="none" fontFamily="sans-serif">z</text>
      <text x="15.5" y="8" fontSize="3.5" fontWeight="bold" fill="currentColor" fillOpacity="0.7"
        stroke="none" fontFamily="sans-serif">z</text>
      <text x="17.2" y="6" fontSize="2.5" fontWeight="bold" fill="currentColor" fillOpacity="0.45"
        stroke="none" fontFamily="sans-serif">z</text>
    </svg>
  );
}

/* ── Raised hands (dua / after prayer) ───────────────────── */
export function DuaHandsIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Left hand shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Left hand */}
      <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left highlight */}
      <path d="M6 10V8.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Right hand shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M18 10V7a1 1 0 0 0-2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 11V9a1 1 0 0 0-2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10V8a1 1 0 0 0-2 0v5.5c0 1.38 1.12 2.5 2.5 2.5H18a3 3 0 0 0 3-3v-2a1 1 0 0 0-2 0"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Right hand */}
      <path d="M18 10V7a1 1 0 0 0-2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11V9a1 1 0 0 0-2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10V8a1 1 0 0 0-2 0v5.5c0 1.38 1.12 2.5 2.5 2.5H18a3 3 0 0 0 3-3v-2a1 1 0 0 0-2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right highlight */}
      <path d="M18 10V8.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Light rays from above */}
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="9.5" y1="1.8" x2="10.2" y2="3.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" />
      <line x1="14.5" y1="1.8" x2="13.8" y2="3.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

/* ── Mosque / Minaret ─────────────────────────────────────── */
export function MosqueIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow layer */}
      <g opacity="0.2" transform="translate(0.4, 0.4)">
        <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" />
        <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" />
      </g>

      {/* Main dome fill */}
      <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" fillOpacity="0.85" />
      {/* Dome highlight */}
      <path d="M6.5 9 Q7 5.5 12 4.5" stroke="white" strokeWidth="0.9" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
      {/* Dome bright spot */}
      <path d="M8 8 Q9 5.5 12 5" stroke="white" strokeWidth="0.6" strokeOpacity="0.3" fill="none" strokeLinecap="round" />

      {/* Front wall — lighter (facing viewer) */}
      <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" fillOpacity="0.7" />
      {/* Side depth line */}
      <line x1="19" y1="10" x2="21.5" y2="12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
      <polygon points="19,10 21.5,12 21.5,22 19,20" fill="currentColor" fillOpacity="0.3" />

      {/* Door arch — depth */}
      <path d="M10 20 L10 15 Q12 13 14 15 L14 20" fill="currentColor" fillOpacity="0.5" />
      <path d="M10 20 L10 15 Q12 13 14 15 L14 20" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />

      {/* Left minaret */}
      <rect x="2" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.75" />
      <rect x="2" y="8" width="1.2" height="12" rx="0.5" fill="white" fillOpacity="0.12" />
      <path d="M2 8 Q3.25 5.5 4.5 8" fill="currentColor" fillOpacity="0.9" />
      <circle cx="3.25" cy="5" r="0.6" fill="currentColor" />
      <circle cx="2.95" cy="4.7" r="0.25" fill="white" fillOpacity="0.6" />

      {/* Right minaret */}
      <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.65" />
      <path d="M19.5 8 Q20.75 5.5 22 8" fill="currentColor" fillOpacity="0.8" />
      <circle cx="20.75" cy="5" r="0.6" fill="currentColor" fillOpacity="0.85" />

      {/* Windows with glow */}
      <circle cx="9" cy="13" r="0.9" fill="white" fillOpacity="0.35" />
      <circle cx="15" cy="13" r="0.9" fill="white" fillOpacity="0.25" />

      {/* Crescent on top */}
      <path d="M11.2 3.5 Q12 2.2 13 3.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Open Quran Book ──────────────────────────────────────── */
export function QuranBookIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Book shadow */}
      <g opacity="0.2" transform="translate(0.4,0.4)">
        <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" />
        <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" />
      </g>

      {/* Left page — highlight face (lit from left-top) */}
      <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" fillOpacity="0.75" />
      <path d="M12 4 C10.5 4.3 5.5 5.3 3.8 7.5 L3.8 10 C5.5 7.8 10.5 6.8 12 6.5 Z"
        fill="white" fillOpacity="0.2" />

      {/* Right page — shadow face */}
      <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" fillOpacity="0.55" />

      {/* Spine — bright edge */}
      <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.9" />
      <line x1="12" y1="4" x2="12" y2="17" stroke="white" strokeWidth="0.7" strokeOpacity="0.4" />

      {/* Left page lines */}
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="5.5" y1={y} x2="10.5" y2={y} strokeWidth="0.8"
          stroke="currentColor" strokeOpacity="0.55" />
      ))}

      {/* Right page lines */}
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="13.5" y1={y} x2="18.5" y2={y} strokeWidth="0.8"
          stroke="currentColor" strokeOpacity="0.4" />
      ))}

      {/* Ornamental bismillah mark on left page */}
      <circle cx="8" cy="7.5" r="1" fill="currentColor" fillOpacity="0.3" />
      <circle cx="8" cy="7.5" r="0.4" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

/* ── Microphone / Reciters ────────────────────────────────── */
export function MicIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Mic body shadow */}
      <rect x="9.3" y="2.3" width="6" height="11" rx="3" fill="currentColor" fillOpacity="0.2" />
      {/* Mic body */}
      <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" fillOpacity="0.7" />
      {/* Mic highlight */}
      <path d="M10.5 3.5 L10.5 10" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
      <rect x="9.5" y="2.5" width="2" height="10" rx="2" fill="white" fillOpacity="0.12" />

      {/* Mic grille lines */}
      {[6, 8, 10].map(y => (
        <line key={y} x1="10" y1={y} x2="14" y2={y} stroke="currentColor"
          strokeWidth="0.6" strokeOpacity="0.5" />
      ))}

      {/* Stand */}
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Smart reader / Book + lightning ─────────────────────── */
export function SmartReaderIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Book shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" />
      </g>

      {/* Book body */}
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        fill="currentColor" fillOpacity="0.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Book spine highlight */}
      <line x1="6.5" y1="2" x2="6.5" y2="17" stroke="white" strokeWidth="0.8" strokeOpacity="0.35" />

      {/* Top-left gloss */}
      <path d="M7.5 3 L18 3 L18 6 Q12 5 7.5 4 Z" fill="white" fillOpacity="0.12" />

      {/* Lightning bolt — glowing */}
      <path d="M13 6l-3 5h4l-3 5" stroke="white" strokeWidth="2.2" strokeOpacity="0.2"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6l-3 5h4l-3 5" stroke="currentColor" strokeWidth="1.8"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Islamic 8-pointed star (Asma Al-Husna) ──────────────── */
export function IslamicStarIcon({ className = '', size = 24 }: P) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const outerAngle = (i * 45 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
    pts.push(`${12 + 9 * Math.cos(outerAngle)},${12 + 9 * Math.sin(outerAngle)}`);
    pts.push(`${12 + 4.5 * Math.cos(innerAngle)},${12 + 4.5 * Math.sin(innerAngle)}`);
  }
  /* Lighter top half points for 3D effect */
  const topPts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const outerAngle = (i * 45 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
    const ox = 12 + 9 * Math.cos(outerAngle);
    const oy = 12 + 9 * Math.sin(outerAngle);
    const ix = 12 + 4.5 * Math.cos(innerAngle);
    const iy = 12 + 4.5 * Math.sin(innerAngle);
    if (oy < 12 || iy < 12) {
      topPts.push(`${ox},${oy}`);
      topPts.push(`${ix},${iy}`);
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow */}
      <polygon points={pts.join(' ')} fill="currentColor" fillOpacity="0.15"
        transform="translate(0.4,0.4)" />
      {/* Main star body */}
      <polygon points={pts.join(' ')} fill="currentColor" fillOpacity="0.8"
        stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Top highlight overlay */}
      <polygon points={pts.join(' ')} fill="white" fillOpacity="0.15"
        clipPath="url(#topHalf)" />
      <defs>
        <clipPath id="islamicStarTop">
          <rect x="0" y="0" width="24" height="12" />
        </clipPath>
      </defs>
      {/* Center gem */}
      <circle cx="12" cy="12" r="2.8" fill="currentColor" fillOpacity="0.25" transform="translate(0.2,0.2)" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="11.1" cy="11.1" r="1" fill="white" fillOpacity="0.55" />

      {/* Outer stroke */}
      <polygon points={pts.join(' ')} fill="none"
        stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" strokeOpacity="0.7" />
    </svg>
  );
}

/* ── Moon (dark mode) ─────────────────────────────────────── */
export function MoonIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow */}
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Moon body */}
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor" fillOpacity="0.85" />
      {/* Inner crescent highlight */}
      <path d="M11.21 3 Q7 5 5 10 Q5 7 8 4 Z" fill="white" fillOpacity="0.22" />
      {/* Rim highlight */}
      <path d="M21 12.79 Q20 10 18 8" stroke="white" strokeWidth="0.8" strokeOpacity="0.25" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Scroll / Tafsir ─────────────────────────────────────── */
export function ScrollIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Page body */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="currentColor" fillOpacity="0.65" />
      {/* Fold corner */}
      <polyline points="14 2 14 8 20 8"
        fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Page highlight */}
      <path d="M6 4 L6 20 Q5 20 4 19 L4 4 Q4 2 6 2 Z" fill="white" fillOpacity="0.15" />
      <path d="M6 4 L14 4 Q12 3 8 2.5 L6 2 Z" fill="white" fillOpacity="0.2" />
      {/* Text lines */}
      {[13, 17].map(y => (
        <line key={y} x1="8" y1={y} x2="16" y2={y}
          stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
      ))}
      <line x1="8" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Headphones / Listening ───────────────────────────────── */
export function HeadphonesIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Band shadow */}
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"
        stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" strokeLinecap="round"
        transform="translate(0.3,0.3)" />
      {/* Band */}
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Band highlight */}
      <path d="M6 14 Q6 9 12 7" stroke="white" strokeWidth="0.9" strokeOpacity="0.35" fill="none" strokeLinecap="round" />

      {/* Right ear cup */}
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"
        fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="17.5" r="0.7" fill="white" fillOpacity="0.5" />

      {/* Left ear cup */}
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
        fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="17.5" r="0.7" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

/* ── Radio / Broadcast ────────────────────────────────────── */
export function RadioIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Antenna */}
      <line x1="12" y1="2" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="2" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="2" r="0.8" fill="currentColor" />

      {/* Radio body shadow */}
      <rect x="3.3" y="7.3" width="18" height="13" rx="2" fill="currentColor" fillOpacity="0.2" />
      {/* Radio body */}
      <rect x="3" y="7" width="18" height="13" rx="2" fill="currentColor" fillOpacity="0.65" />
      {/* Top face highlight */}
      <path d="M5 7 L19 7 Q21 7 21 9 L21 9 Q21 8 19 8 L5 8 Q3 8 3 9 L3 9 Q3 7 5 7 Z"
        fill="white" fillOpacity="0.25" />
      {/* Left depth side */}
      <path d="M3 7 L3 20 Q3 20 4 20 L4 8 Q4 7 3 7 Z" fill="white" fillOpacity="0.12" />

      {/* Speaker grille (circle) shadow */}
      <circle cx="9.3" cy="13.8" r="2.5" fill="currentColor" fillOpacity="0.15" />
      {/* Speaker cone */}
      <circle cx="9" cy="13.5" r="2.5" fill="currentColor" fillOpacity="0.5"
        stroke="currentColor" strokeWidth="0.8" />
      <circle cx="9" cy="13.5" r="1.2" fill="currentColor" fillOpacity="0.7" />
      <circle cx="9" cy="13.5" r="0.5" fill="white" fillOpacity="0.6" />

      {/* Knobs — 3D spheres */}
      {[{ cy: 11 }, { cy: 15 }].map((k, i) => (
        <g key={i}>
          <circle cx="16.3" cy={k.cy + 0.3} r="1.2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="16" cy={k.cy} r="1.2" fill="currentColor" />
          <circle cx="15.5" cy={k.cy - 0.5} r="0.45" fill="white" fillOpacity="0.55" />
        </g>
      ))}
    </svg>
  );
}

/* ── Map Pin with Mosque ──────────────────────────────────── */
export function MosqueMapIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Pin shadow */}
      <path d="M12 22s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Pin fill */}
      <path d="M12 22s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"
        fill="currentColor" fillOpacity="0.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pin highlight */}
      <path d="M8 5 Q10 3 13 4" stroke="white" strokeWidth="1" strokeOpacity="0.35" fill="none" strokeLinecap="round" />

      {/* Mosque dome inside */}
      <path d="M9 13.5 Q9 10 12 10 Q15 10 15 13.5"
        fill="white" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Mosque body */}
      <rect x="9" y="13.5" width="6" height="3.5" rx="0.3"
        fill="white" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
      {/* Crescent */}
      <path d="M11.5 9 Q12 7.5 13 9" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── House / Home ─────────────────────────────────────────── */
export function HomeEnterIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Roof */}
      <path d="M3 12L12 4l9 8" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Roof shadow side */}
      <polygon points="12,4 21,12 21,13 12,5" fill="currentColor" fillOpacity="0.18" />

      {/* Wall body */}
      <path d="M5 12 L5 21 L19 21 L19 12"
        fill="currentColor" fillOpacity="0.65" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Left highlight wall */}
      <path d="M5 12 L5 21 L6 21 L6 12 Z" fill="white" fillOpacity="0.2" />
      {/* Wall top gloss */}
      <path d="M5 12 L19 12 L19 14 Q12 13.5 5 14 Z" fill="white" fillOpacity="0.15" />

      {/* Door */}
      <path d="M9 21V15h6v6"
        fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.3"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11.5" cy="18" r="0.5" fill="white" fillOpacity="0.7" />

      {/* Windows */}
      <rect x="14.5" y="14" width="2.5" height="2.5" rx="0.3"
        fill="white" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8" />
      <rect x="7" y="14" width="2.5" height="2.5" rx="0.3"
        fill="white" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/* ── Food/Bowl ────────────────────────────────────────────── */
export function FoodIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 14 Q3 20 12 20 Q21 20 21 14 Z"
        fill="currentColor" fillOpacity="0.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 14 Q3 8 12 8 Q21 8 21 14"
        fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bowl highlight */}
      <path d="M5 14 Q5 11 9 10" stroke="white" strokeWidth="0.9" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
      <line x1="12" y1="4" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5 Q12 3 15 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Travel / Compass ─────────────────────────────────────── */
export function TravelIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Compass shadow */}
      <circle cx="12.3" cy="12.3" r="9" fill="currentColor" fillOpacity="0.15" />
      {/* Compass body */}
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12"
        stroke="currentColor" strokeWidth="1.5" />
      {/* Compass highlight */}
      <path d="M6 7 Q8 4 12 3" stroke="white" strokeWidth="1.2" strokeOpacity="0.35" fill="none" strokeLinecap="round" />

      {/* North needle (filled) */}
      <polygon points="12,7 14.5,12 12,10.5 9.5,12" fill="currentColor" fillOpacity="0.9" />
      <polygon points="12,7 12,10.5 9.5,12" fill="white" fillOpacity="0.3" />

      {/* South needle (outline) */}
      <polygon points="12,17 9.5,12 12,13.5 14.5,12"
        fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="0.8" />

      {/* Cardinal marks */}
      {[
        [12, 3, 12, 4.5], [12, 19.5, 12, 21],
        [3, 12, 4.5, 12], [19.5, 12, 21, 12],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.7" />
      ))}

      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="11.6" cy="11.6" r="0.4" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

/* ── Rain / Weather ───────────────────────────────────────── */
export function RainIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Cloud shadow */}
      <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Cloud body */}
      <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"
        fill="currentColor" fillOpacity="0.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cloud highlight */}
      <path d="M7 11 Q7 7 11 7" stroke="white" strokeWidth="1" strokeOpacity="0.35" fill="none" strokeLinecap="round" />

      {/* Raindrops */}
      {[
        [8, 19, 8, 21],
        [12, 17, 12, 19],
        [16, 19, 16, 21],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeOpacity={1 - i * 0.1} />
      ))}
    </svg>
  );
}

/* ── Shield / Protection from distress ───────────────────── */
export function ShieldHeartIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shield shadow */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Shield body */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="currentColor" fillOpacity="0.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shield highlight (top left face) */}
      <path d="M4 8 L4 5.3 L12 2.5 L12 5 Z" fill="white" fillOpacity="0.2" />
      <path d="M4 5.3 L12 2.5 L12 5 L4 7.5 Z" fill="white" fillOpacity="0.15" />

      {/* Heart */}
      <path d="M9.5 11.5 Q9.5 9.5 11 9.5 Q12 9.5 12 10.5 Q12 9.5 13 9.5 Q14.5 9.5 14.5 11.5 Q14.5 13 12 14.5 Q9.5 13 9.5 11.5Z"
        fill="currentColor" fillOpacity="0.9" />
      <circle cx="10.8" cy="10.5" r="0.55" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

/* ── Prophet star ─────────────────────────────────────────── */
export function ProphetIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow */}
      <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 16.5 L5.5 21 L8 13.5 L2 9 L9.5 9 Z"
        fill="currentColor" fillOpacity="0.2" transform="translate(0.3,0.3)" />
      {/* Star body */}
      <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 16.5 L5.5 21 L8 13.5 L2 9 L9.5 9 Z"
        fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      {/* Top face highlight */}
      <path d="M12 2 L14.5 9 L12 10 L9.5 9 Z" fill="white" fillOpacity="0.25" />
      {/* Center glow */}
      <circle cx="12" cy="12.5" r="2" fill="white" fillOpacity="0.2" />
    </svg>
  );
}

/* ── Supplication hands with light rays ───────────────────── */
export function SupplicationIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Light rays */}
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="7.5" y1="2.5" x2="8.5" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
      <line x1="16.5" y1="2.5" x2="15.5" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />

      {/* Left hand shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M6 11V8a1.5 1.5 0 0 1 3 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 11V9a1.5 1.5 0 0 1 3 0v5c0 1.7-1.3 3-3 3H7.5A3.5 3.5 0 0 1 4 13.5v-1"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Left hand */}
      <path d="M6 11V8a1.5 1.5 0 0 1 3 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 12.5V10a1.5 1.5 0 0 1 3 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 11V9a1.5 1.5 0 0 1 3 0v5c0 1.7-1.3 3-3 3H7.5A3.5 3.5 0 0 1 4 13.5v-1"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right hand shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M18 11V8a1.5 1.5 0 0 0-3 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 11V9a1.5 1.5 0 0 0-3 0v5c0 1.7 1.3 3 3 3h1.5A3.5 3.5 0 0 0 20 13.5v-1"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Right hand */}
      <path d="M18 11V8a1.5 1.5 0 0 0-3 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 12.5V10a1.5 1.5 0 0 0-3 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 11V9a1.5 1.5 0 0 0-3 0v5c0 1.7 1.3 3 3 3h1.5A3.5 3.5 0 0 0 20 13.5v-1"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Hadith / Prophetic narration ─────────────────────────── */
export function HadithIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Shadow */}
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M2 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H2V4z" fill="currentColor" />
        <path d="M22 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V4z" fill="currentColor" />
      </g>

      {/* Left page */}
      <path d="M2 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H2V4z"
        fill="currentColor" fillOpacity="0.8" />
      {/* Left page highlight */}
      <path d="M2 4 L2 18 Q2.5 16 3 16 L3 5 Q3 4 4 4 Z" fill="white" fillOpacity="0.2" />
      <path d="M2 4 L9 4 Q10 4.5 10 6 Q8 5 2 5 Z" fill="white" fillOpacity="0.18" />

      {/* Right page (shadow face) */}
      <path d="M22 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V4z"
        fill="currentColor" fillOpacity="0.55" />

      {/* Spine */}
      <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Text lines — left */}
      <line x1="5" y1="9"  x2="9"  y2="9"  stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="5" y1="12" x2="9"  y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="5" y1="15" x2="8"  y2="15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      {/* Text lines — right */}
      <line x1="15" y1="9"  x2="19" y2="9"  stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="15" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
      <line x1="15" y1="15" x2="18" y2="15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
    </svg>
  );
}

/* ── Qibla Compass ────────────────────────────────────────── */
export function QiblaCompassIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Outer ring shadow */}
      <circle cx="12.3" cy="12.3" r="9.5" fill="currentColor" fillOpacity="0.15" />
      {/* Outer ring */}
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.1"
        stroke="currentColor" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity="0.08"
        stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
      {/* Top gloss */}
      <path d="M6 7 Q9 3.5 15 4" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" fill="none" strokeLinecap="round" />

      {/* Kaaba square */}
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5"
        fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="0.8" />
      {/* Kaaba highlight */}
      <rect x="9.5" y="9.5" width="2" height="5" rx="0.5" fill="white" fillOpacity="0.2" />

      {/* Compass needle — north */}
      <polygon points="12,3 13,8 12,7 11,8" fill="currentColor" fillOpacity="0.9" />
      {/* Compass needle — south */}
      <polygon points="12,21 11,16 12,17 13,16" fill="currentColor" fillOpacity="0.4" />

      {/* Cardinal marks */}
      {[[12, 2.5, 12, 3.5], [12, 20.5, 12, 21.5], [2.5, 12, 3.5, 12], [20.5, 12, 21.5, 12]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
      ))}
    </svg>
  );
}

/* ── Hifz / Quran Memorisation ────────────────────────────── */
export function HifzIcon({ className = '', size = 24, style }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      {/* Shadow */}
      <circle cx="12.35" cy="13.35" r="7.2" fill="currentColor" fillOpacity="0.18" />

      {/* Mind / head orb */}
      <circle cx="12" cy="13" r="7.2" fill="currentColor" fillOpacity="0.13" />
      <circle cx="12" cy="13" r="7.2" stroke="currentColor" strokeWidth="1.55" />

      {/* Orb highlight arc */}
      <path d="M6.2 10.2 Q8 6.8 13 6.2" stroke="white" strokeWidth="1"
        strokeOpacity="0.38" fill="none" strokeLinecap="round" />

      {/* Open Quran inside the orb */}
      {/* Left page */}
      <path d="M12 10.2 C10.4 10.2 7.2 11 6.4 12.2 L6.4 17.2 C7.2 16 10.4 15.2 12 15.2"
        fill="currentColor" fillOpacity="0.68" />
      {/* Right page */}
      <path d="M12 10.2 C13.6 10.2 16.8 11 17.6 12.2 L17.6 17.2 C16.8 16 13.6 15.2 12 15.2"
        fill="currentColor" fillOpacity="0.48" />
      {/* Spine */}
      <line x1="12" y1="10.2" x2="12" y2="15.2"
        stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.9" strokeLinecap="round" />
      <line x1="12" y1="10.2" x2="12" y2="15.2"
        stroke="white" strokeWidth="0.55" strokeOpacity="0.45" strokeLinecap="round" />
      {/* Book highlight on left page */}
      <path d="M12 10.2 L12 11 Q9.5 11.3 7 12.5 L6.8 12.2 C7.6 11 10.5 10.2 12 10.2Z"
        fill="white" fillOpacity="0.15" />

      {/* Light rays of نور above the orb */}
      <line x1="12" y1="1" x2="12" y2="3.8" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <line x1="8.6" y1="1.9" x2="9.55" y2="4.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.75" />
      <line x1="15.4" y1="1.9" x2="14.45" y2="4.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.75" />
      <line x1="6" y1="3.8" x2="7.4" y2="5.7" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.48" />
      <line x1="18" y1="3.8" x2="16.6" y2="5.7" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.48" />

      {/* Glowing source dot at rays origin */}
      <circle cx="12" cy="2.8" r="1.15" fill="currentColor" />
      <circle cx="11.55" cy="2.35" r="0.48" fill="white" fillOpacity="0.62" />
    </svg>
  );
}
