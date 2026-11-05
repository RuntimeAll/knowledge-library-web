# 知识库用户端

手机优先的 uni-app Vue3 + TypeScript + Pinia + uview-plus 页面骨架，目标为 Web、微信小程序、标准 App Vue。与现有管理端分开维护，后续复用同一知识库后端。

当前已有「工作台 / 题库 / 记录 / 我的」四个入口、制作配置、资料详情、记录详情、结果、排版经验与预览、发布准备、教学工具及偏好设置。页面内为明确标注的示例数据，真实制作/上传/发布尚未接入。

## 本机预览

Node.js 24、npm 11（本轮24.22.1 / 11.19.1），按锁文件安装：

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:5193>，仅监听本机回环。现有管理端5173、后端8080继续独立运行。开发组件预览：<http://127.0.0.1:5193/#/pages/ui/index>。

## 验证与三端构建

```bash
npm run lint
npm run type-check
npm test
npm run build:all
npm run test:architecture
npx playwright install chromium
npm run test:ui
npm run test:skeleton
```

`build:h5`输出`dist/build/h5`；`build:mp-weixin`输出`dist/build/mp-weixin`；`build:app`输出`dist/build/app`。开发命令分别是`dev:h5`、`dev:mp-weixin`、`dev:app`。图标资产在构建/启动前从锁定的依赖包自动生成，无外部CDN依赖。`tools/prepare-icons.mjs`仅生成本应用字体，`tools/check-boundaries.mjs`只读检查分层与产物。

Web生产浏览器验证覆盖360/390/430/1280宽度，截图和报告在忽略提交的`test-results`。小程序与App仅完成独立编译；导入对应开发工具、真实AppID、基座/真机、权限与签名打包仍待验证。App资源构建不是apk/ipa；App任意PDF选择还需原生能力，当前显式禁用。

## 维护入口

详见[页面与持续开发](docs/development.md)、[本仓库约定](AGENTS.md)。分层为`pages`→`components/business`→`core`，通用组件在`components/ui`，状态在`stores`，平台差异在`adapters/platform`，H5专用能力在`adapters/web`。三类对象由`core/skeleton.ts`定义，示例单独放`fixtures`。`npm run format`格式化源码。

`.env.example`说明API环境配置；不配置也能预览。`VITE_API_BASE_URL`控制接入地址，`VITE_WEB_BASE`控制H5静态资源前缀。所有`VITE_*`均为客户端公开信息，不填写凭据。配置仅保存在当前内存会话，刷新清空。正式数据分页、权限和任务调度由后续接口接入承接。

[初始版本记录](docs/initialization.md)保留旧Web基线与依赖审计背景。官方DCloud编译链版本一致锁定，Vite5.2.8为其精确peer，不以强制升级跳过兼容检查。当前构建与页面验证不替代生产安全审查。

源码托管在[RuntimeAll/knowledge-library-web](https://github.com/RuntimeAll/knowledge-library-web)。PRD及用户验收正本留在现有知识库工作空间；本次没有部署GitHub Pages或公网服务。
