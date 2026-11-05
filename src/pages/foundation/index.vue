<script setup lang="ts">
import PreviewConfiguration from "../../components/business/PreviewConfiguration.vue";
import LocalFilePreview from "../../adapters/web/LocalFilePreview.vue";
import { apiBase, navigation } from "../../adapters/web/runtime";
</script>
<template>
  <view class="shell">
    <view class="topbar"
      ><view class="brand"><text class="mark">知</text><text>知识库</text></view
      ><text class="edition">WEB · 基础预览</text></view
    >
    <view class="hero">
      <view class="eyebrow"><text class="dot" /> 独立用户端 · 初始化</view>
      <text class="headline">教学资料，从这里开始。</text>
      <text class="intro"
        >先试试配置、文件与预览。你的输入会在返回时保留。</text
      >
      <view class="status"
        ><text class="pill">基础组件已接入</text
        ><text class="connection">{{
          apiBase ? "API 地址已配置 · 尚未联调" : "本机预览 · 尚未连接业务服务"
        }}</text></view
      >
    </view>
    <view class="grid">
      <view class="card"
        ><view class="card-heading"
          ><text class="number">01</text
          ><view
            ><text class="card-title">配置预览</text
            ><text class="card-caption">输入、开关与弹层</text></view
          ></view
        ><PreviewConfiguration
      /></view>
      <view class="card"
        ><view class="card-heading"
          ><text class="number">02</text
          ><view
            ><text class="card-title">文件与 PDF</text
            ><text class="card-caption">本机选择，即时查看</text></view
          ></view
        ><LocalFilePreview
      /></view>
    </view>
    <view class="footer"
      ><text>PRD-100-01-01 · 初始化预览</text
      ><button class="about-link" @click="navigation.about">
        预览说明与返回验证 →
      </button></view
    >
  </view>
</template>
<style scoped>
.shell {
  max-width: 1120px;
  padding: 0 40px 36px;
  margin: auto;
}
.topbar {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--kb-line);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
}
.mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: white;
  background: var(--kb-brand);
  border-radius: 11px;
  font-size: 19px;
}
.edition {
  color: var(--kb-muted);
  letter-spacing: 2px;
  font-size: 10px;
}
.hero {
  padding: 52px 0 34px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--kb-brand);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--kb-brand);
}
.headline {
  display: block;
  margin: 16px 0;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.4;
}
.intro {
  color: var(--kb-muted);
  font-size: 14px;
  line-height: 1.8;
}
.status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.pill {
  padding: 6px 10px;
  border: 1px solid #cce4dc;
  color: #287657;
  background: #edf7f1;
  border-radius: 6px;
  font-size: 11px;
}
.connection {
  color: var(--kb-muted);
  font-size: 11px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.card {
  background: white;
  border: 1px solid var(--kb-line);
  border-radius: var(--kb-radius);
  padding: 28px;
  min-width: 0;
}
.card-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.number {
  font-size: 13px;
  color: var(--kb-brand);
  background: #edf4f3;
  padding: 10px;
  border-radius: 10px;
}
.card-title {
  display: block;
  font-weight: 650;
  font-size: 18px;
}
.card-caption {
  display: block;
  margin-top: 6px;
  color: var(--kb-muted);
  font-size: 12px;
}
.footer {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #7a8990;
  font-size: 11px;
}
.about-link {
  background: none;
  padding: 0;
  border: 0;
  margin: 0;
  color: var(--kb-brand);
  font-size: 12px;
  line-height: 2;
}
.about-link::after {
  border: 0;
}
@media (max-width: 700px) {
  .shell {
    padding: 0 20px 28px;
  }
  .topbar {
    height: 72px;
  }
  .hero {
    padding: 34px 0 28px;
  }
  .headline {
    font-size: 28px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .card {
    padding: 24px;
  }
  .footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .edition {
    letter-spacing: 1px;
  }
}
</style>
