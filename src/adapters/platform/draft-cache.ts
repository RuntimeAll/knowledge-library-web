import { withDraftDefaults, type DraftSpec } from "../../core/skeleton";
const key = "knowledge-library-demo-draft-v1";
export function readDraft(): DraftSpec | null {
  try {
    const value = uni.getStorageSync(key);
    if (!value || value.version !== 1 || typeof value.spec?.title !== "string")
      return null;
    const spec = withDraftDefaults(value.spec as DraftSpec);
    // Temporary paths must be selected again after reload; names and order stay visible.
    spec.attachments = (spec.attachments || []).map((file) => ({
      ...file,
      path: "",
    }));
    return spec;
  } catch {
    return null;
  }
}
export function writeDraft(spec: DraftSpec): void {
  uni.setStorageSync(key, {
    version: 1,
    spec: JSON.parse(JSON.stringify(spec)),
  });
}
export function clearDraft(): void {
  uni.removeStorageSync(key);
}
