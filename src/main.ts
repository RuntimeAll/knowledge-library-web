import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import { installSessionGuard, ensureSession } from "./adapters/platform/auth";
import { useWorkflowStore } from "./stores/workflow";
import App from "./App.vue";
import { setConfig } from "uview-plus";
import { iconFontUrl } from "./generated/icons";
setConfig({ config: { iconUrl: iconFontUrl, loadFontOnce: true } });
export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  useWorkflowStore().refresh();
  installSessionGuard();
  app.mixin({ onShow: ensureSession });
  return { app };
}
