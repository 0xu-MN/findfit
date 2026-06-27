'use client'

import { useState } from 'react'
import { ExternalLink, TrendingUp, Minus, TrendingDown, CheckCircle2 } from 'lucide-react'
import type {
  LightReference,
  ReferenceData,
  TrendKeyword,
  ToastOption,
  MarketData,
  AgentMessage as AgentMessageType,
} from './agentMock'

/* ─────────────────────────────────────────────────────── */
/*  토스트 선택지 UI                                        */
/* ─────────────────────────────────────────────────────── */

export function ToastOptions({
  options,
  type,
  onSelect,
  disabled,
}: {
  options: ToastOption[]
  type: 'single' | 'multi'
  onSelect: (value: string | string[]) => void
  disabled?: boolean
}) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (value: string) => {
    if (disabled) return
    if (type === 'single') {
      onSelect(value)
    } else {
      setSelected(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      )
    }
  }

  return (
    <div className="mt-2 mb-1 flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = selected.includes(opt.value)
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                disabled
                  ? 'opacity-40 cursor-not-allowed border-[#1D1C1C]/8 text-[#999]'
                  : isSelected
                  ? 'bg-[#F77019] text-white border-[#F77019] shadow-sm'
                  : 'bg-white text-[#333] border-[#1D1C1C]/10 hover:border-[#F77019]/40 hover:text-[#F77019] hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              {opt.emoji && <span className="text-[13px]">{opt.emoji}</span>}
              {opt.label}
            </button>
          )
        })}
      </div>
      {type === 'multi' && selected.length > 0 && !disabled && (
        <button
          onClick={() => onSelect(selected)}
          className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:bg-[#333] transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          선택 완료 ({selected.length}개)
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  시장 데이터 카드                                        */
/* ─────────────────────────────────────────────────────── */

export function MarketDataCard({ data }: { data: MarketData }) {
  return (
    <div className="rounded-2xl border border-[#F77019]/15 bg-gradient-to-br from-[#FFF8F4] to-white p-4 flex flex-col gap-3 mt-2 mb-1">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-[#F77019]" />
        <span className="text-[11px] font-black text-[#1D1C1C]">실시간 시장 데이터</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.naverTrend && (
          <div className="rounded-xl bg-white border border-[#1D1C1C]/6 p-2.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-[#999]">네이버 검색 트렌드</span>
            <span className={`text-[15px] font-black ${data.naverTrend.changePct >= 0 ? 'text-[#1CAE66]' : 'text-[#E53935]'}`}>
              {data.naverTrend.changePct >= 0 ? '+' : ''}{data.naverTrend.changePct}%
            </span>
            <span className="text-[9px] font-medium text-[#BBB]">{data.naverTrend.period}</span>
          </div>
        )}

        {data.metaAdsCount !== undefined && (
          <div className="rounded-xl bg-white border border-[#1D1C1C]/6 p-2.5 flex flex-col gap-1">
            <span className="text-[9px] font-bold text-[#999]">메타 광고 업체</span>
            <span className="text-[15px] font-black text-[#1D1C1C]">{data.metaAdsCount}개</span>
            <span className="text-[9px] font-medium text-[#BBB]">현재 집행 중</span>
          </div>
        )}
      </div>

      {data.nicheGap && (
        <div className="rounded-xl bg-white border border-[#1D1C1C]/6 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#666]">시장 경쟁 수준</span>
          <span className="text-[11px] font-black text-[#1D1C1C]">{data.nicheGap}</span>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  레퍼런스 카드                                           */
/* ─────────────────────────────────────────────────────── */

export function AgentReferenceCard({ data }: { data: ReferenceData }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/8 bg-white p-4 flex flex-col gap-2.5 hover:border-[#F77019]/30 hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-black text-[#1D1C1C] group-hover:text-[#F77019] transition-colors">
          {data.name}
        </span>
        {data.url && (
          <ExternalLink className="w-3 h-3 text-[#CCC] group-hover:text-[#F77019] transition-colors" />
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-[#F77019] bg-[#F77019]/8 px-2 py-0.5 rounded-full">
          {data.target}
        </span>
        <span className="text-[10px] font-bold text-[#666]">{data.price}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] flex-shrink-0 mt-px">👍</span>
          <span className="text-[10px] font-medium text-[#333] leading-relaxed">{data.pros}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] flex-shrink-0 mt-px">👎</span>
          <span className="text-[10px] font-medium text-[#333] leading-relaxed">{data.cons}</span>
        </div>
      </div>
    </div>
  )
}

export function AgentReferenceCards({ references }: { references: ReferenceData[] }) {
  return (
    <div className="flex flex-col gap-2 mt-2 mb-1">
      {references.map((ref, i) => (
        <AgentReferenceCard key={i} data={ref} />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  라이트 레퍼런스 (Phase 4: 이름 + 한 줄 요약만)          */
/* ─────────────────────────────────────────────────────── */

export function AgentLightReferenceList({ refs }: { refs: LightReference[] }) {
  return (
    <div className="flex flex-col gap-1.5 mt-2 mb-1">
      {refs.map((ref, i) => (
        <div
          key={i}
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#1D1C1C]/8"
        >
          <span className="text-[9px] font-black text-[#999] mt-0.5 flex-shrink-0">{i + 1}</span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] font-black text-[#1D1C1C] truncate">{ref.name}</span>
            <span className="text-[10px] font-medium text-[#666] leading-relaxed">{ref.summary}</span>
          </div>
        </div>
      ))}
      <p className="text-[9px] font-bold text-[#999] px-1 mt-0.5">
        💡 가격·강점·약점 심층 분석은 검증 리포트에서 확인하세요
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  트렌드 키워드 블록                                      */
/* ─────────────────────────────────────────────────────── */

const trendIcon = {
  rising: <TrendingUp className="w-3 h-3 text-[#1CAE66]" />,
  stable: <Minus className="w-3 h-3 text-[#F59E0B]" />,
  declining: <TrendingDown className="w-3 h-3 text-[#E53935]" />,
}

const trendLabel = { rising: '급상승', stable: '유지', declining: '하락' }

const volumeBar = { high: 'w-full', medium: 'w-2/3', low: 'w-1/3' }

export function AgentTrendBlock({ trends }: { trends: TrendKeyword[] }) {
  return (
    <div className="rounded-2xl border border-[#1D1C1C]/8 bg-white p-4 flex flex-col gap-2 mt-2 mb-1">
      <div className="flex items-center gap-1.5 mb-1">
        <TrendingUp className="w-3.5 h-3.5 text-[#F77019]" />
        <span className="text-[11px] font-black text-[#1D1C1C]">최근 트렌드 키워드</span>
      </div>
      {trends.map((t, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <span className="text-[11px] font-bold text-[#1D1C1C] min-w-0 flex-1 truncate">
            {t.keyword}
          </span>
          <div className="w-16 h-1.5 rounded-full bg-[#F5F5F5] flex-shrink-0 overflow-hidden">
            <div className={`h-full rounded-full bg-[#F77019] ${volumeBar[t.volume]}`} style={{ transition: 'width 0.6s ease' }} />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {trendIcon[t.trend]}
            <span className="text-[9px] font-bold text-[#999]">{trendLabel[t.trend]}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  CTA 버튼                                              */
/* ─────────────────────────────────────────────────────── */

export function AgentCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[13px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
      style={{
        background: 'linear-gradient(135deg, #F77019, #FF8F45)',
        boxShadow: '0 6px 20px rgba(247,112,25,0.3)',
      }}
    >
      🚀 지금 등록하고 실제 리뷰어에게 검증받기
    </button>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  타이핑 인디케이터                                       */
/* ─────────────────────────────────────────────────────── */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#F77019]"
            style={{ animation: `typing-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-[#999]">분석 중...</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/*  메시지 버블                                            */
/* ─────────────────────────────────────────────────────── */

export function AgentMessageBubble({
  message,
  onCTAClick,
  onToastSelect,
  isLatest,
}: {
  message: AgentMessageType
  onCTAClick?: () => void
  onToastSelect?: (value: string | string[]) => void
  isLatest?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-up`}>
      <div className={`max-w-[90%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 메시지 본문 */}
        <div
          className={`px-4 py-3 text-[12px] font-medium leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[#F77019] text-white rounded-2xl rounded-br-md'
              : 'bg-white border border-[#1D1C1C]/8 text-[#1D1C1C] rounded-2xl rounded-bl-md'
          }`}
        >
          {message.content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i} className="font-black">{part.slice(2, -2)}</strong>
              : <span key={i}>{part}</span>
          )}
        </div>

        {/* 시장 데이터 카드 */}
        {message.marketData && <MarketDataCard data={message.marketData} />}

        {/* 트렌드 블록 */}
        {message.trends && <AgentTrendBlock trends={message.trends} />}

        {/* 라이트 레퍼런스 (Phase 4: 이름+요약만) */}
        {message.lightReferences && <AgentLightReferenceList refs={message.lightReferences} />}

        {/* 풀 레퍼런스 카드 — 채팅에서는 사용 안 함 (사이드바 전용) */}
        {!message.lightReferences && message.references && <AgentReferenceCards references={message.references} />}

        {/* 토스트 선택지 - 최신 메시지만 활성화 */}
        {message.toastOptions && onToastSelect && (
          <ToastOptions
            options={message.toastOptions}
            type={message.toastType ?? 'single'}
            onSelect={onToastSelect}
            disabled={!isLatest}
          />
        )}

        {/* CTA 버튼 */}
        {message.showCTA && onCTAClick && <AgentCTA onClick={onCTAClick} />}

        {/* 시간 */}
        <span className="text-[9px] font-medium text-[#CCC] px-1">
          {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
