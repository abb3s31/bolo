// 🎣 خطاف إصدار كشف الدرجات الأكاديمي (useAcademicTranscript Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { generateAcademicTranscriptUseCase } from '@/infrastructure/container';
import {
  GenerateTranscriptRequestDto,
  GenerateTranscriptResponseDto,
} from '@/core/usecases/transcripts/dtos/TranscriptDtos';

// 🧱 مخرجات خطاف الوثيقة الأكاديمية
export interface UseAcademicTranscriptReturn {
  transcript: GenerateTranscriptResponseDto | null; // 📜 بيانات كشف الدرجات
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  generateTranscript: (dto: GenerateTranscriptRequestDto) => Promise<boolean>; // 📄 إصدار الوثيقة
}

// 🎣 الخطاف المخصص
export function useAcademicTranscript(): UseAcademicTranscriptReturn {
  const [transcript, setTranscript] = useState<GenerateTranscriptResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📄 إصدار الوثيقة
  const generateTranscript = useCallback(
    async (dto: GenerateTranscriptRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await generateAcademicTranscriptUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setTranscript(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    transcript,
    isLoading,
    error,
    generateTranscript,
  };
}
