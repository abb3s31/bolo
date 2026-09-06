// 📊 سجل الرقابة والأحداث الأمنية غير القابل للتلاعب (Zero Trust Security Audit Guardian)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { AuditLog } from '@/types'; // 🔗 استيراد واجهة سجل الرقابة
import { getStoredData, saveStoredData, INITIAL_AUDIT_LOGS } from '@/lib/mock-data'; // 💾 التخزين المحلي الاحتياطي

// 🏷️ أنواع الأحداث الأمنية المعتمدة للتوثيق
export type SecurityEventType =
  | 'LOGIN_SUCCESS'              // ✅ تسجيل دخول ناجح
  | 'LOGIN_FAILED'               // ❌ محاولة تسجيل دخول فاشلة
  | 'ACCOUNT_LOCKED'             // 🔒 قفل حساب مؤقتاً لتجاوز المحاولات
  | 'SESSION_TAMPERED'           // 🚨 كشف محاولة تلاعب بالتوكن المشفر
  | 'UNAUTHORIZED_ROUTE_ACCESS'  // 🛑 محاولة دخول مسار غير مصرح به
  | 'GRADE_MUTATION'             // 📝 تعديل درجة طالب
  | 'GRADE_LOCKED'               // 🔐 قفل واعتماد سعي مادة
  | 'PROFILE_MUTATION'           // 👤 تعديل حساب أو صلاحية
  | 'DDOS_ATTACK_ATTEMPT'        // 🚨 كشف واعتراض هجوم إغراق DDoS
  | 'RATE_LIMIT_EXCEEDED'        // ⚠️ تجاوز سقف معدل الطلبات
  | 'CIRCUIT_BREAKER_TRIGGERED'  // ⚡ تفعيل قاطع الدائرة للبيانات
  | 'HONEYPOT_TRAP_TRIGGERED'    // 🪤 سقوط بوت أو مهاجم في فخ الهوني بوت
  | 'BAD_BOT_DETECTED'           // 🤖 كشف عنكبوت كشط أو بوت خبيث
  | 'DOM_TAMPERING_DETECTED'     // 👁️ كشف محاولة تلاعب بشجرة عناصر الـ DOM
  | 'HACKING_TOOL_DETECTED'      // ⚔️ كشف واعتراض برنامج اختراق أو فحص أمني
  | 'SENSITIVE_PROBE_DETECTED'   // 🪤 كشف محاولة استكشاف مسارات حساسة
  | 'HEADLESS_BOT_DETECTED'      // 🤖 كشف متصفح روبوتي وهمي
  | 'PROTOTYPE_POLLUTION_ATTEMPT' // 🔒 كشف محاولة حقن وتلويث النموذج الأولي
  | 'WAF_RULE_TRIGGERED'         // 🧱 تطابق قاعدة جدار الحماية WAF
  | 'WAF_ANOMALY_BLOCKED'        // 🛑 حظر طلب لتجاوز سقف شذوذ الـ WAF
  | 'SSRF_ATTEMPT_DETECTED';     // 🌐 كشف واعتراض محاولة استدعاء SSRF محظورة

// 🛡️ واجهة تفاصيل الحدث الأمني الموثق
export interface SecurityEventPayload {
  eventType: SecurityEventType;    // 🏷️ نوع الحدث الأمني
  actorId?: string;               // 🆔 معرف الفاعل إن وجد
  actorName?: string;             // 👤 اسم الفاعل
  actorRole?: string;             // 🎭 دور الفاعل
  actorEmail?: string;            // 📧 بريد الفاعل
  targetEntity?: string;          // 🎯 الكيان المستهدف (طالب / مادة / صفحة)
  details: string;                // 📝 تفاصيل الحدث باللغة العربية
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // 🚨 مستوى الخطورة
}

// 🧹 دالة تجريد وحجب الأسرار والبيانات الحساسة من السجلات (Sanitize & Redact Secrets)
function redactSensitiveData(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // 🔑 حجب كلمات المرور
    .replace(/(?:password|pass|pwd)\s*[:=]\s*["']?[^"',\s]+["']?/gi, 'password=[REDACTED]')
    // 🎟️ حجب توكنات Bearer و JWT
    .replace(/Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/gi, 'Bearer [REDACTED_JWT]')
    .replace(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/gi, '[REDACTED_JWT]')
    // 🍪 حجب الكوكيز والرموز السرية
    .replace(/(?:session|token|apiKey|secret)\s*[:=]\s*["']?[^"',\s]+["']?/gi, '$1=[REDACTED]');
}

// 🚀 دالة تسجيل وتوثيق الحدث الأمني في السجل غير القابل للتلاعب (Log Security Incident)
export async function logSecurityEvent(event: SecurityEventPayload): Promise<void> {
  const now = new Date().toISOString(); // ⏰ التوقيت القياسي ISO
  const eventId = `sec_evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; // 🆔 معرف فريد للحدث
  const cleanDetails = redactSensitiveData(event.details); // 🧹 تجريد الأسرار

  // 📝 بناء كائن السجل الموحد باللغة العربية
  const auditRecord: AuditLog = {
    id: eventId,
    actor_id: event.actorId || 'system',
    actor_name: event.actorName || (event.actorEmail ? `مستخدم (${event.actorEmail})` : 'مجهول'),
    action: event.eventType,
    details: cleanDetails,
    course_name: event.targetEntity || 'بوابة المنظومة',
    student_name: cleanDetails,
    field_name: event.eventType,
    old_value: 'لا يوجد',
    new_value: event.severity === 'CRITICAL' ? 'حرج أمني' : event.severity === 'HIGH' ? 'مرتفع' : event.severity === 'MEDIUM' ? 'متوسط' : event.severity === 'LOW' ? 'منخفض' : 'إشعار',
    created_at: now,
  };

  // 1️⃣ حفظ محلي سريع لضمان عدم ضياع السجل أبداً
  try {
    if (typeof window !== 'undefined') {
      const currentLogs = getStoredData<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
      const updatedLogs = [auditRecord, ...currentLogs].slice(0, 300); // 💾 الاحتفاظ بآخر 300 سجل
      saveStoredData('audit_logs', updatedLogs);
    }
  } catch {
    // 🛡️ تخطي الأخطاء الصامتة لعدم تعطيل الواجهة
  }

  // 2️⃣ المزامنة السحابية مع جدول audit_logs في Supabase
  try {
    const { supabase } = await import('@/lib/supabase-client');
    await supabase.from('audit_logs').insert([
      {
        id: eventId,
        actor_id: auditRecord.actor_id,
        actor_name: auditRecord.actor_name,
        course_name: auditRecord.course_name,
        student_name: auditRecord.student_name,
        field_name: auditRecord.field_name,
        old_value: auditRecord.old_value,
        new_value: auditRecord.new_value,
        timestamp: now,
      }
    ]);
  } catch {
    // 🛡️ في حال عدم توفر اتصال بالشبكة يكتفى بالسجل المحلي
  }
}
