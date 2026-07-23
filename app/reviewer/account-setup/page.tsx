import { redirect } from 'next/navigation'

// 계좌 등록은 포인트 지갑(/evaluator/wallet) 화면 안 카드로 합쳐졌다.
// 기존 링크/북마크가 죽지 않도록 리다이렉트만 남겨둔다.
export default function AccountSetupRedirect() {
  redirect('/evaluator/wallet')
}
