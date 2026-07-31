-- 리뷰어가 리뷰 세션(문항 열람)을 시작한 시각. submitted_at(제출 시각)과의
-- 차이로 응답 소요시간을 계산해 리포트의 "성실성 신호"로 노출한다.
-- 최초 문항 로드 성공 시 1회만 기록되고(이미 값이 있으면 덮어쓰지 않음),
-- 리뷰어가 폼을 열었다 닫았다 반복해도 최초 시작 시각이 유지된다.
ALTER TABLE project_matches ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ;
