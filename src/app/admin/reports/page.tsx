'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📊 صفحة استخراج وتصدير تقارير الدرجات والإحصائيات الديموغرافية - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت الأساسية
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات الأكاديمي
import { 
  getCurrentSessionUser, 
  syncDepartmentsFromSupabase, 
  syncProfilesFromSupabase, 
  syncGradesFromSupabase,
  syncCoursesFromSupabase
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة ومزامنة البيانات الحية من Supabase
import { generateAndDownloadExcel } from '@/lib/excel-utils'; // 📦 تصدير الجداول المجدولة الملونة الفاخرة
import { getStoredData, INITIAL_DEPARTMENTS, INITIAL_GRADES, INITIAL_PROFILES, INITIAL_COURSES } from '@/lib/mock-data'; // 💾 قراءة البيانات المحلية المؤقتة
import { 
  Department, 
  Grade, 
  Course,
  UserProfile, 
  CollegeStudentDemographics, 
  DepartmentStudentDemographics, 
  StageStudentDemographics,
  CollegeTeacherDemographics,
  DepartmentTeacherDemographics
} from '@/types'; // 🔗 استيراد الأنواع الصريحة لمنع any تماماً
import { calculateFinalTotal, getLetterGrade, sanitizeExcelField, getStageNameInArabic, calculateCourseworkTotal, getCourseAssessmentScheme } from '@/lib/grade-utils'; // 🧮 دوال حساب الدرجات وتعقيم النصوص ومخططات بولونيا والسعي الموزون
import { calculateStudentDemographics, calculateTeacherDemographics } from '@/lib/demographics-utils'; // 🧮 حسابات ديموغرافيا الطلبة والتدريسيين
import { StudentDemographicsMatrix } from '@/components/analytics/StudentDemographicsMatrix'; // 📊 مصفوفة التوزيع الديموغرافي للطلاب
import { TeacherDemographicsMatrix } from '@/components/analytics/TeacherDemographicsMatrix'; // 👨‍🏫 مصفوفة إحصائيات الكادر التدريسي
import { 
  FileSpreadsheet, 
  Users, 
  GraduationCap, 
  Download, 
  BarChart3, 
  ChevronDown, 
  Check,
  AlertCircle,
  Info,
  CheckCircle2,
  X
} from 'lucide-react'; // 🎨 أيقونات SVG التفاعلية المعتمدة
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust

export default function AdminReportsPage() {
  const router = useRouter(); // 🛣️ تهيئة موجه مسارات الصفحة

  // 📌 حالات البيانات الأساسية للكلية
  const [departments, setDepartments] = useState<Department[]>([]); // 🏛️ قائمة الأقسام العلمية
  const [profiles, setProfiles] = useState<UserProfile[]>([]); // 👥 قائمة البروفايلات للمستخدمين
  const [selectedDeptId, setSelectedDeptId] = useState<string>(''); // 🏢 القسم المختار يبدأ فارغاً (غير محدد) بناءً على طلب المستخدم
  const [selectedStageNum, setSelectedStageNum] = useState<number>(0); // 🎓 المرحلة المختارة تبدأ بـ 0 (غير محدد) حتى يحددها المستخدم
  const [grades, setGrades] = useState<Grade[]>([]); // 📝 سجلات الدرجات الأكاديمية
  const [courses, setCourses] = useState<Course[]>([]); // 📚 قائمة المواد الدراسية ومخططاتها التقييمية
  const [activeReportTab, setActiveReportTab] = useState<'grades' | 'demographics'>('demographics'); // 📑 التبويب النشط الحالي
  const [activeDemographicsView, setActiveDemographicsView] = useState<'students' | 'teachers'>('students'); // 🎛️ تبديل مصفوفة الطلاب أو التدريسيين

  // 🔔 حالة التنبيه العالمي العائم الفاخر لرسائل التصدير والتحقق
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // ⏱️ إخفاء التنبيه العائم تلقائياً بعد 4 ثوانٍ مع دالة تنظيف لمنع تسريب الذاكرة
  useEffect(() => {
    if (!toastMessage) return; // 🛑 إذا ماكو رسالة لا تسوي مؤقت
    const timer = setTimeout(() => {
      setToastMessage(null); // 🧹 مسح التنبيه بعد انتهاء الوقت
    }, 4000);
    return () => clearTimeout(timer); // 🧼 تنظيف المؤقت دائماً
  }, [toastMessage]);

  // 🔒 حالات القوائم المنسدلة التفاعلية المحمية داخل الشاشة
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false); // 📂 حالة فتح قائمة القسم
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState<boolean>(false); // 📂 حالة فتح قائمة المرحلة
  const deptDropdownRef = useRef<HTMLDivElement>(null); // 🎯 مرجع قائمة القسم العلمي
  const stageDropdownRef = useRef<HTMLDivElement>(null); // 🎯 مرجع قائمة المرحلة الدراسية

  // 🔒 إغلاق القوائم المنسدلة عند النقر في أي مكان خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false); // ❌ إغلاق منسدلة القسم
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setIsStageDropdownOpen(false); // ❌ إغلاق منسدلة المرحلة
      }
    };
    document.addEventListener('mousedown', handleClickOutside); // 👂 الاستماع للنقر
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // 🧼 تنظيف المستمع
    };
  }, []);

  // 🔄 فحص الجلسة وتحميل البيانات الأكاديمية
  useEffect(() => {
    const user = getCurrentSessionUser(); // 🔐 جلب المستخدم الحالي
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin'); // 🚪 تحويل غير المصرح لهم
      return;
    }
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS); // 🏛️ تحميل الأقسام
    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES); // 👥 تحميل البروفايلات
    setDepartments(loadedDepts); // 💾 حفظ الأقسام
    setProfiles(loadedProfiles); // 💾 حفظ البروفايلات
    setGrades(getStoredData<Grade[]>('grades', INITIAL_GRADES)); // 💾 حفظ الدرجات
    setCourses(getStoredData<Course[]>('courses', INITIAL_COURSES)); // 💾 حفظ المواد الدراسية
    // 🚫 تم إلغاء التحديد التلقائي لأول قسم بناءً على طلب المستخدم لتبدأ القوائم بـ "غير محدد"

    // ☁️ مزامنة حية ولحظية من سحابة Supabase للأقسام والملفات الشخصية والدرجات والمواد
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) {
        setDepartments(liveDepts); // 🔄 تحديث الأقسام الحية
      }
    }).catch(() => {});

    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) {
        setProfiles(liveProfiles); // 🔄 تحديث البروفايلات الحية
      }
    }).catch(() => {});

    syncGradesFromSupabase().then((liveGrades) => {
      if (liveGrades && liveGrades.length > 0) {
        setGrades(liveGrades); // 🔄 تحديث الدرجات الحية
      }
    }).catch(() => {});

    syncCoursesFromSupabase().then((liveCourses) => {
      if (liveCourses && liveCourses.length > 0) {
        setCourses(liveCourses); // 🔄 تحديث المواد الحية
      }
    }).catch(() => {});

    // 🏷️ تعيين عنوان المتصفح الرسمي
    if (typeof document !== 'undefined') {
      document.title = 'التقارير والإحصائيات الأكاديمية الشاملة | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 🧮 حساب الإحصائيات الديموغرافية الشاملة للطلاب
  const studentDemographics: CollegeStudentDemographics = useMemo(() => {
    return calculateStudentDemographics(profiles, departments);
  }, [profiles, departments]);

  //  حساب الإحصائيات الديموغرافية الشاملة للكادر التدريسي
  const teacherDemographics: CollegeTeacherDemographics = useMemo(() => {
    return calculateTeacherDemographics(profiles, departments);
  }, [profiles, departments]);

  // 🔍 استخراج وتصفية المواد والدرجات للقسم والمرحلة المحددين بدقة
  const filteredStageGrades = useMemo(() => {
    if (!selectedDeptId || selectedStageNum === 0) return []; // 🛑 إذا مو محدد قسم أو مرحلة نرجع مصفوفة فارغة
    return grades.filter((g) => {
      const matchDept = !g.department_id || g.department_id === selectedDeptId; // 🏢 مطابقة معرف القسم
      const studentProfile = profiles.find((p) => p.university_number === g.university_number); // 👤 جلب ملف الطالب لمطابقة رقم مرحلته الدراسية
      const matchStage = !studentProfile?.stage_number || studentProfile.stage_number === selectedStageNum; // 🎓 مطابقة رقم المرحلة مع بروفايل الطالب
      return matchDept && matchStage; // 🎯 لازم القسم والمرحلة يتحققون سوية
    });
  }, [grades, profiles, selectedDeptId, selectedStageNum]);

  // 📥 دالة تصدير كشف درجات المرحلة مع الصف الأول ملون وحماية صارمة
  const exportStageExcelReport = async () => {
    // 🛡️ فحص إذا كان القسم غير محدد
    if (!selectedDeptId) {
      setToastMessage({
        text: 'يرجى اختيار القسم العلمي أولاً لتوليد كشف الدرجات.', // ⚠️ رسالة تحذير
        type: 'warning',
      });
      return;
    }

    // 🛡️ فحص إذا كانت المرحلة غير محددة
    if (selectedStageNum === 0) {
      setToastMessage({
        text: 'يرجى اختيار المرحلة الدراسية لتوليد كشف الدرجات.', // ⚠️ رسالة تحذير
        type: 'warning',
      });
      return;
    }

    const dept = departments.find((d) => d.id === selectedDeptId); // 🔍 جلب بيانات القسم
    
    // ⚠️ فحص إذا ماكو درجات أو مواد مسجلة لهذا القسم والمرحلة
    if (filteredStageGrades.length === 0) {
      setToastMessage({
        text: 'لا توجد مواد أو درجات مسجلة لهذا القسم والمرحلة حتى الآن.', // ❌ تنبيه لا يوجد
        type: 'error',
      });
      return;
    }

    // 📝 بناء الصفوف المنسقة لملف الإكسل مع مراعاة مخطط التقييم الفعلي لكل مادة
    const reportRows = filteredStageGrades.map((g) => {
      const courseObj = courses.find((c) => c.id === g.course_id); // 🔍 العثور على بيانات المادة
      const courseScheme = courseObj ? getCourseAssessmentScheme(courseObj) : undefined; // 🎛️ جلب مخطط التقييم للمادة
      const isSupActive = courseObj?.is_supplementary_exam_enabled === true; // 🔄 فحص تفعيل الدور الثاني للمادة
      const cwScore = courseScheme ? calculateCourseworkTotal(g, courseScheme) : (g.final_coursework_total || 0); // 📊 السعي الفعلي للبنود المفتوحة فقط
      const finalScore = calculateFinalTotal(g, isSupActive, courseScheme); // 🧮 حساب المجموع الكلي وفق المخطط الفعلي
      const letter = getLetterGrade(finalScore); // 🔤 استخراج التقدير الحرفي

      return {
        uni_num: sanitizeExcelField(g.university_number || ''), // 🔢 الرقم الجامعي المعقم
        std_name: sanitizeExcelField(g.student_name || ''), // 👤 اسم الطالب بدون مساس
        course: sanitizeExcelField(g.course_name || ''), // 📚 اسم المادة
        cw: cwScore, // 📊 سعي الفصل الفعلي الموزون
        fe: g.final_exam, // 📝 الامتحان النهائي
        sup: g.supplementary_exam || '-', // 🔄 الدور الثاني
        tot: finalScore, // 💯 المجموع النهائي
        grade_letter: letter, // 🏆 التقدير
      };
    });

    // 📦 توليد وتنزيل ملف الإكسل الرسمي
    await generateAndDownloadExcel(
      [
        {
          sheetName: 'تقرير_الدرجات', // 📑 اسم الشيت
          columns: [
            { header: 'الرقم الجامعي', key: 'uni_num', width: 22 },
            { header: 'اسم الطالب الرباعي', key: 'std_name', width: 32 },
            { header: 'المادة الدراسية', key: 'course', width: 28 },
            { header: 'مجموع السعي (50)', key: 'cw', width: 20 },
            { header: 'الامتحان النهائي (50)', key: 'fe', width: 22 },
            { header: 'درجة الإكمال (الدور 2)', key: 'sup', width: 24 },
            { header: 'المجموع الكلي (100)', key: 'tot', width: 22 },
            { header: 'التقدير الحرفي', key: 'grade_letter', width: 20 },
          ],
          data: reportRows, // 📄 مصفوفة البيانات
          headerColor: 'FF1E293B', // 🎨 لون الترويسة الكحلي الفاخر
        },
      ],
      `كشف_درجات_${dept?.name || 'القسم'}_المرحلة_${selectedStageNum}.xlsx` // 🏷️ اسم الملف
    );

    // 🎉 إشعار نجاح التصدير
    setToastMessage({
      text: `تم تصدير كشف درجات ${dept?.name || 'القسم'} للمرحلة ${getStageNameInArabic(selectedStageNum)} بنجاح!`, // 🌟 رسالة نجاح
      type: 'success',
    });
  };

  // 📊 📥 دالة تصدير تقرير إحصائيات وتوزيع الطلبة والتدريسيين الديموغرافي الشامل لكافة الأقسام والمراحل مع الصف الأول ملون
  const exportDemographicsExcelReport = async () => {
    const todayStr = new Date().toLocaleDateString('ar-IQ-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }); // 📅 تاريخ اليوم

    // 1️⃣ الورقة الأولى: الملخص الإحصائي المركزي للكلية (الطلاب والكادر التدريسي)
    const summaryRows: Record<string, string | number>[] = [
      { metric: 'الجهة والمؤسسة', val: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان' },
      { metric: 'تاريخ إصدار التقرير', val: todayStr },
      { metric: 'إجمالي عدد الأقسام العلمية', val: studentDemographics.departments_count },
      { metric: '=== إحصائيات الكادر التدريسي ===', val: '=====================' },
      { metric: 'إجمالي عدد الكادر التدريسي الكلي', val: teacherDemographics.total_teachers },
      { metric: 'إجمالي عدد التدريسيين الذكور', val: teacherDemographics.total_males },
      { metric: 'نسبة التدريسيين الذكور (%)', val: `${teacherDemographics.male_percentage}%` },
      { metric: 'إجمالي عدد التدريسيات الإناث', val: teacherDemographics.total_females },
      { metric: 'نسبة التدريسيات الإناث (%)', val: `${teacherDemographics.female_percentage}%` },
      { metric: '=== إحصائيات طلبة الجامعة ===', val: '=====================' },
      { metric: 'إجمالي طلبة الجامعة الكلي', val: studentDemographics.total_students },
      { metric: 'إجمالي عدد طلبة الدراسة الصباحية', val: studentDemographics.total_morning },
      { metric: 'نسبة طلبة الدراسة الصباحية (%)', val: `${studentDemographics.morning_percentage}%` },
      { metric: 'إجمالي عدد طلبة الدراسة المسائية', val: studentDemographics.total_evening },
      { metric: 'نسبة طلبة الدراسة المسائية (%)', val: `${studentDemographics.evening_percentage}%` },
      { metric: 'إجمالي عدد الطلاب الذكور', val: studentDemographics.total_males },
      { metric: 'نسبة الطلاب الذكور (%)', val: `${studentDemographics.male_percentage}%` },
      { metric: 'إجمالي عدد الطالبات الإناث', val: studentDemographics.total_females },
      { metric: 'نسبة الطالبات الإناث (%)', val: `${studentDemographics.female_percentage}%` },
    ];

    // 2️⃣ الورقة الثانية: مصفوفة الكادر التدريسي في الأقسام الـ 12
    const teacherRows: Record<string, string | number>[] = teacherDemographics.departments.map((dept: DepartmentTeacherDemographics, idx: number) => {
      return {
        seq: idx + 1,
        dept_name: dept.department_name,
        dept_code: dept.department_code,
        male: dept.male_count,
        male_pct: `${dept.male_percentage}%`,
        female: dept.female_count,
        female_pct: `${dept.female_percentage}%`,
        total: dept.total_teachers,
      };
    });

    // 3️⃣ الورقة الثالثة: مصفوفة أعداد الطلاب في الأقسام الـ 12 والمراحل الـ 4
    const deptRows: Record<string, string | number>[] = studentDemographics.departments.map((dept: DepartmentStudentDemographics, idx: number) => {
      const stg1 = dept.stages[1];
      const stg2 = dept.stages[2];
      const stg3 = dept.stages[3];
      const stg4 = dept.stages[4];

      return {
        seq: idx + 1,
        dept_name: dept.department_name,
        dept_code: dept.department_code,
        stg1_tot: stg1 ? stg1.total_students : 0,
        stg1_m: stg1 ? stg1.male_count : 0,
        stg1_f: stg1 ? stg1.female_count : 0,
        stg2_tot: stg2 ? stg2.total_students : 0,
        stg2_m: stg2 ? stg2.male_count : 0,
        stg2_f: stg2 ? stg2.female_count : 0,
        stg3_tot: stg3 ? stg3.total_students : 0,
        stg3_m: stg3 ? stg3.male_count : 0,
        stg3_f: stg3 ? stg3.female_count : 0,
        stg4_tot: stg4 ? stg4.total_students : 0,
        stg4_m: stg4 ? stg4.male_count : 0,
        stg4_f: stg4 ? stg4.female_count : 0,
        tot_morning: dept.morning_count,
        pct_morning: `${dept.morning_percentage}%`,
        tot_evening: dept.evening_count,
        pct_evening: `${dept.evening_percentage}%`,
        tot_m: dept.male_count,
        tot_f: dept.female_count,
        tot_all: dept.total_students,
        pct_m: `${dept.male_percentage}%`,
        pct_f: `${dept.female_percentage}%`,
      };
    });

    // 📦 توليد وتنزيل ملف الإحصائيات الشامل مع 3 شيتات منفصلة
    await generateAndDownloadExcel(
      [
        {
          sheetName: 'ملخص_إحصائيات_الكلية',
          columns: [
            { header: 'المؤشر الإحصائي', key: 'metric', width: 36 },
            { header: 'القيمة', key: 'val', width: 32 },
          ],
          data: summaryRows,
          headerColor: 'FF1E293B',
        },
        {
          sheetName: 'مصفوفة_الكادر_التدريسي',
          columns: [
            { header: 'ت', key: 'seq', width: 8 },
            { header: 'القسم العلمي', key: 'dept_name', width: 32 },
            { header: 'رمز القسم', key: 'dept_code', width: 14 },
            { header: 'التدريسيين الذكور', key: 'male', width: 22 },
            { header: 'نسبة الذكور (%)', key: 'male_pct', width: 18 },
            { header: 'التدريسيات الإناث', key: 'female', width: 22 },
            { header: 'نسبة الإناث (%)', key: 'female_pct', width: 18 },
            { header: 'إجمالي الكادر التدريسي', key: 'total', width: 24 },
          ],
          data: teacherRows,
          headerColor: 'FF1E3A8A',
        },
        {
          sheetName: 'مصفوفة_أعداد_الطلبة',
          columns: [
            { header: 'ت', key: 'seq', width: 8 },
            { header: 'القسم العلمي', key: 'dept_name', width: 32 },
            { header: 'رمز القسم', key: 'dept_code', width: 14 },
            { header: 'المرحلة الأولى (كلي)', key: 'stg1_tot', width: 16 },
            { header: 'المرحلة الأولى (ذكور)', key: 'stg1_m', width: 16 },
            { header: 'المرحلة الأولى (إناث)', key: 'stg1_f', width: 16 },
            { header: 'المرحلة الثانية (كلي)', key: 'stg2_tot', width: 16 },
            { header: 'المرحلة الثانية (ذكور)', key: 'stg2_m', width: 16 },
            { header: 'المرحلة الثانية (إناث)', key: 'stg2_f', width: 16 },
            { header: 'المرحلة الثالثة (كلي)', key: 'stg3_tot', width: 16 },
            { header: 'المرحلة الثالثة (ذكور)', key: 'stg3_m', width: 16 },
            { header: 'المرحلة الثالثة (إناث)', key: 'stg3_f', width: 16 },
            { header: 'المرحلة الرابعة (كلي)', key: 'stg4_tot', width: 16 },
            { header: 'المرحلة الرابعة (ذكور)', key: 'stg4_m', width: 16 },
            { header: 'المرحلة الرابعة (إناث)', key: 'stg4_f', width: 16 },
            { header: 'طلبة الصباحي', key: 'tot_morning', width: 16 },
            { header: 'نسبة الصباحي (%)', key: 'pct_morning', width: 16 },
            { header: 'طلبة المسائي', key: 'tot_evening', width: 16 },
            { header: 'نسبة المسائي (%)', key: 'pct_evening', width: 16 },
            { header: 'إجمالي الذكور', key: 'tot_m', width: 16 },
            { header: 'إجمالي الإناث', key: 'tot_f', width: 16 },
            { header: 'إجمالي طلبة القسم', key: 'tot_all', width: 20 },
            { header: 'نسبة الذكور (%)', key: 'pct_m', width: 16 },
            { header: 'نسبة الإناث (%)', key: 'pct_f', width: 16 },
          ],
          data: deptRows,
          headerColor: 'FF0F172A',
        },
      ],
      `التقرير_الإحصائي_الديموغرافي_الشامل_ميسان_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // 🎉 إشعار نجاح تحميل ملف الإحصائيات
    setToastMessage({
      text: 'تم تحميل جدول الإحصائيات الديموغرافية الشامل بنجاح بصيغة إكسل!', // 🌟 رسالة نجاح
      type: 'success',
    });
  };

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4 relative" dir="rtl">
        
        {/* 🔔 التنبيه العالمي العائم الفاخر (Light Mode أبيض ناصع) متطابق مع باقي شاشات المنظومة وبدون أي لون برتقالي */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
            <div className={`p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 ring-4 flex items-center justify-between gap-4 backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'border-emerald-500/80 ring-emerald-400/10'
                : toastMessage.type === 'warning'
                ? 'border-indigo-500/80 ring-indigo-400/10'
                : 'border-rose-500/80 ring-rose-400/10'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-2xl shadow-2xs shrink-0 border-2 ${
                  toastMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : toastMessage.type === 'warning'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}>
                  {toastMessage.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  ) : toastMessage.type === 'warning' ? (
                    <Info className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>
                <div className="text-right">
                  <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                  <p className="font-black text-sm text-slate-950 mt-0.5">{toastMessage.text}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* 🏛️ هيدر الصفحة الكحلي عريض الشاشة بحدود ناعمة */}
        <div className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-indigo-700" />
              <span>التقارير والإحصائيات المركزية الشاملة</span>
            </h1>
            <p className="text-base text-slate-950 font-black mt-1.5"> {/* 🖤 الوصف التوضيحي باللون الأسود الفاحم */}
              جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تصدير كشوفات الدرجات والمصفوفات الإحصائية الديموغرافية للطلبة والكادر التدريسي
            </p>
          </div>

          {/* 🎛️ أزرار التبديل بين التقارير */}
          {/* 🎛️ أزرار التبديل بين نوع التقرير (إحصائيات أو كشوفات درجات) */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            {/* 👥 زر تبويب إحصائيات وتوزيع الطلبة والتدريسيين */}
            <button
              type="button"
              onClick={() => setActiveReportTab('demographics')}
              className={`px-5 py-3 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeReportTab === 'demographics'
                  ? 'bg-[#0F2942] text-white border border-[#1e4570] shadow-sm'
                  : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
              }`}
            >
              <Users className={`w-5 h-5 ${activeReportTab === 'demographics' ? 'text-cyan-300' : 'text-slate-900'}`} />
              <span className={activeReportTab === 'demographics' ? 'text-white font-black' : 'text-slate-950 font-black'}>
                إحصائيات وتوزيع الطلبة والتدريسيين
              </span>
            </button>

            {/* 🎓 زر تبويب كشوفات درجات المواد */}
            <button
              type="button"
              onClick={() => setActiveReportTab('grades')}
              className={`px-5 py-3 rounded-xl text-base font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeReportTab === 'grades'
                  ? 'bg-[#0F2942] text-white border border-[#1e4570] shadow-sm'
                  : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${activeReportTab === 'grades' ? 'text-cyan-300' : 'text-slate-900'}`} />
              <span className={activeReportTab === 'grades' ? 'text-white font-black' : 'text-slate-950 font-black'}>
                كشوفات درجات المواد
              </span>
            </button>
          </div>
        </div>

        {/* 📊 1. تبويب الإحصائيات الديموغرافية لأعداد الطلبة وتوزيع الذكور والإناث والكادر التدريسي */}
        {activeReportTab === 'demographics' && (
          <div className="space-y-6 w-full">
            {/* بطاقة التصدير الإحصائي السريع */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2.5">
                  <BarChart3 className="w-6 h-6 text-indigo-700" />
                  <span>تصدير تقرير الإحصائيات الديموغرافية الكامل (.xlsx)</span>
                </h3>
                <p className="text-base text-slate-700 font-black mt-1.5 leading-relaxed">
                  يتضمن ملف الإكسل 3 شيتات منفصلة: ملخص الكلية العام، مصفوفة الكادر التدريسي، ومصفوفة أعداد الطلبة لكافة الأقسام الـ 12 ونسب الذكور والإناث.
                </p>
              </div>

              {/* 🎨 زر تحميل جدول الإحصائيات الشامل إكسل بلون تبويب التقارير الكحلي الملكي الفاخر */}
              <button
                type="button"
                onClick={exportDemographicsExcelReport}
                className="px-6 py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-sm hover:shadow-md transition flex items-center gap-2.5 cursor-pointer flex-shrink-0 border border-[#1e4570] active:scale-95"
              >
                <Download className="w-5 h-5 text-cyan-300" />
                <span>تحميل جدول الإحصائيات الشامل إكسل</span>
              </button>
            </div>

            {/* 🎛️ أزرار التبديل بين مصفوفة الطلبة ومصفوفة التدريسيين بعرض الصفحة بالكامل (100% Full Width) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
              {/* 🎓 زر تبويب مصفوفة الطلاب - مصمم ليكون فاقع الوضوح إذا محدد أو غير محدد */}
              <button
                type="button"
                onClick={() => setActiveDemographicsView('students')}
                className={`w-full py-4 px-6 rounded-xl text-base font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  activeDemographicsView === 'students'
                    ? 'bg-[#0F2942] text-white border border-[#1e4570] shadow-sm'
                    : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
                }`}
              >
                <GraduationCap className={`w-6 h-6 ${activeDemographicsView === 'students' ? 'text-cyan-300' : 'text-slate-900'}`} />
                <span className={activeDemographicsView === 'students' ? 'text-white font-black' : 'text-slate-950 font-black'}>
                  مصفوفة أعداد الطلاب والمراحل
                </span>
              </button>

              {/* 👨‍🏫 زر تبويب مصفوفة التدريسيين - مصمم ليكون فاقع الوضوح إذا محدد أو غير محدد */}
              <button
                type="button"
                onClick={() => setActiveDemographicsView('teachers')}
                className={`w-full py-4 px-6 rounded-xl text-base font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  activeDemographicsView === 'teachers'
                    ? 'bg-[#0F2942] text-white border border-[#1e4570] shadow-sm'
                    : 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
                }`}
              >
                <Users className={`w-6 h-6 ${activeDemographicsView === 'teachers' ? 'text-cyan-300' : 'text-slate-900'}`} />
                <span className={activeDemographicsView === 'teachers' ? 'text-white font-black' : 'text-slate-950 font-black'}>
                  مصفوفة الكادر التدريسي (الذكور والإناث)
                </span>
              </button>
            </div>

            {/* عرض المصفوفة التفاعلية المناسبة بعرض كامل 100% */}
            <div className="w-full">
              {activeDemographicsView === 'students' ? (
                <StudentDemographicsMatrix
                  profiles={profiles}
                  departments={departments}
                  demographicsData={studentDemographics}
                />
              ) : (
                <TeacherDemographicsMatrix
                  profiles={profiles}
                  departments={departments}
                  demographicsData={teacherDemographics}
                />
              )}
            </div>
          </div>
        )}

        {/* 🎓 2. تبويب تقارير الدرجات والمواد على كامل عرض الصفحة 100% */}
        {activeReportTab === 'grades' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
                  <GraduationCap className="w-7 h-7 text-indigo-700 shrink-0" />
                  <span>تحديد نطاق تقرير الدرجات الأكاديمي</span>
                </h2>
                <p className="text-base text-slate-950 font-black mt-1.5">
                  اختر القسم العلمي والمرحلة الدراسية لتوليد كشف إكسل رسمي منسق ومقفل
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-xl">
                  كشوفات المراحل الدراسية الرسمية
                </span>
              </div>
            </div>

            {/* 📐 شبكة الحقول المتجاوبة المتناسقة عبر كامل عرض البطاقة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 🏢 قائمة القسم العلمي المخصصة - تبدأ بـ "غير محدد" */}
              <div className="space-y-2 relative" ref={deptDropdownRef}>
                <label className="block text-base font-black text-slate-950">القسم العلمي *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeptDropdownOpen(!isDeptDropdownOpen);
                    setIsStageDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 text-base font-black hover:bg-slate-100 hover:border-slate-400 focus:outline-none transition cursor-pointer shadow-2xs"
                >
                  <span className="truncate">
                    {departments.find((d) => d.id === selectedDeptId)?.name || 'غير محدد (اختر القسم العلمي)'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-950 font-black transition-transform duration-200 shrink-0 ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDeptDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    {/* 🚫 خيار غير محدد للقسم العلمي */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeptId('');
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-3.5 text-base font-black flex items-center justify-between transition-colors cursor-pointer ${
                        !selectedDeptId
                          ? 'bg-indigo-50 text-indigo-950 font-black'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-black'
                      }`}
                    >
                      <span className="truncate">-- غير محدد (اختر القسم العلمي) --</span>
                      {!selectedDeptId && <Check className="w-5 h-5 text-indigo-700 shrink-0 mr-2" />}
                    </button>

                    {departments.map((dept) => {
                      const isSelected = selectedDeptId === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setSelectedDeptId(dept.id);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3.5 text-base font-black flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-950 font-black'
                              : 'text-slate-950 hover:bg-slate-50 hover:text-black'
                          }`}
                        >
                          <span className="truncate">{dept.name}</span>
                          {isSelected && <Check className="w-5 h-5 text-indigo-700 shrink-0 mr-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 🎓 قائمة المرحلة الدراسية المخصصة - تبدأ بـ "غير محدد" */}
              <div className="space-y-2 relative" ref={stageDropdownRef}>
                <label className="block text-base font-black text-slate-950">المرحلة الدراسية *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsStageDropdownOpen(!isStageDropdownOpen);
                    setIsDeptDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 text-base font-black hover:bg-slate-100 hover:border-slate-400 focus:outline-none transition cursor-pointer shadow-2xs"
                >
                  <span>
                    {selectedStageNum > 0 ? `المرحلة ${getStageNameInArabic(selectedStageNum)}` : 'غير محدد (اختر المرحلة الدراسية)'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-950 font-black transition-transform duration-200 shrink-0 ${isStageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStageDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    {/* 🚫 خيار غير محدد للمرحلة الدراسية */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStageNum(0);
                        setIsStageDropdownOpen(false);
                      }}
                      className={`w-full text-right px-4 py-3.5 text-base font-black flex items-center justify-between transition-colors cursor-pointer ${
                        selectedStageNum === 0
                          ? 'bg-indigo-50 text-indigo-950 font-black'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-black'
                      }`}
                    >
                      <span>-- غير محدد (اختر المرحلة الدراسية) --</span>
                      {selectedStageNum === 0 && <Check className="w-5 h-5 text-indigo-700 shrink-0 mr-2" />}
                    </button>

                    {[1, 2, 3, 4].map((n) => {
                      const isSelected = selectedStageNum === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setSelectedStageNum(n);
                            setIsStageDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3.5 text-base font-black flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-950 font-black'
                              : 'text-slate-950 hover:bg-slate-50 hover:text-black'
                          }`}
                        >
                          <span>المرحلة {getStageNameInArabic(n)}</span>
                          {isSelected && <Check className="w-5 h-5 text-indigo-700 shrink-0 mr-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 📊 1. بطاقة النطاق الأكاديمي غير محدد - تصميم مرتب وفاخر */}
            {!selectedDeptId || selectedStageNum === 0 ? (
              <div className="p-8 sm:p-10 bg-slate-50/70 border border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
                {/* 🎨 كبسولة أيقونة التخرج المركزية بحلقة ضوئية إنديغو ناعمة */}
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-sm ring-8 ring-indigo-50/50">
                  <GraduationCap className="w-8 h-8 stroke-[2.2]" />
                </div>
                {/* 📝 العناوين الإرشادية الواضحة بخط فخم */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    النطاق الأكاديمي غير محدد
                  </h3>
                  <p className="text-sm sm:text-base font-black text-slate-600 max-w-lg mx-auto leading-relaxed">
                    يرجى اختيار القسم العلمي والمرحلة الدراسية من القوائم أعلاه لتوليد واستخراج كشف الدرجات الرسمي.
                  </p>
                </div>
              </div>
            ) : filteredStageGrades.length === 0 ? (
              /* 📊 2. بطاقة لا يوجد مواد دراسية أو درجات مسجلة - تصميم أنيق يوضح النطاق المختار */
              <div className="p-8 sm:p-10 bg-slate-50/70 border border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
                {/* 🎨 كبسولة أيقونة الإكسل والبيانات بحلقة رمادية هادئة */}
                <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center mx-auto shadow-sm ring-8 ring-slate-100/60">
                  <FileSpreadsheet className="w-8 h-8 stroke-[2.2]" />
                </div>
                {/* 📝 نص التحذير وتأكيد خلو السجلات للقسم والمرحلة */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    لا يوجد مواد دراسية أو درجات مسجلة
                  </h3>
                  <p className="text-sm sm:text-base font-black text-slate-600 max-w-lg mx-auto leading-relaxed">
                    لم يتم العثور على أي سجلات درجات أو مواد أكاديمية مضافة لهذا القسم والمرحلة حالياً.
                  </p>
                </div>
                {/* 🏷️ كبسولة تأكيد النطاق المفحوص بدقة */}
                <div className="pt-2">
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm font-black text-slate-900 shadow-2xs">
                    <span>القسم العلمي: <strong className="text-indigo-950">{departments.find((d) => d.id === selectedDeptId)?.name || 'غير محدد'}</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>المرحلة: <strong className="text-indigo-950">{getStageNameInArabic(selectedStageNum)}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-emerald-950">
                      تم العثور على {filteredStageGrades.length} سجلاً معتمداً لهذا النطاق
                    </p>
                    <p className="text-xs sm:text-sm font-black text-emerald-700">
                      الكشف الأكاديمي جاهز للتصدير المباشر بملف إكسل منسق ومقفل.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 🔘 أزرار التصدير ومعلومات الملف على كامل العرض */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-black text-slate-950 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>يتم استخراج وتوليد كشف الدرجات بصيغة إكسل رسمية معتمدة لكافة مواد المرحلة</span>
              </div>

              <button
                type="button"
                onClick={exportStageExcelReport}
                className="w-full sm:w-auto px-8 py-4 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-2xl text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer border border-[#1e4570] hover:shadow-lg active:scale-95"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>تصدير كشف درجات المرحلة (.xlsx)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </ZeroTrustGuard>
  );
}

