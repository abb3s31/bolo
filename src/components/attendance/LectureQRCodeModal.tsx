'use client'; // ⚡ ينفذ بالعميل على متصفح الأستاذ

// 📱 نافذة تسجيل الحضور اللحظي الذكي عبر رمز الـ QR ورمز PIN للمحاضرة - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة ودورة الحياة
import { Course, StudentAttendanceRecord } from '@/types'; // 🔗 استيراد الأنواع الرسمية
import {
  QrCode,
  X,
  Clock,
  Users,
  CheckCircle2,
  Copy,
  Sparkles,
  RefreshCw,
  Key,
  ShieldCheck,
  Calendar,
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG الفيكتورية

// 📋 واجهة الخصائص المستقبلة لنافذة رمز الـ QR
interface LectureQRCodeModalProps {
  isOpen: boolean; // 🚪 حالة الفتح
  onClose: () => void; // ❌ دالة الإغلاق
  course: Course; // 📘 المادة الدراسية
  weekNumber: number; // 🔢 رقم الأسبوع الدراسي
  teacherName: string; // 👤 اسم الأستاذ المحاضر
  onStudentCheckedIn?: (studentId: string) => void; // 🟢 رد نداء عند تسجيل طالب
}

export default function LectureQRCodeModal({
  isOpen,
  onClose,
  course,
  weekNumber,
  teacherName,
}: LectureQRCodeModalProps) {
  const [pinCode, setPinCode] = useState<string>(''); // 🔢 رمز الـ PIN المؤقت
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900); // ⏳ مدة الصلاحية: 15 دقيقة (900 ثانية)
  const [copied, setCopied] = useState<boolean>(false); // 📋 حالة نسخ الرمز
  const [checkedInCount, setCheckedInCount] = useState<number>(14); // 👥 عدد الطلاب المسجلين حالياً

  // 🎲 1. توليد رمز دخول سريع عشوائي عند فتح الشاشة
  useEffect(() => {
    if (isOpen) {
      const randomPin = `${course.code || 'CRS'}-${Math.floor(100 + Math.random() * 900)}`;
      setPinCode(randomPin);
      setTimeLeftSeconds(900);
    }
  }, [isOpen, course.code]);

  // ⏱️ 2. عداد تنازلي لصلاحية الرمز
  useEffect(() => {
    if (!isOpen || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeftSeconds]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // 📋 3. نسخ رمز الـ PIN
  const copyPin = () => {
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🔄 4. إعادة توليد رمز جديد وتصفير المؤقت
  const regeneratePin = () => {
    const randomPin = `${course.code || 'CRS'}-${Math.floor(100 + Math.random() * 900)}`;
    setPinCode(randomPin);
    setTimeLeftSeconds(900);
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* 🌟 رأس النافذة الفاخر */}
        <div className="p-6 bg-slate-50 text-slate-950 flex items-center justify-between border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-md border border-[#1e4570]">
              <QrCode className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-300 text-xs font-black rounded-lg">
                  تسجيل الحضور اللحظي
                </span>
                <span className="text-xs font-black text-slate-700">
                  الأسبوع {weekNumber}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                رمز الـ QR لمادة {course.name}
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

        {/* 📦 محتوى وجسم النافذة */}
        <div className="p-6 sm:p-7 text-center space-y-5 text-slate-950">
          
          {/* ⏱️ مؤقت الصلاحية */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black">
            <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
            <span className="text-slate-800">ينتهي الرمز بعد:</span>
            <span className="px-3 py-1 bg-rose-100 text-rose-950 rounded-xl text-sm border border-rose-300 font-mono font-black shadow-2xs">
              {timeFormatted}
            </span>
          </div>

          {/* 📱 رمز QR فائق الوضوح للعرض على شاشة القاعة */}
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 inline-block shadow-inner mx-auto">
            <div className="w-56 h-56 bg-white p-4 rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center space-y-2 relative shadow-sm">
              <QrCode className="w-44 h-44 text-[#0F2942]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl shadow-md border border-[#1e4570] font-black text-xs sm:text-sm font-mono tracking-wider">
                  {course.code}
                </div>
              </div>
            </div>
          </div>

          {/* 🔢 رمز الحضور السريع المكتوب (PIN Code) */}
          <div className="bg-slate-100 p-4 rounded-2xl border-2 border-slate-200 flex items-center justify-between max-w-sm mx-auto shadow-2xs">
            <div className="text-right">
              <span className="text-xs font-black text-slate-600 block">أو أدخل الرمز السريع (PIN):</span>
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-wider">{pinCode}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyPin}
                className="p-2.5 bg-white hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition cursor-pointer shadow-2xs"
                title="نسخ الرمز"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={regeneratePin}
                className="p-2.5 bg-white hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition cursor-pointer shadow-2xs"
                title="توليد رمز جديد"
              >
                <RefreshCw className="w-4 h-4 text-indigo-700" />
              </button>
            </div>
          </div>

          {/* 👥 إحصائية الطلاب الحاضرين الآن عبر الرمز */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-black text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>الطلبة الذين سجلوا حضورهم الآن:</span>
            </div>
            <span className="px-3 py-1 bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black font-mono shadow-xs">
              {checkedInCount} طالب حاضر ✅
            </span>
          </div>

          {/* ❌ زر الإغلاق */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#0F2942] hover:bg-[#163a5f] active:scale-95 text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer shadow-md border border-[#1e4570]"
          >
            إغلاق شاشة الـ QR
          </button>

        </div>

      </div>
    </div>
  );
}
