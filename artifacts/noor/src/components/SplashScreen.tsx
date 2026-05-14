import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'glow' | 'out'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2800);
    const t3 = setTimeout(() => onDone(), 3400);
    return () => { [t1, t2, t3].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: '#000000' }}
        >
          {/* Radial glow behind logo */}
          <motion.div
            className="absolute pointer-events-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: phase === 'glow' ? 0.55 : 0, scale: phase === 'glow' ? 1.2 : 0.7 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(193,154,107,0.5) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />

          {/* Logo circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.34, 1.26, 0.64, 1] }}
            className="relative flex items-center justify-center"
            style={{ width: 148, height: 148 }}
          >
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'glow' ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              style={{
                background: 'linear-gradient(135deg, rgba(193,154,107,0.6), rgba(193,154,107,0.08), rgba(193,154,107,0.4))',
                padding: 2,
                borderRadius: '50%',
              }}
            />

            {/* Inner circle with logo */}
            <div
              className="relative rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 140,
                height: 140,
                background: 'linear-gradient(145deg, #1a1208, #0d0d0d)',
                border: '1.5px solid rgba(193,154,107,0.35)',
                boxShadow: '0 0 40px rgba(193,154,107,0.25), 0 0 80px rgba(193,154,107,0.1)',
              }}
            >
              <img
                src="/logo.png"
                alt="نور"
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
