'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📤 نافذة تسليم ورفع ملفات الواجبات والتقارير للطلاب (فردي وجماعي مع PDF) - مسار بولونيا
import React, { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import { CourseAcademicTask, StudentTaskSubmission, UserProfile, SubmissionType, SubmissionGroupMember } from '@/types'; // 🔗 الواجهات
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import { 
  X, 
  UploadCloud, 
  FileText, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Sparkles, 
  Send 
} from 'lucide-react'; // 🎨 الأيقونات

interface StudentTaskSubmissionModalProps {
  isOpen: boolean; // 🚪 حالة فتح النافذة
  onClose: () => void; // ❌ دالة إغلاق النافذة
  task: CourseAcademicTask; // 📌 التكليف المراد تسليمه
  student: UserProfile; // 🎓 بيانات الطالب الحالي
  existingSubmission?: StudentTaskSubmission | null; // 💾 التسليم السابق إن وجد للتعديل
  onSaveSubmission: (submission: StudentTaskSubmission) => void; // 💾 دالة حفظ التسليم
}

export function StudentTaskSubmissionModal({
  isOpen,
  onClose,
  task,
  student,
  existingSubmission,
  onSaveSubmission,
}: StudentTaskSubmissionModalProps) {
  // 🏷️ نوع التقديم: فردي لطالب واحد أو جماعي لفريق عمل
  const [submissionType, setSubmissionType] = useState<SubmissionType>(
    existingSubmission ? existingSubmission.submission_type : (task.submission_mode === 'group_only' ? 'group' : 'individual')
  );

  // 👥 قائمة أعضاء الفريق في حال التقرير الجماعي
  const [groupMembers, setGroupMembers] = useState<SubmissionGroupMember[]>(
    existingSubmission?.group_members && existingSubmission.group_members.length > 0
      ? existingSubmission.group_members
      : [
          { student_id: student.id, full_name: student.full_name, university_number: student.university_number || '20261001' },
          { full_name: '', university_number: '' },
        ]
  );

  // 📄 تفاصيل ملف الـ PDF المرفوع
  const [fileName, setFileName] = useState<string>(existingSubmission ? existingSubmission.file_name : '');
  const [fileUrl, setFileUrl] = useState<string>(existingSubmission ? existingSubmission.file_url : '');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(existingSubmission ? existingSubmission.file_size_bytes : 0);
  const [studentNotes, setStudentNotes] = useState<string>(existingSubmission?.student_notes || '');

  // ⏳ حالة الرفع والمعالجة
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 🔄 إعادة تعيين الحقول عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      if (existingSubmission) {
        setSubmissionType(existingSubmission.submission_type);
        setGroupMembers(
          existingSubmission.group_members && existingSubmission.group_members.length > 0
            ? existingSubmission.group_members
            : [{ student_id: student.id, full_name: student.full_name, university_number: student.university_number || '20261001' }]
        );
        setFileName(existingSubmission.file_name);
        setFileUrl(existingSubmission.file_url);
        setFileSizeBytes(existingSubmission.file_size_bytes);
        setStudentNotes(existingSubmission.student_notes || '');
      } else {
        setSubmissionType(task.submission_mode === 'group_only' ? 'group' : 'individual');
        setGroupMembers([
          { student_id: student.id, full_name: student.full_name, university_number: student.university_number || '20261001' },
          { full_name: '', university_number: '' },
        ]);
        setFileName('');
        setFileUrl('');
        setFileSizeBytes(0);
        setStudentNotes('');
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, existingSubmission, task, student]);

  if (!isOpen) return null;

  // 🔒 فحص حالة القفل من قبل الأستاذ
  const isLockedByTeacher = task.is_submission_open === false;

  // ⏰ فحص المواعيد والتأخير
  const now = new Date();
  const dueDate = new Date(task.due_date);
  const isLate = now > dueDate;
  const isPastHardDeadline = task.final_deadline ? now > new Date(task.final_deadline) : false;

  // ➕ إضافة عضو جديد لمجموعة التقرير
  const handleAddMember = () => {
    const maxLimit = task.max_group_size || 4;
    if (groupMembers.length >= maxLimit) {
      setErrorMessage(`⚠️ الحد الأقصى لأعضاء المجموعة هو ${maxLimit} طلاب فقط!`);
      return;
    }
    setGroupMembers([...groupMembers, { full_name: '', university_number: '' }]);
  };

  // ➖ حذف عضو من مجموعة التقرير
  const handleRemoveMember = (index: number) => {
    if (index === 0) {
      setErrorMessage('⚠️ لا يمكن إزالة الطالب الرافع (أنت)!');
      return;
    }
    const updated = groupMembers.filter((_, i) => i !== index);
    setGroupMembers(updated);
  };

  // ✏️ تعديل بيانات العضو
  const handleUpdateMember = (index: number, field: 'full_name' | 'university_number', value: string) => {
    const updated = [...groupMembers];
    updated[index] = { ...updated[index], [field]: value };
    setGroupMembers(updated);
  };

  // 📂 معالجة اختيار ملف PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('⚠️ يُرجى رفع ملف بصيغة PDF حصراً (.pdf)!');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('⚠️ حجم الملف يتجاوز الحد المسموح (15 ميغابايت)!');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFileUrl(dataUrl);
      setFileName(file.name);
      setFileSizeBytes(file.size);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMessage('حدث خطأ أثناء قراءة ملف الـ PDF!');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 💾 إرسال وحفظ التسليم
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedByTeacher) {
      setErrorMessage('🔒 عذراً، قام أستاذ المادة بقفل باب استقبال الملفات لهذا التكليف!');
      return;
    }

    if (isPastHardDeadline) {
      setErrorMessage('⛔ لقد انقضى الموعد النهائي المطلق (Hard Cutoff) لاستلام هذا التكليف!');
      return;
    }

    if (!fileUrl || !fileName) {
      setErrorMessage('⚠️ يُرجى اختيار وإرفاق ملف PDF للواجب أو التقرير أولاً!');
      return;
    }

    // التحقق من اكتمال بيانات أعضاء الفريق في حال التقديم الجماعي
    let validGroupMembers: SubmissionGroupMember[] = [];
    if (submissionType === 'group') {
      const cleaned = groupMembers.filter((m) => m.full_name.trim() !== '');
      if (cleaned.length === 0) {
        setErrorMessage('⚠️ يُرجى إدخال اسم زميل واحد على الأقل في المجموعة!');
        return;
      }
      validGroupMembers = cleaned;
    }

    const nowIso = new Date().toISOString();
    const submissionId = existingSubmission ? existingSubmission.id : `sub-${Date.now()}`;
    const isRevision = existingSubmission?.review_decision === 'needs_revision';
    const newRevisionCount = isRevision ? (existingSubmission.revision_count || 1) + 1 : (existingSubmission?.revision_count || 1);

    const submissionRecord: StudentTaskSubmission = {
      id: submissionId,
      task_id: task.id,
      course_id: task.course_id,
      student_id: student.id,
      student_name: student.full_name,
      student_university_number: student.university_number || '20261001',
      submission_type: submissionType,
      group_members: submissionType === 'group' ? validGroupMembers : [],
      file_name: fileName,
      file_url: fileUrl,
      file_size_bytes: fileSizeBytes,
      student_notes: studentNotes.trim() || undefined,
      submitted_at: nowIso,
      is_late: isLate,
      review_decision: isRevision ? 'pending' : existingSubmission?.review_decision,
      decision_reason: existingSubmission?.decision_reason,
      revision_deadline: existingSubmission?.revision_deadline,
      plagiarism_percentage: existingSubmission?.plagiarism_percentage,
      revision_count: newRevisionCount,
      allow_resubmission: existingSubmission?.allow_resubmission,
      score: isRevision ? undefined : existingSubmission?.score,
      teacher_feedback: existingSubmission?.teacher_feedback,
      graded_by: existingSubmission?.graded_by,
      graded_at: isRevision ? undefined : existingSubmission?.graded_at,
      status: isLate ? 'late' : 'submitted',
      created_at: existingSubmission ? existingSubmission.created_at : nowIso,
      updated_at: nowIso,
    };

    onSaveSubmission(submissionRecord);

    // 🔔 إرسال إشعار فوري لأستاذ المادة بتسليم الطالب للواجب
    sendAppNotification({
      recipient_id: task.teacher_id,
      recipient_role: 'teacher',
      title: isRevision ? `🔄 رفع نسخة معدلة (#${newRevisionCount}): ${student.full_name} (${task.title})` : `📬 تسليم جديد: ${student.full_name} (${task.title})`,
      message: isRevision
        ? `قام الطالب (${student.full_name}) برفع النسخة المعدلة رقم (${newRevisionCount}) لمادة (${task.course_name}) استجابة لتوجيهاتك.`
        : `قام الطالب (${student.full_name}) برفع ملف ${submissionType === 'group' ? 'تقرير جماعي مشترك' : 'حل فردي'} لمادة (${task.course_name}).`,
      type: 'grade_updated',
      link: `/teacher/courses/${task.course_id}`,
    });

    setSuccessMessage(isRevision ? '🎉 تم رفع النسخة المعدلة بنجاح وإشعار أستاذ المادة!' : '🎉 تم رفع وتسليم التكليف بنجاح إلى أستاذ المادة!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* 🏛️ الهيدر الفاتح للنافذة الثابت */}
        <div className="p-5 sm:p-6 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-200">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-black rounded-xl border border-indigo-200">
                  {task.task_type === 'assignment' ? '📑 تسليم واجب بيتي' : '📄 تسليم تقرير وبحث'}
                </span>
                <span className="px-3 py-1 bg-slate-900 text-white text-sm font-black rounded-xl font-mono">
                  {task.course_code}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                {task.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-700 hover:text-black rounded-2xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 📋 بطاقة معلومات ومواعيد التكليف */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-base font-black">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="text-slate-950 font-black text-sm block">موعد التسليم المقرر:</span>
              <span className="text-slate-900 font-mono">
                {new Date(task.due_date).toLocaleDateString('ar-IQ-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-slate-950 font-black text-sm block">الدرجة المخصصة:</span>
              <span className="text-slate-900 font-mono">{task.max_score} درجات من السعي</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLockedByTeacher ? (
              <span className="px-3 py-1.5 bg-red-100 text-red-900 border border-red-300 rounded-xl font-black text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>الاستلام مقفل 🔒</span>
              </span>
            ) : isLate ? (
              <span className="px-3 py-1.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl font-black text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>تسليم متأخر</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl font-black text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>الاستلام مفتوح 🟢</span>
              </span>
            )}
          </div>
        </div>

        {/* 🟣 تنبيه طلب التعديل من الأستاذ للنسخة السابقة بحدود ناعمة */}
        {existingSubmission?.review_decision === 'needs_revision' && (
          <div className="m-5 p-5 bg-indigo-50 border border-indigo-300 rounded-3xl space-y-2.5 text-indigo-950 text-base font-black animate-in fade-in">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>طلب تعديل وإعادة رفع (المحاولة رقم {(existingSubmission.revision_count || 1) + 1})</span>
            </div>
            {existingSubmission.decision_reason && (
              <p className="bg-white/80 p-3.5 rounded-2xl border border-indigo-200 font-medium leading-relaxed">
                <strong>📝 توجيهات وملاحظات الأستاذ ({task.teacher_name}):</strong> {existingSubmission.decision_reason}
              </p>
            )}
            {existingSubmission.revision_deadline && (
              <p className="text-sm font-black text-indigo-900 font-mono">
                ⏳ آخر مهلة لرفع النسخة المعدلة: {new Date(existingSubmission.revision_deadline).toLocaleDateString('ar-IQ-u-nu-latn')}
              </p>
            )}
          </div>
        )}

        {/* 🔒 تنبيه القفل إن وجد بحدود ناعمة */}
        {isLockedByTeacher && (
          <div className="m-5 p-4 bg-red-50 border border-red-300 rounded-3xl flex items-center gap-3 text-red-950 text-base font-black">
            <Lock className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <strong>🔒 باب الاستلام مقفل:</strong> لقد قام أستاذ المادة ({task.teacher_name}) بإغلاق إمكانية تسليم الملفات لهذا التكليف. لا يمكن رفع ملفات جديدة حالياً.
            </div>
          </div>
        )}

        {/* ⚠️ تنبيه عقوبة التأخير */}
        {isLate && !isLockedByTeacher && task.late_penalty_warning && (
          <div className="mx-5 mt-5 p-4 bg-rose-50 border border-rose-300 rounded-3xl flex items-center gap-3 text-rose-950 text-base font-black">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{task.late_penalty_warning}</span>
          </div>
        )}

        {/* 📝 نموذج التسليم مع تمرير داخلي سلس وفوتر صلب ثابت */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          <div className="p-6 sm:p-7 space-y-6 flex-1 overflow-y-auto overscroll-contain">

            {/* 👥 1. محدد نوع التقديم (فردي vs جماعي) بحدود ناعمة */}
            <div className="space-y-2.5">
              <label className="text-base font-black text-slate-950 block">
                🏷️ طبيعة التقديم ونمط العمل:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSubmissionType('individual')}
                  disabled={task.submission_mode === 'group_only'}
                  className={`p-4 rounded-3xl border text-right transition cursor-pointer flex items-center gap-3.5 ${
                    submissionType === 'individual'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-400/40 font-black'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl ${submissionType === 'individual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black block">تقديم فردي (طالب واحد) 👤</span>
                    <span className="text-sm font-black text-slate-600">العمل مقدم باسمك الشخصي فقط</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('group')}
                  disabled={task.submission_mode === 'individual_only'}
                  className={`p-4 rounded-3xl border text-right transition cursor-pointer flex items-center gap-3.5 ${
                    submissionType === 'group'
                      ? 'border-sky-600 bg-sky-50/80 text-sky-950 ring-2 ring-sky-400/40 font-black'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl ${submissionType === 'group' ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black block">تقديم جماعي (فريق عمل) 👥</span>
                    <span className="text-sm font-black text-slate-600">تقرير أو واجب مشترك مع زملاء</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 👥 2. حقول أسماء أعضاء المجموعة (تظهر فقط في حال التقديم الجماعي) بحدود ناعمة */}
            {submissionType === 'group' && (
              <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-3xl space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-950">
                    <Users className="w-5 h-5 text-sky-700" />
                    <span className="text-base font-black">أسماء وأرقام الطلاب المشاركين في المجموعة:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة طالب</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {groupMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-sky-200">
                      <span className="w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-950 font-black text-sm rounded-xl flex-shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      
                      <input
                        type="text"
                        required
                        value={member.full_name}
                        readOnly={idx === 0} // الطالب الحالي غير قابل للتعديل
                        onChange={(e) => handleUpdateMember(idx, 'full_name', e.target.value)}
                        placeholder="اسم الطالب الرباعي..."
                        className={`flex-1 px-4 py-2 rounded-xl border text-base font-black text-slate-900 focus:outline-none ${ idx === 0 ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-sky-300 focus:border-sky-600' }`}
                      />

                      <input
                        type="text"
                        required
                        value={member.university_number}
                        readOnly={idx === 0}
                        onChange={(e) => handleUpdateMember(idx, 'university_number', e.target.value)}
                        placeholder="الرقم الجامعي..."
                        className={`w-36 px-4 py-2 rounded-xl border text-base font-black text-slate-900 focus:outline-none font-mono ${ idx === 0 ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-sky-300 focus:border-sky-600' }`}
                      />

                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="حذف الطالب من المجموعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-black text-sky-900">
                  💡 ملاحظة: سيتم تسجيل التقرير ورصد درجته لجميع الطلاب المسجلين أعلاه في سجلات السعي الأكاديمي.
                </p>
              </div>
            )}

            {/* 📄 3. منطقة رفع واختيار ملف الـ PDF */}
            <div className="space-y-2.5">
              <label className="text-base font-black text-slate-950 block">
                📄 إرفاق ملف التقرير أو الحل (PDF حصراً):
              </label>

              <div className={`p-7 border-2 border-dashed rounded-3xl text-center transition flex flex-col items-center justify-center gap-3.5 ${
                fileName ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}>
                {fileName ? (
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-400 shadow-xs max-w-full">
                    <FileText className="w-10 h-10 text-red-600 flex-shrink-0" />
                    <div className="text-right overflow-hidden">
                      <span className="text-base font-black text-slate-950 block truncate max-w-xs sm:max-w-md">
                        {fileName}
                      </span>
                      <span className="text-sm font-black text-slate-700 font-mono">
                        {(fileSizeBytes / 1024).toFixed(1)} KB • بصيغة PDF جاهز للتسليم
                      </span>
                    </div>
                    <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-base font-black rounded-xl transition cursor-pointer flex-shrink-0">
                      <span>تغيير</span>
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-indigo-100 text-indigo-900 rounded-2xl">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-950">
                        اضغط لاختيار ملف PDF من جهازك أو اسحب الملف هنا
                      </p>
                      <p className="text-sm font-black text-slate-700 mt-1">
                        الصيغة المقبولة: PDF فقط • الحد الأقصى للحجم: 15MB
                      </p>
                    </div>
                    <label className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-base font-black rounded-2xl transition cursor-pointer shadow-xs">
                      <span>{isUploading ? 'جاري قراءة الملف...' : 'اختيار ملف PDF 📄'}</span>
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" disabled={isUploading || isLockedByTeacher} />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 💬 4. ملاحظات ورسالة الطالب للأستاذ */}
            <div className="space-y-2">
              <label className="text-base font-black text-slate-950 block">
                💬 ملاحظات أو رسالة إضافية للأستاذ (اختياري):
              </label>
              <textarea
                rows={2}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="اكتب أي ملاحظة حول الحل أو المراجع أو توضيحات التقرير..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:border-slate-500 focus:outline-none"
              />
            </div>

            {/* ⚠️ رسائل الخطأ والنجاح بحدود ناعمة */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-2.5 text-red-950 text-base font-black animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-950 text-base font-black animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

          </div>

          {/* 🔘 أزرار الإجراءات الصلبة الثابتة في أسفل الكارد */}
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-4 sm:p-5 flex items-center justify-end gap-3.5 z-30 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-2xl text-base transition cursor-pointer border border-slate-300"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isLockedByTeacher || !fileUrl || isUploading}
              className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl text-base shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-5 h-5 text-indigo-200" />
              <span>{existingSubmission ? 'تحديث التسليم المرفوع' : 'تأكيد رفع وإرسال التكليف'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
