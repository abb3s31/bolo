// 🔍 حالة استخدام جلب الطلاب (Get Students UseCase) - Clean Architecture & SOLID

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { GetStudentsQueryDto } from './dtos/StudentDtos';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { Student } from '@/core/domain/entities/Student';

// 🧱 صنف حالة استخدام جلب الطلاب
export class GetStudentsUseCase implements IUseCase<GetStudentsQueryDto, Student[]> {
  // 💉 حقن التبعية لمستودع الطلاب
  constructor(private readonly studentRepository: IStudentRepository) {}

  // 🚀 تنفيذ جلب الطلاب
  public async execute(query: GetStudentsQueryDto): Promise<Result<Student[], string>> {
    try {
      // 🔍 إذا تم تحديد القسم والمرحلة
      if (query.departmentId && query.stageNumber !== undefined) {
        const filtered = await this.studentRepository.getByDepartmentAndStage(
          query.departmentId,
          query.stageNumber
        );
        return Result.ok(filtered);
      }

      // 📥 جلب جميع الطلاب افتراضياً
      const allStudents = await this.studentRepository.getAll();
      return Result.ok(allStudents);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل جلب بيانات الطلاب ❌';
      return Result.fail(errorMsg);
    }
  }
}
