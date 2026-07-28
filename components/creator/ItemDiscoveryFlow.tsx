'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Search, ArrowRight, X } from 'lucide-react'
import { useAgentBubble } from '../agent/AgentBubbleContext'
import type { RecommendedItem } from '@/app/api/agent/recommend-items/route'
import { CATEGORIES, AGE_GROUPS } from '../builder/new-request/types'

type Stage = 'searching' | 'questions' | 'loading' | 'results'

interface Props {
  keyword: string
  onClose: () => void
}

const SEARCH_MESSAGES = ['유사 아이템을 찾고 있어요', '몇 가지 더 확인해볼게요']

// 등록 마법사(types.ts CATEGORIES/AGE_GROUPS)와 동일한 목록을 재사용한다 —
// 예전엔 여기서 별도로 4개짜리 카테고리/연령대를 하드코딩해서 등록 단계와
// 완전히 다른 분류체계로 사용자를 헷갈리게 했다. 연령대는 여러 개를 동시에
// 타겟할 수 있어서 복수선택(multi), 성별은 신규 추가.
const GENDER_OPTIONS = ['여성', '남성', '전 성별']

const QUESTIONS: { key: string; label: string; options: string[]; multi?: boolean }[] = [
  { key: '타겟 연령대', label: '주로 어떤 연령대를 타겟하시나요? (복수 선택 가능)', options: AGE_GROUPS, multi: true },
  { key: '타겟 성별', label: '주로 어떤 성별을 타겟하시나요?', options: GENDER_OPTIONS },
  { key: '카테고리', label: '어떤 카테고리에 가까운가요?', options: CATEGORIES },
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
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  // 몇 번째 질문인지 별도 인덱스로 관리한다 — "answers에 키가 있으면 다음
  // 질문"으로 판단하면, 복수선택 질문은 첫 항목을 고르자마자 키가 생겨서
  // "다음" 버튼 없이 바로 넘어가버리는 버그가 있었다.
  const [questionStep, setQuestionStep] = useState(0)
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

  // 단일 선택 질문(성별/카테고리)은 클릭하면 바로 다음으로 넘어가고,
  // 복수 선택 질문(연령대)은 토글만 하고 "다음" 버튼을 눌러야 넘어간다.
  const toggleOption = (qKey: string, option: string, multi?: boolean) => {
    setAnswers((prev) => {
      const current = prev[qKey] ?? []
      if (!multi) return { ...prev, [qKey]: [option] }
      const already = current.includes(option)
      return { ...prev, [qKey]: already ? current.filter((o) => o !== option) : [...current, option] }
    })
  }

  const goNext = (finishedAnswers: Record<string, string[]>) => {
    if (questionStep + 1 >= QUESTIONS.length) {
      void fetchRecommendations(finishedAnswers)
    } else {
      setQuestionStep((s) => s + 1)
    }
  }

  const answerSingle = (qKey: string, option: string) => {
    const next = { ...answers, [qKey]: [option] }
    setAnswers(next)
    goNext(next)
  }

  const fetchRecommendations = async (finalAnswers: Record<string, string[]>) => {
    setStage('loading')
    try {
      const flatAnswers = Object.fromEntries(
        Object.entries(finalAnswers).map(([k, v]) => [k, v.join(', ')])
      )
      const res = await fetch('/api/agent/recommend-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, answers: flatAnswers }),
      })
      const body = await res.json()
      setItems(body.items ?? [])
    } catch {
      setItems([])
    } finally {
      setStage('results')
    }
  }

  const currentQuestion = QUESTIONS[questionStep]
  const currentSelection = currentQuestion ? answers[currentQuestion.key] ?? [] : []

  const exploreItem = (item: RecommendedItem) => {
    // 이 퀴즈에서 이미 연령대/성별을 답했으므로, Agent 대화에 그대로 넘겨서
    // "타겟이 누구예요?"를 다시 묻지 않게 한다.
    const ageAnswer = answers['타겟 연령대']?.join(', ')
    const genderAnswer = answers['타겟 성별']?.[0]
    const targetCustomer = [ageAnswer, genderAnswer].filter(Boolean).join(' ') || undefined

    agentBubble.openWithSeed(
      `"${item.title}" 아이템을 검증해보고 싶어요. ${item.description}`,
      targetCustomer
    )
    // skipIntro — 홈 화면에서 이미 "아이템 탐색부터 시작"을 고르고 여기까지
    // 왔으므로, 마법사 진입 시 Step0Modal("어떻게 검증을 시작할까요?")을
    // 또 띄우면 이미 끝난 선택을 다시 물어보는 꼴이 된다.
    router.push('/builder/new-request?skipIntro=1')
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
                {currentQuestion.options.map((opt) => {
                  const selected = currentSelection.includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        currentQuestion.multi
                          ? toggleOption(currentQuestion.key, opt, true)
                          : answerSingle(currentQuestion.key, opt)
                      }
                      className={`px-5 py-3.5 rounded-2xl border text-[13px] font-bold transition-all ${
                        selected
                          ? 'border-[#F77019] text-[#F77019] bg-[#F77019]/5'
                          : 'border-[#1D1C1C]/10 bg-white text-[#1D1C1C] hover:border-[#F77019] hover:text-[#F77019] hover:bg-[#F77019]/5'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {currentQuestion.multi && (
                <button
                  onClick={() => goNext(answers)}
                  disabled={currentSelection.length === 0}
                  className="px-6 py-2.5 rounded-full bg-[#1D1C1C] text-white text-[12px] font-black disabled:opacity-30 hover:opacity-90 transition-opacity"
                >
                  다음
                </button>
              )}
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
