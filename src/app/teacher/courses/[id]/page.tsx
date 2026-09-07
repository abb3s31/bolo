'use client'; // ⚡ ينفذ بالعميل

// 📊 جدول إدخال وتعديل درجات الطلاب للمادة الكحلي الاستجابي 100% - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, use, useMemo } from 'react'; // 🔗 رياكت
import Link from 'next/link'; // 🔗 نكست للروابط
import { 
  getCurrentSessionUser, 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncAttendanceRecordsFromSupabase,
  saveMultipleAttendanceRecordsToSupabase,
  syncGradesFromSupabase,
  syncProfilesFromSupabase, // 👥 مزامنة حسابات الطلاب والأساتذة من السحابة
  saveMultipleGradesToSupabase,
  saveAuditLogToSupabase,
} from '@/lib/supabase-client'; // 🔌 الجلسة والمزامنة السحابية المباشرة
import { getStoredData, saveStoredData, INITIAL_GRADES, INITIAL_COURSES, INITIAL_DEPARTMENTS, INITIAL_TEACHER_COURSES, INITIAL_AUDIT_LOGS, INITIAL_SCHEDULE_LECTURES, INITIAL_ATTENDANCE_RECORDS, INITIAL_PROFILES, getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 💾 البيانات
import { Grade, Course, Department, TeacherCourse, UserProfile, AuditLog, ScheduleLecture, StudentAttendanceRecord, AttendanceStatus } from '@/types'; // 🔗 الأنواع الرسمية
import { calculateCourseworkTotal, calculateFinalTotal, getLetterGrade, getCourseAssessmentScheme, getCourseGradeLimits, getStageNameInArabic, isStudentPassedFirstRound, isStudentEligibleForSupplementary } from '@/lib/grade-utils'; // 🧮 الحسابات والحدود وأسماء المراحل وفحص استحقاق الدور الثاني
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { downloadTeacherGradeTemplate, downloadTeacherAttendanceTemplate, parseExcelFile } from '@/lib/excel-utils'; // 📊 ميزة الجداول المجدولة
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import { exportCourseGradeSheetPDF, exportCourseAttendanceSheetPDF } from '@/lib/pdf-export'; // 📄 مولد كشف درجات المادة وسجل الحضور PDF
import { DAYS_OF_WEEK_LIST } from '@/lib/schedule-utils'; // 🕒 أسماء الأيام
import { BookOpen, Download, Upload, ArrowRight, CheckCircle2, FileText, Lock, Shield, FlaskConical, AlertCircle, Info, Calendar, Clock, ClipboardList, CheckSquare, Square, History, Building2, GraduationCap, Users, DoorClosed, ShieldCheck, Sun, Moon, Send, BellRing, X, Check, RotateCcw, Sliders, ListFilter, Save, FileEdit, Scale, ChevronDown, ChevronUp, Award, Sparkles } from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { sanitizeGradeItem, sanitizeRouteParam } from '@/lib/security/sanitizer'; // 🧹 معقم درجات بولونيا ومسارات الروابط
import AttendanceSheetEditor from '@/components/attendance/AttendanceSheetEditor'; // 📋 محرر الحضور والغياب للأستاذ
import { TeacherAssessmentsManager } from '@/components/assessments/TeacherAssessmentsManager'; // 📚 مكون إدارة التكليفات والامتحانات الفصلية
import AttendanceNoticeModal, { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 نافذة التبليغات والتنبيهات الذكية

// 📋 واجهة مسودة التعديل ومقارنة الدرجة السابقة بالحديثة
export interface PendingGradeDiff {
  gradeId: string; // 🆔 معرف سجل الدرجة
  studentId: string; // 👤 معرف الطالب
  studentName: string; // 🏷️ اسم الطالب الرباعي
  fieldName: keyof Grade; // 📝 مفتاح الحقل المعدل
  fieldLabelAr: string; // 🔤 اسم البند بالعربية
  oldValue: number; // ⏪ الدرجة السابقة قبل التعديل
  newValue: number; // ⏩ الدرجة الحديثة المقترحة
  delta: number; // 📈 فارق التغيير (+ / -)
}

export default function TeacherCourseGradesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params); // 🔗 فك بارامتر المعرف للمادة
  const courseId = sanitizeRouteParam(resolvedParams.id, 'course-1');

  // 📌 الحالات
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [courseLectures, setCourseLectures] = useState<ScheduleLecture[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<TeacherCourse[]>([]);
  const [activeCourseTab, setActiveCourseTab] = useState<'grades' | 'attendance' | 'audit' | 'assessments'>('grades');
  const [filterStudyType, setFilterStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 فلترة الصباحي والمسائي
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false); // ⏳ حالة تصدير PDF
  const [isExportingAttendancePDF, setIsExportingAttendancePDF] = useState(false); // ⏳ حالة تصدير سجل الحضور
  const [excelPreviewRows, setExcelPreviewRows] = useState<Record<string, string | number>[] | null>(null);
  const [showExcelInstructions, setShowExcelInstructions] = useState<boolean>(false); // ℹ️ حالة فتح نافذة تعليمات وضوابط الإكسل للدرجات
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false); // ⏳ حالة معالجة وقراءة ملف إكسل الدرجات

  // 📝 حالات نظام مسودات الدرجات والمقارنة وحفظ/إلغاء التعديلات
  const [initialGradesSnapshot, setInitialGradesSnapshot] = useState<Grade[]>([]); // 📸 لقطة الدرجات الأصلية للمقارنة والتراجع
  const [pendingDiffs, setPendingDiffs] = useState<Record<string, PendingGradeDiff>>({}); // ⚖️ خريطة التعديلات المعلقة
  const [isPendingDiffModalOpen, setIsPendingDiffModalOpen] = useState<boolean>(false); // 📋 نافذة مراجعة الفروقات
  const [isBulkGradeModalOpen, setIsBulkGradeModalOpen] = useState<boolean>(false); // 🎯 نافذة الرصد الموحد للمحددين
  const [bulkSelectedField, setBulkSelectedField] = useState<keyof Grade>('quiz1'); // 📌 الحقل المختار للرصد الموحد
  const [isBulkFieldDropdownOpen, setIsBulkFieldDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح القائمة المنسدلة المخصصة
  const [bulkGradeValue, setBulkGradeValue] = useState<string>(''); // 🔢 قيمة الدرجة الموحدة
  const [isSavingPendingGrades, setIsSavingPendingGrades] = useState<boolean>(false); // ⏳ حالة جاري الحفظ

  // 🏛️ حالات أسماء رئيس القسم والمقرر الأكاديميين للتواقيع الرسمية
  const [departmentHeadName, setDepartmentHeadName] = useState<string>('رئاسة القسم العلمي');
  const [rapporteurName, setRapporteurName] = useState<string>('مقررية القسم العلمي');

  // 📋 حالات أدوات ونوافذ تبويب الحضور والغياب
  const [showAttendanceInstructions, setShowAttendanceInstructions] = useState<boolean>(false); // ℹ️ تعليمات الحضور
  const [isAttendanceExcelUpload, setIsAttendanceExcelUpload] = useState<boolean>(false); // ⏳ رفع إكسل الحضور
  const [attendanceExcelPreviewRows, setAttendanceExcelPreviewRows] = useState<Record<string, string | number>[] | null>(null); // 📋 معاينة إكسل الحضور

  // 📝 🛡️ حالات تعليمات التكليفات والأمان
  const [showAssessmentInstructions, setShowAssessmentInstructions] = useState<boolean>(false); // ℹ️ تعليمات التكليفات
  const [showAuditInstructions, setShowAuditInstructions] = useState<boolean>(false); // ℹ️ تعليمات الأمان

  // 🗓️ حالة العام الدراسي المعتمد والمتزامن
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🔘 حالات التحديد المتعدد والتبليغات في جدول السعيات
  const [selectedGradeStudentIds, setSelectedGradeStudentIds] = useState<string[]>([]);
  const [isGradeNoticeModalOpen, setIsGradeNoticeModalOpen] = useState<boolean>(false);
  const [gradeNoticeTargetStudent, setGradeNoticeTargetStudent] = useState<UserProfile | null>(null);
  const [gradeNoticeDefaultCategory, setGradeNoticeDefaultCategory] = useState<AttendanceNoticeCategory>('general_announcement');

  // 🔄 تحميل البيانات الأولية ومزامنة العام الدراسي وتهيئة سجلات الدرجات تلقائياً
  useEffect(() => {
    const loadCourseData = () => {
      // 👤 جلب بيانات المستخدم الحالي
      const user = getCurrentSessionUser(); // مستخدم الجلسة
      setCurrentUser(user);

      // 💾 جلب كافة المواد والأقسام والتكليفات والبروفايلات من التخزين المحلي
      const allCourses = getStoredData<Course[]>('courses', INITIAL_COURSES); // 📚 المواد المتاحة
      const allDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 🏢 الأقسام
      const allTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES); // 📋 التكليفات
      const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👥 حسابات المستخدمين

      // 🔤 دالة تطبيع النصوص لمطابقة المادة بدقة بدون مشاكل الهمزات
      const normText = (s?: string) => {
        if (!s) return '';
        return s.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ئ/g, 'ي').replace(/ؤ/g, 'و').replace(/[^\p{L}\p{N}]/gu, '');
      };

      const targetDecoded = decodeURIComponent(courseId).trim();
      const targetNorm = normText(targetDecoded);

      // 🔍 البحث عن التكليف المطابق لمادة الأستاذ
      const matchedTC = allTCs.find(
        (tc) =>
          tc.course_id === courseId ||
          tc.id === courseId ||
          (tc.course_name && normText(tc.course_name) === targetNorm)
      );

      // 🔍 البحث عن المادة في جدول المواد
      let foundCourse = allCourses.find(
        (c) =>
          c.id === courseId ||
          c.code?.toLowerCase().trim() === targetDecoded.toLowerCase() ||
          (c.name && normText(c.name) === targetNorm) ||
          (matchedTC && (c.id === matchedTC.course_id || c.code === matchedTC.course_id || (c.name && normText(c.name) === normText(matchedTC.course_name))))
      );

      // 🌟 في حال كانت المادة مسندة ولكن غير موجودة بكامل بياناتها، ننشئ كائناً متكاملاً
      if (!foundCourse && matchedTC) {
        foundCourse = {
          id: matchedTC.course_id || matchedTC.id,
          stage_id: `stage-${matchedTC.department_id || user?.department_id || 'dept-1'}-1`,
          academic_year_id: 'year-2026',
          name: matchedTC.course_name || targetDecoded || 'مادة دراسية معتمدة',
          code: matchedTC.course_id || 'CRS-01',
          department_id: matchedTC.department_id || user?.department_id || '',
          department_name: user?.department_name || 'هندسة تقنيات الحاسوب',
          stage_number: 1,
          semester: matchedTC.semester || 1,
          credit_hours: 3,
          course_type: 'theory_only',
          created_at: matchedTC.created_at || new Date().toISOString(),
        };
      }

      if (!foundCourse) {
        foundCourse = allCourses[0];
      }

      // 🏢 استخراج وتثبيت اسم القسم الحقيقي للأستاذ المسجل بالجلسة بدقة 100%
      const teacherDept = allDepts.find(
        (d) =>
          (user && (d.id === user.department_id || d.name === user.department_name || (user.department_name && (d.name.includes(user.department_name.replace(/^قسم\s+/, '')) || user.department_name.includes(d.name)))))
      );
      
      const teacherRealDeptName = (user?.department_name || teacherDept?.name || foundCourse?.department_name || 'اللغة الإنجليزية').replace(/^قسم\s+/, '').trim();
      const teacherRealDeptId = user?.department_id || teacherDept?.id || foundCourse?.department_id || 'dept-8';

      // 👨‍🏫 استخراج أسماء أساتذة النظري والعملي المكلفين رسمياً للمادة
      const courseTCs = allTCs.filter(
        (tc) =>
          tc.course_id === foundCourse?.id ||
          tc.course_id === foundCourse?.code ||
          (tc.course_name && normText(tc.course_name) === targetNorm)
      );

      const theoryTC = courseTCs.find((tc) => tc.role_in_course === 'theory' || tc.role_in_course === 'both') || (matchedTC?.role_in_course !== 'practical' ? matchedTC : undefined);
      const practicalTC = courseTCs.find((tc) => tc.role_in_course === 'practical' || tc.role_in_course === 'both') || (matchedTC?.role_in_course !== 'theory' ? matchedTC : undefined);

      const resolvedTheoryTeacherName = 
        foundCourse?.theory_teacher_name ||
        theoryTC?.teacher_name ||
        (theoryTC?.teacher_id && allProfiles.find((p) => p.id === theoryTC.teacher_id)?.full_name) ||
        (user?.role === 'teacher' ? user.full_name : '') ||
        'قيد التكليف من القسم';

      const resolvedPracticalTeacherName =
        foundCourse?.practical_teacher_name ||
        practicalTC?.teacher_name ||
        (practicalTC?.teacher_id && allProfiles.find((p) => p.id === practicalTC.teacher_id)?.full_name) ||
        (user?.role === 'teacher' && (foundCourse?.course_type === 'theory_and_practical' || foundCourse?.has_practical) ? user.full_name : '') ||
        'قيد التكليف من القسم';

      if (foundCourse) {
        const isCoursePractical = Boolean(
          foundCourse.has_practical || 
          foundCourse.course_type === 'theory_and_practical' || 
          practicalTC
        );

        foundCourse = {
          ...foundCourse,
          theory_teacher_name: resolvedTheoryTeacherName,
          theory_teacher_id: foundCourse.theory_teacher_id || theoryTC?.teacher_id || user?.id,
          practical_teacher_name: isCoursePractical ? resolvedPracticalTeacherName : undefined,
          practical_teacher_id: isCoursePractical ? (foundCourse.practical_teacher_id || practicalTC?.teacher_id || (practicalTC?.role_in_course === 'both' ? user?.id : undefined)) : undefined,
          department_name: teacherRealDeptName,
          department_id: teacherRealDeptId,
        };
      }

      setCourse(foundCourse);

      // 🏛️ استخراج أسماء رئيس القسم والمقرر الحقيقيين للقسم الأكاديمي الحالي
      const deptHeadUser = allProfiles.find(
        (p) =>
          p.role === 'department_head' &&
          (p.department_id === teacherRealDeptId ||
            (p.department_name && p.department_name.replace(/^قسم\s+/, '').trim() === teacherRealDeptName))
      );

      const deptRapporteurUser = allProfiles.find(
        (p) =>
          p.role === 'rapporteur' &&
          (p.department_id === teacherRealDeptId ||
            (p.department_name && p.department_name.replace(/^قسم\s+/, '').trim() === teacherRealDeptName))
      );

      setDepartmentHeadName(deptHeadUser?.full_name || 'رئاسة القسم العلمي');
      setRapporteurName(deptRapporteurUser?.full_name || 'مقررية القسم العلمي');

      // 👥 استخراج وحصر طلاب المادة في القسم والمرحلة الحقيقية للأستاذ
      const targetDeptId = teacherRealDeptId;
      const targetDeptName = teacherRealDeptName;
      const targetStage = Number(foundCourse?.stage_number) || 1;

      // 1. البحث أولاً عن طلاب القسم في نفس مرحلة المادة
      let matchedStudents = allProfiles.filter(
        (u) =>
          u.role === 'student' &&
          (u.department_id === targetDeptId ||
           (u.department_name && u.department_name.replace(/^قسم\s+/, '').trim() === targetDeptName)) &&
          (Number(u.stage_number) === targetStage)
      );

      // 2. إذا لم يكن هناك طلاب مسجلين في هذا القسم والمرحلة، تبقى القائمة فارغة 100% بدون أي توليد وهمي

      // 🧮 جلب سجلات الدرجات الحالية وتحديث المجاميع تلقائياً وفق حالة تفعيل الدورين الأول والثاني للمادة
      const allGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
      const isCourseSupActive = foundCourse.is_supplementary_exam_enabled === true; // 🔄 هل الدور الثاني مفعل؟
      const isCourseFinalActive = foundCourse.is_final_exam_enabled === true; // 🎯 هل الامتحان النهائي الدور الأول مفعل؟
      const courseGrades = allGrades
        .filter((g) => g.course_id === foundCourse.id)
        .map((g) => {
          const coursework = calculateCourseworkTotal(g); // 📝 حساب السعي التكويني
          const finalTot = isCourseFinalActive ? calculateFinalTotal(g, isCourseSupActive) : coursework; // 💯 احتساب المجموع
          const letter = isCourseFinalActive ? getLetterGrade(finalTot) : 'بانتظار الفاينل'; // 🅰️ التقدير الأكاديمي
          return {
            ...g,
            final_coursework_total: coursework,
            final_total: finalTot,
            letter_grade: letter,
          };
        });

      // 🎲 التهيئة التلقائية الذكية: توليد سجل درجات فوري لكل طالب ليس لديه سجل للمادة
      let finalCourseGrades: Grade[] = [...courseGrades];
      if (matchedStudents.length > 0) {
        const missingStudents = matchedStudents.filter(
          (std) => !courseGrades.some((g) => g.student_id === std.id || (std.university_number && g.university_number === std.university_number))
        );

        if (missingStudents.length > 0) {
          const newGradeRecords: Grade[] = missingStudents.map((std, idx) => ({
            id: `grade-${std.id}-${foundCourse.id}`,
            student_id: std.id,
            student_name: std.full_name,
            // 🎓 توليد رقم جامعي يبدأ بعام 2026 للعام الدراسي الجديد
            university_number: std.university_number || `2026-${idx + 101}`,
            course_id: foundCourse.id,
            course_name: foundCourse.name,
            teacher_id: foundCourse.theory_teacher_id || user?.id || 'teacher-1',
            department_id: targetDeptId,
            academic_year_id: 'year-2026',
            semester: (foundCourse.semester as 1 | 2) || 1,
            quiz1: 0,
            quiz2: 0,
            assignment1: 0,
            assignment2: 0,
            report: 0,
            midterm: 0,
            practical: 0,
            final_coursework_total: 0,
            final_exam: 0,
            final_total: 0,
            letter_grade: 'F',
            is_locked: false,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }));

          finalCourseGrades = [...finalCourseGrades, ...newGradeRecords];
          const updatedAllGrades = [
            ...allGrades.filter((g) => g.course_id !== foundCourse.id),
            ...finalCourseGrades,
          ];
          saveStoredData('grades', updatedAllGrades);
        }
      }
      setGrades(finalCourseGrades);
      setInitialGradesSnapshot((prev) => (prev.length === 0 ? JSON.parse(JSON.stringify(finalCourseGrades)) : prev));

      // ☁️ مزامنة حية للدرجات من Supabase لضمان دقة السعي
      syncGradesFromSupabase().then((liveGrades) => {
        if (liveGrades && liveGrades.length > 0) {
          const liveCourseGrades = liveGrades.filter((g) => g.course_id === foundCourse.id);
          if (liveCourseGrades.length > 0) {
            setGrades(liveCourseGrades);
            setInitialGradesSnapshot(JSON.parse(JSON.stringify(liveCourseGrades)));
          }
        }
      }).catch(() => {});

      // 📋 سجل العمليات والأمان
      setAuditLogs(getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS));

      // 🗓️ المحاضرات المجدولة
      const allLectures = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES);
      const matchedLectures = allLectures.filter(
        (l) => l.course_id === foundCourse.id || (foundCourse.code && l.course_code === foundCourse.code) || (foundCourse.name && l.course_name === foundCourse.name)
      );
      setCourseLectures(matchedLectures);

      // 📋 سجلات الحضور والغياب
      const allAttendance = getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);
      setAttendanceRecords(allAttendance);

      // 📚 التكليفات المسندة للأستاذ
      const teacherAssigned = allTCs.filter((tc) => tc.teacher_id === user?.id || tc.course_id === foundCourse.id);
      const isCoursePractical = Boolean(foundCourse.has_practical || foundCourse.course_type === 'theory_and_practical');
      setAssignedCourses(teacherAssigned.length > 0 ? teacherAssigned : [{
        id: `tc-${foundCourse.id}`,
        teacher_id: user?.id || 'usr-teacher-1',
        teacher_name: user?.full_name || 'أستاذ المادة',
        course_id: foundCourse.id,
        course_name: foundCourse.name,
        department_id: foundCourse.department_id,
        role_in_course: isCoursePractical ? 'both' : 'theory',
        semester: (foundCourse.semester || 1) as 1 | 2,
        created_at: new Date().toISOString(),
      }]);
    };

    // 🚀 التحميل الأولي الفوري
    loadCourseData();

    // ☁️ جلب ومزامنة العام الدراسي من السحابة
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setAcademicYear(liveYear);
      }).catch(() => {});
    }

    // 📋 مزامنة سجلات الحضور حياً من سحابة Supabase
    if (typeof syncAttendanceRecordsFromSupabase === 'function') {
      syncAttendanceRecordsFromSupabase().then((liveAttendance) => {
        if (liveAttendance && liveAttendance.length > 0) {
          setAttendanceRecords(liveAttendance);
        }
      }).catch(() => {});
    }

    // 👥 مزامنة حية لحسابات الطلاب والأساتذة من السحابة
    if (typeof syncProfilesFromSupabase === 'function') {
      syncProfilesFromSupabase().then((liveProfiles) => {
        if (liveProfiles && liveProfiles.length > 0) {
          loadCourseData();
        }
      }).catch(() => {});
    }

    // 📡 الاشتراك بالبث اللحظي للعام الدراسي
    let unsubscribeYear: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }

    // 🔔 الاستماع للأحداث اللحظية لتحديث الطلاب والدرجات وسجلات الحضور فورياً
    const handleSyncEvent = () => {
      loadCourseData();
    };

    window.addEventListener('profiles_updated', handleSyncEvent);
    window.addEventListener('grades_updated', handleSyncEvent);
    window.addEventListener('courses_updated', handleSyncEvent);
    window.addEventListener('teacher_courses_updated', handleSyncEvent);
    window.addEventListener('attendance_updated', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    return () => {
      if (unsubscribeYear) unsubscribeYear();
      window.removeEventListener('profiles_updated', handleSyncEvent);
      window.removeEventListener('grades_updated', handleSyncEvent);
      window.removeEventListener('courses_updated', handleSyncEvent);
      window.removeEventListener('teacher_courses_updated', handleSyncEvent);
      window.removeEventListener('attendance_updated', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
    };
  }, [courseId]);

  // 🧭 1. قراءة التبويب والصفحة المحددة من رابط الـ URL ومزامنتها مع أزرار الرجوع والتقدم بالمتصفح
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'grades' || tabParam === 'attendance' || tabParam === 'audit' || tabParam === 'assessments') {
        setActiveCourseTab(tabParam);
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, []);

  // 🧭 2. دالة التبديل بين التبويبات وتحديث رابط الـ URL تلقائياً في شريط العنوان
  const handleTabChange = (newTab: 'grades' | 'attendance' | 'audit' | 'assessments') => {
    setActiveCourseTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({ tab: newTab }, '', url.toString());
    }
  };

  // 🏷️ 3. تحديث عنوان تبويب المتصفح (Browser Tab Title) ديناميكياً بحسب اسم المادة والتبويب النشط
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const courseName = course?.name || 'المادة الدراسية';
    const deptTitle = course?.department_name ? `قسم ${course.department_name}` : 'جامعة الإمام جعفر الصادق (ع)';
    
    let tabTitle = 'سجل رصد وتقييم الدرجات';
    if (activeCourseTab === 'attendance') {
      tabTitle = 'إدارة وسجل الحضور والغياب';
    } else if (activeCourseTab === 'assessments') {
      tabTitle = 'التكليفات والامتحانات الفصلية';
    } else if (activeCourseTab === 'audit') {
      tabTitle = 'سجل العمليات والأمان الأكاديمي';
    }

    document.title = `${tabTitle} — مادة ${courseName} (${deptTitle}) | جامعة الإمام جعفر الصادق (ع)`;
  }, [activeCourseTab, course]);

  // 🛡️ حماية الأستاذ من فقدان المسودة غير المحفوظة عند مغادرة أو تحديث الصفحة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingDiffs).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingDiffs]);

  // 🎛️ استخراج المخطط التقييمي المخصص للمادة وحدود الدرجات
  const assessmentScheme = getCourseAssessmentScheme(course);
  const gradeLimits = getCourseGradeLimits(course);
  const isPracticalCourse = course?.course_type === 'theory_and_practical' || course?.has_practical;
  const isSupplementaryEnabled = course?.is_supplementary_exam_enabled === true; // 🔄 هل فترة رصد درجات الدور الثاني مفعلة من رئاسة القسم؟
  const isFinalExamEnabled = course?.is_final_exam_enabled === true; // 🎯 هل فترة رصد وعرض الامتحان النهائي الدور الأول مفعلة ومعتمدة من رئاسة القسم والمقرر؟

  // 🔤 دالة ترجمة أسماء الحقول والبنود الأكاديمية إلى العربية الفصحى الواضحة
  const getAssessmentFieldLabelAr = (fName: string): string => {
    const labelMap: Record<string, string> = {
      quiz1: assessmentScheme.quiz1.title_ar || 'كويز (1)',
      quiz2: assessmentScheme.quiz2.title_ar || 'كويز (2)',
      assignment1: assessmentScheme.assignment1.title_ar || 'واجب (1)',
      assignment2: assessmentScheme.assignment2.title_ar || 'واجب (2)',
      report: assessmentScheme.report.title_ar || 'التقرير والنشاط',
      midterm: assessmentScheme.midterm.title_ar || 'الامتحان النصفي',
      practical: assessmentScheme.practical.title_ar || 'الامتحان العملي',
      final_exam: assessmentScheme.final_exam.title_ar || 'الامتحان النهائي',
      supplementary_exam: 'امتحان الدور الثاني',
      final_coursework_total: 'مجموع السعي',
      final_total: 'المجموع الكلي',
    };
    return labelMap[fName] || fName;
  };

  // 🛡️ تحديد أدوار وصلاحيات الأستاذ المسجل حالياً بدقة
  const isAdmin = currentUser && ['super_admin', 'admin', 'department_head', 'rapporteur'].includes(currentUser.role);
  const isTheoryTeacher = isAdmin || (currentUser && course && (currentUser.id === course.theory_teacher_id || (!course.theory_teacher_id && !course.practical_teacher_id)));
  const isPracticalTeacher = isAdmin || (currentUser && course && (currentUser.id === course.practical_teacher_id));

  // 👥 قائمة طلاب المرحلة والشعبة لهذه المادة
  const courseStudents: UserProfile[] = useMemo(() => {
    const allUsers = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const targetDeptId = course?.department_id || currentUser?.department_id || '';
    const targetDeptName = course?.department_name || currentUser?.department_name || '';
    const targetStage = Number(course?.stage_number) || 1;

    // 1. البحث أولاً عن طلاب القسم في نفس مرحلة المادة
    const matched = allUsers.filter(
      (u) =>
        u.role === 'student' &&
        (u.department_id === targetDeptId || u.department_name === targetDeptName) &&
        (Number(u.stage_number) === targetStage)
    );
    if (matched.length > 0) return matched;
    
    // 2. إذا لم يكن هناك طلاب بنفس المرحلة، جلب طلاب القسم
    const deptStudents = allUsers.filter(
      (u) =>
        u.role === 'student' &&
        (u.department_id === targetDeptId || u.department_name === targetDeptName)
    );
    if (deptStudents.length > 0) return deptStudents;

    // 3. في حال عدم العثور، استخراجهم من سجلات الدرجات المسجلة للمادة
    return grades.map((g) => ({
      id: g.student_id,
      full_name: g.student_name,
      email: `${g.student_id}@sadiq.edu.iq`,
      generated_email: `${g.student_id}@sadiq.edu.iq`,
      role: 'student' as const,
      department_id: g.department_id,
      department_name: course?.department_name || '',
      stage_number: course?.stage_number || 1,
      university_number: g.university_number,
      is_active: true,
      created_at: '2025-01-01',
    }));
  }, [course, currentUser, grades]);

  // 👥 إحصائيات طلاب المادة المسجلين (صباحي ومسائي وذكور وإناث)
  const totalCourseStudents = courseStudents.length;
  const courseMorning = courseStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
  const courseEvening = totalCourseStudents - courseMorning;
  const courseMales = courseStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
  const courseFemales = totalCourseStudents - courseMales;
  const morningPercentage = totalCourseStudents > 0 ? Math.round((courseMorning / totalCourseStudents) * 100) : 0;
  const eveningPercentage = totalCourseStudents > 0 ? Math.round((courseEvening / totalCourseStudents) * 100) : 0;
  const malePercentage = totalCourseStudents > 0 ? Math.round((courseMales / totalCourseStudents) * 100) : 0;
  const femalePercentage = totalCourseStudents > 0 ? Math.round((courseFemales / totalCourseStudents) * 100) : 0;

  // 🔍 تصفية درجات الطلاب بحسب الفترة الدراسية المحددة (الكل / صباحي / مسائي)
  const filteredGrades = useMemo(() => {
    if (filterStudyType === 'all') return grades;
    return grades.filter((g) => {
      const student = courseStudents.find((s) => s.id === g.student_id || s.university_number === g.university_number);
      const sType = student?.study_type || 'morning';
      return sType === filterStudyType;
    });
  }, [grades, filterStudyType, courseStudents]);

  // 💾 دالة حفظ كشوفات الحضور والغياب والإجازات ومزامنتها سحابياً (التنبيه العائم يتولاه محرر الحضور لمنع التكرار)
  const handleSaveAttendanceRecords = async (updated: StudentAttendanceRecord[]) => {
    setAttendanceRecords(updated);
    saveStoredData('student_attendance_records', updated);
    try {
      await saveMultipleAttendanceRecordsToSupabase(updated);
    } catch (err) {
      console.warn('تنبيه أثناء رفع سجلات الحضور إلى Supabase:', err);
    }
  };

  // ✏️ دالة تعديل درجة حقل معين لطالب مع تطبيق RBAC والتسجيل في المسودة والمقارنة اللحظية
  const handleCellChange = (gradeId: string, fieldName: keyof Grade, rawValue: string) => {
    // 🔒 فحص الصلاحيات الدقيقة (RBAC) بين أستاذ النظري وأستاذ العملي
    if (fieldName === 'practical' && !isPracticalTeacher) {
      setErrorMessage('⛔ ليس لديك صلاحية تعديل درجة العملي! هذا الحقل مخصص حصراً لأستاذ المختبر (العملي).');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    if (fieldName !== 'practical' && !isTheoryTeacher && fieldName !== 'supplementary_exam') {
      setErrorMessage('⛔ ليس لديك صلاحية تعديل درجات النظري! هذا الحقل مخصص حصراً لأستاذ النظري.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    // 🔒 منع إدخال أو تعديل درجة الامتحان النهائي الدور الأول إذا كانت الفترة مغلقة من رئاسة القسم
    if (fieldName === 'final_exam' && !isFinalExamEnabled) {
      setErrorMessage('⛔ فترة رصد وعرض درجات الامتحان النهائي (الدور الأول) مغلقة حالياً من قبل رئاسة القسم والمقرر!');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    // 🔒 منع إدخال أو تعديل درجة دور ثاني لطالب ناجح ومجتاز بالدور الأول
    if (fieldName === 'supplementary_exam') {
      const targetG = grades.find((g) => g.id === gradeId);
      if (targetG && isStudentPassedFirstRound(targetG)) {
        setErrorMessage('⛔ لا يمكن رصد درجة دور ثاني لطالب ناجح ومجتاز في الدور الأول!');
        setTimeout(() => setErrorMessage(''), 4000);
        return;
      }
    }

    let numVal = parseFloat(rawValue);
    if (isNaN(numVal)) numVal = 0;

    // 🔒 التحقق من عدم تجاوز الحد الأقصى المعتمد للبند وفق المخطط التقييمي
    const maxLimit = (fieldName in gradeLimits) ? gradeLimits[fieldName] : 50;
    if (numVal > maxLimit) numVal = maxLimit;
    if (numVal < 0) numVal = 0;

    const origG = initialGradesSnapshot.find((g) => g.id === gradeId) || grades.find((g) => g.id === gradeId);
    const origVal = origG ? Number(origG[fieldName] || 0) : 0;
    const studentName = origG?.student_name || 'الطالب';
    const nowIso = new Date().toISOString();

    const updatedCourseGrades = grades.map((g) => {
      if (g.id === gradeId) {
        const updatedG: Grade = {
          ...g,
          [fieldName]: numVal,
          updated_at: nowIso,
        };

        // 🏷️ توثيق هوية وتوقيت آخر تعديل للنظري أو العملي بشكل مستقل
        if (fieldName === 'practical') {
          updatedG.practical_updated_by = currentUser?.full_name || 'أستاذ العملي';
          updatedG.practical_updated_at = nowIso;
        } else {
          updatedG.theory_updated_by = currentUser?.full_name || 'أستاذ النظري';
          updatedG.theory_updated_at = nowIso;
        }

        // 🧮 إعادة حساب السعي والنهائي والتقدير الحرفي تلقائياً في المسودة وفق حالة الدور الثاني
        updatedG.final_coursework_total = calculateCourseworkTotal(updatedG);
        updatedG.final_total = calculateFinalTotal(updatedG, isSupplementaryEnabled);
        updatedG.letter_grade = getLetterGrade(updatedG.final_total);

        return updatedG;
      }
      return g;
    });

    setGrades(updatedCourseGrades);

    const diffKey = `${gradeId}-${String(fieldName)}`;
    const fieldTitleAr = getAssessmentFieldLabelAr(String(fieldName));

    if (numVal !== origVal) {
      setPendingDiffs((prev) => ({
        ...prev,
        [diffKey]: {
          gradeId,
          studentId: origG?.student_id || gradeId,
          studentName,
          fieldName,
          fieldLabelAr: fieldTitleAr,
          oldValue: origVal,
          newValue: numVal,
          delta: Math.round((numVal - origVal) * 100) / 100,
        },
      }));
    } else {
      setPendingDiffs((prev) => {
        const copy = { ...prev };
        delete copy[diffKey];
        return copy;
      });
    }
  };

  // 💾 دالة حفظ واعتماد كافة التعديلات المعلقة في المسودة دفعة واحدة وتوثيق التدقيق
  const handleSaveAllPendingGrades = async () => {
    if (Object.keys(pendingDiffs).length === 0 || !course) return;

    setIsSavingPendingGrades(true);
    const nowIso = new Date().toISOString();
    const allGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);

    // 💾 دمج وحفظ السجلات في التخزين المعتمد
    const finalAllGrades = allGrades.map((g) => {
      const match = grades.find((cg) => cg.id === g.id);
      return match || g;
    });
    saveStoredData('grades', finalAllGrades);
    saveMultipleGradesToSupabase(finalAllGrades); // ☁️ رفع واعتماد كافة السعيات والدرجات في Supabase

    // 🛡️ توثيق قيود التدقيق لكل تعديل تم اعتماده
    const newLogs: AuditLog[] = Object.values(pendingDiffs).map((diff) => ({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      actor_id: currentUser?.id || 'teacher',
      actor_name: currentUser?.full_name || 'الأستاذ',
      actor_role: currentUser?.role || 'teacher',
      student_id: diff.studentId,
      student_name: diff.studentName,
      course_id: course.id,
      course_name: course.name,
      field_name: String(diff.fieldName),
      old_value: diff.oldValue,
      new_value: diff.newValue,
      action: diff.fieldName === 'practical' ? 'رصد درجة عملي' : 'رصد درجة نظري/سعي',
      details: `تعديل (${diff.fieldLabelAr}) للطالب (${diff.studentName}) من (${diff.oldValue}) إلى (${diff.newValue})`,
      created_at: nowIso,
    }));

    const existingAuditLogs = getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    const updatedLogs = [...newLogs, ...existingAuditLogs];
    setAuditLogs(updatedLogs);
    saveStoredData('audit_logs', updatedLogs);
    newLogs.forEach((l) => saveAuditLogToSupabase(l)); // ☁️ حفظ قيود التدقيق الحصينة في Supabase

    // 🔔 إرسال إشعارات مجمعة للطلاب الذين تغيرت درجاتهم
    const uniqueStudentIds = Array.from(new Set(Object.values(pendingDiffs).map((d) => d.studentId)));
    uniqueStudentIds.forEach((stId) => {
      const studentDiffs = Object.values(pendingDiffs).filter((d) => d.studentId === stId);
      const fieldsSummary = studentDiffs.map((d) => `${d.fieldLabelAr} (${d.newValue})`).join('، ');
      sendAppNotification({
        recipient_id: stId,
        recipient_role: 'student',
        title: '📝 تم اعتماد وتحديث درجاتك في مسار بولونيا',
        message: `قام الأستاذ (${currentUser?.full_name || 'أستاذ المادة'}) باعتماد تعديل درجات مادة (${course.name}): ${fieldsSummary}.`,
        type: 'grade_updated',
        link: '/student/dashboard',
      });
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('grades_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // 📸 تحديث لقطة الأصل وتصفير المسودة
    setInitialGradesSnapshot(JSON.parse(JSON.stringify(grades)));
    const savedCount = Object.keys(pendingDiffs).length;
    setPendingDiffs({});
    setIsSavingPendingGrades(false);
    setIsPendingDiffModalOpen(false);

    setSuccessMessage(`تم بنجاح حفظ وتوثيق (${savedCount}) تعديل درجات في سجل التدقيق وإشعار الطلبة بنجاح`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 🔄 دالة إلغاء كافة التعديلات واستعادة النسخة الأصلية للدرجات
  const handleCancelAllPendingGrades = () => {
    if (Object.keys(pendingDiffs).length === 0) return;
    setGrades(JSON.parse(JSON.stringify(initialGradesSnapshot)));
    setPendingDiffs({});
    setIsPendingDiffModalOpen(false);
    setSuccessMessage('تم إلغاء كافة التعديلات واستعادة درجات الطلاب الأصلية بنجاح');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // ↩️ دالة التراجع عن تعديل حقل محدد لطالب معين
  const handleRevertSingleDiff = (diffKey: string) => {
    const diff = pendingDiffs[diffKey];
    if (!diff) return;

    const origG = initialGradesSnapshot.find((g) => g.id === diff.gradeId);
    if (!origG) return;

    const restoredCourseGrades = grades.map((g) => {
      if (g.id === diff.gradeId) {
        const restoredG: Grade = {
          ...g,
          [diff.fieldName]: origG[diff.fieldName],
        };
        restoredG.final_coursework_total = calculateCourseworkTotal(restoredG);
        restoredG.final_total = calculateFinalTotal(restoredG, isSupplementaryEnabled);
        restoredG.letter_grade = getLetterGrade(restoredG.final_total);
        return restoredG;
      }
      return g;
    });

    setGrades(restoredCourseGrades);
    setPendingDiffs((prev) => {
      const copy = { ...prev };
      delete copy[diffKey];
      return copy;
    });
  };

  // 🎯 دالة تطبيق رصد درجة موحدة لجميع الطلاب المحددين في المسودة
  const handleApplyBulkGrade = () => {
    if (selectedGradeStudentIds.length === 0) {
      setErrorMessage('⚠️ يرجى تحديد طالب واحد على الأقل لرصد درجة موحدة له!');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (bulkSelectedField === 'practical' && !isPracticalTeacher) {
      setErrorMessage('⛔ ليس لديك صلاحية رصد درجات العملي!');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    if (bulkSelectedField !== 'practical' && !isTheoryTeacher && bulkSelectedField !== 'supplementary_exam') {
      setErrorMessage('⛔ ليس لديك صلاحية رصد درجات النظري!');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    // 🔒 منع الرصد الموحد للامتحان النهائي إذا كانت الفترة مغلقة
    if (bulkSelectedField === 'final_exam' && !isFinalExamEnabled) {
      setErrorMessage('⛔ فترة رصد الامتحان النهائي (الدور الأول) مغلقة حالياً من قبل رئاسة القسم والمقرر!');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    let numVal = parseFloat(bulkGradeValue);
    if (isNaN(numVal)) numVal = 0;

    const maxLimit = (bulkSelectedField in gradeLimits) ? gradeLimits[bulkSelectedField] : 50;
    if (numVal > maxLimit) numVal = maxLimit;
    if (numVal < 0) numVal = 0;

    const nowIso = new Date().toISOString();
    const updatedDiffs = { ...pendingDiffs };
    const fieldTitleAr = getAssessmentFieldLabelAr(String(bulkSelectedField));

    const updatedCourseGrades = grades.map((g) => {
      if (selectedGradeStudentIds.includes(g.student_id)) {
        // 🔒 إذا كان الحقل المختار هو الدور الثاني وكان الطالب ناجحاً بالدور الأول، يتم تخطيه تلقائياً
        if (bulkSelectedField === 'supplementary_exam' && isStudentPassedFirstRound(g)) {
          return g;
        }

        const origG = initialGradesSnapshot.find((orig) => orig.id === g.id) || g;
        const origVal = Number(origG[bulkSelectedField] || 0);

        const updatedG: Grade = {
          ...g,
          [bulkSelectedField]: numVal,
          updated_at: nowIso,
        };

        if (bulkSelectedField === 'practical') {
          updatedG.practical_updated_by = currentUser?.full_name || 'أستاذ العملي';
          updatedG.practical_updated_at = nowIso;
        } else {
          updatedG.theory_updated_by = currentUser?.full_name || 'أستاذ النظري';
          updatedG.theory_updated_at = nowIso;
        }

        updatedG.final_coursework_total = calculateCourseworkTotal(updatedG);
        updatedG.final_total = calculateFinalTotal(updatedG, isSupplementaryEnabled);
        updatedG.letter_grade = getLetterGrade(updatedG.final_total);

        const diffKey = `${g.id}-${String(bulkSelectedField)}`;
        if (numVal !== origVal) {
          updatedDiffs[diffKey] = {
            gradeId: g.id,
            studentId: g.student_id,
            studentName: g.student_name || 'طالب',
            fieldName: bulkSelectedField,
            fieldLabelAr: fieldTitleAr,
            oldValue: origVal,
            newValue: numVal,
            delta: Math.round((numVal - origVal) * 100) / 100,
          };
        } else {
          delete updatedDiffs[diffKey];
        }

        return updatedG;
      }
      return g;
    });

    setGrades(updatedCourseGrades);
    setPendingDiffs(updatedDiffs);
    setIsBulkGradeModalOpen(false);
    setBulkGradeValue('');

    setSuccessMessage(`تم بنجاح رصد درجة (${numVal}) في حقل (${fieldTitleAr}) لـ (${selectedGradeStudentIds.length}) طالب في المسودة! 🎯`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🔘 دوال نظام التحديد المتعدد لسجلات درجات الطلاب
  const toggleSelectAllGrades = (list: Grade[]) => {
    if (selectedGradeStudentIds.length === list.length && list.length > 0) {
      setSelectedGradeStudentIds([]);
    } else {
      setSelectedGradeStudentIds(list.map((g) => g.student_id));
    }
  };

  const toggleSelectGradeStudent = (stId: string) => {
    setSelectedGradeStudentIds((prev) =>
      prev.includes(stId) ? prev.filter((x) => x !== stId) : [...prev, stId]
    );
  };

  // 📥 تنزيل نموذج Excel لمادة هذا الأستاذ مع دعم المخطط المخصص وبدون رقم جامعي وتضمين الأستاذ والمرحلة والكورس والتاريخ وحالة الدور الثاني
  const handleDownloadTemplate = async () => {
    if (!course) return;
    const stds = grades.map((g) => ({
      full_name: g.student_name || 'طالب',
    }));
    await downloadTeacherGradeTemplate(course.name, stds, assessmentScheme, course.course_type, {
      teacherName: currentUser?.full_name || 'أستاذ المادة',
      stage: course.stage_number || 1,
      semester: course.semester || 1,
      isSupplementaryEnabled: course.is_supplementary_exam_enabled === true, // 🔄 تمرير حالة تفعيل الدور الثاني للنموذج
      isFinalExamEnabled: course.is_final_exam_enabled === true, // 🎯 تمرير حالة تفعيل الامتحان النهائي الدور الأول للنموذج
    });
  };

  // 📋 📥 تنزيل نموذج Excel للحضور والغياب الأسبوعي (15 أسبوعاً) بدون رقم جامعي مع اسم الأستاذ والمرحلة والكورس والتاريخ
  const handleDownloadAttendanceTemplate = async () => {
    if (!course) return;
    const stds = grades.map((g) => ({
      full_name: g.student_name || 'طالب',
    }));
    await downloadTeacherAttendanceTemplate(course.name, stds, {
      teacherName: currentUser?.full_name || 'أستاذ المادة',
      stage: course.stage_number || 1,
      semester: course.semester || 1,
    });
  };

  // 📂 رفع ملف Excel لدرجات المادة وقراءته لفتح نافذة المعاينة التفاعلية
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        setErrorMessage('⚠️ الملف فارغ أو لا يحتوي على صفوف بيانات للطلاب!');
        setTimeout(() => setErrorMessage(''), 4000);
        setIsImportingExcel(false);
        return;
      }
      setExcelPreviewRows(rows);
      setIsImportingExcel(false);
      // إعادة تعيين قيمة input ليتمكن المستخدم من رفع نفس الملف مجدداً إذا رغب
      e.target.value = '';
    } catch {
      setIsImportingExcel(false);
      setErrorMessage('⚠️ خطأ في قراءة ملف Excel للدرجات! يرجى التأكد من صحة الملف وصيغته (.xlsx أو .xls).');
      setTimeout(() => setErrorMessage(''), 4000);
      e.target.value = '';
    }
  };

  // 📋 📂 رفع ملف Excel للحضور والغياب وقراءته لفتح نافذة المعاينة التفاعلية
  const handleAttendanceExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAttendanceExcelUpload(true);
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        setErrorMessage('⚠️ الملف فارغ أو لا يحتوي على صفوف حضور للطلاب!');
        setTimeout(() => setErrorMessage(''), 4000);
        setIsAttendanceExcelUpload(false);
        return;
      }
      setAttendanceExcelPreviewRows(rows);
      setIsAttendanceExcelUpload(false);
      e.target.value = '';
    } catch {
      setIsAttendanceExcelUpload(false);
      setErrorMessage('⚠️ خطأ في قراءة ملف Excel للحضور! يرجى التأكد من صحة الملف وصيغته (.xlsx أو .xls).');
      setTimeout(() => setErrorMessage(''), 4000);
      e.target.value = '';
    }
  };

  // ⚡ تأكيد الرفع الجماعي من معاينة ملف الإكسل وإدراجه في مسودة التعديلات مع توليد الفروقات
  const confirmExcelImport = () => {
    if (!excelPreviewRows || !course) return;
    const nowIso = new Date().toISOString();

    // 🔍 دالة مساعدة ذكية لاستخراج قيمة الدرجة من صف الإكسل بمطابقة العناوين المخصصة والافتراضية
    const extractVal = (
      row: Record<string, string | number>,
      standardKey: string,
      customTitle: string,
      maxScore: number,
      fallback: number
    ): number => {
      const dynamicKey = `${customTitle} (${maxScore})`;
      if (row[dynamicKey] !== undefined && row[dynamicKey] !== '') return Number(row[dynamicKey]);
      if (row[standardKey] !== undefined && row[standardKey] !== '') return Number(row[standardKey]);
      for (const k of Object.keys(row)) {
        if (k.includes(customTitle) || k.includes(standardKey.split(' ')[0])) {
          const val = row[k];
          if (val !== undefined && val !== '') return Number(val);
        }
      }
      return fallback;
    };

    const newDiffs = { ...pendingDiffs };

    const updated = grades.map((g, gIdx) => {
      const matchRow = excelPreviewRows.find(
        (r) =>
          (r['الرقم الجامعي'] && String(r['الرقم الجامعي']).trim() === String(g.university_number).trim()) ||
          (r['اسم الطالب الرباعي'] && String(r['اسم الطالب الرباعي']).trim() === g.student_name.trim()) ||
          (r['اسم الطالب'] && String(r['اسم الطالب']).trim() === g.student_name.trim()) ||
          (r['std_name'] && String(r['std_name']).trim() === g.student_name.trim()) ||
          (r['ت'] && Number(r['ت']) === gIdx + 1) ||
          (r['seq'] && Number(r['seq']) === gIdx + 1)
      );

      if (matchRow) {
        const newG: Grade = { ...g };
        const origG = initialGradesSnapshot.find((orig) => orig.id === g.id) || g;

        const checkAndAddDiff = (field: keyof Grade, newVal: number) => {
          const origVal = Number(origG[field] || 0);
          const diffKey = `${g.id}-${String(field)}`;
          if (newVal !== origVal) {
            newDiffs[diffKey] = {
              gradeId: g.id,
              studentId: g.student_id,
              studentName: g.student_name || 'طالب',
              fieldName: field,
              fieldLabelAr: getAssessmentFieldLabelAr(String(field)),
              oldValue: origVal,
              newValue: newVal,
              delta: Math.round((newVal - origVal) * 100) / 100,
            };
          } else {
            delete newDiffs[diffKey];
          }
        };

        // تحديث حقول النظري فقط إذا كان مسموحاً له
        if (isTheoryTeacher) {
          const q1 = extractVal(matchRow, 'الكويز1 (5)', assessmentScheme.quiz1.title_ar, assessmentScheme.quiz1.max_score, g.quiz1);
          const q2 = extractVal(matchRow, 'الكويز2 (5)', assessmentScheme.quiz2.title_ar, assessmentScheme.quiz2.max_score, g.quiz2);
          const a1 = extractVal(matchRow, 'الواجب1 (5)', assessmentScheme.assignment1.title_ar, assessmentScheme.assignment1.max_score, g.assignment1);
          const a2 = extractVal(matchRow, 'الواجب2 (5)', assessmentScheme.assignment2.title_ar, assessmentScheme.assignment2.max_score, g.assignment2);
          const rep = extractVal(matchRow, 'التقرير (10)', assessmentScheme.report.title_ar, assessmentScheme.report.max_score, g.report);
          const mid = extractVal(matchRow, 'الميدترم (10)', assessmentScheme.midterm.title_ar, assessmentScheme.midterm.max_score, g.midterm);
          newG.quiz1 = q1; checkAndAddDiff('quiz1', q1); // 📝 تعيين الكويز 1
          newG.quiz2 = q2; checkAndAddDiff('quiz2', q2); // 📝 تعيين الكويز 2
          newG.assignment1 = a1; checkAndAddDiff('assignment1', a1); // 📋 تعيين الواجب 1
          newG.assignment2 = a2; checkAndAddDiff('assignment2', a2); // 📋 تعيين الواجب 2
          newG.report = rep; checkAndAddDiff('report', rep); // 📑 تعيين التقرير
          newG.midterm = mid; checkAndAddDiff('midterm', mid); // 📊 تعيين الميدترم
          // 🎯 استيراد وتحديث درجات الفاينل فقط وفقط إذا كان الامتحان النهائي مفعلاً ومفتوحاً بالقسم
          if (isFinalExamEnabled) {
            const fnl = extractVal(matchRow, 'النهائي (50)', assessmentScheme.final_exam.title_ar, assessmentScheme.final_exam.max_score, g.final_exam); // 🔍 استخراج الفاينل
            newG.final_exam = fnl; // 📥 تعيين درجة الفاينل
            checkAndAddDiff('final_exam', fnl); // 🔄 تسجيل الفارق بالمسودة
          }

          // 🔄 استيراد وتحديث درجات الدور الثاني فقط وفقط إذا كانت فترة الدور الثاني مفعلة رسمياً بالقسم
          if (isSupplementaryEnabled) {
            const supGrade = extractVal(matchRow, 'امتحان الدور الثاني (50)', 'الدور الثاني', 50, Number(g.supplementary_exam || 0)); // 🔍 استخراج الدور الثاني
            newG.supplementary_exam = supGrade; // 📥 تعيين درجة الدور الثاني
            checkAndAddDiff('supplementary_exam', supGrade); // 🔄 تسجيل الفارق بالمسودة
          }

          newG.theory_updated_by = currentUser?.full_name || 'أستاذ النظري'; // 👤 اسم أستاذ النظري
          newG.theory_updated_at = nowIso; // ⏰ وقت التحديث للنظري
        }

        // تحديث حقل العملي فقط إذا كان مسموحاً له
        if (isPracticalTeacher && isPracticalCourse) {
          const prac = extractVal(matchRow, 'العملي (10)', assessmentScheme.practical.title_ar, assessmentScheme.practical.max_score, g.practical);
          newG.practical = prac; checkAndAddDiff('practical', prac);
          newG.practical_updated_by = currentUser?.full_name || 'أستاذ العملي';
          newG.practical_updated_at = nowIso;
        }

        newG.updated_at = nowIso;
        newG.final_coursework_total = calculateCourseworkTotal(newG);
        newG.final_total = calculateFinalTotal(newG, isSupplementaryEnabled);
        newG.letter_grade = getLetterGrade(newG.final_total);

        return newG;
      }
      return g;
    });

    setGrades(updated);
    setPendingDiffs(newDiffs);
    setExcelPreviewRows(null);

    setSuccessMessage(`تم استيراد درجات الإكسل وإدراج (${Object.keys(newDiffs).length}) تعديل في مسودة المقارنة بنجاح! يمكنك الآن مراجعتها أو حفظها 📊`);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  // 📋 ⚡ تأكيد الرفع الجماعي لسجل الحضور والغياب
  const confirmAttendanceExcelImport = () => {
    if (!attendanceExcelPreviewRows || !course) return;
    const nowIso = new Date().toISOString();

    const updatedRecords = [...attendanceRecords];

    attendanceExcelPreviewRows.forEach((row) => {
      const stdName = String(row['اسم الطالب الرباعي'] || row['اسم الطالب'] || row['الاسم'] || row['std_name'] || '').trim();
      const matchedStd = grades.find((g) => g.student_name.trim() === stdName || stdName.includes(g.student_name.trim()));

      if (matchedStd) {
        for (let w = 1; w <= 15; w++) {
          const val = String(row[`أسبوع ${w} (حاضر / غائب / مجاز)`] || row[`أسبوع ${w}`] || row[`اسبوع ${w}`] || row[`week_${w}`] || '').trim();
          if (!val) continue;
          let status: AttendanceStatus = 'present';
          if (val.includes('غائب') || val.includes('غياب') || val === 'غ') status = 'absent_unexcused';
          else if (val.includes('مجاز') || val.includes('إجازة') || val === 'م' || val.includes('عذر')) status = 'absent_excused';

          const existingIdx = updatedRecords.findIndex(
            (r) => r.course_id === course.id && r.student_id === matchedStd.student_id && r.week_number === w
          );

          if (existingIdx >= 0) {
            updatedRecords[existingIdx] = {
              ...updatedRecords[existingIdx],
              status,
              updated_at: nowIso,
            };
          } else {
            updatedRecords.push({
              id: `att-${course.id}-${matchedStd.student_id}-${w}`,
              student_id: matchedStd.student_id,
              student_name: matchedStd.student_name,
              university_number: matchedStd.university_number || '',
              course_id: course.id,
              course_name: course.name,
              course_code: course.code,
              department_id: course.department_id || 'dept-1',
              stage_number: course.stage_number || 1,
              semester: (course.semester as 1 | 2) || 1,
              academic_year_id: academicYear || '2026-2027',
              week_number: w,
              lecture_type: 'theory',
              day: 'sunday',
              date: new Date().toISOString().split('T')[0],
              start_time: '08:30',
              end_time: '10:30',
              duration_hours: 2,
              status,
              recorded_by_teacher_id: currentUser?.id || 'teacher-1',
              recorded_by_teacher_name: currentUser?.full_name || 'أستاذ المادة',
              created_at: nowIso,
              updated_at: nowIso,
            });
          }
        }
      }
    });

    setAttendanceRecords(updatedRecords);
    saveStoredData('student_attendance_records', updatedRecords);
    saveMultipleAttendanceRecordsToSupabase(updatedRecords); // ☁️ رفع ومزامنة سجلات الحضور المستوردة مع Supabase فوراً
    setAttendanceExcelPreviewRows(null);
    setSuccessMessage('تم استيراد واعتماد سجل الحضور والغياب الأسبوعي بنجاح! 📋');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 📄 دالة تصدير كشف درجات المادة الكامل A4 كـ PDF متضمناً تواقيع رئيس القسم والمقرر
  const handleExportCoursePDF = async () => {
    if (!course) return;
    setIsExportingPDF(true);
    await exportCourseGradeSheetPDF({
      courseName: course.name,
      courseCode: course.code,
      stageNumber: course.stage_number || 1,
      semester: (course.semester as 1 | 2) || 1,
      academicYear: academicYear || getAcademicYear(),
      teacherName: course.theory_teacher_name || currentUser?.full_name || 'أستاذ النظري',
      practicalTeacherName: course.practical_teacher_name,
      hasPractical: isPracticalCourse,
      departmentName: course.department_name || 'القسم الأكاديمي',
      departmentHeadName: departmentHeadName,
      rapporteurName: rapporteurName,
      grades: grades,
      scheme: assessmentScheme, // 🎛️ المخطط التقييمي المعتمد للمادة
      isFinalExamEnabled: isFinalExamEnabled, // 🎯 حالة تفعيل رصد النهائي المعتمدة من رئاسة القسم
    });
    setIsExportingPDF(false);
  };

  // 📋 دالة تصدير سجل الحضور والغياب الأسبوعي الرسمي A4 Landscape متضمناً تواقيع رئيس القسم والمقرر
  const handleExportAttendancePDF = async () => {
    if (!course) return;
    setIsExportingAttendancePDF(true);
    
    // إعداد نص مواعيد المحاضرات
    const scheduleSummary = courseLectures.length > 0 
      ? courseLectures.map((l) => `${DAYS_OF_WEEK_LIST.find((d) => d.key === l.day)?.label_ar || l.day} (${l.start_time}-${l.end_time}) [${l.room}]`).join(' | ')
      : 'بحسب الجدول الأسبوعي المعتمد';

    await exportCourseAttendanceSheetPDF({
      courseName: course.name,
      courseCode: course.code,
      stageNumber: course.stage_number || 1,
      semester: (course.semester as 1 | 2) || 1,
      studyType: filterStudyType === 'all' ? 'morning' : filterStudyType,
      academicYear: academicYear || getAcademicYear(),
      teacherName: course.theory_teacher_name || currentUser?.full_name || 'أستاذ النظري',
      practicalTeacherName: course.practical_teacher_name,
      departmentName: course.department_name || 'القسم الأكاديمي',
      departmentHeadName: departmentHeadName,
      rapporteurName: rapporteurName,
      scheduleInfo: scheduleSummary,
      students: grades.map((g) => ({ student_name: g.student_name, university_number: g.university_number })),
    });
    setIsExportingAttendancePDF(false);
  };

  return (
    <ZeroTrustGuard 
      allowedRoles={['teacher', 'super_admin', 'admin', 'department_head', 'rapporteur']} 
      requiredCourseId={courseId} 
      redirectFallback="/?portal=teacher"
    >
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
      
      {/* 🔔 تنبيهات النجاح العائمة (Light Mode أبيض ناصع) */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="font-black text-base sm:text-lg text-slate-950">{successMessage}</span>
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

      {/* ⚠️ تنبيهات الخطأ العائمة (Light Mode أبيض ناصع) */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="font-black text-base sm:text-lg text-slate-950">{errorMessage}</span>
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
      
      {/* 🏛️ الهيدر الأكاديمي لمادة الأستاذ بتنسيق متوازن واحترافي 100% */}
      <div className="bg-white border-2 border-slate-200 p-6 sm:p-7 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-col gap-4">
          {/* 📚 السطر الأول: زر العودة + اسم المادة والأيقونة بتصميم كبير وواضح وبارز في الأعلى */}
          <div className="flex items-center gap-4">
            <Link 
              href="/teacher/dashboard" 
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-2xl transition border-2 border-slate-300 font-black shadow-xs flex items-center justify-center shrink-0"
              title="العودة للمواد والتكليفات"
            >
              <ArrowRight className="w-6 h-6 text-black" />
            </Link>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center shadow-md shrink-0 border border-[#1e4570]">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight">
                {course?.name}
              </h1>
            </div>
          </div>

          {/* 🏷️ السطر الثاني: الشارات الأكاديمية للمادة مكبرة ومضاف إليها رمز المادة بالأسفل */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-4 py-2 bg-blue-50 text-blue-950 border-2 border-blue-200 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-800 shrink-0" />
              <span>قسم {course?.department_name || 'هندسة تقنيات الحاسوب'}</span>
            </span>
            <span className="px-4 py-2 bg-indigo-50 text-indigo-950 border-2 border-indigo-200 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
              <Calendar className="w-4 h-4 text-indigo-800 shrink-0" />
              <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(academicYear)}</bdi></span>
            </span>
            <span className="px-4 py-2 bg-slate-100 text-black border-2 border-slate-300 font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
              <GraduationCap className="w-5 h-5 text-blue-900 shrink-0" />
              <span>المرحلة {getStageNameInArabic(course?.stage_number || 1)} • الكورس {course?.semester === 1 ? 'الأول' : 'الثاني'}</span>
            </span>
            {course?.code && (
              <span className="px-4 py-2 bg-slate-100 text-black border-2 border-slate-300 font-mono font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-2xs">
                <span className="font-sans text-slate-700 font-black">رمز المادة:</span>
                <span className="text-black font-black">{course?.code}</span>
              </span>
            )}
          </div>
        </div>

        {/* 🕒 شريط مواعيد المحاضرات المجدولة للمادة إن وجدت */}
        {courseLectures.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t-2 border-slate-100 text-base font-black text-black">
            <span className="flex items-center gap-1.5 text-indigo-950 bg-indigo-50 px-3.5 py-1.5 rounded-xl border-2 border-indigo-200 text-sm font-black shadow-2xs">
              <Clock className="w-4 h-4 text-indigo-800" />
              <span>مواعيد المحاضرات المجدولة:</span>
            </span>
            {courseLectures.map((lec) => (
              <span key={lec.id} className="bg-slate-100 px-3.5 py-1.5 rounded-xl border-2 border-slate-300 text-black text-sm font-black flex items-center gap-1.5 shadow-2xs">
                <strong>{DAYS_OF_WEEK_LIST.find((d) => d.key === lec.day)?.label_ar || lec.day}</strong>
                <span>({lec.start_time} - {lec.end_time}) • </span>
                <DoorClosed className="w-4 h-4 text-slate-800 inline" />
                <span>{lec.room}</span>
              </span>
            ))}
          </div>
        )}

        {/* 🏷️ شريط بطاقة الأساتذة وتوضيح الصلاحيات الأكاديمية (يتكيف تلقائياً: بطاقتان للنظري فقط، و3 بطاقات للنظري والعملي) */}
        <div className={`p-4 sm:p-5 bg-slate-50 border-2 border-slate-300 rounded-3xl grid grid-cols-1 ${isPracticalCourse ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 text-base font-black`}>
          {/* 1. أستاذ النظري */}
          <div className="flex items-center gap-3">
            <span className="p-3 bg-blue-100 text-blue-950 rounded-2xl border border-blue-300">
              <Users className="w-6 h-6 text-blue-900" />
            </span>
            <div>
              <span className="text-black font-black text-sm sm:text-base block">أستاذ النظري:</span>
              <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
                {course?.theory_teacher_name || (currentUser?.role === 'teacher' ? currentUser.full_name : 'قيد التكليف من القسم')}
              </strong>
            </div>
          </div>

          {/* 2. أستاذ العملي (يظهر فقط إذا كانت المادة نظرية وعملية) */}
          {isPracticalCourse && (
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300">
                <FlaskConical className="w-6 h-6 text-emerald-900" />
              </span>
              <div>
                <span className="text-black font-black text-sm sm:text-base block">أستاذ العملي (المختبر):</span>
                <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
                  {course?.practical_teacher_name || (currentUser?.role === 'teacher' ? currentUser.full_name : 'قيد التكليف من القسم')}
                </strong>
              </div>
            </div>
          )}

          {/* 3. الصلاحية الحالية */}
          <div className="flex items-center gap-3">
            <span className="p-3 bg-sky-100 text-sky-950 rounded-2xl border border-sky-300">
              <ShieldCheck className="w-6 h-6 text-sky-900" />
            </span>
            <div>
              <span className="text-black font-black text-sm sm:text-base block">صلاحيتك الحالية:</span>
              <strong className="text-black font-black text-lg sm:text-xl block mt-0.5">
                {isAdmin
                  ? 'تحكم كامل (إدارة عليا)'
                  : !isPracticalCourse
                  ? (isTheoryTeacher ? 'أستاذ المادة (رصد النظري والنهائي)' : 'مشاهدة فقط')
                  : isTheoryTeacher && isPracticalTeacher
                  ? 'أستاذ النظري والعملي للمادة'
                  : isTheoryTeacher
                  ? 'أستاذ النظري (رصد النظري والنهائي)'
                  : isPracticalTeacher
                  ? 'أستاذ العملي (رصد درجة العملي فقط)'
                  : 'مشاهدة فقط'}
              </strong>
            </div>
          </div>
        </div>

        {/* 📊 إحصائية سريعة وديموغرافية شاملة لطلاب المادة (إجمالي، صباحي، مسائي، ذكور، إناث) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-base font-black">
          {/* 1. إجمالي الطلاب */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-black shrink-0" />
              <span className="text-black font-black text-sm sm:text-base">إجمالي الطلاب:</span>
            </div>
            <strong className="text-black font-black text-lg sm:text-xl">{totalCourseStudents}</strong>
          </div>

          {/* 2. الصباحي */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="text-emerald-950 font-black text-sm sm:text-base">الصباحي:</span>
            </div>
            <strong className="text-emerald-950 font-black text-base sm:text-lg">{courseMorning} ({morningPercentage}%)</strong>
          </div>

          {/* 3. المسائي */}
          <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-800 shrink-0" />
              <span className="text-indigo-950 font-black text-sm sm:text-base">المسائي:</span>
            </div>
            <strong className="text-indigo-950 font-black text-base sm:text-lg">{courseEvening} ({eveningPercentage}%)</strong>
          </div>

          {/* 4. الذكور */}
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-700 shrink-0"></span>
              <span className="text-blue-950 font-black text-sm sm:text-base">الذكور:</span>
            </div>
            <strong className="text-blue-950 font-black text-base sm:text-lg">{courseMales} ({malePercentage}%)</strong>
          </div>

          {/* 5. الإناث */}
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-700 shrink-0"></span>
              <span className="text-rose-950 font-black text-sm sm:text-base">الإناث:</span>
            </div>
            <strong className="text-rose-950 font-black text-base sm:text-lg">{courseFemales} ({femalePercentage}%)</strong>
          </div>
        </div>

        {/* 🔒 شريط تنبيه وتوضيح الصلاحيات المعزولة للأستاذ */}
        {!isAdmin && (
          <div className="p-4 sm:p-5 bg-blue-100/80 border-2 border-blue-400 rounded-2xl text-base sm:text-lg font-black text-black flex items-center shadow-xs">
            {isPracticalCourse ? (
              <>
                {isTheoryTeacher && isPracticalTeacher && (
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-900 shrink-0" />
                    <span className="text-black leading-relaxed"><strong>صلاحية أكاديمية كاملة:</strong> أنت مكلف بتدريس ورصد درجات الجانبين <strong>النظري والعملي</strong> لهذه المادة بالكامل.</span>
                  </div>
                )}
                {isTheoryTeacher && !isPracticalTeacher && (
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-blue-900 shrink-0" />
                    <span className="text-black leading-relaxed"><strong>ملاحظة الصلاحيات:</strong> أنت مكلف بتدريس الجانب <strong>النظري</strong>، حقل العملي مقفل لأستاذ المختبر ({course?.practical_teacher_name || 'غير معين'}).</span>
                  </div>
                )}
                {isPracticalTeacher && !isTheoryTeacher && (
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-blue-900 shrink-0" />
                    <span className="text-black leading-relaxed"><strong>ملاحظة الصلاحيات:</strong> أنت مكلف بتدريس الجانب <strong>العملي</strong>، يمكنك تعديل درجات العملي فقط وبقية حقول النظري مقفلة لأستاذ النظري ({course?.theory_teacher_name || 'غير معين'}).</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-900 shrink-0" />
                <span className="text-black leading-relaxed">هذه المادة <strong>نظرية فقط</strong>، يتم احتساب السعي من 50 على بنود النظري والامتحان النصفي والتقارير.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🎛️ شريط التبويبات الأربعة لمادة الأستاذ بتصميم احترافي ملكي */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-3xl border-2 border-slate-200 shadow-sm">
        {/* 1. رصد وتقييم الدرجات */}
        <button
          type="button"
          onClick={() => handleTabChange('grades')}
          className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
            activeCourseTab === 'grades'
              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              activeCourseTab === 'grades' ? 'bg-white/15 text-cyan-300' : 'bg-blue-100 text-blue-900'
            }`}>
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-sm sm:text-base font-black">رصد وتقييم الدرجات</span>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
            activeCourseTab === 'grades' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-950 border border-blue-200'
          }`}>
            {grades.length} طالب
          </span>
        </button>

        {/* 2. تسجيل وإدارة الحضور والغياب */}
        <button
          type="button"
          onClick={() => handleTabChange('attendance')}
          className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
            activeCourseTab === 'attendance'
              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              activeCourseTab === 'attendance' ? 'bg-white/15 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
            }`}>
              <CheckSquare className="w-5 h-5" />
            </span>
            <span className="text-sm sm:text-base font-black">إدارة الحضور والغياب</span>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
            activeCourseTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
          }`}>
            15 أسبوعاً
          </span>
        </button>

        {/* 3. التكليفات والامتحانات الفصلية */}
        <button
          type="button"
          onClick={() => handleTabChange('assessments')}
          className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
            activeCourseTab === 'assessments'
              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              activeCourseTab === 'assessments' ? 'bg-white/15 text-sky-300' : 'bg-sky-100 text-sky-900'
            }`}>
              <ClipboardList className="w-5 h-5" />
            </span>
            <span className="text-sm sm:text-base font-black">التكليفات والامتحانات</span>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
            activeCourseTab === 'assessments' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-950 border border-sky-200'
          }`}>
            أنشطة فصلية
          </span>
        </button>

        {/* 4. سجل العمليات والأمان */}
        <button
          type="button"
          onClick={() => handleTabChange('audit')}
          className={`px-4 py-3.5 rounded-2xl text-base font-black transition-all cursor-pointer flex items-center justify-between gap-3 border-2 active:scale-95 shadow-xs ${
            activeCourseTab === 'audit'
              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-md ring-2 ring-[#0F2942]/20'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              activeCourseTab === 'audit' ? 'bg-white/15 text-indigo-300' : 'bg-indigo-100 text-indigo-900'
            }`}>
              <History className="w-5 h-5" />
            </span>
            <span className="text-sm sm:text-base font-black">سجل العمليات والأمان</span>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 ${
            activeCourseTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950 border border-slate-300'
          }`}>
            {auditLogs.filter((a) => a.course_id === course?.id || a.course_name === course?.name).length} عملية
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📋 التبويب الثاني: محرر الحضور والغياب والإجازات المعتمد لمسار بولونيا */}
      {/* ========================================================================= */}
      {activeCourseTab === 'attendance' && course && (
        <AttendanceSheetEditor
          course={course}
          students={courseStudents}
          lectures={courseLectures}
          initialRecords={attendanceRecords}
          onSaveRecords={handleSaveAttendanceRecords}
          teacherId={currentUser?.id || 'usr-teacher'}
          teacherName={currentUser?.full_name || 'أستاذ المادة'}
          currentUser={currentUser}
          departmentHeadName={departmentHeadName} // 🏛️ تمرير اسم رئيس القسم المعتمد
          rapporteurName={rapporteurName}         // 📝 تمرير اسم مقرر القسم المعتمد
        />
      )}

      {/* ========================================================================= */}
      {/* 📚 التبويب الثالث: مركز إدارة التكليفات والامتحانات الفصلية لمسار بولونيا */}
      {/* ========================================================================= */}
      {activeCourseTab === 'assessments' && (
        <TeacherAssessmentsManager
          teacherId={currentUser?.id || 'usr-teacher-1'}
          teacherName={currentUser?.full_name || 'أستاذ المادة'}
          assignedCourses={assignedCourses}
        />
      )}

      {/* ========================================================================= */}
      {/* 📜 التبويب الرابع: سجل العمليات والأمان والتدقيق الأكاديمي الحصين */}
      {/* ========================================================================= */}
      {activeCourseTab === 'audit' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shrink-0">
                <History className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-950">سجل التدقيق والحركات الأكاديمية (Audit Trail)</h3>
                <p className="text-xs sm:text-sm font-bold text-slate-600">توثيق زمني غير قابل للتعديل لكافة عمليات الرصد والتعديل على درجات المادة</p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 font-black text-sm rounded-xl border border-slate-200">
              إجمالي الحركات: {auditLogs.filter((a) => a.course_id === course?.id || a.course_name === course?.name).length} عملية
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto space-y-1">
            {auditLogs
              .filter((a) => a.course_id === course?.id || a.course_name === course?.name)
              .map((log) => (
                <div key={log.id} className="py-3.5 px-3 rounded-2xl hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-black">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 text-xs font-black">
                        {log.action}
                      </span>
                      <span className="text-slate-950 font-black text-sm">{log.details}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-black text-slate-700 shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-900 font-black">
                      {log.actor_name || log.user_name || 'أستاذ المادة'}
                    </span>
                    <span className="text-slate-600 font-mono" dir="ltr">
                      {new Date(log.created_at).toLocaleString('ar-IQ-u-nu-latn')}
                    </span>
                  </div>
                </div>
              ))}
            {auditLogs.filter((a) => a.course_id === course?.id || a.course_name === course?.name).length === 0 && (
              <div className="text-center py-12 space-y-2">
                <ShieldCheck className="w-12 h-12 text-emerald-700 mx-auto" />
                <p className="text-slate-950 font-black text-base">
                  سجل الأمان فارغ ومستقر. لم يتم تسجيل أي تعديلات أو حركات على هذه المادة بعد.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 التبويب الأول: رصد وتقييم الدرجات وجداول Excel */}
      {/* ========================================================================= */}
      {activeCourseTab === 'grades' && (
        <>
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex flex-wrap items-center gap-2.5">
                <span className="p-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-6 h-6 text-blue-900" />
                </span>
                <span>سجل رصد وتقييم درجات مسار بولونيا</span>
                <span className="px-3.5 py-1 bg-slate-900 text-white rounded-xl text-base font-black font-mono shadow-2xs">
                  {filteredGrades.length} طالب
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <p className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <span>الأوزان والعناوين المعتمدة تتبع المخطط الأكاديمي المخصص لمادة</span>
                  <strong className="text-blue-950 font-black">({course?.name})</strong>
                </p>

                {/* 🏷️ شارة الكورس الدراسي الحالي */}
                <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-[#0F2942] text-white shadow-2xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>{course?.semester === 2 ? 'الكورس الثاني' : 'الكورس الأول'}</span>
                </span>

                {/* 🎯 شارة حالة فترة الامتحان النهائي الدور الأول تظهر حصراً إذا كانت مفعلة */}
                {isFinalExamEnabled && (
                  <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>فترة الامتحان النهائي (الدور الأول) مفعلة ومعتمدة</span>
                  </span>
                )}

                {/* 🔄 شارة حالة فترة الامتحان المعتمدة من رئاسة القسم - تظهر حصراً عند تفعيل الدور الثاني */}
                {isSupplementaryEnabled && (
                  <span className="px-3.5 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                    <RotateCcw className="w-4 h-4 text-[#0F2942] shrink-0" />
                    <span>فترة رصد الدور الثاني (الإكمال) مفعلة من رئاسة القسم</span>
                  </span>
                )}
              </div>
            </div>

            {/* ☀️ / 🌙 أزرار تصفية درجات الطلاب حسب الفترة الدراسية بتصميم بارز واحترافي */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border-2 border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterStudyType('all')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'all'
                    ? 'bg-[#0F2942] text-white shadow-md ring-2 ring-blue-500/20'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200/80'
                }`}
              >
                <span>الكل</span>
                <span className="font-mono font-black text-base opacity-90">({grades.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStudyType('morning')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'morning'
                    ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/20'
                    : 'text-emerald-950 hover:bg-emerald-100/80'
                }`}
              >
                <Sun className={`w-5 h-5 shrink-0 transition-colors ${
                  filterStudyType === 'morning' ? 'text-white' : 'text-emerald-800'
                }`} />
                <span>الصباحي</span>
                <span className="font-mono font-black text-base opacity-90">({courseMorning})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStudyType('evening')}
                className={`px-5 py-2.5 rounded-xl text-base sm:text-lg font-black transition-all cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                  filterStudyType === 'evening'
                    ? 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-500/20'
                    : 'text-indigo-950 hover:bg-indigo-100/80'
                }`}
              >
                <Moon className={`w-5 h-5 shrink-0 transition-colors ${
                  filterStudyType === 'evening' ? 'text-white' : 'text-indigo-800'
                }`} />
                <span>المسائي</span>
                <span className="font-mono font-black text-base opacity-90">({courseEvening})</span>
              </button>
            </div>
          </div>

          {/* 🎛️ شريط الإجراءات والمسودات وأدوات التصدير والاستيراد لدرجات المادة */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* ⚖️ زر معاينة الفروقات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPendingDiffModalOpen(true)}
                  className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white border-2 border-[#1e4570] rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 animate-in fade-in"
                  title="عرض كشف تفصيلي بمقارنة الدرجة القديمة قبل التعديل مقابل الحديثة بعد التعديل"
                >
                  <History className="w-5 h-5 text-cyan-300" />
                  <span>معاينة الفروقات ({Object.keys(pendingDiffs).length})</span>
                </button>
              )}

              {/* 💾 زر حفظ التعديلات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllPendingGrades}
                  disabled={isSavingPendingGrades}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ring-2 ring-emerald-400"
                  title="حفظ كافة التعديلات المدخلة بالمسودة في قاعدة البيانات"
                >
                  {isSavingPendingGrades ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 text-emerald-200" />
                      <span>حفظ واعتماد التعديلات ({Object.keys(pendingDiffs).length})</span>
                    </>
                  )}
                </button>
              )}

              {/* 🔄 زر إلغاء التعديلات */}
              {Object.keys(pendingDiffs).length > 0 && (
                <button
                  type="button"
                  onClick={handleCancelAllPendingGrades}
                  disabled={isSavingPendingGrades}
                  className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 animate-in fade-in"
                  title="إلغاء كافة التعديلات واستعادة الدرجات الأصلية"
                >
                  <RotateCcw className="w-5 h-5 text-rose-200" />
                  <span>إلغاء التعديلات</span>
                </button>
              )}

              {/* حالة المسودة والتوجيه الإرشادي */}
              <div className="flex items-center gap-2">
                {Object.keys(pendingDiffs).length > 0 ? (
                  <div className="flex items-center gap-2.5 text-black bg-blue-100 px-4 py-2 rounded-2xl border-2 border-blue-400 text-base font-black animate-in fade-in shadow-xs">
                    <Info className="w-5 h-5 text-blue-900 shrink-0" />
                    <span>يوجد <strong className="text-black font-black underline">({Object.keys(pendingDiffs).length})</strong> تعديلات في المسودة لم تُحفظ بعد.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-black bg-slate-100 px-4 py-2 rounded-2xl border-2 border-slate-300 text-base font-black shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                    <span>عدّل أي درجة في الجدول أو حدد الطلاب لرصد درجة موحدة ومشاهدة المقارنة المباشرة.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 🖨️📥 أزرار التصدير والاستيراد الرسمية لدرجات المادة */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportCoursePDF}
                disabled={isExportingPDF || grades.length === 0}
                className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
                title="تصدير كشف درجات وسعي المادة الرسمي A4"
              >
                {isExportingPDF ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التصدير...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 text-cyan-300" />
                    <span>تصدير كشف المادة (PDF)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl border-2 border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                title="تنزيل نموذج Excel المعتمد لرصد درجات المادة وفق مسار بولونيا"
              >
                <Download className="w-5 h-5 text-emerald-800" />
                <span>نموذج Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl border-2 border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                title="تعليمات وضوابط رصد واستيراد درجات المادة"
              >
                <Info className="w-5 h-5 text-blue-800" />
                <span>التعليمات</span>
              </button>

              <label className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm border border-[#1e4570] active:scale-95">
                <Upload className="w-5 h-5 text-cyan-200" />
                <span>{isImportingExcel ? 'جاري التحليل...' : 'استيراد ملف Excel'}</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={isImportingExcel} className="hidden" />
              </label>
            </div>
          </div>

        {/* 🎛️ شريط الإجراءات الجماعية لطلاب درجات السعي عند التحديد */}
        {(() => {
          const visibleSelectedCount = selectedGradeStudentIds.filter(id => filteredGrades.some(g => g.student_id === id)).length;
          if (visibleSelectedCount === 0 || filteredGrades.length === 0) return null;

          return (
            <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-base text-white">
                    تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({visibleSelectedCount})</strong> من أصل <span className="font-mono text-slate-300">({filteredGrades.length})</span> طالب/ـة
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 🎯 رصد درجة موحدة للطلاب المحددين */}
                <button
                  type="button"
                  onClick={() => {
                    setBulkGradeValue('');
                    setIsBulkGradeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Sliders className="w-4 h-4 text-emerald-200" />
                  <span>رصد درجة موحدة للمحددين</span>
                </button>

                {/* 📢 إرسال تنبيه للمحددين */}
                <button
                  type="button"
                  onClick={() => {
                    setGradeNoticeTargetStudent(null);
                    setGradeNoticeDefaultCategory('general_announcement');
                    setIsGradeNoticeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Send className="w-4 h-4 text-cyan-200" />
                  <span>إرسال تنبيه للمحددين</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGradeStudentIds([])}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          );
        })()}

        {/* 🎯 تنبيه حالة الامتحان النهائي الدور الأول يظهر حصراً إذا كان مفعلاً من رئاسة القسم */}
        {isFinalExamEnabled && (
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-slate-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-950 flex items-center gap-2">
                  <span>فترة رصد درجات الامتحان النهائي (الدور الأول) مفتوحة ومفعلة</span>
                  <span className="text-xs px-2.5 py-1 bg-slate-200 text-slate-900 rounded-lg font-mono flex items-center gap-1 border border-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2942] shrink-0" />
                    <span>مفعلة</span>
                  </span>
                </h4>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  تم فتح رصد درجات الفاينل برخصة من رئاسة القسم والمقرر. يمكنك إدخال وتعديل درجات النهائي (من 50) واحتساب النتيجة والمجموع الكلي من (100).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#0F2942]" />
                <span>الرصد النهائي نشط</span>
              </span>
            </div>
          </div>
        )}

        {/* 🔄 تنبيه فترة الدور الثاني والضوابط الأكاديمية */}
        {isSupplementaryEnabled && (
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-slate-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F2942] text-white rounded-xl shadow-xs shrink-0">
                <RotateCcw className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-950">فترة رصد درجات الدور الثاني (الإكمال) مفتوحة ومفعلة</h4>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  وفق ضوابط مسار بولونيا، يُتاح الرصد حصراً للطلبة الراسبين/المكملين في الدور الأول (السعي + النهائي &lt; 50)، بينما يحتفظ الطلبة الناجحون بنتيجتهم الأصلية.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-[#0F2942]" />
                <span>المؤهلون لدور 2: {grades.filter((g) => isStudentEligibleForSupplementary(g)).length} طالب</span>
              </span>
              <span className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900 shadow-2xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>الناجحون دور أول: {grades.filter((g) => isStudentPassedFirstRound(g)).length} طالب</span>
              </span>
            </div>
          </div>
        )}

        {/* 📱 حاوية السحب الأفقي للجداول الاستجابية للموبايل والتابلت */}
        <div className="overflow-x-auto w-full rounded-2xl border-2 border-slate-300 shadow-2xs">
          <table className="w-full text-center text-base font-black border-collapse min-w-[1150px]">
            <thead className="bg-slate-100 text-black font-black border-b-2 border-slate-300">
              <tr>
                <th className="p-4 text-center w-20 text-base border-x border-slate-300">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectAllGrades(filteredGrades)}
                      className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                      title="تحديد كافة الطلاب"
                    >
                      {selectedGradeStudentIds.length === filteredGrades.length && filteredGrades.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <span>ت</span>
                  </div>
                </th>
                {/* 👤 اسم الطالب الثلاثي */}
                <th className="p-4 text-right min-w-[240px] text-base text-black font-black border-x border-slate-300">اسم الطالب</th>
                
                {/* 1. البند الأول - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.quiz1.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.quiz1.max_score})</span>
                </th>

                {/* 2. البند الثاني - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.quiz2.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.quiz2.max_score})</span>
                </th>

                {/* 3. البند الثالث - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.assignment1.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.assignment1.max_score})</span>
                </th>

                {/* 4. البند الرابع - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.assignment2.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.assignment2.max_score})</span>
                </th>

                {/* 5. البند الخامس - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.report.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.report.max_score})</span>
                </th>

                {/* 6. البند السادس - ديناميكي من مخطط رئيس القسم */}
                <th className="p-3 bg-slate-50 border-x border-slate-300">
                  <div className="font-black text-black text-base">{assessmentScheme.midterm.title_ar}</div>
                  <span className="text-sm font-black text-blue-900">({assessmentScheme.midterm.max_score})</span>
                </th>

                {/* 7. البند السابع - الامتحان العملي / المختبري (إن وجد) */}
                {isPracticalCourse && (
                  <th className="p-3 bg-emerald-50 text-emerald-950 border-x-2 border-emerald-300">
                    <div className="font-black flex items-center justify-center gap-1 text-base text-black">
                      <FlaskConical className="w-4 h-4 text-emerald-800" />
                      <span>{assessmentScheme.practical.title_ar}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-900">({assessmentScheme.practical.max_score})</span>
                  </th>
                )}

                {/* مجموع السعي التكويني */}
                <th className="p-4 bg-slate-200 text-black font-black min-w-[100px] border-x-2 border-slate-400 text-base">
                  <div>مجموع السعي</div>
                  <span className="text-sm font-black text-black">(50)</span>
                </th>

                {/* 🎯 الامتحان النهائي (الدور الأول) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم والمقرر */}
                {isFinalExamEnabled && (
                  <th className="p-3 bg-slate-200/90 text-slate-950 border-x-2 border-slate-300 text-base animate-in fade-in">
                    <div className="font-black text-slate-950">{assessmentScheme.final_exam.title_ar}</div>
                    <span className="text-sm font-black text-slate-700">({assessmentScheme.final_exam.max_score})</span>
                  </th>
                )}

                {/* 🔄 دور ثاني - يظهر حصراً إذا كان مفعلاً من رئاسة القسم */}
                {isSupplementaryEnabled && (
                  <th className="p-3 bg-slate-200/90 text-slate-950 border-x-2 border-slate-300 text-base animate-in fade-in">
                    <div className="font-black text-slate-950 flex items-center justify-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-[#0F2942]" />
                      <span>دور ثاني</span>
                    </div>
                    <span className="text-sm font-black text-slate-700">({assessmentScheme.final_exam.max_score})</span>
                  </th>
                )}

                {/* المجموع الكلي */}
                <th className="p-4 bg-slate-200 text-slate-950 min-w-[100px] border-x-2 border-slate-300 text-base">
                  <div className="font-black text-slate-950">{isFinalExamEnabled ? 'المجموع الكلي' : 'السعي المعتمد'}</div>
                  <span className="text-sm font-black text-slate-900">({isFinalExamEnabled ? '100' : '50'})</span>
                </th>

                {/* التقدير */}
                <th className="p-4 min-w-[110px] text-base text-black font-black border-x border-slate-300">
                  {isFinalExamEnabled ? 'التقدير' : 'حالة النتيجة'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-black text-black text-base">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-14 px-4 text-center bg-white">
                    <div className="max-w-lg mx-auto flex flex-col items-center justify-center gap-4 bg-slate-50 border-2 border-dashed border-slate-400 rounded-3xl p-8 sm:p-10 shadow-xs animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 bg-blue-100 text-blue-950 rounded-2xl border-2 border-blue-300 shadow-xs">
                        <Users className="w-12 h-12 text-blue-900" />
                      </div>
                      <div className="space-y-2 text-center">
                        <h3 className="text-2xl font-black text-black">
                          لا يوجد طلاب في هذه القائمة
                        </h3>
                        <p className="text-base sm:text-lg font-black text-black leading-relaxed">
                          {filterStudyType === 'morning'
                            ? 'لم يتم العثور على أي طلاب مسجلين في الدراسة (الصباحية) لهذه المادة.'
                            : filterStudyType === 'evening'
                            ? 'لم يتم العثور على أي طلاب مسجلين في الدراسة (المسائية) لهذه المادة.'
                            : 'لا توجد بيانات طلاب مسجلين في هذه المادة حالياً. يمكنك استيراد قائمة الطلاب والدرجات مباشرة من ملف Excel.'}
                        </p>
                      </div>

                      {grades.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                          <label className="px-5 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95">
                            <Upload className="w-5 h-5 text-cyan-200" />
                            <span>{isImportingExcel ? 'جاري قراءة الملف...' : 'استيراد الطلاب والدرجات من Excel'}</span>
                            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={isImportingExcel} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowExcelInstructions(true)}
                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-black text-base font-black rounded-xl border-2 border-slate-300 transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Info className="w-5 h-5 text-blue-800" />
                            <span>تعليمات الإكسل</span>
                          </button>
                        </div>
                      )}

                      {filterStudyType !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterStudyType('all')}
                          className="mt-2 px-6 py-3 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                        >
                          <ListFilter className="w-5 h-5 text-cyan-300" />
                          <span>عرض كافة طلاب المادة ({grades.length})</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, index) => {
                const isPassedFirstRound = isStudentPassedFirstRound(g);
                const courseworkTotal = calculateCourseworkTotal(g); // 📝 السعي التكويني من 50
                const finalTot = isFinalExamEnabled ? calculateFinalTotal(g, isSupplementaryEnabled) : courseworkTotal; // 💯 احتساب المجموع
                const letterGrad = isFinalExamEnabled ? getLetterGrade(finalTot) : 'بانتظار الفاينل'; // 🅰️ التقدير الأكاديمي
                const stdObj = courseStudents.find((s) => s.id === g.student_id || s.university_number === g.university_number);
                const stdGender = stdObj?.gender || detectArabicGender(g.student_name);
                const stdStudyType = stdObj?.study_type || 'morning';

                const isSelected = selectedGradeStudentIds.includes(g.student_id);

                return (
                  <tr key={g.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-blue-50/80 ring-1 ring-blue-300' : ''}`}>
                    <td className="p-4 text-center font-black text-black whitespace-nowrap border-x border-slate-300">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectGradeStudent(g.student_id)}
                          className="p-1 text-[#0F2942] hover:scale-110 transition cursor-pointer"
                          title={`تحديد ${g.student_name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-xl bg-slate-100 border border-slate-300 text-black font-black text-xs shadow-2xs">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    
                    {/* 👤 اسم الطالب في السطر الأول وتحته شارات الجنس والفترة الدراسية بأناقة وتصميم فاخر */}
                    <td className="p-3.5 text-right min-w-[200px] border-x border-slate-300">
                      <div className="flex flex-col items-start gap-1">
                        {/* السطر الأول: اسم الطالب الرباعي بخط عريض وواضح */}
                        <div className="font-black text-slate-950 text-base sm:text-lg tracking-tight">
                          {g.student_name}
                        </div>
                        {/* السطر الثاني: وسوم واضحة ومقروءة للفترة والجنس */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* ☀️ / 🌙 شارة الصباحي والمسائي */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black border-2 flex items-center gap-1.5 shadow-2xs ${
                            stdStudyType === 'evening'
                              ? 'bg-indigo-50 text-indigo-950 border-indigo-300'
                              : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                          }`}>
                            {stdStudyType === 'evening' ? (
                              <Moon className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            )}
                            <span>{stdStudyType === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>

                          {/* 👨 / 👩 شارة الجنس */}
                          <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black border-2 shadow-2xs ${
                            stdGender === 'female'
                              ? 'bg-rose-50 text-rose-950 border-rose-300'
                              : 'bg-blue-50 text-blue-950 border-blue-300'
                          }`}>
                            {stdGender === 'female' ? 'أنثى' : 'ذكر'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 1. كويز 1 */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.quiz1 || 5}
                          disabled={!isTheoryTeacher}
                          value={g.quiz1}
                          onChange={(e) => handleCellChange(g.id, 'quiz1', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.quiz1 || 5}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-quiz1`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-quiz1`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-quiz1`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-quiz1`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-quiz1`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-quiz1`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. كويز 2 */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.quiz2 || 5}
                          disabled={!isTheoryTeacher}
                          value={g.quiz2}
                          onChange={(e) => handleCellChange(g.id, 'quiz2', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.quiz2 || 5}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-quiz2`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-quiz2`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-quiz2`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-quiz2`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-quiz2`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-quiz2`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 3. واجب 1 */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.assignment1 || 5}
                          disabled={!isTheoryTeacher}
                          value={g.assignment1}
                          onChange={(e) => handleCellChange(g.id, 'assignment1', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.assignment1 || 5}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-assignment1`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-assignment1`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-assignment1`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-assignment1`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-assignment1`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-assignment1`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. واجب 2 */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.assignment2 || 5}
                          disabled={!isTheoryTeacher}
                          value={g.assignment2}
                          onChange={(e) => handleCellChange(g.id, 'assignment2', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.assignment2 || 5}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-assignment2`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-assignment2`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-assignment2`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-assignment2`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-assignment2`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-assignment2`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. تقرير */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.report || 10}
                          disabled={!isTheoryTeacher}
                          value={g.report}
                          onChange={(e) => handleCellChange(g.id, 'report', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.report || 10}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-report`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-report`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-report`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-report`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-report`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-report`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 6. امتحان نصفي */}
                    <td className="p-2 border-x border-slate-300">
                      <div className="flex flex-col items-center justify-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradeLimits.midterm || 10}
                          disabled={!isTheoryTeacher}
                          value={g.midterm}
                          onChange={(e) => handleCellChange(g.id, 'midterm', e.target.value)}
                          title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : `الحد الأقصى: ${gradeLimits.midterm || 10}`}
                          className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                            !isTheoryTeacher
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : pendingDiffs[`${g.id}-midterm`]
                              ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                              : 'bg-slate-50 border-2 border-slate-300 text-black focus:border-[#0F2942]'
                          }`}
                        />
                        {pendingDiffs[`${g.id}-midterm`] && (
                          <div 
                            className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                            title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-midterm`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-midterm`].newValue}`}
                          >
                            <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-midterm`].oldValue}</span>
                            <span className="text-blue-900 font-bold">➔</span>
                            <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-midterm`].newValue}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 7. امتحان عملي (إن وجد) */}
                    {isPracticalCourse && (
                      <td className="p-2 bg-emerald-50/50 border-x-2 border-emerald-300">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={gradeLimits.practical || 10}
                            disabled={!isPracticalTeacher}
                            value={g.practical}
                            onChange={(e) => handleCellChange(g.id, 'practical', e.target.value)}
                            title={!isPracticalTeacher ? '🔒 مخصص لأستاذ العملي فقط' : `الحد الأقصى: ${gradeLimits.practical || 10}`}
                            className={`w-18 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isPracticalTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-practical`]
                                ? 'bg-blue-50/80 border-2 border-blue-600 text-blue-950 ring-2 ring-blue-200'
                                : 'bg-emerald-50 border-2 border-emerald-300 text-emerald-950 focus:border-emerald-700'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-practical`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded-md border border-blue-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-practical`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-practical`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-practical`].oldValue}</span>
                              <span className="text-blue-900 font-bold">➔</span>
                              <span className="text-emerald-800 font-bold">{pendingDiffs[`${g.id}-practical`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 🧮 مجموع السعي النهائي (من 50) */}
                    <td className="p-4 bg-slate-100 font-black text-black text-lg border-x-2 border-slate-400">
                      {g.final_coursework_total}
                    </td>

                    {/* 🎯 8. الامتحان النهائي (الدور الأول) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم والمقرر */}
                    {isFinalExamEnabled && (
                      <td className="p-2 bg-slate-50 border-x-2 border-slate-200 animate-in fade-in">
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={50}
                            disabled={!isTheoryTeacher}
                            value={g.final_exam}
                            onChange={(e) => handleCellChange(g.id, 'final_exam', e.target.value)}
                            title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : 'الحد الأقصى: 50'}
                            className={`w-20 p-2.5 rounded-xl text-center font-black text-base focus:outline-none transition ${
                              !isTheoryTeacher
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : pendingDiffs[`${g.id}-final_exam`]
                                ? 'bg-slate-100 border-2 border-[#0F2942] text-slate-950 ring-2 ring-[#0F2942]/20'
                                : 'bg-white border-2 border-slate-300 text-slate-950 focus:border-[#0F2942]'
                            }`}
                          />
                          {pendingDiffs[`${g.id}-final_exam`] && (
                            <div 
                              className="text-[11px] font-black flex items-center justify-center gap-1 bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-md border border-slate-300 mt-1 shadow-2xs animate-in fade-in"
                              title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-final_exam`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-final_exam`].newValue}`}
                            >
                              <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-final_exam`].oldValue}</span>
                              <span className="text-[#0F2942] font-bold">➔</span>
                              <span className="text-emerald-700 font-bold">{pendingDiffs[`${g.id}-final_exam`].newValue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 🔄 الدور الثاني (الإكمال) - يظهر حصراً إذا كان مفعلاً من رئاسة القسم ومتاح فقط للراسبين في الدور الأول */}
                    {isSupplementaryEnabled && (
                      <td className="p-2 bg-slate-50 border-x-2 border-slate-200 animate-in fade-in">
                        {isPassedFirstRound ? (
                          <div className="flex flex-col items-center justify-center">
                            <span 
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1 shadow-2xs select-none"
                              title="الطالب ناجح ومجتاز من الدور الأول (لا يحتاج دور ثاني)"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                              <span>ناجح دور أول</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={50}
                              disabled={!isTheoryTeacher}
                              value={g.supplementary_exam || ''}
                              onChange={(e) => handleCellChange(g.id, 'supplementary_exam', e.target.value)}
                              placeholder="-"
                              title={!isTheoryTeacher ? '🔒 مخصص لأستاذ النظري فقط' : 'درجة الدور الثاني (من 50) - مخصص للطلبة الراسبين/المكملين بالدور الأول'}
                              className={`w-20 p-2 rounded-xl text-center font-black text-base focus:outline-none transition ${
                                !isTheoryTeacher
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : pendingDiffs[`${g.id}-supplementary_exam`]
                                  ? 'bg-slate-100 border-2 border-[#0F2942] text-slate-950 ring-2 ring-[#0F2942]/20'
                                  : 'bg-white border-2 border-slate-300 text-slate-950 focus:border-[#0F2942] shadow-2xs'
                              }`}
                            />
                            {pendingDiffs[`${g.id}-supplementary_exam`] && (
                              <div 
                                className="text-[11px] font-black flex items-center justify-center gap-1 bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded-md border border-slate-300 mt-1 shadow-2xs animate-in fade-in"
                                title={`الدرجة السابقة: ${pendingDiffs[`${g.id}-supplementary_exam`].oldValue} ➔ المقترحة: ${pendingDiffs[`${g.id}-supplementary_exam`].newValue}`}
                              >
                                <span className="line-through text-slate-500">{pendingDiffs[`${g.id}-supplementary_exam`].oldValue}</span>
                                <span className="text-[#0F2942] font-bold">➔</span>
                                <span className="text-emerald-700 font-bold">{pendingDiffs[`${g.id}-supplementary_exam`].newValue}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-700 font-black mt-0.5 flex items-center gap-0.5">
                              <RotateCcw className="w-2.5 h-2.5 text-[#0F2942]" />
                              <span>مؤهل لدور 2</span>
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 💯 المجموع الإجمالي الفعلي (من 100) */}
                    <td className="p-4 bg-slate-100 font-black text-slate-950 text-base border-x-2 border-slate-300">
                      {finalTot}
                    </td>

                    {/* 🅰️ التقدير الحرفي أو حالة المادة */}
                    <td className="p-4 border-x border-slate-300 whitespace-nowrap text-center">
                      {isFinalExamEnabled ? (
                        <span className={`px-3 py-1 rounded-xl font-black text-base whitespace-nowrap inline-block ${ finalTot >= 50 ? 'bg-slate-100 text-slate-950 border border-slate-300' : 'bg-rose-50 text-rose-950 border border-rose-200' }`}>
                          {letterGrad}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap inline-flex items-center gap-1 shadow-2xs">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>بانتظار الفاينل</span>
                        </span>
                      )}
                    </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
      </>
      )}

      {/* 📚 4. تبويب إدارة التكليفات والامتحانات الفصلية لمادة الأستاذ */}
      {activeCourseTab === 'assessments' && currentUser && course && (
        <TeacherAssessmentsManager
          teacherId={currentUser.id}
          teacherName={currentUser.full_name}
          assignedCourses={[
            {
              id: `tc-${course.id}`,
              teacher_id: currentUser.id,
              teacher_name: currentUser.full_name,
              course_id: course.id,
              course_name: course.name,
              department_id: course.department_id,
              semester: (course.semester as 1 | 2) || 1,
            },
          ]}
        />
      )}

      {/* 📢 نافذة التبليغات والتنبيهات الذكية للحضور والغيابات والعطل والامتحانات */}
      {course && (
        <AttendanceNoticeModal
          isOpen={isGradeNoticeModalOpen}
          onClose={() => {
            setIsGradeNoticeModalOpen(false);
            setGradeNoticeTargetStudent(null);
          }}
          departmentId={course.department_id || 'dept-1'}
          departmentName={course.department_name || 'القسم الأكاديمي'}
          students={courseStudents}
          initialStudent={gradeNoticeTargetStudent}
          initialSelectedStudentIds={selectedGradeStudentIds}
          defaultCategory={gradeNoticeDefaultCategory}
          onNoticeSent={(summary) => {
            setSuccessMessage(summary);
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {/* ℹ️ نافذة تعليمات وضوابط رصد واستيراد درجات مادة الأستاذ */}
      {showExcelInstructions && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* رأس نافذة التعليمات */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط رصد درجات مادة ({course?.name})</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا</p>
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

            {/* نصوص وشرح التعليمات الأكاديمية */}
            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
                  <span>1. توزيع أوزان درجات مسار بولونيا للمادة:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يتم احتساب السعي الفصلي (من 50) والامتحان النهائي (من 50) وفق الأوزان المحددة من رئاسة القسم:
                  الكويزات ({assessmentScheme.quiz1.max_score + assessmentScheme.quiz2.max_score} درجات)، الواجبات ({assessmentScheme.assignment1.max_score + assessmentScheme.assignment2.max_score} درجات)، التقرير ({assessmentScheme.report.max_score} درجات)، النصفي ({assessmentScheme.midterm.max_score} درجات) {isPracticalCourse ? `، والعملي (${assessmentScheme.practical.max_score} درجات)` : ''}.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
                  <span>2. مطابقة أسماء الطلبة والتسلسل:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  تتم مطابقة درجات الطلاب تلقائياً بالاسم الرباعي والتسلسل، دون الحاجة للرقم الجامعي.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
                  <span>3. حدود الدرجات القصوى والدرجات الرقمية:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  تأكد من عدم إدخال درجات تتجاوز الحد الأقصى لكل بند، وتجنب استخدام الرموز أو النصوص داخل خلايا الدرجات.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-800 shrink-0" />
                  <span>4. الصلاحيات الأكاديمية وسجل الأمان:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يقوم النظام بتحديث الحقول المصرح لك بها فقط (النظري لأستاذ النظري، والعملي لأستاذ المختبر)، مع توثيق كافة التعديلات في سجل الأمان.
                </p>
              </div>
            </div>

            {/* فوتر نافذة التعليمات مع زر تنزيل النموذج */}
            <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDownloadTemplate();
                  setShowExcelInstructions(false);
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-5 h-5 text-cyan-300" />
                <span>تحميل نموذج Excel المعتمد للمادة</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة معاينة وتأكيد استيراد ملف Excel لدرجات المادة */}
      {excelPreviewRows && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* رأس نافذة المعاينة */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shrink-0">
                  <FileText className="w-6 h-6 text-emerald-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">معاينة ومطابقة درجات ملف Excel لمادة ({course?.name})</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    تم العثور على ({excelPreviewRows.length}) سجل طالب جاهز للمطابقة والاستيراد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExcelPreviewRows(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* إحصائية وتنبيه الصلاحية أثناء الاستيراد */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-emerald-950 font-black text-sm sm:text-base">
                  سيتم استيراد وتحديث درجات الطلبة وفق صلاحيتك الأكاديمية الحالية ({isTheoryTeacher && isPracticalTeacher ? 'النظري والعملي' : isTheoryTeacher ? 'النظري فقط' : 'العملي فقط'}).
                </span>
              </div>
            </div>

            {/* جدول معاينة الصفوف المستوردة من الإكسل */}
            <div className="overflow-x-auto overflow-y-auto border-2 border-slate-200 rounded-2xl flex-1 max-h-[45vh]">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0F2942] text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                    <th className="p-3 border-l border-[#1e4570] text-center w-12">ت</th>
                    <th className="p-3 border-l border-[#1e4570]">اسم الطالب الرباعي</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.quiz1.title_ar}</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.quiz2.title_ar}</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.assignment1.title_ar}</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.assignment2.title_ar}</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.report.title_ar}</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.midterm.title_ar}</th>
                    {isPracticalCourse && <th className="p-3 border-l border-[#1e4570] text-center">{assessmentScheme.practical.title_ar}</th>}
                    {/* 🎯 عمود النهائي يظهر بالمعاينة فقط إذا كان الامتحان مفعلاً بالقسم */}
                    {isFinalExamEnabled && (
                      <th className={`p-3 text-center ${isSupplementaryEnabled ? 'border-l border-[#1e4570]' : ''}`}>{assessmentScheme.final_exam.title_ar}</th>
                    )}
                    {/* 🔄 عمود الدور الثاني يظهر بالمعاينة فقط إذا كانت فترة الدور الثاني مفعلة */}
                    {isSupplementaryEnabled && (
                      <th className="p-3 text-center">امتحان الدور الثاني (50)</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {excelPreviewRows.map((row, idx) => {
                    const stdName = String(row['اسم الطالب الرباعي'] || row['اسم الطالب'] || row['student_name'] || row['الاسم'] || row['std_name'] || '').trim();
                    return (
                      <tr key={idx} className={`border-b border-slate-200 font-black ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="p-2.5 border-l border-slate-200 text-center text-slate-700">{idx + 1}</td>
                        <td className="p-2.5 border-l border-slate-200 text-slate-950 font-bold">{stdName || '—'}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.quiz1.title_ar} (${assessmentScheme.quiz1.max_score})`] ?? row['الكويز1 (5)'] ?? row['كويز1'] ?? '-')}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.quiz2.title_ar} (${assessmentScheme.quiz2.max_score})`] ?? row['الكويز2 (5)'] ?? row['كويز2'] ?? '-')}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.assignment1.title_ar} (${assessmentScheme.assignment1.max_score})`] ?? row['الواجب1 (5)'] ?? row['واجب1'] ?? '-')}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.assignment2.title_ar} (${assessmentScheme.assignment2.max_score})`] ?? row['الواجب2 (5)'] ?? row['واجب2'] ?? '-')}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.report.title_ar} (${assessmentScheme.report.max_score})`] ?? row['التقرير (10)'] ?? row['تقرير'] ?? '-')}</td>
                        <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.midterm.title_ar} (${assessmentScheme.midterm.max_score})`] ?? row['الميدترم (10)'] ?? row['نصفي'] ?? '-')}</td>
                        {isPracticalCourse && <td className="p-2.5 border-l border-slate-200 text-center">{String(row[`${assessmentScheme.practical.title_ar} (${assessmentScheme.practical.max_score})`] ?? row['العملي (10)'] ?? row['عملي'] ?? '-')}</td>}
                        {/* 🎯 درجة الفاينل تظهر فقط عند تفعيل الفاينل */}
                        {isFinalExamEnabled && (
                          <td className={`p-2.5 text-center ${isSupplementaryEnabled ? 'border-l border-slate-200' : ''}`}>{String(row[`${assessmentScheme.final_exam.title_ar} (${assessmentScheme.final_exam.max_score})`] ?? row['النهائي (50)'] ?? row['نهائي'] ?? '-')}</td>
                        )}
                        {/* 🔄 درجة الدور الثاني تظهر فقط عند تفعيل الدور الثاني */}
                        {isSupplementaryEnabled && (
                          <td className="p-2.5 text-center">{String(row['امتحان الدور الثاني (50)'] ?? row['الدور الثاني (50)'] ?? row['دور ثاني'] ?? row['sup'] ?? '-')}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* فوتر تأكيد الاستيراد */}
            <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setExcelPreviewRows(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmExcelImport}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>تأكيد واستيراد الدرجات الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 ℹ️ نافذة تعليمات وضوابط الحضور والغياب الأسبوعي */}
      {showAttendanceInstructions && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 shrink-0">
                  <ClipboardList className="w-6 h-6 text-emerald-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط الحضور والغياب لمادة ({course?.name})</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                  <span>1. الخطة الأسبوعية المعتمدة (15 أسبوعاً):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يتكون الكورس الدراسي من 15 أسبوعاً تدريسياً معتمداً. يتم تسجيل حضور الطلاب لكل محاضرة بدقة.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                  <span>2. نسب الغياب والإنذارات الأكاديمية:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  - <strong>الإنذار الأولي:</strong> عند بلوغ الغياب 5% من مجموع ساعات المادة.<br />
                  - <strong>الإنذار النهائي:</strong> عند بلوغ الغياب 7% من مجموع ساعات المادة.<br />
                  - <strong>الحرمان من الامتحان:</strong> عند تجاوز الغياب 10% بدون عذر رسمي مشروع.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                  <span>3. خيارات رصد الحضور المقبولة في Excel:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يقبل النظام الكلمات التالية في خلايا الأسابيع: (حاضر)، (غائب)، (مجاز بعذر رسمي).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDownloadAttendanceTemplate();
                  setShowAttendanceInstructions(false);
                }}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-5 h-5 text-emerald-200" />
                <span>تحميل نموذج Excel للحضور (15 أسبوعاً)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAttendanceInstructions(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 📊 نافذة معاينة وتأكيد استيراد ملف Excel للحضور والغياب */}
      {attendanceExcelPreviewRows && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shrink-0">
                  <ClipboardList className="w-6 h-6 text-emerald-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">معاينة ومطابقة سجل الحضور من ملف Excel لمادة ({course?.name})</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    تم العثور على ({attendanceExcelPreviewRows.length}) سجل طالب جاهز للاستيراد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttendanceExcelPreviewRows(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-auto border-2 border-slate-200 rounded-2xl flex-1 max-h-[45vh]">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-emerald-900 text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                    <th className="p-3 border-l border-emerald-800 text-center w-12">ت</th>
                    <th className="p-3 border-l border-emerald-800 min-w-[180px]">اسم الطالب الرباعي</th>
                    {Array.from({ length: 15 }, (_, i) => (
                      <th key={i} className="p-2 border-l border-emerald-800 text-center text-xs">أ {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceExcelPreviewRows.map((row, idx) => {
                    const stdName = String(row['اسم الطالب الرباعي'] || row['اسم الطالب'] || row['student_name'] || row['الاسم'] || row['std_name'] || '').trim();
                    return (
                      <tr key={idx} className={`border-b border-slate-200 font-black ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="p-2.5 border-l border-slate-200 text-center text-slate-700">{idx + 1}</td>
                        <td className="p-2.5 border-l border-slate-200 text-slate-950 font-bold">{stdName || '—'}</td>
                        {Array.from({ length: 15 }, (_, i) => {
                          const wVal = String(row[`أسبوع ${i + 1} (حاضر / غائب / مجاز)`] || row[`أسبوع ${i + 1}`] || row[`اسبوع ${i + 1}`] || row[`week_${i + 1}`] || '-');
                          const isAbsent = wVal.includes('غائب') || wVal.includes('غياب');
                          const isExcused = wVal.includes('مجاز') || wVal.includes('عذر');
                          return (
                            <td key={i} className={`p-2 border-l border-slate-200 text-center text-xs ${isAbsent ? 'text-rose-600 font-black bg-rose-50' : isExcused ? 'text-blue-700 font-black bg-blue-50' : 'text-emerald-700 font-bold'}`}>
                              {wVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setAttendanceExcelPreviewRows(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmAttendanceExcelImport}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>تأكيد واستيراد سجل الحضور الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 ℹ️ نافذة تعليمات وضوابط التكليفات والامتحانات الفصلية */}
      {showAssessmentInstructions && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-100 text-sky-900 rounded-2xl border border-sky-200 shrink-0">
                  <FileText className="w-6 h-6 text-sky-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط التكليفات والامتحانات</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">مادة: {course?.name} | مسار بولونيا</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssessmentInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-sky-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-sky-800 shrink-0" />
                  <span>1. خطة التقييم والتكليفات المستمرة:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يتضمن مسار بولونيا تقييماً دورياً يشمل كويزين، واجبين بيتيين، تقريراً علمياً، وامتحاناً نصف فصلي.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-sky-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-sky-800 shrink-0" />
                  <span>2. مواعيد التسليم والتصحيح:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يجب تحديد مواعيد تسليم واضحة للتكليفات، مع إمكانية تصحيح إجابات الطلاب وإرسال الملاحظات التوجيهية لهم مباشرة عبر المنظومة.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAssessmentInstructions(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ ℹ️ نافذة معايير الأمان والتدقيق الأكاديمي */}
      {showAuditInstructions && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-indigo-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">معايير الأمان والتدقيق الأكاديمي (Zero Trust)</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed overflow-y-auto pl-1 flex-1">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-800 shrink-0" />
                  <span>1. سجل التعديلات غير القابل للحذف (Immutable Audit Trail):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يتم تسجيل كل تعديل على الدرجات مع التوقيت الدقيق، اسم المعدّل، القيمة السابقة والقيمة الجديدة لضمان النزاهة والشفافية.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-800 shrink-0" />
                  <span>2. الفصل الصارم للصلاحيات الأكاديمية:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  لا يمكن لأستاذ النظري تعديل درجات العملي، ولا يمكن لأستاذ العملي تعديل درجات النظري إلا بالصلاحيات المشتركة الممنوحة من رئيس القسم.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowAuditInstructions(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 نافذة رصد درجة موحدة للطلاب المحددين */}
      {isBulkGradeModalOpen && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
            
            {/* 📌 الهيدر الثابت للكارد (Fixed Header) */}
            <div className="p-5 sm:p-6 bg-white border-b-2 border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-950 rounded-2xl border-2 border-blue-300 shrink-0">
                  <Sliders className="w-6 h-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-black">رصد درجة موحدة للطلاب المحددين</h3>
                  <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                    سيتم تطبيق الدرجة على ({selectedGradeStudentIds.length}) طالب محدد في المسودة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkGradeModalOpen(false)}
                className="p-2 text-black hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                title="إغلاق النافذة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 📜 الجسم القابل للتمرير فقط (Scrollable Body) */}
            <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              {/* 🎯 قائمة اختيار بند التقييم الاحترافية والمخصصة بالكامل */}
              {(() => {
                const availableBulkAssessmentItems = [
                  ...(isTheoryTeacher ? [
                    { key: 'quiz1' as keyof Grade, title: assessmentScheme.quiz1.title_ar, max: assessmentScheme.quiz1.max_score, icon: FileText, desc: 'امتحان الكويز الأول' },
                    { key: 'quiz2' as keyof Grade, title: assessmentScheme.quiz2.title_ar, max: assessmentScheme.quiz2.max_score, icon: FileText, desc: 'امتحان الكويز الثاني' },
                    { key: 'assignment1' as keyof Grade, title: assessmentScheme.assignment1.title_ar, max: assessmentScheme.assignment1.max_score, icon: ClipboardList, desc: 'الواجب الدراسي الأول' },
                    { key: 'assignment2' as keyof Grade, title: assessmentScheme.assignment2.title_ar, max: assessmentScheme.assignment2.max_score, icon: ClipboardList, desc: 'الواجب الدراسي الثاني' },
                    { key: 'report' as keyof Grade, title: assessmentScheme.report.title_ar, max: assessmentScheme.report.max_score, icon: BookOpen, desc: 'تقرير وبحث الفصل' },
                    { key: 'midterm' as keyof Grade, title: assessmentScheme.midterm.title_ar, max: assessmentScheme.midterm.max_score, icon: GraduationCap, desc: 'امتحان نصف الفصل (المدتيرم)' },
                    ...(isFinalExamEnabled ? [{ key: 'final_exam' as keyof Grade, title: assessmentScheme.final_exam.title_ar, max: assessmentScheme.final_exam.max_score, icon: Award, desc: 'الامتحان النهائي للمادة' }] : []),
                    ...(isSupplementaryEnabled ? [{ key: 'supplementary_exam' as keyof Grade, title: 'امتحان الدور الثاني (الإكمال)', max: 50, icon: RotateCcw, desc: 'امتحان الدور الثاني' }] : []),
                  ] : []),
                  ...(isPracticalTeacher && isPracticalCourse ? [
                    { key: 'practical' as keyof Grade, title: assessmentScheme.practical.title_ar, max: assessmentScheme.practical.max_score, icon: FlaskConical, desc: 'امتحان التقييم العملي' },
                  ] : []),
                ];

                const currentBulkItem = availableBulkAssessmentItems.find(item => item.key === bulkSelectedField) || availableBulkAssessmentItems[0];
                const CurrentIcon = currentBulkItem?.icon || FileText;

                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-base font-black text-black flex items-center gap-1.5">
                        <Sliders className="w-5 h-5 text-blue-900" />
                        <span>اختر بند التقييم المطلوب:</span>
                      </label>
                      <span className="text-sm font-black text-black">
                        الحد الأقصى: <strong className="text-black font-black underline">{gradeLimits[bulkSelectedField] || currentBulkItem?.max || 50}</strong> درجة
                      </span>
                    </div>

                    {/* حاوية زر القائمة المنسدلة المنبثقة ملاصقة للزر تماماً */}
                    <div className="relative">
                      {/* زر تشغيل القائمة المنسدلة الفاخرة */}
                      <button
                        type="button"
                        onClick={() => setIsBulkFieldDropdownOpen(!isBulkFieldDropdownOpen)}
                        className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-400 hover:border-black rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 bg-[#0F2942] text-white rounded-xl shadow-sm shrink-0">
                            <CurrentIcon className="w-6 h-6 text-cyan-300" />
                          </div>
                          <div className="text-right">
                            <div className="font-black text-lg text-black flex items-center gap-2.5">
                              <span>{currentBulkItem?.title}</span>
                              <span className="px-2.5 py-0.5 bg-blue-100 text-black rounded-lg text-sm font-black border border-blue-300">
                                من {currentBulkItem?.max}
                              </span>
                            </div>
                            <p className="text-sm font-black text-black mt-1">{currentBulkItem?.desc}</p>
                          </div>
                        </div>

                        <div className="p-2 bg-slate-200 text-black rounded-xl border border-slate-300">
                          <ChevronDown className={`w-6 h-6 transition-transform duration-200 ${isBulkFieldDropdownOpen ? 'rotate-180 text-black' : 'text-black'}`} />
                        </div>
                      </button>

                      {/* القائمة المنسدلة المنبثقة المخصصة - تظهر ملاصقة للزر مباشرة وداخل الشاشة */}
                      {isBulkFieldDropdownOpen && (
                        <>
                          {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setIsBulkFieldDropdownOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-slate-400 rounded-2xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            {availableBulkAssessmentItems.map((item) => {
                              const ItemIcon = item.icon;
                              const isSelected = item.key === bulkSelectedField;

                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setBulkSelectedField(item.key);
                                    setIsBulkFieldDropdownOpen(false);
                                  }}
                                  className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer text-right ${
                                    isSelected
                                      ? 'bg-blue-50 border-2 border-blue-900 text-black font-black shadow-sm'
                                      : 'bg-white hover:bg-slate-100 text-black border border-transparent font-bold'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#0F2942] text-cyan-300' : 'bg-slate-200 text-black'}`}>
                                      <ItemIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="text-base font-black text-black">{item.title}</div>
                                      <div className="text-sm font-black text-black mt-0.5">{item.desc}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-1 bg-slate-200 text-black rounded-lg text-sm font-black border border-slate-400">
                                      من {item.max}
                                    </span>
                                    {isSelected && <Check className="w-5 h-5 text-blue-900 shrink-0" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* شرائح الاختيار السريع (Quick Selection Chips) */}
                    <div className="pt-1">
                      <div className="text-xs font-black text-black mb-1.5">اختيار سريع ومباشر:</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {availableBulkAssessmentItems.map((item) => {
                          const isSelected = item.key === bulkSelectedField;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                setBulkSelectedField(item.key);
                                setIsBulkFieldDropdownOpen(false);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-black border-slate-400'
                              }`}
                            >
                              {item.title} ({item.max})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* إدخال الدرجة */}
              <div className="space-y-2.5 pt-2.5 border-t-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-black">
                    الدرجة الموحدة المراد رصدها:
                  </label>
                  <span className="text-xs font-black text-black bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-300">
                    الحد الأقصى: {gradeLimits[bulkSelectedField] || 50}
                  </span>
                </div>

                {/* 📦 حاوية حقل إدخال الدرجة مع تموضع نسبي */}
                <div className="relative">
                  {/* 🔢 حقل إدخال الدرجة الجماعية مع تلميح رصاصي وخط متوسط مريح */}
                  <input
                    type="number" // 🔢 نوع الحقل رقمي
                    step="0.5" // 🎯 خطوة الزيادة نصف درجة
                    min="0" // 🛑 أقل درجة صفر
                    max={gradeLimits[bulkSelectedField] || 50} // 🔝 أقصى حد للدرجة
                    value={bulkGradeValue} // 💾 قيمة الدرجة بالحالة
                    onChange={(e) => setBulkGradeValue(e.target.value)} // 🔄 تحديث القيمة فوراً
                    placeholder="أدخل الدرجة (مثال: 4.5)" // 💡 نص التلميح التوضيحي
                    className="w-full p-3 bg-slate-50 border-2 border-slate-400 hover:border-black focus:border-[#0F2942] rounded-2xl font-black text-xl text-black placeholder:text-base placeholder:font-medium placeholder:text-slate-400 text-center focus:outline-none transition shadow-inner" // 🎨 تلميح رصاصي مريح للعين
                    autoFocus // 🎯 تركيز مباشر
                  />
                </div>

                {/* أزرار مساعدة سريعة لتعبئة الدرجة (Presets) */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBulkGradeValue(String(gradeLimits[bulkSelectedField] || 5))}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-black border-2 border-emerald-400 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    الدرجة الكاملة ({gradeLimits[bulkSelectedField] || 5})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkGradeValue(String((gradeLimits[bulkSelectedField] || 5) / 2))}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-black border-2 border-blue-400 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    نصف الدرجة ({(gradeLimits[bulkSelectedField] || 5) / 2})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkGradeValue('0')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-black border-2 border-slate-400 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    صفر (0)
                  </button>
                </div>
              </div>
            </div>

            {/* 📌 الفوتر الثابت للكارد (Fixed Footer) */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsBulkGradeModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-sm sm:text-base font-black rounded-xl border-2 border-slate-400 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyBulkGrade}
                className="px-7 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm sm:text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-300" />
                <span>تطبيق على ({selectedGradeStudentIds.length}) طالب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚖️ نافذة مراجعة ومقارنة الفروقات بين الدرجة السابقة والدرجة الحديثة */}
      {isPendingDiffModalOpen && (
        <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-4xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-950 rounded-2xl border border-blue-300 shrink-0">
                  <History className="w-6 h-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">مسودة مراجعة ومقارنة التعديلات المعلقة</h3>
                  <p className="text-sm font-black text-black mt-0.5">
                    مقارنة الدرجة السابقة (قبل التعديل) مقابل الدرجة المقترحة (بعد التعديل) لمادة ({course?.name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPendingDiffModalOpen(false)}
                className="p-2 text-black hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* جدول المقارنة */}
            <div className="overflow-x-auto overflow-y-auto border-2 border-slate-300 rounded-2xl flex-1 max-h-[50vh]">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0F2942] text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                    <th className="p-3 border-l border-[#1e4570] text-center w-12">ت</th>
                    <th className="p-3 border-l border-[#1e4570]">اسم الطالب</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">نوع التقييم</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">الدرجة السابقة</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">الدرجة الحديثة</th>
                    <th className="p-3 border-l border-[#1e4570] text-center">فارق التغيير</th>
                    <th className="p-3 text-center w-24">تراجع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-black">
                  {Object.entries(pendingDiffs).map(([key, diff], idx) => (
                    <tr key={key} className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                      <td className="p-3 border-l border-slate-300 text-center text-black font-black">{idx + 1}</td>
                      <td className="p-3 border-l border-slate-300 text-black font-black">{diff.studentName}</td>
                      <td className="p-3 border-l border-slate-300 text-center text-black font-black">{diff.fieldLabelAr}</td>
                      <td className="p-3 border-l border-slate-300 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 text-black rounded-lg border border-slate-400 line-through font-black">
                          {diff.oldValue}
                        </span>
                      </td>
                      <td className="p-3 border-l border-slate-300 text-center">
                        <span className="px-2.5 py-1 bg-blue-50 text-black rounded-lg border border-blue-400 font-black">
                          {diff.newValue}
                        </span>
                      </td>
                      <td className="p-3 border-l border-slate-300 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          diff.delta > 0 ? 'bg-emerald-100 text-black' : diff.delta < 0 ? 'bg-rose-100 text-black' : 'bg-slate-100 text-black'
                        }`}>
                          {diff.delta > 0 ? `+${diff.delta}` : `${diff.delta}`}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRevertSingleDiff(key)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-800 rounded-lg border border-slate-300 hover:border-rose-300 transition cursor-pointer"
                          title="تراجع عن هذا التعديل بمفرده"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* أزرار الحفظ والإغلاق */}
            <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsPendingDiffModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
              >
                إغلاق المعاينة
              </button>
              <button
                type="button"
                onClick={handleSaveAllPendingGrades}
                disabled={isSavingPendingGrades}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                <Save className="w-5 h-5 text-white" />
                <span>حفظ واعتماد التعديلات رسمياً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </ZeroTrustGuard>
  );
}
