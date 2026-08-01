-- ai_reports는 project_id UNIQUE라 재생성마다 upsert로 이전 버전을 덮어쓴다.
-- 재생성 직전 시점의 report_data를 여기 백업해서 과거 리포트를 복구/비교할 수 있게 한다.
CREATE TABLE IF NOT EXISTS ai_reports_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_type    TEXT NOT NULL,
  ai_engine_used TEXT NOT NULL,
  psf_score      FLOAT,
  sean_ellis_pct FLOAT,
  recommendation TEXT,
  report_data    JSONB NOT NULL,
  pdf_url        TEXT,
  is_unlocked    BOOLEAN,
  replaced_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_reports_history_project_id_idx ON ai_reports_history(project_id);

ALTER TABLE ai_reports_history ENABLE ROW LEVEL SECURITY;
-- 백업 로그 — service role(generateReport.ts)에서만 쓴다. 정책 없음(전체 차단).
