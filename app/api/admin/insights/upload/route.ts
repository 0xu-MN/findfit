import { checkAdmin } from '@/lib/auth/checkAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

// 인사이트 커버 이미지 파일 업로드 — 이전엔 URL 입력만 가능했는데,
// 관리자가 갖고 있는 파일을 바로 올릴 수 있어야 해서 추가했다.
export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG · PNG · WEBP · GIF만 업로드할 수 있어요' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '5MB 이하 파일만 업로드할 수 있어요' }, { status: 400 })
  }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await admin.storage
    .from('insight-covers')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (error) {
    console.error('[admin/insights/upload]', error)
    return NextResponse.json({ error: '업로드에 실패했어요' }, { status: 500 })
  }

  const { data } = admin.storage.from('insight-covers').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
