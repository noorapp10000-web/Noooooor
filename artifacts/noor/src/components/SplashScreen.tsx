import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import domeImg from '@assets/qb_lskhr_1774983189616.jpg';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'text' | 'full' | 'out'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 900);
    const t2 = setTimeout(() => setPhase('full'), 1800);
    const t3 = setTimeout(() => setPhase('out'), 4600);
    const t4 = setTimeout(() => onDone(), 5300);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] overflow-hidden"
          style={{ background: '#060810' }}
        >
          {/* ── Photo with Ken Burns zoom ── */}
          <motion.div
            className="absolute inset-0 w-full h-full"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 6, ease: 'easeOut' }}
          >
            <img
              src={domeImg}
              alt="قبة الصخرة"
              className="w-full h-full object-cover object-top"
              style={{ willChange: 'transform' }}
            />
          </motion.div>

          {/* ── Top dark fade (sky overlay) ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(6,8,16,0.55) 0%, rgba(6,8,16,0) 35%, rgba(6,8,16,0) 40%, rgba(6,8,16,0.72) 68%, rgba(6,8,16,0.97) 100%)',
            }}
          />

          {/* ── Golden ambient glow pulse ── */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'full' ? 0.18 : 0 }}
            transition={{ duration: 2 }}
            style={{
              background: 'radial-gradient(ellipse at 50% 42%, rgba(193,154,107,0.4) 0%, transparent 65%)',
            }}
          />

          {/* ── Text overlay — bottom ── */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-16 px-4">

            {/* Golden divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === 'text' || phase === 'full' ? 1 : 0,
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
              }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex items-center gap-3 mb-4"
            >
              <div style={{ width: 100, height: 1, background: 'linear-gradient(to left, rgba(193,154,107,0.9), transparent)' }} />
              <svg width={18} height={18} viewBox="0 0 20 20">
                <polygon
                  points="10,1 12.1,7.3 18.8,7.3 13.4,11.2 15.5,17.5 10,13.6 4.5,17.5 6.6,11.2 1.2,7.3 7.9,7.3"
                  fill="rgba(193,154,107,1)"
                />
              </svg>
              <div style={{ width: 100, height: 1, background: 'linear-gradient(to right, rgba(193,154,107,0.9), transparent)' }} />
            </motion.div>

            {/* بسم الله الرحمن الرحيم */}
            <motion.p
              dir="rtl"
              initial={{ opacity: 0, y: 18 }}
              animate={{
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
                y: phase === 'text' || phase === 'full' ? 0 : 18,
              }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{
                fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                fontSize: '1.7rem',
                lineHeight: 1.8,
                color: '#F5E6C8',
                textShadow:
                  '0 0 30px rgba(193,154,107,0.9), 0 0 60px rgba(193,154,107,0.45), 0 2px 12px rgba(0,0,0,0.95)',
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </motion.p>

            {/* App name */}
            <motion.p
              dir="rtl"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'full' ? 0.7 : 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: '0.72rem',
                color: 'rgba(193,154,107,0.9)',
                letterSpacing: '0.26em',
                marginTop: '0.65rem',
                textAlign: 'center',
              }}
            >
              رفيقك الإسلامي الشامل
            </motion.p>
          </div>

          {/* ── App logo top-center ── */}
          <motion.div
            className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: phase === 'full' ? 1 : 0, y: phase === 'full' ? 0 : -12 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <div
              className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, rgba(245,230,200,0.95), rgba(232,212,168,0.9))',
                boxShadow: '0 0 30px rgba(193,154,107,0.5), 0 0 60px rgba(193,154,107,0.25)',
                border: '1.5px solid rgba(193,154,107,0.6)',
              }}
            >
              <img src="/logo.png" alt="نور" className="w-full h-full object-contain" style={{ padding: '4px' }} />
            </div>
            <span
              style={{
                fontFamily: '"Amiri", "Scheherazade New", serif',
                fontSize: '1.8rem',
                color: '#F5E6C8',
                textShadow: '0 0 24px rgba(193,154,107,0.9), 0 0 50px rgba(193,154,107,0.4)',
                lineHeight: 1,
              }}
            >
              نُور
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
