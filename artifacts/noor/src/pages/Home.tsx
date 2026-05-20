import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight, X, Check, Copy, Share2 } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/use-api';
import { HomeTracker } from '@/components/HomeTracker';
import { getProfileCache, updateProfileInRTDB, getCurrentUid } from '@/lib/rtdb';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';
import NoorWidget from '@/lib/widget-bridge';

/* ═══════════════════════════════════════════════════════════════
   آية اليوم — قائمة مختارة من أشهر الآيات القرآنية
═══════════════════════════════════════════════════════════════ */
const DAILY_AYAHS: { surah: string; ayah: number; text: string }[] = [
  { surah: 'البقرة', ayah: 255, text: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ' },
  { surah: 'البقرة', ayah: 286, text: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَٰفِرِينَ' },
  { surah: 'آل عمران', ayah: 185, text: 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَٰعُ ٱلْغُرُورِ' },
  { surah: 'النساء', ayah: 36, text: 'وَٱعْبُدُوا۟ ٱللَّهَ وَلَا تُشْرِكُوا۟ بِهِۦ شَيْـًٔا ۖ وَبِٱلْوَٰلِدَيْنِ إِحْسَٰنًا وَبِذِى ٱلْقُرْبَىٰ وَٱلْيَتَٰمَىٰ وَٱلْمَسَٰكِينِ وَٱلْجَارِ ذِى ٱلْقُرْبَىٰ وَٱلْجَارِ ٱلْجُنُبِ وَٱلصَّاحِبِ بِٱلْجَنۢبِ وَٱبْنِ ٱلسَّبِيلِ وَمَا مَلَكَتْ أَيْمَٰنُكُمْ ۗ إِنَّ ٱللَّهَ لَا يُحِبُّ مَن كَانَ مُخْتَالًا فَخُورًا' },
  { surah: 'المائدة', ayah: 32, text: 'مَن قَتَلَ نَفْسًۢا بِغَيْرِ نَفْسٍ أَوْ فَسَادٍ فِى ٱلْأَرْضِ فَكَأَنَّمَا قَتَلَ ٱلنَّاسَ جَمِيعًا وَمَنْ أَحْيَاهَا فَكَأَنَّمَآ أَحْيَا ٱلنَّاسَ جَمِيعًا' },
  { surah: 'الأنعام', ayah: 162, text: 'قُلْ إِنَّ صَلَاتِى وَنُسُكِى وَمَحْيَاىَ وَمَمَاتِى لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
  { surah: 'الأعراف', ayah: 56, text: 'وَلَا تُفْسِدُوا۟ فِى ٱلْأَرْضِ بَعْدَ إِصْلَٰحِهَا وَٱدْعُوهُ خَوْفًا وَطَمَعًا ۚ إِنَّ رَحْمَتَ ٱللَّهِ قَرِيبٌ مِّنَ ٱلْمُحْسِنِينَ' },
  { surah: 'يونس', ayah: 62, text: 'أَلَآ إِنَّ أَوْلِيَآءَ ٱللَّهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ' },
  { surah: 'هود', ayah: 88, text: 'وَمَا تَوْفِيقِىٓ إِلَّا بِٱللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ' },
  { surah: 'يوسف', ayah: 87, text: 'يَٰبَنِىَّ ٱذْهَبُوا۟ فَتَحَسَّسُوا۟ مِن يُوسُفَ وَأَخِيهِ وَلَا تَا۟يْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ ۖ إِنَّهُۥ لَا يَا۟يْـَٔسُ مِن رَّوْحِ ٱللَّهِ إِلَّا ٱلْقَوْمُ ٱلْكَٰفِرُونَ' },
  { surah: 'إبراهيم', ayah: 7, text: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِى لَشَدِيدٌ' },
  { surah: 'الحجر', ayah: 9, text: 'إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَٰفِظُونَ' },
  { surah: 'النحل', ayah: 128, text: 'إِنَّ ٱللَّهَ مَعَ ٱلَّذِينَ ٱتَّقَوا۟ وَّٱلَّذِينَ هُم مُّحْسِنُونَ' },
  { surah: 'الإسراء', ayah: 23, text: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوٓا۟ إِلَّآ إِيَّاهُ وَبِٱلْوَٰلِدَيْنِ إِحْسَٰنًا ۚ إِمَّا يَبْلُغَنَّ عِندَكَ ٱلْكِبَرَ أَحَدُهُمَآ أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَآ أُفٍّ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًا كَرِيمًا' },
  { surah: 'الكهف', ayah: 10, text: 'رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا' },
  { surah: 'مريم', ayah: 96, text: 'إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ سَيَجْعَلُ لَهُمُ ٱلرَّحْمَٰنُ وُدًّا' },
  { surah: 'طه', ayah: 114, text: 'رَّبِّ زِدْنِى عِلْمًا' },
  { surah: 'الأنبياء', ayah: 87, text: 'لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّٰلِمِينَ' },
  { surah: 'الحج', ayah: 77, text: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱرْكَعُوا۟ وَٱسْجُدُوا۟ وَٱعْبُدُوا۟ رَبَّكُمْ وَٱفْعَلُوا۟ ٱلْخَيْرَ لَعَلَّكُمْ تُفْلِحُونَ' },
  { surah: 'المؤمنون', ayah: 1, text: 'قَدْ أَفْلَحَ ٱلْمُؤْمِنُونَ' },
  { surah: 'النور', ayah: 35, text: 'ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۚ مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍ فِيهَا مِصْبَاحٌ ۖ ٱلْمِصْبَاحُ فِى زُجَاجَةٍ ۖ ٱلزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌ دُرِّىٌّ يُوقَدُ مِن شَجَرَةٍ مُّبَٰرَكَةٍ زَيْتُونَةٍ لَّا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ يَكَادُ زَيْتُهَا يُضِىٓءُ وَلَوْ لَمْ تَمْسَسْهُ نَارٌ ۚ نُّورٌ عَلَىٰ نُورٍ' },
  { surah: 'الفرقان', ayah: 63, text: 'وَعِبَادُ ٱلرَّحْمَٰنِ ٱلَّذِينَ يَمْشُونَ عَلَى ٱلْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ ٱلْجَٰهِلُونَ قَالُوا۟ سَلَٰمًا' },
  { surah: 'الشعراء', ayah: 89, text: 'إِلَّا مَنْ أَتَى ٱللَّهَ بِقَلْبٍ سَلِيمٍ' },
  { surah: 'النمل', ayah: 62, text: 'أَمَّن يُجِيبُ ٱلْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ ٱلسُّوٓءَ وَيَجْعَلُكُمْ خُلَفَآءَ ٱلْأَرْضِ ۗ أَءِلَٰهٌ مَّعَ ٱللَّهِ ۚ قَلِيلًا مَّا تَذَكَّرُونَ' },
  { surah: 'العنكبوت', ayah: 69, text: 'وَٱلَّذِينَ جَٰهَدُوا۟ فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلْمُحْسِنِينَ' },
  { surah: 'الروم', ayah: 21, text: 'وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَءَايَٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ' },
  { surah: 'لقمان', ayah: 17, text: 'يَٰبُنَىَّ أَقِمِ ٱلصَّلَوٰةَ وَأْمُرْ بِٱلْمَعْرُوفِ وَٱنْهَ عَنِ ٱلْمُنكَرِ وَٱصْبِرْ عَلَىٰ مَآ أَصَابَكَ ۖ إِنَّ ذَٰلِكَ مِنْ عَزْمِ ٱلْأُمُورِ' },
  { surah: 'الزمر', ayah: 53, text: 'قُلْ يَٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ' },
  { surah: 'غافر', ayah: 60, text: 'وَقَالَ رَبُّكُمُ ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ ۚ إِنَّ ٱلَّذِينَ يَسْتَكْبِرُونَ عَنْ عِبَادَتِى سَيَدْخُلُونَ جَهَنَّمَ دَاخِرِينَ' },
  { surah: 'فصلت', ayah: 30, text: 'إِنَّ ٱلَّذِينَ قَالُوا۟ رَبُّنَا ٱللَّهُ ثُمَّ ٱسْتَقَٰمُوا۟ تَتَنَزَّلُ عَلَيْهِمُ ٱلْمَلَٰٓئِكَةُ أَلَّا تَخَافُوا۟ وَلَا تَحْزَنُوا۟ وَأَبْشِرُوا۟ بِٱلْجَنَّةِ ٱلَّتِى كُنتُمْ تُوعَدُونَ' },
  { surah: 'الشورى', ayah: 30, text: 'وَمَآ أَصَٰبَكُم مِّن مُّصِيبَةٍ فَبِمَا كَسَبَتْ أَيْدِيكُمْ وَيَعْفُوا۟ عَن كَثِيرٍ' },
  { surah: 'الحجرات', ayah: 13, text: 'يَٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوٓا۟ ۚ إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ ۚ إِنَّ ٱللَّهَ عَلِيمٌ خَبِيرٌ' },
  { surah: 'ق', ayah: 16, text: 'وَلَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِۦ نَفْسُهُۥ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ ٱلْوَرِيدِ' },
  { surah: 'الذاريات', ayah: 56, text: 'وَمَا خَلَقْتُ ٱلْجِنَّ وَٱلْإِنسَ إِلَّا لِيَعْبُدُونِ' },
  { surah: 'الرحمن', ayah: 13, text: 'فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ' },
  { surah: 'الواقعة', ayah: 96, text: 'فَسَبِّحْ بِٱسْمِ رَبِّكَ ٱلْعَظِيمِ' },
  { surah: 'الحديد', ayah: 20, text: 'ٱعْلَمُوٓا۟ أَنَّمَا ٱلْحَيَوٰةُ ٱلدُّنْيَا لَعِبٌ وَلَهْوٌ وَزِينَةٌ وَتَفَاخُرٌۢ بَيْنَكُمْ وَتَكَاثُرٌ فِى ٱلْأَمْوَٰلِ وَٱلْأَوْلَٰدِ' },
  { surah: 'الحشر', ayah: 18, text: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ ٱللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ ۖ وَٱتَّقُوا۟ ٱللَّهَ ۚ إِنَّ ٱللَّهَ خَبِيرٌۢ بِمَا تَعْمَلُونَ' },
  { surah: 'الطلاق', ayah: 3, text: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ ۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمْرِهِۦ ۚ قَدْ جَعَلَ ٱللَّهُ لِكُلِّ شَىْءٍ قَدْرًا' },
  { surah: 'الطلاق', ayah: 7, text: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا مَآ ءَاتَىٰهَا ۚ سَيَجْعَلُ ٱللَّهُ بَعْدَ عُسْرٍ يُسْرًا' },
  { surah: 'الملك', ayah: 1, text: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ' },
  { surah: 'القلم', ayah: 4, text: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ' },
  { surah: 'الجن', ayah: 18, text: 'وَأَنَّ ٱلْمَسَٰجِدَ لِلَّهِ فَلَا تَدْعُوا۟ مَعَ ٱللَّهِ أَحَدًا' },
  { surah: 'المزمل', ayah: 20, text: 'وَأَقِيمُوا۟ ٱلصَّلَوٰةَ وَءَاتُوا۟ ٱلزَّكَوٰةَ وَأَقْرِضُوا۟ ٱللَّهَ قَرْضًا حَسَنًا ۚ وَمَا تُقَدِّمُوا۟ لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ ٱللَّهِ هُوَ خَيْرًا وَأَعْظَمَ أَجْرًا' },
  { surah: 'الإنسان', ayah: 9, text: 'إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ ٱللَّهِ لَا نُرِيدُ مِنكُمْ جَزَآءً وَلَا شُكُورًا' },
  { surah: 'النبأ', ayah: 31, text: 'إِنَّ لِلْمُتَّقِينَ مَفَازًا' },
  { surah: 'عبس', ayah: 24, text: 'فَلْيَنظُرِ ٱلْإِنسَٰنُ إِلَىٰ طَعَامِهِۦٓ' },
  { surah: 'الانشقاق', ayah: 6, text: 'يَٰٓأَيُّهَا ٱلْإِنسَٰنُ إِنَّكَ كَادِحٌ إِلَىٰ رَبِّكَ كَدْحًا فَمُلَٰقِيهِ' },
  { surah: 'الأعلى', ayah: 17, text: 'وَٱلْءَاخِرَةُ خَيْرٌ وَأَبْقَىٰ' },
  { surah: 'الغاشية', ayah: 21, text: 'فَذَكِّرْ إِنَّمَآ أَنتَ مُذَكِّرٌ' },
  { surah: 'الفجر', ayah: 27, text: 'يَٰٓأَيَّتُهَا ٱلنَّفْسُ ٱلْمُطْمَئِنَّةُ' },
  { surah: 'الشرح', ayah: 5, text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
  { surah: 'الشرح', ayah: 6, text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
  { surah: 'العلق', ayah: 1, text: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ' },
  { surah: 'القدر', ayah: 1, text: 'إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ' },
  { surah: 'الزلزلة', ayah: 7, text: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ' },
  { surah: 'العصر', ayah: 1, text: 'وَٱلْعَصْرِ ۝ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ ۝ إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ' },
  { surah: 'الإخلاص', ayah: 1, text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ' },
  { surah: 'البقرة', ayah: 153, text: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ' },
  { surah: 'البقرة', ayah: 216, text: 'وَعَسَىٰٓ أَن تَكْرَهُوا۟ شَيْـًٔا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰٓ أَن تُحِبُّوا۟ شَيْـًٔا وَهُوَ شَرٌّ لَّكُمْ ۗ وَٱللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ' },
  { surah: 'آل عمران', ayah: 139, text: 'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ' },
  { surah: 'آل عمران', ayah: 173, text: 'حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ' },
  { surah: 'الطلاق', ayah: 2, text: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ' },
  { surah: 'الأنفال', ayah: 2, text: 'إِنَّمَا ٱلْمُؤْمِنُونَ ٱلَّذِينَ إِذَا ذُكِرَ ٱللَّهُ وَجِلَتْ قُلُوبُهُمْ وَإِذَا تُلِيَتْ عَلَيْهِمْ ءَايَٰتُهُۥ زَادَتْهُمْ إِيمَٰنًا وَعَلَىٰ رَبِّهِمْ يَتَوَكَّلُونَ' },
  { surah: 'يس', ayah: 82, text: 'إِنَّمَآ أَمْرُهُۥٓ إِذَآ أَرَادَ شَيْـًٔا أَن يَقُولَ لَهُۥ كُن فَيَكُونُ' },
  { surah: 'الفاتحة', ayah: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
  { surah: 'آل عمران', ayah: 8, text: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ' },
  { surah: 'المؤمنون', ayah: 97, text: 'رَّبِّ أَعُوذُ بِكَ مِنْ هَمَزَٰتِ ٱلشَّيَٰطِينِ ۝ وَأَعُوذُ بِكَ رَبِّ أَن يَحْضُرُونِ' },
  { surah: 'الكهف', ayah: 46, text: 'ٱلْمَالُ وَٱلْبَنُونَ زِينَةُ ٱلْحَيَوٰةِ ٱلدُّنْيَا ۖ وَٱلْبَٰقِيَٰتُ ٱلصَّٰلِحَٰتُ خَيْرٌ عِندَ رَبِّكَ ثَوَابًا وَخَيْرٌ أَمَلًا' },
];

function getTodayAyah() {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
}

async function shareDailyAyah(ayah: typeof DAILY_AYAHS[0]) {
  const text = `${ayah.surah} — الآية ${ayah.ayah}\n\n${ayah.text}\n\n📱 من تطبيق نور`;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'مشاركة آية اليوم' });
      return;
    } catch {}
  }
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(text); } catch {}
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function DailyAyah() {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const ayah = getTodayAyah();

  async function handleCopy() {
    const text = `${ayah.surah} — الآية ${ayah.ayah}\n\n${ayah.text}`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(30,20,5,0.95) 0%, rgba(50,32,8,0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(244,234,210,0.95) 100%)',
        border: `1px solid rgba(193,154,107,${isDark ? '0.3' : '0.25'})`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(193,154,107,0.12)',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: isDark
            ? 'rgba(193,154,107,0.12)'
            : 'rgba(193,154,107,0.1)',
          borderBottom: `1px solid rgba(193,154,107,${isDark ? '0.2' : '0.15'})`,
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>📖</span>
          <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: isDark ? '#C19A6B' : '#7A4F1E' }}>
            آية اليوم
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
          fontFamily: '"Tajawal", sans-serif',
          background: isDark ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.15)',
          color: isDark ? '#E8C98A' : '#8B5E2A',
        }}>
          {ayah.surah} : {ayah.ayah}
        </span>
      </div>

      {/* Ayah text */}
      <div className="px-5 pt-5 pb-3">
        <p
          className="text-center leading-loose"
          style={{
            fontFamily: '"Scheherazade New", "Amiri", serif',
            fontSize: '1.25rem',
            lineHeight: '2.4rem',
            color: isDark ? 'rgba(255,248,230,0.93)' : 'rgba(25,15,5,0.9)',
          }}
        >
          {ayah.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: copied
              ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)')
              : (isDark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.1)'),
            border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(193,154,107,0.3)'}`,
            color: copied ? '#16a34a' : (isDark ? '#C19A6B' : '#7A4F1E'),
          }}
        >
          {copied ? <span>✓</span> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </button>
        <button
          onClick={() => shareDailyAyah(ayah)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: isDark ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.15)',
            border: '1px solid rgba(193,154,107,0.4)',
            color: isDark ? '#E8C98A' : '#6B4218',
          }}
        >
          <Share2 className="w-3.5 h-3.5" />
          مشاركة
        </button>
      </div>
    </div>
  );
}

const WIDGET_PRAYERS: Array<{ key: keyof PrayerTimes; name: string }> = [
  { key: 'fajr',    name: 'الفجر'  },
  { key: 'dhuhr',   name: 'الظهر'  },
  { key: 'asr',     name: 'العصر'  },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha',    name: 'العشاء' },
];

function buildWidgetPayload(lat: number, lng: number) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian();
  const entries: Array<{ name: string; timeMs: number; timeStr: string }> = [];
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const pt = new PrayerTimes(coords, d, params);
    for (const { key, name } of WIDGET_PRAYERS) {
      const t = pt[key] as Date;
      if (!(t instanceof Date)) continue;
      const h = t.getHours(), m = t.getMinutes();
      const h12 = h % 12 || 12;
      const ampm = h < 12 ? 'ص' : 'م';
      entries.push({ name, timeMs: t.getTime(), timeStr: `${h12}:${String(m).padStart(2, '0')} ${ampm}` });
    }
  }
  return entries.sort((a, b) => a.timeMs - b.timeMs);
}

const PRAYERS = [
  { id: 'Fajr',    name: 'الفجر'  },
  { id: 'Sunrise', name: 'الشروق' },
  { id: 'Dhuhr',   name: 'الظهر'  },
  { id: 'Asr',     name: 'العصر'  },
  { id: 'Maghrib', name: 'المغرب' },
  { id: 'Isha',    name: 'العشاء' },
];

function fmt12(time: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr ?? '00').substring(0, 2);
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function offsetDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/* 3D Clock SVG icon */
function Clock3DIcon({ size = 20 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.42;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <defs>
        <radialGradient id="clockFace" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <circle cx={c + size * 0.04} cy={c + size * 0.05} r={r} fill="currentColor" fillOpacity="0.12" />
      {/* Face */}
      <circle cx={c} cy={c} r={r} fill="url(#clockFace)" stroke="currentColor" strokeWidth={size * 0.07} strokeOpacity="0.9" />
      {/* Top highlight arc */}
      <path
        d={`M ${c - r * 0.55} ${c - r * 0.55} A ${r * 0.85} ${r * 0.85} 0 0 1 ${c + r * 0.45} ${c - r * 0.65}`}
        stroke="white" strokeWidth={size * 0.045} strokeOpacity="0.38" fill="none" strokeLinecap="round"
      />
      {/* Hour marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const len = i % 3 === 0 ? size * 0.09 : size * 0.05;
        const x1 = c + (r - size * 0.03) * Math.cos(rad);
        const y1 = c + (r - size * 0.03) * Math.sin(rad);
        const x2 = c + (r - size * 0.03 - len) * Math.cos(rad);
        const y2 = c + (r - size * 0.03 - len) * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? size * 0.055 : size * 0.03}
            strokeOpacity={i % 3 === 0 ? 0.8 : 0.45} strokeLinecap="round" />
        );
      })}
      {/* Hour hand (pointing to ~10) */}
      <line x1={c} y1={c}
        x2={c + r * 0.5 * Math.cos((300 - 90) * Math.PI / 180)}
        y2={c + r * 0.5 * Math.sin((300 - 90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.09} strokeLinecap="round" strokeOpacity="0.95" />
      {/* Minute hand (pointing to ~12) */}
      <line x1={c} y1={c}
        x2={c + r * 0.7 * Math.cos((-90) * Math.PI / 180)}
        y2={c + r * 0.7 * Math.sin((-90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.06} strokeLinecap="round" strokeOpacity="0.85" />
      {/* Center dot */}
      <circle cx={c} cy={c} r={size * 0.07} fill="currentColor" />
      <circle cx={c - size * 0.02} cy={c - size * 0.02} r={size * 0.03} fill="white" fillOpacity="0.6" />
    </svg>
  );
}

const HIJRI_ADJUST_KEY = 'noor_hijri_adjust';

export function Home() {
  const [dateOffset, setDateOffset] = useState(0);
  const [hijriAdjust, setHijriAdjust] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(HIJRI_ADJUST_KEY) ?? '0', 10) || 0; } catch { return 0; }
  });
  const [showGovPicker, setShowGovPicker] = useState(false);

  function changeHijriAdjust(delta: number) {
    setHijriAdjust(prev => {
      const next = prev + delta;
      try { localStorage.setItem(HIJRI_ADJUST_KEY, String(next)); } catch {}
      return next;
    });
  }

  const [userProfile, setUserProfile] = useState(() => getProfileCache());

  // Re-read profile after mount — on APK the cache may load after first render
  useEffect(() => {
    const p = getProfileCache();
    if (p) setUserProfile(p);
    // Also listen for profile updates from Settings / Login
    const handler = () => setUserProfile(getProfileCache());
    window.addEventListener('noor:profile-updated', handler);
    return () => window.removeEventListener('noor:profile-updated', handler);
  }, []);

  const activeLat = userProfile?.lat ?? null;
  const activeLng = userProfile?.lng ?? null;
  const lat = userProfile?.lat ?? null;
  const lng = userProfile?.lng ?? null;

  const { data: prayerResult } = usePrayerTimes(activeLat, activeLng, dateOffset);
  const times = prayerResult?.timings;
  const hijri = prayerResult?.hijri;

  const [nextPrayer, setNextPrayer] = useState<{ name: string; time24: string } | null>(null);
  const [countdown, setCountdown] = useState('');

  // ── Android Widget Bridge ────────────────────────────────────────────────
  // Runs on the native APK only. Sends 3 days of prayer timestamps to SharedPreferences
  // so the home screen widget countdown works even when the app is fully closed.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!lat || !lng) return;
    const prayers = buildWidgetPayload(lat, lng);
    NoorWidget.setPrayerTimes({ prayers, lat, lng }).catch(() => {});
  }, [lat, lng]);

  useEffect(() => {
    if (!times || dateOffset !== 0) return;
    // Use Cairo timezone for current time comparison (all supported govs are Egypt)
    const nowCairo = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo',
    }).format(new Date());
    const [nowH, nowM] = nowCairo.split(':').map(Number);
    const nowMins = (nowH === 24 ? 0 : nowH) * 60 + nowM;
    let found = false;
    let nextName = '';
    let nextTime = '';
    for (const p of PRAYERS) {
      const t24 = (times[p.id] ?? '').substring(0, 5);
      if (t24 && toMins(t24) > nowMins) {
        setNextPrayer({ name: p.name, time24: t24 });
        nextName = p.name;
        nextTime = t24;
        found = true;
        break;
      }
    }
    if (!found && times['Fajr']) {
      setNextPrayer({ name: 'الفجر', time24: times['Fajr'].substring(0, 5) });
      nextName = 'الفجر';
      nextTime = times['Fajr'].substring(0, 5);
    }
  }, [times, dateOffset]);

  useEffect(() => {
    if (!nextPrayer || dateOffset !== 0) return;
    const tick = () => {
      // Compute countdown entirely in Egypt timezone (handles UTC+2/UTC+3 DST)
      const nowCairoParts = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Africa/Cairo',
      }).format(new Date()).split(':').map(Number);
      const nowCairoH = nowCairoParts[0] === 24 ? 0 : nowCairoParts[0];
      const nowSecs = nowCairoH * 3600 + nowCairoParts[1] * 60 + nowCairoParts[2];
      const [ph, pm] = nextPrayer.time24.split(':').map(Number);
      const targetSecs = ph * 3600 + pm * 60;
      let diff = targetSecs - nowSecs;
      if (diff < 0) diff += 86400; // prayer is tomorrow
      const hh = Math.floor(diff / 3600).toString().padStart(2, '0');
      const mm = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const ss = (diff % 60).toString().padStart(2, '0');
      setCountdown(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextPrayer, dateOffset]);

  const displayDate = offsetDate(dateOffset);

  const displayHijriLabel = (() => {
    const adjustedDate = new Date(displayDate.getTime() + hijriAdjust * 86400000);
    if (hijri && hijriAdjust === 0) {
      return `${hijri.day} ${hijri.month?.ar ?? ''} ${hijri.year} هـ`;
    }
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(adjustedDate);
  })();

  const displayGregorianLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(displayDate);

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-5" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-5 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-8 -mb-8" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={() => setDateOffset(d => d - 1)} className="p-1.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-primary-foreground/90 font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>{displayHijriLabel}</p>
              {/* Hijri adjust buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeHijriAdjust(-2)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{ background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.75)', fontFamily: '"Tajawal", sans-serif' }}
                >−2</button>
                <button
                  onClick={() => changeHijriAdjust(-1)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{ background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.75)', fontFamily: '"Tajawal", sans-serif' }}
                >−1</button>
                {hijriAdjust !== 0 && (
                  <button
                    onClick={() => { setHijriAdjust(0); try { localStorage.setItem(HIJRI_ADJUST_KEY, '0'); } catch {} }}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                    style={{ background: 'rgba(193,154,107,0.4)', color: '#fff', fontFamily: '"Tajawal", sans-serif' }}
                  >{hijriAdjust > 0 ? `+${hijriAdjust}` : hijriAdjust} ✕</button>
                )}
                <button
                  onClick={() => changeHijriAdjust(+1)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{ background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.75)', fontFamily: '"Tajawal", sans-serif' }}
                >+1</button>
                <button
                  onClick={() => changeHijriAdjust(+2)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{ background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.75)', fontFamily: '"Tajawal", sans-serif' }}
                >+2</button>
              </div>
            </div>
            <button onClick={() => setDateOffset(d => d + 1)} className="p-1.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <p className="text-primary-foreground/55 text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {displayGregorianLabel}
          </p>
          {dateOffset !== 0 && (
            <button onClick={() => setDateOffset(0)} className="text-xs text-white/60 underline mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {dateOffset > 0 ? `+${dateOffset} أيام` : `${dateOffset} أيام`} — العودة لليوم
            </button>
          )}

          <h1 className="text-3xl mb-3" style={{ fontFamily: '"Amiri", "Scheherazade New", serif' }}>تطبيق نُـور</h1>

          {dateOffset === 0 && nextPrayer ? (
            <div className="rounded-2xl p-4 w-full border border-white/15" style={{ background: 'rgba(0,0,0,0.30)' }}>
              <p className="text-xs text-primary-foreground/60 mb-1 tracking-widest" style={{ fontFamily: '"Tajawal", sans-serif' }}>الصلاة القادمة</p>
              <p className="text-2xl font-bold mb-2" style={{ fontFamily: '"Amiri", serif', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>{nextPrayer.name}</p>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ direction: 'ltr' }}>
                {(countdown || '00:00:00').split(':').map((seg, i, arr) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="bg-black/30 rounded-xl px-3 py-1.5 min-w-[52px] text-center">
                      <span className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: '"Tajawal", monospace', letterSpacing: '-0.02em' }}>{seg}</span>
                    </div>
                    {i < arr.length - 1 && <span className="text-white/60 text-2xl font-bold mb-1">:</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-foreground/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmt12(nextPrayer.time24)}</p>
            </div>
          ) : dateOffset !== 0 ? (
            <div className="bg-black/20 rounded-2xl p-3 w-full border border-white/10">
              <p className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {dateOffset > 0 ? `مواقيت بعد ${dateOffset} ${dateOffset === 1 ? 'يوم' : 'أيام'}` : `مواقيت قبل ${Math.abs(dateOffset)} ${Math.abs(dateOffset) === 1 ? 'يوم' : 'أيام'}`}
              </p>
            </div>
          ) : (
            <div className="animate-pulse bg-black/10 rounded-2xl h-28 w-full" />
          )}
        </div>
      </div>

      {/* Prayer Times Grid */}
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            <span className="text-primary">
              <Clock3DIcon size={22} />
            </span>
            مواقيت الصلاة
          </h2>
          {userProfile?.governorateName && (
            <button
              onClick={() => setShowGovPicker(true)}
              className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            >
              <MapPin className="w-3 h-3" />
              {userProfile.governorateName}
            </button>
          )}
        </div>

        {times ? (
          <div className="grid grid-cols-2 gap-2.5">
            {PRAYERS.map(p => {
              const t24 = (times[p.id] ?? '').substring(0, 5);
              const isNext = dateOffset === 0 && nextPrayer?.name === p.name;
              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center px-4 py-3 rounded-2xl border transition-all ${
                    isNext ? 'bg-primary/15 border-primary/50 shadow-sm shadow-primary/10' : 'bg-secondary/40 border-border/40'
                  }`}
                >
                  <span className={`font-medium text-sm ${isNext ? 'text-primary font-bold' : 'text-foreground/70'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{p.name}</span>
                  <span className={`font-bold text-base tabular-nums ${isNext ? 'text-primary' : 'text-foreground/90'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmt12(t24)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {!lat ? (
              <div>
                <p>لم يتم تحديد الموقع</p>
                <p className="text-xs mt-1">اذهب للمزيد وحدد محافظتك</p>
              </div>
            ) : (
              <div className="animate-pulse">جاري تحميل المواقيت...</div>
            )}
          </div>
        )}
      </div>

      {/* آية اليوم */}
      <DailyAyah />

      {/* Daily Tracker */}
      <HomeTracker />

      {/* Dhikr Footer */}
      <div className="mt-6 mb-4 mx-4 text-center">
        <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
        <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ۝ البقرة: 201
        </p>
      </div>

      {/* ── Governorate Picker Sheet ── */}
      <AnimatePresence>
        {showGovPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowGovPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: 'var(--background)', border: '1px solid rgba(193,154,107,0.2)' }}
              dir="rtl"
            >
              <div className="p-4 pb-2 flex items-center justify-between border-b border-border/40">
                <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>
                  اختر محافظتك
                </h3>
                <button
                  onClick={() => setShowGovPicker(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(193,154,107,0.1)' }}
                >
                  <X className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {EGYPT_GOVERNORATES.map(gov => {
                    const active = userProfile?.governorateId === gov.id;
                    return (
                      <button
                        key={gov.id}
                        onClick={() => {
                          const uid = getCurrentUid();
                          if (uid) {
                            updateProfileInRTDB(uid, {
                              governorateId: gov.id,
                              governorateName: gov.name,
                              lat: gov.lat,
                              lng: gov.lng,
                            });
                          }
                          setUserProfile(prev => prev
                            ? { ...prev, governorateId: gov.id, governorateName: gov.name, lat: gov.lat, lng: gov.lng }
                            : prev
                          );
                          window.dispatchEvent(new CustomEvent('noor:profile-updated'));
                          setShowGovPicker(false);
                        }}
                        className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all active:scale-95"
                        style={{
                          background: active ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.05)',
                          border: `1.5px solid rgba(193,154,107,${active ? '0.6' : '0.15'})`,
                        }}
                      >
                        <div className="w-11 h-7 rounded overflow-hidden flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.08)' }}>
                          <img src={gov.flag} alt={gov.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-[10px] font-bold text-center leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: active ? '#8B6340' : 'var(--foreground)' }}>
                          {gov.name}
                        </span>
                        {active && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-safe-area-inset-bottom h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
