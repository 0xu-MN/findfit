CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku_type        TEXT NOT NULL, -- 'registration_light' | 'registration_standard' | 'deep_report'
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  portone_tx_id   TEXT,
  amount          INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | captured | refunded | failed | waived_test
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments(user_id, created_at);
CREATE INDEX IF NOT EXISTS payments_project_idx ON payments(project_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 본인 결제 내역 조회만 허용(구매 여부 확인용) — insert/update는 서버 API
-- 라우트(session client, 소유권은 user_id=auth.uid()로 스스로 강제)에서만.
CREATE POLICY payments_select_own ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY payments_insert_own ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
