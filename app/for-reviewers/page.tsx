'use client'

import { useRouter } from 'next/navigation'
import ReviewerLanding from '@/components/landing/ReviewerLanding'

// 푸터 "리뷰어" 링크 전용 진입점 — 루트 랜딩(app/page.tsx)이 이미 갖고 있는
// 리뷰어 소개 뷰(ReviewerLanding)를 그대로 재사용해서, 클라이언트 상태
// 토글 없이 이 URL로 바로 들어와도 같은 화면이 뜨게 한다.
export default function ForReviewersPage() {
  const router = useRouter()
  return <ReviewerLanding onSwitchToCreator={() => router.push('/')} />
}
