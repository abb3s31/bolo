// 🎣 خطاف فحص الإنذار الأكاديمي والتعثر الدراسي (useAcademicProbation Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { evaluateAcademicProbationUseCase } from '@/infrastructure/container';
import {
  EvaluateAcademicProbationRequestDto,
  EvaluateAcademicProbationResponseDto,
} from '@/core/usecases/analytics/EvaluateAcademicProbationUseCase';

// 🧱 مخرجات خطاف الإنذار الأكاديمي
export interface UseAcademicProbationReturn {
  probationResult: EvaluateAcademicProbationResponseDto | null; // ⚠️ نتيجة الفحص
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  evaluateProbation: (dto: EvaluateAcademicProbationRequestDto) => Promise<boolean>; // 🔍 فحص الإنذار
}

// 🎣 الخطاف المخصص
export function useAcademicProbation(): UseAcademicProbationReturn {
  const [probationResult, setProbationResult] = useState<EvaluateAcademicProbationResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔍 فحص الإنذار الأكاديمي
  const evaluateProbation = useCallback(
    async (dto: EvaluateAcademicProbationRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await evaluateAcademicProbationUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setProbationResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    probationResult,
    isLoading,
    error,
    evaluateProbation,
  };
}
