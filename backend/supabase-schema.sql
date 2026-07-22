-- Schema for Hayati OS on Supabase PostgreSQL
-- Auto-generated from Prisma schema

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash',
  balance DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  amount DOUBLE PRECISION NOT NULL,
  category TEXT DEFAULT 'عام',
  description TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  to_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  paid_amount DOUBLE PRECISION DEFAULT 0,
  is_settled BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  billing_cycle TEXT NOT NULL,
  next_renewal TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'أدوات',
  is_active BOOLEAN DEFAULT true,
  default_wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'عام',
  estimated_value DOUBLE PRECISION DEFAULT 0,
  purchase_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount DOUBLE PRECISION NOT NULL,
  current_amount DOUBLE PRECISION DEFAULT 0,
  deadline TIMESTAMPTZ,
  color TEXT DEFAULT '#34d399',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  date TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES daily_tasks(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  UNIQUE(task_id, date)
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🔥',
  color TEXT DEFAULT '#34d399',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS weekly_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  week_start TEXT NOT NULL UNIQUE,
  done_dates TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_color TEXT DEFAULT '#38bdf8',
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#a78bfa',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  entity_id UUID REFERENCES work_entities(id) ON DELETE SET NULL,
  ended_at TIMESTAMPTZ,
  ended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  include_in_report BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  report_date TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  tasks_snapshot TEXT,
  status TEXT DEFAULT 'draft',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES work_entities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manual_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  report_date TIMESTAMPTZ NOT NULL,
  entity_id UUID REFERENCES work_entities(id) ON DELETE SET NULL,
  document_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doc_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#38bdf8',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/octet-stream',
  size BIGINT DEFAULT 0,
  folder_id UUID REFERENCES doc_folders(id) ON DELETE SET NULL,
  b2_file_id TEXT,
  b2_bucket_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosoon_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE,
  fort1 BOOLEAN DEFAULT false,
  fort2 BOOLEAN DEFAULT false,
  fort3 BOOLEAN DEFAULT false,
  fort4 BOOLEAN DEFAULT false,
  fort5 BOOLEAN DEFAULT false,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shanqiti_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  verses TEXT NOT NULL,
  target_reps INTEGER NOT NULL,
  current_reps INTEGER DEFAULT 0,
  linking_done BOOLEAN DEFAULT false,
  review_done BOOLEAN DEFAULT false,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quran_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  surah TEXT NOT NULL,
  surah_number INTEGER,
  from_ayah INTEGER,
  to_ayah INTEGER,
  ayah_count INTEGER DEFAULT 0,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS srs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  surah_number INTEGER,
  due_date TEXT NOT NULL,
  interval_days INTEGER DEFAULT 0,
  ease_factor DOUBLE PRECISION DEFAULT 2.5,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS srs_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES srs_cards(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  rating TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT DEFAULT 'عام',
  url TEXT,
  channel TEXT,
  total_units INTEGER DEFAULT 0,
  done_units INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES learning_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  start_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  trigger TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for all tables (personal app)
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_focus DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE manual_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE doc_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE hosoon_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE shanqiti_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quran_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE srs_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE srs_review_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_logs DISABLE ROW LEVEL SECURITY;
