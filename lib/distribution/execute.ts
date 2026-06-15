import { createClient } from '@/lib/supabase/client'
import { calcSettlement } from './tax'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export type Allocation = {
  reviewer_id: string
  nickname: string
  amount: number
}

export type DistributionMethod = 'equal' | 'differential' | 'top_n' | 'custom'

type ReviewerPortoneInfo = {
  id: string
  portone_partner_id: string | null
  is_account_verified: boolean
}

async function getReviewerPortoneInfo(reviewerIds: string[]): Promise<ReviewerPortoneInfo[]> {
  const supabase: AnySupabase = createClient()
  const { data } = await supabase
    .from('reviewer_profiles')
    .select('id:user_id, portone_partner_id, is_account_verified')
    .in('user_id', reviewerIds)
  return (data ?? []) as ReviewerPortoneInfo[]
}

// PortOne 지급대행 — 실제 연동 전 Mock
async function mockPortoneBulkTransfer(
  transfers: { partnerId: string; amount: number; memo: string }[]
): Promise<{ success: boolean; transfer_id: string }[]> {
  return transfers.map((_, i) => ({
    success: true,
    transfer_id: `mock-transfer-${Date.now()}-${i}`,
  }))
}

export async function executeDistribution(
  projectId: string,
  budget: number,
  method: DistributionMethod,
  allocations: Allocation[]
): Promise<void> {
  const supabase: AnySupabase = createClient()

  // 1. distributions 레코드 생성 (세금 계산 포함)
  await supabase.from('distributions').insert(
    allocations.map((a) => {
      const { withholding_tax, net_amount } = calcSettlement(a.amount)
      return {
        project_id: projectId,
        reviewer_id: a.reviewer_id,
        nickname: a.nickname,
        amount: a.amount,
        withholding_tax,
        net_amount,
        status: 'pending',
      }
    })
  )

  // 2. PortOne 계좌 등록 여부로 분리
  const reviewers = await getReviewerPortoneInfo(allocations.map((a) => a.reviewer_id))
  const registered = reviewers.filter((r) => r.is_account_verified)
  const unregistered = reviewers.filter((r) => !r.is_account_verified)

  // 3. 등록된 리뷰어 → PortOne 즉시 지급 (현재는 Mock)
  if (registered.length > 0) {
    const transfers = registered.map((r) => ({
      partnerId: r.portone_partner_id!,
      amount: allocations.find((a) => a.reviewer_id === r.id)!.amount,
      memo: 'FindFit 사례금',
    }))
    const results = await mockPortoneBulkTransfer(transfers)
    for (let i = 0; i < registered.length; i++) {
      await supabase
        .from('distributions')
        .update({
          status: 'completed',
          portone_transfer_id: results[i]?.transfer_id,
          paid_at: new Date().toISOString(),
        })
        .eq('reviewer_id', registered[i].id)
        .eq('project_id', projectId)
    }
  }

  // 4. 미등록 리뷰어 → pending_registration 처리
  if (unregistered.length > 0) {
    await supabase
      .from('distributions')
      .update({ status: 'pending_registration' })
      .in('reviewer_id', unregistered.map((r) => r.id))
      .eq('project_id', projectId)
  }

  // 5. 프로젝트 상태 완료 처리
  await supabase
    .from('projects')
    .update({
      distribution_method: method,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', projectId)
}
