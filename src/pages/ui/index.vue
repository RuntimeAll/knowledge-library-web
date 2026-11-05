<script setup lang="ts">
import { ref } from "vue";
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import KbChips from "../../components/ui/KbChips.vue";
import KbButton from "../../components/ui/KbButton.vue";
import KbState from "../../components/ui/KbState.vue";
import TaskCard from "../../components/business/TaskCard.vue";
import { sampleTasks } from "../../fixtures/skeleton";
import { notify } from "../../adapters/platform/navigation";
import type { DisplayState } from "../../core/skeleton";
const state = ref<DisplayState>("empty");
const modal = ref(false);
</script>
<template>
  <KbPage title="组件预览" subtitle="开发验收专用 · 示例数据" backable
    ><KbSection title="状态容器"
      ><KbChips
        v-model="state"
        :options="[
          { label: '默认', value: 'ready' },
          { label: '加载', value: 'loading' },
          { label: '空态', value: 'empty' },
          { label: '错误', value: 'error' },
        ]" /><view class="state-preview"
        ><view v-if="state === 'ready'" class="kb-card"
          >内容已就绪 · 默认状态</view
        ><KbState :state="state" @retry="state = 'ready'" /></view></KbSection
    ><KbSection title="按钮"
      ><view class="button-list"
        ><KbButton label="主要操作" @click="modal = true" /><KbButton
          label="次要操作"
          secondary
          @click="notify('次要操作反馈')" /><KbButton
          label="不可用操作"
          disabled /><KbButton label="正在处理" loading /></view></KbSection
    ><KbSection title="记录与长标题"
      ><TaskCard
        v-for="task in sampleTasks"
        :key="task.id"
        :task="task"
        @open="notify('记录卡点击反馈')" /></KbSection
    ><up-modal
      :show="modal"
      title="确认信息"
      content="弹层与按钮状态预览，不执行真实业务。"
      show-cancel-button
      @confirm="modal = false"
      @cancel="modal = false"
  /></KbPage>
</template>
<style scoped>
.state-preview {
  margin-top: 16px;
}
.button-list > view {
  margin-bottom: 12px;
}
</style>
