'use client'

import { useRouter } from 'next/navigation'

interface RoleSwitchToggleProps {
  role: 'creator' | 'reviewer'
}

export default function RoleSwitchToggle({ role }: RoleSwitchToggleProps) {
  const router = useRouter()
  const isCreator = role === 'creator'

  return (
    <div className="relative inline-flex items-center p-0.5 rounded-full bg-[#EAEAEA] border border-[#DDD] shadow-inner select-none cursor-pointer transition-all duration-300">
      {/* Active Indicator Sliding Background */}
      <div
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-white transition-all duration-300 ease-in-out ${
          isCreator
            ? 'left-0.5 border-2 border-[#F77019] shadow-[0_2px_6px_rgba(247,112,25,0.25)]'
            : 'left-[calc(50%)] border-2 border-[#1565C0] shadow-[0_2px_6px_rgba(21,101,192,0.25)]'
        }`}
      />

      {/* Creator Button */}
      <button
        type="button"
        onClick={() => !isCreator && router.push('/builder/dashboard')}
        className={`relative z-10 px-3 py-1 rounded-full text-[12px] font-black transition-colors duration-300 leading-none ${
          isCreator ? 'text-[#F77019]' : 'text-[#A0A0A0] hover:text-[#666]'
        }`}
      >
        Creator
      </button>

      {/* Reviewer Button */}
      <button
        type="button"
        onClick={() => isCreator && router.push('/evaluator/dashboard')}
        className={`relative z-10 px-3 py-1 rounded-full text-[12px] font-black transition-colors duration-300 leading-none ${
          !isCreator ? 'text-[#1565C0]' : 'text-[#A0A0A0] hover:text-[#666]'
        }`}
      >
        Reviewer
      </button>
    </div>
  )
}
