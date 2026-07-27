-- 크리에이터 홈 / 리뷰어 대시보드 히어로 배너 — 지금까지 컴포넌트 안에
-- 하드코딩된 배열이었던 것을 관리자가 직접 작성·교체할 수 있게 테이블화.
create table ad_banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('creator_home', 'reviewer_dashboard')),
  title text not null,
  subtitle text,
  badge text,
  bg_gradient text not null default 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1A237E 100%)',
  image_url text,
  button_text text,
  button_link text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table ad_banners enable row level security;

-- 공개 노출용 — active인 배너만 누구나 읽을 수 있음(관리자 CRUD는 서비스 롤 전용)
create policy "ad_banners_public_read"
  on ad_banners for select
  using (active = true);
