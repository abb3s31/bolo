'use client'; // ⚡ ينفذ بالعميل

// 🛡️ نافذة مراجعة واعتماد جداول الامتحانات النهائية للمسؤول العام (SuperAdminExamApprovalModal)
import { useState } from 'react'; // 🔗 رياكت
import { FinalExamSchedule, FinalExamSlot, UserProfile } from '@/types'; // 🔗 الأنواع
import { exportFinalExamSchedulePDF } from '@/lib/pdf-export'; // 📄 مصدّر كشف PDF لجدول الامتحانات
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات
import { getAcademicYear, formatAcademicYearDisplay, getStoredData, INITIAL_PROFILES } from '@/lib/mock-data'; // 🗓️ العام الدراسي والمستخدمين ومساعد التنسيق
import { getStageNameInArabic } from '@/lib/grade-utils'; // 🎓 أسماء المراحل بالعربية
import { saveFinalExamScheduleToSupabase, deleteFinalExamScheduleFromSupabase } from '@/lib/supabase-client'; // ☁️ حفظ وحذف جداول الامتحانات في Supabase
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  Check, 
  X, 
  Send,
  Eye,
  ShieldCheck,
  Trash2,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react'; // 🎨 استيراد أيقونات Lucide SVG النقية الكاملة

interface SuperAdminExamApprovalModalProps {
  isOpen: boolean;                                     // 🚪 حالة الفتح
  onClose: () => void;                                 // 🚪 الإغلاق
  schedules: FinalExamSchedule[];                      // 📋 كافة الجداول
  slots: FinalExamSlot[];                              // 📋 كافة البنود
  students: UserProfile[];                             // 👥 حسابات الطلاب لإرسال الإشعارات
  currentAdmin: UserProfile;                           // 👤 المسؤول العام الحالي
  onUpdateScheduleStatus: (schedule: FinalExamSchedule) => void; // 🔄 دالة التحديث
  onDeleteSchedule?: (scheduleId: string) => void;     // 🗑️ دالة حذف الجدول
}

export default function SuperAdminExamApprovalModal({
  isOpen,
  onClose,
  schedules,
  slots,
  students,
  currentAdmin,
  onUpdateScheduleStatus,
  onDeleteSchedule,
}: SuperAdminExamApprovalModalProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [deletingSchedule, setDeletingSchedule] = useState<FinalExamSchedule | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false); // ⏳ حالة تصدير الـ PDF

  // 📄 تصدير ومعاينة جدول الامتحانات للجدول المحدد PDF A4
  const handleExportActiveSchedulePDF = async (scheduleToExport: FinalExamSchedule) => {
    const slotsToExport = slots.filter((s) => s.schedule_id === scheduleToExport.id);
    if (slotsToExport.length === 0) {
      setStatusMessage('لا توجد مواد امتحانية في هذا الجدول لتصديرها.');
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }

    try {
      setIsExportingPDF(true);
      const allProfiles: UserProfile[] = getStoredData('profiles', INITIAL_PROFILES);
      const headUser = allProfiles.find((p) => p.role === 'department_head' && p.department_id === scheduleToExport.department_id);
      const rapUser = allProfiles.find((p) => p.role === 'rapporteur' && p.department_id === scheduleToExport.department_id);

      const success = await exportFinalExamSchedulePDF({
        departmentName: scheduleToExport.department_name,
        stageNumber: scheduleToExport.stage_number,
        semester: scheduleToExport.semester,
        academicYear: scheduleToExport.academic_year_label || getAcademicYear(),
        attemptType: scheduleToExport.attempt_type,
        slots: slotsToExport,
        instructions: scheduleToExport.instructions,
        headName: headUser?.full_name?.trim() || 'رئاسة القسم العلمي',
        rapporteurName: rapUser?.full_name?.trim() || 'مقررية القسم العلمي',
      });

      if (success) { // 🔍 التحقق من نجاح التصدير
        setStatusMessage(`تم تصدير وثيقة جدول امتحانات قسم (${scheduleToExport.department_name}) بنجاح!`); // 📢 رسالة نجاح نقية بدون إيموجي
      } else {
        setStatusMessage('تعذر إتمام عملية تصدير الـ PDF.'); // ⚠️ رسالة تعذر التصدير
      }
      setTimeout(() => setStatusMessage(''), 4000);
    } catch {
      setStatusMessage('حدث خطأ أثناء تصدير ملف الـ PDF.');
      setTimeout(() => setStatusMessage(''), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 🗑️ دالة فتح كارد حذف جدول الامتحانات نهائياً
  const handleDelete = (schedule: FinalExamSchedule) => {
    setDeletingSchedule(schedule);
  };

  // 🗑️ تنفيذ حذف جدول الامتحانات بعد التأكيد في الكارد
  const confirmExecuteDeleteSchedule = () => {
    if (!deletingSchedule) return;
    const schedule = deletingSchedule;
    if (onDeleteSchedule) {
      onDeleteSchedule(schedule.id);
      deleteFinalExamScheduleFromSupabase(schedule.id); // ☁️ حذف الجدول من Supabase
      if (selectedScheduleId === schedule.id) {
        setSelectedScheduleId(null);
      }
      setStatusMessage(`تم حذف جدول امتحانات قسم (${schedule.department_name}) بنجاح.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }
    setDeletingSchedule(null);
  };

  // 🔄 دالة تبديل حالة الجدول بين معتمد وغير معتمد
  const handleToggleApproval = (schedule: FinalExamSchedule) => {
    if (schedule.status === 'approved') {
      const updated: FinalExamSchedule = {
        ...schedule,
        status: 'pending_approval',
        reviewed_by_id: currentAdmin.id,
        reviewed_by_name: currentAdmin.full_name,
        reviewed_at: new Date().toISOString(),
        review_notes: 'تم إلغاء الاعتماد وإعادة الجدول إلى حالة غير معتمد (قيد التدقيق والمراجعة).',
        updated_at: new Date().toISOString(),
      };
      onUpdateScheduleStatus(updated); // 🔄 تحديث حالة الجدول
      saveFinalExamScheduleToSupabase(updated); // ☁️ حفظ التحديث في Supabase
      setStatusMessage(`تم إلغاء اعتماد جدول قسم (${schedule.department_name}) وجعله غير معتمد بنجاح.`); // 📢 رسالة نجاح نقية بدون إيموجي
      setTimeout(() => setStatusMessage(''), 4000); // ⏳ إخفاء الرسالة بعد 4 ثواني
    } else {
      handleApprove(schedule);
    }
  };

  if (!isOpen) return null;

  // 🔍 الجداول التي بحاجة إلى تدقيق ومصادقة
  const pendingSchedules = schedules.filter((s) => s.status === 'pending_approval');
  const allOtherSchedules = schedules.filter((s) => s.status !== 'pending_approval');

  // الجدول المحدد للمعاينة
  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId) || pendingSchedules[0] || schedules[0];
  const activeSlots = activeSchedule ? slots.filter((s) => s.schedule_id === activeSchedule.id) : [];

  // 🟢 المصادقة والاعتماد الرسمي للجدول ونشره للطلبة
  const handleApprove = (schedule: FinalExamSchedule) => {
    const updated: FinalExamSchedule = {
      ...schedule,
      status: 'approved',
      reviewed_by_id: currentAdmin.id,
      reviewed_by_name: currentAdmin.full_name,
      reviewed_at: new Date().toISOString(),
      review_notes: 'تم التدقيق والمصادقة والاعتماد الرسمي من قبل إدارة الكلية.',
      updated_at: new Date().toISOString(),
    };

    onUpdateScheduleStatus(updated);
    saveFinalExamScheduleToSupabase(updated); // ☁️ حفظ واعتماد الجدول في Supabase

    // 📢 1. إرسال إشعار فوري لجميع طلبة المرحلة والقسم المعنيين
    const targetStudents = students.filter(
      (st) => st.department_id === schedule.department_id && (st.stage_number || 1) === schedule.stage_number
    );

    const semLabel = schedule.semester === 1 ? 'الكورس الأول' : 'الكورس الثاني';
    const attLabel = schedule.attempt_type === 'first_attempt' ? 'الدور الأول' : 'الدور الثاني';

    targetStudents.forEach((st) => {
      sendAppNotification({ // 🔔 إرسال الإشعار للطالب
        recipient_id: st.id, // 🆔 معرف الطالب
        recipient_role: 'student', // 🎓 نوع الحساب
        title: `تم اعتماد ونشر جدول الامتحانات النهائية (${semLabel} - ${attLabel})`, // 🏷️ عنوان الإشعار الصافي
        message: `أعزاءنا الطلبة، تم اعتماد ونشر جدول الامتحانات النهائية لمرحلتكم رسميّاً للعام الدراسي (${schedule.academic_year_label}). يرجى مراجعة لوحة تحكم الطالب والالتزام التام بالقاعات والتعليمات الامتحانية.`,
        type: 'system_announcement', // 📢 نوع الإشعار
        link: '/student/dashboard', // 🔗 الرابط
      });
    });

    // 🔔 2. إرسال إشعار لرئيس ومقرر القسم
    sendAppNotification({
      recipient_id: schedule.created_by_id,
      recipient_role: schedule.created_by_role,
      title: `تمت مصادقة واعتماد جدول الامتحانات النهائية - قسم ${schedule.department_name}`, // 🏷️ عنوان بدون إيموجي
      message: `قام المسؤول العام (${currentAdmin.full_name}) باعتماد جدول امتحانات المرحلة ${schedule.stage_number} (${semLabel}) رسمياً وتم نشره لجميع الطلبة.`,
      type: 'system_announcement',
      link: '/admin/department-portal',
    });

    setStatusMessage(`تمت المصادقة على جدول قسم (${schedule.department_name}) بنجاح وتم إشعار ${targetStudents.length} طالباً!`); // 📢 رسالة صافية
    setTimeout(() => setStatusMessage(''), 4000);
  };

  // 🔴 رفض الجدول وإعادته لرئيس القسم للتعديل مع الملاحظات
  const handleReject = (schedule: FinalExamSchedule) => {
    if (!rejectNotes.trim()) { // ⚠️ فحص وجود ملاحظات
      setStatusMessage('يرجى كتابة سبب الإعادة أو ملاحظات التعديل المطلوبة لرئيس القسم.'); // 📢 رسالة توجيه نقية
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }

    const updated: FinalExamSchedule = {
      ...schedule,
      status: 'rejected',
      reviewed_by_id: currentAdmin.id,
      reviewed_by_name: currentAdmin.full_name,
      reviewed_at: new Date().toISOString(),
      review_notes: rejectNotes,
      updated_at: new Date().toISOString(),
    };

    onUpdateScheduleStatus(updated);
    saveFinalExamScheduleToSupabase(updated); // ☁️ حفظ قرار الرفض والملاحظات في Supabase

    // إشعار رئيس / مقرر القسم
    sendAppNotification({
      recipient_id: schedule.created_by_id,
      recipient_role: schedule.created_by_role,
      title: `إعادة جدول الامتحانات النهائية للتعديل - قسم ${schedule.department_name}`, // 🏷️ عنوان صافي بدون إيموجي
      message: `قام المسؤول العام بإعادة جدول امتحانات المرحلة ${schedule.stage_number} مع الملاحظات التالية: "${rejectNotes}". يرجى إجراء التعديلات وإعادة الإرسال.`,
      type: 'system_announcement',
      link: '/admin/department-portal',
    });

    setIsRejecting(false);
    setRejectNotes('');
    setStatusMessage('تمت إعادة الجدول لرئيس القسم مع الملاحظات والتوجيهات بنجاح.'); // 📢 رسالة نجاح نقية
    setTimeout(() => setStatusMessage(''), 4000);
  };

  if (!isOpen) return null;

  return (
    // 🔮 الغطاء الزجاجي المعتم للشاشة بالكامل مع محاذاة وتوسيط دقيق
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden" dir="rtl">
      {/* 🏛️ بطاقة المودال الرئيسية العريضة الفخمة ذات الأبعاد الثابتة والمقيدة هندسياً */}
      <div className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full h-[90vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 📌 1. هيدر النافذة الثابت (Sticky Header) بأحجام نصوص متوسطة ومتناسقة */}
        <div className="flex-shrink-0 sticky top-0 flex items-center justify-between border-b border-slate-200 p-5 sm:p-6 bg-white/95 backdrop-blur-md z-30 shadow-xs">
          <div className="flex items-center gap-3"> {/* 📐 حاوية الأيقونة والعناوين */}
            <div className="p-3 bg-slate-100 text-slate-950 rounded-2xl border border-slate-300 shadow-2xs"> {/* 📦 إطار أيقونة الدرع */}
              <ShieldCheck className="w-7 h-7 text-slate-950 shrink-0" /> {/* 🛡️ أيقونة SVG للدرع الأمني بحجم وسط */}
            </div>
            <div> {/* 📝 العناوين والباجات */}
              <div className="flex items-center gap-2 mb-1 flex-wrap"> {/* 📐 سطر الشارات */}
                <span className="px-3 py-1 bg-[#0F2942] text-white rounded-xl text-xs sm:text-sm font-black shadow-2xs"> {/* 🏛️ شارة إدارة الكلية بحجم وسط */}
                  إدارة الكلية
                </span>
                {pendingSchedules.length > 0 ? ( // 🔍 التحقق إذا كانت هناك جداول معلقة
                  <span className="px-3 py-1 bg-sky-50 text-sky-950 border border-sky-300 rounded-xl text-xs sm:text-sm font-black font-mono flex items-center gap-1.5 shadow-2xs"> {/* ☁️ باج سماوي وسط */}
                    <Clock className="w-4 h-4 text-sky-700 shrink-0" /> {/* ⏰ أيقونة SVG للساعة */}
                    <span>{pendingSchedules.length} جداول معلقة للاعتماد</span> {/* 🔢 عدد الجداول المعلقة */}
                  </span>
                ) : ( // 🌟 إذا كانت كافة الجداول معتمدة
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs"> {/* 🌿 باج زمردي وسط */}
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> {/* ✔️ أيقونة SVG للاكتمال */}
                    <span>كافة الجداول معتمدة بالكامل</span> {/* 📝 نص الاعتماد التام */}
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-100 text-slate-950 border border-slate-300 rounded-xl text-xs sm:text-sm font-black hidden sm:inline-flex items-center gap-1.5 shadow-2xs"> {/* 📊 إجمالي الجداول */}
                  <FileSpreadsheet className="w-4 h-4 text-slate-950 shrink-0" /> {/* 📄 أيقونة SVG للجدول */}
                  <span>إجمالي الجداول: {schedules.length}</span> {/* 🔢 العدد الكلي */}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950"> {/* 🏷️ العنوان الرئيسي للنافذة بحجم وسط متناسق */}
                مركز تدقيق ومصادقة جداول الامتحانات النهائية
              </h3>
            </div>
          </div>

          {/* ❌ زر الإغلاق السريع في زاوية الهيدر بأيقونة SVG وسط */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // ⚡ دالة الإغلاق
            className="p-2.5 text-slate-950 hover:bg-slate-100 rounded-2xl transition cursor-pointer border border-slate-200 shadow-2xs font-black" // 🎨 حدود وأيقونة واضحة
            title="إغلاق النافذة" // ℹ️ تلميح
          >
            <X className="w-6 h-6 text-slate-950" /> {/* ❌ أيقونة الإغلاق SVG بحجم وسط */}
          </button>
        </div>

        {/* 📋 2. محتوى النافذة الداخلي القابل للتمرير بين الهيدر الثابت والفوتر الثابت */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 min-h-0 bg-slate-50/50">
          
          {/* 📢 رسالة التنبيه أو النجاح اللحظية العلوية */}
          {statusMessage && ( // 🔍 إظهار الرسالة إذا وجدت
            <div className="p-4 bg-emerald-600 text-white font-black text-base rounded-2xl shadow-md flex items-center gap-2.5 animate-in fade-in"> {/* 🌟 شريط النجاح بحجم وسط */}
              <CheckCircle2 className="w-6 h-6 shrink-0 text-white" /> {/* ✔️ أيقونة SVG */}
              <span>{statusMessage}</span> {/* 📝 نص الرسالة */}
            </div>
          )}

          {/* 🔍 فحص حالة وجود جداول في النظام: إما عرض الداشبورد الاحترافي الشامل أو الجداول الفعلية */}
          {schedules.length === 0 ? ( // 📊 في حال عدم وجود أي جدول وارد
            <div className="space-y-5 py-2"> {/* 📐 حاوية الداشبورد المكتملة */}
              
              {/* 📊 بطاقات الإحصائيات المركزية الثلاث الفاخرة بنصوص وسط مريحة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> {/* 📐 توزيع الإحصائيات عبر 3 أعمدة */}
                
                {/* 1. بطاقة إجمالي الجداول */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-right space-y-1.5 shadow-xs"> {/* 📦 البطاقة الأولى */}
                  <div className="flex items-center justify-between"> {/* 📐 رأس البطاقة */}
                    <span className="text-sm sm:text-base font-black text-slate-950">إجمالي الجداول الواردة</span> {/* 🏷️ التسمية بحجم وسط */}
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200 shadow-2xs"> {/* 🎨 أيقونة زرقاء */}
                      <Calendar className="w-5 h-5" /> {/* 📅 أيقونة SVG للتقويم */}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">0</div> {/* 🔢 الرقم بحجم وسط */}
                  <div className="text-xs sm:text-sm font-black text-slate-950">كافة الأقسام الـ 12 بالكلية</div> {/* ℹ️ الشرح بحجم وسط وواضح */}
                </div>

                {/* 2. بطاقة الجداول المعتمدة رسميّاً */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-right space-y-1.5 shadow-xs"> {/* 📦 البطاقة الثانية */}
                  <div className="flex items-center justify-between"> {/* 📐 رأس البطاقة */}
                    <span className="text-sm sm:text-base font-black text-slate-950">الجداول المعتمدة رسميّاً</span> {/* 🏷️ التسمية بحجم وسط */}
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shadow-2xs"> {/* 🎨 أيقونة زمردية */}
                      <CheckCircle2 className="w-5 h-5" /> {/* ✔️ أيقونة SVG للاعتماد */}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">0</div> {/* 🔢 الرقم بحجم وسط */}
                  <div className="text-xs sm:text-sm font-black text-slate-950">تم تدقيقها ونشرها للطلبة فوراً</div> {/* ℹ️ الشرح بحجم وسط وواضح */}
                </div>

                {/* 3. بطاقة الجداول المعلقة بالسماوي الفاخر بدلاً من البرتقالي */}
                <div className="p-5 bg-white border border-slate-200 rounded-3xl text-right space-y-1.5 shadow-xs"> {/* 📦 البطاقة الثالثة */}
                  <div className="flex items-center justify-between"> {/* 📐 رأس البطاقة */}
                    <span className="text-sm sm:text-base font-black text-slate-950">الجداول المعلقة للاعتماد</span> {/* 🏷️ التسمية بحجم وسط */}
                    <div className="p-2.5 bg-sky-50 text-sky-700 rounded-2xl border border-sky-200 shadow-2xs"> {/* ☁️ أيقونة سماوية بدلاً من البرتقالي */}
                      <Clock className="w-5 h-5" /> {/* ⏰ أيقونة SVG للساعة */}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">0</div> {/* 🔢 الرقم بحجم وسط */}
                  <div className="text-xs sm:text-sm font-black text-slate-950">بانتظار مصادقة إدارة الكلية</div> {/* ℹ️ الشرح بحجم وسط وواضح */}
                </div>

              </div>

              {/* 🏛️ بطاقة العرض المركزية الكاملة والاحترافية بنصوص وسط واضحة ومتوازنة */}
              <div className="p-7 sm:p-10 bg-white border border-slate-200 rounded-3xl text-center space-y-5 shadow-xs"> {/* 📦 البطاقة الكبرى */}
                <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-3xl flex items-center justify-center mx-auto text-slate-950 shadow-inner"> {/* 🎨 حاوية الأيقونة الكبيرة */}
                  <FileSpreadsheet className="w-10 h-10 text-slate-950" /> {/* 📊 أيقونة SVG المركزية بحجم وسط */}
                </div>

                <div className="space-y-2 max-w-xl mx-auto"> {/* 📐 النصوص المركزية */}
                  <h4 className="text-xl sm:text-2xl font-black text-slate-950"> {/* 🏷️ العنوان بحجم وسط بالأسود الداكن */}
                    لا توجد جداول امتحانات نهائية واردة حالياً
                  </h4>
                  <p className="text-base font-black text-slate-950 leading-relaxed"> {/* 🖤 الشرح بحجم وسط مريح ومتناسق */}
                    عندما يقوم رؤساء الأقسام والمقررين بإعداد جداول الامتحانات النهائية وإرسالها للمصادقة، ستظهر هنا فوراً مع كافة تفاصيل القاعات، المواد، والتوقيتات للتدقيق والمصادقة والاعتماد الرسمي المباشر.
                  </p>
                </div>

                {/* 🔄 خطوات منظومة مسار بولونيا المركزية لإدارة الامتحانات بنصوص وسط */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-right"> {/* 📐 بطاقات الخطوات الثلاث */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs"> {/* 1️⃣ الخطوة الأولى */}
                    <div className="flex items-center gap-2 text-slate-950 font-black text-sm sm:text-base"> {/* 🏷️ العنوان بحجم وسط */}
                      <Building2 className="w-4.5 h-4.5 text-indigo-700 shrink-0" /> {/* 🏢 أيقونة القسم */}
                      <span>1. إعداد من القسم</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-950 leading-normal">إدخال المواد وتحديد القاعات والمراقبين بدقة</p> {/* ℹ️ التفاصيل بحجم وسط */}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs"> {/* 2️⃣ الخطوة الثانية */}
                    <div className="flex items-center gap-2 text-slate-950 font-black text-sm sm:text-base"> {/* 🏷️ العنوان بحجم وسط */}
                      <ShieldCheck className="w-4.5 h-4.5 text-sky-700 shrink-0" /> {/* 🛡️ أيقونة التدقيق */}
                      <span>2. تدقيق الإدارة</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-950 leading-normal">فحص التضارب ومطابقة توجيهات الوزارة والعمادة</p> {/* ℹ️ التفاصيل بحجم وسط */}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs"> {/* 3️⃣ الخطوة الثالثة */}
                    <div className="flex items-center gap-2 text-slate-950 font-black text-sm sm:text-base"> {/* 🏷️ العنوان بحجم وسط */}
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0" /> {/* ✔️ أيقونة النشر */}
                      <span>3. نشر واعتماد</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-950 leading-normal">إشعار فوري وتصدير وثائق PDF رسمية لجميع الطلبة</p> {/* ℹ️ التفاصيل بحجم وسط */}
                  </div>
                </div>

              </div>

            </div>
          ) : ( // 📋 في حال وجود جداول فعلية في النظام
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6"> {/* 📐 تقسيم العرض إلى قائمتين */}
              
              {/* 📋 القائمة الجانبية للجداول (4 أعمدة) */}
              <div className="md:col-span-4 space-y-3 max-h-[520px] overflow-y-auto pr-1"> {/* 📐 الحاوية الجانبية */}
                <h4 className="text-base font-black text-slate-950 px-1">الجداول المرسلة للاعتماد:</h4> {/* 🏷️ عنوان القائمة بحجم وسط */}

                {pendingSchedules.map((sch) => ( // 🔄 استعراض الجداول المعلقة
                  <div
                    key={sch.id} // 🔑 المعرف
                    onClick={() => setSelectedScheduleId(sch.id)} // ⚡ تحديد الجدول للمعاينة
                    className={`w-full text-right p-4 rounded-3xl border transition cursor-pointer space-y-2 block shadow-2xs ${
                      activeSchedule?.id === sch.id
                        ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-400/40' // 🌟 لون أزرق ملكي بدلاً من البرتقالي
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-base font-black"> {/* 📐 رأس بطاقة الجدول بحجم وسط */}
                      <span className="font-black text-slate-950">قسم {sch.department_name}</span> {/* 🏢 اسم القسم */}
                      <div className="flex items-center gap-1.5"> {/* 🔘 أزرار الإجراء السريع */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleApproval(sch);
                          }}
                          className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-2xs" // ☁️ باج سماوي وسط بدلاً من البرتقالي
                          title="انقر للاعتماد والمصادقة المباشرة"
                        >
                          <span>غير معتمد</span>
                          <RotateCcw className="w-3.5 h-3.5 text-sky-700 shrink-0" /> {/* 🔄 أيقونة SVG */}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(sch);
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="حذف هذا الجدول نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" /> {/* 🗑️ أيقونة SVG */}
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-black text-slate-950"> {/* 🖤 تفاصيل المرحلة بحجم وسط بالأسود الداكن */}
                      المرحلة {getStageNameInArabic(sch.stage_number)} • {sch.semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} • <bdi dir="ltr">{formatAcademicYearDisplay(sch.academic_year_label)}</bdi>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-slate-950"> {/* 🖤 اسم المنشئ بحجم وسط بالأسود */}
                      بواسطة: {sch.created_by_name}
                    </div>
                  </div>
                ))}

                {pendingSchedules.length === 0 && ( // 🔍 رسالة في حال عدم وجود معلق
                  <div className="p-6 bg-white border border-dashed border-slate-300 rounded-3xl text-center text-base font-black text-slate-950 shadow-2xs">
                    لا توجد جداول معلقة بانتظار الاعتماد حالياً.
                  </div>
                )}

                {allOtherSchedules.length > 0 && ( // 🔄 استعراض الجداول المعتمدة والمكتملة
                  <>
                    <h4 className="text-base font-black text-slate-950 px-1 pt-3">الجداول المعتمدة والمكتملة:</h4>
                    {allOtherSchedules.map((sch) => (
                      <div
                        key={sch.id}
                        onClick={() => setSelectedScheduleId(sch.id)}
                        className={`w-full text-right p-4 rounded-3xl border transition cursor-pointer space-y-1.5 block shadow-2xs ${
                          activeSchedule?.id === sch.id
                            ? 'bg-slate-100 border-slate-900 ring-2 ring-slate-800/30'
                            : 'bg-white border-slate-200 opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-base font-black">
                          <span className="font-black text-slate-950">{sch.department_name} (م {sch.stage_number})</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleApproval(sch);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-2xs border ${
                                sch.status === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100' 
                                  : 'bg-slate-100 text-slate-950 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="انقر لتبديل حالة الاعتماد (معتمد / غير معتمد)"
                            >
                              <span>{sch.status === 'approved' ? 'معتمد' : 'غير معتمد'}</span>
                              <RotateCcw className="w-3.5 h-3.5 text-slate-700 shrink-0" /> {/* 🔄 أيقونة SVG */}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(sch);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="حذف هذا الجدول نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" /> {/* 🗑️ أيقونة SVG */}
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                        <span className="text-sm font-black text-slate-950 block"> {/* 🖤 تفاصيل الكورس بحجم وسط بالأسود */}
                          {sch.semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} • <bdi dir="ltr">{formatAcademicYearDisplay(sch.academic_year_label)}</bdi>
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* 📄 قسم معاينة الجدول المحدد وتفاصيله الكاملة (8 أعمدة) */}
              <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 space-y-5 max-h-[520px] overflow-y-auto shadow-xs">
                {activeSchedule ? ( // 🔍 التحقق من وجود جدول نشط
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-slate-950"> {/* 🏷️ عنوان الجدول بحجم وسط */}
                          جدول امتحانات قسم {activeSchedule.department_name}
                        </h4>
                        <span className="text-sm font-black text-slate-950"> {/* 🖤 تفاصيل الكورس بحجم وسط بالأسود الفاحم */}
                          المرحلة {getStageNameInArabic(activeSchedule.stage_number)} • {activeSchedule.semester === 1 ? 'الكورس الأول' : 'الكورس الثاني'} (<bdi dir="ltr">{formatAcademicYearDisplay(activeSchedule.academic_year_label)}</bdi>)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleExportActiveSchedulePDF(activeSchedule)}
                          disabled={isExportingPDF || activeSlots.length === 0}
                          className="px-3.5 py-2 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                          title="معاينة وتصدير جدول الامتحانات بصيغة PDF A4 الرسمية"
                        >
                          <FileText className="w-4 h-4 text-cyan-300 shrink-0" /> {/* 📄 أيقونة SVG */}
                          <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير الجدول (PDF)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleApproval(activeSchedule)}
                          className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-2 shadow-2xs border ${
                            activeSchedule.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200' 
                              : activeSchedule.status === 'pending_approval' 
                              ? 'bg-sky-100 text-sky-950 border-sky-300 hover:bg-sky-200' // ☁️ سماوي وسط بدلاً من البرتقالي
                              : 'bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200'
                          }`}
                          title="انقر لتبديل حالة الاعتماد (معتمد / غير معتمد)"
                        >
                          <span>{activeSchedule.status === 'approved' ? 'معتمد ورسمي' : activeSchedule.status === 'pending_approval' ? 'غير معتمد (قيد المراجعة)' : 'مطلوب تعديل'}</span>
                          <RotateCcw className="w-4 h-4 text-slate-950 shrink-0" /> {/* 🔄 أيقونة SVG */}
                        </button>
                      </div>
                    </div>

                    {/* 📊 جدول المواد والمواعيد التفصيلي بنصوص وسط متناسقة */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="grid grid-cols-12 bg-slate-100 text-slate-950 border-b border-slate-200 p-3.5 text-sm sm:text-base font-black text-center">
                        <div className="col-span-1">#</div>
                        <div className="col-span-2">اليوم والتاريخ</div>
                        <div className="col-span-2">التوقيت</div>
                        <div className="col-span-4 text-right pr-2">المادة</div>
                        <div className="col-span-3">القاعة والبناية</div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {activeSlots.map((slot, idx) => (
                          <div key={slot.id} className="grid grid-cols-12 items-center p-3.5 text-sm sm:text-base font-black text-center hover:bg-slate-50 transition">
                            <div className="col-span-1 font-black text-slate-950 font-mono">{idx + 1}</div>
                            <div className="col-span-2 font-black text-slate-950 font-mono">{slot.exam_date}</div>
                            <div className="col-span-2 font-black text-slate-950 font-mono">{slot.start_time} - {slot.end_time}</div>
                            <div className="col-span-4 text-right pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <strong className="text-slate-950 block font-black text-base">{slot.course_name}</strong>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                                  slot.study_type === 'evening'
                                    ? 'bg-slate-100 text-slate-950 border-slate-300'
                                    : 'bg-sky-50 text-sky-950 border-sky-200'
                                }`}>
                                  {slot.study_type === 'evening' ? 'مسائي' : 'صباحي'}
                                </span>
                              </div>
                              <span className="text-sm font-black text-slate-950 font-mono">[{slot.course_code}]</span>
                            </div>
                            <div className="col-span-3 text-center">
                              <span className="font-black text-emerald-800 text-base block">{slot.hall_name}</span>
                              <span className="text-sm font-black text-slate-950 block">{slot.building_name}</span>
                            </div>
                          </div>
                        ))}

                        {activeSlots.length === 0 && (
                          <div className="p-8 text-center text-base font-black text-slate-950">
                            لم تتم إضافة مواد في هذا الجدول بعد.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* حقل كتابة سبب الإعادة إن كان مفتوحاً بنصوص متناسقة */}
                    {isRejecting && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl space-y-3 animate-in fade-in shadow-xs">
                        <label className="block text-base font-black text-rose-950">
                          ملاحظات وتوجيهات التعديل لرئيس ومقرر القسم:
                        </label>
                        <textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          placeholder="مثال: يرجى تعديل موعد امتحان مادة شبكات الحاسوب لتجنب التضارب وتحديد قاعة أكبر..."
                          rows={2}
                          className="w-full p-3.5 bg-white border border-rose-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden"
                        />
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setIsRejecting(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-950 font-black rounded-2xl text-sm transition cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(activeSchedule)}
                            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl text-sm font-black shadow-xs cursor-pointer flex items-center gap-2"
                          >
                            <Send className="w-4 h-4 text-white shrink-0" /> {/* 🚀 أيقونة SVG للإرسال بدلاً من الإيموجي */}
                            <span>تأكيد الإعادة وإشعار القسم</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-950 font-black text-base">
                    يرجى تحديد جدول من القائمة الجانبية لمعاينته واتخاذ القرار.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* 📌 3. فوتر النافذة الثابت (Sticky Footer) المقفل بالأسفل بنصوص وسط وأزرار متناسقة */}
        <div className="flex-shrink-0 sticky bottom-0 border-t border-slate-200 p-4 sm:p-5 bg-slate-50/95 backdrop-blur-md z-30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          {activeSchedule ? ( // 🔍 إذا كان هناك جدول محدد
            <>
              {/* 🏷️ تفاصيل الجدول المعروض في الفوتر بحجم وسط */}
              <div className="flex items-center gap-2 flex-wrap text-sm sm:text-base font-black text-slate-950">
                <span>الجدول المعروض:</span>
                <span className="px-3.5 py-1 bg-white border border-slate-300 rounded-xl text-slate-950 font-black shadow-2xs text-sm sm:text-base">
                  قسم {activeSchedule.department_name} (المرحلة {getStageNameInArabic(activeSchedule.stage_number)})
                </span>
                <span className={`px-3 py-1 rounded-xl font-black border text-xs sm:text-sm shadow-2xs ${
                  activeSchedule.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : activeSchedule.status === 'pending_approval'
                    ? 'bg-sky-100 text-sky-950 border-sky-300' // ☁️ سماوي وسط
                    : 'bg-rose-100 text-rose-950 border-rose-300'
                }`}>
                  {activeSchedule.status === 'approved' ? 'معتمد ورسمي' : activeSchedule.status === 'pending_approval' ? 'غير معتمد (قيد المراجعة)' : 'مطلوب تعديل'}
                </span>
              </div>

              {/* 🔘 أزرار الإجراءات والمصادقة بالفوتر الثابت بنصوص وسط وأيقونات متناسقة */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExportActiveSchedulePDF(activeSchedule)}
                  disabled={isExportingPDF || activeSlots.length === 0}
                  className="px-4 py-2 bg-[#0F2942] hover:bg-[#16385c] disabled:opacity-50 text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  title="معاينة وتصدير جدول الامتحانات بصيغة PDF A4 الرسمية"
                >
                  <FileText className="w-4.5 h-4.5 text-cyan-300 shrink-0" /> {/* 📄 أيقونة SVG */}
                  <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير الجدول (PDF)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(activeSchedule)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="حذف هذا الجدول نهائياً"
                >
                  <Trash2 className="w-4.5 h-4.5 shrink-0" /> {/* 🗑️ أيقونة SVG */}
                  <span>حذف الجدول</span>
                </button>

                {activeSchedule.status !== 'approved' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(!isRejecting)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <XCircle className="w-4.5 h-4.5 shrink-0" /> {/* ❌ أيقونة SVG */}
                      <span>إعادة مع الملاحظات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(activeSchedule)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-sm sm:text-base font-black transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <Check className="w-4.5 h-4.5 text-white shrink-0" /> {/* ✔️ أيقونة SVG */}
                      <span>المصادقة والاعتماد الرسمي</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(activeSchedule)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-300 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer shadow-2xs flex items-center gap-2"
                    title="إلغاء اعتماد هذا الجدول وجعله غير معتمد"
                  >
                    <RotateCcw className="w-4.5 h-4.5 text-slate-950 shrink-0" /> {/* 🔄 أيقونة SVG سوداء وسط */}
                    <span>إلغاء الاعتماد (جعله غير معتمد)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <X className="w-4.5 h-4.5 shrink-0" /> {/* ❌ أيقونة SVG */}
                  <span>إغلاق</span>
                </button>
              </div>
            </>
          ) : ( // 🏛️ في حال عدم وجود جدول نشط
            <>
              <div className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2"> {/* 🏷️ شعار الجامعة بحجم وسط وواضح */}
                <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0" /> {/* 🛡️ أيقونة SVG وسط */}
                <span>جامعة الإمام جعفر الصادق (ع) - فرع ميسان | مركز مصادقة وتدقيق الجداول الامتحانية</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 rounded-2xl text-sm sm:text-base font-black transition cursor-pointer shadow-2xs flex items-center gap-2" // 🔘 زر إغلاق وسط
              >
                <X className="w-4.5 h-4.5 shrink-0" /> {/* ❌ أيقونة SVG */}
                <span>إغلاق النافذة</span>
              </button>
            </>
          )}
        </div>

        {/* 🗑️ كارد تأكيد حذف جدول الامتحانات الاحترافي الفاخر */}
        <ConfirmDeleteModal
          isOpen={!!deletingSchedule}
          onClose={() => setDeletingSchedule(null)}
          title="تأكيد حذف جدول الامتحانات النهائية"
          itemName={`قسم ${deletingSchedule?.department_name || ''} - المرحلة ${deletingSchedule?.stage_number || 1}`}
          itemDetails={`العام الدراسي: ${deletingSchedule?.academic_year_label || deletingSchedule?.academic_year_id || getAcademicYear()} | الفصل الدراسي: ${deletingSchedule?.semester === 1 ? 'الأول' : 'الثاني'}`}
          warningMessage="سيتم حذف جدول الامتحانات وتوزيع القاعات والمراقبين الخاص بهذا القسم نهائياً."
          onConfirm={confirmExecuteDeleteSchedule}
        />

      </div>
    </div>
  );
}
