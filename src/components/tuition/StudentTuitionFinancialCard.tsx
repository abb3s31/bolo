'use client'; // ⚡ ينفذ بالعميل على متصفح الطالب

// 💳 بطاقة الموقف المالي وسجل تسديد الأقساط الدراسية للطالب (StudentTuitionFinancialCard)
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import { StudentTuitionRecord, UserProfile } from '@/types'; // 🔗 الأنواع المحددة والصريحة
import { exportTuitionSettlementReceiptPDF, exportSingleTuitionReceiptPDF } from '@/lib/pdf-export'; // 📄 مصدّر سندات ووصولات التسديد PDF
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { getAcademicYear } from '@/lib/mock-data'; // 🗓️ العام الدراسي المعتمد
import { syncAcademicYearFromSupabase, subscribeToAcademicYearChanges } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية واشتراك البث الحي
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  ShieldCheck, 
  Receipt,
  Sun,
  Moon,
  Percent,
  Calendar,
  Clock
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG

interface StudentTuitionFinancialCardProps {
  student: UserProfile;                                // 🎓 بيانات الطالب
  tuitionRecord?: StudentTuitionRecord;                // 📋 سجل الأقساط الخاص بالطالب
  departmentName?: string;                             // 🏢 اسم القسم
  academicYear?: string;                               // 🗓️ العام الدراسي المتزامن
}

export default function StudentTuitionFinancialCard({
  student,
  tuitionRecord,
  departmentName = 'القسم الأكاديمي',
  academicYear: propAcademicYear,
}: StudentTuitionFinancialCardProps) {
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<string>(() => propAcademicYear || tuitionRecord?.academic_year || getAcademicYear());

  // 🔄 مزامنة العام الدراسي مع الخاصية الممررة والسحابة
  useEffect(() => {
    if (propAcademicYear) {
      setCurrentYear(propAcademicYear);
    }
  }, [propAcademicYear]);

  useEffect(() => {
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setCurrentYear(liveYear);
      }).catch(() => {});
    }

    let unsubscribe: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribe = subscribeToAcademicYearChanges((liveYear) => {
        setCurrentYear(liveYear);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // إذا لم يكن هناك سجل مسجل مسبقاً، ننشئ كائناً افتراضياً معتمداً
  const isEvening = (student.study_type || 'morning') === 'evening';
  const studentStage = student.stage_number || 1;
  const defaultBase = studentStage === 1 ? (isEvening ? 2200000 : 1800000) : (isEvening ? 2300000 : 1900000);

  const baseRecord: StudentTuitionRecord = tuitionRecord || {
    id: `tuition-${student.id}-default`,
    student_id: student.id,
    student_name: student.full_name,
    student_code: student.university_number || '---',
    department_id: student.department_id || 'dept-1',
    stage_number: studentStage,
    study_type: student.study_type || 'morning',
    academic_year: currentYear,
    base_amount: defaultBase,
    discount_type: 'none',
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: defaultBase,
    installments_count: 3,
    paid_amount: 0,
    remaining_amount: defaultBase,
    status: 'unsettled',
    financial_clearance: 'uncleared',
    paid_installments: [],
    unpaid_stages_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const record: StudentTuitionRecord = {
    ...baseRecord,
    academic_year: currentYear || baseRecord.academic_year,
  };

  const isFullySettled = record.status === 'fully_settled';
  const isPartiallySettled = record.status === 'partially_settled';
  const paidPercentage = record.total_amount > 0 ? Math.min(100, Math.round((record.paid_amount / record.total_amount) * 100)) : 0;

  // 📄 تصدير سند التسديد المالي الرسمي
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportTuitionSettlementReceiptPDF({
      record,
      departmentName,
    });
    setIsExportingPDF(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-300 p-5 sm:p-7 shadow-xs space-y-6 select-none" dir="rtl">
      
      {/* 📌 الترويسة وشارات الموقف المالي */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
            <CreditCard className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg text-xs font-black">
                العام الدراسي {currentYear}
              </span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-bold">
                المرحلة {getStageNameInArabic(record.stage_number)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                (record.study_type || 'morning') === 'evening'
                  ? 'bg-blue-100 text-blue-950 border-blue-400 font-black'
                  : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
              }`}>
                {(record.study_type || 'morning') === 'evening' ? (
                  <Moon className="w-3.5 h-3.5 text-blue-800" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-emerald-800" />
                )}
                <span>{(record.study_type || 'morning') === 'evening' ? 'الدراسة المسائية' : 'الدراسة الصباحية'}</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-950">
              الموقف المالي وسجل تسديد الأقساط الدراسية
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {record.financial_clearance === 'cleared' && (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>مبرأ الذمة المالية رسمياً</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || record.paid_installments.length === 0}
            className="px-4 py-2 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-2xs whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>{isExportingPDF ? 'جاري التوليد...' : 'تحميل سند التسديد الرسمي'}</span>
          </button>
        </div>
      </div>

      {/* ⚠️ تنبيه المتأخرات للمراحل السابقة إن وجدت */}
      {record.unpaid_stages_count > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-950 text-xs sm:text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          <div>
            <strong className="block text-xs sm:text-sm font-black text-rose-900">تنبيه مالي بوجود متأخرات سابقة:</strong>
            <span>
              يرجى مراجعة شعبة الشؤون المالية والحسابات لتسوية متأخرات ({record.unpaid_stages_count}) مراحل دراسية سابقة.
            </span>
          </div>
        </div>
      )}

      {/* 📊 بطاقات الإحصاء المالي */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-1">
          <span className="text-xs font-bold text-slate-600 block">القسط السنوي الأساسي</span>
          <span className="text-lg sm:text-xl font-black font-mono text-slate-950 block">
            {(record.base_amount || record.total_amount).toLocaleString()} <span className="text-xs font-sans text-slate-600">د.ع</span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 block">مقسم على {record.installments_count || 3} دفعات</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1">
          <span className="text-xs font-bold text-blue-900 block">التخفيض المعتمد</span>
          <span className="text-lg sm:text-xl font-black font-mono text-blue-800 block">
            {(record.discount_amount || 0).toLocaleString()} <span className="text-xs font-sans text-blue-800">د.ع</span>
          </span>
          <span className="text-[11px] font-bold text-blue-900 block">
            {(record.discount_amount || 0) > 0 ? `نسبة الخصم (${record.discount_percentage}%)` : 'بدون تخفيض'}
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 space-y-1">
          <span className="text-xs font-bold text-emerald-900 block">المبلغ المسدد</span>
          <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 block">
            {record.paid_amount.toLocaleString()} <span className="text-xs font-sans text-emerald-800">د.ع</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-800 block">
            {record.paid_installments.length} وصولات مسجلة في الحسابات
          </span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-300 space-y-1">
          <span className="text-xs font-bold text-rose-900 block">المتبقي بذمتك</span>
          <span className="text-lg sm:text-xl font-black font-mono text-rose-700 block">
            {record.remaining_amount.toLocaleString()} <span className="text-xs font-sans text-rose-800">د.ع</span>
          </span>
          <span className="text-[11px] font-bold text-rose-800 block">
            {record.remaining_amount === 0 ? 'براءة ذمة مالية تامة' : 'مطلوب التسديد في الموعد المحدد'}
          </span>
        </div>
      </div>

      {/* 📈 شريط نسبة التسديد المئوية */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-2.5">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
          <span className="text-slate-800">نسبة تسديد القسط الدراسي:</span>
          <span className="text-slate-950 font-mono font-black text-sm sm:text-base">
            {paidPercentage}%
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              paidPercentage === 100 ? 'bg-emerald-600' : 'bg-[#0F2942]'
            }`}
            style={{ width: `${paidPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
          <span>الموقف: {isFullySettled ? 'مسدد بالكامل' : isPartiallySettled ? 'مسدد جزئياً' : 'غير مسدد'}</span>
          <span>الدفعة القادمة: {record.paid_installments.length < (record.installments_count || 3) ? `الدفعة رقم (${record.paid_installments.length + 1})` : 'مكتملة بالكامل'}</span>
        </div>
      </div>

      {/* 📋 جدول وصولات القبض المسددة */}
      <div className="space-y-3">
        <h4 className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-700" />
          <span>سجل وأرقام وصولات القبض المسددة في شعبة الحسابات</span>
        </h4>

        {record.paid_installments.length > 0 ? (
          <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-2xs">
            <table className="w-full text-xs sm:text-sm font-bold text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-950 border-b border-slate-300 text-xs sm:text-sm font-black text-center">
                  <th className="p-3 w-12">#</th>
                  <th className="p-3 text-right pr-4">الدفعة</th>
                  <th className="p-3">المبلغ المسدد</th>
                  <th className="p-3">تاريخ التسديد</th>
                  <th className="p-3">رقم وصل القبض</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {record.paid_installments.map((inst, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center text-slate-600 font-mono font-bold">{idx + 1}</td>
                    <td className="p-3 pr-4 text-slate-950 font-black">الدفعة رقم ({inst.installment_num})</td>
                    <td className="p-3 text-center text-emerald-700 font-black font-mono">{inst.amount.toLocaleString()} د.ع</td>
                    <td className="p-3 text-center text-slate-700 font-mono">{inst.paid_at}</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-900 bg-blue-50/50">{inst.receipt_no}</td>
                    <td className="p-3 text-center text-slate-700">
                      {inst.payment_method === 'electronic' ? 'دفع إلكتروني' : inst.payment_method === 'bank_cheque' ? 'صك مصدق' : inst.payment_method === 'exemption' ? 'إعفاء مالي' : 'نقدي'}
                    </td>
                    <td className="p-3 text-center text-slate-600">{inst.note || 'تسديد معتمد'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 text-center space-y-1.5">
            <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs sm:text-sm font-black text-slate-950">لا توجد دفعات مسجلة حتى الآن.</p>
            <p className="text-xs font-bold text-slate-600">يرجى مراجعة شعبة الشؤون المالية والحسابات لتسديد القسط الأول واستلام وصل القبض المالي.</p>
          </div>
        )}
      </div>

    </div>
  );
}
