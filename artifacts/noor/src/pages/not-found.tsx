import { Link } from 'wouter';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: 'linear-gradient(160deg, #F8EDD8 0%, #EAD9B5 50%, #F5ECD0 100%)' }}
      dir="rtl"
    >
      <div className="text-center">
        <div
          className="text-8xl font-bold mb-3"
          style={{
            fontFamily: '"Amiri", serif',
            background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ٤٠٤
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#3D2007' }}
        >
          الصفحة غير موجودة
        </h1>
        <p
          className="text-sm mb-6"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#9B7043' }}
        >
          الصفحة اللي بتدور عليها مش موجودة
        </p>
      </div>

      <Link href="/">
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #C19A6B 0%, #d4aa7d 50%, #b8894f 100%)',
            boxShadow: '0 4px 24px rgba(193,154,107,0.35)',
            fontFamily: '"Tajawal", sans-serif',
          }}
        >
          <Home className="w-4 h-4" />
          الرجوع للرئيسية
        </button>
      </Link>
    </div>
  );
}
