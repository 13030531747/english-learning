export type MathTopic = "trigonometric-identities" | "necessary-sufficient" | "equivalent-transformations";
export type MathQuestionType = "choice" | "input";
export type MathQuestion = {
  id: string;
  topic: MathTopic;
  type: MathQuestionType;
  prompt: string;
  options?: { id: string; text: string }[];
  answer: string;
  acceptedAnswers?: string[];
  conditions: string[];
  explanation: string[];
  pitfall: string;
  difficulty: "medium" | "advanced";
};
export type MathLearningState = {
  questionId: string;
  attempts: number;
  correct: number;
  wrong: number;
  lastAnsweredAt?: number;
};
export type MathAnswerRecord = {
  id: string;
  questionId: string;
  answer: string;
  correct: boolean;
  answeredAt: number;
};
export type MathStore = {
  version: 1;
  states: Record<string, MathLearningState>;
  records: MathAnswerRecord[];
  favorites: string[];
};
