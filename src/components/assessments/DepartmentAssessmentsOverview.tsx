'use client'; // ⚡ يشتغل بالمتصفح كـ Client Component

// 🏢 لوحة إشراف وتدقيق التكليفات والامتحانات الفصلية المتقدمة لرئاسة القسم (رئيس القسم والمقرر)
// 🎓 مسار بولونيا: متابعة التزام التدريسيين بنشر الكويزات، الواجبات، التقارير، والمدتيرم لجميع مراحل القسم وتدقيق قرارات التسليم

import React, { useState, useEffect, useMemo } from 'react'; // 🔗 خطافات رياكت
import { 
  BookOpen, 
  Layers, 
  Clock, 
  Download, 
  MapPin, 
  Award, 
  Filter, 
  Search,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileCheck,
  FileText,
  RotateCcw,
  XCircle,
  CheckCircle,
  Eye,
  X,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Check,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react'; // 🎨 أيقونات SVG الاحترافية
import { CourseAcademicTask, AcademicTaskType, StudentTaskSubmission, UserProfile } from '@/types'; // 🔗 الأنواع الصريحة
import { INITIAL_ACADEMIC_TASKS, INITIAL_STUDENT_SUBMISSIONS, INITIAL_PROFILES, getStoredData, getAcademicYear } from '@/lib/mock-data'; // 💾 البيانات
import { exportCourseTaskBriefPDF, exportTaskSubmissionsReportPDF } from '@/lib/pdf-export'; // 📄 مصدّر الـ PDF المعتمد
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية الفصحى
import { 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncAcademicTasksFromSupabase,
  syncTaskSubmissionsFromSupabase
} from '@/lib/supabase-client'; // ☁️ المزامنة السحابية الحية لكافة التكليفات والتسليمات
import AdminPagination from '@/components/AdminPagination'; // 📑 مكوّن الترقيم والتنقل بين الصفحات الموحد

// 📋 واجهة مدخلات المكون لرئاسة القسم
interface DepartmentAssessmentsOverviewProps {
  departmentId: string;   // 🏢 معرف القسم
  departmentName: string; // 🏷️ اسم القسم الأكاديمي
}

export function DepartmentAssessmentsOverview({
  departmentId,
  departmentName,
}: DepartmentAssessmentsOverviewProps) {
  // 📌 📊 حالات البيانات المحلية والمزامنة
  const [tasks, setTasks] = useState<CourseAcademicTask[]>([]);
  const [submissions, setSubmissions] = useState<StudentTaskSubmission[]>([]);
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🔍 حالات التصفية والبحث
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const [selectedStudyType, setSelectedStudyType] = useState<string>('all');
  const [isStudyDropdownOpen, setIsStudyDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  // 📑 حالات الترقيم والتنقل بين صفحات التكليفات والمهام
  const [taskPage, setTaskPage] = useState<number>(1); // 🔢 رقم الصفحة الحالية
  const [taskPageSize, setTaskPageSize] = useState<number>(10); // 📏 عدد المهام في كل صفحة

  // 🔄 إعادة تصفير الصفحة عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setTaskPage(1);
  }, [selectedStage, selectedType, selectedStudyType, searchQuery]);

  // 👁️ حالة معاينة تسليمات تكليف محدد في النافذة العائمة
  const [inspectingTask, setInspectingTask] = useState<CourseAcademicTask | null>(null);

  // 🔄 مزامنة العام الدراسي من Supabase واشتراك البث الحي
  useEffect(() => {
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setAcademicYear(liveYear);
      }).catch(() => {});
    }

    let unsubscribe: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribe = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 🔄 تحميل التكليفات والتسليمات من التخزين المحلي أو البيانات الأولية
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_course_academic_tasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(INITIAL_ACADEMIC_TASKS);
      }

      // تحميل تسليمات الطلاب المعتمدة
      const storedSubs = getStoredData<StudentTaskSubmission[]>('task_student_submissions', INITIAL_STUDENT_SUBMISSIONS);
      setSubmissions(storedSubs);
    } catch {
      setTasks(INITIAL_ACADEMIC_TASKS);
      setSubmissions(INITIAL_STUDENT_SUBMISSIONS);
    }

    // ☁️ مزامنة التكليفات والتسليمات الحية من سحابة Supabase
    syncAcademicTasksFromSupabase().then((liveTasks) => {
      if (liveTasks && liveTasks.length > 0) setTasks(liveTasks);
    }).catch(() => {});
    syncTaskSubmissionsFromSupabase().then((liveSubs) => {
      if (liveSubs && liveSubs.length > 0) setSubmissions(liveSubs);
    }).catch(() => {});
  }, []);

  // 🔍 تصفية وفلترة تكليفات القسم متعددة الأبعاد
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (departmentId && t.department_id !== departmentId) return false;
      if (selectedStage !== 'all' && t.stage_number.toString() !== selectedStage) return false;
      if (selectedType !== 'all' && t.task_type !== selectedType) return false;
      if (selectedStudyType !== 'all') {
        const taskStudy = t.study_type || 'morning';
        if (selectedStudyType === 'both') {
          if (taskStudy !== 'both') return false;
        } else if (taskStudy !== selectedStudyType && taskStudy !== 'both') {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesCourse = (t.course_name || '').toLowerCase().includes(q);
        const matchesTeacher = (t.teacher_name || '').toLowerCase().includes(q);
        const matchesTopics = (t.included_topics || '').toLowerCase().includes(q);
        const matchesCode = (t.course_code || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesTeacher && !matchesTopics && !matchesCode) return false;
      }

      return true;
    });
  }, [tasks, departmentId, selectedStage, selectedType, selectedStudyType, searchQuery]);

  // 📊 إحصائيات القسم الشاملة لمسار بولونيا
  const stats = useMemo(() => {
    const departmentSubs = submissions.filter((s) => {
      const t = tasks.find((item) => item.id === s.task_id);
      return t && (!departmentId || t.department_id === departmentId);
    });

    const deptTasks = tasks.filter((t) => !departmentId || t.department_id === departmentId);

    return {
      total: deptTasks.length,
      filteredTotal: filteredTasks.length,
      quizzes: deptTasks.filter((t) => t.task_type === 'quiz').length,
      assignments: deptTasks.filter((t) => t.task_type === 'assignment').length,
      reports: deptTasks.filter((t) => t.task_type === 'report').length,
      midterms: deptTasks.filter((t) => t.task_type === 'midterm_exam').length,
      practicals: deptTasks.filter((t) => t.task_type === 'practical_exam').length,
      // الفترات الدراسية
      morningTasks: deptTasks.filter((t) => (t.study_type || 'morning') === 'morning' || t.study_type === 'both').length,
      eveningTasks: deptTasks.filter((t) => t.study_type === 'evening' || t.study_type === 'both').length,
      bothTasks: deptTasks.filter((t) => t.study_type === 'both').length,
      // القرارات وموقف التدقيق الأكاديمي
      totalSubs: departmentSubs.length,
      acceptedSubs: departmentSubs.filter((s) => s.review_decision === 'accepted').length,
      revisionSubs: departmentSubs.filter((s) => s.review_decision === 'needs_revision').length,
      rejectedSubs: departmentSubs.filter((s) => s.review_decision === 'rejected').length,
      pendingSubs: departmentSubs.filter((s) => !s.review_decision || s.review_decision === 'pending').length,
    };
  }, [filteredTasks, submissions, tasks, departmentId]);

  // 📄 تصدير ورقة التكليف PDF
  const handleExportPdf = async (task: CourseAcademicTask) => {
    setIsExportingPdf(task.id);
    try {
      const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
      const headUser = allProfiles.find((p) => p.role === 'department_head' && p.department_id === departmentId);
      const rapUser = allProfiles.find((p) => p.role === 'rapporteur' && p.department_id === departmentId);

      await exportCourseTaskBriefPDF({
        task,
        departmentName,
        headName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
        rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
      });
      setToastMsg(`تم تصدير ورقة التكليف (${task.title}) بنجاح! 📄`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('⚠️ حدث خطأ أثناء تصدير ورقة التكليف');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsExportingPdf(null);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-black text-sm text-slate-950">{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ الهيدر الفاخر لإشراف وتدقيق التكليفات والامتحانات الفصلية بتصميم كحلي ملكي */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1A3C6E] text-white flex items-center justify-center shadow-md shrink-0 border border-[#1A3C6E]">
              <ShieldCheck className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  إشراف وتدقيق التكليفات والامتحانات الفصلية
                </h1>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span>العام الدراسي: {academicYear}</span>
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 font-black">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا: متابعة نشر الكويزات، الواجبات، التقارير، والمدتيرم لجميع مراحل {departmentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <div className="px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-black text-slate-900 flex items-center gap-2 shadow-2xs">
              <span>إجمالي المهام المعتمدة:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#1A3C6E] text-white font-mono font-black text-base shadow-2xs">
                {stats.total}
              </span>
            </div>
          </div>
        </div>

        {/* 📊 بطاقات مؤشرات الأداء والأوزان التكوينية الخمسة لمسار بولونيا */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* 1. الكويزات */}
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === 'quiz' ? 'all' : 'quiz')}
            className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between ${
              selectedType === 'quiz'
                ? 'bg-[#1A3C6E] text-white border-[#1A3C6E] shadow-md ring-2 ring-[#1A3C6E]/30'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black">الكويزات والاختبارات</span>
              <div className={`p-2 rounded-xl ${selectedType === 'quiz' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.quizzes}</span>
              <span className="text-xs font-bold opacity-80">كويز منشور</span>
            </div>
          </button>

          {/* 2. الواجبات */}
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === 'assignment' ? 'all' : 'assignment')}
            className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between ${
              selectedType === 'assignment'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-400/30'
                : 'bg-blue-50/60 hover:bg-blue-100/70 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black">الواجبات والتطبيقات</span>
              <div className={`p-2 rounded-xl ${selectedType === 'assignment' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.assignments}</span>
              <span className="text-xs font-bold opacity-80">واجب منزلي</span>
            </div>
          </button>

          {/* 3. التقارير والبحوث */}
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === 'report' ? 'all' : 'report')}
            className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between ${
              selectedType === 'report'
                ? 'bg-sky-900 text-white border-sky-900 shadow-md ring-2 ring-sky-400/30'
                : 'bg-sky-50/60 hover:bg-sky-100/70 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black">التقارير والبحوث</span>
              <div className={`p-2 rounded-xl ${selectedType === 'report' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.reports}</span>
              <span className="text-xs font-bold opacity-80">تقرير بحثي</span>
            </div>
          </button>

          {/* 4. امتحانات المدتيرم */}
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === 'midterm_exam' ? 'all' : 'midterm_exam')}
            className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between ${
              selectedType === 'midterm_exam'
                ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-400/30'
                : 'bg-rose-50/60 hover:bg-rose-100/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black">امتحانات المدتيرم</span>
              <div className={`p-2 rounded-xl ${selectedType === 'midterm_exam' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.midterms}</span>
              <span className="text-xs font-bold opacity-80">امتحان فصلي</span>
            </div>
          </button>

          {/* 5. الامتحانات العملية */}
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === 'practical_exam' ? 'all' : 'practical_exam')}
            className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between ${
              selectedType === 'practical_exam'
                ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-black">الامتحانات العملية</span>
              <div className={`p-2 rounded-xl ${selectedType === 'practical_exam' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black font-mono">{stats.practicals}</span>
              <span className="text-xs font-bold opacity-80">تقييم مختبري</span>
            </div>
          </button>

        </div>

        {/* 🚦 شريط ملخص قرارات تدقيق رئاسة القسم لمسار بولونيا */}
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-900">
            <Sparkles className="w-5 h-5 text-indigo-700 shrink-0" />
            <span>موقف تسليمات وقرارات التدقيق الأكاديمي:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>المقبولون: <strong>{stats.acceptedSubs}</strong></span>
            </span>

            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
              <RotateCcw className="w-4 h-4 text-slate-700" />
              <span>طلب تعديل: <strong>{stats.revisionSubs}</strong></span>
            </span>

            <span className="px-3.5 py-1.5 bg-rose-50 text-rose-950 border border-rose-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
              <XCircle className="w-4 h-4 text-rose-700" />
              <span>المرفوضون: <strong>{stats.rejectedSubs}</strong></span>
            </span>

            <span className="px-3.5 py-1.5 bg-blue-50 text-blue-950 border border-blue-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>قيد التدقيق: <strong>{stats.pendingSubs}</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 🔍 أدوات التصفية والبحث المتقدم الممتدة بكامل العرض */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* 🔍 حقل البحث الفوري */}
          <div className="relative w-full lg:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المادة، الأستاذ، الرمز، أو موضوع التكليف..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-11 pl-3 py-3 text-sm sm:text-base font-black text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
            />
          </div>

          {/* 🏷️ تبويبات تصفية المراحل الدراسية بكامل العرض والتساوي */}
          <div className="flex-1 w-full flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto min-w-[320px]">
            {[
              { id: 'all', label: 'كافة المراحل', count: tasks.filter((t) => !departmentId || t.department_id === departmentId).length },
              { id: '1', label: 'المرحلة الأولى', count: tasks.filter((t) => (!departmentId || t.department_id === departmentId) && t.stage_number === 1).length },
              { id: '2', label: 'المرحلة الثانية', count: tasks.filter((t) => (!departmentId || t.department_id === departmentId) && t.stage_number === 2).length },
              { id: '3', label: 'المرحلة الثالثة', count: tasks.filter((t) => (!departmentId || t.department_id === departmentId) && t.stage_number === 3).length },
              { id: '4', label: 'المرحلة الرابعة', count: tasks.filter((t) => (!departmentId || t.department_id === departmentId) && t.stage_number === 4).length },
            ].map((stg) => (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSelectedStage(stg.id)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedStage === stg.id
                    ? 'bg-[#1A3C6E] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>{stg.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono font-black ${
                  selectedStage === stg.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {stg.count}
                </span>
              </button>
            ))}
          </div>

          {/* 📌 محدد نوع التكليف الذكي المنسدل باحترافية */}
          <div className="relative w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center justify-between gap-2.5 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-2xl px-4 py-2.5 w-full lg:w-auto cursor-pointer shadow-2xs transition"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-700" />
                <span className="text-xs sm:text-sm font-black text-slate-900">النوع:</span>
                <span className="text-xs sm:text-sm font-black text-[#1A3C6E]">
                  {selectedType === 'all' && `كافة الأنواع (${stats.total})`}
                  {selectedType === 'quiz' && `الكويزات والاختبارات (${stats.quizzes})`}
                  {selectedType === 'assignment' && `الواجبات والتطبيقات (${stats.assignments})`}
                  {selectedType === 'report' && `التقارير والبحوث (${stats.reports})`}
                  {selectedType === 'midterm_exam' && `امتحانات المدتيرم (${stats.midterms})`}
                  {selectedType === 'practical_exam' && `الامتحانات العملية (${stats.practicals})`}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180 text-slate-900' : ''}`} />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-full sm:min-w-[260px] bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: 'all', label: 'كافة الأنواع', count: stats.total, icon: Layers, iconColor: 'text-slate-700' },
                  { id: 'quiz', label: 'الكويزات والاختبارات', count: stats.quizzes, icon: Award, iconColor: 'text-slate-900' },
                  { id: 'assignment', label: 'الواجبات والتطبيقات', count: stats.assignments, icon: FileText, iconColor: 'text-blue-800' },
                  { id: 'report', label: 'التقارير والبحوث', count: stats.reports, icon: BookOpen, iconColor: 'text-sky-800' },
                  { id: 'midterm_exam', label: 'امتحانات المدتيرم', count: stats.midterms, icon: Clock, iconColor: 'text-rose-800' },
                  { id: 'practical_exam', label: 'الامتحانات العملية', count: stats.practicals, icon: FileCheck, iconColor: 'text-emerald-800' },
                ].map((item) => {
                  const isSel = selectedType === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(item.id);
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSel ? 'bg-[#1A3C6E] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className={`w-4 h-4 ${isSel ? 'text-cyan-300' : item.iconColor} shrink-0`} />
                        <span>{item.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                          isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ☀️🌙 محدد الفترة الدراسية الذكي المنسدل */}
          <div className="relative w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsStudyDropdownOpen(!isStudyDropdownOpen)}
              className="flex items-center justify-between gap-2.5 bg-white border-2 border-slate-300 hover:border-slate-400 rounded-2xl px-4 py-2.5 w-full lg:w-auto cursor-pointer shadow-2xs transition"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span className="text-xs sm:text-sm font-black text-slate-900">الفترة:</span>
                <span className="text-xs sm:text-sm font-black text-[#1A3C6E]">
                  {selectedStudyType === 'all' && `كافة الفترات (${stats.total})`}
                  {selectedStudyType === 'morning' && `الدراسة الصباحية (${stats.morningTasks})`}
                  {selectedStudyType === 'evening' && `الدراسة المسائية (${stats.eveningTasks})`}
                  {selectedStudyType === 'both' && `كلاهما معاً (${stats.bothTasks})`}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${isStudyDropdownOpen ? 'rotate-180 text-slate-900' : ''}`} />
            </button>

            {isStudyDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-full sm:min-w-[240px] bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: 'all', label: 'كافة الفترات الدراسية', count: stats.total, icon: Layers, iconColor: 'text-slate-700' },
                  { id: 'morning', label: 'الدراسة الصباحية', count: stats.morningTasks, icon: Sun, iconColor: 'text-sky-600' },
                  { id: 'evening', label: 'الدراسة المسائية', count: stats.eveningTasks, icon: Moon, iconColor: 'text-sky-600' },
                  { id: 'both', label: 'الصباحي والمسائي معاً', count: stats.bothTasks, icon: Sparkles, iconColor: 'text-emerald-600' },
                ].map((item) => {
                  const isSel = selectedStudyType === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudyType(item.id);
                        setIsStudyDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSel ? 'bg-[#1A3C6E] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className={`w-4 h-4 ${isSel ? 'text-cyan-300' : item.iconColor} shrink-0`} />
                        <span>{item.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                          isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {item.count}
                        </span>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 📑 جدول إشراف وتدقيق التكليفات والامتحانات الفصلية الاحترافي بالهوية الكحلية الملكية */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#1A3C6E] text-white text-xs sm:text-sm font-black border-b border-[#1A3C6E]">
                <th className="p-3.5 text-center w-12 whitespace-nowrap">#</th>
                <th className="p-3.5 text-center whitespace-nowrap">نوع التكليف</th>
                <th className="p-3.5 text-right whitespace-nowrap">المادة الدراسية</th>
                <th className="p-3.5 text-center whitespace-nowrap">المرحلة والكورس</th>
                <th className="p-3.5 text-center whitespace-nowrap">الفترة</th>
                <th className="p-3.5 text-right whitespace-nowrap">عنوان التكليف والمفردات</th>
                <th className="p-3.5 text-center whitespace-nowrap">أستاذ المادة</th>
                <th className="p-3.5 text-center whitespace-nowrap">حالة التسليمات وموقف التدقيق</th>
                <th className="p-3.5 text-center whitespace-nowrap">موعد الاستحقاق</th>
                <th className="p-3.5 text-center whitespace-nowrap">الدرجة</th>
                <th className="p-3.5 text-center whitespace-nowrap">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-black whitespace-nowrap">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-600 font-black text-sm sm:text-base">
                    لا توجد تكليفات أو امتحانات مطابقة لشروط البحث والتصفية المحددة.
                  </td>
                </tr>
              ) : (
                (() => {
                  const safeTaskPage = Math.max(1, Math.min(taskPage, Math.max(1, Math.ceil(filteredTasks.length / taskPageSize))));
                  const paginatedTasks = filteredTasks.slice((safeTaskPage - 1) * taskPageSize, safeTaskPage * taskPageSize);

                  return paginatedTasks.map((task, idx) => {
                    const actualIndex = (safeTaskPage - 1) * taskPageSize + idx;
                    const isQuiz = task.task_type === 'quiz';
                    const isAssignment = task.task_type === 'assignment';
                    const isReport = task.task_type === 'report';
                    const isMidterm = task.task_type === 'midterm_exam';
                    const isPractical = task.task_type === 'practical_exam';

                    const badgeBg = isQuiz
                      ? 'bg-slate-100 border-slate-300 text-slate-950'
                      : isAssignment
                      ? 'bg-blue-50 border-blue-200 text-blue-950'
                      : isReport
                      ? 'bg-sky-50 border-sky-200 text-sky-950'
                      : isMidterm
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950';

                    const typeLabel = isQuiz
                      ? 'كويز'
                      : isAssignment
                      ? 'واجب منزلي'
                      : isReport
                      ? 'تقرير بحثي'
                      : isMidterm
                      ? 'امتحان مدتيرم'
                      : 'امتحان عملي';

                    const taskSubs = submissions.filter((s) => s.task_id === task.id);
                    const acceptedSubs = taskSubs.filter((s) => s.review_decision === 'accepted').length;
                    const revisionSubs = taskSubs.filter((s) => s.review_decision === 'needs_revision').length;
                    const rejectedSubs = taskSubs.filter((s) => s.review_decision === 'rejected').length;
                    const pendingSubs = taskSubs.filter((s) => !s.review_decision || s.review_decision === 'pending').length;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                        <td className="p-3.5 text-center font-mono font-black text-slate-950 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 text-xs font-mono font-black">
                            {actualIndex + 1}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-xl border text-xs font-black inline-flex items-center gap-1.5 shadow-2xs ${badgeBg}`}>
                            {isQuiz && <Award className="w-3.5 h-3.5 text-slate-900" />}
                            {isAssignment && <FileText className="w-3.5 h-3.5 text-blue-900" />}
                            {isReport && <BookOpen className="w-3.5 h-3.5 text-sky-900" />}
                            {isMidterm && <Clock className="w-3.5 h-3.5 text-rose-900" />}
                            {isPractical && <FileCheck className="w-3.5 h-3.5 text-emerald-900" />}
                            <span>{typeLabel}</span>
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <strong className="text-slate-950 font-black text-sm">{task.course_name}</strong>
                            {task.course_code && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-md font-mono text-xs font-bold">
                                {task.course_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black inline-block shadow-2xs">
                            المرحلة {getStageNameInArabic(task.stage_number)} • {task.semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs border ${
                            task.study_type === 'evening'
                              ? 'bg-slate-100 text-slate-950 border-slate-300'
                              : task.study_type === 'both'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                              : 'bg-sky-50 text-sky-950 border-sky-200'
                          }`}>
                            {task.study_type === 'evening' ? (
                              <>
                                <Moon className="w-3.5 h-3.5 text-sky-700" />
                                <span>مسائي</span>
                              </>
                            ) : task.study_type === 'both' ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                <span>صباحي ومسائي</span>
                              </>
                            ) : (
                              <>
                                <Sun className="w-3.5 h-3.5 text-sky-600" />
                                <span>صباحي</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-950 font-black text-sm">{task.title}</span>
                            {task.included_topics && (
                              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 max-w-[200px] truncate" title={task.included_topics}>
                                {task.included_topics}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-[#1A3C6E]" />
                            <span>{task.teacher_name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {isAssignment || isReport ? (
                            <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs font-black font-mono">
                                {taskSubs.length} تسليم
                              </span>
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                                task.is_submission_open === false 
                                  ? 'bg-rose-100 text-rose-950 border-rose-300' 
                                  : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              }`}>
                                {task.is_submission_open === false ? 'مقفل' : 'مفتوح'}
                              </span>
                              {acceptedSubs > 0 && (
                                <span className="text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 text-xs font-black">
                                  {acceptedSubs} مقبول
                                </span>
                              )}
                              {revisionSubs > 0 && (
                                <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 text-xs font-black">
                                  {revisionSubs} تعديل
                                </span>
                              )}
                              {rejectedSubs > 0 && (
                                <span className="text-rose-950 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-300 text-xs font-black">
                                  {rejectedSubs} مرفوض
                                </span>
                              )}
                              {pendingSubs > 0 && (
                                <span className="text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-300 text-xs font-black">
                                  {pendingSubs} تدقيق
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-black inline-block whitespace-nowrap">
                              امتحان ورقي / حضوري
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-black text-slate-950 font-mono text-xs sm:text-sm">
                              {new Date(task.due_date).toLocaleDateString('ar-IQ-u-nu-latn')}
                            </span>
                            <span className="text-slate-600 text-xs font-black font-mono inline-flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{new Date(task.due_date).toLocaleTimeString('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            {task.room_or_hall && (
                              <span className="text-emerald-950 bg-emerald-50 border border-emerald-300 text-xs font-black px-2 py-0.5 rounded-md block mt-1">
                                {task.room_or_hall}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl font-mono font-black text-sm shadow-2xs">
                            {task.max_score} د
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {(isAssignment || isReport) ? (
                              <button
                                type="button"
                                onClick={() => setInspectingTask(task)}
                                className="px-3.5 py-2 bg-[#1A3C6E] hover:bg-[#15305B] text-white rounded-xl border border-[#1A3C6E] transition-all inline-flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                                title="معاينة تسليمات الطلاب وقرارات التدقيق"
                              >
                                <Eye className="w-4 h-4 text-white" />
                                <span>التسليمات</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold px-2 py-1">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
        </table>
      </div>

        {/* 📑 شريط التنقل بين صفحات التكليفات والمهام */}
        <AdminPagination
          currentPage={taskPage}
          totalItems={filteredTasks.length}
          pageSize={taskPageSize}
          onPageChange={setTaskPage}
          onPageSizeChange={setTaskPageSize}
          itemLabel="تكليف / امتحان"
          className="mt-4"
        />
      </div>

      {/* 👁️ نافذة معاينة وتدقيق تسليمات الطلاب العريضة والاحترافية لرئاسة القسم */}
      {inspectingTask && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in" dir="rtl">
          <div className="bg-white border-2 border-slate-300 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* الترويسة الثابتة */}
            <div className="p-6 bg-white text-slate-900 rounded-t-3xl flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-300 shadow-2xs">
                  <ShieldCheck className="w-7 h-7 text-indigo-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 text-xs font-black rounded-xl">
                      إشراف وتدقيق رئاسة القسم
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-900 text-xs font-black rounded-xl border border-slate-300 font-mono">
                      {inspectingTask.course_code}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-900 text-xs font-black rounded-xl border border-slate-300">
                      المرحلة {getStageNameInArabic(inspectingTask.stage_number)}
                    </span>
                    <span className="px-3 py-1 bg-sky-50 text-sky-950 text-xs font-black rounded-xl border border-sky-200">
                      {inspectingTask.study_type === 'evening' ? 'الدراسة المسائية' : inspectingTask.study_type === 'both' ? 'صباحي ومسائي' : 'الدراسة الصباحية'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    {inspectingTask.title} — التدريسي: <strong className="text-indigo-950">{inspectingTask.teacher_name}</strong>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingTask(null)}
                className="p-2 text-slate-700 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* جدول التسليمات والقرارات */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-700" />
                  <span>قائمة تسليمات الطلاب والقرارات الأكاديمية المسجلة:</span>
                </h4>

                <button
                  type="button"
                  onClick={async () => {
                    const allProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
                    const stds = allProfiles.filter((p) => p.role === 'student' && p.department_id === inspectingTask.department_id);
                    const taskSubs = submissions.filter((s) => s.task_id === inspectingTask.id);
                    await exportTaskSubmissionsReportPDF({
                      task: inspectingTask,
                      submissions: taskSubs,
                      allStudents: stds,
                      teacherName: inspectingTask.teacher_name,
                    });
                    setToastMsg(`تم تصدير كشف تسليمات (${inspectingTask.title}) بنجاح! 📊`);
                    setTimeout(() => setToastMsg(''), 4000);
                  }}
                  className="px-4 py-2.5 bg-[#1A3C6E] hover:bg-[#15305B] text-white text-xs sm:text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1A3C6E] active:scale-95"
                >
                  <Printer className="w-4 h-4 text-cyan-300" />
                  <span>تصدير كشف رسمي معتمد PDF</span>
                </button>
              </div>

              {(() => {
                const taskSubs = submissions.filter((s) => s.task_id === inspectingTask.id);
                if (taskSubs.length === 0) {
                  return (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 text-slate-700 text-sm sm:text-base font-black space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p>لم يقم أي طالب بتسليم هذا التكليف حتى الآن.</p>
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                    <table className="w-full text-right border-collapse text-xs sm:text-sm font-black">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300">
                          <th className="p-3.5 text-center w-12">#</th>
                          <th className="p-3.5 text-right pr-4">اسم الطالب</th>
                          <th className="p-3.5 text-center">الرقم الجامعي</th>
                          <th className="p-3.5 text-center">نوع التقديم</th>
                          <th className="p-3.5 text-center">قرار التدقيق الأكاديمي</th>
                          {inspectingTask.task_type === 'report' && <th className="p-3.5 text-center">نسبة الاستلال</th>}
                          <th className="p-3.5 text-center">الدرجة الممنوحة</th>
                          <th className="p-3.5 text-right">ملاحظات التدريسي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {taskSubs.map((sub, sIdx) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 text-center text-slate-600 font-mono font-bold">
                              {sIdx + 1}
                            </td>
                            <td className="p-3.5 pr-4 font-black text-slate-950">
                              <strong className="block leading-tight">{sub.student_name}</strong>
                              {sub.submission_type === 'group' && sub.group_members && sub.group_members.length > 0 && (
                                <div className="text-xs font-black text-sky-900 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 mt-1 inline-block">
                                  أعضاء الفريق: {sub.group_members.map((m) => m.full_name).join('، ')}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-center text-slate-700 font-mono font-bold">
                              {sub.student_university_number}
                            </td>
                            <td className="p-3.5 text-center">
                              {sub.submission_type === 'group' ? (
                                <span className="px-2.5 py-1 bg-sky-50 text-sky-950 border border-sky-200 rounded-lg text-xs font-black">
                                  جماعي (فريق)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-black">
                                  فردي
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {sub.review_decision === 'accepted' ? (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>مقبول</span>
                                </span>
                              ) : sub.review_decision === 'needs_revision' ? (
                                <span className="px-2.5 py-1 bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
                                  <RotateCcw className="w-3.5 h-3.5 text-sky-700" />
                                  <span>يحتاج تعديل</span>
                                </span>
                              ) : sub.review_decision === 'rejected' ? (
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-950 border border-rose-300 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs">
                                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                                  <span>مرفوض</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-950 border border-blue-200 rounded-xl text-xs font-black">
                                  قيد التدقيق
                                </span>
                              )}
                            </td>
                            {inspectingTask.task_type === 'report' && (
                              <td className="p-3.5 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-black border font-mono ${
                                  (sub.plagiarism_percentage || 0) <= 20 
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300' 
                                    : 'bg-rose-50 text-rose-950 border-rose-300'
                                }`}>
                                  {sub.plagiarism_percentage !== undefined ? `${sub.plagiarism_percentage}%` : '—'}
                                </span>
                              </td>
                            )}
                            <td className="p-3.5 text-center font-black text-slate-950 font-mono text-sm sm:text-base">
                              {sub.score !== undefined ? (
                                <span className="text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  {sub.score} / {inspectingTask.max_score}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold">—</span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-800 max-w-xs text-xs font-black leading-relaxed">
                              {sub.decision_reason || sub.teacher_feedback || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* الفوتر الثابت */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingTask(null)}
                className="px-6 py-2.5 bg-[#1A3C6E] hover:bg-[#15305B] text-white text-xs sm:text-sm font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
