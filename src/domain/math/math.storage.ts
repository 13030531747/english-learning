import type { MathAnswerRecord, MathLearningState, MathQuestion, MathStore } from "./math.types";
import { checkMathAnswer } from "./math.validator";

export const MATH_STORAGE = "math-study-v1";
export const MATH_ARCHIVE_FORMAT = "math-learning-archive";
const emptyMathStore = (): MathStore => ({ version: 1, states: {}, records: [], favorites: [] });
export type MathArchivePreview = {
  store: MathStore;
  exportedAt: string | null;
  stateCount: number;
  recordCount: number;
  favoriteCount: number;
};

const isFiniteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function validateMathStore(value: unknown): MathStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("数学存档数据结构无效");
  const store = value as Partial<MathStore>;
  if (store.version !== 1 || !store.states || typeof store.states !== "object" || Array.isArray(store.states) || !Array.isArray(store.records) || !Array.isArray(store.favorites)) throw new Error("数学存档数据结构无效");
  for (const [id, stateValue] of Object.entries(store.states)) {
    if (!isNonEmptyString(id) || !stateValue || typeof stateValue !== "object" || Array.isArray(stateValue)) throw new Error("数学存档学习状态无效");
    const state = stateValue as MathLearningState;
    if (state.questionId !== id || !isFiniteNonNegative(state.attempts) || !isFiniteNonNegative(state.correct) || !isFiniteNonNegative(state.wrong) || state.correct + state.wrong !== state.attempts || (state.lastAnsweredAt !== undefined && !isFiniteNonNegative(state.lastAnsweredAt))) throw new Error("数学存档学习状态无效");
  }
  const recordIds = new Set<string>();
  for (const recordValue of store.records) {
    if (!recordValue || typeof recordValue !== "object" || Array.isArray(recordValue)) throw new Error("数学存档答题记录无效");
    const record = recordValue as MathAnswerRecord;
    if (!isNonEmptyString(record.id) || recordIds.has(record.id) || !isNonEmptyString(record.questionId) || typeof record.answer !== "string" || typeof record.correct !== "boolean" || !isFiniteNonNegative(record.answeredAt)) throw new Error("数学存档答题记录无效");
    recordIds.add(record.id);
  }
  if (store.favorites.some((id) => !isNonEmptyString(id)) || new Set(store.favorites).size !== store.favorites.length) throw new Error("数学存档收藏列表无效");
  return store as MathStore;
}

export function loadMathStore(): MathStore {
  try {
    const raw = localStorage.getItem(MATH_STORAGE);
    if (!raw) return emptyMathStore();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed.states || !Array.isArray(parsed.records) || !Array.isArray(parsed.favorites)) return emptyMathStore();
    return parsed as MathStore;
  } catch { return emptyMathStore(); }
}
export function saveMathStore(store: MathStore) { localStorage.setItem(MATH_STORAGE, JSON.stringify(store)); }
export function exportMathStore(store: MathStore) { return JSON.stringify({ format: MATH_ARCHIVE_FORMAT, schemaVersion: 1, subject: "math", exportedAt: new Date().toISOString(), data: store }, null, 2); }
export function importMathStore(raw: string): MathArchivePreview {
  const archive = JSON.parse(raw);
  if (archive?.subject !== "math" || archive?.format !== MATH_ARCHIVE_FORMAT || archive?.schemaVersion !== 1) throw new Error("这不是受支持的数学学习存档");
  const store = validateMathStore(archive.data);
  const exportedAt = typeof archive.exportedAt === "string" && !Number.isNaN(Date.parse(archive.exportedAt)) ? archive.exportedAt : null;
  return { store, exportedAt, stateCount: Object.keys(store.states).length, recordCount: store.records.length, favoriteCount: store.favorites.length };
}

export function mergeMathStores(current: MathStore, incoming: MathStore): MathStore {
  const states = { ...incoming.states, ...current.states };
  for (const [id, imported] of Object.entries(incoming.states)) {
    const local = current.states[id];
    if (local) states[id] = {
      questionId: id,
      attempts: Math.max(local.attempts, imported.attempts),
      correct: Math.max(local.correct, imported.correct),
      wrong: Math.max(local.wrong, imported.wrong),
      lastAnsweredAt: Math.max(local.lastAnsweredAt ?? 0, imported.lastAnsweredAt ?? 0) || undefined,
    };
  }
  return {
    version: 1,
    states,
    records: [...new Map([...current.records, ...incoming.records].map((record) => [record.id, record])).values()],
    favorites: [...new Set([...current.favorites, ...incoming.favorites])],
  };
}

export function recordMathAnswer(store: MathStore, question: MathQuestion, answer: string, now = Date.now()): { store: MathStore; correct: boolean } {
  const correct = checkMathAnswer(question, answer);
  const old = store.states[question.id] ?? { questionId: question.id, attempts: 0, correct: 0, wrong: 0 };
  const state: MathLearningState = { questionId: question.id, attempts: old.attempts + 1, correct: old.correct + (correct ? 1 : 0), wrong: old.wrong + (correct ? 0 : 1), lastAnsweredAt: now };
  const record: MathAnswerRecord = { id: `math-${question.id}-${now}`, questionId: question.id, answer, correct, answeredAt: now };
  return { correct, store: { ...store, states: { ...store.states, [question.id]: state }, records: [...store.records, record] } };
}
