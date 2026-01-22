-- Supabase 스키마: 엑셀 방송 BJ, 라이브, 실시간 랭킹

-- 1) BJ 기본 정보 테이블
create table if not exists public.bjs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null check (platform in ('youtube', 'soop', 'panda')),
  thumbnail_url text,
  channel_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 2) 현재 라이브 상태/정보 테이블
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  bj_id uuid not null references public.bjs(id) on delete cascade,
  is_live boolean not null default false,
  stream_url text,
  viewer_count integer,
  started_at timestamptz,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists live_streams_bj_id_idx on public.live_streams(bj_id);
create index if not exists live_streams_is_live_idx on public.live_streams(is_live);

-- 3) BJ 실시간 랭킹 스냅샷 테이블
-- 관리자/백오피스에서 점수와 랭크를 갱신하면, 프론트는 이 테이블을 구독만 하면 됩니다.
create table if not exists public.bj_stats (
  bj_id uuid primary key references public.bjs(id) on delete cascade,
  current_score integer not null default 0,
  rank integer not null default 9999,
  diff_from_yesterday integer not null default 0,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists bj_stats_rank_idx on public.bj_stats(rank);

-- 4) 랭킹 조회용 뷰 (프론트에서 바로 select 하기 좋게 조인)
create or replace view public.live_ranking_view as
select
  s.rank,
  s.current_score,
  s.diff_from_yesterday,
  b.id as bj_id,
  b.name,
  b.platform,
  coalesce(b.thumbnail_url, '') as thumbnail_url,
  coalesce(b.channel_url, '') as channel_url
from public.bj_stats s
join public.bjs b on b.id = s.bj_id;

-- 5) RLS(행 수준 보안) 설정
alter table public.bjs enable row level security;
alter table public.live_streams enable row level security;
alter table public.bj_stats enable row level security;

-- 프론트(익명)에서 조회만 허용하고, 쓰기는 서비스 키/관리자만 하도록 분리
create policy if not exists "Allow read bjs for anon" on public.bjs
  for select
  to anon
  using (true);

create policy if not exists "Allow read live_streams for anon" on public.live_streams
  for select
  to anon
  using (true);

create policy if not exists "Allow read bj_stats for anon" on public.bj_stats
  for select
  to anon
  using (true);

-- 관리자(예: service_role, backend)용 정책: JWT의 role 클레임이 'admin' 인 경우에만 업데이트 허용
create policy if not exists "Allow admin update bj_stats" on public.bj_stats
  for update
  to authenticated
  using ( (auth.jwt() ->> 'role') = 'admin' )
  with check ( (auth.jwt() ->> 'role') = 'admin' );

-- 6) 점수 일괄 증가용 helper 함수 (bulk_increment_bj_scores)
create or replace function public.bulk_increment_bj_scores(p_delta integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.bj_stats
  set
    current_score = current_score + p_delta,
    updated_at = timezone('utc'::text, now());
end;
$$;


