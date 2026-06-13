'use client'

import { Camera, Upload } from 'lucide-react'
import QuestionBuilder from './QuestionBuilder'
import {
  DEEP_RECOMMENDED_FEE,
  EXPERIENCE_DEADLINES,
  EXPERIENCE_TIMES,
  SEAN_ELLIS_QUESTION,
  STD_DEEP_MAX_WRITABLE,
  type RequestFormData,
} from './types'

type Props = {
  data: RequestFormData
  onChange: (patch: Partial<RequestFormData>) => void
}

export default function Step4Deep({ data, onChange }: Props) {
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
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black">체험 후 질문</h3>
          <p className="text-[10px] text-[#999] font-bold">
            평가단이 체험을 마치고 답변할 질문. Sean Ellis Test 자동 포함하여 작성 가능 최대 {STD_DEEP_MAX_WRITABLE}개
          </p>
        </div>

        <QuestionBuilder
          questions={data.postQuestions}
          onChange={(qs) => onChange({ postQuestions: qs })}
          max={STD_DEEP_MAX_WRITABLE}
          allowedTypes={['multiple_choice', 'short_answer', 'likert']}
          showFixed={SEAN_ELLIS_QUESTION}
        />
      </div>
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
