'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
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

// 성별별 프로필 이미지 3장씩 — 리뷰어별로 랜덤 배정한다. 매 렌더마다 바뀌면
// 화면이 깜빡이는 것처럼 보이므로, reviewer_tag를 시드로 한 해시로 "리뷰어당
// 하나로 고정된 랜덤"을 만든다(리포트를 다시 열어도 같은 리뷰어는 같은 사진).
const MALE_AVATARS = ['/avatars/male-1.png', '/avatars/male-2.png', '/avatars/male-3.png']
const FEMALE_AVATARS = ['/avatars/female-1.png', '/avatars/female-2.png', '/avatars/female-3.png']

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

// 성별 미입력이면 남/여 사진 중 아무거나 잘못 보여주는 대신, 사진 없음(빈
// 아이콘) 처리한다 — 실제로 모르는 정보를 사진으로 지어내지 않기 위함.
function pickAvatar(gender: string | null | undefined, seed: string): string | null {
  const pool = gender === '남성' ? MALE_AVATARS : gender === '여성' ? FEMALE_AVATARS : null
  if (!pool) return null
  return pool[hashSeed(seed) % pool.length]
}
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

type BreakdownGroup = { gender: string; total: number; options: { label: string; count: number; pct: number }[] }
export type DemographicBreakdownItem = {
  question_text: string
  by_gender?: BreakdownGroup[]
  by_age_bucket?: BreakdownGroup[]
  by_job?: BreakdownGroup[]
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
  demographic_breakdown?: DemographicBreakdownItem[]
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

const NARRATIVES_PER_PAGE = 3

export default function StandardReportView({ data, mode }: { data: StandardReportData; mode: 'psf' | 'pmf' }) {
  const rec = RECOMMENDATION_LABELS[data.recommendation] ?? RECOMMENDATION_LABELS.continue
  // 리뷰어가 많아지면 "리뷰어별 의견" 카드가 한없이 길어질 수 있어서, 5명
  // 까지만 먼저 보여주고 나머지는 더보기로 펼친다.
  // 5명 넘으면 "더보기"로 아래에 쌓아 보여주던 걸 → 한 번에 3명씩 좌우로
  // 넘겨보는 캐러셀로 변경(요청: "3명씩 좌우로 넘기면서 볼 수 있게").
  const [narrativePage, setNarrativePage] = useState(0)
  const firstInsight = data.key_insights?.[0]
  const tiers = data.confidence_tiers ?? {
    sean_ellis: 'verified' as const,
    score_baseline: 'ai_estimate' as const,
    usage_frequency_note: 'ai_estimate' as const,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 스코어 + 판정 */}
      <div id="report-score" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Standard</span>
          <h3 className="text-sm font-black">{mode === 'psf' ? '아이디어 검증' : '실사용 만족도 검증'} 리포트</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* 문항별 응답 요약 — 순위·라벨·%가 바 밖이 아니라 바 안에 얹혀서
          나온다(트랙 전체 위에 텍스트를 올리고, 그 뒤에 응답 비율(%)만큼만
          채워진 막대를 깔아서 텍스트가 항상 보이게). 순위별 색은 투명도가
          아니라 서로 다른 고정 색이라 낮은 순위도 트랙에 묻히지 않는다. */}
      {data.question_summary?.length > 0 && (
        <div id="report-question-summary" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-5">문항별 응답 요약</h3>
          <div className="flex flex-col gap-7">
            {data.question_summary.map((q, i) => (
              <div key={i}>
                <p className="text-[12px] font-black text-[#1D1C1C] mb-3">{q.question_text}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((o, oi) => {
                    // 순위별 고정 색(투명도 아님) — 1위가 가장 진한 색, 아래로
                    // 갈수록 톤만 옅어질 뿐 색 자체는 항상 또렷하다. 글씨는
                    // 색과 무관하게 항상 다크로 고정해서 어떤 폭이든 읽힌다.
                    const barColors = ['#F77019', '#FF8F45', '#FFB27A', '#FFCFA8', '#FFE6D2']
                    const barColor = barColors[Math.min(oi, barColors.length - 1)]
                    return (
                      <div key={oi} className="relative w-full h-10 rounded-full bg-[#F5F5F5] overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${o.pct}%`, background: barColor }}
                        />
                        <div className="relative z-10 h-full flex items-center justify-between gap-2 px-4">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-black text-[#1D1C1C]/70 shrink-0">{oi + 1}위</span>
                            <span className="text-[11px] font-black text-[#1D1C1C] truncate">{o.label}</span>
                          </div>
                          <span className="text-[12px] font-black text-[#1D1C1C] shrink-0">{o.pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[9px] font-bold text-[#BBB] mt-1.5">
                  총 {q.options[0]?.total ?? 0}명 응답
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인구통계별 응답 차이 — 성별/연령대/직군 세 축 각각 최소 2개 그룹이
          그룹당 2명 이상 응답한 문항만 표시된다(데이터가 부족하면 비교 자체가
          무의미하므로). 직군은 domain_tags 입력률이 낮아 지금은 거의 항상
          빠지고, 데이터가 쌓이면 자동으로 나타난다. 선택지가 2개면 도넛으로,
          3개 이상이면 막대로 — 카드형 미니 차트. */}
      {(data.demographic_breakdown?.length ?? 0) > 0 && (
        <div id="report-demographic-breakdown" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-8">
          <h3 className="text-sm font-black -mb-3">인구통계별 응답 차이</h3>
          <DemographicBreakdownSection
            title="성별에 따른 응답 차이"
            note="응답자 중 성별을 입력한 인원만 집계했어요."
            items={data.demographic_breakdown!}
            pick={(q) => q.by_gender}
          />
          <DemographicBreakdownSection
            title="연령대에 따른 응답 차이"
            note="응답자 중 생년월일을 입력한 인원만 집계했어요."
            items={data.demographic_breakdown!}
            pick={(q) => q.by_age_bucket}
          />
          <DemographicBreakdownSection
            title="직군에 따른 응답 차이"
            note="응답자 중 관심 직군을 선택한 인원만 집계했어요."
            items={data.demographic_breakdown!}
            pick={(q) => q.by_job}
          />
        </div>
      )}

      {/* 핵심 인사이트 — 1번만 무료 공개, 2~5번은 ReportPaidSections에서 */}
      {firstInsight && (
        <div id="report-key-insights" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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
        <div id="report-panel-profile" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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
        <div id="report-reviewer-narratives" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1D1C1C]">리뷰어별 의견</h3>
            <span className="text-xs font-bold text-[#F77019] bg-[#F77019]/10 px-2.5 py-1 rounded-full">
              PERSONA CARD
            </span>
          </div>

          {/* 카드 자체가 프로필+성향+시나리오+페인포인트를 다 담은 넓은
              레이아웃이라 3개를 가로로 나란히 두면 안에 있는 12칸 그리드가
              찌그러진다 — 세로로 3장씩 쌓아 보여주고, 그 3장 묶음 단위를
              좌우 화살표로 넘기는 방식으로("페이지당 3명 캐러셀"). */}
          <div className="flex flex-col gap-6">
            {data.reviewer_narratives!.slice(narrativePage * NARRATIVES_PER_PAGE, narrativePage * NARRATIVES_PER_PAGE + NARRATIVES_PER_PAGE).map((n, localI) => {
              const i = narrativePage * NARRATIVES_PER_PAGE + localI // 색상/슬라이더 다양성을 페이지 넘어가도 유지
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
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden shadow-md border-2 flex items-center justify-center bg-gray-100"
                        style={{ borderColor: theme.accent }}
                      >
                        {(() => {
                          const avatarSrc = pickAvatar(n.gender, n.reviewer_tag || String(i))
                          return avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarSrc} alt={n.reviewer_tag} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 sm:w-14 sm:h-14 text-gray-300" strokeWidth={1.5} />
                          )
                        })()}
                      </div>
                      <span className="mt-2 text-xs font-extrabold text-gray-700">{n.reviewer_tag}</span>
                    </div>

                    {/* PROFILE */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <h4 className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: theme.accent }}>
                        PROFILE
                      </h4>
                      <div className="flex flex-col gap-2 text-xs">
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
          {(() => {
            const total = data.reviewer_narratives!.length
            const pageCount = Math.ceil(total / NARRATIVES_PER_PAGE)
            if (pageCount <= 1) return null
            return (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setNarrativePage((p) => Math.max(0, p - 1))}
                  disabled={narrativePage === 0}
                  className="w-9 h-9 rounded-full border border-[#1D1C1C]/10 flex items-center justify-center text-[#666] hover:text-[#F77019] hover:border-[#F77019]/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-[#999]">
                  {narrativePage + 1} / {pageCount}
                </span>
                <button
                  onClick={() => setNarrativePage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={narrativePage === pageCount - 1}
                  className="w-9 h-9 rounded-full border border-[#1D1C1C]/10 flex items-center justify-center text-[#666] hover:text-[#F77019] hover:border-[#F77019]/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )
          })()}
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

      {/* 반복되는 주제 — 언급 빈도를 원 크기로 표현하는 버블 클러스터.
          가장 많이 언급된 주제일수록 크고 진하게, 아래에 원문 예시를 덧붙인다. */}
      {(data.theme_frequency?.length ?? 0) > 0 && (
        <div id="report-themes" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-5">반복되는 주제</h3>
          <ThemeBubbleCluster themes={data.theme_frequency!} />
          <div className="flex flex-col gap-3 mt-6">
            {[...data.theme_frequency!].sort((a, b) => b.count - a.count).map((t, i) => (
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
        <div id="report-quotes" className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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

function DemographicBreakdownSection({
  title,
  note,
  items,
  pick,
}: {
  title: string
  note: string
  items: DemographicBreakdownItem[]
  pick: (q: DemographicBreakdownItem) => BreakdownGroup[] | undefined
}) {
  const rows = items
    .map((q) => ({ question_text: q.question_text, groups: pick(q) }))
    .filter((q): q is { question_text: string; groups: BreakdownGroup[] } => (q.groups?.length ?? 0) > 0)

  if (rows.length === 0) return null

  return (
    <div>
      <h4 className="text-[12px] font-black text-[#1D1C1C] mb-1">{title}</h4>
      <p className="text-[9px] font-bold text-[#999] mb-4">{note}</p>
      <div className="flex flex-col gap-5">
        {rows.map((q, i) => (
          <div key={i}>
            <div className="rounded-2xl bg-[#F5F5F5] px-4 py-3 mb-3">
              <p className="text-[9px] font-black text-[#F77019] mb-0.5">Q.</p>
              <p className="text-[11px] font-bold text-[#1D1C1C]">{q.question_text}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.groups.map((g, gi) => (
                <div key={gi} className="rounded-2xl border border-[#1D1C1C]/8 p-4 flex flex-col items-center gap-3 text-center">
                  <span className="text-[10px] font-black text-[#1D1C1C]">{g.gender} · {g.total}명</span>
                  {g.options.length === 2 ? (
                    <MiniDonut label={g.options[0].label} pct={g.options[0].pct} />
                  ) : (
                    <div className="w-full flex flex-col gap-1.5">
                      {g.options.map((o, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="text-[9px] text-[#666] w-16 shrink-0 truncate text-left">{o.label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
                            <div className="h-full rounded-full bg-[#F77019]" style={{ width: `${o.pct}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-[#1D1C1C] w-8 shrink-0 text-right">{o.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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

// 파스텔 톤이 섞인 선명한 팔레트 — 이전 원색 조합이 밋밋하다는 피드백 반영.
const BUBBLE_COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFA45B', '#9B72CF', '#00C2A8']

// 언급 빈도를 원 크기로 표현하는 버블 클러스터. 골든 앵글(137.5°) 나선을
// 따라가되, 원들이 서로 겹쳐서 글자가 안 보이는 문제가 있었다(반지름 계산이
// 원 크기에 비해 너무 작았음) — 이번엔 실제 충돌 검사를 넣어서, 각 원을
// 나선을 따라 조금씩 밀어내며 이미 놓인 원들과 안 겹칠 때까지 반지름을
// 늘려가며 배치한다(그리디 팩킹). 그래도 살짝 맞닿는 정도는 허용해서
// "따로따로 나열"이 아니라 "뭉쳐있는" 느낌은 유지한다.
const GOLDEN_ANGLE = 137.5

function ThemeBubbleCluster({ themes }: { themes: { theme: string; count: number }[] }) {
  const sorted = [...themes].sort((a, b) => b.count - a.count)
  const maxCount = sorted[0]?.count ?? 1
  const minSize = 64
  const maxSize = 148
  const padding = 6 // 원 사이 최소 간격(px) — 완전히 붙어서 경계가 안 보이는 것 방지

  type Placed = { theme: string; count: number; size: number; x: number; y: number; color: string }
  const placed: Placed[] = []

  sorted.forEach((t, i) => {
    const ratio = Math.sqrt(t.count / maxCount)
    const size = Math.round(minSize + ratio * (maxSize - minSize))
    const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length]

    if (i === 0) {
      placed.push({ ...t, size, x: 0, y: 0, color })
      return
    }

    const angle = (i * GOLDEN_ANGLE * Math.PI) / 180
    let radius = size / 2 + 20
    // 반지름을 조금씩 늘려가며, 이미 놓인 모든 원과 안 겹치는 지점을 찾는다.
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)
      const collides = placed.some((p) => {
        const dist = Math.hypot(p.x - x, p.y - y)
        return dist < (p.size + size) / 2 + padding
      })
      if (!collides) {
        placed.push({ ...t, size, x, y, color })
        return
      }
      radius += 12
    }
    // 60번 시도해도 못 찾으면(항목이 아주 많을 때) 마지막 위치라도 사용
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    placed.push({ ...t, size, x, y, color })
  })

  const maxExtent = Math.max(...placed.map((p) => Math.hypot(p.x, p.y) + p.size / 2), maxSize / 2) + 12
  const containerSize = maxExtent * 2
  const center = containerSize / 2

  return (
    <div className="relative mx-auto" style={{ width: containerSize, height: containerSize, maxWidth: '100%' }}>
      {[...placed].reverse().map((b, ri) => (
        <div
          key={b.theme}
          className="absolute rounded-full flex flex-col items-center justify-center text-center text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border-2 border-white"
          style={{
            width: b.size,
            height: b.size,
            left: center + b.x,
            top: center + b.y,
            transform: 'translate(-50%, -50%)',
            background: b.color,
            zIndex: placed.length - ri,
          }}
        >
          <span className="font-black leading-tight px-2" style={{ fontSize: b.size > 110 ? 13 : 10 }}>{b.theme}</span>
          <span className="font-bold opacity-90" style={{ fontSize: b.size > 110 ? 11 : 9 }}>{b.count}명</span>
        </div>
      ))}
    </div>
  )
}

// 선택지가 2개뿐인 문항(예/아니오류)의 성별 카드에 쓰는 작은 도넛 —
// 1위 선택지 비율만 강조해서 보여준다(전체 원형 SVG, conic-gradient 대체).
function MiniDonut({ label, pct }: { label: string; pct: number }) {
  const r = 32
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  return (
    <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#F5F5F5" strokeWidth="9" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#F77019"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-[#1D1C1C]">{pct}%</span>
      </div>
      <span className="absolute -bottom-5 text-[8px] font-bold text-[#999] truncate max-w-[80px]">{label}</span>
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
