'use client'

import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ChevronLeft, Loader2, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Question = {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert_5' | 'sean_ellis'
  options: string[] | null
  order_index: number
}

type Project = {
  id: string
  title: string
  one_liner: string | null
  project_type: string | null
  access_method: string | null
  target_count: number
  completed_count: number
}

type MatchInfo = {
  id: string
  submitted_at: string | null
  shipping_status: string | null
  shipping_address: string | null
  received_confirmed_at: string | null
}

const LIKERT_LABELS = ['매우 낮음', '낮음', '보통', '높음', '매우 높음']

export default function ReviewPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 참여 여부 확인
      const { data: m } = await supabase
        .from('project_matches')
        .select('id, submitted_at, shipping_status, shipping_address, received_confirmed_at')
        .eq('project_id', params.id)
        .eq('reviewer_id', user.id)
        .single()

      if (!m) { router.push('/evaluator/reviews'); return }
      setMatch(m as MatchInfo)
      if (m.submitted_at) { setSubmitted(true); setLoading(false); return }

      const [{ data: proj }, { data: qs }] = await Promise.all([
        // projects_public 뷰 — creator_id 제외 (migration 009)
        supabase
          .from('projects_public')
          .select('id, title, one_liner, project_type, access_method, target_count, completed_count')
          .eq('id', params.id)
          .single(),
        supabase.from('review_questions').select('*').eq('project_id', params.id).order('order_index'),
      ])

      setProject(proj)
      setQuestions(qs ?? [])
      if (m.shipping_address) setAddressInput(m.shipping_address)
      setLoading(false)
    }
    load()
  }, [params.id])

  // 배송형 프로젝트인데 아직 수령 확인 전이면 리뷰 폼 대신 게이트를 보여준다
  const needsReceiptGate =
    project?.access_method === 'physical_shipping' && match !== null && !match.received_confirmed_at

  const confirmReceipt = async () => {
    if (!match) return
    if (!addressInput.trim() && !match.shipping_address) {
      setError('배송지를 입력해주세요')
      return
    }
    setConfirmingReceipt(true)
    setError(null)
    const now = new Date().toISOString()
    await supabase
      .from('project_matches')
      .update({
        received_confirmed_at: now,
        shipping_status: 'delivered',
        ...(addressInput.trim() ? { shipping_address: addressInput.trim() } : {}),
      })
      .eq('id', match.id)
    setMatch({ ...match, received_confirmed_at: now, shipping_status: 'delivered' })
    setConfirmingReceipt(false)
  }

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      setError('모든 질문에 답변해주세요')
      return
    }

    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertErr } = await supabase.from('review_answers').insert(
      questions.map((q) => ({
        project_id: params.id,
        reviewer_id: user.id,
        question_id: q.id,
        answer_text: answers[q.id],
      }))
    )

    if (insertErr) {
      setError('제출 중 오류가 발생했습니다')
      setSubmitting(false)
      return
    }

    await supabase
      .from('project_matches')
      .update({ submitted_at: new Date().toISOString(), status: 'completed' })
      .eq('project_id', params.id)
      .eq('reviewer_id', user.id)

    await supabase.rpc('increment_completed_count', { project_id: params.id })

    // 완료율 도달 시 AI 리포트 자동 생성 트리거
    // (이번 제출로 completed_count가 target_count에 도달하는지 확인)
    if (project && project.completed_count + 1 >= project.target_count) {
      try {
        await fetch(`/api/ai-report/${params.id}`, { method: 'POST' })
      } catch {
        // 리포트 생성 실패해도 제출 자체는 성공 처리 (Builder가 재생성 가능)
      }
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#1565C0]" />
          <p className="text-lg font-black">리뷰를 제출했습니다!</p>
          <p className="text-[11px] font-bold text-[#999]">정산일에 사례금이 지급됩니다</p>
          <button
            onClick={() => router.push('/evaluator/reviews')}
            className="mt-2 h-9 px-5 rounded-xl bg-[#1565C0] text-white text-[11px] font-black hover:opacity-90"
          >
            내 리뷰 목록으로
          </button>
        </div>
      </div>
    )
  }

  // 배송형 프로젝트 — 수령 확인 게이트
  if (needsReceiptGate) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] w-fit"
          >
            <ChevronLeft className="w-4 h-4" /> 뒤로
          </button>

          <div>
            <p className="text-[10px] font-black text-[#1565C0] uppercase tracking-wider mb-1">실물 배송 리뷰</p>
            <h1 className="text-xl font-black">{project?.title}</h1>
          </div>

          <div className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1565C0]" />
              <h2 className="text-sm font-black">제품 수령 확인</h2>
            </div>

            {!match?.shipping_address && (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#666]">배송지 주소</label>
                <textarea
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="제품을 받을 주소를 입력해주세요"
                  rows={3}
                  className="w-full rounded-xl border border-[#1D1C1C]/10 px-4 py-3 text-[11px] font-bold text-[#1D1C1C] placeholder-[#BDBDBD] resize-none outline-none focus:border-[#1565C0] transition-colors"
                />
                <p className="text-[10px] font-bold text-[#999]">
                  주소를 입력하면 의뢰자가 제품을 발송합니다. 제품을 받으신 뒤 아래 버튼으로 수령을 확인해주세요.
                </p>
              </div>
            )}

            {match?.shipping_address && (
              <p className="text-[11px] font-bold text-[#666] leading-relaxed">
                제품이 배송 중입니다. 제품을 받으셨다면 아래 버튼을 눌러 리뷰를 시작해주세요.
              </p>
            )}

            {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}

            <button
              onClick={confirmReceipt}
              disabled={confirmingReceipt}
              className="h-11 rounded-xl bg-[#1565C0] text-white text-[12px] font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirmingReceipt && <Loader2 className="w-4 h-4 animate-spin" />}
              {match?.shipping_address ? '제품을 받았어요 · 리뷰 시작' : '배송지 저장 · 제품 받으면 리뷰 시작'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* 헤더 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11px] font-bold text-[#999] hover:text-[#1D1C1C] w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> 뒤로
        </button>

        <div>
          <p className="text-[10px] font-black text-[#1565C0] uppercase tracking-wider mb-1">리뷰 작성</p>
          <h1 className="text-xl font-black">{project?.title}</h1>
          {project?.one_liner && (
            <p className="text-[11px] text-[#999] font-bold mt-1">{project.one_liner}</p>
          )}
        </div>

        {/* 질문 목록 */}
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-[#1D1C1C]/10 bg-white p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
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
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
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

              {q.question_type === 'likert_5' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswer(q.id, String(n))}
                      title={LIKERT_LABELS[n - 1]}
                      className={`flex-1 h-9 rounded-lg border text-[11px] font-black transition-colors ${
                        answers[q.id] === String(n)
                          ? 'border-[#1565C0] bg-[#1565C0] text-white'
                          : 'border-[#1D1C1C]/10 hover:border-[#1D1C1C]/20 text-[#999]'
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
                  rows={3}
                  className="w-full rounded-xl border border-[#1D1C1C]/10 px-4 py-3 text-[11px] font-bold text-[#1D1C1C] placeholder-[#BDBDBD] resize-none outline-none focus:border-[#1565C0] transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-[11px] font-bold text-red-500 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="h-12 rounded-xl bg-[#1565C0] text-white text-[13px] font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          리뷰 제출하기
        </button>
      </div>
    </div>
  )
}
