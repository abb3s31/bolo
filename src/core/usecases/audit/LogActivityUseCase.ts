// 📜 حالة استخدام تسجيل النشاطات والتدقيق (Log Activity UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { LogActivityRequestDto, LogActivityResponseDto } from './dtos/AuditDtos';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 🧱 صنف حالة استخدام تسجيل النشاط
export class LogActivityUseCase
  implements IUseCase<LogActivityRequestDto, LogActivityResponseDto>
{
  // 💉 حقن مستودع سجلات التدقيق
  constructor(private readonly auditRepository: IActivityLogRepository) {}

  // 🚀 تنفيذ تسجيل النشاط
  public async execute(
    request: LogActivityRequestDto
  ): Promise<Result<LogActivityResponseDto, string>> {
    try {
      // 🧱 إنشاء كيان سجل النشاط
      const newLog = new ActivityLog({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actorId: request.actorId,
        actorName: request.actorName,
        actorRole: request.actorRole,
        action: request.action,
        targetResource: request.targetResource,
        details: request.details,
        ipAddress: request.ipAddress,
        timestamp: new Date().toISOString(),
      });

      // 💾 حفظ السجل
      await this.auditRepository.log(newLog);

      // 🎯 إرجاع النتيجة
      return Result.ok({
        log: newLog,
        success: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تسجيل النشاط ❌';
      return Result.fail(errorMsg);
    }
  }
}
