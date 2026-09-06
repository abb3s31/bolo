// 🎣 خطاف إدارة الجداول الأسبوعية (useSchedules Custom Hook) - Presentation Layer
'use client';

// 📜 استيراد React وحاوية التبعيات
import { useState, useCallback, useEffect } from 'react';
import { scheduleRepository, addLectureToScheduleUseCase } from '@/infrastructure/container';
import { Schedule } from '@/core/domain/entities/Schedule';
import { AddLectureToScheduleRequestDto } from '@/core/usecases/schedules/dtos/ScheduleDtos';

// 🧱 مخرجات خطاف الجداول
export interface UseSchedulesReturn {
  schedules: Schedule[]; // 🗓️ قائمة المحاضرات
  isLoading: boolean; // ⏳ حالة التحميل
  error: string | null; // ⚠️ الخطأ
  loadSchedules: (departmentId?: string, stageNumber?: number) => Promise<void>; // 📥 جلب الجدول
  addLecture: (dto: AddLectureToScheduleRequestDto) => Promise<boolean>; // ➕ إضافة محاضرة
}

// 🎣 الخطاف المخصص
export function useSchedules(initialDepartmentId?: string, initialStageNumber?: number): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 📥 جلب المحاضرات
  const loadSchedules = useCallback(
    async (departmentId?: string, stageNumber?: number): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        if (departmentId && stageNumber !== undefined) {
          const list = await scheduleRepository.getByDepartmentAndStage(departmentId, stageNumber, 'morning');
          setSchedules(list);
        } else {
          const all = await scheduleRepository.getAll();
          setSchedules(all);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل جلب الجدول الأسبوعي ❌');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ➕ إضافة محاضرة
  const addLecture = useCallback(async (dto: AddLectureToScheduleRequestDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await addLectureToScheduleUseCase.execute(dto);

    setIsLoading(false);

    if (result.isSuccess) {
      const newLec = result.getValue().schedule;
      setSchedules(prev => [...prev, newLec]);
      return true;
    } else {
      setError(result.getError());
      return false;
    }
  }, []);

  useEffect(() => {
    loadSchedules(initialDepartmentId, initialStageNumber);
  }, [initialDepartmentId, initialStageNumber, loadSchedules]);

  return {
    schedules,
    isLoading,
    error,
    loadSchedules,
    addLecture,
  };
}
