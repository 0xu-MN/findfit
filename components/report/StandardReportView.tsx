'use client'

type StandardReportData = {
  psf_score: number
  sean_ellis_pct: number
  recommendation: 'continue' | 'pivot' | 'stop'
  key_insights: string[]
  pattern_analysis: string
  benchmark_comment: string
  action_plan: string[]
  pivot_scenarios: string[]
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  continue: { label: '이대로 계속 진행해도 좋아요', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  pivot:    { label: '방향을 조금 바꿔보는 게 좋아요', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  stop:     { label: '지금 방향은 다시 생각해봐야 해요', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

export default function StandardReportView({ data, mode }: { data: StandardReportData; mode: 'psf' | 'pmf' }) {
  const rec = RECOMMENDATION_LABELS[data.recommendation] ?? RECOMMENDATION_LABELS.continue

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
          <ScoreGauge label="핵심 만족도 지수" value={data.sean_ellis_pct} unit="%" note="'매우 아쉽다' 비율" />
        </div>

        <div className={`rounded-2xl border p-4 ${rec.bg}`}>
          <p className="text-[10px] font-bold text-[#666] mb-1">AI 판정</p>
          <p className={`text-lg font-black ${rec.color}`}>{rec.label}</p>
          {data.benchmark_comment && (
            <p className="text-[11px] text-[#666] mt-2">{data.benchmark_comment}</p>
          )}
        </div>
      </div>

      {/* 핵심 인사이트 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-black mb-4">핵심 인사이트</h3>
        <div className="flex flex-col gap-2">
          {data.key_insights?.map((ins, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
              <span className="text-[10px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded mt-0.5">
                {i + 1}
              </span>
              <p className="text-[11px] font-bold text-[#1D1C1C]">{ins}</p>
            </div>
          ))}
        </div>
        {data.pattern_analysis && (
          <div className="mt-4 rounded-xl bg-[#F5F5F5] px-4 py-3">
            <p className="text-[10px] font-black text-[#666] mb-1">패턴 분석</p>
            <p className="text-[11px] font-bold text-[#1D1C1C]">{data.pattern_analysis}</p>
          </div>
        )}
      </div>

      {/* 액션 플랜 */}
      {data.action_plan?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">액션 플랜</h3>
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
        </div>
      )}

      {/* 피봇 시나리오 */}
      {data.pivot_scenarios?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">피봇 시나리오</h3>
          <div className="flex flex-col gap-2">
            {data.pivot_scenarios.map((s, i) => (
              <div key={i} className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                <p className="text-[11px] font-bold text-[#666]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreGauge({ label, value, unit = '', note }: { label: string; value: number; unit?: string; note?: string }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-5 flex flex-col gap-3">
      <p className="text-[10px] font-bold text-[#666]">{label}</p>
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
