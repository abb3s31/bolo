'use client'; // ⚡ ينفذ على جهة العميل بمتصفح المستخدم

// 📊 مكون نوافذ تعليمات وتقرير استيراد ملفات الإكسل للمواد
// 🇮🇶 توثيق عراقي سطر بسطر والتزام نمطي صارم بدون any أو unknown

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import { BookOpen, FileSpreadsheet, Download, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react'; // 🎨 أيقونات لوسيد

// 📋 واجهة تقرير استيراد المواد
export interface CourseImportSummaryReport {
  totalRows: number;
  accepted: { name: string; dept: string; code: string }[];
  duplicates: { name: string; code: string; dept: string; reason: string }[];
  rejected: { rowNumber: number; rawName: string; reason: string }[];
}

// 📋 واجهة خصائص نوافذ إكسل المواد
export interface AdminCourseExcelModalsProps {
  showExcelInstructions: boolean; // ℹ️ حالة فتح نافذة التعليمات
  setShowExcelInstructions: (open: boolean) => void; // 🔄 دالة فتح وإغلاق التعليمات
  handleDownloadTemplate: () => void; // 📥 دالة تنزيل قالب الإكسل
  importReport: CourseImportSummaryReport | null; // 📊 كائن تقرير نتائج الاستيراد
  setImportReport: (report: CourseImportSummaryReport | null) => void; // 🔄 دالة تصفير التقرير
  activeReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 التبويب النشط
  setActiveReportTab: (tab: 'accepted' | 'duplicates' | 'rejected') => void; // 🔄 دالة تبديل التبويب
}

// 🏛️ مكون نوافذ إكسل المواد الشاملة
export const AdminCourseExcelModals: React.FC<AdminCourseExcelModalsProps> = ({
  showExcelInstructions,
  setShowExcelInstructions,
  handleDownloadTemplate,
  importReport,
  setImportReport,
  activeReportTab,
  setActiveReportTab,
}) => {
  return (
    <>
      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel للمواد لكافة أقسام الجامعة */}
      {showExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <BookOpen className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد المواد والمناهج الأكاديمية</h3>
                  <p className="text-sm font-black text-slate-950 mt-0.5">جامعة الإمام جعفر الصادق (ع) - فرع ميسان | المنظومة المركزية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-950 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. اسم المادة الدراسية بالعربية *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة كائنية التوجه، تراكيب البيانات).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. القسم العلمي التابع له *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  حقل إلزامي. اكتب اسم القسم العلمي المطابق للأقسام المعتمدة بالجامعة (من ورقة قائمة_الأقسام_المعتمدة).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. رمز المادة (الكود الأكاديمي):</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اختياري (مثال: CS201). في حال تركه فارغاً سيقوم النظام بتوليد رمز أكاديمي نظامي تلقائياً.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الكورس (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>5. نوع المادة والساعات ECTS *:</span>
                </div>
                <p className="text-sm text-slate-950 font-black mr-7">
                  اكتب (نظري وعملي) للمواد التي تشمل مختبر، أو (نظري فقط). واكتب ساعات الـ ECTS من 1 إلى 15 (الافتراضي 3).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-slate-300"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#163a5f]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للمواد (المقبول والمكرر والمرفوض) */}
      {importReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد المواد والمناهج ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-black text-slate-950">
                    تم فحص أسماء المواد والأقسام العلمية والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {importReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {activeReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المواد التي تم قبولها وإضافتها بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-950 font-black mx-1.5">•</span>
                            <span className="text-slate-950 font-black">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المواد المكررة المستبعدة لوجودها مسبقاً في القسم:</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">رائع! لم يتم رصد أي مواد مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعها منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {importReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">الصف {item.rowNumber}:</span>
                            <span className="text-slate-950 font-black mx-1.5">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-bold">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#163a5f]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
