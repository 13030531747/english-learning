import { describe, expect, it } from "vitest";
import { ARCHIVE_FORMAT, ARCHIVE_SCHEMA_VERSION, exportStore, mergeStores, parseImportedStore } from "../src/domain/learning/storage.service";
import type { PersistedStore } from "../src/domain/questions/question.types";

const state = { questionId: "q1", attemptCount: 2, correctCount: 1, wrongCount: 1, consecutiveCorrect: 0, consecutiveWrong: 1, mastery: "learning" as const };
const store: PersistedStore = { version: 2, learningStates: { q1: state }, answerRecords: [{ id: "r1", sessionId: "s1", questionId: "q1", submittedAnswer: "x", isCorrect: false, errorType: "wrong-text", elapsedMs: 10, answeredAt: 100 }], settings: { dailyGoal: 20, revealMode: "answer-first", cooldownMinutes: 10 }, favorites: ["q1"], customQuestions: [] };

describe("portable learning archive", () => {
  it("exports a versioned envelope and round-trips the learning data", () => {
    const archive = JSON.parse(exportStore(store));
    expect(archive).toMatchObject({ format: ARCHIVE_FORMAT, schemaVersion: ARCHIVE_SCHEMA_VERSION });
    expect(parseImportedStore(JSON.stringify(archive))).toEqual(store);
  });

  it("accepts legacy v1 state snapshots", () => {
    const imported = parseImportedStore(JSON.stringify({ q1: state }));
    expect(imported.learningStates.q1.wrongCount).toBe(1);
    expect(imported.answerRecords).toEqual([]);
  });

  it("rejects future schema versions without attempting a downgrade", () => {
    expect(() => parseImportedStore(JSON.stringify({ format: ARCHIVE_FORMAT, schemaVersion: ARCHIVE_SCHEMA_VERSION + 1, data: store }))).toThrow(/较新版本/);
  });

  it("rejects malformed records before any merge can occur", () => {
    const invalid = { ...store, answerRecords: [{ id: "bad", questionId: "q1", isCorrect: "yes", answeredAt: 1 }] };
    expect(() => parseImportedStore(JSON.stringify(invalid))).toThrow(/无效记录/);
  });

  it("normalizes legacy learning counters and rejects empty or mismatched state maps", () => {
    const migrated = parseImportedStore(JSON.stringify({ q1: { questionId: "q1", correctCount: 2, wrongCount: 1 } }));
    expect(migrated.learningStates.q1.attemptCount).toBe(3);
    expect(() => parseImportedStore("{}")).toThrow(/无法识别/);
    expect(() => parseImportedStore(JSON.stringify({ q1: { questionId: "q2", correctCount: 1, wrongCount: 0 } }))).toThrow(/ID 不一致/);
  });

  it("rejects malformed custom questions and favorite IDs", () => {
    const malformedQuestion = { ...store, customQuestions: [null] };
    const malformedFavorite = { ...store, favorites: [42] };
    expect(() => parseImportedStore(JSON.stringify(malformedQuestion))).toThrow(/自定义题目/);
    expect(() => parseImportedStore(JSON.stringify(malformedFavorite))).toThrow(/收藏列表/);
  });

  it("restores imported settings and combines divergent record counts", () => {
    const other = { ...store, settings: { dailyGoal: 35, revealMode: "recall-first" as const, cooldownMinutes: 20 }, learningStates: { q1: { ...state, attemptCount: 2, correctCount: 2, wrongCount: 0 } }, answerRecords: [{ ...store.answerRecords[0], id: "r2", isCorrect: true, answeredAt: 200 }] };
    const merged = mergeStores(store, other);
    expect(merged.settings).toEqual(other.settings);
    expect(merged.answerRecords).toHaveLength(2);
    expect(merged.learningStates.q1.correctCount).toBe(2);
    expect(merged.learningStates.q1.attemptCount).toBe(3);
  });
  it("deduplicates records and avoids lowering accumulated counters", () => {
    const older = { ...store, learningStates: { q1: { ...state, attemptCount: 1, correctCount: 0, wrongCount: 1 } } };
    const merged = mergeStores(store, older);
    expect(merged.answerRecords).toHaveLength(1);
    expect(merged.learningStates.q1.attemptCount).toBe(2);
    expect(merged.learningStates.q1.correctCount).toBe(1);
  });
});
