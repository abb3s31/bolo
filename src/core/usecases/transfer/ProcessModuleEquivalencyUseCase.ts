// ⚖️ حالة استخدام معالجة المقاصة العلمية للمقررات (Process Module Equivalency UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { ModuleEquivalency } from '@/core/domain/entities/ModuleEquivalency';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { ICourseRepository } from '@/core/domain/repositories/ICourseRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب معالجة المقاصة العلمية
export interface ProcessModuleEquivalencyRequestDto {
  readonly studentId: string; // 🎓 معرف الطالب المنقول
  readonly previousUniversityName: string; // 🏛️ الجامعة السابقة
  readonly externalCourseName: string; // 📚 اسم المادة في الجامعة السابقة
  readonly externalCourseGrade: number; // 📊 درجة المادة في الجامعة السابقة
  readonly externalCredits: number; // ⏳ ساعات المادة السابقة
  readonly targetCourseId: string; // 📚 معرف المادة المحلية في جامعتنا
  readonly syllabusMatchPercentage: number; // 🎯 نسبة تطابق المفردات (0 - 100)
  readonly committeeHeadName: string; //  اسم رئيس اللجنة العلمية
  readonly notes?: string; // 💬 ملاحظات المحضر
}

// 📤 نموذج استجابة المقاصة العلمية
export interface ProcessModuleEquivalencyResponseDto {
  readonly equivalency: ModuleEquivalency; // 📜 كيان المقاصة الناتج
  readonly isExempted: boolean; // 🟢 هل تمت معادلة وإعفاء المادة بنجاح
  readonly message: string; // 💬 الرسالة
}

// 🧱 صنف حالة استخدام المقاصة العلمية
export class ProcessModuleEquivalencyUseCase
  implements IUseCase<ProcessModuleEquivalencyRequestDto, ProcessModuleEquivalencyResponseDto>
{
  // 💉 حقن المستودعات
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ معالجة المقاصة
  public async execute(
    request: ProcessModuleEquivalencyRequestDto
  ): Promise<Result<ProcessModuleEquivalencyResponseDto, string>> {
    try {
      // 🔍 1. جلب بيانات الطالب المنقول
      const student = await this.studentRepository.getById(request.studentId);
      if (!student) {
        return Result.fail('سجل الطالب غير موجود في المنظومة ❌');
      }

      // 🔍 2. جلب بيانات المادة المحلية المقابلة
      const targetCourse = await this.courseRepository.getById(request.targetCourseId);
      if (!targetCourse) {
        return Result.fail('المادة الدراسية المحلية غير موجودة في الخطة ❌');
      }

      // 🧱 3. بناء كيان المقاصة وتطبيق القواعد النطاقية
      const equivalency = new ModuleEquivalency({
        id: `eqv-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.fullName,
        previousUniversityName: request.previousUniversityName,
        externalCourseName: request.externalCourseName,
        externalCourseGrade: request.externalCourseGrade,
        externalCredits: request.externalCredits,
        targetCourseId: targetCourse.id,
        targetCourseName: targetCourse.name,
        targetCourseCredits: targetCourse.creditHours,
        syllabusMatchPercentage: request.syllabusMatchPercentage,
        status: 'approved_exempt',
        approvedBy: request.committeeHeadName,
        committeeNotes: request.notes,
        evaluatedAt: new Date().toISOString(),
      });

      // 📜 4. توثيق العملية في سجل التدقيق الأمني
      const log = new ActivityLog({
        id: `act-eqv-${Date.now()}`,
        actorId: request.committeeHeadName,
        actorName: request.committeeHeadName,
        actorRole: 'scientific_committee',
        action: equivalency.isExempted ? 'APPROVE_EQUIVALENCY' : 'REJECT_EQUIVALENCY',
        targetResource: `${student.fullName} - ${targetCourse.name}`,
        details: `تم ${equivalency.isExempted ? 'معادلة وإعفاء' : 'رفض معادلة'} مادة (${request.externalCourseName}) المنقولة من (${request.previousUniversityName}) بمادة (${targetCourse.name}) بنسبة تطابق (${request.syllabusMatchPercentage}%).`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      let msg = '';
      if (equivalency.isExempted) {
        msg = `تمت معادلة وإعفاء مادة (${targetCourse.name}) للطالب (${student.fullName}) بنجاح لاكتمال شروط المفردات (تطابق ${request.syllabusMatchPercentage}%) والدرجة ⚖️`;
      } else if (equivalency.status === 'rejected_low_grade') {
        msg = `تعذر معادلة المادة لأن الدرجة السابقة (${request.externalCourseGrade}) أقل من درجة النجاح المطلوبة (50) ⚠️`;
      } else {
        msg = `تعذر معادلة المادة لأن نسبة تطابق المفردات (${request.syllabusMatchPercentage}%) أقل من الحد القانوني المعتمد (75%) ⚠️`;
      }

      return Result.ok({
        equivalency,
        isExempted: equivalency.isExempted,
        message: msg,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إجراء المقاصة العلمية ❌';
      return Result.fail(errorMsg);
    }
  }
}
