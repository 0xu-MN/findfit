-- 009: RLS 전면 적용 + 컬럼 단위 신원 비노출(뷰) + 닉네임 충돌 방지 + 유저 상태
--
-- 배경: 002~008에서 만든 테이블(projects/review_questions/review_answers/
-- project_matches/reviewer_profiles/credit_transactions/ai_reports/
-- distributions/question_templates)에는 RLS가 전혀 없었다. anon 키만 있으면
-- 앱 UI를 거치지 않고 다른 사람의 데이터(다른 리뷰어의 답변, 프로젝트의
-- creator_id, 다른 지원자의 이메일 등)를 직접 읽을 수 있는 상태였다.
--
-- 설계 원칙:
--   1) 각 테이블은 "본인 row만" 접근 가능하도록 RLS를 건다.
--   2) 다른 역할이 읽어야 하는 교차 조회(리뷰어가 프로젝트 피드를 보는 것,
--      크리에이터가 매칭된 리뷰어 목록을 보는 것)는 원본 테이블이 아니라
--      "민감 컬럼을 뺀 뷰"를 통해서만 허용한다 (RLS는 행 단위라 컬럼을
--      가릴 수 없으므로, 뷰 + 테이블 소유자 권한 우회 방식을 사용).
--   3) 관리자(admin) 화면/API는 이 RLS를 그대로 우회해야 하므로, 이후
--      코드에서 서비스 롤 키(SUPABASE_SERVICE_ROLE_KEY, 서버 전용) 클라이언트로
--      전환한다 — 이 마이그레이션 자체에는 관련 SQL 변경 없음.

-- ─────────────────────────────────────────────────────────────
-- 1) 유저 상태 (정지/차단/탈퇴)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
-- 'active' | 'suspended' | 'withdrawn'

-- 본인이 자기 status를 UPDATE로 바꿔서 스스로 정지를 풀 수 없도록 컬럼 단위로 차단
-- (users_update_own 정책은 001에서 이미 auth.uid()=id로 전체 컬럼 업데이트를 허용하고 있음)
REVOKE UPDATE (status) ON users FROM authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) 닉네임 충돌 방지 — 원자적 시퀀스 + DB 차원 unique 제약
-- ─────────────────────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nickname_seq INT NOT NULL DEFAULT 0;

-- 기존 count%26 방식(앱 코드)을 대체하는 SECURITY DEFINER 함수.
-- RLS 아래에서도(리뷰어는 projects의 owner가 아니므로) 안전하게 카운터만
-- 증가시키고 닉네임을 반환한다. 스프레드시트 컬럼 방식(A..Z, AA, AB..)이라
-- 26명을 넘어도 절대 겹치지 않는다.
CREATE OR REPLACE FUNCTION assign_reviewer_nickname(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INT;
  v_n INT;
  v_label TEXT := '';
BEGIN
  UPDATE projects SET nickname_seq = nickname_seq + 1
  WHERE id = p_project_id
  RETURNING nickname_seq INTO v_seq;

  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'project % not found', p_project_id;
  END IF;

  v_n := v_seq;
  WHILE v_n > 0 LOOP
    v_n := v_n - 1;
    v_label := chr(65 + (v_n % 26)) || v_label;
    v_n := v_n / 26;
  END LOOP;

  RETURN 'Reviewer_' || v_label;
END;
$$;

-- project_matches.status 컬럼은 007(현 002_core_tables.sql)에서 이미 존재.
-- 여기서는 DB 차원의 최종 방어선으로 unique 제약만 추가.
-- (기존 테스트 데이터에 이미 중복 닉네임이 있으면 이 구문이 실패할 수 있음 —
--  그런 경우 문제되는 row를 먼저 정리한 뒤 재실행)
ALTER TABLE project_matches ADD CONSTRAINT project_matches_project_nickname_uniq UNIQUE (project_id, nickname);

-- increment_completed_count도 SECURITY DEFINER로 재정의 — 리뷰어가 자기
-- 프로젝트가 아닌 projects row(completed_count)를 갱신해야 하므로 필요.
CREATE OR REPLACE FUNCTION increment_completed_count(project_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE projects SET completed_count = completed_count + 1 WHERE id = project_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3) RLS 활성화
-- ─────────────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;

-- projects: 소유자(크리에이터)만 원본 테이블 전체 접근. 리뷰어 쪽은
-- projects_public 뷰(아래)로만 읽는다 — 원본 테이블엔 리뷰어용 정책이 없음.
CREATE POLICY "projects_owner_all" ON projects FOR ALL
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- review_questions: 프로젝트 소유자 또는 그 프로젝트에 매칭된 리뷰어만 조회.
-- (문항 텍스트엔 개인정보가 없어 컬럼 제한 없이 행 단위 정책으로 충분)
CREATE POLICY "review_questions_select" ON review_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = review_questions.project_id AND p.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_matches m WHERE m.project_id = review_questions.project_id AND m.reviewer_id = auth.uid())
  );
CREATE POLICY "review_questions_insert_owner" ON review_questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = review_questions.project_id AND p.creator_id = auth.uid()));

-- review_answers: 리뷰어는 자기 답변만 넣고 자기 답변만 본다. 크리에이터/타
-- 리뷰어에게는 정책 자체가 없음 — 집계된 리포트(ai_reports)로만 결과를 접함.
-- (리포트 생성은 서비스 롤로 실행되는 서버 로직이 전체 답변을 읽어 집계함)
CREATE POLICY "review_answers_own" ON review_answers FOR ALL
  USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

-- project_matches: 리뷰어는 자기 매칭 row만 원본 테이블에서 접근.
-- 크리에이터는 project_matches_for_creator 뷰(아래)로만 조회 — 원본엔
-- reviewer_id/이메일이 그대로 있어 크리에이터용 정책을 따로 만들지 않는다.
CREATE POLICY "project_matches_reviewer_own" ON project_matches FOR ALL
  USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

-- reviewer_profiles: 계좌 정보 등 금융 PII 포함 — 본인만.
CREATE POLICY "reviewer_profiles_own" ON reviewer_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- credit_transactions: 본인 내역만 조회 (쓰기는 서버/관리자 로직에서만).
CREATE POLICY "credit_transactions_own_select" ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ai_reports: 해당 프로젝트의 크리에이터만 조회. 생성/저장은 서비스 롤로만
-- (일반 사용자 INSERT/UPDATE 정책 없음 — 리뷰 집계는 여러 리뷰어의 답변을
-- 넘나들어야 해서 개별 세션 권한으로는 애초에 불가능해야 함).
CREATE POLICY "ai_reports_owner_select" ON ai_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = ai_reports.project_id AND p.creator_id = auth.uid()));

-- distributions: 본인(리뷰어) 정산 내역만.
CREATE POLICY "distributions_own_select" ON distributions FOR SELECT
  USING (auth.uid() = reviewer_id);

-- question_templates: 민감정보 없는 공개 카탈로그 — 로그인 유저 전체 조회 허용.
CREATE POLICY "question_templates_select_all" ON question_templates FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 4) 컬럼 제한 뷰 — 교차 조회는 반드시 이 뷰들을 통해서만
-- ─────────────────────────────────────────────────────────────

-- 리뷰어가 보는 프로젝트 정보 — creator_id 제외.
-- (테이블 소유자 권한으로 실행되어 기본적으로 RLS를 우회하므로, 활성 여부
--  필터링은 호출 측 쿼리에서 계속 담당한다 — 이미 각 화면이 그렇게 되어 있음)
CREATE OR REPLACE VIEW projects_public AS
SELECT
  id, title, one_liner, categories, stage, project_type, psf_pmf_type, status,
  problem, solution, alternative_limit, target_age_range, target_jobs, landing_url,
  target_count, completed_count, deadline, incentive_exists, incentive_budget,
  distribution_method, creator_level, access_method, access_info, created_at
FROM projects;
-- 피드는 로그인 없이도 노출되는 화면이라 anon도 함께 부여 (뷰는 어차피
-- creator_id를 안 담고 있어 비로그인 노출 자체는 문제되지 않음)
GRANT SELECT ON projects_public TO authenticated, anon;

-- 크리에이터가 보는 매칭 리뷰어 정보 — reviewer_id/이메일/지원서 등 제외,
-- 그리고 auth.uid()로 본인 프로젝트의 매칭만 필터링(뷰 자체가 소유권 검사).
CREATE OR REPLACE VIEW project_matches_for_creator AS
SELECT
  pm.id, pm.project_id, pm.nickname, pm.status, pm.accepted_at, pm.submitted_at,
  pm.shipping_status, pm.shipping_address, pm.received_confirmed_at
FROM project_matches pm
JOIN projects p ON p.id = pm.project_id
WHERE p.creator_id = auth.uid();
GRANT SELECT ON project_matches_for_creator TO authenticated, anon;
