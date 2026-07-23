import { redirect } from 'next/navigation'

// 참여 가능 의뢰 피드는 /evaluator/dashboard(통합 단일화면)에 흡수됐다.
// 기존 링크/북마크 호환을 위해 리다이렉트만 남겨둔다.
export default function AvailableRedirect() {
  redirect('/evaluator/dashboard')
}
