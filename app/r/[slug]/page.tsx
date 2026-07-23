import { createAdminClient } from '@/lib/supabase/admin'
import EmailCaptureForm from '@/components/report/EmailCaptureForm'
import { notFound } from 'next/navigation'

type ReportData = {
  psf_score?: number
  sean_ellis_pct?: number
  key_insights?: string[]
  benchmark_comment?: string
}

export default async function PublicReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: share } = await admin
    .from('report_shares')
    .select('id, project_id')
    .eq('slug', slug)
    .maybeSingle()
  if (!share) notFound()

  const [{ data: project }, { data: report }] = await Promise.all([
    admin.from('projects').select('title, one_liner').eq('id', share.project_id).single(),
    admin.from('ai_reports').select('report_data, verdict').eq('project_id', share.project_id).maybeSingle(),
  ])
  if (!project) notFound()

  // 조회 이벤트 기록 — 실패해도 페이지 렌더는 막지 않는다
  await admin.from('report_share_events').insert({ share_id: share.id, event_type: 'view' })

  const data = (report?.report_data ?? {}) as ReportData
  const firstInsight = data.key_insights?.[0]

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <span className="text-xl font-black text-[#1D1C1C]">FindFit</span>
          <p className="text-[11px] font-bold text-[#999] mt-1">PSF/PMF 검증 리포트 미리보기</p>
        </div>

        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div>
            <h1 className="text-lg font-black text-[#1D1C1C]">{project.title}</h1>
            {project.one_liner && <p className="text-[12px] font-bold text-[#999] mt-1">{project.one_liner}</p>}
          </div>

          {typeof data.psf_score === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F5F5F5] p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#666]">검증 점수</span>
                <span className="text-2xl font-black text-[#F77019]">{data.psf_score}</span>
              </div>
              <div className="rounded-2xl bg-[#F5F5F5] p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#666]">핵심 만족도</span>
                <span className="text-2xl font-black text-[#F77019]">{data.sean_ellis_pct ?? '—'}%</span>
              </div>
            </div>
          )}

          {firstInsight && (
            <div className="rounded-xl bg-[#F77019]/5 border border-[#F77019]/10 px-4 py-3">
              <p className="text-[11px] font-bold text-[#1D1C1C]">{firstInsight}</p>
            </div>
          )}

          <p className="text-[10px] font-medium text-[#BBB] text-center leading-relaxed">
            이 리포트는 AI가 리뷰어 응답 데이터를 바탕으로 자동 생성한 분석입니다. 실제 의사결정 전 참고용으로 활용해주세요.
          </p>
        </div>

        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-3">
          <p className="text-[12px] font-black text-[#1D1C1C]">이 프로젝트가 궁금하신가요?</p>
          <p className="text-[11px] font-bold text-[#999]">이메일을 남겨주시면 진행 상황을 전해드릴게요.</p>
          <EmailCaptureForm slug={slug} />
        </div>
      </div>
    </div>
  )
}
