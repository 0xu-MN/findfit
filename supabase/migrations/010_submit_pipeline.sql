-- 010: 리뷰 제출 파이프라인을 서버 트랜잭션 하나로 묶기 위한 지원 변경
--
-- 배경: 지금까지 increment_completed_count()는 RETURNS void라, 클라이언트가
-- "이번 제출로 완료율 도달했는지"를 판단하려면 브라우저가 들고 있던
-- (신뢰할 수 없는, 동시 제출 시 stale할 수 있는) project.completed_count 값에
-- +1 해서 추측하는 수밖에 없었다. RPC가 갱신 후의 실제 값을 반환하도록 바꿔서
-- app/api/reviews/[matchId]/submit 라우트가 그 값으로 정확히 판단하게 한다.
-- (반환 타입 자체가 바뀌므로 CREATE OR REPLACE로는 안 되고 DROP 후 재생성해야 함)
DROP FUNCTION IF EXISTS increment_completed_count(UUID);
CREATE FUNCTION increment_completed_count(project_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE projects
  SET completed_count = completed_count + 1
  WHERE id = project_id
  RETURNING completed_count;
$$;
