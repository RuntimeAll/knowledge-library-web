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
  /** Exercise count within one practice book; legacy field name, absent history means one exercise. */
  practiceCopies?: number;
  originalCount: number;
  variantCount: number;
  extensionCount: number;
  subject: string;
  textbook: string;
  point: string; // compatibility label; selected points are owned by points
  chapter: string;
  points: string[];
  templateVersion: string;
  /** Legacy draft field; retained for read compatibility, no longer requested or used. */
  sourceQuestionCount?: number | null;
  countScope: "PER_SOURCE";
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
    practiceCopies: 20,
    originalCount: 1,
    variantCount: 2,
    extensionCount: 1,
    subject: "数学",
    textbook: "",
    point: "",
    chapter: "",
    points: [],
    templateVersion: "示例 v1",
    countScope: "PER_SOURCE",
    difficulty: "保持难度",
    template: "清爽练习",
    includeAnswers: true,
    note: "",
    range: "",
    attachments: [],
    referenceIds: [],
  };
}
export function displayTitle(
  spec: Pick<DraftSpec, "title" | "mode">,
  submissionId?: string,
): string {
  return (
    spec.title.trim() ||
    `${modeLabels[spec.mode]}${submissionId ? ` ${submissionId.replace(/^mock-submission-/, "")}` : ""}`
  );
}
export function practiceCopyCount(spec: DraftSpec): number {
  return spec.mode === "practice" ? (spec.practiceCopies ?? 1) : 1;
}
/** Restore old saved drafts without silently turning a prior single sheet into 20. */
export function withDraftDefaults(spec: DraftSpec): DraftSpec {
  return { ...freshDraft(), ...spec, practiceCopies: spec.practiceCopies ?? 1 };
}
export function draftError(draft: DraftSpec): string {
  if (draft.title.trim().length > 80) return "名称请控制在 80 字以内";
  if (
    draft.mode === "practice" &&
    (!Number.isInteger(draft.count) || draft.count < 1 || draft.count > 100)
  )
    return "题量需为 1～100 的整数";
  if (
    draft.mode === "practice" &&
    (!Number.isInteger(practiceCopyCount(draft)) ||
      practiceCopyCount(draft) < 1 ||
      practiceCopyCount(draft) > 100)
  )
    return "制作份数需为 1～100 的整数";
  if (
    draft.mode === "variant" &&
    [draft.originalCount, draft.variantCount, draft.extensionCount].some(
      (n) => !Number.isInteger(n) || n < 0 || n > 20,
    )
  )
    return "每项题量需为 0～20 的整数";
  if (
    draft.mode === "variant" &&
    draft.originalCount + draft.variantCount + draft.extensionCount < 1
  )
    return "请至少选择一项题目组合";
  if (draft.mode === "variant" && recipeSize(draft) > 50)
    return "每道母题组合不能超过 50 题";
  return "";
}
export function recipeSize(draft: DraftSpec): number {
  return draft.originalCount + draft.variantCount + draft.extensionCount;
}
export function sourceCount(draft: DraftSpec): number | null {
  if (draft.attachments.length) return null;
  return draft.referenceIds.length || null;
}
export function totalQuestions(draft: DraftSpec): number | null {
  if (draft.mode === "intake") return sourceCount(draft);
  if (draft.mode === "practice") return draft.count * practiceCopyCount(draft);
  const count = sourceCount(draft);
  return count === null ? null : count * recipeSize(draft);
}
export function submissionError(draft: DraftSpec): string {
  const error = draftError(draft);
  if (error) return error;
  if (!["数学", "科学"].includes(draft.subject)) return "请选择学科";
  const hasSource = !!(draft.attachments.length || draft.referenceIds.length);
  if (draft.mode !== "practice" && !hasSource) return "请先添加资料或选择母题";
  if (
    draft.mode === "practice" &&
    !hasSource &&
    !draft.goal.trim() &&
    !draft.points.length &&
    !draft.point
  )
    return "请填写制作要求或选择考点";
  if (draft.mode === "variant") {
    if (draft.countScope !== "PER_SOURCE") return "当前变式数量按每道母题计算";
    if (draft.referenceIds.length > 100) return "每次最多选择 100 道母题";
  }
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
