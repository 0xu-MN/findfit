import { callClaude } from './claude'
import { buildQuestionRecommendationPrompt, type ProjectForSuggest, type QuestionSuggestion, type QuestionTemplate, type ReviewQuestion } from './prompt'

export type CreatorLevel = 'seed' | 'sprout' | 'builder' | 'launcher'

export async function generateQuestionSuggestions(
  project: ProjectForSuggest,
  requiredQuestions: QuestionTemplate[],
  alreadyAdded: ReviewQuestion[],
  remainingSlots: number,
  _creatorLevel: CreatorLevel
): Promise<QuestionSuggestion[]> {
  const prompt = buildQuestionRecommendationPrompt(project, requiredQuestions, alreadyAdded, remainingSlots)
  try {
    // haiku 등급 — 자동추천처럼 빠른 응답이 중요한 가벼운 작업
    const raw = await callClaude(prompt, 'haiku')
    if (Array.isArray(raw)) return raw as QuestionSuggestion[]
    const arr = Object.values(raw).find(Array.isArray)
    return (arr ?? []) as QuestionSuggestion[]
  } catch {
    return []
  }
}
