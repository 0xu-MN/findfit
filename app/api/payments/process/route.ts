import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/features/flags'
import { verifyPortOnePayment, type PortOneSkuType } from '@/lib/payment/portone'

// 등록 이용료(Light/Standard) + 심층 리포트 결제 트리거 지점에서 공통으로
// 쓰는 라우트. ENABLE_PAYMENT_GATE=false(기본값)면 PortOne을 아예 호출하지
// 않고 즉시 통과시키되 payments row는 status='waived_test'로 남긴다 —
// 나중에 실제 결제 데이터가 쌓이면 이 기간 통과 건들과 비교할 수 있게.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

    const { skuType, amount, projectId, paymentId } = (await req.json()) as {
      skuType?: PortOneSkuType
      amount?: number
      projectId?: string
      paymentId?: string
    }
    if (!skuType || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'skuType/amount가 필요합니다' }, { status: 400 })
    }

    if (!FEATURES.paymentGate) {
      const { data: waived, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          sku_type: skuType,
          project_id: projectId ?? null,
          amount,
          status: 'waived_test',
        })
        .select('id')
        .single()
      if (error) return NextResponse.json({ error: '결제 기록 저장에 실패했습니다' }, { status: 500 })
      return NextResponse.json({ success: true, waived: true, paymentRowId: waived.id })
    }

    // 게이트가 켜진 경우 — 브라우저 PortOne 체크아웃에서 발급된 paymentId 필수
    if (!paymentId) {
      return NextResponse.json({ error: '결제 정보(paymentId)가 필요합니다' }, { status: 400 })
    }

    const verified = await verifyPortOnePayment(paymentId, amount)
    if (!verified.success) {
      await supabase.from('payments').insert({
        user_id: user.id,
        sku_type: skuType,
        project_id: projectId ?? null,
        portone_tx_id: paymentId,
        amount,
        status: 'failed',
      })
      return NextResponse.json({ error: verified.error ?? '결제 검증에 실패했습니다' }, { status: 402 })
    }

    const { data: captured, error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        sku_type: skuType,
        project_id: projectId ?? null,
        portone_tx_id: verified.portoneTxId,
        amount,
        status: 'captured',
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: '결제 기록 저장에 실패했습니다' }, { status: 500 })

    return NextResponse.json({ success: true, waived: false, paymentRowId: captured.id })
  } catch (err) {
    console.error('[payments/process]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
