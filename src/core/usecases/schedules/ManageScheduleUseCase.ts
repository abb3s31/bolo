// 🗓️ حالة استخدام إدارة الجداول الأسبوعية (Manage Schedule UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { AddLectureToScheduleRequestDto, ScheduleResponseDto } from './dtos/ScheduleDtos';
import { IScheduleRepository } from '@/core/domain/repositories/IScheduleRepository';
import { Schedule } from '@/core/domain/entities/Schedule';

// 🧱 صنف حالة استخدام إضافة محاضرة
export class AddLectureToScheduleUseCase
  implements IUseCase<AddLectureToScheduleRequestDto, ScheduleResponseDto>
{
  // 💉 حقن مستودع الجداول
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  // 🚀 تنفيذ إضافة المحاضرة
  public async execute(
    request: AddLectureToScheduleRequestDto
  ): Promise<Result<ScheduleResponseDto, string>> {
    try {
      // 🧱 إنشاء كيان المحاضرة
      const newLecture = new Schedule({
        id: `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        courseId: request.courseId,
        courseName: request.courseName,
        teacherId: request.teacherId,
        teacherName: request.teacherName,
        departmentId: request.departmentId,
        stageNumber: request.stageNumber,
        day: request.day,
        startTime: request.startTime,
        endTime: request.endTime,
        roomHall: request.roomHall,
        shiftType: request.shiftType,
      });

      // 💾 حفظ المحاضرة
      await this.scheduleRepository.save(newLecture);

      // 🎯 إرجاع النتيجة
      return Result.ok({
        schedule: newLecture,
        message: 'تمت إضافة المحاضرة إلى الجدول الأسبوعي بنجاح',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إضافة المحاضرة إلى الجدول ❌';
      return Result.fail(errorMsg);
    }
  }
}
