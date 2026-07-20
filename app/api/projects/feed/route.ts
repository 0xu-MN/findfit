import { ESTIMATED_TIME } from '@/lib/constants/projectType'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

type Project = {
  id: string
  title: string
  one_liner: string
  categories: string[]
  project_type: 'light' | 'standard' | 'deep'
  status: string
  completed_count: number
  target_count: number
  incentive_exists: boolean
  incentive_budget: number | null
  distribution_method: string | null
  created_at: string
  [key: string]: unknown
}

type ReviewerProfile = {
  domain_tags: string[] | null
  level: string | null
}

type ScoredProject = Project & {
  matchScore: number
  estimatedTime: string
}

function computeMatchScore(project: Project, reviewer: ReviewerProfile | null): number {
  let score = 0
  if (reviewer?.domain_tags?.some((tag) => project.categories?.includes(tag))) score += 50
  if (project.incentive_exists) score += 20
  if (reviewer?.level && ['fitter', 'master_fit'].includes(reviewer.level) && project.incentive_exists) score += 10
  if ((project.target_count - project.completed_count) <= 3) score += 5
  return score
}

function groupByCategory(projects: ScoredProject[]): Record<string, ScoredProject[]> {
  return projects.reduce((acc, p) => {
    const cat = p.categories?.[0] ?? '기타'
    ;(acc[cat] ??= []).push(p)
    return acc
  }, {} as Record<string, ScoredProject[]>)
}

export async function GET() {
  try {
    const supabase: AnySupabase = await createClient()

    // 현재 리뷰어 프로필 조회 (로그인 안 돼도 피드는 표시)
    let reviewer: ReviewerProfile | null = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('reviewer_profiles')
        .select('domain_tags, level')
        .eq('user_id', user.id)
        .single()
      reviewer = profile
    }

    // projects_public 뷰 사용 — creator_id를 뺀 컬럼만 노출 (migration 009)
    const { data: projects } = await supabase
      .from('projects_public')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const open = (projects ?? []).filter(
      (p: Project) => p.completed_count < p.target_count
    )

    const scored: ScoredProject[] = open
      .map((p: Project) => ({
        ...p,
        matchScore: computeMatchScore(p, reviewer),
        estimatedTime: ESTIMATED_TIME[p.project_type as keyof typeof ESTIMATED_TIME] ?? '—',
      }))
      .sort((a: ScoredProject, b: ScoredProject) => b.matchScore - a.matchScore)

    return NextResponse.json({
      recommended: scored.slice(0, 5),
      byCategory: groupByCategory(scored),
      all: scored,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
