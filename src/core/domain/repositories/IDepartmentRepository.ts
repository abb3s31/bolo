// 📜 واجهة مستودع الأقسام العلمية (Department Repository Interface) - Clean Architecture

// 🔗 استيراد كيان القسم
import { Department } from '../entities/Department';

// 🏛️ واجهة مستودع الأقسام العلمية
export interface IDepartmentRepository {
  // 📥 جلب جميع الأقسام
  getAll(): Promise<Department[]>;

  // 🔍 جلب قسم بواسطة المعرف
  getById(id: string): Promise<Department | null>;

  // 🔤 جلب قسم بواسطة الرمز (مثال: CITE)
  getByCode(code: string): Promise<Department | null>;

  // 💾 حفظ أو تحديث قسم
  save(department: Department): Promise<void>;

  // 🗑️ حذف قسم
  delete(id: string): Promise<void>;
}
