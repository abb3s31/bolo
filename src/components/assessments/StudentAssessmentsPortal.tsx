'use client';

// 🎓 بوابة استعراض التكليفات والامتحانات الفصلية للطلبة (مسار بولونيا)
// كويزات، واجبات، تقارير، مدتيرم، وعملي مع المادة الداخلة وعناوين التقارير والعداد التنازلي وتصدير PDF

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  HelpCircle,
  Layers,
  Clock,
  AlertTriangle,
  Download,
  Calendar,
  MapPin,
  Award,
  Filter,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Sun,
  Moon,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { CourseAcademicTask, AcademicTaskType, StudentTaskSubmission, UserProfile } from '@/types';
import { INITIAL_ACADEMIC_TASKS, INITIAL_STUDENT_SUBMISSIONS, getStoredData, saveStoredData } from '@/lib/mock-data';
import { exportCourseTaskBriefPDF } from '@/lib/pdf-export';
import {
  getCurrentSessionUser,
  syncAcademicTasksFromSupabase,
  syncTaskSubmissionsFromSupabase,
  saveTaskSubmissionToSupabase
} from '@/lib/supabase-client'; // ☁️ المزامنة السحابية وحفظ التسليمات
import { StudentTaskSubmissionModal } from './StudentTaskSubmissionModal'; // 📤 نافذة تسليم ورفع الملفات
import { UploadCloud, Lock, Unlock, Users, User, ExternalLink } from 'lucide-react';

interface StudentAssessmentsPortalProps {
  studentDepartmentId: string;
  studentStageNumber: number;
}

export function StudentAssessmentsPortal({
  studentDepartmentId,
  studentStageNumber,
}: StudentAssessmentsPortalProps) {
  const [tasks, setTasks] = useState<CourseAcademicTask[]>([]);
  const [submissions, setSubmissions] = useState<StudentTaskSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة المواد
  const courseDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة المواد
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [selectedTaskForSubmissionModal, setSelectedTaskForSubmissionModal] = useState<CourseAcademicTask | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  // 🔄 تحميل التكليفات والتتبع الشخصي
  useEffect(() => {
    const user = getCurrentSessionUser();
    setCurrentUser(user);

    try {
      const stored = localStorage.getItem('app_course_academic_tasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(INITIAL_ACADEMIC_TASKS);
      }

      // تحميل تسليمات الطلاب
      const storedSubmissions = getStoredData<StudentTaskSubmission[]>('task_student_submissions', INITIAL_STUDENT_SUBMISSIONS);
      setSubmissions(storedSubmissions);

      const completed = localStorage.getItem('app_student_completed_tasks');
      if (completed) {
        setCompletedTaskIds(JSON.parse(completed));
      }
    } catch {
      setTasks(INITIAL_ACADEMIC_TASKS);
      setSubmissions(INITIAL_STUDENT_SUBMISSIONS);
    }

    // ☁️ مزامنة التكليفات والتسليمات الحية من سحابة Supabase
    syncAcademicTasksFromSupabase().then((liveTasks) => {
      if (liveTasks && liveTasks.length > 0) setTasks(liveTasks);
    }).catch(() => { });
    syncTaskSubmissionsFromSupabase().then((liveSubs) => {
      if (liveSubs && liveSubs.length > 0) setSubmissions(liveSubs);
    }).catch(() => { });
  }, []);

  // 🔒 مستمع النقر بالخارج لإغلاق قائمة المواد
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 💾 تبديل حالة إنجاز التكليف شخصياً للطالب
  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      try {
        localStorage.setItem('app_student_completed_tasks', JSON.stringify(next));
      } catch {
        // تجاهل
      }
      return next;
    });
  };

  // 🔍 تصفية التكليفات الخاصة بمرحلة وقسم الطالب
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.is_published) return false;

      // مطابقة القسم والمرحلة (إن وُجدت)
      if (studentDepartmentId && t.department_id !== studentDepartmentId) return false;
      if (studentStageNumber && t.stage_number !== studentStageNumber) return false;

      if (selectedType !== 'all' && t.task_type !== selectedType) return false;
      if (selectedCourse !== 'all' && t.course_id !== selectedCourse) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCourse = t.course_name.toLowerCase().includes(q);
        const matchesTopics = t.included_topics.toLowerCase().includes(q);
        const matchesTeacher = t.teacher_name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesTopics && !matchesTeacher) return false;
      }

      return true;
    });
  }, [tasks, studentDepartmentId, studentStageNumber, selectedType, selectedCourse, searchQuery]);

  // 📚 قائمة المواد الفريدة
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (!map.has(t.course_id)) {
        map.set(t.course_id, t.course_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // 📊 إحصائيات الطالب
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => completedTaskIds.includes(t.id)).length;
    const pending = total - completed;
    const quizzes = filteredTasks.filter((t) => t.task_type === 'quiz').length;
    const assignments = filteredTasks.filter((t) => t.task_type === 'assignment').length;
    const midterms = filteredTasks.filter((t) => t.task_type === 'midterm_exam').length;
    return { total, completed, pending, quizzes, assignments, midterms };
  }, [filteredTasks, completedTaskIds]);

  // 📄 تصدير ورقة التكليف PDF
  const handleExportPdf = async (task: CourseAcademicTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExportingPdf(task.id);
    try {
      await exportCourseTaskBriefPDF({
        task,
        headName: 'أ.م.د. علي حسن الموسوي',
      });
    } catch {
      setToastMsg('⚠️ حدث خطأ أثناء تصدير ورقة التكليف');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsExportingPdf(null);
    }
  };

  // ⏱️ دالة حساب الوقت المتبقي
  const getTimeRemainingText = (dueDateStr: string) => {
    const now = new Date().getTime();
    const target = new Date(dueDateStr).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return { text: 'انتهى الموعد المحدد ⛔', isLate: true, isUrgent: false };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return { text: `متبقٍ ${days} يوم و ${hours % 24} ساعة`, isLate: false, isUrgent: days <= 2 };
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { text: `متبقٍ ${hours} ساعة و ${minutes} دقيقة ⏰`, isLate: false, isUrgent: true };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
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

      {/* 🌟 الترويسة الأكاديمية وبطاقات الإنجاز */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-700/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">مركز التكليفات والامتحانات الفصلية</h1>
                <p className="text-base font-black text-slate-300 mt-1">
                  استعراض الكويزات، الواجبات، التقارير، المدتيرم، والامتحان العملي والمفردات الداخلة لكل مادة
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-2.5 text-center">
              <span className="text-sm font-black text-slate-300 block">نسبة إنجاز تكليفاتك</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-black text-emerald-400">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
                <span className="text-sm font-black text-slate-400">
                  ({stats.completed} من {stats.total})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 بطاقات الإحصائيات السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-slate-300 block">إجمالي التكليفات</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-emerald-300 block">تم إنجازها</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.completed}</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-blue-300 block">الكويزات 📝</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.quizzes}</span>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-indigo-300 block">الواجبات 📑</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">{stats.assignments}</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-rose-300 block">المدتيرم 🎯</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.midterms}</span>
          </div>
        </div>

        {/* 🔍 شريط البحث والفلاتر الذكية */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في العنوان، المادة، المادة الداخلة..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl pr-10 pl-3 py-2.5 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="relative" ref={courseDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className={`bg-slate-800 border text-white text-sm sm:text-base font-black rounded-2xl px-4 py-2.5 flex items-center gap-2 cursor-pointer shadow-sm transition-all ${isCourseDropdownOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
                  }`}
              >
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {selectedCourse === 'all'
                    ? 'كافة المواد الدراسية 📚'
                    : uniqueCourses.find((c) => c.id === selectedCourse)?.name || 'اختر المادة'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isCourseDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {isCourseDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse('all');
                      setIsCourseDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${selectedCourse === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                  >
                    <span>كافة المواد الدراسية 📚</span>
                    {selectedCourse === 'all' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  {uniqueCourses.map((c) => {
                    const isSel = selectedCourse === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourse(c.id);
                          setIsCourseDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${isSel ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                          }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {isSel && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'كافة التكليفات' },
              { id: 'quiz', label: 'كويزات 📝' },
              { id: 'assignment', label: 'واجبات 📑' },
              { id: 'report', label: 'تقارير 📄' },
              { id: 'midterm_exam', label: 'مدتيرم 🎯' },
              { id: 'practical_exam', label: 'عملي 🔬' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`text-base font-black px-4 py-2 rounded-2xl transition-all whitespace-nowrap cursor-pointer ${selectedType === tab.id ? 'bg-sky-700 text-white shadow-md shadow-sky-700/20' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 بطاقات التكليفات والامتحانات للطلبة */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-950 font-black mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">لا توجد تكليفات مطابقة لخيارات الفرز حالياً</h3>
          <p className="text-sm font-black text-slate-900 font-bold mt-1">
            سيتم إشعارك فور قيام أساتذة موادك بنشر أي كويز، واجب، تقرير، أو موعد امتحان.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const isCompleted = completedTaskIds.includes(task.id);
            const timeStatus = getTimeRemainingText(task.due_date);

            const isQuiz = task.task_type === 'quiz';
            const isAssignment = task.task_type === 'assignment';
            const isReport = task.task_type === 'report';
            const isMidterm = task.task_type === 'midterm_exam';
            const isPractical = task.task_type === 'practical_exam';

            // البحث عن تسليم الطالب الحالي لهذا التكليف
            const mySubmission = submissions.find(
              (s) =>
                s.task_id === task.id &&
                (s.student_id === currentUser?.id || s.group_members?.some((m) => m.student_id === currentUser?.id || m.full_name === currentUser?.full_name))
            );

            const isSubmitted = !!mySubmission;
            const isGraded = isSubmitted && mySubmission.score !== undefined && mySubmission.score !== null;
            const isLocked = task.is_submission_open === false;

            const badgeBg = isQuiz
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : isAssignment
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : isReport
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : isMidterm
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-teal-500/10 border-teal-500/30 text-teal-400';

            const typeLabel = isQuiz
              ? 'كويز وامتحان قصير'
              : isAssignment
                ? 'واجب بيتي / تطبيقي'
                : isReport
                  ? 'تقرير وبحث علمي'
                  : isMidterm
                    ? 'امتحان مدتيرم'
                    : 'امتحان عملي ومختبري';

            return (
              <div
                key={task.id}
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className={`bg-slate-900 border rounded-3xl p-6 shadow-lg transition-all cursor-pointer ${isCompleted
                    ? 'border-emerald-500/30 opacity-90'
                    : isExpanded
                      ? 'border-cyan-500 shadow-cyan-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                {/* رأس التكليف والمادة والموعد */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task.id);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 border ${isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 hover:border-emerald-400 text-transparent hover:text-emerald-400 bg-slate-800'
                        }`}
                      title={isCompleted ? 'إلغاء وضع علامة تم الإنجاز' : 'تعليم كمُنجز'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-black px-3 py-1 rounded-xl border ${badgeBg}`}>
                          {typeLabel}
                        </span>
                        <span className="text-base font-black text-white bg-slate-800 px-3 py-1 rounded-xl">
                          {task.course_name}
                        </span>
                        <span className="text-sm font-black text-cyan-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5">
                          {task.study_type === 'evening' ? (
                            <>
                              <Moon className="w-3.5 h-3.5 text-sky-400" />
                              <span>مسائي</span>
                            </>
                          ) : task.study_type === 'both' ? (
                            <>
                              <Users className="w-3.5 h-3.5 text-emerald-400" />
                              <span>صباحي ومسائي</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-3.5 h-3.5 text-sky-400" />
                              <span>صباحي</span>
                            </>
                          )}
                        </span>
                        <span className="text-sm font-black text-slate-400">
                          أستاذ المادة: <strong className="text-slate-200">{task.teacher_name}</strong>
                        </span>
                      </div>

                      <h3 className={`text-base sm:text-lg font-black mt-2.5 ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                    </div>
                  </div>

                  {/* شريط الموعد والحالة */}
                  <div className="flex items-center gap-2 sm:self-start shrink-0">
                    <span
                      className={`text-base font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${timeStatus.isLate ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : timeStatus.isUrgent ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{timeStatus.text}</span>
                    </span>

                    <span className="text-base font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>{task.max_score} درجات</span>
                    </span>

                    <button
                      onClick={(e) => handleExportPdf(task, e)}
                      disabled={isExportingPdf === task.id}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition-all text-base font-black"
                      title="تحميل ورقة التكليف الرسمية PDF"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* 📚 المعاينة المختصرة للمادة الداخلة */}
                {!isExpanded && (
                  <div className="mt-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl p-3 flex items-center gap-2 text-base font-black text-slate-300">
                    <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 shrink-0">المادة الداخلة:</span>
                    <span className="line-clamp-1 font-medium text-slate-200">{task.included_topics}</span>
                  </div>
                )}

                {/* 📖 التفاصيل الكاملة عند التوسيع (Expanded View) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                    {task.description && (
                      <p className="text-base font-black text-slate-300 leading-relaxed bg-slate-800/30 p-3.5 rounded-2xl">
                        {task.description}
                      </p>
                    )}

                    {/* 📚 المادة والمفردات والصفحات الداخلة في الامتحان بالتفصيل */}
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-base font-black text-cyan-300 mb-2">
                        <BookOpen className="w-5 h-5" />
                        <span>المادة والمفردات والصفحات المشمولة بالامتحان / الكويز:</span>
                      </div>
                      <p className="text-base font-black text-white leading-relaxed whitespace-pre-wrap">
                        {task.included_topics}
                      </p>
                    </div>

                    {/* ❓ نص الواجب والمطاليب إن وُجد */}
                    {task.assignment_questions && (
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between text-base font-black text-sky-300 mb-2">
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5" />
                            <span>سؤال الواجب والمطاليب المحددة:</span>
                          </span>
                          {task.assignment_type && (
                            <span className="bg-sky-500/20 px-3 py-1 rounded-xl text-sm font-black">
                              نوع الواجب: {task.assignment_type}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-black text-slate-100 leading-relaxed whitespace-pre-wrap">
                          {task.assignment_questions}
                        </p>
                      </div>
                    )}

                    {/* 📑 عناوين التقارير المتاحة إن وُجدت */}
                    {task.report_topics && task.report_topics.length > 0 && (
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-base font-black text-sky-300 mb-2.5">
                          <Layers className="w-5 h-5" />
                          <span>قائمة العناوين والمحاور المعتمدة للتقرير (اختر عنواناً واحداً):</span>
                        </div>
                        <div className="space-y-2.5">
                          {task.report_topics.map((topic, idx) => (
                            <div key={topic.id} className="bg-slate-900/80 p-3.5 rounded-2xl border border-sky-500/20">
                              <div className="flex items-center gap-2 text-base font-black text-white">
                                <span className="w-6 h-6 rounded-lg bg-sky-600/30 text-sky-300 flex items-center justify-center text-sm font-black font-mono">
                                  {idx + 1}
                                </span>
                                <span>{topic.title}</span>
                              </div>
                              {topic.description && (
                                <p className="text-base font-black text-slate-300 mt-1.5 pr-8 leading-relaxed">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {task.report_guidelines && (
                          <div className="mt-3.5 pt-3 border-t border-sky-500/20 text-base font-black text-sky-200">
                            <strong>📋 شروط وضوابط التقرير:</strong> {task.report_guidelines}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ⚠️ تحذير وعقوبة التأخير */}
                    {task.late_penalty_warning && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-base font-black text-rose-400 block">تنبيه وتحذير التأخير:</strong>
                          <p className="text-base font-black text-rose-200 mt-1 leading-relaxed">
                            {task.late_penalty_warning}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* تفاصيل المواعيد والقاعة */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-base font-black text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <span>موعد الامتحان / التسليم: <strong className="text-white font-mono">{new Date(task.due_date).toLocaleString('ar-IQ-u-nu-latn')}</strong></span>
                      </div>

                      {task.final_deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-sky-400" />
                          <span>آخر موعد نهائي: <strong className="text-white font-mono">{new Date(task.final_deadline).toLocaleString('ar-IQ-u-nu-latn')}</strong></span>
                        </div>
                      )}

                      {task.room_or_hall && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-400" />
                          <span>القاعة / المختبر: <strong className="text-white">{task.room_or_hall}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* 📦 صندوق حالة تسليم الطالب للملفات وقرار التدقيق الأكاديمي */}
                    {(isAssignment || isReport) && (
                      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
                          <span className="text-base font-black text-white flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-cyan-400" />
                            <span>موقفك من تسليم هذا التكليف:</span>
                          </span>

                          {mySubmission ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {/* شارة القرار الأكاديمي */}
                              {mySubmission.review_decision === 'accepted' ? (
                                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-2xl font-black text-base inline-flex items-center gap-1.5">
                                  <span>🟢 تم القبول</span>
                                  {mySubmission.score !== undefined && (
                                    <strong className="font-black mr-1 font-mono">({mySubmission.score} / {task.max_score} درجات)</strong>
                                  )}
                                </span>
                              ) : mySubmission.review_decision === 'needs_revision' ? (
                                <span className="px-3.5 py-1.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-2xl font-black text-base inline-flex items-center gap-2 animate-pulse">
                                  <RotateCcw className="w-4 h-4 text-sky-400" />
                                  <span>🔄 يحتاج تعديل وإعادة رفع</span>
                                </span>
                              ) : mySubmission.review_decision === 'rejected' ? (
                                <span className="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-2xl font-black text-base inline-flex items-center gap-1.5">
                                  <span>🔴 تم رفض التسليم</span>
                                </span>
                              ) : (
                                <span className="px-3.5 py-1.5 bg-blue-500/20 text-cyan-300 border border-blue-500/40 rounded-2xl font-black text-base">
                                  تم التسليم (بانتظار تدقيق الأستاذ ⏳)
                                </span>
                              )}

                              {/* نسبة الاستلال العلمي للتقارير */}
                              {isReport && mySubmission.plagiarism_percentage !== undefined && mySubmission.plagiarism_percentage !== null && (
                                <span className={`px-3 py-1.5 rounded-2xl text-base font-black border font-mono ${mySubmission.plagiarism_percentage <= 15 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : mySubmission.plagiarism_percentage <= 25 ? 'bg-sky-500/10 text-sky-300 border-sky-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
                                  🔬 {mySubmission.plagiarism_percentage}% استلال
                                </span>
                              )}
                            </div>
                          ) : isLocked ? (
                            <span className="px-3.5 py-1.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-2xl font-black text-base">
                              🔒 باب التسليم مغلق من قبل أستاذ المادة
                            </span>
                          ) : (
                            <span className="px-3.5 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600 rounded-2xl font-black text-base">
                              بانتظار رفعك للحل ⏳
                            </span>
                          )}
                        </div>

                        {/* تفاصيل التسليم والقرارات والملاحظات */}
                        {isSubmitted && (
                          <div className="space-y-3 text-base font-black">
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                              <div className="flex items-center gap-2.5">
                                <FileCheck2 className="w-5 h-5 text-red-400" />
                                <span className="text-slate-200 font-bold">{mySubmission.file_name}</span>
                                <span className="text-sm font-black text-slate-400 font-mono">
                                  ({(mySubmission.file_size_bytes / 1024).toFixed(1)} KB)
                                </span>
                                {mySubmission.revision_count && mySubmission.revision_count > 1 && (
                                  <span className="px-2 py-0.5 bg-blue-900/80 text-cyan-200 rounded-lg text-xs font-black">
                                    النسخة رقم {mySubmission.revision_count}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-black text-slate-400 font-mono">
                                سُلِّم في: {new Date(mySubmission.submitted_at).toLocaleDateString('ar-IQ-u-nu-latn')}
                              </span>
                            </div>

                            {/* أعضاء الفريق للتقرير الجماعي */}
                            {mySubmission.submission_type === 'group' && mySubmission.group_members && mySubmission.group_members.length > 0 && (
                              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-base font-black text-sky-200">
                                <strong className="text-sky-300 block mb-1.5">👥 أعضاء فريق التقرير المشترك:</strong>
                                <div className="flex flex-wrap gap-2">
                                  {mySubmission.group_members.map((m, mIdx) => (
                                    <span key={mIdx} className="px-2.5 py-1 bg-sky-900/60 rounded-xl font-bold text-sky-200 border border-sky-700 text-sm">
                                      {m.full_name} <span className="font-mono">({m.university_number})</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 🔄 صندوق توجيهات التعديل وموعد المهلة بحدود ناعمة */}
                            {mySubmission.review_decision === 'needs_revision' && (
                              <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-base font-black space-y-2">
                                <div className="flex items-center gap-2 text-sky-300 font-black">
                                  <RotateCcw className="w-5 h-5 text-sky-400" />
                                  <span>توجيهات أستاذ المادة للتعديل المطلوب ({mySubmission.graded_by || task.teacher_name}):</span>
                                </div>
                                <p className="text-sky-100 font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
                                  {mySubmission.decision_reason || mySubmission.teacher_feedback || 'يرجى تصحيح الملاحظات وإعادة الرفع.'}
                                </p>
                                {mySubmission.revision_deadline && (
                                  <p className="text-sm font-black text-sky-300">
                                    ⏳ آخر مهلة لرفع النسخة المعدلة: <strong className="font-mono">{new Date(mySubmission.revision_deadline).toLocaleDateString('ar-IQ-u-nu-latn')}</strong>
                                  </p>
                                )}
                              </div>
                            )}

                            {/* 🔴 صندوق سبب الرفض إن وجد بحدود ناعمة */}
                            {mySubmission.review_decision === 'rejected' && (
                              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-base font-black space-y-1.5">
                                <div className="flex items-center gap-2 text-rose-400 font-black">
                                  <AlertTriangle className="w-5 h-5" />
                                  <span>سبب رفض التكليف ({mySubmission.graded_by || task.teacher_name}):</span>
                                </div>
                                <p className="text-rose-200 font-medium leading-relaxed bg-rose-950/40 p-3 rounded-xl border border-rose-500/20">
                                  {mySubmission.decision_reason || mySubmission.teacher_feedback || 'التكليف غير مطابق للمعايير الأكاديمية المطلوبة.'}
                                </p>
                              </div>
                            )}

                            {/* 🟢 ملاحظات التدريسي العادية عند القبول */}
                            {mySubmission.review_decision === 'accepted' && mySubmission.teacher_feedback && (
                              <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-2xl text-base font-black text-cyan-200">
                                <strong>📝 ملاحظات وتوجيهات الأستاذ ({mySubmission.graded_by || task.teacher_name}):</strong>
                                <p className="mt-1 font-normal leading-relaxed text-white">
                                  {mySubmission.teacher_feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* زر التحميل والرفع والإنجاز */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">

                      {/* زر رفع الواجب أو التقرير أو النسخة المعدلة للطالب */}
                      {(isAssignment || isReport) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskForSubmissionModal(task);
                          }}
                          disabled={isLocked && !isSubmitted}
                          className={`px-5 py-2.5 rounded-2xl text-base font-black transition flex items-center gap-2 cursor-pointer shadow-md ${mySubmission?.review_decision === 'needs_revision' ? 'bg-sky-600 hover:bg-sky-500 text-white font-black shadow-sky-500/20 animate-bounce' : isSubmitted ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' : isLocked ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
                        >
                          <UploadCloud className="w-5 h-5" />
                          <span>
                            {mySubmission?.review_decision === 'needs_revision'
                              ? `🔄 رفع النسخة المعدلة (Revision #${(mySubmission.revision_count || 1) + 1})`
                              : isSubmitted
                                ? 'تعديل أو إعادة رفع الملف 🔄'
                                : isLocked
                                  ? '🔒 الاستلام مقفل'
                                  : '📤 رفع الحل / التقرير (PDF)'}
                          </span>
                        </button>
                      ) : (
                        <div></div>
                      )}

                      <button
                        onClick={(e) => handleExportPdf(task, e)}
                        disabled={isExportingPdf === task.id}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-black px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-700 transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-5 h-5 text-cyan-400" />
                        <span>{isExportingPdf === task.id ? 'جارٍ التوليد...' : 'تنزيل كتاب التكليف الرسمي (PDF)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 📤 نافذة تسليم ورفع ملفات الواجبات والتقارير للطلاب */}
      {selectedTaskForSubmissionModal && currentUser && (
        <StudentTaskSubmissionModal
          isOpen={!!selectedTaskForSubmissionModal}
          onClose={() => setSelectedTaskForSubmissionModal(null)}
          task={selectedTaskForSubmissionModal}
          student={currentUser}
          existingSubmission={
            submissions.find(
              (s) =>
                s.task_id === selectedTaskForSubmissionModal.id &&
                (s.student_id === currentUser.id || s.group_members?.some((m) => m.student_id === currentUser.id || m.full_name === currentUser.full_name))
            ) || null
          }
          onSaveSubmission={(newSub) => {
            const exists = submissions.some((s) => s.id === newSub.id);
            let updatedList: StudentTaskSubmission[];
            if (exists) {
              updatedList = submissions.map((s) => (s.id === newSub.id ? newSub : s));
            } else {
              updatedList = [...submissions, newSub];
            }
            setSubmissions(updatedList);
            saveStoredData('task_student_submissions', updatedList);
            saveTaskSubmissionToSupabase(newSub); // ☁️ رفع وحفظ تسليم الطالب في سحابة Supabase فوراً
          }}
        />
      )}
    </div>
  );
}
