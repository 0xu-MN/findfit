'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import CaptureGuard from '@/components/evaluator/CaptureGuard'
import ProjectCardExpandable, { type CardMatch, type CardProject } from '@/components/evaluator/ProjectCardExpandable'
import { createClient } from '@/lib/supabase/client'

const TYPE_LABEL: Record<string, string> = { light: 'Light', standard: 'Standard' }

export default function EvaluatorProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<CardProject | null>(null)
  const [match, setMatch] = useState<CardMatch | null>(null)
  const [nickname, setNickname] = useState('리뷰어')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: p }, { data: u }, { data: m }] = await Promise.all([
        supabase.from('projects_public').select('*').eq('id', id).maybeSingle(),
        user ? supabase.from('users').select('nickname, email').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        user
          ? supabase
              .from('project_matches')
              .select('id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
              .eq('project_id', id)
              .eq('reviewer_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      setProject((p as CardProject) ?? null)
      setMatch((m as CardMatch) ?? null)
      setNickname(u?.nickname ?? u?.email ?? '리뷰어')
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleApplied = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('project_matches')
        .select('id, status, nickname, shipping_status, shipping_address, received_confirmed_at')
        .eq('project_id', id)
        .eq('reviewer_id', user.id)
        .maybeSingle()
        .then(({ data }) => setMatch((data as CardMatch) ?? null))
    })
  }

  if (loading) {
    return (
      <ReviewerLayout>
        <div className="w-full flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-[#999] animate-spin" />
        </div>
      </ReviewerLayout>
    )
  }

  if (!project) {
    return (
      <ReviewerLayout>
        <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-sm font-bold text-[#999]">프로젝트를 찾을 수 없습니다</p>
          <button onClick={() => router.push('/evaluator/projects')} className="text-[11px] font-black text-[#189DF7] hover:underline">
            목록으로
          </button>
        </div>
      </ReviewerLayout>
    )
  }

  return (
    <ReviewerLayout>
      <CaptureGuard watermarkLabel={`${nickname} · FindFit 비공개`}>
        <div className="w-full max-w-[860px] mx-auto flex flex-col gap-6 px-4 sm:px-0">
          <button
            onClick={() => router.push('/evaluator/projects')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#666] hover:text-[#1D1C1C] transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
          </button>

          {/* 프로젝트 상세 설명 */}
          <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black px-2 py-0.5 rounded text-white bg-[#189DF7]">
                {TYPE_LABEL[project.project_type] ?? project.project_type}
              </span>
              {project.categories?.map((c) => (
                <span key={c} className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-black text-[#1D1C1C] leading-tight">{project.title}</h1>
              {project.one_liner && <p className="text-[12px] text-[#666] font-medium">{project.one_liner}</p>}
            </div>

            {project.problem && (
              <DetailSection title="어떤 문제를 해결하나요?" text={project.problem} />
            )}
            {project.alternative_limit && (
              <DetailSection title="기존 대안과 한계" text={project.alternative_limit} />
            )}
            {project.solution && (
              <DetailSection title="이 솔루션이 다른 점" text={project.solution} />
            )}

            {(project.target_age_range || (project.target_jobs && project.target_jobs.length > 0)) && (
              <div className="flex flex-wrap gap-4 pt-2 border-t border-[#1D1C1C]/5">
                {project.target_age_range && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[#999] uppercase tracking-wider">타겟 연령대</span>
                    <span className="text-[11px] font-bold text-[#1D1C1C]">{project.target_age_range}</span>
                  </div>
                )}
                {project.target_jobs && project.target_jobs.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[#999] uppercase tracking-wider">타겟 직군</span>
                    <span className="text-[11px] font-bold text-[#1D1C1C]">{project.target_jobs.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl bg-[#F5F5F5] p-3">
              <p className="text-[10px] font-bold text-[#999] leading-relaxed">
                🔒 이 페이지의 내용은 비공개 정보이며 캡처·외부 공유가 금지됩니다.
              </p>
            </div>
          </div>

          {/* 지원 / 리뷰 작성 / 결과 패널 (기존 카드 로직 그대로 재사용) */}
          <ProjectCardExpandable
            project={project}
            match={match}
            onApplied={handleApplied}
            onSubmitted={handleApplied}
            defaultExpanded
          />
        </div>
      </CaptureGuard>
    </ReviewerLayout>
  )
}

function DetailSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black text-[#999] uppercase tracking-wider">{title}</span>
      <p className="text-[12px] font-medium text-[#1D1C1C] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}
