export type MakeMode = "variant" | "practice" | "intake";
export type DisplayState = "ready" | "loading" | "empty" | "error";
export type TaskStatus =
  | "draft"
  | "queued"
  | "running"
  | "failed"
  | "completed";
export interface Attachment {
  id: string;
  name: string;
  kind: "image" | "pdf";
  path: string;
  size: number;
}
export interface DraftSpec {
  title: string;
  goal: string;
  mode: MakeMode;
  count: number;
  originalCount: number;
  variantCount: number;
  extensionCount: number;
  subject: string;
  textbook: string;
  point: string;
  difficulty: string;
  template: string;
  includeAnswers: boolean;
  note: string;
  range: string;
  attachments: Attachment[];
  referenceIds: string[];
}
export interface TaskSummary {
  id: string;
  title: string;
  subject: string;
  mode: MakeMode;
  status: TaskStatus;
  time: string;
  detail: string;
}
export interface ResourceSummary {
  id: string;
  title: string;
  subject: string;
  category: "outlines" | "points" | "questions" | "products";
  meta: string;
  description: string;
  usable: boolean;
}
export const modeLabels: Record<MakeMode, string> = {
  variant: "举一反三",
  practice: "专项练习",
  intake: "只录题",
};
export const statusLabels: Record<TaskStatus, string> = {
  draft: "草稿",
  queued: "等待处理",
  running: "处理中",
  failed: "需处理",
  completed: "已完成",
};
export function freshDraft(): DraftSpec {
  return {
    title: "",
    goal: "",
    mode: "practice",
    count: 10,
    originalCount: 1,
    variantCount: 2,
    extensionCount: 1,
    subject: "数学",
    textbook: "",
    point: "",
    difficulty: "基础巩固",
    template: "清爽练习",
    includeAnswers: true,
    note: "",
    range: "",
    attachments: [],
    referenceIds: [],
  };
}
export function draftError(draft: DraftSpec): string {
  if (!draft.title.trim()) return "先给这份资料起个名字";
  if (draft.title.trim().length > 80) return "名称请控制在 80 字以内";
  if (
    draft.mode === "practice" &&
    (!Number.isInteger(draft.count) || draft.count < 1 || draft.count > 100)
  )
    return "题量需为 1～100 的整数";
  if (
    draft.mode === "variant" &&
    [draft.originalCount, draft.variantCount, draft.extensionCount].some(
      (n) => !Number.isInteger(n) || n < 0 || n > 10,
    )
  )
    return "每项题量需为 0～10 的整数";
  if (
    draft.mode === "variant" &&
    draft.originalCount + draft.variantCount + draft.extensionCount < 1
  )
    return "请至少选择一项题目组合";
  return "";
}
export function matchResource(
  item: ResourceSummary,
  category: ResourceSummary["category"],
  subject: string,
  query: string,
): boolean {
  return (
    item.category === category &&
    (subject === "全部" || item.subject === subject) &&
    `${item.title} ${item.meta}`.includes(query.trim())
  );
}
