// 🎣 خطاف احتساب النصاب والعبء التدريسي (useTeacherWorkload Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { calculateTeacherWorkloadUseCase } from '@/infrastructure/container';
import {
  CalculateTeacherWorkloadRequestDto,
  CalculateTeacherWorkloadResponseDto,
} from '@/core/usecases/workload/CalculateTeacherWorkloadUseCase';

// 🧱 مخرجات خطاف النصاب التدريسي
export interface UseTeacherWorkloadReturn {
  workloadResult: CalculateTeacherWorkloadResponseDto | null; // 📊 بيانات النصاب المحسوب
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  calculateWorkload: (dto: CalculateTeacherWorkloadRequestDto) => Promise<boolean>; // 🧮 احتساب النصاب
}

// 🎣 الخطاف المخصص
export function useTeacherWorkload(): UseTeacherWorkloadReturn {
  const [workloadResult, setWorkloadResult] = useState<CalculateTeacherWorkloadResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🧮 احتساب النصاب
  const calculateWorkload = useCallback(
    async (dto: CalculateTeacherWorkloadRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await calculateTeacherWorkloadUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setWorkloadResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    workloadResult,
    isLoading,
    error,
    calculateWorkload,
  };
}
