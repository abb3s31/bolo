'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📢 نافذة إرسال التبليغات الذكية لتسديد الأقساط الدراسية (TuitionNoticeModal)
import { useState, useMemo, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت
import { StudentTuitionRecord, UserProfile } from '@/types'; // 🔗 الأنواع المحددة والصريحة
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  X, 
  Send, 
  CreditCard, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  DollarSign,
  AlertTriangle,
  ChevronDown,
  Check,
  Search,
  Layers
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG

// 📢 مصفوفة خيارات نوع القسط المطلوب تسديده المصممة باحترافية
interface NoticeTypeOptionItem {
  id: 'full_tuition' | 'installment_1' | 'installment_2' | 'installment_3' | 'installment_4' | 'installments_1_2' | 'custom';
  label: string;
  badge: string;
  badgeColor: string;
}

const NOTICE_TYPE_OPTIONS: NoticeTypeOptionItem[] = [
  {
    id: 'full_tuition',
    label: 'تسديد القسط السنوي بالكامل',
    badge: 'القسط كاملاً',
    badgeColor: 'bg-emerald-50 text-emerald-950 border-emerald-300',
  },
  {
    id: 'installment_1',
    label: 'تسديد القسط الدراسي الأول',
    badge: 'الدفعة الأولى',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
  },
  {
    id: 'installment_2',
    label: 'تسديد القسط الدراسي الثاني',
    badge: 'الدفعة الثانية',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
  },
  {
    id: 'installment_3',
    label: 'تسديد القسط الدراسي الثالث',
    badge: 'الدفعة الثالثة',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
  },
  {
    id: 'installment_4',
    label: 'تسديد القسط الدراسي الرابع',
    badge: 'الدفعة الرابعة',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
  },
  {
    id: 'installments_1_2',
    label: 'تسديد القسطين الأول والثاني معاً',
    badge: 'الدفعتان 1 و 2',
    badgeColor: 'bg-sky-50 text-sky-950 border-sky-300',
  },
  {
    id: 'custom',
    label: 'تبليغ مالي وتسوية مخصصة',
    badge: 'مخصص',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
  },
];

interface TuitionNoticeModalProps {
  isOpen: boolean;                                     // 🚪 حالة فتح المودال
  onClose: () => void;                                 // 🚪 دالة إغلاق المودال
  departmentId: string;                                // 🏢 معرف القسم
  departmentName: string;                              // 🏢 اسم القسم
  currentStage: number | 'all';                        // 🎓 المرحلة الحالية
  tuitionRecords: StudentTuitionRecord[];              // 📋 سجلات الأقساط
  students: UserProfile[];                             // 👥 قائمة الطلاب
  selectedStudentTuitionIds?: string[];                // 🔘 الطلبة المحددين مسبقاً
  onSuccess?: (sentCount: number) => void;             // 📢 إشعار النجاح
}

export default function TuitionNoticeModal({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  currentStage,
  tuitionRecords,
  students,
  selectedStudentTuitionIds = [],
  onSuccess,
}: TuitionNoticeModalProps) {
  // 📌 حالات التبليغ
  const [targetScope, setTargetScope] = useState<'all' | 'unsettled_only' | 'single_student' | 'selected_students'>(
    selectedStudentTuitionIds.length > 0 ? 'selected_students' : 'unsettled_only'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedStudentTuitionIds.map((tid) => {
      const rec = tuitionRecords.find((r) => r.id === tid);
      return rec ? rec.student_id : tid;
    })
  );
  const [noticeType, setNoticeType] = useState<
    'full_tuition' | 'installment_1' | 'installment_2' | 'installment_3' | 'installment_4' | 'installments_1_2' | 'custom'
  >('installment_1');
  const [dueDate, setDueDate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 🎛️ حالات فتح القوائم المنسدلة ومراجعها
  const [isNoticeTypeDropdownOpen, setIsNoticeTypeDropdownOpen] = useState<boolean>(false);
  const noticeTypeDropdownRef = useRef<HTMLDivElement | null>(null);

  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const studentDropdownRef = useRef<HTMLDivElement | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // 🖱️ إغلاق القوائم المنسدلة عند النقر بالخارج
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (noticeTypeDropdownRef.current && !noticeTypeDropdownRef.current.contains(target)) {
        setIsNoticeTypeDropdownOpen(false);
      }
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 🔍 طلاب المرحلة أو كافة مراحل القسم
  const stageStudents = useMemo(() => {
    return students.filter(
      (s) => s.department_id === departmentId && (currentStage === 'all' || (s.stage_number || 1) === currentStage)
    );
  }, [students, departmentId, currentStage]);

  // 🔍 سجلات الأقساط للمرحلة الحالية أو كافة المراحل
  const stageRecords = useMemo(() => {
    return tuitionRecords.filter(
      (r) => r.department_id === departmentId && (currentStage === 'all' || r.stage_number === currentStage)
    );
  }, [tuitionRecords, departmentId, currentStage]);

  // 🔍 الطلاب غير المسددين (عليهم متبقيات أو غير مسددين)
  const unsettledRecords = useMemo(() => {
    return stageRecords.filter(
      (r) => r.status === 'unsettled' || r.status === 'partially_settled' || r.remaining_amount > 0
    );
  }, [stageRecords]);

  // 📋 نصوص أنواع التبليغ بالعربية
  const noticeTypeLabels: Record<string, string> = {
    full_tuition: 'تسديد القسط السنوي بالكامل',
    installment_1: 'تسديد القسط الدراسي الأول',
    installment_2: 'تسديد القسط الدراسي الثاني',
    installment_3: 'تسديد القسط الدراسي الثالث',
    installment_4: 'تسديد القسط الدراسي الرابع',
    installments_1_2: 'تسديد القسطين الأول والثاني معاً',
    custom: 'تبليغ مالي وتسوية أقساط مخصصة',
  };

  // 🎯 استخراج قائمة الطلاب المستهدفين بناءً على النطاق
  const targetRecipientIds = useMemo(() => {
    if (targetScope === 'all') {
      return stageStudents.map((s) => s.id);
    }
    if (targetScope === 'unsettled_only') {
      return unsettledRecords.map((r) => r.student_id);
    }
    if (targetScope === 'single_student') {
      return selectedStudentId ? [selectedStudentId] : [];
    }
    if (targetScope === 'selected_students') {
      return selectedIds;
    }
    return [];
  }, [targetScope, stageStudents, unsettledRecords, selectedStudentId, selectedIds]);

  // 💬 الرسالة التلقائية الذكية
  const generatedMessage = useMemo(() => {
    if (customMessage.trim()) return customMessage;

    const stageText = currentStage === 'all' ? 'كافة المراحل' : getStageNameInArabic(currentStage);
    const baseHeader = `تحية طيبة طلبتنا الأعزاء في قسم ${departmentName} (${stageText})..`;
    const actionText = `نسترعي انتباهكم إلى ضرورة مراجعة شعبة الشؤون المالية والحسابات لـ (${noticeTypeLabels[noticeType] || 'تسديد القسط المقرر'})`;
    const deadlineText = dueDate ? ` في موعد أقصاه ${dueDate}` : '';
    const noteText = `. علماً أن تسديد الأقساط وتوثيق وصل القبض شرط أساسي للاستمرار الأكاديمي واستلام النتائج وبطاقات الامتحانات.`;

    return `${baseHeader}\n${actionText}${deadlineText}${noteText}`;
  }, [customMessage, departmentName, currentStage, noticeType, dueDate]);

  if (!isOpen) return null;

  // 🚀 إرسال التبليغ المالي
  const handleSendNotice = async () => {
    if (targetRecipientIds.length === 0) {
      setErrorMsg('يرجى تحديد طالب واحد على الأقل لإرسال التبليغ.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsSending(true);
    const title = `تبليغ مالي: ${noticeTypeLabels[noticeType]}`;

    // إرسال الإشعار لجميع الطلاب المستهدفين
    targetRecipientIds.forEach((recipientId) => {
      sendAppNotification({
        recipient_id: recipientId,
        recipient_role: 'student',
        title,
        message: generatedMessage,
        type: 'tuition_notice',
        link: '/student/dashboard',
      });
    });

    setIsSending(false);
    onSuccess?.(targetRecipientIds.length);
    onClose();
  };

  const selectedSingleRecord = stageRecords.find((r) => r.student_id === selectedStudentId);

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none" dir="rtl">
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 relative overflow-hidden">
        
        {/* الهيدر الثابت */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
              <CreditCard className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg text-xs font-black">
                  قسم {departmentName}
                </span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-bold">
                  {currentStage === 'all' ? 'كافة المراحل' : getStageNameInArabic(currentStage)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                إرسال تبليغ تسديد الأقساط الدراسية للطلبة
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* محتوى وخيارات التبليغ القابل للتمرير */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm font-bold">
          
          {/* نوع ومرحلة القسط المطلوب تسديده */}
          <div ref={noticeTypeDropdownRef} className="relative">
            <label className="block text-slate-800 font-bold mb-1.5">1. حدد القسط أو الدفعة المطلوب تسديدها:</label>
            <button
              type="button"
              onClick={() => setIsNoticeTypeDropdownOpen(!isNoticeTypeDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              {(() => {
                const currentOpt = NOTICE_TYPE_OPTIONS.find((opt) => opt.id === noticeType) || NOTICE_TYPE_OPTIONS[0];
                return (
                  <div className="flex items-center gap-2.5">
                    {noticeType === 'full_tuition' ? (
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : noticeType === 'installments_1_2' ? (
                      <Layers className="w-4 h-4 text-sky-600 shrink-0" />
                    ) : noticeType === 'custom' ? (
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    ) : (
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="text-slate-950 font-black">{currentOpt.label}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${currentOpt.badgeColor}`}>
                      {currentOpt.badge}
                    </span>
                  </div>
                );
              })()}
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isNoticeTypeDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
            </button>

            {/* القائمة المنسدلة المخصصة */}
            {isNoticeTypeDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 max-h-52 overflow-y-auto">
                {NOTICE_TYPE_OPTIONS.map((opt) => {
                  const isSelected = noticeType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setNoticeType(opt.id);
                        setIsNoticeTypeDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#0F2942] text-white shadow-2xs'
                          : 'hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {opt.id === 'full_tuition' ? (
                          <CreditCard className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                        ) : opt.id === 'installments_1_2' ? (
                          <Layers className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-300' : 'text-sky-600'}`} />
                        ) : opt.id === 'custom' ? (
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`} />
                        ) : (
                          <Calendar className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-300' : 'text-blue-600'}`} />
                        )}
                        <div className="flex items-center gap-1.5">
                          <strong className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                            {opt.label}
                          </strong>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black border ${
                            isSelected ? 'bg-white/20 text-white border-white/30' : opt.badgeColor
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* الفئة المستهدفة */}
          <div>
            <label className="block text-slate-800 font-bold mb-1.5">2. الفئة والطلبة المستهدفون بالتبليغ:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetScope('unsettled_only')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  targetScope === 'unsettled_only'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">غير المسددين فقط</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  targetScope === 'unsettled_only' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {unsettledRecords.length} طالب
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  targetScope === 'all'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">كافة طلاب المرحلة</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  targetScope === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {stageStudents.length} طالب
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('single_student')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  targetScope === 'single_student'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">طالب منفرد</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  targetScope === 'single_student' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  مخصص
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('selected_students')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  targetScope === 'selected_students'
                    ? 'bg-[#0F2942] border-[#0F2942] text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">تحديد يدوي</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                  targetScope === 'selected_students' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {selectedIds.length} محدد
                </span>
              </button>
            </div>
          </div>

          {/* محدد الطالب المنفرد */}
          {targetScope === 'single_student' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-2">
              <label className="block text-slate-950 font-bold text-xs">اختر الطالب المستهدف:</label>
              
              <div ref={studentDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  {(() => {
                    const selStd = stageStudents.find((s) => s.id === selectedStudentId);
                    if (!selStd) {
                      return <span className="text-slate-500 font-bold">-- اضغط لاختيار طالب من القائمة --</span>;
                    }
                    const rec = stageRecords.find((r) => r.student_id === selStd.id);
                    const unpaidStages = rec?.unpaid_stages_count || 0;
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-950 font-black">{selStd.full_name}</strong>
                        {unpaidStages > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 rounded-md text-[10px] font-bold">
                            ⚠️ متأخرات ({unpaidStages}) مرحلة
                          </span>
                        ) : rec?.remaining_amount ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-md text-[10px] font-bold">
                            متبقي: {rec.remaining_amount.toLocaleString()} د.ع
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-md text-[10px] font-bold">
                            مسدد بالكامل
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStudentDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                </button>

                {isStudentDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-2 space-y-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="ابحث عن اسم الطالب..."
                        className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-950 focus:outline-none focus:border-slate-900"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      {stageStudents
                        .filter((s) => !studentSearchQuery.trim() || s.full_name.includes(studentSearchQuery.trim()))
                        .map((s) => {
                          const isSelected = selectedStudentId === s.id;
                          const rec = stageRecords.find((r) => r.student_id === s.id);
                          const unpaidStages = rec?.unpaid_stages_count || 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setIsStudentDropdownOpen(false);
                              }}
                              className={`w-full p-2 rounded-xl text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected ? 'bg-[#0F2942] text-white shadow-2xs' : 'hover:bg-slate-100 text-slate-900'
                              }`}
                            >
                              <div>
                                <strong className={`text-xs font-black block ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                  {s.full_name}
                                </strong>
                                <span className={`text-[10px] font-bold block ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                                  {unpaidStages > 0 ? `⚠️ بذمته ${unpaidStages} مراحل متأخرة` : rec?.remaining_amount ? `متبقي بذمته: ${rec.remaining_amount.toLocaleString()} د.ع` : 'مسدد بالكامل'}
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {selectedSingleRecord && selectedSingleRecord.unpaid_stages_count > 0 && (
                <div className="p-3 bg-rose-50 text-rose-950 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>تنبيه: هذا الطالب بذمته تسديد ({selectedSingleRecord.unpaid_stages_count}) مرحلة كاملة متأخرة!</span>
                </div>
              )}
            </div>
          )}

          {/* محدد الطلاب المتعدد */}
          {targetScope === 'selected_students' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 space-y-2 max-h-48 overflow-y-auto">
              <label className="block text-slate-950 font-bold text-xs">حدد الطلاب بالاسم:</label>
              <div className="space-y-1">
                {stageStudents.map((s) => {
                  const isChecked = selectedIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2.5 p-2 hover:bg-white rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, s.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== s.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-900">{s.full_name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* موعد الاستحقاق النهائي */}
          <div>
            <label className="block text-slate-800 font-bold mb-1.5">3. الموعد النهائي للتسديد (اختياري):</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs font-mono"
            />
          </div>

          {/* نص التبليغ */}
          <div>
            <label className="block text-slate-800 font-bold mb-1.5">4. نص ورسالة التبليغ المرسلة للطلبة:</label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={generatedMessage}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* زر الإرسال والملخص الثابت في أسفل المودال */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-bold text-slate-700">
            سيتم إرسال إشعار فوري وتنبيه داخل النظام لـ <strong className="text-slate-950 font-mono font-black">({targetRecipientIds.length})</strong> طلاب.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSendNotice}
              disabled={isSending || targetRecipientIds.length === 0}
              className="px-5 py-2 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>{isSending ? 'جاري الإرسال...' : `إرسال التبليغ (${targetRecipientIds.length})`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
