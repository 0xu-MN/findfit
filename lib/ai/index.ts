import { callClaude } from './claude'
import { callGemini } from './gemini'
import { buildPrompt, buildQuestionRecommendationPrompt, type ProjectForReport, type ProjectForSuggest, type QuestionSuggestion, type QuestionTemplate, type Review, type ReviewQuestion } from './prompt'

export type CreatorLevel = 'seed' | 'sprout' | 'builder' | 'launcher'

export async function generateReport(
  reviews: Review[],
  project: ProjectForReport,
  creatorLevel: CreatorLevel
): Promise<Record<string, unknown>> {
  const engine: 'claude' | 'gemini' = ['builder', 'launcher'].includes(creatorLevel)
    ? 'claude'
    : 'gemini'
  const prompt = buildPrompt(reviews, project)
  const result = engine === 'claude' ? await callClaude(prompt) : await callGemini(prompt)
  return { ...result, ai_engine_used: engine }
}

export async function generateQuestionSuggestions(
  project: ProjectForSuggest,
  requiredQuestions: QuestionTemplate[],
  alreadyAdded: ReviewQuestion[],
  remainingSlots: number,
  _creatorLevel: CreatorLevel
): Promise<QuestionSuggestion[]> {
  const prompt = buildQuestionRecommendationPrompt(project, requiredQuestions, alreadyAdded, remainingSlots)
  try {
    const raw = await callGemini(prompt)
    if (Array.isArray(raw)) return raw as QuestionSuggestion[]
    const arr = Object.values(raw).find(Array.isArray)
    return (arr ?? []) as QuestionSuggestion[]
  } catch {
    return []
  }
}
