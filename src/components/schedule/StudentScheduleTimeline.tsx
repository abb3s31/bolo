'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🗓️ المكون التفاعلي الحركي الموحد للجدول الأسبوعي والـ Timeline المباشر - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useCallback } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والوقت اللحظي
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لعرض نافذة الطباعة مباشرة على جذر الصفحة
import { DayOfWeek, ScheduleLecture, DepartmentScheduleConfig, LectureColor, UserProfile, Department, Course, TeacherCourse, StageGroupConfig } from '@/types'; // 🔗 استيراد الأنواع الرسمية وإعدادات الكروبات
import { getStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_TEACHER_COURSES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 قراءة بيانات المستخدمين والأقسام والعام الدراسي المعتمد
import { INITIAL_STAGE_GROUP_CONFIGS } from '@/lib/groups-service'; // 🏛️ استيراد التكوينات الافتراضية لكروبات المراحل
import { GroupBadgeSvg, GroupUsersSvg } from '@/components/common/GroupSvgIcons'; // 👥 استيراد أيقونات الكروبات الفيكتورية النقية SVG
import {
  DAYS_OF_WEEK_LIST,
  LECTURE_COLOR_THEMES,
  LECTURE_TYPE_LABELS,
  timeStringToMinutes,
  minutesToTimeString,
  getTodayDayOfWeek,
  getLectureLiveStatus,
  getLectureProgressPercentage,
  getScheduleConfigOrDefault,
  calculateDateForAnyDayInWeek,
  getDayOfWeekFromDateString, // 🗓️ استنتاج اليوم الأكاديمي المعتمد من التاريخ
  getCurrentAcademicWeek,
  formatDateArabicWithDay,
  IRAQI_ARABIC_MONTHS,
  formatArabicOrdinalLectureName, // 🏷️ استيراد دالة الترتيب الأكاديمي الفصيح
  formatArabicLectureCount,       // 🔤 استيراد دالة صياغة عدد المحاضرات السليمة نحوياً
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول والأسابيع الـ 15 والتواريخ الذكية
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 تحويل رقم المرحلة إلى اسمها العربي الفصيح
import {
  Clock,
  Calendar,
  Users, // 👥 استبدال أيقونة النجوم بالأيقونة المناسبة
  MapPin,
  User,
  BookOpen,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sun,
  Moon,
  Radio,
  Printer,
  Building2,
  FlaskConical,
  UserCheck,
  CalendarDays,
  X, // ❌ أيقونة إغلاق نافذة المعاينة والطباعة
  ChevronDown, // 🔽 أيقونة سهم منسدل SVG لزر عرض التفاصيل
  FileSpreadsheet, // 📊 أيقونة الإكسل
} from 'lucide-react'; // 🎨 أيقونات واجهة المستخدم SVG
import { exportPersonalWeeklyScheduleExcel } from '@/lib/excel-utils'; // 📊 دالة تصدير الجدول الدراسي الأسبوعي الفاخر لإكسل

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

// ⏰ دالة مساعدة لحساب الساعة بنظام 12 ساعة وإضافة ص أو م بدقة أكاديمية جامعية
function formatSingleTime(t: string): string {
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
  return `${hStr}:${m} ${period}`; // ✨ إرجاع الوقت المنسق مثلاً 12:00 م أو 01:00 م
}

// 🕒 دالة حساب الدقائق الأكاديمية الذكية لفرز المحاضرات بالترتيب الزمني الصحيح
export function getAcademicSlotOrder(timeStr: string): number {
  if (!timeStr) return 0; // 🛡️ حماية من النص الفارغ
  const match = timeStr.match(/(\d{1,2}):(\d{2})/); // 🔍 استخراج الوقت
  if (!match) return 0; // ⚠️ إرجاع صفر إذا لم يطابق
  let h = parseInt(match[1], 10); // 🔢 استخراج الساعة
  const m = parseInt(match[2], 10) || 0; // ⏱️ استخراج الدقائق
  if (h === 0) h = 12; // 🕛 معالجة الساعة 00 كـ 12 ظهراً
  if (h >= 1 && h <= 7) h += 12; // ☀️ تحويل الساعات بعد الظهر إلى 13 وما بعدها للفرز الزمني الصحيح
  return h * 60 + m; // 🧮 إرجاع مجموع الدقائق للترتيب الدقيق
}

// 📅 دالة تنسيق تاريخ الإصدار الرسمي المعتمد بطريقة محكمة بدون أي تداخل Bidi
export function formatOfficialIssueDate(date = new Date()): string {
  const y = date.getFullYear(); // 📆 استخراج السنة
  const m = String(date.getMonth() + 1).padStart(2, '0'); // 🗓️ استخراج الشهر بمرتبتين
  const d = String(date.getDate()).padStart(2, '0'); // 📅 استخراج اليوم بمرتبتين
  return `${d} / ${m} / ${y}`; // 📌 إرجاع الصيغة الرسمية الثابتة مثلاً 07 / 09 / 2026
}

// 🏷️ إعادة تصدير دوال الترتيب والعدد الأكاديمي من المكتبة المركزية schedule-utils لضمان التوافقية التامة 100%
export { formatArabicOrdinalLectureName, formatArabicLectureCount };

// ⏱️ دالة حساب وتنسيق مدة المحاضرة بالعربية الفصيحة بدقة جامعية (ساعة ونصف، ساعة واحدة)
export function formatLectureDurationArabic(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return ''; // 🛡️ حماية من المدخلات الفارغة
  const start = timeStringToMinutes(startTime); // 🕒 وقت البدء بالدقائق
  const end = timeStringToMinutes(endTime); // 🕒 وقت الانتهاء بالدقائق
  const diff = end >= start ? end - start : (end + 1440) - start; // 🧮 حساب الفارق الزمني الصافي
  if (diff <= 0) return ''; // 🛡️ إذا صفر نرجع نص فارغ
  if (diff === 60) return 'ساعة واحدة (60 د)'; // 🎯 ساعة قياسية
  if (diff === 90) return 'ساعة ونصف (90 د)'; // 🎓 ساعة ونصف معتمدة
  if (diff === 120) return 'ساعتان (120 د)'; // ✌️ ساعتان
  if (diff < 60) return `${diff} دقيقة`; // ⏱️ بالدقائق المباشرة
  const hrs = Math.floor(diff / 60); // 🔢 الساعات
  const mins = diff % 60; // ⏱️ الدقائق المتبقية
  return `${hrs} ${hrs === 1 ? 'ساعة' : hrs === 2 ? 'ساعتان' : 'ساعات'} ${mins > 0 ? `و ${mins} د` : ''}`; // ✨ تجميع المدة الفصيحة
}

// 🏛️ دالة تحسين مسمى القاعة أو المختبر بذكاء أكاديمي إذا كان المكتوب مجرد رقم (مثل 1 أو 2)
export function formatAcademicRoomName(room: string, type: string): string {
  if (!room) return 'القاعة الدراسية'; // 🛡️ افتراضي إذا لم تحدد
  const clean = room.trim(); // 🧹 تنظيف المسافات الزائدة
  if (/^\d+$/.test(clean)) { // 🔍 إذا كان المدخل مجرد رقم رقمي جاف
    if (type === 'practical') return `مختبر الحاسوب (${clean})`; // 💻 تحويل الرقم لمختبر حاسوب معتمد
    return `القاعة الدراسية (${clean})`; // 🏛️ تحويل الرقم لقاعة دراسية فخمة
  }
  return clean; // 📌 إرجاع الاسم كما هو إذا كان مفصلاً مثل قاعة 101 أو مختبر الحاسوب 1
}

// 🏷️ واجهة خصائص المكون
interface StudentScheduleTimelineProps {
  departmentId: string;           // 🏢 معرف القسم
  departmentName: string;         // 🏢 اسم القسم بالعربية
  stageNumber: number;            // 🎓 رقم المرحلة (1، 2، 3، 4)
  lectures: ScheduleLecture[];    // 📚 كافة المحاضرات المتاحة
  configs: DepartmentScheduleConfig[]; // ⚙️ إعدادات الدوام والعطل
  academicYear?: string;          // 🗓️ العام الدراسي المعتمد (اختياري)
  initialSemester?: 1 | 2;        // 🗓️ الفصل الدراسي المبدئي
  initialStudyType?: 'morning' | 'evening'; // ☀️🌙 الفترة الدراسية
  showSemesterSwitcher?: boolean; // 🔄 إظهار مبدل الكورس
  departmentHeadName?: string;    // 👤 اسم رئيس القسم الفعلي (اختياري)
  rapporteurName?: string;        // 👤 اسم مقرر القسم الفعلي (اختياري)
  initialOpenPrintModal?: boolean; // 🖨️ فتح نافذة الطباعة فور تحميل المكون
  onClosePrintModal?: () => void;  // 🚪 حدث عند إغلاق نافذة الطباعة
  studentGroup?: string;          // 🏷️ كروب الطالب المسجل بحسابه (إن وجد)
  initialGroup?: string;          // 👥 الكروب المبدئي الممرر من شاشة القسم أو المعاينة
  stageGroupConfigs?: StageGroupConfig[]; // ⚙️ إعدادات كروبات المراحل الأكاديمية
}

export default function StudentScheduleTimeline({
  departmentId,
  departmentName,
  stageNumber,
  lectures,
  configs,
  academicYear,
  initialSemester = 1,
  initialStudyType = 'morning',
  showSemesterSwitcher = true,
  departmentHeadName,
  rapporteurName,
  initialOpenPrintModal = false,
  onClosePrintModal,
  studentGroup,
  initialGroup,
  stageGroupConfigs,
}: StudentScheduleTimelineProps) {
  // 📌 الحالات
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(initialSemester);
  const [selectedStudyType, setSelectedStudyType] = useState<'morning' | 'evening'>(initialStudyType);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  const [currentRealDay, setCurrentRealDay] = useState<DayOfWeek>('saturday');
  const [currentClockString, setCurrentClockString] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false); // ⚡ حالة التأكد من تحميل المكون على متصفح العميل
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(initialOpenPrintModal); // 🖨️ حالة فتح وإغلاق نافذة المعاينة والطباعة الرسمية

  // 👥 استخراج إعدادات الكروبات للمرحلة المحددة والدوام المعتمد بدقة عالية
  const currentStageGroupConfig = useMemo(() => {
    // 🔍 جلب الإعدادات من الخصائص الممررة أو من الكاش المعتمد
    const cfgs = stageGroupConfigs || getStoredData<StageGroupConfig[]>('department_stage_groups', INITIAL_STAGE_GROUP_CONFIGS);
    return cfgs.find((c) => c.stage_number === stageNumber && (c.study_type || 'morning') === selectedStudyType);
  }, [stageGroupConfigs, stageNumber, selectedStudyType]);

  // 📋 قائمة الكروبات المعتمدة للمرحلة (مصفوفة فارغة إذا كانت شعبة موحدة)
  const stageGroupsList = useMemo((): string[] => {
    if (currentStageGroupConfig?.has_groups && Array.isArray(currentStageGroupConfig.groups) && currentStageGroupConfig.groups.length > 0) {
      return currentStageGroupConfig.groups;
    }
    return [];
  }, [currentStageGroupConfig]);

  // 🎯 الكروب الأكاديمي المختار للعرض مع استيعاب الكروب الأولي الممرر
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    if (studentGroup) return studentGroup;
    if (initialGroup && initialGroup !== 'all') return initialGroup;
    if (currentStageGroupConfig?.has_groups && currentStageGroupConfig.groups.length > 0) {
      return currentStageGroupConfig.groups[0] || 'all';
    }
    return 'all';
  });

  // 🔄 مزامنة الكروب النشط عند تغير المرحلة أو نوع الدوام أو كروب الطالب أو الكروب الأولي الممرر
  useEffect(() => {
    if (studentGroup) {
      setSelectedGroup(studentGroup);
    } else if (initialGroup && initialGroup !== 'all' && stageGroupsList.includes(initialGroup)) {
      setSelectedGroup(initialGroup);
    } else if (stageGroupsList.length > 0) {
      if (!selectedGroup || selectedGroup === 'all' || !stageGroupsList.includes(selectedGroup)) {
        setSelectedGroup(stageGroupsList[0] || 'all');
      }
    } else {
      setSelectedGroup('all');
    }
  }, [studentGroup, initialGroup, stageGroupsList, stageNumber, selectedStudyType]);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false); // ⏳ حالة تصدير الجدول الأسبوعي لإكسل الفاخر
  const [activeTimelineTooltipId, setActiveTimelineTooltipId] = useState<string | null>(null); // 🕒 تتبع معرف المحاضرة التي تم النقر على خط التايم لاين الخاص بها لعرض تفاصيل الوقت بدقة

  // 📊 دالة تصدير الجدول الأسبوعي للمرحلة إلى Excel الفاخر
  const handleExportExcel = async () => {
    setIsExportingExcel(true); // ⏳ بدء مؤشر التحميل
    try {
      // 📝 ترتيب وتنسيق محاضرات المرحلة بالكامل زمنياً وبحسب أيام الأسبوع
      const dayOrder: Record<DayOfWeek, number> = {
        saturday: 1,
        sunday: 2,
        monday: 3,
        tuesday: 4,
        wednesday: 5,
        thursday: 6,
        friday: 7,
      };

      const sortedLectures = [...stageLectures].sort((a, b) => {
        const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dDiff !== 0) return dDiff;
        return timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time);
      });

      // 📋 تحويل المحاضرات إلى الشكل الدقيق المطلوب
      const formattedLectures = sortedLectures.map((l, idx) => {
        const dayObj = DAYS_OF_WEEK_LIST.find((d) => d.key === l.day);
        const dayArabic = dayObj?.label_ar || l.day;
        const timeSlot = formatArabicScheduleTime(`${l.start_time} - ${l.end_time}`);
        const room = formatAcademicRoomName(l.room || '', l.type || 'theory');
        const partner = l.teacher_name || 'أستاذ المادة';
        const studyLabel = selectedStudyType === 'evening' ? 'مسائي' : 'صباحي';
        const orderLabel = formatArabicOrdinalLectureName((idx % 6) + 1);

        return {
          day_arabic: dayArabic, // 🗓️ اليوم بالعربية
          lecture_order_label: orderLabel, // 🥇 تسلسل المحاضرة
          time_slot: timeSlot, // ⏰ التوقيت
          course_name: l.course_name, // 📘 اسم المادة
          course_code: l.course_code || '—', // 🔢 كود المادة
          room_name: room, // 🏛️ القاعة أو المختبر
          partner_name: partner, // 👤 أستاذ المادة
          study_type_label: studyLabel, // ☀️ نوع الدراسة
        };
      });

      // 🏷️ صياغة اسم المرحلة والكروب المستقل لعنوان ملف الإكسل
      const isGroupSeparated = stageGroupsList.length > 0 && selectedGroup && selectedGroup !== 'all'; // 🔍 فحص هل الجدول مخصص لكروب
      const groupSuffix = isGroupSeparated ? ` — كروب ${selectedGroup}` : ''; // 🔤 إضافة اسم الكروب لاسم الملف
      const titleName = `المرحلة ${getStageNameInArabic(stageNumber)}${groupSuffix}`; // 📄 العنوان الرسمي المتكامل للملف
      await exportPersonalWeeklyScheduleExcel(
        titleName, // 👤 اسم المرحلة
        'طالب', // 🏷️ صفة المستخدم
        departmentName, // 🏢 القسم الأكاديمي
        formattedLectures // 📋 قائمة المحاضرات
      );
    } catch (err: unknown) {
      console.error('خطأ في تصدير الجدول الأسبوعي إلى إكسل:', err); // ❌ تسجيل الخطأ
    } finally {
      setIsExportingExcel(false); // ⏹️ إنهاء مؤشر التحميل
    }
  };

  // 🚪 دالة إغلاق نافذة الطباعة ومزامنة المكون الأب
  const handleClosePrintModal = () => {
    setIsPrintModalOpen(false); // 🔒 إغلاق النافذة محلياً
    onClosePrintModal?.(); // 📢 إشعار المكون الأب بالإغلاق
  };

  // ⚡ مزامنة حالة فتح الطباعة الفورية عند تغير الخاصية
  useEffect(() => {
    if (initialOpenPrintModal) {
      setIsPrintModalOpen(true); // 🚀 فتح تلقائي عند طلب الطباعة المباشرة
    }
  }, [initialOpenPrintModal]);

  // ⚡ تفعيل حالة الجاهزية للعميل
  useEffect(() => {
    setIsMounted(true); // 🚀 المكون اشتغل بالمتصفح
  }, []);

  // 🖨️ إضافة وحذف كلاس الطباعة ووسم الاتجاه العرضي Landscape على المتصفح لضمان صفحة واحدة عريضة وواضحة 100%
  useEffect(() => {
    // ⚡ نتحقق إن النافذة مفتوحة حتى نطبق نمط الطباعة العرضي فوراً
    if (isPrintModalOpen) {
      document.body.classList.add('print-modal-active'); // 🔒 حجب باقي أجزاء الصفحة ومنع طباعتها
      document.body.classList.add('schedule-print-mode'); // 📄 تفعيل كلاس النمط العرضي للجدول

      // 📄 حقن وسم النمط العرضي مباشرة بهيد المستند لضمان اتجاه Landscape بمتصفح كروم بدون أي تعارض
      let styleTag = document.getElementById('schedule-print-orientation-style') as HTMLStyleElement | null; // 🔍 فحص الوسم إذا كان موجوداً مسبقاً
      if (!styleTag) {
        styleTag = document.createElement('style'); // 🏗️ إنشاء عنصر ستايل جديد
        styleTag.id = 'schedule-print-orientation-style'; // 🏷️ إسناد المعرف الثابت للوسم
        styleTag.innerHTML = `@media print { @page { size: A4 landscape !important; margin: 4mm 5mm !important; } html, body { height: 100% !important; margin: 0 !important; padding: 0 !important; } }`; // 📐 فرض الاتجاه العرضي والهوامش المحكمة وملء كامل الصفحة
      }
    } else {
      document.body.classList.remove('print-modal-active'); // 🔓 رفع الحجب بعد إغلاق نافذة الطباعة
      document.body.classList.remove('schedule-print-mode'); // 🔓 إزالة كلاس النمط العرضي
      const styleTag = document.getElementById('schedule-print-orientation-style'); // 🔍 استرجاع الوسم المحقون
      if (styleTag) {
        styleTag.remove(); // 🧹 إزالة وسم النمط العرضي لتفادي التأثير على باقي أقسام النظام
      }
    }
    return () => {
      document.body.classList.remove('print-modal-active'); // 🧹 تنظيف التأثير عند تفريغ المكون
      document.body.classList.remove('schedule-print-mode'); // 🧹 تنظيف كلاس العرضي
      const styleTag = document.getElementById('schedule-print-orientation-style'); // 🔍 استرجاع الوسم عند تفريغ المكون
      if (styleTag) {
        styleTag.remove(); // 🧹 تنظيف عند إزالة المكون من الذاكرة
      }
    };
  }, [isPrintModalOpen]);

  // 🕒 مؤقت حركي حي لتحديث وقت النظام كل ثانية
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTimeMinutes(hours * 60 + minutes);
      setCurrentRealDay(getTodayDayOfWeek());
      setCurrentClockString(
        now.toLocaleTimeString('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const today = getTodayDayOfWeek();
    setSelectedDay(today);

    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 👥 تحديد الكروب الفعلي النشط لاستخراج الإعدادات والمحاضرات
  const activeGrp = studentGroup || selectedGroup;

  // ⚙️ استخراج إعدادات الدوام والعطل للمرحلة والكورس والكروب المختارين بدقة واستقلال
  const activeConfig = useMemo(() => {
    return getScheduleConfigOrDefault(
      configs, // 📋 الإعدادات
      departmentId, // 🏢 معرف القسم
      stageNumber, // 🎓 المرحلة
      selectedSemester, // 🗓️ الكورس
      selectedStudyType, // ☀️ نوع الدراسة
      activeGrp !== 'all' ? activeGrp : undefined // 👥 الكروب المستقل
    );
  }, [configs, departmentId, stageNumber, selectedSemester, selectedStudyType, activeGrp]);

  // 📆 استخراج تاريخ انطلاق الفصل الدراسي المعتمد للمرحلة والقسم والكروب (مسار بولونيا)
  const effectiveStartDate = useMemo(() => {
    return activeConfig?.start_date || configs.find((c) => c.start_date && c.start_date.trim() !== '')?.start_date || '2026-09-20'; // 📅 تاريخ الانطلاق المعتمد
  }, [activeConfig, configs]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي التلقائي نسبة لتاريخ اليوم الفعلي
  const currentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(effectiveStartDate); // 🧮 حساب الأسبوع الحالي الذكي
  }, [effectiveStartDate]);

  // 📌 قاموس لحفظ الأسبوع المختار لكل كروب مستقلاً تماماً
  const [selectedWeekByGroup, setSelectedWeekByGroup] = useState<Record<string, number>>({});

  // 🗓️ استخراج الأسبوع المعتمد للكروب المعروض حالياً مع الرجوع للأسبوع الأكاديمي الحالي
  const selectedAcademicWeek = useMemo(() => {
    const grpKey = activeGrp || 'all';
    return selectedWeekByGroup[grpKey] || currentAcademicWeek;
  }, [selectedWeekByGroup, activeGrp, currentAcademicWeek]);

  // 🔄 دالة تحديث الأسبوع للكروب المعروض فقط دون التأثير على الكروبات الأخرى
  const setSelectedAcademicWeek: React.Dispatch<React.SetStateAction<number>> = useCallback((action: React.SetStateAction<number>) => {
    const grpKey = activeGrp || 'all';
    setSelectedWeekByGroup((prev) => {
      const currentVal = prev[grpKey] || currentAcademicWeek;
      const nextVal = typeof action === 'function' ? action(currentVal) : action;
      return {
        ...prev,
        [grpKey]: nextVal,
      };
    });
  }, [activeGrp, currentAcademicWeek]);

  // 🔄 مزامنة الأسبوع المختار مع الأسبوع الحالي تلقائياً فور تعديل تاريخ انطلاق الفصل للكروب
  useEffect(() => {
    const grpKey = activeGrp || 'all';
    const curW = getCurrentAcademicWeek(effectiveStartDate);
    setSelectedWeekByGroup((prev) => {
      if (!prev[grpKey]) {
        return { ...prev, [grpKey]: curW };
      }
      return prev;
    });
  }, [effectiveStartDate, activeGrp]);

  // 📚 تصفية المحاضرات الخاصة بالقسم والمرحلة والكورس والفترة والكروب المختار بعزل صارم
  const stageLectures = useMemo(() => {
    return lectures.filter((l) => {
      if (l.department_id !== departmentId) return false; // 🏢 عزل صارم 100%: مطابقة معرف القسم حصراً
      if (l.stage_number !== stageNumber) return false; // 🎓 مطابقة المرحلة الدراسية
      if ((l.semester || 1) !== selectedSemester) return false; // 🗓️ مطابقة الكورس الدراسي
      if ((l.study_type || 'morning') !== selectedStudyType) return false; // ☀️ مطابقة الفترة (صباحي / مسائي)

      // 👥 عزل الكروبات الصارم 100%: لكل كروب جدول ومحاضرات خاصة بيه غير مشتركة
      if (stageGroupsList.length > 0) {
        // 🎯 استخراج الكروب الفعلي المعتمد (سواء من بروفايل الطالب أو اختيار الواجهة)
        const activeGrp = studentGroup || selectedGroup || stageGroupsList[0];
        if (activeGrp && activeGrp !== 'all') {
          return l.target_group === activeGrp; // 🎯 مطابقة محاضرات هذا الكروب حصراً بدون دمج
        }
        return l.target_group === stageGroupsList[0]; // 🥇 في حال عدم التحديد نأخذ الكروب الأول
      }

      // 🏛️ إذا كانت المرحلة بدون كروبات (شعبة موحدة) نعرض كافة محاضراتها بشكل طبيعي
      return true;
    });
  }, [lectures, departmentId, stageNumber, selectedSemester, selectedStudyType, stageGroupsList, selectedGroup, studentGroup]);

  // 🖨️ الأيام المعتمدة لطباعة الجدول الأسبوعي (السبت للخميس، وإذا الجمعة بيها محاضرات تنضاف أوتوماتيك)
  const printScheduleDays = useMemo(() => {
    const hasFriday = stageLectures.some((l) => l.day === 'friday'); // 🔍 فحص هل يوم الجمعة يحتوي على محاضرات
    return hasFriday ? DAYS_OF_WEEK_LIST : DAYS_OF_WEEK_LIST.filter((d) => d.key !== 'friday'); // 🗓️ تجهيز قائمة الأيام
  }, [stageLectures]);

  // 🔢 حساب أكبر عدد محاضرات باليوم الواحد لتحديد عدد أعمدة الجدول المطبوع (أقل شي 4 أعمدة)
  const printMaxSlots = useMemo(() => {
    let max = 4; // 📌 نبدي بـ 4 فترات قياسية
    printScheduleDays.forEach((d) => {
      const count = stageLectures.filter((l) => l.day === d.key).length; // 📊 حساب محاضرات هذا اليوم
      if (count > max) max = count; // 📈 تحديث الحد الأقصى إذا زاد
    });
    return max; // 🎯 إرجاع عدد الأعمدة المطلوب
  }, [printScheduleDays, stageLectures]);

  // 👤 استخراج الاسم الفعلي لرئيس القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedHeadName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله مباشرة
    if (departmentHeadName && departmentHeadName.trim() !== '') {
      return departmentHeadName.trim();
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
      const targetDept = depts.find((d) => d.id === departmentId || d.name === departmentName);
      if (targetDept?.head_name && targetDept.head_name.trim() !== '') {
        return targetDept.head_name.trim(); // 🎯 اسم رئيس القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور رئيس القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const headUser = profiles.find((p) => p.role === 'department_head' && (p.department_id === departmentId || p.department_name === departmentName));
      if (headUser?.full_name && headUser.full_name.trim() !== '') {
        return headUser.full_name.trim(); // 🎯 اسم رئيس القسم من سجل البروفايلات
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'رئاسة القسم العلمي';
  }, [departmentHeadName, departmentId, departmentName]);

  // 👤 استخراج الاسم الفعلي لمقرر القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedRapporteurName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله فوراً
    if (rapporteurName && rapporteurName.trim() !== '') {
      return rapporteurName.trim();
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
      const targetDept = depts.find((d) => d.id === departmentId || d.name === departmentName);
      if (targetDept?.rapporteur_name && targetDept.rapporteur_name.trim() !== '') {
        return targetDept.rapporteur_name.trim(); // 🎯 اسم مقرر القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور مقرر القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rapUser = profiles.find((p) => p.role === 'rapporteur' && (p.department_id === departmentId || p.department_name === departmentName));
      if (rapUser?.full_name && rapUser.full_name.trim() !== '') {
        return rapUser.full_name.trim(); // 🎯 اسم مقرر القسم من سجل البروفايلات
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'مقررية القسم العلمي';
  }, [rapporteurName, departmentId, departmentName]);

  // 🗓️ استخراج وتنسيق العام الدراسي الفعلي المعتمد للنظام تلقائياً
  const resolvedAcademicYear = useMemo(() => {
    if (academicYear && academicYear.trim() !== '') {
      return formatAcademicYearDisplay(academicYear);
    }
    return formatAcademicYearDisplay(getAcademicYear());
  }, [academicYear]);

  // 🔢 حساب أعداد المحاضرات لكل كورس وفترة بعزل صارم حسب القسم
  const sem1Count = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === 1 &&
        (l.study_type || 'morning') === selectedStudyType
    ).length;
  }, [lectures, departmentId, stageNumber, selectedStudyType]);

  const sem2Count = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === 2 &&
        (l.study_type || 'morning') === selectedStudyType
    ).length;
  }, [lectures, departmentId, stageNumber, selectedStudyType]);

  const morningCount = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === selectedSemester &&
        (l.study_type || 'morning') === 'morning'
    ).length;
  }, [lectures, departmentId, stageNumber, selectedSemester]);

  const eveningCount = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId &&
        l.stage_number === stageNumber &&
        (l.semester || 1) === selectedSemester &&
        (l.study_type || 'morning') === 'evening'
    ).length;
  }, [lectures, departmentId, stageNumber, selectedSemester]);

  // 📅 محاضرات اليوم المختار مرتبة تصاعدياً بحسب وقت البدء بدقة متناهية مع دعم النقل الأسبوعي الذكي
  const dayLectures = useMemo(() => {
    return stageLectures
      .filter((l) => {
        // فحص هل تم نقل المحاضرة ليوم آخر في هذا الأسبوع المحدد
        const override = l.weekly_overrides?.[selectedAcademicWeek];
        const effectiveDay = override?.day || l.day;
        return effectiveDay === selectedDay;
      })
      .map((l: ScheduleLecture): ScheduleLecture => {
        const override = l.weekly_overrides?.[selectedAcademicWeek];
        const rawTeacherName = override?.teacher_name || l.teacher_name;

        // 👨‍🏫 استنتاج اسم الأستاذ المكلف تلقائياً إذا كان حقل اسم الأستاذ فارغاً
        let resolvedTeacherName = rawTeacherName;
        if (!resolvedTeacherName && (l.teacher_id || l.course_id)) {
          const storedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
          if (l.teacher_id) {
            const p = storedProfiles.find((prof: UserProfile): boolean => prof.id === l.teacher_id);
            if (p) resolvedTeacherName = p.full_name;
          }
          if (!resolvedTeacherName && l.course_id) {
            const storedCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
            const c = storedCourses.find((crs: Course): boolean => crs.id === l.course_id);
            if (c) {
              resolvedTeacherName = l.type === 'practical' ? (c.practical_teacher_name || c.theory_teacher_name) : (c.theory_teacher_name || c.practical_teacher_name);
            }
          }
          if (!resolvedTeacherName && l.course_id) {
            const storedTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
            const tc = storedTCs.find((item: TeacherCourse): boolean => item.course_id === l.course_id && (l.type === 'practical' ? item.role_in_course !== 'theory' : item.role_in_course !== 'practical'));
            if (tc) {
              const storedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
              const p = storedProfiles.find((prof: UserProfile): boolean => prof.id === tc.teacher_id);
              resolvedTeacherName = p?.full_name || tc.teacher_name;
            }
          }
        }

        if (!override) {
          return resolvedTeacherName !== l.teacher_name ? { ...l, teacher_name: resolvedTeacherName } : l;
        }

        return {
          ...l,
          day: override.day || l.day,
          start_time: override.start_time || l.start_time,
          end_time: override.end_time || l.end_time,
          room: override.room || l.room,
          teacher_name: resolvedTeacherName,
          date: override.date || l.date,
        };
      })
      .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time));
  }, [stageLectures, selectedDay, selectedAcademicWeek]);

  // 🏖️ هل اليوم المختار عطلة رسمية؟
  const isSelectedDayOff = activeConfig.off_days.includes(selectedDay);
  const isTodayOff = activeConfig.off_days.includes(currentRealDay);

  // 🔴 استخراج المحاضرة الجارية حالياً إن وجدت بحساب الأوقات الأكاديمية الدقيقة
  const liveLecture = useMemo(() => {
    if (selectedDay !== currentRealDay || isTodayOff) return null;
    return dayLectures.find((l) => {
      const start = getAcademicSlotOrder(l.start_time); // 🕒 وقت البدء الأكاديمي
      const end = getAcademicSlotOrder(l.end_time); // 🕒 وقت الانتهاء الأكاديمي
      return currentTimeMinutes >= start && currentTimeMinutes < end;
    }) || null;
  }, [dayLectures, selectedDay, currentRealDay, isTodayOff, currentTimeMinutes]);

  // ⏳ استخراج المحاضرة القادمة إن وجدت
  const nextUpcomingLecture = useMemo(() => {
    if (selectedDay !== currentRealDay || isTodayOff) return null;
    return dayLectures.find((l) => getAcademicSlotOrder(l.start_time) > currentTimeMinutes) || null;
  }, [dayLectures, selectedDay, currentRealDay, isTodayOff, currentTimeMinutes]);

  // 📊 إحصائيات ونطاق دوام اليوم المختار (نظري، عملي، الوقت الكلي) ليوم السبت وكافة الأيام
  const dayStats = useMemo(() => {
    if (dayLectures.length === 0) return null; // 🛡️ إذا ماكو محاضرات نرجع null
    const theoryCount = dayLectures.filter((l) => l.type === 'theory' || !l.type).length; // 📘 عدد المحاضرات النظرية
    const practicalCount = dayLectures.filter((l) => l.type === 'practical').length; // 🧪 عدد المحاضرات العملية
    const tutorialCount = dayLectures.filter((l) => l.type === 'tutorial').length; // 📝 عدد الحلقات النقاشية
    const firstStart = dayLectures[0]?.start_time || ''; // ⏰ وقت بداية أول محاضرة (08:30 ص)
    const lastEnd = dayLectures[dayLectures.length - 1]?.end_time || ''; // ⏰ وقت نهاية آخر محاضرة (02:30 م)
    const totalMinutes = dayLectures.reduce((acc, l) => {
      const s = getAcademicSlotOrder(l.start_time); // 🕒 بداية المحاضرة بالدقائق
      const e = getAcademicSlotOrder(l.end_time); // 🕒 نهاية المحاضرة بالدقائق
      return acc + (e >= s ? e - s : 0); // 🧮 جمع الفارق الزمني الحقيقي
    }, 0); // 🧮 مجموع الدقائق
    const hrs = (totalMinutes / 60).toFixed(1).replace('.0', ''); // 🔢 تحويل للساعات
    const totalHoursStr = totalMinutes >= 60 ? `${hrs} ساعات` : `${totalMinutes} دقيقة`; // ✨ صياغة الساعات الأكاديمية
    return {
      theoryCount,
      practicalCount,
      tutorialCount,
      firstStart,
      lastEnd,
      totalHoursStr,
    };
  }, [dayLectures]);

  return (
    // 🧱 حاوية المكون: تصميم صلب وثابت تماماً بدون أي حركة أو انزلاق حتى ما تتحرك العناصر
    <div className={initialOpenPrintModal ? 'contents' : 'bg-white border-2 border-slate-200 rounded-3xl shadow-sm font-sans'}>
      
      {/* 🎯 إذا طلبنا طباعة مباشرة ما نعرض التايم لاين بالخلفية نهائياً ونكتفي بالبورتال */}
      {!initialOpenPrintModal && (
        <>
          {/* 🧭 1. شريط التحكم والترويسة الأكاديمية الانسيابية (تتحرك مع السكرول وتفسح المجال للجدول) */}
          <div className="relative bg-white border-b border-slate-200 rounded-t-3xl">
            {/* الترويسة العليا ومعلومات المرحلة والأزرار */}
            <div className="space-y-4 p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl shadow-2xs">
                <span>الجدول الأكاديمي والمخطط الزمني</span>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-black text-sm rounded-xl">
                المرحلة {getStageNameInArabic(stageNumber)} — قسم {departmentName}
              </span>
              <span className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-1.5 ${
                selectedStudyType === 'evening'
                  ? 'bg-slate-900 text-cyan-200 border-slate-700'
                  : 'bg-sky-50 text-sky-950 border-sky-300'
              }`}>
                {selectedStudyType === 'evening' ? (
                  <Moon className="w-4 h-4 text-cyan-300" />
                ) : (
                  <Sun className="w-4 h-4 text-sky-600" />
                )}
                <span>{selectedStudyType === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
              </span>
              {/* 👥 شارة الكروب المستقل الخاص أو الشعبة الموحدة بتصميم كحلي ملكي راقٍ */}
              {stageGroupsList.length > 0 && selectedGroup && selectedGroup !== 'all' ? (
                <span className="px-3 py-1 bg-[#0F2942] text-cyan-300 border border-[#0F2942] font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span>جدول كروب {selectedGroup}</span> {/* 🏷️ توضيح الكروب المختار حصراً */}
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <span>شعبة موحدة</span> {/* 🏛️ توضيح الشعبة الموحدة إذا ماكو كروبات */}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-[#0F2942]" />
              <span>مواقيت المحاضرات والمسار الزمني الأكاديمي</span>
            </h2>
          </div>

          {/* ⌚ الساعة ومحدد نمط العرض */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl flex items-center gap-2.5 shadow-2xs">
              <Clock className="w-5 h-5 text-[#0F2942] shrink-0" />
              <div className="text-right">
                <div className="text-xs font-black text-slate-700 leading-none">توقيت ميسان الحي</div>
                <div className="text-base font-black text-emerald-800 font-mono leading-tight mt-0.5">
                  {currentClockString || '08:30:00 ص'}
                </div>
              </div>
            </div>

            {/* 🎛️ أزرار نمط العرض (المخطط الزمني / الجدول الأسبوعي) بتصميم موحد وفخم */}
            <div className="flex items-center bg-slate-100 p-1.5 border border-slate-300 rounded-2xl gap-1">
              {/* 🕒 زر المخطط الزمني ثابت ومستقر وسريع الاستجابة بدون أي حركة انتقالية */}
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-base font-black flex items-center gap-2 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>المخطط الزمني</span>
              </button>
              {/* 🗓️ زر الجدول الأسبوعي بلون الهوية الملكي #0F2942 بدون أي ترانزيشن */}
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-xl text-base font-black flex items-center gap-2 cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>الجدول الأسبوعي</span>
              </button>
            </div>

            {/* 📄 📊 أزرار المعاينة والطباعة والتصدير لإكسل بتصميم كحلي ملكي راقٍ وفاخر #0F2942 */}
            <div className="flex items-center gap-2">
              {/* 🖨️ زر طباعة الجدول الأسبوعي بتصميم كحلي ملكي جذاب وثابت */}
              <button
                type="button" // 🔘 نوع الزر للنموذج لمنع أي إرسال عرضي
                onClick={() => setIsPrintModalOpen(true)} // ⚡ فتح نافذة معاينة وطباعة الجدول الأسبوعي
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#0F2942] rounded-2xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95" // 🎨 تصميم كحلي ملكي ناصع وأنيق
                title="معاينة وطباعة الجدول الأسبوعي بصيغة رسمية" // 💬 تلميح زر الطباعة
              >
                <Printer className="w-4 h-4 text-cyan-300" /> {/* 🖨️ أيقونة الطابعة بلون سماوي مبهج يبرز على الكحلي */}
                <span className="hidden sm:inline">طباعة الجدول</span> {/* 📝 نص زر طباعة الجدول */}
              </button>

              {/* 📊 زر تصدير الجدول لإكسل بتصميم كحلي ملكي متناسق وفخم */}
              <button
                type="button" // 🔘 نوع الزر كزر عادي
                onClick={handleExportExcel} // ⚡ استدعاء دالة تصدير ملف الإكسل الملكي
                disabled={isExportingExcel || stageLectures.length === 0} // 🚫 تعطيل الزر إذا التصدير شغال أو ماكو محاضرات
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#0F2942] active:scale-95 disabled:opacity-50" // 🎨 كحلي ملكي فاخر مطابق لأعلى معايير التصميم
                title="تصدير الجدول الأسبوعي المعتمد للمرحلة بصيغة Excel الفاخرة" // 💬 تلميح زر الإكسل
              >
                {isExportingExcel ? ( // ⏳ فحص حالة معالجة وتوليد ملف الإكسل
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> {/* 🔄 سبينر دوار أثناء تجهيز الإكسل */}
                    <span>جاري التصدير...</span> {/* 💬 نص الانتظار */}
                  </>
                ) : ( // ✨ الحالة الاعتيادية لزر تصدير الإكسل
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> {/* 📊 أيقونة الإكسل بلون زمردي فاقع ومتناسق مع الكحلي */}
                    <span>تصدير Excel</span> {/* 📝 نص زر تصدير الإكسل */}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 🔄 أزرار تبديل الكورس والفترة الدراسية مع الشارات والعدادات بتصميم موحد وثابت تماماً */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          {showSemesterSwitcher && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-800">الكورس الدراسي:</span>
              <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded-2xl gap-1">
                {/* 📘 زر الكورس الأول ثابت بدون اهتزاز أو ترانزيشن حركي */}
                <button
                  type="button"
                  onClick={() => setSelectedSemester(1)}
                  className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black cursor-pointer flex items-center gap-2 ${
                    selectedSemester === 1
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-black'
                  }`}
                >
                  <span>الكورس الأول</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                    selectedSemester === 1
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sem1Count}
                  </span>
                </button>
                {/* 📗 زر الكورس الثاني ثابت بدون أي حركة */}
                <button
                  type="button"
                  onClick={() => setSelectedSemester(2)}
                  className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black cursor-pointer flex items-center gap-2 ${
                    selectedSemester === 2
                      ? 'bg-[#0F2942] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-black'
                  }`}
                >
                  <span>الكورس الثاني</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                    selectedSemester === 2
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {sem2Count}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* محدد الفترة الصباحي / المسائي بتصميم ثابت بدون أي انتقال حركي */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الفترة:</span>
            <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded-2xl gap-1">
              {/* ☀️ زر الفترة الصباحية ثابت ومستقر */}
              <button
                type="button"
                onClick={() => setSelectedStudyType('morning')}
                className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black cursor-pointer flex items-center gap-2 ${
                  selectedStudyType === 'morning'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الصباحي</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                  selectedStudyType === 'morning'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {morningCount}
                </span>
              </button>
              {/* 🌙 زر الفترة المسائية ثابت ومستقر */}
              <button
                type="button"
                onClick={() => setSelectedStudyType('evening')}
                className={`px-4 py-1.5 rounded-xl text-sm sm:text-base font-black cursor-pointer flex items-center gap-2 ${
                  selectedStudyType === 'evening'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-black'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>المسائي</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                  selectedStudyType === 'evening'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {eveningCount}
                </span>
              </button>
            </div>
          </div>

          {/* 👥 أزرار تبديل الكروبات للمراحل المقسمة لكروبات (جدول خاص ومستقل لكل كروب) */}
          {stageGroupsList.length > 0 && !studentGroup ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-800">الكروب:</span> {/* 🏷️ عنوان محدد الكروب */}
              <div className="flex items-center bg-slate-100 p-1 border border-slate-300 rounded-2xl gap-1">
                {stageGroupsList.map((grp) => {
                  const isSel = selectedGroup === grp; // 🔍 فحص هل هذا الكروب هو المعروض حالياً
                  const grpCount = lectures.filter(
                    (l) =>
                      l.department_id === departmentId &&
                      l.stage_number === stageNumber &&
                      (l.semester || 1) === selectedSemester &&
                      (l.study_type || 'morning') === selectedStudyType &&
                      l.target_group === grp
                  ).length; // 🔢 احتساب محاضرات هذا الكروب حصراً

                  return (
                    <button
                      key={grp} // 🔑 معرف فريد للكروب
                      type="button" // 🔘 نوع الزر للنموذج
                      onClick={() => setSelectedGroup(grp)} // ⚡ تحديد الكروب المستقل
                      className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black cursor-pointer flex items-center gap-1.5 transition-all ${
                        isSel
                          ? 'bg-[#0F2942] text-white shadow-xs ring-2 ring-blue-400/30' // 🎨 تمييز الكروب المختار بالكحلي الملكي
                          : 'text-slate-700 hover:bg-white hover:text-black' // ⚪ المظهر العادي
                      }`}
                    >
                      <GroupBadgeSvg className={`w-3.5 h-3.5 ${isSel ? 'text-white' : 'text-[#0F2942]'}`} /> {/* 👥 أيقونة الكروب الفيكتورية النقية SVG */}
                      <span>كروب {grp}</span> {/* 🔤 اسم الكروب المستقل */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                          isSel
                            ? 'bg-white/20 text-white border-white/30' // 🔢 لون عداد الكروب النشط
                            : 'bg-slate-200 text-slate-700 border-slate-300' // 🔢 لون عداد الكروب العادي
                        }`}
                      >
                        {grpCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : !studentGroup ? (
            /* 📢 تنبيه واضح عند عدم وجود كروبات للمرحلة في وضع المعاينة العامة */
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-slate-700">
              <span>لا يوجد كروبات لهذه المرحلة (شعبة موحدة)</span>
            </div>
          ) : null}
        </div>
      </div> {/* 🔒 إغلاق قسم أدوات التحكم العلوية space-y-4 */}

        {/* 📅 شريط الأسابيع الـ 15 الأكاديمي الذكي المعتمد لمسار بولونيا */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 border border-blue-200 text-[#0F2942] rounded-xl shadow-2xs">
                <CalendarDays className="w-5 h-5 text-blue-700" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-950">التقويم الأكاديمي للفصل (15 أسبوعاً)</h3>
                  {activeGrp && activeGrp !== 'all' && (
                    <span className="px-2.5 py-0.5 bg-[#0F2942] text-white font-black text-xs rounded-full shadow-2xs flex items-center gap-1">
                      <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300" /> {/* 👥 أيقونة SVG للكروب بالتقويم */}
                      <span>جدول كروب {activeGrp}</span> {/* 🏷️ اسم الكروب بالتقويم */}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-400 font-black text-xs rounded-full shadow-2xs">
                    <span>الأسبوع الحالي: {currentAcademicWeek}</span>
                  </span>
                </div>
                <p className="text-xs font-black text-slate-800 mt-0.5">
                  تاريخ انطلاق الفصل: {formatDateArabicWithDay(effectiveStartDate)}
                </p>
              </div>
            </div>
            
            {/* زر الرجوع السريع للأسبوع الحالي */}
            {selectedAcademicWeek !== currentAcademicWeek && (
              <button
                type="button"
                onClick={() => setSelectedAcademicWeek(currentAcademicWeek)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
              >
                <span>الانتقال للأسبوع الحالي ({currentAcademicWeek})</span>
              </button>
            )}
          </div>

          {/* قائمة الأسابيع الـ 15 الأفقية */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => {
              const isSel = selectedAcademicWeek === wNum;
              const isCurr = currentAcademicWeek === wNum;
              const baseDayKey = getDayOfWeekFromDateString(effectiveStartDate); // 🗓️ اليوم الأكاديمي المعتمد لتاريخ الانطلاق (مثلاً الأحد)
              const weekStartDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, wNum, baseDayKey); // 📅 احتساب تاريخ الأسبوع المتطابق تماماً مع يوم وتاريخ الانطلاق (+7 أيام لكل أسبوع)
              const dParts = weekStartDate.split('-'); // ✂️ تفكيك التاريخ لاستخراج اليوم والشهر
              const dayNum = dParts.length === 3 ? parseInt(dParts[2], 10) : ''; // 🔢 رقم اليوم
              const monthName = dParts.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(dParts[1], 10) - 1] || '') : ''; // 🏷️ اسم الشهر العراقي المعتمد

              return (
                <button
                  key={wNum}
                  type="button"
                  onClick={() => setSelectedAcademicWeek(wNum)}
                  className={`py-2 px-1 rounded-xl text-center font-black transition-all cursor-pointer border-2 flex flex-col items-center justify-between min-h-[72px] sm:min-h-[76px] ${
                    isSel
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-blue-400/30'
                      : isCurr
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex items-center justify-between px-1">
                    <span className={`text-xs font-black ${isSel ? 'text-cyan-300' : isCurr ? 'text-emerald-950' : 'text-slate-950'}`}>
                      أسبوع
                    </span>
                    {isCurr && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300/40 animate-pulse" title="الأسبوع الحالي" />
                    )}
                  </div>
                  <div className="text-base font-black font-mono leading-none my-0.5">
                    {wNum}
                  </div>
                  {/* 📅 تكبير نص التاريخ للشهر واليوم ليكون مقروءاً وبخط داكن عريض */}
                  <div className={`text-[11px] sm:text-xs font-black leading-tight mt-0.5 ${isSel ? 'text-cyan-200' : 'text-slate-950'}`}>
                    {dayNum} {monthName.substring(0, 5)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🗓️ 2. شريط أزرار أيام الأسبوع الـ 7 الموحد والمتناسق تماماً مدمج داخل نفس الترويسة الثابتة */}
        <div className="px-2.5 py-3.5 sm:px-4 sm:py-4 bg-slate-50/90 border-b border-slate-200">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const isSelected = selectedDay === d.key; // 🌟 هل هذا اليوم هو المختار حالياً للعرض
              const isToday = currentRealDay === d.key; // 🕒 هل هذا اليوم هو اليوم الفعلي للتقويم
              const isOffDay = activeConfig.off_days.includes(d.key); // 🏖️ هل هذا اليوم عطلة رسمية
              const dayLecturesCount = stageLectures.filter((l) => l.day === d.key).length; // 📊 عدد محاضرات هذا اليوم
              const dayCalcDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, d.key); // 🗓️ تاريخ اليوم المحسوب
              const p = dayCalcDate.split('-'); // ✂️ تفكيك التاريخ لاستخراج اليوم والشهر
              const formattedDayDate = p.length === 3
                ? `${parseInt(p[2], 10)} ${IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || ''}`
                : '';

              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.key); // 🎯 تعيين اليوم المختار
                    // 🚀 إذا كان المستخدم بتبويب الجدول الأسبوعي، نبقى بالجدول الأسبوعي ونمرر الشاشة بسلاسة لكارد اليوم المختار
                    if (viewMode === 'weekly') {
                      const targetCard = document.getElementById(`weekly-day-${d.key}`);
                      if (targetCard) {
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={`relative min-h-[92px] sm:min-h-[100px] p-2 sm:p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20 scale-[1.02] z-20'
                      : isToday
                      ? 'bg-white border-blue-500 text-slate-950 shadow-xs hover:border-blue-600 hover:bg-blue-50/30 z-10'
                      : isOffDay
                      ? 'bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200/80'
                      : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {/* 🔴 شارة 'اليوم' العائمة بالأعلى باللون الأحمر وتكبير كلمة اليوم */}
                  {isToday && (
                    <span className="absolute -top-3 right-1/2 translate-x-1/2 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-black rounded-full shadow-md flex items-center gap-1.5 z-30 whitespace-nowrap border bg-rose-600 text-white border-rose-400 ring-2 ring-rose-500/20">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                      <span className="font-black text-xs sm:text-sm">اليوم</span>
                    </span>
                  )}

                  {/* 📅 اسم اليوم وتاريخه التقويمي بمحاذاة أفقية مستقيمة وموحدة لكافة الأيام الـ 7 */}
                  <div className="flex flex-col items-center gap-0.5 w-full pt-1">
                    <span className={`text-xs sm:text-base font-black truncate w-full ${
                      isSelected ? 'text-white' : 'text-slate-950'
                    }`}>
                      {d.label_ar}
                    </span>
                    <span className={`text-[11px] sm:text-xs font-black leading-tight font-mono ${
                      isSelected ? 'text-cyan-300' : 'text-slate-950'
                    }`}>
                      {formattedDayDate}
                    </span>
                  </div>

                  {/* 🏷️ شارة الحالة السفلية (عطلة / عدد المحاضرات / فارغ) بتصميم راقٍ ومتناسق */}
                  <div className="w-full flex justify-center pt-1">
                    {isOffDay ? (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black inline-flex items-center gap-1 truncate ${
                          isSelected 
                            ? 'bg-white/20 text-white border border-white/20' 
                            : 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>عطلة</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black truncate border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : dayLecturesCount > 0
                            ? 'bg-blue-50 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-950 border-slate-300'
                        }`}
                      >
                        {dayLecturesCount > 0 ? formatArabicLectureCount(dayLecturesCount) : 'فارغ'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
    </div> {/* 📌 إغلاق الترويسة الأكاديمية الثابتة والمستقرة (Sticky Top Bar) */}

      {/* 🔴 3. بطاقة المحاضرة الجارية الآن ثابتة ومستقرة بدون انزلاق أو اهتزاز */}
      {selectedDay === currentRealDay && liveLecture && (
        <div className="p-5 sm:p-6 bg-rose-50 border-b border-rose-200 text-slate-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-700 rounded-2xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>جارية الآن</span>
                  </span>
                  <span className="text-sm sm:text-base font-black text-rose-950 font-mono">
                    {liveLecture.start_time} - {liveLecture.end_time}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1">
                  {liveLecture.course_name} ({liveLecture.course_code})
                </h3>
                <div className="flex items-center gap-4 text-sm sm:text-base font-black text-slate-800 mt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>{liveLecture.room}</span>
                  </span>
                  {liveLecture.teacher_name && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#0F2942]" />
                      <span>{liveLecture.teacher_name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-60 bg-white border border-rose-300 rounded-2xl p-3 text-right shadow-2xs">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-700 mb-1">
                <span>التقدم الزمني:</span>
                <strong className="text-rose-700 text-sm sm:text-base">
                  {getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%
                </strong>
              </div>
              <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: `${getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⏱️ 4. العرض الرئيسي: نمط المخطط والمسار الزمني الأكاديمي الحركي المتصل */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* هيدر اليوم المختار مع تاريخه ورابط اليوم الفعلي بتصميم فاتح واحترافي */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Calendar className="w-6 h-6 text-[#0F2942]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2 flex-wrap">
                  <span>
                    جدول يوم {formatDateArabicWithDay(calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, selectedDay))} (الأسبوع {selectedAcademicWeek})
                  </span>
                  {selectedDay === currentRealDay && selectedAcademicWeek === currentAcademicWeek && (
                    <span className="px-3.5 py-1 bg-[#0F2942] text-white text-xs sm:text-sm font-black rounded-full shadow-xs">
                      اليوم الفعلي
                    </span>
                  )}
                </h3>
                {/* 📝 نص إجمالي المحاضرات بخط أسود عالي التباين بناءً على رغبة المستخدم */}
                <p className="text-sm sm:text-base font-black text-slate-950 mt-0.5">
                  {isSelectedDayOff ? 'عطلة رسمية معتمدة' : dayLectures.length > 0 ? `إجمالي المحاضرات المقررة: ${formatArabicLectureCount(dayLectures.length)}` : 'لا توجد محاضرات مجدولة لهذا اليوم'}
                </p>
              </div>
            </div>

            {selectedDay === currentRealDay && nextUpcomingLecture && !liveLecture && (
              <div className="px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center gap-2 text-slate-950 text-xs sm:text-sm font-black shadow-2xs">
                <Clock className="w-4 h-4 text-[#0F2942]" />
                <span>
                  المحاضرة القادمة: <strong className="text-slate-950 font-black">{nextUpcomingLecture.course_name}</strong> في الساعة{' '}
                  <span className="font-mono font-black">{formatArabicScheduleTime(nextUpcomingLecture.start_time)}</span>
                </span>
              </div>
            )}
          </div>

          {/* 📊 شريط ملخص وإحصائيات اليوم الأكاديمي مع وسوم مرتبة ونصوص سوداء واضحة */}
          {dayStats && !isSelectedDayOff && (
            <div className="bg-white text-slate-950 p-4 sm:p-5 rounded-2xl shadow-xs border-2 border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <CalendarDays className="w-6 h-6 text-[#0F2942]" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 📝 عنوان الخطة الأكاديمية بنص أسود عالي الوضوح */}
                    <span className="text-sm sm:text-base font-black text-slate-950">
                      ملخص الخطة الأكاديمية ليوم {DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar}:
                    </span>
                    {/* 🏷️ وسم إجمالي المحاضرات بلون كحلي ملكي راقٍ */}
                    <span className="px-3.5 py-1 rounded-xl bg-[#0F2942] text-white text-xs sm:text-sm font-black shadow-2xs">
                      {formatArabicLectureCount(dayLectures.length)}
                    </span>
                  </div>
                  {/* 🏷️ وسوم النظري والعملي المرتبة بنمط فاخر ومتباين */}
                  <div className="text-sm font-black text-slate-950 mt-2 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-blue-950 bg-blue-50 border-2 border-blue-200 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black shadow-2xs">
                      <BookOpen className="w-4 h-4 text-blue-900" />
                      <span>{dayStats.theoryCount} نظري</span>
                    </span>
                    {dayStats.practicalCount > 0 && (
                      <span className="flex items-center gap-1.5 text-emerald-950 bg-emerald-50 border-2 border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black shadow-2xs">
                        <FlaskConical className="w-4 h-4 text-emerald-900" />
                        <span>{dayStats.practicalCount} عملي مختبري</span>
                      </span>
                    )}
                    {dayStats.tutorialCount > 0 && (
                      // 👥 شارة الحلقات النقاشية بتصميم سيان أنيق متناسق بدون أي بنفسجي
                      <span className="flex items-center gap-1.5 text-cyan-950 bg-cyan-50 border-2 border-cyan-200 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black shadow-2xs">
                        <Users className="w-4 h-4 text-cyan-800" />
                        <span>{dayStats.tutorialCount} حلقة نقاشية</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                <div className="px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-right">
                  <div className="text-xs font-black text-slate-950">الفترة الأكاديمية للدوام</div>
                  <div className="text-sm sm:text-base font-black text-slate-950 font-sans mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0F2942] shrink-0" />
                    {/* 🕒 عرض نطاق الدوام باتجاه صريح يمنع تداخل الأرقام */}
                    <span dir="ltr">{formatArabicScheduleTime(`${dayStats.firstStart} - ${dayStats.lastEnd}`)}</span>
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-right">
                  <div className="text-xs font-black text-slate-950">إجمالي الساعات المقررة</div>
                  <div className="text-sm sm:text-base font-black text-slate-950 font-mono mt-0.5">
                    {dayStats.totalHoursStr}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* حالة اليوم الفارغ أو العطلة */}
          {isSelectedDayOff ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-3">
              <div className="w-14 h-14 bg-slate-200 text-slate-900 border-2 border-slate-400 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <Coffee className="w-7 h-7 text-slate-700" />
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-950">اليوم عطلة رسمية وأكاديمية</h4>
              <p className="text-sm sm:text-base text-slate-950 font-black max-w-md mx-auto">
                لا توجد محاضرات دراسية مجدولة لهذا اليوم بحسب الخطة المعتمدة من رئاسة القسم.
              </p>
            </div>
          ) : dayLectures.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base sm:text-lg font-black text-slate-950">لا توجد محاضرات مجدولة لهذا اليوم</h4>
              <p className="text-sm sm:text-base text-slate-950 font-black">
                لم يتم إدراج محاضرات في جدول هذا اليوم لهذا الكورس حتى الآن.
              </p>
            </div>
          ) : (
            /* 🚀 المسار الزمني الرأسي المتصل بنمط Light Mode رصين واحترافي */
            <div className="relative pr-8 sm:pr-12 space-y-6">
              {/* 📍 خط المسار الزمني الرأسي المتصل الهادئ والأنيق */}
              <div className="absolute right-3.5 sm:right-5 top-7 bottom-7 w-1 bg-slate-200 rounded-full z-0" />

              {dayLectures.map((lecture, idx) => {
                const liveStatus = getLectureLiveStatus(
                  lecture,
                  currentTimeMinutes,
                  selectedDay,
                  currentRealDay
                );
                const isPractical = lecture.type === 'practical';
                const isTutorial = lecture.type === 'tutorial';
                const durationStr = formatLectureDurationArabic(lecture.start_time, lecture.end_time);
                const formattedRoom = formatAcademicRoomName(lecture.room, lecture.type);
                const nextLec = idx < dayLectures.length - 1 ? dayLectures[idx + 1] : null;

                // 🕒 حسابات المسار الزمني الدقيقة للمحاضرة وموقعها الزمني باليوم
                const startMin = timeStringToMinutes(lecture.start_time);
                const endMin = timeStringToMinutes(lecture.end_time);
                const duration = Math.max(1, endMin - startMin);

                const isSameDay = selectedDay === currentRealDay;
                const isFinished = isSameDay ? currentTimeMinutes >= endMin : false;
                const isLive = isSameDay ? (currentTimeMinutes >= startMin && currentTimeMinutes < endMin) : false;

                // نسبة التقدم من 0 إلى 100
                const progressPercent = isFinished ? 100 : isLive ? Math.min(100, Math.max(0, Math.round(((currentTimeMinutes - startMin) / duration) * 100))) : 0;

                // الدقائق المنقضية والمتبقية
                const elapsedMinutes = isFinished ? duration : isLive ? Math.max(0, currentTimeMinutes - startMin) : 0;
                const remainingMinutes = isFinished ? 0 : isLive ? Math.max(0, endMin - currentTimeMinutes) : duration;

                return (
                  // 🧱 كارد المحاضرة معزول في طبقة GPU صلبة ومستقرة تماماً بدون أي حركة أو انزلاق
                  <div
                    key={lecture.id}
                    className="relative z-10 transform-gpu [contain:paint_layout]"
                    style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    
                    {/* 🎯 عقدة المسار الزمني المرقمة بتصميم محايد وأنيق متصل بالخط الزمني */}
                    <div
                      className={`absolute -right-8 sm:-right-12 top-5 w-7 h-7 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shadow-xs border-2 ${
                        isLive
                          ? 'bg-[#0F2942] text-white border-white ring-4 ring-[#0F2942]/30 animate-pulse'
                          : isFinished
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : 'bg-white text-slate-950 border-slate-300'
                      }`}
                      style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                      title={`${formatArabicOrdinalLectureName(idx + 1)} (${isFinished ? 'مكتملة' : isLive ? 'جارية' : 'قادمة'})`}
                    >
                      {idx + 1}
                    </div>

                    {/* 🃏 كارد المحاضرة الأكاديمية بنمط Light Mode رصين ونظيف */}
                    <div
                      className={`rounded-2xl border-2 bg-white p-5 sm:p-6 shadow-xs transition-colors ${
                        isLive
                          ? 'border-[#0F2942] ring-2 ring-[#0F2942]/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ transform: 'translateZ(0)' }}
                    >
                      {/* 1️⃣ الشريط العلوي للبطاقة: التسلسل + التوقيت + المدة + شارة النوع + الحالة بحجم موحد ولون كحلي ملكي راقٍ */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 pb-3.5 mb-3 w-full">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {/* 🎖️ وسم تسلسل المحاضرة الأكاديمي الفصيح (المحاضرة الأولى، المحاضرة الثانية...) بحجم موحد ولون كحلي ملكي */}
                          <span className="h-9 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2942] text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs border border-[#0F2942] shrink-0 select-none">
                            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse shrink-0" />
                            <span>{formatArabicOrdinalLectureName(idx + 1)}</span>
                          </span>

                          {/* ⏰ توقيت المحاضرة الصريح بحجم موحد وكحلي ملكي صلب */}
                          <span className="h-9 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F2942] text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs border border-[#0F2942] shrink-0 font-sans select-none">
                            <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
                            <span className="font-sans font-black whitespace-nowrap tracking-wide inline-flex items-center gap-1" dir="rtl">
                              <span>{formatSingleTime(lecture.start_time)}</span>
                              <span className="text-cyan-300 font-sans mx-0.5">—</span>
                              <span>{formatSingleTime(lecture.end_time)}</span>
                            </span>
                          </span>

                          {/* ⏱️ مدة المحاضرة بحجم موحد ولون كحلي ملكي مع أيقونة كحلية */}
                          {durationStr && (
                            <span className="h-9 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-white text-[#0F2942] border-2 border-[#0F2942] flex items-center gap-1.5 shrink-0 shadow-2xs">
                              <Clock className="w-4 h-4 text-[#0F2942] shrink-0" />
                              <span>{durationStr}</span>
                            </span>
                          )}

                          {/* 📅 التاريخ التقويمي ورقم الأسبوع بحجم موحد ولون كحلي ملكي مع أيقونة كحلية */}
                          {(() => {
                            const dynamicLecDate = lecture.weekly_overrides?.[selectedAcademicWeek]?.date
                              || lecture.custom_weekly_dates?.[selectedAcademicWeek]
                              || calculateDateForAnyDayInWeek(
                                effectiveStartDate,
                                1,
                                selectedAcademicWeek,
                                lecture.day
                              );
                            return (
                              <span className="h-9 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#0F2942] border-2 border-[#0F2942] rounded-xl text-xs sm:text-sm font-black shrink-0 shadow-2xs">
                                <Calendar className="w-4 h-4 text-[#0F2942] shrink-0" />
                                <span>الأسبوع {selectedAcademicWeek}</span>
                                <span className="text-[#0F2942]/40">•</span>
                                <span className="font-mono text-[#0F2942] font-black">{dynamicLecDate}</span>
                              </span>
                            );
                          })()}

                          {/* 🏷️ شارة نوع المحاضرة (نظري / عملي) بحجم موحد ولون كحلي ملكي مع أيقونة كحلية */}
                          <span className="h-9 px-3.5 py-1.5 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 border-2 border-[#0F2942] bg-white text-[#0F2942] shrink-0 shadow-2xs">
                            {isPractical ? (
                              <FlaskConical className="w-4 h-4 text-[#0F2942] shrink-0" />
                            ) : isTutorial ? (
                              <Users className="w-4 h-4 text-[#0F2942] shrink-0" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-[#0F2942] shrink-0" />
                            )}
                            <span>{isPractical ? 'محاضرة عملية (مختبر)' : isTutorial ? 'حلقة نقاشية' : 'محاضرة نظرية'}</span>
                          </span>

                          {/* ☀️ / 🌙 شارة الصباحي والمسائي بحجم موحد ولون كحلي ملكي مع أيقونة كحلية */}
                          <span className="h-9 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black border-2 border-[#0F2942] bg-white text-[#0F2942] flex items-center gap-1.5 shrink-0 shadow-2xs">
                            {(lecture.study_type || 'morning') === 'evening' ? (
                              <Moon className="w-4 h-4 text-[#0F2942] shrink-0" />
                            ) : (
                              <Sun className="w-4 h-4 text-[#0F2942] shrink-0" />
                            )}
                            <span>{(lecture.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>
                        </div>

                        {/* شارات الحالة الحية (عرض احترافي يقتصر على الجارية والمكتملة فقط بدون حشو) */}
                        <div className="shrink-0">
                          {isLive && (
                            <span className="h-9 px-3.5 py-1.5 bg-[#0F2942] text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs border border-[#0F2942]">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
                              <span>جارية الآن</span>
                            </span>
                          )}
                          {!isLive && isFinished && (
                            <span className="h-9 px-3.5 py-1.5 bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm rounded-xl border-2 border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                              <span>مكتملة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ⏳ خط TIMELINE كحلي ملكي تفاعلي متحرك مع تفاصيل الوقت عند النقر */}
                      <div 
                        className="mt-3 mb-4 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 transition-all select-none shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs sm:text-sm font-black text-black mb-2.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-black shrink-0" />
                            <span className="text-black font-black">مسار توقيت المحاضرة:</span>
                            <span className="font-sans font-black text-black">
                              {formatSingleTime(lecture.start_time)} — {formatSingleTime(lecture.end_time)}
                            </span>
                          </div>
                          {/* 📊 عرض حالة الوقت الأكاديمية الاحترافية وزر عرض التفاصيل بأيقونات SVG */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-black text-black bg-white px-3 py-1 rounded-lg border-2 border-slate-300">
                              {isFinished ? 'مكتملة 100%' : isLive ? `جارية الآن (${progressPercent}%)` : `المدة المقررة: ${duration} دقيقة`}
                            </span>
                            {/* 🔘 زر عرض التفاصيل الأنيق بأيقونات SVG (يظهر فقط عندما تكون التفاصيل مغلقة لتفادي التكرار) */}
                            {activeTimelineTooltipId !== lecture.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTimelineTooltipId(lecture.id);
                                }}
                                className="h-8 px-3.5 bg-white hover:bg-[#0F2942] text-[#0F2942] hover:text-white border-2 border-[#0F2942] rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer group/btn"
                                title="عرض تفاصيل المسار الزمني للمحاضرة"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#0F2942] group-hover/btn:text-white transition-colors shrink-0" />
                                <span>عرض التفاصيل</span>
                                <ChevronDown className="w-3.5 h-3.5 text-[#0F2942] group-hover/btn:text-white transition-colors shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* مسار الخط الزمني الكحلي الملكي المتحرك */}
                        <div 
                          onClick={() => setActiveTimelineTooltipId(activeTimelineTooltipId === lecture.id ? null : lecture.id)}
                          className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden relative shadow-inner cursor-pointer"
                          title="انقر لعرض أو طي تفاصيل الوقت التفاعلي للمحاضرة"
                        >
                          <div 
                            className={`h-full bg-gradient-to-r from-[#0F2942] via-[#1a3f65] to-[#0F2942] rounded-full transition-all duration-700 relative ${
                              isLive ? 'animate-pulse shadow-sm shadow-[#0F2942]/50' : ''
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          >
                            {/* وميض ولمعان الانميشن أثناء جريان المحاضرة */}
                            {isLive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* 🎯 بطاقة تفاصيل الوقت بنمط Light Mode مرتب وفاخر مع زر إغلاق وحيد صريح */}
                        {activeTimelineTooltipId === lecture.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3.5 p-4 bg-white text-black rounded-2xl shadow-lg border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150 text-right"
                          >
                            {/* ترويسة البطاقة مع زر إغلاق وحيد صريح وأنيق */}
                            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs shrink-0">
                                  <Clock className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div>
                                  {/* تكبير خط نص تفاصيل المسار الزمني للمحاضرة بشكل متوسط */}
                                  <h5 className="text-base sm:text-lg font-black text-black">
                                    تفاصيل المسار الزمني للمحاضرة
                                  </h5>
                                  {/* تكبير خط نص اسم المادة (مقدمة في التخصص والمهارات الأكاديمية) وجعله أسود بالكامل */}
                                  <p className="text-sm sm:text-base font-black text-black mt-0.5">
                                    {lecture.course_name}
                                  </p>
                                </div>
                              </div>
                              {/* 🚪 زر إغلاق وحيد صريح بأيقونة SVG */}
                              <button 
                                type="button" 
                                onClick={() => setActiveTimelineTooltipId(null)}
                                className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-black hover:text-white px-3.5 py-1.5 bg-white hover:bg-black border-2 border-black rounded-xl shadow-2xs cursor-pointer transition-all"
                                title="إغلاق التفاصيل"
                              >
                                <X className="w-4 h-4 shrink-0" />
                                <span>إغلاق</span>
                              </button>
                            </div>

                            {/* شبكة البيانات الثلاثية بنمط Light Mode أنيق ومتناسق بنصوص سوداء 100% وأيقونات SVG */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                                <span className="text-xs sm:text-sm text-black font-black flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-black shrink-0" />
                                  <span>الوقت المنقضي:</span>
                                </span>
                                <span className="text-sm sm:text-base font-black text-black font-sans mt-1.5 block">
                                  {isFinished ? `استغرقت ${duration} دقيقة كاملة` : isLive ? `مضى ${elapsedMinutes} دقيقة من أصل ${duration} د` : 'لم تبدأ بعد (0 دقيقة)'}
                                </span>
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                                <span className="text-xs sm:text-sm text-black font-black flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-black shrink-0" />
                                  <span>الوقت المتبقي:</span>
                                </span>
                                <span className="text-sm sm:text-base font-black text-black font-sans mt-1.5 block">
                                  {isFinished ? 'انتهت المحاضرة' : isLive ? `${remainingMinutes} دقيقة متبقية` : `تبدأ خلال ${remainingMinutes} دقيقة`}
                                </span>
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                                <span className="text-xs sm:text-sm text-black font-black flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                                  <span>نسبة الإنجاز الزمني:</span>
                                </span>
                                <span className="text-sm sm:text-base font-black text-black font-mono mt-1.5 block">
                                  {progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2️⃣ وسط البطاقة: اسم المادة بتكبير متوسط وخط أسود فاحم + كود المادة الأكاديمي */}
                      <div className="space-y-3.5 w-full">
                        <div className="flex items-center justify-between gap-3 w-full min-w-0" dir="rtl">
                          {/* تكبير خط اسم المادة (مقدمة في التخصص والمهارات الأكاديمية) بشكل متوسط ولون أسود ناصع */}
                          <h4 className="text-xl sm:text-2xl font-black text-black leading-tight text-right min-w-0 flex-1">
                            {lecture.course_name}
                          </h4>
                          {lecture.course_code && (
                            <span className="px-3.5 py-1.5 bg-white text-black text-xs sm:text-sm font-mono font-black rounded-xl border-2 border-black shrink-0 shadow-2xs" dir="ltr">
                              {lecture.course_code}
                            </span>
                          )}
                        </div>

                        {/* 3️⃣ تفاصيل القاعة والأستاذ في بطاقات موحدة ومتناغمة بنصوص سوداء واضحة 100% */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 w-full">
                          {/* بطاقة المكان والقاعة */}
                          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 text-black">
                            <div className="p-2.5 rounded-xl bg-white border-2 border-slate-300 text-black shrink-0 shadow-2xs">
                              <MapPin className="w-4 h-4 text-black shrink-0" />
                            </div>
                            <div className="text-right">
                              <div className="text-xs sm:text-sm font-black text-black">المكان / القاعة:</div>
                              <strong className="text-sm sm:text-base font-black text-black block mt-0.5">
                                {formattedRoom}
                              </strong>
                            </div>
                          </div>

                          {/* بطاقة الأستاذ المحاضر */}
                          {lecture.teacher_name && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 text-black">
                              <div className="p-2.5 rounded-xl bg-white border-2 border-slate-300 text-black shrink-0 shadow-2xs">
                                <UserCheck className="w-4 h-4 text-black shrink-0" />
                              </div>
                              <div className="text-right">
                                <div className="text-xs sm:text-sm font-black text-black">الأستاذ المحاضر:</div>
                                <strong className="text-sm sm:text-base font-black text-black block mt-0.5">
                                  {lecture.teacher_name}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ملاحظات وتنبيهات إن وجدت بنص أسود وإطار واضح */}
                        {lecture.notes && (
                          <div className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-black text-xs sm:text-sm font-black flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                            <span>{lecture.notes}</span>
                          </div>
                        )}

                        {/* 4️⃣ جسر الانتقال إلى المحاضرة التالية بنص متوسط وواضح وبادج كحلي ملكي */}
                        {nextLec && (
                          <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-between text-sm sm:text-base font-black text-black flex-wrap gap-2.5">
                            <span className="flex items-center gap-2 text-black">
                              <Clock className="w-4 h-4 text-[#0F2942] shrink-0" />
                              <span>
                                المحاضرة التالية: <strong className="text-black font-black underline decoration-slate-400 underline-offset-4">{nextLec.course_name}</strong>
                              </span>
                            </span>
                            <span className="font-sans text-xs sm:text-sm font-black text-white bg-[#0F2942] px-3.5 py-1.5 rounded-xl shadow-2xs inline-flex items-center gap-1.5" dir="rtl">
                              <Clock className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                              <span>تبدأ في {formatArabicScheduleTime(nextLec.start_time)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📊 5. نمط الجدول الأسبوعي الشامل */}
      {viewMode === 'weekly' && (
        <div className="p-5 sm:p-7 space-y-6">
          {/* 🏷️ ترويسة الجدول الأسبوعي الشامل بنصوص سوداء عريضة وزر طباعة كحلي ملكي */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2.5">
                <CalendarDays className="w-6 h-6 text-[#0F2942]" />
                <span>الجدول الأسبوعي الشامل — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</span>
              </h3>
              {/* 📝 العنوان الفرعي بنص أسود عالي الوضوح بناءً على رغبة المستخدم */}
              <p className="text-sm sm:text-base font-black text-black mt-1">
                استعراض جدول الأسبوع الكامل من السبت إلى الجمعة مع توضيح القاعات وأوقات الدوام
              </p>
            </div>

            {/* 🖨️ زر فتح نافذة معاينة وطباعة الجدول الرسمي بتصميم كحلي ملكي فاخر #0F2942 وثابت */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm cursor-pointer flex items-center gap-2 border-2 border-[#0F2942] shadow-md shrink-0 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>طباعة الجدول الرسمي</span>
            </button>
          </div>

          {/* 🗓️ مسارات الأيام الأفقية (كل يوم يمثل صفاً أفقياً مستقلاً ممتداً بالعرض الكامل لمنع الفراغات العمودية والسكرول نهائياً) */}
          <div className="space-y-4">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const isOff = activeConfig.off_days.includes(d.key); // 🌴 فحص هل اليوم عطلة رسمية بالجدول
              const dayLecs = stageLectures
                .filter((l) => l.day === d.key)
                .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time)); // 🔢 فرز المحاضرات حسب التوقيت الزمني
              const isToday = currentRealDay === d.key; // 📍 فحص هل اليوم هو اليوم الفعلي للتقويم
              const dayCalcDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, d.key); // 🗓️ تاريخ اليوم المحسوب
              const p = dayCalcDate.split('-'); // ✂️ تفكيك التاريخ لاستخراج اليوم والشهر
              const formattedDayDate = p.length === 3
                ? `${parseInt(p[2], 10)} ${IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || ''} ${p[0]}`
                : '';

              const isDaySelected = selectedDay === d.key; // 🌟 فحص هل تم اختيار هذا اليوم من الشريط العلوي

              return (
                <div
                  key={d.key}
                  id={`weekly-day-${d.key}`}
                  className={`w-full rounded-2xl border-2 transition-all p-4 sm:p-5 scroll-mt-6 ${
                    isDaySelected
                      ? 'bg-blue-50/30 border-[#0F2942] ring-4 ring-[#0F2942]/20 shadow-md'
                      : isToday
                      ? 'bg-blue-50/15 border-[#0F2942]/80 ring-2 ring-[#0F2942]/15 shadow-sm'
                      : isOff
                      ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* 📅 ترويسة اليوم الأفقية الممتدة بالعرض الكامل (Header Bar) لمنع تمدد الفراغات */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b-2 border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className={`p-2 rounded-xl border-2 shrink-0 ${
                        isDaySelected || isToday
                          ? 'bg-[#0F2942] text-white border-[#0F2942]'
                          : isOff
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-[#0F2942] border-slate-300'
                      }`}>
                        <Calendar className="w-5 h-5 shrink-0" />
                      </div>
                      
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <h4 className="text-lg sm:text-xl font-black text-black">
                          {d.label_ar}
                        </h4>
                        {formattedDayDate && (
                          <span className="text-xs sm:text-sm font-black text-black font-mono">
                            • {formattedDayDate}
                          </span>
                        )}
                      </div>

                      {isDaySelected && (
                        <span className="px-2.5 py-0.5 bg-[#0F2942] text-white font-black text-xs rounded-full shadow-2xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />
                          <span>اليوم المحدد</span>
                        </span>
                      )}

                      {isToday && (
                        <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black text-xs rounded-full shadow-2xs flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                          <span>اليوم الفعلي</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isOff ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-950 border-2 border-emerald-400 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <Sun className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>عطلة رسمية معتمدة</span>
                        </span>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-xl font-black text-xs sm:text-sm border-2 shadow-2xs flex items-center gap-1.5 ${
                            dayLecs.length > 0
                              ? 'bg-[#0F2942] text-white border-[#0F2942]'
                              : 'bg-slate-100 text-black border-slate-300'
                          }`}
                        >
                          <BookOpen className={`w-3.5 h-3.5 shrink-0 ${dayLecs.length > 0 ? 'text-cyan-300' : 'text-black'}`} />
                          <span>{dayLecs.length > 0 ? formatArabicLectureCount(dayLecs.length) : 'لا توجد محاضرات'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 📚 مسار المحاضرات الأفقي أسفل الترويسة الممتد بعرض الصفحة (3 كاردات بالسطر كحد أقصى) */}
                  <div className="pt-4">
                    {isOff ? (
                      <div className="flex items-center gap-3.5 p-4 rounded-xl bg-emerald-50/60 border-2 border-dashed border-emerald-300 text-black">
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-300 shrink-0 shadow-2xs">
                          <Coffee className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-black text-black">عطلة أسبوعية رسمية معتمدة</div>
                          <div className="text-xs sm:text-sm font-black text-black mt-0.5">لا توجد محاضرات مجدولة لهذا اليوم بحسب التقويم الجامعي الرسمي</div>
                        </div>
                      </div>
                    ) : dayLecs.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 text-black">
                        <Calendar className="w-5 h-5 text-black shrink-0" />
                        <span className="text-sm font-black text-black">لا توجد محاضرات مجدولة لهذا اليوم في هذا الكورس</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                        {dayLecs.map((lec, idx) => {
                          const isPractical = lec.type === 'practical'; // 🧪 فحص نوع المحاضرة العملية المختبرية
                          const isTutorial = lec.type === 'tutorial'; // 👥 فحص نوع الحلقة النقاشية
                          const durationText = formatLectureDurationArabic(lec.start_time, lec.end_time); // ⏱️ حساب مدة المحاضرة بالعربية

                          return (
                            <div
                              key={lec.id}
                              className="p-4 rounded-2xl border-2 border-slate-300 bg-white hover:border-[#0F2942] transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-sm"
                            >
                              {/* ترويسة بطاقة المحاضرة: الترتيب الأكاديمي الفصيح (المحاضرة الأولى...) + التوقيت والنوع والمدة */}
                              <div className="space-y-2.5">
                                {/* 🎖️ شارة تسلسل المحاضرة الأكاديمي الفصيح (المحاضرة الأولى، المحاضرة الثانية...) بتصميم كحلي ملكي راقٍ */}
                                <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                                  <span className="h-7 px-2.5 py-0.5 bg-[#0F2942] text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-2xs select-none">
                                    <span className="w-2 h-2 rounded-full bg-cyan-300 shrink-0" />
                                    <span>{formatArabicOrdinalLectureName(idx + 1)}</span>
                                  </span>

                                  {/* شارة المدة بالدقائق والساعات بنص أسود واضح */}
                                  {durationText && (
                                    <span className="h-7 px-2.5 py-0.5 bg-slate-100 rounded-lg border border-slate-300 text-black text-xs font-black flex items-center">
                                      {durationText}
                                    </span>
                                  )}
                                </div>

                                {/* ⏰ التوقيت في كبسولة واضحة وشارة النوع بإطار أسود داكن */}
                                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                  <span className="h-7 px-2.5 py-0.5 bg-slate-50 text-black border-2 border-slate-300 font-black text-xs rounded-lg flex items-center gap-1.5 shadow-2xs font-sans" dir="rtl">
                                    <Clock className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                    <span>{formatArabicScheduleTime(`${lec.start_time} - ${lec.end_time}`)}</span>
                                  </span>
                                  <span className="h-7 px-2.5 py-0.5 bg-white text-black border-2 border-black font-black text-xs rounded-lg shrink-0 flex items-center gap-1">
                                    {isPractical ? (
                                      <FlaskConical className="w-3 h-3 text-black shrink-0" />
                                    ) : isTutorial ? (
                                      <Users className="w-3 h-3 text-black shrink-0" />
                                    ) : (
                                      <BookOpen className="w-3 h-3 text-black shrink-0" />
                                    )}
                                    <span>{isPractical ? 'عملي مختبري' : isTutorial ? 'حلقة نقاشية' : 'نظري'}</span>
                                  </span>
                                </div>
                              </div>

                              {/* اسم المادة الأكاديمية بخط أسود عريض وكبير */}
                              <h5 className="text-sm sm:text-base font-black text-black leading-snug">
                                {lec.course_name}
                              </h5>

                              {/* تفاصيل المكان والأستاذ بنصوص سوداء 100% وأيقونات SVG واضحة */}
                              <div className="space-y-1.5 pt-2.5 border-t-2 border-slate-100 text-xs font-black">
                                <div className="flex items-center gap-2 text-black">
                                  <MapPin className="w-4 h-4 text-black shrink-0" />
                                  <span className="truncate text-black font-black">{formatAcademicRoomName(lec.room, lec.type)}</span>
                                </div>
                                {lec.teacher_name && (
                                  <div className="flex items-center gap-2 text-black">
                                    <UserCheck className="w-4 h-4 text-black shrink-0" />
                                    <span className="truncate text-black font-black">{lec.teacher_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🏛️ تذييل الجدول الأسبوعي بنصوص سوداء واضحة 100% وأيقونات SVG */}
          <div className="p-4 bg-white border-2 border-slate-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-black flex-wrap gap-2.5 shadow-2xs">
            <span className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-300 shrink-0">
                <Coffee className="w-4 h-4 text-emerald-700" />
              </div>
              <span className="text-black font-black">أيام العطل الأسبوعية المعتمدة:</span>
              <strong className="text-black font-black">
                {activeConfig.off_days
                  .map((k) => DAYS_OF_WEEK_LIST.find((d) => d.key === k)?.label_ar)
                  .join(' و ')}
              </strong>
            </span>
            <span className="text-xs sm:text-sm font-black text-black flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-300 shrink-0">
                <Building2 className="w-4 h-4 text-[#0F2942]" />
              </div>
              <span className="text-black font-black">جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
            </span>
          </div>
        </div>
      )}
        </>
      )}

      {/* 🖨️ نافذة معاينة وطباعة جدول المحاضرات الأسبوعي المعتمد بنظام الصفوف والأعمدة الأكاديمية */}
      {isPrintModalOpen && isMounted && typeof document !== 'undefined' && createPortal(
        (
          <div
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block"
            dir="rtl"
          >
            {/* 📄 تنسيقات الطباعة الإلزامية لفرض العرض الأفقي والتسطير الواضح للجدول وضمان صفحة واحدة بدقة 100% */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4 landscape !important;
                  margin: 4mm 5mm !important;
                }
                html, body {
                  width: 100% !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #printable-modal-portal {
                  display: block !important;
                  position: static !important;
                  width: 100% !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                }
                #printable-modal-portal * {
                  box-sizing: border-box !important;
                }
                .official-schedule-document {
                  display: flex !important;
                  flex-direction: column !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                .official-schedule-document table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                  table-layout: fixed !important;
                  margin: 0 !important;
                }
                .official-schedule-document thead {
                  display: table-header-group !important;
                }
                .official-schedule-document tbody {
                  display: table-row-group !important;
                }
                .official-schedule-document tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .official-schedule-document th, 
                .official-schedule-document td {
                  border: 1.5px solid #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}} />

            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* 🎛️ شريط الأدوات العلوي للمعاينة السريعة (مخفي كلياً بالطباعة) */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2 flex-wrap">
                      <span>معاينة وثيقة جدول المحاضرات الأسبوعي المعتمد</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 text-xs font-black border border-slate-300">
                        المرحلة {getStageNameInArabic(stageNumber)} — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 text-xs font-black border border-blue-200">
                        {selectedStudyType === 'morning' ? 'الدراسة الصباحية' : 'الدراسة المسائية'}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                      تنسيق أكاديمي رسمي مخصص بنظام الصفوف والأعمدة المعتمد وحفظ الوثيقة بصيغة PDF
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570]"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة الآن (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePrintModal}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 📄 منطقة الوثيقة الرسمية المجهزة للطباعة بنظام الصفوف والأعمدة */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 overscroll-contain bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto print:m-0">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 print:border-none print:p-0 max-w-7xl mx-auto shadow-sm print:shadow-none flex flex-col gap-3 print:gap-1.5 official-schedule-document w-full print:w-full print:h-[186mm] print:min-h-[186mm] print:max-h-[186mm] print:flex print:flex-col print:justify-between print:overflow-visible">
                  
                  {/* 🏛️ 1. الترويسة الأكاديمية الرسمية باللون الأسود الخالص (مثبتة بالأعلى) */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-3 print:pb-1 text-black shrink-0">
                    {/* الجهة الأكاديمية - يمين */}
                    <div className="text-right space-y-0.5 text-xs print:text-[9.5px] leading-tight font-black text-black">
                      <div className="text-sm print:text-[10.5px] font-black text-black">جمهورية العراق</div>
                      <div className="text-xs print:text-[9px] font-black text-black">وزارة التعليم العالي والبحث العلمي</div>
                      <div className="text-sm print:text-[10.5px] font-black text-black">جامعة الإمام جعفر الصادق (ع)</div>
                      <div className="text-xs print:text-[8.5px] font-black text-black">فرع ميسان — كلية تكنولوجيا المعلومات</div>
                      <div className="text-xs print:text-[9.5px] font-black text-black">قسم {departmentName}</div>
                    </div>

                    {/* الشعار والعنوان - وسط */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 print:w-11 print:h-11 mb-1 print:mb-0.5">
                        <Image
                          src="/logo.webp"
                          alt="شعار جامعة الإمام جعفر الصادق (ع)"
                          width={80}
                          height={80}
                          className="object-contain mx-auto print:max-h-11"
                          priority
                        />
                      </div>
                      <h1 className="text-base sm:text-lg print:text-[12.5px] font-black text-black tracking-tight leading-tight">
                        جدول المحاضرات الأسبوعي المعتمد{stageGroupsList.length > 0 && selectedGroup && selectedGroup !== 'all' ? ` — كروب ${selectedGroup}` : ''} {/* 🏷️ تضمين اسم الكروب في العنوان الرسمي المطبوع */}
                      </h1>
                      <div className="text-xs print:text-[9.5px] font-black text-black mt-0.5 print:mt-0">
                        العام الدراسي {resolvedAcademicYear} {/* 🗓️ العام الدراسي المعتمد */}
                      </div>
                    </div>

                    {/* بيانات الجدول - يسار */}
                    <div className="text-left space-y-1 print:space-y-0.5 text-xs print:text-[9px] font-black text-black font-sans leading-tight">
                      <div>
                        <span>المرحلة:</span>{' '}
                        <strong className="text-black font-black">
                          المرحلة {getStageNameInArabic(stageNumber)}
                          {stageGroupsList.length > 0 && selectedGroup && selectedGroup !== 'all' ? ` (كروب ${selectedGroup})` : ' (شعبة موحدة)'} {/* 📌 إبراز الكروب أو الشعبة الموحدة */}
                        </strong>
                      </div>
                      <div><span>الكورس:</span> <strong className="text-black font-black">الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</strong></div>
                      <div><span>الدراسة:</span> <strong className="text-black font-black">{selectedStudyType === 'morning' ? 'الصباحية' : 'المسائية'}</strong></div>
                      <div className="flex items-center gap-1.5 print:gap-1">
                        <span>تاريخ الإصدار:</span>
                        <span className="font-mono font-black text-black px-1.5 py-0.5 print:px-1 print:py-0 rounded bg-slate-100 border border-slate-300 inline-block shadow-2xs print:text-[8.5px]" dir="ltr">
                          {formatOfficialIssueDate()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 📊 2. جدول المصفوفة الرسمية (صفوف للأيام وأعمدة للمحاضرات) ممتد لملء الصفحة بالكامل */}
                  <div className="overflow-x-auto print:overflow-visible w-full print:m-0 print:p-0 schedule-table-wrapper flex-1 flex flex-col">
                    <table className="w-full text-right border-collapse border-2 border-black text-black table-fixed print:m-0 h-full flex-1">
                      {/* ترويسة الأعمدة */}
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-black text-black print:bg-slate-100">
                          <th className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black text-xs sm:text-sm print:text-[11px] w-[11%] print:w-[11%] text-black">
                            اليوم
                          </th>
                          {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                            const slotLabels = ['المحاضرة الأولى', 'المحاضرة الثانية', 'المحاضرة الثالثة', 'المحاضرة الرابعة', 'المحاضرة الخامسة', 'المحاضرة السادسة'];
                            return (
                              <th key={slotIdx} className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black text-xs sm:text-sm print:text-[11px] w-[14.83%] print:w-[14.83%] text-black">
                                {slotLabels[slotIdx] || `المحاضرة ${slotIdx + 1}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* صفوف الأيام والمحاضرات */}
                      <tbody>
                        {printScheduleDays.map((d) => {
                          const isOff = activeConfig.off_days.includes(d.key);
                          const dayLecs = stageLectures
                            .filter((l) => l.day === d.key)
                            .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time));

                          if (isOff && dayLecs.length === 0) {
                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[11px] w-[11%] print:w-[11%]">
                                  <div className="day-column-cell flex flex-col items-center justify-center h-full">
                                    <span className="font-black text-sm print:text-[12.5px] text-black leading-tight">{d.label_ar}</span>
                                  </div>
                                </td>
                                <td
                                  colSpan={printMaxSlots}
                                  className="p-3 print:py-1.5 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[10px]"
                                >
                                  عطلة رسمية معتمدة
                                </td>
                              </tr>
                            );
                          }

                          if (dayLecs.length === 0) {
                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[11px] w-[11%] print:w-[11%]">
                                  <div className="day-column-cell flex flex-col items-center justify-center h-full">
                                    <span className="font-black text-sm print:text-[12.5px] text-black leading-tight">{d.label_ar}</span>
                                  </div>
                                </td>
                                <td
                                  colSpan={printMaxSlots}
                                  className="p-3 print:py-1.5 print:px-1 text-center font-black border border-black bg-white text-black text-xs sm:text-sm print:text-[10px]"
                                >
                                  —
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={d.key} className="border-b border-black">
                              <td className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[11px] align-middle w-[11%] print:w-[11%]">
                                <div className="day-column-cell flex flex-col items-center justify-center h-full gap-1 print:gap-1">
                                  <span className="font-black text-sm print:text-[12.5px] text-black leading-tight">{d.label_ar}</span>
                                  {dayLecs.length > 0 && (
                                    <span className="text-[10px] print:text-[8px] font-bold text-slate-700 bg-slate-200/80 print:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 print:border-black/30 leading-none inline-block shadow-2xs">
                                      {formatArabicLectureCount(dayLecs.length)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                                const lec = dayLecs[slotIdx];
                                if (!lec) {
                                  return (
                                    <td key={slotIdx} className="p-2 print:py-1.5 print:px-1 text-center text-black font-black border border-black bg-white align-middle text-xs sm:text-sm print:text-[10px] w-[14.83%] print:w-[14.83%]">
                                      —
                                    </td>
                                  );
                                }
                                const typeLabel = lec.type === 'practical' ? 'عملي' : lec.type === 'tutorial' ? 'حلقة نقاشية' : 'نظري'; // 🏷️ نوع المحاضرة معتمد رسمي
                                return (
                                  <td key={slotIdx} className="p-2 sm:p-2.5 print:p-1 border border-black bg-white align-top text-right text-xs text-black w-[14.83%] print:w-[14.83%]">
                                    <div className="lecture-slot-card flex flex-col justify-between h-full min-h-[125px] print:min-h-0 print:h-full gap-1 print:gap-1">
                                      
                                      {/* 1️⃣ الشريط العلوي: التوقيت الأكاديمي المعتمد + باجة نوع المحاضرة الفاخرة */}
                                      <div className="flex items-center justify-between gap-1 print:gap-0.5 border-b border-black/20 pb-1 print:pb-0.5 font-black shrink-0">
                                        {/* ⏱️ وقت المحاضرة بنظام 12 ساعة مع ص وم بخط واضح وكبير */}
                                        <span className="px-2 py-0.5 print:px-1.5 print:py-0.5 rounded bg-slate-50 border border-black/40 text-[10px] sm:text-[11px] print:text-[9px] font-black text-black font-sans shrink-0 shadow-2xs" dir="rtl">
                                          {formatArabicScheduleTime(`${lec.start_time} - ${lec.end_time}`)}
                                        </span>
                                        {/* 🏷️ نوع المحاضرة (عملي / نظري) بباجة عالية التباين والأناقة */}
                                        <span className={`px-2 py-0.5 print:px-1.5 print:py-0.5 rounded text-[10px] print:text-[8.5px] font-black shrink-0 border ${
                                          lec.type === 'practical' 
                                            ? 'bg-slate-900 text-white border-black shadow-2xs' 
                                            : lec.type === 'tutorial'
                                              ? 'bg-slate-200 text-black border-black'
                                              : 'bg-white text-black border-black'
                                        }`}>
                                          {typeLabel}
                                        </span>
                                      </div>

                                      {/* 2️⃣ جسم الخلية الأكاديمي: اسم المادة + كود المادة الرسمي بخط أسود ناصع وواضح وفسيح */}
                                      <div className="flex-1 flex flex-col justify-center space-y-1 print:space-y-0.5 py-1 print:py-1">
                                        {/* 📚 اسم المادة بخط أكاديمي ملكي عريض وبارز وأسود ناصع وواضح */}
                                        <div className="font-black text-xs sm:text-[13px] print:text-[10.5px] sm:print:text-[11px] text-black leading-snug print:leading-snug tracking-tight line-clamp-2">
                                          {lec.course_name}
                                        </div>

                                        {/* 🏷️ كود المادة بباجة تقنية مرتبة ومتباينة */}
                                        {lec.course_code && (
                                          <div className="flex items-center">
                                            <span className="font-mono font-black text-[10px] print:text-[8.5px] px-1.5 py-0.5 print:px-1.5 print:py-0.5 bg-slate-100 text-black rounded border border-slate-400 inline-block shadow-2xs" dir="ltr">
                                              {lec.course_code}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* 3️⃣ الجزء السفلي: كارت معلومات التدريسي والقاعة بتنسيق هندسي منظم */}
                                      <div className="bg-slate-50 border-t border-black/25 pt-1 pb-0.5 px-1.5 print:py-1 print:px-1 rounded text-[10px] sm:text-[11px] print:text-[9px] font-black text-black print:flex print:items-center print:justify-between print:gap-1 shrink-0">
                                        {lec.teacher_name && (
                                          <div className="flex items-center gap-1 print:gap-0.5 text-black font-black leading-tight truncate">
                                            <span className="text-black font-black shrink-0">الأستاذ:</span>
                                            <span className="text-black font-black truncate print:text-[9px]">{lec.teacher_name}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 print:gap-0.5 text-black font-black leading-tight shrink-0">
                                          {/* 🏛️ تمييز التسمية بين المختبر والقاعة الدراسية بحسب نوع المحاضرة */}
                                          <span className="text-black font-black shrink-0">
                                            {lec.type === 'practical' ? 'المختبر:' : 'القاعة:'}
                                          </span>
                                          {/* 🏷️ عرض الاسم الأكاديمي المنسق للمكان أو المختبر */}
                                          <span className="text-black font-black truncate px-1 py-0.5 print:px-1.5 print:py-0.5 bg-white rounded border border-black/40 inline-block shadow-2xs print:text-[9px]">
                                            {formatAcademicRoomName(lec.room, lec.type)}
                                          </span>
                                        </div>
                                      </div>

                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 📦 3. كتلة التواقيع والتذييل الأكاديمي الموحدة والمثبتة بأسفل الوثيقة */}
                  <div className="shrink-0 space-y-2 print:space-y-1 pt-2 print:pt-1">
                    {/* ✍️ التواقيع الرسمية الثنائية المعتمدة بالأسماء الحقيقية والنصوص السوداء الصريحة المتناظرة */}
                    <div className="grid grid-cols-2 gap-16 print:gap-8 text-center pt-2 print:pt-1 border-t-2 border-black text-black">
                      {/* الطرف الأيمن: مقرر القسم العلمي */}
                      <div className="space-y-1 print:space-y-0.5 flex flex-col items-center justify-between text-black">
                        <div className="text-center">
                          <p className="font-black text-xs sm:text-sm print:text-[10px] text-black">مقرر القسم العلمي</p>
                          <p className="font-black text-xs sm:text-sm print:text-[10px] text-black mt-0.5 print:mt-0">{resolvedRapporteurName}</p>
                        </div>
                        <div className="space-y-0.5 print:space-y-0 w-full text-center text-black font-black">
                          <p className="font-black text-center text-black text-xs print:text-[9px]">التوقيع: .....................</p>
                          <p className="font-black text-center text-[11px] print:text-[8.5px] text-black">
                            التاريخ: <span className="font-mono font-black" dir="ltr">{formatOfficialIssueDate()}</span>
                          </p>
                        </div>
                      </div>

                      {/* الطرف الأيسر: رئيس القسم العلمي */}
                      <div className="space-y-1 print:space-y-0.5 flex flex-col items-center justify-between text-black">
                        <div className="text-center">
                          <p className="font-black text-xs sm:text-sm print:text-[10px] text-black">رئيس قسم {departmentName}</p>
                          <p className="font-black text-xs sm:text-sm print:text-[10px] text-black mt-0.5 print:mt-0">{resolvedHeadName}</p>
                        </div>
                        <div className="space-y-0.5 print:space-y-0 w-full text-center text-black font-black">
                          <p className="font-black text-center text-black text-xs print:text-[9px]">التوقيع: .....................</p>
                          <p className="font-black text-center text-[11px] print:text-[8.5px] text-black">
                            التاريخ: <span className="font-mono font-black" dir="ltr">{formatOfficialIssueDate()}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 📝 التذييل والتوثيق الإلكتروني باللون الأسود الحاد */}
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] print:text-[8.5px] font-black text-black pt-1 print:pt-0.5 border-t-2 border-black">
                      <span>المنصة الأكاديمية المركزية — مسار بولونيا التعليمي — جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
                      <span>وثيقة رسمية صادرة إلكترونياً وغير قابلة للشطب أو التعديل اليدوي</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        ),
        document.body
      )}

    </div>
  );
}
