// 🗓️ خطاف مخصص لإدارة جدول المحاضرات الأسبوعي، الأيام الرسمية، التضاربات، واستيراد وتصدير الإكسل
// 🛡️ التزام نمطي صارم بدون any أو unknown مع توثيق عراقي تفصيلي لكل سطر كود

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'; // ⚛️ استيراد خطافات رياكت الأساسية مع useCallback
import type {
  Course, // 📚 واجهة المادة الدراسية
  UserProfile, // 👤 واجهة الحساب التعريفي
  TeacherCourse, // 🔗 واجهة تكليف التدريسي بالمادة
  ScheduleLecture, // 📋 واجهة المحاضرة بجدول القسم
  DepartmentScheduleConfig, // ⚙️ واجهة إعدادات الجدول والدوام
  StageGroupConfig, // 👥 واجهة إعدادات كروبات المراحل الأكاديمية
  DayOfWeek, // 🗓️ واجهة أيام الأسبوع
  LectureColor, // 🎨 واجهة ألوان المحاضرات
  LectureType, // 🔬 واجهة نوع المحاضرة (نظري أو عملي)
  FinalExamSchedule, // 📑 واجهة جدول الامتحانات النهائية
  FinalExamSlot, // ⏰ واجهة فترات الامتحانات النهائية
} from '@/types'; // 🔗 استيراد الأنواع الرسمية الموحدة للمشروع
import type { DepartmentDeleteModalConfig, ImportSummaryReport } from '../types'; // 🏷️ استيراد واجهات البوابة المشتركة
import {
  DAYS_OF_WEEK_LIST, // 🗓️ قائمة أيام الأسبوع بالعربي
  DEFAULT_WORKING_DAYS, // 🏢 أيام الدوام الافتراضية
  DEFAULT_OFF_DAYS, // 🏖️ أيام العطل الافتراضية
  getScheduleConfigOrDefault, // ⚙️ جلب إعدادات القسم أو الافتراضي
  checkLectureCollisions, // ⚠️ فحص تضاربات المحاضرات اللحظي
  getAvailableRoomsForSlot, // 🏛️ جلب القاعات الشاغرة لهذا التوقيت
  UNIVERSITY_ROOMS_CATALOG, // 🏛️ دليل القاعات والمختبرات الجامعية
  type ScheduleConflict, // ⚠️ واجهة بيانات التضارب
  getDayOfWeekFromDateString, // 🗓️ استخراج اليوم من تاريخ بصيغة YYYY-MM-DD
  calculateDateForAnyDayInWeek, // 🧮 حساب التاريخ الدقيق لليوم داخل الأسبوع
  generateAll15WeeksDates, // 🌟 توليد تواريخ كافة الأسابيع الـ 15
  shiftLectureToAnyDay, // 🔄 تحويل المحاضرة بين أي يومين
  getCurrentAcademicWeek, // ⚡ احتساب الأسبوع التقويمي الحالي
} from '@/lib/schedule-utils'; // 🕒 أدوات وحسابات الجدول الأسبوعي
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 اسم المرحلة بالعربية
import {
  getStoredData, // 📥 جلب البيانات المخزنة محلياً
  saveStoredData, // 💾 حفظ البيانات بالتخزين المحلي
  INITIAL_SCHEDULE_CONFIGS, // ⚙️ الإعدادات الافتراضية للجدول
  INITIAL_SCHEDULE_LECTURES, // 📋 المحاضرات الافتراضية للجدول
  getAcademicYear, // 📅 جلب العام الدراسي المعتمد حالياً
} from '@/lib/mock-data'; // 📦 مخازن البيانات والدوال المساعدة
import {
  saveScheduleConfigToSupabase, // ☁️ حفظ ومزامنة إعدادات الجدول في Supabase
  saveScheduleLectureToSupabase, // ☁️ حفظ ومزامنة المحاضرة الفردية في Supabase
  saveScheduleLecturesBulkToSupabase, // ☁️ حفظ مجموعة محاضرات بالجدول في Supabase
  deleteScheduleLectureFromSupabase, // ☁️ حذف محاضرة من Supabase
  deleteScheduleLecturesBulkFromSupabase, // ☁️ حذف مجموعة محاضرات من Supabase
  saveFinalExamScheduleToSupabase, // ☁️ حفظ جدول الامتحانات الفاينل في Supabase
  saveFinalExamSlotsToSupabase, // ☁️ حفظ بنود الامتحانات الفاينل في Supabase
  deleteFinalExamSlotFromSupabase, // ☁️ حذف بند امتحان من Supabase
} from '@/lib/supabase-client'; // 🔌 دوال المزامنة السحابية
import {
  generateDepartmentScheduleTemplate, // 📥 توليد قالب إكسل للجدول
  parseExcelFile, // 📤 قراءة وتحليل ملف الإكسل
  exportCustomScheduleList, // 📊 تصدير محاضرات الجدول إلى ملف إكسل
} from '@/lib/excel-utils'; // 📊 دوال الإكسل المعتمدة
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات الفورية

// 📋 واجهة مدخلات خطاف جدول القسم
export interface UseDepartmentScheduleProps {
  currentDeptId: string; // 🏛️ معرف القسم الأكاديمي الحالي
  deptName: string; // 🏷️ اسم القسم الأكاديمي
  courses: Course[]; // 📚 قائمة المواد الإجمالية
  deptCourses: Course[]; // 📖 مواد القسم المصفاة
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم المصفين
  teacherCourses: TeacherCourse[]; // 🔗 تخصيصات المواد للأساتذة
  scheduleLectures: ScheduleLecture[]; // 📋 قائمة محاضرات الجدول
  setScheduleLectures: React.Dispatch<React.SetStateAction<ScheduleLecture[]>>; // 🔄 دالة تحديث المحاضرات
  scheduleConfigs: DepartmentScheduleConfig[]; // ⚙️ إعدادات الجدول والدوام
  setScheduleConfigs: React.Dispatch<React.SetStateAction<DepartmentScheduleConfig[]>>; // 🔄 دالة تحديث الإعدادات
  finalExamSchedules: FinalExamSchedule[]; // 📑 جداول الامتحانات النهائية
  setFinalExamSchedules: React.Dispatch<React.SetStateAction<FinalExamSchedule[]>>; // 🔄 تحديث جداول الامتحانات
  finalExamSlots: FinalExamSlot[]; // ⏰ فترات الامتحانات النهائية
  setFinalExamSlots: React.Dispatch<React.SetStateAction<FinalExamSlot[]>>; // 🔄 تحديث فترات الامتحانات
  profiles: UserProfile[]; // 👥 حسابات المستخدمين بالنظام
  setSuccessMessage: (msg: string) => void; // ✨ دالة إشعار النجاح
  setErrorMessage: (msg: string) => void; // ⚠️ دالة إشعار الخطأ
  setDeleteModalConfig: React.Dispatch<React.SetStateAction<DepartmentDeleteModalConfig>>; // 🗑️ دالة إعداد نافذة الحذف
  isLectureInCurrentDept: (l: ScheduleLecture) => boolean; // 🏢 التحقق من تبعية المحاضرة للقسم
  stageGroupConfigs?: StageGroupConfig[]; // 👥 قائمة إعدادات كروبات المراحل لتحديد الكروب الافتراضي
}

// 🎯 دالة الخطاف الرئيسية لإدارة جدول القسم الأكاديمي
export const useDepartmentSchedule = ({
  currentDeptId, // 🏛️ معرف القسم
  deptName, // 🏷️ اسم القسم
  courses, // 📚 المواد
  deptCourses, // 📖 مواد القسم
  deptTeachers, // 👨‍🏫 أساتذة القسم
  teacherCourses, // 🔗 تخصيصات التدريسيين
  scheduleLectures, // 📋 المحاضرات
  setScheduleLectures, // 🔄 تحديث المحاضرات
  scheduleConfigs, // ⚙️ إعدادات الجدول
  setScheduleConfigs, // 🔄 تحديث الإعدادات
  finalExamSchedules, // 📑 جداول الفاينل
  setFinalExamSchedules, // 🔄 تحديث جداول الفاينل
  finalExamSlots, // ⏰ فترات الفاينل
  setFinalExamSlots, // 🔄 تحديث فترات الفاينل
  profiles, // 👥 الحسابات
  setSuccessMessage, // ✨ رسالة النجاح
  setErrorMessage, // ⚠️ رسالة الخطأ
  setDeleteModalConfig, // 🗑️ نافذة الحذف
  isLectureInCurrentDept, // 🏢 فحص التبعية
  stageGroupConfigs = [], // 👥 إعدادات كروبات المراحل الأكاديمية
}: UseDepartmentScheduleProps) => {
  // 🎛️ حالات تصفية وعرض الجدول الأسبوعي
  const [selectedScheduleStage, setSelectedScheduleStage] = useState<number>(1); // 🎓 المرحلة المحددة للجدول
  const [selectedScheduleSemester, setSelectedScheduleSemester] = useState<1 | 2>(1); // 📚 الكورس المحدد للجدول
  const [selectedScheduleStudyType, setSelectedScheduleStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 فترة الجدول (صباحي / مسائي)
  const [selectedScheduleGroup, setSelectedScheduleGroup] = useState<string>('all'); // 👥 الكروب المحدد لجدول القسم ('all', 'A', 'B', 'C', 'D')
  const [selectedWeekByGroup, setSelectedWeekByGroup] = useState<Record<string, number>>({}); // 🗓️ قاموس حفظ الأسبوع المختار لكل كروب مستقلاً تماماً
  const [selectedScheduleLectureIds, setSelectedScheduleLectureIds] = useState<string[]>([]); // 🔘 معرفات المحاضرات المحددة

  // 🔄 مزامنة الكروب الافتراضي تلقائياً: إذا المرحلة مقسمة لكروبات نختار أول كروب (مثلاً 'A') بدلاً من 'all'، وإذا شعبة موحدة نعيده إلى 'all'
  useEffect(() => {
    // 🔍 جلب إعدادات المرحلة المحددة
    const currentStageGrpCfg = stageGroupConfigs.find(
      (c) => c.stage_number === selectedScheduleStage && c.study_type === selectedScheduleStudyType
    );
    // ⚙️ فحص وجود كروبات معتمدة للمرحلة
    if (currentStageGrpCfg && currentStageGrpCfg.has_groups && currentStageGrpCfg.groups && currentStageGrpCfg.groups.length > 0) {
      if (selectedScheduleGroup === 'all' || !currentStageGrpCfg.groups.includes(selectedScheduleGroup)) {
        setSelectedScheduleGroup(currentStageGrpCfg.groups[0]); // 🥇 تعيين الكروب الأول مباشرة للمرحلة
      }
    } else {
      // 🛑 في حال كانت المرحلة شعبة موحدة نضمن إعادة التعيين إلى all
      if (selectedScheduleGroup !== 'all') {
        setSelectedScheduleGroup('all'); // 🔄 تصفير الكروب لشعبة موحدة
      }
    }
  }, [stageGroupConfigs, selectedScheduleStage, selectedScheduleStudyType, selectedScheduleGroup]);

  // 📝 حالات استمارة إضافة وتعديل المحاضرة
  const [lecDay, setLecDay] = useState<DayOfWeek | ''>(''); // 🗓️ يوم المحاضرة
  const [lecCourseId, setLecCourseId] = useState<string>(''); // 📖 معرف المادة الدراسية
  const [lecTeacherId, setLecTeacherId] = useState<string>(''); // 👤 معرف الأستاذ المحاضر
  const [lecRoom, setLecRoom] = useState<string>(''); // 🏛️ القاعة أو المختبر
  const [lecStartTime, setLecStartTime] = useState<string>(''); // ⏱️ وقت بدء المحاضرة
  const [lecEndTime, setLecEndTime] = useState<string>(''); // ⏱️ وقت انتهاء المحاضرة
  const [lecColor, setLecColor] = useState<LectureColor>('blue'); // 🎨 لون شريط المحاضرة
  const [lecType, setLecType] = useState<LectureType | ''>(''); // 🏷️ طبيعة المحاضرة (نظري / عملي)
  const [lecDate, setLecDate] = useState<string>(''); // 📅 تاريخ المحاضرة التقويمي
  const [lecWeekNumber, setLecWeekNumber] = useState<number>(1); // 🔢 رقم الأسبوع المعتمد
  const [lecAutoCascadeWeeks, setLecAutoCascadeWeeks] = useState<boolean>(true); // 🌟 تعاقب التواريخ التلقائي للأسابيع الـ 15
  const [lecCascadeShiftOption, setLecCascadeShiftOption] = useState<'cascade_following' | 'this_week_only' | 'all_15_weeks'>('cascade_following'); // 🔄 خيار ترحيل التعديل
  const [lecWeeksScope, setLecWeeksScope] = useState<'all_15_weeks' | 'this_week_only' | 'odd_weeks' | 'even_weeks' | 'custom_pick'>('all_15_weeks'); // 🔢 نطاق الأسابيع المعتمدة للمحاضرة
  const [lecCustomWeeks, setLecCustomWeeks] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); // 📋 لستة الأسابيع المخصصة يدوياً للمحاضرة
  const [originalLecDay, setOriginalLecDay] = useState<DayOfWeek | ''>(''); // 🗓️ اليوم الأصلي لتتبع التحويل بين الأيام
  const [lecStudyType, setLecStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 فترة المحاضرة
  const [lecNotes, setLecNotes] = useState<string>(''); // 📝 ملاحظات المحاضرة
  const [editingLectureId, setEditingLectureId] = useState<string | null>(null); // 🆔 معرف المحاضرة قيد التعديل
  const [isLectureModalOpen, setIsLectureModalOpen] = useState<boolean>(false); // 🗓️ حالة فتح وغلق كارت المحاضرات
  const [lecModalSuccessMsg, setLecModalSuccessMsg] = useState<string>(''); // ✨ رسالة النجاح التفاعلية الداخلية
  const [recentlyAddedLectureId, setRecentlyAddedLectureId] = useState<string | null>(null); // 🌟 تمييز المحاضرة المضافة حديثاً
  const [closeModalAfterSave, setCloseModalAfterSave] = useState<boolean>(false); // 🚪 إغلاق الكارت بعد الحفظ أم البقاء
  const [lecCourseSearchTerm, setLecCourseSearchTerm] = useState<string>(''); // 🔍 نص البحث عن المادة
  const [lecCourseTabFilter, setLecCourseTabFilter] = useState<'all' | 'theory' | 'practical'>('all'); // 📑 فلتر نوع المادة
  const [lecTeacherSearchTerm, setLecTeacherSearchTerm] = useState<string>(''); // 🔍 نص البحث عن الأستاذ
  const [lecTargetGroup, setLecTargetGroup] = useState<string>('all'); // 👥 الكروب أو الشعبة المستهدفة للمحاضرة ('all', 'A', 'B', 'C', 'D'...)

  // 🪟 حالات النوافذ المنبثقة للجدول
  const [pendingSemesterStartDate, setPendingSemesterStartDate] = useState<string | null>(null); // 📅 تاريخ الانطلاق المعلق
  const [showSemesterDateConfirmModal, setShowSemesterDateConfirmModal] = useState<boolean>(false); // 🛑 نافذة تأكيد تاريخ الانطلاق
  const [isPreviewScheduleModalOpen, setIsPreviewScheduleModalOpen] = useState<boolean>(false); // 👁️ نافذة معاينة الجدول
  const [isSchedulePrintModalOpen, setIsSchedulePrintModalOpen] = useState<boolean>(false); // 🖨️ نافذة طباعة الجدول
  const [isMasterMatrixModalOpen, setIsMasterMatrixModalOpen] = useState<boolean>(false); // 📊 نافذة المصفوفة الشاملة
  const [isDurationSettingsModalOpen, setIsDurationSettingsModalOpen] = useState<boolean>(false); // ⚙️ نافذة إعدادات الساعات
  const [showScheduleExcelInstructions, setShowScheduleExcelInstructions] = useState<boolean>(false); // ℹ️ نافذة تعليمات إكسل
  const [isImportingScheduleExcel, setIsImportingScheduleExcel] = useState<boolean>(false); // ⏳ حالة استيراد إكسل
  const [scheduleImportReport, setScheduleImportReport] = useState<ImportSummaryReport | null>(null); // 📊 تقرير استيراد الجدول
  const [scheduleActiveReportTab, setScheduleActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 تبويب تقرير الجدول

  // 📍 مراجع DOM
  const lastScheduleScrollYRef = useRef<number>(0); // 📍 مرجع حفظ موضع السكرول
  const lecListContainerRef = useRef<HTMLDivElement | null>(null); // 📜 مرجع حاوية قائمة المحاضرات

  // ⚙️ استخراج إعدادات الجدول للقسم والمرحلة والكورس والكروب المحددين حصراً
  const currentScheduleConfig = useMemo(() => {
    return getScheduleConfigOrDefault(
      scheduleConfigs, // 📋 كافة الإعدادات
      currentDeptId, // 🏢 القسم الحالي
      selectedScheduleStage, // 🎓 المرحلة
      selectedScheduleSemester, // 🗓️ الكورس
      selectedScheduleStudyType, // ☀️ نوع الدراسة
      selectedScheduleGroup !== 'all' ? selectedScheduleGroup : undefined, // 👥 الكروب المستقل
      getAcademicYear() // 🎓 العام الدراسي المعتمد للبحث الدقيق
    );
  }, [scheduleConfigs, currentDeptId, selectedScheduleStage, selectedScheduleSemester, selectedScheduleStudyType, selectedScheduleGroup]);

  // ⚡ احتساب الأسبوع الأكاديمي الحالي للجدول نسبة لتاريخ انطلاق الفصل
  const scheduleCurrentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(currentScheduleConfig.start_date || '2026-09-20');
  }, [currentScheduleConfig.start_date]);

  // 🗓️ استخراج الأسبوع المعتمد للكروب الحالي تلقائياً مع الرجوع للأسبوع الأكاديمي
  const selectedScheduleWeek = useMemo(() => {
    return selectedWeekByGroup[selectedScheduleGroup] || scheduleCurrentAcademicWeek;
  }, [selectedWeekByGroup, selectedScheduleGroup, scheduleCurrentAcademicWeek]);

  // 🔄 دالة تحديث الأسبوع للكروب المحدد فقط دون التأثير على باقي الكروبات
  const setSelectedScheduleWeek: React.Dispatch<React.SetStateAction<number>> = useCallback((action: React.SetStateAction<number>) => {
    setSelectedWeekByGroup((prev) => {
      const currentVal = prev[selectedScheduleGroup] || scheduleCurrentAcademicWeek;
      const nextVal = typeof action === 'function' ? action(currentVal) : action;
      return {
        ...prev,
        [selectedScheduleGroup]: nextVal,
      };
    });
  }, [selectedScheduleGroup, scheduleCurrentAcademicWeek]);

  // 🔄 مزامنة الأسبوع المختار مع الأسبوع الحالي عند تغيير تاريخ بداية الفصل للكروب
  useEffect(() => {
    const curW = getCurrentAcademicWeek(currentScheduleConfig.start_date || '2026-09-20');
    setSelectedWeekByGroup((prev) => {
      if (!prev[selectedScheduleGroup]) {
        return { ...prev, [selectedScheduleGroup]: curW };
      }
      return prev;
    });
  }, [currentScheduleConfig.start_date, selectedScheduleGroup]);

  // 📡 الاستماع لحدث تحديث تاريخ انطلاق الفصل ومزامنة إعدادات ومحاضرات القسم فورياً
  useEffect(() => {
    const handleSemesterDateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ departmentId: string; startDate: string }>; // 🔍 قراءة تفاصيل الحدث
      if (!customEvent.detail || customEvent.detail.departmentId === currentDeptId) { // 🏢 التحقق من مطابقة القسم
        const freshConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS); // 📥 جلب أحدث الإعدادات
        const freshLectures = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES); // 📥 جلب أحدث المحاضرات
        if (freshConfigs && freshConfigs.length > 0) setScheduleConfigs(freshConfigs); // 🔄 تحديث الإعدادات
        if (freshLectures && freshLectures.length > 0) setScheduleLectures(freshLectures); // 🔄 تحديث المحاضرات
      }
    };
    window.addEventListener('semester-start-date-updated', handleSemesterDateEvent); // 👂 الاستماع للحدث المخصص
    window.addEventListener('storage', handleSemesterDateEvent); // 👂 الاستماع للتخزين بين النوافذ
    return () => {
      window.removeEventListener('semester-start-date-updated', handleSemesterDateEvent); // 🧹 تنظيف المستمع
      window.removeEventListener('storage', handleSemesterDateEvent); // 🧹 تنظيف المستمع
    };
  }, [currentDeptId, setScheduleConfigs, setScheduleLectures]);

  // 🛡️ حساب التضارب الزمني اللحظي للقاعات والأساتذة أثناء إدخال المحاضرة
  const selectedLecTeacher = useMemo(() => {
    return profiles.find((p: UserProfile) => p.id === lecTeacherId);
  }, [profiles, lecTeacherId]);

  const currentLecConflicts = useMemo((): ScheduleConflict[] => {
    if (!lecStartTime || !lecEndTime || !lecDay || (!lecRoom.trim() && !lecTeacherId)) return []; // 🛑 إذا الوقت أو اليوم مو محددين ما نفحص
    return checkLectureCollisions(
      {
        day: lecDay as DayOfWeek, // 🗓️ اليوم الأسبوعي المؤكد
        start_time: lecStartTime, // ⏱️ وقت بدء المحاضرة
        end_time: lecEndTime, // ⏱️ وقت انتهاء المحاضرة
        room: lecRoom.trim(), // 🏛️ القاعة الدراسية
        teacher_id: lecTeacherId, // 👤 معرف الأستاذ
        teacher_name: selectedLecTeacher?.full_name, // 👨‍🏫 اسم الأستاذ
        stage_number: selectedScheduleStage, // 🎓 رقم المرحلة
        department_id: currentDeptId, // 🏢 معرف القسم
        target_group: lecTargetGroup, // 👥 الكروب المستهدف للفحص
      },
      scheduleLectures, // 📚 قائمة المحاضرات المسجلة
      editingLectureId || undefined // ✏️ استثناء المحاضرة قيد التعديل
    );
  }, [lecDay, lecStartTime, lecEndTime, lecRoom, lecTeacherId, selectedLecTeacher, selectedScheduleStage, currentDeptId, scheduleLectures, editingLectureId, lecTargetGroup]);

  // 💡 حساب القاعات والمختبرات الشاغرة غير المحجوزة في الوقت المحدد
  const availableRoomsForSlot = useMemo(() => {
    if (!lecStartTime || !lecEndTime || !lecDay) return UNIVERSITY_ROOMS_CATALOG; // 🏛️ إذا ما حدد وقت أو يوم نعرض كل القاعات شاغرة
    return getAvailableRoomsForSlot(lecDay as DayOfWeek, lecStartTime, lecEndTime, scheduleLectures, editingLectureId || undefined); // 🔍 جلب القاعات الشاغرة
  }, [lecDay, lecStartTime, lecEndTime, scheduleLectures, editingLectureId]);

  // 🗓️ تبديل حالة اليوم بين دوام وعطلة بعد أخذ موافقة وتأكيد المستخدم
  const handleToggleWorkingDay = (dayKey: DayOfWeek) => {
    const isCurrentlyOff = currentScheduleConfig.off_days.includes(dayKey);
    const dayName = DAYS_OF_WEEK_LIST.find((d: { key: DayOfWeek; label_ar: string }) => d.key === dayKey)?.label_ar || dayKey;
    const stageName = getStageNameInArabic(selectedScheduleStage);
    const semesterName = selectedScheduleSemester === 1 ? 'الأول' : 'الثاني';

    // حساب عدد المحاضرات المجدولة لهذا اليوم
    const dayLecturesCount = scheduleLectures.filter(
      (l: ScheduleLecture) =>
        isLectureInCurrentDept(l) &&
        l.stage_number === selectedScheduleStage &&
        l.semester === selectedScheduleSemester &&
        l.day === dayKey
    ).length;

    const isGroupSpecific = selectedScheduleGroup !== 'all'; // 👥 هل التعديل خاص بكروب مستقل
    const groupSuffix = isGroupSpecific ? ` — كروب ${selectedScheduleGroup}` : ''; // 🏷️ لاحقة اسم الكروب للترويسات
    const groupParen = isGroupSpecific ? ` (كروب ${selectedScheduleGroup})` : ''; // 🏷️ اسم الكروب بين قوسين

    const actionTitle = isCurrentlyOff
      ? `تأكيد تفعيل يوم (${dayName}) كيوم دوام رسمي${isGroupSpecific ? ` لكروب ${selectedScheduleGroup}` : ''}`
      : `تأكيد تحويل يوم (${dayName}) إلى عطلة رسمية${isGroupSpecific ? ` لكروب ${selectedScheduleGroup}` : ''}`;

    const actionWarning = isCurrentlyOff
      ? `هل أنت متأكد من تفعيل يوم (${dayName}) كيوم دوام رسمي معتمد وإتاحته لجدولة المحاضرات لطلبة المرحلة ${stageName}${groupSuffix} (الكورس ${semesterName})؟`
      : dayLecturesCount > 0
      ? `تنبيه: هذا اليوم يحتوي حالياً على (${dayLecturesCount}) محاضرة مجدولة. تحويله إلى عطلة رسمية سيؤثر على جدول المرحلة ${stageName}${groupSuffix} ولن يتم احتساب المحاضرات فيه كأيام دوام رسمي. هل ترغب بالاستمرار والموافقة؟`
      : `هل أنت متأكد من تحويل يوم (${dayName}) إلى عطلة رسمية معتمدة لطلبة المرحلة ${stageName}${groupSuffix} (الكورس ${semesterName})؟`;

    const confirmBtnText = isCurrentlyOff
      ? 'نعم، تفعيل كيوم دوام رسمي'
      : 'نعم، تحويل إلى عطلة رسمية';

    setDeleteModalConfig({
      isOpen: true,
      title: actionTitle,
      itemName: `يوم ${dayName} — المرحلة ${stageName}${groupSuffix} (الكورس ${semesterName})`,
      itemDetails: isCurrentlyOff
        ? `الحالة الحالية: عطلة رسمية معتمدة${isGroupSpecific ? ` لـ (كروب ${selectedScheduleGroup})` : ''}`
        : `الحالة الحالية: يوم دوام رسمي ${dayLecturesCount > 0 ? `(يحتوي على ${dayLecturesCount} محاضرة مجدولة)` : '(لا توجد محاضرات مجدولة)'}${isGroupSpecific ? ` لـ (كروب ${selectedScheduleGroup})` : ''}`,
      warningMessage: actionWarning,
      confirmText: confirmBtnText,
      variant: isCurrentlyOff ? 'success' : 'warning',
      iconType: isCurrentlyOff ? 'check' : 'alert',
      onConfirm: () => {
        let newWorkingDays: DayOfWeek[];
        let newOffDays: DayOfWeek[];

        if (isCurrentlyOff) {
          // تحويله إلى يوم دوام
          newOffDays = currentScheduleConfig.off_days.filter((d: DayOfWeek) => d !== dayKey);
          newWorkingDays = [...currentScheduleConfig.working_days.filter((d: DayOfWeek) => d !== dayKey), dayKey];
        } else {
          // تحويله إلى يوم عطلة
          newWorkingDays = currentScheduleConfig.working_days.filter((d: DayOfWeek) => d !== dayKey);
          newOffDays = [...currentScheduleConfig.off_days.filter((d: DayOfWeek) => d !== dayKey), dayKey];
        }

        const isGroupSpecific = selectedScheduleGroup !== 'all'; // 👥 هل التعديل خاص بكروب مستقل
        const targetGroupVal = isGroupSpecific ? selectedScheduleGroup : undefined; // 🏷️ تعيين الكروب المستهدف

        const updatedConfig: DepartmentScheduleConfig = {
          ...currentScheduleConfig,
          id: isGroupSpecific
            ? `cfg-${currentDeptId}-${selectedScheduleStage}-${selectedScheduleSemester}-${selectedScheduleStudyType}-${selectedScheduleGroup}`
            : currentScheduleConfig.id, // 🆔 الحفاظ على المعرف الفريد للكروب
          department_id: currentDeptId, // 🏢 معرف القسم
          stage_number: selectedScheduleStage, // 🎓 المرحلة
          semester: selectedScheduleSemester, // 🗓️ الكورس
          academic_year: getAcademicYear(), // 📅 العام الدراسي المعتمد
          study_type: selectedScheduleStudyType, // ☀️ نوع الدراسة (صباحي / مسائي)
          target_group: targetGroupVal, // 👥 حفظ الكروب المستهدف لعزله عن باقي الكروبات
          working_days: newWorkingDays, // 💼 أيام الدوام المحدثة
          off_days: newOffDays, // 🏖️ أيام العطل المحدثة
          updated_at: new Date().toISOString(), // ⏰ تاريخ التحديث
        };

        const existingIndex = scheduleConfigs.findIndex(
          (c: DepartmentScheduleConfig) =>
            c.department_id === currentDeptId &&
            c.stage_number === selectedScheduleStage &&
            c.semester === selectedScheduleSemester &&
            (!selectedScheduleStudyType || !c.study_type || c.study_type === selectedScheduleStudyType) &&
            ((isGroupSpecific && c.target_group === targetGroupVal) ||
             (!isGroupSpecific && (!c.target_group || c.target_group === 'all')))
        );

        let updatedConfigsList: DepartmentScheduleConfig[];
        if (existingIndex >= 0) {
          updatedConfigsList = [...scheduleConfigs];
          updatedConfigsList[existingIndex] = updatedConfig;
        } else {
          updatedConfigsList = [...scheduleConfigs, updatedConfig];
        }

        setScheduleConfigs(updatedConfigsList);
        saveStoredData('department_schedule_configs', updatedConfigsList);
        saveScheduleConfigToSupabase(updatedConfig); // ☁️ حفظ ومزامنة إعدادات الجدول مع Supabase

        setSuccessMessage(`تم تعديل يوم (${dayName}) إلى ${isCurrentlyOff ? 'يوم دوام رسمي' : 'عطلة رسمية'}${isGroupSpecific ? ` لكروب ${selectedScheduleGroup}` : ''} بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🔄 استعادة أيام الدوام والعطل الافتراضية
  const handleResetWorkingDays = () => {
    const isGroupSpecific = selectedScheduleGroup !== 'all';
    const targetGroupVal = isGroupSpecific ? selectedScheduleGroup : undefined;
    const stageName = getStageNameInArabic(selectedScheduleStage);
    const groupLabel = isGroupSpecific ? ` (كروب ${selectedScheduleGroup})` : '';

    setDeleteModalConfig({
      isOpen: true,
      title: `استعادة أيام الدوام الافتراضية${isGroupSpecific ? ` — كروب ${selectedScheduleGroup}` : ''}`,
      itemName: `جدول دوام قسم ${deptName}${isGroupSpecific ? ` — كروب ${selectedScheduleGroup}` : ''}`,
      itemDetails: `المرحلة ${stageName}${groupLabel} - الفصل ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'} (${selectedScheduleStudyType === 'evening' ? 'مسائي' : 'صباحي'})`,
      warningMessage: `هل تريد استعادة أيام الدوام الافتراضية لطلبة المرحلة ${stageName}${groupLabel} (السبت إلى الأربعاء دوام، والخميس والجمعة عطلة رسمية)؟`,
      confirmText: 'استعادة الافتراضي',
      variant: 'warning',
      iconType: 'alert',
      onConfirm: () => {
        const resetConfig: DepartmentScheduleConfig = {
          ...currentScheduleConfig,
          id: isGroupSpecific
            ? `cfg-${currentDeptId}-${selectedScheduleStage}-${selectedScheduleSemester}-${selectedScheduleStudyType}-${selectedScheduleGroup}`
            : currentScheduleConfig.id,
          department_id: currentDeptId,
          stage_number: selectedScheduleStage,
          semester: selectedScheduleSemester,
          study_type: selectedScheduleStudyType,
          target_group: targetGroupVal,
          working_days: [...DEFAULT_WORKING_DAYS],
          off_days: [...DEFAULT_OFF_DAYS],
          updated_at: new Date().toISOString(),
        };

        const existingIndex = scheduleConfigs.findIndex(
          (c: DepartmentScheduleConfig) =>
            c.department_id === currentDeptId &&
            c.stage_number === selectedScheduleStage &&
            c.semester === selectedScheduleSemester &&
            (!selectedScheduleStudyType || !c.study_type || c.study_type === selectedScheduleStudyType) &&
            ((isGroupSpecific && c.target_group === targetGroupVal) ||
             (!isGroupSpecific && (!c.target_group || c.target_group === 'all')))
        );

        let updatedConfigsList: DepartmentScheduleConfig[];
        if (existingIndex >= 0) {
          updatedConfigsList = [...scheduleConfigs];
          updatedConfigsList[existingIndex] = resetConfig;
        } else {
          updatedConfigsList = [...scheduleConfigs, resetConfig];
        }

        setScheduleConfigs(updatedConfigsList);
        saveStoredData('department_schedule_configs', updatedConfigsList);
        saveScheduleConfigToSupabase(resetConfig);

        setSuccessMessage('تمت استعادة أيام الدوام والعطل الرسمية الافتراضية بنجاح!');
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📅 حفظ تاريخ انطلاق الفصل وإعادة معايرة كافة المحاضرات فورياً
  const handleSaveSemesterStartDate = (newStartDate: string) => {
    if (!newStartDate) return;

    // 1. تحديث كافة سجلات إعدادات المراحل الـ 4 والفصلين للقسم
    const updatedConfigsList = [...scheduleConfigs];
    const allStages = [1, 2, 3, 4];
    const allSemesters: (1 | 2)[] = [1, 2];

    allStages.forEach((stg: number) => {
      allSemesters.forEach((sem: 1 | 2) => {
        const existingIdx = updatedConfigsList.findIndex(
          (c: DepartmentScheduleConfig) => c.department_id === currentDeptId && c.stage_number === stg && c.semester === sem
        );
        if (existingIdx >= 0) {
          const cfgToUpdate: DepartmentScheduleConfig = {
            ...updatedConfigsList[existingIdx]!,
            start_date: newStartDate,
            academic_year: getAcademicYear(),
            updated_at: new Date().toISOString(),
          };
          updatedConfigsList[existingIdx] = cfgToUpdate;
          saveScheduleConfigToSupabase(cfgToUpdate);
        } else {
          const newCfg: DepartmentScheduleConfig = {
            id: `cfg-${currentDeptId}-${stg}-${sem}`,
            department_id: currentDeptId,
            stage_number: stg,
            semester: sem,
            academic_year: getAcademicYear(),
            start_date: newStartDate,
            working_days: [...DEFAULT_WORKING_DAYS],
            off_days: [...DEFAULT_OFF_DAYS],
            updated_at: new Date().toISOString(),
          };
          updatedConfigsList.push(newCfg);
          saveScheduleConfigToSupabase(newCfg);
        }
      });
    });

    setScheduleConfigs(updatedConfigsList);
    saveStoredData('department_schedule_configs', updatedConfigsList);

    try {
      localStorage.setItem(`department_semester_start_date_${currentDeptId}`, newStartDate);
    } catch {
      // 🛡️ حماية من أخطاء التخزين
    }

    // 🔄 2. إعادة معايرة وتحديث تواريخ كافة محاضرات القسم المجدولة
    const recalibratedLectures = scheduleLectures.map((l: ScheduleLecture) => {
      if (isLectureInCurrentDept(l)) {
        const wk = l.week_number || 1;
        const newBaseDate = calculateDateForAnyDayInWeek(newStartDate, 1, wk, l.day);
        const all15 = generateAll15WeeksDates(newBaseDate, l.day, wk);
        const map15: Record<number, string> = {};
        all15.forEach((item: { weekNumber: number; date: string }) => {
          map15[item.weekNumber] = item.date;
        });
        return {
          ...l,
          date: newBaseDate,
          custom_weekly_dates: map15,
        };
      }
      return l;
    });

    setScheduleLectures(recalibratedLectures);
    saveStoredData('schedule_lectures', recalibratedLectures);
    const currentDeptLectures = recalibratedLectures.filter((l: ScheduleLecture) => isLectureInCurrentDept(l));
    saveScheduleLecturesBulkToSupabase(currentDeptLectures);

    // 📡 3. بث حدث متزامن عام بالمتصفح
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('semester-start-date-updated', {
          detail: { departmentId: currentDeptId, startDate: newStartDate },
        })
      );
    }
  };

  // 📥 تنزيل نموذج Excel معتمد لمحاضرات الجدول الأسبوعي
  const handleDownloadScheduleTemplate = async () => {
    await generateDepartmentScheduleTemplate(deptName, deptCourses, deptTeachers);
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لجدول قسم (${deptName}) بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📤 استيراد ومعالجة ملف Excel لمحاضرات الجدول الأسبوعي
  const handleScheduleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDeptId) return;

    try {
      setIsImportingScheduleExcel(true);
      const rows = await parseExcelFile(file);

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newLecturesToAdd: ScheduleLecture[] = [];
      const tempAllLectures = [...scheduleLectures];

      // تحويل اليوم من نص عربي أو إنكليزي إلى DayOfWeek
      const parseDayOfWeek = (raw: string): DayOfWeek => {
        const cleaned = raw.trim().toLowerCase();
        if (cleaned.includes('سبت') || cleaned === 'saturday') return 'saturday';
        if (cleaned.includes('أحد') || cleaned.includes('احد') || cleaned === 'sunday') return 'sunday';
        if (cleaned.includes('اثنين') || cleaned.includes('إثنين') || cleaned.includes('ثنين') || cleaned === 'monday') return 'monday';
        if (cleaned.includes('ثلاثاء') || cleaned.includes('ثلثاء') || cleaned === 'tuesday') return 'tuesday';
        if (cleaned.includes('أربعاء') || cleaned.includes('اربعاء') || cleaned === 'wednesday') return 'wednesday';
        if (cleaned.includes('خميس') || cleaned === 'thursday') return 'thursday';
        if (cleaned.includes('جمعة') || cleaned.includes('جمعه') || cleaned === 'friday') return 'friday';
        return 'sunday';
      };

      // تحويل الوقت إلى تنسيق 24 ساعة HH:MM
      const parseTimeString = (raw: string, defaultTime: string): string => {
        if (!raw) return defaultTime;
        const cleaned = raw.trim();
        const isPM = cleaned.includes('م') || cleaned.toLowerCase().includes('pm');
        const isAM = cleaned.includes('ص') || cleaned.toLowerCase().includes('am');

        const timeMatch = cleaned.match(/(\d{1,2})[:.](\d{1,2})/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1] || '0', 10);
          const minutes = parseInt(timeMatch[2] || '0', 10);
          if (isPM && hours < 12) hours += 12;
          if (isAM && hours === 12) hours = 0;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return defaultTime;
      };

      rows.forEach((row: Record<string, string | number>, index: number) => {
        const rowNum = index + 2;
        const rawCourseName = String(row['اسم المادة'] || row['المادة'] || row['Course Name'] || row['Course'] || '').trim();
        const rawStage = parseInt(String(row['المرحلة'] || row['Stage'] || '1').replace(/[^\d]/g, ''), 10);
        const rawSemester = parseInt(String(row['الكورس'] || row['الفصل'] || row['Semester'] || '1').replace(/[^\d]/g, ''), 10);
        const rawStudyType = String(row['نوع الدراسة'] || row['الفترة'] || row['Study Type'] || 'صباحي').trim();
        const rawDay = String(row['اليوم'] || row['Day'] || '').trim();
        const rawStartTime = String(row['وقت البدء'] || row['من'] || row['Start Time'] || '').trim();
        const rawEndTime = String(row['وقت الانتهاء'] || row['إلى'] || row['End Time'] || '').trim();
        const rawRoom = String(row['القاعة'] || row['المختبر'] || row['Room'] || '').trim();
        const rawTeacherName = String(row['اسم الأستاذ'] || row['الأستاذ'] || row['المحاضر'] || row['Teacher Name'] || '').trim();
        const rawType = String(row['نوع المحاضرة'] || row['النوع'] || row['Type'] || '').trim();
        const rawNotes = String(row['ملاحظات'] || row['Notes'] || '').trim();
        const rawDate = String(row['التاريخ'] || row['Date'] || '').trim();
        const rawWeekNumber = parseInt(String(row['الأسبوع'] || row['Week'] || '1').replace(/[^\d]/g, ''), 10);
        // 👥 قراءة حقل الكروب المستقل من ملف Excel وتنظيفه بدقة
        const rawGroup = String(row['الكروب'] || row['المجموعة'] || row['الشعبة'] || row['Group'] || '').trim();
        const parsedGroup = rawGroup ? rawGroup.replace(/^(كروب|شعبة|مجموعة)\s*/i, '').trim().toUpperCase() : 'all';

        if (!rawCourseName || rawCourseName.length < 2) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawCourseName || 'اسم مادة فارغ',
            reason: 'حقل اسم المادة الدراسية فارغ أو غير مكتمل',
          });
          return;
        }

        const stageNumber = [1, 2, 3, 4].includes(rawStage) ? rawStage : 1;
        const semesterNumber = (rawSemester === 2 ? 2 : 1) as 1 | 2;
        const isEvening = rawStudyType.includes('مسائي') || rawStudyType.toLowerCase() === 'evening';
        const parsedStudyType: 'morning' | 'evening' = isEvening ? 'evening' : 'morning';
        const parsedDay = parseDayOfWeek(rawDay);
        const startTime = parseTimeString(rawStartTime, isEvening ? '14:00' : '08:30');
        const endTime = parseTimeString(rawEndTime, isEvening ? '16:00' : '10:30');
        const roomName = rawRoom || 'قاعة دراسية';

        const isPractical = rawType.includes('عملي') || rawType.includes('مختبر') || rawType.toLowerCase() === 'practical';
        const parsedLectureType: LectureType = isPractical ? 'practical' : 'theory';

        // مطابقة المادة مع مواد القسم الحالية
        const matchedCourse = deptCourses.find(
          (c: Course) =>
            c.name.trim().toLowerCase() === rawCourseName.toLowerCase() ||
            c.code.trim().toLowerCase() === rawCourseName.toLowerCase() ||
            c.name.includes(rawCourseName) ||
            rawCourseName.includes(c.name)
        );

        const isMatchedCoursePractical = matchedCourse
          ? matchedCourse.course_type === 'theory_and_practical' || Boolean(matchedCourse.has_practical)
          : true;

        const finalLectureType: LectureType = (!isMatchedCoursePractical && matchedCourse) ? 'theory' : parsedLectureType;
        const finalLectureColor: LectureColor = finalLectureType === 'practical' ? 'emerald' : 'blue';

        const courseId = matchedCourse ? matchedCourse.id : `crs-auto-${Date.now()}-${index}`;
        const finalCourseName = matchedCourse ? matchedCourse.name : rawCourseName;
        const finalCourseCode = matchedCourse ? matchedCourse.code : `CRS-${stageNumber}0${index + 1}`;

        // مطابقة الأستاذ مع أساتذة القسم
        const matchedTeacher = rawTeacherName
          ? deptTeachers.find(
              (t: UserProfile) =>
                t.full_name.trim().toLowerCase() === rawTeacherName.toLowerCase() ||
                t.full_name.includes(rawTeacherName) ||
                rawTeacherName.includes(t.full_name)
            )
          : matchedCourse
          ? deptTeachers.find((t: UserProfile) => t.id === (finalLectureType === 'practical' ? matchedCourse.practical_teacher_id : matchedCourse.theory_teacher_id))
          : undefined;

        const teacherId = matchedTeacher ? matchedTeacher.id : '';
        const teacherFullName = matchedTeacher ? matchedTeacher.full_name : rawTeacherName;

        // فحص التكرار الدقيق مع مراعاة الكروب المستهدف
        const isDuplicate = tempAllLectures.some(
          (l: ScheduleLecture) =>
            isLectureInCurrentDept(l) &&
            l.stage_number === stageNumber &&
            l.semester === semesterNumber &&
            (l.study_type || 'morning') === parsedStudyType &&
            (l.target_group || 'all') === (parsedGroup || 'all') && // 👥 فحص تطابق الكروب
            l.day === parsedDay &&
            l.start_time === startTime &&
            (l.room === roomName || l.course_name.toLowerCase() === finalCourseName.toLowerCase())
        );

        if (isDuplicate) {
          duplicates.push({
            name: `${finalCourseName} (${DAYS_OF_WEEK_LIST.find((d: { key: DayOfWeek; label_ar: string }) => d.key === parsedDay)?.label_ar || parsedDay})`,
            email: `${startTime} - ${endTime} | ${roomName} ${parsedGroup !== 'all' ? `(كروب ${parsedGroup})` : ''}`,
            dept: `مرحلة ${stageNumber} (كورس ${semesterNumber}) - ${parsedStudyType === 'evening' ? 'مسائي' : 'صباحي'}`,
            reason: 'محاضرة مجدولة مسبقاً في نفس التوقيت واليوم والقاعة والكروب',
          });
          return;
        }

        const validWeek = !isNaN(rawWeekNumber) && rawWeekNumber >= 1 && rawWeekNumber <= 15 ? rawWeekNumber : 1;
        let cascaded15Dates: Record<number, string> | undefined = undefined;
        if (rawDate) {
          const generatedList = generateAll15WeeksDates(rawDate, parsedDay, 1);
          const tempMap: Record<number, string> = {};
          generatedList.forEach((item: { weekNumber: number; date: string }) => {
            tempMap[item.weekNumber] = item.date;
          });
          cascaded15Dates = tempMap;
        }

        const newLecId = `lec-xl-${Date.now()}-${index}`;
        const newLecture: ScheduleLecture = {
          id: newLecId,
          department_id: currentDeptId || 'dept-1',
          stage_number: stageNumber,
          semester: semesterNumber,
          course_id: courseId,
          course_name: finalCourseName,
          course_code: finalCourseCode,
          teacher_id: teacherId || undefined,
          teacher_name: teacherFullName || undefined,
          day: parsedDay,
          start_time: startTime,
          end_time: endTime,
          room: roomName,
          type: finalLectureType,
          study_type: parsedStudyType,
          color: finalLectureColor,
          notes: rawNotes || undefined,
          target_group: parsedGroup || 'all', // 👥 تثبيت الكروب المستهدف المستقل
          week_number: validWeek,
          date: rawDate || undefined,
          custom_weekly_dates: cascaded15Dates,
          created_at: new Date().toISOString(),
        };

        newLecturesToAdd.push(newLecture);
        tempAllLectures.push(newLecture);

        accepted.push({
          name: `${finalCourseName} — ${finalLectureType === 'practical' ? 'مختبر وعملي' : 'محاضرة نظرية'} ${parsedGroup !== 'all' ? `(كروب ${parsedGroup})` : ''}`,
          dept: `المرحلة ${stageNumber} (كورس ${semesterNumber}) | ${DAYS_OF_WEEK_LIST.find((d: { key: DayOfWeek; label_ar: string }) => d.key === parsedDay)?.label_ar || parsedDay} (${startTime} - ${endTime})`,
          email: `${roomName} ${teacherFullName ? `| ${teacherFullName}` : ''}`,
        });
      });

      if (newLecturesToAdd.length > 0) {
        const merged = [...scheduleLectures, ...newLecturesToAdd];
        setScheduleLectures(merged);
        saveStoredData('schedule_lectures', merged);
        saveScheduleLecturesBulkToSupabase(newLecturesToAdd);
      }

      setScheduleImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setScheduleActiveReportTab(
        accepted.length > 0 ? 'accepted' : duplicates.length > 0 ? 'duplicates' : 'rejected'
      );

      if (accepted.length > 0) {
        setSuccessMessage(`تمت معالجة ملف الإكسل وإضافة (${accepted.length}) محاضرة دراسية للجدول بنجاح! 📊🎉`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من اختيار ملف Excel صالح (.xlsx)');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingScheduleExcel(false);
      e.target.value = '';
    }
  };

  // 📤 تصدير جدول المحاضرات للقسم إلى ملف Excel
  const handleExportScheduleToExcel = async () => {
    const rawDeptLectures = scheduleLectures.filter((l: ScheduleLecture) => isLectureInCurrentDept(l));

    if (rawDeptLectures.length === 0) {
      setErrorMessage('لا توجد محاضرات مجدولة حالياً للتصدير في هذا القسم.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
    const displayWeek = selectedScheduleWeek || 1;

    const deptLectures = rawDeptLectures.map((l: ScheduleLecture) => {
      const weekOverride = l.weekly_overrides?.[displayWeek];
      const effectiveDay = weekOverride?.day || l.day;
      const effectiveDate = weekOverride?.date
        || l.custom_weekly_dates?.[displayWeek]
        || calculateDateForAnyDayInWeek(baseStart, 1, displayWeek, effectiveDay);
      return {
        ...l,
        week_number: displayWeek,
        date: effectiveDate,
        day: effectiveDay,
        room: weekOverride?.room || l.room,
        start_time: weekOverride?.start_time || l.start_time,
        end_time: weekOverride?.end_time || l.end_time,
        teacher_name: weekOverride?.teacher_name || l.teacher_name,
      };
    });

    await exportCustomScheduleList(deptLectures, `${deptName}_الأسبوع_${displayWeek}`);
    setSuccessMessage(`تم تصدير (${deptLectures.length}) محاضرة دراسية للأسبوع (${displayWeek}) إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 📑 إدارة وحفظ جدول الامتحانات النهائية الفاينل
  const handleSaveExamSchedule = (schedule: FinalExamSchedule, newSlots: FinalExamSlot[]) => {
    const previousScheduleSlots = finalExamSlots.filter((s: FinalExamSlot) => s.schedule_id === schedule.id);
    const removedSlots = previousScheduleSlots.filter((s: FinalExamSlot) => !newSlots.some((ns: FinalExamSlot) => ns.id === s.id));
    removedSlots.forEach((rs: FinalExamSlot) => {
      deleteFinalExamSlotFromSupabase(rs.id);
    });

    const updatedSchedules = finalExamSchedules.some((s: FinalExamSchedule) => s.id === schedule.id)
      ? finalExamSchedules.map((s: FinalExamSchedule) => (s.id === schedule.id ? schedule : s))
      : [...finalExamSchedules, schedule];

    const otherScheduleSlots = finalExamSlots.filter((s: FinalExamSlot) => s.schedule_id !== schedule.id);
    const scheduleNewSlots = newSlots.filter((s: FinalExamSlot) => s.schedule_id === schedule.id);
    const otherNewSlots = newSlots.filter((s: FinalExamSlot) => s.schedule_id !== schedule.id);

    const slotMap = new Map<string, FinalExamSlot>();
    otherScheduleSlots.forEach((s: FinalExamSlot) => slotMap.set(s.id, s));
    otherNewSlots.forEach((s: FinalExamSlot) => slotMap.set(s.id, s));
    scheduleNewSlots.forEach((s: FinalExamSlot) => slotMap.set(s.id, s));

    const updatedSlots = Array.from(slotMap.values());

    setFinalExamSchedules(updatedSchedules);
    setFinalExamSlots(updatedSlots);

    saveStoredData('final_exam_schedules', updatedSchedules);
    saveStoredData('final_exam_slots', updatedSlots);

    saveFinalExamScheduleToSupabase(schedule);
    if (newSlots.length > 0) {
      saveFinalExamSlotsToSupabase(newSlots);
    }
  };

  // 🕒 حساب وقت نهاية المحاضرة حسب نظام الكليات بالعراق
  const calculateEndTimeFromStart = (startTime: string, type: LectureType | ''): string => {
    if (!startTime) return '';
    const [hStr, mStr] = startTime.split(':');
    const startH = parseInt(hStr || '0', 10);
    const startM = parseInt(mStr || '0', 10);
    const totalStartMinutes = startH * 60 + startM;
    const durationMinutes = type === 'practical' ? 60 : 90;
    let totalEndMinutes = totalStartMinutes + durationMinutes;
    if (totalEndMinutes > 21 * 60 + 30) {
      totalEndMinutes = 21 * 60 + 30;
    }
    const endH = Math.floor(totalEndMinutes / 60);
    const endM = totalEndMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // 🕒 حساب التوقيت التالي للمحاضرة القادمة تلقائياً
  const advanceToNextTimeSlot = (currentEndTime: string, type: LectureType | '' = 'theory'): { nextStart: string; nextEnd: string } => {
    const nextStart = currentEndTime;
    const nextEnd = calculateEndTimeFromStart(nextStart, type);
    return {
      nextStart,
      nextEnd,
    };
  };

  // 💾 حفظ المحاضرة (إضافة أو تعديل)
  const handleSaveLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lecDay) {
      setErrorMessage('يرجى اختيار اليوم الأسبوعي للمحاضرة أولاً.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecType) {
      setErrorMessage('يرجى اختيار طبيعة المحاضرة أولاً (محاضرة نظرية أو مختبر عملي).');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecCourseId) {
      setErrorMessage('يرجى اختيار المادة الدراسية أولاً.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecRoom.trim()) {
      setErrorMessage('يرجى تحديد القاعة الدراسية أو المختبر.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecStartTime) {
      setErrorMessage('يرجى تحديد وقت بدء المحاضرة.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecEndTime) {
      setErrorMessage('يرجى تحديد وقت انتهاء المحاضرة.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const course = courses.find((c: Course) => c.id === lecCourseId);
    if (!course) return;

    const safeType: LectureType = lecType;
    const safeColor = lecColor || (safeType === 'practical' ? 'emerald' : 'blue');
    const safeDay: DayOfWeek = (lecDay as DayOfWeek) || 'saturday';
    const teacher = deptTeachers.find((t: UserProfile) => t.id === lecTeacherId);

    // فحص التضارب الزمني
    if (currentLecConflicts.length > 0) {
      setErrorMessage(currentLecConflicts[0]?.message || 'يوجد تعارض زمني في القاعة أو الأستاذ لهذا التوقيت!');
      setTimeout(() => setErrorMessage(''), 4500);
      return;
    }

    const dayLabel = DAYS_OF_WEEK_LIST.find((d: { key: DayOfWeek; label_ar: string }) => d.key === lecDay)?.label_ar || lecDay;
    const currentEditingId = editingLectureId;

    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
    const targetWk = lecWeekNumber || 1;
    let actualLecDate = lecDate;
    if (!actualLecDate || getDayOfWeekFromDateString(actualLecDate) !== safeDay) {
      actualLecDate = calculateDateForAnyDayInWeek(baseStart, 1, targetWk, safeDay);
    }
    const effectiveBaseDate = actualLecDate || calculateDateForAnyDayInWeek(baseStart, 1, targetWk, safeDay);
    // 🔢 حساب قائمة الأسابيع الدراسية النشطة للمحاضرة بدقة
    let computedActiveWeeks: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 🌟 افتراضياً كافة الأسابيع الـ 15
    if (lecWeeksScope === 'this_week_only') { // 📍 خيار هذا الأسبوع فقط
      computedActiveWeeks = [targetWk]; // 🔢 أسبوع واحد فقط
    } else if (lecWeeksScope === 'odd_weeks') { // 🔢 الأسابيع الفردية
      computedActiveWeeks = [1, 3, 5, 7, 9, 11, 13, 15]; // 🎯 قائمة الأسابيع الفردية
    } else if (lecWeeksScope === 'even_weeks') { // 🔢 الأسابيع الزوجية
      computedActiveWeeks = [2, 4, 6, 8, 10, 12, 14]; // 🎯 قائمة الأسابيع الزوجية
    } else if (lecWeeksScope === 'custom_pick') { // ✋ اختيار يدوي مخصص
      computedActiveWeeks = lecCustomWeeks.length > 0 ? [...lecCustomWeeks].sort((a, b) => a - b) : [targetWk]; // 🎯 القائمة المخصصة مرتبة
    } else if (!lecAutoCascadeWeeks && targetWk === 1) { // 🛑 تعطيل التعاقب بالأسبوع 1
      computedActiveWeeks = [1]; // 🔢 الأسبوع الأول فقط
    } else if (targetWk > 1 && lecCascadeShiftOption === 'this_week_only') { // 📌 استثناء هذا الأسبوع فقط
      computedActiveWeeks = [targetWk]; // 🔢 الأسبوع الحالي فقط
    } else if (targetWk > 1 && lecCascadeShiftOption === 'cascade_following') { // ➡️ ترحيل للأسابيع اللاحقة
      computedActiveWeeks = Array.from({ length: 16 - targetWk }, (_, i) => targetWk + i); // 🔢 من الأسبوع الحالي إلى الأسبوع 15
    } // 🔚 نهاية تحديد الأسابيع

    const all15DatesMap: Record<number, string> = {}; // 📅 خريطة التواريخ المحسوبة
    if (effectiveBaseDate) { // 🛡️ إذا وجد تاريخ أساس
      computedActiveWeeks.forEach((w) => { // 🔄 توليد التواريخ للأسابيع النشطة حصراً
        all15DatesMap[w] = calculateDateForAnyDayInWeek(baseStart, 1, w, safeDay); // 🧮 حساب التاريخ الدقيق لليوم والأسبوع
      }); // 🔚 نهاية التكرار
    } // 🔚 نهاية الشرط

    if (editingLectureId) {
      // ✏️ تعديل محاضرة قائمة
      let updatedLecToSync: ScheduleLecture | null = null;
      const updated = scheduleLectures.map((l: ScheduleLecture) => {
        if (l.id === editingLectureId) {
          const updatedWeeklyOverrides: Record<number, { day?: DayOfWeek; date?: string; start_time?: string; end_time?: string; room?: string; teacher_id?: string; teacher_name?: string; is_cancelled?: boolean }> = l.weekly_overrides ? { ...l.weekly_overrides } : {}; // ⚙️ استنساخ الاستثناءات السابقة

          if (lecCascadeShiftOption === 'this_week_only' && targetWk > 1) { // 🎯 تعديل خاص بهذا الأسبوع فقط كاستثناء دون المساس ببقية الأسابيع
            updatedWeeklyOverrides[targetWk] = { // 📝 تسجيل استثناء لهذا الأسبوع المختار حصراً
              ...(updatedWeeklyOverrides[targetWk] || {}), // 📋 الحقول السابقة
              day: safeDay, // 🗓️ اليوم المعدل
              date: effectiveBaseDate, // 📅 التاريخ المعدل
              start_time: lecStartTime, // ⏰ وقت البدء المعدل
              end_time: lecEndTime, // ⏰ وقت الانتهاء المعدل
              room: lecRoom.trim(), // 🏛️ القاعة المعدلة
              teacher_id: teacher ? teacher.id : undefined, // 👨‍🏫 معرف الأستاذ المعدل
              teacher_name: teacher ? teacher.full_name : undefined, // 👤 اسم الأستاذ المعدل
              is_cancelled: false, // ✅ تأكيد عدم الإلغاء
            }; // 🔚 نهاية الاستثناء
            all15DatesMap[targetWk] = effectiveBaseDate; // 📅 تحديث تاريخ هذا الأسبوع
          } else if (originalLecDay && originalLecDay !== safeDay && (lecCascadeShiftOption === 'cascade_following' || lecCascadeShiftOption === 'all_15_weeks')) { // 🔀 إذا تم تغيير اليوم وترحيله
            const startWeek = lecCascadeShiftOption === 'all_15_weeks' ? 1 : (lecWeekNumber || 1); // 🔢 أسبوع بداية الترحيل
            const shiftedMap = shiftLectureToAnyDay(originalLecDay, safeDay, startWeek, effectiveBaseDate, 15, targetWk); // 🔄 إزاحة الأيام
            for (let w = startWeek; w <= 15; w++) { // 🔁 تكرار الترحيل
              const shiftInfo = shiftedMap[w]; // ℹ️ بيانات اليوم المرحل
              if (shiftInfo) { // 🎯 إذا وجدت بيانات
                updatedWeeklyOverrides[w] = { // 📝 تحديث استثناء الأسبوع
                  ...(updatedWeeklyOverrides[w] || {}), // 📋 البيانات السابقة
                  day: shiftInfo.day, // 🗓️ اليوم الجديد
                  date: shiftInfo.date, // 📅 التاريخ الجديد
                  start_time: lecStartTime, // ⏰ وقت البدء
                  end_time: lecEndTime, // ⏰ وقت الانتهاء
                  room: lecRoom.trim(), // 🏛️ القاعة
                  teacher_id: teacher ? teacher.id : undefined, // 👨‍🏫 معرف الأستاذ
                  teacher_name: teacher ? teacher.full_name : undefined, // 👤 اسم الأستاذ
                  is_cancelled: false, // ✅ غير ملغاة
                }; // 🔚 نهاية استثناء الأسبوع
                all15DatesMap[w] = shiftInfo.date; // 📅 حفظ التاريخ
              } // 🔚 نهاية الشرط
            } // 🔚 نهاية التكرار
          } // 🔚 نهاية الشرط

          const isScopeThisWeekOnly = lecCascadeShiftOption === 'this_week_only' && targetWk > 1; // 🔍 فحص هل التعديل خاص بهذا الأسبوع فقط
          const finalActiveWeeks = isScopeThisWeekOnly ? (l.active_weeks || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) : computedActiveWeeks; // 🔢 الأسابيع النشطة

          const editedLec: ScheduleLecture = {
            ...l,
            course_id: course.id,
            course_name: course.name,
            course_code: course.code,
            teacher_id: teacher ? teacher.id : undefined,
            teacher_name: teacher ? teacher.full_name : undefined,
            day: isScopeThisWeekOnly ? l.day : safeDay,
            start_time: isScopeThisWeekOnly ? l.start_time : lecStartTime,
            end_time: isScopeThisWeekOnly ? l.end_time : lecEndTime,
            room: isScopeThisWeekOnly ? l.room : lecRoom.trim(),
            color: safeColor,
            type: safeType,
            study_type: lecStudyType,
            date: effectiveBaseDate,
            active_weeks: finalActiveWeeks,
            week_number: lecWeekNumber || 1,
            custom_weekly_dates: Object.keys(all15DatesMap).length > 0 ? all15DatesMap : undefined,
            weekly_overrides: Object.keys(updatedWeeklyOverrides).length > 0 ? updatedWeeklyOverrides : undefined,
            notes: lecNotes.trim() || undefined,
            target_group: lecTargetGroup || 'all', // 👥 حفظ الكروب المستهدف
          };
          updatedLecToSync = editedLec;
          return editedLec;
        }
        return l;
      });

      setScheduleLectures(updated);
      saveStoredData('schedule_lectures', updated);
      if (updatedLecToSync) {
        saveScheduleLectureToSupabase(updatedLecToSync);
      }

      sendAppNotification({
        recipient_id: 'all',
        recipient_role: 'student',
        title: `تحديث في جدول المحاضرات الأسبوعي`,
        message: `تم تحديث موعد/قاعة محاضرة مادة (${course.name}) ليوم ${dayLabel} (${lecStartTime} - ${lecEndTime}) في ${lecRoom.trim()} للمرحلة ${selectedScheduleStage}.`,
        type: 'schedule_updated',
        link: '/student/dashboard',
      });

      if (closeModalAfterSave) {
        const savedY: number = lastScheduleScrollYRef.current;
        setIsLectureModalOpen(false);
        setSuccessMessage(`تم تحديث محاضرة (${course.name}) في جدول يوم ${dayLabel} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        resetLectureModalState();
        if (typeof window !== 'undefined' && savedY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: savedY, behavior: 'instant' });
          }, 20);
        }
      } else {
        setRecentlyAddedLectureId(currentEditingId);
        setTimeout(() => setRecentlyAddedLectureId(null), 5000);
        setSuccessMessage(`تم تحديث بيانات محاضرة (${course.name}) بنجاح في جدول يوم ${dayLabel}!`);
        setTimeout(() => setSuccessMessage(''), 4500);
      }
    } else {
      // ➕ إضافة محاضرة جديدة
      const newLecId = `lec-${Date.now()}`;
      const newLec: ScheduleLecture = {
        id: newLecId,
        department_id: currentDeptId || 'dept-1',
        stage_number: selectedScheduleStage,
        semester: selectedScheduleSemester,
        academic_year_id: getAcademicYear(),
        course_id: course.id,
        course_name: course.name,
        course_code: course.code,
        teacher_id: teacher ? teacher.id : undefined,
        teacher_name: teacher ? teacher.full_name : undefined,
        day: safeDay,
        start_time: lecStartTime,
        end_time: lecEndTime,
        room: lecRoom.trim(),
        color: safeColor,
        type: safeType,
        study_type: lecStudyType,
        date: effectiveBaseDate, // 📅 التاريخ الفعلي
        active_weeks: computedActiveWeeks, // 🔢 قائمة الأسابيع الدراسية المحددة التي تقام فيها هذه المحاضرة
        week_number: lecWeekNumber || 1, // 🔢 رقم الأسبوع الأساسي
        custom_weekly_dates: Object.keys(all15DatesMap).length > 0 ? all15DatesMap : undefined, // 📆 التواريخ التقويمية المحسوبة
        notes: lecNotes.trim() || undefined, // 💡 الملاحظات
        target_group: lecTargetGroup || 'all', // 👥 حفظ الكروب المستهدف
        created_at: new Date().toISOString(), // ⏰ تاريخ الإنشاء
      };

      const updated = [...scheduleLectures, newLec];
      setScheduleLectures(updated);
      saveStoredData('schedule_lectures', updated);
      saveScheduleLectureToSupabase(newLec);

      sendAppNotification({
        recipient_id: 'all',
        recipient_role: 'student',
        title: `محاضرة جديدة في الجدول الأسبوعي`,
        message: `تمت إضافة محاضرة جديدة لمادة (${course.name}) ليوم ${dayLabel} (${lecStartTime} - ${lecEndTime}) في ${lecRoom.trim()} لطلبة المرحلة ${selectedScheduleStage}.`,
        type: 'schedule_updated',
        link: '/student/dashboard',
      });

      if (closeModalAfterSave) {
        const savedY: number = lastScheduleScrollYRef.current;
        setIsLectureModalOpen(false);
        setSuccessMessage(`تمت إضافة محاضرة (${course.name}) إلى جدول المرحلة ${selectedScheduleStage} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        resetLectureModalState();
        if (typeof window !== 'undefined' && savedY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: savedY, behavior: 'instant' });
          }, 20);
        }
      } else {
        setRecentlyAddedLectureId(newLecId);
        setTimeout(() => setRecentlyAddedLectureId(null), 6000);

        setSuccessMessage(`تم إدراج محاضرة (${course.name}) بنجاح في جدول (${dayLabel})!`);
        setTimeout(() => setSuccessMessage(''), 4500);

        setTimeout(() => {
          const cardEl = document.getElementById(`lec-card-${newLecId}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else if (lecListContainerRef.current) {
            lecListContainerRef.current.scrollTo({ top: lecListContainerRef.current.scrollHeight, behavior: 'smooth' });
          }
        }, 150);

        setLecCourseId('');
        setLecTeacherId('');
        setLecRoom('');
        setLecNotes('');
        setLecType('');
        setLecStartTime('');
        setLecEndTime('');
      }
    }
  };

  // 🧹 تصفير استمارة المحاضرة مع الاسترداد التقويمي الذكي
  const resetLectureModalState = (initialDay?: DayOfWeek, initialWeek?: number) => {
    setEditingLectureId(null);
    setOriginalLecDay('');
    setLecType('');
    setLecCourseId('');
    setLecTeacherId('');
    setLecRoom('');
    setLecStartTime('');
    setLecEndTime('');

    const savedStartDate = currentScheduleConfig?.start_date || '2026-09-20';
    const targetWk = initialWeek || selectedScheduleWeek || getCurrentAcademicWeek(savedStartDate) || 1;
    setLecWeekNumber(targetWk);
    const targetDay = initialDay || getDayOfWeekFromDateString(savedStartDate) || (lecDay as DayOfWeek) || 'sunday';
    setLecDay(targetDay);
    const computedDate = calculateDateForAnyDayInWeek(savedStartDate, 1, targetWk, targetDay);
    setLecDate(computedDate || savedStartDate);

    setLecAutoCascadeWeeks(true); // 🔄 تفعيل التوليد التلقائي افتراضياً
    setLecWeeksScope('all_15_weeks'); // 🔢 إعادة ضبط نطاق الأسابيع لكافة الأسابيع الـ 15 افتراضياً
    setLecCustomWeeks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); // 📋 لستة الأسابيع الـ 15 كاملة
    setLecNotes(''); // 🧹 تصفير الملاحظات
    setLecTargetGroup('all'); // 👥 إعادة تعيين الكروب إلى عام افتراضياً
    setLecModalSuccessMsg(''); // ✨ تصفير رسالة النجاح
  };

  // ✏️ فتح استمارة تعديل المحاضرة
  const handleEditLecture = (lec: ScheduleLecture) => {
    if (typeof window !== 'undefined') {
      lastScheduleScrollYRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setEditingLectureId(lec.id);
    setOriginalLecDay(lec.day);
    setSelectedScheduleStage(lec.stage_number);
    setSelectedScheduleSemester((lec.semester || 1) as 1 | 2);
    setLecDay(lec.day);
    setLecCourseId(lec.course_id);
    setLecTeacherId(lec.teacher_id || '');
    setLecRoom(lec.room);
    setLecStartTime(lec.start_time);
    setLecEndTime(lec.end_time);
    setLecColor(lec.color);
    setLecType(lec.type);
    setLecStudyType(lec.study_type || 'morning');

    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
    const targetWeek = selectedScheduleWeek || lec.week_number || 1;
    const weekOverride = lec.weekly_overrides?.[targetWeek];
    if (weekOverride) {
      if (weekOverride.room) setLecRoom(weekOverride.room);
      if (weekOverride.start_time) setLecStartTime(weekOverride.start_time);
      if (weekOverride.end_time) setLecEndTime(weekOverride.end_time);
      if (weekOverride.teacher_id) setLecTeacherId(weekOverride.teacher_id);
    }
    const effectiveDate = weekOverride?.date
      || lec.custom_weekly_dates?.[targetWeek]
      || calculateDateForAnyDayInWeek(baseStart, 1, targetWeek, weekOverride?.day || lec.day);
    setLecWeekNumber(targetWeek);
    setLecDate(effectiveDate);

    // 🔢 قراءة وضبط نطاق الأسابيع المعتمدة للمحاضرة قيد التعديل
    if (lec.active_weeks && lec.active_weeks.length > 0) { // 🔍 إذا المحاضرة محددة بأسابيع معينة
      setLecCustomWeeks(lec.active_weeks); // 📋 تحميل قائمة الأسابيع المحددة
      if (lec.active_weeks.length === 15) { // 🌟 إذا تشمل كل الأسابيع
        setLecWeeksScope('all_15_weeks'); // 🎯 تحديد خيار كل الأسابيع
      } else if (lec.active_weeks.length === 1 && lec.active_weeks[0] === targetWeek) { // 📍 إذا أسبوع واحد فقط
        setLecWeeksScope('this_week_only'); // 🎯 تحديد خيار هذا الأسبوع فقط
      } else { // 🔀 إذا تخصيص يدوي أو فردي/زوجي
        setLecWeeksScope('custom_pick'); // 🎯 تحديد خيار التخصيص اليدوي
      } // 🔚 نهاية فحص الطول
    } else { // 🛡️ إذا ماكو تحديد مسبق للأسابيع
      setLecWeeksScope('all_15_weeks'); // 🌟 افتراضياً كل الأسابيع الـ 15
      setLecCustomWeeks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); // 📋 لستة الأسابيع الـ 15 كاملة
    } // 🔚 نهاية شرط الأسابيع

    setLecAutoCascadeWeeks(true);
    setLecCascadeShiftOption('cascade_following');
    setLecNotes(lec.notes || '');
    setLecTargetGroup(lec.target_group || 'all'); // 👥 قراءة كروب المحاضرة قيد التعديل
    setIsLectureModalOpen(true);
  };

  // 🗑️ حذف محاضرة فردية
  const handleDeleteLecture = (id: string) => {
    const targetLecture = scheduleLectures.find((l: ScheduleLecture) => l.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف المحاضرة من الجدول الأسبوعي',
      itemName: targetLecture?.course_name || 'محاضرة',
      itemDetails: `الأستاذ: ${targetLecture?.teacher_name || '—'} | القاعة: ${targetLecture?.room || '—'} (${targetLecture?.start_time} - ${targetLecture?.end_time})`,
      warningMessage: 'هل أنت متأكد من حذف هذه المحاضرة الأسبوعية من جدول الطلاب؟',
      onConfirm: () => {
        const updated = scheduleLectures.filter((l: ScheduleLecture) => l.id !== id);
        setScheduleLectures(updated);
        saveStoredData('schedule_lectures', updated);
        deleteScheduleLectureFromSupabase(id);
        setSuccessMessage('تم حذف المحاضرة من الجدول الأسبوعي وسحابياً بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🚫 إلغاء أو حذف المحاضرة لأسبوع محدد فقط دون التأثير على بقية الأسابيع الـ 15
  const handleDeleteLectureForWeek = (id: string, weekNumber: number) => { // 🗑️ دالة إلغاء أسبوع فردي
    const targetLecture = scheduleLectures.find((l: ScheduleLecture) => l.id === id); // 🔍 البحث عن المحاضرة
    setDeleteModalConfig({ // ⚙️ تكوين نافذة تأكيد الحذف
      isOpen: true, // 🪟 فتح النافذة
      title: `إلغاء المحاضرة للأسبوع ${weekNumber} فقط`, // 📝 عنوان الحذف الخاص بالأسبوع
      itemName: `${targetLecture?.course_name || 'محاضرة'} (الأسبوع ${weekNumber})`, // 🏷️ اسم المحاضرة
      itemDetails: `سيتم استبعاد وإلغاء هذه المحاضرة في الأسبوع ${weekNumber} فقط، وستبقى معتمدة في سائر الأسابيع الأخرى بشكل طبيعي.`, // ℹ️ التوضيح
      warningMessage: `⚠️ تنبيه: ستظهر المحاضرة كملغاة أو محذوفة لطلبة الأسبوع ${weekNumber} حصراً.`, // ⚠️ التحذير
      confirmText: `تأكيد إلغاء الأسبوع ${weekNumber}`, // 🔘 زر التأكيد
      variant: 'danger', // 🔴 لون التحذير
      iconType: 'trash', // 🗑️ أيقونة السلة
      onConfirm: () => { // ⚡ تنفيذ الإلغاء
        let updatedLecToSync: ScheduleLecture | null = null; // 📦 كائن للمزامنة السحابية
        const updated = scheduleLectures.map((l: ScheduleLecture) => { // 🔄 تحديث مصفوفة المحاضرات
          if (l.id === id) { // 🎯 مطابقة المحاضرة المستهدفة
            const overrides: Record<number, { day?: DayOfWeek; date?: string; start_time?: string; end_time?: string; room?: string; teacher_id?: string; teacher_name?: string; is_cancelled?: boolean }> = l.weekly_overrides ? { ...l.weekly_overrides } : {}; // ⚙️ استنساخ الاستثناءات
            overrides[weekNumber] = { // 🚫 تسجيل حالة الإلغاء للأسبوع
              ...(overrides[weekNumber] || {}), // 📋 الحقول السابقة
              is_cancelled: true, // 🛑 وسم الإلغاء الصريح
            }; // 🔚 نهاية تسجيل الأسبوع
            const updatedLec: ScheduleLecture = { // 📝 بناء المحاضرة المحدثة
              ...l, // 📋 البيانات السابقة
              weekly_overrides: overrides, // ⚙️ إسناد الاستثناءات بعد الإلغاء
            }; // 🔚 نهاية الكائن
            updatedLecToSync = updatedLec; // 🎯 تعيين للمزامنة
            return updatedLec; // 🚀 إرجاع المحاضرة المحدثة
          } // 🔚 نهاية الشرط
          return l; // 🛡️ إرجاع المحاضرات الأخرى
        }); // 🔚 نهاية الماب
        setScheduleLectures(updated); // 💾 تحديث الحالة المحلية
        saveStoredData('schedule_lectures', updated); // 💾 حفظ بالتخزين المحلي
        if (updatedLecToSync) { // ☁️ إذا توفرت محاضرة للمزامنة
          saveScheduleLectureToSupabase(updatedLecToSync); // 🌐 حفظ التحديث في Supabase
        } // 🔚 نهاية المزامنة
        setSuccessMessage(`تم بنجاح إلغاء محاضرة (${targetLecture?.course_name}) للأسبوع ${weekNumber} فقط! 🛑✨`); // 💬 إشعار النجاح
        setTimeout(() => setSuccessMessage(''), 3500); // ⏱️ توقيت الإخفاء
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false })); // 🚪 غلق النافذة
      }, // 🔚 نهاية onConfirm
    }); // 🔚 نهاية تكوين المودال
  }; // 🔚 نهاية الدالة

  // 🗑️ حذف جماعي لمحاضرات الجدول المحددة
  const handleBulkDeleteScheduleLectures = () => {
    if (selectedScheduleLectureIds.length === 0) return;

    const stageLectures = scheduleLectures.filter(
      (l: ScheduleLecture) =>
        isLectureInCurrentDept(l) &&
        l.stage_number === selectedScheduleStage &&
        l.semester === selectedScheduleSemester &&
        (l.study_type || 'morning') === selectedScheduleStudyType
    );
    const isAllSelected =
      stageLectures.length > 0 &&
      stageLectures.every((l: ScheduleLecture) => selectedScheduleLectureIds.includes(l.id));

    setDeleteModalConfig({
      isOpen: true,
      title: isAllSelected ? 'حذف شامل لكافة محاضرات الجدول الأسبوعي' : 'حذف المحاضرات المحددة من الجدول',
      itemName: isAllSelected
        ? `كافة محاضرات المرحلة (${selectedScheduleLectureIds.length} محاضرة)`
        : `${selectedScheduleLectureIds.length} محاضرة أسبوعية`,
      itemDetails: isAllSelected
        ? 'سيتم تفريغ وحذف جميع المحاضرات المجدولة لكافة أسابيع وأيام الفصل الدراسي لهذه المرحلة.'
        : 'سيتم حذف المحاضرات المحددة من الجدول الأسبوعي للمرحلة.',
      warningMessage: '⚠️ تحذير: سيتم إزالة هذه المحاضرات من جداول الطلاب والأساتذة فوراً.',
      confirmText: `تأكيد حذف (${selectedScheduleLectureIds.length}) محاضرة`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        deleteScheduleLecturesBulkFromSupabase(selectedScheduleLectureIds);

        const remaining = scheduleLectures.filter((l: ScheduleLecture) => !selectedScheduleLectureIds.includes(l.id));
        setScheduleLectures(remaining);
        saveStoredData('schedule_lectures', remaining);
        setSelectedScheduleLectureIds([]);
        setSuccessMessage(
          isAllSelected
            ? `تم بنجاح تفريغ وحذف كافة محاضرات الجدول الأسبوعي (${selectedScheduleLectureIds.length} محاضرة)`
            : `تم بنجاح حذف (${selectedScheduleLectureIds.length}) محاضرة من الجدول الأسبوعي`
        );
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }));
      }
    });
  };

  return {
    // 🎛️ خيارات الفلترة والعرض
    selectedScheduleStage, // 🎓 المرحلة المحددة
    setSelectedScheduleStage, // 🔄 تحديث المرحلة
    selectedScheduleSemester, // 📚 الكورس المحدد
    setSelectedScheduleSemester, // 🔄 تحديث الكورس
    selectedScheduleStudyType, // ☀️ نوع الدراسة (صباحي / مسائي)
    setSelectedScheduleStudyType, // 🔄 تحديث نوع الدراسة
    selectedScheduleGroup, // 👥 الكروب المحدد حالياً ('all', 'A', 'B', 'C', 'D')
    setSelectedScheduleGroup, // 🔄 تحديث الكروب المحدد
    selectedWeekByGroup, // 🗓️ سجل الأسابيع المستقلة لكل كروب
    setSelectedWeekByGroup, // 🔄 تحديث قاموس الأسابيع
    selectedScheduleWeek, // 🔢 الأسبوع المحدد للكروب النشط
    setSelectedScheduleWeek, // 🔄 تحديث أسبوع الكروب النشط
    selectedScheduleLectureIds, // 🔘 المحاضرات المحددة
    setSelectedScheduleLectureIds, // 🔄 تحديث التحديد

    // ⚙️ إعدادات الجدول والأسبوع الأكاديمي
    currentScheduleConfig,
    scheduleCurrentAcademicWeek,

    // ⚠️ التضاربات والقاعات الشاغرة
    currentLecConflicts,
    availableRoomsForSlot,

    // 📝 حقول استمارة المحاضرة
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
    lecWeeksScope, // 🔢 نطاق الأسابيع المعتمدة (كافة الأسابيع، هذا الأسبوع فقط، فردية، زوجية، مخصصة)
    setLecWeeksScope, // 🔄 تحديث نطاق الأسابيع
    lecCustomWeeks, // 📋 قائمة الأسابيع المحددة يدوياً
    setLecCustomWeeks, // 🔄 تحديث قائمة الأسابيع المحددة
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
    lecModalSuccessMsg,
    setLecModalSuccessMsg,

    // 🪟 حالات النوافذ المنبثقة
    isLectureModalOpen,
    setIsLectureModalOpen,
    editingLectureId,
    setEditingLectureId,
    recentlyAddedLectureId,
    pendingSemesterStartDate,
    setPendingSemesterStartDate,
    showSemesterDateConfirmModal,
    setShowSemesterDateConfirmModal,
    isPreviewScheduleModalOpen,
    setIsPreviewScheduleModalOpen,
    isSchedulePrintModalOpen,
    setIsSchedulePrintModalOpen,
    isMasterMatrixModalOpen,
    setIsMasterMatrixModalOpen,
    isDurationSettingsModalOpen,
    setIsDurationSettingsModalOpen,
    showScheduleExcelInstructions,
    setShowScheduleExcelInstructions,
    isImportingScheduleExcel,
    scheduleImportReport,
    setScheduleImportReport,
    scheduleActiveReportTab,
    setScheduleActiveReportTab,

    // 📍 مراجع DOM
    lastScheduleScrollYRef,
    lecListContainerRef,

    // 🛠️ معالجات الأحداث
    handleToggleWorkingDay,
    handleResetWorkingDays,
    handleSaveSemesterStartDate,
    handleDownloadScheduleTemplate,
    handleScheduleExcelUpload,
    handleExportScheduleToExcel,
    handleSaveExamSchedule,
    calculateEndTimeFromStart,
    advanceToNextTimeSlot,
    handleSaveLecture,
    resetLectureModalState,
    handleEditLecture,
    handleDeleteLecture,
    handleDeleteLectureForWeek, // 🚫 دالة إلغاء أو حذف المحاضرة لأسبوع محدد فقط
    handleBulkDeleteScheduleLectures,
  };
};
