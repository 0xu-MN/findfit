'use client'

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

export type ReportPaidData = {
  key_insights: string[] // 전체 배열 — 2번부터만 렌더링
  action_plan: string[]
  pivot_scenarios: string[]
  competitor_references: CompetitorRef[]
  market_size: MarketSize
  positioning_map: PositioningMap
  unit_economics: UnitEconomics | null
  gtm_strategies: GtmStrategy[] | null
  scaleup_roadmap: ScaleupPhase[] | null
}

export default function ReportPaidSections({
  data,
  recommendation,
}: {
  data: ReportPaidData
  recommendation: 'continue' | 'pivot' | 'stop'
}) {
  const remainingInsights = (data.key_insights ?? []).slice(1)
  const pivotTitle = recommendation === 'continue' ? '추가 성장 시나리오' : '피봇 시나리오'

  return (
    <div className="flex flex-col gap-4">
      {/* 인사이트 2~5 */}
      {remainingInsights.length > 0 && (
        <Card title="추가 인사이트">
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
        <Card title="다음 액션">
          <div className="flex flex-col gap-2">
            {data.action_plan.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[#F77019]/5 border border-[#F77019]/10 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-[#F77019] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-[11px] font-bold text-[#1D1C1C]">{a}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 피봇 / 성장 시나리오 */}
      {data.pivot_scenarios?.length > 0 && (
        <Card title={pivotTitle}>
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
        <Card title="시장 규모 분석 · TAM / SAM / SOM">
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
        <Card title="경쟁사 포지셔닝 맵">
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

      {/* Unit Economics — beta/launched 단계만 */}
      {data.unit_economics && (
        <Card title="Unit Economics · 수익성 분석">
          <div className="grid grid-cols-3 gap-3">
            <UeStat label="예상 CAC" value={data.unit_economics.cac} />
            <UeStat label="예상 LTV" value={data.unit_economics.ltv} />
            <UeStat label="LTV / CAC" value={data.unit_economics.ratio} highlight />
          </div>
          <p className="mt-3 text-[10px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3 leading-relaxed">
            {data.unit_economics.basis_note}
          </p>
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
        <Card title="참고 레퍼런스">
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
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className="text-sm font-black mb-4">{title}</h3>
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
