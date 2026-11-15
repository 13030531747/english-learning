import type { AnswerRecord, LearningState, PersistedStore, Question, UserSettings } from "../questions/question.types";
import { validateQuestion } from "../questions/question.validator";

export const STORAGE = "collocation-study-v2";
export const LEGACY_STORAGE = "collocation-study-v1";
export const ARCHIVE_FORMAT = "english-learning-archive";
export const ARCHIVE_SCHEMA_VERSION = 1;
export const DEFAULT_SETTINGS: UserSettings = { dailyGoal: 20, revealMode: "answer-first", cooldownMinutes: 10 };
const emptyStore = (): PersistedStore => ({ version: 2, learningStates: {}, answerRecords: [], settings: DEFAULT_SETTINGS, favorites: [], customQuestions: [] });
const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === "object" && !Array.isArray(value);
let blockedWriteReason: string | null = null;

function normalizeLearningState(id: string, raw: unknown): LearningState {
  if (!isObject(raw) || (raw.questionId !== undefined && raw.questionId !== id)) throw new Error("学习统计题目 ID 不一致");
  const correctCount = raw.correctCount ?? 0;
  const wrongCount = raw.wrongCount ?? 0;
  const attemptCount = raw.attemptCount ?? correctCount + wrongCount;
  const consecutiveCorrect = raw.consecutiveCorrect ?? 0;
  const consecutiveWrong = raw.consecutiveWrong ?? 0;
  for (const count of [correctCount, wrongCount, attemptCount, consecutiveCorrect, consecutiveWrong]) {
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("学习统计包含无效计数");
  }
  const mastery = ["new", "learning", "review", "mastered"].includes(raw.mastery) ? raw.mastery : (attemptCount ? "learning" : "new");
  const optionalTimes = [raw.lastAnsweredAt, raw.nextReviewAt, raw.cooldownUntil];
  if (optionalTimes.some((time) => time !== undefined && (!Number.isFinite(time) || time < 0))) throw new Error("学习统计包含无效时间");
  if (raw.lastResult !== undefined && !["correct", "wrong", "skipped"].includes(raw.lastResult)) throw new Error("学习统计结果类型无效");
  if (raw.lastConfidence !== undefined && !["guess", "unsure", "certain"].includes(raw.lastConfidence)) throw new Error("答题把握值无效");
  if (raw.lastErrorType !== undefined && !["wrong-choice", "wrong-text", "skipped"].includes(raw.lastErrorType)) throw new Error("错误类型无效");
  return { ...raw, questionId: id, attemptCount, correctCount, wrongCount, consecutiveCorrect, consecutiveWrong, mastery } as LearningState;
}

function validateRecord(raw: unknown): AnswerRecord {
  if (!isObject(raw) || typeof raw.id !== "string" || !raw.id || typeof raw.sessionId !== "string" || typeof raw.questionId !== "string" || typeof raw.submittedAnswer !== "string" || typeof raw.isCorrect !== "boolean" || !["wrong-choice", "wrong-text", "skipped"].includes(raw.errorType) || !Number.isFinite(raw.elapsedMs) || raw.elapsedMs < 0 || !Number.isFinite(raw.answeredAt) || raw.answeredAt < 0) throw new Error("答题记录中包含无效记录");
  if (raw.confidence !== undefined && !["guess", "unsure", "certain"].includes(raw.confidence)) throw new Error("答题记录置信度无效");
  return raw as AnswerRecord;
}

function validateCustomQuestion(raw: unknown): Question {
  if (!isObject(raw)) throw new Error("自定义题目格式不正确");
  const errors = validateQuestion(raw as Question);
  const categories = ["fixed-collocation", "verb-pattern", "preposition", "confusable"];
  const types = ["choice", "input"];
  const difficulties = ["basic", "medium", "advanced"];
  if (errors.length || typeof raw.id !== "string" || !categories.includes(raw.category) || !types.includes(raw.type) || !difficulties.includes(raw.difficulty) || typeof raw.explanation !== "string" || typeof raw.collocation !== "string" || !Array.isArray(raw.tags) || raw.tags.some((tag: unknown) => typeof tag !== "string") || (raw.acceptedAnswers !== undefined && (!Array.isArray(raw.acceptedAnswers) || raw.acceptedAnswers.some((answer: unknown) => typeof answer !== "string"))) || (raw.options !== undefined && (!Array.isArray(raw.options) || raw.options.some((option: unknown) => !isObject(option) || typeof option.id !== "string" || typeof option.text !== "string")))) throw new Error("自定义题目包含无效字段");
  return raw as Question;
}

function normalizeStore(value: unknown): PersistedStore {
  if (!isObject(value) || !isObject(value.learningStates) || !Array.isArray(value.answerRecords)) throw new Error("存档内容结构不完整");
  const learningStates: Record<string, LearningState> = {};
  for (const [id, state] of Object.entries(value.learningStates)) {
    if (!id) throw new Error("学习统计题目 ID 不能为空");
    learningStates[id] = normalizeLearningState(id, state);
  }
  const answerRecords = value.answerRecords.map(validateRecord);
  const settings = isObject(value.settings) ? value.settings : DEFAULT_SETTINGS;
  if (settings.dailyGoal !== undefined && (!Number.isFinite(settings.dailyGoal) || settings.dailyGoal <= 0) || settings.cooldownMinutes !== undefined && (!Number.isFinite(settings.cooldownMinutes) || settings.cooldownMinutes < 0) || settings.revealMode !== undefined && !["answer-first", "recall-first"].includes(settings.revealMode)) throw new Error("设置数据无效");
  if (value.favorites !== undefined && (!Array.isArray(value.favorites) || value.favorites.some((id: unknown) => typeof id !== "string" || !id))) throw new Error("收藏列表格式不正确");
  if (value.customQuestions !== undefined && !Array.isArray(value.customQuestions)) throw new Error("自定义题目列表格式不正确");
  const customQuestions = (value.customQuestions ?? []).map((question: unknown) => validateCustomQuestion(question));
  const questionIds = customQuestions.map((question: Question) => question.id);
  if (new Set(questionIds).size !== questionIds.length) throw new Error("自定义题目 ID 重复");
  return {
    ...emptyStore(), ...value, version: 2, learningStates, answerRecords,
    settings: { dailyGoal: settings.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal, revealMode: settings.revealMode ?? DEFAULT_SETTINGS.revealMode, cooldownMinutes: settings.cooldownMinutes ?? DEFAULT_SETTINGS.cooldownMinutes },
    favorites: [...new Set(value.favorites ?? [])], customQuestions,
  } as PersistedStore;
}

export function getStorageIssue() { return blockedWriteReason; }
export function loadStore(): PersistedStore {
  blockedWriteReason = null;
  try {
    const current = localStorage.getItem(STORAGE);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (isObject(parsed) && typeof parsed.version === "number" && parsed.version > 2) throw new Error("本机存档来自较新版本，请用新版应用打开，避免覆盖数据");
      if (isObject(parsed) && typeof parsed.version === "number" && parsed.version !== 2 && parsed.version !== 1) throw new Error("本机存档版本无法识别");
      return normalizeStore(parsed);
    }
    const old = localStorage.getItem(LEGACY_STORAGE);
    if (old) {
      const legacy: unknown = JSON.parse(old);
      const states = isObject(legacy) && isObject(legacy.learningStates) ? legacy.learningStates : legacy;
      if (!isObject(states) || Object.keys(states).length === 0) throw new Error("旧版本地学习数据无法识别");
      return normalizeStore({ learningStates: states, answerRecords: [], version: 1 });
    }
  } catch (error) {
    blockedWriteReason = error instanceof Error ? error.message : "本机存档损坏或版本不兼容";
    return emptyStore();
  }
  return emptyStore();
}
export function saveStore(store: PersistedStore, allowRecovery = false) {
  if (blockedWriteReason && !allowRecovery) throw new Error(`为保护原存档，已暂停本地写入：${blockedWriteReason}。请先导入有效存档恢复数据。`);
  localStorage.setItem(STORAGE, JSON.stringify(store));
  blockedWriteReason = null;
}
export function exportStore(store: PersistedStore) {
  return JSON.stringify({ format: ARCHIVE_FORMAT, schemaVersion: ARCHIVE_SCHEMA_VERSION, exportedAt: new Date().toISOString(), appVersion: "0.1.0", data: normalizeStore(store) }, null, 2);
}
export function parseImportedStore(raw: string): PersistedStore {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("文件不是有效的 JSON 存档"); }
  if (!isObject(parsed)) throw new Error("存档格式不正确");
  if (parsed.format === ARCHIVE_FORMAT) {
    if (!Number.isSafeInteger(parsed.schemaVersion)) throw new Error("存档格式版本必须是整数");
    if (parsed.schemaVersion > ARCHIVE_SCHEMA_VERSION) throw new Error(`此存档来自较新版本（格式 ${parsed.schemaVersion}），请升级应用后再导入`);
    if (parsed.schemaVersion !== ARCHIVE_SCHEMA_VERSION) throw new Error(`不支持存档格式版本 ${parsed.schemaVersion}`);
    return normalizeStore(parsed.data);
  }
  if (typeof parsed.version === "number" && parsed.version > 2) throw new Error(`此存档来自较新版本（数据 ${parsed.version}），当前版本无法安全导入`);
  if (isObject(parsed.learningStates) && Array.isArray(parsed.answerRecords) && (parsed.version === undefined || parsed.version === 2)) return normalizeStore(parsed);
  const legacyStates = isObject(parsed.learningStates) ? parsed.learningStates : parsed;
  if (Object.keys(legacyStates).length > 0 && Object.values(legacyStates).every((item) => isObject(item) && typeof item.questionId === "string")) return normalizeStore({ learningStates: legacyStates, answerRecords: [], version: 1 });
  throw new Error("无法识别此存档格式");
}
export function mergeStores(current: PersistedStore, imported: PersistedStore): PersistedStore {
  const answerRecords = [...new Map([...current.answerRecords, ...imported.answerRecords].map((record) => [record.id, record])).values()];
  const learningStates: Record<string, LearningState> = { ...current.learningStates };
  const stateIds = new Set([...Object.keys(current.learningStates), ...Object.keys(imported.learningStates)]);
  for (const id of stateIds) {
    const existing = current.learningStates[id];
    const incoming = imported.learningStates[id];
    if (!existing || !incoming) { learningStates[id] = (existing ?? incoming)!; continue; }
    const newer = (incoming.lastAnsweredAt ?? 0) >= (existing.lastAnsweredAt ?? 0) ? incoming : existing;
    const recordsForQuestion = answerRecords.filter((record) => record.questionId === id);
    const recordedCorrect = recordsForQuestion.filter((record) => record.isCorrect).length;
    const recordedWrong = recordsForQuestion.filter((record) => !record.isCorrect && record.errorType !== "skipped").length;
    const correctCount = Math.max(existing.correctCount, incoming.correctCount, recordedCorrect);
    const wrongCount = Math.max(existing.wrongCount, incoming.wrongCount, recordedWrong);
    learningStates[id] = { ...newer, correctCount, wrongCount, attemptCount: Math.max(existing.attemptCount, incoming.attemptCount, correctCount + wrongCount) };
  }
  const custom = new Map(current.customQuestions.map((question) => [question.id, question]));
  imported.customQuestions.forEach((question) => { if (!custom.has(question.id)) custom.set(question.id, question); });
  return { ...current, learningStates, answerRecords, settings: imported.settings, favorites: [...new Set([...current.favorites, ...imported.favorites])], customQuestions: [...custom.values()] };
}
export function todayKey(timestamp = Date.now()) { const date = new Date(timestamp); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function todayRecords(records: AnswerRecord[], now = Date.now()) { const key = todayKey(now); return records.filter((record) => todayKey(record.answeredAt) === key); }
export function dueCount(states: Record<string, LearningState>, now = Date.now()) { return Object.values(states).filter((state) => state.nextReviewAt !== undefined && state.nextReviewAt <= now).length; }
