// 📜 واجهة مستودع الطلاب (Student Repository Interface) - Dependency Inversion Principle

// 🔗 استيراد كيان الطالب وكائنات القيمة
import { Student } from '../entities/Student';
import { Email } from '../value-objects/Email';
import { UniversityNumber } from '../value-objects/UniversityNumber';

// 🏛️ واجهة مستودع الطلاب - عقد مجرد بدون أي تفاصيل لقاعدة البيانات
export interface IStudentRepository {
  // 📥 جلب جميع الطلاب
  getAll(): Promise<Student[]>;

  // 🔍 جلب طالب بواسطة المعرف الفريد
  getById(id: string): Promise<Student | null>;

  // 🔢 جلب طالب بواسطة الرقم الجامعي
  getByUniversityNumber(uniNum: UniversityNumber): Promise<Student | null>;

  // 📧 جلب طالب بواسطة البريد الإلكتروني
  getByEmail(email: Email): Promise<Student | null>;

  // 🏛️ جلب طلاب قسم معين ومرحلة محددة
  getByDepartmentAndStage(departmentId: string, stageNumber: number): Promise<Student[]>;

  // 💾 حفظ أو تحديث طالب
  save(student: Student): Promise<void>;

  // 💾 حفظ مجموعة طلاب دفعة واحدة
  saveBatch(students: Student[]): Promise<void>;

  // 🗑️ حذف طالب
  delete(id: string): Promise<void>;
}
