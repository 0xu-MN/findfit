-- ai_reports: AI 분석 리포트 저장 테이블

CREATE TABLE IF NOT EXISTS ai_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects(id) UNIQUE,
  report_type    TEXT NOT NULL,      -- 'light' | 'standard' | 'deep'
  ai_engine_used TEXT NOT NULL,      -- 'gemini' | 'claude'
  psf_score      FLOAT,              -- standard/deep(PMF)에서만 사용, light는 NULL
  sean_ellis_pct FLOAT,              -- pmf 타입에서만 사용
  recommendation TEXT,              -- 'continue' | 'pivot' | 'stop' (light는 NULL)
  report_data    JSONB NOT NULL,     -- 타입별 상세 데이터
  pdf_url        TEXT,
  is_unlocked    BOOLEAN DEFAULT FALSE,  -- Builder+ 레벨은 무료 해제
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS ai_reports_project_id_idx ON ai_reports(project_id);
