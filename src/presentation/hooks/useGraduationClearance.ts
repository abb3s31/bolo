// 🎣 خطاف إدارة براءة الذمة الجامعية للتخرج (useGraduationClearance Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { processGraduationClearanceUseCase } from '@/infrastructure/container';
import {
  ProcessGraduationClearanceRequestDto,
  ProcessGraduationClearanceResponseDto,
} from '@/core/usecases/clearance/ProcessGraduationClearanceUseCase';

// 🧱 مخرجات خطاف براءة الذمة
export interface UseGraduationClearanceReturn {
  clearanceResult: ProcessGraduationClearanceResponseDto | null; // 📜 نتيجة معالجة البراءة
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  processClearance: (dto: ProcessGraduationClearanceRequestDto) => Promise<boolean>; // 📑 معالجة البراءة
}

// 🎣 الخطاف المخصص
export function useGraduationClearance(): UseGraduationClearanceReturn {
  const [clearanceResult, setClearanceResult] = useState<ProcessGraduationClearanceResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📑 معالجة وتوثيق البراءة
  const processClearance = useCallback(
    async (dto: ProcessGraduationClearanceRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await processGraduationClearanceUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setClearanceResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    clearanceResult,
    isLoading,
    error,
    processClearance,
  };
}
