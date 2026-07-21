-- 011: 마법사에서 입력받지만 저장할 컬럼이 없어 그냥 버려지던 필드 보존 (H-2)
--
-- occupations/interests/targetContext/decisionFactor/validationGoal/hypothesis/
-- targetReviewerRoles — 각각 전용 컬럼을 새로 만들기엔 아직 스키마가 안정되지
-- 않은 필드들이라, 우선 JSONB 하나에 통째로 넣어 유실만 막는다. 필요해지면
-- (예: targetReviewerRoles로 매칭 필터링을 실제로 걸게 되면) 그때 전용 컬럼으로
-- 승격.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS extra_data JSONB;
