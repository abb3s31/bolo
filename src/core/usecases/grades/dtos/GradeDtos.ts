// 📊 نماذج نقل بيانات الدرجات والسعيات الأكاديمية (Grade DTOs)

// 🔗 استيراد كيان الدرجة
import { Grade } from '@/core/domain/entities/Grade';

// 📥 نموذج تسجيل وتحديث درجة طالب
export interface SubmitGradeRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly academicYear: string; // 🗓️ السنة الدراسية (مثال: 2026-2027)
  readonly midtermScore?: number; // 📝 درجة المد (من 30)
  readonly courseworkScore?: number; // 🧪 درجة النشاط والسعي اليومي (من 20)
  readonly finalExamScore?: number; // 🏆 درجة الامتحان النهائي (من 50)
}

// 📤 نموذج استجابة الدرجة
export interface SubmitGradeResponseDto {
  readonly grade: Grade; // 📊 كيان الدرجة
  readonly totalScore: number; // 💯 المجموع الكلي
  readonly letterRating: string; // 🎓 التقدير اللفظي (امتياز، جيد جداً...)
  readonly isPassed: boolean; // 🟢 هل ناجح
  readonly message: string; // 💬 الرسالة
}
