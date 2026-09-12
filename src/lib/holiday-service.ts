// 🏖️ خدمة إدارة العطل الرسمية وتعطيل الدوام الأكاديمي لمسار بولونيا - مبادئ Clean Architecture & SOLID
import { // 🏷️ استيراد الأنواع الصريحة
  DepartmentOfficialHoliday, // 🏖️ واجهة العطلة الرسمية
  StudentAttendanceRecord, // 📋 واجهة سجل حضور الطالب
  UserProfile, // 👤 نوع بروفايل المستخدم
  Course, // 📚 نوع المادة الدراسية
  DayOfWeek, // 📅 أيام الأسبوع
  AttendanceStatus, // 🚦 حالات الحضور
  LectureType, // 🏷️ نوع المحاضرة الصريح (نظري / عملي / مناقشة)
} from '@/types'; // 🔗 الاستيراد من ملف الأنواع المركزي
import { getStoredData, saveStoredData } from './mock-data'; // 💾 دوال التخزين المحلي الآمن
import { saveMultipleAttendanceRecordsToSupabase } from './supabase-client'; // ☁️ المزامنة مع سوبابيس

// 🔑 مفتاح التخزين الموحد للعطل الرسمية للقسم
const HOLIDAY_STORAGE_KEY_PREFIX = 'dept_official_holidays_'; // 🏷️ بادئة المفتاح

// 📋 واجهة تفاصيل يوم المحاضرة للطالب لكشف الأيام المفصل
export interface StudentDayDetailItem {
  id: string; // 🆔 معرف السجل
  date: string; // 📆 التاريخ الفعلي
  day: DayOfWeek; // 📅 اسم اليوم
  course_id: string; // 📘 معرف المادة
  course_name: string; // 📝 اسم المادة
  course_code: string; // 🏷️ رمز المادة
  lecture_type: LectureType; // 🏷️ نوع المحاضرة الصريح
  start_time: string; // ⏰ ساعة البدء
  end_time: string; // ⏰ ساعة الانتهاء
  duration_hours: number; // ⏳ مدة المحاضرة بالساعات
  status: AttendanceStatus; // 🚦 حالة الطالب في هذا اليوم
  excuse_reason?: string; // 📝 سبب الإجازة إن وجد
  excuse_document_ref?: string; // 📄 رقم كتاب الإجازة أو التقرير الطبي
  holiday_title?: string; // 🏖️ اسم ومناسبة العطلة الرسمية
  recorded_by_teacher_name?: string; // 👤 اسم الأستاذ الذي سجل الحضور
  notes?: string; // 💡 الملاحظات
}

// 📥 جلب كافة العطل الرسمية المسجلة للقسم
export function getDepartmentOfficialHolidays(departmentId: string): DepartmentOfficialHoliday[] {
  const key = `${HOLIDAY_STORAGE_KEY_PREFIX}${departmentId || 'default'}`; // 🔑 تكوين المفتاح
  return getStoredData<DepartmentOfficialHoliday[]>(key, []); // 📦 جلب البيانات المحفوظة
}

// 💾 حفظ عطلة رسمية جديدة للقسم وتعميمها
export function saveDepartmentOfficialHoliday(holiday: DepartmentOfficialHoliday): void {
  const key = `${HOLIDAY_STORAGE_KEY_PREFIX}${holiday.department_id || 'default'}`; // 🔑 مفتاح القسم
  const current = getDepartmentOfficialHolidays(holiday.department_id); // 📋 جلب العطل الحالية
  const updated = [holiday, ...current.filter((h) => h.id !== holiday.id)]; // ➕ دمج العطلة الجديدة
  saveStoredData(key, updated); // 💾 تخزين القائمة المحدثة

  if (typeof window !== 'undefined') { // 🌐 التحقق من بيئة المتصفح
    window.dispatchEvent(new CustomEvent('department_holiday_declared', { detail: holiday })); // 📢 بث حدث العطلة للمكونات
    window.dispatchEvent(new Event('storage')); // 🔄 إشعار التخزين المتبادل
  }
}

// 🗑️ حذف أو إلغاء عطلة رسمية
export function deleteDepartmentOfficialHoliday(holidayId: string, departmentId: string): void {
  const key = `${HOLIDAY_STORAGE_KEY_PREFIX}${departmentId || 'default'}`; // 🔑 مفتاح القسم
  const current = getDepartmentOfficialHolidays(departmentId); // 📋 جلب القائمة
  const updated = current.filter((h) => h.id !== holidayId); // ✂️ تصفية العطلة المحذوفة
  saveStoredData(key, updated); // 💾 حفظ التحديث

  if (typeof window !== 'undefined') { // 🌐 فحص المتصفح
    window.dispatchEvent(new CustomEvent('department_holiday_deleted', { detail: { holidayId, departmentId } })); // 📢 بث حدث الحذف
    window.dispatchEvent(new Event('storage')); // 🔄 تحديث التخزين
  }
}

// 🔍 فحص ما إذا كان يوم محدد عطلة رسمية معتمدة للقسم ولمرحلة معينة
export function isDateOfficialHoliday(
  date: string, // 📅 التاريخ المراد فحصه YYYY-MM-DD
  departmentId?: string, // 🏢 معرف القسم (اختياري للعمومية)
  stageNumber?: number // 🎓 رقم المرحلة اختياري
): DepartmentOfficialHoliday | null {
  const holidays = getDepartmentOfficialHolidays(departmentId || ''); // 📋 جلب عطل القسم بأمان
  const found = holidays.find((h) => { // 🔍 البحث عن تطابق التاريخ
    if (h.date !== date) return false; // 🚫 إذا التاريخ مختلف
    if (stageNumber && h.target_stage !== null && h.target_stage !== stageNumber) return false; // 🚫 إذا المرحلة غير مشمولة
    return true; // ✅ يوم عطلة رسمي مطابق
  });
  return found || null; // 🎯 إرجاع العطلة أو null
}

// ⚡ تطبيق العطلة الرسمية بذكاء على سجلات الحضور لكافة طلبة القسم المشمولين
export async function applyHolidayToAttendanceRecords(params: {
  holiday: DepartmentOfficialHoliday; // 🏖️ بيانات العطلة المعلنة
  existingRecords: StudentAttendanceRecord[]; // 📋 السجلات الحالية في النظام
  deptStudents: UserProfile[]; // 🎓 طلبة القسم
  deptCourses: Course[]; // 📚 مواد القسم
}): Promise<StudentAttendanceRecord[]> {
  const { holiday, existingRecords, deptStudents, deptCourses } = params; // 📦 تفكيك المعاملات
  const targetDate = holiday.date; // 📅 تاريخ العطلة المستهدف
  const stageFilter = holiday.target_stage; // 🎓 المرحلة المستهدفة (null تعني الكل)

  // 🎯 تصفية الطلبة المشمولين بالعطلة
  const targetStudents = deptStudents.filter((st) => {
    if (stageFilter !== null && (st.stage_number || 1) !== stageFilter) return false; // 🚫 استبعاد غير المشمولين
    return true; // ✅ طالب مشمول بالعطلة
  });

  // 🔄 إنشاء خريطة السجلات المحدثة
  const updatedRecordsMap = new Map<string, StudentAttendanceRecord>(); // 🗺️ خريطة فريدة بالمعرف

  // 1️⃣ أولاً: وضع السجلات الموجودة مسبقاً في الخريطة وتحديث ما يطابق تاريخ العطلة
  existingRecords.forEach((rec) => {
    if (rec.date === targetDate) { // 🔍 فحص هل السجل في يوم العطلة
      const isStudentTargeted = targetStudents.some((s) => s.id === rec.student_id || s.university_number === rec.student_id); // 👤 هل الطالب مشمول
      if (isStudentTargeted) { // 🎯 نعم مشمول
        const updatedRec: StudentAttendanceRecord = { // 🔄 تحديث السجل إلى عطلة رسمية
          ...rec, // 📋 البيانات السابقة
          status: 'holiday', // 🏖️ تثبيت الحالة كعطلة رسمية
          duration_hours: rec.duration_hours || 1.5, // ⏳ احتفاظ بالمدة أو 1.5 س الافتراضية
          notes: `عطلة رسمية معتمدة: ${holiday.title}`, // 📝 توثيق سبب العطلة
          updated_at: new Date().toISOString(), // ⏰ وقت التحديث
        };
        updatedRecordsMap.set(updatedRec.id, updatedRec); // 💾 وضع في الخريطة
        return; // ⏩ الانتقال للتالي
      }
    }
    updatedRecordsMap.set(rec.id, rec); // 💾 السجلات الأخرى تبقى كما هي
  });

  // 2️⃣ ثانياً: التأكد من إنشاء سجل عطلة لكل طالب مشمول لمواده المسجلة إذا لم تكن مسجلة مسبقاً في هذا اليوم
  targetStudents.forEach((st) => {
    const studentStage = st.stage_number || 1; // 🎓 مرحلة الطالب
    const studentCourses = deptCourses.filter((c) => (c.stage_number || 1) === studentStage); // 📚 مواد مرحلة الطالب

    studentCourses.forEach((c) => {
      // 🔍 فحص هل يوجد سجل مسجل لهذا الطالب في هذا اليوم لهذه المادة
      const hasRecord = Array.from(updatedRecordsMap.values()).some(
        (r) => (r.student_id === st.id || r.university_number === st.id) && r.course_id === c.id && r.date === targetDate
      );

      if (!hasRecord) { // ➕ إذا لم يسجل الأستاذ بعد، ننشئ له سجل عطلة رسمي مثبت
        const newRecordId = `hol_${holiday.id}_${st.id}_${c.id}`; // 🆔 معرف فريد ومستقر
        const newHolidayRec: StudentAttendanceRecord = {
          id: newRecordId, // 🆔 المعرف
          student_id: st.id, // 🎓 معرف الطالب
          student_name: st.full_name, // 👤 اسم الطالب
          university_number: st.university_number || '', // 🔢 الرقم الجامعي
          course_id: c.id, // 📘 معرف المادة
          course_name: c.name, // 📝 اسم المادة
          course_code: c.code, // 🏷️ رمز المادة
          department_id: holiday.department_id, // 🏢 القسم
          stage_number: studentStage, // 🎓 المرحلة
          student_group: st.student_group || undefined, // 🏷️ الكروب
          semester: (c.semester || 1) as 1 | 2, // 🗓️ الكورس
          academic_year_id: '2026-2027', // 📅 العام الدراسي
          week_number: 1, // 🔢 رقم الأسبوع التقديري
          lecture_type: 'theory', // 🏷️ نوع المحاضرة
          day: 'الخميس' as DayOfWeek, // 📅 اليوم
          date: targetDate, // 📆 التاريخ الفعلي للعطلة
          start_time: '08:30', // ⏰ وقت البدء
          end_time: '10:00', // ⏰ وقت الانتهاء
          duration_hours: 1.5, // ⏳ مدة المحاضرة بالساعات
          status: 'holiday', // 🏖️ عطلة رسمية
          recorded_by_teacher_id: 'dept_head_auto', // 🏢 تسجيل آلي برئاسة القسم
          recorded_by_teacher_name: holiday.created_by_name || 'رئاسة القسم', // 👤 اسم المسؤول
          notes: `عطلة رسمية معتمدة: ${holiday.title}`, // 📝 الملاحظات
          created_at: new Date().toISOString(), // ⏰ وقت الإنشاء
          updated_at: new Date().toISOString(), // ⏰ وقت التعديل
        };
        updatedRecordsMap.set(newRecordId, newHolidayRec); // 💾 إضافتها للخريطة
      }
    });
  });

  const finalRecords = Array.from(updatedRecordsMap.values()); // 📋 تحويل الخريطة إلى مصفوفة
  saveStoredData('student_attendance_records', finalRecords); // 💾 الحفظ في التخزين المحلي

  try { // ☁️ المزامنة مع سوبابيس
    await saveMultipleAttendanceRecordsToSupabase(finalRecords); // 🚀 حفظ جماعي بالسحابة
  } catch {
    // 💡 صامت لضمان استمرار العمل دون انقطاع بالإنترنت
  }

  return finalRecords; // 🎯 إرجاع السجلات المحدثة
}

// 🧮 استخراج كشف الأيام التفصيلي للطالب (كافة الأيام، الحاضر، الغائب، المجاز، العطلة)
export function getStudentDaysBreakdown(
  studentId: string, // 🎓 معرف الطالب
  records: StudentAttendanceRecord[] // 📋 كافة السجلات
): StudentDayDetailItem[] {
  // 🔍 تصفية سجلات هذا الطالب فقط
  const studentRecords = records.filter(
    (r) => r.student_id === studentId || r.university_number === studentId
  );

  // 🔄 تحويل السجلات إلى تفاصيل منسقة ومرتبة زمنياً من الأحدث إلى الأقدم
  return studentRecords
    .map((r): StudentDayDetailItem => ({
      id: r.id, // 🆔 معرف السجل
      date: r.date || 'غير محدد', // 📆 التاريخ
      day: r.day || 'السبت', // 📅 اليوم
      course_id: r.course_id, // 📘 معرف المادة
      course_name: r.course_name, // 📝 اسم المادة
      course_code: r.course_code, // 🏷️ رمز المادة
      lecture_type: r.lecture_type || 'theory', // 🏷️ نوع المحاضرة
      start_time: r.start_time || '08:30', // ⏰ وقت البدء
      end_time: r.end_time || '10:00', // ⏰ وقت الانتهاء
      duration_hours: r.duration_hours || 1.5, // ⏳ مدة الساعات
      status: r.status, // 🚦 حالة الحضور
      excuse_reason: r.excuse_reason, // 📝 سبب الإجازة
      excuse_document_ref: r.excuse_document_ref, // 📄 وثيقة الإجازة
      holiday_title: r.status === 'holiday' ? (r.notes?.replace('عطلة رسمية معتمدة: ', '') || 'عطلة رسمية') : undefined, // 🏖️ اسم العطلة
      recorded_by_teacher_name: r.recorded_by_teacher_name, // 👤 الأستاذ المسجل
      notes: r.notes, // 💡 الملاحظات
    }))
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)); // ⏳ ترتيب زمني تنازلي أنيق
}
