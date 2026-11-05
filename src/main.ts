import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { setConfig } from "uview-plus";
import { iconFontUrl } from "./generated/icons";
setConfig({ config: { iconUrl: iconFontUrl, loadFontOnce: true } });
export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}
