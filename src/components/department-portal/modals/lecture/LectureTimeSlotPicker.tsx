'use client'; // ⚡ واجهة تفاعلية تعمل بمتصفح العميل

// 🕒 مكون منتقي التوقيت الأكاديمي (وقت البدء والانتهاء) بنظام 12/24 ساعة والحساب التلقائي للمدة
// 🇮🇶 توثيق عراقي سطر بسطر مع التزام نمطي صارم بدون any أو unknown

import React, { useState, useRef, useEffect } from 'react'; // ⚛️ استيراد خطافات ريآكت الأساسية
import { createPortal } from 'react-dom'; // 🌐 بورتال لعرض القائمة المنسدلة فوق عناصر الواجهة
import {
  Clock, // 🕒 أيقونة الوقت والتوقيت
  ChevronDown, // 🔽 أيقونة القائمة المنسدلة
  Sun, // ☀️ أيقونة صباحاً
  Moon, // 🌙 أيقونة مساءً
  RotateCcw, // 🔄 أيقونة التراجع وإلغاء التحديد
  X, // ❌ أيقونة إغلاق القائمة
} from 'lucide-react'; // 🎨 استيراد أيقونات لوسيد
import type { LectureType } from '@/types'; // 🔬 نوع المحاضرة (نظري أو عملي)
import { calculateSmartDropdownPosition, type SmartDropdownPosition } from '../../dropdownUtils'; // 📐 حساب الموضع الذكي

// 📋 واجهة خصائص مكون منتقي توقيت المحاضرة
export interface LectureTimeSlotPickerProps {
  lecStartTime: string; // ⏰ وقت البدء بصيغة HH:mm (24 ساعة)
  setLecStartTime: (time: string) => void; // 🔄 دالة تحديث وقت البدء
  lecEndTime: string; // ⏰ وقت الانتهاء بصيغة HH:mm (24 ساعة)
  setLecEndTime: (time: string) => void; // 🔄 دالة تحديث وقت الانتهاء
  lecType: LectureType | ''; // 🔬 نوع المحاضرة لحساب المدة التلقائية
  lecStudyType: 'morning' | 'evening'; // ☀️🌙 نوع الدراسة الافتراضي
}

// 🧮 تحويل صيغة 24 ساعة إلى 12 ساعة بنظام العرض العراقي
export const parseTime24To12 = (time24: string) => {
  if (!time24 || !time24.includes(':')) {
    return {
      hour12: 8,
      minute: '00',
      period: 'AM' as const,
      periodArabic: 'صباحاً',
      displayFull: '--:--',
      time24: '',
      hourDisplay: '08',
      isEmpty: true,
    };
  }

  const [hRaw, mRaw] = time24.split(':');
  let h = parseInt(hRaw || '8', 10);
  const m = mRaw || '00';

  const period: 'AM' | 'PM' = (h >= 12 || (h >= 1 && h <= 7)) ? 'PM' : 'AM';
  let h12 = h;
  if (h === 0) h12 = 12;
  else if (h > 12 && h <= 23) h12 = h - 12;
  else if (h >= 1 && h <= 7) h12 = h;

  const hDisplay = String(h12).padStart(2, '0');
  const periodArabic = period === 'AM' ? 'صباحاً' : 'مساءً';

  return {
    hour12: h12,
    minute: m,
    period,
    periodArabic,
    displayFull: `${hDisplay}:${m} ${periodArabic}`,
    time24,
    hourDisplay: hDisplay,
    isEmpty: false,
  };
};

// 🧮 تحويل صيغة 12 ساعة إلى 24 ساعة للتخزين الرسمي
export const format12To24 = (hour12: number, minute: string, period: 'AM' | 'PM'): string => {
  let h24 = hour12;
  if (period === 'AM') {
    if (h24 === 12) h24 = 0;
  } else {
    if (h24 >= 1 && h24 <= 11) h24 += 12;
  }
  const hStr = String(h24).padStart(2, '0');
  const mStr = String(minute).padStart(2, '0');
  return `${hStr}:${mStr}`;
};

// 🧮 احتساب وقت الانتهاء تلقائياً من وقت البدء (ساعة للعملي وساعة ونصف للنظري)
export const calculateEndTimeFromStart = (startTime: string, type: LectureType | ''): string => {
  if (!startTime || !startTime.includes(':')) return '';
  const [hStr, mStr] = startTime.split(':');
  const startH = parseInt(hStr || '0', 10);
  const startM = parseInt(mStr || '0', 10);
  const totalStartMinutes = startH * 60 + startM;
  const durationMinutes = type === 'practical' ? 60 : 90;
  const totalEndMinutes = totalStartMinutes + durationMinutes;

  if (totalEndMinutes >= 24 * 60) return '';
  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

// 🏛️ مكون منتقي أوقات البدء والانتهاء
export const LectureTimeSlotPicker: React.FC<LectureTimeSlotPickerProps> = ({
  lecStartTime, // ⏰ وقت البدء
  setLecStartTime, // 🔄 تحديث البدء
  lecEndTime, // ⏰ وقت الانتهاء
  setLecEndTime, // 🔄 تحديث الانتهاء
  lecType, // 🔬 نوع المحاضرة
  lecStudyType, // ☀️🌙 نوع الدراسة
}) => {
  // 🔘 حالات فتح وإغلاق قوائم التوقيت
  const [isLecStartTimeDropdownOpen, setIsLecStartTimeDropdownOpen] = useState<boolean>(false); // ⏰ قائمة وقت البدء
  const [isLecEndTimeDropdownOpen, setIsLecEndTimeDropdownOpen] = useState<boolean>(false); // ⏰ قائمة وقت الانتهاء

  // 📐 إحداثيات ومواقع القوائم الذكية
  const [lecStartTimeCoords, setLecStartTimeCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات البدء
  const [lecEndTimeCoords, setLecEndTimeCoords] = useState<SmartDropdownPosition | null>(null); // 📐 إحداثيات الانتهاء

  // 🔘 مراجع الأزرار لحساب الموقع الهندسي
  const lecStartTimeButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 زر وقت البدء
  const lecEndTimeButtonRef = useRef<HTMLButtonElement | null>(null); // 🔘 زر وقت الانتهاء

  // 🔽 دالة فتح وإغلاق قائمة وقت البدء
  const handleToggleLecStartTimeDropdown = () => {
    if (!isLecStartTimeDropdownOpen && lecStartTimeButtonRef.current) {
      setLecStartTimeCoords(calculateSmartDropdownPosition(lecStartTimeButtonRef.current, 360));
      setIsLecStartTimeDropdownOpen(true);
      setIsLecEndTimeDropdownOpen(false);
    } else {
      setIsLecStartTimeDropdownOpen(false);
    }
  };

  // 🔽 دالة فتح وإغلاق قائمة وقت الانتهاء
  const handleToggleLecEndTimeDropdown = () => {
    if (!isLecEndTimeDropdownOpen && lecEndTimeButtonRef.current) {
      setLecEndTimeCoords(calculateSmartDropdownPosition(lecEndTimeButtonRef.current, 360));
      setIsLecEndTimeDropdownOpen(true);
      setIsLecStartTimeDropdownOpen(false);
    } else {
      setIsLecEndTimeDropdownOpen(false);
    }
  };

  // 🔄 إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleCloseDropdowns = () => {
      setIsLecStartTimeDropdownOpen(false);
      setIsLecEndTimeDropdownOpen(false);
    };

    if (isLecStartTimeDropdownOpen || isLecEndTimeDropdownOpen) {
      window.addEventListener('resize', handleCloseDropdowns);
      window.addEventListener('scroll', handleCloseDropdowns, true);
    }

    return () => {
      window.removeEventListener('resize', handleCloseDropdowns);
      window.removeEventListener('scroll', handleCloseDropdowns, true);
    };
  }, [isLecStartTimeDropdownOpen, isLecEndTimeDropdownOpen]);

  // 🕒 نافذة منتقي التوقيت المخصص
  const renderCustomTimePickerDropdown = (
    coords: SmartDropdownPosition | null,
    title: string,
    currentTime24: string,
    onTimeChange: (newTime: string) => void,
    onClose: () => void,
    _currentStudyType?: 'morning' | 'evening'
  ) => {
    if (!coords) return null;
    const parsed = parseTime24To12(currentTime24);
    const hoursList = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
    const minutesList = ['00', '15', '30', '45', '10', '20', '40', '50'];
    const currentHour12 = parsed.isEmpty ? 8 : parsed.hour12;
    const currentMin = parsed.isEmpty ? '30' : parsed.minute;
    const currentPeriod: 'AM' | 'PM' = parsed.isEmpty ? (_currentStudyType === 'evening' ? 'PM' : 'AM') : parsed.period;

    const handleHourSelect = (h12: number) => {
      let autoPeriod: 'AM' | 'PM' = currentPeriod;
      if (_currentStudyType === 'evening') {
        autoPeriod = 'PM';
      } else {
        if (h12 === 12 || (h12 >= 1 && h12 <= 7)) {
          autoPeriod = 'PM';
        } else if (h12 >= 8 && h12 <= 11) {
          autoPeriod = 'AM';
        }
      }
      const newTime24 = format12To24(h12, currentMin, autoPeriod);
      onTimeChange(newTime24);
    };

    const handleMinuteSelect = (min: string) => {
      const newTime24 = format12To24(currentHour12, min, currentPeriod);
      onTimeChange(newTime24);
    };

    const handlePeriodSelect = (p: 'AM' | 'PM') => {
      const newTime24 = format12To24(currentHour12, currentMin, p);
      onTimeChange(newTime24);
    };

    return (
      <div
        style={{
          position: 'fixed',
          ...(coords.openUpwards
            ? { bottom: `${coords.bottom}px` }
            : { top: `${coords.top}px` }),
          left: `${coords.left}px`,
          width: `${coords.width}px`,
          maxHeight: `${coords.maxHeight || 340}px`,
        }}
        className="bg-white border-2 border-[#0F2942] rounded-3xl shadow-2xl z-[999999] p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 select-none text-right overflow-y-auto"
        dir="rtl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0F2942] text-white rounded-xl shadow-xs">
              <Clock className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-xs font-black text-black">{title}</div>
              <div className="text-base font-black text-black flex items-center gap-1.5">
                <span>{parsed.displayFull}</span>
                {parsed.time24 && <span className="text-xs font-mono font-black text-black">({parsed.time24})</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-black hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-100">
          <div className="col-span-6 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الساعة:</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {hoursList.map((h: number) => {
                const isSelected = !parsed.isEmpty && parsed.hour12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`py-1.5 text-xs font-mono font-black rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الدقيقة:</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {minutesList.map((m: string) => {
                const isSelected = !parsed.isEmpty && parsed.minute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1.5 text-xs font-mono font-black rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-3 space-y-1.5">
            <div className="text-[11px] font-black text-black flex items-center gap-1">
              <span>الفترة:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handlePeriodSelect('AM')}
                className={`py-2 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !parsed.isEmpty && parsed.period === 'AM'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>صباحاً</span>
              </button>
              <button
                type="button"
                onClick={() => handlePeriodSelect('PM')}
                className={`py-2 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  !parsed.isEmpty && parsed.period === 'PM'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>مساءً</span>
              </button>
            </div>
          </div>
        </div>

        {currentTime24 && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onTimeChange('');
                onClose();
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition cursor-pointer text-center"
              title="إلغاء تحديد هذا الوقت وجعله غير محدد"
            >
              <span className="flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء تحديد الوقت (جعله غير محدد)</span>
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const parsedStart = parseTime24To12(lecStartTime);
  const parsedEnd = parseTime24To12(lecEndTime);

  return (
    // 4. وقت البدء + وقت الانتهاء بقوائم منسدلة احترافية مخصصة
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* البدء */}
      <div className="space-y-1.5 relative">
        <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#0F2942]" />
          <span>وقت بدء المحاضرة <span className="text-red-600">*</span></span>
        </label>
        <div>
          <button
            ref={lecStartTimeButtonRef}
            type="button"
            onClick={handleToggleLecStartTimeDropdown}
            className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
              isLecStartTimeDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg shrink-0 ${parsedStart.isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-900'}`}>
                <Clock className="w-4 h-4" />
              </div>
              {parsedStart.isEmpty ? (
                <span className="text-slate-500 font-bold text-xs sm:text-sm">-- : -- تحديد وقت البدء</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-black text-slate-950">{parsedStart.hourDisplay}:{parsedStart.minute}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                    parsedStart.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                  }`}>
                    {parsedStart.periodArabic}
                  </span>
                </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecStartTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
          </button>

          {isLecStartTimeDropdownOpen && lecStartTimeCoords && typeof document !== 'undefined' && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[999999] bg-transparent" 
                onClick={() => setIsLecStartTimeDropdownOpen(false)} 
              />
              {renderCustomTimePickerDropdown(
                lecStartTimeCoords,
                'وقت بدء المحاضرة',
                lecStartTime,
                (newTime: string) => {
                  setLecStartTime(newTime);
                  const autoEnd = calculateEndTimeFromStart(newTime, lecType);
                  if (autoEnd) {
                    setLecEndTime(autoEnd);
                  }
                },
                () => setIsLecStartTimeDropdownOpen(false),
                lecStudyType
              )}
            </>,
            document.body
          )}
        </div>
      </div>

      {/* الانتهاء */}
      <div className="space-y-1.5 relative">
        <label className="block text-sm font-black text-slate-950 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#0F2942]" />
          <span>وقت انتهاء المحاضرة <span className="text-red-600">*</span></span>
        </label>
        <div>
          <button
            ref={lecEndTimeButtonRef}
            type="button"
            onClick={handleToggleLecEndTimeDropdown}
            className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border-2 rounded-xl text-sm font-black text-slate-950 flex items-center justify-between cursor-pointer shadow-2xs transition-all text-right ${
              isLecEndTimeDropdownOpen ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20' : 'border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg shrink-0 ${parsedEnd.isEmpty ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-900'}`}>
                <Clock className="w-4 h-4" />
              </div>
              {parsedEnd.isEmpty ? (
                <span className="text-slate-500 font-bold text-xs sm:text-sm">-- : -- تحديد وقت الانتهاء</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-black text-slate-950">{parsedEnd.hourDisplay}:{parsedEnd.minute}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${
                    parsedEnd.period === 'PM' ? 'bg-indigo-50 text-indigo-950 border-indigo-200' : 'bg-sky-50 text-sky-950 border-sky-300'
                  }`}>
                    {parsedEnd.periodArabic}
                  </span>
                </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 shrink-0 ${isLecEndTimeDropdownOpen ? 'rotate-180 text-[#0F2942]' : ''}`} />
          </button>

          {isLecEndTimeDropdownOpen && lecEndTimeCoords && typeof document !== 'undefined' && createPortal(
            <>
              <div 
                className="fixed inset-0 z-[999999] bg-transparent" 
                onClick={() => setIsLecEndTimeDropdownOpen(false)} 
              />
              {renderCustomTimePickerDropdown(
                lecEndTimeCoords,
                'وقت انتهاء المحاضرة',
                lecEndTime,
                (newTime: string) => setLecEndTime(newTime),
                () => setIsLecEndTimeDropdownOpen(false),
                lecStudyType
              )}
            </>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};

export default LectureTimeSlotPicker; // 🚀 تصدير المكون
