import type { Stage } from '@/components/builder/new-request/types'

export function getPsfPmfType(stage: Stage): 'psf' | 'pmf' {
  return stage === 'idea' || stage === 'prototype' ? 'psf' : 'pmf'
}
