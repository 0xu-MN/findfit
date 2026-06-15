'use client'

import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type ReviewQuestion = {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert' | 'likert_5' | 'sean_ellis'
  options: string[] | null
  order_index: number
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()

  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: proj } = await supabase
        .from('projects')
        .select('id, title, one_liner, project_type, status')
        .eq('id', params.id)
        .single()
      setProject(proj)

      const { data: qs } = await supabase
        .from('review_questions')
        .select('*')
        .eq('project_id', params.id)
        .order('order_index', { ascending: true })
      setQuestions(qs ?? [])

      // 현재 사용자의 닉네임 조회
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: match } = await supabase
          .from('project_matches')
          .select('nickname')
          .eq('project_id', params.id)
          .eq('reviewer_id', user.id)
          .single()
        setNickname(match?.nickname ?? '')
      }

      setLoading(false)
    }
    load()
  }, [params.id])

  const setAnswer = (qId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('로그인이 필요합니다'); setSubmitting(false); return }

    // 리뷰 저장
    const { error } = await supabase.from('reviews').insert({
      project_id: params.id,
      reviewer_id: user.id,
      nickname,
      answers,
      is_passed: true,
      submitted_at: new Date().toISOString(),
    })

    if (error) {
      alert('제출 중 오류가 발생했습니다')
      setSubmitting(false)
      return
    }

    // project_matches 완료 처리
    await supabase
      .from('project_matches')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('project_id', params.id)
      .eq('reviewer_id', user.id)

    // projects.completed_count + 1
    await supabase.rpc('increment_completed_count', { project_id: params.id })

    setDone(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#F77019]" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <CheckCircle className="w-14 h-14 text-[#F77019]" />
          <p className="text-xl font-black">리뷰 제출 완료!</p>
          <p className="text-[11px] text-[#999] font-bold">소중한 의견 감사합니다. 사례금은 배분 확정 후 지급됩니다.</p>
          <button
            onClick={() => router.push('/reviewer/feed')}
            className="mt-2 h-10 px-6 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:opacity-90"
          >
            다른 프로젝트 보기
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[11px] font-bold text-[#999]">프로젝트를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* 헤더 */}
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <p className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded w-fit mb-2">
            {String(project.project_type ?? '').toUpperCase()}
          </p>
          <h1 className="text-lg font-black">{String(project.title ?? '')}</h1>
          <p className="text-[11px] text-[#666] font-bold mt-1">{String(project.one_liner ?? '')}</p>
          {nickname && (
            <p className="text-[10px] text-[#999] font-bold mt-2">내 닉네임: <span className="text-[#F77019]">{nickname}</span></p>
          )}
        </div>

        {/* 질문 목록 */}
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i + 1}
            question={q}
            answer={answers[q.id]}
            onAnswer={(val) => setAnswer(q.id, val)}
          />
        ))}

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full h-12 rounded-xl text-[13px] font-black transition-colors ${
            submitting ? 'bg-[#F5F5F5] text-[#999]' : 'bg-[#F77019] text-white hover:opacity-90'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 제출 중...
            </span>
          ) : (
            '리뷰 제출하기'
          )}
        </button>
      </div>
    </div>
  )
}

function QuestionCard({
  index,
  question,
  answer,
  onAnswer,
}: {
  index: number
  question: ReviewQuestion
  answer: unknown
  onAnswer: (val: unknown) => void
}) {
  const isLikert = question.question_type === 'likert' || question.question_type === 'likert_5'
  const isSeanEllis = question.question_type === 'sean_ellis'
  const isMultiple = question.question_type === 'multiple_choice' || isSeanEllis
  const options =
    question.options ??
    (isSeanEllis
      ? ['매우 실망할 것이다', '약간 실망할 것이다', '실망하지 않을 것이다', '이 제품을 사용하지 않는다']
      : isLikert
        ? ['매우 그렇다', '그렇다', '보통', '아니다', '전혀 아니다']
        : [])

  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded shrink-0">Q{index}</span>
        <p className="text-[13px] font-black leading-snug">{question.question_text}</p>
      </div>

      {isMultiple && (
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onAnswer(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-bold transition-colors ${
                answer === opt
                  ? 'bg-[#F77019]/10 border border-[#F77019] text-[#F77019]'
                  : 'bg-[#F5F5F5] border border-transparent text-[#1D1C1C] hover:border-[#1D1C1C]/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {isLikert && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAnswer(n)}
              className={`flex-1 h-10 rounded-xl text-[13px] font-black transition-colors ${
                answer === n
                  ? 'bg-[#F77019] text-white'
                  : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {question.question_type === 'short_answer' && (
        <textarea
          rows={3}
          value={String(answer ?? '')}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="자유롭게 작성해주세요"
          className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
        />
      )}
    </div>
  )
}
