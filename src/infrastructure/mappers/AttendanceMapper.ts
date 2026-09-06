// 🔄 محول بيانات الحضور (Attendance Data Mapper) - Clean Architecture

// 🔗 استيراد الكيان والأنواع
import { Attendance, AttendanceStatus } from '@/core/domain/entities/Attendance';

// 🏛️ واجهة سجل الحضور المخزن
export interface StoredAttendanceRecord {
  id: string; // 🆔 معرف السجل
  student_id: string; // 🎓 معرف الطالب
  student_name: string; // 👤 اسم الطالب
  course_id: string; // 📚 معرف المادة
  teacher_id: string; //  معرف الأستاذ
  date: string; // 🗓️ التاريخ
  status: AttendanceStatus; // 🟢 الحالة
  notes?: string; // 📝 ملاحظات
  created_at: string; // ⏰ تاريخ الإنشاء
}

// 🧱 صنف محول بيانات الحضور
export class AttendanceMapper {
  // 📥 تحويل كائن التخزين إلى كيان النطاق
  public static toDomain(raw: StoredAttendanceRecord): Attendance {
    return new Attendance({
      id: raw.id,
      studentId: raw.student_id,
      studentName: raw.student_name || 'طالب',
      courseId: raw.course_id,
      teacherId: raw.teacher_id || 'teacher-default',
      date: raw.date,
      status: raw.status,
      notes: raw.notes,
      createdAt: raw.created_at || new Date().toISOString(),
    });
  }

  // 📤 تحويل كيان النطاق إلى كائن التخزين
  public static toPersistence(att: Attendance): StoredAttendanceRecord {
    return {
      id: att.id,
      student_id: att.studentId,
      student_name: att.studentName,
      course_id: att.courseId,
      teacher_id: att.teacherId,
      date: att.date,
      status: att.status,
      notes: att.notes,
      created_at: att.createdAt,
    };
  }
}
