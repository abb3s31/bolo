'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🗓️ المكون التفاعلي الحركي الموحد للجدول الأسبوعي والـ Timeline المباشر - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والوقت اللحظي
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لعرض نافذة الطباعة مباشرة على جذر الصفحة
import { DayOfWeek, ScheduleLecture, DepartmentScheduleConfig, LectureColor, UserProfile, Department, Course, TeacherCourse } from '@/types'; // 🔗 استيراد الأنواع الرسمية
import { getStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_TEACHER_COURSES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 قراءة بيانات المستخدمين والأقسام والعام الدراسي المعتمد
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
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول والأسابيع الـ 15 والتواريخ الذكية
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 تحويل رقم المرحلة إلى اسمها العربي الفصيح
import {
  Clock,
  Calendar,
  Sparkles,
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
} from 'lucide-react'; // 🎨 أيقونات واجهة المستخدم SVG

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

// 🔤 دالة لغوية لصياغة عدد المحاضرات بقواعد لغة عربية سليمة ومضبوطة نحوياً (بدلاً من 1 محاضرات)
export function formatArabicLectureCount(count: number): string {
  if (count <= 0) return ''; // 🛡️ إذا لم تكن هناك محاضرات نرجع نصاً فارغاً
  if (count === 1) return 'محاضرة واحدة'; // 🎯 مفرد مؤنث سليم
  if (count === 2) return 'محاضرتان'; // ✌️ مثنى مؤنث سليم
  if (count >= 3 && count <= 10) return `${count} محاضرات`; // 📚 جمع قلة صحيح
  return `${count} محاضرة`; // 🔢 تمييز مفرد منصوب لما بعد العشرة
}

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

  // ⚙️ استخراج إعدادات الدوام والعطل للمرحلة والكورس المختارين
  const activeConfig = useMemo(() => {
    return getScheduleConfigOrDefault(configs, departmentId, stageNumber, selectedSemester);
  }, [configs, departmentId, stageNumber, selectedSemester]);

  // 📆 استخراج تاريخ انطلاق الفصل الدراسي المعتمد للمرحلة والقسم (مسار بولونيا)
  const effectiveStartDate = useMemo(() => {
    return activeConfig?.start_date || configs.find((c) => c.start_date && c.start_date.trim() !== '')?.start_date || '2026-09-20'; // 📅 تاريخ الانطلاق المعتمد
  }, [activeConfig, configs]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي التلقائي نسبة لتاريخ اليوم الفعلي
  const currentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(effectiveStartDate); // 🧮 حساب الأسبوع الحالي الذكي
  }, [effectiveStartDate]);

  // 📌 حالة الأسبوع المختار للعرض من 1 إلى 15 (افتراضياً الأسبوع الحالي)
  const [selectedAcademicWeek, setSelectedAcademicWeek] = useState<number>(() => {
    return getCurrentAcademicWeek(effectiveStartDate); // 🎯 البدء من الأسبوع الحالي الذكي
  });

  // 🔄 مزامنة الأسبوع المختار مع الأسبوع الحالي تلقائياً فور تعديل تاريخ انطلاق الفصل
  useEffect(() => {
    setSelectedAcademicWeek(getCurrentAcademicWeek(effectiveStartDate)); // 🎯 إعادة ضبط الأسبوع النشط
  }, [effectiveStartDate]); // ⚡ تفعيل المزامنة كلما تغير تاريخ بداية الفصل المعتمد

  // 📚 تصفية المحاضرات الخاصة بالقسم والمرحلة والكورس والفترة المختارين بعزل صارم
  const stageLectures = useMemo(() => {
    return lectures.filter(
      (l) =>
        l.department_id === departmentId && // 🏢 عزل صارم 100%: مطابقة معرف القسم حصراً
        l.stage_number === stageNumber && // 🎓 مطابقة المرحلة
        (l.semester || 1) === selectedSemester && // 🗓️ مطابقة الكورس
        (l.study_type || 'morning') === selectedStudyType // ☀️ مطابقة الصباحي أو المسائي
    );
  }, [lectures, departmentId, stageNumber, selectedSemester, selectedStudyType]);

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
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>الجدول الأكاديمي والمخطط الزمني</span>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-black text-sm rounded-xl">
                المرحلة {getStageNameInArabic(stageNumber)} — قسم {departmentName}
              </span>
              <span className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-1.5 ${
                selectedStudyType === 'evening'
                  ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                  : 'bg-sky-50 text-sky-950 border-sky-300'
              }`}>
                {selectedStudyType === 'evening' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-sky-600" />
                )}
                <span>{selectedStudyType === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
              </span>
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
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-400 font-black text-xs rounded-full flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
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
                  onClick={() => setSelectedDay(d.key)}
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
                      isSelected ? 'text-cyan-300' : 'text-slate-700'
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
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>عطلة</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black truncate border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : dayLecturesCount > 0
                            ? 'bg-blue-50 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
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
          
          {/* هيدر اليوم المختار مع تاريخه ورابط اليوم الفعلي */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-white rounded-2xl shadow-xs">
                <Calendar className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2 flex-wrap">
                  <span>
                    جدول يوم {formatDateArabicWithDay(calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, selectedDay))} (الأسبوع {selectedAcademicWeek})
                  </span>
                  {selectedDay === currentRealDay && selectedAcademicWeek === currentAcademicWeek && (
                    <span className="px-3.5 py-1 bg-rose-100 text-rose-950 text-xs sm:text-sm font-black rounded-full border-2 border-rose-300 shadow-2xs">
                      اليوم الفعلي
                    </span>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-slate-700 font-black mt-0.5">
                  {isSelectedDayOff ? 'عطلة رسمية معتمدة' : dayLectures.length > 0 ? `إجمالي المحاضرات المقررة: ${formatArabicLectureCount(dayLectures.length)}` : 'لا توجد محاضرات مجدولة لهذا اليوم'}
                </p>
              </div>
            </div>

            {selectedDay === currentRealDay && nextUpcomingLecture && !liveLecture && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-2xl flex items-center gap-2 text-blue-950 text-sm sm:text-base font-black shadow-2xs">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>
                  المحاضرة القادمة: <strong>{nextUpcomingLecture.course_name}</strong> في الساعة{' '}
                  <span className="font-mono">{formatArabicScheduleTime(nextUpcomingLecture.start_time)}</span>
                </span>
              </div>
            )}
          </div>

          {/* 📊 شريط ملخص وإحصائيات اليوم الأكاديمي الفاخر (ليوم السبت وكافة أيام الأسبوع) */}
          {dayStats && !isSelectedDayOff && (
            <div className="bg-gradient-to-r from-[#0F2942] via-[#163a5f] to-[#0F2942] text-white p-4 sm:p-5 rounded-3xl shadow-md border border-[#1e4570] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-cyan-200">ملخص الخطة الأكاديمية ليوم {DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar}:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-black border border-white/20">
                      {formatArabicLectureCount(dayLectures.length)}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-blue-100 bg-white/10 px-2.5 py-0.5 rounded-lg">
                      <BookOpen className="w-4 h-4 text-cyan-300" />
                      <span>{dayStats.theoryCount} نظري</span>
                    </span>
                    {dayStats.practicalCount > 0 && (
                      <span className="flex items-center gap-1.5 text-emerald-200 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        <span>{dayStats.practicalCount} عملي مختبري</span>
                      </span>
                    )}
                    {dayStats.tutorialCount > 0 && (
                      <span className="flex items-center gap-1.5 text-purple-200 bg-purple-950/40 border border-purple-500/30 px-2.5 py-0.5 rounded-lg">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <span>{dayStats.tutorialCount} حلقة نقاشية</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-right">
                  <div className="text-[10px] sm:text-xs font-black text-cyan-200">الفترة الأكاديمية للدوام</div>
                  <div className="text-xs sm:text-sm font-black text-white font-sans mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    {/* 🕒 عرض نطاق الدوام باتجاه صريح يمنع تداخل الأرقام */}
                    <span dir="ltr">{formatArabicScheduleTime(`${dayStats.firstStart} - ${dayStats.lastEnd}`)}</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-right">
                  <div className="text-[10px] sm:text-xs font-black text-cyan-200">إجمالي الساعات المقررة</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-300 font-mono mt-0.5">
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
              <p className="text-sm sm:text-base text-slate-700 font-black max-w-md mx-auto">
                لا توجد محاضرات دراسية مجدولة لهذا اليوم بحسب الخطة المعتمدة من رئاسة القسم.
              </p>
            </div>
          ) : dayLectures.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base sm:text-lg font-black text-slate-950">لا توجد محاضرات مجدولة لهذا اليوم</h4>
              <p className="text-sm sm:text-base text-slate-600 font-black">
                لم يتم إدراج محاضرات في جدول هذا اليوم لهذا الكورس حتى الآن.
              </p>
            </div>
          ) : (
            /* 🚀 المسار الزمني الرأسي المتصل (True Connected Vertical Timeline) */
            <div className="relative pr-8 sm:pr-12 space-y-5">
              {/* 📍 خط المسار الزمني الرأسي المتصل الذي يربط بين المحاضرات المتعاقبة */}
              <div className="absolute right-3.5 sm:right-5 top-7 bottom-7 w-1 bg-gradient-to-b from-blue-500 via-[#0F2942] to-emerald-500 rounded-full z-0 opacity-80" />

              {dayLectures.map((lecture, idx) => {
                const liveStatus = getLectureLiveStatus(
                  lecture,
                  currentTimeMinutes,
                  selectedDay,
                  currentRealDay
                );
                const theme = LECTURE_COLOR_THEMES[lecture.color] || LECTURE_COLOR_THEMES.blue;
                const typeInfo = LECTURE_TYPE_LABELS[lecture.type] || LECTURE_TYPE_LABELS.theory;
                const isPractical = lecture.type === 'practical';
                const isTutorial = lecture.type === 'tutorial';
                const isTheory = !isPractical && !isTutorial;
                const durationStr = formatLectureDurationArabic(lecture.start_time, lecture.end_time);
                const formattedRoom = formatAcademicRoomName(lecture.room, lecture.type);
                const nextLec = idx < dayLectures.length - 1 ? dayLectures[idx + 1] : null;

                return (
                  // 🧱 كارد المحاضرة معزول في طبقة GPU صلبة ومستقرة تماماً بدون أي حركة أو انزلاق
                  <div
                    key={lecture.id}
                    className="relative z-10 transform-gpu [contain:paint_layout]"
                    style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    
                    {/* 🎯 عقدة المسار الزمني المرقمة ثابتة في مكانها وبدون أي نبض أو تكبير */}
                    <div
                      className={`absolute -right-8 sm:-right-12 top-5 w-7 h-7 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shadow-md border-2 ${
                        liveStatus === 'live'
                          ? 'bg-rose-600 text-white border-white ring-4 ring-rose-400'
                          : isPractical
                          ? 'bg-emerald-700 text-white border-emerald-300 shadow-emerald-900/20'
                          : 'bg-[#0F2942] text-cyan-300 border-blue-300 shadow-blue-900/20'
                      }`}
                      style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                      title={`المحاضرة رقم ${idx + 1}`}
                    >
                      {idx + 1}
                    </div>

                    {/* 🃏 كارد المحاضرة الأكاديمية الفاخر ثابت وصلب ومستقر بدون أي اهتزاز على الهوفر */}
                    <div
                      className={`rounded-3xl border-2 p-5 sm:p-6 shadow-sm ${
                        liveStatus === 'live'
                          ? 'bg-white border-rose-500 shadow-xl ring-2 ring-rose-500/20'
                          : isPractical
                          ? 'bg-gradient-to-l from-white via-white to-emerald-50/50 border-emerald-300'
                          : 'bg-gradient-to-l from-white via-white to-blue-50/50 border-blue-200'
                      }`}
                      style={{ transform: 'translateZ(0)' }}
                    >
                      {/* 1️⃣ الشريط العلوي للبطاقة: التوقيت + المدة + شارة النوع + الحالة بتوزيع صلب ومستقر */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 pb-3.5 mb-3.5 w-full">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {/* ⏰ توقيت المحاضرة الصريح بنظام 12 ساعة ومحاذاة اتجاه صريحة تمنع أي تداخل */}
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0F2942] text-white font-black text-xs sm:text-sm rounded-xl shadow-xs border border-[#1e4570] shrink-0 font-sans select-none">
                            <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
                            <span className="font-sans font-black whitespace-nowrap tracking-wide inline-flex items-center gap-1" dir="rtl">
                              <span>{formatSingleTime(lecture.start_time)}</span>
                              <span className="text-cyan-300 font-sans mx-0.5">—</span>
                              <span>{formatSingleTime(lecture.end_time)}</span>
                            </span>
                          </span>

                          {/* ⏱️ مدة المحاضرة بالعربية الفصيحة */}
                          {durationStr && (
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 shrink-0 ${
                              isPractical
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                : 'bg-blue-50 text-blue-950 border-blue-200'
                            }`}>
                              <span>{durationStr}</span>
                            </span>
                          )}

                          {/* 📅 التاريخ التقويمي ورقم الأسبوع المحسوب ديناميكياً لليوم والأسبوع المختار */}
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
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-black shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                <span>الأسبوع {selectedAcademicWeek}</span>
                                <span className="text-indigo-400">•</span>
                                <span className="font-mono">{dynamicLecDate}</span>
                              </span>
                            );
                          })()}

                          {/* 🏷️ شارة المحاضرة البارزة (نظري / عملي) */}
                          <span className={`px-3 py-1 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs border shrink-0 ${
                            isPractical
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : isTutorial
                              ? 'bg-purple-600 text-white border-purple-700'
                              : 'bg-[#0F2942] text-white border-[#0F2942]'
                          }`}>
                            {isPractical ? (
                              <FlaskConical className="w-3.5 h-3.5 text-emerald-200" />
                            ) : isTutorial ? (
                              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                            )}
                            <span>{isPractical ? 'محاضرة عملية (مختبر)' : isTutorial ? 'حلقة نقاشية' : 'محاضرة نظرية'}</span>
                          </span>

                          {/* ☀️ / 🌙 شارة الصباحي والمسائي */}
                          <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1 shadow-2xs shrink-0 ${
                            (lecture.study_type || 'morning') === 'evening'
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                              : 'bg-sky-50 text-sky-950 border-sky-300'
                          }`}>
                            {(lecture.study_type || 'morning') === 'evening' ? (
                              <Moon className="w-3.5 h-3.5 text-indigo-700" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-sky-600" />
                            )}
                            <span>{(lecture.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>
                        </div>

                        {/* شارات الحالة الحية ثابتة بدون وميض */}
                        <div className="shrink-0">
                          {liveStatus === 'live' && (
                            <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-white" />
                              <span>جارية الآن</span>
                            </span>
                          )}
                          {liveStatus === 'upcoming' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-950 font-black text-xs sm:text-sm rounded-xl border border-blue-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-700" />
                              <span>قادمة اليوم</span>
                            </span>
                          )}
                          {liveStatus === 'finished' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-950 font-black text-xs sm:text-sm rounded-xl border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>مكتملة</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2️⃣ وسط البطاقة: اسم المادة + كود المادة الأكاديمي مثبت الاتجاه والموضع */}
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between gap-3 w-full min-w-0" dir="rtl">
                          <h4 className="text-lg sm:text-2xl font-black text-slate-950 leading-tight text-right min-w-0 flex-1">
                            {lecture.course_name}
                          </h4>
                          {lecture.course_code && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-900 text-xs sm:text-sm font-mono font-black rounded-xl border border-slate-300 shadow-2xs shrink-0" dir="ltr">
                              {lecture.course_code}
                            </span>
                          )}
                        </div>

                        {/* 3️⃣ تفاصيل القاعة والأستاذ في بطاقات متباينة وأنيقة وثابتة */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 w-full">
                          {/* بطاقة المكان والقاعة */}
                          <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                            isPractical
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}>
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isPractical ? 'bg-emerald-600 text-white' : 'bg-[#0F2942] text-white'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-slate-600">المكان / القاعة:</div>
                              <strong className="text-sm sm:text-base font-black text-slate-950 block mt-0.5">
                                {formattedRoom}
                              </strong>
                            </div>
                          </div>

                          {/* بطاقة الأستاذ المحاضر */}
                          {lecture.teacher_name && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-300 text-slate-900 shadow-2xs">
                              <div className="p-2 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                <UserCheck className="w-4 h-4 text-blue-700" />
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-black text-slate-600">الأستاذ المحاضر:</div>
                                <strong className="text-sm sm:text-base font-black text-slate-950 block mt-0.5">
                                  {lecture.teacher_name}
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ملاحظات وتنبيهات إن وجدت */}
                        {lecture.notes && (
                          <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 text-xs sm:text-sm font-black flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                            <span>{lecture.notes}</span>
                          </div>
                        )}

                        {/* 4️⃣ جسر الانتقال إلى المحاضرة التالية (Next Lecture Bridge) */}
                        {nextLec && (
                          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-black text-slate-600 flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-[#0F2942]" />
                              <span>المحاضرة التالية: <strong className="text-slate-950">{nextLec.course_name}</strong></span>
                            </span>
                            <span className="font-mono text-[#0F2942] bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300" dir="rtl">
                              تبدأ في {formatArabicScheduleTime(nextLec.start_time)}
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
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-[#0F2942]" />
                <span>الجدول الأسبوعي الشامل — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</span>
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                استعراض جدول الأسبوع الكامل من السبت إلى الجمعة مع توضيح القاعات وأوقات الدوام
              </p>
            </div>

            {/* 🖨️ زر فتح نافذة معاينة وطباعة الجدول الرسمي بتصميم كحلي ملكي فاخر #0F2942 وثابت */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm cursor-pointer flex items-center gap-2 border border-[#1e4570] shadow-md shrink-0"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>طباعة الجدول الرسمي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const isOff = activeConfig.off_days.includes(d.key);
              const dayLecs = stageLectures
                .filter((l) => l.day === d.key)
                .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time));
              const isToday = currentRealDay === d.key;

              return (
                <div
                  key={d.key}
                  className={`rounded-2xl border-2 flex flex-col overflow-hidden ${
                    isToday
                      ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isOff
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isToday
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
                      : isOff
                      ? 'bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-950'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm sm:text-base">{d.label_ar}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md shadow-2xs">
                          اليوم
                        </span>
                      )}
                    </div>
                    {isOff ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 font-black text-[10px] rounded-md flex items-center gap-1">
                        <Sun className="w-3 h-3 text-emerald-600" />
                        <span>عطلة</span>
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded-md font-black text-[10px] border ${
                        isToday 
                          ? 'bg-white/20 text-white border-white/20' 
                          : dayLecs.length > 0 // 📚 إذا كان اليوم بي محاضرات
                          ? 'bg-blue-50 text-blue-950 border-blue-200' // 🎨 لون أزرق ناصع
                          : 'bg-slate-200 text-slate-700 border-slate-300' // ⚪ لون رمادي محايد
                      }`}>
                        {/* 🔤 صياغة لغوية فصيحة ومضبوطة لعدد المحاضرات بدلاً من 1 محاضرات */}
                        {dayLecs.length > 0 ? formatArabicLectureCount(dayLecs.length) : 'فارغ'}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 space-y-2 flex-1 flex flex-col">
                    {isOff ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center p-2 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-900 space-y-1">
                        <Coffee className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black">عطلة رسمية معتمدة</span>
                      </div>
                    ) : dayLecs.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center p-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-1">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-bold">لا توجد محاضرات</span>
                      </div>
                    ) : (
                      dayLecs.map((lec) => {
                        const theme = LECTURE_COLOR_THEMES[lec.color] || LECTURE_COLOR_THEMES.blue;
                        const typeInfo = LECTURE_TYPE_LABELS[lec.type] || LECTURE_TYPE_LABELS.theory;

                        return (
                          <div
                            key={lec.id}
                            className={`p-2.5 rounded-xl border-2 ${theme.bgLight} ${theme.border} space-y-1.5 shadow-2xs`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px] font-black">
                              <span className="text-slate-950 font-mono flex items-center gap-1 font-black" dir="rtl">
                                <Clock className="w-3 h-3 text-slate-700 shrink-0" />
                                <span>{formatArabicScheduleTime(`${lec.start_time} - ${lec.end_time}`)}</span>
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md ${theme.badgeBg} ${theme.badgeText} text-[10px] font-black shrink-0`}>
                                {typeInfo.ar.includes('مختبر') ? 'عملي' : typeInfo.ar.includes('حلقة') ? 'مناقشة' : 'نظري'}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-black text-slate-950 leading-snug line-clamp-2">
                              {lec.course_name}
                            </h5>

                            <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[11px] font-black">
                              <div className="flex items-center gap-1 text-slate-900 truncate">
                                <MapPin className="w-3 h-3 text-[#0F2942] shrink-0" />
                                {/* 🏛️ تنسيق اسم القاعة أو المختبر بذكاء وتجنب الأرقام المجردة */}
                                <span className="truncate">{formatAcademicRoomName(lec.room, lec.type)}</span>
                              </div>
                              {lec.teacher_name && (
                                <div className="flex items-center gap-1 text-slate-700 truncate">
                                  <UserCheck className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span className="truncate">{lec.teacher_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-emerald-600" />
              <span>أيام العطل الأسبوعية المعتمدة:</span>
              <strong className="text-slate-950">
                {activeConfig.off_days
                  .map((k) => DAYS_OF_WEEK_LIST.find((d) => d.key === k)?.label_ar)
                  .join(' و ')}
              </strong>
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0F2942]" />
              <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
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
                        جدول المحاضرات الأسبوعي المعتمد
                      </h1>
                      <div className="text-xs print:text-[9.5px] font-black text-black mt-0.5 print:mt-0">
                        العام الدراسي {resolvedAcademicYear}
                      </div>
                    </div>

                    {/* بيانات الجدول - يسار */}
                    <div className="text-left space-y-1 print:space-y-0.5 text-xs print:text-[9px] font-black text-black font-sans leading-tight">
                      <div><span>المرحلة:</span> <strong className="text-black font-black">المرحلة {getStageNameInArabic(stageNumber)}</strong></div>
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
