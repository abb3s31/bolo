'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  Sparkles, // ✨ أيقونة الضوابط الأكاديمية
  ClipboardList, // 📋 أيقونة السجلات والغيابات
  Users, // 👥 أيقونة الطلاب
  BarChart3, // 📊 أيقونة الرسوم البيانية
  FileSpreadsheet, // 📑 أيقونة ملف الإكسل
  SlidersHorizontal, // ⚙️ أيقونة تخصيص الساعات
  Send, // 📤 أيقونة إرسال التنبيه
  CheckSquare, // ☑️ أيقونة التحديد
  Square, // ⬜ أيقونة المربع الفارغ
  FileText, // 📜 أيقونة ملف الأمر الإداري PDF
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Check, // ✔️ أيقونة الصح
  CheckCircle2, // ✅ أيقونة الوضع الآمن
  AlertTriangle, // ⚠️ أيقونة الإنذار الأولي
  AlertCircle, // 🛑 أيقونة الإنذار النهائي
  Ban, // 🚫 أيقونة الحرمان
  ShieldCheck, // 🛡️ أيقونة الدرع الأكاديمي
  RefreshCw, // 🔄 أيقونة التحديث والمزامنة
  BookOpen, // 📖 أيقونة المادة الدراسية
  Clock, // 🕒 أيقونة الوقت والفترة
  Search, // 🔍 أيقونة البحث
  Layers, // 📚 أيقونة الكورس
  Sun, // ☀️ أيقونة الفترة الصباحية
  Moon, // 🌙 أيقونة الفترة المسائية
  CalendarDays, // 🗓️ أيقونة التقويم والأسابيع
  Calendar, // 📅 أيقونة العام الدراسي والتقويم
  GraduationCap, // 🎓 أيقونة المرحلة الدراسية
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type {
  UserProfile, // 👤 نوع بروفايل المستخدم
  Course, // 📚 نوع المادة الدراسية
  StudentAttendanceRecord, // 📋 نوع سجل حضور الطالب
  DepartmentScheduleConfig, // ⚙️ نوع إعدادات جدول القسم
  AttendanceExcuseRequest, // 📑 نوع طلب الإجازة
  AttendanceWarningStatus, // 🛡️ نوع حالة الإنذار الأكاديمي
  StageGroupConfig, // ⚙️ نوع إعدادات كروبات المرحلة
} from '@/types'; // 🏷️ استيراد الأنواع الصارمة
import {
  GroupAttendanceSvg, // 📋 أيقونة سجل الحضور والغياب الخاص بالكروب
  GroupBadgeSvg, // 🏷️ أيقونة بادج الكروب
} from '@/components/common/GroupSvgIcons'; // 🎨 أيقونات الكروبات النقية SVG
import {
  AttendancePresentSvg, // 🟢 أيقونة ساعات الحضور الفعلي
  AttendanceExcusedSvg, // 🔵 أيقونة ساعات الإجازة الرسمية
  AttendanceHolidaySvg, // 🏖️ أيقونة ساعات العطلة الرسمية
  AttendanceAbsenceSvg, // 🔴 أيقونة ساعات الغياب
  StudentDaysSheetSvg, // 📋 أيقونة زر كشف الأيام
  DeclareHolidaySvg, // 📢 أيقونة إعلان وتعطيل الدوام
} from '@/components/common/AttendanceCustomSvgIcons'; // 🎨 أيقونات SVG النقية بدون برتقالي وبدون بنفسجي
import { DepartmentHolidayModal } from '@/components/attendance/DepartmentHolidayModal'; // 🏖️ نافذة إعلان وتعطيل الدوام الرسمي
import { StudentAttendanceDaysModal } from '@/components/attendance/StudentAttendanceDaysModal'; // 📋 نافذة كشف الأيام التفاعلية للطالب
import { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 تصنيف التبليغات
import AttendanceAnalyticsCharts from '@/components/attendance/AttendanceAnalyticsCharts'; // 📊 لوحة التحليلات
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون الترقيم الموحد
import { calculateStudentCourseAttendance, getAttendanceWarningBadgeMeta } from '@/lib/attendance-utils'; // 📋 دوال احتساب الغيابات
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ أسماء المراحل بالعربية
import { exportOfficialWarningLetterPDF } from '@/lib/pdf-export'; // 📜 تصدير كتاب الإنذار PDF
import {
  getDayOfWeekFromDateString, // 🗓️ استخراج اليوم من التاريخ
  calculateDateForAnyDayInWeek, // 📅 حساب تاريخ أي يوم في الأسبوع
  formatDateArabicWithDay, // 🏷️ تنسيق التاريخ بالعربية
  IRAQI_ARABIC_MONTHS, // 🗓️ مصفوفة الأشهر العراقية
} from '@/lib/schedule-utils'; // 🕒 أدوات الجدول الأكاديمي
import { getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 📅 دوال العام الدراسي المعتمد

// 📋 واجهة خصائص تبويب الحضور والغيابات والإنذارات الأكاديمية
export interface DepartmentAttendanceTabProps {
  deptName: string; // 🏢 اسم القسم
  currentDeptId: string; // 🆔 معرف القسم الحالي
  academicYear?: string; // 📅 العام الدراسي المعتمد (مثال: 2026-2027)
  filterAttendanceAcademicYear?: string; // 📅 فلتر العام الدراسي المختار لحفظ واسترجاع سجل كل سنة
  setFilterAttendanceAcademicYear?: (year: string) => void; // 🔄 دالة تحديث فلتر العام الدراسي
  deptCourses: Course[]; // 📚 مواد القسم
  deptStudents: UserProfile[]; // 🎓 طلاب القسم
  attendanceRecords: StudentAttendanceRecord[]; // 📋 سجلات الحضور
  setAttendanceRecords: React.Dispatch<React.SetStateAction<StudentAttendanceRecord[]>>; // 🔄 تحديث سجلات الحضور
  currentScheduleConfig: DepartmentScheduleConfig; // ⚙️ إعدادات جدول القسم
  excuseRequests: AttendanceExcuseRequest[]; // 📑 طلبات الإجازات
  currentHead?: UserProfile | { full_name: string; generated_email?: string } | null; // 👤 رئيس القسم
  currentRap?: UserProfile | { full_name: string; generated_email?: string } | null; // 👤 مقرر القسم
  scheduleCurrentAcademicWeek: number; // 🔢 الأسبوع الأكاديمي الحالي
  attendanceViewMode: 'list' | 'analytics'; // 📊 نمط العرض (جدول أو تحليلات)
  setAttendanceViewMode: (mode: 'list' | 'analytics') => void; // 🔄 تحديث نمط العرض
  filterAttendanceStage: number | 'all'; // 🎓 مرحلة الفلترة
  setFilterAttendanceStage: (stg: number | 'all') => void; // 🔄 تحديث مرحلة الفلترة
  filterAttendanceSemester: 'all' | 1 | 2; // 🗓️ كورس الفلترة
  setFilterAttendanceSemester: React.Dispatch<React.SetStateAction<'all' | 1 | 2>>; // 🔄 تحديث كورس الفلترة
  filterAttendanceStudyType: 'all' | 'morning' | 'evening'; // ☀️🌙 فترة الفلترة
  setFilterAttendanceStudyType: (type: 'all' | 'morning' | 'evening') => void; // 🔄 تحديث فترة الفلترة
  filterAttendanceWeek: number | 'all'; // 📅 أسبوع الفلترة
  setFilterAttendanceWeek: (w: number | 'all') => void; // 🔄 تحديث أسبوع الفلترة
  isAttendanceWeekDropdownOpen: boolean; // 🔽 فتح منسدلة الأسابيع
  setIsAttendanceWeekDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل منسدلة الأسابيع
  attendanceSearch: string; // 🔍 نص البحث
  setAttendanceSearch: (s: string) => void; // 🔄 تحديث نص البحث
  filterAttendanceCourse: string | 'all'; // 📚 مادة الفلترة
  setFilterAttendanceCourse: (c: string | 'all') => void; // 🔄 تحديث مادة الفلترة
  isAttendanceCourseDropdownOpen: boolean; // 🔽 فتح منسدلة المواد
  setIsAttendanceCourseDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل منسدلة المواد
  filterAttendanceStatus: AttendanceWarningStatus | 'all'; // 🛡️ حالة الإنذار المفلترة
  setFilterAttendanceStatus: (st: AttendanceWarningStatus | 'all') => void; // 🔄 تحديث حالة الإنذار
  isAttendanceStatusDropdownOpen: boolean; // 🔽 فتح منسدلة الحالات
  setIsAttendanceStatusDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تبديل منسدلة الحالات
  isSyncingAttendance: boolean; // ⏳ حالة المزامنة السحابية
  setIsSyncingAttendance: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث حالة المزامنة
  selectedAttendanceStudentIds: string[]; // 🔘 معرفات الطلبة المحددين
  setSelectedAttendanceStudentIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 تحديث الطلبة المحددين
  attendancePage: number; // 🔢 الصفحة الحالية
  setAttendancePage: (p: number) => void; // 🔄 تحديث الصفحة
  attendancePageSize: number; // 📏 حجم الصفحة
  setAttendancePageSize: (s: number) => void; // 🔄 تحديث حجم الصفحة
  isExportingAttendanceExcel: boolean; // ⏳ حالة تصدير الإكسل
  handleExportAttendanceExcel: () => void; // 📑 دالة تصدير الإكسل
  setIsDurationSettingsModalOpen: (open: boolean) => void; // ⚙️ فتح نافذة تخصيص الساعات
  setIsDeptExcuseReviewOpen: (open: boolean) => void; // 📑 فتح نافذة تدقيق الإجازات
  setIsAttendanceNoticeModalOpen: (open: boolean) => void; // 📢 فتح نافذة التبليغ الذكي
  setAttendanceNoticeTargetStudent: (st: UserProfile | null) => void; // 🎯 تحديد الطالب المستهدف للتبليغ
  setAttendanceNoticeDefaultCategory: (cat: AttendanceNoticeCategory) => void; // 🏷️ تحديد تصنيف التبليغ
  setSuccessMessage: (msg: string) => void; // 💬 رسالة النجاح
  syncAttendanceRecordsFromSupabase: () => Promise<StudentAttendanceRecord[]>; // ☁️ مزامنة السجلات من السحابة
  filterAttendanceGroup?: string; // 👥 تصفية كروب الحضور المختار
  setFilterAttendanceGroup?: (grp: string) => void; // 🔄 دالة تحديث تصفية كروب الحضور
  stageGroupConfigs?: StageGroupConfig[]; // ⚙️ قائمة إعدادات كروبات المراحل
}

// 🏛️ مكون تبويب الحضور والغيابات والإنذارات الأكاديمية لمسار بولونيا
export const DepartmentAttendanceTab: React.FC<DepartmentAttendanceTabProps> = ({
  deptName, // 🏢 اسم القسم
  currentDeptId, // 🆔 معرف القسم
  deptCourses, // 📚 مواد القسم
  deptStudents, // 🎓 طلاب القسم
  attendanceRecords, // 📋 سجلات الحضور
  setAttendanceRecords, // 🔄 تحديث السجلات
  currentScheduleConfig, // ⚙️ إعدادات الجدول
  excuseRequests, // 📑 طلبات الإجازات
  currentHead, // 👤 رئيس القسم
  currentRap, // 👤 مقرر القسم
  scheduleCurrentAcademicWeek, // 🔢 الأسبوع الحالي
  attendanceViewMode, // 📊 نمط العرض
  setAttendanceViewMode, // 🔄 تحديث نمط العرض
  filterAttendanceStage, // 🎓 مرحلة الفلترة
  setFilterAttendanceStage, // 🔄 تحديث مرحلة الفلترة
  filterAttendanceSemester, // 🗓️ كورس الفلترة
  setFilterAttendanceSemester, // 🔄 تحديث كورس الفلترة
  filterAttendanceStudyType, // ☀️🌙 فترة الفلترة
  setFilterAttendanceStudyType, // 🔄 تحديث فترة الفلترة
  filterAttendanceWeek, // 📅 أسبوع الفلترة
  setFilterAttendanceWeek, // 🔄 تحديث أسبوع الفلترة
  isAttendanceWeekDropdownOpen, // 🔽 منسدلة الأسابيع
  setIsAttendanceWeekDropdownOpen, // 🔄 تحديث منسدلة الأسابيع
  attendanceSearch, // 🔍 نص البحث
  setAttendanceSearch, // 🔄 تحديث نص البحث
  filterAttendanceCourse, // 📚 مادة الفلترة
  setFilterAttendanceCourse, // 🔄 تحديث مادة الفلترة
  isAttendanceCourseDropdownOpen, // 🔽 منسدلة المواد
  setIsAttendanceCourseDropdownOpen, // 🔄 تحديث منسدلة المواد
  filterAttendanceStatus, // 🛡️ حالة الإنذار
  setFilterAttendanceStatus, // 🔄 تحديث حالة الإنذار
  isAttendanceStatusDropdownOpen, // 🔽 منسدلة الحالات
  setIsAttendanceStatusDropdownOpen, // 🔄 تحديث منسدلة الحالات
  isSyncingAttendance, // ⏳ حالة المزامنة
  setIsSyncingAttendance, // 🔄 تحديث حالة المزامنة
  selectedAttendanceStudentIds, // 🔘 الطلبة المحددين
  setSelectedAttendanceStudentIds, // 🔄 تحديث الطلبة المحددين
  attendancePage, // 🔢 الصفحة الحالية
  setAttendancePage, // 🔄 تحديث الصفحة
  attendancePageSize, // 📏 حجم الصفحة
  setAttendancePageSize, // 🔄 تحديث حجم الصفحة
  isExportingAttendanceExcel, // ⏳ تصدير الإكسل
  handleExportAttendanceExcel, // 📑 دالة تصدير الإكسل
  setIsDurationSettingsModalOpen, // ⚙️ فتح تخصيص الساعات
  setIsDeptExcuseReviewOpen, // 📑 فتح تدقيق الإجازات
  setIsAttendanceNoticeModalOpen, // 📢 فتح نافذة التبليغ
  setAttendanceNoticeTargetStudent, // 🎯 تحديد الطالب المستهدف
  setAttendanceNoticeDefaultCategory, // 🏷️ تصنيف التبليغ
  setSuccessMessage, // 💬 تعيين رسالة النجاح
  syncAttendanceRecordsFromSupabase, // ☁️ دالة المزامنة السحابية
  filterAttendanceGroup, // 👥 تصفية كروب الحضور
  setFilterAttendanceGroup, // 🔄 تحديث تصفية كروب الحضور
  stageGroupConfigs, // ⚙️ إعدادات كروبات المراحل
  academicYear, // 📅 العام الدراسي المعتمد
  filterAttendanceAcademicYear, // 📅 فلتر العام الدراسي
  setFilterAttendanceAcademicYear, // 🔄 دالة تحديث فلتر العام الدراسي
}) => {
  // 📅 حالة الفلترة بالعام الدراسي مع إمكانية استعراض أرشيف الأعوام السابقة باحترافية وتطهير عام 2025-2026
  const [internalYearFilter, setInternalYearFilter] = React.useState<string>(
    academicYear && !academicYear.includes('2025') ? academicYear : '2026-2027'
  ); // 🗓️ ضبط العام الدراسي الداخلي حصراً على 2026-2027
  const rawYearFilter = filterAttendanceAcademicYear !== undefined ? filterAttendanceAcademicYear : internalYearFilter; // 📌 قراءة العام الممرر
  const currentYearFilter = rawYearFilter && !rawYearFilter.includes('2025') ? rawYearFilter : '2026-2027'; // 🛡️ ضمان عدم اعتماد أي عام قديم 2025
  const baseYearFilterChange = setFilterAttendanceAcademicYear || setInternalYearFilter; // ⚡ دالة التغيير الأساسية
  const handleYearFilterChange = React.useCallback((targetYear: string) => {
    const cleanYear = targetYear && !targetYear.includes('2025') ? targetYear : '2026-2027'; // 🧹 تنظيف فوري لأي اختيار قديم
    baseYearFilterChange(cleanYear); // ⚡ تطبيق التغيير النظيف
  }, [baseYearFilterChange]);

  // 👥 حالة محلية احتياطية لتصفية الكروب إذا لم تُمرر من المكون الأب
  const [internalGroupFilter, setInternalGroupFilter] = React.useState<string>('all'); // 🎯 فلتر الكروب الداخلي
  // 🎯 تحديد الفلتر الفعال سواء كان ممرراً أو داخلياً
  const currentGroupFilter = filterAttendanceGroup !== undefined ? filterAttendanceGroup : internalGroupFilter; // 📌 الكروب النشط
  // 🔄 دالة تغيير فلتر الكروب المتوافقة
  const handleGroupFilterChange = setFilterAttendanceGroup || setInternalGroupFilter; // ⚡ دالة التغيير

  // 🗓️ استخراج قائمة الأعوام الدراسية المتاحة للأرشيف والسجلات مع مسح عام 2025-2026 نهائياً
  const availableAcademicYears = React.useMemo<string[]>(() => {
    const yearsSet = new Set<string>(); // 📦 مجموعة فريدة للأعوام
    const currentYear = getAcademicYear(); // 📅 جلب العام الرسمي الحالي
    if (currentYear && !currentYear.includes('2025')) yearsSet.add(currentYear); // ➕ إضافة العام الحالي
    yearsSet.add('2026-2027'); // ➕ اعتماد 2026-2027 كثابت رسمي أساسي
    // 🧹 فحص سجلات الحضور وإضافة الأعوام غير القديمة حصراً
    attendanceRecords.forEach((r) => {
      const yrId = r.academic_year_id; // 🆔 معرف العام بالسجل
      if (yrId && !yrId.includes('2025') && yrId !== '2025-2026' && yrId !== 'year-2025') {
        yearsSet.add(yrId); // ➕ إضافة الأعوام المعتمدة حصراً
      }
    });
    return Array.from(yearsSet).sort().reverse(); // 🔠 ترتيب تنازلي للأعوام
  }, [attendanceRecords]);

  // 🏖️ حالة فتح نافذة إعلان وتعطيل الدوام الرسمي للقسم
  const [isHolidayModalOpen, setIsHolidayModalOpen] = React.useState<boolean>(false); // 🚪 نافذة العطلة
  // 📋 حالة فتح نافذة كشف أيام وساعات الحضور للطالب
  const [isStudentDaysModalOpen, setIsStudentDaysModalOpen] = React.useState<boolean>(false); // 🚪 نافذة كشف الأيام
  // 🎓 بيانات الطالب المختار لعرض كشف الأيام
  const [selectedStudentForDaysModal, setSelectedStudentForDaysModal] = React.useState<UserProfile | null>(null); // 👤 الطالب المختار

  // 👥 استخراج الكروبات المتوفرة للمرحلة أو القسم ككل
  const availableGroups = React.useMemo<string[]>(() => {
    const grpSet = new Set<string>(); // 📦 مجموعة لتفادي التكرار
    if (filterAttendanceStage !== 'all') { // 🎓 في حال اختيار مرحلة محددة
      const cfg = stageGroupConfigs?.find((c) => c.stage_number === filterAttendanceStage); // 🔍 جلب إعداد المرحلة
      const grpList: string[] = cfg?.groups || cfg?.group_names || []; // 📋 استخراج قائمة الكروبات
      if (cfg && cfg.group_count > 0 && grpList.length > 0) { // ✅ التحقق من وجود أسماء كروبات
        grpList.forEach((g: string) => grpSet.add(g)); // ➕ إضافة أسماء الكروبات من الإعداد
      }
      deptStudents // 🎓 فحص طلبة المرحلة الحالية
        .filter((s) => (s.stage_number || 1) === filterAttendanceStage) // 🔍 تصفية طلاب المرحلة
        .forEach((s) => {
          if (s.student_group) grpSet.add(s.student_group); // ➕ إضافة كروب الطالب
        });
    } else { // 🌐 في حال كافة المراحل
      stageGroupConfigs?.forEach((cfg) => { // 🔄 المرور على إعدادات المراحل
        const grpList: string[] = cfg.groups || cfg.group_names || []; // 📋 استخراج الكروبات
        grpList.forEach((g: string) => grpSet.add(g)); // ➕ إضافة أسماء الكروبات
      });
      deptStudents.forEach((s) => { // 🔄 فحص كافة طلاب القسم
        if (s.student_group) grpSet.add(s.student_group); // ➕ إضافة كروب الطالب
      });
    }
    return Array.from(grpSet).sort(); // 🔠 ترتيب أبجدي أنيق
  }, [filterAttendanceStage, stageGroupConfigs, deptStudents]);

  return (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 📋 الهيدر الرئيسي لسجلات الحضور والغيابات مع أزرار العمليات بسطر خاص */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            {/* 🏷️ العنوان والبادجات التعريفية + وحدة تبديل نمط العرض الفاخرة المدمجة (مفصولة بالكامل عن شريط العمليات) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3.5 py-1 bg-[#0F2942] text-white text-sm font-black rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> {/* ✨ أيقونة الضوابط الأكاديمية */}
                    <span>ضوابط الحضور والإنذارات الأكاديمية</span> {/* 🏷️ عنوان البادج */}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl">
                    قسم {deptName} {/* 🏢 القسم الحالي */}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2.5 tracking-tight">
                  <ClipboardList className="w-7 h-7 text-[#0F2942]" /> {/* 📋 أيقونة السجلات */}
                  <span>سجلات الحضور والغيابات والإنذارات الأكاديمية لمسار بولونيا</span> {/* 📌 عنوان الصفحة الرئيسي */}
                </h2>
                <p className="text-base sm:text-lg font-black text-slate-800 mt-1 leading-relaxed">
                  متابعة مركزية لنسب غياب طلبة القسم ورصد تجاوزات الحدود القانونية (5% إنذار أولي | 7% إنذار نهائي | 10% حرمان رسمي) {/* 📝 الوصف القانوني للغيابات */}
                </p>
              </div>

              {/* 🎛️ كبسولة التبديل المدمجة الفاخرة بين جدول الطلاب والتحليلات (مفصولة بالكامل عن أزرار العمليات) */}
              <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-1.5 shadow-2xs shrink-0 self-start lg:self-center">
                {/* 1️⃣ زر جدول الطلاب */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => setAttendanceViewMode('list')} // ⚡ تفعيل نمط جدول الطلاب
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    attendanceViewMode === 'list'
                      ? 'bg-[#0F2942] text-white shadow-md border border-[#0F2942]' // 🎨 نشط: كحلي ملكي راقٍ وظل ناعم
                      : 'bg-transparent hover:bg-slate-200/70 text-slate-700 hover:text-slate-950 border border-transparent' // 🎨 غير نشط: رمادي تفاعلي ناعم
                  }`}
                  title="عرض جدول كشف حضور وغياب الطلاب" // 💡 تلميح الزر
                >
                  <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${attendanceViewMode === 'list' ? 'text-cyan-300' : 'text-[#0F2942]'}`} /> {/* 👥 أيقونة الطلاب */}
                  <span>جدول الطلاب</span> {/* 📝 نص الزر */}
                </button>

                {/* 2️⃣ زر التحليلات والرسوم البيانية */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => setAttendanceViewMode('analytics')} // ⚡ تفعيل نمط التحليلات
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    attendanceViewMode === 'analytics'
                      ? 'bg-[#0F2942] text-white shadow-md border border-[#0F2942]' // 🎨 نشط: كحلي ملكي راقٍ وظل ناعم
                      : 'bg-transparent hover:bg-slate-200/70 text-slate-700 hover:text-slate-950 border border-transparent' // 🎨 غير نشط: رمادي تفاعلي ناعم
                  }`}
                  title="عرض الرسوم البيانية ومؤشرات الغياب" // 💡 تلميح الزر
                >
                  <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${attendanceViewMode === 'analytics' ? 'text-cyan-300' : 'text-[#0F2942]'}`} /> {/* 📊 أيقونة الرسوم البيانية */}
                  <span>التحليلات والرسوم البيانية</span> {/* 📝 نص الزر */}
                </button>
              </div>
            </div>

            {/* 🛠️ شريط أزرار العمليات والإجراءات المنسقة بالكامل بسطر خاص بها بلون الكحلي الملكي الموحد */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2.5 sm:gap-3">

              {/* 3️⃣ زر تصدير الحضور (Excel) */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال تلقائي
                onClick={handleExportAttendanceExcel} // ⚡ تشغيل دالة تصدير كشف الحضور للإكسل
                disabled={isExportingAttendanceExcel} // 🛑 تعطيل الزر أثناء عملية التصدير
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تصدير كشف الحضور والغيابات والإنذارات الأكاديمية لمسار بولونيا إلى ملف Excel" // 💡 نص التلميح
              >
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" /> {/* 📊 أيقونة الإكسل باللون الزمردي الزاهي */}
                <span>{isExportingAttendanceExcel ? 'جاري التصدير...' : selectedAttendanceStudentIds.length > 0 ? `تصدير المحدد (${selectedAttendanceStudentIds.length}) Excel` : 'تصدير الحضور (Excel)'}</span> {/* 🏷️ نص الزر التفاعلي الذكي */}
              </button>

              {/* 4️⃣ زر تخصيص ساعات المحاضرات */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setIsDurationSettingsModalOpen(true)} // ⚡ فتح نافذة تخصيص ساعات المحاضرات
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تخصيص وإعداد مدد وساعات المحاضرات للقسم ومواده" // 💡 نص التلميح
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" /> {/* ⚙️ أيقونة التخصيص */}
                <span>تخصيص ساعات المحاضرات</span> {/* 📝 نص الزر */}
              </button>

              {/* 5️⃣ زر إرسال تبليغ عام للمرحلة */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => {
                  setAttendanceNoticeTargetStudent(null); // 🎯 تصفير الطالب المستهدف ليكون للجميع
                  setSelectedAttendanceStudentIds([]); // 🧹 تصفير التحديدات
                  setAttendanceNoticeDefaultCategory('general_announcement'); // 📢 تصنيف التبليغ العام
                  setIsAttendanceNoticeModalOpen(true); // 🚀 فتح نافذة إرسال التبليغ
                }}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="إرسال تبليغ عام أو تنبيه لطلبة المرحلة" // 💡 نص التلميح
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" /> {/* 📤 أيقونة الإرسال الزرقاء */}
                <span>إرسال تبليغ عام للمرحلة</span> {/* 📝 نص الزر */}
              </button>

              {/* 6️⃣ زر تدقيق ومراجعة طلبات الإجازات */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setIsDeptExcuseReviewOpen(true)} // ⚡ فتح نافذة مراجعة الإجازات
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تدقيق ومراجعة طلبات الإجازات والأعذار الرسمية" // 💡 نص التلميح
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" /> {/* 📑 أيقونة طلبات الإجازات */}
                <span>تدقيق ومراجعة طلبات الإجازات ({excuseRequests.filter((e: AttendanceExcuseRequest) => e.department_id === currentDeptId && e.status === 'pending').length})</span> {/* 📝 نص الزر مع العداد */}
              </button>

              {/* 7️⃣ زر تعطيل الدوام الرسمي وإعلان عطلة رسمية */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={() => setIsHolidayModalOpen(true)} // ⚡ فتح نافذة إعلان عطلة رسمية للقسم أو المرحلة
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي متناسق بدون برتقالي وبدون بنفسجي
                title="إعلان عطلة رسمية وتعطيل الدوام الرسمي للطلبة مع تثبيت السجلات تلقائياً" // 💡 تلميح الزر
              >
                <DeclareHolidaySvg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" /> {/* 📢 أيقونة إعلان العطلة بصيغة SVG نقية */}
                <span>تعطيل الدوام / إعلان عطلة رسمية</span> {/* 📝 نص الزر الرسمي */}
              </button>
            </div>
          </div>

          {/* 📋 عرض محتوى جدول الطلاب مع فلاتره وإحصائياته فقط في نمط القائمة */}
          {attendanceViewMode === 'list' && (
            <div className="space-y-6">
              {/* 🎛️ شريط الفلاتر المتقدم والشامل لتبويب الحضور: المرحلة + الكورس + الفترة + المادة + البحث الفوري */}
              {/* 🎛️ شريط الفلاتر والتبويبات الأكاديمية الاحترافي الموحد لمسار بولونيا */}
              <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-xs space-y-4"> {/* 📦 بطاقة التبويبات البيضاء الرئيسية */}
            
            {/* 📍 السطر الأول: التبويبات الأكاديمية التأسيسية (العام الدراسي ⬅️ المرحلة ⬅️ الكورس ⬅️ الفترة) */}
            <div className="flex flex-wrap items-center gap-3.5"> {/* 🔄 صف مرن يحتوي على التبويبات الأساسية بتجاوب كامل */}
              
              {/* 📅 0. تبويب العام الدراسي وأرشيف السجلات */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs shrink-0"> {/* 🏷️ كبسولة تبويبات العام الدراسي */}
                <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم العام */}
                  <Calendar className="w-4 h-4 text-[#0F2942]" /> {/* 📅 أيقونة التقويم السنوي */}
                  <span>العام الدراسي:</span> {/* 📝 نص العنوان */}
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap"> {/* 🔘 حاوية أزرار الأعوام الأفقية */}
                  <button
                    type="button"
                    onClick={() => handleYearFilterChange('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                      currentYearFilter === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    كافة الأعوام
                  </button>
                  {availableAcademicYears.map((yr) => {
                    const isSelected = currentYearFilter === yr; // 🔍 هل هذا العام هو المختار حالياً
                    const isCurrent = yr === getAcademicYear() || yr === '2026-2027'; // 🌟 هل هذا العام هو العام الأكاديمي الحالي
                    return (
                      <button
                        key={yr} // 🔑 مفتاح العام
                        type="button" // 🔘 نوع الزر للنموذج
                        onClick={() => handleYearFilterChange(yr)} // ⚡ تفعيل فلتر هذا العام
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 كحلي ملكي راقٍ للعام المختار
                            : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // ⚪ مظهر ناصع ومريح للعام غير المختار
                        }`}
                      >
                        <span>{formatAcademicYearDisplay(yr)}</span> {/* 📅 اسم العام الدراسي */}
                        {isCurrent && ( // 🎯 شارة العام الحالي بأيقونة SVG فيكتور واضحة وبدون أي برتقالي
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black border transition-all flex items-center gap-1 shadow-2xs ${
                            isSelected
                              ? 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40' // 🌟 كحلي وسماوي ناصع فخم
                              : 'bg-blue-50 text-[#0F2942] border-blue-200' // 💎 أزرق ملكي واضح جداً وعالي التباين
                          }`}>
                            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-[#0F2942]'}`} /> {/* ✨ أيقونة SVG فيكتور ناصعة */}
                            <span>الحالي</span> {/* 🏷️ كلمة الحالي واضحة وبارزة بخط عريض */}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🎓 1. تبويب المرحلة الدراسية */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs shrink-0"> {/* 🏷️ كبسولة تبويبات المرحلة */}
                <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم المرحلة */}
                  <GraduationCap className="w-4 h-4 text-[#0F2942]" /> {/* 🎓 أيقونة قبعة التخرج */}
                  <span>المرحلة:</span> {/* 📝 نص عنوان المرحلة */}
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap"> {/* 🔘 حاوية أزرار المراحل الأفقية دون انكسار */}
                  {/* زر كافة المراحل */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceStage('all')} // ⚡ تفعيل خيار كافة المراحل
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStage === 'all' // 🔍 فحص هل كافة المراحل مختارة حالياً
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر هادئ غير نشط
                    }`}
                  >
                    <span>كافة المراحل</span> {/* 📝 نص الزر */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStage === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 تمييز بادج العداد
                    }`}>
                      {deptStudents.length} {/* 🔢 إجمالي عدد طلبة القسم */}
                    </span>
                  </button>

                  {/* أزرار المراحل الدراسية من الأولى إلى الرابعة */}
                  {[1, 2, 3, 4].map((stg) => { // 🔄 تكرار المراحل الأربعة
                    const stgCount = deptStudents.filter((s) => (s.stage_number || 1) === stg).length; // 🔢 حساب عدد طلبة هذه المرحلة
                    const stgLabel = stg === 1 ? 'المرحلة الأولى' : stg === 2 ? 'المرحلة الثانية' : stg === 3 ? 'المرحلة الثالثة' : 'المرحلة الرابعة'; // 🏷️ اسم المرحلة
                    return (
                      <button
                        key={stg} // 🔑 مفتاح الزر
                        type="button" // 🔘 نوع الزر
                        onClick={() => setFilterAttendanceStage(stg)} // ⚡ تحديد المرحلة عند الضغط
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          filterAttendanceStage === stg // 🔍 فحص هل المرحلة مختارة حالياً
                            ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                            : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر هادئ غير نشط
                        }`}
                      >
                        <span>{stgLabel}</span> {/* 📝 نص اسم المرحلة */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          filterAttendanceStage === stg // 🔍 تلوين البادج حسب حالة التحديد
                            ? 'bg-white/20 text-white border-white/30' // 🎨 بادج النشط
                            : stgCount > 0 // 🔍 إذا بيها طلبة
                            ? 'bg-blue-50 text-blue-950 border-blue-200' // 🎨 أزرق خفيف
                            : 'bg-slate-100 text-slate-600 border-slate-300' // 🎨 رمادي
                        }`}>
                          {stgCount} {/* 🔢 عرض عدد الطلبة */}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📚 2. تبويب الكورس الدراسي (الفصل) */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs shrink-0"> {/* 🏷️ كبسولة تبويبات الكورس */}
                <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم الكورس */}
                  <Layers className="w-4 h-4 text-[#0F2942]" /> {/* 📚 أيقونة طبقات الفصول */}
                  <span>الكورس:</span> {/* 📝 نص عنوان الكورس */}
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap"> {/* 🔘 حاوية أزرار الكورس الأفقية */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceSemester('all')} // ⚡ تفعيل كافة الكورسات
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 'all' // 🔍 فحص خيار الكل
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    كافة الكورسات {/* 📝 نص كافة الكورسات */}
                  </button>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceSemester(1)} // ⚡ اختيار الكورس الأول
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 1 // 🔍 فحص هل الأول مختار
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    الكورس الأول {/* 📝 نص الكورس الأول */}
                  </button>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceSemester(2)} // ⚡ اختيار الكورس الثاني
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 2 // 🔍 فحص هل الثاني مختار
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    الكورس الثاني {/* 📝 نص الكورس الثاني */}
                  </button>
                </div>
              </div>

              {/* ☀️🌙 3. تبويب الفترة الدراسية (الصباحي / المسائي) */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs shrink-0"> {/* 🏷️ كبسولة تبويبات الفترة */}
                <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم الفترة */}
                  <Clock className="w-4 h-4 text-[#0F2942]" /> {/* 🕒 أيقونة ساعة الفترة */}
                  <span>الفترة:</span> {/* 📝 نص عنوان الفترة */}
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap"> {/* 🔘 حاوية أزرار الفترة الأفقية */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceStudyType('all')} // ⚡ تفعيل كافة الفترات
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'all' // 🔍 فحص هل الكل مختار
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    <span>كافة الفترات</span> {/* 📝 نص كافة الفترات */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 تلوين البادج
                    }`}>
                      {deptStudents.filter((s) => filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage).length} {/* 🔢 إجمالي طلبة المرحلة المختارة */}
                    </span>
                  </button>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceStudyType('morning')} // ⚡ تفعيل الفترة الصباحية
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'morning' // 🔍 فحص اختيار الصباحي
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> {/* ☀️ أيقونة الشمس للصباحي */}
                    <span>الصباحي</span> {/* 📝 نص الصباحي */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'morning' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 بادج عداد الصباحي
                    }`}>
                      {deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && (s.study_type || 'morning') === 'morning').length} {/* 🔢 عدد طلبة الصباحي */}
                    </span>
                  </button>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => setFilterAttendanceStudyType('evening')} // ⚡ تفعيل الفترة المسائية
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'evening' // 🔍 فحص اختيار المسائي
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> {/* 🌙 أيقونة الهلال للمسائي */}
                    <span>المسائي</span> {/* 📝 نص المسائي */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'evening' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 بادج عداد المسائي
                    }`}>
                      {deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && s.study_type === 'evening').length} {/* 🔢 عدد طلبة المسائي */}
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* 📍 السطر الثاني: التخصيص التفصيلي (الكروب ⬅️ الكورس (المادة) ⬅️ الأسابيع) */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3 border-t border-slate-200/80"> {/* 🔄 صف التخصيص الدقيق المتجاوب */}
              
              {/* 👥 4. تبويب الكروب (المجموعات والشعب) */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs shrink-0"> {/* 🏷️ كبسولة تبويبات الكروب */}
                <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم الكروب */}
                  <GroupAttendanceSvg className="w-4 h-4 text-[#0F2942]" /> {/* 👥 أيقونة الكروبات الرسمية */}
                  <span>الكروب:</span> {/* 📝 نص عنوان الكروب */}
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap"> {/* 🔘 حاوية أزرار الكروبات الأفقية */}
                  {/* زر كافة الكروبات */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => handleGroupFilterChange('all')} // ⚡ تفعيل كافة الكروبات
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      currentGroupFilter === 'all' // 🔍 فحص هل كافة الكروبات مختارة
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    <span>كافة الكروبات</span> {/* 📝 نص كافة الكروبات */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      currentGroupFilter === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 تلوين البادج
                    }`}>
                      {deptStudents.filter((s) => filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage).length} {/* 🔢 عدد الطلبة الكلي */}
                    </span>
                  </button>

                  {/* زر شعبة موحدة */}
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => handleGroupFilterChange('unassigned')} // ⚡ اختيار شعبة موحدة
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      currentGroupFilter === 'unassigned' // 🔍 فحص اختيار شعبة موحدة
                        ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر غير نشط
                    }`}
                  >
                    <span>شعبة موحدة</span> {/* 📝 نص شعبة موحدة */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      currentGroupFilter === 'unassigned' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-800 border-slate-300' // 🎨 تلوين البادج
                    }`}>
                      {deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && !s.student_group).length} {/* 🔢 عدد طلبة الشعبة الموحدة */}
                    </span>
                  </button>

                  {/* أزرار الكروبات المتوفرة مثل كروب A, كروب B... */}
                  {availableGroups.map((grpName) => { // 🔄 تكرار الكروبات الفعلية
                    const grpCount = deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && s.student_group === grpName).length; // 🔢 عدد طلبة الكروب
                    return (
                      <button
                        key={grpName} // 🔑 مفتاح الكروب
                        type="button" // 🔘 نوع الزر
                        onClick={() => handleGroupFilterChange(grpName)} // ⚡ تحديد هذا الكروب
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          currentGroupFilter === grpName // 🔍 فحص هل هذا الكروب هو النشط
                            ? 'bg-[#0F2942] text-white shadow-xs ring-2 ring-cyan-400/40' // 🎨 كحلي ملكي مع حلقة سماوية
                            : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر هادئ
                        }`}
                      >
                        <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300" /> {/* 🏷️ بادج الكروب الصغير */}
                        <span>كروب {grpName}</span> {/* 📝 اسم الكروب */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          currentGroupFilter === grpName // 🔍 تلوين العداد
                            ? 'bg-white/20 text-white border-white/30' // 🎨 نشط
                            : grpCount > 0 // 🔍 غير فارغ
                            ? 'bg-blue-50 text-blue-950 border-blue-200' // 🎨 أزرق هادئ
                            : 'bg-slate-100 text-slate-600 border-slate-300' // 🎨 رمادي
                        }`}>
                          {grpCount} {/* 🔢 عدد طلبة هذا الكروب */}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📖 5. تبويب الكورس (المادة الدراسية المخصصة) */}
              <div className="relative shrink-0"> {/* 📦 حاوية منسدلة المادة الدراسية كبسولية */}
                <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs"> {/* 🏷️ إطار كبسولة المادة المتناسق */}
                  <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم المادة */}
                    <BookOpen className="w-4 h-4 text-[#0F2942]" /> {/* 📖 أيقونة الكتاب للمادة */}
                    <span>المادة:</span> {/* 📝 نص عنوان المادة */}
                  </span>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => { // ⚡ فتح أو إغلاق منسدلة المواد
                      setIsAttendanceCourseDropdownOpen(!isAttendanceCourseDropdownOpen); // 🔄 تبديل الحالة
                      setIsAttendanceWeekDropdownOpen(false); // 🔒 إغلاق منسدلة الأسابيع
                      setIsAttendanceStatusDropdownOpen(false); // 🔒 إغلاق منسدلة الحالات
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-xs ${
                      filterAttendanceCourse !== 'all' // 🔍 هل تم اختيار مادة معينة
                        ? 'bg-[#0F2942] text-white ring-2 ring-cyan-400/40' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر هادئ
                    }`}
                  >
                    <span className="max-w-[200px] truncate"> {/* ✂️ قص النص إذا كان طويلاً */}
                      {filterAttendanceCourse === 'all' // 🔍 إذا الكل مختار
                        ? `كافة المواد (${deptCourses.filter((c) => { // 🔢 احتساب عدد المواد المفلترة
                            if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false; // 🚫 استبعاد مرحلة أخرى
                            if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false; // 🚫 استبعاد كورس آخر
                            return true; // ✅ مطابقة المادة
                          }).length} مادة)`
                        : deptCourses.find((c) => c.id === filterAttendanceCourse)?.name || 'اختر المادة'} {/* 🏷️ اسم المادة المختارة */}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAttendanceCourseDropdownOpen ? 'rotate-180' : ''} ${filterAttendanceCourse !== 'all' ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔽 سهم المنسدلة */}
                  </button>
                </div>

                {/* 📋 القائمة المنسدلة لاختيار المادة الدراسية */}
                {isAttendanceCourseDropdownOpen && ( // 🔍 إظهار القائمة فقط عند الفتح
                  <>
                    <div
                      className="fixed inset-0 z-20" // 🛡️ طبقة خلفية للنقر خارج القائمة
                      onClick={() => setIsAttendanceCourseDropdownOpen(false)} // ⚡ إغلاق القائمة عند النقر خارجها
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-80 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1"> {/* 📦 صندوق القائمة المنسدلة */}
                      <button
                        type="button" // 🔘 نوع الزر
                        onClick={() => { // ⚡ اختيار كافة المواد
                          setFilterAttendanceCourse('all'); // 🔄 تعيين الكل
                          setIsAttendanceCourseDropdownOpen(false); // 🔒 إغلاق القائمة
                        }}
                        className={`w-full p-2.5 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                          filterAttendanceCourse === 'all' // 🔍 هل الكل مختار
                            ? 'bg-[#0F2942] text-white' // 🎨 نشط
                            : 'text-slate-950 hover:bg-slate-100' // 🎨 غير نشط
                        }`}
                      >
                        <span>كافة مواد القسم ({deptCourses.length} مادة)</span> {/* 📝 نص كافة المواد */}
                        {filterAttendanceCourse === 'all' && <Check className="w-4 h-4 text-cyan-300" />} {/* ✔️ علامة الصح للنشط */}
                      </button>

                      {/* قائمة المواد المفلترة حسب المرحلة والكورس المختارين */}
                      {deptCourses
                        .filter((c) => { // 🔍 تصفية المواد حسب المعايير المختارة
                          if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false; // 🚫 تصفية المرحلة
                          if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false; // 🚫 تصفية الكورس
                          return true; // ✅ إضافة المادة
                        })
                        .map((c) => ( // 🔄 رسم أزرار المواد
                          <button
                            key={c.id} // 🔑 معرف المادة
                            type="button" // 🔘 نوع الزر
                            onClick={() => { // ⚡ اختيار المادة المحددة
                              setFilterAttendanceCourse(c.id); // 🔄 تعيين معرف المادة
                              setIsAttendanceCourseDropdownOpen(false); // 🔒 إغلاق القائمة
                            }}
                            className={`w-full p-2.5 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                              filterAttendanceCourse === c.id // 🔍 هل هي المادة المختارة
                                ? 'bg-[#0F2942] text-white' // 🎨 نشط
                                : 'text-slate-950 hover:bg-slate-100' // 🎨 غير نشط
                            }`}
                          >
                            <span className="truncate"> {/* ✂️ قص الاسم عند الضرورة */}
                              {c.name} ({c.code}) — المرحلة {getStageNameInArabic(c.stage_number || 1)} (الكورس {c.semester === 2 ? 'الثاني' : 'الأول'}) {/* 🏷️ تفاصيل المادة الكاملة */}
                            </span>
                            {filterAttendanceCourse === c.id && <Check className="w-4 h-4 text-cyan-300 shrink-0" />} {/* ✔️ علامة الصح للمادة النشطة */}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* 🗓️ 6. تبويب الأسابيع الدراسية (1 إلى 15) لمسار بولونيا */}
              <div className="relative shrink-0"> {/* 📦 حاوية منسدلة الأسابيع الدراسية */}
                <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-2 shadow-2xs"> {/* 🏷️ إطار كبسولة الأسابيع المتناسق */}
                  <span className="px-2.5 py-1 text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 shrink-0 select-none"> {/* 📌 عنوان قسم الأسابيع */}
                    <CalendarDays className="w-4 h-4 text-[#0F2942]" /> {/* 🗓️ أيقونة التقويم للأسبوع */}
                    <span>الأسابيع:</span> {/* 📝 نص عنوان الأسابيع */}
                  </span>
                  <button
                    type="button" // 🔘 نوع الزر
                    onClick={() => { // ⚡ فتح أو إغلاق منسدلة الأسابيع
                      setIsAttendanceWeekDropdownOpen(!isAttendanceWeekDropdownOpen); // 🔄 تبديل الحالة
                      setIsAttendanceCourseDropdownOpen(false); // 🔒 إغلاق منسدلة المواد
                      setIsAttendanceStatusDropdownOpen(false); // 🔒 إغلاق منسدلة الحالات
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-xs ${
                      filterAttendanceWeek !== 'all' // 🔍 هل تم اختيار أسبوع محدد
                        ? 'bg-[#0F2942] text-white ring-2 ring-cyan-400/40' // 🎨 مظهر نشط كحلي ملكي
                        : 'bg-white text-slate-900 hover:bg-slate-200/80 border border-slate-200' // 🎨 مظهر هادئ
                    }`}
                  >
                    <span>
                      {filterAttendanceWeek === 'all' // 🔍 هل كافة الأسابيع مختارة
                        ? 'كافة الأسابيع (1 - 15)' // 📝 نص الكل
                        : (() => { // 📅 دالة فورية لحساب تاريخ واسم الأسبوع المحدد
                            const baseD = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ بدء الفصل الأكاديمي
                            const baseDayKey = getDayOfWeekFromDateString(baseD); // 🗓️ اليوم الأكاديمي المعتمد
                            const weekDate = calculateDateForAnyDayInWeek(baseD, 1, filterAttendanceWeek, baseDayKey); // 📅 تاريخ الأسبوع
                            return `الأسبوع ${filterAttendanceWeek} (${formatDateArabicWithDay(weekDate)})`; // 🏷️ نص الأسبوع وتاريخه
                          })()}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAttendanceWeekDropdownOpen ? 'rotate-180' : ''} ${filterAttendanceWeek !== 'all' ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔽 سهم المنسدلة */}
                  </button>
                </div>

                {/* 📋 القائمة المنسدلة للأسابيع الـ 15 */}
                {isAttendanceWeekDropdownOpen && ( // 🔍 إظهار القائمة فقط عند فتحها
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsAttendanceWeekDropdownOpen(false)} /> {/* 🛡️ طبقة إغلاق خارجية */}
                    <div className="absolute right-0 top-full mt-1.5 w-72 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1"> {/* 📦 صندوق منسدلة الأسابيع */}
                      <button
                        type="button" // 🔘 نوع الزر
                        onClick={() => { // ⚡ اختيار كافة الأسابيع
                          setFilterAttendanceWeek('all'); // 🔄 تعيين كافة الأسابيع
                          setIsAttendanceWeekDropdownOpen(false); // 🔒 إغلاق القائمة
                        }}
                        className={`w-full p-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                          filterAttendanceWeek === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100' // 🎨 تلوين النشط
                        }`}
                      >
                        <span>كافة الأسابيع (1 - 15)</span> {/* 📝 نص كافة الأسابيع */}
                        {filterAttendanceWeek === 'all' && <Check className="w-3.5 h-3.5 text-cyan-300" />} {/* ✔️ علامة الصح */}
                      </button>
                      {/* تكرار الأسابيع من 1 إلى 15 لمسار بولونيا */}
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => { // 🔄 تكرار 15 أسبوعاً
                        const isSel = filterAttendanceWeek === wNum; // 🔍 هل هذا الأسبوع هو المختار
                        const isCurr = scheduleCurrentAcademicWeek === wNum; // 🔍 هل هو الأسبوع الأكاديمي الجاري
                        const baseD = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ البداية
                        const baseDayKey = getDayOfWeekFromDateString(baseD); // 🗓️ اليوم المعتمد
                        const weekD = calculateDateForAnyDayInWeek(baseD, 1, wNum, baseDayKey); // 📅 تاريخ الأسبوع
                        const p = weekD.split('-'); // ✂️ تقسيم أجزاء التاريخ
                        const dNum = p.length === 3 ? parseInt(p[2], 10) : ''; // 🔢 رقم اليوم
                        const mName = p.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || '') : ''; // 🏷️ اسم الشهر بالعراقية

                        return (
                          <button
                            key={wNum} // 🔑 رقم الأسبوع
                            type="button" // 🔘 نوع الزر
                            onClick={() => { // ⚡ تحديد هذا الأسبوع
                              setFilterAttendanceWeek(wNum); // 🔄 تعيين رقم الأسبوع
                              setIsAttendanceWeekDropdownOpen(false); // 🔒 إغلاق القائمة
                            }}
                            className={`w-full p-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100' // 🎨 تلوين الزر
                            }`}
                          >
                            <div className="flex items-center gap-1.5"> {/* 🏷️ تفاصيل الأسبوع */}
                              <span>الأسبوع {wNum}</span> {/* 📝 رقم الأسبوع */}
                              <span className={`text-[11px] ${isSel ? 'text-cyan-200' : 'text-slate-500'}`}> {/* 📅 تاريخ الأسبوع الهادئ */}
                                ({dNum} {mName})
                              </span>
                              {isCurr && ( // 🌟 بادج الأسبوع الجاري
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                  isSel ? 'bg-cyan-400 text-slate-950' : 'bg-emerald-100 text-emerald-900 border border-emerald-300' // 🎨 تمييز الأسبوع الحالي
                                }`}>
                                  الحالي
                                </span>
                              )}
                            </div>
                            {isSel && <Check className="w-3.5 h-3.5 text-cyan-300" />} {/* ✔️ علامة الصح للنشط */}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* 📍 السطر الثالث: أدوات البحث اللحظي + تصفية حالات الإنذار + زر التحديث والمزامنة */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/80"> {/* 🔄 شريط البحث والإنذار المتجاوب */}
              
              {/* 🔍 حقل البحث اللحظي باسم الطالب */}
              <div className="flex-1 min-w-[260px] relative"> {/* 📦 حاوية حقل البحث المرنة */}
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" /> {/* 🔍 أيقونة البحث */}
                <input
                  type="text" // ✍️ نوع الحقل نصي
                  value={attendanceSearch} // 📌 قيمة البحث الحالية
                  onChange={(e) => setAttendanceSearch(e.target.value)} // ⚡ تحديث نص البحث لحظياً
                  placeholder="بحث فوري باسم الطالب..." // 💡 النص الإرشادي
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm sm:text-base font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 transition-all" // 🎨 تصميم أنيق للحقل
                />
              </div>

              {/* ⚠️ تصفية حالة الإنذار الأكاديمي */}
              <div className="w-full sm:w-72 relative"> {/* 📦 حاوية منسدلة حالات الإنذار */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => { // ⚡ فتح أو إغلاق منسدلة الإنذارات
                    setIsAttendanceStatusDropdownOpen(!isAttendanceStatusDropdownOpen); // 🔄 تبديل الحالة
                    setIsAttendanceCourseDropdownOpen(false); // 🔒 إغلاق منسدلة المواد
                    setIsAttendanceWeekDropdownOpen(false); // 🔒 إغلاق منسدلة الأسابيع
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-sm sm:text-base font-black text-slate-950 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs" // 🎨 مظهر زر المنسدلة
                >
                  <div className="flex items-center gap-2 truncate"> {/* 🏷️ أيقونة ونص الحالة المختارة */}
                    {filterAttendanceStatus === 'safe' ? ( // 🔍 حالة الوضع آمن
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> // ✅ أيقونة الوضع الآمن
                    ) : filterAttendanceStatus === 'warning_1' ? ( // 🔍 حالة الإنذار الأولي
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" /> // ⚠️ أيقونة الإنذار الأولي
                    ) : filterAttendanceStatus === 'warning_2' ? ( // 🔍 حالة الإنذار النهائي
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> // 🛑 أيقونة الإنذار النهائي
                    ) : filterAttendanceStatus === 'banned' ? ( // 🔍 حالة تجاوز الحرمان
                      <Ban className="w-4 h-4 text-red-600 shrink-0" /> // 🚫 أيقونة الحرمان
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" /> // 🛡️ أيقونة الدرع لكافة الحالات
                    )}
                    <span className="truncate"> {/* ✂️ نص الحالة */}
                      {filterAttendanceStatus === 'all' // 🔍 فحص الحالة الحالية
                        ? 'كافة حالات الحضور والإنذار' // 📝 الكل
                        : filterAttendanceStatus === 'safe' // 🔍 آمن
                        ? 'الوضع آمن (أقل من 5%)' // 📝 آمن
                        : filterAttendanceStatus === 'warning_1' // 🔍 إنذار 1
                        ? 'إنذار أولي (5% - 6.9%)' // 📝 إنذار أول
                        : filterAttendanceStatus === 'warning_2' // 🔍 إنذار 2
                        ? 'إنذار نهائي (7% - 9.9%)' // 📝 إنذار نهائي
                        : 'تجاوز الحرمان (10%+)'} {/* 📝 حرمان */}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isAttendanceStatusDropdownOpen ? 'rotate-180' : ''}`} /> {/* 🔽 سهم المنسدلة */}
                </button>

                {/* 📋 القائمة المنسدلة لحالات الإنذار الأكاديمي */}
                {isAttendanceStatusDropdownOpen && ( // 🔍 إظهار عند الفتح فقط
                  <>
                    <div
                      className="fixed inset-0 z-20" // 🛡️ طبقة إغلاق خارجية
                      onClick={() => setIsAttendanceStatusDropdownOpen(false)} // ⚡ إغلاق القائمة
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1"> {/* 📦 صندوق القائمة */}
                      {[ // 📋 مصفوفة خيارات الإنذار الخمسة
                        { val: 'all', label: 'كافة حالات الحضور والإنذار', icon: <ShieldCheck className="w-4 h-4 text-blue-600" /> }, // 🛡️ الكل
                        { val: 'safe', label: 'الوضع آمن (أقل من 5%)', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> }, // ✅ آمن
                        { val: 'warning_1', label: 'إنذار أولي (5% - 6.9%)', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> }, // ⚠️ أولي
                        { val: 'warning_2', label: 'إنذار نهائي (7% - 9.9%)', icon: <AlertCircle className="w-4 h-4 text-rose-600" /> }, // 🛑 نهائي
                        { val: 'banned', label: 'تجاوز الحرمان (10%+)', icon: <Ban className="w-4 h-4 text-red-600" /> }, // 🚫 حرمان
                      ].map((item) => ( // 🔄 رسم خيارات القائمة
                        <button
                          key={item.val} // 🔑 قيمة الخيار
                          type="button" // 🔘 نوع الزر
                          onClick={() => { // ⚡ تفعيل خيار الإنذار المحدد
                            setFilterAttendanceStatus(item.val as AttendanceWarningStatus | 'all'); // 🔄 تعيين الحالة
                            setIsAttendanceStatusDropdownOpen(false); // 🔒 إغلاق القائمة
                          }}
                          className={`w-full p-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer ${
                            filterAttendanceStatus === item.val // 🔍 هل هذا الخيار هو النشط
                              ? 'bg-[#0F2942] text-white' // 🎨 نشط
                              : 'text-slate-950 hover:bg-slate-100' // 🎨 غير نشط
                          }`}
                        >
                          <div className="flex items-center gap-2"> {/* 🏷️ أيقونة واسم الحالة */}
                            {item.icon} {/* 🎨 أيقونة الحالة */}
                            <span>{item.label}</span> {/* 📝 نص الحالة */}
                          </div>
                          {filterAttendanceStatus === item.val && <Check className="w-4 h-4 text-cyan-300" />} {/* ✔️ علامة الصح للنشط */}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 🔄 زر المزامنة السحابية الحية لحظياً */}
              <div className="shrink-0"> {/* 📦 حاوية زر التحديث */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={async () => { // ⚡ دالة المزامنة عند النقر
                    setIsSyncingAttendance(true); // ⏳ بدء حالة التحميل
                    const freshRecords = await syncAttendanceRecordsFromSupabase(); // ☁️ جلب السجلات الحية من سوبابيس
                    setAttendanceRecords(freshRecords); // 🔄 تحديث السجلات في الواجهة
                    setIsSyncingAttendance(false); // ⏹️ إنهاء حالة التحميل
                    setSuccessMessage('تمت مزامنة سجلات الحضور الحية من السحابة بنجاح! ☁️'); // 💬 إشعار النجاح
                    setTimeout(() => setSuccessMessage(''), 3500); // ⏱️ إخفاء الإشعار بعد 3.5 ثانية
                  }}
                  disabled={isSyncingAttendance} // 🔒 تعطيل الزر أثناء المزامنة
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl border border-slate-300 transition cursor-pointer shadow-2xs flex items-center justify-center disabled:opacity-50" // 🎨 تصميم الزر
                  title="مزامنة وتحديث سجلات الحضور لحظياً من قاعدة البيانات السحابية" // 💡 تلميح المزامنة
                >
                  <RefreshCw className={`w-5 h-5 text-blue-700 ${isSyncingAttendance ? 'animate-spin' : ''}`} /> {/* 🔄 أيقونة التحديث مع دوران تفاعلي */}
                </button>
              </div>

            </div>

          </div>

          {/* 📊 بطاقات إحصائيات الغياب للقسم مع الحساب الديناميكي للتصفية وبدون اللون البرتقالي */}
          {(() => {
            const rankMap: Record<AttendanceWarningStatus, number> = {
              safe: 0,
              warning_1: 1,
              warning_2: 2,
              banned: 3,
            };

            const relevantCoursesForStats = deptCourses.filter((c) => {
              if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false;
              if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false;
              if (filterAttendanceCourse !== 'all' && c.id !== filterAttendanceCourse) return false;
              return true;
            });

            const activeStudentsForStats = deptStudents.filter((st) => {
              if (filterAttendanceStage !== 'all' && (st.stage_number || 1) !== filterAttendanceStage) return false;
              if (filterAttendanceStudyType !== 'all' && (st.study_type || 'morning') !== filterAttendanceStudyType) return false;
              if (currentGroupFilter !== 'all') { // 👥 فحص شرط الكروب للإحصائيات
                if (currentGroupFilter === 'unassigned') { // 🏛️ إذا كانت شعبة عامة
                  if (st.student_group) return false; // 🚫 استبعاد من له كروب
                } else if (st.student_group !== currentGroupFilter) { // 🔠 إذا كان كروب محدد
                  return false; // 🚫 استبعاد من لا يطابق الكروب
                }
              }
              if (attendanceSearch.trim()) {
                const q = attendanceSearch.trim().toLowerCase();
                const matchName = st.full_name.toLowerCase().includes(q);
                const matchNum = (st.university_number || '').toLowerCase().includes(q);
                if (!matchName && !matchNum) return false;
              }
              return true;
            });

            let safeCount = 0;
            let warn1Count = 0;
            let warn2Count = 0;
            let bannedCount = 0;

            for (const st of activeStudentsForStats) {
              let highestRank = 0;
              let worstStatus: AttendanceWarningStatus = 'safe';

              // 📅 السجلات الفعالة المصفاة بدقة بحسب الأسبوع والكورس والمرحلة والعام الدراسي المعتمد
              const effectiveRecordsForStats = attendanceRecords.filter((r) => {
                if (filterAttendanceWeek !== 'all' && r.week_number !== filterAttendanceWeek) return false;
                if (filterAttendanceSemester !== 'all' && r.semester && r.semester !== filterAttendanceSemester) return false;
                if (filterAttendanceStage !== 'all' && r.stage_number && r.stage_number !== filterAttendanceStage) return false;
                if (currentYearFilter !== 'all' && r.academic_year_id && r.academic_year_id !== currentYearFilter && !currentYearFilter.includes(r.academic_year_id)) return false;
                return true;
              });

              for (const c of relevantCoursesForStats) {
                const s = calculateStudentCourseAttendance(st.id, c.id, effectiveRecordsForStats, c.name, c.code, c.credit_hours || 3);
                const currentRank = rankMap[s.warning_status] || 0;
                if (currentRank > highestRank) {
                  highestRank = currentRank;
                  worstStatus = s.warning_status;
                }
              }

              if (worstStatus === 'banned') bannedCount++;
              else if (worstStatus === 'warning_2') warn2Count++;
              else if (worstStatus === 'warning_1') warn1Count++;
              else safeCount++;
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
                  <div className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>الوضع آمن (أقل من 5%)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5">{safeCount} طالب</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-300 bg-slate-50/60 shadow-sm">
                  <div className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-slate-700 shrink-0" />
                    <span>إنذار أولي (5% - 6.9%)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{warn1Count} طالب</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm">
                  <div className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>إنذار نهائي (7% - 9.9%)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-800 mt-1.5">{warn2Count} طالب</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-red-300 bg-red-50/40 shadow-sm">
                  <div className="text-sm sm:text-base font-black text-red-950 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-600 shrink-0" />
                    <span>تجاوز الحرمان (10%+)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-800 mt-1.5">{bannedCount} طالب</div>
                </div>
              </div>
            );
          })()}

              {/* 📋 جدول طلاب القسم مع تفاصيل الحضور والإنذارات المحدثة ونظام التحديد */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            {(() => {
              const rankMap: Record<AttendanceWarningStatus, number> = {
                safe: 0,
                warning_1: 1,
                warning_2: 2,
                banned: 3,
              };

              const relevantCoursesForTable = deptCourses.filter((c) => {
                if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false;
                if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false;
                if (filterAttendanceCourse !== 'all' && c.id !== filterAttendanceCourse) return false;
                return true;
              });

              const filteredStudents = deptStudents
                .filter((st) => {
                  if (filterAttendanceStage !== 'all' && (st.stage_number || 1) !== filterAttendanceStage) return false;
                  if (filterAttendanceStudyType !== 'all' && (st.study_type || 'morning') !== filterAttendanceStudyType) return false;
                  if (currentGroupFilter !== 'all') { // 👥 تصفية جدول الطلاب حسب الكروب المحدد
                    if (currentGroupFilter === 'unassigned') { // 🏛️ شعبة عامة فقط
                      if (st.student_group) return false; // 🚫 استبعاد من يمتلك كروب
                    } else if (st.student_group !== currentGroupFilter) { // 🔠 كروب مخصص مثل A أو B
                      return false; // 🚫 استبعاد من لا ينتمي لهذا الكروب
                    }
                  }
                  if (attendanceSearch.trim()) {
                    const q = attendanceSearch.trim().toLowerCase();
                    const matchName = st.full_name.toLowerCase().includes(q);
                    const matchNum = (st.university_number || '').toLowerCase().includes(q);
                    if (!matchName && !matchNum) return false;
                  }
                  return true;
                })
                .map((st) => {
                  let highestRank = 0; // 🔢 أعلى رتبة إنذار للطالب
                  let worstStatus: AttendanceWarningStatus = 'safe'; // 🛡️ أسوأ حالة إنذار مسجلة
                  let totalPresent = 0; // 🟢 إجمالي ساعات الحضور الفعلي
                  let totalExcused = 0; // 🔵 إجمالي ساعات الإجازة الرسمية
                  let totalHoliday = 0; // 🏖️ إجمالي ساعات العطل الرسمية
                  let totalUnexcused = 0; // 🔴 إجمالي ساعات الغياب غير المبرر

                  // 📅 السجلات الفعالة المصفاة بدقة بحسب الأسبوع والكورس والمرحلة والعام الدراسي المعتمد
                  const effectiveRecordsForTable = attendanceRecords.filter((r) => {
                    if (filterAttendanceWeek !== 'all' && r.week_number !== filterAttendanceWeek) return false;
                    if (filterAttendanceSemester !== 'all' && r.semester && r.semester !== filterAttendanceSemester) return false;
                    if (filterAttendanceStage !== 'all' && r.stage_number && r.stage_number !== filterAttendanceStage) return false;
                    if (currentYearFilter !== 'all' && r.academic_year_id && r.academic_year_id !== currentYearFilter && !currentYearFilter.includes(r.academic_year_id)) return false;
                    return true;
                  });

                  // 🔄 احتساب غيابات وساعات كافة المواد المشمولة بالجدول
                  for (const c of relevantCoursesForTable) {
                    const s = calculateStudentCourseAttendance(st.id, c.id, effectiveRecordsForTable, c.name, c.code, c.credit_hours || 3);
                    totalPresent += s.total_present_hours || 0; // 🟢 تجميع ساعات الحضور بأمان
                    totalExcused += s.total_excused_absence_hours || 0; // 🔵 تجميع ساعات الإجازة بأمان
                    totalHoliday += s.total_holiday_hours || 0; // 🏖️ تجميع ساعات العطلة بأمان
                    totalUnexcused += s.total_unexcused_absence_hours || 0; // 🔴 تجميع ساعات الغياب بأمان
                    const currentRank = rankMap[s.warning_status] || 0;
                    if (currentRank > highestRank) {
                      highestRank = currentRank;
                      worstStatus = s.warning_status;
                    }
                  }

                  return {
                    student: st, // 🎓 بروفايل الطالب
                    worstStatus, // 🛡️ الحالة الأكاديمية الأسوأ
                    totalPresent, // 🟢 ساعات الحضور
                    totalExcused, // 🔵 ساعات الإجازة
                    totalHoliday, // 🏖️ ساعات العطلة
                    totalUnexcused, // 🔴 ساعات الغياب
                    badge: getAttendanceWarningBadgeMeta(worstStatus), // 🏷️ بيانات بادج الإنذار
                  };
                })
                .filter((item) => {
                  if (filterAttendanceStatus === 'all') return true;
                  return item.worstStatus === filterAttendanceStatus;
                });

              const allFilteredIds = filteredStudents.map((item) => item.student.id);
              const isAllFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedAttendanceStudentIds.includes(id));

              return (
                <div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[1100px]">
                  {/* 📋 رأس الجدول مع مربع تحديد الكل والأعمدة المنفصلة بوضوح ودقة وفق ترتيب المستخدم */}
                  <div className="grid grid-cols-[48px_minmax(140px,1.8fr)_minmax(80px,1fr)_minmax(75px,0.9fr)_minmax(85px,1fr)_minmax(105px,1.2fr)_minmax(110px,1.2fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(140px,1.5fr)] bg-slate-100 text-black border-b border-slate-200 text-xs sm:text-sm font-black p-3.5 text-center items-center">
                    {/* 🔢 تحديد الكل وتسلسل الطالب */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllFilteredSelected) {
                            setSelectedAttendanceStudentIds(selectedAttendanceStudentIds.filter((id) => !allFilteredIds.includes(id)));
                          } else {
                            setSelectedAttendanceStudentIds(Array.from(new Set([...selectedAttendanceStudentIds, ...allFilteredIds])));
                          }
                        }}
                        className="cursor-pointer text-black hover:text-slate-800 transition"
                        title={isAllFilteredSelected ? 'إلغاء تحديد الكل' : 'تحديد كافة طلاب الجدول'}
                      >
                        {isAllFilteredSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-black" />
                        )}
                      </button>
                      <span className="font-mono text-sm text-black">#</span>
                    </div>

                    {/* 👤 اسم الطالب */}
                    <div className="text-right pr-2 text-black">اسم الطالب</div>
                    {/* 🎓 1. المرحلة */}
                    <div className="text-black">المرحلة</div>
                    {/* 👥 2. الكروب */}
                    <div className="text-black">الكروب</div>
                    {/* ☀️ 3. الفترة */}
                    <div className="text-black">الفترة</div>
                    {/* 📚 4. الكورس */}
                    <div className="text-black">الكورس</div>
                    {/* 🛡️ الموقف الأكاديمي */}
                    <div className="text-black">الموقف</div>
                    {/* 🟢 ساعات الحضور */}
                    <div className="text-black">ساعات الحضور</div>
                    {/* 🔵 ساعات الإجازة */}
                    <div className="text-black">ساعات الإجازة</div>
                    {/* 🏖️ ساعات العطلة */}
                    <div className="text-black">ساعات العطلة</div>
                    {/* 🔴 ساعات الغياب */}
                    <div className="text-black">ساعات الغياب</div>
                    {/* ⚡ الإجراءات */}
                    <div className="text-black">الإجراءات</div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-black font-black space-y-2">
                      <ClipboardList className="w-12 h-12 text-black mx-auto" />
                      <p className="text-base text-black font-black">لا يوجد طلاب يطابقون معايير التصفية والبحث المحددة حالياً.</p>
                      <p className="text-xs text-black font-bold">جرب تعديل المرحلة أو الكورس أو الفترة الدراسية لرؤية النتائج.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {(() => {
                        // 🔢 نحسب رقم الصفحة الآمن لسجل الحضور حتى نتجنب تجاوز الحدود
                        const safeAttendancePage = Math.max(1, Math.min(attendancePage, Math.max(1, Math.ceil(filteredStudents.length / attendancePageSize))));
                        // ✂️ نقص مصفوفة الطلاب حسب الصفحة وحجم الصفحة المختار
                        const paginatedAttendanceStudents = filteredStudents.slice((safeAttendancePage - 1) * attendancePageSize, safeAttendancePage * attendancePageSize);

                        // 🔄 نعمل خريطة لعرض الطلاب في الصفحة الحالية
                        return paginatedAttendanceStudents.map(({ student: st, worstStatus, totalPresent, totalExcused, totalHoliday, totalUnexcused, badge }, idx) => {
                          // 🔢 نحسب التسلسل التراكمي الحقيقي للطالب
                          const actualIndex = (safeAttendancePage - 1) * attendancePageSize + idx;
                          // ✅ فحص هل الطالب محدد
                          const isRowSelected = selectedAttendanceStudentIds.includes(st.id);

                          // 🔍 استخراج الكورس المسجل به غياب للطالب أو الكورس الحالي
                          let studentSemesterLabel = 'الكورس الأول';
                          if (filterAttendanceSemester === 1) {
                            studentSemesterLabel = 'الكورس الأول';
                          } else if (filterAttendanceSemester === 2) {
                            studentSemesterLabel = 'الكورس الثاني';
                          } else {
                            const stRecords = attendanceRecords.filter((r) => r.student_id === st.id || r.university_number === st.id);
                            const sem2Absences = stRecords.filter((r) => r.semester === 2 && (r.status === 'absent_unexcused' || r.status === 'absent_excused' || r.status === 'late'));
                            const sem1Absences = stRecords.filter((r) => r.semester === 1 && (r.status === 'absent_unexcused' || r.status === 'absent_excused' || r.status === 'late'));
                            if (sem2Absences.length > 0 && sem1Absences.length === 0) {
                              studentSemesterLabel = 'الكورس الثاني';
                            } else if (sem1Absences.length > 0 && sem2Absences.length === 0) {
                              studentSemesterLabel = 'الكورس الأول';
                            } else if (sem2Absences.length > 0 && sem1Absences.length > 0) {
                              studentSemesterLabel = sem2Absences.length > sem1Absences.length ? 'الكورس الثاني' : 'الكورس الأول';
                            } else {
                              const sem2Count = stRecords.filter((r) => r.semester === 2).length;
                              const sem1Count = stRecords.filter((r) => r.semester === 1).length;
                              studentSemesterLabel = sem2Count > sem1Count ? 'الكورس الثاني' : 'الكورس الأول';
                            }
                          }

                          return (
                            <div
                              key={st.id}
                              className={`grid grid-cols-[48px_minmax(140px,1.8fr)_minmax(80px,1fr)_minmax(75px,0.9fr)_minmax(85px,1fr)_minmax(105px,1.2fr)_minmax(110px,1.2fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(140px,1.5fr)] items-center p-3.5 text-sm sm:text-base font-black transition ${
                                isRowSelected ? 'bg-blue-50/80 border-r-4 border-r-blue-600' : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* 🔢 مربع الاختيار وتسلسل الطالب بالجدول */}
                              <div className="flex items-center justify-center gap-1.5">
                                {/* 🔘 زر تحديد الطالب */}
                                <button
                                  type="button" // 🛑 نوع الزر لمنع الإرسال التلقائي
                                  onClick={() => {
                                    // 🔄 فحص التحديد وإضافة أو حذف معرف الطالب
                                    if (isRowSelected) {
                                      setSelectedAttendanceStudentIds(selectedAttendanceStudentIds.filter((id) => id !== st.id)); // ❌ إلغاء التحديد
                                    } else {
                                      setSelectedAttendanceStudentIds([...selectedAttendanceStudentIds, st.id]); // ✅ تحديد الطالب
                                    }
                                  }}
                                  className="cursor-pointer text-black hover:text-slate-800 transition" // 🎨 أيقونة الاختيار بلون أسود صريح
                                >
                                  {isRowSelected ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" /> // 🟦 مربع محدد بلون أزرق نقي
                                  ) : (
                                    <Square className="w-5 h-5 text-black" /> // ⬛ مربع فارغ بلون أسود واضح
                                  )}
                                </button>
                                {/* 🔢 تسلسل الطالب التراكمي برقم أسود واضح */}
                                <span className="font-mono text-sm font-black text-black">{actualIndex + 1}</span>
                              </div>
                            
                            {/* 👤 اسم الطالب الثلاثي الكامل بلون أسود واضح وبدون أي رماديات */}
                            <div className="text-right pr-2">
                              {/* 📝 اسم الطالب الكامل بخط أسود عريض وبارز */}
                              <h4 className="font-black text-black text-base leading-tight truncate">{st.full_name}</h4>
                            </div>

                            {/* 🎓 1. المرحلة الدراسية بحجم خط أكبر قليلاً وبادج واضح بلون أسود */}
                            <div className="text-center">
                              {/* 🏷️ بادج المرحلة مكبر وواضح بنص أسود صريح */}
                              <span className="px-2.5 py-1 bg-slate-100 text-black border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block whitespace-nowrap shadow-2xs">
                                {getStageNameInArabic(st.stage_number || 1)} {/* 🎓 اسم المرحلة مثل الرابعة */}
                              </span>
                            </div>

                            {/* 👥 2. الكروب الدراسي بحجم أكبر وبادج واضح ولون أسود بدون رمادي */}
                            <div className="text-center">
                              {st.student_group ? (
                                // 🔠 بادج الكروب المخصص مكبر بنص أسود صريح
                                <span className="px-2.5 py-1 bg-blue-50 text-black border border-blue-200 rounded-xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap">
                                  <GroupBadgeSvg className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 🎨 أيقونة الكروب النقية */}
                                  <span className="text-black font-black">{st.student_group}</span> {/* 🔤 حرف الكروب مثل C */}
                                </span>
                              ) : (
                                // 🏛️ في حال الشعبة العامة يظهر النص أسود وليس رمادي
                                <span className="px-2.5 py-1 bg-slate-100 text-black border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block whitespace-nowrap shadow-2xs">
                                  عامة {/* 🏛️ شعبة عامة بلون أسود صريح */}
                                </span>
                              )}
                            </div>

                            {/* ☀️🌙 3. الفترة الدراسية صباحي أو مسائي بنص أسود مكبر وواضح */}
                            <div className="text-center">
                              {/* 🏷️ بادج الفترة بحجم أكبر وأيقونة واضحة ونص أسود */}
                              <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap ${
                                (st.study_type || 'morning') === 'evening'
                                  ? 'bg-blue-50 text-black border-blue-200' // 🌙 مسائي
                                  : 'bg-sky-50 text-black border-sky-200' // ☀️ صباحي
                              }`}>
                                {(st.study_type || 'morning') === 'evening' ? (
                                  <Moon className="w-3.5 h-3.5 text-blue-700 shrink-0" /> // 🌙 أيقونة المسائي
                                ) : (
                                  <Sun className="w-3.5 h-3.5 text-sky-600 shrink-0" /> // ☀️ أيقونة الصباحي
                                )}
                                <span className="text-black font-black">{(st.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span> {/* ☀️ نص الفترة أسود صريح */}
                              </span>
                            </div>

                            {/* 📚 4. الكورس الدراسي بصيغة الكورس الأول أو الثاني بحجم أكبر ونص أسود */}
                            <div className="text-center">
                              {/* 🏷️ بادج الكورس مكبر وواضح بنص أسود صريح */}
                              <span className="px-2.5 py-1 bg-slate-100 text-black border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block whitespace-nowrap shadow-2xs">
                                {studentSemesterLabel} {/* 📚 يظهر الكورس الأول أو الكورس الثاني */}
                              </span>
                            </div>

                            {/* 🛡️ 5. الموقف الأكاديمي للإنذار */}
                            <div className="text-center">
                              {/* 🏷️ بادج حالة الإنذار مع الأيقونة واللون المخصص */}
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-black inline-flex items-center justify-center gap-1 ${badge.badgeClass}`}>
                                {worstStatus === 'safe' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />} {/* 🟢 وضع آمن */}
                                {worstStatus === 'warning_1' && <AlertTriangle className="w-3.5 h-3.5 text-black shrink-0" />} {/* ⚠️ إنذار أولي بنص وأيقونة سوداء */}
                                {worstStatus === 'warning_2' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />} {/* 🛑 إنذار نهائي */}
                                {worstStatus === 'banned' && <Ban className="w-3.5 h-3.5 text-red-600 shrink-0" />} {/* 🚫 تجاوز الحرمان */}
                                <span className="truncate">{badge.label_ar}</span> {/* 🏷️ نص حالة الإنذار */}
                              </span>
                            </div>

                            {/* 6️⃣ ساعات الحضور الفعلي 🟢 */}
                            <div className="text-center">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap" title={`ساعات الحضور: ${totalPresent} ساعة`}>
                                <AttendancePresentSvg className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <strong className="font-mono text-xs text-emerald-900">{totalPresent}</strong>
                                <span className="text-[10px] text-emerald-800">س</span>
                              </span>
                            </div>

                            {/* 7️⃣ ساعات الإجازة الرسمية 🔵 */}
                            <div className="text-center">
                              <span className="px-2 py-1 bg-blue-50 text-blue-950 border border-blue-200 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap" title={`ساعات الإجازة: ${totalExcused} ساعة`}>
                                <AttendanceExcusedSvg className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <strong className="font-mono text-xs text-blue-900">{totalExcused}</strong>
                                <span className="text-[10px] text-blue-800">س</span>
                              </span>
                            </div>

                            {/* 8️⃣ ساعات العطلة الرسمية 🏖️ */}
                            <div className="text-center">
                              <span className="px-2 py-1 bg-sky-50 text-sky-950 border border-sky-200 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap" title={`ساعات العطلة: ${totalHoliday} ساعة`}>
                                <AttendanceHolidaySvg className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <strong className="font-mono text-xs text-sky-900">{totalHoliday}</strong>
                                <span className="text-[10px] text-sky-800">س</span>
                              </span>
                            </div>

                            {/* 9️⃣ ساعات الغياب غير المبرر 🔴 */}
                            <div className="text-center">
                              <span className="px-2 py-1 bg-rose-50 text-rose-950 border border-rose-200 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap" title={`ساعات الغياب: ${totalUnexcused} ساعة`}>
                                <AttendanceAbsenceSvg className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <strong className="font-mono text-xs text-rose-900">{totalUnexcused}</strong>
                                <span className="text-[10px] text-rose-800">س</span>
                              </span>
                            </div>

                            {/* 🔟 أزرار الإجراءات: كشف الأيام + إرسال تنبيه + كتاب الإنذار PDF */}
                            <div className="text-center flex flex-wrap items-center justify-center gap-1">
                              {/* زر كشف الأيام الشامل للتحقق من كافة أيام الطالب */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForDaysModal(st);
                                  setIsStudentDaysModalOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 border border-blue-200 shadow-2xs active:scale-95"
                                title="عرض كشف تفصيلي بالأيام التي حضرها أو غاب عنها أو كان مجازاً أو في عطلة رسمية"
                              >
                                <StudentDaysSheetSvg className="w-3.5 h-3.5 text-blue-700" />
                                <span>كشف الأيام</span>
                              </button>

                              {/* زر إرسال تنبيه للطالب */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAttendanceNoticeTargetStudent(st);
                                  setSelectedAttendanceStudentIds([st.id]);
                                  const defaultCat: AttendanceNoticeCategory = 
                                    worstStatus === 'banned' ? 'banned' : 
                                    worstStatus === 'warning_2' ? 'warning_2' : 
                                    worstStatus === 'warning_1' ? 'warning_1' : 
                                    'general_announcement';
                                  setAttendanceNoticeDefaultCategory(defaultCat);
                                  setIsAttendanceNoticeModalOpen(true);
                                }}
                                className="px-2 py-1 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs border border-[#0F2942] active:scale-95"
                                title="إرسال تنبيه مخصص للطالب"
                              >
                                <Send className="w-3 h-3 text-cyan-300" />
                                <span>تنبيه</span>
                              </button>

                              {/* زر كتاب الإنذار PDF للطلبة المتجاوزين للحدود */}
                              {worstStatus !== 'safe' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const worstCourse = relevantCoursesForTable[0] || deptCourses[0];
                                    const sSummary = calculateStudentCourseAttendance(
                                      st.id,
                                      worstCourse?.id || 'course-1',
                                      attendanceRecords,
                                      worstCourse?.name || 'المادة الدراسية',
                                      worstCourse?.code || 'CRS',
                                      worstCourse?.credit_hours || 3
                                    );

                                    await exportOfficialWarningLetterPDF({
                                      studentName: st.full_name,
                                      universityNumber: st.university_number || st.id,
                                      departmentName: deptName,
                                      stageNumber: st.stage_number || 1,
                                      courseName: worstCourse?.name || 'المادة الدراسية',
                                      courseCode: worstCourse?.code || 'CRS',
                                      totalScheduledHours: sSummary.total_scheduled_hours,
                                      unexcusedAbsenceHours: sSummary.total_unexcused_absence_hours,
                                      absencePercentage: sSummary.absence_percentage,
                                      warningStatus: worstStatus === 'banned' ? 'banned' : worstStatus === 'warning_2' ? 'warning_2' : 'warning_1',
                                      headName: currentHead?.full_name || 'رئاسة القسم العلمي',
                                      rapporteurName: currentRap?.full_name || 'مقررية القسم العلمي',
                                    });

                                    setSuccessMessage(`تم توليد وتحميل كتاب الأمر الإداري الرسمي للطالب (${st.full_name}) بصيغة PDF بنجاح!`);
                                    setTimeout(() => setSuccessMessage(''), 4000);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                  title="توليد كتاب أمر إداري رسمي بالإنذار / الحرمان PDF"
                                >
                                  <FileText className="w-3 h-3 text-rose-200" />
                                  <span>PDF</span>
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
                    </div>
                  </div>

                {/* 📑 شريط التنقل بين صفحات سجلات الحضور والغيابات */}
                <AdminPagination
                  currentPage={attendancePage}
                  totalItems={filteredStudents.length}
                  pageSize={attendancePageSize}
                  onPageChange={setAttendancePage}
                  onPageSizeChange={setAttendancePageSize}
                  itemLabel="طالب"
                  className="p-4 border-t border-slate-200 rounded-none rounded-b-3xl"
                />

                  {/* 🚀 شريط الإجراءات الجماعية العائم عند التحديد */}
                  {selectedAttendanceStudentIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F2942] text-white px-6 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-4 border border-[#0F2942] animate-in slide-in-from-bottom-5">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-300" />
                        <span className="text-sm sm:text-base font-black">
                          تم تحديد ({selectedAttendanceStudentIds.length}) طالب
                        </span>
                      </div>

                      <div className="h-5 w-px bg-white/20" />

                      <button
                        type="button"
                        onClick={() => {
                          setAttendanceNoticeTargetStudent(null);
                          setAttendanceNoticeDefaultCategory('warning_1');
                          setIsAttendanceNoticeModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-4 h-4 text-cyan-100" />
                        <span>إرسال تنبيه للمحددين</span>
                      </button>

                      <button
                        type="button" // 🛑 نوع الزر لمنع الإرسال التلقائي
                        onClick={handleExportAttendanceExcel} // ⚡ تصدير حضور الطلبة المحددين إلى Excel
                        disabled={isExportingAttendanceExcel} // 🛑 تعطيل الزر أثناء التصدير لمنع النقرات المتكررة
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50" // 🎨 تنسيق زمردي احترافي للأكسل
                        title="تصدير كشف حضور وغيابات الطلاب المحددين إلى ملف Excel" // 💡 تلميح الزر
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> {/* 📊 أيقونة الإكسل بلون زمردي فاتح */}
                        <span>{isExportingAttendanceExcel ? 'جاري التصدير...' : `تصدير المحدد (${selectedAttendanceStudentIds.length}) Excel`}</span> {/* 🏷️ نص الزر التفاعلي الذكي */}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAttendanceStudentIds([])}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  )}

                </div>
              );
            })()}
              </div>
            </div>
          )}

          {/* 📊 عرض لوحة الرسوم البيانية والتحليلات مباشرة دون حجبها بفلاتر الجدول */}
          {attendanceViewMode === 'analytics' && (
            <AttendanceAnalyticsCharts
              courses={deptCourses.filter((c) => {
                if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false;
                if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false;
                return true;
              })}
              students={deptStudents.filter((st) => {
                if (filterAttendanceStage !== 'all' && (st.stage_number || 1) !== filterAttendanceStage) return false;
                if (filterAttendanceStudyType !== 'all' && (st.study_type || 'morning') !== filterAttendanceStudyType) return false;
                if (currentGroupFilter !== 'all') {
                  if (currentGroupFilter === 'unassigned') {
                    if (st.student_group) return false;
                  } else if (st.student_group !== currentGroupFilter) {
                    return false;
                  }
                }
                return true;
              })}
              records={attendanceRecords.filter((r) => {
                if (filterAttendanceSemester !== 'all' && r.semester && r.semester !== filterAttendanceSemester) return false;
                if (filterAttendanceStage !== 'all' && r.stage_number && r.stage_number !== filterAttendanceStage) return false;
                if (currentYearFilter !== 'all' && r.academic_year_id && r.academic_year_id !== currentYearFilter && !currentYearFilter.includes(r.academic_year_id)) return false;
                return true;
              })}
              departmentName={deptName}
              startDate={currentScheduleConfig.start_date || '2026-09-20'}
              initialStage={filterAttendanceStage}
              initialSemester={filterAttendanceSemester === 'all' ? 1 : filterAttendanceSemester}
            />
          )}

          {/* 🏖️ نافذة إعلان وتعطيل الدوام الرسمي من قبل رئاسة أو مقررية القسم */}
          <DepartmentHolidayModal
            isOpen={isHolidayModalOpen}
            onClose={() => setIsHolidayModalOpen(false)}
            currentDeptId={currentDeptId}
            currentHeadName={currentHead?.full_name}
            currentRapName={currentRap?.full_name}
            deptStudents={deptStudents}
            deptCourses={deptCourses}
            attendanceRecords={attendanceRecords}
            setAttendanceRecords={setAttendanceRecords}
            onHolidaySaved={(holiday) => {
              setSuccessMessage(`تم إعلان عطلة (${holiday.title}) وتطبيقها على سجلات الطلبة بنجاح! 🏖️`);
              setTimeout(() => setSuccessMessage(''), 4000);
            }}
          />

          {/* 📋 نافذة كشف أيام وساعات الحضور والغياب والإجازات والعطلات التفصيلية للطالب المصفاة بالعام والكورس */}
          <StudentAttendanceDaysModal
            isOpen={isStudentDaysModalOpen}
            onClose={() => {
              setIsStudentDaysModalOpen(false);
              setSelectedStudentForDaysModal(null);
            }}
            student={selectedStudentForDaysModal}
            records={attendanceRecords.filter((r) => {
              if (filterAttendanceSemester !== 'all' && r.semester && r.semester !== filterAttendanceSemester) return false;
              if (filterAttendanceStage !== 'all' && r.stage_number && r.stage_number !== filterAttendanceStage) return false;
              if (currentYearFilter !== 'all' && r.academic_year_id && r.academic_year_id !== currentYearFilter && !currentYearFilter.includes(r.academic_year_id)) return false;
              return true;
            })}
          />

        </div>

  );
};

export default DepartmentAttendanceTab; // 🚀 تصدير المكون كافتراضي
