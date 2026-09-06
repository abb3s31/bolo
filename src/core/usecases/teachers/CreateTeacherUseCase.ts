//  حالة استخدام إنشاء أستاذ جديد (Create Teacher UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج وكيانات النطاق
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { CreateTeacherRequestDto, TeacherResponseDto } from './dtos/TeacherDtos';
import { ITeacherRepository } from '@/core/domain/repositories/ITeacherRepository';
import { Teacher } from '@/core/domain/entities/Teacher';
import { Email } from '@/core/domain/value-objects/Email';

// 🧱 صنف حالة استخدام إنشاء الأستاذ
export class CreateTeacherUseCase
  implements IUseCase<CreateTeacherRequestDto, TeacherResponseDto>
{
  // 💉 حقن مستودع الأساتذة
  constructor(private readonly teacherRepository: ITeacherRepository) {}

  // 🚀 تنفيذ إنشاء الأستاذ
  public async execute(
    request: CreateTeacherRequestDto
  ): Promise<Result<TeacherResponseDto, string>> {
    try {
      // 🔍 فحص هل الاسم مدخل
      if (!request.fullName || request.fullName.trim().length === 0) {
        return Result.fail('اسم الأستاذ مطلوب ولا يمكن أن يكون فارغاً ⚠️');
      }

      // 📧 إنشاء كائن قيمة الإيميل
      const email = Email.create(request.email);

      // 🔍 التحقق من عدم تكرار البريد
      const existing = await this.teacherRepository.getByEmail(email);
      if (existing) {
        return Result.fail('البريد الإلكتروني مسجل مسبقاً لأستاذ آخر ⚠️');
      }

      // 🧱 بناء كيان الأستاذ النطاقي
      const newTeacher = new Teacher({
        id: `tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fullName: request.fullName.trim(),
        academicTitle: request.academicTitle || 'مدرس مساعد',
        specialization: request.specialization || 'علوم حاسوب',
        email,
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        assignedSubjectIds: request.assignedSubjectIds || [],
        isActive: true,
        phone: request.phone,
      });

      // 💾 حفظ الأستاذ
      await this.teacherRepository.save(newTeacher);

      // 🎯 إرجاع نتيجة النجاح
      return Result.ok({
        teacher: newTeacher,
        message: 'تم إضافة الأستاذ بنجاح إلى الكادر التدريسي',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إضافة الأستاذ ❌';
      return Result.fail(errorMsg);
    }
  }
}
