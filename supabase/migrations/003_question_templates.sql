-- question_templates: 프로젝트 타입 × PSF/PMF 단계별 질문 템플릿

CREATE TABLE IF NOT EXISTS question_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type  TEXT NOT NULL,        -- 'light' | 'standard' | 'deep'
  psf_pmf_type  TEXT NOT NULL,        -- 'psf' | 'pmf'
  is_required   BOOLEAN DEFAULT FALSE, -- true면 STEP4에서 잠금 블록, 삭제·수정 불가
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,        -- 'multiple_choice' | 'short_answer' | 'likert_5' | 'sean_ellis'
  options       JSONB,                -- 객관식/리커트 선택지
  order_index   INT DEFAULT 0,
  meta          JSONB                 -- Deep 타입용 phase('pre'|'task'|'post') 등
);

-- ─── Standard + PSF (아이디어/프로토타입) — 필수 4개 ────────────────
INSERT INTO question_templates (project_type, psf_pmf_type, is_required, question_text, question_type, options, order_index) VALUES
('standard', 'psf', true, '이 문제를 직접 겪어보신 적이 있나요?', 'multiple_choice',
  '["자주 겪는다","가끔 겪는다","거의 없다","겪어본 적 없다"]', 1),
('standard', 'psf', true, '현재는 이 문제를 어떻게 해결하고 계신가요?', 'short_answer', null, 2),
('standard', 'psf', true, '이런 솔루션이 있다면 사용해보시겠어요?', 'multiple_choice',
  '["반드시 사용한다","사용해볼 것 같다","잘 모르겠다","사용하지 않을 것 같다"]', 3),
('standard', 'psf', true, '이 문제는 얼마나 자주 발생하나요?', 'multiple_choice',
  '["매일","주 1~2회","월 1~2회","거의 없음"]', 4);

-- ─── Standard + PMF (베타/출시후) — Sean Ellis Test 필수 ─────────────
INSERT INTO question_templates (project_type, psf_pmf_type, is_required, question_text, question_type, options, order_index) VALUES
('standard', 'pmf', true,
  '이 제품/서비스를 더 이상 사용할 수 없게 된다면 어떤 기분이 들겠습니까?', 'sean_ellis',
  '["매우 실망할 것이다","약간 실망할 것이다","실망하지 않을 것이다","이 제품을 사용하지 않는다"]', 1);

-- ─── Light + PSF — 추천 3개 (Creator 수정·대체 가능) ─────────────────
INSERT INTO question_templates (project_type, psf_pmf_type, is_required, question_text, question_type, options, order_index) VALUES
('light', 'psf', false, '이 아이디어를 들었을 때 가장 먼저 드는 생각은?', 'multiple_choice',
  '["긍정적이다","회의적이다"]', 1),
('light', 'psf', false, '이런 서비스가 있다면 써보시겠어요?', 'multiple_choice',
  '["예","아니오"]', 2),
('light', 'psf', false, '이 아이디어에서 가장 헷갈리거나 이해 안 되는 부분은?', 'short_answer', null, 3);

-- ─── Light + PMF — 추천 2개 ──────────────────────────────────────────
INSERT INTO question_templates (project_type, psf_pmf_type, is_required, question_text, question_type, options, order_index) VALUES
('light', 'pmf', false, 'A안과 B안 중 어떤 것이 더 만족스러운가요?', 'multiple_choice',
  '["A","B"]', 1),
('light', 'pmf', false, '전반적인 만족도를 평가해주세요', 'likert_5',
  '["매우 불만족","불만족","보통","만족","매우 만족"]', 2);

-- ─── Deep 공통 베이스 (프로토타입/베타/출시후) — 체험 전/후 구조 ──────
INSERT INTO question_templates (project_type, psf_pmf_type, is_required, question_text, question_type, options, order_index, meta) VALUES
('deep', 'psf', false,
  '이 서비스를 처음 본다면 무엇을 하는 곳이라고 생각하시나요?', 'short_answer', null, 1, '{"phase":"pre"}'),
('deep', 'psf', true,
  '[체험 태스크] 안내된 작업을 직접 수행해주세요', 'short_answer', null, 2,
  '{"phase":"task","editable_by_creator":true}'),
('deep', 'psf', false,
  '작업을 수행하면서 사용성은 어땠나요?', 'likert_5',
  '["매우 어려움","어려움","보통","쉬움","매우 쉬움"]', 3, '{"phase":"post"}'),
('deep', 'psf', false,
  '직관성(설명 없이도 이해 가능했는가)을 평가해주세요', 'likert_5',
  '["매우 낮음","낮음","보통","높음","매우 높음"]', 4, '{"phase":"post"}'),
('deep', 'psf', false,
  '신뢰도(이 서비스를 믿고 쓸 수 있는가)를 평가해주세요', 'likert_5',
  '["매우 낮음","낮음","보통","높음","매우 높음"]', 5, '{"phase":"post"}'),
('deep', 'psf', false,
  '체험 중 가장 막히거나 불편했던 지점은 어디였나요?', 'short_answer', null, 6, '{"phase":"post"}');

-- Deep + PMF는 위 6개 + standard/pmf의 sean_ellis 항목을 런타임에 합침 (별도 INSERT 없음)
