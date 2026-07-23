'use client'

import { useRouter } from 'next/navigation'
import ProfileForm from '@/components/account/ProfileForm'

// 소셜 로그인(구글/카카오)은 이메일/비번 가입 폼을 완전히 건너뛰기 때문에
// 닉네임/실명/전화/생년월일을 수집할 기회가 아예 없었다 — 처음 로그인한
// 소셜 계정(닉네임 없음)은 여기를 거치도록 콜백에서 강제한다.
export default function CompleteProfilePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="text-2xl font-black text-[#1D1C1C]">FindFit</span>
        </div>
        <div className="bg-white rounded-3xl border border-[#1D1C1C]/8 p-8 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-black text-[#1D1C1C] text-center">프로필 마저 설정하기</h1>
          <ProfileForm mode="onboarding" onDone={() => router.push('/auth/role-select')} />
        </div>
      </div>
    </div>
  )
}
