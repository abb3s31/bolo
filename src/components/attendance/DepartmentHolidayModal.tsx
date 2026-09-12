import React, { useState, useEffect } from 'react'; // ⚛️ استيراد ريآكت والخطافات الأساسية
import { // 🎨 استيراد أيقونات SVG النقية المخصصة
  DeclareHolidaySvg, // 📢 أيقونة إعلان العطلة
  AttendanceHolidaySvg, // 🏖️ أيقونة العطلة الرسمية
} from '@/components/common/AttendanceCustomSvgIcons'; // 📦 استيراد الأيقونات
import { // 🏷️ استيراد الأنواع الرسمية
  DepartmentOfficialHoliday, // 🏖️ نوع العطلة الرسمية
  StudentAttendanceRecord, // 📋 نوع سجل الحضور
  UserProfile, // 👤 نوع بروفايل المستخدم
  Course, // 📚 نوع المادة
} from '@/types'; // 🔗 الاستيراد من ملف الأنواع
import { // 🏖️ استيراد دوال خدمة العطلات
  getDepartmentOfficialHolidays, // 📥 جلب العطل
  saveDepartmentOfficialHoliday, // 💾 حفظ عطلة
  deleteDepartmentOfficialHoliday, // 🗑️ حذف عطلة
  applyHolidayToAttendanceRecords, // ⚡ تطبيق العطلة الذكي على السجلات
} from '@/lib/holiday-service'; // 📦 استيراد الخدمة

// 📋 واجهة خصائص نافذة إدارة وتعطيل الدوام الرسمي
export interface DepartmentHolidayModalProps {
  isOpen: boolean; // 🚪 هل النافذة مفتوحة
  onClose: () => void; // 🔒 دالة إغلاق النافذة
  currentDeptId: string; // 🏢 معرف القسم الحالي
  currentHeadName?: string; // 👤 اسم رئيس القسم
  currentRapName?: string; // 👤 اسم مقرر القسم
  deptStudents: UserProfile[]; // 🎓 طلاب القسم
  deptCourses: Course[]; // 📚 مواد القسم
  attendanceRecords: StudentAttendanceRecord[]; // 📋 سجلات الحضور
  setAttendanceRecords: React.Dispatch<React.SetStateAction<StudentAttendanceRecord[]>>; // 🔄 تحديث السجلات
  onHolidaySaved?: (holiday: DepartmentOfficialHoliday) => void; // 💾 رد نداء الحفظ
}

// 🏛️ مكون نافذة إعلان العطل الرسمية وتعطيل الدوام الرسمي لرئاسة ومقررية القسم
export const DepartmentHolidayModal: React.FC<DepartmentHolidayModalProps> = ({
  isOpen, // 🚪 حالة الفتح
  onClose, // 🔒 الإغلاق
  currentDeptId, // 🏢 معرف القسم
  currentHeadName, // 👤 رئيس القسم
  currentRapName, // 👤 مقرر القسم
  deptStudents, // 🎓 الطلاب
  deptCourses, // 📚 المواد
  attendanceRecords, // 📋 السجلات
  setAttendanceRecords, // 🔄 دالة تحديث السجلات
  onHolidaySaved, // 💾 رد نداء الحفظ
}) => {
  // 📅 حالة تاريخ العطلة (الافتراضي: تاريخ اليوم بنسق YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0] || '2026-09-20'; // 📅 تاريخ اليوم
  const [holidayDate, setHolidayDate] = useState<string>(todayStr); // 📆 تاريخ العطلة المختار
  // 📝 حالة عنوان أو مناسبة العطلة الرسمية
  const [holidayTitle, setHolidayTitle] = useState<string>(''); // 🏷️ اسم العطلة
  // 🎓 حالة المرحلة المشمولة بالعطلة (null تعني كافة المراحل)
  const [targetStage, setTargetStage] = useState<number | null>(null); // 🎯 المرحلة المشمولة
  // 💡 حالة الملاحظات أو الأمر الإداري
  const [holidayNotes, setHolidayNotes] = useState<string>(''); // 📝 الملاحظات
  // 📋 قائمة العطل المسجلة حالياً في هذا القسم
  const [existingHolidays, setExistingHolidays] = useState<DepartmentOfficialHoliday[]>([]); // 📦 العطل الحالية
  // ⏳ حالة معالجة الحفظ والتطبيق
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // ⏳ حالة التحميل
  // 💬 رسالة إشعار فورية
  const [notificationMsg, setNotificationMsg] = useState<string>(''); // 💬 رسالة التنبيه

  // 🔄 جلب العطل الرسمية الحالية للقسم عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      const hList = getDepartmentOfficialHolidays(currentDeptId); // 📥 جلب العطل
      setExistingHolidays(hList); // 📋 تخزينها بالحالة
      setHolidayDate(todayStr); // 📅 إعادة تعيين التاريخ لليوم
      setHolidayTitle(''); // 📝 تفريغ العنوان
      setHolidayNotes(''); // 💡 تفريغ الملاحظات
      setTargetStage(null); // 🎓 كافة المراحل افتراضياً
      setNotificationMsg(''); // 💬 تصفير الإشعار
    }
  }, [isOpen, currentDeptId, todayStr]);

  // 💾 دالة حفظ وتثبيت يوم العطلة وتطبيقه على كافة الطلبة فورياً
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault(); // 🛑 منع إعادة تحميل الصفحة
    if (!holidayDate) { // ⚠️ فحص وجود التاريخ
      setNotificationMsg('يرجى تحديد تاريخ يوم العطلة بدقة!'); // 💬 تنبيه
      return;
    }
    if (!holidayTitle.trim()) { // ⚠️ فحص وجود اسم العطلة
      setNotificationMsg('يرجى إدخال مناسبة أو عنوان العطلة الرسمية!'); // 💬 تنبيه
      return;
    }

    setIsSubmitting(true); // ⏳ بدء التحميل
    const adminName = currentHeadName || currentRapName || 'رئاسة القسم'; // 👤 اسم المسؤول
    const adminRole = currentHeadName ? 'رئيس القسم' : 'مقرر القسم'; // 🏢 الصفة

    // 🏗️ إنشاء كائن العطلة الرسمية المعتمد
    const newHoliday: DepartmentOfficialHoliday = {
      id: `hol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // 🆔 معرف فريد
      department_id: currentDeptId, // 🏢 معرف القسم
      date: holidayDate, // 📅 تاريخ العطلة YYYY-MM-DD
      title: holidayTitle.trim(), // 📝 اسم العطلة
      target_stage: targetStage, // 🎓 المرحلة المستهدفة
      notes: holidayNotes.trim() || undefined, // 💡 الملاحظات
      created_by_name: adminName, // 👤 اسم المسؤول
      created_by_role: adminRole, // 🏢 الصفة
      created_at: new Date().toISOString(), // ⏰ وقت التسجيل
    };

    // 1️⃣ حفظ العطلة في سجل العطلات
    saveDepartmentOfficialHoliday(newHoliday); // 💾 حفظ العطلة

    // 2️⃣ تطبيق العطلة بذكاء وتحديث سجلات الحضور لكافة طلبة القسم
    const updatedRecords = await applyHolidayToAttendanceRecords({
      holiday: newHoliday, // 🏖️ العطلة
      existingRecords: attendanceRecords, // 📋 السجلات الحالية
      deptStudents, // 🎓 الطلاب
      deptCourses, // 📚 المواد
    });

    // 3️⃣ تحديث سجلات الحضور في واجهة القسم
    setAttendanceRecords(updatedRecords); // 🔄 تحديث الحالة الأب

    // 4️⃣ تحديث قائمة العطل في النافذة
    setExistingHolidays(getDepartmentOfficialHolidays(currentDeptId)); // 📋 جلب المحدث

    if (onHolidaySaved) { // 📞 استدعاء رد النداء إذا توفر
      onHolidaySaved(newHoliday);
    }

    setIsSubmitting(false); // ⏹️ إنهاء التحميل
    setNotificationMsg(`تم إعلان يوم (${holidayDate}) عطلة رسمية وتثبيته لكافة الطلبة بنجاح! 🏖️`); // 💬 رسالة نجاح
    setTimeout(() => { // ⏱️ إغلاق النافذة بعد ثانية ونصف
      onClose();
    }, 1500);
  };

  // 🗑️ دالة حذف وإلغاء عطلة رسمية سابقة
  const handleDeleteHoliday = (holidayId: string) => {
    deleteDepartmentOfficialHoliday(holidayId, currentDeptId); // ✂️ حذف العطلة
    setExistingHolidays(getDepartmentOfficialHolidays(currentDeptId)); // 📋 تحديث القائمة
    setNotificationMsg('تم إلغاء العطلة الرسمية بنجاح.'); // 💬 إشعار
    setTimeout(() => setNotificationMsg(''), 2500); // ⏱️ مسح الإشعار
  };

  // 🚫 إذا كانت النافذة مغلقة لا نرسم شيئاً
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* 🛡️ خلفية معتمة */}
      <div
        className="fixed inset-0 bg-[#0F2942]/60 backdrop-blur-xs transition-opacity" // 🎨 غطاء كحلي ملكي
        onClick={onClose} // ⚡ إغلاق عند النقر بالخلفية
      />

      {/* 📦 صندوق النافذة الفاخر */}
      <div
        className="relative bg-white rounded-3xl border border-slate-300 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden z-10" // 🎨 إطار النافذة
        dir="rtl" // 📐 اتجاه عربي
      >
        {/* 🏷️ الهيدر باللون الكحلي الملكي #0F2942 */}
        <div className="bg-[#0F2942] text-white p-5 sm:p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-xs">
              <DeclareHolidaySvg className="w-7 h-7 text-cyan-300" /> {/* 📢 أيقونة إعلان العطلة */}
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 rounded-lg text-xs font-black">
                رئاسة ومقررية القسم العلمي {/* 🏢 الجهة */}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                تعطيل الدوام / إعلان عطلة رسمية 🏖️ {/* 📌 عنوان المودال */}
              </h3>
            </div>
          </div>

          {/* ❌ زر الإغلاق */}
          <button
            type="button" // 🔘 نوع الزر
            onClick={onClose} // ⚡ إغلاق
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer" // 🎨 مظهر الزر
            title="إغلاق النافذة" // 💡 تلميح
          >
            <span className="text-xl font-mono leading-none">✕</span> {/* ❌ علامة الإغلاق */}
          </button>
        </div>

        {/* 💬 رسالة التنبيه إن وجدت */}
        {notificationMsg && (
          <div className="p-3 bg-sky-50 text-sky-950 border-b border-sky-200 text-sm font-black text-center animate-in fade-in">
            {notificationMsg} {/* 📝 نص التنبيه */}
          </div>
        )}

        {/* 📋 جسم النافذة والنموذج القابل للتمرير */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          <form onSubmit={handleSaveHoliday} className="space-y-4">
            
            {/* 📅 حقل تحديد تاريخ العطلة */}
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">
                تاريخ يوم العطلة أو التعطيل الرسمي: <span className="text-rose-600">*</span>
              </label>
              <input
                type="date" // 📅 نوع الإدخال تاريخ
                value={holidayDate} // 📌 التاريخ الحالي
                onChange={(e) => setHolidayDate(e.target.value)} // ⚡ تحديث التاريخ
                required // 🔒 حقل إجباري
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20 font-mono"
              />
            </div>

            {/* 📝 مناسبة العطلة أو سبب التعطيل */}
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">
                عنوان ومناسبة العطلة الرسمية: <span className="text-rose-600">*</span>
              </label>
              <input
                type="text" // ✍️ نوع الإدخال نص
                value={holidayTitle} // 📌 نص العنوان
                onChange={(e) => setHolidayTitle(e.target.value)} // ⚡ تحديث العنوان
                placeholder="مثال: عطلة رسمية بمناسبة المولد النبوي الشريف / تعطيل لسوء الأحوال الجوية..." // 💡 مثال
                required // 🔒 إجباري
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
              />
            </div>

            {/* 🎓 نطاق المراحل المشمولة بالعطلة */}
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">
                نطاق التعطيل والمراحل المشمولة:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* خيار كافة المراحل */}
                <button
                  type="button" // 🔘 نوع الزر
                  onClick={() => setTargetStage(null)} // ⚡ تعيين كافة المراحل
                  className={`p-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border text-center ${
                    targetStage === null
                      ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                      : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  كافة المراحل (1-4)
                </button>
                {/* خيارات المراحل الفردية */}
                {[1, 2, 3, 4].map((stg) => (
                  <button
                    key={stg} // 🔑 مفتاح المرحلة
                    type="button" // 🔘 نوع الزر
                    onClick={() => setTargetStage(stg)} // ⚡ تحديد المرحلة
                    className={`p-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer border text-center ${
                      targetStage === stg
                        ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs'
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    المرحلة {stg === 1 ? 'الأولى' : stg === 2 ? 'الثانية' : stg === 3 ? 'الثالثة' : 'الرابعة'}
                  </button>
                ))}
              </div>
            </div>

            {/* 💡 ملاحظات وتفاصيل إضافية */}
            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">
                ملاحظات أو رقم الأمر الإداري (اختياري):
              </label>
              <textarea
                value={holidayNotes} // 📌 نص الملاحظات
                onChange={(e) => setHolidayNotes(e.target.value)} // ⚡ تحديث الملاحظات
                placeholder="أدخل أي ملاحظات إدارية أو إشارة لكتاب رئاسة الجامعة بالتعطيل..." // 💡 تلميح
                rows={2} // 📏 عدد الأسطر
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2942]/20"
              />
            </div>

            {/* 💡 بطاقة توضيح ذكية لكيفية عمل التعطيل المتزامن */}
            <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200 text-xs font-black text-sky-950 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-900 font-black">
                <AttendanceHolidaySvg className="w-4 h-4 text-sky-700" />
                <span>نظام المزامنة الأكاديمي الذكي:</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-black">
                عند تأكيد العطلة، سيتم تسجيل اليوم كـ (عطلة رسمية 🏖️) في جداول كافة الطلاب المشمولين تلقائياً، وستظهر في لوحة التدريسي لمنع تسجيل غياب بالخطأ، ولن تؤثر ساعات هذا اليوم على نسبة الغياب المحسوبة للحرمان إطلاقاً.
              </p>
            </div>

            {/* 🔘 أزرار الإجراءات للنموذج */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button" // 🔘 نوع الزر
                onClick={onClose} // ⚡ إغلاق
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-black transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit" // 🔘 نوع الزر إرسال
                disabled={isSubmitting} // 🔒 تعطيل أثناء التحميل
                className="px-6 py-2.5 bg-[#0F2942] hover:bg-[#163a5f] text-white rounded-xl text-sm font-black transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <DeclareHolidaySvg className="w-4 h-4 text-cyan-300" />
                <span>{isSubmitting ? 'جاري تثبيت العطلة...' : 'إعلان وتثبيت العطلة الرسمية'}</span>
              </button>
            </div>

          </form>

          {/* 📋 سجل العطلات الرسمية المعلنة سابقاً بالقسم */}
          {existingHolidays.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <AttendanceHolidaySvg className="w-4 h-4 text-[#0F2942]" />
                <span>العطلات الرسمية المعتمدة حالياً للقسم ({existingHolidays.length}):</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-sky-100 text-sky-950 border border-sky-300 rounded-md">
                          {h.date}
                        </span>
                        <span className="text-sm font-black text-slate-950">{h.title}</span>
                      </div>
                      <span className="text-[11px] font-black text-slate-500 block mt-0.5">
                        المشمول: {h.target_stage === null ? 'كافة المراحل' : `المرحلة ${h.target_stage}`} | المعلن: {h.created_by_name} ({h.created_by_role})
                      </span>
                    </div>

                    <button
                      type="button" // 🔘 نوع الزر
                      onClick={() => handleDeleteHoliday(h.id)} // ⚡ حذف
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-black transition cursor-pointer"
                      title="إلغاء هذه العطلة"
                    >
                      إلغاء
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DepartmentHolidayModal; // 🚀 تصدير المكون
