// 🔲 نماذج نقل بيانات التحقق من البطاقة والوثيقة الأكاديمية (Verification DTOs) - Clean Architecture

// 🔗 استيراد الكيانات
import { Student } from '@/core/domain/entities/Student';

// 📥 نموذج طلب التحقق من البطاقة الأكاديمية عبر QR أو الرقم الجامعي
export interface VerifyAcademicCardRequestDto {
  readonly identifier: string; // 🔢 الرقم الجامعي أو المعرف أو البريد الأكاديمي
  readonly verificationSignature?: string; // 🔐 التوقيع الرقمي المشفر للبطاقة
}

// 📤 نموذج مخرجات التحقق
export interface VerifyAcademicCardResponseDto {
  readonly isValid: boolean; // 🟢 هل البطاقة رسمية وصالحة
  readonly student: Student | null; // 🎓 بيانات الطالب الأكاديمية
  readonly academicStatus: string; // 📜 الحالة الأكاديمية (مستمر بالدوام، خريج، مؤجل)
  readonly universityBranch: string; // 🏛️ الفرع الجامعي (جامعة الإمام جعفر الصادق - فرع ميسان)
  readonly verificationTimestamp: string; // ⏰ وقت التحقق المعتمد
  readonly message: string; // 💬 رسالة التوضيح
}
