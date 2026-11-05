<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbButton from "../../components/ui/KbButton.vue";
import { useWorkflowStore } from "../../stores/workflow";
import { go } from "../../adapters/platform/navigation";
const workflow = useWorkflowStore();
const busy = ref(false);
const error = ref("");
onShow(() => {
  if (workflow.session && workflow.session.expiresAt > Date.now())
    go("/pages/index/index");
});
function login() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    workflow.login("admin");
    go("/pages/index/index");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "暂时无法进入，请重试";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <view class="login-page"
    ><view class="login-brand"
      ><view class="login-mark"
        ><up-icon name="file-text" color="#7963c9" size="34" /></view
      ><text class="login-eyebrow">我的教学资料空间</text
      ><text class="login-title">欢迎回来</text
      ><text class="login-subtitle">让每次备课，都能从积累中出发。</text></view
    ><view class="login-card"
      ><text class="account-label">当前演示账号</text
      ><view class="account"
        ><view class="account-avatar">A</view
        ><view
          ><text class="account-name">admin</text
          ><text class="account-role">管理员 · 模拟会话</text></view
        ><view class="account-check"
          ><up-icon
            name="checkmark-circle-fill"
            color="#8875d2"
            size="21" /></view></view
      ><KbButton
        label="以 admin 进入演示"
        :loading="busy"
        @click="login"
      /><text v-if="error" class="login-error">{{ error }}</text
      ><text class="login-note"
        >当前只有一个演示账号，不需要输入真实密码。<text
          >本轮操作保存在模拟空间，不会写入正式资料库。</text
        ></text
      ></view
    ><text class="login-footer">真实账号登录将在后端联调时接入</text></view
  >
</template>
<style scoped>
.login-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 72px 24px 32px;
  background: linear-gradient(160deg, #f0ecfc, #f7f8fc 48%, #f1f6f5);
  max-width: 760px;
  margin: 0 auto;
}
.login-brand {
  padding: 12px 12px 32px;
}
.login-mark {
  display: inline-flex;
  padding: 18px;
  background: #fffc;
  border: 1px solid #fff;
  border-radius: 22px;
  margin-bottom: 24px;
}
.login-eyebrow {
  display: block;
  color: #8b82a4;
  font-size: 13px;
  letter-spacing: 1px;
  margin-bottom: 14px;
}
.login-title {
  display: block;
  color: #34364f;
  font-size: 32px;
  font-weight: 700;
}
.login-subtitle {
  display: block;
  color: #84889e;
  font-size: 13px;
  line-height: 1.8;
  margin-top: 14px;
}
.login-card {
  background: white;
  border: 1px solid #eeeaf6;
  border-radius: 24px;
  padding: 24px;
}
.account-label {
  font-size: 12px;
  color: #88849d;
}
.account {
  display: flex;
  align-items: center;
  padding: 24px 0 28px;
}
.account-avatar {
  width: 46px;
  height: 46px;
  line-height: 46px;
  text-align: center;
  border-radius: 15px;
  background: #efebfc;
  color: #8a74cc;
  margin-right: 14px;
  font-weight: 600;
}
.account-name {
  display: block;
  color: #4e4d66;
  font-size: 18px;
  font-weight: 600;
}
.account-role {
  display: block;
  font-size: 11px;
  color: #9d96af;
  margin-top: 7px;
}
.account-check {
  margin-left: auto;
}
.login-note {
  display: block;
  color: #9390a5;
  font-size: 11px;
  line-height: 1.9;
  margin-top: 20px;
}
.login-note text {
  display: block;
}
.login-footer {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #a6a1b5;
  margin-top: 28px;
}
.login-error {
  display: block;
  color: #b3515c;
  font-size: 12px;
  margin-top: 14px;
}
</style>
