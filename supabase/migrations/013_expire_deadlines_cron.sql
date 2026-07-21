-- 013: expire-deadlines Edge Function을 매일 자정에 자동 호출
--
-- expire-deadlines 함수는 `--no-verify-jwt`로 배포되어 있어(게이트웨이 단에서
-- JWT 검증을 안 함) 이 호출 자체엔 별도 인증 토큰이 필요 없다 — 그래서 여기에
-- service_role 키 같은 비밀값을 커밋할 필요가 없다. 함수 내부에서는 자체
-- 환경변수(SUPABASE_SERVICE_ROLE_KEY)로 DB에 접근한다.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'expire-deadlines-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://osdgtfghubeejevxcgoj.supabase.co/functions/v1/expire-deadlines',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
