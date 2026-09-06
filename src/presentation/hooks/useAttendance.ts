// 🎣 خطاف تسجيل ومتابعة الحضور (useAttendance Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { recordAttendanceUseCase } from '@/infrastructure/container';
import {
  RecordLectureAttendanceRequestDto,
  RecordAttendanceResponseDto,
} from '@/core/usecases/attendance/dtos/AttendanceDtos';

// 🧱 مخرجات خطاف الحضور
export interface UseAttendanceReturn {
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ رسالة الخطأ
  lastRecordResult: RecordAttendanceResponseDto | null; // 📋 نتيجة آخر تسجيل
  recordAttendance: (dto: RecordLectureAttendanceRequestDto) => Promise<boolean>; // 📝 دالة تسجيل الحضور
}

// 🎣 الخطاف المخصص للحضور
export function useAttendance(): UseAttendanceReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecordResult, setLastRecordResult] = useState<RecordAttendanceResponseDto | null>(null);

  // 📝 دالة تسجيل الحضور
  const recordAttendance = useCallback(
    async (dto: RecordLectureAttendanceRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await recordAttendanceUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setLastRecordResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    isLoading,
    error,
    lastRecordResult,
    recordAttendance,
  };
}
