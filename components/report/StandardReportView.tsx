'use client'

import ConfidenceBadge, { type ConfidenceTier } from './ConfidenceBadge'

export type QuestionSummaryItem = {
  question_text: string
  options: { label: string; count: number; total: number; pct: number }[]
}

export type ReviewerNarrative = { reviewer_tag: string; summary: string; notable_quote: string }
export type StrongestObjection = { quote: string; reviewer_tag: string } | null
export type ThemeFrequencyItem = { theme: string; count: number; sample_quotes: string[] }
export type VerbatimQuote = { quote: string; reviewer_tag: string; question_context: string }
export type ResponseTimeSummary = {
  sample_size: number
  avg_minutes: number | null
  fastest_minutes: number | null
  slowest_minutes: number | null
  suspiciously_fast_count: number
}

export type PanelSummary = {
  total_reviewers: number
  jobs: { label: string; count: number }[]
  genders: { label: string; count: number }[]
  age_buckets: { label: string; count: number }[]
}

// 무료 티어에 항상 노출되는 부분만 담당 — PSF 스코어 게이지 +
// 문항별 응답 요약(review_answers 직접 집계) + 인사이트 1번.
// 인사이트 2~5번 이후 전부는 ReportPaidSections.tsx(유료/베타 무료 열람)가 담당.
type StandardReportData = {
  psf_score: number
  sean_ellis_pct: number
  recommendation: 'continue' | 'pivot' | 'stop'
  benchmark_comment: string
  key_insights: string[]
  question_summary: QuestionSummaryItem[]
  confidence_tiers?: {
    sean_ellis: ConfidenceTier
    score_baseline: ConfidenceTier
    usage_frequency_note: ConfidenceTier
  }
  panel_summary?: PanelSummary
  response_time_summary?: ResponseTimeSummary
  reviewer_narratives?: ReviewerNarrative[]
  strongest_objection?: StrongestObjection
  theme_frequency?: ThemeFrequencyItem[]
  verbatim_quotes?: VerbatimQuote[]
  sean_ellis_segments?: { inTargetPct: number | null; outOfTargetPct: number | null }
  van_westendorp?: {
    too_cheap_median: number | null
    cheap_median: number | null
    expensive_median: number | null
    too_expensive_median: number | null
    acceptable_price_range: [number, number] | null
  } | null
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  continue: { label: '이대로 계속 진행해도 좋아요', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  pivot:    { label: '방향을 조금 바꿔보는 게 좋아요', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  stop:     { label: '지금 방향은 다시 생각해봐야 해요', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

export default function StandardReportView({ data, mode }: { data: StandardReportData; mode: 'psf' | 'pmf' }) {
  const rec = RECOMMENDATION_LABELS[data.recommendation] ?? RECOMMENDATION_LABELS.continue
  const firstInsight = data.key_insights?.[0]
  const tiers = data.confidence_tiers ?? {
    sean_ellis: 'verified' as const,
    score_baseline: 'ai_estimate' as const,
    usage_frequency_note: 'ai_estimate' as const,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 스코어 + 판정 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Standard</span>
          <h3 className="text-sm font-black">{mode === 'psf' ? '아이디어 검증' : '실사용 만족도 검증'} 리포트</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <ScoreGauge label={mode === 'psf' ? '아이디어 검증 점수' : '실사용 만족도 점수'} value={data.psf_score} />
          <ScoreGauge
            label="핵심 만족도 지수"
            value={data.sean_ellis_pct}
            unit="%"
            note="'매우 아쉽다' 비율"
            badgeTier={tiers.sean_ellis}
          />
        </div>

        {mode === 'pmf' && (
          <div className="flex items-start gap-2 mb-4 rounded-xl bg-[#F5F5F5] px-4 py-2.5">
            <ConfidenceBadge tier={tiers.usage_frequency_note} />
            <p className="text-[10px] font-bold text-[#999] leading-relaxed">
              설문 기반 예상 재방문 의향이에요(실제 반복사용을 측정한 수치는 아니에요).
            </p>
          </div>
        )}

        <div className={`rounded-2xl border p-4 ${rec.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold text-[#666]">AI 판정</p>
            <ConfidenceBadge tier={tiers.score_baseline} />
          </div>
          <p className={`text-lg font-black ${rec.color}`}>{rec.label}</p>
          {data.benchmark_comment && (
            <p className="text-[11px] text-[#666] mt-2">{data.benchmark_comment}</p>
          )}
        </div>
      </div>

      {/* 타겟 적합도 세분화 + Van Westendorp 가격 — 둘 다 AI 호출 없는 순수 집계 */}
      {(data.sean_ellis_segments?.inTargetPct != null || data.sean_ellis_segments?.outOfTargetPct != null || data.van_westendorp) && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-5">
          {(data.sean_ellis_segments?.inTargetPct != null || data.sean_ellis_segments?.outOfTargetPct != null) && (
            <div>
              <h3 className="text-sm font-black mb-2.5">타겟 적합도별 핵심 만족도</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                  <p className="text-[9px] font-black text-[#999] mb-1">타겟군 내 응답자</p>
                  <p className="text-lg font-black text-[#1D1C1C]">
                    {data.sean_ellis_segments?.inTargetPct ?? '-'}{data.sean_ellis_segments?.inTargetPct != null && '%'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                  <p className="text-[9px] font-black text-[#999] mb-1">타겟군 밖 응답자</p>
                  <p className="text-lg font-black text-[#1D1C1C]">
                    {data.sean_ellis_segments?.outOfTargetPct ?? '-'}{data.sean_ellis_segments?.outOfTargetPct != null && '%'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {data.van_westendorp && (
            <div>
              <h3 className="text-sm font-black mb-2.5">가격 민감도 (Van Westendorp)</h3>
              {data.van_westendorp.acceptable_price_range ? (
                <p className="text-[11px] font-bold text-[#666]">
                  수용 가능 가격대: {data.van_westendorp.acceptable_price_range[0].toLocaleString()}원 ~{' '}
                  {data.van_westendorp.acceptable_price_range[1].toLocaleString()}원
                </p>
              ) : (
                <p className="text-[11px] font-bold text-[#999]">응답이 부족해 수용 가격대를 계산할 수 없어요.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 문항별 응답 요약 — AI가 아니라 실제 답변 집계 */}
      {data.question_summary?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">문항별 응답 요약</h3>
          <div className="flex flex-col gap-5">
            {data.question_summary.map((q, i) => (
              <div key={i}>
                <p className="text-[11px] font-bold text-[#666] mb-2.5">{q.question_text}</p>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2.5">
                      <span className="text-[11px] text-[#1D1C1C] w-28 shrink-0 truncate">{o.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${oi === 0 ? 'bg-[#F77019]' : 'bg-[#F77019]/40'}`}
                          style={{ width: `${o.pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#1D1C1C] w-24 text-right shrink-0">
                        {o.pct}% <span className="text-[#999] font-medium">({o.total}명 중 {o.count}명)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 인사이트 — 1번만 무료 공개, 2~5번은 ReportPaidSections에서 */}
      {firstInsight && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">핵심 인사이트</h3>
          <div className="flex items-start gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
            <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded mt-0.5">1</span>
            <p className="text-[11px] font-bold text-[#1D1C1C]">{firstInsight}</p>
          </div>
        </div>
      )}

      {/* 패널 프로필 — AI가 아니라 실제 인구통계 집계. domain_tags가 아직
          거의 안 채워져 있어서(2026-07-31 기준) 직군 쪽은 빌 수 있다 —
          채워진 값이 있을 때만 각 그룹을 보여준다. */}
      {data.panel_summary && data.panel_summary.total_reviewers > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">참여 패널 프로필 ({data.panel_summary.total_reviewers}명)</h3>
          <div className="flex flex-col gap-3">
            <PanelGroupRow label="직군" items={data.panel_summary.jobs} emptyNote="아직 직군을 입력한 리뷰어가 없어요" />
            <PanelGroupRow label="성별" items={data.panel_summary.genders} emptyNote="성별 정보 없음" />
            <PanelGroupRow label="연령대" items={data.panel_summary.age_buckets} emptyNote="연령대 정보 없음" />
          </div>
          {data.response_time_summary && data.response_time_summary.sample_size > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1D1C1C]/8 flex items-center gap-4 flex-wrap">
              <span className="text-[10px] font-bold text-[#666]">
                평균 응답 소요시간 <span className="text-[#1D1C1C] font-black">{data.response_time_summary.avg_minutes}분</span>
              </span>
              <span className="text-[10px] font-bold text-[#999]">
                (최단 {data.response_time_summary.fastest_minutes}분 · 최장 {data.response_time_summary.slowest_minutes}분, {data.response_time_summary.sample_size}명 기준)
              </span>
              {data.response_time_summary.suspiciously_fast_count > 0 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  ⚠ {data.response_time_summary.suspiciously_fast_count}명이 2분 미만으로 제출했어요
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 리뷰어별 서술 요약 + 원문 인용 */}
      {(data.reviewer_narratives?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">리뷰어별 의견</h3>
          <div className="flex flex-col gap-4">
            {data.reviewer_narratives!.map((n, i) => (
              <div key={i} className="rounded-2xl bg-[#F5F5F5] p-4">
                <p className="text-[10px] font-black text-[#F77019] mb-1.5">{n.reviewer_tag}</p>
                <p className="text-[11px] font-bold text-[#1D1C1C] mb-2">{n.summary}</p>
                {n.notable_quote && (
                  <p className="text-[11px] text-[#666] italic border-l-2 border-[#F77019]/40 pl-3">
                    &ldquo;{n.notable_quote}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가장 강한 반대/우려 의견 */}
      {data.strongest_objection && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h3 className="text-sm font-black mb-3 text-red-700">가장 강한 우려 의견</h3>
          <p className="text-[11px] font-bold text-red-800 italic mb-1.5">&ldquo;{data.strongest_objection.quote}&rdquo;</p>
          <p className="text-[10px] font-black text-red-500">— {data.strongest_objection.reviewer_tag}</p>
        </div>
      )}

      {/* 반복되는 주제 */}
      {(data.theme_frequency?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">반복되는 주제</h3>
          <div className="flex flex-col gap-3">
            {data.theme_frequency!.map((t, i) => (
              <div key={i} className="rounded-2xl bg-[#F5F5F5] p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black text-[#1D1C1C]">{t.theme}</span>
                  <span className="text-[9px] font-bold text-[#999]">{t.count}명 언급</span>
                </div>
                {t.sample_quotes?.map((q, qi) => (
                  <p key={qi} className="text-[10px] text-[#666] italic">&ldquo;{q}&rdquo;</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 원문 인용 모음 */}
      {(data.verbatim_quotes?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">리뷰어 원문 인용</h3>
          <div className="flex flex-col gap-3">
            {data.verbatim_quotes!.map((v, i) => (
              <div key={i} className="border-l-2 border-[#1D1C1C]/10 pl-3">
                <p className="text-[11px] text-[#1D1C1C] italic">&ldquo;{v.quote}&rdquo;</p>
                <p className="text-[9px] font-bold text-[#999] mt-1">{v.reviewer_tag} · {v.question_context}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PanelGroupRow({
  label,
  items,
  emptyNote,
}: {
  label: string
  items: { label: string; count: number }[]
  emptyNote: string
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-bold text-[#999]">
        <span className="w-12 shrink-0 text-[#666]">{label}</span>
        <span>{emptyNote}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-12 shrink-0 text-[10px] font-bold text-[#666]">{label}</span>
      {items.map((it, i) => (
        <span key={i} className="text-[10px] font-bold text-[#1D1C1C] bg-[#F5F5F5] px-2 py-1 rounded-lg">
          {it.label} {it.count}명
        </span>
      ))}
    </div>
  )
}

function ScoreGauge({
  label,
  value,
  unit = '',
  note,
  badgeTier,
}: {
  label: string
  value: number
  unit?: string
  note?: string
  badgeTier?: ConfidenceTier
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-bold text-[#666]">{label}</p>
        {badgeTier && <ConfidenceBadge tier={badgeTier} />}
      </div>
      <div className="h-2 rounded-full bg-[#E0E0E0] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-black" style={{ color }}>{pct}{unit}</span>
        {note && <span className="text-[9px] text-[#999] font-bold">{note}</span>}
      </div>
    </div>
  )
}
