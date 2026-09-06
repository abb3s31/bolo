'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 📑 نافذة مراجعة واعتماد طلبات الإجازات والأعذار الرسمية (للأستاذ ورئيس القسم) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState } from 'react'; // 🔗 رياكت
import { AttendanceExcuseRequest, StudentAttendanceRecord } from '@/types'; // 🔗 الأنواع
import { FileText, CheckCircle2, XCircle, Clock, ShieldCheck, X, AlertCircle, Sparkles, MessageSquare } from 'lucide-react'; // 🎨 الأيقونات
import { sendAppNotification } from '@/lib/notification-utils'; // 🔔 مركز الإشعارات
import { saveExcuseRequestToSupabase } from '@/lib/supabase-client'; // ☁️ حفظ ومزامنة حالة العذر في Supabase

interface ExcuseRequestsReviewModalProps {
  isOpen: boolean; // 🚪 حالة الفتح
  onClose: () => void; // ❌ دالة الإغلاق
  requests: AttendanceExcuseRequest[]; // 📑 قائمة الطلبات
  reviewerId: string; // 👤 معرف المراجع
  reviewerName: string; // 👤 اسم المراجع
  reviewerRole: string; // 🎭 دور المراجع
  onUpdateRequest: (updated: AttendanceExcuseRequest) => void; // 💾 دالة تحديث حالة الطلب
  onUpdateAttendanceRecord?: (courseId: string, weekNumber: number, studentId: string, excuseReason: string, documentRef: string) => void; // 📋 دالة تحديث سجل الحضور المقابل
}

export default function ExcuseRequestsReviewModal({
  isOpen,
  onClose,
  requests,
  reviewerId,
  reviewerName,
  reviewerRole,
  onUpdateRequest,
  onUpdateAttendanceRecord,
}: ExcuseRequestsReviewModalProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  if (!isOpen) return null;

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || filteredRequests[0] || null;

  // 🟢 الموافقة على الطلب
  const handleApprove = (req: AttendanceExcuseRequest) => {
    const updated: AttendanceExcuseRequest = {
      ...req,
      status: 'approved',
      reviewed_by_id: reviewerId,
      reviewed_by_name: reviewerName,
      review_notes: reviewNotes.trim() || 'تمت الموافقة واعتماد الإجازة رسمياً.',
      reviewed_at: new Date().toISOString(),
    };

    onUpdateRequest(updated);
    saveExcuseRequestToSupabase(updated); // ☁️ حفظ ومزامنة قرار الموافقة في Supabase

    // تحديث سجل الحضور التلقائي إن وُجد
    if (onUpdateAttendanceRecord) {
      onUpdateAttendanceRecord(
        req.course_id,
        req.week_number,
        req.student_id,
        req.reason_details,
        req.document_reference
      );
    }

    // إرسال إشعار رسمي للطالب
    sendAppNotification({
      recipient_id: req.student_id,
      recipient_role: 'student',
      title: `✅ تمت الموافقة على طلب إجازتك الرسمية لمادة (${req.course_name})`,
      message: `تم اعتماد إجازتك للأسبوع (${req.week_number}) رسمياً من قبل (${reviewerName}) وتم تعديل موقف الغياب في سجلك الأكاديمي.`,
      type: 'system_announcement',
      link: '/student/dashboard',
    });

    setSuccessToast(`تمت الموافقة على إجازة الطالب (${req.student_name}) وتحديث السجل بنجاح! 🟢`);
    setReviewNotes('');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // 🔴 رفض الطلب
  const handleReject = (req: AttendanceExcuseRequest) => {
    const updated: AttendanceExcuseRequest = {
      ...req,
      status: 'rejected',
      reviewed_by_id: reviewerId,
      reviewed_by_name: reviewerName,
      review_notes: reviewNotes.trim() || 'تم رفض الطلب لعدم كفاية المسوغات أو الوثائق الرسمية.',
      reviewed_at: new Date().toISOString(),
    };

    onUpdateRequest(updated);
    saveExcuseRequestToSupabase(updated); // ☁️ حفظ ومزامنة قرار الرفض في Supabase

    // إرسال إشعار رسمي للطالب
    sendAppNotification({
      recipient_id: req.student_id,
      recipient_role: 'student',
      title: `❌ تم رفض طلب الإجازة لمادة (${req.course_name})`,
      message: `عزيزي الطالب، تم رفض طلب الإجازة للأسبوع (${req.week_number}). السبب: ${reviewNotes.trim() || 'الوثائق المرفقة غير كافية'}.`,
      type: 'system_announcement',
      link: '/student/dashboard',
    });

    setSuccessToast(`تم تسجيل قرار رفض الطلب وإشعار الطالب (${req.student_name}) بنجاح! 🔴`);
    setReviewNotes('');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* رأس النافذة الفاتح */}
        <div className="p-6 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-sm font-black rounded-xl">
                  اللجنة العلمية ورئاسة القسم
                </span>
                <span className="text-base font-black text-slate-700 font-mono">
                  إجمالي الطلبات ({requests.length})
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950">
                مراجعة وتدقيق طلبات الأعذار والإجازات الرسمية للطلبة
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200 rounded-2xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* شريط الإشعار النجاحي إن وُجد */}
        {successToast && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border-b border-emerald-300 font-black text-base flex items-center justify-between px-6 animate-in slide-in-from-top-1">
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast('')} className="text-emerald-800 font-black cursor-pointer text-lg">✕</button>
          </div>
        )}

        {/* شريط التصفية */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer flex items-center gap-2 ${ filterStatus === 'pending' ? 'bg-[#0F2942] text-white shadow-xs' : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300' }`}
            >
              <Clock className="w-4 h-4" />
              <span>قيد الانتظار ({requests.filter((r) => r.status === 'pending').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer flex items-center gap-2 ${ filterStatus === 'approved' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300' }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>المقبولة ({requests.filter((r) => r.status === 'approved').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer flex items-center gap-2 ${ filterStatus === 'rejected' ? 'bg-rose-700 text-white shadow-xs' : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300' }`}
            >
              <XCircle className="w-4 h-4" />
              <span>المرفوضة ({requests.filter((r) => r.status === 'rejected').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl text-base font-black transition cursor-pointer ${ filterStatus === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300' }`}
            >
              الكل ({requests.length})
            </button>
          </div>
        </div>

        {/* تقسيم الشاشة: قائمة الطلبات وتفاصيل الطلب المختار */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* الجانب الأيمن: قائمة الطلبات */}
          <div className="md:col-span-5 border-l border-slate-200 overflow-y-auto divide-y divide-slate-200 max-h-[60vh]">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className={`p-4 cursor-pointer transition ${
                  (selectedRequest?.id === req.id) ? 'bg-blue-50/80 border-r-4 border-[#0F2942]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-base text-slate-950">{req.student_name}</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                    req.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                      : req.status === 'rejected'
                      ? 'bg-rose-50 text-rose-950 border border-rose-300'
                      : 'bg-blue-50 text-blue-950 border border-blue-200'
                  }`}>
                    {req.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                    {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-blue-700" />}
                    <span>{req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد التدقيق'}</span>
                  </span>
                </div>

                <div className="text-base font-black text-slate-700 flex items-center justify-between">
                  <span>{req.course_name}</span>
                  <span className="text-sm font-black text-indigo-700">الأسبوع {req.week_number}</span>
                </div>

                <p className="text-sm font-black text-slate-700 line-clamp-1 mt-1">
                  {req.reason_details}
                </p>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="p-12 text-center text-slate-700 text-base font-black">
                لا توجد طلبات إجازة في هذا القسم حالياً.
              </div>
            )}
          </div>

          {/* الجانب الأيسر: بطاقة المعاينة والقرار */}
          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col justify-between space-y-4 max-h-[60vh]">
            {selectedRequest ? (
              <div className="space-y-4">
                
                {/* معلومات الطالب والمادة */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-slate-950">{selectedRequest.student_name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                    <div>المادة: <strong className="text-slate-950 font-black">{selectedRequest.course_name}</strong></div>
                    <div>المرحلة: <strong className="text-slate-950 font-black">
                      {selectedRequest.stage_number === 1 ? 'المرحلة الأولى' : selectedRequest.stage_number === 2 ? 'المرحلة الثانية' : selectedRequest.stage_number === 3 ? 'المرحلة الثالثة' : selectedRequest.stage_number === 4 ? 'المرحلة الرابعة' : `المرحلة ${selectedRequest.stage_number}`}
                    </strong></div>
                    <div>الأسبوع: <strong className="text-slate-950 font-black">الأسبوع {selectedRequest.week_number}</strong></div>
                    <div>تاريخ الغياب: <strong className="text-slate-950 font-mono font-black">{selectedRequest.date}</strong></div>
                  </div>
                </div>

                {/* نص العذر وتفاصيل التقرير */}
                <div className="space-y-3 text-base font-black">
                  <div>
                    <span className="font-black text-slate-900 block mb-1.5">تفاصيل وشرح العذر:</span>
                    <div className="p-4 bg-white border border-slate-300 rounded-2xl text-slate-800 leading-relaxed">
                      {selectedRequest.reason_details}
                    </div>
                  </div>

                  <div>
                    <span className="font-black text-slate-900 block mb-1.5">رقم وتاريخ الكتاب الرسمي / التقرير الطبي:</span>
                    <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl text-slate-800 font-mono flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                      <span>{selectedRequest.document_reference || 'لا يوجد مرجع كتابي'}</span>
                    </div>
                  </div>

                  {selectedRequest.reviewed_by_name && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950">
                      <span className="font-black block">قرار المراجعة السابق:</span>
                      <p className="mt-1 text-base">{selectedRequest.review_notes}</p>
                      <span className="text-sm font-black text-indigo-700 block mt-2">
                        بواسطة: {selectedRequest.reviewed_by_name} • {selectedRequest.reviewed_at ? new Date(selectedRequest.reviewed_at).toLocaleDateString('ar-IQ-u-nu-latn') : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* حقل كتابة ملاحظات القرار */}
                {selectedRequest.status === 'pending' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-base font-black text-slate-900">
                      ملاحظات أو مسوغات القرار (تظهر للطالب بالإشعار):
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="اكتب ملاحظة أو توجيه للقرار..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* أزرار القرار */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedRequest)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>الموافقة واعتماد الإجازة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(selectedRequest)}
                      className="py-3 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-base font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>رفض العذر</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center text-slate-700 text-base font-black my-auto">
                اختر طلباً من القائمة لعرض تفاصيله واتخاذ القرار الأكاديمي.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
