// 🛡️ وسيط الأمان وحارس الطلبات على مستوى الخادم والـ Edge (Zero Trust Edge Security Middleware)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { NextResponse } from 'next/server'; // 📦 استجابة نكست
import type { NextRequest } from 'next/server'; // 🔗 نوع الطلب

// 🚫 مصفوفة التواقيع الهجومية السريعة عند الـ Edge (Fast Edge WAF Filter)
const EDGE_FORBIDDEN_PATTERNS = [
  /\.\./,                                       // 🛑 Path Traversal
  /<script/i,                                   // 🛑 XSS Tag
  /%3cscript/i,                                 // 🛑 Encoded XSS Tag
  /\/etc\/passwd/i,                             // 🛑 LFI Linux
  /\/win\.ini/i,                                // 🛑 LFI Windows
  /\bunion\b[\s\S]*?\bselect\b/i,               // 🛑 SQLi
  /\bselect\b[\s\S]*?\bfrom\b/i,                 // 🛑 SQLi
  /(?:;\s*(?:cat|ls|pwd|whoami|powershell)\b)/i, // 🛑 RCE
  /(?:\.env|\.git|\.docker|backup\.sql|dump\.sql)/i, // 🛑 Sensitive Files
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl; // 🛣️ المسار والاستعلام المطلوب
  const fullUrl = `${pathname}${search}`; // 🔗 الرابط الكامل

  // 🔒 1. إنتاج معرف أمني فريد لتتبع الجلسات والتحقيقات الجنائية
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 🛑 2. فحص الرابط والاستعلام مقابل قواعد Edge WAF السريعة
  for (const pattern of EDGE_FORBIDDEN_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Access Denied - Edge WAF Security Filter Triggered',
          requestId,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Id': requestId,
            'X-WAF-Block': '1',
          },
        }
      );
    }
  }

  // 🛡️ 3. تجهيز استجابة الطلب مع ترويسات الأمان الصارمة
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Zero-Trust-Verified', '1');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

// 🎯 المسارات التي يراقبها الوسيط
export const config = {
  matcher: [
    /*
     * تطبيق الفحص على كافة المسارات باستثناء ملفات الاستاتيك والصور والأيقونات
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.webp).*)',
  ],
};
