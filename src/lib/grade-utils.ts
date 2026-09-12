// 🧮 أدوات ودوال حساب الدرجات والتحقق الأمني - جامعة الإمام جعفر الصادق (ع) فرع ميسان

import { Grade, Course, CourseType, AssessmentScheme } from '@/types'; // 🔗 نستورد واجهة بيانات الدرجة والمادة

// 🛑 المخطط القياسي الافتراضي لمسار بولونيا للمواد ذات الجانب العملي (نظري + عملي)
export const DEFAULT_THEORY_PRACTICAL_SCHEME: AssessmentScheme = {
  quiz1: { title_ar: 'كويز (1)', title_en: 'Quiz 1', max_score: 5, type: 'theory', is_enabled: true },
  quiz2: { title_ar: 'كويز (2)', title_en: 'Quiz 2', max_score: 5, type: 'theory', is_enabled: true },
  assignment1: { title_ar: 'واجب (1)', title_en: 'Assignment 1', max_score: 5, type: 'theory', is_enabled: true },
  assignment2: { title_ar: 'واجب (2)', title_en: 'Assignment 2', max_score: 5, type: 'theory', is_enabled: true },
  report: { title_ar: 'تقرير ونشاط', title_en: 'Report & Activity', max_score: 10, type: 'theory', is_enabled: true },
  midterm: { title_ar: 'امتحان نصفي', title_en: 'Midterm Exam', max_score: 10, type: 'theory', is_enabled: true },
  practical: { title_ar: 'مختبر وعملي', title_en: 'Practical / Lab', max_score: 10, type: 'practical', is_enabled: true },
  final_exam: { title_ar: 'امتحان نهائي', title_en: 'Final Exam', max_score: 50, type: 'theory', is_enabled: true },
};

// 🛑 المخطط الافتراضي للمواد النظرية فقط (بدون مختبر)
export const DEFAULT_THEORY_ONLY_SCHEME: AssessmentScheme = {
  quiz1: { title_ar: 'كويز (1)', title_en: 'Quiz 1', max_score: 5, type: 'theory', is_enabled: true },
  quiz2: { title_ar: 'كويز (2)', title_en: 'Quiz 2', max_score: 5, type: 'theory', is_enabled: true },
  assignment1: { title_ar: 'واجب (1)', title_en: 'Assignment 1', max_score: 5, type: 'theory', is_enabled: true },
  assignment2: { title_ar: 'واجب (2)', title_en: 'Assignment 2', max_score: 5, type: 'theory', is_enabled: true },
  report: { title_ar: 'تقرير وبحث', title_en: 'Report & Research', max_score: 15, type: 'theory', is_enabled: true },
  midterm: { title_ar: 'امتحان نصفي', title_en: 'Midterm Exam', max_score: 15, type: 'theory', is_enabled: true },
  practical: { title_ar: 'غير مخصص', title_en: 'N/A', max_score: 0, type: 'practical', is_enabled: false },
  final_exam: { title_ar: 'امتحان نهائي', title_en: 'Final Exam', max_score: 50, type: 'theory', is_enabled: true },
};

// 🛑 حدود الدرجات العظمى لكل بند وفق نظام بولونيا المحدد بالمواصفات (الافتراضية)
export const GRADE_LIMITS: Record<string, number> = {
  quiz1: 5,        // 📝 حد الكويز الأول 5
  quiz2: 5,        // 📝 حد الكويز الثاني 5
  assignment1: 5,  // 📑 حد الواجب الأول 5
  assignment2: 5,  // 📑 حد الواجب الثاني 5
  report: 10,      // 📖 حد التقرير 10
  midterm: 10,     // 🎯 حد امتحان نصف الفصل 10
  practical: 10,   // 🧪 حد الامتحان العملي 10
  final_exam: 50,  // 📝 حد الامتحان النهائي 50
  supplementary_exam: 50, // 🔄 حد امتحان الدور الثاني 50
};

// 🔍 فحص هل بند التقييم مفتوح ونشط ومتاح للرصد والعرض
export function isAssessmentItemActive(item?: AssessmentScheme[keyof AssessmentScheme] | null): boolean {
  if (!item) return false; // 🛡️ إذا البند غير موجود نعتبره غير نشط
  if (item.is_enabled === false) return false; // 🚫 إذا مغلق رسمياً
  return (item.max_score || 0) > 0; // ✅ لازم تكون درجته العظمى أكبر من صفر
}

// 🎛️ دالة استرجاع المخطط التقييمي الافتراضي حسب نوع المادة
export function getDefaultAssessmentScheme(courseType?: CourseType): AssessmentScheme {
  if (courseType === 'theory_only') {
    return { ...DEFAULT_THEORY_ONLY_SCHEME };
  }
  return { ...DEFAULT_THEORY_PRACTICAL_SCHEME };
}

// 🎛️ دالة استرجاع المخطط التقييمي المعتمد للمادة (المخصص أو الافتراضي)
export function getCourseAssessmentScheme(course?: Course | null): AssessmentScheme {
  if (!course) return { ...DEFAULT_THEORY_PRACTICAL_SCHEME }; // 🛡️ حماية: إرجاع المخطط الافتراضي عند عدم تمرير مادة
  if (course.assessment_scheme) return course.assessment_scheme; // 📋 إرجاع المخطط المخصص إذا كان محفوظاً للمادة
  const isPractical = course.course_type === 'theory_and_practical' || Boolean(course.has_practical); // 🔬 فحص هل المادة تحتوي شق عملي؟
  return getDefaultAssessmentScheme(isPractical ? 'theory_and_practical' : 'theory_only'); // 🎯 إرجاع مخطط النظري فقط إذا كانت المادة نظرية
}

// 🧮 دالة استخراج الحدود العظمى الحقيقية لبنود المادة
export function getCourseGradeLimits(course?: Course | null): Record<string, number> {
  const scheme = getCourseAssessmentScheme(course);
  return {
    quiz1: scheme.quiz1.max_score,
    quiz2: scheme.quiz2.max_score,
    assignment1: scheme.assignment1.max_score,
    assignment2: scheme.assignment2.max_score,
    report: scheme.report.max_score,
    midterm: scheme.midterm.max_score,
    practical: scheme.practical.max_score,
    final_exam: scheme.final_exam.max_score,
    supplementary_exam: scheme.final_exam.max_score,
  };
}

// 🎓 دالة تحويل رقم المرحلة إلى اسمها العربي المكتوب (الأولى، الثانية، الثالثة، الرابعة)
export function getStageNameInArabic(stageNum: number | string): string {
  const num = Number(stageNum);
  if (num === 1) return 'الأولى';
  if (num === 2) return 'الثانية';
  if (num === 3) return 'الثالثة';
  if (num === 4) return 'الرابعة';
  return String(stageNum);
}

// 🧮 دالة تسوي حساب مجموع السعي النهائي تلقائيًا مع مراعاة البنود المفتوحة فقط
export function calculateCourseworkTotal(grade: Partial<Grade>, scheme?: AssessmentScheme | null): number {
  // 🔍 دالة داخلية للتحقق هل البند مفتوح بالمخطط
  const isItemOpen = (key: keyof AssessmentScheme): boolean => {
    if (!scheme) return true; // إذا لم يمرر مخطط نعتمد كافة البنود للتوافق
    return isAssessmentItemActive(scheme[key]); // فحص هل البند مفتوح
  };

  // ➕ نجمع البنود السبعة بأسلوب مضمون وآمن للبند المفتوح فقط
  const q1 = isItemOpen('quiz1') ? (Number(grade.quiz1) || 0) : 0; // 📝 الكويز 1
  const q2 = isItemOpen('quiz2') ? (Number(grade.quiz2) || 0) : 0; // 📝 الكويز 2
  const a1 = isItemOpen('assignment1') ? (Number(grade.assignment1) || 0) : 0; // 📑 الواجب 1
  const a2 = isItemOpen('assignment2') ? (Number(grade.assignment2) || 0) : 0; // 📑 الواجب 2
  const rep = isItemOpen('report') ? (Number(grade.report) || 0) : 0; // 📖 التقرير
  const mid = isItemOpen('midterm') ? (Number(grade.midterm) || 0) : 0; // 🎯 نصف الفصل
  const prac = isItemOpen('practical') ? (Number(grade.practical) || 0) : 0; // 🧪 العملي

  // 🧮 نرجع المجموع الكلي للسعي
  const total = q1 + q2 + a1 + a2 + rep + mid + prac;
  
  // 🔒 نتأكد المجموع ما يتعدى 50 إطلاقاً
  return Math.min(50, Math.max(0, total));
}

// 🟢 فحص هل الطالب ناجح في الدور الأول (السعي + الامتحان النهائي >= 50)
export function isStudentPassedFirstRound(grade: Partial<Grade>, scheme?: AssessmentScheme | null): boolean {
  const coursework = calculateCourseworkTotal(grade, scheme);
  const finalExam = Number(grade.final_exam) || 0;
  const firstRoundTotal = coursework + finalExam;
  return firstRoundTotal >= 50 && finalExam > 0;
}

// 🔄 فحص هل الطالب مؤهل لأداء الدور الثاني (راسب أو مؤجل في الدور الأول)
export function isStudentEligibleForSupplementary(grade: Partial<Grade>, scheme?: AssessmentScheme | null): boolean {
  return !isStudentPassedFirstRound(grade, scheme);
}

// 💯 دالة حساب المجموع النهائي الكلي من 100 لمسار بولونيا:
// 1. إذا كان الدور الثاني غير مفعل: يُعتمد الدور الأول فقط (coursework + final_exam).
// 2. إذا كان الدور الثاني مفعل:
//    - الطالب الناجح في الدور الأول: يحتفظ بنتيجة الدور الأول الأصلية.
//    - الطالب الراسب في الدور الأول فقط: يُعتمد له امتحان الدور الثاني إذا كان مسجلاً (coursework + supplementary_exam).
export function calculateFinalTotal(grade: Partial<Grade>, isSupplementaryActive: boolean = false, scheme?: AssessmentScheme | null): number {
  const coursework = calculateCourseworkTotal(grade, scheme); // 🧮 حساب السعي للبند المفتوح
  const finalExam = Number(grade.final_exam) || 0;
  const firstRoundTotal = coursework + finalExam;

  // 1. في حال كان الدور الثاني غير مفعل للمادة -> اعتماد الدور الأول فقط
  if (!isSupplementaryActive) {
    return Math.min(100, Math.max(0, firstRoundTotal));
  }

  // 2. في حال كان الدور الثاني مفعل:
  // فحص هل الطالب ناجح في الدور الأول أصلاً
  if (isStudentPassedFirstRound(grade, scheme)) {
    // الطالب الناجح في الدور الأول يحتفظ بدرجته بالدور الأول ولا يتأثر
    return Math.min(100, Math.max(0, firstRoundTotal));
  }

  // 3. الطالب الراسب في الدور الأول فقط:
  const suppVal = grade.supplementary_exam;
  const hasSupplementary = 
    suppVal !== undefined && 
    suppVal !== null && 
    !isNaN(Number(suppVal)) && 
    Number(suppVal) > 0;

  if (hasSupplementary) {
    const suppTotal = coursework + Number(suppVal);
    return Math.min(100, Math.max(0, suppTotal));
  }

  // إذا لم يؤدِ الدور الثاني بعد، يبقى على مجموع الدور الأول
  return Math.min(100, Math.max(0, firstRoundTotal));
}

// 🅰️ دالة تحول المجموع من 100 إلى التقدير الحرفي المسار الأكاديمي لبولونيا
export function getLetterGrade(totalScore: number): string {
  // 📊 نتحقق من نطاق الدرجة ونرجع التقدير المقابل بالعربي
  if (totalScore >= 90) return 'A - امتياز'; // 🌟 90 فأكثر
  if (totalScore >= 80) return 'B - جيد جدًا'; // 🥇 80 إلى 89
  if (totalScore >= 70) return 'C - جيد';      // 🥈 70 إلى 79
  if (totalScore >= 60) return 'D - متوسط';   // 🥉 60 إلى 69
  if (totalScore >= 50) return 'E - مقبول';   // 👍 50 إلى 59
  return 'F - راسب';                            // ❌ أقل من 50
}

// 🎓 دالة تحسب المعدل التراكمي الفصلي (GPA) للطالب بناءً على ساعات المواد المعتمدة والمخطط الفعلي
export function calculateStudentGPA(
  studentGrades: { grade: Grade; creditHours: number; scheme?: AssessmentScheme | null; isSupplementaryActive?: boolean }[] // 📚 قائمة درجات الطالب مع ساعات كل مادة ومخططها
): number {
  // ⚠️ إذا ماكو درجات نرجع صفر
  if (!studentGrades || studentGrades.length === 0) return 0;

  // 🧮 المتغيرات لتجميع النقاط ومجموع الساعات
  let totalPoints = 0; // 🎯 النقاط المضروبة بالساعات
  let totalCredits = 0; // ⏳ إجمالي الساعات المعتمدة

  // 🔄 نمر على كل درجة مادة ونحسب وزنها
  for (const item of studentGrades) {
    const finalScore = calculateFinalTotal(item.grade, item.isSupplementaryActive ?? false, item.scheme); // 💯 المجموع النهائي للمادة للبند المفتوح بالمخطط
    const credits = item.creditHours || 3; // ⏳ ساعات المادة

    totalPoints += finalScore * credits; // ➕ إضافة النقاط (الدرجة × الساعات)
    totalCredits += credits;             // ➕ إضافة الساعات
  }

  // ⚖️ إذا مجموع الساعات صفر نرجع صفر لتفادي القسمة على صفر
  if (totalCredits === 0) return 0;

  // 🧮 نرجع المعدل التراكمي مقرب لمرتبتين عشريتين
  return Number((totalPoints / totalCredits).toFixed(2));
}

// 🛡️ دالة الحماية المتقدمة ضد ثغرات Excel Formula Injection (حقن الصيغ)
export function sanitizeExcelField(value: string | number | boolean | null | undefined): string {
  // ⚠️ إذا كانت القيمة فارغة أو نل
  if (value === null || value === undefined) return '';
  
  // 📝 نحول القيمة لنص صريح ونزيل الفراغات الزائدة
  const strValue = String(value).trim();

  // 🛑 نتحقق إذا النص يبدأ بأحد رموز تنفيذ الصيغ بالـ Excel مثل = + - @
  if (/^[=+@\t\r]/.test(strValue)) {
    // 🔒 نضيف علامة اقتباس أحادية بالبداية حتى الـ Excel يعاملها كنص عادي صريح وما ينفذها
    return `'${strValue}`;
  }

  // 🟢 النتيجة آمنة نرجعها مباشرة
  return strValue;
}

// 🎛️ نوع مفاتيح بنود السعي الـ 7 القابلة للفتح والغلق
export type CourseworkSchemeKey = 'quiz1' | 'quiz2' | 'assignment1' | 'assignment2' | 'report' | 'midterm' | 'practical';

// 🔄 دالة إعادة توزيع ونقل درجات البند المغلق إلى البنود المفتوحة تلقائياً واحترافياً
export function redistributeAssessmentScoresOnToggle(
  currentScheme: AssessmentScheme,
  toggledKey: CourseworkSchemeKey,
  newEnabledState: boolean
): AssessmentScheme {
  // 📋 نسخ عميق وآمن للمخطط الحالي بدون any
  const nextScheme: AssessmentScheme = {
    quiz1: { ...currentScheme.quiz1 },
    quiz2: { ...currentScheme.quiz2 },
    assignment1: { ...currentScheme.assignment1 },
    assignment2: { ...currentScheme.assignment2 },
    report: { ...currentScheme.report },
    midterm: { ...currentScheme.midterm },
    practical: { ...currentScheme.practical },
    final_exam: { ...currentScheme.final_exam },
  };

  const targetItem = nextScheme[toggledKey];
  const oldScore = targetItem.max_score || 0;

  // 1️⃣ حالة الإغلاق (newEnabledState === false)
  if (!newEnabledState) {
    targetItem.is_enabled = false;
    targetItem.max_score = 0;

    // إذا ماكو درجة لنقلها نكتفي بالإغلاق
    if (oldScore <= 0) return nextScheme;

    // 🎯 أولوية النقل التلقائي الذكي:
    if (toggledKey === 'quiz2' && nextScheme.quiz1.is_enabled !== false) {
      // نقل درجة كويز 2 إلى كويز 1
      nextScheme.quiz1.max_score += oldScore;
    } else if (toggledKey === 'quiz1' && nextScheme.quiz2.is_enabled !== false) {
      // نقل درجة كويز 1 إلى كويز 2
      nextScheme.quiz2.max_score += oldScore;
    } else if (toggledKey === 'assignment2' && nextScheme.assignment1.is_enabled !== false) {
      // نقل درجة واجب 2 إلى واجب 1
      nextScheme.assignment1.max_score += oldScore;
    } else if (toggledKey === 'assignment1' && nextScheme.assignment2.is_enabled !== false) {
      // نقل درجة واجب 1 إلى واجب 2
      nextScheme.assignment2.max_score += oldScore;
    } else if (toggledKey === 'practical') {
      // نقل العملي (10): مناصفة بين النصفي والتقرير وفق قالب بولونيا النظري
      const half1 = Math.floor(oldScore / 2);
      const half2 = oldScore - half1;
      if (nextScheme.midterm.is_enabled !== false && nextScheme.report.is_enabled !== false) {
        nextScheme.midterm.max_score += half1;
        nextScheme.report.max_score += half2;
      } else if (nextScheme.midterm.is_enabled !== false) {
        nextScheme.midterm.max_score += oldScore;
      } else if (nextScheme.report.is_enabled !== false) {
        nextScheme.report.max_score += oldScore;
      } else {
        // توزيع على أول بند مفتوح
        const openKeys: CourseworkSchemeKey[] = (['quiz1', 'quiz2', 'assignment1', 'assignment2', 'report', 'midterm'] as const).filter(
          (k) => nextScheme[k].is_enabled !== false
        );
        if (openKeys.length > 0) {
          nextScheme[openKeys[0]].max_score += oldScore;
        }
      }
    } else {
      // أي بند آخر يُنقل للنصفي إذا كان مفتوحاً أو لأي بند مفتوح
      if (nextScheme.midterm.is_enabled !== false && toggledKey !== 'midterm') {
        nextScheme.midterm.max_score += oldScore;
      } else if (nextScheme.report.is_enabled !== false && toggledKey !== 'report') {
        nextScheme.report.max_score += oldScore;
      } else {
        const openKeys: CourseworkSchemeKey[] = (['quiz1', 'quiz2', 'assignment1', 'assignment2', 'report', 'midterm'] as const).filter(
          (k) => k !== toggledKey && nextScheme[k].is_enabled !== false
        );
        if (openKeys.length > 0) {
          nextScheme[openKeys[0]].max_score += oldScore;
        }
      }
    }
  } else {
    // 2️⃣ حالة الفتح (newEnabledState === true)
    targetItem.is_enabled = true;
    // تحديد الدرجة الافتراضية المقترحة للبند عند فتحه
    const defaultReopenScore = toggledKey === 'practical' ? 10 : (toggledKey === 'midterm' || toggledKey === 'report') ? 10 : 5;

    // استرداد الدرجة من البند النظير إذا كان محتوياً على درجات إضافية
    if (toggledKey === 'quiz2' && nextScheme.quiz1.max_score >= 10) {
      nextScheme.quiz1.max_score -= defaultReopenScore;
      targetItem.max_score = defaultReopenScore;
    } else if (toggledKey === 'quiz1' && nextScheme.quiz2.max_score >= 10) {
      nextScheme.quiz2.max_score -= defaultReopenScore;
      targetItem.max_score = defaultReopenScore;
    } else if (toggledKey === 'assignment2' && nextScheme.assignment1.max_score >= 10) {
      nextScheme.assignment1.max_score -= defaultReopenScore;
      targetItem.max_score = defaultReopenScore;
    } else if (toggledKey === 'assignment1' && nextScheme.assignment2.max_score >= 10) {
      nextScheme.assignment2.max_score -= defaultReopenScore;
      targetItem.max_score = defaultReopenScore;
    } else if (toggledKey === 'practical' && nextScheme.midterm.max_score >= 15 && nextScheme.report.max_score >= 15) {
      nextScheme.midterm.max_score -= 5;
      nextScheme.report.max_score -= 5;
      targetItem.max_score = 10;
    } else {
      // إبقاء درجته السابقة أو صفر ليحددها رئيس القسم يدوياً
      if (targetItem.max_score <= 0) {
        targetItem.max_score = defaultReopenScore;
        // نخصم من النصفي إذا كان كبيراً ليبقى المجموع 50
        if (nextScheme.midterm.is_enabled !== false && nextScheme.midterm.max_score > defaultReopenScore) {
          nextScheme.midterm.max_score -= defaultReopenScore;
        }
      }
    }
  }

  return nextScheme;
}

