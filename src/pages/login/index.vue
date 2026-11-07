<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbButton from "../../components/ui/KbButton.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { requestEnvelope, unwrap } from "../../adapters/client/http";
import { go } from "../../adapters/platform/navigation";
const client = useClientTasksStore();
const username = ref(""),
  password = ref(""),
  code = ref(""),
  uuid = ref("");
const captchaEnabled = ref(false),
  captchaImage = ref(""),
  busy = ref(false),
  error = ref("");
async function captcha() {
  try {
    const body = await requestEnvelope<never>(
      "/captchaImage",
      "GET",
      undefined,
      false,
    );
    unwrap(body);
    const data = body as typeof body & {
      captchaEnabled?: boolean;
      img?: string;
      uuid?: string;
    };
    captchaEnabled.value = data.captchaEnabled !== false;
    uuid.value = data.uuid || "";
    captchaImage.value = data.img ? `data:image/gif;base64,${data.img}` : "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : "登录服务暂时无法连接";
  }
}
onShow(async () => {
  client.restoreSession();
  if (client.authenticated) {
    try {
      await client.verifySession();
      go("/pages/index/index");
      return;
    } catch {
      client.logout();
    }
  }
  await captcha();
});
async function login() {
  if (busy.value) return;
  if (!username.value.trim() || !password.value) {
    error.value = "请输入账号和密码";
    return;
  }
  if (captchaEnabled.value && !code.value.trim()) {
    error.value = "请输入验证码";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await client.login(
      username.value.trim(),
      password.value,
      code.value.trim(),
      uuid.value,
    );
    password.value = "";
    go("/pages/index/index");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "登录未完成";
    code.value = "";
    await captcha();
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <view class="login-page">
    <view class="brand"
      ><view class="brand-icon"
        ><up-icon name="file-text" size="34" color="#8170c3" /></view
      ><text class="eyebrow">我的教学资料空间</text
      ><text class="welcome">欢迎回来</text
      ><text class="client-hint">发布制作任务，随时回来查看结果。</text></view
    >
    <view class="client-card">
      <text class="client-label">账号</text
      ><input
        v-model="username"
        class="client-input"
        placeholder="请输入知识库账号"
        :disabled="busy"
        autocomplete="username"
      />
      <text class="client-label">密码</text
      ><input
        v-model="password"
        class="client-input"
        password
        placeholder="请输入密码"
        :disabled="busy"
        autocomplete="current-password"
        @confirm="login"
      />
      <view v-if="captchaEnabled"
        ><text class="client-label">验证码</text
        ><view class="client-row"
          ><input
            v-model="code"
            class="client-input captcha-input"
            placeholder="图中验证码"
            :disabled="busy" /><image
            v-if="captchaImage"
            :src="captchaImage"
            class="captcha-image"
            mode="aspectFit"
            @click="captcha" /></view
      ></view>
      <text v-if="error" class="client-error">{{ error }}</text>
      <view class="login-action"
        ><KbButton label="登录" :loading="busy" @click="login"
      /></view>
      <text class="client-hint"
        >使用现有知识库账号，提交后可离开页面，稍后查看任务进度。</text
      >
    </view>
  </view>
</template>
<style scoped>
.login-page {
  min-height: 100vh;
  padding: 64px 24px 32px;
  box-sizing: border-box;
  max-width: 760px;
  margin: auto;
  background: linear-gradient(160deg, #eee9fc, #f7f8fc 52%, #f0f6f5);
}
.brand {
  padding: 12px 12px 28px;
}
.brand-icon {
  display: inline-flex;
  padding: 18px;
  background: #fffc;
  border-radius: 22px;
  margin-bottom: 24px;
}
.eyebrow {
  display: block;
  font-size: 12px;
  color: #9388a8;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.welcome {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #35364e;
}
.client-card {
  padding: 24px;
}
.client-label:first-child {
  margin-top: 0;
}
.login-action {
  margin-top: 24px;
}
.captcha-input {
  flex: 1;
  min-width: 0;
}
.captcha-image {
  width: 112px;
  height: 44px;
}
</style>
