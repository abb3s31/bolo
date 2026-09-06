// 🔔 حالة استخدام إرسال إشعار أكاديمي (Send Notification UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { SendNotificationRequestDto, NotificationResponseDto } from './dtos/NotificationDtos';
import { INotificationRepository } from '@/core/domain/repositories/INotificationRepository';
import { Notification } from '@/core/domain/entities/Notification';

// 🧱 صنف حالة استخدام إرسال الإشعار
export class SendNotificationUseCase
  implements IUseCase<SendNotificationRequestDto, NotificationResponseDto>
{
  // 💉 حقن مستودع الإشعارات
  constructor(private readonly notificationRepository: INotificationRepository) {}

  // 🚀 تنفيذ إرسال الإشعار
  public async execute(
    request: SendNotificationRequestDto
  ): Promise<Result<NotificationResponseDto, string>> {
    try {
      // 🔍 التحقق من العنوان والنص
      if (!request.title || !request.message) {
        return Result.fail('عنوان ونص الإشعار مطلوبان ⚠️');
      }

      // 🧱 إنشاء كيان الإشعار
      const newNotification = new Notification({
        id: `notif-${Date.now()}`,
        title: request.title.trim(),
        message: request.message.trim(),
        type: request.type,
        targetRole: request.targetRole,
        targetDepartmentId: request.targetDepartmentId,
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      // 💾 حفظ الإشعار
      await this.notificationRepository.save(newNotification);

      // 🎯 إرجاع النتيجة
      return Result.ok({
        notification: newNotification,
        message: 'تم تعميم وإرسال الإشعار بنجاح',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إرسال الإشعار ❌';
      return Result.fail(errorMsg);
    }
  }
}
