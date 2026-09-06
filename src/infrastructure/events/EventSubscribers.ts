// 🎧 مشتركو ومستمعو أحداث النطاق (Domain Event Subscribers) - Clean Architecture
// 🏛️ تطبيق نمط Observer Pattern وفك الارتباط التام بين الوحدات البرمجية

// 📜 استيراد موزع الأحداث والأحداث النطاقية
import { DomainEventDispatcher } from '@/core/domain/events/DomainEventDispatcher';
import { StudentCreatedEvent } from '@/core/domain/events/student/StudentEvents';
import { CourseGradesLockedEvent } from '@/core/domain/events/grade/GradeEvents';
import { StudentMarkedAbsentEvent } from '@/core/domain/events/attendance/AttendanceEvents';

// 🧱 استيراد الحاوية للوصول للخدمات ومستودعات الإشعارات والتدقيق
import { notificationRepository, auditLogRepository } from '../container';
import { Notification } from '@/core/domain/entities/Notification';
import { ActivityLog } from '@/core/domain/entities/ActivityLog';

// ⚙️ دالة تهيئة وتسجيل كافة المستمعين (Initialize All Event Handlers)
export function registerAllDomainEventSubscribers(): void {
  // 🧹 مسح المعالجات القديمة لمنع التكرار
  DomainEventDispatcher.clearHandlers();

  // 1️⃣ مستمع حدث إنشاء وقبول طالب جديد
  DomainEventDispatcher.subscribe<StudentCreatedEvent>('STUDENT_CREATED', async (event) => {
    // 🔔 إنشاء إشعار ترحيبي
    const welcomeNotif = new Notification({
      id: `notif-welcome-${Date.now()}`,
      title: 'مرحباً بك في المنظومة الأكاديمية 🎓',
      message: `أهلاً بالطالب (${event.fullName}) في قسم (${event.departmentName}) - المرحلة ${event.stageNumber}. تم تفعيل حسابك بنجاح.`,
      type: 'academic',
      targetRole: 'students',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    await notificationRepository.save(welcomeNotif);

    // 📜 تسجيل بالتدقيق
    const log = new ActivityLog({
      id: `act-evt-std-${Date.now()}`,
      actorId: 'system-event',
      actorName: 'النظام الأوتوماتيكي',
      actorRole: 'system',
      action: 'EVENT_STUDENT_CREATED',
      targetResource: event.fullName,
      details: `تم بث ومعالجة حدث إنشاء الطالب (${event.fullName}) بنجاح.`,
      timestamp: new Date().toISOString(),
    });
    await auditLogRepository.log(log);
  });

  // 2️⃣ مستمع حدث قفل واعتماد درجات المادة
  DomainEventDispatcher.subscribe<CourseGradesLockedEvent>('COURSE_GRADES_LOCKED', async (event) => {
    // 📢 تعميم إشعار لكافة الطلاب بإعلان السعيات
    const lockNotif = new Notification({
      id: `notif-lock-${Date.now()}`,
      title: 'إعلان واعتماد السعيات النهائية 📊',
      message: `تم رسمياً اعتماد وقفل درجات مادة (${event.courseName}) لـ ${event.totalStudentsCount} طالب من قبل (${event.lockedBy}).`,
      type: 'academic',
      targetRole: 'students',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    await notificationRepository.save(lockNotif);
  });

  // 3️⃣ مستمع حدث تسجيل غياب طالب
  DomainEventDispatcher.subscribe<StudentMarkedAbsentEvent>('STUDENT_MARKED_ABSENT', async (event) => {
    const absentNotif = new Notification({
      id: `notif-abs-${Date.now()}-${event.studentId}`,
      title: 'تنبيه تسجيل غياب ⚠️',
      message: `تم تسجيل غياب للطالب (${event.studentName}) في مادة (${event.courseName}) بتاريخ (${event.date}).`,
      type: 'attendance',
      targetRole: 'students',
      createdAt: new Date().toISOString(),
      isRead: false,
    });
    await notificationRepository.save(absentNotif);
  });
}
