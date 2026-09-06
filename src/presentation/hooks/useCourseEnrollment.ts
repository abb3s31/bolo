// 🎣 خطاف تسجيل المواد وفحص المتطلبات (useCourseEnrollment Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { enrollCourseUseCase } from '@/infrastructure/container';
import {
  EnrollCourseRequestDto,
  EnrollCourseResponseDto,
} from '@/core/usecases/courses/EnrollCourseUseCase';

// 🧱 مخرجات خطاف تسجيل المواد
export interface UseCourseEnrollmentReturn {
  enrollmentResult: EnrollCourseResponseDto | null; // 📚 نتيجة التسجيل
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  enrollCourse: (dto: EnrollCourseRequestDto) => Promise<boolean>; // 📝 تسجيل المادة
}

// 🎣 الخطاف المخصص
export function useCourseEnrollment(): UseCourseEnrollmentReturn {
  const [enrollmentResult, setEnrollmentResult] = useState<EnrollCourseResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 تسجيل المادة
  const enrollCourse = useCallback(async (dto: EnrollCourseRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await enrollCourseUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      setEnrollmentResult(result.getValue());
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  return {
    enrollmentResult,
    isLoading,
    error,
    enrollCourse,
  };
}
