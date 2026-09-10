'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📜 تبويب سجل التدقيق والحركات الأكاديمية لمادة التدريسي
import React from 'react'; // 🔗 مكتبة رياكت
import { History, ShieldCheck } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
import { AuditLog } from '@/types'; // 🔗 واجهة سجل التدقيق الصارمة

// 📋 واجهة خصائص تبويب التدقيق
interface CourseAuditTabProps {
  auditLogs: AuditLog[]; // 📜 مصفوفة سجلات التدقيق
  courseId: string; // 🆔 معرف المادة
  courseName: string; // 📚 اسم المادة
}

// 📦 المكون المستقل لتبويب سجل التدقيق
export default function CourseAuditTab({
  auditLogs, // 📜 السجلات
  courseId, // 🆔 معرف المادة
  courseName // 📚 اسم المادة
}: CourseAuditTabProps) {
  // 🔍 تصفية السجلات المرتبطة بهذه المادة تحديداً
  const filteredLogs = auditLogs.filter(
    (a) => a.course_id === courseId || a.course_name === courseName
  ); // 📑 السجلات المفلترة

  return (
    // 📦 الحاوية البيضاء لتبويب سجل التدقيق
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-right" dir="rtl">
      {/* 🏷️ هيدر التبويب مع الإحصائية */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shrink-0">
            <History className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-950">سجل التدقيق والحركات الأكاديمية (Audit Trail)</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600">توثيق زمني غير قابل للتعديل لكافة عمليات الرصد والتعديل على درجات المادة</p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 font-black text-sm rounded-xl border border-slate-200">
          إجمالي الحركات: {filteredLogs.length} عملية
        </span>
      </div>

      {/* 📜 قائمة السجلات الموثقة زمنياً */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto space-y-1">
        {filteredLogs.map((log) => (
          <div key={log.id} className="py-3.5 px-3 rounded-2xl hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-black">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200 text-xs font-black">
                  {log.action}
                </span>
                <span className="text-slate-950 font-black text-sm">{log.details}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-black text-slate-700 shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-900 font-black">
                {log.actor_name || log.user_name || 'أستاذ المادة'}
              </span>
              <span className="text-slate-600 font-mono" dir="ltr">
                {new Date(log.created_at).toLocaleString('ar-IQ-u-nu-latn')}
              </span>
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck className="w-12 h-12 text-emerald-700 mx-auto" />
            <p className="text-slate-950 font-black text-base">
              سجل الأمان فارغ ومستقر. لم يتم تسجيل أي تعديلات أو حركات على هذه المادة بعد.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
