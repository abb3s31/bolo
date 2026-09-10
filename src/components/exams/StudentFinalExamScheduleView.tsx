'use client'; // ⚡ ينفذ بالعميل

// 🎓 لوحة عرض جدول الامتحانات النهائية للطلبة (StudentFinalExamScheduleView) - مسار بولونيا
import { useState, useMemo, useEffect } from 'react'; // 🔗 رياكت
import { FinalExamSchedule, FinalExamSlot, UserProfile, ExamAttemptType } from '@/types'; // 🔗 الأنواع
import { exportFinalExamSchedulePDF } from '@/lib/pdf-export'; // 📄 مولد PDF
import { getAcademicYear, getStoredData, INITIAL_PROFILES } from '@/lib/mock-data'; // 🗓️ العام الدراسي والمستخدمين
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  CheckCircle2, 
  FileText,
  Timer
} from 'lucide-react'; // 🎨 الأيقونات

interface StudentFinalExamScheduleViewProps {
  currentUser: UserProfile;           // 🎓 بيانات الطالب
  schedules: FinalExamSchedule[];     // 📋 كافة الجداول
  slots: FinalExamSlot[];             // 📋 كافة البنود
}

export default function StudentFinalExamScheduleView({
  currentUser,
  schedules,
  slots,
}: StudentFinalExamScheduleViewProps) {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptType>('first_attempt');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<Date>(new Date());

  // ⏱️ تحديث الوقت كل دقيقة للعد التنازلي
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 🔍 البحث عن الجدول المعتمد الخاص بقسم ومرحلة هذا الطالب
  const studentSchedule = useMemo(() => {
    const studentStage = currentUser.stage_number || 1;
    return schedules.find(
      (s) =>
        s.department_id === currentUser.department_id &&
        s.stage_number === studentStage &&
        s.semester === selectedSemester &&
        s.attempt_type === selectedAttempt &&
        s.status === 'approved' // 🔒 يظهر فقط عندما يكون معتمداً رسمياً من المسؤول العام!
    );
  }, [schedules, currentUser, selectedSemester, selectedAttempt]);

  // 📋 بنود الامتحانات الخاصة بهذا الجدول
  const examSlots = useMemo(() => {
    if (!studentSchedule) return [];
    const list = slots.filter((s) => s.schedule_id === studentSchedule.id);
    return list.sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }, [studentSchedule, slots]);

  // ⏳ حساب أقرب امتحان قادم للعد التنازلي
  const upcomingExam = useMemo(() => {
    const todayStr = nowTime.toISOString().split('T')[0] || '';
    return examSlots.find((s) => s.exam_date >= todayStr);
  }, [examSlots, nowTime]);

  // ⏳ حساب الأيام والساعات المتبقية للامتحان القادم
  const countdownText = useMemo(() => {
    if (!upcomingExam) return null;
    try {
      const examTarget = new Date(`${upcomingExam.exam_date}T${upcomingExam.start_time}:00`);
      const diffMs = examTarget.getTime() - nowTime.getTime();
      if (diffMs <= 0) return 'اليوم هو موعد الامتحان! 🎯';

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (diffDays > 0) {
        return `متبقي: ${diffDays} يوم و ${diffHours} ساعة ⏳`;
      }
      return `متبقي: ${diffHours} ساعة فقط! ⏱️`;
    } catch {
      return null;
    }
  }, [upcomingExam, nowTime]);

  // 📄 تصدير الجدول بصيغة PDF
  const handleExportPDF = async () => {
    if (!studentSchedule || examSlots.length === 0) return;
    setIsExportingPDF(true);
    const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
    const headUser = allProfiles.find((p) => p.role === 'department_head' && p.department_id === currentUser.department_id);
    const rapUser = allProfiles.find((p) => p.role === 'rapporteur' && p.department_id === currentUser.department_id);

    await exportFinalExamSchedulePDF({
      departmentName: currentUser.department_name || 'القسم الأكاديمي',
      stageNumber: currentUser.stage_number || 1,
      semester: selectedSemester,
      academicYear: studentSchedule.academic_year_label || getAcademicYear(),
      attemptType: selectedAttempt,
      slots: examSlots,
      instructions: studentSchedule.instructions,
      headName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
      rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
    });
    setIsExportingPDF(false);
  };

  const dayArabicNames: Record<string, string> = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  };

  return (
    <div className="space-y-6">
      
      {/* 🎛️ شريط الترويسة وأزرار التبديل والتنزيل بحدود ناعمة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-black">
              قسم {currentUser.department_name}
            </span>
            <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-sm font-black font-mono">
              المرحلة {getStageNameInArabic(currentUser.stage_number || 1)}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>جدول الامتحانات النهائية الرسمية (Final Exam Timetable)</span>
          </h3>
          <p className="text-base font-black text-slate-700 mt-1">
            المواعيد والقاعات المعتمدة من العمادة واللجنة الامتحانية لمسار بولونيا
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {/* محدد الدور */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
            <button
              type="button"
              onClick={() => setSelectedAttempt('first_attempt')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ selectedAttempt === 'first_attempt' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:text-slate-950' }`}
            >
              الدور الأول
            </button>
            <button
              type="button"
              onClick={() => setSelectedAttempt('second_attempt')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ selectedAttempt === 'second_attempt' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:text-slate-950' }`}
            >
              الدور الثاني
            </button>
          </div>

          {/* زر تحميل PDF */}
          {studentSchedule && examSlots.length > 0 && (
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs border border-[#1e4570]"
            >
              <Download className="w-5 h-5 text-emerald-400" />
              <span>تحميل الجدول PDF</span>
            </button>
          )}
        </div>
      </div>

      {studentSchedule ? (
        <>
          {/* ⏳ بطاقة العد التنازلي للامتحان القادم بحدود ناعمة */}
          {upcomingExam && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-sm rounded-xl">
                    الامتحان القادم 🎯
                  </span>
                  <span className="text-base font-black text-indigo-200 font-mono">
                    {upcomingExam.exam_date} ({dayArabicNames[upcomingExam.exam_day] || upcomingExam.exam_day})
                  </span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  {upcomingExam.course_name} <span className="text-indigo-300 font-mono">({upcomingExam.course_code})</span>
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-base font-black text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono">{upcomingExam.start_time} - {upcomingExam.end_time}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>{upcomingExam.building_name}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-black">{upcomingExam.hall_name}</span>
                  </span>
                </div>
              </div>

              {countdownText && (
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center space-y-1 shrink-0 self-start sm:self-center">
                  <span className="text-sm font-black text-indigo-200 block">مؤقت الامتحان</span>
                  <span className="text-base font-black text-sky-300 block font-mono">
                    {countdownText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 📋 شبكة بطاقات المواد الامتحانية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {examSlots.map((slot, idx) => {
              const dayName = dayArabicNames[slot.exam_day] || slot.exam_day;
              const isPast = slot.exam_date < (nowTime.toISOString().split('T')[0] || '');
              const isToday = slot.exam_date === (nowTime.toISOString().split('T')[0] || '');

              return (
                <div
                  key={slot.id}
                  className={`bg-white rounded-3xl border p-6 space-y-4 transition shadow-xs ${
                    isToday
                      ? 'border-indigo-500 ring-2 ring-indigo-400/50 bg-indigo-50/20'
                      : isPast
                      ? 'border-slate-200 opacity-80'
                      : 'border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-950 font-black text-sm rounded-xl border border-slate-300">
                        امتحان رقم {idx + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                        slot.study_type === 'evening'
                          ? 'bg-slate-100 text-slate-900 border-slate-300'
                          : 'bg-sky-50 text-sky-950 border-sky-200'
                      }`}>
                        {slot.study_type === 'evening' ? 'مسائي' : 'صباحي'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-sm font-black ${ isToday ? 'bg-sky-600 text-white animate-pulse' : isPast ? 'bg-slate-100 text-slate-950' : 'bg-emerald-100 text-emerald-900' }`}>
                      {isToday ? 'اليوم' : isPast ? 'منتهي' : 'قادم'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-base sm:text-lg text-slate-950 leading-tight">
                      {slot.course_name}
                    </h4>
                    <span className="text-sm font-black text-slate-700 block mt-1 font-mono">
                      كود المادة: {slot.course_code}
                    </span>
                  </div>

                  <div className="space-y-2 text-base font-black text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-950 font-black">اليوم والتاريخ:</span>
                      <span className="font-black text-slate-900">{dayName} <span className="font-mono text-sm">({slot.exam_date})</span></span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-950 font-black">وقت الامتحان:</span>
                      <span className="font-black text-indigo-700 font-mono">{slot.start_time} - {slot.end_time}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-950 font-black">البناية:</span>
                      <span className="font-bold text-slate-900">{slot.building_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-950 font-black">القاعة / المختبر:</span>
                      <span className="font-black text-emerald-700">{slot.hall_name}</span>
                    </div>
                  </div>

                  {slot.notes && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-black text-slate-950">
                      💡 <strong>ملاحظة:</strong> {slot.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 🛡️ مصفوفة التعليمات والضوابط الامتحانية الإلزامية بحدود ناعمة */}
          <div className="bg-slate-50 border border-slate-300 p-6 sm:p-7 rounded-3xl space-y-4 shadow-xs">
            <h4 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-indigo-700" />
              <span>التعليمات والضوابط الامتحانية الرسمية للامتحانات النهائية (مسار بولونيا)</span>
            </h4>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base font-black text-slate-950 pt-1">
              {(studentSchedule.instructions || []).map((inst, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200">
                  <span className="px-2 py-0.5 bg-[#0F2942] text-white font-black rounded-lg text-sm font-mono shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-slate-900 leading-snug">{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        /* ⏳ حالة عدم نشر الجدول بعد بحدود ناعمة */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-3xl flex items-center justify-center mx-auto border border-slate-300">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h4 className="text-lg sm:text-xl font-black text-slate-950">
            جدول الامتحانات النهائية ({selectedSemester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}) قيد التدقيق والإعداد
          </h4>
          <p className="text-base font-black text-slate-700 max-w-md mx-auto">
            تقوم رئاسة القسم واللجنة الامتحانية بمراجعة المواعيد وتوزيع القاعات مع المسؤول العام. سيتم إشعارك فور مصادقة الجدول رسمياً.
          </p>
        </div>
      )}

    </div>
  );
}
