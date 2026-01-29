-- Supabase 스키마: 엑셀 방송 BJ, 라이브, 실시간 랭킹

-- 1) BJ 기본 정보 테이블
create table if not exists public.bjs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null check (platform in ('youtube', 'soop', 'panda')),
  thumbnail_url text,
  channel_url text,
  -- YouTube API 연동용 필드
  youtube_channel_id text, -- YouTube 채널 ID (예: UC... 또는 @username)
  -- SOOP(아프리카TV) API 연동용 필드
  soop_bj_id text, -- 아프리카TV BJ ID
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- YouTube 채널 ID 인덱스 추가 (조회 성능 향상)
create index if not exists bjs_youtube_channel_id_idx on public.bjs(youtube_channel_id) where platform = 'youtube';
-- SOOP BJ ID 인덱스 추가
create index if not exists bjs_soop_bj_id_idx on public.bjs(soop_bj_id) where platform = 'soop';

-- 2) 현재 라이브 상태/정보 테이블
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  bj_id uuid not null references public.bjs(id) on delete cascade,
  is_live boolean not null default false,
  stream_url text,
  viewer_count integer,
  started_at timestamptz,
  -- 시청자 수 기반 자동 점수 계산용
  last_viewer_count integer, -- 마지막으로 기록된 시청자 수
  accumulated_minutes integer default 0, -- 누적 방송 시간 (분)
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

-- 서비스 키(service_role)는 RLS를 우회하므로, 서버 액션에서는 문제없이 bjs 테이블에 insert/delete 가능
-- 하지만 클라이언트에서 직접 접근하는 경우를 대비해 정책 추가 (선택사항)
-- 실제로는 서버 액션만 사용하므로 아래 정책은 필요 없을 수 있음

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

-- 7) 시청자 수 기반 자동 점수 계산 함수
-- 라이브 방송 시간(분) × 시청자 수 = 점수
create or replace function public.calculate_score_from_viewers()
returns void
language plpgsql
security definer
as $$
declare
  stream_record record;
  minutes_diff integer;
  score_increment integer;
begin
  -- 현재 라이브 중인 모든 방송에 대해 점수 계산
  for stream_record in
    select
      ls.bj_id,
      ls.viewer_count,
      ls.last_viewer_count,
      ls.started_at,
      ls.accumulated_minutes,
      coalesce(ls.viewer_count, 0) as current_viewers
    from public.live_streams ls
    where ls.is_live = true
      and ls.started_at is not null
  loop
    -- 마지막 업데이트 이후 경과 시간 계산 (분 단위)
    -- 실제로는 동기화 주기(5분)를 기준으로 계산
    minutes_diff := 5; -- 기본 동기화 주기
    
    -- 시청자 수가 있으면 평균 시청자 수로 계산
    if stream_record.viewer_count is not null and stream_record.viewer_count > 0 then
      -- 점수 증가량 = 경과 시간(분) × 시청자 수 × 가중치(0.1)
      -- 예: 5분 × 1000명 × 0.1 = 500점
      score_increment := minutes_diff * stream_record.viewer_count * 0.1;
      
      -- bj_stats 업데이트
      update public.bj_stats
      set
        current_score = current_score + score_increment::integer,
        updated_at = timezone('utc'::text, now())
      where bj_id = stream_record.bj_id;
      
      -- live_streams의 누적 시간 업데이트
      update public.live_streams
      set
        accumulated_minutes = accumulated_minutes + minutes_diff,
        last_viewer_count = stream_record.viewer_count,
        updated_at = timezone('utc'::text, now())
      where bj_id = stream_record.bj_id;
    end if;
  end loop;
  
  -- 랭킹 재계산
  update public.bj_stats
  set rank = subq.new_rank
  from (
    select
      bj_id,
      row_number() over (order by current_score desc) as new_rank
    from public.bj_stats
  ) as subq
  where public.bj_stats.bj_id = subq.bj_id;
end;
$$;

-- 8) 광고 관리 테이블
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('top_banner', 'popup', 'bottom_banner')),
  title text,
  image_url text not null,
  link_url text,
  is_active boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  display_order integer not null default 0,
  click_count integer not null default 0,
  impression_count integer not null default 0, -- 노출 수
  -- A/B 테스트용
  ab_test_group text, -- A/B 테스트 그룹 ID (같은 그룹의 광고들은 함께 테스트)
  ab_test_variant text, -- 'A' 또는 'B'
  ab_test_weight integer default 50, -- 가중치 (0-100, 기본 50%)
  -- 타겟팅용
  target_pages text[], -- 표시할 페이지 경로 배열 (예: ['/', '/ranking'])
  target_user_groups text[], -- 타겟 사용자 그룹 (예: ['new', 'returning'])
  -- 스케줄링용
  schedule_days integer[], -- 요일 배열 (0=일요일, 1=월요일, ..., 6=토요일)
  schedule_start_time time, -- 시작 시간 (예: '09:00:00')
  schedule_end_time time, -- 종료 시간 (예: '18:00:00')
  timezone text default 'Asia/Seoul', -- 타임존
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ads_type_idx on public.ads(type);
create index if not exists ads_active_idx on public.ads(is_active);
create index if not exists ads_dates_idx on public.ads(start_date, end_date);

-- 광고 RLS 설정
alter table public.ads enable row level security;

create policy if not exists "Allow read ads for anon" on public.ads
  for select
  to anon
  using (
    is_active = true
    and (start_date is null or start_date <= timezone('utc'::text, now()))
    and (end_date is null or end_date >= timezone('utc'::text, now()))
  );

-- 광고 클릭 수 증가 함수
create or replace function public.increment_ad_click(p_ad_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.ads
  set click_count = click_count + 1
  where id = p_ad_id;
end;
$$;

-- 광고 노출 수 증가 함수
create or replace function public.increment_ad_impression(p_ad_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.ads
  set impression_count = impression_count + 1
  where id = p_ad_id;
end;
$$;

-- 9) 광고 통계 로그 테이블 (상세 통계용)
create table if not exists public.ad_stats_logs (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  page_path text,
  user_agent text,
  ip_address text,
  session_id text, -- 사용자 세션 ID
  user_group text, -- 사용자 그룹 (new, returning, vip 등)
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 11) 사용자 세션 테이블
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_group text default 'new', -- new, returning, vip 등
  first_visit_at timestamptz not null default timezone('utc'::text, now()),
  last_visit_at timestamptz not null default timezone('utc'::text, now()),
  visit_count integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists user_sessions_session_id_idx on public.user_sessions(session_id);
create index if not exists user_sessions_user_group_idx on public.user_sessions(user_group);

-- 사용자 세션 RLS
alter table public.user_sessions enable row level security;

create policy if not exists "Allow read user_sessions for anon" on public.user_sessions
  for select
  to anon
  using (true);

create policy if not exists "Allow insert user_sessions for anon" on public.user_sessions
  for insert
  to anon
  with check (true);

create policy if not exists "Allow update user_sessions for anon" on public.user_sessions
  for update
  to anon
  using (true);

create index if not exists ad_stats_logs_ad_id_idx on public.ad_stats_logs(ad_id);
create index if not exists ad_stats_logs_created_at_idx on public.ad_stats_logs(created_at);
create index if not exists ad_stats_logs_event_type_idx on public.ad_stats_logs(event_type);

-- 광고 통계 로그 RLS
alter table public.ad_stats_logs enable row level security;

create policy if not exists "Allow insert ad_stats_logs for anon" on public.ad_stats_logs
  for insert
  to anon
  with check (true);

-- 10) Supabase Storage 버킷 생성 (광고 이미지용)
-- Supabase Dashboard에서 Storage > Create bucket으로 'ads' 버킷을 생성하거나,
-- 아래 SQL을 실행하세요 (Supabase CLI 사용 시)

-- insert into storage.buckets (id, name, public)
-- values ('ads', 'ads', true)
-- on conflict (id) do nothing;

-- Storage 정책 설정 (공개 읽기, 관리자만 쓰기)
-- create policy if not exists "Public read access" on storage.objects
--   for select
--   to public
--   using (bucket_id = 'ads');

-- create policy if not exists "Admin write access" on storage.objects
--   for insert
--   to authenticated
--   with check (bucket_id = 'ads' and (auth.jwt() ->> 'role') = 'admin');


