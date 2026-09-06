// 📜 واجهة مستودع المواد الدراسية (Course Repository Interface) - Clean Architecture

// 🔗 استيراد كيان المادة
import { Course } from '../entities/Course';

// 🏛️ واجهة مستودع المواد الدراسية
export interface ICourseRepository {
  // 📥 جلب جميع المواد
  getAll(): Promise<Course[]>;

  // 🔍 جلب مادة بواسطة المعرف
  getById(id: string): Promise<Course | null>;

  // 🏛️ جلب مواد قسم ومرحلة وفصل دراسي
  getByDepartmentAndStage(departmentId: string, stageNumber: number, semester?: 1 | 2): Promise<Course[]>;

  // 💾 حفظ أو تحديث مادة
  save(course: Course): Promise<void>;

  // 🗑️ حذف مادة
  delete(id: string): Promise<void>;
}
