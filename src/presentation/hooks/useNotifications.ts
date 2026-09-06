// 🎣 خطاف الإشعارات الأكاديمية (useNotifications Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback, useEffect } from 'react';
import { notificationRepository, sendNotificationUseCase } from '@/infrastructure/container';
import { Notification } from '@/core/domain/entities/Notification';
import { SendNotificationRequestDto } from '@/core/usecases/notifications/dtos/NotificationDtos';

// 🧱 مخرجات خطاف الإشعارات
export interface UseNotificationsReturn {
  notifications: Notification[]; // 🔔 قائمة الإشعارات
  unreadCount: number; // 🔢 عدد غير المقروء
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  loadNotifications: (role?: 'students' | 'teachers' | 'admins' | 'all') => Promise<void>; // 📥 جلب الإشعارات
  sendNotification: (dto: SendNotificationRequestDto) => Promise<boolean>; // 📢 إرسال إشعار
  markAsRead: (id: string) => Promise<void>; // 👁️ تحديد كمقروء
}

// 🎣 الخطاف المخصص
export function useNotifications(targetRole: 'students' | 'teachers' | 'admins' | 'all' = 'all'): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 جلب الإشعارات
  const loadNotifications = useCallback(
    async (role: 'students' | 'teachers' | 'admins' | 'all' = 'all'): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const list = await notificationRepository.getByTarget(role);
        setNotifications(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل جلب الإشعارات ❌');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 📢 إرسال إشعار
  const sendNotification = useCallback(async (dto: SendNotificationRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await sendNotificationUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      const newNotif = result.getValue().notification;
      setNotifications(prev => [newNotif, ...prev]);
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  // 👁️ تحديد كمقروء
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    await notificationRepository.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          n.markAsRead();
        }
        return n;
      })
    );
  }, []);

  useEffect(() => {
    loadNotifications(targetRole);
  }, [targetRole, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    sendNotification,
    markAsRead,
  };
}
