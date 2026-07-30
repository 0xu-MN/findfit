-- 리뷰어 인구통계(성별/나이/직군)가 리포트에 전혀 반영되지 못하고 있었다 —
-- birth_date(나이)는 있었지만 gender 자체가 스키마에 없었고, 있는 데이터
-- (birth_date, reviewer_profiles.domain_tags)도 리포트 생성 파이프라인에
-- 아예 안 들어가고 있었다(lib/ai/prompt.ts의 Review 타입이 answers만 가짐).
alter table users add column if not exists gender text;
