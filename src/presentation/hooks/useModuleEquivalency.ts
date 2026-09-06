// 🎣 خطاف إجراءات المقاصة العلمية ومعادلة المواد (useModuleEquivalency Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { processModuleEquivalencyUseCase } from '@/infrastructure/container';
import {
  ProcessModuleEquivalencyRequestDto,
  ProcessModuleEquivalencyResponseDto,
} from '@/core/usecases/transfer/ProcessModuleEquivalencyUseCase';

// 🧱 مخرجات خطاف المقاصة العلمية
export interface UseModuleEquivalencyReturn {
  equivalencyResult: ProcessModuleEquivalencyResponseDto | null; // 📜 نتيجة المقاصة
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  processEquivalency: (dto: ProcessModuleEquivalencyRequestDto) => Promise<boolean>; // ⚖️ إجراء المقاصة
}

// 🎣 الخطاف المخصص
export function useModuleEquivalency(): UseModuleEquivalencyReturn {
  const [equivalencyResult, setEquivalencyResult] = useState<ProcessModuleEquivalencyResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ⚖️ إجراء المقاصة العلمية
  const processEquivalency = useCallback(
    async (dto: ProcessModuleEquivalencyRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await processModuleEquivalencyUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setEquivalencyResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    equivalencyResult,
    isLoading,
    error,
    processEquivalency,
  };
}
