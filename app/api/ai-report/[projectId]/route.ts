import { buildPrompt, type ProjectForReport, type Review } from '@/lib/ai/prompt'
import { callGemini } from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const body = await req.json()
    const { project, reviews } = body as { project: ProjectForReport; reviews: Review[] }

    if (!project || !reviews) {
      return NextResponse.json({ error: 'project and reviews required' }, { status: 400 })
    }

    const prompt = buildPrompt(reviews, project)
    const result = await callGemini(prompt)

    return NextResponse.json({ ...result, ai_engine_used: 'gemini', project_id: projectId })
  } catch (err) {
    console.error('[ai-report]', err)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
