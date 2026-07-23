import { redirect } from 'next/navigation'

// 리뷰 작성 화면은 /evaluator/dashboard의 카드 인라인 확장(ReviewFormPanel)
// 으로 흡수됐다. 승인 이메일에 박힌 기존 링크 호환을 위해 리다이렉트만
// 남겨둔다.
export default function ReviewFormRedirect() {
  redirect('/evaluator/dashboard')
}
