'use client'

import { getPsfPmfType } from '@/lib/utils/psfPmf'
import { Camera, Loader2, Sparkles, Upload } from 'lucide-react'
import { useState } from 'react'
import PsfLockedBlock from './PsfLockedBlock'
import QuestionBuilder from './QuestionBuilder'
import { generateId } from './storage'
import {
  DEEP_RECOMMENDED_FEE,
  EXPERIENCE_DEADLINES,
  EXPERIENCE_TIMES,
  PSF_MAX_WRITABLE,
  SEAN_ELLIS_QUESTION,
  STD_DEEP_MAX_WRITABLE,
  type Question,
  type RequestFormData,
} from './types'

type QuestionSuggestion = {
  question_text: string
  question_type: 'multiple_choice' | 'short_answer' | 'likert_5'
  options: string[] | null
}

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step4Deep({ data, onChange }: Props) {
  const psfPmfType = data.stage ? getPsfPmfType(data.stage) : 'psf'
  const isPsf = psfPmfType === 'psf'
  const maxWritable = isPsf ? PSF_MAX_WRITABLE : STD_DEEP_MAX_WRITABLE
  const remaining = maxWritable - data.postQuestions.filter((q) => !q.isFixed).length

  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([])
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchSuggestions = async () => {
    setLoadingSuggest(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/questions/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            title: data.productName,
            one_liner: data.oneLineDesc,
            category: data.categories[0] ?? '',
            stage: data.stage ?? '',
            problem: data.problem,
            solution: data.ourDifference,
            target_jobs: data.jobRoles,
            target_age_range: data.ageGroups.join(', '),
            project_type: data.projectType,
          },
          psf_pmf_type: psfPmfType,
          existing_count: data.postQuestions.filter((q) => !q.isFixed).length,
          remaining_slots: remaining,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setSuggestions(json.suggestions ?? [])
      }
    } finally {
      setLoadingSuggest(false)
    }
  }

  const addSuggestion = (s: QuestionSuggestion) => {
    if (remaining <= 0) { showToast('질문을 더 추가할 수 없어요 (최대 초과)'); return }
    const q: Question = {
      id: generateId('ai'),
      type: s.question_type === 'likert_5' ? 'likert' : s.question_type,
      text: s.question_text,
      options: s.options ?? undefined,
    }
    onChange({ postQuestions: [...data.postQuestions.filter((x) => !x.isFixed), q] })
    setSuggestions((prev) => prev.filter((x) => x.question_text !== s.question_text))
  }

  const addAll = () => {
    const slots = remaining
    if (slots <= 0) { showToast('질문을 더 추가할 수 없어요 (최대 초과)'); return }
    const toAdd = suggestions.slice(0, slots)
    const skipped = suggestions.length - toAdd.length
    const newQs: Question[] = toAdd.map((s) => ({
      id: generateId('ai'),
      type: s.question_type === 'likert_5' ? 'likert' : s.question_type,
      text: s.question_text,
      options: s.options ?? undefined,
    }))
    onChange({ postQuestions: [...data.postQuestions.filter((x) => !x.isFixed), ...newQs] })
    setSuggestions([])
    if (skipped > 0) showToast(`최대 개수를 초과해서 ${toAdd.length}개만 추가했어요`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 공통 영역 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black">검증 내용</h2>
          <span className="text-[9px] font-black bg-[#F77019]/10 text-[#F77019] px-2 py-0.5 rounded">Deep</span>
        </div>

        <Textarea
          label="이번 검증으로 알고 싶은 것"
          hint={`${data.validationGoal.length}/100`}
          max={100}
          rows={2}
          value={data.validationGoal}
          placeholder="어떤 의사결정을 위해 검증하나요? 예: 출시 여부 결정 / 기능 우선순위"
          onChange={(v) => onChange({ validationGoal: v })}
        />

        <Textarea
          label="검증 가설"
          hint="템플릿 권장"
          max={300}
          rows={3}
          value={data.hypothesis}
          placeholder="우리는 [타겟]이 [솔루션] 때문에 [결과]를 원한다고 가정한다"
          onChange={(v) => onChange({ hypothesis: v })}
        />
      </div>

      {/* 체험 설계 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black">체험 설계</h3>
          <p className="text-[10px] text-[#999] font-bold">평가단이 제품을 직접 사용한 후 답변할 구조를 설계하세요</p>
        </div>

        {/* 체험 링크 */}
        <Field label="체험 링크" hint="필수">
          <input
            type="url"
            value={data.experienceUrl}
            onChange={(e) => onChange({ experienceUrl: e.target.value })}
            placeholder="앱스토어 / TestFlight / Google Play / 웹 URL"
            className="w-full h-10 rounded-xl bg-[#F5F5F5] border-none outline-none px-4 text-[11px]"
          />
        </Field>

        {/* 파일 첨부 */}
        <Field label="체험 파일 첨부 (선택)" hint="APK, zip 최대 100MB">
          <label className="flex items-center gap-3 h-12 rounded-xl border border-dashed border-[#1D1C1C]/15 bg-[#FAFAFA] px-4 cursor-pointer hover:border-[#F77019] hover:bg-[#F77019]/5 transition-colors">
            <Upload className="w-4 h-4 text-[#999]" />
            <span className="text-[11px] font-bold text-[#666] flex-1">
              {data.experienceFileName || '파일 선택...'}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => onChange({ experienceFileName: e.target.files?.[0]?.name ?? '' })}
            />
          </label>
        </Field>

        {/* 체험 가이드 */}
        <Textarea
          label="체험 가이드"
          hint={`${data.experienceGuide.length}/300 · 필수`}
          max={300}
          rows={4}
          value={data.experienceGuide}
          placeholder='핵심 사용 경로 안내 — 예: "1. 앱 설치 후 회원가입 → 2. 추천 탭 둘러보기 → 3. 상품 1개 장바구니까지"'
          onChange={(v) => onChange({ experienceGuide: v })}
        />

        {/* 예상 체험 시간 */}
        <Field label="예상 체험 시간" hint="권장 사례금 자동 제안">
          <div className="flex items-center gap-2">
            {EXPERIENCE_TIMES.map((t) => {
              const active = data.experienceTime === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    onChange({ experienceTime: t, feePerEvaluator: DEEP_RECOMMENDED_FEE[t] ?? data.feePerEvaluator })
                  }
                  className={`flex-1 h-10 rounded-xl text-[11px] font-black transition-colors ${
                    active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                  }`}
                >
                  {t < 60 ? `${t}분` : '1시간+'}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-[#999] font-bold mt-1">
            권장 사례금: {DEEP_RECOMMENDED_FEE[data.experienceTime]?.toLocaleString('ko-KR')}원~ (Step 6에서 조정)
          </p>
        </Field>

        {/* 체험 완료 기한 */}
        <Field label="체험 완료 기한" hint="기한 경과 시 미션 자동 취소 + 사전 승인 잠금 해제">
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE_DEADLINES.map((h) => {
              const active = data.experienceDeadline === h
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange({ experienceDeadline: h })}
                  className={`h-10 rounded-xl text-[11px] font-black transition-colors ${
                    active ? 'bg-[#F77019] text-white' : 'bg-[#F5F5F5] text-[#666] hover:text-[#1D1C1C]'
                  }`}
                >
                  {h}시간
                </button>
              )
            })}
          </div>
        </Field>

        {/* 스크린샷 첨부 요청 */}
        <Field label="스크린샷 첨부 요청">
          <button
            type="button"
            onClick={() => onChange({ screenshotRequired: !data.screenshotRequired })}
            className={`flex items-center gap-3 h-12 px-4 rounded-xl border transition-colors ${
              data.screenshotRequired
                ? 'bg-[#F77019]/10 border-[#F77019] text-[#F77019]'
                : 'bg-[#F5F5F5] border-transparent text-[#666] hover:border-[#1D1C1C]/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-[11px] font-bold flex-1 text-left">
              평가단에게 체험 화면 캡처 1장 이상 첨부 요청
            </span>
            <span className={`w-9 h-5 rounded-full flex items-center transition-colors ${data.screenshotRequired ? 'bg-[#F77019]' : 'bg-[#CCC]'}`}>
              <span
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${data.screenshotRequired ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </span>
          </button>
        </Field>
      </div>

      {/* 체험 후 질문 */}
      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black">체험 후 질문</h3>
            <p className="text-[10px] text-[#999] font-bold">
              평가단이 체험을 마치고 답변할 질문. 핵심 질문 자동 포함 · 작성 가능 최대 {maxWritable}개
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSuggestions}
            disabled={loadingSuggest || remaining <= 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#F77019] text-[#F77019] text-[11px] font-black hover:bg-[#F77019]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingSuggest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI 추천 질문 받기
          </button>
        </div>

        {/* AI 추천 카드 */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#F77019]/20 bg-[#F77019]/3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#F77019]">✨ AI 추천 질문 ({suggestions.length}개)</span>
              <button
                type="button"
                onClick={addAll}
                className="h-7 px-3 rounded-lg bg-[#F77019] text-white text-[10px] font-black hover:opacity-90"
              >
                추천 전체 추가
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white border border-[#1D1C1C]/8 p-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[#F77019] bg-[#F77019]/10 px-1.5 py-0.5 rounded w-fit">
                      {s.question_type === 'multiple_choice' ? '객관식' : s.question_type === 'short_answer' ? '주관식' : '리커트 5점'}
                    </span>
                    <p className="text-[11px] font-bold text-[#1D1C1C]">{s.question_text}</p>
                    {s.options && (
                      <p className="text-[10px] text-[#999] font-bold">{s.options.slice(0, 2).join(' / ')}{s.options.length > 2 ? ' ...' : ''}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="h-7 px-3 rounded-lg border border-[#F77019] text-[#F77019] text-[10px] font-black hover:bg-[#F77019]/5 shrink-0"
                  >
                    + 추가하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <QuestionBuilder
          questions={data.postQuestions}
          onChange={(qs) => onChange({ postQuestions: qs })}
          max={maxWritable}
          allowedTypes={['multiple_choice', 'short_answer', 'likert']}
          showFixed={isPsf ? undefined : SEAN_ELLIS_QUESTION}
        />
        {isPsf && <PsfLockedBlock />}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#1D1C1C] text-white text-[11px] font-bold shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        {hint && <span className="text-[9px] text-[#999] font-bold">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Textarea({
  label,
  hint,
  max,
  rows,
  value,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  max: number
  rows: number
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold">{label}</label>
        <span className="text-[9px] text-[#999] font-bold">{hint}</span>
      </div>
      <textarea
        rows={rows}
        maxLength={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[#F5F5F5] border-none outline-none px-4 py-3 text-[11px] resize-none leading-relaxed"
      />
    </div>
  )
}
