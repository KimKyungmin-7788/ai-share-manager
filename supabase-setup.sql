-- AI 공유계정 관리 시스템 - Supabase 초기 설정 SQL
-- Supabase Dashboard > SQL Editor 에서 실행하세요

-- 1. programs 테이블
create table if not exists programs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- 2. sessions 테이블
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references programs(id) on delete cascade not null,
  user_name text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'active' not null
    check (status in ('active', 'reserved', 'completed', 'cancelled')),
  created_at timestamptz default now() not null
);

-- 3. 인덱스 (성능 최적화)
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_sessions_program_id on sessions(program_id);
create index if not exists idx_sessions_end_time on sessions(end_time);
create index if not exists idx_sessions_start_time on sessions(start_time);

-- 4. Row Level Security 활성화
alter table programs enable row level security;
alter table sessions enable row level security;

-- 5. 공개 읽기/쓰기 정책 (인증 없이 사용)
create policy "programs_public_read" on programs for select using (true);
create policy "programs_public_insert" on programs for insert with check (true);
create policy "programs_public_update" on programs for update using (true);
create policy "programs_public_delete" on programs for delete using (true);

create policy "sessions_public_read" on sessions for select using (true);
create policy "sessions_public_insert" on sessions for insert with check (true);
create policy "sessions_public_update" on sessions for update using (true);
create policy "sessions_public_delete" on sessions for delete using (true);

-- 6. Realtime 활성화
alter publication supabase_realtime add table programs;
alter publication supabase_realtime add table sessions;

-- 7. 샘플 데이터 (선택사항)
-- insert into programs (name, description) values
--   ('ChatGPT Plus', 'OpenAI ChatGPT 유료 계정'),
--   ('Claude Pro', 'Anthropic Claude 유료 계정'),
--   ('Midjourney', 'AI 이미지 생성 서비스');
