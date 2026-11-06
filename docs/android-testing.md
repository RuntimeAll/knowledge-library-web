# 安卓测试包

本页是当前单 admin 模拟应用的测试包准备入口。资源编译、APK 打包、手机安装与用户验收分别记录。源码仍使用锁定的 DCloud 5.34 编译链，不切换到 uni-app x 或其他 WebView 壳。

## 测试身份与本机准备

`config/android-test.json` 只保存非凭据配置：应用名「知识库测试版」，Android 包名 `com.runtimeall.knowledgelibrary.preview`，版本 `0.1.0` / `1`，CPU 类型 `arm64-v8a` 和 `armeabi-v7a`。测试身份与后续正式包分开。DCloud AppID 需要本人登录 DCloud 后申请或选择有权限的应用，不能使用文档占位值。

HBuilderX 安装和插件状态以本轮工作空间 PRD 证据为准。仅安装 HBuilderX 不表示已登录、已取得 AppID、已生成 APK 或已通过真机。登录密码、短信验证码由本人在官方界面输入，不传给脚本。测试签名及密码保留在本机受限、忽略 Git 的位置，不能写入这个配置文件、源码 manifest、命令行说明或 PR。

## 准备隔离资源

在 `web-client` 执行：

```bash
node tools/prepare-android-test.mjs --dry-run
node tools/prepare-android-test.mjs --appid "$DCLOUD_TEST_APPID"
```

`DCLOUD_TEST_APPID` 仅指真实、非敏感的 DCloud 应用 ID。未提供 AppID 时，普通执行会停止；`--dry-run` 只检查版本、输入文件和准备路径，不创建工程或冒称编译完成。脚本不申请账号、不上传资源、不提交云打包，不接收签名密码。

实际执行在父工程 `.runtime/work/android-test/<时间>/project` 复制必要源码、连接原工程 `node_modules`、写入测试身份并本地编译。不会修改源 `src/manifest.json`，不会复制 `.env*`、Git 历史、后端或私人配置；外部 `VITE_*` / `UNI_*` 环境变量也不会带入测试构建。输出清单为同批 `preparation.json`，其中 `appResources` 指向 `project/dist/build/app`。该目录是待原生打包的 App 资源，不是 APK。

可用 `--output` 指定 `.runtime/work/android-test` 下尚不存在的新目录；已有目录会拒绝覆盖。已产生的失败目录与清单保留用于排查，修正后重新生成独立批次。

测试配置关闭 OAID 和启动时读取电话/存储权限申请，不主动增加权限声明或原生模块。图片选择仍可能在调用系统能力时请求权限；最终 APK 的 SDK 合并权限须在打包后核对。CPU、权限和包名字段依据 [DCloud Android manifest 规范](https://uniapp.dcloud.net.cn/collocation/manifest-app.html)。

## HBuilderX 打包与取回

本人登录 DCloud、获得真实 AppID 后，先运行上面的资源准备命令，再在 HBuilderX 打开清单里的完整 `stagingProject` 工程根目录，确认应用名、AppID、版本及 Android 包名均为本次测试配置。标准 uni-app 的 CLI 打包从完整工程根自动编译，`appResources` 仅是本地编译产物，不能代替工程入口。使用 HBuilderX 的 Android App 打包入口与当前官方文档操作；账号登录和签名选择完成后才可以提交。[官方 CLI 打包](https://hx.dcloud.net.cn/cli/pack)。

优先使用免费额度与安心打包，避免上传源码和签名；免费额度不足时停止，不自动购买或切换付费。安心打包需要的模块配置请求与本地合包属于打包步骤，不能把本地 `uni build -p app` 的成功输出当作 APK 回执。[官方云打包](https://uniapp.dcloud.net.cn/dev/app/cloud-build.html) · [安心打包说明](https://uniapp.dcloud.net.cn/tutorial/build/SafePack.html)。

取得 APK 后保存实际文件、SHA-256、文件大小、应用包名、版本、签名摘要及打包回执；确认安装包身份后交付用户。手机安装可能要求允许来自当前文件来源的安装，由用户在系统界面确认。安装后至少验证冷启动、admin 演示登录、底部导航、输入与弹层、返回、图片选择、后台恢复、退出及再次启动。只记录实际完成的真机操作。

## 当前能力限制

这仍是本设备的 Mock：不含真实后端登录、题目入库、AI 制作、Worker 或对外发布。App 任意 PDF 文件选择和模拟结果文件取用尚未适配，界面会明确提示；打出 APK 不会自动补齐这些能力。H5 的浏览器文件下载回归不能替代 Android 文件权限与系统打开验证。

本轮安装/登录/打包/真机结果保留在父工作空间 PRD-100 的初始化卡，源仓库只维护可复现配置与步骤。当前已通过的 Web 回归、三端资源编译和用户待验收状态继续各自保留。
