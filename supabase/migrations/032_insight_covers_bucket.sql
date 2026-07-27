-- 인사이트 관리자 에디터의 커버 이미지 파일 업로드용 공개 스토리지 버킷.
-- 이 버킷은 이미 Supabase Storage API(supabase.storage.createBucket)로
-- 직접 생성 완료된 상태다(public: true) — public 버킷은 anon SELECT가
-- RLS 없이도 허용되므로 별도 정책이 필요 없다. 이 파일은 기록용이며,
-- 새 환경에 처음 배포할 때 버킷이 없다면 아래로 재생성할 수 있다.
insert into storage.buckets (id, name, public)
values ('insight-covers', 'insight-covers', true)
on conflict (id) do nothing;
