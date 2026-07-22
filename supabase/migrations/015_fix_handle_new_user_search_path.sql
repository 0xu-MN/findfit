-- 015: 회원가입이 전부 "Database error saving new user"로 실패하던 버그 수정
--
-- handle_new_user()는 SECURITY DEFINER인데 search_path를 고정해두지 않았다.
-- Postgres는 SECURITY DEFINER 함수 안의 "search_path"는 함수 정의자가 아니라
-- "호출자"의 세션 search_path를 그대로 물려받는다 — 그런데 auth.users에
-- INSERT를 실행하는 실제 역할인 supabase_auth_admin의 search_path가
-- `auth` 하나로 고정되어 있다(자체 조회 결과 확인).
--
-- 그 결과 트리거 안의 "INSERT INTO users (id, email) ..."가 의도한
-- public.users가 아니라 auth.users 자기 자신으로 해석돼서, 방금 GoTrue가
-- 막 insert한 것과 똑같은 id로 auth.users에 또 insert를 시도 → auth.users
-- 자신의 users_pkey 유니크 제약을 위반 → 트랜잭션 전체 롤백. (그래서
-- public.users/auth.users 둘 다 계속 0건으로 보였던 것 — 실패해서 아무것도
-- 안 남은 것뿐, 인덱스 손상이 아니었음)
--
-- 고정: search_path를 public으로 명시 + INSERT 대상도 스키마 한정.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
