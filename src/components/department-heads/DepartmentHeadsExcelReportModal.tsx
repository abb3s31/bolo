'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📊 مودال تقرير نتائج استيراد ملف Excel لرؤساء الأقسام والمقررين
import React from 'react'; // 🔗 مكتبة رياكت
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle 
} from 'lucide-react'; // 🎨 أيقونات الإحصائيات والتنبيهات

// 📋 واجهة بيانات ملخص استيراد الإكسل
export interface ImportSummaryReport {
  totalRows: number; // 🔢 إجمالي عدد الصفوف المقروءة من الملف
  accepted: { name: string; role: string; dept: string; email: string }[]; // ✅ الحسابات المقبولة
  duplicates: { name: string; email: string; role: string; dept: string; reason: string }[]; // ⚠️ الحسابات المكررة والممنوعة
  rejected: { rowNumber: number; rawName: string; reason: string }[]; // ❌ الصفوف المرفوضة لخلل بالبيانات
}

// 📋 واجهة خصائص المكون
interface DepartmentHeadsExcelReportModalProps {
  report: ImportSummaryReport; // 📊 كائن التقرير المحتوي على النتائج
  activeReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 التبويب النشط حالياً
  setActiveReportTab: (tab: 'accepted' | 'duplicates' | 'rejected') => void; // 🔄 دالة تغيير التبويب
  onClose: () => void; // 🚪 دالة إغلاق النافذة
}

// 📦 المكون الرئيسي لنافذة التقرير
export default function DepartmentHeadsExcelReportModal({
  report, // 📊 التقرير
  activeReportTab, // 📑 التبويب
  setActiveReportTab, // 🔄 تغيير التبويب
  onClose // 🚪 دالة الإغلاق
}: DepartmentHeadsExcelReportModalProps) {
  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
      {/* 📦 حاوية المودال البيضاء بحدود وظلال فاخرة */}
      <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
        
        {/* 🏷️ عنوان التقرير والأيقونة وزر الإغلاق */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          {/* 📌 تفاصيل العنوان */}
          <div className="flex items-center gap-3">
            {/* 📊 أيقونة ملف الإكسل */}
            <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            {/* 📝 العناوين */}
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                تقرير نتائج استيراد ملف Excel ({report.totalRows} صف تمت معالجته)
              </h3>
              <p className="text-sm font-black text-slate-950">
                تم فحص كافة البيانات والتحقق الصارم من عدم التكرار
              </p>
            </div>
          </div>
          {/* ❌ زر الإغلاق */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق النافذة
            className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer" // 🎨 التنسيق
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 🔘 أزرار التبويبات الثلاثة للإحصائيات: المقبول، المكرر، المرفوض */}
        <div className="grid grid-cols-3 gap-3">
          {/* 🟢 تبويب الحسابات المقبولة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setActiveReportTab('accepted')} // 🔄 تفعيل تبويب المقبول
            className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
              activeReportTab === 'accepted'
                ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
            }`} // 🎨 ستايل التبويب النشط
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {report.accepted.length}
            </div>
          </button>

          {/* 🟡 تبويب الحسابات المكررة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setActiveReportTab('duplicates')} // 🔄 تفعيل تبويب المكرر
            className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
              activeReportTab === 'duplicates'
                ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
            }`} // 🎨 ستايل التبويب
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (تم استبعاده)</span>
              <AlertTriangle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1">
              {report.duplicates.length}
            </div>
          </button>

          {/* 🔴 تبويب الصفوف المرفوضة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setActiveReportTab('rejected')} // 🔄 تفعيل تبويب المرفوض
            className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
              activeReportTab === 'rejected'
                ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
            }`} // 🎨 ستايل التبويب
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
              <AlertCircle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1">
              {report.rejected.length}
            </div>
          </button>
        </div>

        {/* 📑 تفاصيل التبويب النشط */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
          
          {/* ✅ عرض المقبولين */}
          {activeReportTab === 'accepted' && (
            <div className="space-y-2">
              <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>قائمة الحسابات التي تم قبولها وإضافتها لقاعدة البيانات بنجاح:</span>
              </h4>
              {report.accepted.length === 0 ? (
                <p className="text-sm text-slate-950 font-black py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {report.accepted.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                      <div>
                        <span className="text-slate-950 font-black">{item.name}</span>
                        <span className="text-slate-950 font-black mx-1.5">•</span>
                        <span className="text-indigo-950">{item.role}</span>
                        <span className="text-slate-950 font-black mx-1.5">•</span>
                        <span className="text-slate-950 font-black">{item.dept}</span>
                      </div>
                      <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                        {item.email}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⚠️ عرض المكررين */}
          {activeReportTab === 'duplicates' && (
            <div className="space-y-2">
              <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span>قائمة الحسابات التي تم منعها واستبعادها لوجود تكرار:</span>
              </h4>
              {report.duplicates.length === 0 ? (
                <p className="text-sm text-slate-950 font-black py-2">رائع! لم يتم رصد أي حسابات مكررة في الملف.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {report.duplicates.map((item, idx) => (
                    <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-950 font-black">{item.name} ({item.role} - {item.dept})</span>
                        <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                          تم منعه منعاً للتكرار
                        </span>
                      </div>
                      <p className="text-xs text-rose-900 font-bold">
                        السبب: {item.reason} {item.email !== '—' && `(${item.email})`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ❌ عرض المرفوضين */}
          {activeReportTab === 'rejected' && (
            <div className="space-y-2">
              <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
              </h4>
              {report.rejected.length === 0 ? (
                <p className="text-sm text-slate-950 font-black py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {report.rejected.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                      <div>
                        <span className="text-slate-950 font-black">الصف رقم {item.rowNumber}: </span>
                        <span className="text-slate-950 font-black">{item.rawName}</span>
                      </div>
                      <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-black">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* 🚪 زر الإغلاق النهائي */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 استدعاء دالة الإغلاق
            className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer shadow-xs border border-[#1e4570]" // 🎨 كحلي ملكي
          >
            إغلاق التقرير ومتابعة العمل
          </button>
        </div>

      </div>
    </div>
  );
}
