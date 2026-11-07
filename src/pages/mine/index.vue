<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import { go, notify } from "../../adapters/platform/navigation";
const client = useClientTasksStore();
function logout() {
  client.logout();
  uni.reLaunch({ url: "/pages/login/index" });
}
function restore() {
  client.restoreDraft();
  notify("本机草稿已恢复");
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="我的" eyebrow="让每一次准备，都有积累"
    ><view class="profile client-card"
      ><view class="avatar"
        ><up-icon name="account" size="30" color="#8e82d0" /></view
      ><view
        ><text class="client-title">{{
          client.identity?.displayName || "未登录"
        }}</text
        ><text class="client-hint">{{ client.identity?.username }}</text></view
      ></view
    ><view class="client-card"
      ><view class="menu-row" @click="go('/pages/records/index')"
        ><text>我的制作任务</text
        ><up-icon name="arrow-right" size="12" color="#aaa" /></view
      ><view class="menu-row" @click="go('/pages/templates/index')"
        ><text>适用排版模板</text
        ><up-icon name="arrow-right" size="12" color="#aaa" /></view
      ><view class="menu-row" @click="restore"
        ><text>恢复本机草稿</text
        ><up-icon name="arrow-right" size="12" color="#aaa" /></view></view
    ><KbButton label="退出登录" secondary @click="logout" /><text
      class="client-hint note"
      >已发布任务会继续处理，下次登录可在记录中查看。</text
    ></KbPage
  >
</template>
<style scoped>
.profile {
  display: flex;
  gap: 16px;
  align-items: center;
  background: linear-gradient(120deg, #eeebff, #f7f2fc);
  padding: 28px 20px;
}
.avatar {
  padding: 15px;
  border-radius: 18px;
  background: #fff9;
}
.menu-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 21px 0;
  border-bottom: 1px solid #f3eff7;
  font-size: 14px;
  color: #777085;
}
.menu-row:last-child {
  border: 0;
}
.note {
  text-align: center;
  margin-top: 22px;
}
</style>
