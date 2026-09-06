// 📊 مكتبة حساب وتجميع إحصائيات الطلبة والتدريسيين الديموغرافية (الكلي، الذكور، الإناث، الأقسام، المراحل)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مخصصة للمسؤول العام ورؤساء الأقسام

import { 
  UserProfile, 
  Department, 
  CollegeStudentDemographics, 
  DepartmentStudentDemographics, 
  StageStudentDemographics,
  CollegeTeacherDemographics,
  DepartmentTeacherDemographics
} from '@/types'; // 🔗 استيراد واجهات الأنواع
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 دالة جلب اسم المرحلة بالعربي

//  قائمة الكلمات والمفاتيح الشائعة لأسماء الإناث العراقية للتعرف الذكي التلقائي
const FEMALE_NAME_KEYWORDS = [
  'فاطمة', 'زينب', 'زهراء', 'مريم', 'سارة', 'ساره', 'نور', 'هدى', 'ريام', 'آية', 'اية', 
  'رقية', 'رنا', 'زينب', 'تبارك', 'بنين', 'تقى', 'ضحى', 'إسراء', 'اسراء', 'دعاء', 'هاجر', 
  'مروة', 'ولاء', 'زهراء', 'أماني', 'اماني', 'شهد', 'ريم', 'نبأ', 'نبا', 'عبير', 'غدير',
  'سحر', 'أمل', 'امل', 'حنين', 'أبرار', 'ابرار', 'بشرى', 'سجى', 'كوثر', 'حوراء', 'يقين'
];

// 🧠 دالة ذكية لتحديد جنس الطالب أو الأستاذ إذا لم يكن مسجلاً صراحة بالملف
export function detectArabicGender(fullName: string): 'male' | 'female' {
  // 🔍 تنظيف الاسم وأخذ الكلمة الأولى (الاسم الأول للشخص)
  const firstName = fullName.trim().split(' ')[0]?.trim() || '';
  // 👩 إذا الاسم الأول ضمن قائمة أسماء الإناث يرجع أنثى
  if (FEMALE_NAME_KEYWORDS.some((femaleKey) => firstName.includes(femaleKey))) {
    return 'female';
  }
  // 👨 إذا ما تطابق مع الإناث يعتبر ذكر افتراضياً
  return 'male';
}

// 🧮 الدالة المركزية لحساب كافة إحصائيات الطلاب بدقة وسرعة فائقة (النوع والفترة والأقسام والمراحل)
export function calculateStudentDemographics(
  profiles: UserProfile[],
  departments: Department[]
): CollegeStudentDemographics {
  // 🎓 تصفية ملفات الطلاب فقط من بين كافة المستخدمين
  const students = profiles.filter((p) => p.role === 'student');
  // 🔢 إجمالي عدد الطلاب الكلي بالجامعة
  const total_students = students.length;

  // 👨 إجمالي عدد الطلاب الذكور بالجامعة
  const total_males = students.filter((s) => {
    // 🚻 فحص الجنس الصريح أو الاستنتاج الذكي من الاسم
    const gender = s.gender || detectArabicGender(s.full_name);
    return gender === 'male';
  }).length;

  // 👩 إجمالي عدد الطالبات الإناث بالجامعة
  const total_females = total_students - total_males;

  // ☀️ إجمالي عدد طلبة الدراسة الصباحية بالجامعة
  const total_morning = students.filter((s) => (s.study_type || 'morning') === 'morning').length;
  // 🌙 إجمالي عدد طلبة الدراسة المسائية بالجامعة
  const total_evening = total_students - total_morning;

  // 📊 النسبة المئوية للذكور والإناث
  const male_percentage = total_students > 0 ? Math.round((total_males / total_students) * 100) : 0;
  const female_percentage = total_students > 0 ? Math.round((total_females / total_students) * 100) : 0;

  // 📊 النسبة المئوية للصباحي والمسائي
  const morning_percentage = total_students > 0 ? Math.round((total_morning / total_students) * 100) : 0;
  const evening_percentage = total_students > 0 ? Math.round((total_evening / total_students) * 100) : 0;

  // 📚 تفصيل المراحل الأربعة على مستوى الجامعة كلها
  const stages_summary: Record<number, StageStudentDemographics> = {};
  for (let stg = 1; stg <= 4; stg++) {
    // 🔍 جلب طلاب المرحلة الحالية
    const stageStudents = students.filter((s) => (s.stage_number || 1) === stg);
    // 🔢 المجموع الكلي لطلاب المرحلة
    const stageTotal = stageStudents.length;
    // 👨 عدد ذكور المرحلة
    const stageMales = stageStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
    // 👩 عدد إناث المرحلة
    const stageFemales = stageTotal - stageMales;
    // ☀️ عدد طلبة الصباحي بالمرحلة
    const stageMorning = stageStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
    // 🌙 عدد طلبة المسائي بالمرحلة
    const stageEvening = stageTotal - stageMorning;

    // 💾 تعبئة كائن إحصائية المرحلة
    stages_summary[stg] = {
      stage_number: stg,
      stage_name: `المرحلة ${getStageNameInArabic(stg)}`,
      total_students: stageTotal,
      male_count: stageMales,
      female_count: stageFemales,
      morning_count: stageMorning,
      evening_count: stageEvening,
      male_percentage: stageTotal > 0 ? Math.round((stageMales / stageTotal) * 100) : 0,
      female_percentage: stageTotal > 0 ? Math.round((stageFemales / stageTotal) * 100) : 0,
      morning_percentage: stageTotal > 0 ? Math.round((stageMorning / stageTotal) * 100) : 0,
      evening_percentage: stageTotal > 0 ? Math.round((stageEvening / stageTotal) * 100) : 0,
    };
  }

  // 🏢 تفصيل إحصائيات كل قسم من الأقسام الـ 12
  const deptList: DepartmentStudentDemographics[] = departments.map((dept) => {
    // 🔍 تصفية طلاب هذا القسم فقط
    const deptStudents = students.filter((s) => s.department_id === dept.id || s.department_name === dept.name);
    // 🔢 مجموع طلاب القسم
    const deptTotal = deptStudents.length;
    // 👨 مجموع الذكور بالقسم
    const deptMales = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
    // 👩 مجموع الإناث بالقسم
    const deptFemales = deptTotal - deptMales;
    // ☀️ مجموع طلبة الصباحي بالقسم
    const deptMorning = deptStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
    // 🌙 مجموع طلبة المسائي بالقسم
    const deptEvening = deptTotal - deptMorning;

    // 📚 تفصيل المراحل الـ 4 داخل هذا القسم
    const stages: Record<number, StageStudentDemographics> = {};
    for (let stg = 1; stg <= 4; stg++) {
      // 🔍 طلاب المرحلة stg داخل القسم dept
      const stgStudents = deptStudents.filter((s) => (s.stage_number || 1) === stg);
      // 🔢 إجمالي المرحلة بالقسم
      const stgTotal = stgStudents.length;
      // 👨 ذكور المرحلة بالقسم
      const stgMales = stgStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
      // 👩 إناث المرحلة بالقسم
      const stgFemales = stgTotal - stgMales;
      // ☀️ صباحي المرحلة بالقسم
      const stgMorning = stgStudents.filter((s) => (s.study_type || 'morning') === 'morning').length;
      // 🌙 مسائي المرحلة بالقسم
      const stgEvening = stgTotal - stgMorning;

      // 💾 حفظ إحصائية مرحلة القسم
      stages[stg] = {
        stage_number: stg,
        stage_name: `المرحلة ${getStageNameInArabic(stg)}`,
        total_students: stgTotal,
        male_count: stgMales,
        female_count: stgFemales,
        morning_count: stgMorning,
        evening_count: stgEvening,
        male_percentage: stgTotal > 0 ? Math.round((stgMales / stgTotal) * 100) : 0,
        female_percentage: stgTotal > 0 ? Math.round((stgFemales / stgTotal) * 100) : 0,
        morning_percentage: stgTotal > 0 ? Math.round((stgMorning / stgTotal) * 100) : 0,
        evening_percentage: stgTotal > 0 ? Math.round((stgEvening / stgTotal) * 100) : 0,
      };
    }

    // 🏢 إرجاع كائن القسم الكامل
    return {
      department_id: dept.id,
      department_name: dept.name,
      department_code: dept.code,
      total_students: deptTotal,
      male_count: deptMales,
      female_count: deptFemales,
      morning_count: deptMorning,
      evening_count: deptEvening,
      male_percentage: deptTotal > 0 ? Math.round((deptMales / deptTotal) * 100) : 0,
      female_percentage: deptTotal > 0 ? Math.round((deptFemales / deptTotal) * 100) : 0,
      morning_percentage: deptTotal > 0 ? Math.round((deptMorning / deptTotal) * 100) : 0,
      evening_percentage: deptTotal > 0 ? Math.round((deptEvening / deptTotal) * 100) : 0,
      stages,
    };
  });

  // 🏛️ إرجاع النتيجة الإحصائية الكلية للكلية
  return {
    total_students,
    total_males,
    total_females,
    total_morning,
    total_evening,
    male_percentage,
    female_percentage,
    morning_percentage,
    evening_percentage,
    departments_count: departments.length,
    departments: deptList,
    stages_summary,
  };
}

//  الدالة المركزية لحساب إحصائيات الكادر التدريسي وتوزيع الذكور والإناث في كافة الأقسام
export function calculateTeacherDemographics(
  profiles: UserProfile[],
  departments: Department[]
): CollegeTeacherDemographics {
  //  تصفية الأساتذة والتدريسيين فقط
  const teachers = profiles.filter((p) => p.role === 'teacher');
  // 🔢 إجمالي عدد الأساتذة الكلي
  const total_teachers = teachers.length;

  //  إجمالي التدريسيين الذكور
  const total_males = teachers.filter((t) => {
    // 🚻 فحص الجنس الصريح أو الفحص الذكي بالاسم
    const gender = t.gender || detectArabicGender(t.full_name);
    return gender === 'male';
  }).length;

  //  إجمالي التدريسيات الإناث
  const total_females = total_teachers - total_males;

  // 📊 النسبة المئوية للذكور
  const male_percentage = total_teachers > 0 ? Math.round((total_males / total_teachers) * 100) : 0;
  // 📊 النسبة المئوية للإناث
  const female_percentage = total_teachers > 0 ? Math.round((total_females / total_teachers) * 100) : 0;

  // 🏢 حساب إحصائيات الأساتذة لكل قسم علمي من الأقسام الـ 12
  const deptList: DepartmentTeacherDemographics[] = departments.map((dept) => {
    // 🔍 جلب أساتذة هذا القسم
    const deptTeachers = teachers.filter((t) => t.department_id === dept.id || t.department_name === dept.name);
    // 🔢 المجموع الكلي لأساتذة القسم
    const deptTotal = deptTeachers.length;
    //  عدد الذكور بالقسم
    const deptMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
    //  عدد الإناث بالقسم
    const deptFemales = deptTotal - deptMales;

    // 🏢 إرجاع كائن إحصائية القسم
    return {
      department_id: dept.id,
      department_name: dept.name,
      department_code: dept.code,
      total_teachers: deptTotal,
      male_count: deptMales,
      female_count: deptFemales,
      male_percentage: deptTotal > 0 ? Math.round((deptMales / deptTotal) * 100) : 0,
      female_percentage: deptTotal > 0 ? Math.round((deptFemales / deptTotal) * 100) : 0,
      teachers: deptTeachers,
    };
  });

  // 🏛️ إرجاع النتيجة الإحصائية الشاملة للتدريسيين
  return {
    total_teachers,
    total_males,
    total_females,
    male_percentage,
    female_percentage,
    departments_count: departments.length,
    departments: deptList,
  };
}
