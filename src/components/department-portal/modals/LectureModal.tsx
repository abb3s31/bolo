'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React, { useState, useRef, useEffect } from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال لعرض القوائم المنسدلة فوق المودال
import {
  GraduationCap, // 🎓 أيقونة المرحلة
  Layers, // 📚 أيقونة الكورس
  Moon, // 🌙 أيقونة المسائي
  Sun, // ☀️ أيقونة الصباحي
  Building2, // 🏛️ أيقونة المبنى
  BookOpen, // 📖 أيقونة المادة
  Clock, // 🕒 أيقونة الوقت
  Calendar, // 📅 أيقونة التاريخ
  Edit3, // ✏️ أيقونة التعديل
  Trash2, // 🗑️ أيقونة الحذف
  Plus, // ➕ أيقونة الإضافة
  Check, // ✔️ أيقونة الصح
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Search, // 🔍 أيقونة البحث
  UserMinus, // 🚫 أيقونة إلغاء التعيين
  UserCheck, // 👤 أيقونة اختيار الأستاذ
  FlaskConical, // 🧪 أيقونة المختبر والعملي
  AlertCircle, // ⚠️ أيقونة التنبيه
  CheckCircle2, // ✅ أيقونة النجاح
  DoorClosed, // 🚪 أيقونة القاعة
  RotateCcw, // 🔄 أيقونة التراجع
  Save, // 💾 أيقونة الحفظ
  X, // ❌ أيقونة الإغلاق
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
} from '@/types'; // 🏷️ استيراد الأنواع
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 مودال الكرود العائم
import ArabicDatePicker from '@/components/schedule/ArabicDatePicker'; // 📅 تقويم التاريخ العربي
import {
  DAYS_OF_WEEK_LIST, // 🗓️ قائمة أيام الأسبوع
  timeStringToMinutes, // ⏱️ تحويل الوقت إلى دقائق
  calculateDateForAnyDayInWeek, // 📅 حساب تاريخ أي يوم في الأسبوع
  getDayOfWeekFromDateString, // 🗓️ استخراج اليوم من التاريخ
  calculateAcademicWeekFromDate, // 🧮 حساب الأسبوع التقويمي
  getCurrentAcademicWeek, // ⚡ اكتشاف الأسبوع الحالي
  formatArabicLectureCount, // 🔤 صياغة عدد المحاضرات
  formatArabicOrdinalLectureName, // 🎖️ صياغة تسلسل المحاضرة
} from '@/lib/schedule-utils'; // 🕒 أدوات الجدول الأكاديمي
import type { ScheduleConflict } from '@/lib/schedule-utils'; // ⚠️ نوع تضارب الجدول
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ اسم المرحلة بالعربية

// 📋 واجهة خصائص نافذة إضافة وتعديل واستعراض المحاضرات الأسبوعية
export interface LectureModalProps {
  isOpen: boolean; // 🪟 حالة فتح المودال
  onClose: () => void; // ❌ دالة إغلاق المودال
  isLectureModalOpen: boolean; // 📂 حالة فتح المودال الأصلية
  setIsLectureModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث حالة الفتح
  editingLectureId: string | null; // 🆔 معرف المحاضرة للتعديل
  setEditingLectureId: React.Dispatch<React.SetStateAction<string | null>>; // 🔄 تحديث المعرف
  selectedScheduleStage: number; // 🎓 المرحلة المحددة
  setSelectedScheduleStage: React.Dispatch<React.SetStateAction<number>>; // 🔄 تحديث المرحلة
  selectedScheduleSemester: 1 | 2; // 🗓️ الكورس المحدد
  setSelectedScheduleSemester: React.Dispatch<React.SetStateAction<1 | 2>>; // 🔄 تحديث الكورس
  deptName: string; // 🏢 اسم القسم
  currentDeptId: string; // 🏢 معرف القسم
  courses: Course[]; // 📚 قائمة المواد الإجمالية
  deptCourses: Course[]; // 📚 مواد القسم
  deptTeachers: UserProfile[]; // 👨‍🏫 أساتذة القسم
  teacherCourses: TeacherCourse[]; // 🔗 تخصيصات المواد للأساتذة
  scheduleLectures: ScheduleLecture[]; // 📋 كافة محاضرات الجدول
  currentScheduleConfig: DepartmentScheduleConfig; // ⚙️ إعدادات الجدول
  selectedScheduleWeek: number; // 🔢 الأسبوع المحدد
  currentLecConflicts: ScheduleConflict[]; // ⚠️ التضاربات الزمنية الحالية
  recentlyAddedLectureId: string | null; // 🌟 معرف المحاضرة المضافة للتو
  handleSaveLecture: (e: React.FormEvent) => void; // 💾 حفظ المحاضرة
  handleDeleteLecture: (id: string) => void; // 🗑️ حذف محاضرة
  handleEditLecture: (lec: ScheduleLecture) => void; // ✏️ تعديل محاضرة
  handleSaveSemesterStartDate: (newStartDate: string) => void; // 📅 حفظ تاريخ انطلاق الفصل
  setSuccessMessage: (msg: string) => void; // 💬 إشعار النجاح العام
  isLectureInCurrentDept: (l: ScheduleLecture) => boolean; // 🏢 التحقق من تبعية المحاضرة للقسم
  lastScheduleScrollYRef: React.MutableRefObject<number>; // 📍 مرجع موضع التمرير المحفوظ

  // 📝 حقول استمارة المحاضرة
  lecDay: DayOfWeek | ''; // 🗓️ يوم المحاضرة
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
  closeModalAfterSave: boolean; // 🚪 إغلاق بعد الحفظ
  setCloseModalAfterSave: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الإغلاق بعد الحفظ
  lecCourseSearchTerm: string; // 🔍 بحث المادة
  setLecCourseSearchTerm: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث المادة
  lecCourseTabFilter: 'all' | 'theory' | 'practical'; // 🏷️ تصفية المادة
  setLecCourseTabFilter: React.Dispatch<React.SetStateAction<'all' | 'theory' | 'practical'>>; // 🔄 تحديث تصفية المادة
  lecTeacherSearchTerm: string; // 🔍 بحث الأستاذ
  setLecTeacherSearchTerm: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث بحث الأستاذ
  lecModalSuccessMsg: string; // 💬 رسالة نجاح الحفظ بالمودال
  setLecModalSuccessMsg: React.Dispatch<React.SetStateAction<string>>; // 🔄 تحديث رسالة النجاح
}

// 🏛️ مكون نافذة إضافة وتعديل المحاضرات الأسبوعية بتصميم بانورامي فائق الجودة
export const LectureModal: React.FC<LectureModalProps> = ({
  isOpen, // 🪟 حالة فتح المودال
  onClose, // ❌ دالة إغلاق المودال
  isLectureModalOpen, // 📂 حالة فتح المودال الأصلية
  setIsLectureModalOpen, // 🔄 تحديث حالة الفتح
  editingLectureId, // 🆔 معرف المحاضرة للتعديل
  setEditingLectureId, // 🔄 تحديث المعرف
  selectedScheduleStage, // 🎓 المرحلة المحددة
  setSelectedScheduleStage, // 🔄 تحديث المرحلة
  selectedScheduleSemester, // 🗓️ الكورس المحدد
  setSelectedScheduleSemester, // 🔄 تحديث الكورس
  deptName, // 🏢 اسم القسم
  currentDeptId, // 🏢 معرف القسم
  courses, // 📚 قائمة المواد الإجمالية
  deptCourses, // 📚 مواد القسم
  deptTeachers, // 👨‍🏫 أساتذة القسم
  teacherCourses, // 🔗 تخصيصات المواد للأساتذة
  scheduleLectures, // 📋 كافة محاضرات الجدول
  currentScheduleConfig, // ⚙️ إعدادات الجدول
  selectedScheduleWeek, // 🔢 الأسبوع المحدد
  currentLecConflicts, // ⚠️ التضاربات الزمنية الحالية
  recentlyAddedLectureId, // 🌟 معرف المحاضرة المضافة للتو
  handleSaveLecture, // 💾 حفظ المحاضرة
  handleDeleteLecture, // 🗑️ حذف محاضرة
  handleEditLecture, // ✏️ تعديل محاضرة
  handleSaveSemesterStartDate, // 📅 حفظ تاريخ انطلاق الفصل
  setSuccessMessage, // 💬 إشعار النجاح العام
  isLectureInCurrentDept, // 🏢 التحقق من تبعية المحاضرة للقسم
  lastScheduleScrollYRef, // 📍 مرجع موضع التمرير المحفوظ

  lecDay, // 🗓️ يوم المحاضرة
  setLecDay, // 🔄 تحديث اليوم
  lecStartTime, // ⏰ وقت البدء
  setLecStartTime, // 🔄 تحديث وقت البدء
  lecEndTime, // ⏰ وقت الانتهاء
  setLecEndTime, // 🔄 تحديث وقت الانتهاء
  lecRoom, // 🏛️ القاعة
  setLecRoom, // 🔄 تحديث القاعة
  lecCourseId, // 📚 معرف المادة
  setLecCourseId, // 🔄 تحديث معرف المادة
  lecTeacherId, // 👨‍🏫 معرف الأستاذ
  setLecTeacherId, // 🔄 تحديث معرف الأستاذ
  lecType, // 🔬 نوع المحاضرة
  setLecType, // 🔄 تحديث نوع المحاضرة
  lecColor, // 🎨 لون المحاضرة
  setLecColor, // 🔄 تحديث لون المحاضرة
  lecNotes, // 📝 ملاحظات المحاضرة
  setLecNotes, // 🔄 تحديث الملاحظات
  lecDate, // 📅 تاريخ المحاضرة
  setLecDate, // 🔄 تحديث التاريخ
  lecWeekNumber, // 🔢 رقم الأسبوع
  setLecWeekNumber, // 🔄 تحديث رقم الأسبوع
  lecStudyType, // ☀️🌙 فترة الدراسة
  setLecStudyType, // 🔄 تحديث فترة الدراسة
  lecAutoCascadeWeeks, // 🔄 تكرار لكافة الأسابيع
  setLecAutoCascadeWeeks, // 🔄 تحديث التكرار
  lecCascadeShiftOption, // 🔀 نمط التعديل
  setLecCascadeShiftOption, // 🔄 تحديث نمط التعديل
  closeModalAfterSave, // 🚪 إغلاق بعد الحفظ
  setCloseModalAfterSave, // 🔄 تحديث الإغلاق بعد الحفظ
  lecCourseSearchTerm, // 🔍 بحث المادة
  setLecCourseSearchTerm, // 🔄 تحديث بحث المادة
  lecCourseTabFilter, // 🏷️ تصفية المادة
  setLecCourseTabFilter, // 🔄 تحديث تصفية المادة
  lecTeacherSearchTerm, // 🔍 بحث الأستاذ
  setLecTeacherSearchTerm, // 🔄 تحديث بحث الأستاذ
  lecModalSuccessMsg, // 💬 رسالة نجاح الحفظ بالمودال
  setLecModalSuccessMsg, // 🔄 تحديث رسالة النجاح
}) => {
  // 🔘 حالات فتح وإغلاق القوائم المنسدلة المخصصة داخل المودال
  const [isLecDayDropdownOpen, setIsLecDayDropdownOpen] = useState<boolean>(false); // 🗓️ قائمة اليوم
  const [isLecTypeDropdownOpen, setIsLecTypeDropdownOpen] = useState<boolean>(false); // 🔬 قائمة النوع
  const [isLecCourseDropdownOpen, setIsLecCourseDropdownOpen] = useState<boolean>(false); // 📚 قائمة المادة
  const [isLecTeacherDropdownOpen, setIsLecTeacherDropdownOpen] = useState<boolean>(false); // 👨‍🏫 قائمة الأستاذ
  const [isLecStartTimeDropdownOpen, setIsLecStartTimeDropdownOpen] = useState<boolean>(false); // ⏰ قائمة وقت البدء
  const [isLecEndTimeDropdownOpen, setIsLecEndTimeDropdownOpen] = useState<boolean>(false); // ⏰ قائمة وقت النهاية
  const [isLecWeekDropdownOpen, setIsLecWeekDropdownOpen] = useState<boolean>(false); // 🔢 قائمة الأسبوع

  // 📍 إحداثيات ومواقع القوائم المنسدلة المخصصة
  const [lecDayCoords, setLecDayCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecTypeCoords, setLecTypeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecCourseCoords, setLecCourseCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecTeacherCoords, setLecTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecStartTimeCoords, setLecStartTimeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecEndTimeCoords, setLecEndTimeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const [lecWeekCoords, setLecWeekCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  // 🔗 مراجع الأزرار لتحديد مواقع القوائم المنسدلة
  const lecDayButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecTypeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecCourseButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecTeacherButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecStartTimeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecEndTimeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecWeekButtonRef = useRef<HTMLButtonElement | null>(null);
  const lecListContainerRef = useRef<HTMLDivElement | null>(null);

  // 📐 دالة الحساب الذكي لموضع القائمة المنسدلة داخل الشاشة
  const calculateSmartDropdownPosition = (
    buttonEl: HTMLElement,
    preferredHeight = 260,
    preferredWidth?: number
  ): { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } => {
    if (typeof window === 'undefined') {
      return { top: 0, bottom: undefined, left: 0, width: 200, maxHeight: preferredHeight, openUpwards: false };
    }
    const rect = buttonEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - 12);
    const spaceAbove = Math.max(0, rect.top - 12);
    let openUpwards = false;
    if (spaceBelow >= preferredHeight) {
      openUpwards = false;
    } else if (spaceAbove >= preferredHeight) {
      openUpwards = true;
    } else {
      openUpwards = spaceAbove > spaceBelow;
    }
    const availableSpace = openUpwards ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(preferredHeight, Math.max(120, availableSpace - 6));
    const top = openUpwards ? undefined : Math.max(12, rect.bottom + 6);
    const bottom = openUpwards ? Math.max(12, (viewportHeight - rect.top) + 6) : undefined;
    let targetWidth = preferredWidth || rect.width;
    if (targetWidth > viewportWidth - 24) targetWidth = viewportWidth - 24;
    let left = rect.left;
    if (left + targetWidth > viewportWidth - 12) left = Math.max(12, viewportWidth - targetWidth - 12);
    if (left < 12) left = 12;
    return { top, bottom, left, width: targetWidth, maxHeight, openUpwards };
  };

  // ⏱️ دالة تحليل التوقيت من صيغة 24 إلى 12 ساعة
  const parseTime24To12 = (time24: string) => {
    if (!time24 || !time24.trim()) {
      return {
        isEmpty: true,
        hour12: 0,
        hourDisplay: '--',
        minute: '--',
        period: 'AM' as const,
        periodArabic: '',
        displayFull: '-- : -- غير محدد',
        time24: '',
      };
    }
    const [hRaw, mRaw] = time24.split(':');
    let h = parseInt(hRaw || '8', 10);
    const m = mRaw || '00';
    if (h === 0) h = 12;
    const period: 'AM' | 'PM' = (h >= 12 || (h >= 1 && h <= 7)) ? 'PM' : 'AM';
    let h12 = h;
    if (h > 12) h12 = h - 12;
    const hDisplay = String(h12).padStart(2, '0');
    const periodArabic = period === 'AM' ? 'صباحاً' : 'مساءً';
    return {
      isEmpty: false,
      hour12: h12,
      hourDisplay: hDisplay,
      minute: m,
      period,
      periodArabic,
      displayFull: `${hDisplay}:${m} ${periodArabic}`,
      time24: `${String(h).padStart(2, '0')}:${m}`,
    };
  };

  // 🔄 دمج التوقيت إلى صيغة 24 ساعة المعتمدة (HH:mm)
  const format12To24 = (hour12: number, minute: string, period: 'AM' | 'PM'): string => {
    let h24 = hour12;
    if (hour12 === 12) {
      h24 = 12;
    } else if (period === 'PM' && hour12 < 12) {
      h24 = hour12 + 12;
    } else if (period === 'AM' && hour12 < 12) {
      h24 = hour12;
    }
    return `${String(h24).padStart(2, '0')}:${minute}`;
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

  // 🔽 دوال فتح وإغلاق القوائم المنسدلة
  const handleToggleLecDayDropdown = () => {
    if (!isLecDayDropdownOpen && lecDayButtonRef.current) {
      setLecDayCoords(calculateSmartDropdownPosition(lecDayButtonRef.current, 240));
      setIsLecDayDropdownOpen(true);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecDayDropdownOpen(false);
    }
  };

  const handleToggleLecTypeDropdown = () => {
    if (!isLecTypeDropdownOpen && lecTypeButtonRef.current) {
      setLecTypeCoords(calculateSmartDropdownPosition(lecTypeButtonRef.current, 180));
      setIsLecTypeDropdownOpen(true);
      setIsLecDayDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecTypeDropdownOpen(false);
    }
  };

  const handleToggleLecCourseDropdown = () => {
    if (!isLecCourseDropdownOpen && lecCourseButtonRef.current) {
      setLecCourseCoords(calculateSmartDropdownPosition(lecCourseButtonRef.current, 420));
      setLecCourseSearchTerm('');
      setLecCourseTabFilter('all');
      setIsLecCourseDropdownOpen(true);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecCourseDropdownOpen(false);
    }
  };

  const handleToggleLecTeacherDropdown = () => {
    if (!isLecTeacherDropdownOpen && lecTeacherButtonRef.current) {
      setLecTeacherCoords(calculateSmartDropdownPosition(lecTeacherButtonRef.current, 360));
      setLecTeacherSearchTerm('');
      setIsLecTeacherDropdownOpen(true);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecTeacherDropdownOpen(false);
    }
  };

  const handleToggleLecStartTimeDropdown = () => {
    if (!isLecStartTimeDropdownOpen && lecStartTimeButtonRef.current) {
      setLecStartTimeCoords(calculateSmartDropdownPosition(lecStartTimeButtonRef.current, 340, 360));
      setIsLecStartTimeDropdownOpen(true);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecStartTimeDropdownOpen(false);
    }
  };

  const handleToggleLecEndTimeDropdown = () => {
    if (!isLecEndTimeDropdownOpen && lecEndTimeButtonRef.current) {
      setLecEndTimeCoords(calculateSmartDropdownPosition(lecEndTimeButtonRef.current, 340, 360));
      setIsLecEndTimeDropdownOpen(true);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecWeekDropdownOpen(false);
    } else {
      setIsLecEndTimeDropdownOpen(false);
    }
  };

  const handleToggleLecWeekDropdown = () => {
    if (!isLecWeekDropdownOpen && lecWeekButtonRef.current) {
      setLecWeekCoords(calculateSmartDropdownPosition(lecWeekButtonRef.current, 300, 380));
      setIsLecWeekDropdownOpen(true);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
    } else {
      setIsLecWeekDropdownOpen(false);
    }
  };

  // 🔄 إغلاق القوائم عند تغيير حجم الشاشة
  useEffect(() => {
    const handleCloseLecDropdowns = () => {
      if (isLecDayDropdownOpen) setIsLecDayDropdownOpen(false);
      if (isLecTypeDropdownOpen) setIsLecTypeDropdownOpen(false);
      if (isLecCourseDropdownOpen) setIsLecCourseDropdownOpen(false);
      if (isLecTeacherDropdownOpen) setIsLecTeacherDropdownOpen(false);
      if (isLecStartTimeDropdownOpen) setIsLecStartTimeDropdownOpen(false);
      if (isLecEndTimeDropdownOpen) setIsLecEndTimeDropdownOpen(false);
      if (isLecWeekDropdownOpen) setIsLecWeekDropdownOpen(false);
    };
    if (isLecDayDropdownOpen || isLecTypeDropdownOpen || isLecCourseDropdownOpen || isLecTeacherDropdownOpen || isLecStartTimeDropdownOpen || isLecEndTimeDropdownOpen || isLecWeekDropdownOpen) {
      window.addEventListener('resize', handleCloseLecDropdowns);
    }
    return () => {
      window.removeEventListener('resize', handleCloseLecDropdowns);
    };
  }, [isLecDayDropdownOpen, isLecTypeDropdownOpen, isLecCourseDropdownOpen, isLecTeacherDropdownOpen, isLecStartTimeDropdownOpen, isLecEndTimeDropdownOpen, isLecWeekDropdownOpen]);

  // 🕒 منتقي التوقيت المخصص
  const renderCustomTimePickerDropdown = (
    coords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null,
    title: string,
    currentTime24: string,
    onTimeChange: (newTime: string) => void,
    onClose: () => void,
    _currentStudyType?: 'morning' | 'evening'
  ) => {
    if (!coords) return null;
    const parsed = parseTime24To12(currentTime24);
    const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
    const minutesList = ['00', '15', '30', '45', '10', '20', '40', '50'];
    const currentHour12 = parsed.isEmpty ? 8 : parsed.hour12;
    const currentMin = parsed.isEmpty ? '30' : parsed.minute;
    const currentPeriod: 'AM' | 'PM' = parsed.isEmpty ? (_currentStudyType === 'evening' ? 'PM' : 'AM') : parsed.period;

    const handleHourSelect = (h12: number) => {
      let autoPeriod: 'AM' | 'PM' = currentPeriod;
      if (_currentStudyType === 'evening') {
        autoPeriod = 'PM';
      } else {
        if (h12 === 12 || (h12 >= 1 && h12 <= 7)) {
          autoPeriod = 'PM';
        } else if (h12 >= 8 && h12 <= 11) {
          autoPeriod = 'AM';
        }
      }
      const newTime24 = format12To24(h12, currentMin, autoPeriod);
      onTimeChange(newTime24);
    };

    const handleMinuteSelect = (min: string) => {
      const newTime24 = format12To24(currentHour12, min, currentPeriod);
      onTimeChange(newTime24);
    };

    const handlePeriodSelect = (p: 'AM' | 'PM') => {
      const newTime24 = format12To24(currentHour12, currentMin, p);
      onTimeChange(newTime24);
    };

    return (
      <div
        style={{
          position: 'fixed',
          ...(coords.openUpwards
            ? { bottom: `${coords.bottom}px` }
            : { top: `${coords.top}px` }),
          left: `${coords.left}px`,
          width: `${coords.width}px`,
          maxHeight: `${coords.maxHeight || 340}px`,
        }}
        className="bg-white border-2 border-[#0F2942] rounded-3xl shadow-2xl z-[999999] p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 select-none text-right overflow-y-auto"
        dir="rtl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-xs">
              <Clock className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-xs font-black text-black">{title}</div>
              <div className="text-base font-black text-black flex items-center gap-1.5">
                <span>{parsed.displayFull}</span>
                {parsed.time24 && <span className="text-xs font-mono font-black text-black">({parsed.time24})</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-black hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-100">
          <div className="col-span-6 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الساعة:</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {hoursList.map((h) => {
                const isSelected = !parsed.isEmpty && parsed.hour12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`py-1.5 text-xs font-mono font-black rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الدقيقة:</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {minutesList.map((m) => {
                const isSelected = !parsed.isEmpty && parsed.minute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1.5 text-xs font-mono font-black rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الفترة:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handlePeriodSelect('AM')}
                className={`py-2 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !parsed.isEmpty && parsed.period === 'AM'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>صباحاً</span>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodSelect('PM')}
                className={`py-2 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !parsed.isEmpty && parsed.period === 'PM'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>مساءً</span>
              </button>
            </div>
          </div>
        </div>

        {currentTime24 && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onTimeChange('');
                onClose();
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer text-center"
              title="إلغاء تحديد هذا الوقت وجعله غير محدد"
            >
              <span className="flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء تحديد الوقت (جعله غير محدد)</span>
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
          <FloatingCrudModal
            isOpen={isLectureModalOpen}
            onClose={() => {
              const savedY: number = lastScheduleScrollYRef.current; // 📍 أخذ نسخة من موضع السكرول المحفوظ بالمليمتر
              setIsLectureModalOpen(false); // 🔴 إغلاق المودال
              setEditingLectureId(null); // 🔄 تصفير التعديل
              setLecRoom(''); // 🧹 تنظيف القاعة
              setLecNotes(''); // 🧹 تنظيف الملاحظات
              setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح التفاعلية
              // 🚀 إعادة سكرول الصفحة فوراً لنفس الموضع دون قفز
              if (typeof window !== 'undefined' && savedY > 0) {
                setTimeout(() => {
                  window.scrollTo({ top: savedY, behavior: 'instant' });
                }, 20);
              }
            }}
            title={editingLectureId ? 'تعديل بيانات المحاضرة المجدولة' : 'إضافة محاضرة دراسية جديدة إلى الجدول الأسبوعي'}
            subtitle={
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-700">
                  {editingLectureId ? 'تعديل تفاصيل المحاضرة للمرحلة المحددة:' : 'حدد اليوم والمادة والقاعة والتوقيت والأستاذ:'}
                </span>
                {/* 🌟 باجات كبيرة وواضحة جداً للمرحلة والكورس ونوع الدراسة بهيدر الكارد بلون موحد */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-xl bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                    <span>المرحلة {getStageNameInArabic(selectedScheduleStage)}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-xl bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0F2942]" />
                    <span>الكورس {selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-xl bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs flex items-center gap-1.5">
                    {lecStudyType === 'morning' ? <Sun className="w-4 h-4 text-[#0F2942]" /> : <Moon className="w-4 h-4 text-[#0F2942]" />}
                    <span>{lecStudyType === 'morning' ? 'الصباحي' : 'المسائي'}</span>
                  </span>
                </div>
              </div>
            }
            icon={editingLectureId ? <Edit3 className="w-6 h-6 text-cyan-300" /> : <Clock className="w-6 h-6 text-cyan-300" />}
            maxWidth="max-w-6xl"
            onSubmit={handleSaveLecture}
            footer={
              <div className="flex items-center justify-between gap-3 w-full flex-wrap">
                <div className="text-sm sm:text-base font-black text-slate-800">
                  {editingLectureId ? (
                    <span className="text-blue-800 flex items-center gap-1.5 font-black">
                      <Edit3 className="w-5 h-5 inline text-blue-600" />
                      <span>أنت الآن في وضع تعديل بيانات المحاضرة المجدولة</span>
                    </span>
                  ) : (!lecDay || !lecType || !lecCourseId || !lecRoom.trim() || !lecStartTime || !lecEndTime) ? (
                    <span className="text-[#0F2942] flex items-center gap-2 font-black bg-blue-50/90 px-3.5 py-2 rounded-xl border-2 border-blue-200 shadow-2xs">
                      <AlertCircle className="w-5 h-5 inline text-[#0F2942] shrink-0" />
                      <span>يرجى استكمال تحديد اليوم، طبيعة المحاضرة، المادة، القاعة، وتوقيت البدء والانتهاء</span>
                    </span>
                  ) : currentLecConflicts.length > 0 ? (
                    <span className="text-rose-600 flex items-center gap-1.5 font-black">
                      <AlertCircle className="w-5 h-5 inline text-rose-600" />
                      <span>يوجد {currentLecConflicts.length} تعارض زمني أو قاعة مشغولة</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1.5 font-black">
                      <CheckCircle2 className="w-5 h-5 inline text-emerald-600" />
                      <span>جميع الحقول مستوفية وجاهزة للحفظ بالجدول الأسبوعي</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  {/* 1️⃣ الزر الرئيسي الأهم والأبرز: حفظ وتحديث / إدراج ومتابعة بنفس حجم وشاكلة تحديث وإغلاق */}
                  <button
                    type="submit"
                    onClick={() => setCloseModalAfterSave(false)}
                    className="px-4 sm:px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 ring-2 ring-blue-500/20"
                    title={editingLectureId ? 'حفظ التعديلات والبقاء في النافذة' : 'إدراج المحاضرة في الجدول والاستمرار بإدخال المحاضرات التالية'}
                  >
                    {editingLectureId ? <Check className="w-4 h-4 text-cyan-300" /> : <Plus className="w-4 h-4 text-cyan-300" />}
                    <span>{editingLectureId ? 'حفظ وتحديث' : 'إدراج ومتابعة'}</span>
                  </button>

                  {/* 2️⃣ زر الحفظ الثاني: تحديث وإغلاق / إدراج وإغلاق بالكحلي الداكن */}
                  <button
                    type="submit"
                    onClick={() => setCloseModalAfterSave(true)}
                    className="px-4 sm:px-5 py-2.5 bg-[#0B1E32] hover:bg-[#0F2942] text-white rounded-xl font-black text-sm sm:text-base shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border border-[#163a5f] active:scale-95"
                    title={editingLectureId ? 'تحديث المحاضرة وإغلاق النافذة فورياً' : 'إدراج المحاضرة وإغلاق النافذة فورياً'}
                  >
                    <Save className="w-4 h-4 text-emerald-300" />
                    <span>{editingLectureId ? 'تحديث وإغلاق' : 'إدراج وإغلاق'}</span>
                  </button>

                  {/* ⏸️ فاصل رأسي أنيق يفصل منطقة الحفظ والاعتماد عن منطقة الإلغاء والخروج لمنع أي تشتت */}
                  <div className="h-7 w-[1.5px] bg-slate-300 shrink-0 mx-0.5 hidden sm:block" />

                  {/* 3️⃣ زر إلغاء التعديل والعودة لوضع الإدراج بنمط كحلي ملكي راقٍ وبنفس الحجم الدقيق */}
                  {editingLectureId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLectureId(null); // 🔄 تصفير آيدي التعديل
                        setLecCourseId(''); // 🧹 مسح المادة
                        setLecTeacherId(''); // 🧹 مسح الأستاذ
                        setLecRoom(''); // 🧹 مسح القاعة
                        setLecNotes(''); // 🧹 مسح الملاحظات
                        setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                      }}
                      className="px-4 sm:px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#0F2942] rounded-xl font-black text-sm sm:text-base transition cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95"
                      title="إلغاء وضع التعديل والعودة لوضع الإدخال الجديد"
                    >
                      <RotateCcw className="w-4 h-4 text-cyan-300 shrink-0" />
                      <span>إلغاء التعديل</span>
                    </button>
                  )}

                  {/* 4️⃣ زر إغلاق النافذة النهائي بنمط أنيق ومحايد وبنفس الحجم الدقيق */}
                  <button
                    type="button"
                    onClick={() => {
                      const savedY: number = lastScheduleScrollYRef.current; // 📍 أخذ نسخة من موضع السكرول المحفوظ بالمليمتر
                      setIsLectureModalOpen(false); // 🔴 إغلاق
                      setEditingLectureId(null); // 🔄 تصفير
                      setLecRoom(''); // 🧹 مسح
                      setLecNotes(''); // 🧹 مسح
                      setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                      // 🚀 إعادة سكرول الصفحة فوراً لنفس الموضع دون قفز
                      if (typeof window !== 'undefined' && savedY > 0) {
                        setTimeout(() => {
                          window.scrollTo({ top: savedY, behavior: 'instant' });
                        }, 20);
                      }
                    }}
                    className="px-4 sm:px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-black text-sm sm:text-base transition cursor-pointer border-2 border-slate-300 shadow-2xs active:scale-95 flex items-center justify-center gap-2"
                    title="إغلاق هذه النافذة بالكامل"
                  >
                    <X className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>إغلاق النافذة</span>
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-4">

              
              {/* 🎛️ 1. الشريط العلوي الثابت والمدمج: المرحلة + الكورس + الفترة الدراسية بسطر واحد */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-2xl flex flex-wrap xl:flex-nowrap items-center justify-between gap-3">
                {/* المرحلة */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <GraduationCap className="w-4 h-4 text-[#0F2942]" />
                    <span>المرحلة:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {[
                      { num: 1, name: 'المرحلة الأولى' },
                      { num: 2, name: 'المرحلة الثانية' },
                      { num: 3, name: 'المرحلة الثالثة' },
                      { num: 4, name: 'المرحلة الرابعة' },
                    ].map((stg) => (
                      <button
                        key={stg.num}
                        type="button"
                        onClick={() => {
                          if (selectedScheduleStage !== stg.num) {
                            setSelectedScheduleStage(stg.num);
                            setLecCourseId(''); // 🧹 تصفير المادة
                            setLecType(''); // 🧹 تصفير طبيعة المحاضرة
                            setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                            setLecRoom(''); // 🧹 تصفير القاعة
                            setLecStartTime(''); // 🧹 تصفير وقت البدء
                            setLecEndTime(''); // 🧹 تصفير وقت الانتهاء
                            setLecNotes(''); // 🧹 تصفير الملاحظات
                            setEditingLectureId(null); // 🔄 إلغاء وضع التعديل
                            setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                            setIsLecCourseDropdownOpen(false); // 🚪 إغلاق القوائم المنسدلة
                            setIsLecTypeDropdownOpen(false);
                            setIsLecTeacherDropdownOpen(false);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                          selectedScheduleStage === stg.num
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {stg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* الكورس */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <Layers className="w-4 h-4 text-[#0F2942]" />
                    <span>الكورس:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedScheduleSemester !== 1) {
                          setSelectedScheduleSemester(1);
                          setLecCourseId(''); // 🧹 تصفير المادة
                          setLecType(''); // 🧹 تصفير طبيعة المحاضرة
                          setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                          setLecRoom(''); // 🧹 تصفير القاعة
                          setLecStartTime(''); // 🧹 تصفير وقت البدء
                          setLecEndTime(''); // 🧹 تصفير وقت الانتهاء
                          setLecNotes(''); // 🧹 تصفير الملاحظات
                          setEditingLectureId(null); // 🔄 إلغاء وضع التعديل
                          setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                          setIsLecCourseDropdownOpen(false); // 🚪 إغلاق القوائم المنسدلة
                          setIsLecTypeDropdownOpen(false);
                          setIsLecTeacherDropdownOpen(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                        selectedScheduleSemester === 1
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      الكورس الأول
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedScheduleSemester !== 2) {
                          setSelectedScheduleSemester(2);
                          setLecCourseId(''); // 🧹 تصفير المادة
                          setLecType(''); // 🧹 تصفير طبيعة المحاضرة
                          setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                          setLecRoom(''); // 🧹 تصفير القاعة
                          setLecStartTime(''); // 🧹 تصفير وقت البدء
                          setLecEndTime(''); // 🧹 تصفير وقت الانتهاء
                          setLecNotes(''); // 🧹 تصفير الملاحظات
                          setEditingLectureId(null); // 🔄 إلغاء وضع التعديل
                          setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                          setIsLecCourseDropdownOpen(false); // 🚪 إغلاق القوائم المنسدلة
                          setIsLecTypeDropdownOpen(false);
                          setIsLecTeacherDropdownOpen(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
                        selectedScheduleSemester === 2
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      الكورس الثاني
                    </button>
                  </div>
                </div>

                {/* الفترة: الصباحي / المسائي */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-slate-950 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-4 h-4 text-[#0F2942]" />
                    <span>الفترة:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {/* ☀️ زر الفترة الصباحية بنمط الكحلي الملكي الفاخر #0F2942 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (lecStudyType !== 'morning') {
                          setLecStudyType('morning');
                          setLecCourseId(''); // 🧹 تصفير المادة
                          setLecType(''); // 🧹 تصفير طبيعة المحاضرة
                          setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                          setLecRoom(''); // 🧹 تصفير القاعة
                          setLecStartTime(''); // 🧹 تصفير وقت البدء
                          setLecEndTime(''); // 🧹 تصفير وقت الانتهاء
                          setLecNotes(''); // 🧹 تصفير الملاحظات
                          setEditingLectureId(null); // 🔄 إلغاء وضع التعديل
                          setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                          setIsLecCourseDropdownOpen(false); // 🚪 إغلاق القوائم المنسدلة
                          setIsLecTypeDropdownOpen(false);
                          setIsLecTeacherDropdownOpen(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        lecStudyType === 'morning'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Sun className="w-4 h-4 shrink-0" />
                      <span>الصباحي</span>
                    </button>
                    {/* 🌙 زر الفترة المسائية بتصميم مطابق لزر الكورس الأول والثاني #0F2942 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (lecStudyType !== 'evening') {
                          setLecStudyType('evening');
                          setLecCourseId(''); // 🧹 تصفير المادة
                          setLecType(''); // 🧹 تصفير طبيعة المحاضرة
                          setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                          setLecRoom(''); // 🧹 تصفير القاعة
                          setLecStartTime(''); // 🧹 تصفير وقت البدء
                          setLecEndTime(''); // 🧹 تصفير وقت الانتهاء
                          setLecNotes(''); // 🧹 تصفير الملاحظات
                          setEditingLectureId(null); // 🔄 إلغاء وضع التعديل
                          setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                          setIsLecCourseDropdownOpen(false); // 🚪 إغلاق القوائم المنسدلة
                          setIsLecTypeDropdownOpen(false);
                          setIsLecTeacherDropdownOpen(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        lecStudyType === 'evening'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Moon className="w-4 h-4 shrink-0" />
                      <span>المسائي</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🏛️ 2. الهيكل البانورامي المزدوج: حقول الإدخال الثابتة (يمين) + الرصد ومحاضرات اليوم (يسار) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                
                {/* 📝 العمود الأيمن (حقول الإدخال الثابتة 100%) - 7 أعمدة */}
                <div className="lg:col-span-7 space-y-3.5 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs lg:sticky lg:top-2">
                  
                  {/* 📅 0. حقول التاريخ التقويمي ورقم الأسبوع الدراسي وميزة التعاقب الذكي لمسار بولونيا (15 أسبوع) */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border-2 border-blue-200 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#0F2942]" />
                        <span className="font-black text-sm sm:text-base text-slate-950">التاريخ والجدولة التقويمية (مسار بولونيا 15 أسبوعاً)</span>
                      </div>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
                        الأسبوع {lecWeekNumber} من 15
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* تاريخ المحاضرة */}
                      <div className="space-y-1.5">
                        <label className="h-7 text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between gap-1.5">
                          <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-[#0F2942]" />
                            <span>تاريخ المحاضرة التقويمي</span>
                          </span>
                          {/* 🗓️ باج اليوم الأسبوعي (مثل الأحد) موحد باللون الأزرق الأكاديمي الاحترافي */}
                          {lecDate && (
                            <span className="text-xs font-black text-blue-950 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs shrink-0 whitespace-nowrap">
                              {getDayOfWeekFromDateString(lecDate) ? DAYS_OF_WEEK_LIST.find((d) => d.key === getDayOfWeekFromDateString(lecDate))?.label_ar : ''}
                            </span>
                          )}
                        </label>
                        <ArabicDatePicker
                          value={lecDate}
                          onChange={(newDate) => {
                            setLecDate(newDate); // 📅 حفظ التاريخ المختار في الحالة
                            if (newDate) {
                              const dayFound = getDayOfWeekFromDateString(newDate); // 🗓️ استنتاج اليوم الأكاديمي
                              if (dayFound) setLecDay(dayFound); // 🔄 مزامنة اليوم الأسبوعي
                              
                              // 🧠 إذا لم يُحفظ تاريخ بدء الفصل مسبقاً، نحفظه في Supabase فورياً
                              if (!currentScheduleConfig.start_date) {
                                handleSaveSemesterStartDate(newDate); // 💾 حفظ تاريخ انطلاق الفصل سحابياً ومحلياً
                              } else {
                                // 🧮 احتساب رقم الأسبوع المقابل لهذا التاريخ تلقائياً بنظام الـ 15 أسبوعاً (+7 أيام لكل أسبوع)
                                const baseStart = currentScheduleConfig.start_date || '2026-09-20'; // 📅 تاريخ الأساس
                                const calcWeek = calculateAcademicWeekFromDate(baseStart, newDate); // 🔢 رقم الأسبوع المحسوب
                                setLecWeekNumber(calcWeek); // 🔄 تحديث رقم الأسبوع في القائمة تلقائياً
                              }
                            }
                          }}
                          onDayDeduce={(dayFound) => {
                            setLecDay(dayFound); // 🗓️ مزامنة اليوم الأسبوعي فورياً
                          }}
                          placeholder="-- / -- / ---- تحديد تاريخ المحاضرة"
                        />
                      </div>

                      {/* رقم الأسبوع الدراسي الذكي المتصل بالتقويم */}
                      <div className="space-y-1.5 relative">
                        {/* 📏 عنوان وبادج الأسبوع بسطر واحد أفقي منسق بنفس ارتفاع التسمية المجاورة h-7 تماماً */}
                        <label className="h-7 text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between gap-1.5">
                          <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                            <Layers className="w-3.5 h-3.5 text-[#0F2942]" />
                            <span>رقم الأسبوع الدراسي</span>
                          </span>
                          {/* ⚡ بادج الأسبوع الحالي موحد باللون الأزرق الأكاديمي الاحترافي */}
                          {(() => {
                            const effectiveBase = currentScheduleConfig.start_date || (lecWeekNumber === 1 ? lecDate : '') || '2026-09-20';
                            const activeWk = getCurrentAcademicWeek(effectiveBase);
                            return (
                              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs shrink-0 whitespace-nowrap">
                                الأسبوع الحالي: {activeWk}
                              </span>
                            );
                          })()}
                        </label>
                        <div>
                          <button
                            ref={lecWeekButtonRef}
                            type="button"
                            onClick={handleToggleLecWeekDropdown}
                            className={`w-full h-[48px] min-h-[48px] px-3.5 py-2 bg-white border-2 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                              isLecWeekDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {/* 🏷️ الجانب الأيمن: أيقونة الطبقات + عمود منسق (الأسبوع 1 + المرجعي، وأسفله التاريخ التقويمي) */}
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 bg-blue-50 text-[#0F2942] rounded-lg shrink-0 border border-blue-200">
                                <Layers className="w-4 h-4 text-[#0F2942]" />
                              </div>
                              <div className="flex flex-col text-right justify-center leading-none gap-1 min-w-0">
                                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                  <span className="text-xs sm:text-sm font-black text-slate-950">
                                    الأسبوع {lecWeekNumber}
                                  </span>
                                  {lecWeekNumber === 1 && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 text-[#0F2942] border border-blue-200 shadow-2xs">
                                      المرجعي
                                    </span>
                                  )}
                                </div>
                                {lecDate && (
                                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 whitespace-nowrap">
                                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{lecDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 🔽 الجانب الأيسر: سهم القائمة المنسدلة التفاعلي */}
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 mr-1 ${isLecWeekDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                          </button>

                          {isLecWeekDropdownOpen && lecWeekCoords && typeof document !== 'undefined' && createPortal(
                            <>
                              <div 
                                className="fixed inset-0 z-[999999] bg-transparent" 
                                onClick={() => setIsLecWeekDropdownOpen(false)} 
                              />
                              <div 
                                style={{
                                  position: 'fixed',
                                  ...(lecWeekCoords.openUpwards
                                    ? { bottom: `${lecWeekCoords.bottom}px` }
                                    : { top: `${lecWeekCoords.top}px` }),
                                  left: `${lecWeekCoords.left}px`,
                                  width: `${lecWeekCoords.width}px`,
                                  maxHeight: `${lecWeekCoords.maxHeight || 300}px`,
                                }}
                                className="z-[999999] bg-white border-2 border-[#0F2942] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-right select-none"
                                dir="rtl"
                              >
                                <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-800 flex items-center justify-between">
                                  <span>اختر الأسبوع الدراسي مع تواريخه التلقائية</span>
                                  <span className="font-mono text-[11px] bg-blue-100 text-blue-950 px-2 py-0.5 rounded-md border border-blue-200">
                                    15 أسبوعاً معتمداً
                                  </span>
                                </div>
                                <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                                  {Array.from({ length: 15 }, (_, i) => i + 1).map((wk) => {
                                    const isSelected = lecWeekNumber === wk;
                                    const targetDay = (lecDay || 'sunday') as DayOfWeek; // 🗓️ اليوم الأكاديمي
                                    const effectiveBase = currentScheduleConfig.start_date || (lecWeekNumber === 1 ? lecDate : '') || '2026-09-20'; // 📅 تاريخ الأساس المعتمد
                                    const computedWkDate = calculateDateForAnyDayInWeek(effectiveBase, 1, wk, targetDay); // 🧮 التاريخ المحسوب للأسبوع
                                    const activeAcademicWeek = getCurrentAcademicWeek(effectiveBase); // ⚡ الأسبوع الحالي الفعلي
                                    const isCurrentWk = activeAcademicWeek === wk; // 🌟 هل هذا الأسبوع هو الأسبوع الفعلي الآن

                                    return (
                                      <button
                                        key={wk}
                                        type="button"
                                        onClick={() => {
                                          setLecWeekNumber(wk); // 🔢 ضبط رقم الأسبوع المختار
                                          setIsLecWeekDropdownOpen(false); // 🚪 غلق القائمة
                                          if (computedWkDate) {
                                            setLecDate(computedWkDate); // 📅 تحديث حقل التاريخ تلقائياً ليطابق هذا الأسبوع
                                            const deducedDay = getDayOfWeekFromDateString(computedWkDate); // 🗓️ استنتاج اليوم
                                            if (deducedDay) setLecDay(deducedDay); // 🔄 مزامنة اليوم
                                          }
                                        }}
                                        className={`w-full p-2.5 text-right text-xs sm:text-sm font-black rounded-xl transition cursor-pointer flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-[#0F2942] text-white shadow-xs'
                                            : 'hover:bg-blue-50 text-slate-950'
                                        }`}
                                      >
                                        {/* 📏 عناصر الأسبوع مرتبة: اسم الأسبوع + بادج المرجعي/الحالي ثم التاريخ في كبسولة أنيقة */}
                                        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap min-w-0">
                                          <span className="font-mono text-sm font-black shrink-0">الأسبوع {wk}</span>
                                          {wk === 1 && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                              isSelected
                                                ? 'bg-white/20 text-white border-white/30'
                                                : 'bg-blue-100 text-[#0F2942] border-blue-300'
                                            }`}>
                                              المرجعي
                                            </span>
                                          )}
                                          {isCurrentWk && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                              isSelected
                                                ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black'
                                                : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                            }`}>
                                              الأسبوع الحالي
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {computedWkDate && (
                                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                              isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-slate-100 text-slate-900 border-slate-300'
                                            }`}>
                                              {computedWkDate}
                                            </span>
                                          )}
                                          {isSelected && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </div>
                    </div>

                    {/* خيارات التعاقب التلقائي والترحيل الذكي بين الأيام والأسابيع */}
                    {lecWeekNumber === 1 ? (
                      <div className="p-2.5 bg-white/90 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          {/* 🔄 خانة الاختيار مع إطلاق التنبيه العالمي الفاخر فورياً عند التفعيل أو التعطيل */}
                          <input
                            type="checkbox"
                            checked={lecAutoCascadeWeeks}
                            onChange={(e) => {
                              const isChecked = e.target.checked; // 🔍 قراءة حالة التفعيل
                              setLecAutoCascadeWeeks(isChecked); // 💾 تخزين القيمة في الذاكرة
                              // 🔔 إشعار التنبيه العالمي الفوري للنظام
                              if (isChecked) {
                                setSuccessMessage('تم تفعيل توليد واحتساب تواريخ كافة الأسابيع الـ 15 تلقائياً (+7 أيام لكل أسبوع) 📅✨'); // 🟢 رسالة التفعيل
                              } else {
                                setSuccessMessage('تم تعطيل التوليد التلقائي لتواريخ الأسابيع اللاحقة 🛑'); // 🔴 رسالة التعطيل
                              }
                              setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ إخفاء التنبيه بعد 4 ثوانٍ
                            }}
                            className="w-4 h-4 rounded text-[#0F2942] focus:ring-[#0F2942] border-slate-300 cursor-pointer accent-[#0F2942]"
                          />
                          <span className="font-black text-slate-900">
                            توليد واحتساب تواريخ كافة الأسابيع الـ 15 تلقائياً (+7 أيام لكل أسبوع)
                          </span>
                        </label>
                        <span className="text-xs font-black text-blue-950 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs shrink-0">
                          نظام ذكي
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white/90 border border-indigo-200 rounded-xl space-y-2 text-xs sm:text-sm">
                        <div className="font-black text-slate-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#0F2942]" />
                            <span>نظام الترحيل الذكي بين الأيام والأسابيع:</span>
                          </span>
                          <span className="text-[11px] font-black text-blue-950 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                            من الأسبوع {lecWeekNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setLecCascadeShiftOption('this_week_only')}
                            className={`p-2 rounded-lg text-xs font-black transition cursor-pointer border text-center ${
                              lecCascadeShiftOption === 'this_week_only'
                                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            هذا الأسبوع فقط (استثناء)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLecCascadeShiftOption('cascade_following')}
                            className={`p-2 rounded-lg text-xs font-black transition cursor-pointer border text-center flex items-center justify-center gap-1 ${
                              lecCascadeShiftOption === 'cascade_following'
                                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>ترحيل للأسابيع اللاحقة ({lecWeekNumber} - 15)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLecCascadeShiftOption('all_15_weeks')}
                            className={`p-2 rounded-lg text-xs font-black transition cursor-pointer border text-center ${
                              lecCascadeShiftOption === 'all_15_weeks'
                                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            تحديث كافة الأسابيع الـ 15
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1. اليوم الأسبوعي للمحاضرة */}
                  <div className="space-y-1.5 relative">
                      <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#0F2942]" />
                        <span>اليوم الأسبوعي <span className="text-red-600">*</span></span>
                      </label>
                      <div>
                        <button
                          ref={lecDayButtonRef}
                          type="button"
                          onClick={handleToggleLecDayDropdown}
                          className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {lecDay ? (
                              <>
                                {currentScheduleConfig.off_days.includes(lecDay as DayOfWeek) ? (
                                  <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                                ) : (
                                  <Building2 className="w-4 h-4 text-[#0F2942] shrink-0" />
                                )}
                                <span className="font-black text-slate-950">{DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay}</span>
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border shadow-2xs ${
                                  currentScheduleConfig.off_days.includes(lecDay as DayOfWeek)
                                    ? 'bg-rose-50 text-rose-950 border-rose-200'
                                    : 'bg-blue-50 text-blue-950 border-blue-200'
                                }`}>
                                  {currentScheduleConfig.off_days.includes(lecDay as DayOfWeek) ? 'عطلة' : 'دوام'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-500 font-bold text-xs sm:text-sm">-- اختر اليوم الأسبوعي --</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecDayDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                        </button>

                        {isLecDayDropdownOpen && lecDayCoords && typeof document !== 'undefined' && createPortal(
                          <>
                            <div 
                              className="fixed inset-0 z-[999999] bg-transparent" 
                              onClick={() => setIsLecDayDropdownOpen(false)} 
                            />
                            <div 
                              style={{
                                position: 'fixed',
                                ...(lecDayCoords.openUpwards
                                  ? { bottom: `${lecDayCoords.bottom}px` }
                                  : { top: `${lecDayCoords.top}px` }),
                                left: `${lecDayCoords.left}px`,
                                width: `${lecDayCoords.width}px`,
                                maxHeight: `${lecDayCoords.maxHeight || 240}px`,
                              }}
                              className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                              dir="rtl"
                            >
                              {/* 🔄 خيار غير محدد لليوم */}
                              <button
                                type="button"
                                onClick={() => {
                                  setLecDay(''); // 🗓️ إلغاء تحديد اليوم
                                  setIsLecDayDropdownOpen(false); // 🚪 إغلاق القائمة
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  !lecDay
                                    ? 'bg-[#0F2942] text-white shadow-xs'
                                    : 'text-slate-950 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span>-- بدون تحديد يوم (غير محدد) --</span>
                                </div>
                                {!lecDay && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                              </button>

                              {DAYS_OF_WEEK_LIST.map((d) => {
                                const isOff = currentScheduleConfig.off_days.includes(d.key);
                                const isSel = lecDay === d.key;
                                return (
                                  <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => {
                                      setLecDay(d.key);
                                      setIsLecDayDropdownOpen(false);
                                      // 🧠 المزامنة التقويمية الذكية: احتساب تاريخ هذا اليوم تلقائياً للأسبوع المحدد
                                      const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
                                      const targetWk = lecWeekNumber || 1;
                                      const computedDayDate = calculateDateForAnyDayInWeek(baseStart, 1, targetWk, d.key);
                                      if (computedDayDate) {
                                        setLecDate(computedDayDate); // 📅 تحديث تاريخ المحاضرة فورياً ليتطابق مع اليوم الجديد
                                      }
                                    }}
                                    className={`w-full p-3 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer ${
                                      isSel
                                        ? 'bg-[#0F2942] text-white shadow-xs'
                                        : 'text-slate-950 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {isOff ? (
                                        <Calendar className={`w-5 h-5 ${isSel ? 'text-rose-300' : 'text-rose-500'}`} />
                                      ) : (
                                        <Building2 className={`w-5 h-5 ${isSel ? 'text-emerald-300' : 'text-emerald-600'}`} />
                                      )}
                                      <span>{d.label_ar}</span>
                                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                        isSel
                                          ? 'bg-white/20 text-white'
                                          : isOff
                                          ? 'bg-rose-100 text-rose-900'
                                          : 'bg-emerald-100 text-emerald-900'
                                      }`}>
                                        {isOff ? 'عطلة رسمية' : 'دوام رسمي'}
                                      </span>
                                    </div>
                                    {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>

                  {/* 2. المادة الدراسية والمقرر الأكاديمي */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-sm font-black text-slate-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0F2942]" />
                        <span>المادة والمقرر الأكاديمي <span className="text-red-600">*</span></span>
                      </span>
                      {/* 🔬 باج توضيح طبيعة المادة (مختبر وتطبيق عملي / مادة نظرية فقط) بجوار اسم المادة مباشرة وبنسق موحد */}
                      {(() => {
                        const selCourse = courses.find((c) => c.id === lecCourseId);
                        if (!selCourse) return null;
                        const isPractical = selCourse.course_type === 'theory_and_practical' || Boolean(selCourse.has_practical);
                        return (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 shadow-2xs bg-blue-50 text-blue-950 border-blue-200">
                            {isPractical ? (
                              <>
                                <FlaskConical className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                <span>مادة تتضمن مختبر وتطبيق عملي</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                <span>مادة نظرية فقط</span>
                              </>
                            )}
                          </span>
                        );
                      })()}
                    </label>
<div>
                      {(() => {
                        const selectedCourseObj = courses.find((c) => c.id === lecCourseId);
                        return (
                          <>
                            <button
                              ref={lecCourseButtonRef}
                              type="button"
                              onClick={handleToggleLecCourseDropdown}
                              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-lg shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                {selectedCourseObj ? (
                                  <div className="flex items-center gap-2 flex-wrap truncate">
                                    <span className="font-black text-slate-950">{selectedCourseObj.name}</span>
                                    <span className="text-xs font-mono font-black px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">{selectedCourseObj.code}</span>
                                  </div>
                                ) : courses.filter((c) => (c.department_id === currentDeptId || c.department_name === deptName || c.department_id === 'dept-1' || !c.department_id) && c.stage_number === selectedScheduleStage && (c.semester || 1) === selectedScheduleSemester).length === 0 ? (
                                  <span className="text-rose-600 font-black text-xs sm:text-sm">-- لا توجد مادة مضافة لهذه المرحلة والكورس --</span>
                                ) : (
                                  <span className="text-slate-950 font-black text-xs sm:text-sm">-- اضغط هنا لاختيار المادة الدراسية من قائمة المواد --</span>
                                )}
                              </div>
                              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                            </button>

                            {isLecCourseDropdownOpen && lecCourseCoords && typeof document !== 'undefined' && createPortal(
                              <>
                                <div 
                                  className="fixed inset-0 z-[999999] bg-transparent" 
                                  onClick={() => setIsLecCourseDropdownOpen(false)} 
                                />
                                <div 
                                  style={{
                                    position: 'fixed',
                                    ...(lecCourseCoords.openUpwards
                                      ? { bottom: `${lecCourseCoords.bottom}px` }
                                      : { top: `${lecCourseCoords.top}px` }),
                                    left: `${lecCourseCoords.left}px`,
                                    width: `${lecCourseCoords.width}px`,
                                    maxHeight: `${lecCourseCoords.maxHeight || 420}px`,
                                  }}
                                  className="bg-white border-2 border-[#0F2942] rounded-2xl shadow-2xl z-[999999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right"
                                  dir="rtl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {(() => {
                                    // 🔍 تصفية المواد المتاحة لجدول المرحلة والكورس المحددين للقسم الحالي
                                    const availableScheduleCourses = courses.filter(
                                      (c) =>
                                        (c.department_id === currentDeptId || c.department_name === deptName || c.department_id === 'dept-1' || !c.department_id) &&
                                        c.stage_number === selectedScheduleStage &&
                                        (c.semester || 1) === selectedScheduleSemester
                                    );

                                    // 📭 تنبيه عند عدم وجود مواد للمرحلة والكورس المحددين إطلاقاً
                                    if (availableScheduleCourses.length === 0) {
                                      return (
                                        <div className="p-5 text-center text-rose-600 font-black text-sm bg-rose-50/80 m-3 rounded-xl border border-rose-200">
                                          لا توجد مواد دراسية مضافة لهذه المرحلة والكورس
                                        </div>
                                      );
                                    }

                                    // 🧮 فرز مواد النظري والعملي لمسار بولونيا بدقة واحترافية
                                    const totalAvailableCount = availableScheduleCourses.length;
                                    // 📘 المواد التي تتضمن محاضرات نظرية بالقاعة (كافة المقررات الأكاديمية لها محاضرات نظرية)
                                    const allTheoryCourses = availableScheduleCourses;
                                    // 🔬 المواد التي تتضمن مختبراً وتطبيقاً عملياً
                                    const allPracticalCourses = availableScheduleCourses.filter(
                                      (c) => c.course_type === 'theory_and_practical' || Boolean(c.has_practical)
                                    );

                                    // 🔎 فلترة المواد حسب نص البحث (الاسم أو رمز الكود)
                                    const query = lecCourseSearchTerm.trim().toLowerCase();
                                    const matchesSearch = (c: Course) => {
                                      if (!query) return true;
                                      const matchName = (c.name || '').toLowerCase().includes(query);
                                      const matchCode = (c.code || '').toLowerCase().includes(query);
                                      return matchName || matchCode;
                                    };

                                    const filteredTheoryCourses = allTheoryCourses.filter(matchesSearch);
                                    const filteredPracticalCourses = allPracticalCourses.filter(matchesSearch);
                                    const totalFilteredCount = (
                                      lecCourseTabFilter === 'theory' 
                                        ? filteredTheoryCourses.length 
                                        : lecCourseTabFilter === 'practical' 
                                          ? filteredPracticalCourses.length 
                                          : (filteredTheoryCourses.length + filteredPracticalCourses.length)
                                    );

                                    // 🎯 دالة مساعدة لاختيار المادة وضبط إعدادات المحاضرة تلقائياً وبشكل ذكي
                                    const handleSelectCourse = (c: Course) => {
                                      setLecCourseId(c.id);
                                      const isPracticalCourse = c.course_type === 'theory_and_practical' || Boolean(c.has_practical);

                                      // 🧠 تحديد نوع المحاضرة بدقة بناءً على التبويب المفتوح أو طبيعة المادة
                                      if (lecCourseTabFilter === 'practical') {
                                        // 🔬 التبويب عملي ⬅️ تثبيت مختبر وتطبيق عملي
                                        setLecType('practical');
                                        setLecColor('emerald');
                                        if (lecStartTime) {
                                          const autoEnd = calculateEndTimeFromStart(lecStartTime, 'practical');
                                          if (autoEnd) setLecEndTime(autoEnd);
                                        }
                                        if (c.practical_teacher_id) {
                                          setLecTeacherId(c.practical_teacher_id);
                                        } else if (c.theory_teacher_id) {
                                          setLecTeacherId(c.theory_teacher_id);
                                        } else {
                                          setLecTeacherId('');
                                        }
                                      } else if (lecCourseTabFilter === 'theory' || !isPracticalCourse) {
                                        // 📘 التبويب نظري أو المادة نظري فقط ⬅️ تثبيت محاضرة نظرية بالقاعة
                                        setLecType('theory');
                                        setLecColor('blue');
                                        if (lecStartTime) {
                                          const autoEnd = calculateEndTimeFromStart(lecStartTime, 'theory');
                                          if (autoEnd) setLecEndTime(autoEnd);
                                        }
                                        if (c.theory_teacher_id) {
                                          setLecTeacherId(c.theory_teacher_id);
                                        } else {
                                          setLecTeacherId('');
                                        }
                                      } else {
                                        // 🌟 في تبويب "الكل" للمواد المشتركة: نحافظ على اختيار المستخدم أو نعتمد النظري افتراضياً
                                        const chosenType = (lecType === 'practical' ? 'practical' : 'theory');
                                        setLecType(chosenType);
                                        setLecColor(chosenType === 'practical' ? 'emerald' : 'blue');
                                        if (lecStartTime) {
                                          const autoEnd = calculateEndTimeFromStart(lecStartTime, chosenType);
                                          if (autoEnd) setLecEndTime(autoEnd);
                                        }
                                        if (chosenType === 'practical' && c.practical_teacher_id) {
                                          setLecTeacherId(c.practical_teacher_id);
                                        } else if (c.theory_teacher_id) {
                                          setLecTeacherId(c.theory_teacher_id);
                                        } else {
                                          setLecTeacherId('');
                                        }
                                      }
                                      setIsLecCourseDropdownOpen(false);
                                    };

                                    return (
                                      <>
                                        {/* 📌 الشريط العلوي الثابت: حقل البحث اللحظي + أزرار التبويبات (نظري / عملي / الكل) */}
                                        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
                                          {/* 🔍 حقل البحث اللحظي في قائمة المواد */}
                                          <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                              type="text"
                                              value={lecCourseSearchTerm}
                                              onChange={(e) => setLecCourseSearchTerm(e.target.value)}
                                              placeholder="ابحث عن مادة باسمها أو كودها (مثال: CS102)..."
                                              className="w-full pr-9 pl-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/20 outline-none transition"
                                              autoFocus
                                            />
                                            {lecCourseSearchTerm && (
                                              <button
                                                type="button"
                                                onClick={() => setLecCourseSearchTerm('')}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition cursor-pointer"
                                                title="مسح البحث"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>

                                          {/* 📑 تبويبات الفلترة السريعة (الكل / نظري فقط / عملي ومختبري) */}
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => setLecCourseTabFilter('all')}
                                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                                                lecCourseTabFilter === 'all'
                                                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                              }`}
                                            >
                                              <span>الكل</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                                lecCourseTabFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                              }`}>
                                                {totalAvailableCount}
                                              </span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setLecCourseTabFilter('theory')}
                                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                                                lecCourseTabFilter === 'theory'
                                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                  : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                                              }`}
                                            >
                                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                              <span>نظري</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                                lecCourseTabFilter === 'theory' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                                              }`}>
                                                {allTheoryCourses.length}
                                              </span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setLecCourseTabFilter('practical')}
                                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                                                lecCourseTabFilter === 'practical'
                                                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                                  : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                                              }`}
                                            >
                                              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                                              <span>عملي ومختبري</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                                lecCourseTabFilter === 'practical' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                                              }`}>
                                                {allPracticalCourses.length}
                                              </span>
                                            </button>
                                          </div>
                                        </div>

                                        {/* 📜 القائمة التمريرية الذكية للمواد مع الفصل الكامل للنظري والعملي */}
                                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                          {totalFilteredCount === 0 ? (
                                            <div className="p-6 text-center space-y-2">
                                              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                                <Search className="w-5 h-5" />
                                              </div>
                                              <p className="text-xs sm:text-sm font-black text-slate-700">
                                                {lecCourseSearchTerm
                                                  ? `لا توجد مواد تطابق البحث "${lecCourseSearchTerm}"`
                                                  : 'لا توجد مواد مضافة في هذا القسم'}
                                              </p>
                                              {(lecCourseSearchTerm || lecCourseTabFilter !== 'all') && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setLecCourseSearchTerm('');
                                                    setLecCourseTabFilter('all');
                                                  }}
                                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black transition cursor-pointer"
                                                >
                                                  إلغاء الفلترة والبحث
                                                </button>
                                              )}
                                            </div>
                                          ) : (
                                            <>
                                              {/* 📘 1. قسم المواد النظرية */}
                                              {(lecCourseTabFilter === 'all' || lecCourseTabFilter === 'theory') && filteredTheoryCourses.length > 0 && (
                                                <div className="space-y-1">
                                                  <div className="px-3 py-1.5 bg-blue-100/90 rounded-xl border-2 border-blue-300 flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 shadow-2xs">
                                                    <span className="flex items-center gap-2">
                                                      <BookOpen className="w-4 h-4 text-[#0F2942]" />
                                                      <span className="text-slate-950 font-black">المواد والمقررات النظرية (قاعة)</span>
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-200 text-slate-950 font-black border border-blue-300">
                                                      {filteredTheoryCourses.length} مادة
                                                    </span>
                                                  </div>
                                                  {filteredTheoryCourses.map((c) => {
                                                    const isSel = lecCourseId === c.id;
                                                    return (
                                                      <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectCourse(c)}
                                                        className={`w-full p-2.5 rounded-xl text-right font-black transition flex items-center justify-between cursor-pointer border ${
                                                          isSel
                                                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                                            : 'bg-white hover:bg-blue-50/50 text-slate-950 border-slate-200 hover:border-blue-300'
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-2.5">
                                                          <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-white/20 text-cyan-300' : 'bg-blue-100 text-blue-800'}`}>
                                                            <BookOpen className="w-4 h-4" />
                                                          </div>
                                                          <div>
                                                            <div className="text-sm font-black flex items-center gap-2 flex-wrap">
                                                              <span>{c.name}</span>
                                                              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                                                {c.code}
                                                             </span>
                                                            </div>
                                                            {/* 📝 توضيح نص المحاضرات النظرية بلون غامق واضح جداً وإزالة حرف أ. بجانب الأستاذ */}
                                                            <div className={`text-xs sm:text-[13px] mt-0.5 flex items-center gap-2 font-black ${isSel ? 'text-white' : 'text-slate-950'}`}>
                                                              <span className={isSel ? 'text-white font-black' : 'text-blue-950 font-black'}>محاضرات نظرية في القاعة</span>
                                                              {c.theory_teacher_name && (
                                                                <span className={isSel ? 'text-cyan-300 font-black' : 'text-slate-950 font-black'}>
                                                                  • {c.theory_teacher_name}
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3] shrink-0 mr-1" />}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {/* 🔬 2. قسم المواد العملية والمختبرية */}
                                              {(lecCourseTabFilter === 'all' || lecCourseTabFilter === 'practical') && filteredPracticalCourses.length > 0 && (
                                                <div className="space-y-1 pt-1">
                                                  <div className="px-3 py-1.5 bg-emerald-100/90 rounded-xl border-2 border-emerald-300 flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 shadow-2xs">
                                                    <span className="flex items-center gap-2">
                                                      <FlaskConical className="w-4 h-4 text-emerald-800" />
                                                      <span className="text-slate-950 font-black">المواد العملية والمختبرية (مختبر وقاعة)</span>
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-200 text-slate-950 font-black border border-emerald-300">
                                                      {filteredPracticalCourses.length} مادة
                                                    </span>
                                                  </div>
                                                  {filteredPracticalCourses.map((c) => {
                                                    const isSel = lecCourseId === c.id;
                                                    return (
                                                      <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectCourse(c)}
                                                        className={`w-full p-2.5 rounded-xl text-right font-black transition flex items-center justify-between cursor-pointer border ${
                                                          isSel
                                                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                                            : 'bg-white hover:bg-emerald-50/50 text-slate-950 border-slate-200 hover:border-emerald-300'
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-2.5">
                                                          <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-white/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                                                            <FlaskConical className="w-4 h-4" />
                                                          </div>
                                                          <div>
                                                            <div className="text-sm font-black flex items-center gap-2 flex-wrap">
                                                              <span>{c.name}</span>
                                                              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                                                {c.code}
                                                              </span>
                                                            </div>
                                                            {/* 🔬 توضيح نص المختبر والتطبيق العملي بلون زمردي غامق بارز وإزالة حرف أ. بجانب الأستاذ */}
                                                            <div className={`text-xs sm:text-[13px] mt-0.5 flex items-center gap-2 font-black ${isSel ? 'text-white' : 'text-slate-950'}`}>
                                                              <span className={isSel ? 'text-emerald-300 font-black' : 'text-emerald-950 font-black'}>يشمل مختبر وتطبيق عملي</span>
                                                              {(c.practical_teacher_name || c.theory_teacher_name) && (
                                                                <span className={isSel ? 'text-cyan-300 font-black' : 'text-slate-950 font-black'}>
                                                                  • {c.practical_teacher_name || c.theory_teacher_name}
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3] shrink-0 mr-1" />}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </>,
                              document.body
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 3. طبيعة المحاضرة (مباشرة أسفل المادة مع التحديد التلقائي الذكي للنظري والعملي) */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#0F2942]" />
                      <span>طبيعة المحاضرة <span className="text-red-600">*</span></span>
                    </label>
<div>
                        <button
                          ref={lecTypeButtonRef}
                          type="button"
                          onClick={handleToggleLecTypeDropdown}
                          className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {lecType === 'practical' ? (
                              <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : lecType === 'theory' ? (
                              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={`truncate ${!lecType ? 'text-slate-500 font-bold text-xs sm:text-sm' : 'text-slate-950 font-black'}`}>
                              {lecType === 'practical'
                                ? 'مختبر وتطبيق عملي'
                                : lecType === 'theory'
                                ? 'محاضرة نظرية'
                                : '-- اختر طبيعة المحاضرة (نظري / عملي) --'}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecTypeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                        </button>

                        {isLecTypeDropdownOpen && lecTypeCoords && typeof document !== 'undefined' && createPortal(
                          <>
                            <div 
                              className="fixed inset-0 z-[999999] bg-transparent" 
                              onClick={() => setIsLecTypeDropdownOpen(false)} 
                            />
                            <div 
                              style={{
                                position: 'fixed',
                                ...(lecTypeCoords.openUpwards
                                  ? { bottom: `${lecTypeCoords.bottom}px` }
                                  : { top: `${lecTypeCoords.top}px` }),
                                left: `${lecTypeCoords.left}px`,
                                width: `${lecTypeCoords.width}px`,
                                maxHeight: `${lecTypeCoords.maxHeight || 180}px`,
                              }}
                              className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                              dir="rtl"
                            >
                              {/* 🔄 خيار غير محدد لنوع وطبيعة المحاضرة */}
                              <button
                                type="button"
                                onClick={() => {
                                  setLecType(''); // 🏷️ إلغاء تحديد النوع
                                  setLecColor('blue'); // 🎨 ضبط لون افتراضي
                                  setIsLecTypeDropdownOpen(false); // 🚪 إغلاق القائمة
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  !lecType
                                    ? 'bg-[#0F2942] text-white shadow-xs'
                                    : 'text-slate-950 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <BookOpen className="w-4 h-4 text-slate-400" />
                                  <span>-- بدون تحديد نوع (غير محدد) --</span>
                                </div>
                                {!lecType && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                              </button>

                              {[
                                { key: 'theory' as LectureType, label: 'محاضرة نظرية', desc: 'شرح قاعة ومحاضرة نظرية', icon: BookOpen, color: 'blue' as LectureColor },
                                { key: 'practical' as LectureType, label: 'مختبر وتطبيق عملي', desc: 'تطبيقات حاسوبية ومختبرية', icon: FlaskConical, color: 'emerald' as LectureColor },
                              ].map((tItem) => {
                                const isSel = lecType === tItem.key;
                                const IconComp = tItem.icon;
                                return (
                                  <button
                                    key={tItem.key}
                                    type="button"
                                          onClick={() => {
                                            setLecType(tItem.key); // 🏷️ حفظ نوع المحاضرة
                                            setLecColor(tItem.color); // 🎨 ضبط لون الكارد
                                            // ⏱️ تحديث وقت الانتهاء تلقائياً استناداً للنوع الجديد (ساعة للعملي / ساعة ونصف للنظري)
                                            if (lecStartTime) {
                                              const autoEnd = calculateEndTimeFromStart(lecStartTime, tItem.key); // 🧮 حساب وقت النهاية الأكاديمي
                                              if (autoEnd) setLecEndTime(autoEnd); // 🏁 تثبيت التوقيت التلقائي
                                            }
                                            // 👨‍🏫 التبديل الذكي للأستاذ المكلف بحسب نوع المحاضرة إذا كان مسجلاً في المادة
                                            const currCourse = courses.find((c) => c.id === lecCourseId);
                                            if (currCourse) {
                                              if (tItem.key === 'practical' && currCourse.practical_teacher_id) {
                                                setLecTeacherId(currCourse.practical_teacher_id); // 🔬 اختيار أستاذ العملي
                                              } else if (tItem.key === 'theory' && currCourse.theory_teacher_id) {
                                                setLecTeacherId(currCourse.theory_teacher_id); // 👤 اختيار أستاذ النظري
                                              }
                                            }
                                            setIsLecTypeDropdownOpen(false); // 🚪 إغلاق القائمة المنسدلة
                                          }}
                                    className={`w-full p-3 rounded-xl text-right font-black transition flex items-center justify-between cursor-pointer ${
                                      isSel
                                        ? 'bg-[#0F2942] text-white shadow-xs'
                                        : 'text-slate-950 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${isSel ? 'bg-white/20 text-cyan-300' : 'bg-slate-100 text-slate-700'}`}>
                                        <IconComp className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="text-base font-black">{tItem.label}</div>
                                        <div className={`text-xs font-bold ${isSel ? 'text-slate-200' : 'text-slate-500'}`}>{tItem.desc}</div>
                                      </div>
                                    </div>
                                    {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>

                  {/* 3. الأستاذ المحاضر + القاعة */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* الأستاذ */}
                    <div className="space-y-1.5 relative">
                      <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#0F2942]" />
                        <span>الأستاذ المحاضر</span>
                      </label>
                      <div>
                        {(() => {
                          const selectedTeacherObj = deptTeachers.find((t) => t.id === lecTeacherId);
                          return (
                            <>
                              <button
                                ref={lecTeacherButtonRef}
                                type="button"
                                onClick={handleToggleLecTeacherDropdown}
                                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                                  <span className={selectedTeacherObj ? 'text-slate-950 font-black truncate' : 'text-slate-500 font-bold text-xs sm:text-sm truncate'}>
                                    {selectedTeacherObj ? selectedTeacherObj.full_name : '-- بدون تحديد أستاذ --'}
                                  </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecTeacherDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                              </button>

                              {isLecTeacherDropdownOpen && lecTeacherCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  <div 
                                    className="fixed inset-0 z-[999999] bg-transparent" 
                                    onClick={() => setIsLecTeacherDropdownOpen(false)} 
                                  />
                                  <div 
                                    style={{
                                      position: 'fixed',
                                      ...(lecTeacherCoords.openUpwards
                                        ? { bottom: `${lecTeacherCoords.bottom}px` }
                                        : { top: `${lecTeacherCoords.top}px` }),
                                      left: `${lecTeacherCoords.left}px`,
                                      width: `${lecTeacherCoords.width}px`,
                                      maxHeight: `${lecTeacherCoords.maxHeight || 360}px`,
                                    }}
                                    className="bg-white border-2 border-[#0F2942] rounded-2xl shadow-2xl z-[999999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right"
                                    dir="rtl"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* 📌 شريط البحث اللحظي في قائمة الأساتذة */}
                                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
                                      <div className="relative">
                                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                          type="text"
                                          value={lecTeacherSearchTerm}
                                          onChange={(e) => setLecTeacherSearchTerm(e.target.value)}
                                          placeholder="ابحث عن أستاذ بالاسم..."
                                          className="w-full pr-9 pl-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/20 outline-none transition"
                                          autoFocus
                                        />
                                        {lecTeacherSearchTerm && (
                                          <button
                                            type="button"
                                            onClick={() => setLecTeacherSearchTerm('')}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition cursor-pointer"
                                            title="مسح البحث"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* 📜 قائمة الأساتذة القابلة للتمرير */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                      {/* خيار بدون تحديد أستاذ */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLecTeacherId('');
                                          setIsLecTeacherDropdownOpen(false);
                                        }}
                                        className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer border ${
                                          !lecTeacherId
                                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <UserMinus className={`w-4 h-4 ${!lecTeacherId ? 'text-white' : 'text-slate-500'}`} />
                                          <span>-- بدون تحديد أستاذ --</span>
                                        </div>
                                        {!lecTeacherId && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                                      </button>

                                      {(() => {
                                        // 👨‍🏫 جلب المادة المختارة للتحقق من الأستاذ المكلف بها
                                        const currentCourseObj = courses.find((c) => c.id === lecCourseId);
                                        const tQuery = lecTeacherSearchTerm.trim().toLowerCase();
                                        const filteredTeachers = deptTeachers.filter((t) => {
                                          if (!tQuery) return true;
                                          return (t.full_name || '').toLowerCase().includes(tQuery);
                                        });

                                        if (filteredTeachers.length === 0) {
                                          return (
                                            <div className="p-4 text-center text-slate-500 font-bold text-xs">
                                              لا يوجد أستاذ يطابق "{lecTeacherSearchTerm}"
                                            </div>
                                          );
                                        }

                                        return filteredTeachers.map((t) => {
                                          const isSel = lecTeacherId === t.id;
                                          const isAssignedTheory = currentCourseObj?.theory_teacher_id === t.id || teacherCourses.some((tc: TeacherCourse): boolean => tc.course_id === lecCourseId && tc.teacher_id === t.id && (tc.role_in_course === 'theory' || tc.role_in_course === 'both'));
                                          const isAssignedPractical = currentCourseObj?.practical_teacher_id === t.id || teacherCourses.some((tc: TeacherCourse): boolean => tc.course_id === lecCourseId && tc.teacher_id === t.id && (tc.role_in_course === 'practical' || tc.role_in_course === 'both'));
                                          return (
                                            <button
                                              key={t.id}
                                              type="button"
                                              onClick={() => {
                                                setLecTeacherId(t.id);
                                                setIsLecTeacherDropdownOpen(false);
                                              }}
                                              className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer border ${
                                                isSel
                                                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                                  : 'bg-white hover:bg-slate-50 text-slate-950 border-slate-200 hover:border-slate-300'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-white/20 text-cyan-300' : 'bg-blue-50 text-blue-800'}`}>
                                                  <UserCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span>{t.full_name}</span>
                                                    {isAssignedTheory && (
                                                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                                        isSel ? 'bg-blue-400/30 text-cyan-200 border-cyan-300/40' : 'bg-blue-50 text-blue-800 border-blue-200'
                                                      }`}>
                                                        أستاذ النظري المكلف
                                                      </span>
                                                    )}
                                                    {isAssignedPractical && (
                                                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                                        isSel ? 'bg-emerald-400/30 text-emerald-200 border-emerald-300/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                      }`}>
                                                        أستاذ العملي المكلف
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              {isSel && <Check className="w-4 h-4 text-cyan-300 stroke-[3] shrink-0 mr-1" />}
                                            </button>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                </>,
                                document.body
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* القاعة والمختبر مع المقترحات الشاغرة الذكية */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                        <DoorClosed className="w-4 h-4 text-[#0F2942]" />
                        <span>القاعة / المختبر <span className="text-red-600">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={lecRoom}
                        onChange={(e) => setLecRoom(e.target.value)}
                        placeholder="مثال: مدرج الخوارزمي، مختبر البرمجيات 1..."
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-sm font-black text-slate-950 focus:outline-none focus:ring-4 focus:ring-[#0F2942]/10 transition-all shadow-2xs"
                      />


                    </div>
                  </div>

                  {/* 4. وقت البدء + وقت الانتهاء بقوائم منسدلة احترافية مخصصة */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* البدء */}
                    <div className="space-y-1.5 relative">
                      <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0F2942]" />
                        <span>وقت بدء المحاضرة <span className="text-red-600">*</span></span>
                      </label>
                      <div>
                        {(() => {
                          const parsed = parseTime24To12(lecStartTime);
                          return (
                            <>
                              <button
                                ref={lecStartTimeButtonRef}
                                type="button"
                                onClick={handleToggleLecStartTimeDropdown}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                                  isLecStartTimeDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${parsed.isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-900'}`}>
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  {parsed.isEmpty ? (
                                    <span className="text-slate-500 font-bold text-xs sm:text-sm">-- : -- تحديد وقت البدء</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-base font-black text-slate-950">{parsed.hourDisplay}:{parsed.minute}</span>
                                      <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                                        parsed.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                                      }`}>
                                        {parsed.periodArabic}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecStartTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                              </button>

                              {isLecStartTimeDropdownOpen && lecStartTimeCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  <div 
                                    className="fixed inset-0 z-[999999] bg-transparent" 
                                    onClick={() => setIsLecStartTimeDropdownOpen(false)} 
                                  />
                                  {renderCustomTimePickerDropdown(
                                    lecStartTimeCoords,
                                    'وقت بدء المحاضرة',
                                    lecStartTime,
                                    (newTime) => {
                                      setLecStartTime(newTime); // ⏱️ ضبط وقت بدء المحاضرة المختار
                                      // 🕒 حساب وقت الانتهاء تلقائياً بموجب نظام الكليات الأهلية العراقية (ساعة للعملي وساعة ونصف للنظري)
                                      const autoEnd = calculateEndTimeFromStart(newTime, lecType); // 🧮 استخراج وقت النهاية
                                      if (autoEnd) {
                                        setLecEndTime(autoEnd); // 🏁 ضبط وقت الانتهاء التلقائي
                                      }
                                    },
                                    () => setIsLecStartTimeDropdownOpen(false),
                                    lecStudyType
                                  )}
                                </>,
                                document.body
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* الانتهاء */}
                    <div className="space-y-1.5 relative">
                      <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0F2942]" />
                        <span>وقت انتهاء المحاضرة <span className="text-red-600">*</span></span>
                      </label>
                      <div>
                        {(() => {
                          const parsed = parseTime24To12(lecEndTime);
                          return (
                            <>
                              <button
                                ref={lecEndTimeButtonRef}
                                type="button"
                                onClick={handleToggleLecEndTimeDropdown}
                                className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                                  isLecEndTimeDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${parsed.isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-900'}`}>
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  {parsed.isEmpty ? (
                                    <span className="text-slate-500 font-bold text-xs sm:text-sm">-- : -- تحديد وقت الانتهاء</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-base font-black text-slate-950">{parsed.hourDisplay}:{parsed.minute}</span>
                                      <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                                        parsed.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                                      }`}>
                                        {parsed.periodArabic}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecEndTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                              </button>

                              {isLecEndTimeDropdownOpen && lecEndTimeCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  <div 
                                    className="fixed inset-0 z-[999999] bg-transparent" 
                                    onClick={() => setIsLecEndTimeDropdownOpen(false)} 
                                  />
                                  {renderCustomTimePickerDropdown(
                                    lecEndTimeCoords,
                                    'وقت انتهاء المحاضرة',
                                    lecEndTime,
                                    (newTime) => setLecEndTime(newTime),
                                    () => setIsLecEndTimeDropdownOpen(false),
                                    lecStudyType
                                  )}
                                </>,
                                document.body
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                </div>

                {/* 📊 العمود الأيسر (الرصد الذكي + كاشف التعارضات + محاضرات اليوم) - 5 أعمدة */}
                <div className="lg:col-span-5 space-y-3.5">
                  
                  {/* ⚠️ 1. بطاقة كاشف التعارض والتضارب الزمني اللحظي */}
                  {!lecDay || !lecStartTime || !lecEndTime ? (
                    <div className="p-3.5 bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-center gap-2.5 text-slate-950 shadow-2xs">
                      <Clock className="w-5 h-5 text-slate-600 shrink-0" />
                      <div className="text-xs sm:text-sm font-black text-slate-950">
                        يرجى تحديد اليوم الأسبوعي ووقتي البدء والانتهاء لتفعيل كاشف التعارض الزمني
                      </div>
                    </div>
                  ) : currentLecConflicts.length > 0 ? (
                    <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 animate-in slide-in-from-top-1 duration-200 shadow-xs">
                      <div className="flex items-center gap-2 text-rose-950 font-black text-sm sm:text-base">
                        <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                        <span>كاشف التعارض والتضارب الزمني ({currentLecConflicts.length}):</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {currentLecConflicts.map((c, i) => (
                          <div key={i} className="text-xs sm:text-sm font-black text-rose-950 bg-white p-2.5 rounded-xl border border-rose-200 flex items-start gap-2 shadow-2xs">
                            <span className="px-2 py-0.5 bg-rose-700 text-white rounded-md text-[11px] font-black shrink-0">
                              {c.type === 'room' ? 'القاعة' : c.type === 'teacher' ? 'الأستاذ' : 'المرحلة'}
                            </span>
                            <span className="leading-snug">{c.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-950 shadow-2xs animate-in slide-in-from-top-1 duration-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs sm:text-sm font-black">
                        لا يوجد أي تعارض زمني أو انشغال للقاعة والأستاذ في هذا التوقيت
                      </div>
                    </div>
                  )}

                  {/* 📋 2. قائمة المحاضرات المجدولة لهذا اليوم بسكرول مستقل واحترافي لمنع تمدد المودال */}
                  <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm flex flex-col">
                    {/* 🗓️ ترويسة قائمة المحاضرات: السطر الأول يضم العنوان وعداد المحاضرات، والسطر الثاني يضم الوسوم أسفلهما */}
                    <div className="space-y-2 border-b border-slate-200 pb-3 shrink-0">
                      {/* السطر الأول: عنوان المحاضرات مع الأيقونة يميناً + عداد المحاضرات يساراً */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                            <Calendar className="w-4 h-4 text-cyan-300" />
                          </div>
                          <span className="text-sm sm:text-base font-black text-slate-950">
                            محاضرات ({lecDay ? (DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay) : 'غير محدد'})
                          </span>
                        </div>
                        <span className="text-xs font-black text-blue-950 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-2xs shrink-0">
                          {formatArabicLectureCount(lecDay ? scheduleLectures.filter((l) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length : 0)}
                        </span>
                      </div>

                      {/* السطر الثاني: الوسوم أسفل العنوان وعداد المحاضرات */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 🏷️ شارة نوع الدراسة موحدة باللون الأزرق الأكاديمي الاحترافي */}
                        <span className="text-xs px-2.5 py-0.5 rounded-lg font-black flex items-center gap-1 bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
                          {lecStudyType === 'evening' ? (
                            <>
                              <Moon className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>مسائي</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                              <span>صباحي</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 font-black shadow-2xs">
                          الأسبوع {lecWeekNumber}
                        </span>
                        {lecDate && (
                          <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
                            {lecDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {!lecDay ? (
                      <div className="text-sm sm:text-base font-black text-slate-800 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center shadow-2xs">
                        حدد اليوم الأسبوعي من القائمة لاستعراض كافة المحاضرات المجدولة فيه.
                      </div>
                    ) : scheduleLectures.filter((l) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length === 0 ? (
                      <div className="text-sm sm:text-base font-black text-slate-800 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center shadow-2xs">
                        لا توجد محاضرات مجدولة لهذا اليوم حتى الآن.
                      </div>
                    ) : (
                      <div 
                        ref={lecListContainerRef} 
                        className="space-y-3 p-1 overflow-y-auto max-h-[440px] sm:max-h-[470px] pr-1.5 scroll-smooth"
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        {scheduleLectures
                          .filter((l) => isLectureInCurrentDept(l) && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay)
                          // 🕒 ترتيب المحاضرات زمنياً من الصباح للمساء بشكل طبيعي واحترافي
                          .sort((a, b) => (timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time)) || a.course_name.localeCompare(b.course_name, 'ar'))
                          .map((lecItem, idx) => {
                            const isNewlyAdded = recentlyAddedLectureId === lecItem.id; // 🌟 فحص هل المحاضرة مضافة أو محدثة للتو
                            const isEditingCurrent = editingLectureId === lecItem.id; // ✏️ فحص هل المحاضرة هي قيد التعديل الآن
                            return (
                            <div
                              key={lecItem.id}
                              id={`lec-card-${lecItem.id}`} // 🆔 معرف الكارت لعمل سكرول فوري إليه
                              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-3 ${
                                isEditingCurrent
                                  ? 'bg-blue-50/95 border-[#0F2942] ring-3 ring-blue-500/20 shadow-md scale-[1.01]'
                                  : isNewlyAdded
                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                                  : 'bg-white border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-xs'
                              }`}
                            >
                              {/* 🏷️ 1. الترويسة: الشارات على اليمين + أزرار تعديل وحذف على اليسار مصفوفة أفقياً */}
                              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* 🎖️ وسم تسلسل المحاضرة الأكاديمي الفصيح (المحاضرة الأولى، المحاضرة الثانية...) بتصميم كحلي ملكي راقٍ */}
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#0F2942] text-white border border-[#0F2942] flex items-center gap-1.5 shadow-2xs shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />
                                    <span>{formatArabicOrdinalLectureName(idx + 1)}</span>
                                  </span>
                                  {/* نوع الدراسة موحد بلون أزرق أكاديمي */}
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 flex items-center gap-1 shadow-2xs">
                                    {(lecItem.study_type || 'morning') === 'evening' ? (
                                      <>
                                        <Moon className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                        <span>مسائي</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sun className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                        <span>صباحي</span>
                                      </>
                                    )}
                                  </span>

                                  {/* طبيعة المحاضرة موحدة بلون أزرق أكاديمي */}
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-950 border border-blue-200 flex items-center gap-1 shadow-2xs">
                                    {lecItem.type === 'practical' ? (
                                      <>
                                        <FlaskConical className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                        <span>مختبر عملي</span>
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                                        <span>محاضرة نظرية</span>
                                      </>
                                    )}
                                  </span>

                                  {/* رقم الأسبوع والتاريخ الأكاديمي الحقيقي موحد ومطابق ليوم وأسبوع المحاضرة بلون أزرق أكاديمي */}
                                  {(() => {
                                    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
                                    const previewWeek = lecWeekNumber || selectedScheduleWeek;
                                    const actualDate = lecItem.weekly_overrides?.[previewWeek]?.date
                                      || lecItem.custom_weekly_dates?.[previewWeek]
                                      || calculateDateForAnyDayInWeek(baseStart, 1, previewWeek, lecItem.day);

                                    return (
                                      <>
                                        <span className="bg-blue-50 text-blue-950 px-2 py-0.5 rounded-lg border border-blue-200 text-xs font-black shadow-2xs">
                                          الأسبوع {previewWeek}
                                        </span>
                                        {actualDate && (
                                          <span className="bg-blue-50 text-blue-950 px-2 py-0.5 rounded-lg border border-blue-200 text-xs font-mono font-black shadow-2xs">
                                            {actualDate}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}

                                  {/* شارة قيد التعديل */}
                                  {isEditingCurrent && (
                                    <span className="px-2 py-0.5 bg-[#0F2942] text-white text-[11px] font-black rounded-lg shadow-xs flex items-center gap-1 animate-pulse">
                                      <Edit3 className="w-3 h-3 text-cyan-300" />
                                      <span>قيد التعديل</span>
                                    </span>
                                  )}

                                  {/* شارة أضيفت للتو */}
                                  {isNewlyAdded && (
                                    <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-black rounded-lg flex items-center gap-1 shadow-2xs">
                                      <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                      <span>أُضيفت للتو</span>
                                    </span>
                                  )}
                                </div>

                                {/* 🛠️ أزرار التعديل والحذف: أفقية أنيقة متساوية الحجم */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleEditLecture(lecItem)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-[#0F2942] text-blue-950 hover:text-white border border-blue-300 hover:border-[#0F2942] rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                    title="تعديل بيانات هذه المحاضرة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLecture(lecItem.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300 hover:border-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                    title="حذف هذه المحاضرة من الجدول"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </div>

                              {/* 📖 2. اسم المادة الأكاديمية: بخط بارز وكامل دون أي اقتطاع */}
                              <div className="text-slate-950 font-black text-sm sm:text-base leading-snug">
                                {lecItem.course_name}
                              </div>

                              {/* 🏛️ 3. شريط المعلومات: الوقت بسطر مستقل، وتحته القاعة والأستاذ بشكل ثابت واحترافي */}
                              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                                {/* ⏱️ السطر الأول: باج التوقيت الأكاديمي الصريح بنظام 12 ساعة مع (ص) و (م) */}
                                <div className="flex items-center">
                                  {(() => {
                                    const format12Hour = (timeStr: string): { time: string; period: 'ص' | 'م' } => {
                                      if (!timeStr) return { time: '00:00', period: 'ص' };
                                      const parts = timeStr.trim().split(':');
                                      let h = parseInt(parts[0] || '0', 10);
                                      const m = (parts[1] || '00').padStart(2, '0');
                                      let period: 'ص' | 'م' = 'ص';
                                      if (h === 12 || h === 0) period = 'م';
                                      else if (h >= 13 && h <= 23) { period = 'م'; h -= 12; }
                                      else if (h >= 1 && h <= 7) period = 'م';
                                      else period = 'ص';
                                      const hStr = h < 10 ? `0${h}` : `${h}`;
                                      return { time: `${hStr}:${m}`, period };
                                    };
                                    const st12 = format12Hour(lecItem.start_time);
                                    const et12 = format12Hour(lecItem.end_time);
                                    return (
                                      <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-950 px-3 py-1 rounded-lg border border-blue-200 shadow-2xs select-none">
                                        <Clock className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                                        <div className="inline-flex items-center gap-1 text-xs font-mono font-black" dir="rtl">
                                          <span className="inline-flex items-center gap-1">
                                            <span dir="ltr" className="font-mono font-bold tracking-tight">{st12.time}</span>
                                            <span className="text-[10px] font-black text-blue-900 bg-blue-100/90 px-1 py-0.2 rounded border border-blue-200">{st12.period}</span>
                                          </span>
                                          <span className="text-blue-400 font-bold px-0.5 select-none leading-none">—</span>
                                          <span className="inline-flex items-center gap-1">
                                            <span dir="ltr" className="font-mono font-bold tracking-tight">{et12.time}</span>
                                            <span className="text-[10px] font-black text-blue-900 bg-blue-100/90 px-1 py-0.2 rounded border border-blue-200">{et12.period}</span>
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* 🏛️ السطر الثاني: القاعة والأستاذ جنباً إلى جنب أسفل التوقيت مباشرة بشكل موحد */}
                                <div className="flex items-center gap-2 text-xs font-black text-blue-950 flex-wrap">
                                  <span className="bg-blue-50 text-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1">
                                    <span>القاعة:</span>
                                    <strong className="text-blue-950 font-black">{lecItem.room || 'غير محددة'}</strong>
                                  </span>
                                  {lecItem.teacher_name && (
                                    <span className="bg-blue-50 text-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1">
                                      <span>الأستاذ:</span>
                                      <strong className="text-blue-950 font-black">{lecItem.teacher_name}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FloatingCrudModal>

  );
};

export default LectureModal; // 🚀 تصدير المكون كافتراضي
