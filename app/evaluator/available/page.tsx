'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 전체 프로젝트 탐색 화면은 /evaluator/projects로 통합됐다(ProjectCardExpandable
// 재사용, 지원/리뷰 로직까지 그 자리에서 바로 되는 진짜 페이지).
export default function EvaluatorAvailableRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/evaluator/projects')
  }, [router])
  return null
}
