'use client'; // ⚡ ينفذ بالعميل

// 📝 محرر وإدارة جداول الامتحانات النهائية الفاينل للقسم والمقرر (FinalExamScheduleEditor) - مسار بولونيا
import { useState, useMemo, useEffect, useRef } from 'react'; // 🔗 رياكت
import { FinalExamSchedule, FinalExamSlot, Course, UserProfile, ExamAttemptType, DayOfWeek, Department } from '@/types'; // 🔗 الأنواع الصريحة
import { downloadFinalExamScheduleTemplate, parseExcelFile, exportCustomFinalExamSlotsList } from '@/lib/excel-utils'; // 📊 ميزات ونماذج Excel الرسمية
import { exportFinalExamSchedulePDF } from '@/lib/pdf-export'; // 📄 مولد كشف وتصدير جدول الامتحانات PDF
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 الإشعارات
import { checkFinalExamCollisions } from '@/lib/schedule-utils'; // 🕒 فحص تضارب الامتحانات والقاعات
import { getStoredData, INITIAL_DEPARTMENTS, getAcademicYear } from '@/lib/mock-data'; // 💾 الأقسام والعام الدراسي
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import MasterCampusExamMatrixModal from './MasterCampusExamMatrixModal'; // 🏛️ مصفوفة القاعات المركزية
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { 
  FileText, 
  Plus, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Send, 
  Save, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  X, 
  CheckSquare, 
  Award, 
  ArrowUp, 
  ArrowDown, 
  BookOpen, 
  Calendar, 
  Building2, 
  MapPin, 
  Users, 
  ChevronDown, 
  Check, 
  Layers,
  GraduationCap,
  BookmarkCheck,
  CalendarDays,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  Upload,
  Info,
  HelpCircle,
  AlertCircle
} from 'lucide-react'; // 🎨 كافة الأيقونات بصيغة SVG نقية 100%
import { lockBodyScroll, unlockBodyScroll, forceUnlockBodyScroll } from '@/lib/scroll-lock'; // 🔒 نظام إدارة التمرير المركزي
import AdminPagination from '@/components/AdminPagination'; // 📑 مكوّن الترقيم والتنقل بين الصفحات الموحد

interface FinalExamScheduleEditorProps {
  departmentId: string;               // 🏢 معرف القسم
  departmentName: string;             // 🏢 اسم القسم
  courses: Course[];                  // 📘 مواد القسم
  currentUser: UserProfile;           // 👤 المستخدم الحالي (رئيس القسم أو المقرر)
  schedules: FinalExamSchedule[];     // 📋 كافة الجداول
  slots: FinalExamSlot[];             // 📋 كافة بنود الامتحانات
  onSaveSchedule: (schedule: FinalExamSchedule, slots: FinalExamSlot[]) => void; // 💾 دالة الحفظ
  headName?: string;                  // 👤 اسم رئيس القسم
  rapporteurName?: string;            // 👤 اسم المقرر
}

// 📜 قائمة التعليمات والضوابط الامتحانية النموذجية الافتراضية
const DEFAULT_EXAM_INSTRUCTIONS: string[] = [
  'الحضور إلى القاعة الامتحانية قبل 15 دقيقة من موعد بدء الامتحان المحدد.',
  'إبراز الهوية الجامعية الموحدة شرط أساسي ولا يسمح بالدخول بدونها.',
  'يمنع منعاً باتاً إدخال أجهزة الهاتف المحمول والساعات الذكية داخل القاعة.',
  'الالتزام التام بالزي الجامعي الموحد والهدوء داخل القاعة الامتحانية.',
];

// 📅 قائمة خيارات الأيام بالعربية
const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
];

const DAY_NAMES_MAP: Record<string, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

export default function FinalExamScheduleEditor({
  departmentId,
  departmentName,
  courses,
  currentUser,
  schedules,
  slots,
  onSaveSchedule,
  headName = 'رئيس القسم العلمي',
  rapporteurName = 'مقرر القسم العلمي',
}: FinalExamScheduleEditorProps) {
  // 🎛️ خيارات الفلاتر والمرحلة
  const [deletingSlot, setDeletingSlot] = useState<FinalExamSlot | null>(null); // 🗑️ حالة مادة الامتحان المراد حذفها
  const [pendingConflictData, setPendingConflictData] = useState<{ scheduleToUse: FinalExamSchedule; newSlot: FinalExamSlot; warnMsgs: string } | null>(null); // ⚠️ حالة تضارب القاعات
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptType>('first_attempt');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]); // 🔘 معرفات الامتحانات المحددة
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false); // 🗑️ حالة تأكيد الحذف الجماعي
  const [isCampusMatrixOpen, setIsCampusMatrixOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false); // ⏳ حالة تصدير جدول الامتحانات PDF الرسمية

  // 📑 حالات الترقيم والتنقل بين صفحات جدول المواد الامتحانية
  const [examPage, setExamPage] = useState<number>(1); // 🔢 رقم الصفحة الحالية
  const [examPageSize, setExamPageSize] = useState<number>(10); // 📏 عدد البنود في الصفحة

  // 🔄 تصفير صفحة الامتحانات إلى الأولى عند تغيير المرحلة أو الكورس أو الدور
  useEffect(() => {
    setExamPage(1);
  }, [selectedStage, selectedSemester, selectedAttempt]);

  // 📝 حالة نافذة إضافة / تعديل مادة امتحانية
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // 🔔 تنبيهات خاصة داخل كارد إضافة / تعديل المادة
  const [modalAlert, setModalAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // ⏳ إخفاء التنبيه العائم تلقائياً بعد 4.5 ثوانٍ لراحة المستخدم
  useEffect(() => {
    if (!modalAlert) return;
    const timer = setTimeout(() => {
      setModalAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [modalAlert]);

  // 🎛️ حالات القوائم المنسدلة المخصصة الاحترافية
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState<boolean>(false);

  // 📋 حقول نموذج البند الامتحاني
  const [slotCourseId, setSlotCourseId] = useState<string>('');
  const [slotStudyType, setSlotStudyType] = useState<'morning' | 'evening'>('morning');
  const [slotExamDate, setSlotExamDate] = useState<string>('');
  const [slotExamDay, setSlotExamDay] = useState<DayOfWeek>('saturday');
  const [slotStartTime, setSlotStartTime] = useState<string>('');
  const [slotEndTime, setSlotEndTime] = useState<string>('');
  const [slotBuilding, setSlotBuilding] = useState<string>('');
  const [slotHall, setSlotHall] = useState<string>('');
  const [slotSupervisor, setSlotSupervisor] = useState<string>('');
  const [slotNotes, setSlotNotes] = useState<string>('');

  // ⚙️ حالات نظام إدارة التعليمات والضوابط الامتحانية (Instructions CRUD)
  const [isAddingInstructionModalOpen, setIsAddingInstructionModalOpen] = useState<boolean>(false); // ➕ فتح كارد الإضافة
  const [newInstructionText, setNewInstructionText] = useState<string>(''); // ✍️ نص البند الجديد
  const [editingInstructionIndex, setEditingInstructionIndex] = useState<number | null>(null); // ✍️ فهرس البند الجاري تعديله
  const [editingInstructionText, setEditingInstructionText] = useState<string>(''); // ✍️ نص البند المعدل
  const [selectedInstructionIndexes, setSelectedInstructionIndexes] = useState<number[]>([]); // 🔘 البنود المحددة للاجراءات الجماعية
  const [deletingInstructionIndex, setDeletingInstructionIndex] = useState<number | null>(null); // 🗑️ البند الجاري تأكيد حذفه
  const [isBulkDeleteInstructionsModalOpen, setIsBulkDeleteInstructionsModalOpen] = useState<boolean>(false); // 🗑️ حالة تأكيد الحذف الجماعي لبنود التعليمات

  // 📤 حالات تأكيد الإرسال وإلغاء الإرسال للمسؤول العام
  const [isConfirmSubmitModalOpen, setIsConfirmSubmitModalOpen] = useState<boolean>(false); // 📤 كارد تأكيد إرسال الجدول
  const [isConfirmWithdrawModalOpen, setIsConfirmWithdrawModalOpen] = useState<boolean>(false); // 🔄 كارد تأكيد إلغاء الإرسال واسترجاع المسودة

  // 📊 حالات نظام استيراد جدول الامتحانات عبر Excel
  const [showExcelInstructions, setShowExcelInstructions] = useState<boolean>(false); // ℹ️ نافذة تعليمات استيراد الجدول
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false); // ⏳ حالة جاري استيراد إكسل
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    accepted: { courseName: string; stage: number; semester: number; examDate: string; time: string; hall: string }[];
    duplicates: { courseName: string; reason: string }[];
    rejected: { rowNumber: number; rawName: string; reason: string }[];
  } | null>(null); // 📊 تقرير نتائج استيراد إكسل
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted'); // 📑 التبويب النشط في التقرير
  const excelInputRef = useRef<HTMLInputElement>(null); // 📂 مرجع حقل اختيار ملف الإكسل

  // 🔒 قفل واستعادة تمرير الصفحة بشكل مركزي آمن ومضمون 100%
  useEffect(() => {
    const isModalActive = 
      isSlotModalOpen || 
      isAddingInstructionModalOpen || 
      editingInstructionIndex !== null || 
      isCampusMatrixOpen ||
      showExcelInstructions ||
      importReport !== null;

    if (isModalActive) {
      lockBodyScroll();
      return () => {
        unlockBodyScroll();
      };
    }
  }, [
    isSlotModalOpen, 
    isAddingInstructionModalOpen, 
    editingInstructionIndex, 
    isCampusMatrixOpen,
    showExcelInstructions,
    importReport
  ]);

  // 🧹 تنظيف واستعادة التمرير إجبارياً عند مغادرة المكون
  useEffect(() => {
    return () => {
      forceUnlockBodyScroll();
    };
  }, []);

  // 🔍 البحث عن الجدول المطابق للمرحلة والكورس والدور
  const currentSchedule = useMemo(() => {
    return schedules.find(
      (s) =>
        s.department_id === departmentId &&
        s.stage_number === selectedStage &&
        s.semester === selectedSemester &&
        s.attempt_type === selectedAttempt
    );
  }, [schedules, departmentId, selectedStage, selectedSemester, selectedAttempt]);

  // 🔍 قائمة التعليمات النشطة للجدول الحالي
  const activeInstructions = useMemo(() => {
    if (currentSchedule?.instructions && currentSchedule.instructions.length > 0) {
      return currentSchedule.instructions;
    }
    return DEFAULT_EXAM_INSTRUCTIONS;
  }, [currentSchedule]);

  // 🔍 حساب بنود ومواعيد المرحلة الحالية
  const currentSlots = useMemo(() => {
    if (!currentSchedule) return [];
    return slots.filter((s) => s.schedule_id === currentSchedule.id);
  }, [currentSchedule, slots]);

  // ⚠️ فحص كشف التضارب اللحظي أثناء ملء بيانات مادة الامتحان
  const liveConflicts = useMemo(() => {
    if (!isSlotModalOpen || !slotExamDate || !slotStartTime || !slotEndTime) return [];
    return checkFinalExamCollisions(
      {
        schedule_id: currentSchedule?.id,
        exam_date: slotExamDate,
        start_time: slotStartTime,
        end_time: slotEndTime,
        hall_name: slotHall,
        building_name: slotBuilding,
        supervisor_name: slotSupervisor,
      },
      slots,
      editingSlotId || undefined
    );
  }, [isSlotModalOpen, slotExamDate, slotStartTime, slotEndTime, slotHall, slotBuilding, slotSupervisor, slots, editingSlotId, currentSchedule]);

  // 📘 المواد المتاحة لهذه المرحلة والكورس
  const stageCourses = useMemo(() => {
    return courses.filter((c) => Number(c.stage_number || 1) === Number(selectedStage) && (Number(c.semester) || 1) === Number(selectedSemester));
  }, [courses, selectedStage, selectedSemester]);

  // 🌐 مواد المراحل أو الكورسات الأخرى في نفس القسم لتسهيل التبديل والاختيار التلقائي
  const otherCourses = useMemo(() => {
    return courses.filter((c) => !(Number(c.stage_number || 1) === Number(selectedStage) && (Number(c.semester) || 1) === Number(selectedSemester)));
  }, [courses, selectedStage, selectedSemester]);

  // 💡 المواد المتبقية التي لم تضف بعد للجدول في هذه المرحلة
  const unaddedCourses = useMemo(() => {
    const addedIds = new Set(currentSlots.map((s) => s.course_id));
    return stageCourses.filter((c) => !addedIds.has(c.id));
  }, [stageCourses, currentSlots]);

  // 🎯 المادة المختارة حالياً
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === slotCourseId);
  }, [courses, slotCourseId]);

  // 🛠️ دالة مساعدة لحساب اسم اليوم من التاريخ المدخل
  const handleDateChange = (dateVal: string) => {
    setSlotExamDate(dateVal);
    if (!dateVal) return;
    try {
      const d = new Date(dateVal);
      const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = d.getDay();
      setSlotExamDay(days[dayIndex] || 'saturday');
    } catch {
      // تجاهل
    }
  };

  // 🏗️ دالة مساعدة لإنشاء أو جلب كائن الجدول للتعديل عليه
  const getOrCreateSchedule = (): FinalExamSchedule => {
    if (currentSchedule) {
      return { ...currentSchedule, updated_at: new Date().toISOString() };
    }
    return {
      id: `sch-exam-${departmentId}-s${selectedStage}-c${selectedSemester}-${selectedAttempt}`,
      department_id: departmentId,
      department_name: departmentName,
      stage_number: selectedStage,
      semester: selectedSemester,
      academic_year_id: `year-${getAcademicYear().split('-')[0] || '2026'}`,
      academic_year_label: getAcademicYear(),
      attempt_type: selectedAttempt,
      status: 'draft',
      instructions: DEFAULT_EXAM_INSTRUCTIONS,
      created_by_id: currentUser.id,
      created_by_name: currentUser.full_name,
      created_by_role: (currentUser.role as 'department_head' | 'rapporteur') || 'department_head',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  // =========================================================================
  // ⚙️ دوال الـ CRUD الخاصة بالتعليمات والضوابط الامتحانية
  // =========================================================================

  // ➕ 1. إضافة بند تعليمات جديد (Create)
  const handleAddInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructionText.trim()) return;
    const updated = [...activeInstructions, newInstructionText.trim()];
    const sch = { ...getOrCreateSchedule(), instructions: updated };
    onSaveSchedule(sch, currentSlots);
    setNewInstructionText('');
    setIsAddingInstructionModalOpen(false);
    setToastMessage('تمت إضافة بند التعليمات والضوابط الجديد بنجاح');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ✏️ 2. فتح وضع تعديل بند (Start Edit)
  const handleStartEditInstruction = (index: number) => {
    setEditingInstructionIndex(index);
    setEditingInstructionText(activeInstructions[index] || '');
  };

  // 💾 3. حفظ تعديل البند (Update)
  const handleSaveEditedInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInstructionIndex === null || !editingInstructionText.trim()) return;
    const updated = [...activeInstructions];
    updated[editingInstructionIndex] = editingInstructionText.trim();
    const sch = { ...getOrCreateSchedule(), instructions: updated };
    onSaveSchedule(sch, currentSlots);
    setEditingInstructionIndex(null);
    setEditingInstructionText('');
    setToastMessage('تم تحديث وتعديل بند التعليمات الامتحانية بنجاح ✏️');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🗑️ 4. حذف بند تعليمات (Delete)
  const handleDeleteInstruction = (index: number) => {
    const updated = activeInstructions.filter((_, i) => i !== index);
    const sch = { ...getOrCreateSchedule(), instructions: updated };
    onSaveSchedule(sch, currentSlots);
    setSelectedInstructionIndexes((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
    setToastMessage('تم حذف بند التعليمات الامتحانية بنجاح 🗑️');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🗑️ 5. الحذف الجماعي لبنود التعليمات المحددة
  const handleBulkDeleteInstructions = () => {
    if (selectedInstructionIndexes.length === 0) return;
    const count = selectedInstructionIndexes.length;
    const updated = activeInstructions.filter((_, i) => !selectedInstructionIndexes.includes(i));
    const sch = { ...getOrCreateSchedule(), instructions: updated };
    onSaveSchedule(sch, currentSlots);
    setSelectedInstructionIndexes([]);
    setIsBulkDeleteInstructionsModalOpen(false);
    setToastMessage(`تم حذف (${count}) بنود تعليمات محددة بنجاح 🗑️`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🔀 6. تقديم وتأخير ترتيب البند (Reorder)
  const handleMoveInstruction = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeInstructions.length) return;
    const updated = [...activeInstructions];
    const item = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = item;
    const sch = { ...getOrCreateSchedule(), instructions: updated };
    onSaveSchedule(sch, currentSlots);
    setSelectedInstructionIndexes((prev) =>
      prev.map((i) => (i === index ? targetIdx : i === targetIdx ? index : i))
    );
    setToastMessage(direction === 'up' ? 'تم تقديم ترتيب البند للأعلى بنجاح ⬆️' : 'تم تأخير ترتيب البند للأسفل بنجاح ⬇️');
    setTimeout(() => setToastMessage(''), 2500);
  };

  // =========================================================================
  // 📅 دوال إدارة بنود المواد الامتحانية
  // =========================================================================

  // ➕ فتح نافذة إضافة مادة جديدة ببيانات فارغة تماماً
  const handleOpenAddSlot = () => {
    setEditingSlotId(null);
    setSlotCourseId(''); // 👈 فارغة تماماً
    setSlotStudyType('morning'); // 👈 افتراضياً صباحي
    setSlotExamDate(''); // 👈 فارغة
    setSlotExamDay('saturday');
    setSlotStartTime(''); // 👈 فارغة
    setSlotEndTime(''); // 👈 فارغة
    setSlotBuilding(''); // 👈 فارغة
    setSlotHall(''); // 👈 فارغة
    setSlotSupervisor(''); // 👈 فارغة
    setSlotNotes(''); // 👈 فارغة
    setModalAlert(null); // 👈 مسح أي تنبيهات سابقة
    setIsCourseDropdownOpen(false);
    setIsDayDropdownOpen(false);
    setIsSlotModalOpen(true);
  };

  // ✏️ فتح نافذة تعديل مادة
  const handleOpenEditSlot = (slot: FinalExamSlot) => {
    setEditingSlotId(slot.id);
    setSlotCourseId(slot.course_id);
    setSlotStudyType(slot.study_type === 'evening' ? 'evening' : 'morning');
    setSlotExamDate(slot.exam_date);
    setSlotExamDay(slot.exam_day);
    setSlotStartTime(slot.start_time);
    setSlotEndTime(slot.end_time);
    setSlotBuilding(slot.building_name);
    setSlotHall(slot.hall_name);
    setSlotSupervisor(slot.supervisor_name || '');
    setSlotNotes(slot.notes || '');
    setModalAlert(null);
    setIsCourseDropdownOpen(false);
    setIsDayDropdownOpen(false);
    setIsSlotModalOpen(true);
  };

  // 💾 حفظ بند مادة الامتحان في الجدول مع خيار الإضافة المستمرة وتنبيهات الكارد
  const handleSaveSlot = (e: React.FormEvent, andContinue: boolean = false) => {
    e.preventDefault();

    // 🔍 التحقق الدقيق من المدخلات وعرض التنبيه داخل الكارد
    if (!slotCourseId) {
      setModalAlert({ type: 'error', message: 'يرجى اختيار المادة الدراسية أولاً قبل الحفظ.' });
      return;
    }

    if (!slotExamDate) {
      setModalAlert({ type: 'error', message: 'يرجى تحديد تاريخ الامتحان.' });
      return;
    }

    if (!slotStartTime || !slotEndTime) {
      setModalAlert({ type: 'error', message: 'يرجى إدخال وقت البدء والانتهاء للامتحان.' });
      return;
    }

    if (!slotBuilding.trim() || !slotHall.trim()) {
      setModalAlert({ type: 'error', message: 'يرجى إدخال اسم البناية والقاعة الامتحانية.' });
      return;
    }

    const targetCourse = courses.find((c) => c.id === slotCourseId) || {
      id: 'custom-course',
      name: 'مادة دراسية',
      code: 'CRS101',
    };

    const scheduleToUse = getOrCreateSchedule();

    const newSlot: FinalExamSlot = {
      id: editingSlotId || `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      schedule_id: scheduleToUse.id,
      course_id: targetCourse.id,
      course_name: targetCourse.name,
      course_code: targetCourse.code,
      stage_number: selectedStage,
      exam_date: slotExamDate,
      exam_day: slotExamDay,
      start_time: slotStartTime,
      end_time: slotEndTime,
      duration_hours: 3,
      building_name: slotBuilding,
      hall_name: slotHall,
      supervisor_name: slotSupervisor,
      notes: slotNotes,
      study_type: slotStudyType,
    };

    // فحص كشف التضارب المركزي الشامل
    const conflicts = checkFinalExamCollisions(newSlot, slots, editingSlotId || undefined);
    if (conflicts.length > 0) {
      const warnMsgs = conflicts.map((c) => `• ${c.message}`).join('\n');
      setPendingConflictData({ scheduleToUse, newSlot, warnMsgs });
      setIsSlotModalOpen(false);
      return;
    }

    commitSlotSave(scheduleToUse, newSlot, andContinue);
  };

  // 💾 التثبيت النهائي للبند في الحالة وتحديث الجدول مع الإضافة المتتالية وتحديث القائمة الجانبية
  const commitSlotSave = (scheduleToUse: FinalExamSchedule, newSlot: FinalExamSlot, andContinue: boolean = false) => {
    let updatedSlots: FinalExamSlot[];
    if (editingSlotId) {
      updatedSlots = slots.map((s) => (s.id === editingSlotId ? newSlot : s));
    } else {
      updatedSlots = [...slots, newSlot];
    }

    onSaveSchedule(scheduleToUse, updatedSlots);

    if (andContinue && !editingSlotId) {
      // تفريغ الحقول وإظهار التنبيه الإيجابي في الكارد
      setSlotCourseId('');
      setSlotNotes('');
      
      // تقديم التاريخ يومين تلقائياً لتسهيل الجدولة
      try {
        if (slotExamDate) {
          const currentDate = new Date(slotExamDate);
          currentDate.setDate(currentDate.getDate() + 2);
          handleDateChange(currentDate.toISOString().split('T')[0]);
        }
      } catch {
        // تجاهل
      }

      setIsCourseDropdownOpen(false);
      setIsDayDropdownOpen(false);
      setModalAlert({
        type: 'success',
        message: `تم حفظ مادة (${newSlot.course_name}) بنجاح وإضافتها للقائمة على اليسار! يمكنك إدخال المادة التالية مباشرة.`
      });
    } else {
      setIsSlotModalOpen(false);
      setToastMessage(editingSlotId ? 'تم تحديث مادة الامتحان بنجاح' : 'تمت إضافة مادة الامتحان إلى الجدول بنجاح');
    }
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🏁 إنهاء وحفظ الجدول مباشرة وإغلاق الكارد (سواء كانت الحقول فارغة بعد إضافات سابقة أو ممتلئة)
  const handleFinishAndCloseSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // إذا كانت المادة محددة والتاريخ مدخل، نحفظ هذه المادة الحالية أيضاً ونغلق
    if (slotCourseId && slotExamDate && slotStartTime && slotEndTime && slotBuilding && slotHall) {
      handleSaveSlot(e, false);
      return;
    }

    // إذا كانت الحقول فارغة لأن المستخدم أضاف مواده بالفعل عبر زر "حفظ وإضافة مادة أخرى"
    setIsSlotModalOpen(false);
    setToastMessage(
      currentSlots.length > 0
        ? `تم حفظ وتثبيت جدول الامتحانات بنجاح بمجموع (${currentSlots.length}) مواد امتحانية.`
        : 'تم إغلاق نافذة الجدول.'
    );
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🗑️ فتح كارد تأكيد حذف مادة من جدول الامتحانات
  const handleDeleteSlot = (slotId: string) => {
    const target = currentSlots.find((s) => s.id === slotId);
    if (target) {
      setDeletingSlot(target);
    }
  };

  // 🗑️ تنفيذ حذف مادة الامتحان بعد التأكيد
  const confirmExecuteDeleteSlot = () => {
    if (!currentSchedule || !deletingSlot) return;
    const updatedSlots = currentSlots.filter((s) => s.id !== deletingSlot.id);
    onSaveSchedule(currentSchedule, updatedSlots);
    setToastMessage(`تم حذف مادة (${deletingSlot.course_name}) من جدول الامتحانات بنجاح`);
    setDeletingSlot(null);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 🗑️ تنفيذ الحذف الجماعي للامتحانات المحددة
  const handleBulkDeleteSlots = () => {
    if (!currentSchedule || selectedSlotIds.length === 0) return;
    const count = selectedSlotIds.length;
    const updatedSlots = currentSlots.filter((s) => !selectedSlotIds.includes(s.id));
    onSaveSchedule(currentSchedule, updatedSlots);
    setSelectedSlotIds([]);
    setIsBulkDeleteModalOpen(false);
    setToastMessage(`تم حذف (${count}) مواد امتحانية من الجدول بنجاح`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 📤 تنفيذ إرسال الجدول للاعتماد والمصادقة إلى المسؤول العام بعد التأكيد
  const handleConfirmSubmitSchedule = () => {
    if (!currentSchedule || currentSlots.length === 0) {
      setToastMessage('يرجى إضافة مادة امتحانية واحدة على الأقل قبل الإرسال للاعتماد.');
      setTimeout(() => setToastMessage(''), 4000);
      setIsConfirmSubmitModalOpen(false);
      return;
    }

    const updatedSchedule: FinalExamSchedule = {
      ...currentSchedule,
      status: 'pending_approval',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveSchedule(updatedSchedule, currentSlots);
    setIsConfirmSubmitModalOpen(false);

    // إرسال إشعار فوري للمسؤول العام
    sendAppNotification({
      recipient_id: 'usr-admin-sadiq',
      recipient_role: 'super_admin',
      title: `طلب اعتماد جدول امتحانات نهائية - قسم ${departmentName}`,
      message: `قام (${currentUser.full_name}) بإرسال جدول الامتحانات النهائية للمرحلة ${getStageNameInArabic(selectedStage)} (${selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}) للاعتماد والمصادقة.`,
      type: 'system_announcement',
      link: '/admin/dashboard',
    });

    setToastMessage('تم إرسال جدول الامتحانات للمسؤول العام للاعتماد والمصادقة الرسمية بنجاح 🚀');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 🔄 تنفيذ إلغاء إرسال الجدول واسترجاعه كمسودة للتعديل بعد التأكيد
  const handleConfirmWithdrawSchedule = () => {
    if (!currentSchedule) return;

    const updatedSchedule: FinalExamSchedule = {
      ...currentSchedule,
      status: 'draft',
      submitted_at: undefined,
      updated_at: new Date().toISOString(),
    };

    onSaveSchedule(updatedSchedule, currentSlots);
    setIsConfirmWithdrawModalOpen(false);

    // إرسال إشعار للمسؤول العام بإلغاء الإرسال مؤقتاً
    sendAppNotification({
      recipient_id: 'usr-admin-sadiq',
      recipient_role: 'super_admin',
      title: `استرجاع مسودة جدول امتحانات - قسم ${departmentName}`,
      message: `قام (${currentUser.full_name}) بإلغاء إرسال جدول الامتحانات النهائية للمرحلة ${getStageNameInArabic(selectedStage)} واسترجاعه كمسودة لإجراء تعديلات إضافية.`,
      type: 'system_announcement',
      link: '/admin/dashboard',
    });

    setToastMessage('تم إلغاء الإرسال واسترجاع جدول الامتحانات كمسودة قيد الإعداد للتعديل بنجاح');
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 📥 تنزيل نموذج Excel معتمد لجدول الامتحانات
  const handleDownloadTemplate = async () => {
    try {
      await downloadFinalExamScheduleTemplate(departmentName, courses);
      setToastMessage('تم تنزيل نموذج إكسل المعتمد لجدول الامتحانات بنجاح! 📊');
      setTimeout(() => setToastMessage(''), 4000);
    } catch {
      setToastMessage('حدث خطأ أثناء تنزيل نموذج الإكسل.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  // 📤 استيراد ومعالجة ملف Excel لجدول الامتحانات
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      if (!rows || rows.length === 0) {
        setToastMessage('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.');
        setTimeout(() => setToastMessage(''), 4000);
        return;
      }

      const accepted: { courseName: string; stage: number; semester: number; examDate: string; time: string; hall: string }[] = [];
      const duplicates: { courseName: string; reason: string }[] = [];
      const rejected: { rowNumber: number; rawName: string; reason: string }[] = [];

      const newSlotsToAdd: FinalExamSlot[] = [];
      let tempAllSlots = [...slots];

      rows.forEach((row, index) => {
        const rowNum = index + 2;

        // استخراج القيم بمرونة تامة لدعم مختلف المسميات
        const rawCourseName = String(
          row['course_name'] || 
          row['اسم المادة الدراسية *'] || 
          row['اسم المادة الدراسية'] || 
          row['اسم المادة'] || 
          row['المادة'] || 
          ''
        ).trim();

        const rawCourseCode = String(
          row['course_code'] || 
          row['رمز المادة'] || 
          row['رمز المادة (الكود)'] || 
          row['الكود'] || 
          ''
        ).trim().toUpperCase();

        const rawDate = String(
          row['exam_date'] || 
          row['تاريخ الامتحان (YYYY-MM-DD) *'] || 
          row['تاريخ الامتحان'] || 
          row['التاريخ'] || 
          ''
        ).trim();

        const rawDay = String(
          row['exam_day'] || 
          row['اليوم'] || 
          row['اسم اليوم'] || 
          ''
        ).trim();

        const rawStage = Number(
          row['stage_number'] || 
          row['المرحلة (1-4) *'] || 
          row['المرحلة الدراسية (1-4) *'] || 
          row['المرحلة الدراسية'] || 
          row['المرحلة'] || 
          selectedStage
        );

        const rawSemester = Number(
          row['semester'] || 
          row['الكورس (1 أو 2) *'] || 
          row['الفصل (1 أو 2) *'] || 
          row['الفصل الدراسي'] || 
          row['الكورس'] || 
          selectedSemester
        );

        const rawStartTime = String(
          row['start_time'] || 
          row['وقت البدء (09:00) *'] || 
          row['وقت البدء'] || 
          row['من'] || 
          '09:00'
        ).trim();

        const rawEndTime = String(
          row['end_time'] || 
          row['وقت الانتهاء (12:00) *'] || 
          row['وقت الانتهاء'] || 
          row['إلى'] || 
          '12:00'
        ).trim();

        const rawDuration = Number(
          row['duration_hours'] || 
          row['المدة بالساعات *'] || 
          row['المدة'] || 
          3
        );

        const rawBuilding = String(
          row['building_name'] || 
          row['البناية الامتحانية *'] || 
          row['البناية'] || 
          'بناية الأقسام المركزية'
        ).trim();

        const rawHall = String(
          row['hall_name'] || 
          row['القاعة الامتحانية *'] || 
          row['القاعة'] || 
          'مدرج الخوارزمي (قاعة 101)'
        ).trim();

        const rawSupervisor = String(
          row['supervisor_name'] || 
          row['المشرف / رئيس القاعة'] || 
          row['المشرف'] || 
          ''
        ).trim();

        const rawNotes = String(
          row['notes'] || 
          row['ملاحظات خاصة'] || 
          row['ملاحظات'] || 
          ''
        ).trim();

        const rawStudyTypeStr = String(
          row['study_type'] || 
          row['الفترة'] || 
          row['الدراسة'] || 
          row['الفترة الدراسية'] || 
          ''
        ).trim().toLowerCase();

        const parsedStudyType: 'morning' | 'evening' | 'both' = 
          rawStudyTypeStr.includes('مسائ') ? 'evening' :
          (rawStudyTypeStr.includes('كلا') || rawStudyTypeStr.includes('معا') || (rawStudyTypeStr.includes('صباح') && rawStudyTypeStr.includes('مسائ'))) ? 'both' :
          'morning';

        // 1. تدقيق اسم المادة
        if (!rawCourseName || rawCourseName.length < 2) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawCourseName || 'حقل فارغ',
            reason: 'اسم المادة الدراسية فارغ أو غير صالح.',
          });
          return;
        }

        // 2. تدقيق تاريخ الامتحان
        if (!rawDate || rawDate.length < 8) {
          rejected.push({
            rowNumber: rowNum,
            rawName: rawCourseName,
            reason: 'تاريخ الامتحان فارغ أو مكتوب بصيغة غير صالحة.',
          });
          return;
        }

        // تدقيق رقم المرحلة والفصل
        const stageNum = [1, 2, 3, 4].includes(rawStage) ? rawStage : selectedStage;
        const semNum = (rawSemester === 2 ? 2 : 1) as 1 | 2;

        // مطابقة المادة في قائمة مواد القسم
        let matchedCourse = courses.find((c) => {
          if (rawCourseCode && c.code && c.code.toUpperCase() === rawCourseCode) return true;
          return c.name.trim().toLowerCase() === rawCourseName.toLowerCase();
        });

        if (!matchedCourse) {
          matchedCourse = courses.find((c) => c.name.includes(rawCourseName) || rawCourseName.includes(c.name));
        }

        const courseId = matchedCourse ? matchedCourse.id : `course-imp-${Date.now()}-${index}`;
        const finalCourseName = matchedCourse ? matchedCourse.name : rawCourseName;
        const finalCourseCode = matchedCourse ? matchedCourse.code : (rawCourseCode || 'GEN100');

        // تحديد اليوم الأسبوعي
        let dayOfWeek: DayOfWeek = 'saturday';
        try {
          const d = new Date(rawDate);
          const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const computedDay = days[d.getDay()];
          if (computedDay) dayOfWeek = computedDay;
        } catch {
          // fallback
        }
        if (rawDay) {
          const arDayMap: Record<string, DayOfWeek> = {
            'السبت': 'saturday',
            'الأحد': 'sunday',
            'الاحد': 'sunday',
            'الإثنين': 'monday',
            'الاثنين': 'monday',
            'الثلاثاء': 'tuesday',
            'الأربعاء': 'wednesday',
            'الاربعاء': 'wednesday',
            'الخميس': 'thursday',
            'الجمعة': 'friday',
          };
          if (arDayMap[rawDay]) dayOfWeek = arDayMap[rawDay];
        }

        // 3. فحص التكرار لنفس المرحلة والكورس والمادة
        const isDuplicate = tempAllSlots.some(
          (s) => 
            s.stage_number === stageNum && 
            (s.course_id === courseId || s.course_name.trim().toLowerCase() === finalCourseName.toLowerCase())
        );

        if (isDuplicate) {
          duplicates.push({
            courseName: finalCourseName,
            reason: `المادة مضافة مسبقاً في جدول المرحلة ${getStageNameInArabic(stageNum)}.`,
          });
          return;
        }

        // إنشاء البند الامتحاني
        const targetScheduleId = `sch-exam-${departmentId}-s${stageNum}-c${semNum}-${selectedAttempt}`;
        const newSlot: FinalExamSlot = {
          id: `slot-imp-${Date.now()}-${index}`,
          schedule_id: targetScheduleId,
          course_id: courseId,
          course_name: finalCourseName,
          course_code: finalCourseCode,
          stage_number: stageNum,
          exam_date: rawDate,
          exam_day: dayOfWeek,
          start_time: rawStartTime || '09:00',
          end_time: rawEndTime || '12:00',
          duration_hours: rawDuration || 3,
          building_name: rawBuilding || 'بناية الأقسام المركزية',
          hall_name: rawHall || 'مدرج الخوارزمي (قاعة 101)',
          supervisor_name: rawSupervisor || undefined,
          notes: rawNotes || undefined,
          study_type: parsedStudyType,
        };

        newSlotsToAdd.push(newSlot);
        tempAllSlots.push(newSlot);

        accepted.push({
          courseName: finalCourseName,
          stage: stageNum,
          semester: semNum,
          examDate: rawDate,
          time: `${rawStartTime} - ${rawEndTime}`,
          hall: `${rawBuilding} - ${rawHall}`,
        });
      });

      // حفظ البنود الجديدة
      if (newSlotsToAdd.length > 0) {
        const scheduleToSave = getOrCreateSchedule();
        const mergedSlots = [...slots, ...newSlotsToAdd];
        onSaveSchedule(scheduleToSave, mergedSlots);
        setToastMessage(`تم استيراد (${newSlotsToAdd.length}) مادة امتحانية إلى الجدول بنجاح! 📊🎉`);
        setTimeout(() => setToastMessage(''), 5000);
      }

      setImportReport({
        totalRows: rows.length,
        accepted,
        duplicates,
        rejected,
      });
      setActiveReportTab(accepted.length > 0 ? 'accepted' : (duplicates.length > 0 ? 'duplicates' : 'rejected'));

    } catch {
      setToastMessage('حدث خطأ أثناء قراءة ملف Excel، يرجى التأكد من اختيار ملف Excel صالح (.xlsx)');
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setIsImportingExcel(false);
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    }
  };

  // 📤 تصدير جدول الامتحانات (المحدد أو كامل الجدول) إلى Excel
  const handleExportExcelSchedule = async () => {
    const slotsToExport = selectedSlotIds.length > 0
      ? currentSlots.filter((s) => selectedSlotIds.includes(s.id))
      : currentSlots;

    if (slotsToExport.length === 0) {
      setToastMessage('لا توجد مواد امتحانية في هذا الجدول لتصديرها.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      await exportCustomFinalExamSlotsList(
        slotsToExport,
        departmentName,
        `المرحلة_${getStageNameInArabic(selectedStage)}`,
        selectedSemester === 1 ? 'الكورس_الأول' : 'الكورس_الثاني',
        selectedAttempt === 'first_attempt' ? 'الدور_الأول' : 'الدور_الثاني'
      );
      setToastMessage(`تم تصدير (${slotsToExport.length}) مادة امتحانية إلى Excel بنجاح! 📊`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch {
      setToastMessage('حدث خطأ أثناء تصدير ملف الإكسل.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  // 📄 تصدير وثيقة جدول الامتحانات الرسمية PDF A4 مع التواقيع الرسمية
  const handleExportSchedulePDF = async () => {
    if (currentSlots.length === 0) {
      setToastMessage('لا توجد مواد امتحانية في هذا الجدول لتصديرها.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      setIsExportingPDF(true);
      const success = await exportFinalExamSchedulePDF({
        departmentName,
        stageNumber: selectedStage,
        semester: selectedSemester,
        academicYear: getAcademicYear(),
        attemptType: selectedAttempt,
        slots: currentSlots,
        instructions: currentSchedule?.instructions || DEFAULT_EXAM_INSTRUCTIONS,
        headName: headName || 'رئيس القسم العلمي',
        rapporteurName: rapporteurName || 'مقرر القسم العلمي',
      });

      if (success) {
        setToastMessage('تم تصدير وثيقة جدول الامتحانات الرسمية PDF بنجاح! 📄');
      } else {
        setToastMessage('تعذر إتمام عملية تصدير الـ PDF.');
      }
      setIsExportingPDF(false);
      setTimeout(() => setToastMessage(''), 4000);
    } catch {
      setIsExportingPDF(false);
      setToastMessage('حدث خطأ أثناء تصدير ملف الـ PDF.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };



  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* 🔔 رسالة التنبيه العائمة الفاخرة في الصفحة (Floating Toast Notification) */}
      {toastMessage && (
        <div 
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[9999999] max-w-xl w-[90%] sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-950/95 text-white font-black text-base sm:text-lg rounded-2xl shadow-2xl border-2 border-slate-700/80 backdrop-blur-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-white font-black text-sm sm:text-base leading-snug">{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage('')} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="إغلاق التنبيه"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 🏛️ مركز التحكم والاعتماد لجداول الامتحانات الرسمية الموحد والأنيق */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">

        {/* السطر العلوي: العنوان الرسمي والشارات الأكاديمية وموقف الجدول */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          
          {/* الجانب الأيمن: الأيقونة والعنوان والوصف والشارات */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 border-2 border-slate-300 rounded-2xl shrink-0 text-slate-900 shadow-2xs">
              <FileText className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black">
                  قسم {departmentName}
                </span>
                <span className="px-3.5 py-1 bg-[#0F2942] text-white rounded-xl text-xs sm:text-sm font-black">
                  مسار بولونيا
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                إدارة واعتماد جداول الامتحانات النهائية الرسمية
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                إعداد المواعيد وتوزيع القاعات وسير عمل المصادقة المركزية مع المسؤول العام
              </p>
            </div>
          </div>

          {/* الجانب الأيسر: شارة موقف الجدول الحالية + زر مصفوفة القاعات المركزية */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-500">موقف الجدول:</span>
              {(!currentSchedule || currentSchedule.status === 'draft') && (
                <span className="px-3.5 py-2 bg-slate-100 text-slate-900 rounded-2xl text-xs sm:text-sm font-black border border-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>مسودة قيد الإعداد</span>
                </span>
              )}
              {currentSchedule?.status === 'pending_approval' && (
                <span className="px-3.5 py-2 bg-blue-50 text-blue-950 rounded-2xl text-xs sm:text-sm font-black border-2 border-blue-300 flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-4 h-4 text-blue-800" />
                  <span>قيد المصادقة من المسؤول العام</span>
                </span>
              )}
              {currentSchedule?.status === 'approved' && (
                <span className="px-3.5 py-2 bg-emerald-50 text-emerald-950 rounded-2xl text-xs sm:text-sm font-black border-2 border-emerald-400 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>معتمد ومصادق عليه رسمياً</span>
                </span>
              )}
              {currentSchedule?.status === 'rejected' && (
                <span className="px-3.5 py-2 bg-rose-50 text-rose-950 rounded-2xl text-xs sm:text-sm font-black border-2 border-rose-400 flex items-center gap-1.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>مرفوض ومطلوب التعديل</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCampusMatrixOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="عرض مصفوفة إشغال القاعات الامتحانية المركزية لكافة أقسام الكلية"
            >
              <Building2 className="w-4 h-4 text-slate-800" />
              <span>مصفوفة القاعات المركزية</span>
            </button>
          </div>

        </div>

        {/* السطر الأوسط: أشرطة تصفية المرحلة والكورس والدور بتنسيق أفقي متوازن */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          
          {/* 1. محدد المرحلة الدراسية (6 أعمدة) */}
          <div className="lg:col-span-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5">
            {[1, 2, 3, 4].map((stg) => {
              const stageSchedule = schedules.find(
                (s) =>
                  s.department_id === departmentId &&
                  s.stage_number === stg &&
                  s.semester === selectedSemester &&
                  s.attempt_type === selectedAttempt
              );
              const stageTotalCourses = courses.filter((c) => Number(c.stage_number || 1) === stg && (Number(c.semester) || 1) === Number(selectedSemester)).length;
              const stageSlotsCount = stageSchedule ? slots.filter((slot) => slot.schedule_id === stageSchedule.id).length : 0;
              const isSel = selectedStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => {
                    setSelectedStage(stg);
                    setSelectedSlotIds([]);
                  }}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSel ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-800 hover:bg-white'
                  }`}
                  title={`المرحلة ${getStageNameInArabic(stg)}: (${stageSlotsCount} امتحان مجدول من أصل ${stageTotalCourses} مادة في القسم)`}
                >
                  <span>المرحلة {getStageNameInArabic(stg)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                    isSel ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {stageSlotsCount} / {stageTotalCourses}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2. محدد الكورس الدراسي (3 أعمدة) */}
          <div className="lg:col-span-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5">
            {[1, 2].map((sem) => {
              const semSchedule = schedules.find(
                (s) =>
                  s.department_id === departmentId &&
                  s.stage_number === selectedStage &&
                  s.semester === sem &&
                  s.attempt_type === selectedAttempt
              );
              const semSlotsCount = semSchedule ? slots.filter((slot) => slot.schedule_id === semSchedule.id).length : 0;
              const isSel = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => {
                    setSelectedSemester(sem as 1 | 2);
                    setSelectedSlotIds([]);
                  }}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSel ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-800 hover:bg-white'
                  }`}
                >
                  <span>{sem === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                    isSel ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {semSlotsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. محدد الدور الامتحاني (3 أعمدة) */}
          <div className="lg:col-span-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedAttempt('first_attempt');
                setSelectedSlotIds([]);
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedAttempt === 'first_attempt' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-800 hover:bg-white'
              }`}
            >
              <Award className={`w-4 h-4 ${selectedAttempt === 'first_attempt' ? 'text-emerald-200' : 'text-emerald-700'}`} />
              <span>الدور الأول</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAttempt('second_attempt');
                setSelectedSlotIds([]);
              }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedAttempt === 'second_attempt' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-800 hover:bg-white'
              }`}
            >
              <Award className={`w-4 h-4 ${selectedAttempt === 'second_attempt' ? 'text-sky-300' : 'text-slate-700'}`} />
              <span>الدور الثاني</span>
            </button>
          </div>

        </div>

        {/* السطر السفلي: تفاصيل الجدول النشط وأزرار العمليات الأساسية */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700">
              الجدول المعروض: <strong className="text-slate-950 font-black font-sans">المرحلة {getStageNameInArabic(selectedStage)} — {selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} ({selectedAttempt === 'first_attempt' ? 'الدور الأول' : 'الدور الثاني'})</strong>
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-mono font-bold">
              {currentSlots.length} مواد
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 📄 زر تصدير جدول الامتحانات النهائي الرسمي A4 PDF */}
            <button
              type="button"
              onClick={handleExportSchedulePDF}
              disabled={isExportingPDF || currentSlots.length === 0}
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="تصدير جدول الامتحانات النهائي الرسمي A4 PDF"
            >
              {isExportingPDF ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-cyan-300" />
                  <span>تصدير الجدول (PDF)</span>
                </>
              )}
            </button>

            {/* 📊 زر تصدير جدول الامتحانات بصيغة Excel الفاخرة */}
            <button
              type="button"
              onClick={handleExportExcelSchedule}
              disabled={currentSlots.length === 0}
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              title="تصدير جدول الامتحانات الحالي إلى ملف Excel رسمي"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>{selectedSlotIds.length > 0 ? `تصدير المحدد (${selectedSlotIds.length}) إكسل` : 'تصدير الجدول (Excel)'}</span>
            </button>

            {/* ℹ️ زر تعليمات وضوابط الإكسل */}
            <button
              type="button"
              onClick={() => setShowExcelInstructions(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="عرض دليل وتعليمات استيراد جدول الامتحانات عبر ملف Excel"
            >
              <Info className="w-4 h-4 text-blue-700" />
              <span>تعليمات الإكسل</span>
            </button>

            {/* 📥 زر تنزيل نموذج إكسل معتمد */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="تنزيل نموذج ملف Excel معتمد لإدخال جدول الامتحانات"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>تنزيل نموذج إكسل</span>
            </button>

            {/* 📤 زر استيراد جدول من إكسل */}
            <label
              className={`px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
                isImportingExcel ? 'opacity-50 pointer-events-none' : ''
              }`}
              title="استيراد جدول الامتحانات من ملف Excel"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>{isImportingExcel ? 'جاري الاستيراد...' : 'استيراد جدول من إكسل'}</span>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                disabled={isImportingExcel}
                onChange={handleExcelUpload}
              />
            </label>

            {/* زر إضافة مادة امتحانية */}
            <button
              type="button"
              onClick={handleOpenAddSlot}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#16385c] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4 text-sky-300" />
              <span>إضافة مادة امتحانية</span>
            </button>

            {/* زر الإرسال للمصادقة أو إلغاء الإرسال واسترجاع المسودة */}
            {currentSchedule?.status === 'pending_approval' ? (
              <button
                type="button"
                onClick={() => setIsConfirmWithdrawModalOpen(true)}
                className="px-5 py-2.5 bg-rose-800 hover:bg-rose-900 border-2 border-rose-600 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs whitespace-nowrap"
                title="إلغاء طلب المصادقة واسترجاع الجدول كمسودة للتعديل"
              >
                <RotateCcw className="w-4 h-4 text-rose-200" strokeWidth={2.2} />
                <span>إلغاء الإرسال واسترجاع المسودة</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentSlots.length === 0) {
                    setToastMessage('يرجى إضافة مادة امتحانية واحدة على الأقل قبل الإرسال للمصادقة.');
                    setTimeout(() => setToastMessage(''), 4000);
                    return;
                  }
                  setIsConfirmSubmitModalOpen(true);
                }}
                disabled={currentSlots.length === 0}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs whitespace-nowrap"
              >
                <Send className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
                <span>إرسال للمسؤول العام للمصادقة</span>
              </button>
            )}

          </div>
        </div>

        {/* ملاحظات المسؤول العام في حال الرفض أو التوجيه */}
        {currentSchedule?.review_notes && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-1 text-rose-950 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-sm sm:text-base text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
              <span>ملاحظات وتوجيهات المسؤول العام على الجدول:</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-rose-900 pr-7 leading-relaxed">
              {currentSchedule.review_notes}
            </p>
          </div>
        )}

      </div>

      {/* 🔘 شريط الإجراءات الجماعية العائم للامتحانات المحددة */}
      {selectedSlotIds.length > 0 && (
        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-blue-800" />
            <span className="font-black text-blue-950 text-base sm:text-xl">
              تم تحديد <strong className="font-mono">{selectedSlotIds.length}</strong> مواد امتحانية
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcelSchedule}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              title="تصدير بيانات المواد المحددة إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>تصدير المحدد إلى Excel ({selectedSlotIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف المواد المحددة ({selectedSlotIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlotIds([])}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer whitespace-nowrap"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📋 جدول مواعيد وبنود الامتحانات بحدود ناعمة وتصميم عالي الوضوح */}
      <div className="bg-white rounded-3xl border border-slate-300 overflow-hidden shadow-xs">
        <div className="grid grid-cols-12 bg-slate-100 text-slate-950 border-b border-slate-300 p-4 text-base sm:text-xl font-black text-center items-center">
          <div className="col-span-1 flex items-center justify-center gap-1.5">
            <input
              type="checkbox"
              checked={currentSlots.length > 0 && currentSlots.every((s) => selectedSlotIds.includes(s.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSlotIds(currentSlots.map((s) => s.id));
                } else {
                  setSelectedSlotIds([]);
                }
              }}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              title="تحديد الكل"
            />
            <span>#</span>
          </div>
          <div className="col-span-2">اليوم والتاريخ</div>
          <div className="col-span-2">وقت الامتحان</div>
          <div className="col-span-3 text-right pr-2">المادة الدراسية</div>
          <div className="col-span-2">البناية والقاعة</div>
          <div className="col-span-2">الإجراءات</div>
        </div>

        {currentSlots.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 text-slate-950 font-black text-lg sm:text-xl space-y-2">
            <p>لا توجد مواد امتحانية مضافة لهذا الجدول بعد.</p>
            <p className="text-base font-black text-slate-700">اضغط على زر "إضافة مادة امتحانية" لبدء إعداد الجدول.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-300">
            {(() => {
              // 🔢 نحسب رقم الصفحة الآمن للمواد الامتحانية حتى نتجنب الخروج خارج الحدود
              const safeExamPage = Math.max(1, Math.min(examPage, Math.max(1, Math.ceil(currentSlots.length / examPageSize))));
              // ✂️ نقطع بنود الامتحانات لعرض ما يخص الصفحة الحالية فقط
              const paginatedSlots = currentSlots.slice((safeExamPage - 1) * examPageSize, safeExamPage * examPageSize);

              // 🔄 نعمل خريطة لعرض المواد الامتحانية في الصفحة الحالية
              return paginatedSlots.map((slot, idx) => {
                // 🔢 التسلسل التراكمي الحقيقي للمادة الامتحانية
                const actualIndex = (safeExamPage - 1) * examPageSize + idx;
                // ✅ فحص هل البند محدد
                const isSelected = selectedSlotIds.includes(slot.id);

                return (
                  <div key={slot.id} className={`grid grid-cols-12 items-center p-4 text-base sm:text-lg font-black transition ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}>
                    <div className="col-span-1 text-center font-black text-slate-950 font-mono flex items-center justify-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedSlotIds(selectedSlotIds.filter((id) => id !== slot.id));
                          } else {
                            setSelectedSlotIds([...selectedSlotIds, slot.id]);
                          }
                        }}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-base sm:text-lg">{actualIndex + 1}</span>
                    </div>

                    <div className="col-span-2 text-center font-bold">
                      <span className="text-slate-950 font-bold block text-xs sm:text-sm">{DAY_NAMES_MAP[slot.exam_day] || slot.exam_day}</span>
                      <span className="text-slate-800 text-xs sm:text-sm font-bold block font-mono mt-0.5">{slot.exam_date}</span>
                    </div>

                    <div className="col-span-2 text-center font-bold text-slate-950 font-mono text-xs sm:text-sm">
                      {slot.start_time} - {slot.end_time}
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 font-sans">({slot.duration_hours} س)</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-sans font-black border ${
                          slot.study_type === 'evening'
                            ? 'bg-slate-100 text-slate-900 border-slate-300'
                            : 'bg-sky-50 text-sky-950 border-sky-200'
                        }`}>
                          {slot.study_type === 'evening' ? 'مسائي' : 'صباحي'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 text-right pr-2">
                      <h4 className="font-black text-slate-950 text-base sm:text-lg leading-tight">{slot.course_name}</h4>
                      {slot.notes && (
                        <span className="text-sm sm:text-base font-black text-slate-800 block mt-1">
                          <span>{slot.notes}</span>
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="font-black text-emerald-950 block text-base sm:text-lg">{slot.building_name}</span>
                      <span className="font-black text-slate-950 block text-sm sm:text-base mt-0.5">{slot.hall_name}</span>
                    </div>

                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlot(slot)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-xl transition cursor-pointer border border-slate-300"
                        title="تعديل موعد المادة"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer border border-rose-200"
                        title="حذف من الجدول"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* 📑 شريط التنقل بين صفحات جدول المواد الامتحانية */}
        <AdminPagination
          currentPage={examPage}
          totalItems={currentSlots.length}
          pageSize={examPageSize}
          onPageChange={setExamPage}
          onPageSizeChange={setExamPageSize}
          itemLabel="مادة امتحانية"
          className="p-4 border-t border-slate-300 rounded-none rounded-b-3xl"
        />
      </div>

      {/* ========================================================================= */}
      {/* 🛡️ مصفوفة التعليمات والضوابط الامتحانية مع نظام CRUD كامل والتحديد المتعدد */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-2 border-slate-300 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs">
        
        {/* رأس قسم التعليمات وأزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck className="w-7 h-7 text-slate-900" />
              <h4 className="text-xl sm:text-2xl font-black text-slate-950">
                التعليمات والضوابط الامتحانية المعتمدة للامتحانات النهائية (مسار بولونيا):
              </h4>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-sm sm:text-base font-black font-mono">
                {activeInstructions.length} بنود معتمدة
              </span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-950 mt-1.5">
              يمكنك تحديد البنود، إضافة بنود جديدة، تعديل النصوص، حذف أي بند، أو تغيير ترتيب البنود لتظهر في جدول الامتحان الرسمي ونسخة الـ PDF
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* خيار تحديد الكل للتعليمات */}
            {activeInstructions.length > 0 && (
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition shadow-2xs">
                <input
                  type="checkbox"
                  checked={
                    activeInstructions.length > 0 &&
                    selectedInstructionIndexes.length === activeInstructions.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInstructionIndexes(activeInstructions.map((_, i) => i));
                    } else {
                      setSelectedInstructionIndexes([]);
                    }
                  }}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm sm:text-base font-black text-slate-950 select-none">
                  تحديد الكل ({activeInstructions.length})
                </span>
              </label>
            )}

            {/* زر إضافة بند جديد يفتح الكارد المنبثق */}
            <button
              type="button"
              onClick={() => setIsAddingInstructionModalOpen(true)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl text-base sm:text-lg font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة بند تعليمات جديد</span>
            </button>
          </div>
        </div>

        {/* 🔘 شريط الإجراءات الجماعية للبنود المحددة */}
        {selectedInstructionIndexes.length > 0 && (
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-6 h-6 text-blue-800" />
              <span className="font-black text-blue-950 text-base sm:text-xl">
                تم تحديد <strong className="font-mono">{selectedInstructionIndexes.length}</strong> بنود تعليمات
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteInstructionsModalOpen(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-base transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                <span>حذف البنود المحددة ({selectedInstructionIndexes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstructionIndexes([])}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-xl font-black text-base transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* 📋 شبكة بطاقات بنود التعليمات مع مربعات التحديد ونصوص كبيرة وواضحة جداً */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {activeInstructions.map((instruction, idx) => {
            const isSelected = selectedInstructionIndexes.includes(idx);

            return (
              <div 
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border transition flex items-start justify-between gap-4 group ${
                  isSelected 
                    ? 'bg-blue-50/80 border-2 border-blue-400 shadow-sm' 
                    : 'bg-white border-slate-300 shadow-2xs hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSelectedInstructionIndexes(selectedInstructionIndexes.filter((i) => i !== idx));
                      } else {
                        setSelectedInstructionIndexes([...selectedInstructionIndexes, idx]);
                      }
                    }}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mt-1"
                  />
                  <span className="w-9 h-9 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-base sm:text-xl font-black text-slate-950 leading-relaxed break-words">
                    {instruction}
                  </p>
                </div>

                {/* أزرار التحكم للبند: تقديم، تأخير، تعديل، حذف */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* تقديم للأعلى */}
                  <button
                    type="button"
                    onClick={() => handleMoveInstruction(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-20 rounded-lg transition cursor-pointer"
                    title="تقديم للأعلى"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>

                  {/* تأخير للأسفل */}
                  <button
                    type="button"
                    onClick={() => handleMoveInstruction(idx, 'down')}
                    disabled={idx === activeInstructions.length - 1}
                    className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-20 rounded-lg transition cursor-pointer"
                    title="تأخير للأسفل"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>

                  {/* تعديل */}
                  <button
                    type="button"
                    onClick={() => handleStartEditInstruction(idx)}
                    className="p-2 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-300 rounded-lg transition cursor-pointer"
                    title="تعديل هذا البند"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  {/* حذف */}
                  <button
                    type="button"
                    onClick={() => setDeletingInstructionIndex(idx)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition cursor-pointer"
                    title="حذف هذا البند"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            );
          })}

          {activeInstructions.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white border border-slate-300 rounded-2xl space-y-3">
              <p className="text-lg sm:text-xl font-black text-slate-950">لا توجد بنود تعليمات مضافة حالياً.</p>
              <button
                type="button"
                onClick={() => setIsAddingInstructionModalOpen(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-black transition cursor-pointer"
              >
                إضافة بند تعليمات جديد
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ➕ كارد منبثق لإضافة بند تعليمات جديد بخلفية بيضاء ناصعة و Z-999999 */}
      {isAddingInstructionModalOpen && (
        <div 
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" 
          dir="rtl"
        >
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl border border-slate-200">
                  <ShieldCheck className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    إضافة بند أو ضابط امتحاني جديد
                  </h3>
                  <p className="text-sm sm:text-base font-black text-slate-700 mt-0.5">
                    الامتحانات النهائية — مسار بولونيا
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingInstructionModalOpen(false);
                  setNewInstructionText('');
                }}
                className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddInstruction} className="space-y-4">
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-950 mb-2">
                  نص البند أو الضابط الامتحاني:
                </label>
                <textarea
                  value={newInstructionText}
                  onChange={(e) => setNewInstructionText(e.target.value)}
                  rows={4}
                  placeholder="اكتب نص البند الامتحاني هنا (مثال: يمنع مغادرة القاعة الامتحانية قبل مضي نصف الوقت المخصص)..."
                  required
                  className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-base sm:text-lg text-slate-950 focus:border-slate-900 focus:outline-none transition shadow-2xs leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingInstructionModalOpen(false);
                    setNewInstructionText('');
                  }}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-2xl font-black text-base transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black text-base transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>حفظ وإدراج البند</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ نافذة منبثقة لتعديل بند تعليمات محدد بخلفية بيضاء و Z-999999 */}
      {editingInstructionIndex !== null && (
        <div 
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto" 
          dir="rtl"
        >
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                <Edit3 className="w-6 h-6 text-slate-900" />
                <span>تعديل بند التعليمات الامتحانية #{editingInstructionIndex + 1}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingInstructionIndex(null);
                  setEditingInstructionText('');
                }}
                className="p-2 text-slate-700 hover:text-black rounded-xl transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedInstruction} className="space-y-4 text-base font-black">
              <div>
                <label className="block text-slate-950 font-black mb-2 text-base sm:text-lg">نص البند المعدل:</label>
                <textarea
                  value={editingInstructionText}
                  onChange={(e) => setEditingInstructionText(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-4 bg-white border-2 border-slate-300 rounded-2xl font-black text-base sm:text-lg text-slate-950 focus:border-slate-900 focus:outline-none transition shadow-2xs leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingInstructionIndex(null);
                    setEditingInstructionText('');
                  }}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-2xl font-black text-base transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black text-base transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪟 نافذة منبثقة عريضة مركزية بهيدر وفوتر ثابتين وبدون سكرول خارجي */}
      {/* ========================================================================= */}
      {isSlotModalOpen && (
        <div 
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-5 overflow-hidden" 
          dir="rtl"
          onClick={() => {
            setIsCourseDropdownOpen(false);
            setIsDayDropdownOpen(false);
          }}
        >
          <div 
            className="relative bg-white border-2 border-slate-300 rounded-3xl max-w-6xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* 🔔 تنبيه الكارد العائم الفاخر (Floating Smart Toast Alert) */}
            {modalAlert && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200 pointer-events-auto">
                <div className={`px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between gap-4 shadow-2xl backdrop-blur-xl border-2 ${
                  modalAlert.type === 'success' ? 'bg-[#064E3B]/95 text-emerald-100 border-emerald-400 ring-4 ring-emerald-500/20' :
                  modalAlert.type === 'error' ? 'bg-[#881337]/95 text-rose-100 border-rose-400 ring-4 ring-rose-500/20' :
                  'bg-[#0F172A]/95 text-sky-100 border-sky-400 ring-4 ring-sky-500/20'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {modalAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" strokeWidth={2.5} />}
                    {modalAlert.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" strokeWidth={2.5} />}
                    {modalAlert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-sky-300 shrink-0" strokeWidth={2.5} />}
                    <span className="leading-snug">{modalAlert.message}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setModalAlert(null)} 
                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                    title="إغلاق التنبيه"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 1. الترويسة العليا الثابتة (Fixed Header) مع شارات المرحلة والكورس والدور بنصوص واضحة وكبيرة */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 p-4 sm:px-7 sm:py-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl border border-slate-200">
                  <BookOpen className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    {editingSlotId ? 'تعديل موعد مادة الامتحان' : 'إضافة مادة لجدول الامتحانات النهائية'}
                  </h3>
                  <p className="text-sm sm:text-base font-black text-slate-800 mt-0.5">
                    قسم {departmentName} — مسار بولونيا
                  </p>
                </div>
              </div>

              {/* الشارات الملونة البارزة للمرحلة والكورس والدور في الهيدر */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-4 py-2 bg-[#0F2942] text-white rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 shadow-2xs">
                  <GraduationCap className="w-5 h-5 text-sky-300" />
                  <span>المرحلة {getStageNameInArabic(selectedStage)}</span>
                </span>
                <span className="px-4 py-2 bg-blue-900 text-white rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 shadow-2xs">
                  <BookOpen className="w-5 h-5 text-sky-200" />
                  <span>{selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}</span>
                </span>
                <span className="px-4 py-2 bg-emerald-800 text-white rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 shadow-2xs">
                  <BookmarkCheck className="w-5 h-5 text-emerald-200" />
                  <span>{selectedAttempt === 'first_attempt' ? 'الدور الأول' : 'الدور الثاني'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="p-2.5 text-slate-700 hover:text-black hover:bg-slate-100 rounded-2xl transition cursor-pointer mr-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* 2. جسم الكارد الأوسط (Content Body) */}
            <div className="p-4 sm:px-7 sm:py-5 overflow-y-auto flex-1 space-y-4">

              {/* شبكة التقسيم: النموذج على اليمين وقائمة المواد المضافة على اليسار */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* ========================================================================= */}
                {/* القسم الأيمن (8 أعمدة): نموذج الإدخال */}
                {/* ========================================================================= */}
                <div className="lg:col-span-8 space-y-3.5">
                  
                  {/* 🎛️ شريط التحكم واختيار المرحلة والكورس والدور والفترة التفاعلي الفاخر داخل الكارد */}
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 via-slate-100/70 to-slate-100 border-2 border-slate-200 rounded-3xl space-y-3 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
                      
                      {/* 1. المرحلة الدراسية (5 أعمدة) */}
                      <div className="md:col-span-5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-sky-800" strokeWidth={2.5} />
                            <span>المرحلة الدراسية</span>
                          </label>
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            المرحلة {getStageNameInArabic(selectedStage)}
                          </span>
                        </div>
                        {editingSlotId ? (
                          <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-950 text-center">
                            المرحلة {getStageNameInArabic(selectedStage)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {[1, 2, 3, 4].map((stg) => {
                              const stageTotalCourses = courses.filter((c) => Number(c.stage_number || 1) === stg && (Number(c.semester) || 1) === Number(selectedSemester)).length;
                              const isSel = selectedStage === stg;
                              return (
                                <button
                                  key={stg}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStage(stg);
                                    setSlotCourseId('');
                                    setModalAlert(null);
                                  }}
                                  className={`py-2 px-0.5 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                    isSel
                                      ? 'bg-[#0F2942] text-white shadow-sm ring-1 ring-[#0F2942]'
                                      : 'bg-transparent text-slate-800 hover:bg-white/80'
                                  }`}
                                  title={`المرحلة ${getStageNameInArabic(stg)} (${stageTotalCourses} مادة)`}
                                >
                                  <span className="leading-tight">{stg === 1 ? 'الأولى' : stg === 2 ? 'الثانية' : stg === 3 ? 'الثالثة' : 'الرابعة'}</span>
                                  <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono font-black ${
                                    isSel 
                                      ? 'bg-sky-400/25 text-sky-200 border border-sky-300/30' 
                                      : 'bg-slate-200/90 text-slate-700'
                                  }`}>
                                    {stageTotalCourses} مواد
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 2. الفصل / الكورس (2 أعمدة) */}
                      <div className="md:col-span-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-blue-800" strokeWidth={2.5} />
                            <span>الكورس</span>
                          </label>
                        </div>
                        {editingSlotId ? (
                          <div className="px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 text-center">
                            {selectedSemester === 1 ? 'الأول' : 'الثاني'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {([1, 2] as const).map((sem) => {
                              const semTotalCourses = courses.filter((c) => Number(c.stage_number || 1) === Number(selectedStage) && (Number(c.semester) || 1) === sem).length;
                              const isSel = selectedSemester === sem;
                              return (
                                <button
                                  key={sem}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSemester(sem);
                                    setSlotCourseId('');
                                    setModalAlert(null);
                                  }}
                                  className={`py-2 px-0.5 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    isSel
                                      ? 'bg-[#1E3A8A] text-white shadow-sm ring-1 ring-blue-900'
                                      : 'bg-transparent text-slate-800 hover:bg-white/80'
                                  }`}
                                >
                                  <span className="leading-tight">{sem === 1 ? 'الأول' : 'الثاني'}</span>
                                  <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono font-black ${
                                    isSel 
                                      ? 'bg-blue-300/25 text-sky-100 border border-blue-300/30' 
                                      : 'bg-slate-200/90 text-slate-700'
                                  }`}>
                                    {semTotalCourses}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 3. الدور الامتحاني (2 أعمدة) */}
                      <div className="md:col-span-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1">
                            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-800" strokeWidth={2.5} />
                            <span>الدور</span>
                          </label>
                        </div>
                        {editingSlotId ? (
                          <div className="px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 text-center">
                            {selectedAttempt === 'first_attempt' ? 'الأول' : 'الثاني'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {(['first_attempt', 'second_attempt'] as const).map((att) => {
                              const isSel = selectedAttempt === att;
                              return (
                                <button
                                  key={att}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAttempt(att);
                                    setModalAlert(null);
                                  }}
                                  className={`py-2 px-0.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 h-full ${
                                    isSel
                                      ? 'bg-[#065F46] text-white shadow-sm ring-1 ring-emerald-900'
                                      : 'bg-transparent text-slate-800 hover:bg-white/80'
                                  }`}
                                >
                                  <span>{att === 'first_attempt' ? 'الأول' : 'الثاني'}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 4. الفترة الدراسية (صباحي / مسائي) (3 أعمدة) */}
                      <div className="md:col-span-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-sky-800" strokeWidth={2.5} />
                            <span>الفترة الدراسية</span>
                          </label>
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {slotStudyType === 'morning' ? 'صباحي' : 'مسائي'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                          {(['morning', 'evening'] as const).map((st) => {
                            const isSel = slotStudyType === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  setSlotStudyType(st);
                                  setModalAlert(null);
                                }}
                                className={`py-2 px-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 h-full ${
                                  isSel
                                    ? 'bg-[#0F2942] text-white shadow-sm ring-1 ring-[#0F2942]'
                                    : 'bg-transparent text-slate-800 hover:bg-white/80'
                                }`}
                              >
                                <span>{st === 'morning' ? 'صباحي' : 'مسائي'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* شريط اختيار سريع للمواد المتبقية غير المضافة بعد */}
                  {!editingSlotId && unaddedCourses.length > 0 && (
                    <div className="p-3 bg-slate-100 border-2 border-slate-300 rounded-2xl flex items-center gap-2.5 flex-wrap text-base font-black">
                      <span className="text-slate-950 font-black text-sm sm:text-base">
                        <span>مواد مقترحة متبقية:</span>
                      </span>
                      {unaddedCourses.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSlotCourseId(c.id);
                            setModalAlert(null);
                            setIsCourseDropdownOpen(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer border-2 ${
                            slotCourseId === c.id 
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' 
                              : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3.5 text-base font-black">
                    
                    {/* السطر الأول: اختيار المادة الدراسية بقائمة منسدلة مخصصة فائقة الاحترافية */}
                    <div>
                      <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                        <span>المادة الدراسية:</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCourseDropdownOpen(!isCourseDropdownOpen);
                            setIsDayDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition cursor-pointer shadow-2xs ${
                            isCourseDropdownOpen ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300 hover:border-slate-400'
                          }`}
                          dir="rtl"
                        >
                          <span className={`truncate text-right ${slotCourseId ? 'text-slate-950 font-bold text-xs sm:text-sm' : 'text-slate-400 font-medium text-xs sm:text-sm'}`}>
                            {selectedCourse ? selectedCourse.name : 'اختر المادة الدراسية من القائمة...'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform duration-200 shrink-0 mr-1.5 ${isCourseDropdownOpen ? 'rotate-180 text-slate-900' : ''}`} />
                        </button>

                        {/* القائمة المنسدلة المخصصة المنبثقة باحترافية */}
                        {isCourseDropdownOpen && (
                          <div className="absolute top-full right-0 left-0 mt-1 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-2 py-1 text-xs font-black text-slate-700 bg-slate-100 rounded-lg flex items-center justify-between">
                              <span>مواد المرحلة {getStageNameInArabic(selectedStage)} ({selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}):</span>
                              <span className="font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-900 font-bold">{stageCourses.length} مادة</span>
                            </div>
                            {stageCourses.map((c) => {
                              const isSelected = slotCourseId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSlotCourseId(c.id);
                                    setModalAlert(null);
                                    setIsCourseDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-lg font-bold text-xs sm:text-sm text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                                    isSelected 
                                      ? 'bg-[#0F2942] text-white shadow-xs' 
                                      : 'text-slate-950 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="truncate font-black">{c.name}</span>
                                  {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                                </button>
                              );
                            })}
                            {stageCourses.length === 0 && (
                              <div className="p-3 text-center text-slate-700 font-bold text-xs sm:text-sm bg-slate-100 rounded-lg border border-slate-300">
                                لا توجد مواد مسجلة في (المرحلة {getStageNameInArabic(selectedStage)} - {selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'})
                              </div>
                            )}

                            {/* قسم المواد المسجلة في المراحل الأخرى لتسهيل الاختيار والتبديل التلقائي */}
                            {otherCourses.length > 0 && (
                              <div className="pt-2 mt-2 border-t border-slate-200">
                                <div className="px-2 py-1.5 text-xs font-black text-indigo-950 bg-indigo-50 rounded-lg flex items-center justify-between mb-1">
                                  <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-900 shrink-0" strokeWidth={2.5} />
                                    <span>مواد المراحل الأخرى في قسم {departmentName} (تبديل تلقائي):</span>
                                  </span>
                                  <span className="font-mono px-1.5 py-0.5 bg-indigo-200/70 text-indigo-950 rounded font-bold">{otherCourses.length} مادة</span>
                                </div>
                                {otherCourses.map((c) => {
                                  const cStage = Number(c.stage_number || 1);
                                  const cSem = (Number(c.semester) || 1) as 1 | 2;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedStage(cStage);
                                        setSelectedSemester(cSem);
                                        setSlotCourseId(c.id);
                                        setModalAlert({
                                          type: 'success',
                                          message: `تم اختيار مادة (${c.name}) والتبديل تلقائياً إلى (المرحلة ${getStageNameInArabic(cStage)} - ${cSem === 1 ? 'الكورس الأول' : 'الكورس الثاني'})!`
                                        });
                                        setIsCourseDropdownOpen(false);
                                      }}
                                      className="w-full p-2.5 rounded-lg font-bold text-xs sm:text-sm text-right transition cursor-pointer flex items-center justify-between gap-2 text-slate-900 hover:bg-indigo-50 hover:text-indigo-950"
                                      title={`اضغط لاختيار المادة والتبديل التلقائي إلى المرحلة ${getStageNameInArabic(cStage)}`}
                                    >
                                      <span className="truncate font-black text-slate-950">{c.name}</span>
                                      <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-full font-black shrink-0">
                                        المرحلة {getStageNameInArabic(cStage)} ({cSem === 1 ? 'كورس 1' : 'كورس 2'})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* السطر الثاني: التاريخ، اليوم، ووقت الامتحان بنصوص مصغرة وأنيقة */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* تاريخ الامتحان */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>تاريخ الامتحان:</span>
                        </label>
                        <input
                          type="date"
                          value={slotExamDate}
                          onChange={(e) => {
                            handleDateChange(e.target.value);
                            setModalAlert(null);
                          }}
                          required
                          className="w-full p-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:border-slate-900 focus:outline-none transition font-mono shadow-2xs"
                        />
                      </div>

                      {/* اليوم مع قائمة منسدلة مخصصة احترافية */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>اليوم:</span>
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDayDropdownOpen(!isDayDropdownOpen);
                              setIsCourseDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 bg-white border-2 rounded-xl font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between transition cursor-pointer shadow-2xs ${
                              isDayDropdownOpen ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300 hover:border-slate-400'
                            }`}
                            dir="rtl"
                          >
                            <span className="text-right">{DAY_NAMES_MAP[slotExamDay] || slotExamDay}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform duration-200 shrink-0 mr-1.5 ${isDayDropdownOpen ? 'rotate-180 text-slate-900' : ''}`} />
                          </button>

                          {/* القائمة المنسدلة المخصصة لليوم */}
                          {isDayDropdownOpen && (
                            <div className="absolute top-full right-0 left-0 mt-1 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                              {DAY_OPTIONS.map((d) => {
                                const isSelected = slotExamDay === d.value;
                                return (
                                  <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => {
                                      setSlotExamDay(d.value);
                                      setIsDayDropdownOpen(false);
                                    }}
                                    className={`w-full p-2 rounded-lg font-bold text-xs sm:text-sm text-right transition cursor-pointer flex items-center justify-between ${
                                      isSelected 
                                        ? 'bg-[#0F2942] text-white shadow-xs' 
                                        : 'text-slate-950 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{d.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* وقت البدء */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>وقت البدء:</span>
                        </label>
                        <input
                          type="time"
                          value={slotStartTime}
                          onChange={(e) => {
                            setSlotStartTime(e.target.value);
                            setModalAlert(null);
                          }}
                          placeholder="09:00"
                          required
                          className="w-full p-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:border-slate-900 focus:outline-none transition font-mono shadow-2xs"
                        />
                      </div>

                      {/* وقت الانتهاء */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>وقت الانتهاء:</span>
                        </label>
                        <input
                          type="time"
                          value={slotEndTime}
                          onChange={(e) => {
                            setSlotEndTime(e.target.value);
                            setModalAlert(null);
                          }}
                          placeholder="12:00"
                          required
                          className="w-full p-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:border-slate-900 focus:outline-none transition font-mono shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* السطر الثالث: البناية، القاعة، والمشرف بنصوص مصغرة وأنيقة */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* البناية */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>البناية الامتحانية:</span>
                        </label>
                        <input
                          type="text"
                          value={slotBuilding}
                          onChange={(e) => {
                            setSlotBuilding(e.target.value);
                            setModalAlert(null);
                          }}
                          placeholder="مثال: بناية الأقسام المركزية"
                          required
                          className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition shadow-2xs"
                        />
                      </div>

                      {/* القاعة والمدرج */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>القاعة / المدرج:</span>
                        </label>
                        <input
                          type="text"
                          value={slotHall}
                          onChange={(e) => {
                            setSlotHall(e.target.value);
                            setModalAlert(null);
                          }}
                          placeholder="مثال: مدرج الخوارزمي (قاعة 101)"
                          required
                          className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition shadow-2xs"
                        />
                      </div>

                      {/* المشرف أو رئيس اللجنة */}
                      <div>
                        <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-900" strokeWidth={2.2} />
                          <span>المشرف / رئيس اللجنة:</span>
                        </label>
                        <input
                          type="text"
                          value={slotSupervisor}
                          onChange={(e) => setSlotSupervisor(e.target.value)}
                          placeholder="اسم الأستاذ المشرف"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* السطر الرابع: ملاحظات وتنبيهات */}
                    <div>
                      <label className="block text-slate-950 font-black mb-1 text-xs sm:text-sm">
                        <span>ملاحظات وتنبيهات امتحانية (اختياري):</span>
                      </label>
                      <input
                        type="text"
                        value={slotNotes}
                        onChange={(e) => setSlotNotes(e.target.value)}
                        placeholder="مثال: يسمح باستخدام الآلة الحاسبة | امتحان نظري وعملي مدمج"
                        className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm placeholder:text-xs placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    {/* ⚠️ تنبيهات التضارب الامتحاني الحي */}
                    {liveConflicts.length > 0 && (
                      <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-1.5 text-rose-950 animate-in fade-in">
                        <div className="flex items-center gap-2 font-black text-base sm:text-lg text-rose-950">
                          <AlertTriangle className="w-6 h-6 text-rose-700 shrink-0" />
                          <span>تم رصد تضارب في المواعيد أو القاعات:</span>
                        </div>
                        <ul className="space-y-1 text-sm sm:text-base font-black text-rose-900 pr-5 list-disc">
                          {liveConflicts.map((c, i) => (
                            <li key={i}>{c.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </div>

                {/* ========================================================================= */}
                {/* القسم الأيسر (4 أعمدة): قائمة المواد المضافة في جدول هذه المرحلة مباشرة */}
                {/* ========================================================================= */}
                <div className="lg:col-span-4 bg-slate-50 border-2 border-slate-300 rounded-3xl p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-6 h-6 text-slate-900" />
                        <h4 className="font-black text-slate-950 text-base sm:text-lg">
                          المواد المضافة في الجدول
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-sm sm:text-base font-black font-mono">
                        {currentSlots.length} مواد
                      </span>
                    </div>

                    {/* قائمة بطاقات المواد المضافة */}
                    {currentSlots.length === 0 ? (
                      <div className="p-6 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-2.5">
                        <FileText className="w-7 h-7 text-slate-600 mx-auto" strokeWidth={2.2} />
                        <p className="text-base font-black text-slate-950">
                          لم يتم إضافة أي مادة لهذا الجدول بعد.
                        </p>
                        <p className="text-sm text-slate-700 font-black">
                          املأ بيانات المادة واضغط على زر "حفظ وإضافة مادة أخرى" لتظهر في هذه القائمة مباشرة.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {currentSlots.map((slot, i) => (
                          <div 
                            key={slot.id} 
                            className="p-3.5 bg-white border-2 border-slate-200 rounded-2xl shadow-2xs hover:border-blue-400 transition space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-[#0F2942] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="font-black text-slate-950 text-sm sm:text-base leading-snug break-words">
                                  {slot.course_name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1 text-xs font-black shadow-2xs active:scale-95"
                                title="حذف هذه المادة من الجدول"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-black">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-lg text-xs font-bold">
                                {DAY_NAMES_MAP[slot.exam_day] || slot.exam_day} | {slot.exam_date}
                              </span>
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-200 rounded-lg font-mono text-xs font-bold">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>

                            <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-start gap-1.5 pt-0.5">
                              <MapPin className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" strokeWidth={2.2} />
                              <span className="break-words leading-relaxed">{slot.building_name} — {slot.hall_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-sm font-black text-slate-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>تحديث فوري لجدول المرحلة فور الحفظ.</span>
                  </div>
                </div>

              </div>

            </div>

            {/* 3. الفوتر الثابت بالأسفل (Fixed Footer) مع 3 أزرار واضحة بنصوص كبيرة وأيقونات SVG نقية */}
            <div className="p-4 sm:px-7 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-950 rounded-2xl font-black text-base sm:text-lg transition cursor-pointer flex items-center gap-2"
              >
                <XCircle className="w-5 h-5 text-slate-700" strokeWidth={2.2} />
                <span>إلغاء</span>
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {/* زر 1: حفظ وإضافة مادة أخرى (يبقى المودال مفتوحاً وينتقل للمادة التالية) */}
                {!editingSlotId && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveSlot(e, true)}
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl font-black text-base sm:text-lg transition cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5 text-emerald-200" strokeWidth={2.2} />
                    <span>حفظ وإضافة مادة أخرى</span>
                  </button>
                )}

                {/* زر 2: إضافة هذه المادة وإغلاق */}
                <button
                  type="button"
                  onClick={(e) => handleSaveSlot(e, false)}
                  className="px-6 py-3 bg-[#0F2942] hover:bg-[#16385c] active:scale-95 text-white rounded-2xl font-black text-base sm:text-lg transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Save className="w-5 h-5" strokeWidth={2.2} />
                  <span>{editingSlotId ? 'تحديث وحفظ التعديلات' : 'إضافة هذه المادة وإغلاق'}</span>
                </button>

                {/* زر 3: حفظ وإغلاق الجدول */}
                {!editingSlotId && (
                  <button
                    type="button"
                    onClick={handleFinishAndCloseSchedule}
                    className="px-7 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl font-black text-base sm:text-lg transition cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
                    <span>حفظ وإغلاق الجدول</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🏛️ مصفوفة إشغال القاعات الامتحانية المركزية لكافة الأقسام */}
      <MasterCampusExamMatrixModal
        isOpen={isCampusMatrixOpen}
        onClose={() => setIsCampusMatrixOpen(false)}
        schedules={schedules}
        slots={slots}
        departments={getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS)}
      />

      {/* 🗑️ كارد تأكيد حذف مادة الامتحان النهائي الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingSlot}
        onClose={() => setDeletingSlot(null)}
        title="تأكيد حذف مادة من جدول الامتحانات"
        itemName={deletingSlot?.course_name || ''}
        itemDetails={`تاريخ الامتحان: ${deletingSlot?.exam_date || '—'} (${deletingSlot?.exam_day || ''}) | القاعة: ${deletingSlot?.hall_name || '—'} | التوقيت: ${deletingSlot?.start_time || ''} - ${deletingSlot?.end_time || ''}`}
        warningMessage="هل أنت متأكد من إزالة هذه المادة الامتحانية من جدول القسم؟ سيتم إلغاء حجز القاعة والمراقبين المرتبطين بهذا الموعد."
        onConfirm={confirmExecuteDeleteSlot}
      />

      {/* ⚠️ كارد تأكيد تجاوز التضارب الامتحاني المركزي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!pendingConflictData}
        onClose={() => setPendingConflictData(null)}
        title="تنبيه كشف تضارب امتحاني مركزي"
        itemName={pendingConflictData?.newSlot?.course_name || 'مادة امتحانية'}
        itemDetails={`القاعة: ${pendingConflictData?.newSlot?.hall_name || '—'} | التاريخ: ${pendingConflictData?.newSlot?.exam_date || '—'} | الوقت: ${pendingConflictData?.newSlot?.start_time || ''} - ${pendingConflictData?.newSlot?.end_time || ''}`}
        warningMessage={`تم رصد تضارب في إشغال القاعة أو المشرفين:\n${pendingConflictData?.warnMsgs || ''}\n\nهل ترغب في تأكيد الحفظ والمتابعة رغم هذا التضارب؟`}
        confirmText="تأكيد الحفظ والمتابعة"
        onConfirm={() => {
          if (pendingConflictData) {
            commitSlotSave(pendingConflictData.scheduleToUse, pendingConflictData.newSlot);
            setPendingConflictData(null);
          }
        }}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي للمواد الامتحانية المحددة */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="تأكيد حذف المواد الامتحانية المحددة دفعة واحدة"
        itemName={`${selectedSlotIds.length} مواد امتحانية`}
        itemDetails={`سيتم حذف كافة المواد الامتحانية المحددة (${selectedSlotIds.length} مادة) من جدول امتحانات المرحلة ${getStageNameInArabic(selectedStage)}.`}
        warningMessage="تحذير: سيتم إلغاء حجوزات القاعات والمشرفين المقترنة بهذه المواعيد فوراً."
        confirmText={`تأكيد حذف (${selectedSlotIds.length}) مادة`}
        onConfirm={handleBulkDeleteSlots}
      />

      {/* 🗑️ كارد تأكيد حذف بند تعليمات فردي */}
      <ConfirmDeleteModal
        isOpen={deletingInstructionIndex !== null}
        onClose={() => setDeletingInstructionIndex(null)}
        title="تأكيد حذف بند التعليمات الامتحانية"
        itemName={deletingInstructionIndex !== null ? (activeInstructions[deletingInstructionIndex] || '') : ''}
        itemDetails={`البند رقم (${deletingInstructionIndex !== null ? deletingInstructionIndex + 1 : ''}) في قائمة التعليمات والضوابط المعتمدة.`}
        warningMessage="هل أنت متأكد من رغبتك في حذف هذا البند من جدول الامتحانات الرسمية ونسخة الـ PDF؟"
        confirmText="تأكيد حذف البند"
        onConfirm={() => {
          if (deletingInstructionIndex !== null) {
            handleDeleteInstruction(deletingInstructionIndex);
            setDeletingInstructionIndex(null);
          }
        }}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي لبنود التعليمات المحددة */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteInstructionsModalOpen}
        onClose={() => setIsBulkDeleteInstructionsModalOpen(false)}
        title="تأكيد حذف بنود التعليمات المحددة دفعة واحدة"
        itemName={`${selectedInstructionIndexes.length} بنود تعليمات`}
        itemDetails={`سيتم حذف كافة بنود التعليمات والضوابط المحددة (${selectedInstructionIndexes.length} بنود) من جدول الامتحانات.`}
        warningMessage="هل أنت متأكد من حذف هذه البنود المحددة من جدول الامتحانات؟"
        confirmText={`تأكيد حذف (${selectedInstructionIndexes.length}) بنود`}
        onConfirm={handleBulkDeleteInstructions}
      />

      {/* 📤 كارد تأكيد إرسال جدول الامتحانات للمسؤول العام للمصادقة والاعتماد */}
      <ConfirmDeleteModal
        isOpen={isConfirmSubmitModalOpen}
        onClose={() => setIsConfirmSubmitModalOpen(false)}
        title="تأكيد إرسال الجدول للمسؤول العام للمصادقة"
        itemName={`قسم ${departmentName} — المرحلة ${getStageNameInArabic(selectedStage)}`}
        itemDetails={`${selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} (${selectedAttempt === 'first_attempt' ? 'الدور الأول' : 'الدور الثاني'}) | عدد المواد: ${currentSlots.length} مادة | بنود التعليمات: ${activeInstructions.length} بنود`}
        warningMessage="هل أنت متأكد من رغبتك في إرسال جدول الامتحانات النهائية للمسؤول العام للمراجعة والاعتماد الرسمي؟"
        warningNote="سيتم إشعار المسؤول العام فوراً، وسيتغير موقف الجدول إلى (قيد المراجعة والمصادقة من المسؤول العام)."
        confirmText="تأكيد وإرسال الجدول"
        cancelText="تراجع وإلغاء"
        variant="info"
        iconType="check"
        onConfirm={handleConfirmSubmitSchedule}
      />

      {/* 🔄 كارد تأكيد إلغاء الإرسال واسترجاع الجدول كمسودة للتعديل */}
      <ConfirmDeleteModal
        isOpen={isConfirmWithdrawModalOpen}
        onClose={() => setIsConfirmWithdrawModalOpen(false)}
        title="تأكيد إلغاء الإرسال واسترجاع الجدول كمسودة"
        itemName={`قسم ${departmentName} — المرحلة ${getStageNameInArabic(selectedStage)}`}
        itemDetails={`الموقف الحالي: قيد المراجعة والمصادقة من المسؤول العام | عدد المواد: ${currentSlots.length} مادة`}
        warningMessage="هل ترغب في إلغاء طلب المصادقة الحالي واسترجاع الجدول كمسودة لتتمكن من إضافة أو تعديل المواد والقاعات؟"
        warningNote="ستتم إعادة حالة الجدول إلى (مسودة قيد الإعداد) مع إشعار المسؤول العام بإلغاء الطلب واسترجاع المسودة."
        confirmText="تأكيد استرجاع المسودة"
        cancelText="إبقاء الطلب معلقاً"
        variant="primary"
        iconType="rotate"
        onConfirm={handleConfirmWithdrawSchedule}
      />

      {/* ℹ️ نافذة تعليمات وضوابط استيراد جدول الامتحانات عبر Excel */}
      {showExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <FileSpreadsheet className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    دليل وتعليمات استيراد جدول الامتحانات عبر Excel
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="p-2 text-slate-600 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-sm sm:text-base font-bold text-slate-900 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-950 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>1. تاريخ الامتحان (YYYY-MM-DD) *:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mr-6">
                  حقل إلزامي. اكتب التاريخ بصيغة السنة-الشهر-اليوم (مثال: 2026-09-08)، وسيقوم النظام بتحديد اليوم الأسبوعي تلقائياً.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-950 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>2. اسم المادة الدراسية *:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mr-6">
                  حقل إلزامي. اكتب اسم المادة الرسمي بالعربية مطابقاً لما هو مسجل في ورقة (قائمة_مواد_القسم) داخل ملف الإكسل.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-950 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>3. المرحلة الدراسية والفصل *:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mr-6">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الفصل (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-950 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>4. التوقيت والمدة *:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mr-6">
                  اكتب وقت البدء (مثال: 09:00) ووقت الانتهاء (مثال: 12:00) بنظام 24 ساعة، والمدة بالساعات (مثال: 3).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-950 font-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>5. البناية والقاعة الامتحانية *:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mr-6">
                  اكتب اسم البناية والقاعة (مثال: بناية الأقسام المركزية - مدرج الخوارزمي)، ويقوم النظام بالتحقق الفوري من عدم وجود تضارب مع قاعات باقي الأقسام.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer border border-slate-300 shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel لجدول الامتحانات */}
      {importReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <FileSpreadsheet className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد جدول الامتحانات ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600">
                    تم فحص وتدقيق بنود المواد والمواعيد وتجنب التضارب المكاني والزمني
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-600 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border-2 text-center transition cursor-pointer ${
                  activeReportTab === 'accepted'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                  {importReport.accepted.length}
                </div>
                <div className="text-xs sm:text-sm font-black mt-0.5">مواد مضافة بنجاح</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border-2 text-center transition cursor-pointer ${
                  activeReportTab === 'duplicates'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-2xl sm:text-3xl font-black font-mono text-blue-800">
                  {importReport.duplicates.length}
                </div>
                <div className="text-xs sm:text-sm font-black mt-0.5">مواد مكررة تم تجاوزها</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border-2 text-center transition cursor-pointer ${
                  activeReportTab === 'rejected'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-2xl sm:text-3xl font-black font-mono text-rose-700">
                  {importReport.rejected.length}
                </div>
                <div className="text-xs sm:text-sm font-black mt-0.5">صفوف مرفوضة</div>
              </button>
            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="border border-slate-200 rounded-2xl p-4 min-h-[160px] max-h-[40vh] overflow-y-auto bg-slate-50">
              {/* 1. قائمة المقبول */}
              {activeReportTab === 'accepted' && (
                <div className="space-y-2">
                  {importReport.accepted.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-bold text-sm">
                      لم يتم استيراد أي مادة جديدة في هذا الملف.
                    </div>
                  ) : (
                    importReport.accepted.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-black text-slate-950">{item.courseName}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold">
                            المرحلة {getStageNameInArabic(item.stage)} - الكورس {item.semester === 1 ? 'الأول' : 'الثاني'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
                          <span>{item.examDate}</span>
                          <span>({item.time})</span>
                          <span className="text-slate-900 font-sans font-bold">{item.hall}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 2. قائمة المكرر */}
              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  {importReport.duplicates.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-bold text-sm">
                      لا توجد أي مواد مكررة في الملف.
                    </div>
                  ) : (
                    importReport.duplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-700 shrink-0" />
                          <span className="font-black text-slate-950">{dup.courseName}</span>
                        </div>
                        <span className="text-blue-900 font-bold text-xs">{dup.reason}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. قائمة المرفوض */}
              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  {importReport.rejected.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-bold text-sm">
                      لا توجد أي صفوف مرفوضة في الملف.
                    </div>
                  ) : (
                    importReport.rejected.map((rej, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-mono text-slate-700 text-xs">صف #{rej.rowNumber}</span>
                          <span className="font-black text-slate-950">({rej.rawName})</span>
                        </div>
                        <span className="text-rose-800 font-bold text-xs">{rej.reason}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* أزرار الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                تم الفهم والإغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

