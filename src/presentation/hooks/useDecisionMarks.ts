// 🎣 خطاف تطبيق درجات القرار الوزاري (useDecisionMarks Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { applyDecisionMarksUseCase } from '@/infrastructure/container';
import {
  ApplyDecisionMarksRequestDto,
  ApplyDecisionMarksResponseDto,
} from '@/core/usecases/grades/ApplyDecisionMarksUseCase';

// 🧱 مخرجات خطاف درجات القرار
export interface UseDecisionMarksReturn {
  decisionResult: ApplyDecisionMarksResponseDto | null; // ⚖️ نتيجة تطبيق القرار
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  applyDecision: (dto: ApplyDecisionMarksRequestDto) => Promise<boolean>; // 🎯 تطبيق القرار
}

// 🎣 الخطاف المخصص
export function useDecisionMarks(): UseDecisionMarksReturn {
  const [decisionResult, setDecisionResult] = useState<ApplyDecisionMarksResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🎯 تطبيق درجات القرار
  const applyDecision = useCallback(
    async (dto: ApplyDecisionMarksRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await applyDecisionMarksUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setDecisionResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    decisionResult,
    isLoading,
    error,
    applyDecision,
  };
}
