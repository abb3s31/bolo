// 📜 واجهة مستودع الإشعارات (Notification Repository Interface) - Clean Architecture

// 🔗 استيراد كيان الإشعار
import { Notification } from '../entities/Notification';

// 🏛️ واجهة مستودع الإشعارات
export interface INotificationRepository {
  // 📥 جلب جميع الإشعارات الموجهة لدور أو قسم معين
  getByTarget(role: 'students' | 'teachers' | 'admins' | 'all', departmentId?: string): Promise<Notification[]>;

  // 💾 إرسال وحفظ إشعار جديد
  save(notification: Notification): Promise<void>;

  // 👁️ تحديد إشعار كمقروء
  markAsRead(id: string): Promise<void>;
}
