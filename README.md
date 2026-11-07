# 知识库手机任务工作台

手机优先的uni-app Vue3 + TypeScript + Pinia + uview-plus应用，Web优先交付，标准App和微信小程序共享业务模型并保持编译兼容。当前主用户入口接真实账号、任务提交、服务端任务记录、异步进度和成品文件；手机不展示题库管理或题目审批。

四种任务为专项练习、举一反三、题目录入和错题收集，各自保留配置。专项默认每次10题、20次练习，制作成同一份资料，通常提供学生版和教师版两个整册文件；教师版答案默认红色。任务数据库、执行端领取/回传和知识库归档由真实后端负责，任务入队不代表生成完成。

## 启动与验证

```sh
npm ci
npm run dev
# 或预览构建产物（必须是uni-app的H5目录）
npm run build:h5
VITE_API_PROXY_TARGET=http://127.0.0.1:18084 npm run preview:h5
```

运行端口默认5193，启动前检查占用；隔离预览可用`npm run preview:h5 -- --port 5195`。开发默认监听回环，preview监听局域网；可访问地址以当次网卡和真实GET结果为准。手机和Mac在同一网络，或使用已授权的USB端口转发。

登录页填写真实知识库账号，验证码按后端返回显示。H5同源`/api`由Vite代理转发，App/小程序需另外配置设备可达的VITE_API_BASE_URL。环境配置不包含密码、数据库地址或执行凭据。完整用法、边界和测试见[真实任务入口](docs/real-tasks.md)。

```sh
npm run lint
npm run type-check
npm test
npm run build:all
npm run test:architecture
npm run test:client-ui
```

构建目录：`dist/build/h5`、`dist/build/mp-weixin`、`dist/build/app`。App资源构建不是APK；安卓打包见[安卓测试包](docs/android-testing.md)。App的PDF文件选择目前明确未接原生能力，图片可用；目标真机能力与运行结果独立验收。

## 维护

新主线使用`core/client-task.ts`、`stores/client-tasks.ts`及`adapters/client`；各模式业务配置组件位于`components/business/client`。领域不依赖Vue/平台对象，平台文件能力各自适配。模板从服务端按任务/练习类型读取已发布适用版本，旧未分类模板不自动放入新筛选。

原Mock业务适配器及单测作为兼容工具保留，主页面没有模拟接收/完成/批准按钮。旧Mock页面自动化脚本不代表当前真实主线验收。页面与持续开发边界见[开发说明](docs/development.md)和[AGENTS](AGENTS.md)；PRD和用户验收正本保留在父知识库工作空间。

源码仓库：[RuntimeAll/knowledge-library-web](https://github.com/RuntimeAll/knowledge-library-web)。
