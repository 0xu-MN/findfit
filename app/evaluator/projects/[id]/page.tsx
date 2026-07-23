import { redirect } from 'next/navigation'

// 프로젝트 상세+지원 화면은 /evaluator/dashboard의 카드 인라인 확장으로
// 흡수됐다. 기존 링크/북마크 호환을 위해 리다이렉트만 남겨둔다.
export default function ProjectDetailRedirect() {
  redirect('/evaluator/dashboard')
}
