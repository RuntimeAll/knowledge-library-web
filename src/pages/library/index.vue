<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbButton from "../../components/ui/KbButton.vue";
import { go } from "../../adapters/platform/navigation";
</script>
<template>
  <KbPage title="制作任务" backable
    ><view class="client-card"
      ><text class="client-title">上传资料，发布制作任务</text
      ><text class="client-hint"
        >手机端负责任务与成品，题库管理通过现有知识库后台维护。</text
      ><view class="client-buttons"
        ><view
          ><KbButton
            label="返回工作台"
            @click="go('/pages/index/index')" /></view></view></view
  ></KbPage>
</template>
