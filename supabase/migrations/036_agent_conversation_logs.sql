-- Agent 대화 이관: 등록 전 Agent와 나눈 대화를 프로젝트에 연결해두고,
-- 나중에 리포트 모드에서 같은 대화를 이어갈 수 있게 한다.
-- (기존 §21.2 "경량 이관(요약만 보관)" 결정을 이 기능 한정으로 확장 —
-- 사용자가 명시적으로 "등록 시 대화를 이어서 리포트까지" 요청함)
create table if not exists agent_conversation_logs (
  project_id uuid primary key references projects(id) on delete cascade,
  creator_id uuid not null references users(id) on delete cascade,
  messages jsonb not null,
  created_at timestamptz not null default now()
);

alter table agent_conversation_logs enable row level security;

create policy agent_conversation_logs_owner_all on agent_conversation_logs
  for all
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());
