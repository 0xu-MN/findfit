import { migrateDraft, type RequestFormData } from './types'

// localStorage 기반 임시 저장소.
// 추후 Supabase 연동 시: 이 파일의 함수 시그니처를 유지한 채 내부 구현만 fetch / supabase-js 호출로 교체.
//   - listDrafts → select * from request_drafts where builder_id = auth.uid()
//   - saveDraft → upsert into request_drafts
//   - submitRequest → insert into requests (status=submitted) + delete draft
// 시그니처가 동일하므로 호출부 수정 없이 마이그레이션 가능.

const DRAFTS_KEY = 'findfit:request-drafts'
const SUBMITTED_KEY = 'findfit:submitted-requests'

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readAll(key: string): RequestFormData[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 이전 버전 draft를 안전하게 마이그레이션
    return parsed.map((d) => migrateDraft(d))
  } catch {
    return []
  }
}

function writeAll(key: string, list: RequestFormData[]): void {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(list))
}

export function listDrafts(): RequestFormData[] {
  return readAll(DRAFTS_KEY).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export function getDraft(id: string): RequestFormData | null {
  return readAll(DRAFTS_KEY).find((d) => d.id === id) ?? null
}

export function saveDraft(data: RequestFormData): RequestFormData {
  const next: RequestFormData = { ...data, status: 'draft', updatedAt: new Date().toISOString() }
  const all = readAll(DRAFTS_KEY)
  const idx = all.findIndex((d) => d.id === next.id)
  if (idx >= 0) all[idx] = next
  else all.unshift(next)
  writeAll(DRAFTS_KEY, all)
  return next
}

export function deleteDraft(id: string): void {
  const all = readAll(DRAFTS_KEY).filter((d) => d.id !== id)
  writeAll(DRAFTS_KEY, all)
}

export function submitRequest(data: RequestFormData): RequestFormData {
  const next: RequestFormData = { ...data, status: 'submitted', updatedAt: new Date().toISOString() }
  const all = readAll(SUBMITTED_KEY)
  all.unshift(next)
  writeAll(SUBMITTED_KEY, all)
  deleteDraft(data.id)
  return next
}

export function listSubmitted(): RequestFormData[] {
  return readAll(SUBMITTED_KEY).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}
