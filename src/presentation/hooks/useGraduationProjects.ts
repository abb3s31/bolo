// 🎣 خطاف إدارة وتقييم مشاريع التخرج (useGraduationProjects Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback } from 'react';
import { manageGraduationProjectUseCase } from '@/infrastructure/container';
import {
  ManageGraduationProjectRequestDto,
  ManageGraduationProjectResponseDto,
} from '@/core/usecases/projects/ManageGraduationProjectUseCase';

// 🧱 مخرجات خطاف مشاريع التخرج
export interface UseGraduationProjectsReturn {
  projectResult: ManageGraduationProjectResponseDto | null; // 🎓 نتيجة إدارة المشروع
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  manageProject: (dto: ManageGraduationProjectRequestDto) => Promise<boolean>; // 📝 إدارة وتقييم المشروع
}

// 🎣 الخطاف المخصص
export function useGraduationProjects(): UseGraduationProjectsReturn {
  const [projectResult, setProjectResult] = useState<ManageGraduationProjectResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📝 إدارة وتقييم المشروع
  const manageProject = useCallback(
    async (dto: ManageGraduationProjectRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await manageGraduationProjectUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        setProjectResult(result.getValue());
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  return {
    projectResult,
    isLoading,
    error,
    manageProject,
  };
}
