-- distributions: 리뷰어 사례금 배분 내역 테이블

-- reviewer_profiles에 PortOne 계좌 정보 컬럼 추가
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS portone_partner_id TEXT;
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS account_number TEXT; -- pgcrypto로 암호화 권장
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS is_account_verified BOOLEAN DEFAULT FALSE;

-- distributions 테이블 생성
CREATE TABLE IF NOT EXISTS distributions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects(id),
  reviewer_id         UUID REFERENCES users(id),
  nickname            TEXT NOT NULL,
  amount              INT NOT NULL,
  status              TEXT DEFAULT 'pending',
  -- 'pending' | 'processing' | 'completed' | 'failed' | 'pending_registration'
  portone_transfer_id TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS distributions_project_id_idx ON distributions(project_id);
CREATE INDEX IF NOT EXISTS distributions_reviewer_id_idx ON distributions(reviewer_id);
