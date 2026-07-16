import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import BatteryOpt from '@/lib/battery-plugin';

const STORAGE_KEY = 'noor_battery_opt_asked';

export function BatteryOptPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const alreadyAsked = localStorage.getItem(STORAGE_KEY);
    if (alreadyAsked) return;

    const timer = setTimeout(async () => {
      try {
        const { ignoring } = await BatteryOpt.isIgnoring();
        if (!ignoring) setVisible(true);
      } catch {}
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function handleAllow() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    try {
      await BatteryOpt.requestIgnore();
    } catch {
      try { await BatteryOpt.openBatterySettings(); } catch {}
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center pb-6 px-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #FDF8EE 0%, #F5EDD6 100%)',
              border: '1.5px solid rgba(193,154,107,0.35)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 2px 0 rgba(255,255,255,0.5) inset',
            }}
          >
            <div className="p-6">
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg,#C19A6B22,#C19A6B44)', border: '1.5px solid rgba(193,154,107,0.4)' }}
                >
                  🔋
                </div>

                <div>
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: '#2C1E16' }}
                  >
                    اسمح لنُور بالعمل دائماً
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: '#7A5230' }}
                  >
                    بعض الأجهزة (HONOR · Huawei) بتوقف التطبيق في الخلفية.
                    <br />
                    لضمان وصول إشعارات الصلاة في وقتها، يُرجى استثناء نُور من توفير
                    الطاقة.
                  </p>
                </div>
              </div>

              <div
                className="rounded-2xl p-4 mb-5"
                style={{ background: 'rgba(193,154,107,0.1)', border: '1px solid rgba(193,154,107,0.25)' }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B6035' }}
                >
                  كيف تفعل ذلك؟
                </p>
                {[
                  'اضغط "السماح الآن" أدناه',
                  'ستُفتح إعدادات الجهاز تلقائياً',
                  'اختر "بدون قيود" أو "لا تحسّن"',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 mb-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: '#C19A6B', color: '#fff' }}
                    >
                      {i + 1}
                    </div>
                    <p
                      className="text-xs"
                      style={{ fontFamily: '"Tajawal", sans-serif', color: '#5A3A1A' }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllow}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    background: 'linear-gradient(135deg, #C19A6B 0%, #d4aa7d 50%, #b8894f 100%)',
                    color: '#1a0e00',
                    boxShadow: '0 4px 20px rgba(193,154,107,0.4)',
                  }}
                >
                  السماح الآن
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-2xl text-sm transition-all active:scale-95"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    color: '#9B7043',
                    background: 'rgba(193,154,107,0.12)',
                    border: '1px solid rgba(193,154,107,0.25)',
                  }}
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
