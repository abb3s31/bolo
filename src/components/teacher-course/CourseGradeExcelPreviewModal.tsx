'use client'; // ⚡ ينفذ بجهة العميل في المتصفح

// 📊 مودال معاينة وتأكيد استيراد ملف Excel لدرجات المادة
import React from 'react'; // 🔗 مكتبة رياكت
import { FileText, X, CheckCircle2 } from 'lucide-react'; // 🎨 أيقونات التفاعل SVG
// 🎛️ أدوات معايير التقييم والتحقق من كون البند مفعل
import { getCourseAssessmentScheme, isAssessmentItemActive } from '@/lib/grade-utils'; // 🧮 استيراد فحص البند النشط

// 📋 واجهة خصائص المودال
interface CourseGradeExcelPreviewModalProps {
  rows: Record<string, string | number | null | undefined>[] | null; // 📑 صفوف ملف الإكسل المقروءة
  onClose: () => void; // ❌ دالة إغلاق النافذة
  courseName: string; // 📚 اسم المادة الدراسية
  isTheoryTeacher: boolean; // 👨‍🏫 هل هو أستاذ النظري
  isPracticalTeacher: boolean; // 🧪 هل هو أستاذ العملي
  isPracticalCourse: boolean; // 🔬 هل المادة تحتوي على عملي
  isFinalExamEnabled: boolean; // 📝 هل الفاينل مفعل
  isSupplementaryEnabled: boolean; // 🔄 هل الدور الثاني مفعل
  assessmentScheme: ReturnType<typeof getCourseAssessmentScheme>; // 🎛️ مخطط التقييم للمادة
  onConfirmImport: () => void; // ⚡ دالة تأكيد الاستيراد الفعلي
}

// 📦 المكون المستقل لمعاينة درجات الإكسل
export default function CourseGradeExcelPreviewModal({
  rows, // 📑 الصفوف
  onClose, // ❌ الإغلاق
  courseName, // 📚 اسم المادة
  isTheoryTeacher, // 👨‍🏫 النظري
  isPracticalTeacher, // 🧪 العملي
  isPracticalCourse, // 🔬 عملي
  isFinalExamEnabled, // 📝 النهائي
  isSupplementaryEnabled, // 🔄 الإكمال
  assessmentScheme, // 🎛️ المخطط
  onConfirmImport // ⚡ التأكيد
}: CourseGradeExcelPreviewModalProps) {
  // 🛡️ إذا لم تكن هناك بيانات لا نرسم المودال
  if (!rows) return null;

  // 🔍 دالة ذكية لمطابقة واستخراج قيمة الدرجة للخلية في المعاينة كما في دالة الاستيراد
  const getCellDisplay = (
    row: Record<string, string | number | null | undefined>,
    customTitle: string,
    maxScore: number,
    standardKey: string
  ): string => {
    const dynamicKey = `${customTitle} (${maxScore})`;
    if (row[dynamicKey] !== undefined && row[dynamicKey] !== null && row[dynamicKey] !== '') {
      return String(row[dynamicKey]);
    }
    if (row[standardKey] !== undefined && row[standardKey] !== null && row[standardKey] !== '') {
      return String(row[standardKey]);
    }
    const standardBase = standardKey.split(' ')[0];
    for (const k of Object.keys(row)) {
      if ((customTitle && k.includes(customTitle)) || (standardBase && k.includes(standardBase))) {
        const val = row[k];
        if (val !== undefined && val !== null && val !== '') return String(val);
      }
    }
    return '-';
  };

  // 🔍 فحص هل يحتوي ملف الإكسل على عمود الرقم الجامعي
  const hasUniNumber = rows.some(
    (r) => r['الرقم الجامعي'] || r['university_number'] || r['uni_num'] || r['الرقم_الجامعي']
  );

  return (
    // 🌌 خلفية معتمة تملأ كامل الشاشة مع تأثير زجاجي ناعم
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150" dir="rtl">
      {/* 📦 صندوق المودال الأبيض بحدود أنيقة */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl p-6 sm:p-8 space-y-5 text-right relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 🏷️ رأس نافذة المعاينة */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shrink-0">
              <FileText className="w-6 h-6 text-emerald-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">معاينة ومطابقة درجات ملف Excel لمادة ({courseName})</h3>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                تم العثور على ({rows.length}) سجل طالب جاهز للمطابقة والاستيراد
              </p>
            </div>
          </div>
          {/* ❌ زر إغلاق النافذة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer" // 🎨 التنسيق
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ℹ️ إحصائية وتنبيه الصلاحية أثناء الاستيراد */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-emerald-950 font-black text-sm sm:text-base">
              سيتم استيراد وتحديث درجات الطلبة وفق صلاحيتك الأكاديمية الحالية ({isTheoryTeacher && isPracticalTeacher ? 'النظري والعملي' : isTheoryTeacher ? 'النظري فقط' : 'العملي فقط'}).
            </span>
          </div>
        </div>

        {/* 📊 جدول معاينة الصفوف المستوردة من الإكسل */}
        <div className="overflow-x-auto overflow-y-auto border-2 border-slate-200 rounded-2xl flex-1 max-h-[45vh]">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-[#0F2942] text-white font-black text-xs sm:text-sm sticky top-0 z-10">
                <th className="p-3 border-l border-[#1e4570] text-center w-12">ت</th>
                {hasUniNumber && (
                  <th className="p-3 border-l border-[#1e4570] text-center font-mono">الرقم الجامعي</th>
                )}
                <th className="p-3 border-l border-[#1e4570]">اسم الطالب الرباعي</th>
                {/* 📝 إظهار عمود الكويز 1 فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.quiz1) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.quiz1.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.quiz1.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود الكويز 2 فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.quiz2) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.quiz2.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.quiz2.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود الواجب 1 فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.assignment1) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.assignment1.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.assignment1.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود الواجب 2 فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.assignment2) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.assignment2.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.assignment2.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود التقرير فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.report) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.report.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.report.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود النصفي فقط إذا كان البند مفتوحاً وغير معطل */}
                {isAssessmentItemActive(assessmentScheme.midterm) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.midterm.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.midterm.max_score})</div>
                  </th>
                )}
                {/* 🔬 إظهار عمود العملي فقط إذا كانت المادة عملية والبند مفتوح */}
                {isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical) && (
                  <th className="p-3 border-l border-[#1e4570] text-center">
                    <div>{assessmentScheme.practical.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.practical.max_score})</div>
                  </th>
                )}
                {/* 📝 إظهار عمود النهائي فقط إذا كان مفعلاً والبند مفتوح */}
                {isFinalExamEnabled && isAssessmentItemActive(assessmentScheme.final_exam) && (
                  <th className={`p-3 text-center ${isSupplementaryEnabled ? 'border-l border-[#1e4570]' : ''}`}>
                    <div>{assessmentScheme.final_exam.title_ar}</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">({assessmentScheme.final_exam.max_score})</div>
                  </th>
                )}
                {/* 🔄 عمود الدور الثاني */}
                {isSupplementaryEnabled && (
                  <th className="p-3 text-center">
                    <div>امتحان الدور الثاني</div>
                    <div className="text-[11px] font-mono font-bold text-emerald-300">(50)</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const stdName = String(row['اسم الطالب الرباعي'] || row['اسم الطالب'] || row['student_name'] || row['الاسم'] || row['std_name'] || '').trim();
                const uniNum = String(row['الرقم الجامعي'] || row['university_number'] || row['uni_num'] || row['الرقم_الجامعي'] || '').trim();
                return (
                  <tr key={idx} className={`border-b border-slate-200 font-black ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="p-2.5 border-l border-slate-200 text-center text-slate-700 font-mono">{idx + 1}</td>
                    {hasUniNumber && (
                      <td className="p-2.5 border-l border-slate-200 text-center font-mono font-bold text-slate-700">{uniNum || '—'}</td>
                    )}
                    <td className="p-2.5 border-l border-slate-200 text-slate-950 font-bold">{stdName || '—'}</td>
                    {/* 📝 خلية الكويز 1 تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.quiz1) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.quiz1.title_ar, assessmentScheme.quiz1.max_score, 'الكويز1 (5)')}</td>
                    )}
                    {/* 📝 خلية الكويز 2 تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.quiz2) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.quiz2.title_ar, assessmentScheme.quiz2.max_score, 'الكويز2 (5)')}</td>
                    )}
                    {/* 📝 خلية الواجب 1 تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.assignment1) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.assignment1.title_ar, assessmentScheme.assignment1.max_score, 'الواجب1 (5)')}</td>
                    )}
                    {/* 📝 خلية الواجب 2 تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.assignment2) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.assignment2.title_ar, assessmentScheme.assignment2.max_score, 'الواجب2 (5)')}</td>
                    )}
                    {/* 📝 خلية التقرير تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.report) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.report.title_ar, assessmentScheme.report.max_score, 'التقرير (10)')}</td>
                    )}
                    {/* 📝 خلية النصفي تظهر فقط إذا كان البند مفتوحاً */}
                    {isAssessmentItemActive(assessmentScheme.midterm) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.midterm.title_ar, assessmentScheme.midterm.max_score, 'الميدترم (10)')}</td>
                    )}
                    {/* 🔬 خلية العملي تظهر فقط إذا كانت المادة عملية والبند مفتوح */}
                    {isPracticalCourse && isAssessmentItemActive(assessmentScheme.practical) && (
                      <td className="p-2.5 border-l border-slate-200 text-center">{getCellDisplay(row, assessmentScheme.practical.title_ar, assessmentScheme.practical.max_score, 'العملي (10)')}</td>
                    )}
                    {/* 📝 خلية النهائي تظهر فقط إذا كان مفعلاً والبند مفتوح */}
                    {isFinalExamEnabled && isAssessmentItemActive(assessmentScheme.final_exam) && (
                      <td className={`p-2.5 text-center ${isSupplementaryEnabled ? 'border-l border-slate-200' : ''}`}>{getCellDisplay(row, assessmentScheme.final_exam.title_ar, assessmentScheme.final_exam.max_score, 'النهائي (50)')}</td>
                    )}
                    {/* 🔄 خلية الدور الثاني */}
                    {isSupplementaryEnabled && (
                      <td className="p-2.5 text-center">{getCellDisplay(row, 'الدور الثاني', 50, 'امتحان الدور الثاني (50)')}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🔘 فوتر تأكيد الاستيراد والإلغاء */}
        <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // 🚪 إغلاق
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-base font-black rounded-xl border border-slate-300 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button" // 🔘 نوع الزر
            onClick={onConfirmImport} // ⚡ تنفيذ الاستيراد
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95" // 🎨 أخضر فاخر
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>تأكيد واستيراد الدرجات الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}
