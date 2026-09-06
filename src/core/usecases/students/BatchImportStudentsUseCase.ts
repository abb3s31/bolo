// 📥 حالة استخدام استيراد وتدقيق الطلاب دفعة واحدة (Batch Import Students UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { Student } from '@/core/domain/entities/Student';
import { UniversityNumber } from '@/core/domain/value-objects/UniversityNumber';
import { Email } from '@/core/domain/value-objects/Email';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج بيانات كل طالب ضمن قائمة الاستيراد
export interface BatchImportStudentItemDto {
  readonly fullName: string; // 👤 اسم الطالب
  readonly universityNumber: string; // 🔢 الرقم الجامعي
  readonly email: string; // 📧 البريد الإلكتروني
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly departmentName: string; // 🏛️ اسم القسم
  readonly stageNumber: number; // 🎓 رقم المرحلة
  readonly shiftType: 'morning' | 'evening'; // ☀️ نوع الدراسة
}

// 📥 نموذج طلب الاستيراد
export interface BatchImportStudentsRequestDto {
  readonly students: BatchImportStudentItemDto[]; // 📋 قائمة الطلاب
  readonly importedByUserId: string; // 👤 معرف المسؤول القائم بالاستيراد
  readonly importedByUserName: string; // 👤 اسم المسؤول
  readonly importedByUserRole: string; // 📜 دور المسؤول
}

// 📤 نموذج نتائج الاستيراد
export interface BatchImportStudentsResponseDto {
  readonly totalImported: number; // 🟢 عدد الطلاب المستوردين بنجاح
  readonly skippedCount: number; // ⚠️ عدد السجلات المتخطاة (مكررة أو غير صالحة)
  readonly validationErrors: string[]; // ❌ تفاصيل الأخطاء إن وجدت
  readonly message: string; // 💬 رسالة ملخصة
}

// 🧱 صنف حالة استخدام استيراد الطلاب
export class BatchImportStudentsUseCase
  implements IUseCase<BatchImportStudentsRequestDto, BatchImportStudentsResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ الاستيراد
  public async execute(
    request: BatchImportStudentsRequestDto
  ): Promise<Result<BatchImportStudentsResponseDto, string>> {
    try {
      if (!request.students || request.students.length === 0) {
        return Result.fail('قائمة الطلاب المراد استيرادها فارغة ⚠️');
      }

      const validStudentsToSave: Student[] = [];
      const errors: string[] = [];
      let skipped = 0;

      // 🔍 تدقيق كل سجل عبر كائنات القيمة وكيانات النطاق
      for (let i = 0; i < request.students.length; i++) {
        const row = request.students[i];
        const rowNum = i + 1;

        try {
          if (!row.fullName || row.fullName.trim().length < 3) {
            errors.push(`السطر ${rowNum}: اسم الطالب (${row.fullName || 'فارغ'}) غير صالح.`);
            skipped += 1;
            continue;
          }

          // 1. تدقيق الرقم الجامعي عبر Value Object
          const uniNumVO = UniversityNumber.create(row.universityNumber);

          // 2. تدقيق البريد الجامعي عبر Value Object
          const emailVO = Email.create(row.email);

          // 3. بناء كيان الطالب النقي
          const newStudent = new Student({
            id: `std-imp-${Date.now()}-${i}`,
            fullName: row.fullName.trim(),
            universityNumber: uniNumVO,
            email: emailVO,
            departmentId: row.departmentId,
            departmentName: row.departmentName,
            stageId: `stage-${row.departmentId}-${row.stageNumber}`,
            stageNumber: row.stageNumber,
            shiftType: row.shiftType,
            isActive: true,
            enrolledAt: new Date().toISOString(),
          });

          validStudentsToSave.push(newStudent);
        } catch (validationErr) {
          const msg = validationErr instanceof Error ? validationErr.message : 'بيانات غير صالحة';
          errors.push(`السطر ${rowNum} (${row.fullName || 'غير معروف'}): ${msg}`);
          skipped += 1;
        }
      }

      // 💾 حفظ كافة الطلاب الصالحين دفعة واحدة
      if (validStudentsToSave.length > 0) {
        await this.studentRepository.saveBatch(validStudentsToSave);

        // 📜 تسجيل العملية في سجل التدقيق
        const log = new ActivityLog({
          id: `act-imp-${Date.now()}`,
          actorId: request.importedByUserId,
          actorName: request.importedByUserName,
          actorRole: request.importedByUserRole,
          action: 'BATCH_IMPORT_STUDENTS',
          targetResource: `استيراد ${validStudentsToSave.length} طالب`,
          details: `تم استيراد ${validStudentsToSave.length} طالب بنجاح مع تخطي ${skipped} سجل.`,
          timestamp: new Date().toISOString(),
        });
        await this.auditRepository.log(log);
      }

      return Result.ok({
        totalImported: validStudentsToSave.length,
        skippedCount: skipped,
        validationErrors: errors,
        message: `تم استيراد وتدقيق (${validStudentsToSave.length}) طالب بنجاح مع تخطي (${skipped}) سجل 📥`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل الاستيراد الجماعي للطلاب ❌';
      return Result.fail(errorMsg);
    }
  }
}
