// 🎓 حالة استخدام إنشاء طالب جديد (Create Student UseCase) - SOLID Single Responsibility

// 📜 استيراد العقود والنماذج وكيانات النطاق
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { CreateStudentRequestDto, StudentResponseDto } from './dtos/StudentDtos';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { Student } from '@/core/domain/entities/Student';
import { Email } from '@/core/domain/value-objects/Email';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';

// 🧱 صنف حالة استخدام إنشاء الطالب
export class CreateStudentUseCase
  implements IUseCase<CreateStudentRequestDto, StudentResponseDto>
{
  // 💉 حقن مستودع الطلاب (Dependency Inversion)
  constructor(private readonly studentRepository: IStudentRepository) {}

  // 🚀 تنفيذ إنشاء الطالب
  public async execute(
    request: CreateStudentRequestDto
  ): Promise<Result<StudentResponseDto, string>> {
    try {
      // 🔍 فحص هل الاسم مدخل
      if (!request.fullName || request.fullName.trim().length === 0) {
        return Result.fail('اسم الطالب مطلوب ولا يمكن أن يكون فارغاً ⚠️');
      }

      // 🔢 توليد أو فحص الرقم الجامعي
      const uniNumStr =
        request.universityNumber || `2026${Math.floor(1000 + Math.random() * 9000)}`;
      const universityNumber = UniversityNumber.create(uniNumStr);

      // 🔍 التحقق من عدم تكرار الرقم الجامعي
      const existingStudent = await this.studentRepository.getByUniversityNumber(universityNumber);
      if (existingStudent) {
        return Result.fail(`الرقم الجامعي (${uniNumStr}) مسجل مسبقاً لطالب آخر ⚠️`);
      }

      // 📧 توليد أو اعتماد البريد الأكاديمي المدخل
      const sanitizedName = request.fullName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '.');
      const emailStr = request.email?.trim() || `st.${sanitizedName}.${uniNumStr.slice(-4)}@sadiq.edu.iq`;
      const email = Email.create(emailStr);

      // 🛡️ فحص عدم تكرار البريد الأكاديمي نهائياً لمنع التكرار
      const existingStudentWithEmail = await this.studentRepository.getByEmail(email);
      if (existingStudentWithEmail) {
        return Result.fail(`البريد الإلكتروني (${emailStr}) مسجل مسبقاً في قاعدة البيانات لطالب آخر. يرجى إدخال بريد آخر.`);
      }

      // 🧱 بناء كيان الطالب النطاقي
      const newStudent = new Student({
        id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fullName: request.fullName.trim(),
        universityNumber,
        email,
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        stageId: request.stageId || `stage-${request.departmentId}-${request.stageNumber}`,
        stageNumber: request.stageNumber,
        shiftType: request.shiftType || 'morning',
        isActive: true,
        enrolledAt: new Date().toISOString(),
      });

      // 💾 حفظ الطالب في المستودع
      await this.studentRepository.save(newStudent);

      // 🎯 إرجاع نتيجة النجاح
      return Result.ok({
        student: newStudent,
        message: 'تم إنشاء وتسجيل الطالب بنجاح في المنظومة',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء إنشاء الطالب ❌';
      return Result.fail(errorMsg);
    }
  }
}
