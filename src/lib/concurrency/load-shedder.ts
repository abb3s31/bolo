// ⚖️ متحكم الأحمال وخنق الضغط الذاتي وطابور العمليات الثقيلة (Adaptive Load Shedder & Semaphore Queue)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { logSecurityEvent } from '../security/audit-guardian'; // 📊 تسجيل الإنذارات في سجل الرقابة

// ⚙️ إعدادات متحكم الأحمال
const LATENCY_HIGH_THRESHOLD_MS = 1200; // ⚠️ عتبة بطء الاستجابة التي تفعل نمط الذروة (1.2 ثانية)
const MAX_CONCURRENT_HEAVY_TASKS = 3;   // 🔒 الحد الأقصى للمهام الثقيلة (تصدير PDF/Excel) المتزامنة في نفس الوقت

// 📊 حالة نمط الذروة والضغط الشديد اللحظية
let isPeakTrafficModeActive = false;
let currentActiveHeavyTasks = 0;
const heavyTaskWaitQueue: Array<() => void> = [];

// ⏱️ مصفوفة رصد أزمنة الاستجابة الأخيرة (Sliding Window of Latencies)
const recentLatencies: number[] = [];

// 🔍 واجهة حالة الأحمال بالنظام
export interface LoadMetrics {
  isPeakMode: boolean;           // ⚡ هل نمط الذروة فعال حالياً
  activeHeavyTasks: number;      // 📑 عدد العمليات الثقيلة الجارية حالياً
  queuedHeavyTasks: number;      // ⏳ عدد العمليات المنتظرة بالطابور
  avgLatencyMs: number;          // ⏱️ متوسط زمن الاستجابة في آخر 20 طلباً
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'OVERLOADED'; // 🩺 الحالة الصحية العامة
}

// 🚀 1. دالة تسجيل ومراقبة زمن استجابة الطلبات وتحديث نمط الذروة (Track Latency)
export function recordRequestLatency(latencyMs: number): void {
  recentLatencies.push(latencyMs);
  if (recentLatencies.length > 20) {
    recentLatencies.shift(); // 🧹 الاحتفاظ بآخر 20 عينة فقط
  }

  const avg = recentLatencies.reduce((acc, val) => acc + val, 0) / recentLatencies.length;

  // ⚡ فحص هل يجب تفعيل نمط الذروة وتخفيف الأحمال
  if (avg > LATENCY_HIGH_THRESHOLD_MS && !isPeakTrafficModeActive) {
    isPeakTrafficModeActive = true;
    logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      details: `⚡ تم تفعيل نمط الذروة الأكاديمي (Peak Traffic Mode) تلقائياً لارتفاع متوسط زمن الاستجابة إلى (${Math.round(avg)}ms). تم إعطاء الأولوية للنتائج والدخول وتأجيل العمليات الثقيلة.`,
      severity: 'MEDIUM',
    });
  } else if (avg <= LATENCY_HIGH_THRESHOLD_MS && isPeakTrafficModeActive) {
    isPeakTrafficModeActive = false; // 🔄 عودة النظام للوضع الطبيعي
  }
}

// 🔒 2. دالة حجز قفل لتنفيذ عملية ثقيلة عبر Semaphore (Acquire Heavy Task Slot)
export async function acquireHeavyTaskSlot(): Promise<() => void> {
  // إذا كان عدد المهام الجارية أقل من السقف المسموح -> منح الإذن فوراً
  if (currentActiveHeavyTasks < MAX_CONCURRENT_HEAVY_TASKS) {
    currentActiveHeavyTasks++;
    return createReleaseCallback();
  }

  // ⏳ في حال اكتمال السقف -> إدخال العملية في طابور الانتظار
  return new Promise<() => void>((resolve) => {
    heavyTaskWaitQueue.push(() => {
      currentActiveHeavyTasks++;
      resolve(createReleaseCallback());
    });
  });
}

// 🧹 3. دالة إنشاء دالة التحرير الخاصة بالمهمة
function createReleaseCallback(): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    currentActiveHeavyTasks--;

    // 🚀 سحب المهمة التالية من طابور الانتظار وتشغيلها
    if (heavyTaskWaitQueue.length > 0) {
      const nextTask = heavyTaskWaitQueue.shift();
      if (nextTask) {
        nextTask();
      }
    }
  };
}

// 📊 4. دالة جلب تقرير ومقاييس الأحمال اللحظية
export function getLoadMetrics(): LoadMetrics {
  const avg = recentLatencies.length > 0 
    ? Math.round(recentLatencies.reduce((acc, val) => acc + val, 0) / recentLatencies.length) 
    : 15;

  let health: 'HEALTHY' | 'DEGRADED' | 'OVERLOADED' = 'HEALTHY';
  if (avg > 2000 || heavyTaskWaitQueue.length > 10) {
    health = 'OVERLOADED';
  } else if (isPeakTrafficModeActive || avg > LATENCY_HIGH_THRESHOLD_MS) {
    health = 'DEGRADED';
  }

  return {
    isPeakMode: isPeakTrafficModeActive,
    activeHeavyTasks: currentActiveHeavyTasks,
    queuedHeavyTasks: heavyTaskWaitQueue.length,
    avgLatencyMs: avg,
    systemHealth: health,
  };
}
