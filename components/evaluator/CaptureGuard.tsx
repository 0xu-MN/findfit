'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

// 프로젝트 상세 설명은 크리에이터의 미공개 사업 정보라 외부 유출을 막아야
// 한다. 브라우저에서 스크린샷 자체를 원천 차단하는 건 불가능하지만(OS
// 레벨 기능이라 웹앱이 막을 수 없음), 아래 조합으로 "그대로 캡처해서
// 유출하기 번거롭게" 만드는 억제책을 적용한다:
//  - 텍스트 드래그/선택, 우클릭(다른 이름으로 저장 등), 인쇄 차단
//  - 탭 전환/창 비활성화 시(스크린샷 도구 실행 등으로 포커스가 빠질 때)
//    즉시 블러 처리 — 스크린샷 툴이 뜬 순간 내용이 안 보이게 됨
//  - 리뷰어 식별 정보(닉네임/이메일) 워터마크를 화면 전체에 옅게 깔아서,
//    설령 캡처되더라도 유출 경로 추적이 가능하게 함
export default function CaptureGuard({ children, watermarkLabel }: { children: React.ReactNode; watermarkLabel: string }) {
  const [blurred, setBlurred] = useState(false)

  useEffect(() => {
    const handleBlur = () => setBlurred(true)
    const handleFocus = () => setBlurred(false)
    const handleVisibility = () => setBlurred(document.visibilityState !== 'visible')
    const preventContext = (e: MouseEvent) => e.preventDefault()
    const preventPrint = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 's')) e.preventDefault()
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('contextmenu', preventContext)
    document.addEventListener('keydown', preventPrint)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('contextmenu', preventContext)
      document.removeEventListener('keydown', preventPrint)
    }
  }, [])

  return (
    <div
      className="relative select-none"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      onCopy={(e) => e.preventDefault()}
    >
      {/* 반복 워터마크 오버레이 */}
      <div
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] flex flex-wrap content-start overflow-hidden"
        aria-hidden="true"
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="text-[11px] font-black text-[#1D1C1C] whitespace-nowrap m-6"
            style={{ transform: 'rotate(-24deg)' }}
          >
            {watermarkLabel}
          </span>
        ))}
      </div>

      <div className={blurred ? 'blur-2xl transition-all duration-150' : 'transition-all duration-150'}>
        {children}
      </div>

      {blurred && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-[#666]">
            <ShieldAlert className="w-6 h-6" />
            <span className="text-[11px] font-bold">비공개 정보 보호를 위해 화면이 가려졌어요</span>
          </div>
        </div>
      )}
    </div>
  )
}
