# Vercel 배포 문제 해결 가이드

## 현재 상황
- Vercel Deployments 페이지에 "No Results" 표시
- GitHub와 Vercel 연동이 제대로 되지 않은 것으로 보임

## 해결 방법

### 방법 1: Vercel 대시보드에서 프로젝트 재연동 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **프로젝트 삭제 후 재생성**
   - Settings → General → Delete Project
   - "Add New Project" 클릭
   - GitHub 저장소 `yunseokse0/excel` 선택
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)

3. **환경 변수 재설정**
   - Settings → Environment Variables
   - 다음 변수 추가:
     - `YOUTUBE_API_KEY` (Production, Preview, Development 모두)
     - `NEXT_PUBLIC_SUPABASE_URL` (선택사항)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (선택사항)

4. **배포 시작**
   - "Deploy" 버튼 클릭

### 방법 2: Vercel CLI로 배포

```bash
# Vercel 로그인
npx vercel login

# 프로젝트 연결
npx vercel link

# 프로덕션 배포
npx vercel --prod
```

### 방법 3: GitHub Webhook 확인

1. GitHub 저장소 설정 확인
   - https://github.com/yunseokse0/excel/settings/hooks
   - Vercel webhook이 있는지 확인
   - 없으면 Vercel에서 재연동 필요

## 배포 후 확인

1. **배포 상태 확인**
   - Vercel 대시보드 → Deployments 탭
   - 빌드 로그 확인

2. **배포된 사이트 접속**
   - https://excel-nine-iota.vercel.app
   - 또는 Vercel에서 제공하는 URL

3. **기능 테스트**
   - 메인 페이지: 라이브 방송 목록
   - API 엔드포인트: `/api/live-list`

## 문제 해결

### 빌드 실패 시
- Vercel 대시보드 → Deployments → 실패한 배포 클릭
- Build Logs 확인
- 에러 메시지에 따라 수정

### 환경 변수 문제
- Settings → Environment Variables 확인
- 모든 환경(Production, Preview, Development)에 설정되어 있는지 확인
