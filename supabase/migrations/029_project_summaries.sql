CREATE TABLE IF NOT EXISTS project_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creator_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_text  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_summaries_creator_idx ON project_summaries(creator_id, created_at);

ALTER TABLE project_summaries ENABLE ROW LEVEL SECURITY;

-- 본인(creator) 요약만 조회 가능 — Agent 컨텍스트 프리로드에 세션 클라이언트로
-- 바로 쓸 수 있게. insert는 서비스 롤(리뷰 제출 파이프라인)에서만.
CREATE POLICY project_summaries_select_own ON project_summaries FOR SELECT
  USING (auth.uid() = creator_id);
