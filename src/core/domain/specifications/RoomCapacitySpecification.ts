// 🏛️ مواصفة مطابقة السعة الاستيعابية للقاعات والمختبرات (Room Capacity Specification) - Clean Architecture

// 📜 استيراد العقود والنماذج
import { ISpecification } from './ISpecification';

// 📥 سياق فحص سعة القاعة
export interface RoomCapacityContext {
  readonly roomName: string; // 🏢 اسم أو رقم القاعة / المختبر
  readonly maxCapacity: number; // 🪑 أقصى سعة استيعابية للكراسي / الأجهزة
  readonly enrolledStudentsCount: number; // 👥 عدد الطلاب المسجلين في الشعبة
  readonly isPracticalLab: boolean; // 🔬 هل هي مختبر عملي (تتطلب مقعداً لكل طالب أمام جهاز)
}

// 🧱 صنف مواصفة سعة القاعة
export class RoomCapacitySpecification
  implements ISpecification<RoomCapacityContext>
{
  // 🔍 فحص هل سعة القاعة كافية وتستوعب كافة الطلبة
  public isSatisfiedBy(context: RoomCapacityContext): boolean {
    if (context.maxCapacity <= 0) {
      return false;
    }

    // في المختبرات العملية يمنع تجاوز السعة تماماً
    if (context.isPracticalLab) {
      return context.enrolledStudentsCount <= context.maxCapacity;
    }

    // في القاعات النظرية يسمح بهامش أقصاه 10%
    const threshold = Math.floor(context.maxCapacity * 1.1);
    return context.enrolledStudentsCount <= threshold;
  }

  // 💬 توضيح سبب تجاوز السعة
  public getUnsatisfiedReason(context: RoomCapacityContext): string | null {
    if (context.isPracticalLab && context.enrolledStudentsCount > context.maxCapacity) {
      return `عدد الطلاب (${context.enrolledStudentsCount}) يتجاوز الطاقة الاستيعابية لمختبر (${context.roomName}) المحددة بـ (${context.maxCapacity}) مقعداً/جهازاً.`;
    }

    const threshold = Math.floor(context.maxCapacity * 1.1);
    if (context.enrolledStudentsCount > threshold) {
      return `عدد الطلاب (${context.enrolledStudentsCount}) يتجاوز السعة القصوى المسموح بها لقاعة (${context.roomName}) المحددة بـ (${context.maxCapacity}) مقعداً.`;
    }

    return null;
  }
}
