'use client'

import { CheckCircle2, FileText, LayoutDashboard } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type CompletedProject = {
  id: string
  title: string
  project_type: string
  target_count: number
  deadline: string | null
  created_at: string
}

export default function CompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [data, setData] = useState<CompletedProject | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from('projects')
      .select('id, title, project_type, target_count, deadline, created_at')
      .eq('id', id)
      .single()
      .then(({ data: row }) => setData((row as CompletedProject) ?? null))
  }, [id])

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 py-12 text-[#1D1C1C]">
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        {/* 성공 아이콘 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#F77019]/10 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-[#F77019]" strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 rounded-full bg-[#F77019]/20 animate-ping" />
        </div>

        {/* 메인 메시지 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-black">의뢰가 접수되었습니다 🎉</h1>
          <p className="text-[12px] font-bold text-[#666] leading-relaxed max-w-md">
            지금부터 관심 카테고리가 일치하는 평가단에게 자동으로 매칭이 시작됩니다.
            <br />
            결과는 완료 기한 내에 AI 리포트로 받아보실 수 있어요.
          </p>
        </div>

        {/* 요약 카드 */}
        {data && (
          <div className="w-full rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black">접수 정보</h3>
              <span className="text-[10px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-1 rounded">매칭 대기중</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <Item label="제품명" value={data.title || '—'} />
              <Item
                label="프로젝트 타입"
                value={
                  data.project_type === 'light'
                    ? 'Light'
                    : data.project_type === 'standard'
                      ? 'Standard'
                      : data.project_type === 'deep'
                        ? 'Deep'
                        : '—'
                }
              />
              <Item
                label="평가단"
                value={data.project_type === 'light' ? '제한 없음' : `${data.target_count}명`}
              />
              <Item
                label="완료 기한"
                value={data.deadline ? new Date(data.deadline).toLocaleDateString('ko-KR') + '까지' : '—'}
              />
              <Item label="접수 ID" value={data.id.slice(0, 8)} mono />
              <Item label="접수 시각" value={new Date(data.created_at).toLocaleString('ko-KR')} />
            </div>
          </div>
        )}

        {/* 안내 박스 */}
        <div className="w-full rounded-2xl bg-[#FAFAFA] border border-[#1D1C1C]/5 p-5 flex flex-col gap-2">
          <h4 className="text-[11px] font-black flex items-center gap-1.5">
            📌 다음 단계
          </h4>
          <ul className="text-[10px] font-bold text-[#666] leading-relaxed flex flex-col gap-1 pl-1">
            <li>1. 평가단 매칭이 자동으로 시작됩니다 (보통 1~2시간 이내)</li>
            <li>2. 평가단이 응답을 제출하면 실시간 결과 페이지에서 진행률을 확인할 수 있어요</li>
            <li>3. 완료 기한 내에 AI 리포트가 발송됩니다</li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => router.push('/builder/projects')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-[#1D1C1C]/10 text-[12px] font-black text-[#1D1C1C] hover:border-[#1D1C1C]/30 transition-all"
          >
            <FileText className="w-4 h-4" /> 내 프로젝트 보기
          </button>
          <button
            type="button"
            onClick={() => router.push('/builder/dashboard')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#F77019] text-white text-[12px] font-black hover:opacity-90 transition-all shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> 대시보드로
          </button>
        </div>
      </div>
    </div>
  )
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-[#999]">{label}</span>
      <span className={`text-[11px] font-bold text-[#1D1C1C] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
