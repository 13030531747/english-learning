import type { Question } from "./question.types";

export function normalizeAnswer(value: string) { return value.trim().replace(/\s+/g, " ").toLowerCase(); }
export function validateQuestion(question: Question): string[] {
  const errors: string[] = [];
  if (!question.id || !question.prompt || !question.answer || !question.collocation) errors.push("题目缺少必填内容");
  if (question.type === "choice") {
    if (!question.options || question.options.length !== 4) errors.push("选择题必须有四个选项");
    const ids = question.options?.map((option) => option.id) ?? [];
    if (new Set(ids).size !== ids.length) errors.push("选项不能重复");
    if (!question.options?.some((option) => option.id === question.answer)) errors.push("正确答案不在选项中");
  }
  return errors;
}
export function validateAnswer(question: Question, submitted: string) {
  const answers = [question.answer, ...(question.acceptedAnswers ?? [])].map(normalizeAnswer);
  const value = normalizeAnswer(submitted);
  return { isCorrect: answers.includes(value), normalizedInput: value, expectedAnswer: question.answer, errorType: question.type === "choice" ? "wrong-choice" as const : "wrong-text" as const };
}
