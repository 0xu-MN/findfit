CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES report_shares(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'email_capture')),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_share_events_share_id_idx ON report_share_events(share_id);

ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_share_events ENABLE ROW LEVEL SECURITY;

-- 공개 페이지(app/r/[slug])와 이메일 캡처는 전부 서비스 롤 API 라우트를 통해서만
-- 쓰기 때문에, 여기서는 프로젝트 소유자(크리에이터) 조회/관리 권한만 정의한다.
CREATE POLICY report_shares_owner_all ON report_shares FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = report_shares.project_id AND p.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = report_shares.project_id AND p.creator_id = auth.uid()));

CREATE POLICY report_share_events_owner_select ON report_share_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM report_shares s
    JOIN projects p ON p.id = s.project_id
    WHERE s.id = report_share_events.share_id AND p.creator_id = auth.uid()
  ));
