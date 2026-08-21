// Applies the app's DB schema to the configured PostgreSQL database.
// Run: node --env-file=.env --env-file=.env.local scripts/setup-db.mjs

import pg from 'pg'
import fs from 'fs'
import path from 'path'

function loadEnvFile(file, override) {
  const p = path.resolve(file)
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (override || process.env[m[1]] === undefined) process.env[m[1]] = val
  }
}
loadEnvFile('.env', false)
loadEnvFile('.env.local', true)

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  ssl: { rejectUnauthorized: false },
  max: 2,
})

const DDL = `
CREATE TABLE IF NOT EXISTS finance_tracker (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    sheet_id VARCHAR(100),
    expense_categories JSONB DEFAULT '[]'::jsonb NOT NULL,
    income_categories JSONB DEFAULT '[]'::jsonb NOT NULL,
    monthly_budget DECIMAL(15,2) DEFAULT 0 NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_finance_tracker_email ON finance_tracker(email);
CREATE INDEX IF NOT EXISTS idx_finance_tracker_sheet_id ON finance_tracker(sheet_id);
CREATE INDEX IF NOT EXISTS idx_finance_tracker_is_active ON finance_tracker(is_active);

CREATE TABLE IF NOT EXISTS incomes (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id BIGINT NOT NULL REFERENCES finance_tracker(id) ON DELETE CASCADE,
    timestamp VARCHAR(255),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'manual' NOT NULL,
    external_id VARCHAR(255),
    CONSTRAINT incomes_user_date_amount_category_unique UNIQUE (user_id, date, amount, category)
);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, date);
CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes(category);

CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id BIGINT NOT NULL REFERENCES finance_tracker(id) ON DELETE CASCADE,
    timestamp VARCHAR(255),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    category VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'manual' NOT NULL,
    external_id VARCHAR(255),
    CONSTRAINT expenses_user_date_amount_category_unique UNIQUE (user_id, date, amount, category)
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id BIGINT NOT NULL REFERENCES finance_tracker(id) ON DELETE CASCADE,
    timestamp VARCHAR(255),
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    budget_type VARCHAR(50) DEFAULT 'monthly' NOT NULL,
    period_start DATE,
    period_end DATE,
    source VARCHAR(50) DEFAULT 'manual' NOT NULL,
    external_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    CONSTRAINT budgets_user_date_unique UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_date ON budgets(user_id, date);

CREATE OR REPLACE FUNCTION update_finance_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_finance_tracker_updated_at ON finance_tracker;
CREATE TRIGGER trigger_update_finance_tracker_updated_at
    BEFORE UPDATE ON finance_tracker
    FOR EACH ROW EXECUTE FUNCTION update_finance_tracker_updated_at();

DROP TRIGGER IF EXISTS trigger_update_incomes_updated_at ON incomes;
CREATE TRIGGER trigger_update_incomes_updated_at
    BEFORE UPDATE ON incomes
    FOR EACH ROW EXECUTE FUNCTION update_finance_tracker_updated_at();

DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_finance_tracker_updated_at();

DROP TRIGGER IF EXISTS trigger_update_budgets_updated_at ON budgets;
CREATE TRIGGER trigger_update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_finance_tracker_updated_at();
`

const client = await pool.connect()
try {
  await client.query(DDL)
  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
  )
  console.log('Schema OK. Tables:', rows.map((r) => r.table_name).join(', '))
} finally {
  client.release()
  await pool.end()
}
