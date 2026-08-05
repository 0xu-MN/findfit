'use client'

import { useState } from 'react'
import ConfidenceBadge, { type ConfidenceTier } from './ConfidenceBadge'

type CompetitorRef = { name: string; description: string }
type MarketBucket = { label: string; value: string; basis: string }
type MarketSize = { tam: MarketBucket; sam: MarketBucket; som: MarketBucket; note: string }
type PositioningCompetitor = { name: string; x: number; y: number }
type PositioningMap = {
  axes: { x_label: string; y_label: string }
  competitors: PositioningCompetitor[]
  self: { x: number; y: number }
  note: string
}
type UnitEconomics = { cac: string; ltv: string; ratio: string; basis_note: string }
type GtmStrategy = { title: string; phase: string; description: string }
type ScaleupPhase = { phase: string; title: string; description: string; kpis: string[] }

export type ConfidenceTiers = {
  sean_ellis: ConfidenceTier
  competitor_references: ConfidenceTier
  market_size: ConfidenceTier
  score_baseline: ConfidenceTier
  usage_frequency_note: ConfidenceTier
}

// 언급 빈도 근거를 함께 붙이도록 구조를 바꿨다(예전엔 string[]) — 옛
// 리포트(이 필드 생기기 전 생성분) 호환을 위해 string도 계속 허용한다.
export type ActionPlanItem = { action: string; evidence?: string | null } | string

export type ReportPaidData = {
  key_insights: string[] // 전체 배열 — 2번부터만 렌더링
  action_plan: ActionPlanItem[]
  pivot_scenarios: string[]
  competitor_references: CompetitorRef[]
  market_size: MarketSize
  positioning_map: PositioningMap
  unit_economics: UnitEconomics | null
  gtm_strategies: GtmStrategy[] | null
  scaleup_roadmap: ScaleupPhase[] | null
  confidence_tiers?: ConfidenceTiers
  sources?: { url: string; title: string | null }[]
}

export default function ReportPaidSections({
  data,
  recommendation,
  projectId,
  onFinancialsSaved,
}: {
  data: ReportPaidData
  recommendation: 'continue' | 'pivot' | 'stop'
  // 등록 마법사나 프로젝트 상세 화면에서만 입력할 수 있던 재무 정보(예상
  // 판매가/원가/마케팅 예산)를 리포트 화면에서도 바로 입력할 수 있게 한다 —
  // 두 화면 다 같은 API(/api/projects/[id]/financials)로 저장되므로 어느
  // 쪽에서 입력해도 같은 값을 공유한다. 저장 후 onFinancialsSaved로 부모가
  // 리포트를 재생성해서 Unit Economics에 즉시 반영되게 한다.
  projectId?: string
  onFinancialsSaved?: () => void
}) {
  const remainingInsights = (data.key_insights ?? []).slice(1)
  const pivotTitle = recommendation === 'continue' ? '추가 성장 시나리오' : '피봇 시나리오'
  // 옛 리포트(이 필드 생기기 전 생성분)는 confidence_tiers가 없을 수 있어
  // 전부 3단계(ai_estimate)로 안전하게 기본값 처리
  const tiers: ConfidenceTiers = data.confidence_tiers ?? {
    sean_ellis: 'ai_estimate',
    competitor_references: 'ai_estimate',
    market_size: 'ai_estimate',
    score_baseline: 'ai_estimate',
    usage_frequency_note: 'ai_estimate',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 인사이트 2~5 */}
      {remainingInsights.length > 0 && (
        <Card title="추가 인사이트" id="report-more-insights">
          <div className="flex flex-col gap-2">
            {remainingInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
                <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded mt-0.5">
                  {i + 2}
                </span>
                <p className="text-[11px] font-bold text-[#1D1C1C]">{ins}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 액션 플랜 */}
      {data.action_plan?.length > 0 && (
        <Card title="다음 액션" id="report-action-plan">
          <div className="flex flex-col gap-2">
            {data.action_plan.map((a, i) => {
              const action = typeof a === 'string' ? a : a.action
              const evidence = typeof a === 'string' ? null : a.evidence
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-[#F77019]/5 border border-[#F77019]/10 px-4 py-3">
                  <span className="w-5 h-5 rounded-full bg-[#F77019] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-[#1D1C1C]">{action}</p>
                    {evidence && (
                      <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded w-fit">
                        근거: {evidence}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 피봇 / 성장 시나리오 */}
      {data.pivot_scenarios?.length > 0 && (
        <Card title={pivotTitle} id="report-pivot">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.pivot_scenarios.map((s, i) => (
              <div key={i} className="rounded-xl border-l-4 border-[#F77019] bg-[#F77019]/5 px-4 py-3">
                <p className="text-[11px] font-bold text-[#1D1C1C] leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 시장 규모 TAM/SAM/SOM */}
      {data.market_size && (
        <Card title="시장 규모 분석 · TAM / SAM / SOM" badgeTier={tiers.market_size} id="report-market-size">
          <div className="flex flex-col gap-3">
            {(['tam', 'sam', 'som'] as const).map((key) => {
              const bucket = data.market_size[key]
              if (!bucket) return null
              const widths: Record<string, string> = { tam: '100%', sam: '65%', som: '28%' }
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-[#999] w-9 shrink-0 uppercase">{key}</span>
                  <div className="flex-1 rounded-xl bg-[#F77019]/10 overflow-hidden">
                    <div
                      className="px-4 py-2.5 flex items-center justify-between gap-2 rounded-xl"
                      style={{ width: widths[key], background: key === 'tam' ? '#1D1C1C' : key === 'sam' ? '#F77019' : '#FED7AA' }}
                    >
                      <span className={`text-[11px] font-bold truncate ${key === 'som' ? 'text-[#1D1C1C]' : 'text-white'}`}>{bucket.label}</span>
                      <span className={`text-[12px] font-black shrink-0 ${key === 'som' ? 'text-[#1D1C1C]' : 'text-white'}`}>{bucket.value}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3 leading-relaxed">
            {data.market_size.note}
          </p>
        </Card>
      )}

      {/* 포지셔닝 맵 */}
      {data.positioning_map && (
        <Card title="경쟁사 포지셔닝 맵" id="report-positioning">
          <div className="relative w-full aspect-[3/2] rounded-2xl bg-[#F5F5F5] overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 h-px bg-[#1D1C1C]/10" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-[#1D1C1C]/10" />
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#999]">{data.positioning_map.axes.y_label}</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#999]">↑ {data.positioning_map.axes.x_label}</span>
            {data.positioning_map.competitors.map((c, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                style={{ left: `${c.x}%`, top: `${100 - c.y}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#1565C0]" />
                <span className="text-[9px] font-bold text-[#666] whitespace-nowrap">{c.name}</span>
              </div>
            ))}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
              style={{ left: `${data.positioning_map.self.x}%`, top: `${100 - data.positioning_map.self.y}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-[#F77019] border-2 border-white shadow" />
              <span className="text-[10px] font-black text-[#F77019] whitespace-nowrap">우리 프로젝트</span>
            </div>
          </div>
          <p className="mt-3 text-[10px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3 leading-relaxed">
            {data.positioning_map.note}
          </p>
        </Card>
      )}

      {/* Unit Economics — 크리에이터가 재무 정보(판매가/원가/마케팅예산)를
          입력한 경우에만 실제 계산치가 나온다. 미입력이면 AI가 지어내지
          않고 null로 두므로, 안내만 보여준다. */}
      {data.unit_economics ? (
        <Card title="Unit Economics · 수익성 분석" id="report-unit-economics">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UeStat label="예상 CAC" value={data.unit_economics.cac} />
            <UeStat label="예상 LTV" value={data.unit_economics.ltv} />
            <UeStat label="LTV / CAC" value={data.unit_economics.ratio} highlight />
          </div>
          <p className="mt-3 text-[10px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3 leading-relaxed">
            {data.unit_economics.basis_note}
          </p>
        </Card>
      ) : (
        <Card title="Unit Economics · 수익성 분석" id="report-unit-economics">
          {projectId ? (
            <FinancialsInlineForm projectId={projectId} onSaved={onFinancialsSaved} />
          ) : (
            <p className="text-[11px] font-bold text-[#999] text-center py-4">
              재무 정보(예상 판매가·원가·마케팅 예산)를 입력하면 계산됩니다. 프로젝트 상세
              화면에서도 입력할 수 있어요.
            </p>
          )}
        </Card>
      )}

      {/* GTM 전략 — beta/launched + continue일 때만 */}
      {data.gtm_strategies && data.gtm_strategies.length > 0 && (
        <Card title="GTM 채널 전략">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.gtm_strategies.map((g, i) => (
              <div key={i} className="rounded-xl border border-[#1D1C1C]/8 p-4 flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded w-fit">{g.phase}</span>
                <p className="text-[12px] font-black text-[#1D1C1C]">{g.title}</p>
                <p className="text-[11px] font-bold text-[#666] leading-relaxed">{g.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scale-up 로드맵 — beta/launched + continue일 때만 */}
      {data.scaleup_roadmap && data.scaleup_roadmap.length > 0 && (
        <Card title="Scale-up 로드맵">
          <div className="flex flex-col">
            {data.scaleup_roadmap.map((s, i) => (
              <div key={i} className="flex gap-4 pb-6 last:pb-0 relative">
                {i < data.scaleup_roadmap!.length - 1 && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-px bg-[#1D1C1C]/10" />
                )}
                <div className="w-7 h-7 rounded-full bg-[#F77019]/10 border-2 border-[#F77019]/30 text-[#F77019] text-[11px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-[#999] uppercase">{s.phase}</span>
                  <p className="text-[12px] font-black text-[#1D1C1C]">{s.title}</p>
                  <p className="text-[11px] font-bold text-[#666] leading-relaxed">{s.description}</p>
                  {s.kpis?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {s.kpis.map((k, ki) => (
                        <span key={ki} className="text-[10px] font-bold text-[#F77019] bg-[#F77019]/10 px-2 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 타사 레퍼런스 */}
      {data.competitor_references?.length > 0 && (
        <Card title="참고 레퍼런스" badgeTier={tiers.competitor_references} id="report-references">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.competitor_references.map((c, i) => (
              <div key={i} className="rounded-xl border border-[#1D1C1C]/8 p-4 flex flex-col gap-1.5">
                <p className="text-[12px] font-black text-[#1D1C1C]">{c.name}</p>
                <p className="text-[11px] font-bold text-[#666] leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 웹검색 출처 각주 — 시장규모/경쟁사레퍼런스/GTM 생성 시 실제 검색한 URL */}
      {data.sources && data.sources.length > 0 && (
        <div className="rounded-2xl border border-[#1D1C1C]/8 bg-[#FAFAFA] p-4 flex flex-col gap-1.5">
          <p className="text-[9px] font-black text-[#999]">출처</p>
          {data.sources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#189DF7] hover:underline truncate"
            >
              {s.title ?? s.url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function Card({ title, badgeTier, id, children }: { title: string; badgeTier?: ConfidenceTier; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-black">{title}</h3>
        {badgeTier && <ConfidenceBadge tier={badgeTier} />}
      </div>
      {children}
    </div>
  )
}

function UeStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4 text-center flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-[#666]">{label}</span>
      <span className={`text-lg font-black ${highlight ? 'text-green-600' : 'text-[#1D1C1C]'}`}>{value}</span>
    </div>
  )
}

function FinancialsInlineForm({ projectId, onSaved }: { projectId: string; onSaved?: () => void }) {
  const [form, setForm] = useState({ expectedPrice: '', expectedCost: '', marketingBudget: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/financials`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedPrice: Number(form.expectedPrice) || 0,
        expectedCost: Number(form.expectedCost) || 0,
        marketingBudget: Number(form.marketingBudget) || 0,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      // 저장만으로는 기존 리포트의 unit_economics가 자동으로 안 바뀐다
      // (생성 시점에 계산돼서 저장된 값이라) — 부모가 재생성까지 이어서
      // 호출해야 이 화면에 바로 반영된다.
      onSaved?.()
    }
  }

  if (saved) {
    return (
      <p className="text-[11px] font-bold text-[#2E7D32] text-center py-4">
        저장했어요. 리포트를 다시 계산하고 있어요 — 잠시 후 이 자리에 결과가 나와요.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold text-[#999]">
        재무 정보(예상 판매가·원가·마케팅 예산)를 입력하면 CAC/LTV가 계산돼요. 여기서 입력하면
        프로젝트 상세 화면에도 그대로 반영돼요.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="number"
          min={0}
          placeholder="예상 판매가(원)"
          value={form.expectedPrice}
          onChange={(e) => setForm((f) => ({ ...f, expectedPrice: e.target.value }))}
          className="h-10 rounded-xl border border-[#1D1C1C]/12 px-3 text-[12px] font-bold outline-none focus:border-[#F77019]"
        />
        <input
          type="number"
          min={0}
          placeholder="예상 원가(원)"
          value={form.expectedCost}
          onChange={(e) => setForm((f) => ({ ...f, expectedCost: e.target.value }))}
          className="h-10 rounded-xl border border-[#1D1C1C]/12 px-3 text-[12px] font-bold outline-none focus:border-[#F77019]"
        />
        <input
          type="number"
          min={0}
          placeholder="월 마케팅 예산(원)"
          value={form.marketingBudget}
          onChange={(e) => setForm((f) => ({ ...f, marketingBudget: e.target.value }))}
          className="h-10 rounded-xl border border-[#1D1C1C]/12 px-3 text-[12px] font-bold outline-none focus:border-[#F77019]"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="self-start px-4 py-2 rounded-xl bg-[#F77019] text-white text-[11px] font-black hover:bg-[#e0621a] disabled:opacity-60 transition-colors"
      >
        {saving ? '저장 중...' : '저장하고 리포트에 반영'}
      </button>
    </div>
  )
}
