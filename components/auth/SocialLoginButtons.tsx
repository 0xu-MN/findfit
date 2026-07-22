'use client'

import { createClient } from '@/lib/supabase/client'

// 구글/카카오 둘 다 Supabase Auth의 signInWithOAuth 한 종류로 처리된다 —
// 실제로 동작하려면 Supabase 대시보드(Authentication > Providers)에서 해당
// provider를 켜고 Google Cloud / Kakao Developers에서 발급한 Client ID·Secret을
// 등록해야 한다. 코드 쪽은 그 설정만 끝나면 바로 동작한다.
export default function SocialLoginButtons() {
  const signInWith = async (provider: 'google' | 'kakao') => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-[#1D1C1C]/8" />
        <span className="text-[10px] font-bold text-[#999]">또는</span>
        <div className="flex-1 h-px bg-[#1D1C1C]/8" />
      </div>

      <button
        type="button"
        onClick={() => signInWith('google')}
        className="w-full py-3 rounded-xl border border-[#1D1C1C]/12 bg-white text-[13px] font-bold text-[#1D1C1C] hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2.5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.19 3.32v2.77h3.55c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.77c-.98.66-2.23 1.06-3.73 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0012 23z" />
          <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 015.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 001 12c0 1.77.43 3.45 1.18 4.94l3.66-2.85z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a10.99 10.99 0 00-9.82 6.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        구글로 계속하기
      </button>

      <button
        type="button"
        onClick={() => signInWith('kakao')}
        className="w-full py-3 rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2.5"
        style={{ background: '#FEE500', color: 'rgba(0,0,0,0.85)' }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.86 5.19 4.66 6.58-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.17-.11 2.65-1.8 3.73-2.53.66.1 1.34.15 2.05.15 5.52 0 10-3.48 10-7.72C22 6.48 17.52 3 12 3z" />
        </svg>
        카카오로 계속하기
      </button>
    </div>
  )
}
