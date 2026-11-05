/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

declare module "uview-plus" {
  export function setConfig(options: {
    config: { iconUrl: string; loadFontOnce: boolean };
  }): void;
}

declare module "uview-plus/libs/vite/index.js" {
  import type { Plugin } from "vite";
  export default function UpVite(): Plugin;
}
