-- 크리에이터로만 활동하던 유저가 처음으로 리뷰어 화면을 눌러도(또는 그 반대)
-- 온보딩 코치마크가 그 사람 기준으로 뜬 적이 없으면 다시 보여주기 위한 플래그.
-- 기존 CoachTour는 localStorage 플래그만 썼는데, 이건 브라우저 단위라 계정별
-- "이 역할은 처음이다"를 구분하지 못했다.
alter table users add column if not exists creator_onboarded_at timestamptz;
alter table users add column if not exists reviewer_onboarded_at timestamptz;
