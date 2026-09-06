// 🧪 ملف فحص واختبار المعمارية النظيفة ومبادئ SOLID - جامعة الإمام جعفر الصادق (ع)
// 🏛️ فحص كائنات القيمة، نمط Result، مصنع المستودعات، أحداث النطاق، المواصفات، وكافة حالات الاستخدام

import { Email } from '../src/core/domain/value-objects/Email';
import { UniversityNumber } from '../src/core/domain/value-objects/UniversityNumber';
import { GradeScore } from '../src/core/domain/value-objects/GradeScore';
import { Result } from '../src/core/usecases/common/Result';
import { RepositoryFactory } from '../src/infrastructure/factories/RepositoryFactory';
import { AuthenticateUserUseCase } from '../src/core/usecases/auth/AuthenticateUserUseCase';
import { CalculateStudentGpaUseCase } from '../src/core/usecases/grades/CalculateStudentGpaUseCase';
import { VerifyAcademicCardUseCase } from '../src/core/usecases/verification/VerifyAcademicCardUseCase';
import { LockCourseGradesUseCase } from '../src/core/usecases/grades/LockCourseGradesUseCase';
import { ApplyDecisionMarksUseCase } from '../src/core/usecases/grades/ApplyDecisionMarksUseCase';
import { AssignTeacherToCourseUseCase } from '../src/core/usecases/courses/AssignTeacherToCourseUseCase';
import { EnrollCourseUseCase } from '../src/core/usecases/courses/EnrollCourseUseCase';
import { CalculateTeacherWorkloadUseCase } from '../src/core/usecases/workload/CalculateTeacherWorkloadUseCase';
import { EvaluateAcademicProbationUseCase } from '../src/core/usecases/analytics/EvaluateAcademicProbationUseCase';
import { CalculateTopGraduatesUseCase } from '../src/core/usecases/analytics/CalculateTopGraduatesUseCase';
import { ProcessModuleEquivalencyUseCase } from '../src/core/usecases/transfer/ProcessModuleEquivalencyUseCase';
import { ManageGraduationProjectUseCase } from '../src/core/usecases/projects/ManageGraduationProjectUseCase';
import { ManageSummerTrainingUseCase } from '../src/core/usecases/training/ManageSummerTrainingUseCase';
import { ManageAcademicDeferralUseCase } from '../src/core/usecases/deferral/ManageAcademicDeferralUseCase';
import { SubmitGradeAppealUseCase } from '../src/core/usecases/grades/SubmitGradeAppealUseCase';
import { ReviewGradeAppealUseCase } from '../src/core/usecases/grades/ReviewGradeAppealUseCase';
import { PromoteStudentsUseCase } from '../src/core/usecases/students/PromoteStudentsUseCase';
import { BatchImportStudentsUseCase } from '../src/core/usecases/students/BatchImportStudentsUseCase';
import { GenerateAcademicTranscriptUseCase } from '../src/core/usecases/transcripts/GenerateAcademicTranscriptUseCase';
import { EnforceAbsenceDeprivationsUseCase } from '../src/core/usecases/attendance/EnforceAbsenceDeprivationsUseCase';
import { ProcessGraduationClearanceUseCase } from '../src/core/usecases/clearance/ProcessGraduationClearanceUseCase';
import { ManageStudentTuitionUseCase } from '../src/core/usecases/tuition/ManageStudentTuitionUseCase';
import { Student } from '../src/core/domain/entities/Student';
import { Grade } from '../src/core/domain/entities/Grade';
import { Course } from '../src/core/domain/entities/Course';
import { Teacher } from '../src/core/domain/entities/Teacher';
import { Attendance } from '../src/core/domain/entities/Attendance';
import { DomainEventDispatcher } from '../src/core/domain/events/DomainEventDispatcher';
import { StudentCreatedEvent } from '../src/core/domain/events/student/StudentEvents';
import { StudentGraduationSpecification } from '../src/core/domain/specifications/StudentGraduationSpecification';
import { StudentAbsenceWarningSpecification } from '../src/core/domain/specifications/StudentAbsenceWarningSpecification';
import { DecisionMarksEligibilitySpecification } from '../src/core/domain/specifications/DecisionMarksEligibilitySpecification';
import { ExamScheduleConflictSpecification } from '../src/core/domain/specifications/ExamScheduleConflictSpecification';
import { CoursePrerequisitesSpecification } from '../src/core/domain/specifications/CoursePrerequisitesSpecification';
import { RoomCapacitySpecification } from '../src/core/domain/specifications/RoomCapacitySpecification';

// 🚀 دالة الفحص الشاملة
async function runCleanArchitectureTests(): Promise<void> {
  console.log('====================================================');
  console.log('🧪 بدء فحص طبقات المعمارية النظيفة ومبادئ SOLID الشامل...');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`✅ [نجاح] ${testName}`);
      passedTests += 1;
    } else {
      console.error(`❌ [فشل] ${testName}`);
      failedTests += 1;
    }
  }

  // ----------------------------------------------------
  // 1. اختبار كائن القيمة للبريد الإلكتروني (Email Value Object)
  // ----------------------------------------------------
  try {
    const validEmail = Email.create('student.cce@sadiq.edu.iq');
    assert(validEmail.getValue() === 'student.cce@sadiq.edu.iq', 'إنشاء بريد صالح');
    
    let caughtInvalid = false;
    try {
      Email.create('invalid-email-format');
    } catch {
      caughtInvalid = true;
    }
    assert(caughtInvalid, 'رفض صيغة البريد غير الصالحة');
  } catch (e) {
    assert(false, `خطأ في اختبار Email: ${e}`);
  }

  // ----------------------------------------------------
  // 2. اختبار كائن القيمة للرقم الجامعي (UniversityNumber)
  // ----------------------------------------------------
  try {
    const validUni = UniversityNumber.create('20251001');
    assert(validUni.getValue() === '20251001', 'إنشاء رقم جامعي صالح');

    let caughtShort = false;
    try {
      UniversityNumber.create('12');
    } catch {
      caughtShort = true;
    }
    assert(caughtShort, 'رفض الرقم الجامعي القصير جداً');
  } catch (e) {
    assert(false, `خطأ في اختبار UniversityNumber: ${e}`);
  }

  // ----------------------------------------------------
  // 3. اختبار كائن القيمة للدرجة وحساب التقديرات (GradeScore)
  // ----------------------------------------------------
  try {
    const score95 = GradeScore.create(95);
    assert(score95.getValue() === 95 && score95.getLetterRating() === 'امتياز', 'الدرجة 95 تعطي امتياز');

    const score82 = GradeScore.create(82.5);
    assert(score82.getLetterRating() === 'جيد جداً', 'الدرجة 82.5 تعطي جيد جداً');

    const score45 = GradeScore.create(45);
    assert(score45.getLetterRating() === 'راسب' && !score45.isPassed(), 'الدرجة 45 تعطي راسب');

    let caughtOutOfRange = false;
    try {
      GradeScore.create(105);
    } catch {
      caughtOutOfRange = true;
    }
    assert(caughtOutOfRange, 'رفض الدرجة التي تتجاوز 100');
  } catch (e) {
    assert(false, `خطأ في اختبار GradeScore: ${e}`);
  }

  // ----------------------------------------------------
  // 4. اختبار نمط النتيجة الآمن (Result Pattern)
  // ----------------------------------------------------
  try {
    const okResult = Result.ok({ id: '123', name: 'علي' });
    assert(okResult.isSuccess && !okResult.isFailure && okResult.getValue().name === 'علي', 'نمط Result للنجاح');

    const failResult = Result.fail('خطأ غير متوقع');
    assert(failResult.isFailure && !failResult.isSuccess && failResult.getError() === 'خطأ غير متوقع', 'نمط Result للفشل');
  } catch (e) {
    assert(false, `خطأ في اختبار Result: ${e}`);
  }

  // ----------------------------------------------------
  // 5. اختبار مصنع المستودعات (Repository Factory)
  // ----------------------------------------------------
  try {
    const localStudentRepo = RepositoryFactory.createStudentRepository('local');
    assert(localStudentRepo !== null && typeof localStudentRepo.getAll === 'function', 'إنشاء مستودع الطلاب المحلي عبر المصنع');

    const supabaseStudentRepo = RepositoryFactory.createStudentRepository('supabase');
    assert(supabaseStudentRepo !== null && typeof supabaseStudentRepo.getAll === 'function', 'إنشاء مستودع الطلاب السحابي عبر المصنع (LSP)');
  } catch (e) {
    assert(false, `خطأ في اختبار RepositoryFactory: ${e}`);
  }

  // ----------------------------------------------------
  // 6. اختبار حالة استخدام المصادقة (AuthenticateUserUseCase)
  // ----------------------------------------------------
  try {
    const authUseCase = new AuthenticateUserUseCase({
      getAll: () => [],
      getById: () => null,
      getByEmailOrUniNum: (id: string) => {
        if (id === 'admin@sadiq.edu.iq') {
          return {
            id: 'admin-1',
            full_name: 'أدمن',
            role: 'super_admin',
            university_number: 'ADM-01',
            generated_email: 'admin@sadiq.edu.iq',
            temp_password: 'AdminPassword123!',
            is_active: true,
          };
        }
        return null;
      },
      save: () => {},
      saveAll: () => {},
      delete: () => {},
    });

    const res = await authUseCase.execute({
      identifier: 'admin@sadiq.edu.iq',
      password: 'AdminPassword123!',
    });

    assert(res.isSuccess && res.getValue().user.full_name === 'أدمن', 'توثيق حساب الأدمن بنجاح عبر UseCase');
  } catch (e) {
    assert(false, `خطأ في اختبار AuthenticateUserUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 7. اختبار التحقق من البطاقة الأكاديمية (VerifyAcademicCardUseCase)
  // ----------------------------------------------------
  try {
    const mockStudent = new Student({
      id: 'std-test-1',
      fullName: 'حيدر مهدي',
      universityNumber: UniversityNumber.create('20251001'),
      email: Email.create('haider@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-1-2',
      stageNumber: 2,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const verifyCardUseCase = new VerifyAcademicCardUseCase({
      getAll: async () => [mockStudent],
      getById: async (id: string) => (id === 'std-test-1' ? mockStudent : null),
      getByUniversityNumber: async (u: UniversityNumber) =>
        u.getValue() === '20251001' ? mockStudent : null,
      getByEmail: async () => null,
      getByDepartmentAndStage: async () => [mockStudent],
      save: async () => {},
      saveBatch: async () => {},
      delete: async () => {},
    });

    const verifyResult = await verifyCardUseCase.execute({ identifier: '20251001' });
    assert(
      verifyResult.isSuccess && verifyResult.getValue().isValid && verifyResult.getValue().student?.fullName === 'حيدر مهدي',
      'التحقق من صحة البطاقة الأكاديمية للطالب عبر الرقم الجامعي'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار VerifyAcademicCardUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 8. اختبار احتساب المعدل التراكمي (CalculateStudentGpaUseCase)
  // ----------------------------------------------------
  try {
    const mockGrade1 = new Grade({
      id: 'g1',
      studentId: 'std-test-1',
      studentName: 'حيدر مهدي',
      courseId: 'c1',
      courseName: 'البرمجة بلغة C++',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(28),
      courseworkScore: GradeScore.create(18),
      finalExamScore: GradeScore.create(44), // Total: 90 (امتياز)
    });

    const mockGrade2 = new Grade({
      id: 'g2',
      studentId: 'std-test-1',
      studentName: 'حيدر مهدي',
      courseId: 'c2',
      courseName: 'الدوائر الرقمية',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(25),
      courseworkScore: GradeScore.create(15),
      finalExamScore: GradeScore.create(40), // Total: 80 (جيد جداً)
    });

    const mockCourse1 = new Course({
      id: 'c1',
      name: 'البرمجة بلغة C++',
      code: 'CS201',
      departmentId: 'dept-1',
      stageNumber: 2,
      semester: 1,
      creditHours: 4,
      theoryHours: 2,
      practicalHours: 2,
      isActive: true,
    });

    const mockCourse2 = new Course({
      id: 'c2',
      name: 'الدوائر الرقمية',
      code: 'CS202',
      departmentId: 'dept-1',
      stageNumber: 2,
      semester: 1,
      creditHours: 3,
      theoryHours: 2,
      practicalHours: 2,
      isActive: true,
    });

    const gpaUseCase = new CalculateStudentGpaUseCase(
      {
        getByStudentAndCourse: async () => null,
        getAllByStudent: async () => [mockGrade1, mockGrade2],
        getAllByCourse: async () => [],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getAll: async () => [mockCourse1, mockCourse2],
        getById: async (id: string) => (id === 'c1' ? mockCourse1 : mockCourse2),
        getByDepartmentAndStage: async () => [mockCourse1, mockCourse2],
        save: async () => {},
        delete: async () => {},
      }
    );

    const gpaResult = await gpaUseCase.execute({ studentId: 'std-test-1' });
    assert(
      gpaResult.isSuccess &&
        gpaResult.getValue().gpaPercentage > 80 &&
        gpaResult.getValue().isEligibleForGraduation,
      'احتساب المعدل التراكمي الموزون بدقة بنجاح'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار CalculateStudentGpaUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 9. اختبار تكليف الأستاذ بالمادة (AssignTeacherToCourseUseCase)
  // ----------------------------------------------------
  try {
    const mockTeacher = new Teacher({
      id: 'tch-1',
      fullName: 'د. صادق الموسوي',
      academicTitle: 'أستاذ مساعد',
      specialization: 'ذكاء اصطناعي',
      email: Email.create('dr.sadiq@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      assignedSubjectIds: [],
      isActive: true,
    });

    const mockCourse = new Course({
      id: 'c1',
      name: 'البرمجة بلغة C++',
      code: 'CS201',
      departmentId: 'dept-1',
      stageNumber: 2,
      semester: 1,
      creditHours: 4,
      theoryHours: 2,
      practicalHours: 2,
      isActive: true,
    });

    const assignUseCase = new AssignTeacherToCourseUseCase(
      {
        getAll: async () => [mockTeacher],
        getById: async () => mockTeacher,
        getByEmail: async () => mockTeacher,
        getByDepartment: async () => [mockTeacher],
        save: async () => {},
        delete: async () => {},
      },
      {
        getAll: async () => [mockCourse],
        getById: async () => mockCourse,
        getByDepartmentAndStage: async () => [mockCourse],
        save: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const assignResult = await assignUseCase.execute({
      teacherId: 'tch-1',
      courseId: 'c1',
      assignedByUserId: 'usr-admin',
      assignedByUserName: 'أدمن',
      assignedByUserRole: 'super_admin',
    });

    assert(
      assignResult.isSuccess && mockTeacher.assignedSubjectIds.includes('c1'),
      'تكليف الأستاذ بالمادة الدراسية وتحديث كيان النطاق وسجل التدقيق'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار AssignTeacherToCourseUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 10. اختبار قفل واعتماد درجات المادة (LockCourseGradesUseCase)
  // ----------------------------------------------------
  try {
    const mockGrade = new Grade({
      id: 'g-lock-1',
      studentId: 'std-1',
      studentName: 'حيدر',
      courseId: 'c-lock',
      courseName: 'الذكاء الاصطناعي',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(30),
      finalExamScore: GradeScore.create(50),
    });

    const lockUseCase = new LockCourseGradesUseCase(
      {
        getByStudentAndCourse: async () => null,
        getAllByStudent: async () => [],
        getAllByCourse: async () => [mockGrade],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const lockResult = await lockUseCase.execute({
      courseId: 'c-lock',
      courseName: 'الذكاء الاصطناعي',
      academicYear: '2025-2026',
      lockedByUserId: 'head-1',
      lockedByUserName: 'رئيس القسم',
      lockedByUserRole: 'department_head',
    });

    assert(lockResult.isSuccess && lockResult.getValue().isLocked, 'قفل واعتماد درجات المادة بنجاح');
  } catch (e) {
    assert(false, `خطأ في اختبار LockCourseGradesUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 11. اختبار ترحيل وترقية الطلاب (PromoteStudentsUseCase)
  // ----------------------------------------------------
  try {
    const studentToPromote = new Student({
      id: 'std-prm-1',
      fullName: 'علي صادق',
      universityNumber: UniversityNumber.create('20252001'),
      email: Email.create('ali@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-1-1',
      stageNumber: 1,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const promoteUseCase = new PromoteStudentsUseCase(
      {
        getAll: async () => [studentToPromote],
        getById: async () => studentToPromote,
        getByUniversityNumber: async () => studentToPromote,
        getByEmail: async () => studentToPromote,
        getByDepartmentAndStage: async () => [studentToPromote],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const promoteResult = await promoteUseCase.execute({
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      currentStageNumber: 1,
      studentIds: ['std-prm-1'],
      promotedByUserId: 'admin-1',
      promotedByUserName: 'أدمن',
      promotedByUserRole: 'super_admin',
    });

    assert(
      promoteResult.isSuccess && studentToPromote.stageNumber === 2,
      'ترقية وترحيل الطالب للمرحلة الثانية بنجاح'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار PromoteStudentsUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 12. اختبار إدارة الأقساط الدراسية (ManageStudentTuitionUseCase)
  // ----------------------------------------------------
  try {
    const tuitionUseCase = new ManageStudentTuitionUseCase({
      getRecentLogs: async () => [],
      getByActor: async () => [],
      log: async () => {},
    });

    const tuitionResult = await tuitionUseCase.execute({
      studentId: 'std-tui-1',
      studentName: 'حسين علي',
      academicYear: '2025-2026',
      totalAnnualTuition: 1500000,
      paymentAmount: 500000,
      receiptNumber: 'RCP-2025-001',
      recordedByUserId: 'acc-1',
      recordedByUserName: 'المحاسب',
    });

    assert(
      tuitionResult.isSuccess &&
        tuitionResult.getValue().remainingAmount === 1000000 &&
        !tuitionResult.getValue().isFullyPaid,
      'تسجيل دفعة قسط دراسي واحتساب المتبقي بنجاح'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ManageStudentTuitionUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 13. اختبار موزع أحداث النطاق (DomainEventDispatcher)
  // ----------------------------------------------------
  try {
    let eventReceived = false;
    DomainEventDispatcher.subscribe<StudentCreatedEvent>('STUDENT_CREATED', (evt) => {
      if (evt.fullName === 'طالب اختبار') {
        eventReceived = true;
      }
    });

    await DomainEventDispatcher.dispatch(
      new StudentCreatedEvent('std-evt-1', 'طالب اختبار', 'test@sadiq.edu.iq', 'هندسة تقنيات الحاسوب', 1)
    );

    assert(eventReceived, 'بث واستقبال أحداث النطاق عبر DomainEventDispatcher بنجاح');
  } catch (e) {
    assert(false, `خطأ في اختبار DomainEventDispatcher: ${e}`);
  }

  // ----------------------------------------------------
  // 14. اختبار مواصفة التخرج لمسار بولونيا (StudentGraduationSpecification)
  // ----------------------------------------------------
  try {
    const gradSpec = new StudentGraduationSpecification();
    const gradStudent = new Student({
      id: 'std-grad',
      fullName: 'مصطفى كامل',
      universityNumber: UniversityNumber.create('2022001'),
      email: Email.create('mustafa@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const passedGrade = new Grade({
      id: 'g-grad-1',
      studentId: 'std-grad',
      studentName: 'مصطفى كامل',
      courseId: 'c-grad',
      courseName: 'مشروع التخرج',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(35),
      finalExamScore: GradeScore.create(55),
    });

    const isEligible = gradSpec.isSatisfiedBy({
      student: gradStudent,
      grades: [passedGrade],
      totalCompletedCredits: 240,
    });

    assert(isEligible, 'مواصفة التخرج: استيفاء الطالب لشروط التخرج (240 ECTS والمرحلة 4)');
  } catch (e) {
    assert(false, `خطأ في اختبار StudentGraduationSpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 15. اختبار مواصفة إنذارات الغياب (StudentAbsenceWarningSpecification)
  // ----------------------------------------------------
  try {
    const absenceSpec = new StudentAbsenceWarningSpecification();
    
    const records = [
      new Attendance({ id: 'a1', studentId: 's1', studentName: 'أحمد', courseId: 'c1', teacherId: 't1', date: '2026-03-01', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'a2', studentId: 's1', studentName: 'أحمد', courseId: 'c1', teacherId: 't1', date: '2026-03-02', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'a3', studentId: 's1', studentName: 'أحمد', courseId: 'c1', teacherId: 't1', date: '2026-03-03', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'a4', studentId: 's1', studentName: 'أحمد', courseId: 'c1', teacherId: 't1', date: '2026-03-04', status: 'absent', createdAt: new Date().toISOString() }),
    ];

    const evalResult = absenceSpec.evaluate({
      studentId: 's1',
      courseId: 'c1',
      attendanceRecords: records,
      totalScheduledLectures: 30,
    });

    assert(
      evalResult.isDeprived && evalResult.warningTier === 'deprived_10',
      'مواصفة الغياب: اكتشاف الحرمان الأكاديمي عند تجاوز نسبة 10% غياب بدقة'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار StudentAbsenceWarningSpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 16. اختبار مواصفة استحقاق درجات القرار (DecisionMarksEligibilitySpecification)
  // ----------------------------------------------------
  try {
    const decSpec = new DecisionMarksEligibilitySpecification();
    const mockGrade47 = new Grade({
      id: 'g-dec',
      studentId: 'std-dec',
      studentName: 'كرار',
      courseId: 'c-dec',
      courseName: 'معمارية الحاسوب',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(20),
      finalExamScore: GradeScore.create(27), // Total: 47
    });

    const isEligible = decSpec.isSatisfiedBy({
      grade: mockGrade47,
      requestedMarks: 3,
      alreadyUsedDecisionMarksThisYear: 0,
    });

    assert(isEligible, 'مواصفة درجات القرار: استحقاق الطالب لـ 3 درجات للنجاح من 47 إلى 50');
  } catch (e) {
    assert(false, `خطأ في اختبار DecisionMarksEligibilitySpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 17. اختبار تطبيق درجات القرار (ApplyDecisionMarksUseCase)
  // ----------------------------------------------------
  try {
    const mockGrade47 = new Grade({
      id: 'g-dec-2',
      studentId: 'std-dec-2',
      studentName: 'كرار',
      courseId: 'c-dec-2',
      courseName: 'معمارية الحاسوب',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(20),
      finalExamScore: GradeScore.create(27), // Total: 47
    });

    const applyDecUseCase = new ApplyDecisionMarksUseCase(
      {
        getByStudentAndCourse: async () => mockGrade47,
        getAllByStudent: async () => [mockGrade47],
        getAllByCourse: async () => [mockGrade47],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const applyResult = await applyDecUseCase.execute({
      studentId: 'std-dec-2',
      studentName: 'كرار',
      courseId: 'c-dec-2',
      courseName: 'معمارية الحاسوب',
      academicYear: '2025-2026',
      marksToGrant: 3,
      committeeHeadName: 'أ.د. رئيس اللجنة',
    });

    assert(
      applyResult.isSuccess && applyResult.getValue().updatedFinalScore === 50,
      'تطبيق درجات القرار: تعديل النتيجة لتصبح 50 (ناجح بالقرار)'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ApplyDecisionMarksUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 18. اختبار الاستيراد الجماعي للطلاب (BatchImportStudentsUseCase)
  // ----------------------------------------------------
  try {
    const batchImportUseCase = new BatchImportStudentsUseCase(
      {
        getAll: async () => [],
        getById: async () => null,
        getByUniversityNumber: async () => null,
        getByEmail: async () => null,
        getByDepartmentAndStage: async () => [],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const importResult = await batchImportUseCase.execute({
      students: [
        {
          fullName: 'زهراء جاسم',
          universityNumber: '20253001',
          email: 'zahraa@sadiq.edu.iq',
          departmentId: 'dept-1',
          departmentName: 'هندسة تقنيات الحاسوب',
          stageNumber: 1,
          shiftType: 'morning',
        },
        {
          fullName: 'حسين كاظم',
          universityNumber: '20253002',
          email: 'hussein@sadiq.edu.iq',
          departmentId: 'dept-1',
          departmentName: 'هندسة تقنيات الحاسوب',
          stageNumber: 1,
          shiftType: 'morning',
        },
      ],
      importedByUserId: 'admin-1',
      importedByUserName: 'أدمن',
      importedByUserRole: 'super_admin',
    });

    assert(
      importResult.isSuccess && importResult.getValue().totalImported === 2,
      'الاستيراد الجماعي: استيراد وتدقيق الطلاب بنجاح مع الفحص النطاقي الكامل'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار BatchImportStudentsUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 19. اختبار إصدار كشف الدرجات والوثيقة الأكاديمية (GenerateAcademicTranscriptUseCase)
  // ----------------------------------------------------
  try {
    const transcriptStudent = new Student({
      id: 'std-trans-1',
      fullName: 'علي عبد الحسين',
      universityNumber: UniversityNumber.create('20220099'),
      email: Email.create('ali.abd@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const gradeA = new Grade({
      id: 'g-trans-1',
      studentId: 'std-trans-1',
      studentName: 'علي عبد الحسين',
      courseId: 'c1',
      courseName: 'البرمجة المتقدمة',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(30),
      finalExamScore: GradeScore.create(60), // Total: 90 (امتياز)
    });

    const courseA = new Course({
      id: 'c1',
      name: 'البرمجة المتقدمة',
      code: 'CS401',
      departmentId: 'dept-1',
      stageNumber: 4,
      semester: 1,
      creditHours: 4,
      theoryHours: 2,
      practicalHours: 2,
      isActive: true,
    });

    const transcriptUseCase = new GenerateAcademicTranscriptUseCase(
      {
        getAll: async () => [transcriptStudent],
        getById: async () => transcriptStudent,
        getByUniversityNumber: async () => transcriptStudent,
        getByEmail: async () => transcriptStudent,
        getByDepartmentAndStage: async () => [transcriptStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getByStudentAndCourse: async () => gradeA,
        getAllByStudent: async () => [gradeA],
        getAllByCourse: async () => [gradeA],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getAll: async () => [courseA],
        getById: async () => courseA,
        getByDepartmentAndStage: async () => [courseA],
        save: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const transcriptResult = await transcriptUseCase.execute({
      studentId: 'std-trans-1',
      issuePurpose: 'لغرض التعيين',
      issuedByUserId: 'usr-admin',
      issuedByUserName: 'أدمن',
    });

    assert(
      transcriptResult.isSuccess &&
        transcriptResult.getValue().cumulativeGpa === 90 &&
        transcriptResult.getValue().documentNumber.startsWith('DOC-SADIQ') &&
        transcriptResult.getValue().isOfficial,
      'إصدار الوثيقة الأكاديمية: حساب المعدل التراكمي وإصدار الوثيقة المشفرة بالـ QR بنجاح'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار GenerateAcademicTranscriptUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 20. اختبار تطبيق قرارات الحرمان من الغياب (EnforceAbsenceDeprivationsUseCase)
  // ----------------------------------------------------
  try {
    const student1 = new Student({
      id: 'std-dep-1',
      fullName: 'طالب محروم',
      universityNumber: UniversityNumber.create('20258001'),
      email: Email.create('deprived@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-1',
      stageNumber: 1,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const student2 = new Student({
      id: 'std-dep-2',
      fullName: 'طالب منتظم',
      universityNumber: UniversityNumber.create('20258002'),
      email: Email.create('regular@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-1',
      stageNumber: 1,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const recordsStd1 = [
      new Attendance({ id: 'at1', studentId: 'std-dep-1', studentName: 'طالب محروم', courseId: 'c-dep', teacherId: 't1', date: '2026-03-01', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'at2', studentId: 'std-dep-1', studentName: 'طالب محروم', courseId: 'c-dep', teacherId: 't1', date: '2026-03-02', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'at3', studentId: 'std-dep-1', studentName: 'طالب محروم', courseId: 'c-dep', teacherId: 't1', date: '2026-03-03', status: 'absent', createdAt: new Date().toISOString() }),
      new Attendance({ id: 'at4', studentId: 'std-dep-1', studentName: 'طالب محروم', courseId: 'c-dep', teacherId: 't1', date: '2026-03-04', status: 'absent', createdAt: new Date().toISOString() }),
    ];

    const enforceUseCase = new EnforceAbsenceDeprivationsUseCase(
      {
        getByCourseAndDate: async () => [],
        getByStudentAndCourse: async (sId: string) => (sId === 'std-dep-1' ? recordsStd1 : []),
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getAll: async () => [student1, student2],
        getById: async () => null,
        getByUniversityNumber: async () => null,
        getByEmail: async () => null,
        getByDepartmentAndStage: async () => [student1, student2],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getByTarget: async () => [],
        save: async () => {},
        markAsRead: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const enforceResult = await enforceUseCase.execute({
      courseId: 'c-dep',
      courseName: 'الرياضيات المتقدمة',
      departmentId: 'dept-1',
      totalSemesterLectures: 30,
      enforcedByUserId: 'usr-head',
      enforcedByUserName: 'رئيس القسم',
    });

    assert(
      enforceResult.isSuccess &&
        enforceResult.getValue().deprivedCount === 1 &&
        enforceResult.getValue().totalEvaluated === 2,
      'تطبيق قرارات الحرمان: اكتشاف وحرمان الطالب المتجاوز 10% وبث الإشعارات وتوثيق التدقيق'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار EnforceAbsenceDeprivationsUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 21. اختبار مواصفة منع تعارض الامتحانات (ExamScheduleConflictSpecification)
  // ----------------------------------------------------
  try {
    const examConflictSpec = new ExamScheduleConflictSpecification();

    const existingExams = [
      {
        examId: 'ex1',
        courseId: 'c1',
        courseName: 'الرياضيات المتقدمة',
        departmentId: 'dept-1',
        stageNumber: 2,
        examDate: '2026-06-01',
        startTime: '09:00',
      },
    ];

    const conflictResult = examConflictSpec.isSatisfiedBy({
      targetDepartmentId: 'dept-1',
      targetStageNumber: 2,
      proposedExamDate: '2026-06-01',
      existingExams,
    });

    assert(!conflictResult, 'مواصفة تعارض الامتحانات: اكتشاف ومنع تعارض موعد امتحانين في نفس اليوم');

    const validSlotResult = examConflictSpec.isSatisfiedBy({
      targetDepartmentId: 'dept-1',
      targetStageNumber: 2,
      proposedExamDate: '2026-06-03',
      existingExams,
    });

    assert(validSlotResult, 'مواصفة تعارض الامتحانات: قبول موعد الامتحان في حال وجود فاصل زمني ملائم');
  } catch (e) {
    assert(false, `خطأ في اختبار ExamScheduleConflictSpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 22. اختبار معالجة براءة الذمة للتخرج (ProcessGraduationClearanceUseCase)
  // ----------------------------------------------------
  try {
    const gradStudent = new Student({
      id: 'std-clr-1',
      fullName: 'أحمد عباس',
      universityNumber: UniversityNumber.create('20220055'),
      email: Email.create('ahmed.ab@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const clearanceUseCase = new ProcessGraduationClearanceUseCase(
      {
        getAll: async () => [gradStudent],
        getById: async () => gradStudent,
        getByUniversityNumber: async () => gradStudent,
        getByEmail: async () => gradStudent,
        getByDepartmentAndStage: async () => [gradStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const clearanceResult = await clearanceUseCase.execute({
      studentId: 'std-clr-1',
      actionSection: 'department',
      decision: 'approve',
      handledByUserId: 'head-1',
      handledByUserName: 'رئيس القسم',
    });

    assert(
      clearanceResult.isSuccess &&
        clearanceResult.getValue().clearance.departmentClearance === 'cleared',
      'معالجة براءة الذمة: اعتماد براءة ذمة القسم والمختبرات وتوثيق العملية في التدقيق'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ProcessGraduationClearanceUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 23. اختبار احتساب النصاب التدريسي للأستاذ (CalculateTeacherWorkloadUseCase)
  // ----------------------------------------------------
  try {
    const teacherA = new Teacher({
      id: 'tch-load-1',
      fullName: 'د. حسين الربيعي',
      academicTitle: 'أستاذ مساعد',
      specialization: 'شبكات',
      email: Email.create('dr.hussein@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      assignedSubjectIds: ['c1', 'c2'],
      isActive: true,
    });

    const course1 = new Course({
      id: 'c1',
      name: 'شبكات الحاسوب',
      code: 'CS301',
      departmentId: 'dept-1',
      stageNumber: 3,
      semester: 1,
      creditHours: 3,
      theoryHours: 3,
      practicalHours: 2,
      isActive: true,
    });

    const course2 = new Course({
      id: 'c2',
      name: 'أمن الشبكات',
      code: 'CS402',
      departmentId: 'dept-1',
      stageNumber: 4,
      semester: 1,
      creditHours: 3,
      theoryHours: 3,
      practicalHours: 2,
      isActive: true,
    });

    const workloadUseCase = new CalculateTeacherWorkloadUseCase(
      {
        getAll: async () => [teacherA],
        getById: async () => teacherA,
        getByEmail: async () => teacherA,
        getByDepartment: async () => [teacherA],
        save: async () => {},
        delete: async () => {},
      },
      {
        getAll: async () => [course1, course2],
        getById: async (id: string) => (id === 'c1' ? course1 : course2),
        getByDepartmentAndStage: async () => [course1, course2],
        save: async () => {},
        delete: async () => {},
      }
    );

    const loadResult = await workloadUseCase.execute({
      teacherId: 'tch-load-1',
      graduationSupervisionHours: 2,
    });

    assert(
      loadResult.isSuccess &&
        loadResult.getValue().workload.totalWeeklyHours === 12 &&
        loadResult.getValue().workload.isQuotaFulfilled,
      'احتساب النصاب التدريسي: استيفاء أستاذ مساعد لـ 12 ساعة واحتساب الساعات الإضافية'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار CalculateTeacherWorkloadUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 24. اختبار دورة حياة الاعتراضات على الدرجات (Grade Appeals Lifecycle)
  // ----------------------------------------------------
  try {
    const mockGrade = new Grade({
      id: 'g-apl-1',
      studentId: 'std-apl-1',
      studentName: 'محمد علي',
      courseId: 'c-apl-1',
      courseName: 'البرمجة الشيئية',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(20),
      finalExamScore: GradeScore.create(25), // Total: 45
    });

    const submitAppealUseCase = new SubmitGradeAppealUseCase(
      {
        getByStudentAndCourse: async () => mockGrade,
        getAllByStudent: async () => [mockGrade],
        getAllByCourse: async () => [mockGrade],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const submitRes = await submitAppealUseCase.execute({
      studentId: 'std-apl-1',
      studentName: 'محمد علي',
      courseId: 'c-apl-1',
      courseName: 'البرمجة الشيئية',
      academicYear: '2025-2026',
      reason: 'يوجد خطأ في جمع درجات السؤال الرابع في الدفتر الامتحاني.',
    });

    assert(submitRes.isSuccess, 'تقديم الاعتراض: تسجيل طلب اعتراض الطالب وإحالته للجنة الامتحانية');

    const reviewAppealUseCase = new ReviewGradeAppealUseCase(
      {
        getByStudentAndCourse: async () => mockGrade,
        getAllByStudent: async () => [mockGrade],
        getAllByCourse: async () => [mockGrade],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const reviewRes = await reviewAppealUseCase.execute({
      appeal: submitRes.getValue().appeal,
      decision: 'accepted_modified',
      newScoreIfModified: 52,
      reviewerName: 'أ.د. رئيس اللجنة الامتحانية',
      notes: 'تمت مراجعة الدفتر وتصحيح خطأ الجمع وإضافة 7 درجات مستحقة.',
    });

    assert(
      reviewRes.isSuccess &&
        submitRes.getValue().appeal.status === 'accepted_modified' &&
        submitRes.getValue().appeal.modifiedScore === 52,
      'مراجعة الاعتراض: قبول الاعتراض وتعديل الدرجة رسمياً في السجلات الأكاديمية'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار Grade Appeals Lifecycle: ${e}`);
  }

  // ----------------------------------------------------
  // 25. اختبار مواصفة المتطلبات السابقة للمواد (CoursePrerequisitesSpecification)
  // ----------------------------------------------------
  try {
    const prereqSpec = new CoursePrerequisitesSpecification();

    const passedPrereqGrade = new Grade({
      id: 'g-pre-1',
      studentId: 'std-pre-1',
      studentName: 'سارة خالد',
      courseId: 'c-oop',
      courseName: 'البرمجة الشيئية',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(30),
      finalExamScore: GradeScore.create(45), // Total: 75 (ناجح)
    });

    const canEnroll = prereqSpec.isSatisfiedBy({
      targetCourseName: 'البرمجة المتقدمة',
      prerequisiteCourseIds: ['c-oop'],
      studentGrades: [passedPrereqGrade],
      requestedTotalCredits: 24,
    });
    assert(canEnroll, 'مواصفة المتطلبات السابقة: السماح بتسجيل المادة عند استيفاء المتطلب السابق والساعات');

    const exceedCredits = prereqSpec.isSatisfiedBy({
      targetCourseName: 'البرمجة المتقدمة',
      prerequisiteCourseIds: ['c-oop'],
      studentGrades: [passedPrereqGrade],
      requestedTotalCredits: 34,
    });
    assert(!exceedCredits, 'مواصفة المتطلبات السابقة: منع التسجيل عند تجاوز الساعات الحد الأقصى (30 ECTS)');
  } catch (e) {
    assert(false, `خطأ في اختبار CoursePrerequisitesSpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 26. اختبار تسجيل مادة دراسية (EnrollCourseUseCase)
  // ----------------------------------------------------
  try {
    const enrollStudent = new Student({
      id: 'std-enr-1',
      fullName: 'سارة خالد',
      universityNumber: UniversityNumber.create('20241050'),
      email: Email.create('sara.kh@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-3',
      stageNumber: 3,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const advCourse = new Course({
      id: 'c-adv',
      name: 'البرمجة المتقدمة',
      code: 'CS305',
      departmentId: 'dept-1',
      stageNumber: 3,
      semester: 1,
      creditHours: 4,
      theoryHours: 2,
      practicalHours: 2,
      isActive: true,
    });

    const enrollUseCase = new EnrollCourseUseCase(
      {
        getAll: async () => [enrollStudent],
        getById: async () => enrollStudent,
        getByUniversityNumber: async () => enrollStudent,
        getByEmail: async () => enrollStudent,
        getByDepartmentAndStage: async () => [enrollStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getAll: async () => [advCourse],
        getById: async () => advCourse,
        getByDepartmentAndStage: async () => [advCourse],
        save: async () => {},
        delete: async () => {},
      },
      {
        getByStudentAndCourse: async () => null,
        getAllByStudent: async () => [],
        getAllByCourse: async () => [],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const enrollResult = await enrollUseCase.execute({
      studentId: 'std-enr-1',
      courseId: 'c-adv',
      currentEnrolledCredits: 18,
    });

    assert(
      enrollResult.isSuccess && enrollResult.getValue().newTotalCredits === 22,
      'تسجيل مادة دراسية: نجاح تسجيل مادة البرمجة المتقدمة واحتساب الساعات الجديدة (22 ECTS)'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار EnrollCourseUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 27. اختبار تقييم الإنذار الأكاديمي لمسار بولونيا (EvaluateAcademicProbationUseCase)
  // ----------------------------------------------------
  try {
    const probationStudent = new Student({
      id: 'std-prob-1',
      fullName: 'يوسف رائد',
      universityNumber: UniversityNumber.create('20251122'),
      email: Email.create('youssef@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-2',
      stageNumber: 2,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const failedGrade1 = new Grade({
      id: 'g-f1',
      studentId: 'std-prob-1',
      studentName: 'يوسف رائد',
      courseId: 'c1',
      courseName: 'الرياضيات المتقدمة',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(15),
      finalExamScore: GradeScore.create(25), // Total: 40 (راسب)
    });

    const failedGrade2 = new Grade({
      id: 'g-f2',
      studentId: 'std-prob-1',
      studentName: 'يوسف رائد',
      courseId: 'c2',
      courseName: 'معمارية الحاسوب',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(18),
      finalExamScore: GradeScore.create(24), // Total: 42 (راسب)
    });

    const probationUseCase = new EvaluateAcademicProbationUseCase(
      {
        getAll: async () => [probationStudent],
        getById: async () => probationStudent,
        getByUniversityNumber: async () => probationStudent,
        getByEmail: async () => probationStudent,
        getByDepartmentAndStage: async () => [probationStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getByStudentAndCourse: async () => null,
        getAllByStudent: async () => [failedGrade1, failedGrade2],
        getAllByCourse: async () => [],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getByTarget: async () => [],
        save: async () => {},
        markAsRead: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const probationResult = await probationUseCase.execute({
      studentId: 'std-prob-1',
      academicYear: '2025-2026',
      evaluatedByUserId: 'adv-1',
      evaluatedByUserName: 'المرشد الأكاديمي',
    });

    assert(
      probationResult.isSuccess &&
        probationResult.getValue().isOnProbation &&
        probationResult.getValue().failedCoursesCount === 2,
      'تقييم الإنذار الأكاديمي: اكتشاف تعثر الطالب وإصدار تنبيه الإرشاد الأكاديمي وتوثيقه'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار EvaluateAcademicProbationUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 28. اختبار مواصفة السعة الاستيعابية للقاعات (RoomCapacitySpecification)
  // ----------------------------------------------------
  try {
    const roomSpec = new RoomCapacitySpecification();

    const labValid = roomSpec.isSatisfiedBy({
      roomName: 'مختبر الشبكات 1',
      maxCapacity: 20,
      enrolledStudentsCount: 18,
      isPracticalLab: true,
    });
    assert(labValid, 'مواصفة سعة القاعات: قبول التسجيل في المختبر العملي دون تجاوز السعة');

    const labExceed = roomSpec.isSatisfiedBy({
      roomName: 'مختبر الشبكات 1',
      maxCapacity: 20,
      enrolledStudentsCount: 22,
      isPracticalLab: true,
    });
    assert(!labExceed, 'مواصفة سعة القاعات: منع تجاوز السعة في المختبرات العملية نهائياً');
  } catch (e) {
    assert(false, `خطأ في اختبار RoomCapacitySpecification: ${e}`);
  }

  // ----------------------------------------------------
  // 29. اختبار استخراج وترتيب الأوائل (CalculateTopGraduatesUseCase)
  // ----------------------------------------------------
  try {
    const graduate1 = new Student({
      id: 'std-top-1',
      fullName: 'مريم علي',
      universityNumber: UniversityNumber.create('20221101'),
      email: Email.create('maryam@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const graduate2 = new Student({
      id: 'std-top-2',
      fullName: 'سامر أحمد',
      universityNumber: UniversityNumber.create('20221102'),
      email: Email.create('samer@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const gradeM = new Grade({
      id: 'g-m',
      studentId: 'std-top-1',
      studentName: 'مريم علي',
      courseId: 'c-all',
      courseName: 'مشروع التخرج',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(35),
      finalExamScore: GradeScore.create(60),
    });

    const gradeS = new Grade({
      id: 'g-s',
      studentId: 'std-top-2',
      studentName: 'سامر أحمد',
      courseId: 'c-all',
      courseName: 'مشروع التخرج',
      academicYear: '2025-2026',
      midtermScore: GradeScore.create(30),
      finalExamScore: GradeScore.create(55),
    });

    const courseGrad = new Course({
      id: 'c-all',
      name: 'مشروع التخرج',
      code: 'CS499',
      departmentId: 'dept-1',
      stageNumber: 4,
      semester: 2,
      creditHours: 6,
      theoryHours: 2,
      practicalHours: 4,
      isActive: true,
    });

    const topUseCase = new CalculateTopGraduatesUseCase(
      {
        getAll: async () => [graduate1, graduate2],
        getById: async () => null,
        getByUniversityNumber: async () => null,
        getByEmail: async () => null,
        getByDepartmentAndStage: async () => [graduate1, graduate2],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getByStudentAndCourse: async () => null,
        getAllByStudent: async (sId: string) => (sId === 'std-top-1' ? [gradeM] : [gradeS]),
        getAllByCourse: async () => [],
        save: async () => {},
        saveBatch: async () => {},
      },
      {
        getAll: async () => [courseGrad],
        getById: async () => courseGrad,
        getByDepartmentAndStage: async () => [courseGrad],
        save: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const topResult = await topUseCase.execute({
      departmentId: 'dept-1',
      graduationYear: '2025-2026',
      topLimit: 2,
      calculatedByUserId: 'usr-admin',
      calculatedByUserName: 'أدمن',
    });

    assert(
      topResult.isSuccess &&
        topResult.getValue().topGraduates.length === 2 &&
        topResult.getValue().topGraduates[0].studentName === 'مريم علي' &&
        topResult.getValue().topGraduates[0].rankPosition === 1 &&
        topResult.getValue().topGraduates[0].cumulativeGpa === 95,
      'استخراج الأوائل: تصنيف وترتيب خريجي الأوائل تنازلياً بدقة متناهية (المركز الأول: مريم علي بمعدل 95)'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار CalculateTopGraduatesUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 30. اختبار المقاصة العلمية ومعادلة المواد (ProcessModuleEquivalencyUseCase)
  // ----------------------------------------------------
  try {
    const transferStudent = new Student({
      id: 'std-tr-1',
      fullName: 'هدى كريم',
      universityNumber: UniversityNumber.create('20239901'),
      email: Email.create('huda.kareem@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-2',
      stageNumber: 2,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const localCourse = new Course({
      id: 'c-math2',
      name: 'الرياضيات الهندسية 2',
      code: 'MATH201',
      departmentId: 'dept-1',
      stageNumber: 2,
      semester: 1,
      creditHours: 3,
      theoryHours: 3,
      practicalHours: 0,
      isActive: true,
    });

    const eqvUseCase = new ProcessModuleEquivalencyUseCase(
      {
        getAll: async () => [transferStudent],
        getById: async () => transferStudent,
        getByUniversityNumber: async () => transferStudent,
        getByEmail: async () => transferStudent,
        getByDepartmentAndStage: async () => [transferStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getAll: async () => [localCourse],
        getById: async () => localCourse,
        getByDepartmentAndStage: async () => [localCourse],
        save: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const approveRes = await eqvUseCase.execute({
      studentId: 'std-tr-1',
      previousUniversityName: 'جامعة بغداد - كلية الهندسة',
      externalCourseName: 'Mathematics II',
      externalCourseGrade: 78,
      externalCredits: 3,
      targetCourseId: 'c-math2',
      syllabusMatchPercentage: 85,
      committeeHeadName: 'أ.د. رئيس اللجنة العلمية',
      notes: 'المفردات مطابقة تماماً لمفردات جامعتنا وتم تدقيق الوثيقة.',
    });

    assert(
      approveRes.isSuccess && approveRes.getValue().isExempted,
      'المقاصة العلمية: اعتماد معادلة وإعفاء المادة للنسبة 85% والدرجة 78'
    );

    const rejectRes = await eqvUseCase.execute({
      studentId: 'std-tr-1',
      previousUniversityName: 'جامعة بغداد - كلية الهندسة',
      externalCourseName: 'Physics I',
      externalCourseGrade: 70,
      externalCredits: 3,
      targetCourseId: 'c-math2',
      syllabusMatchPercentage: 60,
      committeeHeadName: 'أ.د. رئيس اللجنة العلمية',
      notes: 'المفردات غير كافية ولا تغطي المنهج.',
    });

    assert(
      rejectRes.isSuccess && !rejectRes.getValue().isExempted,
      'المقاصة العلمية: رفض المعادلة عند تدني نسبة تطابق المفردات عن 75%'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ProcessModuleEquivalencyUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 31. اختبار إدارة وتقييم مشاريع التخرج (ManageGraduationProjectUseCase)
  // ----------------------------------------------------
  try {
    const gradStudent = new Student({
      id: 'std-prj-1',
      fullName: 'عمار ياسر',
      universityNumber: UniversityNumber.create('20223344'),
      email: Email.create('ammar@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-4',
      stageNumber: 4,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const projectUseCase = new ManageGraduationProjectUseCase(
      {
        getAll: async () => [gradStudent],
        getById: async () => gradStudent,
        getByUniversityNumber: async () => gradStudent,
        getByEmail: async () => gradStudent,
        getByDepartmentAndStage: async () => [gradStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const projectRes = await projectUseCase.execute({
      title: 'نظام إدارة جامعي متكامل بالمعمارية النظيفة',
      abstractText: 'بحث تطبيقي لبناء معمارية برمجية مقاومة للأخطاء.',
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      studentIds: ['std-prj-1'],
      supervisorTeacherId: 'tch-1',
      supervisorTeacherName: 'د. صادق الموسوي',
      academicYear: '2025-2026',
      supervisorScore: 38,
      defenseScore: 54,
      committeeMembers: ['أ.د. حيدر جاسم', 'د. زينب فاضل'],
      actionType: 'grade_defense',
    });

    assert(
      projectRes.isSuccess &&
        projectRes.getValue().finalScore === 92 &&
        projectRes.getValue().project.status === 'passed_completed',
      'مشاريع التخرج: تسجيل وتقييم المشروع بنجاح وحصول الطالب على 92/100 وتوثيق قرار اللجنة'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ManageGraduationProjectUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 32. اختبار إدارة وتقييم التدريب الصيفي الميداني (ManageSummerTrainingUseCase)
  // ----------------------------------------------------
  try {
    const trainingStudent = new Student({
      id: 'std-trn-1',
      fullName: 'حسين عباس',
      universityNumber: UniversityNumber.create('20235566'),
      email: Email.create('hussein.ab@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-3',
      stageNumber: 3,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const trainingUseCase = new ManageSummerTrainingUseCase(
      {
        getAll: async () => [trainingStudent],
        getById: async () => trainingStudent,
        getByUniversityNumber: async () => trainingStudent,
        getByEmail: async () => trainingStudent,
        getByDepartmentAndStage: async () => [trainingStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    const trainingRes = await trainingUseCase.execute({
      studentId: 'std-trn-1',
      trainingOrganizationName: 'شركة زين العراق للاتصالات',
      trainingField: 'إدارة وصيانة شبكات الألياف الضوئية FTTH',
      startDate: '2026-07-01',
      endDate: '2026-08-15',
      totalWeeks: 6,
      fieldScore: 45,
      academicScore: 43,
      notes: 'أظهر الطالب التزاماً عالياً في التطبيق العملي للشبكات.',
      actionType: 'grade_academic',
      evaluatedByUserId: 'tch-trn-1',
      evaluatedByUserName: 'د. المشرف الأكاديمي',
    });

    assert(
      trainingRes.isSuccess &&
        trainingRes.getValue().isPassed &&
        trainingRes.getValue().finalScore === 88,
      'التدريب الصيفي: تسجيل وإتمام متطلب التدريب الميداني بنجاح وحصول الطالب على 88/100 وتوثيق التدقيق'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ManageSummerTrainingUseCase: ${e}`);
  }

  // ----------------------------------------------------
  // 33. اختبار إدارة معاملات التأجيل واستئناف القيد (ManageAcademicDeferralUseCase)
  // ----------------------------------------------------
  try {
    const deferralStudent = new Student({
      id: 'std-def-1',
      fullName: 'أحمد كاظم',
      universityNumber: UniversityNumber.create('20248899'),
      email: Email.create('ahmed.k@sadiq.edu.iq'),
      departmentId: 'dept-1',
      departmentName: 'هندسة تقنيات الحاسوب',
      stageId: 'stage-2',
      stageNumber: 2,
      shiftType: 'morning',
      isActive: true,
      enrolledAt: new Date().toISOString(),
    });

    const deferralUseCase = new ManageAcademicDeferralUseCase(
      {
        getAll: async () => [deferralStudent],
        getById: async () => deferralStudent,
        getByUniversityNumber: async () => deferralStudent,
        getByEmail: async () => deferralStudent,
        getByDepartmentAndStage: async () => [deferralStudent],
        save: async () => {},
        saveBatch: async () => {},
        delete: async () => {},
      },
      {
        getByTarget: async () => [],
        save: async () => {},
        markAsRead: async () => {},
      },
      {
        getRecentLogs: async () => [],
        getByActor: async () => [],
        log: async () => {},
      }
    );

    // 1. موافقة مجلس الكلية على تأجيل سنة دراسية -> تجميد قيد الطالب
    const approveDeferralRes = await deferralUseCase.execute({
      studentId: 'std-def-1',
      deferralType: 'year_deferral',
      academicYear: '2025-2026',
      reason: 'ظرف صحي مثبت بالتقرير الطبي من اللجنة الطبية المتخصصة.',
      actionType: 'approve_decision',
      boardDecisionNumber: 'BOARD-2026-DEC-45',
      boardNotes: 'تمت الموافقة وتجميد القيد دون أن يُحسب رسوباً.',
      handledByUserId: 'sec-board-1',
      handledByUserName: 'أمين مجلس الكلية',
    });

    assert(
      approveDeferralRes.isSuccess &&
        !deferralStudent.isActive &&
        approveDeferralRes.getValue().deferral.status === 'approved_by_board',
      'التأجيل الأكاديمي: اعتماد قرار مجلس الكلية بتأجيل العام الدراسي وتجميد قيد الطالب'
    );

    // 2. استئناف وإعادة القيد للعام القادم -> تنشيط قيد الطالب
    const resumeRes = await deferralUseCase.execute({
      studentId: 'std-def-1',
      deferralType: 'resume_study',
      academicYear: '2026-2027',
      reason: 'انتهاء فترة الإجازة المرضية والرغبة في استئناف الدوام.',
      actionType: 'approve_decision',
      boardDecisionNumber: 'BOARD-2027-RESUME-12',
      boardNotes: 'تمت الموافقة على المباشرة بالدراسة.',
      handledByUserId: 'sec-board-1',
      handledByUserName: 'أمين مجلس الكلية',
    });

    assert(
      resumeRes.isSuccess && deferralStudent.isActive,
      'استئناف القيد: إعادة تنشيط قيد الطالب بعد انتهاء فترة التأجيل رسمياً'
    );
  } catch (e) {
    assert(false, `خطأ في اختبار ManageAcademicDeferralUseCase: ${e}`);
  }

  console.log('\n====================================================');
  console.log(`📊 نتيجة الفحص الإجمالية: ${passedTests} ناجح | ${failedTests} فاشل`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runCleanArchitectureTests().catch((err) => {
  console.error('❌ خطأ فادح أثناء تشغيل الفحوصات:', err);
  process.exit(1);
});
