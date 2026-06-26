import type { ProjectType, Stage } from '@/components/builder/new-request/types'

export type CompatibilityStatus = 'allowed' | 'disabled' | 'discouraged'

export const COMPATIBILITY: Record<Stage, Record<ProjectType, CompatibilityStatus>> = {
  idea:      { light: 'allowed',     standard: 'allowed'     },
  prototype: { light: 'allowed',     standard: 'allowed'     },
  beta:      { light: 'discouraged', standard: 'allowed'     },
  launched:  { light: 'discouraged', standard: 'allowed'     },
}

export function getCompatibility(
  stage: Stage | null,
  type: ProjectType
): CompatibilityStatus | null {
  if (!stage) return null
  return COMPATIBILITY[stage][type]
}
