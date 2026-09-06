// 🔲 حالة استخدام التحقق من البطاقة الأكاديمية (Verify Academic Card UseCase) - SOLID Single Responsibility

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import {
  VerifyAcademicCardRequestDto,
  VerifyAcademicCardResponseDto,
} from './dtos/VerificationDtos';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';
import { Email } from '@/core/domain/value-objects/Email';

// 🧱 صنف حالة استخدام التحقق من البطاقة
export class VerifyAcademicCardUseCase
  implements IUseCase<VerifyAcademicCardRequestDto, VerifyAcademicCardResponseDto>
{
  // 💉 حقن مستودع الطلاب
  constructor(private readonly studentRepository: IStudentRepository) {}

  // 🚀 تنفيذ التحقق
  public async execute(
    request: VerifyAcademicCardRequestDto
  ): Promise<Result<VerifyAcademicCardResponseDto, string>> {
    try {
      const cleanId = request.identifier.trim();

      if (!cleanId) {
        return Result.fail('معرف أو رقم الطالب مطلوب لإجراء التحقق ⚠️');
      }

      // 🔍 1. محاولة البحث بالمعرف المباشر (ID)
      let foundStudent = await this.studentRepository.getById(cleanId);

      // 🔍 2. محاولة البحث بالرقم الجامعي إذا لم نجد بالـ ID
      if (!foundStudent) {
        try {
          const uniNumVO = UniversityNumber.create(cleanId);
          foundStudent = await this.studentRepository.getByUniversityNumber(uniNumVO);
        } catch {
          // ليس رقماً جامعياً صالحاً
        }
      }

      // 🔍 3. محاولة البحث بالبريد الإلكتروني إذا لم نجد
      if (!foundStudent) {
        try {
          const emailVO = Email.create(cleanId);
          foundStudent = await this.studentRepository.getByEmail(emailVO);
        } catch {
          // ليس بريداً إلكترونياً
        }
      }

      // ❌ في حال لم يتم العثور على الطالب
      if (!foundStudent) {
        return Result.ok({
          isValid: false,
          student: null,
          academicStatus: 'غير مسجل',
          universityBranch: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان',
          verificationTimestamp: new Date().toISOString(),
          message: 'هذه البطاقة أو الوثيقة غير مسجلة في سجلات الجامعة الرسمية ❌',
        });
      }

      // 🟢 فحص حالة تفعيل الحساب
      const statusText = foundStudent.isActive ? 'طالب مستمر بالدراسة (نشط)' : 'قيد التدقيق / مؤجل';

      // 🎯 إرجاع نتيجة التحقق الناجحة
      return Result.ok({
        isValid: true,
        student: foundStudent,
        academicStatus: statusText,
        universityBranch: 'جامعة الإمام جعفر الصادق (ع) - فرع ميسان',
        verificationTimestamp: new Date().toISOString(),
        message: 'تم التحقق من صحة البطاقة الأكاديمية بنجاح، السجل رسمي ومعتمد',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل التحقق من البطاقة الأكاديمية ❌';
      return Result.fail(errorMsg);
    }
  }
}
