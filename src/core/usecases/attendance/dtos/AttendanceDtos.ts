// 📋 نماذج نقل بيانات تسجيل الحضور والغياب (Attendance DTOs)

// 🔗 استيراد نوع حالة الحضور
import { AttendanceStatus } from '@/core/domain/entities/Attendance';

// 📥 عنصر حضور طالب فردي في القائمة
export interface StudentAttendanceItemDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly status: AttendanceStatus; // 🟢 الحالة (حاضر، غائب، مجاز...)
  readonly notes?: string; // 📝 ملاحظة أو عذر
}

// 📥 نموذج طلب تسجيل حضور محاضرة
export interface RecordLectureAttendanceRequestDto {
  readonly courseId: string; // 📚 معرف المادة
  readonly teacherId: string; //  معرف الأستاذ
  readonly date: string; // 🗓️ تاريخ المحاضرة (YYYY-MM-DD)
  readonly attendanceList: StudentAttendanceItemDto[]; // 📋 قائمة الطلاب وحالاتهم
}

// 📤 نموذج استجابة تسجيل الحضور
export interface RecordAttendanceResponseDto {
  readonly recordedCount: number; // 🔢 عدد السجلات المحفوظة
  readonly message: string; // 💬 رسالة التوضيح
}
