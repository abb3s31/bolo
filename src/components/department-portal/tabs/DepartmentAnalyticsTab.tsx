'use client'; // ⚡ تفعيل ميزات العميل في Next.js

import React from 'react'; // ⚛️ استيراد مكتبة ريآكت الأساسية
import AnalyticsCharts from '@/components/AnalyticsCharts'; // 📊 استيراد مكون المخططات والرسوم البيانية
import type { Grade, Course, UserProfile, TeacherCourse, StudentAttendanceRecord } from '@/types'; // 🏷️ استيراد الأنواع والواجهات الصارمة

// 📋 واجهة مدخلات مكون تبويب التحليلات بقواعد صارمة وبدون any
export interface DepartmentAnalyticsTabProps {
  grades: Grade[]; // 📝 مصفوفة درجات وسعي طلبة القسم
  courses: Course[]; // 📚 مصفوفة المقررات والمناهج الدراسية
  students: UserProfile[]; // 👨‍🎓 مصفوفة طلبة القسم
  teachers: UserProfile[]; // 👨‍🏫 مصفوفة الكادر التدريسي
  teacherCourses: TeacherCourse[]; // 🔄 مصفوفة تكليفات الأساتذة بالمواد
  attendanceRecords: StudentAttendanceRecord[]; // 📋 مصفوفة سجلات الحضور والغياب
  departmentName: string; // 🏢 اسم القسم العلمي الحالي
}

// 🏛️ مكون تبويب التحليلات والرسوم البيانية لقسم هندسة الحاسوب
export const DepartmentAnalyticsTab: React.FC<DepartmentAnalyticsTabProps> = ({
  grades, // 📝 الدرجات
  courses, // 📚 المقررات
  students, // 👨‍🎓 الطلبة
  teachers, // 👨‍🏫 الأساتذة
  teacherCourses, // 🔄 التكليفات
  attendanceRecords, // 📋 الحضور
  departmentName, // 🏢 اسم القسم
}) => {
  return (
    // 📦 الحاوية الرئيسية لتبويب التحليلات مع تأثير ظهور ناعم
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 📊 رندر مكون الرسوم البيانية المتطورة */}
      <AnalyticsCharts
        grades={grades} // 📝 تمرير الدرجات
        courses={courses} // 📚 تمرير المواد
        students={students} // 👨‍🎓 تمرير الطلاب
        teachers={teachers} // 👨‍🏫 تمرير التدريسيين
        teacherCourses={teacherCourses} // 🔄 تمرير التكليفات
        attendanceRecords={attendanceRecords} // 📋 تمرير سجلات الحضور
        departmentName={departmentName} // 🏢 تمرير اسم القسم
      />
    </div>
  );
};

export default DepartmentAnalyticsTab; // 🚀 تصدير المكون كافتراضي
