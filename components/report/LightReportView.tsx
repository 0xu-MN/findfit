'use client'

type LightReportData = {
  winner: 'A' | 'B' | null
  ratio_summary: string
  key_comments: string[]
  one_line_recommendation: string
}

export default function LightReportView({ data }: { data: LightReportData }) {
  return (
    <div className="flex flex-col gap-4">
      {/* A/B 결과 카드 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Light</span>
          <h3 className="text-sm font-black">방향성 신호 리포트</h3>
        </div>

        <div className="flex gap-4 mb-6">
          {(['A', 'B'] as const).map((opt) => {
            const isWinner = data.winner === opt
            const [pctA, pctB] = (data.ratio_summary ?? '').match(/\d+/g) ?? ['50', '50']
            const pct = opt === 'A' ? pctA : pctB
            return (
              <div
                key={opt}
                className={`flex-1 rounded-2xl p-6 flex flex-col items-center gap-3 ${
                  isWinner
                    ? 'bg-[#F77019]/10 border border-[#F77019]'
                    : 'bg-[#F5F5F5] border border-transparent'
                }`}
              >
                <span className={`text-2xl font-black ${isWinner ? 'text-[#F77019]' : 'text-[#999]'}`}>{opt}</span>
                <span className={`text-3xl font-black ${isWinner ? 'text-[#F77019]' : 'text-[#1D1C1C]'}`}>{pct}%</span>
                {isWinner && (
                  <span className="text-[9px] font-black bg-[#F77019] text-white px-2 py-0.5 rounded-full">Winner</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl bg-[#F77019]/5 border border-[#F77019]/20 p-4">
          <p className="text-[11px] font-black text-[#F77019] mb-1">한 줄 추천</p>
          <p className="text-sm font-bold text-[#1D1C1C]">{data.one_line_recommendation}</p>
        </div>
      </div>

      {/* 주요 코멘트 */}
      {data.key_comments?.length > 0 && (
        <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black mb-4">주요 코멘트</h3>
          <div className="flex flex-col gap-3">
            {data.key_comments.map((c, i) => (
              <div key={i} className="rounded-xl bg-[#F5F5F5] px-4 py-3">
                <p className="text-[11px] font-bold text-[#666]">"{c}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
