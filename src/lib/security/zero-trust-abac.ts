// 🛡️ منظومة التفويض الميكروي والتحكم بالوصول القائم على السمات (Zero Trust ABAC & Micro-Scope Engine)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { UserProfile, Course, TeacherCourse, Grade, CourseAcademicTask } from '@/types'; // 🔗 الأنواع الصريحة

// 🔍 1. التحقق من بصمة الجهاز والمتصفح لمنع سرقة الجلسة (Device Fingerprint)
export function getClientDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server-env';
  try {
    const nav = window.navigator;
    const screen = window.screen;
    const raw = `${nav.userAgent}_${nav.language}_${screen.width}x${screen.height}_${screen.colorDepth}_${nav.hardwareConcurrency || 1}`;
    
    // 🔏 توليد بصمة عتادية
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  } catch {
    return 'fp_generic';
  }
}

// 🏢 2. التحقق من عزل القسم العلمي (Department-Scope Isolation)
export function validateDepartmentScope(
  user: UserProfile | null,
  targetDepartmentId: string
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'لا توجد جلسة مستخدم نشطة' };
  }

  // المسؤول العام (Super Admin) يمتلك صلاحية الإشراف على كافة الأقسام الـ 12
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // رئيس ومقرر القسم مقيدان حصراً بقسمهما العلمي
  if (user.role === 'department_head' || user.role === 'rapporteur') {
    if (user.department_id && user.department_id === targetDepartmentId) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: `عذراً! صلاحياتك مقيدة بقسمك العلمي (${user.department_name || user.department_id}) فقط ولا يمكنك الوصول لبيانات هذا القسم.` 
    };
  }

  // الأستاذ والطالب
  if (user.department_id === targetDepartmentId) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'الوصول غير مصرح به لهذا القسم العلمي' };
}

// 📘 3. التحقق من تكليف المادة للتدريسي (Course-Scope Teacher Assignment) بنموذج مرن متعدد الأبعاد
export function validateCourseTeacherScope(
  user: UserProfile | null, // 👤 كائن المستخدم الحالي المسجل بالجلسة
  courseId: string, // 📘 معرف المادة الدراسية المطلوبة
  courses: Course[], // 📚 قائمة المواد المعتمدة
  teacherCourses: TeacherCourse[] // 📋 قائمة تكليفات الأساتذة
): { allowed: boolean; isTheory: boolean; isPractical: boolean; reason?: string } {
  // 🔒 التحقق من وجود جلسة صالحة
  if (!user) {
    return { allowed: false, isTheory: false, isPractical: false, reason: 'لا توجد جلسة نشطة' };
  }

  // 👑 المسؤول العام ورئاسة القسم التابع للمادة لديهم صلاحية الإشراف الكاملة
  if (user.role === 'super_admin') {
    return { allowed: true, isTheory: true, isPractical: true };
  }

  // 🔍 البحث عن المادة بالمعرف أو الرمز أو الاسم
  const course = courses.find((c) => c.id === courseId || c.code === courseId || c.name === courseId);
  
  // 🏢 فحص صلاحيات رئيس ومقرر القسم
  if (user.role === 'department_head' || user.role === 'rapporteur') {
    if (course && user.department_id === course.department_id) {
      return { allowed: true, isTheory: true, isPractical: true };
    }
    return { allowed: false, isTheory: false, isPractical: false, reason: 'المادة لا تتبع لقسمك العلمي' };
  }

  // 👨‍🏫 التدريسي: التحقق المرن متعدد الأبعاد من تكليفه الرسمي بالنظري أو العملي
  if (user.role === 'teacher') {
    // 🔤 دالة تطبيع الأسماء العربية لإزالة الفروقات الإملائية
    const normArabic = (s?: string) => {
      if (!s) return '';
      return s.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ئ/g, 'ي').replace(/ؤ/g, 'و').replace(/[^\p{L}\p{N}]/gu, '');
    };

    const userNormName = normArabic(user.full_name); // 🔤 اسم الأستاذ المعياري

    // 🔍 1. مطابقة التكليف المباشر في كائن المادة إن وجد
    const isTheoryTeacher = Boolean(
      course && (
        (course.theory_teacher_id && user.id && String(course.theory_teacher_id).trim() === String(user.id).trim()) ||
        (course.theory_teacher_name && userNormName && normArabic(course.theory_teacher_name) === userNormName)
      )
    );

    const isPracticalTeacher = Boolean(
      course && (
        (course.practical_teacher_id && user.id && String(course.practical_teacher_id).trim() === String(user.id).trim()) ||
        (course.practical_teacher_name && userNormName && normArabic(course.practical_teacher_name) === userNormName)
      )
    );

    // 🔍 2. مطابقة سجل التكليفات teacherCourses متعدد الأبعاد
    const hasAssignedRecord = teacherCourses.some((tc) => {
      const matchCourse = tc.course_id === courseId || tc.id === courseId || (course && (tc.course_id === course.id || tc.course_name === course.name));
      if (!matchCourse) return false;

      const matchId = Boolean(tc.teacher_id && user.id && String(tc.teacher_id).trim() === String(user.id).trim());
      const matchUniNum = Boolean(tc.teacher_id && user.university_number && String(tc.teacher_id).trim() === String(user.university_number).trim());
      const matchAuthId = Boolean(tc.teacher_id && user.auth_user_id && String(tc.teacher_id).trim() === String(user.auth_user_id).trim());
      const matchEmail = Boolean(tc.teacher_id && user.generated_email && String(tc.teacher_id).trim().toLowerCase() === user.generated_email.trim().toLowerCase());
      const matchName = Boolean(tc.teacher_name && userNormName && normArabic(tc.teacher_name) === userNormName);

      return matchId || matchUniNum || matchAuthId || matchEmail || matchName;
    });

    // ✅ السماح بالوصول إذا تحقق أي من معايير التكليف المعتمدة
    if (isTheoryTeacher || isPracticalTeacher || hasAssignedRecord) {
      return { 
        allowed: true, 
        isTheory: isTheoryTeacher || hasAssignedRecord, 
        isPractical: isPracticalTeacher || hasAssignedRecord 
      };
    }

    return { 
      allowed: false, 
      isTheory: false, 
      isPractical: false, 
      reason: 'أنت لست الأستاذ المكلف بتدريس هذه المادة (نظرياً أو عملياً).' 
    };
  }

  return { allowed: false, isTheory: false, isPractical: false, reason: 'ليس لديك صلاحية تدريس هذه المادة' };
}

// 💯 4. التحقق من صلاحية تعديل درجات السعي ومسار بولونيا (Grade Mutation Guard)
export function validateGradeEditPermission(
  user: UserProfile | null,
  grade: Grade,
  course?: Course
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'لا توجد جلسة مستخدم نشطة' };
  }

  // منع التعديل التام إذا كان السعي مقفلاً ومعتمداً
  if (grade.is_locked) {
    return { 
      allowed: false, 
      reason: 'درجات السعي لهذه المادة معتمدة ومقفلة رسمياً من قبل رئاسة القسم، ويُمنع إجراء أي تعديل وفق ضوابط Zero Trust.' 
    };
  }

  // المسؤول العام
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // رئيس ومقرر القسم
  if (user.role === 'department_head' || user.role === 'rapporteur') {
    if (user.department_id === grade.department_id) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'لا يحق لك تعديل درجات قسم آخر' };
  }

  // التدريسي المكلف
  if (user.role === 'teacher') {
    if (grade.teacher_id === user.id || course?.theory_teacher_id === user.id || course?.practical_teacher_id === user.id) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'لست الأستاذ المكلف برصد درجات هذا الطالب' };
  }

  return { allowed: false, reason: 'غير مصرح لك بتعديل سجلات الدرجات' };
}

// 🎓 5. التحقق من صلاحية تسليم الطالب للتكليف الأكاديمي (Student Task Submission Guard)
export function validateStudentTaskSubmission(
  user: UserProfile | null,
  task: CourseAcademicTask
): { allowed: boolean; reason?: string } {
  if (!user || user.role !== 'student') {
    return { allowed: false, reason: 'التسليم مخصص لحسابات الطلاب فقط' };
  }

  // مطابقة القسم والمرحلة
  if (task.department_id && user.department_id && task.department_id !== user.department_id) {
    return { allowed: false, reason: 'هذا التكليف يتبع قسماً علمياً آخر' };
  }

  if (task.stage_number && user.stage_number && task.stage_number !== user.stage_number) {
    return { allowed: false, reason: 'هذا التكليف غير موجه لمرحلتك الدراسية' };
  }

  // التحقق من حالة فتح الرفع من قبل الأستاذ
  if (task.is_submission_open === false) {
    return { allowed: false, reason: 'تم إغلاق واستلام التكليفات من قبل أستاذ المادة وتاريخ الاستحقاق انتهى.' };
  }

  return { allowed: true };
}
