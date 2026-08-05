'use client'

import { Wallet } from 'lucide-react'
import CreatorLayout from '@/components/creator/CreatorLayout'

// FIT 크레딧(캐시) 시스템은 존속/폐지 여부가 아직 확정되지 않았다 —
// 확정 전까지는 기존 잔액/거래내역 UI 대신 "준비중" 안내만 보여준다.
// 실제 조회/렌더링 로직(credit_transactions 등)은 지우지 않고 git 히스토리에
// 남겨뒀으니, 존속이 확정되면 이전 커밋에서 그대로 복원하면 된다.
export default function BuilderWalletPage() {
  return (
    <CreatorLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F77019]/10 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-[#F77019]" />
        </div>
        <h1 className="text-lg font-black text-[#1D1C1C]">준비 중이에요</h1>
        <p className="text-[12px] font-bold text-[#999] max-w-xs leading-relaxed">
          이 기능은 현재 개편을 검토하고 있어요. 정식 오픈되면 다시 안내해드릴게요.
        </p>
      </div>
    </CreatorLayout>
  )
}
