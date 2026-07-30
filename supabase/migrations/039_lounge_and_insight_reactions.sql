-- 라운지 글쓰기가 세션 로컬 state에만 남고 새로고침하면 사라졌고,
-- 인사이트 페이지의 좋아요/스크랩/댓글/공유는 전부 장식용 UI로 실제 동작이
-- 없었다 — 둘 다 진짜 백엔드를 붙인다.

create table if not exists lounge_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  author_nickname text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists lounge_likes (
  post_id uuid not null references lounge_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists lounge_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references lounge_posts(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  author_nickname text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists insight_likes (
  insight_id uuid not null references insight_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (insight_id, user_id)
);

create table if not exists insight_scraps (
  insight_id uuid not null references insight_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (insight_id, user_id)
);

create table if not exists insight_comments (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references insight_posts(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  author_nickname text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table lounge_posts enable row level security;
alter table lounge_likes enable row level security;
alter table lounge_comments enable row level security;
alter table insight_likes enable row level security;
alter table insight_scraps enable row level security;
alter table insight_comments enable row level security;

-- 글/댓글: 로그인한 누구나 읽을 수 있고, 본인 글만 쓰기/삭제
create policy lounge_posts_select on lounge_posts for select using (true);
create policy lounge_posts_insert on lounge_posts for insert with check (auth.uid() = author_id);
create policy lounge_posts_delete on lounge_posts for delete using (auth.uid() = author_id);

create policy lounge_comments_select on lounge_comments for select using (true);
create policy lounge_comments_insert on lounge_comments for insert with check (auth.uid() = author_id);
create policy lounge_comments_delete on lounge_comments for delete using (auth.uid() = author_id);

-- 좋아요/스크랩: 본인 것만 넣고 빼되, 카운트 집계를 위해 전체 조회는 허용
create policy lounge_likes_select on lounge_likes for select using (true);
create policy lounge_likes_insert on lounge_likes for insert with check (auth.uid() = user_id);
create policy lounge_likes_delete on lounge_likes for delete using (auth.uid() = user_id);

create policy insight_likes_select on insight_likes for select using (true);
create policy insight_likes_insert on insight_likes for insert with check (auth.uid() = user_id);
create policy insight_likes_delete on insight_likes for delete using (auth.uid() = user_id);

create policy insight_scraps_select on insight_scraps for select using (auth.uid() = user_id);
create policy insight_scraps_insert on insight_scraps for insert with check (auth.uid() = user_id);
create policy insight_scraps_delete on insight_scraps for delete using (auth.uid() = user_id);

create policy insight_comments_select on insight_comments for select using (true);
create policy insight_comments_insert on insight_comments for insert with check (auth.uid() = author_id);
create policy insight_comments_delete on insight_comments for delete using (auth.uid() = author_id);

grant select, insert, delete on lounge_posts, lounge_likes, lounge_comments,
  insight_likes, insight_scraps, insight_comments to authenticated;
grant select on lounge_posts, lounge_likes, lounge_comments, insight_likes, insight_comments to anon;
