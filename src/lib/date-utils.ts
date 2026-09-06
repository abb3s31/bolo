// 📅 دوال مساعدة لتنسيق التواريخ بالأرقام الإنجليزية وترجمة بنود سجل الرقابة الأكاديمي
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا

/**
 * 🕒 دالة تنسيق التاريخ والوقت بالأرقام الإنجليزية 0-9 مع لاحقة ص / م بالعربية
 * مثال: 2026/08/28 03:16 م
 */
export function formatEnglishDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  const rawHours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  const ampm = rawHours >= 12 ? 'م' : 'ص';
  const hour12 = rawHours % 12 || 12;
  const formattedHour = String(hour12).padStart(2, '0');

  return `${year}/${month}/${day} ${formattedHour}:${mins}:${secs} ${ampm}`;
}

/**
 * 📅 دالة تنسيق التاريخ فقط بالأرقام الإنجليزية 0-9
 * مثال: 2026/08/28
 */
export function formatEnglishDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

/**
 * 🎓 دالة ترجمة الدور الأكاديمي إلى اسم رسمي عربي معتمد
 * مثال: super_admin / admin -> مسؤول عام، department_head -> رئيس قسم، rapporteur -> مقرر، teacher -> تدريسي، student -> طالب
 */
export function getArabicRoleLabel(role: string): string {
  if (!role) return 'مستخدم';
  if (role === 'super_admin' || role === 'admin') return 'مسؤول عام';
  if (role === 'department_head') return 'رئيس قسم';
  if (role === 'rapporteur') return 'مقرر';
  if (role === 'teacher') return 'تدريسي';
  if (role === 'student') return 'طالب';
  return 'مستخدم';
}

/**
 * 🛡️ قاموس ترجمة أحداث وإجراءات سجل التدقيق الأمني إلى مصطلحات عربية فصيحة
 */
export const AUDIT_ACTION_TRANSLATIONS: Record<string, string> = {
  LOGIN_SUCCESS: 'تسجيل دخول ناجح',
  LOGIN_FAILED: 'محاولة دخول فاشلة',
  ACCOUNT_LOCKED: 'قفل الحساب مؤقتاً',
  SESSION_TAMPERED: 'كشف تلاعب بالجلسة',
  UNAUTHORIZED_ROUTE_ACCESS: 'محاولة وصول غير مصرح',
  GRADE_MUTATION: 'تعديل درجة سعي',
  GRADE_LOCKED: 'اعتماد وقفل سعي',
  PROFILE_MUTATION: 'تعديل بيانات الحساب',
  DDOS_ATTACK_ATTEMPT: 'اعتراض ضغط غير اعتيادي',
  RATE_LIMIT_EXCEEDED: 'تجاوز حد الطلبات المسموح',
  CIRCUIT_BREAKER_TRIGGERED: 'تفعيل قاطع استقرار البيانات',
  HONEYPOT_TRAP_TRIGGERED: 'تفعيل فخ أمني',
  BAD_BOT_DETECTED: 'كشف برنامج آلي غير مصرح',
  DOM_TAMPERING_DETECTED: 'كشف محاولة تعديل الواجهة',
  HACKING_TOOL_DETECTED: 'اعتراض أداة فحص أمنية',
  SENSITIVE_PROBE_DETECTED: 'كشف استكشاف مسارات حساسة',
  HEADLESS_BOT_DETECTED: 'كشف متصفح وهمي',
  PROTOTYPE_POLLUTION_ATTEMPT: 'اعتراض محاولة حقن الذاكرة',
  WAF_RULE_TRIGGERED: 'تنبيه جدار الحماية',
  WAF_ANOMALY_BLOCKED: 'حظر أمني للطلب',
  SSRF_ATTEMPT_DETECTED: 'اعتراض استدعاء محظور',
  ALL: 'جميع الحقول والعمليات',
};

/**
 * 🏷️ دالة ترجمة اسم الإجراء الأمني والعمليات الأكاديمية بالكامل 100%
 */
export function getTranslatedAuditAction(action: string): string {
  if (!action) return 'إجراء نظام'; // 🔒 إذا كان الإجراء فارغاً
  if (AUDIT_ACTION_TRANSLATIONS[action]) { // 🔍 فحص القاموس الأمني أولاً
    return AUDIT_ACTION_TRANSLATIONS[action]; // 🏷️ إرجاع الترجمة الأمنية
  }
  return translateAcademicField(action); // 📚 فحص القاموس الأكاديمي وترجمة أي بند
}

/**
 * 🎨 دالة ترجمة قيم الحقول والحالات الأمنية دون ترك أي مصطلح إنجليزي
 */
export function translateAuditValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return 'لا يوجد'; // 🚫 القيمة الفارغة
  if (typeof val === 'boolean') return val ? 'مفعل (نعم)' : 'معطل (لا)'; // 🔘 القيم المنطقية
  const str = String(val).trim(); // 🧹 تنظيف المسافات الزائدة
  if (str === 'N/A' || str === 'n/a' || str === 'null' || str === 'undefined' || str === '') return 'لا يوجد'; // 🚫 قيم العدم
  if (str === 'CRITICAL') return 'حرج أمني'; // 🚨 مستوى حرج
  if (str === 'HIGH') return 'مرتفع'; // ⚠️ مستوى مرتفع
  if (str === 'MEDIUM') return 'متوسط'; // 🟡 مستوى متوسط
  if (str === 'LOW') return 'منخفض'; // 🟢 مستوى منخفض
  if (str === 'INFO') return 'إشعار نظام'; // ℹ️ مستوى إشعار
  if (str.toLowerCase() === 'true') return 'مفعل (نعم)'; // 🔘 صحيح
  if (str.toLowerCase() === 'false') return 'معطل (لا)'; // 🔘 معطل
  if (str.toLowerCase() === 'success') return 'ناجح'; //  عملية ناجحة
  if (str.toLowerCase() === 'failed') return 'فاشل'; // ❌ عملية فاشلة
  if (str.toLowerCase() === 'pending') return 'قيد المراجعة والاعتماد'; // ⏳ قيد الانتظار
  return str; // 🏷️ إرجاع القيمة المترجمة
}

/**
 * 👤 دالة تهذيب وتنسيق اسم الفاعل ومنع ظهور البريد الإنجليزي أو الكلمات الإنجليزية
 */
export function formatAuditActorName(actorName: string | null | undefined): string {
  if (!actorName || actorName === 'مجهول' || actorName === 'system') return 'محاولة وصول خارجية'; // 👤 مجهول أو نظام
  if (actorName.includes('bot-simulator') || actorName.includes('external-scanner') || actorName.includes('Spider')) { // 🤖 فحص الروبوت
    return 'برنامج فحص آلي خارجي (زاحف أمني)'; // 🤖 اسم عربي فصيح دون أي كلمة إنجليزية
  }
  if (actorName.includes('admin-tester')) { // 🛡️ فاحص النظام
    return 'فاحص المنظومة الأمني المعتمد'; // 🛡️ الفاحص المعتمد
  }
  if (actorName.includes('@') || actorName.includes('مستخدم (')) { // 📧 بريد إلكتروني
    return 'مستخدم غير مسجل (محاولة خارجية)'; // 🔒 اسم مستعار آمن
  }
  return actorName; // 🏷️ إرجاع الاسم الطبيعي
}

/**
 * 🧹 دالة تنظيف وترجمة تفاصيل سجل التدقيق واستبدال كافة المصطلحات والمسارات الإنجليزية بعربية شاملة 100%
 */
export function translateAuditDetails(details: string): string {
  if (!details) return ''; // 🚫 نص فارغ

  return details // 🔄 سلسلة استبدالات شاملة لتعريب 100%
    .replace(/\[department_head,\s*rapporteur\]/g, '[رئيس قسم، مقرر]') // 🏷️ تعريب أدوار القيادات
    .replace(/\[super_admin,\s*admin\]/g, '[المسؤول العام]') // 🏷️ تعريب المسؤول العام
    .replace(/department_head/g, 'رئيس قسم') // 🏢 تعريب رئيس القسم
    .replace(/rapporteur/g, 'مقرر قسم') // 🏢 تعريب المقرر
    .replace(/super_admin/g, 'المسؤول العام') // 👑 تعريب المسؤول العام
    .replace(/teacher/g, 'أستاذ') // 👨‍🏫 تعريب الأستاذ
    .replace(/student/g, 'طالب') // 🎓 تعريب الطالب
    .replace(/\/courses\/crs-[0-9]+\/teacher/g, 'بوابة التدريسي للمواد الدراسية') // 🛣️ تعريب المسار الأكاديمي الحصين
    .replace(/\/courses\/crs-[0-9]+\/أستاذ/g, 'بوابة الأستاذ للمادة الدراسية') // 🛣️ تعريب مسار المادة المعرب جزئياً
    .replace(/\(?\/?courses\/crs-[0-9a-zA-Z_-]*\/?\)?/gi, '(مسار مادة أكاديمية معتمدة)') // 🛣️ تعريب مسار المادة بالأقواس أو بدونها
    .replace(/\(?\/?teacher\/courses\/[^\s)]*\/?\)?/gi, '(مسار المواد الدراسية للأستاذ)') // 🛣️ تعريب مسار مواد التدريسي الشامل
    .replace(/\/teacher\/audit-logs/g, 'سجل تعديلات التدريسي') // 🛣️ تعريب سجل الأستاذ
    .replace(/\/courses\//g, 'المواد الدراسية/') // 🛣️ تعريب مجلد المواد
    .replace(/\/?crs-[0-9a-zA-Z_-]+/gi, 'رمز المادة الأكاديمية') // 🔢 تعريب بادئة ورمز المادة
    .replace(/sadmin\/dashboard/g, 'لوحة تحكم المسؤول العام') // 🛣️ تعريب لوحة الإشراف
    .replace(/admin\/dashboard/g, 'لوحة إدارة القسم') // 🛣️ تعريب لوحة القسم
    .replace(/teacher\/dashboard/g, 'لوحة تحكم الأستاذ') // 🛣️ تعريب لوحة الأستاذ
    .replace(/student\/dashboard/g, 'لوحة تحكم الطالب') // 🛣️ تعريب لوحة الطالب
    .replace(/sadmin\/audit-logs/g, 'سجل التدقيق والمراقبة') // 🛣️ تعريب سجل التدقيق
    .replace(/admin\/department-heads/g, 'إدارة رؤساء الأقسام والمقررين') // 🛣️ تعريب مسار الرؤساء
    .replace(/admin\/teachers/g, 'إدارة الكادر التدريسي') // 🛣️ تعريب مسار التدريسيين
    .replace(/admin\/students/g, 'إدارة شؤون الطلبة') // 🛣️ تعريب مسار الطلبة
    .replace(/sadmin\/departments/g, 'إدارة الأقسام العلمية') // 🛣️ تعريب مسار الأقسام
    .replace(/sadmin\/reports/g, 'التقارير المركزية') // 🛣️ تعريب مسار التقارير
    .replace(/WAF/g, 'جدار الحماية الأمني') // 🛡️ تعريب WAF
    .replace(/\(SSRF Hostname Probe\)/g, '(فحص محاولة استهداف مضيف خادم)') // 🛡️ تعريب فحص SSRF
    .replace(/LFI_PATH_TRAVERSAL/g, 'محاولة اجتياز المسارات المحلية') // 🛡️ تعريب LFI
    .replace(/\[LFI\]/g, '[تضمين مسارات محلية]') // 🛡️ تعريب LFI وسم
    .replace(/SQL_OPERATOR_INJECTION/g, 'محاولة حقن قواعد البيانات') // 🛡️ تعريب حقن SQL دون إنجليزي
    .replace(/\[SQLI\]/g, '[حقن استعلامات قواعد البيانات]') // 🛡️ تعريب SQLI دون إنجليزي
    .replace(/RCE_COMMAND_INJECTION/g, 'محاولة تنفيذ أوامر خادم عن بُعد') // 🛡️ تعريب RCE دون إنجليزي
    .replace(/\[RCE\]/g, '[تنفيذ أوامر عن بُعد]') // 🛡️ تعريب RCE وسم
    .replace(/XSS_TAG_INJECTION/g, 'محاولة حقن وسوم برمجية خبيثة') // 🛡️ تعريب XSS دون إنجليزي
    .replace(/\[XSS\]/g, '[حقن وسوم برمجية]') // 🛡️ تعريب XSS وسم
    .replace(/\(Spider Bot\)/g, '(برنامج زاحف آلي)') // 🤖 تعريب البوت
    .replace(/Spider Bot/g, 'برنامج زاحف آلي') // 🤖 تعريب مسمى البوت
    .replace(/Security Testing Console/g, 'منصة الاختبارات الأمنية') // 🛡️ تعريب منصة الأمان
    .replace(/spider_trap_val/g, 'فخ صيد البوتات العنكبوتية') // 🕸️ تعريب فخ العنكبوت
    .replace(/malicious_bot_probe_value_123/g, 'قيمة فحص آلي محظورة') // 🚫 تعريب القيمة المشبوهة
    .replace(/bot-simulator@external-scanner\.local/g, 'برنامج فحص آلي خارجي') // 📧 تعريب بريد المحاكي
    .replace(/admin-tester@sadiq\.edu\.iq/g, 'فاحص المنظومة الأمني') // 📧 تعريب بريد الفاحص
    .replace(/UNION SELECT.*$/gi, 'محاولة استعلام غير مصرح لقواعد البيانات (حقن استعلامات)') // 🛡️ تعريب استعلامات الحقن
    .replace(/<script>.*$/gi, 'محاولة سرقة بيانات الجلسة عبر سكريبت خبيث (حقن وسوم)') // 🛡️ تعريب سكريبتات الحقن
    .replace(/cat\s*\(whoami\).*$/gi, 'محاولة تشغيل أوامر خادم محظورة (أوامر عن بعد)') // 🛡️ تعريب أوامر الخادم
    .replace(/cat\s*\/etc\/passwd.*$/gi, 'محاولة قراءة ملفات خادم النظام الحساسة') // 🛡️ تعريب قراءة الملفات
    .replace(/etc\/passwd\.jpg.*$/gi, 'محاولة اجتياز مسارات النظام لقراءة الملفات الحساسة') // 🛡️ تعريب مسارات اللينكس
    .replace(/ببريد غير مسجل:\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'ببريد إلكتروني غير مسجل في المنظومة') // 📧 تعريب البريد المجهول
    .replace(/ببريد:\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'بالبريد الأكاديمي الرسمي') // 📧 تعريب البريد
    .replace(/ببريد غير مسجل:\s*[^\s,()]+/g, 'ببريد إلكتروني غير مسجل') // 📧 تعريب البريد
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'البريد المدخل') // 📧 تعريب البريد الخام
    .replace(/CRS-[0-9-]+/g, 'قاعدة فحص أمنية معتمدة') // 🛡️ تعريب قواعد CRS
    .replace(/CRITICAL/g, 'حرج أمني') // 🚨 تعريب حرج
    .replace(/HIGH/g, 'مرتفع') // ⚠️ تعريب مرتفع
    .replace(/MEDIUM/g, 'متوسط') // 🟡 تعريب متوسط
    .replace(/LOW/g, 'منخفض') // 🟢 تعريب منخفض
    .replace(/INFO/g, 'إشعار نظام') // ℹ️ تعريب إشعار
    .replace(/Excel/g, 'إكسل') // 📊 تعريب إكسل
    .replace(/excel/g, 'إكسل') // 📊 تعريب إكسل
    .replace(/session/gi, 'جلسة') // 🔑 تعريب جلسة
    .replace(/token/gi, 'رمز مصادقة') // 🔑 تعريب رمز مصادقة
    .replace(/unauthorized/gi, 'غير مصرح به') // 🚫 تعريب غير مصرح
    .replace(/blocked/gi, 'محظور أمنياً'); // 🔒 تعريب محظور
}

/**
 * 📚 دالة ترجمة بنود الدرجات والتقييمات الأكاديمية إلى مصطلحات عربية معتمدة 100%
 */
export function translateAcademicField(field: string | null | undefined): string {
  // فحص إذا كان الحقل فارغاً
  if (!field) return 'بند غير محدد';
  const raw = field.trim();
  const f = raw.toLowerCase();

  // فحص قاموس إجراءات الأمان والنظام أولاً
  if (AUDIT_ACTION_TRANSLATIONS[raw]) {
    return AUDIT_ACTION_TRANSLATIONS[raw];
  }
  if (AUDIT_ACTION_TRANSLATIONS[raw.toUpperCase()]) {
    return AUDIT_ACTION_TRANSLATIONS[raw.toUpperCase()];
  }

  // قاموس الترجمة الأكاديمية والعمليات الشامل
  const dict: Record<string, string> = {
    login_success: 'تسجيل دخول ناجح',
    login_failed: 'محاولة دخول فاشلة',
    account_locked: 'قفل الحساب مؤقتاً',
    grade_mutation: 'تعديل درجة سعي',
    final_exam: 'الامتحان النهائي',
    final: 'الامتحان النهائي',
    practical: 'الامتحان / السعي العملي',
    practical_exam: 'الامتحان العملي',
    theory: 'الامتحان / السعي النظري',
    midterm: 'الامتحان النصفي',
    midterm_exam: 'الامتحان النصفي',
    quiz_1: 'كويز 1',
    quiz_2: 'كويز 2',
    quiz_3: 'كويز 3',
    quiz: 'كويز',
    quizzes: 'الكويزات والواجبات',
    assignment_1: 'واجب 1',
    assignment_2: 'واجب 2',
    assignment: 'الواجب المنزلي',
    assignments: 'الواجبات والتكليفات',
    report: 'تقرير / بحث',
    reports: 'التقارير والأبحاث',
    attendance: 'الحضور والغياب',
    activities: 'النشاط الصفي',
    activity: 'النشاط الصفي',
    coursework: 'السعي الفصلي',
    total: 'المجموع الكلي',
    grade: 'الدرجة',
    status: 'حالة الاعتماد',
    notes: 'الملاحظات',
  };

  // إرجاع الترجمة المباشرة إن وجدت
  if (dict[f]) return dict[f];
  if (f.startsWith('quiz')) return f.replace('quiz', 'كويز ');
  if (f.startsWith('assignment')) return f.replace('assignment', 'واجب ');
  if (f.startsWith('report')) return f.replace('report', 'تقرير ');

  return field;
}

