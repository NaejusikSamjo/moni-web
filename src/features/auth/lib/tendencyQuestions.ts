export interface SurveyOption {
  text: string;
  score: number;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  multi: boolean;
  options: SurveyOption[];
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    question: "고객님의 연령대는 어떻게 되십니까?",
    multi: false,
    options: [
      { text: "만 19세 이하", score: 1 },
      { text: "만 20세 ~ 30세", score: 5 },
      { text: "만 31세 ~ 54세", score: 4 },
      { text: "만 55세 ~ 64세", score: 2 },
      { text: "만 65세 이상", score: 1 },
    ],
  },
  {
    id: 2,
    question: "투자하실 자금의 투자가능 기간은 어느 정도입니까?",
    multi: false,
    options: [
      { text: "6개월 미만", score: 1 },
      { text: "6개월 이상 ~ 1년 미만", score: 2 },
      { text: "1년 이상 ~ 2년 미만", score: 3 },
      { text: "2년 이상 ~ 3년 미만", score: 4 },
      { text: "3년 이상", score: 5 },
    ],
  },
  {
    id: 3,
    question: "투자 경험과 가장 가까운 상품은 무엇입니까? (복수 선택 가능)",
    multi: true,
    options: [
      { text: "은행 예/적금, 국채, MMF, CMA 등", score: 1 },
      { text: "금융채, 채권형 펀드, 원금보장형 ELS 등", score: 2 },
      { text: "회사채, 혼합형 펀드, 원금 일부 보장 ELS 등", score: 3 },
      { text: "주식, 원금 비보장 ELS, 주식형 펀드 등", score: 4 },
      { text: "ELW, 선물·옵션, 파생상품 펀드 등", score: 5 },
    ],
  },
  {
    id: 4,
    question: "금융투자상품 투자 경험 기간은 어떻게 되십니까?",
    multi: false,
    options: [
      { text: "전혀 없음", score: 1 },
      { text: "1년 미만", score: 2 },
      { text: "1년 이상 ~ 3년 미만", score: 3 },
      { text: "3년 이상 ~ 5년 미만", score: 4 },
      { text: "5년 이상", score: 5 },
    ],
  },
  {
    id: 5,
    question: "금융투자상품 취득 목적은 무엇입니까?",
    multi: false,
    options: [
      { text: "채무 상환", score: 1 },
      { text: "생활비 마련", score: 1 },
      { text: "주택 마련", score: 2 },
      { text: "여유 자금 운용", score: 4 },
      { text: "자산 증식", score: 5 },
    ],
  },
  {
    id: 6,
    question: "금융투자상품에 대한 지식 수준은 어느 정도입니까?",
    multi: false,
    options: [
      { text: "금융상품에 투자해 본 경험이 없음", score: 1 },
      { text: "주식·채권·펀드의 구조와 위험을 일정 부분 이해", score: 2 },
      { text: "주식·채권·펀드의 구조와 위험을 깊이 이해", score: 3 },
      { text: "파생상품 포함 대부분 금융상품의 구조와 위험 이해", score: 4 },
    ],
  },
  {
    id: 7,
    question: "투자 수익과 위험에 대한 태도는 어떻습니까?",
    multi: false,
    options: [
      { text: "투자수익을 고려하나 원금 보존 추구", score: 1 },
      { text: "손실 위험이 있더라도 높은 수익 추구", score: 2 },
    ],
  },
  {
    id: 8,
    question: "고객님의 총 자산은 어느 정도입니까?",
    multi: false,
    options: [
      { text: "1억 미만", score: 1 },
      { text: "1억 이상 ~ 2억 미만", score: 2 },
      { text: "2억 이상 ~ 5억 미만", score: 3 },
      { text: "5억 이상 ~ 10억 미만", score: 4 },
      { text: "10억 이상", score: 5 },
    ],
  },
  {
    id: 9,
    question: "향후 수입원에 대한 예상은 어떻게 하십니까?",
    multi: false,
    options: [
      { text: "현재 수입이 안정적이며 향후 유지·증가 예상", score: 3 },
      { text: "현재 수입이 있으나 향후 감소하거나 불안정할 예상", score: 2 },
      { text: "현재 일정한 수입이 없으며 연금이 주 수입원", score: 1 },
    ],
  },
  {
    id: 10,
    question: "기대하는 수익 수준은 어느 정도입니까?",
    multi: false,
    options: [
      { text: "원금 기준 10% 범위", score: 1 },
      { text: "원금 기준 20% 범위", score: 2 },
      { text: "원금 기준 50% 범위", score: 3 },
      { text: "원금 기준 70% 범위", score: 4 },
      { text: "원금 기준 100% 범위", score: 5 },
    ],
  },
  {
    id: 11,
    question: "감내할 수 있는 손실 수준은 어느 정도입니까?",
    multi: false,
    options: [
      { text: "원금 보존 추구", score: 1 },
      { text: "원금 기준 -10% 범위", score: 2 },
      { text: "원금 기준 -20% 범위", score: 3 },
      { text: "원금 기준 -50% 범위", score: 4 },
      { text: "원금 기준 -70% 범위", score: 5 },
      { text: "전액 손실 감내 가능", score: 6 },
    ],
  },
];

const MIN_RAW = 11;
const MAX_RAW = 50; // 5+5+5+5+5+4+2+5+3+5+6

export function calcSurveyScore(
  singleAnswers: Record<number, number>,
  multiAnswers: Set<number>
): number {
  let raw = 0;

  for (const q of SURVEY_QUESTIONS) {
    if (q.multi) {
      const maxScore =
        multiAnswers.size > 0
          ? Math.max(...[...multiAnswers].map((i) => q.options[i].score))
          : q.options[0].score;
      raw += maxScore;
    } else {
      const idx = singleAnswers[q.id];
      if (idx !== undefined) raw += q.options[idx].score;
    }
  }

  return Math.min(100, Math.max(0, Math.round(((raw - MIN_RAW) / (MAX_RAW - MIN_RAW)) * 100)));
}
