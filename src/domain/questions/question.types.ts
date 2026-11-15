export type QuestionCategory = "fixed-collocation" | "verb-pattern" | "preposition" | "confusable";
export type QuestionType = "choice" | "input";
export type Difficulty = "basic" | "medium" | "advanced";
export type ConfidenceLevel = "guess" | "unsure" | "certain";
export type ErrorType = "wrong-choice" | "wrong-text" | "skipped";
export type Mastery = "new" | "learning" | "review" | "mastered";

export type Question = {
  id: string; category: QuestionCategory; type: QuestionType; prompt: string; sentence?: string;
  options?: { id: string; text: string }[]; answer: string; acceptedAnswers?: string[];
  explanation: string; collocation: string; translation?: string; tags: string[]; difficulty: Difficulty;
  grammarPoint?: GrammarPointId;
  knowledgePointId?: string; variantGroupId?: string; source?: "builtin" | "custom" | "imported";
};
export type LearningState = {
  questionId: string; attemptCount: number; correctCount: number; wrongCount: number;
  consecutiveCorrect: number; consecutiveWrong: number; lastResult?: "correct" | "wrong" | "skipped";
  lastAnsweredAt?: number; lastConfidence?: ConfidenceLevel; lastErrorType?: ErrorType;
  mastery: Mastery; nextReviewAt?: number; cooldownUntil?: number; intervalDays?: number; favorite?: boolean;
};
export type AnswerRecord = {
  id: string; sessionId: string; questionId: string; submittedAnswer: string; isCorrect: boolean;
  errorType: ErrorType; confidence?: ConfidenceLevel; elapsedMs: number; answeredAt: number;
};
export type GrammarPointId = "verb-pattern" | "non-finite" | "tense-voice" | "clauses" | "modal-verbs" | "subjunctive" | "agreement" | "articles-pronouns" | "comparison" | "prepositions-collocations" | "inversion-emphasis" | "word-formation";
export type SessionMode = "mixed" | "mistakes" | "gaokao";
export type QuizSession = { id: string; mode: SessionMode; status: "running" | "paused" | "completed"; queue: string[]; currentIndex: number; answeredCount: number; correctCount: number; wrongCount: number; skippedCount: number; startedAt: number; updatedAt: number; deadlineAt?: number; };
export type UserSettings = { dailyGoal: number; revealMode: "answer-first" | "recall-first"; cooldownMinutes: number; };
export type PersistedStore = { version: 2; learningStates: Record<string, LearningState>; answerRecords: AnswerRecord[]; activeSession?: QuizSession; settings: UserSettings; favorites: string[]; customQuestions: Question[] };
