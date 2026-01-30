# Vercel 배포 가이드

## ✅ 배포 준비 상태

### 빌드 테스트
- ✅ TypeScript 컴파일 성공
- ✅ 모든 페이지 생성 완료
- ✅ 동적 라우트 정상 작동

### 필수 환경 변수 (Vercel 대시보드에서 설정)

#### 필수 (프론트엔드 기반 모드)
```
YOUTUBE_API_KEY=your_youtube_api_key
```

#### 선택사항 (Supabase 사용 시)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 배포 단계

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "랭킹을 실시간 시청자수 기반으로 변경, YouTube/SOOP만 지원"
   git push origin main
   ```

2. **Vercel에 배포**
   - Vercel 대시보드에서 GitHub 저장소 연결
   - 환경 변수 설정 (위의 필수 환경 변수)
   - 배포 시작

3. **Cron 작업 확인**
   - `vercel.json`에 설정된 Cron 작업이 자동으로 활성화됩니다:
     - `/api/sync-youtube` - 5분마다
     - `/api/sync-soop` - 5분마다
     - `/api/calculate-scores` - 5분마다

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

1. **환경 변수 설정 필수**
   - `YOUTUBE_API_KEY`는 필수입니다
   - 없으면 YouTube 방송이 표시되지 않습니다

2. **Supabase 선택사항**
   - Supabase 환경 변수가 없어도 프론트엔드 기반 모드로 작동합니다
   - 관리자 기능은 Supabase가 필요합니다

3. **Cron 작업**
   - Vercel Pro 플랜 이상에서만 Cron 작업이 작동합니다
   - 무료 플랜에서는 수동으로 API 엔드포인트를 호출해야 합니다

## 🔍 배포 후 확인 사항

1. 메인 페이지 (`/`) - 라이브 방송 목록 표시 확인
2. 랭킹 페이지 (`/ranking`) - 시청자수 기준 랭킹 확인
3. API 엔드포인트 (`/api/live-list`) - 데이터 반환 확인
4. 관리자 페이지 (`/admin/ranking`) - 시청자수 랭킹 표시 확인
