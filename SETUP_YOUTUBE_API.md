# YouTube API 키 설정 방법

## 1. YouTube API 키 발급

1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"로 이동
4. "YouTube Data API v3" 검색 후 활성화
5. "사용자 인증 정보" > "사용자 인증 정보 만들기" > "API 키" 선택
6. 생성된 API 키 복사

## 2. .env.local 파일에 추가

프로젝트 루트의 `.env.local` 파일을 열고 다음을 추가:

```bash
# YouTube API 설정 (필수)
YOUTUBE_API_KEY=여기에_실제_API_키_붙여넣기
```

**중요:**
- 주석(`#`) 없이 직접 키 값을 입력
- 따옴표(`"` 또는 `'`) 사용하지 않음
- 등호(`=`) 앞뒤 공백 없음
- 예: `YOUTUBE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 3. 개발 서버 재시작

환경 변수는 서버 시작 시 로드되므로 **반드시 재시작**해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

## 4. 확인 방법

브라우저 콘솔에서 다음을 확인:
- `[Client] 🔍 Debug Info: { hasYoutubeKey: true, ... }` - 키가 설정됨
- `[Client] ❌ YOUTUBE_API_KEY is not set` - 키가 없음

서버 로그에서 확인:
- `[LiveList] Environment check: YOUTUBE_API_KEY: ✅ Set` - 키가 설정됨
- `[YouTube] ✅ API key found` - 키 확인됨

## 5. 문제 해결

### API 키가 설정되어도 데이터가 안 나올 때:
1. 서버 로그 확인 (`[YouTube]`로 시작하는 메시지)
2. API 할당량 확인 (Google Cloud Console)
3. API가 활성화되어 있는지 확인
4. 실제로 라이브 방송이 있는지 확인

### API 키 에러가 나올 때:
- `403 Forbidden`: API 키가 유효하지 않거나 할당량 초과
- `401 Unauthorized`: API 키 형식이 잘못됨
- 서버 로그의 상세 에러 메시지 확인
