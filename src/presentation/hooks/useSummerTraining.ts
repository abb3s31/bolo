// 🎣 خطاف إدارة وتقييم التدريب الصيفي والتطبيق الميداني (useSummerTraining Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { manageSummerTrainingUseCase } from '@/infrastructure/container';
import {
  ManageSummerTrainingRequestDto,
  ManageSummerTrainingResponseDto,
} from '@/core/usecases/training/ManageSummerTrainingUseCase';

// 🧱 مخرجات خطاف التدريب الصيفي
export interface UseSummerTrainingReturn {
  trainingResult: ManageSummerTrainingResponseDto | null; // 🏭 نتيجة التدريب الصيفي
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  manageTraining: (dto: ManageSummerTrainingRequestDto) => Promise<boolean>; // 📝 إدارة وتقييم التدريب
}

// 🎣 الخطاف المخصص
export function useSummerTraining(): UseSummerTrainingReturn {
  const [trainingResult, setTrainingResult] = useState<ManageSummerTrainingResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 إدارة وتقييم التدريب الصيفي
  const manageTraining = useCallback(
    async (dto: ManageSummerTrainingRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await manageSummerTrainingUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setTrainingResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    trainingResult,
    isLoading,
    error,
    manageTraining,
  };
}
