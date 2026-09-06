// 📐 واجهة نمط المواصفات (Specification Pattern Interface) - Clean Architecture & SOLID OCP

// 🏛️ واجهة المواصفة النطاقية العامة
export interface ISpecification<T> {
  // 🔍 فحص هل العنصر يستوفي الشروط والمواصفات
  isSatisfiedBy(candidate: T): boolean;
  // 💬 سبب عدم الاستيفاء إن وجد
  getUnsatisfiedReason?(candidate: T): string | null;
}
