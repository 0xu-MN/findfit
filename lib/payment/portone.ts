// PortOne(구 아임포트) V2 결제 검증 — 등록 이용료(Light/Standard)와 심층
// 리포트(9,900원)에 대한 즉시결제(일반결제, 사전승인 아님) 검증 함수.
//
// 실제 결제창(체크아웃)은 브라우저에서 PortOne SDK로 열어 paymentId를 발급받고,
// 그 paymentId를 이 서버 함수로 넘겨 "실제로 결제가 완료됐고 금액이 맞는지"를
// 검증하는 구조다(클라이언트가 보낸 금액을 그대로 믿지 않기 위함).
// 지금 단계에서는 ENABLE_PAYMENT_GATE=false라 이 함수 자체가 호출되지 않지만,
// 게이트를 켜는 순간 그대로 쓸 수 있도록 완성된 형태로 작성해둔다.
//
// TODO: 실제 연동 시 PORTONE_API_SECRET 발급 + 브라우저 체크아웃 SDK(PortOne
// Browser SDK) 연동이 별도로 필요하다 — 이 파일은 서버 쪽 검증만 담당한다.

export type PortOnePaymentResult = {
  success: boolean
  portoneTxId?: string
  error?: string
}

export type PortOneSkuType = 'registration_light' | 'registration_standard' | 'deep_report'

// SKU별 표준 금액 — Standard는 인원수에 비례하므로 호출부에서 직접 계산해 넘긴다.
export const SKU_PRICING = {
  registration_light: 4900,
  registration_standard_per_reviewer: 1800,
  deep_report: 9900,
} as const

// paymentId(브라우저 SDK 결제 완료 후 발급된 식별자)로 PortOne 서버에 실제
// 결제 상태/금액을 조회해 검증한다. 클라이언트가 넘긴 금액이 아니라 PortOne이
// 응답한 실결제 금액을 기준으로 비교해야 위변조를 막을 수 있다.
export async function verifyPortOnePayment(
  paymentId: string,
  expectedAmount: number
): Promise<PortOnePaymentResult> {
  const apiSecret = process.env.PORTONE_API_SECRET
  if (!apiSecret) {
    return { success: false, error: 'PORTONE_API_SECRET이 설정되지 않았습니다' }
  }

  try {
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: { Authorization: `PortOne ${apiSecret}` },
    })

    if (!res.ok) {
      return { success: false, error: `PortOne 조회 실패 (${res.status})` }
    }

    const data = await res.json()
    const status = data.status as string | undefined
    const paidAmount = data.amount?.total as number | undefined

    if (status !== 'PAID') {
      return { success: false, error: `결제 상태가 완료가 아닙니다 (status: ${status})` }
    }
    if (paidAmount !== expectedAmount) {
      return { success: false, error: `결제 금액이 일치하지 않습니다 (expected: ${expectedAmount}, actual: ${paidAmount})` }
    }

    return { success: true, portoneTxId: paymentId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '결제 검증 중 오류' }
  }
}

// registration_* 환불 — 기존 SOP(Reviewer 0명 시 전액환불) 그대로, 해당
// 거래 1건만 단건 취소. deep_report는 AI 생성 실패 시에만 환불(정상 생성
// 후 환불 불가) — 실제 취소 로직은 게이트를 켤 때, 위 환불 정책이 문서로
// 확정된 뒤 구현한다(현재 미확정, 임의 구현 금지).
export async function cancelPortOnePayment(
  _paymentId: string,
  _reason: string
): Promise<PortOnePaymentResult> {
  throw new Error('환불 정책 확정 전이라 아직 구현되지 않았습니다 (registration_*: SOP 그대로 / deep_report: AI 생성 실패 시만)')
}
