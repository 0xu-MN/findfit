-- 012: PSF 고정 문항 매칭을 문구 텍스트 대신 안정적인 키로 (M-1)
--
-- lib/ai/generateReport.ts가 지금까지 PSF_STANDARD_QUESTIONS의 정확한 문구를
-- question_text로 매칭해서 서브스코어를 계산했다. 나중에 누군가 그 문구를
-- 1글자만 고쳐도 매칭이 조용히 깨지고 서브스코어가 전부 null이 된다.
-- question_key에 고정 문항의 안정적인 id('psf-1'/'psf-3'/'sean-ellis' 등)를
-- 저장해두고 이걸로 매칭하도록 전환. 기존 row는 NULL로 남고, 텍스트 매칭을
-- fallback으로 유지해 하위호환한다.
ALTER TABLE review_questions ADD COLUMN IF NOT EXISTS question_key TEXT;
