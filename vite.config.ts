import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    base: env.VITE_WEB_BASE || "/",
    plugins: [uni()],
    server: { host: "127.0.0.1", port: 5193, strictPort: true },
  };
});
