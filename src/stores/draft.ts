import { defineStore } from "pinia";
import { freshDraft, type Attachment, type DraftSpec } from "../core/skeleton";
export const useDraftStore = defineStore("draft", {
  state: () => ({ spec: freshDraft(), saved: null as DraftSpec | null }),
  actions: {
    addFiles(files: Attachment[]) {
      this.spec.attachments.push(
        ...files.slice(0, Math.max(0, 20 - this.spec.attachments.length)),
      );
    },
    toggleReference(id: string) {
      const at = this.spec.referenceIds.indexOf(id);
      if (at < 0) this.spec.referenceIds.push(id);
      else this.spec.referenceIds.splice(at, 1);
    },
    save() {
      this.saved = JSON.parse(JSON.stringify(this.spec));
    },
    restore() {
      if (this.saved) this.spec = JSON.parse(JSON.stringify(this.saved));
    },
  },
});
