'use client';

//  لوحة إدارة ونشر التكليفات والامتحانات الفصلية للأساتذة (مسار بولونيا)
// تشمل: الكويزات، الواجبات، التقارير، المدتيرم، والامتحان العملي مع المادة الداخلة وعقوبات التأخير

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Download, 
  Send, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Calendar, 
  Filter,
  Check,
  Unlock, 
  Lock, 
  Users,
  MapPin,
  Award,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';
import { Course, CourseAcademicTask, AcademicTaskType, ReportTopicItem, TeacherCourse, StudentTaskSubmission, UserProfile } from '@/types';
import { getAcademicYear, INITIAL_COURSES, INITIAL_TEACHER_COURSES, INITIAL_ACADEMIC_TASKS, INITIAL_STUDENT_SUBMISSIONS, INITIAL_PROFILES, getStoredData, saveStoredData } from '@/lib/mock-data'; // 🗓️ العام الدراسي المعتمد والبيانات الأولية
import { 
  syncAcademicYearFromSupabase, 
  subscribeToAcademicYearChanges,
  syncAcademicTasksFromSupabase,
  saveAcademicTaskToSupabase,
  deleteAcademicTaskFromSupabase,
  syncTaskSubmissionsFromSupabase,
  saveTaskSubmissionToSupabase,
  deleteTaskSubmissionFromSupabase,
} from '@/lib/supabase-client'; // ☁️ المزامنة السحابية المباشرة لكافة التكليفات والتسليمات
import { exportCourseTaskBriefPDF } from '@/lib/pdf-export';
import { TeacherSubmissionsReviewModal } from './TeacherSubmissionsReviewModal'; // 📥 نافذة تقييم واستعراض التسليمات
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر

interface TeacherAssessmentsManagerProps {
  teacherId: string;
  teacherName: string;
  assignedCourses: TeacherCourse[];
}

export function TeacherAssessmentsManager({
  teacherId,
  teacherName,
  assignedCourses,
}: TeacherAssessmentsManagerProps) {
  // 🗄️ حالة المهام والتكليفات
  const [tasks, setTasks] = useState<CourseAcademicTask[]>([]);
  const [deletingTask, setDeletingTask] = useState<CourseAcademicTask | null>(null); // 🗑️ حالة التكليف المراد حذفه
  const [submissions, setSubmissions] = useState<StudentTaskSubmission[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]); // 🔘 معرفات التكليفات المحددة
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false); // 🗑️ نافذة تأكيد الحذف الجماعي
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isFilterCourseDropdownOpen, setIsFilterCourseDropdownOpen] = useState<boolean>(false);
  const filterCourseDropdownRef = useRef<HTMLDivElement>(null);

  // 🔽 حالات ومراجع القوائم المنسدلة لنافذة إنشاء/تعديل التكليف
  const [isFormCourseDropdownOpen, setIsFormCourseDropdownOpen] = useState<boolean>(false);
  const [isFormTypeDropdownOpen, setIsFormTypeDropdownOpen] = useState<boolean>(false);
  const [isFormStudyDropdownOpen, setIsFormStudyDropdownOpen] = useState<boolean>(false);
  const [isFormAssignmentTypeDropdownOpen, setIsFormAssignmentTypeDropdownOpen] = useState<boolean>(false);
  const formCourseDropdownRef = useRef<HTMLDivElement>(null);
  const formTypeDropdownRef = useRef<HTMLDivElement>(null);
  const formStudyDropdownRef = useRef<HTMLDivElement>(null);
  const formAssignmentTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CourseAcademicTask | null>(null);
  const [selectedTaskForSubmissions, setSelectedTaskForSubmissions] = useState<CourseAcademicTask | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 🔒 مستمع النقر بالخارج لإغلاق كافة القوائم المنسدلة المخصصة
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterCourseDropdownRef.current && !filterCourseDropdownRef.current.contains(target)) {
        setIsFilterCourseDropdownOpen(false);
      }
      if (formCourseDropdownRef.current && !formCourseDropdownRef.current.contains(target)) {
        setIsFormCourseDropdownOpen(false);
      }
      if (formTypeDropdownRef.current && !formTypeDropdownRef.current.contains(target)) {
        setIsFormTypeDropdownOpen(false);
      }
      if (formStudyDropdownRef.current && !formStudyDropdownRef.current.contains(target)) {
        setIsFormStudyDropdownOpen(false);
      }
      if (formAssignmentTypeDropdownRef.current && !formAssignmentTypeDropdownRef.current.contains(target)) {
        setIsFormAssignmentTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 📝 حالة النموذج (Form State)
  const [formData, setFormData] = useState<{
    course_id: string;
    task_type: AcademicTaskType;
    study_type: 'morning' | 'evening' | 'both';
    title: string;
    description: string;
    included_topics: string;
    assignment_questions: string;
    assignment_type: 'theory' | 'practical' | 'code' | 'problem_solving' | 'mixed';
    report_topics: ReportTopicItem[];
    report_guidelines: string;
    start_date: string;
    due_date: string;
    final_deadline: string;
    late_penalty_warning: string;
    max_score: number;
    room_or_hall: string;
    is_published: boolean;
  }>({
    course_id: assignedCourses[0]?.course_id || 'course-1',
    task_type: 'quiz',
    study_type: 'morning',
    title: '',
    description: '',
    included_topics: '',
    assignment_questions: '',
    assignment_type: 'theory',
    report_topics: [],
    report_guidelines: 'ضوابط التقرير: لا يقل عن 5 صفحات، خط 12 Times New Roman، توثيق 3 مراجع IEEE على الأقل، استلال أقل من 15%.',
    start_date: new Date().toISOString().slice(0, 16),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    final_deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    late_penalty_warning: '⚠️ يُخصم 20% عن كل يوم تأخير بعد الموعد المحدد، ولن يُقبل أي تسليم بعد انقضاء الموعد النهائي.',
    max_score: 5.0,
    room_or_hall: '',
    is_published: true,
  });

  // 📑 حالة إضافة عنوان تقرير جديد داخل النموذج
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  // 🗓️ حالة العام الدراسي المعتمد والمتزامن
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🔄 تحميل البيانات وتخزينها محلياً
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_course_academic_tasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(INITIAL_ACADEMIC_TASKS);
        localStorage.setItem('app_course_academic_tasks', JSON.stringify(INITIAL_ACADEMIC_TASKS));
      }

      // تحميل تسليمات الطلاب
      const storedSubmissions = getStoredData<StudentTaskSubmission[]>('task_student_submissions', INITIAL_STUDENT_SUBMISSIONS);
      setSubmissions(storedSubmissions);
    } catch {
      setTasks(INITIAL_ACADEMIC_TASKS);
      setSubmissions(INITIAL_STUDENT_SUBMISSIONS);
    }

    // ☁️ جلب ومزامنة التكليفات والتسليمات من Supabase
    syncAcademicTasksFromSupabase().then((liveTasks) => {
      if (liveTasks && liveTasks.length > 0) setTasks(liveTasks);
    }).catch(() => {});
    syncTaskSubmissionsFromSupabase().then((liveSubs) => {
      if (liveSubs && liveSubs.length > 0) setSubmissions(liveSubs);
    }).catch(() => {});

    // ☁️ جلب ومزامنة العام الدراسي من السحابة
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setAcademicYear(liveYear);
      }).catch(() => {});
    }

    // 📡 الاشتراك بالبث اللحظي للعام الدراسي
    let unsubscribeYear: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribeYear = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }

    return () => {
      if (unsubscribeYear) unsubscribeYear();
    };
  }, []);

  // 💾 دالة حفظ التكليفات في التخزين
  const saveTasksToStorage = useCallback((newTasks: CourseAcademicTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem('app_course_academic_tasks', JSON.stringify(newTasks));
    } catch {
      // تجاهل
    }
  }, []);

  // 🧹 إشعار نجاح مؤقت
  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // 🔍 فلترة التكليفات الخاصة بالأستاذ والمحددة
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // مطابقة الأستاذ أو المواد المكلف بها
      const isTeacherCourse = assignedCourses.some((c) => c.course_id === t.course_id) || t.teacher_id === teacherId;
      if (!isTeacherCourse && assignedCourses.length > 0) return false;

      if (selectedCourseId !== 'all' && t.course_id !== selectedCourseId) return false;
      if (selectedType !== 'all' && t.task_type !== selectedType) return false;
      return true;
    });
  }, [tasks, assignedCourses, teacherId, selectedCourseId, selectedType]);

  // 📊 إحصائيات التكليفات
  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      quizzes: filteredTasks.filter((t) => t.task_type === 'quiz').length,
      assignments: filteredTasks.filter((t) => t.task_type === 'assignment').length,
      reports: filteredTasks.filter((t) => t.task_type === 'report').length,
      midterms: filteredTasks.filter((t) => t.task_type === 'midterm_exam').length,
      practicals: filteredTasks.filter((t) => t.task_type === 'practical_exam').length,
    };
  }, [filteredTasks]);

  // 📚 قائمة المواد الفعلية للأستاذ مع خطة احتياطية كاملة ومتوافقة مع المواد والتكليفات
  const effectiveCourses: TeacherCourse[] = useMemo(() => {
    if (assignedCourses && assignedCourses.length > 0) return assignedCourses;
    const allStoredCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const teacherTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    const matchedTCs = teacherTCs.filter((tc: TeacherCourse): boolean => tc.teacher_id === teacherId || (Boolean(teacherName) && tc.teacher_name === teacherName));
    if (matchedTCs.length > 0) return matchedTCs;

    // 🔍 البحث الاحتياطي في جدول المواد المباشرة
    const directAssigned = allStoredCourses.filter(
      (c: Course): boolean =>
        c.theory_teacher_id === teacherId ||
        c.practical_teacher_id === teacherId ||
        (Boolean(teacherName) && (c.theory_teacher_name === teacherName || c.practical_teacher_name === teacherName))
    );
    if (directAssigned.length > 0) {
      return directAssigned.map((c: Course): TeacherCourse => ({
        id: `tc-${c.id}`,
        teacher_id: teacherId,
        teacher_name: teacherName,
        course_id: c.id,
        course_name: c.name,
        department_id: c.department_id,
        semester: (c.semester || 1) as 1 | 2,
        role_in_course: (c.practical_teacher_id === teacherId && c.theory_teacher_id === teacherId) ? 'both' : (c.practical_teacher_id === teacherId ? 'practical' : 'theory'),
      }));
    }

    return allStoredCourses.map((c: Course): TeacherCourse => ({
      id: `tc-${c.id}`,
      teacher_id: teacherId,
      teacher_name: teacherName,
      course_id: c.id,
      course_name: c.name,
      department_id: c.department_id,
      semester: (c.semester || 1) as 1 | 2,
    }));
  }, [assignedCourses, teacherId, teacherName]);

  // ➕ فتح نافذة الإنشاء مع القيم الافتراضية المناسبة لنوع التكليف
  const handleOpenCreateModal = (type: AcademicTaskType = 'quiz') => {
    const course = effectiveCourses.find((c) => c.course_id === selectedCourseId) || effectiveCourses[0];
    const defaultScore = type === 'quiz' ? 5 : type === 'assignment' ? 5 : 10;
    
    setEditingTask(null);
    setFormData({
      course_id: course ? course.course_id : 'course-1',
      task_type: type,
      study_type: 'morning',
      title: type === 'quiz' ? '📝 كويز رقم (1): ' : type === 'assignment' ? '📑 واجب رقم (1): ' : type === 'report' ? '📄 تقرير وبحث فصلي: ' : type === 'midterm_exam' ? '🎯 امتحان منتصف الفصل الدراسي (مدتيرم)' : '🔬 الامتحان العملي والمختبري الفصلي',
      description: '',
      included_topics: '',
      assignment_questions: '',
      assignment_type: 'theory',
      report_topics: [],
      report_guidelines: 'ضوابط التقرير: 1- عدد الصفحات (5-10). 2- خط Times New Roman 12. 3- توثيق مراجع IEEE. 4- استلال أقل من 15%.',
      start_date: new Date().toISOString().slice(0, 16),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      final_deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      late_penalty_warning: '⚠️ يُخصم 20% عن كل يوم تأخير بعد الموعد المحدد، ولن يُقبل أي تسليم بعد انقضاء الموعد النهائي.',
      max_score: defaultScore,
      room_or_hall: '',
      is_published: true,
    });
    setIsCreateModalOpen(true);
  };

  // ✏️ فتح نافذة التعديل
  const handleOpenEditModal = (task: CourseAcademicTask) => {
    setEditingTask(task);
    setFormData({
      course_id: task.course_id,
      task_type: task.task_type,
      study_type: task.study_type || 'morning',
      title: task.title,
      description: task.description || '',
      included_topics: task.included_topics,
      assignment_questions: task.assignment_questions || '',
      assignment_type: task.assignment_type || 'theory',
      report_topics: task.report_topics || [],
      report_guidelines: task.report_guidelines || '',
      start_date: task.start_date ? new Date(task.start_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      due_date: new Date(task.due_date).toISOString().slice(0, 16),
      final_deadline: task.final_deadline ? new Date(task.final_deadline).toISOString().slice(0, 16) : '',
      late_penalty_warning: task.late_penalty_warning || '',
      max_score: task.max_score,
      room_or_hall: task.room_or_hall || '',
      is_published: task.is_published,
    });
    setIsCreateModalOpen(true);
  };

  // ➕ إضافة عنوان تقرير إلى القائمة
  const handleAddReportTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newTopic: ReportTopicItem = {
      id: `topic-${Date.now()}`,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim() || undefined,
      max_students: 1,
    };
    setFormData((prev) => ({
      ...prev,
      report_topics: [...prev.report_topics, newTopic],
    }));
    setNewTopicTitle('');
    setNewTopicDesc('');
  };

  // ❌ حذف عنوان تقرير من القائمة
  const handleRemoveReportTopic = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      report_topics: prev.report_topics.filter((t) => t.id !== id),
    }));
  };

  // 💾 حفظ أو تحديث التكليف
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.included_topics.trim()) {
      showToast('⚠️ يرجى ملء عنوان التكليف وتحديد المادة والمفردات الداخلة بدقة!');
      return;
    }

    const allStoredCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const courseObj = allStoredCourses.find((c) => c.id === formData.course_id);
    const course = assignedCourses.find((c) => c.course_id === formData.course_id);
    const courseName = courseObj?.name || (course && course.course_name) || (editingTask ? editingTask.course_name : 'المادة الدراسية');
    const courseCode = courseObj?.code || (editingTask ? editingTask.course_code : 'COURSE');
    const departmentId = courseObj?.department_id || (course && course.department_id) || (editingTask ? editingTask.department_id : 'dept-1');
    const departmentName = courseObj?.department_name || (editingTask ? editingTask.department_name : 'القسم الأكاديمي');
    const stageNumber = courseObj?.stage_number || (editingTask ? editingTask.stage_number : 1);
    const semester = courseObj?.semester || (editingTask ? editingTask.semester : 1);

    if (editingTask) {
      // تحديث تكليف حالي
      const updated: CourseAcademicTask = {
        ...editingTask,
        course_id: formData.course_id,
        course_name: courseName,
        course_code: courseCode,
        department_id: departmentId,
        department_name: departmentName,
        stage_number: stageNumber,
        semester: semester,
        study_type: formData.study_type,
        task_type: formData.task_type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        included_topics: formData.included_topics.trim(),
        assignment_questions: formData.assignment_questions.trim() || undefined,
        assignment_type: formData.assignment_type,
        report_topics: formData.report_topics,
        report_guidelines: formData.report_guidelines.trim() || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        final_deadline: formData.final_deadline ? new Date(formData.final_deadline).toISOString() : undefined,
        late_penalty_warning: formData.late_penalty_warning.trim() || undefined,
        max_score: Number(formData.max_score),
        room_or_hall: formData.room_or_hall.trim() || undefined,
        is_published: formData.is_published,
        updated_at: new Date().toISOString(),
      };

      const newTasks = tasks.map((t) => (t.id === editingTask.id ? updated : t));
      saveTasksToStorage(newTasks);
      saveAcademicTaskToSupabase(updated); // ☁️ تحديث بيانات التكليف في Supabase
      showToast('✅ تم تحديث بيانات التكليف والامتحان بنجاح!');
    } else {
      // إنشاء تكليف جديد
      const newTask: CourseAcademicTask = {
        id: `task-${Date.now()}`,
        course_id: formData.course_id,
        course_name: courseName,
        course_code: courseCode,
        department_id: departmentId,
        department_name: departmentName,
        stage_number: stageNumber,
        semester: semester,
        study_type: formData.study_type,
        academic_year: academicYear || getAcademicYear(),
        teacher_id: teacherId,
        teacher_name: teacherName,
        task_type: formData.task_type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        included_topics: formData.included_topics.trim(),
        assignment_questions: formData.assignment_questions.trim() || undefined,
        assignment_type: formData.assignment_type,
        report_topics: formData.report_topics,
        report_guidelines: formData.report_guidelines.trim() || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        final_deadline: formData.final_deadline ? new Date(formData.final_deadline).toISOString() : undefined,
        late_penalty_warning: formData.late_penalty_warning.trim() || undefined,
        max_score: Number(formData.max_score),
        room_or_hall: formData.room_or_hall.trim() || undefined,
        attachments_count: 0,
        is_published: formData.is_published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newTasks = [newTask, ...tasks];
      saveTasksToStorage(newTasks);
      saveAcademicTaskToSupabase(newTask); // ☁️ حفظ التكليف الجديد في Supabase
      showToast('🎉 تم نشر وإعلان التكليف والامتحان لجميع الطلاب بنجاح!');
    }

    setIsCreateModalOpen(false);
  };

  // 🗑️ فتح كارد تأكيد حذف التكليف أو الامتحان
  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      setDeletingTask(target);
    }
  };

  // 🗑️ تنفيذ حذف التكليف بعد التأكيد
  const confirmExecuteDeleteTask = () => {
    if (!deletingTask) return;
    const newTasks = tasks.filter((t) => t.id !== deletingTask.id);
    saveTasksToStorage(newTasks);
    deleteAcademicTaskFromSupabase(deletingTask.id); // ☁️ حذف التكليف من Supabase
    setDeletingTask(null);
    showToast('🗑️ تم حذف التكليف بنجاح.');
  };

  // 🗑️ تنفيذ الحذف الجماعي للتكليفات المحددة
  const handleBulkDeleteTasks = () => {
    if (selectedTaskIds.length === 0) return;
    const newTasks = tasks.filter((t) => !selectedTaskIds.includes(t.id));
    saveTasksToStorage(newTasks);
    selectedTaskIds.forEach((id) => deleteAcademicTaskFromSupabase(id)); // ☁️ حذف التكليفات المحددة من Supabase
    showToast(`🗑️ تم بنجاح حذف (${selectedTaskIds.length}) تكليف محدد.`);
    setSelectedTaskIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // 📄 تصدير ورقة التكليف الرسمية PDF
  const handleExportPdf = async (task: CourseAcademicTask) => {
    setIsExportingPdf(task.id);
    try {
      // 👥 استخراج الحسابات لجلب أسماء رئيس ومقرر القسم الحقيقيين
      const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
      const headUser = allProfiles.find(
        (p) => p.role === 'department_head' && (p.department_id === task.department_id || p.department_name === task.department_name)
      );
      const rapUser = allProfiles.find(
        (p) => p.role === 'rapporteur' && (p.department_id === task.department_id || p.department_name === task.department_name)
      );

      await exportCourseTaskBriefPDF({
        task,
        headName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
        rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
        departmentName: task.department_name || 'القسم الأكاديمي',
      });
      showToast('📥 تم تصدير ورقة التكليف الرسمية بصيغة PDF A4 بنجاح!');
    } catch {
      showToast('⚠️ حدث خطأ أثناء تصدير ملف الـ PDF');
    } finally {
      setIsExportingPdf(null);
    }
  };

  // 📢 إعادة بث إشعار للطلاب
  const handleBroadcastNotice = (task: CourseAcademicTask) => {
    showToast(`📢 تم إرسال إشعار فوري وتذكير لكافة طلاب المادة حول (${task.title})!`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 🟢 رسالة نجاح الإجراءات */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-black text-base">{actionSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMsg(null)}
            className="text-slate-300 hover:text-white text-sm font-black px-3 py-1 bg-slate-800 rounded-lg"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 🌟 الترويسة الرئيسية والإحصائيات */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">منظومة التكليفات والامتحانات الفصلية</h1>
                <p className="text-base font-black text-slate-300 mt-1">
                  إدارة وتبليغ الكويزات، الواجبات، التقارير، المدتيرم، والامتحان العملي وفق بنود مسار بولونيا
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleOpenCreateModal('quiz')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-base font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة كويز 📝</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('assignment')}
              className="bg-blue-700 hover:bg-blue-600 active:scale-95 text-white text-base font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-blue-700/20 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة واجب 📑</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('report')}
              className="bg-sky-700 hover:bg-sky-600 active:scale-95 text-white text-base font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-sky-700/20 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة تقرير 📄</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('midterm_exam')}
              className="bg-rose-600 hover:bg-rose-500 text-white text-base font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/20"
            >
              <Plus className="w-5 h-5" />
              <span>امتحان مدتيرم 🎯</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('practical_exam')}
              className="bg-teal-600 hover:bg-teal-500 text-white text-base font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-teal-600/20"
            >
              <Plus className="w-5 h-5" />
              <span>امتحان عملي 🔬</span>
            </button>
          </div>
        </div>

        {/* 📊 بطاقات الإحصائيات المصغرة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-5">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-slate-300 block">إجمالي التكليفات</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-blue-300 block">الكويزات</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.quizzes}</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-blue-300 block">الواجبات</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{stats.assignments}</span>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-sky-300 block">التقارير</span>
            <span className="text-2xl font-black text-sky-400 mt-1 block">{stats.reports}</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-rose-300 block">المدتيرم</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.midterms}</span>
          </div>
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 text-center">
            <span className="text-sm font-black text-teal-300 block">الامتحان العملي</span>
            <span className="text-2xl font-black text-teal-400 mt-1 block">{stats.practicals}</span>
          </div>
        </div>

        {/* 🎛️ شريط الفلاتر والبحث */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <div className="relative" ref={filterCourseDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterCourseDropdownOpen(!isFilterCourseDropdownOpen)}
                className={`bg-slate-800 border text-white text-sm sm:text-base font-black rounded-2xl px-4 py-2.5 flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                  isFilterCourseDropdownOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {selectedCourseId === 'all'
                    ? 'كافة موادي المكلفة 📚'
                    : effectiveCourses.find((c) => c.course_id === selectedCourseId)?.course_name || 'اختر المادة'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isFilterCourseDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {isFilterCourseDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId('all');
                      setIsFilterCourseDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                      selectedCourseId === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>كافة موادي المكلفة 📚</span>
                    {selectedCourseId === 'all' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  {effectiveCourses.map((c) => {
                    const isSel = selectedCourseId === c.course_id;
                    return (
                      <button
                        key={c.course_id}
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(c.course_id);
                          setIsFilterCourseDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                          isSel ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{c.course_name}</span>
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
              { id: 'all', label: 'الكل' },
              { id: 'quiz', label: 'كويزات 📝' },
              { id: 'assignment', label: 'واجبات 📑' },
              { id: 'report', label: 'تقارير 📄' },
              { id: 'midterm_exam', label: 'مدتيرم 🎯' },
              { id: 'practical_exam', label: 'عملي 🔬' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`text-base font-black px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${ selectedType === tab.id ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700' }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔘 شريط الإجراءات الجماعية العائم للتكليفات المحددة */}
      {selectedTaskIds.length > 0 && (
        <div className="p-4 bg-slate-800 border-2 border-cyan-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="font-black text-white text-base">
              تم تحديد <strong className="font-mono text-cyan-400">{selectedTaskIds.length}</strong> تكليف
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف التكليفات المحددة ({selectedTaskIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📋 قائمة بطاقات التكليفات والامتحانات */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-950 font-black mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">لا توجد تكليفات أو امتحانات منشورة حالياً</h3>
          <p className="text-sm font-black text-slate-900 font-bold mt-1 max-w-md mx-auto">
            يمكنك الضغط على أزرار الإضافة أعلاه لنشر كويز، واجب، تقرير، مدتيرم، أو امتحان عملي وإبلاغ طلبتك فوراً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const isQuiz = task.task_type === 'quiz';
            const isAssignment = task.task_type === 'assignment';
            const isReport = task.task_type === 'report';
            const isMidterm = task.task_type === 'midterm_exam';
            const isSelected = selectedTaskIds.includes(task.id);

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
              ? 'كويز فصلي'
              : isAssignment
              ? 'واجب بيتي / تطبيقي'
              : isReport
              ? 'تقرير وبحث'
              : isMidterm
              ? 'امتحان مدتيرم'
              : 'امتحان عملي ومختبري';

            return (
              <div
                key={task.id}
                className={`border rounded-3xl p-6 shadow-lg flex flex-col justify-between transition-all group ${
                  isSelected ? 'bg-slate-850 border-cyan-500/70 shadow-cyan-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedTaskIds(selectedTaskIds.filter((id) => id !== task.id));
                          } else {
                            setSelectedTaskIds([...selectedTaskIds, task.id]);
                          }
                        }}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        title="تحديد التكليف"
                      />
                      <span className={`text-base font-black px-3 py-1 rounded-xl border ${badgeBg}`}>
                        {typeLabel}
                      </span>
                      <span className="text-base font-black text-slate-200 bg-slate-800 px-3 py-1 rounded-xl">
                        {task.course_name}
                      </span>
                      <span className="text-sm font-black text-slate-400">
                        ({task.course_code})
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
                    </div>

                    <div className="flex items-center gap-1.5 text-base font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
                      <Award className="w-4 h-4" />
                      <span>{task.max_score} درجات</span>
                    </div>
                  </div>

                  {/* عنوان ووصف التكليف */}
                  <h3 className="text-lg font-black text-white mt-3 group-hover:text-cyan-400 transition-colors">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-base font-black text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* 📚 صندوق المادة والمفردات الداخلة في الامتحان / الكويز */}
                  <div className="mt-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
                    <div className="flex items-center gap-1.5 text-base font-black text-cyan-400 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span>المادة والمفردات والصفحات الداخلة:</span>
                    </div>
                    <p className="text-base font-black text-slate-200 leading-relaxed">
                      {task.included_topics}
                    </p>
                  </div>

                  {/* ❓ نص الواجب إن وجد */}
                  {task.assignment_questions && (
                    <div className="mt-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5">
                      <div className="flex items-center gap-1.5 text-base font-black text-sky-400 mb-1">
                        <HelpCircle className="w-4 h-4" />
                        <span>نص الواجب والمطاليب:</span>
                      </div>
                      <p className="text-base font-black text-slate-300 leading-relaxed line-clamp-3">
                        {task.assignment_questions}
                      </p>
                    </div>
                  )}

                  {/* 📑 عناوين التقارير المتاحة إن وجدت */}
                  {task.report_topics && task.report_topics.length > 0 && (
                    <div className="mt-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5">
                      <div className="flex items-center justify-between text-base font-black text-sky-400 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          <span>عناوين التقارير المتاحة ({task.report_topics.length} محاور):</span>
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-base font-black text-slate-300">
                        {task.report_topics.slice(0, 3).map((top, idx) => (
                          <li key={top.id} className="flex items-start gap-2">
                            <span className="text-sky-400 font-bold">{idx + 1}.</span>
                            <span className="line-clamp-1">{top.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ⚠️ تحذير التأخير */}
                  {task.late_penalty_warning && (
                    <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-base font-black text-rose-300 leading-relaxed">
                        {task.late_penalty_warning}
                      </p>
                    </div>
                  )}

                  {/* 📅 المواعيد والمكان */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-base font-black text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <span>
                        الموعد: <strong className="text-white font-mono">{new Date(task.due_date).toLocaleDateString('ar-IQ-u-nu-latn')} ({new Date(task.due_date).toLocaleTimeString('ar-IQ-u-nu-latn', { hour: '2-digit', minute: '2-digit' })})</strong>
                      </span>
                    </div>

                    {task.room_or_hall ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <span>
                          المكان: <strong className="text-white">{task.room_or_hall}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-sky-400" />
                        <span>
                          الموعد النهائي: <strong className="text-white font-mono">{task.final_deadline ? new Date(task.final_deadline).toLocaleDateString('ar-IQ-u-nu-latn') : 'الموعد المحدد أعلاه'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* أزرار الإجراءات وإدارة التسليمات */}
                <div className="flex flex-col gap-3 mt-5 pt-3.5 border-t border-slate-800">
                  
                  {/* شريط إدارة تسليمات الواجبات والتقارير */}
                  {(isAssignment || isReport) && (
                    <div className="flex items-center justify-between gap-2 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskForSubmissions(task)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-base rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Users className="w-4 h-4" />
                        <span>📥 استعراض التسليمات ({submissions.filter((s) => s.task_id === task.id).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextOpen = !(task.is_submission_open !== false);
                          const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, is_submission_open: nextOpen } : t));
                          saveTasksToStorage(updatedTasks);
                          showToast(nextOpen ? '🔓 تم فتح باب التسليم للطلاب بنجاح! 📢' : '🔒 تم قفل استقبال الملفات!');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-base transition flex items-center gap-1.5 cursor-pointer border ${ task.is_submission_open !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30' }`}
                        title="تبديل حالة قفل/فتح استقبال الحلول"
                      >
                        {task.is_submission_open !== false ? (
                          <>
                            <Unlock className="w-4 h-4 text-emerald-400" />
                            <span>مفتوح (قفل 🔒)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-red-400" />
                            <span>مقفل (فتح 🔓)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportPdf(task)}
                        disabled={isExportingPdf === task.id}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-black px-4 py-2 rounded-2xl flex items-center gap-2 transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
                        title="تصدير ورقة التكليف الرسمية PDF"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                        <span>{isExportingPdf === task.id ? 'جارٍ...' : 'ورقة التكليف PDF'}</span>
                      </button>

                      <button
                        onClick={() => handleBroadcastNotice(task)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-base font-black px-4 py-2 rounded-2xl flex items-center gap-2 transition-all border border-blue-500/30 cursor-pointer"
                        title="إرسال إشعار تذكيري للطلاب"
                      >
                        <Send className="w-4 h-4" />
                        <span>تبليغ فوري 📢</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                        title="تعديل التكليف"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="حذف التكليف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📥 نافذة استعراض وتقييم تسليمات الطلاب للأستاذ */}
      {selectedTaskForSubmissions && (
        <TeacherSubmissionsReviewModal
          isOpen={!!selectedTaskForSubmissions}
          onClose={() => setSelectedTaskForSubmissions(null)}
          task={selectedTaskForSubmissions}
          courseStudents={getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES).filter(
            (p) => p.role === 'student' && p.department_id === selectedTaskForSubmissions.department_id
          )}
          submissions={submissions.filter((s) => s.task_id === selectedTaskForSubmissions.id)}
          teacherName={teacherName}
          onSaveGrade={(subId: string, score: number, feedback: string, updates?: Partial<StudentTaskSubmission>) => {
            const updated: StudentTaskSubmission[] = submissions.map((s) =>
              s.id === subId
                ? {
                    ...s,
                    score,
                    teacher_feedback: feedback,
                    graded_by: teacherName,
                    graded_at: new Date().toISOString(),
                    status: (updates?.status || 'graded') as StudentTaskSubmission['status'],
                    ...updates,
                  }
                : s
            );
            setSubmissions(updated);
            saveStoredData('task_student_submissions', updated);
            const updatedSub = updated.find((s) => s.id === subId);
            if (updatedSub) {
              saveTaskSubmissionToSupabase(updatedSub); // ☁️ حفظ التقييم في Supabase
            }
          }}
          onToggleLockTask={(taskId: string, isOpen: boolean) => {
            const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, is_submission_open: isOpen } : t));
            saveTasksToStorage(updatedTasks);
            const targetTask = updatedTasks.find((t) => t.id === taskId);
            if (targetTask) {
              saveAcademicTaskToSupabase(targetTask); // ☁️ حفظ حالة قفل/فتح التسليم في Supabase فوراً
            }
            if (selectedTaskForSubmissions && selectedTaskForSubmissions.id === taskId) {
              setSelectedTaskForSubmissions({ ...selectedTaskForSubmissions, is_submission_open: isOpen });
            }
          }}
          onDeleteSubmission={(subId: string) => {
            const updated = submissions.filter((s) => s.id !== subId);
            setSubmissions(updated);
            saveStoredData('task_student_submissions', updated);
            deleteTaskSubmissionFromSupabase(subId); // ☁️ حذف التسليم من سحابة Supabase فوراً
          }}
        />
      )}

      {/* 🪟 نافذة إضافة / تعديل التكليف الأكاديمي والامتحان (Modal) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {editingTask ? 'تعديل التكليف / الامتحان الفصلي' : 'نشر تكليف / امتحان فصلي جديد'}
                  </h2>
                  <p className="text-sm font-black text-slate-400">تحديد المادة والمفردات الداخلة والمواعيد لطلابك</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-2.5 hover:bg-slate-800 rounded-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 sm:p-7 space-y-5">
              {/* المادة والنوع والفترة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. المادة الدراسية */}
                <div className="relative" ref={formCourseDropdownRef}>
                  <label className="text-sm sm:text-base font-black text-slate-200 block mb-2">
                    المادة الدراسية:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormCourseDropdownOpen(!isFormCourseDropdownOpen);
                      setIsFormTypeDropdownOpen(false);
                      setIsFormStudyDropdownOpen(false);
                      setIsFormAssignmentTypeDropdownOpen(false);
                    }}
                    className={`w-full bg-slate-800 border text-white text-sm sm:text-base font-black rounded-2xl px-3 py-3 flex items-center justify-between cursor-pointer shadow-sm transition-all ${
                      isFormCourseDropdownOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {effectiveCourses.find((c) => c.course_id === formData.course_id)?.course_name || 'اختر المادة'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isFormCourseDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {isFormCourseDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {effectiveCourses.map((c) => {
                        const isSel = formData.course_id === c.course_id;
                        return (
                          <button
                            key={c.course_id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, course_id: c.course_id });
                              setIsFormCourseDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{c.course_name}</span>
                            {isSel && <Check className="w-4 h-4 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. نوع التكليف */}
                <div className="relative" ref={formTypeDropdownRef}>
                  <label className="text-sm sm:text-base font-black text-slate-200 block mb-2">
                    نوع التكليف:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormTypeDropdownOpen(!isFormTypeDropdownOpen);
                      setIsFormCourseDropdownOpen(false);
                      setIsFormStudyDropdownOpen(false);
                      setIsFormAssignmentTypeDropdownOpen(false);
                    }}
                    className={`w-full bg-slate-800 border text-white text-sm sm:text-base font-black rounded-2xl px-3 py-3 flex items-center justify-between cursor-pointer shadow-sm transition-all ${
                      isFormTypeDropdownOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">
                        {formData.task_type === 'quiz'
                          ? 'كويز (5 درجات)'
                          : formData.task_type === 'assignment'
                          ? 'واجب بيتي (5 درجات)'
                          : formData.task_type === 'report'
                          ? 'تقرير وبحث (10 درجات)'
                          : formData.task_type === 'midterm_exam'
                          ? 'مدتيرم (10 درجات)'
                          : 'عملي (10 درجات)'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isFormTypeDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {isFormTypeDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { key: 'quiz' as AcademicTaskType, label: 'كويز (5 درجات)', score: 5, defaultTitle: 'كويز رقم (1): ' },
                        { key: 'assignment' as AcademicTaskType, label: 'واجب بيتي (5 درجات)', score: 5, defaultTitle: 'واجب رقم (1): ' },
                        { key: 'report' as AcademicTaskType, label: 'تقرير وبحث (10 درجات)', score: 10, defaultTitle: 'تقرير وبحث فصلي: ' },
                        { key: 'midterm_exam' as AcademicTaskType, label: 'مدتيرم (10 درجات)', score: 10, defaultTitle: 'امتحان منتصف الفصل الدراسي (مدتيرم)' },
                        { key: 'practical_exam' as AcademicTaskType, label: 'عملي (10 درجات)', score: 10, defaultTitle: 'الامتحان العملي والمختبري الفصلي' },
                      ].map((t) => {
                        const isSel = formData.task_type === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                task_type: t.key,
                                max_score: t.score,
                                title: t.defaultTitle,
                              });
                              setIsFormTypeDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <span>{t.label}</span>
                            {isSel && <Check className="w-4 h-4 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. الفترة الدراسية */}
                <div className="relative" ref={formStudyDropdownRef}>
                  <label className="text-sm sm:text-base font-black text-slate-200 block mb-2">
                    الفترة الدراسية:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormStudyDropdownOpen(!isFormStudyDropdownOpen);
                      setIsFormCourseDropdownOpen(false);
                      setIsFormTypeDropdownOpen(false);
                      setIsFormAssignmentTypeDropdownOpen(false);
                    }}
                    className={`w-full bg-slate-800 border text-white text-sm sm:text-base font-black rounded-2xl px-3 py-3 flex items-center justify-between cursor-pointer shadow-sm transition-all ${
                      isFormStudyDropdownOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {formData.study_type === 'morning' ? (
                        <Sun className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : formData.study_type === 'evening' ? (
                        <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {formData.study_type === 'morning'
                          ? 'الصباحية (صباحي)'
                          : formData.study_type === 'evening'
                          ? 'المسائية (مسائي)'
                          : 'كلاهما (معاً)'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isFormStudyDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {isFormStudyDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { key: 'morning' as const, label: 'الدراسة الصباحية (صباحي)', icon: Sun, color: 'text-sky-400' },
                        { key: 'evening' as const, label: 'الدراسة المسائية (مسائي)', icon: Moon, color: 'text-indigo-400' },
                        { key: 'both' as const, label: 'كلاهما (صباحي ومسائي معاً)', icon: Users, color: 'text-cyan-400' },
                      ].map((s) => {
                        const isSel = formData.study_type === s.key;
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, study_type: s.key });
                              setIsFormStudyDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white' : 'text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${s.color}`} />
                              <span>{s.label}</span>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-cyan-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* عنوان التكليف */}
              <div>
                <label className="text-base font-black text-slate-200 block mb-2">
                  عنوان التكليف أو الامتحان:
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: كويز رقم 1 في المصفوفات والمؤشرات..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl px-4 py-3 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* 📚 المادة والمفردات والصفحات الداخلة في الامتحان / الكويز */}
              <div>
                <label className="text-base font-black text-cyan-400 flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span>المادة والمفردات والصفحات الداخلة في الامتحان / الكويز / التكليف: *</span>
                </label>
                <textarea
                  value={formData.included_topics}
                  onChange={(e) => setFormData({ ...formData, included_topics: e.target.value })}
                  rows={3}
                  placeholder="حدد بدقة: الملازم المشمولة، أرقام الصفحات، الفصول، المسائل العملية، والمواضيع النظرية المشمولة..."
                  className="w-full bg-slate-800 border border-cyan-500/40 text-white text-base font-black rounded-2xl p-4 focus:border-cyan-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* ❓ إذا كان التكليف واجباً: نص وسؤال الواجب */}
              {formData.task_type === 'assignment' && (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-base font-black text-sky-300 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      <span>نص وسؤال الواجب بالتفصيل والمطاليب:</span>
                    </label>
                    <div className="relative" ref={formAssignmentTypeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFormAssignmentTypeDropdownOpen(!isFormAssignmentTypeDropdownOpen);
                          setIsFormCourseDropdownOpen(false);
                          setIsFormTypeDropdownOpen(false);
                          setIsFormStudyDropdownOpen(false);
                        }}
                        className={`bg-slate-800 border text-sky-300 text-xs sm:text-sm font-black rounded-xl px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                          isFormAssignmentTypeDropdownOpen ? 'border-sky-400 ring-2 ring-sky-400/20' : 'border-sky-500/30 hover:border-sky-400'
                        }`}
                      >
                        <span>
                          {formData.assignment_type === 'theory'
                            ? 'واجب نظري 📝'
                            : formData.assignment_type === 'code'
                            ? 'كود وبرمجة 💻'
                            : formData.assignment_type === 'problem_solving'
                            ? 'حل مسائل 📐'
                            : formData.assignment_type === 'practical'
                            ? 'تطبيقي مختبري 🔬'
                            : 'مختلط 📑'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-sky-300 shrink-0 transition-transform ${isFormAssignmentTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFormAssignmentTypeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-44 bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                          {[
                            { key: 'theory' as const, label: 'واجب نظري 📝' },
                            { key: 'code' as const, label: 'كود وبرمجة 💻' },
                            { key: 'problem_solving' as const, label: 'حل مسائل 📐' },
                            { key: 'practical' as const, label: 'تطبيقي مختبري 🔬' },
                            { key: 'mixed' as const, label: 'مختلط 📑' },
                          ].map((a) => {
                            const isSel = formData.assignment_type === a.key;
                            return (
                              <button
                                key={a.key}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, assignment_type: a.key });
                                  setIsFormAssignmentTypeDropdownOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-right font-black text-xs transition flex items-center justify-between cursor-pointer ${
                                  isSel ? 'bg-[#0F2942] text-sky-300' : 'text-slate-200 hover:bg-slate-800'
                                }`}
                              >
                                <span>{a.label}</span>
                                {isSel && <Check className="w-3.5 h-3.5 text-sky-300" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={formData.assignment_questions}
                    onChange={(e) => setFormData({ ...formData, assignment_questions: e.target.value })}
                    rows={3}
                    placeholder="اكتب نص المسألة، الشفرة المطلوبة، المطاليب والشروط المطلوب تسليمها..."
                    className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl p-3.5 focus:border-sky-500 focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* 📑 إذا كان التكليف تقريراً: إضافة عناوين التقارير المتاحة */}
              {formData.task_type === 'report' && (
                <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <label className="text-base font-black text-sky-300 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    <span>عناوين ومحاور التقارير المقترحة (يختار الطالب عنواناً منها):</span>
                  </label>

                  {/* قائمة العناوين الحالية */}
                  {formData.report_topics.length > 0 && (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                      {formData.report_topics.map((topic, idx) => (
                        <div key={topic.id} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between gap-2 border border-slate-700">
                          <div className="text-base font-black">
                            <span className="font-bold text-sky-400 ml-2 font-mono">{idx + 1}.</span>
                            <strong className="text-white">{topic.title}</strong>
                            {topic.description && <span className="text-slate-300 text-sm font-black block mt-1">{topic.description}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveReportTopic(topic.id)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* إضافة عنوان جديد */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2.5 border-t border-sky-500/20">
                    <input
                      type="text"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="عنوان التقرير المقترح..."
                      className="flex-1 bg-slate-800 border border-slate-700 text-white text-base font-black rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={newTopicDesc}
                      onChange={(e) => setNewTopicDesc(e.target.value)}
                      placeholder="وصف مختصر (اختياري)..."
                      className="flex-1 bg-slate-800 border border-slate-700 text-white text-base font-black rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddReportTopic}
                      className="bg-sky-700 hover:bg-sky-600 active:scale-95 text-white text-base font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة</span>
                    </button>
                  </div>

                  {/* شروط وضوابط التقرير */}
                  <div>
                    <label className="text-base font-black text-slate-200 block mb-1.5">
                      ضوابط وشروط كتابة التقرير:
                    </label>
                    <input
                      type="text"
                      value={formData.report_guidelines}
                      onChange={(e) => setFormData({ ...formData, report_guidelines: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* المواعيد والدرجة والقاعة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-base font-black text-slate-200 block mb-1.5">
                    موعد التسليم / الامتحان: *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl px-3.5 py-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-base font-black text-slate-200 block mb-1.5">
                    آخر موعد نهائي (للتأخير):
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.final_deadline}
                    onChange={(e) => setFormData({ ...formData, final_deadline: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl px-3.5 py-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-base font-black text-slate-200 block mb-1.5">
                    الدرجة المخصصة:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="50"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl px-3.5 py-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              {/* القاعة / المختبر إن وجد */}
              <div>
                <label className="text-base font-black text-slate-200 block mb-1.5">
                  القاعة الدراسية / المختبر (للامتحانات والكويزات):
                </label>
                <input
                  type="text"
                  value={formData.room_or_hall}
                  onChange={(e) => setFormData({ ...formData, room_or_hall: e.target.value })}
                  placeholder="مثال: مدرج الخوارزمي، مختبر البرمجيات 1، قاعة 102..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-base font-black rounded-2xl px-4 py-3 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* ⚠️ تحذير التأخير التلقائي */}
              <div>
                <label className="text-base font-black text-rose-400 flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيه وتحذير الطالب عند التأخير عن الموعد:</span>
                </label>
                <input
                  type="text"
                  value={formData.late_penalty_warning}
                  onChange={(e) => setFormData({ ...formData, late_penalty_warning: e.target.value })}
                  placeholder="مثال: يُخصم 20% عن كل يوم تأخير، ولن يُقبل أي تكليف بعد الموعد النهائي..."
                  className="w-full bg-slate-800 border border-rose-500/30 text-rose-300 text-base font-black rounded-2xl px-4 py-3 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex items-center justify-end gap-3.5 pt-5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2.5 text-base font-black text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-7 py-2.5 text-base font-black text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  <span>{editingTask ? 'تحديث ونشر التعديلات 🚀' : 'نشر التكليف وتبليغ الطلاب 📢'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ كارد تأكيد حذف التكليف الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        title="تأكيد حذف التكليف الأكاديمي"
        itemName={deletingTask?.title || ''}
        itemDetails={`المادة: ${deletingTask?.course_name || '—'} | نوع التكليف: ${deletingTask?.task_type || '—'} | الدرجة: ${deletingTask?.max_score || 0}`}
        warningMessage="هل أنت متأكد من حذف هذا التكليف أو الامتحان؟ سيتم حذف كافة إجابات وتسليمات الطلاب المرتبطة به نهائياً."
        onConfirm={confirmExecuteDeleteTask}
      />

      {/* 🗑️ كارد تأكيد الحذف الجماعي للتكليفات المحددة */}
      <ConfirmDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="تأكيد الحذف الجماعي للتكليفات"
        itemName={`${selectedTaskIds.length} تكليفات محددة`}
        warningMessage="هل أنت متأكد من حذف كافة التكليفات والامتحانات المحددة نهائياً؟ سيتم حذف جميع تفاصيلها وتسليمات الطلاب المرتبطة بها."
        onConfirm={handleBulkDeleteTasks}
      />

    </div>
  );
}
