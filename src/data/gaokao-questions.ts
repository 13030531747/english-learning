import type { GrammarPointId, Question } from "../domain/questions/question.types";

type GrammarRow = [string, GrammarPointId, string, string, string[], string];
const rows: GrammarRow[] = [
  ["tense-present-perfect", "tense-voice", "Since he joined the team, he ______ three new methods.", "has developed", ["developed", "develops", "had developed"], "Since 引导的时间状语从句表示从过去持续到现在，主句常用现在完成时。"],
  ["voice-report", "tense-voice", "The new library ______ next month, according to the plan.", "will be opened", ["will open", "is opening", "has opened"], "图书馆是被开放，且时间为将来，使用一般将来时的被动语态。"],
  ["clause-what", "clauses", "______ matters most is whether we keep learning.", "What", ["Which", "That", "It"], "What 引导主语从句，并在从句中作主语，表示“……的事情”。"],
  ["clause-where", "clauses", "The village ______ I spent my childhood has changed greatly.", "where", ["which", "that", "whose"], "先行词 village 表地点，关系副词 where 在定语从句中作地点状语。"],
  ["modal-must", "modal-verbs", "You ______ be tired after such a long journey. Let me get you some water.", "must", ["can", "should", "would"], "根据长途旅行这一明显证据作肯定推测，用 must 表示“一定”。"],
  ["modal-need", "modal-verbs", "You ______ have bought any food; we have plenty at home.", "needn't", ["mustn't", "couldn't", "wouldn't"], "needn't have done 表示“本没必要做却做了”。"],
  ["subjunctive-wish", "subjunctive", "I wish I ______ more time to prepare for the speech yesterday.", "had had", ["have", "would have", "had"], "对过去情况的愿望用 wish + 过去完成时。"],
  ["subjunctive-if", "subjunctive", "If she had taken the earlier train, she ______ here now.", "would be", ["will be", "would have been", "is"], "虚拟条件句中，过去条件导致现在结果，主句用 would + 动词原形。"],
  ["agreement-each", "agreement", "Each of the students ______ responsible for one part of the project.", "is", ["are", "were", "have been"], "each 作主语中心词时谓语用单数。"],
  ["agreement-neither", "agreement", "Neither the coach nor the players ______ satisfied with the result.", "were", ["was", "is", "has been"], "neither...nor...连接主语时，谓语通常与靠近它的主语 players 保持一致。"],
  ["article-university", "articles-pronouns", "After graduating, she hopes to study at ______ university in the north.", "a", ["an", "the", "不填"], "university 的首音素为辅音 /j/，泛指一所大学用 a。"],
  ["pronoun-it", "articles-pronouns", "The weather was so cold that ______ was difficult to stay outside.", "it", ["that", "this", "which"], "it 作形式主语，真正主语是后面的不定式短语。"],
  ["comparison-the", "comparison", "The more carefully you read, ______ you will understand the passage.", "the better", ["better", "the best", "more well"], "the + 比较级..., the + 比较级... 表示“越……就越……”。"],
  ["comparison-as", "comparison", "The second experiment was not ______ successful as the first one.", "as", ["so much", "more", "such"], "not as/so + 形容词原级 + as 表示“不如……”。"],
  ["inversion-never", "inversion-emphasis", "Never before ______ such a clear night sky in this city.", "have I seen", ["I have seen", "I saw", "did I see"], "否定副词置于句首时句子部分倒装；before 与现在完成时连用。"],
  ["emphasis-it", "inversion-emphasis", "It was yesterday ______ we finally received the exam results.", "that", ["when", "which", "where"], "强调句型 It is/was + 被强调部分 + that...。"],
  ["word-formation-success", "word-formation", "The success of the project depends on effective ______ between the teams.", "communication", ["communicate", "communicative", "communicated"], "形容词 effective 后需要名词，communicate 的名词形式是 communication。"],
  ["word-formation-patient", "word-formation", "Please be ______ with the young learners; they need time to improve.", "patient", ["patience", "patiently", "impatient"], "be 动词后用形容词作表语；patient 表示“有耐心的”。"],
  ["nonfinite-meaning", "non-finite", "______ the instructions carefully, he completed the task without help.", "Having read", ["Read", "To read", "Having been read"], "分词短语作原因/时间状语，读说明发生在完成任务之前，用 having done。"],
  ["nonfinite-purpose", "non-finite", "The school built a new lab ______ students more chances to experiment.", "to give", ["giving", "given", "give"], "不定式作目的状语，表示建实验室的目的。"],
];

export const gaokaoQuestions: Question[] = rows.map(([id, grammarPoint, prompt, answer, distractors, explanation]) => {
  const optionsText = [answer, ...distractors];
  const shift = [...id].reduce((total, character) => total + character.charCodeAt(0), 0) % optionsText.length;
  const options = optionsText.slice(shift).concat(optionsText.slice(0, shift)).map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  return {
    id: `q-${id}`, category: "verb-pattern", type: "choice", prompt, options,
    answer: options.find((option) => option.text === answer)!.id, acceptedAnswers: [answer],
    collocation: grammarPoint, explanation, translation: "高考语法考点练习", tags: [grammarPoint], difficulty: "medium", grammarPoint,
  };
});
