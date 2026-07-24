import { createAdminClient } from '@/lib/supabase/admin'

// 자동추천(질문/관심사) 무한 재요청 방지 — key는 호출부가 자유롭게 구성한다
// (예: 프로젝트 단위 총 횟수는 `question_suggest:project:${projectId}`,
// project_id가 아직 없는 초안 단계는 `question_suggest:draft:${userId}:${date}`
// 처럼 유저+날짜 단위로). 반환값이 false면 캡 초과 — 호출부에서 AI 호출 없이
// 바로 막아야 한다.
export async function checkAndIncrementSuggestionCap(key: string, limit: number): Promise<boolean> {
  const admin = createAdminClient()
  const { data: log } = await admin
    .from('ai_suggestion_logs')
    .select('count')
    .eq('key', key)
    .maybeSingle()

  if (log && log.count >= limit) return false

  await admin
    .from('ai_suggestion_logs')
    .upsert({ key, count: (log?.count ?? 0) + 1, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  return true
}
