'use client'

import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Loader2,
  Smartphone,
  Users,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

const DOMAINS = ['PM', 'PD', '마케터', '개발자', '디자이너', '기획자', '창업자', '직장인', '기타']

const TYPE_META: Record<string, { label: string; color: string }> = {
  light:    { label: 'Light',    color: '#1CAE66' },
  standard: { label: 'Standard', color: '#1565C0' },
}

const MATCH_STATUS_CONFIG = {
  pending:   { label: '검토 중',    color: '#1565C0', icon: Clock,         bg: '#1565C0' },
  accepted:  { label: '평가 진행 중', color: '#F77019', icon: Clock,         bg: '#F77019' },
  completed: { label: '제출 완료',  color: '#2E7D32', icon: CheckCircle2,  bg: '#2E7D32' },
  dropped:   { label: '거절됨',    color: '#999',    icon: XCircle,       bg: '#999' },
} as const

type AccessInfo = { url?: string; appStoreUrl?: string; playStoreUrl?: string }

type Project = {
  id: string
  title: string
  one_liner: string | null
  categories: string[]
  project_type: 'light' | 'standard'
  status: string
  completed_count: number
  target_count: number
  incentive_exists: boolean
  incentive_budget: number | null
  problem: string | null
  access_method: 'web_link' | 'app_download' | 'physical_shipping' | null
  access_info: AccessInfo | null
  created_at: string
}

type MatchStatus = 'pending' | 'accepted' | 'completed' | 'dropped'

type MyMatch = {
  id: string
  status: MatchStatus
  nickname: string | null
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: AnySupabase = createClient()

  const [project, setProject] = useState<Project | null>(null)
  const [myMatch, setMyMatch] = useState<MyMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 지원 폼 상태
  const [email, setEmail] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [intro, setIntro] = useState('')
  const [ndaChecked, setNdaChecked] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: proj }, { data: { user } }] = await Promise.all([
        // projects_public 뷰 — creator_id 제외 (migration 009)
        supabase.from('projects_public').select('*').eq('id', params.id).single(),
        supabase.auth.getUser(),
      ])
      setProject(proj ?? null)

      if (user) {
        setEmail(user.email ?? '')
        const { data: match } = await supabase
          .from('project_matches')
          .select('id, status, nickname')
          .eq('project_id', params.id)
          .eq('reviewer_id', user.id)
          .single()
        setMyMatch(match ?? null)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const toggleDomain = (d: string) =>
    setDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])

  const handleApply = async () => {
    if (!email) { setError('이메일을 입력해 주세요'); return }
    if (domains.length === 0) { setError('직군을 하나 이상 선택해 주세요'); return }
    if (!ndaChecked) { setError('기밀유지 서약 동의가 필요합니다'); return }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/evaluator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          applicantEmail: email,
          applicantDomain: domains,
          applicantIntro: intro || null,
          ndaAgreed: ndaChecked,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      setMyMatch({ id: data.matchId ?? '', status: 'pending', nickname: data.nickname })
      setShowModal(false)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1565C0]" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <p className="text-sm font-bold text-[#999]">프로젝트를 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-[11px] font-black text-[#1565C0] hover:underline">
          돌아가기
        </button>
      </div>
    )
  }

  const typeMeta = TYPE_META[project.project_type] ?? { label: project.project_type, color: '#999' }
  const progressPct = project.target_count > 0
    ? Math.round((project.completed_count / project.target_count) * 100)
    : 0
  const reviewerGross = project.incentive_exists && project.incentive_budget && project.target_count > 0
    ? Math.floor(project.incentive_budget / project.target_count)
    : 0
  const reviewerNet = Math.floor(reviewerGross * 0.85)
  const isFull = project.completed_count >= project.target_count
  const statusCfg = myMatch ? MATCH_STATUS_CONFIG[myMatch.status] : null

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-16">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#1D1C1C]/8 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#666]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-black text-[#1D1C1C]">프로젝트 상세</span>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 flex flex-col gap-5">
        {/* 지원 완료 배너 */}
        {submitted && (
          <div className="rounded-2xl bg-[#1565C0]/5 border border-[#1565C0]/20 px-5 py-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1565C0] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-black text-[#1565C0]">지원이 완료됐어요!</p>
              <p className="text-[11px] font-bold text-[#666] mt-0.5">
                검토 후 이메일로 안내드릴게요. 보통 24시간 이내에 결과가 도착해요.
              </p>
            </div>
          </div>
        )}

        {/* 현재 지원 상태 배너 */}
        {myMatch && !submitted && statusCfg && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: `${statusCfg.bg}08`, border: `1px solid ${statusCfg.bg}25` }}
          >
            <statusCfg.icon className="w-4 h-4 shrink-0" style={{ color: statusCfg.color }} />
            <div className="flex-1">
              <p className="text-[12px] font-black" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </p>
              {myMatch.nickname && (
                <p className="text-[10px] font-bold text-[#999]">닉네임: {myMatch.nickname}</p>
              )}
            </div>
            {myMatch.status === 'accepted' && (
              <button
                onClick={() => router.push(`/evaluator/review/${project.id}`)}
                className="text-[10px] font-black text-white bg-[#F77019] px-3 py-1.5 rounded-lg hover:bg-[#e0621a] transition-colors"
              >
                평가 진행하기
              </button>
            )}
          </div>
        )}

        {/* 제품 체험 링크 — 승인된 리뷰어에게만 노출 (배송형은 리뷰 페이지에서 별도 안내) */}
        {myMatch?.status === 'accepted' && project.access_method !== 'physical_shipping' && (
          <AccessLinks accessMethod={project.access_method} accessInfo={project.access_info} />
        )}

        {/* 프로젝트 카드 */}
        <div className="rounded-3xl bg-white border border-[#1D1C1C]/8 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div className="flex items-start gap-2 flex-wrap">
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded text-white"
              style={{ background: typeMeta.color }}
            >
              {typeMeta.label}
            </span>
            {project.categories?.slice(0, 2).map((c) => (
              <span key={c} className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>

          <div>
            <h1 className="text-xl font-black text-[#1D1C1C] leading-tight">{project.title}</h1>
            {project.one_liner && (
              <p className="text-[12px] font-medium text-[#666] mt-1">{project.one_liner}</p>
            )}
          </div>

          {/* 진행 현황 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <div className="flex items-center gap-1 text-[#666]">
                <Users className="w-3 h-3" />
                <span>모집 현황</span>
              </div>
              <span className="text-[#1565C0] font-black">
                {project.completed_count} / {project.target_count}명
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1565C0] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 사례금 */}
          {project.incentive_exists && reviewerNet > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-[#F77019]/5 border border-[#F77019]/15 px-4 py-3">
              <Coins className="w-4 h-4 text-[#F77019]" />
              <span className="text-[11px] font-bold text-[#666]">사례금</span>
              <span className="text-[13px] font-black text-[#F77019] ml-auto">
                {fmt(reviewerNet)}원 <span className="text-[10px] font-bold text-[#999]">(세후)</span>
              </span>
            </div>
          )}
        </div>

        {/* 검증 내용 */}
        {project.problem && (
          <div className="rounded-3xl bg-white border border-[#1D1C1C]/8 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] font-black text-[#999] uppercase tracking-wider mb-2">검증하고 싶은 내용</p>
            <p className="text-[12px] font-bold text-[#1D1C1C] leading-relaxed">{project.problem}</p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          {!myMatch && !submitted ? (
            isFull ? (
              <div className="w-full py-4 rounded-2xl bg-[#F5F5F5] text-center text-[12px] font-black text-[#999]">
                모집 마감
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 rounded-2xl bg-[#1565C0] text-white text-[13px] font-black hover:bg-[#1255a3] transition-colors shadow-[0_4px_16px_rgba(21,101,192,0.25)]"
              >
                지원하기
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* 지원 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black text-[#1D1C1C]">리뷰어 지원</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#999] hover:text-[#1D1C1C] transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* 이메일 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                수락 알림 이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] transition-colors"
              />
            </div>

            {/* 직군 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                직군/분야 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDomain(d)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
                      domains.includes(d)
                        ? 'bg-[#1565C0] text-white'
                        : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EBEBEB]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 자기소개 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
                간단 자기소개 <span className="text-[#CCC]">(선택)</span>
              </label>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={3}
                placeholder="경력이나 관심 분야를 간단히 알려주세요"
                className="w-full px-4 py-3 rounded-xl border border-[#1D1C1C]/12 text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] transition-colors resize-none"
              />
            </div>

            {/* 기밀유지 서약 동의 */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ndaChecked}
                onChange={(e) => setNdaChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1565C0] shrink-0"
              />
              <span className="text-[11px] font-bold text-[#666] leading-relaxed">
                리뷰 내용은 외부 공개하지 않기로 하는 기밀유지 서약에 동의합니다.
              </span>
            </label>

            {error && (
              <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <button
              onClick={handleApply}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[#1565C0] text-white text-[13px] font-black hover:bg-[#1255a3] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '지원하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// 승인된 리뷰어에게 제품 접근 링크를 보여준다 — access_method에 저장은
// 되지만 어디에도 노출되지 않던 부분(웹링크/앱스토어 링크)을 여기서 표시.
function AccessLinks({
  accessMethod,
  accessInfo,
}: {
  accessMethod: Project['access_method']
  accessInfo: Project['access_info']
}) {
  if (accessMethod === 'web_link' && accessInfo?.url) {
    return (
      <div className="rounded-2xl bg-white border border-[#1D1C1C]/8 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#1565C0] shrink-0" />
          <span className="text-[11px] font-bold text-[#666]">체험 링크가 준비됐어요</span>
        </div>
        <a
          href={accessInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black text-white bg-[#1565C0] px-3 py-1.5 rounded-lg hover:bg-[#1255a3] transition-colors shrink-0"
        >
          바로 체험하기
        </a>
      </div>
    )
  }

  if (accessMethod === 'app_download' && (accessInfo?.appStoreUrl || accessInfo?.playStoreUrl)) {
    return (
      <div className="rounded-2xl bg-white border border-[#1D1C1C]/8 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#1565C0] shrink-0" />
          <span className="text-[11px] font-bold text-[#666]">앱을 설치하고 체험해보세요</span>
        </div>
        <div className="flex gap-2">
          {accessInfo.appStoreUrl && (
            <a
              href={accessInfo.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] font-black text-white bg-[#1D1C1C] px-3 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              App Store
            </a>
          )}
          {accessInfo.playStoreUrl && (
            <a
              href={accessInfo.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] font-black text-white bg-[#1D1C1C] px-3 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              Google Play
            </a>
          )}
        </div>
      </div>
    )
  }

  return null
}
