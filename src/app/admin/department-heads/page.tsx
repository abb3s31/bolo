'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 إدارة رؤساء الأقسام والمقررين (CRUD) - لوحة المسؤول العام - جامعة الإمام جعفر الصادق (ع) فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة والمراجع
import { createPortal } from 'react-dom'; // 🌐 لرسم القوائم المنسدلة العائمة الذكية خارج أي حاوية بـ z-[999999]
import Image from 'next/image'; // 🖼️ مكون الصور
import Link from 'next/link'; // 🔗 روابط التنقل
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getStoredData, 
  saveStoredData, 
  INITIAL_PROFILES, 
  INITIAL_DEPARTMENTS, 
  generateStrongUniqueEmail, 
  generateStrongPassword,
  getAcademicYear,
  formatAcademicYearDisplay
} from '@/lib/mock-data'; // 💾 التخزين والمولدات ومساعد تنسيق العام الدراسي
import { 
  getCurrentSessionUser, 
  saveProfileToSupabase, 
  deleteProfileFromSupabase,
  syncProfilesFromSupabase,
  syncDepartmentsFromSupabase,
  saveDepartmentToSupabase
} from '@/lib/supabase-client'; // 🔌 الجلسة الحالية وحفظ وحذف ومزامنة السحابة الحية
import { UserProfile, Department } from '@/types'; // 🔗 واجهات الأنواع
import { downloadDepartmentHeadsTemplate, parseExcelFile, exportCustomDeptHeadsList, OFFICIAL_COLLEGE_DEPARTMENTS } from '@/lib/excel-utils'; // 📊 استيراد وتصدير إكسل والأقسام الـ 12 المعتمدة
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧬 التعرف الذكي على جنس الاسم
import { 
  checkEmailUniquenessAcrossSystem, 
  detectDuplicateEmails, 
  resolveDuplicateEmailsInProfiles 
} from '@/lib/validation-utils'; // 🛡️ محرك فحص فرادة البريد الأكاديمي الشامل
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المكون العائم الفاخر للـ CRUD والكارد
import { AcademicPasswordStrengthBox } from '@/components/AcademicPasswordStrengthBox'; // 🛡️ صندوق معايير كلمة المرور الموحد
import { 
  Building2, 
  UserCheck, 
  UserPlus, 
  User, // 👤 أيقونة المستخدم بصيغة SVG الرسمية
  UserX, // 👤🚫 أيقونة غير محدد
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Layers,
  QrCode,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  Filter,
  Key,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Calendar,
  AlertCircle,
  BookOpen, // 📖 أيقونة كتاب التعليمات SVG
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Printer, // 🖨️ أيقونة الطباعة الفورية لبطاقات الاعتماد
  Mail, // ✉️ أيقونة البريد الإلكتروني الرسمي
  KeyRound, // 🔑 أيقونة كلمة المرور والرمز السري
  Globe, // 🌐 أيقونة رابط المنصة وبوابة الدخول
  Eye, // 👁️ أيقونة إظهار الرمز السري
  EyeOff, // 👁️‍🗨️ أيقونة إخفاء الرمز السري
  Award // 🎖️ أيقونة الموقع الإداري والرتبة الأكاديمية
} from 'lucide-react'; // 🎨 الأيقونات الرسمية بتنسيق SVG
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust

// 📊 نوع بيانات تقرير نتائج استيراد الإكسل
interface ImportSummaryReport {
  totalRows: number;
  accepted: { name: string; role: string; dept: string; email: string }[];
  duplicates: { name: string; email: string; role: string; dept: string; reason: string }[];
  rejected: { rowNumber: number; rawName: string; reason: string }[];
}

// 🎭 مكون القائمة المنسدلة الذكية للموقع الإداري المحصورة 100% داخل الشاشة بـ z-[999999]
function SmartRoleSelect({
  value,
  onChange,
}: {
  value: 'department_head' | 'rapporteur' | '';
  onChange: (role: 'department_head' | 'rapporteur' | '') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    maxHeight: number;
    openUpwards: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(120, Math.min(240, spaceAbove - 20))
      : Math.max(120, Math.min(240, spaceBelow - 20));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
    const handleScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full text-right">
      <label className="text-sm font-black text-slate-950 block mb-1.5">
        الموقع الإداري *
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between gap-2 transition cursor-pointer text-right shadow-2xs ${
          isOpen ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {value === 'department_head' ? (
            <>
              <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
              <span className="font-black text-slate-950">رئيس قسم</span>
            </>
          ) : value === 'rapporteur' ? (
            <>
              <UserCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <span className="font-black text-slate-950">مقرر قسم</span>
            </>
          ) : (
            <>
              <UserX className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="font-black text-slate-950">-- غير محدد (اختر الموقع الإداري) --</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-950 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[999998]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'fixed',
              ...(coords.openUpwards
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-1.5 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-1 text-right divide-y divide-slate-100"
            dir="rtl"
          >
            {/* خيار غير محدد */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                !value ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserX className={`w-4 h-4 shrink-0 ${!value ? 'text-cyan-200' : 'text-slate-950'}`} />
                <span>-- غير محدد (إلغاء التحديد) --</span>
              </span>
              {!value && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>

            {/* رئيس قسم */}
            <button
              type="button"
              onClick={() => {
                onChange('department_head');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                value === 'department_head' ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 shrink-0 ${value === 'department_head' ? 'text-cyan-200' : 'text-indigo-700'}`} />
                <span>رئيس قسم</span>
              </span>
              {value === 'department_head' && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>

            {/* مقرر قسم */}
            <button
              type="button"
              onClick={() => {
                onChange('rapporteur');
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                value === 'rapporteur' ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck className={`w-4 h-4 shrink-0 ${value === 'rapporteur' ? 'text-cyan-200' : 'text-indigo-700'}`} />
                <span>مقرر قسم</span>
              </span>
              {value === 'rapporteur' && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// 🏢 مكون القائمة المنسدلة الذكية للأقسام الأكاديمية مع البحث الفوري والمحصورة داخل الشاشة بـ z-[999999]
function SmartDepartmentSelect({
  departments,
  value,
  onChange,
}: {
  departments: Department[];
  value: string;
  onChange: (deptId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    maxHeight: number;
    openUpwards: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(160, Math.min(320, spaceAbove - 20))
      : Math.max(160, Math.min(320, spaceBelow - 20));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
    const handleScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const selectedDept = departments.find((d) => d.id === value);
  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full text-right">
      <label className="text-sm font-black text-slate-950 block mb-1.5">
        القسم الأكاديمي التابع له ({departments.length} قسماً) *
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-slate-950 font-black text-sm flex items-center justify-between gap-2 transition cursor-pointer text-right shadow-2xs ${
          isOpen ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          {selectedDept ? (
            <>
              <div className="px-2 py-0.5 bg-[#0F2942] text-white rounded-md text-xs font-mono font-black shrink-0">
                {selectedDept.code || 'DEPT'}
              </div>
              <span className="font-black text-slate-950 text-sm truncate">{selectedDept.name}</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="font-black text-slate-950">-- غير محدد (اختر القسم العلمي التابع له) --</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-950 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[999998]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'fixed',
              ...(coords.openUpwards
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-1.5 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-1 text-right divide-y divide-slate-100"
            dir="rtl"
          >
            {/* 🔍 شريط البحث الفوري */}
            <div className="p-1 border-b border-slate-200 mb-1 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-950 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                {/* 🔍 حقل البحث السريع عن الأقسام مع نص تلميح رصاصي هادئ وخفيف */}
                <input
                  type="text" // 🔤 نوع الحقل نصي عادي
                  autoFocus // 🎯 تركيز تلقائي مباشر أول ما تفتح القائمة
                  value={search} // 💾 ربط القيمة بمتغير حالة البحث
                  onChange={(e) => setSearch(e.target.value)} // 🔄 تحديث البحث ويا كل حرف ينكتب
                  placeholder="ابحث باسم القسم أو رمزه..." // 💡 نص التلميح التوضيحي للبحث
                  className="w-full pr-8 pl-7 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-indigo-600 focus:bg-white shadow-2xs transition" // 🎨 تنسيق رصاصي راقي للتلميح وأسود للنص المكتوب
                  onClick={(e) => e.stopPropagation()} // 🛑 منع إغلاق القائمة عند النقر داخل مربع البحث
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-950 hover:text-slate-900 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* خيار غير محدد */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                !value ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserX className={`w-4 h-4 shrink-0 ${!value ? 'text-cyan-200' : 'text-slate-950'}`} />
                <span>-- غير محدد (إلغاء التحديد) --</span>
              </span>
              {!value && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
            </button>

            {/* قائمة الأقسام */}
            {filteredDepts.map((dept) => {
              const isSelected = dept.id === value;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    onChange(dept.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-right text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                    isSelected ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs' : 'bg-slate-50 hover:bg-indigo-50 text-slate-950 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-black shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {dept.code || 'DEPT'}
                    </span>
                    <span className="truncate">{dept.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-200 shrink-0 mr-2" />}
                </button>
              );
            })}

            {filteredDepts.length === 0 && (
              <div className="p-3 text-center text-xs font-black text-slate-950">
                لا توجد أقسام تطابق البحث
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// 🏛️ مكون القائمة المنسدلة الذكية لاختيار وتصفية القسم في شريط الترتيب محصورة 100% داخل الشاشة بـ z-[999999]
function SmartDepartmentFilterSelect({
  departments,
  profiles,
  value,
  onChange,
}: {
  departments: Department[];
  profiles: UserProfile[];
  value: string;
  onChange: (deptIdOrName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    maxHeight: number;
    openUpwards: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = openUpwards
      ? Math.max(160, Math.min(340, spaceAbove - 20))
      : Math.max(160, Math.min(340, spaceBelow - 20));

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 320)),
      width: Math.max(rect.width, 280),
      maxHeight,
      openUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
    const handleScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // دمج الأقسام الـ 12 الرسمية مع الأقسام الموجودة لظهور كافة الأقسام
  const allDepts = useMemo(() => {
    const list: { id: string; name: string; code?: string }[] = [...departments];
    OFFICIAL_COLLEGE_DEPARTMENTS.forEach((od) => {
      if (!list.some((d) => d.name.trim() === od.name.trim())) {
        list.push({
          id: `official-${od.code}`,
          name: od.name,
          code: od.code,
        });
      }
    });
    return list;
  }, [departments]);

  const selectedDept = allDepts.find((d) => d.id === value || d.name === value);
  const filteredDepts = allDepts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer border ${
          value !== 'ALL'
            ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
            : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
        }`}
      >
        <Building2 className={`w-4 h-4 shrink-0 ${value !== 'ALL' ? 'text-cyan-300' : 'text-slate-950'}`} />
        <span className="truncate max-w-[200px]">
          {value === 'ALL'
            ? 'اختيار قسم محدد (كافة الأقسام)'
            : `القسم: ${selectedDept ? selectedDept.name : value}`}
        </span>
        {value !== 'ALL' ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('ALL');
              setIsOpen(false);
            }}
            className="p-0.5 hover:bg-white/20 rounded-full transition"
            title="إلغاء التصفية وعرض كافة الأقسام"
          >
            <X className="w-3.5 h-3.5 text-cyan-200" />
          </span>
        ) : (
          <ChevronDown className={`w-4 h-4 text-slate-950 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[999998]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'fixed',
              ...(coords.openUpwards
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }}
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-2 flex flex-col animate-in fade-in zoom-in-95 duration-150 text-right overflow-hidden"
            dir="rtl"
          >
            {/* 🔍 شريط البحث عن الأقسام */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-950" />
              {/* 🔍 حقل البحث عن القسم مع تلميح رصاصي أنيق */}
              <input
                type="text" // 🔤 نوع الحقل نص
                value={search} // 💾 ربط القيمة ببحث الفلترة
                onChange={(e) => setSearch(e.target.value)} // 🔄 تحديث الكلمة المبحوث عنها
                placeholder="ابحث عن اسم القسم..." // 💡 نص التلميح الإرشادي
                autoFocus // 🎯 تركيز فوري
                className="w-full pr-9 pl-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-indigo-600" // 🎨 تلميح رصاصي واضح مو أسود ثقيل
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-950 hover:text-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 📋 قائمة الخيارات مع التمرير الداخلي */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 overscroll-contain space-y-1">
              {/* خيار كافة الأقسام */}
              <button
                type="button"
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                  value === 'ALL'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-950 border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className={`w-4 h-4 shrink-0 ${value === 'ALL' ? 'text-cyan-200' : 'text-slate-950'}`} />
                  <span>كافة الأقسام (عرض كل القيادات)</span>
                </span>
                {value === 'ALL' ? (
                  <Check className="w-4 h-4 text-cyan-200 shrink-0" />
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-950 font-black px-2 py-0.5 rounded-full font-mono">
                    {profiles.filter(p => p.role === 'department_head' || p.role === 'rapporteur').length}
                  </span>
                )}
              </button>

              {/* عناصر الأقسام الـ 12 */}
              {filteredDepts.map((dept) => {
                const isSelected = value === dept.id || value === dept.name;
                const deptLeaders = profiles.filter(
                  (p) =>
                    (p.department_id === dept.id || p.department_name === dept.name) &&
                    (p.role === 'department_head' || p.role === 'rapporteur')
                );
                const hasHead = deptLeaders.some((p) => p.role === 'department_head');
                const hasRap = deptLeaders.some((p) => p.role === 'rapporteur');

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onChange(dept.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'hover:bg-indigo-50 text-slate-950 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-200' : 'text-indigo-700'}`} />
                      <span className="truncate">{dept.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      {hasHead && hasRap ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                          مكتمل (2)
                        </span>
                      ) : deptLeaders.length > 0 ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-sky-800 text-sky-100' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>
                          1 مسؤول
                        </span>
                      ) : (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-950 border border-slate-300'}`}>
                          شاغر (0)
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-cyan-200 shrink-0" />}
                    </div>
                  </button>
                );
              })}

              {filteredDepts.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-950 font-black">
                  لم يتم العثور على أي قسم يطابق البحث
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default function DepartmentHeadsManagementPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // 📌 حقول نموذج إضافة / تعديل رئيس قسم أو مقرر
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'department_head' | 'rapporteur' | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null); // 🚻 حالة تحديد جنس المسؤول الأكاديمي (الافتراضي غير محدد)
  const [genderError, setGenderError] = useState<string>(''); // ⚠️ تنبيه عدم اختيار الجنس
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showHeadPassword, setShowHeadPassword] = useState<boolean>(false); // 👁️ إظهار أو إخفاء الرمز السري لرئيس القسم أو المقرر بنجوم أو نص صريح
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'department_head' | 'rapporteur'>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL'); // 🏛️ تصفية واختيار حسب القسم
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest' | 'name_asc' | 'dept_asc'>('custom');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCardProfile, setSelectedCardProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [showExcelInstructions, setShowExcelInstructions] = useState(false);

  // 🖨️ حالات طباعة وتصدير بطاقات اعتماد القيادات الأكاديمية (رؤساء الأقسام والمقررين)
  const [showBatchPrintModal, setShowBatchPrintModal] = useState<boolean>(false); // 🖨️ نافذة المعاينة والطباعة الجماعية
  const [batchPrintDeptFilter, setBatchPrintDeptFilter] = useState<string>('all'); // 🏛️ فلترة الطباعة بالقسم (الكل أو قسم محدد)
  const [singlePrintProfile, setSinglePrintProfile] = useState<UserProfile | null>(null); // 👤 طباعة بطاقة فردية لمسؤول محدد
  const [isPrintDeptDropdownOpen, setIsPrintDeptDropdownOpen] = useState<boolean>(false); // 🔽 حالة فتح القائمة المنسدلة الاحترافية للأقسام
  const printDeptDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع القائمة المنسدلة لإغلاقها عند النقر بالخارج

  // ⚡ حالة التحقق من اكتمال تحميل الصفحة بالعميل لتفعيل البورتال بأمان
  const [isMounted, setIsMounted] = useState<boolean>(false); // 🌐 حالة التثبيت في متصفح العميل
  useEffect(() => { // ⚡ خطاف التحميل الأولي
    setIsMounted(true); // 🚀 تفعيل البورتال بعد اكتمال العرض الأولي
  }, []); // 🔒 يتنفذ مرة واحدة فقط

  // 🖨️ إدارة كلاس الطباعة على جسم الصفحة لضمان خروج وثيقة الطباعة A4 بدون أي مساحات فارغة
  useEffect(() => { // 🔄 مراقبة فتح وإغلاق مودال الطباعة
    if (showBatchPrintModal) { // 🟢 إذا فتحت نافذة المعاينة والطباعة
      document.body.classList.add('print-modal-active'); // 📄 تمكين نمط الطباعة المنعزل على الجسم
      return () => { // 🧹 دالة التنظيف عند الإغلاق
        document.body.classList.remove('print-modal-active'); // 🔒 إزالة الكلاس فور إغلاق نافذة المعاينة
      };
    }
  }, [showBatchPrintModal]); // 🎯 يعتمد حصراً على حالة فتح المودال

  // 📊 نافذة تقرير نتائج استيراد ملف Excel
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'accepted' | 'duplicates' | 'rejected'>('accepted');

  // ⚠️ حالة نافذة تأكيد استبدال رئيس القسم أو المقرر الحالي
  const [replaceModalData, setReplaceModalData] = useState<{
    existingLeader: UserProfile;
    roleTitle: string;
    deptName: string;
    newProfileData: {
      fullName: string;
      role: 'department_head' | 'rapporteur';
      deptId: string;
      email: string;
      password: string;
      gender: 'male' | 'female'; // 🚻 جنس المسؤول الأكاديمي الجديد
    };
  } | null>(null);
  const [nameError, setNameError] = useState<string>(''); // ⚠️ تنبيه خطأ الاسم
  const [deletingLeaderProfile, setDeletingLeaderProfile] = useState<UserProfile | null>(null); // 🗑️ حالة مسؤول القسم المراد حذفه
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]); // 🔘 معرفات القيادات المحددة
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false); // 🗑️ حالة نافذة الحذف الجماعي

  // 🎛️ حالة قائمة التصفية في الجدول الرئيسي
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📄 حالات نظام الصفحات (Pagination) المتقدم لجدول رؤساء الأقسام والمقررين
  const [currentPage, setCurrentPage] = useState<number>(1); // 📄 رقم الصفحة الحالية
  const [pageSize, setPageSize] = useState<number>(10); // 📏 عدد المسؤولين في الصفحة الواحدة
  const [isPageSizeOpen, setIsPageSizeOpen] = useState<boolean>(false); // 🔽 حالة فتح قائمة حجم الصفحة
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null); // 🔗 مرجع قائمة حجم الصفحة

  // 📄 تصفير الصفحة للبداية عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, selectedDeptFilter, sortMode]);

  // 🔄 إغلاق القوائم المنسدلة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setIsPageSizeOpen(false);
      }
      if (printDeptDropdownRef.current && !printDeptDropdownRef.current.contains(event.target as Node)) {
        setIsPrintDeptDropdownOpen(false); // 🔒 إغلاق قائمة الأقسام الاحترافية
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterDropdownOpen(false);
        setIsPageSizeOpen(false);
        setIsPrintDeptDropdownOpen(false); // 🔒 إغلاق قائمة الأقسام بزر الهروب
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 🔄 تحميل البيانات والتحقق من صلاحية المسؤول العام
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin'); // 🔒 حظر غير المصرح لهم وإعادتهم لصفحة دخول المسؤول العام
      return;
    }

    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);

    // ☁️ مزامنة حية من Supabase للقيادات والأقسام
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'إدارة رؤساء ومقرري الأقسام | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // 🔀 دالة تغيير الترتيب اليدوي (تقديم وتأخير ⬆️ ⬇️)
  const handleMoveHead = (currentIndex: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedProfiles.length) return;

    const currentList = [...sortedProfiles];
    const itemToMove = currentList[currentIndex];
    currentList[currentIndex] = currentList[targetIndex];
    currentList[targetIndex] = itemToMove;

    const targetIds = new Set(currentList.map(p => p.id));
    const otherProfiles = profiles.filter(p => !targetIds.has(p.id));
    const reindexedList = currentList.map((p, idx) => ({ ...p, order_index: idx }));
    const combined = [...reindexedList, ...otherProfiles];

    setProfiles(combined);
    saveStoredData('profiles', combined);
    setSortMode('custom');
    setSuccessMessage(`تم تغيير ترتيب حساب (${itemToMove.full_name}) بنجاح!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 📧 دالة توليد بريد أكاديمي رسمي فريد 100% بدون أي تكرار مع كافة مستخدمي النظام
  const handleGenerateUniqueEmail = () => {
    const dept = departments.find((d) => d.id === selectedDeptId);
    let deptPrefix = 'dept';
    if (dept) {
      if (dept.name.includes('تقنيات الحاسوب')) deptPrefix = 'cce';
      else if (dept.name.includes('القانون')) deptPrefix = 'law';
      else if (dept.name.includes('المالية') || dept.name.includes('المصرفية')) deptPrefix = 'fin';
      else if (dept.name.includes('البرمجيات')) deptPrefix = 'ce';
      else if (dept.name.includes('الأعمال')) deptPrefix = 'bus';
      else if (dept.name.includes('المحاسبة')) deptPrefix = 'acc';
      else if (dept.name.includes('الإعلام')) deptPrefix = 'med';
      else if (dept.name.includes('الانكليزية')) deptPrefix = 'eng';
      else if (dept.name.includes('القرآن')) deptPrefix = 'isl';
      else if (dept.name.includes('الطبية')) deptPrefix = 'bme';
      else if (dept.name.includes('الرياضة')) deptPrefix = 'pe';
      else if (dept.name.includes('الديكور') || dept.name.includes('التصميم')) deptPrefix = 'id';
      else if (dept.name.includes('السيبراني')) deptPrefix = 'csec';
      else deptPrefix = dept.code?.toLowerCase() || 'dept';
    }

    const rolePrefix = selectedRole === 'department_head' ? 'head' : 'rap';
    const existingEmails = new Set(profiles.map((p) => (p.generated_email || '').toLowerCase().trim()));

    // 🔒 فحص شامل لضمان عدم وجود البريد إطلاقاً في قاعدة البيانات
    let candidateEmail = `${rolePrefix}.${deptPrefix}@sadiq.edu.iq`;
    let attempts = 0;
    while (existingEmails.has(candidateEmail.toLowerCase()) && attempts < 500) {
      const randNum = Math.floor(100 + Math.random() * 900);
      candidateEmail = `${rolePrefix}.${deptPrefix}.${randNum}@sadiq.edu.iq`;
      attempts++;
    }

    setCustomEmail(candidateEmail);
    setSuccessMessage(`تم توليد بريد أكاديمي فريد 100%: (${candidateEmail})`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🔑 دالة توليد رمز سري عشوائي قوي جداً غير مكرر إطلاقاً في قاعدة البيانات والنظام
  const handleGenerateUniquePassword = () => {
    const existingPasswords = new Set(profiles.map((p) => (p.temp_password || '').trim()).filter(Boolean));
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const specials = '!@#$%^&*';
    const allChars = uppers + lowers + digits + specials;

    let strongPass = '';
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 500) {
      attempts++;
      strongPass = 'Sq#';
      for (let i = 0; i < 9; i++) {
        strongPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      strongPass += '!';
      if (!existingPasswords.has(strongPass)) {
        isUnique = true;
      }
    }

    setCustomPassword(strongPass);
    setSuccessMessage(`🔒 تم توليد رمز سري قوي وفريد بنجاح (غير مكرر 100%)`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🎲 دالة توليد بريد أكاديمي ورمز دخول فريد ومعقد معاً بدون أي تكرار
  const handleAutoGenerateCredentials = () => {
    handleGenerateUniqueEmail();
    handleGenerateUniquePassword();
  };

  // 🔍 تصفية وترتيب رؤساء الأقسام والمقررين
  const sortedProfiles = useMemo(() => {
    let list = profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur');

    if (filterRole !== 'ALL') {
      list = list.filter((p) => p.role === filterRole);
    }

    // 🏛️ تصفية واختيار حسب القسم الأكاديمي المحدد من القائمة المنسدلة
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(
        (p) => p.department_id === selectedDeptFilter || p.department_name === selectedDeptFilter
      );
    }

    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(term) ||
          (p.department_name && p.department_name.toLowerCase().includes(term)) ||
          p.generated_email.toLowerCase().includes(term) ||
          p.university_number.toLowerCase().includes(term)
      );
    }

    switch (sortMode) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'name_asc':
        return list.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
      case 'dept_asc':
        return list.sort((a, b) => (a.department_name || '').localeCompare(b.department_name || '', 'ar'));
      case 'custom':
      default:
        return list;
    }
  }, [profiles, filterRole, selectedDeptFilter, searchQuery, sortMode]);

  // 💾 دالة الحفظ الفعلي بعد التأكد أو الاستبدال
  const executeProfileSave = (
    name: string,
    role: 'department_head' | 'rapporteur',
    deptId: string,
    email: string,
    password: string,
    gender: 'male' | 'female', // 🚻 جنس المسؤول الأكاديمي
    replaceLeaderId?: string
  ) => {
    // 🛡️ فحص فرادة البريد الإلكتروني قبل الحفظ الفعلي
    const emailCheck = checkEmailUniquenessAcrossSystem(email, replaceLeaderId, profiles); // 🔍 فحص البريد بالنظام
    if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مأخوذ مسبقاً
      setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى اختيار بريد آخر.'); // 💬 إشعار الأدمن
      return; // 🚫 إيقاف الحفظ
    }

    const dept = departments.find((d) => d.id === deptId);
    const deptName = dept ? dept.name : 'القسم الأكاديمي';
    const isFemale = gender === 'female';
    const roleTitle = role === 'department_head'
      ? (isFemale ? 'رئيسة قسم' : 'رئيس قسم')
      : (isFemale ? 'مقررة قسم' : 'مقرر قسم');
    const randomCode = Math.floor(1000 + Math.random() * 9000);

    const newProfile: UserProfile = {
      id: `usr-${role}-${Date.now()}`,
      full_name: name.trim(),
      role: role,
      gender: gender, // 🚻 حفظ وتثبيت جنس المسؤول
      department_id: deptId,
      department_name: deptName,
      university_number: `${role === 'department_head' ? 'HOD' : 'RAP'}-${randomCode}`,
      generated_email: email,
      temp_password: password,
      is_active: true,
      must_change_password: false,
      created_at: new Date().toISOString(),
      order_index: 0,
    };

    // 🔄 إذا كان هناك قائد سابق تم استبداله، نحوله إلى تدريسي في نفس القسم
    let baseProfiles = [...profiles];
    if (replaceLeaderId) {
      baseProfiles = baseProfiles.map((p) => {
        if (p.id === replaceLeaderId) {
          return {
            ...p,
            role: 'teacher' as const,
          };
        }
        return p;
      });
    }

    // ⬆️ وضع الحساب الجديد في البداية فوراً
    const updatedProfiles = [newProfile, ...baseProfiles];
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    saveProfileToSupabase(newProfile); // ☁️ رفع الحساب إلى Supabase فوراً

    // 🏢 تحديث جدول الأقسام
    const updatedDepts = departments.map((d) => {
      if (d.id === deptId) {
        if (role === 'department_head') {
          return { ...d, head_id: newProfile.id, head_name: newProfile.full_name, head_email: newProfile.generated_email };
        } else {
          return { ...d, rapporteur_id: newProfile.id, rapporteur_name: newProfile.full_name, rapporteur_email: newProfile.generated_email };
        }
      }
      return d;
    });
    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    const targetDept = updatedDepts.find((d) => d.id === deptId);
    if (targetDept) {
      saveDepartmentToSupabase(targetDept); // ☁️ حفظ بيانات القيادة في جدول الأقسام سحابياً
    }

    setSelectedCardProfile(newProfile); // 📇 فتح بطاقة الاعتماد
    setSuccessMessage(
      replaceLeaderId
        ? `تم استبدال ${roleTitle} السابق وتعيين (${newProfile.full_name}) ${roleTitle} لقسم (${deptName}) بنجاح!`
        : `تم إنشاء حساب ${roleTitle} وربطه بقسم (${deptName}) بنجاح!`
    );
    setShowAddModal(false);
    setFullName('');
    setCustomEmail('');
    setCustomPassword('');
    setReplaceModalData(null);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ➕ إضافة أو تعديل رئيس قسم / مقرر مع كشف المسؤول الحالي وإمكانية الاستبدال
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError('يرجى كتابة الاسم الثلاثي واللقب الأكاديمي أولاً.');
      return;
    }
    if (!selectedRole) {
      setNameError('يرجى اختيار الموقع الإداري (رئيس قسم أو مقرر قسم).');
      return;
    }
    if (!selectedDeptId) {
      setNameError('يرجى اختيار القسم الأكاديمي التابع له أولاً.');
      return;
    }
    if (!selectedGender) {
      setGenderError('يرجى تحديد الجنس الأكاديمي (ذكر / أنثى) للمسؤول أولاً.');
      return;
    }
    setGenderError('');
    setNameError('');

    const dept = departments.find((d) => d.id === selectedDeptId);
    const deptName = dept ? dept.name : 'القسم الأكاديمي';
    const roleTitle = selectedRole === 'department_head' ? 'رئيس قسم' : 'مقرر قسم';

    if (editingId) {
      // 🛡️ فحص فرادة البريد الأكاديمي بالتعديل ومنع التكرار
      if (customEmail.trim()) { // 🔍 إذا كتب بريد للتعديل
        const emailCheck = checkEmailUniquenessAcrossSystem(customEmail.trim(), editingId, profiles); // 🔍 فحص البريد مع استثناء الحساب نفسه
        if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مكرر
          setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر.'); // 💬 رسالة الخطأ
          return; // 🚫 رفض الحفظ
        }
      }

      // ✏️ وضع التعديل
      let editedProfile: UserProfile | null = null;
      const updatedProfiles = profiles.map((p) => {
        if (p.id === editingId) {
          const updated: UserProfile = {
            ...p,
            full_name: fullName.trim(),
            role: selectedRole as 'department_head' | 'rapporteur',
            gender: selectedGender, // 🚻 تحديث وتأكيد جنس المسؤول الأكاديمي
            department_id: selectedDeptId,
            department_name: deptName,
            generated_email: customEmail.trim() ? customEmail.trim().toLowerCase() : p.generated_email,
            temp_password: customPassword.trim() ? customPassword.trim() : p.temp_password,
          };
          editedProfile = updated;
          return updated;
        }
        return p;
      });

      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);
      if (editedProfile) {
        saveProfileToSupabase(editedProfile); // ☁️ رفع التعديل إلى Supabase فوراً
      }

      // 🔄 تحديث بيانات القسم في جدول الأقسام
      const updatedDepts = departments.map((d) => {
        if (d.id === selectedDeptId) {
          if (selectedRole === 'department_head') {
            return { ...d, head_id: editingId, head_name: fullName.trim(), head_email: customEmail.trim() || d.head_email };
          } else {
            return { ...d, rapporteur_id: editingId, rapporteur_name: fullName.trim(), rapporteur_email: customEmail.trim() || d.rapporteur_email };
          }
        }
        return d;
      });
      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);

      setEditingId(null);
      setShowAddModal(false);
      setFullName('');
      setCustomEmail('');
      setCustomPassword('');
      setSuccessMessage('تم تحديث بيانات الحساب الإداري وربطه بالقسم بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      // ➕ فحص هل القسم فيه رئيس قسم أو مقرر حالي بالفعل
      const existingLeader = profiles.find(
        (p) => p.department_id === selectedDeptId && p.role === selectedRole
      );

      const prefix = selectedRole === 'department_head' ? 'head' : 'rap';
      let finalEmail = '';
      if (customEmail.trim()) {
        finalEmail = customEmail.includes('@') ? customEmail.trim().toLowerCase() : `${customEmail.trim().toLowerCase()}@sadiq.edu.iq`;
      } else {
        finalEmail = generateStrongUniqueEmail(prefix, profiles);
      }

      // 🛡️ فحص فرادة البريد الأكاديمي قبل الإضافة ومنع التكرار نهائياً
      const emailCheck = checkEmailUniquenessAcrossSystem(finalEmail, undefined, profiles); // 🔍 تدقيق البريد بالنظام
      if (!emailCheck.isUnique) { // ⚠️ إذا كان البريد مكرراً
        setNameError(emailCheck.errorMessage || 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى اختيار بريد آخر.'); // 💬 إظهار رسالة الرفض
        return; // 🚫 إيقاف الحفظ
      }

      const finalPassword = customPassword.trim() ? customPassword.trim() : generateStrongPassword();

      if (existingLeader) {
        // ⚠️ القسم فيه مسؤول حالي -> فتح نافذة تأكيد الاستبدال
        setReplaceModalData({
          existingLeader,
          roleTitle,
          deptName,
          newProfileData: {
            fullName: fullName.trim(),
            role: selectedRole as 'department_head' | 'rapporteur',
            deptId: selectedDeptId,
            email: finalEmail,
            password: finalPassword,
            gender: selectedGender, // 🚻 تمرير جنس المسؤول الجديد لنافذة الاستبدال
          },
        });
        return;
      }

      // لا يوجد مسؤول حالي -> إضافة مباشرة
      executeProfileSave(fullName.trim(), selectedRole as 'department_head' | 'rapporteur', selectedDeptId, finalEmail, finalPassword, selectedGender);
    }
  };

  // 🗑️ فتح كارد تأكيد حذف حساب رئيس قسم أو مقرر
  const handleDelete = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (target) {
      setDeletingLeaderProfile(target);
    }
  };

  // 🗑️ تنفيذ الحذف النهائي بعد التأكيد في الكارد
  const confirmExecuteDeleteLeader = () => {
    if (!deletingLeaderProfile) return;
    const id = deletingLeaderProfile.id;
    const target = deletingLeaderProfile;

    const updatedProfiles = profiles.filter((p) => p.id !== id);
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    deleteProfileFromSupabase(id); // ☁️ حذف الحساب من Supabase فوراً

    // 🏢 إخلاء الخانة من القسم المعني
    if (target && target.department_id) {
      const updatedDepts = departments.map((d) => {
        if (d.id === target.department_id) {
          if (target.role === 'department_head') {
            return { ...d, head_id: undefined, head_name: undefined, head_email: undefined };
          } else if (target.role === 'rapporteur') {
            return { ...d, rapporteur_id: undefined, rapporteur_name: undefined, rapporteur_email: undefined };
          }
        }
        return d;
      });
      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);
      const targetDept = updatedDepts.find((d) => d.id === target.department_id);
      if (targetDept) {
        saveDepartmentToSupabase(targetDept); // ☁️ حفظ إخلاء القسم في Supabase
      }
    }

    setDeletingLeaderProfile(null);
    setSuccessMessage('تم حذف الحساب وفك ارتباطه من القسم بنجاح.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية لقيادات الأقسام
  const toggleSelectAll = (list: UserProfile[]) => {
    if (selectedLeaderIds.length === list.length && list.length > 0) {
      setSelectedLeaderIds([]);
    } else {
      setSelectedLeaderIds(list.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeaderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteLeaders = () => {
    const count = selectedLeaderIds.length;
    if (count === 0) return;

    const updatedProfiles = profiles.filter((p) => !selectedLeaderIds.includes(p.id));
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);

    // 🏢 إخلاء الخانات من الأقسام المعنية
    const updatedDepts = departments.map((d) => {
      let headId = d.head_id;
      let headName = d.head_name;
      let headEmail = d.head_email;
      let rappId = d.rapporteur_id;
      let rappName = d.rapporteur_name;
      let rappEmail = d.rapporteur_email;

      if (headId && selectedLeaderIds.includes(headId)) {
        headId = undefined;
        headName = undefined;
        headEmail = undefined;
      }
      if (rappId && selectedLeaderIds.includes(rappId)) {
        rappId = undefined;
        rappName = undefined;
        rappEmail = undefined;
      }

      return {
        ...d,
        head_id: headId,
        head_name: headName,
        head_email: headEmail,
        rapporteur_id: rappId,
        rapporteur_name: rappName,
        rapporteur_email: rappEmail,
      };
    });

    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    updatedDepts.forEach((d) => saveDepartmentToSupabase(d)); // ☁️ مزامنة تحديثات الأقسام في Supabase

    // ☁️ حذف الحسابات من Supabase
    selectedLeaderIds.forEach((id) => deleteProfileFromSupabase(id));

    setSelectedLeaderIds([]);
    setIsBulkDeleting(false);
    setSuccessMessage(`تم حذف (${count}) من مسؤولي الأقسام وفك ارتباطاتهم بنجاح.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleBulkExportExcel = async (list: UserProfile[]) => {
    const selectedLeadersList = list.filter((p) => selectedLeaderIds.includes(p.id));
    if (selectedLeadersList.length === 0) return;

    await exportCustomDeptHeadsList(selectedLeadersList, 'كلية_ميسان');
    setSuccessMessage(`تم تصدير (${selectedLeadersList.length}) حساب إداري إلى ملف Excel بنجاح! 📊`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 🔧 دالة المعالجة التلقائية لكافة الحسابات المكررة وتوليد بريد أكاديمي فريد
  const handleFixDuplicateEmails = () => {
    const { updatedProfiles, fixedCount, fixedDetails } = resolveDuplicateEmailsInProfiles(profiles);
    if (fixedCount > 0) {
      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);
      // ☁️ مزامنة الحسابات المصححة مع سوبابيز
      fixedDetails.forEach((detail) => {
        const found = updatedProfiles.find((p) => p.full_name === detail.name);
        if (found) saveProfileToSupabase(found);
      });
      setSuccessMessage(`تم بنجاح تصحيح (${fixedCount}) حسابات وفصل البريد الأكاديمي المكرر وتوليد بريد فريد جديد!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // 🔑 إعادة تعيين وتوليد كلمة مرور جديدة معقدة
  const handleResetPassword = (id: string) => {
    const newPass = generateStrongPassword();
    const updatedProfiles = profiles.map((p) => {
      if (p.id === id) {
        const updated = { ...p, temp_password: newPass };
        setSelectedCardProfile(updated);
        return updated;
      }
      return p;
    });

    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);
    setSuccessMessage('تم توليد كلمة مرور جديدة للحساب بنجاح!');
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // 📋 نسخ بيانات الاعتماد
  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 📥 تنزيل نموذج Excel العربي المعتمد مع التعليمات وتاريخ التنزيل
  const handleDownloadTemplate = async () => {
    await downloadDepartmentHeadsTemplate(departments.map(d => ({ id: d.id, name: d.name })));
    setSuccessMessage('تم تنزيل نموذج إكسل المعتمد بنجاح مع تلوين الصف الأول وحسابات فريدة لكل قسم!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // 📤 رفع واستيراد ملف Excel مع منع التكرار 100% وإظهار التقرير التفصيلي
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      if (rows.length === 0) {
        setErrorMessage('ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة!');
        setTimeout(() => setErrorMessage(''), 4000);
        setIsImportingExcel(false);
        return;
      }

      const acceptedList: { name: string; role: string; dept: string; email: string }[] = [];
      const duplicateList: { name: string; email: string; role: string; dept: string; reason: string }[] = [];
      const rejectedList: { rowNumber: number; rawName: string; reason: string }[] = [];
      
      const newProfilesToAdd: UserProfile[] = [];
      const updatedDepts = [...departments];
      const existingEmails = new Set(profiles.map(p => (p.generated_email || '').toLowerCase().trim()));

      let rowNumber = 1;
      for (const row of rows) {
        rowNumber++;
        const rawName = String(
          row['الاسم الثلاثي واللقب الأكاديمي'] || 
          row['الاسم الكامل'] || 
          row['اسم التدريسي'] || 
          row['الاسم'] || 
          ''
        ).trim();

        // 1️⃣ فحص الاسم الفارغ -> مرفوض
        if (!rawName) {
          rejectedList.push({
            rowNumber,
            rawName: '— (حقل فارغ)',
            reason: 'حقل الاسم الثلاثي واللقب الأكاديمي فارغ في هذا الصف',
          });
          continue;
        }

        const rawRole = String(row['الموقع الإداري'] || row['الموقع'] || row['الدور'] || '').trim();
        const role: 'department_head' | 'rapporteur' = rawRole.includes('رئيس') ? 'department_head' : 'rapporteur';
        const roleTitle = role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم';

        const rawDept = String(row['القسم العلمي التابع له'] || row['القسم العلمي'] || row['القسم'] || '').trim();
        
        // 🏢 مطابقة القسم العلمي بالاسم العربي
        let matchedDept = updatedDepts.find(d => d.name.trim() === rawDept);
        if (!matchedDept && rawDept) {
          matchedDept = updatedDepts.find(d => d.name.includes(rawDept) || rawDept.includes(d.name));
        }

        // 🏛️ إذا لم يكن القسم منشأ مسبقاً، نتحقق من مطابقته مع الأقسام الـ 12 الرسمية وننشئه فوراً
        if (!matchedDept && rawDept) {
          const cleanRaw = rawDept.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
          const official = OFFICIAL_COLLEGE_DEPARTMENTS.find(od => {
            const cleanOfficial = od.name.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
            return cleanOfficial === cleanRaw || cleanOfficial.includes(cleanRaw) || cleanRaw.includes(cleanOfficial);
          });

          if (official) {
            const newDept: Department = {
              id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: official.name,
              code: official.code,
              order_index: updatedDepts.length,
              created_at: new Date().toISOString(),
            };
            updatedDepts.push(newDept);
            matchedDept = newDept;
            saveDepartmentToSupabase(newDept); // ☁️ حفظ القسم الجديد في Supabase سحابياً
          }
        }

        if (!matchedDept && rawDept) {
          rejectedList.push({
            rowNumber,
            rawName,
            reason: `القسم (${rawDept}) غير معتمد في قائمة الأقسام الرسمية`,
          });
          continue;
        }

        const deptId = matchedDept ? matchedDept.id : (updatedDepts[0]?.id || 'dept-1');
        const deptName = matchedDept ? matchedDept.name : (updatedDepts[0]?.name || 'القسم الأكاديمي');

        // 2️⃣ فحص التكرار الصارم للبريد المكتوب يدوياً
        let email = String(row['البريد الأكاديمي (اختياري)'] || row['البريد الأكاديمي'] || row['البريد'] || '').trim().toLowerCase();
        
        if (email && existingEmails.has(email)) {
          duplicateList.push({
            name: rawName,
            email,
            role: roleTitle,
            dept: deptName,
            reason: 'البريد الأكاديمي مسجل مسبقاً لمستخدم آخر في قاعدة البيانات أو مكرر في الملف',
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        // 3️⃣ فحص هل نفس الاسم ونفس الموقع مضاف مسبقاً لنفس القسم
        const isDuplicateLeader = profiles.some(
          p => p.full_name.trim() === rawName && p.department_id === deptId && p.role === role
        ) || newProfilesToAdd.some(
          p => p.full_name.trim() === rawName && p.department_id === deptId && p.role === role
        );

        if (isDuplicateLeader) {
          duplicateList.push({
            name: rawName,
            email: email || '—',
            role: roleTitle,
            dept: deptName,
            reason: `الأستاذ مسجل مسبقاً في النظام كـ ${roleTitle} لقسم (${deptName})`,
          });
          continue; // 🚫 منع التكرار نهائياً
        }

        // توليد بريد فريد إذا لم يُكتب
        if (!email) {
          const prefix = role === 'department_head' ? 'head' : 'rap';
          email = generateStrongUniqueEmail(prefix, [...profiles, ...newProfilesToAdd]);
        }
        existingEmails.add(email);

        // 🔑 كلمة المرور
        const password = String(row['كلمة المرور (اختياري)'] || row['كلمة المرور'] || row['الرمز السري'] || '').trim() || generateStrongPassword();

        // ⚧ الجنس
        const rawGender = String(row['الجنس (ذكر / أنثى)'] || row['الجنس'] || '').trim();
        const gender: 'male' | 'female' = rawGender === 'أنثى' ? 'female' : (rawGender === 'ذكر' ? 'male' : detectArabicGender(rawName));

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const newProf: UserProfile = {
          id: `usr-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          full_name: rawName,
          role: role,
          department_id: deptId,
          department_name: deptName,
          university_number: `${role === 'department_head' ? 'HOD' : 'RAP'}-${randomCode}`,
          generated_email: email,
          temp_password: password,
          gender: gender,
          is_active: true,
          must_change_password: false,
          created_at: new Date().toISOString(),
          order_index: 0,
        };

        newProfilesToAdd.push(newProf);
        acceptedList.push({
          name: rawName,
          role: roleTitle,
          dept: deptName,
          email: email,
        });

        // 🏢 تحديث جدول الأقسام
        const deptIdx = updatedDepts.findIndex(d => d.id === deptId);
        if (deptIdx !== -1) {
          if (role === 'department_head') {
            updatedDepts[deptIdx] = {
              ...updatedDepts[deptIdx],
              head_id: newProf.id,
              head_name: newProf.full_name,
              head_email: newProf.generated_email,
            };
          } else {
            updatedDepts[deptIdx] = {
              ...updatedDepts[deptIdx],
              rapporteur_id: newProf.id,
              rapporteur_name: newProf.full_name,
              rapporteur_email: newProf.generated_email,
            };
          }
        }
      }

      // 💾 حفظ المقبولين فقط في قاعدة البيانات
      if (newProfilesToAdd.length > 0) {
        const combined = [...newProfilesToAdd, ...profiles];
        setProfiles(combined);
        saveStoredData('profiles', combined);

        setDepartments(updatedDepts);
        saveStoredData('departments', updatedDepts);
      }

      // 📇 فتح نافذة التقرير الشامل للمستخدم
      setImportReport({
        totalRows: rows.length,
        accepted: acceptedList,
        duplicates: duplicateList,
        rejected: rejectedList,
      });

      if (acceptedList.length > 0) {
        setActiveReportTab('accepted');
      } else if (duplicateList.length > 0) {
        setActiveReportTab('duplicates');
      } else {
        setActiveReportTab('rejected');
      }

    } catch (err) {
      console.error('خطأ أثناء قراءة ملف Excel:', err);
      setErrorMessage('حدث خطأ أثناء قراءة ملف Excel. يرجى التأكد من استخدام النموذج المعتمد.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsImportingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectedDepartmentObj = departments.find(d => d.id === selectedDeptId);

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف رئيس قسم أو مقرر */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                <p className="font-black text-sm text-slate-950 mt-0.5">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ تنبيه الخطأ العائم الفاخر (Light Mode أبيض ناصع) */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-rose-500/80 ring-4 ring-rose-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl shadow-2xs shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">تنبيه النظام الأكاديمي</h4>
                <p className="font-black text-sm text-slate-950 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ الهيدر الكحلي الإداري الترحيبي بحدود ناعمة */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
            <Image src="/logo.webp" alt="جامعة الإمام جعفر الصادق" width={64} height={64} className="object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-black text-sm rounded-lg">
                صلاحية المسؤول العام
              </span>
              <span className="px-3 py-0.5 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-lg flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(getAcademicYear())}</bdi></span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2 mt-1">
              <ShieldCheck className="w-6 h-6 text-slate-900" />
              <span>إدارة رؤساء الأقسام والمقررين (ربط القيادات بالـ {departments.length} قسماً)</span>
            </h1>
            <p className="text-sm text-slate-950 font-black mt-1">
              جامعة الإمام جعفر الصادق (ع) - فرع ميسان | تعيين وتعديل وحذف القيادات وربطهم بالأقسام
            </p>
          </div>
        </div>

        {/* 🔙 روابط العودة السريعة */}
        <div className="flex items-center gap-2">
          <Link
            href="/sadmin/departments"
            className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-xs transition flex items-center gap-1.5 border border-[#1e4570]"
          >
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>إدارة الأقسام ({departments.length})</span>
          </Link>

          <Link
            href="/sadmin/dashboard"
            className="px-4 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black shadow-xs transition flex items-center gap-1.5 border border-[#1e4570]"
          >
            <span>لوحة التحكم الرئيسية</span>
          </Link>
        </div>
      </div>

      {/* 📊 بطاقة إدارة ملفات Excel (تنزيل النموذج واستيراد البيانات) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">إدارة الاستيراد الجماعي عبر ملفات Excel الملونة والمنظمة</h3>
            <p className="text-sm text-slate-950 font-black mt-0.5">
              حقول الأسماء فارغة للبدء الفوري، مع بريد ورمز عشوائي فريد لكل منصب ومنع تام للتكرار
            </p>
          </div>
        </div>

        {/* 🔘 أزرار التنزيل والرفع وإضافة رئيس/مقرر جديد ودليل التعليمات */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFullName('');
              setCustomEmail('');
              setCustomPassword('');
              setSelectedRole('');
              setSelectedDeptId('');
              setSelectedGender(null); // 🚻 ضبط الجنس ليكون غير محدد مسبقاً
              setNameError('');
              setGenderError('');
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#0F2942]"
          >
            <UserPlus className="w-4 h-4 text-cyan-300" />
            <span>إضافة رئيس قسم أو مقرر جديد</span>
          </button>

          {/* 📥 زر تحميل نموذج إكسل المعتمد بالنص المختصر واللون الكحلي الملكي الفاخر */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
          >
            <Download className="w-4 h-4 text-cyan-300" />
            <span>تحميل نموذج Excel المعتمد</span>
          </button>

          {/* 📤 زر استيراد ملف إكسل بدون كلمة 'رفع' وباللون الكحلي الملكي الفاخر */}
          <label className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95">
            <Upload className="w-4 h-4 text-cyan-300" />
            <span>{isImportingExcel ? 'جارٍ فحص واستيراد البيانات...' : 'استيراد ملف Excel للبيانات'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              disabled={isImportingExcel}
              className="hidden"
            />
          </label>

          {/* 📘 زر دليل وتعليمات النموذج باللون الكحلي الملكي الفاخر */}
          <button
            type="button"
            onClick={() => setShowExcelInstructions(true)}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer border border-[#1e4570] shadow-xs active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span>دليل وضوابط النموذج</span>
          </button>

          {/* 🖨️ زر طباعة بطاقات الاعتماد الأكاديمي (الكل / حسب القسم) */}
          <button
            type="button"
            onClick={() => {
              setBatchPrintDeptFilter('all'); // 🌐 تصفير الفلتر للكل افتراضياً
              setSinglePrintProfile(null); // 👤 إلغاء التحديد الفردي لطباعة الكل
              setShowBatchPrintModal(true); // 🖨️ فتح نافذة المعاينة والطباعة
            }}
            className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>طباعة بطاقات الاعتماد (الكل / حسب القسم)</span>
          </button>
        </div>
      </div>


      {/* 📊 نافذة تقرير نتائج استيراد Excel (المقبول والمكرر والمرفوض) */}
      {importReport && (
        <div className="fixed inset-0 w-full h-full min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right max-h-[90vh] overflow-y-auto">
            
            {/* عنوان التقرير */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تقرير نتائج استيراد ملف Excel ({importReport.totalRows} صف تمت معالجته)
                  </h3>
                  <p className="text-sm font-black text-slate-950">
                    تم فحص كافة البيانات والتحقق الصارم من عدم التكرار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* بطاقات الإحصائيات السريعة الثلاث */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* المقبول */}
              <button
                type="button"
                onClick={() => setActiveReportTab('accepted')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'accepted'
                    ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-emerald-950">المقبول والمضاف</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {importReport.accepted.length}
                </div>
              </button>

              {/* المكرر */}
              <button
                type="button"
                onClick={() => setActiveReportTab('duplicates')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'duplicates'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المكرر (المستبعد)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.duplicates.length}
                </div>
              </button>

              {/* المرفوض */}
              <button
                type="button"
                onClick={() => setActiveReportTab('rejected')}
                className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
                  activeReportTab === 'rejected'
                    ? 'bg-rose-100 border-rose-500 shadow-sm ring-2 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-950">المرفوض (بيانات ناقصة)</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  {importReport.rejected.length}
                </div>
              </button>

            </div>

            {/* تفاصيل التبويب النشط */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
              
              {activeReportTab === 'accepted' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>قائمة الحسابات التي تم قبولها وإضافتها لقاعدة البيانات بنجاح:</span>
                  </h4>
                  {importReport.accepted.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد صفوف مقبولة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.accepted.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">{item.name}</span>
                            <span className="text-slate-950 font-black mx-1.5">•</span>
                            <span className="text-indigo-950">{item.role}</span>
                            <span className="text-slate-950 font-black mx-1.5">•</span>
                            <span className="text-slate-950 font-black">{item.dept}</span>
                          </div>
                          <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" dir="ltr">
                            {item.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'duplicates' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الحسابات التي تم منعها واستبعادها لوجود تكرار:</span>
                  </h4>
                  {importReport.duplicates.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">رائع! لم يتم رصد أي حسابات مكررة في الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.duplicates.map((item, idx) => (
                        <div key={idx} className="py-2.5 space-y-1 text-sm font-black">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-950 font-black">{item.name} ({item.role} - {item.dept})</span>
                            <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs">
                              تم منعه منعاً للتكرار
                            </span>
                          </div>
                          <p className="text-xs text-rose-900 font-bold">
                            السبب: {item.reason} {item.email !== '—' && `(${item.email})`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'rejected' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>قائمة الصفوف المرفوضة لعدم صلاحية أو اكتمال البيانات:</span>
                  </h4>
                  {importReport.rejected.length === 0 ? (
                    <p className="text-sm text-slate-950 font-black py-2">لا يوجد أي صفوف مرفوضة في هذا الملف.</p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {importReport.rejected.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-2 text-sm font-black">
                          <div>
                            <span className="text-slate-950 font-black">الصف رقم {item.rowNumber}: </span>
                            <span className="text-slate-950 font-black">{item.rawName}</span>
                          </div>
                          <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-xs font-black">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* زر الإغلاق */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition cursor-pointer shadow-xs border border-[#1e4570]"
              >
                إغلاق التقرير ومتابعة العمل
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🏛️ 🎛️ الكارد العائم لإضافة وتعديل رئيس القسم والمقرر وربطه بالقسم (Floating Full CRUD Modal) */}
      {showAddModal && (
        <div className="fixed inset-0 w-full h-full min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 text-right overflow-hidden relative">
            
            {/* 📌 رأس الكارد العائم الثابت في الأعلى */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 shrink-0 bg-white/95 z-30">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <UserPlus className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    {editingId ? 'تعديل بيانات الحساب الإداري وتغيير القسم' : 'إضافة رئيس قسم أو مقرر جديد وربطه بالقسم'}
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان | إدارة وتعيين القيادات الأكاديمية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setFullName('');
                  setCustomEmail('');
                  setCustomPassword('');
                  setShowHeadPassword(false);
                  setSelectedGender(null); // 🚻 تصفير الجنس عند الإغلاق ليبقى غير محدد مسبقاً
                  setGenderError(''); // 🧹 تنظيف تنبيه خطأ الجنس
                }}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 📝 نموذج الإدخال مع التمرير الداخلي السلس */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
                
                {/* ⚡ شريط التوليد التلقائي للبريد والرمز المعقد */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-slate-800 font-bold">
                    يمكنك التوليد التلقائي لبريد أكاديمي رسمي ورمز دخول معقد فريد 100%:
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCredentials}
                    className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer whitespace-nowrap border border-[#1e4570]"
                  >
                    <Key className="w-4 h-4 text-cyan-300" />
                    <span>توليد بريد ورمز معقد تلقائياً (بدون تكرار)</span>
                  </button>
                </div>

                {/* شبكة الحقول المنظمة والواضحة */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start overflow-visible">
                  
                  {/* 👤 الاسم الكامل (7 أعمدة) */}
                  <div className="space-y-1.5 sm:col-span-7">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-slate-950 block">الاسم الثلاثي واللقب الأكاديمي *</label>
                      {nameError && (
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                          {nameError}
                        </span>
                      )}
                    </div>
                    {/* 👤 حقل إدخال الاسم الكامل مع تلميح رصاصي أنيق وخط معتدل وفحص الجنس الذكي */}
                    <input
                      type="text" // 🔤 حقل نصي عادي للاسم
                      required // ⚠️ الحقل إجباري ما يصير يعبر فارغ
                      value={fullName} // 💾 قيمة الاسم المرتبطة بالحالة
                      onChange={(e) => { // 🔄 تحديث الاسم وتصفير الخطأ بدون تغيير الجنس تلقائياً
                        const val = e.target.value; // 📝 الاسم المكتوب
                        setFullName(val); // ✍️ حفظ القيمة المدخلة
                        if (nameError) setNameError(''); // 🧹 تنظيف رسالة الخطأ إذا كانت طالعة
                      }}
                      placeholder="مثال: أ.م.د. علي حسن الموسوي" // 💡 مثال توضيحي للمستخدم
                      className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:outline-none transition ${
                        nameError ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:border-indigo-600'
                      }`} // 🎨 رصاصي راقي للتلميح ونص أسود عريض للمدخلات
                    />
                  </div>

                  {/* 🎭 الدور والموقع الإداري (5 أعمدة) */}
                  <div className="sm:col-span-5">
                    <SmartRoleSelect
                      value={selectedRole}
                      onChange={(role) => setSelectedRole(role)}
                    />
                  </div>

                  {/* 🚻 تحديد الجنس (ذكر / أنثى) بالهوية الكحلية الملكية الموحدة */}
                  <div className="space-y-1.5 sm:col-span-12">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-slate-950 block">الجنس الأكاديمي (ذكر / أنثى) *</label>
                      {genderError && (
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                          {genderError}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 border border-slate-300 rounded-2xl">
                      {/* 👤 زر اختيار ذكر بأيقونة SVG وباللون الكحلي الملكي الموحد */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGender('male');
                          setGenderError('');
                        }}
                        className={`py-2.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 shadow-2xs ${
                          selectedGender === 'male'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] ring-2 ring-[#0F2942]/20 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-4.5 h-4.5 shrink-0" />
                        <span>ذكر (مسؤول أكاديمي)</span>
                        {selectedGender === 'male' && <Check className="w-4 h-4 text-cyan-200" />}
                      </button>

                      {/* 👤 زر اختيار أنثى بأيقونة SVG وباللون الكحلي الملكي الموحد */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGender('female');
                          setGenderError('');
                        }}
                        className={`py-2.5 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 shadow-2xs ${
                          selectedGender === 'female'
                            ? 'bg-[#0F2942] text-white border-[#0F2942] ring-2 ring-[#0F2942]/20 shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-4.5 h-4.5 shrink-0" />
                        <span>أنثى (مسؤولة أكاديمية)</span>
                        {selectedGender === 'female' && <Check className="w-4 h-4 text-cyan-200" />}
                      </button>
                    </div>
                  </div>

                  {/* 🏢 القسم الأكاديمي المرتبط (12 عمود كامل لظهور الأسماء كاملة بدون أي اختصار) */}
                  <div className="sm:col-span-12">
                    <SmartDepartmentSelect
                      departments={departments}
                      value={selectedDeptId}
                      onChange={(deptId) => setSelectedDeptId(deptId)}
                    />
                  </div>

                  {/* ✉️ البريد الأكاديمي (6 أعمدة مع زر توليد علوي خاص به) */}
                  <div className="space-y-1.5 sm:col-span-6">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-black text-slate-950 block">البريد الأكاديمي (اختياري)</label>
                      <button
                        type="button"
                        onClick={handleGenerateUniqueEmail}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد بريد أكاديمي رسمي فريد 100% غير مكرر"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-700" />
                        <span>توليد بريد فريد</span>
                      </button>
                    </div>
                    {/* ✉️ مربع البريد باتجاه ذكي وتلميح رصاصي احترافي ما يقلب الكلام */}
                    <input
                      type="text" // 🔤 نوع الحقل نصي
                      value={customEmail} // 💾 ربط القيمة بحالة البريد
                      onChange={(e) => { // 🔄 تحديث البريد وتصفير التنبيه
                        setCustomEmail(e.target.value); // ✍️ حفظ البريد الجديد
                        setNameError(''); // 🧹 تصفير الخطأ
                      }}
                      placeholder="مثال: head.cce@sadiq.edu.iq أو اضغط زر التوليد أعلاه" // 💡 نص التلميح التوضيحي
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:border-indigo-600 focus:outline-none transition" // 🎨 لون رصاصي جميل وتصميم فخم
                      dir={customEmail ? "ltr" : "rtl"} // 🧭 اتجاه ذكي: عربي باليمين للتلميح وإنجليزي باليسار للكتابة
                    />
                  </div>

                  {/* 🔑 كلمة المرور (6 أعمدة مع زر توليد علوي خاص به) */}
                  <div className="space-y-1.5 sm:col-span-6">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-black text-slate-950 block">الرمز السري / كلمة المرور (اختياري)</label>
                      <button
                        type="button"
                        onClick={handleGenerateUniquePassword}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="توليد رمز سري عشوائي قوي جداً وفريد 100% غير مكرر داخل قاعدة البيانات"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                        <span>توليد رمز عشوائي قوي</span>
                      </button>
                    </div>
                    {/* 🔑 مربع الرمز السري باتجاه ذكي وتلميح رصاصي مرتب مع زر العين SVG */}
                    <div className="relative">
                      <input
                        type={showHeadPassword ? 'text' : 'password'} // 🔤 نوع الحقل مقنع بنجوم للأمان أو نص صريح
                        value={customPassword} // 💾 قيمة الرمز السري
                        onChange={(e) => setCustomPassword(e.target.value)} // 🔄 تحديث الرمز
                        placeholder="مثال: Sadiq#Admin2026! أو اضغط زر التوليد أعلاه" // 💡 نص التلميح
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-400 placeholder:font-medium focus:border-indigo-600 focus:outline-none transition" // 🎨 تلميح رصاصي بدون ما يغث العين
                        dir="ltr" // 🧭 اتجاه إنجليزي لكلمات المرور
                      />
                      {/* 👁️ زر إظهار وإخفاء الرمز السري بأيقونة SVG نقية */}
                      <button
                        type="button"
                        onClick={() => setShowHeadPassword((prev) => !prev)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200/70 transition cursor-pointer flex items-center justify-center"
                        title={showHeadPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                        aria-label={showHeadPassword ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                      >
                        {showHeadPassword ? (
                          <EyeOff className="w-5 h-5 text-slate-700" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-700" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ⚠️ شريط تنبيه فرادة البريد يمتد بكامل عرض الكارد (12 عمود) بحجم خط متوسط وأيقونة SVG نقية */}
                  {customEmail.trim() && !checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).isUnique && (
                    <div className="col-span-1 sm:col-span-12 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200">
                      <div className="p-2 bg-rose-200/70 text-rose-700 rounded-xl shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                        {checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).errorMessage}
                      </p>
                    </div>
                  )}

                  {/* 🛡️ صندوق معايير وشروط كلمة المرور الأكاديمية التفاعلي الموحد */}
                  {customPassword && (
                    <div className="col-span-1 sm:col-span-12">
                      <AcademicPasswordStrengthBox password={customPassword} />
                    </div>
                  )}

                </div>
              </div>

              {/* 📌 فوتر الكارد العائم الثابت في الأسفل */}
              <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50/95 shrink-0 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    setFullName('');
                    setCustomEmail('');
                    setCustomPassword('');
                    setShowHeadPassword(false);
                    setSelectedGender(null); // 🚻 تصفير الجنس عند الإلغاء ليبقى غير محدد مسبقاً
                    setGenderError(''); // 🧹 تنظيف تنبيه الجنس
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={Boolean(customEmail.trim() && !checkEmailUniquenessAcrossSystem(customEmail, editingId || undefined, profiles).isUnique)}
                  className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm shadow-xs transition flex items-center gap-2 cursor-pointer border border-[#0F2942] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="w-4 h-4 text-cyan-200" />
                  <span>{editingId ? 'حفظ التعديلات' : 'توليد الحساب وربطه بالقسم'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ⚠️ نافذة تأكيد استبدال رئيس القسم أو المقرر الحالي */}
      {replaceModalData && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-3 sm:p-6 overflow-hidden">
          <div className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col space-y-5 animate-in zoom-in-95 duration-200 text-right overflow-y-auto overscroll-contain">
            
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-100 text-rose-900 rounded-2xl shrink-0 border border-rose-300">
                <AlertCircle className="w-7 h-7 text-rose-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950">
                  تأكيد استبدال {replaceModalData.roleTitle}
                </h3>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  قسم <strong className="text-indigo-950 font-black font-extrabold">({replaceModalData.deptName})</strong> لديه حالياً {replaceModalData.roleTitle} وهو:
                </p>
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-950 font-black text-sm my-2">
                  {replaceModalData.existingLeader.full_name} ({replaceModalData.existingLeader.generated_email})
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  هل تريد استبداله وتعيين <strong className="text-emerald-800 font-black">({replaceModalData.newProfileData.fullName})</strong> كـ {replaceModalData.roleTitle} الجديد للقسم؟
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReplaceModalData(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer"
              >
                إلغاء التغيير
              </button>

              <button
                type="button"
                onClick={() => {
                  executeProfileSave(
                    replaceModalData.newProfileData.fullName,
                    replaceModalData.newProfileData.role,
                    replaceModalData.newProfileData.deptId,
                    replaceModalData.newProfileData.email,
                    replaceModalData.newProfileData.password,
                    replaceModalData.newProfileData.gender, // 🚻 تمرير جنس المسؤول الأكاديمي
                    replaceModalData.existingLeader.id
                  );
                }}
                className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-indigo-200" />
                <span>نعم، استبدال وتعيين الجديد</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📇 نافذة / بطاقة الاعتماد الأكاديمي المنبثقة عند الإنشاء بالوضع الفاتح الفاخر بحدود ناعمة */}
      {selectedCardProfile && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white text-slate-950 border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-2xl border border-indigo-200">
                  <QrCode className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    بطاقة بيانات الاعتماد الإداري الرسمية
                  </h3>
                  <p className="text-xs font-black text-slate-950">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardProfile(null)}
                className="p-2 text-slate-950 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-black">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-950 text-xs font-black">الاسم الكامل:</span>
                <p className="text-slate-950 font-black text-base">{selectedCardProfile.full_name}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-950 text-xs font-black">الموقع والقسم:</span>
                <p className="text-slate-950 font-black text-sm flex items-center gap-1.5 mt-0.5">
                  {selectedCardProfile.role === 'department_head' ? (
                    <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-slate-950 shrink-0" />
                  )}
                  <span>{selectedCardProfile.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'} — {selectedCardProfile.department_name}</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-950 text-xs font-black">البريد الأكاديمي الإداري:</span>
                <p className="text-blue-950 font-black text-sm select-all font-mono" dir="ltr">{selectedCardProfile.generated_email}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-slate-950 text-xs font-black">كلمة المرور الأكاديمية:</span>
                <p className="text-emerald-800 font-black text-sm select-all font-mono" dir="ltr">{selectedCardProfile.temp_password}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCardProfile(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition cursor-pointer border border-slate-300 hover:border-slate-400 shadow-2xs"
              >
                إغلاق
              </button>

              {/* 🖨️ زر طباعة بطاقة التسليم الفردية المباشرة بتصميم كحلي ملكي مطابق لزر النسخ */}
              <button
                type="button"
                onClick={() => {
                  setSinglePrintProfile(selectedCardProfile); // 👤 ضبط المسؤول المختار للطباعة الفردية
                  setShowBatchPrintModal(true); // 🖨️ فتح نافذة الطباعة المباشرة
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]"
              >
                <Printer className="w-5 h-5 text-cyan-300" />
                <span>طباعة بطاقة التسليم</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                  handleCopyCredentials(
                    `حساب إداري - جامعة الإمام جعفر الصادق (ع) فرع ميسان\nالاسم: ${selectedCardProfile.full_name}\nالدور: ${selectedCardProfile.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'}\nالقسم: ${selectedCardProfile.department_name}\nالبريد: ${selectedCardProfile.generated_email}\nالرمز: ${selectedCardProfile.temp_password}\nرابط الدخول: ${currentOrigin}/admin`,
                    selectedCardProfile.id
                  );
                }}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]"
              >
                {copiedId === selectedCardProfile.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-300" />}
                <span>{copiedId === selectedCardProfile.id ? 'تم نسخ البيانات!' : 'نسخ بيانات الحساب بالكامل'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 القسم السفلي: جدول الحسابات الإدارية المسجلة مع شريط الترتيب والفرز */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* 🔍 شريط البحث والإحصائية والفلترة */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-700" />
              <span>قائمة رؤساء الأقسام والمقررين المعتمدين</span>
              <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-950 text-sm font-black border border-slate-300">
                {sortedProfiles.length} حساب
              </span>
            </h2>
            <p className="text-sm text-slate-950 font-black mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>يمكنك تخصيص الترتيب، أو الفرز واستخدام أزرار التقديم والتأخير</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-950 rounded-lg text-xs font-black shadow-2xs border border-slate-300">
                <ArrowUp className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <ArrowDown className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              </span>
              <span>لنقل أي حساب في القائمة</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* فلترة بالدور (قائمة منسدلة مخصصة محصورة داخل الشاشة) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-sm font-black text-slate-950 hover:bg-slate-100 transition cursor-pointer"
              >
                <Filter className="w-4 h-4 text-slate-950" />
                <span>
                  {filterRole === 'ALL' ? 'كافة القيادات (رؤساء ومقررين)' : filterRole === 'department_head' ? 'رؤساء الأقسام فقط' : 'مقررو الأقسام فقط'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-950 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute top-full mt-1.5 right-0 bg-white border border-slate-300 rounded-2xl shadow-xl z-50 w-56 overflow-hidden py-1 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterRole('ALL');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                      filterRole === 'ALL' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                    }`}
                  >
                    <span>كافة القيادات (رؤساء ومقررين)</span>
                    {filterRole === 'ALL' && <Check className="w-4 h-4 text-indigo-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterRole('department_head');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                      filterRole === 'department_head' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                    }`}
                  >
                    <span>رؤساء الأقسام فقط</span>
                    {filterRole === 'department_head' && <Check className="w-4 h-4 text-indigo-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterRole('rapporteur');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-right text-sm font-black flex items-center justify-between transition hover:bg-indigo-50 cursor-pointer ${
                      filterRole === 'rapporteur' ? 'bg-indigo-100 text-indigo-950' : 'text-slate-950'
                    }`}
                  >
                    <span>مقررو الأقسام فقط</span>
                    {filterRole === 'rapporteur' && <Check className="w-4 h-4 text-indigo-700" />}
                  </button>
                </div>
              )}
            </div>

            {/* حقل البحث */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-950" />
              {/* 🔍 حقل البحث في جدول المسؤولين مع تلميح رصاصي جميل */}
              <input
                type="text" // 🔤 حقل نصي للبحث
                value={searchQuery} // 💾 قيمة كلمة البحث
                onChange={(e) => setSearchQuery(e.target.value)} // 🔄 تصفية الجدول ويا الكتابة
                placeholder="بحث بالاسم أو القسم أو البريد..." // 💡 نص التلميح
                className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-slate-900" // 🎨 تلميح رصاصي slate-400
              />
            </div>
          </div>
        </div>

        {/* 🔄 أزرار الترتيب */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <SlidersHorizontal className="w-4 h-4 text-slate-900" />
            <span>نمط الترتيب:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSortMode('custom')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'custom'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>ترتيب يدوي مخصص (الافتراضي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('newest')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'newest'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>الأحدث أولاً</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('name_asc')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'name_asc'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>أبجدياً (أ - ي)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortMode('dept_asc')}
              className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                sortMode === 'dept_asc'
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>حسب القسم</span>
            </button>

            {/* 🏛️ القائمة المنسدلة الذكية لاختيار القسم وتصفيته بالترتيب */}
            <SmartDepartmentFilterSelect
              departments={departments}
              profiles={profiles}
              value={selectedDeptFilter}
              onChange={(val) => setSelectedDeptFilter(val)}
            />
          </div>
        </div>

        {/* ⚠️ شريط ذكي لكشف الحسابات المشتركة بنفس البريد وحلها تلقائياً للقيادات */}
        {(() => {
          const leadershipProfiles = profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur');
          const currentDuplicates = detectDuplicateEmails(leadershipProfiles);
          if (currentDuplicates.length === 0) return null;

          return (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-950 shadow-xs animate-in fade-in duration-200 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-200/60 text-rose-700 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-rose-950">
                    تنبيه أمني: يوجد ({currentDuplicates.length}) بريد أكاديمي مكرر لأكثر من مسؤول قسم في الكلية!
                  </h4>
                  <p className="text-xs font-black text-rose-800 mt-0.5">
                    البريد ({currentDuplicates.map((d) => d.email).join(', ')}) مشترك بين: {currentDuplicates.flatMap((d) => d.profiles.map((p) => p.full_name)).join(' و ')}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFixDuplicateEmails}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4 text-rose-200" />
                <span>فصل الحسابات وتوليد بريد فريد فوراً ⚡</span>
              </button>
            </div>
          );
        })()}

        {/* 🎛️ شريط الإجراءات الجماعية الفاخر لمسؤولي ورؤساء الأقسام */}
        {selectedLeaderIds.length > 0 && (
          <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-white">
                  تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedLeaderIds.length})</strong> من أصل <span className="font-mono text-slate-300">({sortedProfiles.length})</span> من القيادات الإدارية
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف وفك ارتباط المحدد ({selectedLeaderIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkExportExcel(sortedProfiles)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تصدير المحدد Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLeaderIds([])}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* 📊 جدول الحسابات الإدارية */}
        {sortedProfiles.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                <UserCheck className="w-7 h-7 text-indigo-900" />
              </div>
              <h4 className="text-xl font-black text-slate-950">
                {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0
                  ? 'لا توجد قيادات أكاديمية مسجلة حتى الآن'
                  : 'لم يتم العثور على أي حساب مطابق'}
              </h4>
              <p className="text-sm font-black text-slate-950 leading-relaxed">
                {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0
                  ? 'يمكنك تعيين رؤساء الأقسام والمقررين وتوليد بيانات دخولهم، أو استيراد القوائم دفعة واحدة من ملف Excel.'
                  : 'يرجى مراجعة محددات التصفية أو كلمة البحث.'}
              </p>
              {profiles.filter((p) => p.role === 'department_head' || p.role === 'rapporteur').length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFullName('');
                      setCustomEmail('');
                      setCustomPassword('');
                      setSelectedGender(null); // 🚻 ضبط الجنس ليكون غير محدد مسبقاً
                      setGenderError('');
                      setEditingId(null);
                      setShowAddModal(true);
                    }}
                    className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[#0F2942]"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-300" />
                    <span>إضافة رئيس قسم أو مقرر</span>
                  </button>
                  <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
                    <Download className="w-4 h-4 text-white" />
                    <span>استيراد من Excel</span>
                    <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} disabled={isImportingExcel} className="hidden" />
                  </label>
                </div>
              )}

              {selectedDeptFilter !== 'ALL' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDeptFilter('ALL')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 text-sm font-black rounded-xl transition cursor-pointer border border-slate-300"
                  >
                    إلغاء تصفية القسم وعرض كافة القيادات
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 📋 جدول رؤساء الأقسام والمقررين الموحد والملكي مع نظام الصفحات */
          (() => {
            const totalLeadersCount = sortedProfiles.length;
            const totalPages = Math.max(1, Math.ceil(totalLeadersCount / pageSize));
            const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
            const startIndex = (safeCurrentPage - 1) * pageSize;
            const paginatedLeaders = sortedProfiles.slice(startIndex, startIndex + pageSize);

            return (
              <div className="overflow-hidden rounded-3xl border border-slate-300 shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-base font-black">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-950 font-black text-base">
                        <th className="p-4 text-center w-12 whitespace-nowrap text-base">
                          <input
                            type="checkbox"
                            aria-label="تحديد كافة المسؤولين المعروضين"
                            checked={selectedLeaderIds.length === sortedProfiles.length && sortedProfiles.length > 0}
                            onChange={() => toggleSelectAll(sortedProfiles)}
                            className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                          />
                        </th>
                        <th className="p-4 text-center w-16 whitespace-nowrap text-base">#</th>
                        <th className="p-4 whitespace-nowrap text-base min-w-[200px]">الاسم الأكاديمي الكامل</th>
                        <th className="p-4 text-center whitespace-nowrap text-base w-32">الجنس</th>
                        <th className="p-4 text-center whitespace-nowrap text-base w-40">الموقع الإداري</th>
                        <th className="p-4 whitespace-nowrap text-base min-w-[180px]">القسم العلمي المرتبط</th>
                        <th className="p-4 text-center whitespace-nowrap text-base">طلبة القسم (ذكور / إناث)</th>
                        <th className="p-4 text-center whitespace-nowrap text-base">كادر القسم (ذكور / إناث)</th>
                        <th className="p-4 text-center whitespace-nowrap text-base w-32">الترتيب</th>
                        <th className="p-4 text-center whitespace-nowrap text-base w-36">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-black text-slate-950 text-base">
                      {paginatedLeaders.map((p, index) => {
                        const pGender = p.gender || detectArabicGender(p.full_name);
                        const globalIndex = startIndex + index + 1;
                        const isFirst = (startIndex + index) === 0;
                        const isLast = (startIndex + index) === sortedProfiles.length - 1;
                        const isSelected = selectedLeaderIds.includes(p.id);

                        return (
                          <tr key={p.id} className={`${isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'} transition`}>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                aria-label={`تحديد ${p.full_name}`}
                                checked={isSelected}
                                onChange={() => toggleSelect(p.id)}
                                className="w-5 h-5 rounded-md border-2 border-slate-400 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]"
                              />
                            </td>
                            <td className="p-4 text-center font-mono font-black text-slate-950 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-xl text-base shadow-2xs">
                                {globalIndex}
                              </span>
                            </td>
                            
                            {/* 👤 الاسم الأكاديمي مع الأفاتار */}
                            <td className="p-4 font-black text-slate-950 text-base whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                  pGender === 'female' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                                }`}>
                                  {p.role === 'department_head' ? <Building2 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                </div>
                                <span className="font-black text-slate-950 text-base">{p.full_name}</span>
                              </div>
                            </td>

                            {/* ⚧ الجنس */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-xl text-sm font-black border inline-block ${ pGender === 'female' ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-blue-100 text-blue-950 border-blue-300' }`}>
                                {pGender === 'female' ? 'أنثى' : 'ذكر'}
                              </span>
                            </td>

                            {/* 🏛️ الموقع الإداري (موحد بالكحلي الملكي الفاخر لرئيس القسم ومقرر القسم) */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-black border bg-[#0F2942] text-white border-[#1e4570] shadow-xs">
                                {p.role === 'department_head' ? (
                                  <Building2 className="w-4 h-4 text-cyan-300 shrink-0" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-cyan-300 shrink-0" />
                                )}
                                <span>
                                  {p.role === 'department_head'
                                    ? (pGender === 'female' ? 'رئيسة قسم' : 'رئيس قسم')
                                    : (pGender === 'female' ? 'مقررة قسم' : 'مقرر قسم')}
                                </span>
                              </div>
                            </td>

                            {/* 🏢 القسم المرتبط */}
                            <td className="p-4 text-slate-950 font-black text-base whitespace-nowrap">
                              <span className="px-3 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-sm font-black inline-block">
                                {p.department_name || 'غير مرتبط'}
                              </span>
                            </td>
                            
                            {/* 👥 إحصائية طلبة القسم */}
                            <td className="p-4 text-center whitespace-nowrap">
                              {(() => {
                                const deptStudents = profiles.filter(
                                  (s) => s.role === 'student' && (s.department_id === p.department_id || s.department_name === p.department_name)
                                );
                                const males = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
                                const females = deptStudents.length - males;

                                return (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="font-black text-slate-950 text-sm">{deptStudents.length} طالب/ـة</span>
                                    <div className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                                      <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-300">{males} ذ</span>
                                      <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">{females} ث</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* 👨‍🏫 إحصائية تدريسيي القسم */}
                            <td className="p-4 text-center whitespace-nowrap">
                              {(() => {
                                const deptTeachers = profiles.filter(
                                  (t) => t.role === 'teacher' && (t.department_id === p.department_id || t.department_name === p.department_name)
                                );
                                const tchMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
                                const tchFemales = deptTeachers.length - tchMales;

                                return (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="font-black text-slate-950 text-sm">{deptTeachers.length} تدريسي</span>
                                    <div className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                                      <span className="text-blue-950 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-300">{tchMales} ذ</span>
                                      <span className="text-rose-950 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">{tchFemales} ث</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* 🎛️ أزرار التقديم والتأخير */}
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleMoveHead(startIndex + index, 'up', e)}
                                  disabled={isFirst}
                                  title="تقديم الحساب للأعلى"
                                  className={`p-2 rounded-xl border transition cursor-pointer ${
                                    isFirst
                                      ? 'bg-slate-100 text-slate-950 opacity-30 border-slate-200 cursor-not-allowed'
                                      : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                                  }`}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleMoveHead(startIndex + index, 'down', e)}
                                  disabled={isLast}
                                  title="تأخير الحساب للأسفل"
                                  className={`p-2 rounded-xl border transition cursor-pointer ${
                                    isLast
                                      ? 'bg-slate-100 text-slate-950 opacity-30 border-slate-200 cursor-not-allowed'
                                      : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs'
                                  }`}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                            {/* ⚙️ الإجراءات */}
                            <td className="p-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                
                                {/* 📇 عرض البطاقة ونسخ الحساب */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCardProfile(p)}
                                  className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white rounded-xl text-slate-950 transition cursor-pointer border border-slate-300 shadow-2xs"
                                  title="عرض ونسخ بيانات الدخول"
                                >
                                  <QrCode className="w-5 h-5" />
                                </button>

                                {/* 🖨️ طباعة بطاقة تسليم الحساب الرسمية */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSinglePrintProfile(p); // 👤 تحديد المسؤول للطباعة الفردية
                                    setShowBatchPrintModal(true); // 🖨️ فتح نافذة المعاينة والطباعة
                                  }}
                                  className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white rounded-xl text-slate-950 transition cursor-pointer border border-slate-300 shadow-2xs"
                                  title="طباعة بطاقة تسليم الحساب الرسمية (PDF)"
                                >
                                  <Printer className="w-5 h-5" />
                                </button>

                                {/* ✏️ تعديل */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setFullName(p.full_name);
                                    setSelectedRole(p.role as 'department_head' | 'rapporteur');
                                    if (p.department_id) setSelectedDeptId(p.department_id);
                                    setCustomEmail(p.generated_email || '');
                                    setCustomPassword(p.temp_password || '');
                                    setSelectedGender(p.gender || null); // 🚻 تحميل جنس المسؤول المخزن فقط بدون تخمين
                                    setGenderError('');
                                    setShowAddModal(true);
                                  }}
                                  className="p-2 bg-slate-100 hover:bg-[#0F2942] hover:text-white text-slate-950 rounded-xl transition cursor-pointer border border-slate-300 shadow-2xs"
                                  title="تعديل البيانات"
                                >
                                  <Edit3 className="w-5 h-5" />
                                </button>

                                {/* 🗑️ حذف */}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id)}
                                  className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-900 rounded-xl transition cursor-pointer border border-rose-200 shadow-2xs"
                                  title="حذف الحساب"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 📄 شريط نظام الصفحات المتقدم مع القائمة المنسدلة المخصصة الاحترافية */}
                {totalLeadersCount > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-black">
                    {/* ملخص العرض */}
                    <div className="text-slate-950 font-black">
                      عرض من <span className="text-slate-950 font-black font-mono">{startIndex + 1}</span> إلى{' '}
                      <span className="text-slate-950 font-black font-mono">
                        {Math.min(startIndex + pageSize, totalLeadersCount)}
                      </span>{' '}
                      من إجمالي <span className="text-slate-950 font-black font-mono">{totalLeadersCount}</span> مسؤول
                    </div>

                    {/* أزرار التنقل والقائمة المنسدلة الاحترافية */}
                    <div className="flex items-center gap-2">
                      
                      {/* 🔽 قائمة حجم الصفحة تفتح للأعلى داخل إطار الشاشة والجدول */}
                      <div className="relative" ref={pageSizeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsPageSizeOpen((prev) => !prev)}
                          className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer shadow-2xs active:scale-95"
                          title="عدد المسؤولين في الصفحة"
                          aria-expanded={isPageSizeOpen}
                        >
                          <span>{pageSize} مسؤولين</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isPageSizeOpen && (
                          <div 
                            className="absolute bottom-full mb-2 right-0 z-50 min-w-[130px] bg-white border border-slate-300 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                            role="menu"
                          >
                            <div className="px-2.5 py-1 text-[11px] font-black text-slate-950 border-b border-slate-200 pb-1.5 mb-1">
                              عرض في الصفحة:
                            </div>
                            {[
                              { value: 5, label: '5 مسؤولين' },
                              { value: 10, label: '10 مسؤولين' },
                              { value: 20, label: '20 مسؤول' },
                              { value: 50, label: '50 مسؤول' },
                            ].map((option) => {
                              const isSelected = pageSize === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setPageSize(option.value);
                                    setCurrentPage(1);
                                    setIsPageSizeOpen(false);
                                  }}
                                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-black transition flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0F2942] text-white shadow-2xs'
                                      : 'text-slate-950 hover:bg-slate-100'
                                  }`}
                                  role="menuitem"
                                >
                                  <span>{option.label}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(1)}
                          disabled={safeCurrentPage <= 1}
                          className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          title="الصفحة الأولى"
                        >
                          <ChevronsRight className="w-4 h-4 text-slate-950" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safeCurrentPage <= 1}
                          className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          title="الصفحة السابقة"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-950" />
                        </button>
                        <div className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs font-mono font-black shadow-2xs">
                          {safeCurrentPage} / {totalPages}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safeCurrentPage >= totalPages}
                          className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          title="الصفحة التالية"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-950" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={safeCurrentPage >= totalPages}
                          className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                          title="الصفحة الأخيرة"
                        >
                          <ChevronsLeft className="w-4 h-4 text-slate-950" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* 🗑️ كارد تأكيد حذف رئيس قسم أو مقرر احترافي فاخر (ConfirmDeleteModal) */}
        <ConfirmDeleteModal
          isOpen={!!deletingLeaderProfile}
          onClose={() => setDeletingLeaderProfile(null)}
          title="تأكيد حذف الحساب الإداري الأكاديمي"
          itemName={deletingLeaderProfile?.full_name || 'حساب إداري'}
          itemDetails={`الموقع: ${deletingLeaderProfile?.role === 'department_head' ? 'رئيس قسم' : 'مقرر قسم'} | ${deletingLeaderProfile?.department_name || ''}`}
          warningMessage="سيتم إزالة الحساب الرسمي وفك ارتباطه من القسم وإلغاء صلاحياته الإدارية نهائياً."
          onConfirm={confirmExecuteDeleteLeader}
        />

        {/* 🗑️ كارد تأكيد الحذف الجماعي لمسؤولي الأقسام */}
        <ConfirmDeleteModal
          isOpen={isBulkDeleting}
          onClose={() => setIsBulkDeleting(false)}
          title={`تأكيد الحذف الجماعي لـ (${selectedLeaderIds.length}) من القيادات الإدارية`}
          itemName={`${selectedLeaderIds.length} من رؤساء ومقرري الأقسام`}
          itemDetails="سيتم حذف الحسابات المحددة وفك ارتباطاتها الإدارية بالأقسام وإلغاء كافة صلاحياتها فوراً."
          warningMessage="تنبيه أمني: هل أنت متأكد من حذف الحسابات الإدارية المحددة دفعة واحدة؟ لا يمكن التراجع عن هذه العملية."
          confirmText={`حذف (${selectedLeaderIds.length}) حسابات نهائياً`}
          onConfirm={confirmBulkDeleteLeaders}
        />

        {/* 📘 كارد تعليمات وضوابط نموذج Excel الفاخر (Floating Card Modal) */}
        <FloatingCrudModal
          isOpen={showExcelInstructions}
          onClose={() => setShowExcelInstructions(false)}
          maxWidth="max-w-3xl"
          title="دليل وضوابط نموذج Excel لرؤساء الأقسام والمقررين"
          subtitle="جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا والربط السحابي"
          icon={<BookOpen className="w-6 h-6 text-white" />}
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2 bg-emerald-50 text-emerald-950 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>نموذج رسمي معتمد وجاهز للاستيراد الفوري</span>
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570]"
                >
                  <Download className="w-4 h-4 text-cyan-300" />
                  <span>تحميل النموذج المعتمد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExcelInstructions(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl cursor-pointer border border-slate-300 text-sm transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-sm font-black">
            {/* 🌟 شبكة بطاقات التعليمات الأكاديمية المنظمة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 📑 كارد 1: هيكلية ورقتي العمل */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-indigo-950 border-b border-slate-200 pb-2">
                  <div className="p-2 bg-indigo-100 text-indigo-900 rounded-xl">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-800" />
                  </div>
                  <h4 className="text-sm font-black text-slate-950">1. ورقتي العمل بالملف (Sheets):</h4>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
                  يحتوي ملف الإكسل على ورقتين رئيسيتين: ورقة بيانات القيادات لتعبئتها، وورقة إرشادية تتضمن قائمة الأقسام العلمية الـ 12 المعتمدة مع أكوادها.
                </p>
              </div>

              {/* ✍️ كارد 2: حقول الأسماء الأكاديمية */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-950 border-b border-slate-200 pb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                    <UserCheck className="w-4 h-4 text-emerald-800" />
                  </div>
                  <h4 className="text-sm font-black text-slate-950">2. الاسم واللقب الأكاديمي:</h4>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
                  عمود الاسم الثلاثي فارغ تماماً لتعبئته مباشرة بأسماء الدكاترة والأساتذة (مثال: أ.د. علي حسين الموسوي) بدون الحاجة لمسح أي أسماء تجريبية.
                </p>
              </div>

              {/* 🔑 كارد 3: الحسابات الموحدة المشفرة */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-blue-950 border-b border-slate-200 pb-2">
                  <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-blue-800" />
                  </div>
                  <h4 className="text-sm font-black text-slate-950">3. البريد وكلمة المرور:</h4>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
                  مولدة مسبقاً لكل قسم برموز مشفرة ومعقدة وفريدة تماماً (@sadiq.edu.iq) وتمنع التكرار نهائياً لضمان أعلى مستويات الأمان الجامعي.
                </p>
              </div>

              {/* 🛡️ كارد 4: نظام فحص واستيراد البيانات */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-950 border-b border-slate-200 pb-2">
                  <div className="p-2 bg-[#0F2942] text-cyan-300 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  </div>
                  <h4 className="text-sm font-black text-slate-950">4. التدقيق ومنع التكرار:</h4>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed">
                  عند رفع واستيراد الملف، يتم فحص السجلات تلقائياً ومطابقتها مع قاعدة بيانات Supabase وعرض تقرير بالمدخلات المعتمدة ورفض أي تكرار.
                </p>
              </div>
            </div>
          </div>
        </FloatingCrudModal>

        {/* 🖨️ نافذة معاينة وطباعة بطاقات اعتماد وتسليم الحسابات (PDF / طباعة فورية) عبر البورتال المباشر */}
        {showBatchPrintModal && isMounted && typeof document !== 'undefined' && createPortal((() => {
          // 📋 فلترة وتجهيز لستة الحسابات الإدارية (رؤساء ومقررين)
          const allLeaders = profiles.filter((p: UserProfile) => p.role === 'department_head' || p.role === 'rapporteur'); // 👥 جلب كل القيادات
          
          // 🎯 تحديد القائمة المستهدفة للطباعة بناءً على خيار الأدمن
          let printList: UserProfile[] = []; // 📝 مصفوفة الطباعة الفارغة بالبداية
          if (singlePrintProfile) { // 👤 إذا داس على طباعة بطاقة فردية لمسؤول واحد
            printList = [singlePrintProfile]; // 📌 نخلي بس حسابه بالقائمة
          } else if (batchPrintDeptFilter === 'all') { // 🌐 إذا اختار طباعة الكل دفعة واحدة
            printList = [...allLeaders]; // 🗂️ ندرج كافة القيادات بكل الأقسام
          } else { // 🏛️ إذا اختار قسم معين (رئيس ومقرر هذا القسم فقط)
            printList = allLeaders.filter( // 🔍 فلترة حسب معرف أو اسم القسم
              (p: UserProfile) => p.department_id === batchPrintDeptFilter || p.department_name === batchPrintDeptFilter // 🏢 مطابقة القسم
            );
          }

          // 🔄 ترتيب البطاقات: حسب القسم أولاً، ورئيس القسم يسبق المقرر داخل نفس القسم
          printList.sort((a: UserProfile, b: UserProfile) => { // 🔤 فرز أبجدي وإداري
            const deptA = a.department_name || ''; // 🏢 اسم قسم الأول
            const deptB = b.department_name || ''; // 🏢 اسم قسم الثاني
            const deptCompare = deptA.localeCompare(deptB, 'ar'); // ⚖️ مقارنة اسم القسم
            if (deptCompare !== 0) return deptCompare; // ↩️ إذا مختلفين رتب بالأقسام
            if (a.role === 'department_head' && b.role !== 'department_head') return -1; // 👑 رئيس القسم يجي قبل المقرر
            if (a.role !== 'department_head' && b.role === 'department_head') return 1; // 📝 المقرر يجي بعد رئيس القسم
            return a.full_name.localeCompare(b.full_name, 'ar'); // 👤 مقارنة بالاسم إذا نفس الدور
          });

          return (
            <div 
              id="printable-modal-portal"
              className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-white print:backdrop-blur-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:block" 
              dir="rtl"
            >
              {/* 📦 الصندوق الرئيسي للمودال بعرض موسع وفخم max-w-7xl */}
              <div className="bg-white border-2 border-slate-400 rounded-3xl w-full max-w-7xl max-h-[94vh] shadow-2xl flex flex-col relative overflow-hidden text-right print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none print:overflow-visible print:static print:block print:h-auto">
                
                {/* 🎛️ شريط الأدوات والتحكم العلوي (مخفي تماماً أثناء الطباعة) */}
                <div className="p-4 sm:p-5 border-b-2 border-slate-300 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 z-10 print:hidden no-print">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#0F2942] text-cyan-300 rounded-2xl shadow-xs">
                      <Printer className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-black flex items-center gap-2">
                        <span>معاينة وطباعة بطاقات اعتماد القيادات الأكاديمية</span>
                        <span className="px-3 py-1 rounded-full bg-slate-200 text-black text-xs font-black border border-slate-300 whitespace-nowrap shrink-0 inline-block">
                          {printList.length} بطاقة (10 بطاقات بالورقة الواحدة A4)
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm font-black text-black">
                        شبكة ثنائية 2x5 فائقة الكفاءة ومضغوطة لتوفير استهلاك الأوراق
                      </p>
                    </div>
                  </div>

                  {/* 🎯 عناصر التحكم والفلترة وزر الطباعة الموحد */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* 🏛️ القائمة المنسدلة الاحترافية لاختيار القسم العلمي */}
                    {!singlePrintProfile && (
                      <div className="relative" ref={printDeptDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsPrintDeptDropdownOpen(!isPrintDeptDropdownOpen)}
                          className="flex items-center gap-2.5 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-2xl border-2 border-slate-400 text-xs sm:text-sm font-black text-black shadow-xs transition cursor-pointer select-none"
                        >
                          <Building2 className="w-4 h-4 text-indigo-950 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[260px]">
                            {batchPrintDeptFilter === 'all'
                              ? `كافة الأقسام (الكل - ${allLeaders.length} بطاقة)`
                              : (departments.find((d: Department) => d.id === batchPrintDeptFilter || d.name === batchPrintDeptFilter)?.name || batchPrintDeptFilter)}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 shrink-0 ${isPrintDeptDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* قائمة الأقسام العائمة ذات التصميم الاحترافي الفاخر */}
                        {isPrintDeptDropdownOpen && (
                          <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right max-h-72 overflow-y-auto">
                            {/* خيار كافة الأقسام */}
                            <button
                              type="button"
                              onClick={() => {
                                setBatchPrintDeptFilter('all');
                                setIsPrintDeptDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                                batchPrintDeptFilter === 'all'
                                  ? 'bg-[#0F2942] text-white'
                                  : 'text-black hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className={`w-4 h-4 ${batchPrintDeptFilter === 'all' ? 'text-cyan-300' : 'text-indigo-950'}`} />
                                <span>كافة الأقسام (طباعة الكل دفعة واحدة)</span>
                              </div>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                                batchPrintDeptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-black'
                              }`}>
                                {allLeaders.length}
                              </span>
                            </button>

                            <div className="my-1 border-t border-slate-200" />

                            {/* قائمة الأقسام الفرعية */}
                            {departments.map((dept: Department) => {
                              const deptLeadersCount = allLeaders.filter(
                                (l: UserProfile) => l.department_id === dept.id || l.department_name === dept.name
                              ).length;
                              const isSelected = batchPrintDeptFilter === dept.id || batchPrintDeptFilter === dept.name;

                              return (
                                <button
                                  key={dept.id}
                                  type="button"
                                  onClick={() => {
                                    setBatchPrintDeptFilter(dept.id);
                                    setIsPrintDeptDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-right text-xs sm:text-sm font-black flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0F2942] text-white'
                                      : 'text-black hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-indigo-950'}`} />
                                    <span className="truncate">{dept.name}</span>
                                  </div>
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-black'
                                  }`}>
                                    {deptLeadersCount} قيادات
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 🔄 زر الرجوع لعرض كافة الأقسام إذا كانت المعاينة لبطاقة فردية */}
                    {singlePrintProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSinglePrintProfile(null); // 👤 تصفير البطاقة الفردية
                          setBatchPrintDeptFilter('all'); // 🌐 إرجاع الفلتر للكل
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border-2 border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 text-black" />
                        <span>عرض وطباعة كافة القيادات ({allLeaders.length})</span>
                      </button>
                    )}

                    {/* 🖨️ زر طباعة الكل بزر واحد / طباعة البطاقات الآن */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      disabled={printList.length === 0}
                      className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] disabled:bg-slate-300 text-white rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 shadow-xs cursor-pointer border border-[#1e4570] active:scale-95"
                    >
                      <Printer className="w-4 h-4 text-cyan-300" />
                      <span>{printList.length === allLeaders.length ? 'طباعة الكل بزر واحد' : 'طباعة الآن'} ({printList.length})</span>
                    </button>

                    {/* ✖️ زر إغلاق نافذة المعاينة والطباعة */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowBatchPrintModal(false); // 🔒 إغلاق النافذة
                        setSinglePrintProfile(null); // 👤 مسح التحديد الفردي
                        setIsPrintDeptDropdownOpen(false); // 🔒 إغلاق القائمة
                      }}
                      className="p-2.5 bg-slate-200 hover:bg-slate-300 text-black rounded-2xl transition cursor-pointer"
                      title="إغلاق"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 📜 منطقة المعاينة والطباعة الرسمية المتوافقة مع ورق A4 وبعرض ممتد */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain printable-batch-area bg-slate-100 print:bg-white print:p-0 print:overflow-visible print:static print:block print:h-auto">
                  {printList.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-300 space-y-3 my-6">
                      <AlertCircle className="w-10 h-10 text-indigo-950 mx-auto" />
                      <p className="text-base font-black text-black">لا توجد حسابات قيادية مسجلة تطابق القسم المختار حالياً.</p>
                      <p className="text-sm font-black text-black">يرجى اختيار قسم آخر أو طباعة كافة الأقسام.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:grid-cols-2 print:gap-1 w-full cards-grid-8 max-w-5xl mx-auto">
                      {printList.map((leader: UserProfile, index: number) => {
                        // 🔐 رابط البوابة الأكاديمية الرسمي للدخول (ديناميكي يتكيف مع الدومين والاستضافة تلقائياً)
                        const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://192.168.0.185:3000';
                        const loginPortalUrl = `${currentOrigin}/admin`; // 🌐 رابط لوحة الإدارة
                        const loginPortalCleanUrl = loginPortalUrl.replace(/^https?:\/\//, ''); // 🌐 الرابط النظيف المباشر
                        const isDeptHead = leader.role === 'department_head'; // 🏢 هل هو رئيس قسم؟
                        const isFemale = leader.gender === 'female'; // 🚻 هل المسؤول أنثى؟
                        const roleArabicTitle = isDeptHead // 🏷️ المسمى الوظيفي بالعربية الفصحى
                          ? (isFemale ? 'رئيسة القسم العلمي' : 'رئيس القسم العلمي')
                          : (isFemale ? 'مقررة القسم العلمي' : 'مقرر القسم العلمي');

                        return (
                          <div
                            key={leader.id || index} // 🔑 مفتاح فريد لكل كارد قيادي بالرندر
                            className="bg-white border border-slate-400 rounded-xl p-2 print:p-1.5 shadow-xs break-inside-avoid print:break-inside-avoid print:border print:border-slate-500 print:rounded-lg print:shadow-none w-full flex flex-col justify-between card-item-8" // 🗂️ حاوية الكارد الأكاديمي بارتفاع 52 ملم تملأ الورقة بالكامل بدون فراغات زائدة
                          >
                            {/* 🏛️ 1. ترويسة الكارد الرسمية: الشعار وعنوان الجامعة وفرع ميسان وشارة الموقع الأكاديمي بخطوط سوداء فاحمة */}
                            <div className="flex items-center justify-between border-b border-slate-300 pb-1 print:pb-0.5"> {/* 📐 حاوية الترويسة مع خط فاصل داكن */}
                              <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏢 مجمع الشعار والعناوين الرسمية */}
                                {/* شعار الجامعة الرسمي بجودة واضحة وبحجم مدمج */}
                                <div className="relative w-8 h-8 print:w-7 print:h-7 flex-shrink-0"> {/* 🖼️ إطار أبعاد الشعار الرسمي */}
                                  <Image // 🖼️ مكون صورة الشعار
                                    src="/logo.webp" // 📍 مسار الشعار المعتمد
                                    alt="شعار جامعة الصادق" // 🏷️ نص بديل لأغراض الوصولية
                                    width={32} // 📏 العرض بالبكسل
                                    height={32} // 📏 الارتفاع بالبكسل
                                    className="object-contain" // 🎨 احتواء الصورة بالكامل بدون تشويه
                                    priority // ⚡ تحميل سريع وفوري
                                    unoptimized // 🚀 بدون تحسين إضافي للملفات المحلية
                                  />
                                </div>
                                {/* العناوين الرسمية لجامعة الإمام الصادق ومسار بولونيا وفرع ميسان بخط أسود بارز ومقروء */}
                                <div className="flex flex-col justify-center leading-none min-w-0"> {/* 📝 نصوص اسم الجامعة والوزارة */}
                                  <h4 className="text-xs print:text-[11px] font-black text-black whitespace-nowrap leading-tight"> {/* 🏛️ اسم الجامعة وفرع ميسان بلون أسود عريض وواضح */}
                                    جامعة الإمام جعفر الصادق (ع) — فرع ميسان
                                  </h4>
                                  <p className="text-[10px] print:text-[9.5px] text-black font-extrabold whitespace-nowrap leading-tight mt-0.5"> {/* 📜 اسم الوزارة والمسار بخط أسود بارز */}
                                    وزارة التعليم العالي والبحث العلمي — مسار بولونيا
                                  </p>
                                </div>
                              </div>
                              {/* شارة الهوية الرسمية لرئيس القسم أو المقرر بخط أسود بارز ومحاط بإطار أنيق */}
                              <span className="px-2 py-0.5 rounded-md bg-white text-black text-[10px] print:text-[9.5px] font-black border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏷️ باج المنصب الأكاديمي */}
                                {roleArabicTitle}
                              </span>
                            </div>

                            {/* 👤 2. شريط هوية المسؤول والقسم العلمي بخطوط سوداء عريضة */}
                            <div className="flex items-center justify-between gap-2 py-0.5 px-0.5"> {/* 📌 حاوية اسم المسؤول والقسم بتنسيق ممتلئ وأنيق */}
                              <div className="flex items-center gap-1.5 overflow-hidden"> {/* 🏷️ أيقونة واسم المسؤول */}
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-300"> {/* ⭕ دائرة أيقونة المستخدم */}
                                  <User className="w-3 h-3 text-[#0F2942]" /> {/* 👤 أيقونة المسؤول بلون نيلي */}
                                </div>
                                <span className="text-sm print:text-[12px] font-black text-black truncate"> {/* ✍️ الاسم الكامل للمسؤول بخط أسود كبير وواضح */}
                                  {leader.full_name}
                                </span>
                              </div>
                              <span className="text-[10.5px] print:text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shrink-0 shadow-2xs"> {/* 🏢 اسم القسم العلمي بخط أسود عريض */}
                                {leader.department_name || 'غير محدد'}
                              </span>
                            </div>

                            {/* 🔐 3. شبكة بيانات الدخول (ألوان موحدة وخانات بيضاء نقية بخطوط سوداء فاحمة) */}
                            <div className="grid grid-cols-2 gap-1.5 print:gap-1 my-0.5"> {/* 🔲 شبكة بعمودين متوازيين للبيانات بتصميم متوحد ونظيف */}
                              {/* صندوق البريد الإلكتروني الأكاديمي بخانة بيضاء نقية مثل الرمز السري تماماً */}
                              <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* ✉️ بوكس الإيميل الأكاديمي الموحد بحشوة متناسقة */}
                                <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل الإيميل بخط أسود بارز */}
                                  <Mail className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* ✉️ أيقونة البريد بلون نيلي موحد */}
                                  <span>البريد الأكاديمي</span>
                                </div>
                                <div className="font-mono text-[10.5px] print:text-[10px] font-black text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔤 خانة البريد بيضاء نقية ومحاطة بإطار أنيق مريح */}
                                  {leader.generated_email}
                                </div>
                              </div>

                              {/* صندوق الرمز السري المؤقت بتصميم موحد تماماً مع صندوق البريد بخط أسود */}
                              <div className="bg-slate-50 border border-slate-300 rounded-md p-1.5 flex flex-col justify-center"> {/* 🔑 بوكس كلمة المرور موحد بلون متناسق وبدون أخضر */}
                                <div className="flex items-center gap-1 text-[10px] print:text-[9.5px] font-black text-black mb-1"> {/* 🏷️ عنوان حقل كلمة السر بخط أسود بارز */}
                                  <KeyRound className="w-3 h-3 text-[#0F2942] shrink-0" /> {/* 🔑 أيقونة المفتاح بلون نيلي موحد */}
                                  <span>كلمة المرور المؤقتة</span>
                                </div>
                                <div className="font-mono text-[12px] print:text-[11px] font-black tracking-widest text-black truncate text-center select-all bg-white py-1 px-1.5 rounded border border-slate-300 shadow-2xs" dir="ltr"> {/* 🔢 خانة الباسورد بيضاء نقية بخط أسود عريض ومتباعد */}
                                  {leader.temp_password || '********'}
                                </div>
                              </div>
                            </div>

                            {/* 🌐 4. رابط المنصة المباشر بحجم خط مطابق لاسم المسؤول بدون توقيع المستلم وبخط أسود فاحم */}
                            <div className="flex items-center justify-center border-t border-slate-300 pt-1.5 print:pt-1"> {/* 📄 شريط رابط البوابة في المنتصف ومضغوط المساحة */}
                              <div className="flex items-center gap-1.5 font-mono text-xs print:text-[11.5px] font-black text-black truncate select-all bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md" dir="ltr"> {/* 🔗 رابط الدخول بحجم مساوٍ لاسم المسؤول مع إطار ناعم */}
                                <Globe className="w-3.5 h-3.5 text-[#0F2942] shrink-0" /> {/* 🌐 أيقونة الكرة الأرضية بلون نيلي */}
                                <span className="truncate">{loginPortalCleanUrl}</span> {/* 🌐 رابط البوابة النظيف والواضح */}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })(), document.body)}

      </div>
      </div>
    </ZeroTrustGuard>
  );
}
