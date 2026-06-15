import { createClient } from '@/lib/supabase/client'
import type { ProjectType } from '@/components/builder/new-request/types'

export type QuestionTemplate = {
  id: string
  project_type: ProjectType
  psf_pmf_type: 'psf' | 'pmf'
  is_required: boolean
  question_text: string
  question_type: string
  options: string[] | null
  order_index: number
  meta: { phase?: string; editable_by_creator?: boolean } | null
}

export type QuestionSet = {
  required: QuestionTemplate[]
  recommended: QuestionTemplate[]
  remainingSlots: number
}

export async function getQuestionSet(
  projectType: ProjectType,
  psfPmfType: 'psf' | 'pmf'
): Promise<QuestionSet> {
  const supabase = createClient()
  const maxQuestions: Record<ProjectType, number> = { light: 5, standard: 9, deep: 9 }

  const { data: required = [] } = await supabase
    .from('question_templates')
    .select('*')
    .eq('project_type', projectType)
    .eq('psf_pmf_type', psfPmfType)
    .eq('is_required', true)
    .order('order_index')

  let allRequired = [...(required ?? [])]

  // Deep + PMF: Sean Ellis도 함께 조회해서 합침
  if (projectType === 'deep' && psfPmfType === 'pmf') {
    const { data: seanEllis = [] } = await supabase
      .from('question_templates')
      .select('*')
      .eq('project_type', 'standard')
      .eq('psf_pmf_type', 'pmf')
      .eq('is_required', true)
    allRequired = [...allRequired, ...(seanEllis ?? [])]
  }

  const { data: recommended = [] } = await supabase
    .from('question_templates')
    .select('*')
    .eq('project_type', projectType)
    .eq('psf_pmf_type', psfPmfType)
    .eq('is_required', false)
    .order('order_index')

  return {
    required: allRequired,
    recommended: recommended ?? [],
    remainingSlots: maxQuestions[projectType] - allRequired.length,
  }
}
