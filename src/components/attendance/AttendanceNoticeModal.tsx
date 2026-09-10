'use client'; // ⚡ ينفذ بالعميل على متصفح رئيس القسم / المقرر

// 📢 نافذة إرسال التبليغات والتنبيهات الذكية للحضور والغيابات والعطل والامتحانات (AttendanceNoticeModal)
import React, { useState, useMemo, useEffect } from 'react'; // 🔗 خطافات رياكت
import { UserProfile } from '@/types'; // 🔗 الأنواع الرسمية
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات التفاعلي
import { 
  X, 
  Send, 
  Users, 
  User, 
  AlertTriangle, 
  AlertCircle, 
  Ban, 
  Calendar, 
  Clock, 
  FileText, 
  Sun, 
  Moon, 
  GraduationCap, 
  Building2,
  ChevronDown,
  Search,
  Check,
  BellRing
} from 'lucide-react'; // 🎨 أيقونات Lucide SVG الصريحة

// 🏷️ أنواع التبليغات المدعومة
export type AttendanceNoticeCategory = 
  | 'warning_1'            // ⚠️ إنذار غياب أولي (5%)
  | 'warning_2'            // 🚨 إنذار غياب نهائي (7%)
  | 'banned'               // 🚫 أمر حرمان رسمي وتجاوز الغياب (10%)
  | 'official_holiday'     // 🌴 تبليغ عطلة رسمية أو تعليق الدوام
  | 'exam_schedule'        // 📝 تبليغ موعد امتحان فصلي / نهائي
  | 'general_announcement'; // 📢 تبليغ وتوجيه أكاديمي عام

interface AttendanceNoticeModalProps {
  isOpen: boolean;                                     // 🚪 حالة فتح النافذة
  onClose: () => void;                                 // ❌ دالة إغلاق النافذة
  departmentId: string;                                // 🏢 معرف القسم
  departmentName: string;                              // 🏢 اسم القسم
  students: UserProfile[];                             // 👥 قائمة طلاب القسم
  initialStudent?: UserProfile | null;                 // 👤 الطالب المستهدف إذا كان تنبيهاً فردياً
  initialSelectedStudentIds?: string[];                // 🔘 معرفات الطلاب المحددين جماعياً
  defaultCategory?: AttendanceNoticeCategory;          // 🏷️ نوع التبليغ الافتراضي
  onNoticeSent?: (summary: string) => void;            // 📢 رد نداء النجاح
}

export default function AttendanceNoticeModal({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  students,
  initialStudent = null,
  initialSelectedStudentIds = [],
  defaultCategory = 'warning_1',
  onNoticeSent,
}: AttendanceNoticeModalProps) {
  // 📌 تحديد نطاق الإرسال
  const [targetScope, setTargetScope] = useState<'single_student' | 'selected_students' | 'broadcast'>(
    initialStudent ? 'single_student' : initialSelectedStudentIds.length > 0 ? 'selected_students' : 'broadcast'
  );

  // 🎯 فلاتر التبليغ العام
  const [broadcastStage, setBroadcastStage] = useState<number | 'all'>('all');
  const [broadcastStudyType, setBroadcastStudyType] = useState<'all' | 'morning' | 'evening'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialSelectedStudentIds);

  // 🎛️ حالة القائمة المنسدلة المخصصة للطلاب والبحث
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // 🏷️ تفاصيل التبليغ
  const [category, setCategory] = useState<AttendanceNoticeCategory>(defaultCategory);
  const [titleInput, setTitleInput] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 🔄 مزامنة الحالة الأولية عند فتح النافذة
  useEffect(() => {
    if (initialStudent) {
      setTargetScope('single_student');
      setSelectedStudentId(initialStudent.id);
    } else if (initialSelectedStudentIds.length > 0) {
      setTargetScope('selected_students');
      setSelectedStudentIds(initialSelectedStudentIds);
    } else {
      setTargetScope('broadcast');
    }
    setCategory(defaultCategory);
    setIsStudentDropdownOpen(false);
    setStudentSearchQuery('');
  }, [initialStudent, initialSelectedStudentIds, defaultCategory, isOpen]);

  // 📋 مصفوفة فئات التبليغ مع الأيقونات والأسماء
  const categoriesList: { id: AttendanceNoticeCategory; label: string; icon: React.ReactNode; badgeColor: string }[] = [
    { 
      id: 'warning_1', 
      label: 'إنذار غياب أولي (5%)', 
      icon: <AlertTriangle className="w-4 h-4 text-sky-800" />, 
      badgeColor: 'bg-sky-50 text-sky-950 border-sky-300' 
    },
    { 
      id: 'warning_2', 
      label: 'إنذار غياب نهائي (7%)', 
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />, 
      badgeColor: 'bg-rose-50 text-rose-950 border-rose-300' 
    },
    { 
      id: 'banned', 
      label: 'أمر حرمان وتجاوز الغياب (10%)', 
      icon: <Ban className="w-4 h-4 text-red-600" />, 
      badgeColor: 'bg-red-50 text-red-950 border-red-300' 
    },
    { 
      id: 'official_holiday', 
      label: 'عطلة رسمية / تأجيل دوام', 
      icon: <Calendar className="w-4 h-4 text-emerald-600" />, 
      badgeColor: 'bg-emerald-50 text-emerald-950 border-emerald-300' 
    },
    { 
      id: 'exam_schedule', 
      label: 'موعد امتحان فصلي / نهائي', 
      icon: <FileText className="w-4 h-4 text-blue-600" />, 
      badgeColor: 'bg-blue-50 text-blue-950 border-blue-300' 
    },
    { 
      id: 'general_announcement', 
      label: 'تبليغ وتوجيه عام', 
      icon: <BellRing className="w-4 h-4 text-indigo-600" />, 
      badgeColor: 'bg-indigo-50 text-indigo-950 border-indigo-300' 
    },
  ];

  // 📝 توليد القالب التلقائي للنص والعنوان بناءً على الفئة المختارة
  useEffect(() => {
    switch (category) {
      case 'warning_1':
        setTitleInput('إنذار غياب أولي (تجاوز نسبة 5%)');
        setMessageInput(`تحية طيبة.. نسترعي انتباهكم إلى تجاوز نسبة الغياب المسموح بها في المحاضرات ووصولكم إلى مرحلة (الإنذار الأولي 5%). يرجى الالتزام التام بجدول المحاضرات ومراجعة مقررية القسم.`);
        break;
      case 'warning_2':
        setTitleInput('إنذار غياب نهائي ومشدد (تجاوز نسبة 7%)');
        setMessageInput(`تحذير رسمي نهائي.. لقد بلغت نسبة غيابكم في المواد الدراسية (الإنذار النهائي 7%). يرجى الحضور فوراً وتقديم الأعذار الرسمية المبررة تجنباً لإصدار أمر الحرمان الجامعي.`);
        break;
      case 'banned':
        setTitleInput('أمر حرمان رسمي لتجاوز نسبة الغيابات القانونية (10%)');
        setMessageInput(`إشعار حرمان.. بموجب تعليمات انضباط الطلبة وضوابط مسار بولونيا، تم تجاوز نسبة الغياب القانونية (10%)، وسيتم تطبيق عقوبة الرسوب والحرمان من دخول الامتحانات.`);
        break;
      case 'official_holiday':
        setTitleInput('تبليغ بخصوص عطلة رسمية وتعليق الدوام');
        setMessageInput(`نسترعي انتباه طلبتنا الأعزاء في قسم ${departmentName} بأنه تقرر تعطيل الدوام الرسمي للكلية، ويستأنف الدوام وفق الجدول المعلن.`);
        break;
      case 'exam_schedule':
        setTitleInput('تبليغ هام بخصوص مواعيد الامتحانات الأكاديمية');
        setMessageInput(`نود إعلامكم بجدول وتعليمات الامتحانات المقررة لمواد قسم ${departmentName}. يرجى التواجد في القاعات والمختبرات المحددة قبل موعد الامتحان بـ 15 دقيقة.`);
        break;
      case 'general_announcement':
        setTitleInput('إعلان وتوجيه أكاديمي هام');
        setMessageInput(`تحية طيبة طلبتنا الأعزاء.. تود رئاسة قسم ${departmentName} إعلامكم بالتوجيهات والتعليمات الأكاديمية الجديدة لضمان سير العملية التعليمية بنجاح.`);
        break;
    }
  }, [category, departmentName]);

  // 👥 قائمة طلاب القسم المتاحين
  const availableDeptStudents = useMemo(() => {
    return students.filter(
      (s) => s.role === 'student' && (s.department_id === departmentId || s.department_name === departmentName)
    );
  }, [students, departmentId, departmentName]);

  // 🔍 تصفية الطلاب حسب البحث في القائمة المنسدلة
  const filteredAvailableStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return availableDeptStudents;
    const q = studentSearchQuery.trim().toLowerCase();
    return availableDeptStudents.filter(
      (st) =>
        st.full_name.toLowerCase().includes(q) ||
        (st.university_number || '').toLowerCase().includes(q)
    );
  }, [availableDeptStudents, studentSearchQuery]);

  // 👤 كائن الطالب المختار حالياً
  const selectedStudentObj = useMemo(() => {
    return availableDeptStudents.find((st) => st.id === selectedStudentId);
  }, [availableDeptStudents, selectedStudentId]);

  // 👥 استخراج قائمة الطلاب المستهدفين
  const targetStudents = useMemo(() => {
    if (targetScope === 'single_student') {
      return availableDeptStudents.filter((s) => s.id === selectedStudentId);
    }
    if (targetScope === 'selected_students') {
      return availableDeptStudents.filter((s) => selectedStudentIds.includes(s.id));
    }
    if (targetScope === 'broadcast') {
      return availableDeptStudents.filter((s) => {
        if (broadcastStage !== 'all' && (s.stage_number || 1) !== broadcastStage) return false;
        if (broadcastStudyType !== 'all' && (s.study_type || 'morning') !== broadcastStudyType) return false;
        return true;
      });
    }
    return [];
  }, [availableDeptStudents, targetScope, selectedStudentId, selectedStudentIds, broadcastStage, broadcastStudyType]);

  if (!isOpen) return null;

  // 🚀 تنفيذ إرسال التبليغات
  const handleSendNotification = async () => {
    setErrorMsg('');
    if (!titleInput.trim()) {
      setErrorMsg('⚠️ يرجى كتابة عنوان التبليغ أو التنبيه.');
      return;
    }
    if (!messageInput.trim()) {
      setErrorMsg('⚠️ يرجى كتابة نص التبليغ.');
      return;
    }
    if (targetStudents.length === 0) {
      setErrorMsg('⚠️ لا يوجد طلاب يطابقون معايير الاستهداف المحددة.');
      return;
    }

    setIsSending(true);

    try {
      // إرسال الإشعار لكل طالب مستهدف عبر مركز الإشعارات
      targetStudents.forEach((student) => {
        let notifType: 'system_announcement' | 'task_deadline_alert' | 'grade_updated' = 'system_announcement';
        if (category === 'warning_1' || category === 'warning_2' || category === 'banned') {
          notifType = 'task_deadline_alert';
        }

        const finalMsg = dateInput.trim() 
          ? `${messageInput.trim()}\n\nالتاريخ والموعد المحدد: ${dateInput.trim()}`
          : messageInput.trim();

        sendAppNotification({
          recipient_id: student.id,
          recipient_role: 'student',
          title: titleInput.trim(),
          message: finalMsg,
          type: notifType,
          link: '/student/dashboard',
        });
      });

      const summary = `تم بنجاح إرسال (${categoriesList.find((c) => c.id === category)?.label}) إلى (${targetStudents.length}) طالب في قسم ${departmentName}!`;
      if (onNoticeSent) onNoticeSent(summary);
      onClose();
    } catch {
      setErrorMsg('⚠️ حدث خطأ أثناء إرسال التبليغات، يرجى المحاولة مجدداً.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* 🏛️ الهيدر الفاتح للنافذة */}
        <div className="p-5 sm:p-6 bg-white text-slate-900 rounded-t-3xl flex items-center justify-between gap-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2942] text-white rounded-2xl border border-[#1e4570] flex-shrink-0 shadow-sm">
              <Send className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 text-xs sm:text-sm font-black rounded-lg border border-blue-200">
                  مركز التبليغات والإنذارات الأكاديمية
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs sm:text-sm font-black rounded-lg border border-slate-200">
                  قسم {departmentName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-1">
                إرسال تنبيه وتبليغ ذكي للطلبة
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ⚠️ رسائل الخطأ إن وجدت */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-950 font-black text-sm rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-5 text-slate-950 font-black text-base flex-1 overflow-y-auto">
          
          {/* 🎯 1. اختيار نطاق الاستهداف */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">نطاق المستلمين:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setTargetScope('single_student')}
                className={`py-2.5 px-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  targetScope === 'single_student'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-950 hover:bg-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>طالب مفرد</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('selected_students')}
                className={`py-2.5 px-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  targetScope === 'selected_students'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-950 hover:bg-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>الطلاب المحددون ({selectedStudentIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('broadcast')}
                className={`py-2.5 px-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  targetScope === 'broadcast'
                    ? 'bg-[#0F2942] text-white shadow-xs'
                    : 'text-slate-950 hover:bg-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>تبليغ عام للمرحلة / القسم</span>
              </button>
            </div>
          </div>

          {/* 🎛️ إذا كان الاختيار لطالب مفرد - القائمة المنسدلة المخصصة الفاخرة مع البحث */}
          {targetScope === 'single_student' && (
            <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <label className="block text-slate-950 font-black text-sm">اختر الطالب المستهدف:</label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-950 font-black text-sm sm:text-base flex items-center justify-between gap-3 transition cursor-pointer shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
                >
                  {selectedStudentObj ? (
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-[#0F2942] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedStudentObj.full_name.charAt(0)}
                      </div>
                      <div className="text-right truncate">
                        <div className="font-black text-slate-950 text-sm sm:text-base leading-tight truncate">
                          {selectedStudentObj.full_name}
                        </div>
                        <div className="text-xs font-mono text-slate-950 font-black flex items-center gap-1.5 mt-0.5">
                          <span>المرحلة {selectedStudentObj.stage_number === 1 ? 'الأولى' : selectedStudentObj.stage_number === 2 ? 'الثانية' : selectedStudentObj.stage_number === 3 ? 'الثالثة' : selectedStudentObj.stage_number === 4 ? 'الرابعة' : selectedStudentObj.stage_number || 1}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5">
                            {(selectedStudentObj.study_type || 'morning') === 'evening' ? (
                              <Moon className="w-3 h-3 text-indigo-600" />
                            ) : (
                              <Sun className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{(selectedStudentObj.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-black text-sm sm:text-base">-- اختر طالباً من القائمة --</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-950 shrink-0 transition-transform duration-200 ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStudentDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsStudentDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-full bg-white border border-slate-300 rounded-2xl shadow-2xl z-40 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
                      {/* شريط البحث المباشر للطلاب */}
                      <div className="relative shrink-0">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="بحث باسم الطالب..."
                          className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-950 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F2942]"
                          autoFocus
                        />
                      </div>

                      {/* قائمة الطلاب القابلة للتمرير */}
                      <div className="overflow-y-auto space-y-1 flex-1 pr-0.5">
                        {filteredAvailableStudents.length > 0 ? (
                          filteredAvailableStudents.map((st) => {
                            const isSelected = st.id === selectedStudentId;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(st.id);
                                  setIsStudentDropdownOpen(false);
                                  setStudentSearchQuery('');
                                }}
                                className={`w-full p-2.5 rounded-xl text-right transition cursor-pointer flex items-center justify-between gap-2.5 ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white shadow-xs'
                                    : 'hover:bg-slate-100 text-slate-950'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {st.full_name.charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className={`font-black text-sm truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                      {st.full_name}
                                    </div>
                                    <div className={`text-xs font-mono font-black flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-cyan-200' : 'text-slate-950'}`}>
                                      <span>المرحلة {st.stage_number === 1 ? 'الأولى' : st.stage_number === 2 ? 'الثانية' : st.stage_number === 3 ? 'الثالثة' : st.stage_number === 4 ? 'الرابعة' : st.stage_number || 1}</span>
                                      <span>•</span>
                                      <span className="inline-flex items-center gap-0.5">
                                        {(st.study_type || 'morning') === 'evening' ? (
                                          <Moon className="w-3 h-3 text-indigo-400" />
                                        ) : (
                                          <Sun className="w-3 h-3 text-emerald-400" />
                                        )}
                                        <span>{(st.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {isSelected && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs font-black text-slate-950">
                            لا يوجد طلاب يطابقون عبارة البحث
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* إذا كان الاختيار تبليغاً عاماً: اختيار المرحلة والفترة في سطر واحد وبتصميم أنيق */}
          {targetScope === 'broadcast' && (
            <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                
                {/* اختيار المرحلة - كافة المراحل، الأولى، الثانية، الثالثة، الرابعة بسطر واحد */}
                <div className="lg:col-span-7 space-y-2">
                  <label className="block text-slate-950 font-black text-sm flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <span>المرحلة المستهدفة:</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 w-full bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setBroadcastStage('all')}
                      className={`w-full py-2 px-1 text-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        broadcastStage === 'all'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-950 hover:bg-white'
                      }`}
                    >
                      كافة المراحل
                    </button>
                    {([
                      { id: 1, label: 'المرحلة الأولى' },
                      { id: 2, label: 'المرحلة الثانية' },
                      { id: 3, label: 'المرحلة الثالثة' },
                      { id: 4, label: 'المرحلة الرابعة' },
                    ] as const).map((stg) => (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => setBroadcastStage(stg.id)}
                        className={`w-full py-2 px-1 text-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                          broadcastStage === stg.id
                            ? 'bg-[#0F2942] text-white shadow-xs'
                            : 'text-slate-950 hover:bg-white'
                        }`}
                      >
                        {stg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* اختيار الفترة - كافة الفترات، الصباحي، المسائي بسطر واحد */}
                <div className="lg:col-span-5 space-y-2">
                  <label className="block text-slate-950 font-black text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-700" />
                    <span>الفترة الدراسية:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 w-full bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setBroadcastStudyType('all')}
                      className={`w-full py-2 px-1 text-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                        broadcastStudyType === 'all'
                          ? 'bg-[#0F2942] text-white shadow-xs'
                          : 'text-slate-950 hover:bg-white'
                      }`}
                    >
                      كافة الفترات
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastStudyType('morning')}
                      className={`w-full py-2 px-1 text-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        broadcastStudyType === 'morning'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'text-slate-950 hover:bg-white border-transparent'
                      }`}
                    >
                      <Sun className="w-4 h-4 shrink-0" />
                      <span>الصباحي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastStudyType('evening')}
                      className={`w-full py-2 px-1 text-center justify-center rounded-xl text-xs sm:text-sm font-black transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                        broadcastStudyType === 'evening'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'text-slate-950 hover:bg-white border-transparent'
                      }`}
                    >
                      <Moon className="w-4 h-4 shrink-0" />
                      <span>المسائي</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 🏷️ 2. اختيار نوع وفئة التبليغ */}
          <div className="space-y-2">
            <label className="block text-slate-950 font-black text-base">نوع التبليغ والإنذار:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2.5 cursor-pointer text-right border ${
                    category === cat.id
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-sm'
                      : `${cat.badgeColor} hover:bg-white hover:border-slate-400`
                  }`}
                >
                  <div className="shrink-0">{cat.icon}</div>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ✍️ 3. عنوان ونص التبليغ والتاريخ */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-slate-950 font-black text-base">عنوان التبليغ الرسمي:</label>
              <input
                type="text"
                required
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
                placeholder="عنوان التبليغ..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-slate-950 font-black text-base">نص التبليغ والتوجيه الأكاديمي:</label>
              <textarea
                rows={4}
                required
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 leading-relaxed"
                placeholder="اكتب تفاصيل التبليغ والتوجيه..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-slate-950 font-black text-base">تاريخ السريان أو الموعد المحدد (اختياري):</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-950 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
              />
            </div>
          </div>

          {/* 👁️ معاينة المستلمين */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <span className="font-black text-blue-950 text-base">
                إجمالي الطلاب المستهدفين بالاستلام: <strong className="font-mono text-lg">{targetStudents.length}</strong> طالب
              </span>
            </div>
            <span className="px-2.5 py-1 bg-white text-blue-900 border border-blue-300 rounded-xl text-xs font-black flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-blue-700" />
              <span>يصل فورياً للوحة الطالب</span>
            </span>
          </div>

        </div>

        {/* 🔘 أزرار الحفظ والإرسال والإلغاء */}
        <div className="p-5 sm:p-6 bg-slate-50 rounded-b-3xl border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black text-base rounded-2xl transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={isSending || targetStudents.length === 0}
            onClick={handleSendNotification}
            className="px-7 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-base rounded-2xl transition shadow-md flex items-center gap-2 cursor-pointer border border-[#1e4570] disabled:opacity-50 active:scale-95"
          >
            {isSending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Send className="w-5 h-5 text-cyan-300" />
            )}
            <span>تأكيد وإرسال التبليغ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
