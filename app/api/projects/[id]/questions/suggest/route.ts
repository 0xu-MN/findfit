import { generateQuestionSuggestions, type CreatorLevel } from '@/lib/ai/index'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase: AnySupabase = await createClient()

    // 프로젝트 정보 조회
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 추가된 질문 조회
    const { data: existingQuestions } = await supabase
      .from('review_questions')
      .select('question_text')
      .eq('project_id', id)

    // 필수 질문 (잠금 블록): PSF면 PSF 4개, PMF면 Sean Ellis
    const requiredQuestions =
      project.psf_pmf_type === 'psf'
        ? [
            { question_text: '이 문제를 직접 겪어보신 적이 있나요?' },
            { question_text: '현재는 이 문제를 어떻게 해결하고 계신가요?' },
            { question_text: '이런 솔루션이 있다면 사용해보시겠어요?' },
            { question_text: '이 문제는 얼마나 자주 발생하나요?' },
          ]
        : [
            { question_text: '이 제품/서비스를 더 이상 사용할 수 없게 된다면 어떤 기분이 들겠습니까?' },
          ]

    const remainingSlots = Math.max(
      0,
      (project.psf_pmf_type === 'psf' ? 5 : 9) - (existingQuestions?.length ?? 0)
    )

    if (remainingSlots === 0) {
      return NextResponse.json({ suggestions: [], remainingSlots: 0 })
    }

    const projectForSuggest = {
      title: project.title ?? '',
      one_liner: project.one_liner ?? '',
      category: (project.categories ?? [])[0] ?? '',
      stage: project.stage ?? '',
      problem: project.problem ?? '',
      solution: project.solution ?? project.our_difference ?? '',
      target_jobs: project.target_jobs ?? [],
      target_age_range: project.target_age_range ?? '',
      project_type: project.project_type ?? 'standard',
    }

    const creatorLevel: CreatorLevel = project.creator_level ?? 'seed'
    const suggestions = await generateQuestionSuggestions(
      projectForSuggest,
      requiredQuestions,
      existingQuestions ?? [],
      remainingSlots,
      creatorLevel
    )

    return NextResponse.json({ suggestions, remainingSlots })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
