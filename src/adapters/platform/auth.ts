import { useClientTasksStore } from "../../stores/client-tasks";
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
  const client = useClientTasksStore();
  client.restoreSession();
  if (client.authenticated) return true;
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
        const client = useClientTasksStore();
        client.restoreSession();
        if (client.authenticated) return true;
        uni.reLaunch({ url: "/pages/login/index" });
        return false;
      },
    });
  }
}
