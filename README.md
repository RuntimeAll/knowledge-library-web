# 知识库 Web 用户端

PRD-100-01-01 初始化工程。独立于若依管理端，复用现有知识库后端和数据；当前仅提供基础能力预览，业务接口和制作流程尚未联调。

## 运行

Node.js 24（本轮 24.22.1）、npm 11。首次从仓库取回后：

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:5193>。只监听本机回环地址，端口被占用会报错。不会切换现有 5173/8080 服务。

```bash
npm run lint
npm run type-check
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

生产文件在 `dist/build/h5/`，采用 hash 路由。该目录是构建结果，不提交 Git。本轮仅代码托管，不配置 Pages 或公网部署。浏览器验证会把截图和报告保存到 `test-results/`；GitHub 自动检查暂未配置。

## 配置与目录

`.env.example` 是公开配置示例；不填 API 地址也可打开基础预览。需要接入时复制为 `.env.local`，设置 `VITE_API_BASE_URL` 并重新启动或构建，例如同源路径 `/api`。`VITE_WEB_BASE` 控制静态资源部署前缀。所有 `VITE_*` 会进入浏览器产物，严禁填写密码、令牌、签名链接或私有服务器配置。

|目录|职责|
|---|---|
|`src/pages`|页面组合及路由上下文|
|`src/components/ui`|uview-plus 薄封装，不含业务 URL|
|`src/components/business`|配置预览交互|
|`src/core`|无 Vue/DOM/uni 依赖的类型、校验和端口|
|`src/api`|注入请求及会话的客户端，检查若依业务响应码；尚无拟造业务端点|
|`src/adapters/web`|uni.request、会话、导航、浏览器文件/PDF能力|
|`src/stores`|本次配置状态；内存保存，刷新清空|
|`src/styles`|颜色、间距等基础样式|
|`tests`|核心边界测试与生产构建浏览器检查|

文件预览只接受 PDF、PNG、JPEG、GIF，限制 20 MB，检查文件签名字节；不上传文件。PDF 使用浏览器原生 iframe 预览，可下载原字节；浏览器不支持内嵌 PDF 时可下载打开。临时对象 URL 在替换和离开时释放。原生文件输入、图片与 iframe 均隔离在 Web 适配层；没有承诺跨端兼容。答案开关默认开启，预览答案为红色；关闭后从弹层中移除答案节点。

## 模板与组件兼容

基于 [DCloud 官方 Vue3/TS 模板](https://github.com/dcloudio/uni-preset-vue/tree/vite-ts)，起点 commit `f747e3b11c51b3bff6c05e2b54f9a3173a590044`。按[官方 CLI 指南](https://uniapp.dcloud.net.cn/quickstart-cli)取模板，仅保留 Web 编译目标。版本以 `package-lock.json` 为准，不搬用管理端 Vite 版本。

uview-plus 按[官方 npm 配置](https://uview-plus.jiangruyi.com/components/npmSetting.html)设置 SCSS 和 easycom。按钮、输入、开关、弹层直接复用；本机文件及 PDF 预览使用 Web 适配，原因是浏览器 File / Blob / iframe 并非通用跨端能力。具体兼容实测和未覆盖范围见 `docs/initialization.md`。

独立仓库：<https://github.com/RuntimeAll/knowledge-library-web>。项目业务 PRD 和验收正本继续留在现有工作空间；本仓库只维护本应用源码、运行说明和测试。
