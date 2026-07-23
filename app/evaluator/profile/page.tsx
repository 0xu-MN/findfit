'use client'

// H-4: 매칭 점수 계산(app/api/projects/feed/route.ts의 computeMatchScore)이
// reviewer_profiles.domain_tags를 실제로 쓰는데, 이걸 리뷰어가 설정할 화면이
// 없어서 전원 매칭 점수가 낮게 고정돼 있었다. level은 관리자가 부여하는
// 값이라 여기서는 읽기 전용으로만 보여준다.
import ReviewerLayout from '@/components/reviewer/ReviewerLayout'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/components/builder/new-request/types'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const LEVEL_LABELS: Record<string, string> = {
  general: '일반',
  expert: '전문가',
  domain: '도메인 전문가',
}

function ProfileContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [level, setLevel] = useState<string>('general')
  const [domainTags, setDomainTags] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('reviewer_profiles')
        .select('domain_tags, level')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setDomainTags(data.domain_tags ?? [])
        setLevel(data.level ?? 'general')
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleTag = (tag: string) => {
    setSaved(false)
    setDomainTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase
      .from('reviewer_profiles')
      .update({ domain_tags: domainTags })
      .eq('user_id', user.id)

    setSaving(false)
    setSaved(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-[#999] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-black">평가단 프로필</h1>

      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <p className="text-[11px] font-black text-[#999] uppercase tracking-wider">등급</p>
        <p className="text-sm font-black text-[#1D1C1C]">{LEVEL_LABELS[level] ?? level}</p>
        <p className="text-[10px] font-bold text-[#999]">등급은 활동 내역에 따라 관리자가 부여해요</p>
      </div>

      <div className="rounded-3xl border border-[#1D1C1C]/10 bg-white p-6 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          <p className="text-[11px] font-black text-[#999] uppercase tracking-wider">관심 분야</p>
          <p className="text-[10px] font-bold text-[#999] mt-1">
            선택한 분야와 겹치는 의뢰가 피드에서 더 먼저 추천돼요
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((tag) => {
            const active = domainTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black border transition-colors ${
                  active
                    ? 'border-[#1565C0] bg-[#1565C0]/10 text-[#1565C0]'
                    : 'border-[#1D1C1C]/10 text-[#999] hover:border-[#1D1C1C]/20'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 h-10 rounded-xl bg-[#1565C0] text-white text-[12px] font-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 self-start px-6"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved && !saving && <CheckCircle2 className="w-4 h-4" />}
          저장
        </button>
      </div>
    </div>
  )
}

export default function EvaluatorProfilePage() {
  return (
    <ReviewerLayout>
      <ProfileContent />
    </ReviewerLayout>
  )
}
