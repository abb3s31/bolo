// 🎣 خطاف إدارة طلبات وقرارات التأجيل واستئناف القيد الأكاديمي (useAcademicDeferral Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { manageAcademicDeferralUseCase } from '@/infrastructure/container';
import {
  ManageAcademicDeferralRequestDto,
  ManageAcademicDeferralResponseDto,
} from '@/core/usecases/deferral/ManageAcademicDeferralUseCase';

// 🧱 مخرجات خطاف التأجيل واستئناف القيد
export interface UseAcademicDeferralReturn {
  deferralResult: ManageAcademicDeferralResponseDto | null; // ⚖️ نتيجة معالجة الطلب
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  manageDeferral: (dto: ManageAcademicDeferralRequestDto) => Promise<boolean>; // 📝 معالجة الطلب
}

// 🎣 الخطاف المخصص
export function useAcademicDeferral(): UseAcademicDeferralReturn {
  const [deferralResult, setDeferralResult] = useState<ManageAcademicDeferralResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 إدارة ومعالجة الطلب
  const manageDeferral = useCallback(
    async (dto: ManageAcademicDeferralRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await manageAcademicDeferralUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setDeferralResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    deferralResult,
    isLoading,
    error,
    manageDeferral,
  };
}
