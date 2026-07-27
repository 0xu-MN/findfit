'use client'

import { useRouter } from 'next/navigation'

interface RoleSwitchToggleProps {
  role: 'creator' | 'reviewer'
}

export default function RoleSwitchToggle({ role }: RoleSwitchToggleProps) {
  const router = useRouter()
  const isCreator = role === 'creator'

  return (
    <div className="relative inline-flex items-center h-11 p-1 rounded-full bg-[#EAEAEA] border border-[#DDD] shadow-inner select-none cursor-pointer transition-all duration-300">
      {/* Active Indicator Sliding Background */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white transition-all duration-300 ease-in-out ${
          isCreator
            ? 'left-1 border-2 border-[#F77019] shadow-[0_2px_6px_rgba(247,112,25,0.25)]'
            : 'left-[calc(50%)] border-2 border-[#189DF7] shadow-[0_2px_6px_rgba(21,101,192,0.25)]'
        }`}
      />

      {/* Creator Button — h-full로 인디케이터(top-1 bottom-1)와 픽셀 단위로 높이를 맞춰야
          텍스트가 정확히 중앙에 온다(패딩만으로 높이를 암묵적으로 정하면 서브픽셀
          단위로 어긋나 보일 수 있었음) */}
      <button
        type="button"
        onClick={() => !isCreator && router.push('/builder/dashboard')}
        className={`relative z-10 h-full px-5 rounded-full text-[13px] font-black transition-colors duration-300 leading-none inline-flex items-center justify-center ${
          isCreator ? 'text-[#F77019]' : 'text-[#A0A0A0] hover:text-[#666]'
        }`}
      >
        Creator
      </button>

      {/* Reviewer Button */}
      <button
        type="button"
        onClick={() => isCreator && router.push('/evaluator/dashboard')}
        className={`relative z-10 h-full px-5 rounded-full text-[13px] font-black transition-colors duration-300 leading-none inline-flex items-center justify-center ${
          !isCreator ? 'text-[#189DF7]' : 'text-[#A0A0A0] hover:text-[#666]'
        }`}
      >
        Reviewer
      </button>
    </div>
  )
}
