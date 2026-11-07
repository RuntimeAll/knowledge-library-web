import { workflowStatusLabels, type WorkflowStatus } from "../../core/workflow";
export function workflowStatusLabel(status: WorkflowStatus): string {
  return workflowStatusLabels[status];
}
export function workflowTime(value: string | number): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "刚刚"
    : `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export function workflowError(error: unknown): string {
  return error instanceof Error ? error.message : "暂时未能完成，请重试";
}
