// 🛡️ درع مكافحة برامج الاختراق وأدوات الفحص والتحليل الأمني (Anti-Hacking & Anti-Reconnaissance Shield)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from './audit-guardian'; // 📊 تسجيل الإنذارات الأمنية

// 🚫 مصفوفة تواقيع برامج الاختراق وأدوات مسح الثغرات (Hacking & Scanner Tool Signatures)
const HACKING_TOOL_SIGNATURES: Array<{ name: string; pattern: RegExp; category: string }> = [
  // 1️⃣ أدوات فحص ومسح الثغرات الشاملة
  { name: 'Burp Suite Scanner', pattern: /burp(?:suite|collaborator|proxy)/i, category: 'Vulnerability Scanner' },
  { name: 'OWASP ZAP', pattern: /owasp_zap|zaproxy/i, category: 'Vulnerability Scanner' },
  { name: 'Nuclei Scanner', pattern: /nuclei/i, category: 'Vulnerability Scanner' },
  { name: 'Nikto Web Scanner', pattern: /nikto/i, category: 'Vulnerability Scanner' },
  { name: 'Acunetix WVS', pattern: /acunetix|wvs/i, category: 'Vulnerability Scanner' },
  { name: 'Nessus Scanner', pattern: /nessus/i, category: 'Vulnerability Scanner' },
  { name: 'OpenVAS', pattern: /openvas/i, category: 'Vulnerability Scanner' },
  { name: 'Arachni Scanner', pattern: /arachni/i, category: 'Vulnerability Scanner' },
  { name: 'Skipfish', pattern: /skipfish/i, category: 'Vulnerability Scanner' },
  { name: 'WPScan', pattern: /wpscan/i, category: 'CMS Scanner' },

  // 2️⃣ أدوات حقن قواعد البيانات الآلية (SQL Injection Exploitation Tools)
  { name: 'SQLMap Automator', pattern: /sqlmap/i, category: 'SQLi Exploit' },
  { name: 'Havij SQL Injector', pattern: /havij/i, category: 'SQLi Exploit' },
  { name: 'BBQSQL Injector', pattern: /bbqsql/i, category: 'SQLi Exploit' },
  { name: 'NoSQLMap', pattern: /nosqlmap/i, category: 'SQLi Exploit' },

  // 3️⃣ أدوات التخمين واكتشاف المسارات الحساسة (Directory Fuzzers & Brute-Forcers)
  { name: 'Gobuster Fuzzer', pattern: /gobuster/i, category: 'Directory Fuzzer' },
  { name: 'DirBuster', pattern: /dirbuster/i, category: 'Directory Fuzzer' },
  { name: 'FFuF Fast Fuzzer', pattern: /ffuf/i, category: 'Directory Fuzzer' },
  { name: 'WFuzz Fuzzer', pattern: /wfuzz/i, category: 'Directory Fuzzer' },
  { name: 'Feroxbuster', pattern: /feroxbuster/i, category: 'Directory Fuzzer' },
  { name: 'Dirsearch', pattern: /dirsearch/i, category: 'Directory Fuzzer' },

  // 4️⃣ أدوات التخمين العنيف وكسر كلمات المرور (Credential Brute-Forcers)
  { name: 'THC Hydra', pattern: /hydra/i, category: 'Password Brute-force' },
  { name: 'Medusa Brute-forcer', pattern: /medusa/i, category: 'Password Brute-force' },
  { name: 'Ncrack', pattern: /ncrack/i, category: 'Password Brute-force' },
  { name: 'Patator', pattern: /patator/i, category: 'Password Brute-force' },

  // 5️⃣ أدوات الكشط البرمجي المشبوهة
  { name: 'Python Requests Automated Probe', pattern: /python-requests|aiohttp|urllib/i, category: 'Automated Probe' },
  { name: 'Postman Probe', pattern: /postmanruntime/i, category: 'API Probe' },
];

// 🛑 قائمة المسارات الحساسة المحظورة قطعياً (Sensitive Paths Blacklist)
const SENSITIVE_PROBE_PATHS = [
  /^\/\.git/i,
  /^\/\.env/i,
  /^\/\.aws/i,
  /^\/\.docker/i,
  /^\/backup\.(?:sql|tar|zip|gz|bak)/i,
  /^\/dump\.(?:sql|tar|zip|gz)/i,
  /^\/database\.(?:sqlite|db)/i,
  /^\/phpmyadmin/i,
  /^\/adminer/i,
  /^\/wp-admin/i,
  /^\/wp-login\.php/i,
  /^\/actuator\//i,
  /^\/swagger\.json/i,
  /^\/api-docs/i,
  /^\/server-status/i,
  /^\/docker-compose\.yml/i,
  /^\/package\.json/i,
  /^\/tsconfig\.json/i,
];

// 📊 عدادات التخمين للعملاء (Strike Tracker: client -> strike count)
const probeStrikeTracker = new Map<string, { count: number; lastProbe: number }>();

// 🚫 القائمة السوداء الدائمة لبرامج الاختراق
const permanentBlacklist = new Set<string>();

// 🔍 واجهة نتيجة فحص برنامج الاختراق
export interface HackingCheckResult {
  isSafe: boolean;              // 🛡️ هل الطلب آمن وخالٍ من أدوات الاختراق
  toolName?: string;            // 🏷️ اسم الأداة المكتشفة إن وجدت
  category?: string;            // 📂 تصنيف الأداة
  details?: string;             // 📝 تفاصيل إضافية
}

// 🚀 1. دالة فحص وكشف أدوات الاختراق والفحص الأمني (Detect Hacking Tool)
export function detectHackingTool(
  userAgent: string | undefined | null,
  context: { actorEmail?: string; path?: string; clientIp?: string } = {}
): HackingCheckResult {
  if (!userAgent || typeof userAgent !== 'string') {
    return { isSafe: true };
  }

  const ua = userAgent.trim();
  const identifier = context.clientIp || context.actorEmail || 'unknown-client';

  // 🛑 1. فحص هل العميل في القائمة السوداء الدائمة
  if (permanentBlacklist.has(identifier)) {
    return {
      isSafe: false,
      toolName: 'Blacklisted Attacker',
      category: 'Permanent Ban',
      details: 'تم حظر هذا المصدر نهائياً لمحاولة استخدام أدوات فحص محظورة سابقاً.',
    };
  }

  // 🔍 2. مطابقة التواقيع مقابل قاعدة البيانات
  for (const { name, pattern, category } of HACKING_TOOL_SIGNATURES) {
    if (pattern.test(ua)) {
      // 🚨 تم رصد برنامج اختراق أو فحص ثغرات!
      permanentBlacklist.add(identifier);

      logSecurityEvent({
        eventType: 'HACKING_TOOL_DETECTED',
        actorEmail: context.actorEmail,
        targetEntity: context.path || 'مسار النظام',
        details: `⚔️ تم كشف واعتراض برنامج اختراق/فحص أمني [${name} - ${category}] بواسطة User-Agent: "${ua.substring(0, 70)}". تم إدراج المصدر في القائمة السوداء الدائمة.`,
        severity: 'CRITICAL',
      });

      return {
        isSafe: false,
        toolName: name,
        category,
        details: `تم كشف واعتراض أداة فحص واختراق غير مصرح بها (${name}).`,
      };
    }
  }

  return { isSafe: true };
}

// 🪤 2. دالة كشف استكشاف وتخمين المسارات الحساسة (Detect Sensitive Path Probe)
export function detectSensitivePathProbe(
  path: string,
  context: { actorEmail?: string; clientIp?: string } = {}
): { isBlocked: boolean; reason?: string } {
  if (!path || typeof path !== 'string') return { isBlocked: false };

  const cleanPath = path.trim().toLowerCase();
  const identifier = context.clientIp || context.actorEmail || 'unknown-prober';

  for (const pattern of SENSITIVE_PROBE_PATHS) {
    if (pattern.test(cleanPath)) {
      // 🚨 تم محاولة الوصول لملف حساس أو فحص بنية الخادم
      const now = Date.now();
      const strike = probeStrikeTracker.get(identifier) || { count: 0, lastProbe: now };
      
      strike.count++;
      strike.lastProbe = now;
      probeStrikeTracker.set(identifier, strike);

      logSecurityEvent({
        eventType: 'SENSITIVE_PROBE_DETECTED',
        actorEmail: context.actorEmail,
        targetEntity: cleanPath,
        details: `🪤 تم كشف محاولة استكشاف مسار حساس محظور [${cleanPath}] (المحاولة ${strike.count}/3).`,
        severity: strike.count >= 3 ? 'CRITICAL' : 'HIGH',
      });

      if (strike.count >= 3) {
        permanentBlacklist.add(identifier);
      }

      return {
        isBlocked: true,
        reason: 'تم حظر الوصول إلى هذا المسار الأمني المحمي.',
      };
    }
  }

  return { isBlocked: false };
}

// 🔒 3. دالة تطهير وحماية الذاكرة من هجمات Prototype Pollution
export function sanitizePrototypePollution<T>(input: T): T {
  if (!input || typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    const cleanArray = input.map((item) => sanitizePrototypePollution(item));
    return cleanArray as T;
  }

  const sanitized: Record<string, string | number | boolean | null | object> = {};
  const recordInput = input as Record<string, string | number | boolean | null | object>;

  for (const [key, value] of Object.entries(recordInput)) {
    // 🛑 حظر المفاتيح التي تستهدف تلويث الـ Prototype
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      logSecurityEvent({
        eventType: 'PROTOTYPE_POLLUTION_ATTEMPT',
        details: `🚨 تم كشف واعتراض محاولة تلويث النموذج الأولي للكائنات (Prototype Pollution Attack) عبر المفتاح [${key}].`,
        severity: 'CRITICAL',
      });
      continue; // تجاهل وحذف المفتاح فوراً
    }

    sanitized[key] = sanitizePrototypePollution(value);
  }

  return sanitized as T;
}

interface ExtendedBotWindow extends Window {
  cdc_adoQpoasnfa76pfcZLmcfl_Array?: object | boolean;
  _phantom?: boolean | object;
  __nightmare?: boolean | object;
  callPhantom?: Function;
  __selenium_evaluate?: Function | object;
  __webdriver_evaluate?: Function | object;
}

// 🤖 4. دالة كشف المتصفحات الوهمية وأطر الأتمتة (Detect Headless Browser & WebDriver)
export function detectHeadlessAutomation(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const nav = window.navigator as Navigator & { webdriver?: boolean };
    const win = window as ExtendedBotWindow;

    // 1. فحص خاصية webdriver الرسمية
    if (nav.webdriver === true) {
      logSecurityEvent({
        eventType: 'HEADLESS_BOT_DETECTED',
        details: '🤖 تم كشف جلسة متصفح مدارة عبر WebDriver أوتوماتيكي.',
        severity: 'HIGH',
      });
      return true;
    }

    // 2. فحص كائنات Puppeteer و Selenium و PhantomJS المحقونة
    if (
      win.cdc_adoQpoasnfa76pfcZLmcfl_Array ||
      win._phantom ||
      win.__nightmare ||
      win.callPhantom ||
      win.__selenium_evaluate ||
      win.__webdriver_evaluate
    ) {
      logSecurityEvent({
        eventType: 'HEADLESS_BOT_DETECTED',
        details: '🤖 تم كشف أطر أتمتة وكشط خفية (Selenium/Puppeteer/PhantomJS).',
        severity: 'CRITICAL',
      });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// 📜 5. لافتة التحذير والردع القانوني في كونسول المتصفح (Legal Security Console Watermark)
export function renderLegalSecurityBanner(): void {
  if (typeof window === 'undefined') return;

  const styleTitle = 'font-size: 16px; font-weight: bold; color: #ef4444; background: #1e1b4b; padding: 6px 12px; border-radius: 6px;';
  const styleBody = 'font-size: 12px; font-weight: bold; color: #38bdf8; background: #0f172a; padding: 6px 12px; border-radius: 4px;';

  console.log(
    '%c🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تحذير أمني رسمي',
    styleTitle
  );
  console.log(
    '%c🛡️ هذا النظام محمي ومحصن بأنظمة المراقبة الاستباقية والأمن السيبراني الحصين. يُحظر تماماً استخدام أي أدوات فحص أو مسح للثغرات أو برامج كشط آلية. كافة الأنشطة مراقبة ويتم توثيقها في سجل الرقابة الإلكتروني.',
    styleBody
  );
}
