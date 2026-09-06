// 📦 حاوية التبعيات ومزود الخدمات المركزية (Dependency Injection Container)
// 🏛️ تطبيق معايير Clean Architecture & SOLID Dependency Inversion Principle

// 🧱 1. استيراد المستودعات الملموسة (Concrete Repositories)
import { LocalStorageUserRepository } from './repositories/LocalStorageUserRepository';
import { LocalStorageStudentRepository } from './repositories/LocalStorageStudentRepository';
import { LocalStorageTeacherRepository } from './repositories/LocalStorageTeacherRepository';
import { LocalStorageDepartmentRepository } from './repositories/LocalStorageDepartmentRepository';
import { LocalStorageCourseRepository } from './repositories/LocalStorageCourseRepository';
import { LocalStorageAttendanceRepository } from './repositories/LocalStorageAttendanceRepository';
import { LocalStorageGradeRepository } from './repositories/LocalStorageGradeRepository';
import { LocalStorageScheduleRepository } from './repositories/LocalStorageScheduleRepository';
import { LocalStorageNotificationRepository } from './repositories/LocalStorageNotificationRepository';
import { LocalStorageAuditLogRepository } from './repositories/LocalStorageAuditLogRepository';

// ⚙️ 2. استيراد حالات الاستخدام (Use Cases)
import { AuthenticateUserUseCase } from '@/core/usecases/auth/AuthenticateUserUseCase';
import { ChangePasswordUseCase } from '@/core/usecases/auth/ChangePasswordUseCase';
import { CreateStudentUseCase } from '@/core/usecases/students/CreateStudentUseCase';
import { GetStudentsUseCase } from '@/core/usecases/students/GetStudentsUseCase';
import { PromoteStudentsUseCase } from '@/core/usecases/students/PromoteStudentsUseCase';
import { BatchImportStudentsUseCase } from '@/core/usecases/students/BatchImportStudentsUseCase';
import { CreateTeacherUseCase } from '@/core/usecases/teachers/CreateTeacherUseCase';
import { AssignTeacherToCourseUseCase } from '@/core/usecases/courses/AssignTeacherToCourseUseCase';
import { EnrollCourseUseCase } from '@/core/usecases/courses/EnrollCourseUseCase';
import { CalculateTeacherWorkloadUseCase } from '@/core/usecases/workload/CalculateTeacherWorkloadUseCase';
import { RecordAttendanceUseCase } from '@/core/usecases/attendance/RecordAttendanceUseCase';
import { SubmitAttendanceExcuseUseCase } from '@/core/usecases/attendance/SubmitAttendanceExcuseUseCase';
import { ReviewAttendanceExcuseUseCase } from '@/core/usecases/attendance/ReviewAttendanceExcuseUseCase';
import { EnforceAbsenceDeprivationsUseCase } from '@/core/usecases/attendance/EnforceAbsenceDeprivationsUseCase';
import { SubmitGradeUseCase } from '@/core/usecases/grades/SubmitGradeUseCase';
import { CalculateStudentGpaUseCase } from '@/core/usecases/grades/CalculateStudentGpaUseCase';
import { LockCourseGradesUseCase } from '@/core/usecases/grades/LockCourseGradesUseCase';
import { ApplyDecisionMarksUseCase } from '@/core/usecases/grades/ApplyDecisionMarksUseCase';
import { SubmitGradeAppealUseCase } from '@/core/usecases/grades/SubmitGradeAppealUseCase';
import { ReviewGradeAppealUseCase } from '@/core/usecases/grades/ReviewGradeAppealUseCase';
import { GenerateAcademicTranscriptUseCase } from '@/core/usecases/transcripts/GenerateAcademicTranscriptUseCase';
import { ProcessGraduationClearanceUseCase } from '@/core/usecases/clearance/ProcessGraduationClearanceUseCase';
import { ProcessModuleEquivalencyUseCase } from '@/core/usecases/transfer/ProcessModuleEquivalencyUseCase';
import { ManageGraduationProjectUseCase } from '@/core/usecases/projects/ManageGraduationProjectUseCase';
import { ManageSummerTrainingUseCase } from '@/core/usecases/training/ManageSummerTrainingUseCase';
import { ManageAcademicDeferralUseCase } from '@/core/usecases/deferral/ManageAcademicDeferralUseCase';
import { AddLectureToScheduleUseCase } from '@/core/usecases/schedules/ManageScheduleUseCase';
import { SendNotificationUseCase } from '@/core/usecases/notifications/SendNotificationUseCase';
import { LogActivityUseCase } from '@/core/usecases/audit/LogActivityUseCase';
import { GetDepartmentAnalyticsUseCase } from '@/core/usecases/analytics/GetDepartmentAnalyticsUseCase';
import { EvaluateAcademicProbationUseCase } from '@/core/usecases/analytics/EvaluateAcademicProbationUseCase';
import { CalculateTopGraduatesUseCase } from '@/core/usecases/analytics/CalculateTopGraduatesUseCase';
import { VerifyAcademicCardUseCase } from '@/core/usecases/verification/VerifyAcademicCardUseCase';
import { ManageStudentTuitionUseCase } from '@/core/usecases/tuition/ManageStudentTuitionUseCase';

// 🎧 3. استيراد مشغلي أحداث النطاق
import { registerAllDomainEventSubscribers } from './events/EventSubscribers';

// 🏗️ 4. إنشاء المثيلات الأحادية للمستودعات (Singletons Repositories)
export const userRepository = new LocalStorageUserRepository();
export const studentRepository = new LocalStorageStudentRepository();
export const teacherRepository = new LocalStorageTeacherRepository();
export const departmentRepository = new LocalStorageDepartmentRepository();
export const courseRepository = new LocalStorageCourseRepository();
export const attendanceRepository = new LocalStorageAttendanceRepository();
export const gradeRepository = new LocalStorageGradeRepository();
export const scheduleRepository = new LocalStorageScheduleRepository();
export const notificationRepository = new LocalStorageNotificationRepository();
export const auditLogRepository = new LocalStorageAuditLogRepository();

// ⚙️ 5. إنشاء وحقن مثيلات حالات الاستخدام (Use Cases Instances with Dependency Injection)
export const authenticateUserUseCase = new AuthenticateUserUseCase(userRepository);
export const changePasswordUseCase = new ChangePasswordUseCase(userRepository);

export const createStudentUseCase = new CreateStudentUseCase(studentRepository);
export const getStudentsUseCase = new GetStudentsUseCase(studentRepository);
export const promoteStudentsUseCase = new PromoteStudentsUseCase(studentRepository, auditLogRepository);
export const batchImportStudentsUseCase = new BatchImportStudentsUseCase(studentRepository, auditLogRepository);

export const createTeacherUseCase = new CreateTeacherUseCase(teacherRepository);
export const assignTeacherToCourseUseCase = new AssignTeacherToCourseUseCase(
  teacherRepository,
  courseRepository,
  auditLogRepository
);
export const calculateTeacherWorkloadUseCase = new CalculateTeacherWorkloadUseCase(
  teacherRepository,
  courseRepository
);

export const enrollCourseUseCase = new EnrollCourseUseCase(
  studentRepository,
  courseRepository,
  gradeRepository,
  auditLogRepository
);

export const recordAttendanceUseCase = new RecordAttendanceUseCase(attendanceRepository);
export const submitAttendanceExcuseUseCase = new SubmitAttendanceExcuseUseCase(auditLogRepository);
export const reviewAttendanceExcuseUseCase = new ReviewAttendanceExcuseUseCase(attendanceRepository, auditLogRepository);
export const enforceAbsenceDeprivationsUseCase = new EnforceAbsenceDeprivationsUseCase(
  attendanceRepository,
  studentRepository,
  notificationRepository,
  auditLogRepository
);

export const submitGradeUseCase = new SubmitGradeUseCase(gradeRepository);
export const calculateStudentGpaUseCase = new CalculateStudentGpaUseCase(gradeRepository, courseRepository);
export const lockCourseGradesUseCase = new LockCourseGradesUseCase(gradeRepository, auditLogRepository);
export const applyDecisionMarksUseCase = new ApplyDecisionMarksUseCase(gradeRepository, auditLogRepository);
export const submitGradeAppealUseCase = new SubmitGradeAppealUseCase(gradeRepository, auditLogRepository);
export const reviewGradeAppealUseCase = new ReviewGradeAppealUseCase(gradeRepository, auditLogRepository);

export const generateAcademicTranscriptUseCase = new GenerateAcademicTranscriptUseCase(
  studentRepository,
  gradeRepository,
  courseRepository,
  auditLogRepository
);

export const processGraduationClearanceUseCase = new ProcessGraduationClearanceUseCase(
  studentRepository,
  auditLogRepository
);

export const processModuleEquivalencyUseCase = new ProcessModuleEquivalencyUseCase(
  studentRepository,
  courseRepository,
  auditLogRepository
);

export const manageGraduationProjectUseCase = new ManageGraduationProjectUseCase(
  studentRepository,
  auditLogRepository
);

export const manageSummerTrainingUseCase = new ManageSummerTrainingUseCase(
  studentRepository,
  auditLogRepository
);

export const manageAcademicDeferralUseCase = new ManageAcademicDeferralUseCase(
  studentRepository,
  notificationRepository,
  auditLogRepository
);

export const addLectureToScheduleUseCase = new AddLectureToScheduleUseCase(scheduleRepository);

export const sendNotificationUseCase = new SendNotificationUseCase(notificationRepository);

export const logActivityUseCase = new LogActivityUseCase(auditLogRepository);

export const getDepartmentAnalyticsUseCase = new GetDepartmentAnalyticsUseCase(
  studentRepository,
  teacherRepository,
  courseRepository,
  gradeRepository
);

export const evaluateAcademicProbationUseCase = new EvaluateAcademicProbationUseCase(
  studentRepository,
  gradeRepository,
  notificationRepository,
  auditLogRepository
);

export const calculateTopGraduatesUseCase = new CalculateTopGraduatesUseCase(
  studentRepository,
  gradeRepository,
  courseRepository,
  auditLogRepository
);

export const verifyAcademicCardUseCase = new VerifyAcademicCardUseCase(studentRepository);
export const manageStudentTuitionUseCase = new ManageStudentTuitionUseCase(auditLogRepository);

// 🚀 6. تسجيل وربط كافة مستمعي الأحداث تلقائياً
registerAllDomainEventSubscribers();
