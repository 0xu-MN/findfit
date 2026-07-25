CREATE TABLE IF NOT EXISTS report_benchmark_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,
  stage             TEXT NOT NULL,
  psf_score         NUMERIC,
  sean_ellis_pct    NUMERIC,
  verdict           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_benchmark_category_idx ON report_benchmark_logs(category, stage);

ALTER TABLE report_benchmark_logs ENABLE ROW LEVEL SECURITY;
-- 집계용 내부 로그 — 개인/프로젝트 소유자에게도 열람 노출할 이유가 없어
-- 서비스 롤(generateReport.ts, admin client)에서만 쓴다. 정책 없음(전체 차단).
