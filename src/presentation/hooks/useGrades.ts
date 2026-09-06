// 🎣 خطاف إدارة ورصد الدرجات والسعيات (useGrades Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { submitGradeUseCase } from '@/infrastructure/container';
import { SubmitGradeRequestDto, SubmitGradeResponseDto } from '@/core/usecases/grades/dtos/GradeDtos';

// 🧱 مخرجات خطاف الدرجات
export interface UseGradesReturn {
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  lastSubmittedGrade: SubmitGradeResponseDto | null; // 📊 آخر درجة مرصودة
  submitGrade: (dto: SubmitGradeRequestDto) => Promise<boolean>; // ✏️ دالة رصد الدرجة
}

// 🎣 الخطاف المخصص للدرجات
export function useGrades(): UseGradesReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedGrade, setLastSubmittedGrade] = useState<SubmitGradeResponseDto | null>(null);

  // ✏️ دالة رصد الدرجة
  const submitGrade = useCallback(async (dto: SubmitGradeRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await submitGradeUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      setLastSubmittedGrade(result.getValue());
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    lastSubmittedGrade,
    submitGrade,
  };
}
