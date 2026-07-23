import { redirect } from 'next/navigation'

// 참여 리뷰 목록은 /evaluator/dashboard(통합 단일화면)에 상태 배지로
// 흡수됐다. 기존 링크/북마크 호환을 위해 리다이렉트만 남겨둔다.
export default function ReviewsRedirect() {
  redirect('/evaluator/dashboard')
}
