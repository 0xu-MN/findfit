'use client'

import { Sparkles, ArrowRight, Lightbulb, FileEdit } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Step0ModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function Step0Modal({ isOpen, onClose }: Step0ModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleExplore = () => {
    // Navigate to dashboard with agent exploration flags
    router.push('/builder/dashboard?agent=explore&from=new_project')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
      style={{
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full max-w-[680px] rounded-[32px] border border-[#F77019]/15 bg-white/90 p-8 md:p-10 flex flex-col items-center shadow-[0_32px_80px_rgba(247,112,25,0.08)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#F77019]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#F77019]/5 blur-3xl pointer-events-none" />

        {/* Top Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white"
          style={{
            background: 'linear-gradient(135deg, #F77019, #FF8F45)',
            boxShadow: '0 8px 24px rgba(247,112,25,0.25)',
          }}
        >
          <Sparkles className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-black text-[#1D1C1C] mb-2 tracking-tight text-center">
          어떻게 검증을 시작할까요?
        </h3>
        <p className="text-[12px] md:text-[13px] text-[#666] font-medium leading-relaxed mb-8 text-center max-w-[420px]">
          아이디어가 구체적이지 않다면 에이전트와의 대화로 다듬고, 이미 완성된 아이디어는 즉시 상세 의뢰를 작성할 수 있습니다.
        </p>

        {/* Two Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
          {/* Option A: 아이템 탐색 */}
          <div
            onClick={handleExplore}
            className="group rounded-[24px] border border-[#1D1C1C]/8 bg-white p-6 flex flex-col gap-4 hover:border-[#F77019]/35 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F77019]/8 flex items-center justify-center text-[#F77019] group-hover:bg-[#F77019] group-hover:text-white transition-all">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[15px] font-black text-[#1D1C1C] group-hover:text-[#F77019] transition-all">
                🔍 아이템 탐색부터 시작
              </h4>
              <p className="text-[11px] text-[#666] font-medium leading-relaxed">
                FindFit Agent와 대화하며 요즘 트렌드를 분석하고 경쟁사 레퍼런스를 탐색한 뒤 의뢰를 진행합니다.
              </p>
            </div>
            <div className="mt-auto pt-2 flex items-center gap-1.5 text-[11px] font-black text-[#F77019]">
              에이전트와 시작하기 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Option B: 아이템 있어요 */}
          <div
            onClick={onClose}
            className="group rounded-[24px] border border-[#1D1C1C]/8 bg-white p-6 flex flex-col gap-4 hover:border-[#F77019]/35 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F77019]/8 flex items-center justify-center text-[#F77019] group-hover:bg-[#F77019] group-hover:text-white transition-all">
              <FileEdit className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[15px] font-black text-[#1D1C1C] group-hover:text-[#F77019] transition-all">
                ✅ 아이템이 이미 있어요
              </h4>
              <p className="text-[11px] text-[#666] font-medium leading-relaxed">
                준비된 비즈니스 기획서나 구체적인 아이디어가 있어 곧바로 상세 검증 의뢰서를 작성합니다.
              </p>
            </div>
            <div className="mt-auto pt-2 flex items-center gap-1.5 text-[11px] font-black text-[#F77019]">
              바로 등록하러 가기 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
