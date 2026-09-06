// 📜 واجهة مستودع الدرجات والسعي الأكاديمي (Grade Repository Interface) - Clean Architecture

// 🔗 استيراد كيان الدرجة
import { Grade } from '../entities/Grade';

// 🏛️ واجهة مستودع الدرجات
export interface IGradeRepository {
  // 🔍 جلب سجل درجة طالب في مادة معينة وسنة دراسية
  getByStudentAndCourse(studentId: string, courseId: string, academicYear: string): Promise<Grade | null>;

  // 🎓 جلب جميع درجات وسعيات طالب لسنة معينة
  getAllByStudent(studentId: string, academicYear?: string): Promise<Grade[]>;

  // 📚 جلب درجات جميع طلاب مادة معينة
  getAllByCourse(courseId: string, academicYear: string): Promise<Grade[]>;

  // 💾 حفظ أو تحديث سجل درجات
  save(grade: Grade): Promise<void>;

  // 💾 حفظ مجموعة درجات دفعة واحدة (Bulk Save)
  saveBatch(grades: Grade[]): Promise<void>;
}
