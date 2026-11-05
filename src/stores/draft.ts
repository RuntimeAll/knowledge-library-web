import {
  readDraft,
  writeDraft,
  clearDraft,
} from "../adapters/platform/draft-cache";
import { defineStore } from "pinia";
import { freshDraft, type Attachment, type DraftSpec } from "../core/skeleton";
export const useDraftStore = defineStore("draft", {
  state: () => ({
    spec: freshDraft(),
    saved: readDraft() as DraftSpec | null,
    editingWorkOrderId: null as string | null,
    baseRevision: null as number | null,
    submissionKey: "",
  }),
  actions: {
    clearEdit() {
      this.editingWorkOrderId = null;
      this.baseRevision = null;
      this.submissionKey = "";
    },
    beginEdit(spec: DraftSpec, workOrderId: string, revision: number) {
      this.spec = JSON.parse(JSON.stringify(spec));
      this.editingWorkOrderId = workOrderId;
      this.baseRevision = revision;
      this.submissionKey = "";
    },
    newKey() {
      this.submissionKey = `demo-submit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return this.submissionKey;
    },
    clear() {
      this.spec = freshDraft();
      this.saved = null;
      this.clearEdit();
      clearDraft();
    },
    addFiles(files: Attachment[]) {
      this.spec.attachments.push(
        ...files.slice(0, Math.max(0, 20 - this.spec.attachments.length)),
      );
    },
    toggleReference(id: string, subject?: string) {
      const at = this.spec.referenceIds.indexOf(id);
      if (at < 0) {
        if (
          subject &&
          this.spec.referenceIds.length &&
          subject !== this.spec.subject
        )
          return false;
        if (subject && subject !== this.spec.subject) {
          this.spec.subject = subject;
          this.spec.textbook = "";
          this.spec.chapter = "";
          this.spec.points = [];
          this.spec.point = "";
        }
        this.spec.referenceIds.push(id);
      } else this.spec.referenceIds.splice(at, 1);
      this.spec.sourceQuestionCount = null;
      return true;
    },
    save(spec?: DraftSpec) {
      const snapshot = spec || this.spec;
      this.saved = JSON.parse(JSON.stringify(snapshot));
      writeDraft(snapshot);
    },
    restore() {
      if (this.saved) this.spec = JSON.parse(JSON.stringify(this.saved));
    },
  },
});
