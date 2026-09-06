// 🎣 خطاف إدارة الطلاب (useStudents Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback, useEffect } from 'react';
import { createStudentUseCase, getStudentsUseCase } from '@/infrastructure/container';
import { Student } from '@/core/domain/entities/Student';
import { CreateStudentRequestDto } from '@/core/usecases/students/dtos/StudentDtos';

// 🧱 مخرجات خطاف الطلاب
export interface UseStudentsReturn {
  students: Student[]; // 🎓 قائمة الطلاب
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  loadStudents: (departmentId?: string, stageNumber?: number) => Promise<void>; // 📥 جلب الطلاب
  createStudent: (dto: CreateStudentRequestDto) => Promise<boolean>; // ➕ إنشاء طالب
}

// 🎣 الخطاف المخصص
export function useStudents(initialDepartmentId?: string, initialStageNumber?: number): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 دالة جلب الطلاب
  const loadStudents = useCallback(
    async (departmentId?: string, stageNumber?: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const result = await getStudentsUseCase.execute({
        departmentId,
        stageNumber,
      });

      setIsLoading(false);

      if (result.isSuccess) {
        setStudents(result.getValue());
      } else {
        setError(result.getError());
      }
    },
    []
  );

  // ➕ دالة إضافة طالب
  const createStudent = useCallback(
    async (dto: CreateStudentRequestDto): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await createStudentUseCase.execute(dto);

      setIsLoading(false);

      if (result.isSuccess) {
        const newCreated = result.getValue().student;
        setStudents(prev => [newCreated, ...prev]);
        return true;
      } else {
        setError(result.getError());
        return false;
      }
    },
    []
  );

  // 🔄 تحميل تلقائي عند أول رندر
  useEffect(() => {
    loadStudents(initialDepartmentId, initialStageNumber);
  }, [initialDepartmentId, initialStageNumber, loadStudents]);

  return {
    students,
    isLoading,
    error,
    loadStudents,
    createStudent,
  };
}
