/* Shared step-by-step guide pieces for Wudu & Prayer lessons. */
import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Lightbulb } from 'lucide-react';
import { GoldBadge, EightStar, arNum } from './kit';
import { cn } from '@/lib/utils';

export type StepKind = 'فرض' | 'ركن' | 'واجب' | 'سنة' | 'مستحب';

export interface GuideStep {
  id: number;
  title: string;
  subtitle?: string;
  kind?: StepKind;
  arabic?: string;
  transliteration?: string;
  meaning?: string;
  points?: string[];
  note?: string;
  repetitions?: number;
  img: string;
}

export function KindBadge({ kind }: { kind?: StepKind }) {
  if (!kind) return null;
  const tone = kind === 'فرض' || kind === 'ركن' ? 'gold' : kind === 'واجب' || kind === 'سنة' ? 'emerald' : 'muted';
  return <GoldBadge tone={tone}>{kind}</GoldBadge>;
}

/** Horizontal, scrollable timeline of steps with thumbnails. */
export function StepTimeline({ steps, current, done, onSelect }: {
  steps: GuideStep[]; current: number; done: Set<number>; onSelect: (i: number) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-step="${current}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current]);
  return (
    <div ref={wrap} className="no-scrollbar -mx-4 px-4 overflow-x-auto">
      <div className="relative flex gap-2 min-w-max py-1">
        <div className="absolute top-[26px] right-6 left-6 h-[2px] bg-primary/15" />
        {steps.map((s, i) => {
          const on = i === current;
          const ok = done.has(i);
          return (
            <button key={s.id} data-step={i} onClick={() => onSelect(i)} className="press relative flex flex-col items-center w-[60px]">
              <span className={cn('relative z-10 w-[52px] h-[52px] rounded-full overflow-hidden border-2 transition-all',
                on ? 'border-primary shadow-gold scale-105' : ok ? 'border-success/70' : 'border-primary/20 opacity-70')}>
                <img src={s.img} alt="" className="w-full h-full object-cover object-top bg-secondary" />
                {ok && !on && <span className="absolute inset-0 bg-background/55 flex items-center justify-center"><Check className="w-5 h-5 text-success" /></span>}
              </span>
              <span className={cn('text-[10px] mt-1 leading-tight text-center line-clamp-2', on ? 'text-primary font-bold' : 'text-muted-foreground')}>{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepCard({ step, index, total, extra }: { step: GuideStep; index: number; total: number; extra?: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step.id} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.25 }}
        className="rounded-[28px] overflow-hidden noor-card">
        <div className="relative h-[230px] flex items-end justify-center overflow-hidden noor-card-hero !rounded-none !border-0 !border-b !border-primary/20">
          <div className="absolute inset-0 noor-pattern" />
          <div className="absolute w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / .22), transparent 70%)' }} />
          <motion.img key={step.img} src={step.img} alt={step.title} className="relative z-10 h-[215px] object-contain object-bottom drop-shadow-2xl"
            initial={{ opacity: 0, y: 10, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} />
          <span className="absolute top-3 right-3 z-20"><EightStar n={index + 1} size={40} active /></span>
          <span className="absolute top-4 left-3 z-20 text-[11px] text-foreground/70 bg-background/50 backdrop-blur px-2.5 py-1 rounded-full">{arNum(index + 1)} / {arNum(total)}</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <KindBadge kind={step.kind} />
            {step.subtitle && <span className="text-xs text-muted-foreground">{step.subtitle}</span>}
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">{step.title}</h2>

          {step.arabic && (
            <div className="rounded-2xl p-4 mb-3 bg-primary/5 border border-primary/15 text-center">
              {step.repetitions && <p className="text-xs font-bold text-primary mb-1">× {arNum(step.repetitions)} مرات</p>}
              <p className="font-quran leading-[2.2] text-foreground" style={{ fontSize: step.arabic.length > 110 ? '1.05rem' : '1.35rem' }}>{step.arabic}</p>
              {step.transliteration && <p className="text-xs italic text-muted-foreground mt-1" dir="ltr">{step.transliteration}</p>}
              {step.meaning && step.meaning !== step.arabic && <p className="text-xs text-muted-foreground mt-1">{step.meaning}</p>}
            </div>
          )}

          {step.points && step.points.length > 0 && (
            <ul className="flex flex-col gap-2.5 mb-3">
              {step.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full noor-emerald-orb flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary">{arNum(i + 1)}</span>
                  <p className="text-sm leading-relaxed text-foreground/90">{p}</p>
                </li>
              ))}
            </ul>
          )}

          {extra}

          {step.note && (
            <div className="flex items-start gap-2.5 rounded-2xl p-3 bg-emerald/10 border border-emerald/25">
              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-foreground/85">{step.note}</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function StepControls({ index, total, onPrev, onNext, onSkip, nextLabel, done }: {
  index: number; total: number; onPrev: () => void; onNext: () => void; onSkip: () => void; nextLabel: string; done: boolean;
}) {
  return (
    <div className="flex-shrink-0 px-4 pt-3 glass rounded-t-[28px]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-lg mx-auto flex gap-3">
        <button onClick={onPrev} disabled={index === 0} aria-label="السابق" className="press w-14 h-14 rounded-2xl noor-btn-ghost flex items-center justify-center disabled:opacity-30">
          <ChevronRight className="w-6 h-6" />
        </button>
        <button onClick={onNext} className={cn('press flex-1 h-14 rounded-2xl text-[15px] flex items-center justify-center gap-2', done ? 'noor-btn-emerald' : 'noor-btn-gold')}>
          {done && <Check className="w-5 h-5" />}{nextLabel}
        </button>
        <button onClick={onSkip} disabled={index >= total - 1} aria-label="التالي" className="press w-14 h-14 rounded-2xl noor-btn-ghost flex items-center justify-center disabled:opacity-30">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

/** A numbered list of rulings (pillars / sunnahs / invalidators). */
export function RulingList({ title, intro, items, tone = 'gold' }: {
  title: string; intro?: string; items: { title: string; desc?: string }[]; tone?: 'gold' | 'emerald' | 'danger';
}) {
  return (
    <div>
      <div className={cn('rounded-3xl p-4 mb-3 relative overflow-hidden', tone === 'danger' ? 'noor-card border-destructive/40' : 'noor-card-hero')}>
        <div className="absolute inset-0 noor-pattern" />
        <p className="relative font-bold text-lg text-gold-gradient">{title}</p>
        {intro && <p className="relative text-xs text-muted-foreground mt-1 leading-relaxed">{intro}</p>}
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <motion.div key={it.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}
            className={cn('noor-card rounded-2xl p-3.5 flex items-start gap-3', tone === 'danger' && 'border-destructive/25')}>
            <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
              tone === 'danger' ? 'bg-destructive/15 text-[hsl(0_80%_72%)]' : tone === 'emerald' ? 'bg-emerald/15 text-success' : 'noor-btn-gold')}>{arNum(i + 1)}</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">{it.title}</p>
              {it.desc && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
