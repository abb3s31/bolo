'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 👁️ خطاف مراقبة سلامة شجرة الـ DOM وحماية العناصر المقفلة من التلاعب (DOM Spider Integrity Guard)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { useEffect, RefObject } from 'react'; // 🔗 خطافات رياكت
import { registerDomTamperingEvent } from './spider-security'; // 🕷️ محرك العنكبوت الأمني

export interface DomSpiderGuardOptions {
  containerRef: RefObject<HTMLElement | null>; // 📦 الحاوية المراد مراقبتها
  isLocked: boolean;                          // 🔒 هل البيانات مقفلة ومعتمدة رسمياً
  lockedFieldSelector?: string;               // 🎯 محدد الحقول المقفلة
  actorEmail?: string;                        // 📧 بريد المستخدم الحالي
}

export function useDomSpiderGuard({
  containerRef,
  isLocked,
  lockedFieldSelector = 'input, select, textarea, button',
  actorEmail,
}: DomSpiderGuardOptions): void {
  useEffect(() => {
    // إذا لم تكن البيانات مقفلة، لا داعي لتفعيل المراقب الصارم
    if (!isLocked || typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return;

    // 🕵️ إنشاء مراقب التغييرات لشجرة الـ DOM (MutationObserver)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 🔍 فحص هل تم التلاعب بخصائص الحقول (Attributes Tampering مثل حذف disabled أو readonly)
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;

          if (mutation.attributeName === 'disabled' || mutation.attributeName === 'readonly') {
            const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
            
            if (isInput) {
              const inputElem = target as HTMLInputElement;
              
              // 🚨 فحص إذا تم إزالة التعطيل من حقل مقفل رسمياً
              if (!inputElem.disabled && !inputElem.readOnly) {
                // 🛑 إعادة القفل والتعطيل الفوري لمنع التلاعب
                inputElem.disabled = true;
                inputElem.readOnly = true;

                // 📊 تسجيل محاولة اختراق الـ DOM
                registerDomTamperingEvent(inputElem.name || inputElem.id || 'حقل درجات مقفل', actorEmail);
              }
            }
          }
        }
      });
    });

    // 🕸️ حياكة خيوط المراقبة على الحاوية بالكامل
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'class', 'style'],
      subtree: true,
      childList: false,
    });

    // 🧹 دالة التنظيف عند إلغاء المكون
    return () => {
      observer.disconnect();
    };
  }, [containerRef, isLocked, lockedFieldSelector, actorEmail]);
}
