import { useLocation } from 'wouter';

// AI-generated ambient artwork shown behind the top of each screen.
const ART: Record<string, string> = {
  '/quran': 'screen-quran', '/hifz-test': 'screen-quran', '/speed-reader': 'screen-quran',
  '/azkar': 'screen-azkar', '/tasbih': 'screen-azkar', '/ranking': 'screen-azkar', '/asma': 'screen-azkar',
  '/qibla': 'screen-qibla', '/quizzes': 'screen-qibla',
  '/history': 'screen-history', '/prophets': 'screen-prophets',
  '/hadith': 'screen-hadith', '/sunnah': 'screen-hadith',
  '/reciters': 'screen-listen', '/radio': 'screen-listen', '/tv': 'screen-listen',
  '/wudu': 'screen-worship', '/learn-prayer': 'screen-worship',
  '/more': 'screen-prophets', '/settings': 'screen-worship',
};

export function ScreenArt() {
  const [path] = useLocation();
  const name = ART[path];
  if (!name) return null;
  return (
    <div aria-hidden className="noor-screen-art">
      <img src={`${import.meta.env.BASE_URL}images/art/${name}.webp`} alt="" width={720} height={960} />
    </div>
  );
}
