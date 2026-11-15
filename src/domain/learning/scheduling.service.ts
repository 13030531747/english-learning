import type { LearningState, Question, SessionMode } from "../questions/question.types";

export function questionWeight(question: Question, state: LearningState | undefined, now = Date.now()) {
  if (!state) return 2.5;
  const cooling = state.cooldownUntil && state.cooldownUntil > now;
  if (cooling) return 0;
  const overdue = state.nextReviewAt && state.nextReviewAt <= now ? 4 : 0;
  const unsure = state.lastConfidence === "guess" ? 2 : state.lastConfidence === "unsure" ? 1 : 0;
  const masteryReduction = state.mastery === "mastered" ? 2 : state.mastery === "review" ? 1 : 0;
  return Math.max(0.25, Math.min(30, 1 + state.wrongCount * 3 + state.consecutiveWrong * 4 + overdue + unsure - state.correctCount * 0.6 - state.consecutiveCorrect * 2 - masteryReduction));
}
export function chooseGaokaoQuestions(questions: Question[], count = 20, random = Math.random) {
  const pool = questions.filter((question) => question.type === "choice");
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((question) => question.id);
}

export const GAOKAO_QUESTION_COUNT = 20;
export const GAOKAO_DURATION_MS = 15 * 60 * 1000;
export function chooseQuestions(questions: Question[], states: Record<string, LearningState>, mode: SessionMode, count: number, recent: string[] = [], random = Math.random, now = Date.now()) {
  const all = mode === "mistakes" ? questions.filter((q) => (states[q.id]?.wrongCount ?? 0) > 0) : questions;
  if (!all.length) return [];
  const available = all.filter((q) => questionWeight(q, states[q.id], now) > 0 && !recent.includes(q.id));
  const candidates = available.length ? available : all.filter((q) => !recent.includes(q.id));
  const result: string[] = [];
  while (result.length < count) {
    const unique = candidates.filter((q) => !result.includes(q.id));
    const pool = unique.length ? unique : (candidates.length ? candidates : all);
    const weights = pool.map((q) => questionWeight(q, states[q.id], now));
    const effective = weights.some((weight) => weight > 0) ? weights : pool.map(() => 1);
    const total = effective.reduce((sum, weight) => sum + weight, 0);
    let cursor = random() * total;
    let picked = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) { cursor -= effective[i]; if (cursor <= 0) { picked = pool[i]; break; } }
    result.push(picked.id);
  }
  return result;
}
