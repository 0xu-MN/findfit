-- A. 휴대폰 SMS 인증 (다중계정 방지 1단계)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS phone_verifications_user_id_idx ON phone_verifications(user_id);

ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
-- 발송/확인 전부 서비스 롤 API 라우트를 통해서만 처리 — 클라이언트 직접
-- 접근 정책은 두지 않는다(본인 코드조차 클라이언트에서 select 못 하게).

-- B. 계좌 1원 인증 (다중계정 방지 2단계)
ALTER TABLE reviewer_profiles ADD COLUMN IF NOT EXISTS account_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS account_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  deposit_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_verifications_user_id_idx ON account_verifications(user_id);

ALTER TABLE account_verifications ENABLE ROW LEVEL SECURITY;

-- C. AI 비용 상한 — 프로젝트당 일별 호출 카운트
CREATE TABLE IF NOT EXISTS report_chat_logs (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date)
);

CREATE TABLE IF NOT EXISTS report_regenerate_logs (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, date)
);

ALTER TABLE report_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_regenerate_logs ENABLE ROW LEVEL SECURITY;
-- 카운트 증감은 서비스 롤 API 라우트 안에서만 처리(크리에이터 본인 세션으로도
-- 직접 조작 못 하게 RLS 정책은 별도로 두지 않음 — service_role은 RLS 우회).
