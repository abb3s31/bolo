// ⚙️ إعدادات Next.js الرسمية المحصنة أمنياً بنموذج Zero Trust لجامعة الإمام جعفر الصادق (ع)
import type { NextConfig } from "next"; // 🔗 نوع الإعدادات

const nextConfig: NextConfig = {
  // 🛡️ السماح لجميع أجهزة الشبكة المحلية (الموبايل والكومبيوتر) بالوصول لملفات الجافاسكربت بدون حظر أمني
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.0.185:3000',
    '192.168.0.185',
    '192.168.*',
    '10.*',
    '172.16.*',
  ],

  // 🕵️ إخفاء هوية وبصمة الخادم عن أدوات الفحص والاستكشاف الأمني
  poweredByHeader: false,

  // 🔒 ترويسات الأمان الصارمة للخادم (Zero Trust Hardened HTTP Security Headers)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // 🛑 منع تضمين الموقع داخل Iframe لمنع هجمات Clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // 🛑 منع المتصفح من تخمين نوع الملفات وتجاوز الحماية
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // 🛡️ حماية خصوصية الروابط
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()', // 🛑 حظر الوصول للأجهزة الحساسة
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // 🛡️ تفعيل حماية المتصفح ضد هجمات XSS
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload', // 🔒 إجبار تشفير HTTPS وحماية HSTS
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none', // 🛑 منع ملفات crossdomain.xml
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none';", // 🛡️ سياسة أمان المحتوى الصارمة
          },
        ],
      },
    ];
  },
};

export default nextConfig;
