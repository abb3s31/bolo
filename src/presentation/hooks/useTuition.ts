// 🎣 خطاف إدارة الأقساط والرسوم الدراسية (useTuition Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { manageStudentTuitionUseCase } from '@/infrastructure/container';
import {
  RecordTuitionPaymentRequestDto,
  RecordTuitionPaymentResponseDto,
} from '@/core/usecases/tuition/ManageStudentTuitionUseCase';

// 🧱 مخرجات خطاف الأقساط
export interface UseTuitionReturn {
  lastPaymentResult: RecordTuitionPaymentResponseDto | null; // 🧾 نتيجة آخر دفعة
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  recordPayment: (dto: RecordTuitionPaymentRequestDto) => Promise<boolean>; // 💵 تسجيل دفعة
}

// 🎣 الخطاف المخصص
export function useTuition(): UseTuitionReturn {
  const [lastPaymentResult, setLastPaymentResult] = useState<RecordTuitionPaymentResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 💵 دالة تسجيل الدفعة
  const recordPayment = useCallback(
    async (dto: RecordTuitionPaymentRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await manageStudentTuitionUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setLastPaymentResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    lastPaymentResult,
    isLoading,
    error,
    recordPayment,
  };
}
