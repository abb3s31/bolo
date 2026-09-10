'use client'; // ⚡ ينفذ بالعميل

// 📢 لوحة إدارة ونشر التعميمات والتبليغات والإنذارات الجامعية الرسمية (CampusAnnouncementsTab)
import { useState, useMemo, useRef, useEffect } from 'react'; // 🔗 رياكت
import { CampusAnnouncement, AnnouncementCategory, AnnouncementTargetScope, UserProfile } from '@/types'; // 🔗 الأنواع
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 الإشعارات
import { exportAbsenceWarningNoticePDF } from '@/lib/pdf-export'; // 📄 مولد كتاب الإنذار PDF
import { saveCampusAnnouncementToSupabase, deleteCampusAnnouncementFromSupabase } from '@/lib/supabase-client'; // ☁️ حفظ وحذف التعميمات في Supabase
import { getAcademicYear, formatAcademicYearDisplay } from '@/lib/mock-data'; // 🗓️ مساعد تنسيق العام الدراسي
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { 
  Bell, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Shirt, 
  Send, 
  CreditCard, // 💳 أيقونة بطاقة الدفع لتبليغات الأقساط بدلاً من النجوم
  Download, 
  Filter, 
  Search, 
  X,
  Building2,
  Users,
  ShieldCheck,
  Palmtree,
  GraduationCap,
  ChevronDown,
  Check,
  User,
  type LucideIcon
} from 'lucide-react'; // 🎨 الأيقونات
import AdminPagination from '@/components/AdminPagination'; // 📑 مكوّن الترقيم والتنقل بين الصفحات الموحد

interface CampusAnnouncementsTabProps {
  departmentId: string;                                // 🏢 معرف القسم
  departmentName: string;                              // 🏢 اسم القسم
  announcements: CampusAnnouncement[];                 // 📋 قائمة التعميمات
  students: UserProfile[];                             // 👥 قائمة الطلاب
  currentUser: UserProfile;                            // 👤 رئيس القسم / المقرر
  onSaveAnnouncement: (announcement: CampusAnnouncement) => void; // 💾 الحفظ
  onDeleteAnnouncement: (id: string) => void;          // 🗑️ الحذف
  headName?: string;                                   // 👤 اسم رئيس القسم
  rapporteurName?: string;                             // 👤 اسم مقرر القسم
}

export default function CampusAnnouncementsTab({
  departmentId,
  departmentName,
  announcements,
  students,
  currentUser,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  headName,
  rapporteurName,
}: CampusAnnouncementsTabProps) {
  // 📌 الحالات
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<CampusAnnouncement | null>(null); // 🗑️ حالة التعميم المراد حذفه
  const [filterCategory, setFilterCategory] = useState<'all' | AnnouncementCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');

  // 📑 حالات الترقيم والتنقل بين صفحات التعميمات والتبليغات الرسمية
  const [announcementPage, setAnnouncementPage] = useState<number>(1); // 🔢 رقم الصفحة الحالية
  const [announcementPageSize, setAnnouncementPageSize] = useState<number>(6); // 📏 عدد التعميمات في كل صفحة

  // 🔄 إعادة تصفير الصفحة عند تغيير الفئة أو نص البحث
  useEffect(() => {
    setAnnouncementPage(1);
  }, [filterCategory, searchQuery]);

  // 📝 نافذة إنشاء / تعديل تعميم أو إنذار
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('term_commencement');
  const [formTargetStage, setFormTargetStage] = useState<number | 'all'>('all');
  const [formTargetScope, setFormTargetScope] = useState<AnnouncementTargetScope>('all');
  const [formTargetStudentId, setFormTargetStudentId] = useState<string>('');
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>('');
  const [formIsUrgent, setFormIsUrgent] = useState<boolean>(false);

  // 🔽 حالات ومراجع القوائم المنسدلة المخصصة
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState<boolean>(false);
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState<boolean>(false);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const stageDropdownRef = useRef<HTMLDivElement>(null);
  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // 🖱️ إغلاق القوائم المنسدلة عند النقر بالخارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(target)) {
        setIsStageDropdownOpen(false);
      }
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(target)) {
        setIsScopeDropdownOpen(false);
      }
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🔍 طلاب القسم
  const deptStudents = useMemo(() => {
    return students.filter((s) => s.department_id === departmentId);
  }, [students, departmentId]);

  // 🔍 تصفية وبحث التعميمات
  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => {
        if (a.department_id !== departmentId) return false;
        if (filterCategory !== 'all' && a.category !== filterCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [announcements, departmentId, filterCategory, searchQuery]);

  // 🏷️ معلومات وأيقونات التصنيفات
  const categoryMetadata: Record<AnnouncementCategory, { label: string; icon: LucideIcon; color: string; bg: string }> = {
    term_commencement: { label: 'بدء واستئناف الدوام', icon: GraduationCap, color: 'text-slate-900', bg: 'bg-slate-100 border-slate-300' },
    official_holiday: { label: 'عطلة رسمية (العراق)', icon: Palmtree, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    uniform_compliance: { label: 'الالتزام بالزي الموحد', icon: Shirt, color: 'text-blue-900', bg: 'bg-blue-50 border-blue-200' },
    absence_warning_1: { label: 'تحذير غياب أولي (5%)', icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    absence_warning_2: { label: 'تحذير غياب ثانٍ (7%)', icon: AlertTriangle, color: 'text-rose-800', bg: 'bg-rose-100 border-rose-300' },
    absence_warning_3: { label: 'إنذار غياب نهائي (10%)', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
    tuition_notice: { label: 'تبليغ تسديد أقساط', icon: CreditCard, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    general: { label: 'تعميم وقرار عام', icon: Bell, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  };

  // ✍️ فتح نافذة إنشاء تعميم جديد
  const handleOpenAddModal = (presetCategory?: AnnouncementCategory) => {
    setEditingId(null);
    const cat = presetCategory || 'term_commencement';
    setFormCategory(cat);
    setFormTargetStage('all');
    setFormTargetScope('all');
    setFormTargetStudentId('');
    setFormTargetStudentIds([]);
    setFormEffectiveDate('');
    setFormIsUrgent(false);

    if (cat === 'term_commencement') {
      // 🚀 تضمين العام الدراسي 2026 - 2027 تلقائياً في العنوان والمحتوى
      setFormTitle('🚀 إعلان موعد بدء الفصل الدراسي واستئناف المحاضرات للعام 2026 - 2027');
      setFormContent('نرحب بطلبتنا الأعزاء بمناسبة انطلاق العام الدراسي الجديد 2026 - 2027.. نود إعلامكم ببدء الدوام واستئناف المحاضرات النظرية والعملية وفق الجداول المعلنة لمسار بولونيا. يرجى الالتزام بالحضور المبكر.');
    } else if (cat === 'official_holiday') {
      setFormTitle('🌴 عطلة رسمية بمناسبة ...');
      setFormContent('استناداً إلى توجيهات الأمانة العامة لمجلس الوزراء الموقر ووزارة التعليم العالي، تقرر تعطيل الدوام الرسمي لكافة الطلبة والكادر التدريسي.');
    } else if (cat === 'uniform_compliance') {
      setFormTitle('👔 الالتزام بالزي الجامعي الموحد وحمل الباج التعريفي');
      setFormContent('نظراً لأهمية المظهر الأكاديمي، يُلزم جميع الطلبة بارتداء الزي الموحد (قميص أبيض / سترة أو بنطال كحلي أو رصاصي أو أسود) وحمل الباج الموحد عند الدخول.');
    } else if (cat === 'absence_warning_1') {
      setFormTitle('⚠️ تحذير غياب أولي (نسبة غياب 5%)');
      setFormContent('تنبيه إلى الطلبة الذين تجاوزت نسبة غياباتهم 5% من ساعات المساق المقررة. يرجى مراجعة مقررية القسم تفادياً لصدور الإنذار الثاني والنهائي.');
    } else if (cat === 'absence_warning_2') {
      setFormTitle('⏳ تحذير غياب ثانٍ (نسبة غياب 7%)');
      setFormContent('إنذار رسمي للطلبة الذين تجاوزت نسبة غياباتهم 7% من الساعات المقررة. يُرجى مراجعة القسم خلال 48 ساعة لتسوية الموقف وإبراز الأعذار الطبية المصدقة.');
    } else if (cat === 'absence_warning_3') {
      setFormTitle('🚨 إنذار غياب نهائي ومخاطر الرسوب (نسبة غياب 10%)');
      setFormContent('إنذار نهائي بالرسوب والترقين للطلبة الذين بلغت غياباتهم 10%. سيتم الحرمان من دخول الامتحانات النهائية الفاينل في المواد المشمولة وفق تعليمات مسار بولونيا.');
      setFormIsUrgent(true);
    } else {
      setFormTitle('');
      setFormContent('');
    }

    setIsModalOpen(true);
  };

  // ✍️ فتح نافذة تعديل تعميم
  const handleOpenEditModal = (item: CampusAnnouncement) => {
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormTargetStage(item.target_stage === null ? 'all' : item.target_stage);
    setFormTargetScope(item.target_scope);
    setFormTargetStudentId(item.target_student_ids?.[0] || '');
    setFormTargetStudentIds(item.target_student_ids || []);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormEffectiveDate(item.effective_date || '');
    setFormIsUrgent(item.is_urgent);
    setIsModalOpen(true);
  };

  // 💾 حفظ التعميم وبث الإشعارات
  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setToastMsg('⚠️ يرجى إدخال عنوان ومحتوى التعميم قبل الحفظ.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    const targetStudentIdsArray = 
      formTargetScope === 'single_student' && formTargetStudentId
        ? [formTargetStudentId]
        : formTargetScope === 'selected_students'
        ? formTargetStudentIds
        : [];

    const newAnnouncement: CampusAnnouncement = {
      id: editingId || `ann-${Date.now()}`,
      department_id: departmentId,
      department_name: departmentName,
      target_stage: formTargetStage === 'all' ? null : Number(formTargetStage),
      target_scope: formTargetScope,
      target_student_ids: targetStudentIdsArray,
      category: formCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      effective_date: formEffectiveDate.trim() || undefined,
      is_urgent: formIsUrgent,
      author_name: currentUser.full_name || 'رئاسة القسم',
      author_role: currentUser.role === 'department_head' ? 'رئيس القسم' : 'مقرر القسم',
      created_at: editingId ? announcements.find((a) => a.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
    };

    onSaveAnnouncement(newAnnouncement);
    saveCampusAnnouncementToSupabase(newAnnouncement); // ☁️ رفع وحفظ التعميم في Supabase

    // 🔔 بث إشعار فوري للطلبة المشمولين
    let recipients: UserProfile[] = [];
    if (formTargetScope === 'single_student' && formTargetStudentId) {
      recipients = deptStudents.filter((s) => s.id === formTargetStudentId);
    } else if (formTargetScope === 'selected_students') {
      recipients = deptStudents.filter((s) => formTargetStudentIds.includes(s.id));
    } else if (formTargetStage !== 'all') {
      recipients = deptStudents.filter((s) => (s.stage_number || 1) === formTargetStage);
    } else {
      recipients = deptStudents;
    }

    recipients.forEach((std) => {
      sendAppNotification({
        recipient_id: std.id,
        recipient_role: 'student',
        title: formTitle,
        message: formContent,
        type: formCategory.startsWith('absence_warning') ? 'absence_warning' : formCategory === 'tuition_notice' ? 'tuition_notice' : 'official_announcement',
        link: '/student/dashboard',
      });
    });

    setIsModalOpen(false);
    setToastMsg(`تم بنجاح نشر التعميم وإرسال التنبيه الفوري لـ (${recipients.length}) طالباً!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 📄 تصدير كتاب إنذار غياب رسمي PDF
  const handleExportAbsencePDF = async (ann: CampusAnnouncement) => {
    if (ann.category !== 'absence_warning_1' && ann.category !== 'absence_warning_2' && ann.category !== 'absence_warning_3') {
      return;
    }

    const targetStudent = deptStudents.find((s) => s.id === ann.target_student_ids?.[0]);
    const studentName = targetStudent?.full_name || 'طالب المرحلة';
    const studentCode = targetStudent?.university_number || '---';

    await exportAbsenceWarningNoticePDF({
      studentName,
      studentCode,
      departmentName,
      stageNumber: ann.target_stage || 1,
      warningLevel: ann.category,
      customDetails: ann.content,
      headName,
      rapporteurName,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) عند نشر أو تعديل أو حذف تعميم أو إنذار */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <h4 className="font-black text-base text-slate-950">إشعار مركز التعميمات</h4>
                <p className="font-bold text-sm text-slate-600 mt-0.5">{toastMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 🎛️ الهيدر وأزرار الإنشاء السريع بحدود ناعمة */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-black">
              قسم {departmentName}
            </span>
            <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-sm font-black">
              مركز التعميمات والتبليغات الرسمية
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-950 border border-indigo-200 font-black text-sm rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-700" />
              <span>العام الدراسي <bdi dir="ltr">{formatAcademicYearDisplay(getAcademicYear())}</bdi></span>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-700" />
            <span>التعميمات الجامعية، العطل الرسمية، والإنذارات المتدرجة (Campus Announcements & Warnings)</span>
          </h3>
          <p className="text-base text-slate-700 font-black mt-1">
            إصدار تبليغات بدء الدوام، العطل الرسمية لجمهورية العراق، الزي الموحد، وإنذارات الغياب (أول، ثانٍ، نهائي)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAddModal('term_commencement')}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <GraduationCap className="w-4 h-4 text-indigo-700" />
            <span>بدء الدوام 🚀</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('official_holiday')}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Palmtree className="w-4 h-4 text-emerald-700" />
            <span>عطلة رسمية 🌴</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('uniform_compliance')}
            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Shirt className="w-4 h-4 text-sky-700" />
            <span>الزي الموحد 👔</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('absence_warning_1')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-rose-200" />
            <span>إنذار غياب ⚠️</span>
          </button>
        </div>
      </div>

      {/* 🎛️ شريط الفلاتر والبحث بحدود ناعمة */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* فلاتر التصنيف */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' }`}
          >
            كافة التعميمات ({filteredAnnouncements.length})
          </button>
          
          <button
            type="button"
            onClick={() => setFilterCategory('term_commencement')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'term_commencement' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-950' }`}
          >
            بدء الدوام
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('official_holiday')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'official_holiday' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-950' }`}
          >
            العطل الرسمية
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('uniform_compliance')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory === 'uniform_compliance' ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-950' }`}
          >
            الزي الموحد
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('absence_warning_1')}
            className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterCategory.startsWith('absence_warning') ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-950' }`}
          >
            إنذارات الغياب
          </button>
        </div>

        {/* البحث */}
        <div className="relative min-w-[260px]">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في عنوان أو نص التعميم..."
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden"
          />
        </div>
      </div>

      {/* 📋 قائمة التعميمات والتبليغات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          // 🔢 نحسب رقم الصفحة الآمن للتعميمات حتى نتجنب الخروج خارج الحدود
          const safeAnnouncementPage = Math.max(1, Math.min(announcementPage, Math.max(1, Math.ceil(filteredAnnouncements.length / announcementPageSize))));
          // ✂️ نقطع مصفوفة التعميمات لعرض ما يخص الصفحة الحالية فقط
          const paginatedAnnouncements = filteredAnnouncements.slice((safeAnnouncementPage - 1) * announcementPageSize, safeAnnouncementPage * announcementPageSize);

          // 🔄 نعمل خريطة لعرض التعميمات في الصفحة الحالية
          return paginatedAnnouncements.map((ann) => {
            const meta = categoryMetadata[ann.category] || categoryMetadata.general;
            const isWarning = ann.category.startsWith('absence_warning');
            const CategoryIcon = meta.icon;

          return (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl border p-6 space-y-4 shadow-xs transition hover:shadow-md ${
                ann.is_urgent ? 'border-rose-500 ring-2 ring-rose-400/50' : 'border-slate-200'
              }`}
            >
              {/* شريط التصنيف والتاريخ */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-sm font-black border flex items-center gap-1.5 ${meta.bg} ${meta.color}`}>
                    <CategoryIcon className="w-4 h-4" />
                    <span>{meta.label}</span>
                  </span>

                  {ann.is_urgent && (
                    <span className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-sm font-black animate-pulse">
                      عاجل وهام 🚨
                    </span>
                  )}
                </div>

                <span className="text-sm font-black text-slate-700 font-mono">
                  {new Date(ann.created_at).toLocaleDateString('ar-IQ-u-nu-latn')}
                </span>
              </div>

              {/* العنوان والمحتوى */}
              <div>
                <h4 className="font-black text-lg sm:text-xl text-slate-950 leading-snug">
                  {ann.title}
                </h4>
                <p className="text-base font-black text-slate-800 mt-2.5 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-300">
                  {ann.content}
                </p>
              </div>

              {/* تفاصيل النفاذ والاستهداف */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-base font-black text-slate-700 pt-1">
                <div className="flex items-center gap-2">
                  <span>المستهدف: <strong className="text-slate-950">{ann.target_stage ? `المرحلة ${ann.target_stage}` : 'كافة المراحل'}</strong></span>
                  {ann.effective_date && (
                    <>
                      <span>•</span>
                      <span>تاريخ النفاذ: <strong className="text-indigo-700 font-mono">{ann.effective_date}</strong></span>
                    </>
                  )}
                </div>

                <span className="text-sm font-black text-slate-700">بواسطة: {ann.author_name} ({ann.author_role})</span>
              </div>

              {/* أزرار الإجراءات */}
              <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between">
                <div>
                  {isWarning && (
                    <button
                      type="button"
                      onClick={() => handleExportAbsencePDF(ann)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 rounded-xl text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4 text-rose-700" />
                      <span>تصدير كتاب الإنذار PDF 📄</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(ann)}
                    className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                    title="تعديل التعميم"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingAnnouncement(ann)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="حذف التعميم"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          );
        });
      })()}

        {filteredAnnouncements.length === 0 && (
          <div className="col-span-full bg-white p-14 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-3 shadow-xs animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <Bell className="w-7 h-7 text-blue-900" />
            </div>
            <h4 className="text-xl font-black text-slate-950">
              {searchQuery || filterCategory !== 'all' ? 'لا توجد تعميمات أو تبليغات مطابقة' : 'لا توجد تعميمات أو تبليغات منشورة حتى الآن'}
            </h4>
            <p className="text-sm font-black text-slate-600 max-w-md mx-auto leading-relaxed">
              {searchQuery || filterCategory !== 'all'
                ? 'يرجى تجربة تعديل محددات البحث أو الفئة.'
                : 'يمكنك إصدار أول تعميم جامعي رسمي أو توجيه إنذارات الغياب للطلبة بكل سهولة.'}
            </p>
            {!(searchQuery || filterCategory !== 'all') && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormCategory('term_commencement');
                    setFormTargetStage('all');
                    setFormTargetScope('all');
                    setFormTargetStudentId('');
                    setFormTargetStudentIds([]);
                    setFormTitle('');
                    setFormContent('');
                    setFormEffectiveDate('');
                    setFormIsUrgent(false);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white text-sm font-black rounded-xl transition flex items-center gap-2 mx-auto cursor-pointer shadow-xs active:scale-95 border border-[#1e4570]"
                >
                  <Plus className="w-4 h-4 text-cyan-300" />
                  <span>إصدار تعميم رسمي جديد</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📑 شريط التنقل بين صفحات التعميمات والتبليغات الرسمية */}
      <AdminPagination
        currentPage={announcementPage}
        totalItems={filteredAnnouncements.length}
        pageSize={announcementPageSize}
        onPageChange={setAnnouncementPage}
        onPageSizeChange={setAnnouncementPageSize}
        itemLabel="تعميم / تبليغ"
        className="mt-4"
      />

      {/* ========================================================================= */}
      {/* 📝 نافذة إنشاء / تعديل تعميم أو إنذار بحدود ناعمة */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-200">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-950">
                    {editingId ? 'تعديل التعميم / التبليغ الرسمي' : 'إصدار تعميم / إنذار رسمي جديد'}
                  </h4>
                  <span className="text-base font-black text-slate-700">قسم {departmentName}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-700 hover:text-black rounded-xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-base font-black">
              
              {/* تصنيف التعميم - قائمة منسدلة مخصصة */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block text-slate-950 font-black mb-1.5">نوع وتصنيف التعميم:</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsStageDropdownOpen(false);
                    setIsScopeDropdownOpen(false);
                    setIsStudentDropdownOpen(false);
                  }}
                  className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl text-base font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-xs ${
                    isCategoryDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const meta = categoryMetadata[formCategory];
                      const IconComponent = meta?.icon || Bell;
                      return (
                        <>
                          <div className={`p-1.5 rounded-xl border ${meta?.bg || 'bg-slate-100 border-slate-300'}`}>
                            <IconComponent className={`w-4 h-4 ${meta?.color || 'text-slate-900'}`} />
                          </div>
                          <span>{meta?.label || 'تعميم وقرار عام'}</span>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { key: 'term_commencement' as AnnouncementCategory, label: '🚀 بدء واستئناف الدوام والمحاضرات' },
                      { key: 'official_holiday' as AnnouncementCategory, label: '🌴 عطلة رسمية لجمهورية العراق' },
                      { key: 'uniform_compliance' as AnnouncementCategory, label: '👔 الالتزام بالزي الجامعي الموحد والباج' },
                      { key: 'absence_warning_1' as AnnouncementCategory, label: '⚠️ تحذير غياب أولي (نسبة 5%)' },
                      { key: 'absence_warning_2' as AnnouncementCategory, label: '⏳ تحذير غياب ثانٍ (نسبة 7%)' },
                      { key: 'absence_warning_3' as AnnouncementCategory, label: '🚨 إنذار غياب نهائي ومخاطر الرسوب (نسبة 10%)' },
                      { key: 'general' as AnnouncementCategory, label: '📢 تعميم وقرار عام' },
                    ].map((item) => {
                      const isSelected = formCategory === item.key;
                      const meta = categoryMetadata[item.key];
                      const ItemIcon = meta?.icon || Bell;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setFormCategory(item.key);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ItemIcon className={`w-4 h-4 ${meta?.color || 'text-slate-800'}`} />
                            <span>{item.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* المرحلة المستهدفة ونطاق التوجيه */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* المرحلة الدراسية */}
                <div className="relative" ref={stageDropdownRef}>
                  <label className="block text-slate-950 font-black mb-1.5">المرحلة الدراسية:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStageDropdownOpen(!isStageDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                      setIsScopeDropdownOpen(false);
                      setIsStudentDropdownOpen(false);
                    }}
                    className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl text-base font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-xs ${
                      isStageDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>
                      {formTargetStage === 'all'
                        ? 'كافة المراحل (1 - 4)'
                        : `المرحلة ${formTargetStage === 1 ? 'الأولى' : formTargetStage === 2 ? 'الثانية' : formTargetStage === 3 ? 'الثالثة' : 'الرابعة'}`}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform ${isStageDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStageDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { key: 'all' as const, label: 'كافة المراحل (1 - 4) 🎓' },
                        { key: 1 as const, label: 'المرحلة الأولى 1️⃣' },
                        { key: 2 as const, label: 'المرحلة الثانية 2️⃣' },
                        { key: 3 as const, label: 'المرحلة الثالثة 3️⃣' },
                        { key: 4 as const, label: 'المرحلة الرابعة 4️⃣' },
                      ].map((stg) => {
                        const isSelected = formTargetStage === stg.key;
                        return (
                          <button
                            key={String(stg.key)}
                            type="button"
                            onClick={() => {
                              setFormTargetStage(stg.key);
                              setIsStageDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                              isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <span>{stg.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* فئة الاستهداف */}
                <div className="relative" ref={scopeDropdownRef}>
                  <label className="block text-slate-950 font-black mb-1.5">فئة الاستهداف:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScopeDropdownOpen(!isScopeDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                      setIsStageDropdownOpen(false);
                      setIsStudentDropdownOpen(false);
                    }}
                    className={`w-full p-3.5 bg-slate-50 hover:bg-slate-100 border-2 rounded-2xl text-base font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-xs ${
                      isScopeDropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>
                      {formTargetScope === 'all'
                        ? 'كافة طلاب المرحلة 👥'
                        : formTargetScope === 'single_student'
                        ? 'طالب منفرد محدد 👤'
                        : 'طلاب محددون بالاسم 📋'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-700 transition-transform ${isScopeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isScopeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { key: 'all' as AnnouncementTargetScope, label: 'كافة طلاب المرحلة 👥' },
                        { key: 'single_student' as AnnouncementTargetScope, label: 'طالب منفرد محدد 👤' },
                        { key: 'selected_students' as AnnouncementTargetScope, label: 'طلاب محددون بالاسم 📋' },
                      ].map((sc) => {
                        const isSelected = formTargetScope === sc.key;
                        return (
                          <button
                            key={sc.key}
                            type="button"
                            onClick={() => {
                              setFormTargetScope(sc.key);
                              setIsScopeDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right font-black text-sm transition flex items-center justify-between cursor-pointer ${
                              isSelected ? 'bg-indigo-50 text-indigo-950 border border-indigo-300' : 'text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <span>{sc.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-indigo-700" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* اختيار الطالب في حال التخصيص */}
              {formTargetScope === 'single_student' && (
                <div className="bg-rose-50/70 p-4 rounded-2xl border-2 border-rose-300 space-y-2 relative" ref={studentDropdownRef}>
                  <label className="block text-rose-950 font-black">اختر الطالب المستهدف بالإنذار / التبليغ:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStudentDropdownOpen(!isStudentDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                      setIsStageDropdownOpen(false);
                      setIsScopeDropdownOpen(false);
                    }}
                    className={`w-full p-3 bg-white hover:bg-rose-50/50 border-2 rounded-xl text-base font-black text-slate-950 flex items-center justify-between transition cursor-pointer ${
                      isStudentDropdownOpen ? 'border-rose-500 ring-2 ring-rose-400/30' : 'border-rose-300 hover:border-rose-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-800" />
                      <span>
                        {(() => {
                          const selectedStd = deptStudents.find((s) => s.id === formTargetStudentId);
                          return selectedStd
                            ? `${selectedStd.full_name} (المرحلة ${selectedStd.stage_number || 1})`
                            : '-- انقر لاختيار طالب من القسم --';
                        })()}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-rose-900 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStudentDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      <div className="sticky top-0 bg-white pb-1.5 z-10">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-700 absolute right-3 top-3" />
                          <input
                            type="text"
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            placeholder="ابحث باسم الطالب..."
                            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-950 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        {deptStudents
                          .filter((s) => !studentSearchTerm.trim() || s.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                          .map((s) => {
                            const isSelected = formTargetStudentId === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setFormTargetStudentId(s.id);
                                  setIsStudentDropdownOpen(false);
                                  setStudentSearchTerm('');
                                }}
                                className={`w-full p-2.5 rounded-xl text-right font-black text-xs transition flex items-center justify-between cursor-pointer ${
                                  isSelected ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'text-slate-900 hover:bg-slate-100'
                                }`}
                              >
                                <span>{s.full_name} (المرحلة {s.stage_number || 1})</span>
                                {isSelected && <Check className="w-4 h-4 text-rose-800" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* عنوان التعميم */}
              <div>
                <label className="block text-slate-950 font-black mb-1.5">عنوان التعميم / الأمر الإداري:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: إعلان عطلة رسمية..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden"
                />
              </div>

              {/* نص التعميم */}
              <div>
                <label className="block text-slate-950 font-black mb-1.5">نص وتفاصيل التعميم:</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب التوجيهات والتعليمات الرسمية هنا..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* تاريخ النفاذ وعاجل */}
              <div className="grid grid-cols-2 gap-3.5 items-center">
                <div>
                  <label className="block text-slate-950 font-black mb-1.5">تاريخ النفاذ / موعد العطلة:</label>
                  <input
                    type="date"
                    value={formEffectiveDate}
                    onChange={(e) => setFormEffectiveDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden font-mono"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsUrgent}
                      onChange={(e) => setFormIsUrgent(e.target.checked)}
                      className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-base font-black text-rose-950">تمييز كـ (عاجل وهام 🚨)</span>
                  </label>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-base font-black transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
              >
                <Send className="w-5 h-5 text-emerald-300" />
                <span>نشر وبث التعميم فورياً 📢</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ كارد تأكيد حذف التعميم الجامعي الاحترافي الفاخر */}
      <ConfirmDeleteModal
        isOpen={!!deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        title="تأكيد حذف التعميم الأكاديمي"
        itemName={deletingAnnouncement?.title || ''}
        itemDetails={`الفئة: ${deletingAnnouncement?.category || '—'} | النطاق: ${deletingAnnouncement?.target_scope || '—'} | التاريخ: ${deletingAnnouncement?.created_at?.slice(0, 10) || '—'}`}
        warningMessage="هل أنت متأكد من حذف هذا التعميم؟ سيتم إلغاء ظهوره فوراً من لوحات إعلانات الطلبة والأساتذة."
        onConfirm={() => {
          if (deletingAnnouncement) {
            onDeleteAnnouncement(deletingAnnouncement.id);
            deleteCampusAnnouncementFromSupabase(deletingAnnouncement.id); // ☁️ حذف التعميم من Supabase
            setToastMsg('تم حذف التعميم بنجاح.');
            setDeletingAnnouncement(null);
          }
        }}
      />

    </div>
  );
}
