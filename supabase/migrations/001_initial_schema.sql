-- FindFit 초기 스키마

-- 역할 타입
CREATE TYPE user_role AS ENUM ('builder', 'evaluator', 'admin');
CREATE TYPE evaluator_grade AS ENUM ('general', 'expert', 'domain');
CREATE TYPE request_stage AS ENUM ('psf', 'pmf');
CREATE TYPE request_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE recommendation AS ENUM ('continue', 'pivot', 'stop');
CREATE TYPE cash_tx_type AS ENUM ('charge', 'spend', 'expire', 'reward');
CREATE TYPE request_category AS ENUM ('saas', 'commerce', 'health', 'edu', 'fintech', 'other');

-- 사용자 (Supabase auth.users 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 빌더 프로필
CREATE TABLE builder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  cash_balance INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);

-- 평가단 프로필
CREATE TABLE evaluator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade evaluator_grade NOT NULL DEFAULT 'general',
  domains TEXT[] NOT NULL DEFAULT '{}',
  review_count INTEGER NOT NULL DEFAULT 0,
  quality_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id)
);

-- 의뢰
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stage request_stage NOT NULL,
  category request_category[] NOT NULL DEFAULT '{}',
  -- 문제/솔루션
  problem TEXT,
  existing_alternatives TEXT,
  differentiation TEXT,
  -- 타겟 고객
  target_customer TEXT,
  customer_trigger TEXT,
  purchase_criteria TEXT,
  -- 검증 목표
  validation_goal TEXT,
  hypothesis TEXT,
  additional_requests TEXT,
  -- 평가단 설정
  target_count INTEGER NOT NULL CHECK (target_count BETWEEN 5 AND 100),
  evaluator_grade evaluator_grade NOT NULL DEFAULT 'general',
  deep_report BOOLEAN NOT NULL DEFAULT FALSE,
  deadline_hours INTEGER NOT NULL DEFAULT 72 CHECK (deadline_hours IN (48, 72)),
  -- 상태/비용
  status request_status NOT NULL DEFAULT 'pending',
  cash_spent INTEGER NOT NULL,
  landing_url TEXT,
  -- 블라인드: evaluator는 builder_id 접근 불가 (RLS)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 평가 (블라인드)
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  sean_ellis_score SMALLINT NOT NULL CHECK (sean_ellis_score BETWEEN 1 AND 4),
  quality_score NUMERIC(4,2),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, evaluator_id)
);

-- AI 리포트
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE UNIQUE,
  psf_score SMALLINT NOT NULL CHECK (psf_score BETWEEN 0 AND 100),
  pmf_score SMALLINT NOT NULL CHECK (pmf_score BETWEEN 0 AND 100),
  sean_ellis_40_passed BOOLEAN NOT NULL,
  summary TEXT NOT NULL,
  recommendation recommendation NOT NULL,
  insights JSONB NOT NULL DEFAULT '{}',
  superhuman_segment JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐시 거래 내역
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type cash_tx_type NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 첨부파일 (Supabase Storage 연동)
CREATE TABLE request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' | 'pdf' | 'video_url'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_attachments ENABLE ROW LEVEL SECURITY;

-- users: 본인만 조회
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- builder_profiles: 본인만
CREATE POLICY "builder_profiles_own" ON builder_profiles FOR ALL USING (auth.uid() = user_id);

-- evaluator_profiles: 본인만 (등급은 서버에서만 수정)
CREATE POLICY "evaluator_profiles_own" ON evaluator_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "evaluator_profiles_update_own" ON evaluator_profiles FOR UPDATE USING (auth.uid() = user_id);

-- requests: 빌더는 자신의 의뢰만, 평가단은 active 의뢰 목록 조회 가능 (builder_id 숨김)
CREATE POLICY "requests_builder_all" ON requests FOR ALL
  USING (auth.uid() = builder_id);

CREATE POLICY "requests_evaluator_select" ON requests FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'evaluator'
    )
  );

-- evaluations: 평가단은 자신의 평가만, 빌더는 자신의 의뢰 평가 조회 (evaluator_id 노출 안 함)
CREATE POLICY "evaluations_evaluator_own" ON evaluations FOR ALL
  USING (auth.uid() = evaluator_id);

CREATE POLICY "evaluations_builder_select" ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r WHERE r.id = request_id AND r.builder_id = auth.uid()
    )
  );

-- reports: 빌더(의뢰인)만 조회
CREATE POLICY "reports_builder_select" ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r WHERE r.id = request_id AND r.builder_id = auth.uid()
    )
  );

-- cash_transactions: 본인만
CREATE POLICY "cash_tx_own" ON cash_transactions FOR SELECT USING (auth.uid() = user_id);

-- notifications: 본인만
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- request_attachments: 의뢰 관련 접근 권한 따름
CREATE POLICY "attachments_builder_all" ON request_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM requests r WHERE r.id = request_id AND r.builder_id = auth.uid()
    )
  );

CREATE POLICY "attachments_evaluator_select" ON request_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_id AND r.status = 'active'
      AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'evaluator')
    )
  );

-- ============================================================
-- 자동화: 신규 유저 가입 시 users 테이블 자동 삽입
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 캐시 소멸: 180일 후 자동 처리 (Edge Function에서 cron으로 실행)
-- ============================================================

-- 인덱스
CREATE INDEX idx_requests_builder ON requests(builder_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_evaluations_request ON evaluations(request_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_cash_tx_user ON cash_transactions(user_id, created_at);
