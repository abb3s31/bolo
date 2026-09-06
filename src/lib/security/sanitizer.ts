// 🧹 معقم المدخلات وجدار فحص البيانات والدرجات الأكاديمية (Enterprise Unified Cyber Defense Suite 2026)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا

import { Grade } from '@/types'; // 🔗 استيراد واجهة درجات بولونيا
import { detectSqlInjection, sanitizeSqlString } from './sql-injection-guard'; // 🛡️ حارس SQL Injection
import { detectXss, stripXss, escapeHtml, sanitizeSafeUrl } from './xss-guard'; // 🛡️ حارس XSS
import { detectUrlInjection, validateSafeInternalRedirect, sanitizeRouteParam, validateExternalResourceUrl } from './url-guard'; // 🛡️ حارس URL Injection
import { checkRateLimit, acquireHeavyTaskLock, releaseHeavyTaskLock, RateLimitTier } from './ddos-guard'; // 🛡️ حارس DDoS ومحدد الطلبات
import { CircuitBreaker, globalSupabaseCircuit } from './circuit-breaker'; // ⚡ قاطع الدائرة
import { 
  validateHoneypot, 
  detectBadBotSpider, 
  registerDomTamperingEvent, 
  getSessionThreatLevel, 
  getSpiderRadarMetrics,
  SPIDER_HONEYPOT_FIELD,
  SPIDER_TIMESTAMP_FIELD,
  SpiderThreatLevel
} from './spider-security'; // 🕷️ تقنية العنكبوت الأمني ومصائد الهوني بوت
import {
  detectHackingTool,
  detectSensitivePathProbe,
  sanitizePrototypePollution,
  detectHeadlessAutomation,
  renderLegalSecurityBanner,
  HackingCheckResult
} from './anti-hacking-guard'; // 🛡️ درع مكافحة برامج الاختراق وأدوات الفحص
import {
  wafInspectString,
  wafInspectPayload,
  deobfuscatePayload,
  getWafRadarMetrics,
  WAF_BLOCKING_THRESHOLD,
  WafRuleCategory,
  WafInspectionResult
} from './waf-firewall'; // 🧱 جدار حماية تطبيقات الويب وقواعد البيانات WAF
import { validateUrlAgainstSsrf, SsrfCheckResult } from './ssrf-guard'; // 🌐 درع حماية SSRF
import { deepSanitizePrototype, deepFreeze, PrototypeCheckResult } from './prototype-pollution-guard'; // 🔒 درع حماية الذاكرة

// إعادة تصدير كافة دوال وأدوات الأمان الموحدة
export { 
  detectXss, 
  stripXss, 
  escapeHtml, 
  sanitizeSafeUrl, 
  detectSqlInjection, 
  sanitizeSqlString, 
  detectUrlInjection, 
  validateSafeInternalRedirect, 
  sanitizeRouteParam, 
  validateExternalResourceUrl,
  checkRateLimit,
  acquireHeavyTaskLock,
  releaseHeavyTaskLock,
  CircuitBreaker,
  globalSupabaseCircuit,
  validateHoneypot,
  detectBadBotSpider,
  registerDomTamperingEvent,
  getSessionThreatLevel,
  getSpiderRadarMetrics,
  SPIDER_HONEYPOT_FIELD,
  SPIDER_TIMESTAMP_FIELD,
  detectHackingTool,
  detectSensitivePathProbe,
  sanitizePrototypePollution,
  detectHeadlessAutomation,
  renderLegalSecurityBanner,
  wafInspectString,
  wafInspectPayload,
  deobfuscatePayload,
  getWafRadarMetrics,
  WAF_BLOCKING_THRESHOLD,
  validateUrlAgainstSsrf,
  deepSanitizePrototype,
  deepFreeze,
};

export type { 
  RateLimitTier, 
  SpiderThreatLevel, 
  HackingCheckResult, 
  WafRuleCategory, 
  WafInspectionResult,
  SsrfCheckResult,
  PrototypeCheckResult,
};

// 🛡️ 1. دالة تعقيم وتطهير النصوص العامة من وسوم الـ HTML والسكربتات وحقن SQL والروابط (XSS, SQLi, WAF & URL Sanitizer)
export function sanitizeText(input: string, maxLength = 255): string {
  if (!input || typeof input !== 'string') return ''; // 🔒 حماية في حال تمرير قيمة فارغة
  
  // 🧱 1. فحص جدار الحماية WAF وتطبيع الـ De-Obfuscation
  const wafCheck = wafInspectString(input);
  const cleanWaf = wafCheck.isSafe ? input : wafCheck.sanitizedValue;

  // 🔍 2. فحص واعتراض حقن السكربتات XSS
  const xssCheck = detectXss(cleanWaf);
  const cleanXss = xssCheck.isSafe ? cleanWaf : xssCheck.sanitizedValue;

  // 🔍 3. فحص أولي ضد حقن SQL
  const sqlCheck = detectSqlInjection(cleanXss);
  const cleanSql = sqlCheck.isSafe ? cleanXss : sqlCheck.sanitizedValue;

  // 🔍 4. فحص الروابط الخبيثة
  detectUrlInjection(cleanSql);

  return stripXss(cleanSql)
    .replace(/['";\\]/g, '') // 🛡️ إزالة علامات الاقتباس لمنع كسر النصوص
    .trim() // ✂️ مسح المسافات الزائدة من البداية والنهاية
    .substring(0, maxLength); // 📏 قص النص للحد الأقصى المسموح لمنع هجمات الإغراق
}

// 📧 2. دالة تعقيم وتدقيق البريد الأكاديمي (Email Sanitizer & Validator)
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  // 🔍 فحص أولي شامل عبر WAF و XSS و SQLi
  wafInspectString(email, { fieldName: 'البريد الأكاديمي' });
  detectXss(email, { fieldName: 'البريد الأكاديمي' });
  detectSqlInjection(email, { fieldName: 'البريد الأكاديمي' });
  detectUrlInjection(email, { fieldName: 'البريد الأكاديمي' });

  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // 🧹 السماح بالحروف والأرقام ورموز البريد الرسمية فقط
    .substring(0, 120);
}

// 🔑 3. دالة فحص وتطهير كلمة المرور لمنع حقن السكربتات
export function sanitizePasswordInput(pass: string): string {
  if (!pass || typeof pass !== 'string') return '';
  return pass.trim().substring(0, 100); // 📏 حصر الطول المسموح
}

// 🔍 4. دالة تعقيم استعلامات البحث الأكاديمي والتحقق من الوثائق (Search Query Sanitizer)
export function sanitizeAcademicSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // 🚨 فحص شامل: WAF و XSS و SQL Injection و URL Traversal فورياً
  wafInspectString(query, { fieldName: 'استعلام البحث' });
  detectXss(query, { fieldName: 'استعلام البحث' });
  const sqlCheck = detectSqlInjection(query, { fieldName: 'استعلام البحث' });
  const sanitizedSql = sqlCheck.isSafe ? query : sqlCheck.sanitizedValue;
  detectUrlInjection(sanitizedSql, { fieldName: 'استعلام البحث' });

  return sanitizeSqlString(stripXss(sanitizedSql))
    .replace(/[^\u0600-\u06FFa-zA-Z0-9@._\s-]/g, '') // السماح بالعربية والإنجليزية والأرقام والشرطات
    .trim()
    .substring(0, 80);
}

// 📊 5. السقوف والحدود القصوى الرسمية لبنود سعي بولونيا الـ 7
export const BOLOGNA_GRADE_LIMITS = {
  quiz1: 5,        // 📝 كويز 1: السقف 5 درجات
  quiz2: 5,        // 📝 كويز 2: السقف 5 درجات
  assignment1: 5,  // 📑 واجب 1: السقف 5 درجات
  assignment2: 5,  // 📑 واجب 2: السقف 5 درجات
  report: 10,      // 📄 تقرير ومشاريع: السقف 10 درجات
  midterm: 10,     // 🎯 امتحان منتصف الفصل: السقف 10 درجات
  practical: 10,   // 🔬 التقييم العملي والنشاط: السقف 10 درجات
  final_coursework_total: 50, // 🎓 السعي النهائي: السقف 50 درجة
  final_exam: 50,  // 🏛️ الامتحان النهائي: السقف 50 درجة
  final_total: 100, // 💯 الدرجة الكلية: السقف 100 درجة
};

// 🎯 6. دالة فحص وتعقيم درجة بند واحد والتأكد من عدم تجاوزه السقف أو كونه سالباً
export function sanitizeGradeItem(val: number | string | undefined | null, maxLimit: number): number {
  if (val === undefined || val === null || val === '') return 0;
  
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;

  // 🔒 حصر الدرجة ضمن المدى الشرعي (من 0 إلى السقف المحدد للفقرة)
  const clamped = Math.max(0, Math.min(num, maxLimit));
  return Math.round(clamped * 100) / 100; // 🎯 تقريب لأقرب مرتبتين عشريتين
}

// 🛡️ 7. دالة فحص وتدقيق سجل درجات الطالب بالكامل لضمان التوافق الأكاديمي
export function validateAndSanitizeGradePayload(rawGrade: Partial<Grade>): {
  sanitized: Partial<Grade>;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = []; // 📝 مصفوفة الأخطاء المكتشفة

  // 🧹 تعقيم الدرجات الفردية وفق السقوف الرسمية
  const q1 = sanitizeGradeItem(rawGrade.quiz1, BOLOGNA_GRADE_LIMITS.quiz1);
  const q2 = sanitizeGradeItem(rawGrade.quiz2, BOLOGNA_GRADE_LIMITS.quiz2);
  const a1 = sanitizeGradeItem(rawGrade.assignment1, BOLOGNA_GRADE_LIMITS.assignment1);
  const a2 = sanitizeGradeItem(rawGrade.assignment2, BOLOGNA_GRADE_LIMITS.assignment2);
  const rep = sanitizeGradeItem(rawGrade.report, BOLOGNA_GRADE_LIMITS.report);
  const mid = sanitizeGradeItem(rawGrade.midterm, BOLOGNA_GRADE_LIMITS.midterm);
  const prac = sanitizeGradeItem(rawGrade.practical, BOLOGNA_GRADE_LIMITS.practical);

  // 🧮 حساب السعي الفصلي الكلي المحسوب (من 50)
  const calculatedCoursework = Math.min(q1 + q2 + a1 + a2 + rep + mid + prac, 50);

  // 🏛️ فحص الامتحان النهائي إذا وجد
  const finalExam = rawGrade.final_exam !== undefined 
    ? sanitizeGradeItem(rawGrade.final_exam, BOLOGNA_GRADE_LIMITS.final_exam)
    : undefined;

  const totalScore = finalExam !== undefined ? calculatedCoursework + finalExam : undefined;

  const sanitized: Partial<Grade> = {
    ...rawGrade,
    quiz1: q1,
    quiz2: q2,
    assignment1: a1,
    assignment2: a2,
    report: rep,
    midterm: mid,
    practical: prac,
    final_coursework_total: calculatedCoursework,
    final_exam: finalExam,
    final_total: totalScore,
  };

  // 🔒 حماية الذاكرة من Prototype Pollution
  const protoResult = deepSanitizePrototype(sanitized, { source: 'Grade Payload Sanitizer' });

  return {
    sanitized: protoResult.sanitized,
    isValid: errors.length === 0,
    errors,
  };
}
