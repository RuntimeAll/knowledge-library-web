<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import { useClientTasksStore } from "../../stores/client-tasks";
import {
  clientModeLabels,
  clientStatusLabels,
  type ClientMode,
} from "../../core/client-task";
import { go } from "../../adapters/platform/navigation";
const client = useClientTasksStore(),
  error = ref("");
const modes = [
  {
    mode: "PRACTICE" as ClientMode,
    icon: "file-text",
    caption: "同样的要求，练习由浅入深",
  },
  {
    mode: "VARIANT" as ClientMode,
    icon: "plus-circle",
    caption: "围绕母题，逐组拓展",
  },
  {
    mode: "INTAKE" as ClientMode,
    icon: "folder",
    caption: "整理原件，保存题目",
  },
  {
    mode: "ERROR_COLLECTION" as ClientMode,
    icon: "edit-pen",
    caption: "从批改资料收集完整错题",
  },
];
onShow(async () => {
  if (!client.authenticated) return;
  try {
    error.value = "";
    await client.loadPage(1);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "记录暂时无法读取";
  }
});
function start(mode: ClientMode) {
  if (!client.pending) client.setMode(mode);
  go("/pages/configure/index");
}
</script>
<template>
  <KbPage title="任务工作台" eyebrow="我的教学资料空间"
    ><template #action
      ><button class="avatar" @click="go('/pages/mine/index')">
        我
      </button></template
    >
    <view class="greeting"
      ><text class="hero">今天，想做一份<text>什么资料？</text></text
      ><text class="client-hint"
        >说说要求，上传参考资料，剩下的交给制作端。</text
      ></view
    >
    <view v-if="client.pending" class="client-card"
      ><text class="client-title">有一次提交结果待核对</text
      ><text class="client-hint">保留了原始要求，继续查回可避免重复创建。</text
      ><button class="client-action" @click="go('/pages/configure/index')">
        继续核对
      </button></view
    >
    <view class="client-card"
      ><text class="client-label first">想制作什么？</text
      ><textarea
        v-model="client.draft.requirements"
        class="client-textarea"
        maxlength="4000"
        placeholder="例如：制作有理数基础练习，每次 10 题，共 20 次，由易到难，留足书写空间……"
        :disabled="!!client.pending"
      /><view class="mode-grid"
        ><button
          v-for="item in modes"
          :key="item.mode"
          class="mode-card"
          @click="start(item.mode)"
        >
          <up-icon :name="item.icon" size="25" color="#8570c5" /><text
            class="mode-title"
            >{{ clientModeLabels[item.mode] }}</text
          ><text class="mode-caption">{{ item.caption }}</text>
        </button></view
      ></view
    >
    <KbSection
      title="最近任务"
      action="全部记录"
      @action="go('/pages/records/index')"
      ><text v-if="error" class="client-error">{{ error }}</text
      ><view
        v-for="task in client.rows.slice(0, 3)"
        :key="task.id"
        class="client-card"
        @click="go(`/pages/record-detail/index?id=${task.id}`)"
        ><view class="client-row"
          ><text class="client-title">{{ task.displayTitle }}</text
          ><text class="client-status">{{
            clientStatusLabels[task.status] || task.status
          }}</text></view
        ><text class="client-hint"
          >{{ clientModeLabels[task.mode] }} · 第 {{ task.revision }} 版</text
        ></view
      ><view
        v-if="!client.loading && !error && !client.rows.length"
        class="client-empty"
        >从这一次制作开始。提交后，记录和结果会出现在这里</view
      ></KbSection
    >
  </KbPage>
</template>
<style scoped>
.avatar {
  width: 42px;
  height: 42px;
  line-height: 36px;
  padding: 0;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #eeeaff;
  color: #8b7cd6;
  font-size: 14px;
  margin: 0;
}
.avatar::after {
  border: 0;
}
.greeting {
  margin: 6px 4px 24px;
}
.hero {
  display: block;
  font-size: 27px;
  font-weight: 700;
  line-height: 1.6;
  color: #34364f;
}
.hero text {
  display: block;
  color: #7764d6;
}
.first {
  margin-top: 0;
}
.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}
.mode-card {
  padding: 18px 12px;
  text-align: left;
  background: #f7f5fc;
  border-radius: 14px;
  margin: 0;
  line-height: 1.6;
}
.mode-card::after {
  border: 0;
}
.mode-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #7460a7;
  margin-top: 10px;
}
.mode-caption {
  display: block;
  font-size: 10px;
  color: #a59bb4;
  margin-top: 4px;
  line-height: 1.8;
}
</style>
