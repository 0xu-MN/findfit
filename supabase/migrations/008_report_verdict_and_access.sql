-- 008: AI 리포트 PSF 서브스코어/verdict + 제품 접근 방식(access_method) + 배송 상태
-- (project_matches.status 컬럼은 007에서 이미 생성되어 있어 추가하지 않음)

-- ai_reports: PSF 3개 서브스코어 + 3단계 판정(verdict)
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS problem_exists_pct      FLOAT;
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS solution_acceptance_pct FLOAT;
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS purchase_intent_pct     FLOAT;
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS verdict                 TEXT; -- 'GO' | 'CAUTION' | 'RECONSIDER'

-- projects: 제품 접근 방식
-- access_method: 'web_link' | 'app_download' | 'physical_shipping'
-- access_info: method별 부가 정보 JSONB — { url } 또는 { appStoreUrl, playStoreUrl }
ALTER TABLE projects ADD COLUMN IF NOT EXISTS access_method TEXT DEFAULT 'web_link';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS access_info   JSONB DEFAULT '{}'::jsonb;

-- project_matches: 배송형 프로젝트 처리용 상태
-- shipping_status: 'not_required' | 'pending' | 'shipped' | 'delivered'
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS shipping_status      TEXT DEFAULT 'not_required';
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS shipping_address     TEXT;
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS received_confirmed_at TIMESTAMPTZ;

-- project_matches: 리뷰어 지원 정보 (인증 없이도 지원 가능하게 하는 v1.2 필드)
-- ⚠️ 기존 apply API(app/api/evaluator/apply)가 이미 이 컬럼들에 insert하고 있으나
--    마이그레이션에는 누락되어 있었음 — 여기서 보강한다.
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS applicant_email  TEXT;
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS applicant_domain TEXT[];
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS applicant_intro  TEXT;
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS applied_at       TIMESTAMPTZ;
