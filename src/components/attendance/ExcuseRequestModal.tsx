'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📑 نافذة تقديم طلب إجازة وعذر رسمي إلكترونياً من الطالب لمسار بولونيا - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والمراجع ودورة الحياة
import { Course, AttendanceExcuseRequest, ExcuseReasonType } from '@/types'; // 🔗 استيراد الأنواع الرسمية
import {
  FileText,
  Send,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  HeartPulse,
  Building,
  Users,
  Calendar,
  BookOpen,
  ChevronDown,
  Check,
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG عالية الدقة
import { BOLOGNA_SEMESTER_WEEKS } from '@/lib/attendance-utils'; // 📅 أسابيع بولونيا الـ 15
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات

// 📋 واجهة الخصائص المستقبلة لنافذة تقديم الإجازة
interface ExcuseRequestModalProps {
  isOpen: boolean; // 🚪 حالة الفتح
  onClose: () => void; // ❌ دالة الإغلاق
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  departmentId: string; // 🏢 معرف القسم
  stageNumber: number; // 🎓 رقم المرحلة
  courses: Course[]; // 📘 قائمة المواد الدراسية
  onSubmitExcuse: (request: AttendanceExcuseRequest) => void; // 💾 دالة الحفظ
}

// 🎯 قائمة أنواع وتصنيفات الأعذار الرسمية مع الأيقونات والأسماء
const EXCUSE_REASON_OPTIONS: { key: ExcuseReasonType; label_ar: string; icon: typeof HeartPulse }[] = [
  { key: 'medical', label_ar: 'إجازة مرضية / تقرير طبي معتمد', icon: HeartPulse },
  { key: 'official_duty', label_ar: 'مهمة رسمية / إيفاد ونشاط جامعي', icon: Building },
  { key: 'family_emergency', label_ar: 'ظرف عائلي قاهر وطارئ', icon: Users },
  { key: 'bereavement', label_ar: 'حالة وفاة من الدرجة الأولى', icon: ShieldCheck },
  { key: 'other', label_ar: 'عذر رسمي آخر مصدق', icon: FileText },
];

export default function ExcuseRequestModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  universityNumber,
  departmentId,
  stageNumber,
  courses,
  onSubmitExcuse,
}: ExcuseRequestModalProps) {
  // 📌 1. حقول النموذج
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [lectureDate, setLectureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reasonType, setReasonType] = useState<ExcuseReasonType>('medical');
  const [reasonDetails, setReasonDetails] = useState<string>('');
  const [documentRef, setDocumentRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successSent, setSuccessSent] = useState<boolean>(false);

  // 🔽 2. حالات القوائم المنسدلة الاحترافية المخصصة
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false); // 📘 قائمة المادة
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState<boolean>(false); // 🗓️ قائمة الأسبوع
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState<boolean>(false); // 🏷️ قائمة نوع العذر
  const courseDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة المادة
  const weekDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة الأسبوع
  const reasonDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة نوع العذر

  // 🔒 3. إغلاق القوائم عند النقر بالخارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
      if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(event.target as Node)) {
        setIsReasonDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const currentReasonConfig = EXCUSE_REASON_OPTIONS.find((r) => r.key === reasonType) || EXCUSE_REASON_OPTIONS[0];
  const ReasonIcon = currentReasonConfig.icon;

  // 🚀 4. إرسال وتوثيق الطلب
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails.trim()) return;

    setIsSubmitting(true);

    const newRequest: AttendanceExcuseRequest = {
      id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student_id: studentId,
      student_name: studentName,
      university_number: universityNumber,
      department_id: departmentId,
      stage_number: stageNumber,
      course_id: currentCourse?.id || 'course-1',
      course_name: currentCourse?.name || 'المادة الدراسية',
      course_code: currentCourse?.code || 'CRS',
      week_number: selectedWeek,
      date: lectureDate,
      reason_type: reasonType,
      reason_details: reasonDetails.trim(),
      document_reference: documentRef.trim() || 'كتاب / تقرير طبي رسمي قيد المراجعة',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // 💾 حفظ الطلب
    onSubmitExcuse(newRequest);

    // 🔔 إرسال إشعار فوري لأستاذ المادة ورئاسة القسم
    sendAppNotification({
      recipient_id: currentCourse?.theory_teacher_id || 'all',
      recipient_role: 'teacher',
      title: `📑 طلب إجازة رسمي جديد من الطالب (${studentName})`,
      message: `قدم الطالب (${studentName}) طلب إجازة وعذر رسمي لمادة (${currentCourse?.name}) للأسبوع (${selectedWeek}).`,
      type: 'system_announcement',
      link: `/teacher/courses/${currentCourse?.id}`,
    });

    setIsSubmitting(false);
    setSuccessSent(true);

    setTimeout(() => {
      setSuccessSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 🌟 رأس النافذة الفاخر */}
        <div className="p-6 bg-slate-50 text-slate-950 flex items-center justify-between border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-950 rounded-2xl border border-indigo-300 shadow-2xs">
              <FileText className="w-6 h-6 text-indigo-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-300 text-xs sm:text-sm font-black rounded-lg">
                  طلب رسمي إلكتروني
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  المرحلة {stageNumber === 1 ? 'الأولى' : stageNumber === 2 ? 'الثانية' : stageNumber === 3 ? 'الثالثة' : stageNumber === 4 ? 'الرابعة' : stageNumber}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                تقديم عذر أو إجازة رسمية لمسار بولونيا
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-200 text-slate-700 hover:text-black hover:bg-slate-300 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 📦 محتوى النموذج */}
        {successSent ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h4 className="text-xl font-black text-slate-950">تم إرسال طلب الإجازة بنجاح! 🚀</h4>
            <p className="text-sm sm:text-base font-bold text-slate-700 max-w-sm mx-auto">
              تم توجيه طلبك إلى أستاذ المادة ورئاسة القسم للمراجعة والاعتماد وتحديث سجل الحضور فوراً.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-slate-950">
            
            <div className="p-6 sm:p-7 overflow-y-auto overscroll-contain space-y-4 flex-1">
              {/* 💡 بطاقة إرشادية */}
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-bold text-indigo-950">
                <Sparkles className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <span>
                  وفق ضوابط مسار بولونيا، يتم احتساب الإجازة الرسمية المعتمدة لرفع الإنذارات الأكاديمية وإعادة احتساب نسبة الحضور.
                </span>
              </div>

              {/* 1. اختيار المادة الدراسية والأسبوع بقوائم منسدلة مخصصة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 📘 المادة الدراسية */}
                <div className="space-y-1.5 relative" ref={courseDropdownRef}>
                  <label className="block text-xs sm:text-sm font-black text-slate-900">
                    المادة الدراسية المعنية <span className="text-rose-600">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCourseDropdownOpen(!isCourseDropdownOpen);
                      setIsWeekDropdownOpen(false);
                      setIsReasonDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-2xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                      isCourseDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="truncate">{currentCourse ? `${currentCourse.name} (${currentCourse.code})` : 'اختر المادة'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isCourseDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                  </button>

                  {isCourseDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {courses.map((c) => {
                        const isSel = (selectedCourseId || courses[0]?.id) === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(c.id);
                              setIsCourseDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{c.name} ({c.code})</span>
                            {isSel && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 🗓️ الأسبوع الدراسي */}
                <div className="space-y-1.5 relative" ref={weekDropdownRef}>
                  <label className="block text-xs sm:text-sm font-black text-slate-900">
                    الأسبوع الدراسي <span className="text-rose-600">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsWeekDropdownOpen(!isWeekDropdownOpen);
                      setIsCourseDropdownOpen(false);
                      setIsReasonDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-2xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                      isWeekDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>الأسبوع {selectedWeek}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isWeekDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                  </button>

                  {isWeekDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {BOLOGNA_SEMESTER_WEEKS.map((w) => {
                        const isSel = selectedWeek === w.week;
                        return (
                          <button
                            key={w.week}
                            type="button"
                            onClick={() => {
                              setSelectedWeek(w.week);
                              setIsWeekDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <span>{w.label_ar}</span>
                            {isSel && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* 2. تاريخ المحاضرة ونوع العذر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 📅 تاريخ المحاضرة */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-black text-slate-900">
                    تاريخ المحاضرة <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={lectureDate}
                    onChange={(e) => setLectureDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-black text-slate-950 focus:border-[#0F2942] focus:outline-none font-mono shadow-2xs"
                  />
                </div>

                {/* 🏷️ نوع وتصنيف العذر */}
                <div className="space-y-1.5 relative" ref={reasonDropdownRef}>
                  <label className="block text-xs sm:text-sm font-black text-slate-900">
                    نوع وتصنيف العذر <span className="text-rose-600">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsReasonDropdownOpen(!isReasonDropdownOpen);
                      setIsCourseDropdownOpen(false);
                      setIsWeekDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-2xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
                      isReasonDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ReasonIcon className="w-4 h-4 text-rose-700 shrink-0" />
                      <span className="truncate">{currentReasonConfig.label_ar}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isReasonDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
                  </button>

                  {isReasonDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {EXCUSE_REASON_OPTIONS.map((r) => {
                        const isSel = reasonType === r.key;
                        const Icon = r.icon;
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => {
                              setReasonType(r.key);
                              setIsReasonDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                              isSel ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon className={`w-4 h-4 ${isSel ? 'text-cyan-300' : 'text-rose-700'}`} />
                              <span className="truncate">{r.label_ar}</span>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* 3. رقم وتاريخ المرجع الطبي أو الكتاب الرسمي */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-900">
                  رقم وتاريخ التقرير الطبي أو الكتاب الرسمي المعتمد
                </label>
                <input
                  type="text"
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  placeholder="مثال: تقرير صحة ميسان رقم 442 في 2026/09/02"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-black text-slate-950 placeholder:text-slate-400 focus:border-[#0F2942] focus:outline-none shadow-2xs"
                />
              </div>

              {/* 4. تفاصيل وشرح العذر */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-black text-slate-900">
                  شرح وتفاصيل سبب الغياب <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  rows={3}
                  required
                  placeholder="اكتب شرحاً موجزاً لسبب الغياب وتاريخه ليتم تدقيقه من قبل أستاذ المادة واللجنة العلمية..."
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-black text-slate-950 placeholder:text-slate-400 focus:border-[#0F2942] focus:outline-none resize-none shadow-2xs"
                />
              </div>

            </div>

            {/* 🟢 شريط أزرار التأكيد والإلغاء في الأسفل */}
            <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !reasonDetails.trim()}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-md border border-[#1e4570] disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-cyan-300" />
                <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الإجازة 🚀'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
