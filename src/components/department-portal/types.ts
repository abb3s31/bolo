// 🏷️ تعريف أنواع البيانات والواجهات المشتركة لبوابة إدارة القسم الأكاديمية
// 🛡️ التزام تام بالأمان النمطي الصارم بدون any أو unknown

import type { Course, TeacherCourse } from '@/types'; // 📚 استيراد كائنات المواد وتكليفات الأساتذة
import type { ConfirmModalIcon } from '@/components/ConfirmDeleteModal'; // 🗑️ نوع أيقونة مودال التأكيد والحذف
export type { RoundActionConfirmation } from './modals/RoundConfirmModal'; // 🔄 إعادة تصدير واجهة تأكيد الأدوار

// 📑 أنواع التبويبات الـ 11 المعتمدة في لوحة تحكم إدارة القسم
export type DepartmentAdminTab =
  | 'teachers'
  | 'students'
  | 'courses'
  | 'assignments'
  | 'grades'
  | 'schedule'
  | 'attendance'
  | 'exams'
  | 'course_tasks'
  | 'tuition'
  | 'analytics';

// 📊 واجهة تقرير نتائج استيراد ملفات الإكسل
export interface ImportSummaryReport {
  totalRows: number; // 🔢 إجمالي عدد الصفوف المقروءة من الملف
  accepted: { name: string; dept: string; email: string }[]; // ✅ السجلات المقبولة بنجاح
  duplicates: { name: string; email: string; dept: string; reason: string }[]; // ⚠️ السجلات المكررة
  rejected: { rowNumber: number; rawName: string; reason: string }[]; // ❌ السجلات المرفوضة لوجود أخطاء
}

// ⚡ واجهة حالة نافذة التعيين السريع لأستاذ المادة
export interface QuickAssignState {
  isOpen: boolean; // 🪟 هل نافذة التعيين السريع مفتوحة حالياً
  course: Course | null; // 📖 كائن المادة الدراسية المراد تعيين أستاذ لها
  role: 'theory' | 'practical'; // 🏷️ صفة التكليف (نظري أم عملي)
  selectedTeacherId: string; // 👨‍🏫 معرف الأستاذ المختار للتعيين
  searchQuery: string; // 🔍 نص البحث السريع عن اسم الأستاذ
}

// 🗑️ واجهة إعدادات نافذة الحذف والتأكيد الأكاديمي العام
export interface DepartmentDeleteModalConfig {
  isOpen: boolean; // 🪟 هل نافذة الحذف مفتوحة
  title: string; // 🏷️ عنوان الحذف
  itemName: string; // 📦 اسم العنصر المراد حذفه
  itemDetails?: string; // 📝 تفاصيل إضافية عن العنصر
  warningMessage?: string; // ⚠️ رسالة تحذيرية للمستخدم
  warningNote?: string; // ℹ️ ملاحظة إضافية عن عواقب الحذف
  confirmText?: string; // 🔘 نص زر التأكيد
  variant?: 'danger' | 'success' | 'warning' | 'info'; // 🎨 نمط ولون المودال
  iconType?: ConfirmModalIcon; // 🖼️ نوع الأيقونة المعروضة
  onConfirm: () => void; // ⚡ الدالة المنفذة عند الضغط على تأكيد
}
