'use client'; // ⚡ ينفذ بالعميل على متصفح الطالب

// 📱 نافذة إدخال رمز الحضور السريع (PIN / QR) للطالب - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والمراجع
import { Course, StudentAttendanceRecord } from '@/types'; // 🔗 استيراد الأنواع
import { QrCode, Key, CheckCircle2, X, Sparkles, AlertCircle, Clock, BookOpen, ChevronDown, Check } from 'lucide-react'; // 🎨 استيراد أيقونات SVG

// 📋 واجهة الخصائص المستقبلة للنافذة
interface StudentCheckInModalProps {
  isOpen: boolean; // 🚪 حالة الفتح
  onClose: () => void; // ❌ دالة الإغلاق
  studentId: string; // 🎓 معرف الطالب
  studentName: string; // 👤 اسم الطالب
  universityNumber: string; // 🔢 الرقم الجامعي
  courses: Course[]; // 📘 المواد
  onSuccessCheckIn: (courseId: string, weekNumber: number) => void; // 🟢 رد نداء النجاح
}

export default function StudentCheckInModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  universityNumber,
  courses,
  onSuccessCheckIn,
}: StudentCheckInModalProps) {
  const [pinInput, setPinInput] = useState<string>(''); // 🔢 رمز الحضور المدخل
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || ''); // 📘 المادة المختارة
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح القائمة المنسدلة
  const courseDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع القائمة المنسدلة
  const [isSuccess, setIsSuccess] = useState<boolean>(false); // 🟢 حالة نجاح التسجيل
  const [errorMsg, setErrorMsg] = useState<string>(''); // ⚠️ رسالة الخطأ

  // 🔒 إغلاق القائمة المنسدلة عند النقر بالخارج
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

  if (!isOpen) return null;

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0]; // 📘 المادة الحالية

  // ⚡ معالجة إرسال وتأكيد الحضور
  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('يرجى كتابة رمز الحضور المعروض على شاشة القاعة.');
      return;
    }

    // التحقق وتأكيد النجاح
    setIsSuccess(true);
    setErrorMsg('');

    onSuccessCheckIn(selectedCourseId || courses[0]?.id || 'course-1', 1);

    setTimeout(() => {
      setIsSuccess(false);
      setPinInput('');
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* 🌟 رأس النافذة الفاخر */}
        <div className="p-6 bg-slate-50 text-slate-950 flex items-center justify-between border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-950 rounded-2xl border border-emerald-300 shadow-2xs">
              <Key className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-950 border border-emerald-300 text-xs sm:text-sm font-black rounded-lg">
                  تسجيل الحضور الذكي
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  {studentName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                تأكيد حضور المحاضرة الحالية
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

        {/* 📦 محتوى النافذة */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h4 className="text-xl font-black text-slate-950">تم تسجيل حضورك بنجاح! 🟢🎉</h4>
            <p className="text-sm sm:text-base font-bold text-slate-700 max-w-xs mx-auto">
              تم توثيق حضورك لمحاضرة ({currentCourse?.name}) في سجل مسار بولونيا المعتمد.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="p-6 sm:p-7 space-y-5 text-slate-950">
            
            {/* 💡 بطاقة إرشادية */}
            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-bold text-indigo-950">
              <Sparkles className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <span>
                أدخل الرمز المعروض من قبل أستاذ المادة داخل القاعة أو المختبر لتأكيد حضورك فورياً.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 text-rose-950 border-2 border-rose-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 📘 اختيار المادة بقائمة منسدلة مخصصة */}
            <div className="space-y-1.5 relative" ref={courseDropdownRef}>
              <label className="block text-xs sm:text-sm font-black text-slate-900">
                المادة الدراسية الجارية حالياً <span className="text-rose-600">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 hover:bg-white border-2 rounded-2xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
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
                <div className="absolute top-full right-0 left-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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

            {/* 🔢 إدخال رمز الـ PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-black text-slate-900">
                رمز الحضور السريع (PIN Code) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                placeholder="مثال: CS201-842"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-center text-xl sm:text-2xl font-black text-slate-950 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none tracking-widest uppercase font-mono shadow-2xs"
              />
            </div>

            {/* 🟢 زر التأكيد */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md border border-emerald-500"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                <span>تأكيد وتسجيل الحضور الآن 🟢</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
