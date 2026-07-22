'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home, AlertTriangle, WifiOff, ServerCrash, Bug } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error('[ErrorBoundary]', error); }, [error]);

  const msg = error?.message || '';
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const isServer = msg.includes('500') || msg.includes('502') || msg.includes('خادم') || msg.includes('server');
  const isAuth = msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('permission');

  let title = 'حدث خطأ غير متوقع';
  let desc = 'حاول إعادة تحميل الصفحة. إذا استمرت المشكلة، راجع سجل الأخطاء في Console (F12).';
  let Icon = AlertTriangle;

  if (offline) { title = 'لا يوجد اتصال بالإنترنت'; desc = 'يرجى التحقق من اتصالك بالشبكة ثم حاول مرة أخرى.'; Icon = WifiOff; }
  else if (isServer) { title = 'الخادم غير متاح'; desc = 'الخادم يعيد خطأ. حاول لاحقاً أو راجع مسؤول النظام.'; Icon = ServerCrash; }
  else if (isAuth) { title = 'مشكلة في الصلاحيات'; desc = 'قد تحتاج إلى تسجيل الدخول مجدداً.'; Icon = ServerCrash; }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="glass w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 w-fit rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-300">
          <Icon size={32} />
        </div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
        {error?.message && (
          <p className="mt-3 rounded-lg bg-white/[0.05] p-3 text-left text-[11px] font-mono text-rose-300/70 break-all" dir="ltr">{error.message}</p>
        )}
        {error?.digest && (
          <p className="mt-2 text-[10px] text-slate-600" dir="ltr">digest: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-primary" onClick={() => reset()}>
            <RefreshCcw size={15} /> إعادة المحاولة
          </button>
          <a href="/" className="btn-ghost">
            <Home size={15} /> الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
