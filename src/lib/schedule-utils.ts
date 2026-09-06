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

// ⏰ تحويل نص الوقت 'HH:mm' إلى عدد الدقائق من بداية اليوم
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// ⏰ تحويل عدد الدقائق إلى نص وقت 'HH:mm'
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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

// ⚙️ استخراج إعدادات الدوام والعطل للقسم والمرحلة والكورس، مع توفير القيمة الافتراضية
export function getScheduleConfigOrDefault(
  configs: DepartmentScheduleConfig[],
  departmentId: string,
  stageNumber: number,
  semester: 1 | 2
): DepartmentScheduleConfig {
  const found = configs.find(
    (c) => c.department_id === departmentId && c.stage_number === stageNumber && c.semester === semester
  );
  if (found) return found;

  return {
    id: `cfg-${departmentId}-${stageNumber}-${semester}`,
    department_id: departmentId,
    stage_number: stageNumber,
    semester: semester,
    working_days: [...DEFAULT_WORKING_DAYS],
    off_days: [...DEFAULT_OFF_DAYS],
  };
}

// 🏢 قائمة القاعات والمختبرات الرسمية المعتمدة بفرع ميسان
export const UNIVERSITY_ROOMS_CATALOG: { id: string; name: string; type: 'hall' | 'lab' | 'court' | 'seminar'; capacity: number }[] = [
  { id: 'hall-1', name: 'مدرج الخوارزمي (مدرج 1)', type: 'hall', capacity: 120 },
  { id: 'hall-2', name: 'مدرج الفارابي (مدرج 2)', type: 'hall', capacity: 100 },
  { id: 'hall-3', name: 'مدرج البيروني (مدرج 3)', type: 'hall', capacity: 90 },
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

// 🛡️ دالة ذكية لفحص واكتشاف تضارب القاعات والأساتذة والمراحل الزمنية
export function checkLectureCollisions(
  lecture: {
    day: DayOfWeek;
    start_time: string;
    end_time: string;
    room?: string;
    teacher_name?: string;
    teacher_id?: string;
    stage_number?: number;
    department_id?: string;
  },
  allLectures: ScheduleLecture[],
  excludeLectureId?: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  const startMin = timeStringToMinutes(lecture.start_time);
  const endMin = timeStringToMinutes(lecture.end_time);

  if (startMin >= endMin) return conflicts;

  // فحص كل المحاضرات في نفس اليوم
  const dayLectures = allLectures.filter(
    (l) => l.day === lecture.day && (!excludeLectureId || l.id !== excludeLectureId)
  );

  for (const existing of dayLectures) {
    const exStart = timeStringToMinutes(existing.start_time);
    const exEnd = timeStringToMinutes(existing.end_time);

    // التحقق من التداخل الزمني
    const isOverlapping = startMin < exEnd && exStart < endMin;

    if (isOverlapping) {
      // 1. تضارب الأستاذ المحاضر (أولوية قصوى لأن الأستاذ مستحيل يدرس بمكانين بنفس الدقيقة)
      if (
        (lecture.teacher_id && existing.teacher_id && lecture.teacher_id === existing.teacher_id) || // 👨‍🏫 فحص تطابق الآيدي مال الأستاذ
        (lecture.teacher_name && existing.teacher_name && lecture.teacher_name.trim().toLowerCase() === existing.teacher_name.trim().toLowerCase()) // 🔤 فحص تطابق الاسم إذا ماكو آيدي
      ) {
        conflicts.push({
          type: 'teacher', // 🏷️ نوع التعارض للأستاذ
          message: `الأستاذ (${existing.teacher_name}) لديه محاضرة أخرى (${existing.course_name} - المرحلة ${existing.stage_number}) في نفس التوقيت (${existing.start_time} - ${existing.end_time})!`, // 📢 نص الرسالة التوضيحية
          conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
        });
        continue; // 🛑 نوقف الفحص لهالمحاضرة ونكتفي بأول تضارب حتى ما يتكرر ويا المرحلة
      }

      // 2. تضارب القاعة
      if (
        lecture.room && // 🏛️ التأكد من وجود اسم القاعة بالمدخل
        existing.room && // 🏛️ التأكد من وجود القاعة بالمحاضرة القديمة
        lecture.room.trim().toLowerCase() === existing.room.trim().toLowerCase() // 🔍 فحص تطابق اسم القاعة
      ) {
        conflicts.push({
          type: 'room', // 🏷️ نوع التعارض للقاعة
          message: `القاعة (${existing.room}) محجوزة بالفعل لمادة (${existing.course_name} - المرحلة ${existing.stage_number}) في نفس الوقت (${existing.start_time} - ${existing.end_time})!`, // 📢 رسالة حجز القاعة
          conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
        });
        continue; // 🛑 نوقف الفحص لهالمحاضرة ونكتفي بالتضارب الأول
      }

      // 3. تضارب نفس المرحلة والقسم
      if (
        lecture.department_id && // 🏢 فحص وجود آيدي القسم
        existing.department_id && // 🏢 فحص وجود آيدي قسم المحاضرة السابقة
        lecture.department_id === existing.department_id && // ⚖️ التأكد من تطابق القسمين
        lecture.stage_number && // 🎓 فحص رقم المرحلة
        existing.stage_number && // 🎓 فحص رقم مرحلة المحاضرة السابقة
        lecture.stage_number === existing.stage_number // ⚖️ التأكد من تطابق رقم المرحلة
      ) {
        conflicts.push({
          type: 'stage', // 🏷️ نوع التعارض للمرحلة الدراسية
          message: `المرحلة ${existing.stage_number} لديها محاضرة أخرى مجدولة (${existing.course_name}) في نفس الوقت (${existing.start_time} - ${existing.end_time})!`, // 📢 رسالة انشغال طلاب المرحلة
          conflictingLecture: existing, // 🔗 كائن المحاضرة المتعارضة
        });
        continue; // 🛑 نكتفي بهذا التضارب ونمنع أي تكرار إضافي
      }
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

