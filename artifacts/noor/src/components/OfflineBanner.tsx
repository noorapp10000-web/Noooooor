import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '@/hooks/use-dark-mode';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBack, setShowBack] = useState(false);
  const dark = useDarkMode();

  useEffect(() => {
    let backTimer: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setIsOffline(false);
      setShowBack(true);
      backTimer = setTimeout(() => setShowBack(false), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBack(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(backTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4"
          style={{
            background: dark
              ? 'linear-gradient(135deg, #1a0e00 0%, #2c1a04 100%)'
              : 'linear-gradient(135deg, #2c1a04 0%, #3d2507 100%)',
            borderBottom: '1px solid rgba(193,154,107,0.35)',
            fontFamily: '"Tajawal", sans-serif',
          }}
          dir="rtl"
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" style={{ color: '#C19A6B' }} />
          <span className="text-sm font-bold" style={{ color: '#e8d9b8' }}>
            لا يوجد اتصال — الصوت والبث الحي غير متاح
          </span>
        </motion.div>
      )}

      {!isOffline && showBack && (
        <motion.div
          key="online"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4"
          style={{
            background: 'linear-gradient(135deg, #0a2010 0%, #0d2e16 100%)',
            borderBottom: '1px solid rgba(34,197,94,0.3)',
            fontFamily: '"Tajawal", sans-serif',
          }}
          dir="rtl"
        >
          <Wifi className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
          <span className="text-sm font-bold" style={{ color: '#bbf7d0' }}>
            عاد الاتصال بالإنترنت ✓
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
