-- 객관식 문항에 복수 선택을 허용할지 여부. 기존 문항은 전부 단일 선택
-- (라디오)이었으므로 기본값 FALSE로 하위 호환.
ALTER TABLE review_questions ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT FALSE;
