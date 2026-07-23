'use client'

type SentimentItem = { keyword: string; count: number; example_quote: string }
type SegmentItem = { segment: string; summary: string; notable_diff: string }
type BarrierItem = { theme: string; count: number; example_quotes: string[] }

export type DeepAnalysisData = {
  segment_analysis: SegmentItem[]
  segment_analysis_note: string | null
  sentiment_mapping: {
    positive: SentimentItem[]
    negative: SentimentItem[]
  }
  decision_barriers: BarrierItem[]
}

export default function DeepAnalysisView({ data }: { data: DeepAnalysisData }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 세그먼트별 반응 차이 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-black mb-4">세그먼트별 반응 차이</h3>
        {data.segment_analysis.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {data.segment_analysis.map((s, i) => (
              <div key={i} className="rounded-2xl bg-[#F5F5F5] px-4 py-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-[#1565C0] bg-[#1565C0]/10 px-2 py-0.5 rounded w-fit">
                  {s.segment}
                </span>
                <p className="text-[11px] font-bold text-[#1D1C1C]">{s.summary}</p>
                {s.notable_diff && (
                  <p className="text-[10px] font-bold text-[#999]">특이점: {s.notable_diff}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3">
            {data.segment_analysis_note ?? '세그먼트별로 비교할 응답이 아직 충분하지 않아요.'}
          </p>
        )}
      </div>

      {/* 감성 키워드 매핑 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-black mb-4">감성 키워드 매핑</h3>
        <div className="flex flex-col gap-4">
          <SentimentGroup label="긍정" items={data.sentiment_mapping.positive} color="green" />
          <SentimentGroup label="부정" items={data.sentiment_mapping.negative} color="red" />
        </div>
      </div>

      {/* 의사결정 장벽 클러스터링 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-black mb-4">의사결정 장벽 클러스터링</h3>
        {data.decision_barriers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.decision_barriers.map((b, i) => (
              <div key={i} className="rounded-2xl border border-[#1D1C1C]/8 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#1D1C1C]">{b.theme}</span>
                  <span className="text-[9px] font-bold text-[#999]">{b.count}건 언급</span>
                </div>
                {b.example_quotes?.map((q, qi) => (
                  <p key={qi} className="text-[10px] font-bold text-[#666] pl-3 border-l-2 border-[#1D1C1C]/10">
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-bold text-[#999] bg-[#F5F5F5] rounded-xl px-4 py-3">
            뚜렷한 장벽 패턴을 찾을 만큼 부정적 응답/이유 서술이 충분하지 않아요.
          </p>
        )}
      </div>
    </div>
  )
}

function SentimentGroup({ label, items, color }: { label: string; items: SentimentItem[]; color: 'green' | 'red' }) {
  const styles = color === 'green'
    ? { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
    : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }

  return (
    <div className="flex flex-col gap-2">
      <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded ${styles.bg} ${styles.text}`}>{label}</span>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              title={item.example_quote}
              className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${styles.bg} ${styles.border}`}
            >
              <span className={`text-[11px] font-black ${styles.text}`}>{item.keyword}</span>
              <span className="text-[9px] font-bold text-[#999]">{item.count}회</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] font-bold text-[#BBB]">해당 없음</p>
      )}
    </div>
  )
}
