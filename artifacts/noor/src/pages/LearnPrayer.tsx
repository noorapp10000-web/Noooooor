import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';

/* ── Prayer time SVG icons ───────────────────────────────────── */
function FajrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 5C15.5 5 13.2 5.8 11.3 7.1C14.7 8.6 17 12 17 16C17 20 14.7 23.4 11.3 24.9C13.2 26.2 15.5 27 18 27C24.1 27 29 22.1 29 16C29 9.9 24.1 5 18 5Z" fill="rgba(255,255,255,0.95)"/>
      <circle cx="26" cy="8" r="1.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="30" cy="13" r="1" fill="rgba(255,255,255,0.55)"/>
      <circle cx="24" cy="5.5" r="0.9" fill="rgba(255,255,255,0.6)"/>
      <line x1="4" y1="31" x2="32" y2="31" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DuhrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="8" fill="rgba(255,255,255,0.95)"/>
      <line x1="18" y1="4" x2="18" y2="8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="28" x2="18" y2="32" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="8" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8.7" y1="8.7" x2="11.5" y2="11.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24.5" y1="24.5" x2="27.3" y2="27.3" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27.3" y1="8.7" x2="24.5" y2="11.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11.5" y1="24.5" x2="8.7" y2="27.3" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function AsrIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="17" r="7" fill="rgba(255,255,255,0.95)"/>
      <line x1="18" y1="4" x2="18" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="17" x2="32" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8.7" y1="7.7" x2="11.5" y2="10.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27.3" y1="7.7" x2="24.5" y2="10.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="29" x2="32" y2="29" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 29 Q18 20 25 29" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
    </svg>
  );
}

function MaghribIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <clipPath id="maghrib-clip">
        <rect x="0" y="0" width="36" height="27"/>
      </clipPath>
      <circle cx="18" cy="27" r="10" fill="rgba(255,255,255,0.95)" clipPath="url(#maghrib-clip)"/>
      <line x1="18" y1="4" x2="18" y2="9" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="9" y2="18" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7.5" y1="8.5" x2="11" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28.5" y1="8.5" x2="25" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="27" x2="34" y2="27" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IshaIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="9" fill="rgba(255,255,255,0.9)"/>
      <circle cx="22" cy="14" r="5.5" fill="rgba(255,255,255,0.12)" stroke="none"/>
      <path d="M22 13C20.3 13 18.9 14.1 18.4 15.6C19.1 15.2 19.9 15.2 20.6 15.6C21.9 14.5 21.9 12.7 22 13Z" fill="rgba(0,0,0,0.2)"/>
      <circle cx="28" cy="8" r="1.3" fill="rgba(255,255,255,0.75)"/>
      <circle cx="9" cy="7" r="0.9" fill="rgba(255,255,255,0.6)"/>
      <circle cx="30" cy="22" r="1" fill="rgba(255,255,255,0.55)"/>
      <circle cx="6" cy="26" r="0.8" fill="rgba(255,255,255,0.5)"/>
      <circle cx="26" cy="28" r="1.1" fill="rgba(255,255,255,0.6)"/>
    </svg>
  );
}

function MosqueIcon({ size = 44, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect x="3" y="14" width="5" height="24" rx="1.5" fill={color} opacity="0.88"/>
      <path d="M5.5 14 C3.5 14 2 12.5 2 10.5 L9 10.5 C9 12.5 7.5 14 5.5 14Z" fill={color} opacity="0.88"/>
      <rect x="4.5" y="7" width="2" height="4" rx="1" fill={color} opacity="0.88"/>
      <circle cx="5.5" cy="6.5" r="1.2" fill={color} opacity="0.7"/>
      <rect x="36" y="14" width="5" height="24" rx="1.5" fill={color} opacity="0.88"/>
      <path d="M38.5 14 C36.5 14 35 12.5 35 10.5 L42 10.5 C42 12.5 40.5 14 38.5 14Z" fill={color} opacity="0.88"/>
      <rect x="37.5" y="7" width="2" height="4" rx="1" fill={color} opacity="0.88"/>
      <circle cx="38.5" cy="6.5" r="1.2" fill={color} opacity="0.7"/>
      <rect x="8" y="28" width="28" height="10" rx="1" fill={color}/>
      <path d="M8 28 Q8 14 22 14 Q36 14 36 28Z" fill={color}/>
      <path d="M17 38 L17 32 Q17 28 22 28 Q27 28 27 32 L27 38Z" fill={color === 'white' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'}/>
      <path d="M22 14.5 C21.2 14.5 20.5 15.2 20.5 16 C21 15.7 21.6 15.7 22 16 C22.9 15.3 22.9 14.3 22 14.5Z" fill={color === 'white' ? '#C19A6B' : 'rgba(255,255,255,0.8)'} opacity="0.85"/>
    </svg>
  );
}

function TipIcon({ size = 16, color = '#C19A6B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
      <line x1="8" y1="7" x2="8" y2="11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="4.8" r="0.9" fill={color}/>
    </svg>
  );
}

/* ── Body-position SVG illustrations ────────────────────────── */
function StandingFig({ color = '#C4956A' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 160" className="w-full h-full">
      <circle cx="40" cy="20" r="13" fill={color} />
      <rect x="26" y="35" width="28" height="50" rx="10" fill={color} />
      <rect x="14" y="37" width="12" height="44" rx="6" fill={color} />
      <rect x="54" y="37" width="12" height="44" rx="6" fill={color} />
      <rect x="26" y="83" width="12" height="55" rx="6" fill={color} />
      <rect x="42" y="83" width="12" height="55" rx="6" fill={color} />
    </svg>
  );
}

function HandsRaisedFig() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full">
      <circle cx="50" cy="20" r="13" fill="#C4956A" />
      <rect x="36" y="35" width="28" height="50" rx="10" fill="#C4956A" />
      <rect x="6" y="28" width="12" height="40" rx="6" fill="#C4956A" transform="rotate(-35 12 48)" />
      <rect x="76" y="16" width="12" height="40" rx="6" fill="#C4956A" transform="rotate(35 82 36)" />
      <rect x="36" y="83" width="12" height="55" rx="6" fill="#C4956A" />
      <rect x="52" y="83" width="12" height="55" rx="6" fill="#C4956A" />
      <path d="M18 22 L30 14" stroke="#C19A6B" strokeWidth="2" strokeDasharray="3 2" opacity="0.7" />
      <path d="M82 22 L70 14" stroke="#C19A6B" strokeWidth="2" strokeDasharray="3 2" opacity="0.7" />
    </svg>
  );
}

function QuranReadingFig() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full">
      <circle cx="50" cy="20" r="13" fill="#C4956A" />
      <rect x="36" y="35" width="28" height="50" rx="10" fill="#C4956A" />
      <rect x="14" y="48" width="14" height="30" rx="6" fill="#C4956A" />
      <rect x="72" y="48" width="14" height="30" rx="6" fill="#C4956A" />
      <rect x="22" y="62" width="56" height="36" rx="8" fill="#2d6a4f" />
      <rect x="26" y="68" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="26" y="74" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="26" y="80" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="54" y="68" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="54" y="74" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="54" y="80" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
      <rect x="36" y="83" width="12" height="55" rx="6" fill="#C4956A" />
      <rect x="52" y="83" width="12" height="55" rx="6" fill="#C4956A" />
    </svg>
  );
}

function RukuFig() {
  return (
    <svg viewBox="0 0 140 120" className="w-full h-full">
      <ellipse cx="70" cy="112" rx="50" ry="6" fill="rgba(193,154,107,0.15)" />
      <circle cx="110" cy="28" r="13" fill="#C4956A" />
      <rect x="36" y="46" width="78" height="16" rx="8" fill="#C4956A" />
      <rect x="100" y="34" width="14" height="36" rx="7" fill="#C4956A" />
      <rect x="28" y="54" width="14" height="42" rx="7" fill="#C4956A" />
      <rect x="44" y="54" width="14" height="42" rx="7" fill="#C4956A" />
      <rect x="68" y="62" width="12" height="46" rx="6" fill="#C4956A" />
      <rect x="84" y="62" width="12" height="46" rx="6" fill="#C4956A" />
    </svg>
  );
}

function ItidalFig() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full">
      <circle cx="50" cy="20" r="13" fill="#C4956A" />
      <rect x="36" y="35" width="28" height="50" rx="10" fill="#C4956A" />
      <rect x="16" y="48" width="14" height="36" rx="7" fill="#C4956A" />
      <rect x="70" y="48" width="14" height="36" rx="7" fill="#C4956A" />
      <rect x="36" y="83" width="12" height="55" rx="6" fill="#C4956A" />
      <rect x="52" y="83" width="12" height="55" rx="6" fill="#C4956A" />
      <path d="M50 8 L50 2" stroke="#F5C842" strokeWidth="2" />
      <circle cx="50" cy="1" r="2.5" fill="#F5C842" />
    </svg>
  );
}

function SujoodFig() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-full">
      <ellipse cx="80" cy="112" rx="68" ry="6" fill="rgba(193,154,107,0.15)" />
      <circle cx="26" cy="78" r="13" fill="#C4956A" />
      <rect x="14" y="88" width="26" height="20" rx="10" fill="#C4956A" />
      <rect x="40" y="68" width="70" height="16" rx="8" fill="#C4956A" />
      <rect x="82" y="54" width="14" height="32" rx="7" fill="#C4956A" />
      <rect x="98" y="54" width="14" height="32" rx="7" fill="#C4956A" />
      <rect x="40" y="82" width="14" height="26" rx="7" fill="#C4956A" />
      <rect x="56" y="82" width="14" height="26" rx="7" fill="#C4956A" />
      <rect x="110" y="68" width="14" height="40" rx="7" fill="#C4956A" />
      <rect x="126" y="68" width="14" height="40" rx="7" fill="#C4956A" />
    </svg>
  );
}

function JulusFig() {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full">
      <ellipse cx="60" cy="130" rx="50" ry="7" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="24" r="13" fill="#C4956A" />
      <rect x="46" y="38" width="28" height="44" rx="10" fill="#C4956A" />
      <rect x="22" y="46" width="14" height="36" rx="7" fill="#C4956A" />
      <rect x="84" y="46" width="14" height="36" rx="7" fill="#C4956A" />
      <ellipse cx="38" cy="100" rx="22" ry="12" fill="#C4956A" />
      <ellipse cx="82" cy="100" rx="22" ry="12" fill="#C4956A" />
      <rect x="40" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(15 47 101)" />
      <rect x="66" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(-15 73 101)" />
    </svg>
  );
}

function TashahhudFig() {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-full">
      <ellipse cx="60" cy="130" rx="50" ry="7" fill="rgba(193,154,107,0.15)" />
      <circle cx="60" cy="24" r="13" fill="#C4956A" />
      <rect x="46" y="38" width="28" height="44" rx="10" fill="#C4956A" />
      <rect x="22" y="46" width="14" height="36" rx="7" fill="#C4956A" />
      <rect x="84" y="46" width="14" height="36" rx="7" fill="#C4956A" />
      <ellipse cx="38" cy="100" rx="22" ry="12" fill="#C4956A" />
      <ellipse cx="82" cy="100" rx="22" ry="12" fill="#C4956A" />
      <rect x="40" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(15 47 101)" />
      <rect x="66" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(-15 73 101)" />
      <rect x="80" y="48" width="7" height="22" rx="3.5" fill="#C4956A" />
      <rect x="81" y="38" width="5" height="16" rx="2.5" fill="#D4A574" />
    </svg>
  );
}

function TasleemFig() {
  return (
    <svg viewBox="0 0 140 140" className="w-full h-full">
      <ellipse cx="70" cy="130" rx="55" ry="7" fill="rgba(193,154,107,0.15)" />
      <circle cx="70" cy="24" r="13" fill="#C4956A" />
      <rect x="56" y="38" width="28" height="44" rx="10" fill="#C4956A" />
      <ellipse cx="46" cy="100" rx="22" ry="12" fill="#C4956A" />
      <ellipse cx="94" cy="100" rx="22" ry="12" fill="#C4956A" />
      <rect x="48" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(15 55 101)" />
      <rect x="78" y="82" width="14" height="38" rx="7" fill="#C4956A" transform="rotate(-15 85 101)" />
      <circle cx="84" cy="22" r="13" fill="#C4956A" />
      <circle cx="89" cy="20" r="4" fill="#5D3A1A" />
      <path d="M96 18 Q108 22 112 32" stroke="#C19A6B" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* ── Prayer steps data ─────────────────────────────────────── */
interface PrayerStep {
  id: number;
  title: string;
  position: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  note?: string;
  repetitions?: number;
  Fig: () => JSX.Element;
  color: string;
}

const PRAYER_STEPS: PrayerStep[] = [
  {
    id: 1, title: 'النية', position: 'قيام',
    arabic: 'نويتُ أن أصلي',
    transliteration: 'Nawaytu an uṣallī',
    meaning: 'أنوي الصلاة بقلبك — ولا تُلفظ النية',
    note: 'النية محلها القلب فقط، ولا يشترط التلفظ بها',
    Fig: StandingFig, color: '#2d6a4f',
  },
  {
    id: 2, title: 'تكبيرة الإحرام', position: 'قيام — يرفع يديه',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    meaning: 'الله أكبر',
    note: 'يرفع يديه حذو منكبيه أو شحمتي أذنيه عند التكبير',
    Fig: HandsRaisedFig, color: '#1e4d7b',
  },
  {
    id: 3, title: 'دعاء الاستفتاح', position: 'قيام — سنة',
    arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
    transliteration: 'Subḥānaka Allāhumma wa biḥamdik, wa tabāraka ismuk, wa taʿālā jadduk, wa lā ilāha ghayruk',
    meaning: 'سبحانك اللهم وبحمدك، وتبارك اسمك، وتعالى جدك، ولا إله غيرك',
    note: 'دعاء مستحب في أول كل صلاة — يُقرأ في السر',
    Fig: StandingFig, color: '#4a2a7a',
  },
  {
    id: 4, title: 'التعوذ والبسملة', position: 'قيام',
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ۝ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Aʿūdhu billāhi min ash-shayṭān ir-rajīm · Bismillāh ir-Raḥmān ir-Raḥīm',
    meaning: 'أعوذ بالله من الشيطان الرجيم — بسم الله الرحمن الرحيم',
    note: 'يُقرأ سراً في الصلاة الجهرية وسراً في السرية',
    Fig: StandingFig, color: '#7a3a1e',
  },
  {
    id: 5, title: 'قراءة الفاتحة', position: 'قيام — ركن',
    arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ مَٰلِكِ يَوْمِ ٱلدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ۝ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    transliteration: 'Al-ḥamdu lillāhi rabb il-ʿālamīn...',
    meaning: 'سورة الفاتحة كاملة — ركن من أركان الصلاة',
    note: 'لا صلاة لمن لم يقرأ بفاتحة الكتاب — ثم يقول: آمين',
    Fig: QuranReadingFig, color: '#2d6a4f',
  },
  {
    id: 6, title: 'قراءة سورة قصيرة', position: 'قيام — سنة',
    arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
    transliteration: 'Qul huwa Allāhu aḥad...',
    meaning: 'سورة الإخلاص — مثال على السورة القصيرة',
    note: 'في الركعة الأولى والثانية فقط — يمكن قراءة أي سورة',
    Fig: QuranReadingFig, color: '#5c3a7a',
  },
  {
    id: 7, title: 'الركوع', position: 'ركوع — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: 'Subḥāna Rabbiya al-ʿAẓīm',
    meaning: 'سبحان ربي العظيم',
    note: 'يكبّر عند الانحناء، ويضع يديه على ركبتيه، وتستوي ظهره',
    repetitions: 3,
    Fig: RukuFig, color: '#1a5c5c',
  },
  {
    id: 8, title: 'الاعتدال من الركوع', position: 'قيام — ركن',
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا وَلَكَ الْحَمْدُ، حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    transliteration: 'Samiʿa Allāhu liman ḥamidah · Rabbanā wa laka al-ḥamd',
    meaning: 'سمع الله لمن حمده — ربنا ولك الحمد',
    note: 'يرفع من الركوع قائلاً «سمع الله لمن حمده» ثم يكمل الدعاء',
    Fig: ItidalFig, color: '#6b3a0f',
  },
  {
    id: 9, title: 'السجدة الأولى', position: 'سجود — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subḥāna Rabbiya al-Aʿlā',
    meaning: 'سبحان ربي الأعلى',
    note: 'يسجد على سبعة أعضاء: الجبهة+الأنف، الكفّان، الركبتان، أطراف القدمين',
    repetitions: 3,
    Fig: SujoodFig, color: '#3a1a5c',
  },
  {
    id: 10, title: 'الجلوس بين السجدتين', position: 'جلوس',
    arabic: 'رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي',
    transliteration: 'Rabb ighfir lī, Rabb ighfir lī',
    meaning: 'ربِّ اغفر لي',
    note: 'يجلس مفترشاً بين السجدتين ثم يسجد مرة ثانية',
    Fig: JulusFig, color: '#7a3a1e',
  },
  {
    id: 11, title: 'السجدة الثانية', position: 'سجود — ركن',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subḥāna Rabbiya al-Aʿlā',
    meaning: 'سبحان ربي الأعلى',
    note: 'ثم يقوم للركعة التالية مكبِّراً، ويفعل مثل ذلك في كل ركعة',
    repetitions: 3,
    Fig: SujoodFig, color: '#3a1a5c',
  },
  {
    id: 12, title: 'التشهد الأخير', position: 'جلوس — ركن',
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'At-taḥiyyātu lillāh waṣ-ṣalawātu waṭ-ṭayyibāt...',
    meaning: 'التحيات لله — يُرفع السبّابة عند الشهادة',
    note: 'في آخر ركعة يجلس جلسةً للتشهد ثم يُكمل الصلاة الإبراهيمية',
    Fig: TashahhudFig, color: '#1e4d2b',
  },
  {
    id: 13, title: 'الصلاة الإبراهيمية', position: 'جلوس — بعد التشهد',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: 'Allāhumma ṣalli ʿalā Muḥammad wa ʿalā āli Muḥammad...',
    meaning: 'اللهم صلِّ على محمد وعلى آل محمد',
    note: 'ثم يتعوذ ويدعو بما شاء قبل التسليم',
    Fig: TashahhudFig, color: '#0f3d2e',
  },
  {
    id: 14, title: 'التسليم', position: 'جلوس — ركن',
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    transliteration: 'As-salāmu ʿalaykum wa raḥmatullāh',
    meaning: 'السلام عليكم ورحمة الله',
    note: 'يلتفت يميناً ثم يساراً — وبهذا تنتهي الصلاة',
    Fig: TasleemFig, color: '#4a1e2a',
  },
];

interface Prayer {
  name: string;
  rakaas: number;
  color: string;
  Icon: (props: { size?: number }) => JSX.Element;
}

const PRAYERS: Prayer[] = [
  { name: 'الفجر',  rakaas: 2, color: '#1e3a5c', Icon: FajrIcon },
  { name: 'الظهر',  rakaas: 4, color: '#8B6340', Icon: DuhrIcon },
  { name: 'العصر',  rakaas: 4, color: '#7a3a1e', Icon: AsrIcon },
  { name: 'المغرب', rakaas: 3, color: '#5c2d6e', Icon: MaghribIcon },
  { name: 'العشاء', rakaas: 4, color: '#0f2d4d', Icon: IshaIcon },
];

export function LearnPrayer() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';
  const [step, setStep] = useState(0);
  const [selectedPrayer, setSelectedPrayer] = useState<number | null>(null);

  const total = PRAYER_STEPS.length;
  const current = PRAYER_STEPS[step];
  const progress = ((step + 1) / total) * 100;

  const bg        = dark ? '#0f0c07' : '#fdfaf5';
  const cardBg    = dark ? '#1a1208' : '#ffffff';
  const border    = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.25)';
  const textColor  = dark ? '#e8d8b0' : '#3d2a0e';
  const mutedColor = dark ? 'rgba(232,216,176,0.5)' : 'rgba(61,42,14,0.45)';

  /* ── Prayer selector screen ── */
  if (selectedPrayer === null) {
    return (
      <div className="flex flex-col h-[100dvh]" style={{ background: bg, direction: 'rtl' }}>
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 flex-shrink-0">
          <button onClick={() => navigate('/more')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}>
            <ChevronRight size={20} />
          </button>
          <h1 className="text-xl font-black" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
            تعلم الصلاة
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {/* Intro */}
          <div className="rounded-3xl p-5 mb-5 flex items-start gap-4"
            style={{ background: 'linear-gradient(135deg,#2d6a4f,#1b4332)' }}>
            <div className="flex-shrink-0 mt-0.5">
              <MosqueIcon size={44} color="white" />
            </div>
            <div>
              <p className="text-white font-black text-lg mb-1" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                خطوات الصلاة كاملة
              </p>
              <p className="text-sm leading-relaxed" style={{ fontFamily: '"Tajawal",sans-serif', color: 'rgba(255,255,255,0.75)' }}>
                دليل مفصل لكل خطوة في الصلاة مع النص العربي والتشكيل والشرح — مناسب للمسلم الجديد والمراجع
              </p>
            </div>
          </div>

          {/* Prayer selector */}
          <p className="font-bold mb-3 text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
            اختار الصلاة لمعرفة عدد ركعاتها — الخطوات واحدة لكل الصلوات
          </p>
          <div className="flex flex-col gap-3 mb-6">
            {PRAYERS.map((p, i) => (
              <button key={i} onClick={() => { setSelectedPrayer(i); setStep(0); }}
                className="flex items-center gap-4 p-4 rounded-2xl text-right transition-transform active:scale-95"
                style={{ background: p.color, border: `1px solid rgba(255,255,255,0.12)` }}>
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <p.Icon size={32} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-lg text-white" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                    صلاة {p.name}
                  </p>
                  <p className="text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: 'rgba(255,255,255,0.65)' }}>
                    {p.rakaas} ركعات
                  </p>
                </div>
                <ChevronLeft size={20} color="rgba(255,255,255,0.5)" />
              </button>
            ))}
          </div>

          {/* Steps overview */}
          <p className="font-bold mb-3 text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
            الخطوات ({total} خطوة)
          </p>
          <div className="flex flex-col gap-2">
            {PRAYER_STEPS.map((s, i) => (
              <button key={s.id} onClick={() => { setSelectedPrayer(0); setStep(i); }}
                className="flex items-center gap-3 p-3 rounded-2xl text-right"
                style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: s.color, minWidth: 32 }}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <p className="flex-1 font-bold text-sm" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
                  {s.title}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ fontFamily: '"Tajawal",sans-serif', background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}>
                  {s.position.split(' — ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Step-by-step screen ── */
  const prayer = PRAYERS[selectedPrayer];

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: bg, direction: 'rtl' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
        <button onClick={() => setSelectedPrayer(null)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}>
          <ChevronRight size={20} />
        </button>
        <div className="text-center flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: prayer.color }}>
              <prayer.Icon size={18} />
            </div>
            <p className="font-black text-base" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
              صلاة {prayer.name}
            </p>
          </div>
          <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
            خطوة {step + 1} من {total}
          </p>
        </div>
        <div className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B', fontFamily: '"Tajawal",sans-serif' }}>
          {prayer.rakaas} ركعات
        </div>
      </div>

      {/* Progress */}
      <div className="mx-4 h-1.5 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: 'rgba(193,154,107,0.12)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${current.color}, #C19A6B)` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }} />
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1 py-3 flex-shrink-0 flex-wrap px-6">
        {PRAYER_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="rounded-full transition-all"
            style={{
              width: i === step ? 16 : 7,
              height: 7,
              background: i === step ? '#C19A6B' : i < step ? s.color : 'rgba(193,154,107,0.2)',
            }} />
        ))}
      </div>

      {/* Main card */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border overflow-hidden"
            style={{ background: cardBg, borderColor: border }}>

            {/* Illustration */}
            <div className="flex items-center justify-center py-4"
              style={{ background: current.color + '18' }}>
              <div className="h-40 w-36">
                <current.Fig />
              </div>
            </div>

            {/* Title block */}
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: current.color, fontFamily: '"Tajawal",sans-serif' }}>
                  {step + 1} — {current.title}
                </span>
                <span className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                  {current.position}
                </span>
              </div>

              {/* Arabic text */}
              <div className="rounded-2xl p-4 mb-3"
                style={{ background: dark ? 'rgba(193,154,107,0.07)' : 'rgba(193,154,107,0.07)', border: `1px solid ${border}` }}>
                {current.repetitions && (
                  <p className="text-xs font-bold mb-2 text-center"
                    style={{ fontFamily: '"Tajawal",sans-serif', color: '#C19A6B' }}>
                    × {current.repetitions} مرات
                  </p>
                )}
                <p className="text-center leading-[2.2] mb-2"
                  style={{
                    fontFamily: '"Scheherazade New","Amiri Quran","Amiri",serif',
                    fontSize: current.arabic.length > 100 ? '1rem' : '1.25rem',
                    color: textColor,
                    direction: 'rtl',
                  }}>
                  {current.arabic}
                </p>
                <p className="text-center text-xs italic mb-1" style={{ color: mutedColor, fontFamily: 'sans-serif' }}>
                  {current.transliteration}
                </p>
                <p className="text-center text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: mutedColor }}>
                  {current.meaning}
                </p>
              </div>

              {/* Note */}
              {current.note && (
                <div className="flex items-start gap-2.5 rounded-xl p-3 mb-4"
                  style={{ background: 'rgba(193,154,107,0.08)', border: `1px solid rgba(193,154,107,0.18)` }}>
                  <TipIcon size={16} color="#C19A6B" />
                  <p className="text-xs leading-relaxed" style={{ fontFamily: '"Tajawal",sans-serif', color: textColor }}>
                    {current.note}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 pt-2 flex gap-3 flex-shrink-0">
        <button onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.1)', border: `1.5px solid ${border}`, color: '#C19A6B', opacity: step === 0 ? 0.3 : 1 }}>
          <ChevronRight size={22} />
        </button>

        <button
          onClick={() => { if (step < total - 1) setStep(s => s + 1); else setSelectedPrayer(null); }}
          className="flex-1 h-14 rounded-2xl font-bold text-base text-white"
          style={{ background: `linear-gradient(135deg, ${current.color}, #C19A6B)`, fontFamily: '"Tajawal",sans-serif' }}>
          {step === total - 1 ? 'انتهت الصلاة ✓' : `التالي — ${PRAYER_STEPS[step + 1]?.title} →`}
        </button>

        <button onClick={() => setStep(s => Math.min(total - 1, s + 1))}
          disabled={step === total - 1}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.1)', border: `1.5px solid ${border}`, color: '#C19A6B', opacity: step === total - 1 ? 0.3 : 1 }}>
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
}
