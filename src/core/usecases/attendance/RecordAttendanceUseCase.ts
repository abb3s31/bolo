// 📋 حالة استخدام تسجيل حضور المحاضرة (Record Attendance UseCase) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import {
  RecordLectureAttendanceRequestDto,
  RecordAttendanceResponseDto,
} from './dtos/AttendanceDtos';
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';
import { Attendance } from '@/core/domain/entities/Attendance';

// 🧱 صنف حالة استخدام تسجيل الحضور
export class RecordAttendanceUseCase
  implements IUseCase<RecordLectureAttendanceRequestDto, RecordAttendanceResponseDto>
{
  // 💉 حقن مستودع الحضور
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}

  // 🚀 تنفيذ تسجيل الحضور
  public async execute(
    request: RecordLectureAttendanceRequestDto
  ): Promise<Result<RecordAttendanceResponseDto, string>> {
    try {
      // 🔍 التحقق من وجود عناصر حضور
      if (!request.attendanceList || request.attendanceList.length === 0) {
        return Result.fail('قائمة حضور الطلاب فارغة ⚠️');
      }

      // 🧱 تحويل عناصر القائمة إلى كيانات نطاقية
      const records: Attendance[] = request.attendanceList.map(
        item =>
          new Attendance({
            id: `att-${Date.now()}-${item.studentId}`,
            studentId: item.studentId,
            studentName: item.studentName,
            courseId: request.courseId,
            teacherId: request.teacherId,
            date: request.date,
            status: item.status,
            notes: item.notes,
            createdAt: new Date().toISOString(),
          })
      );

      // 💾 حفظ سجلات الحضور دفعة واحدة
      await this.attendanceRepository.saveBatch(records);

      // 🎯 إرجاع نتيجة النجاح
      return Result.ok({
        recordedCount: records.length,
        message: `تم تسجيل حضور ${records.length} طالب للمحاضرة بنجاح`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تسجيل الحضور ❌';
      return Result.fail(errorMsg);
    }
  }
}
