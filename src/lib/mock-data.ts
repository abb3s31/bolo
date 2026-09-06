// 💾 ملف إدارة البيانات التأسيسية والتخزين المحلي النظيف (Clean Slate 100%)
// جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا المعتمد 2026 - 2027

import { 
  Department, 
  Stage, 
  AcademicYear, 
  Course, 
  UserProfile, 
  Grade, 
  AuditLog, 
  TeacherCourse, 
  ScheduleLecture, 
  DepartmentScheduleConfig, 
  StudentAttendanceRecord, 
  AttendanceExcuseRequest, 
  FinalExamSchedule, 
  FinalExamSlot, 
  StudentTuitionRecord, 
  CampusAnnouncement, 
  CourseAcademicTask, 
  StudentTaskSubmission, 
  AppNotification 
} from '@/types'; // 🔗 استيراد الواجهات والأنواع الأكاديمية الصريحة

// 🏛️ الأقسام الأكاديمية (فارغة تماماً - تبدأ من الصفر لتقوم إدارة الكلية بإنشائها بنفسها)
export const INITIAL_DEPARTMENTS: Department[] = [];

// 🎓 المراحل الدراسية (فارغة - تُنشأ وتتبع الأقسام ديناميكياً)
export const INITIAL_STAGES: Stage[] = [];

// 🗓️ السنة الدراسية المعتمدة رسمياً للمنظومة
export const INITIAL_YEARS: AcademicYear[] = [
  { id: 'year-2026', label: '2026-2027', is_current: true },
];

// 📘 المواد الدراسية (فارغة تماماً - تبدأ من الصفر لتضيفها إدارة القسم بنفسها)
export const INITIAL_COURSES: Course[] = [];

// 👤 قائمة الحسابات والملفات الشخصية (فارغة كلياً - تم مسح كافة الحسابات الافتراضية والطلاب والأساتذة الوهميين)
export const INITIAL_PROFILES: UserProfile[] = [];

// 🔗 ربط وتكليف الأساتذة بالمواد (فارغة)
export const INITIAL_TEACHER_COURSES: TeacherCourse[] = [];

// 📊 درجات وسعيات الطلاب (فارغة تماماً)
export const INITIAL_GRADES: Grade[] = [];

// 📜 سجلات الرقابة والتدقيق الأمني (فارغة)
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// ⚙️ إعدادات الجدول الدراسي (تعتمد ديناميكياً على الأقسام الحقيقية)
export const INITIAL_SCHEDULE_CONFIGS: DepartmentScheduleConfig[] = [];

// 📅 المحاضرات والجداول الأسبوعية (فارغة تماماً)
export const INITIAL_SCHEDULE_LECTURES: ScheduleLecture[] = [];

// 📋 سجلات الحضور والغياب والإجازات (فارغة تماماً)
export const INITIAL_ATTENDANCE_RECORDS: StudentAttendanceRecord[] = [];

// 📝 طلبات الإجازات والأعذار (فارغة)
export const INITIAL_EXCUSE_REQUESTS: AttendanceExcuseRequest[] = [];

// 📑 جداول الامتحانات النهائية الرسمية (فارغة)
export const INITIAL_FINAL_EXAM_SCHEDULES: FinalExamSchedule[] = [];

// 🪑 فترات وقاعات الامتحانات النهائية (فارغة)
export const INITIAL_FINAL_EXAM_SLOTS: FinalExamSlot[] = [];

// 💰 السجلات المالية والأقساط الدراسية والوصولات (فارغة تماماً)
export const INITIAL_TUITION_RECORDS: StudentTuitionRecord[] = [];

// 📢 التعميمات والإعلانات الرسمية للجامعة (فارغة)
export const INITIAL_CAMPUS_ANNOUNCEMENTS: CampusAnnouncement[] = [];

// 📚 التكليفات والامتحانات الفصلية للأساتذة (فارغة)
export const INITIAL_ACADEMIC_TASKS: CourseAcademicTask[] = [];

// 📄 تسليمات الواجبات والتقارير للطلاب (فارغة)
export const INITIAL_STUDENT_SUBMISSIONS: StudentTaskSubmission[] = [];

// 🔔 الإشعارات والتنبيهات (فارغة تماماً)
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// 🏷️ إصدار تنظيف وتطهير قاعدة البيانات الشامل بالمتصفح (Clean Slate Zero Mock Data)
const CLEAN_DATABASE_VERSION = 'v12_force_sync_academic_year_2026_2027';

// 🛠️ دالة قراءة التخزين الرسمي بالمتصفح بشكل نقي وبدون أي حقن وهمي
export function getStoredData<T>(key: string, initialFallback: T): T {
  // 🔒 فحص بيئة التنفيذ (إذا خادم نرجع القيمة التأسيسية مباشرة)
  if (typeof window === 'undefined') return initialFallback;

  try {
    // 🧹 تنفيذ التطهير الشامل للبيانات الوهمية لمرة واحدة عند الترقية للإصدار النظيف
    const currentVersion = localStorage.getItem('sadiq_univ_db_clean_version');
    if (currentVersion !== CLEAN_DATABASE_VERSION) {
      // 🗑️ مسح كافة المفاتيح القديمة التي كانت تحتوي على بيانات تجريبية وهمية
      const keysToPurge = [
        'departments',
        'stages',
        'courses',
        'profiles',
        'grades',
        'attendance_records',
        'student_attendance_records',
        'tuition_records',
        'schedule_lectures',
        'final_exam_schedules',
        'final_exam_slots',
        'academic_tasks',
        'student_submissions',
        'notifications',
        'audit_logs',
        'teacher_courses',
        'department_schedule_configs',
        'current_user',
        'zt_session',
      ];

      // 🔄 المرور على كل مفتاح وحذفه لضمان صفحة بيضاء نقية
      keysToPurge.forEach((k) => {
        localStorage.removeItem(`sadiq_univ_${k}`);
      });

      // 🧹 مسح مفاتيح المستودعات والتخزين الإضافي القديمة
      const extraLegacyKeys = [
        'uomis_departments_data_v2',
        'uomis_grades_data_v2',
        'uomis_courses_data_v2',
        'uomis_schedules_data_v2',
        'uomis_notifications_data_v2',
        'uomis_attendance_data_v2',
        'uomis_audit_logs_data_v2',
        'app_course_academic_tasks',
        'app_student_completed_tasks',
        'sadiq_remembered_superadmin_email',
        'sadiq_remembered_head_email',
        'sadiq_remembered_student_email',
        'sadiq_remembered_teacher_email',
        'sadiq_remembered_rapporteur_email',
      ];
      extraLegacyKeys.forEach((k) => {
        localStorage.removeItem(k);
      });

      // 🗓️ تثبيت العام الدراسي الرسمي المعتمد 2026-2027
      localStorage.setItem('sadiq_univ_current_academic_year', '2026-2027');
      // 🏷️ حفظ ختم الإصدار النظيف لمنع تكرار المسح
      localStorage.setItem('sadiq_univ_db_clean_version', CLEAN_DATABASE_VERSION);
    }

    // 📥 جلب السجل الفعلي المخزن من التخزين المحلي
    const item = localStorage.getItem(`sadiq_univ_${key}`);
    if (item !== null) {
      return JSON.parse(item) as T; // 🟢 إرجاع البيانات المحفوظة كما هي
    }

    // 🛡️ إذا لم تكن موجودة بعد، نرجع القيمة التأسيسية النظيفة
    return initialFallback;
  } catch {
    // 🚨 في حال حدوث أي خطأ بالقراءة، نرجع القيمة التأسيسية
    return initialFallback;
  }
}

// 💾 دالة حفظ البيانات في التخزين المحلي الآمن
export function saveStoredData<T>(key: string, data: T): void {
  // 🔒 فحص بيئة التنفيذ
  if (typeof window === 'undefined') return;

  try {
    // 💾 التخزين بصيغة JSON المعيارية
    localStorage.setItem(`sadiq_univ_${key}`, JSON.stringify(data));
  } catch (err) {
    // ⚠️ تسجيل التحذير في حال امتلاء السعة
    console.warn(`تحذير أثناء حفظ البيانات للمفتاح ${key}:`, err);
  }
}

// 📅 دالة جلب العام الدراسي المعتمد حالياً
export function getAcademicYear(): string {
  // 🔒 فحص بيئة المتصفح
  if (typeof window === 'undefined') return '2026-2027';

  try {
    // 🔍 قراءة العام من التخزين المحلي
    const stored = localStorage.getItem('sadiq_univ_current_academic_year');
    if (!stored || stored.includes('2025') || stored === '2026-2025' || stored === '2025-2026' || stored === 'year-2025') {
      localStorage.setItem('sadiq_univ_current_academic_year', '2026-2027');
      return '2026-2027';
    }
    return stored;
  } catch {
    return '2026-2027';
  }
}

// ✍️ دالة تحديث وتثبيت العام الدراسي
export function setAcademicYear(year: string): void {
  // 🔒 فحص بيئة المتصفح
  if (typeof window === 'undefined') return;

  try {
    const cleanYear = (!year || year.includes('2025') || year === '2026-2025' || year === '2025-2026' || year === 'year-2025') ? '2026-2027' : year.trim();
    // 💾 حفظ العام الدراسي الجديد
    localStorage.setItem('sadiq_univ_current_academic_year', cleanYear);
    // 📢 بث الحدث محلياً لكافة الشاشات المفتوحة
    window.dispatchEvent(new CustomEvent('academic_year_changed', { detail: cleanYear }));
  } catch (err) {
    console.warn('تحذير أثناء حفظ العام الدراسي:', err);
  }
}

// ✍️ دالة حفظ وتحديث العام الدراسي في التخزين
export function saveAcademicYear(year: string): void {
  setAcademicYear(year);
}

// 📅 دالة تنسيق عرض العام الدراسي بشكل معتمد وموحد
export function formatAcademicYearDisplay(year?: string): string {
  if (!year) return '2026-2027';
  if (year.startsWith('year-')) {
    const raw = year.replace('year-', '');
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      return `${num}-${num + 1}`;
    }
  }
  return year;
}


// 🎲 دالة توليد بريد إلكتروني أكاديمي فريد وقوي جداً
export function generateStrongUniqueEmail(
  prefix: 'st' | 'dr' | 'head' | 'rap' | 'admin' | string, 
  existingProfiles?: UserProfile[]
): string {
  // 📚 جلب كافة الحسابات الحالية لفحص الفرادة
  const allProfiles = existingProfiles && existingProfiles.length > 0
    ? existingProfiles
    : getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);

  const existingEmails = new Set(
    allProfiles
      .map((p) => (p.generated_email || '').toLowerCase().trim())
      .filter(Boolean)
  );

  let isUnique = false; // 🔘 حالة الفرادة
  let email = ''; // ✉️ البريد المولد
  let attempts = 0; // 🔢 عداد المحاولات
  
  while (!isUnique && attempts < 1000) {
    attempts++;
    // 🎲 توليد مقطع عشوائي فريد
    const randomHash = Math.random().toString(36).substring(2, 6) + Math.floor(100 + Math.random() * 900);
    email = `${prefix}.${randomHash}@sadiq.edu.iq`.toLowerCase();
    
    // 🔍 التأكد من عدم وجوده مسبقاً
    if (!existingEmails.has(email)) {
      isUnique = true;
      existingEmails.add(email);
    }
  }
  
  return email;
}

// 🔑 دالة توليد كلمة مرور عشوائية وقوية جداً
export function generateStrongPassword(existingProfiles?: UserProfile[]): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 🔠 أحرف كبيرة
  const lowers = 'abcdefghijkmnopqrstuvwxyz'; // 🔡 أحرف صغيرة
  const numbers = '23456789'; // 🔢 أرقام
  const symbols = '!@#$%&*'; // 🔣 رموز

  const allProfiles = existingProfiles && existingProfiles.length > 0
    ? existingProfiles
    : getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);

  const existingPasswords = new Set(
    allProfiles
      .map((p) => (p.temp_password || '').trim())
      .filter(Boolean)
  );

  const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];

  let isUnique = false;
  let password = '';
  let attempts = 0;

  while (!isUnique && attempts < 1000) {
    attempts++;
    // 🎲 بناء كلمة المرور بمزيج معقد (10 خانات)
    const rawPass = 
      getRandomChar(uppers) +
      getRandomChar(lowers) +
      getRandomChar(numbers) +
      getRandomChar(symbols) +
      getRandomChar(uppers) +
      getRandomChar(lowers) +
      getRandomChar(numbers) +
      getRandomChar(symbols) +
      getRandomChar(uppers) +
      getRandomChar(numbers);

    // 🔀 خلط الرمز عشوائياً
    password = rawPass.split('').sort(() => 0.5 - Math.random()).join('');

    // 🔍 التحقق من عدم التكرار
    if (!existingPasswords.has(password)) {
      isUnique = true;
      existingPasswords.add(password);
    }
  }

  return password;
}
