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

// 📋 واجهة خصائص تبويب الحضور والغيابات والإنذارات الأكاديمية
export interface DepartmentAttendanceTabProps {
  deptName: string; // 🏢 اسم القسم
  currentDeptId: string; // 🆔 معرف القسم الحالي
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
}) => {
  // 👥 حالة محلية احتياطية لتصفية الكروب إذا لم تُمرر من المكون الأب
  const [internalGroupFilter, setInternalGroupFilter] = React.useState<string>('all'); // 🎯 فلتر الكروب الداخلي
  // 🎯 تحديد الفلتر الفعال سواء كان ممرراً أو داخلياً
  const currentGroupFilter = filterAttendanceGroup !== undefined ? filterAttendanceGroup : internalGroupFilter; // 📌 الكروب النشط
  // 🔄 دالة تغيير فلتر الكروب المتوافقة
  const handleGroupFilterChange = setFilterAttendanceGroup || setInternalGroupFilter; // ⚡ دالة التغيير

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
            {/* 🏷️ العنوان والبادجات التعريفية */}
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

            {/* 🛠️ شريط أزرار العمليات المنسقة بالكامل بسطر خاص بها بلون الكحلي الملكي وفق ترتيب المستخدم */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
              {/* 1️⃣ زر جدول الطلاب */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setAttendanceViewMode('list')} // ⚡ تفعيل نمط جدول الطلاب
                className={`px-5 py-3 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 shadow-md active:scale-95 border shrink-0 ${
                  attendanceViewMode === 'list'
                    ? 'bg-[#0F2942] hover:bg-[#163a5f] text-white border-[#0F2942] ring-2 ring-cyan-400/40' // 🎨 مظهر نشط كحلي ملكي
                    : 'bg-[#0F2942] hover:bg-[#163a5f] text-white/80 hover:text-white border-[#0F2942]' // 🎨 كحلي ملكي أنيق
                }`}
                title="عرض جدول كشف حضور وغياب الطلاب" // 💡 تلميح الزر
              >
                <Users className="w-5 h-5 text-cyan-300" /> {/* 👥 أيقونة الطلاب الزرقاء */}
                <span>جدول الطلاب</span> {/* 📝 نص الزر */}
              </button>

              {/* 2️⃣ زر التحليلات والرسوم البيانية */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setAttendanceViewMode('analytics')} // ⚡ تفعيل نمط التحليلات
                className={`px-5 py-3 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 shadow-md active:scale-95 border shrink-0 ${
                  attendanceViewMode === 'analytics'
                    ? 'bg-[#0F2942] hover:bg-[#163a5f] text-white border-[#0F2942] ring-2 ring-cyan-400/40' // 🎨 مظهر نشط كحلي ملكي
                    : 'bg-[#0F2942] hover:bg-[#163a5f] text-white/80 hover:text-white border-[#0F2942]' // 🎨 كحلي ملكي أنيق
                }`}
                title="عرض الرسوم البيانية ومؤشرات الغياب" // 💡 تلميح الزر
              >
                <BarChart3 className="w-5 h-5 text-cyan-300" /> {/* 📊 أيقونة الرسوم البيانية */}
                <span>التحليلات والرسوم البيانية</span> {/* 📝 نص الزر */}
              </button>

              {/* 3️⃣ زر تصدير الحضور (Excel) */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال تلقائي
                onClick={handleExportAttendanceExcel} // ⚡ تشغيل دالة تصدير كشف الحضور للإكسل
                disabled={isExportingAttendanceExcel} // 🛑 تعطيل الزر أثناء عملية التصدير
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تصدير كشف الحضور والغيابات والإنذارات الأكاديمية لمسار بولونيا إلى ملف Excel" // 💡 نص التلميح
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" /> {/* 📊 أيقونة الإكسل باللون الزمردي الزاهي */}
                <span>{isExportingAttendanceExcel ? 'جاري التصدير...' : selectedAttendanceStudentIds.length > 0 ? `تصدير المحدد (${selectedAttendanceStudentIds.length}) Excel` : 'تصدير الحضور (Excel)'}</span> {/* 🏷️ نص الزر التفاعلي الذكي */}
              </button>

              {/* 4️⃣ زر تخصيص ساعات المحاضرات */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setIsDurationSettingsModalOpen(true)} // ⚡ فتح نافذة تخصيص ساعات المحاضرات
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تخصيص وإعداد مدد وساعات المحاضرات للقسم ومواده" // 💡 نص التلميح
              >
                <SlidersHorizontal className="w-5 h-5 text-cyan-300" /> {/* ⚙️ أيقونة التخصيص */}
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
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="إرسال تبليغ عام أو تنبيه لطلبة المرحلة" // 💡 نص التلميح
              >
                <Send className="w-5 h-5 text-cyan-300" /> {/* 📤 أيقونة الإرسال الزرقاء */}
                <span>إرسال تبليغ عام للمرحلة</span> {/* 📝 نص الزر */}
              </button>

              {/* 6️⃣ زر تدقيق ومراجعة طلبات الإجازات */}
              <button
                type="button" // 🔘 نوع الزر
                onClick={() => setIsDeptExcuseReviewOpen(true)} // ⚡ فتح نافذة مراجعة الإجازات
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black transition-all cursor-pointer flex items-center gap-2.5 border border-[#0F2942] shadow-md hover:shadow-lg active:scale-95 shrink-0" // 🎨 تصميم كحلي ملكي راقٍ
                title="تدقيق ومراجعة طلبات الإجازات والأعذار الرسمية" // 💡 نص التلميح
              >
                <FileText className="w-5 h-5 text-cyan-300" /> {/* 📑 أيقونة طلبات الإجازات */}
                <span>تدقيق ومراجعة طلبات الإجازات ({excuseRequests.filter((e: AttendanceExcuseRequest) => e.department_id === currentDeptId && e.status === 'pending').length})</span> {/* 📝 نص الزر مع العداد */}
              </button>
            </div>
          </div>

          {/* 🎛️ شريط الفلاتر المتقدم والشامل لتبويب الحضور: المرحلة + الكورس + الفترة + المادة + البحث الفوري */}
          <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-4">
              
              {/* 🎓 تصفية المرحلة الدراسية */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#0F2942]" />
                  <span>المرحلة:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceStage('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStage === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>كافة المراحل</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStage === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300'
                    }`}>
                      {deptStudents.length}
                    </span>
                  </button>
                  {[1, 2, 3, 4].map((stg) => {
                    const stgCount = deptStudents.filter((s) => (s.stage_number || 1) === stg).length;
                    const stgLabel = stg === 1 ? 'المرحلة الأولى' : stg === 2 ? 'المرحلة الثانية' : stg === 3 ? 'المرحلة الثالثة' : 'المرحلة الرابعة';
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => setFilterAttendanceStage(stg)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          filterAttendanceStage === stg
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <span>{stgLabel}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          filterAttendanceStage === stg
                            ? 'bg-white/20 text-white border-white/30'
                            : stgCount > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {stgCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📚 تصفية الكورس الدراسي */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-5 h-5 text-[#0F2942]" />
                  <span>الكورس:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceSemester('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    كافة الكورسات
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceSemester(1)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 1
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    الكورس الأول
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceSemester(2)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                      filterAttendanceSemester === 2
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    الكورس الثاني
                  </button>
                </div>
              </div>

              {/* ☀️🌙 تصفية الفترة الدراسية (الصباحي / المسائي) */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                  <Clock className="w-5 h-5 text-[#0F2942]" />
                  <span>الفترة:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceStudyType('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>كافة الفترات</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300'
                    }`}>
                      {deptStudents.length}
                    </span>
                  </button>
                  {/* ☀️ زر تصفية الفترة الصباحية بتصميم كحلي فاخر #0F2942 */}
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceStudyType('morning')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'morning'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>الصباحي</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'morning'
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-slate-200 text-slate-900 border-slate-300'
                    }`}>
                      {deptStudents.filter((s) => (s.study_type || 'morning') === 'morning').length}
                    </span>
                  </button>
                  {/* 🌙 زر تصفية الفترة المسائية بتصميم كحلي فاخر #0F2942 */}
                  <button
                    type="button"
                    onClick={() => setFilterAttendanceStudyType('evening')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAttendanceStudyType === 'evening'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>المسائي</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                      filterAttendanceStudyType === 'evening'
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-slate-200 text-slate-900 border-slate-300'
                    }`}>
                      {deptStudents.filter((s) => s.study_type === 'evening').length}
                    </span>
                  </button>
                </div>
              </div>

              {/* 🗓️ تصفية الأسبوع الدراسي (1 إلى 15) المعتمد لمسار بولونيا */}
              <div className="flex items-center gap-2.5 shrink-0 relative">
                <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                  <CalendarDays className="w-5 h-5 text-[#0F2942]" />
                  <span>الأسبوع:</span>
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAttendanceWeekDropdownOpen(!isAttendanceWeekDropdownOpen)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>
                      {filterAttendanceWeek === 'all'
                        ? 'كافة الأسابيع (1 - 15)'
                        : (() => {
                            const baseD = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ انطلاق الفصل
                            const baseDayKey = getDayOfWeekFromDateString(baseD); // 🗓️ اليوم الأكاديمي المعتمد
                            const weekDate = calculateDateForAnyDayInWeek(baseD, 1, filterAttendanceWeek, baseDayKey); // 📅 تاريخ الأسبوع
                            return `الأسبوع ${filterAttendanceWeek} (${formatDateArabicWithDay(weekDate)})`;
                          })()}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isAttendanceWeekDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAttendanceWeekDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsAttendanceWeekDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 w-72 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterAttendanceWeek('all');
                            setIsAttendanceWeekDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                            filterAttendanceWeek === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <span>كافة الأسابيع (1 - 15)</span>
                          {filterAttendanceWeek === 'all' && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                        </button>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => {
                          const isSel = filterAttendanceWeek === wNum;
                          const isCurr = scheduleCurrentAcademicWeek === wNum;
                          const baseD = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ انطلاق الفصل
                          const baseDayKey = getDayOfWeekFromDateString(baseD); // 🗓️ اليوم الأكاديمي المعتمد
                          const weekD = calculateDateForAnyDayInWeek(baseD, 1, wNum, baseDayKey); // 📅 تاريخ الأسبوع المتطابق مع يوم الانطلاق
                          const p = weekD.split('-');
                          const dNum = p.length === 3 ? parseInt(p[2], 10) : '';
                          const mName = p.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || '') : '';

                          return (
                            <button
                              key={wNum}
                              type="button"
                              onClick={() => {
                                setFilterAttendanceWeek(wNum);
                                setIsAttendanceWeekDropdownOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                                isSel ? 'bg-[#0F2942] text-white' : 'text-slate-950 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>الأسبوع {wNum}</span>
                                <span className={`text-[11px] ${isSel ? 'text-cyan-200' : 'text-slate-500'}`}>
                                  ({dNum} {mName})
                                </span>
                                {isCurr && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                    isSel ? 'bg-cyan-400 text-slate-950' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}>
                                    الحالي
                                  </span>
                                )}
                              </div>
                              {isSel && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 👥 شريط فلترة وتحديد سجل غياب الكروب المخصص لمسار بولونيا */}
              {availableGroups.length > 0 && (
                <div className="flex items-center gap-2.5 shrink-0 pt-2 border-t border-slate-200/80 w-full flex-wrap">
                  <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <GroupAttendanceSvg className="w-5 h-5 text-[#0F2942]" /> {/* 📋 أيقونة سجل غياب الكروب */}
                    <span>سجل كروب:</span> {/* 🏷️ عنوان التصفية */}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 🌐 زر كافة الكروبات */}
                    <button
                      type="button" // 🔘 نوع الزر
                      onClick={() => handleGroupFilterChange('all')} // ⚡ تفعيل كافة الكروبات
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        currentGroupFilter === 'all'
                          ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // 🎨 مظهر هادئ
                      }`}
                    >
                      <span>كافة الكروبات</span> {/* 📝 النص */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                        currentGroupFilter === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300'
                      }`}>
                        {deptStudents.filter((s) => filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage).length}
                      </span>
                    </button>

                    {/* 🏛️ زر شعبة موحدة (بدون تقسيم كروبات) */}
                    <button
                      type="button" // 🔘 نوع الزر
                      onClick={() => handleGroupFilterChange('unassigned')} // ⚡ تفعيل بدون كروب
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        currentGroupFilter === 'unassigned'
                          ? 'bg-[#0F2942] text-white shadow-xs' // 🎨 مظهر نشط كحلي ملكي
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // 🎨 مظهر هادئ
                      }`}
                    >
                      <span>شعبة موحدة</span> {/* 📝 استبدال مشتركة بـ شعبة موحدة */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                        currentGroupFilter === 'unassigned' ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300'
                      }`}>
                        {deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && !s.student_group).length}
                      </span>
                    </button>

                    {/* 🔠 أزرار الكروبات المخصصة (كروب A, كروب B, كروب C, كروب D...) */}
                    {availableGroups.map((grpName) => {
                      const grpCount = deptStudents.filter((s) => (filterAttendanceStage === 'all' || (s.stage_number || 1) === filterAttendanceStage) && s.student_group === grpName).length; // 🔢 عدد طلبة الكروب
                      return (
                        <button
                          key={grpName} // 🔑 مفتاح الكروب الفريد
                          type="button" // 🔘 نوع الزر
                          onClick={() => handleGroupFilterChange(grpName)} // ⚡ تفعيل هذا الكروب
                          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            currentGroupFilter === grpName
                              ? 'bg-[#0F2942] text-white shadow-xs ring-2 ring-cyan-400/40' // 🎨 مظهر نشط كحلي ملكي مع حلقة سماوية
                              : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // 🎨 مظهر غير نشط
                          }`}
                        >
                          <GroupBadgeSvg className="w-3.5 h-3.5 text-cyan-300" /> {/* 🏷️ بادج الكروب النقي */}
                          <span>سجل كروب {grpName}</span> {/* 📝 نص الزر */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                            currentGroupFilter === grpName
                              ? 'bg-white/20 text-white border-white/30' // 🎨 كحلي نشط
                              : grpCount > 0
                              ? 'bg-blue-100 text-blue-950 border-blue-300' // 🎨 أزرق معتدل
                              : 'bg-slate-200 text-slate-600 border-slate-300' // 🎨 رمادي فارغ
                          }`}>
                            {grpCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* السطر الثاني: تصفية المادة + حالة الإنذار + البحث اللحظي + زر المزامنة */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-200 items-center">
              
              {/* البحث اللحظي */}
              <div className="md:col-span-4 relative">
                {/* 🔍 أيقونة البحث SVG */}
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                {/* ✍️ حقل البحث باسم الطالب حصراً بعد إزالة الرقم الجامعي */}
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="بحث باسم الطالب..."
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm sm:text-base font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
                />
              </div>

              {/* 📚 تصفية المادة الدراسية المخصصة */}
              <div className="md:col-span-4 relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsAttendanceCourseDropdownOpen(!isAttendanceCourseDropdownOpen);
                    setIsAttendanceStatusDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-sm sm:text-base font-black text-slate-950 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {filterAttendanceCourse === 'all'
                        ? `كافة مواد القسم (${deptCourses.length} مادة)`
                        : deptCourses.find((c) => c.id === filterAttendanceCourse)?.name || 'اختر المادة'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isAttendanceCourseDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAttendanceCourseDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsAttendanceCourseDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterAttendanceCourse('all');
                          setIsAttendanceCourseDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer ${
                          filterAttendanceCourse === 'all'
                            ? 'bg-[#0F2942] text-white'
                            : 'text-slate-950 hover:bg-slate-100'
                        }`}
                      >
                        <span>كافة مواد القسم ({deptCourses.length} مادة)</span>
                        {filterAttendanceCourse === 'all' && <Check className="w-4 h-4 text-cyan-300" />}
                      </button>

                      {deptCourses
                        .filter((c) => {
                          if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false;
                          if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false;
                          return true;
                        })
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setFilterAttendanceCourse(c.id);
                              setIsAttendanceCourseDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer ${
                              filterAttendanceCourse === c.id
                                ? 'bg-[#0F2942] text-white'
                                : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">
                              {c.name} ({c.code}) — المرحلة {getStageNameInArabic(c.stage_number || 1)} (الكورس {c.semester === 2 ? 'الثاني' : 'الأول'})
                            </span>
                            {filterAttendanceCourse === c.id && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* ⚠️ تصفية حالة الإنذار المخصصة */}
              <div className="md:col-span-3 relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsAttendanceStatusDropdownOpen(!isAttendanceStatusDropdownOpen);
                    setIsAttendanceCourseDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-sm sm:text-base font-black text-slate-950 flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {filterAttendanceStatus === 'safe' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : filterAttendanceStatus === 'warning_1' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : filterAttendanceStatus === 'warning_2' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : filterAttendanceStatus === 'banned' ? (
                      <Ban className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {filterAttendanceStatus === 'all'
                        ? 'كافة حالات الحضور والإنذار'
                        : filterAttendanceStatus === 'safe'
                        ? 'الوضع آمن (أقل من 5%)'
                        : filterAttendanceStatus === 'warning_1'
                        ? 'إنذار أولي (5% - 6.9%)'
                        : filterAttendanceStatus === 'warning_2'
                        ? 'إنذار نهائي (7% - 9.9%)'
                        : 'تجاوز الحرمان (10%+)'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isAttendanceStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAttendanceStatusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsAttendanceStatusDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1">
                      {[
                        { val: 'all', label: 'كافة حالات الحضور والإنذار', icon: <ShieldCheck className="w-4 h-4 text-blue-600" /> },
                        { val: 'safe', label: 'الوضع آمن (أقل من 5%)', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
                        { val: 'warning_1', label: 'إنذار أولي (5% - 6.9%)', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
                        { val: 'warning_2', label: 'إنذار نهائي (7% - 9.9%)', icon: <AlertCircle className="w-4 h-4 text-rose-600" /> },
                        { val: 'banned', label: 'تجاوز الحرمان (10%+)', icon: <Ban className="w-4 h-4 text-red-600" /> },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setFilterAttendanceStatus(item.val as AttendanceWarningStatus | 'all');
                            setIsAttendanceStatusDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer ${
                            filterAttendanceStatus === item.val
                              ? 'bg-[#0F2942] text-white'
                              : 'text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          {filterAttendanceStatus === item.val && <Check className="w-4 h-4 text-cyan-300" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* زر مزامنة السحابة الحية */}
              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingAttendance(true);
                    const freshRecords = await syncAttendanceRecordsFromSupabase();
                    setAttendanceRecords(freshRecords);
                    setIsSyncingAttendance(false);
                    setSuccessMessage('تمت مزامنة سجلات الحضور الحية من السحابة بنجاح! ☁️');
                    setTimeout(() => setSuccessMessage(''), 3500);
                  }}
                  disabled={isSyncingAttendance}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl border border-slate-300 transition cursor-pointer shadow-2xs flex items-center justify-center"
                  title="مزامنة وتحديث سجلات الحضور لحظياً من قاعدة البيانات السحابية"
                >
                  <RefreshCw className={`w-5 h-5 text-blue-700 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
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

              const effectiveRecordsForStats = filterAttendanceWeek === 'all'
                ? attendanceRecords
                : attendanceRecords.filter((r) => r.week_number === filterAttendanceWeek);

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
          {attendanceViewMode === 'list' && (
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
                  let highestRank = 0;
                  let worstStatus: AttendanceWarningStatus = 'safe';
                  let totalUnexcused = 0;

                  const effectiveRecordsForTable = filterAttendanceWeek === 'all'
                    ? attendanceRecords
                    : attendanceRecords.filter((r) => r.week_number === filterAttendanceWeek);

                  for (const c of relevantCoursesForTable) {
                    const s = calculateStudentCourseAttendance(st.id, c.id, effectiveRecordsForTable, c.name, c.code, c.credit_hours || 3);
                    totalUnexcused += s.total_unexcused_absence_hours;
                    const currentRank = rankMap[s.warning_status] || 0;
                    if (currentRank > highestRank) {
                      highestRank = currentRank;
                      worstStatus = s.warning_status;
                    }
                  }

                  return {
                    student: st,
                    worstStatus,
                    totalUnexcused,
                    badge: getAttendanceWarningBadgeMeta(worstStatus),
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
                  {/* رأس الجدول مع مربع تحديد الكل والأعمدة المفصولة */}
                  <div className="grid grid-cols-12 bg-slate-100 text-slate-900 border-b border-slate-200 text-sm sm:text-base font-black p-3.5 text-center items-center">
                    {/* 🔢 تحديد الكل وتسلسل الطالب */}
                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllFilteredSelected) {
                            setSelectedAttendanceStudentIds(selectedAttendanceStudentIds.filter((id) => !allFilteredIds.includes(id)));
                          } else {
                            setSelectedAttendanceStudentIds(Array.from(new Set([...selectedAttendanceStudentIds, ...allFilteredIds])));
                          }
                        }}
                        className="cursor-pointer text-slate-700 hover:text-slate-950 transition"
                        title={isAllFilteredSelected ? 'إلغاء تحديد الكل' : 'تحديد كافة طلاب الجدول'}
                      >
                        {isAllFilteredSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <span className="font-mono text-sm">#</span>
                    </div>

                    {/* 👤 اسم الطالب */}
                    <div className="col-span-2 text-right pr-2">اسم الطالب</div>
                    {/* 🎓 المرحلة */}
                    <div className="col-span-2">المرحلة</div>
                    {/* 📚 الكورس */}
                    <div className="col-span-1">الكورس</div>
                    {/* ☀️🌙 الفترة الدراسية */}
                    <div className="col-span-1">الفترة الدراسية</div>
                    {/* 🛡️ الموقف الأكاديمي */}
                    <div className="col-span-2">الموقف الأكاديمي</div>
                    {/* ⏱️ ساعات الغياب */}
                    <div className="col-span-1">ساعات الغياب</div>
                    {/* 🔔 الإجراء والتنبيه */}
                    <div className="col-span-2">الإجراء والتنبيه</div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-black space-y-2">
                      <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-base text-slate-700 font-black">لا يوجد طلاب يطابقون معايير التصفية والبحث المحددة حالياً.</p>
                      <p className="text-xs text-slate-400">جرب تعديل المرحلة أو الكورس أو الفترة الدراسية لرؤية النتائج.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {(() => {
                        // 🔢 نحسب رقم الصفحة الآمن لسجل الحضور حتى نتجنب تجاوز الحدود
                        const safeAttendancePage = Math.max(1, Math.min(attendancePage, Math.max(1, Math.ceil(filteredStudents.length / attendancePageSize))));
                        // ✂️ نقص مصفوفة الطلاب حسب الصفحة وحجم الصفحة المختار
                        const paginatedAttendanceStudents = filteredStudents.slice((safeAttendancePage - 1) * attendancePageSize, safeAttendancePage * attendancePageSize);

                        // 🔄 نعمل خريطة لعرض الطلاب في الصفحة الحالية
                        return paginatedAttendanceStudents.map(({ student: st, worstStatus, totalUnexcused, badge }, idx) => {
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
                              className={`grid grid-cols-12 items-center p-3.5 text-sm sm:text-base font-black transition ${
                                isRowSelected ? 'bg-blue-50/80 border-r-4 border-r-blue-600' : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* مربع الاختيار والتسلسل */}
                              <div className="col-span-1 flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isRowSelected) {
                                      setSelectedAttendanceStudentIds(selectedAttendanceStudentIds.filter((id) => id !== st.id));
                                    } else {
                                      setSelectedAttendanceStudentIds([...selectedAttendanceStudentIds, st.id]);
                                    }
                                  }}
                                  className="cursor-pointer text-slate-950 hover:text-black transition"
                                >
                                  {isRowSelected ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-950" />
                                  )}
                                </button>
                                <span className="font-mono text-sm font-black text-slate-950">{actualIndex + 1}</span>
                              </div>
                            
                            {/* 👤 اسم الطالب الثلاثي بدون رقم جامعي */}
                            <div className="col-span-2 text-right pr-2">
                              <h4 className="font-black text-slate-950 text-base leading-tight truncate">{st.full_name}</h4>
                            </div>

                            {/* 🎓 المرحلة الدراسية مع بادج الكروب المخصص */}
                            <div className="col-span-2 text-center flex flex-col items-center justify-center gap-1">
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block">
                                المرحلة {getStageNameInArabic(st.stage_number || 1)}
                              </span>
                              {st.student_group ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-950 border border-blue-300 rounded-lg text-xs font-black inline-flex items-center gap-1 shadow-2xs">
                                  <GroupBadgeSvg className="w-3 h-3 text-blue-700" />
                                  <span>كروب {st.student_group}</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-medium">
                                  شعبة عامة
                                </span>
                              )}
                            </div>

                            {/* 📚 الكورس الدراسي المسجل به الغياب */}
                            <div className="col-span-1 text-center">
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-xl text-xs sm:text-sm font-black inline-block whitespace-nowrap">
                                {studentSemesterLabel}
                              </span>
                            </div>

                            {/* ☀️🌙 الفترة الدراسية */}
                            <div className="col-span-1 text-center">
                              <span className={`px-2 py-1 rounded-xl text-xs sm:text-sm font-black border inline-flex items-center gap-1 whitespace-nowrap ${
                                (st.study_type || 'morning') === 'evening'
                                  ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                                  : 'bg-sky-50 text-sky-950 border-sky-200'
                              }`}>
                                {(st.study_type || 'morning') === 'evening' ? (
                                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                ) : (
                                  <Sun className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                )}
                                <span>{(st.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                              </span>
                            </div>

                            {/* 🛡️ الموقف الأكاديمي للغياب مع أيقونة SVG صريحة */}
                            <div className="col-span-2 text-center">
                              <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 ${badge.badgeClass}`}>
                                {worstStatus === 'safe' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                {worstStatus === 'warning_1' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                                {worstStatus === 'warning_2' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                                {worstStatus === 'banned' && <Ban className="w-4 h-4 text-white shrink-0" />}
                                <span>{badge.label_ar}</span>
                              </span>
                            </div>

                            {/* ⏱️ ساعات الغياب غير المبرر في عمود مستقل */}
                            <div className="col-span-1 text-center">
                              <span className="px-2 py-1 bg-slate-50 text-slate-950 border border-slate-200 rounded-xl text-xs sm:text-sm font-black inline-block whitespace-nowrap">
                                <strong className="font-mono text-sm font-black text-slate-950">{totalUnexcused}</strong> <span className="text-slate-950 font-black">س</span>
                              </span>
                            </div>

                            {/* 🔔 الإجراء والتنبيه */}
                            <div className="col-span-2 text-center flex flex-wrap items-center justify-center gap-1.5">
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
                                className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-xs border border-[#0F2942] active:scale-95"
                                title="إرسال تنبيه مخصص للطالب"
                              >
                                <Send className="w-3.5 h-3.5 text-cyan-300" />
                                <span>إرسال تنبيه</span>
                              </button>

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
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                  title="توليد كتاب أمر إداري رسمي بالإنذار / الحرمان PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-200" />
                                  <span>كتاب الإنذار PDF</span>
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

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
          )}

          {/* عرض الرسوم البيانية عند اختيار التبويب مع تمرير الطلبة المفلترين بالكروب */}
          {attendanceViewMode === 'analytics' && (
            <AttendanceAnalyticsCharts
              courses={deptCourses}
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
              records={attendanceRecords}
              departmentName={deptName}
              startDate={currentScheduleConfig.start_date || '2026-09-20'}
            />
          )}

        </div>

  );
};

export default DepartmentAttendanceTab; // 🚀 تصدير المكون كافتراضي
