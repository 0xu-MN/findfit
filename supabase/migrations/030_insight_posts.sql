CREATE TABLE IF NOT EXISTS insight_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL CHECK (type IN ('feed', 'newsroom')),
  title             TEXT NOT NULL,
  category          TEXT,
  tag               TEXT,
  cover_image_url   TEXT,
  body              TEXT NOT NULL,
  author            TEXT NOT NULL DEFAULT 'FindFit',
  published         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS insight_posts_type_idx ON insight_posts(type, published, created_at DESC);

ALTER TABLE insight_posts ENABLE ROW LEVEL SECURITY;

-- 공개된 글은 누구나 조회 가능. 작성/수정/삭제는 정책을 안 만든다 —
-- 관리자 API(app/api/admin/insights/*)가 서비스 롤 클라이언트로만 쓴다
-- (app/api/admin/requests/route.ts와 동일한 findfit-admin-token 쿠키 패턴).
CREATE POLICY insight_posts_select_published ON insight_posts FOR SELECT
  USING (published = true);

-- 데모 시드 — 관리자 UI(/admin/insights)가 아직 비어있는 상태에서도
-- /builder/feed, /evaluator/feed와 상세 페이지 레이아웃을 바로 확인할 수
-- 있게 최소한의 글을 미리 넣어둔다. 운영 전엔 지우거나 published=false로
-- 바꿔도 무방.
INSERT INTO insight_posts (type, title, category, tag, cover_image_url, body, author) VALUES
  ('feed', 'PSF 검증으로 출시 3개월 만에 월 매출 1억을 달성한 브랜드 이야기', '성공사례', NULL,
   'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
   '단백질 쉐이크 스타트업이 FindFit 리뷰어 수백 명의 솔직한 피드백을 통해 제품을 다듬고, 타깃 고객을 정확히 찾아내기까지의 여정을 공유합니다. 검증 데이터가 어떻게 투자 유치로 이어졌는지도 함께 담겨 있습니다.',
   '김준혁'),
  ('feed', '검증 설문지를 잘 쓰면 리포트 품질이 2배 올라갑니다', '팁/노하우', NULL,
   'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
   '막연한 "좋아요/싫어요" 대신 행동 기반 질문으로 구성하는 법을 단계별로 설명합니다. 질문 설계만 바꿔도 인사이트의 밀도가 크게 달라집니다.',
   '이서연'),
  ('newsroom', 'FindFit 리뷰어 10만 명 돌파 기념 이벤트 안내', NULL, '공지', NULL,
   '이번 달 참여 리뷰어 전원에게 보너스 포인트를 지급합니다. 자세한 내용은 공지사항을 확인해주세요.',
   'FindFit');
