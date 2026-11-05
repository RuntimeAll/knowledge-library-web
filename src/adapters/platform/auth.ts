import { useWorkflowStore } from "../../stores/workflow";
const publicPages = new Set([
  "pages/login/index",
  "pages/foundation/index",
  "pages/about/index",
]);
let redirecting = false;
export function ensureSession(): boolean {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1]?.route || "";
  if (!current || publicPages.has(current)) return true;
  const workflow = useWorkflowStore();
  workflow.refresh();
  const session = workflow.session;
  if (session && session.expiresAt > Date.now()) return true;
  if (!redirecting) {
    redirecting = true;
    uni.reLaunch({
      url: "/pages/login/index",
      complete: () => {
        redirecting = false;
      },
    });
  }
  return false;
}
export function installSessionGuard(): void {
  for (const method of [
    "navigateTo",
    "redirectTo",
    "reLaunch",
    "switchTab",
  ] as const) {
    uni.addInterceptor(method, {
      invoke(options: { url?: string }) {
        const path = (options.url || "").replace(/^\//, "").split("?")[0];
        if (publicPages.has(path)) return true;
        const workflow = useWorkflowStore();
        workflow.refresh();
        const session = workflow.session;
        if (session && session.expiresAt > Date.now()) return true;
        uni.reLaunch({ url: "/pages/login/index" });
        return false;
      },
    });
  }
}
