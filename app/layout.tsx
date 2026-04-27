import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FindFit — PSF·PMF 검증 플랫폼',
  description: '72시간 안에 전문 평가단의 AI 분석 리포트로 아이디어를 검증하세요.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
