import type { GrammarPointId } from "../domain/questions/question.types";

export type ClozeBlank = {
  id: string;
  hint?: string;
  answer: string;
  acceptedAnswers?: string[];
  grammarPoint: GrammarPointId;
  explanation: string;
};

export type ClozeSegment = { before: string; blankId?: string; after?: string };

export const clozeExam = {
  id: "community-garden",
  title: "A Garden for Everyone",
  instruction: "阅读下面短文，在空白处填入 1 个适当的单词或括号内单词的正确形式。",
  segments: [
    { before: "Last spring, students in our town turned an unused piece of land into a community garden. The idea ", blankId: "cloze-1", after: " (come) from a school project about local environmental protection. At first, some neighbors were unsure " },
    { before: "", blankId: "cloze-2", after: " the plan would succeed. The students listened to their concerns and invited them to a meeting. Several families offered " },
    { before: "", blankId: "cloze-3", after: " help prepare the soil. They brought seeds and tools, " },
    { before: "", blankId: "cloze-4", after: " made the first workday lively. " },
    { before: "Some families planted vegetables, while ", blankId: "cloze-5", after: " chose flowers that would attract bees. An experienced gardener showed the children how to plant seeds at the right depth. He also explained that young plants grow best " },
    { before: "", blankId: "cloze-6", after: " they receive enough light and water. The children soon became " },
    { before: "", blankId: "cloze-7", after: " (interest) in watching the garden change. " },
    { before: "By late summer, the first vegetables were ready. The families ", blankId: "cloze-8", after: " (share) their harvest with a nearby community kitchen. Volunteers there used the fresh food to prepare meals for older residents. " },
    { before: "The project did more than provide food. It gave people a reason to meet regularly, and many friendships began in the garden. What surprised the students most ", blankId: "cloze-9", after: " the number of neighbors who continued to help after the project ended. Their experience shows that a small local project can make a lasting difference when people work together. " },
    { before: "The garden is now a place " , blankId: "cloze-10", after: " residents can learn from one another and care for their shared environment." },
  ] satisfies ClozeSegment[],
  blanks: [
    { id: "cloze-1", hint: "come", answer: "came", grammarPoint: "tense-voice", explanation: "文章以 last spring 叙述过去发生的事，主句谓语用 come 的一般过去式 came。" },
    { id: "cloze-2", answer: "whether", acceptedAnswers: ["if"], grammarPoint: "clauses", explanation: "were unsure 后接宾语从句；whether/if 表示“是否”。" },
    { id: "cloze-3", answer: "to", grammarPoint: "non-finite", explanation: "offer to do sth. 表示“主动提出做某事”，空格填不定式标记 to。" },
    { id: "cloze-4", answer: "which", grammarPoint: "clauses", explanation: "which 引导非限制性定语从句，指代前面带来种子和工具这件事。" },
    { id: "cloze-5", answer: "others", grammarPoint: "articles-pronouns", explanation: "some...others...构成固定对应，表示“一些……另一些……”。" },
    { id: "cloze-6", answer: "when", grammarPoint: "clauses", explanation: "when 引导时间状语从句，说明幼苗在什么情况下长得最好。" },
    { id: "cloze-7", hint: "interest", answer: "interested", grammarPoint: "word-formation", explanation: "became 后接形容词作表语；become interested in 表示“对……产生兴趣”。" },
    { id: "cloze-8", hint: "share", answer: "shared", grammarPoint: "tense-voice", explanation: "本句主语 families 主动分享收成，且由 By late summer 的过去叙述语境可知用 shared。" },
    { id: "cloze-9", answer: "was", grammarPoint: "agreement", explanation: "What 引导的主语从句表示一件事，谓语用单数；叙述过去用 was。" },
    { id: "cloze-10", answer: "where", grammarPoint: "clauses", explanation: "先行词 place 表地点，定语从句缺地点状语，使用关系副词 where。" },
  ] satisfies ClozeBlank[],
};
