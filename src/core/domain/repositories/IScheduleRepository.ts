// 📜 واجهة مستودع الجداول الأسبوعية (Schedule Repository Interface) - Clean Architecture

// 🔗 استيراد كيان الجدول
import { Schedule } from '../entities/Schedule';

// 🏛️ واجهة مستودع الجداول الأسبوعية
export interface IScheduleRepository {
  // 📥 جلب جميع المحاضرات في الجدول
  getAll(): Promise<Schedule[]>;

  // 🏛️ جلب جدول قسم ومرحلة ونوع دراسة
  getByDepartmentAndStage(
    departmentId: string,
    stageNumber: number,
    shiftType: 'morning' | 'evening'
  ): Promise<Schedule[]>;

  //  جلب جدول محاضرات أستاذ معين
  getByTeacher(teacherId: string): Promise<Schedule[]>;

  // 💾 حفظ أو تحديث محاضرة
  save(schedule: Schedule): Promise<void>;

  // 🗑️ حذف محاضرة من الجدول
  delete(id: string): Promise<void>;
}
