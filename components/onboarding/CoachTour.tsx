'use client'

import { useEffect, useState } from 'react'

export type CoachStep = {
  // 강조할 실제 화면 요소의 CSS selector — data-coach="xxx" 속성을 대상
  // 요소에 붙여서 참조한다(클래스명은 자주 바뀌어서 안정적이지 않음).
  target: string
  title: string
  text: string
  // 말풍선이 스포트라이트 기준으로 어디에 붙을지
  placement?: 'top' | 'bottom'
}

type Props = {
  steps: CoachStep[]
  storageKey: string
  accentColor?: string
  // 계정 기준으로 "이 역할은 처음이다"를 서버에서 판단해 강제로 다시 보여줄
  // 때 쓴다(로그인/브라우저가 바뀌어도 계정별로 정확함 — localStorage
  // 플래그는 브라우저 단위라 크리에이터로만 쓰던 계정이 리뷰어를 처음 눌러도
  // 안 뜨는 문제가 있었다). undefined면 기존처럼 localStorage만 본다.
  forceShow?: boolean
  onShown?: () => void
}

// 신규 유저 온보딩 코치마크 투어 — 실제 화면 요소(data-coach 속성이 붙은
// DOM)를 스포트라이트(box-shadow 컷아웃)로 강조하고, 그 옆에 설명 말풍선을
// 띄운다. localStorage에 한 번 완료/스킵하면 다시 안 뜨는 단순 플래그만
// 쓴다(계정별 서버 저장까지는 이번 범위 밖 — 새 브라우저/시크릿모드에서는
// 다시 뜰 수 있음, 큰 문제 아니라고 판단).
export default function CoachTour({ steps, storageKey, accentColor = '#F77019', forceShow, onShown }: Props) {
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (forceShow === false) return
    if (!forceShow && localStorage.getItem(storageKey) === 'true') return
    // 대상 요소들이 렌더링될 시간을 살짝 준다(데이터 로딩 후 마운트되는 경우 대비)
    const t = setTimeout(() => {
      setActive(true)
      onShown?.()
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceShow])

  useEffect(() => {
    if (!active) return
    const step = steps[stepIdx]
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el) {
      // 대상이 이 페이지에 없으면(다른 화면 상태 등) 이 스텝은 건너뜀
      handleNext()
      return
    }
    const updateRect = () => setRect(el.getBoundingClientRect())
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx])

  const finish = () => {
    localStorage.setItem(storageKey, 'true')
    setActive(false)
  }

  const handleNext = () => {
    setStepIdx((i) => {
      const next = i + 1
      if (next >= steps.length) {
        finish()
        return i
      }
      return next
    })
  }

  if (!active || !rect) return null

  const step = steps[stepIdx]
  const bubbleHeight = 140
  // 지정한 방향으로 띄웠을 때 화면 밖으로 나가면 반대쪽으로 자동 전환
  // (예: 우하단 고정 버튼처럼 화면 끝에 붙은 요소는 'bottom'이 항상 잘림)
  const preferred = step.placement ?? 'bottom'
  const placement =
    preferred === 'bottom' && rect.bottom + bubbleHeight > window.innerHeight
      ? 'top'
      : preferred === 'top' && rect.top - bubbleHeight < 0
        ? 'bottom'
        : preferred
  const pad = 8
  const spotStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: 14,
    boxShadow: '0 0 0 9999px rgba(15,23,42,0.62)',
    zIndex: 200,
    pointerEvents: 'none',
    transition: 'all .3s cubic-bezier(.4,0,.2,1)',
  }
  const bubbleTop = placement === 'bottom' ? rect.bottom + pad + 12 : undefined
  const bubbleBottom = placement === 'top' ? window.innerHeight - rect.top + pad + 12 : undefined
  const bubbleLeft = Math.min(Math.max(rect.left, 16), window.innerWidth - 296)

  return (
    <>
      <div style={spotStyle} />
      <div
        style={{
          position: 'fixed',
          top: bubbleTop,
          bottom: bubbleBottom,
          left: bubbleLeft,
          zIndex: 201,
          width: 280,
          transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        }}
        className="bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.2)] p-4 flex flex-col gap-2"
      >
        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: accentColor }}>
          {stepIdx + 1} / {steps.length}
        </span>
        <p className="text-[13px] font-black text-[#1D1C1C]">{step.title}</p>
        <p className="text-[11px] text-[#666] font-medium leading-relaxed">{step.text}</p>
        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            onClick={finish}
            className="text-[10px] font-bold text-[#999] hover:text-[#666] transition-colors"
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="text-[11px] font-black text-white px-3.5 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            style={{ background: accentColor }}
          >
            {stepIdx === steps.length - 1 ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </>
  )
}
