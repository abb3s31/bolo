'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 💳 لوحة إدارة ومتابعة تسديد الأقساط والوصولات المالية للطلبة (TuitionManagementTab) - مسار بولونيا
import { useState, useMemo, useRef, useEffect } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والحسابات والمراجع
import { 
  StudentTuitionRecord, 
  UserProfile, 
  TuitionInstallmentItem, 
  TuitionSettlementStatus,
  TuitionDiscountType
} from '@/types'; // 🔗 الأنواع المحددة والصريحة
import { 
  exportTuitionRecordsExcel, 
  downloadTuitionRecordsTemplate, 
  parseExcelFile 
} from '@/lib/excel-utils'; // 📊 مصدّر ومستورد كشوفات ونماذج الأقساط Excel
import { exportTuitionSettlementReceiptPDF, exportSingleTuitionReceiptPDF } from '@/lib/pdf-export'; // 📄 مصدّر سندات ووصولات التسديد PDF
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { getAcademicYear } from '@/lib/mock-data'; // 🗓️ جلب السنة الدراسية المعتمدة
import { syncAcademicYearFromSupabase, subscribeToAcademicYearChanges } from '@/lib/supabase-client'; // ☁️ المزامنة السحابية واشتراك البث الحي للعام الدراسي
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 الإشعارات الفورية
import TuitionNoticeModal from './TuitionNoticeModal'; // 📢 نافذة التبليغات الذكية
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  Users, 
  Edit3, 
  X, 
  ShieldCheck, 
  Sun, 
  Moon, 
  CheckSquare, 
  FileSpreadsheet, 
  RotateCcw, 
  Receipt, 
  User, 
  Check, 
  Percent, 
  Calendar, 
  Wallet, 
  AlertTriangle,
  Download,
  Upload,
  HelpCircle,
  Info,
  FileUp,
  Layers,
  ChevronDown,
  Banknote,
  Award,
  GraduationCap
} from 'lucide-react'; // 🎨 استيراد أيقونات SVG الرسمية
import AdminPagination from '@/components/AdminPagination'; // 📑 مكوّن الترقيم والتنقل بين الصفحات الموحد

// 💵 مصفوفة خيارات طرق التسديد المصممة باحترافية (تسديد نقدي ودفع إلكتروني حصراً)
interface PaymentMethodOptionItem {
  id: 'cash' | 'electronic';                              // 🔑 المعرف (تسديد نقدي ودفع إلكتروني فقط)
  label: string;                                          // 🏷️ اسم الطريقة
  subLabel: string;                                       // 📝 الشرح والبيان
  badge: string;                                          // 🏷️ الشارة
  badgeColor: string;                                     // 🎨 لون الشارة
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOptionItem[] = [
  {
    id: 'cash',
    label: 'تسديد نقدي',
    subLabel: 'تسديد نقدي مباشر في شعبة الشؤون المالية والحسابات',
    badge: 'نقدي',
    badgeColor: 'bg-emerald-50 text-emerald-950 border-emerald-300',
  },
  {
    id: 'electronic',
    label: 'دفع إلكتروني / بطاقة',
    subLabel: 'تسديد إلكتروني معتمد عبر بوابة الدفع الإلكتروني / POS',
    badge: 'دفع إلكتروني',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
  },
];

// 🎁 مصفوفة خيارات التخفيضات والمنح المالية
interface DiscountTypeOptionItem {
  id: TuitionDiscountType;                               // 🔑 نوع التخفيض
  label: string;                                          // 🏷️ اسم التخفيض
  defaultPercent: number;                                 // 📊 النسبة الافتراضية
  badge: string;                                          // 🏷️ الشارة
  badgeColor: string;                                     // 🎨 لون الشارة
  desc: string;                                           // 📝 الوصف
}

const DISCOUNT_TYPE_OPTIONS: DiscountTypeOptionItem[] = [
  {
    id: 'none',
    label: 'بدون تخفيض (القسط الكامل)',
    defaultPercent: 0,
    badge: '0%',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'لا يوجد تخفيض، استحقاق القسط كاملاً',
  },
  {
    id: 'martyrs_family',
    label: 'ذوو الشهداء وضحايا الإرهاب',
    defaultPercent: 50,
    badge: 'تخفيض 50%',
    badgeColor: 'bg-blue-50 text-blue-950 border-blue-300',
    desc: 'تخفيض 50% معتمد بكتاب مؤسسة الشهداء',
  },
  {
    id: 'top_student',
    label: 'الطالب الأول على المرحلة',
    defaultPercent: 100,
    badge: 'إعفاء 100%',
    badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-400',
    desc: 'إعفاء كامل 100% للتفوق والريادة الأكاديمية',
  },
  {
    id: 'siblings',
    label: 'إخوة دارسون بالجامعة',
    defaultPercent: 10,
    badge: 'تخفيض 10%',
    badgeColor: 'bg-sky-50 text-sky-950 border-sky-300',
    desc: 'تخفيض 10% لوجود أخ دارس بالجامعة',
  },
  {
    id: 'destitute_aid',
    label: 'رعاية اجتماعية ومتعففون',
    defaultPercent: 0,
    badge: 'رعاية اجتماعية',
    badgeColor: 'bg-emerald-50 text-emerald-950 border-emerald-300',
  desc: 'تخفيض للرعاية الاجتماعية يُحدد حسب النسبة المقررة',
  },
  {
    id: 'custom',
    label: 'تخفيض مخصص بقرار مجلس الكلية',
    defaultPercent: 0,
    badge: 'قرار مجلس الكلية',
    badgeColor: 'bg-blue-100 text-blue-950 border-blue-300',
    desc: 'تخفيض استثنائي بقرار مجلس الكلية / رئاسة الجامعة',
  },
];

interface TuitionManagementTabProps {
  departmentId: string;                                // 🏢 معرف القسم
  departmentName: string;                              // 🏢 اسم القسم
  students: UserProfile[];                             // 👥 كافة الطلبة
  tuitionRecords: StudentTuitionRecord[];              // 📋 سجلات الأقساط
  onSaveTuitionRecord: (record: StudentTuitionRecord) => void; // 💾 حفظ وتحديث السجل
  currentUser: UserProfile;                            // 👤 المستخدم الحالي (رئيس القسم / المقرر / المحاسب)
  academicYear?: string;                               // 🗓️ العام الدراسي المعتمد المتزامن
}

export default function TuitionManagementTab({
  departmentId,
  departmentName,
  students,
  tuitionRecords,
  onSaveTuitionRecord,
  currentUser,
  academicYear: propAcademicYear,
}: TuitionManagementTabProps) {
  // 📌 حالات التصفية والبحث
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const [filterStudyType, setFilterStudyType] = useState<'all' | 'morning' | 'evening'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | TuitionSettlementStatus | 'prior_unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentTuitionIds, setSelectedStudentTuitionIds] = useState<string[]>([]); // 🔘 معرفات الطلبة المحددين
  const [toastMsg, setToastMsg] = useState<string>(''); // 🔔 رسالة التنبيه العائم

  // 📑 حالات الترقيم والتنقل بين صفحات سجلات الأقساط المالية
  const [tuitionPage, setTuitionPage] = useState<number>(1); // 🔢 رقم الصفحة الحالية
  const [tuitionPageSize, setTuitionPageSize] = useState<number>(10); // 📏 عدد السجلات في كل صفحة

  // 🔄 إعادة تصفير الصفحة عند تغيير معايير البحث أو التصفية
  useEffect(() => {
    setTuitionPage(1);
  }, [selectedStage, filterStudyType, filterStatus, searchQuery]);

  // 🗓️ حالة العام الدراسي المتزامن مع المسؤول العام وقاعدة بيانات Supabase
  const [academicYear, setAcademicYear] = useState<string>(() => propAcademicYear || getAcademicYear());

  // 🔄 مزامنة الحالة إذا تغيرت الخاصية الممررة
  useEffect(() => {
    if (propAcademicYear) {
      setAcademicYear(propAcademicYear);
    }
  }, [propAcademicYear]);

  // ☁️ مزامنة العام الدراسي مع السحابة والاستماع لتعديلات المسؤول العام اللحظية
  useEffect(() => {
    if (typeof syncAcademicYearFromSupabase === 'function') {
      syncAcademicYearFromSupabase().then((liveYear) => {
        if (liveYear) setAcademicYear(liveYear);
      }).catch(() => {});
    }

    let unsubscribe: (() => void) | undefined;
    if (typeof subscribeToAcademicYearChanges === 'function') {
      unsubscribe = subscribeToAcademicYearChanges((liveYear) => {
        setAcademicYear(liveYear);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 📢 نافذة التبليغات الذكية
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);

  // 📝 نافذة تسجيل دفعة قسط جديدة بوصل قبض
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [activeRecordForPayment, setActiveRecordForPayment] = useState<StudentTuitionRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(500000);
  const [payReceiptNo, setPayReceiptNo] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [payMethod, setPayMethod] = useState<'cash' | 'electronic' | 'bank_cheque' | 'exemption'>('cash');
  const [payCashier, setPayCashier] = useState<string>(currentUser?.full_name || 'شعبة الحسابات المركزية');
  const [payNote, setPayNote] = useState<string>('تسديد نقدي في شعبة الشؤون المالية والحسابات');

  // 📄 نافذة كشف الحساب المالي التفصيلي للطالب
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);
  const [activeRecordForStatement, setActiveRecordForStatement] = useState<StudentTuitionRecord | null>(null);

  // ✏️ نافذة تعديل القسط والتخفيض المالي
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [activeRecordForDiscount, setActiveRecordForDiscount] = useState<StudentTuitionRecord | null>(null);
  const [editBaseAmount, setEditBaseAmount] = useState<number>(1800000);
  const [editDiscountType, setEditDiscountType] = useState<TuitionDiscountType>('none');
  const [editCustomDiscountName, setEditCustomDiscountName] = useState<string>(''); // 🏷️ اسم التخفيض المخصص
  const [editDiscountPercent, setEditDiscountPercent] = useState<number>(0);
  const [editDiscountNotes, setEditDiscountNotes] = useState<string>('');

  // 🎛️ حالات فتح ومراجع القوائم المنسدلة المخصصة الاحترافية
  const [isPayMethodDropdownOpen, setIsPayMethodDropdownOpen] = useState<boolean>(false); // 🔽 فتح منسدلة طرق التسديد
  const payMethodDropdownRef = useRef<HTMLDivElement | null>(null); // 📍 مرجع منسدلة طرق التسديد

  const [isDiscountTypeDropdownOpen, setIsDiscountTypeDropdownOpen] = useState<boolean>(false); // 🔽 فتح منسدلة نوع التخفيض
  const discountTypeDropdownRef = useRef<HTMLDivElement | null>(null); // 📍 مرجع منسدلة نوع التخفيض

  // 🖱️ إغلاق القوائم المنسدلة تلقائياً عند النقر خارجها
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (payMethodDropdownRef.current && !payMethodDropdownRef.current.contains(target)) {
        setIsPayMethodDropdownOpen(false);
      }
      if (discountTypeDropdownRef.current && !discountTypeDropdownRef.current.contains(target)) {
        setIsDiscountTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ⏳ حالات ملفات Excel (تصدير، استيراد، ونموذج، وتعليمات)
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExcelInstructionsOpen, setIsExcelInstructionsOpen] = useState<boolean>(false);
  const [isImportingExcel, setIsImportingExcel] = useState<boolean>(false);
  const [isExcelImportReportOpen, setIsExcelImportReportOpen] = useState<boolean>(false);
  const [excelImportReport, setExcelImportReport] = useState<{
    acceptedCount: number;
    updatedCount: number;
    rejectedList: { rowNumber: number; rawName: string; reason: string }[];
  }>({ acceptedCount: 0, updatedCount: 0, rejectedList: [] });

  // 🔍 طلاب القسم والمرحلة المحددة
  const stageStudents = useMemo(() => {
    return students.filter(
      (s) => s.department_id === departmentId && (selectedStage === 'all' || (s.stage_number || 1) === selectedStage)
    );
  }, [students, departmentId, selectedStage]);

  // 🔍 دمج السجلات مع الطلاب وضمان وجود سجل مالي خاص لكل طالب
  const combinedRecords: StudentTuitionRecord[] = useMemo(() => {
    return stageStudents.map((std) => {
      const studentStage = std.stage_number || 1;
      const existing = tuitionRecords.find((r) => r.student_id === std.id && r.stage_number === studentStage);
      if (existing) {
        // تحديث الحقول الافتراضية للتخفيض وتسقيف المسدد بحيث لا يتجاوز القسط إطلاقاً
        const studentStage = std.stage_number || 1;
        const isEvening = (std.study_type || 'morning') === 'evening';
        const defaultBase = studentStage === 1 ? (isEvening ? 2200000 : 1800000) : (isEvening ? 2300000 : 1900000);
        const base = existing.base_amount || existing.total_amount || defaultBase;
        const discPercent = existing.discount_percentage || 0;
        const discAmount = existing.discount_amount !== undefined ? existing.discount_amount : Math.round((base * discPercent) / 100);
        const calculatedNetTotal = Math.max(0, base - discAmount);
        // 🛡️ منع تجاوز المسدد لإجمالي القسط مهما كانت الظروف
        const safePaid = Math.min(calculatedNetTotal, Math.max(0, existing.paid_amount || 0));
        const safeRemaining = Math.max(0, calculatedNetTotal - safePaid);

        let safeStatus: TuitionSettlementStatus = existing.status;
        if (safePaid >= calculatedNetTotal && calculatedNetTotal > 0) {
          safeStatus = 'fully_settled';
        } else if (calculatedNetTotal === 0) {
          safeStatus = 'exempt';
        } else if (safePaid > 0) {
          safeStatus = 'partially_settled';
        } else {
          safeStatus = 'unsettled';
        }

        return {
          ...existing,
          base_amount: base,
          discount_type: existing.discount_type || 'none',
          custom_discount_name: existing.custom_discount_name,
          discount_percentage: discPercent,
          discount_amount: discAmount,
          total_amount: calculatedNetTotal,
          paid_amount: safePaid,
          remaining_amount: safeRemaining,
          status: safeStatus,
          financial_clearance: safeStatus === 'fully_settled' || safeStatus === 'exempt' ? 'cleared' : (existing.financial_clearance || 'uncleared'),
        };
      }

      // سجل مالي جديد خاص بالطالب
      const isEvening = (std.study_type || 'morning') === 'evening';
      const defaultBase = studentStage === 1 ? (isEvening ? 2200000 : 1800000) : (isEvening ? 2300000 : 1900000);
      return {
        id: `tuition-${std.id}-${studentStage}`,
        student_id: std.id,
        student_name: std.full_name,
        student_code: std.university_number || '---',
        department_id: departmentId,
        stage_number: studentStage,
        study_type: std.study_type || 'morning',
        academic_year: academicYear,
        base_amount: defaultBase,
        discount_type: 'none',
        discount_percentage: 0,
        discount_amount: 0,
        total_amount: defaultBase,
        installments_count: 3,
        paid_amount: 0,
        remaining_amount: defaultBase,
        status: 'unsettled',
        financial_clearance: 'uncleared',
        paid_installments: [],
        unpaid_stages_count: 0,
        notes: 'سجل مالي جديد',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  }, [stageStudents, tuitionRecords, departmentId]);

  // 🔍 الفلترة والبحث
  const filteredRecords = useMemo(() => {
    return combinedRecords.filter((rec) => {
      // فلترة الفترة الدراسية
      if (filterStudyType !== 'all' && (rec.study_type || 'morning') !== filterStudyType) {
        return false;
      }

      // فلترة الموقف المالي
      if (filterStatus !== 'all') {
        if (filterStatus === 'prior_unpaid') {
          if (rec.unpaid_stages_count <= 0) return false;
        } else if (rec.status !== filterStatus) {
          return false;
        }
      }

      // البحث السريع
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.student_name.toLowerCase().includes(q);
        const matchCode = (rec.student_code || '').toLowerCase().includes(q);
        return matchName || matchCode;
      }

      return true;
    });
  }, [combinedRecords, filterStudyType, filterStatus, searchQuery]);

  // 📊 الإحصائيات الإجمالية للمرحلة
  const totalExpectedAmount = useMemo(() => combinedRecords.reduce((sum, r) => sum + r.total_amount, 0), [combinedRecords]);
  const totalCollectedAmount = useMemo(() => combinedRecords.reduce((sum, r) => sum + r.paid_amount, 0), [combinedRecords]);
  const totalRemainingAmount = useMemo(() => combinedRecords.reduce((sum, r) => sum + r.remaining_amount, 0), [combinedRecords]);
  const totalDiscountsAmount = useMemo(() => combinedRecords.reduce((sum, r) => sum + (r.discount_amount || 0), 0), [combinedRecords]);
  const fullySettledCount = useMemo(() => combinedRecords.filter((r) => r.status === 'fully_settled').length, [combinedRecords]);
  const unsettledCount = useMemo(() => combinedRecords.filter((r) => r.status === 'unsettled').length, [combinedRecords]);
  const priorUnpaidCount = useMemo(() => combinedRecords.filter((r) => r.unpaid_stages_count > 0).length, [combinedRecords]);

  // 💳 فتح نافذة تسجيل دفعة مالية
  const handleOpenPayModal = (record: StudentTuitionRecord) => {
    setActiveRecordForPayment(record);
    const defaultInstallmentAmount = Math.round(record.total_amount / (record.installments_count || 3));
    const remainingToPay = record.remaining_amount > 0 ? Math.min(defaultInstallmentAmount, record.remaining_amount) : 0;
    setPayAmount(remainingToPay);
    setPayReceiptNo(`وصل-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPayDate(new Date().toISOString().split('T')[0] || '');
    setPayMethod('cash');
    setPayCashier(currentUser?.full_name || 'شعبة الحسابات المركزية');
    setPayNote('تسديد نقدي في شعبة الشؤون المالية والحسابات');
    setIsPayModalOpen(true);
  };

  // 💾 حفظ تسجيل الدفعة بوصل رسمي
  const handleSavePayment = () => {
    if (!activeRecordForPayment) return;
    const safePayAmount = Math.min(Number(payAmount), activeRecordForPayment.remaining_amount);
    if (safePayAmount <= 0) {
      setToastMsg('المبلغ المطلوب تسديده مستوفى بالكامل أو القيمة غير صالحة.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    const nextInstallmentNum = activeRecordForPayment.paid_installments.length + 1;
    const newInstallment: TuitionInstallmentItem = {
      installment_num: nextInstallmentNum,
      amount: safePayAmount,
      paid_at: payDate,
      receipt_no: payReceiptNo.trim() || `وصل-${Date.now().toString().slice(-4)}`,
      payment_method: payMethod,
      cashier_name: payCashier.trim(),
      note: payNote.trim(),
    };

    const updatedInstallments = [...activeRecordForPayment.paid_installments, newInstallment];
    // 🛡️ منع تجاوز المسدد لإجمالي القسط نهائياً
    const newPaidAmount = Math.min(activeRecordForPayment.total_amount, updatedInstallments.reduce((sum, i) => sum + i.amount, 0));
    const newRemaining = Math.max(0, activeRecordForPayment.total_amount - newPaidAmount);
    
    let newStatus: TuitionSettlementStatus = 'partially_settled';
    let newClearance: 'cleared' | 'uncleared' | 'under_review' = 'uncleared';

    if (newPaidAmount >= activeRecordForPayment.total_amount) {
      newStatus = 'fully_settled';
      newClearance = 'cleared';
    } else if (newPaidAmount === 0) {
      newStatus = 'unsettled';
      newClearance = 'uncleared';
    }

    const updatedRecord: StudentTuitionRecord = {
      ...activeRecordForPayment,
      paid_amount: newPaidAmount,
      remaining_amount: newRemaining,
      status: newStatus,
      financial_clearance: newClearance,
      clearance_date: newClearance === 'cleared' ? new Date().toISOString().split('T')[0] : undefined,
      paid_installments: updatedInstallments,
      updated_at: new Date().toISOString(),
    };

    onSaveTuitionRecord(updatedRecord);
    setIsPayModalOpen(false);

    // إرسال إشعار فوري للطالب بحسابه
    sendAppNotification({
      recipient_id: activeRecordForPayment.student_id,
      recipient_role: 'student',
      title: 'إشعار تسديد دفعة قسط دراسي',
      message: `تم توثيق استلام دفعة مالية بمبلغ (${safePayAmount.toLocaleString()} د.ع) بموجب الوصل رقم (${payReceiptNo}). المتبقي بذمتكم: (${newRemaining.toLocaleString()} د.ع).`,
      type: 'tuition_notice',
      link: '/student/dashboard',
    });

    setToastMsg(`تم بنجاح توثيق وصل القبض وتسجيل دفعة بقيمة (${safePayAmount.toLocaleString()} د.ع) للطالب: ${activeRecordForPayment.student_name}`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 📄 فتح كشف الحساب المالي التفصيلي
  const handleOpenStatementModal = (record: StudentTuitionRecord) => {
    setActiveRecordForStatement(record);
    setIsStatementModalOpen(true);
  };

  // ✏️ فتح نافذة تعديل التخفيض والقسط
  const handleOpenDiscountModal = (record: StudentTuitionRecord) => {
    setActiveRecordForDiscount(record);
    setEditBaseAmount(record.base_amount || record.total_amount);
    setEditDiscountType(record.discount_type || 'none');
    setEditCustomDiscountName(record.custom_discount_name || '');
    setEditDiscountPercent(record.discount_percentage || 0);
    setEditDiscountNotes(record.notes || '');
    setIsDiscountModalOpen(true);
  };

  // 💾 حفظ تعديل التخفيض والقسط
  const handleSaveDiscount = () => {
    if (!activeRecordForDiscount) return;

    let discountPercentage = Number(editDiscountPercent);
    if (editDiscountType === 'martyrs_family') discountPercentage = 50;
    if (editDiscountType === 'top_student') discountPercentage = 100;
    if (editDiscountType === 'siblings') discountPercentage = 10;
    if (editDiscountType === 'none') discountPercentage = 0;

    const discountAmount = Math.round((editBaseAmount * discountPercentage) / 100);
    const netTotal = Math.max(0, editBaseAmount - discountAmount);
    // 🛡️ تسقيف المسدد بحيث لا يتجاوز صافي القسط الجديد
    const currentPaid = Math.min(netTotal, activeRecordForDiscount.paid_amount);
    const newRemaining = Math.max(0, netTotal - currentPaid);

    let newStatus: TuitionSettlementStatus = 'partially_settled';
    let newClearance: 'cleared' | 'uncleared' | 'under_review' = 'uncleared';

    if (currentPaid >= netTotal && netTotal > 0) {
      newStatus = 'fully_settled';
      newClearance = 'cleared';
    } else if (netTotal === 0) {
      newStatus = 'exempt';
      newClearance = 'cleared';
    } else if (currentPaid === 0) {
      newStatus = 'unsettled';
      newClearance = 'uncleared';
    }

    const updatedRecord: StudentTuitionRecord = {
      ...activeRecordForDiscount,
      base_amount: editBaseAmount,
      discount_type: editDiscountType,
      custom_discount_name: editDiscountType === 'custom' ? editCustomDiscountName.trim() : undefined,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      total_amount: netTotal,
      paid_amount: currentPaid,
      remaining_amount: newRemaining,
      status: newStatus,
      financial_clearance: newClearance,
      clearance_date: newClearance === 'cleared' ? new Date().toISOString().split('T')[0] : undefined,
      notes: editDiscountNotes.trim() || 'تحديث الخطة والتخفيض المالي',
      updated_at: new Date().toISOString(),
    };

    onSaveTuitionRecord(updatedRecord);
    setIsDiscountModalOpen(false);
    setToastMsg(`تم تحديث القسط ونسبة التخفيض للطالب (${activeRecordForDiscount.student_name}) بنجاح`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 🛡️ تبديل براءة الذمة المالية
  const handleToggleClearance = (record: StudentTuitionRecord) => {
    const isCurrentlyCleared = record.financial_clearance === 'cleared';
    const newClearance = isCurrentlyCleared ? 'uncleared' : 'cleared';
    const updatedRecord: StudentTuitionRecord = {
      ...record,
      financial_clearance: newClearance,
      clearance_date: newClearance === 'cleared' ? new Date().toISOString().split('T')[0] : undefined,
      updated_at: new Date().toISOString(),
    };

    onSaveTuitionRecord(updatedRecord);
    if (activeRecordForStatement && activeRecordForStatement.id === record.id) {
      setActiveRecordForStatement(updatedRecord);
    }
    setToastMsg(newClearance === 'cleared' ? `تم إصدار براءة الذمة المالية للطالب (${record.student_name}) بنجاح` : `تم إلغاء براءة الذمة المالية للطالب (${record.student_name}).`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 📤 تصدير كشف الأقساط إلى Excel
  const handleExportExcel = async () => {
    if (filteredRecords.length === 0) {
      setToastMsg('لا توجد بيانات مطابقة لتصديرها.');
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }

    try {
      setIsExportingExcel(true);
      const stageLabel = selectedStage === 'all' ? 'كافة_المراحل' : `المرحلة_${getStageNameInArabic(selectedStage)}`;
      await exportTuitionRecordsExcel(filteredRecords, departmentName, stageLabel);
      setToastMsg(`تم تصدير كشف الأقساط (${filteredRecords.length} طالب) إلى Excel بنجاح`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('حدث خطأ أثناء تصدير ملف الإكسل.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // 📥 تنزيل نموذج Excel للأقساط والتخفيضات
  const handleDownloadTemplate = async () => {
    try {
      await downloadTuitionRecordsTemplate(departmentName, stageStudents);
      setToastMsg('تم تنزيل نموذج وقالب إكسل المعتمد للأقساط بنجاح');
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('حدث خطأ أثناء تنزيل نموذج الإكسل.');
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  // 📤 استيراد وتحديث الأقساط من ملف Excel
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      const rows = await parseExcelFile(file);

      if (!rows || rows.length === 0) {
        setToastMsg('الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.');
        setTimeout(() => setToastMsg(''), 4000);
        return;
      }

      let acceptedCount = 0;
      let updatedCount = 0;
      const rejectedList: { rowNumber: number; rawName: string; reason: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const rowNum = i + 2;

        const rawCode = String(
          row['student_code'] || 
          row['الرقم الجامعي للطالب *'] || 
          row['الرقم الجامعي'] || 
          row['رقم الطالب'] || 
          ''
        ).trim();

        const rawName = String(
          row['student_name'] || 
          row['اسم الطالب الرباعي *'] || 
          row['اسم الطالب'] || 
          row['الطالب'] || 
          ''
        ).trim();

        const rawStage = Number(
          row['stage_number'] || 
          row['المرحلة (1-4) *'] || 
          row['المرحلة'] || 
          1
        );

        const rawStudyType = String(
          row['study_type'] || 
          row['نوع الدراسة (صباحي / مسائي) *'] || 
          row['نوع الدراسة'] || 
          'صباحي'
        ).trim();

        const rawBaseAmount = Number(
          row['base_amount'] || 
          row['القسط السنوي الأساسي (د.ع) *'] || 
          row['القسط الأساسي'] || 
          row['القسط'] || 
          0
        );

        const rawDiscountType = String(
          row['discount_type'] || 
          row['نوع التخفيض المعتمد'] || 
          row['نوع التخفيض'] || 
          'none'
        ).trim();

        const rawDiscountPercent = Number(
          row['discount_percentage'] || 
          row['نسبة التخفيض (%)'] || 
          row['نسبة التخفيض'] || 
          0
        );

        const rawNotes = String(
          row['notes'] || 
          row['سند التخفيض أو رقم القرار'] || 
          row['ملاحظات'] || 
          ''
        ).trim();

        const rawUnpaidStages = Number(
          row['unpaid_stages_count'] || 
          row['متأخرات مراحل سابقة (عدد)'] || 
          row['متأخرات سابقة'] || 
          0
        );

        // 1. التحقق من وجود اسم أو رقم الطالب
        if (!rawName && !rawCode) {
          rejectedList.push({
            rowNumber: rowNum,
            rawName: 'صف فارغ',
            reason: 'لم يتم تزويد اسم الطالب أو رقمه الجامعي.',
          });
          continue;
        }

        // 2. مطابقة الطالب في القسم
        const matchedStudent = students.find((s) => {
          if (s.department_id !== departmentId) return false;
          if (rawCode && s.university_number && s.university_number.trim().toLowerCase() === rawCode.toLowerCase()) {
            return true;
          }
          return s.full_name.trim().toLowerCase() === rawName.toLowerCase();
        });

        if (!matchedStudent) {
          rejectedList.push({
            rowNumber: rowNum,
            rawName: rawName || rawCode,
            reason: 'لم يتم العثور على طالب مطابق في هذا القسم الأكاديمي.',
          });
          continue;
        }

        const studentStage = [1, 2, 3, 4].includes(rawStage) ? rawStage : (matchedStudent.stage_number || 1);
        const studyType = rawStudyType.includes('مساء') ? 'evening' : (matchedStudent.study_type || 'morning');

        // تحديد نوع التخفيض ونسبته
        let mappedDiscountType: TuitionDiscountType = 'none';
        let finalDiscountPercent = Math.max(0, Math.min(100, rawDiscountPercent));

        if (rawDiscountType.includes('شهداء') || rawDiscountType === 'martyrs_family') {
          mappedDiscountType = 'martyrs_family';
          finalDiscountPercent = 50;
        } else if (rawDiscountType.includes('أول') || rawDiscountType.includes('اول') || rawDiscountType === 'top_student') {
          mappedDiscountType = 'top_student';
          finalDiscountPercent = 100;
        } else if (rawDiscountType.includes('إخوة') || rawDiscountType.includes('اخوة') || rawDiscountType === 'siblings') {
          mappedDiscountType = 'siblings';
          finalDiscountPercent = 10;
        } else if (rawDiscountType.includes('رعاية') || rawDiscountType === 'social_care') {
          mappedDiscountType = 'social_care';
        } else if (finalDiscountPercent > 0) {
          mappedDiscountType = 'custom';
        }

        // القسط الأساسي
        const defaultBase = studentStage === 1 ? (studyType === 'evening' ? 2200000 : 1800000) : (studyType === 'evening' ? 2300000 : 1900000);
        const baseAmount = rawBaseAmount > 0 ? rawBaseAmount : defaultBase;
        const discountAmount = Math.round((baseAmount * finalDiscountPercent) / 100);
        const netTotal = Math.max(0, baseAmount - discountAmount);

        // البحث عن السجل الحالي للطالب
        const existingRecord = tuitionRecords.find((r) => r.student_id === matchedStudent.id && r.stage_number === studentStage);

        const currentPaid = existingRecord?.paid_amount || 0;
        const remaining = Math.max(0, netTotal - currentPaid);

        let status: TuitionSettlementStatus = 'unsettled';
        let clearance: 'cleared' | 'uncleared' | 'under_review' = 'uncleared';

        if (netTotal === 0) {
          status = 'exempt';
          clearance = 'cleared';
        } else if (currentPaid >= netTotal && netTotal > 0) {
          status = 'fully_settled';
          clearance = 'cleared';
        } else if (currentPaid > 0) {
          status = 'partially_settled';
        }

        const newRecord: StudentTuitionRecord = {
          id: existingRecord?.id || `tui-${matchedStudent.id}-${studentStage}`,
          student_id: matchedStudent.id,
          student_name: matchedStudent.full_name,
          student_code: matchedStudent.university_number || rawCode,
          department_id: departmentId,
          stage_number: studentStage,
          study_type: studyType,
          academic_year: existingRecord?.academic_year || academicYear,
          base_amount: baseAmount,
          discount_type: mappedDiscountType,
          discount_percentage: finalDiscountPercent,
          discount_amount: discountAmount,
          total_amount: netTotal,
          paid_amount: currentPaid,
          remaining_amount: remaining,
          installments_count: existingRecord?.installments_count || 3,
          paid_installments: existingRecord?.paid_installments || [],
          status,
          financial_clearance: clearance,
          clearance_date: clearance === 'cleared' ? new Date().toISOString().split('T')[0] : undefined,
          notes: rawNotes || existingRecord?.notes || 'مستورد ومحدث من ملف Excel المعتمد',
          has_prior_unpaid_stages: rawUnpaidStages > 0,
          unpaid_stages_count: rawUnpaidStages,
          created_at: existingRecord?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        onSaveTuitionRecord(newRecord);

        if (existingRecord) {
          updatedCount++;
        } else {
          acceptedCount++;
        }
      }

      setExcelImportReport({
        acceptedCount,
        updatedCount,
        rejectedList,
      });
      setIsExcelImportReportOpen(true);

      setToastMsg(`تم اكتمال استيراد الإكسل: (${acceptedCount + updatedCount}) سجل مالي تمت معالجته بنجاح`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch {
      setToastMsg('حدث خطأ أثناء قراءة أو معالجة ملف الإكسل.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setIsImportingExcel(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* 🔔 التنبيه العائم الفاخر (Light Mode أبيض ناصع) */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999999] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200" dir="rtl">
          <div className="p-4 sm:px-6 sm:py-4 bg-white/95 text-slate-950 rounded-2xl shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-400/10 flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl shadow-2xs shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="font-black text-sm sm:text-base text-slate-950">{toastMsg}</span>
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

      {/* 🎛️ 1. كارد التحكم والترويسة الموحدة للأقساط الدراسية */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-300 shadow-xs space-y-4">
        
        {/* السطر العلوي: الشارات والعنوان وأزرار العمليات */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
              <CreditCard className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#0F2942] text-white rounded-lg text-xs font-black">
                  قسم {departmentName}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold">
                  شعبة الشؤون المالية والحسابات
                </span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                  العام الدراسي {academicYear}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                إدارة ومتابعة تسديد الأقساط والوصولات المالية
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                توثيق وصولات القبض، متابعة براءة الذمة، إدارة التخفيضات، وتصدير الكشوفات المعتمدة
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات العلوية */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* ❓ زر تعليمات الإكسل */}
            <button
              type="button"
              onClick={() => setIsExcelInstructionsOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="عرض تعليمات وضوابط استيراد الأقساط من ملف Excel"
            >
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>تعليمات الإكسل</span>
            </button>

            {/* 📥 زر تنزيل نموذج Excel */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="تنزيل قالب إكسل معتمد معبأ بأسماء طلبة القسم"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>نموذج Excel</span>
            </button>

            {/* 📤 زر استيراد من Excel */}
            <label className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <FileUp className="w-4 h-4 text-emerald-200" />
              <span>{isImportingExcel ? 'جاري الاستيراد...' : 'استيراد من Excel'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                disabled={isImportingExcel}
                className="hidden"
              />
            </label>

            {/* 📊 زر تصدير Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel || filteredRecords.length === 0}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 border border-slate-300 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="تصدير كشف الأقساط إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{isExportingExcel ? 'جاري التصدير...' : 'تصدير كشف (Excel)'}</span>
            </button>

            {/* 📢 زر إرسال تبليغ أقساط */}
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-4 py-2.5 bg-[#0F2942] hover:bg-[#16385c] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 shadow-xs whitespace-nowrap"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>إرسال تبليغ</span>
            </button>
          </div>
        </div>

        {/* السطر الأوسط: أشرطة التصفية السريعة للمراحل والفترات */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-200 items-center">
          
          {/* محدد المرحلة */}
          <div className="lg:col-span-6 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1 overflow-x-auto w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedStage('all');
                setSelectedStudentTuitionIds([]);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                selectedStage === 'all' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white'
              }`}
            >
              <span>كافة المراحل</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                selectedStage === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {students.filter((s) => s.department_id === departmentId).length}
              </span>
            </button>

            {[1, 2, 3, 4].map((stg) => {
              const count = students.filter((s) => s.department_id === departmentId && (s.stage_number || 1) === stg).length;
              const isSel = selectedStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => {
                    setSelectedStage(stg);
                    setSelectedStudentTuitionIds([]);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    isSel ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>المرحلة {getStageNameInArabic(stg)}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* محدد الفترة الدراسية (صباحي / مسائي) */}
          <div className="lg:col-span-3 flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-300 gap-1">
            <button
              type="button"
              onClick={() => setFilterStudyType('all')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
                filterStudyType === 'all' ? 'bg-[#0F2942] text-white font-black shadow-2xs' : 'text-slate-700 hover:bg-white/50'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setFilterStudyType('morning')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                filterStudyType === 'morning' ? 'bg-emerald-700 text-white font-black shadow-2xs' : 'text-slate-700 hover:bg-white/50'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>صباحي</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStudyType('evening')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                filterStudyType === 'evening' ? 'bg-blue-700 text-white font-black shadow-2xs' : 'text-slate-700 hover:bg-white/50'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>مسائي</span>
            </button>
          </div>

          {/* حقل البحث السريع */}
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطالب..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
            />
          </div>

        </div>

        {/* فلاتر الموقف المالي السريعة */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">الموقف المالي:</span>
          {[
            { id: 'all', label: 'كافة الحالات', count: combinedRecords.length },
            { id: 'fully_settled', label: 'مسدد بالكامل', count: fullySettledCount },
            { id: 'partially_settled', label: 'مسدد جزئياً', count: combinedRecords.filter((r) => r.status === 'partially_settled').length },
            { id: 'unsettled', label: 'غير مسدد', count: unsettledCount },
            { id: 'prior_unpaid', label: 'متأخرات سابقة', count: priorUnpaidCount },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterStatus(st.id as TuitionSettlementStatus | 'all' | 'prior_unpaid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterStatus === st.id
                  ? 'bg-[#0F2942] text-white shadow-2xs'
                  : 'bg-white text-slate-950 border-2 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>{st.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                filterStatus === st.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-950'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* 📊 2. بطاقات الإحصائيات المالية المعتمدة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-1">
          <span className="text-xs sm:text-sm font-black text-slate-950 block">إجمالي القسط المستحق</span>
          <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono block">
            {totalExpectedAmount.toLocaleString()} <span className="text-xs font-sans font-black text-slate-950">د.ع</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-950 block">{combinedRecords.length} طالب مسجل</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-1">
          <span className="text-xs sm:text-sm font-black text-emerald-950 block">إجمالي المبالغ المسددة</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono block">
            {totalCollectedAmount.toLocaleString()} <span className="text-xs font-sans font-black text-emerald-950">د.ع</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-950 block">{fullySettledCount} طالب مسدد بالكامل</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-1">
          <span className="text-xs sm:text-sm font-black text-rose-950 block">المبالغ المتبقية في الذمة</span>
          <span className="text-xl sm:text-2xl font-black text-rose-800 font-mono block">
            {totalRemainingAmount.toLocaleString()} <span className="text-xs font-sans font-black text-rose-950">د.ع</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-rose-950 block">{unsettledCount} طالب غير مسدد</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-1">
          <span className="text-xs sm:text-sm font-black text-blue-950 block">إجمالي التخفيضات الممنوحة</span>
          <span className="text-xl sm:text-2xl font-black text-blue-900 font-mono block">
            {totalDiscountsAmount.toLocaleString()} <span className="text-xs font-sans font-black text-blue-950">د.ع</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-blue-950 block">
            {combinedRecords.filter((r) => (r.discount_amount || 0) > 0).length} طالب مستفيد من التخفيض
          </span>
        </div>
      </div>

      {/* 🔘 شريط الإجراءات الجماعية العائم للطلبة المحددين */}
      {selectedStudentTuitionIds.length > 0 && (
        <div className="p-3.5 bg-blue-50 border-2 border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            <span className="font-black text-blue-950 text-xs sm:text-sm">
              تم تحديد <strong className="font-mono">{selectedStudentTuitionIds.length}</strong> طلاب
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-4 py-2 bg-[#0F2942] hover:bg-[#16385c] text-white rounded-xl font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>إرسال تبليغ أقساط للمحددين ({selectedStudentTuitionIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStudentTuitionIds([])}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 📋 3. جدول سجلات تسديد الأقساط والوصولات للطلبة */}
      <div className="bg-white rounded-3xl border border-slate-300 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm font-bold text-right border-collapse">
            <thead>
              <tr className="bg-[#0F2942] text-white p-3 text-xs sm:text-sm font-black text-center">
                {/* 🔘 مربع تحديد الكل */}
                <th className="p-3.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedStudentTuitionIds.length === filteredRecords.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentTuitionIds(filteredRecords.map((r) => r.id));
                      } else {
                        setSelectedStudentTuitionIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5 text-right pr-4">اسم الطالب</th>
                <th className="p-3.5 text-center">المرحلة الدراسية</th>
                <th className="p-3.5 text-center">الدراسة</th>
                <th className="p-3.5 text-center">القسط والتخفيض</th>
                <th className="p-3.5 text-center">المسدد والمتبقي</th>
                <th className="p-3.5 text-center">دفعات التسديد</th>
                <th className="p-3.5 text-center">موقف الذمة</th>
                <th className="p-3.5 text-center">الإجراءات والوصولات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(() => {
                // 🔢 نحسب رقم الصفحة الآمن لسجلات الأقساط حتى نتجنب الخروج خارج الحدود
                const safeTuitionPage = Math.max(1, Math.min(tuitionPage, Math.max(1, Math.ceil(filteredRecords.length / tuitionPageSize))));
                // ✂️ نقطع سجلات الأقساط لعرض الصفحة الحالية فقط
                const paginatedRecords = filteredRecords.slice((safeTuitionPage - 1) * tuitionPageSize, safeTuitionPage * tuitionPageSize);

                // 🔄 نعمل خريطة لعرض سجلات الأقساط في الصفحة الحالية
                return paginatedRecords.map((record, idx) => {
                  // 🔢 التسلسل التراكمي الحقيقي لسجل القسط
                  const actualIndex = (safeTuitionPage - 1) * tuitionPageSize + idx;
                  const isFully = record.status === 'fully_settled';
                  const isPart = record.status === 'partially_settled';
                  const isUnset = record.status === 'unsettled';
                  const isSelected = selectedStudentTuitionIds.includes(record.id);
                  const percentPaid = record.total_amount > 0 ? Math.min(100, Math.round((record.paid_amount / record.total_amount) * 100)) : 0;

                  return (
                    <tr key={record.id} className={`transition ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                      
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedStudentTuitionIds(selectedStudentTuitionIds.filter((id) => id !== record.id));
                            } else {
                              setSelectedStudentTuitionIds([...selectedStudentTuitionIds, record.id]);
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Sequence */}
                      <td className="p-3.5 text-center font-mono font-black text-slate-950">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-950 text-xs sm:text-sm font-mono font-black">
                          {actualIndex + 1}
                        </span>
                      </td>
                    
                    {/* Student Name */}
                    <td className="p-3.5 pr-4">
                      <strong className="text-slate-950 text-xs sm:text-base font-black block leading-tight">{record.student_name}</strong>
                      {record.unpaid_stages_count > 0 && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 rounded-md font-black text-xs inline-flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                          <span>بذمته {record.unpaid_stages_count} مراحل سابقة</span>
                        </span>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="p-3.5 text-center">
                      <span className="px-3 py-1.5 bg-[#0F2942] text-white rounded-xl text-xs sm:text-sm font-black inline-block shadow-2xs whitespace-nowrap">
                        المرحلة {getStageNameInArabic(record.stage_number)}
                      </span>
                    </td>

                    {/* Study Period */}
                    <td className="p-3.5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black border-2 inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
                        (record.study_type || 'morning') === 'evening'
                          ? 'bg-blue-100 text-blue-950 border-blue-400'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                      }`}>
                        {(record.study_type || 'morning') === 'evening' ? (
                          <Moon className="w-4 h-4 text-blue-800" />
                        ) : (
                          <Sun className="w-4 h-4 text-emerald-800" />
                        )}
                        <span>{(record.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'}</span>
                      </span>
                    </td>

                    {/* Tuition & Discounts */}
                    <td className="p-3.5 text-center space-y-1">
                      <span className="font-mono font-black text-slate-950 text-xs sm:text-base block">
                        {record.total_amount.toLocaleString()} د.ع
                      </span>
                      {(record.discount_amount || 0) > 0 ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-950 border border-blue-200 rounded-lg text-xs font-black inline-block">
                          خصم {record.discount_percentage}% {record.custom_discount_name ? `(${record.custom_discount_name})` : `(${record.discount_amount?.toLocaleString()} د.ع)`}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-950 block">بدون تخفيض</span>
                      )}
                    </td>

                    {/* Paid & Remaining */}
                    <td className="p-3.5 text-center space-y-1 min-w-[140px]">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-black">
                        <span className="text-emerald-900">{record.paid_amount.toLocaleString()}</span>
                        <span className="text-rose-900">{record.remaining_amount.toLocaleString()}</span>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${percentPaid === 100 ? 'bg-emerald-600' : 'bg-[#0F2942]'}`}
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-black text-slate-950 block">{percentPaid}% مسدد</span>
                    </td>

                    {/* Installments Count */}
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-xl text-slate-950 font-mono font-black text-xs sm:text-sm border border-slate-300 inline-block shadow-2xs">
                        {record.paid_installments.length} من {record.installments_count || 3} وصولات
                      </span>
                    </td>

                    {/* Settlement Status */}
                    <td className="p-3.5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black inline-block shadow-2xs ${
                        isFully ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : isPart ? 'bg-blue-100 text-blue-950 border border-blue-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                      }`}>
                        {isFully ? 'مسدد بالكامل' : isPart ? 'مسدد جزئياً' : 'غير مسدد'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        {/* زر تسديد دفعة */}
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(record)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap active:scale-95 border border-emerald-800"
                          title="تسجيل دفعة تسديد جديدة بوصل قبض"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تسديد</span>
                        </button>

                        {/* زر كشف حساب مالي وسجل الوصولات */}
                        <button
                          type="button"
                          onClick={() => handleOpenStatementModal(record)}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-300 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap active:scale-95"
                          title="عرض كشف الحساب المالي وسجل الوصولات والطباعة"
                        >
                          <Receipt className="w-4 h-4 text-blue-700" />
                          <span>الوصولات</span>
                        </button>

                        {/* زر تعديل التخفيض */}
                        <button
                          type="button"
                          onClick={() => handleOpenDiscountModal(record)}
                          className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap active:scale-95"
                          title="تعديل القسط الأساسي ونسب التخفيض المعتمدة"
                        >
                          <Percent className="w-3.5 h-3.5 text-slate-700" />
                          <span>تخفيض</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              });
            })()}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-950 font-black text-sm sm:text-base">
                  لا توجد سجلات أقساط مطابقة للفلاتر أو البحث المحدد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📑 شريط التنقل بين صفحات سجلات الأقساط المالية */}
      <AdminPagination
        currentPage={tuitionPage}
        totalItems={filteredRecords.length}
        pageSize={tuitionPageSize}
        onPageChange={setTuitionPage}
        onPageSizeChange={setTuitionPageSize}
        itemLabel="سجل قسط"
        className="mt-4"
      />
    </div>

      {/* ========================================================================= */}
      {/* 💳 4. نافذة تسجيل دفعة قسط دراسي بوصل رسمي (Payment Modal) */}
      {/* ========================================================================= */}
      {isPayModalOpen && activeRecordForPayment && (() => {
        const selectedPayOption = PAYMENT_METHOD_OPTIONS.find((opt) => opt.id === payMethod) || PAYMENT_METHOD_OPTIONS[0];
        return (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
            
            {/* 📌 1. الترويسة الثابتة (Fixed Header) */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-300 shadow-2xs">
                  <Receipt className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تسجيل دفعة قسط دراسي بوصل رسمي
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                    الطالب: <strong className="text-slate-950">{activeRecordForPayment.student_name}</strong> | المرحلة {getStageNameInArabic(activeRecordForPayment.stage_number)} ({(activeRecordForPayment.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-2 text-slate-900 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 📜 2. المحتوى الداخلي القابل للتمرير (Scrollable Body) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

              {/* الموقف المالي الحالي للطالب */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs sm:text-sm font-black text-slate-950 block mb-0.5">صافي القسط</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-950">{activeRecordForPayment.total_amount.toLocaleString()} د.ع</span>
                </div>
                <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-xs sm:text-sm font-black text-emerald-950 block mb-0.5">المسدد سابقاً</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-950">{activeRecordForPayment.paid_amount.toLocaleString()} د.ع</span>
                </div>
                <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-200">
                  <span className="text-xs sm:text-sm font-black text-rose-950 block mb-0.5">المتبقي في الذمة</span>
                  <span className="text-sm sm:text-base font-black font-mono text-rose-950">{activeRecordForPayment.remaining_amount.toLocaleString()} د.ع</span>
                </div>
              </div>

              {/* حقول الدفعة */}
              <div className="space-y-3.5">
                
                {/* مبلغ الدفعة وأزرار الاقتراح */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-black text-slate-950">المبلغ المطلوب تسديده (د.ع) *:</label>
                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                      {payAmount.toLocaleString('en-US')} د.ع
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={payAmount > 0 ? payAmount.toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/[^\d]/g, '');
                        const num = cleanDigits === '' ? 0 : parseInt(cleanDigits, 10);
                        setPayAmount(isNaN(num) ? 0 : Math.min(num, activeRecordForPayment.remaining_amount));
                      }}
                      placeholder="أدخل المبلغ المسدد..."
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-black font-mono text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs text-left"
                      dir="ltr"
                    />
                  </div>
                  
                  {/* أزرار تسديد سريعة */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmount(activeRecordForPayment.remaining_amount);
                        setPayMethod('cash');
                        setPayNote('تسديد كامل المتبقي نقداً في شعبة الشؤون المالية');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      تسديد كامل المتبقي ({activeRecordForPayment.remaining_amount.toLocaleString()} د.ع)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmount(activeRecordForPayment.remaining_amount);
                        setPayMethod('exemption');
                        setPayNote('إعفاء مالي رسمي معتمد بقرار مجلس الكلية / رئاسة الجامعة');
                      }}
                      className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border border-emerald-400 flex items-center gap-1.5 shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>إعفاء مالي كامل ({activeRecordForPayment.remaining_amount.toLocaleString()} د.ع)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmount(Math.min(activeRecordForPayment.remaining_amount, Math.round(activeRecordForPayment.total_amount / 2)));
                        setPayMethod('cash');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      نصف القسط
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayAmount(Math.min(activeRecordForPayment.remaining_amount, Math.round(activeRecordForPayment.total_amount / 4)));
                        setPayMethod('cash');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      ربع القسط
                    </button>
                  </div>
                </div>

                {/* رقم الوصل وتاريخ القبض */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">رقم وصل القبض المالي *:</label>
                    <input
                      type="text"
                      value={payReceiptNo}
                      onChange={(e) => setPayReceiptNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black font-mono text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">تاريخ التسديد *:</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black font-mono text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                {/* طريقة الدفع واسم المحاسب */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">طريقة التسديد:</label>
                    {/* 🔽 القائمة المنسدلة الاحترافية لطريقة التسديد بمستوى الزر مباشرة Z-999999 */}
                    <div ref={payMethodDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPayMethodDropdownOpen(!isPayMethodDropdownOpen)}
                        className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {selectedPayOption.id === 'cash' ? (
                            <Banknote className="w-5 h-5 text-emerald-700 shrink-0" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-blue-700 shrink-0" />
                          )}
                          <span className="text-slate-950 font-black">{selectedPayOption.label}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${selectedPayOption.badgeColor}`}>
                            {selectedPayOption.badge}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform duration-200 ${isPayMethodDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                      </button>

                      {/* القائمة المنسدلة المخصصة تظهر مباشرة بمستوى الزر وتحته */}
                      {isPayMethodDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1">
                          {PAYMENT_METHOD_OPTIONS.map((opt) => {
                            const isSelected = payMethod === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setPayMethod(opt.id);
                                  if (opt.id === 'cash') {
                                    setPayNote('تسديد نقدي في شعبة الشؤون المالية والحسابات');
                                  } else if (opt.id === 'electronic') {
                                    setPayNote('تسديد إلكتروني عبر بوابة الدفع الإلكتروني / POS');
                                  }
                                  setIsPayMethodDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-[#0F2942] text-white shadow-2xs'
                                    : 'hover:bg-slate-100 text-slate-950'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {opt.id === 'cash' ? (
                                    <Banknote className={`w-5 h-5 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`} />
                                  ) : (
                                    <CreditCard className={`w-5 h-5 shrink-0 ${isSelected ? 'text-sky-300' : 'text-blue-700'}`} />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <strong className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                        {opt.label}
                                      </strong>
                                      <span className={`px-1.5 py-0.2 rounded-md text-xs font-black border ${
                                        isSelected ? 'bg-white/20 text-white border-white/30' : opt.badgeColor
                                      }`}>
                                        {opt.badge}
                                      </span>
                                    </div>
                                    <span className={`text-xs font-bold block ${isSelected ? 'text-slate-200' : 'text-slate-950'}`}>
                                      {opt.subLabel}
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
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">اسم المحاسب / المستلم:</label>
                    <input
                      type="text"
                      value={payCashier}
                      onChange={(e) => setPayCashier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                    />
                  </div>
                </div>

                {/* ملاحظات الوصل */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">ملاحظات الوصل:</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="ملاحظات التسديد..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                  />
                </div>

              </div>

            </div>

            {/* 📌 3. الفوتر الثابت (Fixed Footer) */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-5 border-t border-slate-200 bg-slate-50 z-20">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer border-2 border-slate-300"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSavePayment}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                تأكيد وحفظ وصل القبض
              </button>
            </div>

          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 📄 5. نافذة كشف الحساب المالي وسجل الوصولات للطالب (Statement Modal) */}
      {/* ========================================================================= */}
      {isStatementModalOpen && activeRecordForStatement && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
            
            {/* 📌 1. الترويسة الثابتة (Fixed Header) */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0F2942] text-white rounded-2xl shadow-2xs">
                  <Receipt className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    كشف الحساب المالي وسجل الوصولات
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                    جامعة الإمام جعفر الصادق (ع) - فرع ميسان | شعبة الشؤون المالية والحسابات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="p-2 text-slate-900 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 📜 2. المحتوى القابل للتمرير (Scrollable Body) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* بطاقة الطالب المالية */}
              <div className="p-4 sm:p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                <div>
                  <strong className="text-lg sm:text-xl font-black text-slate-950 block">{activeRecordForStatement.student_name}</strong>
                  <span className="text-sm font-black text-slate-950 block mt-1">
                    المرحلة {getStageNameInArabic(activeRecordForStatement.stage_number)} ({(activeRecordForStatement.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-3 border-t-2 border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-xs sm:text-sm font-black text-slate-950 block mb-0.5">القسط الأساسي</span>
                    <span className="text-sm sm:text-base font-black font-mono text-slate-950">{(activeRecordForStatement.base_amount || activeRecordForStatement.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-xs sm:text-sm font-black text-blue-950 block mb-0.5">التخفيض المعتمد</span>
                    <span className="text-sm sm:text-base font-black font-mono text-blue-950">{(activeRecordForStatement.discount_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <span className="text-xs sm:text-sm font-black text-emerald-950 block mb-0.5">إجمالي المسدد</span>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-950">{activeRecordForStatement.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-rose-50/70 rounded-xl border border-rose-200">
                    <span className="text-xs sm:text-sm font-black text-rose-950 block mb-0.5">المتبقي في الذمة</span>
                    <span className="text-sm sm:text-base font-black font-mono text-rose-950">{activeRecordForStatement.remaining_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* جدول وصولات القبض المسددة */}
              <div className="space-y-2.5">
                <h4 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-800 shrink-0" />
                  <span>سجل وصولات القبض المالي الموثقة ({activeRecordForStatement.paid_installments.length} وصولات):</span>
                </h4>

                {activeRecordForStatement.paid_installments.length === 0 ? (
                  <div className="p-6 text-center text-sm font-black text-slate-950 bg-slate-50 border-2 border-slate-200 rounded-xl">
                    لم يتم تسديد أي دفعة مالية لهذا الطالب بعد.
                  </div>
                ) : (
                  <div className="divide-y-2 divide-slate-200 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {activeRecordForStatement.paid_installments.map((inst, idx) => (
                      <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between text-xs sm:text-sm font-bold hover:bg-slate-50 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-black text-slate-950 text-sm sm:text-base">وصل #{inst.receipt_no}</span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                              inst.payment_method === 'exemption'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : 'bg-slate-200 text-slate-950 border border-slate-300'
                            }`}>
                              {inst.payment_method === 'electronic' ? 'دفع إلكتروني' : inst.payment_method === 'bank_cheque' ? 'صك مصدق' : inst.payment_method === 'exemption' ? 'إعفاء مالي' : 'نقدي'}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-slate-950 block">
                            التاريخ: {inst.paid_at} | المستلم: {inst.cashier_name || 'شعبة الحسابات'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left font-mono font-black text-emerald-950 text-base sm:text-lg">
                            {inst.amount.toLocaleString()} د.ع
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 📌 3. الفوتر الثابت (Fixed Footer) */}
            <div className="flex-shrink-0 flex items-center justify-end p-4 sm:p-5 border-t border-slate-200 bg-slate-50 z-20">
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                إغلاق الكشف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎁 6. نافذة تعديل القسط والتخفيض المالي (Discount Modal) */}
      {/* ========================================================================= */}
      {isDiscountModalOpen && activeRecordForDiscount && (() => {
        const selectedDiscountOption = DISCOUNT_TYPE_OPTIONS.find((opt) => opt.id === editDiscountType) || DISCOUNT_TYPE_OPTIONS[0];
        return (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right relative animate-in zoom-in-95 duration-200">
            
            {/* 📌 1. الترويسة الثابتة (Fixed Header) */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 shadow-2xs">
                  <Percent className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950">
                    تعديل القسط السنوي وإدارة التخفيضات
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
                    الطالب: <strong className="text-slate-950">{activeRecordForDiscount.student_name}</strong> | المرحلة {getStageNameInArabic(activeRecordForDiscount.stage_number)} ({(activeRecordForDiscount.study_type || 'morning') === 'evening' ? 'مسائي' : 'صباحي'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-2 text-slate-900 hover:text-slate-950 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 📜 2. المحتوى الداخلي القابل للتمرير (Scrollable Body) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              
              {/* القسط الأساسي */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-black text-slate-950">القسط الأساسي المعتمد (د.ع) *:</label>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                    {editBaseAmount.toLocaleString('en-US')} د.ع
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editBaseAmount > 0 ? editBaseAmount.toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/[^\d]/g, '');
                      const num = cleanDigits === '' ? 0 : parseInt(cleanDigits, 10);
                      setEditBaseAmount(isNaN(num) ? 0 : num);
                    }}
                    placeholder="أدخل مبلغ القسط..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-black font-mono text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* 🔽 القائمة المنسدلة الاحترافية لنوع التخفيض Z-999999 */}
              <div ref={discountTypeDropdownRef} className="relative">
                <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">نوع التخفيض أو المنحة المالية:</label>
                <button
                  type="button"
                  onClick={() => setIsDiscountTypeDropdownOpen(!isDiscountTypeDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-300 focus:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black text-slate-950 flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      switch (editDiscountType) {
                        case 'martyrs_family':
                          return <Award className="w-5 h-5 text-blue-700 shrink-0" />;
                        case 'top_student':
                          return <GraduationCap className="w-5 h-5 text-emerald-700 shrink-0" />;
                        case 'siblings':
                          return <Users className="w-5 h-5 text-sky-700 shrink-0" />;
                        case 'destitute_aid':
                          return <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />;
                        case 'custom':
                          return <FileText className="w-5 h-5 text-blue-700 shrink-0" />;
                        case 'none':
                        default:
                          return <Percent className="w-5 h-5 text-slate-700 shrink-0" />;
                      }
                    })()}
                    <span className="text-slate-950 font-black">{selectedDiscountOption.label}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${selectedDiscountOption.badgeColor}`}>
                      {selectedDiscountOption.badge}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform duration-200 ${isDiscountTypeDropdownOpen ? 'rotate-180 text-blue-700' : ''}`} />
                </button>

                {/* القائمة المنسدلة المخصصة */}
                {isDiscountTypeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl z-[999999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 max-h-52 overflow-y-auto">
                    {DISCOUNT_TYPE_OPTIONS.map((opt) => {
                      const isSelected = editDiscountType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setEditDiscountType(opt.id);
                            if (opt.id === 'martyrs_family') setEditDiscountPercent(50);
                            else if (opt.id === 'top_student') setEditDiscountPercent(100);
                            else if (opt.id === 'siblings') setEditDiscountPercent(10);
                            else if (opt.id === 'none') setEditDiscountPercent(0);
                            setIsDiscountTypeDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#0F2942] text-white shadow-2xs'
                              : 'hover:bg-slate-100 text-slate-950'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              switch (opt.id) {
                                case 'martyrs_family':
                                  return <Award className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-700'}`} />;
                                case 'top_student':
                                  return <GraduationCap className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />;
                                case 'siblings':
                                  return <Users className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-sky-700'}`} />;
                                case 'destitute_aid':
                                  return <ShieldCheck className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />;
                                case 'custom':
                                  return <FileText className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-400'}`} />;
                                case 'none':
                                default:
                                  return <Percent className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-700'}`} />;
                              }
                            })()}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                                  {opt.label}
                                </strong>
                                <span className={`px-1.5 py-0.2 rounded-md text-xs font-black border ${
                                  isSelected ? 'bg-white/20 text-white border-white/30' : opt.badgeColor
                                }`}>
                                  {opt.badge}
                                </span>
                              </div>
                              <span className={`text-xs font-bold block ${isSelected ? 'text-slate-200' : 'text-slate-950'}`}>
                                {opt.desc}
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

              {/* 🏷️ حقل إدخال اسم نوع التخفيض المخصص */}
              {editDiscountType === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">
                    اسم أو مسمى نوع التخفيض المخصص *:
                  </label>
                  <input
                    type="text"
                    value={editCustomDiscountName}
                    onChange={(e) => setEditCustomDiscountName(e.target.value)}
                    placeholder="مثال: تخفيض حفظة القرآن الكريم، تخفيض الأوائل، قرار خاص..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-blue-300 focus:border-[#0F2942] rounded-xl text-xs sm:text-sm font-black text-slate-950 focus:outline-none shadow-2xs"
                  />
                </div>
              )}

              {/* نسبة الخصم إن كانت مخصصة */}
              {(editDiscountType === 'custom' || editDiscountType === 'destitute_aid') && (
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">نسبة التخفيض المئوية (%):</label>
                  <input
                    type="number"
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-black font-mono text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                  />
                </div>
              )}

              {/* ملخص الحسبة المالية المباشرة */}
              <div className="p-3.5 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-1.5 text-xs font-bold text-blue-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-blue-950">قيمة الخصم المحسوبة:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-blue-950">{Math.round((editBaseAmount * editDiscountPercent) / 100).toLocaleString()} د.ع</span>
                </div>
                <div className="flex items-center justify-between text-sm sm:text-base font-black pt-1.5 border-t-2 border-blue-200 text-slate-950">
                  <span>صافي القسط المطلوب من الطالب:</span>
                  <span className="font-mono text-emerald-900 text-base sm:text-lg">{Math.max(0, editBaseAmount - Math.round((editBaseAmount * editDiscountPercent) / 100)).toLocaleString()} د.ع</span>
                </div>
              </div>

              {/* ملاحظات وسند التخفيض */}
              <div>
                <label className="block text-xs sm:text-sm font-black text-slate-950 mb-1">سند التخفيض أو رقم القرار:</label>
                <input
                  type="text"
                  value={editDiscountNotes}
                  onChange={(e) => setEditDiscountNotes(e.target.value)}
                  placeholder="قرار مجلس الكلية رقم..."
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-950 focus:outline-none focus:border-slate-900 shadow-2xs"
                />
              </div>

            </div>

            {/* 📌 3. الفوتر الثابت (Fixed Footer) */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-5 border-t border-slate-200 bg-slate-50 z-20">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition cursor-pointer border-2 border-slate-300"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveDiscount}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                حفظ التعديل المالي
              </button>
            </div>

          </div>
        </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 📢 7. نافذة إرسال التبليغات المالية الذكية (TuitionNoticeModal) */}
      {/* ========================================================================= */}
      {isNoticeModalOpen && (
        <TuitionNoticeModal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          departmentId={departmentId}
          departmentName={departmentName}
          students={students}
          tuitionRecords={combinedRecords}
          currentStage={selectedStage}
          selectedStudentTuitionIds={selectedStudentTuitionIds}
          onSuccess={(sentCount) => {
            setToastMsg(`تم بنجاح إرسال تبليغ الأقساط إلى (${sentCount}) طالب`);
            setTimeout(() => setToastMsg(''), 4000);
            setSelectedStudentTuitionIds([]);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ❓ 8. نافذة تعليمات وضوابط استيراد ملف الإكسل (Excel Instructions Modal) */}
      {/* ========================================================================= */}
      {isExcelInstructionsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-300 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950">
                    تعليمات وضوابط إعداد واستيراد كشوفات الأقساط من Excel
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    دليل الحقول، أنواع التخفيضات، وصيغ المبالغ المعتمدة في النظام
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelInstructionsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. الحقول الإلزامية في ورقة (سجل_الأقساط_والتخفيضات):</span>
                </h4>
                <ul className="list-disc list-inside pr-2 space-y-1 text-slate-700 text-xs">
                  <li><strong>الرقم الجامعي للطالب:</strong> يطابق الرقم الجامعي المسجل في النظام.</li>
                  <li><strong>اسم الطالب الرباعي:</strong> الاسم الكامل لمطابقة الطالب.</li>
                  <li><strong>المرحلة (1-4):</strong> رقم المرحلة الدراسية المقيد بها الطالب.</li>
                  <li><strong>نوع الدراسة:</strong> (صباحي / مسائي).</li>
                  <li><strong>القسط السنوي الأساسي:</strong> المبلغ الكلي بالدينار العراقي قبل التخفيض (مثلاً: 1800000 أو 2200000).</li>
                </ul>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-blue-950">
                <h4 className="font-black flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-blue-700" />
                  <span>2. أنواع ونسب التخفيض المعتمدة:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-blue-200">
                    <strong>ذوو الشهداء:</strong> خصم تلقائي 50%
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-200">
                    <strong>الأول على المرحلة:</strong> إعفاء كامل 100%
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-200">
                    <strong>الإخوة الدارسون:</strong> خصم 10%
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-200">
                    <strong>تخفيض مخصص:</strong> يُكتب الرقم في نسبة التخفيض
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 text-emerald-950 text-xs">
                <h4 className="font-black flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>3. الحساب التلقائي وبراءة الذمة:</span>
                </h4>
                <p>
                  يقوم النظام بحساب صافي القسط المطلوب والمتبقي بذمة الطالب تلقائياً، مع الاحتفاظ بكافة دفعات ووصولات القبض المسجلة سابقاً دون أن تتأثر أو تُحذف.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsExcelInstructionsOpen(false);
                  handleDownloadTemplate();
                }}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>تحميل نموذج Excel الآن</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExcelInstructionsOpen(false)}
                className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                فهمت ذلك
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 9. نافذة تقرير نتائج استيراد الإكسل (Excel Import Report Modal) */}
      {/* ========================================================================= */}
      {isExcelImportReportOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-300 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-950">
                    تقرير نتائج معالجة واستيراد ملف الإكسل
                  </h3>
                  <p className="text-xs font-bold text-slate-600">
                    ملخص السجلات المالية المقبولة، المحدثة، والمرفوضة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelImportReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* بطاقات الإحصائيات لعملية الاستيراد */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-0.5">
                <span className="text-xs font-bold text-emerald-900 block">سجلات جديدة</span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 block">
                  {excelImportReport.acceptedCount}
                </span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-0.5">
                <span className="text-xs font-bold text-blue-900 block">سجلات تم تحديثها</span>
                <span className="text-lg sm:text-xl font-black font-mono text-blue-700 block">
                  {excelImportReport.updatedCount}
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-0.5">
                <span className="text-xs font-bold text-rose-900 block">صفوف غير مقبولة</span>
                <span className="text-lg sm:text-xl font-black font-mono text-rose-700 block">
                  {excelImportReport.rejectedList.length}
                </span>
              </div>
            </div>

            {/* قائمة الصفوف المرفوضة في حال وجودها */}
            {excelImportReport.rejectedList.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>الصفوف التي تعذرت معالجتها وأسبابها ({excelImportReport.rejectedList.length}):</span>
                </h4>
                <div className="divide-y divide-rose-200 border border-rose-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-rose-50/50">
                  {excelImportReport.rejectedList.map((rej, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-bold gap-2">
                      <div>
                        <span className="font-mono font-black text-rose-950">الصف #{rej.rowNumber}:</span>{' '}
                        <strong className="text-slate-900">{rej.rawName}</strong>
                      </div>
                      <span className="text-rose-800 text-[11px] font-bold">{rej.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs sm:text-sm font-bold text-emerald-950 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تم قبول ومعالجة وتحديث كافة صفوف ملف الإكسل بنجاح تام بنسبة 100%! 🚀</span>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsExcelImportReportOpen(false)}
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#16385c] text-white font-black rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
