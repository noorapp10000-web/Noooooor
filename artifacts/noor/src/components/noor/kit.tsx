/* ────────────────────────────────────────────────────────────
   Noor Royal Kit — shared building blocks for every screen.
   Dark-only identity: Emerald Dark + Burnished Gold.
──────────────────────────────────────────────────────────── */
import { useEffect, type ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ── Digits ── */
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export function arNum(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => AR_DIGITS[Number(d)]);
}

/* ── 3D icon images from public/images/icons ── */
export type NoorIconName =
  | 'dua' | 'hadith' | 'headphones' | 'hifz' | 'mosque' | 'prayer'
  | 'qibla' | 'quran' | 'radio' | 'star' | 'tasbih' | 'wudu';

export function NoorImg({ name, size = 40, className, alt = '' }: { name: NoorIconName; size?: number; className?: string; alt?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/icons/${name}.webp`}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      loading="lazy"
      className={cn('object-contain select-none pointer-events-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]', className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ── Sticky glass page header ── */
export function PageHeader({
  title, subtitle, back = '/more', icon, right, children, className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string | (() => void) | null;
  icon?: NoorIconName;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [, navigate] = useLocation();
  const onBack = () => {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') navigate(back);
  };
  return (
    <header
      className={cn('sticky top-0 z-40 px-4 pb-3 border-b border-primary/10', className)}
      style={{
        paddingTop: 'max(0.9rem, env(safe-area-inset-top))',
        background: 'hsl(168 32% 5% / .72)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        backdropFilter: 'blur(18px) saturate(150%)',
      }}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {back !== null && (
          <button onClick={onBack} aria-label="رجوع" className="press w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 noor-btn-ghost">
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.35rem] leading-tight truncate text-gold-gradient">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
        </div>
        {right}
        {icon && <NoorImg name={icon} size={40} className="flex-shrink-0" />}
      </div>
      {children && <div className="max-w-lg mx-auto mt-3">{children}</div>}
    </header>
  );
}

/* ── Eight-pointed star medallion (Rub el Hizb) ── */
export function EightStar({ n, size = 30, active = false, className }: { n: number | string; size?: number; active?: boolean; className?: string }) {
  const label = typeof n === 'number' ? arNum(n) : n;
  const fs = String(label).length >= 3 ? 30 : String(label).length === 2 ? 36 : 42;
  return (
    <span className={cn('inline-block align-middle', className)} style={{ width: size, height: size, direction: 'ltr', unicodeBidi: 'isolate' }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
        <defs>
          <linearGradient id="noorStarGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(44 85% 78%)" />
            <stop offset="50%" stopColor="hsl(37 56% 58%)" />
            <stop offset="100%" stopColor="hsl(28 48% 36%)" />
          </linearGradient>
          <radialGradient id="noorStarCore" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="hsl(164 40% 20%)" />
            <stop offset="100%" stopColor="hsl(168 55% 7%)" />
          </radialGradient>
        </defs>
        <rect x="18" y="18" width="64" height="64" rx="5" fill="url(#noorStarCore)" stroke="url(#noorStarGold)" strokeWidth="5" />
        <rect x="18" y="18" width="64" height="64" rx="5" transform="rotate(45 50 50)" fill="url(#noorStarCore)" stroke="url(#noorStarGold)" strokeWidth="5" />
        <circle cx="50" cy="50" r="26" fill={active ? 'url(#noorStarGold)' : 'url(#noorStarCore)'} stroke="url(#noorStarGold)" strokeWidth="2" opacity={active ? 1 : 0.95} />
        <text x="50" y="53" textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={700}
          fontFamily="'IBM Plex Sans Arabic', 'Amiri', serif" fill={active ? 'hsl(168 40% 8%)' : 'hsl(42 70% 78%)'}>
          {label}
        </text>
      </svg>
    </span>
  );
}

/* ── Segmented chips / tabs ── */
export function ChipTabs<T extends string>({ items, value, onChange, className }: {
  items: { id: NoInfer<T>; label: ReactNode; icon?: ReactNode; badge?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar -mx-4 px-4 flex gap-2 overflow-x-auto', className)}>
      {items.map(it => (
        <button key={it.id} onClick={() => onChange(it.id)} className={cn('press noor-chip', value === it.id && 'noor-chip-on')}>
          {it.icon}{it.label}{it.badge}
        </button>
      ))}
    </div>
  );
}

/* ── Progress ring ── */
export function ProgressRing({ value, size = 64, stroke = 6, children, track = 'hsl(var(--primary) / 0.14)' }: {
  value: number; size?: number; stroke?: number; children?: ReactNode; track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  const id = `ring-${size}-${stroke}`;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(44 85% 74%)" />
            <stop offset="60%" stopColor="hsl(37 56% 56%)" />
            <stop offset="100%" stopColor="hsl(160 52% 40%)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ── Linear progress (RTL, gold → emerald) ── */
export function GoldBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div className={cn('h-1.5 rounded-full overflow-hidden bg-primary/10', className)}>
      <div className="h-full rounded-full transition-all duration-500 mr-0 ml-auto"
        style={{ width: `${v * 100}%`, marginInlineStart: 0, backgroundImage: 'linear-gradient(to left, hsl(44 85% 72%), hsl(37 56% 56%), hsl(160 52% 38%))' }} />
    </div>
  );
}

/* ── Gold badge ── */
export function GoldBadge({ children, className, tone = 'gold' }: { children: ReactNode; className?: string; tone?: 'gold' | 'emerald' | 'muted' }) {
  const toneCls = tone === 'gold'
    ? 'bg-primary/12 text-primary border-primary/35'
    : tone === 'emerald'
    ? 'bg-emerald/15 text-success border-emerald/40'
    : 'bg-secondary text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap', toneCls, className)}>
      {children}
    </span>
  );
}

/* ── Icon button ── */
export function IconBtn({ onClick, label, active, children, className, disabled }: {
  onClick?: () => void; label: string; active?: boolean; children: ReactNode; className?: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} aria-label={label} title={label} disabled={disabled}
      className={cn('press w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30',
        active ? 'noor-btn-gold' : 'noor-btn-ghost', className)}>
      {children}
    </button>
  );
}

/* ── Stat tile ── */
export function StatTile({ icon, label, value, sub, className }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('noor-card rounded-3xl p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center noor-emerald-orb">{icon}</div>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
      <span className="text-[1.6rem] font-black tabular-nums text-gold-gradient leading-none mt-1">{value}</span>
      <span className="text-xs font-bold text-foreground/80">{label}</span>
    </div>
  );
}

/* ── Bottom sheet ── */
export function Sheet({ open, onClose, title, children, maxH = '82vh' }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; maxH?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" dir="rtl">
          <motion.div className="absolute inset-0 bg-black/65 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative w-full max-w-lg rounded-t-[28px] flex flex-col noor-card-hero"
            style={{ maxHeight: maxH }}
          >
            <div className="absolute inset-0 rounded-t-[28px] overflow-hidden pointer-events-none"><div className="absolute inset-0 noor-pattern" style={{ opacity: 0.06 }} /></div>
            <div className="relative w-12 h-1.5 rounded-full mx-auto mt-3 mb-1 bg-primary/40" />
            {title && (
              <div className="relative flex items-center gap-3 px-5 pt-2 pb-3 border-b border-primary/15">
                <div className="flex-1 min-w-0 font-bold text-primary truncate">{title}</div>
                <button onClick={onClose} aria-label="إغلاق" className="press w-8 h-8 rounded-full flex items-center justify-center noor-btn-ghost"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="relative overflow-y-auto flex-1 px-5 py-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Ornamental footer ayah ── */
export function FooterAyah({ text, source }: { text: string; source?: string }) {
  return (
    <div className="mt-8 mb-4 text-center px-4">
      <div className="hairline-gold mb-4" />
      <p className="font-quran text-lg leading-loose text-primary/80">{text}</p>
      {source && <p className="text-[11px] text-muted-foreground mt-1">{source}</p>}
    </div>
  );
}

/* ── Empty / loading states ── */
export function EmptyState({ icon = 'star', title, hint }: { icon?: NoorIconName; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 gap-3">
      <NoorImg name={icon} size={64} className="opacity-80" />
      <p className="font-bold text-foreground/85">{title}</p>
      {hint && <p className="text-xs text-muted-foreground max-w-[260px]">{hint}</p>}
    </div>
  );
}

export function SkeletonList({ rows = 4, h = 'h-20' }: { rows?: number; h?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className={cn('rounded-3xl animate-pulse noor-card', h)} />)}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-8 h-8 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin', className)} />;
}

/* ── Live wave bars ── */
export function WaveBars({ active = true, bars = 5, height = 18, className }: { active?: boolean; bars?: number; height?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-[3px]', className)} style={{ height }} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="noor-wave-bar w-[3px] h-full"
          style={{ animationDelay: `${(i * 0.13) % 0.9}s`, animationDuration: `${0.75 + (i % 3) * 0.18}s`, animationPlayState: active ? 'running' : 'paused', transform: active ? undefined : 'scaleY(.3)' }} />
      ))}
    </span>
  );
}
