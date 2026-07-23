'use client'

import DashboardLayout from '@/components/shared/DashboardLayout'
import SharedLoungeFeed from '@/components/shared/SharedLoungeFeed'
import ProfileForm from '@/components/account/ProfileForm'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function EvaluatorAccountPage() {
  const [saved, setSaved] = useState(false)
  return (
    <DashboardLayout role="reviewer" rightPanel={<SharedLoungeFeed />}>
      <div className="flex flex-col gap-5 max-w-xl">
        <h1 className="text-xl font-black">계정 설정</h1>
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <ProfileForm mode="settings" onDone={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} />
          {saved && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> 저장했어요
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
