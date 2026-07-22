import { NextResponse } from 'next/server'
import { callGemini } from '@/lib/ai/gemini'
import { buildInterestSuggestionPrompt, type InterestSuggestProject } from '@/lib/ai/prompt'

export async function POST(req: Request) {
  try {
    const { project, existing } = (await req.json()) as {
      project?: InterestSuggestProject
      existing?: string[]
    }
    if (!project) return NextResponse.json({ suggestions: [] })

    const prompt = buildInterestSuggestionPrompt(project, existing ?? [])
    const raw = await callGemini(prompt)
    const suggestions = Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : []

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[interests/suggest]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
