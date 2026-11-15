import { describe, expect, it } from "vitest";
import { clozeExam } from "../src/data/cloze-exam";
import { gradeClozeBlank, isSingleWord, validateClozeSet } from "../src/domain/questions/cloze.service";

describe("Gaokao grammar cloze data", () => {
  it("has ten uniquely mapped blanks with one-word answers", () => {
    expect(clozeExam.blanks).toHaveLength(10);
    expect(validateClozeSet(clozeExam.blanks, clozeExam.segments)).toEqual([]);
    expect(clozeExam.blanks.every((blank) => isSingleWord(blank.answer))).toBe(true);
  });

  it("grades case-insensitively but rejects multi-word answers", () => {
    const blank = clozeExam.blanks.find((item) => item.id === "cloze-2")!;
    expect(gradeClozeBlank(blank, " WHETHER ")).toBe(true);
    expect(gradeClozeBlank(blank, "if")).toBe(true);
    expect(gradeClozeBlank(blank, "whether or not")).toBe(false);
    expect(gradeClozeBlank(blank, "")).toBe(false);
  });

  it("rejects any multi-word key in a cloze set", () => {
    const invalid = clozeExam.blanks.map((blank) => blank.id === "cloze-1" ? { ...blank, answer: "came back" } : blank);
    expect(validateClozeSet(invalid, clozeExam.segments)).toContain("cloze-1: answer must be one word.");
  });
});
