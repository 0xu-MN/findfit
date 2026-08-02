'use client'

import { ArrowLeft, Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'

type RawAnswer = { question_text: string; question_type: string; order_index: number; answer_text: string }
type RawReviewer = {
  reviewerTag: string
  gender: string | null
  age: number | null
  jobDomain: string[]
  answers: RawAnswer[]
}

// AI가 요약/재가공한 리포트와 별개로, 리뷰어가 실제로 제출한 답변 원문을
// 문항별로 그대로 보여주는 화면 — 이름/닉네임 대신 "리뷰어 A · 여성 · 26세
// · PM"처럼 익명 라벨만 붙인다(app/api/projects/[id]/raw-reviews/route.ts).
export default function RawReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [projectTitle, setProjectTitle] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<RawReviewer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/raw-reviews`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? '불러오지 못했어요')
        }
        return res.json()
      })
      .then((body) => {
        setProjectTitle(body.projectTitle ?? null)
        setReviewers(body.reviewers ?? [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : '불러오지 못했어요'))
  }, [projectId])

  return (
    <div className="min-h-[calc(100vh-80px)] pb-16">
      <div className="sticky top-0 z-20 -mx-2 mb-2 bg-[#F7F7F5] px-2 py-4 flex items-center gap-3 border-b border-[#1D1C1C]/8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => router.push(`/builder/projects/${projectId}`)}
          className="p-1.5 rounded-lg hover:bg-white transition-colors text-[#666]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <User className="w-4 h-4 text-[#F77019]" />
          <h1 className="text-sm font-black">리뷰어 의견</h1>
          {projectTitle && (
            <span className="text-[10px] font-bold text-[#999] truncate max-w-[200px]">— {projectTitle}</span>
          )}
        </div>
        <button
          onClick={() => router.push(`/builder/reports/${projectId}`)}
          className="text-[10px] font-black text-[#F77019] hover:underline px-2 py-1"
        >
          AI 리포트 보기
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-[11px] font-bold text-red-500">{error}</p>
          </div>
        )}

        {!error && reviewers === null && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-[#F77019] animate-spin" />
          </div>
        )}

        {reviewers?.length === 0 && (
          <p className="text-[11px] font-bold text-[#999] text-center py-16">아직 제출된 리뷰가 없어요.</p>
        )}

        {reviewers?.map((r) => (
          <div key={r.reviewerTag} className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black text-[#1D1C1C] bg-[#F77019]/10 text-[#F77019] px-2.5 py-1 rounded-full">
                {r.reviewerTag}
              </span>
              {r.gender && (
                <span className="text-[10px] font-bold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{r.gender}</span>
              )}
              {r.age !== null && (
                <span className="text-[10px] font-bold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{r.age}세</span>
              )}
              {r.jobDomain.map((j) => (
                <span key={j} className="text-[10px] font-bold text-[#666] bg-[#F5F5F5] px-2 py-0.5 rounded">{j}</span>
              ))}
              {!r.gender && r.age === null && r.jobDomain.length === 0 && (
                <span className="text-[10px] font-bold text-[#999]">인구통계 정보 없음</span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {r.answers.map((a, i) => (
                <div key={i} className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                  <p className="text-[10px] font-bold text-[#999] mb-1">{a.question_text}</p>
                  <p className="text-[11px] font-bold text-[#1D1C1C] whitespace-pre-wrap">{a.answer_text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
