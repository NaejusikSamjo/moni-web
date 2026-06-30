# moistock — Claude Code 가이드

이 문서는 Claude Code가 moistock 프론트엔드 저장소에서 작업할 때 참고하는 컨텍스트입니다.

---

## 1. 프로젝트 개요

**모니(moni)** 모의 투자 플랫폼의 Next.js 프론트엔드.  
PWA 모바일 전용 앱으로, 홈 화면 추가 방식으로만 접근 가능합니다.

---

## 2. 기술 스택 / 버전

| 항목                 | 버전                                   |
|--------------------|--------------------------------------|
| Next.js            | 16 (App Router + Turbopack)          |
| React              | 19                                   |
| TypeScript         | 6                                    |
| Yarn               | 4.16.0 (Berry) — npm/npx 사용 금지       |
| Node.js            | 26.3.0+                              |
| lightweight-charts | 5                                    |
| Toss Payments SDK  | 2 (`@tosspayments/tosspayments-sdk`) |

### 자주 쓰는 명령어

```bash
yarn dev            # 개발 서버 (http://localhost:3000)
yarn build          # 프로덕션 빌드
yarn lint           # ESLint 검사
yarn type-check     # TypeScript 타입 검사 (있는 경우)
```

---

## 3. 아키텍처 — FSD (Feature-Sliced Design)

레이어 의존 방향: `app → widgets → features → entities → shared` (역방향 import 엄격 금지)

```
src/
├── app/         # Next.js 페이지 (App Router)
├── widgets/     # 독립 UI 블록 (BottomNav, PageHeader, PwaGuard, OnboardingGuide)
├── features/    # 사용자 시나리오 (auth만 존재)
│   └── auth/    # authApi, authContext, PKCE 유틸, TendencySurvey
├── entities/    # 도메인 단위 API + 타입 (ai, payment, portfolio, stock, trade, user)
└── shared/      # 공통 인프라 (apiRequest, 환경변수, 유틸, 공통 UI)
```

**FSD 핵심 제약:**
- `features/` 레이어는 다른 `features/` 참조 금지 → authApi는 `features/auth/api`, userApi는 `entities/user/api`
- `entities/`는 `shared/`만 참조 가능

---

## 4. 환경변수

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080   # 백엔드 API Gateway
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxx         # 토스페이먼츠 클라이언트 키
```

`src/shared/config/env.ts`에서 중앙 관리. 컴포넌트에서 직접 `process.env` 접근 금지.

---

## 5. 코드 컨벤션 (필수)

### CSS

- **인라인 스타일 금지** — CSS Modules만 사용
- 동적 값 전달: `style={{ "--var": value } as CSSProperties}` CSS 변수 방식
- CSS 커스텀 프로퍼티는 해당 `.module.css`에 `@property` 선언 필수 (VSCode 경고 방지 + 폴백)
  ```css
  @property --bar-width {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 0%;
  }
  ```
- 공통 레이아웃: `.app-page`, `.app-section`, `.app-section-title`, `.app-sep` (`globals.css`)
- 색상 유틸: `.text-up` / `.text-down` / `.text-neutral` / `.text-primary`

### React / TypeScript

- React StrictMode 이중 실행 방어: 1회성 비동기 `useEffect`엔 `useRef(false)` 가드
  ```tsx
  const calledRef = useRef(false);
  useEffect(() => {
    if (!calledRef.current) { calledRef.current = true; fetch(); }
  }, []);
  ```
- `useEffect` 내 Promise 무시 경고: `void fn()` 패턴 사용
- `useCallback` 내부에서 `await` 사용 시 함수를 `async`로 선언해야 TS80006 방지
- 타입 단언 대신 타입 가드 우선 사용

### API 호출

- `shared/api/instance.ts`의 `apiRequest` 사용 (JWT 자동 첨부 + 401 자동 갱신)
- 에러는 `ApiException`으로 잡아 `status`, `code`, `message` 분기

---

## 6. 주요 실제 API 엔드포인트

코드 기준 실제 엔드포인트 (README 참고 시 여기 우선):

```
인증
  POST /api/v1/auth/signup
  POST /api/v1/auth/login
  GET  /api/v1/auth/social/login-url        # OAuth URL 조회
  POST /api/v1/auth/social/login            # OAuth 콜백 처리

사용자
  GET    /api/v1/users/me
  PUT    /api/v1/users/me
  PUT    /api/v1/users/me/password
  DELETE /api/v1/users/me
  POST   /api/v1/users/me/tendency
  GET    /api/v1/users/me/tendency
  POST   /api/v1/users/me/interests
  GET    /api/v1/users/me/watchlist
  POST   /api/v1/users/me/watchlist/{ticker}
  DELETE /api/v1/users/me/watchlist/{ticker}

계좌 / 거래
  GET  /api/v1/accounts
  POST /api/v1/accounts                     # 계좌 개설
  POST /api/v1/trades/buy
  POST /api/v1/trades/sell
  GET  /api/v1/trades                       # 거래 내역
  GET  /api/v1/holdings                     # 보유 종목
  GET  /api/v1/holdings/{ticker}

종목
  GET /api/v1/stocks/search
  GET /api/v1/stocks/{ticker}
  GET /api/v1/stocks/{ticker}/chart
  GET /api/v1/stocks/top-volume
  GET /api/v1/stocks/themes

포트폴리오
  POST /api/v1/portfolio                    # 포트폴리오 생성
  GET  /api/v1/portfolio/assets
  GET  /api/v1/portfolio/holdings

AI 분석
  GET  /api/v1/ai/{ticker}/issue-analysis   # 기존 분석 조회 (없으면 null)
  POST /api/v1/ai/{ticker}/issue-analysis   # 분석 신규 생성

결제 / 구독
  GET    /api/v1/payments/subscriptions/status
  POST   /api/v1/payments/subscription
  DELETE /api/v1/payments/subscriptions
  GET    /api/v1/payments
```

---

## 7. 페이지 목록

| 경로                          | 설명                      | 구현 상태 |
|-----------------------------|-------------------------|-------|
| `/`                         | 랜딩 페이지                  | 완료    |
| `/auth/login`               | 이메일 + OAuth 로그인         | 완료    |
| `/auth/signup`              | 3단계 회원가입                | 완료    |
| `/auth/[provider]/callback` | OAuth PKCE 콜백           | 완료    |
| `/main/dashboard`           | 홈 탭 (자산, 인기종목, 테마)      | 완료    |
| `/main/stocks`              | 종목 검색 + 무한 스크롤          | 완료    |
| `/main/stocks/[id]`         | 종목 상세 + 차트 + AI + 매수/매도 | 완료    |
| `/main/portfolio`           | 포트폴리오 도넛 차트 + 보유종목      | 완료    |
| `/main/watchlist`           | 관심 종목                   | 완료    |
| `/main/notifications`       | 알림 (백엔드 연동 준비 중)        | UI만   |
| `/main/mypage`              | 마이 홈                    | 완료    |
| `/main/mypage/profile`      | 프로필 편집 + 탈퇴             | 완료    |
| `/main/mypage/settings`     | 알림 설정 (백엔드 연동 준비 중)     | UI만   |
| `/main/mypage/subscription` | Toss Payments 구독 관리     | 완료    |
| `/main/mypage/survey`       | 투자 성향 설문 (11문항)         | 완료    |
| `/main/mypage/holdings`     | 보유 종목 + 거래 내역           | 완료    |
| `/main/mypage/licenses`     | 오픈소스 라이선스               | 완료    |
| `/payment/success`          | Toss 결제 성공 콜백           | 완료    |
| `/payment/fail`             | Toss 결제 실패              | 완료    |

---

## 8. PWA / 레이아웃 구조

```
app-shell (position: fixed, max-width: 480px, 100dvh)
  ├── PwaGuard (클라이언트 전용, SSR 없음)
  └── AuthProvider
        ├── page-content (overflow-y: auto, flex: 1)
        └── BottomNav (flex-shrink: 0)
```

- `localhost` 접근 시 PwaGuard 비활성화 (개발 편의)
- iOS: `navigator.standalone`, 그 외: `matchMedia('(display-mode: standalone)')`

---

## 9. 주의사항

- **패키지 매니저는 Yarn만** — `npm install`, `npx` 사용 금지. `yarn add`, `yarn dlx` 사용.
- **`package-lock.json` 커밋 금지** — `.gitignore`에 등록되어 있음
- **`build/` 디렉토리 직접 수정 금지**
- **인라인 스타일 금지** — 스타일 변경 시 반드시 CSS Modules 또는 CSS 변수 방식 사용
- FSD 레이어 역방향 참조 금지 — 새 코드 작성 전 레이어 의존 방향 확인
- `NEXT_PUBLIC_STOCK_LOGO_BASE_URL` 환경변수는 코드 내부에만 존재하며 문서화 금지
