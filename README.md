# moniweb — 모니(moni) 프론트엔드

> 초보 투자자를 위한 모의 투자 앱 프론트엔드  
> PWA 기반 모바일 전용 앱 (홈 화면 추가 방식)

---

## 기술 스택

| 분류      | 내용                                      |
|---------|-----------------------------------------|
| 프레임워크   | Next.js 16 App Router (Turbopack)       |
| 런타임     | React 19                                |
| 언어      | TypeScript 6                            |
| 패키지 매니저 | Yarn 4 (Berry)                          |
| 스타일     | CSS Modules                             |
| 아이콘     | react-icons 5 (`/ri`)                   |
| 폰트      | Noto Sans KR (Google Fonts)             |
| 아키텍처    | FSD (Feature-Sliced Design)             |
| PWA     | Web App Manifest + `viewport-fit=cover` |

---

## 프로젝트 구조 (FSD)

```
src/
├── app/                          # Next.js App Router 페이지
│   ├── layout.tsx                # 루트 레이아웃 (app-shell, PwaGuard, AuthProvider)
│   ├── page.tsx                  # 랜딩 페이지 (AnimatedWord 히어로)
│   ├── not-found.tsx             # 404 페이지
│   ├── manifest.ts               # PWA 매니페스트
│   ├── robots.ts                 # 검색엔진 크롤 정책
│   ├── sitemap.ts                # 사이트맵
│   ├── desktop-block/            # PC 브라우저 접속 차단 (PWA 설치 안내)
│   ├── app-only/                 # 모바일 브라우저 접속 차단 (홈 화면 추가 안내)
│   ├── auth/
│   │   ├── login/                # 로그인
│   │   ├── signup/               # 회원가입 (성향설문 3단계)
│   │   └── [provider]/callback/  # OAuth 콜백
│   └── main/
│       ├── layout.tsx            # 인증 가드 + BottomNav + OnboardingGuide
│       ├── dashboard/            # 홈 탭
│       ├── stocks/               # 투자 탭 (목록 + 상세)
│       ├── portfolio/            # 포트폴리오 탭
│       ├── watchlist/            # 관심종목 탭
│       ├── notifications/        # 알림 (전체화면 오버레이)
│       └── mypage/               # 마이 탭
│           ├── survey/           # 투자 성향 설문 (전체화면 오버레이)
│           ├── profile/          # 프로필 편집
│           ├── settings/         # 설정 (알림 토글, 라이선스 링크)
│           └── licenses/         # 오픈소스 라이선스
│
├── widgets/
│   ├── bottom-nav/               # 플로팅 알약 탭바 (슬라이딩 인디케이터)
│   ├── page-header/              # 공통 페이지 헤더
│   ├── onboarding-guide/         # 최초 1회 온보딩 말풍선
│   └── pwa-guard/                # PWA 설치 여부 감지 오버레이
│
├── features/
│   └── auth/
│       ├── api/authApi.ts        # 인증 API (JWT, OAuth, 성향/관심 저장)
│       ├── model/types.ts        # 요청/응답 타입
│       ├── lib/                  # PKCE, 성향 문항 로직
│       └── ui/TendencySurvey.tsx # 투자 성향 설문 (progressive reveal)
│
├── entities/
│   └── user/model/types.ts       # UserResponse, UserRole 등
│
└── shared/
    ├── api/                      # apiRequest, ApiException
    ├── config/env.ts             # 환경변수
    ├── lib/                      # token, mockData, format 유틸
    ├── styles/globals.css        # CSS 변수, app-shell, 공유 유틸 클래스
    └── ui/                       # Button, Badge, Skeleton, ServiceUnavailable
```

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
- iOS: `navigator.standalone === true` (matchMedia iOS Safari 사용 불가)
- 그 외: `window.matchMedia('(display-mode: standalone)').matches`

**Safe Area**: `viewport-fit=cover` + `env(safe-area-inset-*)` 적용 — 노치/홈 인디케이터 대응

---

## 앱 레이아웃 구조

```
html > body
  └── .app-shell          (position: fixed, max-width: 480px, 100dvh)
        ├── PwaGuard       (SSR 없음, 클라이언트 전용 오버레이)
        └── AuthProvider
              ├── .page-content    (flex: 1, overflow-y: auto — 단일 스크롤 컨테이너)
              │     └── {children}
              └── BottomNav        (flex-shrink: 0, 고정 아님)

# 전체화면 오버레이 페이지 (BottomNav를 덮음)
# position: absolute; inset: 0; z-index: 10
# → /main/mypage/survey, /main/notifications, /main/mypage/settings, /main/mypage/licenses
```

---

## 인증 흐름

```
회원가입
  1단계: 이메일/비밀번호 또는 소셜(Google/Kakao)
  2단계: 투자 성향 설문 (11문항 progressive reveal → 0~100점 → 5개 유형)
  3단계: 관심 섹터 선택

로그인
  JWT (accessToken + refreshToken)
  OAuth 2.1 Authorization Code + PKCE
  API Gateway에서 X-Gateway-Secret + JWT 검증

인증 가드
  /main/* 라우트: useAuth()로 미인증 시 /auth/login 리다이렉트 (main/layout.tsx)
```

---

## 개발 서버 실행

```bash
yarn install
yarn dev           # http://localhost:3000 (PWA 가드 비활성화)
```

**iPhone/모바일 기기에서 테스트할 때**

로컬 IP로 접근 시 HMR WebSocket을 허용하려면 `next.config.ts`의 `allowedDevOrigins`에 IP를 추가하세요.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.x.x"],
};
```

**소셜 로그인까지 테스트하려면 ngrok 사용**

```bash
ngrok http 3000
# → https://xxxx.ngrok-free.app
# OAuth 제공자 콘솔 리다이렉트 URI에 해당 URL 추가 필요
```

---

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080   # 백엔드 게이트웨이
NEXT_PUBLIC_SITE_URL=https://moni.app            # 프로덕션 도메인 (robots/sitemap)
```

---

## 코딩 컨벤션

- **인라인 스타일 금지** — CSS Modules만 사용, 동적값은 CSS 변수(`--var-name`)로 전달
- **FSD 레이어 방향** — `app → widgets → features → entities → shared` (역방향 import 금지)
- **공통 레이아웃 클래스** (globals.css): `.app-page`, `.app-section`, `.app-section-title`, `.app-sep`
- **색상 유틸**: `.text-up`, `.text-down`, `.text-neutral`, `.text-primary`

---

## 백엔드 연동

```
api-gateway   :8080   (단일)
user-service  :19090  (인증, 성향, 관심종목)
```

백엔드 레포: [moni](../moni)
