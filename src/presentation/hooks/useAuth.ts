// 🎣 خطاف المصادقة والحسابات (useAuth Custom Hook) - Clean Architecture Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { authenticateUserUseCase, changePasswordUseCase } from '@/infrastructure/container';
import { UserEntity } from '@/core/domain/entities/User';

// 🧱 صنف مخرجات الخطاف
export interface UseAuthReturn {
  currentUser: UserEntity | null; // 👤 المستخدم الحالي
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ رسالة الخطأ
  login: (identifier: string, pass: string) => Promise<boolean>; // 🔐 دالة تسجيل الدخول
  changePassword: (userId: string, oldPass: string, newPass: string) => Promise<boolean>; // 🔑 تغيير الرمز
  logout: () => void; // 🚪 تسجيل الخروج
}

// 🎣 الخطاف المخصص للواجهة
export function useAuth(): UseAuthReturn {
  // 🏷️ حالات الـ State
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔐 دالة تسجيل الدخول عبر استدعاء الـ UseCase
  const login = useCallback(async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await authenticateUserUseCase.execute({
      identifier,
      password: pass,
    });

    setIsLoading(false);

    if (result.isSuccess) {
      const data = result.getValue();
      setCurrentUser(data.user);
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  // 🔑 دالة تغيير كلمة المرور
  const changePassword = useCallback(
    async (userId: string, oldPass: string, newPass: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await changePasswordUseCase.execute({
        userId,
        oldPassword: oldPass,
        newPassword: newPass,
      });

      setIsLoading(false);

      if (result.isSuccess) {
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  // 🚪 دالة تسجيل الخروج
  const logout = useCallback(() => {
    setCurrentUser(null);
    setError(null);
  }, []);

  return {
    currentUser,
    isLoading,
    error,
    login,
    changePassword,
    logout,
  };
}
