-- review_questions.source 컬럼 추가 (작업 1.6)
ALTER TABLE review_questions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- 'manual' | 'ai_suggested'

-- distributions 세금 컬럼 추가 (작업 5.3)
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS withholding_tax INT DEFAULT 0;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS net_amount INT;

-- projects.completed_count 증가 RPC (리뷰 제출 시 사용)
CREATE OR REPLACE FUNCTION increment_completed_count(project_id UUID)
RETURNS void AS $$
  UPDATE projects
  SET completed_count = completed_count + 1
  WHERE id = project_id;
$$ LANGUAGE sql;
