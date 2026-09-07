'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 لوحة إدارة القسم المركزية (رئيس القسم والمقرر) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة المؤقتة والمراجع
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
  deleteScheduleLectureFromSupabase,
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
  ScheduleConflict
} from '@/lib/schedule-utils'; // 🕒 أدوات وحسابات الجدول الأسبوعي وكشف التضارب الزمني
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import AnalyticsCharts from '@/components/AnalyticsCharts'; // 📈 لوحة الرسوم البيانية التفاعلية
import StudentScheduleTimeline from '@/components/schedule/StudentScheduleTimeline'; // 🗓️ مكون الـ Timeline والجدول التفاعلي
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
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock'; // 🔒 نظام إدارة التمرير المركزي للنوافذ المنبثقة
import { PrintFilterDropdown, PrintFilterOption } from '@/components/PrintFilterDropdown'; // 🖨️ مكون القوائم المنسدلة الاحترافية لفلاتر الطباعة
import { downloadDepartmentTeachersTemplate, downloadDepartmentStudentsTemplate, downloadDepartmentCoursesTemplate, generateDepartmentScheduleTemplate, parseExcelFile, exportCustomTeachersList, exportCustomStudentsList, exportCustomCoursesList, exportCustomScheduleList } from '@/lib/excel-utils'; // 📊 دوال قراءة وتوليد نماذج Excel
import AdminPagination from '@/components/AdminPagination'; // 📄 مكون نظام الصفحات الموحد والفاخر

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
  CheckCircle2, 
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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
  const [isMounted, setIsMounted] = useState<boolean>(false); // 🌐 حالة التثبيت بالعميل لتفعيل البورتال بأمان

  // ⚡ خطاف التحميل بالعميل
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🖨️ إدارة كلاس الطباعة على جسم الصفحة لضمان خروج وثيقة الطباعة A4 بدون أي مساحات فارغة
  useEffect(() => {
    if (showTeacherPrintModal || showStudentPrintModal) {
      document.body.classList.add('print-modal-active');
      return () => {
        document.body.classList.remove('print-modal-active');
      };
    }
  }, [showTeacherPrintModal, showStudentPrintModal]);

  // 🏢 حالات القائمة المنسدلة لتبديل القسم للمسؤول
  const [isDeptSwitcherDropdownOpen, setIsDeptSwitcherDropdownOpen] = useState<boolean>(false);
  const deptSwitcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const [deptSwitcherCoords, setDeptSwitcherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  // 📐 دالة ذكية لحساب موضع القوائم المنسدلة بدقة تامة بحيث تظهر دائماً ملاصقة للزر تماماً داخل حدود الشاشة المرئية 100% بدون أي قص أو خروج
  const calculateSmartDropdownPosition = (buttonEl: HTMLElement, preferredHeight = 240) => {
    if (typeof window === 'undefined') return { top: 0, left: 0, width: 200, maxHeight: preferredHeight, openUpwards: false };
    const rect = buttonEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight: number;
    let openUpwards = false;
    
    // إذا كانت المساحة بالأسفل غير كافية والمساحة بالأعلى أكبر، نفتح القائمة للأعلى فوراً فوق الزر ملاصقة له تماماً
    if (spaceBelow < preferredHeight && spaceAbove > spaceBelow) {
      openUpwards = true;
      maxHeight = Math.min(preferredHeight, Math.max(120, spaceAbove - 24));
      bottom = viewportHeight - rect.top + 6;
    } else {
      maxHeight = Math.min(preferredHeight, Math.max(120, spaceBelow - 24));
      top = rect.bottom + 6;
    }
    
    // ضبط الموضع الأفقي لضمان عدم خروج القائمة عن أطراف الشاشة
    let left = rect.left;
    const width = rect.width;
    if (left + width > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - width - 16);
    }
    if (left < 16) {
      left = 16;
    }
    
    return { top, bottom, left, width, maxHeight, openUpwards };
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
    iconType?: 'trash' | 'graduation' | 'promote' | 'check' | 'sparkles' | 'alert' | 'user' | 'info' | 'unlink' | 'user-minus';
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
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false); // 📦 حالة كارت CRUD العائم للتكليفات
  const [assignmentSearch, setAssignmentSearch] = useState(''); // 🔍 بحث التكليفات
  const [filterAssignmentTeacher, setFilterAssignmentTeacher] = useState<string | 'all'>('all'); // 🏷️ تصفية الأستاذ المكلف
  const [filterAssignmentStage, setFilterAssignmentStage] = useState<number | 'all'>('all'); // 🏷️ تصفية مرحلة التكليف
  const [filterAssignmentSemester, setFilterAssignmentSemester] = useState<number | 'all'>('all'); // 🏷️ تصفية كورس التكليف
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
    } else {
      setIsAssignTeacherDropdownOpen(false);
    }
  };

  const handleToggleAssignCourseDropdown = () => {
    if (!isAssignCourseDropdownOpen && assignCourseButtonRef.current) {
      setAssignCourseCoords(getPreciseDropdownPosition(assignCourseButtonRef.current, 280));
      setIsAssignCourseDropdownOpen(true);
      setIsAssignTeacherDropdownOpen(false);
    } else {
      setIsAssignCourseDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClose = () => {
      if (isAssignTeacherDropdownOpen) setIsAssignTeacherDropdownOpen(false);
      if (isAssignCourseDropdownOpen) setIsAssignCourseDropdownOpen(false);
    };
    if (isAssignTeacherDropdownOpen || isAssignCourseDropdownOpen) {
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('resize', handleClose);
    };
  }, [isAssignTeacherDropdownOpen, isAssignCourseDropdownOpen]);

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
  const lecListContainerRef = useRef<HTMLDivElement | null>(null); // 📜 مرجع حاوية قائمة المحاضرات لعمل سكرول للأعلى تلقائياً
  const [lecStudyType, setLecStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 فترة المحاضرة (صباحي / مسائي)
  const [selectedScheduleStudyType, setSelectedScheduleStudyType] = useState<'morning' | 'evening'>('morning'); // ☀️🌙 تبويب فترة الجدول (صباحي / مسائي)
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
  const [isLecDayDropdownOpen, setIsLecDayDropdownOpen] = useState<boolean>(false); // 🗓️ حالة فتح قائمة اليوم المخصصة
  const lecDayButtonRef = useRef<HTMLButtonElement | null>(null);
  const [lecDayCoords, setLecDayCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  const [isLecTypeDropdownOpen, setIsLecTypeDropdownOpen] = useState<boolean>(false); // 🔬 حالة فتح قائمة نوع المحاضرة
  const lecTypeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [lecTypeCoords, setLecTypeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  const [isLecCourseDropdownOpen, setIsLecCourseDropdownOpen] = useState<boolean>(false); // 📚 حالة فتح قائمة المقرر
  const lecCourseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [lecCourseCoords, setLecCourseCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  const [isLecTeacherDropdownOpen, setIsLecTeacherDropdownOpen] = useState<boolean>(false); // 👨‍🏫 حالة فتح قائمة الأستاذ
  const lecTeacherButtonRef = useRef<HTMLButtonElement | null>(null);
  const [lecTeacherCoords, setLecTeacherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);

  const [isLecStartTimeDropdownOpen, setIsLecStartTimeDropdownOpen] = useState<boolean>(false); // ⏱️ حالة فتح منتقي وقت بدء المحاضرة الاحترافي
  const lecStartTimeButtonRef = useRef<HTMLButtonElement | null>(null); // 🎯 مرجع زر وقت البدء
  const [lecStartTimeCoords, setLecStartTimeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null); // 📍 إحداثيات منتقي وقت البدء

  const [isLecEndTimeDropdownOpen, setIsLecEndTimeDropdownOpen] = useState<boolean>(false); // ⏱️ حالة فتح منتقي وقت انتهاء المحاضرة الاحترافي
  const lecEndTimeButtonRef = useRef<HTMLButtonElement | null>(null); // 🎯 مرجع زر وقت الانتهاء
  const [lecEndTimeCoords, setLecEndTimeCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null); // 📍 إحداثيات منتقي وقت الانتهاء
  const [isPreviewScheduleModalOpen, setIsPreviewScheduleModalOpen] = useState<boolean>(false);
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
  }, [attendanceSearch, filterAttendanceStage, filterAttendanceStudyType, filterAttendanceStatus, filterAttendanceCourse, filterAttendanceSemester]);

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

    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);
    setCourses(loadedCourses);
    setTeacherCourses(loadedTCs);
    setGrades(loadedGrades);
    setScheduleLectures(loadedLecs);
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

    // 🏢 اختيار القسم
    if (user.department_id) {
      setCurrentDeptId(user.department_id);
    } else if (loadedDepts.length > 0) {
      setCurrentDeptId(loadedDepts[0].id);
    }

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
        if (cloudData.profiles && cloudData.profiles.length > 0) setProfiles(cloudData.profiles);
        if (cloudData.courses && cloudData.courses.length > 0) setCourses(cloudData.courses);
        if (cloudData.teacherCourses && cloudData.teacherCourses.length > 0) setTeacherCourses(cloudData.teacherCourses);
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

    // 🗓️ الاستماع المباشر السحابي والمحلي لتغيير العام الدراسي من المسؤول العام
    const unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
      setAcademicYear(liveYear);
    });

    window.addEventListener('tuition_records_updated', handleTuitionSync);
    window.addEventListener('storage', handleTuitionSync);

    return () => {
      window.removeEventListener('tuition_records_updated', handleTuitionSync);
      window.removeEventListener('storage', handleTuitionSync);
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
    return matchesSearch && matchesTeacher && matchesStage && matchesSemester;
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

  // 📋 نسخ بيانات الاعتماد
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        const updatedProfiles = profiles.filter((p) => p.id !== id);
        setProfiles(updatedProfiles);
        saveStoredData('profiles', updatedProfiles);
        deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف فوري من جدول teachers في Supabase

        const updatedTCs = teacherCourses.filter((tc) => tc.teacher_id !== id);
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

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
        selectedTeacherIds.forEach((id) => {
          deleteProfileFromSupabase(id, 'teacher'); // ☁️ حذف الأساتذة سحابياً
        });

        const updatedProfiles = profiles.filter((p) => !selectedTeacherIds.includes(p.id));
        const updatedTCs = teacherCourses.filter((tc) => !selectedTeacherIds.includes(tc.teacher_id));
        setProfiles(updatedProfiles);
        setTeacherCourses(updatedTCs);
        saveStoredData('profiles', updatedProfiles);
        saveStoredData('teacher_courses', updatedTCs);
        setSelectedTeacherIds([]);
        setSuccessMessage(`تم حذف (${count}) من أساتذة القسم بنجاح.`);
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

    // 🔄 مزامنة تكليفات الأساتذة (TeacherCourses) تلقائياً
    if (targetCourseId) {
      let filteredTCs = teacherCourses.filter((tc) => tc.course_id !== targetCourseId);
      if (theoryTeacher) {
        filteredTCs.push({
          id: `tc-th-${targetCourseId}-${theoryTeacher.id}`,
          teacher_id: theoryTeacher.id,
          teacher_name: theoryTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          semester: courseSemester,
          created_at: new Date().toISOString(),
        });
      }
      if (practicalTeacher && practicalTeacher.id !== theoryTeacher?.id) {
        filteredTCs.push({
          id: `tc-pr-${targetCourseId}-${practicalTeacher.id}`,
          teacher_id: practicalTeacher.id,
          teacher_name: practicalTeacher.full_name,
          course_id: targetCourseId,
          course_name: courseName.trim(),
          department_id: currentDeptId,
          semester: courseSemester,
          created_at: new Date().toISOString(),
        });
      }
      setTeacherCourses(filteredTCs);
      saveStoredData('teacher_courses', filteredTCs);
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

        const updatedTCs = teacherCourses.filter((tc) => tc.course_id !== id);
        setTeacherCourses(updatedTCs);
        saveStoredData('teacher_courses', updatedTCs);

        setSuccessMessage('تم حذف المادة وتكليفاتها بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
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
          theory_teacher_id: teacher.id,
          theory_teacher_name: teacher.full_name,
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
        setSuccessMessage('تم إلغاء التكليف الدراسي بنجاح.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
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

        const remainingCourses = courses.filter((c) => !selectedCourseIds.includes(c.id));
        setCourses(remainingCourses);
        saveStoredData('courses', remainingCourses);
        const remainingAssignments = teacherCourses.filter((tc) => !selectedCourseIds.includes(tc.course_id));
        setTeacherCourses(remainingAssignments);
        saveStoredData('teacher_courses', remainingAssignments);
        setSelectedCourseIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedCourseIds.length}) مادة من القسم`);
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

        const remaining = teacherCourses.filter((tc) => !selectedAssignmentIds.includes(tc.id));
        setTeacherCourses(remaining);
        saveStoredData('teacher_courses', remaining);
        setSelectedAssignmentIds([]);
        setSuccessMessage(`تم بنجاح إلغاء (${selectedAssignmentIds.length}) تكليف`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 🗑️ حذف جماعي لمحاضرات الجدول المحددة
  const handleBulkDeleteScheduleLectures = () => {
    if (selectedScheduleLectureIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'حذف المحاضرات المحددة من الجدول',
      itemName: `${selectedScheduleLectureIds.length} محاضرة أسبوعية`,
      itemDetails: 'سيتم حذف المحاضرات المحددة من الجدول الأسبوعي للمرحلة.',
      warningMessage: '⚠️ تحذير: سيتم إزالة هذه المحاضرات من جداول الطلاب والأساتذة فوراً.',
      confirmText: `تأكيد حذف (${selectedScheduleLectureIds.length}) محاضرة`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        selectedScheduleLectureIds.forEach((id) => {
          deleteScheduleLectureFromSupabase(id); // ☁️ حذف المحاضرات سحابياً
        });

        const remaining = scheduleLectures.filter((l) => !selectedScheduleLectureIds.includes(l.id));
        setScheduleLectures(remaining);
        saveStoredData('schedule_lectures', remaining);
        setSelectedScheduleLectureIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedScheduleLectureIds.length}) محاضرة من الجدول الأسبوعي`);
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

  // ==========================================
  // 5️⃣ إدارة أيام الدوام والعطل الأسبوعية الرسمية (Working & Off Days)
  // ==========================================
  const currentScheduleConfig = getScheduleConfigOrDefault(
    scheduleConfigs,
    currentDeptId,
    selectedScheduleStage,
    selectedScheduleSemester
  );

  // 🗓️ تبديل حالة اليوم بين دوام وعطلة بعد أخذ موافقة وتأكيد المستخدم
  const handleToggleWorkingDay = (dayKey: DayOfWeek) => {
    const isCurrentlyOff = currentScheduleConfig.off_days.includes(dayKey);
    const dayName = DAYS_OF_WEEK_LIST.find((d) => d.key === dayKey)?.label_ar || dayKey;
    const stageName = getStageNameInArabic(selectedScheduleStage);
    const semesterName = selectedScheduleSemester === 1 ? 'الأول' : 'الثاني';

    // حساب عدد المحاضرات المجدولة لهذا اليوم
    const dayLecturesCount = scheduleLectures.filter(
      (l) =>
        l.department_id === currentDeptId &&
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
            l.department_id === currentDeptId &&
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

        const newLecId = `lec-xl-${Date.now()}-${index}`;
        const newLecture: ScheduleLecture = {
          id: newLecId,
          department_id: currentDeptId,
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
          created_at: new Date().toISOString(),
        };

        newLecturesToAdd.push(newLecture);
        tempAllLectures.push(newLecture);

        accepted.push({
          name: `${finalCourseName} — ${finalLectureType === 'practical' ? 'مختبر وعملي' : 'محاضرة نظرية'}`,
          dept: `المرحلة ${stageNumber} (كورس ${semesterNumber}) | ${DAYS_OF_WEEK_LIST.find((d) => d.key === parsedDay)?.label_ar || parsedDay} (${startTime} - ${endTime})`,
          email: `${roomName} ${teacherFullName ? `| أ. ${teacherFullName}` : ''}`,
        });
      });

      if (newLecturesToAdd.length > 0) {
        const merged = [...scheduleLectures, ...newLecturesToAdd];
        setScheduleLectures(merged);
        saveStoredData('department_schedule_lectures', merged);

        // ☁️ مزامنة سحابية مع Supabase
        for (const l of newLecturesToAdd) {
          saveScheduleLectureToSupabase(l);
        }
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
    const deptLectures = scheduleLectures.filter((l) => l.department_id === currentDeptId);
    if (deptLectures.length === 0) {
      setErrorMessage('لا توجد محاضرات مجدولة حالياً للتصدير في هذا القسم.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    await exportCustomScheduleList(deptLectures, deptName);
    setSuccessMessage(`تم تصدير (${deptLectures.length}) محاضرة دراسية إلى ملف Excel بنجاح! 📊`);
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

    const isCoursePractical = course.course_type === 'theory_and_practical' || Boolean(course.has_practical); // 🔬 فحص هل المادة تحتوي على شق عملي؟
    let safeType: LectureType = lecType || (isCoursePractical ? 'practical' : 'theory'); // 🏷️ نوع المحاضرة الآمن
    let safeColor = lecColor || (safeType === 'practical' ? 'emerald' : 'blue'); // 🎨 لون الكارد المعتمد

    const safeDay: DayOfWeek = (lecDay as DayOfWeek) || 'sunday'; // 🗓️ اليوم المعتمد الآمن
    const teacher = deptTeachers.find((t) => t.id === lecTeacherId); // 👨‍🏫 جلب بيانات التدريسي المختار

    // 🛡️ فحص التضارب الزمني للقاعة والأستاذ في نفس التوقيت واليوم والفترة الدراسية
    // 🛡️ فحص التضارب الزمني للقاعة والأستاذ في نفس التوقيت واليوم والفترة الدراسية
    if (currentLecConflicts.length > 0) {
      setErrorMessage(currentLecConflicts[0]?.message || 'يوجد تعارض زمني في القاعة أو الأستاذ لهذا التوقيت!'); // ⚠️ إشعار بالتعارض
      setTimeout(() => setErrorMessage(''), 4500);
      return;
    }

    const dayLabel = DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay; // 🗓️ اسم اليوم بالعربي
    const currentEditingId = editingLectureId; // 🆔 حفظ المعرف الحالي قبل التصفير

    if (editingLectureId) {
      // ✏️ تعديل محاضرة قائمة
      let updatedLecToSync: ScheduleLecture | null = null;
      const updated = scheduleLectures.map((l) => {
        if (l.id === editingLectureId) {
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

      setEditingLectureId(null); // 🔄 تصفير التعديل
      setLecRoom(''); // 🧹 تنظيف القاعة
      setLecNotes(''); // 🧹 تنظيف الملاحظات

      if (closeModalAfterSave) {
        setIsLectureModalOpen(false); // 🚀 غلق المودال فقط إذا اختار المستخدم حفظ وإغلاق
        setSuccessMessage(`تم تحديث محاضرة (${course.name}) في جدول يوم ${dayLabel} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setLecCourseId(''); // 🧹 تصفير المادة
        setLecTeacherId(''); // 🧹 تصفير الأستاذ
        setLecDay(''); // 🗓️ تصفير اليوم
        setLecType(''); // 🏷️ تصفير النوع
        setLecStartTime(''); // ⏱️ تصفير البدء
        setLecEndTime(''); // ⏱️ تصفير الانتهاء
      } else {
        // ✨ الإبقاء على الكارد مفتوحاً لمواصلة التعديل أو إضافة محاضرات أخرى باحترافية
        setRecentlyAddedLectureId(currentEditingId);
        setTimeout(() => setRecentlyAddedLectureId(null), 5000);
        setLecModalSuccessMsg(`✅ تم تحديث بيانات محاضرة (${course.name}) بنجاح في جدول يوم ${dayLabel}!`);
        setTimeout(() => setLecModalSuccessMsg(''), 5000);
      }
    } else {
      // ➕ إضافة محاضرة جديدة
      const newLecId = `lec-${Date.now()}`; // 🆔 توليد معرف فريد للمحاضرة
      const newLec: ScheduleLecture = {
        id: newLecId,
        department_id: currentDeptId, // 🏢 القسم
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
        setIsLectureModalOpen(false); // 🚀 غلق المودال إذا اختار المستخدم إدراج وإنهاء
        setSuccessMessage(`تمت إضافة محاضرة (${course.name}) إلى جدول المرحلة ${selectedScheduleStage} وتوثيقها سحابياً بنجاح!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setLecRoom(''); // 🧹 تنظيف القاعة
        setLecNotes(''); // 🧹 تنظيف الملاحظات
        setLecCourseId(''); // 🧹 تنظيف المادة
        setLecTeacherId(''); // 🧹 تنظيف الأستاذ
        setLecDay(''); // 🗓️ تصفير اليوم
        setLecType(''); // 🏷️ تصفير طبيعة المحاضرة
        setLecStartTime(''); // ⏱️ تصفير البدء
        setLecEndTime(''); // ⏱️ تصفير الانتهاء
      } else {
        // 🌟 الإبقاء على الكارد مفتوحاً للإدراج المتتالي الفوري بدون انقطاع
        setRecentlyAddedLectureId(newLecId);
        setTimeout(() => setRecentlyAddedLectureId(null), 6000);

        setLecModalSuccessMsg(`✅ تم إدراج محاضرة (${course.name}) بنجاح في جدول (${dayLabel})! يمكنك إدخال المحاضرة التالية فوراً.`);
        setTimeout(() => setLecModalSuccessMsg(''), 6000);

        // 📜 تمرير القائمة تلقائياً للمحاضرة المضافة حديثاً بسلاسة واحترافية
        setTimeout(() => {
          const cardEl = document.getElementById(`lec-card-${newLecId}`); // 🔍 جلب عنصر كارت المحاضرة الجديدة
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 🚀 سكرول مباشر وسلس لكارت المحاضرة
          } else if (lecListContainerRef.current) {
            lecListContainerRef.current.scrollTo({ top: lecListContainerRef.current.scrollHeight, behavior: 'smooth' }); // 🚀 سكرول لأسفل القائمة
          }
        }, 150);

        // ⏱️ تقديم الوقت تلقائياً للمحاضرة التالية (من نهاية السابقة + مدة المحاضرة الأكاديمية)
        const { nextStart, nextEnd } = advanceToNextTimeSlot(lecEndTime, lecType);
        setLecStartTime(nextStart); // ⏱️ ضبط وقت بدء المحاضرة القادمة
        setLecEndTime(nextEnd); // ⏱️ ضبط وقت انتهاء المحاضرة القادمة

        // 🧹 تنظيف المادة والأستاذ والقاعة والملاحظات لاستقبال المحاضرة القادمة
        setLecCourseId(''); // 🧹 تصفير المادة
        setLecTeacherId(''); // 🧹 تصفير الأستاذ
        setLecRoom(''); // 🧹 تصفير القاعة
        setLecNotes(''); // 🧹 تصفير الملاحظات
      }
    }
  };

  const parseTime24To12 = (time24: string) => {
    const [hRaw, mRaw] = (time24 || '08:30').split(':');
    let h = parseInt(hRaw || '8', 10);
    const m = mRaw || '30';
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    let h12 = h;
    if (h === 0) h12 = 12;
    else if (h > 12) h12 = h - 12;
    const hDisplay = String(h12).padStart(2, '0');
    const periodArabic = period === 'AM' ? 'صباحاً' : 'مساءً';
    return {
      hour12: h12,
      hourDisplay: hDisplay,
      minute: m,
      period,
      periodArabic,
      displayFull: `${hDisplay}:${m} ${periodArabic}`,
      time24: `${String(h).padStart(2, '0')}:${m}`
    };
  };

  // 🔄 دمج الساعة 12 والدقيقة والفترة إلى صيغة 24 ساعة المعتمدة (HH:mm)
  const format12To24 = (hour12: number, minute: string, period: 'AM' | 'PM'): string => {
    let h24 = hour12;
    if (period === 'PM' && hour12 < 12) {
      h24 = hour12 + 12;
    } else if (period === 'AM' && hour12 === 12) {
      h24 = 0;
    }
    return `${String(h24).padStart(2, '0')}:${minute}`;
  };

  // 🔽 دوال فتح وإغلاق القوائم المنسدلة المخصصة مع الحساب الذكي للموضع داخل الشاشة
  const handleToggleLecDayDropdown = () => {
    if (!isLecDayDropdownOpen && lecDayButtonRef.current) {
      setLecDayCoords(calculateSmartDropdownPosition(lecDayButtonRef.current, 240));
      setIsLecDayDropdownOpen(true);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
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
    } else {
      setIsLecTypeDropdownOpen(false);
    }
  };

  const handleToggleLecCourseDropdown = () => {
    if (!isLecCourseDropdownOpen && lecCourseButtonRef.current) {
      setLecCourseCoords(calculateSmartDropdownPosition(lecCourseButtonRef.current, 260));
      setIsLecCourseDropdownOpen(true);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
    } else {
      setIsLecCourseDropdownOpen(false);
    }
  };

  const handleToggleLecTeacherDropdown = () => {
    if (!isLecTeacherDropdownOpen && lecTeacherButtonRef.current) {
      setLecTeacherCoords(calculateSmartDropdownPosition(lecTeacherButtonRef.current, 220));
      setIsLecTeacherDropdownOpen(true);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
    } else {
      setIsLecTeacherDropdownOpen(false);
    }
  };

  const handleToggleLecStartTimeDropdown = () => {
    if (!isLecStartTimeDropdownOpen && lecStartTimeButtonRef.current) {
      setLecStartTimeCoords(calculateSmartDropdownPosition(lecStartTimeButtonRef.current, 220)); // 📐 ضبط الارتفاع التقديري المدمج بعد حذف زر التأكيد
      setIsLecStartTimeDropdownOpen(true);
      setIsLecEndTimeDropdownOpen(false);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
    } else {
      setIsLecStartTimeDropdownOpen(false);
    }
  };

  const handleToggleLecEndTimeDropdown = () => {
    if (!isLecEndTimeDropdownOpen && lecEndTimeButtonRef.current) {
      setLecEndTimeCoords(calculateSmartDropdownPosition(lecEndTimeButtonRef.current, 220)); // 📐 ضبط الارتفاع التقديري المدمج بعد حذف زر التأكيد
      setIsLecEndTimeDropdownOpen(true);
      setIsLecStartTimeDropdownOpen(false);
      setIsLecDayDropdownOpen(false);
      setIsLecTypeDropdownOpen(false);
      setIsLecCourseDropdownOpen(false);
      setIsLecTeacherDropdownOpen(false);
    } else {
      setIsLecEndTimeDropdownOpen(false);
    }
  };

  // 🔄 إغلاق القوائم المنسدلة لكارت المحاضرات عند تغيير حجم الشاشة (دون التأثير على السكرول الداخلي للقائمة)
  useEffect(() => {
    const handleCloseLecDropdowns = () => {
      if (isLecDayDropdownOpen) setIsLecDayDropdownOpen(false);
      if (isLecTypeDropdownOpen) setIsLecTypeDropdownOpen(false);
      if (isLecCourseDropdownOpen) setIsLecCourseDropdownOpen(false);
      if (isLecTeacherDropdownOpen) setIsLecTeacherDropdownOpen(false);
      if (isLecStartTimeDropdownOpen) setIsLecStartTimeDropdownOpen(false);
      if (isLecEndTimeDropdownOpen) setIsLecEndTimeDropdownOpen(false);
    };
    if (isLecDayDropdownOpen || isLecTypeDropdownOpen || isLecCourseDropdownOpen || isLecTeacherDropdownOpen || isLecStartTimeDropdownOpen || isLecEndTimeDropdownOpen) {
      window.addEventListener('resize', handleCloseLecDropdowns);
    }
    return () => {
      window.removeEventListener('resize', handleCloseLecDropdowns);
    };
  }, [isLecDayDropdownOpen, isLecTypeDropdownOpen, isLecCourseDropdownOpen, isLecTeacherDropdownOpen, isLecStartTimeDropdownOpen, isLecEndTimeDropdownOpen]);

  // 🕒 مكون القائمة المنسدلة الاحترافية لاختيار التوقيت الأكاديمي
  // 🕒 مكون القائمة المنسدلة الاحترافية لاختيار التوقيت الأكاديمي المباشر
  const renderCustomTimePickerDropdown = (
    coords: { top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean },
    title: string,
    currentTime24: string,
    onTimeChange: (newTime: string) => void,
    onClose: () => void,
    _currentStudyType?: 'morning' | 'evening'
  ) => {
    const parsed = parseTime24To12(currentTime24);

    const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
    const minutesList = ['00', '15', '30', '45', '10', '20', '40', '50'];

    const handleHourSelect = (h12: number) => {
      const newTime24 = format12To24(h12, parsed.minute, parsed.period);
      onTimeChange(newTime24);
    };

    const handleMinuteSelect = (min: string) => {
      const newTime24 = format12To24(parsed.hour12, min, parsed.period);
      onTimeChange(newTime24);
    };

    const handlePeriodSelect = (p: 'AM' | 'PM') => {
      const newTime24 = format12To24(parsed.hour12, parsed.minute, p);
      onTimeChange(newTime24);
    };

    const popoverWidth = Math.max(340, Math.min(420, coords.width));

    return (
      <div
        style={{
          position: 'fixed',
          ...(coords.openUpwards
            ? { bottom: `${coords.bottom}px` }
            : { top: `${coords.top}px` }),
          left: `${coords.left}px`,
          width: `${popoverWidth}px`,
          maxHeight: `${coords.maxHeight || 240}px`, // 📐 الارتفاع الأقصى المدمج المناسب لمنتقي الوقت بعد حذف زر التأكيد
        }}
        className="bg-white border-2 border-slate-300 rounded-3xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* رأس التوقيت المختار */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-xs">
              <Clock className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              {/* 🏷️ عنوان التوقيت بالأسود الفاحم الصريح */}
              <div className="text-xs font-black text-black">{title}</div>
              {/* 🕒 النص الكامل للتوقيت بالأسود الفاحم عالي التباين */}
              <div className="text-base font-black text-black flex items-center gap-1.5">
                <span>{parsed.displayFull}</span>
                {/* ⏱️ صيغة الـ 24 ساعة بالأسود الفاحم الصريح */}
                <span className="text-xs font-mono font-black text-black">({parsed.time24})</span>
              </div>
            </div>
          </div>
          {/* ❌ زر إغلاق نافذة التوقيت */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-black hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 🎛️ منتقي الساعات والدقائق والفترة (AM/PM) بتصميم هندسي كحلي موحد */}
        <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-100">
          {/* 1. الساعات */}
          <div className="col-span-6 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الساعة:</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {hoursList.map((h) => {
                const isSelected = parsed.hour12 === h;
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

          {/* 2. الدقائق */}
          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الدقيقة:</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {minutesList.map((m) => {
                const isSelected = parsed.minute === m;
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

          {/* 3. الفترة (صباحاً / مساءً) */}
          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الفترة:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handlePeriodSelect('AM')}
                className={`py-2 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  parsed.period === 'AM'
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
                  parsed.period === 'PM'
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

        {/* 🧹 زر مسح التوقيت وإلغاء التحديد عند الرغبة (تم حذف زر تأكيد التوقيت لعدم فائدته) */}
        {currentTime24 && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onTimeChange(''); // 🧹 مسح التوقيت وإرجاعه غير محدد
                onClose(); // 🚪 إغلاق نافذة اختيار الوقت
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer text-center"
              title="إلغاء تحديد هذا الوقت وجعله غير محدد"
            >
              مسح التوقيت (إلغاء التحديد)
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleEditLecture = (lec: ScheduleLecture) => {
    setEditingLectureId(lec.id); // ✏️ تثبيت آيدي المحاضرة المراد تعديلها
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
      
      {/* 🏛️ الهيدر الكحلي الرسمي لإدارة القسم بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
              <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={64} height={64} className="object-contain" priority />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-950 text-white font-black text-sm rounded-xl shadow-xs">
                  {currentDepartment?.code || 'القسم'}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>
                    {currentUser?.role === 'department_head' ? 'بوابة رئيس القسم' : currentUser?.role === 'rapporteur' ? 'بوابة مقرر القسم' : 'صلاحية المسؤول العام'}
                  </span>
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-xs">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2 mt-2">
                <Building2 className="w-7 h-7 text-slate-900" />
                <span>لوحة إدارة قسم {deptName}</span>
              </h1>
              <p className="text-base sm:text-lg font-black text-black mt-1">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان
              </p>
            </div>
          </div>

          {/* 🏢 خيار تبديل القسم للمسؤول العام بقائمة مخصصة وفاخرة */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
              <span className="text-sm font-black text-slate-950 px-2">تبديل القسم:</span>
              <div className="relative">
                <button
                  ref={deptSwitcherButtonRef}
                  type="button"
                  onClick={handleToggleDeptSwitcherDropdown}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-slate-800 rounded-xl text-sm font-black text-slate-950 flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  <Building2 className="w-4 h-4 text-blue-900" />
                  <span>
                    {departments.find((d) => d.id === currentDeptId)?.name || 'اختر قسماً'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isDeptSwitcherDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDeptSwitcherDropdownOpen && typeof document !== 'undefined' && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[999998] cursor-default"
                      onClick={() => setIsDeptSwitcherDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'fixed',
                        top: deptSwitcherCoords?.top,
                        bottom: deptSwitcherCoords?.bottom,
                        left: deptSwitcherCoords?.left,
                        minWidth: Math.max(220, deptSwitcherCoords?.width || 220),
                        maxHeight: deptSwitcherCoords?.maxHeight || 260,
                        zIndex: 999999,
                      }}
                      className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl p-2 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150 text-right"
                      dir="rtl"
                    >
                      {departments.map((d) => {
                        const isSelected = d.id === currentDeptId;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setCurrentDeptId(d.id);
                              setIsDeptSwitcherDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-950 border border-blue-300 font-black'
                                : 'text-slate-900 hover:bg-slate-100 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                              <span>{d.name} ({d.code})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-800 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🏢 شريط تفاصيل القسم المرتبط والقيادة الأكاديمية */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-base font-black text-slate-950">
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>رئيس القسم:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{currentHead?.full_name || 'غير معين'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-900" />
              <span>مقرر القسم:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{currentRap?.full_name || 'غير معين'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-900" />
              <span>التدريسيين والطلبة:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{deptTeachers.length} أستاذ • {deptStudents.length} طالب</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-900" />
              <span>المناهج والمراحل:</span>
            </span>
            <span className="font-black text-slate-950 text-base sm:text-lg">{deptCourses.length} مادة • 4 مراحل دراسية</span>
          </div>
        </div>
      </div>

      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف أستاذ أو طالب أو مادة */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">تنبيه النظام</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 📇 نافذة / بطاقة بيانات الحساب الأكاديمي الصادر المنبثقة بخلفية زجاجية و z-[999999] */}
      {selectedCardProfile && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white text-slate-950 border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right">
            
            {/* رأس البطاقة الفاخر */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <QrCode className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    بطاقة بيانات الحساب الأكاديمي الصادر
                  </h3>
                  <p className="text-xs font-bold text-slate-700">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان | قسم {deptName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardProfile(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="إغلاق البطاقة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* شبكة الحقول والمعلومات الأكاديمية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-black">
              {/* الاسم الكامل */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-700 text-xs font-bold">الاسم الكامل:</span>
                <p className="text-slate-950 font-black text-base">{selectedCardProfile.full_name}</p>
              </div>

              {/* الدور والقسم / المرحلة */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-700 text-xs font-bold">الصفة والمرحلة:</span>
                <p className="text-slate-950 font-black text-sm flex items-center gap-1.5 mt-0.5">
                  {selectedCardProfile.role === 'teacher' ? (
                    <>
                      <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>تدريسي — قسم {deptName}</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>طالب — المرحلة {getStageNameInArabic(selectedCardProfile.stage_number || 1)} ({selectedCardProfile.study_type === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'})</span>
                    </>
                  )}
                </p>
              </div>

              {/* البريد الأكاديمي */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-700 text-xs font-bold">البريد الأكاديمي المعتمد:</span>
                <p className="text-blue-950 font-black text-sm select-all font-mono" dir="ltr">{selectedCardProfile.generated_email}</p>
              </div>

              {/* كلمة المرور الأكاديمية */}
              {selectedCardProfile.temp_password && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                  <span className="text-slate-700 text-xs font-bold">كلمة المرور الأكاديمية:</span>
                  <p className="text-emerald-800 font-black text-sm select-all font-mono" dir="ltr">{selectedCardProfile.temp_password}</p>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات والفوتر */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCardProfile(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => handleCopy(
                  `جامعة الإمام جعفر الصادق (ع) - فرع ميسان | قسم ${deptName}\nالاسم: ${selectedCardProfile.full_name}\nالصفة: ${selectedCardProfile.role === 'teacher' ? 'تدريسي' : `طالب - المرحلة ${getStageNameInArabic(selectedCardProfile.stage_number || 1)}`}\nالبريد الأكاديمي: ${selectedCardProfile.generated_email}\n${selectedCardProfile.temp_password ? `الرمز: ${selectedCardProfile.temp_password}\n` : ''}رابط المنصة: ${typeof window !== 'undefined' ? window.location.origin : ''}`,
                  selectedCardProfile.id
                )}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#0F2942]"
              >
                {copiedId === selectedCardProfile.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-300" />}
                <span>{copiedId === selectedCardProfile.id ? 'تم نسخ البيانات!' : 'نسخ البطاقة بالكامل'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔀 شريط التبويبات الـ 11 المنسق والمتوازن بدقة هندسية شاملة وبدون تثبيت مزعج */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2 sm:p-2.5 rounded-3xl shadow-sm relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 sm:gap-2.5">
          
          {/* 1. أساتذة القسم */}
          <button
            type="button"
            id="admin-tab-teachers"
            onClick={() => handleTabSwitch('teachers')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'teachers'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Users className={`w-5 h-5 flex-shrink-0 ${activeTab === 'teachers' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الأساتذة</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'teachers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptTeachers.length}
            </span>
          </button>

          {/* 2. طلاب القسم */}
          <button
            type="button"
            id="admin-tab-students"
            onClick={() => handleTabSwitch('students')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'students'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <GraduationCap className={`w-5 h-5 flex-shrink-0 ${activeTab === 'students' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الطلاب</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptStudents.length}
            </span>
          </button>

          {/* 3. مواد القسم */}
          <button
            type="button"
            id="admin-tab-courses"
            onClick={() => handleTabSwitch('courses')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'courses'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <BookOpen className={`w-5 h-5 flex-shrink-0 ${activeTab === 'courses' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">المواد</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'courses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptCourses.length}
            </span>
          </button>

          {/* 4. تكليفات المواد */}
          <button
            type="button"
            id="admin-tab-assignments"
            onClick={() => handleTabSwitch('assignments')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'assignments'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Layers className={`w-5 h-5 flex-shrink-0 ${activeTab === 'assignments' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">التكليفات</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptTeacherCourses.length}
            </span>
          </button>

          {/* 5. درجات وسعيات القسم */}
          <button
            type="button"
            id="admin-tab-grades"
            onClick={() => handleTabSwitch('grades')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'grades'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 flex-shrink-0 ${activeTab === 'grades' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الدرجات</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'grades' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'}`}>
              {deptGrades.length}
            </span>
          </button>

          {/* 6. الجدول الأسبوعي */}
          <button
            type="button"
            id="admin-tab-schedule"
            onClick={() => handleTabSwitch('schedule')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'schedule'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <Clock className={`w-5 h-5 flex-shrink-0 ${activeTab === 'schedule' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الجدول</span>
          </button>

          {/* 7. الحضور والإنذارات */}
          <button
            type="button"
            id="admin-tab-attendance"
            onClick={() => handleTabSwitch('attendance')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'attendance'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <ClipboardList className={`w-5 h-5 flex-shrink-0 ${activeTab === 'attendance' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الحضور</span>
          </button>

          {/* 8. جداول الامتحانات النهائية */}
          <button
            type="button"
            id="admin-tab-exams"
            onClick={() => handleTabSwitch('exams')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'exams'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <FileText className={`w-5 h-5 flex-shrink-0 ${activeTab === 'exams' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الامتحانات</span>
          </button>

          {/* 9. تدقيق التكليفات والامتحانات الفصلية */}
          <button
            type="button"
            id="admin-tab-course_tasks"
            onClick={() => handleTabSwitch('course_tasks')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'course_tasks'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <CheckSquare className={`w-5 h-5 flex-shrink-0 ${activeTab === 'course_tasks' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">المهام</span>
          </button>

          {/* 10. تسديد الأقساط الدراسية */}
          <button
            type="button"
            id="admin-tab-tuition"
            onClick={() => handleTabSwitch('tuition')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'tuition'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <CreditCard className={`w-5 h-5 flex-shrink-0 ${activeTab === 'tuition' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">الأقساط</span>
          </button>

          {/* 11. الرسوم البيانية والإحصائيات */}
          <button
            type="button"
            id="admin-tab-analytics"
            onClick={() => handleTabSwitch('analytics')}
            className={`py-3 px-2 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer border select-none active:scale-[0.98] ${
              activeTab === 'analytics'
                ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/30'
                : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100 hover:text-black hover:border-slate-400'
            }`}
          >
            <BarChart3 className={`w-5 h-5 flex-shrink-0 ${activeTab === 'analytics' ? 'text-blue-200' : 'text-slate-900'}`} />
            <span className="truncate">التحليلات</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1️⃣ تبويب إدارة أساتذة القسم (Teachers CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (() => {
        const totalDeptTch = deptTeachers.length;
        const totalMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
        const totalFemales = totalDeptTch - totalMales;
        const malePct = totalDeptTch > 0 ? Math.round((totalMales / totalDeptTch) * 100) : 0;
        const femalePct = totalDeptTch > 0 ? Math.round((totalFemales / totalDeptTch) * 100) : 0;

        return (
          <div className="space-y-4">
            
            {/* 📊 شريط كادر التدريسيين وإحصائياته وشريط الأزرار الأربعة بسطر واحد احترافي */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              {/* 🏷️ الصف العلوي: العنوان والتوصيف + الإحصائيات الديموغرافية */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <Users className="w-7 h-7 text-slate-950" />
                    <span>كادر التدريسيين المعتمد لقسم {deptName}</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    إجمالي التدريسيين المكلفين بالتدريس الفعلي في القسم
                  </p>
                </div>

                {/* 🧮 شارات الإحصائيات (الإجمالي، الذكور، الإناث) */}
                <div className="flex flex-wrap items-center gap-2.5 text-base font-black">
                  <span className="bg-slate-100 text-slate-950 px-4 py-2 rounded-2xl border border-slate-300 shadow-2xs">
                    الإجمالي: {totalDeptTch} تدريسي
                  </span>
                  <span className="bg-blue-100 text-blue-950 px-4 py-2 rounded-2xl border border-blue-300 shadow-2xs">
                     الذكور: {totalMales} ({malePct}%)
                  </span>
                  <span className="bg-rose-100 text-rose-950 px-4 py-2 rounded-2xl border border-rose-300 shadow-2xs">
                     الإناث: {totalFemales} ({femalePct}%)
                  </span>
                </div>
              </div>

              {/* 🔘 شريط الأزرار الأربعة بسطر واحد احترافي وموحد 100% */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
                {/* ➕ زر فتح كارت الإضافة وتوليد الحساب العائم */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacherId(null);
                    setTeacherName('');
                    setCustomTeacherEmail('');
                    setCustomTeacherPassword('');
                    setTeacherGender(null); // 🔄 تصفير جنس الأستاذ ليكون غير محدد افتراضياً
                    setShowTeacherPassword(false); // 🔒 إخفاء كلمة المرور بنجوم افتراضياً
                    setNameError('');
                    setIsTeacherModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5 text-cyan-300" />
                  <span>إضافة أستاذ جديد</span>
                </button>

                {/* 🖨️ زر طباعة وتصدير بطاقات اعتماد الأساتذة بصيغة PDF (10 بطاقات بالورقة الواحدة A4) */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={() => {
                    setSingleTeacherPrintProfile(null); // 🔄 تصفير البطاقة الفردية لعرض كافة الأساتذة أو المحددين
                    setShowTeacherPrintModal(true); // 🖨️ فتح نافذة معاينة وطباعة بطاقات الأساتذة A4
                  }}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
                  title="طباعة بطاقات حسابات الأساتذة وتصديرها كملف PDF"
                >
                  <Printer className="w-5 h-5 text-cyan-300" /> {/* 🖨️ أيقونة الطابعة والـ PDF باللون الفيروزي المشرق المتناسق */}
                  <span>طباعة البطاقات (PDF)</span> {/* 📝 نص الزر الرسمي */}
                </button>

                {/* 📥 زر تنزيل نموذج Excel المعتمد بتصميم كحلي فاخر مطابق لزر إضافة أستاذ */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={handleDownloadTeacherTemplate} // ⚡ تشغيل دالة تنزيل قالب الأساتذة المعتمد
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                  title="تنزيل نموذج Excel المعتمد لأساتذة القسم" // 💡 نص التلميح
                >
                  <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                  <span>نموذج Excel</span> {/* 📝 نص الزر */}
                </button>

                {/* ℹ️ زر تعليمات الاستيراد بتصميم كحلي فاخر مطابق لزر إضافة أستاذ */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={() => setShowExcelInstructions(true)} // ⚡ فتح نافذة التعليمات
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                  title="تعليمات وضوابط الاستيراد" // 💡 نص التلميح
                >
                  <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                  <span>التعليمات</span> {/* 📝 نص الزر */}
                </button>

                {/* 📤 زر استيراد ملف Excel لأساتذة القسم بأيقونة فيروزية أنيقة متناسقة مع الكحلي الملكي */}
                <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap">
                  <Upload className="w-5 h-5 text-cyan-300" />
                  <span>{isImportingExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleTeacherExcelUpload}
                    disabled={isImportingExcel}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل أستاذ بخلفية زجاجية كاملة */}
            <FloatingCrudModal
              isOpen={isTeacherModalOpen}
              onClose={() => {
                setIsTeacherModalOpen(false);
                setEditingTeacherId(null);
                setTeacherName('');
                setCustomTeacherEmail('');
                setCustomTeacherPassword('');
                setNameError('');
              }}
              title={editingTeacherId ? 'تعديل بيانات الأستاذ الأكاديمي' : 'إضافة أستاذ جديد وتوليد الحساب الأكاديمي'}
              subtitle={editingTeacherId ? `تعديل بيانات الحساب للأستاذ في قسم ${deptName}` : `سيتم توليد البريد الأكاديمي وكلمة المرور وحفظ الحساب بقسم ${deptName} فورياً`}
              icon={editingTeacherId ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              maxWidth="max-w-3xl"
              onSubmit={handleSaveTeacher}
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeacherModalOpen(false);
                      setEditingTeacherId(null);
                      setTeacherName('');
                      setCustomTeacherEmail('');
                      setCustomTeacherPassword('');
                      setNameError('');
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{editingTeacherId ? 'حفظ التعديلات' : 'إضافة وتوليد الحساب'}</span>
                  </button>
                </>
              }
            >
              <div className="space-y-5 text-base font-black">
                
                {/* ⚡ شريط التوليد التلقائي لبيانات الاعتماد الرسمية */}
                <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="text-sm text-slate-800 font-bold">
                    يمكنك التوليد التلقائي لبريد أكاديمي رسمي فريد ورمز دخول معقد فريد 100%:
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCredentials}
                    className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#0F2942] active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>توليد بريد ورمز معقد تلقائياً</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-950 font-black text-base">الاسم الكامل واللقب الأكاديمي *</label>
                    {nameError && (
                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                        {nameError}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => {
                      setTeacherName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="مثال: أ.د. كرار جاسم المحمداوي..."
                    className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-950 font-black text-base focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold ${
                      nameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">القسم العلمي الأكاديمي:</label>
                    <div className="px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 font-black text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-700" />
                      <span>{deptName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">الجنس (اللقب والصفة):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTeacherGender('male')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          teacherGender === 'male'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                        }`}
                      >
                        <span>ذكر (أستاذ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherGender('female')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          teacherGender === 'female'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                        }`}
                      >
                        <span>أنثى (أستاذة)</span>
                      </button>
                    </div>
                    {teacherGender === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار جنس الأستاذ (ذكر أو أنثى)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* ✉️ حقل البريد الأكاديمي المخصص و 🔑 حقل كلمة المرور */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* البريد */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-sm">
                        البريد الأكاديمي (اختياري - يترك فارغاً للتوليد)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomTeacherEmail(generateStrongUniqueEmail('dr', profiles))}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد بريد أكاديمي رسمي فريد للأستاذ"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                        <span>توليد بريد فريد</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customTeacherEmail}
                      onChange={(e) => setCustomTeacherEmail(e.target.value)}
                      placeholder="مثال: dr.karrar@sadiq.edu.iq"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                      dir="ltr"
                    />
                    {customTeacherEmail.trim() && !checkEmailUniquenessAcrossSystem(customTeacherEmail, editingTeacherId || undefined, profiles).isUnique && (
                      <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-950 flex items-center gap-1.5 mt-1.5 animate-in fade-in duration-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{checkEmailUniquenessAcrossSystem(customTeacherEmail, editingTeacherId || undefined, profiles).errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* كلمة المرور */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-sm">
                        كلمة المرور (اختياري - تترك فارغة للتوليد)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomTeacherPassword(generateStrongPassword(profiles))}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد رمز سري قوي عشوائي غير مكرر نهائياً"
                      >
                        <Key className="w-3.5 h-3.5 text-emerald-700" />
                        <span>توليد رمز عشوائي قوي</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showTeacherPassword ? 'text' : 'password'}
                        value={customTeacherPassword}
                        onChange={(e) => setCustomTeacherPassword(e.target.value)}
                        placeholder="مثال: Sadiq#Prof2026!"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeacherPassword((prev) => !prev)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                        title={showTeacherPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        aria-label={showTeacherPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showTeacherPassword ? (
                          <EyeOff className="w-4.5 h-4.5 text-slate-700" />
                        ) : (
                          <Eye className="w-4.5 h-4.5 text-slate-700" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* 🛡️ صندوق شروط ومعايير كلمة المرور التفاعلية */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      <span>شروط ومعايير كلمة المرور الأكاديمية:</span>
                    </div>
                    {customTeacherPassword && (
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        passwordStrengthScore === 100 
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                          : passwordStrengthScore >= 50 
                            ? 'bg-sky-100 text-sky-950 border-sky-300' 
                            : 'bg-rose-100 text-rose-950 border-rose-300'
                      }`}>
                        {passwordStrengthScore === 100 ? 'رمز قوي ومثالي' : passwordStrengthScore >= 50 ? 'رمز متوسط' : 'رمز ضعيف'}
                      </span>
                    )}
                  </div>

                  {/* مؤشر القوة البصري */}
                  {customTeacherPassword && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrengthScore === 100 
                            ? 'bg-emerald-600' 
                            : passwordStrengthScore >= 50 
                              ? 'bg-sky-500' 
                              : 'bg-rose-500'
                        }`} 
                        style={{ width: `${passwordStrengthScore}%` }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      passwordCriteria.length ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {passwordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>8 خانات فأكثر</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      passwordCriteria.hasUpper ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>حرف كبير (A-Z)</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      passwordCriteria.hasNumber ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>رقم (0-9)</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      passwordCriteria.hasSpecial ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>رمز خاص (!@#$)</span>
                    </div>
                  </div>
                </div>

              </div>
            </FloatingCrudModal>

            {/* جدول أساتذة القسم */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <Users className="w-6 h-6 text-slate-900" />
                  <span>قائمة أساتذة قسم {deptName} ({deptTeachers.length})</span>
                </h3>

                {deptTeachers.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* 🔘 زر تحديد الكل باللون الكحلي الملكي الفاخر */}
                    <button
                      type="button"
                      onClick={toggleSelectAllTeachers}
                      className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm transition cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
                    >
                      {selectedTeacherIds.length === deptTeachers.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                )}
              </div>

              {/* 🎛️ شريط الإجراءات الجماعية الفاخر عند تحديد الأساتذة */}
              {selectedTeacherIds.length > 0 && (
                <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#0F2942] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-base text-white">
                        تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedTeacherIds.length})</strong> من أصل <span className="font-mono text-slate-300">({deptTeachers.length})</span> تدريسي
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBulkDeleteTeachers}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف المحدد ({selectedTeacherIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkExportTeachersExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير المحدد Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTeacherIds([])}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>
              )}
              
              {deptTeachers.length === 0 ? (
                <p className="text-center py-10 text-slate-950 font-black text-base">لا يوجد أساتذة مضافين في هذا القسم حتى الآن.</p>
              ) : (
                <>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right border-collapse text-base font-black">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base">
                        <th className="p-4 text-center text-base w-12">
                          <input
                            type="checkbox"
                            aria-label="تحديد جميع الأساتذة"
                            checked={deptTeachers.length > 0 && selectedTeacherIds.length === deptTeachers.length}
                            onChange={toggleSelectAllTeachers}
                            className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                          />
                        </th>
                        <th className="p-4 text-center text-base w-14">ت</th>
                        <th className="p-4 text-base">اسم الأستاذ</th>
                        <th className="p-4 text-center text-base">الترتيب</th>
                        <th className="p-4 text-base">الجنس</th>
                        <th className="p-4 text-base">البريد الأكاديمي</th>
                        <th className="p-4 text-base">المواد المكلف بها</th>
                        <th className="p-4 text-center text-base">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                      {(() => {
                        // 🧮 حسابات شريحة الصفحة لجدول الأساتذة
                        const totalTeachersCount = deptTeachers.length; // 🔢 إجمالي عدد أساتذة القسم
                        const safeTeacherPage = Math.max(1, Math.min(teacherPage, Math.max(1, Math.ceil(totalTeachersCount / teacherPageSize)))); // 🛡️ حماية رقم الصفحة
                        const teacherStartIndex = (safeTeacherPage - 1) * teacherPageSize; // 📍 بداية شريحة العرض
                        const paginatedDeptTeachers = deptTeachers.slice(teacherStartIndex, teacherStartIndex + teacherPageSize); // 📋 أساتذة الصفحة الحالية

                        return paginatedDeptTeachers.map((t, index) => {
                          const actualIndex = teacherStartIndex + index; // 🔢 التسلسل العام الحقيقي للأستاذ
                          const assigned = teacherCourses.filter((tc) => tc.teacher_id === t.id); // 📚 المواد المكلف بتدريسها
                          const gender = t.gender || detectArabicGender(t.full_name); // 🚻 تحديد جنس التدريسي
                          const isFirst = actualIndex === 0; // 🔝 هل هو الأول بالقائمة الكلية
                          const isLast = actualIndex === totalTeachersCount - 1; // 🔚 هل هو الأخير بالقائمة الكلية
                          const isSelected = selectedTeacherIds.includes(t.id); // 🔘 هل تم تحديده بمربع الاختيار

                          return (
                            <tr key={t.id} className={`transition ${isSelected ? 'bg-blue-50/70 font-black' : 'hover:bg-slate-50'}`}>
                              {/* 🔘 مربع التحديد الفردي */}
                              <td className="p-4 text-center whitespace-nowrap w-12" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  aria-label={`تحديد ${t.full_name}`}
                                  checked={isSelected}
                                  onChange={() => toggleSelectTeacher(t.id)}
                                  className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                                />
                              </td>

                              {/* 🔢 عمود التسلسل والترتيب الرقمي 1 2 3 */}
                              <td className="p-4 text-center font-black text-slate-950 text-base whitespace-nowrap">
                                <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-base shadow-2xs">
                                  {actualIndex + 1}
                                </span>
                              </td>

                              {/* 👤 اسم الأستاذ واضح وبارز وبدون أي دوائر أو أحرف إضافية */}
                              <td className="p-4 font-black text-slate-950 text-lg whitespace-nowrap">
                                <span className="font-black text-slate-950 text-lg tracking-tight">
                                  {t.full_name}
                                </span>
                              </td>

                              {/* 🎛️ عمود أزرار التقديم والتأخير للترتيب */}
                              <td className="p-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleMoveTeacher(actualIndex, 'up', deptTeachers, e)}
                                    disabled={isFirst}
                                    title="تقديم الأستاذ للأعلى"
                                    className={`p-2 rounded-xl border transition cursor-pointer ${
                                      isFirst
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                        : 'bg-white text-slate-950 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs active:scale-95'
                                    }`}
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleMoveTeacher(actualIndex, 'down', deptTeachers, e)}
                                    disabled={isLast}
                                    title="تأخير الأستاذ للأسفل"
                                    className={`p-2 rounded-xl border transition cursor-pointer ${
                                      isLast
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'
                                        : 'bg-white text-slate-950 border-slate-300 hover:bg-[#0F2942] hover:text-white shadow-2xs active:scale-95'
                                    }`}
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-3.5 py-1.5 rounded-xl text-base font-black border ${ gender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                                  {gender === 'female' ? 'أنثى' : 'ذكر'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-950 text-base font-black select-all whitespace-nowrap" dir="ltr">{t.generated_email}</td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="bg-blue-50 text-blue-950 px-3.5 py-1.5 rounded-xl text-base font-black border border-blue-200">
                                  {assigned.length} مواد
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  {/* 🖨️ زر طباعة بطاقة هذا الأستاذ بمفرده كملف PDF على ورق A4 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSingleTeacherPrintProfile(t); // 🎯 تخصيص هذا الأستاذ حصراً للطباعة الفردية
                                      setShowTeacherPrintModal(true); // 🖨️ فتح نافذة المعاينة والطباعة
                                    }}
                                    className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                    title="طباعة بطاقة حساب الأستاذ (PDF)"
                                  >
                                    <Printer className="w-5 h-5 text-[#0F2942]" />
                                  </button>
                                  {/* 🪪 زر بطاقة الأستاذ ورمز QR باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCardProfile(t)}
                                    className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                    title="عرض بطاقة الأستاذ ورمز QR"
                                  >
                                    <QrCode className="w-5 h-5 text-[#0F2942]" />
                                  </button>
                                  {/* ✏️ زر تعديل بيانات الأستاذ باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTeacherId(t.id);
                                      setTeacherName(t.full_name);
                                      setCustomTeacherEmail(t.generated_email || '');
                                      setCustomTeacherPassword(t.temp_password || '');
                                      setTeacherGender((t.gender || detectArabicGender(t.full_name)) as 'male' | 'female');
                                      setNameError('');
                                      setIsTeacherModalOpen(true);
                                    }}
                                    className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                    title="تعديل بيانات الأستاذ"
                                  >
                                    <Edit3 className="w-5 h-5 text-[#0F2942]" />
                                  </button>
                                  {/* 🗑️ زر حذف الأستاذ الياقوتي البارز والواضح */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTeacher(t.id)}
                                    className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                                    title="حذف الأستاذ"
                                  >
                                    <Trash2 className="w-5 h-5 text-white" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول الأساتذة */}
                <div className="mt-4">
                  <AdminPagination
                    currentPage={Math.max(1, Math.min(teacherPage, Math.max(1, Math.ceil(deptTeachers.length / teacherPageSize))))}
                    totalItems={deptTeachers.length}
                    pageSize={teacherPageSize}
                    onPageChange={(page) => setTeacherPage(page)}
                    onPageSizeChange={(size) => {
                      setTeacherPageSize(size);
                      setTeacherPage(1);
                    }}
                    itemLabel="أستاذ/ـة"
                  />
                </div>
                </>
              )}
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2️⃣ تبويب إدارة طلاب القسم (Students CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (() => {
        const totalDeptStds = deptStudents.length;
        const totalStdMales = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
        const totalStdFemales = totalDeptStds - totalStdMales;
        const totalMorningStds = deptStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
        const totalEveningStds = deptStudents.filter((s) => s.study_type === 'evening').length;
        const stdMalePct = totalDeptStds > 0 ? Math.round((totalStdMales / totalDeptStds) * 100) : 0;
        const stdFemalePct = totalDeptStds > 0 ? Math.round((totalStdFemales / totalDeptStds) * 100) : 0;

        return (
          <div className="space-y-4">
            
            {/* 📊 شريط إحصائيات طلاب القسم وشريط الأزرار الأربعة بسطر واحد احترافي */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              {/* 🏷️ الصف العلوي: العنوان والتوصيف + الإحصائيات الديموغرافية والنوعية */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <GraduationCap className="w-7 h-7 text-slate-950" />
                    <span>إحصائيات طلبة قسم {deptName}</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    توزيع طلبة القسم حسب المراحل الدراسية والنوع والفترة (صباحي / مسائي)
                  </p>
                </div>

                {/* 🧮 شارات الإحصائيات الخمسة للطلبة */}
                <div className="flex flex-wrap items-center gap-2 text-base font-black">
                  <span className="bg-slate-100 text-slate-950 px-3.5 py-2 rounded-2xl border border-slate-300 shadow-2xs">
                    الإجمالي: {totalDeptStds}
                  </span>
                  <span className="bg-blue-50 text-blue-950 px-3.5 py-2 rounded-2xl border border-blue-300 shadow-2xs flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-[#0F2942]" />
                    <span>الصباحي:</span>
                    <strong className="font-mono">{totalMorningStds}</strong>
                  </span>
                  <span className="bg-indigo-50 text-indigo-950 px-3.5 py-2 rounded-2xl border border-indigo-300 shadow-2xs flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>المسائي:</span>
                    <strong className="font-mono">{totalEveningStds}</strong>
                  </span>
                  <span className="bg-blue-100 text-blue-950 px-3.5 py-2 rounded-2xl border border-blue-300 shadow-2xs">
                     الذكور: {totalStdMales} ({stdMalePct}%)
                  </span>
                  <span className="bg-rose-100 text-rose-950 px-3.5 py-2 rounded-2xl border border-rose-300 shadow-2xs">
                     الإناث: {totalStdFemales} ({stdFemalePct}%)
                  </span>
                </div>
              </div>

              {/* 🔘 شريط الأزرار الأربعة بسطر واحد احترافي وموحد 100% */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
                {/* ➕ زر فتح كارت إضافة طالب جديد وتوليد حسابه */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudentId(null);
                    setStudentName('');
                    setCustomStudentEmail('');
                    setCustomStudentPassword('');
                    setStudentStage(null); // 🔄 تصفير المرحلة الدراسية لتكون غير محددة افتراضياً حتى يختار المستخدم بنفسه
                    setStudentGender(null); // 🔄 تصفير جنس الطالب ليكون غير محدد افتراضياً
                    setShowStudentPassword(false); // 🔒 إخفاء كلمة المرور بنجوم افتراضياً
                    setStudentStudyType(null); // 🔄 تصفير الفترة الدراسية (الصباحي/المسائي) لتكون غير محددة افتراضياً
                    setStudentNameError('');
                    setIsStudentModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5 text-cyan-300" />
                  <span>تسجيل طالب جديد</span>
                </button>

                {/* 🖨️ زر طباعة وتصدير بطاقات اعتماد الطلبة بصيغة PDF (10 بطاقات بالورقة الواحدة A4) */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={() => {
                    setSingleStudentPrintProfile(null); // 🔄 تصفير البطاقة الفردية لعرض كافة الطلبة أو حسب الفلاتر
                    setShowStudentPrintModal(true); // 🖨️ فتح نافذة معاينة وطباعة بطاقات الطلبة A4
                  }}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap"
                  title="طباعة بطاقات حسابات الطلبة وتصديرها كملف PDF"
                >
                  <Printer className="w-5 h-5 text-cyan-300" /> {/* 🖨️ أيقونة الطابعة والـ PDF باللون الفيروزي المشرق المتناسق */}
                  <span>طباعة البطاقات (PDF)</span> {/* 📝 نص الزر الرسمي */}
                </button>

                {/* 📥 زر تنزيل نموذج Excel لطلبة القسم بتصميم كحلي فاخر مطابق لزر إضافة طالب */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={handleDownloadStudentTemplate} // ⚡ تشغيل دالة تنزيل قالب الطلبة المعتمد
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                  title="تنزيل نموذج Excel المعتمد لطلبة القسم" // 💡 نص التلميح
                >
                  <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                  <span>نموذج Excel</span> {/* 📝 نص الزر */}
                </button>

                {/* ℹ️ زر تعليمات الاستيراد للطلاب بتصميم كحلي فاخر مطابق لزر إضافة طالب */}
                <button
                  type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                  onClick={() => setShowStudentExcelInstructions(true)} // ⚡ فتح نافذة التعليمات للطلبة
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#163a5f] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                  title="تعليمات وضوابط استيراد الطلبة" // 💡 نص التلميح
                >
                  <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                  <span>التعليمات</span> {/* 📝 نص الزر */}
                </button>

                {/* 📤 زر استيراد ملف Excel للطلبة بأيقونة فيروزية أنيقة متناسقة */}
                <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#163a5f] shrink-0 active:scale-95 whitespace-nowrap">
                  <Upload className="w-5 h-5 text-cyan-300" />
                  <span>{isImportingStudentExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleStudentExcelUpload}
                    disabled={isImportingStudentExcel}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل طالب بخلفية زجاجية كاملة */}
            <FloatingCrudModal
              isOpen={isStudentModalOpen}
              onClose={() => {
                setIsStudentModalOpen(false); // 🚪 سد النافذة العائمة
                setIsStudentStageDropdownOpen(false); // 🔽 سد القائمة المنسدلة للمراحل
                setEditingStudentId(null); // 🔄 تصفير معرف الطالب الجاري تعديله
                setStudentName(''); // 🔄 تصفير حقل اسم الطالب
                setCustomStudentEmail(''); // 🔄 تصفير حقل البريد
                setCustomStudentPassword(''); // 🔄 تصفير حقل كلمة المرور
                setStudentStage(null); // 🔄 تصفير المرحلة الدراسية حتى ترجع نظيفة
                setStudentGender(null); // 🔄 تصفير جنس الطالب
                setStudentStudyType(null); // 🔄 تصفير نوع الدوام (الصباحي/المسائي) حتى ما يبقى معلق
                setStudentNameError(''); // 🔄 مسح أي رسالة خطأ بالاسم
              }}
              title={editingStudentId ? 'تعديل بيانات الطالب الأكاديمي' : 'تسجيل طالب جديد وتوليد الحساب الأكاديمي'}
              // 📝 تعديل العنوان الفرعي لنافذة إضافة الطالب بدون ذكر الرقم الجامعي
              subtitle={editingStudentId ? `تعديل بيانات الحساب للطالب في قسم ${deptName}` : `سيتم توليد البريد الأكاديمي وكلمة المرور وحفظ الحساب بقسم ${deptName} فورياً`}
              icon={editingStudentId ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              maxWidth="max-w-3xl"
              onSubmit={handleSaveStudent}
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudentModalOpen(false); // 🚪 سد النافذة العائمة عند الضغط على إلغاء
                      setIsStudentStageDropdownOpen(false); // 🔽 سد دروب داون المراحل
                      setEditingStudentId(null); // 🔄 تصفير المعرف
                      setStudentName(''); // 🔄 تصفير الاسم
                      setCustomStudentEmail(''); // 🔄 تصفير البريد
                      setCustomStudentPassword(''); // 🔄 تصفير الباسورد
                      setStudentStage(null); // 🔄 تصفير المرحلة الدراسية
                      setStudentGender(null); // 🔄 تصفير جنس الطالب
                      setStudentStudyType(null); // 🔄 تصفير نوع الدوام تماماً
                      setStudentNameError(''); // 🔄 مسح رسائل الخطأ
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{editingStudentId ? 'حفظ التعديلات' : 'تسجيل وتوليد الحساب'}</span>
                  </button>
                </>
              }
            >
              <div className="space-y-5 text-base font-black">
                
                {/* ⚡ شريط التوليد التلقائي لبيانات الاعتماد الرسمية */}
                <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="text-sm text-slate-800 font-bold">
                    يمكنك التوليد التلقائي لبريد أكاديمي رسمي فريد ورمز دخول معقد فريد 100%:
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateStudentCredentials}
                    className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#0F2942] active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>توليد بريد ورمز معقد تلقائياً</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-950 font-black text-base">الاسم الثلاثي أو الرباعي واللقب *</label>
                    {studentNameError && (
                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                        {studentNameError}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (studentNameError) setStudentNameError('');
                    }}
                    placeholder="مثال: علي محمد رضا الموسوي..."
                    className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-950 font-black text-base focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold ${
                      studentNameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">القسم العلمي الأكاديمي:</label>
                    <div className="px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 font-black text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-700" />
                      <span>{deptName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">المرحلة الدراسية:</label>
                    <div>
                      <button
                        ref={stageButtonRef}
                        type="button"
                        onClick={handleToggleStudentStageDropdown}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs hover:bg-slate-100 transition-all text-right"
                      >
                        {/* 🎓 إظهار المرحلة المختارة أو غير محدد إذا جانت القيمة فارغة */}
                        <span className={studentStage ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                          {studentStage ? `المرحلة ${getStageNameInArabic(studentStage)}` : 'غير محدد (اختر المرحلة الدراسية)...'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform duration-200 ${isStudentStageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isStudentStageDropdownOpen && stageDropdownCoords && typeof document !== 'undefined' && createPortal(
                        <>
                          {/* 🌫️ خلفية تفاعلية بكامل الشاشة لإغلاق القائمة فوراً عند النقر خارجها */}
                          <div 
                            className="fixed inset-0 z-[999998]" 
                            onClick={() => setIsStudentStageDropdownOpen(false)} 
                          />
                          {/* 📋 القائمة المنسدلة العائمة فوق الفوتر والنافذة وكافة العناصر بـ z-999999 */}
                          <div 
                            style={{
                              position: 'fixed',
                              ...(stageDropdownCoords.openUpwards
                                ? { bottom: `${stageDropdownCoords.bottom}px` }
                                : { top: `${stageDropdownCoords.top}px` }),
                              left: `${stageDropdownCoords.left}px`,
                              width: `${stageDropdownCoords.width}px`, // 📐 عرض القائمة يطابق عرض الزر بالتمام
                              maxHeight: `${stageDropdownCoords.maxHeight || 220}px`, // 📏 أقصى ارتفاع محسوب ذكياً لمنع أي قص أو خروج عن حدود الشاشة
                            }}
                            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150" // 📦 الحاوية العائمة العلوية
                            dir="rtl" // ➡️ اتجاه المحتوى من اليمين لليسار
                          >
                            {[ // 📋 مصفوفة المراحل الأربعة بالقسم
                              { value: 1, label: 'المرحلة الأولى' }, // 🥇 المرحلة الأولى
                              { value: 2, label: 'المرحلة الثانية' }, // 🥈 المرحلة الثانية
                              { value: 3, label: 'المرحلة الثالثة' }, // 🥉 المرحلة الثالثة
                              { value: 4, label: 'المرحلة الرابعة' }, // 🎓 المرحلة الرابعة
                            ].map((stg) => ( // 🔄 رسم أزرار الاختيار لكل مرحلة
                              <button // 🔘 زر اختيار المرحلة
                                key={stg.value} // 🔑 المفتاح الفريد للمرحلة
                                type="button" // 🛑 نوع الزر لمنع تقديم النموذج
                                onClick={() => { // ⚡ حدث النقر لاختيار المرحلة وغلق القائمة
                                  setStudentStage(stg.value); // 🎯 حفظ المرحلة المختارة
                                  setIsStudentStageDropdownOpen(false); // 🔒 إغلاق القائمة فوراً
                                }}
                                className={`w-full px-3.5 py-2.5 text-right font-black text-sm sm:text-base rounded-xl transition flex items-center justify-between cursor-pointer ${ // 🎨 التنسيقات العامة
                                  studentStage === stg.value // 🔍 فحص هل هي المرحلة المختارة
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي للمرحلة النشطة
                                    : 'text-slate-900 hover:bg-slate-100' // ⚪ لون افتراضي نظيف عند التحويم
                                }`}
                              >
                                <span>{stg.label}</span> {/* 🏷️ اسم المرحلة */}
                                {studentStage === stg.value && <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />} {/* ✅ علامة الصح الزمردية */}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت المرحلة غير محددة بعد */}
                    {studentStage === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار المرحلة الدراسية للطالب</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">الجنس (النوع):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentGender('male')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          studentGender === 'male'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                        }`}
                      >
                        <span>ذكر (طالب)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentGender('female')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          studentGender === 'female'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-[#0F2942]/30'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#0F2942]'
                        }`}
                      >
                        <span>أنثى (طالبة)</span>
                      </button>
                    </div>
                    {studentGender === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار جنس الطالب (ذكر أو أنثى)</span>
                      </p>
                    )}
                  </div>

                  {/* ☀️🌙 محدد الفترة الدراسية (الصباحي / المسائي) */}
                  <div className="space-y-2">
                    <label className="block text-slate-950 font-black text-base">الفترة الدراسية (نوع الدوام):</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentStudyType('morning')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          studentStudyType === 'morning'
                            ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-sm ring-2 ring-[#0F2942]/20'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>الدراسة الصباحية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentStudyType('evening')}
                        className={`py-3 px-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          studentStudyType === 'evening'
                            ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-sm ring-2 ring-[#0F2942]/20'
                            : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>الدراسة المسائية</span>
                      </button>
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت الفترة الدراسية غير محددة */}
                    {studentStudyType === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار الفترة الدراسية (الصباحية أو المسائية)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* ✉️ حقل البريد الأكاديمي المخصص و 🔑 حقل كلمة المرور */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* البريد */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-sm">
                        البريد الأكاديمي (اختياري - يترك فارغاً للتوليد)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomStudentEmail(generateStrongUniqueEmail('st', profiles))}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد بريد أكاديمي رسمي فريد للطالب"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                        <span>توليد بريد فريد</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customStudentEmail}
                      onChange={(e) => setCustomStudentEmail(e.target.value)}
                      placeholder="مثال: std.2026.haider@sadiq.edu.iq"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                      dir="ltr"
                    />
                    {customStudentEmail.trim() && !checkEmailUniquenessAcrossSystem(customStudentEmail, editingStudentId || undefined, profiles).isUnique && (
                      <div className="p-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-950 flex items-center gap-1.5 mt-1.5 animate-in fade-in duration-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{checkEmailUniquenessAcrossSystem(customStudentEmail, editingStudentId || undefined, profiles).errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* كلمة المرور */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-sm">
                        كلمة المرور (اختياري - تترك فارغة للتوليد)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomStudentPassword(generateStrongPassword(profiles))}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد رمز سري قوي عشوائي غير مكرر نهائياً"
                      >
                        <Key className="w-3.5 h-3.5 text-emerald-700" />
                        <span>توليد رمز عشوائي قوي</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        value={customStudentPassword}
                        onChange={(e) => setCustomStudentPassword(e.target.value)}
                        placeholder="مثال: Sadiq#Std2026!"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-sm placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword((prev) => !prev)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                        title={showStudentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        aria-label={showStudentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showStudentPassword ? (
                          <EyeOff className="w-4.5 h-4.5 text-slate-700" />
                        ) : (
                          <Eye className="w-4.5 h-4.5 text-slate-700" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                {/* 🛡️ صندوق شروط ومعايير كلمة المرور التفاعلية */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      <span>شروط ومعايير كلمة المرور الأكاديمية:</span>
                    </div>
                    {customStudentPassword && (
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        studentPasswordStrengthScore === 100 
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                          : studentPasswordStrengthScore >= 50 
                            ? 'bg-sky-100 text-sky-950 border-sky-300' 
                            : 'bg-rose-100 text-rose-950 border-rose-300'
                      }`}>
                        {studentPasswordStrengthScore === 100 ? 'رمز قوي ومثالي' : studentPasswordStrengthScore >= 50 ? 'رمز متوسط' : 'رمز ضعيف'}
                      </span>
                    )}
                  </div>

                  {/* مؤشر القوة البصري */}
                  {customStudentPassword && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          studentPasswordStrengthScore === 100 
                            ? 'bg-emerald-600' 
                            : studentPasswordStrengthScore >= 50 
                              ? 'bg-sky-500' 
                              : 'bg-rose-500'
                        }`} 
                        style={{ width: `${studentPasswordStrengthScore}%` }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      studentPasswordCriteria.length ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {studentPasswordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>8 خانات فأكثر</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      studentPasswordCriteria.hasUpper ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {studentPasswordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>حرف كبير (A-Z)</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      studentPasswordCriteria.hasNumber ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {studentPasswordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>رقم (0-9)</span>
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                      studentPasswordCriteria.hasSpecial ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}>
                      {studentPasswordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span>رمز خاص (!@#$)</span>
                    </div>
                  </div>
                </div>

              </div>
            </FloatingCrudModal>

            {/* جدول طلاب القسم مع نظام الترحيل الأكاديمي */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              
              {/* 🎛️ شريط التحكم العلوي: فلاتر المراحل + زر الترحيل الجماعي + البحث */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <GraduationCap className="w-6 h-6 text-slate-900" />
                    <span>طلاب قسم {deptName} ({deptStudents.length})</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    إدارة السجلات الأكاديمية وترحيل الطلاب الناجحين بين المراحل الدراسية الـ 4
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* 🚀 زر الترحيل الجماعي للمرحلة */}
                  <button
                    type="button"
                    onClick={() => {
                      // 🎯 تحديد أول مرحلة بها طلاب مؤهلين تلقائياً لراحة المستخدم
                      const activeStageWithStudents = [1, 2, 3, 4].find((st) => deptStudents.some((s) => (Number(s.stage_number) || 1) === st && !s.is_graduated));
                      if (activeStageWithStudents) {
                        setBulkPromoteSourceStage(activeStageWithStudents);
                      }
                      setIsBulkPromotionModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-base font-black shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#163a5f] active:scale-95"
                    title="ترحيل طلاب مرحلة دراسية كاملة إلى المرحلة التالية"
                  >
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                    <span>ترحيل مرحلة دراسية (جماعي)</span>
                  </button>

                  {/* 🔍 حقل البحث السريع */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-700" />
                    {/* 🔍 حقل البحث السريع بالاسم أو البريد الأكاديمي */}
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="بحث بالاسم أو البريد الأكاديمي..."
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 🏷️ تبويبات تصفية المراحل الدراسية والفترة الدراسية */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFilterStudentStage('all')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${ filterStudentStage === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white' }`}
                  >
                    <span>كافة المراحل</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterStudentStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptStudents.length}
                    </span>
                  </button>

                  {[
                    { num: 1, name: 'الأولى' },
                    { num: 2, name: 'الثانية' },
                    { num: 3, name: 'الثالثة' },
                    { num: 4, name: 'الرابعة' },
                  ].map((st) => {
                    const count = deptStudents.filter((s) => (s.stage_number || 1) === st.num).length;
                    return (
                      <button
                        key={st.num}
                        type="button"
                        onClick={() => setFilterStudentStage(st.num)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${ filterStudentStage === st.num ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white' }`}
                      >
                        <span>المرحلة {st.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                          filterStudentStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* تصفية الفترة الصباحي / المسائي */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-slate-950 ml-1">الفترة:</span>
                  <button
                    type="button"
                    onClick={() => setFilterStudentStudyType('all')}
                    className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${ filterStudentStudyType === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStudentStudyType('morning')}
                    className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ filterStudentStudyType === 'morning' ? 'bg-[#0F2942] text-white shadow-2xs border border-[#163a5f]' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>الصباحي ({totalMorningStds})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStudentStudyType('evening')}
                    className={`px-3 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ filterStudentStudyType === 'evening' ? 'bg-[#0F2942] text-white shadow-2xs border border-[#163a5f]' : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>المسائي ({totalEveningStds})</span>
                  </button>
                </div>
              </div>

              {/* 🎛️ شريط الإجراءات الجماعية الفاخر عند تحديد الطلاب */}
              {selectedStudentIds.length > 0 && (
                <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#0F2942] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-base text-white">
                        تم تحديد <strong className="text-emerald-300 font-mono text-lg font-black">({selectedStudentIds.length})</strong> من أصل <span className="font-mono text-slate-300">({filteredStudents.length})</span> طالب
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBulkDeleteStudents}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف المحدد ({selectedStudentIds.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkExportStudentsExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير المحدد Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>
              )}

              {/* 📋 جدول بيانات الطلاب مع عمود الترحيل الأكاديمي الفوري */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-1">
                  <p>لا يوجد طلاب مطابقين للتصفية في هذا القسم.</p>
                  <p className="text-base font-black text-slate-700 font-bold">يمكنك تسجيل طلاب جدد أو اختيار مرحلة دراسية أخرى.</p>
                </div>
              ) : (
                <>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right border-collapse text-base font-black">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base">
                        <th className="p-4 text-center text-base w-12">
                          <input
                            type="checkbox"
                            aria-label="تحديد جميع الطلاب المعروضين"
                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                            onChange={toggleSelectAllStudents}
                            className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                          />
                        </th>
                        {/* 🔢 تسلسل الطالب */}
                        <th className="p-4 text-center text-base w-14">ت</th>
                        {/* 👤 الاسم الكامل للطالب */}
                        <th className="p-4 text-base">اسم الطالب الثلاثي</th>
                        {/* 🚻 جنس الطالب */}
                        <th className="p-4 text-base">الجنس</th>
                        {/* ☀️🌙 الفترة الدراسية */}
                        <th className="p-4 text-base">الفترة</th>
                        {/* 📚 المرحلة الدراسية */}
                        <th className="p-4 text-base">المرحلة الدراسية</th>
                        {/* ✉️ البريد الأكاديمي الرسمي */}
                        <th className="p-4 text-base">البريد الأكاديمي</th>
                        {/* 🚀 زر الترحيل الأكاديمي السريع */}
                        <th className="p-4 text-center text-base">ترحيل النجاح</th>
                        {/* ⚙️ أدوات التحكم والإجراءات */}
                        <th className="p-4 text-center text-base">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                      {(() => {
                        // 🧮 حسابات شريحة الصفحة لجدول طلبة القسم
                        const totalStudentsCount = filteredStudents.length; // 🔢 إجمالي الطلبة بعد التصفية والبحث
                        const safeStudentPage = Math.max(1, Math.min(studentPage, Math.max(1, Math.ceil(totalStudentsCount / studentPageSize)))); // 🛡️ حماية رقم الصفحة
                        const studentStartIndex = (safeStudentPage - 1) * studentPageSize; // 📍 بداية شريحة الطلبة
                        const paginatedStudents = filteredStudents.slice(studentStartIndex, studentStartIndex + studentPageSize); // 📋 طلبة الصفحة الحالية

                        return paginatedStudents.map((s, index) => {
                          const actualIndex = studentStartIndex + index; // 🔢 التسلسل العام الحقيقي للطالب
                          const curStage = s.stage_number || 1; // 🎓 مرحلة الطالب الدراسية
                          const stdGender = s.gender || detectArabicGender(s.full_name); // 🚻 جنس الطالب
                          const isSelected = selectedStudentIds.includes(s.id); // 🔘 حالة تحديد الطالب

                          return (
                            <tr key={s.id} className={`transition ${isSelected ? 'bg-blue-50/70 font-black' : 'hover:bg-slate-50'}`}>
                              {/* 🔘 مربع التحديد الفردي */}
                              <td className="p-4 text-center whitespace-nowrap w-12" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  aria-label={`تحديد ${s.full_name}`}
                                  checked={isSelected}
                                  onChange={() => toggleSelectStudent(s.id)}
                                  className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                                />
                              </td>

                              <td className="p-4 text-center font-black text-slate-950 text-base whitespace-nowrap">
                                <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-950 font-black text-base shadow-2xs">
                                  {actualIndex + 1}
                                </span>
                              </td>
                              <td className="p-4 font-black text-slate-950 text-lg whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {s.is_graduated && <GraduationCap className="w-5 h-5 text-emerald-600 inline flex-shrink-0" />}
                                  <span>{s.full_name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-xl text-base font-black border ${ stdGender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                                  {stdGender === 'female' ? 'أنثى' : 'ذكر'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-xl text-base font-black border flex items-center gap-1.5 w-fit ${
                                  (s.study_type || 'morning') === 'evening'
                                    ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                }`}>
                                  {(s.study_type || 'morning') === 'evening' ? (
                                    <Moon className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <Sun className="w-4 h-4 text-emerald-700" />
                                  )}
                                  <span>{(s.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-xl text-base font-black border ${ curStage === 1 ? 'bg-sky-50 text-sky-950 border-sky-200' : curStage === 2 ? 'bg-blue-50 text-blue-950 border-blue-200' : curStage === 3 ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-emerald-50 text-emerald-950 border-emerald-300' }`}>
                                  المرحلة {getStageNameInArabic(curStage)} {curStage === 4 ? '(النهائية)' : ''}
                                </span>
                              </td>
                              {/* ✉️ البريد الأكاديمي المعتمد للطالب */}
                              <td className="p-4 text-slate-950 text-base font-black select-all" dir="ltr">{s.generated_email}</td>
                              
                              {/* 🚀 عمود زر الترحيل الأكاديمي الفردي */}
                              <td className="p-4 text-center">
                                {curStage < 4 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => handlePromoteStudent(s, e)}
                                    className="px-3.5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-base font-black transition shadow-2xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer border border-[#163a5f] active:scale-95"
                                    title={`ترحيل الطالب إلى المرحلة ${getStageNameInArabic(curStage + 1)}`}
                                  >
                                    <ArrowUpRight className="w-4 h-4 text-cyan-300" />
                                    <span>ترحيل للمرحلة {getStageNameInArabic(curStage + 1)}</span>
                                  </button>
                                ) : s.is_graduated ? (
                                  <span
                                    className="px-3.5 py-2 rounded-xl text-base font-black flex items-center justify-center gap-1.5 mx-auto bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs select-none"
                                    title="تم تثبيت واعتماد تخرج الطالب رسمياً"
                                  >
                                    <GraduationCap className="w-5 h-5 text-[#0F2942]" />
                                    <span>خريج معتمد</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handlePromoteStudent(s, e)}
                                    className="px-3.5 py-2 rounded-xl text-base font-black transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer bg-[#0F2942] hover:bg-[#163a5f] text-white border border-[#163a5f] shadow-2xs active:scale-95"
                                    title="اعتماد وتثبيت تخرج الطالب"
                                  >
                                    <GraduationCap className="w-5 h-5 text-white" />
                                    <span>تثبيت التخرج</span>
                                  </button>
                                )}
                              </td>

                            {/* 🛠️ الإجراءات الأساسية */}
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                {/* 🖨️ زر طباعة بطاقة هذا الطالب بمفرده كملف PDF على ورق A4 */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSingleStudentPrintProfile(s); // 🎯 تخصيص هذا الطالب حصراً للطباعة الفردية
                                    setShowStudentPrintModal(true); // 🖨️ فتح نافذة المعاينة والطباعة
                                  }}
                                  className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                  title="طباعة بطاقة حساب الطالب (PDF)"
                                >
                                  <Printer className="w-5 h-5 text-[#0F2942]" />
                                </button>
                                {/* 🪪 زر بطاقة الطالب ورمز QR باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCardProfile(s)}
                                  className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                  title="عرض بطاقة الطالب"
                                >
                                  <QrCode className="w-5 h-5 text-[#0F2942]" />
                                </button>
                                {/* ✏️ زر تعديل بيانات الطالب باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudentId(s.id); // 🆔 تثبيت أيدي الطالب اللي نريد نعدل بياناته
                                    setStudentName(s.full_name); // ✍️ وضع الاسم الكامل الحالي للطالب بالحقل
                                    setCustomStudentEmail(s.generated_email || ''); // 📧 تعيين البريد الأكاديمي الحالي للطالب
                                    setCustomStudentPassword(s.temp_password || ''); // 🔑 تعيين كلمة المرور الحالية
                                    setStudentStage(s.stage_number || 1); // 🎓 ضبط المرحلة الدراسية المسجل بيها الطالب
                                    setStudentGender((s.gender || detectArabicGender(s.full_name)) as 'male' | 'female'); // 🚻 تحديد الجنس
                                    // ☀️🌙 قراءة نوع دوام الطالب الحالي (مسائي أو صباحي) وضبطه بالفورم بدقة لمنع ظهور التنبيه الأحمر
                                    const currentStudyType: 'morning' | 'evening' = (s.study_type === 'evening' || String(s.study_type) === 'مسائي') ? 'evening' : 'morning';
                                    setStudentStudyType(currentStudyType); // 🔄 تفعيل زر الصباحي أو المسائي تلقائياً حسب بيانات الطالب
                                    setStudentNameError(''); // 🔄 مسح أي أخطاء بالاسم القديم
                                    setIsStudentModalOpen(true); // 📂 فتح نافذة التعديل العائمة
                                  }}
                                  className="p-2.5 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                  title="تعديل البيانات"
                                >
                                  <Edit3 className="w-5 h-5 text-[#0F2942]" />
                                </button>
                                {/* 🗑️ زر حذف الطالب الياقوتي البارز والواضح */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                                  title="حذف الطالب"
                                >
                                  <Trash2 className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول الطلبة */}
              <div className="mt-4">
                <AdminPagination
                  currentPage={Math.max(1, Math.min(studentPage, Math.max(1, Math.ceil(filteredStudents.length / studentPageSize))))}
                  totalItems={filteredStudents.length}
                  pageSize={studentPageSize}
                  onPageChange={(page) => setStudentPage(page)}
                  onPageSizeChange={(size) => {
                    setStudentPageSize(size);
                    setStudentPage(1);
                  }}
                  itemLabel="طالب/ـة"
                />
              </div>
              </>
            )}
          </div>

          {/* 🪟 نافذة منبثقة للترحيل الجماعي للمرحلة الدراسية بالكامل (Bulk Promotion Modal) */}
          {isBulkPromotionModalOpen && (
            <div className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-[100dvh]" dir="rtl">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* الهيدر الثابت */}
                <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-100">
                      <Sparkles className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-950">الترحيل الجماعي لطلاب المرحلة</h3>
                      <p className="text-sm font-black text-slate-700">قسم {deptName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBulkPromotionModalOpen(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition cursor-pointer border border-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* محتوى الحقول القابل للتمرير داخلياً والمحصور 100% داخل الشاشة */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-4 text-sm font-black">
                  <div>
                    <label className="block text-slate-800 font-bold mb-2">
                      اختر المرحلة المراد ترحيل طلابها الناجحين:
                    </label>

                    {/* قائمة خيارات المراحل التفاعلية المحصورة داخل النافذة بدون أي انبثاق خارجي */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { stage: 1, label: 'ترحيل طلاب المرحلة الأولى إلى المرحلة الثانية', sub: 'نقل طلاب المرحلة الأولى للثانية' },
                        { stage: 2, label: 'ترحيل طلاب المرحلة الثانية إلى المرحلة الثالثة', sub: 'نقل طلاب المرحلة الثانية للثالثة' },
                        { stage: 3, label: 'ترحيل طلاب المرحلة الثالثة إلى المرحلة الرابعة', sub: 'نقل طلاب المرحلة الثالثة للمنتهية' },
                        { stage: 4, label: `تخريج طلاب المرحلة الرابعة (دفعة ${academicYear})`, sub: 'اعتماد تخرج الدفعة وتثبيت الحالة' },
                      ].map((item) => {
                        const studentCount = deptStudents.filter((s) => {
                          const sStage = Number(s.stage_number) || 1;
                          if (sStage !== item.stage) return false;
                          if (item.stage < 4) return true;
                          const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
                          return !isGrad;
                        }).length;
                        const isSelected = bulkPromoteSourceStage === item.stage;
                        return (
                          <button
                            key={item.stage}
                            type="button"
                            onClick={() => setBulkPromoteSourceStage(item.stage)}
                            className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.stage === 4 ? '🎓' : item.stage}
                              </div>
                              <div>
                                <div className={`font-black text-sm ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                                  {item.label}
                                </div>
                                <div className="text-xs font-bold text-slate-500">
                                  {item.sub}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}>
                                {studentCount} طالب
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* صندوق ملخص العملية */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>إجمالي الطلاب المؤهلين للترحيل:</span>
                      <strong className="text-emerald-800 font-black text-sm">
                        {deptStudents.filter((s) => {
                          const sStage = Number(s.stage_number) || 1;
                          if (sStage !== Number(bulkPromoteSourceStage)) return false;
                          if (Number(bulkPromoteSourceStage) < 4) return true;
                          const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
                          return !isGrad;
                        }).length} طالب
                      </strong>
                    </div>
                    <div className="text-xs font-black text-slate-600 leading-relaxed">
                      سيتم تحديث مرحلة جميع الطلاب تلقائياً وإرسال إشعارات تهنئة رسمية إلى حساباتهم وتوثيق العملية في سجلات التدقيق.
                    </div>
                  </div>
                </div>

                {/* الفوتر الثابت في أسفل الكارد */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 z-10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkPromotionModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-sm font-black transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkPromoteStage(bulkPromoteSourceStage)}
                    disabled={deptStudents.filter((s) => {
                      const sStage = Number(s.stage_number) || 1;
                      if (sStage !== Number(bulkPromoteSourceStage)) return false;
                      if (Number(bulkPromoteSourceStage) < 4) return true;
                      const isGrad = s.is_graduated === true || String(s.is_graduated) === 'true';
                      return !isGrad;
                    }).length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white font-black rounded-xl text-sm font-black shadow-md transition flex items-center gap-1.5 cursor-pointer border border-[#163a5f]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                    <span>تأكيد واعتماد الترحيل الجماعي</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      );
    })()}

      {/* ========================================================================= */}
      {/* 3️⃣ تبويب إدارة المواد الدراسية (Courses CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          
          {/* 📊 شريط إحصائيات المواد الدراسية وشريط الأزرار الأربعة بسطر واحد احترافي */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            {/* 🏷️ الصف العلوي: العنوان والتوصيف + إحصائيات المواد */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <BookOpen className="w-7 h-7 text-slate-950" />
                  <span>المواد والمقررات الدراسية لقسم {deptName}</span>
                </h3>
                <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                  إدارة المناهج وتوصيف المقررات (نظري وعملي) وتعيين أساتذة التدريس
                </p>
              </div>

              {/* 🧮 شارات إحصائيات المقررات بتصميم متناسق ومريح للعين سطر بسطر */}
              <div className="flex flex-wrap items-center gap-2.5 text-base font-black"> {/* 📦 حاوية الشارات الثلاثية */}
                {/* 📊 وسم إجمالي عدد المواد في القسم */}
                <span className="bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20 px-4 py-2 rounded-2xl shadow-2xs">
                  الإجمالي: {deptCourses.length} مادة
                </span>
                {/* 🧪 وسم نظري وعملي بتصميم مطابق وموحد تماماً مع الوسوم المجاورة */}
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-4 py-2 rounded-2xl shadow-2xs">
                  نظري وعملي: {deptCourses.filter((c) => c.course_type === 'theory_and_practical' || c.has_practical).length}
                </span>
                {/* 📖 وسم نظري فقط بتصميم رمادي فاتح فاخر */}
                <span className="bg-slate-100 text-slate-900 border border-slate-300 px-4 py-2 rounded-2xl shadow-2xs">
                  نظري فقط: {deptCourses.filter((c) => c.course_type === 'theory_only' && !c.has_practical).length}
                </span>
              </div>
            </div>

            {/* 🔘 شريط الأزرار الأربعة بسطر واحد احترافي وموحد 100% */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3 overflow-x-auto flex-nowrap">
              {/* ➕ زر فتح كارت إضافة مادة جديدة */}
              <button
                type="button"
                onClick={() => {
                  setEditingCourseId(null);
                  setCourseName('');
                  setCourseCode('');
                  setCourseCredits(null); // 🔄 تصفير الساعات والوحدات لتكون غير محددة افتراضياً حتى يختار المستخدم
                  setCourseStage(null); // 🔄 تصفير المرحلة الدراسية لتكون غير محددة افتراضياً
                  setCourseSemester(null); // 🔄 تصفير الكورس ليكون غير محدد افتراضياً
                  setCourseType(null); // 🔄 تصفير نوع المادة ليكون غير محدد افتراضياً
                  setCourseTheoryTeacherId('');
                  setCoursePracticalTeacherId('');
                  setCourseIsSupplementaryEnabled(false); // 🔄 تصفير حالة الدور الثاني للوضع الافتراضي
                  setCourseIsFinalExamEnabled(false); // 🎯 تصفير حالة الامتحان النهائي الدور الأول للوضع الافتراضي
                  setIsCourseModalOpen(true);
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shrink-0 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-5 h-5 text-cyan-300" />
                <span>إضافة مادة دراسية جديدة</span>
              </button>

              {/* 📥 زر تنزيل نموذج Excel لمواد القسم بتصميم كحلي فاخر مطابق لزر إضافة مادة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleDownloadCourseTemplate} // ⚡ تشغيل دالة تنزيل قالب المواد المعتمد
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                title="تنزيل نموذج Excel المعتمد لمواد ومقررات القسم" // 💡 نص التلميح
              >
                <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                <span>نموذج Excel</span> {/* 📝 نص الزر */}
              </button>

              {/* ℹ️ زر تعليمات الاستيراد للمواد بتصميم كحلي فاخر مطابق لزر إضافة مادة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={() => setShowCourseExcelInstructions(true)} // ⚡ فتح نافذة التعليمات للمواد
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap" // 🎨 تصميم كحلي ملكي موحد
                title="تعليمات وضوابط استيراد المواد الدراسية" // 💡 نص التلميح
              >
                <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                <span>التعليمات</span> {/* 📝 نص الزر */}
              </button>

              {/* 📤 زر استيراد ملف Excel للمواد بأيقونة فيروزية أنيقة متناسقة */}
              <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#0F2942] shrink-0 active:scale-95 whitespace-nowrap">
                <Upload className="w-5 h-5 text-cyan-300" />
                <span>{isImportingCourseExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleCourseExcelUpload}
                  disabled={isImportingCourseExcel}
                  className="hidden"
                />
              </label>

              {/* 🖨️ زر تصدير وطباعة كشف المواد الدراسية PDF الرسمي المعتمد بجانب أزرار Excel */}
              <button
                type="button" // 🔘 نوع الزر لمنع الإرسال التلقائي للنماذج
                onClick={handleExportCoursesPDF} // ⚡ تشغيل دالة تصدير وطباعة PDF للمواد الدراسية
                disabled={isExportingCoursesPDF} // 🛑 تعطيل الزر أثناء التصدير لمنع النقرات المتكررة
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0 whitespace-nowrap disabled:opacity-50" // 🎨 تصميم كحلي ملكي موحد ومتطابق مع أزرار إكسل
                title="طباعة وتصدير كشف المواد والمقررات الدراسية المعتمدة رسمياً بصيغة PDF" // 💡 نص التلميح
              >
                <Printer className="w-5 h-5 text-rose-300" /> {/* 🖨️ أيقونة الطابعة باللون الوردي الناصع لتمييزها بجانب أزرار إكسل */}
                <span>{isExportingCoursesPDF ? 'جاري إعداد PDF...' : selectedCourseIds.length > 0 ? `طباعة المحدد (${selectedCourseIds.length}) PDF` : 'طباعة كشف المواد (PDF)'}</span> {/* 🏷️ نص الزر التفاعلي الذكي */}
              </button>
            </div>
          </div>

          {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل مادة دراسية بخلفية زجاجية كاملة */}
          <FloatingCrudModal
            isOpen={isCourseModalOpen}
            onClose={() => {
              setIsCourseModalOpen(false); // ❌ غلق كارد المادة
              setEditingCourseId(null); // 🔄 تصفير معرف التعديل
              setCourseName(''); // 📝 تصفير اسم المادة
              setCourseCode(''); // 🔤 تصفير كود المادة
              setCourseCredits(null); // ⏱️ تصفير الساعات والوحدات لتكون غير محددة
              setCourseStage(null); // 🎓 تصفير المرحلة الدراسية لتكون غير محددة
              setCourseSemester(null); // 🗓️ تصفير الكورس ليكون غير محدد
              setCourseType(null); // 🔬 تصفير نوع المادة ليكون غير محدد
              setCourseTheoryTeacherId(''); // 👨‍🏫 تصفير أستاذ النظري
              setCoursePracticalTeacherId(''); // 🧪 تصفير أستاذ العملي
              setIsCourseTheoryDropdownOpen(false); // 🔽 غلق قائمة أستاذ النظري
              setIsCoursePracticalDropdownOpen(false); // 🔽 غلق قائمة أستاذ العملي
              setCourseIsSupplementaryEnabled(false); // 🔄 تصفير الدور الثاني
              setCourseIsFinalExamEnabled(false); // 🎯 تصفير الفاينل الدور الأول
            }}
            title={editingCourseId ? 'تعديل بيانات وتوصيف المادة الدراسية' : 'إضافة مادة دراسية جديدة وتعيين الأساتذة'}
            subtitle={editingCourseId ? `تعديل توصيف وتكليفات مادة (${courseName || 'المادة'}) في قسم ${deptName}` : `إضافة مادة جديدة وتحديد نوعها وتكليف أساتذة النظري والعملي في قسم ${deptName}`}
            icon={<BookOpen className="w-6 h-6" />}
            maxWidth="max-w-4xl"
            onSubmit={handleSaveCourse}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsCourseModalOpen(false); // ❌ غلق كارد المادة
                    setEditingCourseId(null); // 🔄 تصفير معرف التعديل
                    setCourseName(''); // 📝 تصفير اسم المادة
                    setCourseCode(''); // 🔤 تصفير كود المادة
                    setCourseCredits(null); // ⏱️ تصفير الساعات والوحدات لتكون غير محددة
                    setCourseStage(null); // 🎓 تصفير المرحلة الدراسية لتكون غير محددة
                    setCourseSemester(null); // 🗓️ تصفير الكورس ليكون غير محدد
                    setCourseType(null); // 🔬 تصفير نوع المادة ليكون غير محدد
                    setCourseTheoryTeacherId(''); // 👨‍🏫 تصفير أستاذ النظري
                    setCoursePracticalTeacherId(''); // 🧪 تصفير أستاذ العملي
                    setIsCourseTheoryDropdownOpen(false); // 🔽 غلق قائمة أستاذ النظري
                    setIsCoursePracticalDropdownOpen(false); // 🔽 غلق قائمة أستاذ العملي
                    setCourseIsSupplementaryEnabled(false); // 🔄 تصفير الدور الثاني
                    setCourseIsFinalExamEnabled(false); // 🎯 تصفير الفاينل الدور الأول
                  }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300 shadow-2xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>{editingCourseId ? 'حفظ التعديلات الأكاديمية' : 'إضافة المادة وتثبيت التكليف'}</span>
                </button>
              </>
            }
          >
            <div className="space-y-6 text-base font-black">
              
              {/* 🏛️ القسم الأول: البيانات الأساسية للمادة والتوصيف */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <BookOpen className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">بيانات المقرر وتوصيف المسار</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">اسم المادة ورمزها الرسمي ونوع دراستها (نظري / مختبري)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                  {/* اسم المادة */}
                  <div className="col-span-12 md:col-span-7 space-y-2">
                    <label className="block text-slate-950 font-black text-base">اسم المادة الدراسية بالعربية *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="مثال: البرمجة الهيكلية بلغة C++..."
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold"
                      />
                      <BookOpen className="w-5 h-5 absolute right-3.5 top-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* رمز المادة */}
                  <div className="col-span-12 md:col-span-5 space-y-2">
                    <label className="block text-slate-950 font-black text-base">رمز المادة الأكاديمي (Code) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="مثال: CS201..."
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base uppercase focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold font-mono"
                      />
                      <Layers className="w-5 h-5 absolute right-3.5 top-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* نوع المادة وتوصيف المسار الدراسي بتصميم بطاقات تفاعلية فاخرة */}
                  <div className="col-span-12 space-y-2">
                    <label className="block text-slate-950 font-black text-base">نوع المادة وتوصيف المسار الدراسي *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* بطاقة: نظري وعملي */}
                      <button
                        type="button"
                        onClick={() => setCourseType('theory_and_practical')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          courseType === 'theory_and_practical'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_and_practical' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-black flex items-center gap-2">
                              <span>نظري وعملي (مختبري)</span>
                            </div>
                            <p className={`text-xs font-bold mt-0.5 ${courseType === 'theory_and_practical' ? 'text-slate-300' : 'text-slate-600'}`}>
                              يشمل محاضرات قاعة وتطبيقات مختبرية
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                          courseType === 'theory_and_practical'
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-slate-300 bg-slate-100'
                        }`}>
                          {courseType === 'theory_and_practical' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>

                      {/* بطاقة: نظري فقط */}
                      <button
                        type="button"
                        onClick={() => setCourseType('theory_only')}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          courseType === 'theory_only'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${courseType === 'theory_only' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /> {/* 📖 أيقونة الكتاب */}
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-black flex items-center gap-2">
                              <span>نظري فقط (بدون عملي)</span> {/* 🏷️ نوع نظري فقط */}
                            </div>
                            <p className={`text-xs font-bold mt-0.5 ${courseType === 'theory_only' ? 'text-slate-300' : 'text-slate-600'}`}>
                              محاضرات نظرية في القاعة فقط {/* 📝 الوصف */}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                          courseType === 'theory_only'
                            ? 'bg-cyan-500 border-cyan-400 text-white' // 🎨 مؤشر التحديد
                            : 'border-slate-300 bg-slate-100' // ⚪ غير محدد
                        }`}>
                          {courseType === 'theory_only' && <Check className="w-3.5 h-3.5 stroke-[3]" />} {/* ✅ علامة الصح */}
                        </div>
                      </button>

                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جان نوع المادة غير محدد بالمادة */}
                    {courseType === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار نوع المادة وتوصيف المسار الدراسي للمتابعة</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 🎓 القسم الثاني: الخطة الأكاديمية والوحدات */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <GraduationCap className="w-5 h-5 text-cyan-300" /> {/* 🎓 أيقونة التخرج */}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">التوزيع الأكاديمي والوحدات (ECTS)</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">المرحلة الدراسية والكورس ونقاط مسار بولونيا المعتمدة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                  
                  {/* المرحلة الدراسية بتصميم أزرار تفاعلية واضحة ومباشرة */}
                  <div className="col-span-12 sm:col-span-7 space-y-2">
                    <label className="block text-slate-950 font-black text-base">المرحلة الدراسية *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { num: 1, label: 'المرحلة الأولى' },
                        { num: 2, label: 'المرحلة الثانية' },
                        { num: 3, label: 'المرحلة الثالثة' },
                        { num: 4, label: 'المرحلة الرابعة' },
                      ].map((stg) => (
                        <button
                          key={stg.num}
                          type="button"
                          onClick={() => setCourseStage(stg.num)}
                          className={`py-3.5 px-2 rounded-2xl border text-center font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            courseStage === stg.num
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <GraduationCap className={`w-4 h-4 shrink-0 ${courseStage === stg.num ? 'text-cyan-300' : 'text-slate-600'}`} />
                          <span className="whitespace-nowrap">{stg.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت المرحلة غير محددة بالمادة */}
                    {courseStage === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار المرحلة الدراسية للمادة</span>
                      </p>
                    )}
                  </div>

                  {/* الكورس الدراسي بتصميم أزرار تفاعلية واضحة ومباشرة (مسح كلمة الفصل) */}
                  <div className="col-span-12 sm:col-span-5 space-y-2">
                    <label className="block text-slate-950 font-black text-base">الكورس *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { sem: 1, title: 'الكورس الأول' },
                        { sem: 2, title: 'الكورس الثاني' },
                      ].map((s) => (
                        <button
                          key={s.sem}
                          type="button"
                          onClick={() => setCourseSemester(s.sem as 1 | 2)}
                          className={`py-3.5 px-3 rounded-2xl border text-center font-black text-base transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                            courseSemester === s.sem
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-blue-400/40'
                              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 ${courseSemester === s.sem ? 'text-cyan-300' : 'text-blue-600'}`} />
                          <span>{s.title}</span>
                        </button>
                      ))}
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جان الكورس غير محدد بالمادة */}
                    {courseSemester === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى اختيار الكورس الدراسي للمادة</span>
                      </p>
                    )}
                  </div>

                  {/* الساعات المعتمدة ECTS */}
                  <div className="col-span-12 space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-950 font-black text-base">الساعات والوحدات المعتمدة (ECTS) *</label>
                      <span className="text-xs font-black text-indigo-950 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        النقاط المحددة: {courseCredits ? `${courseCredits} ECTS` : 'غير محدد'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[2, 3, 4, 5, 6, 7, 8].map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setCourseCredits(pts)}
                          className={`py-3 px-2 rounded-2xl font-black text-base border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                            courseCredits === pts
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-cyan-400/40'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          <Award className={`w-4 h-4 ${courseCredits === pts ? 'text-cyan-300' : 'text-indigo-600'}`} />
                          <span>{pts}</span>
                        </button>
                      ))}
                      <div className="relative">
                        {/* 🎯 حقل الساعات المخصصة بدون أي قص لكلمة مخصص وتوسيط مثالي */}
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={courseCredits ?? ''}
                          onChange={(e) => setCourseCredits(e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="مخصص"
                          className="w-full h-full px-1.5 py-3 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-xs sm:text-sm md:text-base focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/20 focus:outline-none shadow-2xs text-center placeholder:text-slate-600 placeholder:font-black"
                        />
                      </div>
                    </div>
                    {/* ⚠️ تنبيه توجيهي أحمر إذا جانت الساعات غير محددة بالمادة */}
                    {courseCredits === null && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>يرجى تحديد الساعات والوحدات المعتمدة (ECTS) للمادة</span>
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* 👨‍🏫 القسم الثالث: تكليف الأساتذة وتعيين الصلاحيات */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                    <Users className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-950">الكادر التدريسي وتكليف الأساتذة</h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600">تعيين أستاذ المحاضرات النظرية وأستاذ المختبر والتطبيقات</p>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${courseType === 'theory_and_practical' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 pt-1`}>
                  
                  {/* أستاذ النظري بقائمة تفاعلية ذكية عبر البورتال تضمن البقاء داخل الشاشة 100% */}
                  <div className="space-y-2 relative z-[999999]">
                    <label className="block text-slate-950 font-black text-base">أستاذ المادة (المحاضرات النظرية)</label>
                    <div className="relative">
                      <button
                        ref={theoryTeacherBtnRef}
                        type="button"
                        onClick={handleToggleCourseTheoryDropdown}
                        className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <UserCheck className="w-5 h-5 text-blue-700 shrink-0" />
                          <span className={courseTheoryTeacherId ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                            {deptTeachers.find((t) => t.id === courseTheoryTeacherId)?.full_name || '-- اختياري: حدد أستاذ النظري --'}
                          </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${isCourseTheoryDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                      </button>

                      {/* القائمة المنبثقة الذكية لأستاذ النظري عبر Portal لضمان عدم خروجها خارج حدود الشاشة */}
                      {isCourseTheoryDropdownOpen && theoryTeacherCoords && typeof document !== 'undefined' && createPortal(
                        <>
                          {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                          <div 
                            className="fixed inset-0 z-[999998]" 
                            onClick={() => setIsCourseTheoryDropdownOpen(false)} 
                          />
                          {/* حاوية القائمة المتموضعة بدقة ذكية حسب موقع الزر ومساحة الشاشة */}
                          <div 
                            style={{
                              position: 'fixed',
                              ...(theoryTeacherCoords.openUpwards
                                ? { bottom: `${theoryTeacherCoords.bottom}px` }
                                : { top: `${theoryTeacherCoords.top}px` }),
                              left: `${theoryTeacherCoords.left}px`,
                              width: `${theoryTeacherCoords.width}px`,
                              maxHeight: `${theoryTeacherCoords.maxHeight || 220}px`,
                            }}
                            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                            dir="rtl"
                          >
                            {/* خيار إلغاء التحديد */}
                            <button
                              type="button"
                              onClick={() => {
                                setCourseTheoryTeacherId('');
                                setIsCourseTheoryDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                !courseTheoryTeacherId ? 'bg-[#0F2942] text-white font-black' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className={!courseTheoryTeacherId ? 'text-white' : 'text-slate-500'}>-- بدون تحديد أستاذ --</span>
                              {!courseTheoryTeacherId && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                            </button>

                            {/* قائمة الأساتذة في القسم */}
                            {deptTeachers.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setCourseTheoryTeacherId(t.id);
                                  setIsCourseTheoryDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  courseTheoryTeacherId === t.id
                                    ? 'bg-[#0F2942] text-white shadow-xs'
                                    : 'text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <UserCheck className={`w-4 h-4 ${courseTheoryTeacherId === t.id ? 'text-cyan-300' : 'text-blue-700'}`} />
                                  <span>{t.full_name}</span>
                                </div>
                                {courseTheoryTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  </div>

                  {/* أستاذ العملي بقائمة تفاعلية ذكية عبر البورتال تضمن البقاء داخل الشاشة 100% */}
                  {courseType === 'theory_and_practical' && (
                    <div className="space-y-2 relative z-[999999] animate-in fade-in duration-150">
                      <label className="block text-slate-950 font-black text-base">أستاذ المختبر (التطبيقات والعملي)</label>
                      <div className="relative">
                        <button
                          ref={practicalTeacherBtnRef}
                          type="button"
                          onClick={handleToggleCoursePracticalDropdown}
                          className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:border-slate-900 focus:outline-none cursor-pointer shadow-2xs text-right flex items-center justify-between transition hover:border-slate-400"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FlaskConical className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span className={coursePracticalTeacherId ? 'text-slate-950 font-black' : 'text-slate-500 font-bold'}>
                              {deptTeachers.find((t) => t.id === coursePracticalTeacherId)?.full_name || '-- اختياري: حدد أستاذ العملي --'}
                            </span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${isCoursePracticalDropdownOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                        </button>

                        {/* القائمة المنبثقة الذكية لأستاذ العملي عبر Portal لضمان عدم خروجها خارج حدود الشاشة */}
                        {isCoursePracticalDropdownOpen && practicalTeacherCoords && typeof document !== 'undefined' && createPortal(
                          <>
                            {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                            <div 
                              className="fixed inset-0 z-[999998]" 
                              onClick={() => setIsCoursePracticalDropdownOpen(false)} 
                            />
                            {/* حاوية القائمة المتموضعة بدقة ذكية حسب موقع الزر ومساحة الشاشة */}
                            <div 
                              style={{
                                position: 'fixed',
                                ...(practicalTeacherCoords.openUpwards
                                  ? { bottom: `${practicalTeacherCoords.bottom}px` }
                                  : { top: `${practicalTeacherCoords.top}px` }),
                                left: `${practicalTeacherCoords.left}px`,
                                width: `${practicalTeacherCoords.width}px`,
                                maxHeight: `${practicalTeacherCoords.maxHeight || 220}px`,
                              }}
                              className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                              dir="rtl"
                            >
                              {/* خيار إلغاء التحديد */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCoursePracticalTeacherId('');
                                  setIsCoursePracticalDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                  !coursePracticalTeacherId ? 'bg-[#0F2942] text-white font-black' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className={!coursePracticalTeacherId ? 'text-white' : 'text-slate-500'}>-- بدون تحديد أستاذ --</span>
                                {!coursePracticalTeacherId && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                              </button>

                              {/* قائمة الأساتذة في القسم */}
                              {deptTeachers.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setCoursePracticalTeacherId(t.id);
                                    setIsCoursePracticalDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                                    coursePracticalTeacherId === t.id
                                      ? 'bg-[#0F2942] text-white shadow-xs'
                                      : 'text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className={`w-4 h-4 ${coursePracticalTeacherId === t.id ? 'text-emerald-300' : 'text-emerald-700'}`} />
                                    <span>{t.full_name}</span>
                                  </div>
                                  {coursePracticalTeacherId === t.id && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                                </button>
                              ))}
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 🎯 القسم الرابع: خيار تفعيل وعرض درجات الامتحان النهائي (الدور الأول) - زران: إغلاق وفتح بتصميم كحلي موحد */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shadow-2xs ${courseIsFinalExamEnabled ? 'bg-[#0F2942] text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {courseIsFinalExamEnabled ? (
                        <Unlock className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-950">الامتحان النهائي (الدور الأول)</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                          courseIsFinalExamEnabled 
                            ? 'bg-blue-50 text-[#0F2942] border border-blue-200' 
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          {courseIsFinalExamEnabled ? 'مفتوح ومفعّل' : 'مغلق (الافتراضي)'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                        {courseIsFinalExamEnabled 
                          ? 'مفعل ومعروض حالياً: يظهر عمود الامتحان النهائي (من 50) للأستاذ والطلبة وتُحتسب النتائج.' 
                          : 'مغلق ومحجوب: عمود الامتحان النهائي مخفي ويقتصر العرض على السعي الفصلي التكويني فقط.'}
                      </p>
                    </div>
                  </div>

                  {/* زرا التحكم بالامتحان النهائي: إغلاق وفتح بتصميم كحلي ملكي موحد وأيقونات SVG ناصعة */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* زر إغلاق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (courseIsFinalExamEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'final',
                            targetState: false,
                            title: 'تأكيد إغلاق وحجب الامتحان النهائي (الدور الأول)',
                            description: 'هل أنت متأكد من رغبتك في إغلاق وحجب عمود الامتحان النهائي؟ سيقتصر العرض على السعي الفصلي التكويني فقط ولن يتمكن الأستاذ من تعديل الدرجات النهائية.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        !courseIsFinalExamEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Lock className={`w-4 h-4 ${!courseIsFinalExamEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>إغلاق</span>
                    </button>

                    {/* زر فتح بتصميم كحلي ملكي مطابق تماماً لزر الغلق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!courseIsFinalExamEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'final',
                            targetState: true,
                            title: 'تأكيد فتح الامتحان النهائي (الدور الأول)',
                            description: 'هل أنت متأكد من رغبتك في فتح وتفعيل عمود الامتحان النهائي (من 50)؟ سيتمكن الأستاذ من رصد الدرجات وستظهر للطلبة ضمن النتائج.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        courseIsFinalExamEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Unlock className={`w-4 h-4 ${courseIsFinalExamEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>فتح</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🔄 القسم الخامس: خيار تفعيل فترة رصد درجات الدور الثاني (الإكمال) - زران: إغلاق وفتح بتصميم كحلي موحد */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl shadow-2xs ${courseIsSupplementaryEnabled ? 'bg-[#0F2942] text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {courseIsSupplementaryEnabled ? (
                        <Unlock className="w-5 h-5 text-cyan-300" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-950">فترة رصد درجات الدور الثاني (الإكمال)</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                          courseIsSupplementaryEnabled 
                            ? 'bg-blue-50 text-[#0F2942] border border-blue-200' 
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          {courseIsSupplementaryEnabled ? 'مفتوح ومفعّل' : 'مغلق (الافتراضي)'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                        {courseIsSupplementaryEnabled 
                          ? 'مفعلة حالياً: سيظهر عمود الدور الثاني (من 50) في جدول الأستاذ لرصد درجات المكملين.' 
                          : 'مغلقة (الدور الأول فقط): عمود الدور الثاني مخفي تماماً لمنع التشتت والتضارب الأكاديمي.'}
                      </p>
                    </div>
                  </div>

                  {/* زرا التحكم بالدور الثاني: إغلاق وفتح بتصميم كحلي ملكي موحد وأيقونات SVG ناصعة */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* زر إغلاق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (courseIsSupplementaryEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'supplementary',
                            targetState: false,
                            title: 'تأكيد إغلاق فترة الدور الثاني',
                            description: 'هل أنت متأكد من إغلاق فترة الدور الثاني؟ سيتم حجب عمود درجات الإكمال عن واجهة الأستاذ للحفاظ على استقرار السجلات الأكاديمية.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        !courseIsSupplementaryEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Lock className={`w-4 h-4 ${!courseIsSupplementaryEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>إغلاق</span>
                    </button>

                    {/* زر فتح بتصميم كحلي ملكي مطابق تماماً لزر الغلق */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!courseIsSupplementaryEnabled) {
                          setExamToggleConfirmation({
                            isOpen: true,
                            examType: 'supplementary',
                            targetState: true,
                            title: 'تأكيد فتح رصد درجات الدور الثاني (الإكمال)',
                            description: 'هل أنت متأكد من فتح فترة رصد درجات الدور الثاني؟ سيظهر عمود الدور الثاني (من 50) في جدول الأستاذ لرصد درجات الطلبة المكملين.',
                          });
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                        courseIsSupplementaryEnabled
                          ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm ring-2 ring-slate-400/30'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <Unlock className={`w-4 h-4 ${courseIsSupplementaryEnabled ? 'text-cyan-300' : 'text-slate-500'}`} />
                      <span>فتح</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 💡 شريط الملاحظات الإرشادي */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 text-sm font-bold flex items-center gap-3">
                <Sliders className="w-5 h-5 text-blue-700 shrink-0" />
                <span>
                  ملاحظة أكاديمية: بعد حفظ المادة، يمكنك في أي وقت النقر على زر <strong className="text-blue-900 underline font-black">تخصيص الدرجات</strong> في جدول المواد لتعديل أوزان بنود بولونيا الـ 7.
                </span>
              </div>

            </div>
          </FloatingCrudModal>

          {/* 🔐 نافذة تأكيد تغيير حالة الامتحان (فتح أو إغلاق الدور الأول أو الدور الثاني) */}
          {/* 🔐 نافذة تأكيد تغيير حالة الامتحان الموحدة بنسبة 100% في منتصف الشاشة بدون أي سكرول */}
          {examToggleConfirmation && examToggleConfirmation.isOpen && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
              <div 
                className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-3 text-right relative animate-in zoom-in-95 duration-150 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ❌ زر الإغلاق السريع باللون الأسود */}
                <button
                  type="button"
                  onClick={() => setExamToggleConfirmation(null)}
                  className="absolute top-4 left-4 p-2 text-slate-950 hover:text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 🛡️ شارة وأيقونة رأس المودال المركزية الفاخرة بدون مبالغة بالحجم */}
                <div className="flex flex-col items-center justify-center text-center pt-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-1.5 ${
                    examToggleConfirmation.targetState 
                      ? 'bg-[#0F2942] text-white ring-3 ring-[#0F2942]/15' 
                      : 'bg-slate-800 text-white ring-3 ring-slate-800/15'
                  }`}>
                    {examToggleConfirmation.targetState ? (
                      <Unlock className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <span className="px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 border shadow-2xs bg-slate-100 text-slate-950 border-slate-300">
                    {examToggleConfirmation.targetState ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942]" />
                        <span>طلب فتح وتفعيل رسمي</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-950" />
                        <span>طلب إغلاق وحجب رسمي</span>
                      </>
                    )}
                  </span>

                  <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1.5">
                    {examToggleConfirmation.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-1 leading-relaxed">
                    {examToggleConfirmation.description}
                  </p>
                </div>

                {/* 📋 صندوق تفاصيل العملية ونطاق التأثير بنصوص سوداء وواضحة جداً 100% */}
                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs sm:text-sm font-black text-slate-950">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">الدور الأكاديمي:</span>
                    <span className="text-slate-950 font-black">
                      {examToggleConfirmation.examType === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني (الإكمال)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">الكورس الدراسي:</span>
                    <span className="text-slate-950 font-black">
                      {(courseSemester || 1) === 1 ? 'الكورس الأول' : 'الكورس الثاني'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-950 font-black">المادة الدراسية:</span>
                    <span className="text-slate-950 font-black">
                      {courseName.trim() || 'المادة الدراسية الحالية'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-950 font-black">المرحلة الدراسية:</span>
                    <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg font-mono font-bold text-xs shadow-2xs">
                      المرحلة {getStageNameInArabic(courseStage || 1)}
                    </span>
                  </div>
                </div>

                {/* 💡 إشعار وتنبيه توجيهي رسمي بنص أسود صريح ومدمج */}
                <div className="p-2.5 sm:p-3 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {examToggleConfirmation.targetState ? (
                      <span>
                        فور التأكيد، سيتم تفعيل إمكانية رصد وإدخال درجات هذا الدور من قبل التدريسي المكلف، وستنعكس مباشرة وبشكل حي في بوابات الطلبة.
                      </span>
                    ) : (
                      <span>
                        فور التأكيد، سيتم قفل وتجميد إدخال درجات هذا الدور وحجبها عن بوابات الطلبة، واقتصار العرض على السعي الفصلي التكويني فقط لحين الاعتماد الرسمي.
                      </span>
                    )}
                  </div>
                </div>

                {/* 🔘 أزرار اتخاذ القرار والتنفيذ الموزونة والفاخرة */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmExamToggle}
                    className="flex-1 py-2.5 px-4 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {examToggleConfirmation.targetState ? 'نعم، تأكيد الفتح والتفعيل' : 'نعم، تأكيد الإغلاق والحجب'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamToggleConfirmation(null)}
                    className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-sm transition border border-slate-300 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* جدول مواد القسم مع تفاصيل النظري والعملي والتحكم الكامل */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* 🎛️ شريط التحكم العلوي: فلاتر المراحل والكورسات والأنواع + البحث السريع */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <BookOpen className="w-6 h-6 text-slate-900" />
                    <span>مواد قسم {deptName} المعتمدة ({deptCourses.length})</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    قائمة المقررات الدراسية وتوصيفها الأكاديمي وصلاحيات الرصد المنفصلة للنظري والعملي
                  </p>
                </div>

                {/* 🔍 حقل البحث السريع في المواد */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-700" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="بحث باسم المادة، الرمز، أو الأستاذ..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold"
                  />
                </div>
              </div>

              {/* 🏷️ شريط الفلاتر والتبويبات المنظم والأنيق بتصميم عصري ومرتب 100% */}
              <div className="space-y-3.5 pt-2"> {/* 📦 الحاوية الرأسية للفلاتر والتبويبات بتصميم فاخر */}
                
                {/* 📌 الصف الأول: تصفية المراحل الدراسية في شريط تبويبات كبسولي احترافي */}
                <div className="flex items-center justify-between flex-wrap gap-2.5"> {/* 🧭 صف تبويبات المراحل */}
                  <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-300 gap-1.5 flex-wrap"> {/* 🎨 كبسولة تبويبات المراحل الرصاصية */}
                    <span className="text-sm sm:text-base font-black text-slate-950 px-2.5 flex items-center gap-1.5"> {/* 🏷️ عنوان تصفية المرحلة */}
                      <Layers className="w-4 h-4 text-[#0F2942]" /> {/* 📑 أيقونة الطبقات الكحلية */}
                      <span>المرحلة:</span> {/* 🏷️ نص تسمية المرحلة */}
                    </span>

                    {/* 🔘 تبويب كافة المراحل */}
                    <button
                      type="button" // 🛑 نوع الزر لمنع الإرسال
                      onClick={() => setFilterCourseStage('all')} // ⚡ تصفية كافة المراحل
                      className={`py-2 px-3.5 sm:px-4 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 تنسيقات الزر
                        filterCourseStage === 'all' // 🔍 هل التبويب نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي راقي للتبويب النشط
                          : 'text-slate-800 hover:bg-white hover:text-slate-950 border border-transparent hover:border-slate-200' // ⚪ تبويب غير نشط
                      }`}
                    >
                      <span>كافة المراحل</span> {/* 🏷️ نص التبويب */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 إجمالي المواد بالقسم */}
                      </span>
                    </button>

                    {/* 🔘 أزرار المراحل الأربعة بالقسم */}
                    {[
                      { num: 1, name: 'الأولى' }, // 🥇 المرحلة الأولى
                      { num: 2, name: 'الثانية' }, // 🥈 المرحلة الثانية
                      { num: 3, name: 'الثالثة' }, // 🥉 المرحلة الثالثة
                      { num: 4, name: 'الرابعة' }, // 🎓 المرحلة الرابعة
                    ].map((st) => { // 🔄 تكرار المراحل
                      const count = deptCourses.filter((c) => (Number(c.stage_number) || 1) === st.num).length; // 🧮 حساب عدد مواد كل مرحلة بدقة
                      return (
                        <button
                          key={st.num} // 🔑 المفتاح الفريد
                          type="button" // 🛑 نوع الزر
                          onClick={() => setFilterCourseStage(st.num)} // ⚡ تصفية مواد المرحلة المختارة
                          className={`py-2 px-3.5 sm:px-4 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                            filterCourseStage === st.num // 🔍 هل المرحلة مختارة؟
                              ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للمرحلة النشطة
                              : 'text-slate-800 hover:bg-white hover:text-slate-950 border border-transparent hover:border-slate-200' // ⚪ مرحلة غير نشطة
                          }`}
                        >
                          <span>المرحلة {st.name}</span> {/* 🏷️ اسم المرحلة */}
                          <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                            filterCourseStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                          }`}>
                            {count} {/* 🔢 عدد مواد المرحلة */}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 📌 الصف الثاني: تصفية الكورس الدراسي وتصفية نوع المقرر */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200"> {/* 🧭 صف الكورس والنوع */}
                  {/* 1. تصفية الكورس الدراسي */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 📅 حاوية أزرار الكورسات */}
                    <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان فلتر الكورس */}
                      <Calendar className="w-4 h-4 text-[#0F2942]" /> {/* 📅 أيقونة التقويم للكورس */}
                      <span>الكورس:</span> {/* 🏷️ النص التوضيحي للكورس */}
                    </span>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester('all')} // ⚡ عرض كافة الكورسات
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 'all' // 🔍 هل التبويب نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>كافة الكورسات</span> {/* 🏷️ النص */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 العدد الكلي */}
                      </span>
                    </button>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester(1)} // ⚡ تصفية الكورس الأول
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 1 // 🔍 هل الكورس الأول نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>الكورس الأول</span> {/* 🏷️ الكورس الأول */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.filter((c) => (Number(c.semester) || 1) === 1).length} {/* 🔢 عدد مواد الكورس الأول */}
                      </span>
                    </button>

                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseSemester(2)} // ⚡ تصفية الكورس الثاني
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseSemester === 2 // 🔍 هل الكورس الثاني نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <span>الكورس الثاني</span> {/* 🏷️ الكورس الثاني */}
                      <span className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-mono font-black ${ // 🔢 بادج العداد
                        filterCourseSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.filter((c) => (Number(c.semester) || 1) === 2).length} {/* 🔢 عدد مواد الكورس الثاني */}
                      </span>
                    </button>
                  </div>

                  {/* 2. تصفية نوع المقرر */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 🧪 حاوية أزرار نوع المقرر */}
                    <span className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان الفلتر */}
                      <Sparkles className="w-4 h-4 text-[#0F2942]" /> {/* ✨ أيقونة التمييز للنوع */}
                      <span>النوع:</span> {/* 🏷️ نص تسمية نوع المادة */}
                    </span>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('all')} // ⚡ عرض كافة الأنواع
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'all' // 🔍 هل الكل نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      الكل {/* 🏷️ كافة الأنواع */}
                    </button>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('theory_and_practical')} // ⚡ تصفية نظري وعملي
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'theory_and_practical' // 🔍 هل نظري وعملي نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <FlaskConical className="w-4 h-4" /> {/* 🧪 أيقونة المختبر */}
                      <span>نظري وعملي</span> {/* 🏷️ نظري وعملي */}
                    </button>
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => setFilterCourseType('theory_only')} // ⚡ تصفية نظري فقط
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${ // 🎨 التنسيقات
                        filterCourseType === 'theory_only' // 🔍 هل نظري فقط نشط؟
                          ? 'bg-[#0F2942] text-white shadow-xs border border-[#163a5f]' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300' // ⚪ زر غير نشط
                      }`}
                    >
                      <BookOpen className="w-4 h-4" /> {/* 📖 أيقونة الكتاب */}
                      <span>نظري فقط</span> {/* 🏷️ نظري فقط */}
                    </button>
                  </div>
                </div>

                {/* 📌 الصف الثالث: التحكم الجماعي بالدور الأول والدور الثاني للمرحلة والكورس أو المواد المحددة بمقاسات متوسطة وأنيقة */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-200 bg-gradient-to-r from-slate-100/90 via-blue-50/40 to-slate-100/90 p-3 sm:p-3.5 rounded-2xl border shadow-2xs"> {/* 🛡️ حاوية التحكم الجماعي الفاخرة بمقاس متوسط */}
                  
                  {/* 🎯 التحكم الجماعي بالامتحان النهائي (الدور الأول): نصوص متوسطة وشارة حالة وزران شغالين تفاعلياً */}
                  <div className="flex items-center gap-2.5 flex-wrap"> {/* 🎯 مجموعة الدور الأول */}
                    <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5"> {/* 🏷️ النص التوضيحي بمقاس متوسط ومريح */}
                      <FileText className="w-4 h-4 text-[#0F2942]" /> {/* 📄 أيقونة الامتحان */}
                      <span>
                        {selectedCourseIds.length > 0 // 🔍 هل اكو مواد محددة بالـ checkbox؟
                          ? `النهائي (الدور الأول) — للمحدد (${selectedCourseIds.length}):` // 🎯 عنوان مخصص للمحدد
                          : filterCourseSemester === 1 // 🔍 هل فلتر الكورس الأول مفعّل؟
                          ? 'النهائي (الدور الأول) — الكورس الأول:' // 🎯 عنوان الكورس الأول
                          : filterCourseSemester === 2 // 🔍 هل فلتر الكورس الثاني مفعّل؟
                          ? 'النهائي (الدور الأول) — الكورس الثاني:' // 🎯 عنوان الكورس الثاني
                          : 'النهائي (الدور الأول):'} {/* 🎯 العنوان العام */}
                      </span>
                    </span>

                    {/* شارة حالة الدور الأول للمواد المستهدفة حالياً بمقاس متوسط رشيق */}
                    {isBulkFinalOpen ? ( // 🔍 هل كافة المواد مفتوحة؟
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🟢 شارة النجاح الأخضر */}
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> {/* 🟢 نقطة نبض خضراء */}
                        <span>مفتوح ومفعّل ({finalOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الحالة مع العداد الدقيق */}
                      </span>
                    ) : isBulkFinalPartial ? ( // 🔍 هل اكو فتح جزئي لبعض المواد؟
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-950 border border-sky-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🩵 شارة الفتح الجزئي النيلية الهادئة */}
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span> {/* 🩵 نقطة نيلية هادئة مريحة للعين */}
                        <span>مفتوح جزئياً ({finalOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الفتح الجزئي الدقيق */}
                      </span>
                    ) : ( // 🔍 الحالة الافتراضية: مغلق
                      <span className="px-2.5 py-0.5 bg-slate-200/90 text-slate-900 border border-slate-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* ⚪ شارة القفل الرصاصية */}
                        <Lock className="w-3 h-3 text-slate-700" /> {/* 🔒 قفل رصاصي مصغر */}
                        <span>مغلق (الافتراضي)</span> {/* 🏷️ نص الغلق الافتراضي */}
                      </span>
                    )}

                    {/* كبسولة زري إغلاق وفتح بحجم متوسط متناسق وأداء تفاعلي حقيقي 100% */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين بمقاس مدمج */}
                      {/* زر إغلاق النهائي للمرحلة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleFinalExam(false)} // 🔒 إغلاق النهائي مع استهداف المفتوح فقط
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          !isBulkFinalOpen && !isBulkFinalPartial // 🔍 إذا مغلق بالكامل
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 كحلي ملكي مفعل
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ شفاف بانتظار الضغط
                        }`}
                        title="إغلاق وحجب الامتحان النهائي للمواد المفتوحة فقط مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Lock className={`w-3.5 h-3.5 ${!isBulkFinalOpen && !isBulkFinalPartial ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔒 أيقونة القفل */}
                        <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                      </button>

                      {/* زر فتح النهائي للمرحلة مع تمييز واضح وبارز عند الفتح الجزئي */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleFinalExam(true)} // 🔓 فتح النهائي مع طلب تأكيد
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          isBulkFinalOpen // 🔍 إذا مفتوح بالكامل 100%
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعل بالكامل
                            : isBulkFinalPartial // 🌟 عند الفتح الجزئي نجعله زراً محدداً ومميزاً بوضوح تام ليعرفه المستخدم
                            ? 'bg-sky-100 text-sky-950 border-2 border-sky-400 font-black shadow-xs ring-1 ring-sky-300' // 🩵 زر محدد بوضوح للفتح الجزئي
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="فتح وتفعيل درجات الامتحان النهائي للدور الأول مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Unlock className={`w-3.5 h-3.5 ${isBulkFinalOpen ? 'text-cyan-300' : isBulkFinalPartial ? 'text-sky-700' : 'text-slate-600'}`} /> {/* 🔓 أيقونة الفتح */}
                        <span>فتح</span> {/* 🏷️ نص الفتح */}
                        {isBulkFinalPartial && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>} {/* 🩵 نقطة نبض دلالية للفتح الجزئي */}
                      </button>
                    </div>
                  </div>

                  {/* 🔄 التحكم الجماعي بفترة الدور الثاني: نصوص متوسطة وشارة حالة وزران شغالين تفاعلياً */}
                  <div className="flex items-center gap-2.5 flex-wrap"> {/* 🔄 مجموعة الدور الثاني */}
                    <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5"> {/* 🏷️ النص التوضيحي بمقاس متوسط */}
                      <Award className="w-4 h-4 text-[#0F2942]" /> {/* 🏆 أيقونة الدور الثاني */}
                      <span>
                        {selectedCourseIds.length > 0 // 🔍 هل اكو مواد محددة بالـ checkbox؟
                          ? `فترة الدور الثاني — للمحدد (${selectedCourseIds.length}):` // 🎯 عنوان مخصص للمحدد
                          : filterCourseSemester === 1 // 🔍 هل فلتر الكورس الأول مفعّل؟
                          ? 'فترة الدور الثاني — الكورس الأول:' // 🎯 عنوان الكورس الأول
                          : filterCourseSemester === 2 // 🔍 هل فلتر الكورس الثاني مفعّل؟
                          ? 'فترة الدور الثاني — الكورس الثاني:' // 🎯 عنوان الكورس الثاني
                          : 'فترة الدور الثاني:'} {/* 🎯 العنوان العام */}
                      </span>
                    </span>

                    {/* شارة حالة الدور الثاني للمواد المستهدفة حالياً بمقاس متوسط */}
                    {isBulkSupOpen ? ( // 🔍 هل كافة المواد مفتوحة بالدور الثاني؟
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🟢 شارة النجاح الأخضر */}
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> {/* 🟢 نقطة نبض خضراء */}
                        <span>مفتوح ومفعّل ({supOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الحالة مع العداد الدقيق */}
                      </span>
                    ) : isBulkSupPartial ? ( // 🔍 هل اكو فتح جزئي للدور الثاني؟
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-950 border border-sky-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* 🩵 شارة الفتح الجزئي النيلية الهادئة */}
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span> {/* 🩵 نقطة نيلية هادئة مريحة للعين */}
                        <span>مفتوح جزئياً ({supOpenCount}/{activeTargetRoundCourses.length})</span> {/* 🏷️ نص الفتح الجزئي الدقيق */}
                      </span>
                    ) : ( // 🔍 الحالة الافتراضية: مغلق
                      <span className="px-2.5 py-0.5 bg-slate-200/90 text-slate-900 border border-slate-300 rounded-lg text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"> {/* ⚪ شارة القفل الرصاصية */}
                        <Lock className="w-3 h-3 text-slate-700" /> {/* 🔒 قفل رصاصي */}
                        <span>مغلق (الافتراضي)</span> {/* 🏷️ نص الغلق الافتراضي */}
                      </span>
                    )}

                    {/* كبسولة زري إغلاق وفتح بمقاس متوسط متناسق وأداء تفاعلي حقيقي 100% */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين */}
                      {/* زر إغلاق الدور الثاني للمرحلة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleSupplementaryExam(false)} // 🔒 إغلاق الدور الثاني للمفتوح فقط
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          !isBulkSupOpen && !isBulkSupPartial // 🔍 إذا مغلق حالياً
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعّل
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="إغلاق رصد الدور الثاني للمواد المفتوحة فقط مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Lock className={`w-3.5 h-3.5 ${!isBulkSupOpen && !isBulkSupPartial ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* 🔒 أيقونة القفل */}
                        <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                      </button>

                      {/* زر فتح الدور الثاني للمرحلة مع تمييز واضح للفتح الجزئي */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => handleBulkToggleSupplementaryExam(true)} // 🔓 فتح الدور الثاني مع طلب تأكيد
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات المتوسطة
                          isBulkSupOpen // 🔍 إذا مفتوح بالكامل
                            ? 'bg-[#0F2942] text-white shadow-xs ring-1 ring-[#0F2942]' // 👑 تصميم كحلي ملكي مفعّل
                            : isBulkSupPartial // 🌟 عند الفتح الجزئي نجعله زراً محدداً ومميزاً بوضوح تام ليعرفه المستخدم
                            ? 'bg-sky-100 text-sky-950 border-2 border-sky-400 font-black shadow-xs ring-1 ring-sky-300' // 🩵 زر محدد بوضوح للفتح الجزئي
                            : 'bg-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950' // ⚪ تصميم أبيض هادئ بانتظار النقر
                        }`}
                        title="فتح وتفعيل فترة رصد درجات الدور الثاني مع طلب تأكيد رسمي" // 💡 تلميح الزر
                      >
                        <Unlock className={`w-3.5 h-3.5 ${isBulkSupOpen ? 'text-cyan-300' : isBulkSupPartial ? 'text-sky-700' : 'text-slate-600'}`} /> {/* 🔓 أيقونة الفتح */}
                        <span>فتح</span> {/* 🏷️ نص الفتح */}
                        {isBulkSupPartial && <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>} {/* 🩵 نقطة نبض دلالية للفتح الجزئي */}
                      </button>
                    </div>
                  </div>

                </div>

                {/* 📌 الصف الرابع (أسفل): صف التحديد السريع للمواد مع أزرار مصغرة وأنيقة وزر كحلي ملكي لتحديد كل الكورسات */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200"> {/* 🧭 حاوية التحديد السريع في أسفل الكارد */}
                  
                  {/* أزرار التحديد السريع للكورسات بحجم مصغر احترافي */}
                  <div className="flex items-center gap-2 flex-wrap"> {/* 🎯 مجموعة أزرار التحديد السريع */}
                    <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5 ml-1"> {/* 🏷️ عنوان التحديد السريع */}
                      <CheckSquare className="w-4 h-4 text-[#0F2942]" /> {/* ☑️ أيقونة المربع المحدد */}
                      <span>تحديد سريع:</span> {/* 🏷️ نص التحديد السريع */}
                    </span>

                    {/* زر تحديد كل الكورسات مثل ألوان أزرار الكورسين بحجم مصغر */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد كل الكورسات
                        const allIds = deptCourses.map((c) => c.id); // 📋 معرفات كل مواد الكورسات في القسم
                        const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedCourseIds.includes(id)); // 🔍 هل كل الكورسات محددة حالياً؟
                        if (isAllSelected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds([]); // ❌ نلغي التحديد بالكامل
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(allIds); // 👑 نحدد كل كورسات ومواد القسم دفعة واحدة
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) // 🔍 هل كل الكورسات محددة حالياً؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط مثل باقي الأزرار
                      }`}
                      title="تحديد أو إلغاء تحديد كافة كورسات ومواد القسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح مطابقة لأزرار الكورسات */}
                      <span>تحديد كل الكورسات</span> {/* 🏷️ تسمية الزر المعتمدة */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد
                        deptCourses.length > 0 && deptCourses.every((c) => selectedCourseIds.includes(c.id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptCourses.length} {/* 🔢 عدد كل المواد بالقسم */}
                      </span>
                    </button>

                    {/* زر التحديد السريع لمواد الكورس الأول بحجم مصغر احترافي وتسمية محدثة */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد مواد الكورس الأول
                        const isAllSem1Selected = deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id) => selectedCourseIds.includes(id)); // 🔍 فحص هل كل مواد الكورس الأول محددة
                        if (isAllSem1Selected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds(selectedCourseIds.filter((id) => !deptSem1CourseIds.includes(id))); // ❌ نلغي تحديد مواد الكورس الأول
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...deptSem1CourseIds]))); // ✅ نضيف مواد الكورس الأول للتحديد
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id) => selectedCourseIds.includes(id)) // 🔍 هل مواد الكورس الأول محددة بالكامل؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط
                      }`}
                      title="تحديد أو إلغاء تحديد كافة مواد الكورس الأول للقسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id) => selectedCourseIds.includes(id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح */}
                      <span>تحديد مواد الكورس الأول</span> {/* 🏷️ نص الزر المحدث */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد المصغر
                        deptSem1CourseIds.length > 0 && deptSem1CourseIds.every((id) => selectedCourseIds.includes(id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptSem1CourseIds.length} {/* 🔢 عدد مواد الكورس الأول */}
                      </span>
                    </button>

                    {/* زر التحديد السريع لمواد الكورس الثاني بحجم مصغر احترافي وتسمية محدثة */}
                    <button
                      type="button" // 🛑 نوع الزر
                      onClick={() => { // ⚡ ضغطة تحديد مواد الكورس الثاني
                        const isAllSem2Selected = deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id) => selectedCourseIds.includes(id)); // 🔍 فحص هل كل مواد الكورس الثاني محددة
                        if (isAllSem2Selected) { // 🔍 إذا كلهن محددات
                          setSelectedCourseIds(selectedCourseIds.filter((id) => !deptSem2CourseIds.includes(id))); // ❌ نلغي تحديد مواد الكورس الثاني
                        } else { // 🔍 إذا مو كلهن محددات
                          setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...deptSem2CourseIds]))); // ✅ نضيف مواد الكورس الثاني للتحديد
                        } // 🔚 نهاية الشرط
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${ // 🎨 التنسيقات المصغرة
                        deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id) => selectedCourseIds.includes(id)) // 🔍 هل مواد الكورس الثاني محددة بالكامل؟
                          ? 'bg-[#0F2942] text-white border-[#163a5f] shadow-xs' // 👑 كحلي ملكي للنشط
                          : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border-slate-300' // ⚪ رمادي فاتح لغير النشط
                      }`}
                      title="تحديد أو إلغاء تحديد كافة مواد الكورس الثاني للقسم" // 💡 تلميح الزر
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id) => selectedCourseIds.includes(id)) ? 'text-cyan-300' : 'text-slate-600'}`} /> {/* ✅ أيقونة الصح */}
                      <span>تحديد مواد الكورس الثاني</span> {/* 🏷️ نص الزر المحدث */}
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-black ${ // 🔢 بادج العداد المصغر
                        deptSem2CourseIds.length > 0 && deptSem2CourseIds.every((id) => selectedCourseIds.includes(id)) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800' // 🎨 لون البادج
                      }`}>
                        {deptSem2CourseIds.length} {/* 🔢 عدد مواد الكورس الثاني */}
                      </span>
                    </button>
                  </div>

                  {/* أزرار الحذف وإلغاء التحديد والطباعة السريعة تظهر بجانب التحديد السريع عند وجود مواد محددة بنفس الحجم المصغر الاحترافي */}
                  {selectedCourseIds.length > 0 && ( // 🔍 تظهر فقط عند وجود مواد محددة
                    <div className="flex items-center gap-2"> {/* 🛡️ حاوية الحذف والإلغاء والطباعة بجانب التحديد السريع */}
                      {/* 🖨️ زر طباعة المواد المحددة بصيغة PDF الفاخرة */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={handleExportCoursesPDF} // ⚡ تشغيل طباعة المواد المحددة
                        disabled={isExportingCoursesPDF} // 🛑 تعطيل الزر أثناء التصدير
                        className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#163a5f] disabled:opacity-50" // 🎨 تنسيق كحلي ملكي مصغر
                        title="طباعة وتصدير المواد المحددة فقط بصيغة PDF الرسمية" // 💡 تلميح الزر
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-300" /> {/* 🖨️ أيقونة الطابعة */}
                        <span>{isExportingCoursesPDF ? 'جاري التصدير...' : `طباعة PDF (${selectedCourseIds.length})`}</span> {/* 🏷️ نص الزر */}
                      </button>

                      {/* زر حذف المواد المحددة بنفس الحجم */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={handleBulkDeleteCourses} // 🗑️ حذف المواد المحددة
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95" // 🎨 التنسيقات المصغرة الاحترافية
                        title="حذف المواد الدراسية المحددة نهائياً" // 💡 تلميح الزر
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {/* 🗑️ أيقونة سلة المهملات */}
                        <span>حذف ({selectedCourseIds.length})</span> {/* 🏷️ نص الحذف مع العداد */}
                      </button>

                      {/* زر إلغاء التحديد بنفس الحجم */}
                      <button
                        type="button" // 🛑 نوع الزر
                        onClick={() => setSelectedCourseIds([])} // ⚡ تصفير التحديد
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 shadow-2xs" // 🎨 التنسيقات المصغرة الاحترافية
                        title="إلغاء اختيار المواد المحددة" // 💡 تلميح الزر
                      >
                        إلغاء التحديد ({selectedCourseIds.length}) {/* 🏷️ نص الإلغاء مع العداد */}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-1">
                <p>لا توجد مواد دراسية مطابقة للبحث أو التصفية في هذا القسم.</p>
                <p className="text-base font-black text-slate-700 font-bold">يمكنك إضافة مادة جديدة أو تغيير معايير التصفية.</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-sm font-black whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#0F2942] text-white font-black text-sm whitespace-nowrap border-b border-[#0F2942]">
                      <th className="p-3.5 text-center text-sm w-12 whitespace-nowrap text-white">
                        {/* زر تحديد كافة المواد المعروضة في رأس الجدول باللون الأبيض لكي يتميز بوضوح تام */}
                        <button
                          type="button" // 🛑 نوع الزر
                          onClick={() => { // ⚡ تبديل تحديد كافة المواد المعروضة
                            const allVisibleSelected = filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)); // 🔍 فحص هل كل المعروض محدد
                            if (allVisibleSelected) { // 🔍 إذا كلهن محددات
                              const visibleIds = new Set(filteredCourses.map((c) => c.id)); // 📋 معرفات المعروض
                              setSelectedCourseIds(selectedCourseIds.filter((id) => !visibleIds.has(id))); // ❌ إلغاء تحديد المعروض
                            } else { // 🔍 إذا مو كلهن محددات
                              const visibleIds = filteredCourses.map((c) => c.id); // 📋 معرفات المعروض
                              setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...visibleIds]))); // ✅ إضافة كافة المعروض للتحديد
                            } // 🔚 نهاية الشرط
                          }}
                          className={`w-4.5 h-4.5 mx-auto rounded-md border-2 transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${ // 🎨 التنسيقات البيضاء المميزة
                            filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)) // 🔍 هل الكل محدد؟
                              ? 'bg-white text-[#0F2942] border-white shadow-sm ring-2 ring-white/50' // ⚪ مربع أبيض ناصع مع علامة صح كحلية لكي يتميز بوضوح تام
                              : filteredCourses.some((c) => selectedCourseIds.includes(c.id)) // 🔍 هل جزء محدد؟
                              ? 'bg-white/20 text-white border-white' // 🔲 مربع بتحديد جزئي بخط أبيض
                              : 'bg-transparent text-transparent border-white hover:bg-white/20' // 🔲 مربع بحدود بيضاء ناصعة على الخلفية الكحلية
                          }`}
                          title="تحديد الكل" // 💡 تلميح الزر
                          aria-label="تحديد كافة المواد المعروضة" // ♿ دعم إمكانية الوصول
                        >
                          {filteredCourses.length > 0 && filteredCourses.every((c) => selectedCourseIds.includes(c.id)) ? ( // 🔍 فحص اكتمال التحديد
                            <Check className="w-3.5 h-3.5 stroke-[3.5]" /> // ✔️ علامة الصح الكحلية البارزة
                          ) : filteredCourses.some((c) => selectedCourseIds.includes(c.id)) ? ( // 🔍 فحص التحديد الجزئي
                            <span className="w-2 h-0.5 bg-white rounded-full"></span> // ➖ خط التحديد الجزئي الأبيض
                          ) : null}
                        </button>
                      </th>
                      <th className="p-3.5 text-center text-sm w-14 whitespace-nowrap text-white">ت</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">اسم المادة الدراسية</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">رمز المادة</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">المرحلة والكورس</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">نوع المادة والتوصيف</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">أستاذ النظري</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">أستاذ العملي</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">النهائي (الدور الأول)</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">حالة رصد الدور الثاني</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">توزيع درجات بولونيا</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-sm whitespace-nowrap">
                    {(() => {
                      // 🧮 حسابات شريحة الصفحة لجدول المواد الدراسية
                      const totalCoursesCount = filteredCourses.length; // 🔢 إجمالي المواد بعد الفلترة
                      const safeCoursePage = Math.max(1, Math.min(coursePage, Math.max(1, Math.ceil(totalCoursesCount / coursePageSize)))); // 🛡️ حماية رقم الصفحة
                      const courseStartIndex = (safeCoursePage - 1) * coursePageSize; // 📍 بداية شريحة المواد
                      const paginatedCourses = filteredCourses.slice(courseStartIndex, courseStartIndex + coursePageSize); // 📋 مواد الصفحة الحالية

                      return paginatedCourses.map((c, index) => {
                        const actualIndex = courseStartIndex + index; // 🔢 التسلسل العام الحقيقي للمادة
                      const isPractical = c.course_type === 'theory_and_practical' || c.has_practical;
                      const isSelected = selectedCourseIds.includes(c.id);
                      const isSupActive = c.is_supplementary_exam_enabled === true;
                      const isFinalActive = c.is_final_exam_enabled === true; // 🎯 حالة تفعيل الامتحان النهائي الدور الأول
                      
                      return (
                        <tr key={c.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'} whitespace-nowrap`}>
                          <td className="p-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id));
                                } else {
                                  setSelectedCourseIds([...selectedCourseIds, c.id]);
                                }
                              }}
                              className="w-4 h-4 rounded text-[#0F2942] focus:ring-[#0F2942] cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center font-black text-slate-950 text-sm whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs shadow-2xs">
                              {actualIndex + 1}
                            </span>
                          </td>
                          <td className="p-3 font-black text-slate-950 text-base whitespace-nowrap">{c.name}</td>
                          <td className="p-3 font-black text-slate-700 text-sm font-mono whitespace-nowrap">{c.code}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-slate-950 font-black text-sm">المرحلة {getStageNameInArabic(c.stage_number || 1)}</span>
                            <span className="text-slate-400 font-bold mx-1">•</span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black border whitespace-nowrap ${ c.semester === 2 ? 'bg-teal-50 text-teal-950 border-teal-300 shadow-2xs' : 'bg-[#0F2942]/10 text-[#0F2942] border-[#0F2942]/20 shadow-2xs' }`}>
                              الكورس {c.semester === 2 ? 'الثاني' : 'الأول'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isPractical ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap">
                                <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                                <span>نظري وعملي</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-[#0F2942]/10 text-[#0F2942] border border-[#0F2942]/20 rounded-xl text-xs font-black inline-flex items-center gap-1.5 whitespace-nowrap">
                                <BookOpen className="w-3.5 h-3.5 text-[#0F2942]" />
                                <span>نظري فقط</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {c.theory_teacher_name ? (
                              <span className="font-black text-slate-950 inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                                <Users className="w-4 h-4 text-[#0F2942]" />
                                <span>{c.theory_teacher_name}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-xs whitespace-nowrap">غير معيّن</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isPractical ? (
                              c.practical_teacher_name ? (
                                <span className="font-black text-slate-950 inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                                  <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{c.practical_teacher_name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold text-xs whitespace-nowrap">غير معيّن</span>
                              )
                            ) : (
                              <span className="text-slate-400 font-bold text-xs whitespace-nowrap">— نظري فقط</span>
                            )}
                          </td>

                          {/* 🎯 عمود مفتاح التحكم بالامتحان النهائي الدور الأول - زران: إغلاق وفتح والافتراضي مغلق ويطلب تأكيد */}
                          <td className="p-3 text-center whitespace-nowrap"> {/* 🏷️ خلية الدور الأول بالجدول */}
                            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين المتناسقة */}
                              {/* زر إغلاق الامتحان النهائي للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الإغلاق
                                  if (isFinalActive) { // 🔍 إذا كان مفتوحاً نطلب تأكيد الإغلاق
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'final', // 🎯 استهداف الدور الأول
                                      enable: false, // 🔒 طلب القفل والحجب
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  !isFinalActive // 🔍 فحص هل المادة مغلقة حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الإغلاق (الافتراضي)
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند الفتح
                                }`}
                                title={!isFinalActive ? 'الامتحان النهائي مغلق ومحجوب حالياً (الافتراضي)' : 'انقر لإغلاق وحجب الامتحان النهائي مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Lock className={`w-3.5 h-3.5 ${!isFinalActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔒 أيقونة القفل الفيكتور */}
                                <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                              </button>

                              {/* زر فتح الامتحان النهائي للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الفتح
                                  if (!isFinalActive) { // 🔍 إذا كان مغلقاً نطلب تأكيد الفتح
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'final', // 🎯 استهداف الدور الأول
                                      enable: true, // 🔓 طلب الفتح والتفعيل
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  isFinalActive // 🔍 فحص هل المادة مفتوحة حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الفتح
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند القفل
                                }`}
                                title={isFinalActive ? 'الامتحان النهائي مفتوح ومفعّل حالياً' : 'انقر لفتح وتفعيل الامتحان النهائي مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Unlock className={`w-3.5 h-3.5 ${isFinalActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔓 أيقونة الفتح الفيكتور */}
                                <span>فتح</span> {/* 🏷️ نص الفتح */}
                              </button>
                            </div>
                          </td>

                          {/* 🔄 عمود مفتاح التحكم بالدور الثاني للمادة - زران: إغلاق وفتح والافتراضي مغلق ويطلب تأكيد */}
                          <td className="p-3 text-center whitespace-nowrap"> {/* 🏷️ خلية الدور الثاني بالجدول */}
                            <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded-xl p-0.5 shadow-2xs gap-1"> {/* 📦 كبسولة الزرين المتناسقة */}
                              {/* زر إغلاق الدور الثاني للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الإغلاق
                                  if (isSupActive) { // 🔍 إذا كان مفتوحاً نطلب تأكيد الإغلاق
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'supplementary', // 🔄 استهداف الدور الثاني
                                      enable: false, // 🔒 طلب القفل والاعتماد على الدور الأول
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  !isSupActive // 🔍 فحص هل الدور الثاني مغلق حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الإغلاق (الافتراضي)
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند الفتح
                                }`}
                                title={!isSupActive ? 'فترة الدور الثاني مغلقة حالياً (الافتراضي)' : 'انقر لإغلاق الدور الثاني مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Lock className={`w-3.5 h-3.5 ${!isSupActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔒 أيقونة القفل الفيكتور */}
                                <span>إغلاق</span> {/* 🏷️ نص الإغلاق */}
                              </button>

                              {/* زر فتح الدور الثاني للمادة */}
                              <button
                                type="button" // 🛑 نوع الزر لمنع التقديم
                                onClick={() => { // ⚡ حدث النقر لطلب الفتح
                                  if (!isSupActive) { // 🔍 إذا كان مغلقاً نطلب تأكيد الفتح
                                    requestToggleRoundAction({ // 🛡️ فتح نافذة التأكيد الرسمية
                                      round: 'supplementary', // 🔄 استهداف الدور الثاني
                                      enable: true, // 🔓 طلب فتح وتفعيل الدور الثاني
                                      courseId: c.id, // 🔑 معرف المادة الحالية
                                      courseName: c.name, // 🏷️ اسم المادة للتوضيح
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${ // 🎨 التنسيقات العامة
                                  isSupActive // 🔍 فحص هل الدور الثاني مفتوح حالياً
                                    ? 'bg-[#0F2942] text-white shadow-xs' // 👑 كحلي ملكي راقي لحالة الفتح
                                    : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950' // ⚪ زر أبيض هادئ عند القفل
                                }`}
                                title={isSupActive ? 'فترة الدور الثاني مفتوحة ومفعّلة حالياً' : 'انقر لفتح وتفعيل فترة الدور الثاني مع طلب تأكيد'} // 💡 تلميح الزر
                              >
                                <Unlock className={`w-3.5 h-3.5 ${isSupActive ? 'text-cyan-300' : 'text-slate-500'}`} /> {/* 🔓 أيقونة الفتح الفيكتور */}
                                <span>فتح</span> {/* 🏷️ نص الفتح */}
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenAssessmentModal(c)}
                              className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-xs font-black transition shadow-2xs inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer border border-[#0F2942] whitespace-nowrap active:scale-95"
                              title="تخصيص أوزان وعناوين بنود التقييم الـ 7"
                            >
                              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                              <span>تخصيص الدرجات</span>
                            </button>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {/* ✏️ زر تعديل المادة الدراسية باللون الأبيض الفاخر وأيقونة كحلية واضحة */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCourseId(c.id);
                                  setCourseName(c.name);
                                  setCourseCode(c.code);
                                  setCourseCredits(c.credit_hours);
                                  setCourseStage(c.stage_number || 1);
                                  setCourseSemester((c.semester || 1) as 1 | 2);
                                  setCourseType(c.course_type || (c.has_practical ? 'theory_and_practical' : 'theory_only'));
                                  setCourseTheoryTeacherId(c.theory_teacher_id || '');
                                  setCoursePracticalTeacherId(c.practical_teacher_id || '');
                                  setCourseIsSupplementaryEnabled(c.is_supplementary_exam_enabled === true); // 🔄 تحميل حالة الدور الثاني للمادة
                                  setCourseIsFinalExamEnabled(c.is_final_exam_enabled === true); // 🎯 تحميل حالة الامتحان النهائي الدور الأول للمادة
                                  setIsCourseModalOpen(true);
                                }}
                                className="p-2 bg-white hover:bg-slate-100 text-[#0F2942] rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs hover:shadow-md active:scale-95"
                                title="تعديل المادة"
                              >
                                <Edit3 className="w-4 h-4 text-[#0F2942]" />
                              </button>
                              {/* 🗑️ زر حذف المادة الياقوتي البارز والواضح */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id)}
                                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95"
                                title="حذف المادة"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول المواد والمقررات */}
              <div className="mt-4">
                <AdminPagination
                  currentPage={Math.max(1, Math.min(coursePage, Math.max(1, Math.ceil(filteredCourses.length / coursePageSize))))}
                  totalItems={filteredCourses.length}
                  pageSize={coursePageSize}
                  onPageChange={(page) => setCoursePage(page)}
                  onPageSizeChange={(size) => {
                    setCoursePageSize(size);
                    setCoursePage(1);
                  }}
                  itemLabel="مادة"
                />
              </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4️⃣ تبويب تكليف الأساتذة بالمواد (Course Assignments CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          
          {/* 📊 شريط إحصائيات التكليفات وشريط الإجراءات */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                <ArrowRightLeft className="w-7 h-7 text-slate-950" />
                <span>تكليفات الكادر التدريسي لقسم {deptName}</span>
              </h3>
              <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                إدارة توزيع المواد الدراسية وتكليف الأساتذة وتثبيت الصلاحيات الأكاديمية
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-base font-black">
                <span className="bg-slate-100 text-slate-950 px-4 py-2 rounded-2xl border border-slate-300 shadow-2xs">
                  إجمالي التكليفات: {deptTeacherCourses.length}
                </span>
                <span className="bg-blue-100 text-blue-950 px-4 py-2 rounded-2xl border border-blue-300 shadow-2xs">
                  الأساتذة المكلفون: {new Set(deptTeacherCourses.map((tc) => tc.teacher_id)).size} أستاذ
                </span>
              </div>

              {/* ➕ زر فتح كارت إضافة تكليف جديد بتصميم كحلي ملكي */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTeacherId('');
                  setSelectedCourseId('');
                  setIsAssignmentModalOpen(true);
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shrink-0 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>تكليف أستاذ بمادة جديدة</span>
              </button>
            </div>
          </div>

          {/* 📝 كارت CRUD عائم فوق الكل لإضافة تكليف تدريسي بخلفية زجاجية كاملة */}
          <FloatingCrudModal
            isOpen={isAssignmentModalOpen}
            onClose={() => {
              setIsAssignmentModalOpen(false);
              setSelectedTeacherId('');
              setSelectedCourseId('');
            }}
            title="تكليف أستاذ بتدريس مادة معينة"
            subtitle={`ربط وتكليف أستاذ من كادر قسم ${deptName} بمقرر دراسي معتمد ومنحه صلاحيات رصد الدرجات`}
            icon={<ArrowRightLeft className="w-6 h-6" />}
            maxWidth="max-w-2xl"
            onSubmit={handleAssignTeacher}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignmentModalOpen(false);
                    setSelectedTeacherId('');
                    setSelectedCourseId('');
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-sm transition cursor-pointer border border-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-sm shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>تثبيت التكليف الأكاديمي</span>
                </button>
              </>
            }
          >
            <div className="space-y-5 text-base font-black">
              <div className="space-y-4">
                
                {/* 👨‍🏫 القائمة المنسدلة التفاعلية الفاخرة لاختيار الأستاذ المكلف */}
                <div className="space-y-2">
                  <label className="block text-slate-950 font-black text-base">اختر الأستاذ المكلف *</label>
                  <div>
                    <button
                      ref={assignTeacherButtonRef}
                      type="button"
                      onClick={handleToggleAssignTeacherDropdown}
                      className="w-full px-4 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-[#0F2942] focus:border-[#0F2942] rounded-2xl text-slate-950 font-black text-base focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <Users className="w-4 h-4 text-cyan-300" />
                        </div>
                        {selectedTeacherId ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-black text-slate-950 text-base">
                              {deptTeachers.find((t) => t.id === selectedTeacherId)?.full_name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 text-xs font-black border border-blue-200 shrink-0">
                              {deptTeacherCourses.filter((tc) => tc.teacher_id === selectedTeacherId).length} مواد مكلف بها
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-950 font-black text-base">-- انقر لاختيار الأستاذ من كادر القسم --</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-900 transition-transform duration-200 shrink-0 ${isAssignTeacherDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                    </button>

                    {/* 📋 القائمة المنسدلة الاحترافية العائمة ملتصقة بالزر مباشرة عبر Portal */}
                    {isAssignTeacherDropdownOpen && assignTeacherCoords && typeof document !== 'undefined' && createPortal(
                      <>
                        <div 
                          className="fixed inset-0 z-[9999998]" 
                          onClick={() => {
                            setIsAssignTeacherDropdownOpen(false);
                            setAssignTeacherSearchQuery('');
                          }} 
                        />
                        <div 
                          style={{
                            position: 'fixed',
                            ...(assignTeacherCoords.openUpwards
                              ? { bottom: `${assignTeacherCoords.bottom}px` }
                              : { top: `${assignTeacherCoords.top}px` }),
                            left: `${assignTeacherCoords.left}px`,
                            width: `${assignTeacherCoords.width}px`,
                            maxHeight: `${assignTeacherCoords.maxHeight}px`,
                          }}
                          className="bg-white border-2 border-slate-400 rounded-2xl shadow-2xl overflow-hidden z-[9999999] flex flex-col p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                          dir="rtl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 🔍 حقل البحث السريع داخل قائمة الأساتذة */}
                          <div className="relative shrink-0">
                            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-900" />
                            <input
                              type="text"
                              value={assignTeacherSearchQuery}
                              onChange={(e) => setAssignTeacherSearchQuery(e.target.value)}
                              placeholder="بحث سريع بالاسم..."
                              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-950 placeholder:font-black focus:border-slate-900 focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="overflow-y-auto space-y-1 flex-1 min-h-0 pr-0.5">
                            {deptTeachers
                              .filter((t) => !assignTeacherSearchQuery || t.full_name.toLowerCase().includes(assignTeacherSearchQuery.toLowerCase()))
                              .map((t) => {
                                const count = deptTeacherCourses.filter((tc) => tc.teacher_id === t.id).length;
                                const isSelected = selectedTeacherId === t.id;
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTeacherId(t.id);
                                      setIsAssignTeacherDropdownOpen(false);
                                      setAssignTeacherSearchQuery('');
                                    }}
                                    className={`w-full p-2.5 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                        : 'text-slate-950 hover:bg-slate-100 border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
                                      }`}>
                                        {t.full_name.charAt(0)}
                                      </div>
                                      <div className="truncate text-right">
                                        <div className={`text-sm sm:text-base font-black truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                          {t.full_name}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 mr-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-950 border border-blue-200'
                                      }`}>
                                        {count} مواد
                                      </span>
                                      {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            {deptTeachers.filter((t) => !assignTeacherSearchQuery || t.full_name.toLowerCase().includes(assignTeacherSearchQuery.toLowerCase())).length === 0 && (
                              <div className="text-center py-4 text-sm font-black text-slate-950">
                                لا يوجد تدريسي مطابق لبحثك
                              </div>
                            )}
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>

                {/* 📚 القائمة المنسدلة التفاعلية الفاخرة لاختيار المادة الدراسية */}
                <div className="space-y-2">
                  <label className="block text-slate-950 font-black text-base">اختر المادة الدراسية *</label>
                  <div>
                    <button
                      ref={assignCourseButtonRef}
                      type="button"
                      onClick={handleToggleAssignCourseDropdown}
                      className="w-full px-4 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-400 hover:border-[#0F2942] focus:border-[#0F2942] rounded-2xl text-slate-950 font-black text-base focus:outline-none flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <BookOpen className="w-4 h-4 text-cyan-300" />
                        </div>
                        {selectedCourseId ? (
                          (() => {
                            const selC = deptCourses.find((c) => c.id === selectedCourseId);
                            if (!selC) return <span className="text-slate-950 font-black text-base">-- انقر لاختيار المادة الدراسية --</span>;
                            return (
                              <div className="flex items-center gap-2 truncate flex-wrap text-slate-950 font-black">
                                <span className="font-black text-slate-950 text-base truncate">{selC.name}</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-950 font-mono text-xs font-black">
                                  {selC.code}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-950 text-xs font-black border border-indigo-200">
                                  المرحلة {getStageNameInArabic(selC.stage_number || 1)}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-950 text-xs font-black border border-blue-200">
                                  {selC.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-slate-950 font-black text-base">-- انقر لاختيار المادة الدراسية من القسم --</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-900 transition-transform duration-200 shrink-0 ${isAssignCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                    </button>

                    {/* 📋 القائمة المنسدلة الاحترافية العائمة ملتصقة بالزر مباشرة عبر Portal */}
                    {isAssignCourseDropdownOpen && assignCourseCoords && typeof document !== 'undefined' && createPortal(
                      <>
                        <div 
                          className="fixed inset-0 z-[9999998]" 
                          onClick={() => {
                            setIsAssignCourseDropdownOpen(false);
                            setAssignCourseSearchQuery('');
                          }} 
                        />
                        <div 
                          style={{
                            position: 'fixed',
                            ...(assignCourseCoords.openUpwards
                              ? { bottom: `${assignCourseCoords.bottom}px` }
                              : { top: `${assignCourseCoords.top}px` }),
                            left: `${assignCourseCoords.left}px`,
                            width: `${assignCourseCoords.width}px`,
                            maxHeight: `${assignCourseCoords.maxHeight}px`,
                          }}
                          className="bg-white border-2 border-slate-400 rounded-2xl shadow-2xl overflow-hidden z-[9999999] flex flex-col p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150"
                          dir="rtl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 🔍 حقل البحث السريع داخل قائمة المواد */}
                          <div className="relative shrink-0">
                            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-900" />
                            <input
                              type="text"
                              value={assignCourseSearchQuery}
                              onChange={(e) => setAssignCourseSearchQuery(e.target.value)}
                              placeholder="بحث سريع باسم أو رمز المادة..."
                              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-400 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-950 placeholder:font-black focus:border-slate-900 focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="overflow-y-auto space-y-1 flex-1 min-h-0 pr-0.5">
                            {deptCourses
                              .filter((c) => {
                                if (!assignCourseSearchQuery) return true;
                                const q = assignCourseSearchQuery.toLowerCase();
                                const stageName = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                                const semName = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';
                                return (
                                  c.name.toLowerCase().includes(q) ||
                                  (c.code && c.code.toLowerCase().includes(q)) ||
                                  stageName.includes(q) ||
                                  semName.includes(q) ||
                                  `مرحلة ${c.stage_number}`.includes(q) ||
                                  `كورس ${c.semester}`.includes(q)
                                );
                              })
                              .map((c) => {
                                const isSelected = selectedCourseId === c.id;
                                const stageArabic = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                                const semArabic = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';

                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCourseId(c.id);
                                      setIsAssignCourseDropdownOpen(false);
                                      setAssignCourseSearchQuery('');
                                    }}
                                    className={`w-full p-2.5 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer border ${
                                      isSelected
                                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                                        : 'text-slate-950 hover:bg-slate-100 border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-800'
                                      }`}>
                                        <BookOpen className="w-4 h-4" />
                                      </div>
                                      <div className="truncate text-right">
                                        <div className={`text-sm sm:text-base font-black truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                          {c.name}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
                                          }`}>
                                            {c.code}
                                          </span>
                                          <span className={`text-xs font-black ${isSelected ? 'text-slate-200' : 'text-slate-950'}`}>
                                            {stageArabic} • {semArabic}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 mr-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                                      }`}>
                                        {c.credit_hours || 3} ECTS
                                      </span>
                                      {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            {deptCourses.filter((c) => {
                              if (!assignCourseSearchQuery) return true;
                              const q = assignCourseSearchQuery.toLowerCase();
                              const stageName = `المرحلة ${getStageNameInArabic(c.stage_number || 1)}`;
                              const semName = c.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول';
                              return (
                                c.name.toLowerCase().includes(q) ||
                                (c.code && c.code.toLowerCase().includes(q)) ||
                                stageName.includes(q) ||
                                semName.includes(q) ||
                                `مرحلة ${c.stage_number}`.includes(q) ||
                                `كورس ${c.semester}`.includes(q)
                              );
                            }).length === 0 && (
                              <div className="text-center py-4 text-sm font-black text-slate-950">
                                لا توجد مادة مطابقة لبحثك
                              </div>
                            )}
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>

              </div>

              <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-slate-950 text-sm font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-700 shrink-0" />
                <span>سيتم إرسال إشعار أكاديمي فوري وتحديث حساب الأستاذ وصلاحيات الرصد تلقائياً فور تثبيت التكليف.</span>
              </div>

            </div>
          </FloatingCrudModal>

          {/* جدول التكليفات الحالية */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* 🎛️ شريط التحكم العلوي: فلاتر متعددة الأبعاد + البحث السريع */}
            <div className="space-y-3 border-b border-slate-200 pb-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                    <Layers className="w-6 h-6 text-slate-900" />
                    <span>جدول التكليفات الدراسية المعتمدة ({deptTeacherCourses.length})</span>
                  </h3>
                  <p className="text-base sm:text-lg font-black text-slate-700 mt-1">
                    قائمة الأساتذة والمقررات الدراسية المكلفين بتدريسها وتوثيق تواريخ التكليف
                  </p>
                </div>

                {/* 🔍 حقل البحث السريع في التكليفات */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-700" />
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="بحث باسم الأستاذ أو المادة..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-900 focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-bold"
                  />
                </div>
              </div>

              {/* 🏷️ شريط فلاتر متعدد الأبعاد: المرحلة + الكورس + الأستاذ */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                
                {/* 1. تصفية المرحلة الدراسية بالهوية الكحلية الملكية */}
                <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto min-w-[300px]">
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentStage('all')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentStage === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة المراحل</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.length}
                    </span>
                  </button>

                  {[
                    { num: 1, name: 'الأولى' },
                    { num: 2, name: 'الثانية' },
                    { num: 3, name: 'الثالثة' },
                    { num: 4, name: 'الرابعة' },
                  ].map((st) => {
                    const count = deptTeacherCourses.filter((tc) => {
                      const course = courses.find((c) => c.id === tc.course_id);
                      return (course?.stage_number || 1) === st.num;
                    }).length;
                    return (
                      <button
                        key={st.num}
                        type="button"
                        onClick={() => setFilterAssignmentStage(st.num)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          filterAssignmentStage === st.num
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span>المرحلة {st.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                          filterAssignmentStage === st.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. تصفية الكورس الدراسي بالأزرار الكحلية الملكية */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-slate-950 ml-1">الكورس:</span>
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester('all')}
                    className={`px-3 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>كافة الكورسات</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester(1)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 1
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>الكورس الأول</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => (tc.semester || 1) === 1).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterAssignmentSemester(2)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      filterAssignmentSemester === 2
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>الكورس الثاني</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterAssignmentSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptTeacherCourses.filter((tc) => (tc.semester || 1) === 2).length}
                    </span>
                  </button>
                </div>

                {/* 3. تصفية الأستاذ المكلف بالكحلي الملكي */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-slate-950 ml-1">الأستاذ:</span>
                  <button
                    type="button"
                    onClick={() => setFilterAssignmentTeacher('all')}
                    className={`px-3 py-1.5 rounded-xl text-sm font-black transition cursor-pointer whitespace-nowrap ${
                      filterAssignmentTeacher === 'all'
                        ? 'bg-[#0F2942] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    الكل
                  </button>
                  {deptTeachers.map((t) => {
                    const count = deptTeacherCourses.filter((tc) => tc.teacher_id === t.id).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFilterAssignmentTeacher(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                          filterAssignmentTeacher === t.id
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <span>{t.full_name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                          filterAssignmentTeacher === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* 🔘 شريط الإجراءات الجماعية العائم للتكليفات المحددة */}
            {selectedAssignmentIds.length > 0 && (
              <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-blue-700" />
                  <span className="font-black text-blue-950 text-base">
                    تم تحديد <strong className="font-mono">{selectedAssignmentIds.length}</strong> تكليفات أكاديمية
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkRemoveAssignments}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>إلغاء التكليفات المحددة ({selectedAssignmentIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAssignmentIds([])}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm transition cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            )}
            
            {filteredTeacherCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-950 font-black text-base space-y-1">
                <p>لا توجد تكليفات مطابقة للبحث أو التصفية الحالية.</p>
                <p className="text-base font-black text-slate-700 font-bold">يمكنك تكليف أستاذ بمادة جديدة أو تعديل معايير التصفية.</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-sm font-black whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#0F2942] text-white font-black text-sm whitespace-nowrap border-b border-[#0F2942]">
                      <th className="p-3.5 text-center text-sm w-12 whitespace-nowrap text-white">
                        <input
                          type="checkbox"
                          checked={filteredTeacherCourses.length > 0 && filteredTeacherCourses.every((tc) => selectedAssignmentIds.includes(tc.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const visibleIds = filteredTeacherCourses.map((tc) => tc.id);
                              setSelectedAssignmentIds(Array.from(new Set([...selectedAssignmentIds, ...visibleIds])));
                            } else {
                              const visibleIds = new Set(filteredTeacherCourses.map((tc) => tc.id));
                              setSelectedAssignmentIds(selectedAssignmentIds.filter((id) => !visibleIds.has(id)));
                            }
                          }}
                          className="w-4 h-4 rounded text-white focus:ring-white cursor-pointer accent-[#0F2942]"
                          title="تحديد الكل"
                        />
                      </th>
                      <th className="p-3.5 text-center text-sm w-14 whitespace-nowrap text-white">ت</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">اسم الأستاذ المكلف</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">المادة المكلف بها</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">الكورس</th>
                      <th className="p-3.5 text-right text-sm whitespace-nowrap text-white">تاريخ التكليف</th>
                      <th className="p-3.5 text-center text-sm whitespace-nowrap text-white">إلغاء التكليف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-sm whitespace-nowrap">
                    {(() => {
                      // 🧮 حسابات شريحة الصفحة لجدول تكليفات المواد
                      const totalAssignmentsCount = filteredTeacherCourses.length; // 🔢 إجمالي التكليفات بعد الفلترة
                      const safeAssignmentPage = Math.max(1, Math.min(assignmentPage, Math.max(1, Math.ceil(totalAssignmentsCount / assignmentPageSize)))); // 🛡️ حماية رقم الصفحة
                      const assignmentStartIndex = (safeAssignmentPage - 1) * assignmentPageSize; // 📍 بداية شريحة التكليفات
                      const paginatedTeacherCourses = filteredTeacherCourses.slice(assignmentStartIndex, assignmentStartIndex + assignmentPageSize); // 📋 تكليفات الصفحة الحالية

                      return paginatedTeacherCourses.map((tc, index) => {
                        const actualIndex = assignmentStartIndex + index; // 🔢 التسلسل العام الحقيقي للتكليف
                        const isSelected = selectedAssignmentIds.includes(tc.id); // 🔘 حالة تحديد التكليف
                        return (
                          <tr key={tc.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'} whitespace-nowrap`}>
                            <td className="p-3 text-center whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedAssignmentIds(selectedAssignmentIds.filter((id) => id !== tc.id));
                                  } else {
                                    setSelectedAssignmentIds([...selectedAssignmentIds, tc.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#0F2942] focus:ring-[#0F2942] cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center font-black text-slate-950 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs shadow-2xs">
                                {actualIndex + 1}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-950 text-base whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-[#0F2942]" />
                                <span>{tc.teacher_name}</span>
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-900 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-slate-600" />
                                <span>{tc.course_name}</span>
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-black border whitespace-nowrap ${ tc.semester === 2 ? 'bg-teal-50 text-teal-950 border-teal-300 shadow-2xs' : 'bg-[#0F2942]/10 text-[#0F2942] border-[#0F2942]/20 shadow-2xs' }`}>
                                الكورس {tc.semester === 2 ? 'الثاني' : 'الأول'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-xs whitespace-nowrap">{new Date(tc.created_at || Date.now()).toLocaleDateString('ar-IQ-u-nu-latn')}</td>
                            <td className="p-3 text-center whitespace-nowrap">
                              {/* 🚫 زر إلغاء التكليف الياقوتي البارز والواضح */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(tc.id)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition text-xs cursor-pointer border border-rose-500 shadow-2xs hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-1 mx-auto whitespace-nowrap"
                                title="إلغاء تكليف الأستاذ بهذه المادة"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-white" />
                                <span>إلغاء التكليف</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول التكليفات */}
              <div className="mt-4">
                <AdminPagination
                  currentPage={Math.max(1, Math.min(assignmentPage, Math.max(1, Math.ceil(filteredTeacherCourses.length / assignmentPageSize))))}
                  totalItems={filteredTeacherCourses.length}
                  pageSize={assignmentPageSize}
                  onPageChange={(page) => setAssignmentPage(page)}
                  onPageSizeChange={(size) => {
                    setAssignmentPageSize(size);
                    setAssignmentPage(1);
                  }}
                  itemLabel="تكليف"
                />
              </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5️⃣ تبويب مراقبة الدرجات والسعي (Grades & Performance) */}
      {/* ========================================================================= */}
      {activeTab === 'grades' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 📊 بطاقات الإحصائيات السريعة للسعيات والدرجات (3 كروت متناسقة باللون الأسود الواضح) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
                <span>إجمالي السجلات الأكاديمية</span>
                <FileSpreadsheet className="w-5 h-5 text-blue-900" />
              </div>
              <p className="text-3xl font-black text-slate-950 mt-1">{deptGrades.length}</p>
              <p className="text-sm text-slate-950 font-black mt-1.5">سجل رصد بولونيا</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
                <span>السعيات المعتمدة</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-900" />
              </div>
              <p className="text-3xl font-black text-slate-950 mt-1">
                {deptGrades.filter((g) => g.is_locked).length}
              </p>
              <p className="text-sm text-slate-950 font-black mt-1.5">سجل معتمد ونهائي</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-950 text-base font-black mb-1">
                <span>متوسط السعي (من 50)</span>
                <Award className="w-5 h-5 text-indigo-900" />
              </div>
              <p className="text-3xl font-black text-slate-950 mt-1">
                {deptGrades.length > 0
                  ? (deptGrades.reduce((acc, g) => acc + calculateCourseworkTotal(g), 0) / deptGrades.length).toFixed(1)
                  : '0.0'}
              </p>
              <p className="text-sm text-slate-950 font-black mt-1.5">درجة السعي الفصلي الموزون</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            
            {/* 🧭 رأس التبويب بدون زر توليد الدرجات */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <FileSpreadsheet className="w-7 h-7 text-[#0F2942]" />
                  <span>سجلات درجات وسعيات مسار بولونيا لطلاب قسم {deptName} ({filteredGrades.length})</span>
                </h2>
                <p className="text-sm sm:text-base font-black text-slate-950 mt-1">
                  متابعة وتدقيق درجات البنود الـ 7 للسعي الفصلي والامتحان النهائي ومطابقتها للمعايير الأكاديمية
                </p>
              </div>
            </div>

            {/* 🔍 شريط البحث وفلاتر المراحل والمواد المنظم في صفين أنيقين */}
            <div className="space-y-3 pt-2">
              {/* السطر الأول: حقل البحث + قائمة اختيار المادة الدراسية */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={gradeSearch}
                    onChange={(e) => setGradeSearch(e.target.value)}
                    placeholder="بحث باسم الطالب، المادة، أو الرقم الجامعي..."
                    className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]"
                  />
                </div>

                {/* 📘 قائمة اختيار المادة الدراسية المخصصة الفاخرة (Custom Pop-out Dropdown) */}
                <div ref={gradeCourseDropdownRef} className="relative w-full sm:w-80 shrink-0 z-[999999]">
                  <button
                    type="button"
                    onClick={() => setIsGradeCourseDropdownOpen((prev) => !prev)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-black transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer ${
                      isGradeCourseDropdownOpen
                        ? 'bg-white border-[#0F2942] ring-2 ring-[#0F2942]/20 text-[#0F2942]'
                        : filterGradeCourse !== 'all'
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className={`w-4 h-4 shrink-0 ${filterGradeCourse !== 'all' && !isGradeCourseDropdownOpen ? 'text-blue-300' : 'text-slate-700'}`} />
                      <span className="truncate font-black">
                        {filterGradeCourse !== 'all' && deptCourses.find((c) => c.id === filterGradeCourse)
                          ? `${deptCourses.find((c) => c.id === filterGradeCourse)?.name} (${deptCourses.find((c) => c.id === filterGradeCourse)?.code})`
                          : filterGradeStage === 'all'
                          ? `كافة المواد الدراسية (${gradeSelectableCourses.length})`
                          : `كافة مواد المرحلة ${getStageNameInArabic(filterGradeStage)} (${gradeSelectableCourses.length})`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isGradeCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : filterGradeCourse !== 'all' ? 'text-white' : 'text-slate-600'
                      }`}
                    />
                  </button>

                  {/* 📋 القائمة المنسدلة المنبثقة بتصميم فاخر وظلال أنيقة */}
                  {isGradeCourseDropdownOpen && (
                    <div
                      className="absolute top-full right-0 mt-2 w-full min-w-[280px] sm:min-w-[340px] max-w-[95vw] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[999999] animate-in fade-in zoom-in-95 duration-150"
                      style={{ zIndex: 999999 }}
                    >
                      <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>تصفية بحسب المادة</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-900 font-bold">
                          {gradeSelectableCourses.length} مادة
                        </span>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
                        {/* خيار كافة المواد */}
                        <button
                          type="button"
                          onClick={() => {
                            setFilterGradeCourse('all');
                            setIsGradeCourseDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            filterGradeCourse === 'all'
                              ? 'bg-[#0F2942] text-white shadow-xs font-black'
                              : 'hover:bg-slate-100 text-slate-900 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className={`w-4 h-4 ${filterGradeCourse === 'all' ? 'text-cyan-300' : 'text-slate-500'}`} />
                            <span className="text-sm sm:text-base font-black">
                              {filterGradeStage === 'all'
                                ? `كافة المواد الدراسية`
                                : `كافة مواد المرحلة ${getStageNameInArabic(filterGradeStage)}`}
                            </span>
                          </div>
                          {filterGradeCourse === 'all' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>

                        {/* المواد الدراسية المتاحة */}
                        {gradeSelectableCourses.map((c) => {
                          const isSelected = filterGradeCourse === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFilterGradeCourse(c.id);
                                setIsGradeCourseDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0F2942] text-white shadow-xs'
                                  : 'hover:bg-slate-100 text-slate-950'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className={`font-black text-base truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                  {c.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 text-sm">
                                  <span className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-950 border border-slate-300'
                                  }`}>
                                    {c.code}
                                  </span>
                                  <span className={isSelected ? 'text-white font-black text-sm' : 'text-slate-950 font-black text-sm'}>
                                    • {c.semester === 2 ? 'كورس ثاني' : 'كورس أول'}
                                  </span>
                                  <span className={isSelected ? 'text-white font-black text-sm' : 'text-slate-950 font-black text-sm'}>
                                    • المرحلة {getStageNameInArabic(c.stage_number || 1)}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* السطر الثاني: تبويبات المراحل بكامل العرض + تبويبات الكورسات المرتبة أفقياً */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* 🏷️ فلاتر المراحل الأكاديمية مع الشارات */}
                <div className="flex-1 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectGradeStage('all');
                      setSelectedGradeIds([]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterGradeStage === 'all'
                        ? 'bg-[#0F2942] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة المراحل</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterGradeStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptGrades.length}
                    </span>
                  </button>
                  {[1, 2, 3, 4].map((stageNum) => {
                    const count = deptGrades.filter((g) => {
                      const c = courses.find((crs) => crs.id === g.course_id);
                      return (c?.stage_number || 1) === stageNum;
                    }).length;
                    const isSel = filterGradeStage === stageNum;
                    return (
                      <button
                        key={stageNum}
                        type="button"
                        onClick={() => {
                          handleSelectGradeStage(stageNum);
                          setSelectedGradeIds([]);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isSel
                            ? 'bg-[#0F2942] text-white shadow-2xs'
                            : 'text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span>المرحلة {getStageNameInArabic(stageNum)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                          isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 🗓️ فلاتر الكورسات الدراسية لسجل الدرجات مرتبة أفقياً كشريط تبويبات فاخر */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 shrink-0 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGradeSemester('all');
                      setSelectedGradeIds([]);
                    }}
                    className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterGradeSemester === 'all'
                        ? 'bg-[#0F2942] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>كافة الكورسات</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterGradeSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptGrades.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGradeSemester(1);
                      setSelectedGradeIds([]);
                    }}
                    className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterGradeSemester === 1
                        ? 'bg-[#0F2942] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>الكورس الأول</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterGradeSemester === 1 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptGrades.filter((g) => {
                        const c = courses.find((crs) => crs.id === g.course_id);
                        return (g.semester || c?.semester || 1) === 1;
                      }).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGradeSemester(2);
                      setSelectedGradeIds([]);
                    }}
                    className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      filterGradeSemester === 2
                        ? 'bg-[#0F2942] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>الكورس الثاني</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      filterGradeSemester === 2 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {deptGrades.filter((g) => {
                        const c = courses.find((crs) => crs.id === g.course_id);
                        return (g.semester || c?.semester || 1) === 2;
                      }).length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 🔘 شريط الإجراءات الجماعية العائم لسجلات الدرجات المحددة */}
            {selectedGradeIds.length > 0 && (
              <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-blue-700" />
                  <span className="font-black text-blue-950 text-base">
                    تم تحديد <strong className="font-mono">{selectedGradeIds.length}</strong> سجلات درجات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkDeleteGrades}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف سجلات الدرجات المحددة ({selectedGradeIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGradeIds([])}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm transition cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            )}

            {/* 📋 جدول الدرجات والسعيات المتقدم */}
            {filteredGrades.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                <p className="text-lg font-black text-slate-950">
                  لا توجد درجات مسجلة مطابقة لمعايير البحث الحالية.
                </p>
                <p className="text-base font-bold text-slate-600">
                  يرجى تعديل معايير البحث أو اختيار مادة أو مرحلة أخرى.
                </p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-base font-black">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-950 font-black text-base">
                      {/* 🔘 مربع اختيار تحديد الكل */}
                      <th className="p-3 text-center w-12">
                        <input
                          type="checkbox"
                          checked={filteredGrades.length > 0 && filteredGrades.every((g) => selectedGradeIds.includes(g.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGradeIds(filteredGrades.map((g) => g.id));
                            } else {
                              setSelectedGradeIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="تحديد الكل"
                        />
                      </th>
                      <th className="p-3 text-center text-base w-12">ت</th>
                      <th className="p-3 text-base min-w-[170px]">اسم الطالب</th>
                      <th className="p-3 text-base min-w-[200px]">المادة</th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الأول: ${currentActiveScheme.quiz1?.title_ar || 'كويز (1)'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.quiz1?.title_ar || 'كويز (1)'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.quiz1?.max_score ?? 5}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الثاني: ${currentActiveScheme.quiz2?.title_ar || 'كويز (2)'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.quiz2?.title_ar || 'كويز (2)'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.quiz2?.max_score ?? 5}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الثالث: ${currentActiveScheme.assignment1?.title_ar || 'واجب (1)'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.assignment1?.title_ar || 'واجب (1)'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.assignment1?.max_score ?? 5}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`البند الرابع: ${currentActiveScheme.assignment2?.title_ar || 'واجب (2)'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.assignment2?.title_ar || 'واجب (2)'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.assignment2?.max_score ?? 5}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`بند التقرير والنشاط: ${currentActiveScheme.report?.title_ar || 'تقرير وبحث'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.report?.title_ar || 'تقرير'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.report?.max_score ?? 10}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`امتحان منتصف الفصل: ${currentActiveScheme.midterm?.title_ar || 'امتحان نصفي'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.midterm?.title_ar || 'نصفي'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.midterm?.max_score ?? 10}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-sm font-black text-slate-950 whitespace-nowrap" title={`التقييم العملي والمختبري: ${currentActiveScheme.practical?.title_ar || 'مختبر وعملي'}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{currentActiveScheme.practical?.title_ar || 'عملي'}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">
                            {currentActiveScheme.practical?.max_score ?? 10}
                          </span>
                        </div>
                      </th>
                      <th className="p-3 text-center bg-slate-200 text-base text-slate-950 font-black whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>السعي</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-xs font-black shadow-2xs">50</span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-base whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>النهائي</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-xs font-black shadow-2xs">50</span>
                        </div>
                      </th>
                      <th className="p-3 text-center bg-blue-50 text-blue-950 text-base font-black whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>المجموع</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#0F2942] text-white text-xs font-black shadow-2xs">100</span>
                        </div>
                      </th>
                      <th className="p-3 text-center text-base whitespace-nowrap">التقدير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                    {(() => {
                      // 🧮 حسابات شريحة الصفحة لجدول الدرجات والسعي
                      const totalGradesCount = filteredGrades.length; // 🔢 إجمالي سجلات الدرجات بعد الفلترة
                      const safeGradePage = Math.max(1, Math.min(gradePage, Math.max(1, Math.ceil(totalGradesCount / gradePageSize)))); // 🛡️ حماية رقم الصفحة
                      const gradeStartIndex = (safeGradePage - 1) * gradePageSize; // 📍 بداية شريحة الدرجات
                      const paginatedGrades = filteredGrades.slice(gradeStartIndex, gradeStartIndex + gradePageSize); // 📋 سجلات درجات الصفحة الحالية

                      return paginatedGrades.map((g, index) => {
                        const actualIndex = gradeStartIndex + index; // 🔢 التسلسل العام الحقيقي للدرجة
                      const course = courses.find((c) => c.id === g.course_id);
                      const isSupActive = course?.is_supplementary_exam_enabled === true;
                      const courseworkTotal = calculateCourseworkTotal(g);
                      const finalTotal = calculateFinalTotal(g, isSupActive);
                      const letterGrade = getLetterGrade(finalTotal);
                      const rowScheme = getCourseAssessmentScheme(course);
                      const isSelected = selectedGradeIds.includes(g.id);

                      return (
                        <tr key={g.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedGradeIds(selectedGradeIds.filter((id) => id !== g.id));
                                } else {
                                  setSelectedGradeIds([...selectedGradeIds, g.id]);
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center font-black text-slate-950 text-base whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 font-black text-sm shadow-2xs">
                              {actualIndex + 1}
                            </span>
                          </td>
                          <td className="p-3 font-black text-slate-950 text-base whitespace-nowrap">
                            <div className="font-black text-slate-950 text-base">{g.student_name}</div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-400 rounded-lg text-slate-950 font-mono font-black text-xs inline-block shadow-2xs">
                                {g.university_number}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-900 text-base">
                            <div className="font-black text-slate-950 text-base">{g.course_name}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-sm font-black text-slate-950">
                                المرحلة {getStageNameInArabic(course?.stage_number || 1)}
                              </span>
                              <span className="text-slate-950 font-black mx-0.5">•</span>
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border shadow-2xs ${ g.semester === 2 ? 'bg-teal-100 text-teal-950 border-teal-400' : 'bg-sky-100 text-sky-950 border-sky-400' }`}>
                                كورس {g.semester === 2 ? 'ثاني' : 'أول'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.quiz1?.title_ar || 'كويز (1)'} (من ${rowScheme.quiz1?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.quiz1}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.quiz2?.title_ar || 'كويز (2)'} (من ${rowScheme.quiz2?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.quiz2}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.assignment1?.title_ar || 'واجب (1)'} (من ${rowScheme.assignment1?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.assignment1}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.assignment2?.title_ar || 'واجب (2)'} (من ${rowScheme.assignment2?.max_score ?? 5})`}>
                            <span className="font-black text-slate-950 text-base">{g.assignment2}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.report?.title_ar || 'تقرير'} (من ${rowScheme.report?.max_score ?? 10})`}>
                            <span className="font-black text-slate-950 text-base">{g.report}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.midterm?.title_ar || 'نصفي'} (من ${rowScheme.midterm?.max_score ?? 10})`}>
                            <span className="font-black text-slate-950 text-base">{g.midterm}</span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap" title={`${rowScheme.practical?.title_ar || 'عملي'} (من ${rowScheme.practical?.max_score ?? 10})`}>
                            <span className={rowScheme.practical?.max_score === 0 ? 'text-slate-400 font-bold' : 'font-black text-slate-950 text-base'}>
                              {rowScheme.practical?.max_score === 0 ? '—' : (g.practical || 0)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-slate-950 bg-slate-100/80 text-base whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-300 shadow-2xs inline-block font-black whitespace-nowrap">
                              {courseworkTotal} <span className="text-xs text-slate-500 font-bold">/ 50</span>
                            </span>
                          </td>
                          <td className="p-3 text-center text-base font-black whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 shadow-2xs inline-block font-black whitespace-nowrap">
                              {g.final_exam !== undefined ? g.final_exam : '—'} <span className="text-xs text-slate-500 font-bold">/ 50</span>
                            </span>
                          </td>
                          <td className="p-3 text-center font-black text-blue-950 bg-blue-50/70 text-base whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-blue-100/80 rounded-lg border border-blue-200 shadow-2xs inline-block font-black whitespace-nowrap">
                              {finalTotal} <span className="text-xs text-blue-600 font-bold">/ 100</span>
                            </span>
                          </td>
                          <td className="p-3 text-center text-base whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs ${
                              finalTotal >= 90
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : finalTotal >= 80
                                ? 'bg-teal-100 text-teal-950 border-teal-300'
                                : finalTotal >= 70
                                ? 'bg-blue-100 text-blue-950 border-blue-300'
                                : finalTotal >= 60
                                ? 'bg-sky-100 text-sky-950 border-sky-300'
                                : finalTotal >= 50
                                ? 'bg-slate-100 text-slate-950 border-slate-300'
                                : 'bg-rose-100 text-rose-950 border-rose-300'
                            }`}>
                              {letterGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  </tbody>
                </table>
              </div>

              {/* 📄 شريط نظام الصفحات الموحد والفاخر لجدول الدرجات والسعي */}
              <div className="mt-4">
                <AdminPagination
                  currentPage={Math.max(1, Math.min(gradePage, Math.max(1, Math.ceil(filteredGrades.length / gradePageSize))))}
                  totalItems={filteredGrades.length}
                  pageSize={gradePageSize}
                  onPageChange={(page) => setGradePage(page)}
                  onPageSizeChange={(size) => {
                    setGradePageSize(size);
                    setGradePage(1);
                  }}
                  itemLabel="سجل/طالب"
                />
              </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6️⃣ تبويب إدارة الجدول الأسبوعي والمحاضرات والعطل (Schedule Management CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 🧭 الرأس والشريط العلوي لمحدد المرحلة والكورس والمعاينة الحية */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-4 py-1.5 bg-[#0F2942] text-white font-black text-sm sm:text-base rounded-xl shadow-xs flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-300" />
                  <span>نظام إدارة الجداول الأسبوعية والمخطط الزمني</span>
                </span>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-950 font-black text-sm sm:text-base rounded-xl border border-slate-300">
                  قسم {deptName}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                إدارة مواقيت المحاضرات وأيام الدوام والعطل الأسبوعية
              </h2>
              <p className="text-base sm:text-lg font-black text-slate-800 mt-1 leading-relaxed">
                تخصيص كامل لأيام الدوام والعطل لكل مرحلة، وجدولة المحاضرات والقاعات وتعيين الأساتذة مع ربط مباشر مع جداول الطلاب
              </p>
            </div>

            {/* أزرار إضافة محاضرة واستيراد Excel ونموذج وتوجيهات والمعاينة الحية */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingLectureId(null);
                  setLecRoom('');
                  setLecNotes('');
                  setIsLectureModalOpen(true);
                }}
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0"
                title="إضافة محاضرة دراسية جديدة إلى الجدول الأسبوعي"
              >
                <Plus className="w-5 h-5 text-cyan-300" />
                <span>إضافة محاضرة جديدة</span>
              </button>

              {/* 📥 زر تنزيل نموذج Excel لجدول القسم بتصميم كحلي فاخر مطابق لزر إضافة محاضرة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleDownloadScheduleTemplate} // ⚡ تشغيل دالة تنزيل قالب جدول المحاضرات
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تنزيل نموذج Excel المعتمد لمحاضرات الجدول الأسبوعي للقسم" // 💡 نص التلميح
              >
                <Download className="w-5 h-5 text-emerald-300" /> {/* 📥 أيقونة التنزيل باللون الزمردي الزاهي */}
                <span>نموذج Excel</span> {/* 📝 نص الزر */}
              </button>

              {/* ℹ️ زر تعليمات الاستيراد للجدول بتصميم كحلي فاخر مطابق لزر إضافة محاضرة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={() => setShowScheduleExcelInstructions(true)} // ⚡ فتح نافذة التعليمات للجدول
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تعليمات وضوابط استيراد محاضرات الجدول الأسبوعي" // 💡 نص التلميح
              >
                <Info className="w-5 h-5 text-sky-300" /> {/* ℹ️ أيقونة المعلومات بلون سماوي جميل */}
                <span>التعليمات</span> {/* 📝 نص الزر */}
              </button>

              {/* 📤 زر استيراد ملف Excel للجدول بتصميم كحلي فاخر مطابق لزر إضافة محاضرة */}
              <label className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl transition flex items-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg active:scale-95 border border-[#0F2942] shrink-0">
                <Upload className="w-5 h-5 text-cyan-300" /> {/* 📤 أيقونة الرفع بلون سماوي زاهي */}
                <span>{isImportingScheduleExcel ? 'جاري الاستيراد...' : 'استيراد Excel'}</span> {/* 📝 نص الزر */}
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleScheduleExcelUpload}
                  disabled={isImportingScheduleExcel}
                  className="hidden"
                />
              </label>

              {/* 📊 زر تصدير جدول المحاضرات إلى Excel بتصميم كحلي فاخر مطابق لزر إضافة محاضرة */}
              <button
                type="button" // 🔘 نوع الزر لمنع أي إرسال غير مقصود
                onClick={handleExportScheduleToExcel} // ⚡ تصدير الجدول لملف إكسل معتمد
                className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#0F2942] shrink-0" // 🎨 تصميم كحلي ملكي موحد
                title="تصدير جدول محاضرات القسم الحالي بالكامل إلى ملف Excel" // 💡 نص التلميح
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" /> {/* 📊 أيقونة الإكسل بلون زمردي زاهي */}
                <span>تصدير Excel</span> {/* 📝 نص الزر */}
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewScheduleModalOpen(true)}
                className="px-5 py-3 bg-indigo-950 hover:bg-indigo-900 text-white rounded-2xl font-black text-base flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-indigo-800 shrink-0"
                title="فتح معاينة تفاعلية حية لجدول الطالب"
              >
                <Eye className="w-5 h-5 text-cyan-300" />
                <span>المعاينة الحية لجدول الطالب</span>
              </button>
            </div>
          </div>

          {/* 🎛️ شريط تحديد المرحلة والكورس الدراسي والفترة بتصميم هندسي راقٍ بسطر واحد */}
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
                  const stgCount = scheduleLectures.filter(
                    (l) => l.department_id === currentDeptId && l.stage_number === stg.num
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
              const sem1Count = scheduleLectures.filter(
                (l) =>
                  l.department_id === currentDeptId &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === 1
              ).length;
              const sem2Count = scheduleLectures.filter(
                (l) =>
                  l.department_id === currentDeptId &&
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
              const morningCount = scheduleLectures.filter(
                (l) =>
                  l.department_id === currentDeptId &&
                  l.stage_number === selectedScheduleStage &&
                  (l.semester || 1) === selectedScheduleSemester &&
                  (l.study_type || 'morning') === 'morning'
              ).length;
              const eveningCount = scheduleLectures.filter(
                (l) =>
                  l.department_id === currentDeptId &&
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
          {/* 🏖️ 1. كارت إدارة أيام الدوام والعطل الأسبوعية الرسمية */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
              <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl shadow-2xs">
                <Sun className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <span>تحديد أيام الدوام والعطل الأسبوعية للمرحلة {getStageNameInArabic(selectedScheduleStage)} (الكورس {selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'})</span>
                </h3>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-1">
                  اضغط على أي يوم لطلب تعديل حالته بين دوام رسمي أو عطلة رسمية مع نافذة تأكيد وموافقة مسبقة
                </p>
              </div>
            </div>

            {/* بطاقات الأيام الـ 7 التفاعلية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {DAYS_OF_WEEK_LIST.map((d) => {
                const isOff = currentScheduleConfig.off_days.includes(d.key);
                const dayLecCount = scheduleLectures.filter(
                  (l) =>
                    l.department_id === currentDeptId &&
                    l.stage_number === selectedScheduleStage &&
                    l.semester === selectedScheduleSemester &&
                    (l.study_type || 'morning') === selectedScheduleStudyType &&
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

          {/* ========================================================================= */}
          {/* 📝 كارت CRUD عائم فوق الكل لإضافة / تعديل واستعراض المحاضرات بتصميم بانورامي ثابت (z-999999) */}
          {/* ========================================================================= */}
          <FloatingCrudModal
            isOpen={isLectureModalOpen}
onClose={() => {
              setIsLectureModalOpen(false); // 🔴 إغلاق المودال
              setEditingLectureId(null); // 🔄 تصفير التعديل
              setLecRoom(''); // 🧹 تنظيف القاعة
              setLecNotes(''); // 🧹 تنظيف الملاحظات
              setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح التفاعلية
            }}
            title={editingLectureId ? 'تعديل بيانات المحاضرة المجدولة' : 'إضافة محاضرة دراسية جديدة إلى الجدول الأسبوعي'}
            subtitle={
              editingLectureId
                ? `تعديل تفاصيل المحاضرة للمرحلة ${getStageNameInArabic(selectedScheduleStage)} (الكورس ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'})`
                : `حدد اليوم والمادة والقاعة والتوقيت والأستاذ للمرحلة ${getStageNameInArabic(selectedScheduleStage)} (الكورس ${selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'})`
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* زر إلغاء التعديل والعودة لوضع الإدراج */}
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
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-black text-sm transition cursor-pointer shadow-2xs"
                    >
                      إلغاء التعديل
                    </button>
                  )}

                  {/* زر إغلاق النافذة عند الانتهاء */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLectureModalOpen(false); // 🔴 إغلاق
                      setEditingLectureId(null); // 🔄 تصفير
                      setLecRoom(''); // 🧹 مسح
                      setLecNotes(''); // 🧹 مسح
                      setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح
                    }}
                    className="px-4 sm:px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-xl font-black text-sm sm:text-base transition cursor-pointer border border-slate-300 shadow-2xs"
                  >
                    إغلاق النافذة
                  </button>

                  {/* زر إدراج/تحديث وإغلاق (لمن يريد الحفظ السريع والخروج من الكارد بضغطة واحدة) */}
                  <button
                    type="submit"
                    onClick={() => setCloseModalAfterSave(true)}
                    className="px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-sm sm:text-base shadow-xs transition flex items-center gap-2 cursor-pointer border border-slate-700 active:scale-95"
                    title={editingLectureId ? 'تحديث المحاضرة وإغلاق النافذة فورياً' : 'إدراج المحاضرة وإغلاق النافذة فورياً'}
                  >
                    <Save className="w-4 h-4 text-emerald-300" />
                    <span>{editingLectureId ? 'تحديث وإغلاق' : 'إدراج وإغلاق'}</span>
                  </button>

                  {/* الزر الرئيسي الاحترافي: إدراج ومتابعة الإضافة بدون إغلاق الكارد */}
                  <button
                    type="submit"
                    onClick={() => setCloseModalAfterSave(false)}
                    className="px-5 sm:px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm sm:text-base shadow-md transition flex items-center gap-2 cursor-pointer border border-[#0F2942] active:scale-95 ring-2 ring-blue-500/20"
                    title={editingLectureId ? 'حفظ التعديلات والبقاء في النافذة' : 'إدراج المحاضرة في الجدول والاستمرار بإدخال المحاضرات التالية'}
                  >
                    {editingLectureId ? <Check className="w-4 h-4 text-cyan-300" /> : <Plus className="w-4 h-4 text-cyan-300" />}
                    <span>{editingLectureId ? 'حفظ وتحديث المحاضرة ✨' : 'إدراج ومتابعة الإضافة ➕'}</span>
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* ✨ رسالة النجاح التفاعلية الداخلية عند الإدراج المتتالي بدون مغادرة الكارد */}
              {lecModalSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 font-black shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-sm sm:text-base font-black">{lecModalSuccessMsg}</span>
                      <span className="block text-xs text-emerald-800 font-bold mt-0.5">
                        تم تحديث قائمة محاضرات اليوم باليسار تلقائياً وتقديم التوقيت للمحاضرة التالية
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLecModalSuccessMsg('')}
                    className="text-emerald-800 hover:text-emerald-950 p-1.5 rounded-xl hover:bg-emerald-100 transition cursor-pointer shrink-0"
                    title="إغلاق الإشعار"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              
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
                        onClick={() => setSelectedScheduleStage(stg.num)}
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
                      onClick={() => setSelectedScheduleSemester(1)}
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
                      onClick={() => setSelectedScheduleSemester(2)}
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
                      onClick={() => setLecStudyType('morning')}
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
                      onClick={() => setLecStudyType('evening')}
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
                <div className="lg:col-span-7 space-y-3.5 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs">
                  
                  {/* 1. اليوم الأسبوعي + طبيعة المحاضرة */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* اليوم */}
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
                                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                <span className="font-black text-slate-950">{DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay}</span>
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                                  currentScheduleConfig.off_days.includes(lecDay as DayOfWeek)
                                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
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
                              className="fixed inset-0 z-[999998]" 
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

                    {/* طبيعة المحاضرة */}
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
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {lecType === 'practical' ? 'مختبر وتطبيق عملي' : 'محاضرة نظرية'}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecTypeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                        </button>

                        {isLecTypeDropdownOpen && lecTypeCoords && typeof document !== 'undefined' && createPortal(
                          <>
                            <div 
                              className="fixed inset-0 z-[999998]" 
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
                  </div>

                  {/* 2. المادة الدراسية والمقرر الأكاديمي */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0F2942]" />
                      <span>المادة والمقرر الأكاديمي <span className="text-red-600">*</span></span>
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
                                ) : courses.filter((c) => (c.department_id === currentDeptId || c.department_name === deptName) && c.stage_number === selectedScheduleStage && (c.semester || 1) === selectedScheduleSemester).length === 0 ? (
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
                                  className="fixed inset-0 z-[999998]" 
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
                                    maxHeight: `${lecCourseCoords.maxHeight || 260}px`,
                                  }}
                                  className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                  dir="rtl"
                                >
                                  {(() => {
                                    // 🔍 تصفية المواد المتاحة لجدول المرحلة والكورس المحددين
                                    const availableScheduleCourses = courses.filter(
                                      (c) =>
                                        (c.department_id === currentDeptId || c.department_name === deptName) &&
                                        c.stage_number === selectedScheduleStage &&
                                        (c.semester || 1) === selectedScheduleSemester
                                    );

                                    // 📭 تنبيه عند عدم وجود مواد للمرحلة والكورس المحددين
                                    if (availableScheduleCourses.length === 0) {
                                      return (
                                        <div className="p-4 text-center text-rose-600 font-black text-sm bg-rose-50/80 rounded-xl border border-rose-200">
                                          لا توجد مادة مضافة لهذه المرحلة والكورس
                                        </div>
                                      );
                                    }

                                    return availableScheduleCourses.map((c) => {
                                      const isSel = lecCourseId === c.id;
                                      return (
                                        <button
                                          key={c.id}
                                          type="button"
                                          onClick={() => {
                                            setLecCourseId(c.id);
                                            // 🔬 فحص طبيعة المادة: هل هي نظري فقط أم بها جانب عملي؟
                                            const isPracticalCourse = c.course_type === 'theory_and_practical' || Boolean(c.has_practical);
                                            if (!isPracticalCourse) {
                                              // 📘 المادة فقط نظري: الطبيعي والإلزامي لها نظري فقط
                                              setLecType('theory'); // 🎯 تثبيت طبيعة المحاضرة كنظري
                                              setLecColor('blue'); // 🎨 اللون الأزرق المعتمد للنظري
                                              if (lecStartTime) {
                                                const autoEnd = calculateEndTimeFromStart(lecStartTime, 'theory'); // 🧮 حساب نهاية المحاضرة النظرية تلقائياً
                                                if (autoEnd) setLecEndTime(autoEnd); // 🏁 ضبط وقت النهاية
                                              }
                                              if (c.theory_teacher_id) {
                                                setLecTeacherId(c.theory_teacher_id); // 👤 ربط أستاذ النظري المكلف
                                              } else {
                                                setLecTeacherId(''); // 🧹 تصفير الأستاذ إذا لم يكن مكلفاً
                                              }
                                            } else {
                                              // 🔬 المادة بها نظري وعملي (يظهر الخياران): الطبيعي الأولي هو نظري إلا إذا كان محدد عملي
                                              if (lecType === 'practical') {
                                                setLecType('practical'); // 🔬 إبقاء خيار العملي المختار
                                                setLecColor('emerald'); // 🎨 لون العملي الزمردي
                                                if (lecStartTime) {
                                                  const autoEnd = calculateEndTimeFromStart(lecStartTime, 'practical'); // 🧮 حساب نهاية المختبر العملي (ساعة واحدة)
                                                  if (autoEnd) setLecEndTime(autoEnd); // 🏁 ضبط وقت النهاية
                                                }
                                                if (c.practical_teacher_id) {
                                                  setLecTeacherId(c.practical_teacher_id); // 👨‍🏫 ربط أستاذ العملي المكلف
                                                } else if (c.theory_teacher_id) {
                                                  setLecTeacherId(c.theory_teacher_id); // 👤 بديل أستاذ النظري
                                                }
                                              } else {
                                                setLecType('theory'); // 🎯 الوضع الطبيعي هو نظري
                                                setLecColor('blue'); // 🎨 لون النظري الأزرق
                                                if (lecStartTime) {
                                                  const autoEnd = calculateEndTimeFromStart(lecStartTime, 'theory'); // 🧮 حساب نهاية المحاضرة النظرية (ساعة ونصف)
                                                  if (autoEnd) setLecEndTime(autoEnd); // 🏁 ضبط وقت النهاية
                                                }
                                                if (c.theory_teacher_id) {
                                                  setLecTeacherId(c.theory_teacher_id); // 👤 ربط أستاذ النظري المكلف
                                                } else if (c.practical_teacher_id) {
                                                  setLecTeacherId(c.practical_teacher_id); // 🔬 بديل أستاذ العملي
                                                }
                                              }
                                            }
                                            setIsLecCourseDropdownOpen(false);
                                          }}
                                          className={`w-full p-3 rounded-xl text-right font-black transition flex items-center justify-between cursor-pointer ${
                                            isSel
                                              ? 'bg-[#0F2942] text-white shadow-xs'
                                              : 'text-slate-950 hover:bg-slate-100'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isSel ? 'bg-white/20 text-cyan-300' : 'bg-blue-50 text-blue-800'}`}>
                                              {c.course_type === 'theory_and_practical' ? (
                                                <FlaskConical className="w-5 h-5" />
                                              ) : (
                                                <BookOpen className="w-5 h-5" />
                                              )}
                                            </div>
                                            <div>
                                              <div className="text-base font-black flex items-center gap-2">
                                                <span>{c.name}</span>
                                                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-900'}`}>
                                                  {c.code}
                                                </span>
                                              </div>
                                              <div className={`text-xs font-bold mt-0.5 ${isSel ? 'text-slate-200' : 'text-slate-600'}`}>
                                                {c.course_type === 'theory_and_practical' ? 'يشمل محاضرات قاعة وتطبيقات مختبرية' : 'محاضرات نظرية فقط'}
                                              </div>
                                            </div>
                                          </div>
                                          {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3]" />}
                                        </button>
                                      );
                                    });
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
                                    className="fixed inset-0 z-[999998]" 
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
                                      maxHeight: `${lecTeacherCoords.maxHeight || 220}px`,
                                    }}
                                    className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl overflow-hidden z-[999999] overflow-y-auto p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                    dir="rtl"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLecTeacherId('');
                                        setIsLecTeacherDropdownOpen(false);
                                      }}
                                      className={`w-full p-3 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer ${
                                        !lecTeacherId
                                          ? 'bg-[#0F2942] text-white shadow-xs'
                                          : 'text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <UserMinus className="w-5 h-5" />
                                        <span>-- بدون تحديد أستاذ --</span>
                                      </div>
                                      {!lecTeacherId && <Check className="w-5 h-5 text-cyan-300 stroke-[3]" />}
                                    </button>

                                    {deptTeachers.map((t) => {
                                      const isSel = lecTeacherId === t.id;
                                      return (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => {
                                            setLecTeacherId(t.id);
                                            setIsLecTeacherDropdownOpen(false);
                                          }}
                                          className={`w-full p-3 rounded-xl text-right font-black text-base transition flex items-center justify-between cursor-pointer ${
                                            isSel
                                              ? 'bg-[#0F2942] text-white shadow-xs'
                                              : 'text-slate-950 hover:bg-slate-100'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <UserCheck className={`w-5 h-5 ${isSel ? 'text-cyan-300' : 'text-blue-700'}`} />
                                            <span>{t.full_name}</span>
                                          </div>
                                          {isSel && <Check className="w-5 h-5 text-cyan-300 stroke-[3]" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>,
                                document.body
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* القاعة */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-black text-slate-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <DoorClosed className="w-4 h-4 text-[#0F2942]" />
                          <span>القاعة / المختبر <span className="text-red-600">*</span></span>
                        </span>
                        <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                          {availableRoomsForSlot.length} شاغرة
                        </span>
                      </label>
                      <input
                        type="text"
                        value={lecRoom}
                        onChange={(e) => setLecRoom(e.target.value)}
                        placeholder="مثال: مدرج الخوارزمي، قاعة 204..."
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
                                  <div className="p-1.5 bg-blue-100 text-blue-900 rounded-lg shrink-0">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-base font-black text-slate-950">{parsed.hourDisplay}:{parsed.minute}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                                      parsed.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                                    }`}>
                                      {parsed.periodArabic}
                                    </span>
                                  </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecStartTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                              </button>

                              {isLecStartTimeDropdownOpen && lecStartTimeCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  <div 
                                    className="fixed inset-0 z-[999998]" 
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
                                  <div className="p-1.5 bg-blue-100 text-blue-900 rounded-lg shrink-0">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-base font-black text-slate-950">{parsed.hourDisplay}:{parsed.minute}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                                      parsed.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                                    }`}>
                                      {parsed.periodArabic}
                                    </span>
                                  </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecEndTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                              </button>

                              {isLecEndTimeDropdownOpen && lecEndTimeCoords && typeof document !== 'undefined' && createPortal(
                                <>
                                  <div 
                                    className="fixed inset-0 z-[999998]" 
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

                  {/* 📋 2. قائمة المحاضرات المجدولة لهذا اليوم */}
                  <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-black flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#0F2942]" />
                        <span>محاضرات ({lecDay ? (DAYS_OF_WEEK_LIST.find((d) => d.key === lecDay)?.label_ar || lecDay) : 'غير محدد'}) ({lecStudyType === 'evening' ? 'مسائي' : 'صباحي'}):</span>
                      </span>
                      <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                        {lecDay ? scheduleLectures.filter((l) => l.department_id === currentDeptId && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length : 0} محاضرة
                      </span>
                    </div>

                    {!lecDay ? (
                      <div className="text-xs font-black text-black bg-white p-4 rounded-xl border border-slate-300 text-center">
                        حدد اليوم الأسبوعي من القائمة لاستعراض كافة المحاضرات المجدولة فيه.
                      </div>
                    ) : scheduleLectures.filter((l) => l.department_id === currentDeptId && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay).length === 0 ? (
                      <div className="text-xs font-black text-black bg-white p-4 rounded-xl border border-slate-300 text-center">
                        لا توجد محاضرات مجدولة لهذا اليوم حتى الآن.
                      </div>
                    ) : (
                      <div ref={lecListContainerRef} className="space-y-2 max-h-56 overflow-y-auto p-1">
                        {scheduleLectures
                          .filter((l) => l.department_id === currentDeptId && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === lecStudyType && l.day === lecDay)
                          // 🕒 ترتيب المحاضرات زمنياً من الصباح للمساء بشكل طبيعي واحترافي
                          .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time))
                          .map((lecItem) => {
                            const isNewlyAdded = recentlyAddedLectureId === lecItem.id; // 🌟 فحص هل المحاضرة مضافة أو محدثة للتو
                            return (
                            <div
                              key={lecItem.id}
                              id={`lec-card-${lecItem.id}`} // 🆔 معرف الكارت لعمل سكرول فوري إليه
                              className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                                editingLectureId === lecItem.id
                                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                  : isNewlyAdded
                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                                  : 'bg-white border-slate-300 shadow-2xs hover:border-slate-400'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center justify-center ${
                                    (lecItem.study_type || 'morning') === 'evening'
                                      ? 'bg-indigo-100 text-black border-indigo-300'
                                      : 'bg-sky-100 text-black border-sky-300'
                                  }`}>
                                    {(lecItem.study_type || 'morning') === 'evening' ? (
                                      <Moon className="w-3.5 h-3.5 text-indigo-900 shrink-0 ml-1" />
                                    ) : (
                                      <Sun className="w-3.5 h-3.5 text-sky-800 shrink-0 ml-1" />
                                    )}
                                    <span>{(lecItem.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                  </span>

                                  {/* 🏷️ شارة طبيعة المحاضرة بتصميم احترافي يوضح كونها نظري أو مختبر عملي */}
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center justify-center gap-1 ${
                                    lecItem.type === 'practical'
                                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300' // 🔬 لون الزمرد الخاص بالمختبر والعملي
                                      : 'bg-blue-100 text-blue-950 border-blue-300' // 📘 اللون الأزرق الخاص بالمحاضرة النظرية
                                  }`}>
                                    {lecItem.type === 'practical' ? (
                                      <>
                                        <FlaskConical className="w-3.5 h-3.5 text-emerald-800 shrink-0" /> {/* 🧪 أيقونة المختبر */}
                                        <span>مختبر عملي</span> {/* 🏷️ نص المختبر العملي */}
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="w-3.5 h-3.5 text-blue-800 shrink-0" /> {/* 📖 أيقونة النظري */}
                                        <span>محاضرة نظرية</span> {/* 🏷️ نص المحاضرة النظرية */}
                                      </>
                                    )}
                                  </span>

                                  <span className="font-black text-black text-base break-words leading-snug">{lecItem.course_name}</span>
                                  {isNewlyAdded && (
                                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-black rounded-lg shrink-0 animate-in fade-in zoom-in-95">
                                      أُضيفت للتو
                                    </span>
                                  )}
                                </div>

                                {/* 🎓 المرحلة والكورس صراحةً بدلاً من الأرقام المبهمة والنصوص الرمادية */}
                                <div className="text-black font-black text-xs sm:text-sm mt-1 flex items-center gap-2 flex-wrap">
                                  <span className="bg-slate-100 text-black px-2.5 py-0.5 rounded-md border border-slate-300">
                                    المرحلة {getStageNameInArabic(lecItem.stage_number)} • {lecItem.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                                  </span>
                                </div>

                                {/* 🏛️ القاعة والأستاذ والتوقيت بخط أسود داكن عالي التباين */}
                                <div className="text-black font-black text-xs sm:text-sm mt-1 flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-black bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                                    {lecItem.start_time} - {lecItem.end_time}
                                  </span>
                                  <span className="text-black font-black">•</span>
                                  <span className="text-black font-black">
                                    القاعة: {lecItem.room || 'غير محددة'}
                                  </span>
                                  {lecItem.teacher_name && (
                                    <>
                                      <span className="text-black font-black">•</span>
                                      <span className="text-black font-black">
                                        الأستاذ: {lecItem.teacher_name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 🛠️ أزرار تعديل وحذف واضحة وبارزة وملموسة */}
                              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditLecture(lecItem)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-600 text-blue-950 hover:text-white border-2 border-blue-300 hover:border-blue-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="تعديل بيانات هذه المحاضرة"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLecture(lecItem.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-600 text-rose-950 hover:text-white border-2 border-rose-300 hover:border-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="حذف هذه المحاضرة من الجدول"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
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

          {/* ========================================================================= */}
          {/* 📅 3. استعراض محاضرات المرحلة المجدولة بحسب أيام الأسبوع */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <Calendar className="w-6 h-6 text-[#0F2942]" />
                  <span>جدول محاضرات {getStageNameInArabic(selectedScheduleStage)} — الكورس {selectedScheduleSemester === 1 ? 'الأول' : 'الثاني'}</span>
                </h3>
                <p className="text-sm sm:text-base font-black text-slate-800 mt-1">
                  استعراض المحاضرات المقررة لكل يوم مع إمكانية التعديل والحذف المباشر
                </p>
              </div>

              <span className="px-4 py-2 bg-slate-100 text-slate-950 font-black text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5">
                {selectedScheduleStudyType === 'evening' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-sky-600" />
                )}
                <span>إجمالي المحاضرات ({selectedScheduleStudyType === 'evening' ? 'مسائي' : 'صباحي'}): {scheduleLectures.filter((l) => l.department_id === currentDeptId && l.stage_number === selectedScheduleStage && l.semester === selectedScheduleSemester && (l.study_type || 'morning') === selectedScheduleStudyType).length}</span>
              </span>
            </div>

            {/* 🔘 شريط الإجراءات الجماعية العائم للمحاضرات المحددة */}
            {selectedScheduleLectureIds.length > 0 && (
              <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-blue-700" />
                  <span className="font-black text-blue-950 text-base">
                    تم تحديد <strong className="font-mono">{selectedScheduleLectureIds.length}</strong> محاضرات أسبوعية
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkDeleteScheduleLectures}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف المحاضرات المحددة ({selectedScheduleLectureIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedScheduleLectureIds([])}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm transition cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {DAYS_OF_WEEK_LIST.map((d) => {
                const isOff = currentScheduleConfig.off_days.includes(d.key);
                const dayLecs = scheduleLectures
                  .filter(
                    (l) =>
                      l.department_id === currentDeptId &&
                      l.stage_number === selectedScheduleStage &&
                      l.semester === selectedScheduleSemester &&
                      (l.study_type || 'morning') === selectedScheduleStudyType &&
                      l.day === d.key
                  )
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
                          <span className="px-3 py-1 bg-slate-200 text-slate-950 border border-slate-300 text-sm font-black rounded-xl">
                            <Coffee className="w-4 h-4 inline mr-1 text-slate-700" /> عطلة رسمية معتمدة
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 text-sm font-black rounded-xl">
                            <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-800" /> يوم دوام رسمي ({dayLecs.length} محاضرة)
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
                          type="button"
                          onClick={() => {
                            setEditingLectureId(null); // 🔄 تصفير التعديل
                            setLecDay(d.key); // 🗓️ تحديد اليوم المختار لهذا الزر
                            setLecStudyType(selectedScheduleStudyType); // ☀️🌙 تحديد الفترة المختارة حالياً تلقائياً
                            setLecCourseId(''); // 🧹 تصفير المادة الدراسية لتبدأ فارغة
                            setLecTeacherId(''); // 🧹 تصفير الأستاذ المحاضر
                            setLecRoom(''); // 🧹 تنظيف حقل القاعة
                            setLecNotes(''); // 🧹 تنظيف حقل الملاحظات
                            setLecType(''); // 🏷️ طبيعة المحاضرة تبدأ غير محددة
                            setLecStartTime(''); // ⏱️ وقت بدء المحاضرة يبدأ غير محدد
                            setLecEndTime(''); // ⏱️ وقت انتهاء المحاضرة يبدأ غير محدد
                            setLecModalSuccessMsg(''); // 🧹 مسح رسالة النجاح التفاعلية
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
                        {dayLecs.map((lec) => {
                          const typeArabic = lec.type === 'theory' ? 'محاضرة نظرية' : lec.type === 'practical' ? 'مختبر وعملي' : 'حلقة مناقشة';
                          const lecStudy = lec.study_type || 'morning';
                          const isSelected = selectedScheduleLectureIds.includes(lec.id);

                          return (
                            <div
                              key={lec.id}
                              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3.5 ${
                                isSelected
                                  ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30'
                                  : 'bg-white border-slate-300 shadow-2xs hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
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
                                  <span className="bg-slate-950 text-white px-3 py-1 rounded-xl text-sm sm:text-base font-black font-mono shadow-2xs">
                                    {lec.start_time} - {lec.end_time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* ☀️ / 🌙 شارة الصباحي والمسائي بالأيقونات الفيكتورية */}
                                  <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1 shadow-2xs ${
                                    lecStudy === 'evening'
                                      ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                                      : 'bg-sky-50 text-sky-950 border-sky-300'
                                  }`}>
                                    {lecStudy === 'evening' ? (
                                      <Moon className="w-3.5 h-3.5 text-indigo-700" />
                                    ) : (
                                      <Sun className="w-3.5 h-3.5 text-sky-600" />
                                    )}
                                    <span>{lecStudy === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                  </span>

                                  <span className={`px-3 py-1 rounded-xl text-sm sm:text-base font-black shadow-2xs ${
                                    lec.type === 'theory' ? 'bg-blue-100 text-blue-950 border border-blue-300' : lec.type === 'practical' ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-teal-100 text-teal-950 border border-teal-300'
                                  }`}>
                                    {typeArabic}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h5 className="font-black text-slate-950 text-lg sm:text-xl leading-snug">{lec.course_name}</h5>
                                
                                {/* 🎓 المرحلة والكورس صراحةً بدلاً من الأرقام المبهمة */}
                                <div className="text-black font-black text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                                  <span className="bg-slate-100 text-black px-2.5 py-0.5 rounded-lg border border-slate-300">
                                    المرحلة {getStageNameInArabic(lec.stage_number)} • {lec.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}
                                  </span>
                                </div>

                                <div className="text-base font-black text-slate-950 space-y-1.5">
                                  <p className="flex items-center gap-2">
                                    <DoorClosed className="w-5 h-5 text-[#0F2942] inline flex-shrink-0" />
                                    <span>القاعة: <strong className="text-slate-950">{lec.room || 'غير محددة'}</strong></span>
                                  </p>
                                  {lec.teacher_name && (
                                    <p className="flex items-center gap-2">
                                      <Users className="w-5 h-5 text-[#0F2942] inline flex-shrink-0" />
                                      <span>الأستاذ: <strong className="text-slate-950">{lec.teacher_name}</strong></span>
                                    </p>
                                  )}
                                  {lec.notes && (
                                    <p className="text-sm sm:text-base font-black text-slate-950 bg-slate-100 border border-slate-300 p-2.5 rounded-xl flex items-center gap-2">
                                      <Lightbulb className="w-5 h-5 text-slate-800 inline flex-shrink-0" />
                                      <span>ملاحظات: <strong className="text-slate-950">{lec.notes}</strong></span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* 🛠️ أزرار الإجراءات تعديل وحذف بارزة وملموسة واضحة */}
                              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleEditLecture(lec)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-100 hover:bg-blue-600 text-blue-950 hover:text-white border-2 border-blue-300 hover:border-blue-600 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="تعديل المحاضرة"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLecture(lec.id)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100 hover:bg-rose-600 text-rose-950 hover:text-white border-2 border-rose-300 hover:border-rose-600 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                                  title="حذف المحاضرة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>حذف</span>
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7️⃣ تبويب متابعة الحضور والإنذارات الأكاديمية لمسار بولونيا (Attendance & Warnings) */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* هيدر التبويب الفاتح */}
          <div className="bg-white p-6 rounded-3xl text-slate-900 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-black rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ضوابط الحضور والإنذارات الأكاديمية</span>
                </span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 font-bold text-sm font-black rounded-full">
                  قسم {deptName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
                <span>سجلات الحضور والغيابات والإنذارات الأكاديمية لمسار بولونيا</span>
              </h2>
              <p className="text-sm font-black sm:text-sm text-slate-950 font-black font-medium mt-1">
                متابعة مركزية لنسب غياب طلبة القسم ورصد تجاوزات الحدود القانونية (5% إنذار أولي | 7% إنذار نهائي | 10% حرمان رسمي)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              {/* 🎛️ تبويبات التبديل بين جدول الطلاب والتحليلات البيانية بتصميم صلب وفاخر */}
              <div className="bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-300 shadow-xs flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('list')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center gap-2 ${
                    attendanceViewMode === 'list'
                      ? 'bg-[#0F2942] text-white shadow-sm border border-[#0F2942]'
                      : 'bg-white text-slate-950 hover:bg-slate-50 border border-slate-300'
                  }`}
                >
                  <Users className={`w-4 h-4 ${attendanceViewMode === 'list' ? 'text-cyan-300' : 'text-slate-950'}`} />
                  <span>جدول الطلاب</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('analytics')}
                  className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center gap-2 ${
                    attendanceViewMode === 'analytics'
                      ? 'bg-[#0F2942] text-white shadow-sm border border-[#0F2942]'
                      : 'bg-white text-slate-950 hover:bg-slate-50 border border-slate-300'
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${attendanceViewMode === 'analytics' ? 'text-cyan-300' : 'text-slate-950'}`} />
                  <span>التحليلات والرسوم البيانية</span>
                </button>
              </div>

              {/* 📢 زر إرسال تبليغ أو تنبيه عام للمرحلة */}
              <button
                type="button"
                onClick={() => setIsDurationSettingsModalOpen(true)}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 border-2 border-[#0F2942] shadow-sm active:scale-95"
                title="تخصيص وإعداد مدد وساعات المحاضرات للقسم ومواده"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-300" />
                <span>تخصيص ساعات المحاضرات</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttendanceNoticeTargetStudent(null);
                  setSelectedAttendanceStudentIds([]);
                  setAttendanceNoticeDefaultCategory('general_announcement');
                  setIsAttendanceNoticeModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 border-2 border-[#0F2942] shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4 text-cyan-300" />
                <span>إرسال تبليغ عام للمرحلة</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeptExcuseReviewOpen(true)}
                className={`px-4 py-2.5 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 shadow-sm ${
                  excuseRequests.filter((e) => e.department_id === currentDeptId && e.status === 'pending').length > 0
                    ? 'bg-indigo-700 hover:bg-indigo-800 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-300" />
                <span>تدقيق ومراجعة طلبات الإجازات ({excuseRequests.filter((e) => e.department_id === currentDeptId && e.status === 'pending').length})</span>
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

              for (const c of relevantCoursesForStats) {
                const s = calculateStudentCourseAttendance(st.id, c.id, attendanceRecords, c.name, c.code, c.credit_hours || 3);
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

                  for (const c of relevantCoursesForTable) {
                    const s = calculateStudentCourseAttendance(st.id, c.id, attendanceRecords, c.name, c.code, c.credit_hours || 3);
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

                            {/* 🎓 المرحلة الدراسية بأسماء عربية صريحة */}
                            <div className="col-span-2 text-center">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block">
                                المرحلة {getStageNameInArabic(st.stage_number || 1)}
                              </span>
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

          {/* عرض الرسوم البيانية عند اختيار التبويب */}
          {attendanceViewMode === 'analytics' && (
            <AttendanceAnalyticsCharts
              courses={deptCourses}
              students={deptStudents}
              records={attendanceRecords}
              departmentName={deptName}
            />
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8️⃣ تبويب الرسوم البيانية والإحصائيات الأكاديمية (Analytics Dashboard) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <AnalyticsCharts
            grades={deptGrades}
            courses={deptCourses}
            students={deptStudents}
            teachers={deptTeachers}
            teacherCourses={deptTeacherCourses}
            attendanceRecords={attendanceRecords}
            departmentName={deptName}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎛️ نافذة منبثقة لتخصيص توزيع الدرجات والعناوين لبنود بولونيا الـ 7 (Assessment Scheme Modal) */}
      {/* ========================================================================= */}
      {isAssessmentModalOpen && selectedCourseForAssessment && tempAssessmentScheme && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
            
            {/* رأس النافذة الثابت */}
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 bg-white/95 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-950 border border-blue-300 rounded-2xl">
                  <Sliders className="w-6 h-6 text-blue-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-sm font-black rounded-md">
                      {selectedCourseForAssessment.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-sm font-black border ${ (selectedCourseForAssessment.course_type === 'theory_and_practical' || selectedCourseForAssessment.has_practical) ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                      {(selectedCourseForAssessment.course_type === 'theory_and_practical' || selectedCourseForAssessment.has_practical) ? 'نظري وعملي' : 'نظري فقط'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                    تخصيص توزيع أوزان وعناوين التقييم: {selectedCourseForAssessment.name}
                  </h3>
                  <p className="text-sm font-black text-slate-950 font-black">
                    قسم {deptName} | المرحلة {getStageNameInArabic(selectedCourseForAssessment.stage_number || 1)} • الكورس {selectedCourseForAssessment.semester === 2 ? 'الثاني' : 'الأول'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-sm font-black transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* جسم الحقول القابل للتمرير داخلياً */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain space-y-4">
            
            {/* 🎨 شريط القوالب السريعة */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>تطبيق قوالب التوزيع الجاهزة وفق دليل بولونيا:</span>
                </span>
                <span className="text-xs font-bold text-slate-500">انقر للتعبئة الفورية</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_and_practical'))}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  <span>القالب القياسي (عملي 10 + سعي 40 + نهائي 50)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempAssessmentScheme(getDefaultAssessmentScheme('theory_only'))}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>القالب النظري (نصفي 15 + تقرير 15 + سعي 20 + نهائي 50)</span>
                </button>
              </div>
            </div>

            {/* شبكة بنود التقييم الـ 8 (الـ 7 للسعي + الامتحان النهائي) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto p-1">
              {(
                [
                  { key: 'quiz1', defaultAr: 'كويز (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'quiz2', defaultAr: 'كويز (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'assignment1', defaultAr: 'واجب (1)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'assignment2', defaultAr: 'واجب (2)', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'report', defaultAr: 'تقرير ونشاط', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'midterm', defaultAr: 'امتحان نصفي', isPrac: false, roleText: 'خاص بأستاذ النظري' },
                  { key: 'practical', defaultAr: 'مختبر وعملي', isPrac: true, roleText: 'خاص بأستاذ العملي' },
                  { key: 'final_exam', defaultAr: 'امتحان نهائي', isPrac: false, roleText: 'الامتحان النهائي' },
                ] as const
              ).map((item, idx) => {
                const config = tempAssessmentScheme[item.key];
                return (
                  <div 
                    key={item.key} 
                    className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md space-y-3 ${
                      item.isPrac 
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                        : item.key === 'final_exam'
                        ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/30 md:col-span-2'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* ترويسة الكارد الصغير */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="font-black text-sm text-slate-950">
                          {item.key === 'final_exam' ? 'الامتحان النهائي' : item.isPrac ? 'بند التقييم العملي' : 'بند التقييم النظري'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                        item.isPrac 
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' 
                          : item.key === 'final_exam' 
                          ? 'bg-indigo-100 text-indigo-950 border-indigo-300 shadow-2xs' 
                          : 'bg-blue-50 text-blue-950 border-blue-200 shadow-2xs'
                      }`}>
                        {item.roleText}
                      </span>
                    </div>

                    {/* حقل العنوان وحقل الدرجة العظمى في صف واحد مرتب وواسع */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* 📝 حقل العنوان الموحد */}
                      <div className="col-span-8 sm:col-span-8 space-y-1">
                        <label className="block text-xs font-black text-slate-700">العنوان</label>
                        <input
                          type="text"
                          value={config.title_ar}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempAssessmentScheme({
                              ...tempAssessmentScheme,
                              [item.key]: {
                                ...config,
                                title_ar: val,
                                title_en: val,
                              },
                            });
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs"
                          placeholder={item.defaultAr}
                        />
                      </div>

                      {/* 🏆 حقل الدرجة العظمى */}
                      <div className="col-span-4 sm:col-span-4 space-y-1">
                        <label className="block text-xs font-black text-slate-700">الدرجة (Max)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={config.max_score}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setTempAssessmentScheme({
                                ...tempAssessmentScheme,
                                [item.key]: {
                                  ...config,
                                  max_score: val < 0 ? 0 : val,
                                },
                              });
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-950 text-center focus:bg-white focus:border-[#0F2942] focus:outline-none transition shadow-2xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* شريط التحقق من مجموع الأوزان (50 للسعي + 50 للنهائي = 100) */}
            {(() => {
              const cwSum = 
                (tempAssessmentScheme.quiz1.max_score || 0) +
                (tempAssessmentScheme.quiz2.max_score || 0) +
                (tempAssessmentScheme.assignment1.max_score || 0) +
                (tempAssessmentScheme.assignment2.max_score || 0) +
                (tempAssessmentScheme.report.max_score || 0) +
                (tempAssessmentScheme.midterm.max_score || 0) +
                (tempAssessmentScheme.practical.max_score || 0);

              const finalScore = tempAssessmentScheme.final_exam.max_score || 0;
              const totalScore = cwSum + finalScore;
              const isValid = cwSum === 50 && finalScore === 50;

              return (
                <div className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                  isValid ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs' : 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {isValid ? (
                        <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-rose-600 text-white rounded-xl shadow-2xs">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-black text-sm block">
                          {isValid 
                            ? 'التوزيع الأكاديمي مطابق تماماً لمعايير مسار بولونيا (سعي 50 + نهائي 50 = 100)'
                            : `تنبيه: مجموع بنود السعي يجب أن يكون 50 بالضبط (الحالي: ${cwSum}) والنهائي 50 (الحالي: ${finalScore})`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-black shrink-0">
                      <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">السعي: {cwSum}/50</span>
                      <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">النهائي: {finalScore}/50</span>
                      <span className={`px-3 py-1.5 rounded-xl text-white shadow-2xs font-black ${isValid ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                        المجموع: {totalScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            </div>

            {/* أزرار الإجراءات والفوتر الثابت للنافذة */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm font-black transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAssessmentSchemeModal}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm font-black shadow-md transition flex items-center gap-1.5 cursor-pointer border border-[#0F2942]"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>حفظ وتثبيت التوزيع المخصص</span>
              </button>
            </div>

          </div>
        </div>
      )}



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
      {showExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد كادر التدريسيين</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. حقل الاسم الثلاثي واللقب الأكاديمي:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  إلزامي لكل أستاذ (مثال: أ.د. كرار جاسم المحمداوي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. حقل البريد الأكاديمي وكلمة المرور:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك تركهما فارغين وسيقوم النظام تلقائياً بتوليد بريد أكاديمي فريد (@sadiq.edu.iq) ورمز دخول معقد فريد 100% بدون أي تكرار.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. حقل الجنس:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.
                </p>
              </div>
            </div>

            {/* 🔘 أزرار التفاعل السفلية بالنافذة المنبثقة */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200"> {/* 📦 حاوية أزرار الفوتر المتناسقة */}
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button" // 🛑 نوع الزر لمنع التقديم
                onClick={handleDownloadTeacherTemplate} // ⚡ دالة تنزيل نموذج الأساتذة
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95" // 👑 تصميم كحلي ملكي
              >
                <Download className="w-4 h-4 text-cyan-300" /> {/* 📥 أيقونة التنزيل الفيكتور */}
                <span>تنزيل النموذج المعتمد</span> {/* 🏷️ نص التنزيل */}
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للأساتذة (المقبول والمكرر والمرفوض) */}
      {importReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد كادر التدريسيين ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص الأسماء والبيانات والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {importReport.accepted.length}
                </div>
              </button>

              {/* المكرر (استبعاد وردي/أحمر) */}
              <button
                type="button"
                onClick={() => setActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (مستبعد)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض (استبعاد وردي/أحمر) */}
              <button
                type="button"
                onClick={() => setActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {activeReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة الأساتذة الذين تم قبولهم وإضافتهم للقسم بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الأساتذة الذين تم استبعادهم لوجود تكرار (عذراً، هذا الاسم موجود مسبقاً):</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي أسماء مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم استبعاده منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} {item.email !== '—' && `(${item.email})`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية البيانات (يجب تصحيحها في الملف):</span>
                  </h4>
                  {importReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لطلبة القسم */}
      {showStudentExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد طلبة القسم</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. حقل اسم الطالب:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  إلزامي، يرجى كتابة الاسم الثلاثي أو الرباعي للطالب/ـة (مثال: حيدر مهدي صادق الموسوي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. حقل المرحلة الدراسية:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. حقل البريد الأكاديمي وكلمة المرور:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك تركهما فارغين وسيقوم النظام تلقائياً بتوليد بريد أكاديمي رسمي فريد (@sadiq.edu.iq) ورمز دخول معقد فريد 100% بدون أي تكرار.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. حقل الجنس:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadStudentTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStudentExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel لطلبة القسم (المقبول والمكرر والمرفوض) */}
      {studentImportReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد طلبة القسم ({studentImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص الأسماء والمراحل والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStudentImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {studentImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {studentImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {studentImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {studentActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة الطلبة الذين تم قبولهم وإضافتهم للقسم بنجاح:</span>
                  </h4>
                  {studentImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {studentActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الطلبة الذين تم منعهم واستبعادهم لوجود تكرار في القسم:</span>
                  </h4>
                  {studentImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي أسماء مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعه منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} {item.email !== '—' && `(${item.email})`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {studentActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {studentImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStudentImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel للمواد والمقررات الدراسية */}
      {showCourseExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <BookOpen className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد المواد والمناهج</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-900 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. اسم المادة الدراسية بالعربية *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة كائنية التوجه، تراكيب البيانات).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. رمز المادة (الكود الأكاديمي):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياري (مثال: CS201). في حال تركه فارغاً سيقوم النظام بتوليد رمز أكاديمي نظامي تلقائياً.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الكورس (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. نوع المادة والساعات ECTS *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (نظري وعملي) للمواد التي تشمل مختبر، أو (نظري فقط). واكتب ساعات الـ ECTS من 1 إلى 15 (الافتراضي 3).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>5. أستاذ النظري وأستاذ العملي:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك كتابة اسم الأستاذ المطابق من ورقة (قائمة_أساتذة_القسم) وسيتم تكليفه تلقائياً.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadCourseTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCourseExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel لمواد القسم (المقبول والمكرر والمرفوض) */}
      {courseImportReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد المواد والمقررات ({courseImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص المواد والمراحل والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCourseImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {courseImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {courseImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {courseImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {courseActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المواد التي تم قبولها وإضافتها بنجاح:</span>
                  </h4>
                  {courseImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {courseActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المواد المكررة المستبعدة لوجودها مسبقاً في القسم:</span>
                  </h4>
                  {courseImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي مواد مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعها منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {courseActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {courseImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCourseImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لمحاضرات الجدول الأسبوعي */}
      {showScheduleExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <Calendar className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد الجدول الأسبوعي</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-900 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>1. اسم المادة الدراسية *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي كما هو مسجل في ورقة (قائمة_مواد_القسم) أو اكتب رمزها الأكاديمي.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>2. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الفصل (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>3. الفترة الدراسية واليوم الأسبوعي *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (صباحي) أو (مسائي)، واكتب اليوم بالعربية: (السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>4. التوقيت (البدء والانتهاء) *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب التوقيت بصيغة 12 ساعة (مثال: 08:30 ص أو 02:00 م) أو بصيغة 24 ساعة (مثال: 08:30 أو 14:00).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>5. القاعة / المختبر وطبيعة المحاضرة *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب اسم القاعة أو المختبر (مثال: قاعة 101، مختبر الحاسوب 1). واكتب طبيعة المحاضرة: (محاضرة نظرية) أو (مختبر وتطبيق عملي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>6. الأستاذ المحاضر (اختياري):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يمكنك كتابة اسم الأستاذ المطابق من ورقة (قائمة_أساتذة_القسم) ليتم ربطه بالمحاضرة وجدوله الشخصي تلقائياً.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadScheduleTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للجدول الأسبوعي (المقبول والمكرر والمرفوض) */}
      {scheduleImportReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <FileSpreadsheet className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد الجدول الأسبوعي ({scheduleImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص المحاضرات والقاعات والمواقيت والتحقق من عدم التضارب والتكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScheduleImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {scheduleImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {scheduleImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {scheduleImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {scheduleActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المحاضرات التي تم قبولها وإدراجها في الجدول بنجاح:</span>
                  </h4>
                  {scheduleImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs w-fit" dir="rtl">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المحاضرات المكررة المستبعدة لمنع تضارب الجداول:</span>
                  </h4>
                  {scheduleImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي محاضرات مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم الاستبعاد منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} — ({item.email})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {scheduleImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setScheduleImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

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
      {roundConfirmModal?.isOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150" dir="rtl">
          <div 
            className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-3 text-right relative animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ❌ زر الإغلاق السريع باللون الأسود */}
            <button
              type="button"
              onClick={() => setRoundConfirmModal(null)}
              className="absolute top-4 left-4 p-2 text-slate-950 hover:text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 🛡️ شارة وأيقونة رأس المودال المركزية الفاخرة بدون مبالغة بالحجم */}
            <div className="flex flex-col items-center justify-center text-center pt-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-1.5 ${
                roundConfirmModal.enable 
                  ? 'bg-[#0F2942] text-white ring-3 ring-[#0F2942]/15' 
                  : 'bg-slate-800 text-white ring-3 ring-slate-800/15'
              }`}>
                {roundConfirmModal.enable ? (
                  <Unlock className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Lock className="w-6 h-6 text-slate-300" />
                )}
              </div>

              <span className="px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1.5 border shadow-2xs bg-slate-100 text-slate-950 border-slate-300">
                {roundConfirmModal.enable ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942]" />
                    <span>طلب فتح وتفعيل رسمي</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-950" />
                    <span>طلب إغلاق وحجب رسمي</span>
                  </>
                )}
              </span>

              <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-1.5">
                {roundConfirmModal.title}
              </h3>
              <p className="text-xs sm:text-sm font-black text-slate-950 mt-1 leading-relaxed">
                {roundConfirmModal.description}
              </p>
            </div>

            {/* 📋 صندوق تفاصيل العملية ونطاق التأثير بنصوص سوداء وواضحة جداً 100% */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs sm:text-sm font-black text-slate-950">
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-950 font-black">الدور الأكاديمي:</span>
                <span className="text-slate-950 font-black">
                  {roundConfirmModal.round === 'final' ? 'الامتحان النهائي (الدور الأول)' : 'الدور الثاني'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-950 font-black">الكورس الدراسي:</span>
                <span className="text-slate-950 font-black">
                  {roundConfirmModal.targetSemester === 1 
                    ? 'الكورس الأول' 
                    : roundConfirmModal.targetSemester === 2 
                    ? 'الكورس الثاني' 
                    : 'كافة الكورسات'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-950 font-black">النطاق الأكاديمي:</span>
                <span className="text-slate-950 font-black">
                  {roundConfirmModal.targetCourseId
                    ? (roundConfirmModal.targetCourseName || 'مادة دراسية محددة')
                    : roundConfirmModal.targetStage === 'all'
                    ? 'كافة المراحل الدراسية للقسم'
                    : `المرحلة ${getStageNameInArabic(Number(roundConfirmModal.targetStage))}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-950 font-black">عدد المواد المتأثرة:</span>
                <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg font-mono font-bold text-xs shadow-2xs">
                  {roundConfirmModal.affectedCount} مواد دراسية
                </span>
              </div>
            </div>

            {/* 💡 إشعار وتنبيه توجيهي رسمي بنص أسود صريح ومدمج */}
            <div className="p-2.5 sm:p-3 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {roundConfirmModal.enable ? (
                  <span>
                    فور التأكيد، سيتم تفعيل إمكانية رصد وإدخال الدرجات من قبل التدريسيين المعنيين لهذه المواد، وستنعكس مباشرة وبشكل حي في بوابات الطلبة.
                  </span>
                ) : (
                  <span>
                    فور التأكيد، سيتم قفل وتجميد إدخال درجات هذا الدور وحجبها عن بوابات الطلبة، واقتصار العرض على السعي الفصلي التكويني فقط لحين الاعتماد الرسمي.
                  </span>
                )}
              </div>
            </div>

            {/* 🔘 أزرار اتخاذ القرار والتنفيذ الموزونة والفاخرة */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={executeConfirmToggleRoundAction}
                className="flex-1 py-2.5 px-4 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl font-black text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {roundConfirmModal.enable ? 'نعم، تأكيد الفتح والتفعيل' : 'نعم، تأكيد الإغلاق والحجب'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRoundConfirmModal(null)}
                className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-black text-sm transition border border-slate-300 cursor-pointer active:scale-95 shadow-2xs"
              >
                تراجع وإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗓️ نافذة المعاينة الحية لجدول الطالب التفاعلي مع هيدر ثابت ومستقر */}
      {isPreviewScheduleModalOpen && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-2 sm:p-4 animate-in fade-in duration-150 overflow-hidden" dir="rtl">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl flex flex-col text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 📌 هيدر ثابت ومستقر ما يتحرك أبداً ويه سكرول الجدول */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-30 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-2xs">
                  <Calendar className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950">المعاينة الحية لجدول المحاضرات للطلبة</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewScheduleModalOpen(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="إغلاق المعاينة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 📜 منطقة عرض محتوى الجدول الأكاديمي مع سكرول داخلي ناعم ومستقل */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
              <StudentScheduleTimeline
                departmentId={currentDeptId}
                departmentName={deptName}
                departmentHeadName={currentHead?.full_name}
                rapporteurName={currentRap?.full_name}
                stageNumber={selectedScheduleStage}
                lectures={scheduleLectures}
                configs={scheduleConfigs}
                initialSemester={selectedScheduleSemester}
                initialStudyType={selectedScheduleStudyType}
                showSemesterSwitcher={true}
              />
            </div>
          </div>
        </div>
      )}

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
      {showTeacherPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        const printList = singleTeacherPrintProfile
          ? [singleTeacherPrintProfile]
          : (selectedTeacherIds.length > 0
              ? deptTeachers.filter((t) => selectedTeacherIds.includes(t.id))
              : [...deptTeachers]);

        printList.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الأساتذة — قسم {deptName}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  {singleTeacherPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleTeacherPrintProfile(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الأساتذة ({deptTeachers.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942] active:scale-95"
                    title="طباعة مباشرة أو حفظ بتنسيق PDF على ورق A4 (10 بطاقات بالصفحة)"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة وتصدير PDF الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPrintModal(false);
                      setSingleTeacherPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد أساتذة محددين للطباعة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                    {printList.map((teacher: UserProfile, index: number) => {
                      const isFemale = (teacher.gender || detectArabicGender(teacher.full_name)) === 'female';
                      const roleTitle = isFemale ? 'أستاذة جامعية' : 'أستاذ جامعي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/teacher`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');

                      return (
                        <div
                          key={teacher.id || index} // 🔑 مفتاح فريد لكل كارد أستاذ بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة التدريسي بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للأستاذ أو الأستاذة بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج الهوية الأكاديمية */}
                              {roleTitle}
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الأستاذ والقسم التابع إله بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم التدريسي والقسم العلمي بتنسيق ممتلئ وأنيق */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الأستاذ */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الأستاذ باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للتدريسي بخط أسود كبير وواضح */}
                                {teacher.full_name}
                              </span>
                            </div>
                            <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏢 اسم القسم العلمي بخط أسود عريض */}
                              {deptName}
                            </span>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {teacher.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {teacher.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الأستاذ بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الأستاذ مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
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
        );
      })(), document.body)}

      {/* 🖨️ 2. نافذة معاينة وطباعة بطاقات اعتماد الطلبة (10 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x5) */}
      {showStudentPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
        let printList = singleStudentPrintProfile
          ? [singleStudentPrintProfile]
          : (selectedStudentIds.length > 0
              ? deptStudents.filter((s) => selectedStudentIds.includes(s.id))
              : [...deptStudents]);

        if (!singleStudentPrintProfile) {
          if (studentPrintStageFilter !== 'all') {
            printList = printList.filter((s) => (s.stage_number || 1) === studentPrintStageFilter);
          }
          if (studentPrintStudyFilter !== 'all') {
            printList = printList.filter((s) => (s.study_type || 'morning') === studentPrintStudyFilter);
          }
        }

        printList.sort((a, b) => {
          const stageA = a.stage_number || 1;
          const stageB = b.stage_number || 1;
          if (stageA !== stageB) return stageA - stageB;
          return a.full_name.localeCompare(b.full_name, 'ar');
        });

        const baseStudents = selectedStudentIds.length > 0
          ? deptStudents.filter((s) => selectedStudentIds.includes(s.id))
          : deptStudents;

        // 📊 إحصائيات طلاب القسم المتاحة للطباعة (العدد الكلي وأعداد كل مرحلة وفترة)
        const totalCount = baseStudents.length;
        const stage1Count = baseStudents.filter((s) => (s.stage_number || 1) === 1).length;
        const stage2Count = baseStudents.filter((s) => (s.stage_number || 1) === 2).length;
        const stage3Count = baseStudents.filter((s) => (s.stage_number || 1) === 3).length;
        const stage4Count = baseStudents.filter((s) => (s.stage_number || 1) === 4).length;

        const morningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
        const eveningCount = baseStudents.filter((s) => (s.study_type || 'morning') === 'evening').length;

        // 🎓 خيارات تصفية المراحل الأكاديمية الاحترافية مع الأعداد الدقيقة
        const stageOptions: PrintFilterOption<number | 'all'>[] = [
          { id: 'all', label: 'كافة المراحل (العدد الكلي)', count: totalCount },
          { id: 1, label: 'المرحلة الأولى', count: stage1Count },
          { id: 2, label: 'المرحلة الثانية', count: stage2Count },
          { id: 3, label: 'المرحلة الثالثة', count: stage3Count },
          { id: 4, label: 'المرحلة الرابعة', count: stage4Count },
        ];

        // ☀️🌙 خيارات تصفية الفترات الدراسية الاحترافية مع الأعداد الدقيقة
        const studyOptions: PrintFilterOption<'all' | 'morning' | 'evening'>[] = [
          { id: 'all', label: 'كافة الفترات (العدد الكلي)', count: totalCount },
          { id: 'morning', label: 'الصباحي', count: morningCount },
          { id: 'evening', label: 'المسائي', count: eveningCount },
        ];

        return (
          <div 
            id="printable-modal-portal"
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
            dir="rtl"
          >
            <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
              
              {/* شريط الأدوات العلوي */}
              <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-black flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span>معاينة وطباعة بطاقات اعتماد الطلبة — قسم {deptName}</span>
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                        {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  {/* فلاتر المرحلة والدراسة الاحترافية بتصميم حديث وأعداد دقيقة */}
                  {!singleStudentPrintProfile && (
                    <div className="flex items-center gap-2.5">
                      <PrintFilterDropdown<number | 'all'>
                        ariaLabel="تصفية طباعة الطلاب حسب المرحلة الأكاديمية"
                        icon={<GraduationCap className="w-4 h-4 text-[#0F2942]" />}
                        options={stageOptions}
                        selectedValue={studentPrintStageFilter}
                        onSelect={(val) => setStudentPrintStageFilter(val)}
                      />

                      <PrintFilterDropdown<'all' | 'morning' | 'evening'>
                        ariaLabel="تصفية طباعة الطلاب حسب الفترة الدراسية"
                        icon={<Clock className="w-4 h-4 text-[#0F2942]" />}
                        options={studyOptions}
                        selectedValue={studentPrintStudyFilter}
                        onSelect={(val) => setStudentPrintStudyFilter(val)}
                      />
                    </div>
                  )}

                  {singleStudentPrintProfile && (
                    <button
                      type="button"
                      onClick={() => setSingleStudentPrintProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-black" />
                      <span>عرض كافة الطلبة ({deptStudents.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={printList.length === 0}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942] active:scale-95"
                    title="طباعة مباشرة أو حفظ بتنسيق PDF على ورق A4 (10 بطاقات بالصفحة)"
                  >
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span>طباعة وتصدير PDF الآن ({printList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentPrintModal(false);
                      setSingleStudentPrintProfile(null);
                    }}
                    className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* منطقة الطباعة بنظام الشبكة 2 عمود × 5 صفوف */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                {printList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                    <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                    <p className="text-base font-black text-black">لا يوجد طلاب مطابقين للخيارات المحددة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                    {printList.map((student: UserProfile, index: number) => {
                      const curStage = student.stage_number || 1;
                      const stageName = getStageNameInArabic(curStage);
                      const studyName = student.study_type === 'evening' ? 'مسائي' : 'صباحي';
                      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                      const loginPortalUrl = `${currentOrigin}/student`;
                      const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, '');

                      return (
                        <div
                          key={student.id || index} // 🔑 مفتاح فريد لكل كارد طالب بالرندر
                          className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                        >
                          {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وشارة الطالب بخطوط سوداء فاحمة وواضحة */}
                          <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                              {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                              <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                <Image // 🖼️ مكون صورة الشعار
                                  src="/logo.webp" // 📍 مسار الشعار المعتمد
                                  alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                  width={32} // 📏 العرض بالبكسل
                                  height={32} // 📏 الارتفاع بالبكسل
                                  className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                  priority // ⚡ تحميل سريع وفوري
                                  unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                />
                              </div>
                              {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا بخط أسود بارز ومقروء */}
                              <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                  جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                </h4>
                                <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                  وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                </p>
                              </div>
                            </div>
                            {/* شارة الهوية الرسمية للطالب الجامعي بخط أسود بارز ومحاط بإطار أنيق */}
                            <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج هوية الطالب */}
                              بطاقة طالب
                            </span>
                          </div>

                          {/* 👤 2. شريط هوية الطالب وقسمه ومرحلته الدراسية بخطوط سوداء عريضة */}
                          <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم الطالب وبيانات المرحلة بتنسيق ممتلئ وأنيق */}
                            <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم الطالب */}
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة الطالب باللون النيلي */}
                              </div>
                              <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للطالب بخط أسود كبير وواضح */}
                                {student.full_name}
                              </span>
                            </div>
                            <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🎓 المرحلة والدراسة بخط أسود عريض */}
                              المرحلة {stageName} ({studyName})
                            </span>
                          </div>

                          {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                          <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                            {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                <span>البريد الأكاديمي</span>
                              </div>
                              <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                {student.generated_email}
                              </div>
                            </div>

                            {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                            <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                              <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                <span>كلمة المرور المؤقتة</span>
                              </div>
                              <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                {student.temp_password || '********'}
                              </div>
                            </div>
                          </div>

                          {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم الطالب بدون توقيع المستلم وبخط أسود فاحم */}
                          <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                            <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم الطالب مع إطار ناعم */}
                              <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                              <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
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
        );
      })(), document.body)}

      </div>
    </ZeroTrustGuard>
  );
}
