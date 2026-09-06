'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

//  نافذة استعراض وتقييم وتدقيق تسليمات الطلاب (مقبول / مرفوض / يحتاج تعديل) وحصر المسلمين وغير المسلمين
import React, { useState, useMemo } from 'react'; // 🔗 خطافات رياكت
import { CourseAcademicTask, StudentTaskSubmission, UserProfile, Grade, SubmissionReviewDecision } from '@/types'; // 🔗 الواجهات الرسمية
import { exportTaskSubmissionsReportPDF } from '@/lib/pdf-export'; // 📄 مولد كشف التسليمات PDF
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import { getStoredData, saveStoredData, INITIAL_GRADES, INITIAL_PROFILES } from '@/lib/mock-data'; // 💾 التخزين والمستخدمين
import { calculateCourseworkTotal, calculateFinalTotal, getLetterGrade } from '@/lib/grade-utils'; // 🧮 حسابات السعي والدرجات
import { saveGradeToSupabase } from '@/lib/supabase-client'; // ☁️ حفظ الدرجات بالسحابة
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { 
  X, 
  Lock, 
  Unlock, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  User, 
  Award, 
  Save, 
  Trash2, 
  Printer, 
  Send, 
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Percent,
  BellRing,
  Sun,
  Moon,
  CheckSquare
} from 'lucide-react'; // 🎨 الأيقونات

interface TeacherSubmissionsReviewModalProps {
  isOpen: boolean; // 🚪 حالة فتح النافذة
  onClose: () => void; // ❌ دالة إغلاق النافذة
  task: CourseAcademicTask; // 📌 التكليف المختار
  courseStudents: UserProfile[]; // 👥 كافة طلاب المادة والمرحلة
  submissions: StudentTaskSubmission[]; // 📥 قائمة التسليمات الحالية
  onSaveGrade: (submissionId: string, score: number, feedback: string, updates?: Partial<StudentTaskSubmission>) => void; // 💯 دالة حفظ الدرجة والتقييم
  onToggleLockTask: (taskId: string, isOpen: boolean) => void; // 🔒 دالة قفل / فتح استقبال الملفات
  onDeleteSubmission: (submissionId: string) => void; // 🗑️ دالة حذف التسليم
  teacherName: string; // 👤 اسم التدريسي الحالي
}

export function TeacherSubmissionsReviewModal({
  isOpen,
  onClose,
  task,
  courseStudents,
  submissions,
  onSaveGrade,
  onToggleLockTask,
  onDeleteSubmission,
  teacherName,
}: TeacherSubmissionsReviewModalProps) {
  // 🔍 حالات الفلترة والبحث
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'accepted' | 'needs_revision' | 'rejected' | 'pending' | 'not_submitted' | 'late'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]); // 🔘 معرفات الطلبة المحددين

  // 📝 حالة نموذج رصد الدرجة والقرار لطالب محدد
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<StudentTaskSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [decisionInput, setDecisionInput] = useState<SubmissionReviewDecision>('accepted');
  const [decisionReasonInput, setDecisionReasonInput] = useState<string>('');
  const [revisionDeadlineInput, setRevisionDeadlineInput] = useState<string>('');
  const [plagiarismInput, setPlagiarismInput] = useState<string>('');
  const [allowResubmissionInput, setAllowResubmissionInput] = useState<boolean>(false);
  const [syncToCoursework, setSyncToCoursework] = useState<boolean>(true); // مزامنة الدرجة تلقائياً مع السعي
  const [toastMessage, setToastMessage] = useState<string | null>(null); // رسالة الإشعار المؤقتة
  const [deletingSubmission, setDeletingSubmission] = useState<StudentTaskSubmission | null>(null); // 🗑️ حالة تسليم الطالب المراد حذفه
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  if (!isOpen) return null;

  const isSubmissionOpen = task.is_submission_open !== false;
  const isReport = task.task_type === 'report';
  const isAssignment = task.task_type === 'assignment';

  // 🔔 إظهار تنبيه مؤقت
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 🔄 تبديل حالة القفل / الفتح مع إرسال إشعار فوري للطلبة عند الفتح
  const handleToggleLock = () => {
    const nextState = !isSubmissionOpen;
    onToggleLockTask(task.id, nextState);

    if (nextState) {
      // 📢 إرسال إشعار جماعي لكافة طلاب المادة بفتح باب التسليم
      courseStudents.forEach((std) => {
        sendAppNotification({
          recipient_id: std.id,
          recipient_role: 'student',
          title: `📢 فُتح باب التسليم: ${task.title}`,
          message: `أتاح الأستاذ (${teacherName}) الآن استقبال ملفات الـ PDF لـ (${task.title}). سارع برفع ملفك قبل انقضاء الموعد.`,
          type: 'system_announcement',
          link: '/student/dashboard',
        });
      });
      showToast('🔓 تم فتح باب استقبال الملفات بنجاح وإرسال إشعار فوري لجميع الطلبة! 📢');
    } else {
      showToast('🔒 تم قفل استقبال الملفات لهذا التكليف بنجاح!');
    }
  };

  // 📢 إرسال إنذار وتذكير فوري جماعي للطلاب الذين لم يسلموا بعد
  const handleSendUrgentReminderToUnsubmitted = () => {
    const unsubmittedStudents = courseStudents.filter((student) => {
      return !submissions.some(
        (s) => s.student_id === student.id || s.group_members?.some((m) => m.student_id === student.id)
      );
    });

    if (unsubmittedStudents.length === 0) {
      showToast('🎉 رائع! جميع طلبة المادة قاموا بتسليم التكليف ولا يوجد متأخرون.');
      return;
    }

    unsubmittedStudents.forEach((std) => {
      sendAppNotification({
        recipient_id: std.id,
        recipient_role: 'student',
        title: `⚠️ إنذار وتذكير عاجل: تسليم ${task.title}`,
        message: `يرجى الانتباه! لم تقم حتى الآن برفع ملف ${isAssignment ? 'الواجب' : 'التقرير'} لمادة (${task.course_name}). الموعد النهائي يقترب وسيتم خصم درجات في حال التأخير.`,
        type: 'task_deadline_alert',
        link: '/student/dashboard',
      });
    });

    showToast(`📢 تم بنجاح إرسال إنذار وتبليغ فوري لـ (${unsubmittedStudents.length}) طالب متأخر! ⚡`);
  };

  // 📊 حساب الإحصائيات الدقيقة
  const totalStudentsCount = courseStudents.length;
  const submittedCount = submissions.length;
  const acceptedCount = submissions.filter((s) => s.review_decision === 'accepted').length;
  const needsRevisionCount = submissions.filter((s) => s.review_decision === 'needs_revision').length;
  const rejectedCount = submissions.filter((s) => s.review_decision === 'rejected').length;
  const pendingReviewCount = submissions.filter((s) => !s.review_decision || s.review_decision === 'pending').length;
  const unsubmittedCount = totalStudentsCount - submittedCount;
  const lateCount = submissions.filter((s) => s.is_late).length;

  // 🔍 تصفية الطلاب بحسب البحث والفلتر المختار
  const filteredStudents = courseStudents.filter((student) => {
    const sub = submissions.find(
      (s) => s.student_id === student.id || s.group_members?.some((m) => m.student_id === student.id)
    );
    const isSubmitted = !!sub;

    // تصفية بحسب القرار والحالة
    if (activeFilter === 'accepted' && sub?.review_decision !== 'accepted') return false;
    if (activeFilter === 'needs_revision' && sub?.review_decision !== 'needs_revision') return false;
    if (activeFilter === 'rejected' && sub?.review_decision !== 'rejected') return false;
    if (activeFilter === 'pending' && (sub?.review_decision && sub.review_decision !== 'pending')) return false;
    if (activeFilter === 'not_submitted' && isSubmitted) return false;
    if (activeFilter === 'late' && (!isSubmitted || !sub?.is_late)) return false;

    // تصفية بحسب نص البحث
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.full_name.toLowerCase().includes(q);
      const matchCode = (student.university_number || '').toLowerCase().includes(q);
      const matchGroup = sub?.group_members?.some((m) => m.full_name.toLowerCase().includes(q));
      return matchName || matchCode || matchGroup;
    }

    return true;
  });

  // ✏️ فتح درج التقييم وتدقيق القرار
  const handleOpenGrading = (sub: StudentTaskSubmission) => {
    setSelectedSubForGrading(sub);
    setGradeInput(sub.score !== undefined && sub.score !== null ? String(sub.score) : '');
    setFeedbackInput(sub.teacher_feedback || '');
    setDecisionInput(sub.review_decision || 'accepted');
    setDecisionReasonInput(sub.decision_reason || '');
    setRevisionDeadlineInput(sub.revision_deadline ? new Date(sub.revision_deadline).toISOString().split('T')[0] : '');
    setPlagiarismInput(sub.plagiarism_percentage !== undefined && sub.plagiarism_percentage !== null ? String(sub.plagiarism_percentage) : '');
    setAllowResubmissionInput(sub.allow_resubmission ?? (sub.review_decision === 'needs_revision'));
  };

  // 💾 تثبيت قرار الأستاذ وحفظ التقييم
  const handleSaveGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForGrading) return;

    let numScore: number | undefined = undefined;
    if (decisionInput === 'accepted') {
      const num = Number(gradeInput);
      if (isNaN(num) || num < 0 || num > task.max_score) {
        setToastMessage(`⚠️ في حالة قبول التكليف، يجب إدخال درجة صالحة بين 0 و ${task.max_score}!`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
      numScore = num;
    } else if (decisionInput === 'rejected') {
      numScore = gradeInput ? Number(gradeInput) : 0;
    }

    const plagNum = plagiarismInput ? Number(plagiarismInput) : undefined;

    const updates: Partial<StudentTaskSubmission> = {
      review_decision: decisionInput,
      decision_reason: decisionReasonInput.trim() || undefined,
      revision_deadline: decisionInput === 'needs_revision' && revisionDeadlineInput ? new Date(revisionDeadlineInput).toISOString() : undefined,
      plagiarism_percentage: plagNum,
      allow_resubmission: decisionInput === 'needs_revision' ? true : allowResubmissionInput,
      score: numScore,
      teacher_feedback: feedbackInput.trim() || undefined,
      graded_by: teacherName,
      graded_at: new Date().toISOString(),
      status: decisionInput === 'needs_revision' ? 'resubmit_requested' : 'graded',
    };

    onSaveGrade(selectedSubForGrading.id, numScore || 0, feedbackInput.trim(), updates);

    // 🔄 مزامنة الدرجة تلقائياً مع سجل السعي الأكاديمي إذا كان التكليف مقبولاً
    if (syncToCoursework && decisionInput === 'accepted' && numScore !== undefined) {
      try {
        const allGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
        const targetStudentIds: string[] = [selectedSubForGrading.student_id];
        
        if (selectedSubForGrading.submission_type === 'group' && selectedSubForGrading.group_members) {
          selectedSubForGrading.group_members.forEach((m) => {
            if (m.student_id && !targetStudentIds.includes(m.student_id)) {
              targetStudentIds.push(m.student_id);
            }
          });
        }

        const fieldToUpdate = isReport ? 'report' : (isAssignment ? 'assignment1' : 'quiz1');

        const updatedGrades = allGrades.map((g) => {
          if (g.course_id === task.course_id && targetStudentIds.includes(g.student_id)) {
            const tempG: Grade = {
              ...g,
              [fieldToUpdate]: numScore,
              updated_at: new Date().toISOString(),
            };
            const cwTotal = calculateCourseworkTotal(tempG);
            const finalTot = calculateFinalTotal(tempG);
            const letter = getLetterGrade(finalTot);
            return {
              ...tempG,
              final_coursework_total: cwTotal,
              final_total: finalTot,
              letter_grade: letter,
            };
          }
          return g;
        });

        saveStoredData('grades', updatedGrades);
        const modifiedGrades = updatedGrades.filter((g) => g.course_id === task.course_id && targetStudentIds.includes(g.student_id));
        modifiedGrades.forEach((mg) => saveGradeToSupabase(mg)); // ☁️ حفظ ومزامنة السعي المحدث مع Supabase فوراً
      } catch {
        // تجاوز بأمان
      }
    }

    // 🔔 إرسال إشعار فوري مخصص للطالب بحسب القرار
    let notifTitle = `تم تدقيق تسليمك لـ (${task.title})`;
    let notifMsg = `قام الأستاذ (${teacherName}) بتدقيق ملفك.`;

    if (decisionInput === 'accepted') {
      notifTitle = `تم قبول ${isAssignment ? 'الواجب' : 'التقرير'}: درجتك (${numScore}/${task.max_score})`;
      notifMsg = `تم قبول التكليف بنجاح ورصد درجة (${numScore}/${task.max_score}). ${feedbackInput ? `ملاحظات: ${feedbackInput}` : ''}`;
    } else if (decisionInput === 'needs_revision') {
      notifTitle = `التكليف يحتاج تعديل: (${task.title})`;
      notifMsg = `طلب الأستاذ تعديل التكليف: "${decisionReasonInput}". يرجى رفع النسخة المعدلة عبر المنصة قبل ${revisionDeadlineInput || 'الموعد المحدد'}.`;
    } else if (decisionInput === 'rejected') {
      notifTitle = `تم رفض تسليم: (${task.title})`;
      notifMsg = `تم رفض التكليف. سبب الرفض: "${decisionReasonInput}". يرجى مراجعة أستاذ المادة.`;
    }

    sendAppNotification({
      recipient_id: selectedSubForGrading.student_id,
      recipient_role: 'student',
      title: notifTitle,
      message: notifMsg,
      type: decisionInput === 'needs_revision' ? 'system_announcement' : 'grade_updated',
      link: '/student/dashboard',
    });

    // إشعار أعضاء الفريق في التقديم الجماعي
    if (selectedSubForGrading.submission_type === 'group' && selectedSubForGrading.group_members) {
      selectedSubForGrading.group_members.forEach((m) => {
        if (m.student_id && m.student_id !== selectedSubForGrading.student_id) {
          sendAppNotification({
            recipient_id: m.student_id,
            recipient_role: 'student',
            title: notifTitle,
            message: notifMsg,
            type: 'grade_updated',
            link: '/student/dashboard',
          });
        }
      });
    }

    showToast(`تم بنجاح تثبيت قرار (${decisionInput === 'accepted' ? 'مقبول' : decisionInput === 'needs_revision' ? 'يحتاج تعديل' : 'مرفوض'}) للطالب (${selectedSubForGrading.student_name})`);
    setSelectedSubForGrading(null);
  };

  // 📄 تصدير كشف التسليمات PDF A4
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // 👥 استخراج الحسابات لجلب أسماء رئيس ومقرر القسم الحقيقيين
      const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
      const headUser = allProfiles.find(
        (p) => p.role === 'department_head' && (p.department_id === task.department_id || p.department_name === task.department_name)
      );
      const rapUser = allProfiles.find(
        (p) => p.role === 'rapporteur' && (p.department_id === task.department_id || p.department_name === task.department_name)
      );

      await exportTaskSubmissionsReportPDF({
        task,
        submissions,
        allStudents: courseStudents,
        teacherName,
        headName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
        rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 📥 تنزيل / معاينة ملف الـ PDF المرفوع
  const handleDownloadPDF = (sub: StudentTaskSubmission) => {
    if (!sub.file_url) {
      setToastMessage('⚠️ الملف المرفوع غير متوفر حالياً!');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    const link = document.createElement('a');
    link.href = sub.file_url;
    link.download = sub.file_name || `تسليم_${sub.student_name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🟢 قبول واعتماد التسليمات المحددة دفعة واحدة
  const handleBulkApproveSubmissions = () => {
    if (selectedStudentIds.length === 0) return;
    const targetSubmissions = submissions.filter((s) => selectedStudentIds.includes(s.student_id));
    if (targetSubmissions.length === 0) {
      showToast('⚠️ لا توجد تسليمات فعلية مرفوعة بين الطلبة المحددين.');
      return;
    }

    targetSubmissions.forEach((sub) => {
      const updates: Partial<StudentTaskSubmission> = {
        review_decision: 'accepted',
        decision_reason: 'تم القبول والاعتماد الجماعي',
        graded_by: teacherName,
        graded_at: new Date().toISOString(),
        status: 'graded',
      };
      onSaveGrade(sub.id, task.max_score, 'تم القبول والاعتماد الجماعي بنجاح', updates);

      sendAppNotification({
        recipient_id: sub.student_id,
        recipient_role: 'student',
        title: `🟢 تم قبول ${isAssignment ? 'الواجب' : 'التقرير'}: (${task.title})`,
        message: `تم قبول واعتماد تسليمك بنجاح ومنح الدرجة الكاملة (${task.max_score}/${task.max_score}).`,
        type: 'grade_updated',
        link: '/student/dashboard',
      });
    });

    showToast(`🎉 تم بنجاح قبول واعتماد تسليمات (${targetSubmissions.length}) طالب ومنح الدرجة الكاملة!`);
    setSelectedStudentIds([]);
  };

  // 🟡 طلب تعديل للتسليمات المحددة دفعة واحدة
  const handleBulkRequestRevision = () => {
    if (selectedStudentIds.length === 0) return;
    const targetSubmissions = submissions.filter((s) => selectedStudentIds.includes(s.student_id));
    if (targetSubmissions.length === 0) {
      showToast('⚠️ لا توجد تسليمات فعلية مرفوعة بين الطلبة المحددين.');
      return;
    }

    targetSubmissions.forEach((sub) => {
      const updates: Partial<StudentTaskSubmission> = {
        review_decision: 'needs_revision',
        decision_reason: 'يرجى مراجعة وتعديل الملف وإعادة رفعه بصورة سليمة',
        allow_resubmission: true,
        graded_by: teacherName,
        graded_at: new Date().toISOString(),
        status: 'resubmit_requested',
      };
      onSaveGrade(sub.id, 0, 'التكليف يحتاج تعديل وإعادة رفع', updates);

      sendAppNotification({
        recipient_id: sub.student_id,
        recipient_role: 'student',
        title: `🟡 التكليف يحتاج تعديل: (${task.title})`,
        message: `طلب أستاذ المادة (${teacherName}) إعادة تدقيق وتعديل ملفك ورفعه مجدداً عبر المنصة.`,
        type: 'system_announcement',
        link: '/student/dashboard',
      });
    });

    showToast(`📢 تم بنجاح طلب تعديل وإتاحة إعادة الرفع لـ (${targetSubmissions.length}) طالب!`);
    setSelectedStudentIds([]);
  };

  // 🔔 إرسال تذكير وتنبيه للطلبة المحددين
  const handleBulkSendReminder = () => {
    if (selectedStudentIds.length === 0) return;
    selectedStudentIds.forEach((stdId) => {
      sendAppNotification({
        recipient_id: stdId,
        recipient_role: 'student',
        title: `⚠️ تنبيه وتذكير بخصوص: ${task.title}`,
        message: `تذكير من أستاذ المادة (${teacherName}) بخصوص متابعة تكليف (${task.title}) لمادة (${task.course_name}).`,
        type: 'task_deadline_alert',
        link: '/student/dashboard',
      });
    });

    showToast(`📢 تم بنجاح إرسال إشعار تذكير ومتابعة لـ (${selectedStudentIds.length}) طالب!`);
    setSelectedStudentIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* 🏛️ الهيدر الفاتح للوحة التحكم بالتسليمات */}
        <div className="p-5 sm:p-6 bg-white text-slate-900 rounded-t-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-200 flex-shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-sm font-black rounded-lg border border-indigo-200">
                  {isAssignment ? 'تدقيق ومتابعة تسليمات الواجب' : 'تدقيق ومتابعة تسليمات التقرير'}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-sm font-black rounded-lg border border-slate-200">
                  {task.course_code} • {task.course_name}
                </span>
                <span className="px-2.5 py-0.5 bg-sky-50 text-sky-950 text-sm font-black rounded-lg border border-sky-200">
                  {task.study_type === 'evening' ? 'الدراسة المسائية' : task.study_type === 'both' ? 'صباحي ومسائي' : 'الدراسة الصباحية'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-1">
                {task.title}
              </h2>
            </div>
          </div>

          {/* 🎛️ أزرار التحكم بالقفل والتصدير والإغلاق */}
          <div className="flex items-center gap-2 self-end md:self-center">
            
            {/* 🔒 زر سويتش القفل والفتح التفاعلي بحدود ناعمة */}
            <button
              type="button"
              onClick={handleToggleLock}
              className={`px-4 py-2.5 rounded-2xl font-black text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-sm border ${ isSubmissionOpen ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500' }`}
              title={isSubmissionOpen ? 'اضغط لقفل استقبال الملفات ومنع الطلاب من الرفع' : 'اضغط لفتح باب التسليم وإرسال إشعار للطلاب'}
            >
              {isSubmissionOpen ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-200" />
                  <span>الاستلام مفتوح (اضغط للقفل)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-red-200" />
                  <span>الاستلام مقفل (اضغط للفتح 🔓)</span>
                </>
              )}
            </button>

            {/* 🖨️ تصدير PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-2xl border border-slate-700 transition cursor-pointer"
              title="تصدير كشف التسليمات والقرارات PDF A4 Landscape"
            >
              {isExportingPDF ? (
                <span className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin block"></span>
              ) : (
                <Printer className="w-5 h-5" />
              )}
            </button>

            {/* ❌ إغلاق */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black hover:text-slate-950 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🔔 شريط التنبيهات اللحظية */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white font-black text-sm font-black px-6 py-2.5 text-center shadow-md animate-in slide-in-from-top duration-150 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 📊 بطاقات الإحصائيات السريعة ومؤشرات القرارات */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-3.5 text-center">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-300 shadow-2xs">
            <span className="text-sm font-black text-slate-700 block">إجمالي الطلاب</span>
            <span className="text-lg sm:text-xl font-black text-slate-950 font-mono mt-0.5 block">{totalStudentsCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-emerald-300 shadow-2xs">
            <span className="text-sm font-black text-emerald-700 block">مقبول 🟢</span>
            <span className="text-lg sm:text-xl font-black text-emerald-950 font-mono mt-0.5 block">{acceptedCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-sky-300 shadow-2xs">
            <span className="text-sm font-black text-sky-700 block">يحتاج تعديل 🔄</span>
            <span className="text-lg sm:text-xl font-black text-sky-950 font-mono mt-0.5 block">{needsRevisionCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-rose-300 shadow-2xs">
            <span className="text-sm font-black text-rose-700 block">مرفوض 🔴</span>
            <span className="text-lg sm:text-xl font-black text-rose-950 font-mono mt-0.5 block">{rejectedCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-indigo-300 shadow-2xs">
            <span className="text-sm font-black text-indigo-700 block">قيد التدقيق ⏳</span>
            <span className="text-lg sm:text-xl font-black text-indigo-950 font-mono mt-0.5 block">{pendingReviewCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-red-400 shadow-2xs">
            <span className="text-sm font-black text-red-700 block">لم يسلموا ❌</span>
            <span className="text-lg sm:text-xl font-black text-red-950 font-mono mt-0.5 block">{unsubmittedCount}</span>
          </div>
        </div>

        {/* 📢 شريط الإنذار السريع للطلاب المتأخرين */}
        {unsubmittedCount > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-rose-950 text-base font-black">
              <BellRing className="w-5 h-5 text-rose-700 shrink-0 animate-bounce" />
              <span>يوجد <strong className="font-mono">{unsubmittedCount}</strong> طلاب لم يقوموا بتسليم {isAssignment ? 'الواجب' : 'التقرير'} حتى الآن.</span>
            </div>
            
            <button
              type="button"
              onClick={handleSendUrgentReminderToUnsubmitted}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-base rounded-2xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
              title="إرسال إشعار وتذكير فوري لجميع الطلاب غير المسلمين"
            >
              <Send className="w-4 h-4" />
              <span>📢 إرسال إنذار وتذكير فوري للمتأخرين ({unsubmittedCount})</span>
            </button>
          </div>
        )}

        {/* 🔍 شريط البحث والفلاتر المتقدمة (القرارات + المسلمون وغير المسلمين) */}
        <div className="p-5 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
            {/* 🔍 حقل البحث باسم الطالب أو أعضاء الفريق */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الطالب، أو أعضاء الفريق..."
              className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* تبويبات الفلترة الذكية */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer ${ activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' }`}
            >
              الكل ({courseStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('accepted')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ activeFilter === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>المقبولون ({acceptedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('needs_revision')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ activeFilter === 'needs_revision' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-800 hover:bg-sky-100' }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>يحتاج تعديل ({needsRevisionCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('rejected')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-1.5 ${ activeFilter === 'rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100' }`}
            >
              <XCircle className="w-4 h-4" />
              <span>المرفوضون ({rejectedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer ${ activeFilter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100' }`}
            >
              قيد التدقيق ({pendingReviewCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('not_submitted')}
              className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer ${ activeFilter === 'not_submitted' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100' }`}
            >
              لم يسلموا ({unsubmittedCount})
            </button>
          </div>
        </div>

        {/* 🔘 شريط الإجراءات الجماعية العائم للتسليمات المحددة */}
        {selectedStudentIds.length > 0 && (
          <div className="mx-5 sm:mx-6 mt-3 p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-blue-700" />
              <span className="font-black text-blue-950 text-base">
                تم تحديد <strong className="font-mono">{selectedStudentIds.length}</strong> طلاب
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkApproveSubmissions}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="قبول تسليمات المحددين ومنح الدرجة الكاملة"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>قبول واعتماد المحددين 🟢</span>
              </button>

              <button
                type="button"
                onClick={handleBulkRequestRevision}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="طلب تعديل وإعادة رفع للمحددين"
              >
                <RotateCcw className="w-4 h-4" />
                <span>طلب تعديل 🔄</span>
              </button>

              <button
                type="button"
                onClick={handleBulkSendReminder}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="إرسال تنبيه وتذكير عاجل للمحددين"
              >
                <Send className="w-4 h-4 text-cyan-200" />
                <span>إرسال تذكير للمحددين 📢</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* 📑 جدول استعراض التسليمات والتقييم وقرارات التدقيق */}
        <div className="p-5 sm:p-6 overflow-x-auto flex-1">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-base font-black rounded-2xl">
                {/* 🔘 مربع تحديد الكل */}
                <th className="p-3.5 rounded-tr-2xl text-center w-12">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(filteredStudents.map((s) => s.id));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
                {/* 🔢 تسلسل الطالب */}
                <th className="p-3.5 text-center w-12">ت</th>
                {/* 👤 اسم الطالب الرباعي */}
                <th className="p-3.5">اسم الطالب الرباعي</th>
                <th className="p-3.5 text-center">طبيعة التقديم</th>
                <th className="p-3.5 text-center">ملف الحل (PDF)</th>
                {isReport && <th className="p-3.5 text-center">الاستلال العلمي</th>}
                <th className="p-3.5 text-center">قرار التدقيق</th>
                <th className="p-3.5 text-center">الدرجة</th>
                <th className="p-3.5 rounded-tl-2xl text-center">الإجراءات والقرار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-base font-black">
              {filteredStudents.map((std, idx) => {
                const sub = submissions.find(
                  (s) => s.student_id === std.id || s.group_members?.some((m) => m.student_id === std.id)
                );
                const isSubmitted = !!sub;
                const decision = sub?.review_decision || (isSubmitted ? 'pending' : undefined);
                const isSelected = selectedStudentIds.includes(std.id);

                return (
                  <tr key={std.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== std.id));
                          } else {
                            setSelectedStudentIds([...selectedStudentIds, std.id]);
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 text-center text-slate-600 font-mono">{idx + 1}</td>
                    
                    {/* 👤 اسم الطالب الرباعي وتفاصيل التسليم والفترة */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-950">{std.full_name}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center gap-1 ${
                          (std.study_type || 'morning') === 'evening'
                            ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
                            : 'bg-sky-50 text-sky-950 border-sky-200'
                        }`}>
                          {(std.study_type || 'morning') === 'evening' ? (
                            <Moon className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Sun className="w-3.5 h-3.5 text-sky-600" />
                          )}
                          <span>{(std.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                        </span>
                      </div>
                      
                      {/* إذا كان تسليماً جماعياً، عرض زملاء الفريق */}
                      {isSubmitted && sub.submission_type === 'group' && sub.group_members && sub.group_members.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-black text-sky-800">الفريق المشترك:</span>
                          {sub.group_members.map((m, mIdx) => (
                            <span key={mIdx} className="px-2 py-0.5 bg-sky-100 text-sky-950 rounded-lg text-sm font-black">
                              {m.full_name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* سبب الرفض أو التعديل إن وجد */}
                      {sub?.decision_reason && (
                        <p className="text-sm font-black text-rose-700 mt-1 bg-rose-50 p-2 rounded-xl border border-rose-200">
                          ⚠️ <strong>توجيه الأستاذ:</strong> {sub.decision_reason}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {!isSubmitted ? (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-xl text-sm font-black">
                          —
                        </span>
                      ) : sub.submission_type === 'group' ? (
                        <span className="px-3 py-1 bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-sm font-black inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-sky-700" />
                          <span>جماعي ({sub.group_members?.length || 1})</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-950 border border-indigo-300 rounded-xl text-sm font-black inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-700" />
                          <span>فردي</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {isSubmitted && sub.file_url ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(sub)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-950 border border-red-300 rounded-xl text-sm font-black transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="تحميل ومعاينة ملف PDF"
                        >
                          <FileText className="w-4 h-4 text-red-600" />
                          <span className="truncate max-w-[130px]">{sub.file_name || 'ملف PDF'}</span>
                          <Download className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm font-black">لم يُرفَع</span>
                      )}
                    </td>

                    {/* نسبة الاستلال العلمي للتقارير */}
                    {isReport && (
                      <td className="p-3.5 text-center">
                        {isSubmitted && sub.plagiarism_percentage !== undefined && sub.plagiarism_percentage !== null ? (
                          <span className={`px-3 py-1 rounded-xl text-sm font-black border font-mono ${ sub.plagiarism_percentage <= 15 ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : sub.plagiarism_percentage <= 25 ? 'bg-sky-100 text-sky-950 border-sky-300' : 'bg-rose-100 text-rose-950 border-rose-300' }`}>
                            {sub.plagiarism_percentage}% استلال
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-slate-400 text-sm font-black">—</span>
                        ) : (
                          <span className="text-slate-300 text-sm font-black">—</span>
                        )}
                      </td>
                    )}

                    {/* شارة قرار التدقيق الأكاديمي */}
                    <td className="p-3.5 text-center">
                      {!isSubmitted ? (
                        <span className="px-3 py-1 bg-red-100 text-red-900 border border-red-200 rounded-xl text-sm font-black">
                          لم يسلم ❌
                        </span>
                      ) : decision === 'accepted' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-sm font-black inline-flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          <span>مقبول 🟢</span>
                        </span>
                      ) : decision === 'needs_revision' ? (
                        <span className="px-3 py-1 bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-sm font-black inline-flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-sky-700" />
                          <span>يحتاج تعديل 🔄</span>
                        </span>
                      ) : decision === 'rejected' ? (
                        <span className="px-3 py-1 bg-rose-100 text-rose-950 border border-rose-300 rounded-xl text-sm font-black inline-flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-700" />
                          <span>مرفوض 🔴</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-950 border border-indigo-300 rounded-xl text-sm font-black">
                          قيد التدقيق ⏳
                        </span>
                      )}
                    </td>

                    {/* الدرجة المرصودة */}
                    <td className="p-3.5 text-center">
                      {isSubmitted && sub.score !== undefined && sub.score !== null ? (
                        <div className="inline-block px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-black text-sm font-mono">
                          {sub.score} / {task.max_score}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm font-black">—</span>
                      )}
                    </td>

                    {/* أزرار الإجراءات والتدقيق */}
                    <td className="p-3.5 text-center">
                      {isSubmitted ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-black rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Award className="w-3.5 h-3.5 text-cyan-300" />
                            <span>تدقيق وقرار ✍️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingSubmission(sub)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="حذف هذا التسليم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sendAppNotification({
                              recipient_id: std.id,
                              recipient_role: 'student',
                              title: `⚠️ تذكير بتسليم ${task.title}`,
                              message: `نود تذكيرك بسرعة تسليم ${isAssignment ? 'الواجب' : 'التقرير'} لمادة (${task.course_name}) قبل انقضاء الموعد.`,
                              type: 'task_deadline_alert',
                              link: '/student/dashboard',
                            });
                            showToast(`📢 تم إرسال تذكير للطالب (${std.full_name})!`);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-lg text-sm font-black transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Send className="w-3 h-3 text-slate-700" />
                          <span>تذكير 📢</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={isReport ? 9 : 8} className="p-8 text-center text-slate-950 font-black text-sm font-black">
                    لا توجد نتائج مطابقة لبحثك أو الفلتر المحدد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✍️ درج رصد القرار والدرجة والملاحظات التقييمية لطالب محدد بحدود ناعمة */}
        {selectedSubForGrading && (
          <div className="p-6 bg-blue-50/90 border-t border-blue-200 rounded-b-3xl space-y-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-blue-950">
                <Award className="w-6 h-6 text-indigo-700" />
                <h3 className="text-base sm:text-lg font-black">
                  تدقيق وقرار تسليم الطالب: <span className="text-slate-950 underline">{selectedSubForGrading.student_name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubForGrading(null)}
                className="p-2 text-slate-700 hover:text-black rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGradeSubmit} className="space-y-5">
              
              {/* 🚦 اختيار قرار التدقيق الثلاثي */}
              <div>
                <label className="text-base font-black text-slate-950 block mb-2.5">
                  🚦 قرار تدقيق الأستاذ على هذا {isAssignment ? 'الواجب' : 'التقرير'}:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    decisionInput === 'accepted'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-300'
                      : 'bg-white border-slate-300 text-slate-700 font-bold hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="accepted"
                      checked={decisionInput === 'accepted'}
                      onChange={() => setDecisionInput('accepted')}
                      className="w-5 h-5 text-emerald-600"
                    />
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-base font-black">🟢 مقبول (رصد الدرجة واعتمادها)</span>
                  </label>

                  <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    decisionInput === 'needs_revision'
                      ? 'bg-sky-100 border-sky-400 text-sky-950 font-black shadow-xs ring-2 ring-sky-300'
                      : 'bg-white border-slate-300 text-slate-700 font-bold hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="needs_revision"
                      checked={decisionInput === 'needs_revision'}
                      onChange={() => {
                        setDecisionInput('needs_revision');
                        setAllowResubmissionInput(true);
                      }}
                      className="w-5 h-5 text-sky-600"
                    />
                    <RotateCcw className="w-5 h-5 text-sky-600 shrink-0" />
                    <span className="text-base font-black">🔄 يحتاج تعديل (طلب إعادة رفع)</span>
                  </label>

                  <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    decisionInput === 'rejected'
                      ? 'bg-rose-100 border-rose-400 text-rose-950 font-black shadow-xs ring-2 ring-rose-300'
                      : 'bg-white border-slate-300 text-slate-700 font-bold hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={decisionInput === 'rejected'}
                      onChange={() => setDecisionInput('rejected')}
                      className="w-5 h-5 text-rose-600"
                    />
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="text-base font-black">🔴 مرفوض (غير مطابق / منسوخ)</span>
                  </label>
                </div>
              </div>

              {/* الحقول التفاعلية بحسب القرار المختار */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                
                {/* حقل الدرجة - يظهر بشكل أساسي عند القبول */}
                <div>
                  <label className="text-base font-black text-slate-950 block mb-1.5">
                    💯 الدرجة المرصودة (من {task.max_score} درجات):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={task.max_score}
                    required={decisionInput === 'accepted'}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder={`0 - ${task.max_score}`}
                    className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-2xl text-base font-black text-slate-950 focus:border-indigo-900 focus:outline-none font-mono"
                  />
                </div>

                {/* حقل نسبة الاستلال العلمي للتقارير */}
                {isReport && (
                  <div>
                    <label className="text-base font-black text-slate-950 block mb-1.5">
                      🔬 نسبة الاستلال العلمي والتشابه (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={plagiarismInput}
                      onChange={(e) => setPlagiarismInput(e.target.value)}
                      placeholder="مثال: 8.5%"
                      className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-2xl text-base font-black text-slate-950 focus:border-indigo-900 focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* مهلة إعادة التسليم في حال طلب التعديل */}
                {decisionInput === 'needs_revision' && (
                  <div>
                    <label className="text-base font-black text-slate-950 block mb-1.5">
                      ⏳ آخر مهلة لرفع النسخة المعدلة:
                    </label>
                    <input
                      type="date"
                      required
                      value={revisionDeadlineInput}
                      onChange={(e) => setRevisionDeadlineInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-sky-300 rounded-2xl text-base font-black text-slate-950 focus:border-sky-900 focus:outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* حقل أسباب القرار وملاحظات التعديل */}
              <div className="space-y-2">
                <label className="text-base font-black text-slate-950 block mb-1.5">
                  {decisionInput === 'needs_revision'
                    ? '📝 التوجيهات والتعديلات المطلوبة من الطالب بدقة:'
                    : decisionInput === 'rejected'
                    ? '🔴 سبب رفض التكليف بالتفصيل:'
                    : '💬 ملاحظات وتوجيهات الأستاذ التقييمية:'}
                </label>
                <textarea
                  rows={2}
                  required={decisionInput === 'needs_revision' || decisionInput === 'rejected'}
                  value={decisionInput === 'needs_revision' || decisionInput === 'rejected' ? decisionReasonInput : feedbackInput}
                  onChange={(e) => {
                    if (decisionInput === 'needs_revision' || decisionInput === 'rejected') {
                      setDecisionReasonInput(e.target.value);
                      setFeedbackInput(e.target.value);
                    } else {
                      setFeedbackInput(e.target.value);
                    }
                  }}
                  placeholder={
                    decisionInput === 'needs_revision'
                      ? 'اكتب نقاط التعديل المطلوبة مثل: تصحيح الدوال، إضافة لقطات التنفيذ، مراجعة المراجع...'
                      : decisionInput === 'rejected'
                      ? 'اكتب سبب الرفض مثل: استلال علمي مرتفع، حل غير مطابق، عدم تسليم الكود الأصلي...'
                      : 'اكتب ملاحظاتك التوجيهية ونقاط القوة والتحفيز...'
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-indigo-900 focus:outline-none"
                />
              </div>

              {/* أزرار الحفظ وخيارات المزامنة */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {decisionInput === 'accepted' ? (
                  <label className="flex items-center gap-2.5 text-base font-black text-blue-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToCoursework}
                      onChange={(e) => setSyncToCoursework(e.target.checked)}
                      className="w-5 h-5 text-indigo-900 rounded-lg border-blue-300 focus:ring-indigo-900"
                    />
                    <span>🔄 مزامنة وتثبيت الدرجة تلقائياً في سجل السعي الفصلي للمادة ({isReport ? 'بند التقرير والنشاط' : 'بند الواجبات'})</span>
                  </label>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 bg-indigo-900 hover:bg-indigo-800 text-white font-black text-base rounded-2xl shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer flex-shrink-0 active:scale-95"
                >
                  <Save className="w-5 h-5 text-cyan-300" />
                  <span>تثبيت القرار وإشعار الطالب فوراً 🔔</span>
                </button>
              </div>

            </form>
          </div>
        )}

      {/* 🗑️ كارد تأكيد حذف تسليم الطالب الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingSubmission}
        onClose={() => setDeletingSubmission(null)}
        title="تأكيد حذف تسليم الطالب"
        itemName={deletingSubmission?.student_name || 'تسليم طالب'}
        itemDetails={`تاريخ التسليم: ${deletingSubmission ? new Date(deletingSubmission.submitted_at).toLocaleDateString('ar-EG') : ''} | مادة ${task.course_name}`}
        warningMessage="هل أنت متأكد من حذف هذا التسليم والملف المرفق نهائياً؟ سيتمكن الطالب من إعادة التسليم مجدداً."
        onConfirm={() => {
          if (deletingSubmission) {
            onDeleteSubmission(deletingSubmission.id);
            showToast('🗑️ تم حذف التسليم بنجاح.');
            setDeletingSubmission(null);
          }
        }}
      />

      </div>
    </div>
  );
}

export default TeacherSubmissionsReviewModal;
