# Excel Live Arena - 실시간 엑셀방송 팬페이지

Next.js 14 + Tailwind CSS + shadcn/ui + Supabase로 구축한 실시간 엑셀방송 BJ 랭킹 및 라이브 스트리밍 팬페이지입니다.

## 🚀 주요 기능

- **실시간 랭킹 시스템**: Supabase Realtime을 활용한 실시간 BJ 랭킹 업데이트
- **멀티 플랫폼 지원**: YouTube, SOOP(아프리카), Panda TV 통합 플레이어
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

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase (선택사항 - 없으면 mock 데이터 사용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 서버 액션용 (관리자 기능)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube API (선택사항)
YOUTUBE_API_KEY=your_youtube_api_key
```

## 📊 Supabase 스키마 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행
3. RLS 정책이 자동으로 설정됩니다

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
