// 🎣 خطاف تقديم وإدارة الاعتراضات على نتائج الامتحانات (useGradeAppeals Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { submitGradeAppealUseCase, reviewGradeAppealUseCase } from '@/infrastructure/container';
import {
  SubmitGradeAppealRequestDto,
  SubmitGradeAppealResponseDto,
} from '@/core/usecases/grades/SubmitGradeAppealUseCase';
import {
  ReviewGradeAppealRequestDto,
  ReviewGradeAppealResponseDto,
} from '@/core/usecases/grades/ReviewGradeAppealUseCase';

// 🧱 مخرجات خطاف الاعتراضات
export interface UseGradeAppealsReturn {
  lastAppealResult: SubmitGradeAppealResponseDto | null; // 📜 نتيجة آخر تقديم اعتراض
  lastReviewResult: ReviewGradeAppealResponseDto | null; // ⚖️ نتيجة آخر حسم ومراجعة
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  submitAppeal: (dto: SubmitGradeAppealRequestDto) => Promise<boolean>; // 📝 تقديم اعتراض
  reviewAppeal: (dto: ReviewGradeAppealRequestDto) => Promise<boolean>; // ⚖️ مراجعة وحسم اعتراض
}

// 🎣 الخطاف المخصص
export function useGradeAppeals(): UseGradeAppealsReturn {
  const [lastAppealResult, setLastAppealResult] = useState<SubmitGradeAppealResponseDto | null>(null);
  const [lastReviewResult, setLastReviewResult] = useState<ReviewGradeAppealResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 تقديم اعتراض
  const submitAppeal = useCallback(async (dto: SubmitGradeAppealRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await submitGradeAppealUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      setLastAppealResult(result.getValue());
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  // ⚖️ مراجعة وحسم اعتراض
  const reviewAppeal = useCallback(async (dto: ReviewGradeAppealRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await reviewGradeAppealUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      setLastReviewResult(result.getValue());
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  return {
    lastAppealResult,
    lastReviewResult,
    isLoading,
    error,
    submitAppeal,
    reviewAppeal,
  };
}
