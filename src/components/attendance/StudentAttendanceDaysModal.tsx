import React, { useState, useMemo } from 'react'; // ⚛️ استيراد ريآكت والخطافات الأساسية
import { // 🎨 استيراد أيقونات SVG النقية المخصصة بدون برتقالي وبدون بنفسجي
  AttendancePresentSvg, // 🟢 أيقونة الحضور
  AttendanceExcusedSvg, // 🔵 أيقونة الإجازة الرسمية
  AttendanceHolidaySvg, // 🏖️ أيقونة العطلة الرسمية
  AttendanceAbsenceSvg, // 🔴 أيقونة الغياب غير المبرر
  StudentDaysSheetSvg, // 📋 أيقونة كشف الأيام
  ClockDurationSvg, // 🕒 أيقونة الوقت والمدة
  PrintReportSvg, // 🖨️ أيقونة طباعة التقرير الأكاديمي
} from '@/components/common/AttendanceCustomSvgIcons'; // 📦 استيراد الأيقونات النقية
import { // 🏷️ استيراد الأنواع المعتمدة
  UserProfile, // 👤 نوع بروفايل الطالب
  StudentAttendanceRecord, // 📋 نوع سجل الحضور
  AttendanceStatus, // 🚦 نوع حالة الحضور
} from '@/types'; // 🔗 الاستيراد من ملف الأنواع
import { getStudentDaysBreakdown, StudentDayDetailItem } from '@/lib/holiday-service'; // 🏖️ استيراد خدمة كشف الأيام
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🏷️ أسماء المراحل بالعربية

// 📋 واجهة خصائص مودال كشف أيام الحضور والغياب للطالب
export interface StudentAttendanceDaysModalProps {
  isOpen: boolean; // 🚪 هل النافذة مفتوحة
  onClose: () => void; // 🔒 دالة إغلاق النافذة
  student: UserProfile | null; // 🎓 بيانات الطالب المستهدف
  records: StudentAttendanceRecord[]; // 📋 كافة سجلات الحضور بالنظام
}

// 🏛️ مكون نافذة كشف أيام وساعات الحضور والغياب والإجازات والعطلات للطالب
export const StudentAttendanceDaysModal: React.FC<StudentAttendanceDaysModalProps> = ({
  isOpen, // 🚪 حالة الفتح
  onClose, // 🔒 دالة الإغلاق
  student, // 🎓 الطالب
  records, // 📋 السجلات
}) => {
  // 🔘 حالة التصفية النشطة داخل النافذة: الكل أو حاضر أو غائب أو مجاز أو عطلة
  const [filterType, setFilterType] = useState<AttendanceStatus | 'all'>('all'); // 🎯 نوع التصفية

  // 📋 جلب السجل الزمني اليومي لكافة محاضرات الطالب
  const daysList = useMemo<StudentDayDetailItem[]>(() => {
    if (!student) return []; // 🚫 إذا لا يوجد طالب نرجع مصفوفة فارغة
    return getStudentDaysBreakdown(student.id, records); // ⚡ جلب الأيام عبر الخدمة النظيفة
  }, [student, records]); // 🔄 إعادة الحساب عند تغير الطالب أو السجلات

  // 🧮 احتساب إجمالي ساعات الحضور والإجازة والعطلة والغياب للطالب
  const stats = useMemo(() => {
    let presentHours = 0; // 🟢 عداد ساعات الحضور
    let excusedHours = 0; // 🔵 عداد ساعات الإجازة
    let holidayHours = 0; // 🏖️ عداد ساعات العطلة
    let unexcusedHours = 0; // 🔴 عداد ساعات الغياب

    daysList.forEach((item) => {
      const dur = item.duration_hours || 1.5; // ⏳ مدة المحاضرة
      if (item.status === 'present' || item.status === 'late') {
        presentHours += dur; // 🟢 إضافة لساعات الحضور
      } else if (item.status === 'absent_excused') {
        excusedHours += dur; // 🔵 إضافة لساعات الإجازة
      } else if (item.status === 'holiday') {
        holidayHours += dur; // 🏖️ إضافة لساعات العطلة
      } else if (item.status === 'absent_unexcused') {
        unexcusedHours += dur; // 🔴 إضافة لساعات الغياب
      }
    });

    return {
      presentHours, // 🟢 إجمالي الحضور
      excusedHours, // 🔵 إجمالي الإجازة
      holidayHours, // 🏖️ إجمالي العطلة
      unexcusedHours, // 🔴 إجمالي الغياب
      totalLectures: daysList.length, // 🔢 إجمالي المحاضرات المرصودة
    };
  }, [daysList]);

  // 🔍 تصفية القائمة المعروضة حسب التبويب المختار
  const filteredDays = useMemo(() => {
    if (filterType === 'all') return daysList; // 🌐 عرض كافة الأيام
    return daysList.filter((d) => d.status === filterType); // 🎯 تصفية حسب الحالة المحددة
  }, [daysList, filterType]);

  // 🚫 إذا كانت النافذة مغلقة أو لا يوجد طالب، لا نرسم شيئاً
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* 🛡️ خلفية معتمة بنعومة عالية */}
      <div
        className="fixed inset-0 bg-[#0F2942]/60 backdrop-blur-xs transition-opacity" // 🎨 غطاء كحلي معتم
        onClick={onClose} // ⚡ إغلاق عند النقر بالخلفية
      />

      {/* 📦 صندوق النافذة المنبثقة الفاخر */}
      <div
        className="relative bg-white rounded-3xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-10" // 🎨 تصميم الصندوق
        dir="rtl" // 📐 اتجاه النص من اليمين للياسر
      >
        {/* 🏷️ الهيدر الرئيسي للنافذة باللون الكحلي الملكي #0F2942 */}
        <div className="bg-[#0F2942] text-white p-5 sm:p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-xs">
              <StudentDaysSheetSvg className="w-7 h-7 text-cyan-300" /> {/* 📋 أيقونة كشف الأيام الفيكتورية */}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 rounded-lg text-xs font-black">
                  كشف الأيام الأكاديمي التفصيلي {/* 🏷️ نوع الكشف */}
                </span>
                <span className="px-2.5 py-0.5 bg-white/15 text-white rounded-lg text-xs font-black">
                  المرحلة {getStageNameInArabic(student.stage_number || 1)} {/* 🎓 المرحلة */}
                </span>
                {student.student_group && (
                  <span className="px-2 py-0.5 bg-blue-500/30 text-cyan-100 rounded-lg text-xs font-black">
                    كروب {student.student_group} {/* 🏷️ الكروب */}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {student.full_name} {/* 👤 اسم الطالب الكامل */}
              </h3>
            </div>
          </div>

          {/* ❌ زر إغلاق النافذة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // ⚡ إغلاق
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer" // 🎨 تصميم الزر
            title="إغلاق النافذة" // 💡 التلميح
          >
            <span className="text-xl font-mono leading-none">✕</span> {/* ❌ علامة الإغلاق */}
          </button>
        </div>

        {/* 📊 بطاقات الساعات الأربعة التراكمية (حضور | إجازة | عطلة | غياب) - بدون برتقالي وبدون بنفسجي */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          
          {/* 🟢 ساعات الحضور */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-300 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
              <AttendancePresentSvg className="w-5 h-5 text-emerald-700" /> {/* 🟢 أيقونة الحضور */}
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 block">ساعات الحضور</span> {/* 📝 التسمية */}
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-black text-emerald-950">{stats.presentHours}</span> {/* 🔢 الرقم */}
                <span className="text-xs font-black text-slate-600">ساعة</span> {/* ⏱️ الوحدة */}
              </div>
            </div>
          </div>

          {/* 🔵 ساعات الإجازة الرسمية */}
          <div className="bg-white p-3.5 rounded-2xl border border-blue-300 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
              <AttendanceExcusedSvg className="w-5 h-5 text-blue-700" /> {/* 🔵 أيقونة الإجازة */}
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 block">ساعات الإجازة</span> {/* 📝 التسمية */}
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-black text-blue-950">{stats.excusedHours}</span> {/* 🔢 الرقم */}
                <span className="text-xs font-black text-slate-600">ساعة</span> {/* ⏱️ الوحدة */}
              </div>
            </div>
          </div>

          {/* 🏖️ ساعات العطلة الرسمية */}
          <div className="bg-white p-3.5 rounded-2xl border border-sky-300 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-200 shrink-0">
              <AttendanceHolidaySvg className="w-5 h-5 text-sky-700" /> {/* 🏖️ أيقونة العطلة */}
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 block">ساعات العطلة</span> {/* 📝 التسمية */}
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-black text-sky-950">{stats.holidayHours}</span> {/* 🔢 الرقم */}
                <span className="text-xs font-black text-slate-600">ساعة</span> {/* ⏱️ الوحدة */}
              </div>
            </div>
          </div>

          {/* 🔴 ساعات الغياب غير المبرر */}
          <div className="bg-white p-3.5 rounded-2xl border border-rose-300 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 shrink-0">
              <AttendanceAbsenceSvg className="w-5 h-5 text-rose-700" /> {/* 🔴 أيقونة الغياب */}
            </div>
            <div>
              <span className="text-xs font-black text-slate-700 block">ساعات الغياب</span> {/* 📝 التسمية */}
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-mono font-black text-rose-950">{stats.unexcusedHours}</span> {/* 🔢 الرقم */}
                <span className="text-xs font-black text-slate-600">ساعة</span> {/* ⏱️ الوحدة */}
              </div>
            </div>
          </div>

        </div>

        {/* 🎛️ شريط التصفية السريعة للأيام (كافة الأيام | أيام الحضور | أيام الغياب | أيام الإجازة | أيام العطل) */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 bg-white">
          {/* كافة الأيام */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setFilterType('all')} // ⚡ تفعيل الكل
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'bg-slate-100 text-slate-950 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            كافة الأيام ({daysList.length})
          </button>

          {/* أيام الحضور */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setFilterType('present')} // ⚡ تفعيل الحاضر
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'present'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <AttendancePresentSvg className="w-3.5 h-3.5" />
            <span>الأيام الحاضر بيها ({daysList.filter((d) => d.status === 'present').length})</span>
          </button>

          {/* أيام الغياب */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setFilterType('absent_unexcused')} // ⚡ تفعيل الغياب
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'absent_unexcused'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-950 hover:bg-rose-100 border border-rose-300'
            }`}
          >
            <AttendanceAbsenceSvg className="w-3.5 h-3.5" />
            <span>الأيام الغايب بيها ({daysList.filter((d) => d.status === 'absent_unexcused').length})</span>
          </button>

          {/* أيام الإجازة */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setFilterType('absent_excused')} // ⚡ تفعيل الإجازة
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'absent_excused'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-950 hover:bg-blue-100 border border-blue-300'
            }`}
          >
            <AttendanceExcusedSvg className="w-3.5 h-3.5" />
            <span>الأيام المجاز بيها ({daysList.filter((d) => d.status === 'absent_excused').length})</span>
          </button>

          {/* أيام العطل */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={() => setFilterType('holiday')} // ⚡ تفعيل العطلة
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'holiday'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-950 hover:bg-sky-100 border border-sky-300'
            }`}
          >
            <AttendanceHolidaySvg className="w-3.5 h-3.5" />
            <span>أيام العطل ({daysList.filter((d) => d.status === 'holiday').length})</span>
          </button>
        </div>

        {/* 📜 محتوى قائمة الأيام والمحاضرات القابلة للتمرير */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-white">
          {filteredDays.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-black space-y-2">
              <StudentDaysSheetSvg className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base text-slate-700 font-black">لا توجد سجلات مطابقة لهذه التصفية في الوقت الحالي.</p>
              <p className="text-xs text-slate-400">اختر تصفية أخرى من الأعلى لرؤية باقي الأيام والمحاضرات.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              {filteredDays.map((item, idx) => {
                // 🎨 تخصيص لون وبادج الحالة
                let badgeClass = 'bg-slate-100 text-slate-900 border-slate-300';
                let badgeLabel = 'غير محدد';
                let IconComponent = ClockDurationSvg;

                if (item.status === 'present') {
                  badgeClass = 'bg-emerald-50 text-emerald-900 border-emerald-300';
                  badgeLabel = 'حاضر ✅';
                  IconComponent = AttendancePresentSvg;
                } else if (item.status === 'absent_unexcused') {
                  badgeClass = 'bg-rose-50 text-rose-900 border-rose-300';
                  badgeLabel = 'غائب (غير مبرر) ❌';
                  IconComponent = AttendanceAbsenceSvg;
                } else if (item.status === 'absent_excused') {
                  badgeClass = 'bg-blue-50 text-blue-900 border-blue-300';
                  badgeLabel = 'مجاز رسمياً 📄';
                  IconComponent = AttendanceExcusedSvg;
                } else if (item.status === 'holiday') {
                  badgeClass = 'bg-sky-50 text-sky-900 border-sky-300';
                  badgeLabel = 'عطلة رسمية 🏖️';
                  IconComponent = AttendanceHolidaySvg;
                }

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 sm:p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* 📅 التاريخ واليوم والمادة */}
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 shrink-0 text-center min-w-[58px]">
                        <span className="text-[11px] font-black text-slate-500 block">{item.day}</span>
                        <span className="text-sm font-black font-mono text-slate-900 block mt-0.5">
                          {item.date.split('-')[2] || item.date}
                        </span>
                        <span className="text-[9px] font-black text-slate-500 block">
                          {item.date.split('-')[1] ? `شهر ${item.date.split('-')[1]}` : ''}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-slate-950">
                            {item.course_name}
                          </h4>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-black rounded-md border border-slate-200">
                            {item.course_code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                            item.lecture_type === 'practical' ? 'bg-sky-50 text-sky-900 border border-sky-200' : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {item.lecture_type === 'practical' ? 'عملي 🔬' : 'نظري 📘'}
                          </span>
                        </div>

                        {/* تفاصيل التوقيت والملاحظات */}
                        <div className="flex items-center gap-3 text-xs font-black text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <ClockDurationSvg className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-mono">{item.start_time} - {item.end_time}</span>
                            <span>({item.duration_hours} س)</span>
                          </span>

                          {item.recorded_by_teacher_name && (
                            <span>التدريسي: {item.recorded_by_teacher_name}</span>
                          )}
                        </div>

                        {/* في حال وجود تفاصيل عطلة أو إجازة */}
                        {item.holiday_title && (
                          <p className="text-xs font-black text-sky-900 bg-sky-50 px-2 py-1 rounded-md border border-sky-200 inline-block mt-1">
                            🏖️ مناسبة العطلة: {item.holiday_title}
                          </p>
                        )}
                        {item.excuse_reason && (
                          <p className="text-xs font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 inline-block mt-1">
                            📄 تفاصيل العذر: {item.excuse_reason} {item.excuse_document_ref ? `(كتاب: ${item.excuse_document_ref})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 🏷️ شارة الحالة في الجانب الأيسر */}
                    <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-1.5 ${badgeClass}`}>
                        <IconComponent className="w-4 h-4" />
                        <span>{badgeLabel}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔻 الفوتر السفلي للنافذة */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-black text-slate-600 hidden sm:inline">
            جامعة الإمام جعفر الصادق (ع) - فرع ميسان - كشف الحضور والغياب الأكاديمي
          </span>
          <div className="flex items-center gap-2">
            {/* 🖨️ زر طباعة الكشف الأكاديمي للتقرير الرسمي */}
            <button
              type="button" // 🔘 نوع الزر لمنع الإرسال
              onClick={() => { // ⚡ تشغيل نافذة الطباعة المتصفحية
                if (typeof window !== 'undefined') {
                  window.print(); // 🖨️ فتح أمر طباعة الكشف كـ PDF أو طابعة
                }
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0F2942] text-xs sm:text-sm font-black rounded-xl border border-slate-300 transition cursor-pointer shadow-2xs flex items-center gap-2"
              title="طباعة أو تصدير كشف الأيام كـ PDF"
            >
              <PrintReportSvg className="w-4 h-4 text-[#0F2942]" /> {/* 🖨️ أيقونة الطباعة الفيكتورية */}
              <span>طباعة الكشف</span> {/* 📝 نص زر الطباعة */}
            </button>

            {/* 🔒 زر إغلاق النافذة */}
            <button
              type="button" // 🔘 نوع الزر
              onClick={onClose} // ⚡ إغلاق
              className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white text-xs sm:text-sm font-black rounded-xl transition cursor-pointer shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceDaysModal; // 🚀 تصدير المكون
