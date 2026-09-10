'use client'; // ⚡ ينفذ بالعميل

// 🕷️ رادار شبكة العنكبوت الأمني الاستباقية (Spider Security Radar HUD Component)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import { getSpiderRadarMetrics, validateHoneypot, SPIDER_HONEYPOT_FIELD, SpiderThreatLevel } from '@/lib/security/spider-security'; // 🕸️ محرك العنكبوت
import { Shield, Bug, Radar, Zap, Lock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'; // 🎨 الأيقونات

export default function SpiderRadarWidget() {
  const [metrics, setMetrics] = useState(getSpiderRadarMetrics()); // 📊 المقاييس اللحظية
  const [isSimulating, setIsSimulating] = useState(false); // ⏳ حالة اختبار الفخ
  const [testResult, setTestResult] = useState<string | null>(null); // 📝 نتيجة الاختبار

  // 🔄 تحديث المقاييس الدورية
  const refreshMetrics = () => {
    setMetrics(getSpiderRadarMetrics());
  };

  useEffect(() => {
    const interval = setInterval(refreshMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  // 🧪 محاكاة سقوط بوت في فخ الهوني بوت
  const handleSimulateHoneypot = () => {
    setIsSimulating(true);
    setTestResult(null);

    setTimeout(() => {
      // محاكاة إرسال نموذج يحتوي على قيمة فخ
      const simulatedData = {
        [SPIDER_HONEYPOT_FIELD]: 'malicious_bot_probe_value_123',
        normalField: 'بيانات طبيعية',
      };

      const result = validateHoneypot(simulatedData, {
        actorEmail: 'bot-simulator@external-scanner.local',
        formName: 'محاكي رادار العنكبوت',
      });

      refreshMetrics();
      setIsSimulating(false);
      setTestResult(
        result.isTrapped
          ? '🎯 تم اصطياد واعتراض البوت بنجاح وحظره في شبكة العنكبوت الأمني!'
          : '⚠️ لم يتم كشف الفخ.'
      );
    }, 600);
  };

  // 🎨 تنسيق ألوان مستوى التهديد
  const getThreatBadge = (level: SpiderThreatLevel) => {
    switch (level) {
      case 'NORMAL':
        return { text: 'طبيعي ومؤمّن 100%', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', dot: 'bg-emerald-400' };
      case 'ELEVATED':
        return { text: 'مستوى حذر مرتفع', bg: 'bg-sky-500/20 text-sky-700 border-sky-500/40', dot: 'bg-sky-500' };
      case 'SEVERE':
        return { text: 'تهديد نشط مشدد', bg: 'bg-rose-500/20 text-rose-700 border-rose-500/40', dot: 'bg-rose-500' };
      case 'QUARANTINE':
        return { text: 'حظر واحتجاز فوري', bg: 'bg-red-700/20 text-red-700 border-red-700/40', dot: 'bg-red-700' };
    }
  };

  const badge = getThreatBadge(metrics.overallThreatLevel);

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-sm">
      {/* 🏛️ الترويسة وشارة الرادار - هاي الترويسة مال الرادار */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
            <Radar className="w-7 h-7 animate-spin text-indigo-600" style={{ animationDuration: '8s' }} />
            <span className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg sm:text-xl text-slate-950 tracking-wide">
                رادار شبكة الحماية الأمنية الاستباقية
              </h3>
              <span className="text-sm font-black uppercase px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-950 border border-indigo-200">
                شبكة الحماية الذكية
              </span>
            </div>
            <p className="text-base font-black text-slate-700 mt-1">
              رصد واصطياد البوتات الآلية والأفخاخ البرمجية وحماية سلامة عناصر الواجهة
            </p>
          </div>
        </div>

        {/* 🎛️ شارة مستوى التهديد الحي - هاي تبين حالة المنظومة */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-base font-black ${badge.bg}`}>
            <span className={`w-3 h-3 rounded-full ${badge.dot} animate-pulse`} />
            <span>حالة المنظومة: {badge.text}</span>
          </div>
          <button
            onClick={refreshMetrics}
            title="تحديث البيانات"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-950 transition-colors font-black cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 📊 شبكة بطاقات المقاييس والإحصائيات - هاي الإحصائيات مال النظام */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* 1. نسبة تكامل الشبكة - قوة الشبكة الحالية */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>تكامل خيوط الشبكة</span>
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
            {metrics.spiderWebIntegrity}%
          </div>
          <div className="text-sm font-black text-slate-700">تغطية دفاعية 360°</div>
        </div>

        {/* 2. أفخاخ الهوني بوت النشطة - الفخاخ المنصوبة للبوتات */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>الأفخاخ المزروعة</span>
            <Zap className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 font-mono">
            {metrics.activeHoneypots} <span className="text-base font-black text-slate-700 font-sans">فخ نشط</span>
          </div>
          <div className="text-sm font-black text-slate-700">خفية في كافة النماذج</div>
        </div>

        {/* 3. البوتات المصطادة - ذني انصادوا بالشباك */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>البوتات المصطادة</span>
            <Bug className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">
            {metrics.trappedBotsCount}
          </div>
          <div className="text-sm font-black text-slate-700">تم اعتراضها وتحييدها</div>
        </div>

        {/* 4. محاولات تلاعب الـ DOM المحظورة */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>تعديلات الواجهة المحظورة</span>
            <Lock className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
            {metrics.blockedDomMutations}
          </div>
          <div className="text-sm font-black text-slate-700">حماية السعيات المعتمدة</div>
        </div>
      </div>

      {/* 🧪 منطقة اختبار ومحاكاة الفخاخ الحية */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-200 rounded-3xl p-5">
        <div className="text-base font-black text-indigo-950">
          <span>
            <strong>اختبار جاهزية الفخ:</strong> يمكنك محاكاة سقوط أداة كشط أو روبوت آلي في الفخ البرمجي للتحقق من سرعة الاستجابة.
          </span>
        </div>
        <button
          onClick={handleSimulateHoneypot}
          disabled={isSimulating}
          className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-black rounded-2xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSimulating ? 'جاري الصيد...' : 'تشغيل محاكاة الفخ'}
        </button>
      </div>

      {/* 📝 نتيجة المحاكاة */}
      {testResult && (
        <div className="mt-3 text-base font-black text-emerald-800 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
}
