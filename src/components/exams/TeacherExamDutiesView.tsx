'use client'; // ⚡ ينفذ بالعميل

import { useState, useMemo } from 'react'; // 🔗 رياكت
import { FinalExamSchedule, FinalExamSlot, UserProfile } from '@/types'; // 🔗 الأنواع
import { exportTeacherProctoringSchedulePDF } from '@/lib/pdf-export'; // 📄 مصدّر PDF
import { getAcademicYear } from '@/lib/mock-data'; // 🗓️ العام الدراسي المعتمد
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  Calendar, 
  Clock, 
  Building2, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Download,
  AlertCircle,
  X
} from 'lucide-react'; // 🎨 الأيقونات SVG

interface TeacherExamDutiesViewProps {
  currentUser: UserProfile;              // 👤 بيانات الأستاذ الحالي
  schedules: FinalExamSchedule[];        // 📋 كافة الجداول
  slots: FinalExamSlot[];                // 📋 كافة البنود
}

export default function TeacherExamDutiesView({
  currentUser,
  schedules,
  slots,
}: TeacherExamDutiesViewProps) {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // 🔍 الجداول المعتمدة والمصادق عليها للكورس المختار
  const approvedScheduleIds = useMemo(() => {
    return new Set(
      schedules
        .filter((s) => s.status === 'approved' && (s.semester || 1) === selectedSemester)
        .map((s) => s.id)
    );
  }, [schedules, selectedSemester]);

  // 🔤 دالة تطبيع الأسماء العربية لحساب الألقاب والأرقام وفوارق الهمزات
  const normalizeTeacherName = (name?: string): string => {
    if (!name) return '';
    return name
      .trim()
      .toLowerCase()
      .replace(/^(د\.|أ\.د\.|م\.د\.|أستاذ|دكتور|الاستاذ|الدكتور)\s*/g, '')
      .replace(/\s*\d+$/g, '') // حذف أرقام التكرار مثل "1"
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ئ/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/[^\p{L}\p{N}]/gu, '');
  };

  // 📋 البنود الامتحانية المكلف بها هذا الأستاذ (بالمطابقة مع اسمه أو معرفه أو لقبه الأكاديمي)
  const teacherDuties = useMemo(() => {
    const rawTeacherName = currentUser.full_name || '';
    const teacherNorm = normalizeTeacherName(rawTeacherName);
    
    return slots
      .filter((slot) => {
        // فحص اعتماد الجدول
        if (!approvedScheduleIds.has(slot.schedule_id)) return false;
        if (!slot.supervisor_name) return false;

        const supNorm = normalizeTeacherName(slot.supervisor_name);
        const isDirectMatch = supNorm === teacherNorm || supNorm.includes(teacherNorm) || teacherNorm.includes(supNorm);
        const isNameMatch = rawTeacherName.includes(slot.supervisor_name) || slot.supervisor_name.includes(rawTeacherName);

        return isDirectMatch || isNameMatch;
      })
      .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }, [slots, approvedScheduleIds, currentUser]);

  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  const todayStr = new Date().toISOString().split('T')[0] || '';

  // 📄 تصدير أمر التكليف بالمراقبة PDF
  const handleExportPDF = async () => {
    if (teacherDuties.length === 0) {
      setToastMessage('لا توجد مراقبات مسندة لتصديرها.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    setIsExportingPDF(true);
    await exportTeacherProctoringSchedulePDF({
      teacherName: currentUser.full_name || 'الأستاذ التدريسي',
      departmentName: currentUser.department_name || 'القسم الأكاديمي',
      academicYear: getAcademicYear(),
      semester: selectedSemester,
      slots: teacherDuties,
    });
    setIsExportingPDF(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-3.5 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-indigo-400/80 ring-4 ring-indigo-300/20 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 border-2 border-indigo-300 rounded-xl shadow-2xs shrink-0">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-black text-sm text-slate-950">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🎛️ الهيدر ومحدد الكورس بحدود ناعمة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-sm font-black">
              اللجنة الامتحانية المركزية
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-black font-mono">
              {teacherDuties.length} مراقبات وإشراف مسند
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>جدول المراقبات والإشراف على الامتحانات النهائية (Proctoring Duties)</span>
          </h3>
          <p className="text-base font-black text-slate-700 mt-1">
            المواعيد والقاعات والمدرجات المعتمدة رسمياً لمراقبة الامتحانات النهائية
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* محدد الكورس */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
            <button
              type="button"
              onClick={() => setSelectedSemester(1)}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ selectedSemester === 1 ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:text-slate-950' }`}
            >
              الكورس الأول
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester(2)}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ selectedSemester === 2 ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:text-slate-950' }`}
            >
              الكورس الثاني
            </button>
          </div>

          {/* زر تحميل أمر التكليف الرسمي PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || teacherDuties.length === 0}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs border border-[#1e4570]"
          >
            <Download className="w-5 h-5 text-emerald-400" />
            <span>{isExportingPDF ? 'جاري التصدير...' : 'تحميل أمر التكليف PDF'}</span>
          </button>
        </div>
      </div>

      {/* 📋 قائمة بطاقات المراقبة */}
      {teacherDuties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teacherDuties.map((duty, idx) => {
            const isToday = duty.exam_date === todayStr;
            const isPast = duty.exam_date < todayStr;
            const schedule = schedules.find((s) => s.id === duty.schedule_id);

            return (
              <div
                key={duty.id}
                className={`bg-white rounded-3xl border p-6 space-y-4 transition shadow-xs ${
                  isToday
                    ? 'border-indigo-500 ring-2 ring-indigo-400/50 bg-indigo-50/20'
                    : isPast
                    ? 'border-slate-200 opacity-75'
                    : 'border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-950 font-black text-sm rounded-xl border border-slate-300">
                      مراقبة رقم {idx + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                      duty.study_type === 'evening'
                        ? 'bg-slate-100 text-slate-900 border-slate-300'
                        : 'bg-sky-50 text-sky-950 border-sky-200'
                    }`}>
                      {duty.study_type === 'evening' ? 'مسائي' : 'صباحي'}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-sm font-black ${ isToday ? 'bg-sky-600 text-white animate-pulse' : isPast ? 'bg-slate-100 text-slate-950' : 'bg-emerald-100 text-emerald-900' }`}>
                    {isToday ? 'اليوم' : isPast ? 'منتهية' : 'قادمة'}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base sm:text-lg text-slate-950 leading-snug">
                    {duty.course_name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-700 mt-1 font-mono">
                    <span>كود المادة: {duty.course_code}</span>
                    <span>•</span>
                    <span>المرحلة {getStageNameInArabic(duty.stage_number)}</span>
                  </div>
                  {schedule && (
                    <span className="text-sm font-black text-indigo-700 block mt-1">
                      قسم {schedule.department_name}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-base font-black text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-950 font-black">اليوم والتاريخ:</span>
                    <span className="font-black text-slate-900">
                      {dayArabicNames[duty.exam_day] || duty.exam_day} <span className="font-mono text-sm">({duty.exam_date})</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-950 font-black">وقت الامتحان:</span>
                    <span className="font-black text-indigo-700 font-mono">{duty.start_time} - {duty.end_time}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-950 font-black">البناية:</span>
                    <span className="font-bold text-slate-900">{duty.building_name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-950 font-black">القاعة الامتحانية:</span>
                    <span className="font-black text-emerald-700">{duty.hall_name}</span>
                  </div>
                </div>

                {duty.notes && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-black text-slate-950">
                    <span><strong>ملاحظة:</strong> {duty.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-slate-50 text-slate-700 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
            <UserCheck className="w-8 h-8" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-slate-950">
            لا توجد مراقبات امتحانية مسندة لك في {selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} حالياً
          </h4>
          <p className="text-base font-black text-slate-700 max-w-md mx-auto">
            تقوم اللجنة الامتحانية ورئاسة القسم بتوزيع الأساتذة والمشرفين على القاعات والمدرجات. سيتم تحديث جدولك فور اعتماد الجداول.
          </p>
        </div>
      )}

    </div>
  );
}
