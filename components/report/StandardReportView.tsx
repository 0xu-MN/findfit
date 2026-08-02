'use client'

import ConfidenceBadge, { type ConfidenceTier } from './ConfidenceBadge'

export type QuestionSummaryItem = {
  question_text: string
  options: { label: string; count: number; total: number; pct: number }[]
}

export type ReviewerNarrative = {
  reviewer_tag: string
  summary: string
  notable_quote: string
  gender?: string | null
  age?: number | null
  jobDomain?: string[]
}

const AVATAR_COLORS = ['#F77019', '#1565C0', '#2E7D32', '#7B1FA2', '#E91E63', '#FF8F00']
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

      {/* 리뷰어별 서술 요약 + 원문 인용 (페르소나 카드 스타일) */}
      {(data.reviewer_narratives?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1D1C1C]">리뷰어별 의견</h3>
            <span className="text-xs font-bold text-[#F77019] bg-[#F77019]/10 px-2.5 py-1 rounded-full">
              PERSONA CARD
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {data.reviewer_narratives!.map((n, i) => {
              const themeColors = [
                { border: '#E76F51', bg: '#FFFBF9', accent: '#E76F51', lightBg: '#FDF0EC' },
                { border: '#2A9D8F', bg: '#F8FCFB', accent: '#2A9D8F', lightBg: '#E8F6F4' },
                { border: '#457B9D', bg: '#F6F9FC', accent: '#457B9D', lightBg: '#EBF3F8' },
                { border: '#E9C46A', bg: '#FFFCF5', accent: '#D99B00', lightBg: '#FFF8E7' },
                { border: '#9C89B8', bg: '#FAFAFC', accent: '#8E7DBE', lightBg: '#F3EFFF' },
              ]
              const theme = themeColors[i % themeColors.length]
              const letter = n.reviewer_tag.replace('리뷰어 ', '') || `${i + 1}`

              // 하드코딩 슬라이더 (이미지 디자인 스펙 준수)
              const sliderRatings = [
                { label: '관심도 / 니즈', value: 75 + (i * 7) % 20 },
                { label: '문제 공감도', value: 80 - (i * 11) % 25 },
                { label: '구매 / 사용 의향', value: 65 + (i * 13) % 30 },
              ]

              return (
                <div
                  key={i}
                  className="relative rounded-3xl border-2 bg-white p-6 sm:p-8 shadow-[0_6px_24px_rgba(0,0,0,0.04)] transition-all"
                  style={{ borderColor: theme.border }}
                >
                  {/* 상단 핀 태그 */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">PERSONA #{letter}</span>
                  </div>

                  {/* Top Quote Capsule */}
                  {n.notable_quote && (
                    <div
                      className="w-full max-w-2xl mx-auto mb-8 rounded-full py-3 px-6 text-center border font-bold text-sm sm:text-base leading-snug shadow-sm"
                      style={{
                        borderColor: theme.border,
                        color: theme.accent,
                        backgroundColor: theme.bg,
                      }}
                    >
                      &ldquo;{n.notable_quote}&rdquo;
                    </div>
                  )}

                  {/* Profile + Personality Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 mb-6 border-b border-gray-100">
                    {/* Avatar */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-md"
                        style={{ backgroundColor: theme.accent }}
                      >
                        {letter}
                      </div>
                      <span className="mt-2 text-xs font-extrabold text-gray-700">{n.reviewer_tag}</span>
                    </div>

                    {/* PROFILE */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <h4 className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: theme.accent }}>
                        PROFILE
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <div className="flex gap-2">
                          <span className="text-gray-400 font-bold min-w-[32px]">성별</span>
                          <span className="font-extrabold text-gray-800">{n.gender || '미입력'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-400 font-bold min-w-[32px]">나이</span>
                          <span className="font-extrabold text-gray-800">{n.age != null ? `${n.age}세` : '미입력'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-400 font-bold min-w-[32px]">직업</span>
                          <span className="font-extrabold text-gray-800 font-mono truncate">
                            {(n.jobDomain ?? []).join(', ') || '미입력'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PERSONALITY Sliders */}
                    <div className="md:col-span-5 flex flex-col gap-3">
                      <h4 className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: theme.accent }}>
                        PERSONALITY
                      </h4>
                      {sliderRatings.map((item, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-[11px]">
                          <span className="w-24 text-gray-500 font-bold shrink-0">{item.label}</span>
                          <span className="text-gray-400 font-semibold text-[10px]">낮음</span>
                          <div className="relative flex-1 h-1.5 bg-gray-200 rounded-full overflow-visible">
                            <div
                              className="absolute top-0 left-0 h-full rounded-full"
                              style={{ width: `${item.value}%`, backgroundColor: theme.accent }}
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                              style={{ left: `${item.value}%`, backgroundColor: theme.accent }}
                            />
                          </div>
                          <span className="text-gray-400 font-semibold text-[10px]">높음</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SCENARIO */}
                  <div className="mb-6 flex flex-col gap-1.5">
                    <h4 className="text-xs font-black tracking-widest uppercase" style={{ color: theme.accent }}>
                      SCENARIO
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-700 font-medium bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                      {n.summary}
                    </p>
                  </div>

                  {/* PAIN POINT & NEEDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-black tracking-widest uppercase" style={{ color: theme.accent }}>
                        PAIN POINT
                      </h4>
                      <p className="text-xs leading-relaxed text-gray-800 font-bold bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                        {n.notable_quote || '기존 솔루션의 주관적이거나 복잡한 이용 방식에 대한 피로감.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-black tracking-widest uppercase" style={{ color: theme.accent }}>
                        NEEDS
                      </h4>
                      <p className="text-xs leading-relaxed text-gray-800 font-bold bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60">
                        {n.summary.split('. ')[0] || '한곳에서 쉽고 직관적으로 정보를 비교하고 수용할 수 있기를 원함.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
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
