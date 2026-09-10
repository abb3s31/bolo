'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import {
  FileSpreadsheet, // 📊 أيقونة الإكسل
  BookOpen, // 📖 أيقونة المواد
  Calendar, // 📅 أيقونة الجدول والتقويم
  X, // ❌ أيقونة الإغلاق
  CheckCircle2, // ✅ أيقونة النجاح
  AlertCircle, // ⚠️ أيقونة التنبيه
  AlertTriangle, // ⚠️ أيقونة التحذير
  Download, // 📥 أيقونة التنزيل
  Sparkles, // ✨ أيقونة التمييز
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد

// 📊 واجهة تقرير نتائج استيراد الإكسل
export interface ImportSummaryReport {
  totalRows: number; // 🔢 إجمالي الصفوف المعالجة
  accepted: { name: string; dept: string; email: string }[]; // ✅ الصفوف المقبولة
  duplicates: { name: string; email: string; dept: string; reason: string }[]; // ⚠️ الصفوف المكررة
  rejected: { rowNumber: number; rawName: string; reason: string }[]; // ❌ الصفوف المرفوضة
}

// 📋 واجهة خصائص مودالات إرشادات وتقارير الإكسل الشاملة
export interface DepartmentExcelModalsProps {
  deptName: string; // 🏢 اسم القسم

  // 👨‍🏫 مودالات الأساتذة
  showExcelInstructions: boolean; // 👁️ فتح إرشادات أساتذة
  setShowExcelInstructions: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الفتح
  importReport: ImportSummaryReport | null; // 📊 تقرير أساتذة
  setImportReport: React.Dispatch<React.SetStateAction<ImportSummaryReport | null>>; // 🔄 تحديث التقرير
  activeReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 تبويب التقرير النشط
  setActiveReportTab: React.Dispatch<React.SetStateAction<'accepted' | 'duplicates' | 'rejected'>>; // 🔄 تحديث التبويب
  handleDownloadTeacherTemplate: () => Promise<void> | void; // 📥 تنزيل قالب الأساتذة

  // 🎓 مودالات الطلاب
  showStudentExcelInstructions: boolean; // 👁️ فتح إرشادات الطلاب
  setShowStudentExcelInstructions: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الفتح
  studentImportReport: ImportSummaryReport | null; // 📊 تقرير الطلاب
  setStudentImportReport: React.Dispatch<React.SetStateAction<ImportSummaryReport | null>>; // 🔄 تحديث التقرير
  studentActiveReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 تبويب تقرير الطلاب
  setStudentActiveReportTab: React.Dispatch<React.SetStateAction<'accepted' | 'duplicates' | 'rejected'>>; // 🔄 تحديث التبويب
  handleDownloadStudentTemplate: () => Promise<void> | void; // 📥 تنزيل قالب الطلاب

  // 📚 مودالات المواد
  showCourseExcelInstructions: boolean; // 👁️ فتح إرشادات المواد
  setShowCourseExcelInstructions: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الفتح
  courseImportReport: ImportSummaryReport | null; // 📊 تقرير المواد
  setCourseImportReport: React.Dispatch<React.SetStateAction<ImportSummaryReport | null>>; // 🔄 تحديث التقرير
  courseActiveReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 تبويب تقرير المواد
  setCourseActiveReportTab: React.Dispatch<React.SetStateAction<'accepted' | 'duplicates' | 'rejected'>>; // 🔄 تحديث التبويب
  handleDownloadCourseTemplate: () => Promise<void> | void; // 📥 تنزيل قالب المواد

  // 🕒 مودالات الجدول الأسبوعي
  showScheduleExcelInstructions: boolean; // 👁️ فتح إرشادات الجدول
  setShowScheduleExcelInstructions: React.Dispatch<React.SetStateAction<boolean>>; // 🔄 تحديث الفتح
  scheduleImportReport: ImportSummaryReport | null; // 📊 تقرير الجدول
  setScheduleImportReport: React.Dispatch<React.SetStateAction<ImportSummaryReport | null>>; // 🔄 تحديث التقرير
  scheduleActiveReportTab: 'accepted' | 'duplicates' | 'rejected'; // 📑 تبويب تقرير الجدول
  setScheduleActiveReportTab: React.Dispatch<React.SetStateAction<'accepted' | 'duplicates' | 'rejected'>>; // 🔄 تحديث التبويب
  handleDownloadScheduleTemplate: () => Promise<void> | void; // 📥 تنزيل قالب الجدول
}

// 🏛️ مكون مودالات إرشادات وتقارير استيراد الإكسل الشاملة للقسم
export const DepartmentExcelModals: React.FC<DepartmentExcelModalsProps> = ({
  deptName,

  showExcelInstructions,
  setShowExcelInstructions,
  importReport,
  setImportReport,
  activeReportTab,
  setActiveReportTab,
  handleDownloadTeacherTemplate,

  showStudentExcelInstructions,
  setShowStudentExcelInstructions,
  studentImportReport,
  setStudentImportReport,
  studentActiveReportTab,
  setStudentActiveReportTab,
  handleDownloadStudentTemplate,

  showCourseExcelInstructions,
  setShowCourseExcelInstructions,
  courseImportReport,
  setCourseImportReport,
  courseActiveReportTab,
  setCourseActiveReportTab,
  handleDownloadCourseTemplate,

  showScheduleExcelInstructions,
  setShowScheduleExcelInstructions,
  scheduleImportReport,
  setScheduleImportReport,
  scheduleActiveReportTab,
  setScheduleActiveReportTab,
  handleDownloadScheduleTemplate,
}) => {
  return (
    <>
      {showExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد كادر التدريسيين</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. حقل الاسم الثلاثي واللقب الأكاديمي:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  إلزامي لكل أستاذ (مثال: أ.د. كرار جاسم المحمداوي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. حقل البريد الأكاديمي وكلمة المرور:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك تركهما فارغين وسيقوم النظام تلقائياً بتوليد بريد أكاديمي فريد (@sadiq.edu.iq) ورمز دخول معقد فريد 100% بدون أي تكرار.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. حقل الجنس:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.
                </p>
              </div>
            </div>

            {/* 🔘 أزرار التفاعل السفلية بالنافذة المنبثقة */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200"> {/* 📦 حاوية أزرار الفوتر المتناسقة */}
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button" // 🛑 نوع الزر لمنع التقديم
                onClick={handleDownloadTeacherTemplate} // ⚡ دالة تنزيل نموذج الأساتذة
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95" // 👑 تصميم كحلي ملكي
              >
                <Download className="w-4 h-4 text-cyan-300" /> {/* 📥 أيقونة التنزيل الفيكتور */}
                <span>تنزيل النموذج المعتمد</span> {/* 🏷️ نص التنزيل */}
              </button>

              <button
                type="button"
                onClick={() => setShowExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للأساتذة (المقبول والمكرر والمرفوض) */}
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
                    تقرير نتائج استيراد كادر التدريسيين ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص الأسماء والبيانات والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
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

              {/* المكرر (استبعاد وردي/أحمر) */}
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
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (مستبعد)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض (استبعاد وردي/أحمر) */}
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
                    <span>قائمة الأساتذة الذين تم قبولهم وإضافتهم للقسم بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
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

              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الأساتذة الذين تم استبعادهم لوجود تكرار (عذراً، هذا الاسم موجود مسبقاً):</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي أسماء مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم استبعاده منعاً للتكرار
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

              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية البيانات (يجب تصحيحها في الملف):</span>
                  </h4>
                  {importReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
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
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لطلبة القسم */}
      {showStudentExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد طلبة القسم</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3.5 text-base font-black text-slate-900 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. حقل اسم الطالب:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  إلزامي، يرجى كتابة الاسم الثلاثي أو الرباعي للطالب/ـة (مثال: حيدر مهدي صادق الموسوي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. حقل المرحلة الدراسية:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. حقل البريد الأكاديمي وكلمة المرور:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك تركهما فارغين وسيقوم النظام تلقائياً بتوليد بريد أكاديمي رسمي فريد (@sadiq.edu.iq) ورمز دخول معقد فريد 100% بدون أي تكرار.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. حقل الجنس:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (ذكر) أو (أنثى)، أو سيقوم النظام بالتعرف الذكي التلقائي من الاسم الثلاثي.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadStudentTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStudentExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel لطلبة القسم (المقبول والمكرر والمرفوض) */}
      {studentImportReport && (
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
                    تقرير نتائج استيراد طلبة القسم ({studentImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص الأسماء والمراحل والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStudentImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {studentImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {studentImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setStudentActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  studentActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {studentImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {studentActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة الطلبة الذين تم قبولهم وإضافتهم للقسم بنجاح:</span>
                  </h4>
                  {studentImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
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

              {studentActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الطلبة الذين تم منعهم واستبعادهم لوجود تكرار في القسم:</span>
                  </h4>
                  {studentImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي أسماء مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
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

              {studentActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {studentImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {studentImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
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
                onClick={() => setStudentImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel للمواد والمقررات الدراسية */}
      {showCourseExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <BookOpen className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد المواد والمناهج</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-900 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>1. اسم المادة الدراسية بالعربية *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي بالعربية (مثال: البرمجة كائنية التوجه، تراكيب البيانات).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>2. رمز المادة (الكود الأكاديمي):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياري (مثال: CS201). في حال تركه فارغاً سيقوم النظام بتوليد رمز أكاديمي نظامي تلقائياً.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>3. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الكورس (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>4. نوع المادة والساعات ECTS *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (نظري وعملي) للمواد التي تشمل مختبر، أو (نظري فقط). واكتب ساعات الـ ECTS من 1 إلى 15 (الافتراضي 3).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>5. أستاذ النظري وأستاذ العملي:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اختياريان. يمكنك كتابة اسم الأستاذ المطابق من ورقة (قائمة_أساتذة_القسم) وسيتم تكليفه تلقائياً.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadCourseTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCourseExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel لمواد القسم (المقبول والمكرر والمرفوض) */}
      {courseImportReport && (
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
                    تقرير نتائج استيراد المواد والمقررات ({courseImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص المواد والمراحل والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCourseImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {courseImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {courseImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setCourseActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  courseActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {courseImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {courseActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المواد التي تم قبولها وإضافتها بنجاح:</span>
                  </h4>
                  {courseImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
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

              {courseActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المواد المكررة المستبعدة لوجودها مسبقاً في القسم:</span>
                  </h4>
                  {courseImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي مواد مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name}</span>
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

              {courseActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {courseImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {courseImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
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
                onClick={() => setCourseImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لمحاضرات الجدول الأسبوعي */}
      {showScheduleExcelInstructions && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <Calendar className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">تعليمات وضوابط استيراد الجدول الأسبوعي</h3>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">جامعة الإمام جعفر الصادق (ع) - قسم {deptName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleExcelInstructions(false)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 text-base font-black text-slate-900 leading-relaxed max-h-[60vh] overflow-y-auto pl-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>1. اسم المادة الدراسية *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  حقل إلزامي. اكتب اسم المادة الرسمي كما هو مسجل في ورقة (قائمة_مواد_القسم) أو اكتب رمزها الأكاديمي.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>2. المرحلة الدراسية والكورس *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب رقم المرحلة من (1) إلى (4)، ورقم الفصل (1) للكورس الأول أو (2) للكورس الثاني.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>3. الفترة الدراسية واليوم الأسبوعي *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب (صباحي) أو (مسائي)، واكتب اليوم بالعربية: (السبت، الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>4. التوقيت (البدء والانتهاء) *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب التوقيت بصيغة 12 ساعة (مثال: 08:30 ص أو 02:00 م) أو بصيغة 24 ساعة (مثال: 08:30 أو 14:00).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>5. القاعة / المختبر وطبيعة المحاضرة *:</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  اكتب اسم القاعة أو المختبر (مثال: قاعة 101، مختبر الحاسوب 1). واكتب طبيعة المحاضرة: (محاضرة نظرية) أو (مختبر وتطبيق عملي).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                  <span>6. الأستاذ المحاضر (اختياري):</span>
                </div>
                <p className="text-sm text-slate-700 font-bold mr-7">
                  يمكنك كتابة اسم الأستاذ المطابق من ورقة (قائمة_أساتذة_القسم) ليتم ربطه بالمحاضرة وجدوله الشخصي تلقائياً.
                </p>
              </div>

              <div className="p-4 bg-blue-50/70 border-2 border-blue-300 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-black">
                  <Sparkles className="w-5 h-5 text-blue-700" />
                  <span>7. الأسبوع الدراسي وتاريخ المحاضرة (مسار بولونيا 15 أسبوعاً):</span>
                </div>
                <p className="text-sm text-slate-800 font-bold mr-7">
                  حقل اختياري. يمكنك كتابة رقم الأسبوع من (1) إلى (15)، وتاريخ المحاضرة بصيغة (YYYY-MM-DD). عند تحديد تاريخ الأسبوع الأول، يقوم النظام تلقائياً بتوليد تواريخ كافة الأسابيع الـ 15 (+7 أيام لكل أسبوع) وربطها بسجلات الحضور والغياب.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* 📥 زر تنزيل النموذج المعتمد بتصميم كحلي ملكي وأيقونة سماوية فاخرة */}
              <button
                type="button"
                onClick={handleDownloadScheduleTemplate}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition flex items-center gap-2 cursor-pointer border border-[#0F2942] shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4 text-cyan-300" />
                <span>تنزيل النموذج المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleExcelInstructions(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 نافذة تقرير نتائج استيراد Excel للجدول الأسبوعي (المقبول والمكرر والمرفوض) */}
      {scheduleImportReport && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200">
                  <FileSpreadsheet className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد الجدول الأسبوعي ({scheduleImportReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">
                    قسم {deptName} - تم فحص المحاضرات والقاعات والمواقيت والتحقق من عدم التضارب والتكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScheduleImportReport(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {scheduleImportReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {scheduleImportReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setScheduleActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  scheduleActiveReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {scheduleImportReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {scheduleActiveReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة المحاضرات التي تم قبولها وإدراجها في الجدول بنجاح:</span>
                  </h4>
                  {scheduleImportReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-500 font-bold mx-1.5">•</span>
                            <span className="text-slate-700">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs w-fit" dir="rtl">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleActiveReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة المحاضرات المكررة المستبعدة لمنع تضارب الجداول:</span>
                  </h4>
                  {scheduleImportReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">رائع! لم يتم رصد أي محاضرات مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم الاستبعاد منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} — ({item.email})
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleActiveReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {scheduleImportReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-600 font-bold py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {scheduleImportReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-700">الصف {item.rowNumber}:</span>
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
                onClick={() => setScheduleImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-base transition cursor-pointer border border-[#0F2942]"
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

export default DepartmentExcelModals; // 🚀 تصدير المكون كافتراضي
