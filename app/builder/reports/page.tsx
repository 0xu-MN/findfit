import { redirect } from 'next/navigation'

// 리포트 목록은 프로젝트 작업공간(/builder/projects) 안 "리포트" 메뉴로
// 흡수됐다. 기존 링크/북마크 호환을 위해 리다이렉트만 남겨둔다.
export default function BuilderReportsRedirect() {
  redirect('/builder/projects?view=reports')
}
