'use client';

import { supabase } from './supabaseClient';

const SUPABASE_URL = 'https://yruoooslxppvsoqdbgxc.supabase.co';

export async function getDocDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/b2-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.downloadUrl || null;
  } catch {
    return null;
  }
}

export type ToastType = 'success' | 'error';
type NotifyFn = (message: string, type: ToastType) => void;
let notifyFn: NotifyFn = () => {};
export function registerNotify(fn: NotifyFn) { notifyFn = fn; }
export function notify(message: string, type: ToastType = 'success') { notifyFn(message, type); }

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  ok?: string;
}

const getCache = new Map<string, unknown>();
export function getCached<T>(path: string): T | null {
  return (getCache.get(path) as T | undefined) ?? null;
}

// camelCase ↔ snake_case
const camelToSnake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function convertKeys(obj: unknown, toSnake: boolean): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(x => convertKeys(x, toSnake));
  const r: Record<string, unknown> = {};
  for (const k of Object.keys(obj as Record<string, unknown>))
    r[toSnake ? camelToSnake(k) : snakeToCamel(k)] = convertKeys((obj as any)[k], toSnake);
  return r;
}

const toDb = (o: unknown) => convertKeys(o, true) as Record<string, unknown>;
const fromDb = <T>(o: T) => convertKeys(o as unknown, false) as T;

// Resource → table name
const tableMap: Record<string, string> = {
  wallets: 'wallets', debts: 'debts', subscriptions: 'subscriptions',
  assets: 'assets', savings: 'savings_goals', dailyTasks: 'daily_tasks',
  habits: 'habits', weeklyFocus: 'weekly_focus', projects: 'projects',
  projectTasks: 'project_tasks', entities: 'work_entities', reports: 'reports',
  manualReports: 'manual_reports', learning: 'learning_items',
  shanqiti: 'shanqiti_sessions', quranEntries: 'quran_entries',
  recoveryLogs: 'recovery_logs', srsCards: 'srs_cards', folders: 'doc_folders',
};

// ========== CRUD ==========
const crudList = async (t: string) => fromDb((await supabase.from(t).select('*')).data);
const crudCreate = async (t: string, b: unknown) =>
  fromDb((await supabase.from(t).insert(toDb(b)).select()).data?.[0] ?? null);
const crudUpdate = async (t: string, id: string, b: unknown) =>
  fromDb((await supabase.from(t).update(toDb(b)).eq('id', id).select()).data?.[0] ?? null);
const crudDelete = async (t: string, id: string) => {
  const { error } = await supabase.from(t).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true };
};

async function handleCrud(s: string[], m: string, b: unknown) {
  const tbl = tableMap[s[0]];
  if (!tbl) throw new Error('مورد غير معروف');
  if (s.length >= 2) {
    if (m === 'PATCH') return crudUpdate(tbl, s[1], b);
    if (m === 'DELETE') return crudDelete(tbl, s[1]);
    throw new Error('طريقة غير مدعومة');
  }
  if (m === 'GET') return crudList(tbl);
  if (m === 'POST') return crudCreate(tbl, b);
  throw new Error('طريقة غير مدعومة');
}

// ========== Special endpoints ==========
async function toggleLog(b: any) {
  const table = b.kind === 'habit' ? 'habit_logs' : 'task_logs';
  const idField = b.kind === 'habit' ? 'habit_id' : 'task_id';
  if (b.done) {
    await supabase.from(table).upsert({ [idField]: b.id, date: b.date }, { onConflict: `${idField},date` });
  } else {
    await supabase.from(table).delete().eq(idField, b.id).eq('date', b.date);
  }
  return { ok: true };
}

async function handleSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [wal, mtxn, ptxn, dbt, sub, tsk, hab, foc, proj, hos, lrn] = await Promise.all([
    supabase.from('wallets').select('*'),
    supabase.from('transactions').select('*').eq('status', 'completed').gte('date', monthStart.toISOString()),
    supabase.from('transactions').select('*').eq('status', 'pending'),
    supabase.from('debts').select('*').eq('is_settled', false),
    supabase.from('subscriptions').select('*').eq('is_active', true).order('next_renewal', { ascending: true }).limit(4),
    supabase.from('daily_tasks').select('*').eq('is_active', true),
    supabase.from('habits').select('*').eq('is_active', true),
    supabase.from('weekly_focus').select('*').eq('week_start', today).maybeSingle(),
    supabase.from('projects').select('*').eq('status', 'active'),
    supabase.from('hosoon_days').select('*').eq('date', today).maybeSingle(),
    supabase.from('learning_items').select('*').eq('status', 'in_progress').order('created_at', { ascending: false }).limit(3),
  ]);
  const [tl, hl] = await Promise.all([
    supabase.from('task_logs').select('task_id, date'),
    supabase.from('habit_logs').select('habit_id, date'),
  ]);
  return fromDb({ today, wallets: wal.data, monthTxns: mtxn.data, pendingTxns: ptxn.data,
    debts: dbt.data, subscriptions: sub.data,
    tasks: (tsk.data || []).map((t: any) => ({ ...t, logs: (tl.data || []).filter((l: any) => l.task_id === t.id) })),
    habits: (hab.data || []).map((h: any) => ({ ...h, logs: (hl.data || []).filter((l: any) => l.habit_id === h.id) })),
    focus: foc.data, projects: proj.data, hosoonToday: hos.data, learning: lrn.data });
}

async function heatmap() {
  const [hd, sc, ec, rc] = await Promise.all([
    supabase.from('hosoon_days').select('date, fort1, fort2, fort3, fort4, fort5'),
    supabase.from('shanqiti_sessions').select('date'),
    supabase.from('quran_entries').select('date'),
    supabase.from('srs_review_logs').select('date'),
  ]);
  const m: Record<string, number> = {};
  for (const h of hd.data || []) { const n = [h.fort1, h.fort2, h.fort3, h.fort4, h.fort5].filter(Boolean).length; if (n) m[h.date] = (m[h.date] || 0) + n; }
  for (const s of sc.data || []) m[s.date] = (m[s.date] || 0) + 1;
  for (const e of ec.data || []) m[e.date] = (m[e.date] || 0) + 1;
  for (const r of rc.data || []) m[r.date] = (m[r.date] || 0) + 1;
  return m;
}

async function documents(m: string, s: string[], b: unknown) {
  if (m === 'GET') return fromDb((await supabase.from('documents').select('*').order('created_at', { ascending: false })).data);
  if (m === 'POST') {
    const f = b as FormData;
    const file = f.get('file') as File | null;
    let filePath = '';

    if (file && file.size > 0) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', String(f.get('name') || file.name || 'ملف'));
      fd.append('category', String(f.get('category') || 'general'));
      const efRes = await fetch(`${SUPABASE_URL}/functions/v1/b2-upload`, {
        method: 'POST',
        body: fd,
      });
      if (!efRes.ok) throw new Error('فشل رفع الملف');
      const efData = await efRes.json();
      if (efData.error) throw new Error(efData.error);
      filePath = efData.upload?.fileName || efData.document?.file_path || '';
    }

    const { data, error } = await supabase.from('documents').insert({
      name: String(f.get('name') || '').slice(0, 200) || 'ملف',
      file_name: file?.name || 'ملف',
      file_path: filePath,
      mime_type: file?.type || 'application/octet-stream',
      size: file?.size || 0,
      folder_id: (f.get('folderId') as string) || null,
    }).select().single();
    if (error) throw new Error(error.message);
    return fromDb(data);
  }
  if (s[0] && m === 'PATCH') {
    const u: any = {}; const body = b as any;
    if (body.name !== undefined) u.name = String(body.name).trim().slice(0, 200);
    if (body.folderId !== undefined) u.folder_id = body.folderId || null;
    await supabase.from('documents').update(u).eq('id', s[0]);
    return { ok: true };
  }
  if (s[0] && m === 'DELETE') {
    await supabase.from('documents').delete().eq('id', s[0]);
    return { ok: true };
  }
  throw new Error('طريقة غير مدعومة');
}

async function folders(m: string, s: string[], b: unknown) {
  if (m === 'GET') {
    const { data: flds } = await supabase.from('doc_folders').select('*').order('created_at', { ascending: true });
    const { data: cnts } = await supabase.from('documents').select('folder_id').not('folder_id', 'is', null);
    const cm: Record<string, number> = {};
    for (const d of cnts || []) if (d.folder_id) cm[d.folder_id] = (cm[d.folder_id] || 0) + 1;
    return (flds || []).map((f: any) => ({ id: f.id, name: f.name, color: f.color, createdAt: f.created_at, _count: { documents: cm[f.id] || 0 } }));
  }
  if (m === 'POST') {
    const body = b as any;
    const name = String(body.name || '').trim();
    if (!name) throw new Error('اسم المجلد مطلوب');
    const { data, error } = await supabase.from('doc_folders').insert({ name: name.slice(0, 100), color: String(body.color || '#38bdf8') }).select().single();
    if (error) throw new Error(error.message);
    return { id: data.id, name: data.name, color: data.color, createdAt: data.created_at };
  }
  if (s[0] && m === 'PATCH') {
    const u: any = {}; const body = b as any;
    if (body.name !== undefined) u.name = String(body.name).trim().slice(0, 100);
    if (body.color !== undefined) u.color = String(body.color);
    await supabase.from('doc_folders').update(u).eq('id', s[0]);
    return { ok: true };
  }
  if (s[0] && m === 'DELETE') {
    await supabase.from('documents').update({ folder_id: null }).eq('folder_id', s[0]);
    await supabase.from('doc_folders').delete().eq('id', s[0]);
    return { ok: true };
  }
  throw new Error('طريقة غير مدعومة');
}

async function transfers(b: any) {
  const { fromWalletId, toWalletId, amount, description } = b;
  if (fromWalletId === toWalletId) throw new Error('لا يمكن التحويل إلى نفس المحفظة');
  const { data: fw } = await supabase.from('wallets').select('*').eq('id', fromWalletId).single();
  const { data: tw } = await supabase.from('wallets').select('*').eq('id', toWalletId).single();
  if (!fw || !tw) throw new Error('المحفظة غير موجودة');
  if (fw.balance < amount) throw new Error(`رصيد «${fw.name}» غير كافٍ`);
  const { data: txn } = await supabase.from('transactions').insert({
    type: 'transfer', status: 'completed', amount, category: 'تحويل',
    description: description || `تحويل من ${fw.name} إلى ${tw.name}`,
    date: new Date().toISOString(), wallet_id: fromWalletId, to_wallet_id: toWalletId,
  }).select().single();
  await supabase.from('wallets').update({ balance: fw.balance - amount }).eq('id', fromWalletId);
  await supabase.from('wallets').update({ balance: tw.balance + amount }).eq('id', toWalletId);
  return fromDb(txn);
}

async function transactions(m: string, s: string[], b: any) {
  if (m === 'GET') return fromDb((await supabase.from('transactions').select('*').order('date', { ascending: false })).data);
  if (m === 'POST') {
    const db = toDb(b);
    const walletId = db.wallet_id as string;
    if (walletId) {
      const { data: w } = await supabase.from('wallets').select('*').eq('id', walletId).single();
      if (!w) throw new Error('المحفظة غير موجودة');
      if (db.status === 'completed' && db.type === 'expense' && w.balance < (db.amount as number))
        throw new Error(`رصيد «${w.name}» غير كافٍ`);
    }
    const { data, error } = await supabase.from('transactions').insert(db).select().single();
    if (error) throw new Error(error.message);
    if (db.status === 'completed' && walletId) {
      const { data: w } = await supabase.from('wallets').select('*').eq('id', walletId).single();
      if (w) await supabase.from('wallets').update({ balance: w.balance + (db.type === 'income' ? (db.amount as number) : -(db.amount as number)) }).eq('id', walletId);
    }
    return fromDb(data);
  }
  if (s[0] && m === 'PATCH') {
    if (b.action !== 'confirm') throw new Error('إجراء غير معروف');
    const { data: t } = await supabase.from('transactions').select('*').eq('id', s[0]).single();
    if (!t || t.status !== 'pending') throw new Error('الحركة غير صالحة');
    const wId = b.walletId || t.wallet_id;
    const { data: w } = await supabase.from('wallets').select('*').eq('id', wId).single();
    if (!w) throw new Error('المحفظة غير موجودة');
    const { data } = await supabase.from('transactions').update({ status: 'completed', wallet_id: wId }).eq('id', s[0]).select().single();
    await supabase.from('wallets').update({ balance: w.balance + t.amount }).eq('id', wId);
    return fromDb(data);
  }
  if (s[0] && m === 'DELETE') {
    const { data: t } = await supabase.from('transactions').select('*').eq('id', s[0]).single();
    if (t) {
      if (t.type === 'transfer') {
        if (t.wallet_id) { const { data: w } = await supabase.from('wallets').select('*').eq('id', t.wallet_id).single(); if (w) await supabase.from('wallets').update({ balance: w.balance + t.amount }).eq('id', t.wallet_id); }
        if (t.to_wallet_id) { const { data: w } = await supabase.from('wallets').select('*').eq('id', t.to_wallet_id).single(); if (w) await supabase.from('wallets').update({ balance: w.balance - t.amount }).eq('id', t.to_wallet_id); }
      } else if (t.status === 'completed' && t.wallet_id) {
        const { data: w } = await supabase.from('wallets').select('*').eq('id', t.wallet_id).single();
        if (w) await supabase.from('wallets').update({ balance: w.balance + (t.type === 'income' ? -t.amount : t.amount) }).eq('id', t.wallet_id);
      }
      await supabase.from('transactions').delete().eq('id', s[0]);
    }
    return { ok: true };
  }
  throw new Error('طريقة غير مدعومة');
}

async function debtsSettle(id: string, b: any) {
  const { data: debt } = await supabase.from('debts').select('*').eq('id', id).single();
  if (!debt || debt.is_settled) throw new Error('الدين غير صالح');
  const remaining = debt.amount - debt.paid_amount;
  if (remaining <= 0) throw new Error('لا يوجد مبلغ متبقٍ');
  const pay = b.amount === undefined || b.amount === '' ? remaining : Number(b.amount);
  if (pay > remaining + 1e-9) throw new Error(`المبلغ يتجاوز المتبقي (${remaining})`);
  const { data: w } = await supabase.from('wallets').select('*').eq('id', b.walletId).single();
  if (!w) throw new Error('المحفظة غير موجودة');
  const collecting = debt.direction === 'owed_to_me';
  if (!collecting && w.balance < pay) throw new Error(`رصيد «${w.name}» غير كافٍ`);
  await supabase.from('transactions').insert({ type: collecting ? 'income' : 'expense', status: 'completed', amount: pay,
    category: collecting ? 'تحصيل دين' : 'سداد دين', description: `${collecting ? 'تحصيل من' : 'سداد لـ'} ${debt.person_name}`, wallet_id: w.id });
  await supabase.from('wallets').update({ balance: w.balance + (collecting ? pay : -pay) }).eq('id', w.id);
  const np = debt.paid_amount + pay;
  return fromDb((await supabase.from('debts').update({ paid_amount: np, is_settled: np >= debt.amount - 1e-9 }).eq('id', id).select().single()).data);
}

async function subPay(id: string, b: any) {
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', id).single();
  if (!sub || !sub.is_active) throw new Error('الاشتراك غير صالح');
  const pay = b.amount === undefined || b.amount === '' ? sub.amount : Number(b.amount);
  if (pay <= 0) throw new Error('قيمة غير صالحة');
  const { data: w } = await supabase.from('wallets').select('*').eq('id', b.walletId).single();
  if (!w || w.balance < pay) throw new Error('رصيد غير كافٍ');
  await supabase.from('transactions').insert({ type: 'expense', status: 'completed', amount: pay, category: 'اشتراكات', description: `دفع ${sub.name}`, wallet_id: w.id });
  await supabase.from('wallets').update({ balance: w.balance - pay }).eq('id', w.id);
  const d = new Date(sub.next_renewal); sub.billing_cycle === 'monthly' ? d.setMonth(d.getMonth() + 1) : d.setFullYear(d.getFullYear() + 1);
  return fromDb((await supabase.from('subscriptions').update({ next_renewal: d.toISOString(), amount: pay, default_wallet_id: w.id }).eq('id', id).select().single()).data);
}

async function taskReport(id: string, b: any) {
  const { data: task } = await supabase.from('project_tasks').select('*').eq('id', id).single();
  if (!task) throw new Error('المهمة غير موجودة');
  if (b.include && !task.is_completed) throw new Error('أنه المهمة أولاً');
  return fromDb((await supabase.from('project_tasks').update({ include_in_report: !!b.include }).eq('id', id).select().single()).data);
}

async function reorder(b: any) {
  const ids = b.ids as string[];
  if (!Array.isArray(ids) || !ids.length) throw new Error('قائمة غير صالحة');
  for (let i = 0; i < ids.length; i++) await supabase.from('project_tasks').update({ sort_order: i }).eq('id', ids[i]);
  return { ok: true, count: ids.length };
}

async function lessons(m: string, s: string[], b: any) {
  if (m === 'POST') {
    const titles = (b.titles || []).map((t: any) => String(t).trim()).filter(Boolean);
    if (!titles.length) throw new Error('أضف درساً واحداً على الأقل');
    const { data: last } = await supabase.from('learning_lessons').select('sort_order').eq('item_id', b.itemId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const base = (last?.sort_order ?? 0) + 1;
    await supabase.from('learning_lessons').insert(titles.map((t: string, i: number) => ({ item_id: b.itemId, title: t, sort_order: base + i })));
    await syncItem(b.itemId);
    return { ok: true, added: titles.length };
  }
  if (s[0] && m === 'PATCH') {
    const u: any = {};
    if (b.isDone !== undefined) u.is_done = !!b.isDone;
    if (b.title !== undefined) u.title = String(b.title).trim().slice(0, 300);
    const { data: lesson } = await supabase.from('learning_lessons').select('item_id').eq('id', s[0]).single();
    const { data, error } = await supabase.from('learning_lessons').update(u).eq('id', s[0]).select().single();
    if (error || !data) throw new Error(error?.message || 'الدرس غير موجود');
    await syncItem(lesson?.item_id);
    return fromDb(data);
  }
  if (s[0] && m === 'DELETE') {
    const { data: lesson } = await supabase.from('learning_lessons').select('item_id').eq('id', s[0]).single();
    if (lesson) { await supabase.from('learning_lessons').delete().eq('id', s[0]); await syncItem(lesson.item_id); }
    return { ok: true };
  }
  throw new Error('طريقة غير مدعومة');
}

async function syncItem(itemId: string) {
  const { count } = await supabase.from('learning_lessons').select('*', { count: 'exact', head: true }).eq('item_id', itemId);
  const { count: done } = await supabase.from('learning_lessons').select('*', { count: 'exact', head: true }).eq('item_id', itemId).eq('is_done', true);
  await supabase.from('learning_items').update({ total_units: count ?? 0, done_units: done ?? 0 }).eq('id', itemId);
}

async function recovery(m: string, b: any) {
  if (m === 'GET') {
    const { data, error } = await supabase.from('recovery_settings').select('*').eq('id', 'singleton').maybeSingle();
    return fromDb(data) || null;
  }
  if (m === 'POST') {
    const sd = b.startDate as string;
    if (!sd) throw new Error('تاريخ البداية مطلوب');
    const { data: settings } = await supabase.from('recovery_settings').upsert({ id: 'singleton', start_date: sd }, { onConflict: 'id' }).select().single();
    const today = new Date().toISOString().slice(0, 10);
    if (sd <= today) {
      const { data: ex } = await supabase.from('recovery_logs').select('date').gte('date', sd).lte('date', today);
      const eds = new Set((ex || []).map((r: any) => r.date));
      const create: any[] = [];
      for (let d = new Date(sd); d <= new Date(today); d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().slice(0, 10);
        if (!eds.has(ds)) create.push({ date: ds, status: 'clean' });
      }
      if (create.length) await supabase.from('recovery_logs').insert(create);
    }
    return fromDb(settings);
  }
  throw new Error('طريقة غير مدعومة');
}

async function hosoon(m: string, b: any) {
  if (m === 'GET') return fromDb((await supabase.from('hosoon_days').select('*').order('date', { ascending: false })).data);
  if (m === 'POST') return fromDb((await supabase.from('hosoon_days').upsert({ date: b.date, done: b.done ?? true }, { onConflict: 'date' }).select().single()).data);
  throw new Error('طريقة غير مدعومة');
}

async function reportGenerate(b: any) {
  const { data: proj } = await supabase.from('projects').select('*, work_entities(*)').eq('id', b.projectId).single();
  if (!proj) throw new Error('المشروع غير موجود');
  const pe = new Date(b.periodEnd); pe.setHours(23, 59, 59, 999);
  const { data: tasks } = await supabase.from('project_tasks').select('title, completed_at')
    .eq('project_id', b.projectId).eq('is_completed', true).eq('include_in_report', true)
    .gte('completed_at', new Date(b.periodStart).toISOString()).lte('completed_at', pe.toISOString())
    .order('completed_at', { ascending: true });
  const snap = (tasks || []).map((t: any) => ({ project_name: proj.name, title: t.title, completed_at: t.completed_at }));
  const { data, error } = await supabase.from('reports').insert({
    title: b.title || `تقرير إنجاز — ${proj.name}`, period_start: new Date(b.periodStart).toISOString(),
    period_end: new Date(b.periodEnd).toISOString(), tasks_snapshot: JSON.stringify(snap),
    status: 'archived', project_id: proj.id, entity_id: proj.entity_id,
  }).select().single();
  if (error) throw new Error(error.message);
  return fromDb({ ...data, entity: proj.work_entities, project: { id: proj.id, name: proj.name, color: proj.color } });
}

async function manualExport(id: string) {
  throw new Error('تصدير PDF يتطلب تنصيب محلي — استخدم زر الطباعة في المتصفح');
}

async function srsReview(id: string, b: any) {
  const { data: card } = await supabase.from('srs_cards').select('*').eq('id', id).single();
  if (!card || !card.is_active) throw new Error('البطاقة غير صالحة');
  const s = { intervalDays: card.interval_days || 0, easeFactor: card.ease_factor || 2.5, reviewCount: card.review_count || 0 };
  const r = b.rating as string;
  let next: any;
  if (r === 'hard') next = { intervalDays: 1, easeFactor: Math.max(1.3, s.easeFactor - 0.2) };
  else if (r === 'medium') next = { intervalDays: Math.max(1, s.reviewCount === 0 ? 3 : Math.round(s.intervalDays * 1.3)), easeFactor: s.easeFactor };
  else next = { intervalDays: Math.max(1, s.reviewCount === 0 ? 10 : Math.round(s.intervalDays * s.easeFactor)), easeFactor: Math.min(3, s.easeFactor + 0.15) };
  const d = new Date(b.today || new Date().toISOString().slice(0, 10)); d.setDate(d.getDate() + next.intervalDays);
  const up = await supabase.from('srs_cards').update({ interval_days: next.intervalDays, ease_factor: next.easeFactor, due_date: d.toISOString().slice(0, 10), review_count: (card.review_count || 0) + 1 }).eq('id', id).select().single();
  await supabase.from('srs_review_logs').insert({ card_id: id, date: b.today || new Date().toISOString().slice(0, 10), rating: r });
  return fromDb(up.data);
}

// ========== Router ==========
async function route(m: string, p: string, b: unknown): Promise<unknown> {
  const segs = p.replace(/^\/+/, '').split('/').filter(Boolean);
  if (segs[0] !== 'api') throw new Error('مسار غير معروف');
  switch (segs[1]) {
    case 'crud': return handleCrud(segs.slice(2), m, b);
    case 'toggle-log': return toggleLog(b);
    case 'summary': return handleSummary();
    case 'documents': return documents(m, segs.slice(2), b);
    case 'folders': return folders(m, segs.slice(2), b);
    case 'transfers': return transfers(b);
    case 'transactions': return transactions(m, segs.slice(2), b);
    case 'debts': return segs[3] === 'settle' ? debtsSettle(segs[2], b) : (() => { throw new Error('طريقة غير مدعومة'); })();
    case 'subscriptions': return segs[3] === 'pay' ? subPay(segs[2], b) : (() => { throw new Error('طريقة غير مدعومة'); })();
    case 'projects': return segs[2] === 'reorder' ? reorder(b) : segs[2] === 'tasks' && segs[4] === 'report' ? taskReport(segs[3], b) : (() => { throw new Error('طريقة غير مدعومة'); })();
    case 'learning': return lessons(m, segs.slice(2), b);
    case 'recovery': return recovery(m, b);
    case 'hosoon': return hosoon(m, b);
    case 'quran': return segs[2] === 'heatmap' ? heatmap() : segs[2] === 'srs' && segs[4] === 'review' ? srsReview(segs[3], b) : (() => { throw new Error('طريقة غير مدعومة'); })();
    case 'reports': return segs[2] === 'generate' ? reportGenerate(b) : segs[2] === 'manual' && segs[4] === 'export' ? manualExport(segs[3]) : (() => { throw new Error('طريقة غير مدعومة'); })();
    default: throw new Error('مورد غير معروف');
  }
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T | null> {
  const m = opts.method ?? 'GET';
  try {
    const data = await route(m, path, opts.body);
    if (m === 'GET') getCache.set(path, data);
    else getCache.clear();
    if (opts.ok) notifyFn(opts.ok, 'success');
    return data as T;
  } catch (e: unknown) {
    notifyFn(e instanceof Error ? e.message : 'خطأ في الاتصال', 'error');
    return null;
  }
}
