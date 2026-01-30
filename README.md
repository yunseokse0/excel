# 실시간 방송 리스트

Next.js 14 + Tailwind CSS + shadcn/ui + Supabase로 구축한 YouTube와 SOOP 실시간 방송 모음 서비스입니다.

## 🚀 주요 기능

- **실시간 랭킹 시스템**: Supabase Realtime을 활용한 실시간 BJ 랭킹 업데이트
- **멀티 플랫폼 지원**: YouTube, SOOP(아프리카), Panda TV 통합 플레이어
- **YouTube 자동 동기화**: YouTube Data API v3를 통한 라이브 방송 자동 감지
- **SOOP 자동 동기화**: 아프리카TV API를 통한 라이브 방송 자동 감지
- **라이브 방송 알림**: 새로운 라이브 방송 시작 시 브라우저 알림 및 토스트 표시
- **시청자 수 기반 자동 점수 계산**: 라이브 시간 × 시청자 수로 자동 점수 계산
- **관리자 페이지**: 인라인 편집으로 빠른 점수/순위 조정
- **블랙 & 골드 테마**: 고급스러운 다크 모드 UI
- **전역 상태 관리**: Zustand를 활용한 실시간 데이터 공유

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL + Realtime)
- **State Management**: Zustand
- **TypeScript**: Full type safety

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 🔧 환경 변수 설정

### 로컬 개발 환경

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase (선택사항 - 없으면 mock 데이터 사용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 서버 액션용 (관리자 기능)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube API (필수 - YouTube 방송 표시를 위해)
YOUTUBE_API_KEY=your_youtube_api_key
```

### Vercel 배포 환경

Vercel 대시보드에서 환경 변수를 설정하세요:

**필수:**
- `YOUTUBE_API_KEY` - YouTube 방송 표시를 위해 필수

**선택사항 (Supabase 사용 시):**
- `NEXT_PUBLIC_SUPABASE_URL` - 프론트엔드 Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 프론트엔드 Supabase Anon Key
- `SUPABASE_URL` - 서버 사이드 Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - 서버 사이드 Supabase Service Role Key

**환경 변수 확인:**
- 배포 후 `/api/env-status` 엔드포인트로 환경 변수 상태 확인 가능
- 개발 환경에서만 상세 정보 표시

자세한 배포 가이드는 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)를 참조하세요.

## 📊 Supabase 스키마 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행
3. RLS 정책이 자동으로 설정됩니다
4. `bjs` 테이블에 YouTube BJ를 추가할 때 `youtube_channel_id` 필드를 설정하거나, `channel_url`에 YouTube 채널 URL을 입력하면 자동으로 추출됩니다

## 🎬 플랫폼 API 연동

### YouTube Data API v3

#### 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리"에서 "YouTube Data API v3" 활성화
4. "사용자 인증 정보" → "사용자 인증 정보 만들기" → "API 키" 선택
5. 생성된 API 키를 `.env.local`의 `YOUTUBE_API_KEY`에 설정

#### YouTube BJ 추가 방법
```sql
-- 방법 1: youtube_channel_id 직접 설정
INSERT INTO bjs (name, platform, youtube_channel_id, channel_url)
VALUES ('엑셀황제', 'youtube', 'UC...', 'https://www.youtube.com/@excelking');

-- 방법 2: channel_url만 설정 (자동 추출)
INSERT INTO bjs (name, platform, channel_url)
VALUES ('엑셀황제', 'youtube', 'https://www.youtube.com/@excelking');
```

### SOOP(아프리카TV) API

SOOP는 비공식 API 엔드포인트를 사용합니다. 별도의 API 키가 필요하지 않습니다.

#### SOOP BJ 추가 방법
```sql
-- 방법 1: soop_bj_id 직접 설정
INSERT INTO bjs (name, platform, soop_bj_id, channel_url)
VALUES ('골드여신', 'soop', 'bjid123', 'https://bj.afreecatv.com/bjid123');

-- 방법 2: channel_url만 설정 (자동 추출)
INSERT INTO bjs (name, platform, channel_url)
VALUES ('골드여신', 'soop', 'https://bj.afreecatv.com/bjid123');
```

### 자동 동기화 설정

**Vercel Cron (자동, 5분마다 실행)**
- `vercel.json`에 설정되어 있습니다
- Vercel에 배포하면 자동으로 5분마다 다음 엔드포인트가 호출됩니다:
  - `/api/sync-youtube` - YouTube 라이브 동기화
  - `/api/sync-soop` - SOOP 라이브 동기화
  - `/api/calculate-scores` - 시청자 수 기반 점수 계산

**수동 동기화**
- 관리자 페이지(`/admin/ranking`)에서 "YouTube 라이브 동기화" 또는 "SOOP 라이브 동기화" 버튼 클릭

## 🔔 라이브 방송 알림 기능

브라우저에서 새로운 라이브 방송이 시작되면 자동으로 알림을 받습니다.

### 알림 종류
1. **토스트 알림**: 화면 상단에 토스트 메시지 표시
2. **브라우저 알림**: 브라우저 알림 권한이 있으면 데스크톱 알림 표시

### 알림 설정
- 첫 방문 시 브라우저가 알림 권한을 요청합니다
- "허용"을 선택하면 라이브 방송 시작 시 알림을 받을 수 있습니다
- 같은 BJ의 중복 알림은 1시간 동안 방지됩니다

## 📊 시청자 수 기반 자동 점수 계산

라이브 방송 시간과 시청자 수를 기반으로 자동으로 점수를 계산합니다.

### 계산 공식
```
점수 증가량 = 방송 시간(분) × 시청자 수 × 가중치(0.1)
예: 5분 × 1000명 × 0.1 = 500점
```

### 동작 방식
1. Vercel Cron이 5분마다 `/api/calculate-scores` 호출
2. 현재 라이브 중인 모든 방송의 시청자 수 확인
3. 각 방송의 점수 증가량 계산 및 `bj_stats` 테이블 업데이트
4. 랭킹 자동 재계산

### 가중치 조정
`supabase-schema.sql`의 `calculate_score_from_viewers()` 함수에서 가중치를 조정할 수 있습니다:
```sql
-- 가중치 변경 예시 (0.1 → 0.2로 변경)
score_increment := minutes_diff * stream_record.viewer_count * 0.2;
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 메인 페이지
│   ├── ranking/           # 랭킹 페이지
│   ├── live/              # 라이브 목록 페이지
│   └── admin/             # 관리자 페이지
├── components/            # React 컴포넌트
│   ├── admin/             # 관리자 전용 컴포넌트
│   └── ui/                # 공용 UI 컴포넌트
├── hooks/                 # Custom React Hooks
├── lib/                   # 유틸리티 및 서버 액션
├── store/                 # Zustand 전역 상태
├── types/                 # TypeScript 타입 정의
└── data/                  # Mock 데이터
```

## 🎯 주요 페이지

- **메인 페이지 (`/`)**: Hero 캐러셀, 라이브 그리드, 미니 랭킹 보드
- **랭킹 페이지 (`/ranking`)**: 실시간 랭킹 테이블 + TOP 3 Podium
- **라이브 목록 (`/live`)**: 전체 라이브 스트림 목록
- **관리자 페이지 (`/admin/ranking`)**: BJ 점수/순위 인라인 편집

## 🔐 보안

- Supabase RLS(Row Level Security) 정책 적용
- 서비스 키는 서버 사이드에서만 사용
- 클라이언트는 anon key만 사용하여 읽기 전용 접근

## 📝 라이선스

MIT
