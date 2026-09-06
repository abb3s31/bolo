// 📜 واجهة مستودع التدريسيين (Teacher Repository Interface) - Dependency Inversion Principle

// 🔗 استيراد كيان الأستاذ وكائن الإيميل
import { Teacher } from '../entities/Teacher';
import { Email } from '../value-objects/Email';

// 🏛️ واجهة مستودع التدريسيين
export interface ITeacherRepository {
  // 📥 جلب جميع الأساتذة
  getAll(): Promise<Teacher[]>;

  // 🔍 جلب أستاذ بواسطة المعرف
  getById(id: string): Promise<Teacher | null>;

  // 📧 جلب أستاذ بواسطة البريد الرسمي
  getByEmail(email: Email): Promise<Teacher | null>;

  // 🏛️ جلب أساتذة قسم معين
  getByDepartment(departmentId: string): Promise<Teacher[]>;

  // 💾 حفظ أو تحديث بيانات أستاذ
  save(teacher: Teacher): Promise<void>;

  // 🗑️ حذف أستاذ
  delete(id: string): Promise<void>;
}
