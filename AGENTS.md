# uni-app 用户端维护

使用`uniapp-development`（本机`~/.codex/skills/uniapp-development/SKILL.md`）及frontend-development。本机Skill未随应用仓库分发，其他设备可先按docs/development.md执行相同分层与验证流程，再安装Skill。需求与验收正本在父工作空间PRD-100；本仓库只维护应用代码、运行说明及测试。

- 当前目标：H5、微信小程序、标准App Vue。共享页面不得直接使用DOM或浏览器对象；平台文件能力归adapters/platform，H5专有组件单独隔离。
- 页面只组合组件，core无Vue/uni/DOM，ui不含业务API；fixtures是示例，不能冒称线上业务。不要由页面调度Worker或判定正式资格。
- 新页面登记pages.json、路由与组件映射；主tab通过switchTab跳转。保留单页配置、名称前置和答案可选。
- 触及共享代码须执行lint、type-check、core测试、build:h5、build:mp-weixin、build:app；Web交互另测。编译不等于目标真机验收。
- 调整已确认基线先在对应PRD登记影响，保留Git历史和证据；不要触碰相邻后端/管理端配置与正式数据。
