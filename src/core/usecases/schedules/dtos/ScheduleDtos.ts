// 🗓️ نماذج نقل بيانات الجداول الأسبوعية (Schedule DTOs)

// 🔗 استيراد كيان الجدول
import { Schedule, WeekDay } from '@/core/domain/entities/Schedule';

// 📥 نموذج إضافة محاضرة في الجدول
export interface AddLectureToScheduleRequestDto {
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly teacherId: string; //  معرف الأستاذ
  readonly teacherName: string; // 👤 اسم الأستاذ
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly stageNumber: number; // 🎓 المرحلة
  readonly day: WeekDay; // 🗓️ اليوم
  readonly startTime: string; // ⏰ وقت البدء
  readonly endTime: string; // ⏰ وقت الانتهاء
  readonly roomHall: string; // 🏛️ القاعة
  readonly shiftType: 'morning' | 'evening'; // ☀️ نوع الدراسة
}

// 📤 نموذج استجابة المحاضرة
export interface ScheduleResponseDto {
  readonly schedule: Schedule; // 🗓️ كيان المحاضرة
  readonly message: string; // 💬 الرسالة
}
