'use client'

import { Check } from 'lucide-react'

export type StepperEntry = { step: number; label: string }

type Props = {
  steps: StepperEntry[]
  currentStep: number
  onJump?: (step: number) => void
}

export default function Stepper({ steps, currentStep, onJump }: Props) {
  return (
    <div className="flex items-center gap-2 w-full max-w-[820px] text-[10px] font-bold pl-3 pr-2 py-3">
      {steps.map((s, i, arr) => {
        const active = s.step === currentStep
        const passed = s.step < currentStep
        const clickable = !!onJump && passed
        return (
          <div key={s.step} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              disabled={!clickable && !active}
              onClick={() => clickable && onJump?.(s.step)}
              className="relative flex items-center justify-center flex-shrink-0"
              aria-current={active ? 'step' : undefined}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-full bg-[#F77019]/40 animate-tight-ping pointer-events-none"
                  aria-hidden="true"
                />
              )}

              <span
                className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                  active
                    ? 'bg-[#F77019] ring-2 ring-[#F77019]/30 shadow-[0_0_12px_rgba(247,112,25,0.5)]'
                    : passed
                      ? 'bg-[#F77019] cursor-pointer hover:scale-110'
                      : 'bg-[#E5E5E5] text-[#999]'
                }`}
              >
                {passed ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : (
                  <span>{s.step}</span>
                )}
              </span>
            </button>

            {/* 단계 라벨 — 모바일에서 5~6단계 라벨이 whitespace-nowrap으로
                줄바꿈을 못 해 화면 밖으로 넘치던 문제가 있어, 좁은 화면에선
                숫자 동그라미+연결선만 남기고 라벨 텍스트는 숨긴다. */}
            <span
              className={`hidden sm:inline whitespace-nowrap transition-colors ${
                active ? 'text-[#F77019] font-black' : passed ? 'text-[#F77019]/80' : 'text-[#999]'
              }`}
            >
              {s.label}
            </span>

            {i !== arr.length - 1 && (
              <div className="flex-1 h-[2px] ml-2 rounded-full overflow-hidden bg-[#EEEEEE]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-[#F77019] w-full' : active ? 'bg-[#F77019] w-1/2' : 'bg-transparent w-0'}`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
