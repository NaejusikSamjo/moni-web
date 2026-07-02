# moistock — 모니(moni) 프론트엔드

> 초보 투자자를 위한 AI 기반 모의 투자 플랫폼 프론트엔드  
> PWA 기반 모바일 전용 앱 (홈 화면 추가 방식)

---

## 팀원 구성

| 역할 | 이름 |
|----|----|
| -  | -  |

---

## 기술 스택

| 분류      | 내용                                                     |
|---------|--------------------------------------------------------|
| 프레임워크   | Next.js 16 App Router (Turbopack)                      |
| 런타임     | React 19                                               |
| 언어      | TypeScript 6                                           |
| 패키지 매니저 | Yarn 4.16.0 (Berry)                                    |
| 스타일     | CSS Modules                                            |
| 아이콘     | react-icons 5 (`/ri`)                                  |
| 폰트      | Noto Sans KR (Google Fonts)                            |
| 차트      | lightweight-charts 5                                   |
| 아키텍처    | FSD (Feature-Sliced Design)                            |
| PWA     | Web App Manifest + `viewport-fit=cover`                |
| 결제      | Toss Payments SDK 2 (`@tosspayments/tosspayments-sdk`) |

---

## 개발 환경

### 요구 사항

- Node.js 26.3.0+
- Yarn 4.16.0
- 백엔드 API Gateway (`:8080`) 실행 중

### 빠른 시작

```bash
yarn install
yarn dev        # http://localhost:3000 (PWA 가드 비활성화)
```

### 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080     # 백엔드 API Gateway
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.moni.my       # 프로필 이미지 CDN
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxx           # 토스페이먼츠 클라이언트 키
```

### 실기기 테스트 (iPhone/Android)

로컬 IP 접근 시 `next.config.ts`의 `allowedDevOrigins`에 IP 추가:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.x.x"],
};
```

소셜 로그인 테스트가 필요하면 ngrok 사용:

```bash
ngrok http 3000
# OAuth 제공자 콘솔 리다이렉트 URI에 https://xxxx.ngrok-free.app 추가
```

---

## 프로젝트 구조 (FSD)

```
src/
├── app/                              # Next.js App Router 페이지
│   ├── layout.tsx                    # 루트 레이아웃 (app-shell, PwaGuard, AuthProvider)
│   ├── page.tsx                      # 랜딩 페이지
│   ├── not-found.tsx                 # 404 페이지
│   ├── manifest.ts                   # PWA 매니페스트
│   ├── api/stock-logo/[code]/        # 종목 로고 프록시 API
│   ├── auth/
│   │   ├── login/                    # 로그인 (이메일 + OAuth)
│   │   ├── signup/                   # 회원가입 (3단계)
│   │   └── [provider]/callback/      # OAuth 콜백 (PKCE)
│   ├── main/
│   │   ├── layout.tsx                # 인증 가드 + BottomNav + OnboardingGuard
│   │   ├── dashboard/                # 홈 탭
│   │   ├── stocks/                   # 투자 탭 (목록 + 상세)
│   │   ├── portfolio/                # 포트폴리오 탭
│   │   ├── watchlist/                # 관심종목 탭
│   │   ├── notifications/            # 알림
│   │   └── mypage/                   # 마이 탭
│   │       ├── survey/               # 투자 성향 재설문
│   │       ├── profile/              # 프로필 편집
│   │       ├── settings/             # 앱 설정
│   │       ├── subscription/         # 구독/결제 관리
│   │       ├── holdings/             # 보유 종목 · 거래 내역
│   │       └── licenses/             # 오픈소스 라이선스
│   └── payment/
│       ├── success/                  # 결제 성공 콜백
│       └── fail/                     # 결제 실패 콜백
│
├── widgets/
│   ├── bottom-nav/                   # 플로팅 알약 탭바
│   ├── page-header/                  # 공통 페이지 헤더
│   ├── onboarding-guide/             # 최초 1회 온보딩 말풍선
│   └── pwa-guard/                    # PWA 설치 여부 감지 오버레이
│
├── features/
│   └── auth/
│       ├── api/authApi.ts            # 인증 API (JWT, OAuth, 성향/관심 저장)
│       ├── model/authContext.tsx     # AuthProvider + useAuth
│       ├── lib/                      # PKCE 유틸, 성향 설문 문항
│       └── ui/TendencySurvey.tsx    # 투자 성향 설문 UI
│
├── entities/
│   ├── ai/                           # AI 분석 API + 타입
│   ├── payment/                      # 결제/구독 API + 타입
│   ├── portfolio/                    # 포트폴리오 API + 타입
│   ├── stock/                        # 종목 API + 타입 + StockChart UI
│   ├── trade/                        # 거래 API + 타입
│   └── user/                         # 유저 API + 타입
│
└── shared/
    ├── api/                          # apiRequest wrapper, ApiException
    ├── config/env.ts                 # 환경변수
    ├── data/stockMaster.ts           # 종목 마스터 데이터
    ├── lib/                          # token, format 유틸
    ├── styles/globals.css            # CSS 변수, 전역 유틸 클래스
    └── ui/                           # Button, Badge, Skeleton, BottomSheet, StockLogo, MarkdownText
```

---

## 페이지별 기능 및 백엔드 API 연동

### 인증

| 페이지      | 경로                          | 기능                               | 연동 API                                                                                          |
|----------|-----------------------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| 로그인      | `/auth/login`               | 이메일/비밀번호 로그인, Google/Kakao OAuth | `POST /api/v1/auth/login`, `GET /api/v1/auth/social/login-url`                                  |
| 회원가입     | `/auth/signup`              | 이메일 가입 → 투자 성향 설문 → 관심 섹터 선택     | `POST /api/v1/auth/signup`, `POST /api/v1/users/me/tendency`, `POST /api/v1/users/me/interests` |
| OAuth 콜백 | `/auth/[provider]/callback` | PKCE code exchange, 토큰 저장        | `POST /api/v1/auth/social/login`                                                                |

### 메인 탭

| 페이지    | 경로                    | 기능                                              | 연동 API                                                                                                                                                                                                         |
|--------|-----------------------|-------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 홈 대시보드 | `/main/dashboard`     | 자산 요약, 실시간 인기 종목(거래량 Top5), 테마 지수, 피드 편집(순서/숨김) | `GET /api/v1/assets`, `POST /api/v1/accounts`, `GET /api/v1/stocks/top-volume`, `GET /api/v1/stocks/themes`                                                                                                    |
| 종목 목록  | `/main/stocks`        | 종목 검색 · 무한 스크롤, 관심종목 토글                         | `GET /api/v1/stocks/search`, `POST/DELETE /api/v1/users/me/watchlist/{ticker}`                                                                                                                                 |
| 종목 상세  | `/main/stocks/[id]`   | 분봉 차트(1/3/5/10/30/60분), AI 기업이슈 분석, 매수/매도       | `GET /api/v1/stocks/{ticker}`, `GET /api/v1/stocks/{ticker}/chart`, `GET /api/v1/ai/{ticker}/issue-analysis`, `POST /api/v1/ai/{ticker}/issue-analysis`, `POST /api/v1/trades/buy`, `POST /api/v1/trades/sell` |
| 포트폴리오  | `/main/portfolio`     | 도넛 차트(보유 비율), 수익률, 보유 종목 목록                     | `GET /api/v1/assets`, `GET /api/v1/assets/holdings`, `GET /api/v1/stocks/{ticker}`                                                                                                                             |
| 관심 종목  | `/main/watchlist`     | 찜한 종목 목록, 실시간 시세                                | `GET /api/v1/users/me/watchlist`, `GET /api/v1/stocks/{ticker}`                                                                                                                                                |
| 알림     | `/main/notifications` | UI 구현 완료, 백엔드 연동 준비 중                           | -                                                                                                                                                                                                              |

### 마이페이지

| 페이지           | 경로                          | 기능                                                 | 연동 API                                                                                                                                             |
|---------------|-----------------------------|----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| 마이 홈          | `/main/mypage`              | 프로필 요약, 자산 현황, 메뉴                                  | `GET /api/v1/users/me`, `GET /api/v1/assets`                                                                                                       |
| 프로필 편집        | `/main/mypage/profile`      | 닉네임/비밀번호 수정, 통합 회원 전환, 소셜 계정 표시, 회원 탈퇴             | `PATCH /api/v1/users/me`, `POST /api/v1/users/me/password`, `POST /api/v1/users/me/integrate`, `DELETE /api/v1/users/me`                           |
| 설정            | `/main/mypage/settings`     | 알림 · 마케팅 수신 동의 토글                                  | 로컬 상태 (백엔드 연동 준비 중)                                                                                                                                |
| 구독 관리         | `/main/mypage/subscription` | 구독 상태 조회, Toss Payments 카드 등록 · 구독 취소 · 재구독, 결제 내역 | `GET /api/v1/payments/subscriptions/status`, `POST /api/v1/payments/subscription`, `DELETE /api/v1/payments/subscriptions`, `GET /api/v1/payments` |
| 투자 성향 설문      | `/main/mypage/survey`       | 11문항 progressive reveal → 5개 유형 판정                 | `POST /api/v1/users/me/tendency`                                                                                                                   |
| 보유 종목 · 거래 내역 | `/main/mypage/holdings`     | 보유 종목 목록, 거래 내역 조회                                 | `GET /api/v1/holdings`, `GET /api/v1/trades`, `GET /api/v1/stocks/{ticker}`                                                                        |

### 결제 콜백

| 페이지   | 경로                 | 기능                         | 연동 API                               |
|-------|--------------------|----------------------------|--------------------------------------|
| 결제 성공 | `/payment/success` | Toss 빌링 authKey 처리 → 구독 등록 | `POST /api/v1/payments/subscription` |
| 결제 실패 | `/payment/fail`    | 실패 사유 표시                   | -                                    |

---

## PWA 구조

이 앱은 **홈 화면 추가 방식의 PWA**로만 접근 가능합니다.

| 접근 방식            | 동작                           |
|------------------|------------------------------|
| PC 브라우저          | `/desktop-block` — PWA 설치 안내 |
| 모바일 브라우저         | `/app-only` — 홈 화면 추가 안내     |
| PWA (standalone) | 정상 진입                        |
| `localhost`      | 가드 비활성화 (개발 편의)              |

**감지 방식**: `PwaGuard` 위젯이 `dynamic({ ssr: false })`로 클라이언트에서만 실행됩니다.
- iOS: `navigator.standalone === true`
- 그 외: `window.matchMedia('(display-mode: standalone)').matches`

**Safe Area**: `viewport-fit=cover` + `env(safe-area-inset-*)` 적용 — 노치/홈 인디케이터 대응

---

## 앱 레이아웃 구조

```
html > body
  └── .app-shell          (position: fixed, max-width: 480px, 100dvh)
        ├── PwaGuard       (SSR 없음, 클라이언트 전용 오버레이)
        └── AuthProvider
              ├── .page-content    (flex: 1, overflow-y: auto)
              │     └── {children}
              └── BottomNav        (flex-shrink: 0)

# 전체화면 오버레이 페이지 (BottomNav를 덮음)
# position: absolute; inset: 0; z-index: 10
# → /main/mypage/survey, /main/notifications, /main/mypage/settings, /main/mypage/licenses
```

---

## 인증 흐름

```
회원가입
  1단계: 이메일/비밀번호 또는 소셜 (Google/Kakao)
  2단계: 투자 성향 설문 (11문항 progressive reveal → 0~100점 → 5개 유형)
  3단계: 관심 섹터 선택

로그인
  JWT (accessToken + refreshToken, 자동 갱신)
  OAuth 2.1 Authorization Code + PKCE
  API Gateway에서 X-Gateway-Secret + JWT 검증

인증 가드
  /main/* 라우트: useAuth()로 미인증 시 /auth/login 리다이렉트
```

---

## 코드 컨벤션

### FSD 레이어 규칙

레이어 의존 방향: `app → widgets → features → entities → shared` (역방향 import 금지)

| 레이어         | import 가능 대상                         |
|-------------|--------------------------------------|
| `app/`      | widgets, features, entities, shared  |
| `widgets/`  | features, entities, shared           |
| `features/` | entities, shared (다른 features 참조 금지) |
| `entities/` | shared만                              |
| `shared/`   | 없음                                   |

### 스타일

- **인라인 스타일 금지** — CSS Modules만 사용
- 동적 값 전달은 `style={{ "--var-name": value } as CSSProperties}` CSS 변수 방식 사용
- CSS 커스텀 프로퍼티는 반드시 `@property` 선언으로 등록 (VSCode 타입 추론 + 브라우저 폴백)
- 공통 레이아웃 클래스 (`globals.css`): `.app-page`, `.app-section`, `.app-section-title`, `.app-sep`
- 색상 유틸: `.text-up`, `.text-down`, `.text-neutral`, `.text-primary`

### 기타

- `Button`, `Badge`, `Skeleton`, `BottomSheet` 등 공통 UI는 `shared/ui`에서 import
- API 호출은 `shared/api/instance.ts`의 `apiRequest` 사용 (토큰 자동 첨부 + 401 자동 갱신)
- 에러 처리: `ApiException` 타입으로 `status`, `code`, `message` 분기
- React StrictMode 이중 실행 방어: 1회성 비동기 호출엔 `useRef(false)` 가드 적용
- Promise 무시 경고: `useEffect` 내 비동기 호출은 `void` 연산자로 명시

---

## 백엔드 연동

```
api-gateway          :8080   (단일 진입점)
user-service         :19090  (인증, 성향, 관심종목)
trade-service        :19091  (모의 매수/매도, 계좌, 거래 내역)
stock-service        :19092  (실시간 시세, 테마, 인기 종목)
portfolio-service    :19093  (포트폴리오, 수익률)
notification-service :19094  (알림)
payment-service      :19095  (구독/결제)
ai-service           :19096  (기업 이슈 분석, RAG)
```
