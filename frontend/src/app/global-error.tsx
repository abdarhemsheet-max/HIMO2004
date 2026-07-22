'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error('[GlobalErrorBoundary]', error); }, [error]);

  const detail = error?.message ? `: ${error.message}` : '';

  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#070b14', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ maxWidth: 400 }}>
            <p style={{ fontSize: 40 }}>😅</p>
            <h2 style={{ fontWeight: 900, marginTop: 12 }}>حدث خطأ غير متوقع في النظام</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
              جرب إعادة المحاولة. إذا استمرت المشكلة، افتح F12 &gt; Console وأرسل لقطة الشاشة.
            </p>
            {detail && (
              <p dir="ltr" style={{ fontSize: 11, color: '#f87171', marginTop: 12, wordBreak: 'break-all', background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, textAlign: 'left' }}>{detail}</p>
            )}
            <button
              onClick={() => reset()}
              style={{
                marginTop: 20,
                padding: '10px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(270deg, #34d399, #2dd4bf)',
                color: '#070b14',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
