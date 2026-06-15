'use client'

import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react'
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
}

const LIKERT_LABELS = ['매우 낮음', '낮음', '보통', '높음', '매우 높음']

export default function ReviewPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 참여 여부 확인
      const { data: match } = await supabase
        .from('project_matches')
        .select('id, submitted_at')
        .eq('project_id', params.id)
        .eq('reviewer_id', user.id)
        .single()

      if (!match) { router.push('/evaluator/reviews'); return }
      if (match.submitted_at) { setSubmitted(true); setLoading(false); return }

      const [{ data: proj }, { data: qs }] = await Promise.all([
        supabase.from('projects').select('id, title, one_liner, project_type').eq('id', params.id).single(),
        supabase.from('review_questions').select('*').eq('project_id', params.id).order('order_index'),
      ])

      setProject(proj)
      setQuestions(qs ?? [])
      setLoading(false)
    }
    load()
  }, [params.id])

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
      .update({ submitted_at: new Date().toISOString() })
      .eq('project_id', params.id)
      .eq('reviewer_id', user.id)

    await supabase.rpc('increment_completed_count', { project_id: params.id })

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
