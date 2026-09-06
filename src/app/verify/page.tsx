'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🔲 البوابة المركزية العامة للتحقق الإلكتروني من وثائق وبطاقات الجامعة (/verify) - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect } from 'react'; // 🔗 خطافات رياكت
import Image from 'next/image'; // 🖼️ الصور
import Link from 'next/link'; // 🔗 روابط نكست
import { useRouter } from 'next/navigation'; // 🛣️ التوجيه
import { getStoredData, INITIAL_PROFILES } from '@/lib/mock-data'; // 💾 البيانات
import { fetchVerificationProfileAndGrades } from '@/lib/supabase-client'; // ☁️ الاستعلام السحابي المباشر للتحقق
import { UserProfile } from '@/types'; // 🔗 الأنواع الرسمية
import { sanitizeAcademicSearchQuery, checkRateLimit } from '@/lib/security/sanitizer'; // 🧹 معقم استعلامات البحث ومحدد الطلبات
import { detectSqlInjection } from '@/lib/security/sql-injection-guard'; // 🛡️ حارس SQL Injection
import { 
  QrCode, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  Sparkles,
  ExternalLink,
  User
} from 'lucide-react';

export default function VerifyPortalIndexPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchedProfile, setSearchedProfile] = useState<UserProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string>('');
  const router = useRouter();

  // 🏷️ تعيين عنوان نافذة المتصفح لبوابة التحقق
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'بوابة التحقق الإلكتروني من الوثائق | جامعة الإمام جعفر الصادق (ع) - فرع ميسان';
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityWarning('');
    
    const rateLimit = checkRateLimit('public-verify-search', 'SEARCH_QUERY');
    if (!rateLimit.allowed) {
      setSecurityWarning(rateLimit.reason || 'تم تجاوز سقف البحث، يرجى الانتظار قليلاً.');
      return;
    }

    const sqlCheck = detectSqlInjection(searchInput, { fieldName: 'بحث الوثائق' });
    if (!sqlCheck.isSafe) {
      setSecurityWarning('تم اعتراض مدخلات غير صالحة وتأمين استعلام البحث تلقائياً.');
    }

    const cleanQuery = sanitizeAcademicSearchQuery(searchInput).toLowerCase();
    if (!cleanQuery) return;

    setHasSearched(true);
    const profiles = getStoredData<UserProfile[]>('profiles', INITIAL_PROFILES);
    const found = profiles.find(
      (p) =>
        (p.university_number && p.university_number.toLowerCase() === cleanQuery) ||
        (p.id && p.id.toLowerCase() === cleanQuery) ||
        (p.full_name && p.full_name.toLowerCase().includes(cleanQuery))
    );

    if (found) {
      setSearchedProfile(found);
    } else {
      // ☁️ استعلام سحابي فوري من قاعدة بيانات Supabase
      fetchVerificationProfileAndGrades(cleanQuery).then(({ profile }) => {
        setSearchedProfile(profile || null);
      }).catch(() => {
        setSearchedProfile(null);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans" dir="rtl">
      
      <div className="w-full max-w-2xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-block relative w-24 h-24 mx-auto">
          <Image
            src="/sadiq-logo.png"
            alt="جامعة الإمام جعفر الصادق (ع)"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            جامعة الإمام جعفر الصادق (ع)
          </h1>
          <h2 className="text-base sm:text-lg font-black text-slate-700 mt-1">
            البوابة المركزية العامة للتحقق الإلكتروني من صحة الوثائق والبطاقات
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl text-base font-black mt-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>نظام التوثيق الرقمي الأكاديمي المشفر</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {securityWarning && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 rounded-2xl text-base font-black flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{securityWarning}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-base font-black text-slate-800 mb-2">
              أدخل الرقم الجامعي للطالب أو المعرف الأكاديمي:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                // 🎓 إدخال الرقم الجامعي أو المعرف الأكاديمي الحقيقي
                placeholder="أدخل الرقم الجامعي للطالب أو المعرف الأكاديمي..."
                className="w-full pl-32 pr-12 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-base font-black text-slate-950 focus:outline-hidden focus:border-blue-700 shadow-xs transition font-mono"
                required
              />
              <Search className="w-5 h-5 text-slate-900 absolute right-4 top-4.5" />
              
              <button
                type="submit"
                className="absolute left-2.5 top-2.5 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-base font-black transition cursor-pointer shadow-xs"
              >
                تحقق الآن
              </button>
            </div>
          </div>
        </form>

        <div className="pt-3 border-t border-slate-200 text-center text-sm font-black text-slate-600">
          💡 يمكنك فحص صحة أي وثيقة أو بطاقة جامعية عبر إدخال الرقم الجامعي الرسمي الصادر من الكلية.
        </div>

        {hasSearched && (
          <div className="pt-4 border-t border-slate-200 animate-in fade-in duration-200">
            {searchedProfile ? (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-4 text-right">
                <div className="flex items-center gap-2.5 text-emerald-950 font-black text-base sm:text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <span>تم التوثيق والتحقق بنجاح — السجل صادر ومعتمد رسمياً</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2 text-base font-black text-slate-900">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">الاسم الأكاديمي:</span>
                    <strong className="text-slate-950 text-lg">{searchedProfile.full_name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">الرقم الجامعي:</span>
                    <span className="font-mono text-lg">{searchedProfile.university_number}</span>
                  </div>
                </div>

                <Link
                  href={`/verify/${searchedProfile.university_number}`}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-base font-black transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>عرض صفحة وثيقة السعي التفصيلية والدرجات</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="p-5 bg-red-50 border border-red-300 rounded-2xl space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-red-950 font-black text-base sm:text-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <span>لم يتم العثور على سجل مطابق لهذا الرقم!</span>
                </div>
                <p className="text-base font-black text-red-800">
                  يرجى التأكد من كتابة الرقم الجامعي بدقة، أو مراجعة شعبة التسجيل وشؤون الطلبة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 🔙 العودة للبوابة الرئيسية */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-black text-slate-900 hover:underline"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لبوابة الطلبة والأساتذة</span>
          </Link>
        </div>

      </div>

      {/* 📄 التذييل */}
      <div className="w-full max-w-2xl mx-auto text-center space-y-1 pt-6">
        <p className="text-base font-black text-slate-900">
          جامعة الإمام جعفر الصادق (ع) — فرع ميسان
        </p>
        <p className="text-base font-black text-slate-700">
          نظام التحقق الإلكتروني للوثائق المعتمدة © {new Date().getFullYear()}
        </p>
      </div>

    </div>
  );
}
