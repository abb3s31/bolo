'use client'; // ⚡ ينفذ بالعميل على متصفح رئيس القسم/المقرر

// 🏛️ مكون جدول إشغال القاعات والمختبرات الشامل للكلية (Master Campus Matrix)
import { useState, useMemo } from 'react'; // 🔗 رياكت
import { DayOfWeek, ScheduleLecture, Department } from '@/types'; // 🔗 الأنواع
import {
  DAYS_OF_WEEK_LIST,
  UNIVERSITY_ROOMS_CATALOG,
  LECTURE_COLOR_THEMES,
  LECTURE_TYPE_LABELS,
  timeStringToMinutes,
  getTodayDayOfWeek,
} from '@/lib/schedule-utils'; // 🕒 أدوات وحسابات الجدول
import {
  Building2,
  X,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Users,
  Sun,
  Moon,
  FileSpreadsheet,
} from 'lucide-react'; // 🎨 الأيقونات
import { exportCampusHallOccupancyExcel } from '@/lib/excel-utils'; // 📊 تصدير مصفوفة إشغال القاعات إلى Excel الفاخر

interface MasterHallMatrixModalProps {
  isOpen: boolean;               // 👁️ هل النافذة مفتوحة؟
  onClose: () => void;           // 🚪 دالة الإغلاق
  lectures: ScheduleLecture[];   // 📚 كافة المحاضرات المجدولة
  departments: Department[];     // 🏢 قائمة الأقسام
}

// ⏰ الفترات الزمنية القياسية المعتمدة بجامعة الإمام جعفر الصادق (ع) - فرع ميسان
const STANDARD_TIME_SLOTS = [
  { id: 'slot-1', label: 'الفترة 1', start: '08:30', end: '10:30', startMin: 510, endMin: 630 },
  { id: 'slot-2', label: 'الفترة 2', start: '10:45', end: '12:45', startMin: 645, endMin: 765 },
  { id: 'slot-3', label: 'الفترة 3', start: '13:00', end: '15:00', startMin: 780, endMin: 900 },
];

export default function MasterHallMatrixModal({
  isOpen,
  onClose,
  lectures,
  departments,
}: MasterHallMatrixModalProps) {
  // 📌 الحالة: اليوم المختار للاستعراض
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [filterType, setFilterType] = useState<'all' | 'hall' | 'lab' | 'court'>('all');
  const [filterStudyType, setFilterStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 فلترة الفترة
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false); // 📊 حالة تصدير إكسل إشغال القاعات

  // 🔍 تصفية القاعات بحسب النوع (مدرجات / مختبرات / قاعات خاصة)
  const filteredRooms = useMemo(() => {
    if (filterType === 'all') return UNIVERSITY_ROOMS_CATALOG;
    return UNIVERSITY_ROOMS_CATALOG.filter((r) => r.type === filterType);
  }, [filterType]);

  // 📚 محاضرات اليوم المختار مع تصفية الفترة (صباحي / مسائي)
  const dayLectures = useMemo(() => {
    return lectures.filter((l) => {
      if (l.day !== selectedDay) return false;
      if (filterStudyType === 'all') return true;
      return (l.study_type || 'morning') === filterStudyType;
    });
  }, [lectures, selectedDay, filterStudyType]);

  // 📊 دالة تصدير مصفوفة إشغال القاعات والمختبرات لليوم المختار إلى Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const selectedDayLabel = DAYS_OF_WEEK_LIST.find((d) => d.key === selectedDay)?.label_ar || selectedDay;
      const occupancyData = filteredRooms.map((room) => {
        const getSlotInfo = (slotMin: number, slotMax: number) => {
          const matchLec = dayLectures.find((l) => {
            const isSameRoom = l.room.trim().toLowerCase() === room.name.trim().toLowerCase() ||
                              l.room.includes(room.name.split(' ')[0]) ||
                              room.name.includes(l.room.split(' ')[0]);
            if (!isSameRoom) return false;
            const lecStart = timeStringToMinutes(l.start_time);
            const lecEnd = timeStringToMinutes(l.end_time);
            return lecStart < slotMax && slotMin < lecEnd;
          });

          if (!matchLec) return 'متاحة (شاغرة)';
          const dept = departments.find((d) => d.id === matchLec.department_id); // 🏢 مطابقة معرف القسم
          const deptName = dept?.name || 'القسم الأكاديمي'; // 🏷️ اسم القسم المعتمد
          return `${matchLec.course_name} (${deptName} - م${matchLec.stage_number} - ${matchLec.study_type === 'evening' ? 'مسائي' : 'صباحي'}) [${matchLec.teacher_name || ''}]`;
        };

        return {
          room_name: room.name,
          room_type: room.type === 'lab' ? 'مختبر عملي' : 'قاعة تدريس',
          capacity: room.capacity,
          building: 'المبنى الرئيسي (فرع ميسان)', // 🏛️ مبنى الكلية بفرع ميسان
          slot1_content: getSlotInfo(510, 630),
          slot2_content: getSlotInfo(645, 765),
          slot3_content: getSlotInfo(780, 900),
        };
      });

      await exportCampusHallOccupancyExcel(selectedDayLabel, occupancyData, 'جامعة_الإمام_الصادق_ميسان');
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* 🏛️ الهيدر الفاتح الفاخر لمصفوفة إشغال القاعات */}
        <div className="bg-white p-5 sm:p-6 text-slate-900 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0F2942] font-black text-sm rounded-xl">
                <span>مخطط إشغال مرافق الحرم الجامعي</span>
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-sm rounded-xl">
                جامعة الإمام جعفر الصادق (ع) - فرع ميسان
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-[#0F2942]" />
              <span>مصفوفة إشغال القاعات والمختبرات الشاملة</span>
            </h2>
            <p className="text-base font-black text-slate-700 mt-1">
              متابعة وإدارة استخدام كافة المدرجات والقاعات والمختبرات وضمان منع التضارب بين الأقسام
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 border border-slate-300 shadow-xs"
            >
              <Printer className="w-5 h-5 text-slate-700" />
              <span className="hidden sm:inline">طباعة المخطط</span>
            </button>

            {/* 📊 زر تصدير مصفوفة إشغال القاعات Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 border border-[#1e4570] shadow-xs"
            >
              {isExportingExcel ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">{isExportingExcel ? 'جاري التوليد...' : 'تصدير المخطط Excel'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-950 hover:text-rose-600 rounded-2xl border border-slate-200 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 🎛️ شريط التحكم بالأيام وتصفية المرافق */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* أزرار اختيار اليوم */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {DAYS_OF_WEEK_LIST.filter((d) => d.key !== 'thursday' && d.key !== 'friday').map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`px-4 py-2 rounded-2xl text-base font-black transition cursor-pointer ${ selectedDay === d.key ? 'bg-[#0F2942] text-white shadow-md' : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-200' }`}
              >
                {d.label_ar}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* محدد نوع المرفق */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${ filterType === 'all' ? 'bg-[#0F2942] text-white' : 'text-slate-700 hover:text-slate-950' }`}
              >
                كافة المرافق ({UNIVERSITY_ROOMS_CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('hall')}
                className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${ filterType === 'hall' ? 'bg-[#0F2942] text-white' : 'text-slate-700 hover:text-slate-950' }`}
              >
                المدرجات والقاعات
              </button>
              <button
                type="button"
                onClick={() => setFilterType('lab')}
                className={`px-3.5 py-1.5 rounded-xl text-sm sm:text-base font-black transition cursor-pointer ${ filterType === 'lab' ? 'bg-[#0F2942] text-white' : 'text-slate-700 hover:text-slate-950' }`}
              >
                المختبرات
              </button>
            </div>

            {/* ☀️🌙 محدد الفترة الدراسية */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setFilterStudyType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${ filterStudyType === 'all' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100' }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setFilterStudyType('morning')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 ${ filterStudyType === 'morning' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-950 hover:bg-sky-50' }`}
              >
                <Sun className="w-4 h-4" />
                <span>الصباحي</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStudyType('evening')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 ${ filterStudyType === 'evening' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-950 hover:bg-indigo-50' }`}
              >
                <Moon className="w-4 h-4" />
                <span>المسائي</span>
              </button>
            </div>
          </div>
        </div>

        {/* 📊 شبكة المصفوفة الشاملة القابلة للتمرير بحدود ناعمة */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="min-w-[800px] border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
            
            {/* ترويسة الجدول الفاتحة */}
            <div className="grid grid-cols-4 bg-slate-100 text-slate-900 font-black text-base text-center border-b border-slate-200">
              <div className="p-4 text-right pr-4 border-l border-slate-200 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0F2942]" />
                <span>القاعة / المرفق الأكاديمي</span>
              </div>
              {STANDARD_TIME_SLOTS.map((slot, idx) => (
                <div key={slot.id} className={`p-4 ${idx < 2 ? 'border-l border-slate-200' : ''}`}>
                  <div className="text-slate-950 font-black text-base">{slot.label}</div>
                  <div className="text-slate-950 text-sm font-black mt-0.5 font-mono">{slot.start} - {slot.end}</div>
                </div>
              ))}
            </div>

            {/* صفوف القاعات والمختبرات */}
            <div className="divide-y divide-slate-200">
              {filteredRooms.map((room) => {
                return (
                  <div key={room.id} className="grid grid-cols-4 items-stretch hover:bg-slate-50/60 transition">
                    
                    {/* عمود اسم القاعة ومعلوماتها */}
                    <div className="p-4 border-l border-slate-200 flex flex-col justify-center bg-slate-50/80">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          room.type === 'lab' ? 'bg-emerald-500' : room.type === 'hall' ? 'bg-blue-500' : 'bg-slate-700'
                        }`} />
                        <h4 className="text-base font-black text-slate-950 leading-tight">{room.name}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-black text-slate-700 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-600" />
                          <span>السعة: {room.capacity} مقعد</span>
                        </span>
                        <span>•</span>
                        <span>{room.type === 'lab' ? '🔬 مختبر عملي' : '📘 قاعة تدريس'}</span>
                      </div>
                    </div>

                    {/* أعمدة الفترات الزمنية الثلاث */}
                    {STANDARD_TIME_SLOTS.map((slot, sIdx) => {
                      // فحص إذا كانت هذه القاعة محجوزة في هذه الفترة
                      const matchLec = dayLectures.find((l) => {
                        const isSameRoom = l.room.trim().toLowerCase() === room.name.trim().toLowerCase() ||
                                          l.room.includes(room.name.split(' ')[0]) ||
                                          room.name.includes(l.room.split(' ')[0]);
                        if (!isSameRoom) return false;

                        const lecStart = timeStringToMinutes(l.start_time);
                        const lecEnd = timeStringToMinutes(l.end_time);

                        return lecStart < slot.endMin && slot.startMin < lecEnd;
                      });

                      const theme = matchLec ? LECTURE_COLOR_THEMES[matchLec.color] || LECTURE_COLOR_THEMES.blue : null;
                      const typeInfo = matchLec ? LECTURE_TYPE_LABELS[matchLec.type] || LECTURE_TYPE_LABELS.theory : null;
                      const lecStudy = matchLec?.study_type || 'morning';

                      return (
                        <div
                          key={slot.id}
                          className={`p-3 flex flex-col justify-center ${
                            sIdx < 2 ? 'border-l border-slate-200' : ''
                          }`}
                        >
                          {matchLec && theme && typeInfo ? (
                            <div className={`p-3 rounded-2xl border ${theme.bgLight} ${theme.border} space-y-1.5 shadow-2xs`}>
                              <div className="flex items-center justify-between text-sm font-black">
                                <span className="text-slate-950 font-black font-mono">{matchLec.start_time} - {matchLec.end_time}</span>
                                <div className="flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${theme.badgeBg} ${theme.badgeText}`}>
                                    م{matchLec.stage_number}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded-lg text-xs font-black border flex items-center gap-0.5 ${
                                    lecStudy === 'evening'
                                      ? 'bg-blue-100 text-blue-950 border-blue-300'
                                      : 'bg-sky-50 text-sky-950 border-sky-300'
                                  }`}>
                                    {lecStudy === 'evening' ? (
                                      <Moon className="w-3 h-3 text-blue-700" />
                                    ) : (
                                      <Sun className="w-3 h-3 text-sky-600" />
                                    )}
                                    <span>{lecStudy === 'evening' ? 'مسائي' : 'صباحي'}</span>
                                  </span>
                                </div>
                              </div>
                              <h5 className="text-base font-black text-slate-950 leading-tight">
                                {matchLec.course_name}
                              </h5>
                              <div className="text-sm font-black text-slate-700 flex items-center justify-between pt-0.5">
                                <span>{matchLec.teacher_name || 'أستاذ المادة'}</span>
                                <span className="font-black text-slate-900">{typeInfo.ar}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[72px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 flex items-center justify-center text-center p-2">
                              <span className="text-base font-black text-emerald-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>شاغرة ومتاحة</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* تذييل النافذة */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-700 shrink-0">
          <span>يتم تحديث مخطط الإشغال تلقائياً عند إضافة أو تعديل أي محاضرة في جداول الأقسام.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-base font-black cursor-pointer transition"
          >
            إغلاق المخطط
          </button>
        </div>

      </div>
    </div>
  );
}
