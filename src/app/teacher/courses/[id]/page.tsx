'use client'; // ⚡ ينفذ بالعميل

// 📊 جدول إدخال وتعديل درجات الطلاب للمادة الكحلي الاستجابي 100% - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, use, useMemo } from 'react'; // 🔗 رياكت
import { 
  getCurrentSessionUser, 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncAttendanceRecordsFromSupabase,
  saveMultipleAttendanceRecordsToSupabase,
  syncGradesFromSupabase,
  syncProfilesFromSupabase, // 👥 مزامنة حسابات الطلاب والأساتذة من السحابة
  syncCoursesFromSupabase, // 📚 مزامنة المواد من سحابة Supabase
  syncTeacherCoursesFromSupabase, // 📋 مزامنة تكليفات الأساتذة من سحابة Supabase
  saveMultipleGradesToSupabase,
  saveAuditLogToSupabase,
} from '@/lib/supabase-client'; // 🔌 الجلسة والمزامنة السحابية المباشرة
import { reconcileCoursesWithTeacherCourses } from '@/app/admin/department-portal/page'; // 🔄 دالة التوفيق والتزامن المركزي بين المواد والتكليفات
import { getStoredData, saveStoredData, INITIAL_GRADES, INITIAL_COURSES, INITIAL_DEPARTMENTS, INITIAL_TEACHER_COURSES, INITIAL_AUDIT_LOGS, INITIAL_SCHEDULE_LECTURES, INITIAL_ATTENDANCE_RECORDS, INITIAL_PROFILES, getAcademicYear } from '@/lib/mock-data'; // 💾 البيانات
import { Grade, Course, Department, TeacherCourse, UserProfile, AuditLog, ScheduleLecture, StudentAttendanceRecord, AttendanceStatus } from '@/types'; // 🔗 الأنواع الرسمية
import { calculateCourseworkTotal, calculateFinalTotal, getLetterGrade, getCourseAssessmentScheme, getCourseGradeLimits, isStudentPassedFirstRound, isAssessmentItemActive } from '@/lib/grade-utils'; // 🧮 الحسابات والحدود وفحص استحقاق الدور الثاني والبند النشط
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { downloadTeacherGradeTemplate, downloadTeacherAttendanceTemplate, parseExcelFile, exportCustomGradesList } from '@/lib/excel-utils'; // 📊 ميزة الجداول المجدولة وتصدير سعي بولونيا الفاخر
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import { exportCourseGradeSheetPDF, exportCourseAttendanceSheetPDF } from '@/lib/pdf-export'; // 📄 مولد كشف درجات المادة وسجل الحضور PDF
import { DAYS_OF_WEEK_LIST } from '@/lib/schedule-utils'; // 🕒 أسماء الأيام
import { CheckCircle2, AlertCircle, X } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG للإشعارات
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { sanitizeRouteParam } from '@/lib/security/sanitizer'; // 🧹 معقم مسارات الروابط
import AttendanceSheetEditor from '@/components/attendance/AttendanceSheetEditor'; // 📋 محرر الحضور والغياب للأستاذ
import { TeacherAssessmentsManager } from '@/components/assessments/TeacherAssessmentsManager'; // 📚 مكون إدارة التكليفات والامتحانات الفصلية
import AttendanceNoticeModal, { AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 نافذة التبليغات والتنبيهات الذكية
import CourseHeader from '@/components/teacher-course/CourseHeader'; // 🏛️ مكون هيدر المادة الشامل
import CourseTabsBar from '@/components/teacher-course/CourseTabsBar'; // 🎛️ شريط التبويبات الأربعة
import CourseGradesTab from '@/components/teacher-course/CourseGradesTab'; // 📊 تبويب رصد الدرجات الشامل
import CourseAuditTab from '@/components/teacher-course/CourseAuditTab'; // 📜 تبويب سجل التدقيق والحركات
import CoursePendingDiffModal, { PendingGradeDiff } from '@/components/teacher-course/CoursePendingDiffModal'; // ⚖️ نافذة مقارنة الفروقات
import CourseBulkGradeModal from '@/components/teacher-course/CourseBulkGradeModal'; // 🎯 نافذة الرصد الموحد
import CourseGradeInstructionsModal from '@/components/teacher-course/CourseGradeInstructionsModal'; // ℹ️ نافذة تعليمات الدرجات
import CourseGradeExcelPreviewModal from '@/components/teacher-course/CourseGradeExcelPreviewModal'; // 📊 نافذة معاينة درجات الإكسل
import CourseAttendanceInstructionsModal from '@/components/teacher-course/CourseAttendanceInstructionsModal'; // 📋 نافذة تعليمات الحضور
import CourseAttendanceExcelPreviewModal from '@/components/teacher-course/CourseAttendanceExcelPreviewModal'; // 📋 نافذة معاينة حضور الإكسل
import CourseAssessmentInstructionsModal from '@/components/teacher-course/CourseAssessmentInstructionsModal'; // 📝 نافذة تعليمات التكليفات
import CourseAuditInstructionsModal from '@/components/teacher-course/CourseAuditInstructionsModal'; // 🛡️ نافذة معايير الأمان والتدقيق

// 📋 إعادة تصدير واجهة مسودة التعديل من المكون المستقل
export type { PendingGradeDiff };

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
  const [isExportingExcel, setIsExportingExcel] = useState(false); // 📊 حالة تصدير سعي المادة إكسل
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

      // 🔄 التوفيق المركزي الفوري لضمان عدم ضياع التكليف أو المادة
      const rec = reconcileCoursesWithTeacherCourses(allCourses, allTCs, allProfiles);
      const effectiveCourses = rec.reconciledCourses;
      const effectiveTCs = rec.reconciledTCs;

      // 🔤 دالة تطبيع النصوص لمطابقة المادة بدقة بدون مشاكل الهمزات
      const normText = (s?: string) => {
        if (!s) return '';
        return s.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ئ/g, 'ي').replace(/ؤ/g, 'و').replace(/[^\p{L}\p{N}]/gu, '');
      };

      const targetDecoded = decodeURIComponent(courseId).trim();
      const targetNorm = normText(targetDecoded);

      // 🔍 البحث عن التكليف المطابق لمادة الأستاذ من التكليفات الموفقة
      const matchedTC = effectiveTCs.find(
        (tc: TeacherCourse): boolean =>
          tc.course_id === courseId ||
          tc.id === courseId ||
          Boolean(tc.course_name && normText(tc.course_name) === targetNorm)
      );

      // 🔍 البحث عن المادة في جدول المواد الموفقة
      let foundCourse = effectiveCourses.find(
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
          const courseScheme = getCourseAssessmentScheme(foundCourse); // 🎛️ جلب مخطط التقييم المعتمد للمادة
          const coursework = calculateCourseworkTotal(g, courseScheme); // 📝 حساب السعي التكويني للبند المفتوح فقط
          const finalTot = isCourseFinalActive ? calculateFinalTotal(g, isCourseSupActive, courseScheme) : coursework; // 💯 احتساب المجموع للبند المفتوح بالمخطط
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

    // 📚📋 مزامنة حية للمواد وتكليفات الأساتذة من سحابة Supabase
    Promise.all([syncCoursesFromSupabase(), syncTeacherCoursesFromSupabase()]).then(([liveCourses, liveTCs]) => {
      if ((liveCourses && liveCourses.length > 0) || (liveTCs && liveTCs.length > 0)) {
        loadCourseData();
      }
    }).catch(() => {});

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
  const isPracticalCourse = Boolean(course?.course_type === 'theory_and_practical' || course?.has_practical);
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
  const isAdmin = Boolean(currentUser && ['super_admin', 'admin', 'department_head', 'rapporteur'].includes(currentUser.role));
  const isTheoryTeacher = Boolean(isAdmin || (currentUser && course && (currentUser.id === course.theory_teacher_id || (!course.theory_teacher_id && !course.practical_teacher_id))));
  const isPracticalTeacher = Boolean(isAdmin || (currentUser && course && (currentUser.id === course.practical_teacher_id)));

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
      created_at: '2026-09-01',
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
      if (targetG && isStudentPassedFirstRound(targetG, assessmentScheme)) {
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

        // 🧮 إعادة حساب السعي والنهائي والتقدير الحرفي تلقائياً في المسودة وفق حالة الدور الثاني والبند المفتوح
        updatedG.final_coursework_total = calculateCourseworkTotal(updatedG, assessmentScheme);
        updatedG.final_total = calculateFinalTotal(updatedG, isSupplementaryEnabled, assessmentScheme); // 💯 حساب النهائي للبند المفتوح
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
        restoredG.final_coursework_total = calculateCourseworkTotal(restoredG, assessmentScheme); // 🧮 إعادة حساب السعي للمخطط
        restoredG.final_total = calculateFinalTotal(restoredG, isSupplementaryEnabled, assessmentScheme); // 💯 حساب النهائي للبند المفتوح
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
        if (bulkSelectedField === 'supplementary_exam' && isStudentPassedFirstRound(g, assessmentScheme)) {
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

        updatedG.final_coursework_total = calculateCourseworkTotal(updatedG, assessmentScheme); // 🧮 إعادة حساب السعي للمخطط
        updatedG.final_total = calculateFinalTotal(updatedG, isSupplementaryEnabled, assessmentScheme); // 💯 حساب النهائي للبند المفتوح
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

        // تحديث حقول النظري فقط إذا كان مسموحاً له وكان البند مفتوحاً وغير معطل
        if (isTheoryTeacher) {
          if (isAssessmentItemActive(assessmentScheme.quiz1)) {
            const q1 = extractVal(matchRow, 'الكويز1 (5)', assessmentScheme.quiz1.title_ar, assessmentScheme.quiz1.max_score, g.quiz1);
            newG.quiz1 = q1; checkAndAddDiff('quiz1', q1); // 📝 تعيين الكويز 1
          }
          if (isAssessmentItemActive(assessmentScheme.quiz2)) {
            const q2 = extractVal(matchRow, 'الكويز2 (5)', assessmentScheme.quiz2.title_ar, assessmentScheme.quiz2.max_score, g.quiz2);
            newG.quiz2 = q2; checkAndAddDiff('quiz2', q2); // 📝 تعيين الكويز 2
          }
          if (isAssessmentItemActive(assessmentScheme.assignment1)) {
            const a1 = extractVal(matchRow, 'الواجب1 (5)', assessmentScheme.assignment1.title_ar, assessmentScheme.assignment1.max_score, g.assignment1);
            newG.assignment1 = a1; checkAndAddDiff('assignment1', a1); // 📋 تعيين الواجب 1
          }
          if (isAssessmentItemActive(assessmentScheme.assignment2)) {
            const a2 = extractVal(matchRow, 'الواجب2 (5)', assessmentScheme.assignment2.title_ar, assessmentScheme.assignment2.max_score, g.assignment2);
            newG.assignment2 = a2; checkAndAddDiff('assignment2', a2); // 📋 تعيين الواجب 2
          }
          if (isAssessmentItemActive(assessmentScheme.report)) {
            const rep = extractVal(matchRow, 'التقرير (10)', assessmentScheme.report.title_ar, assessmentScheme.report.max_score, g.report);
            newG.report = rep; checkAndAddDiff('report', rep); // 📑 تعيين التقرير
          }
          if (isAssessmentItemActive(assessmentScheme.midterm)) {
            const mid = extractVal(matchRow, 'الميدترم (10)', assessmentScheme.midterm.title_ar, assessmentScheme.midterm.max_score, g.midterm);
            newG.midterm = mid; checkAndAddDiff('midterm', mid); // 📊 تعيين الميدترم
          }
          // 🎯 استيراد وتحديث درجات الفاينل فقط وفقط إذا كان الامتحان النهائي مفعلاً ومفتوحاً بالقسم
          if (isFinalExamEnabled && isAssessmentItemActive(assessmentScheme.final_exam)) {
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

        // تحديث حقل العملي فقط إذا كان مسموحاً له وكان البند مفتوحاً
        if (isPracticalTeacher && isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical)) {
          const prac = extractVal(matchRow, 'العملي (10)', assessmentScheme.practical.title_ar, assessmentScheme.practical.max_score, g.practical);
          newG.practical = prac; checkAndAddDiff('practical', prac);
          newG.practical_updated_by = currentUser?.full_name || 'أستاذ العملي';
          newG.practical_updated_at = nowIso;
        }

        newG.updated_at = nowIso;
        newG.final_coursework_total = calculateCourseworkTotal(newG, assessmentScheme); // 🧮 حساب السعي للمخطط المعتمد للبند المفتوح
        newG.final_total = calculateFinalTotal(newG, isSupplementaryEnabled, assessmentScheme); // 💯 حساب النهائي للبند المفتوح بالمخطط
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

  // 📊 دالة تصدير سجل درجات وسعي المادة الفعلي إلى Excel الفاخر
  const handleExportCourseExcel = async () => {
    if (!course || grades.length === 0) return;
    setIsExportingExcel(true);
    try {
      const formattedGrades = grades.map((g) => {
        const cw = calculateCourseworkTotal(g, assessmentScheme);
        const finTot = calculateFinalTotal(g, isSupplementaryEnabled, assessmentScheme);
        return {
          student_name: g.student_name,
          university_number: g.university_number,
          course_name: course.name,
          quiz1: g.quiz1 || 0,
          quiz2: g.quiz2 || 0,
          assignment1: g.assignment1 || 0,
          assignment2: g.assignment2 || 0,
          report: g.report || 0,
          midterm: g.midterm || 0,
          practical: g.practical || 0,
          final_coursework_total: cw,
          final_exam: g.final_exam || 0,
          supplementary_exam: g.supplementary_exam,
          final_total: isFinalExamEnabled ? finTot : cw,
          letter_grade: isFinalExamEnabled ? getLetterGrade(finTot) : 'بانتظار الفاينل',
          is_locked: g.is_locked || false,
        };
      });

      await exportCustomGradesList(
        formattedGrades,
        course.department_name || 'القسم الأكاديمي',
        course.name,
        assessmentScheme // 🎛️ تمرير المخطط لإخفاء البنود المعطلة تلقائياً في الإكسل
      );
      setSuccessMessage('✅ تم بنجاح تصدير سجل درجات وسعي المادة إلى Excel!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch {
      setErrorMessage('⚠️ حدث خطأ أثناء تصدير ملف الإكسل!');
      setTimeout(() => setErrorMessage(''), 3500);
    } finally {
      setIsExportingExcel(false);
    }
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
      
        {/* 🏛️ 1. هيدر المادة والبيانات الديموغرافية ومواعيد المحاضرات */}
        <CourseHeader
          course={course}
          academicYear={academicYear}
          courseLectures={courseLectures}
          isPracticalCourse={isPracticalCourse}
          isAdmin={isAdmin}
          isTheoryTeacher={isTheoryTeacher}
          isPracticalTeacher={isPracticalTeacher}
          totalCourseStudents={totalCourseStudents}
          courseMorning={courseMorning}
          morningPercentage={morningPercentage}
          courseEvening={courseEvening}
          eveningPercentage={eveningPercentage}
          courseMales={courseMales}
          malePercentage={malePercentage}
          courseFemales={courseFemales}
          femalePercentage={femalePercentage}
        />

        {/* 🎛️ 2. شريط التبويبات الأربعة لمادة الأستاذ بتصميم ملكي */}
        <CourseTabsBar
          activeCourseTab={activeCourseTab}
          onTabChange={setActiveCourseTab}
          gradesCount={grades.length}
          auditLogsCount={auditLogs.filter((a) => a.course_id === course?.id || a.course_name === course?.name).length}
        />

        {/* 📋 3. تبويب سجل حضور وغياب الطلاب */}
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
            departmentHeadName={departmentHeadName}
            rapporteurName={rapporteurName}
          />
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

        {/* 📜 5. تبويب سجل التدقيق والحركات الأكاديمية والأمان */}
        {activeCourseTab === 'audit' && (
          <CourseAuditTab
            auditLogs={auditLogs}
            courseId={course?.id || ''}
            courseName={course?.name || ''}
          />
        )}

        {/* 📊 6. تبويب رصد وتقييم الدرجات وجداول Excel */}
        {activeCourseTab === 'grades' && (
          <CourseGradesTab
            course={course}
            grades={grades}
            filteredGrades={filteredGrades}
            courseStudents={courseStudents}
            assessmentScheme={assessmentScheme}
            gradeLimits={gradeLimits}
            filterStudyType={filterStudyType}
            setFilterStudyType={setFilterStudyType}
            courseMorning={courseMorning}
            courseEvening={courseEvening}
            pendingDiffs={pendingDiffs}
            isSavingPendingGrades={isSavingPendingGrades}
            isTheoryTeacher={isTheoryTeacher}
            isPracticalTeacher={isPracticalTeacher}
            isPracticalCourse={isPracticalCourse}
            isFinalExamEnabled={isFinalExamEnabled}
            isSupplementaryEnabled={isSupplementaryEnabled}
            isExportingExcel={isExportingExcel}
            isExportingPDF={isExportingPDF}
            isImportingExcel={isImportingExcel}
            selectedGradeStudentIds={selectedGradeStudentIds}
            setSelectedGradeStudentIds={setSelectedGradeStudentIds}
            toggleSelectAllGrades={toggleSelectAllGrades}
            toggleSelectGradeStudent={toggleSelectGradeStudent}
            handleCellChange={handleCellChange}
            handleSaveAllPendingGrades={handleSaveAllPendingGrades}
            handleCancelAllPendingGrades={handleCancelAllPendingGrades}
            handleDownloadTemplate={handleDownloadTemplate}
            handleExcelUpload={handleExcelUpload}
            handleExportCourseExcel={handleExportCourseExcel}
            handleExportCoursePDF={handleExportCoursePDF}
            setIsPendingDiffModalOpen={setIsPendingDiffModalOpen}
            setIsBulkGradeModalOpen={setIsBulkGradeModalOpen}
            setBulkGradeValue={setBulkGradeValue}
            setIsGradeNoticeModalOpen={setIsGradeNoticeModalOpen}
            setGradeNoticeTargetStudent={setGradeNoticeTargetStudent}
            setGradeNoticeDefaultCategory={setGradeNoticeDefaultCategory}
            setShowExcelInstructions={setShowExcelInstructions}
          />
        )}

        {/* 📢 7. نافذة التبليغات والتنبيهات الذكية للحضور والغيابات والامتحانات */}
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

        {/* ℹ️ 8. نافذة تعليمات وضوابط رصد واستيراد درجات مادة الأستاذ */}
        <CourseGradeInstructionsModal
          isOpen={showExcelInstructions}
          onClose={() => setShowExcelInstructions(false)}
          courseName={course?.name || ''}
          assessmentScheme={assessmentScheme}
          isPracticalCourse={isPracticalCourse}
          onDownloadTemplate={handleDownloadTemplate}
        />

        {/* 📊 9. نافذة معاينة وتأكيد استيراد ملف Excel لدرجات المادة */}
        <CourseGradeExcelPreviewModal
          rows={excelPreviewRows}
          onClose={() => setExcelPreviewRows(null)}
          courseName={course?.name || ''}
          isTheoryTeacher={isTheoryTeacher}
          isPracticalTeacher={isPracticalTeacher}
          isPracticalCourse={isPracticalCourse}
          isFinalExamEnabled={isFinalExamEnabled}
          isSupplementaryEnabled={isSupplementaryEnabled}
          assessmentScheme={assessmentScheme}
          onConfirmImport={confirmExcelImport}
        />

        {/* 📋 10. نافذة تعليمات وضوابط الحضور والغياب الأسبوعي */}
        <CourseAttendanceInstructionsModal
          isOpen={showAttendanceInstructions}
          onClose={() => setShowAttendanceInstructions(false)}
          onDownloadTemplate={handleDownloadAttendanceTemplate}
        />

        {/* 📋 11. نافذة معاينة وتأكيد استيراد ملف Excel للحضور والغياب */}
        <CourseAttendanceExcelPreviewModal
          rows={attendanceExcelPreviewRows}
          onClose={() => setAttendanceExcelPreviewRows(null)}
          courseName={course?.name || ''}
          onConfirmImport={confirmAttendanceExcelImport}
        />

        {/* 📝 12. نافذة تعليمات وضوابط التكليفات والامتحانات الفصلية */}
        <CourseAssessmentInstructionsModal
          isOpen={showAssessmentInstructions}
          onClose={() => setShowAssessmentInstructions(false)}
          courseName={course?.name || ''}
          assessmentScheme={assessmentScheme}
        />

        {/* 🛡️ 13. نافذة معايير الأمان والتدقيق الأكاديمي */}
        <CourseAuditInstructionsModal
          isOpen={showAuditInstructions}
          onClose={() => setShowAuditInstructions(false)}
        />

        {/* 🎯 14. نافذة رصد درجة موحدة للطلاب المحددين */}
        <CourseBulkGradeModal
          isOpen={isBulkGradeModalOpen}
          onClose={() => setIsBulkGradeModalOpen(false)}
          selectedGradeStudentIds={selectedGradeStudentIds}
          isTheoryTeacher={isTheoryTeacher}
          isPracticalTeacher={isPracticalTeacher}
          isPracticalCourse={isPracticalCourse}
          isFinalExamEnabled={isFinalExamEnabled}
          isSupplementaryEnabled={isSupplementaryEnabled}
          assessmentScheme={assessmentScheme}
          gradeLimits={gradeLimits}
          bulkSelectedField={bulkSelectedField}
          setBulkSelectedField={setBulkSelectedField}
          isBulkFieldDropdownOpen={isBulkFieldDropdownOpen}
          setIsBulkFieldDropdownOpen={setIsBulkFieldDropdownOpen}
          bulkGradeValue={bulkGradeValue}
          setBulkGradeValue={setBulkGradeValue}
          onApplyBulkGrade={handleApplyBulkGrade}
        />

        {/* ⚖️ 15. نافذة مراجعة ومقارنة الفروقات بين الدرجة السابقة والدرجة الحديثة */}
        <CoursePendingDiffModal
          isOpen={isPendingDiffModalOpen}
          onClose={() => setIsPendingDiffModalOpen(false)}
          courseName={course?.name || ''}
          pendingDiffs={pendingDiffs}
          onRevertSingleDiff={handleRevertSingleDiff}
          onSaveAllPendingGrades={handleSaveAllPendingGrades}
          isSavingPendingGrades={isSavingPendingGrades}
        />

      </div>
    </ZeroTrustGuard>
  );
}
