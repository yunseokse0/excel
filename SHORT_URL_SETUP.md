# 짧은 URL 설정 가이드

## 방법 1: Vercel 프로젝트 이름 변경 (가장 간단)

현재 URL: `https://excel-nf7g87r57-yunseokseos-projects.vercel.app`

### 단계:
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (`excel`)
3. **Settings** → **General** 탭으로 이동
4. **Project Name** 섹션에서 이름 변경
   - 예: `live` → `https://live.vercel.app`
   - 예: `excel-live` → `https://excel-live.vercel.app`
   - 예: `live-list` → `https://live-list.vercel.app`
5. **Save** 클릭
6. 자동으로 새로운 URL로 배포됩니다

### 제한사항:
- 프로젝트 이름은 영문, 숫자, 하이픈(-)만 사용 가능
- 이미 사용 중인 이름은 사용 불가
- 최소 3자 이상 권장

## 방법 2: 커스텀 도메인 추가 (더 전문적)

### 단계:
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (`excel`)
3. **Settings** → **Domains** 탭으로 이동
4. **Add Domain** 클릭
5. 원하는 도메인 입력 (예: `live.example.com`)
6. DNS 설정 안내에 따라 도메인 제공업체에서 DNS 레코드 추가
7. Vercel이 자동으로 SSL 인증서 발급 및 설정

### 도메인 구매 필요:
- [Namecheap](https://www.namecheap.com/)
- [GoDaddy](https://www.godaddy.com/)
- [Cloudflare](https://www.cloudflare.com/)
- [Google Domains](https://domains.google/)

## 방법 3: Vercel CLI로 프로젝트 이름 확인/변경

```bash
# 현재 프로젝트 정보 확인
npx vercel inspect

# 프로젝트 이름은 Vercel 대시보드에서만 변경 가능
# CLI로는 직접 변경 불가
```

## 추천 설정

### 짧고 기억하기 쉬운 이름 예시:
- `live` → `https://live.vercel.app`
- `live-list` → `https://live-list.vercel.app`
- `excel-live` → `https://excel-live.vercel.app`
- `live-arena` → `https://live-arena.vercel.app`

### 현재 프로젝트 이름 확인:
```bash
npx vercel inspect
```

## 참고사항

- 프로젝트 이름 변경 후 기존 URL은 자동으로 새 URL로 리다이렉트됩니다
- 커스텀 도메인은 무료 플랜에서도 사용 가능합니다
- SSL 인증서는 Vercel이 자동으로 관리합니다
