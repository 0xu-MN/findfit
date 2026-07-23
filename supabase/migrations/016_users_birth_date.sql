-- 016: 만 19세 미만 가입 제한을 위한 생년월일 컬럼
--
-- 실제 법적 나이 인증(CI/PASS 등)은 별도 유료 본인인증 벤더 계약이 필요해서
-- 아직 못 붙였다 — 지금은 본인이 직접 입력하는 자진신고 방식으로 가입 시점에
-- 만 19세 미만이면 가입을 막는 최소한의 게이트만 건다.
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
