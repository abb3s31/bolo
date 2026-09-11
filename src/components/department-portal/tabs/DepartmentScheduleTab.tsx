'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React, { useState, useEffect, useMemo } from 'react'; // ⚛️ استيراد مكتبة ريآكت مع خطافات الحالة والتأثير والحساب useState و useEffect و useMemo
import {
  Clock, // ⏰ أيقونة الساعة
  Plus, // ➕ أيقونة الإضافة
  Download, // 📥 أيقونة التنزيل
  Lightbulb, // 💡 أيقونة الإرشادات
  Upload, // 📤 أيقونة الرفع
  FileSpreadsheet, // 📊 أيقونة الإكسل
  Eye, // 👁️ أيقونة المعاينة
  Printer, // 🖨️ أيقونة الطباعة
  Trash2, // 🗑️ أيقونة الحذف
  GraduationCap, // 🎓 أيقونة المرحلة
  Layers, // 📚 أيقونة الكورس
  Sun, // ☀️ أيقونة الصباحي
  Moon, // 🌙 أيقونة المسائي
  Calendar, // 📅 أيقونة التاريخ
  CalendarDays, // 🗓️ أيقونة التقويم
  AlertCircle, // ⚠️ أيقونة التنبيه
  CheckCircle2, // ✅ أيقونة النجاح
  DoorClosed, // 🚪 أيقونة القاعة
  Coffee, // ☕ أيقونة الاستراحة
  Users, // 👥 أيقونة الأساتذة
  BookOpen, // 📖 أيقونة المادة
  FlaskConical, // 🧪 أيقونة المختبر
  Edit3, // ✏️ أيقونة التعديل
  CheckSquare, // ☑️ أيقونة مربع التحديد
  Square, // ⬜ أيقونة مربع غير محدد
  CheckCheck, // ✔️ أيقونة التحديد الشامل
  Info, // ℹ️ أيقونة المعلومات
  X, // ❌ أيقونة الإلغاء والإغلاق
  XCircle, // 🚫 أيقونة إلغاء المحاضرة للأسبوع
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type {
  UserProfile, // 👤 نوع بروفايل المستخدم
  Course, // 📚 نوع المادة الدراسية
  ScheduleLecture, // 📋 نوع المحاضرة المجدولة
  DepartmentScheduleConfig, // ⚙️ نوع إعدادات الجدول
  DayOfWeek, // 🗓️ نوع اليوم
  LectureColor, // 🎨 نوع لون المحاضرة
  LectureType, // 🔬 نوع المحاضرة (نظري أو عملي)
  TeacherCourse, // 🔗 نوع ربط الأستاذ بالمادة
  StageGroupConfig, // ⚙️ واجهة إعدادات كروبات المراحل
} from '@/types'; // 🏷️ استيراد الأنواع
import { GroupScheduleSvg, GroupUsersSvg, GroupBadgeSvg } from '@/components/common/GroupSvgIcons'; // 👥 استيراد أيقونات الكروبات والشعب الفيكتورية النقية
import ArabicDatePicker from '@/components/schedule/ArabicDatePicker'; // 📅 تقويم التاريخ العربي
import {
  DAYS_OF_WEEK_LIST, // 🗓️ قائمة أيام الأسبوع
  timeStringToMinutes, // ⏱️ تحويل الوقت إلى دقائق
  calculateDateForAnyDayInWeek, // 📅 حساب تاريخ أي يوم في الأسبوع
  getDayOfWeekFromDateString, // 🗓️ استخراج اليوم من التاريخ
  formatDateArabicWithDay,
  IRAQI_ARABIC_MONTHS, // 🏷️ تنسيق التاريخ بالعربية مع اسم اليوم
  formatArabicLectureCount, // 🔤 صياغة عدد المحاضرات
  formatArabicOrdinalLectureName, // 🎖️ صياغة تسلسل المحاضرة
  isLectureActiveInWeek, // 🎯 فحص نشاط المحاضرة في الأسبوع المختار
} from '@/lib/schedule-utils'; // 🕒 أدوات الجدول الأكاديمي
import type { ScheduleConflict } from '@/lib/schedule-utils'; // ⚠️ نوع تضارب الجدول
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ اسم المرحلة بالعربية
import LectureModal from '@/components/department-portal/modals/LectureModal'; // 🪟 مودال المحاضرات المستقل

// 📋 واجهة خصائص تبويب إدارة الجدول الأسبوعي الأكاديمي
export interface DepartmentScheduleTabProps {
  // 🏢 بيانات القسم الأساسية
  deptName: string; // 🏢 اسم القسم
  currentDeptId: string; // 🏢 معرف القسم
  courses: Course[]; // 📚 قائمة كافة المواد
  deptCourses: Course[]; // 📚 مواد القسم
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
  teacherCourses: TeacherCourse[]; // 🔗 تخصيصات التدريسيين
  scheduleLectures: ScheduleLecture[]; // 📋 قائمة محاضرات الجدول
  currentScheduleConfig: DepartmentScheduleConfig; // ⚙️ إعدادات الجدول
  scheduleCurrentAcademicWeek: number; // ⚡ الأسبوع التقويمي الحالي المكتشف

  // 🎛️ خيارات الفلترة والعرض
  selectedScheduleStage: number; // 🎓 المرحلة المحددة
  setSelectedScheduleStage: React.Dispatch<React.SetStateAction<number>>; // 🔄 تحديث المرحلة
  selectedScheduleSemester: 1 | 2; // 🗓️ الكورس المحدد
  setSelectedScheduleSemester: React.Dispatch<React.SetStateAction<1 | 2>>; // 🔄 تحديث الكورس
  selectedScheduleStudyType: 'morning' | 'evening'; // ☀️🌙 نوع الدراسة
  setSelectedScheduleStudyType: React.Dispatch<React.SetStateAction<'morning' | 'evening'>>; // 🔄 تحديث نوع الدراسة
  selectedScheduleWeek: number; // 🔢 الأسبوع المحدد للكروب
  setSelectedScheduleWeek: React.Dispatch<React.SetStateAction<number>>; // 🔄 تحديث الأسبوع
  selectedScheduleGroup?: string; // 👥 الكروب المحدد لجدول القسم
  setSelectedScheduleGroup?: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الكروب المحدد
  selectedScheduleLectureIds: string[]; // 🔘 المحاضرات المحددة
  setSelectedScheduleLectureIds: React.Dispatch<React.SetStateAction<string[]>>; // 🔄 تحديث التحديد

  // ⚠️ التضاربات الزمنية الحالية
  currentLecConflicts: ScheduleConflict[]; // ⚠️ قائمة التضاربات

  // 📊 معالجات الإكسل والطباعة والمعاينة
  handleDownloadScheduleTemplate: () => Promise<void> | void; // 📥 تنزيل القالب
  setShowScheduleExcelInstructions: React.Dispatch<React.SetStateAction<boolean>>; // 📖 إرشادات الإكسل
  handleScheduleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void; // 📤 رفع الإكسل
  isImportingScheduleExcel: boolean; // ⏳ حالة التحميل
  handleExportScheduleToExcel: () => Promise<void> | void; // 📊 تصدير إكسل
  setIsPreviewScheduleModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 👁️ معاينة الجدول
  setIsSchedulePrintModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🖨️ طباعة الجدول
  handleBulkDeleteScheduleLectures: () => Promise<void> | void; // 🗑️ حذف متعدد
  handleToggleWorkingDay: (dayKey: DayOfWeek) => void; // 🗓️ تبديل يوم العمل
  setPendingSemesterStartDate: React.Dispatch<React.SetStateAction<string | null>>; // 📅 تاريخ انطلاق الفصل المؤقت
  setShowSemesterDateConfirmModal: React.Dispatch<React.SetStateAction<boolean>>; // 🪟 تأكيد تاريخ الفصل

  // ✏️ معالجات المحاضرة المباشرة
  isLectureInCurrentDept: (l: ScheduleLecture) => boolean; // 🏢 التحقق من تبعية المحاضرة
  handleEditLecture: (lec: ScheduleLecture) => void; // ✏️ تعديل محاضرة
  handleDeleteLecture: (id: string) => void; // 🗑️ حذف محاضرة
  handleDeleteLectureForWeek?: (id: string, weekNumber: number) => void; // 🚫 إلغاء المحاضرة لهذا الأسبوع فقط
  handleSaveLecture: (e: React.FormEvent) => void; // 💾 حفظ المحاضرة
  handleSaveSemesterStartDate: (newStartDate: string) => void; // 📅 حفظ تاريخ انطلاق الفصل
  resetLectureModalState: (initialDay?: DayOfWeek, initialWeek?: number) => void; // 🧹 تصفير استمارة المحاضرة
  setSuccessMessage: (msg: string) => void; // 💬 إشعار النجاح العام
  lastScheduleScrollYRef: React.MutableRefObject<number>; // 📍 مرجع موضع التمرير

  // 🪟 حالات مودال المحاضرة
  isLectureModalOpen: boolean; // 🪟 حالة فتح المودال
  setIsLectureModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الفتح
  editingLectureId: string | null; // 🆔 معرف المحاضرة للتعديل
  setEditingLectureId: React.Dispatch<React.SetStateAction<string | null>>; // 🔄 تحديث المعرف
  recentlyAddedLectureId: string | null; // 🌟 معرف المحاضرة المضافة للتو

  // 📝 حقول استمارة المحاضرة
  lecDay: DayOfWeek | ''; // 🗓️ اليوم
  setLecDay: React.Dispatch<React.SetStateAction<DayOfWeek | ''>>; // 🔄 تحديث اليوم
  lecStartTime: string; // ⏰ وقت البدء
  setLecStartTime: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث وقت البدء
  lecEndTime: string; // ⏰ وقت الانتهاء
  setLecEndTime: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث وقت الانتهاء
  lecRoom: string; // 🏛️ القاعة
  setLecRoom: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث القاعة
  lecCourseId: string; // 📚 معرف المادة
  setLecCourseId: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث معرف المادة
  lecTeacherId: string; // 👨‍🏫 معرف الأستاذ
  setLecTeacherId: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث معرف الأستاذ
  lecType: LectureType | ''; // 🔬 نوع المحاضرة
  setLecType: React.Dispatch<React.SetStateAction<LectureType | ''>>; // 🔄 تحديث نوع المحاضرة
  lecColor: LectureColor; // 🎨 لون المحاضرة
  setLecColor: React.Dispatch<React.SetStateAction<LectureColor>>; // 🔄 تحديث لون المحاضرة
  lecNotes: string; // 📝 ملاحظات المحاضرة
  setLecNotes: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الملاحظات
  lecDate: string; // 📅 تاريخ المحاضرة
  setLecDate: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث التاريخ
  lecWeekNumber: number; // 🔢 رقم الأسبوع
  setLecWeekNumber: React.Dispatch<React.SetStateAction<number>>; // 🔄 تحديث رقم الأسبوع
  lecStudyType: 'morning' | 'evening'; // ☀️🌙 فترة الدراسة
  setLecStudyType: React.Dispatch<React.SetStateAction<'morning' | 'evening'>>; // 🔄 تحديث فترة الدراسة
  lecAutoCascadeWeeks: boolean; // 🔄 تكرار لكافة الأسابيع
  setLecAutoCascadeWeeks: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث التكرار
  lecCascadeShiftOption: 'cascade_following' | 'this_week_only' | 'all_15_weeks'; // 🔀 نمط التعديل
  setLecCascadeShiftOption: React.Dispatch<React.SetStateAction<'cascade_following' | 'this_week_only' | 'all_15_weeks'>>; // 🔄 تحديث نمط التعديل
  lecWeeksScope?: 'all_15_weeks' | 'this_week_only' | 'odd_weeks' | 'even_weeks' | 'custom_pick'; // 🔢 نطاق الأسابيع المعتمدة للمحاضرة
  setLecWeeksScope?: React.Dispatch<React.SetStateAction<'all_15_weeks' | 'this_week_only' | 'odd_weeks' | 'even_weeks' | 'custom_pick'>>; // 🔄 تحديث نطاق الأسابيع
  lecCustomWeeks?: number[]; // 📋 قائمة الأسابيع المخصصة للمحاضرة
  setLecCustomWeeks?: React.Dispatch<React.SetStateAction<number[]>>; // 🔄 تحديث قائمة الأسابيع
  closeModalAfterSave: boolean; // 🚪 إغلاق بعد الحفظ
  setCloseModalAfterSave: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الإغلاق بعد الحفظ
  lecCourseSearchTerm: string; // 🔍 بحث المادة
  setLecCourseSearchTerm: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث المادة
  lecCourseTabFilter: 'all' | 'theory' | 'practical'; // 🏷️ تصفية المادة
  setLecCourseTabFilter: React.Dispatch<React.SetStateAction<'all' | 'theory' | 'practical'>>; // 🔄 تحديث تصفية المادة
  lecTeacherSearchTerm: string; // 🔍 بحث الأستاذ
  setLecTeacherSearchTerm: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث الأستاذ
  lecTargetGroup: string; // 👥 الكروب أو الشعبة المستهدفة للمحاضرة
  setLecTargetGroup: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث الكروب المستهدف
  stageGroupConfigs?: StageGroupConfig[]; // ⚙️ إعدادات كروبات المراحل الأكاديمية
  lecModalSuccessMsg: string; // 💬 رسالة نجاح الحفظ بالمودال
  setLecModalSuccessMsg: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث رسالة النجاح
}

// 🏛️ مكون تبويب إدارة الجدول الأسبوعي الأكاديمي
export const DepartmentScheduleTab: React.FC<DepartmentScheduleTabProps> = ({
  deptName,
  currentDeptId,
  courses,
  deptCourses,
  deptTeachers,
  teacherCourses,
  scheduleLectures,
  currentScheduleConfig,
  scheduleCurrentAcademicWeek,

  selectedScheduleStage,
  setSelectedScheduleStage,
  selectedScheduleSemester,
  setSelectedScheduleSemester,
  selectedScheduleStudyType,
  setSelectedScheduleStudyType,
  selectedScheduleWeek,
  setSelectedScheduleWeek,
  selectedScheduleGroup: selectedScheduleGroupProp,
  setSelectedScheduleGroup: setSelectedScheduleGroupProp,
  selectedScheduleLectureIds,
  setSelectedScheduleLectureIds,

  currentLecConflicts,

  handleDownloadScheduleTemplate,
  setShowScheduleExcelInstructions,
  handleScheduleExcelUpload,
  isImportingScheduleExcel,
  handleExportScheduleToExcel,
  setIsPreviewScheduleModalOpen,
  setIsSchedulePrintModalOpen,
  handleBulkDeleteScheduleLectures,
  handleToggleWorkingDay,
  setPendingSemesterStartDate,
  setShowSemesterDateConfirmModal,

  isLectureInCurrentDept,
  handleEditLecture,
  handleDeleteLecture,
  handleDeleteLectureForWeek, // 🚫 دالة إلغاء المحاضرة لهذا الأسبوع فقط
  handleSaveLecture,
  handleSaveSemesterStartDate,
  resetLectureModalState,
  setSuccessMessage,
  lastScheduleScrollYRef,

  isLectureModalOpen,
  setIsLectureModalOpen,
  editingLectureId,
  setEditingLectureId,
  recentlyAddedLectureId,

  lecDay,
  setLecDay,
  lecStartTime,
  setLecStartTime,
  lecEndTime,
  setLecEndTime,
  lecRoom,
  setLecRoom,
  lecCourseId,
  setLecCourseId,
  lecTeacherId,
  setLecTeacherId,
  lecType,
  setLecType,
  lecColor,
  setLecColor,
  lecNotes,
  setLecNotes,
  lecDate,
  setLecDate,
  lecWeekNumber,
  setLecWeekNumber,
  lecStudyType,
  setLecStudyType,
  lecAutoCascadeWeeks,
  setLecAutoCascadeWeeks,
  lecCascadeShiftOption,
  setLecCascadeShiftOption,
  lecWeeksScope, // 🔢 نطاق الأسابيع المعتمدة
  setLecWeeksScope, // 🔄 تحديث نطاق الأسابيع
  lecCustomWeeks, // 📋 قائمة الأسابيع المخصصة
  setLecCustomWeeks, // 🔄 تحديث قائمة الأسابيع
  closeModalAfterSave,
  setCloseModalAfterSave,
  lecCourseSearchTerm,
  setLecCourseSearchTerm,
  lecCourseTabFilter,
  setLecCourseTabFilter,
  lecTeacherSearchTerm,
  setLecTeacherSearchTerm,
  lecTargetGroup,
  setLecTargetGroup,
  stageGroupConfigs,
  lecModalSuccessMsg,
  setLecModalSuccessMsg,
}) => {
  // 👥 حالة الكروب المختار مع دعم التمرير من الهوك الخارجي أو الحالة المحلية
  const [localScheduleGroup, setLocalScheduleGroup] = useState<string>('all');
  const selectedScheduleGroup = selectedScheduleGroupProp !== undefined ? selectedScheduleGroupProp : localScheduleGroup;
  const setSelectedScheduleGroup = setSelectedScheduleGroupProp || setLocalScheduleGroup;

  // 🔄 مزامنة الكروب الافتراضي داخل التبويب لضمان التوافق التام (كروب أول عند وجود كروبات، وشعبة موحدة عند عدم وجودها)
  useEffect(() => {
    // 🔍 البحث عن إعدادات المرحلة الحالية
    const currentCfg = stageGroupConfigs?.find(
      (c) => c.stage_number === selectedScheduleStage && c.study_type === selectedScheduleStudyType
    );
    // ⚙️ التحقق من وجود كروبات معتمدة بالمرحلة
    if (currentCfg && currentCfg.has_groups && currentCfg.groups && currentCfg.groups.length > 0) {
      // 🎯 اختيار الكروب الأول إذا كان الكروب الحالي غير موجود أو مضبوط على all
      if (selectedScheduleGroup === 'all' || !currentCfg.groups.includes(selectedScheduleGroup)) {
        setSelectedScheduleGroup(currentCfg.groups[0]); // 🥇 تعيين الكروب الأول افتراضياً
      }
    } else {
      // 🛑 إذا كانت المرحلة شعبة موحدة نرجع الكروب تلقائياً إلى all
      if (selectedScheduleGroup !== 'all') {
        setSelectedScheduleGroup('all'); // 🔄 تصفير الكروب إلى شعبة موحدة
      }
    }
  }, [stageGroupConfigs, selectedScheduleStage, selectedScheduleStudyType, selectedScheduleGroup, setSelectedScheduleGroup]);

  // 🔍 استخراج إعدادات الكروبات للمرحلة والدوام المحددين مركزياً للتبويب
  const currentStageConfig = useMemo(() => {
    return stageGroupConfigs?.find(
      (c) => c.stage_number === selectedScheduleStage && (c.study_type || 'morning') === (selectedScheduleStudyType || 'morning')
    );
  }, [stageGroupConfigs, selectedScheduleStage, selectedScheduleStudyType]);

  // ⚙️ استخراج قائمة الكروبات المعتمدة للمرحلة الحالية
  const stageGroupsList: string[] = useMemo(() => {
    const rawGroups = currentStageConfig?.groups || currentStageConfig?.group_names || [];
    return currentStageConfig && currentStageConfig.has_groups && currentStageConfig.group_count > 0 && rawGroups.length > 0
      ? rawGroups
      : [];
  }, [currentStageConfig]);

  // 👥 الكروب الفعال للعرض والعزل الصارم
  const activeScheduleGroup = stageGroupsList.length > 0
    ? (selectedScheduleGroup !== 'all' ? selectedScheduleGroup : stageGroupsList[0])
    : 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 🧭 الرأس والشريط العلوي لإدارة الجدول الأسبوعي بتوزيع هندسي متناسق وأزرار مرتبة */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            {/* 🏷️ الهيدر التعريفي وعنوان إدارة الجداول */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-4 py-1.5 bg-[#0F2942] text-white font-black text-sm sm:text-base rounded-xl shadow-xs flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-300" /> {/* ⏰ أيقونة الساعة الزرقاء */}
                  <span>نظام إدارة الجداول الأسبوعية والمخطط الزمني</span> {/* 🏷️ عنوان النظام */}
                </span>
                <span className="px-4 py-1.5 bg-gradient-to-r from-[#0F2942] to-[#163a5f] text-white font-black text-sm sm:text-base rounded-xl shadow-xs border border-blue-400/30 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-300 shrink-0" /> {/* 🎓 أيقونة التخرج */}
                  <span>قسم {deptName}</span> {/* 🏢 اسم القسم الحالي */}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                إدارة مواقيت المحاضرات وأيام الدوام والعطل الأسبوعية {/* 📌 العنوان الرئيسي المعتمد */}
              </h2>
              <p className="text-base sm:text-lg font-black text-slate-800 mt-1 leading-relaxed">
                تخصيص كامل لأيام الدوام والعطل لكل مرحلة، وجدولة المحاضرات والقاعات وتعيين الأساتذة مع ربط مباشر مع جداول الطلاب {/* 📝 الوصف التوضيحي للجدول */}
              </p>
            </div>

            {/* 🛠️ شريط أزرار العمليات المنسقة بالكامل بلون الكحلي الملكي الموحد وفق رغبة المستخدم */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
              {/* 1️⃣ إضافة محاضرة جديدة (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع الإرسال العفوي
                onClick={() => {
                  // 📍 تسجيل موضع السكرول الحالي للصفحة فوراً قبل فتح المودال حتى نرجعله بدقة
                  if (typeof window !== 'undefined') {
                    lastScheduleScrollYRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; // 📌 تثبيت موضع الصفحة
                  }
                  resetLectureModalState(); // 🧹 تصفير كافة الحقول والتواريخ والأوقات لتبدأ غير محددة
                  if (stageGroupsList.length > 0) {
                    setLecTargetGroup(activeScheduleGroup); // 👥 تعيين الكروب المختار تلقائياً
                  } else {
                    setLecTargetGroup('all'); // 👥 تعيين شعبة موحدة
                  }
                  setIsLectureModalOpen(true); // 🚀 فتح نافذة المودال فورياً
                }}
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="إضافة محاضرة دراسية جديدة إلى الجدول الأسبوعي" // 💡 تلميح الزر
              >
                <Plus className="w-5 h-5 text-cyan-300" /> {/* ➕ أيقونة الإضافة الزرقاء */}
                <span>إضافة محاضرة جديدة</span> {/* 📝 نص الزر المعتمد */}
              </button>

              {/* 2️⃣ زر تنزيل نموذج Excel (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleDownloadScheduleTemplate} // ⚡ تشغيل دالة تنزيل قالب جدول المحاضرات
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تنزيل نموذج Excel المعتمد لمحاضرات الجدول الأسبوعي للقسم" // 💡 نص التلميح
              >
                <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                <span>نموذج Excel</span> {/* 📝 نص الزر */}
              </button>

              {/* 3️⃣ زر تعليمات الاستيراد (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={() => setShowScheduleExcelInstructions(true)} // ⚡ فتح نافذة التعليمات للجدول
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تعليمات وضوابط استيراد محاضرات الجدول الأسبوعي" // 💡 نص التلميح
              >
                <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                <span>التعليمات</span> {/* 📝 نص الزر */}
              </button>

              {/* 4️⃣ زر استيراد ملف Excel (كحلي ملكي) */}
              <label className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0"> {/* 🎨 تصميم كحلي ملكي موحد */}
                <Upload className="w-5 h-5 text-cyan-300" /> {/* 📤 أيقونة الرفع بلون سماوي زاهي */}
                <span>{isImportingScheduleExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span> {/* 📝 نص الزر */}
                <input
                  type="file" // 📁 مدخل ملف إكسل
                  accept=".xlsx, .xls" // 📋 الامتدادات المدعومة
                  onChange={handleScheduleExcelUpload} // ⚡ معالج رفع وقراءة الملف
                  disabled={isImportingScheduleExcel} // 🔒 قفل الحقل أثناء المعالجة
                  className="hidden" // 👁️ إخفاء المدخل الأصلي
                />
              </label>

              {/* 5️⃣ زر تصدير جدول المحاضرات إلى Excel (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleExportScheduleToExcel} // ⚡ تصدير الجدول لملف إكسل معتمد
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تصدير جدول محاضرات القسم الحالي بالكامل إلى ملف Excel" // 💡 نص التلميح
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" /> {/* 📊 أيقونة الإكسل بلون زمردي زاهي */}
                <span>تصدير Excel</span> {/* 📝 نص الزر */}
              </button>

              {/* 6️⃣ زر معاينة جدول الطلاب (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع الإرسال التلقائي للنموذج
                onClick={() => setIsPreviewScheduleModalOpen(true)} // ⚡ فتح نافذة معاينة جدول الطلاب
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="معاينة جدول الطلاب" // 💡 تلميح زر المعاينة
              >
                <Eye className="w-5 h-5 text-cyan-300" /> {/* 👁️ أيقونة المعاينة بلون سماوي زاهٍ */}
                <span>معاينة جدول الطلاب</span> {/* 📝 نص الزر المحدث وفق رغبة المستخدم */}
              </button>

              {/* 7️⃣ زر طباعة جدول المحاضرات الأسبوعي المعتمد PDF (كحلي ملكي) */}
              <button
                type="button" // 🔘 نوع الزر لمنع الإرسال
                onClick={() => setIsSchedulePrintModalOpen(true)} // ⚡ فتح نافذة طباعة الجدول
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="طباعة وتصدير وثيقة جدول المحاضرات الأسبوعي المعتمد بصيغة PDF" // 💡 تلميح زر الطباعة
              >
                <Printer className="w-5 h-5 text-rose-300" /> {/* 🖨️ أيقونة الطابعة بلون وردي زاهي */}
                <span>طباعة جدول المحاضرات PDF</span> {/* 📝 نص زر الطباعة الرسمي */}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 📅 1. كارد التقويم الأكاديمي المعتمد للفصل الدراسي (15 أسبوعاً — مسار بولونيا) بالبداية */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-[#0F2942] border border-blue-200 rounded-2xl shadow-2xs">
                  <CalendarDays className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-slate-950">
                      التقويم الأكاديمي المعتمد للفصل الدراسي (15 أسبوعاً — مسار بولونيا)
                    </h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-950 border border-emerald-400 font-black text-xs sm:text-sm rounded-full flex items-center shadow-2xs">
                      <span>الأسبوع الحالي: {scheduleCurrentAcademicWeek} من 15</span>
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-black mt-1">
                    {/* 🗓️ توضيح عراقي: نص يبين حساب التواريخ التلقائي لكل أسبوع بدون سالفة الحفظ السحابي والمحلي بلون أسود وحجم مكبر قليلاً */}
                    حساب ذكي وتلقائي للتواريخ وفق الفارق الزمني (+7 أيام لكل أسبوع)
                  </p>
                </div>
              </div>

              {/* 📆 محدد ومعدل تاريخ انطلاق الفصل الدراسي بتصميم كحلي ملكي فاخر وأكاديمي متناسق */}
              <div className="flex items-center gap-3 bg-slate-50/90 hover:bg-slate-50 px-3 py-2 rounded-2xl border border-slate-300 shadow-2xs transition-all">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-1.5 bg-[#0F2942] text-cyan-300 rounded-lg shrink-0 border border-[#0F2942] shadow-2xs">
                    <CalendarDays className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-sm font-black text-slate-950 whitespace-nowrap">
                    تاريخ انطلاق الفصل (الأسبوع 1):
                  </span>
                </div>
                <div className="w-60 sm:w-68 shrink-0">
                  <ArabicDatePicker
                    value={currentScheduleConfig.start_date || '2026-09-20'}
                    onChange={(newDate) => {
                      // 🛡️ فحص إذا كان التاريخ مختلفاً لإظهار نافذة التأكيد الاحترافية
                      if (!newDate || newDate === (currentScheduleConfig.start_date || '2026-09-20')) return;
                      setPendingSemesterStartDate(newDate); // 📅 تعيين التاريخ المؤقت الجديد
                      setShowSemesterDateConfirmModal(true); // 🛑 فتح نافذة التأكيد الفاخرة
                    }}
                    placeholder="حدد تاريخ الانطلاق"
                    variant="royal-navy" // 👑 تطبيق النمط الكحلي الملكي الفاخر
                  />
                </div>
              </div>
            </div>

            {/* أشرطة الأسابيع الـ 15 الأفقية */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((wNum) => {
                const isSel = selectedScheduleWeek === wNum;
                const isCurr = scheduleCurrentAcademicWeek === wNum;
                const baseD = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ انطلاق الفصل المعتمد للقسم
                const baseDayKey = getDayOfWeekFromDateString(baseD); // 🗓️ اليوم الأكاديمي المعتمد لتاريخ الانطلاق (مثلاً الأحد)
                const weekStartDate = calculateDateForAnyDayInWeek(baseD, 1, wNum, baseDayKey); // 📅 احتساب تاريخ هذا الأسبوع المتطابق تماماً مع يوم وتاريخ الانطلاق (+7 أيام لكل أسبوع)
                const p = weekStartDate.split('-'); // ✂️ تفكيك التاريخ لاستخراج اليوم والشهر
                const dNum = p.length === 3 ? parseInt(p[2], 10) : ''; // 🔢 رقم اليوم
                const mName = p.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || '') : ''; // 🏷️ اسم الشهر العراقي المعتمد

                return (
                  <button
                    key={wNum}
                    type="button"
                    onClick={() => setSelectedScheduleWeek(wNum)}
                    className={`py-2 px-1.5 rounded-2xl text-center font-black transition-all cursor-pointer border-2 flex flex-col items-center justify-between min-h-[74px] sm:min-h-[78px] ${
                      isSel
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-blue-500/20'
                        : isCurr
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:bg-emerald-100 shadow-2xs'
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
                    <div className="text-base sm:text-lg font-black font-mono leading-none my-0.5">
                      {wNum}
                    </div>
                    {/* 📅 تكبير نص التاريخ للشهر واليوم ليكون مقروءاً وبخط داكن عريض */}
                    <div className={`text-[11px] sm:text-xs font-black leading-tight mt-0.5 ${isSel ? 'text-cyan-200' : 'text-slate-950'}`}>
                      {dNum} {mName.substring(0, 5)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* تفاصيل وتواريخ أيام الأسبوع المختار */}
            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-black text-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-[#0F2942]">
                  نطاق تواريخ الأسبوع {selectedScheduleWeek}:
                </span>
                <span className="text-blue-950 font-black">
                  {formatDateArabicWithDay(calculateDateForAnyDayInWeek(currentScheduleConfig.start_date || '2026-09-20', 1, selectedScheduleWeek, 'saturday'))}
                  {' إلى '}
                  {formatDateArabicWithDay(calculateDateForAnyDayInWeek(currentScheduleConfig.start_date || '2026-09-20', 1, selectedScheduleWeek, 'thursday'))}
                </span>
              </div>
              {selectedScheduleWeek !== scheduleCurrentAcademicWeek && (
                <button
                  type="button"
                  onClick={() => setSelectedScheduleWeek(scheduleCurrentAcademicWeek)}
                  className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:bg-[#1a3d5e]"
                >
                  <span>الانتقال للأسبوع الحالي ({scheduleCurrentAcademicWeek})</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🎛️ 2. كارد تحديد المرحلة والكورس الدراسي والفترة بتصميم هندسي راقٍ بسطر واحد */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-3xl shadow-2xs flex flex-wrap xl:flex-nowrap items-center justify-between gap-4">
            
            {/* محدد المرحلة */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                <GraduationCap className="w-5 h-5 text-[#0F2942]" />
                <span>المرحلة:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-nowrap">
                {[
                  { num: 1, name: 'المرحلة الأولى' },
                  { num: 2, name: 'المرحلة الثانية' },
                  { num: 3, name: 'المرحلة الثالثة' },
                  { num: 4, name: 'المرحلة الرابعة' },
                ].map((stg) => {
                  // 📊 حساب عدد محاضرات المرحلة الأكاديمية بدقة ومرونة للقسم الحالي
                  const stgCount = scheduleLectures.filter(
                    (l) => isLectureInCurrentDept(l) && l.stage_number === stg.num
                  ).length;
                  const isSel = selectedScheduleStage === stg.num;
                  return (
                    <button
                      key={stg.num}
                      type="button"
                      onClick={() => {
                        setSelectedScheduleStage(stg.num);
                        setEditingLectureId(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        isSel
                          ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <span>{stg.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          isSel
                            ? 'bg-white/20 text-white border-white/30'
                            : stgCount > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`${stgCount} محاضرة مجدولة لكافة كورسات وفترات ${stg.name}`}
                      >
                        {stgCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* محدد الكورس */}
            {(() => {
              // 📊 حساب عدد محاضرات الكورس الأول للمرحلة المحددة
              const sem1Count = scheduleLectures.filter(
                (l) =>
                  isLectureInCurrentDept(l) &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === 1
              ).length;
              // 📊 حساب عدد محاضرات الكورس الثاني للمرحلة المحددة
              const sem2Count = scheduleLectures.filter(
                (l) =>
                  isLectureInCurrentDept(l) &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === 2
              ).length;

              return (
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <Layers className="w-5 h-5 text-[#0F2942]" />
                    <span>الكورس:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedScheduleSemester(1);
                        setEditingLectureId(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        selectedScheduleSemester === 1
                          ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <span>الكورس الأول</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          selectedScheduleSemester === 1
                            ? 'bg-white/20 text-white border-white/30'
                            : sem1Count > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`${sem1Count} محاضرة مجدولة في الكورس الأول للمرحلة ${getStageNameInArabic(selectedScheduleStage)}`}
                      >
                        {sem1Count}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedScheduleSemester(2);
                        setEditingLectureId(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        selectedScheduleSemester === 2
                          ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <span>الكورس الثاني</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          selectedScheduleSemester === 2
                            ? 'bg-white/20 text-white border-white/30'
                            : sem2Count > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`${sem2Count} محاضرة مجدولة في الكورس الثاني للمرحلة ${getStageNameInArabic(selectedScheduleStage)}`}
                      >
                        {sem2Count}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* محدد الفترة الدراسية (الصباحي / المسائي) */}
            {(() => {
              // ☀️ حساب عدد محاضرات الفترة الصباحية للقسم الحالي
              const morningCount = scheduleLectures.filter(
                (l) =>
                  isLectureInCurrentDept(l) &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === selectedScheduleSemester &&
                  (l.study_type || 'morning') === 'morning'
              ).length;
              // 🌙 حساب عدد محاضرات الفترة المسائية للقسم الحالي
              const eveningCount = scheduleLectures.filter(
                (l) =>
                  isLectureInCurrentDept(l) &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === selectedScheduleSemester &&
                  (l.study_type || 'morning') === 'evening'
              ).length;

              return (
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-5 h-5 text-[#0F2942]" />
                    <span>الفترة:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedScheduleStudyType('morning')}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        selectedScheduleStudyType === 'morning'
                          ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-[#0F2942]/20 border border-[#163a5f]'
                          : 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Sun className="w-4 h-4 shrink-0" />
                      <span>الصباحي</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          selectedScheduleStudyType === 'morning'
                            ? 'bg-white/20 text-white border-white/30'
                            : morningCount > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`${morningCount} محاضرة صباحية مجدولة للمرحلة ${getStageNameInArabic(selectedScheduleStage)} (الكورس ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'})`}
                      >
                        {morningCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedScheduleStudyType('evening')}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        selectedScheduleStudyType === 'evening'
                          ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-[#0F2942]/20 border border-[#163a5f]'
                          : 'bg-white text-slate-950 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Moon className="w-4 h-4 shrink-0" />
                      <span>المسائي</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border transition-all ${
                          selectedScheduleStudyType === 'evening'
                            ? 'bg-white/20 text-white border-white/30'
                            : eveningCount > 0
                            ? 'bg-blue-100 text-blue-950 border-blue-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={`${eveningCount} محاضرة مسائية مجدولة للمرحلة ${getStageNameInArabic(selectedScheduleStage)} (الكورس ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'})`}
                      >
                        {eveningCount}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* ========================================================================= */}
          {/* 👥 3. كارد اختيار جدول الكروب الأسبوعي الخاص لكل مرحلة (جداول مستقلة وخاصة 100%) */}
          {/* ========================================================================= */}
          {(() => {
            // 🔍 استخراج إعدادات الكروبات للمرحلة والدوام المحددين بدقة عالية
            const currentStageConfig = stageGroupConfigs?.find(
              (c) => c.stage_number === selectedScheduleStage && (c.study_type || 'morning') === (selectedScheduleStudyType || 'morning')
            );
            const rawGroups: string[] = currentStageConfig?.groups || currentStageConfig?.group_names || []; // 📋 استخراج أسماء الكروبات
            // ⚙️ فحص هل المرحلة مقسمة لكروبات وفيها كروبات معتمدة
            const stageGroupsList: string[] = currentStageConfig && currentStageConfig.has_groups && currentStageConfig.group_count > 0 && rawGroups.length > 0
              ? rawGroups // ✨ استخدام كروبات المرحلة المعتمدة فقط
              : []; // 🛑 مصفوفة فارغة إذا كانت المرحلة شعبة موحدة

            // 🛑 في حال كانت المرحلة غير مقسمة لكروبات (شعبة موحدة) نعرض تنبيهاً واضحاً ومميزاً
            if (stageGroupsList.length === 0) {
              return (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-blue-50/80 border-2 border-blue-200/90 rounded-3xl shadow-xs flex items-center justify-between gap-3 flex-wrap">
                  {/* 📢 الحاوية النصية الرئيسية مع الأيقونة الفيكتورية النقية */}
                  <div className="flex items-center gap-3">
                    {/* 🎨 مربع الأيقونة بالكحلي الملكي */}
                    <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-2xs shrink-0">
                      <GroupScheduleSvg className="w-5 h-5 text-cyan-300" /> {/* 👥 أيقونة الشعبة الموحدة */}
                    </div>
                    {/* 🔤 النصوص التوضيحية البارزة والواضحة */}
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-[#0F2942] flex items-center gap-2">
                        <span>لا يوجد كروبات لهذه المرحلة — جدول دراسي لشعبة موحدة</span> {/* 📢 توضيح عدم وجود كروبات صريح وواضح */}
                      </h4>
                      <p className="text-xs sm:text-sm font-black text-black mt-0.5">
                        جدول دراسي موحد يشمل جميع طلبة المرحلة بدون تقسيم لكروبات فرعية {/* 📝 وصف توضيحي إضافي بلون أسود صريح */}
                      </p>
                    </div>
                  </div>
                  {/* 🏷️ باج الشعبة الموحدة بتصميم كحلي ملكي راقٍ ونص أبيض صريح */}
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-xs sm:text-sm font-black shadow-2xs flex items-center gap-1.5">
                      <GroupUsersSvg className="w-4 h-4 text-cyan-300" /> {/* 👥 أيقونة الأعضاء بلون سماوي */}
                      <span className="text-white font-black">شعبة موحدة</span> {/* 🏷️ باج الشعبة الموحدة بنص أبيض صريح */}
                    </span>
                  </div>
                </div>
              );
            }

            // 🎯 في حال كانت المرحلة مقسمة لكروبات، نعرض تبويبات الجداول المستقلة لكل كروب
            return (
              <div className="p-4 bg-white border border-slate-300 rounded-3xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <GroupScheduleSvg className="w-5 h-5 text-[#0F2942]" /> {/* 👥 أيقونة الجداول الفيكتورية بالكحلي الملكي */}
                    <span>عرض جدول الكروب الأسبوعي:</span> {/* 🏷️ عنوان التصفية */}
                  </span>

                  {/* 👥 أزرار جداول الكروبات الخاصة والمستقلة حصراً A, B, C... بتصميم كحلي ملكي راقٍ وأيقونات SVG نقية */}
                  {stageGroupsList.map((grpName: string) => {
                    const isSel = (selectedScheduleGroup === 'all' ? stageGroupsList[0] : selectedScheduleGroup) === grpName; // 🔍 فحص هل تم اختيار هذا الكروب
                    // 🔢 احتساب محاضرات هذا الكروب حصراً بعزل تام وبدون أي دمج
                    const grpLecsCount = scheduleLectures.filter(
                      (l) =>
                        isLectureInCurrentDept(l) &&
                        l.stage_number === selectedScheduleStage &&
                        l.semester === selectedScheduleSemester &&
                        (l.study_type || 'morning') === selectedScheduleStudyType &&
                        l.target_group === grpName // 🎯 فحص تطابق الكروب حصراً
                    ).length;

                    return (
                      <button
                        key={grpName} // 🔑 معرف فريد للكروب
                        type="button" // 🔘 نوع الزر
                        onClick={() => setSelectedScheduleGroup(grpName)} // ⚡ تفعيل جدول هذا الكروب فقط
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                          isSel
                            ? 'bg-[#0F2942] hover:bg-[#163a5f] text-white shadow-md ring-2 ring-blue-400/30' // 🎨 تمييز زر الكروب المحدد بالكحلي الملكي الفاخر
                            : 'bg-slate-50 hover:bg-slate-100 text-[#0F2942] border border-slate-300 shadow-2xs' // ⚪ مظهر الكروب غير المحدد بألوان كحلية راقية
                        }`}
                      >
                        <GroupBadgeSvg className={`w-4 h-4 shrink-0 ${isSel ? 'text-cyan-300' : 'text-[#0F2942]'}`} /> {/* 🏷️ أيقونة الكروب الفيكتورية SVG */}
                        <span>جدول كروب {grpName}</span> {/* 🔤 اسم جدول الكروب */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                            isSel
                              ? 'bg-white/20 text-cyan-200 border border-white/20' // 🔢 عداد الكروب المحدد بلون سماوي مبهج
                              : 'bg-white text-[#0F2942] border border-slate-300' // 🔢 عداد الكروب غير المحدد
                          }`}
                        >
                          {grpLecsCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 💬 إشعار تعريفي يوضح استقلالية جدول الكروب المعروض بتصميم احترافي */}
                <div className="text-xs font-black text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
                  <GroupBadgeSvg className="w-4 h-4 text-[#0F2942] shrink-0" /> {/* 👥 أيقونة الكروب الفيكتورية */}
                  <span>يتم استعراض جدول محاضرات (كروب {selectedScheduleGroup !== 'all' ? selectedScheduleGroup : stageGroupsList[0]}) حصراً بشكل مستقل</span> {/* 📢 إشعار جدول الكروب المنفصل */}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 🏖️ 1. كارت إدارة أيام الدوام والعطل الأسبوعية الرسمية */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
              <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl shadow-2xs">
                <Sun className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تحديد أيام الدوام والعطل الأسبوعية {/* 📌 العنوان الرئيسي لكارت أيام الدوام */}
                  </h3>

                  {/* 🎓 وسم المرحلة الدراسية بنمط أزرق أكاديمي موحد */}
                  <span className="px-3 py-1 bg-blue-50 text-[#0F2942] border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 🎓 أيقونة المرحلة الأكاديمية */}
                    <span>المرحلة {getStageNameInArabic(selectedScheduleStage)}</span> {/* 🏷️ اسم المرحلة المختارة */}
                  </span>

                  {/* 👥 وسم الكروب أو الشعبة الموحدة بنفس النمط واللون الموحد */}
                  {stageGroupsList.length > 0 && selectedScheduleGroup !== 'all' ? (
                    <span className="px-3 py-1 bg-blue-50 text-[#0F2942] border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <GroupBadgeSvg className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 👥 أيقونة الكروب الفيكتورية */}
                      <span>جدول كروب {selectedScheduleGroup}</span> {/* 🏷️ اسم الكروب المحدد */}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-50 text-[#0F2942] border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <GroupUsersSvg className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 👥 أيقونة الشعبة الموحدة */}
                      <span>شعبة موحدة</span> {/* 🏷️ باج الشعبة الموحدة */}
                    </span>
                  )}

                  {/* 📚 وسم الكورس الدراسي بنفس النمط واللون الموحد */}
                  <span className="px-3 py-1 bg-blue-50 text-[#0F2942] border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-blue-700 shrink-0" /> {/* 📚 أيقونة الكورس الدراسي */}
                    <span>الكورس {selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'}</span> {/* 🏷️ رقم الكورس الدراسي */}
                  </span>

                  {/* ☀️🌙 وسم الفترة الدراسية بنفس النمط واللون الموحد */}
                  <span className="px-3 py-1 bg-blue-50 text-[#0F2942] border border-blue-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                    {selectedScheduleStudyType === 'evening' ? (
                      <Moon className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    )}
                    <span>{selectedScheduleStudyType === 'evening' ? 'المسائي' : 'الصباحي'}</span> {/* 🏷️ الفترة الدراسية */}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-1">
                  اضغط على أي يوم لطلب تعديل حالته بين دوام رسمي أو عطلة رسمية مع نافذة تأكيد وموافقة مسبقة
                </p>
              </div>
            </div>

            {/* بطاقات الأيام الـ 7 التفاعلية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {DAYS_OF_WEEK_LIST.map((d) => {
                const isOff = currentScheduleConfig.off_days.includes(d.key);
                // 📅 حساب عدد محاضرات هذا اليوم بدقة ومرونة للقسم والكروب المختار حصراً
                const dayLecCount = scheduleLectures.filter(
                  (l) =>
                    isLectureInCurrentDept(l) &&
                    l.stage_number === selectedScheduleStage &&
                    l.semester === selectedScheduleSemester &&
                    (l.study_type || 'morning') === selectedScheduleStudyType &&
                    (stageGroupsList.length > 0 ? l.target_group === activeScheduleGroup : true) &&
                    l.day === d.key
                ).length;

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleToggleWorkingDay(d.key)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center relative cursor-pointer group ${
                      isOff
                        ? 'bg-slate-100/90 border-slate-300 text-slate-950 hover:bg-slate-200 shadow-2xs'
                        : 'bg-emerald-50/90 border-emerald-400 text-emerald-950 hover:bg-emerald-100/90 shadow-2xs'
                    }`}
                  >
                    <div className="w-full text-center">
                      <span className="text-lg sm:text-xl font-black text-slate-950 block">{d.label_ar}</span>
                      {(() => {
                        const dayCalcDate = calculateDateForAnyDayInWeek(currentScheduleConfig.start_date || '2026-09-20', 1, selectedScheduleWeek, d.key);
                        const p = dayCalcDate.split('-');
                        const formattedDayDate = p.length === 3 ? `${parseInt(p[2], 10)} ${IRAQI_ARABIC_MONTHS[parseInt(p[1], 10) - 1] || ''}` : '';
                        return (
                          <span className="text-xs sm:text-sm font-black text-slate-700 mt-1 block">
                            {formattedDayDate}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="my-3">
                      {isOff ? (
                        <span className="px-3.5 py-1.5 bg-slate-800 text-white font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <Coffee className="w-4 h-4 text-slate-200" />
                          <span>عطلة رسمية</span>
                        </span>
                      ) : (
                        <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                          <span>دوام رسمي</span>
                        </span>
                      )}
                    </div>

                    <span className="text-sm sm:text-base font-black text-slate-950">
                      {isOff ? 'لا توجد محاضرات' : `${dayLecCount} محاضرة مجدولة`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>


        {/* 🪟 استدعاء مودال إضافة وتعديل واستعراض المحاضرات الأسبوعية المستقل */}
        <LectureModal
          isOpen={isLectureModalOpen}
          onClose={() => {
            const savedY: number = lastScheduleScrollYRef.current;
            setIsLectureModalOpen(false);
            setEditingLectureId(null);
            setLecRoom('');
            setLecNotes('');
            setLecModalSuccessMsg('');
            setTimeout(() => {
              window.scrollTo({ top: savedY, behavior: 'instant' });
            }, 10);
          }}
          isLectureModalOpen={isLectureModalOpen}
          setIsLectureModalOpen={setIsLectureModalOpen}
          editingLectureId={editingLectureId}
          setEditingLectureId={setEditingLectureId}
          selectedScheduleStage={selectedScheduleStage}
          setSelectedScheduleStage={setSelectedScheduleStage}
          selectedScheduleSemester={selectedScheduleSemester}
          setSelectedScheduleSemester={setSelectedScheduleSemester}
          deptName={deptName}
          currentDeptId={currentDeptId}
          courses={courses}
          deptCourses={deptCourses}
          deptTeachers={deptTeachers}
          teacherCourses={teacherCourses}
          scheduleLectures={scheduleLectures}
          currentScheduleConfig={currentScheduleConfig}
          selectedScheduleWeek={selectedScheduleWeek}
          currentLecConflicts={currentLecConflicts}
          recentlyAddedLectureId={recentlyAddedLectureId}
          handleSaveLecture={handleSaveLecture}
          handleDeleteLecture={handleDeleteLecture}
          handleEditLecture={handleEditLecture}
          handleSaveSemesterStartDate={handleSaveSemesterStartDate}
          setSuccessMessage={setSuccessMessage}
          isLectureInCurrentDept={isLectureInCurrentDept}
          lastScheduleScrollYRef={lastScheduleScrollYRef}
          lecDay={lecDay}
          setLecDay={setLecDay}
          lecStartTime={lecStartTime}
          setLecStartTime={setLecStartTime}
          lecEndTime={lecEndTime}
          setLecEndTime={setLecEndTime}
          lecRoom={lecRoom}
          setLecRoom={setLecRoom}
          lecCourseId={lecCourseId}
          setLecCourseId={setLecCourseId}
          lecTeacherId={lecTeacherId}
          setLecTeacherId={setLecTeacherId}
          lecType={lecType}
          setLecType={setLecType}
          lecColor={lecColor}
          setLecColor={setLecColor}
          lecNotes={lecNotes}
          setLecNotes={setLecNotes}
          lecDate={lecDate}
          setLecDate={setLecDate}
          lecWeekNumber={lecWeekNumber}
          setLecWeekNumber={setLecWeekNumber}
          lecStudyType={lecStudyType}
          setLecStudyType={setLecStudyType}
          lecAutoCascadeWeeks={lecAutoCascadeWeeks}
          setLecAutoCascadeWeeks={setLecAutoCascadeWeeks}
          lecCascadeShiftOption={lecCascadeShiftOption}
          setLecCascadeShiftOption={setLecCascadeShiftOption}
          lecWeeksScope={lecWeeksScope} // 🔢 تمرير نطاق الأسابيع المعتمدة
          setLecWeeksScope={setLecWeeksScope} // 🔄 تمرير دالة تحديث نطاق الأسابيع
          lecCustomWeeks={lecCustomWeeks} // 📋 تمرير قائمة الأسابيع المخصصة
          setLecCustomWeeks={setLecCustomWeeks} // 🔄 تمرير دالة تحديث قائمة الأسابيع
          closeModalAfterSave={closeModalAfterSave}
          setCloseModalAfterSave={setCloseModalAfterSave}
          lecCourseSearchTerm={lecCourseSearchTerm}
          setLecCourseSearchTerm={setLecCourseSearchTerm}
          lecCourseTabFilter={lecCourseTabFilter}
          setLecCourseTabFilter={setLecCourseTabFilter}
          lecTeacherSearchTerm={lecTeacherSearchTerm}
          setLecTeacherSearchTerm={setLecTeacherSearchTerm}
          lecTargetGroup={lecTargetGroup}
          setLecTargetGroup={setLecTargetGroup}
          stageGroupConfigs={stageGroupConfigs}
          lecModalSuccessMsg={lecModalSuccessMsg}
          setLecModalSuccessMsg={setLecModalSuccessMsg}
        />
          {/* ========================================================================= */}
          {/* 📅 3. استعراض محاضرات المرحلة المجدولة بحسب أيام الأسبوع */}
          {/* ========================================================================= */}
          {(() => {
            // 📚 جلب وفلترة كافة محاضرات المرحلة الحالية المحددة للأسبوع المختار (للقسم والمرحلة والكورس ونوع الدراسة)
            const currentStageScheduleLectures = scheduleLectures.filter(
              (l) => {
                if (!isLectureInCurrentDept(l)) return false; // 🏢 عزل القسم
                if (l.stage_number !== selectedScheduleStage) return false; // 🎓 عزل المرحلة
                if (l.semester !== selectedScheduleSemester) return false; // 📚 عزل الكورس
                if ((l.study_type || 'morning') !== selectedScheduleStudyType) return false; // ☀️ فحص الصباحي والمسائي
                if (!isLectureActiveInWeek(l, selectedScheduleWeek)) return false; // 🎯 عزل أسبوعي ذكي: فحص نشاط المحاضرة في الأسبوع المختار
                if (stageGroupsList.length > 0) {
                  return l.target_group === activeScheduleGroup; // 🎯 عزل صارم: إظهار محاضرات هذا الكروب حصراً بدون دمج
                }
                return true; // 🌐 في حالة المرحلة بدون كروبات (شعبة موحدة) نعرض الكل
              }
            );

            // 🆔 مصفوفة المعرفات الفريدة لكافة محاضرات المرحلة الحالية للأسبوع المختار
            const allStageLectureIds = currentStageScheduleLectures.map((l) => l.id);

            // ✅ هل كافة محاضرات هذه المرحلة محددة حالياً؟
            const isAllStageLecturesSelected =
              allStageLectureIds.length > 0 &&
              allStageLectureIds.every((id) => selectedScheduleLectureIds.includes(id));

            // 🌗 هل تم تحديد جزء من محاضرات المرحلة؟
            const isPartiallySelected =
              !isAllStageLecturesSelected &&
              allStageLectureIds.some((id) => selectedScheduleLectureIds.includes(id));

            // 🔢 عدد المحاضرات المحددة من هذه المرحلة حالياً
            const selectedStageLecturesCount = allStageLectureIds.filter((id) =>
              selectedScheduleLectureIds.includes(id)
            ).length;

            // 🎯 جلب كائنات المحاضرات المحددة حالياً من جدول المحاضرات لاستخراج تفاصيل التحديد الكاملة
            const currentlySelectedLectures = scheduleLectures.filter((l) =>
              selectedScheduleLectureIds.includes(l.id)
            );

            // 🗓️ استخراج الأيام المحددة الفريدة ومرتبة زمنياً وفق تسلسل أيام الأسبوع
            const daysOrderKeys = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const dayNamesMapAr: Record<string, string> = {
              saturday: 'السبت',
              sunday: 'الأحد',
              monday: 'الإثنين',
              tuesday: 'الثلاثاء',
              wednesday: 'الأربعاء',
              thursday: 'الخميس',
              friday: 'الجمعة',
            };
            const selectedDaysList = Array.from(new Set(currentlySelectedLectures.map((l) => l.day)))
              .sort((a, b) => daysOrderKeys.indexOf(a) - daysOrderKeys.indexOf(b))
              .map((d) => dayNamesMapAr[d] || d);

            // 🎓 استخراج المراحل المحددة الفريدة ومرتبة تصاعدياً
            const stageLabelsMapAr: Record<number, string> = {
              1: 'المرحلة الأولى',
              2: 'المرحلة الثانية',
              3: 'المرحلة الثالثة',
              4: 'المرحلة الرابعة',
            };
            const selectedStagesList = Array.from(
              new Set(currentlySelectedLectures.map((l) => l.stage_number || selectedScheduleStage))
            )
              .sort((a, b) => a - b)
              .map((s) => stageLabelsMapAr[s] || `المرحلة ${s}`);

            // ☀️/🌙 استخراج فترات الدوام المحددة (صباحي ومسائي)
            const selectedStudyTypesList = Array.from(
              new Set(currentlySelectedLectures.map((l) => l.study_type || 'morning'))
            );

            // 📚 استخراج الكورسات المحددة الفريدة (الكورس الأول / الكورس الثاني)
            const semesterLabelsMapAr: Record<number, string> = {
              1: 'الكورس الأول',
              2: 'الكورس الثاني',
            };
            const selectedSemestersList = Array.from(
              new Set(currentlySelectedLectures.map((l) => l.semester || selectedScheduleSemester))
            )
              .sort((a, b) => a - b)
              .map((sem) => semesterLabelsMapAr[sem] || `الكورس ${sem}`);

            // 👥 استخراج الكروبات المحددة الفريدة (كروب A، كروب B... أو شعبة موحدة)
            const selectedGroupsList = Array.from(
              new Set(
                currentlySelectedLectures.map((l) => {
                  if (l.target_group && l.target_group !== 'all') {
                    return `كروب ${l.target_group}`;
                  }
                  if (stageGroupsList.length > 0 && activeScheduleGroup && activeScheduleGroup !== 'all') {
                    return `كروب ${activeScheduleGroup}`;
                  }
                  return 'شعبة موحدة';
                })
              )
            ).sort();

            // 🔁 دالة تبديل تحديد كافة المحاضرات لجميع الأسابيع والأيام دفعة واحدة
            const handleToggleSelectAllStageLectures = () => {
              if (isAllStageLecturesSelected) {
                // ❌ إلغاء تحديد كافة محاضرات هذه المرحلة
                setSelectedScheduleLectureIds((prev) =>
                  prev.filter((id) => !allStageLectureIds.includes(id))
                );
              } else {
                // ✅ تحديد كافة محاضرات المرحلة دفعة واحدة ومنع تكرار المعرفات
                setSelectedScheduleLectureIds((prev) =>
                  Array.from(new Set([...prev, ...allStageLectureIds]))
                );
              }
            };

            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                      <Calendar className="w-6 h-6 text-[#0F2942]" />
                      <span>جدول محاضرات {getStageNameInArabic(selectedScheduleStage)} — الكورس {selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'}</span>
                    </h3>
                    <p className="text-sm sm:text-base font-black text-slate-800 mt-1">
                      استعراض المحاضرات المقررة لكل يوم مع إمكانية التعديل والحذف المباشر
                    </p>
                  </div>

                  {/* 🎛️ أدوات التحكم العلوية: شارة إجمالي المحاضرات + زر تحديد كافة المحاضرات لكل الأسابيع */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 📊 شارة إجمالي المحاضرات مع تفاصيل التحديد الذكية */}
                    <span className="px-4 py-2 bg-slate-100 text-slate-950 font-black text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs flex items-center gap-2 flex-wrap">
                      {selectedScheduleStudyType === 'evening' ? (
                        <Moon className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Sun className="w-4 h-4 text-sky-600" />
                      )}
                      <span>إجمالي محاضرات (الأسبوع {selectedScheduleWeek}) ({selectedScheduleStudyType === 'evening' ? 'مسائي' : 'صباحي'}): <strong>{currentStageScheduleLectures.length}</strong></span>
                      {selectedStageLecturesCount > 0 && (
                        <div className="mr-2 inline-flex items-center gap-2 flex-wrap">
                          {/* 🎖️ وسم عدد المحاضرات المحددة بلون كحلي ملكي موحد وبحجم متوسط واضح */}
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                            <CheckSquare className="w-4 h-4 text-cyan-300 shrink-0" />
                            <span>محدد: {selectedStageLecturesCount}</span>
                          </span>

                          {/* 📅 وسم الأيام المحددة بلون كحلي ملكي موحد */}
                          {selectedDaysList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                              <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
                              <span>{selectedDaysList.join('، ')}</span>
                            </span>
                          )}

                          {/* 🎓 وسم المراحل المحددة بلون كحلي ملكي موحد */}
                          {selectedStagesList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                              <GraduationCap className="w-4 h-4 text-cyan-300 shrink-0" />
                              <span>{selectedStagesList.join('، ')}</span>
                            </span>
                          )}

                          {/* 👥 وسم الكروب المحدد بلون كحلي ملكي موحد */}
                          {selectedGroupsList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                              <GroupBadgeSvg className="w-4 h-4 text-cyan-300 shrink-0" />
                              <span>{selectedGroupsList.join('، ')}</span>
                            </span>
                          )}

                          {/* ☀️/🌙 وسم الفترة المحددة (صباحي ومسائي) بلون كحلي ملكي موحد */}
                          {selectedStudyTypesList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                              {selectedStudyTypesList.includes('evening') && !selectedStudyTypesList.includes('morning') ? (
                                <Moon className="w-4 h-4 text-cyan-300 shrink-0" />
                              ) : (
                                <Sun className="w-4 h-4 text-cyan-300 shrink-0" />
                              )}
                              <span>{selectedStudyTypesList.map((t) => (t === 'evening' ? 'مسائي' : 'صباحي')).join(' و ')}</span>
                            </span>
                          )}

                          {/* 📚 وسم الكورسات المحددة بلون كحلي ملكي موحد */}
                          {selectedSemestersList.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black bg-[#0F2942] text-white border border-[#0F2942] shadow-xs">
                              <BookOpen className="w-4 h-4 text-cyan-300 shrink-0" />
                              <span>{selectedSemestersList.join('، ')}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </span>

                    {/* 🔘 زر التحديد الشامل لكافة المحاضرات في كل الأسابيع والأيام */}
                    {allStageLectureIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAllStageLectures}
                        className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border-2 select-none ${
                          isAllStageLecturesSelected
                            ? 'bg-blue-50 hover:bg-blue-100 text-[#0F2942] border-[#0F2942] ring-2 ring-[#0F2942]/20'
                            : isPartiallySelected
                            ? 'bg-blue-50/80 hover:bg-blue-100 text-[#0F2942] border-blue-400'
                            : 'bg-[#0F2942] hover:bg-[#163a5f] text-white border-[#0F2942]'
                        }`}
                        title={
                          isAllStageLecturesSelected
                            ? 'إلغاء تحديد كافة محاضرات المرحلة'
                            : 'تحديد كافة المحاضرات في جميع الأسابيع والأيام دفعة واحدة'
                        }
                      >
                        {isAllStageLecturesSelected ? (
                          <>
                            <CheckSquare className="w-5 h-5 text-blue-700 shrink-0" />
                            <span>إلغاء تحديد كافة المحاضرات ({allStageLectureIds.length})</span>
                          </>
                        ) : isPartiallySelected ? (
                          <>
                            <CheckSquare className="w-5 h-5 text-[#0F2942] shrink-0" />
                            <span>تحديد باقي المحاضرات ({allStageLectureIds.length})</span>
                          </>
                        ) : (
                          <>
                            <CheckCheck className="w-5 h-5 text-cyan-300 shrink-0" />
                            <span>تحديد كافة المحاضرات ({allStageLectureIds.length})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 🔘 شريط الإجراءات الجماعية العائم للمحاضرات المحددة */}
                {selectedScheduleLectureIds.length > 0 && (
                  <div className="p-4 bg-gradient-to-l from-blue-50 via-slate-50 to-blue-50 border-2 border-blue-300 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2 duration-150">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-blue-700 shrink-0" />
                        <span className="font-black text-blue-950 text-sm sm:text-base">
                          {isAllStageLecturesSelected ? (
                            <span>
                              تم تحديد <strong>كافة محاضرات الجدول</strong> ({allStageLectureIds.length} من إجمالي {allStageLectureIds.length} محاضرة) لجميع الأسابيع والأيام
                            </span>
                          ) : (
                            <span>
                              تم تحديد <strong className="font-mono text-blue-900 text-lg">{selectedScheduleLectureIds.length}</strong> {selectedScheduleLectureIds.length === 1 ? 'محاضرة' : 'محاضرات'} (من إجمالي {allStageLectureIds.length} محاضرة أسبوعية)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* 🏷️ وسوم تفاصيل التحديد الموحدة بلون كحلي ملكي واحد وبحجم متوسط واضح وبارز */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 📅 الأيام المحددة بلون كحلي ملكي موحد */}
                        {selectedDaysList.length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-sm font-black shadow-xs">
                            <Calendar className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            <span className="text-cyan-200 font-bold">الأيام:</span>
                            <span className="text-white">{selectedDaysList.join('، ')}</span>
                          </span>
                        )}

                        {/* 🎓 المراحل المحددة بلون كحلي ملكي موحد */}
                        {selectedStagesList.length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-sm font-black shadow-xs">
                            <GraduationCap className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            <span className="text-cyan-200 font-bold">المراحل:</span>
                            <span className="text-white">{selectedStagesList.join('، ')}</span>
                          </span>
                        )}

                        {/* 👥 الكروب المحدد بلون كحلي ملكي موحد */}
                        {selectedGroupsList.length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-sm font-black shadow-xs">
                            <GroupBadgeSvg className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            <span className="text-cyan-200 font-bold">الكروب:</span>
                            <span className="text-white">{selectedGroupsList.join('، ')}</span>
                          </span>
                        )}

                        {/* ☀️/🌙 الفترة المحددة بلون كحلي ملكي موحد */}
                        {selectedStudyTypesList.length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-sm font-black shadow-xs">
                            {selectedStudyTypesList.includes('evening') && !selectedStudyTypesList.includes('morning') ? (
                              <Moon className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            ) : (
                              <Sun className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            )}
                            <span className="text-cyan-200 font-bold">الفترة:</span>
                            <span className="text-white">
                              {selectedStudyTypesList.map((t) => (t === 'evening' ? 'مسائي' : 'صباحي')).join(' و ')}
                            </span>
                          </span>
                        )}

                        {/* 📚 الكورسات المحددة بلون كحلي ملكي موحد */}
                        {selectedSemestersList.length > 0 && (
                          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-sm font-black shadow-xs">
                            <BookOpen className="w-4.5 h-4.5 text-cyan-300 shrink-0" />
                            <span className="text-cyan-200 font-bold">الكورسات:</span>
                            <span className="text-white">{selectedSemestersList.join('، ')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
                      {/* ⚡ زر مساند فوري: تحديد كافة المحاضرات إذا لم تكن كلها محددة */}
                      {!isAllStageLecturesSelected && allStageLectureIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleSelectAllStageLectures}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0F2942] border-2 border-[#0F2942] rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                          title="تحديد باقي كافة المحاضرات دفعة واحدة"
                        >
                          <CheckCheck className="w-4 h-4 text-[#0F2942] shrink-0" />
                          <span>تحديد الكل ({allStageLectureIds.length})</span>
                        </button>
                      )}

                      {/* 🗑️ زر حذف كافة المحاضرات المحددة بتصميم أحمر تحذيري راقٍ ومطابق الحجم */}
                      <button
                        type="button"
                        onClick={handleBulkDeleteScheduleLectures}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap shrink-0 border border-red-700"
                        title={isAllStageLecturesSelected ? 'حذف كافة محاضرات الجدول المحددة' : 'حذف المحاضرات المحددة'}
                      >
                        <Trash2 className="w-4 h-4 text-white shrink-0" />
                        <span>
                          {isAllStageLecturesSelected
                            ? `حذف كافة المحاضرات (${selectedScheduleLectureIds.length})`
                            : `حذف المحاضرات المحددة (${selectedScheduleLectureIds.length})`}
                        </span>
                      </button>

                      {/* ❌ زر إلغاء التحديد بتصميم راقٍ متناسق بنفس الارتفاع والأبعاد مع أيقونة واضحة */}
                      <button
                        type="button"
                        onClick={() => setSelectedScheduleLectureIds([])}
                        className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                        title="إلغاء تحديد كافة المحاضرات"
                      >
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>إلغاء التحديد</span>
                      </button>
                    </div>
                  </div>
                )}

            <div className="space-y-4">
              {DAYS_OF_WEEK_LIST.map((d) => {
                const isOff = currentScheduleConfig.off_days.includes(d.key);
                // 📚 جلب وترتيب محاضرات هذا اليوم للقسم المحدد مع عزل الأسبوع بدقة تامة
                const dayLecs = scheduleLectures
                  .filter(
                    (l) => {
                      if (!isLectureInCurrentDept(l)) return false; // 🏢 عزل صارم 100%: مطابقة معرف القسم حصراً
                      if (l.stage_number !== selectedScheduleStage) return false; // 🎓 مطابقة المرحلة الدراسية المحددة
                      if (l.semester !== selectedScheduleSemester) return false; // 🗓️ مطابقة الكورس الدراسي
                      if ((l.study_type || 'morning') !== selectedScheduleStudyType) return false; // ☀️ مطابقة الدوام الصباحي أو المسائي
                      if (!isLectureActiveInWeek(l, selectedScheduleWeek)) return false; // 🎯 عزل أسبوعي ذكي: فحص نشاط المحاضرة في الأسبوع المختار
                      const weekOverride = l.weekly_overrides?.[selectedScheduleWeek]; // ⚙️ استخراج استثناء وتعديل هذا الأسبوع
                      const effectiveDay = weekOverride?.day || l.day; // 🗓️ اليوم الفعلي المعتمد بعد الاستثناء
                      if (effectiveDay !== d.key) return false; // 🗓️ مطابقة يوم المحاضرة الفعلي
                      if (stageGroupsList.length > 0) {
                        return l.target_group === activeScheduleGroup; // 🎯 عزل صارم: إظهار محاضرات هذا الكروب فقط
                      }
                      return true; // 🌐 شعبة موحدة
                    }
                  )
                  .map((l) => { // 🔄 تطبيق تعديلات واستثناءات الأسبوع المختار
                    const weekOverride = l.weekly_overrides?.[selectedScheduleWeek]; // ⚙️ فحص الاستثناء الأسبوعي
                    if (!weekOverride) return l; // 🛡️ إذا ماكو استثناء نرجع المحاضرة كما هي
                    return { // 🚀 تطبيق التعديل الخاص بالأسبوع
                      ...l, // 📋 البيانات الأصلية
                      day: weekOverride.day || l.day, // 🗓️ اليوم المعدل
                      start_time: weekOverride.start_time || l.start_time, // ⏰ وقت البدء المعدل
                      end_time: weekOverride.end_time || l.end_time, // ⏰ وقت الانتهاء المعدل
                      room: weekOverride.room || l.room, // 🏛️ القاعة المعدلة
                      teacher_name: weekOverride.teacher_name || l.teacher_name, // 👨‍🏫 اسم الأستاذ المعدل
                      date: weekOverride.date || l.date, // 📅 التاريخ المعدل
                    }; // 🔚 نهاية الكائن
                  })
                  .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time));

                return (
                  <div
                    key={d.key}
                    className={`rounded-2xl border-2 p-5 transition-all ${
                      isOff ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3.5 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg sm:text-xl text-slate-950">{d.label_ar}</span>
                        {isOff ? (
                          <span className="px-3 py-1 bg-rose-50 text-rose-950 border border-rose-300 text-sm font-black rounded-xl shadow-2xs">
                            <Coffee className="w-4 h-4 inline mr-1 text-rose-700" /> عطلة رسمية معتمدة
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 text-sm font-black rounded-xl">
                            <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-800" /> يوم دوام رسمي ({formatArabicLectureCount(dayLecs.length)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {dayLecs.length > 0 && (() => {
                          const isAllDaySelected = dayLecs.every((l) => selectedScheduleLectureIds.includes(l.id));
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const dayIds = dayLecs.map((l) => l.id);
                                if (isAllDaySelected) {
                                  setSelectedScheduleLectureIds(selectedScheduleLectureIds.filter((id) => !dayIds.includes(id)));
                                } else {
                                  setSelectedScheduleLectureIds(Array.from(new Set([...selectedScheduleLectureIds, ...dayIds])));
                                }
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border-2 ${
                                isAllDaySelected
                                  ? 'bg-blue-50 hover:bg-blue-100 text-[#0F2942] border-[#0F2942]'
                                  : 'bg-white hover:bg-slate-100 text-slate-950 border-slate-300'
                              }`}
                              title={isAllDaySelected ? 'إلغاء تحديد كافة محاضرات هذا اليوم' : 'تحديد كافة محاضرات هذا اليوم'}
                            >
                              {isAllDaySelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <span>
                                {isAllDaySelected ? 'إلغاء تحديد اليوم' : 'تحديد محاضرات اليوم'}
                              </span>
                            </button>
                          );
                        })()}
                        <button
                          type="button" // 🔘 نوع الزر
                          onClick={() => {
                            // 📍 تسجيل موضع السكرول الحالي للصفحة فوراً قبل فتح المودال حتى نرجعله بدقة
                            if (typeof window !== 'undefined') {
                              lastScheduleScrollYRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                            }
                            // 🧹 تصفير المودال مع تعيين اليوم الأسبوعي وتاريخه التقويمي المطابق فورياً
                            resetLectureModalState(d.key, selectedScheduleWeek);
                            setLecStudyType(selectedScheduleStudyType); // ☀️🌙 مزامنة الفترة الصباحية/المسائية الحالية
                            if (stageGroupsList.length > 0) {
                              setLecTargetGroup(activeScheduleGroup); // 👥 تعيين الكروب المختار تلقائياً
                            } else {
                              setLecTargetGroup('all'); // 👥 تعيين شعبة موحدة
                            }
                            setIsLectureModalOpen(true); // 🚀 فتح كارت CRUD المخصص للمحاضرات فورياً
                          }}
                          className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#0F2942] text-sm sm:text-base font-black rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-2 active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-cyan-300" />
                          <span>+ إضافة لهذا اليوم</span>
                        </button>
                      </div>
                    </div>

                    {isOff ? (
                      <p className="text-base sm:text-lg font-black text-slate-800 py-3">
                        هذا اليوم محدد كعطلة رسمية للمرحلة الدراسية. يمكنك تفعيل الدوام له من شريط العطل بالأعلى.
                      </p>
                    ) : dayLecs.length === 0 ? (
                      <p className="text-base sm:text-lg font-black text-slate-800 py-3">
                        لا توجد محاضرات مجدولة ({selectedScheduleStudyType === 'evening' ? 'للدراسة المسائية' : 'للدراسة الصباحية'}) ليوم {d.label_ar} بعد.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {dayLecs.map((lec, idx) => {
                          const typeArabic = lec.type === 'theory' ? 'محاضرة نظرية' : lec.type === 'practical' ? 'مختبر وعملي' : 'حلقة مناقشة';
                          const lecStudy = lec.study_type || 'morning';
                          const isSelected = selectedScheduleLectureIds.includes(lec.id);

                          // 🧠 الحساب التقويمي الذكي والديناميكي للأسبوع المختار واليوم الفعلي
                          const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
                          // 🔢 الأسبوع المعروض حالياً متزامن 100% مع شريط التقويم الأكاديمي بالأعلى
                          const displayWeek = selectedScheduleWeek || lec.week_number || 1;

                          // 🔄 فحص أي استثناء أو تعديل خاص بالأسبوع المختار (مثل نقل القاعة أو التوقيت أو الأستاذ أو اليوم)
                          const weekOverride = lec.weekly_overrides?.[displayWeek];
                          const effectiveDay = weekOverride?.day || lec.day || d.key;
                          const effectiveStartTime = weekOverride?.start_time || lec.start_time;
                          const effectiveEndTime = weekOverride?.end_time || lec.end_time;
                          const effectiveRoom = weekOverride?.room || lec.room;
                          const effectiveTeacher = weekOverride?.teacher_name || lec.teacher_name;

                          // 📅 التاريخ التقويمي الدقيق المحسوب لليوم والأسبوع المختار (سواء كان السبت أو الأحد أو أي يوم)
                          const displayDate = weekOverride?.date
                            || lec.custom_weekly_dates?.[displayWeek]
                            || calculateDateForAnyDayInWeek(baseStart, 1, displayWeek, effectiveDay);

                          // ⏰ دالة ذكية لتحويل أوقات الدوام الجامعي العراقي لنظام 12 ساعة مع ص و م
                          const format12HourAcademic = (timeStr: string): { time: string; period: 'ص' | 'م' } => {
                            if (!timeStr) return { time: '00:00', period: 'ص' };
                            const parts = timeStr.trim().split(':');
                            let h = parseInt(parts[0] || '0', 10);
                            const m = (parts[1] || '00').padStart(2, '0');

                            let period: 'ص' | 'م' = 'ص';
                            if (h === 12 || h === 0) {
                              period = 'م'; // 12 ظهراً
                              h = 12;
                            } else if (h >= 13 && h <= 23) {
                              period = 'م'; // تحويل أوقات بعد الظهر والمساء
                              h -= 12;
                            } else if (h >= 1 && h <= 7) {
                              period = 'م'; // أوقات الدوام المسائي والنهاري 1 إلى 7 م
                            } else {
                              period = 'ص'; // أوقات الصباح 8 إلى 11 ص
                            }

                            const hStr = h < 10 ? `0${h}` : `${h}`;
                            return { time: `${hStr}:${m}`, period };
                          };

                          const start12 = format12HourAcademic(effectiveStartTime);
                          const end12 = format12HourAcademic(effectiveEndTime);

                          // 🎨 فئة التصميم الموحد لكافة الوسوم (نصوص سوداء واضحة وبارزة بخط عريض وفخم)
                          const unifiedBadgeClass = "px-3 py-1.5 bg-blue-50 text-slate-950 border border-blue-200 rounded-xl text-xs sm:text-sm font-black shadow-2xs flex items-center gap-1.5 shrink-0";

                          return (
                            <div
                              key={lec.id}
                              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                                isSelected
                                  ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30 shadow-md'
                                  : 'bg-white border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs'
                              }`}
                            >
                              {/* 🏷️ 1. الترويسة العلوية: مربع التحديد يميناً + شارات الدراسة وطبيعة المحاضرة يساراً */}
                              <div className="flex items-center justify-between flex-wrap gap-2.5 border-b border-slate-100 pb-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedScheduleLectureIds(selectedScheduleLectureIds.filter((id) => id !== lec.id));
                                      } else {
                                        setSelectedScheduleLectureIds([...selectedScheduleLectureIds, lec.id]);
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-black text-slate-700">تحديد</span>
                                </label>

                                {/* شارات الدراسة والنوع موحدة بنصوص واضحة وعريضة */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* 🎖️ وسم تسلسل المحاضرة الأكاديمي الفصيح (المحاضرة الأولى، المحاضرة الثانية...) بتصميم كحلي ملكي راقٍ بدون أي نقطة سمائية */}
                                  <span className="px-3 py-1.5 bg-[#0F2942] text-white border border-[#0F2942] rounded-xl text-xs sm:text-sm font-black shadow-2xs flex items-center gap-1.5 shrink-0">
                                    {/* 🏷️ إظهار تسلسل المحاضرة بنص أنيق وواضح */}
                                    <span>{formatArabicOrdinalLectureName(idx + 1)}</span>
                                  </span>
                                  <span className={unifiedBadgeClass}>
                                    {lecStudy === 'evening' ? (
                                      <Moon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                    ) : (
                                      <Sun className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                    )}
                                    <span>{lecStudy === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                  </span>

                                  <span className={unifiedBadgeClass}>
                                    {lec.type === 'practical' ? (
                                      <FlaskConical className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                    ) : (
                                      <BookOpen className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                    )}
                                    <span>{typeArabic}</span>
                                  </span>

                                  {/* 👥 شارة الكروب أو الشعبة المستهدفة */}
                                  <span className={unifiedBadgeClass}>
                                    <GroupBadgeSvg className="w-3.5 h-3.5 text-blue-900 shrink-0" /> {/* 🏷️ أيقونة الكروب أو الشعبة */}
                                    <span>{lec.target_group && lec.target_group !== 'all' ? `كروب ${lec.target_group}` : 'شعبة موحدة'}</span> {/* 🔤 اسم الكروب أو شعبة موحدة */}
                                  </span>
                                </div>
                              </div>

                              {/* 📖 2. عنوان المادة الأكاديمية والوسوم المرتبة بنصوص واضحة */}
                              <div className="space-y-3">
                                <h5 className="font-black text-slate-950 text-lg sm:text-xl leading-snug">
                                  {lec.course_name}
                                </h5>

                                {/* ⏱️📅 السطر الأول: وسم الوقت ووسم التاريخ بجانب بعض */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* وسم الوقت الذكي بنظام 12 ساعة مع (ص) و (م) */}
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-slate-950 font-black shadow-2xs select-none">
                                    <Clock className="w-4 h-4 text-blue-900 shrink-0" />
                                    <div className="inline-flex items-center gap-1 text-xs sm:text-sm font-mono font-black" dir="rtl">
                                      {/* وقت البدء أولاً على اليمين */}
                                      <span className="inline-flex items-center gap-1">
                                        <span dir="ltr" className="font-mono font-black tracking-tight text-slate-950">{start12.time}</span>
                                        <span className="text-[11px] font-black text-blue-950 bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300">{start12.period}</span>
                                      </span>

                                      <span className="text-blue-500 font-black px-0.5 select-none leading-none">—</span>

                                      {/* وقت الانتهاء ثانياً على اليسار */}
                                      <span className="inline-flex items-center gap-1">
                                        <span dir="ltr" className="font-mono font-black tracking-tight text-slate-950">{end12.time}</span>
                                        <span className="text-[11px] font-black text-blue-950 bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300">{end12.period}</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* وسم التاريخ بجانب وسم الوقت مباشرة */}
                                  {displayDate && (
                                    <span className={unifiedBadgeClass}>
                                      <Calendar className="w-4 h-4 text-blue-900 shrink-0" />
                                      <span className="font-mono">{displayDate}</span>
                                    </span>
                                  )}
                                </div>

                                {/* 🎓🗓️ السطر الثاني (أسفله مباشرة): المرحلة والكورس وبجانبه الأسبوع */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* المرحلة والكورس */}
                                  <span className={unifiedBadgeClass}>
                                    <GraduationCap className="w-4 h-4 text-blue-900 shrink-0" />
                                    <span>المرحلة {getStageNameInArabic(lec.stage_number)} • {lec.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}</span>
                                  </span>

                                  {/* الأسبوع الدراسي */}
                                  <span className={unifiedBadgeClass}>
                                    <Calendar className="w-4 h-4 text-blue-900 shrink-0" />
                                    <span>الأسبوع {displayWeek}</span>
                                  </span>
                                </div>

                                {/* 🏛️ 3. صندوق معلومات القاعة والأستاذ المنظم */}
                                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2 text-sm sm:text-base font-black text-slate-950">
                                  <p className="flex items-center gap-2">
                                    <DoorClosed className="w-4 h-4 text-blue-800 shrink-0" />
                                    <span>القاعة: <strong className="text-slate-950 font-bold">{effectiveRoom || 'غير محددة'}</strong></span>
                                  </p>
                                  {effectiveTeacher && (
                                    <p className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-blue-800 shrink-0" />
                                      <span>الأستاذ: <strong className="text-slate-950 font-bold">{effectiveTeacher}</strong></span>
                                    </p>
                                  )}
                                  {lec.notes && (
                                    <p className="text-xs sm:text-sm font-black text-slate-800 bg-white border border-slate-200 p-2.5 rounded-lg flex items-center gap-2">
                                      <Lightbulb className="w-4 h-4 text-blue-700 shrink-0" /> {/* 💡 أيقونة الملاحظات بلون أزرق أكاديمي */}
                                      <span>ملاحظات: <strong>{lec.notes}</strong></span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* 🛠️ 4. أزرار الإجراءات تعديل وحذف وإلغاء للأسبوع متساوية ومتباعدة بوضوح وبدون أي لون برتقالي */}
                              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 flex-wrap">
                                {handleDeleteLectureForWeek && (
                                  <button
                                    type="button" // 🔘 نوع الزر
                                    onClick={() => handleDeleteLectureForWeek(lec.id, selectedScheduleWeek)} // 🚫 استدعاء دالة الإلغاء للأسبوع المحدد
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-[#0F2942] text-slate-950 hover:text-white border-2 border-slate-300 hover:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs active:scale-95 group" // 🎨 تصميم رسمي رصين متناسق تماماً مع هوية النظام وبدون أي لون برتقالي
                                    title={`إلغاء واستبعاد هذه المحاضرة للأسبوع ${selectedScheduleWeek} فقط دون حذفها من بقية الأسابيع`} // 💬 تلميح زر الإلغاء
                                  >
                                    <XCircle className="w-4 h-4 text-slate-700 group-hover:text-white shrink-0 transition-colors" /> {/* 🚫 أيقونة الإلغاء بلون متناسق */}
                                    <span>إلغاء للأسبوع ({selectedScheduleWeek})</span> {/* 📝 نص الزر الموضح لرقم الأسبوع */}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleEditLecture(lec)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 hover:bg-blue-600 text-blue-950 hover:text-white border-2 border-blue-300 hover:border-blue-600 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="تعديل بيانات المحاضرة"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLecture(lec.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-600 text-rose-950 hover:text-white border-2 border-rose-300 hover:border-rose-600 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="حذف المحاضرة نهائياً من كافة الأسابيع"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>حذف نهائي</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            );
          })()}

        </div>

  );
};

export default DepartmentScheduleTab; // 🚀 تصدير المكون كافتراضي
