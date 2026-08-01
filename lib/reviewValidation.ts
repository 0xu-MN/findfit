// 서술형 리뷰 답변의 "성의없음" 판정 기준 — 클라이언트(리뷰 작성 폼)와
// 서버(제출 API) 양쪽에서 반드시 같은 기준을 써야 한다. 예전엔 프론트에만
// 있어서 API를 직접 호출하면 그대로 우회 가능했다.
export const MIN_SHORT_ANSWER_LENGTH = 5
export const CARELESS_ANSWER_PATTERN = /^[.,!?~…\s]*$/
