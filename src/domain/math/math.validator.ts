import type { MathQuestion } from "./math.types";

export function normalizeMathAnswer(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/[−–—]/g, "-").replace(/[＋]/g, "+").replace(/×/g, "*").replace(/÷/g, "/").toLowerCase();
}

export function checkMathAnswer(question: MathQuestion, submitted: string) {
  const accepted = [question.answer, ...(question.acceptedAnswers ?? [])].map(normalizeMathAnswer);
  return accepted.includes(normalizeMathAnswer(submitted));
}

export function validateMathQuestion(question: MathQuestion): string[] {
  const errors: string[] = [];
  if (!question.id.trim() || !question.prompt.trim() || !question.answer.trim()) errors.push("题目缺少必要内容");
  if (!question.conditions.length || !question.explanation.length || !question.pitfall.trim()) errors.push("题目必须说明条件、推理过程和易错点");
  if (question.type === "choice") {
    if (!question.options || question.options.length < 2) errors.push("选择题至少需要两个选项");
    const ids = question.options?.map((option) => option.id) ?? [];
    if (new Set(ids).size !== ids.length) errors.push("选项 ID 不能重复");
    if (!question.options?.some((option) => option.id === question.answer)) errors.push("正确选项不在选项列表中");
  }
  if (question.type === "input" && question.options) errors.push("填空题不能带选择项");
  return errors;
}
