'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 프로필 설정 페이지는 통합 설정 페이지(/evaluator/settings)로 통합되었습니다.
export default function EvaluatorProfilePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/evaluator/settings?tab=profile')
  }, [router])
  return null
}
