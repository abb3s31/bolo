// ⚖️ مواصفة استحقاق درجات القرار الوزاري للجنة الامتحانية - Clean Architecture & SOLID OCP

// 📜 استيراد العقود
import { ISpecification } from './ISpecification';
import { Grade } from '../entities/Grade';

// 📥 نموذج سياق تقييم استحقاق درجات القرار
export interface DecisionMarksEvaluationContext {
  grade: Grade; // 📊 سجل الدرجة
  requestedMarks: number; // ➕ عدد الدرجات المطلوبة (1 - 5)
  alreadyUsedDecisionMarksThisYear: number; // 🔢 الدرجات المستخدمة مسبقاً خلال السنة (الحد الأقصى 5)
}

// 🧱 صنف مواصفة استحقاق درجات القرار
export class DecisionMarksEligibilitySpecification
  implements ISpecification<DecisionMarksEvaluationContext>
{
  // 🔍 فحص هل الطالب مؤهل لمنح درجات القرار
  public isSatisfiedBy(context: DecisionMarksEvaluationContext): boolean {
    const currentTotal = context.grade.totalScore ? context.grade.totalScore.getValue() : 0;

    // 1. لا يمكن منح درجات قرار لناجح أصلاً (>= 50) إلا لرفع التقدير بشروط خاصة
    if (currentTotal >= 50) {
      return false;
    }

    // 2. يجب أن تكون الدرجة الأصلية 45 فما فوق لتصل إلى 50
    if (currentTotal < 45) {
      return false;
    }

    // 3. الدرجات المطلوبة يجب أن تكون كافية تماماً للوصول إلى 50
    const needed = 50 - currentTotal;
    if (context.requestedMarks < needed) {
      return false;
    }

    // 4. الرصيد الإجمالي المتبقي لدرجات القرار لا يتجاوز 5 درجات بالسنة
    const totalWillUse = context.alreadyUsedDecisionMarksThisYear + context.requestedMarks;
    if (totalWillUse > 5) {
      return false;
    }

    return true;
  }

  // 💬 سبب عدم الاستحقاق إن وجد
  public getUnsatisfiedReason(context: DecisionMarksEvaluationContext): string | null {
    const currentTotal = context.grade.totalScore ? context.grade.totalScore.getValue() : 0;

    if (currentTotal >= 50) {
      return 'الطالب ناجح بالفعل في هذه المادة ولا يحتاج لدرجات قرار للنجاح.';
    }

    if (currentTotal < 45) {
      return `الدرجة الحالية (${currentTotal}) أقل من 45، والتعليمات الوزارية تشترط أن تكون الدرجة 45 فما فوق للاستفادة من درجات القرار الـ 5.`;
    }

    const needed = 50 - currentTotal;
    if (context.requestedMarks < needed) {
      return `الدرجات المطلوبة (${context.requestedMarks}) لا تكفي لإيصال الطالب إلى درجة النجاح (50). المطلوب: (${needed}) درجات.`;
    }

    const remainingBalance = 5 - context.alreadyUsedDecisionMarksThisYear;
    if (context.requestedMarks > remainingBalance) {
      return `رصيد درجات القرار المتبقي للطالب في هذه السنة (${remainingBalance} درجات) غير كافٍ لمنح (${context.requestedMarks}) درجات.`;
    }

    return null;
  }
}
