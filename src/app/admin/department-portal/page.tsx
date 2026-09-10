'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 لوحة إدارة القسم المركزية (رئيس القسم والمقرر) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة المؤقتة والمراجع
import { createPortal } from 'react-dom'; // 🚪 بورتال لرسم القوائم العائمة في قمة المستند مباشرة فوق الفوتر
import Image from 'next/image'; // 🖼️ مكون الصور
import Link from 'next/link'; // 🔗 روابط التنقل
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getStoredData, 
  saveStoredData, 
  INITIAL_PROFILES, 
  INITIAL_DEPARTMENTS, 
  INITIAL_COURSES, 
  INITIAL_TEACHER_COURSES, 
  INITIAL_GRADES, 
  INITIAL_SCHEDULE_LECTURES,
  INITIAL_SCHEDULE_CONFIGS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_EXCUSE_REQUESTS,
  INITIAL_FINAL_EXAM_SCHEDULES,
  INITIAL_FINAL_EXAM_SLOTS,
  INITIAL_TUITION_RECORDS,
  getAcademicYear,
  formatAcademicYearDisplay,
  generateStrongUniqueEmail, 
  generateStrongPassword 
} from '@/lib/mock-data'; // 💾 التخزين والمولدات
import { 
  checkEmailUniquenessAcrossSystem, 
  detectDuplicateEmails, 
  resolveDuplicateEmailsInProfiles 
} from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد ومنع التكرار الأكاديمي الشامل
import { 
  getCurrentSessionUser, 
  logoutUser, 
  saveProfileToSupabase, 
  deleteProfileFromSupabase,
  syncFullDepartmentPortalData,
  saveCourseToSupabase,
  deleteCourseFromSupabase,
  saveTeacherCourseToSupabase,
  deleteTeacherCourseFromSupabase,
  saveScheduleLectureToSupabase,
  saveScheduleLecturesBulkToSupabase,
  deleteScheduleLectureFromSupabase,
  deleteScheduleLecturesBulkFromSupabase,
  syncScheduleLecturesFromSupabase,
  saveScheduleConfigToSupabase,
  saveTuitionRecordToSupabase,
  syncAttendanceRecordsFromSupabase,
  subscribeToAcademicYearChanges,
  saveFinalExamScheduleToSupabase,
  saveFinalExamSlotsToSupabase,
  syncFinalExamSchedulesFromSupabase,
  syncFinalExamSlotsFromSupabase,
  deleteFinalExamScheduleFromSupabase,
  deleteFinalExamSlotFromSupabase,
  syncCampusAnnouncementsFromSupabase,
  saveCampusAnnouncementToSupabase,
  deleteCampusAnnouncementFromSupabase,
  syncExcuseRequestsFromSupabase,
  saveExcuseRequestToSupabase,
  saveMultipleGradesToSupabase,
  saveMultipleAttendanceRecordsToSupabase
} from '@/lib/supabase-client'; // 🔌 الجلسة الحالية وحفظ وحذف ومزامنة السحابة الحية لكافة الكيانات
import { UserProfile, Department, Course, TeacherCourse, Grade, CourseType, AssessmentScheme, ScheduleLecture, DepartmentScheduleConfig, DayOfWeek, LectureColor, LectureType, StudentAttendanceRecord, AttendanceWarningStatus, AttendanceExcuseRequest, FinalExamSchedule, FinalExamSlot, StudentTuitionRecord, CampusAnnouncement } from '@/types'; // 🔗 واجهات الأنواع المعتمدة بدون كود ميت
import { calculateCourseworkTotal, getDefaultAssessmentScheme, getCourseAssessmentScheme, getStageNameInArabic, calculateFinalTotal, getLetterGrade } from '@/lib/grade-utils'; // 🧮 دوال حسابات الدرجات وأسماء المراحل المعتمدة
import { calculateStudentCourseAttendance, getAttendanceWarningBadgeMeta } from '@/lib/attendance-utils'; // 📋 دوال وضوابط الغياب لمسار بولونيا
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الأستاذ والطالب
import { 
  DAYS_OF_WEEK_LIST, 
  LECTURE_COLOR_THEMES, 
  LECTURE_TYPE_LABELS, 
  DEFAULT_WORKING_DAYS, 
  DEFAULT_OFF_DAYS, 
  getScheduleConfigOrDefault,
  timeStringToMinutes,
  checkLectureCollisions,
  getAvailableRoomsForSlot,
  UNIVERSITY_ROOMS_CATALOG,
  ScheduleConflict,
  getDayOfWeekFromDateString,
  calculateDateForAnyDayInWeek,
  generateAll15WeeksDates,
  shiftLectureToAnyDay,
  calculateAcademicWeekFromDate, // 🧮 حساب رقم الأسبوع التقويمي
  getCurrentAcademicWeek,        // ⚡ اكتشاف الأسبوع الحالي الذكي
  formatDateArabicWithDay,       // 🏷️ تنسيق التاريخ بالعربية مع اسم اليوم
  IRAQI_ARABIC_MONTHS,           // 🗓️ الشهور العراقية المعتمدة
  formatArabicScheduleTime,      // ⏱️ تنسيق التوقيت الأكاديمي مع ص وم
  formatSingleTime,              // 🕒 دالة التوقيت الفردي الصباحي والمسائي
  formatArabicOrdinalLectureName, // 🎖️ دالة صياغة تسلسل المحاضرة الأكاديمي الفصيح
  formatArabicLectureCount       // 🔤 دالة صياغة عدد المحاضرات السليمة نحوياً
} from '@/lib/schedule-utils'; // 🕒 أدوات وحسابات الجدول الأسبوعي وكشف التضارب الزمني والتعاقب الذكي للأسابيع
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import AnalyticsCharts from '@/components/AnalyticsCharts'; // 📈 لوحة الرسوم البيانية التفاعلية
import ArabicDatePicker from '@/components/schedule/ArabicDatePicker'; // 📅 مكون التقويم الأكاديمي العربي الفاخر
import MasterHallMatrixModal from '@/components/schedule/MasterHallMatrixModal'; // 🏛️ مكون مصفوفة إشغال القاعات والمختبرات الشاملة للكلية
import ExcuseRequestsReviewModal from '@/components/attendance/ExcuseRequestsReviewModal'; // 📑 نافذة مراجعة طلبات الإجازات لرئيس القسم
import DepartmentDurationSettingsModal from '@/components/attendance/DepartmentDurationSettingsModal'; // ⚙️ نافذة تخصيص ساعات المحاضرات
import AttendanceAnalyticsCharts from '@/components/attendance/AttendanceAnalyticsCharts'; // 📊 لوحة الرسوم البيانية للحضور والغياب
import AttendanceNoticeModal, { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 نافذة التبليغات والتنبيهات الذكية للحضور والعطل والامتحانات
import FinalExamScheduleEditor from '@/components/exams/FinalExamScheduleEditor'; // 📝 محرر وإدارة جداول الامتحانات النهائية
import TuitionManagementTab from '@/components/tuition/TuitionManagementTab'; // 💳 لوحة إدارة وتسديد الأقساط الدراسية
import { DepartmentAssessmentsOverview } from '@/components/assessments/DepartmentAssessmentsOverview'; // 📚 لوحة تدقيق وإشراف التكليفات والامتحانات الفصلية
import { exportOfficialWarningLetterPDF, exportDepartmentCoursesPDF, DepartmentCoursePDFItem } from '@/lib/pdf-export'; // 📜 مولد كتب الإنذارات وكشوفات المواد الرسمية PDF
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المكون العائم الفاخر للـ CRUD
import ConfirmDeleteModal, { ConfirmModalIcon } from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock'; // 🔒 نظام إدارة التمرير المركزي للنوافذ المنبثقة
import { downloadDepartmentTeachersTemplate, downloadDepartmentStudentsTemplate, downloadDepartmentCoursesTemplate, generateDepartmentScheduleTemplate, parseExcelFile, exportCustomTeachersList, exportCustomStudentsList, exportCustomCoursesList, exportCustomScheduleList, exportCustomTeacherCoursesList, exportCustomGradesList, exportCustomAttendanceList } from '@/lib/excel-utils'; // 📊 دوال قراءة وتوليد ونماذج وتصدير جداول Excel المعتمدة
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون نظام الصفحات الموحد والفاخر
import AssessmentSchemeModal from '@/components/department-portal/modals/AssessmentSchemeModal'; // 🎛️ نافذة تخصيص درجات مسار بولونيا
import DepartmentTeachersTab from '@/components/department-portal/tabs/DepartmentTeachersTab'; // 👨‍🏫 مكون تبويب إدارة أساتذة القسم المستقل
import DepartmentStudentsTab from '@/components/department-portal/tabs/DepartmentStudentsTab'; // 🎓 مكون تبويب إدارة طلبة القسم المستقل
import DepartmentCoursesTab from '@/components/department-portal/tabs/DepartmentCoursesTab'; // 📚 مكون تبويب إدارة المواد والمقررات المستقل
import DepartmentAssignmentsTab from '@/components/department-portal/tabs/DepartmentAssignmentsTab'; // 🔄 مكون تبويب إدارة تكليفات الأساتذة المستقل
import DepartmentScheduleTab from '@/components/department-portal/tabs/DepartmentScheduleTab'; // 🕒 مكون تبويب الجدول الأسبوعي والمحاضرات المستقل
import DepartmentAttendanceTab from '@/components/department-portal/tabs/DepartmentAttendanceTab'; // 📋 مكون تبويب الحضور والغيابات والإنذارات المستقل
import DepartmentGradesTab from '@/components/department-portal/tabs/DepartmentGradesTab'; // 📝 مكون تبويب درجات وسعيات مسار بولونيا المستقل
import DepartmentAnalyticsTab from '@/components/department-portal/tabs/DepartmentAnalyticsTab'; // 📊 مكون تبويب التحليلات والرسوم البيانية المستقل
import DepartmentPortalHeader from '@/components/department-portal/DepartmentPortalHeader'; // 🏛️ مكون هيدر وشريط تنقل بوابة القسم المستقل
import DepartmentExcelModals from '@/components/department-portal/modals/DepartmentExcelModals'; // 📊 مكون مودالات إرشادات وتقارير الإكسل المستقل
import RoundConfirmModal from '@/components/department-portal/modals/RoundConfirmModal'; // 🔒 مودال تأكيد فتح وإغلاق الأدوار الامتحانية
import SemesterDateConfirmModal from '@/components/department-portal/modals/SemesterDateConfirmModal'; // 📅 مودال تأكيد تاريخ انطلاق الفصل
import TeacherCourseAssignModal from '@/components/department-portal/modals/TeacherCourseAssignModal'; // 👨‍🏫 مودال تكليف الأستاذ بالمواد
import DepartmentPrintModals from '@/components/department-portal/modals/DepartmentPrintModals'; // 🖨️ مودالات المعاينة والطباعة الموحدة
import DepartmentAccountCardModal from '@/components/department-portal/modals/DepartmentAccountCardModal'; // 📇 نافذة بطاقة الحساب الأكاديمي الصادر

// 📊 نوع بيانات تقرير نتائج استيراد الإكسل
interface ImportSummaryReport {
  totalRows: number;
  accepted: { name: string; dept: string; email: string }[];
  duplicates: { name: string; email: string; dept: string; reason: string }[];
  rejected: { rowNumber: number; rawName: string; reason: string }[];
}

import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  User, // 👤 أيقونة اسم الأستاذ والطالب
  Mail, // ✉️ أيقونة البريد الأكاديمي
  KeyRound, // 🔑 أيقونة كلمة المرور
  Globe, // 🌐 أيقونة بوابة الدخول والمنصة
  Layers, 
  FileSpreadsheet, 
  UserPlus, 
  Plus, 
  Edit3, 
  Trash2, 
  Key,
  Download,
  Upload,
  Info,
  Copy, 
  Check, 
  Search, 
  ShieldCheck, 
  QrCode, 
  ChevronDown,
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  CheckCheck, // ✨ أيقونة التحديد الشامل لكافة المحاضرات
  AlertCircle, 
  ArrowRightLeft,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Award,
  Sliders,
  Settings2,
  FlaskConical,
  Clock,
  Coffee,
  Sun,
  Radio,
  Eye,
  EyeOff,
  X,
  UserMinus,
  UserCheck,
  Lock,
  ArrowRight,
  FileDown,
  SlidersHorizontal,
  Settings,
  CheckSquare,
  Square,
  TrendingUp,
  Moon,
  MapPin,
  AlertTriangle,
  ClipboardList,
  Printer,
  FileText,
  CreditCard,
  DoorClosed,
  Lightbulb,
  Ban,
  Briefcase,
  Umbrella,
  ArrowUp,
  ArrowDown,
  Send,
  BellRing,
  RotateCcw,
  Save, // 💾 أيقونة الحفظ السريع
  Unlock,
  Megaphone,
} from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust

// 📑 أنواع التبويبات الـ 11 المعتمدة في لوحة تحكم إدارة القسم
export type DepartmentAdminTab = 
  | 'teachers'
  | 'students'
  | 'courses'
  | 'assignments'
  | 'grades'
  | 'schedule'
  | 'attendance'
  | 'exams'
  | 'course_tasks'
  | 'tuition'
  | 'analytics';

// 📋 مصفوفة التبويبات الـ 11 المعتمدة للتحقق الصارم ومنع القيم غير المعروفة
const VALID_ADMIN_TABS: readonly DepartmentAdminTab[] = [
  'teachers',
  'students',
  'courses',
  'assignments',
  'grades',
  'schedule',
  'attendance',
  'exams',
  'course_tasks',
  'tuition',
  'analytics'
] as const;

// 🏷️ عناوين ونصوص التبويبات لتحديث عنوان نافذة المتصفح ديناميكياً
const ADMIN_TAB_TITLES: Record<DepartmentAdminTab, string> = {
  teachers: 'كادر التدريسيين',
  students: 'شؤون الطلبة',
  courses: 'المناهج والمقررات',
  assignments: 'تكليفات الأساتذة',
  grades: 'سجل الدرجات والسعي',
  schedule: 'الجدول الأسبوعي',
  attendance: 'الحضور والغيابات',
  exams: 'الامتحانات النهائية',
  course_tasks: 'التكليفات والامتحانات الفصلية',
  tuition: 'الأقساط الدراسية',
  analytics: 'التحليلات والإحصائيات'
};

// 🔤 دالة مساعدة لتطبيع وتنظيف النصوص العربية لإزالة الفروقات الإملائية
function normalizeArabicText(s?: string): string {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

// 🔄 محرك التوفيق والتزامن المركزي الشامل بين المواد الدراسية وتكليفات الأساتذة (100% Two-Way Sync)
export function reconcileCoursesWithTeacherCourses(
  currentCourses: Course[], // 📋 قائمة المواد الحالية
  currentTCs: TeacherCourse[], // 📝 قائمة التكليفات الحالية
  allProfiles: UserProfile[] // 👤 قائمة ملفات الأساتذة
): { reconciledCourses: Course[]; reconciledTCs: TeacherCourse[]; hasChanges: boolean } {
  let hasChanges: boolean = false; // 🚩 مؤشر حدوث أي تغييرات تستوجب الحفظ
  const tcMap: Map<string, TeacherCourse> = new Map<string, TeacherCourse>(); // 🗺️ خريطة لتجميع التكليفات دون تكرار
  currentTCs.forEach((tc: TeacherCourse) => tcMap.set(tc.id, tc)); // ➕ إدراج التكليفات الحالية

  // 1️⃣ تحديث وإثراء المواد وتوفيق صفة التكليف (نظري فقط / عملي فقط / نظري وعملي)
  const updatedCourses: Course[] = currentCourses.map((c: Course): Course => {
    let thId: string | undefined = c.theory_teacher_id; // 🔑 معرف أستاذ النظري
    let thName: string | undefined = c.theory_teacher_name; // 👤 اسم أستاذ النظري
    let prId: string | undefined = c.practical_teacher_id; // 🔑 معرف أستاذ العملي
    let prName: string | undefined = c.practical_teacher_name; // 🧪 اسم أستاذ العملي
    const isPracticalCourse = c.course_type === 'theory_and_practical' || Boolean(c.has_practical); // 🔬 هل المادة بها جانب عملي ومختبر؟

    // مطابقة الأسماء من البروفايلات أولاً إذا كانت المعرفات متوفرة والأسماء فارغة
    if (thId && !thName) { // 🔍 إذا المعرف موجود والاسم فارغ
      const p: UserProfile | undefined = allProfiles.find((prof: UserProfile): boolean => prof.id === thId); // 👤 البحث عن البروفايل
      if (p) { // ✅ وجدنا البروفايل
        thName = p.full_name; // 📝 تثبيت الاسم
        hasChanges = true; // 🚩 تم التعديل
      }
    }
    if (prId && !prName) { // 🔍 إذا معرف العملي موجود والاسم فارغ
      const p: UserProfile | undefined = allProfiles.find((prof: UserProfile): boolean => prof.id === prId); // 👤 البحث عن البروفايل
      if (p) { // ✅ وجدنا البروفايل
        prName = p.full_name; // 📝 تثبيت الاسم
        hasChanges = true; // 🚩 تم التعديل
      }
    }

    // البحث في سجل التكليفات الخاص بهذه المادة لمطابقة وتحديث أي نقص
    const courseAssignments: TeacherCourse[] = currentTCs.filter((tc: TeacherCourse): boolean => tc.course_id === c.id); // 📋 جلب تكليفات المادة
    if (courseAssignments.length > 0) { // 🎯 إذا اكو تكليفات مسجلة
      // فحص تكليف النظري الصريح
      const thTC: TeacherCourse | undefined = courseAssignments.find(
        (tc: TeacherCourse): boolean => tc.role_in_course === 'theory' || tc.role_in_course === 'both'
      );
      if (thTC) { // ✅ وجدنا تكليف نظري
        if (!thId || thId !== thTC.teacher_id) { // 🔍 إذا المعرف مو نفسه
          thId = thTC.teacher_id; // 🔗 تثبيت المعرف
          hasChanges = true; // 🚩 تم التعديل
        }
        const expectedName: string = thTC.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === thTC.teacher_id)?.full_name || 'أستاذ المادة'; // 👤 الاسم المتوقع
        if (!thName || thName !== expectedName) { // 🔍 إذا الاسم فارغ أو مختلف
          thName = expectedName; // 📝 تثبيت الاسم
          hasChanges = true; // 🚩 تم التعديل
        }
      }

      // فحص تكليف العملي الصريح
      const prTC: TeacherCourse | undefined = courseAssignments.find(
        (tc: TeacherCourse): boolean => tc.role_in_course === 'practical' || (tc.role_in_course === 'both' && isPracticalCourse)
      );
      if (prTC && isPracticalCourse) { // ✅ وجدنا تكليف عملي لمادة بها عملي
        if (!prId || prId !== prTC.teacher_id) { // 🔍 إذا المعرف مو نفسه
          prId = prTC.teacher_id; // 🔗 تثبيت المعرف
          hasChanges = true; // 🚩 تم التعديل
        }
        const expectedPrName: string = prTC.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === prTC.teacher_id)?.full_name || 'أستاذ العملي'; // 🧪 الاسم المتوقع
        if (!prName || prName !== expectedPrName) { // 🔍 إذا الاسم فارغ أو مختلف
          prName = expectedPrName; // 📝 تثبيت الاسم
          hasChanges = true; // 🚩 تم التعديل
        }
      }

      // 🎯 ذكاء التوفيق الأكاديمي: إذا كانت المادة تحوي عملي ومسجل لها تكليفان، والتكليف الثاني لم يُسجل كعملي
      if (isPracticalCourse && courseAssignments.length >= 2 && (!prId || prId === thId)) {
        const secondTC = courseAssignments.find((tc: TeacherCourse): boolean => tc.teacher_id !== thId);
        if (secondTC) {
          prId = secondTC.teacher_id;
          prName = secondTC.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === secondTC.teacher_id)?.full_name || prName;
          hasChanges = true;
        }
      }

      // 🎯 تصحيح وتحديث صفة التكليف (role_in_course) في الخريطة tcMap لكل تكليف في هذه المادة
      courseAssignments.forEach((tc: TeacherCourse) => {
        let correctRole: 'theory' | 'practical' | 'both' = tc.role_in_course || 'theory';

        const isTh = Boolean(
          (thId && tc.teacher_id === thId) ||
          (thName && tc.teacher_name && normalizeArabicText(thName) === normalizeArabicText(tc.teacher_name))
        );
        const isPr = Boolean(
          isPracticalCourse && (
            (prId && tc.teacher_id === prId) ||
            (prName && tc.teacher_name && normalizeArabicText(prName) === normalizeArabicText(tc.teacher_name))
          )
        );

        if (!isPracticalCourse) {
          // 📘 مادة نظري فقط ⬅️ مكلف نظري فقط حتماً
          correctRole = 'theory';
        } else if (isTh && isPr) {
          // 🌟 أستاذ المادة مكلف بالنظري والعملي معاً
          correctRole = 'both';
        } else if (isPr && !isTh) {
          // 🔬 مكلف بالعملي فقط
          correctRole = 'practical';
        } else if (isTh && !isPr) {
          // 📘 مكلف بالنظري فقط
          correctRole = 'theory';
        } else if (courseAssignments.length === 2 && isPracticalCourse) {
          // 👥 إذا كان هناك تكليفان في مادة عملية ولم يتطابق أحدهما مع الحقول
          if (tc.id === courseAssignments[0].id) {
            correctRole = 'theory';
          } else {
            correctRole = 'practical';
          }
        }

        // 🔄 إذا كانت صفة التكليف الحالية مختلفة عن الصفة الصحيحة
        if (tc.role_in_course !== correctRole) {
          const updatedRecord: TeacherCourse = {
            ...tc,
            role_in_course: correctRole,
            course_name: c.name,
            department_id: c.department_id,
            semester: c.semester || 1,
          };
          tcMap.set(tc.id, updatedRecord);
          hasChanges = true;
        }
      });
    }

    // 2️⃣ الاتجاه العكسي: إذا كانت المادة محدد بها أستاذ في c.theory_teacher_id وليس له سجل تكليف
    if (thId) { // 🔍 إذا المادة تملك أستاذ نظري
      const existsInTC: boolean = currentTCs.some((tc: TeacherCourse): boolean => tc.course_id === c.id && tc.teacher_id === thId); // 📋 فحص وجود التكليف
      if (!existsInTC) { // ❌ إذا التكليف غير مسجل بسجل التكليفات
        const teacherProf: UserProfile | undefined = allProfiles.find((p: UserProfile): boolean => p.id === thId); // 👤 جلب البروفايل
        const newTC: TeacherCourse = { // 📝 بناء سجل التكليف الجديد تلقائياً
          id: `tc-th-${c.id}-${thId}`, // 🆔 توليد معرف فريد
          teacher_id: thId, // 🔗 معرف الأستاذ
          teacher_name: thName || teacherProf?.full_name || 'أستاذ المادة', // 👤 اسم الأستاذ
          course_id: c.id, // 🔗 معرف المادة
          course_name: c.name, // 📖 اسم المادة
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الكورس
          role_in_course: (prId === thId && isPracticalCourse) ? 'both' : 'theory', // 🏷️ صفة التكليف
          created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
        };
        tcMap.set(newTC.id, newTC); // 💾 حفظ التكليف بالخريطة
        hasChanges = true; // 🚩 تم التعديل
      }
    }

    if (prId && isPracticalCourse && prId !== thId) { // 🔍 فحص أستاذ العملي
      const existsInPrTC: boolean = currentTCs.some((tc: TeacherCourse): boolean => tc.course_id === c.id && tc.teacher_id === prId); // 📋 فحص التكليف
      if (!existsInPrTC) { // ❌ إذا غير موجود
        const teacherPrProf: UserProfile | undefined = allProfiles.find((p: UserProfile): boolean => p.id === prId); // 👤 جلب البروفايل
        const newPrTC: TeacherCourse = { // 📝 بناء سجل تكليف العملي
          id: `tc-pr-${c.id}-${prId}`, // 🆔 معرف فريد
          teacher_id: prId, // 🔗 معرف الأستاذ
          teacher_name: prName || teacherPrProf?.full_name || 'أستاذ العملي والمختبر', // 🧪 اسم الأستاذ
          course_id: c.id, // 🔗 معرف المادة
          course_name: c.name, // 📖 اسم المادة
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الكورس
          role_in_course: 'practical', // 🏷️ صفة التكليف
          created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
        };
        tcMap.set(newPrTC.id, newPrTC); // 💾 حفظ بالخريطة
        hasChanges = true; // 🚩 تم التعديل
      }
    }

    if (thId !== c.theory_teacher_id || thName !== c.theory_teacher_name || prId !== c.practical_teacher_id || prName !== c.practical_teacher_name) { // 🔍 فحص حدوث تغيير بالمادة
      return { // 📦 إرجاع المادة المحدثة بالكامل
        ...c,
        theory_teacher_id: thId,
        theory_teacher_name: thName,
        practical_teacher_id: prId,
        practical_teacher_name: prName,
      };
    }
    return c; // 📋 إبقاء المادة كما هي إذا لم تتغير
  });

  const reconciledTCs: TeacherCourse[] = Array.from(tcMap.values()); // 📋 تحويل التكليفات لمصفوفة
  return { // 🚀 إرجاع النتائج المتوافقة 100%
    reconciledCourses: updatedCourses,
    reconciledTCs,
    hasChanges,
  };
}

export default function DepartmentPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<DepartmentAdminTab>('teachers');

  // 💾 مخازن البيانات
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [scheduleLectures, setScheduleLectures] = useState<ScheduleLecture[]>([]);
  const [scheduleConfigs, setScheduleConfigs] = useState<DepartmentScheduleConfig[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [tuitionRecords, setTuitionRecords] = useState<StudentTuitionRecord[]>([]);
  
  // 🗓️ حالة العام الدراسي المتزامن حياً مع المسؤول العام وقاعدة بيانات Supabase
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🏢 تحديد القسم المدار
  const [currentDeptId, setCurrentDeptId] = useState<string>('');

  // 🏢 دالة فحص مطابقة المحاضرة للقسم المدار حالياً بعزل تام وصارم 100%
  const isLectureInCurrentDept = useCallback((l: ScheduleLecture): boolean => {
    // 🔒 عزل صارم 100%: القسم الجديد أو الحالي لا يعرض إلا محاضراته الحقيقية التابعة له فقط
    if (!currentDeptId) return false;
    return l.department_id === currentDeptId;
  }, [currentDeptId]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCardProfile, setSelectedCardProfile] = useState<UserProfile | null>(null);

  // 🔘 حالات نظام التحديد المتعدد للأساتذة والطلاب
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]); // 👥 معرفات الأساتذة المحددين
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // 🎓 معرفات الطلاب المحددين

  // 🚀 حالات الترحيل الأكاديمي والفلترة للطلاب
  const [filterStudentStage, setFilterStudentStage] = useState<number | 'all'>('all');
  const [isBulkPromotionModalOpen, setIsBulkPromotionModalOpen] = useState(false);
  const [bulkPromoteSourceStage, setBulkPromoteSourceStage] = useState<number>(1);

  // 📌 حقول نموذج الأساتذة
  const [teacherName, setTeacherName] = useState(''); // 👤 اسم الأستاذ الكريم
  const [teacherGender, setTeacherGender] = useState<'male' | 'female' | null>(null); // ⚤ جنس الأستاذ المحترم - الافتراضي غير محدد
  const [customTeacherEmail, setCustomTeacherEmail] = useState(''); // ✉️ البريد الأكاديمي المخصص أو المولد
  const [customTeacherPassword, setCustomTeacherPassword] = useState(''); // 🔑 كلمة المرور المخصصة أو المولدة
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري للأستاذ بنجوم أو نص صريح
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null); // ✍️ معرف الأستاذ الجاري تعديله
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false); // 📦 حالة كارت CRUD العائم للأساتذة
  const [nameError, setNameError] = useState(''); // ⚠️ تنبيه خطأ الاسم
  const [showExcelInstructions, setShowExcelInstructions] = useState(false); // ℹ️ نافذة تعليمات الاستيراد
  const [isImportingExcel, setIsImportingExcel] = useState(false); // ⏳ حالة جاري استيراد الإكسل
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null); // 📊 تقرير نتائج الاستيراد
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط في التقرير

  // 🔐 شروط ومعايير كلمة المرور التفاعلية للأستاذ
  const passwordCriteria = useMemo(() => {
    const p = customTeacherPassword || '';
    return {
      length: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [customTeacherPassword]);

  const passwordStrengthScore = useMemo(() => {
    if (!customTeacherPassword) return 0;
    let score = 0;
    if (passwordCriteria.length) score += 25;
    if (passwordCriteria.hasUpper) score += 25;
    if (passwordCriteria.hasNumber) score += 25;
    if (passwordCriteria.hasSpecial) score += 25;
    return score;
  }, [passwordCriteria, customTeacherPassword]);

  // 📌 حقول نموذج الطلاب
  const [studentName, setStudentName] = useState(''); // 👤 اسم الطالب
  const [studentStage, setStudentStage] = useState<number | null>(null); // 🎓 المرحلة الدراسية للطالب - الافتراضي غير محدد
  const [isStudentStageDropdownOpen, setIsStudentStageDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح وإغلاق قائمة المرحلة المخصصة
  const stageButtonRef = useRef<HTMLButtonElement | null>(null); // 🎯 مرجع زر المرحلة لحساب الموضع بالمليمتر
  const [stageDropdownCoords, setStageDropdownCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null); // 📍 إحداثيات القائمة المنسدلة بالبكسل

  // 🖨️ حالات طباعة وتصدير بطاقات اعتماد الأساتذة والطلاب (10 بطاقات بالورقة الواحدة A4)
  const [showTeacherPrintModal, setShowTeacherPrintModal] = useState<boolean>(false); // 🖨️ نافذة معاينة وطباعة بطاقات الأساتذة
  const [singleTeacherPrintProfile, setSingleTeacherPrintProfile] = useState<UserProfile | null>(null); // 👤 طباعة بطاقة فردية لأستاذ محدد
  const [showStudentPrintModal, setShowStudentPrintModal] = useState<boolean>(false); // 🖨️ نافذة معاينة وطباعة بطاقات الطلاب
  const [singleStudentPrintProfile, setSingleStudentPrintProfile] = useState<UserProfile | null>(null); // 🎓 طباعة بطاقة فردية لطالب محدد
  const [studentPrintStageFilter, setStudentPrintStageFilter] = useState<number | 'all'>('all'); // 📚 تصفية طباعة الطلاب حسب المرحلة
  const [studentPrintStudyFilter, setStudentPrintStudyFilter] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 تصفية طباعة الطلاب حسب الفترة

  // 🖨️ حالات طباعة وتصدير جدول تكليفات الكادر التدريسي المعتمد (A4 رسمي بمسار بولونيا)
  const [showAssignmentsPrintModal, setShowAssignmentsPrintModal] = useState<boolean>(false); // 🖨️ فتح وإغلاق نافذة المعاينة والطباعة للتكليفات
  const [assignmentsPrintScope, setAssignmentsPrintScope] = useState<'filtered' | 'all'>('filtered'); // 🎯 نطاق الطباعة: المفلترة حالياً أو كافة التكليفات

  // 👨‍🏫 حالات نظام CRUD لإدارة وتكليف المواد لكل أستاذ على حدة
  const [crudTeacher, setCrudTeacher] = useState<UserProfile | null>(null); // 👤 الأستاذ المختار لإدارة تكليفاته
  const [isTeacherCrudModalOpen, setIsTeacherCrudModalOpen] = useState<boolean>(false); // 🪟 حالة فتح مودال تكليفات الأستاذ
  const [teacherCrudCourseId, setTeacherCrudCourseId] = useState<string>(''); // 📚 المادة المراد تكليفها للأستاذ المختار
  const [teacherCrudSearchQuery, setTeacherCrudSearchQuery] = useState<string>(''); // 🔍 البحث عن مادة لتكليفها

  // 📝 حالات تعديل التكليف الأكاديمي (Update Assignment)
  const [editingAssignment, setEditingAssignment] = useState<TeacherCourse | null>(null); // 🔄 التكليف الجاري تعديله عبر الكارد الموحد

  // ⚡ واجهة كائن حالة مودال التعيين والتكليف السريع للأستاذ من داخل جدول المقررات مباشرة
  interface QuickAssignState {
    isOpen: boolean; // 🪟 حالة فتح نافذة المودال السريع
    course: Course | null; // 📖 كائن المادة الدراسية المستهدفة بالتعيين
    role: 'theory' | 'practical'; // 🏷️ صفة التدريس المطلوبة (نظري أو عملي)
    selectedTeacherId: string; // 👨‍🏫 معرف الأستاذ المختار للتعيين
    searchQuery: string; // 🔍 نص البحث لتصفية الأساتذة بسرعة
  }

  // ⚡ حالة مودال التعيين السريع المركزية
  const [quickAssignConfig, setQuickAssignConfig] = useState<QuickAssignState>({
    isOpen: false, // 🔒 مغلق افتراضياً عند الإقلاع
    course: null, // 📖 لا توجد مادة محددة بالبداية
    role: 'theory', // 🏷️ الافتراضي هو الجانب النظري
    selectedTeacherId: '', // 👨‍🏫 لم يتم اختيار أستاذ بعد
    searchQuery: '', // 🔍 مربع البحث فارغ
  });

  const [isMounted, setIsMounted] = useState<boolean>(false); // 🌐 حالة التثبيت بالعميل لتفعيل البورتال بأمان

  // ⚡ خطاف التحميل بالعميل
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🖨️ إدارة كلاس الطباعة على جسم الصفحة لضمان خروج وثيقة الطباعة A4 بدون أي مساحات فارغة
  useEffect(() => {
    if (showTeacherPrintModal || showStudentPrintModal || showAssignmentsPrintModal) {
      document.body.classList.add('print-modal-active');
      return () => {
        document.body.classList.remove('print-modal-active');
      };
    }
  }, [showTeacherPrintModal, showStudentPrintModal, showAssignmentsPrintModal]);

  // 🏢 حالات القائمة المنسدلة لتبديل القسم للمسؤول
  const [isDeptSwitcherDropdownOpen, setIsDeptSwitcherDropdownOpen] = useState<boolean>(false);
  const deptSwitcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const [deptSwitcherCoords, setDeptSwitcherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  // 📐 دالة ذكية لحساب موضع القوائم المنسدلة بدقة تامة بحيث تظهر دائماً ملاصقة للزر تماماً داخل حدود الشاشة المرئية 100% بدون أي قص أو خروج
  const calculateSmartDropdownPosition = (
    buttonEl: HTMLElement, 
    preferredHeight = 260,
    preferredWidth?: number
  ): { top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } => {
    // 🛑 فحص أمان بيئة التشغيل للـ SSR
    if (typeof window === 'undefined') {
      return { top: 0, bottom: undefined, left: 0, width: 200, maxHeight: preferredHeight, openUpwards: false };
    }
    // 📐 استخراج حدود وموقع الزر بالبكسل من الشاشة
    const rect = buttonEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight; // 📱 ارتفاع نافذة العرض
    const viewportWidth = window.innerWidth; // 📱 عرض نافذة العرض
    
    // 📏 حساب المساحة الصافية المتوفرة أعلى وأسفل الزر داخل الشاشة مع هامش أمان 12px
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - 12);
    const spaceAbove = Math.max(0, rect.top - 12);
    
    let openUpwards = false;
    
    // 🚀 اتخاذ القرار: إذا كانت المساحة بالأسفل كافية نفتح للأسفل، وإلا نفتح للأعلى
    if (spaceBelow >= preferredHeight) {
      openUpwards = false;
    } else if (spaceAbove >= preferredHeight) {
      openUpwards = true;
    } else {
      openUpwards = spaceAbove > spaceBelow;
    }
    
    // 🛡️ تحديد أقصى ارتفاع مسموح به للقائمة لمنع خروجها نهائياً عن الشاشة
    const availableSpace = openUpwards ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(preferredHeight, Math.max(120, availableSpace - 6));
    
    // 📍 الحساب الرياضي الدقيق لمنع أي طيران أو فجوة:
    // عند الفتح للأعلى: نربط أسفل القائمة بأعلى الزر بـ 6px من أسفل الشاشة (bottom)
    // عند الفتح للأسفل: نربط أعلى القائمة بأسفل الزر بـ 6px من أعلى الشاشة (top)
    const top = openUpwards ? undefined : Math.max(12, rect.bottom + 6);
    const bottom = openUpwards ? Math.max(12, (viewportHeight - rect.top) + 6) : undefined;
    
    // 📐 العرض المستهدف مع تقييده بأبعاد الشاشة
    const targetWidth = preferredWidth 
      ? Math.min(preferredWidth, viewportWidth - 24) 
      : Math.min(rect.width, viewportWidth - 24);
      
    // 🧭 المحاذاة الأفقية: محاذاة يمين القائمة مع يمين الزر في الواجهة العربية RTL
    let left = preferredWidth && preferredWidth !== rect.width
      ? rect.right - targetWidth
      : rect.left;
      
    // 🛡️ صمام أمان حديدي: إلزام بقاء القائمة محصورة 100% داخل الشاشة يميناً ويساراً
    if (left + targetWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - targetWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }
    
    return { top, bottom, left, width: targetWidth, maxHeight, openUpwards };
  };


  // 🔽 دالة فتح وإغلاق قائمة المرحلة مع الحساب الذكي لضمان بقائها داخل حدود الشاشة 100%
  const handleToggleStudentStageDropdown = () => {
    if (!isStudentStageDropdownOpen && stageButtonRef.current) {
      setStageDropdownCoords(calculateSmartDropdownPosition(stageButtonRef.current, 220)); // 📐 حساب الموضع التفاعلي بالارتفاع المضبوط
      setIsStudentStageDropdownOpen(true); // 🔓 فتح القائمة
    } else {
      setIsStudentStageDropdownOpen(false); // 🔒 إغلاق القائمة
    }
  };

  // 🏢 دالة فتح وإغلاق قائمة تبديل القسم مع الحساب الذكي
  const handleToggleDeptSwitcherDropdown = () => {
    if (!isDeptSwitcherDropdownOpen && deptSwitcherButtonRef.current) {
      setDeptSwitcherCoords(calculateSmartDropdownPosition(deptSwitcherButtonRef.current, 260));
      setIsDeptSwitcherDropdownOpen(true);
    } else {
      setIsDeptSwitcherDropdownOpen(false);
    }
  };

  // 🔄 إغلاق قائمة المرحلة المنسدلة تلقائياً عند تغيير حجم الشاشة (دون التأثير على السكرول الداخلي للقائمة)
  useEffect(() => {
    const handleAutoClose = () => {
      if (isStudentStageDropdownOpen) setIsStudentStageDropdownOpen(false);
    };
    if (isStudentStageDropdownOpen) {
      window.addEventListener('resize', handleAutoClose);
    }
    return () => {
      window.removeEventListener('resize', handleAutoClose);
    };
  }, [isStudentStageDropdownOpen]);

  const [studentGender, setStudentGender] = useState<'male' | 'female' | null>(null); // ⚤ جنس الطالب - الافتراضي غير محدد
  const [studentStudyType, setStudentStudyType] = useState<'morning' | 'evening' | null>(null); // ☀️🌙 الفترة الدراسية للطالب (صباحي / مسائي) - الافتراضي غير محدد
  const [filterStudentStudyType, setFilterStudentStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // 🔍 تصفية الطلاب حسب الفترة
  const [customStudentEmail, setCustomStudentEmail] = useState(''); // ✉️ البريد الأكاديمي للطالب
  const [customStudentPassword, setCustomStudentPassword] = useState(''); // 🔑 كلمة المرور للطالب
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري للطالب بنجوم أو نص صريح
  const [studentSearch, setStudentSearch] = useState(''); // 🔍 البحث
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // ✍️ معرف الطالب الجاري تعديله
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false); // 📦 حالة كارت CRUD العائم للطلاب
  const [studentNameError, setStudentNameError] = useState(''); // ⚠️ تنبيه خطأ الاسم
  const [showStudentExcelInstructions, setShowStudentExcelInstructions] = useState(false); // ℹ️ نافذة تعليمات الاستيراد للطلاب
  const [isImportingStudentExcel, setIsImportingStudentExcel] = useState(false); // ⏳ حالة جاري استيراد إكسل للطلاب
  const [studentImportReport, setStudentImportReport] = useState<ImportSummaryReport | null>(null); // 📊 تقرير استيراد الطلاب
  const [studentActiveReportTab, setStudentActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط

  // 🔐 شروط ومعايير كلمة المرور التفاعلية للطالب
  const studentPasswordCriteria = useMemo(() => {
    const p = customStudentPassword || '';
    return {
      length: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [customStudentPassword]);

  const studentPasswordStrengthScore = useMemo(() => {
    if (!customStudentPassword) return 0;
    let score = 0;
    if (studentPasswordCriteria.length) score += 25;
    if (studentPasswordCriteria.hasUpper) score += 25;
    if (studentPasswordCriteria.hasNumber) score += 25;
    if (studentPasswordCriteria.hasSpecial) score += 25;
    return score;
  }, [studentPasswordCriteria, customStudentPassword]);

  // 📌 حقول نموذج المواد الدراسية - جعل القيم الافتراضية غير محددة
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCredits, setCourseCredits] = useState<number | null>(null); // ⏱️ الساعات والوحدات المعتمدة ECTS - غير محدد افتراضياً
  const [courseStage, setCourseStage] = useState<number | null>(null); // 🎓 المرحلة الدراسية للمادة - غير محدد افتراضياً
  const [courseSemester, setCourseSemester] = useState<1 | 2 | null>(null); // 🗓️ الكورس الدراسي للمادة - غير محدد افتراضياً
  const [courseType, setCourseType] = useState<CourseType | null>(null); // 🔬 نوع وتوصيف المادة - غير محدد افتراضياً
  const [courseTheoryTeacherId, setCourseTheoryTeacherId] = useState<string>('');
  const [coursePracticalTeacherId, setCoursePracticalTeacherId] = useState<string>('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseIsSupplementaryEnabled, setCourseIsSupplementaryEnabled] = useState<boolean>(false); // 🔄 حالة تفعيل الدور الثاني للمادة
  const [courseIsFinalExamEnabled, setCourseIsFinalExamEnabled] = useState<boolean>(false); // 🎯 حالة تفعيل وعرض الامتحان النهائي الدور الأول للمادة
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false); // 📦 حالة كارت CRUD العائم للمواد
  const [isCourseTheoryDropdownOpen, setIsCourseTheoryDropdownOpen] = useState(false); // 🔽 حالة قائمة أستاذ النظري
  const [isCoursePracticalDropdownOpen, setIsCoursePracticalDropdownOpen] = useState(false); // 🔽 حالة قائمة أستاذ العملي
  
  // 🎯 مراجع ومواضع القوائم المنسدلة الذكية للأساتذة لضمان بقائها داخل حدود الشاشة المرئية 100%
  const theoryTeacherBtnRef = useRef<HTMLButtonElement | null>(null); // 📌 مرجع زر أستاذ النظري
  const [theoryTeacherCoords, setTheoryTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const practicalTeacherBtnRef = useRef<HTMLButtonElement | null>(null); // 📌 مرجع زر أستاذ العملي
  const [practicalTeacherCoords, setPracticalTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  // 👨‍🏫 فتح وإغلاق قائمة أستاذ النظري بحساب ذكي يمنع خروجها خارج الشاشة
  const handleToggleCourseTheoryDropdown = () => {
    if (!isCourseTheoryDropdownOpen && theoryTeacherBtnRef.current) {
      setTheoryTeacherCoords(calculateSmartDropdownPosition(theoryTeacherBtnRef.current, 220));
      setIsCourseTheoryDropdownOpen(true);
      setIsCoursePracticalDropdownOpen(false);
    } else {
      setIsCourseTheoryDropdownOpen(false);
    }
  };

  // 🧪 فتح وإغلاق قائمة أستاذ العملي بحساب ذكي يمنع خروجها خارج الشاشة
  const handleToggleCoursePracticalDropdown = () => {
    if (!isCoursePracticalDropdownOpen && practicalTeacherBtnRef.current) {
      setPracticalTeacherCoords(calculateSmartDropdownPosition(practicalTeacherBtnRef.current, 220));
      setIsCoursePracticalDropdownOpen(true);
      setIsCourseTheoryDropdownOpen(false);
    } else {
      setIsCoursePracticalDropdownOpen(false);
    }
  };

  // 🔐 حالة نافذة تأكيد تغيير حالة الامتحان (فتح أو إغلاق الدور الأول أو الدور الثاني) في كارد المادة
  const [examToggleConfirmation, setExamToggleConfirmation] = useState<{
    isOpen: boolean;
    examType: 'final' | 'supplementary';
    targetState: boolean;
    title: string;
    description: string;
  } | null>(null);

  // ⚡ تنفيذ تأكيد فتح أو إغلاق الامتحان بعد موافقة المستخدم
  const handleConfirmExamToggle = () => {
    if (!examToggleConfirmation) return;
    if (examToggleConfirmation.examType === 'final') {
      setCourseIsFinalExamEnabled(examToggleConfirmation.targetState);
    } else {
      setCourseIsSupplementaryEnabled(examToggleConfirmation.targetState);
    }
    setExamToggleConfirmation(null);
  };
  const [courseTeacherSearch, setCourseTeacherSearch] = useState(''); // 🔍 بحث التدريسي في الكارد
  const [courseSearch, setCourseSearch] = useState<string>(''); // 🔍 بحث المواد
  const [filterCourseStage, setFilterCourseStage] = useState<number | 'all'>('all'); // 🏷️ تصفية مرحلة المواد
  const [filterCourseSemester, setFilterCourseSemester] = useState<number | 'all'>('all'); // 🏷️ تصفية كورس المواد
  const [filterCourseType, setFilterCourseType] = useState<'all' | 'theory_and_practical' | 'theory_only'>('all'); // 🏷️ تصفية نوع المادة
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]); // 🔘 معرفات المواد المحددة
  const [showCourseExcelInstructions, setShowCourseExcelInstructions] = useState(false); // ℹ️ نافذة تعليمات استيراد المواد
  const [isImportingCourseExcel, setIsImportingCourseExcel] = useState(false); // ⏳ حالة جاري استيراد إكسل للمواد
  const [isExportingCoursesPDF, setIsExportingCoursesPDF] = useState(false); // 🖨️ حالة جاري تصدير وطباعة كشف المواد كـ PDF الرسمية
  const [courseImportReport, setCourseImportReport] = useState<ImportSummaryReport | null>(null); // 📊 تقرير استيراد المواد
  const [courseActiveReportTab, setCourseActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط في تقرير المواد

  // 📊 حالات التحميل لتصدير ملفات Excel لمختلف الأقسام والتبويبات
  const [isExportingTeachersExcel, setIsExportingTeachersExcel] = useState(false); // ⏳ حالة تصدير كادر الأساتذة
  const [isExportingStudentsExcel, setIsExportingStudentsExcel] = useState(false); // ⏳ حالة تصدير كشف الطلاب
  const [isExportingCoursesExcel, setIsExportingCoursesExcel] = useState(false); // ⏳ حالة تصدير المواد والمقررات
  const [isExportingAssignmentsExcel, setIsExportingAssignmentsExcel] = useState(false); // ⏳ حالة تصدير التكليفات التدريسية
  const [isExportingGradesExcel, setIsExportingGradesExcel] = useState(false); // ⏳ حالة تصدير سجلات درجات بولونيا
  const [isExportingAttendanceExcel, setIsExportingAttendanceExcel] = useState(false); // ⏳ حالة تصدير كشف الحضور والغيابات

  // 🎛️ حالة نافذة تخصيص توزيع الدرجات والعناوين لبنود بولونيا الـ 7
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedCourseForAssessment, setSelectedCourseForAssessment] = useState<Course | null>(null);
  const [tempAssessmentScheme, setTempAssessmentScheme] = useState<AssessmentScheme>(getDefaultAssessmentScheme('theory_and_practical'));

  // 🔒 نوع وبيانات نافذة تأكيد فتح أو قفل الدور الأكاديمي (الأول أو الثاني) للكورسات
  interface RoundActionConfirmation {
    isOpen: boolean; // حالة ظهور المودال
    round: 'final' | 'supplementary'; // الدور الأول أو الدور الثاني
    enable: boolean; // true للفتح، false للقفل
    targetSemester: 1 | 2 | 'all'; // الكورس المستهدف (1 أو 2 أو الكل)
    targetStage: number | 'all'; // المرحلة المستهدفة
    targetCourseId?: string; // معرف المادة إذا كان الإجراء لمادة واحدة محددة
    targetCourseName?: string; // اسم المادة الفردية
    targetCourseIds?: string[]; // قائمة معرفات المواد إذا كان الإجراء لمواد محددة بالاختيار
    affectedCount: number; // عدد المواد المتأثرة
    title: string; // عنوان العملية
    description: string; // وصف تفصيلي للعملية
  }
  const [roundConfirmModal, setRoundConfirmModal] = useState<RoundActionConfirmation | null>(null);

  // 🔒 قفل واستعادة تمرير الصفحة بدقة عند فتح أو إغلاق نافذة تأكيد فتح وقفل الدور
  useEffect(() => {
    if (roundConfirmModal?.isOpen) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    }
  }, [roundConfirmModal?.isOpen]);

  // 🗑️ حالة كارد الحذف والتأكيد الأكاديمي الاحترافي العام
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemDetails?: string;
    warningMessage?: string;
    warningNote?: string;
    confirmText?: string;
    variant?: 'danger' | 'success' | 'warning' | 'info';
    iconType?: ConfirmModalIcon;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    itemDetails: '',
    warningMessage: '',
    warningNote: '',
    confirmText: 'تأكيد الإجراء',
    variant: 'danger',
    iconType: 'trash',
    onConfirm: () => {},
  });

  // 📌 حقول نموذج التكليفات الدراسية
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedAssignRole, setSelectedAssignRole] = useState<'theory' | 'practical' | 'both'>('theory'); // 🏷️ طبيعة التكليف (نظري / عملي / كلاهما)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false); // 📦 حالة كارت CRUD العائم للتكليفات
  const [assignmentSearch, setAssignmentSearch] = useState(''); // 🔍 بحث التكليفات
  const [filterAssignmentTeacher, setFilterAssignmentTeacher] = useState<string | 'all'>('all'); // 🏷️ تصفية الأستاذ المكلف
  const [filterAssignmentStage, setFilterAssignmentStage] = useState<number | 'all'>('all'); // 🏷️ تصفية مرحلة التكليف
  const [filterAssignmentSemester, setFilterAssignmentSemester] = useState<number | 'all'>('all'); // 🏷️ تصفية كورس التكليف
  const [filterAssignmentRole, setFilterAssignmentRole] = useState<'all' | 'theory' | 'practical' | 'both'>('all'); // 🏷️ تصفية طبيعة التكليف (نظري فقط / عملي فقط / كلاهما)
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]); // 🔘 معرفات التكليفات المحددة

  // 🔽 حالات القوائم المنسدلة التفاعلية الفاخرة لكارت تكليف التدريسي
  const [isAssignTeacherDropdownOpen, setIsAssignTeacherDropdownOpen] = useState(false);
  const assignTeacherButtonRef = useRef<HTMLButtonElement | null>(null);
  const [assignTeacherCoords, setAssignTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null>(null);
  const [assignTeacherSearchQuery, setAssignTeacherSearchQuery] = useState('');

  const [isAssignCourseDropdownOpen, setIsAssignCourseDropdownOpen] = useState(false);
  const assignCourseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [assignCourseCoords, setAssignCourseCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null>(null);
  const [assignCourseSearchQuery, setAssignCourseSearchQuery] = useState('');

  // 👨‍🏫 حالات القائمة المنسدلة الذكية لفلترة الأساتذة بجدول التكليفات
  const [isFilterTeacherDropdownOpen, setIsFilterTeacherDropdownOpen] = useState(false); // 📦 حالة فتح أو سد قائمة فلتر الأساتذة بالتكليفات
  const filterTeacherButtonRef = useRef<HTMLButtonElement | null>(null); // 🔗 ريفرنس زر القائمة حتى نحسب موقعه بدقة بالشاشة
  const [filterTeacherCoords, setFilterTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number; openUpwards: boolean } | null>(null); // 📐 إحداثيات القائمة المحصورة داخل الشاشة حصراً
  const [filterTeacherSearchQuery, setFilterTeacherSearchQuery] = useState(''); // 🔍 نص البحث السريع داخل منسدلة الأساتذة

  const getPreciseDropdownPosition = (buttonEl: HTMLElement, maxMenuHeight = 280) => {
    if (typeof window === 'undefined') return { top: 0, left: 0, width: 300, maxHeight: maxMenuHeight, openUpwards: false };
    const rect = buttonEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;
    const width = rect.width;
    let left = rect.left;
    if (left + width > vw - 16) {
      left = Math.max(16, vw - width - 16);
    }
    if (left < 16) left = 16;

    if (openUpwards) {
      return {
        bottom: vh - rect.top + 6,
        left,
        width,
        maxHeight: Math.min(maxMenuHeight, Math.max(140, spaceAbove - 24)),
        openUpwards: true,
      };
    } else {
      return {
        top: rect.bottom + 6,
        left,
        width,
        maxHeight: Math.min(maxMenuHeight, Math.max(140, spaceBelow - 24)),
        openUpwards: false,
      };
    }
  };

  const handleToggleAssignTeacherDropdown = () => {
    if (!isAssignTeacherDropdownOpen && assignTeacherButtonRef.current) {
      setAssignTeacherCoords(getPreciseDropdownPosition(assignTeacherButtonRef.current, 280));
      setIsAssignTeacherDropdownOpen(true);
      setIsAssignCourseDropdownOpen(false);
      setIsFilterTeacherDropdownOpen(false); // 🛑 نسد فلتر الأساتذة إذا انفتح هذا
    } else {
      setIsAssignTeacherDropdownOpen(false);
    }
  };

  const handleToggleAssignCourseDropdown = () => {
    if (!isAssignCourseDropdownOpen && assignCourseButtonRef.current) {
      setAssignCourseCoords(getPreciseDropdownPosition(assignCourseButtonRef.current, 280));
      setIsAssignCourseDropdownOpen(true);
      setIsAssignTeacherDropdownOpen(false);
      setIsFilterTeacherDropdownOpen(false); // 🛑 نسد فلتر الأساتذة إذا انفتح هذا
    } else {
      setIsAssignCourseDropdownOpen(false);
    }
  };

  // 🔄 دالة فتح وغلق قائمة فلتر الأساتذة بجدول التكليفات مع حساب الموضع الذكي
  const handleToggleFilterTeacherDropdown = () => {
    if (!isFilterTeacherDropdownOpen && filterTeacherButtonRef.current) { // 🔍 إذا القائمة مسدودة والزر موجود
      setFilterTeacherCoords(getPreciseDropdownPosition(filterTeacherButtonRef.current, 320)); // 📐 نحسب إحداثيات الشاشة بدون ما تطلع برة
      setIsFilterTeacherDropdownOpen(true); // 🔓 نفتح القائمة المنسدلة
      setIsAssignTeacherDropdownOpen(false); // 🔒 نسد أي منسدلة ثانية مفتوحة
      setIsAssignCourseDropdownOpen(false); // 🔒 نسد منسدلة المواد
    } else {
      setIsFilterTeacherDropdownOpen(false); // 🔒 نسد القائمة إذا جانت مفتوحة
    }
  };

  useEffect(() => {
    const handleClose = () => {
      if (isAssignTeacherDropdownOpen) setIsAssignTeacherDropdownOpen(false);
      if (isAssignCourseDropdownOpen) setIsAssignCourseDropdownOpen(false);
      if (isFilterTeacherDropdownOpen) setIsFilterTeacherDropdownOpen(false); // 🧹 نسد القائمة التفاعلية عند تغيير أبعاد الشاشة
    };
    if (isAssignTeacherDropdownOpen || isAssignCourseDropdownOpen || isFilterTeacherDropdownOpen) {
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('resize', handleClose);
    };
  }, [isAssignTeacherDropdownOpen, isAssignCourseDropdownOpen, isFilterTeacherDropdownOpen]);

  const [gradeSearch, setGradeSearch] = useState(''); // 🔍 بحث سجلات الدرجات
  const [filterGradeStage, setFilterGradeStage] = useState<number | 'all'>('all'); // 🏷️ تصفية مرحلة سجلات الدرجات
  const [filterGradeSemester, setFilterGradeSemester] = useState<number | 'all'>('all'); // 🏷️ تصفية كورس سجلات الدرجات
  const [filterGradeCourse, setFilterGradeCourse] = useState<string | 'all'>('all'); // 🏷️ تصفية مادة سجلات الدرجات المعينة
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]); // 🔘 معرفات سجلات الدرجات المحددة
  const [isGradeCourseDropdownOpen, setIsGradeCourseDropdownOpen] = useState(false); // 📦 حالة فتح القائمة المنسدلة المخصصة للمواد بالدرجات
  const gradeCourseDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع عنصر القائمة المنسدلة لإغلاقها عند النقر بالخارج

  // 🗓️ حقول وحالات إدارة الجدول الأسبوعي والمحاضرات
  const [selectedScheduleStage, setSelectedScheduleStage] = useState<number>(1); // 🎓 المرحلة الدراسية المحددة للجدول
  const [selectedScheduleSemester, setSelectedScheduleSemester] = useState<1 | 2>(1); // 📚 الكورس الدراسي المحدد للجدول
  const [selectedScheduleLectureIds, setSelectedScheduleLectureIds] = useState<string[]>([]); // 🔘 معرفات المحاضرات المحددة
  const [lecDay, setLecDay] = useState<DayOfWeek | ''>(''); // 🗓️ اليوم الأسبوعي يبدأ غير محدد حتى يختاره المستخدم باحترافية
  const [lecCourseId, setLecCourseId] = useState<string>(''); // 📖 معرف المادة الدراسية المختارة
  const [lecTeacherId, setLecTeacherId] = useState<string>(''); // 👤 معرف الأستاذ المحاضر
  const [lecRoom, setLecRoom] = useState<string>(''); // 🏛️ القاعة الدراسية أو المختبر
  const [lecStartTime, setLecStartTime] = useState<string>(''); // ⏱️ وقت بدء المحاضرة يبدأ غير محدد باحترافية
  const [lecEndTime, setLecEndTime] = useState<string>(''); // ⏱️ وقت انتهاء المحاضرة يبدأ غير محدد باحترافية
  const [lecColor, setLecColor] = useState<LectureColor>('blue'); // 🎨 لون شريط المحاضرة المعتمد
  const [lecType, setLecType] = useState<LectureType | ''>(''); // 🏷️ طبيعة المحاضرة تبدأ غير محددة حتى يحددها المستخدم
  const [lecDate, setLecDate] = useState<string>(''); // 📅 تاريخ المحاضرة التقويمي المرجعي للأسبوع الأول (YYYY-MM-DD)
  const [lecWeekNumber, setLecWeekNumber] = useState<number>(1); // 🔢 رقم الأسبوع الدراسي المعتمد (1 إلى 15) لمسار بولونيا
  const [lecAutoCascadeWeeks, setLecAutoCascadeWeeks] = useState<boolean>(true); // 🌟 تعاقب التواريخ التلقائي للأسابيع الـ 15 (+7 أيام لكل أسبوع)
  const [lecCascadeShiftOption, setLecCascadeShiftOption] = useState<'cascade_following' | 'this_week_only' | 'all_15_weeks'>('cascade_following'); // 🔄 خيار ترحيل تعديل اليوم والتواريخ لباقي الأسابيع اللاحقة
  const [originalLecDay, setOriginalLecDay] = useState<DayOfWeek | ''>(''); // 🗓️ اليوم الأصلي لتتبع أي تغيير بين الأيام
  const [pendingSemesterStartDate, setPendingSemesterStartDate] = useState<string | null>(null); // 📅 تاريخ الانطلاق الجديد المعلق بانتظار التأكيد
  const [showSemesterDateConfirmModal, setShowSemesterDateConfirmModal] = useState<boolean>(false); // 🛑 نافذة تأكيد تغيير تاريخ انطلاق الفصل
  const lecListContainerRef = useRef<HTMLDivElement | null>(null); // 📜 مرجع حاوية قائمة المحاضرات لعمل سكرول للأعلى تلقائياً
  const [lecStudyType, setLecStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 فترة المحاضرة (صباحي / مسائي)
  const [selectedScheduleStudyType, setSelectedScheduleStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 تبويب فترة الجدول (صباحي / مسائي)
  const [selectedScheduleWeek, setSelectedScheduleWeek] = useState<number>(1); // 🗓️ الأسبوع المختار للمعاينة بجدول القسم
  const [filterAttendanceWeek, setFilterAttendanceWeek] = useState<number | 'all'>('all'); // 🗓️ تصفية الحضور حسب الأسبوع (1 إلى 15 أو الكل)
  const [isAttendanceWeekDropdownOpen, setIsAttendanceWeekDropdownOpen] = useState<boolean>(false); // 🔽 قائمة أسابيع الحضور المخصصة
  const [filterAttendanceStage, setFilterAttendanceStage] = useState<number | 'all'>('all'); // 🎓 تصفية مرحلة الحضور
  const [filterAttendanceSemester, setFilterAttendanceSemester] = useState<1 | 2 | 'all'>('all'); // 🗓️ تصفية كورس الحضور
  const [filterAttendanceStudyType, setFilterAttendanceStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 تصفية الحضور حسب الفترة الدراسية
  const [filterAttendanceCourse, setFilterAttendanceCourse] = useState<string | 'all'>('all'); // 📘 تصفية مادة الحضور
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<AttendanceWarningStatus | 'all'>('all'); // ⚠️ تصفية حالة الإنذار
  const [attendanceSearch, setAttendanceSearch] = useState<string>(''); // 🔍 بحث الحضور بالاسم أو الرقم الجامعي
  const [isSyncingAttendance, setIsSyncingAttendance] = useState<boolean>(false); // 🔄 حالة المزامنة اللحظية مع السحابة
  const [selectedAttendanceStudentIds, setSelectedAttendanceStudentIds] = useState<string[]>([]); // 🔘 الطلبة المحددين في جدول الحضور
  const [isAttendanceNoticeModalOpen, setIsAttendanceNoticeModalOpen] = useState<boolean>(false); // 📢 حالة فتح نافذة التبليغ الذكي
  const [attendanceNoticeTargetStudent, setAttendanceNoticeTargetStudent] = useState<UserProfile | null>(null); // 👤 الطالب المستهدف للتبليغ الفردي
  const [attendanceNoticeDefaultCategory, setAttendanceNoticeDefaultCategory] = useState<AttendanceNoticeCategory>('warning_1'); // 🏷️ فئة التبليغ الافتراضية
  const [isAttendanceCourseDropdownOpen, setIsAttendanceCourseDropdownOpen] = useState<boolean>(false); // 🔽 قائمة مواد الحضور المخصصة
  const [isAttendanceStatusDropdownOpen, setIsAttendanceStatusDropdownOpen] = useState<boolean>(false); // 🔽 قائمة حالات الإنذار المخصصة
  const [lecNotes, setLecNotes] = useState<string>('');
  const [editingLectureId, setEditingLectureId] = useState<string | null>(null);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState<boolean>(false); // 🗓️ حالة فتح وغلق كارت الـ CRUD العائم للمحاضرات (z-999999)
  const [lecModalSuccessMsg, setLecModalSuccessMsg] = useState<string>(''); // ✨ رسالة النجاح التفاعلية الداخلية لكارت الجدول لمنع الخروج المفاجئ
  const [recentlyAddedLectureId, setRecentlyAddedLectureId] = useState<string | null>(null); // 🌟 تمييز المحاضرة المضافة حديثاً في القائمة اللحظية
  const [closeModalAfterSave, setCloseModalAfterSave] = useState<boolean>(false); // 🚪 تحديد هل يتم إغلاق الكارت أم البقاء للإدراج المتتالي
  const [lecCourseSearchTerm, setLecCourseSearchTerm] = useState<string>(''); // 🔍 نص البحث عن المادة في نافذة المحاضرة
  const [lecCourseTabFilter, setLecCourseTabFilter] = useState<'all' | 'theory' | 'practical'>('all'); // 📑 فلتر نوع المادة (الكل، نظري، عملي)
  const [lecTeacherSearchTerm, setLecTeacherSearchTerm] = useState<string>(''); // 🔍 نص البحث عن الأستاذ في نافذة المحاضرة
  const [isPreviewScheduleModalOpen, setIsPreviewScheduleModalOpen] = useState<boolean>(false);
  const lastScheduleScrollYRef = useRef<number>(0); // 📍 مرجع حفظ إحداثيات سكرول الصفحة بالمليمتر لمنع أي قفزات عند فتح وغلق كارت المحاضرات
  const [isSchedulePrintModalOpen, setIsSchedulePrintModalOpen] = useState<boolean>(false); // 🖨️ حالة فتح مودال طباعة جدول المحاضرات الأسبوعي المعتمد PDF مباشرة
  const [isMasterMatrixModalOpen, setIsMasterMatrixModalOpen] = useState<boolean>(false);
  const [showScheduleExcelInstructions, setShowScheduleExcelInstructions] = useState<boolean>(false); // ℹ️ نافذة تعليمات استيراد الجدول الأسبوعي
  const [isImportingScheduleExcel, setIsImportingScheduleExcel] = useState<boolean>(false); // ⏳ حالة جاري استيراد إكسل للجدول الأسبوعي
  const [scheduleImportReport, setScheduleImportReport] = useState<ImportSummaryReport | null>(null); // 📊 تقرير استيراد الجدول الأسبوعي
  const [scheduleActiveReportTab, setScheduleActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط في تقرير الجدول
  const [isDeptExcuseReviewOpen, setIsDeptExcuseReviewOpen] = useState<boolean>(false);
  const [isDurationSettingsModalOpen, setIsDurationSettingsModalOpen] = useState<boolean>(false); // ⚙️ نافذة إعدادات وتخصيص ساعات المحاضرات
  const [attendanceViewMode, setAttendanceViewMode] = useState<'list' | 'analytics'>('list');
  const [excuseRequests, setExcuseRequests] = useState<AttendanceExcuseRequest[]>([]);
  const [finalExamSchedules, setFinalExamSchedules] = useState<FinalExamSchedule[]>([]);
  const [finalExamSlots, setFinalExamSlots] = useState<FinalExamSlot[]>([]);
  const [campusAnnouncements, setCampusAnnouncements] = useState<CampusAnnouncement[]>([]); // 📢 حالة التعميمات الرسمية

  // 📄 حالات نظام الصفحات (Pagination) المتقدم لكافة التبويبات الرئيسية بالبوابة
  const [teacherPage, setTeacherPage] = useState<number>(1); // 👨‍🏫 رقم الصفحة الحالية لجدول الأساتذة
  const [teacherPageSize, setTeacherPageSize] = useState<number>(10); // 📏 عدد الأساتذة المعروضين في الصفحة

  const [studentPage, setStudentPage] = useState<number>(1); // 🎓 رقم الصفحة الحالية لجدول الطلبة
  const [studentPageSize, setStudentPageSize] = useState<number>(10); // 📏 عدد الطلبة المعروضين في الصفحة

  const [coursePage, setCoursePage] = useState<number>(1); // 📚 رقم الصفحة الحالية لجدول المواد والمقررات
  const [coursePageSize, setCoursePageSize] = useState<number>(10); // 📏 عدد المواد المعروضة في الصفحة

  const [assignmentPage, setAssignmentPage] = useState<number>(1); // 🔄 رقم الصفحة الحالية لجدول تكليفات الأساتذة
  const [assignmentPageSize, setAssignmentPageSize] = useState<number>(10); // 📏 عدد التكليفات المعروضة في الصفحة

  const [gradePage, setGradePage] = useState<number>(1); // 📊 رقم الصفحة الحالية لجدول الدرجات والسعي
  const [gradePageSize, setGradePageSize] = useState<number>(10); // 📏 عدد سجلات الدرجات في الصفحة

  const [attendancePage, setAttendancePage] = useState<number>(1); // 📋 رقم الصفحة الحالية لجدول الحضور والغيابات
  const [attendancePageSize, setAttendancePageSize] = useState<number>(10); // 📏 عدد طلبة الحضور في الصفحة

  // 🔄 تصفير الصفحات للبداية تلقائياً عند تغيير معايير البحث والتصفية لكل جدول
  useEffect(() => {
    setStudentPage(1); // 🔄 تصفير صفحة الطلاب
  }, [studentSearch, filterStudentStage, filterStudentStudyType]);

  useEffect(() => {
    setCoursePage(1); // 🔄 تصفير صفحة المواد
  }, [courseSearch, filterCourseStage, filterCourseSemester, filterCourseType]);

  useEffect(() => {
    setAssignmentPage(1); // 🔄 تصفير صفحة التكليفات
  }, [assignmentSearch, filterAssignmentTeacher, filterAssignmentStage, filterAssignmentSemester]);

  useEffect(() => {
    setGradePage(1); // 🔄 تصفير صفحة الدرجات
  }, [gradeSearch, filterGradeStage, filterGradeSemester, filterGradeCourse]);

  useEffect(() => {
    setAttendancePage(1); // 🔄 تصفير صفحة الحضور
  }, [attendanceSearch, filterAttendanceStage, filterAttendanceStudyType, filterAttendanceStatus, filterAttendanceCourse, filterAttendanceSemester, filterAttendanceWeek]);

  // 🔄 تحميل البيانات والتحقق من الصلاحيات
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user) {
      router.push('/admin');
      return;
    }

    // 🛡️ حصر الصلاحية برؤساء الأقسام والمقررين فقط
    const allowedRoles = ['department_head', 'rapporteur'];
    if (!allowedRoles.includes(user.role)) {
      router.push('/admin');
      return;
    }
    setCurrentUser(user);

    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    const loadedCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const loadedTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    const loadedGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
    const loadedLecs = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES);
    const loadedConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS);
    const loadedAttendance = getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);

    // 🔄 التوفيق والتزامن التلقائي اللحظي بين المواد وتكليفات الأساتذة (100% Two-Way Sync)
    const initialReconciled = reconcileCoursesWithTeacherCourses(
      loadedCourses,
      loadedTCs,
      loadedProfiles
    );
    if (initialReconciled.hasChanges) {
      saveStoredData('courses', initialReconciled.reconciledCourses);
      saveStoredData('teacher_courses', initialReconciled.reconciledTCs);
    }

    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);
    setCourses(initialReconciled.reconciledCourses);
    setTeacherCourses(initialReconciled.reconciledTCs);
    setGrades(loadedGrades);
    setScheduleConfigs(loadedConfigs);
    setAttendanceRecords(loadedAttendance);

    const loadedExcuses = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
    setExcuseRequests(loadedExcuses);

    const loadedExamSchedules = getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES);
    const loadedExamSlots = getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS);
    const loadedTuition = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);

    setFinalExamSchedules(loadedExamSchedules);
    setFinalExamSlots(loadedExamSlots);
    setTuitionRecords(loadedTuition);

    // 🏢 اختيار القسم النشط مع ضمان عدم بقائه فارغاً إطلاقاً
    const effectiveDeptId = user.department_id || (loadedDepts.length > 0 ? loadedDepts[0].id : 'dept-1');
    setCurrentDeptId(effectiveDeptId);

    // 🧹 دالة تنظيف واستشفاء ذاتي للمحاضرات: تصحيح الأوقات 00:xx وتصحيح التواريخ غير المطابقة وتوليد تواريخ الأسابيع الـ 15 كاملة
    const sanitizeLecs = (lecs: ScheduleLecture[]): ScheduleLecture[] => {
      const deptConfig = loadedConfigs.find((c) => c.department_id === effectiveDeptId);
      const baseStart = deptConfig?.start_date || '2026-09-20';
      return lecs.map((l) => {
        const cleanStart = l.start_time ? l.start_time.replace(/^00:/, '12:') : l.start_time;
        const cleanEnd = l.end_time ? l.end_time.replace(/^00:/, '12:') : l.end_time;
        const wk = l.week_number || 1;
        // 🗓️ احتساب التاريخ الحقيقي المطابق ليوم المحاضرة بدقة تامة
        const correctBaseDate = calculateDateForAnyDayInWeek(baseStart, 1, wk, l.day);
        
        // 📆 فحص خريطة الـ 15 أسبوعاً وإعادة توليدها إذا كانت مفقودة أو غير مكتملة أو كان تاريخ المحاضرة غير متوافق
        let customDates = l.custom_weekly_dates;
        const needsDatesRepair = !customDates || Object.keys(customDates).length < 15 || l.date !== correctBaseDate;
        if (needsDatesRepair && correctBaseDate) {
          const generated15 = generateAll15WeeksDates(correctBaseDate, l.day, wk);
          const map15: Record<number, string> = {};
          generated15.forEach((item) => {
            map15[item.weekNumber] = item.date;
          });
          customDates = map15;
        }

        return {
          ...l,
          start_time: cleanStart,
          end_time: cleanEnd,
          date: correctBaseDate || l.date,
          custom_weekly_dates: customDates,
        };
      });
    };

    // 🗓️ تعيين جدول المحاضرات النظيف والمزامنة الحية المباشرة مع التخزين المحلي و Supabase
    const cleanLoaded = sanitizeLecs(loadedLecs);
    setScheduleLectures(cleanLoaded);
    saveStoredData('schedule_lectures', cleanLoaded); // 💾 استشفاء وحفظ محلي فوري

    syncScheduleLecturesFromSupabase()
      .then((cloudLecs) => {
        if (cloudLecs && cloudLecs.length > 0) {
          const cleanCloud = sanitizeLecs(cloudLecs);
          setScheduleLectures(cleanCloud);
          saveStoredData('schedule_lectures', cleanCloud); // 💾 استشفاء وتحديث محلي للبيانات السحابية
        }
      })
      .catch((err) => {
        console.warn('تنبيه أثناء مزامنة المحاضرات من Supabase:', err);
      });

    // 🎲 إذا كانت سجلات الدرجات فارغة تماماً لقسم المستخدم، نقوم بتوليد وتغذية درجات نموذجية أولية فوراً
    const targetDeptId = user.department_id || loadedDepts[0]?.id || 'dept-8';
    const targetDept = loadedDepts.find((d) => d.id === targetDeptId) || loadedDepts[0];
    const deptExistingGrades = loadedGrades.filter((g) => {
      const c = loadedCourses.find((crs) => crs.id === g.course_id);
      return c?.department_id === targetDeptId || g.department_id === targetDeptId;
    });

    // 🧹 تم إلغاء أي حقن تلقائي للدرجات أو الطلاب الوهميين لضمان بقاء بوابة القسم نظيفة 100%

    // ⚡ مزامنة حية خلفية مع قاعدة بيانات Supabase الرسمية بدون تجميد الواجهة
    syncFullDepartmentPortalData()
      .then((cloudData) => {
        const liveProfiles: UserProfile[] = (cloudData.profiles && cloudData.profiles.length > 0) ? cloudData.profiles : loadedProfiles;
        if (cloudData.profiles && cloudData.profiles.length > 0) setProfiles(cloudData.profiles);

        const rawCloudCourses: Course[] = (cloudData.courses && cloudData.courses.length > 0) ? cloudData.courses : loadedCourses;
        const rawCloudTCs: TeacherCourse[] = (cloudData.teacherCourses && cloudData.teacherCourses.length > 0) ? cloudData.teacherCourses : loadedTCs;

        // 🔄 التوفيق والتزامن بين المواد والتكليفات القادمة من السحابة لضمان ثبات كافة الأساتذة
        const cloudReconciled = reconcileCoursesWithTeacherCourses(
          rawCloudCourses,
          rawCloudTCs,
          liveProfiles
        );
        setCourses(cloudReconciled.reconciledCourses);
        setTeacherCourses(cloudReconciled.reconciledTCs);
        if (cloudReconciled.hasChanges) {
          saveStoredData('courses', cloudReconciled.reconciledCourses);
          saveStoredData('teacher_courses', cloudReconciled.reconciledTCs);
        }

        if (cloudData.grades && cloudData.grades.length > 0) setGrades(cloudData.grades);
        if (cloudData.scheduleLectures && cloudData.scheduleLectures.length > 0) setScheduleLectures(cloudData.scheduleLectures);
        if (cloudData.scheduleConfigs && cloudData.scheduleConfigs.length > 0) setScheduleConfigs(cloudData.scheduleConfigs);
        if (cloudData.attendanceRecords && cloudData.attendanceRecords.length > 0) setAttendanceRecords(cloudData.attendanceRecords);
        if (cloudData.tuitionRecords && cloudData.tuitionRecords.length > 0) setTuitionRecords(cloudData.tuitionRecords);
        if (cloudData.academicYear) setAcademicYear(cloudData.academicYear);
      })
      .catch((err) => {
        console.warn('تنبيه: استمرار العمل على الكاش المحلي لتعذر الاتصال بالسحابة مؤقتاً:', err);
      });


    // 📡 الاستماع للتحديثات اللحظية المباشرة للأقساط بين كافة التبويبات والمستخدمين
    const handleTuitionSync = () => {
      const latest = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);
      setTuitionRecords(latest);
    };

    // 📡 الاستماع للتحديثات اللحظية للمواد وتكليفات الأساتذة لإعادة التوفيق اللحظي
    const handleCoursesOrAssignmentsSync = () => {
      const curCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const curTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const curProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rec = reconcileCoursesWithTeacherCourses(curCourses, curTCs, curProfiles);
      setCourses(rec.reconciledCourses);
      setTeacherCourses(rec.reconciledTCs);
      if (rec.hasChanges) {
        saveStoredData('courses', rec.reconciledCourses);
        saveStoredData('teacher_courses', rec.reconciledTCs);
      }
    };

    // 🗓️ الاستماع المباشر السحابي والمحلي لتغيير العام الدراسي من المسؤول العام
    const unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
      setAcademicYear(liveYear);
    });

    window.addEventListener('tuition_records_updated', handleTuitionSync);
    window.addEventListener('courses_updated', handleCoursesOrAssignmentsSync);
    window.addEventListener('teacher_courses_updated', handleCoursesOrAssignmentsSync);
    window.addEventListener('storage', handleTuitionSync);
    window.addEventListener('storage', handleCoursesOrAssignmentsSync);

    return () => {
      window.removeEventListener('tuition_records_updated', handleTuitionSync);
      window.removeEventListener('courses_updated', handleCoursesOrAssignmentsSync);
      window.removeEventListener('teacher_courses_updated', handleCoursesOrAssignmentsSync);
      window.removeEventListener('storage', handleTuitionSync);
      window.removeEventListener('storage', handleCoursesOrAssignmentsSync);
      unsubscribeYear();
    };
  }, [router]);

  // 🏢 معلومات القسم المدار حالياً
  const currentDepartment = departments.find((d) => d.id === currentDeptId) || departments[0];
  const deptName = currentDepartment?.name || 'القسم الأكاديمي';

  // 🌐 1. مزامنة التبويب النشط مع الرابط (URL Search Params) عند التحميل والتنقل بالمتصفح
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as DepartmentAdminTab | null;
      if (tabParam && VALID_ADMIN_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    syncTabFromUrl();

    // 🔄 الاستماع لأزرار التنقل بالمتصفح (Back / Forward)
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, []);

  // 🏷️ 2. تحديث اسم نافذة المتصفح ديناميكياً بحسب التبويب المختار واسم القسم
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tabName = ADMIN_TAB_TITLES[activeTab] || 'لوحة إدارة القسم';
    const activeDeptTitle = currentDepartment?.name || deptName || 'القسم الأكاديمي';
    document.title = `${tabName} | قسم ${activeDeptTitle} — جامعة الإمام جعفر الصادق (ع)`;
  }, [activeTab, currentDepartment, deptName]);

  // 🔀 3. دالة التبديل بين التبويبات مع تحديث الرابط URL في المتصفح فورياً بدون إعادة تحميل
  const handleTabSwitch = (newTab: DepartmentAdminTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({ tab: newTab }, '', url.toString());
    }
    // 🔄 مزامنة وتوفيق فوري 100% عند التبديل لتبويب المواد أو التكليفات لضمان انعكاس التغييرات فورياً
    if (newTab === 'courses' || newTab === 'assignments') {
      const curCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const curTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const curProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rec = reconcileCoursesWithTeacherCourses(curCourses, curTCs, curProfiles);
      setCourses(rec.reconciledCourses);
      setTeacherCourses(rec.reconciledTCs);
      if (rec.hasChanges) {
        saveStoredData('courses', rec.reconciledCourses);
        saveStoredData('teacher_courses', rec.reconciledTCs);
      }
    }
  };

  // 🚪 إغلاق القائمة المنسدلة لمواد الدرجات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gradeCourseDropdownRef.current &&
        !gradeCourseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGradeCourseDropdownOpen(false);
      }
    };
    if (isGradeCourseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGradeCourseDropdownOpen]);

  // 🔍 استخراج رئيس ومقرر القسم الحالي
  const currentHead = profiles.find((p) => p.role === 'department_head' && p.department_id === currentDeptId) || 
                      (currentDepartment?.head_name ? { full_name: currentDepartment.head_name, generated_email: currentDepartment.head_email } : null);
  const currentRap = profiles.find((p) => p.role === 'rapporteur' && p.department_id === currentDeptId) ||
                     (currentDepartment?.rapporteur_name ? { full_name: currentDepartment.rapporteur_name, generated_email: currentDepartment.rapporteur_email } : null);

  // 🔍 تصفية أساتذة القسم مع احترام فهرس الترتيب
  const deptTeachers = useMemo(() => {
    return profiles
      .filter((p) => p.role === 'teacher' && p.department_id === currentDeptId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [profiles, currentDeptId]);

  // 🔀 دالة تغيير ترتيب الأستاذ يدوياً في كادر القسم (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveTeacher = (currentIndex: number, direction: 'up' | 'down', currentList: UserProfile[], e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const listCopy = [...currentList];
    const itemToMove = listCopy[currentIndex];
    listCopy[currentIndex] = listCopy[targetIndex];
    listCopy[targetIndex] = itemToMove;

    const targetIds = new Set(listCopy.map((p) => p.id));
    const otherProfiles = profiles.filter((p) => !targetIds.has(p.id));
    const reindexedList = listCopy.map((p, idx) => ({ ...p, order_index: idx }));
    const combined = [...reindexedList, ...otherProfiles];

    setProfiles(combined);
    saveStoredData('profiles', combined);
  };

  // 🔍 تصفية طلاب القسم بحسب البحث والمرحلة والفترة الدراسية
  const deptStudents = profiles.filter((p) => p.role === 'student' && (p.department_id === currentDeptId || p.department_name === deptName));
  const filteredStudents = deptStudents.filter((s) => {
    const term = studentSearch.toLowerCase();
    const matchesSearch = 
      s.full_name.toLowerCase().includes(term) ||
      s.university_number.toLowerCase().includes(term) ||
      s.generated_email.toLowerCase().includes(term);
    const matchesStage = filterStudentStage === 'all' || (s.stage_number || 1) === filterStudentStage;
    const matchesStudyType = filterStudentStudyType === 'all' || (s.study_type || 'morning') === filterStudentStudyType;
    return matchesSearch && matchesStage && matchesStudyType;
  });

  // 🔍 تصفية مواد القسم بحسب البحث والمرحلة والكورس والنوع
  const deptCourses = courses.filter((c) => c.department_id === currentDeptId || c.department_name === deptName);
  const filteredCourses = deptCourses.filter((c) => {
    const term = courseSearch.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      (c.theory_teacher_name && c.theory_teacher_name.toLowerCase().includes(term)) ||
      (c.practical_teacher_name && c.practical_teacher_name.toLowerCase().includes(term));
    const matchesStage = filterCourseStage === 'all' || (c.stage_number || 1) === filterCourseStage;
    const matchesSemester = filterCourseSemester === 'all' || (c.semester || 1) === filterCourseSemester;
    const isPractical = c.course_type === 'theory_and_practical' || c.has_practical;
    const matchesType = 
      filterCourseType === 'all' || 
      (filterCourseType === 'theory_and_practical' && isPractical) ||
      (filterCourseType === 'theory_only' && !isPractical);
    return matchesSearch && matchesStage && matchesSemester && matchesType;
  });

  // 🎯 نطلع المواد المستهدفة حسب المرحلة والكورس المحددين بالتبويبات
  const targetRoundCourses = useMemo(() => { // 🧠 حفظ النتيجة بالذاكرة علمود الأداء ميصير ثقيل
    return deptCourses.filter((c) => { // 🔍 نسوي فلترة لمواد القسم فقط
      const matchesStage = filterCourseStage === 'all' || (Number(c.stage_number) || 1) === Number(filterCourseStage); // 🏷️ نتأكد من مطابقة رقم المرحلة
      const matchesSemester = filterCourseSemester === 'all' || (Number(c.semester) || 1) === Number(filterCourseSemester); // 📅 نتأكد من مطابقة رقم الكورس
      return matchesStage && matchesSemester; // ✅ نرجع المواد الي طابقت المرحلة والكورس
    }); // 🔚 نهاية الفلترة الذكية
  }, [deptCourses, filterCourseStage, filterCourseSemester]); // 🔄 يتحدث بس من تتغير المواد أو الفلاتر

  // 🎯 تحديد المواد النشطة المستهدفة للتحكم الجماعي: إما المواد المحددة يدوياً بالـ Checkbox أو المواد المفلترة
  const activeTargetRoundCourses = useMemo(() => { // 🧠 نحفظ القائمة بالذاكرة للأداء السريع
    if (selectedCourseIds.length > 0) { // 🔍 إذا المستخدم محدد مواد بالـ Checkbox
      return deptCourses.filter((c) => selectedCourseIds.includes(c.id)); // ✅ نرجع المواد المحددة فقط
    } // 🔚 نهاية فحص التحديد اليدوي
    return targetRoundCourses; // 📋 نرجع المواد المفلترة بالمرحلة والكورس إذا ماكو تحديد يدوي
  }, [selectedCourseIds, deptCourses, targetRoundCourses]); // 🔄 يتحدث لحظياً مع التحديد أو الفلاتر

  // 🔢 معرفات مواد الكورس الأول ومواد الكورس الثاني للقسم لتسهيل التحديد السريع
  const deptSem1CourseIds = useMemo(() => { // 🧠 استخراج معرفات مواد الكورس الأول
    return deptCourses.filter((c) => (Number(c.semester) || 1) === 1).map((c) => c.id); // 📅 فلترة الكورس الأول
  }, [deptCourses]); // 🔄 إعادة حساب عند تحديث المواد

  const deptSem2CourseIds = useMemo(() => { // 🧠 استخراج معرفات مواد الكورس الثاني
    return deptCourses.filter((c) => (Number(c.semester) || 1) === 2).map((c) => c.id); // 📅 فلترة الكورس الثاني
  }, [deptCourses]); // 🔄 إعادة حساب عند تحديث المواد

  // 🔒 نحسب جم مادة مفتوح بيها الامتحان النهائي للدور الأول في النطاق النشط
  const finalOpenCount = activeTargetRoundCourses.filter((c) => c.is_final_exam_enabled === true).length; // 🔢 عدد المواد المفتوحة بالدور الأول
  // 🌟 هل كل المواد في النطاق النشط مفتوح بيها الدور الأول؟
  const isBulkFinalOpen = activeTargetRoundCourses.length > 0 && finalOpenCount === activeTargetRoundCourses.length; // ✅ صح إذا كلهن مفتوحات 100%
  // ⚠️ هل اكو فتح جزئي للدور الأول؟
  const isBulkFinalPartial = finalOpenCount > 0 && finalOpenCount < activeTargetRoundCourses.length; // ⚖️ صح إذا جزء مفتوح وجزء مغلق

  // 🔒 نحسب جم مادة مفتوح بيها رصد درجات الدور الثاني في النطاق النشط
  const supOpenCount = activeTargetRoundCourses.filter((c) => c.is_supplementary_exam_enabled === true).length; // 🔢 عدد المواد المفتوحة بالدور الثاني
  // 🌟 هل كل المواد في النطاق النشط مفتوح بيها الدور الثاني؟
  const isBulkSupOpen = activeTargetRoundCourses.length > 0 && supOpenCount === activeTargetRoundCourses.length; // ✅ صح إذا كلهن مفتوحات بالدور الثاني
  // ⚠️ هل اكو فتح جزئي للدور الثاني؟
  const isBulkSupPartial = supOpenCount > 0 && supOpenCount < activeTargetRoundCourses.length; // ⚖️ صح إذا التفعيل صاير لبعض المواد بس

  // 🔍 تصفية تكليفات القسم بحسب البحث والأستاذ والمرحلة والكورس
  const deptTeacherCourses = teacherCourses.filter((tc) => {
    const course = courses.find((c) => c.id === tc.course_id);
    return course?.department_id === currentDeptId || tc.department_id === currentDeptId;
  });
  const filteredTeacherCourses = deptTeacherCourses.filter((tc) => {
    const term = assignmentSearch.toLowerCase();
    const matchesSearch = 
      (tc.teacher_name && tc.teacher_name.toLowerCase().includes(term)) ||
      (tc.course_name && tc.course_name.toLowerCase().includes(term));
    const matchesTeacher = filterAssignmentTeacher === 'all' || tc.teacher_id === filterAssignmentTeacher;
    const course = courses.find((c) => c.id === tc.course_id);
    const matchesStage = filterAssignmentStage === 'all' || (course?.stage_number || 1) === filterAssignmentStage;
    const matchesSemester = filterAssignmentSemester === 'all' || (tc.semester || course?.semester || 1) === filterAssignmentSemester;
    const matchesRole = filterAssignmentRole === 'all' || (tc.role_in_course || 'theory') === filterAssignmentRole;
    return matchesSearch && matchesTeacher && matchesStage && matchesSemester && matchesRole;
  });

  // 🔍 تصفية درجات القسم بحسب البحث والمرحلة
  const deptGrades = grades.filter((g) => {
    const course = courses.find((c) => c.id === g.course_id);
    return course?.department_id === currentDeptId || g.department_id === currentDeptId;
  });

  const filteredGrades = deptGrades.filter((g) => {
    const term = gradeSearch.toLowerCase();
    const matchesSearch = 
      g.student_name.toLowerCase().includes(term) ||
      g.course_name.toLowerCase().includes(term) ||
      (g.university_number && g.university_number.toLowerCase().includes(term));
    const course = courses.find((c) => c.id === g.course_id);
    const stage = course?.stage_number || 1;
    const matchesStage = filterGradeStage === 'all' || stage === filterGradeStage;
    const matchesSemester = filterGradeSemester === 'all' || (g.semester || course?.semester || 1) === filterGradeSemester;
    const matchesCourse = filterGradeCourse === 'all' || g.course_id === filterGradeCourse;
    return matchesSearch && matchesStage && matchesSemester && matchesCourse;
  });

  // 🧮 المخطط التقييمي النشط للمادة المحددة أو المادة الحالية للاشتقاق الديناميكي للعناوين والأوزان
  const activeCourseForScheme = filterGradeCourse !== 'all'
    ? courses.find((c) => c.id === filterGradeCourse)
    : (filteredGrades.length > 0 ? courses.find((c) => c.id === filteredGrades[0]?.course_id) : null);
  const currentActiveScheme = getCourseAssessmentScheme(activeCourseForScheme);

  // 📚 قائمة المواد القابلة للاختيار في تبويب الدرجات بحسب المرحلة المحددة
  const gradeSelectableCourses = deptCourses.filter((c) => {
    if (filterGradeStage === 'all') return true;
    return (c.stage_number || 1) === filterGradeStage;
  });

  // 🎓 دالة تبديل تصفية المرحلة مع مزامنة قائمة المواد تلقائياً
  const handleSelectGradeStage = (stage: number | 'all') => {
    setFilterGradeStage(stage);
    if (stage !== 'all') {
      const isCurrentCourseInNewStage = deptCourses.some(
        (c) => c.id === filterGradeCourse && (c.stage_number || 1) === stage
      );
      if (!isCurrentCourseInNewStage) {
        setFilterGradeCourse('all');
      }
    }
  };

  // 🧹 تم إلغاء توليد الطلاب الوهميين نهائياً - النظام نظيف ويعتمد حصراً على الطلاب الحقيقيين المدخلين عبر الإدارة أو الإكسل

  // 🛡️ حساب التضارب الزمني اللحظي للقاعات والأساتذة أثناء إدخال المحاضرة
  const selectedLecTeacher = profiles.find((p) => p.id === lecTeacherId); // 👤 جلب بيانات الأستاذ المحدد حالياً
  const currentLecConflicts = useMemo(() => {
    if (!lecStartTime || !lecEndTime || !lecDay || (!lecRoom.trim() && !lecTeacherId)) return []; // 🛑 إذا الوقت أو اليوم مو محددين ما نفحص التضارب
    return checkLectureCollisions(
      {
        day: lecDay as DayOfWeek, // 🗓️ اليوم الأسبوعي المؤكد بعد التحقق من عدم فراغه
        start_time: lecStartTime, // ⏱️ وقت بدء المحاضرة
        end_time: lecEndTime, // ⏱️ وقت انتهاء المحاضرة
        room: lecRoom.trim(), // 🏛️ القاعة الدراسية
        teacher_id: lecTeacherId, // 👤 معرف الأستاذ
        teacher_name: selectedLecTeacher?.full_name, // 👨‍🏫 اسم الأستاذ
        stage_number: selectedScheduleStage, // 🎓 رقم المرحلة
        department_id: currentDeptId, // 🏢 معرف القسم
      },
      scheduleLectures, // 📚 قائمة المحاضرات المسجلة
      editingLectureId || undefined // ✏️ استثناء المحاضرة قيد التعديل من التضارب مع نفسها
    );
  }, [lecDay, lecStartTime, lecEndTime, lecRoom, lecTeacherId, selectedLecTeacher, selectedScheduleStage, currentDeptId, scheduleLectures, editingLectureId]);

  // 💡 حساب القاعات والمختبرات الشاغرة غير المحجوزة في الوقت المحدد
  const availableRoomsForSlot = useMemo(() => {
    if (!lecStartTime || !lecEndTime || !lecDay) return UNIVERSITY_ROOMS_CATALOG; // 🏛️ إذا ما حدد وقت أو يوم نعرض كل القاعات شاغرة
    return getAvailableRoomsForSlot(lecDay as DayOfWeek, lecStartTime, lecEndTime, scheduleLectures, editingLectureId || undefined); // 🔍 جلب القاعات الشاغرة لهذا التوقيت
  }, [lecDay, lecStartTime, lecEndTime, scheduleLectures, editingLectureId]);


  // ==========================================
  // 1️⃣ إدارة الأساتذة (Teachers CRUD & Excel)
  // ==========================================
  
  // ⚡ توليد بريد ورمز معقد تلقائياً للأستاذ
  const handleAutoGenerateCredentials = () => {
    const genEmail = generateStrongUniqueEmail('dr', profiles);
    const genPass = generateStrongPassword();
    setCustomTeacherEmail(genEmail);
    setCustomTeacherPassword(genPass);
  };

  // 📥 تنزيل نموذج Excel معتمد لأساتذة القسم مع التعليمات
  const handleDownloadTeacherTemplate = async () => {
    await downloadDepartmentTeachersTemplate(deptName);
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لأساتذة قسم (${deptName}) بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📤 استيراد ومعالجة ملف Excel لأساتذة القسم
  const handleTeacherExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDeptId) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newProfilesToAdd: UserProfile[] = [];
      let tempAllProfiles = [...profiles];

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rawName = String(row['name'] || row['اسم الأستاذ واللقب الأكاديمي'] || row['الاسم'] || row['الاسم الكامل'] || '').trim();
        const rawGender = String(row['gender'] || row['الجنس'] || '').trim();
        const rawEmail = String(row['email'] || row['البريد الأكاديمي'] || '').trim();
        const rawPass = String(row['pass'] || row['كلمة المرور'] || '').trim();

        if (!rawName || rawName.length < 3) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم فارغ',
            reason: 'حقل الاسم فارغ أو غير مكتمل',
          });
          return;
        }

        // فحص التكرار بالاسم في نفس القسم
        const isNameDuplicate = tempAllProfiles.some(
          (p) => p.department_id === currentDeptId && p.role === 'teacher' && p.full_name.trim().toLowerCase() === rawName.toLowerCase()
        );

        if (isNameDuplicate) {
          duplicates.push({
            name: rawName,
            email: rawEmail || '—',
            dept: deptName,
            reason: 'الأستاذ مسجل مسبقاً في هذا القسم',
          });
          return;
        }

        // معالجة البريد الأكاديمي
        let finalEmail = '';
        if (rawEmail) {
          finalEmail = rawEmail.includes('@') ? rawEmail.toLowerCase() : `${rawEmail.toLowerCase()}@sadiq.edu.iq`;
          if (tempAllProfiles.some((p) => p.generated_email.toLowerCase() === finalEmail)) {
            finalEmail = generateStrongUniqueEmail('dr', tempAllProfiles);
          }
        } else {
          finalEmail = generateStrongUniqueEmail('dr', tempAllProfiles);
        }

        const finalPass = rawPass || generateStrongPassword();
        const detectedGender = (rawGender === 'أنثى' || rawGender === 'female')
          ? 'female'
          : (rawGender === 'ذكر' || rawGender === 'male')
            ? 'male'
            : detectArabicGender(rawName);

        const randomNum = Math.floor(1000 + Math.random() * 9000);

        const newTch: UserProfile = {
          id: `usr-tch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          full_name: rawName,
          role: 'teacher',
          department_id: currentDeptId,
          department_name: deptName,
          university_number: `TCH-${randomNum}`,
          generated_email: finalEmail,
          temp_password: finalPass,
          gender: detectedGender as 'male' | 'female',
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: tempAllProfiles.length + 1,
        };

        newProfilesToAdd.push(newTch);
        tempAllProfiles.push(newTch);
        accepted.push({
          name: rawName,
          dept: deptName,
          email: finalEmail,
        });
      });

      if (newProfilesToAdd.length > 0) {
        const updated = [...newProfilesToAdd, ...profiles];
        setProfiles(updated);
        saveStoredData('profiles', updated);
        // ☁️ رفع ومزامنة كافة التدريسيين المستوردين من ملف Excel في جدول teachers بسحابة Supabase فوراً
        newProfilesToAdd.forEach((teacher) => {
          saveProfileToSupabase(teacher);
        });
      }

      setImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setActiveReportTab('accepted');

      setSuccessMessage(`تمت معالجة الملف وإضافة ${accepted.length} أستاذ بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من مطابقة الملف المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !currentDeptId) {
      setNameError('يرجى إدخال اسم الأستاذ واللقب الأكاديمي');
      return;
    }

    if (!teacherGender) {
      setErrorMessage('يرجى تحديد جنس الأستاذ (ذكر أو أنثى)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (customTeacherPassword && customTeacherPassword.length < 8) {
      setErrorMessage('كلمة المرور المخصصة يجب أن لا تقل عن 8 خانات');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (editingTeacherId) {
      const candidateEmail = customTeacherEmail.trim()
        ? (customTeacherEmail.includes('@') ? customTeacherEmail.trim().toLowerCase() : `${customTeacherEmail.trim().toLowerCase()}@sadiq.edu.iq`)
        : '';
      
      if (candidateEmail) {
        // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ عند التعديل
        const emailCheck = checkEmailUniquenessAcrossSystem(candidateEmail, editingTeacherId, profiles);
        if (!emailCheck.isUnique) {
          setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى اختيار بريد بديل.');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }

      let editedTeacherObj: UserProfile | null = null;
      const updated = profiles.map((p) => {
        if (p.id === editingTeacherId) {
          const finalEmail = candidateEmail || p.generated_email;
          const finalPassword = customTeacherPassword.trim() || p.temp_password;

          const updatedTeacher: UserProfile = { 
            ...p, 
            full_name: teacherName.trim(), 
            gender: teacherGender,
            generated_email: finalEmail,
            temp_password: finalPassword
          };
          editedTeacherObj = updatedTeacher;
          return updatedTeacher;
        }
        return p;
      });
      setProfiles(updated);
      saveStoredData('profiles', updated);
      if (editedTeacherObj) {
        saveProfileToSupabase(editedTeacherObj); // ☁️ مزامنة فورية مع جدول teachers في Supabase
      }
      setEditingTeacherId(null);
      setSuccessMessage('تم تعديل بيانات الأستاذ بنجاح ومزامنتها سحابياً!');
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      let finalEmail = '';
      if (customTeacherEmail.trim()) {
        finalEmail = customTeacherEmail.includes('@') 
          ? customTeacherEmail.trim().toLowerCase() 
          : `${customTeacherEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail('dr', profiles);
      }

      // 🛡️ فحص فرادة البريد الأكاديمي للأستاذ قبل الإضافة لمنع التكرار
      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles);
      if (!emailCheck.isUnique) {
        setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى كتابة بريد آخر.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      const finalPassword = customTeacherPassword.trim() || generateStrongPassword();

      const newTeacher: UserProfile = {
        id: `usr-tch-${Date.now()}`,
        full_name: teacherName.trim(),
        role: 'teacher',
        department_id: currentDeptId,
        department_name: deptName,
        university_number: `TCH-${randomNum}`,
        generated_email: finalEmail,
        temp_password: finalPassword,
        gender: teacherGender,
        is_active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newTeacher, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))];
      setProfiles(updated);
      saveStoredData('profiles', updated);
      saveProfileToSupabase(newTeacher); // ☁️ مزامنة فورية مع جدول teachers في Supabase
      setSelectedCardProfile(newTeacher);
      setSuccessMessage('تمت إضافة الأستاذ وتوليد حسابه الأكاديمي وتوثيقه سحابياً بنجاح!');
    }

    setTeacherName('');
    setCustomTeacherEmail('');
    setCustomTeacherPassword('');
    setTeacherGender(null); // 🔄 تصفير جنس الأستاذ ليكون غير محدد
    setNameError('');
    setEditingTeacherId(null);
    setIsTeacherModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleDeleteTeacher = (id: string) => {
    const targetTeacher = profiles.find((p) => p.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف الأستاذ الأكاديمي',
      itemName: targetTeacher?.full_name || 'أستاذ',
      itemDetails: `البريد الأكاديمي: ${targetTeacher?.generated_email || '—'} | قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من حذف هذا الأستاذ؟ سيتم إلغاء كافة تكليفاته بالمواد الدراسية فوراً ولا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'تأكيد الحذف',
      onConfirm: () => {
        const updatedProfiles = profiles.filter((p: UserProfile): boolean => p.id !== id);
        setProfiles(updatedProfiles);
        saveStoredData('profiles', updatedProfiles);
        deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف فوري من جدول teachers في Supabase

        // 🔗 حذف تكليفات الأستاذ سحابياً ومحلياً
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => tc.teacher_id === id);
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليف سحابياً
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.teacher_id !== id);
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        // 🔄 تصفير الأستاذ من المواد التي كان مكلفاً بها
        const updatedCourses = courses.map((c: Course): Course => {
          let isChanged = false;
          const newC = { ...c };
          if (newC.theory_teacher_id === id) {
            newC.theory_teacher_id = undefined;
            newC.theory_teacher_name = undefined;
            isChanged = true;
          }
          if (newC.practical_teacher_id === id) {
            newC.practical_teacher_id = undefined;
            newC.practical_teacher_name = undefined;
            isChanged = true;
          }
          if (isChanged) {
            saveCourseToSupabase(newC); // ☁️ مزامنة سحابية للمادة بعد تفريغ التكليف
          }
          return newC;
        });
        setCourses(updatedCourses);
        saveStoredData('courses', updatedCourses);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSuccessMessage('تم حذف الأستاذ وإلغاء تكليفاته بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleResetTeacherPassword = (id: string) => {
    const newPass = generateStrongPassword();
    const updated = profiles.map((p) => {
      if (p.id === id) {
        const u = { ...p, temp_password: newPass };
        setSelectedCardProfile(u);
        return u;
      }
      return p;
    });
    setProfiles(updated);
    saveStoredData('profiles', updated);
    setSuccessMessage('تم توليد كلمة مرور جديدة للأستاذ!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لأساتذة القسم
  const toggleSelectAllTeachers = () => {
    if (selectedTeacherIds.length === deptTeachers.length) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(deptTeachers.map((t) => t.id));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteTeachers = () => {
    const count = selectedTeacherIds.length;
    if (count === 0) return;

    setDeleteModalConfig({
      isOpen: true,
      title: `تأكيد الحذف الجماعي لـ (${count}) أساتذة`,
      itemName: `${count} من أساتذة قسم ${deptName}`,
      itemDetails: `سيتم حذف حسابات الأساتذة المحددين وإلغاء تكليفاتهم بالمواد في القسم.`,
      warningMessage: `⚠️ تنبيه أمني: هل أنت متأكد من حذف (${count}) من كادر التدريسيين دفعة واحدة؟ لا يمكن التراجع عن هذه الخطوة.`,
      confirmText: `حذف (${count}) أساتذة نهائياً`,
      onConfirm: () => {
        selectedTeacherIds.forEach((id: string) => {
          deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف الأساتذة سحابياً
        });

        // 🔗 حذف تكليفات كافة الأساتذة المحددين سحابياً ومحلياً
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => selectedTeacherIds.includes(tc.teacher_id));
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليفات سحابياً
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedTeacherIds.includes(tc.teacher_id));
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        const updatedProfiles = profiles.filter((p: UserProfile): boolean => !selectedTeacherIds.includes(p.id));
        setProfiles(updatedProfiles);
        saveStoredData('profiles', updatedProfiles);

        // 🔄 تفريغ الأساتذة المحددين من المواد المرتبطة بهم
        const updatedCourses = courses.map((c: Course): Course => {
          let isChanged = false;
          const newC = { ...c };
          if (newC.theory_teacher_id && selectedTeacherIds.includes(newC.theory_teacher_id)) {
            newC.theory_teacher_id = undefined;
            newC.theory_teacher_name = undefined;
            isChanged = true;
          }
          if (newC.practical_teacher_id && selectedTeacherIds.includes(newC.practical_teacher_id)) {
            newC.practical_teacher_id = undefined;
            newC.practical_teacher_name = undefined;
            isChanged = true;
          }
          if (isChanged) {
            saveCourseToSupabase(newC); // ☁️ مزامنة سحابية للمادة بعد تفريغ التكليف
          }
          return newC;
        });
        setCourses(updatedCourses);
        saveStoredData('courses', updatedCourses);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedTeacherIds([]);
        setSuccessMessage(`تم حذف (${count}) من أساتذة القسم بنجاح وتفريغ تكليفاتهم.`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkExportTeachersExcel = async () => {
    const selectedTeachersList = deptTeachers.filter((t) => selectedTeacherIds.includes(t.id));
    if (selectedTeachersList.length === 0) return;

    await exportCustomTeachersList(selectedTeachersList, deptName);
    setSuccessMessage(`تم تصدير (${selectedTeachersList.length}) أستاذ إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };


  // ==========================================
  // 2️⃣ إدارة الطلاب (Students CRUD & Excel)
  // ==========================================

  // ⚡ توليد بريد ورمز معقد تلقائياً للطالب
  const handleAutoGenerateStudentCredentials = () => {
    const genEmail = generateStrongUniqueEmail('st', profiles);
    const genPass = generateStrongPassword();
    setCustomStudentEmail(genEmail);
    setCustomStudentPassword(genPass);
  };

  // 📥 تنزيل نموذج Excel معتمد لطلبة القسم
  const handleDownloadStudentTemplate = async () => {
    await downloadDepartmentStudentsTemplate(deptName);
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لطلبة قسم (${deptName}) بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📤 استيراد ومعالجة ملف Excel لطلبة القسم
  const handleStudentExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDeptId) return;

    try {
      setIsImportingStudentExcel(true);
      const rows = await parseExcelFile(file);

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newProfilesToAdd: UserProfile[] = [];
      let tempAllProfiles = [...profiles];

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rawName = String(row['name'] || row['اسم الطالب الثلاثي / الرباعي'] || row['اسم الطالب'] || row['الاسم'] || '').trim();
        const rawStage = Number(row['stage'] || row['المرحلة الدراسية (1-4)'] || row['المرحلة'] || 1);
        const rawGender = String(row['gender'] || row['الجنس'] || '').trim();
        const rawEmail = String(row['email'] || row['البريد الأكاديمي'] || '').trim();
        const rawPass = String(row['pass'] || row['كلمة المرور'] || '').trim();

        if (!rawName || rawName.length < 3) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم فارغ',
            reason: 'حقل الاسم فارغ أو غير مكتمل',
          });
          return;
        }

        // فحص التكرار بالاسم في نفس القسم
        const isNameDuplicate = tempAllProfiles.some(
          (p) => p.department_id === currentDeptId && p.role === 'student' && p.full_name.trim().toLowerCase() === rawName.toLowerCase()
        );

        if (isNameDuplicate) {
          duplicates.push({
            name: rawName,
            email: rawEmail || '—',
            dept: deptName,
            reason: 'الطالب مسجل مسبقاً في هذا القسم',
          });
          return;
        }

        // معالجة البريد الأكاديمي
        let finalEmail = '';
        if (rawEmail) {
          finalEmail = rawEmail.includes('@') ? rawEmail.toLowerCase() : `${rawEmail.toLowerCase()}@sadiq.edu.iq`;
          if (tempAllProfiles.some((p) => p.generated_email.toLowerCase() === finalEmail)) {
            finalEmail = generateStrongUniqueEmail('st', tempAllProfiles);
          }
        } else {
          finalEmail = generateStrongUniqueEmail('st', tempAllProfiles);
        }

        const finalPass = rawPass || generateStrongPassword();
        const detectedGender = (rawGender === 'أنثى' || rawGender === 'female')
          ? 'female'
          : (rawGender === 'ذكر' || rawGender === 'male')
            ? 'male'
            : detectArabicGender(rawName);

        // ☀️🌙 استخراج وفحص الفترة الدراسية (صباحي / مسائي)
        const rawStudyType = String(
          row['study_type'] ||
          row['الفترة الدراسية (صباحي / مسائي)'] ||
          row['الفترة الدراسية'] ||
          row['نوع الدراسة'] ||
          row['الدراسة'] ||
          ''
        ).trim().toLowerCase();
        const detectedStudyType: 'morning' | 'evening' = (rawStudyType.includes('مسائ') || rawStudyType.includes('evening')) ? 'evening' : 'morning';

        const validStage = (rawStage >= 1 && rawStage <= 4) ? rawStage : 1;
        const randomNum = Math.floor(10000 + Math.random() * 90000);

        const newStd: UserProfile = {
          id: `usr-std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          full_name: rawName,
          role: 'student',
          department_id: currentDeptId,
          department_name: deptName,
          stage_number: validStage,
          stage_id: `stage-${currentDeptId}-${validStage}`,
          // 🎓 الرقم الجامعي للعام 2026
          university_number: `2026${randomNum}`,
          generated_email: finalEmail,
          temp_password: finalPass,
          gender: detectedGender as 'male' | 'female',
          study_type: detectedStudyType,
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: tempAllProfiles.length + 1,
        };

        newProfilesToAdd.push(newStd);
        tempAllProfiles.push(newStd);
        accepted.push({
          name: `${rawName} (${detectedStudyType === 'evening' ? 'مسائي' : 'صباحي'})`,
          dept: `${deptName} (م${validStage})`,
          email: finalEmail,
        });
      });

      if (newProfilesToAdd.length > 0) {
        const updated = [...newProfilesToAdd, ...profiles];
        setProfiles(updated);
        saveStoredData('profiles', updated);
        // ☁️ رفع ومزامنة كافة الطلبة المستوردين من ملف Excel في جدول students بسحابة Supabase فوراً
        newProfilesToAdd.forEach((student) => {
          saveProfileToSupabase(student);
        });
      }

      setStudentImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setStudentActiveReportTab('accepted');

      setSuccessMessage(`تمت معالجة ملف الطلبة وإضافة ${accepted.length} طالب بنجاح!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من مطابقة الملف المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingStudentExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !currentDeptId) {
      setStudentNameError('يرجى إدخال اسم الطالب الثلاثي أو الرباعي');
      return;
    }

    if (!studentStage) {
      setErrorMessage('يرجى اختيار المرحلة الدراسية للطالب');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!studentGender) {
      setErrorMessage('يرجى تحديد جنس الطالب (ذكر أو أنثى)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!studentStudyType) {
      setErrorMessage('يرجى تحديد الفترة الدراسية للطالب (الصباحية أو المسائية)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (customStudentPassword && customStudentPassword.length < 8) {
      setErrorMessage('كلمة المرور المخصصة يجب ألا تقل عن 8 خانات');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (editingStudentId) {
      const candidateEmail = customStudentEmail.trim()
        ? (customStudentEmail.includes('@') ? customStudentEmail.trim().toLowerCase() : `${customStudentEmail.trim().toLowerCase()}@sadiq.edu.iq`)
        : '';
      
      if (candidateEmail) {
        // 🛡️ فحص فرادة البريد الأكاديمي للطالب عند التعديل
        const emailCheck = checkEmailUniquenessAcrossSystem(candidateEmail, editingStudentId, profiles);
        if (!emailCheck.isUnique) {
          setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر. يرجى اختيار بريد بديل.');
          setTimeout(() => setErrorMessage(''), 5000);
          return;
        }
      }

      let editedStudentObj: UserProfile | null = null;
      const updated = profiles.map((p) => {
        if (p.id === editingStudentId) {
          const finalEmail = candidateEmail || p.generated_email;
          const finalPassword = customStudentPassword.trim() || p.temp_password;

          const updatedStd: UserProfile = {
            ...p,
            full_name: studentName.trim(),
            stage_number: studentStage!,
            stage_id: `stage-${currentDeptId}-${studentStage}`,
            gender: studentGender!,
            study_type: studentStudyType!,
            generated_email: finalEmail,
            temp_password: finalPassword,
          };
          editedStudentObj = updatedStd;
          return updatedStd;
        }
        return p;
      });
      setProfiles(updated);
      saveStoredData('profiles', updated);
      if (editedStudentObj) {
        saveProfileToSupabase(editedStudentObj); // ☁️ مزامنة فورية مع جدول students في Supabase
      }
      setEditingStudentId(null);
      setSuccessMessage('تم تحديث بيانات الطالب بنجاح ومزامنتها سحابياً!');
    } else {
      let finalEmail = '';
      if (customStudentEmail.trim()) {
        finalEmail = customStudentEmail.includes('@')
          ? customStudentEmail.trim().toLowerCase()
          : `${customStudentEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail('st', profiles);
      }

      // 🛡️ فحص فرادة البريد الأكاديمي للطالب قبل الإضافة ومنع التكرار نهائياً
      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles);
      if (!emailCheck.isUnique) {
        setErrorMessage(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى استخدام بريد آخر.');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      const finalPassword = customStudentPassword.trim() || generateStrongPassword();
      const randomNum = Math.floor(10000 + Math.random() * 90000);

      const newStudent: UserProfile = {
        id: `usr-std-${Date.now()}`,
        full_name: studentName.trim(),
        role: 'student',
        department_id: currentDeptId,
        department_name: deptName,
        stage_number: studentStage!,
        stage_id: `stage-${currentDeptId}-${studentStage}`,
        // 🎓 الرقم الجامعي للعام 2026
        university_number: `2026${randomNum}`,
        generated_email: finalEmail,
        temp_password: finalPassword,
        gender: studentGender!,
        study_type: studentStudyType!,
        is_active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newStudent, ...profiles.map((p, idx) => ({ ...p, order_index: idx + 1 }))];
      setProfiles(updated);
      saveStoredData('profiles', updated);
      saveProfileToSupabase(newStudent); // ☁️ مزامنة فورية مع جدول students في Supabase
      setSelectedCardProfile(newStudent);
      setSuccessMessage('تم تسجيل الطالب وتوليد حسابه الأكاديمي وتوثيقه سحابياً بنجاح!');
    }

    setStudentName('');
    setStudentStage(null); // 🔄 تصفير المرحلة لتكون غير محددة
    setStudentGender(null); // 🔄 تصفير الجنس ليكون غير محدد
    setStudentStudyType(null); // 🔄 تصفير الفترة الدراسية لتكون غير محددة
    setCustomStudentEmail('');
    setCustomStudentPassword('');
    setStudentNameError('');
    setEditingStudentId(null);
    setIsStudentModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🔧 دالة المعالجة التلقائية لكافة الحسابات المكررة وتوليد بريد أكاديمي فريد
  const handleFixDuplicateEmails = () => {
    const { updatedProfiles, fixedCount, fixedDetails } = resolveDuplicateEmailsInProfiles(profiles);
    if (fixedCount > 0) {
      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);
      // ☁️ مزامنة الحسابات المصححة مع سوبابيز
      fixedDetails.forEach((detail) => {
        const found = updatedProfiles.find((p) => p.full_name === detail.name);
        if (found) saveProfileToSupabase(found);
      });
      setSuccessMessage(`تم بنجاح تصحيح (${fixedCount}) حسابات وفصل البريد الأكاديمي المكرر وتوليد بريد فريد جديد!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleDeleteStudent = (id: string) => {
    const targetStudent = profiles.find((p) => p.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف حساب الطالب',
      itemName: targetStudent?.full_name || 'طالب',
      itemDetails: `المرحلة ${targetStudent?.stage_number || 1} - قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من حذف هذا الطالب من القسم؟ سيتم حذف بياناته وسجلاته الأكاديمية.',
      confirmText: 'تأكيد الحذف',
      onConfirm: () => {
        const updated = profiles.filter((p) => p.id !== id);
        setProfiles(updated);
        saveStoredData('profiles', updated);
        deleteProfileFromSupabase(id, 'student'); // ☁️ حذف فوري من جدول students في Supabase
        setSuccessMessage('تم حذف الطالب من القسم بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🎓 ترحيل طالب فردي إلى المرحلة التالية عند نجاحه أو تثبيت تخرجه
  const handlePromoteStudent = (student: UserProfile, e?: React.MouseEvent) => {
    // 🛑 منع انتشار النقر
    if (e) e.stopPropagation();

    const currentStage = Number(student.stage_number) || 1;
    const stageNames: Record<number, string> = { 1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة' };
    
    // 🎓 إذا كان الطالب بالمرحلة الرابعة، يتم تسجيل تخرجه فوراً
    if (currentStage >= 4) {
      if (student.is_graduated === true || String(student.is_graduated) === 'true') {
        setErrorMessage('هذا الطالب مثبت تخرجه مسبقاً كخريج معتمد.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      let graduatedStudentObj: UserProfile | null = null;
      const updated = profiles.map((p) => {
        if (p.id === student.id) {
          const stdObj: UserProfile = {
            ...p,
            stage_number: 4,
            is_graduated: true,
            graduation_status: 'خريج معتمد (ناجح بنجاح)',
          };
          graduatedStudentObj = stdObj;
          return stdObj;
        }
        return p;
      });
      setProfiles(updated);
      saveStoredData('profiles', updated);
      if (graduatedStudentObj) {
        saveProfileToSupabase(graduatedStudentObj);
      }

      // 🔔 إرسال إشعار التخرج الفوري للطالب
      sendAppNotification({
        recipient_id: student.id,
        recipient_role: 'student',
        title: 'مبارك التخرج والنجاح الأكاديمي! 🎓',
        message: `تم اعتماد تخرجك بنجاح من قسم ${deptName} للعام الدراسي ${academicYear}. نتمنى لك دوام التوفيق والتميز!`,
        type: 'system_announcement',
        link: '/student/dashboard',
      });

      setSuccessMessage(`مبارك! تم تثبيت تخرج الطالب (${student.full_name}) بنجاح.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }

    const nextStage = currentStage + 1;
    const nextStageName = stageNames[nextStage] || `${nextStage}`;

    let promotedStudentObj: UserProfile | null = null;
    const updated = profiles.map((p) => {
      if (p.id === student.id) {
        const stdObj: UserProfile = {
          ...p,
          stage_number: nextStage,
          stage_id: `stage-${currentDeptId || p.department_id || 'dept-1'}-${nextStage}`,
          is_graduated: false,
        };
        promotedStudentObj = stdObj;
        return stdObj;
      }
      return p;
    });
    setProfiles(updated);
    saveStoredData('profiles', updated);
    if (promotedStudentObj) {
      saveProfileToSupabase(promotedStudentObj);
    }

    // 🔄 ضبط التصفية لتظهر المرحلة الجديدة للطالب المنقول فوراً
    setFilterStudentStage(nextStage);

    // 🔔 إرسال إشعار الترحيل الأكاديمي للطالب
    sendAppNotification({
      recipient_id: student.id,
      recipient_role: 'student',
      title: `تهانينا بالنجاح! تم ترحيلك إلى المرحلة ${nextStageName} 🚀`,
      message: `اعتمدت رئاسة ومقررية قسم ${deptName} ترحيلك بنجاح إلى المرحلة ${nextStage} (${nextStageName}) للعام الدراسي ${academicYear}.`,
      type: 'system_announcement',
      link: '/student/dashboard',
    });

    setSuccessMessage(`تم بنجاح ترحيل الطالب (${student.full_name}) إلى المرحلة ${nextStageName}! 🎉`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🎓 ترحيل مرحلة كاملة جماعياً بنقرة واحدة (Bulk Promotion)
  const handleBulkPromoteStage = (fromStage: number) => {
    // 🔢 تحويل رقم المرحلة إلى عدد صحيح مضمون
    const stageNum = Number(fromStage) || 1;
    
    // 🎯 استخراج الطلاب المؤهلين في هذه المرحلة بدقة (المراحل 1-3 مؤهلة دائماً، والمرحلة 4 لمن لم يتخرج بعد)
    const targetStudents = deptStudents.filter((s) => {
      const sStage = Number(s.stage_number) || 1;
      if (sStage !== stageNum) return false;
      if (stageNum < 4) return true;
      const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
      return !isGrad;
    });

    if (targetStudents.length === 0) {
      setErrorMessage(`لا يوجد طلاب مؤهلين في المرحلة ${stageNum} حالياً لترحيلهم.`);
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const nextStage = stageNum + 1;
    const stageNames: Record<number, string> = { 1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة' };
    const fromName = stageNames[stageNum] || `${stageNum}`;
    const toName = stageNum >= 4 ? 'التخرج النهائي' : (stageNames[nextStage] || `${nextStage}`);

    const targetIds = new Set(targetStudents.map((s) => s.id));
    const updatedProfilesToSync: UserProfile[] = [];
    const updated = profiles.map((p) => {
      if (targetIds.has(p.id)) {
        if (stageNum >= 4) {
          const gradObj: UserProfile = {
            ...p,
            stage_number: 4,
            is_graduated: true,
            graduation_status: 'خريج معتمد (ناجح بنجاح)',
          };
          updatedProfilesToSync.push(gradObj);
          return gradObj;
        }
        const promObj: UserProfile = {
          ...p,
          stage_number: nextStage,
          stage_id: `stage-${currentDeptId || p.department_id || 'dept-1'}-${nextStage}`,
          is_graduated: false,
        };
        updatedProfilesToSync.push(promObj);
        return promObj;
      }
      return p;
    });

    setProfiles(updated);
    saveStoredData('profiles', updated);
    updatedProfilesToSync.forEach((std) => {
      saveProfileToSupabase(std);
    });

    // 🔔 إرسال إشعارات جماعية لكافة الطلاب المشمولين بالترحيل
    targetStudents.forEach((st) => {
      sendAppNotification({
        recipient_id: st.id,
        recipient_role: 'student',
        title: stageNum >= 4 ? 'مبارك التخرج والنجاح الأكاديمي! 🎓' : `تم ترحيلك إلى المرحلة ${toName} 🚀`,
        message: stageNum >= 4
          ? `تم اعتماد تخرجك بنجاح من قسم ${deptName} للعام الدراسي ${academicYear}.`
          : `اعتمدت رئاسة القسم ترحيلك بنجاح إلى المرحلة ${toName}. نتمنى لك دوام التفوق!`,
        type: 'system_announcement',
        link: '/student/dashboard',
      });
    });

    setIsBulkPromotionModalOpen(false);
    // 🔄 الانتقال تلقائياً لتصفية المرحلة الجديدة ليرى المستخدم الطلاب المنقولين فوراً
    setFilterStudentStage(stageNum >= 4 ? 4 : nextStage);
    setSuccessMessage(stageNum >= 4 
      ? `تم بنجاح تثبيت تخرج جميع طلاب المرحلة الرابعة (${targetStudents.length} طالب) في قسم ${deptName}! 🎓`
      : `تم بنجاح ترحيل (${targetStudents.length}) طالب من المرحلة ${fromName} إلى المرحلة ${toName}! 🎉`
    );
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لطلبة القسم
  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteStudents = () => {
    const count = selectedStudentIds.length;
    if (count === 0) return;

    setDeleteModalConfig({
      isOpen: true,
      title: `تأكيد الحذف الجماعي لـ (${count}) طلاب`,
      itemName: `${count} من طلبة قسم ${deptName}`,
      itemDetails: `سيتم حذف الحسابات الجامعية وسجلات الدرجات والأقساط للطلبة المحددين نهائياً.`,
      warningMessage: `⚠️ تنبيه أمني: هل أنت متأكد من حذف (${count}) طالب دفعة واحدة من قيود القسم؟ لا يمكن التراجع.`,
      confirmText: `حذف (${count}) طلاب نهائياً`,
      onConfirm: () => {
        selectedStudentIds.forEach((id) => {
          deleteProfileFromSupabase(id, 'student'); // ☁️ حذف الطلاب سحابياً
        });

        const updatedProfiles = profiles.filter((p) => !selectedStudentIds.includes(p.id));
        const updatedGrades = grades.filter((g) => !selectedStudentIds.includes(g.student_id));
        setProfiles(updatedProfiles);
        setGrades(updatedGrades);
        saveStoredData('profiles', updatedProfiles);
        saveStoredData('grades', updatedGrades);
        setSelectedStudentIds([]);
        setSuccessMessage(`تم حذف (${count}) من طلبة القسم بنجاح.`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleBulkExportStudentsExcel = async () => {
    const selectedStudentsList = deptStudents.filter((s) => selectedStudentIds.includes(s.id));
    if (selectedStudentsList.length === 0) return;

    await exportCustomStudentsList(selectedStudentsList, deptName);
    setSuccessMessage(`تم تصدير (${selectedStudentsList.length}) طالب إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // ==========================================
  // 3️⃣ إدارة المواد الدراسية (Courses CRUD)
  // ==========================================
  // 📥 تنزيل نموذج Excel معتمد لمواد القسم مع التعليمات وقائمة الأساتذة وحالة الأدوار الحالية
  const handleDownloadCourseTemplate = async () => {
    const isFinalActive = deptCourses.some((c) => c.is_final_exam_enabled);
    const isSupActive = deptCourses.some((c) => c.is_supplementary_exam_enabled);
    await downloadDepartmentCoursesTemplate(deptName, deptTeachers, {
      isFinalExamEnabled: isFinalActive,
      isSupplementaryEnabled: isSupActive,
      semester: filterCourseSemester,
    });
    setSuccessMessage(`تم تنزيل نموذج إكسل المعتمد لمواد قسم (${deptName}) بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🖨️ دالة تصدير وطباعة جدول المواد والمقررات الدراسية الرسمية المعتمدة بصيغة PDF A4 Landscape
  const handleExportCoursesPDF = async () => {
    // 🛡️ فحص إذا جان التصدير شغال حتى نمنع النقرات المتكررة
    if (isExportingCoursesPDF) return;

    // 📋 تحديد المواد المراد طباعتها: إذا المستخدم محدد مواد معينة ناخذها، وإلا ناخذ المواد المعروضة المفلترة
    const hasSelected = selectedCourseIds.length > 0; // 🔍 هل اكو مواد محددة بالمربعات؟
    const rawCoursesToExport = hasSelected
      ? deptCourses.filter((c) => selectedCourseIds.includes(c.id)) // 🎯 المواد المحددة فقط
      : filteredCourses.length > 0
      ? filteredCourses // 🔍 المواد المفلترة حالياً
      : deptCourses; // 📚 كل مواد القسم كخيار احتياطي

    // ⚠️ فحص إذا ماكو مواد بالكشف
    if (rawCoursesToExport.length === 0) {
      setErrorMessage('لا توجد مواد دراسية لطباعتها حالياً!'); // ⚠️ رسالة تحذيرية
      setTimeout(() => setErrorMessage(''), 3500); // ⏱️ إخفاء الرسالة بعد 3 ثوان ونصف
      return; // 🛑 إيقاف التنفيذ
    }

    try {
      setIsExportingCoursesPDF(true); // ⏳ تفعيل حالة التحميل

      // 🧹 تهيئة قائمة المواد وتجهيز أسماء الأساتذة وساعات النظري والعملي بدقة
      const formattedItems: DepartmentCoursePDFItem[] = rawCoursesToExport.map((c) => {
        // 👨‍🏫 استخراج أستاذ النظري من كائن المادة أو من مصفوفة أساتذة القسم
        const matchedTheoryTeacher = c.theory_teacher_id
          ? deptTeachers.find((t) => t.id === c.theory_teacher_id)
          : undefined; // 🔍 مطابقة أستاذ النظري
        const theoryTeacherName = c.theory_teacher_name || (matchedTheoryTeacher ? matchedTheoryTeacher.full_name : undefined); // 👤 اسم أستاذ النظري

        // 🧪 استخراج أستاذ العملي من كائن المادة أو من مصفوفة أساتذة القسم
        const matchedPracticalTeacher = c.practical_teacher_id
          ? deptTeachers.find((t) => t.id === c.practical_teacher_id)
          : undefined; // 🔍 مطابقة أستاذ العملي
        const practicalTeacherName = c.practical_teacher_name || (matchedPracticalTeacher ? matchedPracticalTeacher.full_name : undefined); // 👤 اسم أستاذ العملي

        // 🔬 تحديد ما إذا كانت المادة تحتوي جانباً عملياً
        const isCoursePractical = c.course_type === 'theory_and_practical' || c.has_practical === true;

        return {
          id: c.id, // 🆔 معرف المادة
          name: c.name, // 📘 اسم المادة
          code: c.code, // 🏷️ رمز المادة
          stage: c.stage_number || 1, // 🎓 رقم المرحلة الأكاديمية
          semester: c.semester || 1, // 🗓️ الكورس الدراسي المعتمد
          course_type: c.course_type || (isCoursePractical ? 'theory_and_practical' : 'theory_only'), // 🔬 نوع وتوصيف المادة
          credits: c.credit_hours || 5, // ⏱️ وحدات وساعات بولونيا المعتمدة
          theory_hours: 2, // 📚 ساعات النظري الأسبوعية
          practical_hours: isCoursePractical ? 2 : 0, // 🧪 ساعات العملي الأسبوعية
          theory_teacher_name: theoryTeacherName, // 👨‍🏫 أستاذ النظري المكلف
          practical_teacher_name: practicalTeacherName, // 🧪 أستاذ العملي المكلف
          is_final_exam_enabled: c.is_final_exam_enabled, // 🎯 حالة رصد الفاينل الدور الأول
          is_supplementary_exam_enabled: c.is_supplementary_exam_enabled, // 🔄 حالة رصد الدور الثاني
        };
      });

      // 🏢 استخراج وتجهيز بيانات القسم والكلية ورئيس القسم والمقرر
      const collegeName = 'كلية تكنولوجيا المعلومات'; // 🏛️ اسم الكلية
      const headName = currentHead?.full_name || 'رئاسة القسم العلمي'; // 👤 اسم رئيس القسم
      const rappName = currentRap?.full_name || 'مقررية القسم العلمي'; // 👤 اسم المقرر

      // 🖨️ استدعاء دالة التوليد والتصدير للـ PDF الرسمية
      const success = await exportDepartmentCoursesPDF({
        departmentName: deptName, // 🏢 اسم القسم
        collegeName: collegeName, // 🏛️ اسم الكلية
        academicYear: getAcademicYear(), // 📅 العام الدراسي
        departmentHeadName: headName, // 👤 رئيس القسم
        rapporteurName: rappName, // 👤 مقرر القسم
        stageFilter: filterCourseStage, // 🎓 تصفية المرحلة
        semesterFilter: filterCourseSemester, // 🗓️ تصفية الكورس
        isSelectiveExport: hasSelected, // 🔍 هل التصدير محدد
        courses: formattedItems, // 📚 قائمة المواد المهيأة
      });

      // 🌟 فحص نتيجة التصدير وإظهار الرسالة المناسبة
      if (success) {
        setSuccessMessage(
          hasSelected
            ? `تم تصدير كشف PDF لـ (${formattedItems.length}) مادة دراسية محددة بنجاح! 🖨️✨`
            : `تم تصدير جدول مقررات قسم (${deptName}) بصيغة PDF الرسمية بنجاح! 🖨️✨`
        ); // 🥳 إشعار النجاح
        setTimeout(() => setSuccessMessage(''), 4500); // ⏱️ مسح الإشعار بعد 4.5 ثانية
      } else {
        setErrorMessage('تعذر تصدير ملف PDF، يرجى المحاولة مرة أخرى.'); // ❌ إشعار الخطأ
        setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح الخطأ
      }
    } catch {
      setErrorMessage('حدث خطأ غير متوقع أثناء إعداد ملف الـ PDF.'); // 💥 معالجة الاستثناء
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح رسالة الاستثناء
    } finally {
      setIsExportingCoursesPDF(false); // 🔄 إيقاف حالة التحميل
    }
  };

  // 📤 استيراد ومعالجة ملف Excel لمواد ومقررات القسم
  const handleCourseExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDeptId) return;

    try {
      setIsImportingCourseExcel(true);
      const rows = await parseExcelFile(file);

      const accepted: { name: string; dept: string; email: string }[] = [];
      const duplicates: { name: string; email: string; dept: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newCoursesToAdd: Course[] = [];
      const newTeacherCoursesToAdd: TeacherCourse[] = [];
      let tempAllCourses = [...courses];

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rawName = String(row['name'] || row['اسم المادة الدراسية بالعربية *'] || row['اسم المادة الدراسية'] || row['اسم المادة'] || row['المادة'] || '').trim();
        const rawCode = String(row['code'] || row['رمز المادة (الكود)'] || row['رمز المادة'] || row['الكود'] || '').trim().toUpperCase();
        const rawStage = Number(row['stage'] || row['المرحلة الدراسية (1-4) *'] || row['المرحلة الدراسية'] || row['المرحلة'] || 1);
        const rawSemester = Number(row['semester'] || row['الكورس (1 أو 2) *'] || row['الفصل (1 أو 2) *'] || row['الفصل الدراسي'] || row['الكورس الدراسي'] || row['الكورس'] || 1);
        const rawType = String(row['course_type'] || row['نوع المادة (نظري وعملي / نظري فقط) *'] || row['نوع المادة'] || '').trim();
        const rawCredits = Number(row['credits'] || row['الساعات المعتمدة ECTS *'] || row['الساعات المعتمدة'] || row['الوحدات'] || 3);
        const rawTheoryTeacher = String(row['theory_teacher'] || row['أستاذ النظري (اختياري)'] || row['أستاذ النظري'] || '').trim();
        const rawPracticalTeacher = String(row['practical_teacher'] || row['أستاذ العملي (اختياري)'] || row['أستاذ العملي'] || '').trim();
        const rawFinalStatus = String(row['is_final'] || row['الامتحان النهائي (مفعل / مغلق)'] || row['الامتحان النهائي'] || '').trim();
        const rawSupStatus = String(row['is_sup'] || row['الدور الثاني (مفعل / مغلق)'] || row['الدور الثاني'] || '').trim();
        const isFinalEnabled = rawFinalStatus === 'مفعل' || rawFinalStatus === 'true' || rawFinalStatus === '1';
        const isSupEnabled = rawSupStatus === 'مفعل' || rawSupStatus === 'true' || rawSupStatus === '1';

        if (!rawName || rawName.length < 2) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawName || 'اسم مادة فارغ',
            reason: 'حقل اسم المادة فارغ أو غير مكتمل',
          });
          return;
        }

        // فحص التكرار داخل نفس القسم بالاسم
        const isDuplicateName = tempAllCourses.some(
          (c) => c.department_id === currentDeptId && c.name.trim().toLowerCase() === rawName.toLowerCase()
        );
        if (isDuplicateName) {
          duplicates.push({
            name: rawName,
            email: rawCode || '—',
            dept: deptName,
            reason: 'المادة مضافة مسبقاً في هذا القسم بنفس الاسم',
          });
          return;
        }

        // تحديد المرحلة والكورس
        const stageNumber = [1, 2, 3, 4].includes(rawStage) ? rawStage : 1;
        const semesterNumber = (rawSemester === 2 ? 2 : 1) as 1 | 2;
        const isTheoryOnly = rawType.includes('فقط') || rawType === 'theory_only' || (!rawType.includes('عملي') && rawType.includes('نظري') && !rawType.includes('و'));
        const courseTypeParsed: CourseType = isTheoryOnly ? 'theory_only' : 'theory_and_practical';
        const creditHoursParsed = Math.max(1, Math.min(15, rawCredits || 3));

        // توليد رمز المادة إذا لم يتوفر
        const existingDeptCoursesCount = tempAllCourses.filter((c) => c.department_id === currentDeptId).length;
        const finalCode = rawCode || `CRS-${stageNumber}0${existingDeptCoursesCount + 1}`;

        // ربط الأساتذة إن وجدوا
        let matchedTheoryTeacher = rawTheoryTeacher 
          ? deptTeachers.find((t) => t.full_name.trim().toLowerCase() === rawTheoryTeacher.toLowerCase() || t.full_name.includes(rawTheoryTeacher))
          : undefined;
        let matchedPracticalTeacher = (courseTypeParsed === 'theory_and_practical' && rawPracticalTeacher)
          ? deptTeachers.find((t) => t.full_name.trim().toLowerCase() === rawPracticalTeacher.toLowerCase() || t.full_name.includes(rawPracticalTeacher))
          : undefined;

        const newCourseId = `crs-${Date.now()}-${index}`;
        const newCourse: Course = {
          id: newCourseId,
          department_id: currentDeptId,
          department_name: deptName,
          stage_id: `stage-${currentDeptId}-${stageNumber}`,
          stage_number: stageNumber,
          academic_year_id: 'year-2026',
          name: rawName,
          code: finalCode,
          credit_hours: creditHoursParsed,
          semester: semesterNumber,
          course_type: courseTypeParsed,
          has_practical: courseTypeParsed === 'theory_and_practical',
          theory_teacher_id: matchedTheoryTeacher ? matchedTheoryTeacher.id : undefined,
          theory_teacher_name: matchedTheoryTeacher ? matchedTheoryTeacher.full_name : undefined,
          practical_teacher_id: matchedPracticalTeacher ? matchedPracticalTeacher.id : undefined,
          practical_teacher_name: matchedPracticalTeacher ? matchedPracticalTeacher.full_name : undefined,
          assessment_scheme: getDefaultAssessmentScheme(courseTypeParsed),
          is_final_exam_enabled: isFinalEnabled, // 🎯 افتراضياً مغلق (false) ما لم يُحدد مفعل صراحة
          is_supplementary_exam_enabled: isSupEnabled, // 🔄 افتراضياً مغلق (false) ما لم يُحدد مفعل صراحة
          created_at: new Date().toISOString(),
          order_index: newCoursesToAdd.length,
        };

        newCoursesToAdd.push(newCourse);
        tempAllCourses.push(newCourse);

        // إنشاء تكليف إذا وجد أستاذ
        if (matchedTheoryTeacher) {
          newTeacherCoursesToAdd.push({
            id: `tc-th-${newCourseId}-${matchedTheoryTeacher.id}`,
            teacher_id: matchedTheoryTeacher.id,
            teacher_name: matchedTheoryTeacher.full_name,
            course_id: newCourseId,
            course_name: rawName,
            department_id: currentDeptId,
            semester: semesterNumber,
            created_at: new Date().toISOString(),
          });
        }
        if (matchedPracticalTeacher && matchedPracticalTeacher.id !== matchedTheoryTeacher?.id) {
          newTeacherCoursesToAdd.push({
            id: `tc-pr-${newCourseId}-${matchedPracticalTeacher.id}`,
            teacher_id: matchedPracticalTeacher.id,
            teacher_name: matchedPracticalTeacher.full_name,
            course_id: newCourseId,
            course_name: rawName,
            department_id: currentDeptId,
            semester: semesterNumber,
            created_at: new Date().toISOString(),
          });
        }

        accepted.push({
          name: rawName,
          dept: `المرحلة ${stageNumber} (الكورس ${semesterNumber === 1 ? 'الأول' : 'الثاني'}) - ${creditHoursParsed} ECTS`,
          email: finalCode,
        });
      });

      if (newCoursesToAdd.length > 0) {
        const mergedCourses = [...newCoursesToAdd, ...courses.map((c, idx) => ({ ...c, order_index: idx + newCoursesToAdd.length }))];
        setCourses(mergedCourses);
        saveStoredData('courses', mergedCourses);
        newCoursesToAdd.forEach((c) => saveCourseToSupabase(c)); // ☁️ حفظ المقررات المستوردة في سحابة Supabase فوراً

        if (newTeacherCoursesToAdd.length > 0) {
          const mergedTCs = [...teacherCourses, ...newTeacherCoursesToAdd];
          setTeacherCourses(mergedTCs);
          saveStoredData('teacher_courses', mergedTCs);
          newTeacherCoursesToAdd.forEach((tc) => saveTeacherCourseToSupabase(tc)); // ☁️ حفظ تكليفات المقررات في Supabase فوراً
        }
      }

      setCourseImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setCourseActiveReportTab(accepted.length > 0 ? 'accepted' : (duplicates.length > 0 ? 'duplicates' : 'rejected'));

      if (accepted.length > 0) {
        setSuccessMessage(`تمت معالجة الملف وإضافة (${accepted.length}) مادة دراسية بنجاح! 📊🎉`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من اختيار ملف Excel صالح (.xlsx)');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingCourseExcel(false);
      e.target.value = '';
    }
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim() || !currentDeptId) return;

    if (!courseType) {
      setErrorMessage('يرجى تحديد نوع وتوصيف المادة الدراسية (نظري فقط أو نظري وعملي)');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseStage) {
      setErrorMessage('يرجى اختيار المرحلة الدراسية للمادة');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseSemester) {
      setErrorMessage('يرجى اختيار الكورس الدراسي للمادة');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (!courseCredits || courseCredits <= 0) {
      setErrorMessage('يرجى تحديد الساعات والوحدات المعتمدة (ECTS) للمادة');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const theoryTeacher = deptTeachers.find((t) => t.id === courseTheoryTeacherId);
    const practicalTeacher = courseType === 'theory_and_practical' 
      ? deptTeachers.find((t) => t.id === coursePracticalTeacherId) 
      : null;

    let targetCourseId = editingCourseId;

    if (editingCourseId) {
      let updatedCourseToSync: Course | null = null;
      const updated = courses.map((c) => {
        if (c.id === editingCourseId) {
          const edited: Course = {
            ...c,
            name: courseName.trim(),
            code: courseCode.trim().toUpperCase(),
            credit_hours: courseCredits!,
            stage_number: courseStage!,
            semester: courseSemester!,
            course_type: courseType!,
            has_practical: courseType === 'theory_and_practical',
            theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
            theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
            practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
            practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
            assessment_scheme: c.assessment_scheme || getDefaultAssessmentScheme(courseType!),
            is_supplementary_exam_enabled: courseIsSupplementaryEnabled,
            is_final_exam_enabled: courseIsFinalExamEnabled, // 🎯 تفعيل وحجب الامتحان النهائي الدور الأول
            final_exam_opened_at: courseIsFinalExamEnabled ? (c.final_exam_opened_at || new Date().toISOString()) : undefined, // ⏰ توقيت الفتح
            final_exam_opened_by: courseIsFinalExamEnabled ? (c.final_exam_opened_by || 'رئاسة القسم والمقرر') : undefined, // 👤 اسم المنفذ
          };
          updatedCourseToSync = edited;
          return edited;
        }
        return c;
      });
      setCourses(updated);
      saveStoredData('courses', updated);
      if (updatedCourseToSync) {
        saveCourseToSupabase(updatedCourseToSync); // ☁️ حفظ ومزامنة المادة في Supabase
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('courses_updated'));
      }
      setEditingCourseId(null);
      setSuccessMessage('تم تحديث بيانات المادة وتكليفات الأساتذة وتوثيقها سحابياً بنجاح!');
    } else {
      targetCourseId = `crs-${Date.now()}`;
      const newCourse: Course = {
        id: targetCourseId,
        department_id: currentDeptId,
        department_name: deptName,
        stage_id: `stage-${currentDeptId}-${courseStage}`,
        stage_number: courseStage!,
        academic_year_id: 'year-2026',
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase(),
        credit_hours: courseCredits!,
        semester: courseSemester!,
        course_type: courseType!,
        has_practical: courseType === 'theory_and_practical',
        theory_teacher_id: theoryTeacher ? theoryTeacher.id : undefined,
        theory_teacher_name: theoryTeacher ? theoryTeacher.full_name : undefined,
        practical_teacher_id: practicalTeacher ? practicalTeacher.id : undefined,
        practical_teacher_name: practicalTeacher ? practicalTeacher.full_name : undefined,
        assessment_scheme: getDefaultAssessmentScheme(courseType!),
        is_supplementary_exam_enabled: courseIsSupplementaryEnabled,
        is_final_exam_enabled: courseIsFinalExamEnabled, // 🎯 تفعيل وحجب الامتحان النهائي الدور الأول للمادة الجديدة
        final_exam_opened_at: courseIsFinalExamEnabled ? new Date().toISOString() : undefined, // ⏰ توقيت الفتح
        final_exam_opened_by: courseIsFinalExamEnabled ? 'رئاسة القسم والمقرر' : undefined, // 👤 اسم المنفذ
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      const updated = [newCourse, ...courses.map((c, idx) => ({ ...c, order_index: idx + 1 }))];
      setCourses(updated);
      saveStoredData('courses', updated);
      saveCourseToSupabase(newCourse); // ☁️ حفظ ومزامنة المادة في Supabase
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('courses_updated'));
      }
      setSuccessMessage('تمت إضافة المادة الدراسية في بداية قائمة القسم وتوثيقها سحابياً بنجاح!');
    }

    // 🔄 مزامنة تكليفات الأساتذة (TeacherCourses) الذكية دون مسح التكليفات الأخرى للمادة
    if (targetCourseId) {
      // 🗺️ خريطة تكليفات المادة الحالية للحفاظ على أي أساتذة مكلفين آخرين للمادة
      const otherCourseTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id !== targetCourseId); // 📋 تكليفات المواد الأخرى
      const thisCourseTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id === targetCourseId); // 📋 تكليفات هذه المادة الحالية
      const updatedThisCourseMap = new Map<string, TeacherCourse>(); // 🗺️ خريطة مؤقتة لتنظيم تكليفات المادة

      // إدراج التكليفات القائمة أولاً
      thisCourseTCs.forEach((tc: TeacherCourse) => {
        updatedThisCourseMap.set(tc.teacher_id, tc);
      });

      // 👨‍🏫 تحديث أو إضافة تكليف أستاذ النظري
      if (theoryTeacher) {
        const existingTh = updatedThisCourseMap.get(theoryTeacher.id);
        const role: 'theory' | 'both' = (practicalTeacher && practicalTeacher.id === theoryTeacher.id) ? 'both' : (existingTh?.role_in_course === 'practical' ? 'both' : 'theory');
        const thRecord: TeacherCourse = {
          id: existingTh ? existingTh.id : `tc-th-${targetCourseId}-${theoryTeacher.id}`,
          teacher_id: theoryTeacher.id,
          teacher_name: theoryTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          semester: courseSemester || 1,
          role_in_course: role,
          created_at: existingTh ? existingTh.created_at : new Date().toISOString(),
        };
        updatedThisCourseMap.set(theoryTeacher.id, thRecord);
        saveTeacherCourseToSupabase(thRecord); // ☁️ مزامنة سحابية فورية
      }

      // 🧪 تحديث أو إضافة تكليف أستاذ العملي (إذا كان مختلفاً عن أستاذ النظري)
      if (practicalTeacher && practicalTeacher.id !== theoryTeacher?.id) {
        const existingPr = updatedThisCourseMap.get(practicalTeacher.id);
        const prRecord: TeacherCourse = {
          id: existingPr ? existingPr.id : `tc-pr-${targetCourseId}-${practicalTeacher.id}`,
          teacher_id: practicalTeacher.id,
          teacher_name: practicalTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          semester: courseSemester || 1,
          role_in_course: 'practical',
          created_at: existingPr ? existingPr.created_at : new Date().toISOString(),
        };
        updatedThisCourseMap.set(practicalTeacher.id, prRecord);
        saveTeacherCourseToSupabase(prRecord); // ☁️ مزامنة سحابية فورية
      }

      const allCombinedTCs: TeacherCourse[] = [...otherCourseTCs, ...Array.from(updatedThisCourseMap.values())];
      setTeacherCourses(allCombinedTCs);
      saveStoredData('teacher_courses', allCombinedTCs);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('teacher_courses_updated'));
        window.dispatchEvent(new Event('storage'));
      }
    }

    setCourseName('');
    setCourseCode('');
    setCourseCredits(null); // 🔄 تصفير الساعات والوحدات لتكون غير محددة
    setCourseStage(null); // 🔄 تصفير المرحلة لتكون غير محددة
    setCourseSemester(null); // 🔄 تصفير الكورس ليكون غير محدد
    setCourseType(null); // 🔄 تصفير نوع المادة ليكون غير محدد
    setCourseTheoryTeacherId('');
    setCoursePracticalTeacherId('');
    setEditingCourseId(null);
    setIsCourseModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleDeleteCourse = (id: string) => {
    const targetCourse = courses.find((c) => c.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف المادة الدراسية',
      itemName: targetCourse?.name || 'مادة دراسية',
      itemDetails: `رمز المادة: ${targetCourse?.code || '—'} | المرحلة ${targetCourse?.stage_number || 1}`,
      warningMessage: 'هل أنت متأكد من حذف هذه المادة؟ سيتم حذف كافة تكليفات الأساتذة والبيانات المرتبطة بها نهائياً.',
      onConfirm: () => {
        const updatedCourses = courses.filter((c) => c.id !== id);
        setCourses(updatedCourses);
        saveStoredData('courses', updatedCourses);
        deleteCourseFromSupabase(id); // ☁️ حذف المادة من Supabase

        // 🔗 حذف كافة تكليفات الأستاذ المرتبطة بهذه المادة سحابياً ومحلياً
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id === id);
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليف سحابياً
        });
        const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => tc.course_id !== id);
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSuccessMessage('تم حذف المادة وتكليفاتها بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 🔍 استخراج كافة أساتذة النظري المكلفين بالمادة (سواء من جدول التكليفات الفعلي أو حقل المادة)
  const getCourseTheoryTeachers = useCallback((course: Course): Array<{ id: string; name: string }> => {
    const list: Array<{ id: string; name: string }> = []; // 📋 قائمة الأساتذة المكلفين
    const addedIds = new Set<string>(); // 🛡️ منع تكرار المعرفات

    // 1️⃣ البحث أولاً في جدول تكليفات الأساتذة teacherCourses
    const matchedTCs = teacherCourses.filter(
      (tc: TeacherCourse): boolean => tc.course_id === course.id && (tc.role_in_course === 'theory' || tc.role_in_course === 'both')
    );

    matchedTCs.forEach((tc: TeacherCourse) => {
      if (tc.teacher_id && !addedIds.has(tc.teacher_id)) {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ المادة';
        list.push({ id: tc.teacher_id, name });
        addedIds.add(tc.teacher_id);
      }
    });

    // 2️⃣ فحص حقل theory_teacher_id المثبت بالمادة
    if (course.theory_teacher_id && !addedIds.has(course.theory_teacher_id)) {
      const prof = profiles.find((p: UserProfile): boolean => p.id === course.theory_teacher_id);
      const name = course.theory_teacher_name || prof?.full_name || 'أستاذ المادة';
      list.push({ id: course.theory_teacher_id, name });
      addedIds.add(course.theory_teacher_id);
    }

    // 3️⃣ إذا القائمة فارغة لكن يوجد اسم مكتوب بحقل theory_teacher_name
    if (list.length === 0 && course.theory_teacher_name && course.theory_teacher_name.trim() !== '') {
      list.push({ id: course.theory_teacher_id || `temp-th-${course.id}`, name: course.theory_teacher_name.trim() });
    }

    return list;
  }, [teacherCourses, profiles]);

  // 🧪 استخراج كافة أساتذة العملي المكلفين بالمادة (سواء من جدول التكليفات الفعلي أو حقل المادة)
  const getCoursePracticalTeachers = useCallback((course: Course): Array<{ id: string; name: string }> => {
    const isPractical = course.course_type === 'theory_and_practical' || Boolean(course.has_practical);
    if (!isPractical) return []; // 🛑 إذا كانت المادة نظري فقط نرجع مصفوفة فارغة فوراً

    const list: Array<{ id: string; name: string }> = []; // 📋 قائمة أساتذة العملي
    const addedIds = new Set<string>(); // 🛡️ منع التكرار

    // 1️⃣ البحث أولاً في جدول تكليفات الأساتذة teacherCourses
    const matchedTCs = teacherCourses.filter(
      (tc: TeacherCourse): boolean => tc.course_id === course.id && (tc.role_in_course === 'practical' || tc.role_in_course === 'both')
    );

    matchedTCs.forEach((tc: TeacherCourse) => {
      if (tc.teacher_id && !addedIds.has(tc.teacher_id)) {
        const prof = profiles.find((p: UserProfile): boolean => p.id === tc.teacher_id);
        const name = tc.teacher_name || prof?.full_name || 'أستاذ العملي';
        list.push({ id: tc.teacher_id, name });
        addedIds.add(tc.teacher_id);
      }
    });

    // 2️⃣ فحص حقل practical_teacher_id المثبت بالمادة
    if (course.practical_teacher_id && !addedIds.has(course.practical_teacher_id)) {
      const prof = profiles.find((p: UserProfile): boolean => p.id === course.practical_teacher_id);
      const name = course.practical_teacher_name || prof?.full_name || 'أستاذ العملي';
      list.push({ id: course.practical_teacher_id, name });
      addedIds.add(course.practical_teacher_id);
    }

    // 3️⃣ إذا القائمة فارغة لكن يوجد اسم مكتوب بحقل practical_teacher_name
    if (list.length === 0 && course.practical_teacher_name && course.practical_teacher_name.trim() !== '') {
      list.push({ id: course.practical_teacher_id || `temp-pr-${course.id}`, name: course.practical_teacher_name.trim() });
    }

    return list;
  }, [teacherCourses, profiles]);

  // ⚡ فتح مودال التعيين والتكليف السريع للأستاذ
  const handleOpenQuickAssign = (course: Course, role: 'theory' | 'practical') => {
    const currentId = role === 'theory' ? (course.theory_teacher_id || '') : (course.practical_teacher_id || '');
    setQuickAssignConfig({
      isOpen: true,
      course,
      role,
      selectedTeacherId: currentId,
      searchQuery: '',
    });
  };

  // 💾 حفظ التعيين والتكليف السريع (تعيين أستاذ أو إلغاء تعيينه ومزامنته 100%)
  const handleSaveQuickAssign = (teacherIdToAssign: string | null) => {
    if (!quickAssignConfig.course) return; // 🛡️ حماية في حال عدم تحديد المادة
    const targetCourse = quickAssignConfig.course;
    const role = quickAssignConfig.role;

    if (!teacherIdToAssign) {
      // 🚫 1. إلغاء التعيين والتكليف لهذه الصفة (Unassign)
      const updatedCourses = courses.map((c: Course): Course => {
        if (c.id === targetCourse.id) {
          return {
            ...c,
            ...(role === 'theory'
              ? { theory_teacher_id: undefined, theory_teacher_name: undefined }
              : { practical_teacher_id: undefined, practical_teacher_name: undefined }),
          };
        }
        return c;
      });

      // إزالة التكليف المرتبط من جدول teacherCourses
      const updatedTCs = teacherCourses.filter((tc: TeacherCourse): boolean => {
        if (tc.course_id === targetCourse.id) {
          if (role === 'theory' && (tc.role_in_course === 'theory' || tc.role_in_course === 'both')) {
            deleteTeacherCourseFromSupabase(tc.id);
            return false;
          }
          if (role === 'practical' && (tc.role_in_course === 'practical' || tc.role_in_course === 'both')) {
            deleteTeacherCourseFromSupabase(tc.id);
            return false;
          }
        }
        return true;
      });

      setCourses(updatedCourses);
      setTeacherCourses(updatedTCs);
      saveStoredData('courses', updatedCourses);
      saveStoredData('teacher_courses', updatedTCs);

      const modifiedCourse = updatedCourses.find((c: Course): boolean => c.id === targetCourse.id);
      if (modifiedCourse) {
        saveCourseToSupabase(modifiedCourse);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('courses_updated'));
        window.dispatchEvent(new Event('teacher_courses_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      setSuccessMessage(`تم بنجاح إلغاء تعيين أستاذ ${role === 'theory' ? 'النظري' : 'العملي'} لمادة (${targetCourse.name}).`);
      setTimeout(() => setSuccessMessage(''), 3500);
      setQuickAssignConfig((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    // 👨‍🏫 2. تعيين أستاذ محدد وتكليفه فورياً
    const teacherProfile = profiles.find((p: UserProfile): boolean => p.id === teacherIdToAssign);
    if (!teacherProfile) return;

    const teacherName = teacherProfile.full_name;

    // أ. تحديث المادة في courses
    let updatedCourseObj: Course | null = null;
    const updatedCourses = courses.map((c: Course): Course => {
      if (c.id === targetCourse.id) {
        const u: Course = {
          ...c,
          ...(role === 'theory'
            ? { theory_teacher_id: teacherProfile.id, theory_teacher_name: teacherName }
            : { practical_teacher_id: teacherProfile.id, practical_teacher_name: teacherName }),
        };
        updatedCourseObj = u;
        return u;
      }
      return c;
    });

    // ب. إضافة أو تحديث التكليف في teacher_courses
    let newOrUpdatedTC: TeacherCourse | null = null;
    const existingTCIndex = teacherCourses.findIndex(
      (tc: TeacherCourse): boolean => tc.course_id === targetCourse.id && tc.teacher_id === teacherProfile.id
    );

    let updatedTCs: TeacherCourse[];
    if (existingTCIndex >= 0) {
      // إذا كان الأستاذ مكلفاً بالفعل بهذه المادة، نحدث صفة التكليف
      const cur = teacherCourses[existingTCIndex];
      const mergedRole: 'theory' | 'practical' | 'both' = (cur.role_in_course && cur.role_in_course !== role) ? 'both' : role;
      const updatedRecord: TeacherCourse = {
        ...cur,
        role_in_course: mergedRole,
        teacher_name: teacherName,
        course_name: targetCourse.name,
      };
      newOrUpdatedTC = updatedRecord;
      updatedTCs = teacherCourses.map((tc: TeacherCourse, idx: number): TeacherCourse => (idx === existingTCIndex ? updatedRecord : tc));
    } else {
      // إنشاء تكليف جديد
      const newTC: TeacherCourse = {
        id: `tc-${role}-${targetCourse.id}-${teacherProfile.id}`,
        teacher_id: teacherProfile.id,
        teacher_name: teacherName,
        course_id: targetCourse.id,
        course_name: targetCourse.name,
        department_id: currentDeptId,
        semester: targetCourse.semester || 1,
        role_in_course: role,
        created_at: new Date().toISOString(),
      };
      newOrUpdatedTC = newTC;
      updatedTCs = [...teacherCourses, newTC];
    }

    setCourses(updatedCourses);
    setTeacherCourses(updatedTCs);
    saveStoredData('courses', updatedCourses);
    saveStoredData('teacher_courses', updatedTCs);

    if (updatedCourseObj) {
      saveCourseToSupabase(updatedCourseObj);
    }
    if (newOrUpdatedTC) {
      saveTeacherCourseToSupabase(newOrUpdatedTC);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // 🔔 إشعار الأستاذ المكلف
    sendAppNotification({
      recipient_id: teacherProfile.id,
      recipient_role: 'teacher',
      title: 'تكليف أكاديمي رسمي بمادة دراسية',
      message: `تم تعيينك وتكليفك بتدريس مادة (${targetCourse.name}) [${role === 'theory' ? 'الجانب النظري' : 'الجانب العملي'}] في قسم (${deptName}).`,
      type: 'course_assigned',
      link: '/teacher/dashboard',
    });

    setSuccessMessage(`تم بنجاح تعيين وتكليف الأستاذ (${teacherName}) بمادة (${targetCourse.name}) [${role === 'theory' ? 'نظري' : 'عملي'}] ومزامنتها سحابياً!`);
    setTimeout(() => setSuccessMessage(''), 4000);
    setQuickAssignConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // 🎛️ فتح نافذة تخصيص توزيع الدرجات والعناوين لمادة معينة
  const handleOpenAssessmentModal = (course: Course) => {
    setSelectedCourseForAssessment(course);
    const scheme = getCourseAssessmentScheme(course);
    setTempAssessmentScheme(JSON.parse(JSON.stringify(scheme)));
    setIsAssessmentModalOpen(true);
  };

  // 💾 حفظ المخطط التقييمي المخصص للمادة
  const handleSaveAssessmentSchemeModal = () => {
    if (!selectedCourseForAssessment || !tempAssessmentScheme) return;

    // حساب مجموع السعي
    const cwSum = 
      (tempAssessmentScheme.quiz1.max_score || 0) +
      (tempAssessmentScheme.quiz2.max_score || 0) +
      (tempAssessmentScheme.assignment1.max_score || 0) +
      (tempAssessmentScheme.assignment2.max_score || 0) +
      (tempAssessmentScheme.report.max_score || 0) +
      (tempAssessmentScheme.midterm.max_score || 0) +
      (tempAssessmentScheme.practical.max_score || 0);

    const finalExamScore = tempAssessmentScheme.final_exam.max_score || 0;

    if (cwSum !== 50) {
      setErrorMessage(`تنبيه: مجموع بنود السعي التكويني يجب أن يساوي 50 درجة بالضبط وفقاً لدليل بولونيا! (المجموع الحالي: ${cwSum} درجة).`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (finalExamScore !== 50) {
      setErrorMessage(`تنبيه: درجة الامتحان النهائي يجب أن تساوي 50 درجة بالضبط! (الدرجة الحالية: ${finalExamScore} درجة).`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    let updatedCourseToSync: Course | null = null;
    const updated = courses.map((c) => {
      if (c.id === selectedCourseForAssessment.id) {
        const edited = {
          ...c,
          assessment_scheme: tempAssessmentScheme,
        };
        updatedCourseToSync = edited;
        return edited;
      }
      return c;
    });

    setCourses(updated);
    saveStoredData('courses', updated);
    if (updatedCourseToSync) {
      saveCourseToSupabase(updatedCourseToSync); // ☁️ حفظ التوزيع التقييمي سحابياً
    }
    setIsAssessmentModalOpen(false);
    setSuccessMessage(`تم بنجاح اعتماد وتثبيت التوزيع التقييمي المخصص لمادة (${selectedCourseForAssessment.name})!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🛡️ 1. دالة طلب فتح نافذة التأكيد قبل تفعيل أو إغلاق أي دور لكورس محدد أو مادة
  const requestToggleRoundAction = ({
    round,
    enable,
    targetSemester,
    courseId,
    courseName,
    courseIds,
  }: {
    round: 'final' | 'supplementary';
    enable: boolean;
    targetSemester?: 1 | 2 | 'all';
    courseId?: string;
    courseName?: string;
    courseIds?: string[];
  }) => {
    // 🔍 حساب المواد المستهدفة بدقة بحسب المرحلة ورقم الكورس أو قائمة المعرفات أو معرف المادة
    let affectedCourses: Course[] = [];
    if (courseIds && courseIds.length > 0) {
      affectedCourses = courses.filter((c) => courseIds.includes(c.id));
    } else if (courseId) {
      const found = courses.find((c) => c.id === courseId);
      if (found) affectedCourses = [found];
    } else {
      affectedCourses = deptCourses.filter((c) => { // 🔍 نسوي فلترة لمواد القسم
        const matchesStage = filterCourseStage === 'all' || (Number(c.stage_number) || 1) === Number(filterCourseStage); // 🏷️ مطابقة رقم المرحلة بدون مشاكل تحويل أنواع
        const matchesSemester = !targetSemester || targetSemester === 'all' || (Number(c.semester) || 1) === Number(targetSemester); // 📅 مطابقة رقم الكورس بدقة
        return matchesStage && matchesSemester; // ✅ نرجع المادة إذا طابقت
      }); // 🔚 نهاية الفلترة
    }

    // ⚠️ تنبيه إذا لم تكن هناك مواد مطابقة
    if (affectedCourses.length === 0) {
      setErrorMessage('لا توجد مواد مطابقة لمعايير هذا الإجراء في القسم حالياً.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    // 🎯 تحديد المواد التي تحتاج إلى تعديل فعلي فقط بناءً على حالتها الحالية
    const targetToModifyCourses = affectedCourses.filter((c) => { // 🔍 فلترة المواد المحتاجة لتعديل
      const isCurrentlyOpen = round === 'final' ? c.is_final_exam_enabled === true : c.is_supplementary_exam_enabled === true; // 📊 حالة الدور للمادة
      return enable ? !isCurrentlyOpen : isCurrentlyOpen; // 🔑 عند الفتح نأخذ المغلقة وعند الإغلاق نأخذ المفتوحة
    }); // 🔚 نهاية الفلترة الذكية

    // 🏷️ صياغة نصوص العنوان والوصف والتنبيه الأكاديمي
    const roundName = round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني'; // 🏷️ اسم الدور
    const actionName = enable ? 'فتح وتفعيل' : 'إغلاق وحجب'; // 🏷️ اسم الإجراء

    // ⚠️ إذا كانت كافة المواد بالحالة المطلوبة أصلاً
    if (targetToModifyCourses.length === 0) { // 🔍 هل كل المواد بنفس الحالة المطلوبة؟
      setSuccessMessage(enable ? `كافة مواد ${roundName} مفتوحة ومفعّلة بالفعل! 🔓` : `كافة مواد ${roundName} مغلقة ومحجوبة بالفعل! 🔒`); // 💬 إشعار للمستخدم
      setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة
      return; // 🛑 إيقاف العملية لعدم الحاجة لأي تغيير
    } // 🔚 نهاية الفحص

    const alreadyOppositeCount = affectedCourses.length - targetToModifyCourses.length; // 🔢 المواد التي هي بالحالة المطلوبة بالفعل
    const semesterLabel = (courseIds && courseIds.length > 0) // 🏷️ تسمية النطاق
      ? `للمواد المحددة (${targetToModifyCourses.length})` // 📋 للمحدد
      : courseId // 🔍 لمادة مفردة
      ? `لمادة (${courseName || 'المحددة'})` // 📖 مادة واحدة
      : targetSemester === 1 // 📅 الكورس الأول
        ? 'لمواد الكورس الأول' // 1️⃣ الأول
        : targetSemester === 2 // 📅 الكورس الثاني
          ? 'لمواد الكورس الثاني' // 2️⃣ الثاني
          : 'لكافة مواد الكورسين'; // 🌟 الكورسين
    const stageLabel = (courseId || (courseIds && courseIds.length > 0)) ? '' : filterCourseStage === 'all' ? 'في كافة مراحل القسم' : `في المرحلة ${getStageNameInArabic(Number(filterCourseStage))}`; // 🏢 نص المرحلة

    let titleText = `تأكيد ${actionName} ${roundName}`; // 🏷️ عنوان النافذة
    let descriptionText = ''; // 📝 نص الوصف

    if (alreadyOppositeCount > 0 && affectedCourses.length > 1) { // 🔍 إذا كان هناك تفعيل جزئي (مثلاً 4 من 5)
      if (!enable) { // 🔒 حالة إغلاق المواد المفتوحة فقط
        titleText = `تأكيد إغلاق ${roundName} للمواد المفتوحة فقط (${targetToModifyCourses.length})`; // 🏷️ عنوان دقيق لإغلاق المفتوح فقط
        descriptionText = `أنت على وشك إغلاق وحجب ${roundName} لعدد (${targetToModifyCourses.length}) مادة مفتوحة فقط ${semesterLabel} ${stageLabel}؛ علماً أن هناك (${alreadyOppositeCount}) مادة مغلقة بالفعل ولا تحتاج إلى إغلاق.`; // 📝 إخبار المستخدم بدقة
      } else { // 🔓 حالة فتح المواد المغلقة المتبقية فقط
        titleText = `تأكيد فتح ${roundName} للمواد المتبقية (${targetToModifyCourses.length})`; // 🏷️ عنوان دقيق لفتح المتبقي فقط
        descriptionText = `أنت على وشك فتح وتفعيل ${roundName} لعدد (${targetToModifyCourses.length}) مادة مغلقة متبقية فقط ${semesterLabel} ${stageLabel}؛ حيث أن هناك (${alreadyOppositeCount}) مواد مفتوحة ومفعّلة بالفعل.`; // 📝 إخبار المستخدم بدقة
      } // 🔚 نهاية شرط الإجراء
    } else { // 🎯 الحالة العامة عندما يشمل الإجراء كافة المواد المستهدفة
      descriptionText = enable // 💡 التوصيف العام
        ? `أنت على وشك ${actionName} ${roundName} ${semesterLabel} ${stageLabel} لعدد (${targetToModifyCourses.length}) مادة. سيتمكن التدريسيون فوراً من رصد الدرجات وستظهر للطلبة.` // 🔓 فتح عام
        : `أنت على وشك ${actionName} ${roundName} ${semesterLabel} ${stageLabel} لعدد (${targetToModifyCourses.length}) مادة. سيتم إيقاف الرصد وحجب الدرجات واقتصار العرض على السعي التكويني.`; // 🔒 إغلاق عام
    } // 🔚 نهاية تحديد النصوص

    setRoundConfirmModal({ // 📦 فتح نافذة التأكيد الرسمية
      isOpen: true, // 🟢 إظهار المودال
      round, // 🏷️ الدور
      enable, // 🔑 تفعيل أو إغلاق
      targetSemester: targetSemester || 'all', // 📅 الكورس
      targetStage: filterCourseStage, // 🏢 المرحلة
      targetCourseId: courseId, // 🆔 معرف المادة المفردة
      targetCourseName: courseName, // 🏷️ اسم المادة المفردة
      targetCourseIds: targetToModifyCourses.map((c) => c.id), // 🎯 المعرفات التي سيتم تعديلها حصراً (المفتوحة فقط عند الغلق، والمغلقة فقط عند الفتح)
      affectedCount: targetToModifyCourses.length, // 🔢 عدد المواد المستهدفة فعلياً
      title: titleText, // 🏷️ العنوان الدقيق
      description: descriptionText, // 📝 الوصف المخصص
    }); // 🔚 نهاية إعداد المودال
  };

  // ⚡ 2. دالة تنفيذ عملية الفتح أو القفل بعد تأكيد وموافقة المستخدم الرسمية
  const executeConfirmToggleRoundAction = () => {
    if (!roundConfirmModal) return;
    const { round, enable, targetSemester, targetStage, targetCourseId, targetCourseIds } = roundConfirmModal;
    const nowIso = new Date().toISOString();
    const actorName = 'رئاسة القسم والمقرر';

    // 🎯 تحديد المعرفات المستهدفة بدقة
    let targetIds = new Set<string>();
    if (targetCourseIds && targetCourseIds.length > 0) {
      targetIds = new Set(targetCourseIds);
    } else if (targetCourseId) {
      targetIds.add(targetCourseId);
    } else {
      const matched = deptCourses.filter((c) => { // 🔍 نطلع المواد المطابقة للقسم
        const matchesStage = targetStage === 'all' || (Number(c.stage_number) || 1) === Number(targetStage); // 🏷️ مقارنة رقم المرحلة بعد التحويل لرقم
        const matchesSemester = targetSemester === 'all' || (Number(c.semester) || 1) === Number(targetSemester); // 📅 مقارنة رقم الكورس بعد التحويل لرقم
        return matchesStage && matchesSemester; // ✅ نرجع المادة إذا طابقت النطاق
      }); // 🔚 نهاية الفلترة
      targetIds = new Set(matched.map((c) => c.id)); // 🎯 نخزن المعرفات بمجموعة سريعة
    }

    // 🔄 تحديث المواد المستهدفة وتخزينها ومزامنتها سحابياً
    const updatedCourses = courses.map((c) => {
      if (targetIds.has(c.id)) {
        let edited: Course;
        if (round === 'final') {
          edited = {
            ...c,
            is_final_exam_enabled: enable,
            final_exam_opened_at: enable ? nowIso : undefined,
            final_exam_opened_by: enable ? actorName : undefined,
          };
        } else {
          edited = {
            ...c,
            is_supplementary_exam_enabled: enable,
            supplementary_exam_opened_at: enable ? nowIso : undefined,
            supplementary_exam_opened_by: enable ? actorName : undefined,
          };
        }
        saveCourseToSupabase(edited);
        return edited;
      }
      return c;
    });

    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);

    // 🚀 إطلاق أحداث التحديث الفوري
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    const roundName = round === 'final' ? 'الدور الأول' : 'الدور الثاني';
    const actionLabel = enable ? 'فتح وتفعيل' : 'إغلاق وحجب';
    if (targetCourseIds && targetCourseIds.length > 0) {
      setSelectedCourseIds([]);
    }

    // 🎯 تحديث الحالة المحلية داخل نافذة إضافة/تعديل المادة إذا كانت مفتوحة
    if (round === 'final') {
      setCourseIsFinalExamEnabled(enable);
    } else {
      setCourseIsSupplementaryEnabled(enable);
    }

    setSuccessMessage(`تم بنجاح ${actionLabel} ${roundName} لـ (${targetIds.size || 1}) مادة بنجاح تام! 🔒`);
    setTimeout(() => setSuccessMessage(''), 4500);

    // ❌ إغلاق نافذة التأكيد
    setRoundConfirmModal(null);
  };

  // 🔄 دوال الملاءمة المتوافقة مع أزرار الجدول الفردية
  const handleToggleCourseFinalExam = (targetCourse: Course) => {
    const isFinalActive = targetCourse.is_final_exam_enabled === true;
    requestToggleRoundAction({
      round: 'final',
      enable: !isFinalActive,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
    });
  };

  const handleToggleCourseSupplementaryExam = (targetCourse: Course) => {
    const isSupActive = targetCourse.is_supplementary_exam_enabled === true;
    requestToggleRoundAction({
      round: 'supplementary',
      enable: !isSupActive,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
    });
  };

  // 🛡️ دالة طلب تغيير حالة الدور من داخل نافذة إضافة أو تعديل المادة مع تأكيد رسمي
  const requestModalRoundToggle = (round: 'final' | 'supplementary', enable: boolean) => {
    const currentVal = round === 'final' ? courseIsFinalExamEnabled : courseIsSupplementaryEnabled;
    if (currentVal === enable) return; // لا تغيير إذا كانت نفس القيمة المحددة

    setRoundConfirmModal({
      isOpen: true,
      round,
      enable,
      targetSemester: (courseSemester || 1) as 1 | 2,
      targetStage: courseStage || 1,
      targetCourseId: editingCourseId || undefined,
      targetCourseName: courseName.trim() || 'المادة الدراسية',
      affectedCount: 1,
      title: enable 
        ? `تأكيد فتح وتفعيل ${round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني'}` 
        : `تأكيد إغلاق وحجب ${round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني'}`,
      description: enable
        ? `هل أنت متأكد من تفعيل وفتح ${round === 'final' ? 'الامتحان النهائي (من 50)' : 'رصد درجات الدور الثاني'} لهذه المادة؟ سيتمكن أستاذ المادة من إدخال الدرجات وتظهر للطلبة فور الاعتماد.`
        : `هل أنت متأكد من إغلاق وحجب ${round === 'final' ? 'الامتحان النهائي' : 'فترة الدور الثاني'} لهذه المادة؟ سيقتصر العرض على السعي الفصلي التكويني فقط (من 50).`,
    });
  };

  // ⚡ دالة تفعيل أو إغلاق الامتحان النهائي لكافة مواد المرحلة والكورس المحددين أو المواد المحددة بالاختيار
  const handleBulkToggleFinalExam = (enable: boolean) => { // 🎯 دالة التبديل الجماعي للامتحان النهائي
    if (enable && isBulkFinalOpen) { // 🔍 إذا كل المواد المستهدفة مفتوحة أصلاً وردنا نفتحها
      setSuccessMessage('الامتحان النهائي (الدور الأول) مفتوح ومفعّل بالفعل لكافة المواد المستهدفة! 🔓'); // 💬 رسالة تأكيد إيجابية
      setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة بعد 3 ثواني
      return; // 🛑 نوقف التنفيذ لأن هي مفتوحة مسبقاً
    } // 🔚 نهاية فحص الفتح
    if (!enable && !isBulkFinalOpen && !isBulkFinalPartial) { // 🔍 إذا المواد المستهدفة مقفولة أصلاً وردنا نقفلها
      setSuccessMessage('الامتحان النهائي (الدور الأول) مغلق ومحجوب بالفعل لكافة المواد المستهدفة! 🔒'); // 💬 رسالة تأكيد إيجابية
      setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة بعد 3 ثواني
      return; // 🛑 نوقف التنفيذ لأن هي مقفولة مسبقاً
    } // 🔚 نهاية فحص القفل
    requestToggleRoundAction({ // 🛡️ فتح مودال التأكيد الرسمي قبل التنفيذ
      round: 'final', // 🏷️ استهداف الدور الأول
      enable, // 🔑 حالة الفتح أو القفل المطلوبة
      courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined, // 📋 تمرير معرفات المواد المحددة إن وجدت
      targetSemester: (filterCourseSemester === 1 || filterCourseSemester === 2) ? filterCourseSemester : 'all', // 📅 حارس نوع دقيق يضمن تمرير 1 أو 2 أو all حصراً
    }); // 🔚 نهاية استدعاء المودال
  }; // 🔚 نهاية الدالة

  // ⚡ دالة تفعيل أو إغلاق الدور الثاني لكافة مواد المرحلة والكورس المحددين أو المواد المحددة بالاختيار
  const handleBulkToggleSupplementaryExam = (enable: boolean) => { // 🎯 دالة التبديل الجماعي للدور الثاني
    if (enable && isBulkSupOpen) { // 🔍 إذا الدور الثاني مفتوح أصلاً وردنا نفتحه
      setSuccessMessage('فترة رصد درجات الدور الثاني مفتوحة ومفعّلة بالفعل لكافة المواد المستهدفة! 🔓'); // 💬 رسالة تأكيد إيجابية
      setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة بعد 3 ثواني
      return; // 🛑 نوقف التنفيذ لأن هي مفتوحة مسبقاً
    } // 🔚 نهاية فحص الفتح
    if (!enable && !isBulkSupOpen && !isBulkSupPartial) { // 🔍 إذا الدور الثاني مقفول أصلاً وردنا نقفله
      setSuccessMessage('فترة رصد درجات الدور الثاني مغلقة ومحجوبة بالفعل لكافة المواد المستهدفة! 🔒'); // 💬 رسالة تأكيد إيجابية
      setTimeout(() => setSuccessMessage(''), 3000); // ⏱️ مسح الرسالة بعد 3 ثواني
      return; // 🛑 نوقف التنفيذ لأن هي مقفولة مسبقاً
    } // 🔚 نهاية فحص القفل
    requestToggleRoundAction({ // 🛡️ فتح مودال التأكيد الرسمي قبل التنفيذ
      round: 'supplementary', // 🏷️ استهداف الدور الثاني
      enable, // 🔑 حالة الفتح أو القفل المطلوبة
      courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined, // 📋 تمرير معرفات المواد المحددة إن وجدت
      targetSemester: (filterCourseSemester === 1 || filterCourseSemester === 2) ? filterCourseSemester : 'all', // 📅 حارس نوع دقيق يضمن تمرير 1 أو 2 أو all حصراً
    }); // 🔚 نهاية استدعاء المودال
  }; // 🔚 نهاية الدالة


  // ==========================================
  // 4️⃣ تكليف الأساتذة بالمواد (Course Assignments CRUD)
  // ==========================================
  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedCourseId) {
      setErrorMessage('يرجى اختيار الأستاذ والمادة الدراسية أولاً.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const teacher = deptTeachers.find((t) => t.id === selectedTeacherId);
    const course = deptCourses.find((c) => c.id === selectedCourseId);

    if (!teacher || !course) return;

    // فحص ما إذا كان التكليف موجوداً مسبقاً
    const alreadyAssigned = teacherCourses.some(
      (tc) => tc.teacher_id === selectedTeacherId && tc.course_id === selectedCourseId
    );

    if (alreadyAssigned) {
      setErrorMessage('هذا الأستاذ مكلف بالفعل بهذه المادة!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newTC: TeacherCourse = {
      id: `tc-${Date.now()}`,
      teacher_id: teacher.id,
      teacher_name: teacher.full_name,
      course_id: course.id,
      course_name: course.name,
      department_id: currentDeptId,
      role_in_course: selectedAssignRole, // 🏷️ صفة التكليف الأكاديمي (نظري / عملي / كلاهما)
      semester: course.semester || 1,
      created_at: new Date().toISOString(),
    };

    const updated = [...teacherCourses, newTC];
    setTeacherCourses(updated);
    saveStoredData('teacher_courses', updated);
    saveTeacherCourseToSupabase(newTC); // ☁️ مزامنة التكليف سحابياً

    // 🌟 تحديث المادة في قائمة المواد courses أيضاً ليصبح أستاذ النظري معرفاً ومباشراً
    let assignedCourseObj: Course | null = null;
    const updatedCourses = courses.map((c) => {
      if (c.id === course.id) {
        const uCourse: Course = {
          ...c,
          ...(selectedAssignRole === 'practical'
            ? { practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : selectedAssignRole === 'both'
            ? { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name, practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name }),
        };
        assignedCourseObj = uCourse;
        return uCourse;
      }
      return c;
    });
    setCourses(updatedCourses);
    saveStoredData('courses', updatedCourses);
    if (assignedCourseObj) {
      saveCourseToSupabase(assignedCourseObj); // ☁️ رفع وتحديث المادة في Supabase
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('teacher_courses_updated'));
      window.dispatchEvent(new Event('courses_updated'));
      window.dispatchEvent(new Event('profiles_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // 🔔 إرسال إشعار فوري للأستاذ المكلف
    sendAppNotification({
      recipient_id: teacher.id,
      recipient_role: 'teacher',
      title: ' تكليف أكاديمي جديد بمادة دراسية',
      message: `قام رئيس قسم (${deptName}) بتكليفك بتدريس مادة (${course.name}).`,
      type: 'course_assigned',
      link: '/teacher/dashboard',
    });

    setSelectedTeacherId('');
    setSelectedCourseId('');
    setIsAssignmentModalOpen(false);
    setSuccessMessage(`تم تكليف الأستاذ (${teacher.full_name}) بتدريس مادة (${course.name}) وإشعاره بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleRemoveAssignment = (id: string) => {
    const targetTC = teacherCourses.find((tc) => tc.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد إلغاء التكليف الدراسي',
      itemName: targetTC?.course_name || 'المادة',
      itemDetails: `الأستاذ المكلف: ${targetTC?.teacher_name || '—'} | قسم ${deptName}`,
      warningMessage: 'هل أنت متأكد من إلغاء تكليف هذا الأستاذ بتدريس هذه المادة؟',
      warningNote: 'سيتم إلغاء ارتباط الأستاذ بهذه المادة وتحديث الصلاحيات الأكاديمية فوراً.',
      confirmText: 'تأكيد إلغاء التكليف',
      variant: 'danger',
      iconType: 'user-minus',
      onConfirm: () => {
        const updated = teacherCourses.filter((tc) => tc.id !== id);
        setTeacherCourses(updated);
        saveStoredData('teacher_courses', updated);
        deleteTeacherCourseFromSupabase(id); // ☁️ حذف التكليف سحابياً

        // 🔄 تحديث وتوفيق المادة في جدول courses إذا تأثرت بإلغاء التكليف
        if (targetTC) {
          const courseId = targetTC.course_id;
          const remainingForCourse = updated.filter((tc: TeacherCourse): boolean => tc.course_id === courseId);
          const remTheory = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'theory' || tc.role_in_course === 'both');
          const remPractical = remainingForCourse.find((tc: TeacherCourse): boolean => tc.role_in_course === 'practical' || tc.role_in_course === 'both');

          const updatedCourses = courses.map((c: Course): Course => {
            if (c.id === courseId) {
              const newC: Course = {
                ...c,
                theory_teacher_id: remTheory ? remTheory.teacher_id : (c.theory_teacher_id === targetTC.teacher_id ? undefined : c.theory_teacher_id),
                theory_teacher_name: remTheory ? remTheory.teacher_name : (c.theory_teacher_id === targetTC.teacher_id ? undefined : c.theory_teacher_name),
                practical_teacher_id: remPractical ? remPractical.teacher_id : (c.practical_teacher_id === targetTC.teacher_id ? undefined : c.practical_teacher_id),
                practical_teacher_name: remPractical ? remPractical.teacher_name : (c.practical_teacher_id === targetTC.teacher_id ? undefined : c.practical_teacher_name),
              };
              saveCourseToSupabase(newC); // ☁️ مزامنة المادة المحدثة سحابياً
              return newC;
            }
            return c;
          });

          setCourses(updatedCourses);
          saveStoredData('courses', updatedCourses);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSuccessMessage('تم إلغاء التكليف الدراسي بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📚 دالة تكليف مادة لأستاذ محدد من داخل مودال تكليفات الأستاذ CRUD
  const handleAssignCourseToSpecificTeacher = (e: React.FormEvent) => {
    e.preventDefault(); // ✋ منع إعادة تحميل الصفحة
    if (!crudTeacher || !teacherCrudCourseId) { // ⚠️ فحص وجود الأستاذ والمادة
      setErrorMessage('يرجى اختيار المادة الدراسية لتكليف الأستاذ بها.'); // 🛑 رسالة خطأ
      setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح رسالة الخطأ بعد 3 ثواني
      return; // 🛑 خروج
    }

    const course = deptCourses.find((c) => c.id === teacherCrudCourseId); // 🔍 العثور على المادة
    if (!course) return; // 🛡️ حماية

    // 🔍 فحص ما إذا كان الأستاذ مكلفاً بهذه المادة مسبقاً
    const alreadyAssigned = teacherCourses.some(
      (tc) => tc.teacher_id === crudTeacher.id && tc.course_id === teacherCrudCourseId
    );

    if (alreadyAssigned) { // ⚠️ إذا كان التكليف موجوداً
      setErrorMessage('هذا الأستاذ مكلف بالفعل بتدريس هذه المادة!'); // 🛑 تنبيه
      setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح التنبيه
      return; // 🛑 خروج
    }

    const newTC: TeacherCourse = { // 📝 بناء كائن التكليف الجديد
      id: `tc-${Date.now()}`, // 🆔 توليد معرف فريد
      teacher_id: crudTeacher.id, // 🔗 معرف الأستاذ
      teacher_name: crudTeacher.full_name, // 👤 اسم الأستاذ
      course_id: course.id, // 🔗 معرف المادة
      course_name: course.name, // 📝 اسم المادة
      department_id: currentDeptId, // 🏢 معرف القسم
      semester: course.semester || 1, // 🗓️ الفصل الدراسي
      created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
    };

    const updated = [...teacherCourses, newTC]; // ➕ إضافة التكليف للمصفوفة
    setTeacherCourses(updated); // 🔄 تحديث الحالة
    saveStoredData('teacher_courses', updated); // 💾 حفظ محلي
    saveTeacherCourseToSupabase(newTC); // ☁️ مزامنة سحابية

    // 🌟 تحديث أستاذ المادة في قائمة المواد
    let assignedCourseObj: Course | null = null; // 📦 كائن المادة المحدث
    const updatedCourses = courses.map((c) => { // 🔄 تحديث المواد
      if (c.id === course.id) { // 🎯 إذا كانت هي المادة المستهدفة
        const uCourse: Course = { // 📝 بناء التحديث
          ...c, // 📦 نسخ الخصائص
          theory_teacher_id: crudTeacher.id, // 🔗 تثبيت معرف أستاذ النظري
          theory_teacher_name: crudTeacher.full_name, // 👤 تثبيت اسم أستاذ النظري
        };
        assignedCourseObj = uCourse; // 📦 حفظ المرجع
        return uCourse; // 🔄 إرجاع المادة المحدثة
      }
      return c; // 🔄 إبقاء باقي المواد
    });
    setCourses(updatedCourses); // 🔄 تحديث حالة المواد
    saveStoredData('courses', updatedCourses); // 💾 حفظ محلي
    if (assignedCourseObj) { // ☁️ رفع التحديث للسحابة
      saveCourseToSupabase(assignedCourseObj); // ☁️ مزامنة المادة مع Supabase
    }

    if (typeof window !== 'undefined') { // 🌐 إرسال أحداث التحديث
      window.dispatchEvent(new Event('teacher_courses_updated')); // 📢 إشعار تكليفات المواد
      window.dispatchEvent(new Event('courses_updated')); // 📢 إشعار المواد
      window.dispatchEvent(new Event('profiles_updated')); // 📢 إشعار الملفات
      window.dispatchEvent(new Event('storage')); // 📢 إشعار التخزين
    }

    // 🔔 إرسال إشعار فوري للأستاذ
    sendAppNotification({ // 📢 إشعار
      recipient_id: crudTeacher.id, // 👤 المستلم
      recipient_role: 'teacher', // 🏷️ دور المستلم
      title: 'تكليف أكاديمي جديد بمادة دراسية', // 🏷️ عنوان الإشعار
      message: `قام رئيس قسم (${deptName}) بتكليفك بتدريس مادة (${course.name}).`, // 📝 نص الإشعار
      type: 'course_assigned', // 🏷️ نوع الإشعار
      link: '/teacher/dashboard', // 🔗 رابط لوحة الأستاذ
    });

    setTeacherCrudCourseId(''); // 🧹 تصفير اختيار المادة
    setTeacherCrudSearchQuery(''); // 🧹 تصفير البحث
    setSuccessMessage(`تم بنجاح تكليف الأستاذ (${crudTeacher.full_name}) بمادة (${course.name})!`); // 🎉 رسالة نجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح رسالة النجاح
  };

  // 📝 دالة فتح مودال تعديل التكليف الأكاديمي (نفس مودال الـ CRUD الموحد الفاخر)
  const handleOpenEditAssignment = (tc: TeacherCourse) => {
    setEditingAssignment(tc); // 📌 تعيين التكليف المستهدف
    setSelectedTeacherId(tc.teacher_id); // 👤 تعيين الأستاذ المختار بالقائمة التفاعلية الفاخرة
    setSelectedCourseId(tc.course_id); // 📘 تعيين المادة المختارة بالقائمة التفاعلية الفاخرة
    setSelectedAssignRole(tc.role_in_course || 'theory'); // 🏷️ تحميل طبيعة التكليف الحالية (نظري أو عملي)
    setIsAssignmentModalOpen(true); // 🪟 فتح مودال الـ CRUD الموحد
  };

  // 💾 دالة حفظ تعديل التكليف الأكاديمي عبر المودال الموحد
  const handleSaveEditedAssignment = (e: React.FormEvent) => {
    e.preventDefault(); // ✋ منع إعادة التحميل
    if (!editingAssignment || !selectedTeacherId || !selectedCourseId) { // ⚠️ فحص الحقول
      setErrorMessage('يرجى التأكد من اختيار الأستاذ والمادة الدراسية.'); // 🛑 خطأ
      setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح الخطأ
      return; // 🛑 خروج
    }

    const teacher = deptTeachers.find((t) => t.id === selectedTeacherId); // 🔍 الأستاذ
    const course = deptCourses.find((c) => c.id === selectedCourseId); // 🔍 المادة
    if (!teacher || !course) return; // 🛡️ حماية

    // 🔍 فحص ما إذا كان التكليف مكرراً مع سجل تكليف آخر
    const isDuplicate = teacherCourses.some(
      (tc) => tc.id !== editingAssignment.id && tc.teacher_id === selectedTeacherId && tc.course_id === selectedCourseId
    );
    if (isDuplicate) { // ⚠️ إذا كان مكرراً
      setErrorMessage('هذا الأستاذ مكلف بالفعل بتدريس هذه المادة في سجل آخر!'); // 🛑 تنبيه
      setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح
      return; // 🛑 خروج
    }

    const updatedTC: TeacherCourse = { // 📝 بناء السجل المعدل
      ...editingAssignment, // 📦 نسخ الخصائص السابقة
      teacher_id: teacher.id, // 🔗 الأستاذ الجديد
      teacher_name: teacher.full_name, // 👤 اسم الأستاذ
      course_id: course.id, // 🔗 المادة الجديدة
      course_name: course.name, // 📝 اسم المادة
      role_in_course: selectedAssignRole, // 🏷️ صفة التكليف الأكاديمي المحدثة
      semester: course.semester || 1, // 🗓️ الكورس
    };

    const updatedList = teacherCourses.map((tc) => (tc.id === editingAssignment.id ? updatedTC : tc)); // 🔄 استبدال السجل
    setTeacherCourses(updatedList); // 🔄 تحديث الحالة
    saveStoredData('teacher_courses', updatedList); // 💾 حفظ محلي
    saveTeacherCourseToSupabase(updatedTC); // ☁️ مزامنة سحابية

    // 🌟 تحديث المادة القديمة والجديدة
    let updatedCourseObj: Course | null = null; // 📦 المادة المحدثة
    const updatedCourses = courses.map((c) => { // 🔄 تحديث مصفوفة المواد
      if (c.id === course.id) { // 🎯 المادة الجديدة
        const u = {
          ...c,
          ...(selectedAssignRole === 'practical'
            ? { practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : selectedAssignRole === 'both'
            ? { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name, practical_teacher_id: teacher.id, practical_teacher_name: teacher.full_name }
            : { theory_teacher_id: teacher.id, theory_teacher_name: teacher.full_name }),
        };
        updatedCourseObj = u; // 📦 حفظ
        return u; // 🔄 إرجاع
      }
      if (c.id === editingAssignment.course_id && editingAssignment.course_id !== course.id) { // 🎯 المادة القديمة إذا تغيرت
        return { ...c, theory_teacher_id: undefined, theory_teacher_name: undefined }; // 🧹 تفريغ الأستاذ القديم
      }
      return c; // 🔄 إبقاء الباقي
    });
    setCourses(updatedCourses); // 🔄 تحديث المواد
    saveStoredData('courses', updatedCourses); // 💾 حفظ محلي
    if (updatedCourseObj) { // ☁️ رفع للسحابة
      saveCourseToSupabase(updatedCourseObj); // ☁️ مزامنة Supabase
    }

    if (typeof window !== 'undefined') { // 🌐 إرسال الأحداث
      window.dispatchEvent(new Event('teacher_courses_updated')); // 📢 إشعار التكليفات
      window.dispatchEvent(new Event('courses_updated')); // 📢 إشعار المواد
      window.dispatchEvent(new Event('storage')); // 📢 إشعار التخزين
    }

    setIsAssignmentModalOpen(false); // 🔒 إغلاق المودال الموحد
    setEditingAssignment(null); // 🧹 تصفير السجل
    setSelectedTeacherId(''); // 🧹 تصفير الأستاذ
    setSelectedCourseId(''); // 🧹 تصفير المادة
    setSuccessMessage(`تم تعديل التكليف الأكاديمي بنجاح للأستاذ (${teacher.full_name})!`); // 🎉 نجاح
    setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح النجاح
  };

  // 🗑️ حذف جماعي للمواد المحددة
  const handleBulkDeleteCourses = () => {
    if (selectedCourseIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'حذف المواد المحددة دفعة واحدة',
      itemName: `${selectedCourseIds.length} مادة دراسية`,
      itemDetails: 'سيتم حذف كافة المواد المحددة من قاعدة بيانات القسم وإلغاء أي تكليفات أو جداول مرتبطة بها.',
      warningMessage: '⚠️ تحذير: هذا الإجراء سيؤدي لحذف المواد وسجلات الدرجات المقترنة بها نهائياً!',
      confirmText: `تأكيد حذف (${selectedCourseIds.length}) مادة`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        selectedCourseIds.forEach((id) => {
          deleteCourseFromSupabase(id); // ☁️ حذف المواد سحابياً
        });

        // 🔗 حذف كافة تكليفات المواد المحددة سحابياً ومحلياً
        const tcsToDelete = teacherCourses.filter((tc: TeacherCourse): boolean => selectedCourseIds.includes(tc.course_id));
        tcsToDelete.forEach((tc: TeacherCourse) => {
          deleteTeacherCourseFromSupabase(tc.id); // ☁️ حذف التكليفات سحابياً
        });
        const remainingAssignments = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedCourseIds.includes(tc.course_id));
        setTeacherCourses(remainingAssignments);
        saveStoredData('teacher_courses', remainingAssignments);

        const remainingCourses = courses.filter((c: Course): boolean => !selectedCourseIds.includes(c.id));
        setCourses(remainingCourses);
        saveStoredData('courses', remainingCourses);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedCourseIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedCourseIds.length}) مادة من القسم وتكليفاتها`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 🗑️ إلغاء جماعي للتكليفات المحددة
  const handleBulkRemoveAssignments = () => {
    if (selectedAssignmentIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'إلغاء التكليفات المحددة دفعة واحدة',
      itemName: `${selectedAssignmentIds.length} تكليف أكاديمي`,
      itemDetails: 'سيتم إلغاء التكليفات المحددة وسحب صلاحيات رصد الدرجات من الأساتذة المعنيين.',
      warningMessage: '⚠️ تنبيه: إلغاء التكليف سيزيل المادة من لوحة الأستاذ.',
      confirmText: `تأكيد إلغاء (${selectedAssignmentIds.length}) تكليف`,
      variant: 'warning',
      iconType: 'user-minus',
      onConfirm: () => {
        selectedAssignmentIds.forEach((id) => {
          deleteTeacherCourseFromSupabase(id); // ☁️ حذف التكليفات سحابياً
        });

        const remaining = teacherCourses.filter((tc: TeacherCourse): boolean => !selectedAssignmentIds.includes(tc.id));
        setTeacherCourses(remaining);
        saveStoredData('teacher_courses', remaining);

        // 🔄 توفيق كافة المواد بعد الحذف الجماعي للتكليفات
        const rec = reconcileCoursesWithTeacherCourses(courses, remaining, profiles);
        setCourses(rec.reconciledCourses);
        saveStoredData('courses', rec.reconciledCourses);
        rec.reconciledCourses.forEach((c: Course) => {
          saveCourseToSupabase(c); // ☁️ مزامنة المواد المحدثة سحابياً
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('teacher_courses_updated'));
          window.dispatchEvent(new Event('courses_updated'));
          window.dispatchEvent(new Event('storage'));
        }

        setSelectedAssignmentIds([]);
        setSuccessMessage(`تم بنجاح إلغاء (${selectedAssignmentIds.length}) تكليف وتحديث بيانات المواد.`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 🗑️ حذف جماعي لمحاضرات الجدول المحددة (مع كشف ذكي إذا تم تحديد كافة محاضرات المرحلة)
  const handleBulkDeleteScheduleLectures = () => {
    // 🛑 فحص أمان أولي: إذا ماكو أي محاضرة محددة نرجع فوراً
    if (selectedScheduleLectureIds.length === 0) return;

    // 📚 جلب محاضرات المرحلة الحالية للتأكد هل المستخدم محدد كل الجدول لو جزء منه
    const stageLectures = scheduleLectures.filter(
      (l) =>
        isLectureInCurrentDept(l) &&
        l.stage_number === selectedScheduleStage &&
        l.semester === selectedScheduleSemester &&
        (l.study_type || 'morning') === selectedScheduleStudyType
    );
    // 🌟 هل التحديد شامل 100% لكل محاضرات هذه المرحلة؟
    const isAllSelected =
      stageLectures.length > 0 &&
      stageLectures.every((l) => selectedScheduleLectureIds.includes(l.id));

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
        // ☁️ حذف المحاضرات سحابياً بدفعة واحدة من سوبابيز
        deleteScheduleLecturesBulkFromSupabase(selectedScheduleLectureIds);

        // 💾 تصفية وحفظ المحاضرات المتبقية بالتخزين المحلي
        const remaining = scheduleLectures.filter((l) => !selectedScheduleLectureIds.includes(l.id));
        setScheduleLectures(remaining);
        saveStoredData('schedule_lectures', remaining);
        setSelectedScheduleLectureIds([]);
        setSuccessMessage(
          isAllSelected
            ? `تم بنجاح تفريغ وحذف كافة محاضرات الجدول الأسبوعي (${selectedScheduleLectureIds.length} محاضرة)`
            : `تم بنجاح حذف (${selectedScheduleLectureIds.length}) محاضرة من الجدول الأسبوعي`
        );
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 🗑️ حذف جماعي لسجلات الدرجات والسعي المحددة
  const handleBulkDeleteGrades = () => {
    if (selectedGradeIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'حذف سجلات الدرجات المحددة',
      itemName: `${selectedGradeIds.length} سجل درجات وسعي`,
      itemDetails: 'سيتم حذف سجلات الدرجات للطلبة المحددين من قاعدة البيانات.',
      warningMessage: '⚠️ تحذير: سيتم مسح السعيات والدرجات المسجلة في السجلات المحددة نهائياً.',
      confirmText: `تأكيد حذف (${selectedGradeIds.length}) سجل`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const remaining = grades.filter((g) => !selectedGradeIds.includes(g.id));
        setGrades(remaining);
        saveStoredData('grades', remaining);
        setSelectedGradeIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedGradeIds.length}) سجل درجات`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // =========================================================================
  // 📊 دوال تصدير جداول Excel الرسمية (أساتذة، طلاب، مواد، تكليفات، درجات، حضور)
  // =========================================================================

  // 1️⃣ تصدير كادر أساتذة القسم إلى Excel (مع البريد الأكاديمي والرمز السري الرسمي)
  const handleExportTeachersExcel = async () => {
    try {
      setIsExportingTeachersExcel(true); // ⏳ نشغل علامة التحميل علمود المستخدم يعرف ديصدر
      // 🎯 نحدد الأساتذة: إذا محدد أستاذ معين نصدره، وإلا نصدر كادر القسم بالكامل
      const targetTeachers = selectedTeacherIds.length > 0
        ? deptTeachers.filter((t: UserProfile): boolean => selectedTeacherIds.includes(t.id))
        : deptTeachers;

      if (targetTeachers.length === 0) {
        setErrorMessage('لا يوجد أساتذة في القسم للتصدير حالياً.'); // ⚠️ تنبيه إذا ماكو أساتذة
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح التنبيه
        return; // 🛑 خروج
      }

      await exportCustomTeachersList(targetTeachers, deptName); // 📊 تصدير كشف الأساتذة مع البريد والرمز
      setSuccessMessage(`تم بنجاح تصدير كشف (${targetTeachers.length}) أستاذ بالبريد والرمز إلى ملف Excel! 📊`); // 💬 رسالة نجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح الرسالة
    } catch (error) {
      console.error('خطأ في تصدير أساتذة القسم:', error); // 🚨 طباعة الخطأ بالكونسول
      setErrorMessage('حدث خطأ أثناء تصدير ملف الإكسل للأساتذة.'); // 🛑 إشعار بالخطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح الإشعار
    } finally {
      setIsExportingTeachersExcel(false); // 🛑 نوقف علامة التحميل
    }
  };

  // 2️⃣ تصدير كشف طلبة القسم إلى Excel (مع الرقم الجامعي، المرحلة، الفترة، البريد، والرمز السري)
  const handleExportStudentsExcel = async () => {
    try {
      setIsExportingStudentsExcel(true); // ⏳ تشغيل مؤشر تصدير كشف الطلبة
      // 🎯 نحدد الطلبة: إما المحددين يدوياً أو المفلترين حسب المرحلة والدراسة أو كل طلاب القسم
      const targetStudents = selectedStudentIds.length > 0
        ? deptStudents.filter((s: UserProfile): boolean => selectedStudentIds.includes(s.id))
        : (filteredStudents.length > 0 ? filteredStudents : deptStudents);

      if (targetStudents.length === 0) {
        setErrorMessage('لا يوجد طلاب في القسم للتصدير حالياً.'); // ⚠️ تنبيه بعدم وجود طلاب
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح التنبيه
        return; // 🛑 خروج
      }

      await exportCustomStudentsList(targetStudents, deptName); // 📊 توليد ملف الإكسل المعتمد للطلبة
      setSuccessMessage(`تم بنجاح تصدير كشف (${targetStudents.length}) طالب بالرقم الجامعي والبريد والرمز إلى ملف Excel! 📊`); // 💬 إشعار نجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح الإشعار
    } catch (error) {
      console.error('خطأ في تصدير طلبة القسم:', error); // 🚨 طباعة بالكونسول
      setErrorMessage('حدث خطأ أثناء تصدير ملف الإكسل للطلاب.'); // 🛑 رسالة خطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح الرسالة
    } finally {
      setIsExportingStudentsExcel(false); // 🛑 إيقاف مؤشر التحميل
    }
  };

  // 3️⃣ تصدير كشف المواد والمقررات الدراسية إلى Excel
  const handleExportCoursesExcel = async () => {
    try {
      setIsExportingCoursesExcel(true); // ⏳ تشغيل مؤشر تصدير المواد
      // 🎯 نحدد المقررات: المحددة بالـ Checkbox أو المفلترة أو كل مواد القسم
      const targetCourses = selectedCourseIds.length > 0
        ? deptCourses.filter((c: Course): boolean => selectedCourseIds.includes(c.id))
        : (filteredCourses.length > 0 ? filteredCourses : deptCourses);

      if (targetCourses.length === 0) {
        setErrorMessage('لا توجد مواد دراسية في القسم للتصدير حالياً.'); // ⚠️ تنبيه إذا ماكو مواد
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح التنبيه
        return; // 🛑 خروج
      }

      // 🧹 تهيئة قائمة المواد وربط أسماء التدريسيين للنظري والعملي بدقة
      const formattedCourses = targetCourses.map((c: Course) => {
        const matchedTheoryTeacher = c.theory_teacher_id
          ? deptTeachers.find((t: UserProfile): boolean => t.id === c.theory_teacher_id)
          : undefined; // 🔍 مطابقة أستاذ النظري
        const theoryTeacherName = c.theory_teacher_name || matchedTheoryTeacher?.full_name; // 👤 اسم أستاذ النظري

        const matchedPracticalTeacher = c.practical_teacher_id
          ? deptTeachers.find((t: UserProfile): boolean => t.id === c.practical_teacher_id)
          : undefined; // 🔍 مطابقة أستاذ العملي
        const practicalTeacherName = c.practical_teacher_name || matchedPracticalTeacher?.full_name; // 👤 اسم أستاذ العملي

        return {
          code: c.code, // 🏷️ رمز المادة
          name: c.name, // 📘 اسم المادة
          department_name: deptName, // 🏢 اسم القسم
          stage_number: c.stage_number || 1, // 🎓 رقم المرحلة
          semester: c.semester || 1, // 🗓️ الفصل الدراسي
          course_type: c.course_type, // 🔬 نوع المادة
          theory_teacher_name: theoryTeacherName, // 👨‍🏫 تدريسي النظري
          practical_teacher_name: practicalTeacherName, // 🧪 تدريسي العملي
          credit_hours: c.credit_hours || 3, // ⏱️ عدد الوحدات
        };
      });

      await exportCustomCoursesList(formattedCourses, deptName); // 📊 تصدير كشف المواد والوحدات والأساتذة
      setSuccessMessage(`تم بنجاح تصدير كشف (${formattedCourses.length}) مادة دراسية إلى ملف Excel! 📊`); // 💬 رسالة تأكيد
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح التأكيد
    } catch (error) {
      console.error('خطأ في تصدير المواد الدراسية:', error); // 🚨 طباعة
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل المواد.'); // 🛑 تنبيه بالخطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح
    } finally {
      setIsExportingCoursesExcel(false); // 🛑 إطفاء مؤشر التحميل
    }
  };

  // 4️⃣ تصدير قائمة تكليفات الكادر التدريسي إلى Excel
  const handleExportAssignmentsExcel = async () => {
    try {
      setIsExportingAssignmentsExcel(true); // ⏳ تشغيل مؤشر تصدير التكليفات
      // 🎯 نحدد التكليفات: إما المحددة أو المفلترة أو تكليفات القسم بالكامل
      const targetAssignments = selectedAssignmentIds.length > 0
        ? deptTeacherCourses.filter((tc: TeacherCourse): boolean => selectedAssignmentIds.includes(tc.id))
        : (filteredTeacherCourses.length > 0 ? filteredTeacherCourses : deptTeacherCourses);

      if (targetAssignments.length === 0) {
        setErrorMessage('لا توجد تكليفات تدريسية في القسم للتصدير حالياً.'); // ⚠️ تنبيه
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح
        return; // 🛑 خروج
      }

      // 🔄 تجهيز وتنسيق بيانات التكليفات مع البريد الأكاديمي ورموز المقررات
      const formattedAssignments = targetAssignments.map((tc: TeacherCourse) => {
        const teacher = deptTeachers.find((t: UserProfile) => t.id === tc.teacher_id);
        const course = deptCourses.find((c: Course) => c.id === tc.course_id);
        return {
          teacher_name: tc.teacher_name || teacher?.full_name || 'غير معروف',
          teacher_email: teacher?.generated_email || '—',
          course_name: tc.course_name || course?.name || 'غير معروف',
          course_code: course?.code || '—',
          stage_number: course?.stage_number || 1,
          semester: tc.semester || course?.semester || 1,
          role_in_course: tc.role_in_course,
          created_at: tc.created_at,
        };
      });

      await exportCustomTeacherCoursesList(formattedAssignments, deptName); // 📊 تصدير جدول التكليفات الرسمي
      setSuccessMessage(`تم بنجاح تصدير (${formattedAssignments.length}) تكليف تدريسي إلى ملف Excel! 📊`); // 💬 نجاح التصدير
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح
    } catch (error) {
      console.error('خطأ في تصدير التكليفات:', error); // 🚨 طباعة
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل التكليفات.'); // 🛑 خطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح
    } finally {
      setIsExportingAssignmentsExcel(false); // 🛑 إيقاف مؤشر التحميل
    }
  };

  // 5️⃣ تصدير سجلات درجات وسعيات مسار بولونيا إلى Excel
  const handleExportGradesExcel = async () => {
    try {
      setIsExportingGradesExcel(true); // ⏳ تشغيل مؤشر تصدير درجات بولونيا
      // 🎯 نحدد سجلات الدرجات: المحددة بالاختيار أو المفلترة أو جميع درجات القسم
      const targetGrades = selectedGradeIds.length > 0
        ? deptGrades.filter((g: Grade): boolean => selectedGradeIds.includes(g.id))
        : (filteredGrades.length > 0 ? filteredGrades : deptGrades);

      if (targetGrades.length === 0) {
        setErrorMessage('لا توجد سجلات درجات وسعيات في القسم للتصدير حالياً.'); // ⚠️ تنبيه
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح
        return; // 🛑 خروج
      }

      // 💯 تجهيز كافة تفاصيل السعي الـ 7 والامتحان النهائي والمجموع الحقيقي
      const formattedGrades = targetGrades.map((g: Grade) => { // 🔄 تكرار على سجلات الدرجات
        const student = deptStudents.find((s: UserProfile): boolean => s.id === g.student_id); // 👤 مطابقة بيانات الطالب
        const course = deptCourses.find((c: Course): boolean => c.id === g.course_id); // 📘 مطابقة المادة الدراسية
        const q1 = g.quiz1 ?? 0; // 📝 درجة كويز 1
        const q2 = g.quiz2 ?? 0; // 📝 درجة كويز 2
        const a1 = g.assignment1 ?? 0; // 📑 درجة واجب 1
        const a2 = g.assignment2 ?? 0; // 📑 درجة واجب 2
        const rep = g.report ?? 0; // 📄 درجة التقرير والمشروع
        const mid = g.midterm ?? 0; // 🎯 درجة امتحان نصف الفصل
        const prac = g.practical ?? 0; // 🔬 درجة العملي
        const coursework = g.final_coursework_total ?? (q1 + q2 + a1 + a2 + rep + mid + prac); // 💯 مجموع السعي الفصلي من 50
        const finalEx = g.final_exam ?? 0; // 📝 درجة الامتحان النهائي من 50
        const suppEx = g.supplementary_exam ?? null; // 🔄 درجة الدور الثاني إن وجدت
        const effectiveFinal = (suppEx !== null && suppEx !== undefined) ? suppEx : finalEx; // ⚖️ النهائي الفعلي المعتمد
        const total = g.final_total ?? (coursework + effectiveFinal); // 🎓 المجموع الكلي النهائي من 100

        return { // 📦 إرجاع كائن السجل المنسق للإكسل
          student_name: student?.full_name || 'طالب غير معروف', // 👤 اسم الطالب الثلاثي
          university_number: student?.university_number || '—', // 🆔 الرقم الجامعي
          course_name: course?.name || 'مادة غير معروفة', // 📘 اسم المادة
          quiz1: q1, // 📝 كويز 1
          quiz2: q2, // 📝 كويز 2
          assignment1: a1, // 📑 واجب 1
          assignment2: a2, // 📑 واجب 2
          report: rep, // 📄 تقرير ومشاريع
          midterm: mid, // 🎯 نصف الفصل
          practical: prac, // 🔬 العملي
          final_coursework_total: coursework, // 💯 مجموع السعي (50)
          final_exam: finalEx, // 📝 النهائي (50)
          supplementary_exam: suppEx, // 🔄 الدور الثاني
          final_total: total, // 🎓 المجموع الكلي (100)
          letter_grade: g.letter_grade || (total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : total >= 50 ? 'E' : 'F'), // 🅰️ التقدير الحرفي
          is_locked: g.is_locked || false, // 🔒 حالة اعتماد السعي
        }; // 🔚 نهاية إرجاع الكائن
      }); // 🔚 نهاية التحويل

      const selectedCourseName = filterGradeCourse !== 'all' // 🔍 اسم المادة المفلترة
        ? (deptCourses.find((c: Course): boolean => c.id === filterGradeCourse)?.name || 'مادة_محددة') // 📘 اسم المادة المحددة
        : 'كافة المواد'; // 🌐 التصدير لكافة المواد

      await exportCustomGradesList(formattedGrades, deptName, selectedCourseName); // 📊 تصدير سجل بولونيا بالبنود الـ 7 والنهائي والمجموع والتقدير
      setSuccessMessage(`تم بنجاح تصدير (${formattedGrades.length}) سجل درجات وسعي بولونيا إلى ملف Excel! 📊`); // 💬 نجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح
    } catch (error) { // 🚨 التقاط الخطأ
      console.error('خطأ في تصدير درجات بولونيا:', error); // 🚨 كونسول
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل الدرجات.'); // 🛑 خطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح
    } finally { // 🏁 مرحلة الإنهاء
      setIsExportingGradesExcel(false); // 🛑 إيقاف مؤشر التحميل
    } // 🔚 نهاية معالجة الخطأ
  }; // 🔚 نهاية دالة تصدير الدرجات

  // 6️⃣ تصدير كشف الحضور والغيابات ونسب الإنذار لبولونيا إلى Excel
  const handleExportAttendanceExcel = async () => { // 📤 دالة تصدير كشف الحضور إلى إكسل
    try { // 🛡️ حماية التنفيذ
      setIsExportingAttendanceExcel(true); // ⏳ تشغيل مؤشر تصدير الحضور
      // 🎯 تحديد الطلبة المستهدفين: إما المحددين بجدول الحضور أو حسب فلتر المرحلة الحالية
      const targetStudents = selectedAttendanceStudentIds && selectedAttendanceStudentIds.length > 0 // 🔍 هل يوجد طلاب محددون؟
        ? deptStudents.filter((s: UserProfile): boolean => selectedAttendanceStudentIds.includes(s.id)) // 🎯 أخذ الطلاب المحددين فقط
        : (filterAttendanceStage !== 'all' // 📚 هل هناك فلترة للمرحلة؟
            ? deptStudents.filter((s: UserProfile): boolean => (s.stage_number || 1) === filterAttendanceStage) // 🎓 أخذ طلاب المرحلة المحددة
            : deptStudents); // 🌐 أخذ جميع طلاب القسم

      if (targetStudents.length === 0) { // ⚠️ التحقق من وجود طلاب
        setErrorMessage('لا يوجد طلاب في القسم لتصدير سجلات حضورهم حالياً.'); // ⚠️ تنبيه
        setTimeout(() => setErrorMessage(''), 3000); // ⏱️ مسح
        return; // 🛑 خروج
      } // 🔚 نهاية التحقق

      // 🎯 تصفية المقررات التابعة للقسم المتوافقة مع فلاتر المرحلة والكورس والمادة
      const targetCourses = deptCourses.filter((c: Course): boolean => { // 🔄 تصفية المقررات
        if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false; // 🚫 استبعاد المراحل الأخرى
        if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false; // 🚫 استبعاد الكورسات الأخرى
        if (filterAttendanceCourse !== 'all' && c.id !== filterAttendanceCourse) return false; // 🚫 استبعاد المواد الأخرى
        return true; // ✅ الاحتفاظ بالمادة المطابقة
      }); // 🔚 نهاية تصفية المقررات

      const effectiveCourses = targetCourses.length > 0 ? targetCourses : deptCourses; // 🎯 المقررات الفعلية المستهدفة

      // 📅 أخذ سجلات الأسبوع المفلتر أو كافة الأسابيع
      const effectiveRecords = filterAttendanceWeek === 'all' // 🗓️ فحص فلتر الأسبوع
        ? attendanceRecords // 🌐 كافة السجلات
        : attendanceRecords.filter((r: StudentAttendanceRecord): boolean => r.week_number === filterAttendanceWeek); // 🎯 سجلات الأسبوع المختار

      // ⏱️ احتساب نسب وساعات الغياب والإنذارات الأكاديمية لكل طالب ومادة بدقة
      const formattedAttendanceRecords: { // 📋 قائمة السجلات المجهزة للتصدير
        student_name: string; // 👤 اسم الطالب
        university_number: string; // 🆔 الرقم الجامعي
        stage_number: number; // 🎓 المرحلة
        study_type: 'morning' | 'evening'; // ☀️ الفترة
        course_name: string; // 📘 المادة
        total_hours: number; // ⏳ الساعات المقررة
        unexcused_hours: number; // 🔴 بدون عذر
        excused_hours: number; // 🟡 بعذر
        absence_percentage: number; // 📊 النسبة %
        warning_status: 'none' | 'first_warning' | 'final_warning' | 'dismissed'; // ⚠️ الإنذار
        notes?: string; // 📝 ملاحظات
      }[] = []; // 📦 مصفوفة فارغة في البداية

      for (const st of targetStudents) { // 🔄 دوران على كل طالب
        for (const c of effectiveCourses) { // 🔄 دوران على كل مادة
          const summary = calculateStudentCourseAttendance( // 🧮 حساب خلاصة حضور المادة
            st.id, // 🆔 معرف الطالب
            c.id, // 🆔 معرف المادة
            effectiveRecords, // 📋 سجلات الحضور الفعلية
            c.name, // 📘 اسم المادة
            c.code, // 🏷️ رمز المادة
            c.credit_hours || 3 // ⏱️ الساعات المعتمدة
          ); // 🔚 نهاية الاحتساب

          // ⚠️ تحويل حالة الإنذار للنوع المطلوب بدقة
          let mappedWarning: 'none' | 'first_warning' | 'final_warning' | 'dismissed' = 'none'; // 🛑 الحالة الافتراضية
          if (summary.warning_status === 'warning_1') mappedWarning = 'first_warning'; // ⚠️ إنذار أولي
          else if (summary.warning_status === 'warning_2') mappedWarning = 'final_warning'; // 🚨 إنذار نهائي
          else if (summary.warning_status === 'banned') mappedWarning = 'dismissed'; // 🚫 حرمان وتجاوز

          formattedAttendanceRecords.push({ // ➕ إضافة سجل حضور منسق للقائمة
            student_name: st.full_name, // 👤 اسم الطالب الثلاثي
            university_number: st.university_number || '—', // 🆔 الرقم الجامعي
            stage_number: st.stage_number || c.stage_number || 1, // 🎓 رقم المرحلة
            study_type: st.study_type === 'evening' ? 'evening' : 'morning', // ☀️ نوع الدراسة صباحي أو مسائي
            course_name: c.name, // 📘 اسم المادة الدراسية
            total_hours: summary.total_scheduled_hours || 45, // ⏳ إجمالي ساعات المادة المعتمدة
            unexcused_hours: summary.total_unexcused_absence_hours, // 🔴 ساعات الغياب غير المبرر
            excused_hours: summary.total_excused_absence_hours, // 🟡 ساعات الإجازات الرسمية
            absence_percentage: summary.absence_percentage, // 📊 نسبة الغياب غير المبرر
            warning_status: mappedWarning, // ⚠️ الموقف الأكاديمي للإنذار
            notes: mappedWarning !== 'none' ? 'إنذار أكاديمي رسمي' : 'دوام منتظم', // 📝 ملاحظات إضافية
          }); // 🔚 نهاية إضافة السجل
        } // 🔚 حلقة المواد
      } // 🔚 حلقة الطلاب

      await exportCustomAttendanceList(formattedAttendanceRecords, deptName); // 📊 تصدير الحضور ونسب الغياب والإنذارات
      setSuccessMessage(`تم بنجاح تصدير كشف الغيابات والإنذارات لـ (${targetStudents.length}) طالب إلى ملف Excel! 📊`); // 💬 نجاح
      setTimeout(() => setSuccessMessage(''), 4000); // ⏱️ مسح
    } catch (error) {
      console.error('خطأ في تصدير الحضور والغيابات:', error); // 🚨 كونسول
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل الحضور.'); // 🛑 خطأ
      setTimeout(() => setErrorMessage(''), 4000); // ⏱️ مسح
    } finally {
      setIsExportingAttendanceExcel(false); // 🛑 إيقاف المؤشر
    }
  };

  // ==========================================
  // 5️⃣ إدارة أيام الدوام والعطل الأسبوعية الرسمية (Working & Off Days)
  // ==========================================
  const currentScheduleConfig = getScheduleConfigOrDefault(
    scheduleConfigs,
    currentDeptId,
    selectedScheduleStage,
    selectedScheduleSemester
  );

  // ⚡ احتساب الأسبوع الأكاديمي الحالي للجدول نسبة لتاريخ انطلاق الفصل
  const scheduleCurrentAcademicWeek = useMemo(() => {
    return getCurrentAcademicWeek(currentScheduleConfig.start_date || '2026-09-20');
  }, [currentScheduleConfig.start_date]);

  // 🔄 مزامنة الأسبوع المختار مع الأسبوع الحالي تلقائياً عند تغيير تاريخ انطلاق الفصل
  useEffect(() => {
    const curW = getCurrentAcademicWeek(currentScheduleConfig.start_date || '2026-09-20');
    setSelectedScheduleWeek(curW);
  }, [currentScheduleConfig.start_date]);

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
  }, [currentDeptId]);

  // 🗓️ تبديل حالة اليوم بين دوام وعطلة بعد أخذ موافقة وتأكيد المستخدم
  const handleToggleWorkingDay = (dayKey: DayOfWeek) => {
    const isCurrentlyOff = currentScheduleConfig.off_days.includes(dayKey);
    const dayName = DAYS_OF_WEEK_LIST.find((d) => d.key === dayKey)?.label_ar || dayKey;
    const stageName = getStageNameInArabic(selectedScheduleStage);
    const semesterName = selectedScheduleSemester === 1 ? 'الأول' : 'الثاني';

    // حساب عدد المحاضرات المجدولة لهذا اليوم
    const dayLecturesCount = scheduleLectures.filter(
      (l) =>
        isLectureInCurrentDept(l) &&
        l.stage_number === selectedScheduleStage &&
        l.semester === selectedScheduleSemester &&
        l.day === dayKey
    ).length;

    const actionTitle = isCurrentlyOff
      ? `تأكيد تفعيل يوم (${dayName}) كيوم دوام رسمي`
      : `تأكيد تحويل يوم (${dayName}) إلى عطلة رسمية`;

    const actionWarning = isCurrentlyOff
      ? `هل أنت متأكد من تفعيل يوم (${dayName}) كيوم دوام رسمي معتمد وإتاحته لجدولة المحاضرات لطلبة ${stageName} (الكورس ${semesterName})؟`
      : dayLecturesCount > 0
      ? `تنبيه: هذا اليوم يحتوي حالياً على (${dayLecturesCount}) محاضرة مجدولة. تحويله إلى عطلة رسمية سيؤثر على جدول المرحلة ${stageName} ولن يتم احتساب المحاضرات فيه كأيام دوام رسمي. هل ترغب بالاستمرار والموافقة؟`
      : `هل أنت متأكد من تحويل يوم (${dayName}) إلى عطلة رسمية معتمدة لطلبة ${stageName} (الكورس ${semesterName})؟`;

    const confirmBtnText = isCurrentlyOff
      ? 'نعم، تفعيل كيوم دوام رسمي'
      : 'نعم، تحويل إلى عطلة رسمية';

    setDeleteModalConfig({
      isOpen: true,
      title: actionTitle,
      itemName: `يوم ${dayName} — ${stageName} (الكورس ${semesterName})`,
      itemDetails: isCurrentlyOff
        ? 'الحالة الحالية: عطلة رسمية معتمدة'
        : `الحالة الحالية: يوم دوام رسمي ${dayLecturesCount > 0 ? `(يحتوي على ${dayLecturesCount} محاضرة مجدولة)` : '(لا توجد محاضرات مجدولة)'}`,
      warningMessage: actionWarning,
      confirmText: confirmBtnText,
      variant: isCurrentlyOff ? 'success' : 'warning',
      iconType: isCurrentlyOff ? 'check' : 'alert',
      onConfirm: () => {
        let newWorkingDays: DayOfWeek[];
        let newOffDays: DayOfWeek[];

        if (isCurrentlyOff) {
          // تحويله إلى يوم دوام
          newOffDays = currentScheduleConfig.off_days.filter((d) => d !== dayKey);
          newWorkingDays = [...currentScheduleConfig.working_days.filter((d) => d !== dayKey), dayKey];
        } else {
          // تحويله إلى يوم عطلة
          newWorkingDays = currentScheduleConfig.working_days.filter((d) => d !== dayKey);
          newOffDays = [...currentScheduleConfig.off_days.filter((d) => d !== dayKey), dayKey];
        }

        const updatedConfig: DepartmentScheduleConfig = {
          ...currentScheduleConfig,
          department_id: currentDeptId,
          stage_number: selectedScheduleStage,
          semester: selectedScheduleSemester,
          working_days: newWorkingDays,
          off_days: newOffDays,
          updated_at: new Date().toISOString(),
        };

        const existingIndex = scheduleConfigs.findIndex(
          (c) =>
            c.department_id === currentDeptId &&
            c.stage_number === selectedScheduleStage &&
            c.semester === selectedScheduleSemester
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

        setSuccessMessage(`تم تعديل يوم (${dayName}) إلى ${isCurrentlyOff ? 'يوم دوام رسمي' : 'عطلة رسمية'} بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // استعادة أيام الدوام والعطل الافتراضية (السبت إلى الأربعاء دوام، الخميس والجمعة عطلة)
  const handleResetWorkingDays = () => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'استعادة أيام الدوام الافتراضية',
      itemName: `جدول دوام قسم ${deptName}`,
      itemDetails: `المرحلة ${selectedScheduleStage} - الفصل ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'}`,
      warningMessage: 'هل تريد استعادة أيام الدوام الافتراضية (السبت إلى الأربعاء دوام، والخميس والجمعة عطلة رسمية)؟',
      confirmText: 'استعادة الافتراضي',
      onConfirm: () => {
        const resetConfig: DepartmentScheduleConfig = {
          ...currentScheduleConfig,
          department_id: currentDeptId,
          stage_number: selectedScheduleStage,
          semester: selectedScheduleSemester,
          working_days: [...DEFAULT_WORKING_DAYS],
          off_days: [...DEFAULT_OFF_DAYS],
          updated_at: new Date().toISOString(),
        };

        const updatedList = scheduleConfigs.filter(
          (c) =>
            !(
              c.department_id === currentDeptId &&
              c.stage_number === selectedScheduleStage &&
              c.semester === selectedScheduleSemester
            )
        );
        updatedList.push(resetConfig);

        setScheduleConfigs(updatedList);
        saveStoredData('department_schedule_configs', updatedList);
        saveScheduleConfigToSupabase(resetConfig); // ☁️ حفظ ومزامنة استعادة الجدول مع Supabase
        setSuccessMessage('تمت استعادة إعدادات أيام الدوام الافتراضية بنجاح!');
        setTimeout(() => setSuccessMessage(''), 3500);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📅 دالة حفظ وتثبيت تاريخ انطلاق الفصل الدراسي لكافة مراحل وكورسات القسم في Supabase و LocalStorage
  const handleSaveSemesterStartDate = (newStartDate: string) => {
    if (!newStartDate || !currentDeptId) return; // 🛑 حماية إذا ماكو تاريخ أو معرف قسم

    // 🌟 1. تحديث تاريخ انطلاق الفصل لكافة المراحل الأربعة وكلا الكورسين في القسم لضمان التوحيد الشامل 100%
    const stages = [1, 2, 3, 4]; // 🎓 قائمة بكافة المراحل الدراسية للقسم
    const semesters: (1 | 2)[] = [1, 2]; // 🗓️ كلا الكورسين الأول والثاني
    const updatedConfigsList: DepartmentScheduleConfig[] = [...scheduleConfigs]; // 📋 استنساخ قائمة الإعدادات الحالية

    // 🔄 دوران على كل مرحلة وكل كورس لتثبيت نفس التاريخ المعتمد للقسم
    stages.forEach((stg) => {
      semesters.forEach((sem) => {
        const existingIdx = updatedConfigsList.findIndex(
          (c) => c.department_id === currentDeptId && c.stage_number === stg && c.semester === sem
        ); // 🔍 فحص هل الإعداد موجود مسبقاً
        if (existingIdx >= 0) {
          const cfgToUpdate: DepartmentScheduleConfig = {
            ...updatedConfigsList[existingIdx], // 📦 أخذ باقي الحقول مثل أيام الدوام والعطل
            start_date: newStartDate, // 📅 اعتماد التاريخ الجديد المختار
            updated_at: new Date().toISOString(), // ⏰ وقت التحديث الحالي
          };
          updatedConfigsList[existingIdx] = cfgToUpdate; // 🔄 تحديث العنصر بالقائمة
          saveScheduleConfigToSupabase(cfgToUpdate); // ☁️ حفظ سحابي في قاعدة بيانات Supabase
        } else {
          const newCfg: DepartmentScheduleConfig = {
            id: `cfg-${currentDeptId}-${stg}-${sem}`, // 🆔 توليد معرف فريد للإعداد
            department_id: currentDeptId, // 🏢 معرف القسم الحالي
            stage_number: stg, // 🎓 رقم المرحلة
            semester: sem, // 🗓️ رقم الكورس
            start_date: newStartDate, // 📅 تاريخ الانطلاق الجديد
            working_days: [...DEFAULT_WORKING_DAYS], // 🏢 أيام الدوام الافتراضية
            off_days: [...DEFAULT_OFF_DAYS], // 🏖️ أيام العطل الافتراضية
            updated_at: new Date().toISOString(), // ⏰ وقت الإنشاء
          };
          updatedConfigsList.push(newCfg); // ➕ إضافة الإعداد الجديد للقائمة
          saveScheduleConfigToSupabase(newCfg); // ☁️ حفظ سحابي في قاعدة بيانات Supabase
        }
      });
    });

    setScheduleConfigs(updatedConfigsList); // 💾 تحديث الحالة في الذاكرة فورياً حتى تنعكس بكل الشاشات
    saveStoredData('department_schedule_configs', updatedConfigsList); // 💾 حفظ الإعدادات المحدثة محلياً بالمتصفح

    // 🔒 حفظ مفتاح تاريخ الانطلاق المركزي للقسم في التخزين المحلي ليكون مرجعاً مطلقاً
    try {
      localStorage.setItem(`department_semester_start_date_${currentDeptId}`, newStartDate); // 💾 تخزين المفتاح المركزي
    } catch {
      // 🛡️ حماية من أخطاء التخزين المحلي
    }

    // 🔄 2. إعادة معايرة وتحديث تواريخ كافة محاضرات القسم المجدولة في كافة المراحل والأسابيع الـ 15 فورياً
    const recalibratedLectures = scheduleLectures.map((l) => {
      if (isLectureInCurrentDept(l)) { // 🏢 فحص هل المحاضرة تابعة لنفس القسم
        const wk = l.week_number || 1; // 🔢 رقم الأسبوع الحالي للمحاضرة
        const newBaseDate = calculateDateForAnyDayInWeek(newStartDate, 1, wk, l.day); // 🧮 احتساب التاريخ الجديد المطابق لليوم
        const all15 = generateAll15WeeksDates(newBaseDate, l.day, wk); // 🌟 توليد واحتساب تواريخ كافة الأسابيع الـ 15 (+7 أيام لكل أسبوع)
        const map15: Record<number, string> = {}; // 🗺️ خريطة التواريخ للأسابيع
        all15.forEach((item) => {
          map15[item.weekNumber] = item.date; // 📌 ربط رقم الأسبوع بتاريخه الدقيق
        });
        return {
          ...l, // 📦 استبقاء باقي بيانات المحاضرة
          date: newBaseDate, // 📅 التاريخ التقويمي الأساسي الجديد
          custom_weekly_dates: map15, // 📅 تواريخ الأسابيع الـ 15 المحدثة كاملة
        };
      }
      return l; // 🔙 إرجاع المحاضرة بدون تعديل إذا مو تابعة للقسم
    });

    setScheduleLectures(recalibratedLectures); // 💾 تحديث قائمة المحاضرات بالذاكرة فورياً
    saveStoredData('schedule_lectures', recalibratedLectures); // 💾 حفظ المحاضرات محلياً
    const currentDeptLectures = recalibratedLectures.filter((l) => isLectureInCurrentDept(l)); // 🏢 تصفية محاضرات هذا القسم
    saveScheduleLecturesBulkToSupabase(currentDeptLectures); // ☁️ حفظ كافة المحاضرات المحدثة في سحابة Supabase

    // 📡 3. بث حدث متزامن عام بالمتصفح لإشعار كافة المكونات المفتوحة (لوحة التدريسي، لوحة الطالب، كارد المحاضرة، المعاينة)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('semester-start-date-updated', {
          detail: { departmentId: currentDeptId, startDate: newStartDate }, // 📋 تمرير تفاصيل التحديث
        })
      );
    }
  };

  // ==========================================
  // 6️⃣ إدارة استيراد وتصدير الجدول الأسبوعي عبر Excel
  // ==========================================
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
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          if (isPM && hours < 12) hours += 12;
          if (isAM && hours === 12) hours = 0;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return defaultTime;
      };

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const rawCourseName = String(
          row['course_name'] || 
          row['اسم المادة الدراسية *'] || 
          row['اسم المادة الدراسية'] || 
          row['اسم المادة'] || 
          row['المادة'] || 
          ''
        ).trim();

        const rawStage = Number(row['stage'] || row['المرحلة (1-4) *'] || row['المرحلة الدراسية (1-4) *'] || row['المرحلة'] || 1);
        const rawSemester = Number(row['semester'] || row['الكورس (1 أو 2) *'] || row['الفصل (1 أو 2) *'] || row['الفصل الدراسي'] || row['الكورس الدراسي'] || row['الكورس'] || 1);
        const rawStudyType = String(row['study_type'] || row['الفترة (صباحي / مسائي) *'] || row['الفترة الدراسية *'] || row['الفترة'] || '').trim();
        const rawDay = String(row['day'] || row['اليوم الأسبوعي *'] || row['اليوم'] || '').trim();
        const rawStartTime = String(row['start_time'] || row['وقت البدء *'] || row['البدء'] || '').trim();
        const rawEndTime = String(row['end_time'] || row['وقت الانتهاء *'] || row['الانتهاء'] || '').trim();
        const rawRoom = String(row['room'] || row['القاعة / المختبر *'] || row['القاعة'] || row['المختبر'] || '').trim();
        const rawType = String(row['lecture_type'] || row['طبيعة المحاضرة (نظرية / عملية) *'] || row['طبيعة المحاضرة *'] || row['نوع المحاضرة'] || '').trim();
        const rawTeacherName = String(row['teacher_name'] || row['الأستاذ المحاضر (اختياري)'] || row['الأستاذ المحاضر'] || row['الأستاذ'] || '').trim();
        const rawNotes = String(row['notes'] || row['ملاحظات (اختياري)'] || row['ملاحظات'] || '').trim();
        const rawDate = String(row['date'] || row['تاريخ المحاضرة'] || row['التاريخ'] || '').trim();
        const rawWeekNumber = Number(row['week_number'] || row['الأسبوع الدراسي'] || row['الأسبوع'] || row['رقم الأسبوع'] || 1);

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
          (c) =>
            c.name.trim().toLowerCase() === rawCourseName.toLowerCase() ||
            c.code.trim().toLowerCase() === rawCourseName.toLowerCase() ||
            c.name.includes(rawCourseName) ||
            rawCourseName.includes(c.name)
        );

        // 🔬 فحص هل المادة المطابقة تشتمل على شق عملي؟
        const isMatchedCoursePractical = matchedCourse
          ? matchedCourse.course_type === 'theory_and_practical' || Boolean(matchedCourse.has_practical)
          : true; // ⚠️ إذا كانت مادة جديدة غير مسجلة نعتمد ما ورد بالإكسل

        // 🛡️ إذا كانت المادة نظرية فقط ولكن كُتب في إكسل أنها عملي، نلزمها بالنوع النظري واللون الأزرق حصراً
        const finalLectureType: LectureType = (!isMatchedCoursePractical && matchedCourse) ? 'theory' : parsedLectureType;
        const finalLectureColor: LectureColor = finalLectureType === 'practical' ? 'emerald' : 'blue';

        const courseId = matchedCourse ? matchedCourse.id : `crs-auto-${Date.now()}-${index}`;
        const finalCourseName = matchedCourse ? matchedCourse.name : rawCourseName;
        const finalCourseCode = matchedCourse ? matchedCourse.code : `CRS-${stageNumber}0${index + 1}`;

        // مطابقة الأستاذ مع أساتذة القسم
        const matchedTeacher = rawTeacherName
          ? deptTeachers.find(
              (t) =>
                t.full_name.trim().toLowerCase() === rawTeacherName.toLowerCase() ||
                t.full_name.includes(rawTeacherName) ||
                rawTeacherName.includes(t.full_name)
            )
          : matchedCourse
          ? deptTeachers.find((t) => t.id === (finalLectureType === 'practical' ? matchedCourse.practical_teacher_id : matchedCourse.theory_teacher_id))
          : undefined;

        const teacherId = matchedTeacher ? matchedTeacher.id : '';
        const teacherFullName = matchedTeacher ? matchedTeacher.full_name : rawTeacherName;

        // فحص التكرار الدقيق (نفس المرحلة، نفس الكورس، نفس الفترة، نفس اليوم، ونفس وقت البدء ونفس القاعة أو المادة)
        const isDuplicate = tempAllLectures.some(
          (l) =>
            isLectureInCurrentDept(l) &&
            l.stage_number === stageNumber &&
            l.semester === semesterNumber &&
            (l.study_type || 'morning') === parsedStudyType &&
            l.day === parsedDay &&
            l.start_time === startTime &&
            (l.room === roomName || l.course_name.toLowerCase() === finalCourseName.toLowerCase())
        );

        if (isDuplicate) {
          duplicates.push({
            name: `${finalCourseName} (${DAYS_OF_WEEK_LIST.find((d) => d.key === parsedDay)?.label_ar || parsedDay})`,
            email: `${startTime} - ${endTime} | ${roomName}`,
            dept: `مرحلة ${stageNumber} (كورس ${semesterNumber}) - ${parsedStudyType === 'evening' ? 'مسائي' : 'صباحي'}`,
            reason: 'محاضرة مجدولة مسبقاً في نفس التوقيت واليوم والقاعة',
          });
          return;
        }

        const validWeek = !isNaN(rawWeekNumber) && rawWeekNumber >= 1 && rawWeekNumber <= 15 ? rawWeekNumber : 1;
        let cascaded15Dates: Record<number, string> | undefined = undefined;
        if (rawDate) {
          const generatedList = generateAll15WeeksDates(rawDate, parsedDay);
          const tempMap: Record<number, string> = {};
          generatedList.forEach((item) => {
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
          week_number: validWeek,
          date: rawDate || undefined,
          custom_weekly_dates: cascaded15Dates,
          created_at: new Date().toISOString(),
        };

        newLecturesToAdd.push(newLecture);
        tempAllLectures.push(newLecture);

        accepted.push({
          name: `${finalCourseName} — ${finalLectureType === 'practical' ? 'مختبر وعملي' : 'محاضرة نظرية'}`,
          dept: `المرحلة ${stageNumber} (كورس ${semesterNumber}) | ${DAYS_OF_WEEK_LIST.find((d) => d.key === parsedDay)?.label_ar || parsedDay} (${startTime} - ${endTime})`,
          email: `${roomName} ${teacherFullName ? `| ${teacherFullName}` : ''}`,
        });
      });

      if (newLecturesToAdd.length > 0) {
        const merged = [...scheduleLectures, ...newLecturesToAdd];
        setScheduleLectures(merged);
        saveStoredData('schedule_lectures', merged); // 💾 حفظ المحاضرات المستوردة بالمفتاح الرسمي الموحد للنظام

        // ☁️ مزامنة سحابية فورية ومباشرة مع Supabase بدفعة واحدة
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
    const rawDeptLectures = scheduleLectures.filter((l) => isLectureInCurrentDept(l));

    if (rawDeptLectures.length === 0) {
      setErrorMessage('لا توجد محاضرات مجدولة حالياً للتصدير في هذا القسم.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
    const displayWeek = selectedScheduleWeek || 1;

    const deptLectures = rawDeptLectures.map((l) => {
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

  // ==========================================
  // 7️⃣ إدارة وحفظ جدول الامتحانات النهائية الفاينل (Final Exam Schedules)
  // ==========================================
  const handleSaveExamSchedule = (schedule: FinalExamSchedule, newSlots: FinalExamSlot[]) => {
    // 🔍 كشف البنود المحذوفة لمسحها سحابياً من جدول final_exam_slots في Supabase
    const previousScheduleSlots = finalExamSlots.filter((s) => s.schedule_id === schedule.id);
    const removedSlots = previousScheduleSlots.filter((s) => !newSlots.some((ns) => ns.id === s.id));
    removedSlots.forEach((rs) => {
      deleteFinalExamSlotFromSupabase(rs.id); // 🗑️ حذف البند المحذوف من السحابة
    });

    const updatedSchedules = finalExamSchedules.some((s) => s.id === schedule.id)
      ? finalExamSchedules.map((s) => (s.id === schedule.id ? schedule : s))
      : [...finalExamSchedules, schedule];

    // 🛡️ دمج ذكي بالـ id واستبدال بنود الجدول الحالي والحفاظ على باقي الجداول
    const otherScheduleSlots = finalExamSlots.filter((s) => s.schedule_id !== schedule.id);
    const scheduleNewSlots = newSlots.filter((s) => s.schedule_id === schedule.id);
    const otherNewSlots = newSlots.filter((s) => s.schedule_id !== schedule.id);

    const slotMap = new Map<string, FinalExamSlot>();
    otherScheduleSlots.forEach((s) => slotMap.set(s.id, s));
    otherNewSlots.forEach((s) => slotMap.set(s.id, s));
    scheduleNewSlots.forEach((s) => slotMap.set(s.id, s));

    const updatedSlots = Array.from(slotMap.values());

    setFinalExamSchedules(updatedSchedules);
    setFinalExamSlots(updatedSlots);

    saveStoredData('final_exam_schedules', updatedSchedules);
    saveStoredData('final_exam_slots', updatedSlots);

    // ☁️ حفظ ومزامنة جدول الامتحانات والبنود في سحابة Supabase فوراً
    saveFinalExamScheduleToSupabase(schedule);
    if (newSlots.length > 0) {
      saveFinalExamSlotsToSupabase(newSlots);
    }
  };
  // 🕒 دالة ذكية لحساب وقت نهاية المحاضرة حسب نظام الكليات الأهلية بالعراق (ساعة للعملي وساعة ونصف للنظري)
  const calculateEndTimeFromStart = (startTime: string, type: LectureType | ''): string => {
    if (!startTime) return ''; // 🛑 إذا ماكو وقت بداية نرجع نص فارغ
    const [hStr, mStr] = startTime.split(':'); // ⏱️ تفكيك الساعة والدقيقة
    const startH = parseInt(hStr || '0', 10); // 🕒 ساعة البدء كرقم
    const startM = parseInt(mStr || '0', 10); // 🕒 دقيقة البدء كرقم
    const totalStartMinutes = startH * 60 + startM; // 🧮 تحويل كامل وقت البداية إلى دقائق
    // 🔬 المختبر والعملي ساعة واحدة (60 دقيقة) والنظري ساعة ونصف (90 دقيقة)
    const durationMinutes = type === 'practical' ? 60 : 90; // ⏱️ تحديد المدة الفعلية المعتمدة بالكليات
    let totalEndMinutes = totalStartMinutes + durationMinutes; // ➕ إضافة مدة المحاضرة لوقت البداية
    if (totalEndMinutes > 21 * 60 + 30) {
      totalEndMinutes = 21 * 60 + 30; // 🛑 أقصى حد للدوام المسائي بالعراق (9:30 ليلاً)
    }
    const endH = Math.floor(totalEndMinutes / 60); // 🕒 استخراج ساعة النهاية
    const endM = totalEndMinutes % 60; // 🕒 استخراج دقيقة النهاية
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`; // 🏁 إرجاع الوقت بصيغة HH:mm
  };

  // 🕒 حساب التوقيت التالي للمحاضرة القادمة تلقائياً لسرعة الإدراج المتتالي استناداً لمدة المحاضرة الفعلية
  const advanceToNextTimeSlot = (currentEndTime: string, type: LectureType | '' = 'theory'): { nextStart: string; nextEnd: string } => {
    const nextStart = currentEndTime; // 🚀 تبدأ المحاضرة الجديدة فور انتهاء السابقة
    const nextEnd = calculateEndTimeFromStart(nextStart, type); // ⏱️ حساب نهاية المحاضرة القادمة حسب نوعها
    return {
      nextStart, // 🏁 وقت بداية المحاضرة الجاية
      nextEnd, // 🏁 وقت نهاية المحاضرة الجاية
    };
  };

  const handleSaveLecture = (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة الافتراضية للفورم
    if (!lecDay) {
      setErrorMessage('يرجى اختيار اليوم الأسبوعي للمحاضرة أولاً.'); // ⚠️ تنبيه باختيار اليوم
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecType) {
      setErrorMessage('يرجى اختيار طبيعة المحاضرة أولاً (محاضرة نظرية أو مختبر عملي).'); // ⚠️ تنبيه بنوع المحاضرة
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecCourseId) {
      setErrorMessage('يرجى اختيار المادة الدراسية أولاً.'); // ⚠️ تنبيه باختيار المادة
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecRoom.trim()) {
      setErrorMessage('يرجى تحديد القاعة الدراسية أو المختبر.'); // ⚠️ تنبيه بتحديد القاعة
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecStartTime) {
      setErrorMessage('يرجى تحديد وقت بدء المحاضرة.'); // ⚠️ تنبيه بتحديد وقت البدء
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!lecEndTime) {
      setErrorMessage('يرجى تحديد وقت انتهاء المحاضرة.'); // ⚠️ تنبيه بتحديد وقت الانتهاء
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const course = courses.find((c) => c.id === lecCourseId); // 🔍 جلب بيانات المادة المختارة
    if (!course) return; // 🛑 حماية في حال عدم وجود المادة

    const safeType: LectureType = lecType; // 🏷️ نوع المحاضرة المعتمد المختار صراحة
    let safeColor = lecColor || (safeType === 'practical' ? 'emerald' : 'blue'); // 🎨 لون الكارد المعتمد

    const safeDay: DayOfWeek = (lecDay as DayOfWeek) || 'saturday'; // 🗓️ اليوم المعتمد الآمن
    const teacher = deptTeachers.find((t) => t.id === lecTeacherId); // 👨‍🏫 جلب بيانات التدريسي المختار

    // 🛡️ فحص التضارب الزمني للقاعة والأستاذ في نفس التوقيت واليوم والفترة الدراسية
    if (currentLecConflicts.length > 0) {
      setErrorMessage(currentLecConflicts[0]?.message || 'يوجد تعارض زمني في القاعة أو الأستاذ لهذا التوقيت!'); // ⚠️ إشعار بالتعارض
      setTimeout(() => setErrorMessage(''), 4500);
      return;
    }

    const dayLabel = DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay; // 🗓️ اسم اليوم بالعربي
    const currentEditingId = editingLectureId; // 🆔 حفظ المعرف الحالي قبل التصفير

    // 📅 احتساب التاريخ المرجعي وتواريخ الأسابيع الـ 15 المتسلسلة (+7 أيام لكل أسبوع)
    const baseStart = currentScheduleConfig?.start_date || '2026-09-20';
    const targetWk = lecWeekNumber || 1;
    let actualLecDate = lecDate;
    // 🛡️ صمام أمان حاسم: إذا كان التاريخ الممرر غير محدد أو لا يطابق يوم المحاضرة الفعلي، نحسب التاريخ الدقيق فورياً
    if (!actualLecDate || getDayOfWeekFromDateString(actualLecDate) !== safeDay) {
      actualLecDate = calculateDateForAnyDayInWeek(baseStart, 1, targetWk, safeDay);
    }
    const effectiveBaseDate = actualLecDate || calculateDateForAnyDayInWeek(baseStart, 1, targetWk, safeDay);
    const all15DatesMap: Record<number, string> = {};
    if (effectiveBaseDate) {
      const all15 = generateAll15WeeksDates(effectiveBaseDate, safeDay, targetWk);
      all15.forEach((item) => {
        all15DatesMap[item.weekNumber] = item.date;
      });
    }

    if (editingLectureId) {
      // ✏️ تعديل محاضرة قائمة
      let updatedLecToSync: ScheduleLecture | null = null;
      const updated = scheduleLectures.map((l) => {
        if (l.id === editingLectureId) {
          let updatedWeeklyOverrides: Record<number, { day?: DayOfWeek; date?: string; start_time?: string; end_time?: string; room?: string; teacher_id?: string; teacher_name?: string }> = l.weekly_overrides ? { ...l.weekly_overrides } : {};
          
          // 🔄 النقل والتحويل الشامل بين أي يومين (مثال: من السبت للأحد، أو من الاثنين للسبت)
          if (originalLecDay && originalLecDay !== safeDay && (lecCascadeShiftOption === 'cascade_following' || lecCascadeShiftOption === 'all_15_weeks')) {
            const startWeek = lecCascadeShiftOption === 'all_15_weeks' ? 1 : (lecWeekNumber || 1);
            const shiftedMap = shiftLectureToAnyDay(originalLecDay, safeDay, startWeek, effectiveBaseDate, 15, targetWk);
            for (let w = startWeek; w <= 15; w++) {
              const shiftInfo = shiftedMap[w];
              if (shiftInfo) {
                updatedWeeklyOverrides[w] = {
                  ...(updatedWeeklyOverrides[w] || {}),
                  day: shiftInfo.day,
                  date: shiftInfo.date,
                  start_time: lecStartTime,
                  end_time: lecEndTime,
                  room: lecRoom.trim(),
                  teacher_id: teacher ? teacher.id : undefined,
                  teacher_name: teacher ? teacher.full_name : undefined,
                };
                all15DatesMap[w] = shiftInfo.date;
              }
            }
          }

          const editedLec: ScheduleLecture = {
            ...l,
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
            date: effectiveBaseDate,
            week_number: lecWeekNumber || 1,
            custom_weekly_dates: Object.keys(all15DatesMap).length > 0 ? all15DatesMap : undefined,
            weekly_overrides: Object.keys(updatedWeeklyOverrides).length > 0 ? updatedWeeklyOverrides : undefined,
            notes: lecNotes.trim() || undefined,
          };
          updatedLecToSync = editedLec;
          return editedLec;
        }
        return l;
      });

      setScheduleLectures(updated); // 💾 تحديث الحالة المحلية
      saveStoredData('schedule_lectures', updated); // 💾 التخزين المحلي
      if (updatedLecToSync) {
        saveScheduleLectureToSupabase(updatedLecToSync); // ☁️ حفظ ومزامنة المحاضرة في Supabase
      }

      // 🔔 إرسال إشعار فوري لطلبة المرحلة والقسم
      sendAppNotification({
        recipient_id: 'all',
        recipient_role: 'student',
        title: `تحديث في جدول المحاضرات الأسبوعي`,
        message: `تم تحديث موعد/قاعة محاضرة مادة (${course.name}) ليوم ${dayLabel} (${lecStartTime} - ${lecEndTime}) في ${lecRoom.trim()} للمرحلة ${selectedScheduleStage}.`,
        type: 'schedule_updated',
        link: '/student/dashboard',
      });

      if (closeModalAfterSave) {
        const savedY: number = lastScheduleScrollYRef.current; // 📍 نأخذ نسخة من موضع السكرول المحفوظ بالمليمتر
        setIsLectureModalOpen(false); // 🚀 غلق المودال فقط إذا اختار المستخدم حفظ وإغلاق
        setSuccessMessage(`تم تحديث محاضرة (${course.name}) في جدول يوم ${dayLabel} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        resetLectureModalState(); // 🧹 تصفير كامل الحقول
        // 🚀 استعادة موضع السكرول بدقة لنفس المكان في الجدول الأسبوعي
        if (typeof window !== 'undefined' && savedY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: savedY, behavior: 'instant' });
          }, 20);
        }
      } else {
        // ✨ الإبقاء على الكارد مفتوحاً لمواصلة التعديل أو إضافة محاضرات أخرى باحترافية مع إظهار التنبيه العائم
        setRecentlyAddedLectureId(currentEditingId);
        setTimeout(() => setRecentlyAddedLectureId(null), 5000);
        setSuccessMessage(`تم تحديث بيانات محاضرة (${course.name}) بنجاح في جدول يوم ${dayLabel}!`);
        setTimeout(() => setSuccessMessage(''), 4500);
      }
    } else {
      // ➕ إضافة محاضرة جديدة
      const newLecId = `lec-${Date.now()}`; // 🆔 توليد معرف فريد للمحاضرة
      const newLec: ScheduleLecture = {
        id: newLecId,
        department_id: currentDeptId || 'dept-1', // 🏢 القسم
        stage_number: selectedScheduleStage, // 🎓 المرحلة
        semester: selectedScheduleSemester, // 📚 الكورس
        academic_year_id: 'year-2026', // 📅 العام الدراسي
        course_id: course.id, // 📖 معرف المادة
        course_name: course.name, // 🏷️ اسم المادة
        course_code: course.code, // 🔢 رمز المادة
        teacher_id: teacher ? teacher.id : undefined, // 👨‍🏫 معرف الأستاذ
        teacher_name: teacher ? teacher.full_name : undefined, // 👤 اسم الأستاذ
        day: safeDay, // 🗓️ اليوم
        start_time: lecStartTime, // ⏱️ وقت البدء
        end_time: lecEndTime, // ⏱️ وقت الانتهاء
        room: lecRoom.trim(), // 🏛️ القاعة
        color: safeColor, // 🎨 اللون الآمن المعتمد
        type: safeType, // 🏷️ نوع المحاضرة الآمن المطابق لتوصيف المادة
        study_type: lecStudyType, // ☀️🌙 صباحي أو مسائي
        date: effectiveBaseDate, // 📅 تاريخ المحاضرة التقويمي
        week_number: lecWeekNumber || 1, // 🔢 رقم الأسبوع
        custom_weekly_dates: Object.keys(all15DatesMap).length > 0 ? all15DatesMap : undefined, // 📆 مصفوفة تواريخ الأسابيع الـ 15
        notes: lecNotes.trim() || undefined, // 📝 ملاحظات
        created_at: new Date().toISOString(), // 🕒 تاريخ الإنشاء
      };

      // 📌 إضافة المحاضرة في نهاية المصفوفة بحسب طلب المستخدم مع عمل سكرول سلس عليها
      const updated = [...scheduleLectures, newLec];
      setScheduleLectures(updated); // 💾 تحديث الحالة في الذاكرة
      saveStoredData('schedule_lectures', updated); // 💾 حفظ البيانات محلياً
      saveScheduleLectureToSupabase(newLec); // ☁️ حفظ ومزامنة المحاضرة الجديدة في Supabase

      // 🔔 إرسال إشعار فوري لطلبة المرحلة والقسم
      sendAppNotification({
        recipient_id: 'all',
        recipient_role: 'student',
        title: `محاضرة جديدة في الجدول الأسبوعي`,
        message: `تمت إضافة محاضرة جديدة لمادة (${course.name}) ليوم ${dayLabel} (${lecStartTime} - ${lecEndTime}) في ${lecRoom.trim()} لطلبة المرحلة ${selectedScheduleStage}.`,
        type: 'schedule_updated',
        link: '/student/dashboard',
      });

      if (closeModalAfterSave) {
        const savedY: number = lastScheduleScrollYRef.current; // 📍 نأخذ نسخة من موضع السكرول المحفوظ بالمليمتر
        setIsLectureModalOpen(false); // 🚀 غلق المودال إذا اختار المستخدم إدراج وإنهاء
        setSuccessMessage(`تمت إضافة محاضرة (${course.name}) إلى جدول المرحلة ${selectedScheduleStage} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        resetLectureModalState(); // 🧹 تصفير كافة الحقول
        // 🚀 استعادة موضع السكرول بدقة لنفس المكان في الجدول الأسبوعي
        if (typeof window !== 'undefined' && savedY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: savedY, behavior: 'instant' });
          }, 20);
        }
      } else {
        // 🌟 الإبقاء على الكارد مفتوحاً للإدراج المتتالي مع التنبيه العائم الفاخر
        setRecentlyAddedLectureId(newLecId);
        setTimeout(() => setRecentlyAddedLectureId(null), 6000);

        setSuccessMessage(`تم إدراج محاضرة (${course.name}) بنجاح في جدول (${dayLabel})!`);
        setTimeout(() => setSuccessMessage(''), 4500);

        // 📜 تمرير القائمة تلقائياً للمحاضرة المضافة حديثاً بسلاسة واحترافية
        setTimeout(() => {
          const cardEl = document.getElementById(`lec-card-${newLecId}`); // 🔍 جلب عنصر كارت المحاضرة الجديدة
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 🚀 سكرول مباشر وسلس لكارت المحاضرة
          } else if (lecListContainerRef.current) {
            lecListContainerRef.current.scrollTo({ top: lecListContainerRef.current.scrollHeight, behavior: 'smooth' }); // 🚀 سكرول لأسفل القائمة
          }
        }, 150);

        // 🧹 تصفير الحقول لاستقبال المحاضرة التالية بحالة غير محددة
        setLecCourseId(''); // 🧹 تصفير المادة
        setLecTeacherId(''); // 🧹 تصفير الأستاذ
        setLecRoom(''); // 🧹 تصفير القاعة
        setLecNotes(''); // 🧹 تصفير الملاحظات
        setLecType(''); // 🏷️ تصفير نوع المحاضرة
        setLecStartTime(''); // ⏱️ تصفير وقت البدء
        setLecEndTime(''); // ⏱️ تصفير وقت الانتهاء
      }
    }
  };

  // 🧹 دالة تصفير واستعادة الحالة الافتراضية لنافذة المحاضرة مع الاسترداد التقويمي الذكي
  const resetLectureModalState = (initialDay?: DayOfWeek, initialWeek?: number) => {
    setEditingLectureId(null); // 🔄 تصفير آيدي التعديل
    setOriginalLecDay(''); // 🗓️ تصفير اليوم الأصلي
    setLecType(''); // 🏷️ تصفير نوع المحاضرة (غير محدد)
    setLecCourseId(''); // 📖 تصفير المادة الدراسية
    setLecTeacherId(''); // 👤 تصفير الأستاذ المحاضر
    setLecRoom(''); // 🏛️ تصفير القاعة
    setLecStartTime(''); // ⏱️ تصفير وقت البدء (غير محدد)
    setLecEndTime(''); // ⏱️ تصفير وقت الانتهاء (غير محدد)
    
    // 🧠 الاسترداد التقويمي الذكي لتاريخ بداية الفصل والأسبوع المحدد من إعدادات القسم المحفوظة
    const savedStartDate = currentScheduleConfig?.start_date || '2026-09-20'; // 📅 جلب تاريخ البداية المعتمد للقسم
    const targetWk = initialWeek || selectedScheduleWeek || getCurrentAcademicWeek(savedStartDate) || 1; // ⚡ الأسبوع المستهدف
    setLecWeekNumber(targetWk); // 🔢 تعيين الأسبوع النشط
    const targetDay = initialDay || getDayOfWeekFromDateString(savedStartDate) || (lecDay as DayOfWeek) || 'sunday'; // 🗓️ اعتماد يوم انطلاق الفصل تلقائياً إذا ماكو يوم محدد
    setLecDay(targetDay); // 🗓️ تعيين اليوم الأكاديمي الحقيقي المطابق للتاريخ
    const computedDate = calculateDateForAnyDayInWeek(savedStartDate, 1, targetWk, targetDay); // 🗓️ حساب تاريخ هذا اليوم في هذا الأسبوع بدقة (+7 أيام لكل أسبوع)
    setLecDate(computedDate || savedStartDate); // 📅 تعيين التاريخ التقويمي المطابق فورياً
    
    setLecAutoCascadeWeeks(true); // 🌟 تفعيل تعاقب الأسابيع تلقائياً (+7 أيام)
    setLecNotes(''); // 📝 تصفير الملاحظات
    setLecModalSuccessMsg(''); // ✨ تصفير إشعار النجاح
  };

  const handleEditLecture = (lec: ScheduleLecture) => {
    // 📍 نسجل موقع السكرول الحالي للصفحة فوراً قبل فتح المودال حتى نرجعله بعد الإغلاق
    if (typeof window !== 'undefined') {
      lastScheduleScrollYRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setEditingLectureId(lec.id); // ✏️ تثبيت آيدي المحاضرة المراد تعديلها
    setOriginalLecDay(lec.day); // 🗓️ تتبع اليوم الأصلي للمحاضرة لكشف أي تحويل بين الأيام
    setSelectedScheduleStage(lec.stage_number); // 🎓 ضبط المرحلة
    setSelectedScheduleSemester((lec.semester || 1) as 1 | 2); // 📚 ضبط الكورس
    setLecDay(lec.day); // 🗓️ ضبط اليوم
    setLecCourseId(lec.course_id); // 📖 ضبط المادة
    setLecTeacherId(lec.teacher_id || ''); // 👨‍🏫 ضبط الأستاذ
    setLecRoom(lec.room); // 🏛️ ضبط القاعة
    setLecStartTime(lec.start_time); // ⏱️ وقت البدء
    setLecEndTime(lec.end_time); // ⏱️ وقت الانتهاء
    setLecColor(lec.color); // 🎨 اللون المعتمد
    setLecType(lec.type); // 🏷️ نوع المحاضرة
    setLecStudyType(lec.study_type || 'morning'); // ☀️🌙 الفترة الدراسية
    
    // 🧠 المزامنة التقويمية الذكية: تثبيت وتصحيح التاريخ الأكاديمي المطابق ليوم وأسبوع المحاضرة
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
    setLecWeekNumber(targetWeek); // 🔢 ضبط رقم الأسبوع بدقة
    setLecDate(effectiveDate); // 📅 ضبط التاريخ المحسوب المطابق لليوم الفعلي

    setLecAutoCascadeWeeks(true); // 🌟 تفعيل تعاقب الأسابيع تلقائياً
    setLecCascadeShiftOption('cascade_following'); // 🔄 ضبط خيار النقل لكافة الأسابيع اللاحقة
    setLecNotes(lec.notes || ''); // 📝 الملاحظات
    setIsLectureModalOpen(true); // 🚀 فتح كارت الـ CRUD العائم فوراً
  };

  const handleDeleteLecture = (id: string) => {
    const targetLecture = scheduleLectures.find((l) => l.id === id);
    setDeleteModalConfig({
      isOpen: true,
      title: 'تأكيد حذف المحاضرة من الجدول الأسبوعي',
      itemName: targetLecture?.course_name || 'محاضرة',
      itemDetails: `الأستاذ: ${targetLecture?.teacher_name || '—'} | القاعة: ${targetLecture?.room || '—'} (${targetLecture?.start_time} - ${targetLecture?.end_time})`,
      warningMessage: 'هل أنت متأكد من حذف هذه المحاضرة الأسبوعية من جدول الطلاب؟',
      onConfirm: () => {
        const updated = scheduleLectures.filter((l) => l.id !== id);
        setScheduleLectures(updated);
        saveStoredData('schedule_lectures', updated);
        deleteScheduleLectureFromSupabase(id); // ☁️ حذف فوري من جدول المحاضرات في Supabase
        setSuccessMessage('تم حذف المحاضرة من الجدول الأسبوعي وسحابياً بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 📢 حفظ ومزامنة التعميم الرسمي سحابياً مع Supabase
  const handleSaveAnnouncement = (announcement: CampusAnnouncement) => {
    const updated = campusAnnouncements.some((a) => a.id === announcement.id)
      ? campusAnnouncements.map((a) => (a.id === announcement.id ? announcement : a))
      : [announcement, ...campusAnnouncements];
    setCampusAnnouncements(updated);
    saveStoredData('campus_official_announcements', updated);
    saveCampusAnnouncementToSupabase(announcement); // ☁️ حفظ سحابي في Supabase فوراً
    setSuccessMessage('تم حفظ ونشر التعميم الرسمي بنجاح سحابياً 📢');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 🗑️ حذف التعميم الرسمي سحابياً من Supabase
  const handleDeleteAnnouncement = (id: string) => {
    const updated = campusAnnouncements.filter((a) => a.id !== id);
    setCampusAnnouncements(updated);
    saveStoredData('campus_official_announcements', updated);
    deleteCampusAnnouncementFromSupabase(id); // ☁️ حذف سحابي من جدول campus_official_announcements
    setSuccessMessage('تم حذف التعميم الرسمي سحابياً بنجاح.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 💳 حفظ وتحديث سجل قسط دراسي ومزامنته حياً وسحابياً مع Supabase
  const handleSaveTuitionRecord = (updatedRecord: StudentTuitionRecord) => {
    const existingIdx = tuitionRecords.findIndex((r) => r.id === updatedRecord.id || (r.student_id === updatedRecord.student_id && r.stage_number === updatedRecord.stage_number));
    let updatedList: StudentTuitionRecord[];
    if (existingIdx >= 0) {
      updatedList = [...tuitionRecords];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...tuitionRecords, updatedRecord];
    }
    setTuitionRecords(updatedList);
    saveStoredData('student_tuition_records', updatedList);
    saveTuitionRecordToSupabase(updatedRecord); // ☁️ حفظ ومزامنة سجل القسط مع Supabase

    // 📡 بث التحديث اللحظي الفوري لكافة اللوحات وتبويبات المتصفح (لوحة الطالب ورئيس القسم والمقرر)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tuition_records_updated', { detail: updatedList }));
    }
  };

  return (
    <ZeroTrustGuard allowedRoles={['department_head', 'rapporteur']} redirectFallback="/admin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ الهيدر الكحلي الرسمي وشريط التبويبات الـ 11 لإدارة القسم */}
      <DepartmentPortalHeader
        currentDepartment={currentDepartment}
        currentUser={currentUser}
        academicYear={academicYear}
        formatAcademicYearDisplay={formatAcademicYearDisplay}
        deptName={deptName}
        departments={departments}
        currentDeptId={currentDeptId}
        setCurrentDeptId={setCurrentDeptId}
        isDeptSwitcherDropdownOpen={isDeptSwitcherDropdownOpen}
        setIsDeptSwitcherDropdownOpen={setIsDeptSwitcherDropdownOpen}
        deptSwitcherButtonRef={deptSwitcherButtonRef}
        handleToggleDeptSwitcherDropdown={handleToggleDeptSwitcherDropdown}
        deptSwitcherCoords={deptSwitcherCoords}
        currentHead={currentHead}
        currentRap={currentRap}
        deptTeachersCount={deptTeachers.length}
        deptStudentsCount={deptStudents.length}
        deptCoursesCount={deptCourses.length}
        deptTeacherCoursesCount={deptTeacherCourses.length}
        deptGradesCount={deptGrades.length}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        activeTab={activeTab}
        handleTabSwitch={handleTabSwitch}
      />

      {/* 📇 نافذة / بطاقة بيانات الحساب الأكاديمي الصادر */}
      <DepartmentAccountCardModal
        profile={selectedCardProfile}
        deptName={deptName}
        onClose={() => setSelectedCardProfile(null)}
      />

      {/* ========================================================================= */}
      {/* 1️⃣ تبويب إدارة أساتذة القسم (Teachers CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <DepartmentTeachersTab
          deptTeachers={deptTeachers}
          deptName={deptName}
          teacherCourses={teacherCourses}
          teacherPage={teacherPage}
          setTeacherPage={setTeacherPage}
          teacherPageSize={teacherPageSize}
          setTeacherPageSize={setTeacherPageSize}
          selectedTeacherIds={selectedTeacherIds}
          setSelectedTeacherIds={setSelectedTeacherIds}
          isTeacherModalOpen={isTeacherModalOpen}
          setIsTeacherModalOpen={setIsTeacherModalOpen}
          editingTeacherId={editingTeacherId}
          setEditingTeacherId={setEditingTeacherId}
          teacherName={teacherName}
          setTeacherName={setTeacherName}
          customTeacherEmail={customTeacherEmail}
          setCustomTeacherEmail={setCustomTeacherEmail}
          customTeacherPassword={customTeacherPassword}
          setCustomTeacherPassword={setCustomTeacherPassword}
          teacherGender={teacherGender}
          setTeacherGender={setTeacherGender}
          showTeacherPassword={showTeacherPassword}
          setShowTeacherPassword={setShowTeacherPassword}
          nameError={nameError}
          setNameError={setNameError}
          profiles={profiles}
          isImportingExcel={isImportingExcel}
          isExportingTeachersExcel={isExportingTeachersExcel}
          handleDownloadTeacherTemplate={handleDownloadTeacherTemplate}
          setShowExcelInstructions={setShowExcelInstructions}
          handleTeacherExcelUpload={handleTeacherExcelUpload}
          handleExportTeachersExcel={handleExportTeachersExcel}
          handleSaveTeacher={handleSaveTeacher}
          handleAutoGenerateCredentials={handleAutoGenerateCredentials}
          passwordCriteria={passwordCriteria}
          passwordStrengthScore={passwordStrengthScore}
          handleBulkDeleteTeachers={handleBulkDeleteTeachers}
          handleBulkExportTeachersExcel={handleBulkExportTeachersExcel}
          toggleSelectAllTeachers={toggleSelectAllTeachers}
          toggleSelectTeacher={toggleSelectTeacher}
          handleMoveTeacher={handleMoveTeacher}
          setSingleTeacherPrintProfile={setSingleTeacherPrintProfile}
          setShowTeacherPrintModal={setShowTeacherPrintModal}
          setSelectedCardProfile={setSelectedCardProfile}
          handleDeleteTeacher={handleDeleteTeacher}
        />
      )}

      {/* ========================================================================= */}
      {/* 2️⃣ تبويب إدارة طلاب القسم (Students CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <DepartmentStudentsTab
          deptStudents={deptStudents}
          deptName={deptName}
          academicYear={academicYear}
          filteredStudents={filteredStudents}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          filterStudentStage={filterStudentStage}
          setFilterStudentStage={setFilterStudentStage}
          filterStudentStudyType={filterStudentStudyType}
          setFilterStudentStudyType={setFilterStudentStudyType}
          studentPage={studentPage}
          setStudentPage={setStudentPage}
          studentPageSize={studentPageSize}
          setStudentPageSize={setStudentPageSize}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          isStudentModalOpen={isStudentModalOpen}
          setIsStudentModalOpen={setIsStudentModalOpen}
          editingStudentId={editingStudentId}
          setEditingStudentId={setEditingStudentId}
          studentName={studentName}
          setStudentName={setStudentName}
          studentNameError={studentNameError}
          setStudentNameError={setStudentNameError}
          studentStage={studentStage}
          setStudentStage={setStudentStage}
          isStudentStageDropdownOpen={isStudentStageDropdownOpen}
          setIsStudentStageDropdownOpen={setIsStudentStageDropdownOpen}
          stageButtonRef={stageButtonRef}
          stageDropdownCoords={stageDropdownCoords}
          handleToggleStudentStageDropdown={handleToggleStudentStageDropdown}
          studentGender={studentGender}
          setStudentGender={setStudentGender}
          studentStudyType={studentStudyType}
          setStudentStudyType={setStudentStudyType}
          customStudentEmail={customStudentEmail}
          setCustomStudentEmail={setCustomStudentEmail}
          customStudentPassword={customStudentPassword}
          setCustomStudentPassword={setCustomStudentPassword}
          showStudentPassword={showStudentPassword}
          setShowStudentPassword={setShowStudentPassword}
          studentPasswordCriteria={studentPasswordCriteria}
          studentPasswordStrengthScore={studentPasswordStrengthScore}
          profiles={profiles}
          isImportingStudentExcel={isImportingStudentExcel}
          isExportingStudentsExcel={isExportingStudentsExcel}
          handleDownloadStudentTemplate={handleDownloadStudentTemplate}
          setShowStudentExcelInstructions={setShowStudentExcelInstructions}
          handleStudentExcelUpload={handleStudentExcelUpload}
          handleExportStudentsExcel={handleExportStudentsExcel}
          handleSaveStudent={handleSaveStudent}
          handleAutoGenerateStudentCredentials={handleAutoGenerateStudentCredentials}
          handleBulkDeleteStudents={handleBulkDeleteStudents}
          handleBulkExportStudentsExcel={handleBulkExportStudentsExcel}
          toggleSelectAllStudents={toggleSelectAllStudents}
          toggleSelectStudent={toggleSelectStudent}
          handlePromoteStudent={handlePromoteStudent}
          setSingleStudentPrintProfile={setSingleStudentPrintProfile}
          setShowStudentPrintModal={setShowStudentPrintModal}
          setSelectedCardProfile={setSelectedCardProfile}
          handleDeleteStudent={handleDeleteStudent}
          isBulkPromotionModalOpen={isBulkPromotionModalOpen}
          setIsBulkPromotionModalOpen={setIsBulkPromotionModalOpen}
          bulkPromoteSourceStage={bulkPromoteSourceStage}
          setBulkPromoteSourceStage={setBulkPromoteSourceStage}
          handleBulkPromoteStage={handleBulkPromoteStage}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}

      {/* ========================================================================= */}
      {/* 3️⃣ تبويب إدارة المواد الدراسية (Courses CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <DepartmentCoursesTab
          deptName={deptName}
          deptCourses={deptCourses}
          courses={courses}
          deptTeachers={deptTeachers}
          courseSearch={courseSearch}
          setCourseSearch={setCourseSearch}
          filterCourseStage={filterCourseStage}
          setFilterCourseStage={setFilterCourseStage}
          filterCourseSemester={filterCourseSemester}
          setFilterCourseSemester={setFilterCourseSemester}
          filterCourseType={filterCourseType}
          setFilterCourseType={setFilterCourseType}
          selectedCourseIds={selectedCourseIds}
          setSelectedCourseIds={setSelectedCourseIds}
          coursePage={coursePage}
          setCoursePage={setCoursePage}
          coursePageSize={coursePageSize}
          setCoursePageSize={setCoursePageSize}
          isCourseModalOpen={isCourseModalOpen}
          setIsCourseModalOpen={setIsCourseModalOpen}
          editingCourseId={editingCourseId}
          setEditingCourseId={setEditingCourseId}
          courseName={courseName}
          setCourseName={setCourseName}
          courseCode={courseCode}
          setCourseCode={setCourseCode}
          courseCredits={courseCredits}
          setCourseCredits={setCourseCredits}
          courseStage={courseStage}
          setCourseStage={setCourseStage}
          courseSemester={courseSemester}
          setCourseSemester={setCourseSemester}
          courseType={courseType}
          setCourseType={setCourseType}
          courseTheoryTeacherId={courseTheoryTeacherId}
          setCourseTheoryTeacherId={setCourseTheoryTeacherId}
          coursePracticalTeacherId={coursePracticalTeacherId}
          setCoursePracticalTeacherId={setCoursePracticalTeacherId}
          isCourseTheoryDropdownOpen={isCourseTheoryDropdownOpen}
          setIsCourseTheoryDropdownOpen={setIsCourseTheoryDropdownOpen}
          isCoursePracticalDropdownOpen={isCoursePracticalDropdownOpen}
          setIsCoursePracticalDropdownOpen={setIsCoursePracticalDropdownOpen}
          theoryTeacherBtnRef={theoryTeacherBtnRef}
          practicalTeacherBtnRef={practicalTeacherBtnRef}
          theoryTeacherCoords={theoryTeacherCoords}
          practicalTeacherCoords={practicalTeacherCoords}
          handleToggleCourseTheoryDropdown={handleToggleCourseTheoryDropdown}
          handleToggleCoursePracticalDropdown={handleToggleCoursePracticalDropdown}
          courseIsSupplementaryEnabled={courseIsSupplementaryEnabled}
          setCourseIsSupplementaryEnabled={setCourseIsSupplementaryEnabled}
          courseIsFinalExamEnabled={courseIsFinalExamEnabled}
          setCourseIsFinalExamEnabled={setCourseIsFinalExamEnabled}
          examToggleConfirmation={examToggleConfirmation}
          setExamToggleConfirmation={setExamToggleConfirmation}
          handleConfirmExamToggle={handleConfirmExamToggle}
          quickAssignConfig={quickAssignConfig}
          setQuickAssignConfig={setQuickAssignConfig}
          handleSaveQuickAssign={handleSaveQuickAssign}
          handleOpenQuickAssign={handleOpenQuickAssign}
          handleSaveCourse={handleSaveCourse}
          handleDeleteCourse={handleDeleteCourse}
          handleBulkDeleteCourses={handleBulkDeleteCourses}
          handleExportCoursesExcel={handleExportCoursesExcel}
          isExportingCoursesExcel={isExportingCoursesExcel}
          handleExportCoursesPDF={handleExportCoursesPDF}
          showCourseExcelInstructions={showCourseExcelInstructions}
          setShowCourseExcelInstructions={setShowCourseExcelInstructions}
          isImportingCourseExcel={isImportingCourseExcel}
          handleCourseExcelUpload={handleCourseExcelUpload}
          handleDownloadCourseTemplate={handleDownloadCourseTemplate}
          handleOpenAssessmentModal={handleOpenAssessmentModal}
          handleBulkToggleFinalExam={handleBulkToggleFinalExam}
          handleBulkToggleSupplementaryExam={handleBulkToggleSupplementaryExam}
          filteredCourses={filteredCourses}
          getStageNameInArabic={getStageNameInArabic}
          finalOpenCount={finalOpenCount}
          isBulkFinalOpen={isBulkFinalOpen}
          isBulkFinalPartial={isBulkFinalPartial}
          isBulkSupOpen={isBulkSupOpen}
          isBulkSupPartial={isBulkSupPartial}
          supOpenCount={supOpenCount}
          activeTargetRoundCourses={activeTargetRoundCourses}
          deptSem1CourseIds={deptSem1CourseIds}
          deptSem2CourseIds={deptSem2CourseIds}
          isExportingCoursesPDF={isExportingCoursesPDF}
          getCourseTheoryTeachers={getCourseTheoryTeachers}
          getCoursePracticalTeachers={getCoursePracticalTeachers}
          requestToggleRoundAction={requestToggleRoundAction}
        />
      )}

      {/* ========================================================================= */}
      {/* 4️⃣ تبويب تكليف الأساتذة بالمواد (Course Assignments CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <DepartmentAssignmentsTab
          deptTeacherCourses={deptTeacherCourses}
          deptTeachers={deptTeachers}
          deptCourses={deptCourses}
          courses={courses}
          deptName={deptName}
          assignmentSearch={assignmentSearch}
          setAssignmentSearch={setAssignmentSearch}
          filterAssignmentTeacher={filterAssignmentTeacher}
          setFilterAssignmentTeacher={setFilterAssignmentTeacher}
          filterAssignmentStage={filterAssignmentStage}
          setFilterAssignmentStage={setFilterAssignmentStage}
          filterAssignmentSemester={filterAssignmentSemester}
          setFilterAssignmentSemester={setFilterAssignmentSemester}
          filterAssignmentRole={filterAssignmentRole}
          setFilterAssignmentRole={setFilterAssignmentRole}
          filteredTeacherCourses={filteredTeacherCourses}
          selectedAssignmentIds={selectedAssignmentIds}
          setSelectedAssignmentIds={setSelectedAssignmentIds}
          assignmentPage={assignmentPage}
          setAssignmentPage={setAssignmentPage}
          assignmentPageSize={assignmentPageSize}
          setAssignmentPageSize={setAssignmentPageSize}
          isAssignmentModalOpen={isAssignmentModalOpen}
          setIsAssignmentModalOpen={setIsAssignmentModalOpen}
          editingAssignment={editingAssignment}
          setEditingAssignment={setEditingAssignment}
          selectedTeacherId={selectedTeacherId}
          setSelectedTeacherId={setSelectedTeacherId}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          selectedAssignRole={selectedAssignRole}
          setSelectedAssignRole={setSelectedAssignRole}
          isAssignTeacherDropdownOpen={isAssignTeacherDropdownOpen}
          setIsAssignTeacherDropdownOpen={setIsAssignTeacherDropdownOpen}
          assignTeacherButtonRef={assignTeacherButtonRef}
          assignTeacherCoords={assignTeacherCoords}
          handleToggleAssignTeacherDropdown={handleToggleAssignTeacherDropdown}
          assignTeacherSearchQuery={assignTeacherSearchQuery}
          setAssignTeacherSearchQuery={setAssignTeacherSearchQuery}
          isAssignCourseDropdownOpen={isAssignCourseDropdownOpen}
          setIsAssignCourseDropdownOpen={setIsAssignCourseDropdownOpen}
          assignCourseButtonRef={assignCourseButtonRef}
          assignCourseCoords={assignCourseCoords}
          handleToggleAssignCourseDropdown={handleToggleAssignCourseDropdown}
          assignCourseSearchQuery={assignCourseSearchQuery}
          setAssignCourseSearchQuery={setAssignCourseSearchQuery}
          isFilterTeacherDropdownOpen={isFilterTeacherDropdownOpen}
          setIsFilterTeacherDropdownOpen={setIsFilterTeacherDropdownOpen}
          filterTeacherButtonRef={filterTeacherButtonRef}
          filterTeacherCoords={filterTeacherCoords}
          handleToggleFilterTeacherDropdown={handleToggleFilterTeacherDropdown}
          filterTeacherSearchQuery={filterTeacherSearchQuery}
          setFilterTeacherSearchQuery={setFilterTeacherSearchQuery}
          isExportingAssignmentsExcel={isExportingAssignmentsExcel}
          handleExportAssignmentsExcel={handleExportAssignmentsExcel}
          setAssignmentsPrintScope={setAssignmentsPrintScope}
          setShowAssignmentsPrintModal={setShowAssignmentsPrintModal}
          handleSaveEditedAssignment={handleSaveEditedAssignment}
          handleAssignTeacher={handleAssignTeacher}
          handleBulkRemoveAssignments={handleBulkRemoveAssignments}
          handleOpenEditAssignment={handleOpenEditAssignment}
          handleRemoveAssignment={handleRemoveAssignment}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}

      {/* ========================================================================= */}
      {/* 5️⃣ تبويب مراقبة الدرجات والسعي (Grades & Performance) */}
      {/* ========================================================================= */}
      {activeTab === 'grades' && (
        <DepartmentGradesTab
          deptGrades={deptGrades}
          courses={courses}
          deptCourses={deptCourses}
          deptName={deptName}
          filteredGrades={filteredGrades}
          selectedGradeIds={selectedGradeIds}
          setSelectedGradeIds={setSelectedGradeIds}
          gradeSearch={gradeSearch}
          setGradeSearch={setGradeSearch}
          filterGradeCourse={filterGradeCourse}
          setFilterGradeCourse={setFilterGradeCourse}
          filterGradeStage={filterGradeStage}
          handleSelectGradeStage={handleSelectGradeStage}
          filterGradeSemester={filterGradeSemester}
          setFilterGradeSemester={setFilterGradeSemester}
          isGradeCourseDropdownOpen={isGradeCourseDropdownOpen}
          setIsGradeCourseDropdownOpen={setIsGradeCourseDropdownOpen}
          gradeCourseDropdownRef={gradeCourseDropdownRef}
          gradeSelectableCourses={gradeSelectableCourses}
          currentActiveScheme={currentActiveScheme}
          isExportingGradesExcel={isExportingGradesExcel}
          handleExportGradesExcel={handleExportGradesExcel}
          handleBulkDeleteGrades={handleBulkDeleteGrades}
          gradePage={gradePage}
          setGradePage={setGradePage}
          gradePageSize={gradePageSize}
          setGradePageSize={setGradePageSize}
          calculateCourseworkTotal={calculateCourseworkTotal}
          calculateFinalTotal={calculateFinalTotal}
          getLetterGrade={getLetterGrade}
          getCourseAssessmentScheme={getCourseAssessmentScheme}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}
      {/* ========================================================================= */}
      {/* 6️⃣ تبويب إدارة الجدول الأسبوعي والمحاضرات والعطل (Schedule Management CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <DepartmentScheduleTab
          deptName={deptName}
          currentDeptId={currentDeptId}
          courses={courses}
          deptCourses={deptCourses}
          deptTeachers={deptTeachers}
          teacherCourses={teacherCourses}
          scheduleLectures={scheduleLectures}
          currentScheduleConfig={currentScheduleConfig}
          scheduleCurrentAcademicWeek={scheduleCurrentAcademicWeek}
          selectedScheduleStage={selectedScheduleStage}
          setSelectedScheduleStage={setSelectedScheduleStage}
          selectedScheduleSemester={selectedScheduleSemester}
          setSelectedScheduleSemester={setSelectedScheduleSemester}
          selectedScheduleStudyType={selectedScheduleStudyType}
          setSelectedScheduleStudyType={setSelectedScheduleStudyType}
          selectedScheduleWeek={selectedScheduleWeek}
          setSelectedScheduleWeek={setSelectedScheduleWeek}
          selectedScheduleLectureIds={selectedScheduleLectureIds}
          setSelectedScheduleLectureIds={setSelectedScheduleLectureIds}
          currentLecConflicts={currentLecConflicts}
          handleDownloadScheduleTemplate={handleDownloadScheduleTemplate}
          setShowScheduleExcelInstructions={setShowScheduleExcelInstructions}
          handleScheduleExcelUpload={handleScheduleExcelUpload}
          isImportingScheduleExcel={isImportingScheduleExcel}
          handleExportScheduleToExcel={handleExportScheduleToExcel}
          setIsPreviewScheduleModalOpen={setIsPreviewScheduleModalOpen}
          setIsSchedulePrintModalOpen={setIsSchedulePrintModalOpen}
          handleBulkDeleteScheduleLectures={handleBulkDeleteScheduleLectures}
          handleToggleWorkingDay={handleToggleWorkingDay}
          setPendingSemesterStartDate={setPendingSemesterStartDate}
          setShowSemesterDateConfirmModal={setShowSemesterDateConfirmModal}
          isLectureInCurrentDept={isLectureInCurrentDept}
          handleEditLecture={handleEditLecture}
          handleDeleteLecture={handleDeleteLecture}
          handleSaveLecture={handleSaveLecture}
          handleSaveSemesterStartDate={handleSaveSemesterStartDate}
          resetLectureModalState={resetLectureModalState}
          setSuccessMessage={setSuccessMessage}
          lastScheduleScrollYRef={lastScheduleScrollYRef}
          isLectureModalOpen={isLectureModalOpen}
          setIsLectureModalOpen={setIsLectureModalOpen}
          editingLectureId={editingLectureId}
          setEditingLectureId={setEditingLectureId}
          recentlyAddedLectureId={recentlyAddedLectureId}
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
          closeModalAfterSave={closeModalAfterSave}
          setCloseModalAfterSave={setCloseModalAfterSave}
          lecCourseSearchTerm={lecCourseSearchTerm}
          setLecCourseSearchTerm={setLecCourseSearchTerm}
          lecCourseTabFilter={lecCourseTabFilter}
          setLecCourseTabFilter={setLecCourseTabFilter}
          lecTeacherSearchTerm={lecTeacherSearchTerm}
          setLecTeacherSearchTerm={setLecTeacherSearchTerm}
          lecModalSuccessMsg={lecModalSuccessMsg}
          setLecModalSuccessMsg={setLecModalSuccessMsg}
        />
      )}

      {/* ========================================================================= */}
      {/* 7️⃣ تبويب متابعة الحضور والإنذارات الأكاديمية لمسار بولونيا (Attendance & Warnings) */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <DepartmentAttendanceTab
          deptName={deptName}
          currentDeptId={currentDeptId}
          deptCourses={deptCourses}
          deptStudents={deptStudents}
          attendanceRecords={attendanceRecords}
          setAttendanceRecords={setAttendanceRecords}
          currentScheduleConfig={currentScheduleConfig}
          excuseRequests={excuseRequests}
          currentHead={currentHead}
          currentRap={currentRap}
          scheduleCurrentAcademicWeek={scheduleCurrentAcademicWeek}
          attendanceViewMode={attendanceViewMode}
          setAttendanceViewMode={setAttendanceViewMode}
          filterAttendanceStage={filterAttendanceStage}
          setFilterAttendanceStage={setFilterAttendanceStage}
          filterAttendanceSemester={filterAttendanceSemester}
          setFilterAttendanceSemester={setFilterAttendanceSemester}
          filterAttendanceStudyType={filterAttendanceStudyType}
          setFilterAttendanceStudyType={setFilterAttendanceStudyType}
          filterAttendanceWeek={filterAttendanceWeek}
          setFilterAttendanceWeek={setFilterAttendanceWeek}
          isAttendanceWeekDropdownOpen={isAttendanceWeekDropdownOpen}
          setIsAttendanceWeekDropdownOpen={setIsAttendanceWeekDropdownOpen}
          attendanceSearch={attendanceSearch}
          setAttendanceSearch={setAttendanceSearch}
          filterAttendanceCourse={filterAttendanceCourse}
          setFilterAttendanceCourse={setFilterAttendanceCourse}
          isAttendanceCourseDropdownOpen={isAttendanceCourseDropdownOpen}
          setIsAttendanceCourseDropdownOpen={setIsAttendanceCourseDropdownOpen}
          filterAttendanceStatus={filterAttendanceStatus}
          setFilterAttendanceStatus={setFilterAttendanceStatus}
          isAttendanceStatusDropdownOpen={isAttendanceStatusDropdownOpen}
          setIsAttendanceStatusDropdownOpen={setIsAttendanceStatusDropdownOpen}
          isSyncingAttendance={isSyncingAttendance}
          setIsSyncingAttendance={setIsSyncingAttendance}
          selectedAttendanceStudentIds={selectedAttendanceStudentIds}
          setSelectedAttendanceStudentIds={setSelectedAttendanceStudentIds}
          attendancePage={attendancePage}
          setAttendancePage={setAttendancePage}
          attendancePageSize={attendancePageSize}
          setAttendancePageSize={setAttendancePageSize}
          isExportingAttendanceExcel={isExportingAttendanceExcel}
          handleExportAttendanceExcel={handleExportAttendanceExcel}
          setIsDurationSettingsModalOpen={setIsDurationSettingsModalOpen}
          setIsDeptExcuseReviewOpen={setIsDeptExcuseReviewOpen}
          setIsAttendanceNoticeModalOpen={setIsAttendanceNoticeModalOpen}
          setAttendanceNoticeTargetStudent={setAttendanceNoticeTargetStudent}
          setAttendanceNoticeDefaultCategory={setAttendanceNoticeDefaultCategory}
          setSuccessMessage={setSuccessMessage}
          syncAttendanceRecordsFromSupabase={syncAttendanceRecordsFromSupabase}
        />
      )}

      {/* ========================================================================= */}
      {/* 8️⃣ تبويب الرسوم البيانية والإحصائيات الأكاديمية (Analytics Dashboard) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <DepartmentAnalyticsTab
          grades={deptGrades}
          courses={deptCourses}
          students={deptStudents}
          teachers={deptTeachers}
          teacherCourses={deptTeacherCourses}
          attendanceRecords={attendanceRecords}
          departmentName={deptName}
        />
      )}
      {/* ========================================================================= */}
      {/* 🎛️ نافذة منبثقة لتخصيص توزيع الدرجات والعناوين لبنود بولونيا الـ 7 (Assessment Scheme Modal) */}
      {/* ========================================================================= */}
      <AssessmentSchemeModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        course={selectedCourseForAssessment}
        tempAssessmentScheme={tempAssessmentScheme}
        setTempAssessmentScheme={setTempAssessmentScheme}
        deptName={deptName}
        onSave={handleSaveAssessmentSchemeModal}
        getStageNameInArabic={getStageNameInArabic}
        getDefaultAssessmentScheme={getDefaultAssessmentScheme}
      />
      {/* ========================================================================= */}
      {/* 8️⃣ تبويب جداول الامتحانات النهائية الفاينل (Final Exam Schedules CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && currentUser && (
        <FinalExamScheduleEditor
          departmentId={currentDeptId}
          departmentName={deptName}
          courses={deptCourses}
          currentUser={currentUser}
          schedules={finalExamSchedules}
          slots={finalExamSlots}
          onSaveSchedule={handleSaveExamSchedule}
          headName={currentHead?.full_name}
          rapporteurName={currentRap?.full_name}
        />
      )}

      {/* ========================================================================= */}
      {/* 📚 8.5 تبويب تدقيق وإشراف التكليفات والامتحانات الفصلية لمواد القسم */}
      {/* ========================================================================= */}
      {activeTab === 'course_tasks' && (
        <DepartmentAssessmentsOverview
          departmentId={currentDeptId}
          departmentName={deptName}
        />
      )}

      {/* ========================================================================= */}
      {/* 9️⃣ تبويب تسديد الأقساط الدراسية (Tuition Fees & Installments CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'tuition' && currentUser && (
        <TuitionManagementTab
          departmentId={currentDeptId}
          departmentName={deptName}
          students={profiles.filter((p) => p.role === 'student' && p.department_id === currentDeptId)}
          tuitionRecords={tuitionRecords}
          onSaveTuitionRecord={handleSaveTuitionRecord}
          currentUser={currentUser}
          academicYear={academicYear}
        />
      )}


      {/* ========================================================================= */}
      {/* 🏛️ نافذة مصفوفة إشغال القاعات والمختبرات الشاملة (Master Campus Matrix) */}
      {/* ========================================================================= */}
      <MasterHallMatrixModal
        isOpen={isMasterMatrixModalOpen}
        onClose={() => setIsMasterMatrixModalOpen(false)}
        lectures={scheduleLectures}
        departments={departments}
      />

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لكادر القسم */}
      {/* 📊 مكون مودالات إرشادات وتقارير استيراد الإكسل الشاملة لكافة الأقسام */}
      <DepartmentExcelModals
        deptName={deptName}
        showExcelInstructions={showExcelInstructions}
        setShowExcelInstructions={setShowExcelInstructions}
        importReport={importReport}
        setImportReport={setImportReport}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
        handleDownloadTeacherTemplate={handleDownloadTeacherTemplate}
        showStudentExcelInstructions={showStudentExcelInstructions}
        setShowStudentExcelInstructions={setShowStudentExcelInstructions}
        studentImportReport={studentImportReport}
        setStudentImportReport={setStudentImportReport}
        studentActiveReportTab={studentActiveReportTab}
        setStudentActiveReportTab={setStudentActiveReportTab}
        handleDownloadStudentTemplate={handleDownloadStudentTemplate}
        showCourseExcelInstructions={showCourseExcelInstructions}
        setShowCourseExcelInstructions={setShowCourseExcelInstructions}
        courseImportReport={courseImportReport}
        setCourseImportReport={setCourseImportReport}
        courseActiveReportTab={courseActiveReportTab}
        setCourseActiveReportTab={setCourseActiveReportTab}
        handleDownloadCourseTemplate={handleDownloadCourseTemplate}
        showScheduleExcelInstructions={showScheduleExcelInstructions}
        setShowScheduleExcelInstructions={setShowScheduleExcelInstructions}
        scheduleImportReport={scheduleImportReport}
        setScheduleImportReport={setScheduleImportReport}
        scheduleActiveReportTab={scheduleActiveReportTab}
        setScheduleActiveReportTab={setScheduleActiveReportTab}
        handleDownloadScheduleTemplate={handleDownloadScheduleTemplate}
      />

      {/* 📑 نافذة مراجعة واعتماد طلبات الإجازات والأعذار الرسمية للقسم */}
      <ExcuseRequestsReviewModal
        isOpen={isDeptExcuseReviewOpen}
        onClose={() => setIsDeptExcuseReviewOpen(false)}
        requests={excuseRequests.filter((e) => e.department_id === currentDeptId)}
        reviewerId={currentUser?.id || 'dept-head-1'}
        reviewerName={currentUser?.full_name || 'رئيس القسم الأكاديمي'}
        reviewerRole="department_head"
        onUpdateRequest={(updatedReq) => {
          const newExcuses = excuseRequests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
          setExcuseRequests(newExcuses);
          saveStoredData('excuse_requests', newExcuses);
        }}
        onUpdateAttendanceRecord={(courseId, weekNumber, studentId, excuseReason, docRef) => {
          const updatedRecords = attendanceRecords.map((rec) => {
            if (rec.course_id === courseId && rec.week_number === weekNumber && rec.student_id === studentId) {
              return {
                ...rec,
                status: 'absent_excused' as const,
                excuse_reason: excuseReason,
                excuse_document_ref: docRef,
                notes: 'تم اعتماد الإجازة بقرار رسمي من رئاسة القسم',
              };
            }
            return rec;
          });
          setAttendanceRecords(updatedRecords);
          saveStoredData('student_attendance_records', updatedRecords);
          saveMultipleAttendanceRecordsToSupabase(updatedRecords); // ☁️ حفظ ومزامنة حالة الحضور المقبولة عذراً مع Supabase فوراً
        }}
      />

      {/* 🗑️ كارد الحذف والتأكيد الاحترافي الفاخر العام لكافة عناصر البوابة */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        itemName={deleteModalConfig.itemName}
        itemDetails={deleteModalConfig.itemDetails}
        warningMessage={deleteModalConfig.warningMessage}
        warningNote={deleteModalConfig.warningNote}
        confirmText={deleteModalConfig.confirmText}
        variant={deleteModalConfig.variant}
        iconType={deleteModalConfig.iconType}
        onConfirm={deleteModalConfig.onConfirm}
        onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 🔒 نافذة التأكيد الاحترافية الفاخرة لفتح وقفل الأدوار الأكاديمية (الدور الأول / الثاني للكورسين) */}
      {/* 🔐 كارت تأكيد الفتح والإغلاق العام بنصوص سوداء في المنتصف بدون أي سكرول */}
      {/* 🔒 نافذة التأكيد الاحترافية الفاخرة لفتح وقفل الأدوار الأكاديمية (الدور الأول / الثاني للكورسين) */}
      <RoundConfirmModal
        modalData={roundConfirmModal}
        onClose={() => setRoundConfirmModal(null)}
        onConfirm={executeConfirmToggleRoundAction}
      />

      {/* 🗓️ نافذة معاينة جدول الطلاب بتصميم صلب وثابت تماماً بدون أي حركة أو انزلاق */}

      {/* ⚙️ نافذة تخصيص وإعداد مدد وساعات المحاضرات لرئيس القسم والمقرر */}
      <DepartmentDurationSettingsModal
        isOpen={isDurationSettingsModalOpen}
        onClose={() => setIsDurationSettingsModalOpen(false)}
        departmentId={currentDeptId}
        departmentName={deptName}
        courses={currentDeptId ? courses.filter((c) => c.department_id === currentDeptId) : courses}
        onConfigSaved={() => {
          setSuccessMessage('تم حفظ واعتماد تخصيص ساعات المحاضرات بنجاح ومزامنتها مع كافة اللوحات.');
          setTimeout(() => setSuccessMessage(''), 4500);
        }}
      />

      {/* 📢 نافذة التبليغات والتنبيهات الذكية للحضور والغيابات والعطل والامتحانات */}
      <AttendanceNoticeModal
        isOpen={isAttendanceNoticeModalOpen}
        onClose={() => {
          setIsAttendanceNoticeModalOpen(false);
          setAttendanceNoticeTargetStudent(null);
        }}
        departmentId={currentDeptId}
        departmentName={deptName}
        students={deptStudents}
        initialStudent={attendanceNoticeTargetStudent}
        initialSelectedStudentIds={selectedAttendanceStudentIds}
        defaultCategory={attendanceNoticeDefaultCategory}
        onNoticeSent={(summary) => {
          setSuccessMessage(summary);
          setTimeout(() => setSuccessMessage(''), 4500);
        }}
      />

      {/* 🖨️ 1. نافذة معاينة وطباعة بطاقات اعتماد الأساتذة (10 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x5) */}
      {/* 🖨️ مودالات المعاينة والطباعة المعتمدة (الجدول، بطاقات الكادر التدريسي، بطاقات الطلبة، وجدول التكليفات الرسمي) */}
      <DepartmentPrintModals
        isPreviewScheduleModalOpen={isPreviewScheduleModalOpen}
        setIsPreviewScheduleModalOpen={setIsPreviewScheduleModalOpen}
        isSchedulePrintModalOpen={isSchedulePrintModalOpen}
        setIsSchedulePrintModalOpen={setIsSchedulePrintModalOpen}
        currentDeptId={currentDeptId}
        deptName={deptName}
        currentHead={currentHead}
        currentRap={currentRap}
        selectedScheduleStage={selectedScheduleStage}
        scheduleLectures={scheduleLectures}
        scheduleConfigs={scheduleConfigs}
        academicYear={academicYear}
        selectedScheduleSemester={selectedScheduleSemester}
        selectedScheduleStudyType={selectedScheduleStudyType}
        showTeacherPrintModal={showTeacherPrintModal}
        setShowTeacherPrintModal={setShowTeacherPrintModal}
        singleTeacherPrintProfile={singleTeacherPrintProfile}
        setSingleTeacherPrintProfile={setSingleTeacherPrintProfile}
        selectedTeacherIds={selectedTeacherIds}
        deptTeachers={deptTeachers}
        showStudentPrintModal={showStudentPrintModal}
        setShowStudentPrintModal={setShowStudentPrintModal}
        singleStudentPrintProfile={singleStudentPrintProfile}
        setSingleStudentPrintProfile={setSingleStudentPrintProfile}
        selectedStudentIds={selectedStudentIds}
        deptStudents={deptStudents}
        studentPrintStageFilter={studentPrintStageFilter}
        setStudentPrintStageFilter={setStudentPrintStageFilter}
        studentPrintStudyFilter={studentPrintStudyFilter}
        setStudentPrintStudyFilter={setStudentPrintStudyFilter}
        showAssignmentsPrintModal={showAssignmentsPrintModal}
        setShowAssignmentsPrintModal={setShowAssignmentsPrintModal}
        assignmentsPrintScope={assignmentsPrintScope}
        setAssignmentsPrintScope={setAssignmentsPrintScope}
        deptTeacherCourses={deptTeacherCourses}
        filteredTeacherCourses={filteredTeacherCourses}
        courses={courses}
        isMounted={isMounted}
      />

      {/* ========================================================================= */}
      {/* 👨‍🏫 مودال CRUD لإدارة وتكليف المواد لكل أستاذ على حدة (Per-Teacher CRUD) */}
      {/* ========================================================================= */}
      {/* 👨‍🏫 مودال CRUD لإدارة وتكليف المواد لكل أستاذ على حدة */}
      <TeacherCourseAssignModal
        isOpen={isTeacherCrudModalOpen && !!crudTeacher}
        onClose={() => {
          setIsTeacherCrudModalOpen(false);
          setCrudTeacher(null);
        }}
        crudTeacher={crudTeacher}
        deptName={deptName}
        deptCourses={deptCourses}
        courses={courses}
        deptTeacherCourses={deptTeacherCourses}
        teacherCrudSearchQuery={teacherCrudSearchQuery}
        setTeacherCrudSearchQuery={setTeacherCrudSearchQuery}
        teacherCrudCourseId={teacherCrudCourseId}
        setTeacherCrudCourseId={setTeacherCrudCourseId}
        handleAssignCourseToSpecificTeacher={handleAssignCourseToSpecificTeacher}
        handleRemoveAssignment={handleRemoveAssignment}
      />

      {/* 🛑 نافذة تأكيد تعديل تاريخ انطلاق الفصل الدراسي (مسار بولونيا) الاحترافية */}
      {/* 🛑 نافذة تأكيد تعديل تاريخ انطلاق الفصل الدراسي (مسار بولونيا) */}
      <SemesterDateConfirmModal
        isOpen={showSemesterDateConfirmModal}
        pendingDate={pendingSemesterStartDate}
        currentStartDate={currentScheduleConfig.start_date || 'غير محدد'}
        onClose={() => {
          setShowSemesterDateConfirmModal(false);
          setPendingSemesterStartDate(null);
        }}
        onConfirm={() => {
          if (pendingSemesterStartDate) {
            handleSaveSemesterStartDate(pendingSemesterStartDate);
            setSuccessMessage('تم اعتماد وتحديث تاريخ انطلاق الفصل الدراسي بنجاح! 📅✨');
            setTimeout(() => setSuccessMessage(''), 4000);
          }
          setShowSemesterDateConfirmModal(false);
          setPendingSemesterStartDate(null);
        }}
      />

      </div>
    </ZeroTrustGuard>
  );
}
