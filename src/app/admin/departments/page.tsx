'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 صفحة إدارة الأقسام والمراحل الدراسية الـ 12 مع ميزة الترتيب والفرز - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useMemo, useRef } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة والمراجع
import { createPortal } from 'react-dom'; // 🚪 بورتال للرسم المباشر على جذر الصفحة لضمان عدم الخروج خارج الشاشة
import Link from 'next/link'; // 🔗 روابط نكست السريعة
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import { 
  getCurrentSessionUser, 
  syncDepartmentsFromSupabase, 
  saveDepartmentToSupabase, 
  deleteDepartmentFromSupabase,
  syncProfilesFromSupabase,
  saveProfileToSupabase, // ☁️ حفظ وتحديث ملفات المستخدمين والقيادات في Supabase
  syncStagesFromSupabase,
  saveStageToSupabase,
  deleteStageFromSupabase
} from '@/lib/supabase-client'; // 🔌 فحص الجلسة ودوال إدارة الأقسام والمراحل السحابية
import FloatingCrudModal from '@/components/FloatingCrudModal'; // 📦 المكون العائم الفاخر للـ CRUD
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { getStoredData, saveStoredData, INITIAL_DEPARTMENTS, INITIAL_STAGES, INITIAL_PROFILES } from '@/lib/mock-data'; // 💾 التخزين المحلي
import { Department, Stage, UserProfile } from '@/types'; // 🔗 الأنواع والواجهات الرسمية
import { detectArabicGender } from '@/lib/demographics-utils'; // 🧮 التعرف الذكي على جنس الطالب
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  AlertTriangle, 
  ArrowLeft, 
  Users, 
  Building2, 
  UserCheck, 
  GraduationCap, 
  FileText,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal,
  Search,
  Clock,
  Download,
  X,
  ArrowDownAZ, // 🔤 أيقونة الترتيب الأبجدي SVG
  ShieldCheck, // 🛡️ أيقونة الدرع الأمني SVG
  CheckSquare, // ☑️ أيقونة تحديد الكل SVG
  Hash, // #️⃣ أيقونة الرمز الأكاديمي SVG
  Eye, // 👁️ أيقونة المعاينة الشاملة SVG
  Loader2, // ⏳ أيقونة التحميل الدائرية SVG
  Database, // 💾 أيقونة قاعدة البيانات السحابية SVG
  Check, // ✔️ أيقونة التأكيد SVG
  BookOpen, // 📖 أيقونة المناهج والمقررات SVG
  Award, // 🏆 أيقونة الاعتماد الأكاديمي SVG
  ChevronDown, // 🔽 سهم القائمة المنسدلة الفيكتور SVG
  UserX // 👤 أيقونة إلغاء تحديد المسؤول SVG
} from 'lucide-react'; // 🎨 الأيقونات الفيكتور SVG

// 🏫 كبسولات الأقسام الجامعية الشائعة المعتمدة الـ 12 للاختيار السريع بنقرة واحدة
const DEPARTMENT_PRESETS = [
  { name: 'هندسة الحاسوب', code: 'CE' },
  { name: 'هندسة تقنيات الحاسوب', code: 'CCE' },
  { name: 'هندسة ميكانيك القوى', code: 'PME' },
  { name: 'تقنيات التجميل والليزر', code: 'CLT' },
  { name: 'تقنيات المختبرات الطبية', code: 'MLT' },
  { name: 'المحاسبة', code: 'ACC' },
  { name: 'إدارة الأعمال', code: 'BBA' },
  { name: 'اقتصاديات نفط وغاز', code: 'OGE' },
  { name: 'علوم القرآن', code: 'QS' },
  { name: 'اللغة الإنكليزية', code: 'ENG' },
  { name: 'القانون', code: 'LAW' },
  { name: 'التربية الفنية', code: 'ART' },
];
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust
import { exportCustomDepartmentsList } from '@/lib/excel-utils'; // 📊 تصدير Excel

// 🏷️ واجهة خصائص القائمة المنسدلة الأكاديمية المخصصة
interface AcademicLeaderSelectProps {
  label: string; // 📌 عنوان القائمة
  value: string; // 🆔 المعرف المختار حالياً
  onChange: (id: string) => void; // ⚡ دالة حفظ وتحديث القيمة
  options: { id: string; name: string; email: string }[]; // 👥 مصفوفة القيادات
  emptyText: string; // 🏷️ نص الخيار الفارغ
  icon?: React.ReactNode; // 🎨 أيقونة جانبية اختيارية
}

// 📐 إحداثيات وموضع القائمة المنسدلة الذكي لضمان بقائها داخل حدود الشاشة
interface DropdownCoords {
  openUpwards: boolean;
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

// 🏛️ مكون القائمة المنسدلة الأكاديمية الاحترافية (Custom Academic Dropdown)
function AcademicLeaderSelect({
  label,
  value,
  onChange,
  options,
  emptyText,
  icon,
}: AcademicLeaderSelectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false); // 🔓 حالة الفتح والإغلاق
  const [search, setSearch] = useState<string>(''); // 🔍 نص البحث التفاعلي
  const buttonRef = useRef<HTMLButtonElement>(null); // 🎯 مرجع زر القائمة المنسدلة لحساب إحداثيات الشاشة
  const [coords, setCoords] = useState<DropdownCoords | null>(null); // 📐 إحداثيات الموضع الذكي داخل الشاشة

  // 🧮 حساب وتحديث إحداثيات القائمة لضمان بقائها 100% داخل حدود الشاشة
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // المساحة المتاحة أعلى وأسفل الزر
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // الارتفاع المفضل للقائمة المنسدلة
    const preferredHeight = 230;

    // تحديد الفتح للأعلى إذا كانت المساحة بالأسفل غير كافية والمساحة بالأعلى أكبر
    const openUpwards = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

    // حساب أقصى ارتفاع بحيث تظل القائمة داخل حدود الشاشة تماماً ولا تخرج أبداً
    const availableSpace = openUpwards ? spaceAbove - 20 : spaceBelow - 20;
    const maxHeight = Math.max(100, Math.min(preferredHeight, availableSpace));

    // ضمان أن العرض والموضع الأفقي بالكامل داخل الشاشة
    let left = rect.left;
    let width = rect.width;
    if (left + width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - 12 - width);
    }
    if (left < 12) {
      left = 12;
      width = Math.min(width, viewportWidth - 24);
    }

    setCoords({
      openUpwards,
      ...(openUpwards
        ? { bottom: viewportHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
      left,
      width,
      maxHeight,
    });
  };

  // 🔄 الاستماع إلى التمرير وتغيير حجم النافذة لتحديث الموضع أو الإغلاق التلقائي عند تحرك الصفحة
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

  // 👤 استخراج بيانات الشخص المختار حالياً
  const selectedPerson = options.find((p) => p.id === value);

  // 🔎 تصفية الخيارات حسب نص البحث
  const filteredOptions = options.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full text-right">
      {/* 🏷️ عنوان الحقل بلون أسود صريح وحجم وسط */}
      <label className="block text-slate-950 mb-1.5 font-black text-xs sm:text-sm flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </label>

      {/* 🔘 زر فتح القائمة المنسدلة المصمم بحرفية عالية */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updatePosition();
          }
          setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-2xl text-right flex items-center justify-between transition cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-indigo-600 ring-4 ring-indigo-500/10'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedPerson ? (
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              <UserCheck className="w-4 h-4 text-indigo-900" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4 text-slate-500" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {selectedPerson ? (
              <div className="flex flex-col">
                <span className="font-black text-slate-950 text-xs sm:text-sm truncate">
                  {selectedPerson.name}
                </span>
                <span className="font-mono font-bold text-[11px] text-slate-600 truncate" dir="ltr">
                  {selectedPerson.email}
                </span>
              </div>
            ) : (
              <span className="font-bold text-slate-600 text-xs sm:text-sm truncate block">
                {emptyText}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-700 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {/* 📋 القائمة المنسدلة الفاخرة العائمة عبر createPortal بـ z-[999999] وتظل محصورة 100% داخل حدود الشاشة */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <>
          {/* 🌫️ خلفية تفاعلية شفافة لإغلاق القائمة فوراً عند النقر خارجها */}
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setIsOpen(false)}
          />

          {/* 📦 بطاقة القائمة المنسدلة العائمة الذكية */}
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
            className="bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] p-1.5 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-1 text-right"
            dir="rtl"
          >
            {/* 🔍 شريط البحث الفوري التفاعلي الدائم في القائمة المنسدلة */}
            <div className="p-1 border-b border-slate-200 mb-1 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد الأكاديمي..."
                  className="w-full pr-8 pl-7 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:bg-white shadow-2xs transition"
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 🚫 خيار إلغاء التعيين / غير محدد */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full px-3 py-2 rounded-xl text-right transition flex items-center justify-between cursor-pointer border ${
                !value
                  ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserX className={`w-4 h-4 shrink-0 ${!value ? 'text-cyan-200' : 'text-slate-400'}`} />
                <span className={`font-bold text-xs sm:text-sm ${!value ? 'text-white' : 'text-slate-700'}`}>
                  {emptyText}
                </span>
              </div>
              {!value && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
            </button>

            {/* 👥 خيارات القيادات الأكاديمية المسجلة */}
            {filteredOptions.map((person) => {
              const isSelected = person.id === value;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    onChange(person.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-right transition flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'hover:bg-slate-50 text-slate-950 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className={`block font-black text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                        {person.name}
                      </span>
                      <span
                        className={`block font-mono text-[10px] sm:text-[11px] truncate ${
                          isSelected ? 'text-cyan-200' : 'text-slate-500'
                        }`}
                        dir="ltr"
                      >
                        {person.email}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-xs font-bold text-slate-500">
                {options.length === 0
                  ? 'لا توجد حسابات قيادية مسجلة حالياً (يمكن التعيين لاحقاً)'
                  : 'لا توجد حسابات قيادية مطابقة للبحث'}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default function AdminDepartmentsPage() {
  const router = useRouter();
  
  // 📌 حالات الأقسام والمراحل والمسؤولين
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  
  // 🔘 حالات نظام التحديد المتعدد للأقسام العلمية
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  
  // 📌 نمط الترتيب والفرز والبحث (الافتراضي: الترتيب المخصص الذي يضع الجديد دائماً بالبداية)
  const [sortMode, setSortMode] = useState<'custom' | 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'code_asc' | 'students_desc' | 'teachers_desc'>('custom');
  const [searchQuery, setSearchQuery] = useState('');

  // 📌 حالات الكروت العائمة للـ CRUD الشامل
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingDept, setViewingDept] = useState<Department | null>(null); // 👁️ بطاقة معاينة وتفاصيل القسم الشاملة
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // ⏳ حالة التحميل والربط مع قاعدة البيانات

  // 📌 حقول الإضافة والتعديل والقيادات الأكاديمية
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newHeadId, setNewHeadId] = useState(''); // 👤 رئيس القسم المختار
  const [newRapporteurId, setNewRapporteurId] = useState(''); // 📝 مقرر القسم المختار
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editHeadId, setEditHeadId] = useState('');
  const [editRapporteurId, setEditRapporteurId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 🔄 فحص الجلسة وتحميل البيانات الأولية
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      router.push('/sadmin'); // 🔒 حظر أي مستخدم ليس مسؤولاً عاماً
      return;
    }
    setDepartments(getStoredData('departments', INITIAL_DEPARTMENTS));
    setStages(getStoredData('stages', INITIAL_STAGES));
    setProfiles(getStoredData('profiles', INITIAL_PROFILES));

    // ☁️ مزامنة الأقسام والمراحل والحسابات من Supabase لحظياً
    syncDepartmentsFromSupabase().then((liveDepts) => {
      if (liveDepts && liveDepts.length > 0) setDepartments(liveDepts);
    }).catch(() => {});
    syncStagesFromSupabase().then((liveStages) => {
      if (liveStages && liveStages.length > 0) setStages(liveStages);
    }).catch(() => {});
    syncProfilesFromSupabase().then((liveProfiles) => {
      if (liveProfiles && liveProfiles.length > 0) setProfiles(liveProfiles);
    }).catch(() => {});

    // 🏷️ تعيين عنوان المتصفح
    if (typeof document !== 'undefined') {
      document.title = 'إدارة الأقسام والمراحل العلمية | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, [router]);

  // ➕ إضافة قسم جديد وتحديث قاعدة البيانات بالكامل (Supabase + Local)
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim() || isSaving) return;

    setIsSaving(true);
    try {
      // 🔍 استخراج القيادات الأكاديمية المختارة للقسم
      const selectedHead = profiles.find((p) => p.id === newHeadId);
      const selectedRap = profiles.find((p) => p.id === newRapporteurId);

      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
        head_id: selectedHead?.id,
        head_name: selectedHead?.full_name,
        head_email: selectedHead?.generated_email,
        rapporteur_id: selectedRap?.id,
        rapporteur_name: selectedRap?.full_name,
        rapporteur_email: selectedRap?.generated_email,
        created_at: new Date().toISOString(),
        order_index: 0,
      };

      // ⬆️ إضافة القسم الجديد في بداية المصفوفة وتحديث فهارس الترتيب
      const updatedDepts = [newDept, ...departments.map((d, idx) => ({ ...d, order_index: idx + 1 }))];
      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);
      await saveDepartmentToSupabase(newDept); // ☁️ حفظ القسم الجديد في سحابة Supabase فوراً

      // 🎓 توليد المراحل الـ 4 التلقائية للقسم الجديد في مسار بولونيا
      const newStagesList: Stage[] = [1, 2, 3, 4].map((num) => ({
        id: `stage-${newDept.id}-${num}`,
        department_id: newDept.id,
        stage_number: num,
        department_name: newDept.name,
      }));

      const updatedStages = [...stages, ...newStagesList];
      setStages(updatedStages);
      saveStoredData('stages', updatedStages);
      for (const st of newStagesList) {
        await saveStageToSupabase(st); // ☁️ حفظ وتثبيت المراحل الجديدة في سحابة Supabase فوراً
      }

      // 👥 ربط القيادات الأكاديمية بالقسم في الحسابات وتحديث قاعدة البيانات السحابية
      if (selectedHead || selectedRap) {
        const updatedProfiles = profiles.map((p) => {
          if (selectedHead && p.id === selectedHead.id) {
            const up: UserProfile = { ...p, department_id: newDept.id, department_name: newDept.name };
            saveProfileToSupabase(up);
            return up;
          }
          if (selectedRap && p.id === selectedRap.id) {
            const up: UserProfile = { ...p, department_id: newDept.id, department_name: newDept.name };
            saveProfileToSupabase(up);
            return up;
          }
          return p;
        });
        setProfiles(updatedProfiles);
        saveStoredData('profiles', updatedProfiles);
      }

      setSortMode('custom');
      setNewDeptName('');
      setNewDeptCode('');
      setNewHeadId('');
      setNewRapporteurId('');
      setShowAddModal(false);
      setSuccessMsg('تم إنشاء واعتماد القسم العلمي وتوليد مراحله الـ 4 في قاعدة البيانات بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('خطأ أثناء إضافة القسم:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ✏️ فتح نافذة تعديل القسم وتعبئة بياناته والقيادات المرتبطة
  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditHeadId(dept.head_id || '');
    setEditRapporteurId(dept.rapporteur_id || '');
  };

  // ✏️ حفظ التعديلات وتحديث الأسماء والقيادات في البروفايلات والمراحل وقاعدة البيانات
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || isSaving) return;

    setIsSaving(true);
    try {
      const updatedName = editName.trim();
      const updatedCode = editCode.trim().toUpperCase();
      const selectedHead = profiles.find((p) => p.id === editHeadId);
      const selectedRap = profiles.find((p) => p.id === editRapporteurId);

      const updatedDepts = departments.map((d) => {
        if (d.id === editingDept.id) {
          return {
            ...d,
            name: updatedName,
            code: updatedCode,
            head_id: selectedHead ? selectedHead.id : (editHeadId === '' ? undefined : d.head_id),
            head_name: selectedHead ? selectedHead.full_name : (editHeadId === '' ? undefined : d.head_name),
            head_email: selectedHead ? selectedHead.generated_email : (editHeadId === '' ? undefined : d.head_email),
            rapporteur_id: selectedRap ? selectedRap.id : (editRapporteurId === '' ? undefined : d.rapporteur_id),
            rapporteur_name: selectedRap ? selectedRap.full_name : (editRapporteurId === '' ? undefined : d.rapporteur_name),
            rapporteur_email: selectedRap ? selectedRap.generated_email : (editRapporteurId === '' ? undefined : d.rapporteur_email),
          };
        }
        return d;
      });

      setDepartments(updatedDepts);
      saveStoredData('departments', updatedDepts);
      const updatedDept = updatedDepts.find((d) => d.id === editingDept.id);
      if (updatedDept) {
        await saveDepartmentToSupabase(updatedDept); // ☁️ تحديث بيانات القسم في Supabase
      }

      // 🔄 تحديث اسم القسم في المراحل
      const updatedStages = stages.map((s) => {
        if (s.department_id === editingDept.id) {
          return { ...s, department_name: updatedName };
        }
        return s;
      });
      setStages(updatedStages);
      saveStoredData('stages', updatedStages);
      for (const s of updatedStages.filter((st) => st.department_id === editingDept.id)) {
        await saveStageToSupabase(s);
      }

      // 🔄 تحديث اسم القسم والارتباط في حسابات المستخدمين
      const updatedProfiles = profiles.map((p) => {
        if (selectedHead && p.id === selectedHead.id) {
          const up: UserProfile = { ...p, department_id: editingDept.id, department_name: updatedName };
          saveProfileToSupabase(up);
          return up;
        }
        if (selectedRap && p.id === selectedRap.id) {
          const up: UserProfile = { ...p, department_id: editingDept.id, department_name: updatedName };
          saveProfileToSupabase(up);
          return up;
        }
        if (p.department_id === editingDept.id) {
          const up: UserProfile = { ...p, department_name: updatedName };
          saveProfileToSupabase(up);
          return up;
        }
        return p;
      });
      setProfiles(updatedProfiles);
      saveStoredData('profiles', updatedProfiles);

      setEditingDept(null);
      setSuccessMsg('تم تعديل بيانات القسم وتحديث كافة السجلات والمراحل المرتبطة به بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error('خطأ أثناء تعديل القسم:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 🗑️ تأكيد الحذف
  const confirmDeleteDept = () => {
    if (!deletingDeptId) return;

    const updatedDepts = departments.filter((d) => d.id !== deletingDeptId);
    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    deleteDepartmentFromSupabase(deletingDeptId); // ☁️ حذف القسم من Supabase

    const updatedStages = stages.filter((s) => s.department_id !== deletingDeptId);
    setStages(updatedStages);
    saveStoredData('stages', updatedStages);
    stages.filter((s) => s.department_id === deletingDeptId).forEach((s) => deleteStageFromSupabase(s.id)); // ☁️ حذف المراحل التابعة للقسم من Supabase

    // 🔄 فك ارتباط الحسابات التابعة للقسم المحذوف
    const updatedProfiles = profiles.map((p) => {
      if (p.department_id === deletingDeptId) {
        return { ...p, department_name: undefined, department_id: undefined };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);

    setDeletingDeptId(null);
    setSuccessMsg('تم حذف القسم وجميع مراحله وفك ارتباط الحسابات التابعة له بنجاح.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 🔘 دوال نظام التحديد والإجراءات الجماعية للأقسام العلمية
  const toggleSelectAll = (list: Department[]) => {
    if (selectedDeptIds.length === list.length && list.length > 0) {
      setSelectedDeptIds([]);
    } else {
      setSelectedDeptIds(list.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDeleteDepartments = () => {
    const count = selectedDeptIds.length;
    if (count === 0) return;

    const updatedDepts = departments.filter((d) => !selectedDeptIds.includes(d.id));
    setDepartments(updatedDepts);
    saveStoredData('departments', updatedDepts);
    selectedDeptIds.forEach((id) => deleteDepartmentFromSupabase(id)); // ☁️ حذف الأقسام المحددة من Supabase

    const updatedStages = stages.filter((s) => !selectedDeptIds.includes(s.department_id));
    setStages(updatedStages);
    saveStoredData('stages', updatedStages);
    stages.filter((s) => selectedDeptIds.includes(s.department_id)).forEach((s) => deleteStageFromSupabase(s.id)); // ☁️ حذف مراحل الأقسام المحددة من Supabase

    // 🔄 فك ارتباط الحسابات التابعة للأقسام المحذوفة
    const updatedProfiles = profiles.map((p) => {
      if (p.department_id && selectedDeptIds.includes(p.department_id)) {
        return { ...p, department_name: undefined, department_id: undefined };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    saveStoredData('profiles', updatedProfiles);

    setSelectedDeptIds([]);
    setIsBulkDeleting(false);
    setSuccessMsg(`تم حذف (${count}) من الأقسام العلمية وفك ارتباطات حساباتها بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleBulkExportExcel = async (list: Department[]) => {
    const selectedDeptsList = list.filter((d) => selectedDeptIds.includes(d.id));
    if (selectedDeptsList.length === 0) return;

    await exportCustomDepartmentsList(selectedDeptsList, 'كلية_ميسان');
    setSuccessMsg(`تم تصدير (${selectedDeptsList.length}) قسم إلى ملف Excel بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 🔀 دالة تغيير الترتيب اليدوي (تقديم القسم للأمام أو تأخيره للخلف)
  const handleMoveDepartment = (currentIndex: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedDepartments.length) return;

    // الحصول على النسخة الحالية وتبديل المواقع
    const currentList = [...sortedDepartments];
    const itemToMove = currentList[currentIndex];
    currentList[currentIndex] = currentList[targetIndex];
    currentList[targetIndex] = itemToMove;

    // إعادة فهرسة order_index وحفظها بقاعدة البيانات المحلية
    const reindexed = currentList.map((dept, idx) => ({
      ...dept,
      order_index: idx,
    }));

    setDepartments(reindexed);
    saveStoredData('departments', reindexed);
    setSortMode('custom'); // تثبيت وضع الترتيب المخصص
    setSuccessMsg(`تم تغيير موقع وترتيب قسم (${itemToMove.name}) بنجاح!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 🧮 تصفية وفرز الأقسام حسب النمط المختار وحقل البحث
  const sortedDepartments = useMemo(() => {
    let list = [...departments];

    // 1. التصفية بالبحث
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.head_name && d.head_name.toLowerCase().includes(q)) ||
          (d.rapporteur_name && d.rapporteur_name.toLowerCase().includes(q))
      );
    }

    // 2. تطبيق الترتيب
    switch (sortMode) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
      case 'code_asc':
        return list.sort((a, b) => a.code.localeCompare(b.code, 'en'));
      case 'students_desc':
        return list.sort((a, b) => {
          const countA = profiles.filter((p) => p.role === 'student' && (p.department_id === a.id || p.department_name === a.name)).length;
          const countB = profiles.filter((p) => p.role === 'student' && (p.department_id === b.id || p.department_name === b.name)).length;
          return countB - countA;
        });
      case 'teachers_desc':
        return list.sort((a, b) => {
          const countA = profiles.filter((p) => p.role === 'teacher' && (p.department_id === a.id || p.department_name === a.name)).length;
          const countB = profiles.filter((p) => p.role === 'teacher' && (p.department_id === b.id || p.department_name === b.name)).length;
          return countB - countA;
        });
      case 'custom':
      default:
        // إذا كان هناك order_index محدد، نرتب به، وإلا نحافظ على ترتيب المصفوفة المسبق
        return list;
    }
  }, [departments, sortMode, searchQuery, profiles]);

  return (
    <ZeroTrustGuard allowedRoles={['super_admin', 'admin']} redirectFallback="/sadmin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4" dir="rtl">
      
        {/* 🏛️ هيدر الصفحة الكحلي عريض الشاشة بحدود ناعمة */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 bg-blue-50 text-blue-950 border border-blue-200 font-black text-sm rounded-xl shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                <span>صلاحية حصرية للمسؤول العام</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2 mt-2">
              <Layers className="w-7 h-7 text-slate-950" />
              <span>إدارة الأقسام العلمية ({departments.length} قسماً معتمداً)</span>
            </h1>
            <p className="text-sm font-black text-slate-950 mt-1">
              جامعة الإمام جعفر الصادق (ع) - فرع ميسان | إضافة وتعديل وترتيب وحذف الأقسام العلمية وربط القيادات الأكاديمية
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sadmin/department-heads"
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]"
            >
              <UserCheck className="w-5 h-5 text-cyan-300" />
              <span>إدارة رؤساء الأقسام والمقررين</span>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs border border-[#1e4570]"
            >
              <Plus className="w-5 h-5 text-slate-200" />
              <span>إضافة قسم علمي جديد</span>
            </button>
          </div>
        </div>

        {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند إضافة أو تعديل أو حذف قسم */}
        {successMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
            <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-base text-slate-950">إشعار النظام الأكاديمي</h4>
                  <p className="font-bold text-sm text-slate-600 mt-0.5">{successMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* 📝 1. كارت إضافة وتأسيس قسم علمي عريض احترافي متكامل (Floating Create Modal) */}
        <FloatingCrudModal
          isOpen={showAddModal}
          onClose={() => {
            if (!isSaving) {
              setShowAddModal(false);
              setNewDeptName('');
              setNewDeptCode('');
              setNewHeadId('');
              setNewRapporteurId('');
            }
          }}
          maxWidth="max-w-4xl"
          title="إضافة وتأسيس قسم علمي جديد للكلية"
          subtitle="جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا والربط السحابي المباشر"
          icon={<Building2 className="w-6 h-6 text-white" />}
          onSubmit={handleAddDepartment}
          footer={
            <div className="flex items-center gap-2.5 w-full justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl cursor-pointer border border-slate-300 text-sm transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving || !newDeptName.trim() || !newDeptCode.trim()}
                className="px-6 py-2 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white font-black rounded-xl shadow-md cursor-pointer border border-[#1e4570] text-sm active:scale-95 transition flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>جاري الحفظ والتثبيت...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-cyan-300" />
                    <span>حفظ واعتماد القسم والمراحل الـ 4</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-sm font-black">
            
            {/* 🏫 شريط الأقسام المقترحة والشائعة بنقرة واحدة (بدون نجوم وبألوان كحلية وسوداء نقية بحجم وسط) */}
            <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>أقسام جامعية مقترحة وشائعة (انقر للتعبئة التلقائية السريعة):</span>
                </span>
                <span className="text-xs font-black text-slate-950 bg-slate-200/80 px-2.5 py-0.5 rounded-lg border border-slate-300">
                  12 قسماً معتمداً
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => {
                      setNewDeptName(preset.name);
                      setNewDeptCode(preset.code);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
                      newDeptCode === preset.code
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-950 border-slate-300'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className={`font-mono text-[11px] sm:text-xs font-black ${newDeptCode === preset.code ? 'text-cyan-200' : 'text-slate-950'}`}>
                      ({preset.code})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🏷️ الحقول الأساسية: اسم القسم والكود المختصر */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-950 mb-1 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-900 shrink-0" />
                  <span>اسم القسم الكامل بالعربي *</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="مثال: هندسة الحاسوب"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:bg-white focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-indigo-900 shrink-0" />
                  <span>رمز القسم المختصر (الكود الإنجليزي) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  placeholder="مثال: CE"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-950 font-black text-sm placeholder:text-slate-600 focus:border-indigo-600 focus:bg-white focus:outline-none uppercase font-mono transition shadow-2xs"
                />
              </div>
            </div>

            {/* 👥 القيادات الأكاديمية (رئيس ومقرر القسم) */}
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs relative z-20">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>ربط القيادات الأكاديمية المشرفة على القسم (اختياري ويمكن لاحقاً):</span>
                </span>
                <span className="text-xs font-black text-slate-950">حسابات القيادات المسجلة</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 👨‍🏫 رئيس القسم الأكاديمي */}
                <AcademicLeaderSelect
                  label="رئيس القسم الأكاديمي:"
                  value={newHeadId}
                  onChange={setNewHeadId}
                  options={profiles
                    .filter((p) => p.role === 'department_head' || p.role === 'teacher' || p.id === newHeadId)
                    .map((p) => ({ id: p.id, name: p.full_name, email: p.generated_email }))}
                  emptyText="-- تعيين رئيس القسم لاحقاً --"
                  icon={<UserCheck className="w-4 h-4 text-blue-900 shrink-0" />}
                />

                {/* 📝 مقرر القسم الأكاديمي */}
                <AcademicLeaderSelect
                  label="مقرر القسم الأكاديمي:"
                  value={newRapporteurId}
                  onChange={setNewRapporteurId}
                  options={profiles
                    .filter((p) => p.role === 'rapporteur' || p.role === 'teacher' || p.id === newRapporteurId)
                    .map((p) => ({ id: p.id, name: p.full_name, email: p.generated_email }))}
                  emptyText="-- تعيين مقرر القسم لاحقاً --"
                  icon={<FileText className="w-4 h-4 text-indigo-900 shrink-0" />}
                />
              </div>
            </div>

            {/* 🎓 بطاقة المعاينة الحية المباشرة (Live Preview Card) */}
            <div className="p-3.5 sm:p-4 bg-white border-2 border-slate-300 rounded-2xl space-y-2 shadow-sm relative z-10">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-slate-950">
                  <Eye className="w-4 h-4 text-blue-900" />
                  <span>معاينة بطاقة القسم الحية في النظام:</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-mono font-black text-sm shadow-xs">
                    {newDeptCode || 'CODE'}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-950">
                      {newDeptName || 'اسم القسم العلمي الجديد'}
                    </h4>
                    <span className="text-xs sm:text-sm font-black text-slate-950 block mt-1">
                      جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا الأكاديمي
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-black">
                    4 مراحل دراسية (مسار بولونيا)
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl text-xs font-black">
                    صباحي / مسائي
                  </span>
                </div>
              </div>
            </div>

            {/* 🏛️ مراحل مسار بولونيا الـ 4 المعتمدة */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-900 shrink-0" />
                  <span>المراحل الدراسية الـ 4 المعتمدة:</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                    <span className="block text-xs sm:text-sm font-black text-slate-950">المرحلة {getStageNameInArabic(num)}</span>
                    <span className="block text-xs sm:text-sm font-black text-slate-950">كورس أول • كورس ثاني</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </FloatingCrudModal>

        {/* ✏️ 2. كارت تعديل قسم علمي عريض احترافي متكامل (Floating Update Modal) */}
        <FloatingCrudModal
          isOpen={!!editingDept}
          onClose={() => {
            if (!isSaving) setEditingDept(null);
          }}
          maxWidth="max-w-4xl"
          title={`تعديل بيانات قسم ${editingDept?.name || ''}`}
          subtitle="تعديل الاسم والكود والقيادات وتحديث كافة السجلات والمراحل في قاعدة البيانات"
          icon={<Edit3 className="w-6 h-6 text-white" />}
          onSubmit={handleSaveEdit}
          footer={
            <div className="flex items-center gap-2.5 w-full justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingDept(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl cursor-pointer border border-slate-300 text-sm transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving || !editName.trim() || !editCode.trim()}
                className="px-6 py-2 bg-[#0F2942] hover:bg-[#163a5f] disabled:opacity-50 text-white font-black rounded-xl shadow-md cursor-pointer border border-[#1e4570] text-sm active:scale-95 transition flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>جاري حفظ التعديلات...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-cyan-300" />
                    <span>حفظ وتحديث البيانات</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-sm font-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-950 mb-1 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-900 shrink-0" />
                  <span>اسم القسم المعدل *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-950 mb-1 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-indigo-900 shrink-0" />
                  <span>الرمز المختصر المعدل (الكود) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-950 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none uppercase font-mono transition shadow-2xs"
                />
              </div>
            </div>

            {/* 👥 تعديل القيادات الأكاديمية */}
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs relative z-20">
              <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <UserCheck className="w-4 h-4 text-blue-900 shrink-0" />
                <span>القيادات الأكاديمية المشرفة على القسم:</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 👨‍🏫 رئيس القسم الأكاديمي */}
                <AcademicLeaderSelect
                  label="رئيس القسم الأكاديمي:"
                  value={editHeadId}
                  onChange={setEditHeadId}
                  options={profiles
                    .filter((p) => p.role === 'department_head' || p.role === 'teacher' || p.id === editHeadId)
                    .map((p) => ({ id: p.id, name: p.full_name, email: p.generated_email }))}
                  emptyText="-- غير محدد (بدون رئيس قسم) --"
                  icon={<UserCheck className="w-4 h-4 text-blue-900 shrink-0" />}
                />

                {/* 📝 مقرر القسم الأكاديمي */}
                <AcademicLeaderSelect
                  label="مقرر القسم الأكاديمي:"
                  value={editRapporteurId}
                  onChange={setEditRapporteurId}
                  options={profiles
                    .filter((p) => p.role === 'rapporteur' || p.role === 'teacher' || p.id === editRapporteurId)
                    .map((p) => ({ id: p.id, name: p.full_name, email: p.generated_email }))}
                  emptyText="-- غير محدد (بدون مقرر قسم) --"
                  icon={<FileText className="w-4 h-4 text-indigo-900 shrink-0" />}
                />
              </div>
            </div>

            {/* 🎓 بطاقة المعاينة بعد التعديل */}
            <div className="p-3.5 sm:p-4 bg-white border-2 border-slate-300 rounded-2xl space-y-2 shadow-sm relative z-10">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-slate-950">
                  <Eye className="w-4 h-4 text-blue-900" />
                  <span>معاينة البطاقة بعد التعديل:</span>
                </span>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <div className="w-11 h-11 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-mono font-black text-sm shadow-xs">
                  {editCode || 'CODE'}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-950">{editName}</h4>
                  <span className="text-xs sm:text-sm font-black text-slate-950 block mt-1">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا الأكاديمي
                  </span>
                </div>
              </div>
            </div>

          </div>
        </FloatingCrudModal>

        {/* 👁️ 3. كارت استعراض وتفاصيل القسم الشاملة (Floating View Modal) */}
        <FloatingCrudModal
          isOpen={!!viewingDept}
          onClose={() => setViewingDept(null)}
          maxWidth="max-w-4xl"
          title={`تفاصيل وبطاقة قسم ${viewingDept?.name || ''}`}
          subtitle={`الرمز الأكاديمي: ${viewingDept?.code || ''} • مسار بولونيا المعتمد`}
          icon={<Building2 className="w-6 h-6 text-white" />}
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-2 bg-slate-200/80 px-3.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
                <span>تاريخ الإنشاء:</span>
                <span className="font-mono font-black text-slate-950 tracking-wide" dir="ltr">
                  {viewingDept?.created_at ? (() => {
                    const d = new Date(viewingDept.created_at);
                    if (isNaN(d.getTime())) return '2026/09/03';
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}/${m}/${day}`;
                  })() : '2026/09/03'}
                </span>
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (viewingDept) {
                      openEditDept(viewingDept);
                      setViewingDept(null);
                    }
                  }}
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 border border-[#1e4570] cursor-pointer shadow-xs active:scale-95"
                >
                  <Edit3 className="w-4 h-4 text-cyan-300" />
                  <span>تعديل بيانات القسم</span>
                </button>
                <Link
                  href={`/admin/departments/${viewingDept?.id}`}
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 border border-[#1e4570] cursor-pointer shadow-xs active:scale-95"
                >
                  <span>تصفح المراحل والمناهج</span>
                  <ArrowLeft className="w-4 h-4 text-cyan-300" />
                </Link>
              </div>
            </div>
          }
        >
          {viewingDept && (
            <div className="space-y-4 text-sm font-black">
              {/* تفاصيل الهيدر */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0F2942] text-white flex items-center justify-center font-mono font-black text-sm sm:text-base shadow-xs">
                    {viewingDept.code}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950">{viewingDept.name}</h3>
                    <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                      جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مسار بولونيا الأكاديمي
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>قسم أكاديمي معتمد</span>
                  </span>
                </div>
              </div>

              {/* القيادة الأكاديمية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-xs font-black text-slate-950 block">رئيس القسم الأكاديمي:</span>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-slate-950 text-base block font-black">{viewingDept.head_name || 'غير محدد'}</strong>
                      <span className="text-xs font-mono font-bold text-slate-950 block">{viewingDept.head_email || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-xs font-black text-slate-950 block">مقرر القسم الأكاديمي:</span>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-slate-950 text-base block font-black">{viewingDept.rapporteur_name || 'غير محدد'}</strong>
                      <span className="text-xs font-mono font-bold text-slate-950 block">{viewingDept.rapporteur_email || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* المراحل الدراسية الأربعة */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-900" />
                  <span>المراحل الدراسية الـ 4 الفعالة:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="block text-xs sm:text-sm font-black text-slate-950">المرحلة {getStageNameInArabic(num)}</span>
                      <span className="block text-xs sm:text-sm font-black text-slate-950">كورس أول • كورس ثاني</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </FloatingCrudModal>

        {/* 🗑️ 3. كارد حذف قسم احترافي فاخر (ConfirmDeleteModal) */}
        <ConfirmDeleteModal
          isOpen={!!deletingDeptId}
          onClose={() => setDeletingDeptId(null)}
          title="تحذير أمني قبل حذف القسم العلمي"
          itemName={departments.find((d) => d.id === deletingDeptId)?.name || 'قسم علمي'}
          itemDetails={`رمز القسم: ${departments.find((d) => d.id === deletingDeptId)?.code || '—'}`}
          warningMessage="حذف هذا القسم سيؤدي لإزالة جميع المراحل الـ 4 التابعة له، وفك ارتباط رؤساء الأقسام والمقررين والتدريسيين والطلبة المرتبطين به نهائياً."
          onConfirm={confirmDeleteDept}
        />

        {/* 🗑️ كارد تأكيد الحذف الجماعي للأقسام العلمية */}
        <ConfirmDeleteModal
          isOpen={isBulkDeleting}
          onClose={() => setIsBulkDeleting(false)}
          title={`تأكيد الحذف الجماعي لـ (${selectedDeptIds.length}) أقسام علمية`}
          itemName={`${selectedDeptIds.length} من الأقسام العلمية المعتمدة`}
          itemDetails="سيتم حذف الأقسام المحددة وكافة مراحلها وفك ارتباط التدريسيين والطلبة والمسؤولين المرتبطين بها فوراً."
          warningMessage="تنبيه أمني خطير: هل أنت متأكد من حذف الأقسام المحددة دفعة واحدة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText={`حذف (${selectedDeptIds.length}) أقسام نهائياً`}
          onConfirm={confirmBulkDeleteDepartments}
        />

        {/* 🎛️ شريط التحكم بالترتيب والفرز والبحث */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
                <Building2 className="w-6 h-6 text-slate-100" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <span>الأقسام العلمية المعتمدة في فرع ميسان</span>
                  <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-950 text-sm font-black border border-slate-300">
                    {sortedDepartments.length} من {departments.length}
                  </span>
                </h2>
                <p className="text-sm text-slate-950 font-black flex items-center gap-1.5 flex-wrap">
                  <span>يمكنك تخصيص الترتيب، أو الفرز حسب الأحدث أو الأبجدية، واستخدام أزرار التقديم والتأخير</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-950 rounded-lg text-xs font-black shadow-2xs border border-slate-300">
                    <ArrowUp className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                    <ArrowDown className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  </span>
                  <span>لنقل أي قسم في القائمة</span>
                </p>
              </div>
            </div>

            {/* 🔍 حقل البحث السريع وزر تحديد الكل بأيقونة SVG */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => toggleSelectAll(sortedDepartments)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 rounded-2xl font-black text-sm transition cursor-pointer border border-slate-300 whitespace-nowrap flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4 text-slate-800 shrink-0" />
                <span>{selectedDeptIds.length === sortedDepartments.length && sortedDepartments.length > 0 ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
              </button>
              <div className="relative w-full lg:w-72">
                <Search className="w-5 h-5 text-slate-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو الرمز..."
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 placeholder:text-slate-700 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 🎛️ شريط الإجراءات الجماعية الفاخر للأقسام العلمية */}
          {selectedDeptIds.length > 0 && (
            <div className="bg-[#0F2942] text-white p-4 sm:px-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#1e4570] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-base text-white">
                    تم تحديد <strong className="text-cyan-300 font-mono text-lg font-black">({selectedDeptIds.length})</strong> من أصل <span className="font-mono text-slate-300">({sortedDepartments.length})</span> قسم علمي
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
                  <span>حذف المحدد ({selectedDeptIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkExportExcel(sortedDepartments)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير المحدد Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDeptIds([])}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-black text-sm transition cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {/* 🔄 أزرار وقائمة تحديد نمط الترتيب (Sort Selector) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <SlidersHorizontal className="w-4 h-4 text-slate-900" />
              <span>نمط الترتيب الحالي:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSortMode('custom')}
                className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
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
                className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  sortMode === 'newest'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>الأحدث إضافة أولاً</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('name_asc')}
                className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  sortMode === 'name_asc'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ArrowDownAZ className="w-4 h-4 shrink-0" /> {/* 🔤 أيقونة الترتيب الأبجدي الفيكتور SVG */}
                <span>أبجدياً (أ - ي)</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('students_desc')}
                className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  sortMode === 'students_desc'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>الأكثر طلاباً</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('teachers_desc')}
                className={`px-3.5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  sortMode === 'teachers_desc'
                    ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                    : 'bg-slate-50 text-slate-950 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>الأكثر تدريسيين</span>
              </button>
            </div>
          </div>
          
          {/* 📊 شبكة كروت الأقسام بحجم مدمج وأكثر احترافية وتناسق */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-3">
            {sortedDepartments.map((dept, index) => {
              // 🔍 استخراج رئيس ومقرر القسم المرتبطين
              const head = profiles.find((p) => p.role === 'department_head' && p.department_id === dept.id) || 
                           (dept.head_name ? { full_name: dept.head_name, generated_email: dept.head_email } : null);
              const rap = profiles.find((p) => p.role === 'rapporteur' && p.department_id === dept.id) ||
                          (dept.rapporteur_name ? { full_name: dept.rapporteur_name, generated_email: dept.rapporteur_email } : null);

              // 📊 إحصائيات طلبة وتدريسيي القسم لتوزيعها داخل الكرت المدمج
              const deptStudents = profiles.filter((p) => p.role === 'student' && (p.department_id === dept.id || p.department_name === dept.name));
              const deptMales = deptStudents.filter((s) => (s.gender || detectArabicGender(s.full_name)) === 'male').length;
              const deptFemales = deptStudents.length - deptMales;
              const femalePct = deptStudents.length > 0 ? Math.round((deptFemales / deptStudents.length) * 100) : 0;

              const deptTeachers = profiles.filter((p) => p.role === 'teacher' && (p.department_id === dept.id || p.department_name === dept.name));
              const tchMales = deptTeachers.filter((t) => (t.gender || detectArabicGender(t.full_name)) === 'male').length;
              const tchFemales = deptTeachers.length - tchMales;
              const tchMalePct = deptTeachers.length > 0 ? Math.round((tchMales / deptTeachers.length) * 100) : 0;

              const isFirst = index === 0;
              const isLast = index === sortedDepartments.length - 1;
              const isSelected = selectedDeptIds.includes(dept.id);

              return (
                <div
                  key={dept.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* 🏷️ الصف العلوي: شارات الترتيب ورمز القسم وأزرار الإجراءات المدمجة */}
                    <div className="flex items-center justify-between gap-2">
                      
                      {/* 🏷️ رمز القسم ورقم الترتيب ومربع الاختيار */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="checkbox" // 🔤 نوع الحقل مربع اختيار
                          aria-label={`تحديد ${dept.name}`} // ♿ نص الوصول المساعد للشاشات
                          checked={isSelected} // 💾 حالة التحديد مرتبطة بالحالة
                          onChange={() => toggleSelect(dept.id)} // 🔄 دالة التحديد أو إلغاء التحديد
                          className="w-4 h-4 rounded-md border-slate-300 text-[#0F2942] focus:ring-2 focus:ring-[#0F2942] cursor-pointer accent-[#0F2942]" // 🎨 تنسيق المربع
                        />
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-950 border border-slate-300 font-black text-xs sm:text-sm rounded-lg shadow-2xs">
                          #{index + 1} {/* 🔢 رقم تسلسل القسم الحالي بخط أوضح */}
                        </span>
                        <span className="px-3 py-1 bg-[#0F2942] text-white font-mono font-black text-xs sm:text-sm rounded-lg shadow-2xs">
                          {dept.code} {/* 🔠 الرمز الإنجليزي المختصر للقسم بخط أكبر */}
                        </span>
                      </div>

                      {/* 🎛️ أزرار التحكم بالترتيب ⬆️ ⬇️ وأزرار التعديل والحذف والمعاينة المدمجة */}
                      <div className="flex items-center gap-1 shrink-0">
                        
                        {/* ⬆️ زر تقديم القسم للأمام */}
                        <button
                          type="button"
                          onClick={(e) => handleMoveDepartment(index, 'up', e)}
                          disabled={isFirst}
                          title="تقديم القسم للأمام"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isFirst
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                              : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs active:scale-95'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* ⬇️ زر تأخير القسم للخلف */}
                        <button
                          type="button"
                          onClick={(e) => handleMoveDepartment(index, 'down', e)}
                          disabled={isLast}
                          title="تأخير القسم للخلف"
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isLast
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                              : 'bg-white text-slate-950 border-slate-300 hover:bg-slate-900 hover:text-white shadow-2xs active:scale-95'
                          }`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* 👁️ زر معاينة تفاصيل القسم */}
                        <button
                          type="button"
                          onClick={() => setViewingDept(dept)}
                          className="px-2.5 py-1 bg-white text-slate-950 hover:bg-slate-900 hover:text-white rounded-lg transition font-black text-xs sm:text-sm flex items-center gap-1 cursor-pointer border border-slate-300 shadow-2xs active:scale-95"
                          title="معاينة تفاصيل وبطاقة القسم"
                        >
                          <Eye className="w-4 h-4 text-blue-700" />
                          <span>معاينة</span>
                        </button>

                        {/* ✏️ زر تعديل بيانات القسم */}
                        <button
                          type="button"
                          onClick={() => openEditDept(dept)}
                          className="px-2.5 py-1 bg-indigo-50/70 text-indigo-950 hover:bg-indigo-700 hover:text-white rounded-lg transition font-black text-xs sm:text-sm flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-2xs active:scale-95"
                          title="تعديل بيانات القسم"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-700" />
                          <span>تعديل</span>
                        </button>

                        {/* 🗑️ زر حذف القسم */}
                        <button
                          type="button"
                          onClick={() => setDeletingDeptId(dept.id)}
                          className="px-2.5 py-1 bg-rose-50/70 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg transition font-black text-xs sm:text-sm flex items-center gap-1 cursor-pointer border border-rose-200 shadow-2xs active:scale-95"
                          title="حذف القسم"
                        >
                          <Trash2 className="w-4 h-4 text-rose-700" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    {/* 🏛️ اسم القسم العلمي الأكاديمي بسطر واحد عريض وأنيق وبدون أي انقسام */}
                    <div className="pt-1">
                      <h3
                        className="font-black text-slate-950 text-lg sm:text-xl whitespace-nowrap truncate tracking-tight" // 🎨 اسم القسم بخط كبير وواضح
                        title={dept.name} // 💡 إظهار الاسم كاملاً بتلميح الماوس إذا كانت الشاشة أصغر
                      >
                        {dept.name} {/* 🏷️ اسم القسم الأكاديمي الصريح */}
                      </h3>
                    </div>

                    {/* 👥 القيادة الأكاديمية (رئيس ومقرر القسم) بنصوص سوداء واضحة وبارزة وحجم مريح */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-black space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-950 font-black flex items-center gap-1.5 shrink-0 text-sm sm:text-base">
                          <Building2 className="w-4 h-4 text-blue-700" />
                          <span>
                            {head && ((head as UserProfile).gender || detectArabicGender(head.full_name)) === 'female' ? 'رئيسة القسم:' : 'رئيس القسم:'} {/* 🚻 تأنيث رئيس القسم */}
                          </span>
                        </span>
                        <span className="font-black text-slate-950 text-sm sm:text-base truncate max-w-[190px]" title={head?.full_name || 'غير محدد'}>
                          {head?.full_name || <span className="text-slate-950 font-black">غير محدد</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-300 pt-2">
                        <span className="text-slate-950 font-black flex items-center gap-1.5 shrink-0 text-sm sm:text-base">
                          <FileText className="w-4 h-4 text-slate-950" />
                          <span>
                            {rap && ((rap as UserProfile).gender || detectArabicGender(rap.full_name)) === 'female' ? 'مقررة القسم:' : 'مقرر القسم:'} {/* 🚻 تأنيث مقرر القسم */}
                          </span>
                        </span>
                        <span className="font-black text-slate-950 text-sm sm:text-base truncate max-w-[190px]" title={rap?.full_name || 'غير محدد'}>
                          {rap?.full_name || <span className="text-slate-950 font-black">غير محدد</span>}
                        </span>
                      </div>
                    </div>

                    {/* 📊 إحصائيات الطلبة والتدريسيين جنباً إلى جنب في شبكة ثنائية بنصوص مكبرة وواضحة جداً */}
                    <div className="grid grid-cols-2 gap-2.5 text-sm">
                      {/* 🎓 كرت إحصائية الطلبة */}
                      <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-950 font-black flex items-center gap-1.5 text-xs sm:text-sm">
                            <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span>الطلبة</span>
                          </span>
                          <span className="font-black text-slate-950 text-base sm:text-lg">
                            {deptStudents.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 bg-white px-2 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                          <span>ذ: {deptMales}</span>
                          <span className="text-slate-300">|</span>
                          <span>ث: {deptFemales}</span>
                          <span className="text-indigo-950 font-black">({femalePct}%)</span>
                        </div>
                      </div>

                      {/* 👥 كرت إحصائية التدريسيين */}
                      <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-950 font-black flex items-center gap-1.5 text-xs sm:text-sm">
                            <Users className="w-4 h-4 text-blue-700 shrink-0" />
                            <span>التدريسيين</span>
                          </span>
                          <span className="font-black text-slate-950 text-base sm:text-lg">
                            {deptTeachers.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-950 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-2xs">
                          <span>ذ: {tchMales}</span>
                          <span className="text-slate-300">|</span>
                          <span>ث: {tchFemales}</span>
                          <span className="text-blue-950 font-black">({tchMalePct}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* 📚 المراحل الدراسية الفعالة الأربعة بنصوص مكبرة وعريضة */}
                    <div className="pt-0.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs sm:text-sm font-black text-slate-950">المراحل الفعالة (4):</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {[1, 2, 3, 4].map((num) => (
                          <div
                            key={num}
                            className="py-1.5 px-0.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 text-slate-950 font-black text-xs sm:text-sm transition shadow-2xs"
                          >
                            المرحلة {getStageNameInArabic(num)}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 🚪 زر تصفح المراحل والمناهج بحجم متناسق وأنيق وكبير */}
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={`/admin/departments/${dept.id}`}
                      className="w-full py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white font-black rounded-xl text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-[#1e4570] active:scale-[0.99]"
                    >
                      <span>تصفح المراحل والمناهج</span>
                      <ArrowLeft className="w-4.5 h-4.5 text-cyan-300" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {sortedDepartments.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-900 border border-blue-200 rounded-3xl mx-auto flex items-center justify-center shadow-xs">
                    <Building2 className="w-8 h-8 text-blue-900" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    {searchQuery ? 'لا توجد نتائج بحث مطابقة' : 'لا توجد أقسام علمية مضافة حتى الآن'}
                  </h3>
                  <p className="text-base font-black text-slate-600 leading-relaxed">
                    {searchQuery
                      ? 'يرجى التأكد من كتابة اسم القسم أو رمزه بدقة.'
                      : 'ابدأ الآن بإضافة الأقسام العلمية المعتمدة لجامعتك وإدارة مراحلها الدراسية بكل سهولة.'}
                  </p>
                  {!searchQuery && (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 px-6 py-3.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-base font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-95 border border-[#1e4570]"
                    >
                      <Plus className="w-5 h-5 text-cyan-300" />
                      <span>إضافة القسم العلمي الأول</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ZeroTrustGuard>
  );
}
