-- review_answers: 리뷰어가 제출한 질문별 답변
CREATE TABLE IF NOT EXISTS review_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id  UUID REFERENCES review_questions(id) ON DELETE CASCADE,
  answer_text  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS review_answers_project_idx ON review_answers(project_id);
CREATE INDEX IF NOT EXISTS review_answers_reviewer_idx ON review_answers(reviewer_id);

-- distributions: distribution_method 컬럼 추가 (배분 방식)
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS distribution_method TEXT;
