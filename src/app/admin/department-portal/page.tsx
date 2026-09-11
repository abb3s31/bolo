'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🏢 لوحة إدارة القسم المركزية (رئيس القسم والمقرر) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
// 🛡️ معمارية مفككة ومطورة بنمطية صارمة خالية 100% من أخطاء الأنواع و any و unknown
// 👨‍🏫 تم تفكيك وإعادة هيكلة كود البوابة إلى 5 خطافات مخصصة (Custom Hooks) ومكونات مستقلة

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'; // 🔗 خطافات رياكت لإدارة الحالة والذاكرة المؤقتة والمراجع
import { useRouter } from 'next/navigation'; // 🛣️ موجه المسارات
import {
  getStoredData,
  saveStoredData,
  INITIAL_PROFILES,
  INITIAL_DEPARTMENTS,
  INITIAL_COURSES,
  INITIAL_TEACHER_COURSES,
  INITIAL_GRADES,
  INITIAL_SCHEDULE_LECTURES,
  INITIAL_SCHEDULE_CONFIGS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_EXCUSE_REQUESTS,
  INITIAL_FINAL_EXAM_SCHEDULES,
  INITIAL_FINAL_EXAM_SLOTS,
  INITIAL_TUITION_RECORDS,
  getAcademicYear,
  formatAcademicYearDisplay,
} from '@/lib/mock-data'; // 💾 التخزين والمولدات
import {
  getCurrentSessionUser,
  syncFullDepartmentPortalData,
  syncScheduleLecturesFromSupabase,
  saveCampusAnnouncementToSupabase,
  deleteCampusAnnouncementFromSupabase,
  saveTuitionRecordToSupabase,
  subscribeToAcademicYearChanges,
  syncAttendanceRecordsFromSupabase,
  saveMultipleAttendanceRecordsToSupabase, // ☁️ حفظ ومزامنة سجلات الحضور المتعددة في السحابة
  deleteTeacherCourseFromSupabase, // ☁️ حذف التكليفات الزائدة والمكررة سحابياً
  saveTeacherCourseToSupabase, // ☁️ حفظ ومزامنة التكليفات المدمجة في السحابة
} from '@/lib/supabase-client'; // 🔌 الجلسة الحالية ومزامنة السحابة
import type {
  UserProfile,
  Department,
  Course,
  TeacherCourse,
  Grade,
  AssessmentScheme,
  ScheduleLecture,
  DepartmentScheduleConfig,
  StudentAttendanceRecord,
  AttendanceWarningStatus,
  AttendanceExcuseRequest,
  FinalExamSchedule,
  FinalExamSlot,
  StudentTuitionRecord,
  CampusAnnouncement,
} from '@/types'; // 🔗 واجهات الأنواع المعتمدة بدون كود ميت
import {
  calculateCourseworkTotal,
  getCourseAssessmentScheme,
  getStageNameInArabic,
  calculateFinalTotal,
  getLetterGrade,
  getDefaultAssessmentScheme, // ⚙️ دالة توليد مخطط التقييم الافتراضي لبولونيا
} from '@/lib/grade-utils'; // 🧮 دوال حسابات الدرجات وأسماء المراحل المعتمدة
import { calculateStudentCourseAttendance } from '@/lib/attendance-utils'; // 📋 دوال وضوابط الغياب لمسار بولونيا
import { calculateDateForAnyDayInWeek, generateAll15WeeksDates } from '@/lib/schedule-utils'; // 🕒 حسابات وتواريخ الجدول الأسبوعي
import { exportCustomGradesList, exportCustomAttendanceList } from '@/lib/excel-utils'; // 📊 دوال تصدير Excel
import ConfirmDeleteModal, { type ConfirmModalIcon } from '@/components/ConfirmDeleteModal'; // 🗑️ كارد الحذف الاحترافي الفاخر
import ZeroTrustGuard from '@/components/security/ZeroTrustGuard'; // 🛡️ حارس أمان Zero Trust

// 🧩 استيراد المكونات التبويبية والمودالات المستقلة
import DepartmentPortalHeader from '@/components/department-portal/DepartmentPortalHeader'; // 🏛️ هيدر بوابة القسم
import DepartmentTeachersTab from '@/components/department-portal/tabs/DepartmentTeachersTab'; // 👨‍🏫 تبويب الأساتذة
import DepartmentStudentsTab from '@/components/department-portal/tabs/DepartmentStudentsTab'; // 🎓 تبويب الطلاب
import DepartmentCoursesTab from '@/components/department-portal/tabs/DepartmentCoursesTab'; // 📚 تبويب المواد
import DepartmentAssignmentsTab from '@/components/department-portal/tabs/DepartmentAssignmentsTab'; // 🔄 تبويب التكليفات
import DepartmentGradesTab from '@/components/department-portal/tabs/DepartmentGradesTab'; // 📝 تبويب الدرجات
import DepartmentScheduleTab from '@/components/department-portal/tabs/DepartmentScheduleTab'; // 🕒 تبويب الجدول
import DepartmentAttendanceTab from '@/components/department-portal/tabs/DepartmentAttendanceTab'; // 📋 تبويب الحضور
import DepartmentAnalyticsTab from '@/components/department-portal/tabs/DepartmentAnalyticsTab'; // 📊 تبويب التحليلات

import AssessmentSchemeModal from '@/components/department-portal/modals/AssessmentSchemeModal'; // 🎛️ مودال توزيع درجات بولونيا
import FinalExamScheduleEditor from '@/components/exams/FinalExamScheduleEditor'; // 📝 محرر جداول الامتحانات
import { DepartmentAssessmentsOverview } from '@/components/assessments/DepartmentAssessmentsOverview'; // 📚 لوحة التكليفات والامتحانات
import TuitionManagementTab from '@/components/tuition/TuitionManagementTab'; // 💳 لوحة الأقساط
import MasterHallMatrixModal from '@/components/schedule/MasterHallMatrixModal'; // 🏛️ مصفوفة القاعات
import DepartmentExcelModals from '@/components/department-portal/modals/DepartmentExcelModals'; // 📊 مودالات الإكسل
import ExcuseRequestsReviewModal from '@/components/attendance/ExcuseRequestsReviewModal'; // 📑 مودال الإجازات
import RoundConfirmModal from '@/components/department-portal/modals/RoundConfirmModal'; // 🔒 مودال فتح/غلق الأدوار
import DepartmentDurationSettingsModal from '@/components/attendance/DepartmentDurationSettingsModal'; // ⚙️ مودال مدة المحاضرات
import DepartmentPrintModals from '@/components/department-portal/modals/DepartmentPrintModals'; // 🖨️ مودالات الطباعة
import TeacherCourseAssignModal from '@/components/department-portal/modals/TeacherCourseAssignModal'; // 👨‍🏫 مودال تكليف الأستاذ
import SemesterDateConfirmModal from '@/components/department-portal/modals/SemesterDateConfirmModal'; // 📅 مودال تأكيد تاريخ الفصل
import DepartmentAccountCardModal from '@/components/department-portal/modals/DepartmentAccountCardModal'; // 📇 بطاقة الحساب الأكاديمي
import AttendanceNoticeModal, { type AttendanceNoticeCategory } from '@/components/attendance/AttendanceNoticeModal'; // 📢 مودال تبليغات الحضور

// 🎣 استيراد الخطافات الخمسة المخصصة لإدارة منطق القسم الأكاديمي
import { useDepartmentTeachers } from '@/components/department-portal/hooks/useDepartmentTeachers'; // 👨‍🏫 خطاف الأساتذة
import { useDepartmentStudents } from '@/components/department-portal/hooks/useDepartmentStudents'; // 🎓 خطاف الطلبة
import { useDepartmentCourses } from '@/components/department-portal/hooks/useDepartmentCourses'; // 📚 خطاف المواد
import { useDepartmentAssignments } from '@/components/department-portal/hooks/useDepartmentAssignments'; // 🔗 خطاف التكليفات
import { useDepartmentSchedule } from '@/components/department-portal/hooks/useDepartmentSchedule'; // 🗓️ خطاف الجدول

import { calculateSmartDropdownPosition } from '@/components/department-portal/dropdownUtils'; // 📐 حساب الموضع الذكي للمنسدلات
import type { DepartmentAdminTab, DepartmentDeleteModalConfig } from '@/components/department-portal/types'; // 🏷️ استيراد الأنواع المشتركة للوحة الإدارة محلياً
export type { DepartmentAdminTab, DepartmentDeleteModalConfig }; // 📑 إعادة تصدير الأنواع المشتركة لضمان التوافقية الكاملة مع المكونات الأخرى

// 📋 مصفوفة التبويبات الـ 11 المعتمدة للتحقق الصارم ومنع القيم غير المعروفة
const VALID_ADMIN_TABS: readonly DepartmentAdminTab[] = [
  'teachers',
  'students',
  'courses',
  'assignments',
  'grades',
  'schedule',
  'attendance',
  'exams',
  'course_tasks',
  'tuition',
  'analytics'
] as const;

// 🏷️ عناوين ونصوص التبويبات لتحديث عنوان نافذة المتصفح ديناميكياً
const ADMIN_TAB_TITLES: Record<DepartmentAdminTab, string> = {
  teachers: 'كادر التدريسيين',
  students: 'شؤون الطلبة',
  courses: 'المناهج والمقررات',
  assignments: 'تكليفات الأساتذة',
  grades: 'سجل الدرجات والسعي',
  schedule: 'الجدول الأسبوعي',
  attendance: 'الحضور والغيابات',
  exams: 'الامتحانات النهائية',
  course_tasks: 'التكليفات والامتحانات الفصلية',
  tuition: 'الأقساط الدراسية',
  analytics: 'التحليلات والإحصائيات'
};

// 🔤 دالة مساعدة لتطبيع وتنظيف النصوص العربية لإزالة الفروقات الإملائية
function normalizeArabicText(s?: string): string {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[^\p{L}\p{N}]/gu, '');
}


export function reconcileCoursesWithTeacherCourses(
  currentCourses: Course[], // 📋 لستة المواد الحالية مالت القسم
  currentTCs: TeacherCourse[], // 📝 لستة سجلات التكليفات الحالية
  allProfiles: UserProfile[] // 👤 لستة بروفايلات الأساتذة بالجامعة
): { reconciledCourses: Course[]; reconciledTCs: TeacherCourse[]; hasChanges: boolean } {
  let hasChanges: boolean = false; // 🚩 علم يوضح إذا صار أي تغيير يستوجب الحفظ
  const tcMap: Map<string, TeacherCourse> = new Map<string, TeacherCourse>(); // 🗺️ خريطة نجمع بيها التكليفات حسب المعرف الفريد
  currentTCs.forEach((tc: TeacherCourse) => tcMap.set(tc.id, tc)); // ➕ ننزل التكليفات الحالية بالخريطة

  // 1️⃣ تحديث وإثراء المواد وتوفيق صفة التكليف (نظري فقط / عملي فقط / نظري وعملي)
  const updatedCourses: Course[] = currentCourses.map((c: Course): Course => {
    let thId: string | undefined = c.theory_teacher_id; // 🔑 أيدي أستاذ النظري المسجل بالمادة
    let thName: string | undefined = c.theory_teacher_name; // 👤 اسم أستاذ النظري
    let prId: string | undefined = c.practical_teacher_id; // 🔑 أيدي أستاذ العملي
    let prName: string | undefined = c.practical_teacher_name; // 🧪 اسم أستاذ العملي
    const isPracticalCourse = c.course_type === 'theory_and_practical' || Boolean(c.has_practical); // 🔬 هل المادة بيها مختبر وجانب عملي؟

    // مطابقة الأسماء من البروفايلات إذا المعرفات متوفرة بس الأسماء فارغة
    if (thId && !thName) { // 🔍 إذا أيدي النظري موجود والاسم فارغ
      const p: UserProfile | undefined = allProfiles.find((prof: UserProfile): boolean => prof.id === thId); // 👤 ندور على بروفايل الأستاذ
      if (p) { // ✅ لكينا البروفايل مالته
        thName = p.full_name; // 📝 نثبت اسمه الكامل
        hasChanges = true; // 🚩 نسجل اكو تعديل صار
      }
    }
    if (prId && !prName) { // 🔍 إذا أيدي العملي موجود والاسم فارغ
      const p: UserProfile | undefined = allProfiles.find((prof: UserProfile): boolean => prof.id === prId); // 👤 ندور على بروفايل أستاذ العملي
      if (p) { // ✅ لكينا البروفايل مالته
        prName = p.full_name; // 📝 نثبت اسمه الكامل
        hasChanges = true; // 🚩 نسجل اكو تعديل صار
      }
    }

    // إذا المادة ما بيها عملي (نظري فقط)، نفرغ خانات العملي حتى لا تسوي خربطة
    if (!isPracticalCourse && (prId || prName)) { // 🚫 مادة نظري بس مسجل بيها عملي
      prId = undefined; // 🧹 نفرغ أيدي العملي
      prName = undefined; // 🧹 نفرغ اسم أستاذ العملي
      hasChanges = true; // 🚩 نسجل اكو تعديل صار
    }

    // جلب التكليفات المسجلة حالياً لهالمادة من الخريطة
    const courseAssignments: TeacherCourse[] = Array.from(tcMap.values()).filter(
      (tc: TeacherCourse): boolean => tc.course_id === c.id
    ); // 📋 نجيب كل تكليفات هالمادة الموجودة بالخريطة

    // 🌟 دمج وحذف التكرار لنفس الأستاذ في نفس المادة (إذا عنده تكليفين نظري وعملي ندمجهم بواحد)
    const teacherAssignmentsMap = new Map<string, TeacherCourse[]>(); // 🗂️ خريطة نجمع بيها تكليفات كل أستاذ بهالمادة
    courseAssignments.forEach((tc: TeacherCourse) => { // 🔄 نفتر على كل تكليف للمادة
      const list = teacherAssignmentsMap.get(tc.teacher_id) || []; // 📑 نجيب لستة تكليفات هالأستاذ
      list.push(tc); // ➕ نضيف التكليف للقائمة
      teacherAssignmentsMap.set(tc.teacher_id, list); // 💾 نخزن القائمة بالخريطة
    });

    teacherAssignmentsMap.forEach((assignments: TeacherCourse[]) => { // 🔄 نفحص سجلات كل أستاذ
      if (assignments.length > 1) { // ⚠️ إذا الأستاذ مسجل بأكثر من تكليف لنفس المادة
        const primaryTC = assignments[0]; // 🥇 نعتمد أول سجل كأساس ندمج بيه
        const redundantTCs = assignments.slice(1); // 🗑️ السجلات الزايدة المكررة حتى نحذفها

        redundantTCs.forEach((redundant: TeacherCourse) => { // 🔄 نفتر على السجلات الزايدة
          tcMap.delete(redundant.id); // 🧹 نحذف السجل المكرر من الخريطة
          deleteTeacherCourseFromSupabase(redundant.id); // ☁️ نحذفه من قاعدة بيانات سوبابيس فوراً
        });

        // تحويل السجل الأساسي إلى 'both' (مكلف نظري وعملي) إذا المادة عملية
        const unifiedRole: 'theory' | 'practical' | 'both' = isPracticalCourse ? 'both' : 'theory'; // 🏷️ نحدد الدور الموحد
        const consolidatedTC: TeacherCourse = { // 📦 نبني السجل الموحد النظيف
          ...primaryTC, // 📋 نحافظ على البيانات الأساسية
          role_in_course: unifiedRole, // 🌟 نخليه مكلف نظري وعملي سوية
          course_name: c.name, // 📖 اسم المادة المحدث
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الفصل الدراسي
        };
        tcMap.set(consolidatedTC.id, consolidatedTC); // 💾 نحفظ السجل الموحد بالخريطة
        saveTeacherCourseToSupabase(consolidatedTC); // ☁️ نحدثه بسوبابيس
        hasChanges = true; // 🚩 نسجل اكو تعديل صار
      }
    });

    // 🌟 جلب التكليفات بعد التنظيف والدمج
    const freshCourseAssignments: TeacherCourse[] = Array.from(tcMap.values()).filter(
      (tc: TeacherCourse): boolean => tc.course_id === c.id
    ); // 📋 نجيب التكليفات النظيفة بعد الدمج

    // إذا المادة ما محدد بيها أستاذ نظري، نستعين بالتكليفات المسجلة لملئها
    if (!thId && freshCourseAssignments.length > 0) { // 🔍 إذا أستاذ النظري مجهول واكو تكليف مسجل
      const bothOrTheory = freshCourseAssignments.find( // 🔎 ندور على تكليف نظري أو مشترك
        (tc: TeacherCourse): boolean => tc.role_in_course === 'both' || tc.role_in_course === 'theory'
      );
      if (bothOrTheory) { // ✅ لكينا تكليف
        thId = bothOrTheory.teacher_id; // 🔑 نعتمد أيدي هالأستاذ للنظري
        thName = bothOrTheory.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === bothOrTheory.teacher_id)?.full_name || 'أستاذ المادة'; // 👤 نعتمد اسمه
        hasChanges = true; // 🚩 نسجل تعديل
      }
    }

    // إذا المادة عملية وما محدد أستاذ عملي، نستعين بالتكليفات
    if (isPracticalCourse && !prId && freshCourseAssignments.length > 0) { // 🔍 إذا أستاذ العملي مجهول واكو تكليفات
      const bothTC = freshCourseAssignments.find((tc: TeacherCourse): boolean => tc.role_in_course === 'both'); // 🔎 فحص تكليف مشترك
      if (bothTC) { // ✅ لكينا تكليف مشترك
        prId = bothTC.teacher_id; // 🔑 نعتمد نفس الأستاذ للعملي
        prName = bothTC.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === bothTC.teacher_id)?.full_name || 'أستاذ العملي'; // 🧪 نعتمد اسمه
        hasChanges = true; // 🚩 نسجل تعديل
      } else { // 🔍 ماكو مشترك ندور على عملي مخصص
        const practicalTC = freshCourseAssignments.find((tc: TeacherCourse): boolean => tc.role_in_course === 'practical'); // 🔎 تكليف عملي
        if (practicalTC) { // ✅ لكينا أستاذ عملي
          prId = practicalTC.teacher_id; // 🔑 نعتمد أيديه للعملي
          prName = practicalTC.teacher_name || allProfiles.find((p: UserProfile): boolean => p.id === practicalTC.teacher_id)?.full_name || 'أستاذ العملي'; // 🧪 نعتمد اسمه
          hasChanges = true; // 🚩 نسجل تعديل
        }
      }
    }

    // 🌟 توفيق ومطابقة أدوار التكليفات في tcMap مع أساتذة المادة الحاليين ومسح التكليفات القديمة المعلقة
    freshCourseAssignments.forEach((tc: TeacherCourse) => { // 🔄 نفتر على التكليفات الحالية للمادة
      const isTh = Boolean(thId && tc.teacher_id === thId); // 🔍 هل التكليف لأستاذ النظري؟
      const isPr = Boolean(isPracticalCourse && prId && tc.teacher_id === prId); // 🔍 هل التكليف لأستاذ العملي؟

      if (!isTh && !isPr) { // ⚠️ تكليف مال أستاذ قديم تم استبداله بالمادة
        tcMap.delete(tc.id); // 🧹 نشيله من الخريطة حتى لا يرجع يظهر
        deleteTeacherCourseFromSupabase(tc.id); // ☁️ نحذفه من سوبابيس
        hasChanges = true; // 🚩 نسجل تعديل
        return; // ⏭️ نروح للتكليف الوراه
      }

      let expectedRole: 'theory' | 'practical' | 'both' = 'theory'; // 🏷️ نحدد الدور اللي لازم يكون عليه
      if (!isPracticalCourse) { // 📘 مادة نظري فقط
        expectedRole = 'theory'; // 📖 نظري فقط حتماً
      } else if (isTh && isPr) { // 🌟 الأستاذ نفسه للنظري والعملي
        expectedRole = 'both'; // ✨ مكلف نظري وعملي معاً
      } else if (isPr) { // 🔬 مكلف عملي فقط
        expectedRole = 'practical'; // 🧪 عملي
      } else { // 📘 مكلف نظري فقط
        expectedRole = 'theory'; // 📖 نظري
      }

      if (tc.role_in_course !== expectedRole || tc.course_name !== c.name) { // 🔄 إذا الدور مو مطابق للواقع الأكاديمي
        const updatedRecord: TeacherCourse = { // 📦 نسوي سجل تكليف مصحح
          ...tc, // 📋 بيانات السجل
          role_in_course: expectedRole, // 🏷️ الدور الموحد الصح
          course_name: c.name, // 📖 اسم المادة المحدث
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الفصل
        };
        tcMap.set(tc.id, updatedRecord); // 💾 نحدث الخريطة
        saveTeacherCourseToSupabase(updatedRecord); // ☁️ نحدث سوبابيس
        hasChanges = true; // 🚩 نسجل تعديل
      }
    });

    // 🌟 إنشاء تكليفات للأساتذة المعينين بالمادة إذا ما عدهم سجل تكليف أصلاً
    if (thId) { // 🔍 إذا المادة بيها أستاذ نظري
      const hasThAssignment = Array.from(tcMap.values()).some( // 📋 نفحص إذا عنده تكليف بهالمادة
        (tc: TeacherCourse): boolean => tc.course_id === c.id && tc.teacher_id === thId
      );
      if (!hasThAssignment) { // ❌ ما عنده تكليف مسجل
        const teacherProf: UserProfile | undefined = allProfiles.find((p: UserProfile): boolean => p.id === thId); // 👤 نجيب بروفايله
        const role: 'theory' | 'both' = (prId === thId && isPracticalCourse) ? 'both' : 'theory'; // 🏷️ نظري وعملي أو نظري فقط
        const newTC: TeacherCourse = { // 📝 نبني سجل تكليف جديد
          id: `tc-th-${c.id}-${thId}`, // 🆔 معرف فريد
          teacher_id: thId, // 🔑 معرف الأستاذ
          teacher_name: thName || teacherProf?.full_name || 'أستاذ المادة', // 👤 اسم الأستاذ
          course_id: c.id, // 📖 معرف المادة
          course_name: c.name, // 📖 اسم المادة
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الفصل
          role_in_course: role, // 🏷️ صفة التكليف
          created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
        };
        tcMap.set(newTC.id, newTC); // 💾 نضيفه للخريطة
        saveTeacherCourseToSupabase(newTC); // ☁️ نحفظه بسوبابيس
        hasChanges = true; // 🚩 نسجل تعديل
      }
    }

    if (isPracticalCourse && prId && prId !== thId) { // 🔍 إذا اكو أستاذ عملي مختلف عن النظري
      const hasPrAssignment = Array.from(tcMap.values()).some( // 📋 نفحص إذا عنده تكليف بهالمادة
        (tc: TeacherCourse): boolean => tc.course_id === c.id && tc.teacher_id === prId
      );
      if (!hasPrAssignment) { // ❌ ما عنده تكليف عملي مسجل
        const teacherProf: UserProfile | undefined = allProfiles.find((p: UserProfile): boolean => p.id === prId); // 👤 نجيب بروفايله
        const newTC: TeacherCourse = { // 📝 نبني سجل تكليف عملي
          id: `tc-pr-${c.id}-${prId}`, // 🆔 معرف فريد
          teacher_id: prId, // 🔑 معرف أستاذ العملي
          teacher_name: prName || teacherProf?.full_name || 'أستاذ العملي', // 🧪 اسم أستاذ العملي
          course_id: c.id, // 📖 معرف المادة
          course_name: c.name, // 📖 اسم المادة
          department_id: c.department_id, // 🏢 معرف القسم
          semester: c.semester || 1, // 🗓️ الفصل
          role_in_course: 'practical', // 🏷️ عملي فقط
          created_at: new Date().toISOString(), // ⏰ تاريخ التكليف
        };
        tcMap.set(newTC.id, newTC); // 💾 نضيفه للخريطة
        saveTeacherCourseToSupabase(newTC); // ☁️ نحفظه بسوبابيس
        hasChanges = true; // 🚩 نسجل تعديل
      }
    }

    // إرجاع كائن المادة المحدث إذا صار تغيير بالأسماء أو المعرفات
    if (thId !== c.theory_teacher_id || thName !== c.theory_teacher_name || prId !== c.practical_teacher_id || prName !== c.practical_teacher_name) { // 🔍 هل صار أي تعديل؟
      return { // 📦 نرجع المادة محدثة
        ...c, // 📋 بيانات المادة
        theory_teacher_id: thId, // 🔑 أيدي النظري المحدث
        theory_teacher_name: thName, // 👤 اسم النظري المحدث
        practical_teacher_id: prId, // 🔑 أيدي العملي المحدث
        practical_teacher_name: prName, // 🧪 اسم العملي المحدث
      };
    }
    return c; // 📋 نخلي المادة مثل ما هي إذا ما بيها تغيير
  });

  const reconciledTCs: TeacherCourse[] = Array.from(tcMap.values()); // 📋 نحول الخريطة إلى مصفوفة تكليفات
  return { // 🚀 نرجع النتيجة المحدثة والمتوافقة 100%
    reconciledCourses: updatedCourses, // 📚 المواد بعد التوفيق
    reconciledTCs, // 👥 التكليفات الموحدة والنظيفة
    hasChanges, // 🚩 علم التغييرات
  };
}

export default function DepartmentPortalPage() {
  const router = useRouter(); // 🛣️ موجه المسارات
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // 👤 بيانات المستخدم الحالي المسجل
  const [activeTab, setActiveTab] = useState<DepartmentAdminTab>('teachers'); // 📑 التبويب النشط الافتراضي
  const [isMounted, setIsMounted] = useState<boolean>(false); // 🌐 حالة تأكيد تثبيت واجهة العميل لتجنب تعارض الـ Hydration
  useEffect(() => {
    setIsMounted(true); // ⚡ تفعيل الجاهزية فور اكتمال أول ريندر بالمتصفح
  }, []);

  // 💾 مخازن البيانات الأكاديمية المركزية للقسم
  const [profiles, setProfiles] = useState<UserProfile[]>([]); // 👥 كادر وحسابات النظام
  const [departments, setDepartments] = useState<Department[]>([]); // 🏢 كافة أقسام الكلية
  const [courses, setCourses] = useState<Course[]>([]); // 📚 المواد والمناهج
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]); // 🔗 تكليفات التدريسيين بالمواد
  const [grades, setGrades] = useState<Grade[]>([]); // 📊 سجلات الدرجات والسعي
  const [scheduleLectures, setScheduleLectures] = useState<ScheduleLecture[]>([]); // 📋 محاضرات الجدول الأسبوعي
  const [scheduleConfigs, setScheduleConfigs] = useState<DepartmentScheduleConfig[]>([]); // ⚙️ إعدادات الجدول والدوام
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]); // 📋 سجلات الحضور والغيابات
  const [tuitionRecords, setTuitionRecords] = useState<StudentTuitionRecord[]>([]); // 💳 سجلات الأقساط الدراسية
  const [campusAnnouncements, setCampusAnnouncements] = useState<CampusAnnouncement[]>([]); // 📢 التعميمات الرسمية
  const [excuseRequests, setExcuseRequests] = useState<AttendanceExcuseRequest[]>([]); // 📑 طلبات الإجازات والأعذار
  const [finalExamSchedules, setFinalExamSchedules] = useState<FinalExamSchedule[]>([]); // 📑 جداول الامتحانات النهائية
  const [finalExamSlots, setFinalExamSlots] = useState<FinalExamSlot[]>([]); // ⏰ فترات الامتحانات النهائية

  // 🗓️ العام الدراسي المتزامن حياً مع المسؤول العام
  const [academicYear, setAcademicYear] = useState<string>(() => getAcademicYear());

  // 🏢 معرف القسم المدار حالياً
  const [currentDeptId, setCurrentDeptId] = useState<string>('');

  // 🏢 معلومات القسم المدار حالياً
  const currentDepartment = useMemo(() => {
    return departments.find((d: Department) => d.id === currentDeptId) || departments[0];
  }, [departments, currentDeptId]);

  const deptName = currentDepartment?.name || 'القسم الأكاديمي';

  // 👤 استخراج بروفايل أو اسم رئيس القسم الحالي بدقة فائقة مع دعم كافة المصادر المتاحة
  const currentHead: UserProfile | undefined = useMemo(() => {
    if (!currentDeptId) return undefined; // 🛑 إذا ماكو معرف قسم نرجع غير معرف
    // 1️⃣ البحث المباشر في البروفايلات بدور رئيس القسم ومعرف القسم الحالي
    const byRole = profiles.find((p: UserProfile): boolean => p.role === 'department_head' && p.department_id === currentDeptId);
    if (byRole) return byRole; // ✅ وجدنا رئيس القسم بالدور الصريح

    // 2️⃣ البحث بالمعرف الصريح head_id في البروفايلات
    if (currentDepartment?.head_id) {
      const byId = profiles.find((p: UserProfile): boolean => p.id === currentDepartment.head_id);
      if (byId) return byId; // ✅ وجدنا رئيس القسم بالمعرف
    }

    // 3️⃣ البحث بالبريد الأكاديمي head_email في البروفايلات
    if (currentDepartment?.head_email) {
      const cleanEmail = currentDepartment.head_email.trim().toLowerCase();
      const byEmail = profiles.find((p: UserProfile): boolean => (p.generated_email || '').trim().toLowerCase() === cleanEmail);
      if (byEmail) return byEmail; // ✅ وجدنا رئيس القسم بالإيميل
    }

    // 4️⃣ مطابقة المستخدم الحالي المسجل إذا كان رئيساً للقسم
    if (currentUser?.role === 'department_head' && (!currentUser.department_id || currentUser.department_id === currentDeptId)) {
      return currentUser; // ✅ المستخدم الحالي هو رئيس القسم
    }

    // 5️⃣ استخدام الاسم المسجل في بيانات القسم مباشرة إذا وجد
    if (currentDepartment?.head_name && currentDepartment.head_name.trim() !== '') {
      return {
        id: currentDepartment.head_id || `head-${currentDeptId}`, // 🆔 معرف الحساب
        full_name: currentDepartment.head_name.trim(), // 👤 الاسم الثلاثي الصريح
        role: 'department_head', // 🎭 الدور الأكاديمي
        university_number: `HOD-${currentDepartment.code || '01'}`, // 🔢 الرقم الوظيفي
        generated_email: currentDepartment.head_email || '', // 📧 البريد الإلكتروني
        is_active: true, // 🟢 الحساب نشط
      };
    }

    return undefined; // 🛡️ إذا لم نجد شيئاً
  }, [profiles, currentDeptId, currentDepartment, currentUser]);

  // 👤 استخراج بروفايل أو اسم مقرر القسم الحالي بدقة فائقة مع دعم كافة المصادر المتاحة
  const currentRap: UserProfile | undefined = useMemo(() => {
    if (!currentDeptId) return undefined; // 🛑 إذا ماكو معرف قسم نرجع غير معرف
    // 1️⃣ البحث المباشر في البروفايلات بدور مقرر القسم ومعرف القسم الحالي
    const byRole = profiles.find((p: UserProfile): boolean => p.role === 'rapporteur' && p.department_id === currentDeptId);
    if (byRole) return byRole; // ✅ وجدنا مقرر القسم بالدور الصريح

    // 2️⃣ البحث بالمعرف الصريح rapporteur_id في البروفايلات
    if (currentDepartment?.rapporteur_id) {
      const byId = profiles.find((p: UserProfile): boolean => p.id === currentDepartment.rapporteur_id);
      if (byId) return byId; // ✅ وجدنا مقرر القسم بالمعرف
    }

    // 3️⃣ البحث بالبريد الأكاديمي rapporteur_email في البروفايلات
    if (currentDepartment?.rapporteur_email) {
      const cleanEmail = currentDepartment.rapporteur_email.trim().toLowerCase();
      const byEmail = profiles.find((p: UserProfile): boolean => (p.generated_email || '').trim().toLowerCase() === cleanEmail);
      if (byEmail) return byEmail; // ✅ وجدنا مقرر القسم بالإيميل
    }

    // 4️⃣ مطابقة المستخدم الحالي المسجل إذا كان مقرراً للقسم
    if (currentUser?.role === 'rapporteur' && (!currentUser.department_id || currentUser.department_id === currentDeptId)) {
      return currentUser; // ✅ المستخدم الحالي هو مقرر القسم
    }

    // 5️⃣ استخدام الاسم المسجل في بيانات القسم مباشرة إذا وجد
    if (currentDepartment?.rapporteur_name && currentDepartment.rapporteur_name.trim() !== '') {
      return {
        id: currentDepartment.rapporteur_id || `rap-${currentDeptId}`, // 🆔 معرف الحساب
        full_name: currentDepartment.rapporteur_name.trim(), // 👤 الاسم الثلاثي الصريح
        role: 'rapporteur', // 🎭 الدور الأكاديمي
        university_number: `RAP-${currentDepartment.code || '01'}`, // 🔢 الرقم الوظيفي
        generated_email: currentDepartment.rapporteur_email || '', // 📧 البريد الإلكتروني
        is_active: true, // 🟢 الحساب نشط
      };
    }

    return undefined; // 🛡️ إذا لم نجد شيئاً
  }, [profiles, currentDeptId, currentDepartment, currentUser]);

  // 🏢 دالة فحص مطابقة المحاضرة للقسم المدار حالياً بعزل تام وصارم 100%
  const isLectureInCurrentDept = useCallback((l: ScheduleLecture): boolean => {
    if (!currentDeptId) return false;
    return l.department_id === currentDeptId;
  }, [currentDeptId]);

  // ✨ رسائل الإشعار والخطأ
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedCardProfile, setSelectedCardProfile] = useState<UserProfile | null>(null);

  // 🗑️ إعدادات نافذة تأكيد الحذف الموحدة
  const [deleteModalConfig, setDeleteModalConfig] = useState<DepartmentDeleteModalConfig>({
    isOpen: false,
    title: '',
    itemName: '',
    itemDetails: '',
    warningMessage: '',
    warningNote: '',
    confirmText: 'تأكيد الإجراء',
    variant: 'danger',
    iconType: 'trash',
    onConfirm: () => {},
  });

  // 🏢 قائمة تبديل القسم المنسدلة الذكية
  const [isDeptSwitcherDropdownOpen, setIsDeptSwitcherDropdownOpen] = useState<boolean>(false);
  const [deptSwitcherCoords, setDeptSwitcherCoords] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight?: number; openUpwards?: boolean } | null>(null);
  const deptSwitcherButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleToggleDeptSwitcherDropdown = () => {
    if (!isDeptSwitcherDropdownOpen && deptSwitcherButtonRef.current) {
      setDeptSwitcherCoords(calculateSmartDropdownPosition(deptSwitcherButtonRef.current, 260));
      setIsDeptSwitcherDropdownOpen(true);
    } else {
      setIsDeptSwitcherDropdownOpen(false);
    }
  };

  // 👨‍🏫 1. استدعاء خطاف إدارة كادر أساتذة القسم
  const teachersHook = useDepartmentTeachers({
    currentDeptId, // 🏛️ معرف القسم الحالي
    deptName, // 🏷️ اسم القسم الأكاديمي
    profiles, // 👥 قائمة البروفايلات الكاملة
    setProfiles, // 🔄 تحديث البروفايلات
    teacherCourses, // 🔗 مصفوفة التكليفات
    setTeacherCourses, // 🔄 دالة تحديث التكليفات
    courses, // 📖 مصفوفة المواد
    setCourses, // 🔄 دالة تحديث المواد
    setSuccessMessage, // ✨ إشعار النجاح
    setErrorMessage, // ⚠️ إشعار الخطأ
    setDeleteModalConfig, // 🗑️ نافذة الحذف الموحدة
    setSelectedCardProfile, // 📇 تعيين بطاقة الأستاذ
  });

  // 🎓 2. استدعاء خطاف إدارة طلبة القسم
  const studentsHook = useDepartmentStudents({
    currentDeptId, // 🏛️ معرف القسم الحالي
    deptName, // 🏷️ اسم القسم الأكاديمي
    profiles, // 👥 قائمة البروفايلات الكاملة
    setProfiles, // 🔄 تحديث البروفايلات
    academicYear, // 🗓️ العام الدراسي الحالي
    setSuccessMessage, // ✨ إشعار النجاح
    setErrorMessage, // ⚠️ إشعار الخطأ
    setDeleteModalConfig, // 🗑️ نافذة الحذف الموحدة
    setSelectedCardProfile, // 📇 تعيين بطاقة الطالب
  });

  // 📚 3. استدعاء خطاف إدارة مواد ومقررات القسم
  const coursesHook = useDepartmentCourses({
    currentDeptId, // 🏛️ معرف القسم الحالي
    deptName, // 🏷️ اسم القسم الأكاديمي
    courses, // 📖 مصفوفة المقررات
    setCourses, // 🔄 دالة تحديث المقررات
    profiles, // 👥 قائمة البروفايلات للتحقق الشامل
    deptTeachers: teachersHook.deptTeachers, // 👨‍🏫 أساتذة القسم
    teacherCourses, // 🔗 تكليفات المواد
    setTeacherCourses, // 🔄 دالة تحديث التكليفات
    currentHead, // 👤 رئيس القسم الأكاديمي
    currentRap, // 👤 مقرر القسم الأكاديمي
    currentDepartment, // 🏢 بيانات القسم الأكاديمي بالكامل
    setSuccessMessage, // ✨ إشعار النجاح
    setErrorMessage, // ⚠️ إشعار الخطأ
    setDeleteModalConfig, // 🗑️ نافذة الحذف الموحدة
  });

  // 🔗 4. استدعاء خطاف إدارة تكليفات الأساتذة بالمواد
  const assignmentsHook = useDepartmentAssignments({
    currentDeptId,
    deptName,
    teacherCourses,
    setTeacherCourses,
    courses,
    setCourses,
    deptTeachers: teachersHook.deptTeachers,
    deptCourses: coursesHook.deptCourses,
    setSuccessMessage,
    setErrorMessage,
    setDeleteModalConfig,
  });

  // 🗓️ 5. استدعاء خطاف إدارة جدول المحاضرات الأسبوعي والامتحانات
  const scheduleHook = useDepartmentSchedule({
    currentDeptId,
    deptName,
    courses,
    deptCourses: coursesHook.deptCourses,
    deptTeachers: teachersHook.deptTeachers,
    teacherCourses,
    scheduleLectures,
    setScheduleLectures,
    scheduleConfigs,
    setScheduleConfigs,
    finalExamSchedules,
    setFinalExamSchedules,
    finalExamSlots,
    setFinalExamSlots,
    profiles,
    setSuccessMessage,
    setErrorMessage,
    setDeleteModalConfig,
    isLectureInCurrentDept,
    stageGroupConfigs: studentsHook.stageGroupConfigs, // 👥 تمرير إعدادات كروبات المراحل لمزامنة الكروب الأول افتراضياً
  });

  // 📦 تفكيك خصائص ومخرجات خطاف الأساتذة
  const {
    teacherName, setTeacherName,
    teacherGender, setTeacherGender,
    customTeacherEmail, setCustomTeacherEmail,
    customTeacherPassword, setCustomTeacherPassword,
    showTeacherPassword, setShowTeacherPassword,
    editingTeacherId, setEditingTeacherId,
    isTeacherModalOpen, setIsTeacherModalOpen,
    nameError, setNameError,
    showExcelInstructions, setShowExcelInstructions,
    isImportingExcel, setIsImportingExcel,
    importReport, setImportReport,
    activeReportTab, setActiveReportTab,
    selectedTeacherIds, setSelectedTeacherIds,
    teacherPage, setTeacherPage,
    teacherPageSize, setTeacherPageSize,
    isExportingTeachersExcel, setIsExportingTeachersExcel,
    showTeacherPrintModal, setShowTeacherPrintModal,
    singleTeacherPrintProfile, setSingleTeacherPrintProfile,
    passwordCriteria, passwordStrengthScore,
    deptTeachers,
    handleAutoGenerateCredentials,
    handleDownloadTeacherTemplate,
    handleTeacherExcelUpload,
    handleSaveTeacher,
    handleResetTeacherPassword,
    handleDeleteTeacher,
    handleBulkDeleteTeachers,
    handleExportTeachersExcel,
    handleBulkExportTeachersExcel,
    toggleSelectAllTeachers,
    toggleSelectTeacher,
    handleMoveTeacher,
  } = teachersHook;

  // 📦 تفكيك خصائص ومخرجات خطاف الطلبة
  const {
    studentName, setStudentName,
    studentStage, setStudentStage,
    studentGender, setStudentGender,
    studentStudyType, setStudentStudyType,
    studentGroup, setStudentGroup,
    filterStudentGroup, setFilterStudentGroup,
    stageGroupConfigs,
    isStageGroupModalOpen, setIsStageGroupModalOpen,
    handleSaveStageGroupConfig,
    handleUpdateStudentsGroupBatch,
    handleBulkAssignGroup,
    customStudentEmail, setCustomStudentEmail,
    customStudentPassword, setCustomStudentPassword,
    showStudentPassword, setShowStudentPassword,
    editingStudentId, setEditingStudentId,
    isStudentModalOpen, setIsStudentModalOpen,
    studentNameError, setStudentNameError,
    studentSearch, setStudentSearch,
    filterStudentStage, setFilterStudentStage,
    filterStudentStudyType, setFilterStudentStudyType,
    showStudentExcelInstructions, setShowStudentExcelInstructions,
    isImportingStudentExcel, setIsImportingStudentExcel,
    studentImportReport, setStudentImportReport,
    studentActiveReportTab, setStudentActiveReportTab,
    selectedStudentIds, setSelectedStudentIds,
    studentPage, setStudentPage,
    studentPageSize, setStudentPageSize,
    isExportingStudentsExcel, setIsExportingStudentsExcel,
    isBulkPromotionModalOpen, setIsBulkPromotionModalOpen,
    bulkPromoteSourceStage, setBulkPromoteSourceStage,
    isStudentStageDropdownOpen, setIsStudentStageDropdownOpen,
    stageDropdownCoords, setStageDropdownCoords,
    stageButtonRef, handleToggleStudentStageDropdown,
    showStudentPrintModal, setShowStudentPrintModal,
    singleStudentPrintProfile, setSingleStudentPrintProfile,
    studentPrintStageFilter, setStudentPrintStageFilter,
    studentPrintStudyFilter, setStudentPrintStudyFilter,
    studentPasswordCriteria, studentPasswordStrengthScore,
    deptStudents, filteredStudents,
    handleAutoGenerateStudentCredentials,
    handleDownloadStudentTemplate,
    handleStudentExcelUpload,
    handleSaveStudent,
    handleFixDuplicateEmails,
    handleDeleteStudent,
    handlePromoteStudent,
    handleBulkPromoteStage,
    handleBulkDeleteStudents,
    handleBulkExportStudentsExcel,
    handleExportStudentsExcel,
    toggleSelectAllStudents,
    toggleSelectStudent,
  } = studentsHook;

  // 📦 تفكيك خصائص ومخرجات خطاف المواد
  const {
    courseName, setCourseName,
    courseCode, setCourseCode,
    courseCredits, setCourseCredits,
    courseStage, setCourseStage,
    courseSemester, setCourseSemester,
    courseType, setCourseType,
    courseTheoryTeacherId, setCourseTheoryTeacherId,
    coursePracticalTeacherId, setCoursePracticalTeacherId,
    editingCourseId, setEditingCourseId,
    courseIsSupplementaryEnabled, setCourseIsSupplementaryEnabled,
    courseIsFinalExamEnabled, setCourseIsFinalExamEnabled,
    isCourseModalOpen, setIsCourseModalOpen,
    courseSearch, setCourseSearch,
    filterCourseStage, setFilterCourseStage,
    filterCourseSemester, setFilterCourseSemester,
    filterCourseType, setFilterCourseType,
    selectedCourseIds, setSelectedCourseIds,
    coursePage, setCoursePage,
    coursePageSize, setCoursePageSize,
    showCourseExcelInstructions, setShowCourseExcelInstructions,
    isImportingCourseExcel, setIsImportingCourseExcel,
    isExportingCoursesPDF, setIsExportingCoursesPDF,
    courseImportReport, setCourseImportReport,
    courseActiveReportTab, setCourseActiveReportTab,
    isExportingCoursesExcel, setIsExportingCoursesExcel,
    isAssessmentModalOpen, setIsAssessmentModalOpen,
    selectedCourseForAssessment, setSelectedCourseForAssessment,
    tempAssessmentScheme, setTempAssessmentScheme,
    roundConfirmModal, setRoundConfirmModal,
    examToggleConfirmation, setExamToggleConfirmation,
    quickAssignConfig, setQuickAssignConfig,
    isCourseTheoryDropdownOpen, setIsCourseTheoryDropdownOpen,
    isCoursePracticalDropdownOpen, setIsCoursePracticalDropdownOpen,
    theoryTeacherCoords, setTheoryTeacherCoords,
    practicalTeacherCoords, setPracticalTeacherCoords,
    theoryTeacherBtnRef, practicalTeacherBtnRef,
    handleToggleCourseTheoryDropdown, handleToggleCoursePracticalDropdown,
    deptCourses, filteredCourses,
    targetRoundCourses, activeTargetRoundCourses,
    deptSem1CourseIds, deptSem2CourseIds,
    finalOpenCount, isBulkFinalOpen, isBulkFinalPartial,
    supOpenCount, isBulkSupOpen, isBulkSupPartial,
    handleConfirmExamToggle,
    getCourseTheoryTeachers, getCoursePracticalTeachers,
    handleOpenQuickAssign, handleSaveQuickAssign,
    handleOpenAssessmentModal, handleSaveAssessmentSchemeModal,
    handleDownloadCourseTemplate, handleExportCoursesPDF,
    handleCourseExcelUpload, handleSaveCourse,
    handleDeleteCourse, handleBulkDeleteCourses,
    handleExportCoursesExcel,
    requestToggleRoundAction, executeConfirmToggleRoundAction,
    handleToggleCourseFinalExam, handleToggleCourseSupplementaryExam,
    handleBulkToggleFinalExam, handleBulkToggleSupplementaryExam,
  } = coursesHook;

  // 📦 تفكيك خصائص ومخرجات خطاف التكليفات
  const {
    selectedTeacherId, setSelectedTeacherId,
    selectedCourseId, setSelectedCourseId,
    selectedAssignRole, setSelectedAssignRole,
    isAssignmentModalOpen, setIsAssignmentModalOpen,
    editingAssignment, setEditingAssignment,
    assignmentSearch, setAssignmentSearch,
    filterAssignmentTeacher, setFilterAssignmentTeacher,
    filterAssignmentStage, setFilterAssignmentStage,
    filterAssignmentSemester, setFilterAssignmentSemester,
    filterAssignmentRole, setFilterAssignmentRole,
    selectedAssignmentIds, setSelectedAssignmentIds,
    assignmentPage, setAssignmentPage,
    assignmentPageSize, setAssignmentPageSize,
    isExportingAssignmentsExcel, setIsExportingAssignmentsExcel,
    crudTeacher, setCrudTeacher,
    isTeacherCrudModalOpen, setIsTeacherCrudModalOpen,
    teacherCrudCourseId, setTeacherCrudCourseId,
    teacherCrudSearchQuery, setTeacherCrudSearchQuery,
    showAssignmentsPrintModal, setShowAssignmentsPrintModal,
    assignmentsPrintScope, setAssignmentsPrintScope,
    isAssignTeacherDropdownOpen, setIsAssignTeacherDropdownOpen,
    assignTeacherCoords, setAssignTeacherCoords,
    assignTeacherSearchQuery, setAssignTeacherSearchQuery,
    assignTeacherButtonRef, handleToggleAssignTeacherDropdown,
    isAssignCourseDropdownOpen, setIsAssignCourseDropdownOpen,
    assignCourseCoords, setAssignCourseCoords,
    assignCourseSearchQuery, setAssignCourseSearchQuery,
    assignCourseButtonRef, handleToggleAssignCourseDropdown,
    isFilterTeacherDropdownOpen, setIsFilterTeacherDropdownOpen,
    filterTeacherCoords, setFilterTeacherCoords,
    filterTeacherSearchQuery, setFilterTeacherSearchQuery,
    filterTeacherButtonRef, handleToggleFilterTeacherDropdown,
    deptTeacherCourses, filteredTeacherCourses,
    handleAssignTeacher, handleRemoveAssignment,
    handleAssignCourseToSpecificTeacher,
    handleOpenEditAssignment, handleSaveEditedAssignment,
    toggleSelectAllAssignments, toggleSelectAssignment,
    handleBulkRemoveAssignments, handleExportAssignmentsExcel,
  } = assignmentsHook;

  // 📦 تفكيك خصائص ومخرجات خطاف الجدول الأسبوعي
  const {
    selectedScheduleStage, setSelectedScheduleStage,
    selectedScheduleSemester, setSelectedScheduleSemester,
    selectedScheduleStudyType, setSelectedScheduleStudyType,
    selectedScheduleGroup, setSelectedScheduleGroup, // 👥 استخراج الكروب المحدد ودالة تغييره من خطاف الجدول
    selectedScheduleWeek, setSelectedScheduleWeek,
    selectedScheduleLectureIds, setSelectedScheduleLectureIds,
    currentScheduleConfig, scheduleCurrentAcademicWeek,
    currentLecConflicts, availableRoomsForSlot,
    lecDay, setLecDay,
    lecStartTime, setLecStartTime,
    lecEndTime, setLecEndTime,
    lecRoom, setLecRoom,
    lecCourseId, setLecCourseId,
    lecTeacherId, setLecTeacherId,
    lecType, setLecType,
    lecColor, setLecColor,
    lecNotes, setLecNotes,
    lecDate, setLecDate,
    lecWeekNumber, setLecWeekNumber,
    lecStudyType, setLecStudyType,
    lecAutoCascadeWeeks, setLecAutoCascadeWeeks,
    lecCascadeShiftOption, setLecCascadeShiftOption,
    closeModalAfterSave, setCloseModalAfterSave,
    lecCourseSearchTerm, setLecCourseSearchTerm,
    lecCourseTabFilter, setLecCourseTabFilter,
    lecTeacherSearchTerm, setLecTeacherSearchTerm,
    lecTargetGroup, setLecTargetGroup,
    lecModalSuccessMsg, setLecModalSuccessMsg,
    isLectureModalOpen, setIsLectureModalOpen,
    editingLectureId, setEditingLectureId,
    recentlyAddedLectureId,
    pendingSemesterStartDate, setPendingSemesterStartDate,
    showSemesterDateConfirmModal, setShowSemesterDateConfirmModal,
    isPreviewScheduleModalOpen, setIsPreviewScheduleModalOpen,
    isSchedulePrintModalOpen, setIsSchedulePrintModalOpen,
    isMasterMatrixModalOpen, setIsMasterMatrixModalOpen,
    isDurationSettingsModalOpen, setIsDurationSettingsModalOpen,
    showScheduleExcelInstructions, setShowScheduleExcelInstructions,
    isImportingScheduleExcel,
    scheduleImportReport, setScheduleImportReport,
    scheduleActiveReportTab, setScheduleActiveReportTab,
    lastScheduleScrollYRef, lecListContainerRef,
    handleToggleWorkingDay, handleResetWorkingDays,
    handleSaveSemesterStartDate, handleDownloadScheduleTemplate,
    handleScheduleExcelUpload, handleExportScheduleToExcel,
    handleSaveExamSchedule, calculateEndTimeFromStart,
    advanceToNextTimeSlot, handleSaveLecture,
    resetLectureModalState, handleEditLecture,
    handleDeleteLecture, handleBulkDeleteScheduleLectures,
  } = scheduleHook;

  // 📊 حالات تبويب درجات وسعيات مسار بولونيا
  const [gradeSearch, setGradeSearch] = useState<string>(''); // 🔍 بحث سجلات الدرجات
  const [filterGradeStage, setFilterGradeStage] = useState<number | 'all'>('all'); // 🏷️ تصفية مرحلة سجلات الدرجات
  const [filterGradeSemester, setFilterGradeSemester] = useState<number | 'all'>('all'); // 🏷️ تصفية كورس سجلات الدرجات
  const [filterGradeCourse, setFilterGradeCourse] = useState<string | 'all'>('all'); // 🏷️ تصفية مادة سجلات الدرجات
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]); // 🔘 معرفات سجلات الدرجات المحددة
  const [isGradeCourseDropdownOpen, setIsGradeCourseDropdownOpen] = useState<boolean>(false); // 📦 قائمة المواد بالدرجات
  const gradeCourseDropdownRef = useRef<HTMLDivElement | null>(null); // 🔗 مرجع القائمة المنسدلة
  const [gradePage, setGradePage] = useState<number>(1); // 📊 رقم الصفحة
  const [gradePageSize, setGradePageSize] = useState<number>(10); // 📏 حجم الصفحة
  const [isExportingGradesExcel, setIsExportingGradesExcel] = useState<boolean>(false); // ⏳ حالة تصدير الإكسل

  // 🔍 تصفية درجات القسم بحسب البحث والمرحلة
  const deptGrades = useMemo(() => {
    return grades.filter((g: Grade) => {
      const course = courses.find((c: Course) => c.id === g.course_id);
      return course?.department_id === currentDeptId || g.department_id === currentDeptId;
    });
  }, [grades, courses, currentDeptId]);

  const filteredGrades = useMemo(() => {
    return deptGrades.filter((g: Grade) => {
      const term = gradeSearch.toLowerCase();
      const matchesSearch =
        g.student_name.toLowerCase().includes(term) ||
        g.course_name.toLowerCase().includes(term) ||
        (g.university_number && g.university_number.toLowerCase().includes(term));
      const course = courses.find((c: Course) => c.id === g.course_id);
      const stage = course?.stage_number || 1;
      const matchesStage = filterGradeStage === 'all' || stage === filterGradeStage;
      const matchesSemester = filterGradeSemester === 'all' || (g.semester || course?.semester || 1) === filterGradeSemester;
      const matchesCourse = filterGradeCourse === 'all' || g.course_id === filterGradeCourse;
      return matchesSearch && matchesStage && matchesSemester && matchesCourse;
    });
  }, [deptGrades, gradeSearch, courses, filterGradeStage, filterGradeSemester, filterGradeCourse]);

  // 🧮 المخطط التقييمي النشط للمادة المحددة أو المادة الحالية
  const activeCourseForScheme = filterGradeCourse !== 'all'
    ? courses.find((c: Course) => c.id === filterGradeCourse)
    : (filteredGrades.length > 0 ? courses.find((c: Course) => c.id === filteredGrades[0]?.course_id) : null);
  const currentActiveScheme = getCourseAssessmentScheme(activeCourseForScheme);

  // 📚 قائمة المواد القابلة للاختيار في تبويب الدرجات بحسب المرحلة المحددة
  const gradeSelectableCourses = useMemo(() => {
    return deptCourses.filter((c: Course) => {
      if (filterGradeStage === 'all') return true;
      return (c.stage_number || 1) === filterGradeStage;
    });
  }, [deptCourses, filterGradeStage]);

  // 🎓 دالة تبديل تصفية المرحلة مع مزامنة قائمة المواد تلقائياً
  const handleSelectGradeStage = (stage: number | 'all') => {
    setFilterGradeStage(stage);
    if (stage !== 'all') {
      const isCurrentCourseInNewStage = deptCourses.some(
        (c: Course) => c.id === filterGradeCourse && (c.stage_number || 1) === stage
      );
      if (!isCurrentCourseInNewStage) {
        setFilterGradeCourse('all');
      }
    }
  };

  // 📤 تصدير سجلات درجات وسعيات مسار بولونيا إلى Excel
  const handleExportGradesExcel = async () => {
    try {
      setIsExportingGradesExcel(true);
      const targetGrades = selectedGradeIds && selectedGradeIds.length > 0
        ? deptGrades.filter((g: Grade): boolean => selectedGradeIds.includes(g.id))
        : filteredGrades;

      if (targetGrades.length === 0) {
        setErrorMessage('لا توجد سجلات درجات لتصديرها حالياً.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const formattedGrades = targetGrades.map((g: Grade) => {
        const student = deptStudents.find((s: UserProfile): boolean => s.id === g.student_id);
        const course = deptCourses.find((c: Course): boolean => c.id === g.course_id);
        const cwTotal = calculateCourseworkTotal(g);
        const finalTot = calculateFinalTotal(g);
        const letter = getLetterGrade(finalTot);
        return {
          ...g,
          student_name: g.student_name || student?.full_name || 'طالب غير محدد',
          university_number: g.university_number || student?.university_number || '—',
          course_name: g.course_name || course?.name || 'مادة غير محددة',
          course_code: course?.code || '—', // 🏷️ رمز المقرر الدراسي من بيانات المادة مباشرة
          stage_number: course?.stage_number || 1,
          semester: g.semester || course?.semester || 1,
          coursework_total: cwTotal,
          final_total: finalTot,
          letter_grade: letter,
        };
      });

      const scopeName = filterGradeCourse !== 'all'
        ? (deptCourses.find((c: Course): boolean => c.id === filterGradeCourse)?.name || 'مادة_محددة')
        : (filterGradeStage !== 'all' ? `المرحلة_${filterGradeStage}` : 'كافة_المراحل');

      await exportCustomGradesList(formattedGrades, `${deptName}_${scopeName}`);
      setSuccessMessage(`تم تصدير (${formattedGrades.length}) سجل درجات بنجاح! 📊`);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (error) {
      console.error('خطأ في تصدير درجات بولونيا:', error);
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل الدرجات.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingGradesExcel(false);
    }
  };

  // 🗑️ حذف جماعي لسجلات الدرجات المحددة
  const handleBulkDeleteGrades = () => {
    if (selectedGradeIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      title: 'حذف سجلات الدرجات المحددة',
      itemName: `${selectedGradeIds.length} سجل درجات وسعي`,
      itemDetails: 'سيتم حذف سجلات الدرجات للطلبة المحددين من قاعدة البيانات.',
      warningMessage: '⚠️ تحذير: سيتم مسح السعيات والدرجات المسجلة في السجلات المحددة نهائياً.',
      confirmText: `تأكيد حذف (${selectedGradeIds.length}) سجل`,
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const remaining = grades.filter((g: Grade) => !selectedGradeIds.includes(g.id));
        setGrades(remaining);
        saveStoredData('grades', remaining);
        setSelectedGradeIds([]);
        setSuccessMessage(`تم بنجاح حذف (${selectedGradeIds.length}) سجل درجات`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 📋 حالات تبويب الحضور والغيابات والإنذارات لبولونيا
  const [attendanceSearch, setAttendanceSearch] = useState<string>(''); // 🔍 بحث الحضور
  const [filterAttendanceStage, setFilterAttendanceStage] = useState<number | 'all'>('all'); // 🎓 تصفية مرحلة الحضور
  const [filterAttendanceGroup, setFilterAttendanceGroup] = useState<string>('all'); // 👥 تصفية كروب الحضور
  const [filterAttendanceSemester, setFilterAttendanceSemester] = useState<1 | 2 | 'all'>('all'); // 🗓️ تصفية كورس الحضور
  const [filterAttendanceStudyType, setFilterAttendanceStudyType] = useState<'all' | 'morning' | 'evening'>('all'); // ☀️🌙 فترة الحضور
  const [filterAttendanceCourse, setFilterAttendanceCourse] = useState<string | 'all'>('all'); // 📘 تصفية مادة الحضور
  const [filterAttendanceWeek, setFilterAttendanceWeek] = useState<number | 'all'>('all'); // 🗓️ تصفية أسبوع الحضور
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<AttendanceWarningStatus | 'all'>('all'); // ⚠️ تصفية حالة الإنذار
  const [attendanceViewMode, setAttendanceViewMode] = useState<'list' | 'analytics'>('list'); // 📊 نمط العرض
  const [isAttendanceWeekDropdownOpen, setIsAttendanceWeekDropdownOpen] = useState<boolean>(false); // 🔽 منسدلة الأسابيع
  const [isAttendanceCourseDropdownOpen, setIsAttendanceCourseDropdownOpen] = useState<boolean>(false); // 🔽 منسدلة المواد
  const [isAttendanceStatusDropdownOpen, setIsAttendanceStatusDropdownOpen] = useState<boolean>(false); // 🔽 منسدلة الحالات
  const [attendancePage, setAttendancePage] = useState<number>(1); // 📋 رقم الصفحة
  const [attendancePageSize, setAttendancePageSize] = useState<number>(10); // 📏 حجم الصفحة
  const [selectedAttendanceStudentIds, setSelectedAttendanceStudentIds] = useState<string[]>([]); // 🔘 الطلبة المحددين
  const [isAttendanceNoticeModalOpen, setIsAttendanceNoticeModalOpen] = useState<boolean>(false); // 📢 نافذة التبليغات
  const [attendanceNoticeTargetStudent, setAttendanceNoticeTargetStudent] = useState<UserProfile | null>(null); // 👤 الطالب المستهدف
  const [attendanceNoticeDefaultCategory, setAttendanceNoticeDefaultCategory] = useState<AttendanceNoticeCategory>('warning_1'); // 🏷️ فئة التبليغ
  const [isDeptExcuseReviewOpen, setIsDeptExcuseReviewOpen] = useState<boolean>(false); // 📑 مراجعة الإجازات
  const [isSyncingAttendance, setIsSyncingAttendance] = useState<boolean>(false); // 🔄 مزامنة الحضور
  const [isExportingAttendanceExcel, setIsExportingAttendanceExcel] = useState<boolean>(false); // ⏳ تصدير إكسل الحضور

  // 📤 تصدير كشف الحضور والغيابات ونسب الإنذار لبولونيا إلى Excel
  const handleExportAttendanceExcel = async () => {
    try {
      setIsExportingAttendanceExcel(true);
      const targetStudents = selectedAttendanceStudentIds && selectedAttendanceStudentIds.length > 0
        ? deptStudents.filter((s: UserProfile): boolean => selectedAttendanceStudentIds.includes(s.id))
        : deptStudents.filter((s: UserProfile): boolean => {
            if (filterAttendanceStage !== 'all' && (s.stage_number || 1) !== filterAttendanceStage) return false;
            if (filterAttendanceGroup !== 'all') {
              if (filterAttendanceGroup === 'unassigned') {
                if (s.student_group) return false;
              } else if (s.student_group !== filterAttendanceGroup) {
                return false;
              }
            }
            return true;
          });

      if (targetStudents.length === 0) {
        setErrorMessage('لا يوجد طلاب في القسم لتصدير سجلات حضورهم حالياً.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const targetCourses = deptCourses.filter((c: Course): boolean => {
        if (filterAttendanceStage !== 'all' && c.stage_number !== filterAttendanceStage) return false;
        if (filterAttendanceSemester !== 'all' && c.semester !== filterAttendanceSemester) return false;
        if (filterAttendanceCourse !== 'all' && c.id !== filterAttendanceCourse) return false;
        return true;
      });

      const effectiveCourses = targetCourses.length > 0 ? targetCourses : deptCourses;

      const effectiveRecords = filterAttendanceWeek === 'all'
        ? attendanceRecords
        : attendanceRecords.filter((r: StudentAttendanceRecord): boolean => r.week_number === filterAttendanceWeek);

      const formattedAttendanceRecords: {
        student_name: string;
        university_number: string;
        stage_number: number;
        study_type: 'morning' | 'evening';
        course_name: string;
        total_hours: number;
        unexcused_hours: number;
        excused_hours: number;
        absence_percentage: number;
        warning_status: 'none' | 'first_warning' | 'final_warning' | 'dismissed';
        notes?: string;
      }[] = [];

      for (const st of targetStudents) {
        for (const c of effectiveCourses) {
          const summary = calculateStudentCourseAttendance(
            st.id,
            c.id,
            effectiveRecords,
            c.name,
            c.code,
            c.credit_hours || 3
          );

          let mappedWarning: 'none' | 'first_warning' | 'final_warning' | 'dismissed' = 'none';
          if (summary.warning_status === 'warning_1') mappedWarning = 'first_warning';
          else if (summary.warning_status === 'warning_2') mappedWarning = 'final_warning';
          else if (summary.warning_status === 'banned') mappedWarning = 'dismissed';

          formattedAttendanceRecords.push({
            student_name: st.full_name,
            university_number: st.university_number || '—',
            stage_number: st.stage_number || c.stage_number || 1,
            study_type: st.study_type === 'evening' ? 'evening' : 'morning',
            course_name: c.name,
            total_hours: summary.total_scheduled_hours || 45,
            unexcused_hours: summary.total_unexcused_absence_hours,
            excused_hours: summary.total_excused_absence_hours,
            absence_percentage: summary.absence_percentage,
            warning_status: mappedWarning,
            notes: mappedWarning !== 'none' ? 'إنذار أكاديمي رسمي' : 'دوام منتظم',
          });
        }
      }

      await exportCustomAttendanceList(formattedAttendanceRecords, deptName);
      setSuccessMessage(`تم بنجاح تصدير كشف الغيابات والإنذارات لـ (${targetStudents.length}) طالب إلى ملف Excel! 📊`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('خطأ في تصدير الحضور والغيابات:', error);
      setErrorMessage('حدث خطأ أثناء تصدير ملف إكسل الحضور.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsExportingAttendanceExcel(false);
    }
  };

  // 📢 حفظ ومزامنة التعميم الرسمي سحابياً
  const handleSaveAnnouncement = (announcement: CampusAnnouncement) => {
    const updated = campusAnnouncements.some((a: CampusAnnouncement) => a.id === announcement.id)
      ? campusAnnouncements.map((a: CampusAnnouncement) => (a.id === announcement.id ? announcement : a))
      : [announcement, ...campusAnnouncements];
    setCampusAnnouncements(updated);
    saveStoredData('campus_official_announcements', updated);
    saveCampusAnnouncementToSupabase(announcement);
    setSuccessMessage('تم حفظ ونشر التعميم الرسمي بنجاح سحابياً 📢');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 🗑️ حذف التعميم الرسمي سحابياً
  const handleDeleteAnnouncement = (id: string) => {
    const updated = campusAnnouncements.filter((a: CampusAnnouncement) => a.id !== id);
    setCampusAnnouncements(updated);
    saveStoredData('campus_official_announcements', updated);
    deleteCampusAnnouncementFromSupabase(id);
    setSuccessMessage('تم حذف التعميم الرسمي سحابياً بنجاح.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 💳 حفظ وتحديث سجل قسط دراسي ومزامنته حياً
  const handleSaveTuitionRecord = (updatedRecord: StudentTuitionRecord) => {
    const existingIdx = tuitionRecords.findIndex((r: StudentTuitionRecord) => r.id === updatedRecord.id || (r.student_id === updatedRecord.student_id && r.stage_number === updatedRecord.stage_number));
    let updatedList: StudentTuitionRecord[];
    if (existingIdx >= 0) {
      updatedList = [...tuitionRecords];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...tuitionRecords, updatedRecord];
    }
    setTuitionRecords(updatedList);
    saveStoredData('student_tuition_records', updatedList);
    saveTuitionRecordToSupabase(updatedRecord);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tuition_records_updated', { detail: updatedList }));
    }
  };

  // 🔄 تصفير الصفحات للبداية تلقائياً عند تغيير معايير البحث والتصفية
  useEffect(() => {
    setGradePage(1);
  }, [gradeSearch, filterGradeStage, filterGradeSemester, filterGradeCourse]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceSearch, filterAttendanceStage, filterAttendanceGroup, filterAttendanceStudyType, filterAttendanceStatus, filterAttendanceCourse, filterAttendanceSemester, filterAttendanceWeek]);

  // 🚪 إغلاق القائمة المنسدلة لمواد الدرجات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gradeCourseDropdownRef.current &&
        !gradeCourseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGradeCourseDropdownOpen(false);
      }
    };
    if (isGradeCourseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGradeCourseDropdownOpen]);

  // 🔄 تحميل البيانات الأولية والتحقق من الصلاحيات والمزامنة السحابية
  useEffect(() => {
    const user = getCurrentSessionUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const allowedRoles = ['admin', 'department_head', 'rapporteur'];
    if (!allowedRoles.includes(user.role)) {
      router.push('/admin');
      return;
    }
    setCurrentUser(user);

    const loadedProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const loadedDepts = getStoredData<Department[]>('departments', INITIAL_DEPARTMENTS);
    const loadedCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
    const loadedTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
    const loadedGrades = getStoredData<Grade[]>('grades', INITIAL_GRADES);
    const loadedLecs = getStoredData<ScheduleLecture[]>('schedule_lectures', INITIAL_SCHEDULE_LECTURES);
    const loadedConfigs = getStoredData<DepartmentScheduleConfig[]>('department_schedule_configs', INITIAL_SCHEDULE_CONFIGS);
    const loadedAttendance = getStoredData<StudentAttendanceRecord[]>('student_attendance_records', INITIAL_ATTENDANCE_RECORDS);

    const initialReconciled = reconcileCoursesWithTeacherCourses(
      loadedCourses,
      loadedTCs,
      loadedProfiles
    );
    if (initialReconciled.hasChanges) {
      saveStoredData('courses', initialReconciled.reconciledCourses);
      saveStoredData('teacher_courses', initialReconciled.reconciledTCs);
    }

    setProfiles(loadedProfiles);
    setDepartments(loadedDepts);
    setCourses(initialReconciled.reconciledCourses);
    setTeacherCourses(initialReconciled.reconciledTCs);
    setGrades(loadedGrades);
    setScheduleConfigs(loadedConfigs);
    setAttendanceRecords(loadedAttendance);

    const loadedExcuses = getStoredData<AttendanceExcuseRequest[]>('excuse_requests', INITIAL_EXCUSE_REQUESTS);
    setExcuseRequests(loadedExcuses);

    const loadedExamSchedules = getStoredData<FinalExamSchedule[]>('final_exam_schedules', INITIAL_FINAL_EXAM_SCHEDULES);
    const loadedExamSlots = getStoredData<FinalExamSlot[]>('final_exam_slots', INITIAL_FINAL_EXAM_SLOTS);
    const loadedTuition = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);

    setFinalExamSchedules(loadedExamSchedules);
    setFinalExamSlots(loadedExamSlots);
    setTuitionRecords(loadedTuition);

    const effectiveDeptId = user.department_id || (loadedDepts.length > 0 ? loadedDepts[0].id : 'dept-1');
    setCurrentDeptId(effectiveDeptId);

    const sanitizeLecs = (lecs: ScheduleLecture[]): ScheduleLecture[] => {
      const deptConfig = loadedConfigs.find((c: DepartmentScheduleConfig) => c.department_id === effectiveDeptId);
      const baseStart = deptConfig?.start_date || '2026-09-20';
      return lecs.map((l: ScheduleLecture) => {
        const cleanStart = l.start_time ? l.start_time.replace(/^00:/, '12:') : l.start_time;
        const cleanEnd = l.end_time ? l.end_time.replace(/^00:/, '12:') : l.end_time;
        const wk = l.week_number || 1;
        const correctBaseDate = calculateDateForAnyDayInWeek(baseStart, 1, wk, l.day);

        let customDates = l.custom_weekly_dates;
        const needsDatesRepair = !customDates || Object.keys(customDates).length < 15 || l.date !== correctBaseDate;
        if (needsDatesRepair && correctBaseDate) {
          const generated15 = generateAll15WeeksDates(correctBaseDate, l.day, wk);
          const map15: Record<number, string> = {};
          generated15.forEach((item: { weekNumber: number; date: string }) => {
            map15[item.weekNumber] = item.date;
          });
          customDates = map15;
        }

        return {
          ...l,
          start_time: cleanStart,
          end_time: cleanEnd,
          date: correctBaseDate || l.date,
          custom_weekly_dates: customDates,
        };
      });
    };

    const cleanLoaded = sanitizeLecs(loadedLecs);
    setScheduleLectures(cleanLoaded);
    saveStoredData('schedule_lectures', cleanLoaded);

    syncScheduleLecturesFromSupabase()
      .then((cloudLecs) => {
        if (cloudLecs && cloudLecs.length > 0) {
          const cleanCloud = sanitizeLecs(cloudLecs);
          setScheduleLectures(cleanCloud);
          saveStoredData('schedule_lectures', cleanCloud);
        }
      })
      .catch((err) => {
        console.warn('تنبيه أثناء مزامنة المحاضرات من Supabase:', err);
      });

    syncFullDepartmentPortalData()
      .then((cloudData) => {
        const liveProfiles: UserProfile[] = (cloudData.profiles && cloudData.profiles.length > 0) ? cloudData.profiles : loadedProfiles;
        if (cloudData.profiles && cloudData.profiles.length > 0) setProfiles(cloudData.profiles);

        const rawCloudCourses: Course[] = (cloudData.courses && cloudData.courses.length > 0) ? cloudData.courses : loadedCourses;
        const rawCloudTCs: TeacherCourse[] = (cloudData.teacherCourses && cloudData.teacherCourses.length > 0) ? cloudData.teacherCourses : loadedTCs;

        const cloudReconciled = reconcileCoursesWithTeacherCourses(
          rawCloudCourses,
          rawCloudTCs,
          liveProfiles
        );
        setCourses(cloudReconciled.reconciledCourses);
        setTeacherCourses(cloudReconciled.reconciledTCs);
        if (cloudReconciled.hasChanges) {
          saveStoredData('courses', cloudReconciled.reconciledCourses);
          saveStoredData('teacher_courses', cloudReconciled.reconciledTCs);
        }

        if (cloudData.grades && cloudData.grades.length > 0) setGrades(cloudData.grades);
        if (cloudData.scheduleLectures && cloudData.scheduleLectures.length > 0) setScheduleLectures(cloudData.scheduleLectures);
        if (cloudData.scheduleConfigs && cloudData.scheduleConfigs.length > 0) setScheduleConfigs(cloudData.scheduleConfigs);
        if (cloudData.attendanceRecords && cloudData.attendanceRecords.length > 0) setAttendanceRecords(cloudData.attendanceRecords);
        if (cloudData.tuitionRecords && cloudData.tuitionRecords.length > 0) setTuitionRecords(cloudData.tuitionRecords);
        if (cloudData.academicYear) setAcademicYear(cloudData.academicYear);
      })
      .catch((err) => {
        console.warn('تنبيه أثناء مزامنة بيانات بوابة القسم من Supabase:', err);
      });

    const handleTuitionSync = () => {
      const freshTuition = getStoredData<StudentTuitionRecord[]>('student_tuition_records', INITIAL_TUITION_RECORDS);
      if (freshTuition && freshTuition.length > 0) {
        setTuitionRecords(freshTuition);
      }
    };

    const handleCoursesOrAssignmentsSync = () => {
      const curCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const curTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const curProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rec = reconcileCoursesWithTeacherCourses(curCourses, curTCs, curProfiles);
      setCourses(rec.reconciledCourses);
      setTeacherCourses(rec.reconciledTCs);
      if (rec.hasChanges) {
        saveStoredData('courses', rec.reconciledCourses);
        saveStoredData('teacher_courses', rec.reconciledTCs);
      }
    };

    const unsubscribeYear = subscribeToAcademicYearChanges((liveYear: string) => {
      setAcademicYear(liveYear);
    });

    window.addEventListener('tuition_records_updated', handleTuitionSync);
    window.addEventListener('courses_updated', handleCoursesOrAssignmentsSync);
    window.addEventListener('teacher_courses_updated', handleCoursesOrAssignmentsSync);
    window.addEventListener('storage', handleTuitionSync);
    window.addEventListener('storage', handleCoursesOrAssignmentsSync);

    return () => {
      window.removeEventListener('tuition_records_updated', handleTuitionSync);
      window.removeEventListener('courses_updated', handleCoursesOrAssignmentsSync);
      window.removeEventListener('teacher_courses_updated', handleCoursesOrAssignmentsSync);
      window.removeEventListener('storage', handleTuitionSync);
      window.removeEventListener('storage', handleCoursesOrAssignmentsSync);
      unsubscribeYear();
    };
  }, [router]);

  // 🌐 مزامنة التبويب النشط مع الرابط
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as DepartmentAdminTab | null;
      if (tabParam && VALID_ADMIN_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    syncTabFromUrl();

    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
    };
  }, []);

  // 🏷️ تحديث عنوان المتصفح ديناميكياً
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tabName = ADMIN_TAB_TITLES[activeTab] || 'لوحة إدارة القسم';
    const activeDeptTitle = currentDepartment?.name || deptName || 'القسم الأكاديمي';
    document.title = `${tabName} | قسم ${activeDeptTitle} — جامعة الإمام جعفر الصادق (ع)`;
  }, [activeTab, currentDepartment, deptName]);

  // 🔀 دالة التبديل بين التبويبات
  const handleTabSwitch = (newTab: DepartmentAdminTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({ tab: newTab }, '', url.toString());
    }
    if (newTab === 'courses' || newTab === 'assignments') {
      const curCourses = getStoredData<Course[]>('courses', INITIAL_COURSES);
      const curTCs = getStoredData<TeacherCourse[]>('teacher_courses', INITIAL_TEACHER_COURSES);
      const curProfiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
      const rec = reconcileCoursesWithTeacherCourses(curCourses, curTCs, curProfiles);
      setCourses(rec.reconciledCourses);
      setTeacherCourses(rec.reconciledTCs);
      if (rec.hasChanges) {
        saveStoredData('courses', rec.reconciledCourses);
        saveStoredData('teacher_courses', rec.reconciledTCs);
      }
    }
  };

  // 📊 إحصائيات سريعة للقسم للأستاذ والطلبة والمواد والتكليفات والدرجات
  const deptTeachersCount = deptTeachers.length; // 👨‍🏫 عدد أساتذة القسم
  const deptStudentsCount = deptStudents.length; // 🎓 عدد طلبة القسم
  const deptCoursesCount = deptCourses.length; // 📖 عدد مواد ومناهج القسم
  const deptTeacherCoursesCount = deptTeacherCourses.length; // 🔗 عدد تكليفات الأساتذة
  const deptGradesCount = deptGrades.length; // 📊 عدد سجلات الدرجات والسعي


  return (
    <ZeroTrustGuard allowedRoles={['department_head', 'rapporteur']} redirectFallback="/admin">
      {/* 🏛️ الحاوية العريضة لتقليل المساحات الجانبية الفارغة */}
      <div className="space-y-6 font-sans w-full max-w-[1900px] mx-auto px-2 sm:px-4 py-4">
      
      {/* 🏛️ الهيدر الكحلي الرسمي وشريط التبويبات الـ 11 لإدارة القسم */}
      <DepartmentPortalHeader
        currentDepartment={currentDepartment}
        currentUser={currentUser}
        academicYear={academicYear}
        formatAcademicYearDisplay={formatAcademicYearDisplay}
        deptName={deptName}
        departments={departments}
        currentDeptId={currentDeptId}
        setCurrentDeptId={setCurrentDeptId}
        isDeptSwitcherDropdownOpen={isDeptSwitcherDropdownOpen}
        setIsDeptSwitcherDropdownOpen={setIsDeptSwitcherDropdownOpen}
        deptSwitcherButtonRef={deptSwitcherButtonRef}
        handleToggleDeptSwitcherDropdown={handleToggleDeptSwitcherDropdown}
        deptSwitcherCoords={deptSwitcherCoords}
        currentHead={currentHead}
        currentRap={currentRap}
        deptTeachersCount={deptTeachers.length}
        deptStudentsCount={deptStudents.length}
        deptCoursesCount={deptCourses.length}
        deptTeacherCoursesCount={deptTeacherCourses.length}
        deptGradesCount={deptGrades.length}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        activeTab={activeTab}
        handleTabSwitch={handleTabSwitch}
      />

      {/* 📇 نافذة / بطاقة بيانات الحساب الأكاديمي الصادر */}
      <DepartmentAccountCardModal
        profile={selectedCardProfile}
        deptName={deptName}
        onClose={() => setSelectedCardProfile(null)}
      />

      {/* ========================================================================= */}
      {/* 1️⃣ تبويب إدارة أساتذة القسم (Teachers CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <DepartmentTeachersTab
          deptTeachers={deptTeachers}
          deptName={deptName}
          teacherCourses={teacherCourses}
          teacherPage={teacherPage}
          setTeacherPage={setTeacherPage}
          teacherPageSize={teacherPageSize}
          setTeacherPageSize={setTeacherPageSize}
          selectedTeacherIds={selectedTeacherIds}
          setSelectedTeacherIds={setSelectedTeacherIds}
          isTeacherModalOpen={isTeacherModalOpen}
          setIsTeacherModalOpen={setIsTeacherModalOpen}
          editingTeacherId={editingTeacherId}
          setEditingTeacherId={setEditingTeacherId}
          teacherName={teacherName}
          setTeacherName={setTeacherName}
          customTeacherEmail={customTeacherEmail}
          setCustomTeacherEmail={setCustomTeacherEmail}
          customTeacherPassword={customTeacherPassword}
          setCustomTeacherPassword={setCustomTeacherPassword}
          teacherGender={teacherGender}
          setTeacherGender={setTeacherGender}
          showTeacherPassword={showTeacherPassword}
          setShowTeacherPassword={setShowTeacherPassword}
          nameError={nameError}
          setNameError={setNameError}
          profiles={profiles}
          isImportingExcel={isImportingExcel}
          isExportingTeachersExcel={isExportingTeachersExcel}
          handleDownloadTeacherTemplate={handleDownloadTeacherTemplate}
          setShowExcelInstructions={setShowExcelInstructions}
          handleTeacherExcelUpload={handleTeacherExcelUpload}
          handleExportTeachersExcel={handleExportTeachersExcel}
          handleSaveTeacher={handleSaveTeacher}
          handleAutoGenerateCredentials={handleAutoGenerateCredentials}
          passwordCriteria={passwordCriteria}
          passwordStrengthScore={passwordStrengthScore}
          handleBulkDeleteTeachers={handleBulkDeleteTeachers}
          handleBulkExportTeachersExcel={handleBulkExportTeachersExcel}
          toggleSelectAllTeachers={toggleSelectAllTeachers}
          toggleSelectTeacher={toggleSelectTeacher}
          handleMoveTeacher={handleMoveTeacher}
          setSingleTeacherPrintProfile={setSingleTeacherPrintProfile}
          setShowTeacherPrintModal={setShowTeacherPrintModal}
          setSelectedCardProfile={setSelectedCardProfile}
          handleDeleteTeacher={handleDeleteTeacher}
        />
      )}

      {/* ========================================================================= */}
      {/* 2️⃣ تبويب إدارة طلاب القسم (Students CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <DepartmentStudentsTab
          deptStudents={deptStudents}
          deptName={deptName}
          academicYear={academicYear}
          filteredStudents={filteredStudents}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          filterStudentStage={filterStudentStage}
          setFilterStudentStage={setFilterStudentStage}
          filterStudentStudyType={filterStudentStudyType}
          setFilterStudentStudyType={setFilterStudentStudyType}
          studentGroup={studentGroup}
          setStudentGroup={setStudentGroup}
          filterStudentGroup={filterStudentGroup}
          setFilterStudentGroup={setFilterStudentGroup}
          stageGroupConfigs={stageGroupConfigs}
          isStageGroupModalOpen={isStageGroupModalOpen}
          setIsStageGroupModalOpen={setIsStageGroupModalOpen}
          handleSaveStageGroupConfig={handleSaveStageGroupConfig}
          handleUpdateStudentsGroupBatch={handleUpdateStudentsGroupBatch}
          handleBulkAssignGroup={handleBulkAssignGroup}
          studentPage={studentPage}
          setStudentPage={setStudentPage}
          studentPageSize={studentPageSize}
          setStudentPageSize={setStudentPageSize}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          isStudentModalOpen={isStudentModalOpen}
          setIsStudentModalOpen={setIsStudentModalOpen}
          editingStudentId={editingStudentId}
          setEditingStudentId={setEditingStudentId}
          studentName={studentName}
          setStudentName={setStudentName}
          studentNameError={studentNameError}
          setStudentNameError={setStudentNameError}
          studentStage={studentStage}
          setStudentStage={setStudentStage}
          isStudentStageDropdownOpen={isStudentStageDropdownOpen}
          setIsStudentStageDropdownOpen={setIsStudentStageDropdownOpen}
          stageButtonRef={stageButtonRef}
          stageDropdownCoords={stageDropdownCoords}
          handleToggleStudentStageDropdown={handleToggleStudentStageDropdown}
          studentGender={studentGender}
          setStudentGender={setStudentGender}
          studentStudyType={studentStudyType}
          setStudentStudyType={setStudentStudyType}
          customStudentEmail={customStudentEmail}
          setCustomStudentEmail={setCustomStudentEmail}
          customStudentPassword={customStudentPassword}
          setCustomStudentPassword={setCustomStudentPassword}
          showStudentPassword={showStudentPassword}
          setShowStudentPassword={setShowStudentPassword}
          studentPasswordCriteria={studentPasswordCriteria}
          studentPasswordStrengthScore={studentPasswordStrengthScore}
          profiles={profiles}
          isImportingStudentExcel={isImportingStudentExcel}
          isExportingStudentsExcel={isExportingStudentsExcel}
          handleDownloadStudentTemplate={handleDownloadStudentTemplate}
          setShowStudentExcelInstructions={setShowStudentExcelInstructions}
          handleStudentExcelUpload={handleStudentExcelUpload}
          handleExportStudentsExcel={handleExportStudentsExcel}
          handleSaveStudent={handleSaveStudent}
          handleAutoGenerateStudentCredentials={handleAutoGenerateStudentCredentials}
          handleBulkDeleteStudents={handleBulkDeleteStudents}
          handleBulkExportStudentsExcel={handleBulkExportStudentsExcel}
          toggleSelectAllStudents={toggleSelectAllStudents}
          toggleSelectStudent={toggleSelectStudent}
          handlePromoteStudent={handlePromoteStudent}
          setSingleStudentPrintProfile={setSingleStudentPrintProfile}
          setShowStudentPrintModal={setShowStudentPrintModal}
          setSelectedCardProfile={setSelectedCardProfile}
          handleDeleteStudent={handleDeleteStudent}
          isBulkPromotionModalOpen={isBulkPromotionModalOpen}
          setIsBulkPromotionModalOpen={setIsBulkPromotionModalOpen}
          bulkPromoteSourceStage={bulkPromoteSourceStage}
          setBulkPromoteSourceStage={setBulkPromoteSourceStage}
          handleBulkPromoteStage={handleBulkPromoteStage}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}

      {/* ========================================================================= */}
      {/* 3️⃣ تبويب إدارة المواد الدراسية (Courses CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <DepartmentCoursesTab
          deptName={deptName}
          deptCourses={deptCourses}
          courses={courses}
          deptTeachers={deptTeachers}
          courseSearch={courseSearch}
          setCourseSearch={setCourseSearch}
          filterCourseStage={filterCourseStage}
          setFilterCourseStage={setFilterCourseStage}
          filterCourseSemester={filterCourseSemester}
          setFilterCourseSemester={setFilterCourseSemester}
          filterCourseType={filterCourseType}
          setFilterCourseType={setFilterCourseType}
          selectedCourseIds={selectedCourseIds}
          setSelectedCourseIds={setSelectedCourseIds}
          coursePage={coursePage}
          setCoursePage={setCoursePage}
          coursePageSize={coursePageSize}
          setCoursePageSize={setCoursePageSize}
          isCourseModalOpen={isCourseModalOpen}
          setIsCourseModalOpen={setIsCourseModalOpen}
          editingCourseId={editingCourseId}
          setEditingCourseId={setEditingCourseId}
          courseName={courseName}
          setCourseName={setCourseName}
          courseCode={courseCode}
          setCourseCode={setCourseCode}
          courseCredits={courseCredits}
          setCourseCredits={setCourseCredits}
          courseStage={courseStage}
          setCourseStage={setCourseStage}
          courseSemester={courseSemester}
          setCourseSemester={setCourseSemester}
          courseType={courseType}
          setCourseType={setCourseType}
          courseTheoryTeacherId={courseTheoryTeacherId}
          setCourseTheoryTeacherId={setCourseTheoryTeacherId}
          coursePracticalTeacherId={coursePracticalTeacherId}
          setCoursePracticalTeacherId={setCoursePracticalTeacherId}
          isCourseTheoryDropdownOpen={isCourseTheoryDropdownOpen}
          setIsCourseTheoryDropdownOpen={setIsCourseTheoryDropdownOpen}
          isCoursePracticalDropdownOpen={isCoursePracticalDropdownOpen}
          setIsCoursePracticalDropdownOpen={setIsCoursePracticalDropdownOpen}
          theoryTeacherBtnRef={theoryTeacherBtnRef}
          practicalTeacherBtnRef={practicalTeacherBtnRef}
          theoryTeacherCoords={theoryTeacherCoords}
          practicalTeacherCoords={practicalTeacherCoords}
          handleToggleCourseTheoryDropdown={handleToggleCourseTheoryDropdown}
          handleToggleCoursePracticalDropdown={handleToggleCoursePracticalDropdown}
          courseIsSupplementaryEnabled={courseIsSupplementaryEnabled}
          setCourseIsSupplementaryEnabled={setCourseIsSupplementaryEnabled}
          courseIsFinalExamEnabled={courseIsFinalExamEnabled}
          setCourseIsFinalExamEnabled={setCourseIsFinalExamEnabled}
          examToggleConfirmation={examToggleConfirmation}
          setExamToggleConfirmation={setExamToggleConfirmation}
          handleConfirmExamToggle={handleConfirmExamToggle}
          quickAssignConfig={quickAssignConfig}
          setQuickAssignConfig={setQuickAssignConfig}
          handleSaveQuickAssign={handleSaveQuickAssign}
          handleOpenQuickAssign={handleOpenQuickAssign}
          handleSaveCourse={handleSaveCourse}
          handleDeleteCourse={handleDeleteCourse}
          handleBulkDeleteCourses={handleBulkDeleteCourses}
          handleExportCoursesExcel={handleExportCoursesExcel}
          isExportingCoursesExcel={isExportingCoursesExcel}
          handleExportCoursesPDF={handleExportCoursesPDF}
          showCourseExcelInstructions={showCourseExcelInstructions}
          setShowCourseExcelInstructions={setShowCourseExcelInstructions}
          isImportingCourseExcel={isImportingCourseExcel}
          handleCourseExcelUpload={handleCourseExcelUpload}
          handleDownloadCourseTemplate={handleDownloadCourseTemplate}
          handleOpenAssessmentModal={handleOpenAssessmentModal}
          handleBulkToggleFinalExam={handleBulkToggleFinalExam}
          handleBulkToggleSupplementaryExam={handleBulkToggleSupplementaryExam}
          filteredCourses={filteredCourses}
          getStageNameInArabic={getStageNameInArabic}
          finalOpenCount={finalOpenCount}
          isBulkFinalOpen={isBulkFinalOpen}
          isBulkFinalPartial={isBulkFinalPartial}
          isBulkSupOpen={isBulkSupOpen}
          isBulkSupPartial={isBulkSupPartial}
          supOpenCount={supOpenCount}
          activeTargetRoundCourses={activeTargetRoundCourses}
          deptSem1CourseIds={deptSem1CourseIds}
          deptSem2CourseIds={deptSem2CourseIds}
          isExportingCoursesPDF={isExportingCoursesPDF}
          getCourseTheoryTeachers={getCourseTheoryTeachers}
          getCoursePracticalTeachers={getCoursePracticalTeachers}
          requestToggleRoundAction={requestToggleRoundAction}
        />
      )}

      {/* ========================================================================= */}
      {/* 4️⃣ تبويب تكليف الأساتذة بالمواد (Course Assignments CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <DepartmentAssignmentsTab
          deptTeacherCourses={deptTeacherCourses}
          deptTeachers={deptTeachers}
          deptCourses={deptCourses}
          courses={courses}
          deptName={deptName}
          assignmentSearch={assignmentSearch}
          setAssignmentSearch={setAssignmentSearch}
          filterAssignmentTeacher={filterAssignmentTeacher}
          setFilterAssignmentTeacher={setFilterAssignmentTeacher}
          filterAssignmentStage={filterAssignmentStage}
          setFilterAssignmentStage={setFilterAssignmentStage}
          filterAssignmentSemester={filterAssignmentSemester}
          setFilterAssignmentSemester={setFilterAssignmentSemester}
          filterAssignmentRole={filterAssignmentRole}
          setFilterAssignmentRole={setFilterAssignmentRole}
          filteredTeacherCourses={filteredTeacherCourses}
          selectedAssignmentIds={selectedAssignmentIds}
          setSelectedAssignmentIds={setSelectedAssignmentIds}
          assignmentPage={assignmentPage}
          setAssignmentPage={setAssignmentPage}
          assignmentPageSize={assignmentPageSize}
          setAssignmentPageSize={setAssignmentPageSize}
          isAssignmentModalOpen={isAssignmentModalOpen}
          setIsAssignmentModalOpen={setIsAssignmentModalOpen}
          editingAssignment={editingAssignment}
          setEditingAssignment={setEditingAssignment}
          selectedTeacherId={selectedTeacherId}
          setSelectedTeacherId={setSelectedTeacherId}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          selectedAssignRole={selectedAssignRole}
          setSelectedAssignRole={setSelectedAssignRole}
          isAssignTeacherDropdownOpen={isAssignTeacherDropdownOpen}
          setIsAssignTeacherDropdownOpen={setIsAssignTeacherDropdownOpen}
          assignTeacherButtonRef={assignTeacherButtonRef}
          assignTeacherCoords={assignTeacherCoords}
          handleToggleAssignTeacherDropdown={handleToggleAssignTeacherDropdown}
          assignTeacherSearchQuery={assignTeacherSearchQuery}
          setAssignTeacherSearchQuery={setAssignTeacherSearchQuery}
          isAssignCourseDropdownOpen={isAssignCourseDropdownOpen}
          setIsAssignCourseDropdownOpen={setIsAssignCourseDropdownOpen}
          assignCourseButtonRef={assignCourseButtonRef}
          assignCourseCoords={assignCourseCoords}
          handleToggleAssignCourseDropdown={handleToggleAssignCourseDropdown}
          assignCourseSearchQuery={assignCourseSearchQuery}
          setAssignCourseSearchQuery={setAssignCourseSearchQuery}
          isFilterTeacherDropdownOpen={isFilterTeacherDropdownOpen}
          setIsFilterTeacherDropdownOpen={setIsFilterTeacherDropdownOpen}
          filterTeacherButtonRef={filterTeacherButtonRef}
          filterTeacherCoords={filterTeacherCoords}
          handleToggleFilterTeacherDropdown={handleToggleFilterTeacherDropdown}
          filterTeacherSearchQuery={filterTeacherSearchQuery}
          setFilterTeacherSearchQuery={setFilterTeacherSearchQuery}
          isExportingAssignmentsExcel={isExportingAssignmentsExcel}
          handleExportAssignmentsExcel={handleExportAssignmentsExcel}
          setAssignmentsPrintScope={setAssignmentsPrintScope}
          setShowAssignmentsPrintModal={setShowAssignmentsPrintModal}
          handleSaveEditedAssignment={handleSaveEditedAssignment}
          handleAssignTeacher={handleAssignTeacher}
          handleBulkRemoveAssignments={handleBulkRemoveAssignments}
          handleOpenEditAssignment={handleOpenEditAssignment}
          handleRemoveAssignment={handleRemoveAssignment}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}

      {/* ========================================================================= */}
      {/* 5️⃣ تبويب مراقبة الدرجات والسعي (Grades & Performance) */}
      {/* ========================================================================= */}
      {activeTab === 'grades' && (
        <DepartmentGradesTab
          deptGrades={deptGrades}
          courses={courses}
          deptCourses={deptCourses}
          deptName={deptName}
          filteredGrades={filteredGrades}
          selectedGradeIds={selectedGradeIds}
          setSelectedGradeIds={setSelectedGradeIds}
          gradeSearch={gradeSearch}
          setGradeSearch={setGradeSearch}
          filterGradeCourse={filterGradeCourse}
          setFilterGradeCourse={setFilterGradeCourse}
          filterGradeStage={filterGradeStage}
          handleSelectGradeStage={handleSelectGradeStage}
          filterGradeSemester={filterGradeSemester}
          setFilterGradeSemester={setFilterGradeSemester}
          isGradeCourseDropdownOpen={isGradeCourseDropdownOpen}
          setIsGradeCourseDropdownOpen={setIsGradeCourseDropdownOpen}
          gradeCourseDropdownRef={gradeCourseDropdownRef}
          gradeSelectableCourses={gradeSelectableCourses}
          currentActiveScheme={currentActiveScheme}
          isExportingGradesExcel={isExportingGradesExcel}
          handleExportGradesExcel={handleExportGradesExcel}
          handleBulkDeleteGrades={handleBulkDeleteGrades}
          gradePage={gradePage}
          setGradePage={setGradePage}
          gradePageSize={gradePageSize}
          setGradePageSize={setGradePageSize}
          calculateCourseworkTotal={calculateCourseworkTotal}
          calculateFinalTotal={calculateFinalTotal}
          getLetterGrade={getLetterGrade}
          getCourseAssessmentScheme={getCourseAssessmentScheme}
          getStageNameInArabic={getStageNameInArabic}
        />
      )}
      {/* ========================================================================= */}
      {/* 6️⃣ تبويب إدارة الجدول الأسبوعي والمحاضرات والعطل (Schedule Management CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <DepartmentScheduleTab
          deptName={deptName}
          currentDeptId={currentDeptId}
          courses={courses}
          deptCourses={deptCourses}
          deptTeachers={deptTeachers}
          teacherCourses={teacherCourses}
          scheduleLectures={scheduleLectures}
          currentScheduleConfig={currentScheduleConfig}
          scheduleCurrentAcademicWeek={scheduleCurrentAcademicWeek}
          selectedScheduleStage={selectedScheduleStage}
          setSelectedScheduleStage={setSelectedScheduleStage}
          selectedScheduleSemester={selectedScheduleSemester}
          setSelectedScheduleSemester={setSelectedScheduleSemester}
          selectedScheduleStudyType={selectedScheduleStudyType}
          setSelectedScheduleStudyType={setSelectedScheduleStudyType}
          selectedScheduleWeek={selectedScheduleWeek}
          setSelectedScheduleWeek={setSelectedScheduleWeek}
          selectedScheduleLectureIds={selectedScheduleLectureIds}
          setSelectedScheduleLectureIds={setSelectedScheduleLectureIds}
          currentLecConflicts={currentLecConflicts}
          handleDownloadScheduleTemplate={handleDownloadScheduleTemplate}
          setShowScheduleExcelInstructions={setShowScheduleExcelInstructions}
          handleScheduleExcelUpload={handleScheduleExcelUpload}
          isImportingScheduleExcel={isImportingScheduleExcel}
          handleExportScheduleToExcel={handleExportScheduleToExcel}
          setIsPreviewScheduleModalOpen={setIsPreviewScheduleModalOpen}
          setIsSchedulePrintModalOpen={setIsSchedulePrintModalOpen}
          handleBulkDeleteScheduleLectures={handleBulkDeleteScheduleLectures}
          handleToggleWorkingDay={handleToggleWorkingDay}
          setPendingSemesterStartDate={setPendingSemesterStartDate}
          setShowSemesterDateConfirmModal={setShowSemesterDateConfirmModal}
          isLectureInCurrentDept={isLectureInCurrentDept}
          handleEditLecture={handleEditLecture}
          handleDeleteLecture={handleDeleteLecture}
          handleSaveLecture={handleSaveLecture}
          handleSaveSemesterStartDate={handleSaveSemesterStartDate}
          resetLectureModalState={resetLectureModalState}
          setSuccessMessage={setSuccessMessage}
          lastScheduleScrollYRef={lastScheduleScrollYRef}
          isLectureModalOpen={isLectureModalOpen}
          setIsLectureModalOpen={setIsLectureModalOpen}
          editingLectureId={editingLectureId}
          setEditingLectureId={setEditingLectureId}
          recentlyAddedLectureId={recentlyAddedLectureId}
          lecDay={lecDay}
          setLecDay={setLecDay}
          lecStartTime={lecStartTime}
          setLecStartTime={setLecStartTime}
          lecEndTime={lecEndTime}
          setLecEndTime={setLecEndTime}
          lecRoom={lecRoom}
          setLecRoom={setLecRoom}
          lecCourseId={lecCourseId}
          setLecCourseId={setLecCourseId}
          lecTeacherId={lecTeacherId}
          setLecTeacherId={setLecTeacherId}
          lecType={lecType}
          setLecType={setLecType}
          lecColor={lecColor}
          setLecColor={setLecColor}
          lecNotes={lecNotes}
          setLecNotes={setLecNotes}
          lecDate={lecDate}
          setLecDate={setLecDate}
          lecWeekNumber={lecWeekNumber}
          setLecWeekNumber={setLecWeekNumber}
          lecStudyType={lecStudyType}
          setLecStudyType={setLecStudyType}
          lecAutoCascadeWeeks={lecAutoCascadeWeeks}
          setLecAutoCascadeWeeks={setLecAutoCascadeWeeks}
          lecCascadeShiftOption={lecCascadeShiftOption}
          setLecCascadeShiftOption={setLecCascadeShiftOption}
          closeModalAfterSave={closeModalAfterSave}
          setCloseModalAfterSave={setCloseModalAfterSave}
          lecCourseSearchTerm={lecCourseSearchTerm}
          setLecCourseSearchTerm={setLecCourseSearchTerm}
          lecCourseTabFilter={lecCourseTabFilter}
          setLecCourseTabFilter={setLecCourseTabFilter}
          lecTeacherSearchTerm={lecTeacherSearchTerm}
          setLecTeacherSearchTerm={setLecTeacherSearchTerm}
          lecTargetGroup={lecTargetGroup}
          setLecTargetGroup={setLecTargetGroup}
          selectedScheduleGroup={selectedScheduleGroup} // 👥 تمرير الكروب الأكاديمي المختار للتبويب
          setSelectedScheduleGroup={setSelectedScheduleGroup} // 🔄 تمرير دالة تغيير الكروب الأكاديمي المختار
          stageGroupConfigs={stageGroupConfigs}
          lecModalSuccessMsg={lecModalSuccessMsg}
          setLecModalSuccessMsg={setLecModalSuccessMsg}
        />
      )}

      {/* ========================================================================= */}
      {/* 7️⃣ تبويب متابعة الحضور والإنذارات الأكاديمية لمسار بولونيا (Attendance & Warnings) */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <DepartmentAttendanceTab
          deptName={deptName}
          currentDeptId={currentDeptId}
          deptCourses={deptCourses}
          deptStudents={deptStudents}
          attendanceRecords={attendanceRecords}
          setAttendanceRecords={setAttendanceRecords}
          currentScheduleConfig={currentScheduleConfig}
          excuseRequests={excuseRequests}
          currentHead={currentHead}
          currentRap={currentRap}
          scheduleCurrentAcademicWeek={scheduleCurrentAcademicWeek}
          attendanceViewMode={attendanceViewMode}
          setAttendanceViewMode={setAttendanceViewMode}
          filterAttendanceStage={filterAttendanceStage}
          setFilterAttendanceStage={setFilterAttendanceStage}
          filterAttendanceSemester={filterAttendanceSemester}
          setFilterAttendanceSemester={setFilterAttendanceSemester}
          filterAttendanceStudyType={filterAttendanceStudyType}
          setFilterAttendanceStudyType={setFilterAttendanceStudyType}
          filterAttendanceWeek={filterAttendanceWeek}
          setFilterAttendanceWeek={setFilterAttendanceWeek}
          isAttendanceWeekDropdownOpen={isAttendanceWeekDropdownOpen}
          setIsAttendanceWeekDropdownOpen={setIsAttendanceWeekDropdownOpen}
          attendanceSearch={attendanceSearch}
          setAttendanceSearch={setAttendanceSearch}
          filterAttendanceCourse={filterAttendanceCourse}
          setFilterAttendanceCourse={setFilterAttendanceCourse}
          isAttendanceCourseDropdownOpen={isAttendanceCourseDropdownOpen}
          setIsAttendanceCourseDropdownOpen={setIsAttendanceCourseDropdownOpen}
          filterAttendanceStatus={filterAttendanceStatus}
          setFilterAttendanceStatus={setFilterAttendanceStatus}
          isAttendanceStatusDropdownOpen={isAttendanceStatusDropdownOpen}
          setIsAttendanceStatusDropdownOpen={setIsAttendanceStatusDropdownOpen}
          isSyncingAttendance={isSyncingAttendance}
          setIsSyncingAttendance={setIsSyncingAttendance}
          selectedAttendanceStudentIds={selectedAttendanceStudentIds}
          setSelectedAttendanceStudentIds={setSelectedAttendanceStudentIds}
          attendancePage={attendancePage}
          setAttendancePage={setAttendancePage}
          attendancePageSize={attendancePageSize}
          setAttendancePageSize={setAttendancePageSize}
          isExportingAttendanceExcel={isExportingAttendanceExcel}
          handleExportAttendanceExcel={handleExportAttendanceExcel}
          setIsDurationSettingsModalOpen={setIsDurationSettingsModalOpen}
          setIsDeptExcuseReviewOpen={setIsDeptExcuseReviewOpen}
          setIsAttendanceNoticeModalOpen={setIsAttendanceNoticeModalOpen}
          setAttendanceNoticeTargetStudent={setAttendanceNoticeTargetStudent}
          setAttendanceNoticeDefaultCategory={setAttendanceNoticeDefaultCategory}
          setSuccessMessage={setSuccessMessage}
          syncAttendanceRecordsFromSupabase={syncAttendanceRecordsFromSupabase}
          filterAttendanceGroup={filterAttendanceGroup}
          setFilterAttendanceGroup={setFilterAttendanceGroup}
          stageGroupConfigs={stageGroupConfigs}
        />
      )}

      {/* ========================================================================= */}
      {/* 8️⃣ تبويب الرسوم البيانية والإحصائيات الأكاديمية (Analytics Dashboard) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <DepartmentAnalyticsTab
          grades={deptGrades}
          courses={deptCourses}
          students={deptStudents}
          teachers={deptTeachers}
          teacherCourses={deptTeacherCourses}
          attendanceRecords={attendanceRecords}
          departmentName={deptName}
        />
      )}
      {/* ========================================================================= */}
      {/* 🎛️ نافذة منبثقة لتخصيص توزيع الدرجات والعناوين لبنود بولونيا الـ 7 (Assessment Scheme Modal) */}
      {/* ========================================================================= */}
      <AssessmentSchemeModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        course={selectedCourseForAssessment}
        tempAssessmentScheme={tempAssessmentScheme}
        setTempAssessmentScheme={setTempAssessmentScheme}
        deptName={deptName}
        onSave={handleSaveAssessmentSchemeModal}
        getStageNameInArabic={getStageNameInArabic}
        getDefaultAssessmentScheme={getDefaultAssessmentScheme}
      />
      {/* ========================================================================= */}
      {/* 8️⃣ تبويب جداول الامتحانات النهائية الفاينل (Final Exam Schedules CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && currentUser && (
        <FinalExamScheduleEditor
          departmentId={currentDeptId}
          departmentName={deptName}
          courses={deptCourses}
          currentUser={currentUser}
          schedules={finalExamSchedules}
          slots={finalExamSlots}
          onSaveSchedule={handleSaveExamSchedule}
          headName={currentHead?.full_name}
          rapporteurName={currentRap?.full_name}
        />
      )}

      {/* ========================================================================= */}
      {/* 📚 8.5 تبويب تدقيق وإشراف التكليفات والامتحانات الفصلية لمواد القسم */}
      {/* ========================================================================= */}
      {activeTab === 'course_tasks' && (
        <DepartmentAssessmentsOverview
          departmentId={currentDeptId}
          departmentName={deptName}
        />
      )}

      {/* ========================================================================= */}
      {/* 9️⃣ تبويب تسديد الأقساط الدراسية (Tuition Fees & Installments CRUD) */}
      {/* ========================================================================= */}
      {activeTab === 'tuition' && currentUser && (
        <TuitionManagementTab
          departmentId={currentDeptId}
          departmentName={deptName}
          students={profiles.filter((p) => p.role === 'student' && p.department_id === currentDeptId)}
          tuitionRecords={tuitionRecords}
          onSaveTuitionRecord={handleSaveTuitionRecord}
          currentUser={currentUser}
          academicYear={academicYear}
        />
      )}


      {/* ========================================================================= */}
      {/* 🏛️ نافذة مصفوفة إشغال القاعات والمختبرات الشاملة (Master Campus Matrix) */}
      {/* ========================================================================= */}
      <MasterHallMatrixModal
        isOpen={isMasterMatrixModalOpen}
        onClose={() => setIsMasterMatrixModalOpen(false)}
        lectures={scheduleLectures}
        departments={departments}
      />

      {/* ℹ️ نافذة تعليمات وضوابط استيراد ملف Excel لكادر القسم */}
      {/* 📊 مكون مودالات إرشادات وتقارير استيراد الإكسل الشاملة لكافة الأقسام */}
      <DepartmentExcelModals
        deptName={deptName}
        showExcelInstructions={showExcelInstructions}
        setShowExcelInstructions={setShowExcelInstructions}
        importReport={importReport}
        setImportReport={setImportReport}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
        handleDownloadTeacherTemplate={handleDownloadTeacherTemplate}
        showStudentExcelInstructions={showStudentExcelInstructions}
        setShowStudentExcelInstructions={setShowStudentExcelInstructions}
        studentImportReport={studentImportReport}
        setStudentImportReport={setStudentImportReport}
        studentActiveReportTab={studentActiveReportTab}
        setStudentActiveReportTab={setStudentActiveReportTab}
        handleDownloadStudentTemplate={handleDownloadStudentTemplate}
        showCourseExcelInstructions={showCourseExcelInstructions}
        setShowCourseExcelInstructions={setShowCourseExcelInstructions}
        courseImportReport={courseImportReport}
        setCourseImportReport={setCourseImportReport}
        courseActiveReportTab={courseActiveReportTab}
        setCourseActiveReportTab={setCourseActiveReportTab}
        handleDownloadCourseTemplate={handleDownloadCourseTemplate}
        showScheduleExcelInstructions={showScheduleExcelInstructions}
        setShowScheduleExcelInstructions={setShowScheduleExcelInstructions}
        scheduleImportReport={scheduleImportReport}
        setScheduleImportReport={setScheduleImportReport}
        scheduleActiveReportTab={scheduleActiveReportTab}
        setScheduleActiveReportTab={setScheduleActiveReportTab}
        handleDownloadScheduleTemplate={handleDownloadScheduleTemplate}
      />

      {/* 📑 نافذة مراجعة واعتماد طلبات الإجازات والأعذار الرسمية للقسم */}
      <ExcuseRequestsReviewModal
        isOpen={isDeptExcuseReviewOpen}
        onClose={() => setIsDeptExcuseReviewOpen(false)}
        requests={excuseRequests.filter((e) => e.department_id === currentDeptId)}
        reviewerId={currentUser?.id || 'dept-head-1'}
        reviewerName={currentUser?.full_name || 'رئيس القسم الأكاديمي'}
        reviewerRole="department_head"
        onUpdateRequest={(updatedReq) => {
          const newExcuses = excuseRequests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
          setExcuseRequests(newExcuses);
          saveStoredData('excuse_requests', newExcuses);
        }}
        onUpdateAttendanceRecord={(courseId, weekNumber, studentId, excuseReason, docRef) => {
          const updatedRecords = attendanceRecords.map((rec) => {
            if (rec.course_id === courseId && rec.week_number === weekNumber && rec.student_id === studentId) {
              return {
                ...rec,
                status: 'absent_excused' as const,
                excuse_reason: excuseReason,
                excuse_document_ref: docRef,
                notes: 'تم اعتماد الإجازة بقرار رسمي من رئاسة القسم',
              };
            }
            return rec;
          });
          setAttendanceRecords(updatedRecords);
          saveStoredData('student_attendance_records', updatedRecords);
          saveMultipleAttendanceRecordsToSupabase(updatedRecords); // ☁️ حفظ ومزامنة حالة الحضور المقبولة عذراً مع Supabase فوراً
        }}
      />

      {/* 🗑️ كارد الحذف والتأكيد الاحترافي الفاخر العام لكافة عناصر البوابة */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        itemName={deleteModalConfig.itemName}
        itemDetails={deleteModalConfig.itemDetails}
        warningMessage={deleteModalConfig.warningMessage}
        warningNote={deleteModalConfig.warningNote}
        confirmText={deleteModalConfig.confirmText}
        variant={deleteModalConfig.variant}
        iconType={deleteModalConfig.iconType}
        onConfirm={deleteModalConfig.onConfirm}
        onClose={() => setDeleteModalConfig((prev: DepartmentDeleteModalConfig) => ({ ...prev, isOpen: false }))} // 🛑 إغلاق نافذة الحذف بأمان نمطي كامل
      />

      {/* 🔒 نافذة التأكيد الاحترافية الفاخرة لفتح وقفل الأدوار الأكاديمية (الدور الأول / الثاني للكورسين) */}
      {/* 🔐 كارت تأكيد الفتح والإغلاق العام بنصوص سوداء في المنتصف بدون أي سكرول */}
      {/* 🔒 نافذة التأكيد الاحترافية الفاخرة لفتح وقفل الأدوار الأكاديمية (الدور الأول / الثاني للكورسين) */}
      <RoundConfirmModal
        modalData={roundConfirmModal}
        onClose={() => setRoundConfirmModal(null)}
        onConfirm={executeConfirmToggleRoundAction}
      />

      {/* 🗓️ نافذة معاينة جدول الطلاب بتصميم صلب وثابت تماماً بدون أي حركة أو انزلاق */}

      {/* ⚙️ نافذة تخصيص وإعداد مدد وساعات المحاضرات لرئيس القسم والمقرر */}
      <DepartmentDurationSettingsModal
        isOpen={isDurationSettingsModalOpen}
        onClose={() => setIsDurationSettingsModalOpen(false)}
        departmentId={currentDeptId}
        departmentName={deptName}
        courses={currentDeptId ? courses.filter((c) => c.department_id === currentDeptId) : courses}
        onConfigSaved={() => {
          setSuccessMessage('تم حفظ واعتماد تخصيص ساعات المحاضرات بنجاح ومزامنتها مع كافة اللوحات.');
          setTimeout(() => setSuccessMessage(''), 4500);
        }}
      />

      {/* 📢 نافذة التبليغات والتنبيهات الذكية للحضور والغيابات والعطل والامتحانات */}
      <AttendanceNoticeModal
        isOpen={isAttendanceNoticeModalOpen}
        onClose={() => {
          setIsAttendanceNoticeModalOpen(false);
          setAttendanceNoticeTargetStudent(null);
        }}
        departmentId={currentDeptId}
        departmentName={deptName}
        students={deptStudents}
        initialStudent={attendanceNoticeTargetStudent}
        initialSelectedStudentIds={selectedAttendanceStudentIds}
        defaultCategory={attendanceNoticeDefaultCategory}
        onNoticeSent={(summary) => {
          setSuccessMessage(summary);
          setTimeout(() => setSuccessMessage(''), 4500);
        }}
      />

      {/* 🖨️ 1. نافذة معاينة وطباعة بطاقات اعتماد الأساتذة (10 بطاقات بالورقة الواحدة A4 بنظام الشبكة 2x5) */}
      {/* 🖨️ مودالات المعاينة والطباعة المعتمدة (الجدول، بطاقات الكادر التدريسي، بطاقات الطلبة، وجدول التكليفات الرسمي) */}
      <DepartmentPrintModals
        isPreviewScheduleModalOpen={isPreviewScheduleModalOpen}
        setIsPreviewScheduleModalOpen={setIsPreviewScheduleModalOpen}
        isSchedulePrintModalOpen={isSchedulePrintModalOpen}
        setIsSchedulePrintModalOpen={setIsSchedulePrintModalOpen}
        currentDeptId={currentDeptId}
        deptName={deptName}
        currentHead={currentHead}
        currentRap={currentRap}
        selectedScheduleStage={selectedScheduleStage}
        scheduleLectures={scheduleLectures}
        scheduleConfigs={scheduleConfigs}
        academicYear={academicYear}
        selectedScheduleSemester={selectedScheduleSemester}
        selectedScheduleStudyType={selectedScheduleStudyType}
        selectedScheduleGroup={selectedScheduleGroup} // 👥 تمرير الكروب المحدد لفتح المعاينة والطباعة عليه مباشرة
        stageGroupConfigs={stageGroupConfigs} // 👥 تمرير إعدادات الكروبات للطباعة والمعاينة
        showTeacherPrintModal={showTeacherPrintModal}
        setShowTeacherPrintModal={setShowTeacherPrintModal}
        singleTeacherPrintProfile={singleTeacherPrintProfile}
        setSingleTeacherPrintProfile={setSingleTeacherPrintProfile}
        selectedTeacherIds={selectedTeacherIds}
        deptTeachers={deptTeachers}
        showStudentPrintModal={showStudentPrintModal}
        setShowStudentPrintModal={setShowStudentPrintModal}
        singleStudentPrintProfile={singleStudentPrintProfile}
        setSingleStudentPrintProfile={setSingleStudentPrintProfile}
        selectedStudentIds={selectedStudentIds}
        deptStudents={deptStudents}
        studentPrintStageFilter={studentPrintStageFilter}
        setStudentPrintStageFilter={setStudentPrintStageFilter}
        studentPrintStudyFilter={studentPrintStudyFilter}
        setStudentPrintStudyFilter={setStudentPrintStudyFilter}
        showAssignmentsPrintModal={showAssignmentsPrintModal}
        setShowAssignmentsPrintModal={setShowAssignmentsPrintModal}
        assignmentsPrintScope={assignmentsPrintScope}
        setAssignmentsPrintScope={setAssignmentsPrintScope}
        deptTeacherCourses={deptTeacherCourses}
        filteredTeacherCourses={filteredTeacherCourses}
        courses={courses}
        isMounted={isMounted}
      />

      {/* ========================================================================= */}
      {/* 👨‍🏫 مودال CRUD لإدارة وتكليف المواد لكل أستاذ على حدة (Per-Teacher CRUD) */}
      {/* ========================================================================= */}
      {/* 👨‍🏫 مودال CRUD لإدارة وتكليف المواد لكل أستاذ على حدة */}
      <TeacherCourseAssignModal
        isOpen={isTeacherCrudModalOpen && !!crudTeacher}
        onClose={() => {
          setIsTeacherCrudModalOpen(false);
          setCrudTeacher(null);
        }}
        crudTeacher={crudTeacher}
        deptName={deptName}
        deptCourses={deptCourses}
        courses={courses}
        deptTeacherCourses={deptTeacherCourses}
        teacherCrudSearchQuery={teacherCrudSearchQuery}
        setTeacherCrudSearchQuery={setTeacherCrudSearchQuery}
        teacherCrudCourseId={teacherCrudCourseId}
        setTeacherCrudCourseId={setTeacherCrudCourseId}
        handleAssignCourseToSpecificTeacher={handleAssignCourseToSpecificTeacher}
        handleRemoveAssignment={handleRemoveAssignment}
      />

      {/* 🛑 نافذة تأكيد تعديل تاريخ انطلاق الفصل الدراسي (مسار بولونيا) الاحترافية */}
      {/* 🛑 نافذة تأكيد تعديل تاريخ انطلاق الفصل الدراسي (مسار بولونيا) */}
      <SemesterDateConfirmModal
        isOpen={showSemesterDateConfirmModal}
        pendingDate={pendingSemesterStartDate}
        currentStartDate={currentScheduleConfig.start_date || 'غير محدد'}
        onClose={() => {
          setShowSemesterDateConfirmModal(false);
          setPendingSemesterStartDate(null);
        }}
        onConfirm={() => {
          if (pendingSemesterStartDate) {
            handleSaveSemesterStartDate(pendingSemesterStartDate);
            setSuccessMessage('تم اعتماد وتحديث تاريخ انطلاق الفصل الدراسي بنجاح! 📅✨');
            setTimeout(() => setSuccessMessage(''), 4000);
          }
          setShowSemesterDateConfirmModal(false);
          setPendingSemesterStartDate(null);
        }}
      />

      </div>
    </ZeroTrustGuard>
  );
}
