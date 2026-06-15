-- reviewer_profiles
CREATE TABLE IF NOT EXISTS reviewer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_tags         TEXT[] DEFAULT '{}',
  level               TEXT DEFAULT 'basic',
  portone_partner_id  TEXT,
  bank_name           TEXT,
  account_number      TEXT,
  account_holder      TEXT,
  is_account_verified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id)
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  one_liner           TEXT,
  categories          TEXT[] DEFAULT '{}',
  stage               TEXT,
  project_type        TEXT NOT NULL DEFAULT 'standard',
  psf_pmf_type        TEXT NOT NULL DEFAULT 'psf',
  status              TEXT NOT NULL DEFAULT 'draft',
  problem             TEXT,
  solution            TEXT,
  alternative_limit   TEXT,
  target_age_range    TEXT,
  target_jobs         TEXT[],
  landing_url         TEXT,
  target_count        INT NOT NULL DEFAULT 10,
  completed_count     INT NOT NULL DEFAULT 0,
  deadline            TIMESTAMPTZ,
  incentive_exists    BOOLEAN DEFAULT FALSE,
  incentive_budget    INT,
  distribution_method TEXT,
  creator_level       TEXT DEFAULT 'seed',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- review_questions
CREATE TABLE IF NOT EXISTS review_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_answer',
  options       JSONB,
  is_required   BOOLEAN DEFAULT FALSE,
  source        TEXT DEFAULT 'manual',
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- project_matches
CREATE TABLE IF NOT EXISTS project_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  nickname     TEXT,
  status       TEXT DEFAULT 'accepted',
  accepted_at  TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(project_id, reviewer_id)
);

-- credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  source     TEXT NOT NULL,
  amount     INT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_creator_idx ON projects(creator_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS review_questions_project_idx ON review_questions(project_id);
CREATE INDEX IF NOT EXISTS project_matches_project_idx ON project_matches(project_id);
CREATE INDEX IF NOT EXISTS project_matches_reviewer_idx ON project_matches(reviewer_id);
CREATE INDEX IF NOT EXISTS credit_tx_user_idx ON credit_transactions(user_id, created_at);
