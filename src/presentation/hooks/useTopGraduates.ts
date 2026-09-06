// 🎣 خطاف استخراج وترتيب الأوائل (useTopGraduates Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { calculateTopGraduatesUseCase } from '@/infrastructure/container';
import {
  CalculateTopGraduatesRequestDto,
  CalculateTopGraduatesResponseDto,
} from '@/core/usecases/analytics/CalculateTopGraduatesUseCase';

// 🧱 مخرجات خطاف الأوائل
export interface UseTopGraduatesReturn {
  topGraduatesResult: CalculateTopGraduatesResponseDto | null; // 🏆 نتائج الأوائل
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  calculateTopGraduates: (dto: CalculateTopGraduatesRequestDto) => Promise<boolean>; // 🥇 استخراج الأوائل
}

// 🎣 الخطاف المخصص
export function useTopGraduates(): UseTopGraduatesReturn {
  const [topGraduatesResult, setTopGraduatesResult] = useState<CalculateTopGraduatesResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🥇 استخراج الأوائل
  const calculateTopGraduates = useCallback(
    async (dto: CalculateTopGraduatesRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await calculateTopGraduatesUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setTopGraduatesResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    topGraduatesResult,
    isLoading,
    error,
    calculateTopGraduates,
  };
}
