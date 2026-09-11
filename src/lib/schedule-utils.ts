// 🕒 مكتبة الحسابات والأدوات الزمنية للجدول الأسبوعي والـ Timeline - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { DayOfWeek, LectureColor, LectureType, ScheduleLecture, DepartmentScheduleConfig, FinalExamSlot, ExamConflict } from '@/types'; // 🔗 استيراد الأنواع

// 🗓️ قائمة أيام الأسبوع بالترتيب الأكاديمي العراقي المعتمد
export const DAYS_OF_WEEK_LIST: {
  key: DayOfWeek;        // 🔑 مفتاح اليوم
  label_ar: string;      // 📝 الاسم بالعربية
  label_en: string;      // 📝 الاسم بالإنكليزية
  short_ar: string;      // 🏷️ الاختصار العربي
  is_default_off: boolean; // 🏖️ هل اليوم عطلة افتراضية؟
}[] = [
  { key: 'saturday', label_ar: 'السبت', label_en: 'Saturday', short_ar: 'سبت', is_default_off: false },
  { key: 'sunday', label_ar: 'الأحد', label_en: 'Sunday', short_ar: 'أحد', is_default_off: false },
  { key: 'monday', label_ar: 'الاثنين', label_en: 'Monday', short_ar: 'اثنين', is_default_off: false },
  { key: 'tuesday', label_ar: 'الثلاثاء', label_en: 'Tuesday', short_ar: 'ثلاثاء', is_default_off: false },
  { key: 'wednesday', label_ar: 'الأربعاء', label_en: 'Wednesday', short_ar: 'أربعاء', is_default_off: false },
  { key: 'thursday', label_ar: 'الخميس', label_en: 'Thursday', short_ar: 'خميس', is_default_off: true },
  { key: 'friday', label_ar: 'الجمعة', label_en: 'Friday', short_ar: 'جمعة', is_default_off: true },
];

// 💼 أيام الدوام الافتراضية
export const DEFAULT_WORKING_DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday'];

// 🏖️ أيام العطل الافتراضية
export const DEFAULT_OFF_DAYS: DayOfWeek[] = ['thursday', 'friday'];

// 🎨 سمات وألوان بطاقات المحاضرات والـ Timeline
export const LECTURE_COLOR_THEMES: Record<
  LectureColor,
  {
    name: string;        // 🏷️ اسم اللون بالعربية
    bg: string;          // 🎨 خلفية البطاقة
    bgLight: string;     // 🎨 خلفية خفيفة
    border: string;      // 🎨 لون الإطار
    text: string;        // 🎨 لون العنوان
    accent: string;      // 🎨 اللون البارز
    badgeBg: string;     // 🎨 خلفية الشارة
    badgeText: string;   // 🎨 نص الشارة
    gradient: string;    // 🌈 التدرج اللوني الفاخر
    glow: string;        // 💡 تأثير التوهج
    dot: string;         // 🔘 لون الدائرة
  }
> = {
  blue: {
    name: 'أزرق سماوي',
    bg: 'bg-blue-900/10',
    bgLight: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-950',
    accent: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    gradient: 'from-blue-600 to-cyan-600',
    glow: 'shadow-blue-500/20',
    dot: 'bg-blue-500',
  },
  indigo: {
    name: 'كحلي ملكي',
    bg: 'bg-slate-900/10',
    bgLight: 'bg-slate-100',
    border: 'border-slate-500',
    text: 'text-slate-950',
    accent: 'text-slate-800',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
    gradient: 'from-slate-800 to-blue-900',
    glow: 'shadow-slate-500/20',
    dot: 'bg-slate-700',
  },
  purple: {
    name: 'أزرق داكن',
    bg: 'bg-blue-950/10',
    bgLight: 'bg-blue-50',
    border: 'border-blue-600',
    text: 'text-blue-950',
    accent: 'text-blue-800',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    gradient: 'from-blue-700 to-sky-700',
    glow: 'shadow-blue-500/20',
    dot: 'bg-blue-700',
  },
  emerald: {
    name: 'زمردي أخضر',
    bg: 'bg-emerald-900/10',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-950',
    accent: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'shadow-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  amber: {
    name: 'سماوي بحري',
    bg: 'bg-sky-900/10',
    bgLight: 'bg-sky-50',
    border: 'border-sky-500',
    text: 'text-sky-950',
    accent: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    gradient: 'from-sky-600 to-blue-600',
    glow: 'shadow-sky-500/20',
    dot: 'bg-sky-500',
  },
  rose: {
    name: 'وردي ياقوتي',
    bg: 'bg-rose-900/10',
    bgLight: 'bg-rose-50',
    border: 'border-rose-500',
    text: 'text-rose-950',
    accent: 'text-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    gradient: 'from-rose-600 to-red-600',
    glow: 'shadow-rose-500/20',
    dot: 'bg-rose-500',
  },
  teal: {
    name: 'تركوازي بحري',
    bg: 'bg-teal-900/10',
    bgLight: 'bg-teal-50',
    border: 'border-teal-500',
    text: 'text-teal-950',
    accent: 'text-teal-700',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    gradient: 'from-teal-600 to-emerald-600',
    glow: 'shadow-teal-500/20',
    dot: 'bg-teal-500',
  },
  cyan: {
    name: 'سماوي وهاج',
    bg: 'bg-cyan-900/10',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-500',
    text: 'text-cyan-950',
    accent: 'text-cyan-700',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    gradient: 'from-cyan-600 to-blue-600',
    glow: 'shadow-cyan-500/20',
    dot: 'bg-cyan-500',
  },
};

// 🏷️ مسميات نوع المحاضرة
export const LECTURE_TYPE_LABELS: Record<LectureType, { ar: string; en: string; icon: string }> = {
  theory: { ar: 'نظري', en: 'Theory', icon: '📘' },
  practical: { ar: 'عملي ومختبر', en: 'Practical / Lab', icon: '🔬' },
  tutorial: { ar: 'مناقشة وتطبيقات', en: 'Tutorial', icon: '📝' },
};

// ⏰ تحويل نص الوقت 'HH:mm' أو 'HH:mm:ss' أو المرفق بـ (ص/م) إلى عدد الدقائق من بداية اليوم بدقة أكاديمية
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0; // 🛡️ حماية إذا كان النص فارغاً
  const trimmed = timeStr.trim(); // 🧹 تنظيف المسافات الزائدة
  
  // 🔍 التحقق إذا كان الوقت يحتوي على لاحقة صباحاً أو مساءً بالعربية أو الإنكليزية
  const isPM = /م|مساء|pm/i.test(trimmed); // 🌙 فحص علامة المساء
  const isAM = /ص|صباح|am/i.test(trimmed); // 🌅 فحص علامة الصباح
  
  // ⏱️ استخراج الأرقام (الساعة والدقيقة) بريجكس مرن يتجاهل الثواني واللواحق
  const match = trimmed.match(/(\d{1,2}):(\d{2})/); // 🔍 استخراج الساعة والدقيقة
  if (!match) return 0; // ⚠️ إذا ماكو تطابق نرجع صفر
  
  let hours = parseInt(match[1], 10) || 0; // 🔢 ساعة البدء كرقم
  const minutes = parseInt(match[2], 10) || 0; // 🔢 دقيقة البدء كرقم
  
  // 🎓 التمييز الذكي للدوام الجامعي العراقي:
  // 🕛 لا توجد محاضرات بمنتصف الليل (00:00)، فأي ساعة 00:xx هي في الواقع 12:xx ظهراً
  if (hours === 0) {
    hours = 12; // 🕛 تحويل ساعة الصفر إلى 12 ظهراً
  }

  if (isPM) {
    if (hours < 12) hours += 12; // 🕒 تحويل ساعات بعد الظهر لنظام 24 (مثلاً 1 م تصبح 13)
  } else if (isAM) {
    // 🌅 في الجدول الجامعي: الساعة 12 حتى لو رُفقت بـ AM بالخطأ هي 12 ظهراً
    if (hours === 12) hours = 12;
  } else {
    // 💡 في حال عدم وجود لاحقة صريحة:
    // الساعات من 1 إلى 7 في الجدول الجامعي العراقي هي دوام بعد الظهر والمسائي (13:00 إلى 19:00)
    // الساعات من 8 إلى 11 هي ساعات الصباح الباكر (8:00 إلى 11:00)
    // الساعة 12 هي ظهراً (12:00 = 720 دقيقة)
    if (hours >= 1 && hours <= 7) {
      hours += 12; // ➕ إضافة 12 ساعة لتوضع في مكانها الزمني الصحيح بعد الظهر
    }
  }
  
  return hours * 60 + minutes; // 🧮 إرجاع إجمالي الدقائق من بداية اليوم
}

// ⏰ تحويل عدد الدقائق إلى نص وقت 'HH:mm'
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ⏰ دالة مساعدة لحساب الساعة بنظام 12 ساعة وإضافة ص أو م بدقة أكاديمية جامعية
export function formatSingleTime(t: string): string {
  if (!t) return ''; // 🛡️ حماية من القيم الفارغة
  const match = t.match(/(\d{1,2}):(\d{2})/); // 🔍 استخراج الساعة والدقيقة بالريجكس
  if (!match) return t; // ⚠️ إذا ما طابقت نرجع النص كما هو
  let h = parseInt(match[1], 10); // 🔢 تحويل الساعة لرقم صحيح
  const m = match[2]; // ⏱️ الدقائق كـ string

  // 🎓 التمييز الذكي للدوام الجامعي العراقي:
  // الساعات 12 و 00 هي ظهراً (م)
  // الساعات من 1 إلى 7 في سياق الدوام النهاري/المسائي هي ظهراً ومساءً (م)
  // الساعات من 8 إلى 11 هي صباحاً (ص)
  let period = 'ص'; // 🌅 الافتراضي صباحاً
  if (h === 12 || h === 0) {
    period = 'م'; // 🕛 12 ظهراً دائماً مساءً
    h = 12; // 🔟 تثبيت الرقم 12
  } else if (h >= 13 && h <= 23) {
    period = 'م'; // 🌙 الساعات المسائية بنظام 24
    h -= 12; // 🔄 تحويل لنظام 12
  } else if (h >= 1 && h <= 7) {
    period = 'م'; // ☀️ ساعات الدوام بعد الظهر (01:00 م إلى 07:00 م)
  } else {
    period = 'ص'; // 🌅 ساعات الصباح الباكر (08:00 ص إلى 11:00 ص)
  }

  const hStr = h < 10 ? `0${h}` : `${h}`; // 🔟 إضافة صفر البادئة للترتيب والتناسق
  return `${hStr}:${m} ${period}`; // ✨ إرجاع الوقت المنسق مثلاً 12:00 م أو 08:30 ص
}

// ⏱️ دالة تحويل وتنسيق توقيت المحاضرات بإضافة (ص / م) بشكل أكاديمي ذكي ودقيق 100%
export function formatArabicScheduleTime(timeStr: string): string {
  if (!timeStr) return ''; // 🛡️ إذا كانت القيمة فارغة نرجع نص فارغ
  const clean = timeStr.trim(); // 🧹 تنظيف المسافات الزائدة
  if (clean.includes('-')) {
    const parts = clean.split('-').map((p) => p.trim()); // ✂️ تقسيم نطاق الوقت لبداية ونهاية
    return `\u200F${formatSingleTime(parts[0])} — ${formatSingleTime(parts[1])}\u200F`; // 🔄 دمج الجزأين بصيغة ص وم محصنة بعلامة RTL لمنع انقلاب الأرقام
  }
  return formatSingleTime(clean); // 🕐 تنسيق التوقيت الفردي
}

// 🗓️ الحصول على مفتاح اليوم الحالي من نظام التاريخ المحلي
export function getTodayDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
  switch (jsDay) {
    case 6: return 'saturday';
    case 0: return 'sunday';
    case 1: return 'monday';
    case 2: return 'tuesday';
    case 3: return 'wednesday';
    case 4: return 'thursday';
    case 5: return 'friday';
    default: return 'saturday';
  }
}

// ⏰ فحص حالة المحاضرة الزمنية الآن
export function getLectureLiveStatus(
  lecture: ScheduleLecture,
  currentMinutes: number,
  selectedDay: DayOfWeek,
  todayDay: DayOfWeek
): 'live' | 'upcoming' | 'finished' | 'other_day' {
  if (selectedDay !== todayDay) return 'other_day';

  const startMin = timeStringToMinutes(lecture.start_time);
  const endMin = timeStringToMinutes(lecture.end_time);

  if (currentMinutes >= startMin && currentMinutes < endMin) {
    return 'live'; // 🔴 المحاضرة جارية الآن
  }
  if (currentMinutes < startMin) {
    return 'upcoming'; // ⏳ المحاضرة قادمة اليوم
  }
  return 'finished'; // ✓ المحاضرة انتهت
}

// 📊 حساب النسبة المئوية لتقدم وقت المحاضرة الحالية (من 0% إلى 100%)
export function getLectureProgressPercentage(lecture: ScheduleLecture, currentMinutes: number): number {
  const startMin = timeStringToMinutes(lecture.start_time);
  const endMin = timeStringToMinutes(lecture.end_time);
  const duration = endMin - startMin;
  if (duration <= 0) return 0;
  const elapsed = currentMinutes - startMin;
  const pct = (elapsed / duration) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// 📐 حساب الموضع النسبي لشريط الوقت على الـ Timeline (افتراض اليوم الدراسي من 08:00 إلى 15:00)
export function calculateTimelinePositionPercentage(
  minutes: number,
  startHour: number = 8,
  endHour: number = 15
): number {
  const minStart = startHour * 60;
  const minEnd = endHour * 60;
  const totalMin = minEnd - minStart;
  if (totalMin <= 0) return 0;
  const relativeMin = minutes - minStart;
  const pct = (relativeMin / totalMin) * 100;
  return Math.max(0, Math.min(100, pct));
}

// ⚙️ استخراج إعدادات الدوام والعطل للقسم والمرحلة والكورس والكروب المستقل، مع استرداد ذكي لتاريخ بداية الفصل
export function getScheduleConfigOrDefault(
  configs: DepartmentScheduleConfig[], // 📋 مصفوفة كافة إعدادات الجداول المحفوظة
  departmentId: string, // 🏢 معرف القسم الأكاديمي
  stageNumber: number, // 🎓 رقم المرحلة الدراسية
  semester: 1 | 2, // 🗓️ الكورس الدراسي (1 أو 2)
  studyType?: 'morning' | 'evening', // ☀️ نوع الدراسة (صباحي أو مسائي)
  targetGroup?: string // 👥 الكروب المستهدف المستقل (مثلاً A أو B أو C)
): DepartmentScheduleConfig {
  // 🔍 البحث عن تاريخ بداية الفصل المعتمد للقسم من أي إعداد مسجل لهذا القسم
  const deptStartDate =
    configs.find((c) => c.department_id === departmentId && c.start_date && c.start_date.trim() !== '')?.start_date || // 🎯 تاريخ القسم المباشر
    configs.find((c) => c.start_date && c.start_date.trim() !== '')?.start_date; // 🌐 أو أي تاريخ بداية معتمد بالنظام

  // 1️⃣ إذا كان هناك كروب محدد (مثل A أو B)، نبحث عن إعدادات هذا الكروب حصراً أولاً
  if (targetGroup && targetGroup !== 'all') {
    const groupMatch = configs.find(
      (c) =>
        c.department_id === departmentId && // 🏢 مطابقة القسم
        c.stage_number === stageNumber && // 🎓 مطابقة المرحلة
        c.semester === semester && // 🗓️ مطابقة الكورس
        (!studyType || !c.study_type || c.study_type === studyType) && // ☀️ مطابقة نوع الدراسة
        c.target_group === targetGroup // 👥 مطابقة الكروب المستقل حصراً
    );
    if (groupMatch) { // ✅ إذا وجدنا إعداد مخصص لهذا الكروب
      return {
        ...groupMatch, // 📦 استرجاع إعدادات الكروب
        start_date: groupMatch.start_date || deptStartDate, // 📅 توريث تاريخ البداية إن لم يكن محدداً
      };
    }
  }

  // 2️⃣ البحث عن الإعداد العام للمرحلة (بدون كروب محدد أو للكل)
  const stageFound = configs.find(
    (c) =>
      c.department_id === departmentId && // 🏢 مطابقة القسم
      c.stage_number === stageNumber && // 🎓 مطابقة المرحلة
      c.semester === semester && // 🗓️ مطابقة الكورس
      (!studyType || !c.study_type || c.study_type === studyType) && // ☀️ مطابقة نوع الدراسة
      (!c.target_group || c.target_group === 'all') // 🌐 إعداد عام أو لكافة الكروبات
  );

  if (stageFound) { // ✅ إذا وجدنا إعداد المرحلة العام
    return {
      ...stageFound, // 📦 استرجاع إعدادات المرحلة
      start_date: stageFound.start_date || deptStartDate, // 📅 توريث تاريخ البداية المعتمد
      target_group: targetGroup && targetGroup !== 'all' ? targetGroup : stageFound.target_group, // 👥 تعيين الكروب إن وجد
    };
  }

  // 3️⃣ بحث مرن بدون تقييد نوع الدراسة للمرحلة
  const fallbackStage = configs.find(
    (c) =>
      c.department_id === departmentId && // 🏢 مطابقة القسم
      c.stage_number === stageNumber && // 🎓 مطابقة المرحلة
      c.semester === semester && // 🗓️ مطابقة الكورس
      (!c.target_group || c.target_group === 'all') // 🌐 إعداد عام
  );

  if (fallbackStage) { // ✅ في حال وجود إعداد عام سابق
    return {
      ...fallbackStage, // 📦 استرجاع الإعداد
      start_date: fallbackStage.start_date || deptStartDate, // 📅 توريث التاريخ
      target_group: targetGroup && targetGroup !== 'all' ? targetGroup : fallbackStage.target_group, // 👥 ربط الكروب
    };
  }

  // 4️⃣ القيمة الافتراضية الصافية في حال لم يتم ضبط أي إعداد بعد
  const groupSuffix = targetGroup && targetGroup !== 'all' ? `-${targetGroup}` : ''; // 🏷️ لاحقة الكروب للمعرف
  const studySuffix = studyType ? `-${studyType}` : ''; // 🏷️ لاحقة نوع الدراسة
  return {
    id: `cfg-${departmentId}-${stageNumber}-${semester}${studySuffix}${groupSuffix}`, // 🆔 معرف فريد ومستقل للإعداد
    department_id: departmentId, // 🏢 معرف القسم
    stage_number: stageNumber, // 🎓 رقم المرحلة
    semester: semester, // 🗓️ رقم الكورس
    study_type: studyType, // ☀️ نوع الدراسة
    target_group: targetGroup && targetGroup !== 'all' ? targetGroup : undefined, // 👥 الكروب المستقل
    start_date: deptStartDate, // 📅 توريث تاريخ بداية الفصل المعتمد للقسم تلقائياً
    working_days: [...DEFAULT_WORKING_DAYS], // 💼 أيام الدوام الافتراضية
    off_days: [...DEFAULT_OFF_DAYS], // 🏖️ أيام العطل الافتراضية
  };
}

// 📅 دالة مساعدة مركزية لاستخراج تاريخ انطلاق الفصل الدراسي الفعلي للقسم ومسار بولونيا
export function getDepartmentEffectiveStartDate(
  configs: DepartmentScheduleConfig[],
  departmentId?: string
): string {
  if (departmentId) {
    // 🔍 البحث عن تاريخ مخصص للقسم أولاً
    const deptMatch = configs.find(
      (c) => c.department_id === departmentId && c.start_date && c.start_date.trim() !== ''
    );
    if (deptMatch?.start_date) return deptMatch.start_date;
  }
  // 🔍 إذا لم يتوفر، البحث في أي إعداد آخر مسجل
  const anyMatch = configs.find((c) => c.start_date && c.start_date.trim() !== '');
  if (anyMatch?.start_date) return anyMatch.start_date;

  return '2026-09-20'; // 📅 تاريخ الانطلاق الافتراضي 2026-09-20
}


// 🏢 قائمة القاعات والمختبرات الرسمية المعتمدة بفرع ميسان
export const UNIVERSITY_ROOMS_CATALOG: { id: string; name: string; type: 'hall' | 'lab' | 'court' | 'seminar'; capacity: number }[] = [
  { id: 'hall-1', name: 'مدرج الخوارزمي (مدرج 1)', type: 'hall', capacity: 120 },
  { id: 'lab-1', name: 'مختبر البرمجيات والشبكات 1', type: 'lab', capacity: 45 },
  { id: 'lab-2', name: 'مختبر الحاسوب والذكاء الاصطناعي 2', type: 'lab', capacity: 40 },
  { id: 'lab-3', name: 'مختبر الإلكترونيات والمعالجات 3', type: 'lab', capacity: 35 },
  { id: 'court-1', name: 'قاعة المحكمة الافتراضية (القانون)', type: 'court', capacity: 80 },
  { id: 'seminar-1', name: 'قاعة المؤتمرات والمناقشات الكبرى', type: 'seminar', capacity: 150 },
  { id: 'class-101', name: 'قاعة دراسية 101', type: 'hall', capacity: 60 },
  { id: 'class-202', name: 'قاعة دراسية 202', type: 'hall', capacity: 60 },
  { id: 'class-203', name: 'قاعة دراسية 203', type: 'hall', capacity: 55 },
  { id: 'class-301', name: 'قاعة دراسية 301', type: 'hall', capacity: 50 },
];

// 🏷️ واجهة تفاصيل تضارب المحاضرات
export interface ScheduleConflict {
  type: 'room' | 'teacher' | 'stage'; // ⚠️ نوع التضارب (قاعة / أستاذ / مرحلة)
  message: string;                   // 📝 رسالة التنبيه التفصيلية
  conflictingLecture: ScheduleLecture; // 📚 المحاضرة المتضاربة
}

// 🛡️ دالة ذكية لفحص واكتشاف تضارب القاعات والأساتذة والمراحل والكروبات الزمنية
export function checkLectureCollisions(
  lecture: {
    day: DayOfWeek; // 🗓️ اليوم الأسبوعي
    start_time: string; // ⏱️ وقت البدء
    end_time: string; // ⏱️ وقت الانتهاء
    room?: string; // 🏛️ القاعة أو المختبر
    teacher_name?: string; // 👨‍🏫 اسم الأستاذ
    teacher_id?: string; // 👤 معرف الأستاذ
    stage_number?: number; // 🎓 رقم المرحلة
    department_id?: string; // 🏢 معرف القسم
    target_group?: string; // 👥 الكروب أو الشعبة المستهدفة
  },
  allLectures: ScheduleLecture[], // 📋 قائمة كافة المحاضرات
  excludeLectureId?: string // 🆔 استثناء المحاضرة قيد التعديل
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []; // ⚠️ مصفوفة حفظ التعارضات المكتشفة

  const startMin = timeStringToMinutes(lecture.start_time); // ⏱️ دقائق وقت البدء
  const endMin = timeStringToMinutes(lecture.end_time); // ⏱️ دقائق وقت الانتهاء

  if (startMin >= endMin) return conflicts; // 🛡️ حماية إذا كان التوقيت غير صالح

  // فحص كل المحاضرات في نفس اليوم
  const dayLectures = allLectures.filter(
    (l) => l.day === lecture.day && (!excludeLectureId || l.id !== excludeLectureId)
  );

  for (const existing of dayLectures) {
    const exStart = timeStringToMinutes(existing.start_time); // ⏱️ وقت بدء المحاضرة الحالية
    const exEnd = timeStringToMinutes(existing.end_time); // ⏱️ وقت انتهاء المحاضرة الحالية

    // التحقق من التداخل الزمني
    const isOverlapping = startMin < exEnd && exStart < endMin;

    if (isOverlapping) {
      // 🏛️ استخراج أسماء القاعات مع التنظيف والتوحيد للحروف
      const lecRoomTrimmed = lecture.room ? lecture.room.trim().toLowerCase() : ''; // 🏛️ اسم قاعة المحاضرة الجديدة
      const exRoomTrimmed = existing.room ? existing.room.trim().toLowerCase() : ''; // 🏛️ اسم قاعة المحاضرة المسجلة مسبقاً

      // 🛑 شرط عراقي صارم وفق تعليمات النظام: التعارض لا يحدث إطلاقاً إلا إذا كانت المحاضرتان في نفس القاعة حصراً!
      // إذا كانت المحاضرات في قاعات مختلفة (أو لم يتم تحديد نفس القاعة بعد)، فلا يُعتبر ذلك تعارضاً ولا يتم تعطيل الحفظ
      const isSameRoom = Boolean(lecRoomTrimmed && exRoomTrimmed && lecRoomTrimmed === exRoomTrimmed);

      if (!isSameRoom) {
        continue; // 🚀 إذا بقاعات مختلفة ما يصير تعارض نهائياً ونعبر للمحاضرة التالية بسلام
      }

      // 👥 استخراج لاحقة الكروب لتضمينها بالنص التوضيحي إذا وجد كروب
      const exGrp = existing.target_group || 'all'; // 🏷️ كروب المحاضرة المسجلة
      const groupSuffix = exGrp !== 'all' ? ` (كروب ${exGrp})` : ''; // 🏷️ لاحقة اسم الكروب

      // 1. تضارب الأستاذ المحاضر في نفس القاعة
      if (
        (lecture.teacher_id && existing.teacher_id && lecture.teacher_id === existing.teacher_id) || // 👨‍🏫 فحص تطابق الآيدي مال الأستاذ
        (lecture.teacher_name && existing.teacher_name && lecture.teacher_name.trim().toLowerCase() === existing.teacher_name.trim().toLowerCase()) // 🔤 فحص تطابق الاسم إذا ماكو آيدي
      ) {
        conflicts.push({
          type: 'teacher', // 🏷️ نوع التعارض للأستاذ
          message: `تعارض قاعة وأستاذ: الأستاذ (${existing.teacher_name}) لديه محاضرة أخرى (${existing.course_name} - المرحلة ${existing.stage_number}${groupSuffix}) في نفس القاعة (${existing.room}) ونفس التوقيت (${existing.start_time} - ${existing.end_time})!`, // 📢 نص الرسالة التوضيحية
          conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
        });
        continue; // 🛑 نوقف الفحص لهالمحاضرة ونكتفي بالتضارب الأول
      }

      // 2. تضارب نفس المرحلة والكروب في نفس القاعة
      if (
        lecture.department_id && // 🏢 فحص وجود آيدي القسم
        existing.department_id && // 🏢 فحص وجود آيدي قسم المحاضرة السابقة
        lecture.department_id === existing.department_id && // ⚖️ التأكد من تطابق القسمين
        lecture.stage_number && // 🎓 فحص رقم المرحلة
        existing.stage_number && // 🎓 فحص رقم مرحلة المحاضرة السابقة
        lecture.stage_number === existing.stage_number // ⚖️ التأكد من تطابق رقم المرحلة
      ) {
        const lecGrp = lecture.target_group || 'all'; // 🏷️ كروب المحاضرة الجديدة
        const isSameGroupOrAll = lecGrp === 'all' || exGrp === 'all' || lecGrp === exGrp; // ⚖️ فحص تطابق الكروب

        if (isSameGroupOrAll) {
          conflicts.push({
            type: 'stage', // 🏷️ نوع التعارض للمرحلة والكروب
            message: `المرحلة ${existing.stage_number}${groupSuffix} لديها محاضرة أخرى (${existing.course_name}) في نفس القاعة (${existing.room}) ونفس التوقيت (${existing.start_time} - ${existing.end_time})!`, // 📢 رسالة انشغال القاعة للمرحلة
            conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
          });
          continue; // 🛑 نكتفي بهذا التضارب
        }
      }

      // 3. تضارب حجز القاعة العام (القاعة محجوزة لمادة أو مرحلة أخرى بنفس الوقت)
      conflicts.push({
        type: 'room', // 🏷️ نوع التعارض للقاعة المشغولة
        message: `القاعة (${existing.room}) محجوزة بالفعل لمادة (${existing.course_name} - المرحلة ${existing.stage_number}${groupSuffix}) في نفس التوقيت (${existing.start_time} - ${existing.end_time})!`, // 📢 رسالة حجز القاعة
        conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
      });
    }
  }

  // 🛡️ الاكتفاء بالتضارب الأول الأهم والأوضح فقط لإلغاء أي تكرار وضمان واجهة احترافية 100%
  return conflicts.slice(0, 1); // 🎯 نرجع بس أول تضارب صار حتى يكون الكارت مرتب واحترافي
}

// 💡 دالة اقتراح القاعات والمختبرات الشاغرة غير المحجوزة في وقت معين
export function getAvailableRoomsForSlot(
  day: DayOfWeek,
  startTime: string,
  endTime: string,
  allLectures: ScheduleLecture[],
  excludeLectureId?: string
): typeof UNIVERSITY_ROOMS_CATALOG {
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);

  if (startMin >= endMin) return UNIVERSITY_ROOMS_CATALOG;

  // جلب القاعات المشغولة في هذا التوقيت
  const bookedRooms = new Set<string>();

  allLectures
    .filter((l) => l.day === day && (!excludeLectureId || l.id !== excludeLectureId))
    .forEach((l) => {
      const exStart = timeStringToMinutes(l.start_time);
      const exEnd = timeStringToMinutes(l.end_time);
      if (startMin < exEnd && exStart < endMin) {
        bookedRooms.add(l.room.trim().toLowerCase());
      }
    });

  return UNIVERSITY_ROOMS_CATALOG.filter(
    (r) => !bookedRooms.has(r.name.trim().toLowerCase())
  );
}

// 🛡️ دالة فحص وكشف تضارب مواعيد الامتحانات النهائية والقاعات والمشرفين
export function checkFinalExamCollisions(
  newSlot: Partial<FinalExamSlot>,
  allSlots: FinalExamSlot[],
  excludeSlotId?: string
): ExamConflict[] {
  const conflicts: ExamConflict[] = [];
  if (!newSlot.exam_date || !newSlot.start_time || !newSlot.end_time) return conflicts;

  const newStart = timeStringToMinutes(newSlot.start_time);
  const newEnd = timeStringToMinutes(newSlot.end_time);

  if (newStart >= newEnd) {
    conflicts.push({
      type: 'time_overlap',
      message: 'وقت بدء الامتحان يجب أن يكون قبل وقت الانتهاء!',
    });
    return conflicts;
  }

  for (const existing of allSlots) {
    if (excludeSlotId && existing.id === excludeSlotId) continue;
    if (existing.exam_date !== newSlot.exam_date) continue;

    const exStart = timeStringToMinutes(existing.start_time);
    const exEnd = timeStringToMinutes(existing.end_time);
    const isOverlapping = newStart < exEnd && exStart < newEnd;

    // 1. تضارب القاعة في نفس اليوم والوقت المتداخل
    if (
      isOverlapping &&
      newSlot.hall_name &&
      existing.hall_name &&
      newSlot.hall_name.trim().toLowerCase() === existing.hall_name.trim().toLowerCase() &&
      (!newSlot.building_name || !existing.building_name || newSlot.building_name.trim().toLowerCase() === existing.building_name.trim().toLowerCase())
    ) {
      conflicts.push({
        type: 'hall',
        message: `القاعة الامتحانية (${existing.hall_name} - ${existing.building_name}) محجوزة بالفعل لمادة (${existing.course_name}) في نفس اليوم والتوقيت (${existing.start_time} - ${existing.end_time})!`,
        conflictingSlot: existing,
      });
    }

    // 2. تضارب المشرف / المراقب في قاعتين مختلفتين بنفس الوقت
    if (
      isOverlapping &&
      newSlot.supervisor_name &&
      existing.supervisor_name &&
      newSlot.supervisor_name.trim() !== '' &&
      newSlot.supervisor_name.trim().toLowerCase() === existing.supervisor_name.trim().toLowerCase()
    ) {
      conflicts.push({
        type: 'supervisor',
        message: `المشرف (${existing.supervisor_name}) مكلف بالفعل بالإشراف على امتحان (${existing.course_name}) في قاعة (${existing.hall_name}) في نفس الوقت!`,
        conflictingSlot: existing,
      });
    }

    // 3. تضارب نفس الجدول/المرحلة (امتحانين في نفس اليوم لنفس المرحلة)
    if (
      newSlot.schedule_id &&
      existing.schedule_id &&
      newSlot.schedule_id === existing.schedule_id
    ) {
      conflicts.push({
        type: 'stage_day',
        message: `يوجد امتحان آخر مجدول بالفعل لنفس المرحلة في هذا اليوم: (${existing.course_name} - ${existing.start_time})! وفق لوائح بولونيا يفضل عدم جدولة امتحانين لنفس المرحلة في نفس اليوم.`,
        conflictingSlot: existing,
      });
    }
  }

  return conflicts;
}

// ==============================================================================
// 📅 دوال التعاقب والتحويل التقويمي الذكي للأسابيع الـ 15 لمسار بولونيا
// ==============================================================================

// 🗓️ دالة تحويل التاريخ التقويمي إلى اليوم الأكاديمي المعتمد (السبت، الأحد، ...)
export function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  if (!dateStr) return 'saturday'; // 🛡️ حماية إذا كان التاريخ فارغاً
  const parts = dateStr.split('-'); // ✂️ تقسيم YYYY-MM-DD
  if (parts.length !== 3) return 'saturday'; // 🛡️ فحص اكتمال صيغة التاريخ
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); // 📆 بناء كائن التاريخ بدقة
  const dayIndex = d.getDay(); // 0 = الأحد, 1 = الاثنين, ..., 6 = السبت
  const map: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[dayIndex] || 'saturday'; // 🎯 إرجاع اليوم الأكاديمي
}

// 📆 دالة مساعدة لتنسيق التاريخ كـ YYYY-MM-DD
export function formatDateToIsoString(d: Date): string {
  const y = d.getFullYear(); // 📅 استخراج السنة
  const m = String(d.getMonth() + 1).padStart(2, '0'); // 🗓️ الشهر بصفر البادئة
  const day = String(d.getDate()).padStart(2, '0'); // 📆 اليوم بصفر البادئة
  return `${y}-${m}-${day}`; // 📌 صيغة ISO القياسية
}

// 🧮 دالة احتساب التاريخ التقويمي الدقيق لأي يوم في أي أسبوع فصلي من الأسبوع 1 إلى 15
export function calculateDateForAnyDayInWeek(
  baseDateStr: string, // 📅 تاريخ الأساس للأسبوع الأول
  baseWeek: number,    // 🔢 رقم الأسبوع الأساس (افتراضياً 1)
  targetWeek: number,  // 🎯 الأسبوع المستهدف (1 إلى 15)
  targetDay: DayOfWeek // 🗓️ اليوم المطلوب معرفة تاريخه
): string {
  if (!baseDateStr) return ''; // 🛡️ إذا لم يتوفر تاريخ أساس نرجع فارغاً
  const baseDay = getDayOfWeekFromDateString(baseDateStr); // 🗓️ استخراج يوم تاريخ الأساس
  const dayOrder: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']; // 📋 ترتيب أيام الأسبوع الأكاديمي
  const dayOffset = dayOrder.indexOf(targetDay) - dayOrder.indexOf(baseDay); // 📏 فارق الأيام داخل نفس الأسبوع

  const parts = baseDateStr.split('-'); // ✂️ تحليل التاريخ
  if (parts.length !== 3) return '';
  const baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); // 📆 إنشاء كائن التاريخ
  const weekDiff = targetWeek - baseWeek; // 🔢 فارق الأسابيع
  const totalDayShift = weekDiff * 7 + dayOffset; // ➕ إجمالي الأيام المطلوبة للإزاحة

  baseDate.setDate(baseDate.getDate() + totalDayShift); // 🕒 احتساب التاريخ الجديد بدقة تامة ومحمية من التوقيت الصيفي والشتوي
  return formatDateToIsoString(baseDate); // 🏁 إرجاع التاريخ بصيغة YYYY-MM-DD
}

// 🌟 دالة التوليد التلقائي لتواريخ كافة الأسابيع الـ 15 لمحاضرة معينة بنقرة واحدة
export function generateAll15WeeksDates(
  baseDateStr: string, // 📅 تاريخ المحاضرة الأساس
  lectureDay: DayOfWeek, // 🗓️ اليوم الأسبوعي للمحاضرة
  baseWeek = 1 // 🔢 رقم أسبوع تاريخ الأساس
): Array<{ weekNumber: number; date: string; day: DayOfWeek; dayLabelAr: string }> {
  const result: Array<{ weekNumber: number; date: string; day: DayOfWeek; dayLabelAr: string }> = [];
  if (!baseDateStr) return result; // 🛡️ حماية إذا كان التاريخ غير محدد

  for (let w = 1; w <= 15; w++) {
    const computedDate = calculateDateForAnyDayInWeek(baseDateStr, baseWeek, w, lectureDay); // 🧮 حساب تاريخ الأسبوع w
    const dayMeta = DAYS_OF_WEEK_LIST.find((d) => d.key === lectureDay); // 🏷️ بيانات اليوم العربي
    result.push({
      weekNumber: w, // 🔢 رقم الأسبوع
      date: computedDate, // 📅 التاريخ الفعلي المحسوب
      day: lectureDay, // 🗓️ اليوم الأكاديمي
      dayLabelAr: dayMeta?.label_ar || lectureDay, // 📝 الاسم العربي لليوم
    });
  }
  return result; // 🏁 إرجاع قائمة الأسابيع الـ 15 كاملة
}

// 🔄 دالة النقل العام والتحويل الشامل بين أي يوم وأي يوم آخر (مثال: من السبت للأحد، أو من الاثنين للسبت)
export function shiftLectureToAnyDay(
  currentDay: DayOfWeek, // 📅 اليوم الأصلي للمحاضرة
  newDay: DayOfWeek,     // 🗓️ اليوم الجديد المراد النقل إليه (أي يوم في الأسبوع)
  fromWeek: number,      // 🔢 بدءاً من أي أسبوع (مثلاً من الأسبوع 3 فصاعداً)
  baseDateStr: string,   // 📆 تاريخ الأساس الحالي
  totalWeeks: number = 15, // 🔢 إجمالي أسابيع الفصل (15 أسبوعاً)
  baseWeek = 1           // 🔢 رقم أسبوع تاريخ الأساس
): Record<number, { day: DayOfWeek; date: string }> {
  const overrides: Record<number, { day: DayOfWeek; date: string }> = {};
  if (!baseDateStr) return overrides; // 🛡️ حماية من التاريخ الفارغ

  for (let w = fromWeek; w <= totalWeeks; w++) {
    const newComputedDate = calculateDateForAnyDayInWeek(baseDateStr, baseWeek, w, newDay); // 🧮 احتساب تاريخ اليوم الجديد لكل أسبوع لاحق
    overrides[w] = {
      day: newDay, // 🗓️ اليوم الجديد المنقول إليه
      date: newComputedDate, // 📅 التاريخ التقويمي الدقيق لليوم الجديد
    };
  }
  return overrides; // 🏁 إرجاع تخصيصات وتواريخ الأسابيع اللاحقة كاملة
}

// 🗓️ أسماء الشهور المعتمدة بالعراق والتقويم الأكاديمي الرسمي
export const IRAQI_ARABIC_MONTHS = [
  'كانون الثاني', // 1
  'شباط',        // 2
  'آذار',        // 3
  'نيسان',       // 4
  'أيار',        // 5
  'حزيران',      // 6
  'تموز',        // 7
  'آب',          // 8
  'أيلول',       // 9
  'تشرين الأول', // 10
  'تشرين الثاني',// 11
  'كانون الأول', // 12
];

// 🧮 دالة احتساب رقم الأسبوع الدراسي (1 إلى 15) بناءً على الفارق الزمني عن تاريخ البداية
export function calculateAcademicWeekFromDate(
  baseStartDateStr: string, // 📅 تاريخ انطلاق الفصل الدراسي (الأسبوع 1)
  targetDateStr: string     // 🎯 التاريخ المطلوب فحص أسبوعه
): number {
  if (!baseStartDateStr || !targetDateStr) return 1; // 🛡️ إذا لم تتوفر تواريخ نرجع الأسبوع الأول كقيمة آمنة
  const p1 = baseStartDateStr.split('-').map(Number); // ✂️ تفكيك تاريخ البداية
  const p2 = targetDateStr.split('-').map(Number); // ✂️ تفكيك التاريخ المستهدف
  if (p1.length !== 3 || p2.length !== 3) return 1; // 🛡️ التحقق من اكتمال الأرقام
  const d1 = new Date(p1[0], p1[1] - 1, p1[2]); // 📆 كائن تاريخ البداية
  const d2 = new Date(p2[0], p2[1] - 1, p2[2]); // 📆 كائن التاريخ المستهدف
  d1.setHours(0, 0, 0, 0); // 🕒 تصفير الساعات للدقة
  d2.setHours(0, 0, 0, 0); // 🕒 تصفير الساعات للدقة
  const diffTime = d2.getTime() - d1.getTime(); // ⏳ الفارق بالميلي ثانية
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // 📅 الفارق بالأيام الفعلية
  if (diffDays < 0) return 1; // 🔙 إذا كان التاريخ قبل بداية الفصل يعتبر الأسبوع الأول
  const calcWeek = Math.floor(diffDays / 7) + 1; // 🔢 قسمة الأيام على 7 للحصول على الأسبوع بدقة
  return Math.min(Math.max(calcWeek, 1), 15); // 🎯 قفل النطاق بين الأسبوع 1 إلى 15 لمسار بولونيا
}

// ⚡ دالة اكتشاف وتحديد الأسبوع الأكاديمي الحالي الذكي نسبةً لتاريخ اليوم الفعلي
export function getCurrentAcademicWeek(baseStartDateStr?: string): number {
  if (!baseStartDateStr) return 1; // 🛡️ حماية إذا لم يتوفر تاريخ البداية
  const today = new Date(); // 🕒 تاريخ اليوم الحالي بالجهاز
  const y = today.getFullYear(); // 📅 السنة الحالية
  const m = String(today.getMonth() + 1).padStart(2, '0'); // 🗓️ الشهر بصفر البادئة
  const d = String(today.getDate()).padStart(2, '0'); // 📆 اليوم بصفر البادئة
  const todayIso = `${y}-${m}-${d}`; // 📌 صيغة ISO القياسية لتاريخ اليوم
  return calculateAcademicWeekFromDate(baseStartDateStr, todayIso); // 🧮 احتساب الأسبوع الحالي الذكي
}

// 🏷️ دالة تنسيق التاريخ التقويمي بالعربية مع اسم اليوم ليكون فائق الوضوح والجمال
export function formatDateArabicWithDay(dateStr: string): string {
  if (!dateStr) return ''; // 🛡️ حماية من النص الفارغ
  const dayKey = getDayOfWeekFromDateString(dateStr); // 🗓️ استخراج مفتاح اليوم
  const dayMeta = DAYS_OF_WEEK_LIST.find((d) => d.key === dayKey); // 🏷️ بيانات اليوم العربي
  const parts = dateStr.split('-'); // ✂️ تفكيك التاريخ YYYY-MM-DD
  if (parts.length !== 3) return dateStr; // 🛡️ إذا لم تكن صيغة مكتملة نرجع النص كما هو
  const year = parts[0]; // 📅 السنة
  const monthIdx = parseInt(parts[1], 10) - 1; // 🗓️ فهرس الشهر
  const dayNum = parseInt(parts[2], 10); // 📆 رقم اليوم بدون أصفار زائدة
  const monthName = IRAQI_ARABIC_MONTHS[monthIdx] || parts[1]; // 🏷️ اسم الشهر بالعربية
  const dayName = dayMeta?.label_ar || ''; // 📝 اسم اليوم بالعربية
  return `${dayName ? `${dayName}، ` : ''}${dayNum} ${monthName} ${year}`; // 🌟 تنسيق كامل: الأحد، 20 أيلول 2026
}

// 🏷️ دالة صياغة تسلسل المحاضرة باللفظ الترتيبي العربي الأكاديمي الفصيح (المحاضرة الأولى، المحاضرة الثانية...)
export function formatArabicOrdinalLectureName(order: number): string { // 🔢 دالة تاخذ رقم التسلسل وترجع اسمه الفصيح
  const ordinalMap: Record<number, string> = { // 🗺️ قاموس التسلسلات الأكاديمية المعتمدة
    1: 'المحاضرة الأولى', // 🥇 المحاضرة الأولى
    2: 'المحاضرة الثانية', // 🥈 المحاضرة الثانية
    3: 'المحاضرة الثالثة', // 🥉 المحاضرة الثالثة
    4: 'المحاضرة الرابعة', // 🏅 المحاضرة الرابعة
    5: 'المحاضرة الخامسة', // 🎖️ المحاضرة الخامسة
    6: 'المحاضرة السادسة', // 🌟 المحاضرة السادسة
    7: 'المحاضرة السابعة', // ✨ المحاضرة السابعة
    8: 'المحاضرة الثامنة', // 🎯 المحاضرة الثامنة
    9: 'المحاضرة التاسعة', // 📌 المحاضرة التاسعة
    10: 'المحاضرة العاشرة', // 🔟 المحاضرة العاشرة
  }; // 🔚 نهاية خريطة الأسماء
  return ordinalMap[order] || `المحاضرة رقم ${order}`; // 🚀 نرجع الاسم الفصيح أو رقم المحاضرة إذا عبرت العشرة
} // 🔚 نهاية الدالة

// 🔤 دالة لغوية لصياغة عدد المحاضرات بقواعد لغة عربية سليمة ومضبوطة نحوياً (بدلاً من 4 محاضرة)
export function formatArabicLectureCount(count: number): string { // 🔢 دالة تاخذ عدد المحاضرات وترجع النص المضبوط لغوياً
  if (count <= 0) return 'لا توجد محاضرات'; // 🛡️ إذا ماكو محاضرات نرجع نص واضح
  if (count === 1) return 'محاضرة واحدة'; // 🎯 مفرد مؤنث مضبوط
  if (count === 2) return 'محاضرتان'; // ✌️ مثنى مؤنث مضبوط
  if (count >= 3 && count <= 10) return `${count} محاضرات`; // 📚 جمع قلة سليم (مثلاً 4 محاضرات)
  return `${count} محاضرة`; // 🔢 تمييز مفرد منصوب بعد العشرة (مثلاً 12 محاضرة)
} // 🔚 نهاية الدالة


