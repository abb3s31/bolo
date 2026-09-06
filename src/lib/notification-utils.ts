'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🔔 مكتبة إدارة مركز الإشعارات التفاعلي الحي - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { AppNotification, NotificationType, UserRole } from '@/types'; // 🔗 واجهات الأنواع
import { getStoredData, saveStoredData } from './mock-data'; // 💾 دوال التخزين
import { 
  saveNotificationToSupabase, 
  markNotificationAsReadInSupabase,
  markAllNotificationsAsReadInSupabase,
  deleteNotificationFromSupabase 
} from '@/lib/supabase-client'; // ☁️ دوال الإشعارات السحابية

const NOTIFICATIONS_KEY = 'system_notifications'; // 🔑 مفتاح التخزين

// 📦 الإشعارات التأسيسية (فارغة نقية بانتظار الإشعارات الحقيقية)
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// 📥 جلب كافة الإشعارات الموجهة لمستخدم معين بناءً على معرفه أو دوره
export function getUserNotifications(userId: string, userRole?: UserRole): AppNotification[] {
  const all = getStoredData<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  return all.filter((n) => {
    if (n.recipient_id === 'all') return true;
    if (n.recipient_id === userId) return true;
    if (userRole && n.recipient_role === userRole) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// 📤 إرسال إشعار فوري جديد في المنظومة
export function sendAppNotification(
  notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>
): AppNotification {
  const all = getStoredData<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);

  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const updated = [newNotif, ...all];
  saveStoredData(NOTIFICATIONS_KEY, updated);
  saveNotificationToSupabase(newNotif); // ☁️ رفع ومزامنة الإشعار سحابياً في Supabase فوراً
  return newNotif;
}

// 👁️ تمييز إشعار معين كمقروء
export function markNotificationAsRead(notificationId: string): void {
  const all = getStoredData<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  const updated = all.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
  saveStoredData(NOTIFICATIONS_KEY, updated);
  markNotificationAsReadInSupabase(notificationId); // ☁️ تحديث القراءة سحابياً في Supabase
}

// 👁️ تمييز كافة الإشعارات كمقروءة لمستخدم محدد
export function markAllUserNotificationsAsRead(userId: string, userRole?: UserRole): void {
  const all = getStoredData<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  const updated = all.map((n) => {
    const isTarget =
      n.recipient_id === 'all' ||
      n.recipient_id === userId ||
      (userRole && n.recipient_role === userRole);
    return isTarget ? { ...n, is_read: true } : n;
  });
  saveStoredData(NOTIFICATIONS_KEY, updated);
  markAllNotificationsAsReadInSupabase(userId, userRole); // ☁️ تحديث كافة الإشعارات كمقروءة في سحابة Supabase
}

// 🗑️ حذف إشعار
export function deleteAppNotification(notificationId: string): void {
  const all = getStoredData<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  const updated = all.filter((n) => n.id !== notificationId);
  saveStoredData(NOTIFICATIONS_KEY, updated);
  deleteNotificationFromSupabase(notificationId); // ☁️ حذف الإشعار من جدول notifications في Supabase
}

// 🔢 حساب عدد الإشعارات غير المقروءة لمستخدم
export function getUnreadCount(userId: string, userRole?: UserRole): number {
  const userNotifs = getUserNotifications(userId, userRole);
  return userNotifs.filter((n) => !n.is_read).length;
}
