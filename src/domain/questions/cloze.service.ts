import { normalizeAnswer } from "./question.validator";
import type { ClozeBlank, ClozeSegment } from "../../data/cloze-exam";

export function isSingleWord(value: string) {
  const normalized = normalizeAnswer(value);
  return /^[a-z]+(?:['’-][a-z]+)*$/i.test(normalized);
}

export function validateClozeSet(blanks: ClozeBlank[], segments: ClozeSegment[]) {
  const errors: string[] = [];
  const ids = blanks.map((blank) => blank.id);
  if (new Set(ids).size !== ids.length) errors.push("Blank IDs must be unique.");
  const segmentIds = segments.flatMap((segment) => segment.blankId ? [segment.blankId] : []);
  if (segmentIds.length !== blanks.length || new Set(segmentIds).size !== segmentIds.length || ids.some((id) => !segmentIds.includes(id))) errors.push("Every blank must appear exactly once in the passage.");
  blanks.forEach((blank) => {
    if (!isSingleWord(blank.answer)) errors.push(`${blank.id}: answer must be one word.`);
    if ((blank.acceptedAnswers ?? []).some((answer) => !isSingleWord(answer))) errors.push(`${blank.id}: accepted answers must each be one word.`);
    if (blank.hint && !isSingleWord(blank.hint)) errors.push(`${blank.id}: hint must be one word.`);
  });
  return errors;
}

export function gradeClozeBlank(blank: ClozeBlank, submitted: string) {
  const normalized = normalizeAnswer(submitted);
  return isSingleWord(normalized) && [blank.answer, ...(blank.acceptedAnswers ?? [])].some((answer) => normalizeAnswer(answer) === normalized);
}
