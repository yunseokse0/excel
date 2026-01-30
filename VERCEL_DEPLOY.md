# Vercel 배포 가이드

## ✅ 배포 준비 상태

### 빌드 테스트
- ✅ TypeScript 컴파일 성공
- ✅ 모든 페이지 생성 완료
- ✅ 동적 라우트 정상 작동

### 필수 환경 변수 (Vercel 대시보드에서 설정)

#### 🔴 필수 (YouTube API 사용)
```
YOUTUBE_API_KEY=your_youtube_api_key
```
- YouTube 라이브 방송을 표시하려면 필수입니다
- 없으면 YouTube 방송이 표시되지 않습니다
- [YouTube API 키 발급 방법](./SETUP_YOUTUBE_API.md)

#### 🟡 선택사항 (Supabase 사용 시)
프론트엔드에서 Supabase를 사용하려면:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

서버 사이드 관리자 기능을 사용하려면:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**참고:**
- `NEXT_PUBLIC_` 접두사가 있는 변수는 프론트엔드에서 접근 가능합니다
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요 (보안 위험)
- Supabase 환경 변수가 없어도 프론트엔드에서 Mock 데이터로 작동합니다

## 🚀 배포 단계

### 1. GitHub에 푸시
```bash
git add .
git commit -m "Vercel 배포 준비 완료"
git push origin main
```

### 2. Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 선택 (`yunseokse0/excel`)
4. 프레임워크 자동 감지 (Next.js)

### 3. 환경 변수 설정 (중요!)
Vercel 프로젝트 설정에서 "Environment Variables" 탭으로 이동:

**필수 환경 변수:**
- `YOUTUBE_API_KEY` = `your_youtube_api_key`

**선택사항 (Supabase 사용 시):**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your_anon_key`
- `SUPABASE_URL` = `https://your-project.supabase.co` (서버 사이드용)
- `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key` (서버 사이드용)

**환경 변수 적용 범위:**
- Production, Preview, Development 모두 선택 권장
- 또는 Production만 선택해도 됩니다

### 4. 배포 시작
- "Deploy" 버튼 클릭
- 빌드 완료까지 대기 (약 2-3분)

### 5. 배포 후 확인
1. 배포된 URL로 접속 (예: `https://excel.vercel.app`)
2. 브라우저 콘솔에서 환경 변수 상태 확인:
   - 개발 모드에서 상세 정보 표시
   - Supabase 연결 상태 확인
3. 메인 페이지에서 라이브 방송 목록 확인
4. 랭킹 페이지에서 실시간 랭킹 확인

### 6. Cron 작업 확인
- `vercel.json`에 설정된 Cron 작업이 자동으로 활성화됩니다:
  - `/api/sync-youtube` - 5분마다 실행
  - `/api/sync-soop` - 5분마다 실행
  - `/api/calculate-scores` - 5분마다 실행

**참고:** Vercel Pro 플랜 이상에서만 Cron 작업이 작동합니다. 무료 플랜에서는 수동으로 API 엔드포인트를 호출해야 합니다.

## 📋 주요 변경 사항

### 랭킹 시스템
- ✅ 실시간 시청자수 기반 랭킹으로 변경
- ✅ 30초마다 자동 갱신
- ✅ YouTube와 SOOP 플랫폼만 지원 (Panda TV 제거)

### 타입 변경
- `RankingEntry.points` → `RankingEntry.viewerCount`
- `Platform` 타입: `"youtube" | "soop"` (panda 제거)

### UI 변경
- 모든 랭킹 표시가 시청자수로 통일
- "후원 TOP 5" → "실시간 시청자 TOP 5"
- 헤더의 1위 표시도 시청자수로 변경

## ⚠️ 주의사항

### 환경 변수 설정
1. **YOUTUBE_API_KEY 필수**
   - 없으면 YouTube 방송이 표시되지 않습니다
   - Vercel 대시보드에서 반드시 설정하세요

2. **Supabase 선택사항**
   - Supabase 환경 변수가 없어도 프론트엔드 기반 모드로 작동합니다
   - 관리자 기능(`/admin/ranking`)은 Supabase가 필요합니다
   - 실시간 랭킹 업데이트는 Supabase Realtime이 필요합니다

3. **환경 변수 보안**
   - `NEXT_PUBLIC_` 접두사가 있는 변수는 프론트엔드에 노출됩니다
   - `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요
   - 서버 사이드 전용 키는 클라이언트에 노출되면 안 됩니다

### Cron 작업
- Vercel Pro 플랜 이상에서만 Cron 작업이 작동합니다
- 무료 플랜에서는 수동으로 API 엔드포인트를 호출해야 합니다:
  ```bash
  curl https://your-app.vercel.app/api/sync-youtube
  curl https://your-app.vercel.app/api/sync-soop
  curl https://your-app.vercel.app/api/calculate-scores
  ```

### 빌드 오류 해결
- 환경 변수가 설정되지 않아도 빌드는 성공합니다
- 런타임에서 Mock 데이터를 사용합니다
- 브라우저 콘솔에서 경고 메시지를 확인하세요

## 🔍 배포 후 확인 사항

### 1. 메인 페이지 (`/`)
- 라이브 방송 목록이 표시되는지 확인
- YouTube와 SOOP 방송이 모두 표시되는지 확인
- 브라우저 콘솔에서 에러가 없는지 확인

### 2. 랭킹 페이지 (`/ranking`)
- 시청자수 기준 랭킹이 표시되는지 확인
- 실시간 업데이트가 작동하는지 확인 (30초마다)

### 3. API 엔드포인트 테스트
```bash
# 라이브 목록 확인
curl https://your-app.vercel.app/api/live-list

# YouTube 동기화 (수동)
curl https://your-app.vercel.app/api/sync-youtube

# SOOP 동기화 (수동)
curl https://your-app.vercel.app/api/sync-soop
```

### 4. 관리자 페이지 (`/admin/ranking`)
- Supabase를 설정한 경우에만 접근 가능
- 시청자수 랭킹 표시 확인
- 인라인 편집 기능 확인

### 5. 환경 변수 확인
브라우저 콘솔에서 다음 메시지 확인:
- `[Supabase] 환경 변수가 설정되지 않았습니다` - Supabase 미설정 (정상)
- `[Supabase] 클라이언트 생성 실패` - Supabase 설정 오류

## 🐛 문제 해결

### YouTube 방송이 표시되지 않음
1. Vercel 대시보드에서 `YOUTUBE_API_KEY` 설정 확인
2. YouTube API 할당량 초과 여부 확인 (24시간 후 자동 재시도)
3. 브라우저 콘솔에서 `[YouTube]` 로그 확인

### Supabase 연결 실패
1. `NEXT_PUBLIC_SUPABASE_URL` 형식 확인 (`https://xxx.supabase.co`)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값 확인
3. Supabase 프로젝트의 RLS 정책 확인

### 빌드 실패
1. TypeScript 오류 확인
2. 환경 변수 이름 오타 확인
3. Vercel 빌드 로그에서 상세 오류 확인
