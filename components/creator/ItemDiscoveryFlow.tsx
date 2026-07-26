'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Search, ArrowRight, X } from 'lucide-react'
import { useAgentBubble } from '../agent/AgentBubbleContext'
import type { RecommendedItem } from '@/app/api/agent/recommend-items/route'

type Stage = 'searching' | 'questions' | 'loading' | 'results'

interface Props {
  keyword: string
  onClose: () => void
}

const SEARCH_MESSAGES = ['유사 아이템을 찾고 있어요', '몇 가지 더 확인해볼게요']

const QUESTIONS: { key: string; label: string; options: string[] }[] = [
  { key: '타겟 연령대', label: '주로 어떤 연령대를 타겟하시나요?', options: ['10~20대', '30~40대', '50대 이상', '전 연령'] },
  { key: '카테고리', label: '어떤 카테고리에 가까운가요?', options: ['식품/건강', '뷰티/라이프', '테크/앱', '기타'] },
]

// 홈 검색 → "검증 시작" 클릭 시 뜨는 AI 추천 흐름 — ①화려한 탐색 모션
// ②세부 질문 2개 ③네이버 트렌드 연동 추천 아이템 3장. 각 카드의 "자세하게
// 조사해볼까요?" 버튼은 기존 seed 메커니즘(agentBubble.openWithSeed)을
// 그대로 재사용해서 마법사로 넘어가도 대화가 안 끊긴다.
export default function ItemDiscoveryFlow({ keyword, onClose }: Props) {
  const router = useRouter()
  const agentBubble = useAgentBubble()
  const [stage, setStage] = useState<Stage>('searching')
  const [msgIndex, setMsgIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [items, setItems] = useState<RecommendedItem[]>([])

  useEffect(() => {
    if (stage !== 'searching') return
    if (msgIndex >= SEARCH_MESSAGES.length - 1) {
      const t = setTimeout(() => setStage('questions'), 1200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setMsgIndex((i) => i + 1), 1300)
    return () => clearTimeout(t)
  }, [stage, msgIndex])

  const answerQuestion = (qKey: string, option: string) => {
    const next = { ...answers, [qKey]: option }
    setAnswers(next)
    const qIndex = QUESTIONS.findIndex((q) => q.key === qKey)
    if (qIndex === QUESTIONS.length - 1) {
      void fetchRecommendations(next)
    }
  }

  const fetchRecommendations = async (finalAnswers: Record<string, string>) => {
    setStage('loading')
    try {
      const res = await fetch('/api/agent/recommend-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, answers: finalAnswers }),
      })
      const body = await res.json()
      setItems(body.items ?? [])
    } catch {
      setItems([])
    } finally {
      setStage('results')
    }
  }

  const currentQuestion = QUESTIONS.find((q) => !(q.key in answers))

  const exploreItem = (item: RecommendedItem) => {
    agentBubble.openWithSeed(`"${item.title}" 아이템을 검증해보고 싶어요. ${item.description}`)
    router.push('/builder/new-request')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="w-full max-w-[760px] rounded-[32px] border border-[#F77019]/15 bg-white/95 p-8 md:p-10 flex flex-col items-center shadow-[0_32px_80px_rgba(247,112,25,0.08)] relative overflow-hidden min-h-[420px]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#666] hover:text-[#1D1C1C] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {(stage === 'searching' || stage === 'loading') && (
            <motion.div
              key="motion-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-8 flex-1 py-16"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg,#F77019,#FF8F45)', boxShadow: '0 12px 32px rgba(247,112,25,0.3)' }}
              >
                {stage === 'loading' ? <Search className="w-9 h-9" /> : <Sparkles className="w-9 h-9" />}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={stage === 'loading' ? 'loading-msg' : SEARCH_MESSAGES[msgIndex]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-lg font-black text-[#1D1C1C] text-center"
                >
                  {stage === 'loading' ? '네이버 트렌드를 확인하며 아이템을 추천하고 있어요' : SEARCH_MESSAGES[msgIndex]}
                </motion.p>
              </AnimatePresence>
              <span className="text-[11px] font-bold text-[#999]">&ldquo;{keyword}&rdquo; 관련 정보를 분석 중</span>
            </motion.div>
          )}

          {stage === 'questions' && currentQuestion && (
            <motion.div
              key={currentQuestion.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-8 flex-1 justify-center py-10 w-full"
            >
              <h3 className="text-xl font-black text-[#1D1C1C] text-center">{currentQuestion.label}</h3>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[480px]">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answerQuestion(currentQuestion.key, opt)}
                    className="px-5 py-3.5 rounded-2xl border border-[#1D1C1C]/10 bg-white text-[13px] font-bold text-[#1D1C1C] hover:border-[#F77019] hover:text-[#F77019] hover:bg-[#F77019]/5 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {stage === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 w-full"
            >
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[11px] font-black text-[#F77019] bg-[#F77019]/10 px-3 py-1 rounded-full">AI 추천</span>
                <h3 className="text-xl font-black text-[#1D1C1C]">요즘 이런 아이템이 핫해요</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-[20px] border border-[#1D1C1C]/8 bg-white p-5 hover:border-[#F77019]/30 hover:shadow-md transition-all"
                  >
                    <h4 className="text-[14px] font-black text-[#1D1C1C] leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-[#666] font-medium leading-relaxed flex-1">{item.description}</p>
                    <p className="text-[10px] text-[#F77019] font-bold">{item.reason}</p>
                    <button
                      onClick={() => exploreItem(item)}
                      className="mt-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-black hover:bg-[#F77019] transition-colors"
                    >
                      자세하게 조사해볼까요? <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
