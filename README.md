<!-- 상단 배너 이미지 교체 예정 -->
<div align="center">
  <img src="docs/images/banner.gif" alt="moni banner" width="1080"/>

  <h1>moni · 모니</h1>

[![Deploy](https://img.shields.io/badge/Deploy-www.moni.my-000000?style=flat)](https://www.moni.my)

  <p>초보 투자자를 위한 AI 기반 모의 투자 서비스 웹앱</p>

<hr/>

<p align="center">
  <a href="#프로젝트-소개">프로젝트 소개</a> &nbsp;&bull;&nbsp;
  <a href="#기술-스택">기술 스택</a> &nbsp;&bull;&nbsp;
  <a href="#프로젝트-구조">프로젝트 구조</a> &nbsp;&bull;&nbsp;
  <a href="#페이지별-기능">페이지별 기능</a> &nbsp;&bull;&nbsp;
  <a href="#실행-방법">실행 방법</a> &nbsp;&bull;&nbsp;
  <a href="#컨벤션">컨벤션</a>
</p>

</div>


## 프로젝트 소개


복잡한 금융 정보를 AI로 쉽게 풀어주고, 실제 자금 없이 모의 매수·매도를 경험할 수 있는 **모의 투자 플랫폼**의 프론트엔드입니다.

- Next.js 16 App Router 기반 PWA — 홈 화면 추가 방식으로 모바일 앱처럼 사용
- FSD(Feature-Sliced Design) 아키텍처로 레이어 간 의존성 명확하게 분리
- OAuth 2.1 Authorization Code + PKCE 소셜 로그인 (Google · Kakao)
- lightweight-charts 기반 실시간 분봉 차트 (LIVE 5초 자동 갱신)
- AI 기업이슈 분석 · 시장 뉴스 요약 (RAG, 백엔드 ai-service 연동)
- Toss Payments SDK 기반 구독 결제


## 기술 스택


| 분류           | 기술                                                                                                                                                                                                                                                                                                           |
|:-------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Frontend     | ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=flat&logo=typescript&logoColor=white) |
| Style        | ![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=flat&logo=cssmodules&logoColor=white)                                                                                                                                                                                                   |
| Lint         | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)                                                                                                                                                                                                                 |
| Package      | ![Yarn](https://img.shields.io/badge/Yarn_4_Berry-2C8EBB?style=flat&logo=yarn&logoColor=white)                                                                                                                                                                                                               |
| Chart        | ![lightweight-charts](https://img.shields.io/badge/lightweight--charts_5-0073CF?style=flat&logoColor=white)                                                                                                                                                                                                  |
| Payment      | ![Toss Payments](https://img.shields.io/badge/Toss_Payments-0064FF?style=flat&logo=tosspayments&logoColor=white)                                                                                                                                                                                             |
| Architecture | ![FSD](https://img.shields.io/badge/FSD-Feature--Sliced_Design-blueviolet?style=flat)                                                                                                                                                                                                                        |
| Platform     | ![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)                                                                                                                                                                                                                          |
| Deployment   | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)                                                                                                                                                                                                                 |


## 프로젝트 구조


FSD(Feature-Sliced Design) 레이어 구조를 따릅니다.  
레이어 의존 방향: `app → widgets → features → entities → shared`

<details>
<summary>Directory Structure</summary>

```
src/
├── app/                              # Next.js App Router 페이지
│   ├── auth/
│   │   ├── login/                    # 로그인 (이메일 + OAuth)
│   │   ├── signup/                   # 회원가입 (3단계)
│   │   └── [provider]/callback/      # OAuth 콜백 (PKCE)
│   ├── main/
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
│   │       └── holdings/             # 보유 종목 · 거래 내역
│   └── payment/
│       ├── success/                  # 결제 성공 콜백
│       └── fail/                     # 결제 실패 콜백
│
├── widgets/
│   ├── bottom-nav/                   # 플로팅 알약 탭바
│   ├── onboarding-guide/             # 최초 1회 온보딩 말풍선
│   └── pwa-guard/                    # PWA 설치 여부 감지 오버레이
│
├── features/
│   └── auth/                         # 인증 API, AuthProvider, PKCE, 성향 설문 UI
│
├── entities/
│   ├── ai/                           # AI 분석 API + 타입
│   ├── payment/                      # 결제/구독 API + 타입
│   ├── portfolio/                    # 포트폴리오 API + 타입
│   ├── stock/                        # 종목 API + 타입 + StockChart
│   ├── trade/                        # 거래 API + 타입
│   └── user/                         # 유저 API + 타입
│
└── shared/
    ├── api/                          # apiRequest wrapper, ApiException
    ├── data/stockMaster.ts           # 종목 마스터 데이터
    ├── lib/                          # token, format 유틸
    ├── styles/globals.css            # CSS 변수, 전역 유틸 클래스
    └── ui/                           # 공통 컴포넌트 (Button, Badge, Skeleton 등)
```

</details>


## 페이지별 기능


### [로그인 / 회원가입]

<!-- 스크린샷 -->

### [대시보드]

<!-- 스크린샷 -->

### [종목 목록]

<!-- 스크린샷 -->

### [종목 상세]

<!-- 스크린샷 -->

### [포트폴리오]

<!-- 스크린샷 -->

### [관심 종목]

<!-- 스크린샷 -->

### [마이 홈]

<!-- 스크린샷 -->

### [프로필 편집]

<!-- 스크린샷 -->

### [투자 성향 설문]

<!-- 스크린샷 -->

### [구독 관리]

<!-- 스크린샷 -->

### [보유 종목 · 거래 내역]

<!-- 스크린샷 -->

### [결제 성공 · 실패]

<!-- 스크린샷 -->


## 실행 방법


### Requirements

- Node.js 26.3.0+
- Yarn 4.16.0
- 백엔드 API Gateway (`:8080`)

### Environment Variables (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.moni.my
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxx
```

### Local Development

```bash
yarn install
yarn dev        # http://localhost:3000 (PWA 가드 비활성화)
```

### Device Testing (iPhone / Android)

`next.config.ts`의 `allowedDevOrigins`에 로컬 IP 추가:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.x.x"],
};
```

외부 테스트는 ngrok 사용:

```bash
ngrok http 3000
# OAuth 제공자 콘솔 리다이렉트 URI에 https://xxxx.ngrok-free.app 추가
```


## 컨벤션


자세한 내용은 [CONVENTIONS.md](./docs/CONVENTIONS.md)를 참고하세요.
