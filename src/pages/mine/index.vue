<script setup lang="ts">
import KbPage from "../../components/ui/KbPage.vue";
import KbSection from "../../components/ui/KbSection.vue";
import { go } from "../../adapters/platform/navigation";
const entries = [
  {
    icon: "file-text",
    title: "排版经验",
    desc: "找到适合这份资料的版式",
    path: "/pages/templates/index",
  },
  {
    icon: "grid",
    title: "教学工具",
    desc: "教学上下文、科学素材与课时小账",
    path: "/pages/tools/index",
  },
  {
    icon: "share",
    title: "协同发布",
    desc: "查看发布准备与现有发布台入口",
    path: "/pages/publication/index",
  },
  {
    icon: "setting",
    title: "偏好设置",
    desc: "学科与答案显示",
    path: "/pages/settings/index",
  },
];
</script>
<template>
  <KbPage title="我的" eyebrow="让每一次准备，都有积累"
    ><view class="profile"
      ><view class="avatar"
        ><up-icon name="account" size="32" color="#8e82d0" /></view
      ><view
        ><text class="profile-title">老师，欢迎回来</text
        ><text class="profile-caption">个人空间 · 页面预览</text></view
      ><view class="profile-flower">✦</view></view
    ><view class="stats" @click="go('/pages/records/index')"
      ><view><text class="stat-number">—</text><text>我的资料</text></view
      ><view><text class="stat-number">—</text><text>制作记录</text></view
      ><view><text class="stat-number">—</text><text>待处理</text></view></view
    ><KbSection title="备课小助手"
      ><view class="kb-card menu"
        ><view
          v-for="entry in entries"
          :key="entry.title"
          class="menu-row"
          @click="go(entry.path)"
          ><view class="menu-icon"
            ><up-icon :name="entry.icon" color="#9a91c4" size="22" /></view
          ><view class="menu-copy"
            ><text>{{ entry.title }}</text
            ><text class="menu-desc">{{ entry.desc }}</text></view
          ><up-icon
            name="arrow-right"
            color="#c5c4d5"
            size="12" /></view></view></KbSection
    ><text class="footnote"
      >把时间留给教学，把资料慢慢积累。<text
        >账号与正式数据将在接入后显示</text
      ></text
    ></KbPage
  >
</template>
<style scoped>
.profile {
  display: flex;
  align-items: center;
  background: linear-gradient(120deg, #eeebff, #f7f2fc);
  padding: 26px 20px;
  border-radius: 24px;
}
.avatar {
  background: #fff9;
  border: 3px solid #fff9;
  padding: 14px;
  border-radius: 22px;
  margin-right: 14px;
}
.profile-title {
  display: block;
  font-size: 18px;
  color: #5b547a;
  font-weight: 600;
}
.profile-caption {
  display: block;
  font-size: 11px;
  color: #a29ab9;
  margin-top: 8px;
}
.profile-flower {
  margin-left: auto;
  color: #d4ccec;
  font-size: 36px;
}
.stats {
  display: flex;
  justify-content: space-around;
  padding: 28px 0 8px;
}
.stats > view {
  text-align: center;
  font-size: 11px;
  color: #9b9eb1;
}
.stat-number {
  display: block;
  font-size: 23px;
  color: #6c6783;
  margin-bottom: 8px;
}
.menu {
  padding: 4px 18px;
}
.menu-row {
  display: flex;
  align-items: center;
  padding: 22px 0;
  border-bottom: 1px solid #f4f4f9;
}
.menu-row:last-child {
  border: 0;
}
.menu-icon {
  background: #f5f3ff;
  padding: 12px;
  border-radius: 14px;
  margin-right: 14px;
}
.menu-copy {
  flex: 1;
  font-size: 14px;
  color: #62657b;
}
.menu-desc {
  display: block;
  font-size: 10px;
  color: #a7aabc;
  margin-top: 7px;
  line-height: 1.7;
}
.footnote {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #a8aabb;
  line-height: 2;
  margin: 32px 0;
}
.footnote text {
  display: block;
  font-size: 10px;
  color: #bfc1cd;
}
</style>
