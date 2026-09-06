// 🔔 نماذج نقل بيانات الإشعارات الأكاديمية (Notification DTOs)

// 🔗 استيراد كيان ونوع الإشعار
import { Notification, NotificationType } from '@/core/domain/entities/Notification';

// 📥 نموذج إرسال إشعار جديد
export interface SendNotificationRequestDto {
  readonly title: string; // 📢 عنوان الإشعار
  readonly message: string; // 📝 نص الرسالة
  readonly type: NotificationType; // 🏷️ نوع الإشعار
  readonly targetRole: 'all' | 'students' | 'teachers' | 'admins'; // 🎯 الفئة
  readonly targetDepartmentId?: string; // 🏛️ القسم المستهدف
}

// 📤 نموذج استجابة إرسال الإشعار
export interface NotificationResponseDto {
  readonly notification: Notification; // 🔔 كيان الإشعار
  readonly message: string; // 💬 الرسالة
}
