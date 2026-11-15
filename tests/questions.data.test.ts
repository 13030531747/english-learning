import { describe, expect, it } from "vitest";
import { questions } from "../src/data/questions";
import { validateQuestion } from "../src/domain/questions/question.validator";

const categories = new Set(["fixed-collocation", "verb-pattern", "preposition", "confusable"]);

describe("built-in English question bank", () => {
  it("has unique IDs and structurally valid four-choice questions", () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    for (const question of questions) {
      expect(categories.has(question.category), question.id).toBe(true);
      expect(question.tags.length, question.id).toBeGreaterThan(0);
      expect(validateQuestion(question), question.id).toEqual([]);
    }
  });

  it("contains the expanded question bank and position-focused coverage", () => {
    expect(questions.length).toBeGreaterThanOrEqual(300);
    const tags = new Set(questions.flatMap((question) => question.tags));
    for (const tag of ["宾语位置", "补语位置", "词性槽位", "介词宾语", "从句边界", "平行结构"]) {
      expect(tags.has(tag), tag).toBe(true);
    }
  });
});
