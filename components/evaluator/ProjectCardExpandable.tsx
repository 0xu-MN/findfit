'use client'

import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  ExternalLink,
  Loader2,
  Package,
  Smartphone,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AccessInfo = { url?: string; appStoreUrl?: string; playStoreUrl?: string }

export type CardProject = {
  id: string
  title: string
  one_liner: string | null
  categories: string[]
  project_type: 'light' | 'standard'
  problem: string | null
  access_method: 'web_link' | 'app_download' | 'physical_shipping' | null
  access_info: AccessInfo | null
  target_count: number
  completed_count: number
  incentive_exists: boolean
  incentive_budget: number | null
}

export type CardMatch = {
  id: string
  status: 'pending' | 'accepted' | 'completed' | 'dropped'
  nickname: string | null
  shipping_status: string | null
  shipping_address: string | null
  received_confirmed_at: string | null
}

type Question = {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert' | 'likert_5' | 'sean_ellis'
  options: string[] | null
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  light: { label: 'Light', color: '#1CAE66' },
  standard: { label: 'Standard', color: '#1565C0' },
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  available: { label: '지원 가능', color: '#1565C0', icon: Users },
  pending: { label: '승인 대기', color: '#1565C0', icon: Clock },
  accepted: { label: '작성 가능', color: '#F77019', icon: Clock },
  completed: { label: '완료', color: '#2E7D32', icon: CheckCircle2 },
  dropped: { label: '거절됨', color: '#999', icon: XCircle },
}

const DOMAINS = ['PM', 'PD', '마케터', '개발자', '디자이너', '기획자', '창업자', '직장인', '기타']
const LIKERT_LABELS = ['매우 낮음', '낮음', '보통', '높음', '매우 높음']

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

interface Props {
  project: CardProject
  match: CardMatch | null
  onApplied: (matchId: string, nickname: string) => void
  onSubmitted: (matchId: string) => void
}

export default function ProjectCardExpandable({ project, match, onApplied, onSubmitted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const status = match?.status ?? 'available'
  const badge = STATUS_BADGE[status]
  const typeMeta = TYPE_META[project.project_type] ?? { label: project.project_type, color: '#999' }
  const progressPct = project.target_count > 0 ? Math.round((project.completed_count / project.target_count) * 100) : 0
  const isFull = project.completed_count >= project.target_count
  const reviewerGross = project.incentive_exists && project.incentive_budget && project.target_count > 0
    ? Math.floor(project.incentive_budget / project.target_count)
    : 0
  const reviewerNet = Math.floor(reviewerGross * 0.85)

  const canExpand = status !== 'dropped' && status !== 'pending' && !(status === 'available' && isFull)

  return (
    <div className="rounded-2xl bg-white border border-[#1D1C1C]/8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
      <button
        onClick={() => canExpand && setExpanded((p) => !p)}
        className={`w-full text-left p-5 flex flex-col gap-3 ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[9px] font-black px-2 py-0.5 rounded text-white" style={{ background: typeMeta.color }}>
            {typeMeta.label}
          </span>
          {project.categories?.slice(0, 2).map((c) => (
            <span key={c} className="text-[9px] font-bold bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
              {c}
            </span>
          ))}
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded ml-auto flex items-center gap-1"
            style={{ background: `${badge.color}12`, color: badge.color }}
          >
            <badge.icon className="w-2.5 h-2.5" /> {badge.label}
          </span>
        </div>

        <div>
          <h3 className="text-[14px] font-black text-[#1D1C1C] leading-tight">{project.title}</h3>
          {project.one_liner && <p className="text-[11px] font-medium text-[#666] mt-1">{project.one_liner}</p>}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-[#666]">
              <span>참여 현황</span>
              <span className="text-[#1565C0]">{project.completed_count}/{project.target_count}명</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
              <div className="h-full rounded-full bg-[#1565C0] transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {project.incentive_exists && reviewerNet > 0 ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Coins className="w-3.5 h-3.5 text-[#F77019]" />
              <span className="text-[12px] font-black text-[#F77019]">{fmt(reviewerNet)}원</span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-[#1D1C1C] flex-shrink-0">EXP 적립</span>
          )}
        </div>

        {canExpand && (
          <div className="flex items-center justify-center text-[#999] pt-1">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#1D1C1C]/6 p-5 bg-[#FAFAFA]">
          {status === 'available' && (
            <ApplyPanel projectId={project.id} onApplied={onApplied} />
          )}
          {status === 'accepted' && match && project.access_method === 'physical_shipping' && !match.received_confirmed_at && (
            <ShippingGatePanel matchId={match.id} shippingAddress={match.shipping_address} />
          )}
          {status === 'accepted' && match && !(project.access_method === 'physical_shipping' && !match.received_confirmed_at) && (
            <ReviewFormPanel projectId={project.id} matchId={match.id} accessMethod={project.access_method} accessInfo={project.access_info} onSubmitted={() => onSubmitted(match.id)} />
          )}
          {status === 'completed' && match && (
            <ResultPanel projectId={project.id} />
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  지원하기 패널                                            */
/* ─────────────────────────────────────────────────────── */

function ApplyPanel({ projectId, onApplied }: { projectId: string; onApplied: (matchId: string, nickname: string) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [email, setEmail] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [intro, setIntro] = useState('')
  const [ndaChecked, setNdaChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleDomain = (d: string) =>
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

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
          projectId,
          applicantEmail: email,
          applicantDomain: domains,
          applicantIntro: intro || null,
          ndaAgreed: ndaChecked,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      onApplied(data.matchId ?? '', data.nickname ?? '')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">
          수락 알림 이메일 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full px-4 py-2.5 rounded-xl border border-[#1D1C1C]/12 bg-white text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] transition-colors"
        />
      </div>

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
                domains.includes(d) ? 'bg-[#1565C0] text-white' : 'bg-white text-[#666] hover:bg-[#EBEBEB] border border-[#1D1C1C]/8'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black text-[#999] uppercase tracking-wider">간단 자기소개 (선택)</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={2}
          placeholder="경력이나 관심 분야를 간단히 알려주세요"
          className="w-full px-4 py-2.5 rounded-xl border border-[#1D1C1C]/12 bg-white text-[12px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] transition-colors resize-none"
        />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
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

      {error && <p className="text-[11px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <button
        onClick={handleApply}
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-[#1565C0] text-white text-[12px] font-black hover:bg-[#1255a3] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '지원하기'}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  배송형 수령 확인 게이트                                    */
/* ─────────────────────────────────────────────────────── */

function ShippingGatePanel({ matchId, shippingAddress }: { matchId: string; shippingAddress: string | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [addressInput, setAddressInput] = useState(shippingAddress ?? '')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmReceipt = async () => {
    if (!addressInput.trim() && !shippingAddress) {
      setError('배송지를 입력해주세요')
      return
    }
    setConfirming(true)
    setError(null)
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('project_matches')
      .update({
        received_confirmed_at: now,
        shipping_status: 'delivered',
        ...(addressInput.trim() ? { shipping_address: addressInput.trim() } : {}),
      })
      .eq('id', matchId)
    setConfirming(false)
    if (err) { setError('처리 중 오류가 발생했습니다'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-xl bg-[#2E7D32]/5 border border-[#2E7D32]/20 p-4 text-center">
        <p className="text-[11px] font-bold text-[#2E7D32]">수령 확인 완료! 카드를 새로고침하면 리뷰 작성 폼이 나타납니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-[#1565C0]" />
        <span className="text-[11px] font-black text-[#1D1C1C]">제품 수령 확인</span>
      </div>
      {!shippingAddress && (
        <textarea
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="제품을 받을 주소를 입력해주세요"
          rows={2}
          className="w-full rounded-xl border border-[#1D1C1C]/12 bg-white px-4 py-2.5 text-[11px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] resize-none"
        />
      )}
      {shippingAddress && <p className="text-[11px] font-bold text-[#666]">제품이 배송 중입니다. 받으셨다면 아래 버튼을 눌러주세요.</p>}
      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
      <button
        onClick={confirmReceipt}
        disabled={confirming}
        className="h-10 rounded-xl bg-[#1565C0] text-white text-[12px] font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
        {shippingAddress ? '제품을 받았어요 · 리뷰 시작' : '배송지 저장 · 제품 받으면 리뷰 시작'}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  리뷰 작성 패널                                            */
/* ─────────────────────────────────────────────────────── */

function ReviewFormPanel({
  projectId,
  matchId,
  accessMethod,
  accessInfo,
  onSubmitted,
}: {
  projectId: string
  matchId: string
  accessMethod: CardProject['access_method']
  accessInfo: AccessInfo | null
  onSubmitted: () => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('review_questions')
      .select('id, question_text, question_type, options')
      .eq('project_id', projectId)
      .order('order_index')
      .then(({ data }: { data: Question[] | null }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setAnswer = (qId: string, value: string) => setAnswers((prev) => ({ ...prev, [qId]: value }))

  const handleSubmit = async () => {
    if (!questions) return
    const unanswered = questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) { setError('모든 질문에 답변해주세요'); return }

    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/reviews/${matchId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? '제출 중 오류가 발생했습니다')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    onSubmitted()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {accessMethod === 'web_link' && accessInfo?.url && (
        <a
          href={accessInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1565C0]/10 text-[#1565C0] text-[11px] font-black py-2.5 hover:bg-[#1565C0]/15 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> 제품 체험하기
        </a>
      )}
      {accessMethod === 'app_download' && (accessInfo?.appStoreUrl || accessInfo?.playStoreUrl) && (
        <div className="flex gap-2">
          {accessInfo?.appStoreUrl && (
            <a href={accessInfo.appStoreUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black py-2.5 flex items-center justify-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> App Store
            </a>
          )}
          {accessInfo?.playStoreUrl && (
            <a href={accessInfo.playStoreUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black py-2.5">
              Google Play
            </a>
          )}
        </div>
      )}

      {(questions ?? []).map((q, i) => (
        <div key={q.id} className="rounded-xl border border-[#1D1C1C]/8 bg-white p-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-black text-[#1D1C1C]">
            <span className="text-[#1565C0] mr-1">{i + 1}.</span>
            {q.question_text}
          </p>

          {(q.question_type === 'multiple_choice' || q.question_type === 'sean_ellis') && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors ${
                    answers[q.id] === opt
                      ? 'border-[#1565C0] bg-[#1565C0]/10 text-[#1565C0] font-black'
                      : 'border-[#1D1C1C]/10 hover:border-[#1D1C1C]/20 text-[#666]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {(q.question_type === 'likert_5' || q.question_type === 'likert') && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setAnswer(q.id, String(n))}
                  title={LIKERT_LABELS[n - 1]}
                  className={`flex-1 h-8 rounded-lg border text-[11px] font-black transition-colors ${
                    answers[q.id] === String(n) ? 'border-[#1565C0] bg-[#1565C0] text-white' : 'border-[#1D1C1C]/10 text-[#999]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {q.question_type === 'short_answer' && (
            <textarea
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="답변을 입력해주세요"
              rows={2}
              className="w-full rounded-lg border border-[#1D1C1C]/10 px-3 py-2 text-[11px] font-bold text-[#1D1C1C] outline-none focus:border-[#1565C0] resize-none"
            />
          )}
        </div>
      ))}

      {error && <p className="text-[11px] font-bold text-red-500 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="h-11 rounded-xl bg-[#1565C0] text-white text-[12px] font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        리뷰 제출하기
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  완료 결과 패널                                            */
/* ─────────────────────────────────────────────────────── */

function ResultPanel({ projectId }: { projectId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [rows, setRows] = useState<{ question_text: string; answer_text: string }[] | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) return
      const { data: answers } = await supabase
        .from('review_answers')
        .select('answer_text, review_questions(question_text)')
        .eq('project_id', projectId)
        .eq('reviewer_id', data.user.id)
      setRows(
        (answers ?? []).map((a: { answer_text: string; review_questions: { question_text: string } | null }) => ({
          question_text: a.review_questions?.question_text ?? '',
          answer_text: a.answer_text,
        }))
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-[#2E7D32]/5 border border-[#2E7D32]/20 p-3">
        <p className="text-[10px] font-bold text-[#2E7D32]">제출 완료 · 정산일에 사례금이 지급됩니다</p>
      </div>
      {rows === null ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-[#999] animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#1D1C1C]/8 p-3">
              <p className="text-[9px] font-bold text-[#999]">{r.question_text}</p>
              <p className="text-[11px] font-bold text-[#1D1C1C] mt-1">{r.answer_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
