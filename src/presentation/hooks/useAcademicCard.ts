// 🎣 خطاف التحقق من البطاقة الأكاديمية (useAcademicCard Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { verifyAcademicCardUseCase } from '@/infrastructure/container';
import { VerifyAcademicCardResponseDto } from '@/core/usecases/verification/dtos/VerificationDtos';

// 🧱 مخرجات خطاف التحقق
export interface UseAcademicCardReturn {
  verificationResult: VerifyAcademicCardResponseDto | null; // 🔲 نتيجة التحقق
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  verifyCard: (identifier: string) => Promise<boolean>; // 🔍 دالة التحقق
  reset: () => void; // 🔄 إعادة التعيين
}

// 🎣 الخطاف المخصص
export function useAcademicCard(): UseAcademicCardReturn {
  const [verificationResult, setVerificationResult] = useState<VerifyAcademicCardResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔍 دالة التحقق
  const verifyCard = useCallback(async (identifier: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await verifyAcademicCardUseCase.execute({ identifier });

    setIsLoading(false);

    if (result.isSuccess) {
      const data = result.getValue();
      setVerificationResult(data);
      return data.isValid;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  // 🔄 إعادة التعيين
  const reset = useCallback(() => {
    setVerificationResult(null);
    setError(null);
  }, []);

  return {
    verificationResult,
    isLoading,
    error,
    verifyCard,
    reset,
  };
}
