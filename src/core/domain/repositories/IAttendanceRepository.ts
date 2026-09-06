// 📜 واجهة مستودع الحضور والغياب (Attendance Repository Interface) - Clean Architecture

// 🔗 استيراد كيان الحضور
import { Attendance } from '../entities/Attendance';

// 🏛️ واجهة مستودع الحضور
export interface IAttendanceRepository {
  // 📥 جلب سجلات حضور مادة وتاريخ معين
  getByCourseAndDate(courseId: string, date: string): Promise<Attendance[]>;

  // 🎓 جلب سجلات حضور وغياب طالب لمادة معينة
  getByStudentAndCourse(studentId: string, courseId: string): Promise<Attendance[]>;

  // 💾 تسجيل حضور دفعة طلاب
  saveBatch(records: Attendance[]): Promise<void>;

  // 💾 حفظ أو تحديث سجل حضور فردي
  save(record: Attendance): Promise<void>;
}
