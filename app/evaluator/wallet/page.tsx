'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 포인트 지갑 페이지는 통합 설정 페이지(/evaluator/settings)로 통합되었습니다.
export default function EvaluatorWalletPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/evaluator/settings?tab=wallet')
  }, [router])
  return null
}
