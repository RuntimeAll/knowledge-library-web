<script setup lang="ts">
import { computed } from "vue";
import {
  modeLabels,
  totalQuestions,
  sourceCount,
  recipeSize,
  practiceCopyCount,
  type DraftSpec,
} from "../../core/skeleton";
const props = defineProps<{ spec: DraftSpec }>();
const context = computed(() =>
  [
    props.spec.subject,
    props.spec.textbook,
    props.spec.chapter,
    ...(props.spec.points || []),
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>
<template>
  <view class="summary-card kb-card">
    <view class="summary-row"
      ><text>制作方式</text><text>{{ modeLabels[spec.mode] }}</text></view
    >
    <view class="summary-row"
      ><text>制作要求</text
      ><text class="requirements">{{
        spec.goal || "未填写补充要求"
      }}</text></view
    >
    <view class="summary-row"
      ><text>教材与考点</text><text>{{ context || "未选择" }}</text></view
    >
    <view v-if="spec.mode === 'variant'" class="summary-row"
      ><text>题目组合</text
      ><text>
        每组原题 {{ spec.originalCount }} / 变式 {{ spec.variantCount }} / 提升
        {{ spec.extensionCount }}；
        {{
          sourceCount(spec) === null
            ? "附件内容待识别，总题量待生成"
            : `${sourceCount(spec)} 道母题 × 每题 ${recipeSize(spec)} 道，共 ${totalQuestions(spec)} 道`
        }}
      </text></view
    >
    <view v-else-if="spec.mode === 'practice'" class="summary-row"
      ><text>专项份数与题量</text
      ><text
        >{{ practiceCopyCount(spec) }} 份 × 每份 {{ spec.count }} 道，共
        {{ totalQuestions(spec) }} 道；各份使用相同要求</text
      ></view
    >
    <view v-if="spec.mode !== 'intake'" class="summary-row"
      ><text>难度</text><text>{{ spec.difficulty }}</text></view
    >
    <view v-if="spec.mode !== 'intake'" class="summary-row"
      ><text>排版经验</text
      ><text>{{ spec.template }} · {{ spec.templateVersion }}</text></view
    >
    <view v-if="spec.mode !== 'intake'" class="summary-row"
      ><text>答案</text
      ><text>{{
        spec.includeAnswers ? "独立答案 · 红色" : "只要学生版"
      }}</text></view
    >
    <view class="summary-row"
      ><text>参考资料</text
      ><text
        >{{ spec.attachments.length }} 份附件 ·
        {{ spec.referenceIds.length }} 道题库母题</text
      ></view
    >
    <view v-if="spec.attachments.length && spec.range" class="summary-row"
      ><text>处理范围</text><text>{{ spec.range }}</text></view
    >
  </view>
</template>
<style scoped>
.summary-row {
  display: flex;
  padding: 11px 0;
  font-size: 12px;
  line-height: 1.8;
  border-bottom: 1px solid #f2f1f7;
}
.summary-row:last-child {
  border: 0;
}
.summary-row > text:first-child {
  width: 86px;
  flex-shrink: 0;
  color: #8c8da1;
}
.summary-row > text:last-child {
  flex: 1;
  min-width: 0;
  color: #555a73;
  overflow-wrap: anywhere;
}
.requirements {
  white-space: pre-wrap;
}
</style>
