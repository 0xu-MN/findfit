-- 자동추천(질문/관심사) 호출 총 횟수 캡 — 프로젝트 단위 또는(초안 단계처럼
-- project_id가 아직 없는 경우) 유저+날짜 단위로 자유롭게 키를 구성해 쓰는
-- 범용 카운터 테이블.
CREATE TABLE IF NOT EXISTS ai_suggestion_logs (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_suggestion_logs ENABLE ROW LEVEL SECURITY;
-- 서비스 롤 API 라우트에서만 카운트를 관리 — 정책 없음(전부 차단, service_role은 RLS 우회).
