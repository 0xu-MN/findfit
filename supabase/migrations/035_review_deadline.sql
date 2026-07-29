-- 크리에이터가 모집을 마감하고 리뷰 단계(reviewing)로 넘어갈 때, 리뷰어들이
-- 답변을 마쳐야 하는 마감 기한을 별도로 기록한다. 지금까지는 모집 마감일
-- (deadline)만 있고 "리뷰 작성 마감일"이 없어서, 리뷰가 무기한 열려있거나
-- 크리에이터가 일일이 수동으로 언제 닫아야 할지 판단해야 했다.
alter table projects add column if not exists review_deadline timestamptz;

-- projects_public 뷰(migration 009)도 새 컬럼을 노출해야 리뷰어 화면에서
-- 볼 수 있다. CREATE OR REPLACE VIEW는 기존 컬럼 순서/이름을 바꿀 수
-- 없으므로 반드시 끝에 추가한다.
create or replace view projects_public as
select
  id, title, one_liner, categories, stage, project_type, psf_pmf_type, status,
  problem, solution, alternative_limit, target_age_range, target_jobs, landing_url,
  target_count, completed_count, deadline, incentive_exists, incentive_budget,
  distribution_method, creator_level, access_method, access_info, created_at, review_deadline
from projects;
grant select on projects_public to authenticated, anon;
