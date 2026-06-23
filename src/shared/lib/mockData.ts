export const mockUser = {
  id: "user-001",
  name: "김민준",
  email: "minjun@example.com",
  avatar: null,
  investmentType: "성장형",
  seedMoney: 10_000_000,
  totalAsset: 11_430_000,
  totalReturn: 1_430_000,
  totalReturnRate: 14.3,
  joinedAt: "2025-01-10",
};

export const mockStocks = [
  { id: "005930", name: "삼성전자", market: "KOSPI", price: 72400, change: 1200, changeRate: 1.68, volume: 18_234_500, marketCap: "432조", sector: "반도체", isFavorite: true },
  { id: "000660", name: "SK하이닉스", market: "KOSPI", price: 198500, change: -2500, changeRate: -1.24, volume: 5_432_100, marketCap: "144조", sector: "반도체", isFavorite: true },
  { id: "035420", name: "NAVER", market: "KOSPI", price: 189000, change: 3200, changeRate: 1.72, volume: 890_000, marketCap: "31조", sector: "IT", isFavorite: false },
  { id: "035720", name: "카카오", market: "KOSPI", price: 42500, change: -800, changeRate: -1.85, volume: 3_200_000, marketCap: "19조", sector: "IT", isFavorite: false },
  { id: "207940", name: "삼성바이오로직스", market: "KOSPI", price: 893000, change: 12000, changeRate: 1.36, volume: 124_500, marketCap: "59조", sector: "바이오", isFavorite: false },
  { id: "006400", name: "삼성SDI", market: "KOSPI", price: 312000, change: 5500, changeRate: 1.79, volume: 456_000, marketCap: "21조", sector: "배터리", isFavorite: false },
  { id: "373220", name: "LG에너지솔루션", market: "KOSPI", price: 378000, change: -4000, changeRate: -1.05, volume: 234_000, marketCap: "89조", sector: "배터리", isFavorite: false },
  { id: "AAPL", name: "Apple", market: "NASDAQ", price: 224800, change: 3400, changeRate: 1.54, volume: 52_000_000, marketCap: "$3.4T", sector: "Tech", isFavorite: true },
  { id: "TSLA", name: "Tesla", market: "NASDAQ", price: 196300, change: -5200, changeRate: -2.58, volume: 28_000_000, marketCap: "$625B", sector: "EV", isFavorite: false },
  { id: "NVDA", name: "NVIDIA", market: "NASDAQ", price: 1245000, change: 34000, changeRate: 2.81, volume: 41_000_000, marketCap: "$3.1T", sector: "반도체", isFavorite: true },
];

export const mockPortfolio = [
  { stockId: "005930", name: "삼성전자", quantity: 50, avgPrice: 68000, currentPrice: 72400, returnRate: 6.47, returnAmount: 220000 },
  { stockId: "000660", name: "SK하이닉스", quantity: 10, avgPrice: 185000, currentPrice: 198500, returnRate: 7.30, returnAmount: 135000 },
  { stockId: "AAPL", name: "Apple", quantity: 5, avgPrice: 210000, currentPrice: 224800, returnRate: 7.05, returnAmount: 74000 },
  { stockId: "NVDA", name: "NVIDIA", quantity: 2, avgPrice: 980000, currentPrice: 1245000, returnRate: 27.04, returnAmount: 530000 },
];

export const mockTrends = [
  { rank: 1, stockId: "NVDA", name: "NVIDIA", changeRate: 2.81, tag: "AI칩" },
  { rank: 2, stockId: "005930", name: "삼성전자", changeRate: 1.68, tag: "반도체" },
  { rank: 3, stockId: "035420", name: "NAVER", changeRate: 1.72, tag: "AI검색" },
  { rank: 4, stockId: "207940", name: "삼성바이오로직스", changeRate: 1.36, tag: "바이오" },
  { rank: 5, stockId: "006400", name: "삼성SDI", changeRate: 1.79, tag: "배터리" },
];

export const mockIndices = [
  { name: "KOSPI", value: 2847.32, change: 18.45, changeRate: 0.65 },
  { name: "NASDAQ", value: 18234.56, change: -45.23, changeRate: -0.25 },
  { name: "USD/KRW", value: 1345.20, change: -2.30, changeRate: -0.17 },
  { name: "WTI 유가", value: 78.45, change: 1.23, changeRate: 1.59 },
];

export const mockNews = [
  {
    id: "n1",
    stockId: "NVDA",
    stockName: "NVIDIA",
    title: "NVIDIA, 차세대 AI 칩 블랙웰 울트라 양산 시작",
    summary: "NVIDIA가 블랙웰 울트라 GPU의 대량 생산을 시작하며 AI 데이터센터 수요에 대응. 주요 클라우드 업체들의 선주문이 몰리며 올해 매출 전망 상향 조정.",
    sentiment: "positive",
    publishedAt: "2시간 전",
  },
  {
    id: "n2",
    stockId: "005930",
    stockName: "삼성전자",
    title: "삼성전자, HBM4 개발 완료 및 엔비디아 공급 협상 진행",
    summary: "삼성전자가 HBM4 개발을 완료하고 NVIDIA와 공급 협상을 진행 중. 메모리 반도체 시장 회복세와 맞물려 주가 상승 기대.",
    sentiment: "positive",
    publishedAt: "4시간 전",
  },
  {
    id: "n3",
    stockId: "035720",
    stockName: "카카오",
    title: "카카오, 플랫폼 규제 이슈 재점화에 주가 하락",
    summary: "공정거래위원회의 플랫폼 규제 강화 방침 발표에 카카오 주가가 장 초반 약세. 하반기 실적 전망에 대한 불확실성 증가.",
    sentiment: "negative",
    publishedAt: "6시간 전",
  },
];

export const mockNotifications = [
  { id: "notif1", type: "market", title: "미국 시장 개장", message: "뉴욕 증시가 10분 후 개장합니다.", time: "오후 10:20", read: false },
  { id: "notif2", type: "stock", title: "NVIDIA 목표가 달성", message: "NVDA가 설정한 목표가 $120에 도달했습니다.", time: "오전 11:30", read: false },
  { id: "notif3", type: "portfolio", title: "포트폴리오 수익률", message: "이번 주 포트폴리오 수익률이 +3.2%를 달성했습니다.", time: "어제", read: true },
  { id: "notif4", type: "ai", title: "AI 분석 완료", message: "삼성전자 기업 분석 리포트가 준비되었습니다.", time: "어제", read: true },
];

export const mockDividends = [
  { stockId: "005930", name: "삼성전자", date: "2026-06-15", amount: 361, yield: 1.99 },
  { stockId: "AAPL", name: "Apple", date: "2026-06-20", amount: 1380, yield: 0.61 },
  { stockId: "000660", name: "SK하이닉스", date: "2026-06-28", amount: 1200, yield: 0.60 },
];

export const mockAiAnalysis = {
  stockId: "NVDA",
  stockName: "NVIDIA",
  score: 92,
  recommendation: "매수",
  summary: "AI 인프라 투자 확대 사이클의 핵심 수혜주로, 블랙웰 GPU 수요가 공급을 초과하는 상황이 지속될 전망입니다.",
  pros: ["데이터센터 GPU 시장 독점적 지위", "소프트웨어 생태계(CUDA) 진입 장벽", "AI 추론 수요 급증"],
  cons: ["고밸류에이션 리스크", "AMD·인텔의 경쟁 심화", "미중 반도체 수출 규제 불확실성"],
  targetPrice: 1350000,
  currentPrice: 1245000,
};
