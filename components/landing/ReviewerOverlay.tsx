'use client'

import { useEffect } from 'react'
import { X, Check, ArrowRight } from 'lucide-react'
import RoleSection from './RoleSection'

const valueProps = [
  { text: '내 관심 분야 제품만 골라서 리뷰' },
  { text: '리뷰 하나에 500~3,000원 포인트' },
  { text: '아직 출시 안 된 신제품 선행 접근' },
  { text: '내 피드백이 실제 제품을 바꿨다는 알림' },
]

interface Props {
  visible: boolean
  onClose: () => void
}

export default function ReviewerOverlay({ visible, onClose }: Props) {
  // 오버레이 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  return (
    <>
      {/* 딤드 배경 */}
      <div
        className="fixed inset-0 z-[90] transition-all duration-500"
        style={{
          background: 'rgba(0,0,0,0.35)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          backdropFilter: visible ? 'blur(4px)' : 'none',
        }}
        onClick={onClose}
      />

      {/* 슬라이드 오버레이 패널 */}
      <div
        className="fixed top-0 right-0 h-full z-[100] overflow-y-auto"
        style={{
          width: '100%',
          maxWidth: '1000px',
          background: '#F8F8F8',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '-12px 0 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* 오버레이 헤더 */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-12 py-5"
          style={{
            background: 'rgba(248,248,248,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <span className="text-xl font-bold text-[#F77019]">FindFit</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#999]">리뷰어 입장 보기</span>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-[#1D1C1C]" />
            </button>
          </div>
        </div>

        {/* 리뷰어 히어로 */}
        <div className="px-12 pt-16 pb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1565C0] mb-5">Reviewer</p>
          <h2
            className="font-bold leading-tight text-[#1D1C1C] mb-6"
            style={{ fontSize: 'clamp(36px, 4vw, 60px)' }}
          >
            신제품을 남들보다<br />
            먼저 보고 싶다면?
          </h2>
          <p className="text-lg text-[#666] leading-relaxed mb-10 max-w-[480px]">
            당신의 경험이 누군가의 출시 결정을 바꿉니다.<br />
            전문성을 살려 부수입까지 얻어보세요.
          </p>

          {/* 체크리스트 */}
          <div className="flex flex-col gap-4 mb-10">
            {valueProps.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1565C0' }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-base text-[#1D1C1C]">{item.text}</span>
              </div>
            ))}
          </div>

          <button
            className="flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-full text-base transition-all hover:scale-[1.03]"
            style={{ background: '#1565C0', boxShadow: '0 4px 24px rgba(21,101,192,0.3)' }}
          >
            평가단 신청하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-[#1D1C1C]/8 mx-12" />

        {/* 크리에이터 섹션으로 유도 — RoleSection 재사용 */}
        <div className="pt-8 pb-4 px-12">
          <p className="text-sm text-[#999] mb-2">의뢰자 입장이 더 궁금하다면?</p>
          <button
            className="flex items-center gap-2 text-[#F77019] font-semibold text-base hover:underline transition-all"
            onClick={onClose}
          >
            ← 크리에이터로 알아보기
          </button>
        </div>

        {/* 오버레이 안에 RoleSection 재사용 (크리에이터 패널 클릭 → 오버레이 닫기) */}
        <div className="mt-4">
          <RoleSection onSeeCreator={onClose} />
        </div>

      </div>
    </>
  )
}
