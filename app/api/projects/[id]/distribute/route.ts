import { executeDistribution, type Allocation, type DistributionMethod } from '@/lib/distribution/execute'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MIN_AMOUNT = 5000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { method, allocations }: { method: DistributionMethod; allocations: Allocation[] } =
      await req.json()

    const supabase: AnySupabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select('status, distribution_method, incentive_budget')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (project.status !== 'reviewing' || project.distribution_method) {
      return NextResponse.json(
        { error: '이미 배분이 처리되었거나 배분 가능한 상태가 아닙니다' },
        { status: 400 }
      )
    }

    const total = allocations.reduce((sum: number, a: Allocation) => sum + a.amount, 0)
    if (total !== project.incentive_budget) {
      return NextResponse.json(
        { error: '배분 금액 합계가 총 예산과 일치하지 않습니다' },
        { status: 400 }
      )
    }
    if (allocations.some((a: Allocation) => a.amount < MIN_AMOUNT)) {
      return NextResponse.json(
        { error: `인당 최소 ${MIN_AMOUNT.toLocaleString('ko-KR')}원 이상이어야 합니다` },
        { status: 400 }
      )
    }

    await executeDistribution(id, project.incentive_budget, method, allocations)

    return NextResponse.json({ message: '배분이 완료되었습니다' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
