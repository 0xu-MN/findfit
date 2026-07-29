-- 관리자 패널에서 유저가 "지금 어떤 모드(크리에이터/리뷰어)로 로그인해서
-- 쓰고 있는지"를 보여달라는 요청 — users.role은 가입 시 한 번 고정되는
-- 값이라 지금 쓰고 있는 화면과 무관하다. 실시간 모드를 별도로 기록한다.
alter table users add column if not exists last_active_role text
  check (last_active_role in ('builder', 'evaluator'));
