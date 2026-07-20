'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'

export default function RoleSelectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<UserRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectRole = async (role: 'builder' | 'evaluator') => {
    setLoading(role)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // 이미 역할이 정해진 유저는 이 화면을 통해 임의로 역할을 바꿀 수 없다
    // (크리에이터/리뷰어 신원·활동 이력이 역할에 묶여 있어, 재선택은
    // 관리자 개입이 필요한 예외 상황으로 취급한다)
    const { data: existing } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (existing?.role) {
      setError('이미 역할이 설정된 계정입니다. 변경이 필요하면 관리자에게 문의해주세요.')
      setLoading(null)
      return
    }

    const { error: updateError } = await supabase.from('users').update({ role }).eq('id', user.id)
    if (updateError) {
      setError(updateError.message)
      setLoading(null)
      return
    }

    // 역할별 프로필 row가 없으면 생성
    if (role === 'builder') {
      await supabase.from('builder_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id' })
      router.push('/builder/dashboard')
    } else {
      await supabase.from('reviewer_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id' })
      router.push('/evaluator/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
          <p className="text-[12px] font-bold text-[#666]">어떤 역할로 시작하시겠어요?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => selectRole('builder')}
            disabled={loading !== null}
            className="flex flex-col items-start gap-2 rounded-3xl border-2 border-[#1D1C1C]/10 bg-white p-6 text-left hover:border-[#F77019] transition-colors disabled:opacity-50"
          >
            <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">
              Creator
            </span>
            <span className="text-lg font-black text-[#1D1C1C]">크리에이터</span>
            <span className="text-[11px] font-bold text-[#999] leading-relaxed">
              내 제품/서비스를 검증받고 리포트를 받아요
            </span>
            {loading === 'builder' && <span className="text-[10px] font-bold text-[#F77019]">이동 중...</span>}
          </button>

          <button
            onClick={() => selectRole('evaluator')}
            disabled={loading !== null}
            className="flex flex-col items-start gap-2 rounded-3xl border-2 border-[#1D1C1C]/10 bg-white p-6 text-left hover:border-[#1565C0] transition-colors disabled:opacity-50"
          >
            <span className="text-[10px] font-black text-[#1565C0] bg-[#1565C0]/10 px-2 py-0.5 rounded">
              Reviewer
            </span>
            <span className="text-lg font-black text-[#1D1C1C]">리뷰어</span>
            <span className="text-[11px] font-bold text-[#999] leading-relaxed">
              제품을 체험하고 리뷰를 남겨 사례금을 받아요
            </span>
            {loading === 'evaluator' && <span className="text-[10px] font-bold text-[#1565C0]">이동 중...</span>}
          </button>
        </div>

        {error && (
          <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
