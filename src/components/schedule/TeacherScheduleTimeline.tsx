'use client'; // ⚡ ينفذ بالعميل على متصفح الأستاذ

//  المكون التفاعلي الحركي الموحد للجدول الأسبوعي والـ Timeline الخاص بعضو هيئة التدريس
import { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والوقت اللحظي
import Image from 'next/image'; // 🖼️ استيراد مكون الصور من نكست لطباعة شعار الجامعة الرسمي
import { createPortal } from 'react-dom'; // 🚪 بورتال لعرض نافذة الطباعة مباشرة على جذر الصفحة
import { DayOfWeek, ScheduleLecture, DepartmentScheduleConfig, LectureColor, UserProfile, Department, Course, TeacherCourse } from '@/types'; // 🔗 استيراد الأنواع
import { getStoredData, INITIAL_PROFILES, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_TEACHER_COURSES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 دوال وسجلات التخزين المحلي والعام الدراسي المعتمد
import { GroupBadgeSvg, GroupUsersSvg } from '@/components/common/GroupSvgIcons'; // 👥 استيراد أيقونات الكروبات الفيكتورية النقية SVG
import {
  DAYS_OF_WEEK_LIST,
  LECTURE_COLOR_THEMES,
  LECTURE_TYPE_LABELS,
  timeStringToMinutes,
  minutesToTimeString,
  getTodayDayOfWeek,
  getTodayDateString, // 📅 استيراد دالة جلب تاريخ اليوم الفعلي
  getLectureLiveStatus,
  getLectureProgressPercentage,
  calculateDateForAnyDayInWeek,
  getDayOfWeekFromDateString, // 🗓️ استنتاج اليوم الأكاديمي المعتمد من التاريخ
  getCurrentAcademicWeek,
  formatDateArabicWithDay,
  getDepartmentEffectiveStartDate, // 📅 استخراج تاريخ انطلاق الفصل بدقة متعددة المستويات
  IRAQI_ARABIC_MONTHS,
  isLectureActiveInWeek, // 🎯 دالة فحص نشاط المحاضرة في الأسبوع المختار للأستاذ
} from '@/lib/schedule-utils'; // 🕒 دوال حسابات الجدول والأسابيع الـ 15 والتواريخ الذكية
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { formatArabicScheduleTime, getAcademicSlotOrder, formatOfficialIssueDate, formatArabicLectureCount, formatAcademicRoomName } from '@/components/schedule/StudentScheduleTimeline'; // 🕒 أدوات التوقيت الأكاديمي الموحد ص وم والفرز الذكي وتاريخ الإصدار وصياغة أعداد المحاضرات الفصيحة وتنسيق القاعات
import {
  Clock,
  Calendar,
  Users, // 👥 استبدال أيقونة النجوم بأيقونة المجموعات للحلقات النقاشية
  MapPin,
  GraduationCap,
  BookOpen,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Layers,
  Radio,
  Printer,
  Award,
  Sun,
  Moon,
  Building2,
  CalendarDays,
  FlaskConical,
  UserCheck,
  X, // ❌ أيقونة إغلاق نافذة المعاينة والطباعة
  FileSpreadsheet, // 📊 أيقونة الإكسل
} from 'lucide-react'; // 🎨 أيقونات واجهة المستخدم SVG
import { exportPersonalWeeklyScheduleExcel } from '@/lib/excel-utils'; // 📊 دالة تصدير الجدول الدراسي الأسبوعي الفاخر لإكسل

// 🏷️ واجهة خصائص مكون جدول الأستاذ
interface TeacherScheduleTimelineProps {
  teacherId: string;              // 🆔 معرف الأستاذ
  teacherName: string;            // 👤 اسم الأستاذ بالعربية
  departmentName: string;         // 🏢 اسم القسم
  departmentId?: string;          // 🏢 معرف القسم إذا توفر
  departmentHeadName?: string;    // 👑 اسم رئيس القسم الفعلي
  rapporteurName?: string;        // 📋 اسم مقرر القسم الفعلي
  lectures: ScheduleLecture[];    // 📚 كافة محاضرات النظام
  configs: DepartmentScheduleConfig[]; // ⚙️ إعدادات العطل
  academicYear?: string;          // 🗓️ العام الدراسي المعتمد
  initialSemester?: 1 | 2;        // 🗓️ الفصل الدراسي المبدئي
}

export default function TeacherScheduleTimeline({
  teacherId,
  teacherName,
  departmentName,
  departmentId,
  departmentHeadName,
  rapporteurName,
  lectures,
  configs,
  academicYear,
  initialSemester = 1,
}: TeacherScheduleTimelineProps) {
  // 📌 الحالات
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(initialSemester);
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [selectedStudyType, setSelectedStudyType] = useState<'all' | 'morning' | 'evening'>('all');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0);
  const [currentRealDay, setCurrentRealDay] = useState<DayOfWeek>('saturday');
  const [todayDateStr, setTodayDateStr] = useState<string>(() => getTodayDateString()); // 📅 تاريخ اليوم الفعلي المقارن YYYY-MM-DD
  const [currentClockString, setCurrentClockString] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false); // ⚡ حالة التأكد من تحميل المكون على متصفح العميل
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false); // 🖨️ حالة فتح وإغلاق نافذة المعاينة والطباعة الرسمية
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false); // ⏳ حالة تصدير جدول الأستاذ لإكسل الفاخر

  // 📆 استخراج تاريخ انطلاق الفصل الدراسي المعتمد للقسم (مسار بولونيا) مع مراعاة الكورس والعام والمرحلة
  const effectiveStartDate = useMemo(() => {
    return getDepartmentEffectiveStartDate(
      configs, // 📋 كافة إعدادات الجداول
      departmentId, // 🏢 معرف القسم إن توفر
      selectedStage === 'all' ? undefined : selectedStage, // 🎓 المرحلة المحددة
      selectedSemester, // 🗓️ الكورس الدراسي
      academicYear || getAcademicYear() // 🎓 العام الدراسي المعتمد
    );
  }, [configs, departmentId, selectedStage, selectedSemester, academicYear]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي التلقائي نسبة لتاريخ اليوم الفعلي
  const currentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(effectiveStartDate); // 🧮 حساب رقم الأسبوع الحالي
  }, [effectiveStartDate]);

  // 📌 حالة الأسبوع المختار للعرض من 1 إلى 15 (افتراضياً الأسبوع الحالي)
  const [selectedAcademicWeek, setSelectedAcademicWeek] = useState<number>(() => {
    return getCurrentAcademicWeek(effectiveStartDate); // 🎯 البدء من الأسبوع الحالي الذكي
  });

  // 🔄 مزامنة الأسبوع المختار مع الأسبوع الحالي تلقائياً فور تعديل تاريخ انطلاق الفصل
  useEffect(() => {
    setSelectedAcademicWeek(getCurrentAcademicWeek(effectiveStartDate)); // 🎯 إعادة ضبط الأسبوع النشط للأستاذ
  }, [effectiveStartDate]); // ⚡ تفعيل المزامنة كلما تغير تاريخ بداية الفصل المعتمد

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
        document.head.appendChild(styleTag); // 📌 تثبيت الوسم في رأس الصفحة لتطبيقه على الطباعة فوراً
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

  // 🕒 تحديث الساعة الحية كل ثانية
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTimeMinutes(hours * 60 + minutes);
      setCurrentRealDay(getTodayDayOfWeek());
      setTodayDateStr(getTodayDateString()); // 📅 تحديث تاريخ اليوم الفعلي المقارن
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

  // 📚 كافة محاضرات الأستاذ المتاحة (سواء بالمعرف المباشر أو الاسم أو من خلال تكليف المادة الفعلي)
  const myAllLectures = useMemo(() => {
    // 💾 جلب التكليفات والمواد المحلية لضمان التزامن 100%
    const storedTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    const storedCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    
    // 📋 استخراج كافة معرفات المواد المكلف بها الأستاذ
    const assignedCourseIds = new Set<string>();
    storedTCs.forEach((tc: TeacherCourse) => {
      if (tc.teacher_id === teacherId) {
        assignedCourseIds.add(tc.course_id);
      }
    });
    storedCourses.forEach((c: Course) => {
      if (c.theory_teacher_id === teacherId || c.practical_teacher_id === teacherId) {
        assignedCourseIds.add(c.id);
      }
    });

    return lectures.filter((l: ScheduleLecture): boolean => {
      // 1️⃣ فحص المعرف المباشر للأستاذ
      if (l.teacher_id && l.teacher_id === teacherId) return true;
      // 2️⃣ فحص الاسم المباشر للأستاذ
      if (l.teacher_name && teacherName && l.teacher_name.trim() === teacherName.trim()) return true;
      // 3️⃣ فحص التكليف الأكاديمي بالمادة
      if (l.course_id && assignedCourseIds.has(l.course_id)) {
        // إذا كان للأستاذ تكليف خاص بالنظري أو العملي نتأكد من نوع المحاضرة
        const tc = storedTCs.find((item: TeacherCourse): boolean => item.course_id === l.course_id && item.teacher_id === teacherId);
        if (tc) {
          if (tc.role_in_course === 'both') return true;
          if (tc.role_in_course === 'theory' && l.type !== 'practical') return true;
          if (tc.role_in_course === 'practical' && l.type === 'practical') return true;
        }
        const c = storedCourses.find((item: Course): boolean => item.id === l.course_id);
        if (c) {
          if (l.type === 'practical' && c.practical_teacher_id === teacherId) return true;
          if (l.type !== 'practical' && c.theory_teacher_id === teacherId) return true;
        }
      }
      return false;
    });
  }, [lectures, teacherId, teacherName]);

  // 🔢 عدد المحاضرات لكل كورس
  const sem1Count = useMemo(() => {
    return myAllLectures.filter((l) => (l.semester || 1) === 1).length;
  }, [myAllLectures]);

  const sem2Count = useMemo(() => {
    return myAllLectures.filter((l) => (l.semester || 1) === 2).length;
  }, [myAllLectures]);

  // 📚 تصفية المحاضرات الخاصة بالأستاذ بحسب المحددات النشطة
  const myLectures = useMemo(() => {
    return myAllLectures.filter((l) => {
      if ((l.semester || 1) !== selectedSemester) return false;
      if (selectedStage !== 'all' && l.stage_number !== selectedStage) return false;
      if (selectedStudyType !== 'all' && (l.study_type || 'morning') !== selectedStudyType) return false;
      return true;
    });
  }, [myAllLectures, selectedSemester, selectedStage, selectedStudyType]);

  // 🖨️ الأيام المعتمدة لطباعة جدول الأستاذ: حصر الطباعة على أيام الدوام الفعلية فقط التي بها محاضرات للأستاذ
  const printScheduleDays = useMemo(() => {
    // 🎯 استخراج أيام الدوام الفعلية التي تحتوي على محاضرات مسجلة للأستاذ
    const daysWithLectures = DAYS_OF_WEEK_LIST.filter((d) => myLectures.some((l) => l.day === d.key)); // 🗓️ فحص وتصفية الأيام التي بها دوام ومحاضرات فقط
    if (daysWithLectures.length > 0) {
      return daysWithLectures; // 🚀 طباعة أيام الدوام الفعلي فقط للأستاذ بدون عطل أو أيام فارغة
    }
    // 🛡️ في حال كان جدول الأستاذ فارغاً كلياً نعرض أيام الدوام الرسمية القياسية
    return DAYS_OF_WEEK_LIST.filter((d) => d.key !== 'friday' && d.key !== 'thursday'); // 🗓️ قائمة افتراضية في حالة عدم وجود محاضرات
  }, [myLectures]);

  // 🔢 حساب أكبر عدد محاضرات باليوم الواحد للأستاذ لتحديد عدد أعمدة الجدول المطبوع (أقل شي 4 أعمدة)
  const printMaxSlots = useMemo(() => {
    let max = 4; // 📌 نبدي بـ 4 فترات قياسية
    printScheduleDays.forEach((d) => {
      const count = myLectures.filter((l) => l.day === d.key).length; // 📊 حساب محاضرات هذا اليوم
      if (count > max) max = count; // 📈 تحديث الحد الأقصى إذا زاد
    });
    return max; // 🎯 إرجاع عدد الأعمدة المطلوب
  }, [printScheduleDays, myLectures]);

  // 📏 حساب الارتفاع الهندسي لصفوف الجدول لملء صفحة A4 بالعرض ودفع التذييل لأسفل الورقة وتقليل المساحة البيضاء الفارغة
  const rowMinHeightMm = useMemo((): number => {
    const activeDaysCount = printScheduleDays.filter(
      (d) => myLectures.length === 0 || myLectures.some((l) => l.day === d.key)
    ).length; // 🗓️ حساب عدد أيام الدوام الفعلي للأستاذ
    if (activeDaysCount <= 4) return 31.5; // 4 أيام أو أقل: ارتفاع كافي لملء الصفحة ودفع التذييل للأسفل
    if (activeDaysCount === 5) return 25.5; // 5 أيام (الدوام القياسي السبت-الأربعاء): يملأ الصفحة بدقة ويترك 8 مم فقط أسفل التذييل
    return 21.5; // 6 أيام: ارتفاع متناسق
  }, [printScheduleDays, myLectures]);

  // 📊 دالة تصدير جدول الأستاذ الأسبوعي إلى Excel الفاخر
  const handleExportExcel = async () => {
    setIsExportingExcel(true); // ⏳ بدء مؤشر التحميل
    try {
      // 📝 ترتيب وتنسيق محاضرات الأستاذ بالكامل زمنياً وبحسب أيام الأسبوع
      const dayOrder: Record<DayOfWeek, number> = {
        saturday: 1,
        sunday: 2,
        monday: 3,
        tuesday: 4,
        wednesday: 5,
        thursday: 6,
        friday: 7,
      };

      const sortedLectures = [...myLectures].sort((a, b) => {
        const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dDiff !== 0) return dDiff;
        return timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time);
      });

      // 📋 تحويل المحاضرات إلى الشكل الدقيق المطلوب
      const formattedLectures = sortedLectures.map((l, idx) => {
        const dayObj = DAYS_OF_WEEK_LIST.find((d) => d.key === l.day);
        const dayArabic = dayObj?.label_ar || l.day; // 🗓️ اسم اليوم بالعربي
        const timeSlot = formatArabicScheduleTime(`${l.start_time} - ${l.end_time}`); // ⏰ توقيت المحاضرة
        const room = formatAcademicRoomName(l.room || '', l.type || 'theory'); // 🏛️ القاعة أو المختبر
        // 👥 توضيح المرحلة والكروب المستقل بدقة لمنع أي لبس
        const groupSuffix = l.target_group && l.target_group !== 'all' ? ` (كروب ${l.target_group})` : ''; // 🏷️ إضافة اسم الكروب إن وجد
        const stageLabel = `المرحلة ${getStageNameInArabic(l.stage_number || 1)}${groupSuffix}`; // 🎓 المرحلة والكروب
        const studyLabel = (l.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'; // ☀️🌙 نوع الدراسة
        const orderLabel = `محاضرة ${idx + 1}`; // 🥇 تسلسل المحاضرة

        return {
          day_arabic: dayArabic, // 🗓️ اليوم بالعربية
          lecture_order_label: orderLabel, // 🥇 تسلسل المحاضرة
          time_slot: timeSlot, // ⏰ التوقيت
          course_name: l.course_name, // 📘 اسم المادة
          course_code: l.course_code || '—', // 🔢 كود المادة
          room_name: room, // 🏛️ القاعة أو المختبر
          partner_name: stageLabel, // 🎓 المرحلة الدراسية
          study_type_label: studyLabel, // ☀️ نوع الدراسة
        };
      });

      await exportPersonalWeeklyScheduleExcel(
        teacherName, // 👤 اسم الأستاذ
        'أستاذ', // 🏷️ صفة المستخدم
        departmentName, // 🏢 القسم الأكاديمي
        formattedLectures // 📋 قائمة المحاضرات
      );
    } catch (err: unknown) {
      console.error('خطأ في تصدير جدول الأستاذ إلى إكسل:', err); // ❌ تسجيل الخطأ
    } finally {
      setIsExportingExcel(false); // ⏹️ إنهاء مؤشر التحميل
    }
  };

  // 👤 استخراج الاسم الفعلي لرئيس القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedHeadName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله مباشرة
    if (departmentHeadName && departmentHeadName.trim() !== '') {
      return departmentHeadName.trim(); // 🎯 الاسم الممرر من الأب
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 📂 جلب كل الأقسام
      const targetDept = depts.find((d) => (departmentId && d.id === departmentId) || d.name === departmentName); // 🔍 البحث عن القسم
      if (targetDept?.head_name && targetDept.head_name.trim() !== '') {
        return targetDept.head_name.trim(); // 🎯 اسم رئيس القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور رئيس القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 📂 جلب بروفايلات المستخدمين
      const headUser = profiles.find((p) => p.role === 'department_head' && ((departmentId && p.department_id === departmentId) || p.department_name === departmentName)); // 🔍 مطابقة رئيس القسم
      if (headUser?.full_name && headUser.full_name.trim() !== '') {
        return headUser.full_name.trim(); // 🎯 اسم رئيس القسم من البروفايل
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'رئاسة القسم العلمي'; // 🛡️ بديل رسمي موحد
  }, [departmentHeadName, departmentId, departmentName]);

  // 👤 استخراج الاسم الفعلي لمقرر القسم العلمي من البروفايلات أو بيانات القسم
  const resolvedRapporteurName = useMemo(() => {
    // 1️⃣ إذا ممرر بالخصائص نستعمله فوراً
    if (rapporteurName && rapporteurName.trim() !== '') {
      return rapporteurName.trim(); // 🎯 الاسم الممرر من الأب
    }
    // 2️⃣ البحث الفعلي بالتخزين المحلي
    if (typeof window !== 'undefined') {
      // فحص بيانات القسم المسجلة في departments
      const depts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 📂 جلب كل الأقسام
      const targetDept = depts.find((d) => (departmentId && d.id === departmentId) || d.name === departmentName); // 🔍 البحث عن القسم
      if (targetDept?.rapporteur_name && targetDept.rapporteur_name.trim() !== '') {
        return targetDept.rapporteur_name.trim(); // 🎯 اسم مقرر القسم من سجل القسم
      }
      // فحص حسابات المستخدمين في profiles لدور مقرر القسم
      const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 📂 جلب بروفايلات المستخدمين
      const rapUser = profiles.find((p) => p.role === 'rapporteur' && ((departmentId && p.department_id === departmentId) || p.department_name === departmentName)); // 🔍 مطابقة مقرر القسم
      if (rapUser?.full_name && rapUser.full_name.trim() !== '') {
        return rapUser.full_name.trim(); // 🎯 اسم مقرر القسم من البروفايل
      }
    }
    // 3️⃣ نص بديل رسمي إذا لم يعين
    return 'مقررية القسم العلمي'; // 🛡️ بديل رسمي موحد
  }, [rapporteurName, departmentId, departmentName]);

  // 📅 محاضرات اليوم المختار مع دعم النقل الأسبوعي الذكي
  const dayLectures = useMemo(() => {
    return myLectures
      .filter((l) => {
        // 🎯 فحص هل المحاضرة نشطة ومقررة للأستاذ في هذا الأسبوع المحدد (1 إلى 15)
        if (!isLectureActiveInWeek(l, selectedAcademicWeek)) return false; // 🚫 استبعاد إذا غير نشطة بهذا الأسبوع
        const override = l.weekly_overrides?.[selectedAcademicWeek]; // ⚙️ استخراج استثناء الأسبوع
        const effectiveDay = override?.day || l.day; // 🗓️ اليوم المعتمد الفعلي
        return effectiveDay === selectedDay; // 🎯 مطابقة اليوم المختار
      })
      .map((l) => {
        const override = l.weekly_overrides?.[selectedAcademicWeek];
        if (!override) return l;
        return {
          ...l,
          day: override.day || l.day,
          start_time: override.start_time || l.start_time,
          end_time: override.end_time || l.end_time,
          room: override.room || l.room,
          teacher_name: override.teacher_name || l.teacher_name,
          date: override.date || l.date,
        };
      })
      .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));
  }, [myLectures, selectedDay, selectedAcademicWeek]);

  // 📅 التاريخ التقويمي المحسوب لليوم المختار في الأسبوع المختار
  const selectedDayCalculatedDate = useMemo(() => {
    return calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, selectedDay); // 🧮 حساب التاريخ الفعلي لليوم المختار
  }, [effectiveStartDate, selectedAcademicWeek, selectedDay]);

  // 🎯 هل اليوم والأسبوع المعروضان يطابقان تاريخ اليوم الفعلي في التقويم؟
  const isSelectedDayActuallyToday = selectedDayCalculatedDate === todayDateStr; // 🌟 مطابقة تامة مع تاريخ اليوم الحقيقي

  // 🔴 المحاضرة الجارية حالياً للأستاذ حصراً في اليوم الفعلي الحقيقي
  const liveLecture = useMemo(() => {
    if (!isSelectedDayActuallyToday) return null;
    return dayLectures.find((l) => {
      const start = timeStringToMinutes(l.start_time);
      const end = timeStringToMinutes(l.end_time);
      return currentTimeMinutes >= start && currentTimeMinutes < end;
    }) || null;
  }, [dayLectures, isSelectedDayActuallyToday, currentTimeMinutes]);

  // ⏳ المحاضرة القادمة للأستاذ اليوم حصراً في اليوم الفعلي الحقيقي
  const nextUpcomingLecture = useMemo(() => {
    if (!isSelectedDayActuallyToday) return null;
    return dayLectures.find((l) => timeStringToMinutes(l.start_time) > currentTimeMinutes) || null;
  }, [dayLectures, isSelectedDayActuallyToday, currentTimeMinutes]);

  // 📊 حساب إجمالي ساعات التدريس الأسبوعية
  const totalWeeklyHours = useMemo(() => {
    let totalMinutes = 0;
    myLectures.forEach((l) => {
      const start = timeStringToMinutes(l.start_time);
      const end = timeStringToMinutes(l.end_time);
      if (end > start) totalMinutes += (end - start);
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [myLectures]);

  // 🗓️ استخراج وتنسيق العام الدراسي الفعلي المعتمد للنظام تلقائياً
  const resolvedAcademicYear = useMemo(() => {
    if (academicYear && academicYear.trim() !== '') {
      return formatAcademicYearDisplay(academicYear);
    }
    return formatAcademicYearDisplay(getAcademicYear());
  }, [academicYear]);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden font-sans animate-in fade-in duration-200">
      
      {/* 🧭 1. شريط التحكم والهيدر الرئيسي */}
      <div className="p-5 sm:p-6 bg-white border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl shadow-2xs">
                <span>الجدول التدريسي والمخطط الزمني</span>
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-black text-sm rounded-xl">
                الأستاذ: {teacherName} ({departmentName})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-[#0F2942]" />
              <span>جدول المحاضرات الأسبوعي للأستاذ</span>
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

            <div className="flex items-center bg-slate-100 p-1.5 border border-slate-300 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>المخطط الزمني</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-xl text-base font-black transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'weekly'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-700 hover:text-black'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>الجدول الأسبوعي</span>
              </button>
            </div>

            {/* 📄 📊 أزرار المعاينة والطباعة والتصدير لإكسل بتصميم كحلي ملكي راقٍ وفاخر #0F2942 */}
            <div className="flex items-center gap-2">
              {/* 🖨️ زر طباعة الجدول الأسبوعي للأستاذ بتصميم كحلي ملكي جذاب وثابت */}
              <button
                type="button" // 🔘 نوع الزر للنموذج لمنع أي إرسال عرضي
                onClick={() => setIsPrintModalOpen(true)} // ⚡ فتح نافذة معاينة وطباعة جدول الأستاذ
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#0F2942] rounded-2xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95" // 🎨 تصميم كحلي ملكي ناصع وأنيق
                title="معاينة وطباعة جدول الأستاذ الأسبوعي بصيغة رسمية" // 💬 تلميح زر الطباعة
              >
                <Printer className="w-4 h-4 text-cyan-300" /> {/* 🖨️ أيقونة الطابعة بلون سماوي مبهج يبرز على الكحلي */}
                <span className="hidden sm:inline">طباعة الجدول</span> {/* 📝 نص زر طباعة الجدول */}
              </button>

              {/* 📊 زر تصدير جدول الأستاذ لإكسل بتصميم كحلي ملكي متناسق وفخم */}
              <button
                type="button" // 🔘 نوع الزر كزر عادي
                onClick={handleExportExcel} // ⚡ استدعاء دالة تصدير ملف الإكسل للأستاذ
                disabled={isExportingExcel || myLectures.length === 0} // 🚫 تعطيل الزر إذا التصدير شغال أو ماكو محاضرات
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#0F2942] active:scale-95 disabled:opacity-50" // 🎨 كحلي ملكي فاخر مطابق لأعلى معايير التصميم
                title="تصدير جدول الأستاذ الأسبوعي بصيغة Excel الفاخرة" // 💬 تلميح زر الإكسل
              >
                {isExportingExcel ? ( // ⏳ فحص حالة توليد ملف الإكسل
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

        {/* 🔄 أزرار تبديل الكورس وتصفية المرحلة والفترة مع الشارات والعدادات المحدثة */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الكورس الدراسي:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSemester(1)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer border flex items-center gap-2 ${
                  selectedSemester === 1
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>الكورس الأول</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedSemester === 1
                    ? 'bg-white/20 text-white border-white/30'
                    : sem1Count > 0
                    ? 'bg-blue-100 text-blue-950 border-blue-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {sem1Count}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester(2)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer border flex items-center gap-2 ${
                  selectedSemester === 2
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>الكورس الثاني</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                  selectedSemester === 2
                    ? 'bg-white/20 text-white border-white/30'
                    : sem2Count > 0
                    ? 'bg-blue-100 text-blue-950 border-blue-300'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {sem2Count}
                </span>
              </button>
            </div>
          </div>

          {/* محدد الفترة الصباحي / المسائي للأستاذ */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-800">الفترة:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStudyType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border ${
                  selectedStudyType === 'all'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudyType('morning')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedStudyType === 'morning'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>الصباحي</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudyType('evening')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedStudyType === 'evening'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs ring-2 ring-blue-400/30' // 🎨 تلوين الكحلي الملكي
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100' // ⚪ المظهر العادي
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-cyan-300" /> {/* 🌙 أيقونة المسائي سيان متناسقة */}
                <span>المسائي</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-400 font-black text-xs rounded-full shadow-2xs">
                  <span>الأسبوع الحالي: {currentAcademicWeek}</span>
                </span>
              </div>
              <p className="text-xs font-black text-slate-800 mt-0.5">
                تاريخ انطلاق الدوام ({selectedSemester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}) ({formatAcademicYearDisplay(getAcademicYear())}) (الأسبوع 1): {formatDateArabicWithDay(effectiveStartDate)}
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

      {/* 🗓️ 2. شريط أزرار أيام الأسبوع الـ 7 الموحد والمتناسق تماماً */}
      <div className="px-2.5 py-3.5 sm:px-4 sm:py-4 bg-slate-50/90 border-b border-slate-200">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {DAYS_OF_WEEK_LIST.map((d) => {
            const isSelected = selectedDay === d.key; // 🌟 هل هذا اليوم هو المختار حالياً للعرض
            const dayCalcDate = calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, d.key); // 🗓️ تاريخ اليوم المحسوب
            const isToday = dayCalcDate === todayDateStr; // 🕒 هل هذا اليوم هو اليوم الفعلي الحقيقي للتقويم
            const dayLecturesCount = myLectures.filter((l) => { // 📊 حساب عدد محاضرات الأستاذ لهذا اليوم بدقة للأسبوع المختار
              if (!isLectureActiveInWeek(l, selectedAcademicWeek)) return false; // 🚫 استبعاد إذا غير نشطة بهذا الأسبوع
              const override = l.weekly_overrides?.[selectedAcademicWeek]; // ⚙️ استخراج استثناء الأسبوع
              const effectiveDay = override?.day || l.day; // 🗓️ اليوم المعتمد الفعلي
              return effectiveDay === d.key; // 🎯 مطابقة هذا اليوم
            }).length; // 🔢 استخراج العدد الإجمالي الصحيح للأستاذ
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

                {/* 🏷️ شارة الحالة السفلية (عدد المحاضرات / فارغ) بتصميم راقٍ ومتناسق */}
                <div className="w-full flex justify-center pt-1">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black truncate border ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/30'
                        : dayLecturesCount > 0
                        ? 'bg-blue-50 text-blue-950 border-blue-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {/* 🔤 صياغة فصيحة ومضبوطة لعدد المحاضرات بدلاً من 1 محاضرات */}
                    {dayLecturesCount > 0 ? formatArabicLectureCount(dayLecturesCount) : 'فارغ'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔴 3. بطاقة المحاضرة الجارية الآن */}
      {isSelectedDayActuallyToday && liveLecture && (
        <div className="p-5 sm:p-6 bg-rose-50 border-b border-rose-200 text-slate-900 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-700 rounded-2xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 bg-rose-600 text-white font-black text-xs sm:text-sm rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>أنت تحاضر الآن</span>
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
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                    <span>المرحلة الدراسية: {liveLecture.stage_number}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-60 bg-white border border-rose-300 rounded-2xl p-3 text-right shadow-2xs">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-700 mb-1">
                <span>زمن المحاضرة:</span>
                <strong className="text-rose-700 text-sm sm:text-base">
                  {getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%
                </strong>
              </div>
              <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                  style={{ width: `${getLectureProgressPercentage(liveLecture, currentTimeMinutes)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⏱️ 4. نمط المخطط الزمني */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-7 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-white rounded-2xl shadow-xs">
                <Calendar className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2 flex-wrap">
                  <span>
                    جدول محاضراتك ليوم {formatDateArabicWithDay(calculateDateForAnyDayInWeek(effectiveStartDate, 1, selectedAcademicWeek, selectedDay))} (الأسبوع {selectedAcademicWeek})
                  </span>
                  {isSelectedDayActuallyToday && (
                    <span className="px-3.5 py-1 bg-rose-100 text-rose-950 text-xs sm:text-sm font-black rounded-full border-2 border-rose-300 shadow-2xs">
                      اليوم الفعلي
                    </span>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-slate-700 font-black mt-0.5">
                  {/* 🔤 صياغة فصيحة ومضبوطة لعدد المحاضرات بدلاً من 1 محاضرات */}
                  إجمالي المحاضرات المكلف بها: {formatArabicLectureCount(dayLectures.length)}
                </p>
              </div>
            </div>

            {isSelectedDayActuallyToday && nextUpcomingLecture && !liveLecture && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-2xl flex items-center gap-2 text-blue-950 text-sm sm:text-base font-black shadow-2xs">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>
                  محاضرتك القادمة: <strong>{nextUpcomingLecture.course_name}</strong> (المرحلة {getStageNameInArabic(nextUpcomingLecture.stage_number)}) في{' '}
                  <span className="font-mono">{nextUpcomingLecture.start_time}</span>
                </span>
              </div>
            )}
          </div>

          {dayLectures.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
              <Coffee className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base sm:text-lg font-black text-slate-950">لا توجد محاضرات مكلف بها لهذا اليوم</h4>
              <p className="text-sm sm:text-base text-slate-600 font-black">
                جدولك فارغ اليوم، يمكنك استغلال الوقت في الأنشطة البحثية والإشراف الأكاديمي.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayLectures.map((lecture, idx) => {
                // 📅 التاريخ التقويمي الدقيق للمحاضرة في هذا الأسبوع المختار
                const dynamicLecDate = lecture.weekly_overrides?.[selectedAcademicWeek]?.date
                  || lecture.custom_weekly_dates?.[selectedAcademicWeek]
                  || calculateDateForAnyDayInWeek(
                    effectiveStartDate,
                    1,
                    selectedAcademicWeek,
                    lecture.day
                  );

                const liveStatus = getLectureLiveStatus(
                  lecture,
                  currentTimeMinutes,
                  selectedDay,
                  currentRealDay,
                  dynamicLecDate,
                  todayDateStr
                );
                const theme = LECTURE_COLOR_THEMES[lecture.color] || LECTURE_COLOR_THEMES.blue;
                const typeInfo = LECTURE_TYPE_LABELS[lecture.type] || LECTURE_TYPE_LABELS.theory;

                return (
                  <div
                    key={lecture.id}
                    className={`rounded-2xl border-2 p-4 sm:p-5 shadow-2xs transform-gpu [contain:paint_layout] ${
                      liveStatus === 'live'
                        ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                        : `${theme.bgLight} ${theme.border}`
                    }`}
                    style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 mb-3 w-full">
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-[#0F2942] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-2xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="px-3 py-1 bg-slate-950 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 font-sans shadow-2xs shrink-0" dir="rtl">
                          <Clock className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          <span className="font-sans font-black whitespace-nowrap">{formatArabicScheduleTime(`${lecture.start_time} - ${lecture.end_time}`)}</span>
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-950 border border-blue-200 font-black text-xs sm:text-sm rounded-xl shrink-0">
                          المرحلة {getStageNameInArabic(lecture.stage_number)} {/* 🎓 اسم المرحلة الدراسية */}
                        </span>
                        {/* 👥 شارة الكروب المستقل الخاص بهذه المحاضرة مدعومة بأيقونة SVG وكحلي ملكي */}
                        {lecture.target_group && lecture.target_group !== 'all' && (
                          <span className="px-3 py-1 bg-[#0F2942] text-white border border-blue-400/30 font-black text-xs sm:text-sm rounded-xl shrink-0 flex items-center gap-1.5 shadow-2xs">
                            <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300" /> {/* 👥 أيقونة الكروب الفيكتورية النقية SVG */}
                            <span>كروب {lecture.target_group}</span> {/* 🏷️ اسم الكروب المستهدف بالمحاضرة */}
                          </span>
                        )}
                        {/* 📅 التاريخ التقويمي ورقم الأسبوع المحسوب ديناميكياً لليوم والأسبوع المختار بدون أي بنفسجي */}
                        <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>الأسبوع {selectedAcademicWeek}</span>
                          <span className="text-blue-400">•</span>
                          <span className="font-mono">{dynamicLecDate}</span>
                        </span>
                        <span className={`px-3 py-1 ${theme.badgeBg} ${theme.badgeText} font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shrink-0`}>
                          {lecture.type === 'practical' ? (
                            <FlaskConical className="w-3.5 h-3.5" />
                          ) : lecture.type === 'tutorial' ? (
                            <Users className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5" />
                          )}
                          <span>{typeInfo.ar}</span>
                        </span>

                        <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1.5 shrink-0 ${
                          (lecture.study_type || 'morning') === 'evening'
                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                            : 'bg-sky-50 text-sky-950 border-sky-300'
                        }`}>
                          {(lecture.study_type || 'morning') === 'evening' ? (
                            <Moon className="w-3.5 h-3.5 text-slate-700" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-sky-600" />
                          )}
                          <span>{(lecture.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                        </span>
                      </div>

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

                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between gap-2.5 w-full min-w-0" dir="rtl">
                        <h4 className="text-base sm:text-xl font-black text-slate-950 text-right min-w-0 flex-1">
                          {lecture.course_name}
                        </h4>
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-900 text-xs font-mono font-black rounded-lg shrink-0" dir="ltr">
                          {lecture.course_code}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm sm:text-base font-black text-slate-800">
                        <div className="flex items-center gap-2 p-2.5 bg-white/90 rounded-xl border border-slate-300">
                          <MapPin className="w-4 h-4 text-[#0F2942]" />
                          <span>المكان المحدد:</span>
                          {/* 🏛️ عرض مسمى القاعة أو المختبر بأسلوب أكاديمي منسق */}
                          <strong className="text-slate-950">{formatAcademicRoomName(lecture.room, lecture.type)}</strong>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 bg-white/90 rounded-xl border border-slate-300">
                          <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                          <span>المرحلة المستهدفة:</span>
                          <strong className="text-slate-950">المرحلة {getStageNameInArabic(lecture.stage_number)}</strong>
                        </div>
                      </div>

                      {lecture.notes && (
                        <div className="mt-2 p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-950 text-xs sm:text-sm font-black flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                          <span>{lecture.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📊 5. نمط الجدول التدريسي الأسبوعي الشامل */}
      {viewMode === 'weekly' && (
        <div className="p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-[#0F2942]" />
                <span>الجدول التدريسي الأسبوعي الشامل — الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</span>
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                توزيع كافة محاضرات الأستاذ على مدار أيام الأسبوع مع توضيح القاعات والمراحل الدراسية
              </p>
            </div>

            {/* 🖨️ زر فتح نافذة معاينة وطباعة الجدول التدريسي بتصميم كحلي ملكي فاخر #0F2942 */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer flex items-center gap-2 border border-[#1e4570] shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>طباعة الجدول التدريسي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
            {DAYS_OF_WEEK_LIST.map((d) => {
              const dayLecs = myLectures
                .filter((l) => l.day === d.key)
                .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time));
              const isToday = currentRealDay === d.key;

              return (
                <div
                  key={d.key}
                  className={`rounded-2xl border-2 transition-all flex flex-col overflow-hidden ${
                    isToday
                      ? 'bg-blue-50/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 border-b flex items-center justify-between ${
                    isToday
                      ? 'bg-[#0F2942] text-white border-[#0F2942]'
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
                    <span className={`px-1.5 py-0.5 rounded-md font-black text-[10px] border ${
                      isToday 
                        ? 'bg-white/20 text-white border-white/20' 
                        : dayLecs.length > 0
                        ? 'bg-blue-50 text-blue-950 border-blue-200'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {/* 🔤 صياغة فصيحة ومضبوطة لعدد المحاضرات في الجدول الأسبوعي */}
                      {dayLecs.length > 0 ? formatArabicLectureCount(dayLecs.length) : 'فارغ'}
                    </span>
                  </div>

                  <div className="p-2.5 space-y-2 flex-1 flex flex-col">
                    {dayLecs.length === 0 ? (
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
                            className={`p-2.5 rounded-xl border-2 ${theme.bgLight} ${theme.border} space-y-1.5 shadow-2xs transition-all hover:scale-[1.01]`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px] font-black">
                              <span className="text-slate-950 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                <span>{lec.start_time} - {lec.end_time}</span>
                              </span>
                              {/* 🏷️ إظهار المرحلة والكروب المستهدف للمحاضرة في العرض الأسبوعي بأيقونة SVG */}
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-950 border border-blue-200 text-[10px] font-black shrink-0 inline-flex items-center gap-1">
                                <span>مرحلة {lec.stage_number}</span>
                                {lec.target_group && lec.target_group !== 'all' && (
                                  <span className="inline-flex items-center gap-0.5 text-[#0F2942] font-black">
                                    <GroupBadgeSvg className="w-2.5 h-2.5 text-[#0F2942]" /> {/* 👥 أيقونة الكروب الفيكتورية النقية SVG */}
                                    <span>({lec.target_group})</span>
                                  </span>
                                )}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-black text-slate-950 leading-snug line-clamp-2">
                              {lec.course_name}
                            </h5>

                            <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[11px] font-black">
                              <div className="flex items-center justify-between gap-1 text-slate-900">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-[#0F2942] shrink-0" />
                                  {/* 🏛️ عرض مسمى القاعة أو المختبر بأسلوب أكاديمي منسق */}
                                  <span className="truncate">{formatAcademicRoomName(lec.room, lec.type)}</span>
                                </span>
                                <span className="text-slate-600 font-bold shrink-0">{typeInfo.ar}</span>
                              </div>
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

          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-blue-950 font-bold flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-700" />
              <span>إجمالي النصاب الأسبوعي المقرر:</span>
              <strong className="text-blue-950 font-black">{totalWeeklyHours} ساعة معتمدة</strong>
            </span>
            <span className="text-xs sm:text-sm font-black text-blue-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان | الشؤون العلمية</span>
            </span>
          </div>
        </div>
      )}

      {/* 🖨️ نافذة معاينة وطباعة جدول النصاب والعبء التدريسي الأسبوعي بنظام الصفوف والأعمدة الأكاديمية */}
      {isPrintModalOpen && isMounted && typeof document !== 'undefined' && createPortal(
        (
          <div
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block"
            dir="rtl"
          >
            {/* 📄 تنسيقات الطباعة الإلزامية لفرض العرض الأفقي والتسطير الواضح للجدول وضمان صفحة واحدة بدقة 100% بدون أي تداخل */}
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
                  display: flex !important; /* 📦 تخطيط فليكس عمودي منظم */
                  flex-direction: column !important; /* ⬇️ تدفق رأسي من الترويسة للجدول للتواقيع */
                  justify-content: space-between !important; /* ⚖️ توزيع متباعد يدفع الترويسة للأعلى والتواقيع والتذييل لأسفل الورقة مباشرة لتقليل المساحة البيضاء */
                  gap: 1.5mm !important; /* 🤏 فجوة هوائية متوازنة لضبط مقاس الصفحة */
                  width: 100% !important; /* 📐 استغلال كامل عرض الورقة */
                  max-width: 100% !important; /* 🔒 قفل العرض */
                  height: auto !important; /* 📏 ارتفاع تلقائي */
                  min-height: 184mm !important; /* 🛡️ ملء ارتفاع الصفحة A4 ودفع التذييل للحافة السفلية للورقة */
                  max-height: none !important; /* 🚫 منع التمدد لصفحة ثانية */
                  margin: 0 !important; /* 🚫 تصفير الهوامش */
                  padding: 0 !important; /* 🔲 تصفير الحشوات */
                  background: #ffffff !important; /* ⚪ خلفية بيضاء نقية */
                  page-break-inside: avoid !important; /* 🚫 منع انقسام الوثيقة */
                  break-inside: avoid !important; /* 🛡️ حماية الوثيقة من التجزئة */
                  page-break-after: avoid !important; /* 🚫 منع إنشاء صفحة ثانية فارغة */
                  break-after: avoid !important; /* 🔒 قفل الصفحة الواحدة */
                }
                .official-schedule-document .schedule-table-wrapper {
                  display: flex !important; /* 📦 نظام فليكس لملء المساحة الوسطية */
                  flex-direction: column !important;
                  flex: 1 1 auto !important; /* 📐 تمدد الجدول لملء الحيز الشاغر ودفع التذييل لأسفل الورقة */
                  width: 100% !important; /* 📐 ملء العرض */
                  min-height: 0 !important; /* 🛡️ حماية الفليكس */
                  margin: 0.5mm 0 !important; /* 🤏 فاصل طفيف */
                }
                .official-schedule-document table {
                  border-collapse: collapse !important; /* 🧱 دمج الحدود المتصلة */
                  width: 100% !important; /* 📐 ملء العرض بالكامل */
                  height: 100% !important; /* 📏 ملء الارتفاع المتاح لملء الورقة */
                  table-layout: fixed !important; /* 📐 تثبيت عرض الأعمدة */
                  margin: 0 !important; /* 🚫 تصفير الهوامش */
                  page-break-inside: avoid !important; /* 🚫 منع تكسر الجدول */
                  break-inside: avoid !important; /* 🛡️ حماية الجدول بالكامل */
                }
                .official-schedule-document thead {
                  display: table-header-group !important; /* 📌 تثبيت ترويسة الأعمدة */
                }
                .official-schedule-document thead tr {
                  height: 7.5mm !important; /* 📏 ارتفاع محسوب لترويسة الأعمدة */
                }
                .official-schedule-document tbody {
                  display: table-row-group !important; /* 📌 تدفق صفوف المحاضرات */
                }
                .official-schedule-document tr {
                  page-break-inside: avoid !important; /* 🚫 منع انقسام الصف الواحد */
                  break-inside: avoid !important; /* 🛡️ حماية الصفوف */
                  height: auto !important; /* ⚖️ ارتفاع متناسق */
                }
                .official-schedule-document th, 
                .official-schedule-document td {
                  border: 1.5px solid #000000 !important; /* 🧱 حدود سوداء واضحة للطباعة */
                  -webkit-print-color-adjust: exact !important; /* 🎨 تثبيت جودة الألوان */
                  print-color-adjust: exact !important; /* 🎨 دقة الرسوميات */
                  vertical-align: top !important; /* 📐 محاذاة علوية متناسقة */
                  padding: 0.6mm 1mm !important; /* 🔲 حشوة مضبوطة ومريحة للقراءة */
                }
                .official-schedule-document td .lecture-slot-card {
                  min-height: ${rowMinHeightMm}mm !important; /* 📐 ارتفاع هندسي محكم يضمن بقاء كامل الوثيقة بصفحة واحدة ويقلل المساحة البيضاء الزائدة */
                  height: 100% !important; /* 📏 ملء الخلية بالكامل */
                  display: flex !important; /* 📦 ترتيب عمودي للعناصر */
                  flex-direction: column !important; /* ⬇️ توقيت ومادة وتدريسي */
                  justify-content: space-between !important; /* ⚖️ توزيع مريح للعناصر يملأ الخلية */
                  gap: 0.6mm !important; /* 🤏 مسافة بينية لمنع التلاصق */
                  padding: 0.5mm 0.6mm !important; /* 🔲 حشوة داخلية لحماية الكارت */
                }
                .official-schedule-document td .day-column-cell {
                  min-height: ${rowMinHeightMm}mm !important; /* 📐 مطابقة ارتفاع خانة اليوم لكروت المحاضرات لملء الصفحة */
                  height: 100% !important; /* 📏 استغلال كامل الارتفاع */
                  display: flex !important; /* 📦 نظام فليكس منظم */
                  flex-direction: column !important; /* ⬇️ ترتيب اسم اليوم والعدد */
                  align-items: center !important; /* 🎯 توسيط أفقي */
                  justify-content: center !important; /* 🎯 توسيط رأسي في قلب الخلية */
                  gap: 0.6mm !important; /* 🤏 فجوة هوائية تحمي النصوص */
                  padding: 0.5mm 0 !important; /* 🔲 حشوة عمودية متوازنة */
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
                      <span>معاينة وثيقة جدول النصاب التدريسي الأسبوعي المعتمد</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 text-xs font-black border border-slate-300">
                        {teacherName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 text-xs font-black border border-blue-200">
                        الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                      تنسيق أكاديمي رسمي مخصص بنظام الصفوف والأعمدة وحفظ الوثيقة بصيغة PDF
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة الآن (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 📄 منطقة الوثيقة الرسمية المجهزة للطباعة بنظام الصفوف والأعمدة */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 overscroll-contain bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto print:m-0">
                <div 
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 print:border-none print:p-0 max-w-7xl mx-auto shadow-sm print:shadow-none flex flex-col gap-3 print:gap-1.5 official-schedule-document w-full print:w-full print:h-auto print:min-h-[184mm] print:max-h-none print:flex print:flex-col print:justify-between print:overflow-visible"
                  style={{ '--schedule-row-height': `${rowMinHeightMm}mm` } as React.CSSProperties}
                >
                  
                  {/* 🏛️ 1. الترويسة الأكاديمية الرسمية */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-3 print:pb-0.5 text-black shrink-0">
                    {/* الجهة الأكاديمية - يمين */}
                    <div className="text-right space-y-0.5 text-xs print:text-[10px] leading-tight font-black text-black">
                      <div className="text-sm print:text-[11.5px] font-black text-black">جمهورية العراق</div>
                      <div className="text-xs print:text-[10px] font-black text-black">وزارة التعليم العالي والبحث العلمي</div>
                      <div className="text-sm print:text-[11.5px] font-black text-black">جامعة الإمام جعفر الصادق (ع)</div>
                      <div className="text-xs print:text-[9.5px] font-black text-black">فرع ميسان — كلية تكنولوجيا المعلومات</div>
                      <div className="text-xs print:text-[10.5px] font-black text-black">قسم {departmentName}</div>
                    </div>

                    {/* الشعار والعنوان - وسط */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 print:w-9 print:h-9 mb-1 print:mb-0">
                        <Image
                          src="/logo.webp"
                          alt="شعار جامعة الإمام جعفر الصادق (ع)"
                          width={60}
                          height={60}
                          className="object-contain mx-auto print:max-h-9"
                          priority
                        />
                      </div>
                      <h1 className="text-base sm:text-lg print:text-[14px] font-black text-black tracking-tight leading-tight">
                        جدول النصاب والعبء التدريسي الأسبوعي المعتمد
                      </h1>
                      <div className="text-xs print:text-[10px] font-black text-black mt-0.5 print:mt-0">
                        العام الدراسي {resolvedAcademicYear}
                      </div>
                    </div>

                    {/* بيانات الجدول - يسار */}
                    <div className="text-left space-y-1 print:space-y-0.5 text-xs print:text-[10px] font-black text-black font-sans leading-tight">
                      <div><span>الأستاذ:</span> <strong className="text-black font-black">{teacherName}</strong></div>
                      <div><span>الكورس:</span> <strong className="text-black font-black">الكورس {selectedSemester === 1 ? 'الأول' : 'الثاني'}</strong></div>
                      <div><span>إجمالي النصاب:</span> <strong className="text-black font-black">{totalWeeklyHours} ساعة معتمدة ({myLectures.length} محاضرات)</strong></div>
                      <div className="flex items-center gap-1.5 print:gap-1">
                        <span>تاريخ الإصدار:</span>
                        <span className="font-mono font-black text-black px-1.5 py-0.5 print:px-1 print:py-0.5 rounded bg-slate-100 border border-slate-300 inline-block shadow-2xs print:text-[9.5px]" dir="ltr">
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
                          <th className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black text-xs sm:text-sm print:text-[12px] w-[11%] print:w-[11%] text-black">
                            اليوم
                          </th>
                          {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                            const slotLabels = ['المحاضرة الأولى', 'المحاضرة الثانية', 'المحاضرة الثالثة', 'المحاضرة الرابعة', 'المحاضرة الخامسة', 'المحاضرة السادسة'];
                            return (
                              <th key={slotIdx} className="p-2.5 print:py-1.5 print:px-1 text-center font-black border border-black text-xs sm:text-sm print:text-[12px] text-black" style={{ width: `${89 / printMaxSlots}%` }}>
                                {slotLabels[slotIdx] || `المحاضرة ${slotIdx + 1}`}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* صفوف الأيام والمحاضرات (طباعة أيام الدوام الفعلي فقط للأستاذ بدقة 100%) */}
                      <tbody>
                        {printScheduleDays
                          .filter((d) => myLectures.length === 0 || myLectures.some((l) => l.day === d.key))
                          .map((d) => {
                            const dayLecs = myLectures
                              .filter((l) => l.day === d.key)
                              .sort((a, b) => getAcademicSlotOrder(a.start_time) - getAcademicSlotOrder(b.start_time));

                            if (dayLecs.length === 0) {
                              return (
                                <tr key={d.key} className="border-b border-black">
                                  <td className="p-2.5 print:py-1 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[14px] w-[11%] print:w-[11%]">
                                    <div 
                                      className="day-column-cell flex flex-col items-center justify-center h-full"
                                      style={{ minHeight: `${rowMinHeightMm}mm` }}
                                    >
                                      <span className="font-black text-sm print:text-[15px] text-black leading-tight">{d.label_ar}</span>
                                    </div>
                                  </td>
                                  <td
                                    colSpan={printMaxSlots}
                                    className="p-3 print:py-2 print:px-2 text-center font-black border border-black bg-white text-black text-xs sm:text-sm print:text-[13px]"
                                  >
                                    —
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={d.key} className="border-b border-black">
                                <td className="p-2.5 print:py-1 print:px-1 text-center font-black border border-black bg-slate-50 text-black text-xs sm:text-sm print:text-[14px] align-middle w-[11%] print:w-[11%]">
                                  <div 
                                    className="day-column-cell flex flex-col items-center justify-center h-full gap-1 print:gap-0.5"
                                    style={{ minHeight: `${rowMinHeightMm}mm` }}
                                  >
                                    <span className="font-black text-sm print:text-[15px] text-black leading-tight">{d.label_ar}</span>
                                    {dayLecs.length > 0 && (
                                      <span className="text-[10px] print:text-[9.5px] font-black text-black bg-slate-200/90 print:bg-slate-100 px-2 py-0.5 rounded border border-slate-300 print:border-black/50 leading-none inline-block shadow-2xs mt-1 print:mt-0.5">
                                        {formatArabicLectureCount(dayLecs.length)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {Array.from({ length: printMaxSlots }).map((_, slotIdx) => {
                                  const lec = dayLecs[slotIdx];
                                  if (!lec) {
                                    return (
                                      <td key={slotIdx} className="p-2 print:py-1 print:px-1 text-center text-slate-400 font-black border border-black bg-white align-middle text-xs sm:text-sm print:text-[14px]" style={{ width: `${89 / printMaxSlots}%` }}>
                                        —
                                      </td>
                                    );
                                  }
                                  const typeLabel = lec.type === 'practical' ? 'عملي' : lec.type === 'tutorial' ? 'حلقة نقاشية' : 'نظري';
                                  return (
                                    <td key={slotIdx} className="p-2 sm:p-2.5 print:p-0.5 border border-black bg-white align-top text-right text-xs text-black" style={{ width: `${89 / printMaxSlots}%` }}>
                                      <div 
                                        className="lecture-slot-card flex flex-col justify-between h-full min-h-[110px] print:min-h-[25.5mm] print:h-full gap-1 print:gap-0.5"
                                        style={{ minHeight: `${rowMinHeightMm}mm` }}
                                      >
                                        {/* 1️⃣ الشريط العلوي: التوقيت الأكاديمي المعتمد ص وم + نوع المحاضرة */}
                                        <div className="flex items-center justify-between gap-1 print:gap-0.5 border-b border-black/20 pb-0.5 print:pb-0.5 font-black shrink-0">
                                          <span className="px-2 py-0.5 print:px-1.5 print:py-0.5 rounded bg-slate-100 border border-black/50 text-[10px] sm:text-[11px] print:text-[10px] font-black text-black font-sans shrink-0 shadow-2xs" dir="rtl">
                                            {formatArabicScheduleTime(`${lec.start_time} - ${lec.end_time}`)}
                                          </span>
                                          <span className={`px-2 py-0.5 print:px-1.5 print:py-0.5 rounded text-[10px] print:text-[10px] font-black shrink-0 border ${
                                            lec.type === 'practical' 
                                              ? 'bg-slate-900 text-white border-black shadow-2xs' 
                                              : lec.type === 'tutorial'
                                                ? 'bg-slate-200 text-black border-black'
                                                : 'bg-white text-black border-black'
                                          }`}>
                                            {typeLabel}
                                          </span>
                                        </div>

                                        {/* 2️⃣ جسم الخلية: اسم المادة فقط بنص واضح وأسود ناصع (حذف رمز المادة لضمان بقاء الوثيقة بصفحة واحدة) */}
                                        <div className="flex-1 flex flex-col justify-center py-1 print:py-0.5">
                                          <div className="font-black text-xs sm:text-[14px] print:text-[13.5px] text-black leading-snug line-clamp-2">
                                            {lec.course_name}
                                          </div>
                                        </div>

                                        {/* 3️⃣ كارت المرحلة والقاعة بتنسيق أفقي متناسق */}
                                        <div className="bg-slate-50 border-t border-black/25 pt-0.5 pb-0.5 px-1.5 print:py-0.5 print:px-1 rounded text-[10px] sm:text-[11px] print:text-[10px] font-black text-black print:flex print:items-center print:justify-between print:gap-1 shrink-0">
                                          <div className="flex items-center gap-1 print:gap-0.5 text-black font-black leading-tight truncate">
                                            <span className="text-black font-black shrink-0">المرحلة:</span>
                                            {/* 🎓 كتابة المرحلة والدراسة والكروب المستقل بشكل دقيق حتى يعرف التدريسي يا كروب يدرّس */}
                                            <span className="text-black font-black truncate print:text-[10px]">
                                              المرحلة {getStageNameInArabic(lec.stage_number || 1)} ({lec.study_type === 'evening' ? 'مسائي' : 'صباحي'}){lec.target_group && lec.target_group !== 'all' ? ` — كروب ${lec.target_group}` : ''}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 print:gap-0.5 text-black font-black leading-tight shrink-0">
                                            <span className="text-black font-black shrink-0">المكان:</span>
                                            <span className="text-black font-black truncate px-1 py-0.5 print:px-1 print:py-0 bg-white rounded border border-black/40 inline-block shadow-2xs print:text-[9.5px]">
                                              {lec.room}
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

                  {/* ✍️ 3. التواقيع الرسمية المعتمدة بالأسماء وتاريخ الاعتماد التلقائي الصادر من النظام */}
                  <div className="grid grid-cols-3 gap-6 print:gap-4 text-center pt-2 print:pt-1.5 print:mt-0 border-t-2 border-black text-black shrink-0 print:break-inside-avoid">
                    {/* عضو هيئة التدريس */}
                    <div className="space-y-1 print:space-y-0.5 flex flex-col items-center justify-between text-black">
                      <div className="text-center">
                        <p className="font-black text-xs sm:text-sm print:text-[11px] text-black">عضو هيئة التدريس</p>
                        <p className="font-black text-xs sm:text-sm print:text-[10.5px] text-black mt-0.5 print:mt-0">{teacherName}</p>
                      </div>
                      <div className="space-y-0.5 print:space-y-0.5 w-full text-center text-black font-black">
                        <p className="font-black text-center text-black text-xs print:text-[10px]">التوقيع: .....................</p>
                        <p className="font-black text-center text-[11px] print:text-[9.5px] text-black">
                          التاريخ: <span className="font-mono font-black" dir="ltr">{formatOfficialIssueDate()}</span>
                        </p>
                      </div>
                    </div>

                    {/* مقرر القسم العلمي */}
                    <div className="space-y-1 print:space-y-0.5 flex flex-col items-center justify-between text-black">
                      <div className="text-center">
                        <p className="font-black text-xs sm:text-sm print:text-[11px] text-black">مقرر القسم العلمي</p>
                        <p className="font-black text-xs sm:text-sm print:text-[10.5px] text-black mt-0.5 print:mt-0">{resolvedRapporteurName}</p>
                      </div>
                      <div className="space-y-0.5 print:space-y-0.5 w-full text-center text-black font-black">
                        <p className="font-black text-center text-black text-xs print:text-[10px]">التوقيع: .....................</p>
                        <p className="font-black text-center text-[11px] print:text-[9.5px] text-black">
                          التاريخ: <span className="font-mono font-black" dir="ltr">{formatOfficialIssueDate()}</span>
                        </p>
                      </div>
                    </div>

                    {/* رئيس القسم العلمي */}
                    <div className="space-y-1 print:space-y-0.5 flex flex-col items-center justify-between text-black">
                      <div className="text-center">
                        <p className="font-black text-xs sm:text-sm print:text-[11px] text-black">رئيس قسم {departmentName}</p>
                        <p className="font-black text-xs sm:text-sm print:text-[10.5px] text-black mt-0.5 print:mt-0">{resolvedHeadName}</p>
                      </div>
                      <div className="space-y-0.5 print:space-y-0.5 w-full text-center text-black font-black">
                        <p className="font-black text-center text-black text-xs print:text-[10px]">التوقيع: .....................</p>
                        <p className="font-black text-center text-[11px] print:text-[9.5px] text-black">
                          التاريخ: <span className="font-mono font-black" dir="ltr">{formatOfficialIssueDate()}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 📝 4. التذييل والتوثيق الإلكتروني */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] print:text-[8.5px] font-black text-black pt-1.5 print:pt-1 pb-1 print:pb-0.5 border-t border-black shrink-0">
                    <span>المنصة الأكاديمية المركزية — مسار بولونيا التعليمي — جامعة الإمام جعفر الصادق (ع) - فرع ميسان</span>
                    <span>وثيقة نصاب تدريسي رسمية صادرة إلكترونياً وغير قابلة للشطب أو التعديل اليدوي</span>
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
