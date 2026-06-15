'use client'

import StandardReportView from './StandardReportView'

type DeepReportData = {
  usability_score: number
  intuitiveness_score: number
  trust_score: number
  friction_points: string[]
  priority_fixes: string[]
  // PMF 모드에서만 존재
  psf_score?: number
  sean_ellis_pct?: number
  recommendation?: 'continue' | 'pivot' | 'stop'
}

export default function DeepReportView({
  data,
  mode,
}: {
  data: DeepReportData
  mode: 'psf' | 'pmf'
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* UX 3대 스코어 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Deep</span>
          <h3 className="text-sm font-black">UX 심층 분석 리포트</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ScoreCard label="사용성" value={data.usability_score} />
          <ScoreCard label="직관성" value={data.intuitiveness_score} />
          <ScoreCard label="신뢰도" value={data.trust_score} />
        </div>
      </div>

      {/* Friction Points */}
      {data.friction_points?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">막힌 지점 (Friction Points)</h3>
          <div className="flex flex-col gap-2">
            {data.friction_points.map((fp, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <span className="text-[10px] font-black text-red-500 mt-0.5">!</span>
                <p className="text-[11px] font-bold text-[#1D1C1C]">{fp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 우선 개선 영역 */}
      {data.priority_fixes?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">우선 개선 영역</h3>
          <div className="flex flex-col gap-2">
            {data.priority_fixes.map((fix, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-[#F77019]/5 border border-[#F77019]/10 px-4 py-3">
                <span className="w-5 h-5 rounded-full bg-[#F77019] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-[11px] font-bold text-[#1D1C1C]">{fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PMF 모드: Standard 리포트 요소도 추가 */}
      {mode === 'pmf' && data.psf_score !== undefined && (
        <StandardReportView
          data={{
            psf_score: data.psf_score,
            sean_ellis_pct: data.sean_ellis_pct ?? 0,
            recommendation: data.recommendation ?? 'continue',
            key_insights: [],
            pattern_analysis: '',
            benchmark_comment: '',
            action_plan: [],
            pivot_scenarios: [],
          }}
          mode="pmf"
        />
      )}
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-5 flex flex-col items-center gap-2">
      <p className="text-[10px] font-bold text-[#666]">{label}</p>
      <span className="text-3xl font-black" style={{ color }}>{pct}</span>
      <div className="w-full h-1.5 rounded-full bg-[#E0E0E0] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
