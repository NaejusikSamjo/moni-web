# 개발 컨벤션

## FSD 레이어 규칙

의존 방향: `app → widgets → features → entities → shared` (역방향 import 금지)

| 레이어         | import 가능 대상                         |
|-------------|--------------------------------------|
| `app/`      | widgets, features, entities, shared  |
| `widgets/`  | features, entities, shared           |
| `features/` | entities, shared (다른 features 참조 금지) |
| `entities/` | shared만                              |
| `shared/`   | 없음                                   |

## 스타일

- 인라인 스타일 금지 — CSS Modules만 사용
- 동적 색상 · 가변 값은 `data-*` 속성 + CSS 속성 셀렉터(`[data-idx="0"]`)로 전달
- SVG 기하 속성(`width`, `x2` 등)은 HTML 어트리뷰트이므로 인라인 스타일 규칙 적용 안 함
- 공통 레이아웃 클래스 (`globals.css`): `.app-page`, `.app-section`, `.app-section-title`, `.app-sep`
- 색상 유틸: `.text-up`, `.text-down`, `.text-neutral`, `.text-primary`

## API 호출

- 모든 API 호출은 `shared/api/instance.ts`의 `apiRequest` 사용 (토큰 자동 첨부 + 401 자동 갱신)
- 에러 처리는 `ApiException` 타입으로 `status`, `code`, `message` 분기
- `useEffect` 내 비동기 호출은 `void` 연산자로 명시

## 공통 UI

- `Button`, `Badge`, `Skeleton`, `BottomSheet`, `StockLogo`, `MarkdownText` 등 공통 컴포넌트는 `shared/ui`에서 import

## React

- React StrictMode 이중 실행 방어: 1회성 비동기 호출엔 `useRef(false)` 가드 적용
- 인증 상태는 `features/auth`의 `useAuth()` 훅으로 접근

## PWA

| 접근 방식            | 동작                           |
|------------------|------------------------------|
| PC 브라우저          | `/desktop-block` — PWA 설치 안내 |
| 모바일 브라우저         | `/app-only` — 홈 화면 추가 안내     |
| PWA (standalone) | 정상 진입                        |
| `localhost`      | 가드 비활성화 (개발 편의)              |

감지 방식: `PwaGuard` 위젯이 `dynamic({ ssr: false })`로 클라이언트에서만 실행  
- iOS: `navigator.standalone === true`  
- 그 외: `window.matchMedia('(display-mode: standalone)').matches`

Safe Area: `viewport-fit=cover` + `env(safe-area-inset-*)` 적용

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
# → /main/mypage/survey, /main/notifications, /main/mypage/settings
```

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
