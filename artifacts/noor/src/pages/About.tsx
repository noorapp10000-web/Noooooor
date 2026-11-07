import { Link } from 'wouter';
import { Share2, Shield, Heart, Sparkles } from 'lucide-react';
import { PageHeader, NoorImg, GoldBadge, FooterAyah, type NoorIconName } from '@/components/noor/kit';
import { shareText } from '@/lib/share';

const FEATURES: { icon: NoorIconName; title: string; text: string }[] = [
  { icon: 'quran', title: 'المصحف الشريف', text: 'قراءة واستماع وتفسير بخط عثماني فاخر' },
  { icon: 'prayer', title: 'مواقيت الصلاة', text: 'تنبيهات دقيقة بحسب مدينتك ومذهبك' },
  { icon: 'tasbih', title: 'الأذكار والمسبحة', text: 'أذكار الصباح والمساء وعدّاد ذكي' },
  { icon: 'hadith', title: 'الحديث والسنة', text: 'الكتب الستة وسنن يومية تطبّقها' },
  { icon: 'radio', title: 'الإذاعات والقنوات', text: 'بث مباشر من القاهرة والحرمين' },
  { icon: 'hifz', title: 'الحفظ والتعلم', text: 'اختبارات حفظ ومسابقات ودليل الصلاة' },
];

export function About() {
  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <PageHeader title="عن تطبيق نُور" subtitle="رفيقك اليومي في العبادة" icon="star" />
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="noor-card-hero rounded-[32px] p-6 text-center relative overflow-hidden">
          <NoorImg name="mosque" size={88} className="mx-auto" />
          <h1 className="text-3xl font-black text-gold-gradient mt-3" style={{ fontFamily: '"Amiri", serif' }}>نُور</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">تطبيق إسلامي متكامل يجمع القرآن والأذكار والصلاة في تجربة هادئة فاخرة، بلا إعلانات.</p>
          <div className="flex justify-center gap-2 mt-4">
            <GoldBadge>الإصدار ٢٫٠</GoldBadge>
            <GoldBadge tone="emerald">صدقة جارية</GoldBadge>
          </div>
        </div>

        <h2 className="font-bold text-primary mt-6 mb-3 px-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> ما يقدمه نُور</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="noor-card rounded-3xl p-4">
              <NoorImg name={f.icon} size={40} />
              <p className="font-bold text-sm text-foreground mt-2">{f.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 mt-6">
          <button onClick={() => shareText('حمّل تطبيق نُور — القرآن والأذكار ومواقيت الصلاة في مكان واحد', 'شارك نُور')}
            className="press noor-btn-gold rounded-2xl h-12 flex items-center justify-center gap-2 font-bold text-sm">
            <Share2 className="w-4 h-4" /> شارك التطبيق واكسب الأجر
          </button>
          <a href="https://noorapp10000-web.github.io/Noooooor/" target="_blank" rel="noopener noreferrer"
            className="press noor-card rounded-2xl h-12 flex items-center justify-center gap-2 text-sm text-foreground">
            <Shield className="w-4 h-4 text-primary" /> سياسة الخصوصية
          </a>
          <Link href="/settings" className="press noor-card rounded-2xl h-12 flex items-center justify-center gap-2 text-sm text-foreground">الإعدادات</Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">تصميم وتطوير</p>
          <p className="text-primary font-black text-lg" style={{ fontFamily: '"Amiri", serif' }}>سيف كامل</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center justify-center gap-1"><Heart className="w-3 h-3 text-primary" /> لا تنسونا من صالح دعائكم</p>
        </div>

        <FooterAyah text="قُلْ بِفَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَٰلِكَ فَلْيَفْرَحُوا" source="يونس: ٥٨" />
      </div>
    </div>
  );
}
