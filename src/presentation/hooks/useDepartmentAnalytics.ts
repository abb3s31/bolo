// 🎣 خطاف إحصائيات وتحليلات الأقسام (useDepartmentAnalytics Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback, useEffect } from 'react';
import { getDepartmentAnalyticsUseCase } from '@/infrastructure/container';
import { DepartmentAnalyticsResponseDto } from '@/core/usecases/analytics/GetDepartmentAnalyticsUseCase';

// 🧱 مخرجات خطاف التحليلات
export interface UseDepartmentAnalyticsReturn {
  analytics: DepartmentAnalyticsResponseDto | null; // 📊 بيانات التحليلات
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  loadAnalytics: (departmentId: string, academicYear?: string) => Promise<void>; // 📥 جلب التحليلات
}

// 🎣 الخطاف المخصص
export function useDepartmentAnalytics(initialDepartmentId?: string): UseDepartmentAnalyticsReturn {
  const [analytics, setAnalytics] = useState<DepartmentAnalyticsResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 جلب التحليلات
  const loadAnalytics = useCallback(
    async (departmentId: string, academicYear?: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const result = await getDepartmentAnalyticsUseCase.execute({
        departmentId,
        academicYear,
      });

      setIsLoading(false);

      if (result.isSuccess) {
        setAnalytics(result.getValue());
      } else {
        setError(result.getError());
      }
    },
    []
  );

  useEffect(() => {
    if (initialDepartmentId) {
      loadAnalytics(initialDepartmentId);
    }
  }, [initialDepartmentId, loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    loadAnalytics,
  };
}
