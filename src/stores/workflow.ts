import { defineStore } from "pinia";
import type { DraftSpec } from "../core/skeleton";
import type {
  MockPublication,
  MockSession,
  OrderQuery,
  SubmissionReceipt,
  SubmitOptions,
  WorkOrder,
  WorkflowAction,
  WorkflowPort,
} from "../core/workflow";
import { WorkflowError } from "../core/workflow";
import { MockWorkflowAdapter } from "../adapters/mock/workflow";

export const MOCK_WORKFLOW_STORAGE_KEY =
  "knowledge-library:admin-preview:workflow:v1";
let port: WorkflowPort | undefined;
function workflowPort(): WorkflowPort {
  if (!port)
    port = new MockWorkflowAdapter({
      storage: {
        read: () => {
          const value = uni.getStorageSync(MOCK_WORKFLOW_STORAGE_KEY);
          return typeof value === "string" ? value : undefined;
        },
        write: (value) => uni.setStorageSync(MOCK_WORKFLOW_STORAGE_KEY, value),
      },
    });
  return port;
}
/** Injection boundary for the eventual real adapter; pages use this store only. */
export function configureWorkflowPort(value: WorkflowPort): void {
  port = value;
}
export const useWorkflowStore = defineStore("workflow", {
  state: () => ({
    session: null as MockSession | null,
    orders: [] as WorkOrder[],
    publications: [] as MockPublication[],
    ready: false,
  }),
  getters: {
    isAuthenticated: (state) =>
      state.session?.kind === "mock" && state.session.expiresAt > Date.now(),
    getOrder: (state) => (id: string) =>
      state.orders.find((order) => order.id === id),
    getSubmission: (state) => (orderId: string, submissionId?: string) => {
      const order = state.orders.find((item) => item.id === orderId);
      return order?.submissions.find((sub) =>
        submissionId
          ? sub.id === submissionId
          : sub.revision === order.currentRevision,
      );
    },
  },
  actions: {
    refresh() {
      Object.assign(this, workflowPort().view());
      this.ready = true;
    },
    login(username = "admin") {
      const result = workflowPort().login(username);
      this.refresh();
      return result;
    },
    logout() {
      workflowPort().logout();
      this.refresh();
    },
    submit(spec: DraftSpec, options: SubmitOptions): SubmissionReceipt {
      try {
        return workflowPort().submit(spec, options);
      } finally {
        this.refresh();
      }
    },
    advance(orderId: string, submissionId: string, action: WorkflowAction) {
      try {
        return workflowPort().advance(orderId, submissionId, action);
      } finally {
        this.refresh();
      }
    },
    recover(key: string) {
      try {
        return workflowPort().recover(key);
      } finally {
        this.refresh();
      }
    },
    confirmResult(orderId: string, submissionId: string) {
      try {
        return workflowPort().confirmResult(orderId, submissionId);
      } finally {
        this.refresh();
      }
    },
    savePublication(resultId: string, title: string, intro: string) {
      try {
        return workflowPort().savePublication(resultId, title, intro);
      } finally {
        this.refresh();
      }
    },
    listOrders(query?: OrderQuery) {
      try {
        return workflowPort().listOrders(query);
      } catch (error) {
        if (
          error instanceof WorkflowError &&
          error.code === "UNAUTHENTICATED"
        ) {
          this.refresh();
          return {
            items: [],
            total: 0,
            page: query?.page || 1,
            pageSize: query?.pageSize || 10,
          };
        }
        throw error;
      }
    },
    resetDemo() {
      workflowPort().resetDemo();
      this.refresh();
    },
  },
});
