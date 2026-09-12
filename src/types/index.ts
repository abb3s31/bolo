// 🏛️ أنواع البيانات والواجهات البرمجية الشاملة لنظام الدرجات الجامعي (مسار بولونيا) - جامعة الإمام جعفر الصادق (ع) فرع ميسان

// 👤 أدوار المستخدمين الخمسة المعتمدة في الهيكلية الإدارية والأكاديمية
export type UserRole = 
  | 'super_admin'     // 👑 المسؤول العام عن النظام (System Administrator)
  | 'admin'           // 🛡️ أدمن النظام (مرادف للمسؤول العام)
  | 'department_head' // 🏢 رئيس القسم العلمي (Department Head)
  | 'rapporteur'      // 📝 مقرر القسم العلمي (Department Rapporteur)
  | 'teacher'         // أستاذ المادة (Faculty / Instructor)
  | 'student';        // 🎓 الطالب الأكاديمي (Student)

// 🏢 واجهة تعريف القسم العلمي وتفاصيل القيادة (رئيس ومقرر القسم)
export interface Department {
  id: string;                 // 🆔 المعرف الفريد للقسم
  name: string;               // 📝 اسم القسم باللغة العربية (مثال: هندسة تقنيات الحاسوب)
  code: string;               // 🔠 رمز القسم المختصر (مثال: CCE)
  head_id?: string;           // 👤 معرف رئيس القسم المرتبط
  head_name?: string;         // 👤 اسم رئيس القسم بالعربية
  head_email?: string;        // 📧 بريد رئيس القسم
  rapporteur_id?: string;     // 👤 معرف مقرر القسم المرتبط
  rapporteur_name?: string;   // 👤 اسم مقرر القسم بالعربية
  rapporteur_email?: string;  // 📧 بريد مقرر القسم
  created_at?: string;        // ⏰ تاريخ إنشاء القسم
  order_index?: number;       // 🔢 ترتيب القسم المخصص في القائمة
}

// 🎓 واجهة تعريف المرحلة الدراسية
export interface Stage {
  id: string;                 // 🆔 المعرف الفريد للمرحلة
  department_id: string;      // 🔗 معرف القسم التابع له
  stage_number: number;       // 🔢 رقم المرحلة من 1 إلى 4
  department_name?: string;   // 📝 اسم القسم الملحق للعرض
  name?: string;              // 🏷️ اسم المرحلة (اختياري)
  academic_year_id?: string;  // 🗓️ معرف السنة الدراسية (اختياري)
}

// 🏷️ نوع مسمى الكروب والشعبة الأكاديمية الصارم
export type StudentGroup = 'all' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | string;

// ⚙️ واجهة إعدادات كروبات وشعب المرحلة الدراسية بالقسم لرئيس ومقرر القسم
export interface StageGroupConfig {
  id: string;                         // 🆔 المعرف الفريد للإعداد (مثال: grp_dept-1_s1_morning)
  department_id: string;              // 🏢 معرف القسم التابع له
  stage_number: number;               // 🎓 رقم المرحلة (1 - 6)
  study_type: 'morning' | 'evening';  // ☀️🌙 نوع الدوام (صباحي / مسائي)
  has_groups: boolean;                // ⚙️ هل المرحلة مقسمة إلى كروبات؟
  group_count: number;                // 🔢 عدد الكروبات (0، 2، 3، 4، أو مخصص)
  groups: string[];                   // 📋 قائمة أسماء الكروبات المفعلة (مثال: ['A', 'B', 'C', 'D'])
  group_names?: string[];             // 🏷️ مسمى بديل متوافق لقائمة أسماء الكروبات
  default_group?: string;             // 🏷️ الكروب الافتراضي إن وجد
  updated_at?: string;                // ⏰ تاريخ آخر تحديث
}

// 🗓️ واجهة تعريف السنة الدراسية
export interface AcademicYear {
  id: string;                 // 🆔 معرف السنة
  label: string;              // 📝 اسم السنة (مثال: 2026-2027)
  is_current: boolean;        // ⚡ هل هي السنة الدراسية الفعلية الحالية؟
}

// 🔠 نوع المادة الأكاديمية (نظري فقط أو نظري وعملي)
export type CourseType = 'theory_only' | 'theory_and_practical';

// 🎛️ تكوين بند التقييم الفردي ثنائي اللغة والوزن
export interface AssessmentItemConfig {
  title_ar: string;           // 📝 العنوان بالعربية (مثال: كويز 1 أو امتحان المختبر)
  title_en: string;           // 🔤 العنوان بالإنكليزية (مثال: Quiz 1 أو Lab Exam)
  max_score: number;          // 💯 الدرجة العظمى المخصصة للبند
  type: 'theory' | 'practical'; // 🏷️ نوع البند (نظري أو عملي)
  is_enabled?: boolean;       // 🔘 هل البند مفتوح ومفعّل أم مغلق ومحجوب تماماً؟
}

// 🎛️ المخطط التقييمي الشامل للمادة لبنود بولونيا الـ 7 والامتحان النهائي
export interface AssessmentScheme {
  quiz1: AssessmentItemConfig;
  quiz2: AssessmentItemConfig;
  assignment1: AssessmentItemConfig;
  assignment2: AssessmentItemConfig;
  report: AssessmentItemConfig;
  midterm: AssessmentItemConfig;
  practical: AssessmentItemConfig;
  final_exam: AssessmentItemConfig;
}

// 📘 واجهة تعريف المادة الدراسية (الكورس الأول أو الثاني)
export interface Course {
  id: string;                 // 🆔 معرف المادة الفريد
  stage_id: string;           // 🔗 معرف المرحلة الدراسية
  academic_year_id: string;   // 🔗 معرف السنة الدراسية
  department_id?: string;     // 🏢 معرف القسم التابع له المادة
  name: string;               // 📝 اسم المادة (مثال: البرمجة الهيكلية)
  code: string;               // 🔢 رمز المادة الكودي (مثال: CS201)
  credit_hours: number;       // ⏳ عدد الساعات المعتمدة (ECTS Credits)
  semester?: 1 | 2;           // 🗓️ الكورس الدراسي (1: الكورس الأول, 2: الكورس الثاني)
  stage_number?: number;      // 🔢 رقم المرحلة للعرض
  department_name?: string;   // 🏢 اسم القسم للعرض
  course_type?: CourseType;   // 🏷️ نوع المادة: 'theory_only' (نظري فقط) أو 'theory_and_practical' (نظري وعملي)
  has_practical?: boolean;    // 🔬 هل المادة تحتوي على مختبر وجانب عملي؟
  
  // 👨‍🏫 أساتذة المادة المكلفون
  theory_teacher_id?: string;     // 👤 معرف أستاذ النظري المكلف
  theory_teacher_name?: string;   // 👤 اسم أستاذ النظري
  practical_teacher_id?: string;  // 🔬 معرف أستاذ العملي المكلف
  practical_teacher_name?: string;// 🔬 اسم أستاذ العملي
  teacher_id?: string;            // 🔗 معرف الأستاذ الأساسي للمادة (للتوافق السحابي)
  teacher_name?: string;          // 👤 اسم الأستاذ الأساسي للمادة (للتوافق السحابي)
  
  // 🎛️ توزيع الدرجات والعناوين المخصصة للمادة
  assessment_scheme?: AssessmentScheme;

  // 🔄 حالة ومفتاح تفعيل فترة رصد درجات الدور الثاني (الإكمال)
  is_supplementary_exam_enabled?: boolean; // هل فترة رصد درجات الدور الثاني مفتوحة ومفعلة من رئاسة القسم؟
  supplementary_exam_opened_at?: string;   // تاريخ وتوقيت فتح وتفعيل الدور الثاني
  supplementary_exam_opened_by?: string;   // اسم من قام بفتح الدور الثاني (رئيس القسم أو المقرر)

  // 🎯 حالة ومفتاح تفعيل وعرض درجات الامتحان النهائي الدور الأول
  is_final_exam_enabled?: boolean;         // هل فترة رصد وعرض درجات الفاينل للدور الأول مفعلة من رئاسة القسم أو المقرر؟
  final_exam_opened_at?: string;           // وكت وتاريخ فتح وتفعيل الامتحان النهائي للدور الأول
  final_exam_opened_by?: string;           // اسم الشخص اللي فتح الفاينل (رئيس القسم لو المقرر)

  created_at?: string;        // ⏰ تاريخ الإنشاء
  order_index?: number;       // 🔢 ترتيب المادة المخصص في القائمة
}

// 👑 واجهة تعريف سجل المسؤول العام في جدول super_admins
export interface SuperAdminRecord {
  id: string;                 // 🆔 معرف المسؤول العام
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication (auth.users)
  full_name: string;          // 👤 الاسم الكامل للمسؤول العام
  email: string;              // 📧 البريد الإلكتروني المعتمد للمصادقة
  phone?: string;             // 📱 رقم الهاتف
  temp_password?: string;     // 🔑 كلمة المرور المشفرة أو المؤقتة
  created_at?: string;        // ⏰ تاريخ الإنشاء
}


// 🏢 واجهة تعريف سجل رئيس القسم في جدول department_heads
export interface DepartmentHeadRecord {
  id: string;                 // 🆔 معرف رئيس القسم
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication
  department_id: string;      // 🏢 معرف القسم التابع له
  department_name?: string;   // 🏢 اسم القسم للعرض
  full_name: string;          // 👤 الاسم الكامل واللقب الأكاديمي
  academic_title?: string;    // 🎓 اللقب العلمي (أ.د. / أ.م.د. / م.د.)
  email: string;              // 📧 البريد الأكاديمي المعتمد
  gender?: 'male' | 'female'; // 🚻 جنس رئيس القسم (ذكر / أنثى)
  phone?: string;             // 📱 رقم الهاتف
  temp_password?: string;     // 🔑 كلمة المرور
  is_active: boolean;         // 🟢 حالة الحساب
  created_at?: string;        // ⏰ تاريخ الإنشاء
}

// 📝 واجهة تعريف سجل مقرر القسم في جدول department_rapporteurs
export interface DepartmentRapporteurRecord {
  id: string;                 // 🆔 معرف مقرر القسم
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication
  department_id: string;      // 🏢 معرف القسم التابع له
  department_name?: string;   // 🏢 اسم القسم للعرض
  full_name: string;          // 👤 الاسم الكامل واللقب الأكاديمي
  academic_title?: string;    // 🎓 اللقب العلمي
  email: string;              // 📧 البريد الأكاديمي المعتمد
  gender?: 'male' | 'female'; // 🚻 جنس مقرر القسم (ذكر / أنثى)
  phone?: string;             // 📱 رقم الهاتف
  temp_password?: string;     // 🔑 كلمة المرور
  is_active: boolean;         // 🟢 حالة الحساب
  created_at?: string;        // ⏰ تاريخ الإنشاء
}

// 👨‍🏫 واجهة تعريف سجل الأستاذ في جدول teachers
export interface TeacherRecord {
  id: string;                 // 🆔 معرف الأستاذ
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication
  department_id: string;      // 🏢 معرف القسم التابع له
  department_name?: string;   // 🏢 اسم القسم للعرض
  full_name: string;          // 👤 الاسم الكامل واللقب الأكاديمي
  academic_title?: string;    // 🎓 اللقب العلمي
  specialization?: string;    // 🔬 التخصص الدقيق
  email: string;              // 📧 البريد الأكاديمي المعتمد
  gender?: 'male' | 'female'; // 🚻 جنس الأستاذ (ذكر / أنثى)
  phone?: string;             // 📱 رقم الهاتف
  temp_password?: string;     // 🔑 كلمة المرور
  is_active: boolean;         // 🟢 حالة الحساب
  created_at?: string;        // ⏰ تاريخ الإنشاء
}

// 🎓 واجهة تعريف سجل الطالب في جدول students
export interface StudentRecord {
  id: string;                 // 🆔 معرف الطالب
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication
  department_id: string;      // 🏢 معرف القسم التابع له
  department_name?: string;   // 🏢 اسم القسم للعرض
  stage_id: string;           // 🎓 معرف المرحلة
  stage_number: number;       // 🎓 رقم المرحلة (1 - 4)
  full_name: string;          // 👤 الاسم الثلاثي للطالب
  university_number: string;  // 🆔 الرقم الجامعي المعتمد
  email: string;              // 📧 البريد الأكاديمي المعتمد
  study_type?: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  gender?: 'male' | 'female'; // 🚻 جنس الطالب (ذكر / أنثى)
  phone?: string;             // 📱 رقم الهاتف
  temp_password?: string;     // 🔑 كلمة المرور
  is_active: boolean;         // 🟢 حالة الحساب
  is_graduated?: boolean;     // 🎓 هل تخرج الطالب؟
  graduation_status?: string; // 📜 وصف حالة التخرج
  student_group?: string;     // 🏷️ كروب الطالب الأكاديمي (A, B, C, D أو فارغ للشعبة العامة)
  subgroup?: string;          // 🔬 كروب المختبر المصغر (A1, A2...)
  created_at?: string;        // ⏰ تاريخ الإنشاء
}

// 👤 واجهة تعريف ملف المستخدم الموحد الشامل (Unified User Profile) لجميع الأدوار
export interface UserProfile {
  id: string;                 // 🆔 معرف المستخدم الفريد
  auth_user_id?: string;      // 🔐 معرف الحساب في Supabase Authentication (auth.users)
  full_name: string;          // 👤 الاسم الثلاثي أو اللقب الأكاديمي
  role: UserRole;             // 🎭 دور المستخدم في المنظومة
  department_id?: string;     // 🏢 القسم المرتبط به (للرؤساء والمقررين والأساتذة والطلاب)
  department_name?: string;   // 🏢 اسم القسم السريع للعرض
  stage_id?: string;          // 🎓 معرف المرحلة (للطالب فقط)
  stage_number?: number;      // 🎓 رقم المرحلة 1-4 (للطالب فقط)
  university_number: string;  // 🆔 الرقم الجامعي أو الكود الوظيفي
  generated_email: string;    // 📧 البريد الأكاديمي الرسمي المعتمد
  temp_password?: string;     // 🔑 رمز الدخول الأكاديمي (كلمة المرور)
  study_type?: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  gender?: 'male' | 'female'; // 🚻 جنس المستخدم (ذكر / أنثى) لإحصائيات الطلبة والجامعة
  is_active: boolean;         // 🟢 حالة الحساب (نشط أو معطل)
  must_change_password?: boolean; // 🔒 إجبار تغيير كلمة المرور
  is_graduated?: boolean;     // 🎓 هل تخرج الطالب بنجاح؟
  graduation_status?: string; // 📜 نص حالة التخرج (مثال: خريج مؤهل بنجاح)
  student_group?: string;     // 🏷️ كروب الطالب المعتمد (للطالب فقط)
  subgroup?: string;          // 🔬 كروب المختبر المصغر (للطالب فقط)
  scientific_title?: string;  // 🎖️ اللقب العلمي للتدريسي (أستاذ، أستاذ مساعد، مدرس، مدرس مساعد)
  created_at?: string;        // ⏰ تاريخ إنشاء الحساب
  order_index?: number;       // 🔢 ترتيب الحساب المخصص في القائمة
}

// 🔗 واجهة ربط وتكليف الأستاذ بالمواد الدراسية
export interface TeacherCourse {
  id: string;                 // 🆔 معرف سجل التكليف
  teacher_id: string;         // 🔗 معرف الأستاذ المكلف
  teacher_name?: string;      // 👤 اسم الأستاذ للعرض السريع
  course_id: string;          // 🔗 معرف المادة الدراسية
  course_name?: string;       // 📝 اسم المادة بالعربية
  department_id?: string;     // 🏢 معرف القسم
  role_in_course?: 'theory' | 'practical' | 'both'; // 🏷️ صفة التدريس في المادة
  semester?: 1 | 2;           // 🗓️ الكورس الدراسي (1 أو 2)
  created_at?: string;        // ⏰ تاريخ التكليف
}

// 📊 واجهة سجل درجات البنود الـ 7 للسعي النهائي بمسار بولونيا
export interface Grade {
  id: string;                 // 🆔 معرف سجل الدرجة
  student_id: string;         // 🎓 معرف الطالب
  student_name: string;       // 👤 اسم الطالب الثلاثي
  university_number: string;  // 🆔 الرقم الجامعي
  course_id: string;          // 📘 معرف المادة الدراسية
  course_name: string;        // 📝 اسم المادة
  teacher_id: string;         //  معرف الأستاذ المسؤول الأساسي
  department_id?: string;     // 🏢 معرف القسم
  academic_year_id: string;   // 🗓️ معرف السنة الدراسية
  semester?: 1 | 2;           // 🗓️ الكورس الدراسي (1 أو 2)

  // 📝 البنود الـ 7 المعتمدة بمسار بولونيا للسعي الفصلي (من 50)
  quiz1: number;              // 📝 كويز 1
  quiz2: number;              // 📝 كويز 2
  assignment1: number;        // 📑 واجب 1
  assignment2: number;        // 📑 واجب 2
  report: number;             // 📄 تقرير ومشاريع
  midterm: number;            // 🎯 امتحان منتصف الفصل
  practical: number;          // 🔬 التقييم العملي والنشاط
  final_coursework_total: number; // 💯 مجموع السعي الفصلي (من 50)
  final_exam: number;         // 📝 الامتحان النهائي (من 50)
  supplementary_exam?: number | null; // 🔄 امتحان الدور الثاني (إن وجد)
  
  is_locked: boolean;         // 🔒 هل السعي مقفول ومعتمد رسمياً؟
  updated_at: string;         // ⏰ تاريخ آخر تعديل عام

  // 🕒 تتبع التعديل المنفصل للنظري والعملي
  theory_updated_by?: string;   // 👤 اسم من عدل درجات النظري
  theory_updated_at?: string;   // ⏰ توقيت آخر تعديل لدرجات النظري
  practical_updated_by?: string;// 🔬 اسم من عدل درجات العملي
  practical_updated_at?: string;// ⏰ توقيت آخر تعديل لدرجات العملي
  
  final_total?: number;       // 💯 المجموع الكلي النهائي من 100
  letter_grade?: string;      // 🅰️ التقدير الحرفي المعتمد (A, B, C, D, E, F)
}

// 📜 واجهة سجل الحماية والتدقيق الأمني Security Audit Log
export interface AuditLog {
  id: string;                 // 🆔 معرف السجل الفريد
  user_id?: string;           // 👤 معرف منفذ العملية
  user_name?: string;         // 👤 اسم منفذ العملية
  user_role?: UserRole;       // 🎭 دور المنفذ
  actor_id?: string;          // 👤 معرف منفذ العملية المرادف
  actor_name?: string;        // 👤 اسم منفذ العملية المرادف
  actor_role?: UserRole;      // 🎭 دور المنفذ المرادف
  student_id?: string;        // 🎓 معرف الطالب المعني
  student_name?: string;      // 🎓 اسم الطالب المعني
  course_id?: string;         // 📘 معرف المادة المعنية
  course_name?: string;       // 📘 اسم المادة المعنية
  field_name?: string;        // 📝 البند المعدل
  old_value?: string | number | boolean | null; // ⏪ القيمة السابقة
  new_value?: string | number | boolean | null; // ⏩ القيمة الجديدة
  action: string;             // ⚡ نوع العملية (إضافة، تعديل، حذف، قفل درجات)
  details: string;            // 📜 تفاصيل التغيير الإيضاحية
  created_at: string;         // ⏰ توقيت العملية
}

// 🔔 أنواع وأشكال الإشعارات التفاعلية في المنظومة
export type NotificationType = 
  | 'grade_updated'          // 📝 تم تحديث أو رصد درجات جديدة
  | 'course_assigned'        //  تم تكليف الأستاذ بمادة جديدة
  | 'grades_locked'          // 🔒 تم اعتماد وقفل السعي الفصلي
  | 'transcript_verified'    // 🔲 تم التحقق من وثيقة الطالب عبر QR
  | 'schedule_updated'       // 🗓️ تم تحديث أو إضافة موعد في جدول المحاضرات الأسبوعي
  | 'system_announcement'    // 📢 تنبيه عام من المسؤول أو رئيس القسم
  | 'tuition_notice'         // 💳 تبليغ تسديد قسط دراسي
  | 'absence_warning'        // ⚠️ إنذار غياب أكاديمي
  | 'task_deadline_alert'    // ⏰ إنذار وتذكير بتسليم الواجبات والتقارير
  | 'official_announcement'; // 📢 تعميم أو عطلة رسمية

// 🔔 واجهة الإشعار التفاعلي الحصين
export interface AppNotification {
  id: string;                 // 🆔 معرف الإشعار
  recipient_id: string;       // 👤 معرف المستلم ('all' أو معرف حساب محدد)
  recipient_role?: UserRole | 'all'; // 🎭 الدور المستهدف
  title: string;              // 📌 عنوان التنبيه
  message: string;            // 💬 نص الإشعار التفصيلي
  type: NotificationType;     // 🏷️ نوع الإشعار
  is_read: boolean;           // 👁️ هل تم قراءة الإشعار؟
  created_at: string;         // ⏰ توقيت الإرسال
  link?: string;              // 🔗 رابط الانتقال السريع
}

// 📈 واجهة بيانات التحليلات والإحصائيات البيانية للقسم والكلية
export interface DepartmentAnalyticsSummary {
  totalStudents: number;      // 🎓 إجمالي الطلاب
  totalTeachers: number;      //  إجمالي الأساتذة
  totalCourses: number;       // 📘 إجمالي المواد
  averageCourseworkScore: number; // 📊 متوسط السعي العام للقسم (من 50)
  passRatePercentage: number; // 🟢 نسبة النجاح العامة (%)
  atRiskCount: number;        // ⚠️ عدد الطلاب المهددين بالرسوب (سعي أقل من 25)
  gradeDistribution: {        // 📊 توزيع التقديرات الحرفية
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
  };
}

// 🎓 واجهة إحصائية توزيع طلبة المرحلة الدراسية الواحدة (ذكور وإناث ومجموع وصباحي ومسائي)
export interface StageStudentDemographics {
  stage_number: number;       // 🔢 رقم المرحلة من 1 إلى 4
  stage_name: string;         // 📝 اسم المرحلة بالعربي (الأولى، الثانية...)
  total_students: number;     // 🎓 العدد الكلي لطلبة هاي المرحلة
  male_count: number;         // 👨 عدد الطلاب الذكور بالمرحلة
  female_count: number;       // 👩 عدد الطالبات الإناث بالمرحلة
  morning_count: number;      // ☀️ عدد طلاب الدراسة الصباحية بالمرحلة
  evening_count: number;      // 🌙 عدد طلاب الدراسة المسائية بالمرحلة
  male_percentage: number;    // 📊 نسبة الذكور المئوية بالمرحلة
  female_percentage: number;  // 📊 نسبة الإناث المئوية بالمرحلة
  morning_percentage: number; // 📊 نسبة طلبة الصباحي المئوية بالمرحلة
  evening_percentage: number; // 📊 نسبة طلبة المسائي المئوية بالمرحلة
}

// 🏢 واجهة إحصائية توزيع طلبة القسم العلمي لكافة المراحل الأربعة مع التفصيل
export interface DepartmentStudentDemographics {
  department_id: string;      // 🆔 معرف القسم الفريد
  department_name: string;    // 📝 اسم القسم بالعربي
  department_code: string;    // 🔠 كود القسم المختصر
  total_students: number;     // 🎓 إجمالي طلاب القسم بكل مراحله
  male_count: number;         // 👨 إجمالي الذكور بالقسم
  female_count: number;       // 👩 إجمالي الإناث بالقسم
  morning_count: number;      // ☀️ إجمالي طلبة الصباحي بالقسم
  evening_count: number;      // 🌙 إجمالي طلبة المسائي بالقسم
  male_percentage: number;    // 📊 نسبة الذكور بالقسم
  female_percentage: number;  // 📊 نسبة الإناث بالقسم
  morning_percentage: number; // 📊 نسبة طلبة الصباحي بالقسم
  evening_percentage: number; // 📊 نسبة طلبة المسائي بالقسم
  stages: Record<number, StageStudentDemographics>; // 📚 تفصيل المراحل الأربعة بالقسم (1 إلى 4)
}

// 🏛️ واجهة الملخص الإحصائي الكلي للكلية والمسؤول العام
export interface CollegeStudentDemographics {
  total_students: number;     // 🎓 إجمالي عدد الطلاب الكلي بالجامعة
  total_males: number;        // 👨 إجمالي عدد الطلاب الذكور بكل الجامعة
  total_females: number;      // 👩 إجمالي عدد الطالبات الإناث بكل الجامعة
  total_morning: number;      // ☀️ إجمالي عدد طلبة الدراسة الصباحية بالجامعة
  total_evening: number;      // 🌙 إجمالي عدد طلبة الدراسة المسائية بالجامعة
  male_percentage: number;    // 📊 نسبة الذكور الكلية بالجامعة
  female_percentage: number;  // 📊 نسبة الإناث الكلية بالجامعة
  morning_percentage: number; // 📊 نسبة طلبة الصباحي الكلية بالجامعة
  evening_percentage: number; // 📊 نسبة طلبة المسائي الكلية بالجامعة
  departments_count: number;  // 🏢 عدد الأقسام المعتمدة في الجامعة
  departments: DepartmentStudentDemographics[]; // 📋 تفاصيل كل قسم
  stages_summary: Record<number, StageStudentDemographics>; // 📈 تفاصيل المراحل الأربعة على مستوى الجامعة كلها
}

// 🏢 واجهة الإحصائيات الديموغرافية للتدريسيين بكل قسم علمي
export interface DepartmentTeacherDemographics {
  department_id: string;      // 🆔 معرف القسم العلمي
  department_name: string;    // 📝 اسم القسم بالعربي
  department_code: string;    // 🔠 رمز القسم المختصر
  total_teachers: number;     //  إجمالي عدد الأساتذة بالقسم
  male_count: number;         //  عدد الأساتذة الذكور
  female_count: number;       //  عدد الأستاذات الإناث
  male_percentage: number;    // 📊 نسبة التدريسيين الذكور
  female_percentage: number;  // 📊 نسبة التدريسيات الإناث
  teachers: UserProfile[];    // 📋 قائمة ملفات الأساتذة التابعين للقسم
}

// 🏛️ واجهة الملخص الإحصائي الشامل للتدريسيين على مستوى الكلية كلها
export interface CollegeTeacherDemographics {
  total_teachers: number;     //  إجمالي عدد الكادر التدريسي الكلي
  total_males: number;        //  إجمالي عدد التدريسيين الذكور بكل الأقسام
  total_females: number;      //  إجمالي عدد التدريسيات الإناث بكل الأقسام
  male_percentage: number;    // 📊 نسبة الذكور الكلية من الكادر التدريسي
  female_percentage: number;  // 📊 نسبة الإناث الكلية من الكادر التدريسي
  departments_count: number;  // 🏢 عدد الأقسام المعتمدة في الجامعة
  departments: DepartmentTeacherDemographics[]; // 📋 تفاصيل كل قسم ومدرّسيه
}



// 🗓️ أيام الأسبوع المعتمدة بالجدول الأكاديمي
export type DayOfWeek = 
  | 'saturday'   // ☀️ السبت
  | 'sunday'     // ☀️ الأحد
  | 'monday'     // ☀️ الاثنين
  | 'tuesday'    // ☀️ الثلاثاء
  | 'wednesday'  // ☀️ الأربعاء
  | 'thursday'   // 🌙 الخميس
  | 'friday';    // 🌙 الجمعة

// 🎨 ألوان تمييز المحاضرات بالجدول الأسبوعي والـ Timeline
export type LectureColor = 
  | 'blue'       // 🔵 أزرق
  | 'indigo'     // 🟣 نيلي
  | 'purple'     // 🟪 بنفسجي
  | 'emerald'    // 🟢 زمردي
  | 'amber'      // 🟡 كهرماني
  | 'rose'       // 🌹 وردي
  | 'teal'       // 🌊 تركوازي
  | 'cyan';      // 💎 سماوي

// 🏷️ نوع المحاضرة بالجدول الأكاديمي
export type LectureType = 
  | 'theory'     // 📘 نظري
  | 'practical'  // 🔬 عملي ومختبر
  | 'tutorial';  // 📝 مناقشة وتطبيقات

// 🕒 واجهة المحاضرة في الجدول الأسبوعي
export interface ScheduleLecture {
  id: string;                 // 🆔 معرف المحاضرة الفريد
  department_id: string;      // 🏢 معرف القسم
  stage_number: number;       // 🎓 رقم المرحلة (1، 2، 3، 4)
  semester: 1 | 2;            // 🗓️ الكورس الدراسي (1 أو 2)
  academic_year_id?: string;  // 🗓️ معرف العام الدراسي
  day: DayOfWeek;             // 📅 اليوم المحدد
  course_id: string;          // 📘 معرف المادة الدراسية
  course_name: string;        // 📝 اسم المادة
  course_code: string;        // 🏷️ رمز المادة (CS201)
  teacher_id?: string;        //  معرف الأستاذ المحاضر
  teacher_name?: string;      // 👤 اسم الأستاذ المحاضر
  room: string;               // 🚪 القاعة الدراسية أو المختبر
  start_time: string;         // ⏰ وقت البدء بنظام 24 ساعة (مثال: '08:30')
  end_time: string;           // ⏰ وقت الانتهاء (مثال: '10:30')
  color: LectureColor;        // 🎨 لون المحاضرة
  type: LectureType;          // 🏷️ طبيعة المحاضرة (نظري / عملي / مناقشة)
  study_type?: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  target_group?: string;      // 🏷️ الكروب المستهدف بالمحاضرة ('all' لكافة الشعب أو 'A', 'B' لكروب محدد)
  date?: string;              // 📅 تاريخ المحاضرة التقويمي الفعلي أو المرجعي للأسبوع الأول (YYYY-MM-DD)
  active_weeks?: number[];    // 🔢 قائمة أرقام الأسابيع المحددة التي تقام فيها هذه المحاضرة (من 1 إلى 15)
  week_number?: number;       // 🔢 رقم الأسبوع الدراسي المعتمد (من 1 إلى 15) وفق نظام بولونيا
  custom_weekly_dates?: Record<number, string>; // 📆 التواريخ التقويمية المحسوبة لكافة الأسابيع الـ 15 بالتسلسل
  weekly_overrides?: Record<number, { day?: DayOfWeek; date?: string; start_time?: string; end_time?: string; room?: string; teacher_id?: string; teacher_name?: string; is_cancelled?: boolean }>; // ⚙️ تعديلات واستثناءات الأسابيع المنفصلة أو المنقولة أو الملغاة
  notes?: string;             // 💡 ملاحظات وتنبيهات للطلاب
  created_at?: string;        // ⏰ تاريخ إنشاء المحاضرة
  updated_at?: string;        // ⏰ تاريخ آخر تعديل
}

// ⚙️ واجهة إعدادات الدوام والعطل الأسبوعية للقسم والمرحلة
export interface DepartmentScheduleConfig {
  id: string;                 // 🆔 معرف الإعداد
  department_id: string;      // 🏢 معرف القسم
  stage_number: number;       // 🎓 رقم المرحلة
  semester: 1 | 2;            // 🗓️ الكورس الدراسي
  study_type?: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  target_group?: string;      // 👥 الكروب المستهدف (مثلاً A أو B أو C أو D أو عام للمرحلة)
  working_days: DayOfWeek[];  // 💼 أيام الدوام الرسمي (الافتراضي: السبت إلى الأربعاء)
  off_days: DayOfWeek[];      // 🏖️ أيام العطل الرسمية (الافتراضي: الخميس والجمعة)
  start_date?: string;        // 📅 تاريخ انطلاق الفصل الدراسي المعتمد للأسبوع الأول (YYYY-MM-DD)
  academic_year?: string;     // 🎓 العام الدراسي المعتمد للسجل (مثلاً 2026-2027)
  updated_at?: string;        // ⏰ تاريخ آخر تحديث
}

// 🏖️ واجهة العطلة الرسمية المعلنة من رئاسة ومقررية القسم لتعطيل الدوام
export interface DepartmentOfficialHoliday {
  id: string;                         // 🆔 معرف العطلة الفريد
  department_id: string;              // 🏢 معرف القسم التابع له العطلة
  date: string;                       // 📅 تاريخ يوم العطلة بتنسيق 'YYYY-MM-DD'
  title: string;                      // 📝 عنوان العطلة الرسمية ومناسبتها
  target_stage: number | null;        // 🎓 المرحلة المشمولة بالعطلة (null يعني لكافة المراحل)
  notes?: string;                     // 💡 ملاحظات وتفاصيل الأمر الإداري بالتعطيل
  created_by_name: string;            // 👤 اسم المسؤول المعلن للعطلة (رئيس القسم أو المقرر)
  created_by_role: string;            // 🏢 صفة المسؤول الوظيفية والأكاديمية
  created_at: string;                 // ⏰ تاريخ ووقت إنشاء وتسجيل العطلة
}

// 📅 واجهة توقيت وجدولة المحاضرة المعتمدة أسبوعياً من رئاسة ومقررية القسم
export interface CourseWeeklySessionSchedule {
  course_id: string;              // 🆔 معرف المادة الدراسية
  week_number: number;            // 🔢 رقم الأسبوع (1 إلى 15)
  lecture_slot: number;           // 🕒 رقم المحاضرة في الأسبوع (1 أو 2)
  lecture_type: LectureType;      // 🏷️ نوع المحاضرة (نظري / عملي)
  date: string;                   // 📅 تاريخ المحاضرة التقويمي (YYYY-MM-DD)
  day: DayOfWeek;                 // 🗓️ اليوم (السبت، الأحد، ...)
  start_time: string;             // ⏰ وقت البدء (08:30)
  end_time: string;               // ⏰ وقت الانتهاء (10:00)
  duration_hours: number;         // ⏳ مدة المحاضرة بالساعات
  approved_by_name?: string;      // 👤 اسم رئيس القسم أو المقرر المعتمد
  approved_by_role?: string;      // 🏢 صفته الوظيفية
  updated_at?: string;            // ⏰ وقت الاعتماد الأخير
}

// 🟢 حالات الحضور والغياب والإجازات المعتمدة في مسار بولونيا
export type AttendanceStatus = 
  | 'present'           // 🟢 حاضر (Present)
  | 'absent_unexcused'  // 🔴 غائب بدون عذر (Unexcused Absence)
  | 'absent_excused'    // 🟡 مجاز بعذر رسمي أو طبي (Excused Leave)
  | 'holiday'           // 🏖️ عطلة رسمية (Official Holiday)
  | 'late'              // ⏱️ متأخر عن المحاضرة (Late Arrival)
  | 'unset';            // ⚪ غير محدد بعد (Pending / Unset)

// ⚠️ حالات الإنذار الأكاديمي للغياب وفق ضوابط مسار بولونيا (5% / 7% / 10%)
export type AttendanceWarningStatus = 
  | 'safe'        // 🟢 آمن - نسبة الغياب أقل من 5%
  | 'warning_1'   // 🟡 إنذار أولي - نسبة الغياب بين 5% و 6.99%
  | 'warning_2'   // 🟠 إنذار نهائي - نسبة الغياب بين 7% و 9.99%
  | 'banned';     // 🔴 حرمان من الامتحان - تجاوزت نسبة الغياب 10%

// 📋 واجهة سجل الحضور والغياب للمحاضرة الفردية
export interface StudentAttendanceRecord {
  id: string;                      // 🆔 معرف السجل الفريد
  student_id: string;              // 🎓 معرف الطالب
  student_name: string;            // 👤 اسم الطالب الرباعي
  university_number: string;       // 🔢 الرقم الجامعي للطالب
  course_id: string;               // 📘 معرف المادة الدراسية
  course_name: string;             // 📝 اسم المادة
  course_code: string;             // 🏷️ رمز المادة
  department_id: string;           // 🏢 معرف القسم
  stage_number: number;            // 🎓 رقم المرحلة (1-4)
  student_group?: string;          // 🏷️ كروب الطالب وقت تسجيل الحضور ('A', 'B'...)
  semester: 1 | 2;                 // 🗓️ الكورس الدراسي
  academic_year_id: string;        // 📅 العام الدراسي (مثال: '2026-2027')
  week_number: number;             // 🔢 رقم الأسبوع الدراسي (من 1 إلى 15)
  lecture_slot?: 1 | 2;            // 🎯 رقم المحاضرة في اليوم أو الأسبوع (1: الأولى, 2: الثانية)
  lecture_id?: string;             // 🕒 معرف المحاضرة المجدولة
  lecture_type: LectureType;       // 🏷️ نوع المحاضرة (نظري / عملي / مناقشة)
  day: DayOfWeek;                  // 📅 اليوم
  date: string;                    // 📆 التاريخ الفعلي بنسق 'YYYY-MM-DD'
  start_time: string;              // ⏰ ساعة البدء ('08:30')
  end_time: string;                // ⏰ ساعة الانتهاء ('10:30')
  duration_hours: number;          // ⏳ مدة المحاضرة بالساعات الفعلية
  status: AttendanceStatus;        // 🚦 حالة الحضور
  excuse_reason?: string;          // 📝 تفاصيل العذر أو الإجازة الرسمية
  excuse_document_ref?: string;    // 📄 رقم وتاريخ كتاب الإجازة أو التقرير الطبي
  late_minutes?: number;           // ⏱️ دقائق التأخير إن وجدت
  recorded_by_teacher_id: string;  //  معرف الأستاذ المسجل للحضور
  recorded_by_teacher_name: string;// 👤 اسم الأستاذ المسجل
  notes?: string;                  // 💡 ملاحظات وتوجيهات
  created_at: string;              // ⏰ تاريخ ووقت إنشاء السجل
  updated_at?: string;             // ⏰ تاريخ ووقت آخر تعديل
}

// 📊 واجهة الملخص الإحصائي لغياب الطالب في مادة معينة
export interface StudentCourseAttendanceSummary {
  course_id: string;               // 📘 معرف المادة
  course_name: string;             // 📝 اسم المادة
  course_code: string;             // 🏷️ رمز المادة
  total_lectures_count: number;    // 🔢 إجمالي المحاضرات المسجلة
  present_count: number;           // 🟢 عدد مرات الحضور
  absent_unexcused_count: number;  // 🔴 عدد مرات الغياب بدون عذر
  absent_excused_count: number;    // 🟡 عدد مرات الإجازة الرسمية
  holiday_count: number;           // 🏖️ عدد أيام العطل
  late_count: number;              // ⏱️ عدد مرات التأخير
  total_scheduled_hours: number;   // ⏳ إجمالي ساعات المادة المعتمدة
  total_unexcused_absence_hours: number; // 🔴 ساعات الغياب غير المبرر
  total_excused_absence_hours: number;   // 🟡 ساعات الإجازات الرسمية
  total_holiday_hours?: number;          // 🏖️ إجمالي ساعات العطل الرسمية المحتسبة للمادة
  total_absence_hours: number;     // ⌛ إجمالي ساعات الغياب الكلية
  absence_percentage: number;      // 📊 نسبة الغياب غير المبرر (%)
  total_absence_percentage: number;// 📊 نسبة الغياب الكلية بما فيها الإجازات (%)
  warning_status: AttendanceWarningStatus; // ⚠️ حالة الإنذار الأكاديمي
  attendance_rate_percentage: number; // 🟢 نسبة الحضور الفعلية (%)

  theory_scheduled_hours?: number;   // ⏳ إجمالي ساعات النظري المقررة
  theory_absence_hours?: number;     // 🔴 ساعات غياب النظري
  theory_present_hours?: number;     // 🟢 ساعات حضور النظري
  practical_scheduled_hours?: number;// ⏳ إجمالي ساعات العملي المقررة
  practical_absence_hours?: number;  // 🔴 ساعات غياب العملي
  practical_present_hours?: number;  // 🟢 ساعات حضور العملي
  total_present_hours?: number;      // 🟢 إجمالي ساعات الحضور الكلية
}

// 🏥 نوع سبب الإجازة أو العذر الرسمي
export type ExcuseReasonType = 'medical' | 'official_duty' | 'family_emergency' | 'bereavement' | 'other';

// 🚦 حالة معالجة طلب الإجازة الرسمية
export type ExcuseStatus = 'pending' | 'approved' | 'rejected';

// 📑 واجهة طلب الإجازة والعذر الرسمي المقدم من الطالب
export interface AttendanceExcuseRequest {
  id: string;                      // 🆔 معرف الطلب الفريد
  student_id: string;              // 🎓 معرف الطالب
  student_name: string;            // 👤 اسم الطالب
  university_number: string;       // 🔢 الرقم الجامعي
  department_id: string;           // 🏢 معرف القسم
  stage_number: number;            // 🎓 رقم المرحلة
  course_id: string;               // 📘 معرف المادة المعنية
  course_name: string;             // 📝 اسم المادة
  course_code: string;             // 🏷️ رمز المادة
  week_number: number;             // 🔢 رقم الأسبوع (1-15)
  date: string;                    // 📆 تاريخ المحاضرة
  reason_type: ExcuseReasonType;   // 🏥 تصنيف سبب الإجازة
  reason_details: string;          // 📜 تفاصيل وشرح العذر
  document_reference: string;      // 📄 رقم وتاريخ التقرير الطبي أو الكتاب الرسمي
  status: ExcuseStatus;            // 🚦 موقف الطلب (قيد المراجعة / مقبول / مرفوض)
  reviewed_by_id?: string;         // 👤 معرف الأستاذ أو رئيس القسم المراجع
  reviewed_by_name?: string;       // 👤 اسم المراجع
  review_notes?: string;           // 💡 ملاحظات المراجعة
  created_at: string;              // ⏰ تاريخ تقديم الطلب
  reviewed_at?: string;            // ⏰ تاريخ ووقت اتخاذ القرار
}

// 🚦 حالة مصادقة واعتماد جدول الامتحانات النهائية
export type ExamScheduleStatus = 
  | 'draft'              // 📝 مسودة غير مرسلة (قيد الإعداد من القسم)
  | 'pending_approval'   // ⏳ قيد التدقيق والمراجعة من المسؤول العام
  | 'approved'           // 🟢 معتمد ومصادق عليه ورسمي (منشور للطلاب)
  | 'rejected';          // 🔴 مرفوض / مطلوب إعادة التعديل مع الملاحظات

// 🎯 نوع الدور الامتحاني (الدور الأول أو الدور الثاني)
export type ExamAttemptType = 
  | 'first_attempt'      // 🥇 الدور الأول
  | 'second_attempt';    // 🥈 الدور الثاني

// 📋 واجهة مادة / موعد امتحان نهائي فردي (Final Exam Slot)
export interface FinalExamSlot {
  id: string;                      // 🆔 معرف البند الامتحاني الفريد
  schedule_id: string;             // 📑 معرف جدول الامتحان التابع له
  course_id: string;               // 📘 معرف المادة الدراسية
  course_name: string;             // 📝 اسم المادة
  course_code: string;             // 🏷️ كود المادة (مثال: CS201)
  stage_number: number;            // 🎓 رقم المرحلة الدراسية
  exam_date: string;               // 📆 تاريخ الامتحان (YYYY-MM-DD)
  exam_day: DayOfWeek;             // 📅 اسم اليوم (السبت، الأحد، ...)
  start_time: string;              // ⏰ وقت بدء الامتحان (مثال: '09:00')
  end_time: string;                // ⏰ وقت انتهاء الامتحان (مثال: '12:00')
  duration_hours: number;          // ⏳ مدة الامتحان بالساعات (مثال: 3.0)
  building_name: string;           // 🏛️ البناية الامتحانية (مثال: 'بناية الهندسة المركزية')
  hall_name: string;               // 🚪 القاعة الامتحانية أو المختبر (مثال: 'مدرج الخوارزمي - قاعة 101')
  supervisor_name?: string;        // 👤 اسم رئيس اللجنة الامتحانية / المشرف
  notes?: string;                  // 💡 ملاحظات خاصة بالمادة (مثال: يسمح بالآلة الحاسبة)
  study_type?: 'morning' | 'evening' | 'both'; // ☀️🌙 الفترة الدراسية (صباحي / مسائي / كلاهما)
  target_group?: string;           // 🏷️ الكروب المستهدف بالقاعة الامتحانية ('all' أو 'A', 'B'...)
}

// 🏛️ واجهة جدول الامتحانات النهائية الشامل للمرحلة والقسم (Final Exam Schedule)
export interface FinalExamSchedule {
  id: string;                      // 🆔 معرف الجدول الفريد
  department_id: string;           // 🏢 معرف القسم الأكاديمي
  department_name: string;         // 🏢 اسم القسم
  stage_number: number;            // 🎓 رقم المرحلة الدراسية (1 - 4)
  semester: 1 | 2;                 // 🗓️ الكورس الدراسي (1: الأول، 2: الثاني)
  study_type?: 'morning' | 'evening' | 'both'; // ☀️🌙 الفترة الدراسية (صباحي / مسائي / كلاهما)
  academic_year_id: string;        // 🗓️ معرف العام الدراسي (year-2026)
  academic_year_label: string;     // 🗓️ العام الدراسي (2026-2027)
  attempt_type: ExamAttemptType;   // 🎯 الدور (أول / ثاني)
  status: ExamScheduleStatus;      // 🚦 حالة المصادقة (مسودة / قيد المراجعة / معتمد / مرفوض)
  instructions: string[];          // 📋 قائمة التعليمات والضوابط الامتحانية الإلزامية
  created_by_id: string;           // 👤 معرف المنشئ (رئيس القسم أو المقرر)
  created_by_name: string;         // 👤 اسم المنشئ
  created_by_role: 'department_head' | 'rapporteur' | 'super_admin' | 'admin'; // 🏷️ صفة المنشئ
  submitted_at?: string;           // ⏰ تاريخ ووقت الإرسال للاعتماد
  reviewed_by_id?: string;         // 👤 معرف المسؤول العام المعتمد
  reviewed_by_name?: string;       // 👤 اسم المسؤول العام المعتمد
  reviewed_at?: string;            // ⏰ تاريخ ووقت المصادقة
  review_notes?: string;           // 💡 ملاحظات وتوجيهات المسؤول العام
  created_at: string;              // ⏰ تاريخ الإنشاء
  updated_at: string;              // ⏰ تاريخ آخر تعديل
  slots?: FinalExamSlot[];         // 📋 بنود ومواعيد الامتحانات
}

// ⚠️ واجهة تعارض وتضارب مواعيد الامتحانات النهائية والقاعات
export interface ExamConflict {
  type: 'hall' | 'supervisor' | 'stage_day' | 'time_overlap';
  message: string;
  conflictingSlot?: FinalExamSlot;
}

// =============================================================================
// 💳 15. أنواع وواجهات إدارة وتسديد الأقساط الدراسية (Tuition & Installments)
// =============================================================================

// 🚦 حالات تسديد القسط الدراسي للطالب
export type TuitionSettlementStatus = 'fully_settled' | 'partially_settled' | 'unsettled' | 'exempt';

// 🎁 أنواع التخفيضات والمنح المالية الرسمية للأقساط
export type TuitionDiscountType = 
  | 'none'            // بدون تخفيض (القسط الكامل)
  | 'martyrs_family'  // ذوو الشهداء وضحايا الإرهاب (تخفيض 50%)
  | 'top_student'     // الطالب الأول والمتفوقين (تخفيض 100% أو 50%)
  | 'siblings'        // الأخوة الدارسون بالجامعة (تخفيض 10%)
  | 'destitute_aid'   // رعاية اجتماعية ومتعففون
  | 'social_care'     // رعاية اجتماعية
  | 'custom';         // تخفيض مخصص بقرار مجلس الكلية

// 📋 بند دفعة قسط دراسي مسددة
export interface TuitionInstallmentItem {
  installment_num: number;        // 🔢 رقم الدفعة (1, 2, 3, 4, ...)
  amount: number;                 // 💵 المبلغ المسدد بالدينار العراقي
  paid_at: string;                // 📅 تاريخ التسديد (YYYY-MM-DD)
  receipt_no: string;             // 🧾 رقم وصل أو سند القبض المالي
  payment_method?: 'cash' | 'electronic' | 'bank_cheque' | 'exemption'; // 💳 طريقة الدفع (نقدي، دفع إلكتروني، صك مصدق، إعفاء مالي)
  cashier_name?: string;          // 👤 اسم المحاسب أو المستلم في شعبة الحسابات
  note?: string;                  // 💡 ملاحظة الدفعة
}

// 👤 سجل تسديد القسط الدراسي للطالب
export interface StudentTuitionRecord {
  id: string;                     // 🆔 معرف السجل الفريد
  student_id: string;             // 🎓 معرف الطالب
  student_name: string;           // 👤 اسم الطالب الرباعي
  student_code?: string;          // 🏷️ الرقم الجامعي
  department_id: string;          // 🏢 معرف القسم
  stage_number: number;           // 🎓 رقم المرحلة الدراسية (1 - 4)
  study_type?: 'morning' | 'evening'; // ☀️ نوع الدراسة (صباحي / مسائي)
  academic_year: string;          // 📅 العام الدراسي (2026-2027)
  base_amount?: number;           // 💵 القسط الأساسي قبل التخفيض
  discount_type?: TuitionDiscountType; // 🎁 نوع التخفيض المعتمد
  custom_discount_name?: string;       // 🏷️ اسم أو مسمى نوع التخفيض المخصص
  discount_percentage?: number;   // 📊 نسبة التخفيض المئوية
  discount_amount?: number;       // 💰 قيمة مبلغ التخفيض
  total_amount: number;           // 💵 صافي القسط الدراسي السنوي المطلوب
  installments_count: number;     // 🔢 عدد دفعات التسديد المقررة (3 أو 4 أو مخصص)
  paid_amount: number;            // 💰 إجمالي المبلغ المسدد حتى الآن
  remaining_amount: number;       // ⏳ المبلغ المتبقي بذمة الطالب
  status: TuitionSettlementStatus;// 🚦 موقف التسديد (مسدد بالكامل، مسدد جزئياً، غير مسدد، معفى)
  financial_clearance?: 'cleared' | 'uncleared' | 'under_review'; // 🛡️ موقف براءة الذمة المالية
  clearance_date?: string;        // 📅 تاريخ منح براءة الذمة المالية
  paid_installments: TuitionInstallmentItem[]; // 📋 قائمة الدفعات المسددة
  has_prior_unpaid_stages?: boolean; // ⚠️ هل بذمة الطالب متأخرات سابقة
  unpaid_stages_count: number;    // ⚠️ عدد المراحل السابقة غير المسددة
  notes?: string;                 // 📝 ملاحظات الحسابات ورئاسة القسم
  created_at: string;             // ⏰ تاريخ الإنشاء
  updated_at: string;             // 🔄 تاريخ التحديث
}

// =============================================================================
// 📢 16. أنواع وواجهات التعميمات والتبليغات والإنذارات الجامعية الرسمية
// =============================================================================

// 🏷️ تصنيفات التعميمات الرسمية
export type AnnouncementCategory = 
  | 'term_commencement'   // 🚀 بدء واستئناف الدوام والمحاضرات
  | 'official_holiday'    // 🌴 العطل الرسمية لجمهورية العراق
  | 'uniform_compliance'  // 👔 الالتزام بالزي الجامعي الموحد والباج
  | 'absence_warning_1'   // ⚠️ تحذير غياب أولي
  | 'absence_warning_2'   // ⏳ تحذير غياب ثانٍ
  | 'absence_warning_3'   // 🚨 تحذير غياب ثالث / إنذار نهائي
  | 'tuition_notice'      // 💳 تبليغ تسديد الأقساط
  | 'general';            // 📢 تعميم وقرار عام

// 🎯 نطاق وفئة المستهدفين بالتبليغ
export type AnnouncementTargetScope = 
  | 'all'                 // 👥 كافة طلاب المرحلة
  | 'unsettled_tuition'   // 💳 الطلبة غير المسددين للأقساط فقط
  | 'single_student'      // 👤 طالب منفرد محدد
  | 'selected_students'   // 👥 طلاب محددون بالاسم
  | 'all_stages';         // 🏛️ كافة مراحل وأقسام الكلية

// 📜 واجهة التعميم والتبليغ الرسمي
export interface CampusAnnouncement {
  id: string;                     // 🆔 معرف التعميم
  department_id: string;          // 🏢 معرف القسم
  department_name: string;        // 🏢 اسم القسم
  target_stage: number | null;    // 🎓 المرحلة المستهدفة (null = لكافة المراحل)
  target_scope: AnnouncementTargetScope; // 🎯 فئة الاستهداف
  target_student_ids?: string[];  // 🎯 معرفات الطلاب في حال التخصيص
  category: AnnouncementCategory; // 🏷️ نوع وتصنيف التعميم
  title: string;                  // 📌 عنوان التعميم
  content: string;                // 📄 نص وتفاصيل التعميم
  effective_date?: string;        // 📅 تاريخ النفاذ أو موعد العطلة / بدء الدوام
  is_urgent: boolean;             // 🚨 هل التعميم عاجل وهام؟
  author_name: string;            // 👤 اسم ناشر التعميم (رئيس القسم / المقرر / العمادة)
  author_role: string;            // 🏷️ صفة الناشر
  created_at: string;             // ⏰ تاريخ ووقت النشر
}

// 💳 واجهة حمولة إرسال تبليغ تسديد أقساط
export interface TuitionNoticePayload {
  department_id: string;
  stage_number: number;
  target_scope: 'all' | 'unsettled_only' | 'single_student' | 'selected_students';
  target_student_ids?: string[];
  notice_type: 'full_tuition' | 'installment_1' | 'installment_2' | 'installment_3' | 'installment_4' | 'installments_1_2' | 'custom';
  custom_message?: string;
  due_date?: string;
}

// =============================================================================
// 📝 التكليفات والامتحانات الفصلية للأستاذ ومسار بولونيا (Course Academic Tasks)
// =============================================================================

// 🏷️ نوع التكليف الأكاديمي أو الامتحان
export type AcademicTaskType = 
  | 'quiz'             // 📝 كويز وامتحان قصير
  | 'assignment'       // 📑 واجب بيتي / تطبيقي / برمجي
  | 'report'           // 📄 تقرير وبحث وحلقة نقاشية
  | 'midterm_exam'     // 🎯 امتحان منتصف الفصل (مدتيرم)
  | 'practical_exam';  // 🔬 امتحان عملي ومختبري

// 📑 عنصر عنوان أو محور مقترح لكتابة التقرير
export interface ReportTopicItem {
  id: string;          // 🆔 معرف العنوان
  title: string;       // 📝 عنوان التقرير المقترح
  description?: string;// 💡 نبذة مختصرة عن المطلوب في هذا المحور
  max_students?: number;// 👥 الحد الأقصى للطلبة المشتركين (1 للتقرير الفردي)
}

// 📚 واجهة التكليف الأكاديمي الشاملة للمادة
export interface CourseAcademicTask {
  id: string;                         // 🆔 معرف التكليف
  course_id: string;                  // 📘 معرف المادة الدراسية
  course_name: string;                // 📝 اسم المادة
  course_code: string;                // 🏷️ رمز المادة (CS201)
  department_id: string;              // 🏢 معرف القسم
  department_name?: string;           // 🏢 اسم القسم
  stage_number: number;               // 🎓 رقم المرحلة (1 - 4)
  semester: 1 | 2;                    // 🗓️ الكورس الدراسي (1 أو 2)
  study_type?: 'morning' | 'evening' | 'both'; // ☀️🌙 الفترة الدراسية (صباحي / مسائي / كلاهما)
  target_group?: string;              // 🏷️ الكروب المستهدف بالتكليف ('all' أو 'A', 'B'...)
  academic_year: string;              // 🗓️ العام الدراسي (2026-2027)
  teacher_id: string;                 //  معرف الأستاذ المسؤول
  teacher_name: string;               // 👤 اسم الأستاذ للعرض
  task_type: AcademicTaskType;        // 🏷️ نوع التكليف
  title: string;                      // 📌 عنوان التكليف (كويز رقم 1، واجب المصفوفات، ...)
  description?: string;               // 💬 وصف عام وإرشادات
  
  // 📚 تفاصيل المادة الداخلة في الامتحان / الكويز / المدتيرم / العملي
  included_topics: string;            // 📖 الفصول والملازم والمفردات والصفحات الداخلة في الامتحان
  
  // ❓ تفاصيل الواجبات
  assignment_questions?: string;      // ❓ نص وسؤال الواجب بالتفصيل والمطاليب
  assignment_type?: 'theory' | 'practical' | 'code' | 'problem_solving' | 'mixed'; // 🏷️ طبيعة الواجب
  
  // 📑 تفاصيل التقارير والبحوث
  report_topics?: ReportTopicItem[];  // 📑 قائمة العناوين والمحاور المتاحة ليختار منها الطالب
  report_guidelines?: string;         // 📋 ضوابط كتابة التقرير (عدد الصفحات، التوثيق، الخط)
  
  // ⏰ التواريخ والمواعيد والمدد
  start_date?: string;                // ⏳ تاريخ بدء التكليف وإتاحته
  due_date: string;                   // ⏰ موعد الامتحان أو موعد تسليم الواجب (تاريخ ووقت)
  final_deadline?: string;            // ⛔ آخر موعد نهائي لاستلام الواجبات المتأخرة
  
  // ⚠️ التحذيرات وعقوبات التأخير
  late_penalty_warning?: string;      // ⚠️ نص التحذير ونسبة الخصم في حال التأخير
  
  // 💯 التقييم والقاعة
  max_score: number;                  // 💯 الدرجة المخصصة للتكليف (وفق مسار بولونيا)
  room_or_hall?: string;              // 🚪 القاعة الدراسية أو المختبر للامتحان والكويز
  
  // 📎 المرفقات والحالة وقفل/فتح الاستلام
  attachments_count?: number;         // 📎 عدد الملفات أو النماذج المرفقة
  is_published: boolean;              // 📢 هل التكليف معلن ونشط للطلاب؟
  is_submission_open?: boolean;       // 🔒 هل باب رفع وتسليم الملفات مفتوح من قبل الأستاذ؟
  submission_mode?: 'individual_only' | 'group_allowed' | 'group_only'; // 👥 نمط التقديم المسموح
  max_group_size?: number;            // 👥 أقصى عدد طلاب في التقديم الجماعي للتقرير
  created_at: string;                 // ⏰ تاريخ الإنشاء
  updated_at: string;                 // ⏰ تاريخ آخر تحديث
}

// 🏷️ نوع تقديم التكليف (فردي لطالب واحد أو جماعي لفريق بحثي)
export type SubmissionType = 'individual' | 'group';

// 📊 حالة معالجة التسليم والتقييم
export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'resubmit_requested';

// 🚦 قرار تدقيق الأستاذ للواجب والتقرير (مقبول / مرفوض / يحتاج تعديل / قيد التدقيق)
export type SubmissionReviewDecision = 'accepted' | 'rejected' | 'needs_revision' | 'pending';

// 👥 عضو في مجموعة التقرير أو الواجب المشترك
export interface SubmissionGroupMember {
  student_id?: string;                // 🆔 معرف الطالب إن وجد
  full_name: string;                  // 👤 اسم الطالب الرباعي
  university_number: string;          // 🔢 الرقم الجامعي للطالب
}

// 📤 واجهة تسليم الواجب أو التقرير من قبل الطالب
export interface StudentTaskSubmission {
  id: string;                         // 🆔 معرف التسليم
  task_id: string;                    // 📌 معرف التكليف المرتبط
  course_id: string;                  // 📘 معرف المادة
  student_id: string;                 // 🎓 معرف الطالب الذي قام بالرفع
  student_name: string;               // 👤 اسم الطالب الرافع
  student_university_number: string;  // 🔢 الرقم الجامعي للطالب الرافع
  submission_type: SubmissionType;    // 🏷️ نوع التقديم: فردي أم جماعي
  group_members?: SubmissionGroupMember[]; // 👥 قائمة زملاء الفريق في حال التقرير الجماعي
  file_name: string;                  // 📄 اسم ملف الـ PDF المرفوع
  file_url: string;                   // 🔗 رابط أو بيانات ملف الـ PDF المرفوع
  file_size_bytes: number;            // 💾 حجم الملف بالبايت
  student_notes?: string;             // 💬 ملاحظات الطالب المرفقة مع الحل
  submitted_at: string;               // ⏰ تاريخ ووقت الرفع الفعلي
  is_late: boolean;                   // ⚠️ هل تم التسليم بعد الموعد المحدد؟
  
  // 🚦 قرارات وحالات التدقيق الأكاديمية (مقبول / مرفوض / يحتاج تعديل)
  review_decision?: SubmissionReviewDecision; // 🚦 قرار الأستاذ على التكليف
  decision_reason?: string;           // 📝 أسباب الرفض أو التعديل المطلوب بدقة
  revision_deadline?: string;         // ⏳ مهلة إعادة التعديل والتسليم للطالب
  plagiarism_percentage?: number;     // 🔬 نسبة الاستلال العلمي والتشابه للتقارير (%)
  revision_count?: number;            // 🔄 رقم النسخة / عدد مرات إعادة التعديل
  allow_resubmission?: boolean;       // 🔓 هل سمح الأستاذ للطالب بإعادة رفع الحل المعدل؟

  // 💯 التقييم والدرجات
  score?: number;                     // 💯 الدرجة المرصودة من الأستاذ (من max_score)
  teacher_feedback?: string;          // 📝 ملاحظات وتوجيهات الأستاذ التقييمية
  graded_by?: string;                 //  معرف أو اسم الأستاذ المقيم
  graded_at?: string;                 // ⏰ تاريخ ووقت رصد الدرجة
  status: SubmissionStatus;           // 📊 حالة التسليم
  created_at: string;                 // ⏰ تاريخ الإنشاء
  updated_at: string;                 // ⏰ تاريخ التحديث
}
