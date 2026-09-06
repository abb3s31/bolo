// 🚫 حالة استخدام فحص وتطبيق قرارات الحرمان من الامتحانات بسبب الغياب - Clean Architecture

// 📜 استيراد العقود والنماذج
import { IUseCase } from '../common/IUseCase';
import { Result } from '../common/Result';
import { IAttendanceRepository } from '@/core/domain/repositories/IAttendanceRepository';
import { IStudentRepository } from '@/core/domain/repositories/IStudentRepository';
import { INotificationRepository } from '@/core/domain/repositories/INotificationRepository';
import { IActivityLogRepository } from '@/core/domain/repositories/IActivityLogRepository';
import { StudentAbsenceWarningSpecification } from '@/core/domain/specifications/StudentAbsenceWarningSpecification';
import { Notification } from '@/core/domain/entities/Notification';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// 📥 نموذج طلب فحص وتطبيق الحرمان
export interface EnforceAbsenceDeprivationsRequestDto {
  readonly courseId: string; // 📚 معرف المادة
  readonly courseName: string; // 📚 اسم المادة
  readonly departmentId: string; // 🏛️ معرف القسم
  readonly totalSemesterLectures: number; // 🔢 إجمالي محاضرات الفصل (مثال: 30)
  readonly enforcedByUserId: string; // 👤 معرف المسؤول (رئيس القسم / الأستاذ)
  readonly enforcedByUserName: string; // 👤 اسم المسؤول
}

// 📋 تفاصيل الطالب المعاقب بالحرمان أو الإنذار
export interface DeprivedStudentItemDto {
  readonly studentId: string; // 🎓 معرف الطالب
  readonly studentName: string; // 👤 اسم الطالب
  readonly absencePercentage: number; // 📊 نسبة الغياب
  readonly absentCount: number; // 🔢 عدد الغيابات
  readonly warningTier: string; // 🏷️ مستوى الإنذار
  readonly warningLabel: string; // 💬 المسمى الرسمي
  readonly isDeprived: boolean; // 🚫 هل محروم رسمياً
}

// 📤 نموذج استجابة فحص الحرمان
export interface EnforceAbsenceDeprivationsResponseDto {
  readonly totalEvaluated: number; // 👥 عدد الطلاب المفحوصين
  readonly deprivedCount: number; // 🚫 عدد المحرومين (>= 10%)
  readonly warnedCount: number; // ⚠️ عدد المنذرين (5% - 7%)
  readonly deprivedStudents: DeprivedStudentItemDto[]; // 📋 قائمة الطلاب
  readonly message: string; // 💬 رسالة ملخصة
}

// 🧱 صنف حالة استخدام تطبيق قرارات الحرمان
export class EnforceAbsenceDeprivationsUseCase
  implements IUseCase<EnforceAbsenceDeprivationsRequestDto, EnforceAbsenceDeprivationsResponseDto>
{
  // 💉 حقن المستودعات المطلوبة
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly auditRepository: IActivityLogRepository
  ) {}

  // 🚀 تنفيذ فحص وتطبيق الحرمان
  public async execute(
    request: EnforceAbsenceDeprivationsRequestDto
  ): Promise<Result<EnforceAbsenceDeprivationsResponseDto, string>> {
    try {
      // 🔍 1. جلب طلاب القسم
      const students = await this.studentRepository.getAll();
      const deptStudents = students.filter(s => s.departmentId === request.departmentId);

      if (deptStudents.length === 0) {
        return Result.fail('لا يوجد طلاب مسجلون في هذا القسم ⚠️');
      }

      const spec = new StudentAbsenceWarningSpecification();
      const flaggedStudents: DeprivedStudentItemDto[] = [];
      let deprivedCount = 0;
      let warnedCount = 0;

      // 🔍 2. فحص كل طالب وتطبيق المواصفة
      for (const student of deptStudents) {
        const records = await this.attendanceRepository.getByStudentAndCourse(
          student.id,
          request.courseId
        );

        const evalResult = spec.evaluate({
          studentId: student.id,
          courseId: request.courseId,
          attendanceRecords: records,
          totalScheduledLectures: request.totalSemesterLectures,
        });

        if (evalResult.warningTier !== 'safe') {
          flaggedStudents.push({
            studentId: student.id,
            studentName: student.fullName,
            absencePercentage: evalResult.absencePercentage,
            absentCount: evalResult.absentCount,
            warningTier: evalResult.warningTier,
            warningLabel: evalResult.warningLabel,
            isDeprived: evalResult.isDeprived,
          });

          if (evalResult.isDeprived) {
            deprivedCount += 1;
          } else {
            warnedCount += 1;
          }

          // 🔔 إرسال إشعار رسمي للطالب
          const notif = new Notification({
            id: `notif-dep-${Date.now()}-${student.id}`,
            title: evalResult.isDeprived ? 'قرار حرمان من الامتحان النهائي 🚫' : 'إنذار غياب رسمي ⚠️',
            message: `عزيزي الطالب (${student.fullName})، في مادة (${request.courseName}) تم تسجيل نسبة غياب (${evalResult.absencePercentage}%). الموقف: ${evalResult.warningLabel}.`,
            type: 'attendance',
            targetRole: 'students',
            createdAt: new Date().toISOString(),
            isRead: false,
          });
          await this.notificationRepository.save(notif);
        }
      }

      // 📜 3. تسجيل العملية في سجل التدقيق
      const log = new ActivityLog({
        id: `act-dep-${Date.now()}`,
        actorId: request.enforcedByUserId,
        actorName: request.enforcedByUserName,
        actorRole: 'department_head',
        action: 'ENFORCE_ABSENCE_DEPRIVATIONS',
        targetResource: request.courseName,
        details: `تم إجراء مسح الغيابات لمادة (${request.courseName}). النتائج: (${deprivedCount}) محروم، (${warnedCount}) منذر من أصل (${deptStudents.length}) طالب.`,
        timestamp: new Date().toISOString(),
      });
      await this.auditRepository.log(log);

      return Result.ok({
        totalEvaluated: deptStudents.length,
        deprivedCount,
        warnedCount,
        deprivedStudents: flaggedStudents,
        message: `تم تدقيق موقف الغيابات لمادة (${request.courseName}): ${deprivedCount} طالب محروم و ${warnedCount} طالب منذر 📋`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تطبيق قرارات الغياب والحرمان ❌';
      return Result.fail(errorMsg);
    }
  }
}
