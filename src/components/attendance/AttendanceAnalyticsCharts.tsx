'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📊 لوحة الرسوم البيانية والإحصائيات التفاعلية للحضور والغياب (AttendanceAnalyticsCharts) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useMemo } from 'react'; // 🔗 رياكت
import { Course, UserProfile, StudentAttendanceRecord, AttendanceWarningStatus } from '@/types'; // 🔗 الأنواع الصريحة
import { calculateStudentCourseAttendance, BOLOGNA_SEMESTER_WEEKS } from '@/lib/attendance-utils'; // 🕒 الحسابات الأكاديمية
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  PieChart,
  CalendarDays,
  CheckCircle2,
  XCircle,
  FileCheck,
  Palmtree,
  Clock,
  Ban,
  Award,
  Activity,
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG الصريحة بالكامل
import {
  calculateDateForAnyDayInWeek,
  getCurrentAcademicWeek,
  IRAQI_ARABIC_MONTHS,
} from '@/lib/schedule-utils'; // 🗓️ دوال التقويم الأكاديمي وحساب الأسابيع الـ 15

// 📋 واجهة خصائص المكون
interface AttendanceAnalyticsChartsProps {
  courses: Course[]; // 📘 قائمة المواد
  students: UserProfile[]; // 👥 قائمة الطلبة
  records: StudentAttendanceRecord[]; // 📋 سجلات الحضور
  departmentName: string; // 🏢 اسم القسم الأكاديمي
  startDate?: string; // 📅 تاريخ انطلاق الفصل الأكاديمي (مسار بولونيا)
}

// 🏛️ المكون الرئيسي للمخططات البيانية
export default function AttendanceAnalyticsCharts({
  courses,
  students,
  records,
  departmentName,
  startDate = '2026-09-20',
}: AttendanceAnalyticsChartsProps) {
  // 🎛️ حالات التصفية للمرحلة والكورس
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);

  // 🔍 تصفية الطلاب بحسب المرحلة المختارة
  const filteredStudents = useMemo(() => {
    return students.filter((s) => selectedStage === 'all' || (s.stage_number || 1) === selectedStage);
  }, [students, selectedStage]);

  // 📘 تصفية المواد بحسب المرحلة والكورس
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchStage = selectedStage === 'all' || c.stage_number === selectedStage;
      const matchSemester = (c.semester || 1) === selectedSemester;
      return matchStage && matchSemester;
    });
  }, [courses, selectedStage, selectedSemester]);

  // 🧮 إحصائيات الموقف العام للغياب
  const departmentStats = useMemo(() => {
    let safeCount = 0;
    let warn1Count = 0;
    let warn2Count = 0;
    let bannedCount = 0;
    let totalPresentLectures = 0;
    let totalUnexcusedLectures = 0;
    let totalExcusedLectures = 0;
    let totalHolidayLectures = 0;
    let totalLateLectures = 0;

    const rankMap: Record<AttendanceWarningStatus, number> = {
      safe: 0,
      warning_1: 1,
      warning_2: 2,
      banned: 3,
    };

    for (const st of filteredStudents) {
      let highestRank = 0;
      let worstStatus: AttendanceWarningStatus = 'safe';

      for (const c of filteredCourses) {
        const s = calculateStudentCourseAttendance(st.id, c.id, records, c.name, c.code, c.credit_hours || 3);
        totalPresentLectures += s.present_count;
        totalUnexcusedLectures += s.absent_unexcused_count;
        totalExcusedLectures += s.absent_excused_count;
        totalHolidayLectures += s.holiday_count;
        totalLateLectures += s.late_count;

        const currentRank = rankMap[s.warning_status] || 0;
        if (currentRank > highestRank) {
          highestRank = currentRank;
          worstStatus = s.warning_status;
        }
      }

      if (worstStatus === 'banned') bannedCount++;
      else if (worstStatus === 'warning_2') warn2Count++;
      else if (worstStatus === 'warning_1') warn1Count++;
      else safeCount++;
    }

    const totalLogged = totalPresentLectures + totalUnexcusedLectures + totalExcusedLectures + totalHolidayLectures + totalLateLectures;
    const generalAttendanceRate = totalLogged > 0 ? Math.round((totalPresentLectures / totalLogged) * 100) : 100;

    return {
      safeCount,
      warn1Count,
      warn2Count,
      bannedCount,
      totalPresentLectures,
      totalUnexcusedLectures,
      totalExcusedLectures,
      totalHolidayLectures,
      totalLateLectures,
      totalLogged,
      generalAttendanceRate,
    };
  }, [filteredStudents, filteredCourses, records]);

  // 📈 معدل الغياب حسب كل مادة دراسية
  const courseAbsenceMetrics = useMemo(() => {
    return filteredCourses.map((c) => {
      let totalAbsenceHours = 0;
      const totalScheduledHours = (c.credit_hours || 3) * 15 * (filteredStudents.length || 1);

      filteredStudents.forEach((st) => {
        const s = calculateStudentCourseAttendance(st.id, c.id, records, c.name, c.code, c.credit_hours || 3);
        totalAbsenceHours += s.total_unexcused_absence_hours;
      });

      const avgRate = totalScheduledHours > 0 ? Number(((totalAbsenceHours / totalScheduledHours) * 100).toFixed(1)) : 0;
      return {
        course: c,
        totalAbsenceHours,
        avgRate,
      };
    });
  }, [filteredCourses, filteredStudents, records]);

  // 📅 اتجاه الغياب عبر الأسابيع الـ 15 (Weekly Trend)
  const weeklyTrends = useMemo(() => {
    const baseD = startDate || '2026-09-20';
    const currentWeekNum = getCurrentAcademicWeek(baseD);

    return BOLOGNA_SEMESTER_WEEKS.map((w) => {
      const weekRecords = records.filter((r) => {
        const matchWeek = r.week_number === w.week;
        const matchSemester = (r.semester || 1) === selectedSemester;
        const st = students.find((s) => s.id === r.student_id);
        const matchStage = selectedStage === 'all' || (st?.stage_number || 1) === selectedStage;
        return matchWeek && matchSemester && matchStage;
      });

      const absences = weekRecords.filter((r) => r.status === 'absent_unexcused').length;
      const presents = weekRecords.filter((r) => r.status === 'present').length;
      const excused = weekRecords.filter((r) => r.status === 'absent_excused').length;
      const late = weekRecords.filter((r) => r.status === 'late').length;
      const totalWeekLogged = absences + presents + excused + late;
      const weekAttendanceRate = totalWeekLogged > 0 ? Math.round(((presents + late) / totalWeekLogged) * 100) : 100;

      // 🗓️ احتساب التاريخ الفعلي المقابل لبداية هذا الأسبوع
      const satDate = calculateDateForAnyDayInWeek(baseD, 1, w.week, 'saturday');
      const dParts = satDate.split('-');
      const dayNum = dParts.length === 3 ? parseInt(dParts[2], 10) : '';
      const monthName = dParts.length === 3 ? (IRAQI_ARABIC_MONTHS[parseInt(dParts[1], 10) - 1] || '') : '';
      const isCurr = currentWeekNum === w.week;

      return {
        weekNumber: w.week,
        weekLabel: `الأسبوع ${w.week}`,
        shortLabel: `أ ${w.week}`,
        dateStr: `${dayNum} ${monthName}`,
        isCurr,
        absences,
        presents,
        excused,
        late,
        totalWeekLogged,
        weekAttendanceRate,
      };
    });
  }, [records, selectedSemester, selectedStage, students, startDate]);

  // 🏆 الأسبوع الأكثر التزاماً والأسبوع الأكثر غياباً
  const maxAbsenceWeek = useMemo(() => {
    return [...weeklyTrends].reduce((max, curr) => (curr.absences > max.absences ? curr : max), weeklyTrends[0]);
  }, [weeklyTrends]);

  return (
    <div className="space-y-6">
      
      {/* 🎛️ شريط الفلاتر والتحكم بتصميم أنيق ومحايد */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-[#0F2942] text-white rounded-2xl border border-[#1e4570] flex-shrink-0 shadow-sm">
            <BarChart3 className="w-7 h-7 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950">تحليلات ومؤشرات الحضور والغياب (مسار بولونيا)</h3>
            <p className="text-base font-black text-slate-950 mt-0.5">قسم {departmentName} • رصد بياني فوري تفاعلي</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 🎓 فلتر المرحلة الدراسية */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${
                selectedStage === 'all' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-white'
              }`}
            >
              كافة المراحل
            </button>
            {([
              { id: 1, label: 'المرحلة الأولى' },
              { id: 2, label: 'المرحلة الثانية' },
              { id: 3, label: 'المرحلة الثالثة' },
              { id: 4, label: 'المرحلة الرابعة' },
            ] as const).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStage(st.id)}
                className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${
                  selectedStage === st.id ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* 📅 فلتر الكورس الدراسي */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedSemester(1)}
              className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${
                selectedSemester === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-950 hover:bg-white'
              }`}
            >
              الكورس الأول
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester(2)}
              className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${
                selectedSemester === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-950 hover:bg-white'
              }`}
            >
              الكورس الثاني
            </button>
          </div>
        </div>
      </div>

      {/* 📊 بطاقات مؤشرات الموقف الأكاديمي والإنذارات (100% SVG Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* الوضع آمن */}
        <div className="bg-white border-2 border-emerald-300 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-slate-950">الوضع آمن (أقل من 5%)</span>
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono">
            {departmentStats.safeCount} طالب
          </div>
          <div className="text-sm sm:text-base font-black text-slate-950 flex items-center justify-between border-t-2 border-emerald-100 pt-2.5">
            <span>نسبة الالتزام الكامل:</span>
            <span className="font-mono font-black text-emerald-800 text-lg">{filteredStudents.length > 0 ? Math.round((departmentStats.safeCount / filteredStudents.length) * 100) : 100}%</span>
          </div>
        </div>

        {/* إنذار أولي */}
        <div className="bg-white border-2 border-slate-300 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-slate-950">إنذار أولي (5% - 6.9%)</span>
            <div className="p-2.5 bg-slate-100 text-slate-800 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
            {departmentStats.warn1Count} طالب
          </div>
          <div className="text-sm sm:text-base font-black text-slate-950 flex items-center justify-between border-t-2 border-slate-200 pt-2.5">
            <span>الإجراء المطلوب:</span>
            <span className="font-black text-slate-800">تنبيه ومتابعة فورية</span>
          </div>
        </div>

        {/* حرمان رسمي */}
        <div className="bg-white border-2 border-rose-300 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-slate-950">حرمان رسمي (≥ 10%)</span>
            <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl">
              <Ban className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-rose-800 font-mono">
            {departmentStats.bannedCount} طالب
          </div>
          <div className="text-sm sm:text-base font-black text-slate-950 flex items-center justify-between border-t-2 border-rose-100 pt-2.5">
            <span>الموقف الإداري:</span>
            <span className="font-black text-rose-800">مستحق الحرمان الأكاديمي</span>
          </div>
        </div>

      </div>

      {/* 📈 قسم الرسوم البيانية المتطورة */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. مؤشر نسبة الغياب لكل مادة دراسية (Course Metrics) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
            <h4 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <span>معدل الغياب غير المبرر حسب المادة الدراسية (%)</span>
            </h4>
            <span className="text-sm sm:text-base font-black px-3 py-1 bg-rose-100 text-rose-950 border-2 border-rose-200 rounded-xl font-mono">سقف الحرمان: 10%</span>
          </div>

          <div className="space-y-4 pt-1">
            {courseAbsenceMetrics.map((item) => {
              const isDanger = item.avgRate >= 10;
              const isWarning = item.avgRate >= 5;

              return (
                <div key={item.course.id} className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 transition hover:bg-slate-100">
                  <div className="flex items-center justify-between text-base sm:text-lg font-black">
                    <span className="text-slate-950">{item.course.name} ({item.course.code})</span>
                    <span className={`font-black font-mono ${isDanger ? 'text-rose-700' : isWarning ? 'text-blue-700' : 'text-emerald-800'}`}>
                      {item.avgRate}% غياب ({item.totalAbsenceHours} ساعة)
                    </span>
                  </div>

                  {/* شريط التقدم المرئي */}
                  <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300 flex">
                    <div
                      style={{ width: `${Math.min(item.avgRate * 8, 100)}%` }}
                      className={`h-full transition-all duration-500 rounded-full ${
                        isDanger ? 'bg-rose-600' : isWarning ? 'bg-blue-600' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}

            {courseAbsenceMetrics.length === 0 && (
              <div className="p-10 text-center text-slate-950 text-base sm:text-lg font-black">
                لا توجد مواد دراسية مسجلة في هذا الكورس والمرحلة المحددة.
              </div>
            )}
          </div>
        </div>

        {/* 2. التوزيع النسبي لحالات الحضور المسجلة بالقسم (100% SVG Icons) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
              <h4 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
                <PieChart className="w-6 h-6 text-emerald-600" />
                <span>التوزيع الكلي لحالات الحضور</span>
              </h4>
              <span className="text-sm sm:text-base font-black px-3 py-1 bg-slate-100 text-slate-950 border-2 border-slate-200 rounded-xl font-mono">{departmentStats.totalLogged} سجل</span>
            </div>

            <div className="space-y-3 pt-3 text-base sm:text-lg font-black">
              
              {/* الحضور الفعلي */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                <div className="flex items-center gap-2.5 text-emerald-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>الحضور الفعلي:</span>
                </div>
                <span className="font-black text-emerald-900 font-mono">{departmentStats.totalPresentLectures} مرة ({departmentStats.generalAttendanceRate}%)</span>
              </div>

              {/* غياب غير مبرر */}
              <div className="flex items-center justify-between p-3.5 bg-rose-50 rounded-2xl border-2 border-rose-200">
                <div className="flex items-center gap-2.5 text-rose-950 font-black">
                  <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  <span>غياب غير مبرر:</span>
                </div>
                <span className="font-black text-rose-900 font-mono">{departmentStats.totalUnexcusedLectures} مرة</span>
              </div>

              {/* إجازات رسمية */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div className="flex items-center gap-2.5 text-slate-950 font-black">
                  <FileCheck className="w-5 h-5 text-slate-700 shrink-0" />
                  <span>إجازات رسمية ومبررة:</span>
                </div>
                <span className="font-black text-slate-900 font-mono">{departmentStats.totalExcusedLectures} مرة</span>
              </div>

              {/* عطل رسمية */}
              <div className="flex items-center justify-between p-3.5 bg-sky-50 rounded-2xl border-2 border-sky-200">
                <div className="flex items-center gap-2.5 text-sky-950 font-black">
                  <Palmtree className="w-5 h-5 text-sky-700 shrink-0" />
                  <span>عطل رسمية معتمدة:</span>
                </div>
                <span className="font-black text-sky-900 font-mono">{departmentStats.totalHolidayLectures} يوم</span>
              </div>

              {/* حالات التأخير */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-50 rounded-2xl border-2 border-indigo-200">
                <div className="flex items-center gap-2.5 text-indigo-950 font-black">
                  <Clock className="w-5 h-5 text-indigo-700 shrink-0" />
                  <span>حالات التأخير:</span>
                </div>
                <span className="font-black text-indigo-900 font-mono">{departmentStats.totalLateLectures} مرة</span>
              </div>

            </div>
          </div>

          {/* شريط الانضباط الأكاديمي */}
          <div className="p-4 bg-[#0F2942] text-white rounded-2xl text-center text-base sm:text-lg font-black mt-4 shadow-sm flex items-center justify-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-300 shrink-0" />
            <span>نسبة الانضباط الأكاديمي للقسم: {departmentStats.generalAttendanceRate}%</span>
          </div>
        </div>

      </div>

      {/* 📅 3. المخطط البياني الاحترافي لتتبع الغيابات والحضور الأسبوعي عبر الـ 15 أسبوعاً */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 shadow-xs space-y-6">
        
        {/* هيدر المخطط البياني ودليل الألوان */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-800 rounded-2xl border-2 border-indigo-200 shrink-0">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black text-slate-950">
                مخطط تتبع الغيابات الأسبوعية عبر الفصل الدراسي (الأسابيع 1 - 15)
              </h4>
              <p className="text-base font-black text-slate-950 mt-1">
                مسار بولونيا المعتمد • رصد بياني دقيق للحضور والغياب أسبوعاً بأسبوع
              </p>
            </div>
          </div>

          {/* دليل ألوان المخطط (Legend) بأيقونات SVG ونصوص سوداء عريضة */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-2.5 rounded-2xl border-2 border-slate-200 text-sm sm:text-base font-black text-slate-950">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
              <span>حضور فعلي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-xs" />
              <span>غياب غير مبرر</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block shadow-xs" />
              <span>إجازات / تأخير</span>
            </div>
          </div>
        </div>

        {/* شبكة الأسابيع الـ 15 بتصميم بطاقات وأعمدة تفاعلية فاخرة ومحاذاة 5 أعمدة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
          {weeklyTrends.map((wt) => {
            const hasHighAbsence = wt.absences >= 3;
            const hasMediumAbsence = wt.absences > 0 && wt.absences < 3;

            return (
              <div
                key={wt.weekNumber}
                className={`p-4 rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 hover:shadow-lg space-y-3 ${
                  hasHighAbsence
                    ? 'bg-rose-50/60 border-rose-300 hover:border-rose-400'
                    : hasMediumAbsence
                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                    : 'bg-white border-slate-200 hover:border-[#0F2942]'
                }`}
              >
                {/* رأس البطاقة: رقم الأسبوع وشارة الحالة والتاريخ */}
                <div className="w-full pb-2.5 border-b-2 border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-slate-950">
                      {wt.weekLabel}
                    </span>
                    <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                      {wt.dateStr}
                    </span>
                    {wt.isCurr && (
                      <span className="text-[10px] font-black text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                        الحالي
                      </span>
                    )}
                  </div>
                  {wt.absences === 0 ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 text-xs font-black rounded-lg border border-emerald-300">
                      ملتزم 100%
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-950 text-xs font-black rounded-lg border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                      <span>{wt.absences} غياب</span>
                    </span>
                  )}
                </div>

                {/* نسبة الحضور وشريط التقدم */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm sm:text-base font-black text-slate-950">
                    <span>نسبة الحضور:</span>
                    <span className="text-xl font-black text-slate-950 font-mono">
                      {wt.weekAttendanceRate}%
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-300 flex">
                    <div
                      style={{ width: `${wt.weekAttendanceRate}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        wt.weekAttendanceRate >= 90
                          ? 'bg-emerald-500'
                          : wt.weekAttendanceRate >= 75
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* تفصيل الحضور والغياب بصناديق واضحة */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-black text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>حضور:</span>
                    </span>
                    <span className="font-mono text-base font-black text-emerald-900">
                      {wt.presents}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-950 font-black text-sm">
                    <span className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>غياب:</span>
                    </span>
                    <span className="font-mono text-base font-black text-rose-900">
                      {wt.absences}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* شريط الإحصائيات الختامي للمخطط الأسبوعي بنصوص سوداء وواضحة */}
        <div className="p-5 bg-slate-50 rounded-3xl border-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-base font-black text-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">متوسط الالتزام الأسبوعي:</div>
              <div className="font-mono text-xl font-black text-slate-950">{departmentStats.generalAttendanceRate}%</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">إجمالي المحاضرات المحضورة:</div>
              <div className="font-mono text-xl font-black text-slate-950">{departmentStats.totalPresentLectures} محاضرة</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
              <AlertTriangle className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">الأسبوع الأكثر تسجيلاً للغياب:</div>
              <div className="font-mono text-xl font-black text-slate-950">{maxAbsenceWeek?.weekLabel || 'الأسبوع 1'} ({maxAbsenceWeek?.absences || 0} غياب)</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
