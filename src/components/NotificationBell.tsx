'use client'; // ⚡ ينفذ بالعميل على متصفح المستخدم

// 🔔 مكون جرس ومركز الإشعارات التفاعلي الحي - جامعة الإمام جعفر الصادق (ع) - فرع ميسان
import { useState, useEffect, useRef } from 'react'; // 🔗 خطافات رياكت
import Link from 'next/link'; // 🔗 روابط نكست
import { AppNotification, UserProfile } from '@/types'; // 🔗 واجهات الأنواع
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllUserNotificationsAsRead, 
  deleteAppNotification 
} from '@/lib/notification-utils'; // 🔌 دوال الإشعارات
import { syncNotificationsFromSupabase } from '@/lib/supabase-client'; // ☁️ مزامنة الإشعارات السحابية
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  GraduationCap, 
  Lock, 
  Volume2, 
  VolumeX,
  AlertTriangle,
  CreditCard
} from 'lucide-react'; // 🎨 الأيقونات SVG

interface NotificationBellProps {
  currentUser: UserProfile; // 👤 المستخدم الحالي صاحب الجلسة
}

export default function NotificationBell({ currentUser }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]); // 📬 قائمة الإشعارات
  const [isOpen, setIsOpen] = useState(false); // 📂 فتح/إغلاق القائمة المنسدلة
  const [soundEnabled, setSoundEnabled] = useState(true); // 🔊 تفعيل التنبيه الصوتي
  const dropdownRef = useRef<HTMLDivElement>(null); // 📍 مرجع العنصر للإغلاق عند النقر بالخارج

  // 🔄 تحميل وتحديث الإشعارات دورياً
  const refreshNotifications = () => {
    if (!currentUser) return;
    const list = getUserNotifications(currentUser.id, currentUser.role);
    setNotifications(list);

    // ☁️ مزامنة حية من سحابة Supabase
    syncNotificationsFromSupabase(currentUser.id).then((cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        const filtered = cloudNotifs.filter((n) => {
          if (n.recipient_id === 'all') return true;
          if (n.recipient_id === currentUser.id) return true;
          if (currentUser.role && n.recipient_role === currentUser.role) return true;
          return false;
        });
        setNotifications(filtered);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000); // ⏱️ فحص كل 10 ثوانٍ
    return () => clearInterval(interval);
  }, [currentUser]);

  // 🔒 إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 👁️ تحديد إشعار كمقروء
  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    refreshNotifications();
  };

  // 👁️ تحديد الكل كمقروء
  const handleMarkAllRead = () => {
    markAllUserNotificationsAsRead(currentUser.id, currentUser.role);
    refreshNotifications();
  };

  // 🗑️ حذف إشعار
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAppNotification(id);
    refreshNotifications();
  };

  // 🎨 أيقونة حسب نوع الإشعار
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_deadline_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'absence_warning':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'tuition_notice':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'grade_updated':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'course_assigned':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'grades_locked':
        return <Lock className="w-4 h-4 text-slate-800" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-700" />;
    }
  };

  // ⏰ تنسيق الوقت العربي
  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return new Date(isoString).toLocaleDateString('ar-IQ-u-nu-latn');
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      
      {/* 🔔 زر الجرس التفاعلي الرئيسي */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-950 font-black transition active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
        title="مركز الإشعارات والتنبيهات"
        aria-label="مركز الإشعارات"
      >
        <Bell className="w-5 h-5 text-slate-950" />
        
        {/* 🔴 شارة عدد الإشعارات غير المقروءة */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-xs font-mono">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {/* 📬 نافذة الإشعارات المنسدلة (Dropdown Drawer) بحدود ناعمة وثابتة داخل الشاشة */}
      {isOpen && (
        <div className="absolute left-0 right-auto mt-2 w-88 sm:w-104 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-950 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* 🏷️ ترويسة نافذة الإشعارات */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white border border-slate-300 rounded-2xl text-slate-950 shadow-xs">
                <Bell className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">مركز التنبيهات الأكاديمية</h3>
                <p className="text-sm font-black text-slate-700 mt-0.5">
                  {unreadCount > 0 ? `لديك ${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة غير مقروءة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-slate-700 hover:text-black rounded-xl hover:bg-slate-200 transition cursor-pointer"
                title={soundEnabled ? 'كتم التنبيهات' : 'تفعيل التنبيهات'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-700 hover:text-black rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 📋 أزرار التحكم السريع */}
          {notifications.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-sm font-black">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-indigo-900 hover:text-indigo-950 flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                <CheckCheck className="w-4 h-4 text-indigo-700" />
                <span>تحديد الكل كمقروء</span>
              </button>
              <span className="text-slate-700 text-sm font-black">جامعة الصادق (ع) - ميسان</span>
            </div>
          )}

          {/* 📜 قائمة عناصر الإشعارات */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="w-7 h-7" />
                </div>
                <p className="text-base font-black text-slate-950">لا توجد أي إشعارات حالياً</p>
                <p className="text-sm font-black text-slate-700">ستظهر هنا التنبيهات عند رصد السعي أو تكليف المواد</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-4 transition flex items-start gap-3.5 cursor-pointer ${
                    notif.is_read ? 'bg-white hover:bg-slate-50 opacity-90' : 'bg-indigo-50/70 hover:bg-indigo-50 font-black'
                  }`}
                >
                  <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-base font-black text-slate-950 truncate">{notif.title}</h4>
                      <span className="text-xs font-black text-slate-700 flex-shrink-0 font-mono">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-base font-black text-slate-800 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      {notif.link ? (
                        <Link
                          href={notif.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 text-base font-black text-indigo-900 hover:underline"
                        >
                          <span>عرض التفاصيل</span>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        className="text-slate-700 hover:text-red-600 p-1.5 transition cursor-pointer font-black"
                        title="حذف الإشعار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <span className="w-3 h-3 rounded-full bg-indigo-600 flex-shrink-0 mt-2"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 📄 تذييل النافذة */}
          <div className="p-3.5 bg-slate-100 border-t border-slate-300 text-center">
            <span className="text-sm font-black text-slate-950">
              نظام الإشعارات الأكاديمية الفورية المباشر
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
