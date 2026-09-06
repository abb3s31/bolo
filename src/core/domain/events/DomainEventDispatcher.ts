// 🚀 موجه وموزع أحداث النطاق (Domain Event Dispatcher) - تفكيك الارتباط (Decoupling) & SOLID OCP

// 📜 استيراد واجهة الحدث
import { IDomainEvent } from './DomainEvent';

// 🏷️ نوع دالة معالج الحدث
export type DomainEventHandler<T extends IDomainEvent> = (event: T) => Promise<void> | void;

// 🧱 صنف موزع الأحداث المركزي (Singleton Event Dispatcher)
export class DomainEventDispatcher {
  // 🔒 خريطة حفظ المعالجات المسجلة لكل حدث
  private static handlersMap: Map<string, DomainEventHandler<IDomainEvent>[]> = new Map();

  // 📝 تسجيل معالج لحدث معين (Subscribe)
  public static subscribe<T extends IDomainEvent>(
    eventName: string,
    handler: DomainEventHandler<T>
  ): void {
    const existing = this.handlersMap.get(eventName) || [];
    existing.push(handler as DomainEventHandler<IDomainEvent>);
    this.handlersMap.set(eventName, existing);
  }

  // 📢 إطلاق وبث الحدث لكافة المعالجات المسجلة (Publish / Dispatch)
  public static async dispatch(event: IDomainEvent): Promise<void> {
    const handlers = this.handlersMap.get(event.eventName) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`⚠️ خطأ أثناء معالجة حدث (${event.eventName}):`, err);
      }
    }
  }

  // 🧹 تنظيف كافة المعالجات المسجلة (لأغراض الاختبارات)
  public static clearHandlers(): void {
    this.handlersMap.clear();
  }
}
