'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Circle, AlertTriangle, Plus, RotateCcw, Zap } from 'lucide-react';
import { api, getCached } from '@/frontend/api';
import { todayStr, fmtDateShort, cn } from '@/shared/utils';
import type { RecoverySettings, RecoveryLog } from '@/shared/types';
import GlassCard from '@/frontend/components/ui/GlassCard';
import Modal from '@/frontend/components/ui/Modal';
import EmptyState from '@/frontend/components/ui/EmptyState';

const STATUS_ICONS: Record<string, string> = {
  clean: '⚪',
  done: '✅',
  missed: '❌',
  relapse: '🔴',
};

const STATUS_OPTIONS = [
  { value: 'clean', label: 'نظيف', icon: '⚪' },
  { value: 'done', label: 'تم الاستعادة', icon: '✅' },
  { value: 'missed', label: 'فات', icon: '❌' },
  { value: 'relapse', label: 'انتكاسة', icon: '🔴' },
];

export default function RecoveryPage() {
  const [settings, setSettings] = useState<RecoverySettings | null>(() => getCached('/api/recovery'));
  const [logs, setLogs] = useState<RecoveryLog[]>(() => getCached('/api/recovery/logs') ?? []);
  const [modal, setModal] = useState<'start' | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<RecoveryLog | null>(null);

  const load = useCallback(async () => {
    const [s, l] = await Promise.all([
      api<RecoverySettings>('/api/recovery'),
      api<RecoveryLog[]>('/api/recovery/logs'),
    ]);
    if (s) setSettings(s);
    if (l) setLogs(l);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startRecovery = async (f: FormData) => {
    setSaving(true);
    const sd = f.get('startDate') as string;
    if (!sd) return;
    const ok = await api('/api/recovery', {
      method: 'POST',
      body: { startDate: sd },
    });
    if (ok) { setModal(null); load(); }
    setSaving(false);
  };

  const updateLog = async (log: RecoveryLog, status: string) => {
    setSaving(true);
    await api(`/api/recovery/logs/${log.id}`, {
      method: 'PATCH',
      body: { status },
    });
    load();
    setSaving(false);
    setEditing(null);
  };

  const today = todayStr();
  const streak = calcRecoveryStreak(logs);
  const totalClean = logs.filter(l => l.status !== 'relapse').length;
  const relapseCount = logs.filter(l => l.status === 'relapse').length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">الاستعادة اليومية</h1>
          <p className="text-sm text-slate-500">تتبع مسار الاستعادة والتعافي</p>
        </div>
        {!settings && (
          <button className="btn-primary" onClick={() => setModal('start')}>
            <Plus size={15} /> بدء مسار الاستعادة
          </button>
        )}
      </header>

      {settings && (
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="!p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">{streak}</p>
            <p className="mt-1 text-[11px] text-slate-500">أيام متتالية</p>
          </GlassCard>
          <GlassCard className="!p-4 text-center">
            <p className="text-3xl font-black text-sky-400">{totalClean}</p>
            <p className="mt-1 text-[11px] text-slate-500">أيام نظيفة</p>
          </GlassCard>
          <GlassCard className="!p-4 text-center">
            <p className={cn('text-3xl font-black', relapseCount > 0 ? 'text-rose-400' : 'text-emerald-400')}>
              {relapseCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">انتكاسات</p>
          </GlassCard>
        </div>
      )}

      {!settings ? (
        <GlassCard>
          <EmptyState
            icon={Calendar}
            title="لم يبدأ المسار بعد"
            hint="حدد تاريخ بداية مسار الاستعادة لتسجيل الأيام"
          />
        </GlassCard>
      ) : logs.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={RotateCcw}
            title="لا توجد أيام مسجلة"
            hint="سيتم إنشاء الأيام تلقائياً عند بدء المسار"
          />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.slice(0, 90).map((log) => (
            <GlassCard key={log.id} hover className="!p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{STATUS_ICONS[log.status] || '⚪'}</span>
                  <div>
                    <p className="text-sm font-bold">{fmtDateShort(log.date)}</p>
                    {log.trigger && (
                      <p className="text-[11px] text-slate-500">سبب: {log.trigger}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateLog(log, opt.value)}
                      disabled={saving}
                      className={cn(
                        'rounded-lg px-2.5 py-1.5 text-xs font-bold transition',
                        log.status === opt.value
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-500 hover:bg-white/[0.06] border border-transparent'
                      )}
                      title={opt.label}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modal === 'start'} onClose={() => setModal(null)} title="بدء مسار الاستعادة">
        <form onSubmit={(e) => { e.preventDefault(); startRecovery(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
          <div>
            <label className="label">تاريخ البداية</label>
            <input name="startDate" type="date" className="input" required defaultValue={today} />
          </div>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'جارٍ…' : 'بدء المسار'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function calcRecoveryStreak(logs: RecoveryLog[]): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const l of sorted) {
    if (l.status === 'relapse') break;
    streak++;
  }
  return streak;
}
