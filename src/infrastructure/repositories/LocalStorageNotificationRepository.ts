// 💾 مستودع الإشعارات للتخزين المحلي (LocalStorage Notification Repository) - Clean Architecture

// 🔗 استيراد العقود والكيانات
import { INotificationRepository } from '@/core/domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '@/core/domain/entities/Notification';
import { AppNotification } from '@/types';

// 🏷️ مفتاح التخزين
const STORAGE_KEY = 'uomis_notifications_data_v2';

// 🧱 صنف مستودع الإشعارات
export class LocalStorageNotificationRepository implements INotificationRepository {
  // 📥 قراءة البيانات
  private getRawList(): AppNotification[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AppNotification[]) : [];
    } catch {
      return [];
    }
  }

  // 💾 حفظ البيانات
  private saveRawList(list: AppNotification[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('فشل حفظ الإشعارات', e);
      }
    }
  }

  // 📥 جلب الإشعارات الموجهة لفئة معينة
  public async getByTarget(
    role: 'students' | 'teachers' | 'admins' | 'all',
    departmentId?: string
  ): Promise<Notification[]> {
    const list = this.getRawList();
    const filtered = list.filter(n => {
      // مطابقة الدور
      const target = n.recipient_role;
      const roleMatch = !target || target === 'all' || target === (role === 'students' ? 'student' : role === 'teachers' ? 'teacher' : 'admin');
      return roleMatch;
    });

    return filtered.map(
      raw =>
        new Notification({
          id: raw.id,
          title: raw.title,
          message: raw.message,
          type: 'general',
          targetRole: role,
          targetDepartmentId: departmentId,
          createdAt: raw.created_at,
          isRead: raw.is_read,
        })
    );
  }

  // 💾 إرسال وحفظ إشعار جديد
  public async save(notification: Notification): Promise<void> {
    const list = this.getRawList();
    const rawNotif: AppNotification = {
      id: notification.id,
      recipient_id: 'all',
      recipient_role: 'all',
      title: notification.title,
      message: notification.message,
      type: 'official_announcement',
      is_read: notification.isRead,
      created_at: notification.createdAt,
    };
    list.unshift(rawNotif);
    this.saveRawList(list);
  }

  // 👁️ تعيين كإشعار مقروء
  public async markAsRead(id: string): Promise<void> {
    const list = this.getRawList();
    const index = list.findIndex(n => n.id === id);
    if (index >= 0) {
      list[index].is_read = true;
      this.saveRawList(list);
    }
  }
}
