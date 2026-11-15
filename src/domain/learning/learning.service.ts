import type { AnswerRecord, ConfidenceLevel, LearningState, Question } from "../questions/question.types";

export const DEFAULT_COOLDOWN_MINUTES = 10;
export function initialLearningState(questionId: string): LearningState { return { questionId, attemptCount: 0, correctCount: 0, wrongCount: 0, consecutiveCorrect: 0, consecutiveWrong: 0, mastery: "new" }; }
export function applyResult(state: LearningState, correct: boolean, now = Date.now(), confidence: ConfidenceLevel = "unsure", errorType: AnswerRecord["errorType"] = correct ? "wrong-choice" : "wrong-choice"): LearningState {
  const next = { ...state, attemptCount: state.attemptCount + 1, lastResult: correct ? "correct" as const : "wrong" as const, lastAnsweredAt: now, lastConfidence: confidence, lastErrorType: correct ? undefined : errorType };
  if (correct) { next.correctCount++; next.consecutiveCorrect++; next.consecutiveWrong = 0; next.intervalDays = next.consecutiveCorrect >= 5 ? 14 : next.consecutiveCorrect >= 3 ? 7 : next.consecutiveCorrect >= 2 ? 3 : 1; next.nextReviewAt = now + next.intervalDays * 86400000; next.cooldownUntil = now + DEFAULT_COOLDOWN_MINUTES * 60000; }
  else { next.wrongCount++; next.consecutiveWrong++; next.consecutiveCorrect = 0; next.intervalDays = 0; next.nextReviewAt = now + Math.min(next.consecutiveWrong, 4) * 15 * 60000; next.cooldownUntil = next.nextReviewAt; }
  next.mastery = next.consecutiveCorrect >= 5 ? "mastered" : next.consecutiveCorrect >= 2 ? "review" : "learning";
  return next;
}
export function applySkipped(state: LearningState, now = Date.now()): LearningState { return { ...state, lastResult: "skipped", lastAnsweredAt: now, cooldownUntil: now + DEFAULT_COOLDOWN_MINUTES * 60000 }; }
export function createAnswerRecord(question: Question, sessionId: string, submittedAnswer: string, isCorrect: boolean, elapsedMs: number, now = Date.now(), confidence: ConfidenceLevel = "unsure"): AnswerRecord { return { id: `${sessionId}-${question.id}-${now}`, sessionId, questionId: question.id, submittedAnswer, isCorrect, confidence, errorType: question.type === "choice" ? "wrong-choice" : "wrong-text", elapsedMs, answeredAt: now }; }
